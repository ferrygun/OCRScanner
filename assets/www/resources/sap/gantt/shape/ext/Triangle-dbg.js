/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Path"
], function (Path) {
	"use strict";
	
	/**
	 * Creates and initializes a new Triangle class.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings of the new control
	 * 
	 * @class 
	 * Triangle shape class using SVG tag 'path'. It's usually treated as a transient shape.
	 * 
	 * <p>
	 * See {@link http://www.w3.org/TR/SVG/paths.html#PathElement SVG specification 1.1 for the 'path' element} for
	 * detail information of the html tag.<br/><br/>
	 * The following image shows how the properties are designed:<br/>
	 * <svg xmlns="http://www.w3.org/2000/svg" width="12cm" height="8.8cm" viewBox="0 0 300 220" version="1.1">
	 * 	<rect x="1" y="1" width="298" height="218" fill="none" stroke="blue" stroke-width="0.5"/>
	 * 	<defs><marker id="arrowend" viewBox="0 0 10 10" refX="10" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 0 l 10 5 l -10 5 l 4 -5 z" fill="#6d6d6d" /></marker>
	 * 	<marker id="arrowstart" viewBox="0 0 10 10" refX="0" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 5 l 10 -5 l -4 5 l 4 5 z" fill="#6d6d6d" /></marker></defs>
	 * 	<style>.side{stroke-width:2;stroke:#1C75BC;fill:none;} .dashside{stroke-width:1;stroke:#1C75BC;fill:none; stroke-dasharray:5,1;} .dashassist{stroke-width:1;stroke:#6d6d6d;fill:none; stroke-dasharray:5,1;}
	 * 	.arrowline{stroke-width:1;stroke:#6d6d6d;fill:none;marker-end:url(#arrowend);marker-start:url(#arrowstart);} .center{r:3;fill:#6d6d6d;stroke:#9E1F63;} .texthyphon{stroke-width:1;stroke:#9E1F63} .propertyText{stroke:#6d6d6d;} .timeText{stroke:#9E1F63;} </style>
	 * 	<path d="M 200 50 l -150 100 l 180 0 z" class="side" />
	 * 	<path d="M 200 50 v 100" class="dashside" />
	 * 	<circle cx="200" cy="100" class="center" />
	 * 	<path d="M 200 50 h -170 m 0 100 h 20 v 40 m 180 0 v -40 m -30 0 v 20" class="dashassist" />
	 * 	<path d="M 30 50 v 100" class="arrowline" />
	 * 	<path d="M 50 170 h 150" class="arrowline" />
	 * 	<path d="M 50 190 h 180" class="arrowline" />
	 * 	<path d="M 200 50 v -20 m 0 70 h 20" class="texthyphon" />
	 * 	<text x="185" y="25" class="timeText">time</text>
	 * 	<text x="225" y="95" class="timeText">rotation</text>
	 * 	<text x="230" y="114" class="timeText">Center</text>
	 * 	<text x="35" y="100" class="propertyText">height</text>
	 * 	<text x="55" y="165" class="propertyText">distanceOfyAxisHeight</text>
	 * 	<text x="100" y="185" class="propertyText">base</text>
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
	 * @alias sap.gantt.shape.ext.Triangle
	 */
	var Triangle = Path.extend("sap.gantt.shape.ext.Triangle", /** @lends sap.gantt.shape.ext.Triangle.prototype */ {
		metadata: {
			properties: {
				isClosed: {type: "boolean", defaultValue: true},

				base: {type: "float", defaultValue: 10},
				height: {type: "float", defaultValue: 10},
				distanceOfyAxisHeight: {type: "float", defaultValue: 5}
			}
		}
	});
	
	Triangle.prototype.init = function() {
		var oRb = sap.ui.getCore().getLibraryResourceBundle("sap.gantt");
		this.setProperty("ariaLabel", oRb.getText("ARIA_TRIANGLE"));
	};
	
	/**
	 * Gets the value of property <code>isClosed</code>.
	 * 
	 * @name sap.gantt.shape.ext.Triangle.prototype.getIsClosed
	 * @function
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {boolean} Value of property <code>isClosed</code>.
	 * @public
	 */
	
	/**
	 * Gets the value of property <code>d</code>.
	 * 
	 * <p>
	 * d attribute of path element.
	 * See {@link http://www.w3.org/TR/SVG/paths.html#DAttribute SVG 1.1 specification for 'd' attribute of 'path'}.
	 * 
	 * Your application should not configure this value. Instead, the getter calculates the value of d by using properties <code>time</code>, <code>base</code>, <code>height</code>, 
	 * and <code>distanceOfyAxisHeight</code>. The value of these properties can be retrieved from the corresponding getters (getTime, getBase, getHeight, and getDistanceOfyAxisHeight).
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {string} Value of property <code>d</code> or null if the generated d is invalid according to the given data.
	 * @public
	 */
	Triangle.prototype.getD = function (oData, oRowInfo) {
		var sD;
		if (this.mShapeConfig.hasShapeProperty("d")) {
			sD = this._configFirst("d", oData);
		} else {
			var nBase = this.getBase(oData, oRowInfo);
			var nHeight = this.getHeight(oData, oRowInfo);
			var nDisOfYaxisH = this.getDistanceOfyAxisHeight(oData, oRowInfo);
			var nHalfHeight = this.getHeight(oData, oRowInfo) / 2;

			var aCenter = this.getRotationCenter(oData, oRowInfo);

			if (aCenter && aCenter.length === 2 && jQuery.isNumeric(nBase) && jQuery.isNumeric(nHeight) &&
					jQuery.isNumeric(nDisOfYaxisH) && jQuery.isNumeric(nHalfHeight)) {
				sD = "M " + aCenter.join(" ") +
				" m 0 " + nHalfHeight +
				" l -" + nDisOfYaxisH + " 0 l " + nDisOfYaxisH +
				" -" + nHeight + " l " + Number(nBase - nDisOfYaxisH) + " " + nHeight + " l -" +
				Number(nBase - nDisOfYaxisH) + " 0 z";
			}
		}

		if(this.isValid(sD)) {
			return sD;
		} else {
			jQuery.sap.log.warning("Triangle shape generated invalid d: " + sD + " from the given data: " + oData);
			return null;
		}
	};

	/**
	 * Gets the value of property <code>base</code>.
	 * 
	 * <p>
	 * Base side of a triangle.
	 * 
	 * This property influences property <code>d</code>.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>base</code>.
	 * @public
	 */
	Triangle.prototype.getBase = function (oData) {
		return this._configFirst("base", oData, true);
	};

	/**
	 * Gets the value of property <code>height</code>.
	 * 
	 * <p>
	 * Height of a triangle.
	 * 
	 * This property influences property <code>d</code>.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>height</code>.
	 * @public
	 */
	Triangle.prototype.getHeight = function (oData) {
		return this._configFirst("height", oData, true);
	};

	/**
	 * Gets the value of property <code>distanceOfyAxisHeight</code>.
	 * 
	 * <p>
	 * distanceOfyAxisHeight of a triangle, which refers to the distance between the left point to the altitude of the triangle.
	 * 
	 * This property influences property <code>d</code>.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>distanceOfyAxisHeight</code>.
	 * @public
	 */
	Triangle.prototype.getDistanceOfyAxisHeight = function (oData) {
		return this._configFirst("distanceOfyAxisHeight", oData, true);
	};

	return Triangle;
}, true);
