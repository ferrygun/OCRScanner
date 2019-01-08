/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

sap.ui.define([], function () {
	"use strict";

	/**
	 * LegendContainer renderer.
	 * @namespace
	 */
	var LegendContainerRenderer = {};

	LegendContainerRenderer.render = function(oRm, oControl) {
		oRm.write("<div");
		oRm.writeControlData(oControl);
		oRm.addClass("sapGanttChartLegend");
		oRm.writeClasses();
		oRm.addStyle("width", oControl.getWidth());
		oRm.addStyle("height", "100%");
		oRm.writeStyles();
		oRm.write(">");
		oRm.renderControl(oControl._oNavContainer);
		oRm.write("</div>");
	};
	
	return LegendContainerRenderer;
}, /* bExport= */ true);
