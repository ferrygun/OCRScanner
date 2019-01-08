sap.ui.define(["sap/suite/ui/generic/template/lib/TemplateAssembler",
	"sap/suite/ui/generic/template/AnalyticalListPage/controller/ControllerImplementation"
], function(TemplateAssembler, ControllerImplementation) {
	"use strict";

	function getMethods(oComponent,oComponentUtils) {
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
					onClearFilterExtension: function(oEvent) {},
					adaptNavigationParameterExtension: function(oSelectionVariant, oObjectInfo) {},
					onAfterCustomModelCreation: function(oCustomModel) {},
					getPredefinedValuesForCreateExtension: function(oSmartFilterBar){}
				}
			},
			init: function() {
				var oTemplatePrivate = oComponent.getModel("_templPriv");
				// Note that component properties are not yet available here
				oTemplatePrivate.setProperty("/listReport", {});
				// Property to store UI settings of ALP
				oTemplatePrivate.setProperty("/alp", {
					visualFilter: {}
				}); // Note that component properties are not yet available here

				//Filter model
				var filterModel = new sap.ui.model.json.JSONModel();
				//Model is bound to the component as it affects various controls
				oComponent.setModel(filterModel, "_filter");
			},
			//Adds Pageheader to the FIORI shell
			onActivate: function() {
				oComponentUtils.setBackNavigation(undefined);
				oViewProxy.onComponentActivate();
			},
			refreshBinding: function() {
				oViewProxy.refreshBinding();
			},
			getUrlParameterInfo: function() {
				return oViewProxy.getUrlParameterInfo();
			},
			overwrite: {
				updateBindingContext: function() {

					sap.suite.ui.generic.template.lib.TemplateComponent.prototype.updateBindingContext.apply(oComponent, arguments);

					//commented below as here we get the metamodel only if the oBindingContext is present.
					/*var oBindingContext = oComponent.getBindingContext();
					if (oBindingContext) {
						oComponent.getModel().getMetaModel().loaded()
						.then(
							function() {
								//var oUIModel = oComponent.getModel("ui");

									// set draft status to blank according to UI decision
									// oUIModel.setProperty("/draftStatus", "");

									var oActiveEntity = oBindingContext.getObject();
									if (oActiveEntity) {

										var oDraftController = oComponent.getAppComponent().getTransactionController()
										.getDraftController();
										var oDraftContext = oDraftController.getDraftContext();
										var bIsDraft = oDraftContext.hasDraft(oBindingContext) && !oActiveEntity.IsActiveEntity;
										//var bHasActiveEntity = oActiveEntity.HasActiveEntity;
										if (bIsDraft) {
											oUIModel.setProperty("/editable", true);
											oUIModel.setProperty("/enabled", true);
										}
									}
								});
						//fnBindBreadCrumbs();
					}*/
				}
			}
		};
	}

	return TemplateAssembler.getTemplateComponent(getMethods,
		"sap.suite.ui.generic.template.AnalyticalListPage", {
			metadata: {
				library: "sap.suite.ui.generic.template",
				properties: {
					"templateName": {
						"type": "string",
						"defaultValue": "sap.suite.ui.generic.template.AnalyticalListPage.view.AnalyticalListPage"
					},
					"qualifier": {
						/*
							optional qualifier for a SelectionPresentationVariant or a PresentationVariant
							annotation. If no SelectionPresentationVariant exists with or without qualifier
							a PresentationVariant with the qualifier is searched. It always falls back to default
							of first SPV and than PV if qualifier can not be found
						 */
						"type": "string",
						"defaultValue": ""
					},
					"chartPresentationQualifier": {
						/*
							optional qualifier for a PresentationVariant
							annotation for chart in content area
						 */
						"type": "string",
						"defaultValue": ""
					},
					"gridTable": {
						/*
							This setting allows app developer to use GridTable in content area
							If sap:semantics=aggregate then AnalyticalTable is used and this setting have no effect
							If the display type is not desktop but mobile or tablet or other devices always responsive table is shown.
							Note: This Property is depricated. Use tableType Property to achieve the same henceforth.
							using tableType to get gridTable --> instead of using gridTable === true, use tableType === GridTable.
						 */
						"type": "boolean",
						"defaultValue": false
					},
					"multiSelect": {
						/*
							This setting allows app developer to show checkbox for selecting multiple items in table.
							Only if there are Actions (annotation or manifest), this setting would come into effect.
						 */
						"type": "boolean",
						"defaultValue": false
					},
					"smartVariantManagement": {
						/*
							This setting allows developer to choose Control level variant instead of Page Variant
							CAUTION: Change in this setting would require app developer to recreate all previously
							saved variants.
						 */
						"type": "boolean",
						"defaultValue": true
					},
					"defaultContentView":{
						/*
							This setting allows developer to set the content view which will be displayed on app launch
							If the end user has chosen any other view in their default variants then that will have priority
							over this setting.
							Default is hybrid view (charttable).
							Valid values "charttable", "chart", "table"
						 */
						"type": "string",
						"defaultValue": "charttable"
					},
					"defaultFilterMode": {
						/*
							This setting allows developer to set the default filter mode which will be displayed on app launch
							If the end user has chosen a different filter mode in their default variants then that will have priority
							over this setting.
							Default is visual filter.
							Valid values "visual", "compact"
						 */
						"type": "string",
						"defaultValue": "visual"
					},
					/*
						This setting allows developer to define KPI Tags in ALP, e.g.
						"ActualCosts": {
							"model": "kpi",	//model defined in the manifest sap.ui5.models
							"entitySet": "CZ_PROJECTKPIS",	//name of the entity set, in case of parameterized set please mention result entity set name
							"qualifier": "ActualCosts",	//Qualifier of SelectionPresentationVariant which have a DataPoint and Chart visualization
							"detailNavigation": "ActualCostsKPIDetails"	//[Optional] Key of Outbound navigation defined in sap.app.crossNavigation.outbounds
						}
					*/
					"keyPerformanceIndicators": "array",
					"autoHide": {
						/*
							This setting allows developer to determine chart / table interaction. 'true' would mean chart act as
							filter for table, 'false' would mean that matching table rows are highlighted but table is not
							filtered.
						 */
						"type": "boolean",
						"defaultValue": true
					},
					"showAutoHide": {
						/*
							This setting allows developer to hide the autoHide segmented button. When the button is hidden, default
							chart/table interaction is filter.
						 */
						"type": "boolean",
						"defaultValue": true
					},
					"hideVisualFilter": {
						/*
							DEPRECATED:	This setting allows developer to hide the visual filters.
							PLEASE DO NOT USE THIS SETTING IN NEW PROJECTS
						 */
						"type": "boolean",
						"defaultValue": false
					},
					"showGoButtonOnFilterBar": {
						/*
							This setting allows developer to run ALP in non live mode. When it is set to true, app have a "GO"
							button in the Filter Bar and the filter selections are not applied till Go is pressed.
						 */
						"type": "boolean",
						"defaultValue": false
					},
					"tableType": {
						/*
							This setting allows developer to define the table type of their choice.
							It takes more precedence from any other settings like gridTable.
							Eg : if gridTable == true and tableType === AnalyticalTable it takes more precedence and render Analytical table.
							@since 1711
							Valid values: AnalyticalTable, GridTable or ResponsiveTable
						 */
						"type": "string",
						"defaultValue": ""
					},
					"showItemNavigationOnChart": {
						/*
							This setting allows developer to display a Item Navigation on SmartChart's "Detail" popover list.
						 */
						"type": "boolean",
						"defaultValue": false
					},
					"condensedTableLayout": {
						/*
							This setting allows user to display SmartTable in condensed mode. More line items are visible
							in this mode compared to compact.
						 */
						"type": "boolean",
						"defaultValue": true
					}
				},
				"manifest": "json"
			}
		});
});
