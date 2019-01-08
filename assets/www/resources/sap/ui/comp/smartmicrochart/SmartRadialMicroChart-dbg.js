/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
	"jquery.sap.global",
	"sap/ui/comp/library",
	"sap/ui/core/Control",
	"sap/suite/ui/microchart/library",
	"sap/ui/comp/smartmicrochart/SmartMicroChartCommons",
	"sap/m/library"
], function(jQuery, library, Control, MicroChartLibrary, SmartMicroChartCommons, MobileLibrary) {
	"use strict";

	/**
	 * Constructor for a new sap.ui.comp.smartmicrochart.SmartRadialMicroChart.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The SmartRadialMicroChart control creates a <code>sap.suite.ui.microchart.RadialMicroChart</code>
	 * based on OData metadata and the configuration specified by <code>mSettings</code>.
	 * The entitySet attribute must be specified to use the control. This attribute is used to fetch metadata and
	 * annotation information from the given default OData model. Based on this, the RadialMicroChart UI
	 * is created.
	 * <br>
	 * <b><i>Note:</i></b><br>
	 * Most of the attributes/properties are not dynamic and cannot be changed once the control has been
	 * initialized.
	 * @extends sap.ui.core.Control
	 * @version 1.52.4
	 * @constructor
	 * @public
	 * @since 1.42.0
	 * @alias sap.ui.comp.smartmicrochart.SmartRadialMicroChart
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var SmartRadialMicroChart = Control.extend("sap.ui.comp.smartmicrochart.SmartRadialMicroChart", /** @lends sap.ui.comp.smartmicrochart.SmartRadialMicroChart.prototype */ {
		metadata: {

			library: "sap.ui.comp",
			designTime: true,
			properties: {

				/**
				 * The entity set name from where the data is fetched and the internal RadialMicroChart representation is created.
				 * Note that this is not a dynamic UI5 property.
				 */
				entitySet: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Specifies the chart type. Note that this property is read-only.
				 */
				chartType: {
					type: "string",
					group: "Misc",
					defaultValue: "Donut"
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
				 * If this property set to true, width and height of the control are determined by the width and height of the container in which the control is placed. The size is no longer determined based on the device.
				 * @since 1.44.4
				 */
				isResponsive: { type: "boolean", group: "Appearance", defaultValue: false }
			},
			defaultAggregation: "_chart",
			aggregations: {

				/**
				 * This private aggregation is used for the internal binding of the sap.suite.ui.microchart.RadialMicroChart
				 */
				_chart: {
					type: "sap.suite.ui.microchart.RadialMicroChart",
					multiple: false,
					visibility: "hidden"
				}
			},

			associations: {

				/**
				 * If the associated control is provided, its <code>text</code> property is set to
				 * the Title property of the Chart annotation. Title property of the DataPoint
				 * annotation is ignored.
				 */
				chartTitle: {
					type: "sap.m.Label",
					group: "Misc",
					multiple: false
				},

				/**
				 * If the associated control is provided, its <code>text</code> property is set to
				 * the Description property of the Chart annotation. Description property of the
				 * DataPoint annotation is ignored.
				 */
				chartDescription: {
					type: "sap.m.Label",
					group: "Misc",
					multiple: false
				},

				/**
				 * If the associated control is provided, its <code>text</code> property is set to
				 * the Unit of Measure. The Value property of the DataPoint annotation should be
				 * annotated with this Unit of Measure. It can be either ISOCurrency or Unit from the
				 * OData Measures annotations.
				 */
				unitOfMeasure: {
					type: "sap.m.Label",
					group: "Misc",
					multiple: false
				},

				/**
				 * If the associated control is provided, its <code>text</code> property is set to
				 * the free text provided by annotations. The Value property of the DataPoint
				 * annotation should be annotated with this free text. The Label annotation from the
				 * OData Common vocabulary can be used.
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

	SmartRadialMicroChart._CHART_TYPE = ["Donut"];

	SmartRadialMicroChart.prototype.init = function() {
		this._bIsInitialized = false;
		this._bMetaModelLoadAttached = false;
		this.setAggregation("_chart", new MicroChartLibrary.RadialMicroChart(), true);
	};

	SmartRadialMicroChart.prototype.onBeforeRendering = function() {
		var oChart = this.getAggregation("_chart");
		if (this.getIsResponsive()) {
			oChart.setProperty("size", MobileLibrary.Size.Responsive, true);
		} else {
			oChart.setProperty("size", MobileLibrary.Size.Auto, true);
		}
		MicroChartLibrary._passParentContextToChild(this, oChart);
	};

	SmartRadialMicroChart.prototype.destroy = function() {
		SmartMicroChartCommons._cleanup.call(this); // Clean up the instances which were created in SmartMicroChartCommons
		Control.prototype.destroy.apply(this, arguments);
	};

	/**
	 * @returns {sap.ui.comp.smartmicrochart.SmartRadialMicroChart} Reference to 'this' in order to allow method chaining.
	 * @private
	 */
	SmartRadialMicroChart.prototype.setChartType = function() {
		return this;
	};

	SmartRadialMicroChart.prototype.setEntitySet = function(entitySetName) {
		if (this.getProperty("entitySet") !== entitySetName) {
			this.setProperty("entitySet", entitySetName, true);
			SmartMicroChartCommons._initializeMetadata.call(this);
		}
		return this;
	};

	SmartRadialMicroChart.prototype.propagateProperties = function() {
		if (Control.prototype.propagateProperties) {
			Control.prototype.propagateProperties.apply(this, arguments);
		}
		SmartMicroChartCommons._initializeMetadata.call(this);
	};

	/**
	 * Creates and binds the inner chart once the metadata is loaded.
	 * @private
	 */
	SmartRadialMicroChart.prototype._createAndBindInnerChart = function() {
		this._bindProperties();
		SmartMicroChartCommons._updateAssociations.call(this); //set all associations
	};

	/**
	 * Binds control properties to the entity type properties
	 * @private
	 */
	SmartRadialMicroChart.prototype._bindProperties = function() {
		var oInnerChart = this.getAggregation("_chart");
		if (this._oDataPointAnnotations.Value && !this._oDataPointAnnotations.TargetValue) {
			if (SmartMicroChartCommons._hasMember(this._oDataPointAnnotations.Value, "Path")) {
				oInnerChart.bindProperty("percentage", {
					path: this._oDataPointAnnotations.Value.Path,
					type: "sap.ui.model.odata.type.Decimal"
				});
			}
		} else if (SmartMicroChartCommons._hasMember(this, "_oDataPointAnnotations.TargetValue.Path") &&
			SmartMicroChartCommons._hasMember(this, "_oDataPointAnnotations.Value.Path")) {
			oInnerChart.bindProperty("total", {
				path: this._oDataPointAnnotations.TargetValue.Path,
				type: "sap.ui.model.odata.type.Decimal"
			});
			oInnerChart.bindProperty("fraction", {
				path: this._oDataPointAnnotations.Value.Path,
				type: "sap.ui.model.odata.type.Decimal"
			});
		}

		oInnerChart.bindProperty("valueColor", {
			parts: [
				this._oDataPointAnnotations.Value && this._oDataPointAnnotations.Value.Path || "",
				this._oDataPointAnnotations.Criticality && this._oDataPointAnnotations.Criticality.Path || ""
			],
			formatter: SmartMicroChartCommons._getValueColor.bind(this)
		});
	};

	SmartRadialMicroChart.prototype.setAssociation = function(sAssociationName, sId, bSuppressInvalidate) {
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
	SmartRadialMicroChart.prototype._getSupportedChartTypes = function() {
		return SmartRadialMicroChart._CHART_TYPE;
	};

	SmartRadialMicroChart.prototype.getAccessibilityInfo = function() {
		return SmartMicroChartCommons._getAccessibilityInfo.apply(this);
	};

	return SmartRadialMicroChart;
});
