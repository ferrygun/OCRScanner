/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2017 SAP SE. All rights reserved
 */

jQuery.sap.declare("sap.collaboration.components.fiori.sharing.attachment.InvalidAttachmentParameterException");

sap.ui.base.Object.extend("sap.collaboration.components.fiori.sharing.attachment.InvalidAttachmentParameterException", {
	constructor: function(parameter) {
		/** @private */ this.exceptionName = "InvalidAttachmentParameterException: " + parameter;
	}
});
