/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"../DefBase"
], function (DefBase) {
	"use strict";

	/**
	 * Creates and initializes a linear gradient defined for later reuse.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * Linear gradient defined by SVG tag 'linearGradient'. 
	 * 
	 * <p>
	 * See {@link http://www.w3.org/TR/SVG/pservers.html#LinearGradients Linear Gradient in SVG 1.1 specification} for detail.<br/>
	 * {@link http://www.w3.org/TR/SVG/images/pservers/lingrad01.svg Linear gradient sample in SVG specification 1.1}:<br/>
	 * <svg width="8cm" height="4cm" viewBox="0 0 800 400" version="1.1" xmlns="http://www.w3.org/2000/svg">
	 * <g><defs><linearGradient id="MyGradient"><stop offset="5%" stop-color="#F60" /><stop offset="95%" stop-color="#FF6" /></linearGradient></defs>
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
	 * @alias sap.gantt.def.gradient.LinearGradient
	 */
	var LinearGradient = DefBase.extend("sap.gantt.def.gradient.LinearGradient", /** @lends sap.gantt.def.gradient.LinearGradient.prototype */ {
		metadata : {
			properties: {
				
				/**
				 * Attribute 'x1' of SVG tag 'linearGradient'. See 
				 * {@link http://www.w3.org/TR/SVG/pservers.html#LinearGradientElementX1Attribute 'x1' attribute of 'linearGradient' element in SVG 1.1 specification} for detail.
				 */
				x1: {type: "string", defaultValue: "0"},
				
				/**
				 * Attribute 'y1' of SVG tag 'linearGradient'. See 
				 * {@link http://www.w3.org/TR/SVG/pservers.html#LinearGradientElementY1Attribute 'y1' attribute of 'linearGradient' element in SVG 1.1 specification} for detail.
				 */
				y1: {type: "string", defaultValue: "0"},
				
				/**
				 * Attribute 'x2' of SVG tag 'linearGradient'. See 
				 * {@link http://www.w3.org/TR/SVG/pservers.html#LinearGradientElementX2Attribute 'x2' attribute of 'linearGradient' element in SVG 1.1 specification} for detail.
				 */
				x2: {type: "string", defaultValue: "100"},
				
				/**
				 * Attribute 'y2' of SVG tag 'linearGradient'. See 
				 * {@link http://www.w3.org/TR/SVG/pservers.html#LinearGradientElementY2Attribute 'y2' attribute of 'linearGradient' element in SVG 1.1 specification} for detail.
				 */
				y2: {type: "string", defaultValue: "15"}
			},
			aggregations:{
				
				/**
				 * 'stop' elements in the 'linearGradient' element. See {@link http://www.w3.org/TR/SVG/pservers.html#GradientStops 'stop' element in SVG 1.1 specification} for detail.
				 */
				stops: {type: "sap.gantt.def.gradient.Stop", multiple: true, singularName: "stop"}
			}
		}
	});

	LinearGradient.prototype.getDefString = function () {
		var sRetVal = "<linearGradient id='" + this.getId() +
			"' x1='" + this.getX1() + "' y1='" + this.getY1() + "' x2='" + this.getX2() +
			"' y2='" + this.getY2() +
			"'>";
		var aStops = this.getStops();
		for (var i = 0; i < aStops.length; i++) {
			sRetVal = sRetVal.concat(aStops[i].getDefString());
		}
		sRetVal = sRetVal.concat("</linearGradient>");
		return sRetVal;
	};

	return LinearGradient;
}, true);
