(function () {
    "use strict";
    /*global jQuery, sap */

    jQuery.sap.declare("sap.ovp.cards.quickview.Component");
    jQuery.sap.require("sap.ovp.cards.generic.Component");

    sap.ovp.cards.generic.Component.extend("sap.ovp.cards.quickview.Component", {
        // use inline declaration instead of component.json to save 1 round trip
        metadata: {
            properties: {
                "contentFragment": {
                    "type": "string",
                    "defaultValue": "sap.ovp.cards.quickview.Quickview"
                },
                "annotationPath": {
                    "type": "string",
                    "defaultValue": "com.sap.vocabularies.UI.v1.Facets"
                },
                "footerFragment": {
                    "type": "string",
                    "defaultValue": "sap.ovp.cards.generic.ActionsFooter"
                }
            },

            version: "1.52.4",

            library: "sap.ovp",

            includes: [],

            dependencies: {
                libs: [],
                components: []
            },
            config: {},
            customizing: {
                "sap.ui.controllerExtensions": {
                    "sap.ovp.cards.generic.Card": {
                        controllerName: "sap.ovp.cards.quickview.Quickview"
                    }
                }
            }
        }
    });
})();
