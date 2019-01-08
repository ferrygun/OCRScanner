/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */

/*global sap window*/

sap.ui.define(["jquery.sap.global", "sap/ovp/library"],
    function(jQuery) {
        "use strict";

        var CardContentContainer = sap.m.FlexBox.extend("sap.ovp.ui.CardContentContainer", {
            metadata: {
                library: "sap.ovp"
            },
            renderer: {
                render: function (oRm, oControl) {
                    oRm.write("<div");
                    oRm.writeControlData(oControl);
                    oRm.addClass("sapOvpCardContentContainer");
                    oRm.writeClasses();
                    oRm.write(">");
                    var items = oControl.getItems();
                    for (var i = 0; i < items.length; i++) {
                        oRm.renderControl(items[i]);
                    }
                    oRm.write("</div>");
                }
            }

        });


        return CardContentContainer;

    }, /* bExport= */ true);
