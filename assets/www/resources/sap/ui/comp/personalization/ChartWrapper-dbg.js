/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'jquery.sap.global', 'sap/ui/core/Element'
], function(jQuery, Element) {
	"use strict";

	/**
	 * The ChartWrapper can be used to wrap a chart.
	 * 
	 * @class Chart Wrapper
	 * @extends sap.ui.core.Element
	 * @author SAP
	 * @version 1.34.0-SNAPSHOT
	 * @private
	 * @since 1.34.0
	 * @alias sap.ui.comp.personalization.ChartWrapper
	 */
	var ChartWrapper = Element.extend("sap.ui.comp.personalization.ChartWrapper",
	/** @lends sap.ui.comp.personalization.ChartWrapper */
	{
		constructor: function(sId, mSettings) {
			Element.apply(this, arguments);
		},
		metadata: {
			library: "sap.ui.comp",
			properties: {
				/**
				 * Array of filters coming from outside.
				 */
				externalFilters: {
					type: "sap.m.P13nFilterItem[]",
					defaultValue: []
				}
			},
			aggregations: {
				/**
				 * Defines columns.
				 */
				columns: {
					type: "sap.ui.comp.personalization.ColumnWrapper",
					multiple: true,
					singularName: "column"
				}
			},
			associations: {
				/**
				 * Defines original chart object.
				 */
				chart: {
					type: "sap.chart.Chart",
					multiple: false
				}
			},
			events: {
				/**
				 * Fire filters set via property <code>externalFilters</code>.
				 */
				externalFiltersSet: {
					parameters: {
						/**
						 * Array of filters to be shown in the filter panel.
						 */
						filters: {
							type: "sap.m.P13nFilterItem[]"
						}
					}
				}
			}
		}
	});

	ChartWrapper.prototype.getChartObject = function() {
		var oChart = this.getAssociation("chart");
		if (typeof oChart === "string") {
			oChart = sap.ui.getCore().byId(oChart);
		}
		return oChart;
	};

	ChartWrapper.prototype.getDomRef = function() {
		var oChart = this.getChartObject();
		return oChart.getDomRef();
	};

	ChartWrapper.prototype.setExternalFilters = function(aFilters) {
		aFilters = this.validateProperty("externalFilters", aFilters);
		this.setProperty("externalFilters", aFilters, true); // no rerendering
		this.fireExternalFiltersSet({
			filters: aFilters
		});
		return this;
	};

	return ChartWrapper;

}, /* bExport= */true);
