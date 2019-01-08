/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
	"jquery.sap.global",
	"sap/ui/comp/library",
	"sap/ui/core/Control",
	"sap/ui/comp/providers/ChartProvider",
	"sap/suite/ui/microchart/library",
	"sap/ui/core/CustomData",
	"sap/ui/comp/smartmicrochart/SmartMicroChartCommons"
], function(jQuery, CompLibrary, Control, ChartProvider, MicroChartLibrary, CustomData, SmartMicroChartCommons) {
	"use strict";

	/**
	 * Constructor for a new sap.ui.comp.smartmicrochart.SmartMicroChart.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The SmartMicroChart control creates a chart based on OData metadata and the configuration specified by <code>mSettings</code>.
	 * The entitySet property must be specified in order to use the control. This property is used to fetch metadata and
	 * annotation information from the given default OData model. Depending on the UI/ChartType annotation, the control
	 * creates a corresponding <code>SmartAreaMicroChart</code>, <code>SmartBulletMicroChart</code> or <code>SmartRadialMicroChart</code> instance and delegates to the internal control.
	 *        <br>
	 * <b><i>Note:</i></b> Most of the attributes are not dynamic and cannot be changed once the control has been initialized.
	 * @extends sap.ui.core.Control
	 * @version 1.52.4
	 * @since 1.38
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartmicrochart.SmartMicroChart
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var SmartMicroChart = Control.extend("sap.ui.comp.smartmicrochart.SmartMicroChart", /** @lends sap.ui.comp.smartmicrochart.SmartMicroChart.prototype */ {
		metadata: {

			library: "sap.ui.comp",
			designTime: true,
			properties: {

				/**
				 * The entity set name to fetch data and create the internal chart representation from.
				 * Note that this is not a dynamic UI5 property.
				 */
				entitySet: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Determines if any label is shown or not
				 */
				showLabel: {
					type: "boolean",
					group: "Appearance",
					defaultValue: true
				},

				/**
				 * If set to <code>true</code>, this enables automatic binding of the chart using the chartBindingPath (if it exists) or entitySet
				 * property.
				 */
				enableAutoBinding: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * This attribute can be used to specify the path that
				 * is used during the binding of the chart. If not
				 * specified, the entitySet attribute is used instead and also stored in this property.
				 * Calling <code>bindElement</code> binds the control and sets this property.
				 */
				chartBindingPath: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Specifies the type of chart. Note that this property is read-only.
				 */
				chartType: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Defines the width.
				 */
				width: { type: "sap.ui.core.CSSSize", group: "Misc", defaultValue: "164px" },

				/**
				 * Defines the height.
				 */
				height: { type: "sap.ui.core.CSSSize", group: "Misc", defaultValue: "74px" },

				/**
				 * If this set to true, width and height of the control are determined by the width and height of the container in which the control is placed.
				 * <code>width</code> and <code>height</code> properties are ignored in such case.
				 */
				isResponsive: { type: "boolean", group: "Appearance", defaultValue: false }
			},
			defaultAggregation: "_chart",
			aggregations: {
				/**
				 * This private aggregation is used for the internal instance of Smart<*>MicroChart.
				 */
				_chart: {
					type: "sap.ui.core.Control",
					multiple: false,
					visibility: "hidden"
				}
			},
			associations: {
				/**
				 * If the associated control is provided, its <code>text</code> property is set to the Title property of the Chart annotation.
				 * Title property of the DataPoint annotation is ignored.
				 */
				chartTitle: {
					type: "sap.m.Label",
					group: "Misc",
					multiple: false
				},
				/**
				 * If the associated control is provided, its <code>text</code> property is set to the Description property of the Chart annotation.
				 * Description property of the DataPoint annotation is ignored.
				 */
				chartDescription: {
					type: "sap.m.Label",
					group: "Misc",
					multiple: false
				},
				/**
				 * If the associated control is provided, its <code>text</code> property is set to the Unit of Measure. The Value property of the DataPoint annotation should be annotated with this Unit of Measure. It can be either ISOCurrency or Unit from the OData Measures annotations.
				 */
				unitOfMeasure: {
					type: "sap.m.Label",
					group: "Misc",
					multiple: false
				},

				/**
				 * If the associated control is provided, its <code>text</code> property is set to the free text provided by annotations.
				 * The Value property of the DataPoint annotation should be annotated with this free text.
				 * As of 1.42.0, this association is only available for chart type 'Donut'.
				 *
				 * @since 1.42.0
				 */
				freeText: {
					type: "sap.m.Label",
					group: "Misc",
					multiple: false
				}
			},
			events: {

				/**
				 * Event fired once the control has been initialized.
				 */
				initialize: {}
			}
		}
	});

	SmartMicroChart.prototype.init = function() {
		this._bIsinitialized = false;
		this._bMetaModelLoadAttached = false;
	};

	/**
	 * @private
	 * @returns {sap.ui.comp.smartmicrochart.SmartMicroChart} Returns <code>this</code> to allow method chaining
	 */
	SmartMicroChart.prototype.setChartType = function() {
		return this;
	};

	SmartMicroChart.prototype.getChartType = function() {
		return this.getAggregation("_chart").getChartType();
	};

	SmartMicroChart.prototype.propagateProperties = function() {
		if (Control.prototype.propagateProperties) {
			Control.prototype.propagateProperties.apply(this, arguments);
		}
		this._initializeMetadata();
	};

	SmartMicroChart.prototype.onBeforeRendering = function() {
		var oChart = this.getAggregation("_chart");
		if (oChart) {
			if (oChart.getMetadata().hasProperty("height")) {
				oChart.setProperty("height", this.getHeight(), true);
			}
			if (oChart.getMetadata().hasProperty("width")) {
				oChart.setProperty("width", this.getWidth(), true);
			}
			if (oChart.getMetadata().hasProperty("isResponsive")) {
				oChart.setProperty("isResponsive", this.getIsResponsive(), true);
				MicroChartLibrary._passParentContextToChild(this, oChart);
			}
			if (oChart.getMetadata().hasProperty("showLabel")) {
				oChart.setProperty("showLabel", this.getShowLabel(), true);
			}
			if (oChart.getMetadata().hasAssociation("chartTitle")) {
				oChart.setAssociation("chartTitle", this.getChartTitle(), true);
			}
			if (oChart.getMetadata().hasAssociation("chartDescription")) {
				oChart.setAssociation("chartDescription", this.getChartDescription(), true);
			}
			if (oChart.getMetadata().hasAssociation("unitOfMeasure")) {
				oChart.setAssociation("unitOfMeasure", this.getUnitOfMeasure(), true);
			}
			if (oChart.getMetadata().hasAssociation("freeText")) {
				oChart.setAssociation("freeText", this.getFreeText(), true);
			}
		}
	};

	/**
	 * Initializes the OData metadata necessary to create the chart.
	 * @private
	 */
	SmartMicroChart.prototype._initializeMetadata = function() {
		if (!this._bIsinitialized) {
			var oModel = this.getModel();
			if (oModel && (oModel.getMetadata().getName() === "sap.ui.model.odata.v2.ODataModel" || oModel.getMetadata().getName() === "sap.ui.model.odata.ODataModel")) {
				if (!this._bMetaModelLoadAttached) {
					oModel.getMetaModel().loaded().then(this._onMetadataInitialized.bind(this));
					this._bMetaModelLoadAttached = true;
				}
			} else if (oModel) {
				// Could be a non-ODataModel or a synchronous ODataModel --> just create the necessary helpers
				this._onMetadataInitialized();
			}
		}
	};

	/**
	 * Creates an instance of the chart provider
	 * @private
	 */
	SmartMicroChart.prototype._createChartProvider = function() {
		var sEntitySetName = this.getEntitySet(), oModel = this.getModel();
		// The SmartAreaMicroChart might also needs to work for non ODataModel models; hence we now create the chart
		// independent of ODataModel.
		if (oModel && sEntitySetName) {
			this._oChartProvider = new ChartProvider({
				entitySet: sEntitySetName,
				model: oModel,
				chartQualifier: this.data("chartQualifier")
			});
		}
	};

	/**
	 * Called once the necessary Model metadata is available
	 * @private
	 */
	SmartMicroChart.prototype._onMetadataInitialized = function() {
		this._bMetaModelLoadAttached = false;
		if (!this._bIsinitialized) {
			this._createChartProvider();
			if (this._oChartProvider) {
				this._oChartViewMetadata = this._oChartProvider.getChartViewMetadata();
				if (this._oChartViewMetadata) {
					this._bIsinitialized = true;
					this._createInnerChart();
					this.invalidate();
				}
			}
		}
	};

	/**
	 * Determines which type of chart should be created depending on the ChartType annotation and creates required chart, e.g. SmartBulletChart or SmartAreaChart.
	 * @private
	 */
	SmartMicroChart.prototype._createInnerChart = function() {
		if (!this._checkChartMetadata()) {
			jQuery.sap.log.error("Created annotations not valid. Please review the annotations and metadata.");
			return;
		}

		var sChartType = this._oChartViewMetadata.chartType;
		switch (sChartType) {
			case "line" :
			case "area" :
				var sType = this._oChartViewMetadata.annotation.ChartType.EnumMember.split("/").pop().toLowerCase();
				if (sType === "area" || sType === "line") {
					this._buildSmartAreaMicroChart();
				} else {
					jQuery.sap.log.error("Not supported chart type used.");
				}
				break;
			case "bullet" :
				this._buildSmartBulletMicroChart();
				break;
			case "donut" :
				this._buildSmartRadialMicroChart();
				break;
			default :
				jQuery.sap.log.error("Not supported chart type used.");
				break;
		}
	};

	/**
	 * Constructs an instance of SmartAreaMicroChart and sets it in _chart aggregation.
	 * @private
	 */
	SmartMicroChart.prototype._buildSmartAreaMicroChart = function() {
		this.setAggregation("_chart", new CompLibrary.smartmicrochart.SmartAreaMicroChart({
			entitySet: this.getEntitySet(),
			chartBindingPath: this.getChartBindingPath(),
			enableAutoBinding: this.getEnableAutoBinding(),
			showLabel: this.getShowLabel(),
			initialize: [this._onChartInitialized, this],
			customData: [
				new CustomData({
					key: "chartQualifier",
					value: this.data("chartQualifier")
				})
			]
		}), true);
	};

	/**
	 * Constructs an instance of SmartBulletMicroChart and sets it in _chart aggregation.
	 * @private
	 */
	SmartMicroChart.prototype._buildSmartBulletMicroChart = function() {
		this.setAggregation("_chart", new CompLibrary.smartmicrochart.SmartBulletMicroChart({
			entitySet: this.getEntitySet(),
			chartBindingPath: this.getChartBindingPath(),
			enableAutoBinding: this.getEnableAutoBinding(),
			showLabel: this.getShowLabel(),
			initialize: [this._onChartInitialized, this],
			customData: [
				new CustomData({
					key: "chartQualifier",
					value: this.data("chartQualifier")
				})
			]
		}), true);
	};

	/**
	 * Constructs an instance of SmartRadialMicroChart and sets it in _chart aggregation.
	 * @private
	 */
	SmartMicroChart.prototype._buildSmartRadialMicroChart = function() {
		this.setAggregation("_chart", new CompLibrary.smartmicrochart.SmartRadialMicroChart({
			entitySet: this.getEntitySet(),
			chartBindingPath: this.getChartBindingPath(),
			enableAutoBinding: this.getEnableAutoBinding(),
			initialize: [this._onChartInitialized, this],
			customData: [
				new CustomData({
					key: "chartQualifier",
					value: this.data("chartQualifier")
				})
			]
		}), true);
	};

	/**
	 * Fires the initialize event once the chart has been initialized.
	 * @private
	 * @returns {void}
	 */
	SmartMicroChart.prototype._onChartInitialized = function() {
		this.fireInitialize();
	};

	/**
	 * Executes a validity check of the metadata of the chart, necessary to create the inner chart.
	 * In particular, checks if the chart type annotation is available in the proper format.
	 * @returns {boolean} True if the metadata of the chart is valid, otherwise false.
	 * @private
	 */
	SmartMicroChart.prototype._checkChartMetadata = function() {
		if (this._oChartViewMetadata.chartType && this._oChartViewMetadata.annotation &&
			this._oChartViewMetadata.annotation.ChartType &&
			this._oChartViewMetadata.annotation.ChartType.EnumMember &&
			this._oChartViewMetadata.annotation.ChartType.EnumMember.length > 0) {
			return true;
		} else {
			return false;
		}
	};

	SmartMicroChart.prototype.getAccessibilityInfo = function() {
		return SmartMicroChartCommons._getAccessibilityInfo.apply(this);
	};

	return SmartMicroChart;
});
