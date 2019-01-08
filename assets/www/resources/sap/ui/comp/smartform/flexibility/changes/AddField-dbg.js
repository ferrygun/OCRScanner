/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
	"jquery.sap.global", "sap/ui/fl/Utils", "sap/ui/fl/changeHandler/Base", "sap/ui/fl/changeHandler/JsControlTreeModifier"
], function(jQuery, Utils, Base, JsControlTreeModifier) {
	"use strict";

	/**
	 * Change handler for adding a smart form group element (representing a field).
	 * @constructor
	 * @alias sap.ui.fl.changeHandler.AddField
	 * @author SAP SE
	 * @version 1.52.4
	 * @experimental Since 1.27.0
	 */
	var AddField = {};

	/**
	 * Adds a smart form group element incl. a value control.
	 *
	 * @param {sap.ui.fl.Change} oChange change wrapper object with instructions to be applied on the control map
	 * @param {sap.ui.comp.smartform.Group|Element} oGroup group control that matches the change selector for applying the change
	 * @param {object} mPropertyBag - property bag
	 * @param {sap.ui.fl.changeHandler.BaseTreeModifier} mPropertyBag.modifier - modifier for the controls
	 * @param {sap.ui.core.UIComponent} mPropertyBag.appComponent - component in which the change should be applied
	 * @param {object} mPropertyBag.view - view object or xml element representing an ui5 view
	 * @return {boolean} true if successfully added
	 * @public
	 */
	AddField.applyChange = function(oChange, oGroup, mPropertyBag) {
		var oChangeDefinition = oChange.getDefinition();

		var fnCheckChangeDefinition = function(oChangeDefinition) {
			var bMandatoryTextsArePresent = oChangeDefinition.texts && oChangeDefinition.texts.fieldLabel && oChangeDefinition.texts.fieldLabel.value;
			var bContentPresent = oChangeDefinition.content;
			var bMandatoryContentPresent = false;

			if (bContentPresent) {
				bMandatoryContentPresent = oChangeDefinition.content.field && (oChangeDefinition.content.field.selector || oChangeDefinition.content.field.id) &&
					oChangeDefinition.content.field.jsType && oChangeDefinition.content.field.value && oChangeDefinition.content.field.valueProperty;
			}

			return  bMandatoryTextsArePresent && bContentPresent && bMandatoryContentPresent;
		};

		var oModifier = mPropertyBag.modifier;
		var oView = mPropertyBag.view;


		if (fnCheckChangeDefinition(oChangeDefinition)) {
			var oChangeContent = oChangeDefinition.content;

			var sFieldSelector = oChangeContent.field.selector;
			var sFieldId = oChangeContent.field.id;
			var sLabelText = oChangeDefinition.texts.fieldLabel.value;
			var sJsType = oChangeContent.field.jsType;
			var sPropertyName = oChangeContent.field.valueProperty;
			var oPropertyValue = oChangeContent.field.value;
			var oEntitySet = oChangeContent.field.entitySet;
			var insertIndex = oChangeContent.field.index;

			var oGroupElement = oModifier.createControl("sap.ui.comp.smartform.GroupElement", mPropertyBag.appComponent, oView, sFieldSelector || sFieldId);


			oModifier.setProperty(oGroupElement, "label", undefined);
			oModifier.setProperty(oGroupElement, "label", sLabelText);

			oModifier.insertAggregation(oGroup, "groupElements", oGroupElement, insertIndex, oView);

			this.addElementIntoGroupElement(oModifier, oView, oGroupElement, sLabelText, sJsType, sPropertyName, oPropertyValue, oEntitySet, insertIndex, mPropertyBag.appComponent);
			return true;
		} else {
			Utils.log.error("Change does not contain sufficient information to be applied: [" + oChangeDefinition.layer + "]" + oChangeDefinition.namespace + "/" + oChangeDefinition.fileName + "." + oChangeDefinition.fileType);
			//however subsequent changes should be applied
		}
	};

	AddField.addElementIntoGroupElement = function(oModifier, oView, oGroupElement, sLabelText, sJsType, sPropertyName, oPropertyValue, sEntitySet, iIndex, oAppComponent) {

		var oValueControl = oModifier.createControl(sJsType, oAppComponent, oView);
		oModifier.bindProperty(oValueControl, sPropertyName, oPropertyValue);
		oModifier.insertAggregation(oGroupElement, "elements", oValueControl, iIndex, oView, true);
		if (sEntitySet) {
			oModifier.setProperty(oValueControl, "entitySet", sEntitySet);
		}
		//TODO Check if necessary
		// if (oValueControl.setTextLabel) {
		// 	oValueControl.setTextLabel(oChangeDefinition.texts["fieldLabel" + i].value);
		// }

	};

	/**
	 * Completes the change by adding change handler specific content
	 *
	 * @param {sap.ui.fl.Change} oChange change wrapper object to be completed
	 * @param {object} oSpecificChangeInfo with attributes "fieldLabel", the field label to be included in the change,
	 * 								 "fieldValue", the value for the control that displays the value,
	 * 								 "valueProperty", the control property that holds the field value,
	 * 								 "newControlId", the control ID for the control to be added
	 * 								 and "jsType", the JavaScript control for the field value.
	 * @public
	 */
	AddField.completeChangeContent = function(oChange, oSpecificChangeInfo, mPropertyBag) {
		var oAppComponent = mPropertyBag.appComponent;
		var oChangeDefinition = oChange.getDefinition();

		if (oSpecificChangeInfo.fieldLabel) {
			Base.setTextInChange(oChangeDefinition, "fieldLabel", oSpecificChangeInfo.fieldLabel, "XFLD");
		} else {
			throw new Error("oSpecificChangeInfo.fieldLabel attribute required");
		}
		if (!oChangeDefinition.content) {
			oChangeDefinition.content = {};
		}
		if (!oChangeDefinition.content.field) {
			oChangeDefinition.content.field = {};
		}
		if (oSpecificChangeInfo.fieldValue) {
			oChangeDefinition.content.field.value = oSpecificChangeInfo.fieldValue;
		} else {
			throw new Error("oSpecificChangeInfo.fieldValue attribute required");
		}
		if (oSpecificChangeInfo.valueProperty) {
			oChangeDefinition.content.field.valueProperty = oSpecificChangeInfo.valueProperty;
		} else {
			throw new Error("oSpecificChangeInfo.valueProperty attribute required");
		}
		if ( oSpecificChangeInfo.newControlId ){
			oChangeDefinition.content.field.selector = JsControlTreeModifier.getSelector(oSpecificChangeInfo.newControlId, oAppComponent, {
				index : oSpecificChangeInfo.index
			});
		} else {
			throw new Error("oSpecificChangeInfo.newControlId attribute required");
		}
		if (oSpecificChangeInfo.jsType) {
			oChangeDefinition.content.field.jsType = oSpecificChangeInfo.jsType;
		} else {
			throw new Error("oSpecificChangeInfo.jsType attribute required");
		}
		if (oSpecificChangeInfo.index === undefined) {
			throw new Error("oSpecificChangeInfo.index attribute required");
		} else {
			oChangeDefinition.content.field.index = oSpecificChangeInfo.index;
		}
		if (oSpecificChangeInfo.entitySet){
			//an optional entity set can be configured
			oChangeDefinition.content.field.entitySet = oSpecificChangeInfo.entitySet;
		}

	};

	return AddField;
},
/* bExport= */true);
