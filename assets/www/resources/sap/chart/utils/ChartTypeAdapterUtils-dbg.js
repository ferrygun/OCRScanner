/*
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */
sap.ui.define([
    'sap/chart/utils/ChartUtils'
],function(
    ChartUtils
) {
    "use strict";

    var ChartTypeAdapterUtils = {};

    function timeSeriesAdaptHandler(sChartType, aDimensions) {
        var bHasTimeDimension = aDimensions.some(function(oDim) {
            return oDim instanceof sap.chart.data.TimeDimension;
        });
        if (bHasTimeDimension) {
            return ChartUtils.CONFIG.oAdapteredChartTypes[sChartType];
        } else {
            return sChartType;
        }
    }

    ChartTypeAdapterUtils.adaptChartType = function(sChartType, aDimensions) {
        if (ChartUtils.CONFIG.oAdapteredChartTypes[sChartType]) {
            return timeSeriesAdaptHandler(sChartType, aDimensions);
        } else {
            return sChartType;
        }
    };

    return ChartTypeAdapterUtils;
});
