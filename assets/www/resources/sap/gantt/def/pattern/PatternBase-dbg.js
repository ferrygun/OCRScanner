/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"../DefBase"
], function (DefBase) {
	"use strict";

	/**
	 * Creates and initializes a new SVG pattern defined for later reuse.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * Base class for SVG pattern definitions.
	 * 
	 * <p>
	 * Pattern is a built-in paint server in SVG. It provides tile-based patterns to the SVG 'fill' or 'stroke' attributes.
	 * See {@link http://www.w3.org/TR/SVG/pservers.html#Patterns 'pattern' element in SVG}.<br>
	 * See {@link http://www.w3.org/TR/SVG/images/pservers/pattern01.svg Pattern sample fro SVG specificiation 1.1}<br/>
	 * <svg width="8cm" height="4cm" viewBox="0 0 800 400" version="1.1" xmlns="http://www.w3.org/2000/svg">
	 * <defs> <pattern id="TrianglePattern" patternUnits="userSpaceOnUse"  x="0" y="0" width="100" height="100" viewBox="0 0 10 10" >
	 * <path d="M 0 0 L 7 0 L 3.5 7 z" fill="red" stroke="blue" /></pattern></defs>
	 * <rect fill="none" stroke="blue" x="1" y="1" width="798" height="398"/>
	 * <ellipse fill="url(#TrianglePattern)" stroke="black" stroke-width="5" cx="400" cy="200" rx="350" ry="150" />
	 * </svg>
	 * </p>
	 * 
	 * @extends sap.gantt.def.DefBase
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.def.pattern.PatternBase
	 */
	var PatternBase = DefBase.extend("sap.gantt.def.pattern.PatternBase", /** @lends sap.gantt.def.pattern.PatternBase.prototype */ {
		metadata : {
			"abstract": true,
			properties: {

				/**
				 * Width of the pattern tile.
				 * See {@link http://www.w3.org/TR/SVG/pservers.html#PatternElementWidthAttribute 'width' attribute of 'pattern' element} for detail.
				 */
				tileWidth : {type : "int", defaultValue : 8},

				/**
				 * Height of the pattern tile.
				 * See {@link http://www.w3.org/TR/SVG/pservers.html#PatternElementHeightAttribute 'height' attribute of 'pattern' element} for detail.
				 */
				tileHeight : {type : "int", defaultValue : 8},

				/**
				 * Background color of the pattern.
				 * Technically a rectangle with the color is added in the beginning of the pattern definition.
				 */
				backgroundColor : {type : "sap.gantt.ValueSVGPaintServer", defaultValue : "#fff"},

				/**
				 * Fill opacity of background color.
				 */
				backgroundFillOpacity : {type : "float", defaultValue : "1"}
			}
		}
	});

	return PatternBase;
}, true);
