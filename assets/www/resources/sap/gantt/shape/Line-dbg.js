/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Shape", "sap/gantt/misc/Utility", "sap/gantt/misc/Format"
], function (Shape, Utility, Format) {
	"use strict";
	
	/**
	 * Creates and initializes a new Line class.
	 * 
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * Line shape class using SVG tag 'line'. This shape is usually used to represent durations.
	 * 
	 * <p>
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#LineElement SVG specification 1.1 for 'line' element} for
	 * more information about the HTML tag.<br/><br/>
	 * {@link http://www.w3.org/TR/SVG/images/shapes/line01.svg Line samples in SVG specification 1.1}:<br/>
	 * <svg xmlns="http://www.w3.org/2000/svg" width="12cm" height="4cm" viewBox="0 0 1200 400" version="1.1">
	 * <rect x="1" y="1" width="1198" height="398" fill="none" stroke="blue" stroke-width="2"/>
	 * <g stroke="green">
	 *   <line x1="100" y1="300" x2="300" y2="100" stroke-width="5"/>
	 *   <line x1="300" y1="300" x2="500" y2="100" stroke-width="10"/>
	 *   <line x1="500" y1="300" x2="700" y2="100" stroke-width="15"/>
	 *   <line x1="700" y1="300" x2="900" y2="100" stroke-width="20"/>
	 *   <line x1="900" y1="300" x2="1100" y2="100" stroke-width="25"/>
	 * </g>
	 * </svg>
	 * </p>
	 * 
	 * @extend sap.gantt.shape.Shape
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.shape.Line
	 */
	var Line = Shape.extend("sap.gantt.shape.Line", /** @lends sap.gantt.shape.Line.prototype */ {
		metadata: {
			properties: {
				tag: {type: "string", defaultValue: "line"},
				isDuration: {type: "boolean", defaultValue: true},
				
				x1: {type: "float"},
				y1: {type: "float"},
				x2: {type: "float"},
				y2: {type: "float"}
			}
		}
	});
	
	Line.prototype.init = function() {
		Shape.prototype.init.apply(this, arguments);
		var oRb = sap.ui.getCore().getLibraryResourceBundle("sap.gantt");
		this.setProperty("ariaLabel", oRb.getText("ARIA_LINE"));
	};
	
	/**
	 * Gets the value of property <code>tag</code>.
	 * 
	 * SVG tag name of the shape.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html SVG 1.1 specification for shapes}.<br/>
	 * <b>Note:</b>  We do not recommend that you change this value using a configuration or coding.
	 * 
	 * @name sap.gantt.shape.Line.prototype.getTag
	 * @function
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of property <code>tag</code>.
	 * @public
	 */
	
	/**
	 * Gets the value of property <code>isDuration</code>.
	 * 
	 * @name sap.gantt.shape.Line.prototype.getIsDuration
	 * @function
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {boolean} Value of property <code>isDuration</code>.
	 * @public
	 */
	
	/**
	 * Gets the value of property <code>x1</code>.
	 * 
	 * <p>
	 * x coordinate of the start of the line.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#LineElementX1Attribute SVG 1.1 specification for 'x1' attribute of 'line'}.
	 * 
	 * Usually applications do not set this value. This getter carries out the calculation using property <code>time</code> as a base
	 * and makes some adjustments.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>x1</code>.
	 * @public
	 */
	Line.prototype.getX1 = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("x1")) {
			return this._configFirst("x1", oData);
		}
		
		return this.getAxisTime().timeToView(
			Format.abapTimestampToDate(this.getTime(oData, oRowInfo)));
	};
	
	/**
	 * Gets the value of property <code>y1</code>.
	 * 
	 * <p>
	 * y coordinate of the start of the line.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#LineElementY1Attribute SVG 1.1 specification for 'y1' attribute of 'line'}.
	 * 
	 * Usually applications do not set this value. This getter carries out the calculation using parameter <code>oRowInfo</code>,
	 * and makes some adjustments to align the center of the row rectangle along the y axis. 
	 * If you override the default value calculated by the getter, the alignment of the center is not guaranteed.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>y1</code>.
	 * @public
	 */
	Line.prototype.getY1 = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("y1")) {
			return this._configFirst("y1", oData, true);
		}
		
		return this.getRowYCenter(oData, oRowInfo);
	};
	
	/**
	 * Gets the value of property <code>x2</code>.
	 * 
	 * <p>
	 * x coordinate of the end of the line.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#LineElementX2Attribute SVG 1.1 specification for 'x2' attribute of 'line'}.
	 * 
	 * Usually applications do not set this value. This getter carries out the calculation using property <code>endTime</code> as a base
	 * and makes some adjustments.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>x2</code>.
	 * @public
	 */
	Line.prototype.getX2 = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("x2")) {
			return this._configFirst("x2", oData);
		}
		
		return this.getAxisTime().timeToView(
				Format.abapTimestampToDate(this.getEndTime(oData, oRowInfo)));
	};
	
	/**
	 * Gets the value of property <code>y2</code>.
	 * 
	 * <p>
	 * y coordinate of the end of the line.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#LineElementY2Attribute SVG 1.1 specification for 'y2' attribute of 'line'}.
	 * 
	 * Usually applications do not set this value. This getter carries out the calculation using parameter <code>oRowInfo</code> as a base
	 * and makes some adjustments to align the center of the row rectangle along the y axis. 
	 * f you override the default value calculated by the getter, the alignment of the center is not guaranteed.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>y2</code>.
	 * @public
	 */
	Line.prototype.getY2 = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("y2")) {
			return this._configFirst("y2", oData, true);
		}
		
		return this.getRowYCenter(oData, oRowInfo);
	};

	Line.prototype.getStyle = function(oData, oRowInfo) {
		var sInheritedStyle = Shape.prototype.getStyle.apply(this, arguments);
		var oStyles = {
			"stroke-dasharray": this.getStrokeDasharray(oData, oRowInfo),
			"fill-opacity": this.getFillOpacity(oData, oRowInfo),
			"stroke-opacity": this.getStrokeOpacity(oData, oRowInfo)
		};
		return sInheritedStyle + this.getInlineStyle(oStyles);
	};

	return Line;
}, true);
