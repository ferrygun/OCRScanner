/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/drawer/Drawer", 
	// 3rd party lib
	"sap/ui/thirdparty/d3"
], function (Drawer) {
	"use strict";

	var TimePeriodZoomRectangle = Drawer.extend("sap.gantt.drawer.TimePeriodZoomRectangle");

	TimePeriodZoomRectangle.prototype.drawSvg = function (aSvgNode, xPosition) {
		aSvgNode.selectAll(".sapGanttChartTimePeriodZoomRectangle").remove();
		aSvgNode.append("rect")
			.classed("sapGanttChartTimePeriodZoomRectangle", true)
			.attr("x", function() {
				return xPosition;
			})
			.attr("y", function() {
				return 0;
			})
			.attr("height", function() {
				return $(aSvgNode.node()).height();
			});
	};

	TimePeriodZoomRectangle.prototype.updateSvg = function (aSvgNode, iStartPoint, iEndPoint) {
		aSvgNode.selectAll(".sapGanttChartTimePeriodZoomRectangle")
		.attr("x", function() {
			return iStartPoint;
		})
		.attr("width", function() {
			return iEndPoint - iStartPoint;
		});
	};

	TimePeriodZoomRectangle.prototype.destroySvg = function (aSvgNode) {
		aSvgNode.selectAll(".sapGanttChartTimePeriodZoomRectangle").remove();
	};

	return TimePeriodZoomRectangle;
},true);
