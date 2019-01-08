/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	"sap/chart/data/Dimension",
	"sap/chart/utils/ChartUtils"
], function(
	Dimension,
	ChartUtils
) {
	"use strict";

	/**
	 * Constructor for a new ui5/data/TimeDimension.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given 
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Definition of a single time dimension in a chart
	 * @extends sap.chart.data.Dimension
	 *
	 * @constructor
	 * @public
	 * @since 1.38.0
	 * @name sap.chart.data.TimeDimension
	 */
	var TimeDimension = Dimension.extend("sap.chart.data.TimeDimension", {
		metadata : {
			library : "sap.chart",
			properties : {
				/**
				 * Detailed unit infomation of TimeDimension. Please refer to {@link sap.chart.TimeUnitType TimeUnitType}.
				 */
				timeUnit : {type : "sap.chart.TimeUnitType"},
				/**
				 * Detailed fiscalYearPeriodCount of TimeDimension. It contains period numbers of fiscal years, like
				 * <pre>
				 * {
				 *	 default: 12,
				 *	 deviations: {
				 *	 	 "2012": 10,
				 *	 	 "2013": 16
				 *	 }
				 * }
				 * </pre>
				 */
				fiscalYearPeriodCount : {type : "object"},
				/**
				 * A time value (aligned with 'timeUnit') to indicate the start point of projected values.
				 */
				projectedValueStartTime : { type: "any"}
			}
		}
	});
	
	TimeDimension.prototype.setTimeUnit = ChartUtils.makeNotifyParentProperty("timeUnit");
	TimeDimension.prototype.setFiscalYearPeriodCount = ChartUtils.makeNotifyParentProperty("fiscalYearPeriodCount");
	TimeDimension.prototype.setProjectedValueStartTime = ChartUtils.makeNotifyParentProperty("projectedValueStartTime");

	return TimeDimension;
});
