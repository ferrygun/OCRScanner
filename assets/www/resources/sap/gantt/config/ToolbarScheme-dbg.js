/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	'jquery.sap.global', 'sap/ui/core/Element'
], function (jQuery, Element) {
	"use strict";
	/**
	 * Creates and initializes a new toolbar scheme
	 *
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Defines the Toolbar scheme
	 * @extends sap.ui.core.Element
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @constructor
	 * @public
	 * @alias sap.gantt.config.ToolbarScheme
	 */
	var ToolbarScheme = Element.extend("sap.gantt.config.ToolbarScheme", /** @lends sap.gantt.config.ToolbarScheme.prototype */ {
		metadata: {
			properties: {
				/**
				 * Unique key of the toolbar scheme
				 */
				key: {type: "string", defaultValue: null},
				/**
				 * Toolbar group for selecting a source
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.ToolbarGroup</code>. 
				 * Otherwise some properties you set may not function properly.
				 */
				sourceSelect: {type: "object", defaultValue: null},
				/**
				 * Toolbar group for the Gantt chart layout
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.LayoutGroup</code>. 
				 * Otherwise some properties you set may not function properly.
				 */
				layout: {type: "object", defaultValue: null},
				/**
				 * Toolbar group for custom toolbar items
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.ToolbarGroup</code>. 
				 * Otherwise some properties you set may not function properly.
				 */
				customToolbarItems: {type: "object", defaultValue: null},
				/**
				 * Toolbar group for expanding a chart
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.ExpandChartGroup</code>. 
				 * Otherwise some properties you set may not function properly.
				 */
				expandChart: {type: "object", defaultValue: null},
				/**
				 * Toolbar group for expanding nodes of a tree table
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.ToolbarGroup</code>. 
				 * Otherwise some properties you set may not function properly.
				 */
				expandTree: {type: "object", defaultValue: null},
				/**
				 * Toolbar group for the time zoom
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.ToolbarGroup</code>. 
				 * Otherwise some properties you set may not function properly.
				 */
				timeZoom: {type: "object", defaultValue: null},
				/**
				 * Toolbar group for legend
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.ToolbarGroup</code>. 
				 * Otherwise some properties you set may not function properly.
				 */
				legend: {type: "object", defaultValue: null},
				/**
				 * See {@link sap.gantt.config.SettingGroup}
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.SettingGroup</code>. 
				 * Otherwise some properties you set may not function properly.
				 */
				settings: {type: "object", defaultValue: null},
				/**
				 * See {@link sap.gantt.config.ModeGroup}
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.ModeGroup</code>. 
				 * Otherwise some properties you set may not function properly.
				 */
				mode: {type: "object", defaultValue: null},
				/**
				 * Toolbar design. See {@link sap.m.ToolbarDesign}
				 */
				toolbarDesign: {type: "string", defaultValue: sap.m.ToolbarDesign.Auto}
			}
		}
	});
	
	ToolbarScheme.prototype.setTimeZoom = function(oTimeZoom) {
		//for backward compatibility, oTimeZoom could be instance of sap.gantt.config.ToolbarGroup
		//if so, we need to convert it to sap.gantt.config.TimeZoomGroup
		var oTemp = oTimeZoom;
		if (!(oTemp instanceof sap.gantt.config.TimeZoomGroup)) {
			oTemp = new sap.gantt.config.TimeZoomGroup();
			oTemp.setOverflowPriority(oTimeZoom.getOverflowPriority());
			oTemp.setPosition(oTimeZoom.getPosition());
		}
		this.setProperty("timeZoom", oTemp);
		return this;
	};
	
	return ToolbarScheme;
}, true);