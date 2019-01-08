/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"./PatternBase"
], function (PatternBase) {
	"use strict";

	/**
	 * Creates and initializes a slash pattern defined for later reuse.
	 * 
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 * 
	 * @class 
	 * Slash pattern defined by a path. Stroke color and stroke width of the path can be changed by corresponding properties.
	 * 
	 * <p>
	 * <svg xmlns="http://www.w3.org/2000/svg" width="12cm" height="8.8cm" viewBox="0 0 300 220" version="1.1">
	 * <defs><marker id="arrowend" viewBox="0 0 10 10" refX="10" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 0 l 10 5 l -10 5 l 4 -5 z" fill="#6d6d6d" /></marker>
	 * 	<marker id="arrowstart" viewBox="0 0 10 10" refX="0" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 5 l 10 -5 l -4 5 l 4 5 z" fill="#6d6d6d" /></marker></defs>
	 * 	<style>.side{stroke-width:2;stroke:#1C75BC;fill:none;} .dashside{stroke-width:1;stroke:#1C75BC;fill:none; stroke-dasharray:5,1;} .dashassist{stroke-width:1;stroke:#6d6d6d;fill:none; stroke-dasharray:5,1;}
	 * 	.arrowline{stroke-width:1;stroke:#6d6d6d;fill:none;marker-end:url(#arrowend);marker-start:url(#arrowstart);} .center{r:3;fill:#6d6d6d;stroke:#9E1F63;} .texthyphon{stroke-width:1;stroke:#9E1F63;fill:none} .propertyText{stroke:#6d6d6d;} .timeText{stroke:#9E1F63;} </style>
	 * 	<rect x="1" y="1" width="298" height="218" fill="none" stroke="blue" stroke-width="0.5"/>
	 * 	<defs><pattern class="pattern" id="p1" patternUnits="userSpaceOnUse" x="0" y="0" width="4" height="4"><rect x="0" width="4" height="4" fill="#e2e2e2"></rect><path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2 " stroke="#9E1F63" stroke-width="1"></path></pattern>
	 * 	<pattern class="pattern" id="p2" patternUnits="userSpaceOnUse" x="0" y="0" width="8" height="8"><rect x="0" width="8" height="8" fill="#fff"></rect><path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4 " stroke="#6d6d6d" stroke-width="2"></path></pattern>
	 * 	<pattern class="pattern" id="p3" patternUnits="userSpaceOnUse" x="70" y="85" width="100" height="100"><rect x="0" width="100" height="100" fill="#e2e2e2"></rect><path d="M-25,25 l50,-50 M0,100 l100,-100 M75,125 l50,-50" stroke="#1C75BC" stroke-width="30"></path></pattern></defs>
	 * 	<rect fill="url(#p1)" x="60" y="20" width="80" height="20" />
	 * 	<circle fill="url(#p2)" cx="180" cy="25" r="10" /> <circle fill="url(#p2)" cx="200" cy="30" r="15" />
	 * 	<text x="50" y="75" class="timeText">Tile Detail:</text>
	 * 	<rect fill="url(#p3)" x="70" y="85" width="100" height="100" />
	 * 	<path d="M 70 85 h 100 v 100 h -100 z" class="dashside" />
	 * 	<path d="M 70 85 h -20 m 0 100 h 20 v 20 m 100 0 v -20 m -7 -10 h 20 m 0 -45 h -20 m 7 -25 l 20 -20 m -21 -19 l -20 20" class="dashassist" />
	 * 	<path d="M 50 85 v 100" class="arrowline" />
	 * 	<path d="M 70 205 h 100" class="arrowline" />
	 * 	<path d="M 165 70 l 20 20" class="arrowline" />
	 * 	<text x="65" y="175" class="propertyText" transform="rotate(-90, 65 175)">tileHeight</text>
	 * 	<text x="80" y="200" class="propertyText">tileWidth</text>
	 * 	<text x="185" y="125" class="propertyText">background</text>
	 * 	<text x="185" y="145" class="propertyText">Color</text>
	 * 	<text x="185" y="180" class="propertyText">strokeColor</text>
	 * 	<text x="180" y="75" class="propertyText">strokeWidth</text>
	 * </svg>
	 * </p>
	 * 
	 * @extends sap.gantt.def.pattern.PatternBase
	 * @abstract
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.def.pattern.SlashPattern
	 */
	var SlashPattern = PatternBase.extend("sap.gantt.def.pattern.SlashPattern", /** @lends sap.gantt.def.pattern.SlashPattern.prototype  */ {
		library : "sap.gantt",
		metadata : {
			properties: {
				
				/**
				 * Value of d attribute in Path element. The value is influenced by property <code>tileWidth</code> and <code>tileHeight</code>.
				 * If this value is changed by coding, the logic cannot be guaranteed.
				 */
				path : {type : "string", defaultValue : null},
				
				/**
				 * Stroke color of the path element.
				 */
				stroke : {type : "sap.gantt.ValueSVGPaintServer"},
				
				/**
				 * Stroke width of the path element.
				 */
				strokeWidth : {type : "int", defaultValue : 2}
			}
		}
	});

	SlashPattern.prototype.getPath = function () {
		var tileWidth = this.getTileWidth();
		var tileHeight = this.getTileHeight();
		var dStr = "";
		dStr = dStr.concat("M-").concat(tileWidth / 4).concat(",").concat(tileHeight / 4).concat(" ");
		dStr = dStr.concat("l").concat(tileWidth / 2).concat(",-").concat(tileHeight / 2).concat(" ");
		dStr = dStr.concat("M0").concat(",").concat(tileHeight).concat(" ");
		dStr = dStr.concat("l").concat(tileWidth).concat(",-").concat(tileHeight).concat(" ");
		dStr = dStr.concat("M").concat(tileWidth / 4 * 3).concat(",").concat(tileHeight / 4 * 5).concat(" ");
		dStr = dStr.concat("l").concat(tileWidth / 2).concat(",-").concat(tileHeight / 2).concat(" ");
		return dStr;
	};
	
	SlashPattern.prototype.getDefString = function () {
		return "<pattern class='pattern' id='" + this.getId() +
			"' patternUnits='userSpaceOnUse' x='0' y='0' width='" + this.getTileWidth() +
			"' height='" + this.getTileHeight() +
			"'><rect x='0' width='" + this.getTileWidth() +
			"' height='" + this.getTileHeight() +
			"' fill='" + this.getBackgroundColor() +
			"' fill-opacity='" + this.getBackgroundFillOpacity() +
			"'></rect><path d='" + this.getPath() +
			"' stroke='" + this.getStroke() +
			"' stroke-width='" + this.getStrokeWidth() + "'></path></pattern>";
	};

	return SlashPattern;
}, true);
