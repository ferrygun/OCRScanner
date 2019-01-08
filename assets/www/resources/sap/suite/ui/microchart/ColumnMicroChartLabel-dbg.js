/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

// This control displays the history of values as a line mini chart or an area mini chart.
sap.ui.define(['jquery.sap.global', './library', 'sap/ui/core/Element'],
	function(jQuery, library, Element) {
	"use strict";

	/**
	 * Constructor for a new ColumnMicroChartLabel control.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Displays or hides the labels of a column micro chart.
	 * @extends sap.ui.core.Control
	 *
	 * @version 1.52.4
	 * @since 1.34
	 *
	 * @public
	 * @alias sap.suite.ui.microchart.ColumnMicroChartLabel
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var ColumnMicroChartLabel = Element.extend("sap.suite.ui.microchart.ColumnMicroChartLabel", /** @lends sap.suite.ui.microchart.ColumnMicroChartLabel.prototype */ {
		metadata : {
			library : "sap.suite.ui.microchart",
			properties : {

				/**
				 * The graphic element color.
				 */
				color: { group: "Misc", type: "sap.m.ValueColor", defaultValue: "Neutral" },

				/**
				 * The line title.
				 */
				label: { type : "string", group : "Misc", defaultValue : "" }
			}
		}
	});

	return ColumnMicroChartLabel;

});
