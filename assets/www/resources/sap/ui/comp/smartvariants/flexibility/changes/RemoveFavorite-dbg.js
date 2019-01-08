/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'jquery.sap.global', 'sap/ui/fl/Utils'
], function(jQuery, Utils) {
	"use strict";

	/**
	 * Change handler for removing the favorite flag to the variant.
	 * 
	 * @constructor
	 * @private
	 * @since 1.50
	 * @alias sap.ui.comp.smartvariants.flexibility.changes..RemoveFavorite
	 */
	var RemoveFavorite = {};

	/**
	 * Removes the favorite flag from a variant.
	 * 
	 * @param {sap.ui.fl.Change} oChange
	 * @param {sap.ui.comp.variants.VariantManagement} oVariantManagement control
	 * @param {object} mPropertyBag
	 * @private
	 */
	RemoveFavorite.applyChange = function(oChange, oVariantManagement, mPropertyBag) {
		var oChangeContent = oChange.getContent();
		if (jQuery.isEmptyObject(oChangeContent)) {
			Utils.log.error("Change does not contain sufficient information to be applied");
			return false;
		}

		// Update the value of 'favorites' property
		oVariantManagement.getItems().some(function(oItem) {
			if (oItem.getKey() === oChangeContent.key) {
				// Also if the current visibility is equal to the visibility of the change we have to call '_updateAvailableAction' in order to update
				// the 'Define Links' text.
				// mPropertyBag.modifier.setProperty(oItem, "visible", oChangeContent.visible);
				oItem.setFavorite(oChangeContent.visible);
				return true;
			} else if (oItem.getKey() === sap.ui.comp.STANDARD_VARIANT_NAME) {
				oVariantManagement.setStandardFavorite(oChangeContent.visible);
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
	RemoveFavorite.completeChangeContent = function(oChange, oSpecificChangeInfo, mPropertyBag) {
		if (jQuery.isEmptyObject(oSpecificChangeInfo.content)) {
			throw new Error("oSpecificChangeInfo.content should be filled");
		}
		if (!oSpecificChangeInfo.content.key) {
			throw new Error("In oSpecificChangeInfo.content.key attribute is required");
		}
		if (oSpecificChangeInfo.content.visible !== false) {
			throw new Error("In oSpecificChangeInfo.content.select attribute should be 'false'");
		}

		oChange.setContent(oSpecificChangeInfo.content);
	};

	return RemoveFavorite;
},
/* bExport= */true);
