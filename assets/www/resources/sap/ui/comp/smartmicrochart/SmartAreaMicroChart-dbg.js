/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
	"jquery.sap.global",
	"sap/ui/comp/library",
	"sap/suite/ui/microchart/library",
	"sap/ui/core/Control",
	"sap/m/ValueColor",
	"sap/ui/model/odata/CountMode",
	"sap/ui/comp/smartmicrochart/SmartMicroChartCommons",
	"sap/ui/core/format/DateFormat"
], function(jQuery, CompLibrary, MicroChartLibrary, Control, ValueColor, CountMode, SmartMicroChartCommons, DateFormat) {
	"use strict";

	/**
	 * Constructor for a new sap.ui.comp.smartmicrochart.SmartAreaMicroChart.
	 *
	 * @param {string}
	 *          [sId] id for the new control, generated automatically if no id is given
	 * @param {object}
	 *          [mSettings] initial settings for the new control
	 * @class The SmartAreaMicroChart control creates a AreaMicroChart based on OData metadata and the configuration
	 *        specified. The entitySet attribute must be specified to use the control. This attribute is used to fetch
	 *        fields from OData metadata, from which Micro Area Chart UI will be generated; it can also be used to fetch
	 *        the actual chart data.<br>
	 *        <b><i>Note:</i></b><br>
	 *        Most of the attributes/properties are not dynamic and cannot be changed once the control has been
	 *        initialised.
	 * @extends sap.ui.core.Control
	 * @version 1.52.4
	 * @since 1.38
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartmicrochart.SmartAreaMicroChart
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var SmartAreaMicroChart = Control.extend("sap.ui.comp.smartmicrochart.SmartAreaMicroChart", /** @lends sap.ui.comp.smartmicrochart.SmartAreaMicroChart.prototype */ {
		metadata: {

			library: "sap.ui.comp",
			designTime: true,
			properties: {

				/**
				 * The entity set name from where the data is fetched and the internal AreaMicroChart representation is created. Note that this is not a dynamic UI5
				 * property
				 */
				entitySet: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Determines if the target value and actual value
				 * are displayed or not
				 */
				showLabel: {
					type: "boolean",
					group: "Appearance",
					defaultValue: true
				},

				/**
				 * Specifies the type of Chart. Note that this property is read-only.
				 */
				chartType: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Only <code>true</code> value is supported: the chart will be bound to the chartBindingPath or to the entitySet
				 */
				enableAutoBinding: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * This attribute can be used to specify the relative path ( without '/') to an entitySet ( not a single entity)
				 * that is used during the binding of the chart. It can be e.g. a navigation property which will be added to the context path.
				 * If not specified, the entitySet attribute is used instead.
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
				 * Defines the height.
				 */
				height: { type: "sap.ui.core.CSSSize", group: "Misc", defaultValue: "74px" },

				/**
				 * If this set to true, width and height of the control are determined by the width and height of the container in which the control is placed. Height and width properties are ignored.
				 */
				isResponsive: { type: "boolean", group: "Appearance", defaultValue: false }
			},
			defaultAggregation: "_chart",
			aggregations: {
				/**
				 * This private aggregation is used for the internal binding of the sap.suite.ui.microchart.AreaMicroChart
				 */
				_chart: {
					type: "sap.suite.ui.microchart.AreaMicroChart",
					multiple: false,
					visibility: "hidden"
				},
				/**
				 * This private aggregation is used for the internal binding of the chart text, description and unit of measure values in case the value is provided via ODataModel
				 */
				_chartTexts: {
					type: "sap.m.ListBase",
					multiple: false,
					visibility: "hidden"
				}
			},
			associations: {
				/**
				 * If the associated control is provided, its Text property is set to the Title property of the Chart annotation.
				 * Title property of the DataPoint annotation is ignored.
				 * since version 1.38
				 */
				chartTitle: {
					type: "sap.m.Label",
					group: "Misc",
					multiple: false
				},
				/**
				 * If the associated control is provided, its Text property is set to the Description property of the Chart annotation.
				 * Description property of the DataPoint annotation is ignored.
				 * since version 1.38
				 */
				chartDescription: {
					type: "sap.m.Label",
					group: "Misc",
					multiple: false
				},
				/**
				 * If the associated control is provided, its Text property is set to the Unit of Measure. The Value property of the DataPoint annotation should be annotated with this Unit of Measure. It can be either ISOCurrency or Unit from the OData Measures annotations.
				 * @since 1.38
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

	SmartAreaMicroChart._CHART_TYPE = ["Area", "Line"];

	SmartAreaMicroChart.prototype.init = function() {
		this._bIsInitialized = false;
		this._bMetaModelLoadAttached = false;
		this.setProperty("chartType", "Area", true);
		this.setAggregation("_chart", new MicroChartLibrary.AreaMicroChart(), true);
	};

	SmartAreaMicroChart.prototype.onBeforeRendering = function() {
		var oChart = this.getAggregation("_chart");
		oChart.setProperty("width", this.getWidth(), true);
		oChart.setProperty("height", this.getHeight(), true);
		oChart.setProperty("isResponsive", this.getIsResponsive(), true);
		MicroChartLibrary._passParentContextToChild(this, oChart);
	};

	SmartAreaMicroChart.prototype.destroy = function() {
		SmartMicroChartCommons._cleanup.call(this); // Clean up the instances which were created in SmartMicroChartCommons
		Control.prototype.destroy.apply(this, arguments);
	};

	SmartAreaMicroChart.prototype.setEntitySet = function(sEntitySetName) {
		if (this.getProperty("entitySet") !== sEntitySetName) {
			this.setProperty("entitySet", sEntitySetName, true);
			SmartMicroChartCommons._initializeMetadata.call(this);
		}
		return this;
	};

	SmartAreaMicroChart.prototype.setShowLabel = function(bShowLabel) {
		if (this.getShowLabel() !== bShowLabel) {
			this.setProperty("showLabel", bShowLabel, true);
			this.getAggregation("_chart").setProperty("showLabel", bShowLabel, true);
			this.invalidate();
		}
		return this;
	};

	/**
	 * @returns {sap.ui.comp.smartmicrochart.SmartAreaMicroChart} Reference to 'this' in order to allow method chaining.
	 * @private
	 */
	SmartAreaMicroChart.prototype.setEnableAutoBinding = function() {
		return this.setProperty("enableAutoBinding", true, true);
	};

	/**
	 * @returns {sap.ui.comp.smartmicrochart.SmartAreaMicroChart} Reference to 'this' in order to allow method chaining.
	 * @private
	 */
	SmartAreaMicroChart.prototype.setChartType = function() {
		return this;
	};

	/**
	 * Calls propagateProperties of Control and initializes the metadata afterwards.
	 * @private
	 */
	SmartAreaMicroChart.prototype.propagateProperties = function() {
		if (Control.prototype.propagateProperties) {
			Control.prototype.propagateProperties.apply(this, arguments);
		}
		SmartMicroChartCommons._initializeMetadata.call(this);
	};

	/**
	 * Determines the chart's binding path used directly in the bindings for data points and thresholds.
	 * @returns {string} If the chartBindingPath property is set, it is returned. If no chartBindingPath is set,
	 *                   the path is constructed absolute from the entitySet property.
	 * @private
	 */
	SmartAreaMicroChart.prototype._getBindingPath = function() {
		if (this.getChartBindingPath()) {
			return this.getChartBindingPath();
		} else if (this.getEntitySet()) {
			return "/" + this.getEntitySet();
		} else {
			return "";
		}
	};

	/**
	 * The control itself may not be bound.
	 * @returns {sap.ui.comp.smartmicrochart.SmartAreaMicroChart} Reference to 'this' in order to allow method chaining.
	 * @private
	 */
	SmartAreaMicroChart.prototype.bindElement = function() {
		return this;
	};

	/**
	 * Checks if the medatada is correct and fills the aggregations of the contained AreaMicroChart.
	 * @private
	 */
	SmartAreaMicroChart.prototype._createAndBindInnerChart = function() {
		this._createChartLabels();
		this._createChartItem("chart", this._oDataPointAnnotations.Value.Path);
		this._createChartItem("target", this._oDataPointAnnotations.TargetValue.Path);
		this._buildThreshold();
	};

	/**
	 * The method is responsible for filling all the thresholds of the contained AreaMicroChart.
	 * @private
	 */
	SmartAreaMicroChart.prototype._buildThreshold = function() {
		var oCriticality = this._oDataPointAnnotations.CriticalityCalculation;

		if (SmartMicroChartCommons._hasMember(oCriticality, "ImprovementDirection.EnumMember")) {
			switch (oCriticality.ImprovementDirection.EnumMember) {
				case SmartMicroChartCommons._MINIMIZE:
					this._createChartItem("minThreshold", oCriticality.ToleranceRangeHighValue.Path, ValueColor.Good);
					this._createChartItem("maxThreshold", oCriticality.DeviationRangeHighValue.Path, ValueColor.Error);
					break;
				case SmartMicroChartCommons._MAXIMIZE:
					this._createChartItem("minThreshold", oCriticality.DeviationRangeLowValue.Path, ValueColor.Error);
					this._createChartItem("maxThreshold", oCriticality.ToleranceRangeLowValue.Path, ValueColor.Good);
					break;
				case SmartMicroChartCommons._TARGET:
					this._createChartItem("minThreshold", oCriticality.DeviationRangeLowValue.Path, ValueColor.Error);
					this._createChartItem("maxThreshold", oCriticality.DeviationRangeHighValue.Path, ValueColor.Error);
					this._createChartItem("innerMinThreshold", oCriticality.ToleranceRangeLowValue.Path, ValueColor.Good);
					this._createChartItem("innerMaxThreshold", oCriticality.ToleranceRangeHighValue.Path, ValueColor.Good);
					break;
				default:
					break;
			}
		}
	};

	/**
	 * Creates four AreaMicroChartLabels (firstXLabel, firstYLabel, lastXLabel, lastYLabel).
	 * @private
	 */
	SmartAreaMicroChart.prototype._createChartLabels = function() {
		var oLabel, oMap = this._getLabelsMap();
		for (var k in oMap) {
			oLabel = new MicroChartLibrary.AreaMicroChartLabel();
			this.getAggregation("_chart").setAggregation(oMap[k], oLabel, true);
		}
	};

	/**
	 * Formats the given dimension value.
	 * @param {object} fValue The unformatted value for the dimension
	 * @returns {float} The time stamp value or zero
	 * @private
	 */
	SmartAreaMicroChart.prototype._formatDimension = function(fValue) {
		if (typeof fValue === "string") {
			var oAnnotation = SmartMicroChartCommons._getPropertyAnnotation.call(this, this._oChartViewMetadata.dimensionFields[0]),
				sPattern = SmartMicroChartCommons._getSemanticsPattern.call(this, oAnnotation);
			if (sPattern) {
				fValue = DateFormat.getInstance({ pattern: sPattern }).parse(fValue);
			}
		}
		if (fValue instanceof Date) {
			return parseFloat(fValue.getTime());
		} else if (!isNaN(fValue)) {
			return parseFloat(fValue);
		} else {
			this.getAggregation("_chart").enableXIndexing(true);
			return 0;
		}
	};

	/**
	 * Creates AreaMicroChartItem for the given aggregation name and based on the given path and sets its
	 * color property.
	 * Only the data binding paths are prepared. Actual data will be filled once the the binding occurs.
	 *
	 * @param {string} aggregationName The name of the aggregation to be set
	 * @param {string} path The path to the y value of the point
	 * @param {sap.m.ValueColor} color The color of the threshold
	 * @private
	 */
	SmartAreaMicroChart.prototype._createChartItem = function(aggregationName, path, color) {
		var oPointTemplate, oItem;
		oPointTemplate = new MicroChartLibrary.AreaMicroChartPoint({
			x: {
				path: this._oChartViewMetadata.dimensionFields[0],
				formatter: this._formatDimension.bind(this)
			},
			y: {
				path: path,
				type: "sap.ui.model.odata.type.Decimal"
			}
		});

		oItem = new MicroChartLibrary.AreaMicroChartItem({
			points: {
				path: this._getBindingPath(),
				template: oPointTemplate,
				parameters: {
					countMode: CountMode.None
				},
				events: {
					change: this._onBindingDataChange.bind(this)
				}
			},
			color: color
		});

		this.getAggregation("_chart").setAggregation(aggregationName, oItem, true);
	};

	/**
	 * Updates the associations and chart labels when binding data changed.
	 * @private
	 */
	SmartAreaMicroChart.prototype._onBindingDataChange = function() {
		var oPointsBinding = this.getAggregation("_chart").getAggregation("chart").getBinding("points");
		this._updateAssociations(oPointsBinding);
		this._updateChartLabels(oPointsBinding);
	};

	/**
	 * Updates all associations based on the data of the first bound entity.
	 * @param {object} pointsBinding The binding info of the points
	 * @private
	 */
	SmartAreaMicroChart.prototype._updateAssociations = function(pointsBinding) {
		var oContext = pointsBinding.getContexts(0, 1)[0],
			oData = oContext && oContext.getObject();

		SmartMicroChartCommons._updateAssociations.call(this, oData);
	};

	/**
	 * Updates all chart labels based on the data of the first and last bound points.
	 * @param {object} pointsBinding The binding info of the points
	 * @private
	 */
	SmartAreaMicroChart.prototype._updateChartLabels = function(pointsBinding) {
		var oContexts,
			iLength,
			oFirstContext,
			oLastContext,
			oFirstData,
			oLastData;

		oContexts = pointsBinding.getContexts();
		iLength = oContexts.length;

		if (iLength > 0) {
			oFirstContext = oContexts[0];
			oLastContext = oContexts[iLength - 1];

			oFirstData = oFirstContext && oFirstContext.getObject();
			oLastData = oLastContext && oLastContext.getObject();

			SmartMicroChartCommons._updateChartLabels.call(this, oFirstData, "first");
			SmartMicroChartCommons._updateChartLabels.call(this, oLastData, "last");
		}
	};

	/**
	 * Gets the supported types of ChartType in Chart annotation.
	 * @returns {array} Chart types
	 * @private
	 */
	SmartAreaMicroChart.prototype._getSupportedChartTypes = function() {
		return SmartAreaMicroChart._CHART_TYPE;
	};

	/**
	 * Gets the mapping of the chart labels.
	 * @returns {object} Mapping of the chart labels
	 * @private
	 */
	SmartAreaMicroChart.prototype._getLabelsMap = function() {
		return {
			"leftTop": "firstYLabel",
			"rightTop": "lastYLabel",
			"leftBottom": "firstXLabel",
			"rightBottom": "lastXLabel"
		};
	};

	SmartAreaMicroChart.prototype.getAccessibilityInfo = function() {
		return SmartMicroChartCommons._getAccessibilityInfo.apply(this);
	};

	return SmartAreaMicroChart;
});
