sap.ui.define([
	"jquery.sap.global",
	"./LayoutAlgorithm",
	"./Geometry",
	"./D3ForceWrapper",
	"./LayoutTask"
], function (jQuery, LayoutAlgorithm, Geometry, D3ForceWrapper, LayoutTask) {

	var SCALE = 12;

	/**
	 * Constructor for a new ForceBasedLayout.
	 *
	 * @class
	 * This algorithm uses D3.force algorithm to layout the graph. It's good if the graph is too complicated and
	 * LayeredLayout is not sufficient.
	 *
	 * @extends sap.suite.ui.commons.networkgraph.layout.LayoutAlgorithm
	 *
	 * @constructor
	 * @public
	 * @since 1.50
	 * @alias sap.suite.ui.commons.networkgraph.layout.ForceBasedLayout
	 */
	var ForceBasedLayout = LayoutAlgorithm.extend("sap.suite.ui.commons.networkgraph.layout.ForceBasedLayout", {
		metadata: {
			properties: {
				/**
				 * See: {@link https://github.com/d3/d3-3.x-api-reference/blob/master/Force-Layout.md#alpha}
				 */
				alpha: {
					type: "float", group: "Behavior", defaultValue: 0.3
				},
				/**
				 * See: {@link https://github.com/d3/d3-3.x-api-reference/blob/master/Force-Layout.md#charge}
				 */
				charge: {
					type: "float", group: "Behavior", defaultValue: -30
				},
				/**
				 * Value in [0,1] range.
				 * See: {@link https://github.com/d3/d3-3.x-api-reference/blob/master/Force-Layout.md#friction}
				 */
				friction: {
					type: "float", group: "Behavior", defaultValue: 0.9
				},
				/**
				 * Specifies the maximal time in miliseconds the algorithm is allowed to run.
				 */
				maximumDuration: {
					type: "int", group: "Behaviour", defaultValue: 1000
				}
			}
		}
	});

	/**
	 * Implement in inheriting classes.
	 * @abstract
	 *
	 * Specifies if this layouting algorithm distributes nodes into layers. Parent graph may change behaviour based
	 * on this option.
	 *
	 * @name sap.suite.ui.commons.networkgraph.LayoutAlgorithm.prototype.isLayered
	 * @returns {boolean} Always false
	 * @function
	 * @public
	 */
	ForceBasedLayout.prototype.isLayered = function () {
		return false;
	};

	/**
	 * Implement in inheriting classes.
	 * @abstract
	 *
	 * Executes the layouting algorithm.
	 *
	 * @name sap.suite.ui.commons.networkgraph.LayoutAlgorithm.prototype.layout
	 * @returns {sap.suite.ui.commons.networkgraph.layout.LayoutTask} Task to get the layout calculated.
	 * @function
	 * @public
	 */
	ForceBasedLayout.prototype.layout = function () {
		return new LayoutTask(function (fnResolve, fnReject, oLayoutTask) {
			var graph = {nodes: [], links: []},
				oGraph = this.getParent();
			if (!oGraph) {
				fnReject("The algorithm must be associated with a graph.");
				return;
			}

			jQuery.sap.measure.start("NetworkGraph - ForcedBaseLayout", "Layouting of a graph " + oGraph.getId());

			oGraph.getNodes().forEach(function (oNode, iIndex) {
				graph.nodes.push({
					id: oNode.getKey()
				});
				oNode.iIndex = iIndex;
			});

			oGraph.getNodes().forEach(function (oNode) {
				oNode.aChildren.forEach(function (oChild) {
					graph.links.push({
						source: oNode.iIndex,
						target: oChild.iIndex,
						value: 1
					});
				});
			});

			D3ForceWrapper.layout({
				graph: graph,
				alpha: this.getAlpha(),
				friction: this.getFriction(),
				charge: this.getCharge(),
				maximumDuration: this.getMaximumDuration()
			}).then(function (oData) {
				if (oLayoutTask.isTerminated()) {
					fnResolve();
					return;
				}
				var graph = oData.graph || oData;

				var oBB = Geometry.getBoundingBox(graph.nodes),
					xShift = (oBB.p1.x) * -SCALE + 100,
					yShift = (oBB.p1.y) * -SCALE + 100;
				graph.nodes.forEach(function (oD3Node) {
					var oNode = oGraph.getNodeByKey(oD3Node.id);
					oNode.setX(oD3Node.x * SCALE + xShift);
					oNode.setY(oD3Node.y * SCALE + yShift);
				});

				this._normalizeLines();

				fnResolve();
			}.bind(this), fnReject);
		}.bind(this));
	};

	return ForceBasedLayout;
});