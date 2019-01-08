// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/*global jQuery, sap*/

sap.ui.define([
    'sap/ushell/resources',
    'sap/m/Text'],
    function (resources, Text) {
        "use strict";

        /**
         * @class LinkTileWrapper renderer.
         * @static
         *
         * @private
         */
        var LinkTileWrapperRenderer = {};
        // var translationBundle = sap.ushell.resources.i18n;

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
        LinkTileWrapperRenderer.render = function (oRm, oControl) {
            var oTileView = null,
                layoutPosition,
                stylePosition,
                oModel = oControl.getModel();

            try {
                oTileView = oControl.getTileViews()[0];
            } catch (ex) {
                jQuery.sap.log.warning("Failed to load tile view: ", ex.message);
                oTileView = new Text({ text: "Failed to load. "});
            }

            oRm.write("<div");

            // if xRay is enabled
            if (oModel && oModel.getProperty("/enableHelp")) {
                // currently only the Tile (and the Tile's footer) has a data attribute in teh xRay integration
                // (as using this value as a class value instead as done in all of the static elements causes parsing errors in the xRay hotspot definition flow)
                oRm.writeAttribute("data-help-id", oControl.getTileCatalogId());// xRay support
            }
            oRm.writeControlData(oControl);
            oRm.addClass("sapUshellLinkTile");
            if (!oControl.getVisible()) {
                oRm.addClass("sapUshellHidden");
            }
            //TODO:Check this
            if (oControl.getIsLocked()) {
                oRm.addClass("sapUshellLockedTile");
            }
            oRm.writeClasses();
            if (oControl.getIeHtml5DnD()) {
                oRm.writeAttribute("draggable", "true");
            }
            oRm.writeAttributeEscaped("tabindex", "-1");
            layoutPosition = oControl.data('layoutPosition');
            if (layoutPosition) {
                stylePosition = '-webkit-transform:' + layoutPosition.translate3D + ';-ms-transform:' + layoutPosition.translate2D + ';transform:' + layoutPosition.translate3D;
                oRm.writeAttribute("style", stylePosition);
            }

            oRm.write(">");

            // Tile Content
            if (this.renderTileView) {
                this.renderTileView(oRm, oTileView, oControl.getTarget());
            }

            oRm.write("</div>");
        };

        LinkTileWrapperRenderer.renderTileView = function (oRm, oTileView, sTarget) {
            oRm.write("<div");
            oRm.addClass("sapUshellTileInner");
            oRm.writeClasses();
            oRm.writeAttribute("title", oTileView && oTileView.getText ? oTileView.getText() : '');
            oRm.write(">");
            oRm.renderControl(oTileView);
            oRm.write("</div>");
        };

        return LinkTileWrapperRenderer;
    },/*bExport=*/true);
