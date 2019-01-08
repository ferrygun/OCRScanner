/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	"jquery.sap.global", "./library", "sap/ui/core/Element"
], function(jQuery, library, Element) {
	"use strict";

	/**
	 * The configuration of the graphic element on the chart.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Configures the slices of the pie chart.
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 * @since 1.34
	 *
	 * @public
	 * @alias sap.suite.ui.microchart.HarveyBallMicroChartItem
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var HarveyBallMicroChartItem = Element.extend("sap.suite.ui.microchart.HarveyBallMicroChartItem", /** @lends sap.suite.ui.microchart.HarveyBallMicroChartItem.prototype */ {
		metadata: {
			library: "sap.suite.ui.microchart",
			properties: {

				/**
				 *The value label color.
				 */
				color: { group: "Misc", type: "sap.m.ValueColor", defaultValue: "Neutral" },

				/**
				 *The fraction value.
				 */
				fraction: { group: "Misc", type: "float", defaultValue: "0" },

				/**
				 *The fraction label. If specified, it is displayed instead of the fraction value.
				 */
				fractionLabel: { group: "Misc", type: "string" },

				/**
				 *The scaling factor that is displayed after the fraction value.
				 */
				fractionScale: { group: "Misc", type: "string" },

				/**
				 *If set to true, the fractionLabel parameter is considered as the combination of the fraction value and scaling factor. The default value is false. It means that the fraction value and the scaling factor are defined separately by the fraction and the fractionScale properties accordingly.
				 */
				formattedLabel: { group: "Misc", type: "boolean", defaultValue: false }

			}
		}
	});

	return HarveyBallMicroChartItem;
});
