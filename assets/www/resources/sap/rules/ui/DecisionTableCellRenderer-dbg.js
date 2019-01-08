/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2016 SAP SE. All rights reserved
	
 */

sap.ui.define(['jquery.sap.global'],

	function(jQuery) {
		"use strict";

		/**
		 * DecisionTableCellExpressionAdvanced renderer.
		 * @namespace
		 */
		var DecisionTableCellRenderer = {};
		/**
		 * Renders the HTML for the given control, using the provided
		 * {@link sap.ui.core.RenderManager}.
		 *
		 * @param {sap.ui.core.RenderManager} oRm
		 *            the RenderManager that can be used for writing to
		 *            the Render-Output-Buffer
		 * @param {sap.rules.ui.ExpressionAdvanced} oControl
		 *            the control to be rendered
		 */
		DecisionTableCellRenderer.render = function(oRm, oControl) {

			if (!oControl.getVisible()) {
				return;
			}

            oRm.write("<div");
            oRm.writeControlData(oControl);
            oRm.addClass("sapRULDecisionTableSCell");
            oRm.writeClasses();
            oRm.write(">");
            oRm.renderControl(oControl.getAggregation("_displayedControl"));
            oRm.write("</div>");
		};

		return DecisionTableCellRenderer;

	}, /* bExport= */ true);