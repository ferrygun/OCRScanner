/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([
	"jquery.sap.global"
], function(jQuery) {
	"use strict";

	/**
	 * Step Navigation renderer.
	 * @namespace
	 * @experimental Since 1.32.0 This class is experimental and might be modified or removed in future versions.
	 */
	var StepNavigationRenderer = {};

	/**
	* Renders the HTML for the given control, using the provided
	* {@link sap.ui.core.RenderManager}.
	*
	* @param {sap.ui.core.RenderManager} rm
	*the RenderManager that can be used for writing to
	*the Render-Output-Buffer
	* @param {sap.ui.core.Control} control
	*the control to be rendered
	*/
	StepNavigationRenderer.render = function(rm, control) {
		// return immediately if control is invisible
		if (!control.getVisible()) {
		return;
		}

		if (control.getShowToolbar() || control.getShowThumbnails) {
			var oWidth = control.getWidth() !== "auto" ? control.getWidth() : "100%";
			var oHeight = control.getHeight() !== "auto" ? control.getHeight() : "auto";

			rm.write("<div");
			rm.addStyle("width", oWidth);
			rm.addStyle("height", oHeight);
			rm.writeControlData(control);
			rm.addClass("sapVizKitStepNavigation");
			rm.writeClasses();

			var sTooltip = control.getTooltip_AsString();
			if (sTooltip) {
				rm.writeAttributeEscaped("title", sTooltip);
			}

			if (!control.getVisible()) {
				rm.addStyle("visibility", "hidden");
			}
			rm.writeStyles();

			rm.write(">");
			rm.renderControl(control.getAggregation("layout"));
			if (control.getShowThumbnails()) {
				StepNavigationRenderer._renderScrollerDiv(rm, control);
			}
			rm.write("</div>");
		}

	};

	StepNavigationRenderer._renderScrollerDiv = function(rm, control) {
		rm.renderControl(control.getAggregation("thumbnailsContainer"));
	};

	return StepNavigationRenderer;

}, /* bExport= */ true);
