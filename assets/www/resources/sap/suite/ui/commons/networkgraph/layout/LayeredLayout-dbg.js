sap.ui.define([
	"jquery.sap.global",
	"sap/suite/ui/commons/library",
	"./LayoutAlgorithm",
	"./Geometry",
	"./KlayWrapper",
	"./LayoutTask"
], function (jQuery, library, LayoutAlgorithm, Geometry, KlayWrapper, LayoutTask) {
	// enums
	var Orientation = library.networkgraph.Orientation,
		NodePlacement = library.networkgraph.NodePlacement;

	var GLOBAL_MARGIN = 30, // Mainly for action buttons of nodes not to get cut
		GROUP_TITLE_LIFT = 34, // Enlarge group size upwards so that title is not overlaping highest nodes
		GROUP_BOX_MARGIN = 25, // How far is the group border
		GROUP_POST_SHRINKAGE = 17, // Bring group title down not to mess with above lines
		NODE_PORT_WHITESPACE = 4, // Size from top/bottom/left/right where no lines dwell, 4 behaves the same as if not set for top-bottom
		NODE_KEY_PREFIX = "N_",
		GROUP_KEY_PREFIX = "G_",
		KEY_PREFIX_LENGTH = 2;

	var mNodePlacementMap = (function () {
		var mMap = {};
		mMap[NodePlacement.BrandesKoepf] = "BRANDES_KOEPF";
		mMap[NodePlacement.LinearSegments] = "LINEAR_SEGMENTS";
		mMap[NodePlacement.Simple] = "SIMPLE";
		return Object.freeze(mMap);
	})();

	/**
	 * Constructor for a new LayeredLayout.
	 *
	 * @class
	 * This algorithm uses the klay.js algorithm to rearrange the graph in grid form. It's suitable for process flows and
	 * tree-like graphs. It can be used for almost any graph.
	 *
	 * @extends sap.suite.ui.commons.networkgraph.layout.LayoutAlgorithm
	 *
	 * @constructor
	 * @public
	 * @since 1.50
	 * @alias sap.suite.ui.commons.networkgraph.layout.LayeredLayout
	 */
	var LayeredLayout = LayoutAlgorithm.extend("sap.suite.ui.commons.networkgraph.layout.LayeredLayout", {
		metadata: {
			library: "sap.suite.ui.commons",
			properties: {
				/**
				 * Define a minimal distance on nodes the algorithm will try to keep.
				 * The default value is 55.
				 * Note that values below 50 are incompatible with presence of groups due to insufficient space for
				 * group title bars and space between nodes and their groups' borders.
				 */
				nodeSpacing: {
					type: "float", group: "Behavior", defaultValue: 55
				},
				lineSpacingFactor: {
					type: "float", group: "Behavior", defaultValue: 0.25
				},
				/**
				 * A node placement strategy to use (see {@link sap.suite.ui.commons.networkgraph.NodePlacement}).
				 */
				nodePlacement: {
					type: "sap.suite.ui.commons.networkgraph.NodePlacement",
					group: "Behavior",
					defaultValue: NodePlacement.BrandesKoepf
				},
				/**
				 * Determines if all lines should lead to the same place in the node, or if each line should point to a different place.
				 */
				mergeEdges: {
					type: "boolean", group: "Behavior", defaultValue: false
				}
			}
		}
	});

	/**
	 * Specifies if this layout algorithm distributes nodes into layers. Parent graph may change behaviour based
	 * on this option.
	 * @returns {boolean} Always true
	 * @public
	 */
	LayeredLayout.prototype.isLayered = function () {
		return true;
	};

	/**
	 * Executes the layout algorithm.
	 * @returns {sap.suite.ui.commons.networkgraph.layout.LayoutTask} Task to get the layout calculated.
	 * @public
	 */
	LayeredLayout.prototype.layout = function () {
		return new LayoutTask(function (fnResolve, fnReject, oLayoutTask) {
			var oGraph = this.getParent();
			if (!oGraph) {
				fnReject("The algorithm must be associated with a graph.");
				return;
			}
			this.oGraph = oGraph;
			this.oKGraph = {children: [], edges: []};
			this.mLineMap = {};

			jQuery.sap.measure.start("NetworkGraph - LayeredLayout", "Layouting of a graph " + oGraph.getId());

			oGraph.getGroups().forEach(this._addGroupToKlay, this);
			oGraph.getNodes().forEach(this._addNodeToKlay, this);
			oGraph.getLines().forEach(this._addLineToKlay, this);

			KlayWrapper.layout({
				graph: this.oKGraph,
				options: this._getOptions(),
				success: function (oKGraph) {
					if (oLayoutTask.isTerminated()) {
						fnResolve();
						return;
					}
					this._copyStuffWithoutPrefixes(oKGraph);

					oKGraph.children.forEach(function (oKItem) {
						this._extractNodeFromKlay(oKItem);
					}, this);

					oKGraph.edges.forEach(function (oKLine) {
						this._extractLineFromKlay(oKLine);
					}, this);

					this._makeExpandedGroupsBoxesAroundNodes();
					this._assertPositiveCoordinates();
					this._shrinkGroupsDownward();
					this._stretchLinesToCircleAxes();

					if ((!this.oGraph._bIsRtl && this.oGraph.getOrientation() === Orientation.RightLeft) ||
						(this.oGraph._bIsRtl && this.oGraph.getOrientation() !== Orientation.RightLeft)) {
						this._verticalMirror();
					}

					jQuery.sap.measure.end("NetworkGraph - LayeredLayout");

					fnResolve();
				}.bind(this),
				error: function (error) {
					fnReject(error);
				}
			});
		}.bind(this));
	};

	LayeredLayout.prototype._buildNodeForKlay = function (oNode) {
		var mProp = {};
		if (!oNode._isBox()) {
			if (this.oGraph.getOrientation() !== Orientation.TopBottom) {
				var iBottomPortSpace = oNode._iHeight - oNode._getCircleSize() + NODE_PORT_WHITESPACE;
				mProp = {additionalPortSpace: "top=" + NODE_PORT_WHITESPACE + ", bottom=" + iBottomPortSpace};
			} else {
				var iSidePortSpace = (oNode._iWidth - oNode._getCircleSize()) / 2 + NODE_PORT_WHITESPACE;
				mProp = {additionalPortSpace: "top=" + iSidePortSpace + ", bottom=" + iSidePortSpace};
			}
		}

		return {
			id: NODE_KEY_PREFIX + oNode.getKey(),
			width: oNode._iWidth,
			height: oNode._iHeight,
			properties: mProp
		};
	};

	LayeredLayout.prototype._addGroupToKlay = function (oGroup) {
		if (oGroup._isIgnored()) {
			return;
		}

		// Node for a group is added anyway
		var oKGroup = {
			id: GROUP_KEY_PREFIX + oGroup.getKey(),
			width: oGroup._iWidth,
			height: oGroup._iHeight
		};
		this.oKGraph.children.push(oKGroup);

		// For collapsed groups all their nodes are omitted and edges of its nodes are connected to the group node itself
		if (!oGroup.getCollapsed()) {
			oGroup.aNodes.forEach(function (oNode) {
				if (!oNode._isIgnored()) {
					if (!oKGroup.children) {
						oKGroup.children = [];
					}
					oKGroup.children.push(this._buildNodeForKlay(oNode));
				}
			}, this);
		}
	};

	LayeredLayout.prototype._addNodeToKlay = function (oNode) {
		// All nodes having a group are already added or omitted within that group's addition
		if (!oNode._oGroup && !oNode._isIgnored()) {
			this.oKGraph.children.push(this._buildNodeForKlay(oNode));
		}
	};

	LayeredLayout.prototype._addLineToKlay = function (oLine) {
		var sSource, sTarget, id;

		if (!oLine._isIgnored()) {
			sSource = oLine.getFromNode()._oGroup && oLine.getFromNode()._oGroup.getCollapsed()
				? GROUP_KEY_PREFIX + oLine.getFromNode()._oGroup.getKey()
				: NODE_KEY_PREFIX + oLine.getFrom();
			sTarget = oLine.getToNode()._oGroup && oLine.getToNode()._oGroup.getCollapsed()
				? GROUP_KEY_PREFIX + oLine.getToNode()._oGroup.getKey()
				: NODE_KEY_PREFIX + oLine.getTo();

			id = sSource + "->" + sTarget + "[" + this.oKGraph.edges.length + "]";
			this.oKGraph.edges.push({
				id: id,
				source: sSource,
				target: sTarget
			});
			this.mLineMap[id] = oLine;
		}
	};

	/**
	 * Regarding direction KLayJS offers only LEFT-RIGHT/TOP-DOWN option, we have to add RIGHT-LEFT by manual mirroring of coordinates ex-post.
	 * See _verticalMirror method.
	 * @returns {object} Options for KLayJS.
	 */
	LayeredLayout.prototype._getOptions = function () {
		var sOri = this.oGraph.getOrientation(),
			sDir;
		switch (sOri) {
			case Orientation.LeftRight:
			case Orientation.RightLeft:
				sDir = "RIGHT";
				break;
			case Orientation.TopBottom:
				sDir = "DOWN";
				break;
			default:
				sDir = "RIGHT";
		}
		return {
			direction: sDir,
			spacing: this.getNodeSpacing(),
			nodePlace: mNodePlacementMap[this.getNodePlacement()],
			edgeSpacingFactor: this.getLineSpacingFactor(),
			mergeEdges: this.getMergeEdges()
		};
	};

	LayeredLayout.prototype._verticalMirror = function () {
		// Get bounding box and its central vertical axis
		var aPoints =
				this._getNodesPoints(this.oGraph.getNodes())
					.concat(this._getNodesPoints(this.oGraph.getGroups()))
					.concat(this._getLinesPoints()),
			oBox = Geometry.getBoundingBox(aPoints),
			fAxisXm2 = (oBox.p1.x + oBox.p2.x);

		this.oGraph.getNodes().forEach(function (oNode) {
			oNode.setX(fAxisXm2 - (oNode.getX() + oNode._iWidth));
		});
		this.oGraph.getGroups().forEach(function (oGroup) {
			oGroup.setX(fAxisXm2 - (oGroup.getX() + oGroup._iWidth));
		});
		this.oGraph.getLines().forEach(function (oLine) {
			if (oLine._isIgnored()) {
				return;
			}
			oLine.setSource({
				x: fAxisXm2 - oLine.getSource().getX()
			});
			oLine.setTarget({
				x: fAxisXm2 - oLine.getTarget().getX()
			});
			oLine.getBends().forEach(function (oBend) {
				oBend.setX(fAxisXm2 - oBend.getX());
			});
		});
	};

	LayeredLayout.prototype._extractNodeFromKlay = function (oKItem) {
		var oItem = oKItem.id.substring(0, KEY_PREFIX_LENGTH) === NODE_KEY_PREFIX
				? this.oGraph.getNodeByKey(oKItem.originalId)
				: undefined,
			oNode;
		if (!oItem) {
			oItem = this.oGraph.mGroups[oKItem.originalId];

			// Expanded groups aggregate their nodes
			if (oItem && !oItem.getCollapsed() && oKItem.children) {
				oKItem.children.forEach(function (oKNode) {
					oNode = this.oGraph.getNodeByKey(oKNode.originalId);
					if (oNode) {
						oNode.setX(oKNode.x + oKItem.x);
						oNode.setY(oKNode.y + oKItem.y);
					}
				}, this);
			}
		}
		if (oItem) {
			oItem.setX(oKItem.x);
			oItem.setY(oKItem.y);
		}
	};

	LayeredLayout.prototype._extractLineFromKlay = function (oKLine) {
		var oLine = this.mLineMap[oKLine.id];
		oLine.setSource({
			x: oKLine.sourcePoint.x,
			y: oKLine.sourcePoint.y
		});
		oLine.setTarget({
			x: oKLine.targetPoint.x,
			y: oKLine.targetPoint.y
		});
		oLine.clearBends();
		if (oKLine.bendPoints) {
			oKLine.bendPoints.forEach(function (oKBend) {
				oLine.addBend(oKBend);
			});
		}

		// Shift lines originating inside expanded group
		if (oLine.getFromNode()._oGroup && !oLine.getFromNode()._oGroup.getCollapsed()) {
			oLine._shift({x: oLine.getFromNode()._oGroup.getX(), y: oLine.getFromNode()._oGroup.getY()});
		}
	};

	LayeredLayout.prototype._stretchLinesToCircleAxes = function () {
		var bHorizontal = this.oGraph.getOrientation() != Orientation.TopBottom,
			oFrom, oTo;
		this.oGraph.getLines().forEach(function (oLine) {
			if (oLine._isIgnored()) {
				return;
			}

			oFrom = oLine.getFromNode();
			oTo = oLine.getToNode();
			if (bHorizontal) {
				if (!oFrom._isBox() && !oFrom._isIgnored()) {
					oLine.getSource().setX(oFrom.getX() + oFrom._iWidth / 2);
				}
				if (!oTo._isBox() && !oTo._isIgnored()) {
					oLine.getTarget().setX(oTo.getX() + oTo._iWidth / 2);
				}
			} else {
				if (!oFrom._isBox() && !oFrom._isIgnored()) {
					oLine.getSource().setY(oFrom.getY() + oFrom._getCircleSize() / 2);
				}
				if (!oTo._isBox() && !oTo._isIgnored()) {
					oLine.getTarget().setY(oTo.getY() + oTo._getCircleSize() / 2);
				}
			}
		});
	};

	LayeredLayout.prototype._getNodesPoints = function (aElements) {
		var aPoints = [];
		aElements.forEach(function (oElement) {
			if (oElement._isIgnored && !oElement._isIgnored()) {
				aPoints.push({x: oElement.getX(), y: oElement.getY()});
				aPoints.push({x: oElement.getX() + oElement._iWidth, y: oElement.getY() + oElement._iHeight});
			}
		});
		return aPoints;
	};

	LayeredLayout.prototype._getLinesPoints = function () {
		var aPoints = [];
		this.oGraph.getLines().forEach(function (oLine) {
			if (oLine._isIgnored()) {
				return;
			}
			aPoints.push({x: oLine.getSource().getX(), y: oLine.getSource().getY()});
			aPoints.push({x: oLine.getTarget().getX(), y: oLine.getTarget().getY()});
			oLine.getBends().forEach(function (oBend) {
				aPoints.push({x: oBend.getX(), y: oBend.getY()});
			});
		});
		return aPoints;
	};

	LayeredLayout.prototype._makeExpandedGroupsBoxesAroundNodes = function () {
		var aPoints = [], oBox;
		this.oGraph.getGroups().forEach(function (oGroup) {
			if (oGroup.getCollapsed() || oGroup.aNodes.length === 0) {
				return;
			}

			aPoints = this._getNodesPoints(oGroup.aNodes);
			oBox = Geometry.getBoundingBox(aPoints);
			Geometry.enlargeBox(oBox, GROUP_BOX_MARGIN);
			oGroup.setX(oBox.p1.x);
			oGroup.setY(oBox.p1.y - GROUP_TITLE_LIFT);
			oGroup._iWidth = oBox.p2.x - oBox.p1.x;
			oGroup._iHeight = oBox.p2.y - oBox.p1.y + GROUP_TITLE_LIFT;
		}, this);
	};

	LayeredLayout.prototype._assertPositiveCoordinates = function () {
		var fXShift = GLOBAL_MARGIN,
			fYShift = GLOBAL_MARGIN;
		this.oGraph.getNodes().forEach(function (oNode) {
			if (oNode.getX() < fXShift) {
				fXShift = oNode.getX();
			}
			if (oNode.getY() < fYShift) {
				fYShift = oNode.getY();
			}
		});
		this.oGraph.getGroups().forEach(function (oGroup) {
			if (oGroup.getX() < fXShift) {
				fXShift = oGroup.getX();
			}
			if (oGroup.getY() < fYShift) {
				fYShift = oGroup.getY();
			}
		});

		if (fXShift < GLOBAL_MARGIN || fYShift < GLOBAL_MARGIN) {
			fXShift -= GLOBAL_MARGIN;
			fYShift -= GLOBAL_MARGIN;
			this.oGraph.getGroups().forEach(function (oGroup) {
				oGroup.setX(oGroup.getX() - fXShift);
				oGroup.setY(oGroup.getY() - fYShift);
			});
			this.oGraph.getNodes().forEach(function (oNode) {
				oNode.setX(oNode.getX() - fXShift);
				oNode.setY(oNode.getY() - fYShift);
				oNode.aLines.forEach(function (oLine) {
					oLine._shift({x: -fXShift, y: -fYShift});
				});
			});
		}
	};

	LayeredLayout.prototype._shrinkGroupsDownward = function () {
		// every node within a group is shifted downwards
		var fNodeShift;
		this.oGraph.getGroups().forEach(function (oGroup) {
			if (oGroup.getCollapsed()) {
				return;
			}

			oGroup.aNodes.forEach(function (oNode) {
				fNodeShift = (oGroup.getY() + oGroup._iHeight - oNode.getY()) / oGroup._iHeight;
				oNode.setY(oNode.getY() + fNodeShift);
			});
			oGroup.setY(oGroup.getY() + GROUP_POST_SHRINKAGE);
			oGroup._iHeight -= GROUP_POST_SHRINKAGE;
		});
	};

	LayeredLayout.prototype._copyStuffWithoutPrefixes = function (oKGraph) {
		oKGraph.children.forEach(function (oKItem) {
			oKItem.originalId = oKItem.id.substring(KEY_PREFIX_LENGTH);
			if (oKItem.children) {
				oKItem.children.forEach(function (oKChild) {
					oKChild.originalId = oKChild.id.substring(KEY_PREFIX_LENGTH);
				});
			}
		});

		oKGraph.edges.forEach(function (oKLine) {
			oKLine.originalSource = oKLine.source.substring(KEY_PREFIX_LENGTH);
			oKLine.originalTarget = oKLine.target.substring(KEY_PREFIX_LENGTH);
		});
	};

	return LayeredLayout;
});