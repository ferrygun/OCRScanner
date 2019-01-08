/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(function() {
	"use strict";

	/**
	 * @class Overlay renderer.
	 * @static
	 * @experimental Since 1.32.0 This class is experimental and might be modified or removed in future versions.
	 */
	var OverlayRenderer = {};

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered
	 */
	OverlayRenderer.render = function(oRm, oControl) {
		// console.log( "sap.ui.vk.OverlayRenderer.render.....\r\n");

		// write the HTML into the render manager
		oRm.write("<div");
		oRm.writeControlData(oControl);
		oRm.addClass("sapUiVkOverlay");
		oRm.writeClasses(oControl);
		oRm.write(">"); // span element
		oRm.write("</div>");

		// update bound data......................................................//
		var oApp;
		if ((oApp = oControl._update())) {
			oControl._load(oApp);
		}
	};

	return OverlayRenderer;

}, /* bExport= */true);
