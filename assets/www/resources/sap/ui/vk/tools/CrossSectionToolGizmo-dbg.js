/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.vk.tools.CrossSectionToolGizmo
sap.ui.define([
	"jquery.sap.global", "./library", "./Gizmo"
], function(jQuery, library, Gizmo) {
	"use strict";

	/**
	 * Constructor for a new CrossSectionToolGizmo.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Provides buttons to hide or show certain sap.ui.vk controls.
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 * @version 1.52.8
	 *
	 * @constructor
	 * @public
	 * @alias sap.ui.vk.tools.CrossSectionToolGizmo
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
	 */
	var CrossSectionToolGizmo = Gizmo.extend("sap.ui.vk.tools.CrossSectionToolGizmo", /** @lends sap.ui.vk.tools.CrossSectionToolGizmo.prototype */ {
		metadata: {
			library: "sap.ui.vk.tools",
			publicMethods: [
				"hasDomElement",
				"setAxis",
				"setFlip",
				"adjustCameraClipPlanes",
				"render"
			]
		}
	});

	CrossSectionToolGizmo.prototype.init = function() {
		if (Gizmo.prototype.init) {
			Gizmo.prototype.init.apply(this);
		}

		this._viewport = null;
		this._tool = null;
		this._gizmo = new THREE.Scene();
		this._position = new THREE.Vector3(0, 0, 0);
		this._plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
		this._flip = false;

		this.setAxis(0);
	};

	CrossSectionToolGizmo.prototype.hasDomElement = function() {
		return false;
	};

	CrossSectionToolGizmo.prototype.show = function(viewport, tool) {
		this._viewport = viewport;
		this._tool = tool;
		var bbox = viewport._scene._computeBoundingBox();
		this._position.copy(bbox.getCenter());
		this._plane.constant = -this._plane.normal.dot(this._position);
		viewport.setClippingPlanes([ this._plane ]);
	};

	CrossSectionToolGizmo.prototype.hide = function() {
		if (this._viewport) {
			this._viewport.setClippingPlanes([]);
			this._viewport = null;
		}
		this._tool = null;
	};

	CrossSectionToolGizmo.prototype.setAxis = function(i) {
		this._axis = i;
		var dir = new THREE.Vector3().setComponent(i, 1);
		this._plane.normal.set(0, 0, 0).setComponent(i, this._flip ? -1 : 1);
		this._plane.constant = -this._plane.normal.dot(this._position);

		while (this._gizmo.children.length > 0) {
			this._gizmo.remove(this._gizmo.children[ this._gizmo.children.length - 1 ]);
		}

		var dirX = new THREE.Vector3(dir.y, dir.z, dir.x);
		var dirY = new THREE.Vector3(dir.z, dir.x, dir.y);
		var geometry = new THREE.BufferGeometry();
		var vertices = new Array(15);
		var p = new THREE.Vector3();
		p.sub(dirX).sub(dirY).multiplyScalar(0.5).toArray(vertices, 0);
		p.toArray(vertices, 12);
		p.add(dirX).toArray(vertices, 3);
		p.add(dirY).toArray(vertices, 6);
		p.sub(dirX).toArray(vertices, 9);
		geometry.addAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
		var line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, linewidth: window.devicePixelRatio }));
		this._gizmo.add(line);

		vertices.length = 12;
		geometry = new THREE.BufferGeometry();
		geometry.setIndex([ 0, 1, 2, 0, 2, 3 ]);
		geometry.addAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
		this._touchMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xFFFFFF, visible: false, opacity: 0.1, transparent: true, side: THREE.DoubleSide }));
		this._gizmo.add(this._touchMesh);

		if (this._viewport) {
			this._viewport.setShouldRenderFrame();
		}

		return this;
	};

	CrossSectionToolGizmo.prototype.setFlip = function(flip) {
		this._flip = !!flip;
		this._plane.normal.set(0, 0, 0).setComponent(this._axis, this._flip ? -1 : 1);
		this._plane.constant = -this._plane.normal.dot(this._position);

		if (this._viewport) {
			this._viewport.setShouldRenderFrame();
		}

		return this;
	};

	CrossSectionToolGizmo.prototype.getTouchObject = function() {
		return this._touchMesh;
	};

	CrossSectionToolGizmo.prototype._setOffset = function(offset) {
		var bbox = this._viewport._scene._computeBoundingBox();
		offset = THREE.Math.clamp(offset, bbox.min.getComponent(this._axis), bbox.max.getComponent(this._axis));
		this._position.setComponent(this._axis, offset);
		this._plane.constant = -this._plane.normal.dot(this._position);
		this._viewport.setShouldRenderFrame();
	};

	CrossSectionToolGizmo.prototype._adjustBoundingBox = function(boundingBox) {
		var size = boundingBox.getSize();
		var delta = Math.max(size.x, size.y, size.z) * 0.2;
		boundingBox.expandByScalar(delta);
	};

	CrossSectionToolGizmo.prototype.adjustCameraClipPlanes = function(camera, boundingBox) {
		boundingBox = boundingBox.clone();
		this._adjustBoundingBox(boundingBox);
		camera.adjustClipPlanes(boundingBox);
	};

	CrossSectionToolGizmo.prototype.render = function() {
		jQuery.sap.assert(this._viewport && this._viewport.getMetadata().getName() === "sap.ui.vk.threejs.Viewport", "Can't render gizmo without sap.ui.vk.threejs.Viewport");

		var i = this._axis;
		var bbox = this._viewport._scene._computeBoundingBox();
		var offset = THREE.Math.clamp(this._position.getComponent(i), bbox.min.getComponent(i), bbox.max.getComponent(i));
		this._position.setComponent(i, offset);
		this._plane.constant = -this._plane.normal.dot(this._position);

		this._adjustBoundingBox(bbox);
		this._gizmo.position.copy(bbox.getCenter());
		this._gizmo.position.setComponent(i, offset);
		this._gizmo.scale.copy(bbox.getSize());

		this._viewport.getRenderer().render(this._gizmo, this._viewport.getCamera().getCameraRef());
	};

	CrossSectionToolGizmo.prototype.onBeforeRendering = function() {
		jQuery.sap.assert(false, "CrossSectionToolGizmo.onBeforeRendering");
	};

	CrossSectionToolGizmo.prototype.onAfterRendering = function() {
		jQuery.sap.assert(false, "CrossSectionToolGizmo.onAfterRendering");
	};

	return CrossSectionToolGizmo;

}, /* bExport= */ true);
