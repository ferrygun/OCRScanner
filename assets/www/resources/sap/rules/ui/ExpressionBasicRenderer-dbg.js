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
        var ExpressionBasicRenderer = {};

        /*
         * Renders the HTML for the given control, using the provided
         * {@link sap.ui.core.RenderManager}.
         *
         * @param {sap.ui.core.RenderManager} oRm
         *            the RenderManager that can be used for writing to
         *            the Render-Output-Buffer
         * @param {sap.ui.core.Control} oExpressionBasic
         *            the ExpressionBasic  to be rendered
         */
        ExpressionBasicRenderer.render = function(oRm, oExpressionBasic) {
            oRm.write("<div");
            oRm.writeControlData(oExpressionBasic);
            oRm.writeClasses();
            oRm.write(">");
            oRm.renderControl(oExpressionBasic.getAggregation("_instructionRenderer"));
            oRm.write("</div>");
        };

        return ExpressionBasicRenderer;

    }, /* bExport= */ true);