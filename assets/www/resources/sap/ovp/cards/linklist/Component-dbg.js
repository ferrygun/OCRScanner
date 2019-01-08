(function() {
	"use strict";
	/*global jQuery, sap */

	jQuery.sap.declare("sap.ovp.cards.linklist.Component");
	jQuery.sap.require("sap.ovp.cards.generic.Component");
	jQuery.sap.require("sap.ovp.cards.linklist.AnnotationHelper");

	sap.ovp.cards.generic.Component.extend("sap.ovp.cards.linklist.Component", {
		// use inline declaration instead of component.json to save 1 round trip

		metadata: {
            properties: {
                /**
                 *  The default values for the properties, if they are not mentioned.
                 *  Example : If headerAnnotationPath is not mentioned in the manifest.json,
                 *  the path mentioned in the "defaultValue" property is used as default.
                 */
                
                "contentFragment": {
                    "type": "string",
                    "defaultValue": "sap.ovp.cards.linklist.LinkList"
                },
                "communicationPath": {
                    "type": "string",
                    "defaultValue": "com.sap.vocabularies.Communication.v1.Contact"
                },
                "headerAnnotationPath": {
                    "type": "string",
                    "defaultValue": "com.sap.vocabularies.UI.v1.HeaderInfo"
                },
                "identificationAnnotationPath": {
                    "type": "string",
                    "defaultValue": "com.sap.vocabularies.UI.v1.Identification"
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
						controllerName: "sap.ovp.cards.linklist.LinkList"
					}
				}
			}
		},

		getCustomPreprocessor: function() {
		}
	});
})();