sap.ui.define([
	"jquery.sap.global",
	"sap/ui/core/Fragment",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/thirdparty/d3",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/KpiUtil",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/V4Terms"
], function(jQuery, Fragment, Controller, JSONModel, D3, KpiUtil, V4Terms) {
	"use strict";
	jQuery.sap.require("sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter");

	var oNavigationHandler,
		oSTCommonUtils;

	var cController = Controller.extend("sap.suite.ui.generic.template.AnalyticalListPage.controller.KpiCardController", {

		onInit: function(evt) {
			// CommonUtils will be taken from OVP lib
			jQuery.sap.require("sap.ovp.cards.CommonUtils");
		},
		onExit: function() {
		},
		onBeforeRendering: function() {
			// Define CommonUtils
			var oCommonUtils = sap.ovp.cards.CommonUtils;
			var sDataPointPath, sSPVPath;
			//get the view and other settings
			var oView = this.getView();
			//var oLocalCardContainer = oView.byId("template::ALPcardContainer");
			var oSettings = oView.data("qualifierSettings");
			var oQualifier = oSettings.qualifier;
			var oModel = oView.getModel();
			var oMetaModel = oModel.getMetaModel();
			var oEntitySet = oMetaModel.getODataEntitySet(oSettings.entitySet);
			var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);

			// create a card name for OVP
			var oCardName = "kpiCard" + oQualifier;
			// create a card settings to pass to OVP
			var oCardSettings = {
				"cards":{}
			};
			//if qualifier present in the settings
			sSPVPath = V4Terms.SelectionPresentationVariant + (oQualifier ? "#" + oQualifier : "");
			// CDS Annotation gives Path instead of AnnotationPath
			var sPresentationVariant = oEntityType[sSPVPath].PresentationVariant &&  oEntityType[sSPVPath].PresentationVariant.Path;
			if (!sPresentationVariant) {
				jQuery.sap.log.error("PresentationVariant does not have Path.");
				return;
			}
			var oVisualizations = oEntityType[sPresentationVariant.split("@")[1]].Visualizations;

			oVisualizations.forEach(function(oAnno){
				if (oAnno.AnnotationPath.indexOf("DataPoint") > 0){
					sDataPointPath = oAnno.AnnotationPath.split("@")[1];
				}
			});

			oCardSettings["cards"][oCardName] = {
				"model": oSettings.model,
				"template": "sap.ovp.cards.charts.analytical",
				"settings": {
					"title": oView.data("kpiTitle"),
					"entitySet": oSettings.entitySet,
					"selectionPresentationAnnotationPath": sSPVPath,
					"dataPointAnnotationPath": sDataPointPath,
					"showFilterInHeader": true,
					"navigation": "chartNav"
				}
			};
			// create a card with OVP API
			oCommonUtils.createCardComponent(oView, oCardSettings, "template::ALPcardContainer");
			//Event handler on header clicked for navigation
			oCommonUtils.onHeaderClicked = function(oEvent) {
				this.handleNavigationPress(oView);
			}.bind(this);
			//Event handler for click of KPI chart for navigation
			oCommonUtils.onContentClicked = function (oEvent) {
				//get chart selection and add to SV
				var oChartSelection = oEvent.getObject();
				this.handleNavigationPress(oView, oChartSelection);
			}.bind(this);
		},
		/*@public
		* prepare SV and then use NavigationHandler to navigate to another app
		* @param {object} oView - kpi card view
		* @param {object} oChartSelection - kpi chart selection; undefined in case of headerclick event
		* @return {void}
		*/
		handleNavigationPress: function(oView, oChartSelection) {
			var oNavModel = oView.getModel("detailNavigation");
			if (oNavModel) {
				var sTarget = oNavModel.getProperty("/target");
				var sAction = oNavModel.getProperty("/action");
				if (sTarget && sAction) {
					if (!oNavigationHandler) {
						oNavigationHandler = oSTCommonUtils.getNavigationHandler();
					}
					this._oSelectionVariant = new sap.ui.generic.app.navigation.service.SelectionVariant();
					//get parameters defined in manifest for crossNavigation and add them to SV
					var appDescriptorParameters = JSON.parse(oNavModel.getProperty("/parameters"));
					this._createNavigationContext(appDescriptorParameters, true);
					//add parameters and select options from annotations to SV
					//parameters in annotations take precedence over parameters from app descriptor
					this._getSelectOptionsFromAnnotation(oView);
					if (oChartSelection) {
						//if chart selection exists, then add it to SV
						this._createNavigationContext(oChartSelection);
					}
					//NavigationHandler.navigate accepts selection variant as a string
					this._oSelectionVariant = this._oSelectionVariant.toJSONString();
					oNavigationHandler.navigate(sTarget, sAction, this._oSelectionVariant, null, function (oError) {
						if (oError instanceof sap.ui.generic.app.navigation.service.NavError) {
							if (oError.getErrorCode() === "NavigationHandler.isIntentSupported.notSupported") {
								sap.m.MessageBox.show(oSTCommonUtils.getText("ST_NAV_ERROR_NOT_AUTHORIZED_DESC"), {
									title: oSTCommonUtils.getText("ST_GENERIC_ERROR_TITLE")
								});
							} else {
								sap.m.MessageBox.show(oError.getErrorCode(), {
									title: oSTCommonUtils.getText("ST_GENERIC_ERROR_TITLE")
								});
							}
						}
					});
				}
			}
		},
		_assignCommonUtils: function(oCommonUtils) {
			oSTCommonUtils = oCommonUtils;
			oNavigationHandler = oSTCommonUtils.getNavigationHandler();
		},
		/*
		* @private
		* add parameters from app descriptor, filter from KPI chart selection to selection variant
		* so that it can be consumed by the navigation handler
		* @param {object} oParameter - parsed annotations data from visual filter provider
		* @param {boolean} bIsParameter	- true if oParameter is paramter, undefined if oParameter is a filter
		* @return {void}
		*/
		_createNavigationContext: function(oParameter, bIsParameter) {
			var keys = Object.keys(oParameter);
			for (var i = 0; i < keys.length; i++) {
				var eachKey = keys[i];
				//SelectionVariant does not accept undefined/null values
				//dont add such values to SelectionVariant
				if (!oParameter[eachKey] && oParameter[eachKey] !== "") {
					return;
				}
				if (bIsParameter) {
					//SelectionVariant.addParameter accepts the property name and its value
					this._oSelectionVariant.addParameter(eachKey, oParameter[eachKey]);
				} else {
					//chart selection takes precedence over SV
					if (this._oSelectionVariant.getSelectOption(eachKey)) {
						this._oSelectionVariant.removeSelectOption(eachKey);
					}
					//SelectionVariant.addSelectOption accepts property name, sign [include or exclude the value - always I for chart selection],
					//option of the range [always "EQ" for chart selection], low value [chart selection value is low value],
					//high value [chart selection has no high value]
					this._oSelectionVariant.addSelectOption(eachKey, "I", "EQ", oParameter[eachKey]);
				}
			}
		},
		/*
		* @private
		* obtain parameters and select options from annotations and add them to selection variant
		* so that it can be consumed by the navigation handler
		* @param {object} oView - card view
		* @return {void}
		*/
		_getSelectOptionsFromAnnotation: function(oView) {
			var that = this;
			var oSelectionVariant = oView.data("selectionVariant");
			var aSelectOptions = oSelectionVariant.SelectOptions;
			var	aSVParameters = oSelectionVariant.Parameters;
			//if parameters are provided in the annotations, add them to SV after removing duplicates
			if (aSVParameters && aSVParameters.length) {
				aSVParameters.forEach(function(oParameter) {
					var sParameterName = oParameter.PropertyName.PropertyPath;
					var sParameterValue = oParameter.PropertyValue.String;
					if (that._oSelectionVariant.getParameter(sParameterName)) {
						that._oSelectionVariant.removeParameter(sParameterName);
					}
					that._oSelectionVariant.addParameter(sParameterName, sParameterValue);
				});
			}
			//if select options are present in annotations, add them to SV
			if (aSelectOptions && aSelectOptions.length) {
				aSelectOptions.forEach(function(oSelectOption) {
					var sPropertyName = oSelectOption.PropertyName.PropertyPath;
					var aRanges = oSelectOption.Ranges;
					//a property can have multiple ranges. add each of them to SV
					aRanges.forEach(function(oRange) {
						var sLowValue = oRange.Low.String;
						var sHighValue = (oRange.High &&  oRange.High.String) ? oRange.High.String : null;
						var sSign = oRange.Sign.EnumMember.split("/")[1];
						var sOption = oRange.Option.EnumMember.split("/")[1];
						that._oSelectionVariant.addSelectOption(sPropertyName, sSign, sOption, sLowValue, sHighValue);
					});
				});
			}
		}
	});
	return cController;

});
