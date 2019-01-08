/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Shape", "sap/gantt/misc/Utility", "sap/gantt/misc/Format", "sap/ui/core/Core"
], function (Shape, Utility, Format, Core) {
	"use strict";
	
	/**
	 * Creates and initializes a new Rectangle class.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * Rectangle shape class using SVG tag 'rect'. This shape is usually used to represent durations.
	 * 
	 * <p>
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#RectElement SVG specification 1.1 for 'rect' element} for
	 * more information about the HTML tag.<br/><br/>
	 * {@link http://www.w3.org/TR/SVG/images/shapes/rect01.svg Rectangle sample in SVG specification 1.1}:<br/>
	 * <svg xmlns="http://www.w3.org/2000/svg" width="12cm" height="4cm" viewBox="0 0 1200 400" version="1.1">
	 * <rect x="1" y="1" width="1198" height="398" fill="none" stroke="blue" stroke-width="2"/>
	 * <rect x="400" y="100" width="400" height="200" fill="yellow" stroke="navy" stroke-width="10"/>
	 * </svg><br/>
	 * 
	 * {@link http://www.w3.org/TR/SVG/images/shapes/rect02.svg Rectangle sample with rounded corner in SVG specification 1.1}: <br/>
	 * <svg xmlns="http://www.w3.org/2000/svg" width="12cm" height="4cm" viewBox="0 0 1200 400" version="1.1">
	 * 	<rect x="1" y="1" width="1198" height="398" fill="none" stroke="blue" stroke-width="2"/>
	 * 	<rect x="100" y="100" width="400" height="200" rx="50" fill="green"/>
	 * 	<g transform="translate(700 210) rotate(-30)">
	 * 		<rect x="0" y="0" width="400" height="200" rx="50" fill="none" stroke="purple" stroke-width="30"/>
	 * 	</g>
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
	 * @alias sap.gantt.shape.Rectangle
	 */
	var Rectangle = Shape.extend("sap.gantt.shape.Rectangle", /** @lends sap.gantt.shape.Rectangle.prototype */ {
		metadata: {
			properties: {
				tag: {type: "string", defaultValue: "rect"},
				isDuration: {type: "boolean", defaultValue: true},

				x: {type: "float"},
				y: {type: "float"},
				width: {type: "float"},
				height: {type: "float", defaultValue: 15},
				rx: {type: "string", defaultValue: "0"},
				ry: {type: "string", defaultValue: "0"}
			}
		}
	});
	
	Rectangle.prototype.init = function() {
		Shape.prototype.init.apply(this, arguments);
		var oRb = sap.ui.getCore().getLibraryResourceBundle("sap.gantt");
		this.setProperty("ariaLabel", oRb.getText("ARIA_RECTANGLE"));
	};
	
	/**
	 * Gets the value of property <code>tag</code>.
	 * 
	 * SVG tag name of the shape.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html SVG 1.1 specification for shapes}.<br/>
	 * <b>Note:</b> TWe do not recommend that you change this value using a configuration or coding.
	 * 
	 * @name sap.gantt.shape.Rectangle.prototype.getTag
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
	 * @name sap.gantt.shape.Rectangle.prototype.getIsDuration
	 * @function
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {boolean} Value of property <code>isDuration</code>.
	 * @public
	 */
	
	/**
	 * Gets the value of property <code>x</code>.
	 * 
	 * <p>
	 * x coordinate of the top-left corner of the rectangle.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#RectElementXAttribute SVG 1.1 specification for 'x' attribute of 'rect'}.
	 * 
	 * Usually applications do not set this value. This getter carries out the calculation using property <code>time</code> as a base.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>x</code>.
	 * @public
	 */
	Rectangle.prototype.getX = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("x")) {
			return this._configFirst("x", oData);
		}
		var nTimeX;
		var oAxisTime = this.getAxisTime();

		if (Core.getConfiguration().getRTL()) {
			nTimeX = oAxisTime.timeToView(Format.abapTimestampToDate(this.getEndTime(oData, oRowInfo)));
		} else {
			nTimeX = oAxisTime.timeToView(Format.abapTimestampToDate(this.getTime(oData, oRowInfo)));
		}
		if (!jQuery.isNumeric(nTimeX)) {
			jQuery.sap.log.warning("Cannot get start time or end time from shape data: " + oData + ", please check whether the attribute name");
			return 0;
		}
		return nTimeX;
	};

	/**
	 * Gets the value of property <code>y</code>.
	 * 
	 * <p>
	 * y coordinate of the top-left corner of the rectangle.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#RectElementYAttribute SVG 1.1 specification for 'y' attribute of 'rect'}.
	 * 
	 * Usually applications do not set this value. This getter carries out the calculation using parameter <code>oRowInfo</code> as a base
	 * and uses property <code>height</code> as an offset to align the center of the row rectangle along the y axis. 
	 * If you override the default value calculated by the getter, the alignment of the center is not guaranteed.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>y</code>.
	 * @public
	 */
	Rectangle.prototype.getY = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("y")) {
			return this._configFirst("y", oData, true);
		}

		return this.getRowYCenter(oData, oRowInfo) -
			this.getHeight(oData, oRowInfo) / 2;
	};
	
	/**
	 * Gets the value of property <code>width</code>.
	 * 
	 * <p>
	 * Width of the rectangle.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#RectElementWidthAttribute SVG 1.1 specification for 'width' attribute of 'rect'}.
	 * 
	 * Usually applications do not set this value. This getter carries out the calculation using properties <code>time</code> and
	 * <code>endTime</code>. If you override the default value calculated by the getter, proper rendering is not guaranteed.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>width</code>.
	 * @public
	 */
	Rectangle.prototype.getWidth = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("width")) {
			return this._configFirst("width", oData);
		}

		var oAxisTime = this.getAxisTime();
		var nRetVal,
			startTime = oAxisTime.timeToView(Format.abapTimestampToDate(this.getTime(oData, oRowInfo))),
			endTime = oAxisTime.timeToView(Format.abapTimestampToDate(this.getEndTime(oData, oRowInfo)));

		//if nRetVal is not numeric, return itself
		if (!jQuery.isNumeric(startTime) || !jQuery.isNumeric(endTime)) {
			return 0;
		}

		if (Core.getConfiguration().getRTL()) {
			nRetVal =  startTime - endTime;
		} else {
			nRetVal = endTime - startTime;
		}

		if (nRetVal === 0 || nRetVal < 0) {
			nRetVal = 1;
		}

		return nRetVal;
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
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>height</code>.
	 * @public
	 */
	Rectangle.prototype.getHeight = function (oData) {
		return this._configFirst("height", oData, true);
	};
	
	/**
	 * Gets the value of property <code>rx</code>.
	 * 
	 * <p>
	 * Rx of the rectangle.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#RectElementRXAttribute SVG 1.1 specification for 'rx' attribute of 'rect'}.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>rx</code>.
	 * @public
	 */
	Rectangle.prototype.getRx = function (oData) {
		return this._configFirst("rx", oData);
	};
	
	/**
	 * Gets the value of property <code>ry</code>.
	 * 
	 * <p>
	 * Ry of the rectangle.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#RectElementRYAttribute SVG 1.1 specification for 'ry' attribute of 'rect'}.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>ry</code>.
	 * @public
	 */
	Rectangle.prototype.getRy = function (oData) {
		return this._configFirst("ry", oData);
	};

	Rectangle.prototype.getStyle = function(oData, oRowInfo) {
		var sInheritedStyle = Shape.prototype.getStyle.apply(this, arguments);
		var oStyles = {
			"fill": this.determineValueColor(this.getFill(oData, oRowInfo)),
			"stroke-dasharray": this.getStrokeDasharray(oData, oRowInfo),
			"fill-opacity": this.getFillOpacity(oData, oRowInfo),
			"stroke-opacity": this.getStrokeOpacity(oData, oRowInfo)
		};
		return sInheritedStyle + this.getInlineStyle(oStyles);
	};
	return Rectangle;
}, true);
