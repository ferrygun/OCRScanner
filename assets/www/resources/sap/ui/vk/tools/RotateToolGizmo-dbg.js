/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.vk.tools.RotateToolGizmo
sap.ui.define([
	"jquery.sap.global", "./library", "./Gizmo"
], function(jQuery, library, Gizmo) {
	"use strict";

	/**
	 * Constructor for a new RotateToolGizmo.
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
	 * @alias sap.ui.vk.tools.RotateToolGizmo
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
	 */
	var RotateToolGizmo = Gizmo.extend("sap.ui.vk.tools.RotateToolGizmo", /** @lends sap.ui.vk.tools.RotateToolGizmo.prototype */ {
		metadata: {
			library: "sap.ui.vk.tools",
			properties: {
			},
			publicMethods: [
				"hasDomElement",
				"getCoordinateSystem",
				"setCoordinateSystem",
				"rotate",
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

	RotateToolGizmo.prototype.init = function() {
		if (Gizmo.prototype.init) {
			Gizmo.prototype.init.apply(this);
		}

		this._viewport = null;
		this._tool = null;
		this._sceneGizmo = new THREE.Scene();
		this._gizmo = new THREE.Group();
		this._touchAreas = new THREE.Group();
		this._sceneGizmo.add(this._gizmo);
		// this._sceneGizmo.add(this._touchAreas);
		this._coordinateSystem = sap.ui.vk.tools.CoordinateSystem.Local;
		this._nodes = [];
		this._matViewProj = new THREE.Matrix4();
		this._gizmoSize = 144;
		this._gizmoRotation = new THREE.Vector3();

		function createGizmoCircle(axis, color, radius, segments) {
			var geometry = new THREE.TorusBufferGeometry(radius, window.devicePixelRatio / 288, 4, segments);
			if (axis === 0) {
				geometry.rotateY(Math.PI / 2);
			} else if (axis === 1) {
				geometry.rotateX(Math.PI / 2);
			}
			var circle = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: color, transparent: true }));
			circle.matrixAutoUpdate = false;
			circle.userData.color = color;

			return circle;
		}

		function createTouchCircle(axis, radius, segments) {
			var geometry = new THREE.TorusBufferGeometry(radius, 24 / 144, 4, segments);
			if (axis === 0) {
				geometry.rotateY(Math.PI / 2);
			} else if (axis === 1) {
				geometry.rotateX(Math.PI / 2);
			}
			return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ opacity: 0.2, transparent: true }));
		}

		// create 3 circles
		for (var i = 0; i < 3; i++) {
			this._gizmo.add(createGizmoCircle(i, 0xFF << 8 * (2 - i), 1, 128));

			this._touchAreas.add(createTouchCircle(i, 1, 24));
			// this._touchAreas.add(new THREE.Mesh(new THREE.CircleGeometry(24, 12), new THREE.MeshBasicMaterial())); // touch radius 24 pixels
		}

		this._gizmo.add(new THREE.AxisHelper(0.75));

		var arcMaterial = new THREE.MeshBasicMaterial({ color: 0x0080FF, opacity: 0.5, transparent: true, side: THREE.DoubleSide });
		this._arcMesh = new THREE.Mesh(new THREE.Geometry(), arcMaterial);
		this._arcMesh.drawMode = THREE.TriangleFanDrawMode;
		this._arcMesh.visible = false;
		this._gizmo.add(this._arcMesh);

		this._axisTitles = this._createAxisTitles();
		this._sceneGizmo.add(this._axisTitles);
	};

	RotateToolGizmo.prototype.hasDomElement = function() {
		return false;
	};

	RotateToolGizmo.prototype.getCoordinateSystem = function() {
		return this._coordinateSystem;
	};

	RotateToolGizmo.prototype.setCoordinateSystem = function(coordinateSystem) {
		this._coordinateSystem = coordinateSystem;
		var screenSystem = coordinateSystem === sap.ui.vk.tools.CoordinateSystem.Screen;
		this._gizmo.children[ 0 ].visible = this._gizmo.children[ 1 ].visible = !screenSystem;
		this._touchAreas.children[ 0 ].visible = this._touchAreas.children[ 1 ].visible = !screenSystem;
		this._axisTitles.visible = !screenSystem;
	};

	RotateToolGizmo.prototype.show = function(viewport, tool) {
		this._viewport = viewport;
		this._tool = tool;
		this._nodes.length = 0;
	};

	RotateToolGizmo.prototype.hide = function() {
		this._viewport = null;
		this._tool = null;
	};

	RotateToolGizmo.prototype.getGizmoCount = function() {
		if (this._coordinateSystem === sap.ui.vk.tools.CoordinateSystem.Local) {
			return this._nodes.length;
		} else {
			return this._nodes.length > 0 ? 1 : 0;
		}
	};

	RotateToolGizmo.prototype.getTouchObject = function(i) {
		if (this._nodes.length === 0) {
			return null;
		}

		this._updateGizmoObjectTransformation(this._touchAreas, i);

		return this._touchAreas;
	};

	RotateToolGizmo.prototype.getGizmoObject = function() {
		return this._nodes.length > 0 ? this._gizmo : null;
	};

	RotateToolGizmo.prototype.highlightHandle = function(index, hoverMode) {
		for (var i = 0; i < 3; i++) {// circles
			var arrow = this._gizmo.children[ i ];
			var color = i === index ? 0xFFFF00 : arrow.userData.color;
			arrow.material.color.setHex(color); // circle color
			// arrow.material.opacity = (i === index || hoverMode) ? 1 : 0.35;
			arrow.material.opacity = index === -1 || i === index ? 1 : 0.35;
			// arrow.material.transparent = !hoverMode;
			arrow.material.visible = hoverMode || i === index;
		}

		this._axisTitles.children.forEach(function(obj, i) {
			obj.material.color.setHex(i === index ? 0xFFFF00 : obj.userData.color);
			obj.material.opacity = index === -1 || i === index ? 1 : 0.35;
			obj.material.visible = hoverMode || i === index;
		});
	};

	RotateToolGizmo.prototype.beginGesture = function() {
		this._updateSelection(this._viewport._viewStateManager);
		this._matOrigin = this._gizmo.matrixWorld.clone();
		this._nodes.forEach(function(nodeInfo) {
			nodeInfo.node.parent.updateMatrixWorld(true);
			nodeInfo.matOrigin = nodeInfo.node.matrixWorld.clone();
			nodeInfo.matLocalOrigin = nodeInfo.node.matrix.clone();
			nodeInfo.matParentInv = new THREE.Matrix4().getInverse(nodeInfo.node.parent.matrixWorld);
			nodeInfo.quaternion = nodeInfo.node.quaternion.clone();
		});
	};

	RotateToolGizmo.prototype.endGesture = function() {
		this._arcMesh.visible = false;
		this._tool.fireRotated({ x: this._gizmoRotation.x, y: this._gizmoRotation.y, z: this._gizmoRotation.z });
	};

	RotateToolGizmo.prototype._rotate = function(euler) {
		this._gizmoRotation.set(THREE.Math.radToDeg(euler.x), THREE.Math.radToDeg(euler.y), THREE.Math.radToDeg(euler.z));

		var quat = new THREE.Quaternion();
		if (this._coordinateSystem === sap.ui.vk.tools.CoordinateSystem.Local) {
			quat.setFromEuler(euler);
			this._nodes.forEach(function(nodeInfo) {
				nodeInfo.node.quaternion.copy(nodeInfo.quaternion).multiply(quat);
				nodeInfo.node.matrixWorldNeedsUpdate = true;
			});

			this._viewport._updateBoundingBoxesIfNeeded();
		} else {
			euler = euler.toArray();
			for (var i = 0; i < 3; i++) {
				var angle = euler[ i ];
				if (angle) {
					var axisIndex = euler[ 3 ].charCodeAt(i) - 88; // 88 = char code of 'X'
					if (axisIndex >= 0 && axisIndex < 3) {
						var axis = new THREE.Vector3().setFromMatrixColumn(this._matOrigin, axisIndex).normalize();
						var matRotate = new THREE.Matrix4().makeRotationAxis(axis, angle);
						var pos = new THREE.Vector3().setFromMatrixPosition(this._matOrigin);
						matRotate.setPosition(pos.sub(pos.clone().applyMatrix4(matRotate)));

						for (var ni = 0, nc = this._nodes.length; ni < nc; ni++) {
							var nodeInfo = this._nodes[ni];
							if (!nodeInfo.ignore) {
								var node = nodeInfo.node;
								node.position.setFromMatrixPosition(nodeInfo.matOrigin).applyMatrix4(matRotate).applyMatrix4(nodeInfo.matParentInv);

								var scale = new THREE.Vector3().setFromMatrixScale(nodeInfo.matOrigin);
								var localAxis = axis.clone().transformDirection(new THREE.Matrix4().getInverse(nodeInfo.matOrigin)).multiply(scale).normalize();
								quat.setFromAxisAngle(localAxis, angle);
								node.quaternion.copy(nodeInfo.quaternion).multiply(quat);
								node.matrixWorldNeedsUpdate = true;
							}
						}
					}
				}
			}
		}

		this._viewport._updateBoundingBoxesTransformation();
		this._viewport.setShouldRenderFrame();
	};

	RotateToolGizmo.prototype._setRotationAxisAngle = function(axisIndex, angle1, angle2) {
		var deltaAngle = angle2 - angle1;
		if (Math.abs(deltaAngle) > Math.PI) {
			deltaAngle -= Math.PI * 2 * Math.sign(deltaAngle);
		}

		var euler = [ 0, 0, 0 ];
		euler[ axisIndex ] = deltaAngle;
		euler = new THREE.Euler().fromArray(euler);

		if (this._tool.fireEvent("rotating", { x: THREE.Math.radToDeg(euler.x), y: THREE.Math.radToDeg(euler.y), z: THREE.Math.radToDeg(euler.z) }, true)) {
			this._rotate(euler);

			// update arc mesh
			var vertices = [ 0, 0, 0 ];
			var dir = new THREE.Vector3();
			var i1 = (axisIndex + 1) % 3,
				i2 = (axisIndex + 2) % 3;
			var n = Math.max(Math.ceil(Math.abs(deltaAngle) * 64 / Math.PI), 1);
			deltaAngle *= this._coordinateSystem === sap.ui.vk.tools.CoordinateSystem.Local ? -1 : 1;
			for (var i = 0; i <= n; i++) {
				var a = angle1 + deltaAngle * (i / n);
				dir.set(0, 0, 0).setComponent(i1, Math.cos(a)).setComponent(i2, Math.sin(a));
				vertices.push(dir.x, dir.y, dir.z);
			}

			this._arcMesh.geometry = new THREE.BufferGeometry().addAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
			this._arcMesh.visible = true;
		}
	};

	RotateToolGizmo.prototype.rotate = function(angles) {
		this.beginGesture();
		this._rotate(new THREE.Euler(THREE.Math.degToRad(angles.x || 0), THREE.Math.degToRad(angles.y || 0), THREE.Math.degToRad(angles.z || 0)));
	};

	RotateToolGizmo.prototype.adjustCameraClipPlanes = function(camera) {
		this._adjustCameraClipPlanes(camera.getCameraRef());
	};

	RotateToolGizmo.prototype.render = function() {
		jQuery.sap.assert(this._viewport && this._viewport.getMetadata().getName() === "sap.ui.vk.threejs.Viewport", "Can't render gizmo without sap.ui.vk.threejs.Viewport");

		this._updateSelection(this._viewport._viewStateManager);
		if (this._nodes.length > 0) {
			var renderer = this._viewport.getRenderer(),
				camera = this._viewport.getCamera().getCameraRef();

			this._matViewProj.multiplyMatrices(camera.projectionMatrix, new THREE.Matrix4().getInverse(camera.matrixWorld));

			renderer.clearDepth();

			for (var i = 0, l = this.getGizmoCount(); i < l; i++) {
				var scale = this._updateGizmoObjectTransformation(this._gizmo, i);
				this._updateAxisTitles(this._axisTitles, this._gizmo, camera, this._gizmoSize - 18, scale);
				renderer.render(this._sceneGizmo, camera);
			}
		}
	};

	RotateToolGizmo.prototype.onBeforeRendering = function() {
		jQuery.sap.assert(false, "RotateToolGizmo.onBeforeRendering");
	};

	RotateToolGizmo.prototype.onAfterRendering = function() {
		jQuery.sap.assert(false, "RotateToolGizmo.onAfterRendering");
	};

	return RotateToolGizmo;

}, /* bExport= */ true);
