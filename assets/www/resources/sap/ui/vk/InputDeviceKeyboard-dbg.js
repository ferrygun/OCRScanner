/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.vk.InputDeviceKeyboard.
sap.ui.define([
	"jquery.sap.global", "sap/ui/base/EventProvider"
], function(jQuery, EventProvider) {
	"use strict";

	var InputDeviceKeyboard = EventProvider.extend("sap.ui.vk.InputDeviceKeyboard", {
		metadata: {
			publicMethods: [
				"enable",
				"disable"
			]
		},

		constructor: function(loco) {
			this._loco = loco;
		}
	});

	InputDeviceKeyboard.prototype.enable = function(control) {
		this._control = control;
		this._control.attachBrowserEvent("keydown keyup keypress", this._onKeyEvent, this);
	};

	InputDeviceKeyboard.prototype.disable = function() {
		this._control.detachBrowserEvent("keydown keyup keypress", this._onKeyEvent, this);
	};

	InputDeviceKeyboard.prototype._onKeyEvent = function(event) {
		this._loco.keyEventHandler(event, this._control);
	};

	return InputDeviceKeyboard;

}, true);
