/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

sap.ui.define([], function (Parameters) {
	"use strict";

	/**
	 * Dimension Legend renderer.
	 *
	 * @namespace
	 */
	var DimensionLegendRenderer = {};

	DimensionLegendRenderer.render = function (oRenderManager, oLegend) {
		jQuery.sap.measure.start("DimensionLegendRenderer render","GanttPerf:DimensionLegendRenderer render function");
		oRenderManager.write("<div");
		oRenderManager.writeControlData(oLegend);
		oRenderManager.addStyle("width", "100%");
		oRenderManager.addStyle("height", "100%");
		oRenderManager.addStyle("position", "relative");
		oRenderManager.writeStyles();
		oRenderManager.write(">");

		this.renderSvgDefs(oRenderManager, oLegend);

		oRenderManager.write("<div");
		oRenderManager.addStyle("float", sap.ui.getCore().getConfiguration().getRTL() ? "right" : "left");
		oRenderManager.writeStyles();
		oRenderManager.write(">");
			oRenderManager.write("<svg");
			oRenderManager.writeAttribute("id", oLegend.getId() + "-svg");
			oRenderManager.writeClasses();
			oRenderManager.writeAttributeEscaped("tabindex", (sap.ui.Device.browser.chrome ? null : -1));
			oRenderManager.writeAttributeEscaped("focusable", false);
			oRenderManager.write("></svg>");
			oRenderManager.write("<svg");
			oRenderManager.writeAttribute("id", oLegend.getId() + "-dimension-path");
			oRenderManager.addClass("sapGanttDimensionLegendPath");
			oRenderManager.writeClasses();
			oRenderManager.addStyle("position", "absolute");
			oRenderManager.addStyle(sap.ui.getCore().getConfiguration().getRTL() ? "right" : "left", "0px");
			oRenderManager.writeStyles();
			//in Browser chrome, element still can be focused with tabindex=-1, tabindex=null can avoid that
			oRenderManager.writeAttributeEscaped("tabindex", (sap.ui.Device.browser.chrome ? null : -1));
			oRenderManager.writeAttributeEscaped("focusable", false);
			oRenderManager.write(">");
			oRenderManager.write("</svg>");
			oRenderManager.write("</div>");

			oRenderManager.write("<div><svg");
			oRenderManager.writeAttribute("id", oLegend.getId() + "-dimension-text");
			oRenderManager.addClass("sapGanttDimensionLegendText");
			oRenderManager.writeClasses();
			oRenderManager.addStyle("position", "absolute");
			oRenderManager.addStyle("width", "100px");
			oRenderManager.writeStyles();
			oRenderManager.writeAttributeEscaped("tabindex", (sap.ui.Device.browser.chrome ? null : -1));
			oRenderManager.writeAttributeEscaped("focusable", false);
			oRenderManager.write("></svg></div>");
		oRenderManager.write("</div>");
		jQuery.sap.measure.end("DimensionLegendRenderer render");
	};

	DimensionLegendRenderer.renderSvgDefs = function (oRenderManager, oLegend) {
		var oSvgDefs = oLegend.getSvgDefs();
		if (oSvgDefs) {
			oRenderManager.write("<svg id='" + oLegend.getId() + "-svg-psdef'");
			oRenderManager.addStyle("float", "left");
			oRenderManager.addStyle("width", "0px");
			oRenderManager.addStyle("height", "0px");
			oRenderManager.writeStyles();
			oRenderManager.writeAttributeEscaped("tabindex", (sap.ui.Device.browser.chrome ? null : -1));
			oRenderManager.writeAttributeEscaped("focusable", false);
			oRenderManager.write(">");
			oRenderManager.write(oSvgDefs.getDefString());
			oRenderManager.write("</svg>");
		}
	};

	return DimensionLegendRenderer;
}, true);
