sap.ui.define([

    "sap/m/NumericContent"

], function (NumericContent) {
    "use strict";
    /*jQuery.sap.declare("sap.ovp.cards.generic");*/
    return NumericContent.extend("sap.ovp.ui.OVPNumericContent", {

        /*metadata: {

         aggregations: {
         customData: {type: "sap.ui.core.CustomData", multiple: false}
         }
         },*/

        renderer: {

            _renderScaleAndIndicator: function (oRm, oControl, isIndicator, isScale, withoutMargin, textIndicator, textScale) {
                if (isIndicator || isScale) {
                    var sState = oControl.getState();
                    var sColor = oControl.getValueColor();
                    oRm.write("<div");
                    oRm.addClass("sapMNCIndScale");
                    oRm.addClass(withoutMargin);
                    oRm.addClass(sState);
                    oRm.writeClasses();
                    oRm.write(">");

                    oRm.write("<div");
                    oRm.writeAttribute("id", oControl.getId() + "-indicator");
                    oRm.addClass("sapMNCIndicator");
                    oRm.addClass(textIndicator);
                    oRm.addClass(sState);
                    oRm.addClass(sColor);
                    oRm.writeClasses();
                    oRm.write("/>");

                    if (isScale) {
                        oRm.write("<div");
                        oRm.writeAttribute("id", oControl.getId() + "-scale");
                        oRm.addClass("sapMNCScale");
                        oRm.addClass(sState);
                        oRm.addClass(sColor);
                        oRm.writeClasses();
                        oRm.write(">");
                        oRm.writeEscaped(textScale);
                        oRm.write("</div>");
                    }

                    oRm.write("</div>");

                }

            }
        }

    })
});
