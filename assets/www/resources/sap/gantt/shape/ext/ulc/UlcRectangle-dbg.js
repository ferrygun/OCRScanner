/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Rectangle"
], function(Rectangle){
	"use strict";

	/**
	 * Creates and initializes a fragment of the Utilization Line Chart.
	 * 
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings of the new control
	 * 
	 * @class 
	 * Base class for {@link sap.gantt.shape.ext.ulc.UlcOverCapacityZoneRectangle}, {@link sap.gantt.shape.ext.ulc.UlcOverClipRectangle},
	 * {@link sap.gantt.shape.ext.ulc.UlcUnderClipRectangle}, {@link sap.gantt.shape.ext.ulc.UlcTooltipRectangle}.
	 * 
	 * <p>This base class defines a number of shared methods. 
	 * </p>
	 * 
	 * @extends sap.gantt.shape.Rectangle
	 * @abstract
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.shape.ext.ulc.UlcRectangle
	 */
	var UlcRectangle = Rectangle.extend("sap.gantt.shape.ext.ulc.UlcRectangle", /** @lends sap.gantt.shape.ext.ulc.UlcRectangle.prototype */ {
		metadata: {
			"abstract": true
		}
	});

	/**
	 * Get fill value for UlcRectangle, return `transparent` as default value
	 * 
	 * @return {string} fill rectangle fill value
	 */
	UlcRectangle.prototype.getFill = function() {
		return Rectangle.prototype.getFill.apply(this, arguments) || "transparent";
	};

	/**
	 * Gets the value of property <code>x</code>.
	 * 
	 * <p>
	 * x coordinate of the rectangle left-top point.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#RectElementXAttribute SVG 1.1 specification for the 'x' attribute of 'rect'}.
	 * 
	 * Usually an application does not configure this value. Instead, the getter calculates the value of x by using the view boundary for the visible area in a Gantt Chart.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>x</code>.
	 * @public
	 */
	UlcRectangle.prototype.getX = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("x")){
			return this._configFirst("x", oData);
		}
		
		var aViewRange = this.getShapeViewBoundary();
		if (aViewRange){
			return aViewRange[0];
		}
		return 0;
	};

	/**
	 * Gets the value of property <code>y</code>.
	 * 
	 * <p>
	 * y coordinate of a rectangle left-top point.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#RectElementYAttribute SVG 1.1 specification for 'y' attribute of 'rect'}.
	 * 
	 * Usually application does not configure this value. Instead getter calculates the value of y using parameter <code>oRowInfo</code>.
	 * </p>
	 * <p>The default value is y coordinate of the top-left point of the row.</p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>y</code>.
	 * @public
	 */
	UlcRectangle.prototype.getY = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("y")){
			return this._configFirst("y", oData);
		}
		
		return oRowInfo.y;
	};

	/**
	 * Gets the value of property <code>width</code>.
	 * 
	 * <p>
	 * Width of the rectangle.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#RectElementWidthAttribute SVG 1.1 specification for the 'width' attribute of 'rect'}.
	 * 
	 * Usually an application does not configure this value. Instead, the getter calculates the value of width by using the view boundary for the visible area in a Gantt Chart.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>width</code>.
	 * @public
	 */
	UlcRectangle.prototype.getWidth = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("width")){
			return this._configFirst("width", oData);
		}
		
		var aViewRange = this.getShapeViewBoundary();
		if (aViewRange){
			return aViewRange[1] - aViewRange[0];
		}
		return 0;
	};

	/**
	 * Gets the value of property <code>height</code>.
	 * 
	 * <p>
	 * Height of the rectangle.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#RectElementHeightAttribute SVG 1.1 specification for the 'height' attribute of 'rect'}.
	 * The default value of height is calculated by the over capacity rectangle.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>height</code>.
	 * @public
	 */
	UlcRectangle.prototype.getHeight = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("height")){
			return this._configFirst("height", oData);
		}
		
		var maxVisibleRatio = 25;
		if (this.mShapeConfig.hasShapeProperty("maxVisibleRatio")){
			maxVisibleRatio = this._configFirst("maxVisibleRatio", oData);
		}
		return oRowInfo.rowHeight  * maxVisibleRatio / (100 + maxVisibleRatio);
	};

	return UlcRectangle;
}, true);
