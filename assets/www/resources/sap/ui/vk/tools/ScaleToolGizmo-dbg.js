/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.vk.tools.ScaleToolGizmo
sap.ui.define([
	"jquery.sap.global", "./library", "./Gizmo"
], function(jQuery, library, Gizmo) {
	"use strict";

	/**
	 * Constructor for a new ScaleToolGizmo.
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
	 * @alias sap.ui.vk.tools.ScaleToolGizmo
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
	 */
	var ScaleToolGizmo = Gizmo.extend("sap.ui.vk.tools.ScaleToolGizmo", /** @lends sap.ui.vk.tools.ScaleToolGizmo.prototype */ {
		metadata: {
			library: "sap.ui.vk.tools",
			properties: {
			},
			publicMethods: [
				"hasDomElement",
				"getCoordinateSystem",
				"setCoordinateSystem",
				"getNonUniformScaleEnabled",
				"setNonUniformScaleEnabled",
				"scale",
				"adjustCameraClipPlanes",
				"render"
			],
			events: {},
			associations: {
			},
			aggregations: {

			}
		}
	});

	ScaleToolGizmo.prototype.init = function() {
		if (Gizmo.prototype.init) {
			Gizmo.prototype.init.apply(this);
		}

		this._viewport = null;
		this._tool = null;
		this._nonUniformScaleEnabled = false;
		this._sceneGizmo = new THREE.Scene();
		this._gizmo = new THREE.Group();
		this._touchAreas = new THREE.Group();
		this._sceneGizmo.add(this._gizmo);
		// this._sceneGizmo.add(this._touchAreas);
		this._gizmoScale = new THREE.Vector3().setScalar(1);
		this._coordinateSystem = sap.ui.vk.tools.CoordinateSystem.Local;
		this._nodes = [];
		this._matViewProj = new THREE.Matrix4();
		this._gizmoSize = 132;

		var arrowLength = 144,
			boxSize = 24 / arrowLength,
			touchBoxSize = 48 / arrowLength;

		function createGizmoBox(dir, color, touchAreas) {
			var m = new THREE.Matrix4().makeBasis(new THREE.Vector3(dir.y, dir.z, dir.x), dir, new THREE.Vector3(dir.z, dir.x, dir.y));
			var boxGeometry = new THREE.BoxBufferGeometry(boxSize, boxSize, boxSize);
			boxGeometry.applyMatrix(m);
			var box = new THREE.Mesh(boxGeometry, new THREE.MeshBasicMaterial({ color: color, transparent: true }));
			box.userData.color = color;

			if (dir) {
				box.position.copy(dir);
				var lineRadius = window.devicePixelRatio * 0.5 / arrowLength;
				var lineGeometry = new THREE.CylinderBufferGeometry(lineRadius, lineRadius, 1, 4);
				m.setPosition(dir.clone().multiplyScalar(-0.5));
				lineGeometry.applyMatrix(m);
				var line = new THREE.Mesh(lineGeometry, new THREE.MeshBasicMaterial({ color: color, transparent: true }));
				line.renderOrder = 1;
				box.add(line);
				m.setPosition(dir); // set touch box position
			}

			var touchGeometry = new THREE.BoxBufferGeometry(touchBoxSize, touchBoxSize, touchBoxSize);
			touchGeometry.applyMatrix(m);
			touchAreas.add(new THREE.Mesh(touchGeometry, new THREE.MeshBasicMaterial({ opacity: 0.2, transparent: true })));

			return box;
		}

		function createGizmoTriangle(a, b, touchAreas) {
			var lineGeometry = new THREE.BufferGeometry();
			var vertices = new Float32Array(6);
			vertices[ a ] = vertices[ b + 3 ] = 0.7;
			lineGeometry.addAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
			var colors = new Float32Array(6);
			colors[ a ] = colors[ b + 3 ] = 1;
			lineGeometry.addAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
			var line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors, transparent: true, linewidth: window.devicePixelRatio }));
			line.userData.colors = colors;

			var triangleGeometry = new THREE.Geometry();
			var v1 = new THREE.Vector3().setComponent(a, 0.7);
			var v2 = new THREE.Vector3().setComponent(b, 0.7);
			triangleGeometry.vertices.push(new THREE.Vector3(), v1, v2);
			triangleGeometry.faces.push(new THREE.Face3(0, 1, 2));
			var triangle = new THREE.Mesh(triangleGeometry, new THREE.MeshBasicMaterial({ color: 0xFFFF00, opacity: 0.5, transparent: true, side: THREE.DoubleSide, visible: false }));
			triangle.renderOrder = 1;
			line.add(triangle);

			touchAreas.add(triangle.clone());

			return line;
		}

		// create 3 boxes
		this._gizmo.add(createGizmoBox(new THREE.Vector3(1, 0, 0), 0xFF0000, this._touchAreas));
		this._gizmo.add(createGizmoBox(new THREE.Vector3(0, 1, 0), 0x00FF00, this._touchAreas));
		this._gizmo.add(createGizmoBox(new THREE.Vector3(0, 0, 1), 0x0000FF, this._touchAreas));

		// create 3 triangles
		this._gizmo.add(createGizmoTriangle(1, 2, this._touchAreas));
		this._gizmo.add(createGizmoTriangle(2, 0, this._touchAreas));
		this._gizmo.add(createGizmoTriangle(0, 1, this._touchAreas));

		// create box in the center
		boxSize -= 0.1 / arrowLength; // z-fighting fix
		var boxMaterial = new THREE.MeshBasicMaterial({ color: 0xC0C0C0, transparent: true });
		this._gizmo.add(new THREE.Mesh(new THREE.BoxBufferGeometry(boxSize, boxSize, boxSize), boxMaterial));
		this._touchAreas.add(new THREE.Mesh(new THREE.BoxBufferGeometry(touchBoxSize, touchBoxSize, touchBoxSize), new THREE.MeshBasicMaterial()));

		this._axisTitles = this._createAxisTitles();
		this._sceneGizmo.add(this._axisTitles);

		this._updateGizmoPartVisibility();
	};

	ScaleToolGizmo.prototype.hasDomElement = function() {
		return false;
	};

	ScaleToolGizmo.prototype._updateGizmoPartVisibility = function() {
		var screenSystem = this._coordinateSystem === sap.ui.vk.tools.CoordinateSystem.Screen;
		var gizmoObjects = this._gizmo.children,
			touchObjects = this._touchAreas.children;
		gizmoObjects[ 2 ].visible = touchObjects[ 2 ].visible = !screenSystem;
		gizmoObjects[ 3 ].visible = gizmoObjects[ 4 ].visible = touchObjects[ 3 ].visible = touchObjects[ 4 ].visible = !screenSystem && this._nonUniformScaleEnabled;
		gizmoObjects[ 5 ].visible = touchObjects[ 5 ].visible = this._nonUniformScaleEnabled;
		this._axisTitles.children[ 2 ].visible = !screenSystem;
	};

	ScaleToolGizmo.prototype.getCoordinateSystem = function() {
		return this._coordinateSystem;
	};

	ScaleToolGizmo.prototype.setCoordinateSystem = function(coordinateSystem) {
		this._coordinateSystem = coordinateSystem;
		this._updateGizmoPartVisibility();
	};

	ScaleToolGizmo.prototype.getNonUniformScaleEnabled = function(value) {
		return this._nonUniformScaleEnabled;
	};

	ScaleToolGizmo.prototype.setNonUniformScaleEnabled = function(value) {
		this._nonUniformScaleEnabled = !!value;
		this._updateGizmoPartVisibility();
	};

	ScaleToolGizmo.prototype.show = function(viewport, tool) {
		this._viewport = viewport;
		this._tool = tool;
		this._nodes.length = 0;
	};

	ScaleToolGizmo.prototype.hide = function() {
		this._viewport = null;
		this._tool = null;
	};

	ScaleToolGizmo.prototype.getGizmoCount = function() {
		if (this._coordinateSystem === sap.ui.vk.tools.CoordinateSystem.Local) {
			return this._nodes.length;
		} else {
			return this._nodes.length > 0 ? 1 : 0;
		}
	};

	ScaleToolGizmo.prototype.getTouchObject = function(i) {
		if (this._nodes.length === 0) {
			return null;
		}

		this._updateGizmoObjectTransformation(this._touchAreas, i);

		return this._touchAreas;
	};

	ScaleToolGizmo.prototype.highlightHandle = function(index, hoverMode) {
		var highlightAll = (index === 6) || (index >= 0 && !this._nonUniformScaleEnabled);
		var highlighted = [];
		var i, obj;
		for (i = 0; i < 3; i++) {// arrows
			obj = this._gizmo.children[ i ];
			var highlight = highlightAll || (index < 3 ? i === index : ((i === (index + 1) % 3) || (i === (index + 2) % 3)));
			highlighted[ i ] = highlight;
			var color = highlight ? 0xFFFF00 : obj.userData.color;
			obj.material.color.setHex(color); // arrow line color
			obj.children[ 0 ].material.color.setHex(color); // arrow cone color
			obj.children[ 0 ].material.opacity = obj.material.opacity = highlight || hoverMode ? 1 : 0.35;
		}

		for (i = 3; i < 6; i++) {// triangles
			obj = this._gizmo.children[ i ];
			var colorAttr = obj.geometry.attributes.color;
			if (highlightAll || i === index) {
				colorAttr.copyArray([ 1, 1, 0, 1, 1, 0 ]);
			} else {
				colorAttr.copyArray(obj.userData.colors);
			}
			colorAttr.needsUpdate = true;
			obj.material.opacity = hoverMode || i === index ? 1 : 0.35;
			obj.children[ 0 ].material.visible = i === index;
		}

		this._axisTitles.children.forEach(function(obj, i) {
			obj.material.color.setHex(highlighted[ i ] ? 0xFFFF00 : obj.userData.color);
			obj.material.opacity = highlighted[ i ] || hoverMode ? 1 : 0.35;
		});

		obj = this._gizmo.children[ 6 ];
		obj.material.color.setHex(highlightAll ? 0xFFFF00 : 0xC0C0C0);
		obj.material.opacity = highlightAll || hoverMode ? 1 : 0.35;
	};

	ScaleToolGizmo.prototype.beginGesture = function() {
		this._updateSelection(this._viewport._viewStateManager);
		this._matOrigin = this._gizmo.matrixWorld.clone();
		this._nodes.forEach(function(nodeInfo) {
			nodeInfo.scaleOrigin = nodeInfo.node.scale.clone();
			nodeInfo.matOrigin = nodeInfo.node.matrixWorld.clone();
			nodeInfo.matParentInv = new THREE.Matrix4().getInverse(nodeInfo.node.parent.matrixWorld);
		});
	};

	ScaleToolGizmo.prototype.endGesture = function() {
		this._tool.fireScaled({ x: this._gizmoScale.x, y: this._gizmoScale.y, z: this._gizmoScale.z });
		this._gizmoScale.setScalar(1);
	};

	ScaleToolGizmo.prototype._scale = function(scale) {
		this._gizmoScale.copy(scale);

		if (this._coordinateSystem === sap.ui.vk.tools.CoordinateSystem.Local) {
			this._nodes.forEach(function(nodeInfo) {
				nodeInfo.node.scale.copy(nodeInfo.scaleOrigin).multiply(scale);
				nodeInfo.node.matrixWorldNeedsUpdate = true;
			});

			this._viewport._updateBoundingBoxesIfNeeded();
		} else {
			var matScale = this._matOrigin.clone().scale(scale).multiply(new THREE.Matrix4().getInverse(this._matOrigin));

			this._nodes.forEach(function(nodeInfo) {
				if (!nodeInfo.ignore) {
					var node = nodeInfo.node;
					node.matrixWorld.multiplyMatrices(matScale, nodeInfo.matOrigin);
					node.matrix.multiplyMatrices(nodeInfo.matParentInv, node.matrixWorld);
					node.matrix.decompose(node.position, new THREE.Quaternion(), node.scale);
					node.matrixWorldNeedsUpdate = true;
				}
			});
		}

		this._viewport._updateBoundingBoxesTransformation();
		this._viewport.setShouldRenderFrame();
	};

	ScaleToolGizmo.prototype.scale = function(scale) {
		this.beginGesture();
		this._scale(scale);
	};

	ScaleToolGizmo.prototype._setScale = function(scale) {
		if (this._tool.fireEvent("scaling", { x: scale.x, y: scale.y, z: scale.z }, true)) {
			this._scale(scale);
		}
	};

	ScaleToolGizmo.prototype.adjustCameraClipPlanes = function(camera) {
		this._adjustCameraClipPlanes(camera.getCameraRef());
	};

	ScaleToolGizmo.prototype.render = function() {
		jQuery.sap.assert(this._viewport && this._viewport.getMetadata().getName() === "sap.ui.vk.threejs.Viewport", "Can't render gizmo without sap.ui.vk.threejs.Viewport");

		this._updateSelection(this._viewport._viewStateManager);
		if (this._nodes.length > 0) {
			var renderer = this._viewport.getRenderer(),
				camera = this._viewport.getCamera().getCameraRef();

			this._matViewProj.multiplyMatrices(camera.projectionMatrix, new THREE.Matrix4().getInverse(camera.matrixWorld));

			renderer.clearDepth();

			for (var gi = 0, l = this.getGizmoCount(); gi < l; gi++) {
				var scale = this._updateGizmoObjectTransformation(this._gizmo, gi);

				// this._gizmo.scale.setScalar((this._gizmoSize - boxSize / 2) * scale);
				// var i;
				// for (i = 0; i < 3; i++) {
				// 	var l = this._gizmoScale.getComponent(i);
				// 	this._gizmo.children[ i ].position.setComponent(i, l);
				// 	this._gizmo.children[ i ].children[ 0 ].scale.setComponent(i, l);
				// }
				// for (i = 3; i < 6; i++) {
				// 	this._gizmo.children[ i ].scale.copy(this._gizmoScale);
				// }

				// var axisTitleDist = this._gizmoScale.clone().multiplyScalar(this.gizmoSize - boxSize / 2);
				// for (i = 0; i < 3; i++) {
				// 	axisTitleDist.setComponent(i, axisTitleDist.getComponent(i) + 32 * Math.sign(axisTitleDist.getComponent(i)));
				// }
				// this._updateAxisTitles(this._axisTitles, this._gizmo, camera, this.gizmoSize, scale);
				this._updateAxisTitles(this._axisTitles, this._gizmo, camera, this._gizmoSize + 30, scale);

				renderer.render(this._sceneGizmo, camera);
			}
		}
	};

	ScaleToolGizmo.prototype.onBeforeRendering = function() {
		jQuery.sap.assert(false, "ScaleToolGizmo.onBeforeRendering");
	};

	ScaleToolGizmo.prototype.onAfterRendering = function() {
		jQuery.sap.assert(false, "ScaleToolGizmo.onAfterRendering");
	};

	return ScaleToolGizmo;

}, /* bExport= */ true);
