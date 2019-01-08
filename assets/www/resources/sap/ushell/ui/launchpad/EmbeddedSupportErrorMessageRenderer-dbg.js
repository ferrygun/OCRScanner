// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(['sap/m/DialogRenderer','sap/ui/core/Renderer'],
	function(DialogRenderer, Renderer) {
	"use strict";

    /*global jQuery, sap*/

    /**
     * @name sap.ushell.ui.launchpad.EmbeddedSupportErrorMessage
     * @static
     * @private
     */
    var EmbeddedSupportErrorMessageRenderer = Renderer.extend(DialogRenderer);

    /**
     * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
     * 
     * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
     * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered
     */



	return EmbeddedSupportErrorMessageRenderer;

}, /* bExport= */ true);
