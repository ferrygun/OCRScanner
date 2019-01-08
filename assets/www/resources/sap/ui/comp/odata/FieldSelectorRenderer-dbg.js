/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */
sap.ui.define(['jquery.sap.global'],
	function(jQuery) {
	"use strict";


	/**
	 * @class FieldSelector renderer.
	 * @static
	 */
	var FieldSelectorRenderer = {};
	
	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 * 
	 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered
	 */
	FieldSelectorRenderer.render = function(oRm, oControl) {

		// write the HTML into the render manager
		oRm.write("<span");
		oRm.writeControlData(oControl);
		// oRm.addClass("sapUiCompFieldSelector");
		oRm.writeClasses();
		oRm.write(">"); // span element
		var oContent = oControl.getContent();
		oRm.renderControl(oContent);
		oRm.write("</span>");
	};
	

	return FieldSelectorRenderer;

}, /* bExport= */ true);
