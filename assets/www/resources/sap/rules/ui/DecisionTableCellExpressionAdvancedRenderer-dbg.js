/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2016 SAP SE. All rights reserved
	
 */


sap.ui.define(['jquery.sap.global', 'sap/rules/ui/ExpressionAdvancedRenderer'],

	function(jQuery, sapRulesUiExpressionAdvancedRenderer) {
		"use strict";

		/**
		 * DecisionTableCellExpressionAdvanced  renderer.
		 * @namespace
		 */
		var DecisionTableCellExpressionAdvancedRenderer = {};
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
		DecisionTableCellExpressionAdvancedRenderer.render = function(oRm, oControl) {

			if (!oControl.getVisible()) {
				return;
			}

			oRm.addClass("sapRULTDecisionTableCellExpressionAdvanced");

			sapRulesUiExpressionAdvancedRenderer.render(oRm, oControl);
		};

		return DecisionTableCellExpressionAdvancedRenderer;

	}, /* bExport= */ true);