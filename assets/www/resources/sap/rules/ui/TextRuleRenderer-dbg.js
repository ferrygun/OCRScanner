/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2016 SAP SE. All rights reserved
	
 */

sap.ui.define([
    "jquery.sap.global"
],  function(jQuery) {
		"use strict";

	/**
	 * OdataTextRuleTable renderer.
	 * @namespace
	 */
	var oTextRuleRenderer = {};

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
    oTextRuleRenderer.render = function(oRm, oControl) {

		jQuery.sap.syncStyleClass("sapUiSizeCozy", oControl.getParent(), this.oControl);

		oRm.write("<div");
		oRm.writeControlData(oControl);
		oRm.addClass("sapRULTextRule");
		oRm.writeClasses();
		oRm.write(">");
		oRm.renderControl(oControl.getAggregation("_toolbar"));
		oRm.renderControl(oControl.getAggregation("_verticalLayout"));
		oRm.write("</div>");

	};

	return oTextRuleRenderer;

}, /* bExport= */ true);