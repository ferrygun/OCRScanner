/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides default renderer for control sap.ui.vk.DockManager
sap.ui.define([
	"jquery.sap.global"
], function(jQuery) {
	"use strict";


	/**
	 * vk/DockManager renderer.
	 * @namespace
	 */
	var DockManagerRenderer = {
	};

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRenderManager the RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered
	 */
	DockManagerRenderer.render = function(oRenderManager, oControl){
		// convenience variable
		var rm = oRenderManager;

		// write the HTML into the render manager
		rm.write("<div");
		rm.writeControlData(oControl);
		rm.writeClasses();

		if (oControl.getWidth() && oControl.getWidth() != "") {
			rm.addStyle("width", oControl.getWidth());
		}
		if (oControl.getHeight() && oControl.getHeight() != "") {
			rm.addStyle("height", oControl.getHeight());
		}

		rm.writeStyles();
		rm.write(">"); // DIV element

		// render content
		rm.write("</div>");
	};

	return DockManagerRenderer;

}, /* bExport= */ true);
