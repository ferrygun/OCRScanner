/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ["jquery.sap.global", "sap/m/Text", "sap/m/TextRenderer", "./TextColor"],
    function (jQuery, SapMText, SapMTextRenderer, SapUiVtmTextColor) {

        "use strict";

        /**
         * Constructor for a new Text.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @name sap.ui.vtm.Text
         * @private
         * @class
         * Adds an <code>textColor</code> property to {@link sap.m.Text}
         * @author SAP SE
         * @version 1.52.0
         * @constructor
         * @param {string?} sId id for the new {@link sap.m.Text} instance.
         * @param {object?} mSettings Object with initial property values, aggregated objects etc. for the new {@link sap.m.Text} instance.
         * @extends sap.m.Text
         */
        sap.ui.vtm.Text = SapMText.extend("sap.ui.vtm.Text", /** @lends sap.ui.vtm.Text.prototype */ {
            metadata: {
                properties: {
                    textColor: {
                        type: "sap.ui.vtm.TextColor",
                        defaultValue: SapUiVtmTextColor.Default,
                        bindable: true
                    }
                }
            },

            renderer: function (oRM, oControl) {
                var textColor = oControl.getTextColor();
                switch (textColor) {
                case SapUiVtmTextColor.Default:
                    break;
                case SapUiVtmTextColor.Grey:
                case SapUiVtmTextColor.Gray:
                    oRM.addClass("sapUiVtmText_TextColor_Gray");
                    break;
                default:
                    throw "Unexpected text color: '" + textColor + "'.";
                }
                SapMTextRenderer.render(oRM, oControl);
            }
        });

        return sap.ui.vtm.Text;
    });