/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

sap.ui.define(function() {
	"use strict";

	/**
	 * @class ChartContainer renderer.
	 * @static
	 */
	var ChartContainerRenderer = {};

	/**
	 * Renders the HTML for the given control, using the provided
	 * {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered
	 */
	ChartContainerRenderer.render = function(oRm, oControl) {
		var selectedChart = oControl.getSelectedContent();

		oRm.write("<div");
		oRm.writeControlData(oControl);
		oRm.addClass("sapSuiteUiCommonsChartContainer");
		oRm.writeClasses();
		oRm.write(">");

		// wrapper
		oRm.write("<div");
		oRm.writeAttributeEscaped("id", oControl.getId() + "-wrapper");
		oRm.addClass("sapSuiteUiCommonsChartContainerWrapper");
		oRm.writeClasses();
		oRm.write(">");

		oRm.write("<div");
		oRm.addClass("sapSuiteUiCommonsChartContainerToolBarArea");
		oRm.writeClasses();
		oRm.write(">");
		// toolbar
		oRm.renderControl(oControl.getToolbar());
		oRm.write("</div>");// end toolbar

		// chart part
		oRm.write("<div");
		oRm.writeAttributeEscaped("id", oControl.getId() + "-chartArea");
		oRm.addClass("sapSuiteUiCommonsChartContainerChartArea");
		oRm.writeClasses();
		oRm.write(">");

		if (selectedChart !== null) {
			oRm.renderControl(selectedChart);
		} else if (oControl.getContent().length > 0) {
			selectedChart = oControl.getContent()[0];
			oRm.renderControl(selectedChart);
		}

		oRm.write("</div>");// end chartArea
		oRm.write("</div>"); // end wrapper

		oRm.write("</div>"); // end container
	};

	return ChartContainerRenderer;
}, /* bExport= */ true);
