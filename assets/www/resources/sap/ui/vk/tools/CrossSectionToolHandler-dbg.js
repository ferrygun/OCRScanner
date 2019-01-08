// Provides control sap.ui.vk.tools.CrossSectionToolHandler
sap.ui.define([
	"jquery.sap.global", "sap/ui/base/EventProvider"
], function(jQuery, EventProvider) {
	"use strict";

	var CrossSectionToolHandler = EventProvider.extend("sap.ui.vk.tools.CrossSectionToolHandler", {
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
			this._mouse = new THREE.Vector2();
			this._rayCaster = new THREE.Raycaster();
			this._rayCaster.linePrecision = 0;
			this._gizmoOrigin = new THREE.Vector3();
			this._gizmoAxis = new THREE.Vector3();
		}
	});

	CrossSectionToolHandler.prototype.destroy = function() {
		this._tool = null;
		this._gizmo = null;
		this._rect = null;
		this._rayCaster = null;
		this._gizmoAxis = null;
		this._gizmoOrigin = null;
		this._mouse = null;
	};

	CrossSectionToolHandler.prototype._updateRayCaster = function(event) {
		var size = this.getViewport().getRenderer().getSize();
		this._mouse.x = ((event.x - this._rect.x) / size.width) * 2 - 1;
		this._mouse.y = ((event.y - this._rect.y) / size.height) * -2 + 1;
		this._rayCaster.setFromCamera(this._mouse, this.getViewport().getCamera().getCameraRef());
	};

	CrossSectionToolHandler.prototype.hover = function(event) { };

	CrossSectionToolHandler.prototype._getAxisOffset = function() {
	};

	CrossSectionToolHandler.prototype.beginGesture = function(event) {
		if (this._inside(event) && !this._gesture && event.n === 1) {
			this._updateRayCaster(event);

			var touchObj = this._gizmo.getTouchObject();
			if (touchObj) {
				var intersects = this._rayCaster.intersectObject(touchObj, true);
				if (intersects.length > 0) {
					if (this._gizmo._plane.distanceToPoint(this._rayCaster.ray.origin) > 0) {
						this._rayCaster.far = intersects[0].distance;
						var intersects2 = this._rayCaster.intersectObject(this._gizmo._viewport.getScene().getSceneRef(), true);
						this._rayCaster.far = undefined;
						if (intersects2.length > 0) {
							return;
						}
					}

					this._gizmoOrigin.copy(intersects[0].point);
					this._gizmoAxis.set(0, 0, 0).setComponent(this._gizmo._axis, 1);
					this._gesture = true;
					event.handled = true;
				}
			}
		}
	};

	CrossSectionToolHandler.prototype.move = function(event) {
		if (this._gesture) {
			event.handled = true;
			this._updateRayCaster(event);

			var ray = this._rayCaster.ray;
			var dir = this._gizmoAxis.clone().cross(ray.direction).cross(ray.direction).normalize();
			var delta = ray.origin.clone().sub(this._gizmoOrigin);
			var offset = dir.dot(delta) / dir.dot(this._gizmoAxis);
			if (!isNaN(offset)) {
				this._gizmo._setOffset(this._gizmoOrigin.dot(this._gizmoAxis) + offset);
			}
		}
	};

	CrossSectionToolHandler.prototype.endGesture = function(event) {
		if (this._gesture) {
			this._gesture = false;
			event.handled = true;
		}
	};

	CrossSectionToolHandler.prototype.click = function(event) { };

	CrossSectionToolHandler.prototype.doubleClick = function(event) { };

	CrossSectionToolHandler.prototype.contextMenu = function(event) { };

	CrossSectionToolHandler.prototype.getViewport = function() {
		return this._tool._viewport;
	};

	// GENERALISE THIS FUNCTION
	CrossSectionToolHandler.prototype._getOffset = function(obj) {
		var rectangle = obj.getBoundingClientRect();
		var p = {
			x: rectangle.left + window.pageXOffset,
			y: rectangle.top + window.pageYOffset
		};
		return p;
	};

	// GENERALISE THIS FUNCTION
	CrossSectionToolHandler.prototype._inside = function(event) {
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

	return CrossSectionToolHandler;
}, /* bExport= */ true);