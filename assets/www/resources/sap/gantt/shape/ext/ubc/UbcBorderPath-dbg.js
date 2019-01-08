/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/misc/Utility", "sap/gantt/misc/Format", "sap/gantt/shape/Path"
], function(Utility, Format, Path) {
	"use strict";
	
	/**
	 * Creates and initializes a fragment of the Utilization Bar Chart.
	 * 
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings of the new control
	 * 
	 * @class 
	 * This shape is used to represent a planned capacity line.
	 * 
	 * <p>
	 * Graphic Effect is:<br/>
	 * <svg xmlns="http://www.w3.org/2000/svg" width="12cm" height="8.8cm" viewBox="0 0 300 220" version="1.1">
	 * 	<defs><marker id="arrowend" viewBox="0 0 10 10" refX="10" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 0 l 10 5 l -10 5 l 4 -5 z" fill="#6d6d6d" /></marker>
	 * 	<marker id="arrowstart" viewBox="0 0 10 10" refX="0" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 5 l 10 -5 l -4 5 l 4 5 z" fill="#6d6d6d" /></marker></defs>
	 * 	<style>.side{stroke-width:2;stroke:#1C75BC;fill:none;} .dashside{stroke-width:1;stroke:#1C75BC;fill:none; stroke-dasharray:5,1;} .dashassist{stroke-width:1;stroke:#6d6d6d;fill:none; stroke-dasharray:5,1;}
	 * 	.arrowline{stroke-width:1;stroke:#6d6d6d;fill:none;marker-end:url(#arrowend);marker-start:url(#arrowstart);} .center{r:3;fill:#6d6d6d;stroke:#9E1F63;} .texthyphon{stroke-width:1;stroke:#9E1F63;fill:none} .propertyText{stroke:#6d6d6d;} .timeText{stroke:#9E1F63;} </style>
	 * 	<rect x="1" y="1" width="298" height="218" fill="none" stroke="blue" stroke-width="0.5"/>
	 * 	<defs><pattern class="pattern" id="pUbc" patternUnits="userSpaceOnUse" x="0" y="0" width="4" height="4"><rect x="0" width="4" height="4" fill="#efefef"></rect><path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2 " stroke="#6d6d6d" stroke-width="0.5"></path></pattern>
	 * 	<pattern class="pattern" id="pEx2" patternUnits="userSpaceOnUse" x="0" y="0" width="4" height="4"><rect x="0" width="4" height="4" fill="#f2a5a5"></rect><path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2 " stroke="#9E1F63" stroke-width="0.5"></path></pattern></defs>
	 * 	<polygon points="10,65 290,65 290,155 10,155" fill="url(#pUbc)" />
	 * 	<path d="M 10 65 h 280 v 90 h -280 z" class="dashside" />
	 * 	<path d="M 10 90 h 40 v 55 h 80 v -65 h 40 v 40 h 40 v -20 h 40 v -20 h 40" class="side" />
	 * </svg>
	 * </p>
	 * 
	 * @extends sap.gantt.shape.Path
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.shape.ext.ubc.UbcBorderPath
	 */
	var UbcBorderPath = Path.extend("sap.gantt.shape.ext.ubc.UbcBorderPath", /** @lends sap.gantt.shape.ext.ubc.UbcBorderPath.prototype */ {});

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
	UbcBorderPath.prototype.getEnableSelection = function (oData, oRowInfo){
		if (this.mShapeConfig.hasShapeProperty("enableSelection")) {
			return this._configFirst("enableSelection", oData);
		}

		return false;
	};

	/**
	 * Gets the value of property <code>d</code>.
	 * 
	 * <p>
	 * d attribute of the path element.
	 * See {@link http://www.w3.org/TR/SVG/paths.html#DAttribute SVG 1.1 specification for 'd' attribute of 'path'}.
	 * 'd' attribute has powerful usages. For more information, see {@link http://www.w3.org/TR/SVG/paths.html#PathDataBNF BNF grammar} for detail.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {string} Value of property <code>d</code> or null if the generated d is invalid according to the given data.
	 * @public
	 */
	UbcBorderPath.prototype.getD = function(oData, oRowInfo) {
		var path = "";
		if (this.mShapeConfig.hasShapeProperty("d")) {
			path = this._configFirst("d", oData);
		} else {
			//oData.drawData is filtered data
			var drawData = oData.drawData ? oData.drawData : oData.period;
			if (drawData.length > 0) {
				var maxTotalRevised = this._getMaxTotalRevised(oData);
				var maxY = this._getMaxY(oData, oRowInfo);
				var drawRowHeight = oRowInfo.rowHeight - 1;
				var oAxisTime = this.getAxisTime();
				for (var i = 0; i < drawData.length; i++) {
					var x1, x2, y1, y2;
					x1 = oAxisTime.timeToView(Format.abapTimestampToDate(drawData[i].start_date)).toFixed(1);
					if (i < drawData.length - 1) {
						x2 = oAxisTime.timeToView(Format.abapTimestampToDate(drawData[i + 1].start_date)).toFixed(1);
					}else {
						x2 = oAxisTime.timeToView(Format.abapTimestampToDate(drawData[i].start_date)).toFixed(1);
					}
					
					if ( !jQuery.isNumeric(x1)) {
						x1 = oAxisTime.timeToView(0).toFixed(1);
					}
					if ( !jQuery.isNumeric(x2)) {
						x1 = oAxisTime.timeToView(0).toFixed(1);
					}
					
					y1 = maxY - drawData[i].demand / maxTotalRevised * drawRowHeight;
					y1 = y1.toFixed(1);
					
					if (y1 < oRowInfo.y) {
						y1 = oRowInfo.y;
					}
					if (i < drawData.length - 1) {
						y2 = maxY - drawData[i + 1].demand / maxTotalRevised * drawRowHeight;
					} else {
						x2 = oAxisTime.timeToView(Format.abapTimestampToDate(drawData[i].start_date)).toFixed(1);
						y2 = maxY - drawData[i].demand / maxTotalRevised * drawRowHeight;
					}
					y2 = y2.toFixed(1);
					
					if (y2 < oRowInfo.y) {
						y2 = oRowInfo.y;
					}
					
					path += " M " + x1 + " " + y1 + "L" + x2 + " " + y1;
					path += " M " + x2 + " " + y1 + "L" + x2 + " " + y2;
				}
			}
		}

		if(this.isValid(path)) {
			return path;
		} else {
			jQuery.sap.log.warning("UbcBorderPath shape generated invalid d: " + path + " from the given data: " + oData);
			return null;
		}
	};

	/**
	 * Gets the value of property <code>stroke</code>.
	 * 
	 * <p>
	 * Standard SVG 'stroke' attribute.
	 * See {@link http://www.w3.org/TR/SVG/painting.html#StrokeProperty SVG 1.1 specification for 'stroke'}.
	 * <b>Note:</b>You can provide stroke with HTML colors and the URL reference to a paint server can be provided. Paint server definitions can be retrieved from paint servers rendered by
	 * {@link sap.gantt.GanttChartContainer}, {@link sap.gantt.GanttChartWithTable}, or {@link sap.gantt.GanttChart}.
	 * </p>
	 * <p>The default value is "blue".</p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {string} Value of property <code>stroke</code>.
	 * @public
	 */
	UbcBorderPath.prototype.getStroke = function(oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("stroke")) {
			return this._configFirst("stroke", oData);
		}
		return "blue";
	};

	/**
	 * Gets the value of property <code>strokeWidth</code>.
	 * 
	 * <p>
	 * Standard SVG 'stroke-width' attribute.
	 * See {@link http://www.w3.org/TR/SVG/painting.html#StrokeWidthProperty SVG 1.1 specification for 'stroke-width'}.
	 * </p>
	 * <p>The default value is 0.3.</p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>strokeWidth</code>.
	 * @public
	 */
	UbcBorderPath.prototype.getStrokeWidth = function(oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("strokeWidth")) {
			return this._configFirst("strokeWidth", oData);
		}
		return 0.3;
	};

	UbcBorderPath.prototype._getMaxY = function(oData, oRowInfo) {
		var topCapacityY = oRowInfo.y;
		var drawRowHeight = oRowInfo.rowHeight - 1;    // 1 is the border width for polygon.
		var maxY = topCapacityY + drawRowHeight;
		return maxY;
	};

	UbcBorderPath.prototype._getMaxTotalRevised = function(oData) {
		var maxTotal = this._getMaxTotal(oData);
		var maxTotalRevised = maxTotal + this._getmaxExceedCap(oData);
		return maxTotalRevised;
	};

	UbcBorderPath.prototype._getMaxTotal = function(oData) {
		var maxTotal = Math.max.apply(Math,
				oData.period.map(function(obj){
									return obj.supply;
								}));
		if (maxTotal <= 0 ) {
			maxTotal = 1;
		}
		
		return maxTotal;
	};

	UbcBorderPath.prototype._getmaxExceedCap = function(oData) {
		var maxTotal = this._getMaxTotal(oData);
		
		var maxExceedCap = 25;
		if (this.mShapeConfig.hasShapeProperty("maxExceedCapacity")){
			maxExceedCap = this._configFirst("maxExceedCapacity", oData);
		}
		
		return maxTotal * maxExceedCap / 100;
	};
	
	return UbcBorderPath;
}, true);
