/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

sap.ui.define([
	"jquery.sap.global",
	"sap/fe/core/TemplateAssembler",
	"sap/fe/templates/ObjectPage/controller/ControllerImplementation"
], function (jQuery, TemplateAssembler, ControllerImplementation) {
	"use strict";

	function getMethods(oComponent) {

		var oViewProxy = {};
		return {
			oControllerSpecification: {
				getMethods: ControllerImplementation.getMethods.bind(null, oViewProxy),
				oControllerDefinition: {
					// ---------------------------------------------
					// Extensions
					// ---------------------------------------------

				}
			},
			init: function () {
			},

			preTemplater : function(mParameters, oTemplateUtils){
				return [];
			}
		};
	}

	return TemplateAssembler.getTemplateComponent(getMethods,
		"sap.fe.templates.ObjectPage", {
			metadata: {
				properties: {
					"templateName": {
						"type": "string",
						"defaultValue": "sap.fe.templates.ObjectPage.view.ObjectPage"
					}
				},
				"manifest": "json"
			}
		});
});
