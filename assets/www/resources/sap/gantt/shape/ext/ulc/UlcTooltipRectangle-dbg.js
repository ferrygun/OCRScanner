/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/ext/ulc/UlcRectangle", "sap/gantt/misc/Utility", "sap/gantt/misc/Format", "sap/ui/core/Core"
], function(UlcRectangle, Utility, Format, Core){
	"use strict";
	
	/**
	 * Creates and initializes a fragment of the Utilization Line Chart.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings of the new control
	 * 
	 * @class 
	 * This shape is used to create invisible rectangles with tooltips enabled by tag 'title'.
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
	 * 	<path d="M 40 155 l 25 -90 h 50 l 20 30 h 100 l 40 60" class="dashassist" />
	 * 	<path d="M 40 155 l 25 -85 h 50 l 20 10 h 100 l 40 75" class="dashassist" />
	 * 	<rect x="40" y="65" width="25" height="90" fill="#cdcdcd" fill-opacity="0.5" stroke="#cdcdcd" stroke-width="0.5"><title>dimention1: 0-150%&#10;dimention2: 0-110%</title></rect>
	 * 	<rect x="65" y="65" width="50" height="90" fill="#cdcdcd" fill-opacity="0.5" stroke="#cdcdcd" stroke-width="0.5"><title>dimention1: 150%&#10;dimention2: 110%</title></rect>
	 * 	<rect x="115" y="65" width="20" height="90" fill="#cdcdcd" fill-opacity="0.5" stroke="#cdcdcd" stroke-width="0.5"><title>dimention1: 150%-70%&#10;dimention2: 110%-105%</title></rect>
	 * 	<rect x="135" y="65" width="100" height="90" fill="#cdcdcd" fill-opacity="0.5" stroke="#cdcdcd" stroke-width="0.5"><title>dimention1: 70%&#10;dimention2: 105%</title></rect>
	 * 	<rect x="235" y="65" width="40" height="90" fill="#cdcdcd" fill-opacity="0.5" stroke="#cdcdcd" stroke-width="0.5"><title>dimention1: 70%-0&#10;dimention2: 105%-0</title></rect>
	 * </svg>
	 * </p>
	 * 
	 * @extends sap.gantt.shape.ext.ulc.UlcRectangle
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.shape.ext.ulc.UlcTooltipRectangle
	 */
	var UlcTooltipRectangle = UlcRectangle.extend("sap.gantt.shape.ext.ulc.UlcTooltipRectangle", /** @lends sap.gantt.shape.ext.ulc.UlcTooltipRectangle.prototype */ {});

	/**
	 * Gets the value of property <code>title</code>.
	 * 
	 * Title is visualized as a tooltip by browsers.
	 * <b>Notes:</b> Use character entities to perform simple text tabbing and breaking. (Use "&#09;" for tab and "&#10;" for break.)
	 * See {@link http://www.w3.org/TR/SVG/struct.html#TitleElement SVG 1.1 specification for 'title'}.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {string} Value of property <code>title</code>.
	 * @public
	 */
	UlcTooltipRectangle.prototype.getTitle = function(oData, oRowInfo){
		if (this.mShapeConfig.hasShapeProperty("title")){
			return this._configFirst("title", oData);
		}
		
		var retVal = "";
		var oUtilCurves;
		if (this.mShapeConfig.hasShapeProperty("utilizationCurves")){
			oUtilCurves = this._configFirst("utilizationCurves", oData);
		}
		if (oData) {
			for (var util in oUtilCurves){
				if (oData[oUtilCurves[util].ratioAttribute] || oData[oUtilCurves[util].ratioAttribute] === 0){
					// a changer
					if (oData[oUtilCurves[util].ratioAttribute].previous !== undefined){
						retVal += oUtilCurves[util].name + "\t" +
						oData[oUtilCurves[util].ratioAttribute].previous + "-" +
							oData[oUtilCurves[util].ratioAttribute].next + "%" + "\n";
					// a carrier or follower
					}else {
						retVal += oUtilCurves[util].name + "\t" +
						oData[oUtilCurves[util].ratioAttribute].value + "%" + "\n";
					}
				}
			}
		}
		return retVal;
	};

	/**
	 * Gets the value of property <code>x</code>.
	 * 
	 * <p>
	 * x coordinate of the rectangle left-top point.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#RectElementXAttribute SVG 1.1 specification for 'x' attribute of 'rect'}.
	 * 
	 * Usually an application does not configure this value. Instead, the getter calculates the value of x by using property <code>from</code>.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>x</code>.
	 * @public
	 */
	UlcTooltipRectangle.prototype.getX = function(oData, oRowInfo){
		if (this.mShapeConfig.hasShapeProperty("x")){
			return this._configFirst("x", oData);
		}

		var oAxisTime = this.getAxisTime();
		if (Core.getConfiguration().getRTL()) {
			return oAxisTime.timeToView(Format.abapTimestampToDate(oData.to));
		} else {
			return oAxisTime.timeToView(Format.abapTimestampToDate(oData.from));
		}
	};

	/**
	 * Gets the value of property <code>width</code>.
	 * 
	 * <p>
	 * Width of the rectangle.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#RectElementWidthAttribute SVG 1.1 specification for the 'width' attribute of 'rect'}.
	 * 
	 * Usually an application does not configure this value. Instead, the getter calculates value of width by using the <code>from</code> and
	 * <code>to</code> properties.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>width</code>.
	 * @public
	 */
	UlcTooltipRectangle.prototype.getWidth = function(oData, oRowInfo){
		if (this.mShapeConfig.hasShapeProperty("width")){
			return this._configFirst("width", oData);
		}

		var oAxisTime = this.getAxisTime();
		if (Core.getConfiguration().getRTL()) {
			return Math.abs(oAxisTime.timeToView(Format.abapTimestampToDate(oData.from)) - 
					oAxisTime.timeToView(Format.abapTimestampToDate(oData.to)));
		} else {
			return Math.abs(oAxisTime.timeToView(Format.abapTimestampToDate(oData.to)) - 
					oAxisTime.timeToView(Format.abapTimestampToDate(oData.from)));
		}
	};

	/**
	 * Gets the value of property <code>height</code>.
	 * 
	 * <p>
	 * Height of the rectangle.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#RectElementHeightAttribute SVG 1.1 specification for the 'height' attribute of 'rect'}.
	 * </p>
	 * <p>The default value is the height of the row.</p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>height</code>.
	 * @public
	 */
	UlcTooltipRectangle.prototype.getHeight = function(oData, oRowInfo){
		if (this.mShapeConfig.hasShapeProperty("height")){
			return this._configFirst("height", oData);
		}
		
		return oRowInfo.rowHeight;
	};
	
	/**
	 * Gets the value of property <code>strokeOpacity</code>.
	 * 
	 * <p>
	 * Standard SVG 'stroke-Opacity' attribute.
	 * See {@link http://www.w3.org/TR/SVG/painting.html#StrokeOpacityProperty SVG 1.1 specification for 'stroke-opacity'}.
	 * The value of strokeOpacity for tooltip rectangles must be 0.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>strokeOpacity</code>.
	 * @public
	 */
	UlcTooltipRectangle.prototype.getStrokeOpacity = function(oData, oRowInfo){
		if (this.mShapeConfig.hasShapeProperty("strokeOpacity")){
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
	 * The value of fillOpacity for tooltip rectangles must be 0.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>fillOpacity</code>.
	 * @public
	 */
	UlcTooltipRectangle.prototype.getFillOpacity = function(oData, oRowInfo){
		if (this.mShapeConfig.hasShapeProperty("fillOpacity")){
			return this._configFirst("fillOpacity", oData);
		}
		
		return 0;
	};

	return UlcTooltipRectangle;
}, true);
