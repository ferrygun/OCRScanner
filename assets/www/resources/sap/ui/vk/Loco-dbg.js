/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.vk.Loco.
sap.ui.define([
	"jquery.sap.global", "sap/ui/base/EventProvider", "./InputDevicePointer", "./InputDeviceMouse", "./InputDeviceTouch", "./InputDeviceKeyboard"
], function(jQuery, EventProvider, InputDevicePointer, InputDeviceMouse, InputDeviceTouch, InputDeviceKeyboard) {
	"use strict";

	/**
	 * Constructor for a new Loco.
	 *
	 * @class
	 * Intercepts input event data for a SAPUI5 target, and interprets the data based on a supported set of gestures.
	 * @extends sap.ui.core.EventProvider
	 *
	 * @author SAP SE
	 * @version 1.52.8
	 *
	 * @constructor
	 * @public
	 * @alias sap.ui.vk.Loco
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 * @experimental Since 1.32.0 This class is experimental and might be modified or removed in future versions.
	 */
	var Loco = EventProvider.extend("sap.ui.vk.Loco", {
		metadata: {
			publicMethods: [
				"addHandler",
				"removeHandler",
				"beginGesture",
				"move",
				"endGesture",
				"contextMenu"
			]
		},

		constructor: function() {
			if (Loco._instance) {
				return Loco._instance;
			}

			EventProvider.apply(this);
			/* Array of ViewportHandler object */
			this._handlers = [];
			this._handlerMap = [];
			this._gesture = [];

			/* Click, double-click simulation */
			this._touchOrigin = {
				x: 0,
				y: 0,
				z: 0
			};
			this._touchMoved = false;
			this._touchButton = 0;

			/* Tick and timer */
			this._touchStart = 0;
			this._touchEnd = 0;
			this._clickTimer = 0;
			this._isDoubleClick = false;

			Loco._instance = this;
		}
	});


	/**
	 * Cleans up, removes all handlers.
	 *
	 * @public
	 */
	Loco.prototype.destroy = function() {
		this._gesture = [];
		this._handlers = [];
	};

	/**
	 * Adds a viewport event handler from Loco.
	 *
	 * @param {handler} handler to be added.
	 *
	 * @public
	 */
	Loco.prototype.addHandler = function(handler) {
		if (this._handlers.indexOf(handler) >= 0) {
			return;
		}
		this._handlers.push(handler);
		var viewport = handler.getViewport();
		var handlers = this._handlerMap[viewport];

		if (handlers == null) {
			this._handlerMap[viewport] = [];
			handlers = this._handlerMap[viewport];
			handlers.push(handler);
		} else if (handlers.indexOf(handler) == -1) {
			handlers.push(handler);
		}

		var pointer = new InputDevicePointer(this);
		if (pointer.isSupported()) {
			pointer.enable(viewport);
			viewport._pointer = pointer;
		} else {
			var mouse = new InputDeviceMouse(this);
			if (mouse.isSupported()) {
				mouse.enable(viewport);
				viewport._mouse = mouse;
			}

			var touch = new InputDeviceTouch(this);
			if (touch.isSupported()) {
				touch.enable(viewport);
				viewport._touch = touch;
			}
		}
		viewport._keyboard = new InputDeviceKeyboard(this);
		viewport._keyboard.enable(viewport);
	};

	/**
	 * Removes a viewport event handler from Loco.
	 *
	 * @param {handler} handler to be removed.
	 *
	 * @public
	 */
	Loco.prototype.removeHandler = function(handler) {
		var viewport = handler.getViewport();
		var h = this._handlers;
		var handlers = this._handlerMap[viewport];
		var handlerIndex;

		if (handlers != null) {
			handlerIndex = handlers.indexOf(handler);
			if (handlerIndex >= 0) {
				handlers.splice(handlerIndex, 1);
			}
		}

		handlerIndex = h.indexOf(handler);
		if (handlerIndex >= 0) {
			h.splice(handlerIndex, 1);

			if (viewport._pointer) {
				viewport._pointer.disable();
				viewport._pointer = null;
			}

			if (viewport._touch) {
				viewport._touch.disable();
				viewport._touch = null;
			}

			if (viewport._mouse) {
				viewport._mouse.disable();
				viewport._mouse = null;
			}

			if (viewport._keyboard) {
				viewport._keyboard.disable();
				viewport._keyboard = null;
			}
		}
	};

	/**
	 * It processes the click event.
	 * @param {boolean} isDoubleClick This parameter specifies whether it is a double-click event or not.
	 * @param {object} viewport The viewport which received the event.
	 * @private
	 */
	Loco.prototype._processClick = function(isDoubleClick, viewport) {
		this._clickTimer = 0;

		var event = {
			x: 0,
			y: 0,
			z: 0,
			d: 0,
			n: 0,
			buttons: 0,
			scrolls: [],
			points: [],
			handled: false
		};
		event.x = this._touchOrigin.x;
		event.y = this._touchOrigin.y;
		event.z = this._touchOrigin.z;
		event.buttons = this._touchButton;

		var handlers = this._handlerMap[viewport];
		if (handlers != null) {
			for (var i = handlers.length - 1; i >= 0; i--) {
				if (isDoubleClick) {
					var nativeViewportId = handlers[i].getViewport().getId();
					// We extract the parent viewer id.
					// if it exists, it has to be a string which ends in "-nativeViewport"
					var parentViewerId = /-nativeViewport$/.test(nativeViewportId) ? nativeViewportId.replace(/-nativeViewport$/, "") : null;
					// We get the parent viewer by id
					var parentViewer = sap.ui.getCore().byId(parentViewerId);
					// If the parent viewert exists, it has an overlay and also the overlay drawing is in progress,
					// then we don't send the double click event to the viewport handler.
					// We know the drawing is in progress because the mIACreateCB function is defined. If the drawing hasn't started
					// or it has already finished, that function is cleared and it becomes undefined.
					if (!parentViewer || !parentViewer.getOverlay() || !(typeof parentViewer.getOverlay().mIACreateCB === "function")) {
						handlers[i].doubleClick(event, viewport);
					}
				} else {
					handlers[i].click(event, viewport);
				}
			}
		}
	};

	/**
	 * @param {object} event JSON object including input event data.
	 * @returns {object} event Processed event object.
	 * @private
	 */
	Loco.prototype._processInput = function(event) {
		// Calculate action point (x, y, z) and distance (d)
		var eps = event.points;

		switch (event.n) {
			case 0:
				event.x = 0;
				event.y = 0;
				event.z = 0;
				event.d = 0;
				break;
			case 2:
				var dx = eps[0].x - eps[1].x,
					dy = eps[0].y - eps[1].y,
					dz = eps[0].z - eps[1].z;
				event.x = (eps[0].x + eps[1].x) / 2;
				event.y = (eps[0].y + eps[1].y) / 2;
				event.z = (eps[0].z + eps[1].z) / 2;
				event.d = Math.sqrt(dx * dx + dy * dy + dz * dz);
				break;
			default:
				event.x = eps[0].x;
				event.y = eps[0].y;
				event.z = eps[0].z;
				event.d = 0;
				break;
		}

		return event;
	};

	/**
	 * Signal begin of a input gesture.
	 *
	 * @param {object} event JSON object including input event data.
	 * @param {object} viewport The viewport which received the event.
	 * @public
	 */
	Loco.prototype.beginGesture = function(event, viewport) {
		if (this._gesture[viewport]) {
			return;
		}

		if (this._clickTimer > 0) {
			clearTimeout(this._clickTimer);
			this._clickTimer = 0;
			this._isDoubleClick = true;

			if (event.n == 1 && event.buttons <= 1 && this._touchButton <= 1) {
				this._processClick(true, viewport);
			}
		}

		this._processInput(event);

		var handlers = this._handlerMap[viewport];
		if (handlers != null) {
			for (var i = handlers.length - 1; i >= 0; i--) {
				handlers[i].beginGesture(event);
				if (event.handled) {
					break;
				}
			}
		}

		var now = new Date();
		this._touchStart = now.getTime();
		this._touchMoved = false;
		this._gesture[viewport] = true;

		this._touchOrigin.x = event.x;
		this._touchOrigin.y = event.y;
		this._touchOrigin.z = event.z;
		this._touchButton = event.buttons;

		if (this._touchEnd != 0 && this._touchStart - this._touchEnd < 50) {
			this._touchMoved = true;
		}
	};

	/**
	 * Signal movement of a input gesture.
	 *
	 * @param {object} event JSON object including input event data.
	 * @param {object} viewport The viewport which received the event.
	 * @public
	 */
	Loco.prototype.move = function(event, viewport) {
		this._processInput(event);
		var handlers = this._handlerMap[viewport];

		var i;
		if (this._gesture[viewport]) {
			if (handlers != null) {
				for (i = handlers.length - 1; i >= 0; i--) {
					handlers[i].move(event);
					if (event.handled) {
						break;
					}
				}
			}

			var dx = this._touchOrigin.x - event.x;
			var dy = this._touchOrigin.y - event.y;
			var dz = this._touchOrigin.z - event.z;

			if ((dx * dx + dy * dy + dz * dz) > 8) {
				this._touchMoved = true;
			}
		} else if (handlers != null) {
			for (i = handlers.length - 1; i >= 0; i--) {
				if (handlers[i].hover != undefined) {
					handlers[i].hover(event);
					if (event.handled) {
						break;
					}
				}
			}
		}
	};

	/**
	 * Signal end of a input gesture.
	 *
	 * @param {object} event JSON object including input event data.
	 * @param {object} viewport The viewport which received the event.
	 * @public
	 */
	Loco.prototype.endGesture = function(event, viewport) {
		if (!this._gesture[viewport]) {
			return;
		}

		this._processInput(event);

		var handlers = this._handlerMap[viewport];
		if (handlers != null) {
			for (var i = handlers.length - 1; i >= 0; i--) {
				handlers[i].endGesture(event);
				if (event.handled) {
					break;
				}
			}
		}

		var now = new Date();
		this._touchEnd = now.getTime();

		if (!this._touchMoved && !this._isDoubleClick && (this._touchEnd - this._touchStart) < 2000) {
			this._clickTimer = setTimeout(function(loco) {
				loco._processClick(false, viewport);
			}, 200, this);
		}

		this._isDoubleClick = false;
		this._gesture[viewport] = false;
	};

	/**
	 * Signal context menu event.
	 *
	 * @param {object} event JSON object including input event data
	 * @param {object} viewport The viewport which received the event.
	 * @public
	 */
	Loco.prototype.contextMenu = function(event, viewport) {
		this._processInput(event);
		var handlers = this._handlerMap[viewport];
		if (handlers != null) {
			for (var i = handlers.length - 1; i >= 0; i--) {
				handlers[i].contextMenu(event);
				if (event.handled) {
					break;
				}
			}
		}
	};

	/**
	 * Signal keyboard event.
	 *
	 * @param {object} event Keyboard event object.
	 * @param {object} viewport The viewport which received the event.
	 * @public
	 */
	Loco.prototype.keyEventHandler = function(event, viewport) {
		var handlers = this._handlerMap[viewport];
		if (handlers !== null && handlers !== undefined) {
			for (var i = handlers.length - 1; i >= 0; i--) {
				if (handlers[i].keyEventHandler) {
					handlers[i].keyEventHandler(event);
				}
			}
		}
	};
	return Loco;
}, /* bExport= */ true);
