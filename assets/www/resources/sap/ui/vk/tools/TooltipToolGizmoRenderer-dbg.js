/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([
	"jquery.sap.global"
], function(jQuery) {
	"use strict";

	/**
	 * TooltipToolGizmoRenderer renderer.
	 * @namespace
	 * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
	 */
	var TooltipToolGizmoRenderer = {};

	/**
	 * Renders the HTML for the given control, using the provided
	 * {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm
	 *            the RenderManager that can be used for writing to
	 *            the Render-Output-Buffer
	 * @param {sap.ui.core.Control} oControl
	 *            the control to be rendered
	 */
	TooltipToolGizmoRenderer.render = function(oRm, oControl) {

		oRm.write("<div");
		oRm.writeControlData(oControl);
		oRm.addClass("sapUiVizKitTooltip");
		oRm.writeClasses();
		oRm.write(">");
		oRm.write("</div>");

	};

	return TooltipToolGizmoRenderer;

}, /* bExport= */ true);
