sap.ui.define(["sap/m/OverflowToolbar","sap/m/ToolbarSpacer","sap/m/FlexItemData", "sap/m/ToolbarDesign",
		"sap/ui/core/mvc/Controller",
		"sap/suite/ui/generic/template/AnalyticalListPage/controller/SmartChartController",
		"sap/suite/ui/generic/template/AnalyticalListPage/controller/DetailController"
	],
	function(OverflowToolbar, ToolbarSpacer, FlexItemData, ToolbarDesign, Controller, SmartChartController, DetailController ) {
		"use strict";
		var oController = Controller.extend("sap.suite.ui.generic.template.AnalyticalListPage.controller.ContentAreaController", {

			/**
			 * This function set the object state
			 * @param  {object} oState object state
			 * @return {void}
			 */
			setState: function(oState) {
				if (oState.oSmartChart) {
					oState.chartController = new SmartChartController();
					oState.chartController.setState(oState);
				}
				if (oState.oSmartTable) {
					oState.detailController = new DetailController();
					oState.detailController.setState(oState);
				}
				this.oState = oState;
				oState.bCustomViewExist = (oState.oController.byId("template::contentViewExtensionToolbar") !== undefined);
				oState.toolbarController.setState(oState);
			},
			/**
			 * This function enables the toolbar
			 * @return {void}
			 */
			enableToolbar: function() {
				if (this.oState.oSmartChart) {
					this.oState.oSmartChart.getToolbar().setEnabled(true);
				}
				if (this.oState.oSmartTable) {
					this.oState.oSmartTable.getCustomToolbar().setEnabled(true);
				}
			},
			/**
			 * This function create a custom model for app developer
			 * @return {void}
			 */
			createAndSetCustomModel: function(oState) {
				var oCustomModel = new sap.ui.model.json.JSONModel();
				oCustomModel.setData({
					required: {
						master: true
					},
					icon: {
						master: "sap-icon://vertical-bar-chart-2",
						hybrid: "sap-icon://chart-table-view",
						customview: "sap-icon://grid"
					},
					tooltip: {
						master: "{i18n>CONTAINER_VIEW_CHART}",
						hybrid: "{i18n>CONTAINER_VIEW_CHARTTABLE}",
						customview: "Custom View"
					}
				});
				//provides a way to change the data in custom model
				oState.oController.onAfterCustomModelCreation(oCustomModel);
				oState.oController.oView.setModel(oCustomModel, "alpCustomModel");
			}
		});
		return oController;
	});