// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/*global jQuery, sap*/
/**
 * @class DashboardGroupsContainer renderer.
 * @static
 *
 * @private
 */

sap.ui.define(function() {
	"use strict";

    var DashboardGroupsContainerRenderer = {};

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
    DashboardGroupsContainerRenderer.render = function (oRm, oControl) {
        oRm.write("<div");
        oRm.writeControlData(oControl);
        oRm.addClass("sapUshellDashboardGroupsContainer");
        oRm.writeClasses();
        if (oControl.getAccessibilityLabel()) {
            oRm.writeAccessibilityState(oControl, {role: "navigation", label : oControl.getAccessibilityLabel()});
        }
        oRm.write(">");

        var aGroups = oControl.getGroups();

        jQuery.each(aGroups, function (index, aGroup) {
            oRm.write("<div");
            oRm.addClass("sapUshellDashboardGroupsContainerItem");
            if (aGroup.getIsGroupLocked() || aGroup.getDefaultGroup()) {
                oRm.addClass("sapUshellDisableDragAndDrop");
            }
            oRm.writeClasses();
            oRm.write(">");

            oRm.renderControl(this);

            oRm.write("</div>");
        });

        //add div with text "tile" in order to support screen reader
        oRm.write("<div");
        oRm.writeAttribute("id", "sapUshellDashboardAccessibilityTileText");
        oRm.writeAttribute("style", "height: 0px; width: 0px; overflow: hidden; float: left;");
        oRm.write(">");
        oRm.write(sap.ushell.resources.i18n.getText("tile"));
        oRm.write("</div>");

        oRm.write("</div>");
    };


	return DashboardGroupsContainerRenderer;

}, /* bExport= */ true);
