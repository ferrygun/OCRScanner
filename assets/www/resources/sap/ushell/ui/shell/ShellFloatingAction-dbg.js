/*global jQuery, sap*/

/**
 * @name sap.ushell.ui.shell.ShellFloatingAction
 *
 * @private
 */
sap.ui.define(['jquery.sap.global', 'sap/m/Button', 'sap/ushell/library'],
    function (jQuery, Button) {
    "use strict";

    var ShellFloatingAction = Button.extend("sap.ushell.ui.shell.ShellFloatingAction");

    ShellFloatingAction.prototype.init = function () {
        this.addStyleClass("sapUshellShellFloatingAction");
        //call the parent sap.m.Button init method
        if (Button.prototype.init) {
            Button.prototype.init.apply(this, arguments);
        }
    };

    ShellFloatingAction.prototype.exit = function () {
        Button.prototype.exit.apply(this, arguments);
    };

    ShellFloatingAction.prototype.onAfterRendering = function () {
        if (this.data("transformY")){
            this.removeStyleClass('sapUshellShellFloatingActionTransition');
            jQuery(this.getDomRef()).css('transform', "translateY(" + this.data("transformY") + ")");
        } else {
            this.addStyleClass('sapUshellShellFloatingActionTransition');
        }
    };

});
