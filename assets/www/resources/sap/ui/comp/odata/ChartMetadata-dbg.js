/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// ---------------------------------------------------------------------------------
// Class used to determine/retrieve UI chart type based on the annotation chart type
// ---------------------------------------------------------------------------------
sap.ui.define([
], function() {
	"use strict";


	var mUi5ChartTypeForAnnotationChartType = {
		"com.sap.vocabularies.UI.v1.ChartType/Column": "column",
		"com.sap.vocabularies.UI.v1.ChartType/ColumnStacked": "stacked_column",
		"com.sap.vocabularies.UI.v1.ChartType/ColumnDual": "dual_column",
		"com.sap.vocabularies.UI.v1.ChartType/ColumnStackedDual": "dual_stacked_column",
		"com.sap.vocabularies.UI.v1.ChartType/ColumnStacked100": "100_stacked_column",
		"com.sap.vocabularies.UI.v1.ChartType/ColumnStackedDual100": "100_dual_stacked_column",
		"com.sap.vocabularies.UI.v1.ChartType/Bar": "bar",
		"com.sap.vocabularies.UI.v1.ChartType/BarStacked": "stacked_bar",
		"com.sap.vocabularies.UI.v1.ChartType/BarDual": "dual_bar",
		"com.sap.vocabularies.UI.v1.ChartType/BarStackedDual": "dual_stacked_bar",
		"com.sap.vocabularies.UI.v1.ChartType/BarStacked100": "100_stacked_bar",
		"com.sap.vocabularies.UI.v1.ChartType/BarStackedDual100": "100_dual_stacked_bar",
		"com.sap.vocabularies.UI.v1.ChartType/Area": "line",
		"com.sap.vocabularies.UI.v1.ChartType/AreaStacked": "stacked_column",
		"com.sap.vocabularies.UI.v1.ChartType/AreaStacked100": "100_stacked_column",
		"com.sap.vocabularies.UI.v1.ChartType/HorizontalArea": "bar",
		"com.sap.vocabularies.UI.v1.ChartType/HorizontalAreaStacked": "stacked_bar",
		"com.sap.vocabularies.UI.v1.ChartType/HorizontalAreaStacked100": "100_stacked_bar",
		"com.sap.vocabularies.UI.v1.ChartType/Line": "line",
		"com.sap.vocabularies.UI.v1.ChartType/LineDual": "dual_line",
		"com.sap.vocabularies.UI.v1.ChartType/Combination": "combination",
		"com.sap.vocabularies.UI.v1.ChartType/CombinationStacked": "stacked_combination",
		"com.sap.vocabularies.UI.v1.ChartType/CombinationDual": "dual_combination",
		"com.sap.vocabularies.UI.v1.ChartType/CombinationStackedDual": "dual_stacked_combination",
		"com.sap.vocabularies.UI.v1.ChartType/HorizontalCombinationStacked": "horizontal_stacked_combination",
		"com.sap.vocabularies.UI.v1.ChartType/Pie": "pie",
		"com.sap.vocabularies.UI.v1.ChartType/Donut": "donut",
		"com.sap.vocabularies.UI.v1.ChartType/Scatter": "scatter",
		"com.sap.vocabularies.UI.v1.ChartType/Bubble": "bubble",
		"com.sap.vocabularies.UI.v1.ChartType/Radar": "line",
		"com.sap.vocabularies.UI.v1.ChartType/HeatMap": "heatmap",
		"com.sap.vocabularies.UI.v1.ChartType/TreeMap": "treemap",
		"com.sap.vocabularies.UI.v1.ChartType/Waterfall": "waterfall",
		"com.sap.vocabularies.UI.v1.ChartType/Bullet": "bullet",
		"com.sap.vocabularies.UI.v1.ChartType/VerticalBullet": "vertical_bullet"
	};

	var mMeasureRole = {
		"com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis1": "axis1",
		"com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis2": "axis2",
		"com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis3": "axis3"
	};

	var mDinemsionRole = {
		"com.sap.vocabularies.UI.v1.ChartDimensionRoleType/Category": "category",
		"com.sap.vocabularies.UI.v1.ChartDimensionRoleType/Series": "series"
	};

	var mValidCriticalityThresholds = [
		"AcceptanceRangeLowValue", "AcceptanceRangeHighValue", "ToleranceRangeLowValue", "ToleranceRangeHighValue", "DeviationRangeLowValue", "DeviationRangeHighValue"
	];

	/**
	 * Object used to determine/retrieve UI5 chart metadata based on the annotation chart metadata
	 *
	 * @private
	 * @experimental This module is only for internal/experimental use!
	 */
	var ChartMetadata = {
		mCriticalityType: {},
		mImprovementDirectionType: {},
		/**
		 * Gets the UI5 chart type based on Annotation chart type.
		 *
		 * @public
		 * @param {string} The Annotation chart type
		 * @returns {string} the UI5 chart type (if found)
		 */
		getChartType: function(sType) {
			return mUi5ChartTypeForAnnotationChartType[sType];
		},
		/**
		 * Gets the Annotation chart type based on UI5 chart type.
		 *
		 * @public
		 * @param {string} sUI5ChartType The UI5 chart type
		 * @returns {string} the Annotation chart type (if found)
		 */
		getAnnotationChartType: function(sUI5ChartType) {
			for ( var sChartType in mUi5ChartTypeForAnnotationChartType) {
				if (mUi5ChartTypeForAnnotationChartType[sChartType] === sUI5ChartType) {
					return sChartType;
				}
			}
		},
		/**
		 * Gets the UI5 measure role based on Annotation measure role.
		 *
		 * @public
		 * @param {string} The Annotation measure role
		 * @returns {string} the UI5 measure role (if found)
		 */
		getMeasureRole: function(sRole) {
			return mMeasureRole[sRole];
		},
		/**
		 * Gets the UI5 dimension role based on Annotation dimension role.
		 *
		 * @public
		 * @param {string} The Annotation dimension role
		 * @returns {string} the UI5 dimension role (if found)
		 */
		getDimensionRole: function(sRole) {
			return mDinemsionRole[sRole];
		},

		/**
		 * Get the valid criticality threshold identifiers for semantic coloring.
		 *
		 * @returns {array} the valid criticality thresholds
		 * @public
		 */
		getCriticalityThresholds: function() {
			return mValidCriticalityThresholds;
		},

		/**
		 * Calculates the constant value based on a criticality threshold annotation.
		 *
		 * @param {oThreshold} The criticality threshold annotation
		 * @returns {number} The constant number value for the given annotation
		 * @public
		 */
		calculateConstantValue: function(oThresholdData) {
			var oValue = oThresholdData ? (oThresholdData.Decimal || oThresholdData.Int || oThresholdData.String) : undefined;
			// return value is a number from API
			return Number(oValue);
		},

		/**
		 * Gets the <code>CriticalityType</code> for the annotation.
		 *
		 * @see sap.chart.coloring.CriticalityType
		 * @param {sCriticalityType} The enumeration value for the <code>CriticalityType</code>
		 * @returns {sap.chart.coloring.CriticalityType} The charts semantic color type
		 * @public
		 */
		getCriticalityType: function(sCriticalityType) {
			return ChartMetadata.mCriticalityType[sCriticalityType];

		},

		/**
		 * Gets the <code>ImprovementDirectionType</code> for the annotation.
		 *
		 * @see sap.chart.coloring.ImprovementDirectionType
		 * @param {sImprovementDirectionType} The enumeration value for the <code>ImprovementDirectionType</code>
		 * @returns {sap.chart.coloring.ImprovementDirectionType} The improvement directions value
		 * @public
		 */
		getImprovementDirectionType: function(sImprovementDirectionType) {
			return ChartMetadata.mImprovementDirectionType[sImprovementDirectionType];

		},

		/**
		 *
		 */
		feedWithChartLibrary: function(chartLibrary) {
			if (!ChartMetadata.chartLibrary) {
				ChartMetadata.chartLibrary = chartLibrary;

				var CriticalityType = chartLibrary.coloring.CriticalityType;
				var ImprovementDirectionType = chartLibrary.coloring.ImprovementDirectionType;


				ChartMetadata.mCriticalityType = {
					"com.sap.vocabularies.UI.v1.CriticalityType/Neutral": CriticalityType.Neutral,
					"com.sap.vocabularies.UI.v1.CriticalityType/Negative": CriticalityType.Negative,
					"com.sap.vocabularies.UI.v1.CriticalityType/Critical": CriticalityType.Critical,
					"com.sap.vocabularies.UI.v1.CriticalityType/Positive": CriticalityType.Positive
				};

				ChartMetadata.mImprovementDirectionType = {
					"com.sap.vocabularies.UI.v1.ImprovementDirectionType/Target": ImprovementDirectionType.Target,
					"com.sap.vocabularies.UI.v1.ImprovementDirectionType/Maximize": ImprovementDirectionType.Maximize,
					"com.sap.vocabularies.UI.v1.ImprovementDirectionType/Minimize": ImprovementDirectionType.Minimize
				};

			}
		}
	};

	return ChartMetadata;

}, /* bExport= */true);
