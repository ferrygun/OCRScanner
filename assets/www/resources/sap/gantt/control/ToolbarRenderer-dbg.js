/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

sap.ui.define([], function () {
	"use strict";

	/**
	 * Gantt Chart Toolbar renderer.
	 * @namespace
	 */
	var ToolbarRenderer = {};

	ToolbarRenderer.render = function(oRm, oToolbar) {
		var iNumOfToolbarItems = oToolbar.getAllToolbarItems().length;
		oRm.write("<div");
		oRm.writeControlData(oToolbar);
		oRm.addClass("sapGanttToolbar");
		if (iNumOfToolbarItems == 0) {
			oRm.addClass("sapGanttSkipToolbar");
		}
		oRm.writeClasses();
		oRm.write(">");
		oRm.renderControl(oToolbar.getAggregation("_toolbar"));
		oRm.write("</div>");

	};

	return ToolbarRenderer;
}, /* bExport= */ true);
