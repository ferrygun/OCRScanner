// Provides control sap.ui.vk.tools.MoveToolHandler
sap.ui.define([
	"jquery.sap.global", "sap/ui/base/EventProvider"
], function(jQuery, EventProvider) {
	"use strict";

	var MoveToolHandler = EventProvider.extend("sap.ui.vk.tools.MoveToolHandler", {
		metadata: {
			publicMethods: [
				"hover",
				"beginGesture",
				"move",
				"endGesture",
				"click",
				"doubleClick",
				"contextMenu" ]
		},
		constructor: function(tool) {
			this._tool = tool;
			this._gizmo = tool.getGizmo();
			this._rect = null;
			this._rayCaster = new THREE.Raycaster();
			// this._rayCaster.linePrecision = 0.2;
			this._handleIndex = -1;
			this._gizmoIndex = -1;
			this._handleAxis = new THREE.Vector3();
			this._gizmoOrigin = new THREE.Vector3();
			this._mouse = new THREE.Vector2();
		}
	});

	MoveToolHandler.prototype.destroy = function() {
		this._tool = null;
		this._gizmo = null;
		this._rect = null;
		this._rayCaster = null;
		this._handleAxis = null;
		this._gizmoOrigin = null;
		this._mouse = null;
	};

	MoveToolHandler.prototype._updateMouse = function(event) {
		var size = this.getViewport().getRenderer().getSize();
		this._mouse.x = ((event.x - this._rect.x) / size.width) * 2 - 1;
		this._mouse.y = ((event.y - this._rect.y) / size.height) * -2 + 1;
		this._rayCaster.setFromCamera(this._mouse, this.getViewport().getCamera().getCameraRef());
	};

	MoveToolHandler.prototype._updateHandles = function(event, hoveMove) {
		var prevHandleIndex = this._handleIndex;
		this._handleIndex = -1;
		for (var i = 0, l = this._gizmo.getGizmoCount(); i < l; i++) {
			var touchObj = this._gizmo.getTouchObject(i);
			var intersects = this._rayCaster.intersectObject(touchObj, true);
			if (intersects.length > 0) {
				this._handleIndex = touchObj.children.indexOf(intersects[ 0 ].object);
				if (this._handleIndex >= 0) {
					this._gizmoIndex = i;
					this._gizmoOrigin.setFromMatrixPosition(touchObj.matrixWorld);
					if (this._handleIndex < 3) {// arrow
						this._handleAxis.setFromMatrixColumn(touchObj.matrixWorld, this._handleIndex).normalize();
					} else if (this._handleIndex < 6) {// plane
						this._handleAxis.setFromMatrixColumn(touchObj.matrixWorld, this._handleIndex - 3).normalize();
					}
				}
			}
		}
		this._gizmo.highlightHandle(this._handleIndex, hoveMove || this._handleIndex === -1);
		if (prevHandleIndex !== this._handleIndex) {
			this.getViewport().setShouldRenderFrame();
		}
	};

	MoveToolHandler.prototype.hover = function(event) {
		if (this._inside(event) && !this._gesture) {
			this._updateMouse(event);
			this._updateHandles(event, true);
			event.handled |= this._handleIndex > 0;
		}
	};

	MoveToolHandler.prototype._getAxisOffset = function() {
		var ray = this._rayCaster.ray;
		var dir = this._handleAxis.clone().cross(ray.direction).cross(ray.direction).normalize();
		var delta = ray.origin.clone().sub(this._gizmoOrigin);
		return dir.dot(delta) / dir.dot(this._handleAxis);
	};

	MoveToolHandler.prototype._getPlaneOffset = function() {
		var ray = this._rayCaster.ray;
		var delta = this._gizmoOrigin.clone().sub(ray.origin);
		var dist = this._handleAxis.dot(delta) / this._handleAxis.dot(ray.direction);
		return ray.direction.clone().multiplyScalar(dist).sub(delta);
	};

	MoveToolHandler.prototype.beginGesture = function(event) {
		if (this._inside(event) && !this._gesture) {
			this._updateMouse(event);
			this._updateHandles(event, false);
			if (this._handleIndex >= 0 && event.n === 1) {
				this._gesture = true;
				event.handled = true;
				this._gizmo.beginGesture();
				if (this._handleIndex < 3) {// axis
					this._dragOrigin = this._getAxisOffset();
				} else if (this._handleIndex < 6) {// plane
					this._dragOrigin = this._getPlaneOffset();
				}
			}
		}
	};

	MoveToolHandler.prototype.move = function(event) {
		if (this._gesture) {
			event.handled = true;
			this._updateMouse(event);

			if (this._handleIndex < 3) {// axis
				if (!isNaN(this._dragOrigin)) {
					this._gizmo._setOffset(this._handleAxis.clone().multiplyScalar(this._getAxisOffset() - this._dragOrigin), this._gizmoIndex);
				}
			} else if (this._handleIndex < 6) {// plane
				if (!isNaN(this._dragOrigin.x) && !isNaN(this._dragOrigin.y) && !isNaN(this._dragOrigin.z)) {
					this._gizmo._setOffset(this._getPlaneOffset().sub(this._dragOrigin), this._gizmoIndex);
				}
			}
		}
	};

	MoveToolHandler.prototype.endGesture = function(event) {
		if (this._gesture) {
			this._gesture = false;
			event.handled = true;
			this._updateMouse(event);

			this._gizmo.endGesture();
			this._dragOrigin = undefined;
			this._updateHandles(event, true);
			this.getViewport().setShouldRenderFrame();
		}
	};

	MoveToolHandler.prototype.click = function(event) { };

	MoveToolHandler.prototype.doubleClick = function(event) { };

	MoveToolHandler.prototype.contextMenu = function(event) { };

	MoveToolHandler.prototype.getViewport = function() {
		return this._tool._viewport;
	};

	// GENERALISE THIS FUNCTION
	MoveToolHandler.prototype._getOffset = function(obj) {
		var rectangle = obj.getBoundingClientRect();
		var p = {
			x: rectangle.left + window.pageXOffset,
			y: rectangle.top + window.pageYOffset
		};
		return p;
	};

	// GENERALISE THIS FUNCTION
	MoveToolHandler.prototype._inside = function(event) {
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

	return MoveToolHandler;
}, /* bExport= */ true);