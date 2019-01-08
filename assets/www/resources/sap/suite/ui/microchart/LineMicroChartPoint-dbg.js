/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

// Provides sap.suite.ui.microchart.LineMicroChartPoint control.
sap.ui.define(['sap/ui/core/Control'],
	function(Control) {
	"use strict";

	/**
	 * Constructor for a new LineMicroChartPoint.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Contains the point of the line micro chart.
	 * @extends sap.ui.core.Control
	 *
	 * @version 1.52.4
	 * @since 1.48.0
	 *
	 * @constructor
	 * @public
	 * @alias sap.suite.ui.microchart.LineMicroChartPoint
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var LineMicroChartPoint = Control.extend("sap.suite.ui.microchart.LineMicroChartPoint", /** @lends sap.suite.ui.microchart.LineMicroChartPoint.prototype */ {
		metadata: {
			properties: {
				/**
				 * The point's horizontal position.
				 */
				x: {type: "float", group: "Data", defaultValue: 0},
				/**
				 * The point's vertical position.
				 */
				y: {type: "float", group: "Data", defaultValue: 0}
			}
		}
	});

	return LineMicroChartPoint;

});