/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'jquery.sap.global', 'sap/ui/fl/Utils'
], function(jQuery, Utils) {
	"use strict";

	/**
	 * Change handler for adding a smart form group element (representing a field).
	 * 
	 * @constructor
	 * @private
	 * @since 1.44.0
	 * @alias sap.ui.comp.navpopover.flexibility.changes.AddLink
	 */
	var AddLink = {};

	/**
	 * Adds a smart form group element incl. a value control.
	 * 
	 * @param {sap.ui.fl.Change} oChange
	 * @param {sap.ui.comp.navpopover.NavigationContainer} oNavigationContainer
	 * @param {object} mPropertyBag
	 * @private
	 */
	AddLink.applyChange = function(oChange, oNavigationContainer, mPropertyBag) {
		var oChangeContent = oChange.getContent();
		if (jQuery.isEmptyObject(oChangeContent)) {
			Utils.log.error("Change does not contain sufficient information to be applied");
			return false;
		}

		// Update the value of 'availableActions' aggregation
		oNavigationContainer.getAvailableActions().some(function(oAvailableAction) {
			if (oAvailableAction.getKey() === oChangeContent.key) {
				// Also if the current visibility is equal to the visibility of the change we have to call '_updateAvailableAction' in order to update
				// the 'Define Links' text.
				mPropertyBag.modifier.setProperty(oAvailableAction, "visible", oChangeContent.visible);
				oNavigationContainer._updateAvailableAction(oAvailableAction, oChange.getLayer());
				return true;
			}
		});
		return true;
	};

	/**
	 * Completes the change by adding change handler specific content
	 * 
	 * @param {sap.ui.fl.Change} oChange Change wrapper object to be completed
	 * @param {object} oSpecificChangeInfo
	 * @param {object} mPropertyBag
	 * @private
	 */
	AddLink.completeChangeContent = function(oChange, oSpecificChangeInfo, mPropertyBag) {
		if (jQuery.isEmptyObject(oSpecificChangeInfo.content)) {
			throw new Error("oSpecificChangeInfo.content should be filled");
		}
		if (!oSpecificChangeInfo.content.key) {
			throw new Error("In oSpecificChangeInfo.content.key attribute is required");
		}
		if (oSpecificChangeInfo.content.visible !== true) {
			throw new Error("In oSpecificChangeInfo.content.select attribute should be 'true'");
		}

		oChange.setContent(oSpecificChangeInfo.content);
	};

	/**
	 * @private
	 */
	AddLink.discardChangesOfLayer = function(sLayer, oNavigationContainer) {
		oNavigationContainer._discardAvailableActions(sLayer);
	};

	return AddLink;
},
/* bExport= */true);
