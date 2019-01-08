/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Line"
], function(Line){
	"use strict";
	
	/**
	 * Creates and initializes a fragment of the Utilization Line Chart.
	 * 
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings of the new control
	 * 
	 * @class 
	 * This shape is used to draw a middle line, which indicates the position of 50%.
	 * 
	 * <p>
	 * Graphic Effect is:<br/>
	 * <svg xmlns="http://www.w3.org/2000/svg" width="12cm" height="8.8cm" viewBox="0 0 300 220" version="1.1">
	 * <defs><marker id="arrowend" viewBox="0 0 10 10" refX="10" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 0 l 10 5 l -10 5 l 4 -5 z" fill="#6d6d6d" /></marker>
	 * 	<marker id="arrowstart" viewBox="0 0 10 10" refX="0" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 5 l 10 -5 l -4 5 l 4 5 z" fill="#6d6d6d" /></marker></defs>
	 * 	<style>.side{stroke-width:2;stroke:#1C75BC;fill:none;} .dashside{stroke-width:1;stroke:#1C75BC;fill:none; stroke-dasharray:5,1;} .dashassist{stroke-width:1;stroke:#6d6d6d;fill:none; stroke-dasharray:5,1;}
	 * 	.arrowline{stroke-width:1;stroke:#6d6d6d;fill:none;marker-end:url(#arrowend);marker-start:url(#arrowstart);} .center{r:3;fill:#6d6d6d;stroke:#9E1F63;} .texthyphon{stroke-width:1;stroke:#9E1F63;fill:none} .propertyText{stroke:#6d6d6d;} .timeText{stroke:#9E1F63;} </style>
	 * 	<rect x="1" y="1" width="298" height="218" fill="none" stroke="blue" stroke-width="0.5"/>
	 * 	<path d="M 10 85 h 280 v -20 h -280 v 90 h 280 v -70" class="dashside" />
	 * 	<path id="middleLine" d="M 10 120 h 280" class="dashassist" />
	 * </svg>
	 * </p>
	 * 
	 * @extends sap.gantt.shape.Line
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.shape.ext.ulc.UlcMiddleLine
	 */
	var UlcMiddleLine = Line.extend("sap.gantt.shape.ext.ulc.UlcMiddleLine", /** @lends sap.gantt.shape.ext.ulc.UlcMiddleLine.prototype */ {});

	/**
	 * Gets the value of property <code>x1</code>.
	 * 
	 * <p>
	 * x coordinate of the start of the line.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#LineElementX1Attribute SVG 1.1 specification for 'x1' attribute of 'line'}.
	 * 
	 * Usually an application does not configure this value. Instead, the getter calculates the value of x1 by using 
	 * the view boundary for the visible area in the Gantt Chart.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>x1</code>.
	 * @public
	 */
	UlcMiddleLine.prototype.getX1 = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("x1")){
			return this._configFirst("x1", oData);
		}
		
		var aViewRange = this.mChartInstance._oStatusSet ? this.mChartInstance._oStatusSet.aViewBoundary : [];
		if (aViewRange.length > 0){
			return aViewRange[0];
		}
		return 0;
	};

	/**
	 * Gets the value of property <code>y1</code>.
	 * 
	 * <p>
	 * y coordinate of the start of the line.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#LineElementY1Attribute SVG 1.1 specification for 'y1' attribute of 'line'}.
	 * 
	 * At the top of each row, a certain amount of space (in the shape of a rectangular frame) is reserved for over capacity area. 
	 * You can use 'maxVisibleRatio' in 'shapeConfig' to specify the amount of area to reserve. With the reserved area deducted 
	 * from a row, the height of the middle line is set to 50% of the row height.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>y1</code>.
	 * @public
	 */
	UlcMiddleLine.prototype.getY1 = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("y1")){
			return this._configFirst("y1", oData);
		}
		
		var maxVisibleRatio = 25;
		if (this.mShapeConfig.hasShapeProperty("maxVisibleRatio")){
			maxVisibleRatio = this._configFirst("maxVisibleRatio", oData);
		}
		return oRowInfo.y + oRowInfo.rowHeight  * (50 + maxVisibleRatio) / (100 + maxVisibleRatio);
	};

	/**
	 * Gets the value of property <code>x2</code>.
	 * 
	 * <p>
	 * x coordinate of the end of the line.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#LineElementX2Attribute SVG 1.1 specification for 'x2' attribute of 'line'}.
	 * 
	 * Usually an application does not configure this value. Instead, the getter calculates the value of 'x2' by using the 
	 * view boundary's terminal point, which is filtered by the visible area in a Gantt Chart.
	 * 
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>x2</code>.
	 * @public
	 */
	UlcMiddleLine.prototype.getX2 = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("x2")){
			return this._configFirst("x2", oData);
		}
		
		var aViewRange = this.mChartInstance._oStatusSet ? this.mChartInstance._oStatusSet.aViewBoundary : [];
		if (aViewRange.length > 0){
			return aViewRange[1];
		}
		return 0;
	};

	/**
	 * Gets the value of property <code>y2</code>.
	 * 
	 * <p>
	 * y coordinate of the end of the line.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#LineElementY2Attribute SVG 1.1 specification for 'y2' attribute of 'line'}.
	 * 
	 * y2 shares the same value with y1.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>y2</code>.
	 * @public
	 */
	UlcMiddleLine.prototype.getY2 = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("y2")){
			return this._configFirst("y2", oData);
		}
		
		return this.getY1(oData, oRowInfo);
	};

	/**
	 * Gets the value of property <code>strokeDasharray</code>.
	 * 
	 * <p>
	 * Standard SVG 'stroke-dasharray' attribute.
	 * See {@link http://www.w3.org/TR/SVG/painting.html#StrokeWidthProperty SVG 1.1 specification for 'stroke-dasharray'}.
	 * </p>
	 * <p>The default value is "5,5".</p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {string} Value of property <code>strokeDasharray</code>.
	 * @public
	 */
	UlcMiddleLine.prototype.getStrokeDasharray = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("strokeDasharray")){
			return this._configFirst("strokeDasharray", oData);
		}
		
		return "5,5";
	};

	/**
	 * Gets the value of property <code>stroke</code>.
	 * 
	 * <p>
	 * Standard SVG 'stroke' attribute.
	 * See {@link http://www.w3.org/TR/SVG/painting.html#StrokeProperty SVG 1.1 specification for 'stroke'}.
	 * <b>Note:</b> You can provide the stroke with HTML colors and the URL reference to a paint server. Paint server definitions can be 
	 * retrieved from paint servers rendered by {@link sap.gantt.GanttChartContainer}, {@link sap.gantt.GanttChartWithTable}, 
	 * or {@link sap.gantt.GanttChart}.
	 * </p>
	 * <p>The default value is "#CAC7BA".</p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {string} Value of property <code>stroke</code>.
	 * @public
	 */
	UlcMiddleLine.prototype.getStroke = function (oData) {
		if (this.mShapeConfig.hasShapeProperty("stroke")){
			return this._configFirst("stroke", oData);
		}
		
		return "#CAC7BA";
	};

	/**
	 * Gets the value of property <code>strokeWidth</code>.
	 * 
	 * <p>
	 * Standard SVG 'stroke-width' attribute.
	 * See {@link http://www.w3.org/TR/SVG/painting.html#StrokeWidthProperty SVG 1.1 specification for 'stroke-width'}.
	 * </p>
	 * <p>The default value is 1.</p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>strokeWidth</code>.
	 * @public
	 */
	UlcMiddleLine.prototype.getStrokeWidth = function (oData) {
		if (this.mShapeConfig.hasShapeProperty("strokeWidth")){
			return this._configFirst("strokeWidth", oData);
		}
		
		return 1;
	};

	return UlcMiddleLine;
}, true);
