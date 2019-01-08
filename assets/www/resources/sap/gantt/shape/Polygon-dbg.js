/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Shape", "sap/gantt/misc/Utility"
], function (Shape, Utility) {
	"use strict";
	
	/**
	 * Creates and initializes a new Polygon class.
	 * 
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * Polygon shape class using SVG tag 'polygon'.
	 * 
	 * <p>
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#PolygonElement SVG specification 1.1 for 'polygon' element} for
	 * more information about the HTML tag.<br/><br/>
	 * 
	 * {@link http://www.w3.org/TR/SVG/images/shapes/polygon01.svg Sample of 'polygon' in SVG specification 1.1}:<br/>
	 * <svg width="12cm" height="4cm" viewBox="0 0 1200 400" xmlns="http://www.w3.org/2000/svg" version="1.1">
	 * <rect x="1" y="1" width="1198" height="398" fill="none" stroke="blue" stroke-width="2" />
	 * <polygon fill="red" stroke="blue" stroke-width="10" points="350,75  379,161 469,161 397,215 423,301 350,250 277,301 303,215 231,161 321,161" />
	 * <polygon fill="lime" stroke="blue" stroke-width="10" points="850,75  958,137.5 958,262.5 850,325 742,262.6 742,137.5" />
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
	 * @alias sap.gantt.shape.Polygon
	 */
	var Polygon = Shape.extend("sap.gantt.shape.Polygon", /** @lends sap.gantt.shape.Polygon.prototype */ {
		metadata: {
			properties: {
				tag: {type: "string", defaultValue: "polygon"},
				
				points: {type: "string"}
			}
		}
	});

	Polygon.prototype.init = function() {
		Shape.prototype.init.apply(this, arguments);
		var oRb = sap.ui.getCore().getLibraryResourceBundle("sap.gantt");
		this.setProperty("ariaLabel", oRb.getText("ARIA_POLYGON"));
	};
	
	/**
	 * Gets the value of property <code>tag</code>.
	 * 
	 * SVG tag name of the shape.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html SVG 1.1 specification for shapes}.<br/>
	 * <b>Note:</b> We do not recommend that you change this value using a configuration or coding.
	 * 
	 * @name sap.gantt.shape.Polygon.prototype.getTag
	 * @function
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of property <code>tag</code>.
	 * @public
	 */
	
	/**
	 * Gets the value of property <code>points</code>.
	 * 
	 * <p>
	 * Points attribute of the polygon element.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#PolygonElementPointsAttribute SVG 1.1 specification for 'points' attribute of 'polygon'}.
	 * Rich extension of paths is provided in namespace <code>sap.gantt.shape.ext</code>.<br/>
	 * This shape provides a default implementation of points:<br/>
	 * <svg width="12cm" height="4cm" viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg" version="1.1">
	 * 	<defs><marker id="arrowend" viewBox="0 0 10 10" refX="10" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 0 l 10 5 l -10 5 l 4 -5 z" fill="#6d6d6d" /></marker>
	 * 	<marker id="arrowstart" viewBox="0 0 10 10" refX="0" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 5 l 10 -5 l -4 5 l 4 5 z" fill="#6d6d6d" /></marker></defs>
	 * 	<style>.side{stroke-width:2;stroke:#1C75BC;fill:none;} .dashside{stroke-width:1;stroke:#1C75BC;fill:none; stroke-dasharray:5,1;} .dashassist{stroke-width:1;stroke:#6d6d6d;fill:none; stroke-dasharray:5,1;}
	 * 	.arrowline{stroke-width:1;stroke:#6d6d6d;fill:none;marker-end:url(#arrowend);marker-start:url(#arrowstart);} .center{r:3;fill:#6d6d6d;stroke:#9E1F63;} .texthyphon{stroke-width:1;stroke:#9E1F63;fill:none} .propertyText{stroke:#6d6d6d;} .timeText{stroke:#9E1F63;} </style>
	 * 	<rect x="1" y="1" width="298" height="98" fill="none" stroke="blue" stroke-width="0.5"/>
	 * 	<polygon points="115.4,30 150,10 184.6,30 184.6,70 150,90 115.4,70" class="side" />
	 * 	<circle cx="150" cy="50" class="center" />
	 * 	<path d="M 150,30 v 20 h 20" class="texthyphon" />
	 * 	<text x="135" y="20" class="timeText">time</text>
	 * 	<text x="190" y="50" class="timeText">rotation</text>
	 * 	<text x="200" y="70" class="timeText">Center</text>
	 * </svg>
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of property <code>points</code>.
	 * @public
	 */
	Polygon.prototype.getPoints = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("points")) {
			return this._configFirst("points", oData);
		}

		// default polygon is a regular hexagon.
		var sMode = this.mChartInstance.getSapUiSizeClass();
		var aCenter = this.getRotationCenter(oData, oRowInfo),
			nXian = Utility.scaleBySapUiSize(sMode, 8),
			nGou = Utility.scaleBySapUiSize(sMode, 4),
			nGu = Utility.scaleBySapUiSize(sMode, 4 * Math.sqrt(3)),
			aRetVal = [];

		if (aCenter && aCenter.length === 2 && jQuery.isNumeric(nXian) && jQuery.isNumeric(nGou) &&
				jQuery.isNumeric(nGu)) {
			aRetVal.push([aCenter[0] - nGu, aCenter[1] - nGou].join(","));
			aRetVal.push([aCenter[0], aCenter[1] - nXian].join(","));
			aRetVal.push([aCenter[0] + nGu, aCenter[1] - nGou].join(","));
			aRetVal.push([aCenter[0] + nGu, aCenter[1] + nGou].join(","));
			aRetVal.push([aCenter[0], aCenter[1] + nXian].join(","));
			aRetVal.push([aCenter[0] - nGu, aCenter[1] + nGou].join(","));
		}

		return aRetVal.join(" ");
	};

	Polygon.prototype.getStyle = function(oData, oRowInfo) {
		var sInheritedStyle = Shape.prototype.getStyle.apply(this, arguments);
		var oStyles = {
			"fill": this.determineValueColor(this.getFill(oData, oRowInfo)),
			"fill-opacity": this.getFillOpacity(oData, oRowInfo)
		};
		return sInheritedStyle + this.getInlineStyle(oStyles);
	};
	return Polygon;
}, true);
