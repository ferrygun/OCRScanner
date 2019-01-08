sap.ui.define(["jquery.sap.global", "sap/ui/base/Object",
	"sap/ui/generic/app/navigation/service/NavError", "sap/ui/generic/app/navigation/service/SelectionVariant", "sap/ui/comp/state/UIState"], function(jQuery, BaseObject, NavError, SelectionVariant, UIState) {
	"use strict";

		// Constants which are used as property names for storing custom filter data and generic filter data
		var dataPropertyNameCustom = "sap.suite.ui.generic.template.customData",
			dataPropertyNameGeneric = "sap.suite.ui.generic.template.genericData";

		// variant contexts which should not lead to change the iappstate
		var aIrrelevantVariantLoadContext = ["INIT", "DATA_SUITE", "CANCEL", "RESET", "SET_VM_ID"];

	function fnNullify(oObject) {
		if (oObject) {
			for (var sProp in oObject) {
				oObject[sProp] = null;
			}
		}
	}

	function fnNotEqual(oObject1, oObject2){
		var aKeys1 = Object.keys(oObject1);
		if (aKeys1.length !== Object.keys(oObject2).length){
			return true;
		}
		for (var i = 0; i < aKeys1.length; i++){
			var sKey = aKeys1[i];
			var aPar1 = oObject1[sKey];
			var aPar2 = oObject2[sKey];
			if (aPar1.length !== aPar2.length){
				return true;
			}
			for (var j = 0; j < aPar1.length; j++){
				if (aPar1[j] !== aPar2[j]){
					return true;
				}
			}
		}
		return false;
	}

	function getMethods(oState, oController, oNavigationHandler) {

		var bSmartVariantManagement = oController.getOwnerComponent().getSmartVariantManagement();
		var oRealizedAppState = { // this object contains information which can be derived from url
			appStateKey: "",      // it represents the last url-state which has been adopted by the UI
			urlParams: {},
			selectionVariant: "",
			tableVariantId: ""
		};

		var bIsTransferringUrlStateToPageState = false;

		var fnNotifyRealizedAppStateConsistent = null; // when this variable is not null a url has been caught which has not yet been adopted.
		                                       // In this case it is a function that should be called when the adoption has been performed successfully.
		var oAppStateIsSetPromise = Promise.resolve(); // A Promise that is resolved when the current url and the content of oRealizedAppState are consistent
		                                               // Otherwise the Promise will be resolved as soon as this is again the case
		var bDataAreShownInTable = false;
		var bAppStateDirty = false;  // this property is true, when some url-relevant change has been performed by the user which has not yet been transferred to the url.
		var oEditStateFilter = oController.byId("editStateFilter");
		var bIsAutoBinding;

		var oStoringInformation = null; // when this parameter is not null a change of the url has been triggered which is not yet reflected in oRealizedAppState.
		                                // In this case it contains a property appStateKey which contains the appStateKey which has been put into the url
		var sAppStateKeyInUrl = null; // the appstateKey which is currently in the url. It is (normally) updated in function isStateChange.

		oState.oSmartFilterbar.setSuppressSelection(true);

		var getByDefaultNonVisibleCustomFilterNames = (function(){
			var aNonVisibleCustomFilterNames;
			return function(){
				aNonVisibleCustomFilterNames = aNonVisibleCustomFilterNames || oState.oSmartFilterbar.getNonVisibleCustomFilterNames();
				return aNonVisibleCustomFilterNames;
			};
		})();

		function areDataShownInTable(){
			return bDataAreShownInTable;
		}

		function getPageState() {
			var oCustomAndGenericData = {};
			oCustomAndGenericData[dataPropertyNameCustom] = {};
			// Store information about visible custom filters
			var aVisibleCustomFieldNames = [];
			var aByDefaultNonVisibleCustomFilterNames = getByDefaultNonVisibleCustomFilterNames();
			for (var i = 0; i < aByDefaultNonVisibleCustomFilterNames.length; i++){ // loop over all custom fields which are not visible in filterbar by default
				var sName = aByDefaultNonVisibleCustomFilterNames[i];
				if (oState.oSmartFilterbar.isVisibleInFilterBarByName(sName)){ // custom field is visible in filterbar now
					aVisibleCustomFieldNames.push(sName);
				}
			}
			oCustomAndGenericData[dataPropertyNameGeneric] = {
				suppressDataSelection: !bDataAreShownInTable,
				visibleCustomFields: aVisibleCustomFieldNames
			};
			if (oEditStateFilter) {
				oCustomAndGenericData[dataPropertyNameGeneric].editStateFilter = oEditStateFilter.getSelectedKey();
			}
			var oTableViewData = oState.oMultipleViewsHandler && oState.oMultipleViewsHandler.getContentForIappState();
			if (oTableViewData){
				var sPropertyName = oTableViewData.mode === "single" ? "tableViewData" : "tableTabData";
				oCustomAndGenericData[dataPropertyNameGeneric][sPropertyName] = oTableViewData.state;
			}
			
			// extension is responsible for retrieving custom filter state. The method has a more generic name
			// for historical reasons (change would be incompatible).

			oController.getCustomAppStateDataExtension(oCustomAndGenericData[dataPropertyNameCustom]);
			return oCustomAndGenericData;
		}

		function getCurrentAppState() {
			/*
			 * Special handling for selection fields, for which defaults are defined: If a field is visible in the
			 * SmartFilterBar and the user has cleared the input value, the field is not included in the selection
			 * variant, which is returned by getDataSuiteFormat() of the SmartFilterBar. But since it was cleared by
			 * purpose, we have to store the selection with the value "", in order to set it again to an empty value,
			 * when restoring the selection after a back navigation. Otherwise, the default value would be set.
			 */
			var sCurrentSelectionVariant = JSON.stringify(oState.oSmartFilterbar.getUiState().getSelectionVariant());
			//var sCurrentSelectionVariant = oState.oSmartFilterbar.getDataSuiteFormat();
			var oSelectionVariant = new SelectionVariant(sCurrentSelectionVariant);
			var aVisibleFields = oController.getVisibleSelectionsWithDefaults();
			for (var i = 0; i < aVisibleFields.length; i++) {
				if (!oSelectionVariant.getValue(aVisibleFields[i])) {
					oSelectionVariant.addSelectOption(aVisibleFields[i], "I", "EQ", "");
				}
			}
			
			//If variant is dirty and if the selection variant has id, making the same empty for the filters to be applied correctly.
			if (oController.byId('template::PageVariant') && oController.byId('template::PageVariant').currentVariantGetModified() && oSelectionVariant.getID()){
				oSelectionVariant.setID("");
			}
			var oRet = {
				selectionVariant: oSelectionVariant.toJSONString(),
				tableVariantId: (!bSmartVariantManagement && oState.oSmartTable.getCurrentVariantId()) || "",
				customData: getPageState()
			};
			return oRet;
		}

		// This method is called when the app state has potentially changed, such that the url must be adopted. 
		// bAppStateDirty tells us, whether there is really an open change
		function fnStoreCurrentAppStateAndAdjustURL() {
			// - nothing, if ushellContainer not available
			// - adjusts URL immediately
			// - stores appState for this URL (asynchronously)

			if (!bAppStateDirty){
				return;
			}

			bAppStateDirty = false;

			try {
				oStoringInformation = oNavigationHandler.storeInnerAppStateWithImmediateReturn(getCurrentAppState(), true);
			} catch (err){ // happens e.g. in voter. Would better be handled by Denver
				jQuery.sap.log.error("ListReport.fnStoreCurrentAppStateAndAdjustURL: " + err);
				return;
			}

			if (oStoringInformation instanceof NavError){
				bAppStateDirty = true;
				oStoringInformation = null;
				return;
			}
			oStoringInformation.promise.fail(function(oError){
				jQuery.sap.log.error("ListReport.fnStoreCurrentAppStateAndAdjustURL: Error when persisting appState" + oError);	
			});
			if (sAppStateKeyInUrl === oStoringInformation.appStateKey){
				oStoringInformation = null;	// if the appstateKey does not reflect a new state, nothing needs to be done -> oStoringInformation should be cleared already here
			} else { // if the appstateKey really represents a new state set it to hash	
				oNavigationHandler.replaceHash(oStoringInformation.appStateKey);
			}
		}

		function fnRestoreGenericFilterState(oGenericData, bApplySearchIfConfigured) {
			if (oGenericData && oGenericData.editStateFilter !== undefined) {
				if (oEditStateFilter) {
					oEditStateFilter.setSelectedKey((oGenericData.editStateFilter === null) ? 0 : oGenericData.editStateFilter);
				}
			}
			// Restore information about visible custom filters
			var aVisibleCustomFields = oGenericData && oGenericData.visibleCustomFields;
			if (aVisibleCustomFields && aVisibleCustomFields.length > 0){
				var aItems = oState.oSmartFilterbar.getAllFilterItems();
				for (var i = 0; i < aItems.length; i++){
					var oItem = aItems[i];
					var sName = oItem.getName();
					if (aVisibleCustomFields.indexOf(sName) !== -1){
						oItem.setVisibleInFilterBar(true);
					}
				}
			}
			bDataAreShownInTable = bApplySearchIfConfigured && !(oGenericData && oGenericData.suppressDataSelection);
			if (bDataAreShownInTable){
				oState.oSmartFilterbar.search();
				//collapse header in case of bookmark or if iappstate is preserved on load of LR
				collapseLRHeaderonLoad(bDataAreShownInTable);
			}
		}

		// method is responsible for retrieving custom filter state. The correspomding extension-method has a more generic name	
		// for historical reasons (change would be incompatible).
		function fnRestoreCustomFilterState(oCustomData) {
			oController.restoreCustomAppStateDataExtension(oCustomData || {});
		}

		// This method is responsible for restoring the data which have been stored via getPageState.
		// However, it must be taken care of data which have been stored with another (historical) format.	
		// Therefore, it is checked whether oCustomAndGenericData possesses two properties with the right names.
		// If this is this case it is assumed that the data have been stored according to curreent logic. Otherwise, it is	
		// assumed that the data have been stored with the current logic. Otherwise, it is assumed that the properties have been
		// stored with a logic containing only custom properties (with possible addition of _editStateFilter).	
		function fnRestorePageState(oCustomAndGenericData, bApplySearchIfConfigured) {
			oCustomAndGenericData = oCustomAndGenericData || {};
			if (oCustomAndGenericData.hasOwnProperty(dataPropertyNameCustom) && oCustomAndGenericData.hasOwnProperty(dataPropertyNameGeneric)) {
				fnRestoreCustomFilterState(oCustomAndGenericData[dataPropertyNameCustom]);
				fnRestoreGenericFilterState(oCustomAndGenericData[dataPropertyNameGeneric], bApplySearchIfConfigured);
			} else {
				// historic format. May still have property _editStateFilter which was used generically.	
				if (oCustomAndGenericData._editStateFilter !== undefined) {
					fnRestoreGenericFilterState({
						editStateFilter: oCustomAndGenericData._editStateFilter
					});
					delete oCustomAndGenericData._editStateFilter;
				}
				fnRestoreCustomFilterState(oCustomAndGenericData);
			}
		}

		// returns a Promise which resolves to an iAppstate-parameter-value pair
		function getUrlParameterInfo(){
			return oAppStateIsSetPromise.then(function(){
				if (oRealizedAppState.appStateKey){
					return {
						"sap-iapp-state": [oRealizedAppState.appStateKey]
					};
				}
				return oRealizedAppState.urlParams;
			});
		}

		// This method is called when some filters or settings are changed (bFilterOrSettingsChange = true) or the data selection for the table is triggered (bDataAreShown = true).
		// It is responsible for:
		// - triggering the creation of a new appState if neccessary
		// - setting global variable bDataAreShownInTable up to date
		function changeIappState(bFilterOrSettingsChange, bDataAreShown){
			if (bIsTransferringUrlStateToPageState){ // the changes are caused by ourselves adopting to the url. So the url needs not to be updated.
				return;
			}
			// if no settings are changed and the data shown state does not change we do not have to do anything (this is the case when the user presses 'Go' and the table is already filled).
			if (bFilterOrSettingsChange || bDataAreShown !== bDataAreShownInTable){
				bDataAreShownInTable = bDataAreShown;
				// Now we have to ensure that the new appstate is set (and put to the url). Therefore, two things have to be done:
				// - bAppStateDirty must be set to true
				// - fnStoreCurrentAppStateAndAdjustURL must be called
				// if bAppStateDirty is already true, we know that fnStoreCurrentAppStateAndAdjustURL is already registered for later execution -> nothing to do 
				if (!bAppStateDirty){
					bAppStateDirty = true;
					// if filterbar dialog is open we do not call fnStoreCurrentAppStateAndAdjustURL directly. It has been registered at the filter dialog close event. 
					if (!oState.oSmartFilterbar.isDialogOpen()){
						// If we are still in the process of evaluating an iappState in the url trigger the new appstate directly. Otherwise postpone it till the end of the thread.
						// Thus, when several filters are changed in one thread, fnStoreCurrentAppStateAndAdjustURL will only be called once. 
						if (fnNotifyRealizedAppStateConsistent){
							fnStoreCurrentAppStateAndAdjustURL();
						} else {
							setTimeout(fnStoreCurrentAppStateAndAdjustURL, 0);
						}
					}
				}
			}
		}

		// This method is called asynchronously from fnParseUrlAndApplyAppState as soon as the appstate-information from the url has been parsed completely.
		// First we check whether the parsed Appstate is still the one which is currently in the url. This is done by comparing
		// the AppStateKey contained in parameter oAppData with sAppStateKeyInUrl. If they are not equal we do not have to deal with this case.
		// Note that there is one exception: During startup due to the order of initialization we do not have sAppStateKeyInUrl set
		// when this function is called. Therefore, the method also does its job, when sAppStateKeyInUrl is still null.
		// Moreover, note that there are two main scenarios in which this method can be called.
		// 1. The AppState in the url has been changed by fnStoreCurrentAppStateAndAdjustURL. This can be detected by oStoringInformation
		// being present and containing the same AppStateKey as oAppData. In this case only oRealizedAppState needs to be adapted.
		// 2. The AppState has been changed by a new url being set (via navigation, bookmarking...). In thsi case the state of the list (filters,...)
		// needs to be adapted.
		function fnAdaptToAppState(fnResolve, oAppData, oURLParameters, sNavType){
			oState.oSmartFilterbar.setSuppressSelection(false);
			var sAppStateKey = oAppData.appStateKey || "";
			if (bIsTransferringUrlStateToPageState){
				return;
			}
			if (sAppStateKeyInUrl === null){ // startup case
				sAppStateKeyInUrl = sAppStateKey;
			} else if (sAppStateKey !== sAppStateKeyInUrl){ // sAppStateKey is already outdated
				return;
			}
			bIsTransferringUrlStateToPageState = true;
			var sSelectionVariant =  oAppData.selectionVariant || "";
			var sTableVariantId = (!bSmartVariantManagement && oAppData.tableVariantId) || "";
			var oNewUrlParameters = (!sAppStateKey && oURLParameters) || {};
			// if there is a navigation from external application to worklist,
			// the filters from external application should not be applied since the worklist does not show smartfilterbar 
			// and there is no way for the user to modify the applied filters. Hence not applying the filters only if it is worklist
			if (!oState.bWorkListEnabled) {
				if ((oRealizedAppState.appStateKey !== sAppStateKey ||
					oRealizedAppState.selectionVariant !== sSelectionVariant ||
					oRealizedAppState.tableVariantId !== sTableVariantId ||
					fnNotEqual(oRealizedAppState.urlParams, oNewUrlParameters)) && sNavType !== sap.ui.generic.app.navigation.service.NavType.initial) {
					if (!oStoringInformation || oStoringInformation.appStateKey !== sAppStateKey){
						var bHasOnlyDefaults = oAppData && oAppData.bNavSelVarHasDefaultsOnly;
						if (oAppData.oSelectionVariant && oRealizedAppState.selectionVariant !== sSelectionVariant){
							var aSelectionVariantProperties = oAppData.oSelectionVariant.getParameterNames().concat(
								oAppData.oSelectionVariant.getSelectOptionsPropertyNames());
							for (var i = 0; i < aSelectionVariantProperties.length; i++) {
								oState.oSmartFilterbar.addFieldToAdvancedArea(aSelectionVariantProperties[i]);
							}
						}
						var oUiState = new UIState({
							selectionVariant: oAppData.oSelectionVariant.toJSONObject()
						});
						oAppData.oUiState = oUiState;
						if (bHasOnlyDefaults && oState.oSmartFilterbar.isCurrentVariantStandard()){
							// given variant has only default values (set by user in FLP), and variant (already loaded) is not user specific
							// => default values have to be added without removing existing values (but overriding them if values for the same filter exist)
							oState.oSmartFilterbar.setUiState(oUiState, {
								bReplace: false,
								bStrictMode: false
							});
						} else if (!bHasOnlyDefaults || oState.oSmartFilterbar.isCurrentVariantStandard()) {
							// A default variant could be loaded.
							oState.oSmartFilterbar.clearVariantSelection();
							oState.oSmartFilterbar.clear();
							oState.oSmartFilterbar.setUiState(oUiState, {
								bReplace: true,
								bStrictMode: false
							});
						}
						if (sTableVariantId !== oRealizedAppState.tableVariantId) {
							oState.oSmartTable.setCurrentVariantId(sTableVariantId);
						}
						// in case of navigation with URL parameters but no xAppState, no CustomData is provided
						oAppData.customData = oAppData.customData || {};

						var sMode = oState.oMultipleViewsHandler && oState.oMultipleViewsHandler.getMode();
						if (sMode) {
							var sPropertyName = sMode === "single" ? "tableViewData" : "tableTabData";
							oState.oMultipleViewsHandler.restoreFromIappState(oAppData.customData[dataPropertyNameGeneric][sPropertyName]); 
						}

						fnRestorePageState(oAppData.customData, true);
					}
					oRealizedAppState = {
						appStateKey: sAppStateKey,
						urlParams: oNewUrlParameters,
						selectionVariant: sSelectionVariant,
						tableVariantId: sTableVariantId
					};
				}
			}
			if (fnNotifyRealizedAppStateConsistent){
				fnNotifyRealizedAppStateConsistent();
				fnNotifyRealizedAppStateConsistent = null;
			}

			// If the NavType is iAppState the question of automated data selection is already settled.
			// Otherwise it must be done now. Note that automatisms have been disabled during startup
			// However, if bDataAreShownInTable is already true, the data have already been selected and nothing needs to be done anymore.
			// This is the case in FCL scenarios, when navigating from an automatically filled list to a detail.
			if (sNavType !== sap.ui.generic.app.navigation.service.NavType.iAppState && !bDataAreShownInTable){
				// If the app is reached via cross-app navigation by UX decision the data should be shown immediately
				var bIsCrossAppNavigation = (sNavType === sap.ui.generic.app.navigation.service.NavType.xAppState 
					|| sNavType === sap.ui.generic.app.navigation.service.NavType.URLParams) && !oAppData.bNavSelVarHasDefaultsOnly;
				bDataAreShownInTable = bIsCrossAppNavigation || oState.bLoadListAndFirstEntryOnStartup || bIsAutoBinding || oState.oSmartFilterbar.isCurrentVariantExecuteOnSelectEnabled();
				if (bDataAreShownInTable){
					oState.oSmartFilterbar.search();
					//collapse header if execute on select is checked or enableautobinding is set
					collapseLRHeaderonLoad(bDataAreShownInTable);
				}
			}
			oStoringInformation = null;
			fnResolve();
			bIsTransferringUrlStateToPageState = false;
		}

		function fnParseUrlAndApplyAppState(){
			if (!fnNotifyRealizedAppStateConsistent){
				oAppStateIsSetPromise = new Promise(function(fnResolve){
					fnNotifyRealizedAppStateConsistent = fnResolve;
				});
			}
			var oRet = new Promise(function(fnResolve, fnReject){
				var oParseNavigationPromise = oNavigationHandler.parseNavigation();
				oParseNavigationPromise.done(fnAdaptToAppState.bind(null, fnResolve));
				oParseNavigationPromise.fail(fnReject);
			});
			return oRet;
		}

		function onBeforeSFBVariantFetch(){
			/* new event, that is - unless the old onBeforeSFBVariantSave - also called also before the adapt filter 
			 * dialog opens. In all other cases, both events are called, so no need to implement onBeforeSFBVariantSave
			 * anymore
			 */
			var oCurrentAppState = getCurrentAppState();
			oState.oSmartFilterbar.setFilterData({
				_CUSTOM: oCurrentAppState.customData
			});
		}

		function onAfterSFBVariantSave(){
			changeIappState(true, bDataAreShownInTable);
		}

		function onAfterSFBVariantLoad(oEvent) {
			var sContext = oEvent.getParameter("context");
			var oData = oState.oSmartFilterbar.getFilterData();
			if (oData._CUSTOM !== undefined) {
				fnRestorePageState(oData._CUSTOM);
			} else {
				// make sure that the custom data are nulled for the STANDARD variant
				var oCustomAndGenericData = getPageState();
				fnNullify(oCustomAndGenericData[dataPropertyNameCustom]);
				fnNullify(oCustomAndGenericData[dataPropertyNameGeneric]);
				fnRestorePageState(oCustomAndGenericData);
			}
			// store navigation context
			if (aIrrelevantVariantLoadContext.indexOf(sContext) < 0) {
				bDataAreShownInTable = oEvent.getParameter("executeOnSelect");
				changeIappState(true, bDataAreShownInTable);
			}
		}

		function onAfterTableVariantSave() {
			if (!bSmartVariantManagement){
				changeIappState(true, bDataAreShownInTable);
			}
		}

		function onAfterApplyTableVariant() {
			if (!bSmartVariantManagement){
				changeIappState(true, bDataAreShownInTable);
			}
		}

		// This method is called by the NavigationController when a new url is caught. It is the task of this method to provide the information, whether
		// the url change is just an appstate-change which can be handled by this class alone. In this case whole route-matched logic would not be started.
		// Whether this is the case is found out by checking whether oStoringInformation is currently truthy and contains the same AppStateKey as the url.
		// If this is the case we direrctly call fnParseUrlAndApplyAppState. Otherwise, it will be called later via the ComponentActivate.
		// Anyway we use this method to keep sAppStateKeyInUrl up to date.
		function isStateChange(oEvent){
			var oArguments = oEvent.getParameter("arguments");
			var oQuery = oArguments && oArguments["?query"];
			sAppStateKeyInUrl = (oQuery && oQuery["sap-iapp-state"]) || ""; // better get a Denver API for this
			if (oStoringInformation){
				if (oStoringInformation.appStateKey !== sAppStateKeyInUrl){
					jQuery.sap.log.error("ListReport.fnStoreCurrentAppStateAndAdjustURL: Got AppstateKey " + sAppStateKeyInUrl + " expected " + oStoringInformation.appStateKey);
					return false;
				}
				fnParseUrlAndApplyAppState();
				return true;
			}
			return false;
		}

		function onSmartFilterBarInitialise(){
			bIsAutoBinding = oState.oSmartTable.getEnableAutoBinding();
			oState.oSmartFilterbar.attachFiltersDialogClosed(fnStoreCurrentAppStateAndAdjustURL);
		}

		//collapse dynamic header if data is preloaded in LR on launch
		function collapseLRHeaderonLoad(bDataAreShownInTable){
			if (oController && oController.getOwnerComponent && oController.getOwnerComponent().getModel) {
				var oTemplatePrivateModel = oController.getOwnerComponent().getModel("_templPriv");
				if (bDataAreShownInTable) {
					// if data is shown, collapse header
					oTemplatePrivateModel.setProperty("/listReport/isHeaderExpanded", false);
				} else {
					// if no data is shown on load, expand header
					oTemplatePrivateModel.setProperty("/listReport/isHeaderExpanded", true);
				}
			}
		}

		// Make the getCurrentAppState function available for others via the oState object
		oState.getCurrentAppState = getCurrentAppState;

		return {
			areDataShownInTable: areDataShownInTable,
			parseUrlAndApplyAppState: fnParseUrlAndApplyAppState,
			getUrlParameterInfo: getUrlParameterInfo,
			changeIappState: changeIappState,
			onSmartFilterBarInitialise: onSmartFilterBarInitialise,
			onBeforeSFBVariantFetch: onBeforeSFBVariantFetch,
			onAfterSFBVariantSave: onAfterSFBVariantSave,
			onAfterSFBVariantLoad: onAfterSFBVariantLoad,
			onAfterTableVariantSave: onAfterTableVariantSave,
			onAfterApplyTableVariant: onAfterApplyTableVariant,
			isStateChange: isStateChange
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.ListReport.controller.IappStateHandler", {
		constructor: function(oState, oController, oNavigationHandler) {
			jQuery.extend(this, getMethods(oState, oController, oNavigationHandler));
		}
	});
});