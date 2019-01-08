/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	'jquery.sap.global', './ToolbarGroup'
], function (jQuery, ToolbarGroup) {
	"use strict";
	/**
	 * Creates and initializes a new expand chart group
	 *
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Defines a toolbar group for the expand chart-related toolbar items. These expand chart-related toolbar items are displayed in the Gantt chart toolbar.
	 * @extends sap.gantt.config.ToolbarGroup
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @constructor
	 * @public
	 * @alias sap.gantt.config.ExpandChartGroup
	 */
	var ExpandChartGroup = ToolbarGroup.extend("sap.gantt.config.ExpandChartGroup", /** @lends sap.gantt.config.ExpandCharGroup.prototype */ {
		metadata: {
			properties: {
				/**
				 * Array of {@link sap.gantt.config.ExpandChart}
				 */
				expandCharts: {type: "object[]", defaultValue: []},
				
				/**
				 * When this property is enabled, expand button is in emphasized button type, and collapse button
				 * is in default button type.
				 */
				enableRichType: {type: "boolean"},
				
				/**
				 * When this property is enabled, text arrow is shown beside icon indicating expand/collapse function
				 */
				showArrowText: {type: "boolean"}
			}
		}
	});

	return ExpandChartGroup;
}, true);
