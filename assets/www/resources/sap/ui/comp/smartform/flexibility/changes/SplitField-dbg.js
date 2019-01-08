/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
		"jquery.sap.global", "sap/ui/fl/Utils", "sap/ui/fl/changeHandler/Base"],
		function(jQuery, FlexUtils, Base) {
	"use strict";

	/**
	 * Change handler for splitting smart form group elements (representing one or more fields).
	 *
	 * @alias sap.ui.comp.smartform.flexibility.changes.SplitField
	 * @author SAP SE
	 * @version 1.52.4
	 * @experimental Since 1.46
	 */
	var SplitField = { };

	/**
	 * Split a smart form group element incl. more value controls.
	 *
	 * @param {sap.ui.fl.Change} oChange change wrapper object with instructions to be applied on the control map
	 * @param {sap.ui.comp.smartform.SmartForm|Element} oControl smartform control that matches the change selector for applying the change
	 * @param {object} mPropertyBag - map of properties
	 * @param {sap.ui.fl.changeHandler.BaseTreeModifier} mPropertyBag.modifier - modifier for the controls
	 * @param {sap.ui.core.UIComponent} mPropertyBag.appComponent - component in which the change should be applied
	 * @param {object} mPropertyBag.view - view object or xml element representing an ui5 view
	 * @return {boolean} true - if change could be applied
	 *
	 * @public
	 */
	SplitField.applyChange = function(oChange, oControl, mPropertyBag) {
		var oChangeDefinition = oChange.getDefinition();
		var oModifier = mPropertyBag.modifier;
		var oAppComponent = mPropertyBag.appComponent;
		var oView = mPropertyBag.view;
		var oSourceControl = oModifier.bySelector(oChangeDefinition.content.sourceSelector, oAppComponent, oView);
		var sLabelText;
		var sNewId;
		var oNewGroupElement;
		var vLabel;

		var oParent = oModifier.bySelector(oChangeDefinition.content.parentSelector, oAppComponent, oView);
		var aNewElementIds = oChangeDefinition.content.newElementIds.slice();
		var aFields = oModifier.getAggregation(oSourceControl, "elements");
		var iLabelElementIndex = oModifier.getProperty(oSourceControl, "elementForLabel");
		var aGroupElements = oModifier.getAggregation(oParent, "groupElements");
		var iControlIndex = aGroupElements.indexOf(oSourceControl);

		vLabel = oModifier.getProperty(oSourceControl, "label");
		if (vLabel && (typeof vLabel !== "string")){
			sLabelText = oModifier.getProperty(vLabel, "text");
		} else {
			sLabelText = vLabel;
		}

		for (var i = 0, n = aFields.length; i < n; i++) {
			if (i !== iLabelElementIndex) {

				// create groupElement with new element ID
				sNewId = aNewElementIds.pop();
				oNewGroupElement = oModifier.createControl("sap.ui.comp.smartform.GroupElement",
					mPropertyBag.appComponent, oView, sNewId);

				// remove field from combined groupElement
				oModifier.removeAggregation(oSourceControl, "elements", aFields[i]);

				// insert field to groupElement
				oModifier.insertAggregation(oNewGroupElement, "elements", aFields[i], 0, oView);
				oModifier.insertAggregation(oParent, "groupElements", oNewGroupElement, iControlIndex + i, oView);

				// set label of groupElement if not set by smartField
				if (oModifier.getControlType(aFields[i]) !== "sap.ui.comp.smartfield.SmartField") {
					vLabel = oModifier.getProperty(oNewGroupElement, "label");
					if (vLabel && (typeof vLabel !== "string")){
						oModifier.setProperty(vLabel, "text", sLabelText);
					} else {
						oModifier.setProperty(oNewGroupElement, "label", sLabelText);
					}
				}
			} else {
				if (iLabelElementIndex !== 0) {
					oModifier.setProperty(oSourceControl, "elementForLabel", 0);
				}
				oModifier.removeAggregation(oSourceControl, "elements", aFields[i]);
				oModifier.insertAggregation(oSourceControl, "elements", aFields[i], 0, oView);

				// set label to combined groupElement if not set by smartField
				if (oModifier.getControlType(aFields[i]) !== "sap.ui.comp.smartfield.SmartField") {
					vLabel = oModifier.getProperty(oSourceControl, "label");
					if (vLabel && (typeof vLabel !== "string")){
						oModifier.setProperty(vLabel, "text", sLabelText);
					} else {
						oModifier.setProperty(oSourceControl, "label", sLabelText);
					}
				}

			}
		}

		return true;

	};

	/**
	 * Completes the change by adding change handler specific content
	 *
	 * @param {sap.ui.fl.Change} oChange change wrapper object to be completed
	 * @param {object} oSpecificChangeInfo - specific change info containing parentId
	 * @param {object} mPropertyBag - map of properties
	 *
	 * @public
	 */
	SplitField.completeChangeContent = function(oChange, oSpecificChangeInfo, mPropertyBag) {
		var oModifier = mPropertyBag.modifier;
		var oAppComponent = mPropertyBag.appComponent;
		var oChangeDefinition = oChange.getDefinition();

		if (oSpecificChangeInfo.newElementIds) {
			oChangeDefinition.content.newElementIds = oSpecificChangeInfo.newElementIds;
		} else {
			throw new Error("oSpecificChangeInfo.newElementIds attribute required");
		}

		if (oSpecificChangeInfo.sourceControlId) {
			oChangeDefinition.content.sourceSelector = oModifier.getSelector(oSpecificChangeInfo.sourceControlId, oAppComponent);
			oChange.addDependentControl(oSpecificChangeInfo.sourceControlId, "sourceControl", mPropertyBag);

		} else {
			throw new Error("oSpecificChangeInfo.sourceControlId attribute required");
		}

		if (oSpecificChangeInfo.parentId) {
			oChangeDefinition.content.parentSelector = oModifier.getSelector(oSpecificChangeInfo.parentId, oAppComponent);
			oChange.addDependentControl(oSpecificChangeInfo.parentId, "parent", mPropertyBag);
		} else {
			throw new Error("oSpecificChangeInfo.parentId attribute required");
		}
	};

	return SplitField;
},
/* bExport= */true);
