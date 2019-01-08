/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([
	"jquery.sap.global"
], function(jQuery) {
	"use strict";

	/**
	 * Viewer renderer.
	 * @namespace
	 * @experimental Since 1.32.0 This class is experimental and might be modified or removed in future versions.
	 */
	var ViewerRenderer = {};

	/**
	 * Renders the HTML for the given control, using the provided
	 * {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} rm
	 *            the RenderManager that can be used for writing to
	 *            the Render-Output-Buffer
	 * @param {sap.ui.core.Control} control
	 *            the control to be rendered
	 */
	ViewerRenderer.render = function(rm, control) {

		rm.write("<div");
		rm.writeControlData(control);
		rm.addClass("sapVizKitViewer");
		rm.writeClasses();

		if (control.getWidth()) {
			rm.addStyle("width", control.getWidth());
		}
		if (control.getHeight()) {
			rm.addStyle("height", control.getHeight());
		}
		rm.writeStyles();

		rm.write(">");
		rm.renderControl(control._layout);
		rm.renderControl(control._progressIndicator);
		rm.write("</div>");
	};

	return ViewerRenderer;

}, /* bExport= */ true);
