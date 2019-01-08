/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'jquery.sap.global', 'sap/ui/fl/changeHandler/BaseRename'
], function(jQuery, BaseRename) {
	"use strict";

	/**
	 * Change handler for renaming a SmartForm group.
	 * @constructor
	 * @alias sap.ui.fl.changeHandler.RenameGroup
	 * @author SAP SE
	 * @version 1.52.4
	 * @experimental Since 1.27.0
	 */
	var RenameGroup = BaseRename.createRenameChangeHandler({
		propertyName : "label",
		changePropertyName : "groupLabel",
		translationTextType : "XFLD"
	});

	return RenameGroup;
},
/* bExport= */true);