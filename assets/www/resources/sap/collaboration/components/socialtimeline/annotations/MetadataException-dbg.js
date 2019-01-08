/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2017 SAP SE. All rights reserved
 */
jQuery.sap.require("sap.ui.base.Object");

jQuery.sap.declare("sap.collaboration.components.socialtimeline.annotations.MetadataException");

sap.ui.base.Object.extend("sap.collaboration.components.socialtimeline.annotations.MetadataException", {
	constructor: function(sExceptionMessage) {
		this._sClassName = "sap.collaboration.components.socialtimeline.annotations.MetadataException";
		this._sExceptionMessage = sExceptionMessage;
	}
});