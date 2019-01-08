/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */

/*global sap window*/

sap.ui.define([
    "sap/ui/core/Control"
], function (Control) {
    "use strict";
    return Control.extend("sap.ovp.ui.OVPWrapper", {
        metadata : {
            library : "sap.ovp",
            designTime: true,
            aggregations : {
                DynamicPage: {type: "sap.ui.core.Control", multiple: false}
            },
            defaultAggregation: "DynamicPage"
        },
        init : function () {
        },
        renderer : function (oRM, oControl) {
            oRM.write("<div");
            oRM.writeControlData(oControl);
            oRM.addClass("ovpWrapper");
            oRM.writeClasses();
            oRM.write(">");
            oRM.renderControl(oControl.getAggregation("DynamicPage"));
            oRM.write("</div>");
        }
    });
}, true);