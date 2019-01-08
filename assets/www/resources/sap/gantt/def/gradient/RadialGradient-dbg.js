/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"../DefBase"
], function (DefBase) {
	"use strict";
	
	/**
	 * Creates and initializes a radial gradient defined for later reuse.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * Radial gradient defined by SVG tag 'radialGradient'. 
	 * 
	 * <p>
	 * See {@link http://www.w3.org/TR/SVG/pservers.html#RadialGradients Radical Gradient in SVG 1.1 specification} for detail.<br/>
	 * {@link http://www.w3.org/TR/SVG/images/pservers/radgrad01.svg Radical gradient sample in SVG specification 1.1}:<br/>
	 * <svg width="8cm" height="4cm" viewBox="0 0 800 400" version="1.1" xmlns="http://www.w3.org/2000/svg">
	 * <g><defs><radialGradient id="MyGradient" gradientUnits="userSpaceOnUse" cx="400" cy="200" r="300" fx="400" fy="200">
	 * <stop offset="0%" stop-color="red" /><stop offset="50%" stop-color="blue" /><stop offset="100%" stop-color="red" /></radialGradient></defs>
	 * <rect fill="none" stroke="blue" x="1" y="1" width="798" height="398"/>
	 * <rect fill="url(#MyGradient)" stroke="black" stroke-width="5" x="100" y="100" width="600" height="200"/></g>
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
	 * @alias sap.gantt.def.gradient.RadicalGradient
	 */
	var RadialGradient = DefBase.extend("sap.gantt.def.gradient.RadialGradient", /** @lends sap.gantt.def.gradient.RadialGradient.prototype */ {
		metadata : {
			properties: {
				
				/**
				 * Attribute 'cx' of SVG tag 'radialGradient'. See 
				 * {@link http://www.w3.org/TR/SVG/pservers.html#RadialGradientElementCXAttribute 'cx' attribute of 'radialGradient' element in SVG 1.1 specification} for detail.
				 */
				cx: {type: "float", defaultValue: 400},
				
				/**
				 * Attribute 'cy' of SVG tag 'radialGradient'. See 
				 * {@link http://www.w3.org/TR/SVG/pservers.html#RadialGradientElementCYAttribute 'cy' attribute of 'radialGradient' element in SVG 1.1 specification} for detail.
				 */
				cy: {type: "float", defaultValue: 200},
				
				/**
				 * Attribute 'r' of SVG tag 'radialGradient'. See 
				 * {@link http://www.w3.org/TR/SVG/pservers.html#RadialGradientElementRAttribute 'r' attribute of 'radialGradient' element in SVG 1.1 specification} for detail.
				 */
				r: {type: "float", defaultValue: 300},
				
				/**
				 * Attribute 'fx' of SVG tag 'radialGradient'. See 
				 * {@link http://www.w3.org/TR/SVG/pservers.html#RadialGradientElementFXAttribute 'fx' attribute of 'radialGradient' element in SVG 1.1 specification} for detail.
				 */
				fx: {type: "float", defaultValue: 400},
				
				/**
				 * Attribute 'fy' of SVG tag 'radialGradient'. See 
				 * {@link http://www.w3.org/TR/SVG/pservers.html#RadialGradientElementFYAttribute 'fy' attribute of 'radialGradient' element in SVG 1.1 specification} for detail.
				 */
				fy: {type: "float", defaultValue: 200}
			},
			aggregations:{
				
				/**
				 * 'stop' elements in the 'radialGradient' element. See {@link http://www.w3.org/TR/SVG/pservers.html#GradientStops 'stop' element in SVG 1.1 specification} for detail.
				 */
				stops: {type: "sap.gantt.def.gradient.Stop", multiple: true, singularName: "stop"}
			}
		}
	});

	return RadialGradient;
}, true);
