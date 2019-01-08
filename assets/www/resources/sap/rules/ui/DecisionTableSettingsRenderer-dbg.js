/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2016 SAP SE. All rights reserved
	
 */

sap.ui.define(['jquery.sap.global'],

	function(jQuery) {
		"use strict";

		/**
		 * DecisionTableSettings renderer.
		 *  @namespace
		 */
		var DecisionTableSettingsRenderer = {};

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
		DecisionTableSettingsRenderer.render = function(oRm, oControl) {

			oRm.write("<div");
			oRm.writeControlData(oControl);
			oRm.addClass("sapRULTDecisionTableSettings");
			oRm.writeClasses();
			oRm.write(">");
			var settings = oControl.getAggregation("mainLayout");
			oRm.renderControl(settings);
			oRm.write("</div>");

		};

		return DecisionTableSettingsRenderer;

	}, /* bExport= */ true);