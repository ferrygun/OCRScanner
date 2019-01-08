/*
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([], function() {
	"use strict";

	function ChartLog(sType, sName, sMessage) {
		this._type = sType;
		this._name = sName;
		this._message = sMessage;
	}

	ChartLog.prototype.display = function() {
		if (this._type === "error") {
			jQuery.sap.log.error("[Analytical Chart] " + this._name, this._message);
		}
	};

	return ChartLog;
});