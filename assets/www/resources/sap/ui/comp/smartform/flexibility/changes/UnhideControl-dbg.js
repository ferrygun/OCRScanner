/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([], function() {
	"use strict";

	/**
	 * Change handler for revealing a smart form group element.
	 * @alias sap.ui.comp.smartform.flexibility.changes.UnhideControl
	 * @author SAP SE
	 * @version 1.52.4
	 * @experimental Since 1.44.0
	 */
	var UnhideControl = { };

	/**
	 * Reveals a smart form group element.
	 *
	 * @param {sap.ui.fl.Change} oChange change wrapper object with instructions to be applied on the control map
	 * @param {sap.ui.comp.smartform.GroupElement|Element} oGroupElement GroupElement control that matches the change selector for applying the change
	 * @param {object} mPropertyBag property bag
	 * @param {sap.ui.fl.changeHandler.BaseTreeModifier} mPropertyBag.modifier - modifier for the controls
	 * @param {sap.ui.core.UIComponent} mPropertyBag.appComponent - component in which the change should be applied
	 * @param {object} mPropertyBag.view - view object or xml element representing an ui5 view
	 * @return {boolean} true if successfully added
	 * @public
	 */
	UnhideControl.applyChange = function(oChange, oGroupElement, mPropertyBag) {
		var oModifier = mPropertyBag.modifier;
		var aFields = oModifier.getAggregation(oGroupElement, "elements");

		var bPartiallyVisible = aFields.some(function(oField) {
			return oModifier.getVisible(oField);
		});

		// if there is a visible field inside the group element, don't set all fields to visible
		if (!bPartiallyVisible) {
			aFields.forEach(function(oField) {
				oModifier.setVisible(oField, true);
			});
		}

		// if there is a label, it needs to be set visible aswell
		var oLabel = oModifier.getAggregation(oGroupElement, "label");
		if (oLabel && (typeof oLabel !== "string")) {
			oModifier.setVisible(oLabel, true);
		}
		oModifier.setVisible(oGroupElement, true);
		return true;
	};

	/**
	 * Completes the change by adding change handler specific content
	 *
	 * @param {sap.ui.fl.Change} oChangeWrapper change wrapper object to be completed
	 * @param {object} oSpecificChangeInfo as an empty object since no additional attributes are required for this operation
	 * @public
	 */
	UnhideControl.completeChangeContent = function(oChangeWrapper, oSpecificChangeInfo) {
		var oChange = oChangeWrapper.getDefinition();
		if (!oChange.content) {
			oChange.content = {};
		}
	};

	return UnhideControl;
},
/* bExport= */true);
