/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.vk.helpers.CameraControllerThree.
sap.ui.define([
    "jquery.sap.global", "sap/ui/core/Element", "../threejs/thirdparty/three"
], function(jQuery, Element, threeJs) {
	"use strict";

	var CameraControllerThree = Element.extend("sap.ui.vk.helpers.CameraControllerThree", {
		metadata: {
			publicMethods: [
				"rotate"
			]
		},
		constructor: function(viewport, isTurnTableMode) {
			// target of interaction
			var gestureTarget = new THREE.Vector3(); // center of interaction
			var zoomTarget = new THREE.Vector2();
			var objectWasHit = false;

			// turn table const
			var ANGLE_EPSILON = 0.001;
			var MIN_PITCH = -Math.PI / 2 + ANGLE_EPSILON;
			var MAX_PITCH = Math.PI / 2 - ANGLE_EPSILON;

			// rotation
			var sphericalDelta = new THREE.Spherical();

			// pan
			var panOffset = new THREE.Vector3();

			this.isTurnTableMode = isTurnTableMode || true; // true by default

			function calcCenter(root) {
				var minPoint = new THREE.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
				var maxPoint = new THREE.Vector3(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);

				root.traverse(function(object) {
					if (object instanceof THREE.Mesh) {

						var p = new THREE.Vector3();
						p.applyMatrix4(object.matrixWorld);

						minPoint.x = Math.min(minPoint.x, p.x);
						minPoint.y = Math.min(minPoint.y, p.y);
						minPoint.z = Math.min(minPoint.z, p.z);

						maxPoint.x = Math.max(maxPoint.x, p.x);
						maxPoint.y = Math.max(maxPoint.y, p.y);
						maxPoint.z = Math.max(maxPoint.z, p.z);

					}
				});
				return minPoint.add(maxPoint).multiplyScalar(0.5);
			}

			this.beginGesture = function(x, y) {
				var element = viewport.getRenderer().domElement;
				var scene = viewport.getScene().getSceneRef();
				var camera = viewport.getCamera().getCameraRef();

				var normalisedX = (x - element.offsetLeft) / element.width * 2 - 1;
				var normalisedY = (element.offsetTop - y) / element.height * 2 + 1;
				zoomTarget.x = normalisedX;
				zoomTarget.y = normalisedY;

				var hit = viewport.hitTest(x, y, scene, camera);

				if (hit) {
					gestureTarget.copy(hit.point);
					objectWasHit = true;
				} else {
					/*
						* TO DO:
						* Maybe get the center from the scene from somewhere instead of calculating this everytime.
						*/
					gestureTarget = calcCenter(scene);
					objectWasHit = false;
				}
			};

			this.endGesture = function() {
				objectWasHit = false;
			};

			function panLeft(distance, matrix) {
				var v = new THREE.Vector3();
				v.setFromMatrixColumn(matrix, 0); // get X axis
				v.multiplyScalar(-distance);

				return v;
			}

			function panUp(distance, matrix) {
				var v = new THREE.Vector3();
				v.setFromMatrixColumn(matrix, 1); // get Y axis
				v.multiplyScalar(distance);

				return v;
			}

			this.pan = function(dx, dy) {
				if (dx === 0 && dy === 0) {
					return;
				}

				var camera = viewport.getCamera().getCameraRef();
				var center = new THREE.Vector3().copy(gestureTarget);

				var element = viewport.getRenderer().domElement;
				var halfHeight = element.height / 2;

				if (camera.isPerspectiveCamera) {
					var leng = new THREE.Vector3().subVectors(camera.position, center).length();
					var halfFov = camera.fov / 180 * Math.PI / 2; // half vertical fov
					var k = halfHeight / Math.tan(halfFov);
					dx = dx * leng / k;
					dy = dy * leng / k;


				} else if (camera.isOrthographicCamera) {
					dx = dx / camera.zoom;
					dy = dy / camera.zoom;

				} else {
					jQuery.sap.log.error("threejs.ViewportGestureHandler: unsupported camera type");
				}

				panOffset.add(panLeft(dx, camera.matrix));
				panOffset.add(panUp(dy, camera.matrix));
			};

			this.rotate = function(dx, dy) {
				if (dx === 0 && dy === 0) {
					return;
				}

				sphericalDelta.theta -= (dx * 0.01); // rotate left
				sphericalDelta.phi += (dy * 0.01); // rotate up
			};


			this.zoom = function(zoomFactorScaler) {
				if (zoomFactorScaler === 0 || zoomFactorScaler === 1) {
					return;
				}

				var camera = viewport.getCamera().getCameraRef();
				var delta = new THREE.Vector3();
				var ori, target;

				if (camera.isPerspectiveCamera) {

					if (objectWasHit) {
						ori = new THREE.Vector3(zoomTarget.x, zoomTarget.y, -1).unproject(camera);
						target = new THREE.Vector3(zoomTarget.x, zoomTarget.y, 1).unproject(camera);

						target.sub(ori);
						delta.copy(target);
					} else {
						delta.copy(camera.getWorldDirection());
					}

					var zoomDirection = new THREE.Vector3().copy(gestureTarget).sub(camera.position);
					var leng = zoomDirection.length();

					delta.normalize();
					delta.multiplyScalar(leng);
					delta.multiplyScalar(1 - 1 / zoomFactorScaler);


				} else if (camera.isOrthographicCamera) {

					if (objectWasHit) {
						ori = new THREE.Vector3(0, 0, 1).unproject(camera);
						target = new THREE.Vector3(zoomTarget.x, zoomTarget.y, 1).unproject(camera);
						target.sub(ori);

						delta.copy(target);
					}

					delta.multiplyScalar(1 - 1 / zoomFactorScaler);

					camera.zoom *= zoomFactorScaler;
					camera.updateProjectionMatrix();
				} else {
					jQuery.sap.log.error("threejs.ViewportGestureHandler: unsupported camera type");
				}
				panOffset.add(delta);
			};

			function createPitchAxis(yaw, pitch) {
				var sy = Math.sin(yaw);
				var cy = Math.cos(yaw);
				var sp = Math.sin(pitch);
				var cp = Math.cos(pitch);
				var z = cy * cp;
				var x = sy * cp;
				var y = sp;
				return new THREE.Vector3(x, y, z);
			}

			function clamp(number, min, max) {
				return Math.max(min, Math.min(number, max));
			}

			this.update = function() {
				var camera = viewport.getCamera().getCameraRef();

				if (camera) {

					var rotationCenter = new THREE.Vector3().copy(gestureTarget);

					var cameraOrigin = new THREE.Vector3().copy(camera.position);
					cameraOrigin.sub(rotationCenter);

					var cameraLook = camera.getWorldDirection();
					cameraLook.normalize();

					var cameraUp = new THREE.Vector3().copy(camera.up);

					// rotation
					if (this.isTurnTableMode) {

						var yawAxis = new THREE.Vector3(0, 1, 0);// set as Y for now
						var yawY = Math.atan2(cameraLook.x, cameraLook.z) + Math.PI / 2;

						var pitchAxis = createPitchAxis(yawY, 0);
						pitchAxis.normalize();

						var pitchAngle = Math.atan2(cameraLook.y, Math.sqrt(cameraLook.x * cameraLook.x + cameraLook.z * cameraLook.z));

						var yawRotation = new THREE.Quaternion();
						yawRotation.setFromAxisAngle(yawAxis, sphericalDelta.theta);

						var pitchRotation = new THREE.Quaternion(); // clamp between PI/2 and -PI/2
						pitchRotation.setFromAxisAngle(pitchAxis, clamp(sphericalDelta.phi, MIN_PITCH + pitchAngle, MAX_PITCH + pitchAngle));

						cameraUp.copy(cameraLook).cross(pitchAxis);
						cameraUp.normalize();

						yawRotation.multiply(pitchRotation); // put them together

						cameraOrigin.applyQuaternion(yawRotation); // apply rotation
						cameraLook.applyQuaternion(yawRotation);
						cameraUp.applyQuaternion(yawRotation);

					} else {

						var cameraX = new THREE.Vector3().crossVectors(cameraUp, cameraLook);
						cameraX.normalize();

						var rotZ = new THREE.Quaternion();
						rotZ.setFromAxisAngle(cameraUp, sphericalDelta.theta);
						var rotX = new THREE.Quaternion();
						rotX.setFromAxisAngle(cameraX, sphericalDelta.phi);

						rotZ.multiply(rotX);

						cameraOrigin.applyQuaternion(rotZ);
						cameraLook.applyQuaternion(rotZ);
						cameraUp.applyQuaternion(rotZ);

						cameraLook.normalize();
						cameraUp.normalize();
					}

					cameraOrigin.add(rotationCenter);

					var target = cameraOrigin.clone();
					target.add(cameraLook);

					// new camera
					camera.position.copy(cameraOrigin);
					camera.up.copy(cameraUp);
					camera.lookAt(target);

					// pan offset
					camera.position.add(panOffset);

					// reset delta
					sphericalDelta.set(0, 0, 0);
					panOffset.set(0, 0, 0);

					camera.updateMatrix();
					camera.updateProjectionMatrix();
				}
			};
		}
	});

	return CameraControllerThree;
}, /* bExport= */ true);
