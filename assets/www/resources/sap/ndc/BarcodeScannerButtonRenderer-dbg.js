/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */
sap.ui.define(['jquery.sap.global'],
	function(jQuery) {
	"use strict";


	/**
	 * @class BarcodeScannerButton renderer.
	 * @static
	 */
	var BarcodeScannerButtonRenderer = {};
	
	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 * 
	 * @param {sap.ui.core.RenderManager}
	 *            oRm the RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control}
	 *            oControl an object representation of the control that should be rendered
	 */
	BarcodeScannerButtonRenderer.render = function(oRm, oControl) {
		
		if (!oControl.getVisible()) {
			return;
		}
		//we need this additional wrapping elemlent to be able to control this button from our controller.
		oRm.write("<span");
		oRm.writeControlData(oControl);
		// we need to change the containing span tag's width instead of the button
		oRm.write(" style=\"display:inline-block;width:" + oControl.getWidth() + ";\">");
		oRm.renderControl(oControl.getAggregation("_btn"));
		oRm.write("</span>");
	};
	

	return BarcodeScannerButtonRenderer;

}, /* bExport= */ true);
