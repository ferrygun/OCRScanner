sap.ui.define(["jquery.sap.global", "sap/ui/base/Object",
		"sap/suite/ui/generic/template/ListReport/controller/MultipleViewsSingleTableModeHelper",
		"sap/suite/ui/generic/template/ListReport/controller/MultipleViewsMultipleTablesModeHelper",
		"sap/suite/ui/generic/template/lib/BusyHelper"
	],
	function(jQuery, BaseObject, MultiViewsSingleTableHelper, MultiViewsMultiTablesHelper, BusyHelper) {
		"use strict";

		/*
		 * This helper class handles multiple views in the List Report.
		 * It is a wrapper for MultipleViewsMultipleTablesModeHelper and MultipleViewSingleTableModeHelper
		 * this class is created in onInit of the ListReport controller.
		 * 
		 *  That controller forwards all tasks
		 * connected to the single table mode of the multiple views feature to this instance.
		 * The mode can be switched on and configured via the quickVariantSelection.variants section in the manifest.
		 * 
		 */

		// constants
		// This class uses a section in the template private model to transfer information between javascript and UI. 
		// The following constants represent the pathes in the model that are used to access this information
		var PATH_TO_PROPERTIES = "/listReport/multipleViews"; // root path for all properties used for this feature
		var PATH_TO_SELECTED_KEY = PATH_TO_PROPERTIES + "/selectedKey"; // path to the key of the currently active view
		var PATH_TO_MODE = PATH_TO_PROPERTIES + "/mode";  // path to either "single" or "multiple"
		var PATH_TO_ITEMS = PATH_TO_PROPERTIES + "/items";
		// These data are needed by formatter formatItemTextForMultipleView to determine the text (including counts) for this item
		// Therefore, this map is only created when the showCounts property is set. In this case the item data contain the following properties: 
		// text: The fixed text belonging to this item
		// count: Current count of this item
		// state: possible values are "" = count can be used, "busy" = count is currently being determined, "error" = error happened when determining the count

		// oState is used as a channel to transfer data to the controller and back.
		// oController is the controller of the enclosing ListReport
		// oTemplateUtils are the template utils as passed to the controller implementation
		function getMethods(oState, oController, oTemplateUtils) {
			// Begin: Instance variables
			var oImplementingHelper;
			var sMode;
			var bShowCounts;
			var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel(); // the template private model used to transfer data between javascript and UI
			// Variables representing the current state
			var oCurrentBindingParams = {}; // current binding parameters: set in onBeforeRebindTable, evaluated in fnUpdateCounts
			var mItemData; // maps the keys of the items onto metadata of the corresponding views used in this class. The metadata contains the following properties:
			// selectionVariantFilters: The filters valid for this item
			// templateSortOrder: the sort order used for this item
			// the following properties are only available when the showCounts property is set:
			// numberOfUpdates: a counter increased for each call request that is performed for updating the text for this item. Used to identify outdated requests.
			// updateStartFunction, updateSuccessFunction, errorFunction: functions to be called, when the update of counters is started, has entered successfully, has run into an error
			//         each of these function gets the value of numberOfUpdates valid when the update is started as first parameter
			//         updateSuccessFunction gets the count that was retrieved as second parameter

			var iDefaultDelayMs = oTemplateUtils.oServices.oApplication.getBusyHelper().getBusyDelay();
			// End: Instance variables

			// Begin private instance methods

			function fnRegisterToChartEvents() {
				if (oImplementingHelper && oImplementingHelper.fnRegisterToChartEvents) {
					return oImplementingHelper.fnRegisterToChartEvents.apply(null, arguments);
				}
			}

			function onDetailsActionPress() {
				if (oImplementingHelper && oImplementingHelper.onDetailsActionPress) {
					return oImplementingHelper.onDetailsActionPress.apply(null, arguments);
				}
			}

			// callback called in onBeforeRebindTable
			// called to provide sort order information of the smart table
			function fnDetermineSortOrder() {
				if (!oImplementingHelper) {
					return;
				}
				var oItemData = getCurrentItemData(); // get metadata of selected item
				return oItemData.templateSortOrder;
			}

			// formatter for the text on the items (only used when showCounts is switched on)
			// oItemDataModel: current data for the item as described in the comment for PATH_TO_ITEMS
			// returns the text to be used for the item
			function formatItemTextForMultipleView(oItemDataModel) {
				var sFormatedValue;
				if (!oItemDataModel) {
					return "";
				}
				if (oItemDataModel.state === "error") {
					return oTemplateUtils.oCommonUtils.getText("SEG_BUTTON_ERROR", oItemDataModel.text);
				}
				if (oItemDataModel.state === "" || oItemDataModel.state === "busy") {
					var oIntegerInstance = sap.ui.core.format.NumberFormat.getIntegerInstance({
						style: "short"
					});
					sFormatedValue = oIntegerInstance.format(oItemDataModel.count);
				}
				return oTemplateUtils.oCommonUtils.getText("SEG_BUTTON_TEXT", [oItemDataModel.text, oItemDataModel.state === "busyLong" ? "..." : sFormatedValue]);
			}

			function getContentForIappState() {
				if (oImplementingHelper) {
					var sSelectedKey = oTemplatePrivateModel.getProperty(PATH_TO_SELECTED_KEY);
					var oTableState = oImplementingHelper.getContentForIappState(sSelectedKey);
					return {
						mode: sMode,
						state: oTableState
					};
				}
			}

			function fnRestoreFromIappState(oGenericData) {
				if (oImplementingHelper) {
					var sSelectedKey = oImplementingHelper.getSelectedKeyAndRestoreFromIappState(oGenericData);
					oTemplatePrivateModel.setProperty(PATH_TO_SELECTED_KEY, sSelectedKey);
				}
			}

			// get the key of the currently selected item
			function getVariantSelectionKey() {
				return oTemplatePrivateModel.getProperty(PATH_TO_SELECTED_KEY);
			}

			// Note: This method is called for each smart table/chart used to realize the feature when it is initialized. 
			// In single mode this is exactly once, in multi mode it will be several times.
			function fnInit(oEvent) {
				if (!oImplementingHelper) {
					return;
				}
				var setModelDataForItem = function(sKey, oControl, oSelectionVariantFilters) {
					var oCustomData = oTemplateUtils.oCommonUtils.getElementCustomData(oControl); // retrieve custom data for this table
					// ImplementingHelper might already have initialized the item data for this key. In this case enhance them, otherwise create them.
					var oItemData = mItemData[sKey] || Object.create(null);
					oItemData.selectionVariantFilters = oSelectionVariantFilters;
					oItemData.templateSortOrder = oCustomData.TemplateSortOrder;
					oItemData.implementingControl = oControl;
					mItemData[sKey] = oItemData;
					if (bShowCounts) {
						var sPathToTheItem = PATH_TO_ITEMS + "/" + sKey;
						// sState can be "busy" (start of determination of counts), "busyLong" (determination of counts lasts longer than 1000ms), "" (determination was finished successfully), "error" (determination failed)
						// iNumberOfUpdates is the identification of the backend call
						// iNewCount is the newly determined count (only valid when sState is "")
						var fnUpdateFunction = function(sState, iNumberOfUpdates, iNewCount) {
							if (oItemData.numberOfUpdates !== iNumberOfUpdates) { // this is the response for an outdated request
								return;
							}
							var oModelEntry = jQuery.extend({}, oTemplatePrivateModel.getProperty(sPathToTheItem)); // must create a new instance. Otherwise UI5 will not recognize the change
							if (!oModelEntry.state && sState == "busy") {
								setTimeout(function() {
									if (oTemplatePrivateModel.getProperty(sPathToTheItem).state === "busy") {
										oModelEntry = jQuery.extend({}, oTemplatePrivateModel.getProperty(sPathToTheItem)); // must create a new instance. Otherwise UI5 will not recognize the change
										oModelEntry.state = "busyLong";
										oTemplatePrivateModel.setProperty(sPathToTheItem, oModelEntry); // Note that this will trigger the call of formatItemTextForMultipleView
									}
								}, iDefaultDelayMs);
							}
							oModelEntry.state = sState; // update the state
							if (!sState) { // determination was successfull -> update the count
								oModelEntry.count = iNewCount;
							}
							oTemplatePrivateModel.setProperty(sPathToTheItem, oModelEntry); // Note that this will trigger the call of formatItemTextForMultipleView
						};
						oItemData.numberOfUpdates = 0;
						oItemData.updateStartFunction = fnUpdateFunction.bind(null, "busy");
						oItemData.updateSuccessFunction = fnUpdateFunction.bind(null, "");
						oItemData.errorFunction = fnUpdateFunction.bind(null, "error");
						var oModelEntry = {
							text: oCustomData.text,
							count: 0, // at initialization 0 will be displayed as counter everywhere
							state: ""
						};
						oTemplatePrivateModel.setProperty(sPathToTheItem, oModelEntry);
					}
				};
				oImplementingHelper.init(oEvent, setModelDataForItem);
			}

			function getMode() {
				return sMode;
			}

			// get metadata of the currently selected item
			function getCurrentItemData() {
				return mItemData[oTemplatePrivateModel.getProperty(PATH_TO_SELECTED_KEY)]; // return metadata of selected item
			}

			// callback called by onBeforeRebindTable of the smart table
			// add filters of the selected item to the search condition
			function onRebindContentControl(oEvent) {
				if (!oImplementingHelper) {
					return;
				}
				var oBindingParams = oEvent.getParameter("bindingParams");
				oCurrentBindingParams.filters = oBindingParams.filters.slice(0); // copy filters
				oCurrentBindingParams.parameters = oBindingParams.parameters;
				var oItemData = getCurrentItemData(); // get metadata of selected item
				var aSelectionVariantFilters = oItemData.selectionVariantFilters;
				for (var i in aSelectionVariantFilters) { // add the filters of the selected item
					oBindingParams.filters.push(aSelectionVariantFilters[i]);
				}
			}

			// Trigger update of the texts on all items
			function fnUpdateCounts() {
				var oModel = oState.oSmartTable.getModel();
				var sTableEntitySet = oState.oSmartTable.getEntitySet();
				var sSearchValue = oState.oSmartFilterbar.getBasicSearchValue();
				var oSearch = {};
				if (sSearchValue) {
					oSearch = {
						search: sSearchValue
					};
				}
				for (var sKey in mItemData) { // loop over all items
					var oItemData = mItemData[sKey]; // get metadata for this item
					oItemData.numberOfUpdates++; // start a new update call
					oItemData.updateStartFunction(oItemData.numberOfUpdates); // set counter busy
					var aFilters = oCurrentBindingParams.filters.concat(oItemData.selectionVariantFilters); // note, that this does not modify the arrays which are concatenated
					oModel.read("/" + sTableEntitySet + "/$count", {
						urlParameters: oSearch,
						filters: aFilters,
						groupId: "updateMultipleViewsItemsCounts", // send the requests for all count updates in one batch request
						success: oItemData.updateSuccessFunction.bind(null, oItemData.numberOfUpdates), // bind the success handler to the current request
						error: oItemData.errorFunction.bind(null, oItemData.numberOfUpdates) // bind the error handler to the current request
					});
				}
			}

			function onDataRequested() {
				if (bShowCounts) {
					fnUpdateCounts();
				}
			}

			function getImplementingHelper() {
				return oImplementingHelper;
			}

			// End private instance methods

			(function() { // constructor coding encapsulated in order to reduce scope of helper variables 
				var oConfig, oSettings, oQuickVariantSelectionX, oQuickVariantSelection;
				oConfig = oController.getOwnerComponent().getAppComponent().getConfig();
				oSettings = oConfig && oConfig.pages[0] && oConfig.pages[0].component && oConfig.pages[0].component.settings;
				if (!oSettings) {
					return;
				}
				oQuickVariantSelectionX = oSettings.quickVariantSelectionX;
				oQuickVariantSelection = oSettings.quickVariantSelection;
				if (oQuickVariantSelectionX && oQuickVariantSelection) {
					throw new Error("Defining both QuickVariantSelection and QuickVariantSelectionX in the manifest is not allowed.");
				}
				var oQuickVariantSelectionEffective = oQuickVariantSelectionX || oQuickVariantSelection;
				if (!oQuickVariantSelectionEffective) {
					return;
				}
				bShowCounts = oQuickVariantSelectionEffective.showCounts;
				mItemData = Object.create(null);
				oTemplatePrivateModel.setProperty(PATH_TO_PROPERTIES, Object.create(null));
				var bInitialKeyMayBeSet = true;
				var fnSetInitialKey = function(sInitialKey){
					if (bInitialKeyMayBeSet){
						bInitialKeyMayBeSet = false;
						oTemplatePrivateModel.setProperty(PATH_TO_SELECTED_KEY, sInitialKey);
					}
					
				};
				if (oQuickVariantSelection) {
					oImplementingHelper = new MultiViewsSingleTableHelper(oQuickVariantSelection, oState, oController, oTemplateUtils, fnSetInitialKey, mItemData);
					sMode = "single";
					jQuery.sap.log.info("This list supports multiple views with single table");
				} else {
					oImplementingHelper = new MultiViewsMultiTablesHelper(oQuickVariantSelectionX, oState, oController, oTemplateUtils, fnSetInitialKey, mItemData);
					sMode = "multi";
					jQuery.sap.log.info("This list supports multiple views with multiple tables/charts");
				}
				oTemplatePrivateModel.setProperty(PATH_TO_MODE, sMode);
				oTemplatePrivateModel.setProperty(PATH_TO_ITEMS, Object.create(null));
				var oBinding = oTemplatePrivateModel.bindProperty(PATH_TO_SELECTED_KEY);
				oBinding.attachChange(function(oChangeEvent) {
					if (oImplementingHelper.onSelectedKeyChanged) {
						var sNewKey = oChangeEvent.getSource().getValue();
						oImplementingHelper.onSelectedKeyChanged(sNewKey);
					}
					var bSearchButtonPressed = oState.oIappStateHandler.areDataShownInTable();
					var bTableIsDirty = true;
					// check dirty state of current table (if not dirty, no refresh is required)
					// only relevant for multiple table mode
					if (typeof oImplementingHelper.isTableDirty === 'function') {
						bTableIsDirty = oImplementingHelper.isTableDirty(oState.oSmartTable);
					}
					if (bSearchButtonPressed && bTableIsDirty) {
						if (oTemplateUtils.oCommonUtils.isSmartChart(oState.oSmartTable)) {
							oState.oSmartTable.rebindChart();
							if (typeof oImplementingHelper.setTableDirty === 'function') {
								oImplementingHelper.setTableDirty(oState.oSmartTable, false);
							}
							//as a new variant is selected, we need both - rebind and refresh
						} else if (oTemplateUtils.oCommonUtils.isSmartTable(oState.oSmartTable)) {
							oState.oSmartTable.rebindTable();
							oTemplateUtils.oCommonUtils.refreshSmartTable(oState.oSmartTable);
							// moved to ControllerImplementation.onDataReceived
							/*
							if (typeof oImplementingHelper.setTableDirty === 'function') {
								oImplementingHelper.setTableDirty(oState.oSmartTable, false);
							}
							*/
						}
					} else {
						// need to update the toolbar button visibility here as the delete button would not be updated otherwise
						// see BCP:1770601204
						oTemplateUtils.oCommonUtils.setEnabledToolbarButtons(oState.oSmartTable);
					}
					oState.oIappStateHandler.changeIappState(true, bSearchButtonPressed);
				});
			})();

			// public instance methods
			return {
				fnRegisterToChartEvents: fnRegisterToChartEvents,
				onDetailsActionPress: onDetailsActionPress,
				determineSortOrder: fnDetermineSortOrder,
				onDataRequested: onDataRequested,
				formatItemTextForMultipleView: formatItemTextForMultipleView,
				getContentForIappState: getContentForIappState,
				restoreFromIappState: fnRestoreFromIappState,
				getVariantSelectionKey: getVariantSelectionKey, // expose the selected key for extensionAPI
				init: fnInit,
				getMode: getMode,
				onRebindContentControl: onRebindContentControl,
				getImplementingHelper: getImplementingHelper
			};
		}

		return BaseObject.extend("sap.suite.ui.generic.template.ListReport.controller.MultipleViewsHandler", {
			constructor: function(oState, oController, oTemplateUtils) {
				jQuery.extend(this, getMethods(oState, oController, oTemplateUtils));
			}
		});
	});