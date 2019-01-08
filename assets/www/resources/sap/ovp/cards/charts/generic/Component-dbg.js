(function () {
	"use strict";
	/*global jQuery, sap */

	jQuery.sap.declare("sap.ovp.cards.charts.generic.Component");
	jQuery.sap.require("sap.ovp.cards.generic.Component");
	jQuery.sap.require("sap.ovp.cards.charts.VizAnnotationManager");
	jQuery.sap.require("sap.ovp.cards.charts.Utils");
	sap.ovp.cards.generic.Component.extend("sap.ovp.cards.charts.generic.Component", {
		// use inline declaration instead of component.json to save 1 round trip
		metadata: {
			properties: {
				"headerExtensionFragment":{
					"type": "string",
					"defaultValue": "sap.ovp.cards.generic.KPIHeader"
				},
				"selectionAnnotationPath":{
					"type": "string",
					"defaultValue": "com.sap.vocabularies.UI.v1.SelectionVariant"
				},
				"chartAnnotationPath":{
					"type": "string",
					"defaultValue": "com.sap.vocabularies.UI.v1.Chart"
				},
				"presentationAnnotationPath":{
					"type": "string",
					"defaultValue": "com.sap.vocabularies.UI.v1.PresentationVariant"
				},
				"identificationAnnotationPath":{
					"type": "string",
					"defaultValue": "com.sap.vocabularies.UI.v1.Identification"
				},
				"dataPointAnnotationPath":{
					"type": "string",
					"defaultValue": "com.sap.vocabularies.UI.v1.DataPoint"
				}
			},

			version: "1.52.4",

			library: "sap.ovp",

			includes: [],

			dependencies: {
				libs: [],
				components: []
			},
			config: {}
		},

		addTabindex: function() {
			jQuery(".tabindex0").attr("tabindex", 0);
			jQuery(".tabindex-1").attr("tabindex", -1);
		},

		onAfterRendering: function() {
			this.addTabindex();
		}
	});
})();
