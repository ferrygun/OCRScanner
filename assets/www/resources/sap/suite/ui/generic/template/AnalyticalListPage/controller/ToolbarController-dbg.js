sap.ui.define(["sap/m/SegmentedButtonItem", "sap/m/Button", "sap/m/ButtonType", "sap/ui/base/EventProvider", "sap/m/SegmentedButton","sap/ui/core/mvc/Controller"
    ],
    function(SegmentedButtonItem, Button, ButtonType, EventProvider, SegmentedButton, Controller) {
        "use strict";

		var	CONTAINER_VIEW_TABLE = "table",
			CONTAINER_VIEW_CHART = "chart",
			CONTAINER_VIEW_CHARTTABLE = "charttable",
			CONTAINER_VIEW_CUSTOMVIEW = "customview";

		var tbController = Controller.extend("sap.suite.ui.generic.template.AnalyticalListPage.controller.ToolbarController", {
			setState:function(oState) {
				var me = this;
				me.oState = oState;
				me._uiCompRb = sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp");

				var defaultView = oState.oController.getOwnerComponent().getDefaultContentView();

				// delay insertion out custom toolbar buttons until the
				// smartTable and smartChart are properly initialized
				me.oState._pendingTableToolbarInit = true;
				me.oState._pendingChartToolbarInit = true;

				//Creating the view switch buttons for the chart and table
				if (!me.oState.alr_viewSwitchButtonOnChart || !me.oState.alr_viewSwitchButtonOnTable ) {
					me.oState.alr_viewSwitchButtonOnChart = me.createViewSwitchButton(true);
					me.oState.alr_viewSwitchButtonOnTable = me.createViewSwitchButton(false);
				}
				var oTemplatePrivate = me.oState.oController.getOwnerComponent().getModel("_templPriv");
				//on load of app in tablet, set default view mode to chart
				defaultView = (!oTemplatePrivate.getProperty('/alp/visibility/hybridView') && defaultView === "charttable") ? "chart" : defaultView;
				oTemplatePrivate.setProperty('/alp/contentView', defaultView);
			},
			createViewSwitchButton:function(chartMode) {
				var oCustomModel = this.oState.oController.oView.getModel("alpCustomModel");
				var buttonItems = [];
				//The edges of the buttons are not rendering properly when visibility is set using custom model
				if (sap.ui.Device.system.desktop) {//create and push hybrid view only in desktop mode
					buttonItems.push(new sap.m.SegmentedButtonItem({
						tooltip: "{i18n>CONTAINER_VIEW_CHARTTABLE}",
						key: CONTAINER_VIEW_CHARTTABLE,
						icon: oCustomModel.getProperty("/icon/hybrid")
					}));
				}
				if (oCustomModel.getProperty("/required/master")) {
					buttonItems.push(new sap.m.SegmentedButtonItem({
						tooltip: "{i18n>CONTAINER_VIEW_CHART}",
						key: CONTAINER_VIEW_CHART,
						icon: oCustomModel.getProperty("/icon/master")
					}));
				}
				if (this.oState.bCustomViewExist) {
					buttonItems.push(new sap.m.SegmentedButtonItem({
						tooltip: oCustomModel.getProperty("/tooltip/customview"),
						key: CONTAINER_VIEW_CUSTOMVIEW,
						icon: oCustomModel.getProperty("/icon/customview")
					}));
				}
				buttonItems.push(new sap.m.SegmentedButtonItem({
					tooltip: "{i18n>CONTAINER_VIEW_TABLE}",
					key: CONTAINER_VIEW_TABLE,
					icon: "sap-icon://table-view"
				}));
				var btnSettings = {
					select:  jQuery.proxy(function(){
								this.oState.oController._templateEventHandlers.onSegmentButtonPressed(!this.oState.oController.getOwnerComponent().getProperty('smartVariantManagement'));
						}, this),
					layoutData: new sap.m.OverflowToolbarLayoutData({
						priority:sap.m.OverflowToolbarPriority.NeverOverflow
					}),
					items:buttonItems,
					selectedKey: "{_templPriv>/alp/contentView}"
				};
				if (chartMode) {
					jQuery.extend(btnSettings, {
						visible: "{= (${_templPriv>/alp/contentView} === 'chart' || ${_templPriv>/alp/contentView} === 'charttable') && !${_templPriv>/alp/fullScreen} }"
					});
					var segBtn = new SegmentedButton(btnSettings);
				} else {
					jQuery.extend(btnSettings, {
						visible: "{= (${_templPriv>/alp/contentView} === 'table' ) && !${_templPriv>/alp/fullScreen} }"
					});
					var segBtn = new SegmentedButton(btnSettings);
				}
				return segBtn;
			}
		});
		return tbController;
});
