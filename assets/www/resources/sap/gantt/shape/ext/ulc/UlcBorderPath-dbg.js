/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Path", "sap/gantt/misc/Utility", "sap/gantt/misc/Format"
], function(Path, Utility, Format){
	"use strict";

	/**
	 * Creates and initializes a fragment of the Utilization Line Chart.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings of the new control
	 * 
	 * @class 
	 * This shape is used to draw dimension lines.
	 * 
	 * <p>
	 * Graphic Effect is:<br/>
	 * <svg xmlns="http://www.w3.org/2000/svg" width="12cm" height="8.8cm" viewBox="0 0 300 220" version="1.1">
	 * 	<defs><marker id="arrowend" viewBox="0 0 10 10" refX="10" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 0 l 10 5 l -10 5 l 4 -5 z" fill="#6d6d6d" /></marker>
	 * 	<marker id="arrowstart" viewBox="0 0 10 10" refX="0" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 5 l 10 -5 l -4 5 l 4 5 z" fill="#6d6d6d" /></marker></defs>
	 * 	<style>.side{stroke-width:2;stroke:#1C75BC;fill:none;} .dashside{stroke-width:1;stroke:#1C75BC;fill:none; stroke-dasharray:5,1;} .dashassist{stroke-width:1;stroke:#6d6d6d;fill:none; stroke-dasharray:5,1;}
	 * 	.arrowline{stroke-width:1;stroke:#6d6d6d;fill:none;marker-end:url(#arrowend);marker-start:url(#arrowstart);} .center{r:3;fill:#6d6d6d;stroke:#9E1F63;} .texthyphon{stroke-width:1;stroke:#9E1F63;fill:none} .propertyText{stroke:#6d6d6d;} .timeText{stroke:#9E1F63;} </style>
	 * 	<rect x="1" y="1" width="298" height="218" fill="none" stroke="blue" stroke-width="0.5"/>
	 * 	<path d="M 10 85 h 280 v -20 h -280 v 90 h 280 v -70" class="dashside" />
	 * 	<path d="M 40 155 l 25 -90 h 50 l 20 30 h 100 l 40 60" class="side" />
	 * 	<path d="M 40 155 l 25 -85 h 50 l 20 10 h 100 l 40 75" class="texthyphon" />
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
	 * @alias sap.gantt.shape.ext.ulc.UlcBorderPath
	 */
	var UlcBorderPath = Path.extend("sap.gantt.shape.ext.ulc.UlcBorderPath", /** @lends sap.gantt.shape.ext.ulc.UlcBorderPath.prototype */ {});

	/**
	 * Gets the value of property <code>d</code>.
	 * 
	 * <p>
	 * 'd' attribute of the path element.
	 * See {@link http://www.w3.org/TR/SVG/paths.html#DAttribute SVG 1.1 specification for 'd' attribute of 'path'}.
	 * The 'd' attribute has powerful usages. See {@link http://www.w3.org/TR/SVG/paths.html#PathDataBNF BNF grammar} for detail.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {string} Value of property <code>d</code> or null if the generated d is invalid according to the given data.
	 * @public
	 */
	UlcBorderPath.prototype.getD = function(oData, oRowInfo){
		var retVal = "";
		if (this.mShapeConfig.hasShapeProperty("d")){
			retVal = this._configFirst("d", oData);
		} else {
			if (oData.values) {
				for (var i = 0; i < oData.values.length; i++) {
					var oAxisTime = this.getAxisTime();
					var xPos1 = oAxisTime.timeToView(Format.abapTimestampToDate(oData.values[i].from));
					var xPos2 = oAxisTime.timeToView(Format.abapTimestampToDate(oData.values[i].to));
					var ratio = oData.values[i].value;
					if (isNaN(ratio)){
						ratio = 0;
					}
					var maxVisibleRatio = 25;
					if (this.mShapeConfig.hasShapeProperty("maxVisibleRatio")){
						maxVisibleRatio = this._configFirst("maxVisibleRatio", oData);
					}
					if (ratio > (100 + maxVisibleRatio)) {
						ratio = 100 + maxVisibleRatio;
					}
					var yPos = oRowInfo.y + oRowInfo.rowHeight - oRowInfo.rowHeight * (ratio / (100 + maxVisibleRatio));
					var lowY = oRowInfo.y + oRowInfo.rowHeight;
					
					retVal = retVal +
							(oData.values[i].firstOne ? " M " + xPos1 + " " + lowY : "") +
							" L " + xPos1 + " " + yPos + " L " + xPos2 + " " + yPos +
							(oData.values[i].lastOne ? " L " + xPos2 + " " + lowY : "");
				}
			}
		}
		
		if(this.isValid(retVal)) {
			return retVal;
		} else {
			jQuery.sap.log.warning("UlcBorderPath shape generated invalid d: " + retVal + " from the given data: " + oData);
			return null;
		}
	};

	/**
	 * Gets the value of property <code>stroke</code>.
	 * 
	 * <p>
	 * Standard SVG 'stroke' attribute.
	 * See {@link http://www.w3.org/TR/SVG/painting.html#StrokeProperty SVG 1.1 specification for 'stroke'}.
	 * <b>Note:</b> You can provide stroke with HTML colors and URL references to paint servers. Paint server definitions usually comes from paint servers rendered by
	 * {@link sap.gantt.GanttChartContainer}, {@link sap.gantt.GanttChartWithTable} or {@link sap.gantt.GanttChart}.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {string} Value of property <code>stroke</code>.
	 * @public
	 */
	UlcBorderPath.prototype.getStroke = function(oData, oRowInfo){
		if (this.mShapeConfig.hasShapeProperty("stroke")){
			return this._configFirst("stroke", oData);
		}
		
		var oUtilizationCurves;
		if (this.mShapeConfig.hasShapeProperty("utilizationCurves")){
			oUtilizationCurves = this._configFirst("utilizationCurves", oData);
			return oUtilizationCurves[oData.dimension].color;
		}
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
	UlcBorderPath.prototype.getStrokeWidth = function(oData, oRowInfo){
		if (this.mShapeConfig.hasShapeProperty("strokeWidth")){
			return this._configFirst("strokeWidth", oData);
		}
		
		return 1;
	};

	return UlcBorderPath;
}, true);
