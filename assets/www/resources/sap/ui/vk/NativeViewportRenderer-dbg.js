/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([
	"jquery.sap.global"
], function(jQuery) {
	"use strict";

	/**
	 * Viewport renderer.
	 * @namespace
	 */
	var NativeViewportRenderer = {};

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
	NativeViewportRenderer.render = function(rm, control) {

		rm.write("<div");
		rm.writeControlData(control);
		rm.addClass("sapVizKitNativeViewport");
		rm.writeClasses();
		rm.writeAttribute("tabindex", 0);
		rm.write(">");
		rm.write("</div>");

	};

	return NativeViewportRenderer;

}, /* bExport= */ true);
