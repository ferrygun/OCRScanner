/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'jquery.sap.global', 'sap/ui/fl/changeHandler/BaseRename'
], function(jQuery, BaseRename) {
	"use strict";

	/**
	 * Change handler for renaming a smart form title
	 * @constructor
	 * @alias sap.ui.fl.changeHandler.RenameTitle
	 * @author SAP SE
	 * @version 1.52.4
	 * @experimental Since 1.46
	 */
	var RenameTitle = BaseRename.createRenameChangeHandler({
		propertyName : "title",
		changePropertyName : "fieldLabel",
		translationTextType : "XFLD"
	});

	return RenameTitle;
},
/* bExport= */true);