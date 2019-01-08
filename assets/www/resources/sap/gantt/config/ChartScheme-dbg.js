/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	'jquery.sap.global', 'sap/ui/core/Element'
], function (jQuery, Element) {
	"use strict";
	/**
	 * Creates and initializes a new ChartScheme class
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * The ChartScheme control is one of the settings of {@link sap.gantt.GanttChart}. 
	 * <p>A Gantt chart uses this setting to decide the mode of Gantt chart and the shapes to display in the Gantt chart.
	 * A Gantt chart contains one or more Chart schemes. By switching between these schemes, the Gantt chart can display different shapes.
	 * </p>
	 * @extends sap.ui.core.Element
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @constructor
	 * @public
	 * @alias sap.gantt.config.ChartScheme
	 */
	var ChartScheme = Element.extend("sap.gantt.config.ChartScheme", /** @lends sap.gantt.config.ChartScheme.prototype */ {
		metadata: {
			properties: {
				/**
				 * Unique key of the Chart scheme
				 */
				key: {type: "string", defaultValue: null},
				/**
				 * Description of the Chart scheme
				 */
				name: {type: "string", defaultValue: null},
				/**
				 * Decides the row height of {@link sap.gantt.GanttChartBase}
				 * For example, if rowSpan is 2, the row height of the Gantt chart equals twice of the row height of the tree table
				 */
				rowSpan: {type: "int", defaultValue: 1},
				/**
				 * URL of the icon of the Chart scheme
				 */
				icon: {type: "sap.ui.core.URI", defaultValue: null},
				/**
				 * Key of {@link sap.gantt.config.Mode}
				 */
				modeKey: {type: "string", defaultValue: sap.gantt.config.DEFAULT_MODE_KEY},
				/**
				 * Decides whether the shape has a background
				 */
				haveBackground: {type: "boolean", defaultValue: false},
				/**
				 * Decides the background color of the row in the chart scheme
				 */
				backgroundClass: {type: "string"},
				/**
				 * Array of the key of {@link sap.gantt.config.Shape}
				 */
				shapeKeys: {type: "string[]", defaultValue: []},
				/**
				 * Decides which attribute serves as the purpose of "rowIndex" if it has multiple rows
				 */
				rowIndexName: {type: "string", defaultValue: "rowIndex"}
			}
		}
	});

	return ChartScheme;
}, true);