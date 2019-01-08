/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// ------------------------------------------------------------------------------------------
// Utility class used by smart controls for creating stable ids.
// ------------------------------------------------------------------------------------------
sap.ui.define([
	"jquery.sap.global", 'sap/ui/base/DataType'
], function(jQuery, DataType) {
	"use strict";

	/**
	 * Utility class used by smart controls for creating stable ids
	 * 
	 * @private
	 * @experimental This module is only for internal/experimental use!
	 */
	var IdentifierUtil = {
		/**
		 * Static function that replaces special characters with a underscore.<br>
		 * 
		 * @param {String} sName - String whose special characters shall be replaced. 
		 * @returns {String} Cleaned up String 
		 * 
		 */
		replace: function(sName){
			
			var t = DataType.getType("sap.ui.core.ID");
			if (!t.isValid(sName)) {
				sName = sName.replace(/[^A-Za-z0-9_.:]+/g, "_");
				if (!t.isValid(sName)) {
					sName = "A_" + sName;
				}
			}
			return sName;
		}
	};
	return IdentifierUtil;
}, /* bExport= */true);