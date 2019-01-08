/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides default renderer for control sap.ui.vk.FlexibleControl
sap.ui.define([
	"jquery.sap.global"
], function(jQuery) {
	"use strict";


	/**
	 * vk/FlexibleControl renderer.
	 * @namespace
	 */
	var FlexibleControlRenderer = {
	};

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRenderManager the RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.ui.core.Control} oFlexibleControl An object representation of the control that should be rendered
	 */
	FlexibleControlRenderer.render = function(oRenderManager, oFlexibleControl){
		// convenience variable
		var rm = oRenderManager;

		// write the HTML into the render manager
		rm.write("<div");
		rm.writeControlData(oFlexibleControl);
		rm.addClass("sapUiFlexControl");

		if (oFlexibleControl.getWidth() && oFlexibleControl.getWidth() != "") {
			rm.addStyle("width", oFlexibleControl.getWidth());
		}
		if (oFlexibleControl.getHeight() && oFlexibleControl.getHeight() != "") {
			rm.addStyle("height", oFlexibleControl.getHeight());
		}

		rm.writeStyles();
		rm.writeClasses();
		rm.write(">"); // DIV element

		// render content
		var aContent = oFlexibleControl.getContent();
		var layout = oFlexibleControl.getLayout();

		var cellClass = "sapUiFlexCellStacked";

		if (layout == "Vertical") {
			cellClass = "sapUiFlexCellVertical";
		}

		for (var i = 0; i < aContent.length; i++) {
			var content = aContent[i];

			rm.write("<div id=\"" + oFlexibleControl.getId() + "Content_" + i + "\" class=\"" + cellClass + "\"");

			var layoutData = content.getLayoutData();
			if (layoutData && layout != "Stacked") {
				rm.write(" style=\"");

				if (layoutData.getSize() && layoutData.getSize() != "") {
					rm.write("height: " + layoutData.getSize() + ";");
				}
				if (layoutData.getMinSize() && layoutData.getMinSize() != "") {
					rm.write("min-height: " + layoutData.getMinSize() + ";");
				}
				if (layoutData.getMarginTop() && layoutData.getMarginTop() != "") {
					rm.write("margin-top: " + layoutData.getMarginTop() + ";");
				}
				if (layoutData.getMarginBottom() && layoutData.getMarginBottom() != "") {
					rm.write("margin-bottom: " + layoutData.getMarginBottom() + ";");
				}

				rm.write("\"");
			}

			rm.write(">");
			rm.renderControl(content);
			rm.write("</div>");
		}

		rm.write("</div>");
	};

	return FlexibleControlRenderer;

}, /* bExport= */ true);
