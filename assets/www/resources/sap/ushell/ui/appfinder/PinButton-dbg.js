/**
 * @name sap.ushell.ui.appfinder.PinButton
 *
 * @private
 */

sap.ui.define([
    'jquery.sap.global',
    'sap/m/Button'
], function(jQuery, Control) {
    "use strict";

    var PinButton = Control.extend("sap.ushell.ui.appfinder.PinButton", {
        metadata : {
            properties: {
                /**
                 * Defines whether the button should be highlighted or not.
                 * @since 1.42
                 */
                selected: {
                    type: "boolean",
                    group: "Appearance",
                    defaultValue: false
                }
            }
        },
        renderer: {}
    });

    PinButton.prototype.setSelected = function (bSelected) {
        this.setProperty("selected", bSelected, true);
        this.$("inner").toggleClass("sapUshellPinSelected", bSelected);
    };

    PinButton.prototype.onAfterRendering = function () {
        var bSelected = this.getSelected();

        this.$("inner").toggleClass("sapUshellPinSelected", bSelected);
    };

    return PinButton;
});