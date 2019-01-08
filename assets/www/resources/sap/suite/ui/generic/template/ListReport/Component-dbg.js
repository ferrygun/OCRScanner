sap.ui.define(["sap/suite/ui/generic/template/lib/TemplateAssembler",
	"sap/suite/ui/generic/template/ListReport/controller/ControllerImplementation"
], function(TemplateAssembler, ControllerImplementation) {
	"use strict";

	function getMethods(oComponent, oComponentUtils) {
		var oViewProxy = {};

		return {
			oControllerSpecification: {
				getMethods: ControllerImplementation.getMethods.bind(null, oViewProxy),
				oControllerDefinition: {
					getVisibleSelectionsWithDefaults: function() {
						// We need a list of all selection fields in the SmartFilterBar for which defaults are defined
						// (see method setSmartFilterBarDefaults) and which are currently visible.
						// This is needed by _getBackNavigationParameters in the NavigationController.
						var aVisibleFields = [];
							// if(this.oView.byId(this.sPrefix + ".DateKeyDate").getVisible()){
						// aVisibleFields.push("KeyDate");
						// }
						return aVisibleFields;
					},

					// ---------------------------------------------
					// Extensions
					// ---------------------------------------------
					onInitSmartFilterBarExtension: function(oEvent) {},
					getCustomAppStateDataExtension: function(oCustomData) {},
					restoreCustomAppStateDataExtension: function(oCustomData) {},
					onBeforeRebindTableExtension: function(oEvent) {},
					onBeforeRebindChartExtension: function(oEvent) {},
					adaptNavigationParameterExtension: function(oSelectionVariant, oObjectInfo) {},
					onListNavigationExtension: function(oEvent) {},
					getPredefinedValuesForCreateExtension: function(oSmartFilterBar){}
				}
			},
			init: function() {
				var oTemplatePrivate = oComponent.getModel("_templPriv");
				oTemplatePrivate.setProperty("/listReport", {}); // Note that component properties are not yet available here
			},
			onActivate: function() {
				oComponentUtils.setBackNavigation(undefined);
				oViewProxy.onComponentActivate();
			},
			refreshBinding: function(bUnconditional) {
				oViewProxy.refreshBinding();
			},
			getUrlParameterInfo: function() {
				return oViewProxy.getUrlParameterInfo();
			},
			getItems: function(){
				return oViewProxy.getItems();	
			},
			displayNextObject: function(aOrderObjects){
				return oViewProxy.displayNextObject(aOrderObjects);	
			}
		};
	}

	return TemplateAssembler.getTemplateComponent(getMethods,
		"sap.suite.ui.generic.template.ListReport", {
			metadata: {
				library: "sap.suite.ui.generic.template",
				properties: {
					"templateName": {
						"type": "string",
						"defaultValue": "sap.suite.ui.generic.template.ListReport.view.ListReport"
					},
					// hide chevron for unauthorized inline external navigation?
					"hideChevronForUnauthorizedExtNav": {
						"type": "boolean",
						"defaultValue": "false"
					},
					"treeTable": "boolean",
					"tableType": "string",
					"gridTable": "boolean",
					"condensedTableLayout": "boolean",
					"multiSelect": "boolean",
					"smartVariantManagement": "boolean",      // true = one variant for filter bar and table, false = separate variants for filter and table
					"hideTableVariantManagement": "boolean",
					"variantManagementHidden": "boolean",
					"creationEntitySet": "string",
					"isWorklist": "boolean"
				},
				"manifest": "json"
			}
		});
});