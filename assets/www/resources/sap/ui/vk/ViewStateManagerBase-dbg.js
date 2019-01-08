/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides the ViewStateManagerBase class.
sap.ui.define([
	"jquery.sap.global", "sap/ui/core/Element", "./ContentConnector", "./Scene"
], function(jQuery, Element, ContentConnector, Scene) {
	"use strict";

	/**
	 * Constructor for a new ViewStateManagerBase.
	 *
	 * @class
	 * Manages the visibility and selection states of nodes in the scene.
	 *
	 * @param {string} [sId] ID for the new ViewStateManagerBase object. Generated automatically if no ID is given.
	 * @param {object} [mSettings] Initial settings for the new ViewStateManagerBase object.
	 * @public
	 * @abstract
	 * @author SAP SE
	 * @version 1.52.8
	 * @extends sap.ui.core.Element
	 * @alias sap.ui.vk.ViewStateManagerBase
	 * @experimental Since 1.32.0 This class is experimental and might be modified or removed in future versions.
	 */
	var ViewStateManagerBase = Element.extend("sap.ui.vk.ViewStateManagerBase", /** @lends sap.ui.vk.ViewStateManagerBase.prototype */ {
		metadata: {
			"abstract": true,

			properties: {
				shouldTrackVisibilityChanges: {
					type: "boolean",
					defaultValue: false
				}
			},

			associations: {
				contentConnector: {
					type: "sap.ui.vk.ContentConnector"
				}
			},

			events: {
				/**
				 * This event is fired when the visibility of the node changes.
				 */
				visibilityChanged: {
					parameters: {
						/**
						 * References of newly shown nodes.
						 */
						visible: {
							type: "any[]"
						},
						/**
						 * IDs of newly hidden nodes.
						 */
						hidden: {
							type: "any[]"
						}
					},
					enableEventBubbling: true
				},

				/**
				 * This event is fired when the nodes are selected/unselected.
				 */
				selectionChanged: {
					parameters: {
						/**
						 * References of newly selected nodes.
						 */
						selected: {
							type: "any[]"
						},
						/**
						 * References of newly unselected nodes.
						 */
						unselected: {
							type: "any[]"
						}
					},
					enableEventBubbling: true
				},

				/**
				 * This event is fired when opacity of the nodes is changed.
				 */
				opacityChanged: {
					parameters: {
						/**
						 * References of nodes whose opacity changed.
						 */
						changed: {
							type: "any[]"
						},
						/**
						 * Opacity assigned to the nodes.
						 */
						opacity: {
							type: "float"
						}
					},
					enableEventBubbling: true
				},

				/**
				 * This event is fired when tint color of the nodes is changed.
				 */
				tintColorChanged: {
					parameters: {
						/**
						 * References of nodes whose tint color changed.
						 */
						changed: {
							type: "any[]"
						},
						/**
						 * Tint color assigned to the nodes.
						 */
						tintColor: {
							type: "sap.ui.core.CSSColor"
						},
						/**
						 * Tint color in the ABGR format assigned to the nodes.
						 */
						tintColorABGR: {
							type: "int"
						}
					},
					enableEventBubbling: true
				},

				/**
				 * This event is fired when the node hierarchy is replaced.
				 */
				nodeHierarchyReplaced: {
					parameters: {
						/**
						 * Old node hierarchy
						 */
						oldNodeHierarchy: {
							type: "sap.ui.vk.NodeHierarchy"
						},

						/**
						 * New node hierarchy
						 */
						newNodeHierarchy: {
							type: "sap.ui.vk.NodeHierarchy"
						}
					}
				},

				/**
				 * This event is fired when highlighting color  is changed.
				 */
				highlightColorChanged: {
					parameters: {
						/**
						 * Highlighting color
						 */
						highlightColor: {
							type: "sap.ui.core.CSSColor"
						},
						/**
						 * Highlighting color in the ABGR format.
						 */
						highlightColorABGR: {
							type: "int"
						}
					},
					enableEventBubbling: true
				}
			}
		}
	});

	/**
	 * Gets the NodeHierarchy object associated with this ViewStateManagerBase object.
	 * @function
	 * @name sap.ui.vk.ViewStateManagerBase#getNodeHierarchy
	 * @returns {sap.ui.vk.NodeHierarchy} The node hierarchy associated with this ViewStateManagerBase object.
	 * @public

	/**
	 * Gets the visibility changes in the current ViewStateManagerBase object.
	 * @function
	 * @name sap.ui.vk.ViewStateManagerBase#getVisibilityChanges
	 * @returns {string[]} The visibility changes are in the form of an array. The array is a list of node VE ids which suffered a visibility changed relative to the default state.
	 * @public
	 */

	/**
	 * Gets the visibility state of all nodes.
	 * @function
	 * @name sap.ui.vk.ViewStateManagerBase#getVisibilityComplete
	 * @returns {object} An object with following structure.
	 * <pre>
	 * {
	 *     visible: [string, ...] - an array of VE IDs of visible nodes
	 *     hidden:  [string, ...] - an array of VE IDs of hidden nodes
	 * }
	 * </pre>
	 */

	/**
	 * Gets the visibility state of nodes.
	 *
	 * If a single node reference is passed to the method then a single visibility state is returned.<br/>
	 * If an array of node references is passed to the method then an array of visibility states is returned.
	 *
	 * @function
	 * @name sap.ui.vk.ViewStateManagerBase#getVisibilityState
	 * @param {any|any[]} nodeRefs The node reference or the array of node references.
	 * @returns {boolean|boolean[]} A single value or an array of values where the value is <code>true</code> if the node is visible, <code>false</code> otherwise.
	 * @public
	 */

	/**
	 * Sets the visibility state of the nodes.
	 * @function
	 * @name sap.ui.vk.ViewStateManagerBase#setVisibilityState
	 * @param {any|any[]} nodeRefs The node reference or the array of node references.
	 * @param {boolean} visible The new visibility state of the nodes.
	 * @param {boolean} recursive The flags indicates if the change needs to propagate recursively to child nodes.
	 * @returns {sap.ui.vk.ViewStateManagerBase} <code>this</code> to allow method chaining.
	 * @public
	 */

	/**
	 * Enumerates IDs of the selected nodes.
	 *
	 * @function
	 * @name sap.ui.vk.ViewStateManagerBase#enumerateSelection
	 * @param {function} callback A function to call when the selected nodes are enumerated. The function takes one parameter of type <code>string</code>.
	 * @returns {sap.ui.vk.ViewStateManagerBase} <code>this</code> to allow method chaining.
	 * @public
	 */

	/**
	 * Gets the selection state of the node.
	 *
	 * If a single node reference is passed to the method then a single selection state is returned.<br/>
	 * If an array of node references is passed to the method then an array of selection states is returned.
	 *
	 * @function
	 * @name sap.ui.vk.ViewStateManagerBase#getSelectionState
	 * @param {any|any[]} nodeRefs The node reference or the array of node references.
	 * @returns {boolean|boolean[]} A single value or an array of values where the value is <code>true</code> if the node is selected, <code>false</code> otherwise.
	 * @public
	 */

	/**
	 * Sets the selection state of the nodes.
	 * @function
	 * @name sap.ui.vk.ViewStateManagerBase#setSelectionState
	 * @param {any|any[]} nodeRefs The node reference or the array of node references.
	 * @param {boolean} selected The new selection state of the nodes.
	 * @param {boolean} recursive The flags indicates if the change needs to propagate recursively to child nodes.
	 * @returns {sap.ui.vk.ViewStateManagerBase} <code>this</code> to allow method chaining.
	 * @public
	 */

	/**
	 * Gets the opacity of the node.
	 *
	 * If a single node reference is passed to the method then a single value is returned.<br/>
	 * If an array of node references is passed to the method then an array of values is returned.
	 *
	 * @function
	 * @name sap.ui.vk.ViewStateManagerBase#getOpacity
	 * @param {any|any[]} nodeRefs The node reference or the array of node references.
	 * @returns {float|float[]} A single value or an array of values. Value <code>null</code> means that the node's own opacity should be used.
	 * @public
	 */

	/**
	 * Sets the opacity of the nodes.
	 *
	 * @function
	 * @name sap.ui.vk.ViewStateManagerBase#setOpacity
	 * @param {any|any[]}       nodeRefs          The node reference or the array of node references.
	 * @param {float|null}      opacity           The new opacity of the nodes. If <code>null</code> is passed then the opacity is reset
	 *                                            and the node's own opacity should be used.
	 * @param {boolean}         [recursive=false] The flags indicates if the change needs to propagate recursively to child nodes.
	 * @returns {sap.ui.vk.ViewStateManagerBase} <code>this</code> to allow method chaining.
	 * @public
	 */

	/**
	 * Gets the tint color of the node.
	 *
	 * If a single node reference is passed to the method then a single value is returned.<br/>
	 * If an array of node references is passed to the method then an array of values is returned.
	 *
	 * @function
	 * @name sap.ui.vk.ViewStateManagerBase#getTintColor
	 * @param {any|any[]}       nodeRefs             The node reference or the array of node references.
	 * @param {boolean}         [inABGRFormat=false] This flag indicates to return the tint color in the ABGR format,
	 *                                               if it equals <code>false</code> then the color is returned in the CSS color format.
	 * @returns {sap.ui.core.CSSColor|sap.ui.core.CSSColor[]|int|int[]}
	 *                                               A single value or an array of values. Value <code>null</code> means that
	 *                                               the node's own tint color should be used.
	 * @public
	 */

	/**
	 * Sets the tint color of the nodes.
	 * @function
	 * @name sap.ui.vk.ViewStateManagerBase#setTintColor
	 * @param {any|any[]}                   nodeRefs          The node reference or the array of node references.
	 * @param {sap.ui.vk.CSSColor|int|null} tintColor         The new tint color of the nodes. The value can be defined as a string
	 *                                                        in the CSS color format or as an integer in the ABGR format. If <code>null</code>
	 *                                                        is passed then the tint color is reset and the node's own tint color should be used.
	 * @param {boolean}                     [recursive=false] This flag indicates if the change needs to propagate recursively to child nodes.
	 * @returns {sap.ui.vk.ViewStateManagerBase} <code>this</code> to allow method chaining.
	 * @public
	 */

	return ViewStateManagerBase;
});
