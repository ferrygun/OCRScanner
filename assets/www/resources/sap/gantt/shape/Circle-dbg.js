/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Shape"
], function (Shape) {
	"use strict";
	
	/**
	 * Creates and initializes a new Circle class.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * Circle shape class using SVG tag 'circle'. This shape is usually used to represent points in time.
	 * 
	 * <p>
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#CircleElement SVG specification 1.1 for 'circle' element} for
	 * more information about the HTML tag.<br/><br/>
	 * {@link http://www.w3.org/TR/SVG/images/shapes/circle01.svg Circle samples in SVG specification 1.1}:<br/>
	 * <svg width="12cm" height="4cm" viewBox="0 0 1200 400" xmlns="http://www.w3.org/2000/svg" version="1.1">
	 * <rect x="1" y="1" width="1198" height="398" fill="none" stroke="blue" stroke-width="2"/>
	 * <circle cx="600" cy="200" r="100" fill="red" stroke="blue" stroke-width="10" />
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
	 * @alias sap.gantt.shape.Circle
	 */
	var Circle = Shape.extend("sap.gantt.shape.Circle", /** @lends sap.gantt.shape.Circle.prototype */ {
		metadata: {
			properties: {
				tag: {type: "string", defaultValue: "circle"},
				
				cx: {type: "float"},
				cy: {type: "float"},
				r: {type: "float", defaultValue: 5}
			}
		}
	});
	
	Circle.prototype.init = function() {
		Shape.prototype.init.apply(this, arguments);
		var oRb = sap.ui.getCore().getLibraryResourceBundle("sap.gantt");
		this.setProperty("ariaLabel", oRb.getText("ARIA_CIRCLE"));
	};
	
	/**
	 * Gets the value of property <code>tag</code>.
	 * 
	 * SVG tag name of the shape.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html SVG 1.1 specification for shapes}.<br/>
	 * <b>Note:</b> We do not recommend that you change this value using a configuration or coding.
	 * 
	 * @name sap.gantt.shape.Circle.prototype.getTag
	 * @function
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of property <code>tag</code>.
	 * @public
	 */
	
	/**
	 * Gets the value of property <code>cx</code>.
	 * 
	 * <p>
	 * x coordinate of the center of the circle.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#CircleElementCXAttribute SVG 1.1 specification for 'cx' attribute of 'circle'}.
	 * 
	 * Usually applications do not set this value. This getter carries out the calculation using the <code>time</code> property 
	 * as a base and makes some adjustments.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>cx</code>.
	 * @public
	 */
	Circle.prototype.getCx = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("cx")) {
			return this._configFirst("cx", oData);
		}
		
		return this.getRotationCenter(oData, oRowInfo)[0];
	};
	
	/**
	 * Gets the current value of property <code>cy</code>.
	 * 
	 * <p>
	 * y coordinate of the center of the circle.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#CircleElementCYAttribute SVG 1.1 specification for 'cy' attribute of 'circle'}.
	 * 
	 * Usually applications do not set this value. This getter carries out the calculation using parameter <code>oRowInfo</code> as a base
	 * and makes some adjustments to align the center of the row rectangle along the y axis. 
	 * If you override the default value calculated by the getter, the alignment of the center is not guaranteed.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>cy</code>.
	 * @public
	 */
	Circle.prototype.getCy = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("cy")) {
			return this._configFirst("cy", oData);
		}
		
		return this.getRowYCenter(oData, oRowInfo);
	};
	
	/**
	 * Gets the value of property <code>r</code>.
	 * 
	 * <p>
	 * Radius of the circle.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#CircleElementRAttribute SVG 1.1 specification for 'r' attribute of 'circle'}.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>r</code>.
	 * @public
	 */
	Circle.prototype.getR = function (oData) {
		return this._configFirst("r", oData, true);
	};

	Circle.prototype.getStyle = function(oData, oRowInfo) {
		var sInheritedStyle = Shape.prototype.getStyle.apply(this, arguments);
		var oStyles = {
			"fill": this.determineValueColor(this.getFill(oData, oRowInfo)),
			"fill-opacity": this.getFillOpacity(oData, oRowInfo)
		};
		return sInheritedStyle + this.getInlineStyle(oStyles);
	};
	return Circle;
}, true);
