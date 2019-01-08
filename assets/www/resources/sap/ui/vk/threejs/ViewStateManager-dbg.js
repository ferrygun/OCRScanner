/*!
* SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
*/

// Provides the ViewStateManager class.
sap.ui.define([
	"jquery.sap.global", "sap/ui/core/Element", "../ContentConnector", "../ViewStateManagerBase"
], function(jQuery, Element, ContentConnector, ViewStateManagerBase) {
	"use strict";

	var VisibilityTracker;

	/**
	* Constructor for a new ViewStateManager.
	*
	* @class
	* Manages the visibility and selection states of nodes in the scene.
	*
	* @param {string} [sId] ID for the new ViewStateManager object. Generated automatically if no ID is given.
	* @param {object} [mSettings] Initial settings for the new ViewStateManager object.
	* @public
	* @author SAP SE
	* @version 1.52.8
	* @extends sap.ui.vk.ViewStateManagerBase
	* @alias sap.ui.vk.dvl.ViewStateManager
	* @experimental Since 1.32.0 This class is experimental and might be modified or removed in future versions.
	*/
	var ViewStateManager = ViewStateManagerBase.extend("sap.ui.vk.threejs.ViewStateManager", /** @lends sap.ui.vk.threejs.ViewStateManager.prototype */ {
		metadata: {
			publicMethods: [
				"enumerateSelection",
				"getNodeHierarchy",
				"getOpacity",
				"getSelectionState",
				"getTintColor",
				"getVisibilityChanges",
				"getVisibilityState",
				"setOpacity",
				"setSelectionState",
				"setTintColor",
				"setVisibilityState",
				"setShowSelectionBoundingBox",
				"getShowSelectionBoundingBox"
			]
		}
	});

	var basePrototype = ViewStateManager.getMetadata().getParent().getClass().prototype;

	ViewStateManager.prototype.init = function() {
		if (basePrototype.init) {
			basePrototype.init.call(this);
		}

		this._nodeHierarchy = null;
		this._nodeStates = new Map();
		this._selectedNodes = new Set(); // a collection of selected nodes for quick access,
		// usually there are not many selected objects,
		// so it is OK to store them in a collection.

		this._visibilityTracker = new VisibilityTracker();

		this._showSelectionBoundingBox = true;
		this._boundingBoxesScene = new THREE.Scene();

		this.setHighlightColor("rgba(255, 0, 0, 1.0)");
	};

	////////////////////////////////////////////////////////////////////////
	// Content connector handling begins.
	ViewStateManager.prototype._setContent = function(content) {
		var scene = null;
		if (content && content.scene instanceof sap.ui.vk.threejs.Scene) {
			scene = content.scene;
		}
		this._setScene(scene);
	};

	ViewStateManager.prototype._onAfterUpdateContentConnector = function() {
		this._setContent(this._contentConnector.getContent());
	};

	ViewStateManager.prototype._onBeforeClearContentConnector = function() {
		this._setScene(null);
	};

	// Content connector handling ends.
	////////////////////////////////////////////////////////////////////////

	////////////////////////////////////////////////////////////////////////
	// Node hierarchy handling begins.

	ViewStateManager.prototype._handleContentReplaced = function(event) {
		var content = event.getParameter("newContent");
		this._setContent(content);
	};

	ViewStateManager.prototype._setScene = function(scene) {
		this._boundingBoxesScene = new THREE.Scene();
		this._setNodeHierarchy(scene ? scene.getDefaultNodeHierarchy() : null);
		return this;
	};

	ViewStateManager.prototype._setNodeHierarchy = function(nodeHierarchy) {
		var oldNodeHierarchy = this._nodeHierarchy;

		if (this._nodeHierarchy) {
			this._nodeHierarchy = null;
			this._nodeStates.clear();
			this._selectedNodes.clear();
			this._visibilityTracker.clear();
		}

		if (nodeHierarchy) {
			this._nodeHierarchy = nodeHierarchy;

			var visible = [],
				hidden = [];

			var allNodeRefs = nodeHierarchy.findNodesByName();
			allNodeRefs.forEach(function(nodeRef) {
				(nodeRef.visible ? visible : hidden).push(nodeRef);
			});

			this.fireVisibilityChanged({
				visible: visible,
				hidden: hidden
			});
		}

		if (nodeHierarchy !== oldNodeHierarchy) {
			this.fireNodeHierarchyReplaced({
				oldNodeHierarchy: oldNodeHierarchy,
				newNodeHierarchy: nodeHierarchy
			});
		}

		return this;
	};


	// Node hierarchy handling ends.
	////////////////////////////////////////////////////////////////////////

	/**
	* Gets the NodeHierarchy object associated with this ViewStateManager object.
	* @returns {sap.ui.vk.NodeHierarchy} The node hierarchy associated with this ViewStateManager object.
	* @public
	*/
	ViewStateManager.prototype.getNodeHierarchy = function() {
		return this._nodeHierarchy;
	};

	/**
	* Gets the visibility changes in the current ViewStateManager object.
	* @returns {string[]} The visibility changes are in the form of an array. The array is a list of node VE ids which suffered a visibility changed relative to the default state.
	* @public
	*/
	ViewStateManager.prototype.getVisibilityChanges = function() {
		return this.getShouldTrackVisibilityChanges() ? this._visibilityTracker.getInfo(this.getNodeHierarchy()) : null;
	};

	ViewStateManager.prototype.getVisibilityComplete = function() {
		var nodeHierarchy = this.getNodeHierarchy(),
			allNodeRefs = nodeHierarchy.findNodesByName(),
			visible = [],
			hidden = [];

		allNodeRefs.forEach(function(nodeRef) {
			// create node proxy based on dynamic node reference
			var nodeProxy = nodeHierarchy.createNodeProxy(nodeRef),
				// get the VE_LOCATOR ve id
				veId = jQuery.grep(nodeProxy.getVeIds(), function(veId) {
					return veId.type === "VE_LOCATOR";
				})[ 0 ].fields[ 0 ].value;
			// destroy the node proxy
			nodeHierarchy.destroyNodeProxy(nodeProxy);
			// push the ve id to either visible/hidden array
			if (this.getVisibilityState(nodeRef)) {
				visible.push(veId);
			} else {
				hidden.push(veId);
			}
		}, this);

		return {
			visible: visible,
			hidden: hidden
		};
	};

	/**
	* Gets the visibility state of nodes.
	*
	* If a single node is passed to the method then a single visibility state is returned.<br/>
	* If an array of nodes is passed to the method then an array of visibility states is returned.
	*
	* @param {any|any[]} nodeRefs The node reference or the array of node references.
	* @returns {boolean|boolean[]} A single value or an array of values where the value is <code>true</code> if the node is visible, <code>false</code> otherwise.
	* @public
	*/
	ViewStateManager.prototype.getVisibilityState = function(nodeRefs) {
		return Array.isArray(nodeRefs) ?
			nodeRefs.map(function(nodeRef) { return nodeRef.visible; }) :
			nodeRefs.visible; // NB: The nodeRefs argument is a single nodeRef.
	};

	/**
	* Sets the visibility state of the nodes.
	* @param {any|any[]} nodeRefs The node reference or the array of node references.
	* @param {boolean} visible The new visibility state of the nodes.
	* @param {boolean} recursive The flags indicates if the change needs to propagate recursively to child nodes.
	* @returns {sap.ui.vk.ViewStateManager} <code>this</code> to allow method chaining.
	* @public
	*/
	ViewStateManager.prototype.setVisibilityState = function(nodeRefs, visible, recursive) {
		if (!Array.isArray(nodeRefs)) {
			nodeRefs = [ nodeRefs ];
		}
		nodeRefs = (recursive ? this._collectNodesRecursively(nodeRefs) : nodeRefs).filter(function(value, index, self) {
			return self.indexOf(value) === index;
		});

		var changed = nodeRefs.filter(function(nodeRef) {
			return nodeRef.visible != visible;
		}, this);

		if (changed.length > 0) {
			changed.forEach(function(nodeRef) {
				nodeRef.visible = visible;
			}, this);

			if (this.getShouldTrackVisibilityChanges()) {
				changed.forEach(this._visibilityTracker.trackNodeRef, this._visibilityTracker);
			}

			this.fireVisibilityChanged({
				visible: visible ? changed : [],
				hidden: visible ? [] : changed
			});
		}
		return this;
	};

	/**
	* Enumerates IDs of the selected nodes.
	*
	* @param {function} callback A function to call when the selected nodes are enumerated. The function takes one parameter of type <code>string</code>.
	* @returns {sap.ui.vk.ViewStateManager} <code>this</code> to allow method chaining.
	* @public
	*/
	ViewStateManager.prototype.enumerateSelection = function(callback) {
		this._selectedNodes.forEach(callback);
		return this;
	};

	/**
	* Gets the selection state of the node.
	*
	* If a single node reference is passed to the method then a single selection state is returned.<br/>
	* If an array of node references is passed to the method then an array of selection states is returned.
	*
	* @param {any|any[]} nodeRefs The node reference or the array of node references.
	* @returns {boolean|boolean[]} A single value or an array of values where the value is <code>true</code> if the node is selected, <code>false</code> otherwise.
	* @public
	*/
	ViewStateManager.prototype.getSelectionState = function(nodeRefs) {
		var selectionSet = this._selectedNodes;
		function isSelected(nodeRef) {
			return selectionSet.has(nodeRef);
		}

		return Array.isArray(nodeRefs) ?
			nodeRefs.map(isSelected) : isSelected(nodeRefs); // NB: The nodeRefs argument is a single nodeRef.
	};


	ViewStateManager.prototype._applyColor = function(nodeRef, colorRGBA) {
		if (nodeRef && nodeRef.material) {
			if (!nodeRef.userData.originalMaterial) {
				nodeRef.userData.originalMaterial = nodeRef.material;
			}

			if (nodeRef.userData.originalMaterial) {
				nodeRef.material = nodeRef.userData.originalMaterial.clone();
			}

			var color = sap.ui.vk.abgrToColor(colorRGBA);
			if (nodeRef.material.color){
				nodeRef.material.color.r = color.red / 255.0;
				nodeRef.material.color.g = color.green / 255.0;
				nodeRef.material.color.b = color.blue / 255.0;
				nodeRef.material.opacity = color.alpha;
			}
			if (Math.abs(color.alpha - 1.0) > 0.0001) {
				nodeRef.material.transparent = true;
			}
		}
	};

	ViewStateManager.prototype._applyOpacity = function(nodeRef, opacity) {
		if (nodeRef && nodeRef.material) {
			if (!nodeRef.userData.originalMaterial) {
				nodeRef.userData.originalMaterial = nodeRef.material;
			}

			if (nodeRef.userData.originalMaterial === nodeRef.material) {
				nodeRef.material = nodeRef.userData.originalMaterial.clone();
			}
			nodeRef.material.opacity = opacity;
			if (Math.abs(opacity - 1.0) > 0.0001) {
				nodeRef.material.transparent = true;
			} else {
				nodeRef.material.transparent = false;
			}
		}
	};

	ViewStateManager.prototype._resetColor = function(nodeRef) {
		if (nodeRef && nodeRef.material) {
			if (typeof nodeRef.userData.beHighlighted == "undefined") {
				if (nodeRef.userData.tintColorABGR) {
					this._applyColor(nodeRef, nodeRef.userData.tintColorABGR);
				} else if (nodeRef.userData.originalMaterial) {
					nodeRef.material = nodeRef.userData.originalMaterial;
				}
			}
			if (nodeRef.userData.opacity) {
				this._applyOpacity(nodeRef, nodeRef.userData.opacity);
			} else if (nodeRef.userData.beHighlighted) {
				this._applyColor(nodeRef, this._highlightColorABGR);
			}
		}
	};

	ViewStateManager.prototype._isAChild = function(childNodeRef, nodeRefs) {
		var ancestor = childNodeRef.parent;
		while (ancestor) {
			if (nodeRefs.has(ancestor)) {
				return true;
			}
			ancestor = ancestor.parent;
		}
		return false;
	};

	ViewStateManager.prototype._ApplyHighlightingColor = function(nodeRef) {
		this._applyColor(nodeRef, this._highlightColorABGR);
		if (nodeRef.userData.opacity) {
			this._applyOpacity(nodeRef, nodeRef.userData.opacity);
		}
		nodeRef.userData.beHighlighted = true;
		var children = this._nodeHierarchy.getChildren(nodeRef);
		var ni;
		for (ni = 0; ni < children.length; ni++) {
			this._ApplyHighlightingColor(children[ ni ]);
		}
	};

	ViewStateManager.prototype._RemoveHighlightingColor = function(nodeRef) {
		if (!this._selectedNodes.has(nodeRef)) {
			delete nodeRef.userData.beHighlighted;
			this._resetColor(nodeRef);
			var children = this._nodeHierarchy.getChildren(nodeRef);
			var ni;
			for (ni = 0; ni < children.length; ni++) {
				this._RemoveHighlightingColor(children[ ni ]);
			}
		}
	};

	function calcObjectOrientedBoundingBox(node) {
		var parent = node.parent,
			matrix = node.matrix.clone(),
			matrixAutoUpdate = node.matrixAutoUpdate;
		node.parent = null;
		node.matrix.identity();
		node.matrixAutoUpdate = false;
		var box = new THREE.Box3().setFromObject(node);
		node.matrixAutoUpdate = matrixAutoUpdate;
		node.matrix.copy(matrix);
		node.parent = parent;
		node.updateMatrixWorld(true);
		return box;
	}

	ViewStateManager.prototype._AddBoundingBox = function(nodeRef) {
		if (nodeRef.userData.boundingBox === undefined) {
			nodeRef.userData.boundingBox = calcObjectOrientedBoundingBox(nodeRef);
		}

		if (this._boundingBoxesScene && nodeRef.userData.boxHelper === undefined) {
			var boxHelper = new THREE.BoxHelper(nodeRef.userData.boundingBox, 0xffff00);
			boxHelper.matrixWorld.copy(nodeRef.matrixWorld);
			boxHelper.matrix.copy(nodeRef.matrixWorld);
			boxHelper.matrixAutoUpdate = false;
			nodeRef.userData.boxHelper = boxHelper;

			this._boundingBoxesScene.add(boxHelper);
		}
	};

	ViewStateManager.prototype._RemoveBoundingBox = function(nodeRef) {
		if (nodeRef.userData.boundingBox !== undefined) {
			delete nodeRef.userData.boundingBox;
		}

		if (nodeRef.userData.boxHelper !== undefined){
			nodeRef.userData.boxHelper.parent.remove(nodeRef.userData.boxHelper);
			delete nodeRef.userData.boxHelper;
		}
	};

	ViewStateManager.prototype._updateBoundingBoxesTransformation = function() {
		this._selectedNodes.forEach(function(nodeRef) {
			var boxHelper = nodeRef.userData.boxHelper;
			if (boxHelper !== undefined) {
				nodeRef.updateMatrixWorld();
				boxHelper.matrixWorld.copy(nodeRef.matrixWorld);
				boxHelper.matrix.copy(nodeRef.matrixWorld);
			}
		});
	};

	ViewStateManager.prototype._updateBoundingBoxesIfNeeded = function() {
		var updateSet = new Set();
		this._selectedNodes.forEach(function(nodeRef) {
			var parent = nodeRef.parent;
			while (parent) {
				if (this._selectedNodes.has(parent)) {
					updateSet.add(parent); // need to update parent bounding box
				}
				parent = parent.parent;
			}
		}.bind(this));

		updateSet.forEach(function(nodeRef) {
			nodeRef.userData.boundingBox = calcObjectOrientedBoundingBox(nodeRef);
			if (nodeRef.userData.boxHelper !== undefined) {
				nodeRef.userData.boxHelper.update(nodeRef.userData.boundingBox);
			}
		});
	};

	/**
	 * Sets if showing the bounding box when nodes are selected
	 *
	 * @param {boolean} val <code>true</code> if bounding boxes of selected nodes are shown, <code>false</code> otherwise.
	 * @public
	 */
	ViewStateManager.prototype.setShowSelectionBoundingBox = function(val){
		this._showSelectionBoundingBox  = val;
		if (this._showSelectionBoundingBox){
			this._selectedNodes.forEach(function(node){this._AddBoundingBox(node); }.bind(this));
		} else {
			this._selectedNodes.forEach(function(node){this._RemoveBoundingBox(node); }.bind(this));
		}

		this.fireSelectionChanged({
				selected: this._selectedNodes,
				unselected: []
			});
	};

	/**
	 * Gets if showing the bounding box when nodes are selected
	 *
	 * @returns {boolean} <code>true</code> if bounding boxes of selected nodes are shown, <code>false</code> otherwise.
	 * @public
	 */
	ViewStateManager.prototype.getShowSelectionBoundingBox = function(){
		return this._showSelectionBoundingBox;
	};

	/**
	* Sets the selection state of the nodes.
	* @param {any|any[]} nodeRefs The node reference or the array of node references.
	* @param {boolean} selected The new selection state of the nodes.
	* @param {boolean} recursive The flags indicates if the change needs to propagate recursively to child nodes.
	* @returns {sap.ui.vk.ViewStateManager} <code>this</code> to allow method chaining.
	* @public
	*/
	ViewStateManager.prototype.setSelectionState = function(nodeRefs, selected, recursive) {
		if (!Array.isArray(nodeRefs)) {
			nodeRefs = [ nodeRefs ];
		}

		nodeRefs = (recursive ? this._collectNodesRecursively(nodeRefs) : nodeRefs).filter(function(value, index, self) {
			return self.indexOf(value) === index;
		});

		var changed = nodeRefs.filter(function(nodeRef) {
			return this._selectedNodes.has(nodeRef) !== selected;
		}, this);

		if (changed.length > 0) {

			changed.forEach(function(nodeRef) {
				this._selectedNodes[ selected ? "add" : "delete" ](nodeRef);
			}, this);

			var ni, nj;
			var nodesToBeRenderred = [];
			for (ni = 0; ni < changed.length; ni++) {
				if (!this._isAChild(changed[ ni ], this._selectedNodes)) {
					nodesToBeRenderred.push(changed[ ni ]);
				}
			}

			for (ni = 0; ni < nodesToBeRenderred.length; ni++) {
				if (selected) {
					this._ApplyHighlightingColor(nodesToBeRenderred[ ni ]);
				} else {
					this._RemoveHighlightingColor(nodesToBeRenderred[ ni ]);
				}
			}

			for (nj = 0; nj < changed.length; nj++) {
				if (selected) {
					if (this._showSelectionBoundingBox){
						this._AddBoundingBox(changed[ nj ]);
					}
				} else {
					this._RemoveBoundingBox(changed[ nj ]);
				}
			}

			this.fireSelectionChanged({
				selected: selected ? changed : [],
				unselected: selected ? [] : changed
			});
		}

		return this;
	};

	ViewStateManager.prototype._collectNodesRecursively = function(nodeRefs) {
		var result = [],
			that = this;
		nodeRefs.forEach(function collectChildNodes(nodeRef) {
			result.push(nodeRef);
			that._nodeHierarchy.enumerateChildren(nodeRef, collectChildNodes, false, true);
		});
		return result;
	};

	/**
	* Gets the opacity of the node.
	*
	* A helper method to ensure the returned value is either <code>float</code> or <code>null</code>.
	*
	* @param {any} nodeRef The node reference.
	* @returns {float|null} The opacity or <code>null</code> if no opacity set.
	* @private
	*/
	ViewStateManager.prototype._getOpacity = function(nodeRef) {
		return nodeRef.userData && nodeRef.userData.opacity ? nodeRef.userData.opacity : null;
	};

	/**
	* Gets the opacity of the node.
	*
	* If a single node is passed to the method then a single value is returned.<br/>
	* If an array of nodes is passed to the method then an array of values is returned.
	*
	* @param {any|any[]} nodeRefs The node reference or the array of node references.
	* @returns {float|float[]} A single value or an array of values. Value <code>null</code> means that the node's own opacity should be used.
	* @public
	*/
	ViewStateManager.prototype.getOpacity = function(nodeRefs) {
		if (Array.isArray(nodeRefs)) {
			return nodeRefs.map(this._getOpacity, this);
		} else {
			return this._getOpacity(nodeRefs); // NB: The nodeRefs argument is a single nodeRef.
		}
	};

	/**
	* Sets the opacity of the nodes.
	*
	* @param {any|any[]}       nodeRefs          The node reference or the array of node references.
	* @param {float|null}      opacity           The new opacity of the nodes. If <code>null</code> is passed then the opacity is reset
	*                                            and the node's own opacity should be used.
	* @param {boolean}         [recursive=false] The flags indicates if the change needs to propagate recursively to child nodes.
	* @returns {sap.ui.vk.ViewStateManager} <code>this</code> to allow method chaining.
	* @public
	*/
	ViewStateManager.prototype.setOpacity = function(nodeRefs, opacity, recursive) {
		if (!Array.isArray(nodeRefs)) {
			nodeRefs = [ nodeRefs ];
		}

		nodeRefs = (recursive ? this._collectNodesRecursively(nodeRefs) : nodeRefs).filter(function(value, index, self) {
			return self.indexOf(value) === index;
		});

		var changed = nodeRefs.filter(function(nodeRef) {
			return this._getOpacity(nodeRef) !== opacity;
		}, this);

		if (changed.length > 0) {
			changed.forEach(function(nodeRef) {
				if (opacity) {
					nodeRef.userData.opacity = opacity;
				} else {
					delete nodeRef.userData.opacity;
				}

			}, this);

			changed.forEach(function(nodeRef) {
				this._resetColor(nodeRef);
			}, this);

			this.fireOpacityChanged({
				changed: changed,
				opacity: opacity
			});
		}

		return this;
	};

	/**
	* Gets the tint color of the node in the ABGR format.
	*
	* A helper method to ensure that the returned value is either <code>int</code> or <code>null</code>.
	*
	* @param {any} nodeRef The node reference.
	* @returns {int|null} The color in the ABGR format or <code>null</code> if no tint color is set.
	* @private
	*/
	ViewStateManager.prototype._getTintColorABGR = function(nodeRef) {
		return nodeRef.userData && nodeRef.userData.tintColorABGR ? nodeRef.userData.tintColorABGR : null;
	};

	/**
	* Gets the tint color in the CSS color format.
	*
	* A helper method to ensure that the returned value is either {@link sap.ui.core.CSSColor} or <code>null</code>.
	*
	* @param {any} nodeRef The node reference.
	* @returns {sap.ui.core.CSSColor|null} The color in the CSS color format or <code>null</code> if no tint color is set.
	* @private
	*/
	ViewStateManager.prototype._getTintColor = function(nodeRef) {
		return nodeRef.userData && nodeRef.userData.tintColorABGR ?
			sap.ui.vk.colorToCSSColor(sap.ui.vk.abgrToColor(nodeRef.userData.tintColorABGR)) : null;
	};

	/**
	* Gets the tint color of the node.
	*
	* If a single node reference is passed to the method then a single value is returned.<br/>
	* If an array of node references is passed to the method then an array of values is returned.
	*
	* @param {any|any[]}       nodeRefs             The node reference or the array of node references.
	* @param {boolean}         [inABGRFormat=false] This flag indicates to return the tint color in the ABGR format,
	*                                               if it equals <code>false</code> then the color is returned in the CSS color format.
	* @returns {sap.ui.core.CSSColor|sap.ui.core.CSSColor[]|int|int[]}
	*                                               A single value or an array of values. Value <code>null</code> means that
	*                                               the node's own tint color should be used.
	* @public
	*/
	ViewStateManager.prototype.getTintColor = function(nodeRefs, inABGRFormat) {
		var getTintColorMethodName = inABGRFormat ? "_getTintColorABGR" : "_getTintColor";
		if (Array.isArray(nodeRefs)) {
			return nodeRefs.map(this[ getTintColorMethodName ], this);
		} else {
			return this[ getTintColorMethodName ](nodeRefs); // NB: The nodeRefs argument is a single nodeRef.
		}
	};

	/**
	* Sets the tint color of the nodes.
	* @param {any|any[]}                   nodeRefs          The node reference or the array of node references.
	* @param {sap.ui.vk.CSSColor|int|null} tintColor         The new tint color of the nodes. The value can be defined as a string
	*                                                        in the CSS color format or as an integer in the ABGR format. If <code>null</code>
	*                                                        is passed then the tint color is reset and the node's own tint color should be used.
	* @param {boolean}                     [recursive=false] This flag indicates if the change needs to propagate recursively to child nodes.
	* @returns {sap.ui.vk.ViewStateManager} <code>this</code> to allow method chaining.
	* @public
	*/
	ViewStateManager.prototype.setTintColor = function(nodeRefs, tintColor, recursive) {
		if (!Array.isArray(nodeRefs)) {
			nodeRefs = [ nodeRefs ];
		}

		var tintColorABGR = null;
		switch (typeof tintColor) {
			case "number":
				tintColorABGR = tintColor;
				break;
			case "string":
				if (sap.ui.core.CSSColor.isValid(tintColor)) {
					tintColorABGR = sap.ui.vk.colorToABGR(sap.ui.vk.cssColorToColor(tintColor));
				}
				break;
			default:
				tintColor = null; // The input tint color is invalid, reset it to null.
				break;
		}

		nodeRefs = (recursive ? this._collectNodesRecursively(nodeRefs) : nodeRefs).filter(function(value, index, self) {
			return self.indexOf(value) === index;
		});

		var changed = nodeRefs.filter(function(nodeRef) {
			return this._getTintColorABGR(nodeRef) !== tintColorABGR;
		}, this);

		if (changed.length > 0) {
			changed.forEach(function(nodeRef) {
				if (tintColorABGR) {
					nodeRef.userData.tintColorABGR = tintColorABGR;
				} else if (nodeRef.userData && nodeRef.userData.tintColorABGR) {
					delete nodeRef.userData.tintColorABGR;
				}
			}, this);

			changed.forEach(function(nodeRef) {
				this._resetColor(nodeRef);
			}, this);

			this.fireTintColorChanged({
				changed: changed,
				tintColor: tintColor,
				tintColorABGR: tintColorABGR
			});
		}

		return this;
	};

	/**
	* Sets the default highlighting color
	* @param {sap.ui.vk.CSSColor|string|int} color           The new highlighting color. The value can be defined as a string
	*                                                        in the CSS color format or as an integer in the ABGR format. If <code>null</code>
	*                                                        is passed then the tint color is reset and the node's own tint color should be used.
	* @returns {sap.ui.vk.ViewStateManager} <code>this</code> to allow method chaining.
	* @public
	*/
	ViewStateManager.prototype.setHighlightColor = function(color) {

		switch (typeof color) {
			case "number":
				this._highlightColorABGR = color;
				break;
			case "string":
				if (sap.ui.core.CSSColor.isValid(color)) {
					this._highlightColorABGR = sap.ui.vk.colorToABGR(sap.ui.vk.cssColorToColor(color));
				}
				break;
			default:
				return this;
		}
		if (this._selectedNodes.size > 0) {
			this._selectedNodes.forEach(function(nodeRef) {
				this._resetColor(nodeRef);
			}, this);

			var selectedNodesArray = Array.from(this._selectedNodes);
			for (var ni = 0; ni < selectedNodesArray.length; ni++) {
				this._ApplyHighlightingColor(selectedNodesArray[ ni ]);
			}

			this.fireHighlightColorChanged({
				highlightColor: sap.ui.vk.colorToCSSColor(sap.ui.vk.abgrToColor(this._highlightColorABGR)),
				highlightColorABGR: this._highlightColorABGR
			});
		}
		return this;
	};


	/**
	* Gets the default highlighting color
	*
	* @param {boolean}         [inABGRFormat=false] This flag indicates to return the highlighting color in the ABGR format,
	*                                               if it equals <code>false</code> then the color is returned in the CSS color format.
	* @returns {sap.ui.core.CSSColor|string|int}
	*                                               A single value or an array of values. Value <code>null</code> means that
	*                                               the node's own tint color should be used.
	* @public
	*/
	ViewStateManager.prototype.getHighlightColor = function(inABGRFormat) {
		return inABGRFormat ? this._highlightColorABGR : sap.ui.vk.colorToCSSColor(sap.ui.vk.abgrToColor(this._highlightColorABGR));
	};

	////////////////////////////////////////////////////////////////////////////
	// BEGIN: VisibilityTracker

	// Visibility Tracker is an object which keeps track of visibility changes.
	// These changes will be used in Viewport getViewInfo/setViewInfo
	VisibilityTracker = function() {
		// all visibility changes are saved in a Set. When a node changes visibility,
		// we add that id to the Set. When the visibility is changed back, we remove
		// the node reference from the set.
		this._visibilityChanges = new Set();
	};

	// It returns an object with all the relevant information about the node visibility
	// changes. In this case, we need to retrieve a list of all nodes that suffered changes
	// and an overall state against which the node visibility changes is applied.
	// For example: The overall visibility state is ALL VISIBLE and these 2 nodes changed state.
	VisibilityTracker.prototype.getInfo = function(nodeHierarchy) {

		var findVeLocator = function(veId) {
			return veId.type === "VE_LOCATOR";
		};

		// converting the collection of changed node references to ve ids
		var changedNodes = [];

		this._visibilityChanges.forEach(function(nodeRef) {
			// create node proxy based on dynamic node reference
			var nodeProxy = nodeHierarchy.createNodeProxy(nodeRef);
			// get the VE_LOCATOR ve id
			var ids = nodeProxy.getVeIds();
			var veId = jQuery.grep(ids, findVeLocator)[ 0 ].fields[ 0 ].value;
			// destroy the node proxy
			nodeHierarchy.destroyNodeProxy(nodeProxy);
			changedNodes.push(veId);
		});

		return changedNodes;
	};

	// It clears all the node references from the _visibilityChanges set.
	// This action can be performed for example, when a step is activated or
	// when the nodes are either all visible or all not visible.
	VisibilityTracker.prototype.clear = function() {
		this._visibilityChanges.clear();
	};

	// If a node suffers a visibility change, we check if that node is already tracked.
	// If it is, we remove it from the list of changed nodes. If it isn't, we add it.
	VisibilityTracker.prototype.trackNodeRef = function(nodeRef) {
		if (this._visibilityChanges.has(nodeRef)) {
			this._visibilityChanges.delete(nodeRef);
		} else {
			this._visibilityChanges.add(nodeRef);
		}
	};

	// END: VisibilityTracker
	////////////////////////////////////////////////////////////////////////////

	ContentConnector.injectMethodsIntoClass(ViewStateManager);

	return ViewStateManager;
});
