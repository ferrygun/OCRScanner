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
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings of the new control
	 * 
	 * @class 
	 * This shape is used to draw the over capacity zone background.
	 * 
	 * <p>
	 * Graphic Effect is:<br/>
	 * <svg xmlns="http://www.w3.org/2000/svg" width="12cm" height="8.8cm" viewBox="0 0 300 220" version="1.1">
	 * <defs><marker id="arrowend" viewBox="0 0 10 10" refX="10" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 0 l 10 5 l -10 5 l 4 -5 z" fill="#6d6d6d" /></marker>
	 * 	<marker id="arrowstart" viewBox="0 0 10 10" refX="0" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 5 l 10 -5 l -4 5 l 4 5 z" fill="#6d6d6d" /></marker></defs>
	 * 	<style>.side{stroke-width:2;stroke:#1C75BC;fill:none;} .dashside{stroke-width:1;stroke:#1C75BC;fill:none; stroke-dasharray:5,1;} .dashassist{stroke-width:1;stroke:#6d6d6d;fill:none; stroke-dasharray:5,1;}
	 * 	.arrowline{stroke-width:1;stroke:#6d6d6d;fill:none;marker-end:url(#arrowend);marker-start:url(#arrowstart);} .center{r:3;fill:#6d6d6d;stroke:#9E1F63;} .texthyphon{stroke-width:1;stroke:#9E1F63;fill:none} .propertyText{stroke:#6d6d6d;} .timeText{stroke:#9E1F63;} </style>
	 * 	<rect x="1" y="1" width="298" height="218" fill="none" stroke="blue" stroke-width="0.5"/>
	 * 	<defs><pattern class="pattern" id="pUlc" patternUnits="userSpaceOnUse" x="0" y="0" width="4" height="4"><rect x="0" width="4" height="4" fill="#efefef"></rect><path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2 " stroke="#6d6d6d" stroke-width="0.5"></path></pattern>
	 * 	<pattern class="pattern" id="pEx" patternUnits="userSpaceOnUse" x="0" y="0" width="4" height="4"><rect x="0" width="4" height="4" fill="#f2a5a5"></rect><path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2 " stroke="#d16d6d" stroke-width="0.5"></path></pattern></defs>
	 * 	<path d="M 10 85 h 280 v -20 h -280 v 90 h 280 v -70" class="dashside" />
	 * 	<rect id="overBg" x="10" y="65" width="280" height="20" fill="url(#pUlc)" />
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
	 * @alias sap.gantt.shape.ext.ulc.UlcOverCapacityZoneRectangle
	 */
	var UlcOverCapacityZoneRectangle = UlcRectangle.extend("sap.gantt.shape.ext.ulc.UlcOverCapacityZoneRectangle", /** @lends sap.gantt.shape.ext.ulc.UlcOverCapacityZoneRectangle.prototype */ {});

	/**
	 * Gets the value of property <code>fill</code>.
	 * 
	 * <p> 
	 * Standard SVG 'fill' attribute.
	 * See {@link http://www.w3.org/TR/SVG/painting.html#FillProperty SVG 1.1 specification for 'fill'}.
	 * <b>Note:</b> You can provide <code>fill</code> property with the HTML colors and the URL reference to a paint server. Paint server definitions can be retrieved from paint servers rendered by
	 * {@link sap.gantt.GanttChartContainer}, {@link sap.gantt.GanttChartWithTable}, or {@link sap.gantt.GanttChart}. The default value 
	 * of 'fill' is a URL reference.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {string} Value of property <code>fill</code>.
	 * @public
	 */
	UlcOverCapacityZoneRectangle.prototype.getFill = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("fill")){
			return this._configFirst("fill", oData);
		}
		
		var sColor, sPattern;
		if (this.mShapeConfig.hasShapeProperty("backgroundColor")) {
			sColor = this._configFirst("backgroundColor", oData);
		}
		if (this.mShapeConfig.hasShapeProperty("pattern")) {
			sPattern = this._configFirst("pattern", oData);
		}
		var sPatternId;
		if (sColor && sPattern){
			sPatternId = "pattern_" + sPattern + "_" + (sColor.indexOf("#") == 0 ? sColor.substring(1, sColor.length) : sColor);
		}
		if (sPatternId && sap.ui.getCore().byId(sPatternId)){
			return sap.ui.getCore().byId(sPatternId).getRefString();
		}
		
		return "#F6F6F6";
	};

	/**
	 * Gets the value of property <code>stroke</code>.
	 * 
	 * <p>
	 * Standard SVG 'stroke' attribute.
	 * See {@link http://www.w3.org/TR/SVG/painting.html#StrokeProperty SVG 1.1 specification for 'stroke'}.
	 * <b>Note:</b> HTML colors and url reference to paint server can be provided to stroke. Paint server definitions usually comes from paint servers rendered by
	 * {@link sap.gantt.GanttChartContainer}, {@link sap.gantt.GanttChartWithTable} or {@link sap.gantt.GanttChart}.
	 * </p>
	 * <p>The default value is "#CAC7BA".</p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {string} Value of property <code>stroke</code>.
	 * @public
	 */
	UlcOverCapacityZoneRectangle.prototype.getStroke = function(oData, oRowInfo) {
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
	 * <p>The default value is 0.</p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>strokeWidth</code>.
	 * @public
	 */
	UlcOverCapacityZoneRectangle.prototype.getStrokeWidth = function(oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("strokeWidth")){
			return this._configFirst("strokeWidth", oData);
		}
		
		return 0;
	};

	return UlcOverCapacityZoneRectangle;
}, true);
