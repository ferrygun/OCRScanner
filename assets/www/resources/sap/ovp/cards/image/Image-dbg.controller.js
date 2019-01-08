(function () {
    "use strict";
    /*global sap, jQuery */

    sap.ui.controller("sap.ovp.cards.image.Image", {
        onInit: function () {
        },

        onImagePress: function (oEvent) {
            this.doNavigation(oEvent.getSource().getBindingContext());
        }

    });
})();
