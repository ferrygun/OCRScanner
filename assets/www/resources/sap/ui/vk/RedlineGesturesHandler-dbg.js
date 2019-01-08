/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([
		"jquery.sap.global", "sap/ui/base/EventProvider", "sap/ui/core/ResizeHandler"
	], function(jQuery, EventProvider, ResizeHandler) {
		"use strict";

		var RedlineGesturesHandler = EventProvider.extend("RedlineGesturesHandler", {
			metadata: {
				publicMethods: [
					"beginGesture",
					"move",
					"endGesture",
					"click",
					"doubleClick",
					"contextMenu",
					"getViewport"
				]
			},
			constructor: function(redlineDesignInstance) {
				this._redlineDesign = redlineDesignInstance;

				this._x = 0;
				this._y = 0;
				this._gesture = false;

				var viewport = this.getViewport();
				viewport._currentPosition = {
					x: 0,
					y: 0
				};

				viewport._totalMoveX = 0;
				viewport._totalMoveY = 0;
			}
		});

		RedlineGesturesHandler.prototype.destroy = function() {
			this._redlineDesign = null;
			this._rect = null;
			this._gesture = false;
		};

		RedlineGesturesHandler.prototype._getOffset = function(domRef) {
			var rectangle = domRef.getBoundingClientRect();
			return {
				x: rectangle.left + window.pageXOffset,
				y: rectangle.top + window.pageYOffset
			};
		};

		RedlineGesturesHandler.prototype._inside = function(event, redlineDesignInstance) {
			var redlineDesignDomRef = redlineDesignInstance.getDomRef(),
				isInside = false;

			if (redlineDesignDomRef !== null) {
				var redlineControlOffset = this._getOffset(redlineDesignDomRef);
				var redlineControlInfo = {
					x: redlineControlOffset.x,
					y: redlineControlOffset.y,
					width: redlineDesignDomRef.getBoundingClientRect().width,
					height: redlineDesignDomRef.getBoundingClientRect().height
				};
				isInside = (event.x >= redlineControlInfo.x && event.x <= redlineControlInfo.x + redlineControlInfo.width && event.y >= redlineControlInfo.y && event.y <= redlineControlInfo.y + redlineControlInfo.height);
			}
			return isInside;
		};

		RedlineGesturesHandler.prototype._onresize = function(event) {
			this._gesture = false;
		};

		/**
		 * Gesture handler to handle <i>beginGesture</i> while in redline interaction mode.
		 * @param {event} event Custom event broadcast by Loco.
		 * @returns {sap.ui.vk.RedlineGesturesHandler} <code>this</code> to allow method chaining.
		 * @public
		 */
		RedlineGesturesHandler.prototype.beginGesture = function(event) {
			var viewport = this.getViewport();
			if (this._inside(event, viewport)) {
				this._gesture = true;
				this._x = event.x;
				this._y = event.y;

				var offset = this._getOffset(viewport.getDomRef());
				this._gestureOriginX = event.x - offset.x;
				this._gestureOriginY = event.y - offset.y;

				this._distanceBetweenTouchPoints = null;

				if (event.n === 1) {
					this._lastMoveCoordinates = {};
					this._totalDeltaMove = {
						x: 0,
						y: 0
					};
				}
				event.handled = true;
			}
			return this;
		};

		RedlineGesturesHandler.prototype._pan = function(event) {
			if (this._totalDeltaMove) {

				var viewport = this.getViewport(),
					deltaX = event.x - (this._lastMoveCoordinates.x || event.x),
					deltaY = event.y - (this._lastMoveCoordinates.y || event.y);

				this._totalDeltaMove.x += deltaX;
				this._totalDeltaMove.y += deltaY;

				if (deltaX || deltaY) {

					var panningRatio = viewport.getPanningRatio();
					// fire the panning event specifying how much to move on x and y axes
					viewport.firePan({
						deltaX: deltaX * panningRatio,
						deltaY: deltaY * panningRatio
					});

					viewport.getRedlineElements().forEach(function(element) {
						element.setOriginX(element.getOriginX() + viewport._toVirtualSpace(deltaX));
						element.setOriginY(element.getOriginY() + viewport._toVirtualSpace(deltaY));
					});

					this._manualRender(viewport);
				}
				this._lastMoveCoordinates.x = event.x;
				this._lastMoveCoordinates.y = event.y;
			} else {
				this._totalDeltaMove = {
					x: 0,
					y: 0
				};
				this._lastMoveCoordinates = {};
			}
		};

		RedlineGesturesHandler.prototype._zoom = function(event) {
			var viewport = this.getViewport(),
				zoomDelta;

			// For most browsers, event.scroll property is defined, but for Firefox, this property is undefined.
			// This is because we are listening for DOMMouseScroll event instead of mousewheel event.
			// DOMMouseScroll does not have the wheelDelta property which is used to calculate the scroll.
			// This is why we are looking at the event.points array and compare the y property.
			if (event.scroll !== undefined) {
				if (event.scroll > 0) {
					zoomDelta = 1.05;
				} else if (event.scroll < 0) {
					zoomDelta = 1 / 1.05;
				} else if (this._distanceBetweenTouchPoints !== null) {
					var distanceDelta = event.d - this._distanceBetweenTouchPoints;
					if (distanceDelta > 0) {
						zoomDelta = 1.05;
					} else if (distanceDelta < 0) {
						zoomDelta = 1 / 1.05;
					} else {
						return;
					}
					this._distanceBetweenTouchPoints = event.d;
				} else {
					this._distanceBetweenTouchPoints = event.d;
					return;
				}
			} else if (event.points[0].y < event.points[1].y) {
				// If the y property of the first point is lower than the y property of the second point,
				// it's a zoom-in gesture.
				zoomDelta = 1.05;
			} else {
				// Otherwise, it's a zoom out gesture.
				zoomDelta = 1 / 1.05;
			}

			var scaleChange = 1 - zoomDelta,
				pivotPoint = viewport._toVirtualSpace(this._gestureOriginX, this._gestureOriginY);

			viewport.getRedlineElements().forEach(function(element) {
				element.applyZoom(zoomDelta);
				var originX = element.getOriginX(),
					originY = element.getOriginY();
				originX += (pivotPoint.x - originX) * scaleChange;
				originY += (pivotPoint.y - originY) * scaleChange;
				element.setOriginX(originX);
				element.setOriginY(originY);
			});

			this._manualRender(viewport);

			viewport.fireZoom({
				originX: this._gestureOriginX,
				originY: this._gestureOriginY,
				zoomFactor: zoomDelta
			});

		};

		/**
		 * Gesture handler to handle <i>move</i> while in redline interaction mode.
		 * @param {event} event Custom event broadcast by Loco.
		 * @returns {sap.ui.vk.RedlineGesturesHandler} <code>this</code> to allow method chaining.
		 * @public
		 */
		RedlineGesturesHandler.prototype.move = function(event) {
			if (this.getViewport().getDomRef()) {
				if (event.n === 2 && (event.buttons === 4 || event.buttons === 3) || event.n === 1) {
					// PANNING
					this._pan(event);
				} else if ((event.n === 2 && event.buttons === 2) || (sap.ui.Device.system.tablet && event.n === 2 && event.buttons === 0)) {
					// PERFORM ZOOM
					this._zoom(event);
				}
			}
			event.handled = true;
			return this;
		};

		/**
		 * It invalidates the redline elements and it manually renders them after zooming/panning gestures were performed.
		 * @param {sap.ui.vk.RedlineSurface} redlineSurface RedlineSurface instance.
		 * @private
		 */
		RedlineGesturesHandler.prototype._manualRender = function(redlineSurface) {
			if (sap.ui.Device.browser.msie || sap.ui.Device.browser.edge) {
				redlineSurface.invalidate();
			} else {
				// creating a new instance of RenderManager
				var renderManager = sap.ui.getCore().createRenderManager();
				// manually rendering the active element instance
				redlineSurface.getRedlineElements().forEach(function(element) {
					element.render(renderManager);
				});

				// flushing the drawing surface
				renderManager.flush(redlineSurface.getDomRef(), false, false);
				renderManager.destroy();

				// This is workaround for an issue caused by the fact that browsers can't
				// work with innerHTML for svg elements. There is a discussion on this topic here:
				// http://stackoverflow.com/a/13654655/3935427
				var x = redlineSurface.$();
				x.html(x.html());
			}
		};

		/**
		 * Gesture handler to handle <i>endGesture</i> while in redline interaction mode.
		 * @param {event} event Custom event broadcast by Loco.
		 * @returns {sap.ui.vk.RedlineGesturesHandler} <code>this</code> to allow method chaining.
		 * @public
		 */
		RedlineGesturesHandler.prototype.endGesture = function(event) {
			this._gestureOriginX = 0;
			this._gestureOriginY = 0;


			this._lastMoveCoordinates = {};
			this._totalDeltaMove = {
				x: 0,
				y: 0
			};

			this._gesture = false;
			event.handled = true;
			return this;
		};

		RedlineGesturesHandler.prototype.click = function(event) {

		};

		RedlineGesturesHandler.prototype.doubleClick = function(event) {

		};

		RedlineGesturesHandler.prototype.contextMenu = function(event) {
			event.handled = true;
		};

		RedlineGesturesHandler.prototype.getViewport = function() {
			return this._redlineDesign;
		};

		return RedlineGesturesHandler;
	}, /* bExport= */
	true);
