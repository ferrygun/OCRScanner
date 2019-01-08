sap.ui.define(["jquery.sap.global", "sap/ui/base/Object",
	"sap/ui/generic/app/navigation/service/SelectionVariant",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/FilterUtil", "sap/ui/Device"], function(jQuery, BaseObject, SelectionVariant, FilterUtil, Device) {
	"use strict";

	function getMethods(oState, oController, oNavigationHandler) {

		//decleration
		var customDataPropertyName  = "sap.suite.ui.generic.template.customData";
		var genericDataPropertyName = "sap.suite.ui.generic.template.genericData";
		var FILTER_MODE_VISUAL      = "visual";
		var FILTER_MODE_COMPACT     = "compact";
		var oParseNavigationPromise;
		var bIsTransferringUrlStateToPageState = false;
		var oStoringInformation = null;
		var sAppStateKeyInUrl = null;
		var oRealizedAppState = { // this object contains information which can be derived from url
			appStateKey: "",      // it represents the last url-state which has been adopted by the UI
			urlParams: {}
			//LR is storing some additional information like table variant id in this object, in ALP it is not required
		};

		/**
		 * This function return the URL parameter info
		 * @return {promise}
		 */
		function getUrlParameterInfo(){
			return oParseNavigationPromise.then(function(){
				if (oRealizedAppState.appStateKey){
					return {
						"sap-iapp-state": [oRealizedAppState.appStateKey]
					};
				}
				return oRealizedAppState.urlParams;
			});
		}
		function fnRestoreGenericFilterState(oGenericData) {
			if (oGenericData && oGenericData.editStateFilter !== undefined) {
				var oEditStateFilter = oController.byId("editStateFilter");
				if (oEditStateFilter) {
					oEditStateFilter.setSelectedKey((oGenericData.editStateFilter === null) ? 0 : oGenericData.editStateFilter);
				}
			}
			var oTemplatePrivate = oState.oController.getOwnerComponent().getModel("_templPriv");
			if (oGenericData.chartVariantId && oState.oSmartChart) {
				oState.oSmartChart.setCurrentVariantId(oGenericData.chartVariantId);
			}
			if (oGenericData.filterMode) {
				oTemplatePrivate.setProperty('/alp/filterMode', oGenericData.filterMode);
				oState.filterBarController.handleFilterSwitch(oGenericData.filterMode);
			} else {
				fnSetDefaultFilter();
			}
			if (oGenericData.contentView) {
				((Device.system.phone || Device.system.tablet && !Device.system.desktop) && oGenericData.contentView === "charttable") ? oTemplatePrivate.setProperty('/alp/contentView', "chart") : oTemplatePrivate.setProperty('/alp/contentView', oGenericData.contentView);
			}
			if (oGenericData.autoHide) {
				oTemplatePrivate.setProperty('/alp/autoHide', oGenericData.autoHide);
				//TODO RC Do we need to refresh table binding to change the highlight / filter behaviour
			}
		}

		// This method is responsible for restoring the data which have been stored via getFilterState.
		// However, it must be taken care of data which have been stored with another (historical) format.
		// Therefore, it is checked whether oCustomAndGenericData possesses two properties with the right names.
		// If this is this case it is assumed that the data have been stored according to curreent logic. Otherwise, it is
		// assumed that the data have been stored with the current logic. Otherwise, it is assumed that the properties have been
		// stored with a logic containing only custom properties (with possible addition of _editStateFilter).
		function fnRestoreFilterState(oCustomAndGenericData) {
			oCustomAndGenericData = oCustomAndGenericData || {};
			if (oCustomAndGenericData.hasOwnProperty(customDataPropertyName) && oCustomAndGenericData.hasOwnProperty(genericDataPropertyName)) {
				fnRestoreGenericFilterState(oCustomAndGenericData[genericDataPropertyName]);
				fnRestoreCustomFilterState(oCustomAndGenericData[customDataPropertyName]);
			} else { // historic format. May still have property _editStateFilter which was used generically.
				if (oCustomAndGenericData._editStateFilter !== undefined) {
					fnRestoreGenericFilterState({
						editStateFilter: oCustomAndGenericData._editStateFilter
					});
					delete oCustomAndGenericData._editStateFilter;
				}
				fnSetDefaultFilter();
				fnRestoreCustomFilterState(oCustomAndGenericData);
			}
		}

		/**
		 * This function set the default filter
		 * @return {void}
		 */
		function fnSetDefaultFilter() {
			var oTemplatePrivate = oState.oController.getOwnerComponent().getModel("_templPriv"),
				defaultFilterMode = oState.oSmartFilterbar.isCurrentVariantStandard() ? oState.oController.getOwnerComponent().getDefaultFilterMode() : oTemplatePrivate.getProperty('/alp/filterMode');
			//If the App Developer wants to hide Visual Filter, switch to Compact Filter
			if (defaultFilterMode === FILTER_MODE_VISUAL && oState.hideVisualFilter) {
				jQuery.sap.log.error("Visual filter is hidden defaulting to compact");
				defaultFilterMode = FILTER_MODE_COMPACT;
			}
			oState.filterBarController.setDefaultFilter(defaultFilterMode);
		}
		/**
		 * This function resolve the app state promise
		 * @param  {object} oAppData       app data
		 * @param  {object} oURLParameters url parameters
		 * @param  {string} sNavType       navigation type
		 * @return {void}
		 */
		function resolveAppStatePromise (oAppData, oURLParameters, sNavType) {
			oState.oSmartFilterbar.setSuppressSelection(false);
			var sAppStateKey = oAppData.appStateKey || "";
			//Make sure that no two resolve functions are executing at the same time.
			if (bIsTransferringUrlStateToPageState){
				return;
			}
			sAppStateKeyInUrl = sAppStateKey;
			bIsTransferringUrlStateToPageState = true;
			var oNewUrlParameters = (!sAppStateKey && oURLParameters) || {};
			if (sNavType !== sap.ui.generic.app.navigation.service.NavType.initial) {
				var bHasOnlyDefaults = oAppData && oAppData.bNavSelVarHasDefaultsOnly;
				var oSelectionVariant = new SelectionVariant(oAppData.selectionVariant);
				addDisplayCurrency(oSelectionVariant, oAppData);
				applySelectionProperties(oSelectionVariant);
				//according to BCP 1770187504, 1670373497 and 1670406892 '|| oState.oSmartFilterbar.isCurrentVariantStandard() is needed
				if (!bHasOnlyDefaults || oState.oSmartFilterbar.isCurrentVariantStandard()) {
					updateSmartFilterBar(oSelectionVariant);
				}
				if (oAppData.tableVariantId && oState.oSmartTable) {
					oState.oSmartTable.setCurrentVariantId(oAppData.tableVariantId);
				}
				//in case of visual filter mode triggering the merge
				var oTemplatePrivate = oState.oController.getOwnerComponent().getModel("_templPriv");
				if ( sNavType === sap.ui.generic.app.navigation.service.NavType.xAppState && oTemplatePrivate.getProperty('/alp/filterMode') === FILTER_MODE_VISUAL) {
					triggerMerge();
				}
				if (oAppData.customData) {
					fnRestoreFilterState(oAppData.customData);
				} else {
					fnSetDefaultFilter();
				}
				if (!bHasOnlyDefaults) {
					oState.oSmartFilterbar.search();
				}
				oRealizedAppState = {
					appStateKey: sAppStateKey,
					urlParams: oNewUrlParameters
				};
			} else {
				fnSetDefaultFilter();
			}
			fnUpdateSVFB();
			oStoringInformation = null;
			bIsTransferringUrlStateToPageState = false;
		}
		/**
		 * This function return the filter state
		 * @return {object} filter state
		 */
		function getFilterState() {
			var oCustomAndGenericData = {};
			oCustomAndGenericData[customDataPropertyName] = {};
			var oTemplatePrivate = oState.oController.getOwnerComponent().getModel("_templPriv");
			//Adding chartVariantId , filterMode and containerView to the generic data
			//because of the limitation of NavigationHandler
			oCustomAndGenericData[genericDataPropertyName] = {
				chartVariantId: oState.oSmartChart && oState.oSmartChart.getCurrentVariantId(),
				filterMode: oTemplatePrivate.getProperty('/alp/filterMode'),
				contentView: oTemplatePrivate.getProperty('/alp/contentView'),
				autoHide: oTemplatePrivate.getProperty('/alp/autoHide')
			};
			var oEditStateFilter = oController.byId("editStateFilter");
			if (oEditStateFilter) {
				oCustomAndGenericData[genericDataPropertyName].editStateFilter = oEditStateFilter.getSelectedKey();
			}
			// extension is responsible for retrieving custom filter state. The method has a more generic name
			// for historical reasons (change would be incompatible).
			oController.getCustomAppStateDataExtension(oCustomAndGenericData[customDataPropertyName]);
			return oCustomAndGenericData;
		}
		/**
		 * This function return the current app state
		 * @return {object} app state
		 */
		function getCurrentAppState() {
			/*
			 * Special handling for selection fields, for which defaults are defined: If a field is visible in the
			 * SmartFilterBar and the user has cleared the input value, the field is not included in the selection
			 * variant, which is returned by getDataSuiteFormat() of the SmartFilterBar. But since it was cleared by
			 * purpose, we have to store the selection with the value "", in order to set it again to an empty value,
			 * when restoring the selection after a back navigation. Otherwise, the default value would be set.
			 */
			var oSelectionVariant = new SelectionVariant(oState.oSmartFilterbar.getDataSuiteFormat());
			var aVisibleFields = oController.getVisibleSelectionsWithDefaults();
			for (var i = 0; i < aVisibleFields.length; i++) {
				if (!oSelectionVariant.getValue(aVisibleFields[i])) {
					oSelectionVariant.addSelectOption(aVisibleFields[i], "I", "EQ", "");
				}
			}
			//If variant is dirty and if the selection variant has id, making the same empty. For the filters to be applied correctly.
			if (oState.oController.byId('template::PageVariant').currentVariantGetModified() && oSelectionVariant.getID()){
				oSelectionVariant.setID("");
			}
			return {
				selectionVariant: oSelectionVariant.toJSONString(),
				tableVariantId: oState.oSmartTable && oState.oSmartTable.getCurrentVariantId(),
				customData: getFilterState()
			};
		}
		/**
		 * This method is responsible for retrieving custom filter state. The correspomding extension-method has a more generic name
		 * for historical reasons (change would be incompatible).
		 */
		function fnRestoreCustomFilterState(oCustomData) {
			oController.restoreCustomAppStateDataExtension(oCustomData || {});
		}
		/**
		 * This function add the display currency field
		 * @param {object} oSelectionVariant
		 * @param {object} oAppData
		 * @return {void}
		 */
		function addDisplayCurrency(oSelectionVariant, oAppData) {
			var mandatoryFilterItems = oState.oSmartFilterbar.determineMandatoryFilterItems();
			var displayCurrency;
			for (var item = 0;item < mandatoryFilterItems.length; item++) {
				if (mandatoryFilterItems[item].getName().indexOf("$Parameter.P_DisplayCurrency") !== -1) {
					var sCurrency = oAppData.oSelectionVariant.getSelectOption("DisplayCurrency");
					if (sCurrency && sCurrency[0] && sCurrency[0].Low) {
						displayCurrency = sCurrency[0].Low;
					} else if (FilterUtil.readProperty(oAppData,"oDefaultedSelectionVariant._mSelectOptions.DisplayCurrency.0.Low")) {
						displayCurrency = oAppData.oDefaultedSelectionVariant._mSelectOptions.DisplayCurrency[0].Low;
					}
					if (displayCurrency) {
						oSelectionVariant.addParameter("$Parameter.P_DisplayCurrency", displayCurrency);
					}
					if (oState.alr_visualFilterBar && displayCurrency) {
						oState.alr_visualFilterBar.setDisplayCurrency(displayCurrency);
					}
					break;
				}
			}
		}

		/**
		 * This function trigger the merge
		 * @return {void}
		 */
		function triggerMerge() {
			var oCompactFilterData = jQuery.extend(true, {}, oState.oSmartFilterbar.getFilterData(true)),
			filterModel = oState.oController.getOwnerComponent().getModel("_filter");
			filterModel.setData(oCompactFilterData);
			oState.filterBarController._updateFilterLink();
		}
		/**
		 * This function update the smart filter bar
		 * @param  {object} oSelectionVariant
		 * @return {void}
		 */
		function updateSmartFilterBar(oSelectionVariant) {
			// A default variant could be loaded.
			// Do not clear oSmartFilterbar.clearVariantSelection and oSmartFilterbar.clear due to BCP 1680012595 is not valid anymore
			// with BCP 1670406892 it was made clear that both clear are needed when this GIT change 1941921 in navigation handler is available
			oState.oSmartFilterbar.clearVariantSelection();
			oState.oSmartFilterbar.clear();
			// oSelectionVariant object is used in place of oAppData.selectionVariant
			// because we add a Parameter to the SelectionVariant if user settings
			// specify a DisplayCurrency.
			oState.oSmartFilterbar.setDataSuiteFormat(oSelectionVariant.toJSONString(), true);
		}
		/**
		 * This function apply selection properties to the smart filter bar
		 * @param  {object} oSelectionVariant
		 * @return {void}
		 */
		function applySelectionProperties(oSelectionVariant) {
			var aSelectionVariantProperties = oSelectionVariant.getParameterNames().concat(oSelectionVariant.getSelectOptionsPropertyNames());
			for (var i = 0; i < aSelectionVariantProperties.length; i++) {
				oState.oSmartFilterbar.addFieldToAdvancedArea(aSelectionVariantProperties[i]);
			}
			// add filters to visual filter basic area if not already added
			if (oState.alr_visualFilterBar) {
				oState.alr_visualFilterBar.addVisualFiltersToBasicArea(aSelectionVariantProperties);
			}
		}
		function fnStoreCurrentAppStateAndAdjustURL() {
			// oCurrentAppState is optional
			// - nothing, if NavigationHandler not available
			// - adjusts URL immediately
			// - stores appState for this URL (asynchronously)
			var oCurrentAppState  = getCurrentAppState();
			// currently NavigationHandler raises an exception when ushellContainer is not available, should be changed
			// by
			// Denver
			try {
				//storage information object
				oStoringInformation =  oNavigationHandler.storeInnerAppStateWithImmediateReturn(oCurrentAppState);
			} catch (err) {
				jQuery.sap.log.error("AnalyticalListPage.fnStoreCurrentAppStateAndAdjustURL: " + err);
			}
			if (oStoringInformation instanceof sap.ui.generic.app.navigation.service.NavError) {
				oStoringInformation = null;
				return;
			}
			//LR is using replaceHash function of NavigationHandler to update the key.
			//LR’s logic is creating the navigation promise and triggering the resolve function on every app state change
			//For ALP that logic will create performance issue. So using a different logic 
			if (oStoringInformation && sAppStateKeyInUrl !== oStoringInformation.appStateKey) {
				//No need to wait for oStoringInformation.promise, app state is directly accessible from oStoringInformation object
				oRealizedAppState.appStateKey = oStoringInformation.appStateKey;
			}
		}
		function fnCheckToLaunchDialog() {
			var oTemplatePrivate = oState.oController.getOwnerComponent().getModel("_templPriv");
			if (oTemplatePrivate.getProperty('/alp/filterMode') === FILTER_MODE_VISUAL) {
				if (!oTemplatePrivate.getProperty("/alp/searchable")) { //If missing mandatory or parameters
					oState.oSmartFilterbar.showFilterDialog();
				}
			}
		}
		function fnCheckMandatory(){
			//check if smartfilterbar is searchable only after it has been initialized.
			if (oState.oSmartFilterbar.isInitialised()) {
				oState.oSmartFilterbar.checkSearchAllowed(oState);
			}
		}
		function fnUpdateSVFB() {
			// If filter mode is visual and if mandatory fields/params are not filled launch CompactFilter Dialog
			fnCheckMandatory();
			fnCheckToLaunchDialog();
			// set filter model so that default values (user settings etc.) can also be accounted for
			var filterModel = oState.oController.getOwnerComponent().getModel("_filter");
			filterModel.setData(jQuery.extend(true, {}, oState.oSmartFilterbar.getFilterData(true)));
			oState.filterBarController._updateFilterLink();
			//Update Binding in chart Items in Smart Visual Filter Bar
			if (oState.alr_visualFilterBar && oState.alr_visualFilterBar.updateVisualFilterBindings) {
				oState.alr_visualFilterBar.updateVisualFilterBindings(true);
			}
		}
		function onSmartFilterBarInitialise(oEvent){
			oParseNavigationPromise  = oNavigationHandler.parseNavigation();
		}
		function onSmartFilterBarInitialized(){
			try {
				oParseNavigationPromise.done(resolveAppStatePromise);
				oParseNavigationPromise.fail(function(oError) {
					if (oError instanceof Error) {
						oError.showMessageBox();
					}
					// Set Default filter when app state fails (if filter mode is visual) and if mandatory fields/params are not filled launch CompactFilter Dialog
					fnSetDefaultFilter();
					fnUpdateSVFB();
				});

			} catch (oException) {
				// In case the app is launched outside of launch pad the navigation promise will throw exception
				// Set Default filter when app state fails (if filter mode is visual) and if mandatory fields/params are not filled launch CompactFilter Dialog
				fnSetDefaultFilter();
				fnUpdateSVFB();
			}
		}
		return {
			getFilterState: getFilterState,
			fnCheckMandatory: fnCheckMandatory,
			getCurrentAppState: getCurrentAppState,
			fnSetDefaultFilter: fnSetDefaultFilter,
			fnRestoreFilterState: fnRestoreFilterState,
			getUrlParameterInfo: getUrlParameterInfo,
			onSmartFilterBarInitialise: onSmartFilterBarInitialise,
			onSmartFilterBarInitialized: onSmartFilterBarInitialized,
			fnStoreCurrentAppStateAndAdjustURL: fnStoreCurrentAppStateAndAdjustURL
		};
	}
	return BaseObject.extend("sap.suite.ui.generic.template.AnalyticalListPage.controller.IappStateHandler", {
		constructor: function(oState, oController, oNavigationHandler) {
			jQuery.extend(this, getMethods(oState, oController, oNavigationHandler));
		}
	});
});