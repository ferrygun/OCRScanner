/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/misc/Utility", "./Drawer",
	"sap/ui/thirdparty/d3"
], function (Utility, Drawer) {
	"use strict";

	/*
	 * Default triangle length of side
	 */
	var mLengthOfSide = 8;

	/**
	 * Constructor for a NowLine.
	 *
	 * @class
	 * The Now line indicate the current date and time in Gantt Chart
	 * @extends sap.gantt.drawer.Drawer
	 * @constructor
	 * @private
	 * @alias sap.gantt.drawer.NowLine
	 */
	var NowLine = Drawer.extend("sap.gantt.drawer.NowLine", /** @lends sap.gantt.drawer.NowLine.prototype */ {
		/**
		 * Formatter for NowLine drawer.
		 *
		 * @param {object} oAxisTime an object know how to convert time and coordinates
		 */
		constructor : function(oAxisTime) {
			this.oAxisTime = oAxisTime;
		}
	});

	/*
	 * Drawer for NowLine.
	 * ___
	 * \ /
	 *  | It has two parts, header and body. Due to the Gantt Chart has two separate SVG documents represent Axis time header
	 *  | and body respectively, here we also need to draw SVG line separately.
	 */
	NowLine.prototype.drawSvg = function ($GanttChartSvg, $GanttChartHeaderSvg) {

		// Remove the line before drawing first
		this.destroySvg($GanttChartSvg, $GanttChartHeaderSvg);

		var iNowLineAxisX = this.oAxisTime.getNowLabel()[0].value;

		var iChartWidth = jQuery($GanttChartSvg.node()).width();
		if (iNowLineAxisX > iChartWidth) {
			// if the calculated axis-x is larger than the current chart visible area.
			// It means the now line is out of the range so no need to draw anything.
			return;
		}

		var oChartContent = $GanttChartSvg,
			oChartHeader  = $GanttChartHeaderSvg;

		// For Axis X, the start X is calculated from AxitTime based on the latest date time
		// Chart header and content body was separate SVG document and header default height is 64px include 3px bottom padding
		// in order to make the triangle and line connect each other, using 61 as the top point Y Axis coordinate in chart header
		var oStartPoint = {
			x: iNowLineAxisX,
			y: jQuery($GanttChartHeaderSvg.node()).height()
		};
		
		this._drawHeaderTriangle(oStartPoint, oChartHeader);
		this._drawBodyStaightLine(oStartPoint, oChartContent);
	};

	NowLine.prototype._drawHeaderTriangle = function(oStartPoint, oParentSvgNode) {
		var halfTriangleWidth = mLengthOfSide / 2,
			tringleHeight = Math.sqrt(mLengthOfSide * mLengthOfSide - halfTriangleWidth * halfTriangleWidth);

		var aTrianglePoints = [
			oStartPoint,
			{x: oStartPoint.x - halfTriangleWidth, y: oStartPoint.y - tringleHeight},
			{x: oStartPoint.x + halfTriangleWidth, y: oStartPoint.y - tringleHeight},
			oStartPoint
		];
		var fnLine = d3.svg.line()
			.x(function(d) { return d.x; })
			.y(function(d) { return d.y; })
			.interpolate("linera");

		oParentSvgNode.append("g").classed("sapGanttNowLineHeaderSvgPath", true)
			.append("path")
			.attr("d", fnLine(aTrianglePoints));
	};

	NowLine.prototype._drawBodyStaightLine = function(oStartPoint, oParentSvgNode) {
		var aNowlineBody = oParentSvgNode.selectAll(".sapGanttNowLineBodySvgLine")
			.data(function(){
				var iWindowHeight = jQuery(window).height();
				return [{
					x1: oStartPoint.x, y1: 0,
					x2: oStartPoint.x, y2: oStartPoint.y + iWindowHeight
				}];
		});

		aNowlineBody.enter().append("g").classed("sapGanttNowLineBodySvgLine", true);
		var oNowline = aNowlineBody.selectAll("g").data(function(d){
			return [d];
		});
		oNowline.enter().append("line");
		oNowline.attr("x1", function(d){ return d.x1; })
			.attr("y1", function(d){ return d.y1; })
			.attr("x2", function(d){ return d.x2; })
			.attr("y2", function(d){ return d.y2; });
		oNowline.exit().remove();
	};

	NowLine.prototype.destroySvg = function ($GanttChartSvg, $GanttChartHeaderSvg) {
		if ($GanttChartSvg && $GanttChartHeaderSvg) {
			$GanttChartSvg.selectAll(".sapGanttNowLineBodySvgLine").remove();
			$GanttChartHeaderSvg.selectAll(".sapGanttNowLineHeaderSvgPath").remove();
		}
	};

	return NowLine;
}, true);
