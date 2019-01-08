/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2016 SAP SE. All rights reserved
	
 */

sap.ui.define([
    "jquery.sap.global"
],  function(jQuery) {
		"use strict";

	/**
	 * OdataDecisionTable renderer.
	 * @namespace
	 */
	var DecisionTableRenderer = {};

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
	DecisionTableRenderer.render = function(oRm, oControl) {

		//oRm.addClass("sapUiSizeCozy");
		jQuery.sap.syncStyleClass("sapUiSizeCozy", oControl.getParent(), this.oControl);

		oRm.write("<div");
		oRm.writeControlData(oControl);
		oRm.addClass("sapRULDecisionTable");
		oRm.writeClasses();
		oRm.write(">");
		oRm.renderControl(oControl.getAggregation("_toolbar"));
		oRm.renderControl(oControl.getAggregation("_errorsText"));
		oRm.renderControl(oControl.getAggregation("_table"));
		oRm.write("</div>");

	};

	return DecisionTableRenderer;

}, /* bExport= */ true);