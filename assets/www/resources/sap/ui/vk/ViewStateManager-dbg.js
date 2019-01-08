/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides the ViewStateManager class.
sap.ui.define([
	"jquery.sap.global", "sap/ui/core/Element", "./ContentConnector", "./Scene", "./ViewStateManagerBase", "./Core"
], function(jQuery, Element, ContentConnector, Scene, ViewStateManagerBase, VkCore) {
	"use strict";

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
	 * @alias sap.ui.vk.ViewStateManager
	 * @experimental Since 1.32.0 This class is experimental and might be modified or removed in future versions.
	 */
	var ViewStateManager = ViewStateManagerBase.extend("sap.ui.vk.ViewStateManager", /** @lends sap.ui.vk.ViewStateManager.prototype */ {
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

		this._implementation = null;
	};

	ViewStateManager.prototype.exit = function() {
		this._destroyImplementation();

		if (basePrototype.exit) {
			basePrototype.exit.call(this);
		}
	};

	ViewStateManager.prototype._destroyImplementation = function() {
		if (this._implementation) {
			this._implementation.destroy();
			this._implementation = null;
		}
		return this;
	};

	ViewStateManager.prototype.getImplementation = function() {
		return this._implementation;
	};

	////////////////////////////////////////////////////////////////////////
	// Content connector handling begins.
	ViewStateManager.prototype._setContent = function(content) {
		var scene = null;
		if (content && content.scene instanceof sap.ui.vk.Scene) {
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
		this._setContent(event.getParameter("newContent"));
	};

	ViewStateManager.prototype._setScene = function(scene) {
		if (scene && scene instanceof Scene) {
			var sceneType = scene.getMetadata().getName(),
				implementationType = this._implementation && this._implementation.getMetadata().getName(),
				reuseImplemenation = sceneType === "sap.ui.vk.dvl.Scene" && implementationType === "sap.ui.vk.dvl.ViewStateManager" ||
					sceneType === "sap.ui.vk.threejs.Scene" && implementationType === "sap.ui.vk.threejs.ViewStateManager";

			if (!reuseImplemenation) {
				this._destroyImplementation();
				var newImplementationType;
				if (sceneType === "sap.ui.vk.dvl.Scene") {
					newImplementationType = "sap.ui.vk.dvl.ViewStateManager";
				} else if (sceneType === "sap.ui.vk.threejs.Scene") {
					newImplementationType = "sap.ui.vk.threejs.ViewStateManager";
				}

				if (newImplementationType) {
					var that = this;
					jQuery.sap.require(newImplementationType);
					this._implementation = new (jQuery.sap.getObject(newImplementationType))({
						shouldTrackVisibilityChanges: this.getShouldTrackVisibilityChanges(),
						contentConnector: this.getContentConnector(),
						visibilityChanged: function(event) {
							that.fireVisibilityChanged({
								visible: event.getParameter("visible"),
								hidden: event.getParameter("hidden")
							});
						},
						selectionChanged: function(event) {
							that.fireSelectionChanged({
								selected: event.getParameter("selected"),
								unselected: event.getParameter("unselected")
							});
						},
						opacityChanged: function(event) {
							that.fireOpacityChanged({
								changed: event.getParameter("changed"),
								opacity: event.getParameter("opacity")
							});
						},
						tintColorChanged: function(event) {
							that.fireTintColorChanged({
								changed: event.getParameter("changed"),
								tintColor: event.getParameter("tintColor"),
								tintColorABGR: event.getParameter("tintColorABGR")
							});
						},
						nodeHierarchyReplaced: function(event) {
							that.fireNodeHierarchyReplaced({
								oldNodeHierarchy: event.getParameter("oldNodeHierarchy"),
								newNodeHierarchy: event.getParameter("newNodeHierarchy")
							});
						}
					});
				}
			}
		} else {
			this._destroyImplementation();
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
		return this._implementation && this._implementation.getNodeHierarchy();
	};

	/**
	 * Gets the visibility changes in the current ViewStateManager object.
	 * @returns {string[]} The visibility changes are in the form of an array. The array is a list of node VE ids which suffered a visibility changed relative to the default state.
	 * @public
	 */
	ViewStateManager.prototype.getVisibilityChanges = function() {
		return this._implementation && this._implementation.getVisibilityChanges();
	};

	/**
	 * Gets the visibility state of all nodes.
	 * @function
	 * @name sap.ui.vk.ViewStateManager#getVisibilityComplete
	 * @returns {object} An object with following structure.
	 * <pre>
	 * {
	 *     visible: [string, ...] - an array of VE IDs of visible nodes
	 *     hidden:  [string, ...] - an array of VE IDs of hidden nodes
	 * }
	 * </pre>
	 */
	ViewStateManager.prototype.getVisibilityComplete = function() {
		return this._implementation && this._implementation.getVisibilityComplete();
	};

	/**
	 * Gets the visibility state of nodes.
	 *
	 * If a single node reference is passed to the method then a single visibility state is returned.<br/>
	 * If an array of node references is passed to the method then an array of visibility states is returned.
	 *
	 * @param {any|any[]} nodeRefs The node reference or the array of node references.
	 * @returns {boolean|boolean[]} A single value or an array of values where the value is <code>true</code> if the node is visible, <code>false</code> otherwise.
	 * @public
	 */
	ViewStateManager.prototype.getVisibilityState = function(nodeRefs) {
		return this._implementation && this._implementation.getVisibilityState(nodeRefs);
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
		if (this._implementation) {
			this._implementation.setVisibilityState(nodeRefs, visible, recursive);
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
		if (this._implementation) {
			this._implementation.enumerateSelection(callback);
		}
		return this;
	};

	/**
	 * Sets if showing the bounding box when nodes are selected
	 *
	 * @param {boolean} val <code>true</code> if bounding boxes of selected nodes are shown, <code>false</code> otherwise.
	 * @public
	 */
	ViewStateManager.prototype.setShowSelectionBoundingBox = function(val){
		if (this._implementation) {
			this._implementation.setShowSelectionBoundingBox(val);
		}
	};

	/**
	 * Gets if showing the bounding box when nodes are selected
	 *
	 * @returns {boolean} <code>true</code> if bounding boxes of selected nodes are shown, <code>false</code> otherwise.
	 * @public
	 */
	ViewStateManager.prototype.getShowSelectionBoundingBox = function(){
		if (this._implementation) {
			return this._implementation.getShowSelectionBoundingBox();
		}
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
		return this._implementation && this._implementation.getSelectionState(nodeRefs);
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
		if (this._implementation) {
			this._implementation.setSelectionState(nodeRefs, selected, recursive);
		}
		return this;
	};

	/**
	 * Gets the opacity of the node.
	 *
	 * If a single node reference is passed to the method then a single value is returned.<br/>
	 * If an array of node references is passed to the method then an array of values is returned.
	 *
	 * @param {any|any[]} nodeRefs The node reference or the array of node references.
	 * @returns {float|float[]} A single value or an array of values. Value <code>null</code> means that the node's own opacity should be used.
	 * @public
	 */
	ViewStateManager.prototype.getOpacity = function(nodeRefs) {
		return this._implementation && this._implementation.getOpacity(nodeRefs);
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
		if (this._implementation) {
			this._implementation.setOpacity(nodeRefs, opacity, recursive);
		}
		return this;
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
		return this._implementation && this._implementation.getTintColor(nodeRefs, inABGRFormat);
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
		if (this._implementation) {
			this._implementation.setTintColor(nodeRefs, tintColor, recursive);
		}
		return this;
	};

	/**
	 * Sets the default highlighting color
	 * @param {sap.ui.vk.CSSColor|string|int} color           The new default highlighting color. The value can be defined as a string
	 *                                                        in the CSS color format or as an integer in the ABGR format. If <code>null</code>
	 *                                                        is passed then the tint color is reset and the node's own tint color should be used.
	 * @returns {sap.ui.vk.ViewStateManager} <code>this</code> to allow method chaining.
	 * @public
	 */
	ViewStateManager.prototype.setHighlightColor = function(color) {
		if (this._implementation && this._implementation.setHighlightColor) {
			this._implementation.setHighlightColor(color);
		}
		return this;
	};


	/**
	 * Gets the default highlighting color
	 *
	 * @param {boolean}         [inABGRFormat=false] This flag indicates to return the default highlighting color in the ABGR format,
	 *                                               if it equals <code>false</code> then the color is returned in the CSS color format.
	 * @returns {sap.ui.core.CSSColor|string|int}
	 *                                               A single value or an array of values. Value <code>null</code> means that
	 *                                               the node's own tint color should be used.
	 * @public
	 */
	ViewStateManager.prototype.getHighlightColor = function(inABGRFormat) {
		if (this._implementation && this._implementation.getHighlightColor) {
			return this._implementation.getHighlightColor(inABGRFormat);
		}
	};

	var fullClassName = ViewStateManager.getMetadata().getName();

	var mixin = {
		init: function() {
			this._viewStateManager = null;
			sap.ui.vk.getCore()
				.attachEvent(fullClassName + "-created", this._handleViewStateManagerCreated, this)
				.attachEvent(fullClassName + "-destroying", this._handleViewStateManagerDestroying, this);
		},

		exit: function() {
			this.setViewStateManager(null);
			sap.ui.vk.getCore()
				.detachEvent(fullClassName + "-destroying", this._handleViewStateManagerDestroying, this)
				.detachEvent(fullClassName + "-created", this._handleViewStateManagerCreated, this);
		},

		setViewStateManager: function(viewStateManager) {
			this.setAssociation("viewStateManager", viewStateManager, true);
			this._updateViewStateManager();
			return this;
		},

		_updateViewStateManager: function() {
			var newViewStateManagerId = this.getViewStateManager(),
				// sap.ui.getCore() returns 'undefined' if cannot find an element,
				// getViewStateManager() returns 'null' if there is no connector.
				newViewStateManager = newViewStateManagerId && sap.ui.getCore().byId(newViewStateManagerId) || null;

			if (this._viewStateManager !== newViewStateManager) {
				this._clearViewStateManager();
				if (newViewStateManager) {
					if (this._handleNodeHierarchyReplaced) {
						newViewStateManager.attachNodeHierarchyReplaced(this._handleNodeHierarchyReplaced, this);
					}
					if (this._handleVisibilityChanged) {
						newViewStateManager.attachVisibilityChanged(this._handleVisibilityChanged, this);
					}
					if (this._handleSelectionChanged) {
						newViewStateManager.attachSelectionChanged(this._handleSelectionChanged, this);
					}
					if (this._handleOpacityChanged) {
						newViewStateManager.attachOpacityChanged(this._handleOpacityChanged, this);
					}
					if (this._handleTintColorChanged) {
						newViewStateManager.attachTintColorChanged(this._handleTintColorChanged, this);
					}
					this._viewStateManager = newViewStateManager;
					if (this._onAfterUpdateViewStateManager) {
						this._onAfterUpdateViewStateManager();
					}
				}
			}
			return this;
		},

		_clearViewStateManager: function() {
			if (this._viewStateManager) {
				if (this._onBeforeClearViewStateManager) {
					this._onBeforeClearViewStateManager();
				}
				if (this._handleTintColorChanged) {
					this._viewStateManager.detachTintColorChanged(this._handleTintColorChanged, this);
				}
				if (this._handleOpacityChanged) {
					this._viewStateManager.detachOpacityChanged(this._handleOpacityChanged, this);
				}
				if (this._handleSelectionChanged) {
					this._viewStateManager.detachSelectionChanged(this._handleSelectionChanged, this);
				}
				if (this._handleVisibilityChanged) {
					this._viewStateManager.detachVisibilityChanged(this._handleVisibilityChanged, this);
				}
				if (this._handleNodeHierarchyReplaced) {
					this._viewStateManager.detachNodeHierarchyReplaced(this._handleNodeHierarchyReplaced, this);
				}
				this._viewStateManager = null;
			}
			return this;
		},

		_handleViewStateManagerCreated: function(event) {
			if (this.getViewStateManager() === event.getParameter("object").getId()) {
				this._updateViewStateManager();
			}
		},

		_handleViewStateManagerDestroying: function(event) {
			if (this.getViewStateManager() === event.getParameter("object").getId()) {
				this._clearViewStateManager();
			}
		}
	};

	ViewStateManager.injectMethodsIntoClass = function(classObject) {
		var prototype = classObject.prototype,
			init = prototype.init,
			exit = prototype.exit;

		prototype.init = function() {
			if (init) {
				init.call(this);
			}
			mixin.init.call(this);
		};

		prototype.exit = function() {
			mixin.exit.call(this);
			if (exit) {
				exit.call(this);
			}
		};

		prototype.setViewStateManager = mixin.setViewStateManager;
		prototype._updateViewStateManager = mixin._updateViewStateManager;
		prototype._clearViewStateManager = mixin._clearViewStateManager;
		prototype._handleViewStateManagerCreated = mixin._handleViewStateManagerCreated;
		prototype._handleViewStateManagerDestroying = mixin._handleViewStateManagerDestroying;
	};

	sap.ui.vk.getCore().registerClass(ViewStateManager);
	ContentConnector.injectMethodsIntoClass(ViewStateManager);

	return ViewStateManager;
});
