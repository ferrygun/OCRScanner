// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/*global jQuery, sap*/

sap.ui.define(['sap/ui/core/Renderer','./TileBaseRenderer'],
	function(Renderer, TileBaseRenderer) {
	"use strict";

    /**
     * @name sap.ushell.ui.tile.ImageTileRenderer
     * @static
     * @private
     */

    var ImageTileRenderer = Renderer.extend(TileBaseRenderer);

    /**
     * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
     * 
     * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
     * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered
     *
     * @private
     */
    ImageTileRenderer.renderPart = function (oRm, oControl) {
        // write the HTML into the render manager
        oRm.write("<img");
        oRm.addClass("sapUshellImageTile");
        oRm.writeClasses();
        oRm.writeAttributeEscaped("src", oControl.getImageSource());
        oRm.writeAttributeEscaped("alt", " ");
        oRm.write("/>");
    };


	return ImageTileRenderer;

}, /* bExport= */ true);
