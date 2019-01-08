// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/*global jQuery, sap*/

sap.ui.define(['sap/ui/core/Renderer','./TileBaseRenderer'],
	function(Renderer, TileBaseRenderer) {
	"use strict";

    /**
     * @name sap.ushell.ui.tile.StaticTileRenderer
     * @static
     * @private
     */
    var StaticTileRenderer = Renderer.extend(TileBaseRenderer);

    /**
     * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
     *
     * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
     * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered
     *
     * @private
     */
    StaticTileRenderer.renderPart = function (oRm, oControl) {
        // write the HTML into the base classes' render manager
        oRm.write("<span");
        oRm.addClass("sapUshellStaticTile");
        oRm.writeClasses();
        oRm.write(">");

        // span element
        oRm.write("</span>");
    };


	return StaticTileRenderer;

}, /* bExport= */ true);
