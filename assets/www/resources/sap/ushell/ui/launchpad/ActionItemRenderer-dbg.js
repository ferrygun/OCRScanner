// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/*global jQuery, sap, navigator*/

sap.ui.define(['sap/m/ButtonRenderer','sap/ui/core/Renderer'],
	function(ButtonRenderer, Renderer) {
	"use strict";

    /*jslint nomen: true*/
    /**
     * @class sap.ushell.ui.launchpad.LoadingDialogRenderer
     * @static
     * @private
     */
    var ActionItemRenderer = {};


    /**
     * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
     *
     * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
     * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered
     * @private
     */
    var ActionItemRenderer = Renderer.extend(ButtonRenderer);



	return ActionItemRenderer;

}, /* bExport= */ true);
