/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'jquery.sap.global', 'sap/ui/fl/changeHandler/Base'
], function(jQuery, Base) {
	"use strict";

	/**
	 * Change handler for removing a smart form group.
	 *
	 * @alias sap.ui.fl.changeHandler.RemoveGroup
	 * @author SAP SE
	 * @version 1.52.4
	 * @experimental Since 1.27.0
	 */
	var RemoveGroup = { };

	/**
	 * Removes a smart form group.
	 *
	 * @param {sap.ui.fl.Change} oChange change wrapper object with instructions to be applied on the control map
	 * @param {sap.ui.comp.smartform.Group|Element} oGroup group control that matches the change selector for applying the change
	 * @param {object} mPropertyBag
	 * @param {sap.ui.fl.changeHandler.BaseTreeModifier} mPropertyBag.modifier - modifier for the controls
	 * @param {sap.ui.core.UIComponent} mPropertyBag.appComponent - component in which the change should be applied
	 * @param {object} mPropertyBag.view - view object or xml element representing an ui5 view
	 * @return {boolean} true if successfully added
	 * @public
	 */
	RemoveGroup.applyChange = function(oChange, oGroup, mPropertyBag) {
		var oModifier = mPropertyBag.modifier;
		var oView = mPropertyBag.view;

		var oForm = oModifier.getParent(oGroup);
		if (oModifier.getControlType(oForm) === "sap.ui.layout.form.Form") {
			oModifier.removeAggregation(oForm, "formContainers", oGroup, oView);
		} else {
			oModifier.removeAggregation(oForm, "groups", oGroup, oView);
		}
		return true;
	};

	/**
	 * Completes the change by adding change handler specific content
	 *
	 * @param {sap.ui.fl.Change} oChangeWrapper change wrapper object to be completed
	 * @param {object} oSpecificChangeInfo as an empty object since no additional attributes are required for this operation
	 * @public
	 */
	RemoveGroup.completeChangeContent = function(oChangeWrapper, oSpecificChangeInfo) {
		var oChange = oChangeWrapper.getDefinition();
		if (!oChange.content) {
			oChange.content = {};
		}
	};

	return RemoveGroup;
},
/* bExport= */true);
