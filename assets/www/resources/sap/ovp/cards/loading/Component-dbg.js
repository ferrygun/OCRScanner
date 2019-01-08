(function () {
    "use strict";
    /*global jQuery, sap */

    jQuery.sap.declare("sap.ovp.cards.loading.Component");
    jQuery.sap.require("sap.ovp.cards.generic.Component");

    sap.ovp.cards.loading.State = {
        ERROR: "Error",
        LOADING: "Loading"
    };

    sap.ovp.cards.generic.Component.extend("sap.ovp.cards.loading.Component", {
        // use inline declaration instead of component.json to save 1 round trip
        metadata: {
            properties: {
                "footerFragment": {
                    "type": "string",
                    "defaultValue": "sap.ovp.cards.loading.LoadingFooter"
                },
                "state": {
                    "type": "string",
                    "defaultValue": sap.ovp.cards.loading.State.LOADING
                }
            },

            version: "1.52.4",

            library: "sap.ovp",
            customizing: {
                "sap.ui.controllerExtensions": {
                    "sap.ovp.cards.generic.Card": {
                        controllerName: "sap.ovp.cards.loading.Loading"
                    }
                }
            }

        }

    });
})();

