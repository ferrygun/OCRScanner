            /*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2016 SAP SE. All rights reserved
	
 */

sap.ui.define(['jquery.sap.global'],
    function() {
        "use strict";

        /**
         * ExpressionAdvanced renderer.
         * @namespace
         */
        var ExpressionAdvancedRenderer = {};

        /*
         * Renders the HTML for the given control, using the provided
         * {@link sap.ui.core.RenderManager}.
         *
         * @param {sap.ui.core.RenderManager} oRm
         *            the RenderManager that can be used for writing to
         *            the Render-Output-Buffer
         * @param {sap.ui.core.Control} oExpressionAdvanced 
         *            the ExpressionAdvanced  to be rendered
         */
        ExpressionAdvancedRenderer.render = function(oRm, oExpressionAdvanced) {
            oRm.write("<div");
            oRm.writeControlData(oExpressionAdvanced);
            oRm.addClass("sapRULExpressionAdvanced");
            oRm.writeClasses();
            oRm.write(">");
            oRm.renderControl(oExpressionAdvanced.getAggregation("_expressionArea"));
            oRm.write("</div>");
        };

    return ExpressionAdvancedRenderer;

}, /* bExport= */ true);