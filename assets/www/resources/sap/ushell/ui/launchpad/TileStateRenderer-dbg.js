/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */
/*global jQuery, sap */
sap.ui.define(function() {
	"use strict";

/**
 * @class TileState renderer.
 * @static
 */
var TileStateRenderer = {
};

/**
 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
 * 
 * @param {sap.ui.core.RenderManager} rm the RenderManager that can be used for writing to the render output buffer
 * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered
 */
TileStateRenderer.render = function (rm, oControl) {
    rm.write("<div");

    rm.writeControlData(oControl);

    rm.addClass("sapUshellGT");
    rm.writeClasses();

    rm.write(">");

    var sState = oControl.getState();
    rm.write("<div");
    rm.addClass("sapUshellOverlay");
    rm.writeClasses();
    rm.writeAttribute("id", oControl.getId() + "-overlay");
    if (sState === "Failed") {
        rm.writeAttribute("title", oControl._sFailedToLoad);
    }
    rm.write(">");
    switch (sState) {
    case "Loading":
        var oBusy = new sap.ui.core.HTML({
            content: "<div class='sapUshellTileStateLoading'><div>"
        });
        oBusy.setBusyIndicatorDelay(0);
        oBusy.setBusy(true);
        rm.renderControl(oBusy);
        break;

    case "Failed":
        rm.write("<div");
        rm.writeAttribute("id", oControl.getId() + "-failed-ftr");
        rm.addClass("sapUshellTileStateFtrFld");
        rm.writeClasses();
        rm.write(">");
        rm.write("<div");
        rm.writeAttribute("id", oControl.getId() + "-failed-icon");
        rm.addClass("sapUshellTileStateFtrFldIcn");
        rm.writeClasses();
        rm.write(">");
        rm.renderControl(oControl._oWarningIcon);
        rm.write("</div>");

        rm.write("<div");
        rm.writeAttribute("id", oControl.getId() + "-failed-text");
        rm.addClass("sapUshellTileStateFtrFldTxt");
        rm.writeClasses();
        rm.write(">");
        rm.writeEscaped(oControl._sFailedToLoad);
        rm.write("</div>");

        rm.write("</div>");
        break;
    default:
    }
    rm.write("</div>");
    rm.write("</div>");
};


	return TileStateRenderer;

}, /* bExport= */ true);
