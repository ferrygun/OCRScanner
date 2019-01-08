/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/ui/core/Control", "./LegendBase", "sap/gantt/drawer/Legend"
], function (Control, LegendBase, LegendDrawer) {
	"use strict";

	/**
	 * Creates and initializes a new Dimension Legend class.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * Dimension Legend provides a template for two-dimension legends. This template defines the representation (shape, 
	 * pattern, and color) of individual legend items and their corresponding meanings in both dimensions.
	 * 
	 * Consider that you need to create a legend where legend items represent both the type and status of an object. 
	 * In this case, you can configure xDimention to indicate object types and yDimension to indicate object statuses. 
	 * Assume that valid object types are "Freight Order", "Freight Unit", and "Trailer Unit"; valid object statuses are
	 * "Executed", "In Execution", "Fixed", "Planned", and “Unplanned”. You will have a three by four two-dimension legend 
	 * containing twelve legend items. Each them represents an object in a specific type and a specific status. For 
	 * example, a red square stands for executed freight orders.
	 * 
	 * @extends sap.gantt.legend.LegendBase
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.legend.DimensionLegend
	 */
	var DimensionLegend = LegendBase.extend("sap.gantt.legend.DimensionLegend",/** @lends sap.gantt.legend.DimensionLegend.prototype */ {
		metadata: {
			properties: {
				/**
				 * A Shape instance that contains two sets of data, one for the 'x' dimension and the other for the 'y' dimension. 
				 * The system determines the representation of a legend element according to its 'x' dimension and 'y' dimension 
				 * values.
				 */
				shape: {type: "sap.gantt.config.Shape"},

				/**
				 * Name of xDimension. Note that the Shape instance used in DimensionLegend must have a set of data matches 
				 * this property's value. The data set contains entries specifying the representation of individual legend 
				 * items.
				 */
				xDimension: {type: "string"},

				/**
				 * Name of yDimension. Note that the Shape instance used in DimensionLegend must have a set of data matches 
				 * this property's value. The data set contains entries specifying the representation of individual legend 
				 * items.
				 */
				yDimension: {type: "string"},

				/**
				 * Valid values of xDimension. Each of these values has a corresponding entry in the data set that matches 
				 * xDimension in the Shape instance.
				 */
				xDomain: {type: "any[]", defaultValue: []},

				/**
				 * Valid values of yDimension. Each of these values has a corresponding entry in the data set that matches 
				 * yDimension in the Shape instance.
				 */
				yDomain: {type: "any[]", defaultValue: []},

				//TODO: add jsdoc here
				/**
				 * 
				 */
				exclude: {type: "any[][]", defaultValue: []},

				/**
				 * Space between two legend items.
				 */
				legendSpace: {type: "float", defaultValue: 8}
			}
		}
	});

	DimensionLegend.prototype.init = function () {
		LegendBase.prototype.init.apply(this, arguments);
		this._oDimensionLegendDrawer = new LegendDrawer();
	};
	
	DimensionLegend.prototype.applySettings = function () {
		var retVal = Control.prototype.applySettings.apply(this, arguments);
		this._modifyDimensionFunction();
		return retVal;
	};
	
	DimensionLegend.prototype._modifyDimensionFunction = function () {
		var sXDimension = this.getXDimension(),
			sYDimension = this.getYDimension();
		
		this._oShapeInstance._oLegend = this;
		this._oShapeInstance._sXDimension = sXDimension;
		this._oShapeInstance._sYDimension = sYDimension;
		
		this._oShapeInstance["get" + this._capitalFirst(sXDimension)] = function (oData) {
			if (this.mShapeConfig.hasShapeProperty(this._sXDimension)) {
				return this._configFirst(this._sXDimension, oData);
			}
			if (oData.xIndex === -1) {
				return sap.gantt.DIMENSION_LEGEND_NIL;
			}
			return this._oLegend.getXDomain()[oData.xIndex];
		};
		
		this._oShapeInstance["get" + this._capitalFirst(sYDimension)] = function (oData) {
			if (this.mShapeConfig.hasShapeProperty(this._sYDimension)) {
				return this._configFirst(this._sYDimension, oData);
			}
			if (oData.yIndex === -1) {
				return sap.gantt.DIMENSION_LEGEND_NIL;
			}
			return this._oLegend.getYDomain()[oData.yIndex];
		};
	};
	
	DimensionLegend.prototype._capitalFirst = function (sOrigin) {
		return sOrigin.charAt(0).toUpperCase() + (
				sOrigin.length > 1 ? sOrigin.slice(1) : "");
	};

	DimensionLegend.prototype.onAfterRendering = function () {
		if (this._oShapeInstance) {
			var aSvg = d3.select("#" + this.getId() + "-svg");
			var oLegendSize = this._drawDimensionLegend(aSvg, this._oShapeInstance);
			aSvg.attr("width", oLegendSize.width + "px");
			aSvg.attr("height", oLegendSize.height + "px");

			var aPath = d3.select("#" + this.getId() + "-dimension-path");
			var oPathSize = this._drawDimensionPath(aPath, this._oShapeInstance);
			aPath.attr("width", oLegendSize.width + "px");
			aPath.attr("height", oPathSize.height + "px");
			aPath.style("top", oLegendSize.height + "px");

			var aText = d3.select("#" + this.getId() + "-dimension-text");
			this._drawDimensionText(aText, this._oShapeInstance);
			aText.style(sap.ui.getCore().getConfiguration().getRTL() ? "right" : "left", oLegendSize.width + "px");
			aText.attr("height", oLegendSize.height + oPathSize.height + this.getLegendSpace() * 2 + "px");

			d3.select("#" + this.getId()).style("height", oLegendSize.height + oPathSize.height + this.getLegendSpace() * 2 + "px");
		}
	};

	DimensionLegend.prototype.setShape = function (oShape) {
		this.setProperty("shape", oShape);
		if (oShape) {
			this._oShapeInstance = this._instantShape([oShape])[0];
		}
		return this;
	};

	DimensionLegend.prototype._drawDimensionLegend = function (aShape, oShape) {
		var aXDomain = this.getXDomain();

		//create data to draw dimension legend
		var aDrawData = this._prepareData(oShape);

		// bind data to row g
		var aRowG = aShape.selectAll("." + oShape.getId() + "-row")
			.data(aDrawData);
		aRowG.enter().append("g")
			.classed(oShape.getId() + "-row", true);
		aRowG.exit().remove();
		// draw
		if (!aRowG.empty()) {
			this._oDimensionLegendDrawer._recursiveDraw(aRowG, oShape);
		}
		var oLegendSize = {};
		var iLength = aXDomain.length;
		if (iLength > 0) {
			oLegendSize.width = this.getScaledLegendWidth() * iLength + this.getLegendSpace() * (iLength + 1);
			oLegendSize.height = this.getScaledLegendHeight() * aDrawData.length + this.getLegendSpace() * 
								(aDrawData.length + 1);
		}
		return oLegendSize;
	};

	DimensionLegend.prototype._prepareData = function (oShape) {
		var aRetVal = [],
		sXDimension = this.getXDimension(),
		sYDimension = this.getYDimension(),
		aXDomain = this.getXDomain(),
		aYDomain = this.getYDomain(),
		aExcludeData = this.getExclude();
		this.aXDimension = [];
		this.aYDimension = [];
		var that = this,
			oLegendData;

		jQuery.each(aXDomain, function(iIndex, sVal) {
			oLegendData = {};
			oLegendData.xIndex = iIndex;
			oLegendData.yIndex = -1;
			that.aXDimension.push(oShape.getLegend(oLegendData));
		});
		this.aReversedXDimension = jQuery.extend(true, [], this.aXDimension);
		this.aReversedXDimension.reverse();

		jQuery.each(aYDomain, function(iIndex, sVal) {
			oLegendData = {};
			oLegendData.xIndex = -1;
			oLegendData.yIndex = iIndex;
			that.aYDimension.push(oShape.getLegend(oLegendData));
		});

		jQuery.each(aYDomain, function(iYIndex, oYValue) {
			var aRowData = [];
			jQuery.each(aXDomain, function(iXIndex, oXValue) {
				var bExclude = false;
				jQuery.each(aExcludeData, function(i, aData){
					if ((oXValue == aData[0]) && (oYValue == aData[1])) {
						bExclude = true;
						return false;
					}
				});
				if (!bExclude) {
					var oLegendData = {};
					oLegendData.xIndex = iXIndex;
					oLegendData.yIndex = iYIndex;
					oLegendData[sXDimension] = oXValue;
					oLegendData[sYDimension] = oYValue;
					oLegendData.xName = that.aXDimension[iXIndex];
					oLegendData.yName = that.aYDimension[iYIndex];
					aRowData.push(oLegendData);
				}
			});
			if (aRowData.length > 0) {
				aRetVal.push(aRowData);
			}
		});
		return aRetVal;
	};

	DimensionLegend.prototype._drawDimensionPath = function (aShape, oShape) {
		var aXDomain = this.getXDomain(),
		iXLength = aXDomain.length,
		that = this;

		var aPaths = aShape.selectAll(".dimension-path")
		.data(aXDomain);
		aPaths.enter().append("path")
		.attr("d", function(d, i){
			var iWidth = that.getScaledLegendWidth();
			var iHeight = that.getScaledLegendHeight();
			var x0 = 0,
			height = height = iHeight * (iXLength - 1 - i) + that.getLegendSpace() * (iXLength - i),
			width = iWidth * (iXLength - 1 - i) + that.getLegendSpace() * (iXLength - i);
			if (sap.ui.getCore().getConfiguration().getRTL()) {
				x0 = iWidth * (iXLength - 1 - i) + that.getLegendSpace() * (iXLength - i) + iWidth / 2;
				width = -width;
			}else {
				x0 = iWidth * i + that.getLegendSpace() * (i + 1) + iWidth / 2;
			}
			return "M" + x0 + " 0 v" + height + " h" + width;
		})
		.attr("fill", "none");
		aPaths.exit().remove();

		var oPathSize = {};
		oPathSize.height = 0;
		if (iXLength > 0) {
			oPathSize.height = this.getScaledLegendHeight() * iXLength + this.getLegendSpace() * (iXLength - 1);
		}
		return oPathSize;
	};

	DimensionLegend.prototype._drawDimensionText = function (aShape, oShape) {
		var aData = this.aYDimension.concat(this.aReversedXDimension);
		var iXDimensionStartIndex = this.aYDimension.length;
		var that = this;

		var aTexts = aShape.selectAll(".dimension-text")
		.data(aData);
		aTexts.enter().append("text")
		.attr("x",function (d) {
			if (sap.ui.getCore().getConfiguration().getRTL()) {
				return 100;
			}
			return 0;
		})
		.attr("y", function(d, i){
			return that.getScaledLegendHeight() * i + that.getLegendSpace() * (i + 1) + 
					parseInt(that.getFontSize(), 10) / 2 + that.getScaledLegendHeight() / 2 - 2;})
		.text(function(d){return d;})
		.attr("font-size", that.getFontSize() + "px")
		.attr("font-style", function(d,i){
			return i < iXDimensionStartIndex ? "normal" : "italic";
		})
		.attr("text-anchor", sap.ui.Device.browser.name === "ie" && sap.ui.getCore().getConfiguration().getRTL() ? "end" : "start");
		aTexts.select("title").remove();
		aTexts.insert("title", ":first-child")
		.text(function(d){return d;});
		aTexts.exit().remove();
	};

	return DimensionLegend;
}, true);
