/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Shape", "sap/gantt/misc/Utility"
], function (Shape, Utility) {
	"use strict";
	
	/**
	 * Creates and initializes a new Path class.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * Path shape class using SVG tag 'path'.
	 * 
	 * <p>
	 * See {@link http://www.w3.org/TR/SVG/paths.html SVG specification 1.1 for 'path' element} for
	 * more information about the HTML tag.<br/><br/>
	 * 
	 * {@link http://www.w3.org/TR/SVG/images/paths/triangle01.svg Sample of closed path in SVG specification 1.1}:<br/>
	 * <svg width="4cm" height="4cm" viewBox="0 0 400 400"  xmlns="http://www.w3.org/2000/svg" version="1.1">
	 * <rect x="1" y="1" width="398" height="398" fill="none" stroke="blue" />
	 * <path d="M 100 100 L 300 100 L 200 300 z"  fill="red" stroke="blue" stroke-width="3" />
	 * </svg><br/>
	 * 
	 * {@link http://www.w3.org/TR/SVG/images/paths/cubic01.svg Sample of open curve path in SVG specification 1.1}: <br/>
	 * <svg width="5cm" height="4cm" viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg" version="1.1">
	 * <style>.Border { fill:none; stroke:blue; stroke-width:1 } .Connect { fill:none; stroke:#888888; stroke-width:2 }
	 * .SamplePath { fill:none; stroke:red; stroke-width:5 } .EndPoint { fill:none; stroke:#888888; stroke-width:2 }
	 * .CtlPoint { fill:#888888; stroke:none } .AutoCtlPoint { fill:none; stroke:blue; stroke-width:4 }
	 * .Label { font-size:22; font-family:Verdana }</style>
	 * <rect class="Border" x="1" y="1" width="498" height="398" />
	 * <polyline class="Connect" points="100,200 100,100" />
	 * <polyline class="Connect" points="250,100 250,200" />
	 * <polyline class="Connect" points="250,200 250,300" />
	 * <polyline class="Connect" points="400,300 400,200" />
	 * <path class="SamplePath" d="M100,200 C100,100 250,100 250,200 S400,300 400,200" />
	 * <circle class="EndPoint" cx="100" cy="200" r="10" />
	 * <circle class="EndPoint" cx="250" cy="200" r="10" />
	 * <circle class="EndPoint" cx="400" cy="200" r="10" />
	 * <circle class="CtlPoint" cx="100" cy="100" r="10" />
	 * <circle class="CtlPoint" cx="250" cy="100" r="10" />
	 * <circle class="CtlPoint" cx="400" cy="300" r="10" />
	 * <circle class="AutoCtlPoint" cx="250" cy="300" r="9" />
	 * <text class="Label" x="25" y="70">M100,200 C100,100 250,100 250,200</text>
	 * <text class="Label" x="325" y="350" style="text-anchor:middle">S400,300 400,200</text>
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
	 * @alias sap.gantt.shape.Path
	 */
	var Path = Shape.extend("sap.gantt.shape.Path", /** @lends sap.gantt.shape.Path.prototype */ {
		metadata: {
			properties: {
				tag: {type: "string", defaultValue: "path"},
				isClosed: {type: "boolean", defaultValue: false},
				fill: {type: "string", defaultValue: "none"},

				d: {type: "string"}
			}
		}
	});
	
	Path.prototype.init = function() {
		Shape.prototype.init.apply(this, arguments);
		var oRb = sap.ui.getCore().getLibraryResourceBundle("sap.gantt");
		this.setProperty("ariaLabel", oRb.getText("ARIA_PATH"));
	};
	
	/**
	 * Gets the value of property <code>tag</code>.
	 * 
	 * SVG tag name of the shape.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html SVG 1.1 specification for shapes}.<br/>
	 * <b>Note:</b> We do not recommend that you change this value using a configuration or coding.
	 * 
	 * @name sap.gantt.shape.Path.prototype.getTag
	 * @function
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of property <code>tag</code>.
	 * @public
	 */
	
	/**
	 * Gets the value of property <code>d</code>.
	 * 
	 * <p>
	 * d attribute of path element.
	 * See {@link http://www.w3.org/TR/SVG/paths.html#DAttribute SVG 1.1 specification for 'd' attribute of 'path'}.
	 * The 'd' attribute has very powerful grammar. See {@link http://www.w3.org/TR/SVG/paths.html#PathDataBNF BNF grammar} for more information.
	 * Rich extension of paths is provided in namespace <code>sap.gantt.shape.ext</code>.<br/>
	 * This shape provides a default implementation of the d attribute:<br/>
	 * <svg width="12cm" height="4cm" viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg" version="1.1">
	 * <defs><marker id="arrowend" viewBox="0 0 10 10" refX="10" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 0 l 10 5 l -10 5 l 4 -5 z" fill="#6d6d6d" /></marker>
	 * <marker id="arrowstart" viewBox="0 0 10 10" refX="0" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 5 l 10 -5 l -4 5 l 4 5 z" fill="#6d6d6d" /></marker></defs>
	 * <style>.side{stroke-width:2;stroke:#1C75BC;fill:none;} .dashside{stroke-width:1;stroke:#1C75BC;fill:none; stroke-dasharray:5,1;} .dashassist{stroke-width:1;stroke:#6d6d6d;fill:none; stroke-dasharray:5,1;}
	 * .arrowline{stroke-width:1;stroke:#6d6d6d;fill:none;marker-end:url(#arrowend);marker-start:url(#arrowstart);} .center{r:3;fill:#6d6d6d;stroke:#9E1F63;} .texthyphon{stroke-width:1;stroke:#9E1F63} .propertyText{stroke:#6d6d6d;} .timeText{stroke:#9E1F63;} </style>
	 * <rect x="1" y="1" width="298" height="98" fill="none" stroke="blue" stroke-width="0.5"/>
	 * <path d="M 80,50 c 0,-50 80,-50 80,0 c 0,50 80,50 80,0" class="side" />
	 * <circle cx="80" cy="50" class="center" />
	 * <circle cx="240" cy="50" class="center" />
	 * <path d="M 80,70 v -20 m 160 0 v -20" class="texthyphon" />
	 * <text x="65" y="85" class="timeText">time</text>
	 * <text x="220" y="25" class="timeText">endTime</text>
	 * </svg>
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of property <code>d</code> or null if the generated d is invalid according to the given data.
	 * @public
	 */
	Path.prototype.getD = function (oData, oRowInfo) {
		var sD;
		if (this.mShapeConfig.hasShapeProperty("d")) {
			sD = this._configFirst("d", oData);
		} else {
			var aCenter = this._getCenter(oData, oRowInfo),
				bIsDuration = this.getIsDuration(oData, oRowInfo),
				sMode = this.mChartInstance.getSapUiSizeClass();
			var nHalfLength = Utility.scaleBySapUiSize(sMode, 7.5);
			
			if (bIsDuration) {
				var aEndCenter = this._getCenter(oData, oRowInfo, true);
				nHalfLength = (aEndCenter[0] - aCenter[0]) / 2;
			}
			
			sD = "M " + aCenter[0] + " " + aCenter[1] +
			" c 0," + -nHalfLength + " " + nHalfLength + "," + -nHalfLength + " " + nHalfLength +
			",0 c 0," + nHalfLength + " " + nHalfLength + "," + nHalfLength + " " + nHalfLength + ",0";
		}
		
		if(this.isValid(sD)) {
			return sD;
		} else {
			jQuery.sap.log.warning("Path shape generated invalid d: " + sD + " from the given data: " + oData);
			return null;
		}
	};
	
	/**
	 * Gets the value of property <code>isClosed</code>.
	 * 
	 * <p>
	 * When this value is true, the 'fill' attribute is applied. Otherwise, the 'fill' attribute is none.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {boolean} Value of property <code>isClosed</code>.
	 * @public
	 */
	Path.prototype.getIsClosed = function (oData) {
		return this._configFirst("isClosed", oData);
	};

	Path.prototype.getStyle = function(oData, oRowInfo) {
		var sInheritedStyle = Shape.prototype.getStyle.apply(this, arguments);
		var oStyles = {
			"fill": this.determineValueColor(this.getFill(oData, oRowInfo)),
			"stroke-dasharray:": this.getStrokeDasharray(oData, oRowInfo)
		};
		if (this.getIsClosed(oData, oRowInfo)) {
			oStyles["fill-opacity"] = this.getFillOpacity(oData, oRowInfo);
			oStyles["stroke-opacity"] = this.getStrokeOpacity(oData, oRowInfo);
		}
		return sInheritedStyle + this.getInlineStyle(oStyles);
	};
	
	/**
	 * Check whether the given d is valid.
	 * 
	 * @param {string} sD attribute of this path
	 * @return {boolean} whether the given d is valid
	 */
	Path.prototype.isValid = function(sD) {
		return !!sD && sD.indexOf("NaN") === -1 && sD.indexOf("undefined") === -1 && sD.indexOf("null") === -1;
	};
	
	return Path;
}, true);
