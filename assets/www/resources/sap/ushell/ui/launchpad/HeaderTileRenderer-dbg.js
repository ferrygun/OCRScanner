// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

/**
 * @class HeaderTile renderer.
 * @static
 *
 * @private
 */
sap.ui.define(['sap/ushell/resources'],
    function (resources) {
        "use strict";

        var HeaderTileRenderer = {},
            translationBundle = resources.i18n;

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
        HeaderTileRenderer.render = function (oRm, oControl) {
            oRm.write("<");
            oRm.write(oControl.getHeaderLevel().toLowerCase());
            oRm.writeControlData(oControl);
            oRm.addClass("sapUshellHeaderTile");
            if (!oControl.getVisible()) {
                oRm.addClass("sapUshellHidden");
            }
            oRm.writeClasses();
            oRm.writeAccessibilityState(oControl, {label : oControl.getHeaderText() + translationBundle.getText("HeaderCategory")});
            oRm.write(">");
            oRm.writeEscaped(oControl.getHeaderText());
            oRm.write("</");
            oRm.write(oControl.getHeaderLevel().toLowerCase());
            oRm.write(">");
        };

        return HeaderTileRenderer;
    });