/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Path"
], function (Path) {
	"use strict";
	
	/**
	 * Creates and initializes a new Cursor class.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings of the new control
	 * 
	 * @class 
	 * Cursor shape class using SVG tag 'path'. It's usually treated as a transient shape.
	 * 
	 * <p>
	 * See {@link http://www.w3.org/TR/SVG/paths.html#PathElement SVG specification 1.1 for the 'path' element} for
	 * detail information of the html tag.<br/><br/>
	 * The following SVG image shows how the properties are designed:<br/>
	 * <svg xmlns="http://www.w3.org/2000/svg" width="12cm" height="8.8cm" viewBox="0 0 300 220" version="1.1">
	 * 	<rect x="1" y="1" width="298" height="218" fill="none" stroke="blue" stroke-width="0.5"/>
	 * 	<defs><marker id="arrowend" viewBox="0 0 10 10" refX="10" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 0 l 10 5 l -10 5 l 4 -5 z" fill="#6d6d6d" /></marker>
	 * 	<marker id="arrowstart" viewBox="0 0 10 10" refX="0" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 5 l 10 -5 l -4 5 l 4 5 z" fill="#6d6d6d" /></marker></defs>
	 * 	<style>.side{stroke-width:2;stroke:#1C75BC;fill:none;} .dashside{stroke-width:1;stroke:#1C75BC;fill:none; stroke-dasharray:5,1;} .dashassist{stroke-width:1;stroke:#6d6d6d;fill:none; stroke-dasharray:5,1;}
	 * 	.arrowline{stroke-width:1;stroke:#6d6d6d;fill:none;marker-end:url(#arrowend);marker-start:url(#arrowstart);} .center{r:3;fill:#6d6d6d;stroke:#9E1F63;} .texthyphon{stroke-width:1;stroke:#9E1F63} .propertyText{stroke:#6d6d6d;} .timeText{stroke:#9E1F63;} </style>
	 * 	<path d="M 100 50 v 80 l 70 40 l 70 -40 v -80 z" class="side" />
	 * 	<path d="M 170 50 v 120" class="dashside" />
	 * 	<circle cx="170" cy="110" class="center" />
	 * 	<path d="M 240 50 v -20 m -140 0 v 20 h -20 m 20 80 h -20 m 0 40 h 90" class="dashassist" />
	 * 	<path d="M 100 30 h 140" class="arrowline" />
	 * 	<path d="M 80 50 v 80" class="arrowline" />
	 * 	<path d="M 80 130 v 40" class="arrowline" />
	 * 	<path d="M 190 110 h -20 m 0 60 v 20" class="texthyphon" />
	 * 	<text x="155" y="205" class="timeText">time</text>
	 * 	<text x="175" y="105" class="timeText">rotation</text>
	 * 	<text x="180" y="125" class="timeText">Center</text>
	 * 	<text x="150" y="45" class="propertyText">length</text>
	 * 	<text x="35" y="100" class="propertyText">width</text>
	 * 	<text x="35" y="145" class="propertyText">point</text>
	 * 	<text x="25" y="165" class="propertyText">Height</text>
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
	 * @alias sap.gantt.shape.ext.Cursor
	 */
	var Cursor = Path.extend("sap.gantt.shape.ext.Cursor", /** @lends sap.gantt.shape.ext.Cursor.prototype */ {
		metadata: {
			properties: {
				isClosed: {type: "boolean", defaultValue: true},

				length: {type: "float", defaultValue: 10},
				width: {type: "float", defaultValue: 5},
				pointHeight: {type: "float", defaultValue: 5}
			}
		}
	});

	Cursor.prototype.init = function() {
		var oRb = sap.ui.getCore().getLibraryResourceBundle("sap.gantt");
		this.setProperty("ariaLabel", oRb.getText("ARIA_CURSOR"));
	};
	
	/**
	 * Gets the value of property <code>isClosed</code>.
	 * 
	 * @name sap.gantt.shape.ext.Cursor.prototype.getIsClosed
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
	 * d attribute of the path element.
	 * See {@link http://www.w3.org/TR/SVG/paths.html#DAttribute SVG 1.1 specification for 'd' attribute of 'path'}.
	 * 
	 * Your application should not configure this value. Instead, the getter calculates the value of d by using properties <code>length</code>, 
	 * <code>width</code>, and <code>pointHeight</code>.
	 * The value of these properties can be retrieved using the corresponding getters (getLength, getWidth, and getPointHeight). 
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {string} Value of property <code>d</code> or null if the generated d is invalid according to the given data.
	 * @public
	 */
	Cursor.prototype.getD = function (oData, oRowInfo) {
		var sD;
		if (this.mShapeConfig.hasShapeProperty("d")) {
			sD = this._configFirst("d", oData);
		} else {
			var nPointHeight = this.getPointHeight(oData, oRowInfo);
			var nWidth = this.getWidth(oData, oRowInfo);
			var nLength = this.getLength(oData, oRowInfo);
			var nHalflength = nLength / 2;

			var aCenter = this.getRotationCenter(oData, oRowInfo);

			if (aCenter && aCenter.length === 2 && jQuery.isNumeric(nPointHeight) && jQuery.isNumeric(nWidth) &&
					jQuery.isNumeric(nLength) && jQuery.isNumeric(nHalflength)) {
				sD = "M " + aCenter.join(" ") +
				" m " + -nHalflength + " " + -(nWidth + nPointHeight) / 2 +
				" l " + nLength + " 0 l 0 " + nWidth + " l -" + nHalflength +
				" " + nPointHeight + " l -" + nHalflength + " -" + nPointHeight + " z";
			}
		}

		if(this.isValid(sD)) {
			return sD;
		} else {
			jQuery.sap.log.warning("Cursor shape generated invalid d: " + sD + " from the given data: " + oData);
			return null;
		}
	};
	
	/**
	 * Gets the value of property <code>length</code>.
	 * 
	 * <p>
	 * Length of a cursor.
	 * 
	 * This property influences property <code>d</code>.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>length</code>.
	 * @public
	 */
	Cursor.prototype.getLength = function (oData) {
		return this._configFirst("length", oData, true);
	};
	
	/**
	 * Gets the value of property <code>width</code>.
	 * 
	 * <p>
	 * Width of a cursor.
	 * 
	 * This property influences property <code>d</code>.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>width</code>.
	 * @public
	 */
	Cursor.prototype.getWidth = function (oData) {
		return this._configFirst("width", oData, true);
	};
	
	/**
	 * Gets the value of property <code>pointHeight</code>.
	 * 
	 * <p>
	 * Point height of a cursor.
	 * 
	 * This property influences property <code>d</code>.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>pointHeight</code>.
	 * @public
	 */
	Cursor.prototype.getPointHeight = function (oData) {
		return this._configFirst("pointHeight", oData, true);
	};
	
	return Cursor;
}, true);
