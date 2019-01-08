/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides base for all gizmo controls sap.ui.vk.tools namespace.
sap.ui.define([
	"jquery.sap.global", "./library", "sap/ui/core/Control"
], function(jQuery, library, Control) {
	"use strict";

	/**
	 * Constructor for base of all Gizmo Controls.
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
	 * @alias sap.ui.vk.tools.Gizmo
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
	 */
	var Gizmo = Control.extend("sap.ui.vk.tools.Gizmo", /** @lends sap.ui.vk.tools.Gizmo.prototype */ {
		metadata: {
			library: "sap.ui.vk.tools",
			properties: {
			},
			publicMethods: [
				"hasDomElement"
			],
			events: {},
			associations: {
			},
			aggregations: {
			}
		}
	});

	Gizmo.prototype.hasDomElement = function() {
		return true;
	};

	Gizmo.prototype._createAxisTitles = function(size, fontSize, drawCircle) {
		size = size || 32;
		fontSize = fontSize || 20;
		function createTextMesh(text, color) {
			var canvas = document.createElement("canvas");
			canvas.width = canvas.height = size * window.devicePixelRatio;
			var ctx = canvas.getContext("2d");
			// ctx.fillStyle = "#888";
			// ctx.globalAlpha = 0.2;
			// ctx.fillRect(0, 0, canvas.width, canvas.height);
			// ctx.globalAlpha = 1;
			// var textColor = (drawCircle ? color : 0xFFFFFF).toString(16);
			// textColor = "#" + "000000".substring(textColor.length) + textColor;

			var halfSize = canvas.width * 0.5;
			ctx.font = "Bold " + fontSize * window.devicePixelRatio + "px Arial";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			// draw shadow
			ctx.fillStyle = "#000";
			ctx.globalAlpha = 0.5;
			ctx.filter = "blur(3px)";
			ctx.fillText(text, halfSize + 1, halfSize + 1);
			// draw text
			ctx.fillStyle = "#fff";
			ctx.globalAlpha = 1;
			ctx.filter = "blur(0px)";
			ctx.fillText(text, halfSize, halfSize);

			if (drawCircle) {// draw circle border
				ctx.beginPath();
				ctx.arc(halfSize, halfSize, halfSize - window.devicePixelRatio, 0, 2 * Math.PI, false);
				ctx.closePath();
				ctx.lineWidth = window.devicePixelRatio * 2;
				ctx.strokeStyle = "#fff";
				ctx.stroke();
			}

			var texture = new THREE.Texture(canvas);
			texture.needsUpdate = true;

			var material = new THREE.MeshBasicMaterial({
				map: texture,
				color: color,
				transparent: true,
				alphaTest: 0.05,
				premultipliedAlpha: true,
				side: THREE.DoubleSide
			});

			var mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
			mesh.userData.color = color;
			// if (drawCircle) {
			// 	var geometry = new THREE.CircleBufferGeometry(15, 16);
			// 	var circle = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xc0c0c0, opacity: 0.75, transparent: true, depthTest: false }));
			// 	circle.renderOrder = 1;
			// 	mesh.renderOrder = 2;
			// 	mesh.material.depthTest = false;
			// 	mesh.add(circle);
			// }
			return mesh;
		}

		var group = new THREE.Group();
		group.add(createTextMesh("X", 0xFF0000));
		group.add(createTextMesh("Y", 0x00FF00));
		group.add(createTextMesh("Z", 0x0000FF));
		return group;
	};

	Gizmo.prototype._extractBasis = function(matrix) {
		var basis = [ new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3() ];
		matrix.extractBasis(basis[ 0 ], basis[ 1 ], basis[ 2 ]);
		basis[ 0 ].normalize(); basis[ 1 ].normalize(); basis[ 2 ].normalize();
		return basis;
	};

	Gizmo.prototype._updateAxisTitles = function(obj, gizmo, camera, distance, scale) {
		var basis = this._extractBasis(gizmo.matrixWorld);

		obj.children.forEach(function(child, i) {
			child.position.copy(basis[ i ]).multiplyScalar(distance.constructor === THREE.Vector3 ? distance.getComponent(i) : distance);
			child.quaternion.copy(camera.quaternion);
		});

		obj.position.copy(gizmo.position);
		obj.scale.setScalar(scale);
	};

	Gizmo.prototype._updateSelection = function(viewStateManager) {
		var nodes = [];
		viewStateManager.enumerateSelection(function(nodeRef) {
			nodes.push({ node: nodeRef });
		});
		if (this._nodes.length === nodes.length && this._nodes.every(function(v, i) { return nodes[ i ].node === v.node; })) {
			return false;
		}

		this._nodes = nodes;

		nodes.forEach(function(nodeInfo) {
			nodeInfo.ignore = false; // multiple transformation fix (parent transformation + child transformation)
			var parent = nodeInfo.node.parent;
			while (parent && !nodeInfo.ignore) {
				for (var i = 0, l = nodes.length; i < l; i++) {
					if (nodes[ i ].node === parent) {
						nodeInfo.ignore = true;
						break;
					}
				}
				parent = parent.parent;
			}
		});

		return true;
	};

	Gizmo.prototype._updateGizmoObjectTransformation = function(obj, i) {
		var renderer = this._viewport.getRenderer(),
			camera = this._viewport.getCamera().getCameraRef();
		var pos, scale;
		if (this._coordinateSystem === sap.ui.vk.tools.CoordinateSystem.Local) {
			var node = this._nodes[ i ].node;
			obj.matrixAutoUpdate = false;
			node.matrixWorld.decompose(obj.position, obj.quaternion, obj.scale);
			pos = new THREE.Vector4().copy(obj.position).applyMatrix4(this._matViewProj);
			scale = pos.w * renderer.getPixelRatio() / (renderer.getSize().width * camera.projectionMatrix.elements[ 0 ]);
			var basis = this._extractBasis(node.matrixWorld);
			obj.matrix.makeBasis(basis[ 0 ], basis[ 1 ], basis[ 2 ]);
			obj.matrix.scale(new THREE.Vector3().setScalar(this._gizmoSize * scale));
			obj.matrix.copyPosition(node.matrixWorld);
		} else if (this._nodes.length > 0) {
			obj.matrixAutoUpdate = true;

			if (this._nodes.length === 1) {
				obj.position.setFromMatrixPosition(this._nodes[ 0 ].node.matrixWorld);
			} else {
				obj.position.setScalar(0);
				this._nodes.forEach(function(nodeInfo) {
					var node = nodeInfo.node;
					if (node.userData.boundingBox) {
						obj.position.add(node.userData.boundingBox.getCenter().applyMatrix4(node.matrixWorld));
					} else {
						obj.position.add(new THREE.Vector3().setFromMatrixPosition(node.matrixWorld));
					}
				});
				obj.position.multiplyScalar(1 / this._nodes.length);
			}

			if (this._coordinateSystem === sap.ui.vk.tools.CoordinateSystem.Screen) {
				obj.quaternion.copy(camera.quaternion);
			} else if (this._coordinateSystem === sap.ui.vk.tools.CoordinateSystem.World) {
				obj.quaternion.set(0, 0, 0, 1);
			}
			pos = new THREE.Vector4().copy(obj.position).applyMatrix4(this._matViewProj);
			scale = pos.w * renderer.getPixelRatio() / (renderer.getSize().width * camera.projectionMatrix.elements[ 0 ]);
			obj.scale.setScalar(this._gizmoSize * scale);
		}

		obj.updateMatrixWorld(true);
		return scale;
	};

	Gizmo.prototype._adjustCameraClipPlanes = function(camera) {
		var renderer = this._viewport.getRenderer(),
			size = this._gizmoSize * renderer.getPixelRatio() / (renderer.getSize().width * camera.projectionMatrix.elements[ 0 ]);

		if (camera.isPerspectiveCamera) {
			camera.far += camera.far * size;
			camera.near = Math.max(camera.near - camera.near * size, camera.far * 0.001);
		} else if (camera.isOrthographicCamera) {
			camera.near -= size;
			camera.far += size;
		}
		camera.updateProjectionMatrix();
	};

	return Gizmo;

}, /* bExport= */ true);
