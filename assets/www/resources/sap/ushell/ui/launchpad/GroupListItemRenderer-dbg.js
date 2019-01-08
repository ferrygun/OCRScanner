// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/*global jQuery, sap*/
/**
 * @class GroupListItem renderer.
 * @static
 * 
 * @private
 */

sap.ui.define(['sap/m/ListItemBaseRenderer','sap/ushell/resources'],
	function(ListItemBaseRenderer, resources) {
	"use strict";

    /**
     * @class GroupListItem renderer.
     * @static
     */
    var GroupListItemRenderer = sap.ui.core.Renderer.extend(ListItemBaseRenderer);

    GroupListItemRenderer.renderLIAttributes = function (rm) {
        rm.addClass("sapUshellGroupLI");
        rm.addClass("sapUshellGroupListItem");
    };

    /**
     * Renders the HTML for the list content part of the given control, using the provided
     * {@link sap.ui.core.RenderManager}.
     * 
     * @param {sap.ui.core.RenderManager}
     *            oRm the RenderManager that can be used for writing to the render
     *            output buffer
     * @param {sap.ui.core.Control}
     *            oLI an object representation of the list item control that should be
     *            rendered
     */
    GroupListItemRenderer.renderLIContent = function (rm, oLI) {
        rm.write("<div");
        rm.addClass("sapMSLIDiv");
        rm.addClass("sapMSLITitleDiv");
        rm.writeClasses();

        if (!oLI.getVisible()) {
            rm.addStyle("display", "none");
            rm.writeStyles();
        }
        rm.write(">");

        // List item text (also written when no title for keeping the space)
        rm.write("<div");
        rm.addClass("sapMSLITitleOnly");
        rm.writeClasses();
        rm.write(">");
        rm.writeEscaped(oLI.getTitle());
        rm.write("</div>");

        rm.write("</div>");
    };


	return GroupListItemRenderer;

}, /* bExport= */ true);
