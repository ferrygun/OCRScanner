/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Shape", "sap/gantt/misc/Utility", "sap/gantt/misc/Format", "sap/ui/core/Core"
], function (Shape, Utility, Format, Core) {
	"use strict";
	
	/**
	 * Creates and initializes a new Text class.
	 * 
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * Text shape class using SVG tag 'text'. This shape is usually used to represent points in time.
	 * 
	 * <p>
	 * See {@link http://www.w3.org/TR/SVG/text.html SVG specification 1.1 for 'text' element} for
	 * more information about the HTML tag.<br/><br/>
	 * {@link http://www.w3.org/TR/SVG/images/text/text01.svg Text sample in SVG specification 1.1}:<br/>
	 * <svg width="10cm" height="3cm" viewBox="0 0 1000 300" xmlns="http://www.w3.org/2000/svg" version="1.1">
	 * <rect x="1" y="1" width="998" height="298" fill="none" stroke="blue" stroke-width="2" />
	 * <text x="250" y="150" font-family="Verdana" font-size="55" fill="blue" >Hello, out there</text>
	 * </svg><br/>
	 * 
	 * {@link http://www.w3.org/TR/SVG/images/text/textdecoration01.svg Decorated text sample in SVG specification 1.1}: <br/>
	 * <svg width="12cm" height="4cm" viewBox="0 0 1200 400" xmlns="http://www.w3.org/2000/svg" version="1.1">
	 * <rect x="1" y="1" width="1198" height="398" fill="none" stroke="blue" stroke-width="2" />
	 * <g font-size="60" fill="blue" stroke="red" stroke-width="1" >
	 * <text x="100" y="75">Normal text</text>
	 * <text x="100" y="165" text-decoration="line-through" >Text with line-through</text>
	 * <text x="100" y="255" text-decoration="underline" >Underlined text</text>
	 * <text x="100" y="345" text-decoration="underline" >
	 * <tspan>One </tspan>
	 * <tspan fill="yellow" stroke="purple" >word </tspan>
	 * <tspan fill="yellow" stroke="black" >has </tspan>
	 * <tspan fill="yellow" stroke="darkgreen" text-decoration="underline" >different </tspan>
	 * <tspan fill="yellow" stroke="blue" >underlining</tspan>
	 * </text>
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
	 * @alias sap.gantt.shape.Text
	 */
	var Text = Shape.extend("sap.gantt.shape.Text", /** @lends sap.gantt.shape.Text.prototype */ {
		metadata: {
			properties: {
				tag: {type: "string", defaultValue: "text"},

				text: {type: "string"},
				x: {type: "float"},
				y: {type: "float"},
				fontSize: {type: "int", defaultValue: 10},
				textAnchor: {type: "string", defaultValue: "start"},
				fontFamily: {type: "string"},
				wrapWidth: {type: "float", defaultValue: -1},
				wrapDy: {type: "float", defaultValue: 20},
				truncateWidth: {type: "float", defaultValue: -1},
				ellipsisWidth: {type: "float", defaultValue: 12}
			}
		}
	});
	
	/**
	 * Gets the value of property <code>tag</code>.
	 * 
	 * SVG tag name of the shape.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html SVG 1.1 specification for shapes}.<br/>
	 * <b>Note:</b> We do not recommend that you change this value using a configuration or coding.
	 * 
	 * @name sap.gantt.shape.Text.prototype.getTag
	 * @function
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of property <code>tag</code>.
	 * @public
	 */
	
	/**
	 * Gets the value of property <code>x</code>.
	 * 
	 * <p>
	 * x coordinate of the bottom-left corner of the rectangle.
	 * See {@link http://www.w3.org/TR/SVG/text.html#TextElementXAttribute SVG 1.1 specification for 'x' attribute of 'text'}.
	 * 
	 * Usually applications do not set this value. This getter carries out the calculation using property <code>time</code>.
	 * If you override the default value calculated by the getter, the alignment of the center is not guaranteed.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>x</code>.
	 * @public
	 */
	Text.prototype.getX = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("x")) {
			return this._configFirst("x", oData);
		}

		var sTime = this.getTime(oData, oRowInfo);
		var oAxisTime = this.getAxisTime();
		var xPos = oAxisTime.timeToView(Format.abapTimestampToDate(sTime));
		if (!jQuery.isNumeric(xPos)) {
			xPos = oAxisTime.timeToView(0).toFixed(1);
		}
		return xPos;
	};

	/**
	 * Gets the value of property <code>y</code>.
	 * 
	 * <p>
	 * y coordinate of the bottom-left corner of the rectangle.
	 * See {@link http://www.w3.org/TR/SVG/text.html#TextElementYAttribute SVG 1.1 specification for 'y' attribute of 'text'}.
	 * 
	 * Usually applications do not set this value. This getter carries out the calculation using parameter <code>oRowInfo</code>
	 * and property <code>height</code> to align the center of the row rectangle along the y axis. 
	 * If you override the default value calculated by the getter, the alignment of the center is not guaranteed.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>y</code>.
	 * @public
	 */
	Text.prototype.getY = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("y")) {
			return this._configFirst("y", oData);
		}

		return this.getRowYCenter(oData, oRowInfo) + this.getFontSize(oData, oRowInfo) / 2;
	};
	
	/**
	 * Gets the value of property <code>text</code>.
	 * 
	 * <p>
	 * Text string.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of property <code>text</code>.
	 * @public
	 */
	Text.prototype.getText = function (oData) {
		return this._configFirst("text", oData);
	};

	/**
	 * Gets the value of property <code>textAnchor</code>.
	 * 
	 * <p>
	 * Text anchor. Possible values are 'start', 'middle', and 'end'.
	 * See {@link http://www.w3.org/TR/SVG/text.html#TextAnchorProperty SVG 1.1 specification for 'text-anchor' property of 'text'}.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of property <code>textAnchor</code>.
	 * @public
	 */
	Text.prototype.getTextAnchor = function (oData) {
		return this._configFirst("textAnchor", oData);
	};
	
	/**
	 * Gets the value of property <code>fontSize</code>.
	 * 
	 * <p>
	 * Text font size.
	 * See {@link http://www.w3.org/TR/SVG/text.html#FontSizeProperty SVG 1.1 specification for 'font-size' property of 'text'}.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>fontSize</code>.
	 * @public
	 */
	Text.prototype.getFontSize = function (oData) {
		return this._configFirst("fontSize", oData, true);
	};

	/**
	 * Gets the value of property <code>fontFamily</code>.
	 * 
	 * <p>
	 * Text font family.
	 * See {@link http://www.w3.org/TR/SVG/text.html#FontSizeProperty SVG 1.1 specification for 'font-family' property of 'text'}.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of property <code>fontFamily</code>.
	 * @public
	 */
	Text.prototype.getFontFamily = function (oData) {
		return this._configFirst("fontFamily", oData, true);
	};
	
	/**
	 * Gets the value of property <code>wrapWidth</code>.
	 * 
	 * <p>
	 * Wrapping width. Default value -1 indicates wrapping function is not activated. To enable wrapping, give a wrap width here. If text legnth is
	 * exceeding wrapping width, text wrap in different lines.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>wrapWidth</code>.
	 * @private
	 */
	Text.prototype.getWrapWidth = function (oData) {
		return this._configFirst("wrapWidth", oData);
	};
	
	/**
	 * Gets the value of property <code>wrapDy</code>.
	 * 
	 * <p>
	 * If wrapping happens, this value gives the deviation of line wrapping. Effect the distance between lines.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>wrapDy</code>.
	 * @private
	 */
	Text.prototype.getWrapDy = function (oData) {
		return this._configFirst("wrapDy", oData);
	};
	
	/**
	 * Gets the value of property <code>truncateWidth</code>.
	 * 
	 * <p>
	 * Truncating width. Default value -1 indicates truncating function is not activated. To enable truncating, give a truncate width here. If text length
	 * exceeds truncate width, text is truncated.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>truncateWidth</code>.
	 * @public
	 */
	Text.prototype.getTruncateWidth = function (oData) {
		return this._configFirst("truncateWidth", oData);
	};
	
	/**
	 * Gets the value of property <code>ellipsisWidth</code>.
	 * 
	 * <p>
	 * Ellipsis width if truncate happens. Default value 12 indicates 12px length reserved for ellipsis. If the value is
	 * -1, no ellipsis appears even truncate happens. If the value is bigger than -1, ellipsis will be 3 dots in length of this value.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>ellipsisWidth</code>.
	 * @public
	 */
	Text.prototype.getEllipsisWidth = function (oData) {
		return this._configFirst("ellipsisWidth", oData);
	};

	Text.prototype.getStyle = function(oData, oRowInfo) {
		var sInheritedStyle = Shape.prototype.getStyle.apply(this, arguments);
		var oStyles = {
			"font-size": this.getFontSize(oData, oRowInfo) + "px;",
			"fill": this.determineValueColor(this.getFill(oData, oRowInfo)),
			"font-family": this.getFontFamily(oData, oRowInfo)
		};
		return sInheritedStyle + this.getInlineStyle(oStyles);
	};
	return Text;
}, true);
