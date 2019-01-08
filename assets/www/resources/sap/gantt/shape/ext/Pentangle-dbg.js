/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Polygon", "sap/gantt/misc/Utility"
], function (Polygon, Utility) {
	"use strict";
	/**
	 * Creates and initializes a new Pentangle class.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings of the new control
	 * 
	 * @class 
	 * Pentangle shape class using SVG tag 'polygon'. It's usually treated as a transient shape.
	 * 
	 * <p>
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#PolygonElement SVG specification 1.1 for the 'polygon' element} for
	 * detail information of the html tag.<br/><br/>
	 * Following SVG image shows how the properties are designed:<br/>
	 * <svg xmlns="http://www.w3.org/2000/svg" width="12cm" height="8.8cm" viewBox="0 0 300 220" version="1.1">
	 * 	<rect x="1" y="1" width="298" height="218" fill="none" stroke="blue" stroke-width="0.5"/>
	 * 	<defs><marker id="arrowend" viewBox="0 0 10 10" refX="10" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 0 l 10 5 l -10 5 l 4 -5 z" fill="#6d6d6d" /></marker>
	 * 	<marker id="arrowstart" viewBox="0 0 10 10" refX="0" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 5 l 10 -5 l -4 5 l 4 5 z" fill="#6d6d6d" /></marker></defs>
	 * 	<style>.side{stroke-width:2;stroke:#1C75BC;fill:none;} .dashside{stroke-width:1;stroke:#1C75BC;fill:none; stroke-dasharray:5,1;} .dashassist{stroke-width:1;stroke:#6d6d6d;fill:none; stroke-dasharray:5,1;}
	 * 	.arrowline{stroke-width:1;stroke:#6d6d6d;fill:none;marker-end:url(#arrowend);marker-start:url(#arrowstart);} .center{r:3;fill:#6d6d6d;stroke:#9E1F63;} .texthyphon{stroke-width:1;stroke:#9E1F63} .propertyText{stroke:#6d6d6d;} .timeText{stroke:#9E1F63;} </style>
	 * 	<path d="M 120 50 l 23.4 49 l52.3 7.8 l -37.9 38.2 l 9 53.8 l-46.8 -25.4 l -46.7 25.4 l 8.9 -53.8 l -37.8 -38.2 l 52.2 -7.8 z" class="side" />
	 * 	<path d="M 120 50 v 125" class="dashside" />
	 * 	<circle cx="120" cy="132" class="center" />
	 * 	<path d="M 120 50 h 100 m 0 82 h -100 m 0 43 h 100" class="dashassist" />
	 * 	<path d="M 220 50 v 82" class="arrowline" />
	 * 	<path d="M 220 132 v 43" class="arrowline" />
	 * 	<path d="M 120 50 v -20 m 0 102 h -20" class="texthyphon" />
	 * 	<text x="105" y="25" class="timeText">time</text>
	 * 	<text x="20" y="130" class="timeText">rotation</text>
	 * 	<text x="25" y="150" class="timeText">Center</text>
	 * 	<text x="225" y="95" class="propertyText">radius</text>
	 * 	<text x="225" y="160" class="propertyText">radius2</text>
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
	 * @alias sap.gantt.shape.ext.Pentangle
	 */
	var Pentangle = Polygon.extend("sap.gantt.shape.ext.Pentangle", /** @lends sap.gantt.shape.ext.Pentangle.prototype */ {
		metadata: {
			properties: {
				radius: {type: "float", defaultValue: 10},
				radius2: {type: "float", defaultValue: undefined}
			}
		}
	});

	Pentangle.prototype.init = function() {
		var oRb = sap.ui.getCore().getLibraryResourceBundle("sap.gantt");
		this.setProperty("ariaLabel", oRb.getText("ARIA_PENTANGLE"));
	};

	/**
	 * Gets the value of property <code>radius</code>.
	 * 
	 * <p>
	 * Radius of a pentangle shape.
	 * 
	 * This property influences property <code>points</code>.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>radius</code>.
	 * @public
	 */
	Pentangle.prototype.getRadius = function (oData) {
		return this._configFirst("radius", oData, true);
	};
	
	/**
	 * Gets the value of property <code>radius2</code>.
	 * 
	 * <p>
	 * The second radius of a pentangle shape. If this property is not provided, radius2 is set to a value making 
	 * radius and radius2 fit the golden ratio.
	 * 
	 * This property influences property <code>points</code>.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {number} Value of property <code>radius2</code>.
	 * @public
	 */
	Pentangle.prototype.getRadius2 = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("radius2")) {
			return this._configFirst("radius2", oData, true);
		}
		
		var sDefaultRadius2 = this.getProperty("radius2");
		if (sDefaultRadius2 || sDefaultRadius2 === 0) {
			var sMode = this.mChartInstance.getSapUiSizeClass();
			return Utility.scaleBySapUiSize(sMode, sDefaultRadius2);
		} else { 
			return this.calRadius2ByGoldenRatio(this.getRadius(oData, oRowInfo));
		}
	};
	
	Pentangle.prototype.calRadius2ByGoldenRatio = function (nRadius) {
		return nRadius * Math.cos( 2 * Math.PI / 5) / Math.cos( Math.PI / 5);
	};
	
	/**
	 * Gets the value of property <code>d</code>.
	 * 
	 * <p>
	 * points attribute of the polygon element.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#PolygonElementPointsAttribute SVG 1.1 specification for 'points' attribute of 'polygon'}.
	 * 
	 * Your application should not configure this value. Instead, the getter calculates the value of d by using properties <code>radius</code> and <code>radus2</code>.
	 * The value of these properties can be retrieved using the corresponding getters (getRadius and getRadius2). 
	 * If your application overwrites the value of d by configuration or code, accurate results cannot be guaranteed.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {string} Value of property <code>points</code>.
	 * @public
	 */
	Pentangle.prototype.getPoints = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("points")) {
			return this._configFirst("points", oData);
		}

		var aCenter = this.getRotationCenter(oData, oRowInfo);
		var nRadius = this.getRadius(oData, oRowInfo);
		var nRadius2 = this.getRadius2(oData, oRowInfo);
		var aPoints = [];
		
		if (aCenter && aCenter.length === 2 && jQuery.isNumeric(nRadius) && jQuery.isNumeric(nRadius2)) {
			aPoints = this._generatePentaclePoints(aCenter, nRadius, nRadius2);
		}
		return aPoints.join("");
	};

	Pentangle.prototype._generatePentaclePoints = function (aCenter, nRadius, nRadius2) {
		var oPoint = {},
			aPoints = [],
			nAngleUnit = Math.PI / 5,
			nAngle = 0;

		for (var i = 0; i < 10; i++){
			nAngle = nAngleUnit * i;
			oPoint.x = this._getPointX(aCenter[0], (i % 2 == 0) ? nRadius : nRadius2, nAngle);
			oPoint.y = this._getPointY(aCenter[1], (i % 2 == 0) ? nRadius : nRadius2, nAngle);
			aPoints.push(" " + oPoint.x + "," + oPoint.y);
		}
		return aPoints;
	};

	Pentangle.prototype._getPointX = function (nX, nRadius, nAngle) {
		return nX + (nRadius * Math.sin(nAngle));
	};

	Pentangle.prototype._getPointY = function (nY, nRadius, nAngle) {
		return nY - (nRadius * Math.cos(nAngle));
	};

	return Pentangle;
}, true);
