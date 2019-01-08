/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2017 SAP SE. All rights reserved
 */

/*
 * This module is an exception class whose objects are thrown during File class object construction.
 * An exception of this kind is thrown when the File constructor isn't provided the arguments
 * it need to build an instance of the File class. 
 */

jQuery.sap.declare("sap.collaboration.components.fiori.sharing.attachment.InvalidAttachmentConstructorArgumentsException");

sap.ui.base.Object.extend("sap.collaboration.components.fiori.sharing.attachment.InvalidAttachmentConstructorArgumentsException", {
	constructor: function() {
		/** @private */ this.exceptionName = "InvalidAttachmentConstructorArgumentsException";
	}
});
