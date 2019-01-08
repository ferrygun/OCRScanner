/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

sap.ui.define([
	"sap/ui/core/theming/Parameters"
], function (Parameters) {
	"use strict";

	/**
	 * List Legend renderer.
	 *
	 * @namespace
	 */
	var ListLegendRenderer = {};

	ListLegendRenderer.render = function (oRenderManager, oLegend) {
		jQuery.sap.measure.start("ListLegendRenderer render","GanttPerf:ListLegendRenderer render function");
		var aShapes = oLegend._aShapeInstance,
		sLegendWidth = oLegend.getScaledLegendWidth(),
		sLegendHeight = oLegend.getScaledLegendHeight();

		oRenderManager.write("<div");
		oRenderManager.writeControlData(oLegend);
		oRenderManager.addClass("sapGanttLL");
		oRenderManager.write(">");

		jQuery.sap.measure.start("ListLegendRenderer renderPaintServer","GanttPerf:ListLegendRenderer renderPaintServer part");
		this.renderSvgDefs(oRenderManager, oLegend);
		jQuery.sap.measure.end("ListLegendRenderer renderPaintServer");

		for (var i = 0; i < aShapes.length; i++) {
			var sLegend = aShapes[i].getLegend();
				
			oRenderManager.write("<div");
			oRenderManager.writeAttributeEscaped("title", sLegend);
			oRenderManager.addClass("sapGanttLLItem");
			oRenderManager.writeClasses();
			oRenderManager.addStyle("height", sLegendHeight + "px");
			oRenderManager.addStyle("line-height", sLegendHeight + "px");
			oRenderManager.writeStyles();
			oRenderManager.write(">");

				if (oLegend._aCheckBoxes[i]) {
					if (aShapes[i].mShapeConfig.getSwitchOfCheckBox() == "noShow") {
						oLegend._aCheckBoxes[i].addStyleClass("noShowCheckBox");
					}
					oRenderManager.renderControl(oLegend._aCheckBoxes[i]);
				}

				oRenderManager.write("<svg");
				oRenderManager.writeAttribute("id", oLegend.getId() + "-svg-" + i);
				oRenderManager.addClass("sapGanttLLSvg");
				oRenderManager.addStyle("width", sLegendWidth + "px");
				oRenderManager.writeStyles();
				oRenderManager.writeAttributeEscaped("tabindex", -1);
				oRenderManager.writeAttributeEscaped("focusable", false);
				if (oLegend._aCheckBoxes.length == 0) {
					oRenderManager.addClass("NoCheckBox");
				}
				oRenderManager.writeClasses();
				oRenderManager.write("></svg>");

				oRenderManager.write("<div");
				oRenderManager.writeAttribute("id", oLegend.getId() + "-txt-" + i);
				oRenderManager.addClass("sapGanttLLItemTxt");
				oRenderManager.writeClasses();
				oRenderManager.addStyle("font-size", oLegend.getFontSize() + "px");
				oRenderManager.writeStyles();
				oRenderManager.write(">");
					if (sLegend) {
						oRenderManager.writeEscaped(sLegend);
					}
				oRenderManager.write("</div>");
			oRenderManager.write("</div>");
		}
		oRenderManager.write("</div>");
		jQuery.sap.measure.end("ListLegendRenderer render");
	};

	ListLegendRenderer.renderSvgDefs = function (oRenderManager, oLegend) {
		var oSvgDefs = oLegend.getSvgDefs();
		if (oSvgDefs) {
			oRenderManager.write("<svg");
			oRenderManager.writeAttribute("id", oLegend.getId() + "-svg-psdef");
			oRenderManager.addClass("sapGanttLLSvgDefs");
			oRenderManager.writeClasses();
			oRenderManager.write(">");
			oRenderManager.write(oSvgDefs.getDefString());
			oRenderManager.write("</svg>");
		}
	};

	return ListLegendRenderer;
}, true);
