/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/ui/core/Control", "sap/gantt/shape/cal/Calendar", "sap/gantt/misc/Utility", "sap/gantt/misc/Format", "../misc/AxisTime"
], function (Control, Calendar, Utility, Format, AxisTime) {
	"use strict";

	/**
	 * Creates and initializes a new Legend class.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * Base class for all legend template.
	 * 
	 * <p>This base class defines basic properties for legend templates.
	 * sap.gantt provides two basic implementations of <code>LegendBase</code>:
	 * <ul>
	 * 		<li><code>sap.gantt.legend.ListLegend</code> - A list legend template defines the representation of a list of legend 
	 * items and their corresponding meanings</li>
	 * 		<li><code>sap.gantt.legend.DimensionLegend</code> - A dimension legend template defines the representation (shape, 
	 * pattern, and color) of individual legend items and their corresponding meanings in both dimensions</li>
	 * </ul>
	 * </p>
	 * 
	 * @extends sap.ui.core.Control
	 * @abstract
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.legend.LegendBase
	 */
	var LegendBase = Control.extend("sap.gantt.legend.LegendBase",/** @lends sap.gantt.legend.LegendBase.prototype */ {
		metadata: {
			abstract: true,
			properties: {
				/**
				 * SVG reusable element definitions.
				 * 
				 * If this property is provided, the paint server definition of SVG is rendered. Method <code>getDefString()</code> should be
				 * implemented by all paint server classes that are passed to this property.
				 */
				svgDefs: {type: "sap.gantt.def.SvgDefs", defaultValue: null},

				/**
				 * Width of a legend item.
				 */
				legendWidth: {type: "float", defaultValue: 32}, // width in pixels in compact mode

				/**
				 * Height of a legend item.
				 */
				legendHeight: {type: "float", defaultValue: 32}, // height in pixels in compact mode

				/**
				 * Font size of legend item texts.
				 */
				fontSize: {type: "int", defaultValue: 16} // font size for legend text
			}
		}
	});

	// timestamp to create a fake axistime.
	LegendBase.prototype.TIME_RANGE = ["20160101000000", "20160103000000"];
	// middle timestamp of the time axis.
	LegendBase.prototype.TIME = "20160102000000";

	LegendBase.prototype.init = function () {
		this._aTimeRange = [Format.getTimeStampFormatter().parse(this.TIME_RANGE[0]),
			Format.getTimeStampFormatter().parse(this.TIME_RANGE[1])];
	};


	LegendBase.prototype.getAxisTime = function () {
		return this._oAxisTime;
	};

	LegendBase.prototype.onBeforeRendering = function () {
		this._sUiSizeMode = Utility.findSapUiSizeClass();
		this._aViewRange = [0, this.getScaledLegendWidth()];
		this._oAxisTime = new AxisTime(this._aTimeRange, this._aViewRange);
	};

	/**
	 * Gets the legend item width according to the SAP UI size class.
	 * 
	 * @return {string} Value of the legend item width.
	 * @public
	 */
	LegendBase.prototype.getScaledLegendWidth = function () {
		var sMode = this.getSapUiSizeClass();
		return Utility.scaleBySapUiSize(sMode, this.getLegendWidth());
	};

	/**
	 * Gets the legend item height according to the SAP UI size class.
	 * 
	 * @return {string} Value of the legend item height.
	 * @public
	 */
	LegendBase.prototype.getScaledLegendHeight = function () {
		var sMode = this.getSapUiSizeClass();
		return Utility.scaleBySapUiSize(sMode, this.getLegendHeight());
	};

	LegendBase.prototype._instantShape = function (aShapes) {
		var aRetVal = [];
		// parse shape instances
		for (var i = 0; i < aShapes.length; i++) {
			if (aShapes[i].getShapeClassName()) {
				// create shape instance
				var oShapeInst = this._instantiateCustomerClass(aShapes[i].getShapeClassName(), i, aShapes[i]);

				if (aShapes[i].getClippathAggregation() && aShapes[i].getClippathAggregation() instanceof Array) {
					// create aggregation classes for clip-path
					var aPath = this._instantShape(aShapes[i].getClippathAggregation());
					for (var j = 0; j < aPath.length; j++) {
						oShapeInst.addPath(aPath[j]);
					}
				} else if (aShapes[i].getGroupAggregation() && aShapes[i].getGroupAggregation() instanceof Array) {
					// create aggregation classes for group
					var aAggregation = this._instantShape(aShapes[i].getGroupAggregation());
					for (var k = 0; k < aAggregation.length; k++) {
						oShapeInst.addShape(aAggregation[k]);
					}
				}

				if (this._isProperShape(oShapeInst)) {
					aRetVal.push(oShapeInst);
				}
			}
		}

		return aRetVal;
	};

	LegendBase.prototype._isProperShape = function (oShapeInst) {
		if (oShapeInst instanceof sap.gantt.shape.cal.Calendar) {
			jQuery.sap.log.warning("Calendar is not proper shape", "key '" + oShapeInst.mShapeConfig.getKey() + "'", "ListLegend");
			return false;
		} else if (oShapeInst.getTag() == "clippath") {
			return false;
		} else {
			return true;
		}
	};

	LegendBase.prototype._instantiateCustomerClass = function (sCustomerClassName, sShapeId, oShapeConfig) {
		var CustomerClass = jQuery.sap.getObject(sCustomerClassName);
		if (!CustomerClass) {
			jQuery.sap.require(sCustomerClassName);
			CustomerClass = jQuery.sap.getObject(sCustomerClassName);
		}
		
		var oCustomerClassInstance = new CustomerClass();

		oCustomerClassInstance.mShapeConfig = oShapeConfig;
		oCustomerClassInstance.mChartInstance = this;

		return oCustomerClassInstance;
	};

	/**
	 * Gets the value of the SAP UI size class.
	 * 
	 * @return {string} Value of the SAP UI size class.
	 * @public
	 */
	LegendBase.prototype.getSapUiSizeClass = function () {
		return this._sUiSizeMode;
	};
	return LegendBase;
}, true);
