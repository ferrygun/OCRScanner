sap.ui.define(["sap/suite/ui/generic/template/AnalyticalListPage/controller/KpiCardController",
"sap/ui/model/json/JSONModel",
"sap/ui/model/json/JSONModel",
"sap/ui/core/mvc/ViewType",
"sap/m/Popover",
"sap/ui/Device"
],
function(KpiCardController, JSONModel, Filter, ViewType, Popover, Device) {
	"use strict";
	var OVPLoaded;
	jQuery.sap.declare("sap.suite.ui.generic.template.AnalyticalListPage.controller.KpiTagController");

	sap.suite.ui.generic.template.AnalyticalListPage.controller.KpiTagController = {
		_kpiCards: [],
		init: function(oState) {
			var me = this;
			me.oState = oState;
			// create JSON model instance
			me.oGenericModel = new JSONModel();

			// JSON sample data

			var mGenericData = {
				header: "Some Header",
				title: "Some Title",
				titleUrl: "",
				icon: "sap-icon://camera"
			};

			// set the data for the model
			me.oGenericModel.setData(mGenericData);
			if (OVPLoaded === undefined) {
				OVPLoaded = sap.ui.getCore().loadLibrary("sap.ovp", { async: true });
			}
		},

		openKpiCard: function(oEvent) {
			var me = this;
			var oSource;
			if (typeof oEvent.currentTarget != "undefined") {
				oSource = sap.ui.getCore().byId(oEvent.currentTarget.id);
			} else {
				oSource = oEvent.getSource();
			}
			// if OVP is loaded then Open the KPI card
			OVPLoaded.then(function(){
				me.createPopover(function() {
					me._openCard(oSource);
				}.bind(me, oSource), oSource);
			});
		},

		_openCard: function(oSource) {
			var me = this;

			// delay because addDependent will do a async rerendering and the actionSheet will immediately close without it.

			jQuery.sap.delayedCall(0, this, function() {
				me._kpiCards[oSource.getQualifier()].openBy(oSource);
			});

		},

		handleKpiPress: function(oEvent) {
			this.openKpiCard(oEvent);
		},

		createPopover: function(fnOpenOnSucces, oSource) {
			var me = this;
			var sQualifier = oSource.getQualifier();

			var oComponent = me.oState.oController.getOwnerComponent();
			var oSettings = oComponent.getComponentContainer().getSettings();
			//Find the KPI setting based on qualifier
			var oKPISettings = oSettings.keyPerformanceIndicators;
			var oQualifierSettings;
			for (var sKey in oKPISettings){

				if (oKPISettings[sKey].hasOwnProperty("qualifier") && oKPISettings[sKey].qualifier === sQualifier){
					oQualifierSettings = oKPISettings[sKey];
					break;
				}
			}
			if (!oQualifierSettings){
				jQuery.sap.log.error("KPI settings not found with qualifier.");
				return;
			}
			var outboundTarget = oSettings.appComponent.getManifestEntry("/sap.app/crossNavigation/outbounds/" + oQualifierSettings.detailNavigation);
			var oModel = oComponent.getModel(oQualifierSettings.model);

			oModel.getMetaModel().loaded().then(function() {
				var me = this;
				me._oCardController = new KpiCardController();
				var oComponent = me.oState.oController.getOwnerComponent();

				var oParamModel = new JSONModel();
				var oQualifierSettings = arguments[0];

				var oModel = oComponent.getModel(oQualifierSettings.model);
				var oMetaModel = oModel.getMetaModel();
				var oEntitySet = oMetaModel.getODataEntitySet(oQualifierSettings.entitySet);
				var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
				var oSelectionPresentationVariant = oEntityType["com.sap.vocabularies.UI.v1.SelectionPresentationVariant#" + sQualifier];
				var sSelectionVariant = oSelectionPresentationVariant.SelectionVariant &&  oSelectionPresentationVariant.SelectionVariant.Path;
				var oSelectionVariant = oEntityType[sSelectionVariant.split("@")[1]];
				oQualifierSettings.metaModel = oMetaModel;
				oParamModel.setData(oQualifierSettings);

				// create a new view with template processing
				var oView = sap.ui.view({
					async: false,
					preprocessors: {
						xml: {
							bindingContexts: {
								entityType: oMetaModel.createBindingContext(oMetaModel.getODataEntityType(oEntitySet.entityType, true)),
								entitySet: oMetaModel.createBindingContext(oMetaModel.getODataEntitySet(oQualifierSettings.entitySet, true))
							},
							models: {
								entitySet: oMetaModel,
								entityType: oMetaModel,
								parameter: oParamModel

							},
							dataModel: oModel,
							settings: oParamModel,
							preprocessorsData: oComponent.getComponentData().preprocessorsData
						}
					},

					type: ViewType.XML,
					viewName: "sap.suite.ui.generic.template.AnalyticalListPage.view.KpiCardSizeM",
					height: "100%"
				});


				oView.data({
					"kpiTitle": oSource._nameFromPath,
					"qualifierSettings": oQualifierSettings,
					"selectionVariant": oSelectionVariant
				});

				oView.setModel(oComponent.getModel(oQualifierSettings.model));

				//Set model for detail action
				var actionModel = new sap.ui.model.json.JSONModel();
				var actionData = {"visible": oQualifierSettings.detailNavigation ? true : false};
				if (oQualifierSettings.detailNavigation && outboundTarget) {
					actionData.target = outboundTarget.semanticObject;
					actionData.action = outboundTarget.action;
					actionData.parameters = JSON.stringify(outboundTarget.parameters ? outboundTarget.parameters : {});
				} else {
					//Have to hide the button, no where to navigate
					actionData.visible = false;
				}
				actionModel.setData(actionData);
				oView.setModel(actionModel, "detailNavigation");

				if (typeof me._kpiCards[sQualifier] != "undefined") {
					me._kpiCards[sQualifier].destroy();
				}
				me._kpiCards[sQualifier] = new Popover();
				if (Device.system.tablet && !Device.system.desktop) {
					me._kpiCards[sQualifier].setPlacement("Bottom");
				}
				me._kpiCards[sQualifier].setShowHeader(false);
				me._kpiCards[sQualifier].addContent(oView);
				me._oKpiCardController = oView.getController();
				me._oKpiCardController._assignCommonUtils(me.oState.oTemplateUtils.oCommonUtils);
				me.oState.oController.getView().addDependent(me._kpiCards[sQualifier]);

				fnOpenOnSucces();

			}.bind(this, oQualifierSettings));


		},

		onExit: function() {
			if (this._oKpiCard) {
				this._oKpiCard.destroy();
			}
		},

		_setModel: function(oModel) {
			this._oKpiCard.setModel(oModel);
		}
	};

	return sap.suite.ui.generic.template.AnalyticalListPage.controller.KpiTagController;
});
