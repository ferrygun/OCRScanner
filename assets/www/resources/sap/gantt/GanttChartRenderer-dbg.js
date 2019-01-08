/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

sap.ui.define([], function () {
	"use strict";

	/**
	 * Gantt Chart renderer.
	 *
	 * @namespace
	 */
	var GanttChartRenderer = {};

	GanttChartRenderer.render = function (oRenderManager, oGanttChart) {
		jQuery.sap.measure.start("GanttChartRenderer render","GanttPerf:GanttChartRenderer render function");
		
		oRenderManager.write("<div");
		oRenderManager.writeControlData(oGanttChart);
		oRenderManager.addStyle("width", oGanttChart.getWidth());
		oRenderManager.addStyle("height", oGanttChart.getHeight());
		oRenderManager.writeStyles();
		oRenderManager.addClass("sapGanttChart");
		oRenderManager.writeClasses();
		oRenderManager.write(">");

		jQuery.sap.measure.start("GanttChartRenderer renderPaintServer","GanttPerf:GanttChartRenderer renderPaintServer part");
		this.renderSvgDefs(oRenderManager, oGanttChart);
		jQuery.sap.measure.end("GanttChartRenderer renderPaintServer");

		jQuery.sap.measure.start("GanttChartRenderer renderChartHeader","GanttPerf:GanttChartRenderer renderChartHeader part");
		this.renderChartHeader(oRenderManager, oGanttChart);
		jQuery.sap.measure.end("GanttChartRenderer renderChartHeader");

		jQuery.sap.measure.start("GanttChartRenderer renderChartBody","GanttPerf:GanttChartRenderer renderChartBody part");
		this.renderChartBody(oRenderManager, oGanttChart);
		jQuery.sap.measure.end("GanttChartRenderer renderChartBody");

		oRenderManager.write("</div>");

		jQuery.sap.measure.end("GanttChartRenderer render");
	};

	GanttChartRenderer.renderSvgDefs = function (oRenderManager, oGanttChart) {
		var oSvgDefs = oGanttChart.getSvgDefs();
		if (oSvgDefs) {
			oRenderManager.write("<svg id='" + oGanttChart.getId() + "-svg-psdef'");
			oRenderManager.addStyle("float", "left");
			oRenderManager.addStyle("width", "0px");
			oRenderManager.addStyle("height", "0px");
			oRenderManager.writeStyles();
			oRenderManager.write(">");
			oRenderManager.write(oSvgDefs.getDefString());
			oRenderManager.write("</svg>");
		}
	};

	GanttChartRenderer.renderChartHeader = function (oRenderManager, oGanttChart) {
		oRenderManager.write("<div id='" + oGanttChart.getId() + "-header'");
		oRenderManager.addClass("sapGanttChartHeader");
		oRenderManager.writeClasses();
		oRenderManager.write(">");

		oRenderManager.write("<svg id='" + oGanttChart.getId() + "-header-svg'");
		oRenderManager.addClass("sapGanttChartHeaderSvg");
		oRenderManager.writeClasses();

		oRenderManager.write("></svg>");
		oRenderManager.write("</div>");
	};

	GanttChartRenderer.renderChartBody = function (oRenderManager, oGanttChart) {
		oRenderManager.write("<div id='" + oGanttChart.getId() + "-tt'");
		oRenderManager.addClass("sapUiTableHScr");  // force horizontal scroll bar to show
		oRenderManager.addClass("sapGanttChartTT");
		oRenderManager.writeClasses();
		oRenderManager.addStyle("width", oGanttChart.getWidth());
		oRenderManager.addStyle("flex", "1 1 auto");
		oRenderManager.writeStyles();
		oRenderManager.write(">");

		jQuery.sap.measure.start("GanttChartRenderer renderSvgDiv","GanttPerf:GanttChartRenderer renderPaintServer part");
		this.renderBodySvg(oRenderManager, oGanttChart);
		jQuery.sap.measure.end("GanttChartRenderer renderSvgDiv");

		oRenderManager.renderControl(oGanttChart.getAggregation("_treeTable"));
		oRenderManager.write("</div>");
	};	

	GanttChartRenderer.renderBodySvg = function (oRenderManager, oGanttChart) {
		oRenderManager.write("<div id='" + oGanttChart.getId() + "-svg-ctn'");
		oRenderManager.addClass("sapGanttChartSvgCtn");
		oRenderManager.writeClasses();
		oRenderManager.write(">");

		oRenderManager.write("<svg id='" + oGanttChart.getId() + "-svg'");
		oRenderManager.addClass("sapGanttChartSvg");
		oRenderManager.writeClasses();
		oRenderManager.addStyle("height", "100%");
		oRenderManager.writeStyles();
		oRenderManager.write(">");
		oRenderManager.write("</svg>");
		oRenderManager.write("</div>");
	};

	return GanttChartRenderer;
}, true);
