// Provides control sap.ui.vk.tools.RotateToolHandler
sap.ui.define([
	"jquery.sap.global", "sap/ui/base/EventProvider"
], function(jQuery, EventProvider) {
	"use strict";

	var RotateToolHandler = EventProvider.extend("sap.ui.vk.tools.RotateToolHandler", {
		metadata: {
			publicMethods: [
				"hover",
				"beginGesture",
				"move",
				"endGesture",
				"click",
				"doubleClick",
				"contextMenu"
			]
		},
		constructor: function(tool) {
			this._tool = tool;
			this._gizmo = tool.getGizmo();
			this._rect = null;
			this._rayCaster = new THREE.Raycaster();
			this._rayCaster.linePrecision = 0.2;
			this._handleIndex = -1;
			this._gizmoIndex = -1;
			this._handleAxis = new THREE.Vector3();
			this._gizmoOrigin = new THREE.Vector3();
			this._matrixOrigin = new THREE.Matrix4();
			this._mouse = new THREE.Vector2();
		}
	});

	RotateToolHandler.prototype.destroy = function() {
		this._tool = null;
		this._gizmo = null;
		this._rect = null;
		this._rayCaster = null;
		this._handleAxis = null;
		this._gizmoOrigin = null;
		this._mouse = null;
	};

	RotateToolHandler.prototype._updateMouse = function(event) {
		var size = this.getViewport().getRenderer().getSize();
		this._mouse.x = ((event.x - this._rect.x) / size.width) * 2 - 1;
		this._mouse.y = ((event.y - this._rect.y) / size.height) * -2 + 1;
		this._rayCaster.setFromCamera(this._mouse, this.getViewport().getCamera().getCameraRef());
	};

	RotateToolHandler.prototype._updateHandles = function(event, hoverMode) {
		var prevHandleIndex = this._handleIndex;
		this._handleIndex = -1;
		for (var i = 0, l = this._gizmo.getGizmoCount(); i < l; i++) {
			var touchObj = this._gizmo.getTouchObject(i);
			var intersects = this._rayCaster.intersectObject(touchObj, true);
			if (intersects.length > 0) {
				this._handleIndex = touchObj.children.indexOf(intersects[ 0 ].object);
				if (this._handleIndex >= 0 && this._handleIndex < 3) {
					this._gizmoIndex = i;
					this._matrixOrigin.copy(touchObj.matrixWorld);
					this._gizmoOrigin.setFromMatrixPosition(touchObj.matrixWorld);
					var axis1 = new THREE.Vector3().setFromMatrixColumn(touchObj.matrixWorld, (this._handleIndex + 1) % 3),
						axis2 = new THREE.Vector3().setFromMatrixColumn(touchObj.matrixWorld, (this._handleIndex + 2) % 3);
					this._handleAxis.crossVectors(axis1, axis2).normalize();
					// this._handleAxis.setFromMatrixColumn(touchObj.matrixWorld, this._handleIndex).normalize();
				}
			}
		}
		this._gizmo.highlightHandle(this._handleIndex, hoverMode || this._handleIndex === -1);
		if (prevHandleIndex !== this._handleIndex) {
			this.getViewport().setShouldRenderFrame();
		}
	};

	RotateToolHandler.prototype.hover = function(event) {
		if (this._inside(event) && !this._gesture) {
			this._updateMouse(event);
			this._updateHandles(event, true);
			event.handled |= this._handleIndex > 0;
		}
	};

	RotateToolHandler.prototype._getPlaneOffset = function() {
		var ray = this._rayCaster.ray;
		var delta = this._gizmoOrigin.clone().sub(ray.origin);
		var dist = this._handleAxis.dot(delta) / this._handleAxis.dot(ray.direction);
		return ray.direction.clone().multiplyScalar(dist).sub(delta);
	};

	RotateToolHandler.prototype.beginGesture = function(event) {
		if (this._inside(event) && !this._gesture) {
			this._updateMouse(event);
			this._updateHandles(event, false);
			if (this._handleIndex >= 0 && this._handleIndex < 3 && event.n === 1) {
				this._gesture = true;
				event.handled = true;
				this._gizmo.beginGesture();
				if (this._handleIndex < 3) {
					this._dragOriginDirection = this._getPlaneOffset().normalize();
				}
			}
		}
	};

	RotateToolHandler.prototype.move = function(event) {
		if (this._gesture) {
			event.handled = true;
			this._updateMouse(event);

			if (this._dragOriginDirection) {
				var dir1 = this._dragOriginDirection,
					dir2 = this._getPlaneOffset().normalize(),
					axis1 = new THREE.Vector3().setFromMatrixColumn(this._matrixOrigin, (this._handleIndex + 1) % 3).normalize(),
					axis2 = new THREE.Vector3().setFromMatrixColumn(this._matrixOrigin, (this._handleIndex + 2) % 3).normalize();
				var angle1 = Math.atan2(dir1.dot(axis2), dir1.dot(axis1));
				var angle2 = Math.atan2(dir2.dot(axis2), dir2.dot(axis1));

				if (!isNaN(angle1) && !isNaN(angle2)) {
					this._gizmo._setRotationAxisAngle(this._handleIndex, angle1, angle2);
				}
			}
		}
	};

	RotateToolHandler.prototype.endGesture = function(event) {
		if (this._gesture) {
			this._gesture = false;
			event.handled = true;
			this._updateMouse(event);

			this._gizmo.endGesture();
			this._dragOriginDirection = undefined;
			this._updateHandles(event, true);
			this.getViewport().setShouldRenderFrame();
		}
	};

	RotateToolHandler.prototype.click = function(event) { };

	RotateToolHandler.prototype.doubleClick = function(event) { };

	RotateToolHandler.prototype.contextMenu = function(event) { };

	RotateToolHandler.prototype.getViewport = function() {
		return this._tool._viewport;
	};

	// GENERALISE THIS FUNCTION
	RotateToolHandler.prototype._getOffset = function(obj) {
		var rectangle = obj.getBoundingClientRect();
		var p = {
			x: rectangle.left + window.pageXOffset,
			y: rectangle.top + window.pageYOffset
		};
		return p;
	};

	// GENERALISE THIS FUNCTION
	RotateToolHandler.prototype._inside = function(event) {
		if (this._rect === null || true) {
			var id = this._tool._viewport.getIdForLabel();
			var domobj = document.getElementById(id);

			if (domobj === null) {
				return false;
			}

			var o = this._getOffset(domobj);
			this._rect = {
				x: o.x,
				y: o.y,
				w: domobj.offsetWidth,
				h: domobj.offsetHeight
			};
		}

		return (event.x >= this._rect.x && event.x <= this._rect.x + this._rect.w && event.y >= this._rect.y && event.y <= this._rect.y + this._rect.h);
	};

	return RotateToolHandler;
}, /* bExport= */ true);