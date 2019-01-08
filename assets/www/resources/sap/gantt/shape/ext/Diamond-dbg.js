/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Path"
], function (Path) {
	"use strict";
	
	/**
	 * Creates and initializes a new Diamond class.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings of the new control
	 * 
	 * @class 
	 * Diamond shape class using SVG tag 'path'. It's usually treated as transient shape.
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
	 * 	<path d="M 40 120 l 100 -70 l 100 70 l -100 70 z" class="side" />
	 * 	<path d="M 40 120 h 200 m -100 -70 v 140" class="dashside" />
	 * 	<circle cx="140" cy="120" class="center" />
	 * 	<path d="M 40 120 v 90 m 200 0 v -90 m -100 -70 h 120 m 0 140 h -120" class="dashassist" />
	 * 	<path d="M 40 210 h 200" class="arrowline" />
	 * 	<path d="M 260 50 v 140" class="arrowline" />
	 * 	<path d="M 140 50 v -20 m 0 90 h 20" class="texthyphon" />
	 * 	<text x="125" y="25" class="timeText">time</text>
	 * 	<text x="155" y="115" class="timeText">rotation</text>
	 * 	<text x="160" y="135" class="timeText">Center</text>
	 * 	<text x="70" y="205" class="propertyText">horizontalDiagonal</text>
	 * 	<text x="255" y="185" class="propertyText" transform="rotate(-90, 255, 185)">vertitalDiagonal</text>
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
	 * @alias sap.gantt.shape.ext.Diamond
	 */
	var Diamond = Path.extend("sap.gantt.shape.ext.Diamond", /** @lends sap.gantt.shape.ext.Diamond.prototype */ {
		metadata: {
			properties: {
				isClosed: {type: "boolean", defaultValue: true},

				verticalDiagonal: {type: "float", defaultValue: 12},
				horizontalDiagonal: {type: "float", defaultValue: 12}
			}
		}
	});

	Diamond.prototype.init = function() {
		var oRb = sap.ui.getCore().getLibraryResourceBundle("sap.gantt");
		this.setProperty("ariaLabel", oRb.getText("ARIA_DIAMOND"));
	};
	
	/**
	 * Gets the value of property <code>isClosed</code>.
	 * 
	 * @name sap.gantt.shape.ext.Diamond.prototype.getIsClosed
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
	 * See {@link http://www.w3.org/TR/SVG/paths.html#DAttribute SVG 1.1 specification for the 'd' attribute of 'path'}.
	 * 
	 * You application should not configure this value. Instead, the getter calculates value of d by using properties <code>horizontalDiagonal</code> and <code>verticalDiagonal</code>.
	 * The value of these properties can be retrieved using the corresponding getters (getHorizontalDiagonal and getVerticalDiagonal). 
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {string} Value of property <code>d</code> or null if the generated d is invalid according to the given data.
	 * @public
	 */
	Diamond.prototype.getD = function (oData, oRowInfo) {
		var sD;
		if (this.mShapeConfig.hasShapeProperty("d")) {
			sD = this._configFirst("d", oData);
		} else {
			var halfVertical = this.getVerticalDiagonal(oData, oRowInfo) / 2;
			var halfHorizontal = this.getHorizontalDiagonal(oData, oRowInfo) / 2;

			var aCenter = this.getRotationCenter(oData, oRowInfo);

			if (aCenter && aCenter.length === 2 && jQuery.isNumeric(halfVertical) && jQuery.isNumeric(halfHorizontal)) {
				sD = "M " + aCenter.join(" ") +
				" m " + -halfHorizontal + " 0" +
				" l " + halfHorizontal + " -" + halfVertical +
				" l " + halfHorizontal + " " + halfVertical +
				" l -" + halfHorizontal + " " + halfVertical + " z";
			}
		}

		if(this.isValid(sD)) {
			return sD;
		} else {
			jQuery.sap.log.warning("Diamond shape generated invalid d: " + sD + " from the given data: " + oData);
			return null;
		}
	};

	/**
	 * Gets the value of property <code>verticalDiagonal</code>.
	 * 
	 * <p>
	 * Vertical diagonal of a diamond shape.
	 * 
	 * This property influences property <code>d</code>.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>verticalDiagonal</code>.
	 * @public
	 */
	Diamond.prototype.getVerticalDiagonal = function (oData) {
		return this._configFirst("verticalDiagonal", oData, true);
	};

	/**
	 * Gets the value of property <code>horizontalDiagonal</code>.
	 * 
	 * <p>
	 * Horizontal diagonal of a diamond shape.
	 * 
	 * This property influences property <code>d</code>.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>horizontalDiagonal</code>.
	 * @public
	 */
	Diamond.prototype.getHorizontalDiagonal = function (oData) {
		return this._configFirst("horizontalDiagonal", oData, true);
	};

	return Diamond;
}, true);
