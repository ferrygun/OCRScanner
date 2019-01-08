/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2016 SAP SE. All rights reserved
	
 */

/**
 * Utility shared functions for sap.rules.ui.
 * @return {object} Utils
 */
sap.ui.define(function() {
	"use strict";
	
	var Utils = {};
	Utils.msieversion = function() {
		var ua = window.navigator.userAgent;
		var msie = ua.indexOf('MSIE ');
		var trident = ua.indexOf('Trident/');
		if (msie > 0) {
			// IE 10 or older => return version number
			return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
		}
		if (trident > 0) {
			// IE 11 (or newer) => return version number
			var rv = ua.indexOf('rv:');
			return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
		}
		// other browser
		return false;
	};
	
	Utils.parseUTFToString = function(errorDetails) {
		var r = /\\u([\w]{4})/gi;
		var x = errorDetails.replace(r, function(match, grp) {
			return String.fromCharCode(parseInt(grp, 16));
		});
		x = unescape(x);
		return x;
	};
	
	/**
	 * Composes the deep data structure of a rule from flata ODataModel.
	 * This method is a workaround of ODataModel bug in getProperty(sRootPath, null, true).
	 * @param {object} oModel - ODataModel
	 * @param {string} sRootPath - path to the root of rule
	 * @return {object} rule data
	 */
	Utils.getDTRuleData = function(oModel, sRootPath) {
		var rule = oModel.getProperty(sRootPath);
		
		if (!rule) {
			return null;
		}
		
		// fetch "DecisionTable"
		var decisionTable = oModel.getProperty(sRootPath + "/DecisionTable");
		if (!decisionTable) {
			return rule;
		}
		
		// clone data 
		rule = jQuery.extend(true, {}, rule);
		decisionTable = jQuery.extend(true, {}, decisionTable);
		
		rule.DecisionTable = decisionTable;
		
		// fetch Decision Table Columns
		var dtColumns = Utils.getDTRuleColumnsData(oModel, sRootPath);
		if (dtColumns) {
			rule.DecisionTable.DecisionTableColumns = dtColumns;
		}
		
		return rule;
	};
	
	Utils.getDTRuleColumnsData = function(oModel, sRootPath) {
		var dtColumnsKeys = oModel.getProperty(sRootPath + "/DecisionTable/DecisionTableColumns");
		
		if (!dtColumnsKeys) {
			return null;
		}
		
		var dtColumns = {
			results: []
		};
		
		// fetch columns data by key
		for (var i = 0; i < dtColumnsKeys.length; i++) {
			var column = oModel.getProperty("/" + dtColumnsKeys[i]);
			// clone data
			column = jQuery.extend(true, {}, column);
			
			var conditionColumn = oModel.getProperty("/" + dtColumnsKeys[i] + "/Condition");
			if (conditionColumn) {
				column.Condition = conditionColumn;
			}
			var resultColumn = oModel.getProperty("/" + dtColumnsKeys[i] + "/Result");
			if (resultColumn) {
				column.Result = resultColumn;
			}
			
			dtColumns.results.push(column);
		}
		
		return dtColumns;
	};
	
	Utils.getDTRuleRowsData = function(oModel, sRootPath) {
		var dtRowsKeys = oModel.getProperty(sRootPath + "/DecisionTable/DecisionTableRows");
		
		if (!dtRowsKeys) {
			return null;
		}
		
		var dtRows = {
			results: []
		};
		
		// fetch rows data by key
		for (var i = 0; i < dtRowsKeys.length; i++) {
			var row = oModel.getProperty("/" + dtRowsKeys[i]);
			// clone data 
			row = jQuery.extend(true, {}, row);
			
			var cellKeys = oModel.getProperty("/" + dtRowsKeys[i] + "/Cells");
			
			if (!cellKeys) {
				dtRows.results.push(row);
				continue;
			}
			
			var cells = {
				results: []
			};
			
			// fetch cells data by key
			for (var j = 0; j < cellKeys.length; j++) {
				var cell = oModel.getProperty("/" + cellKeys[j]);
				cells.results.push(cell);
			}
			
			row.Cells = cells;
			
			dtRows.results.push(row);
		}
		
		return dtRows;
	};
	
	return Utils;
}, /* bExport= */ true);