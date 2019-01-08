/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
"sap/gantt/shape/ext/ulc/UlcRectangle"
], function(UlcRectangle){
	"use strict";

	/**
	 * Creates and initializes a fragment of the Utilization Line Chart.
	 * 
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings of the new control
	 * 
	 * @class 
	 * This shape is used to draw the under clipping rectangle.
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
	 * 	<clippath id="cpSide"><path d="M 40 155 l 25 -90 h 50 l 20 30 h 100 l 40 60" /></clippath>
	 * 	<clippath id="cpTexthyphon"><path d="M 40 155 l 25 -85 h 50 l 20 10 h 100 l 40 75" /></clippath>
	 * 	<rect id="underSide" x="10" y="85" width="280" height="70" clip-path="url(#cpSide)" fill="#858585" fill-opacity="0.5" />
	 * 	<rect id="underTexthyphone" x="10" y="85" width="280" height="70" clip-path="url(#cpTexthyphon)" fill="#858585" fill-opacity="0.5" />
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
	 * @alias sap.gantt.shape.ext.ulc.UlcUnderClipRectangle
	 */
	var UlcUnderClipRectangle = UlcRectangle.extend("sap.gantt.shape.ext.ulc.UlcUnderClipRectangle", /** @lends sap.gantt.shape.ext.ulc.UlcUnderClipRectangle.prototype" */ {});

	/**
	 * Gets the value of property <code>y</code>.
	 * 
	 * <p>
	 * y coordinate of the rectangle left-top point.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#RectElementYAttribute SVG 1.1 specification for 'y' attribute of 'rect'}.
	 * 
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>y</code>.
	 * @public
	 */
	UlcUnderClipRectangle.prototype.getY = function(oData, oRowInfo){
		if (this.mShapeConfig.hasShapeProperty("y")){
			return this._configFirst("y", oData);
		}
		
		var maxVisibleRatio = 25;
		if (this.mShapeConfig.hasShapeProperty("maxVisibleRatio")){
			maxVisibleRatio = this._configFirst("maxVisibleRatio", oData);
		}
		return oRowInfo.y + oRowInfo.rowHeight * maxVisibleRatio / (100 + maxVisibleRatio);
	};

	/**
	 * Gets the value of property <code>height</code>.
	 * 
	 * <p>
	 * Height of the rectangle.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#RectElementHeightAttribute SVG 1.1 specification for 'height' attribute of 'rect'}.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>height</code>.
	 * @public
	 */
	UlcUnderClipRectangle.prototype.getHeight = function(oData, oRowInfo){
		if (this.mShapeConfig.hasShapeProperty("height")){
			return this._configFirst("height", oData);
		}
		
		var maxVisibleRatio = 25;
		if (this.mShapeConfig.hasShapeProperty("maxVisibleRatio")){
			maxVisibleRatio = this._configFirst("maxVisibleRatio", oData);
		}
		return oRowInfo.rowHeight - oRowInfo.rowHeight * maxVisibleRatio / (100 + maxVisibleRatio);
	};

	/**
	 * Gets current value of property <code>fill</code>.
	 * 
	 * <p> 
	 * Standard SVG 'fill' attribute.
	 * See {@link http://www.w3.org/TR/SVG/painting.html#FillProperty SVG 1.1 specification for 'fill'}.
	 * <b>Note:</b> You can provide the <code>fill</code> property with HTML colors and the URL reference to a paint server. Paint server definitions can be retrieved from paint servers rendered by
	 * {@link sap.gantt.GanttChartContainer}, {@link sap.gantt.GanttChartWithTable}, or {@link sap.gantt.GanttChart}.
	 * </p>
	 * <p>The default value is "#F2F2F2".</p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {string} Value of property <code>fill</code>.
	 * @public
	 */
	UlcUnderClipRectangle.prototype.getFill = function(oData, oRowInfo){
		if (this.mShapeConfig.hasShapeProperty("fill")){
			return this._configFirst("fill", oData);
		}
		
		return "#F2F2F2";
	};
	
	/**
	 * Gets the value of property <code>strokeOpacity</code>.
	 * 
	 * <p>
	 * Standard SVG 'stroke-Opacity' attribute.
	 * See {@link http://www.w3.org/TR/SVG/painting.html#StrokeOpacityProperty SVG 1.1 specification for 'stroke-opacity'}.
	 * </p>
	 * <p>The default value is 0.3.</p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>strokeOpacity</code>.
	 * @public
	 */
	UlcUnderClipRectangle.prototype.getStrokeOpacity = function(oData, oRowInfo){
		if (this.mShapeConfig.hasShapeProperty("strokeOpacity")){
			return this._configFirst("strokeOpacity", oData);
		}
		
		return 0.3;
	};

	/**
	 * Gets the value of property <code>fillOpacity</code>.
	 * 
	 * <p>
	 * Standard SVG 'fill-Opacity' attribute.
	 * See {@link http://www.w3.org/TR/SVG/painting.html#FillOpacityProperty SVG 1.1 specification for 'fill-opacity'}.
	 * </p>
	 * <p>The default value is 0.3.</p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>fillOpacity</code>.
	 * @public
	 */
	UlcUnderClipRectangle.prototype.getFillOpacity = function(oData, oRowInfo){
		if (this.mShapeConfig.hasShapeProperty("fillOpacity")){
			return this._configFirst("fillOpacity", oData);
		}
		
		return 0.3;
	};

	/**
	 * Gets the value of property <code>clipPath</code>.
	 * 
	 * <p>
	 * Standard SVG 'clippath' attribute.
	 * See {@link http://www.w3.org/TR/SVG/masking.html#ClipPathProperty SVG 1.1 specification for 'clippath'}.
	 * 
	 *  The referred ID must be consistent with the html class generated by <code>UlcClipPath</code>.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {string} Value of property <code>clipPath</code>.
	 * @public
	 */
	UlcUnderClipRectangle.prototype.getClipPath = function(oData, oRowInfo){
		if (this.mShapeConfig.hasShapeProperty("clipPath")){
			return this._configFirst("clipPath", oData);
		}
		
		var uid = oRowInfo.uid;
		var pattern = new RegExp("\\[|\\]|:|\\|", "g");
		var newUid = uid.replace(pattern, "_");
		
		return "url(#" + newUid + "_" + oData.id + "_" + oData.dimension + ")";
	};

	return UlcUnderClipRectangle;
}, true);
