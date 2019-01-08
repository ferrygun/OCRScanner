/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Shape"
], function (Shape) {
	"use strict";
	
	/**
	 * Creates and initializes a new Clippath class.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * Clippath shape class using SVG container tag 'clippath'. It is usually used together with {@link sap.gantt.shape.Path} as aggregations, and
	 * referenced by other shapes by URL.
	 * 
	 * <p>
	 * See {@link http://www.w3.org/TR/SVG/masking.html#EstablishingANewClippingPath SVG specification 1.1 for 'clippath' element} for
	 * more information about the HTML tag.<br/><br/>
	 * {@link http://www.w3.org/TR/SVG/images/shapes/circle01.svg Circle samples in SVG specification 1.1}:<br/>
	 * <svg width="12cm" height="4cm" viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg" version="1.1">
	 * <defs><marker id="arrowend" viewBox="0 0 10 10" refX="10" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 0 l 10 5 l -10 5 l 4 -5 z" fill="#6d6d6d" /></marker>
	 * <marker id="arrowstart" viewBox="0 0 10 10" refX="0" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 5 l 10 -5 l -4 5 l 4 5 z" fill="#6d6d6d" /></marker></defs>
	 * <style>.side{stroke-width:2;stroke:#1C75BC;fill:none;} .dashside{stroke-width:1;stroke:#1C75BC;fill:none; stroke-dasharray:5,1;} .dashassist{stroke-width:1;stroke:#6d6d6d;fill:none; stroke-dasharray:5,1;}
	 * .arrowline{stroke-width:1;stroke:#6d6d6d;fill:none;marker-end:url(#arrowend);marker-start:url(#arrowstart);} .center{r:3;fill:#6d6d6d;stroke:#9E1F63;} .texthyphon{stroke-width:1;stroke:#9E1F63} .propertyText{stroke:#6d6d6d;} .timeText{stroke:#9E1F63;} </style>
	 * 	<rect x="1" y="1" width="298" height="98" fill="none" stroke="blue" stroke-width="0.5"/>
	 * 	<rect x="30" y="30" width="250" height="30" fill="#dddddd"/>
	 * 	<rect x="30" y="30" width="250" height="30" fill="#9E1F63" style="stroke: none; clip-path: url(#clipPath4);"/>
	 * 	<path d="M 90 70 l 10 -20 m 0 0 l 35 0 m 0 0 l 13 7 m 0 0 l 15 -14 m 0 0 l 15 27 m 0 0 l 20 -30 m 0 0 l 14 30" stroke="#1C75BC" stroke-width="2"/>
	 * 	<clipPath id="clipPath4"><path d="M 90 70 l 10 -20 l 35 0 l 13 7 l 15 -14 l 15 27 l 20 -30 l 14 30"/></clipPath>
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
	 * @alias sap.gantt.shape.ClipPath
	 */
	var ClipPath = Shape.extend("sap.gantt.shape.ClipPath", /** @lends sap.gantt.shape.ClipPath.prototype */{
		metadata: {
			properties: {
				tag: {type: "string", defaultValue: "clippath"}
			},
			aggregations: {
				
				/**
				 * Paths defining the clipPath.
				 */
				paths: {type: "sap.gantt.shape.Path", multiple: true, singularName: "path"}
			}
		}
	});
	
	/**
	 * Gets the value of property <code>tag</code>.
	 * 
	 * SVG tag name of the shape.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html SVG 1.1 specification for shapes}.<br/>
	 * <b>Note:</b> We do not recommend that you change this value using a configuration or coding.
	 * 
	 * @name sap.gantt.shape.ClipPath.prototype.getTag
	 * @function
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of property <code>tag</code>.
	 * @public
	 */

	return ClipPath;
}, true);
