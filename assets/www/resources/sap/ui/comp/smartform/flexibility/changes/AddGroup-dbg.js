/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
	"sap/ui/fl/Utils", "jquery.sap.global", "sap/ui/fl/changeHandler/Base", "sap/ui/fl/changeHandler/JsControlTreeModifier"
], function(Utils, jQuery, Base, JsControlTreeModifier) {
	"use strict";

	/*
	 * Change handler for adding a smart form group.
	 * @alias sap.ui.fl.changeHandler.AddGroup
	 * @author SAP SE
	 * @version 1.52.4
	 * @experimental Since 1.27.0
	 */
	var AddGroup = { };

	/**
	 * Adds a smart form group.
	 *
	 * @param {sap.ui.fl.Change} oChange change object with instructions to be applied on the control map
	 * @param {sap.ui.comp.smartform.SmartForm|Element} oForm smart form control that matches the change selector for applying the change
	 * @param {object} oControlMap flat list of ids that point to control instances
	 * @param {object} mPropertyBag
	 * @param {sap.ui.fl.changeHandler.BaseTreeModifier} mPropertyBag.modifier - modifier for the controls
	 * @param {sap.ui.core.UIComponent} mPropertyBag.appComponent - component in which the change should be applied
	 * @param {object} mPropertyBag.view - view object or xml element representing an ui5 view
	 * @public
	 */
	AddGroup.applyChange = function(oChange, oForm, mPropertyBag) {
		var oModifier = mPropertyBag.modifier;
		var oAppComponent = mPropertyBag.appComponent;
		var oView = mPropertyBag.view;
		var oChangeDefinition = oChange.getDefinition();
		if (oChangeDefinition.texts && oChangeDefinition.texts.groupLabel && oChangeDefinition.texts.groupLabel.value && oChangeDefinition.content && oChangeDefinition.content.group && (oChangeDefinition.content.group.selector || oChangeDefinition.content.group.id)) {
			var sLabelText = oChangeDefinition.texts.groupLabel.value;
			var iInsertIndex = oChangeDefinition.content.group.index;
			var oGroup = oModifier.createControl("sap.ui.comp.smartform.Group", oAppComponent, oView, oChangeDefinition.content.group.selector || oChangeDefinition.content.group.id);

			oModifier.setProperty(oGroup, "visible", true);
			oModifier.setProperty(oGroup, "label", sLabelText);
			oModifier.insertAggregation(oForm, "groups", oGroup, iInsertIndex, oView);

		} else {
			Utils.log.error("Change does not contain sufficient information to be applied: [" + oChangeDefinition.layer + "]" + oChangeDefinition.namespace + "/" + oChangeDefinition.fileName + "." + oChangeDefinition.fileType);
			//however subsequent changes should be applied
		}
	};

	/**
	 * Completes the change by adding change handler specific content
	 *
	 * @param {sap.ui.fl.Change} oChange change wrapper object to be completed
	 * @param {object} oSpecificChangeInfo with attributes "groupLabel", the group label to be included in the change and "newControlId", the control ID for the control to be added
	 * @param {object} mPropertyBag
	 * @param {sap.ui.core.UiComponent} mPropertyBag.appComponent component in which the change should be applied
	 * @public
	 */
	AddGroup.completeChangeContent = function(oChange, oSpecificChangeInfo, mPropertyBag) {
		var oChangeDefinition = oChange.getDefinition();
		var oAppComponent = mPropertyBag.appComponent;

		if (oSpecificChangeInfo.newLabel) {
			Base.setTextInChange(oChangeDefinition, "groupLabel", oSpecificChangeInfo.newLabel, "XFLD");
		} else {
			throw new Error("oSpecificChangeInfo.groupLabel attribute required");
		}
		if (!oChangeDefinition.content) {
			oChangeDefinition.content = {};
		}
		if (!oChangeDefinition.content.group) {
			oChangeDefinition.content.group = {};
		}

		if (oSpecificChangeInfo.index === undefined) {
			throw new Error("oSpecificChangeInfo.index attribute required");
		} else {
			oChangeDefinition.content.group.index = oSpecificChangeInfo.index;
		}

		if ( oSpecificChangeInfo.newControlId ){
			oChangeDefinition.content.group.selector = JsControlTreeModifier.getSelector(oSpecificChangeInfo.newControlId, oAppComponent);
		} else {
			throw new Error("oSpecificChangeInfo.newControlId attribute required");
		}
	};

	return AddGroup;
},
/* bExport= */true);
