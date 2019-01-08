/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("sap.ca.ui.FileUploadRenderer");
jQuery.sap.require("sap.m.ListRenderer");

jQuery.sap.require("sap.ca.ui.JS.jquery-ui-widget");
jQuery.sap.require("sap.ca.ui.JS.jquery-iframe-transport");
jQuery.sap.require("sap.ca.ui.JS.jquery-fileupload");

/**
 * @class FileUpload renderer.
 * @static
 */
sap.ca.ui.FileUploadRenderer = {};

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
sap.ca.ui.FileUploadRenderer.render = function (oRm, oControl) {
    // write the HTML into the render manager

    //only render control if it's been data bound
    if (oControl._isDataBound) {
        oRm.write("<div");
        oRm.writeControlData(oControl);
        oRm.addClass("sapCaUiFU");
        oRm.writeClasses();
        oRm.write(">");

        oRm.write("<div ");
        oRm.addClass("sapCaUiFUHeader");
        oRm.writeClasses();
        oRm.write(">");

        oRm.renderControl(oControl.getAggregation("toolBar"));
        if (oControl.getUploadEnabled()) {
            oRm.renderControl(oControl.getUploadProgressLabel());
            oRm.write("<input type='file' name='files[]' tabindex='-1' ");
            oRm.writeAttributeEscaped("id", oControl.getId() + "-upload");

            //this is required for ios in order to allow camera capture
            //otherwise, it will only allow selecting from albums
            if (jQuery.device.is.ipad || jQuery.device.is.iphone) {
                oRm.write(" capture='camera' ");
            } else if (oControl.getMultipleSelectionEnabled()) {
                oRm.write(" multiple ");
            }
            oRm.write("></input>");
        }
        oRm.write("</div>");
        oRm.renderControl(oControl.getAggregation("_fileList"));
        oRm.write("</div>");
    }
};


