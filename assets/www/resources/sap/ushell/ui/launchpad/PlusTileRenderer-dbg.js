// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/*global jQuery, sap*/
/**
 * @class PlusTile renderer.
 * @static
 * 
 * @private
 */
sap.ui.define(['sap/ushell/resources'],
	function(resources) {
	"use strict";

    /**
     * @class PlusTile renderer.
     * @static
     */
    var PlusTileRenderer = {};
    var translationBundle = resources.i18n;

    /**
     * Renders the HTML for the given control, using the provided
     * {@link sap.ui.core.RenderManager}.
     * 
     * @param {sap.ui.core.RenderManager}
     *            oRm the RenderManager that can be used for writing to the render
     *            output buffer
     * @param {sap.ui.core.Control}
     *            oControl an object representation of the control that should be
     *            rendered
     */
    PlusTileRenderer.render = function (oRm, oControl) {
        oRm.write("<li");
        oRm.writeAttribute("tabindex", "-1");
        oRm.writeControlData(oControl);
        oRm.addClass("sapUshellTile");
        oRm.addClass("sapUshellPlusTile");
        oRm.addClass("sapContrastPlus");
        oRm.addClass("sapMGT");
        oRm.writeClasses();
        oRm.writeAccessibilityState(oControl, {label : translationBundle.getText("TilePlus_label")});
        oRm.write(">");
        oRm.renderControl(oControl.oIcon);
        oRm.write("</li>");
    };


	return PlusTileRenderer;

}, /* bExport= */ true);
