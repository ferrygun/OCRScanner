/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */
/*global jQuery, sap, window*/
// Provides default renderer for control sap.ushell.ui.shell.SplitContainer
sap.ui.define(['jquery.sap.global'],
    function (jQuery) {
        "use strict";


        /**
         * SplitContainer renderer.
         * @namespace
         */
        var SplitContainerRenderer = {};

        /**
         * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
         * @param {sap.ui.core.RenderManager} rm the RenderManager that can be used for writing to the Render-Output-Buffer
         * @param {sap.ui.core.Control} oShell an object representation of the control that should be rendered
         */
        SplitContainerRenderer.render = function (rm, oControl) {
            var sId = oControl.getId();

            var bVertical = oControl.getOrientation() === sap.ui.core.Orientation.Vertical;

            rm.write("<div");
            rm.writeControlData(oControl);
            rm.addClass("sapUshellSpltCont");
            rm.addClass("sapUshellSpltCont" + (bVertical ? "V" : "H"));
            if (sap.ui.getCore().getConfiguration().getAnimation()) {
                rm.addClass("sapUshellSpltContAnim");
            }

            if (!oControl.getShowSecondaryContent()) {
                rm.addClass("sapUshellSpltContPaneHidden");
            }
            rm.writeClasses();
            rm.write(">");

            var sSidePaneId = sId + "-pane";
            var sWidth = oControl.getShowSecondaryContent() ? oControl.getSecondaryContentSize() : "0";
            rm.write("<aside id='", sSidePaneId, "' style='width:", sWidth, "'");
            rm.addClass("sapUshellSpltContPane");
            if (!oControl.getShowSecondaryContent()) {
                rm.addClass("sapUshellSplitContSecondClosed");
            }
            rm.writeClasses();
            rm.write(">");
            this.renderSecondaryContent(rm, sSidePaneId, oControl.getSecondaryContent());
            rm.write("</aside>");

            var sCanvasId = sId + "-canvas";
            rm.write("<section id='", sCanvasId, "' class='sapUshellSpltContCanvas'>");
            var oSubHeader = oControl.getAggregation('subHeader');
            this.renderRootContent(rm, sCanvasId, oControl.getContent(), oSubHeader);
            rm.write("</section>");
            rm.write("</div>");
        };

        /*SplitContainerRenderer.renderContent = function (rm, sId, aContent, bRootContent, oSubHeader) {
            if (bRootContent) {
                this.renderRootContent(rm, sId, aContent, oSubHeader);
            } else {
                this.renderSecondaryContent(rm, sId, aContent);
            }
        };*/

        SplitContainerRenderer.renderRootContent = function (rm, sId, aContent, oSubHeader) {
            rm.write("<div id='", sId, "cntnt' class='sapUshellSpltContCntnt'");
            rm.writeAttribute("data-sap-ui-root-content", "true"); // see e.g. sap.m.App#onAfterRendering
            rm.write(">");
            rm.write("<div id='", sId, "subHeader'>");

            if (oSubHeader && oSubHeader.length) {
                rm.renderControl(oSubHeader[0]);
            }

            rm.write("</div>");
            if (aContent && aContent.length) {
                rm.write("<div id='", sId, "rootContent' class='sapUshellSpltContainerContentWrapper'>");
                aContent.forEach(function (oControl, index) {
                    rm.renderControl(oControl);
                });
                rm.write("</div>");
            }
            rm.write("</div>");
        };

        SplitContainerRenderer.renderSecondaryContent = function (rm, sId, aContent) {
            rm.write("<div id='", sId, "cntnt' class='sapUshellSpltContCntnt'");
            rm.writeAttribute("data-sap-ui-root-content", "true"); // see e.g. sap.m.App#onAfterRendering
            rm.write(">");
            for (var i = 0; i < aContent.length; i++) {
                rm.renderControl(aContent[i]);
            }
            rm.write("</div>");
        };


        return SplitContainerRenderer;

}, /* bExport= */ true);
