/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.vk.tools.MoveToolGizmo
sap.ui.define([
	"jquery.sap.global", "./library", "./Gizmo"
], function(jQuery, library, Gizmo) {
	"use strict";

	/**
	 * Constructor for a new MoveToolGizmo.
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
	 * @alias sap.ui.vk.tools.MoveToolGizmo
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
	 */
	var MoveToolGizmo = Gizmo.extend("sap.ui.vk.tools.MoveToolGizmo", /** @lends sap.ui.vk.tools.MoveToolGizmo.prototype */ {
		metadata: {
			library: "sap.ui.vk.tools",
			properties: {
			},
			publicMethods: [
				"hasDomElement",
				"getCoordinateSystem",
				"setCoordinateSystem",
				"move",
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

	MoveToolGizmo.prototype.init = function() {
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
		this._gizmoOffset = new THREE.Vector3();

		function createGizmoArrow(dir, color, touchAreas) {
			var arrowLength = 144,
				lineRadius = window.devicePixelRatio * 0.5,
				coneHeight = 32,
				coneRadius = 6,
				touchRadius = 48;
			dir.multiplyScalar(1 / arrowLength);
			var lineGeometry = new THREE.CylinderBufferGeometry(lineRadius, lineRadius, arrowLength - coneHeight, 4);
			var m = new THREE.Matrix4().makeBasis(new THREE.Vector3(dir.y, dir.z, dir.x), dir, new THREE.Vector3(dir.z, dir.x, dir.y));
			m.setPosition(dir.clone().multiplyScalar((arrowLength - coneHeight) * 0.5));
			lineGeometry.applyMatrix(m);
			var line = new THREE.Mesh(lineGeometry, new THREE.MeshBasicMaterial({ color: color, transparent: true }));
			line.matrixAutoUpdate = false;
			line.userData.color = color;

			var coneGeometry = new THREE.CylinderBufferGeometry(0, coneRadius, coneHeight, 12, 1);
			m.setPosition(dir.clone().multiplyScalar(arrowLength - coneHeight * 0.5));
			coneGeometry.applyMatrix(m);
			var cone = new THREE.Mesh(coneGeometry, new THREE.MeshBasicMaterial({ color: color, transparent: true }));
			cone.matrixAutoUpdate = false;
			line.add(cone);

			var touchGeometry = new THREE.CylinderGeometry(touchRadius * 0.5, touchRadius * 0.5, touchRadius, 12, 1);
			touchGeometry.applyMatrix(m);
			var touchGeometry2 = new THREE.CylinderGeometry(touchRadius * 0.5, touchRadius * 0.2, touchRadius, 12, 1);
			m.setPosition(dir.clone().multiplyScalar(arrowLength * 0.5));
			touchGeometry.merge(touchGeometry2, m);
			touchAreas.add(new THREE.Mesh(touchGeometry, new THREE.MeshBasicMaterial()));

			return line;
		}

		function createGizmoPlane(a, b, touchAreas) {
			var colors = new Float32Array(9);
			colors[ a ] = colors[ b + 6 ] = 1;
			colors[ a + 3 ] = colors[ b + 3 ] = 0.5;
			var v1 = new THREE.Vector3().setComponent(a, 0.333);
			var v2 = new THREE.Vector3().setComponent(b, 0.333);
			var geometry = new THREE.Geometry();
			geometry.vertices.push(new THREE.Vector3(), v1, v2, v1.clone().add(v2));
			geometry.faces.push(new THREE.Face3(0, 2, 1), new THREE.Face3(1, 2, 3));
			var material = new THREE.MeshBasicMaterial({ color: 0xFFFF00, opacity: 0.5, transparent: true, visible: false, side: THREE.DoubleSide });
			var plane = new THREE.Mesh(geometry, material);
			plane.matrixAutoUpdate = false;
			plane.userData.colors = colors;

			var lineGeometry = new THREE.BufferGeometry();
			var vertices = new Float32Array(9);
			vertices[ a ] = vertices[ a + 3 ] = vertices[ b + 3 ] = vertices[ b + 6 ] = 0.333;
			lineGeometry.addAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
			lineGeometry.addAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
			var line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors, transparent: true, linewidth: window.devicePixelRatio }));
			line.matrixAutoUpdate = false;
			plane.add(line);

			var touchGeometry = new THREE.Geometry();
			touchGeometry.vertices.push(new THREE.Vector3(), v1, v2, v1.clone().add(v2));
			touchGeometry.faces.push(new THREE.Face3(0, 1, 2), new THREE.Face3(2, 1, 3));
			touchAreas.add(new THREE.Mesh(touchGeometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })));

			return plane;
		}

		// create 3 arrows
		this._gizmo.add(createGizmoArrow(new THREE.Vector3(1, 0, 0), 0xFF0000, this._touchAreas));
		this._gizmo.add(createGizmoArrow(new THREE.Vector3(0, 1, 0), 0x00FF00, this._touchAreas));
		this._gizmo.add(createGizmoArrow(new THREE.Vector3(0, 0, 1), 0x0000FF, this._touchAreas));

		// create 3 planes
		this._gizmo.add(createGizmoPlane(1, 2, this._touchAreas));
		this._gizmo.add(createGizmoPlane(2, 0, this._touchAreas));
		this._gizmo.add(createGizmoPlane(0, 1, this._touchAreas));

		this._axisTitles = this._createAxisTitles();
		this._sceneGizmo.add(this._axisTitles);

		var geometry = new THREE.Geometry();
		geometry.vertices.push(new THREE.Vector3(), new THREE.Vector3());
		this._line = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial());
		this._line.frustumCulled = false;
		this._line.visible = false;
		this._gizmo.add(this._line);
	};

	MoveToolGizmo.prototype.hasDomElement = function() {
		return false;
	};

	MoveToolGizmo.prototype.getCoordinateSystem = function() {
		return this._coordinateSystem;
	};

	MoveToolGizmo.prototype.setCoordinateSystem = function(coordinateSystem) {
		this._coordinateSystem = coordinateSystem;
		var screenSystem = coordinateSystem === sap.ui.vk.tools.CoordinateSystem.Screen;
		var gizmoObjects = this._gizmo.children,
			touchObjects = this._touchAreas.children;
		gizmoObjects[ 2 ].visible = gizmoObjects[ 3 ].visible = gizmoObjects[ 4 ].visible = !screenSystem;
		touchObjects[ 2 ].visible = touchObjects[ 3 ].visible = touchObjects[ 4 ].visible = !screenSystem;
		this._axisTitles.children[ 2 ].visible = !screenSystem;
	};

	MoveToolGizmo.prototype.show = function(viewport, tool) {
		this._viewport = viewport;
		this._tool = tool;
		this._nodes.length = 0;
	};

	MoveToolGizmo.prototype.hide = function() {
		this._viewport = null;
		this._tool = null;
	};

	MoveToolGizmo.prototype.getGizmoCount = function() {
		if (this._coordinateSystem === sap.ui.vk.tools.CoordinateSystem.Local) {
			return this._nodes.length;
		} else {
			return this._nodes.length > 0 ? 1 : 0;
		}
	};

	MoveToolGizmo.prototype.getTouchObject = function(i) {
		if (this._nodes.length === 0) {
			return null;
		}

		this._updateGizmoObjectTransformation(this._touchAreas, i);

		return this._touchAreas;
	};

	MoveToolGizmo.prototype.highlightHandle = function(index, hoverMode) {
		var i, highlighted = [];
		for (i = 0; i < 3; i++) {// arrows
			var arrow = this._gizmo.children[ i ];
			var highlight = (index < 3 ? i === index : ((i === (index + 1) % 3) || (i === (index + 2) % 3)));
			highlighted[ i ] = highlight;
			var color = highlight ? 0xFFFF00 : arrow.userData.color;
			arrow.material.color.setHex(color); // arrow line color
			arrow.material.opacity = (highlight || hoverMode) ? 1 : 0.35;
			arrow.children[ 0 ].material.color.setHex(color); // arrow cone color
			arrow.children[ 0 ].material.opacity = (highlight || hoverMode) ? 1 : 0.35;
		}

		for (i = 3; i < 6; i++) {// planes
			var plane = this._gizmo.children[ i ];
			plane.material.visible = i === index;

			var colorAttr = plane.children[ 0 ].geometry.attributes.color;
			if (i === index) {
				colorAttr.copyArray([ 1, 1, 0, 1, 1, 0, 1, 1, 0 ]);
			} else {
				colorAttr.copyArray(plane.userData.colors);
			}
			colorAttr.needsUpdate = true;
			plane.children[ 0 ].material.opacity = (i === index || hoverMode) ? 1 : 0.35;
			// plane.children[0].material.color.setHex(i === index ? 0xFFFF00 : 0xD0D0D0); // line
		}

		this._axisTitles.children.forEach(function(obj, i) {
			obj.material.color.setHex(highlighted[ i ] ? 0xFFFF00 : obj.userData.color);
			obj.material.opacity = highlighted[ i ] || hoverMode ? 1 : 0.35;
		});
	};

	MoveToolGizmo.prototype.beginGesture = function() {
		this._updateSelection(this._viewport._viewStateManager);
		this._matOrigin = this._gizmo.matrixWorld.clone();
		this._nodes.forEach(function(nodeInfo) {
			var node = nodeInfo.node;
			nodeInfo.matOrigin = node.matrixWorld.clone();
			nodeInfo.originLocal = node.position.clone();
			nodeInfo.origin = new THREE.Vector3().setFromMatrixPosition(node.matrixWorld);
			nodeInfo.matParentInv = new THREE.Matrix4().getInverse(node.parent.matrixWorld);
		});
	};

	MoveToolGizmo.prototype.endGesture = function() {
		this._line.visible = false;
		this._tool.fireMoved({ x: this._gizmoOffset.x, y: this._gizmoOffset.y, z: this._gizmoOffset.z });
	};

	MoveToolGizmo.prototype._setOffset = function(offset, gizmoIndex) {
		if (this._coordinateSystem === sap.ui.vk.tools.CoordinateSystem.Local) {
			// transform offset from world space to gizmo's local space
			var nodeInfo = this._nodes[ gizmoIndex ];
			var matInv = new THREE.Matrix4().getInverse(nodeInfo.node.matrixWorld);
			var scale = new THREE.Vector3().setFromMatrixScale(nodeInfo.node.matrixWorld);
			var originPos = nodeInfo.origin.clone().applyMatrix4(matInv);
			offset = nodeInfo.origin.clone().add(offset).applyMatrix4(matInv).sub(originPos).multiply(scale);
		} else if (this._coordinateSystem === sap.ui.vk.tools.CoordinateSystem.Screen) {
			// transform offset from world space to screen space
			var size = this._viewport.getRenderer().getSize();
			var pos1 = this._gizmo.position.clone().applyMatrix4(this._matViewProj);
			var pos2 = this._gizmo.position.clone().add(offset).applyMatrix4(this._matViewProj);
			offset.set(Math.round((pos2.x - pos1.x) * 0.5 * size.width), Math.round((pos2.y - pos1.y) * 0.5 * size.height), 0);
		}

		if (this._tool.fireEvent("moving", { x: offset.x, y: offset.y, z: offset.z }, true)) {
			this._move(offset);

			if (this._coordinateSystem === sap.ui.vk.tools.CoordinateSystem.Screen) {// transform offset from world space to local space of gizmo
				offset.set(new THREE.Vector3().setFromMatrixColumn(this._matOrigin, 0).normalize().dot(offset), new THREE.Vector3().setFromMatrixColumn(this._matOrigin, 1).normalize().dot(offset), 0);
			}

			// update line mesh
			this._line.geometry.vertices[ 0 ].setScalar(0).sub(offset);
			this._line.geometry.verticesNeedUpdate = true;
			offset.set(Math.abs(offset.x), Math.abs(offset.y), Math.abs(offset.z));
			offset.multiplyScalar(1 / Math.max(offset.x, offset.y, offset.z));
			this._line.material.color.setRGB(offset.x, offset.y, offset.z);
			this._line.visible = true;
		}
	};

	MoveToolGizmo.prototype._move = function(offset) {
		this._gizmoOffset.copy(offset);

		if (this._coordinateSystem === sap.ui.vk.tools.CoordinateSystem.Local) {
			this._nodes.forEach(function(nodeInfo) {
				var node = nodeInfo.node;
				var basis = this._extractBasis(node.matrixWorld);
				var pos = nodeInfo.origin.clone();
				pos.add(basis[ 0 ].multiplyScalar(offset.x)).add(basis[ 1 ].multiplyScalar(offset.y)).add(basis[ 2 ].multiplyScalar(offset.z));
				node.matrixWorld.setPosition(pos);
				node.matrix.multiplyMatrices(nodeInfo.matParentInv, node.matrixWorld);
				node.position.setFromMatrixPosition(node.matrix);
			}.bind(this));

			this._viewport._updateBoundingBoxesIfNeeded();
		} else {
			if (this._coordinateSystem === sap.ui.vk.tools.CoordinateSystem.Screen) {
				// transform offset from screen space to world space
				var size = this._viewport.getRenderer().getSize();
				var camera = this._viewport.getCamera().getCameraRef();
				var origin = new THREE.Vector4().copy(this._gizmo.position).applyMatrix4(this._matViewProj);
				var dx = offset.x * 2 * origin.w / (camera.projectionMatrix.elements[ 0 ] * size.width);
				var dy = offset.y * 2 * origin.w / (camera.projectionMatrix.elements[ 5 ] * size.height);
				offset.setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(dx);
				offset.add(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1).multiplyScalar(dy));
			}

			this._gizmo.position.setFromMatrixPosition(this._matOrigin).add(offset);
			this._nodes.forEach(function(nodeInfo) {
				if (!nodeInfo.ignore) {
					var node = nodeInfo.node;
					node.matrixWorld.setPosition(nodeInfo.origin.clone().add(offset));
					node.matrix.multiplyMatrices(nodeInfo.matParentInv, node.matrixWorld);
					node.position.setFromMatrixPosition(node.matrix);
				}
			});
		}

		this._viewport._updateBoundingBoxesTransformation();
		this._viewport.setShouldRenderFrame();
	};

	MoveToolGizmo.prototype.move = function(offset) {
		this.beginGesture();
		this._move(new THREE.Vector3().set(offset.x, offset.y, offset.z || 0));
	};

	MoveToolGizmo.prototype.adjustCameraClipPlanes = function(camera) {
		this._adjustCameraClipPlanes(camera.getCameraRef());
	};

	MoveToolGizmo.prototype.render = function() {
		jQuery.sap.assert(this._viewport && this._viewport.getMetadata().getName() === "sap.ui.vk.threejs.Viewport", "Can't render gizmo without sap.ui.vk.threejs.Viewport");

		this._updateSelection(this._viewport._viewStateManager);
		if (this._nodes.length > 0) {
			var renderer = this._viewport.getRenderer(),
				camera = this._viewport.getCamera().getCameraRef();

			this._matViewProj.multiplyMatrices(camera.projectionMatrix, new THREE.Matrix4().getInverse(camera.matrixWorld));

			renderer.clearDepth();

			for (var i = 0, l = this.getGizmoCount(); i < l; i++) {
				var scale = this._updateGizmoObjectTransformation(this._gizmo, i);
				this._updateAxisTitles(this._axisTitles, this._gizmo, camera, this._gizmoSize + 18, scale);
				this._line.scale.setScalar(1 / (this._gizmoSize * scale));
				renderer.render(this._sceneGizmo, camera);
			}
		}
	};

	MoveToolGizmo.prototype.onBeforeRendering = function() {
		jQuery.sap.assert(false, "MoveToolGizmo.onBeforeRendering");
	};

	MoveToolGizmo.prototype.onAfterRendering = function() {
		jQuery.sap.assert(false, "MoveToolGizmo.onAfterRendering");
	};

	return MoveToolGizmo;

}, /* bExport= */ true);
