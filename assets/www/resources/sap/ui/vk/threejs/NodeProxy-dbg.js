/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides the NodeProxy class.
sap.ui.define([
	"jquery.sap.global", "../library", "../NodeProxy"
], function(jQuery, library, NodeProxyBase) {
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
	 * @extends sap.ui.vk.NodeProxy
	 * @alias sap.ui.vk.threejs.NodeProxy
	 * @experimental Since 1.32.0 This class is experimental and might be modified or removed in future versions.
	 */
	var NodeProxy = NodeProxyBase.extend("sap.ui.vk.threejs.NodeProxy", /** @lends sap.ui.vk.threejs.NodeProxy.prototype */ {
		metadata: {
		},

		constructor: function(nodeHierarchy, obj3D) {
			NodeProxyBase.call(this);

			this._object3D = obj3D; // THREE.Object3D
		}
	});

	NodeProxy.prototype.destroy = function() {
		this._object3D = null;

		NodeProxyBase.prototype.destroy.call(this);
	};

	NodeProxy.prototype.getNodeRef = function() {
		return this._object3D;
	};

	NodeProxy.prototype.getNodeId = function() {
		return this._object3D;
	};

	NodeProxy.prototype.getVeIds = function() {
		return this._object3D.userData.veIds;
	};

	NodeProxy.prototype.getName = function() {
		return this._object3D.name || ("<" + this._object3D.type + ">");
	};

	NodeProxy.prototype.getLocalMatrix = function() {
		return sap.ui.vk.TransformationMatrix.convertTo4x3(this._object3D.matrix.elements);
	};

	NodeProxy.prototype.setLocalMatrix = function(value) {
		if (value) {
			var obj3D = this._object3D;
			obj3D.matrix.fromArray(sap.ui.vk.TransformationMatrix.convertTo4x4(value));
			obj3D.matrix.decompose(obj3D.position, obj3D.quaternion, obj3D.scale);
			obj3D.matrixWorldNeedsUpdate = true;
		}
		this.setProperty("localMatrix", value, true);
		return this;
	};

	NodeProxy.prototype.getWorldMatrix = function() {
		return sap.ui.vk.TransformationMatrix.convertTo4x3(this._object3D.matrixWorld.elements);
	};

	NodeProxy.prototype.setWorldMatrix = function(value) {
		if (value) {
			var obj3D = this._object3D;
			obj3D.matrixWorld.fromArray(sap.ui.vk.TransformationMatrix.convertTo4x4(value));
			if (obj3D.parent) {
				obj3D.matrix.multiplyMatrices(new THREE.Matrix4().getInverse(obj3D.parent.matrixWorld), obj3D.matrixWorld);
			} else {
				obj3D.matrix.copy(obj3D.matrixWorld);
			}
			obj3D.matrix.decompose(obj3D.position, obj3D.quaternion, obj3D.scale);
		}
		this.setProperty("worldMatrix", value, true);
		return this;
	};

	NodeProxy.prototype.getOpacity = function() {
		return this._object3D.userData.opacity;
	};

	NodeProxy.prototype.setOpacity = function(value) {
		this._object3D.userData.opacity = value;
		this.setProperty("opacity", value, true);
		return this;
	};

	NodeProxy.prototype.getTintColorABGR = function() {
		return this._object3D.userData.tintColor;
	};

	NodeProxy.prototype.setTintColorABGR = function(value) {
		this._object3D.userData.tintColor = value;
		this.setProperty("tintColorABGR", value, true);
		this.setProperty("tintColor", sap.ui.vk.colorToCSSColor(sap.ui.vk.abgrToColor(value)), true);
		return this;
	};

	NodeProxy.prototype.getTintColor = function() {
		return sap.ui.vk.colorToCSSColor(sap.ui.vk.abgrToColor(this._object3D.userData.tintColor));
	};

	NodeProxy.prototype.setTintColor = function(value) {
		var abgr = sap.ui.vk.colorToABGR(sap.ui.vk.cssColorToColor(value));
		this._object3D.userData.tintColor = abgr;
		this.setProperty("tintColorABGR", abgr, true);
		this.setProperty("tintColor", value, true);
		return this;
	};

	NodeProxy.prototype.getNodeMetadata = function() {
		return this._object3D.userData.metadata;
	};

	NodeProxy.prototype.getHasChildren = function() {
		return this._object3D.children.length > 0;
	};

	NodeProxy.prototype.getClosed = function() {
		return !!this._object3D.userData.closed;
	};

	return NodeProxy;
});
