/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/misc/Utility", "sap/gantt/misc/Format", "sap/gantt/shape/Rectangle"
], function(Utility, Format, Rectangle){
	"use strict";
	
	/**
	 * Creates and initializes a fragment of the Utilization Line Chart.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings of the new control
	 * 
	 * @class 
	 * This shape is used to represent an invisible rectangle with tooltips. Note that a tooltip appears 
	 * only when the title tag is specified on the rectangle.
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
	 * 	<path d="M 10 65 h 280 v 90 h -280 z" class="dashside" />
	 * 	<polygon points="10,65 290,65 290,155 10,155" fill="url(#pUbc)" />
	 * 	<path d="M 10 105 h 40 v 5 h 80 v -20 h 40 v -10 h 40 v 20 h 80" class="dashassist" />
	 * 	<path d="M 10 90 h 40 v 55 h 80 v -65 h 40 v 40 h 40 v -20 h 40 v -20 h 40" class="side" />
	 * 	<rect x="10" y="65" width="40" height="90" fill="#cdcdcd" fill-opacity="0.5" stroke="#cdcdcd" stroke-width="0.5"><title>Capacity: 50&#10;Required Capacity: 65</title></rect>
	 * 	<rect x="50" y="65" width="80" height="90" fill="#cdcdcd" fill-opacity="0.5" stroke="#cdcdcd" stroke-width="0.5"><title>Capacity: 45&#10;Required Capacity: 10</title></rect>
	 * 	<rect x="130" y="65" width="40" height="90" fill="#cdcdcd" fill-opacity="0.5" stroke="#cdcdcd" stroke-width="0.5"><title>Capacity: 65&#10;Required Capacity: 75</title></rect>
	 * 	<rect x="170" y="65" width="40" height="90" fill="#cdcdcd" fill-opacity="0.5" stroke="#cdcdcd" stroke-width="0.5"><title>Capacity: 75&#10;Required Capacity: 35</title></rect>
	 * 	<rect x="210" y="65" width="40" height="90" fill="#cdcdcd" fill-opacity="0.5" stroke="#cdcdcd" stroke-width="0.5"><title>Capacity: 55&#10;Required Capacity: 55</title></rect>
	 * 	<rect x="250" y="65" width="40" height="90" fill="#cdcdcd" fill-opacity="0.5" stroke="#cdcdcd" stroke-width="0.5"><title>Capacity: 55&#10;Required Capacity: 75</title></rect>
	</svg>
	 * </p>
	 * 
	 * @extends sap.gantt.shape.Rectangle
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.shape.ext.ubc.UbcTooltipRectangle
	 */
	var UbcTooltipRectangle = Rectangle.extend("sap.gantt.shape.ext.ubc.UbcTooltipRectangle", /** @lends sap.gantt.shape.ext.ubc.UbcTooltipRectangle.prototype */ {});

	UbcTooltipRectangle.prototype.init = function(){
		this._oRb = sap.ui.getCore().getLibraryResourceBundle("sap.gantt");
	};	

	/**
	 * Gets the value of property <code>enableSelection</code>.
	 * 
	 * <p>
	 * This property determines whether a shape is enabled for a selection behavior. The default value for the Utilization Line Chart is false.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {boolean} Value of property <code>enableSelection</code>.
	 * @public
	 */
	UbcTooltipRectangle.prototype.getEnableSelection = function (oData, oRowInfo){
		if (this.mShapeConfig.hasShapeProperty("enableSelection")) {
			return this._configFirst("enableSelection", oData);
		}
		
		return false;
	};

	/**
	 * Gets the value of property <code>x</code>.
	 * 
	 * <p>
	 * x coordinate of the top-left point of a rectangle.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#RectElementXAttribute SVG 1.1 specification for the 'x' attribute of 'rect'}.
	 * 
	 * Your application should not configure this value. Instead, the getter calculates the value of x by using property <code>start_date</code>.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {number} Value of property <code>x</code>.
	 * @public
	 */
	UbcTooltipRectangle.prototype.getX = function(oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("x")) {
			return this._configFirst("x", oData);
		}
		
		var oAxisTime = this.getAxisTime();
		var x = oAxisTime.timeToView(Format.abapTimestampToDate(oData.start_date)).toFixed(1);
		if (!jQuery.isNumeric(x)) {
			x = this.axisTime.timeToView(0).toFixed(1);
		}
		return x;
	};

	/**
	 * Gets the value of property <code>y</code>.
	 * 
	 * <p>
	 * y coordinate of the top-left point of a rectangle.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#RectElementYAttribute SVG 1.1 specification for the 'y' attribute of 'rect'}.
	 * 
	 * Your application should not configure this value. Instead, the getter calculates the value of y by using parameter <code>oRowInfo</code>.
	 * </p>
	 * <p>The default value is the y coordinate of the top-left point of the row.</p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>y</code>.
	 * @public
	 */
	UbcTooltipRectangle.prototype.getY = function(oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("y")) {
			return this._configFirst("y", oData);
		}
		
		return oRowInfo.y;
	};

	/**
	 * Gets the value of property <code>width</code>.
	 * 
	 * <p>
	 * Width of a rectangle.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#RectElementWidthAttribute SVG 1.1 specification for the 'width' attribute of 'rect'}.
	 * 
	 * Your application should not configure this value. Instead, the getter calculates the width by using property <code>start_date</code> and
	 * property <code>end_date</code>. If your application overwrites the getter by configuration or code, accurate results cannot be guaranteed.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>width</code>.
	 * @public
	 */
	UbcTooltipRectangle.prototype.getWidth = function(oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("width")) {
			return this._configFirst("width", oData);
		}
		
		var width, startX, endX;
		var oAxisTime = this.getAxisTime();
		startX = oAxisTime.timeToView(Format.abapTimestampToDate(oData.start_date)).toFixed(1);
		endX = oAxisTime.timeToView(Format.abapTimestampToDate(oData.end_date)).toFixed(1);
		if (!jQuery.isNumeric(startX)) {
			startX = this.axisTime.timeToView(0).toFixed(1);
		}
		if (!jQuery.isNumeric(endX)) {
			endX = this.axisTime.timeToView(0).toFixed(1);
		}
		
		width = (endX - startX > 0) ? (endX - startX) : (startX - endX);
		
		if ((width === 0) || !jQuery.isNumeric(width)) {
			width = 1;
		}
		return width;
	};

	/**
	 * Gets the value of property <code>height</code>.
	 * 
	 * <p>
	 * Height of a rectangle.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#RectElementHeightAttribute SVG 1.1 specification for the 'height' attribute of 'rect'}.
	 * </p>
	 * <p>The default value is the height of the row minus 1px, which is the width of stroke.</p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>height</code>.
	 * @public
	 */
	UbcTooltipRectangle.prototype.getHeight = function(oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("height")) {
			return this._configFirst("height", oData);
		}
		return oRowInfo.rowHeight - 1;
	};

	/**
	 * Gets the value of property <code>strokeOpacity</code>.
	 * 
	 * <p>
	 * Standard SVG 'stroke-Opacity' attribute.
	 * See {@link http://www.w3.org/TR/SVG/painting.html#StrokeOpacityProperty SVG 1.1 specification for 'stroke-opacity'}.
	 * The value of strokeOpacity for a rectangle with tooltips must be 0.
	 * </p>
	 * <p>The default value is 0.</p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>strokeOpacity</code>.
	 * @public
	 */
	UbcTooltipRectangle.prototype.getStrokeOpacity = function(oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("strokeOpacity")) {
			return this._configFirst("strokeOpacity", oData);
		}
		return 0;
	};
	
	/**
	 * Gets the value of property <code>fillOpacity</code>.
	 * 
	 * <p>
	 * Standard SVG 'fill-Opacity' attribute.
	 * See {@link http://www.w3.org/TR/SVG/painting.html#FillOpacityProperty SVG 1.1 specification for 'fill-opacity'}.
	 * The value of fillOpacity for a rectangle with tooltips must be 0.
	 * </p>
	 * <p>The default value is 0.</p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>fillOpacity</code>.
	 * @public
	 */
	UbcTooltipRectangle.prototype.getFillOpacity = function(oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("fillOpacity")) {
			return this._configFirst("fillOpacity", oData);
		}
		return 0;
	};

	/**
	 * Gets the value of property <code>title</code>.
	 * 
	 * A title is visualized as a tooltip in web browsers.
	 * <b>Notes:</b> Use character entities to perform simple text tabbing and breaking. (Use "&#09;" for tab and "&#10;" for break.)
	 * See {@link http://www.w3.org/TR/SVG/struct.html#TitleElement SVG 1.1 specification for 'title'}.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {string} Value of property <code>title</code>.
	 * @public
	 */
	UbcTooltipRectangle.prototype.getTitle = function(oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("title")) {
			return this._configFirst("title", oData);
		}
		var retVal = this._oRb.getText("TLTP_CAPACITY", [oData.supply, oData.demand]);
		if (oData.demand > oData.supply) {
			retVal += this._oRb.getText("TLTP_OVER_CAPACITY", [oData.demand - oData.supply]);
		}
		return retVal;
	}; 
	
	return UbcTooltipRectangle;
}, true);
