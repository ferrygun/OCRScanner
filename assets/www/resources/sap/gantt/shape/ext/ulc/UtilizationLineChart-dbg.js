/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Group"
], function(Group){
	"use strict";
	
	/**
	 * Creates and initializes a new Utilization Line Chart container class.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * ULC is a complex shape. This class is the outer container with tag='g'. All fragments are aggregated into this container.
	 * You can remove a fragment from the container if your application does not need it.
	 * 
	 * <p>The container has four aggregations: 
	 * <ul>
	 * 		<li>{@link sap.gantt.shape.ext.ulc.UlcMiddleLine}(used to draw a middle line, which indicates the position of 50% utilization rate),</li>
	 * 		<li>{@link sap.gantt.shape.ext.ulc.UlcOverCapacityZoneRectangle}(used to draw over capacity Zone),</li>
	 * 		<li>{@link sap.gantt.shape.ext.ulc.UlcDimension}(used to draw Dimensions, OverCapacityClipping, and UnderCapacityClipping),</li>
	 * 		<li>{@link sap.gantt.shape.ext.ulc.UlcTooltipRectangle}(used to draw invisible tooltip rectangles for each period of capacity change).</li>
	 * </ul>
	 * </p>
	 * 
	 * <p>
	 * Each dimension consists of <code>UlcOverClipRectangle</code>, <code>UlcUnderClipRectangle</code>, <code>UlcClipPath</code>, and <code>UlcBorderPath</code>.
	 * <code>UlcClipingPath</code> is aggregated in <code>UlcClipPath</code>.
	 * </p>
	 * 
	 * <p>A super class <code>sap.gantt.shape.ext.ulc.UlcRectangle</code> is abstracted because the other four rectangles(UlcOverCapacityZoneRectangle, 
	 * UlcOverClipRectangle, UlcUnderClipRectangle, and UlcTooltipRectangle) share similar logic.
	 * </p>
	 * 
	 * <p>
	 * Graphic Effect is:<br/>
	 * <svg xmlns="http://www.w3.org/2000/svg" width="12cm" height="8.8cm" viewBox="0 0 300 220" version="1.1">
	 * <defs><marker id="arrowend" viewBox="0 0 10 10" refX="10" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 0 l 10 5 l -10 5 l 4 -5 z" fill="#6d6d6d" /></marker>
	 * 	<marker id="arrowstart" viewBox="0 0 10 10" refX="0" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 5 l 10 -5 l -4 5 l 4 5 z" fill="#6d6d6d" /></marker></defs>
	 * 	<style>.side{stroke-width:2;stroke:#1C75BC;fill:none;} .dashside{stroke-width:1;stroke:#1C75BC;fill:none; stroke-dasharray:5,1;} .dashassist{stroke-width:1;stroke:#6d6d6d;fill:none; stroke-dasharray:5,1;}
	 * 	.arrowline{stroke-width:1;stroke:#6d6d6d;fill:none;marker-end:url(#arrowend);marker-start:url(#arrowstart);} .center{r:3;fill:#6d6d6d;stroke:#9E1F63;} .texthyphon{stroke-width:1;stroke:#9E1F63;fill:none} .propertyText{stroke:#6d6d6d;} .timeText{stroke:#9E1F63;} </style>
	 * <rect x="1" y="1" width="298" height="218" fill="none" stroke="blue" stroke-width="0.5"/>
	 * 	<defs><pattern class="pattern" id="pUlc" patternUnits="userSpaceOnUse" x="0" y="0" width="4" height="4"><rect x="0" width="4" height="4" fill="#efefef"></rect><path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2 " stroke="#6d6d6d" stroke-width="0.5"></path></pattern>
	 * 	<pattern class="pattern" id="pEx" patternUnits="userSpaceOnUse" x="0" y="0" width="4" height="4"><rect x="0" width="4" height="4" fill="#f2a5a5"></rect><path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2 " stroke="#d16d6d" stroke-width="0.5"></path></pattern></defs>
	 * 	<clippath id="cpSide"><path d="M 40 155 l 25 -90 h 50 l 20 30 h 100 l 40 60" /></clippath>
	 * 	<clippath id="cpTexthyphon"><path d="M 40 155 l 25 -85 h 50 l 20 10 h 100 l 40 75" /></clippath>
	 * 	<rect id="overBg" x="10" y="65" width="280" height="20" fill="url(#pUlc)" />
	 * 	<rect id="overSide"x="10" y="65" width="280" height="20" clip-path="url(#cpSide)" fill="url(#pEx)" stroke="none"/>
	 * 	<rect id="overTexthyphon" x="10" y="65" width="280" height="20" clip-path="url(#cpTexthyphon)" fill="url(#pEx)" stroke="none"/>
	 * 	<rect id="underBg" x="10" y="85" width="280" height="70" fill="#efefef" />
	 * 	<path id="middleLine" d="M 10 120 h 280" class="dashassist" />
	 * 	<rect id="underSide" x="10" y="85" width="280" height="70" clip-path="url(#cpSide)" fill="#858585" fill-opacity="0.5" />
	 * 	<rect id="underTexthyphone" x="10" y="85" width="280" height="70" clip-path="url(#cpTexthyphon)" fill="#858585" fill-opacity="0.5" />
	 * 	<path d="M 40 155 l 25 -90 h 50 l 20 30 h 100 l 40 60" class="side" />
	 * 	<path d="M 40 155 l 25 -85 h 50 l 20 10 h 100 l 40 75" class="texthyphon" />
	 * 	<rect x="40" y="65" width="25" height="90" opacity="0"><title>dimention1: 0-150%&#10;dimention2: 0-110%</title></rect>
	 * 	<rect x="65" y="65" width="50" height="90" opacity="0"><title>dimention1: 150%&#10;dimention2: 110%</title></rect>
	 * 	<rect x="115" y="65" width="20" height="90" opacity="0"><title>dimention1: 150%-70%&#10;dimention2: 110%-105%</title></rect>
	 * 	<rect x="135" y="65" width="100" height="90" opacity="0"><title>dimention1: 70%&#10;dimention2: 105%</title></rect>
	 * 	<rect x="235" y="65" width="40" height="90" opacity="0"><title>dimention1: 70%-0&#10;dimention2: 105%-0</title></rect>
	 * 	<path d="M 50 70 l 10 -20 m 120 0 l -70 30 m -90 70 l -5 20 m 60 -50 l 40 50 m 50 -30 l 10 55 m 30 -100 l 20 80 l 20 -75" class="dashassist" />
	 * 	<text x="20" y="40" class="propertyText"> >100% Zone</text>
	 * 	<text x="120" y="40" class="propertyText">OverCapacityClipping</text>
	 * 	<text x="10" y="190" class="propertyText"> <100% Zone</text>
	 * 	<text x="110" y="190" class="propertyText">50%</text>
	 * 	<text x="130" y="210" class="propertyText">UnderCapacityClipping</text>
	 * 	<text x="190" y="190" class="timeText">Dimensions</text>
	 * </svg>
	 * </p>
	 * 
	 *  <p>An example for the structure of data to feed balance chart: </br>
	 * <code>
	 * {	
	 * 		order: [{
	 * 			id: "ulc_0",
	 * 			util: [
	 * 				{
	 * 					dimension: "util_volumn",
	 * 					values:[
	 * 						{
	 * 							from: "20160123000000",
	 * 							to: "20160123000000",
	 * 							firstOne: true,
	 * 							value: 0
	 * 						},
	 * 						{
	 * 							from: "20160124071000",
	 * 							to: "20160124071000",
	 * 							value: 97.6
	 * 						}, {
	 * 							from: "20160124071000",
	 * 							to: "20160127051300",
	 * 							firstOne: true,
	 * 							value: 97.6
	 * 						},{
	 * 							from: "20160127051300",
	 * 							to: "20160127051300",
	 * 							value: 97.6
	 * 						},{
	 * 							from: "20160128093312",
	 * 							to: "20160128093312",
	 * 							lastOne: true,
	 * 							value: 0
	 * 						}
	 * 					]
	 * 				},{
	 * 					dimension: "util_mass",
	 * 					values:[
	 * 						{
	 * 							from: "20160123000000",
	 * 							to: "20160123000000",
	 * 							firstOne: true,
	 * 							value: 0
	 * 						}
	 * 						{
	 * 							from: "20160124071000",
	 * 							to: "20160124071000",
	 * 							value: 114.5
	 * 						}, {
	 * 							from: "20160124071000",
	 * 							to: "20160127051300",
	 * 							value: 114.5
	 * 						},{
	 * 							from: "20160127051300",
	 * 							to: "20160127051300",
	 * 							value: 114.5
	 * 						},{
	 * 							from: "20160128093312",
	 * 							to: "20160128093312",
	 * 							lastOne: true,
	 * 							value: 0
	 * 						}
	 * 					]
	 * 				}
	 * 			]
	 * 		}],
	 * 		tooltip: [
	 * 			{
 * 					from: "20160123000000",
 * 					to: "20160124071000",
 * 					firstOne: true,
 * 					util_volumn: {
 * 						previous: 0,
 * 						next: 97.6
 * 					},
 * 					util_mass:{
 * 						previous: 0,
 * 						next: 114.5
 * 					}
 * 				},{
 * 					from: "20160124071000",
 * 					to: "20160127051300",
 * 					util_volumn: {
 * 						val: 97.6
 * 					},
 * 					util_mass:{ 
 * 						val: 114.5
 * 					}
 * 				},{
 * 					from: "20160127051300",
 * 					to: "20160128093312",
 * 					lastOne: true,
 * 					util_volumn: {
 * 						previous: 97.6,
 * 						next: 0
 * 					},
 * 					util_mass:{
 * 						previous: 114.5,
 * 						next: 0
 * 					}
 * 				}
	 * 		]
	 * }
	 * </code>
	 * </p>
	 * 
	 * @extends sap.gantt.shape.Shape
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.shape.ext.ulc.UtilizationLineChart
	 */
	var UtilizationLineChart = Group.extend("sap.gantt.shape.ext.ulc.UtilizationLineChart", /** @lends sap.gantt.shape.ext.ulc.UtilizationLineChart.prototype" */ {});

	/**
	 * Gets the value of property <code>enableSelection</code>.
	 * 
	 * <p>
	 * This value controls whether a shape is enabled for selection behavior. The default value for Utilization Line Chart is false.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {boolean} Value of property <code>enableSelection</code>.
	 * @public
	 */
	UtilizationLineChart.prototype.getEnableSelection = function(oData, oRowInfo){
		if (this.mShapeConfig.hasShapeProperty("enableSelection")){
			return this._configFirst("enableSelection", oData);
		}
		
		return false;
	};

	return UtilizationLineChart;
}, true);
