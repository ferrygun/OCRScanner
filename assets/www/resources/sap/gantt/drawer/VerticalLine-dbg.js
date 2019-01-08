/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/misc/Utility", "./Drawer",
	"sap/ui/thirdparty/d3"
], function (Utility, Drawer) {
	"use strict";

	/**
	 * Constructor for a new Vertical Line.
	 *
	 * @class
	 * A drawer for constructing multiple vertical line in the Gantt Chart
	 * @extends sap.gantt.drawer.Drawer
	 *
	 * @author SAP SE
	 * @version 
	 *
	 * @constructor
	 * @private
	 */
	var VerticalLine = Drawer.extend("sap.gantt.drawer.VerticalLine", /** @lends sap.gantt.drawer.VerticalLine.prototype */ {
		/**
		 * VerticalLine drawer.
		 *
		 * @param {object} oAxisTime an object know how to convert time and coordinates
		 */
		constructor : function(oAxisTime) {
			this.oAxisTime = oAxisTime;
		}
	});

	VerticalLine.prototype.drawSvg = function ($GanttChartSvg) {

		var $Chart = jQuery($GanttChartSvg.node()),
			iChartWidth = $Chart.width(),
			iChartHeight = Math.max.apply(null, $Chart.map(function(){ return jQuery(this).height(); }).get());
//			iWindowHeight = document.body.clientHeight;
		// 1month, 1day etc
		var oZoomStrategy = this.oAxisTime.getZoomStrategy();
		var aTickTimeIntervals = this.oAxisTime.getTickTimeIntervalLabel(oZoomStrategy.getTimeLineOption(), null, [0, iChartWidth]);

		// the second item have all the tick time info
		var aTicks = aTickTimeIntervals[1];

		var sPathContent = "";
		// By Default line width is 1, is need to minus the half width of line
		for (var i = 0; i < aTicks.length; i++) {
			sPathContent += " M" +
				" " + (aTicks[i].value - 1 / 2) +
				" 0" +
				" L" +
				" " + (aTicks[i].value - 1 / 2) +
				" " + (iChartHeight);//(iWindowHeight);
		}
		if (sPathContent) {
			$GanttChartSvg.selectAll(".sapGanttChartVerticalLine").remove();
			var $firstRect = jQuery($GanttChartSvg.select("rect").node());
			var sClassName = $firstRect.attr("class") ? $firstRect.attr("class").split(" ")[0] : "";
			if (sap.ui.getCore().byId(sClassName) && sap.ui.getCore().byId(sClassName).getMetadata().getName() === "sap.gantt.shape.ext.RowBackgroundRectangle") {
				$GanttChartSvg.select("g").append("g").classed("sapGanttChartVerticalLine", true)
				.append("path").attr("d", sPathContent);
			} else {
				$GanttChartSvg.insert("g", ":first-child")
				.classed("sapGanttChartVerticalLine", true)
				.append("path").attr("d", sPathContent);
			}
		}
	};

	VerticalLine.prototype.destroySvg = function ($GanttChartSvg) {
		if ($GanttChartSvg) {
			$GanttChartSvg.selectAll(".sapGanttChartVerticalLine").remove();
		}
	};

	return VerticalLine;
}, true);
