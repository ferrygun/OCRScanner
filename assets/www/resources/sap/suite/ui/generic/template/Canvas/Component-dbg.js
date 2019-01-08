sap.ui.define(["jquery.sap.global", "sap/suite/ui/generic/template/lib/TemplateAssembler",
	"sap/suite/ui/generic/template/lib/TemplateComponent", "sap/suite/ui/generic/template/detailTemplates/detailUtils",
	"sap/suite/ui/generic/template/Canvas/controller/ControllerImplementation"
], function(jQuery,TemplateAssembler, TemplateComponent, detailUtils, ControllerImplementation) {
	"use strict";

	function getMethods(oComponent, oComponentUtils) {
		var oViewProxy = {};

		var oBase = detailUtils.getComponentBase(oComponent, oComponentUtils, oViewProxy);                         

		var oSpecific =  {
			oControllerSpecification: {
				getMethods: ControllerImplementation.getMethods.bind(null, oViewProxy),
				oControllerDefinition: {
				}
			}
		};
		return jQuery.extend(oBase, oSpecific);
	}

	return TemplateAssembler.getTemplateComponent(getMethods,
		"sap.suite.ui.generic.template.Canvas", {

			metadata: {
				library: "sap.suite.ui.generic.template",
				properties: {
					// reference to smart template
					"templateName": {
						"type": "string",
						"defaultValue": "sap.suite.ui.generic.template.Canvas.view.Canvas"
					},
					"requiredControls": "object"
				},
				// app descriptor format
				"manifest": "json"
			}
		});
});