/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/ui/core/Core", "sap/gantt/misc/Utility", "./Drawer", "sap/gantt/misc/Format", "sap/ui/thirdparty/d3"
], function (Core, Utility, Drawer, Format) {
	"use strict";

	/**
	 * Constructor for a new Adhoc Line.
	 *
	 * @class
	 * A drawer for constructing multiple adhoc lines in the Gantt Chart
	 * @extends sap.gantt.drawer.Drawer
	 *
	 * @author SAP SE
	 * @version 
	 *
	 * @constructor
	 * @private
	 */
	var AdhocLine = Drawer.extend("sap.gantt.drawer.AdhocLine", /** @lends sap.gantt.drawer.AdhocLine.prototype */ {
		/**
		 * AdhocLine drawer.
		 *
		 * @param {object} Object that converts time and coordinates
		 */
		constructor : function(oAxisTime) {
			this.oAxisTime = oAxisTime;
		}
	});

	/**
	 * Draw adhoc lines of gantt chart.
	 * 
	 * @param {object} SVG DOM element of chart instances.
	 * @param {sap.gantt.AdhocLine[]} A list of adhoc lines' configuration.
	 * @param {object} Status Set of chart instance. It contains information about the visible time area.
	 */
	AdhocLine.prototype.drawSvg = function ($GanttChartSvg, aAdhocLineConfig, oStatusSet, sLayer) {
		if (!aAdhocLineConfig || aAdhocLineConfig.length == 0) {
			return;
		}

		var oVisibleStartTime = Core.getConfiguration().getRTL() ? oStatusSet.aTimeBoundary[1] : oStatusSet.aTimeBoundary[0],
		oVisibleEndTime = Core.getConfiguration().getRTL() ? oStatusSet.aTimeBoundary[0] : oStatusSet.aTimeBoundary[1];
		//only draw adhoc lines in visible area
		var aVisibleAdhocLines = aAdhocLineConfig.filter(function(oValue, iIndex){
			var oDate = Format.abapTimestampToDate(oValue.getTimeStamp());
			if (oVisibleStartTime <= oDate && oDate <= oVisibleEndTime){
				return true;
			}
			return false;
		});

		$GanttChartSvg.selectAll(".sapGanttChartAdhocLine").remove();

		if (aVisibleAdhocLines.length == 0) {
			return;
		}

		var $Chart = jQuery($GanttChartSvg.node()),
			iChartHeight = Math.max.apply(null, $Chart.map(function(){ return jQuery(this).height(); }).get());

		if (sLayer === sap.gantt.AdhocLineLayer.Top) {
			$GanttChartSvg.append("g")
				.classed("sapGanttChartAdhocLine", true);
		} else if (sLayer === sap.gantt.AdhocLineLayer.Bottom) {
			/* eslint-disable sap-no-element-creation */
			var oAdhocLineG = document.createElementNS(d3.ns.prefix.svg, "g");
			/* eslint-enable sap-no-element-creation */
			oAdhocLineG.setAttribute("class", "sapGanttChartAdhocLine");
			var sWrapSelector = Utility.attributeEqualSelector("id", $GanttChartSvg.attr("id"));
			var aCalendar = jQuery(sWrapSelector).find(".sapGanttChartCalendar");
			var aBackground = jQuery(sWrapSelector).find(".sapGanttChartRowBackground");

			if (aCalendar.length > 0) {
				aCalendar.after(oAdhocLineG);
			} else if (aBackground.length > 0){
				aBackground.after(oAdhocLineG);
			} else {
				$GanttChartSvg.insert("g", ":first-child")
					.classed("sapGanttChartAdhocLine", true);
			}
		}
		var oAdhocLineG = $GanttChartSvg.select(".sapGanttChartAdhocLine");
		var aAdhocLines = oAdhocLineG.selectAll(".sapGanttChartAdhocTimestamp").data(aVisibleAdhocLines);

		var that = this;
		aAdhocLines.enter().append("line")
			.classed("sapGanttChartAdhocTimestamp", true)
			.attr("x1", function (d) {
				return that.oAxisTime.timeToView(Format.abapTimestampToDate(d.getTimeStamp()));
			})
			.attr("y1", function (d) {
				return 0;
			})
			.attr("x2", function (d) {
				return that.oAxisTime.timeToView(Format.abapTimestampToDate(d.getTimeStamp()));
			})
			.attr("y2", function (d) {
				return iChartHeight;
			})
			.attr("stroke",function(d) {
				return d.getStroke();
			})
			.attr("stroke-width", function (d) {
				return d.getStrokeWidth();
			})
			.attr("stroke-dasharray", function (d) {
				return d.getStrokeDasharray();
			})
			.attr("stroke-opacity", function (d) {
				return d.getStrokeOpacity();
			});

		aAdhocLines.selectAll("title").remove();
		aAdhocLines.insert("title", ":first-child")
			.text(function (d) {
				return d.getDescription();
			});
	};

	/**
	 * Remove DOM elements of adhoc lines.
	 */
	AdhocLine.prototype.destroySvg = function ($GanttChartSvg) {
		if ($GanttChartSvg) {
			$GanttChartSvg.selectAll(".sapGanttChartAdhocLine").remove();
		}
	};

	return AdhocLine;
}, true);
