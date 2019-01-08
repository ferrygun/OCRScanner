/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Shape", "sap/gantt/misc/Utility", "sap/gantt/misc/Format", "sap/ui/core/Core"
], function (Shape, Utility, Format, Core) {
	"use strict";
	
	/**
	 * Creates and initializes a new Image class.
	 * 
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * Image shape class using SVG tag 'image'. This shape is usually used to represent points in time.
	 * 
	 * <p>
	 * See {@link http://www.w3.org/TR/SVG/struct.html#ImageElement SVG specification 1.1 for 'image' element} for
	 * more information about the HTML tag.<br/><br/>
	 * </p>
	 * 
	 * @extend sap.gantt.shape.Shape
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.shape.Image
	 */
	var Image = Shape.extend("sap.gantt.shape.Image", /** @lends sap.gantt.shape.Image.prototype */ {
		metadata: {
			properties: {
				tag: {type: "string", defaultValue: "image"},
				
				image: {type: "string"},
				x: {type: "float"},
				y: {type: "float"},
				width: {type: "float", defaultValue : 20},
				height: {type: "float", defaultValue : 20}
			}
		}
	});
	
	Image.prototype.init = function() {
		Shape.prototype.init.apply(this, arguments);
		var oRb = sap.ui.getCore().getLibraryResourceBundle("sap.gantt");
		this.setProperty("ariaLabel", oRb.getText("ARIA_IMAGE"));
	};
	
	/**
	 * Gets the value of property <code>tag</code>.
	 * 
	 * SVG tag name of the shape.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html SVG 1.1 specification for shapes}.<br/>
	 * <b>Note:</b>  We do not recommend that you change this value using a configuration or coding.
	 * 
	 * @name sap.gantt.shape.Image.prototype.getTag
	 * @function
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of property <code>tag</code>.
	 * @public
	 */
	
	/**
	 * Gets the current value of property <code>x</code>.
	 * 
	 * <p>
	 * x coordinate of the image rectangle.
	 * See {@link http://www.w3.org/TR/SVG/struct.html#ImageElementXAttribute SVG 1.1 specification for 'x' attribute of 'image'}.
	 * 
	 * Usually applications do not set this value. This getter carries out the calculation using property <code>time</code> as a base
	 * and makes some adjustments.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>x</code>.
	 * @public
	 */
	Image.prototype.getX = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("x")) {
			return this._configFirst("x", oData);
		}
		var nTimeX,
			oAxisTime = this.getAxisTime();
		
		if (Core.getConfiguration().getRTL()) {
			if (this.getIsDuration(oData, oRowInfo) === true) {
				nTimeX = oAxisTime.timeToView(Format.abapTimestampToDate(this.getEndTime(oData, oRowInfo)));
			} else {
				nTimeX = oAxisTime.timeToView(Format.abapTimestampToDate(this.getTime(oData, oRowInfo)));
			}
		} else {
			nTimeX = oAxisTime.timeToView(Format.abapTimestampToDate(this.getTime(oData, oRowInfo)));
		}
		return (nTimeX ? nTimeX : 0) - this.getWidth(oData, oRowInfo) / 2;
	};

	/**
	 * Gets the current value of property <code>y</code>.
	 * 
	 * <p>
	 * y coordinate of the image rectangle.
	 * See {@link http://www.w3.org/TR/SVG/struct.html#ImageElementYAttribute SVG 1.1 specification for 'y' attribute of 'image'}.
	 * 
	 * Usually applications do not set this value. This getter carries out the calculation using parameter  <code>oRowInfo</code> as a base
	 * and makes some adjustments to align the center of the row rectangle along the y axis. 
	 * If you override the default value calculated by the getter, the alignment of the center is not guaranteed.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>y</code>.
	 * @public
	 */
	Image.prototype.getY = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("y")) {
			return this._configFirst("y", oData);
		}

		return this.getRowYCenter(oData, oRowInfo) - this.getHeight(oData, oRowInfo) / 2;
	};
	
	/**
	 * Gets the value of property <code>image</code>.
	 * 
	 * <p>
	 * IRI reference of the image.
	 * See {@link http://www.w3.org/TR/SVG/struct.html#ImageElementHrefAttribute SVG 1.1 specification for 'xlink:href' attribute of 'image'}.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>image</code>.
	 * @public
	 */
	Image.prototype.getImage = function (oData){
		return this._configFirst("image", oData);
	};

	/**
	 * Gets the value of property <code>width</code>.
	 * 
	 * <p>
	 * Width of the image.
	 * See {@link http://www.w3.org/TR/SVG/struct.html#ImageElementWidthAttribute SVG 1.1 specification for 'width' attribute of 'image'}.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>width</code>.
	 * @public
	 */
	Image.prototype.getWidth = function (oData){
		return this._configFirst("width", oData, true);
	};
	
	/**
	 * Gets the value of property <code>height</code>.
	 * 
	 * <p>
	 * Height of the image.
	 * See {@link http://www.w3.org/TR/SVG/struct.html#ImageElementHeightAttribute SVG 1.1 specification for 'height' attribute of 'image'}.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>height</code>.
	 * @public
	 */
	Image.prototype.getHeight = function (oData){
		return this._configFirst("height", oData, true);
	};
	
	return Image;
}, true);
