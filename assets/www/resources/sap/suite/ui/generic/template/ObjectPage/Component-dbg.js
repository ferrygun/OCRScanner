sap.ui.define(["jquery.sap.global", "sap/suite/ui/generic/template/lib/TemplateAssembler",
	"sap/suite/ui/generic/template/lib/TemplateComponent", "sap/suite/ui/generic/template/detailTemplates/detailUtils",
	"sap/suite/ui/generic/template/ObjectPage/controller/ControllerImplementation"
], function(jQuery, TemplateAssembler, TemplateComponent, detailUtils, ControllerImplementation) {
	"use strict";

	function getMethods(oComponent, oComponentUtils) {
		var oViewProxy = {};
		
		var oBase = detailUtils.getComponentBase(oComponent, oComponentUtils, oViewProxy);                         

		var oSpecific = {
			oControllerSpecification: {
				getMethods: ControllerImplementation.getMethods.bind(null, oViewProxy),
				oControllerDefinition: {
					// ---------------------------------------------
					// Extensions
					// ---------------------------------------------
					adaptNavigationParameterExtension: function(oSelectionVariant, oObjectInfo) {},
					onBeforeRebindTableExtension: function(oEvent) {},
					onListNavigationExtension: function(oEvent){}
				}
			},
			getTemplateSpecificParameters: function(){
				return {
					breadCrumb: oComponentUtils.getBreadCrumbInfo()	
				};
			},
			refreshBinding: function(bUnconditional, mRefreshInfos) {
				// default implementation: refresh element binding
				if (bUnconditional) {
					var oElementBinding = oComponent.getComponentContainer().getElementBinding();
					if (oElementBinding) {
						oElementBinding.refresh(true);
					}
				} else {
					oViewProxy.refreshFacets(mRefreshInfos);
				}
			},
			presetDisplayMode: function(iDisplayMode, bIsAlreadyDisplayed){
				if (bIsAlreadyDisplayed){
					return; // wait for the data to come for the case that the view is already displayed
				}
				var oTemplateModel = oComponentUtils.getTemplatePrivateModel();
				oTemplateModel.setProperty("/objectPage/displayMode", iDisplayMode);
			},
			beforeRebind: function(){
				oViewProxy.beforeRebind();
			},
			afterRebind: function(){
				oViewProxy.afterRebind();
			},
			enhanceExtensionAPI4Reuse: function(oExtensionAPI, oEmbeddedComponentInfo){
				oExtensionAPI.setSectionHidden = function(bHidden){
					var oTemplateModel = oComponentUtils.getTemplatePrivateModel();
					oTemplateModel.setProperty("/generic/embeddedComponents/" + oEmbeddedComponentInfo.embeddedKey + "/hidden", bHidden);					
				};	
			}
		};
		return jQuery.extend(oBase, oSpecific);
	}

	return TemplateAssembler.getTemplateComponent(getMethods,
		"sap.suite.ui.generic.template.ObjectPage", {

			metadata: {
				library: "sap.suite.ui.generic.template",
				properties: {
					// reference to smart template
					"templateName": {
						"type": "string",
						"defaultValue": "sap.suite.ui.generic.template.ObjectPage.view.Details"
					},
					// shall button "Related Apps" be visible on the object page?
					"showRelatedApps": {
						"type": "boolean",
						"defaultValue": "false"
					},
					// shall confirmation popup be shown in object page while saving?
					"showConfirmationOnDraftActivate": {
						"type": "boolean",
						"defaultValue": "false"
					},
					// hide chevron for unauthorized inline external navigation?
					"hideChevronForUnauthorizedExtNav": {
						"type": "boolean",
						"defaultValue": "false"
					},
					// shall it be possible to edit the contents of the header?
					"editableHeaderContent": {
						"type": "boolean",
						"defaultValue": "false"
					},
					"gridTable": "boolean",
					"tableType": "string",
					"sections": "object",
					// Shall the simple header facets be used?
					"simpleHeaderFacets": {
						"type": "boolean",
						"defaultValue": "false"
					},
					//Allow deep linking to sub object pages?
					"allowDeepLinking": "boolean",
					//Navigate to list report page on draft activation?
					"navToListOnSave": "boolean"
				},
				// app descriptor format
				"manifest": "json"
			}
		});
});