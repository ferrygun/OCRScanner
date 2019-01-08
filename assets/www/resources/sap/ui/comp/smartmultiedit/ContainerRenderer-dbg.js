/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */
sap.ui.define([ "jquery.sap.global" ], function(jQuery) {
	"use strict";
	/**
	 * @class Form renderer.
	 * @static
	 * @version 1.52.4
	 * @experimental since 1.52.0
	 * @since 1.52.0
	 * @sap-restricted sap.ui.comp.smartmultiedit.Form
	 */
	var ContainerRenderer = {};

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 */
	ContainerRenderer.render = function(oRm, oControl) {
		oRm.write("<div");
		oRm.writeControlData(oControl);
		oRm.writeClasses();
		oRm.write(">");
		if (oControl._bReadyToRender) {
			oRm.renderControl(oControl.getLayout());
		}
		oRm.write("</div>");
	};

	return ContainerRenderer;

}, /* bExport= */true);
