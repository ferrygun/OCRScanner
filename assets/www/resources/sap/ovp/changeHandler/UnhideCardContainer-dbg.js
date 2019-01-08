/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */

sap.ui.define([
	'jquery.sap.global',
	'sap/ui/fl/changeHandler/JsControlTreeModifier'
], function(jQuery, JsControlTreeModifier) {
	"use strict";

	/**
	 * Change handler for revealing(unhide) of a componentContainer control.
	 * @alias sap.ui.fl.changeHandler.UnhideCardContainer
	 * @author SAP SE
	 * @version 1.52.4
	 * @experimental Since 1.27.0
	 */
	var UnhideCardContainer = {
			"changeHandler": {},
			"layers": {
				"CUSTOMER_BASE": true,
				"CUSTOMER": true,
				"USER": true
			}
	};

	/**
	 * Unhides a componentContainer control.
	 *
	 * @param {sap.ui.fl.Change} oChange change object with instructions to be applied on the control map
	 * @param {sap.ui.core.Control} oControl control that matches the change selector for applying the change
	 * @param {object} mPropertyBag - map of properties
	 * @returns {boolean} true - if change could be applied
	 * @public
	 */
	UnhideCardContainer.changeHandler.applyChange = function(oChange, oPanel, mPropertyBag){
    	mPropertyBag.modifier.byId(oChange.getContent().revealedElementId).setVisible(true);
        return true;
    };

	/**
	 * Completes the change by adding change handler specific content
	 *
	 * @param {sap.ui.fl.oChange} oChange change object to be completed
	 * @param {object} oSpecificChangeInfo as an empty object since no additional attributes are required for this operation
	 * @param {object} mPropertyBag - map of properties
	 * @param {sap.ui.core.UiComponent} mPropertyBag.appComponent component in which the change should be applied
	 * @public
	 */
	UnhideCardContainer.changeHandler.completeChangeContent = function(oChange, oSpecificChangeInfo, mPropertyBag) {
        oChange.setContent({
        	"revealedElementId": oSpecificChangeInfo.revealedElementId
        });
    };

	return UnhideCardContainer;
},
/* bExport= */true);
