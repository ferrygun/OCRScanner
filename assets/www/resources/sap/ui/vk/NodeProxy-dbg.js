/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides the NodeProxy class.
sap.ui.define([
	"jquery.sap.global", "./library", "sap/ui/base/ManagedObject"
], function(jQuery, library, ManagedObject) {
	"use strict";

	/**
	 * Constructor for a new NodeProxy.
	 *
	 * @class
	 * Provides a proxy object to the node in the node hierarchy.
	 *
	 * Objects of this type should only be created with the {@link sap.ui.vk.NodeHierarchy#createNodeProxy sap.ui.vk.NodeHierarchy.createNodeProxy} method.
	 * and destroyed with the {@link sap.ui.vk.NodeHierarchy#destroyNodeProxy sap.ui.vk.NodeHierarchy.destroyNodeProxy} method.
	 *
	 * @public
	 * @author SAP SE
	 * @version 1.52.8
	 * @extends sap.ui.base.ManagedObject
	 * @alias sap.ui.vk.NodeProxy
	 * @experimental Since 1.32.0 This class is experimental and might be modified or removed in future versions.
	 */
	var NodeProxy = ManagedObject.extend("sap.ui.vk.NodeProxy", /** @lends sap.ui.vk.NodeProxy.prototype */ {
		metadata: {
			properties: {
				/**
				 * The node reference. This property is read-only.
				 */
				nodeRef: "any",

				/**
				 * The node VE IDs. This property is read-only.
				 */
				veIds: "object[]",

				/**
				 * The name of the node. This property is read-only.
				 */
				name: "string",

				/**
				 * The local transformation matrix of the node.
				 */
				localMatrix: {
					type: "sap.ui.vk.TransformationMatrix",
					bindable: "bindable"
				},

				/**
				 * The world transformation matrix of the node.
				 */
				worldMatrix: {
					type: "sap.ui.vk.TransformationMatrix",
					bindable: "bindable"
				},

				/**
				 * The node opacity.
				 */
				opacity: {
					type: "float",
					bindable: "bindable"
				},

				/**
				 * The tint color.<br/>
				 *
				 * The tint color is a 32-bit integer in the ABGR notation, where A is amount of blending between material color and tint color.
				 */
				tintColorABGR: {
					type: "int",
					bindable: "bindable"
				},

				/**
				 * The tint color.
				 */
				tintColor: {
					type: "sap.ui.core.CSSColor",
					bindable: "bindable"
				},

				/**
				 * The node metadata. This property is read-only.
				 */
				nodeMetadata: "object",

				/**
				 * The indicator showing if the node has child nodes. This property is read-only.
				 */
				hasChildren: "boolean",

				/**
				 * The indicator showing if the node is closed. This property is read-only.
				 */
				closed: "boolean"
			},

			publicMethods: [
				"getSceneRef"
			]
		}
	});

	/**
	 * Gets the scene reference that this NodeProxy object wraps.
	 *
	 * @function
	 * @name sap.ui.vk.NodeProxy#getSceneRef
	 *
	 * @returns {any} The scene reference that this NodeProxy object wraps.
	 * @public
	 */

	NodeProxy.prototype.setClosed = function(value) {
		return this;
	};

	NodeProxy.prototype.setHasChildren = function(value) {
		return this;
	};

	NodeProxy.prototype.setName = function(value) {
		return this;
	};

	NodeProxy.prototype.setNodeId = function(value) {
		return this;
	};

	NodeProxy.prototype.setNodeMetadata = function(value) {
		return this;
	};

	NodeProxy.prototype.setVeIds = function(value) {
		return this;
	};


	return NodeProxy;
});
