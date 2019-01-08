/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	"./library",
	"sap/ui/core/Element"
], function(library, Element) {
	"use strict";

	/**
	 * The configuration of the graphic element on the chart.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Graphical representation of the area micro chart regarding the value lines, the thresholds, and the target values.
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 * @since 1.34
	 *
	 * @public
	 * @alias sap.suite.ui.microchart.AreaMicroChartItem
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var AreaMicroChartItem = Element.extend("sap.suite.ui.microchart.AreaMicroChartItem", /** @lends sap.suite.ui.microchart.AreaMicroChartItem.prototype */ {
		metadata: {
			library: "sap.suite.ui.microchart",
			properties: {
				/**
				 * The graphic element color.
				 */
				color: { group: "Misc", type: "sap.m.ValueColor", defaultValue: "Neutral" },

				/**
				 * The line title.
				 */
				title: { type: "string", group: "Misc", defaultValue: null }
			},
			defaultAggregation: "points",
			aggregations: {

				/**
				 * The set of points for this graphic element.
				 */
				"points": { multiple: true, type: "sap.suite.ui.microchart.AreaMicroChartPoint", bindable: "bindable" }
			}
		}
	});

	return AreaMicroChartItem;
});
