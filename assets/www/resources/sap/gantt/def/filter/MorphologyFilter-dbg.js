/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"../DefBase"
], function (DefBase) {
	"use strict";

	/**
	 * Creates and initializes a morphology filter defined for later reuse.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * This filter is a combination of several filters. The main one is morphology.
	 * 
	 * <p>
	 * The purpose of this filter is to generate a white outline of a target shape when the target is overlapping with other shapes. In general this filter is recommended to be used only on 'text' and
	 * 'image' whose outline is very hard to determine. For regular SVG tags like 'rect', 'circle' etc, use the 'stroke' attribute instead if possible. This is because filters in general have worse performance.<br/>
	 * See {@link http://www.w3.org/TR/SVG/filters.html Filter Effects in SVG 1.1 specification} for detail.<br/>
	 * Tags used in this filter are:
	 * <ul>
	 * 	<li>'femorphology': Use operator 'dilate' to make a fatter shape of the source shape. See {@link http://www.w3.org/TR/SVG/filters.html#feMorphologyElement Tag 'femorphology' in SVG 1.1 specification} for detail.</li>
	 * 	<li>'feColorMatrix': Fills fatter shape. The default matrix turns every color into white. See {@link http://www.w3.org/TR/SVG/filters.html#feColorMatrixElement Tag 'feColorMatrix' in SVG 1.1 specification} for detail.</li>
	 * 	<li>'feMerge': Merges the source shape into the fatter shape to produce an outline effect on the target shape. See {@link http://www.w3.org/TR/SVG/filters.html#feMergeElement Tag 'feMerge' in SVG 1.1 specification} for detail.</li>
	 * </ul>
	 * Effect of this filter is: <br/>
	 * <svg xmlns="http://www.w3.org/2000/svg" width="12cm" height="8.8cm" viewBox="0 0 300 220" version="1.1">
	 * <rect x="1" y="1" width="298" height="218" fill="none" stroke="blue" stroke-width="0.5"/>
	 * 	<defs><filter id="fm1"><feMorphology in="SourceAlpha" result="morphed" operator="dilate" radius="2,1"></feMorphology><feColorMatrix in="morphed" result="recolored" type="matrix" values="-1 0 0 0 1, 0 -1 0 0 1, 0 0 -1 0 1, 0 0 0 1 0"></feColorMatrix><feMerge><feMergeNode in="recolored"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge></filter>
	 * 	<filter id="fm2"><feMorphology in="SourceAlpha" result="morphed" operator="dilate" radius="2,1"></feMorphology><feColorMatrix in="morphed" result="recolored" type="matrix" values="-1 0 0 0 0, 0 -1 0 0 0, 0 0 -1 0 0, 0 0 0 1 0"></feColorMatrix><feMerge><feMergeNode in="recolored"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge></filter></defs>
	 * 	<rect x="1" y="1" width="298" height="150" fill="#222"/>
	 * 	<rect x="1" y="150" width="298" height="68" fill="#ddd"/>
	 * 	<path d="M 80,50 c 0,-50 80,-50 80,0 c 0,50 80,50 80,0" filter="url(#fm1)" stroke="#9E1F63" stroke-width="2" fill="none"/>
	 * 	<text x="20" y="130" filter="url(#fm1)" font-size="30" fill="#1C75BC">Can you see me?</text>
	 * 	<text x="25" y="195" filter="url(#fm2)" font-size="30" fill="#ddd">How about now?</text>
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
	 * @alias sap.gantt.def.filter.MorphologyFilter
	 */
	var MorphologyFilter = DefBase.extend("sap.gantt.def.filter.MorphologyFilter", /** @lends sap.gantt.def.filter.MorphologyFilter.prototype */ {
		metadata: {
			properties: {
				
				/**
				 * Atrribute of SVG tag 'feMorphology'. See {@link http://www.w3.org/TR/SVG/filters.html#feMorphologyOperatorAttribute 'operator' attribute} for detail.
				 * Possible values are in {@link sap.gantt.def.filter.MorphologyOperator}.
				 */
				operator: {type: "string", defaultValue: sap.gantt.def.filter.MorphologyOperator.Dilate},
				
				/**
				 * Attribute of SVG tag 'feMorphology'. See {@link http://www.w3.org/TR/SVG/filters.html#feMorphologyRadiusAttribute 'radius' attribute} for detail.
				 */
				radius: {type: "string", defaultValue: "2,1"},
				
				/**
				 * Attribute of SVG tag 'feColorMatrix'. See {@link http://www.w3.org/TR/SVG/filters.html#feColorMatrixValuesAttribute 'value' attribute} for detail.
				 * Predefined values are in {@link sap.gantt.def.filter.ColorMatrixValue}. Advanced users can provide a customized matrix in string.
				 */
				colorMatrix: {type: "string", defaultValue: sap.gantt.def.filter.ColorMatrixValue.AllToWhite}
			}
		}
	});
	
	MorphologyFilter.prototype.getDefString = function(){
		return "<filter id='" + this.getId() + "'>" + 
			"<feMorphology in='SourceAlpha' result='morphed' operator='" + this.getOperator() +
			"' radius='" + this.getRadius() + "'/>" +
			"<feColorMatrix in='morphed' result='recolored' type='matrix' values='" + this.getColorMatrix() + "'/>" + 
			"<feMerge>" + 
				"<feMergeNode in='recolored'/>" + 
				"<feMergeNode in='SourceGraphic'/>" +
			"</feMerge>" +
		"</filter>";
	};

	return MorphologyFilter;
}, true);
