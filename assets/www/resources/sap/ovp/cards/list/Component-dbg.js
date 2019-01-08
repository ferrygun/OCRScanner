(function () {
    "use strict";
    /*global jQuery, sap */

    jQuery.sap.declare("sap.ovp.cards.list.Component");
    jQuery.sap.require("sap.ovp.cards.generic.Component");

    sap.ovp.cards.generic.Component.extend("sap.ovp.cards.list.Component", {
        // use inline declaration instead of component.json to save 1 round trip
        metadata: {
            properties: {
                "contentFragment": {
                    "type": "string",
                    "defaultValue": "sap.ovp.cards.list.List"
                },
                "annotationPath": {
                    "type": "string",
                    "defaultValue": "com.sap.vocabularies.UI.v1.LineItem"
                },
                "countHeaderFragment":{
                    "type": "string",
                    "defaultValue": "sap.ovp.cards.generic.CountHeader"
                },
                "headerExtensionFragment":{
                    "type": "string",
                    "defaultValue": "sap.ovp.cards.generic.KPIHeader"
                }
            },

            version: "1.52.4",

            library: "sap.ovp",

            includes: [],

            dependencies: {
                libs: ["sap.suite.ui.microchart"],
                components: []
            },
            config: {},
            customizing: {
                "sap.ui.controllerExtensions": {
                    "sap.ovp.cards.generic.Card": {
                        controllerName: "sap.ovp.cards.list.List"
                    }
                }
            }
        }
    });
})();
