/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'jquery.sap.global', 'sap/ui/fl/changeHandler/BaseRename', "sap/ui/fl/Utils"
], function(jQuery, BaseRename, Utils) {
	"use strict";

	var PROPERTY_NAME = "label";
	var CHANGE_PROPERTY_NAME = "fieldLabel";
	var TT_TYPE = "XFLD";

	/**
	 * Change handler for renaming a smart form group element.
	 * @constructor
	 * @alias sap.ui.fl.changeHandler.RenameField
	 * @author SAP SE
	 * @version 1.52.4
	 * @experimental Since 1.27.0
	 */
	var RenameField = BaseRename.createRenameChangeHandler({
		changePropertyName : CHANGE_PROPERTY_NAME,
		translationTextType : TT_TYPE
	});

	/**
	 * Renames a SmartField.
	 *
	 * @param {sap.ui.fl.Change} oChange change wrapper object with instructions to be applied on the control map
	 * @param {sap.ui.core.Control|Element} oControl Control that matches the change selector for applying the change
	 * @param {object} mPropertyBag property bag
	 * @param {sap.ui.fl.changeHandler.BaseTreeModifier} mPropertyBag.modifier - modifier for the controls
	 * @param {sap.ui.core.UIComponent} mPropertyBag.appComponent - component in which the change should be applied
	 * @param {object} mPropertyBag.view - view object or xml element representing an ui5 view
	 * @returns {boolean} true if successful
	 * @public
	 */
	RenameField.applyChange = function(oChange, oControl, mPropertyBag) {
		var oModifier = mPropertyBag.modifier;
		var oChangeDefinition = oChange.getDefinition();
		var sText = oChangeDefinition.texts[CHANGE_PROPERTY_NAME];
		var sValue = sText.value;

		if (oChangeDefinition.texts && sText && typeof (sValue) === "string") {

			// The value can be a binding - e.g. for translatable values in WebIde
			// In order to properly save the undo, the label "text" property also needs to be set
			var vLabel = oModifier.getProperty(oControl, "label");
			if (Utils.isBinding(sValue)) {
				if (vLabel && (typeof vLabel !== "string")){
					oModifier.setPropertyBinding(vLabel, "text", sValue);
				} else {
					oModifier.setPropertyBinding(oControl, PROPERTY_NAME, sValue);
				}
			} else {
				if (vLabel && (typeof vLabel !== "string")){
					oModifier.setProperty(vLabel, "text", sValue);
				} else {
					oModifier.setProperty(oControl, PROPERTY_NAME, sValue);
				}
			}

			return true;

		} else {
			Utils.log.error("Change does not contain sufficient information to be applied: [" + oChangeDefinition.layer + "]" + oChangeDefinition.namespace + "/" + oChangeDefinition.fileName + "." + oChangeDefinition.fileType);
			//however subsequent changes should be applied
		}
	};

	return RenameField;
},
/* bExport= */true);
