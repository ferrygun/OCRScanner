/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Path", "sap/gantt/misc/Utility", "sap/gantt/misc/Format", "sap/ui/core/Core"
], function (Path, Utility, Format, Core) {
	"use strict";
	
	/**
	 * Creates and initializes a new Chevron class.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings of the new control
	 * 
	 * @class 
	 * Chevron shape class using SVG tag 'path'. It's usually used to represent a duration of time.
	 * 
	 * <p>
	 * See {@link http://www.w3.org/TR/SVG/paths.html#PathElement SVG specification 1.1 for 'path' element} for
	 * detail information about the html tag.<br/><br/>
	 * The following SVG image shows how the properties are designed:<br/>
	 * <svg xmlns="http://www.w3.org/2000/svg" width="12cm" height="8.8cm" viewBox="0 0 300 220" version="1.1">
	 * 	<rect x="1" y="1" width="298" height="218" fill="none" stroke="blue" stroke-width="0.5"/>
	 * 	<defs><marker id="arrowend" viewBox="0 0 10 10" refX="10" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 0 l 10 5 l -10 5 l 4 -5 z" fill="#6d6d6d" /></marker>
	 * 	<marker id="arrowstart" viewBox="0 0 10 10" refX="0" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 5 l 10 -5 l -4 5 l 4 5 z" fill="#6d6d6d" /></marker></defs>
	 * 	<style>.side{stroke-width:2;stroke:#1C75BC;fill:none;} .dashside{stroke-width:1;stroke:#1C75BC;fill:none; stroke-dasharray:5,1;} .dashassist{stroke-width:1;stroke:#6d6d6d;fill:none; stroke-dasharray:5,1;}
	 * 	.arrowline{stroke-width:1;stroke:#6d6d6d;fill:none;marker-end:url(#arrowend);marker-start:url(#arrowstart);} .center{r:3;fill:#6d6d6d;stroke:#9E1F63;} .texthyphon{stroke-width:1;stroke:#9E1F63} .propertyText{stroke:#6d6d6d;} .timeText{stroke:#9E1F63;} </style>
	 * 	<path d="M 60 50 h 150 l 70 50 l -70 50 h -150 l 40 -50 z" class="side" />
	 * 	<path d="M 60 50 v 100" class="dashside" />
	 * 	<circle cx="60" cy="100" class="center" />
	 * 	<path d="M 60 50 h -20 m 0 100 h 20 v 20 m 40 0 v -70 m 180 0 v 70 m -70 0 v -20" class="dashassist" />
	 * 	<path d="M 40 50 v 100" class="arrowline" />
	 * 	<path d="M 60 170 h 40" class="arrowline" />
	 * 	<path d="M 210 170 h 70" class="arrowline" />
	 * 	<path d="M 60 50 v -20 m 150 0 v 20 m -130 50 h -20" class="texthyphon" />
	 * 	<text x="45" y="25" class="timeText">time</text>
	 * 	<text x="190" y="25" class="timeText">endTime</text>
	 * 	<text x="105" y="95" class="timeText">rotation</text>
	 * 	<text x="110" y="115" class="timeText">Center</text>
	 * 	<text x="35" y="125" class="propertyText" transform="rotate(-90, 35, 125)">height</text>
	 * 	<text x="60" y="190" class="propertyText">tailLength</text>
	 * 	<text x="210" y="190" class="propertyText">headLength</text>
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
	 * @alias sap.gantt.shape.ext.Chevron
	 */
	var Chevron = Path.extend("sap.gantt.shape.ext.Chevron", /** @lends sap.gantt.shape.ext.Chevron.prototype */ {
		metadata: {
			properties: {
				isClosed: {type: "boolean", defaultValue: true},
				isDuration: {type: "boolean", defaultValue: true},
				
				headLength: {type: "float", defaultValue: 5},
				tailLength: {type: "float", defaultValue: 5},
				height: {type: "float", defaultValue: 15}
			}
		}
	});

	Chevron.prototype.init = function() {
		// RTL mode
		this._isRTL = Core.getConfiguration().getRTL();
		var oRb = sap.ui.getCore().getLibraryResourceBundle("sap.gantt");
		this.setProperty("ariaLabel", oRb.getText("ARIA_CHEVRON"));
	};
	
	/**
	 * Gets the value of property <code>isClosed</code>.
	 * 
	 * @name sap.gantt.shape.ext.Chevron.prototype.getIsClosed
	 * @function
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {boolean} Value of property <code>isClosed</code>.
	 * @public
	 */
	
	/**
	 * Gets the value of property <code>isDuration</code>.
	 * 
	 * @name sap.gantt.shape.ext.Chevron.prototype.getIsDuration
	 * @function
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {boolean} Value of property <code>isDuration</code>.
	 * @public
	 */

	/**
	 * Gets the value of property <code>d</code>.
	 * 
	 * <p>
	 * d attribute of the path element.
	 * See {@link http://www.w3.org/TR/SVG/paths.html#DAttribute SVG 1.1 specification for the 'd' attribute of 'path'}.
	 * 
	 * Your application should not configure this value. Instead, the getter calculates the value of d by using property <code>time</code>, <code>endTime</code>,
	 * <code>tailLength</code>, <code>headLength</code>, and <code>height</code>.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {string} Value of property <code>d</code> or null if the generated d is invalid according to the given data.
	 * @public
	 */
	Chevron.prototype.getD = function (oData, oRowInfo) {
		var sD;
		if (this.mShapeConfig.hasShapeProperty("d")) {
			sD = this._configFirst("d", oData);
		} else {
			var nHeight = this.getHeight(oData, oRowInfo);
			
			var nHeadLength = this.getHeadLength(oData, oRowInfo),
				nTailLength = this.getTailLength(oData, oRowInfo),
				oAxisTime = this.getAxisTime();
			
			var nStartOriginalX = oAxisTime.timeToView(Format.abapTimestampToDate(
					this.getTime(oData, oRowInfo)));
			var nEndOriginalX = oAxisTime.timeToView(Format.abapTimestampToDate(
					this.getEndTime(oData, oRowInfo)));
			
			var nRowYCenter = this.getRowYCenter(oData, oRowInfo);
			
			sD = this.getDString({
				nStartOriginalX: nStartOriginalX,
				nEndOriginalX: nEndOriginalX,
				nTailLength: nTailLength,
				nHeadLength: nHeadLength,
				nHeight: nHeight,
				nRowYCenter: nRowYCenter
			});
		}
		
		if(this.isValid(sD)) {
			return sD;
		} else {
			jQuery.sap.log.warning("Chevron shape generated invalid d: " + sD + " from the given data: " + oData);
			return null;
		}
	};
	
	Chevron.prototype.getDString = function (oConf) {
		var nHalfHeight = oConf.nHeight / 2;
		
		if (this._isRTL) {
			//for RTL mode, get the axis X1
			var nBodyLength = oConf.nStartOriginalX - oConf.nEndOriginalX - oConf.nHeadLength;
			var nBodyLength = (nBodyLength > 0) ? nBodyLength : 1;
			var nX1 = (nBodyLength === 1) ? (oConf.nStartOriginalX - 1) : (oConf.nStartOriginalX - oConf.nTailLength);
			var sRetVal = "m " + nX1 + " " + oConf.nRowYCenter + " l " + oConf.nTailLength + " -" + nHalfHeight + " l -" + nBodyLength + " " +
				0 + " l -" + oConf.nHeadLength + " " + nHalfHeight + " l " + oConf.nHeadLength + " " + nHalfHeight + " l " + nBodyLength +
				" " + 0 + " z";
		} else {
			var nBodyLength = oConf.nEndOriginalX - oConf.nStartOriginalX - oConf.nHeadLength;
			var nBodyLength = (nBodyLength > 0) ? nBodyLength : 1;
			var nX1 = (nBodyLength === 1) ? (oConf.nStartOriginalX + 1) : (oConf.nStartOriginalX + oConf.nTailLength);
			var sRetVal = "m " + nX1 + " " + oConf.nRowYCenter + " l -" + oConf.nTailLength + " -" + nHalfHeight + " l " + nBodyLength + " " +
				0 + " l " + oConf.nHeadLength + " " + nHalfHeight + " l -" + oConf.nHeadLength + " " + nHalfHeight + " l -" + nBodyLength +
				" " + 0 + " z";
		}
		
		return sRetVal;
	};
	
	/**
	 * Gets the value of property <code>headLength</code>.
	 * 
	 * <p>
	 * Head length of a chevron shape.
	 * 
	 * This property influences property <code>d</code>.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>headLength</code>.
	 * @public
	 */
	Chevron.prototype.getHeadLength = function (oData) {
		return this._configFirst("headLength", oData, true);
	};
	
	/**
	 * Gets the value of property <code>tailLength</code>.
	 * 
	 * <p>
	 * Tail length of a chevron shape.
	 * 
	 * This property influences property <code>d</code>.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>tailLength</code>.
	 * @public
	 */
	Chevron.prototype.getTailLength = function (oData) {
		return this._configFirst("tailLength", oData, true);
	};
	
	/**
	 * Gets the value of property <code>height</code>.
	 * 
	 * <p>
	 * Height of a chevron shape.
	 * 
	 * This property influences property <code>d</code>.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>height</code>.
	 * @public
	 */
	Chevron.prototype.getHeight = function (oData) {
		return this._configFirst("height", oData, true);
	};
	
	return Chevron;
}, true);
