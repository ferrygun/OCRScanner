/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	'jquery.sap.global', 'sap/ui/core/Element'
], function (jQuery, Element) {
	"use strict";
	/**
	 * Creates and initializes a new object type
	 *
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Define the ObjectType which is used in GanttChart
	 * @extends sap.ui.core.Element
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @constructor
	 * @public
	 * @alias sap.gantt.config.ObjectType
	 */
	var ObjectType = Element.extend("sap.gantt.config.ObjectType", /** @lends sap.gantt.config.ObjectType.prototype */ {
		metadata: {
			properties: {
				/**
				 * Unique Key of the object type
				 */
				key: {type: "string", defaultValue: null},
				/**
				 * Description of the object type
				 */
				description: {type: "string", defaultValue: null},
				/**
				 * Specifies the chart scheme in which the the object type can be shown
				 * Key of {@link sap.gantt.config.ChartScheme}
				 */
				mainChartSchemeKey: {type: "string", defaultValue: sap.gantt.config.DEFAULT_MAIN_CHART_SCHEME_KEY},
				/**
				 * Specifies the expanded chart scheme in which the the object type can be shown
				 * Array of keys of {@link sap.gantt.config.ChartScheme}
				 */
				expandedChartSchemeKeys: {type: "string[]", defaultValue: []}
			}
		}
	});

	return ObjectType;
}, true);