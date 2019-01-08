/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/misc/Utility", "sap/gantt/shape/Polygon"
], function(Utility, Polygon){
	"use strict";

	/**
	 * Creates and initializes a fragment of the Utilization Line Chart.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings of the new control
	 * 
	 * @class 
	 * Base class for <code> sap.gantt.shape.ext.ubc.UbcOverCapacityZonePolygon</code>, <code> sap.gantt.shape.ext.ubc.UbcUnderCapacityZonePolygon</code>,
	 * <code> sap.gantt.shape.ext.ubc.UbcShortagePolygon</code>, <code> sap.gantt.shape.ext.ubc.UbcUsedPolygon</code>.
	 * 
	 * <p>This base class defines a number of shared methods. 
	 * </p>
	 * 
	 * @extends sap.gantt.shape.Polygon
	 * @abstract
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.shape.ext.ubc.UbcPolygon
	 */
	var UbcPolygon = Polygon.extend("sap.gantt.shape.ext.ubc.UbcPolygon", /** @lends sap.gantt.shape.ext.ubc.UbcPolygon.prototype */ {
		metadata: {
			"abstract": true
		}
	});

	/**
	 * Gets the value of property <code>enableSelection</code>.
	 * 
	 * <p>
	 * This property determines whether a shape is enabled for a selection behavior. The default value for a Utilization Line Chart is false.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {boolean} Value of property <code>enableSelection</code>.
	 * @public
	 */
	UbcPolygon.prototype.getEnableSelection = function (oData, oRowInfo){
		if (this.mShapeConfig.hasShapeProperty("enableSelection")) {
			return this._configFirst("enableSelection", oData);
		}
		
		return false;
	};

	UbcPolygon.prototype._getMaxY = function(oData, oRowInfo) {
		var topCapacityY = oRowInfo.y;
		var drawRowHeight = oRowInfo.rowHeight - 1;
		var maxY = topCapacityY + drawRowHeight;
		return maxY;
	};

	UbcPolygon.prototype._getMaxTotal = function(oData) {
		var maxTotal = Math.max.apply(Math,
				oData.period.map(function(obj){
					return obj.supply;
				}));
		if (maxTotal <= 0 ) {
			maxTotal = 1;
		}
		
		return maxTotal;
	};

	UbcPolygon.prototype._getmaxExceedCap = function(oData, total) {
		var maxTotal;
		if (total){
			maxTotal = total;
		}else {
			maxTotal = this._getMaxTotal(oData);
		}
		var maxExceedCap = 25;
		if (this.mShapeConfig.hasShapeProperty("maxExceedCapacity")){
			maxExceedCap = this._configFirst("maxExceedCapacity", oData);
		}
		
		return maxTotal * maxExceedCap / 100;
	};

	UbcPolygon.prototype._getMaxTotalRevised = function(oData) {
		var maxTotal = this._getMaxTotal(oData);
		var maxTotalRevised = this._getmaxExceedCap(oData, maxTotal) + maxTotal;
		return maxTotalRevised;
	};

	return UbcPolygon;
}, true);
