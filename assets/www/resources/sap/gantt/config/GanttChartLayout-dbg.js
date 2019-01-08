/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	'jquery.sap.global', 'sap/ui/core/Element'
], function (jQuery, Element) {
	"use strict";
	/**
	 * Creates and initializes a new Gantt chart layout
	 *
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Defines the Gantt chart layout. This includes but is not limited to the CSS size, mode, and hierarchy of the Gantt chart.
	 * @extends sap.ui.core.Element
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @constructor
	 * @public
	 * @alias sap.gantt.config.GanttChartLayout
	 */
	var GanttChartLayout = Element.extend("sap.gantt.config.GanttChartLayout", /** @lends sap.gantt.config.GanttChartLayout.prototype */ {
		metadata: {
			properties: {
				/**
				 *CSS Size of the Gantt chart. See {@link sap.ui.core.CSSSize}
				 */
				ganttChartSize: {type: "sap.ui.core.CSSSize", defaultValue: null},
				/**
				 * Key of the mode. See {@link sap.gantt.config.Mode}
				 */
				activeModeKey: {type: "string", defaultValue: sap.gantt.config.DEFAULT_MODE_KEY},
				/**
				 * Key of the hierarchy. See {@link sap.gantt.config.Hierarchy}
				 */
				hierarchyKey: {type: "string", defaultValue: sap.gantt.config.DEFAULT_HIERARCHY_KEY}
			}
		}
	});
	
	return GanttChartLayout;
}, true);