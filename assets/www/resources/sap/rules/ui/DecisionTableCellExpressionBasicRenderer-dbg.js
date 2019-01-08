/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2016 SAP SE. All rights reserved
	
 */


sap.ui.define(['jquery.sap.global', 'sap/rules/ui/ExpressionBasicRenderer'],

    function(jQuery, sapRulesUiExpressionBasicRenderer) {
        "use strict";

        /**
         * DecisionTableCellExpressionBasic  renderer.
         * @namespace
         */
        var DecisionTableCellExpressionBasicRenderer = {};
        /**
         * Renders the HTML for the given control, using the provided
         * {@link sap.ui.core.RenderManager}.
         *
         * @param {sap.ui.core.RenderManager} oRm
         *            the RenderManager that can be used for writing to
         *            the Render-Output-Buffer
         * @param {sap.rules.ui.ExpressionBasic} oControl
         *            the control to be rendered
         */
        DecisionTableCellExpressionBasicRenderer.render = function(oRm, oControl) {

            if (!oControl.getVisible()) {
                return;
            }

            oRm.addClass("sapRULTDecisionTableCellExpressionBasic");

            sapRulesUiExpressionBasicRenderer.render(oRm, oControl);
        };

        return DecisionTableCellExpressionBasicRenderer;

    }, /* bExport= */ true);