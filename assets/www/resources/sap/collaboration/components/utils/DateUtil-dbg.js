/**
 * ! SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2017 SAP SE. All rights reserved
 */
sap.ui.define(['jquery.sap.global','sap/ui/base/Object', "sap/collaboration/components/utils/LanguageBundle"], 
	function(jQuery, Object, LanguageBundle) {
	"use strict";
	/**
	 * Date Utility Class for Collaboration
	 *
	 * @class
	 * Language bundle for Collaboration 
	 * @extends sap.ui.base.Object
	 *
	 * @author SAP SE
	 * @version ${version}
	 *
	 * @constructor
	 * @public
	 */
	var DateUtil = Object.extend("sap.collaboration.components.util.DateUtil", {
		constructor: function(){
			this._oLanguageBundle = new LanguageBundle();
		},
		/**
		 * Format date object to string
		 * @param {Date} The date to be formatted
		 * @return {string} Formated date string 
		 * @memberOf sap.collaboration.components.utils.DateUtil
		 * @public
		 */
		formatDateToString: function(oDate){
	        var oDateFormatter = sap.ui.core.format.DateFormat.getDateInstance({style:"short", relative:true}, sap.ui.getCore().getConfiguration().getLocale());
	        var oTimeFormatter = sap.ui.core.format.DateFormat.getTimeInstance({style:"short"}, sap.ui.getCore().getConfiguration().getLocale());
	        var sDate = oDateFormatter.format(oDate) + " " + this._oLanguageBundle.getText("ST_GROUP_SELECT_AT") + " " + oTimeFormatter.format(oDate);

	        var pattern = /[A-Za-z]/; //check if the first character is lowercase, if so, then uppercase it
	        if(sDate.charAt(0).match(pattern)){
	              sDate = sDate.charAt(0).toUpperCase() + sDate.slice(1);
	        }
	        return sDate;
		},
	});
	
	return DateUtil;
},/* bExport= */ true );

