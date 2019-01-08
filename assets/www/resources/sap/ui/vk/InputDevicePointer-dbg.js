/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.vk.InputDevicPointer.
sap.ui.define([
	"jquery.sap.global", "sap/ui/base/EventProvider", "./InputDeviceMouse"
], function(jQuery, EventProvider, InputDeviceMouse) {
	"use strict";

	var InputDevicePointer = EventProvider.extend("sap.ui.vk.InputDevicePointer", {
		metadata: {
			publicMethods: [
				"isSupported",
				"enable",
				"disable"
			]
		},

		constructor: function(Loco) {
			this._loco = Loco;
			this._pointerIds = [];
			this._pointers = [];
			this._count = 0;
			this._points = 0;
			this._buttons = 0;
			this._mouse = new InputDeviceMouse(this._loco);
			this._pointerdownProxy = this._onpointerdown.bind(this);
			this._pointerupProxy = this._onpointerup.bind(this);
			this._pointermoveProxy = this._onpointermove.bind(this);
			this._mousewheelProxy = this._mouse._onmousewheel.bind(this._mouse);
			this._contextmenuProxy = this._mouse._oncontextmenu.bind(this._mouse);
			this._onpointerupWindowListenerProxy = this._onpointerupWindowListener.bind(this);
		}
	});


	InputDevicePointer.prototype._clearPointers = function() {
		this._pointerIds = [];
		this._pointers = [];
		this._count = 0;
		this._points = 0;
		this._buttons = 0;
	};

	InputDevicePointer.prototype._addPointer = function(id, _x, _y) {
		// jQuery.sap.log.debug("AddPointer[" + id + "]: " + _x + ", " + _y);

		if (this._pointerIds[id] == null) {
			this._pointerIds[id] = this._count;
		}

		var index = this._pointerIds[id];

		if (this._pointers.length <= index || this._pointers[index] == null) {
			this._count++;
		}

		this._pointers[index] = {
			x: _x,
			y: _y
		};

		return this._count;
	};

	InputDevicePointer.prototype._removePointer = function(id) {
		// jQuery.sap.log.debug("RemovePointer[" + id + "]");

		if (this._pointerIds[id] == null) {
			return this._count;
		}

		var index = this._pointerIds[id];
		this._pointerIds[id] = null;

		if (this._pointers.length > index && this._pointers[index] != null) {
			this._count--;
		}

		this._pointers[index] = null;

		return this._count;
	};

	InputDevicePointer.prototype._eventToInput = function(event) {
		// Encapsulate HTML pointer event to this._loco input event
		var input = {
			x: 0,
			y: 0,
			z: 0,
			d: 0,
			n: this._count,
			buttons: 0,
			scroll: 0,
			points: [],
			handled: false
		};

		var tp = this._pointers;
		var l = tp.length;

		for (var i = 0; i < l; i++) {
			var ep = tp[i];

			if (ep != null) {
				input.points.push({
					x: ep.x,
					y: ep.y,
					z: 0
				});
			}
		}

		return input;
	};

	InputDevicePointer.prototype._onpointerdown = function(ev) {
		var event = ev.originalEvent ? ev.originalEvent : ev;

		if (event.pointerType != "touch" && event.pointerType != "pen") {
			this._buttons = event.buttons;
			this._mouse._onmousedown(event);
			return;
		}

		if (event.isPrimary) {
			this._clearPointers();
		}

		this._addPointer(event.pointerId, event.pageX, event.pageY);

		event.target.setPointerCapture(event.pointerId);

		var input = this._eventToInput(event);

		if (this._points != 0 && this._points != input.n) {
			this._loco.endGesture(input, this._control);
		}

		this._points = input.n;
		input.handled = false;
		this._loco.beginGesture(input, this._control);

		if (input.handled) {
			event["_sapui_handledByControl"] = true;
			event.preventDefault();
		} else {
			this._removePointer(event.pointerId);
		}
	};

	InputDevicePointer.prototype._onpointerup = function(ev) {
		this._capturedByControl = true;

		var event = ev.originalEvent ? ev.originalEvent : ev;

		if (event.pointerType != "touch" && event.pointerType != "pen") {
			this._buttons = 0;
			this._mouse._onmouseup(event);
			return;
		}

		this._removePointer(event.pointerId);

		event.target.releasePointerCapture(event.pointerId);

		var input = this._eventToInput(event);

		this._loco.endGesture(input, this._control);

		if (input.n != 0 && this._points != input.n) {
			input.handled = false;
			this._loco.beginGesture(input, this._control);
		}

		this._points = input.n;

		if (input.handled) {
			event["_sapui_handledByControl"] = true;
			event.preventDefault();
		}
	};

	// This method is called when we the pointerup event is fired.
	// When you hold and drag the left mouse button and release while outside
	// the area of Viewport/NativeViewport, Loco doesn't know the gesture ended.
	// This way, we attach a listener to the window so we can capture the pointerup event all the time.
	// This method is fired after the regular "Pointer._prototype._onpointerup". We check if the pointerup event
	// was handled in that method. If not, we call the _onpointerup method manually.
	// This fix is required because Loco gets confused when the pointerup event occurs outside
	// the Viewport/NativeViewport.
	InputDevicePointer.prototype._onpointerupWindowListener = function(event) {
		if (!this._capturedByControl) {
			this._onpointerup(event);
		}
		this._capturedByControl = false;
	};

	InputDevicePointer.prototype._onpointermove = function(ev) {
		if (ev.buttons !== 0 || sap.ui.Device.system.desktop) {
			var event = ev.originalEvent ? ev.originalEvent : ev;

			if (event.pointerType != "touch" && event.pointerType != "pen") {
				// if (this._buttons != event.buttons) {
				// 	this._mouse._onmousedown(event);
				// 	this._buttons = event.buttons;
				// } else {
					this._mouse._onmousemove(event);
				// }
				return;
			}

			this._addPointer(event.pointerId, event.pageX, event.pageY);

			var input = this._eventToInput(event);

			if (this._points != input.n) {
				this._loco.endGesture(input, this._control);
				input.handled = false;
				this._loco.beginGesture(input, this._control);
				this._points = input.n;
			} else {
				this._loco.move(input, this._control);
			}

			if (input.handled) {
				event["_sapui_handledByControl"] = true;
				event.preventDefault();
			}
		}

	};

	InputDevicePointer.prototype.isSupported = function() {
        if ((sap.ui.Device.browser.edge || sap.ui.Device.browser.msie) && sap.ui.Device.support.pointer) {
            return true;
        }
        // Because of the Chrome 55 Pointer Events changes,
		// we need to disable the support for the pointers in chrome and other browsers we havn't tested.
		return false;
		/*
		 * TO DO:
		 * Implement proper pointer support
		 */
	};

	InputDevicePointer.prototype.enable = function(control) {
		this._pointerIds = [];
		this._pointers = [];
		this._points = 0;
		this._count = 0;
		this._buttons = 0;
		this._mouse._buttons = 0;

		this._control = control;
		this._mouse._control = control;

		var func = this._control ? this._control.attachBrowserEvent.bind(this._control) : window.document.addEventListener;
		func("pointerdown", this._pointerdownProxy);
		func("pointerup", this._pointerupProxy);
		func("pointermove", this._pointermoveProxy);
		func("mousewheel", this._mousewheelProxy);
		func("DOMMouseScroll", this._mousewheelProxy);
		func("contextmenu", this._contextmenuProxy);
		window.document.addEventListener("pointerup", this._onpointerupWindowListenerProxy);
	};

	InputDevicePointer.prototype.disable = function() {
		var func = this._control ? this._control.detachBrowserEvent.bind(this._control) : window.document.removeEventListener;
		func("pointerdown", this._pointerdownProxy);
		func("pointerup", this._pointerupProxy);
		func("pointermove", this._pointermoveProxy);
		func("mousewheel", this._mousewheelProxy);
		func("DOMMouseScroll", this._mousewheelProxy);
		func("contextmenu", this._contextmenuProxy);
		window.document.removeEventListener("pointerup", this._onpointerupWindowListenerProxy);
	};

	return InputDevicePointer;
}, /* bExport= */ true);
