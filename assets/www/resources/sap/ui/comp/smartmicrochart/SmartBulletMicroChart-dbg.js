/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
	"jquery.sap.global",
	"sap/ui/comp/library",
	"sap/ui/core/Control",
	"sap/suite/ui/microchart/library",
	"sap/m/ValueColor",
	"sap/ui/comp/smartmicrochart/SmartMicroChartCommons"
], function(jQuery, library, Control, MicroChartLibrary, ValueColor, SmartMicroChartCommons) {
	"use strict";

	/**
	 * Constructor for a new sap.ui.comp.smartmicrochart.SmartBulletMicroChart.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The SmartBulletMicroChart control creates a <code>sap.suite.ui.microchart.BulletMicroChart</code>
	 * based on OData metadata and the configuration specified by <code>mSettings</code>.
	 * The entitySet attribute must be specified to use the control. This attribute is used to fetch metadata and
	 * annotation information from the given default OData model. Based on this, the BulletMicroChart UI
	 * is created.
	 * <br>
	 * <b><i>Note:</i></b><br>
	 * Most of the attributes/properties are not dynamic and cannot be changed once the control has been
	 * initialized.
	 * @extends sap.ui.core.Control
	 * @version 1.52.4
	 * @since 1.38
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartmicrochart.SmartBulletMicroChart
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var SmartBulletMicroChart = Control.extend("sap.ui.comp.smartmicrochart.SmartBulletMicroChart", /** @lends sap.ui.comp.smartmicrochart.SmartBulletMicroChart.prototype */ {
		metadata: {

			library: "sap.ui.comp",
			designTime: true,
			properties: {

				/**
				 * The entity set name from where the data is fetched and the internal BulletMicroChart representation is created.
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
				 * Specifies the chart type. Note that this property is read-only.
				 */
				chartType: {
					type: "string",
					group: "Misc",
					defaultValue: "Bullet"
				},

				/**
				 * If set to <code>true</code>, this enables automatic binding of the chart using the chartBindingPath (if it exists)
				 * property.
				 */
				enableAutoBinding: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * This attribute can be used to specify the relative path ( without '/') to an entity ( not an entitySet) that
				 * is used during the binding of the chart. It can be e.g. a navigation property which will be added to the context path
				 */
				chartBindingPath: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Defines the width.
				 */
				width: { type: "sap.ui.core.CSSSize", group: "Misc", defaultValue: "164px" },

				/**
				 * If this is set to true, width and height of the control are determined by the width and height of the container in which the control is placed.
				 * <code>width</code> property is ignored.
				 */
				isResponsive: { type: "boolean", group: "Appearance", defaultValue: false }

			},
			defaultAggregation: "_chart",
			aggregations: {
				/**
				 * This private aggregation is used for the internal binding of the DataPoint/CriticalityCalculation values used for calculation of the bar color
				 */
				_criticalityThresholds: {
					type: "sap.ui.core.CustomData",
					multiple: true,
					visibility: "hidden"
				},

				/**
				 * This private aggregation is used for the internal binding of the sap.suite.ui.microchart.BulletMicroChart
				 */
				_chart: {
					type: "sap.suite.ui.microchart.BulletMicroChart",
					multiple: false,
					visibility: "hidden"
				}
			},

			associations: {
				/**
				 * If the associated control is provided, its <code>text</code> property is set to the Title property of the Chart annotation.
				 * Title property of the DataPoint annotation is ignored.
				 * @since 1.38.0
				 */
				chartTitle: {
					type: "sap.m.Label",
					group: "Misc",
					multiple: false
				},
				/**
				 * If the associated control is provided, its <code>text</code> property is set to the Description property of the Chart annotation.
				 * Description property of the DataPoint annotation is ignored.
				 * @since 1.38.0
				 */
				chartDescription: {
					type: "sap.m.Label",
					group: "Misc",
					multiple: false
				},
				/**
				 * If the associated control is provided, its <code>text</code> property is set to the Unit of Measure. The Value property of the DataPoint annotation should be annotated with this Unit of Measure. It can be either ISOCurrency or Unit from the OData Measures annotations.
				 * @since 1.38.0
				 */
				unitOfMeasure: {
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

	SmartBulletMicroChart._CRITICAL_COLOR = ValueColor.Critical;
	SmartBulletMicroChart._ERROR_COLOR = ValueColor.Error;
	SmartBulletMicroChart._CHART_TYPE = ["Bullet"];

	SmartBulletMicroChart.prototype.init = function() {
		this._bIsInitialized = false;
		this._bMetaModelLoadAttached = false;
		this._bBarColorSet = false;
		this.setProperty("chartType", "Bullet", true);
		this.setAggregation("_chart", new MicroChartLibrary.BulletMicroChart({ "showValueMarker": true }), true);
	};

	/**
	 * @returns {sap.ui.comp.smartmicrochart.SmartBulletMicroChart} Reference to 'this' in order to allow method chaining.
	 * @private
	 */
	SmartBulletMicroChart.prototype.setChartType = function() {
		return this;
	};

	SmartBulletMicroChart.prototype.setEntitySet = function(entitySetName) {
		if (this.getProperty("entitySet") !== entitySetName) {
			this.setProperty("entitySet", entitySetName, true);
			SmartMicroChartCommons._initializeMetadata.call(this);
		}
		return this;
	};

	SmartBulletMicroChart.prototype.setShowLabel = function(bShowLabel) {
		if (this.getShowLabel() !== bShowLabel) {
			this.setProperty("showLabel", bShowLabel, true);
			var oChart = this.getAggregation("_chart");
			oChart.setProperty("showActualValue", bShowLabel, true);
			oChart.setProperty("showTargetValue", bShowLabel, true);
			oChart.setProperty("showDeltaValue", bShowLabel, true);
			oChart.setProperty("showValueMarker", bShowLabel, true);
			this.invalidate();
		}
		return this;
	};

	SmartBulletMicroChart.prototype.propagateProperties = function() {
		if (Control.prototype.propagateProperties) {
			Control.prototype.propagateProperties.apply(this, arguments);
		}
		SmartMicroChartCommons._initializeMetadata.call(this);
	};

	SmartBulletMicroChart.prototype.onBeforeRendering = function() {
		var oChart = this.getAggregation("_chart");
		oChart.setProperty("width", this.getWidth(), true);
		oChart.setProperty("isResponsive", this.getIsResponsive(), true);
		MicroChartLibrary._passParentContextToChild(this, oChart);
	};

	SmartBulletMicroChart.prototype.destroy = function() {
		SmartMicroChartCommons._cleanup.call(this); // Clean up the instances which were created in SmartMicroChartCommons
		Control.prototype.destroy.apply(this, arguments);
	};

	SmartBulletMicroChart.prototype._createAndBindInnerChart = function() {
		this._bindValueProperties();
		this._bindActualValue();
		this._bindChartThresholds();
		SmartMicroChartCommons._updateAssociations.call(this); //set all associations
	};

	/**
	 * Binds control properties to the entity type properties
	 * @private
	 */
	SmartBulletMicroChart.prototype._bindValueProperties = function() {
		var fMaxValue, fMinValue, oInnerChart = this.getAggregation("_chart");

		if (SmartMicroChartCommons._hasMember(this, "_oDataPointAnnotations.TargetValue.Path")) {
			oInnerChart.bindProperty("targetValue", {
				path: this._oDataPointAnnotations.TargetValue.Path,
				type: "sap.ui.model.odata.type.Decimal"
			});

			var oFormatter = SmartMicroChartCommons._getLabelNumberFormatter.call(this, this._oDataPointAnnotations.TargetValue.Path);

			oInnerChart.bindProperty("targetValueLabel", {
				path: this._oDataPointAnnotations.TargetValue.Path,
				formatter: oFormatter.format.bind(oFormatter)
			});
		}

		if (SmartMicroChartCommons._hasMember(this, "_oDataPointAnnotations.ForecastValue.Path")) {
			oInnerChart.bindProperty("forecastValue", {
				path: this._oDataPointAnnotations.ForecastValue.Path,
				type: "sap.ui.model.odata.type.Decimal"
			});
		}

		if (this._oDataPointAnnotations.MaximumValue) {
			if (this._oDataPointAnnotations.MaximumValue.hasOwnProperty("Path")) { // for compatibility reasons we have to support Path as well
				oInnerChart.bindProperty("maxValue", {
					path: this._oDataPointAnnotations.MaximumValue.Path,
					type: "sap.ui.model.odata.type.Decimal"
				});
			} else if (this._oDataPointAnnotations.MaximumValue.hasOwnProperty("Decimal")) {
				fMaxValue = parseFloat(this._oDataPointAnnotations.MaximumValue.Decimal);
				oInnerChart.setMaxValue(fMaxValue, true);
			}
		}

		if (this._oDataPointAnnotations.MinimumValue) {
			if (this._oDataPointAnnotations.MinimumValue.hasOwnProperty("Path")) { // for compatibility reasons we have to support Path as well
				oInnerChart.bindProperty("minValue", {
					path: this._oDataPointAnnotations.MinimumValue.Path,
					type: "sap.ui.model.odata.type.Decimal"
				});
			} else if (this._oDataPointAnnotations.MinimumValue.hasOwnProperty("Decimal")) {
				fMinValue = parseFloat(this._oDataPointAnnotations.MinimumValue.Decimal);
				oInnerChart.setMinValue(fMinValue, true);
			}
		}
	};

	/**
	 * Binds control aggregation 'actual' of the BulletMicroChart
	 * @private
	 */
	SmartBulletMicroChart.prototype._bindActualValue = function() {
		var oInnerChart = this.getAggregation("_chart"),
			oFormatter = SmartMicroChartCommons._getLabelNumberFormatter.call(this, this._oDataPointAnnotations.Value.Path);

		var oChartData = new MicroChartLibrary.BulletMicroChartData({
			value: {
				path: this._oDataPointAnnotations.Value.Path,
				type: "sap.ui.model.odata.type.Decimal"
			},
			color: {
				parts: [
					this._oDataPointAnnotations.Value && this._oDataPointAnnotations.Value.Path || "",
					this._oDataPointAnnotations.Criticality && this._oDataPointAnnotations.Criticality.Path || ""
				],
				formatter: SmartMicroChartCommons._getValueColor.bind(this)
			}
		});

		oInnerChart.setAggregation("actual", oChartData, true);

		oInnerChart.bindProperty("actualValueLabel", {
			path: this._oDataPointAnnotations.Value.Path,
			formatter: oFormatter.format.bind(oFormatter)
		});
	};

	/**
	 * Binds the criticality calculation properties to the thresholds of SmartBulletMicroChart according to different direction
	 * @private
	 */
	SmartBulletMicroChart.prototype._bindChartThresholds = function() {
		var sDirection, oCriticality;
		if (SmartMicroChartCommons._hasMember(this._oDataPointAnnotations, "CriticalityCalculation.ImprovementDirection.EnumMember")) {
			oCriticality = this._oDataPointAnnotations.CriticalityCalculation;
			sDirection = oCriticality.ImprovementDirection.EnumMember;
			if (sDirection !== SmartMicroChartCommons._MINIMIZE && oCriticality.DeviationRangeLowValue && oCriticality.DeviationRangeLowValue.Path) {
				this._bindThresholdAggregation(oCriticality.DeviationRangeLowValue.Path, SmartBulletMicroChart._ERROR_COLOR);
			}
			if (sDirection !== SmartMicroChartCommons._MINIMIZE && oCriticality.ToleranceRangeLowValue && oCriticality.ToleranceRangeLowValue.Path) {
				this._bindThresholdAggregation(oCriticality.ToleranceRangeLowValue.Path, SmartBulletMicroChart._CRITICAL_COLOR);
			}
			if (sDirection !== SmartMicroChartCommons._MAXIMIZE && oCriticality.ToleranceRangeHighValue && oCriticality.ToleranceRangeHighValue.Path) {
				this._bindThresholdAggregation(oCriticality.ToleranceRangeHighValue.Path, SmartBulletMicroChart._CRITICAL_COLOR);
			}
			if (sDirection !== SmartMicroChartCommons._MAXIMIZE && oCriticality.DeviationRangeHighValue && oCriticality.DeviationRangeHighValue.Path) {
				this._bindThresholdAggregation(oCriticality.DeviationRangeHighValue.Path, SmartBulletMicroChart._ERROR_COLOR);
			}
		}
	};

	/**
	 * Adds aggregation for the SmartBulletMicroChart
	 * @param {string} sPath Which is the value path from the OData metadata
	 * @param {string} sColor Which is the semantic color of the value
	 * @private
	 */
	SmartBulletMicroChart.prototype._bindThresholdAggregation = function(sPath, sColor) {
		var oThreshold = new MicroChartLibrary.BulletMicroChartData({
			value: {
				path: sPath,
				type: "sap.ui.model.odata.type.Decimal"
			},
			color: sColor
		});
		this.getAggregation("_chart").addAggregation("thresholds", oThreshold, true);
	};

	SmartBulletMicroChart.prototype.setAssociation = function(sAssociationName, sId, bSuppressInvalidate) {
		if (Control.prototype.setAssociation) {
			Control.prototype.setAssociation.apply(this, arguments);
		}
		SmartMicroChartCommons._updateAssociation.call(this, sAssociationName);
		return this;
	};

	/**
	 * Gets the supported types of ChartType in Chart annotation.
	 * @returns {array} Chart types
	 * @private
	 */
	SmartBulletMicroChart.prototype._getSupportedChartTypes = function() {
		return SmartBulletMicroChart._CHART_TYPE;
	};

	SmartBulletMicroChart.prototype.getAccessibilityInfo = function() {
		return SmartMicroChartCommons._getAccessibilityInfo.apply(this);
	};

	return SmartBulletMicroChart;
});
