sap.ui.define(["jquery.sap.global", "sap/suite/ui/generic/template/detailTemplates/detailUtils", "sap/suite/ui/generic/template/Canvas/extensionAPI/ExtensionAPI"],
	function(jQuery, detailUtils, ExtensionAPI) {
		"use strict";

		return {
			getMethods: function(oViewProxy, oTemplateUtils, oController) {
				
				var oBase = detailUtils.getControllerBase(oViewProxy, oTemplateUtils, oController);
				// Generation of Event Handlers
				var oControllerImplementation = {
					onInit: function() {
						var oComponent = oController.getOwnerComponent();
						var oRequiredControls = oComponent.getRequiredControls();
						oBase.onInit(oRequiredControls);
					},

					handlers: {

					},

					extensionAPI: new ExtensionAPI(oTemplateUtils, oController, oBase)
				};
				
				oControllerImplementation.handlers = jQuery.extend(oBase.handlers, oControllerImplementation.handlers);
				oViewProxy.onComponentActivate = oBase.onComponentActivate;
					
				return oControllerImplementation;
			}
		};
	});