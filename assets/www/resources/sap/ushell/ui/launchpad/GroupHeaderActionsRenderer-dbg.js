// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/*global jQuery, sap*/
/**
 * @class GroupHeaderButton renderer.
 * @static
 * 
 * @private
 */

sap.ui.define(function() {
	"use strict";

    var GroupHeaderActionsRenderer = {};

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
    GroupHeaderActionsRenderer.render = function (oRm, oControl) {
        var isOverflow = oControl.getIsOverflow(),
            isTileActionModeActive = oControl.getTileActionModeActive();

        oRm.write("<div");
        oRm.writeControlData(oControl);
        oRm.writeClasses();
        oRm.write(">");

        var aContent = oControl.getContent();

        if (isTileActionModeActive) {
            if (isOverflow) {
                jQuery.each(oControl._getActionOverflowControll(), function () {
                    oRm.renderControl(this);
                });
            } else {
                jQuery.each(aContent, function () {
                    oRm.renderControl(this);
                });
            }
        }
        oRm.write("</div>");
    };


	return GroupHeaderActionsRenderer;

}, /* bExport= */ true);
