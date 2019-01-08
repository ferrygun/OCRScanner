/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define(function() {
	"use strict";

	/**
	 * @class VizContainer renderer.
	 * @static
	 */
	var VizContainerRenderer = {};

	/**
	 * Renders the HTML for the given control, using the provided
	 * {@link sap.ui.core.RenderManager}.
	 * 
	 * @param {sap.ui.core.RenderManager}
	 *            oRm the RenderManager that can be used for writing to the render
	 *            output buffer
	 * @param {sap.ui.core.Control}
	 *            oControl an object representation of the control that should be
	 *            rendered
	 */
	VizContainerRenderer.render = function(oRm, oControl) {

		// write the HTML into the render manager
		// oRm.write("<DIV>This is sap.viz.ui5.VizContainer</DIV>");
		oRm.write("<DIV");
		oRm.writeControlData(oControl);

		oRm.addClass("sapVizContainer");
		oRm.writeClasses();
		if (oControl.getWidth()) {
			oRm.addStyle("width", oControl.getWidth());
		} else {
			oRm.addStyle("width", "100%");
		}
		if (oControl.getHeight()) {
			oRm.addStyle("height", oControl.getHeight());
		} else {
			oRm.addStyle("height", "100%");
		}
		oRm.writeStyles();
		oRm.write(">");

		oRm.write("</DIV>");
	};


	return VizContainerRenderer;

}, /* bExport= */ true);
