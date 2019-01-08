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
	 * @experimental Since 1.32.0 This class is experimental and might be modified or removed in future versions.
	 */
	var ViewportRenderer = {};

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
	ViewportRenderer.render = function(rm, control) {

		if (control._implementation) {
			rm.renderControl(control._implementation);
		} else {
			rm.write("<div");
			rm.writeControlData(control);
			rm.addClass("sapVizKitViewport");
			rm.writeClasses();
			rm.writeAttribute("tabindex", 0);

			var addStyle = false;
			var width = control.getWidth();
			if (width) {
				rm.addStyle("width", width);
				addStyle = true;
			}
			var height = control.getHeight();
			if (height) {
				rm.addStyle("height", height);
				addStyle = true;
			}
			if (addStyle) {
				rm.writeStyles();
			}

			rm.write(">");
			// rm.writeEscaped("NO CONTENT");
			rm.write("</div>");
		}
	};

	return ViewportRenderer;

}, /* bExport= */ true);
