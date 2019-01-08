/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"jquery.sap.global", "sap/ui/core/Element"
], function (jQuery, Element) {
	"use strict";
	/**
	 * Creates and initializes a new time axis
	 *
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Defines the time axis of a Gantt chart
	 * @extends sap.ui.core.Element
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @constructor
	 * @public
	 * @deprecated As of version 1.44, replaced by sap.gantt.axistime.AxisTimeStrategy
	 * @alias sap.gantt.config.TimeAxis
	 */
	var TimeAxis = Element.extend("sap.gantt.config.TimeAxis", /** @lends sap.gantt.config.TimeAxis.prototype */ {
		metadata: {
			library: "sap.gantt",
			properties: {
				/**
				 * Whole time horizon of the Gantt chart
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.TimeHorizon</code>. Otherwise some properties you set may not function properly.
				 */
				planHorizon: {type: "object", defaultValue: sap.gantt.config.DEFAULT_PLAN_HORIZON},
				/**
				 * Time horizon which is displayed after the Gantt chart is initialized
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.TimeHorizon</code>. Otherwise some properties you set may not function properly.
				 */
				initHorizon: {type: "object", defaultValue: sap.gantt.config.DEFAULT_INIT_HORIZON},
				/**
				 * Zoom strategy of the Gantt chart
				 * See {@link sap.gantt.config.DEFAULT_TIME_ZOOM_STRATEGY} as example
				 */
				zoomStrategy: {type: "object", defaultValue: sap.gantt.config.DEFAULT_TIME_ZOOM_STRATEGY},
				/**
				 * Initial granularity of the time axis 
				 */
				granularity: {type: "string", defaultValue: "4day"},
				/**
				 * Granularity when the Gantt chart is zoomed in to the maximum
				 */
				finestGranularity: {type: "string", defaultValue: "5min"},
				/**
				 * Granularity when the GanttChart is zoomed out to the minimum
				 */
				coarsestGranularity: {type: "string", defaultValue: "1month"},
				/**
				 * Zoom rate of the Gantt chart
				 */
				rate: {type: "float", defaultValue: 1}
			}
		}
	});
	
	return TimeAxis;
}, true);