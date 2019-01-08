/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"../DefBase"
], function (DefBase) {
	"use strict";
	
	/**
	 * Creates and initializes a gradient stop defined for later reuse.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * Gradient stop defined by SVG tag 'stop'. 
	 * 
	 * <p>
	 * See {@link http://www.w3.org/TR/SVG/pservers.html#StopElement 'stop' element in SVG 1.1 specification} for detail.
	 * </p>
	 * 
	 * @extends sap.gantt.def.DefBase
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.def.gradient.Stop
	 */
	var Stop = DefBase.extend("sap.gantt.def.gradient.Stop", /** @lends sap.gantt.def.gradient.Stop.prototype */ {
		metadata : {
			properties: {
				
				/**
				 * Attribute 'offset' of SVG tag 'stop'. See 
				 * {@link http://www.w3.org/TR/SVG/pservers.html#StopElementOffsetAttribute 'offset' attribute of 'stop' element in SVG 1.1 specification} for detail.
				 */
				offSet: {type: "string", defaultValue: "5%"},
				
				/**
				 * Property 'stop-color' of SVG tag 'stop'. See 
				 * {@link http://www.w3.org/TR/SVG/pservers.html#StopColorProperty 'stop-color' property of 'stop' element in SVG 1.1 specification} for detail.
				 */
				stopColor: {type: "sap.gantt.ValueSVGPaintServer", defaultValue: "#FFFFFF"}
			}
		}
	});

	Stop.prototype.getDefString = function () {
		return "<stop id='" + this.getId() +
			"' offset='" + this.getOffSet() +
			"' stop-color='" + this.getStopColor() + "' />";
	};

	return Stop;
}, true);
