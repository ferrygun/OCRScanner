/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	'jquery.sap.global', 'sap/ui/core/Element'
], function (jQuery, Element) {
	"use strict";
	/**
	 * Creates and initializes a new hierarchy
	 *
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Defines the hierarchy in the Gantt chart. The hierarchy is used for building the tree table in {@link sap.gantt.GanttChartWithTable}.
	 * @extends sap.ui.core.Element
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @constructor
	 * @public
	 * @alias sap.gantt.config.Hierarchy
	 */
	var Hierarchy = Element.extend("sap.gantt.config.Hierarchy", /** @lends sap.gantt.config.Hierarchy.prototype */ {
		metadata: {
			properties: {
				/**
				 * Unique key of the hierarchy
				 */
				key: {type: "string", defaultValue: sap.gantt.config.DEFAULT_HIERARCHY_KEY},
				/**
				 * Description of the hierarchy
				 */
				text: {type: "string", defaultValue: "Default Hierarchy"},
				/**
				 * Key of {@link sap.gantt.config.Mode}
				 */
				activeModeKey: {type: "string", defaultValue: sap.gantt.config.DEFAULT_MODE_KEY},
				/**
				 * Key of {@link sap.gantt.config.ToolbarScheme}
				 */
				toolbarSchemeKey: {type: "string", defaultValue: sap.gantt.config.DEFAULT_GANTTCHART_TOOLBAR_SCHEME_KEY},
				/**
				 * Columns of the hierarchy. Array of {@link sap.gantt.config.HierarchyColumn}
				 */
				columns: {type: "object[]"},
				/**
				 * expandedLevels determines how the tree table is initially expanded.
				 * This property is a two-dimensional array containing object types of row data. Only rows with data of 
				 * the specified object types are expanded. Each child array represents a specific level in the hierarchy 
				 * with the first child array representing the first level and so forth. For example, if 
				 * this property is set to [["02", "03"], ["05"]], rows containing data of object types 02 or 03 in the 
				 * first level and rows containing data of object type 05 in the second level are expanded.
				 * @deprecated This feature may cause severe performance issue! Since TreeTable doesn't have API to 
				 * expand specific multiple rows in one call, GanttChart expand the tree tale to level calculated from 
				 * the configuration, then loop all data in the model, collapse the node which does not full-fill the 
				 * configuration one by one. This feature is application specific and should be handled by application.
				 */
				expandedLevels: {type: "string[][]"}
			}
		}
	});
	Hierarchy.prototype.init = function(){
		this._oRb = sap.ui.getCore().getLibraryResourceBundle("sap.gantt");
		this.setText(this._oRb.getText("XLST_DEFAULT_HIE"));
	}; 
	
	return Hierarchy;
}, true);