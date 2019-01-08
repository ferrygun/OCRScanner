/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
	"sap/ui/fl/changeHandler/ChangeHandlerMediator"
], function (ChangeHandlerMediator) {
	"use strict";

	/**
	 * Function returning a set of SmartField + SmartLabel ready to be added
	 * @param  {sap.ui.fl.changeHandler.BaseTreeModifier} oModifier    Tree Modifier
	 * @param  {object} mPropertyBag Required data for the field + label creation
	 *                               appComponent
	 *                               view
	 *                               fieldSelector
	 *                               bindingPath
	 * @return {object}              Object containing the created control + label
	 */
	var fnCreateField = function(oModifier, mPropertyBag){
		return oModifier.createControl("sap.ui.comp.smartfield.SmartField",
			mPropertyBag.appComponent,
			mPropertyBag.view,
			mPropertyBag.fieldSelector,
			{value : "{" + mPropertyBag.bindingPath + "}"}
		);
	};

	var fnCreateFieldWithLabel = function(oModifier, mPropertyBag){
		var oSmartField = fnCreateField.apply(null, arguments);
		var sNewFieldId = oModifier.getId(oSmartField);
		var oSmartFieldLabel = oModifier.createControl("sap.ui.comp.smartfield.SmartLabel",
			mPropertyBag.appComponent,
			mPropertyBag.view,
			sNewFieldId + "-label",
			{labelFor: sNewFieldId}
		);
		return {
			"label" : oSmartFieldLabel,
			"control" : oSmartField
		};
	};


	// Register the required information to enable the "addODataProperty" action using SmartField
	ChangeHandlerMediator.addChangeHandlerSettings({
		"scenario" : "addODataFieldWithLabel",
		"oDataServiceVersion" : "2.0" }, {
		"createFunction" : fnCreateFieldWithLabel
	});
	ChangeHandlerMediator.addChangeHandlerSettings({
		"scenario" : "addODataFieldWithLabel",
		"oDataServiceVersion" : "1.0" }, {
		"createFunction" : fnCreateFieldWithLabel
	});
	ChangeHandlerMediator.addChangeHandlerSettings({
		"scenario" : "addODataField",
		"oDataServiceVersion" : "2.0" }, {
		"createFunction" : fnCreateField
	});
	ChangeHandlerMediator.addChangeHandlerSettings({
		"scenario" : "addODataField",
		"oDataServiceVersion" : "1.0" }, {
		"createFunction" : fnCreateField
	});

	return {};
}, /* bExport= */true);
