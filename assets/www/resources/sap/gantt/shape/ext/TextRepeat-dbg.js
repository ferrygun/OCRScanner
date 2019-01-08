/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Definitions", "sap/ui/core/Core", "sap/gantt/misc/Format"
], function (Definitions, Core, Format) {
	"use strict";

	/**
	 * Creates and initializes a repeatable text pattern defined for later reuse.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * A TextRepeat definition shape is used to define graphic objects which can be replicated
	 * ("tiled") at fixed intervals in the x and y axes to cover the areas to be painted.
	 * The text patterns are defined using a 'pattern' element and then referenced by the
	 * 'fill' and 'stroke' properties on a given graphics element to indicate that the element
	 * will be filled or stroked with the referenced pattern.
	 * 
	 * @extend sap.gantt.shape.Definitions
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.shape.ext.TextRepeat
	 */
	var TextRepeat = Definitions.extend("sap.gantt.shape.ext.TextRepeat", /** @lends sap.gantt.shape.ext.TextRepeat.prototype */{
		metadata: {
			properties: {
				childTagName: {type: "string", defaultValue: "pattern"},
				x: {type: "float"},
				y: {type: "float"},
				width: {type: "float"},
				height: {type: "float", defaultValue: 15},
				dx: {type: "string"},
				dy: {type: "string"},
				text: {type: "string"},
				fontSize: {type: "int"},
				fontFamily: {type: "string"}
			}
		}
	});

	/**
	 * Gets the value of the <code>childTagName</code> property.
	 * 
	 * <p>
	 * Child element of 'defs' element. The default value is 'pattern'.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of the <code>childTagName</code> property.
	 * @public
	 */
	TextRepeat.prototype.getChildTagName = function(oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("childTagName")) {
			return this._configFirst("childTagName", oData);
		}
		return 'pattern';
	};

	/**
	 * Gets the value of the <code>x</code> property.
	 * 
	 * <p>
	 * x coordinate of the text pattern tiles.
	 * See {@link http://www.w3.org/TR/SVG/pservers.html#PatternElementXAttribute SVG 1.1 specification for 'x' attribute of 'pattern'}.
	 * 
	 * Usually applications do not set this value. This getter carries out the calculation using property <code>time</code> as a base.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {float} Value of the <code>x</code> property.
	 * @public
	 */
	TextRepeat.prototype.getX = function (oData, oRowInfo) {
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
			return 0;
		}
		return nTimeX;
	};

	/**
	 * Gets the value of the <code>y</code> property.
	 * 
	 * <p>
	 * y coordinate of the text pattern tiles.
	 * See {@link http://www.w3.org/TR/SVG/pservers.html#PatternElementYAttribute SVG 1.1 specification for 'y' attribute of 'pattern'}.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {float} Value of the <code>y</code> property.
	 * @public
	 */
	TextRepeat.prototype.getY = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("y")) {
			return this._configFirst("y", oData);
		}
		return 0;
	};

	/**
	 * Gets the value of the <code>width</code> property.
	 * 
	 * <p>
	 * Width of a reference rectangle.
	 * See {@link http://www.w3.org/TR/SVG/pservers.html#PatternElementWidthAttribute SVG 1.1 specification for 'width' attribute of 'pattern'}.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {float} Value of the <code>width</code> property.
	 * @public
	 */
	TextRepeat.prototype.getWidth = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("width")) {
			return this._configFirst("width", oData);
		}
		return 0;
	};

	/**
	 * Gets the value of the <code>height</code> property.
	 * 
	 * <p>
	 * Height of a reference rectangle.
	 * See {@link http://www.w3.org/TR/SVG/pservers.html#PatternElementHeightAttribute SVG 1.1 specification for 'height' attribute of 'pattern'}.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {float} Value of the <code>height</code> property.
	 * @public
	 */
	TextRepeat.prototype.getHeight = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("height")) {
			return this._configFirst("height", oData);
		}
		return 0;
	};

	/**
	 * Gets the value of the <code>dx</code> property.
	 * 
	 * <p>
	 * dx value of the start position of text pattern tiles.
	 * See {@link http://www.w3.org/TR/SVG/text.html#TSpanElementDXAttribute SVG 1.1 specification for 'dx' attribute of 'text'}.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of the <code>dx</code> property.
	 * @public
	 */
	TextRepeat.prototype.getDx = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("dx")) {
			return this._configFirst("dx", oData);
		}
		return "0";
	};

	/**
	 * Gets the value of the <code>dy</code> property.
	 * 
	 * <p>
	 * dy value of the start position of text pattern tiles.
	 * See {@link http://www.w3.org/TR/SVG/text.html#TSpanElementDYAttribute SVG 1.1 specification for 'dy' attribute of 'text'}.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of the <code>dy</code> property.
	 * @public
	 */
	TextRepeat.prototype.getDy = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("dy")) {
			return this._configFirst("dy", oData);
		}
		return "0";
	};

	/**
	 * Gets the value of the <code>text</code> property.
	 * 
	 * <p>
	 * Text string.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of the <code>text</code> property.
	 * @public
	 */
	TextRepeat.prototype.getText = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("text")) {
			return this._configFirst("text", oData);
		}
		return "";
	};

	TextRepeat.prototype.getContent = function(oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("content")) {
			return this._configFirst("content", oData);
		}

		var sChildTagName = this.getChildTagName(oData, oRowInfo);
		return "<" + sChildTagName + 
			" id='" + this.getReferenceId(oData, oRowInfo) + 
			"' patternUnits='userSpaceOnUse'" + 
			" width=" + this.getWidth(oData, oRowInfo) +
			" height=" + this.getHeight(oData, oRowInfo) +
			" x=" + this.getX(oData, oRowInfo) + 
			" y=" + this.getY(oData, oRowInfo) + 
			"><text dx=" + this.getDx(oData, oRowInfo) +
			" dy=" + this.getDy(oData, oRowInfo) + 
			" font-size=" + this.getFontSize(oData, oRowInfo) + 
			" font-family='" + this.getFontFamily(oData, oRowInfo) +
			"'>" + this.getText(oData, oRowInfo) + 
			"</text></" + sChildTagName + ">" ;
	};

	/**
	 * Gets the value of the <code>fontSize</code> property.
	 * 
	 * <p>
	 * Text font size.
	 * See {@link http://www.w3.org/TR/SVG/text.html#FontSizeProperty SVG 1.1 specification for 'font-size' property of 'text'}.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {int} Value of the <code>fontSize</code> property.
	 * @public
	 */
	TextRepeat.prototype.getFontSize = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("fontSize")) {
			return this._configFirst("fontSize", oData, true);
		}
		return 12;
	};

	/**
	 * Gets the value of the <code>fontFamily</code> property.
	 * 
	 * <p>
	 * Text font family.
	 * See {@link http://www.w3.org/TR/SVG/text.html#FontSizeProperty SVG 1.1 specification for 'font-family' property of 'text'}.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of the <code>fontFamily</code> property.
	 * @public
	 */
	TextRepeat.prototype.getFontFamily = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("fontFamily")) {
			return this._configFirst("fontFamily", oData, true);
		}
		return "";
	};

	return TextRepeat;
}, true);
