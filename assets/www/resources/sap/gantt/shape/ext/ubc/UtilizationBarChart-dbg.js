/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Group", "sap/gantt/misc/Format"
], function(Group, Format) {
	"use strict";

	/**
	 * Creates and initializes a new Utilization Bar Chart (UBC) container class.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings of the new control
	 * 
	 * @class 
	 * UBC is a complex shape. This class is the outer container with tag='g'. All fragments are aggregated into this container.
	 * You can remove a fragment from the container if your application does not need it. 
	 * 
	 * <p>The container has six aggregations: 
	 * <ul>
	 * 		<li>{@link sap.gantt.shape.ext.ubc.UbcOverCapacityZonePolygon}(used to represent the OverCapacity Zone area),</li>
	 * 		<li>{@link sap.gantt.shape.ext.ubc.UbcUnderCapacityZonePolygon}(used to represent the Unplanned Capacity area),</li>
	 * 		<li>{@link sap.gantt.shape.ext.ubc.UbcShortageCapacityPolygon}(used to the draw Shortage area),</li>
	 * 		<li>{@link sap.gantt.shape.ext.ubc.UbcUsedPolygon}(used to represent the HealthyPlanned Capacity area),</li>
	 * 		<li>{@link sap.gantt.shape.ext.ubc.UbcBorderPath}(used to represent the planned capacity line),</li>
	 * 		<li>{@link sap.gantt.shape.ext.ubc.UbcTooltipRectangle}(used to represent a rectangle with invisible tooltips for each period of capacity change).</li>
	 * </ul>
	 * </p>
	 * 
	 * <p>A super class <code> sap.gantt.shape.ext.ubc.UbcPolygon</code> is abstracted because the four polygons in this container (UbcOverCapacityZonePolygon, 
	 * UbcUnderCapacityZonePolygon, UbcShortageCapacityPolygon, and UbcUsedPolygon) share similar logic.</p>
	 * 
	 * <p>
	 * Graphic Effect is:<br/>
	 * <svg xmlns="http://www.w3.org/2000/svg" width="12cm" height="8.8cm" viewBox="0 0 300 220" version="1.1">
	 * <defs><marker id="arrowend" viewBox="0 0 10 10" refX="10" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 0 l 10 5 l -10 5 l 4 -5 z" fill="#6d6d6d" /></marker>
	 * 	<marker id="arrowstart" viewBox="0 0 10 10" refX="0" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 5 l 10 -5 l -4 5 l 4 5 z" fill="#6d6d6d" /></marker></defs>
	 * 	<style>.side{stroke-width:2;stroke:#1C75BC;fill:none;} .dashside{stroke-width:1;stroke:#1C75BC;fill:none; stroke-dasharray:5,1;} .dashassist{stroke-width:1;stroke:#6d6d6d;fill:none; stroke-dasharray:5,1;}
	 * 	.arrowline{stroke-width:1;stroke:#6d6d6d;fill:none;marker-end:url(#arrowend);marker-start:url(#arrowstart);} .center{r:3;fill:#6d6d6d;stroke:#9E1F63;} .texthyphon{stroke-width:1;stroke:#9E1F63;fill:none} .propertyText{stroke:#6d6d6d;} .timeText{stroke:#9E1F63;} </style>
	 * <rect x="1" y="1" width="298" height="218" fill="none" stroke="blue" stroke-width="0.5"/>
	 * 	<defs><pattern class="pattern" id="pUbc" patternUnits="userSpaceOnUse" x="0" y="0" width="4" height="4"><rect x="0" width="4" height="4" fill="#efefef"></rect><path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2 " stroke="#6d6d6d" stroke-width="0.5"></path></pattern>
	 * 	<pattern class="pattern" id="pEx2" patternUnits="userSpaceOnUse" x="0" y="0" width="4" height="4"><rect x="0" width="4" height="4" fill="#f2a5a5"></rect><path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2 " stroke="#9E1F63" stroke-width="0.5"></path></pattern></defs>
	 * 	<polygon points="10,65 290,65 290,155 10,155" fill="url(#pUbc)" />
	 * 	<polygon points="50,155 50,110 130,110 130,155 170,155 170,80 210,80 210,155" fill="#ffffff" />
	 * 	<polygon points="10,155 10,90 50,90 50,155 130,155 130,80 170,80 170,155 250,155 250,80 290,80 290,155" fill="url(#pEx2)" />
	 * 	<polygon points="10,105 50,105 50,145 130,145 130,90 170,90 170,120 210,120 210,100 290,100 290,155 10,155" fill="#efefef" />
	 * 	<path d="M 10 90 h 40 v 55 h 80 v -65 h 40 v 40 h 40 v -20 h 40 v -20 h 40" class="side" />
	 * 	<rect x="10" y="65" width="40" height="90" opacity="0"><title>Capacity: 50&#10;Required Capacity: 65</title></rect>
	 * 	<rect x="50" y="65" width="80" height="90" opacity="0"><title>Capacity: 45&#10;Required Capacity: 10</title></rect>
	 * 	<rect x="130" y="65" width="40" height="90" opacity="0"><title>Capacity: 65&#10;Required Capacity: 75</title></rect>
	 * 	<rect x="170" y="65" width="40" height="90" opacity="0"><title>Capacity: 75&#10;Required Capacity: 35</title></rect>
	 * 	<rect x="210" y="65" width="40" height="90" opacity="0"><title>Capacity: 55&#10;Required Capacity: 55</title></rect>
	 * 	<rect x="250" y="65" width="40" height="90" opacity="0"><title>Capacity: 55&#10;Required Capacity: 75</title></rect>
	 * 	<path d="M 20 80 l 10 -30 m 120 0 l -10 30 m 140 10 l -10 -40 m -10 90 l -10 30 m -150 0 l -10 -30" class="dashassist" />
	 * 	<text x="20" y="40" class="propertyText">OverCapacity</text>
	 * 	<text x="40" y="60" class="propertyText">Zone</text>
	 * 	<text x="140" y="40" class="propertyText">Planned</text>
	 * 	<text x="160" y="60" class="propertyText">Capacity</text>
	 * 	<text x="220" y="40" class="propertyText">Shortage</text>
	 * 	<text x="180" y="190" class="propertyText">HealthyPlanned</text>
	 * 	<text x="200" y="210" class="propertyText">Capacity</text>
	 * 	<text x="60" y="190" class="propertyText">UnPlanned</text>
	 * 	<text x="80" y="210" class="propertyText">Capacity</text>
	 * </svg>
	 * </p>
	 * 
	 * <p>An example of the structure of data to feed utilization bar chart: </br>
	 * <code>
	 * {	
	 * 		bc_capacity: {
	 * 			id: "capacity_0",
	 * 			period: [
	 * 				{
	 * 					start_date: "20160123000000",
	 * 					supply: "9",
	 * 					demand: "7"
	 * 				},{
	 * 					start_date: "20160127093400",
	 * 					supply: "8",
	 * 					demand: "8"
	 * 				}
	 * 			]
	 * 		},
	 * 		bc_tooltip: [
	 * 				{
	 * 					start_date: "20160123000000",
	 * 					supply: "9",
	 * 					demand: "7",
	 * 					end_date: "20160127093400"
	 * 				},{
	 * 					start_date: "20160127093400",
	 * 					supply: "8",
	 * 					demand: "8",
	 * 					start_date: "20160203134520"
	 * 				}
	 * 		]
	 * }
	 * </code>
	 * </p>
	 * 
	 * @extends sap.gantt.shape.Group
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.shape.ext.ubc.UtilizationBarChart
	 */
	var UtilizationBarChart = Group.extend("sap.gantt.shape.ext.ubc.UtilizationBarChart", /** @lends sap.gantt.shape.ext.ubc.UtilizationBarChart.prototype */ {});

	/**
	 * Gets the value of property <code>enableSelection</code>.
	 * 
	 * <p>
	 * This property determines whether a shape is enabled for selection behavior. The default value for the Utilization Line Chart is false.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {boolean} Value of property <code>enableSelection</code>.
	 * @public
	 */
	UtilizationBarChart.prototype.getEnableSelection = function(oData, oRowInfo){
		if (this.mShapeConfig.hasShapeProperty("enableSelection")){
			return this._configFirst("enableSelection", oData);
		}
		
		return false;
	};

	UtilizationBarChart.prototype.filterValidData = function (aData/*, oProperty, aTimeBoundary, oYAxis, oObjectInfo*/){
		if (!aData) {
			return [];
		}
		var aFilterData = [];
		for (var i = 0; i < aData.length; i++) {
			var isBulk = this.getIsBulk(aData[i]);
			var sArrayAttribute = this.getArrayAttribute(aData[i]);
			var sTimeFilter = this.getTimeFilterAttribute(aData[i]);
			var sEndTimeFilter = this.getEndTimeFilterAttribute(aData[i]);
			var aTimeBoundary = this.mChartInstance._oStatusSet.aTimeBoundary;
			var oTempData = jQuery.extend(true, {}, aData[i]);

			if (isBulk && sArrayAttribute && sTimeFilter && sEndTimeFilter){
				var startArray = null;
				var endArray = null;
				var aShapes = this.getShapes();
				var aShapeDatas = [];
				for (var j = 0; j < aShapes.length; j++) {
					var dataName = aShapes[j].mShapeConfig.getShapeDataName();
					if (dataName && (jQuery.inArray(dataName, aShapeDatas) == -1)) {
						aShapeDatas.push(dataName);
					}
				}
				for (var key in oTempData) {
					if ((jQuery.type(oTempData[key]) == "object") && oTempData[key][sArrayAttribute] && oTempData[key][sArrayAttribute].length > 0) {
						startArray = this._binarySearchElement(aTimeBoundary[0], oTempData[key][sArrayAttribute], sTimeFilter, sEndTimeFilter);
						endArray = this._binarySearchElement(aTimeBoundary[1], oTempData[key][sArrayAttribute], sTimeFilter, sEndTimeFilter, startArray);

						if (startArray !== null && endArray !== null && startArray <= endArray){
							//For there is no end_date for oTempData[key][sArrayAttribute], so the endArray needs to plus 2
							startArray = startArray >= 1 ? startArray - 1 : startArray;
							oTempData[key].drawData = oTempData[key][sArrayAttribute].slice(startArray, endArray + 2);
							for (var k = 0; k < aShapeDatas.length; k++){
								if (key !== aShapeDatas[k] && (jQuery.type(oTempData[aShapeDatas[k]]) == "array") && oTempData[aShapeDatas[k]].length > 0) {
									oTempData[aShapeDatas[k]] = oTempData[aShapeDatas[k]].slice(startArray, endArray + 1);
								}
							}
						}
						break;
					}
				}
			}
			aFilterData.push(oTempData);
		}

		return aFilterData;
	};

	UtilizationBarChart.prototype._binarySearchElement = function (value, array, sTimeAttr, sEndTimeAttr, lowValue) {
		var low = 0;
		var high = array.length - 1;
		if (lowValue && lowValue < high) {
			low = lowValue;
		}
		var mid;
		while (low <= high) {
			mid = Math.floor((low + high) / 2);
			var startDate = Format.abapTimestampToDate(array[mid][sTimeAttr]);
			var endDate = Format.abapTimestampToDate(array[mid][sEndTimeAttr]);
			if (!endDate) {
				endDate = startDate;
			}
			if (startDate <= value && value <= endDate) {
				return mid;
			} else if (endDate < value) {
				low = mid + 1;
			} else if (startDate > value) {
				high = mid - 1;
			}
		}
		return mid;
	};

	return UtilizationBarChart;
}, true);
