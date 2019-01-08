/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Shape", "sap/gantt/misc/Utility"
], function (Shape, Utility) {
	"use strict";
	
	/**
	 * Creates and initializes a new Polyline class.
	 * 
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * Polyline shape class using SVG tag 'polyline'.
	 * 
	 * <p>
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#PolylineElement SVG specification 1.1 for 'polyline' element} for
	 * more information about the HTML tag.<br/><br/>
	 * 
	 * {@link http://www.w3.org/TR/SVG/images/shapes/polyline01.svg Sample of 'polyline' in SVG specification 1.1}:<br/>
	 * <svg width="12cm" height="4cm" viewBox="0 0 1200 400" xmlns="http://www.w3.org/2000/svg" version="1.1">
	 * <rect x="1" y="1" width="1198" height="398" fill="none" stroke="blue" stroke-width="2" />
	 * <polyline fill="none" stroke="blue" stroke-width="10" points="50,375
	 * 150,375 150,325 250,325 250,375 350,375 350,250 450,250 450,375 550,375 550,175 650,175 650,375
	 * 750,375 750,100 850,100 850,375 950,375 950,25 1050,25 1050,375 1150,375" />
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
	 * @alias sap.gantt.shape.Polyline
	 */
	var Polyline = Shape.extend("sap.gantt.shape.Polyline", /** @lends sap.gantt.shape.Polyline.prototype */ {
		metadata: {
			properties: {
				tag: {type: "string", defaultValue: "polyline"},
				fill: {type: "string", defaultValue: "none"},
				
				points: {type: "string"}
			}
		}
	});
	
	Polyline.prototype.init = function() {
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
	 * @name sap.gantt.shape.Polyline.prototype.getTag
	 * @function
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of property <code>tag</code>.
	 * @public
	 */
	
	/**
	 * Gets the value of property <code>fill</code>.
	 * 
	 * <p> 
	 * Standard SVG 'fill' attribute.
	 * See {@link http://www.w3.org/TR/SVG/painting.html#FillProperty SVG 1.1 specification for 'fill'}.
	 * <b>Note:</b> The HTML color and URL reference to an SVG definition can be provided to fill. SVG definitions usually come from SVG definitions rendered by
	 * {@link sap.gantt.GanttChartContainer}, {@link sap.gantt.GanttChartWithTable}, or {@link sap.gantt.GanttChart}.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of property <code>fill</code>.
	 * @public
	 */
	
	/**
	 * Gets the value of property <code>points</code>.
	 * 
	 * <p>
	 * points attribute of the polygon shape.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html#PolylineElementPointsAttribute SVG 1.1 specification for 'points' attribute of 'polyline'}.
	 * This shape provides a default implementation of points:<br/>
	 * <svg width="12cm" height="4cm" viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg" version="1.1">
	 * 	<defs><marker id="arrowend" viewBox="0 0 10 10" refX="10" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 0 l 10 5 l -10 5 l 4 -5 z" fill="#6d6d6d" /></marker>
	 * 	<marker id="arrowstart" viewBox="0 0 10 10" refX="0" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 5 l 10 -5 l -4 5 l 4 5 z" fill="#6d6d6d" /></marker></defs>
	 * 	<style>.side{stroke-width:2;stroke:#1C75BC;fill:none;} .dashside{stroke-width:1;stroke:#1C75BC;fill:none; stroke-dasharray:5,1;} .dashassist{stroke-width:1;stroke:#6d6d6d;fill:none; stroke-dasharray:5,1;}
	 * 	.arrowline{stroke-width:1;stroke:#6d6d6d;fill:none;marker-end:url(#arrowend);marker-start:url(#arrowstart);} .center{r:3;fill:#6d6d6d;stroke:#9E1F63;} .texthyphon{stroke-width:1;stroke:#9E1F63;fill:none} .propertyText{stroke:#6d6d6d;} .timeText{stroke:#9E1F63;} </style>
	 * 	<rect x="1" y="1" width="298" height="98" fill="none" stroke="blue" stroke-width="0.5"/>
	 * 	<polyline points="120,50 140,50 150,30 154,74 160,50 180,50" class="side" />
	 * 	<circle cx="120" cy="50" class="center" />
	 * 	<path d="M 120,30 v 20 h -20" class="texthyphon" />
	 * 	<text x="105" y="20" class="timeText">time</text>
	 * 	<text x="25" y="50" class="timeText">rotation</text>
	 * 	<text x="30" y="70" class="timeText">Center</text>
	 * </svg>
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of property <code>points</code>.
	 * @public
	 */
	Polyline.prototype.getPoints = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("points")) {
			return this._configFirst("points", oData);
		}

		// default polyline.
		var aCenter = this.getRotationCenter(oData, oRowInfo),
			aRetVal = [];
		var sMode = this.mChartInstance.getSapUiSizeClass();

		if (aCenter && aCenter.length === 2) {
			aRetVal.push([aCenter[0] - 15, aCenter[1]].join(","));
			aRetVal.push([aCenter[0] - 10, aCenter[1]].join(","));
			aRetVal.push([aCenter[0] - 5, aCenter[1] - Utility.scaleBySapUiSize(sMode, 7.5)].join(","));
			aRetVal.push([aCenter[0] + 5, aCenter[1] + Utility.scaleBySapUiSize(sMode, 7.5)].join(","));
			aRetVal.push([aCenter[0] + 10, aCenter[1]].join(","));
			aRetVal.push([aCenter[0] + 15, aCenter[1]].join(","));
		}

		return aRetVal.join(" ");
	};

	Polyline.prototype.getStyle = function(oData, oRowInfo) {
		var sInheritedStyle = Shape.prototype.getStyle.apply(this, arguments);
		var oStyles = {
			"fill": this.determineValueColor(this.getFill(oData, oRowInfo)),
			"fill-opacity": this.getFillOpacity(oData, oRowInfo)
		};
		return sInheritedStyle + this.getInlineStyle(oStyles);
	};
	return Polyline;
}, true);
