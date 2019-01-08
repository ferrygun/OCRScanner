sap.ui.define(["jquery.sap.global", "sap/ui/base/Object", "sap/ui/Device", "sap/ui/model/Context", "sap/ui/model/json/JSONModel",
		"sap/m/Table", "sap/m/ListBase", "sap/m/MessageBox",
		"sap/ui/generic/app/navigation/service/NavigationHandler", "sap/ui/generic/app/navigation/service/NavError",
		"sap/suite/ui/generic/template/lib/testableHelper"],
		function(jQuery, BaseObject, Device, Context, JSONModel, ResponsiveTable, ListBase, MessageBox,
				NavigationHandler, NavError, testableHelper) {
	"use strict";

	function getNavigationProperty(oPageEntries, sEntitySet) {
		for (var i in oPageEntries) {
			var oEntry = oPageEntries[i];
			if (oEntry.entitySet === sEntitySet && oEntry.component.list && oEntry.navigationProperty) {
				return oEntry.navigationProperty;
			} else if (oEntry.pages) {
				var result = getNavigationProperty(oEntry.pages, sEntitySet);
				if (result) {
					return result;
				}
			}
		}
	}

	/* For better testablity and for code harmonization testing controls for their type is moved to helper functions */

	function isControlOfType(oControl, sPathToType){
		var FNClass = sap.ui.require(sPathToType);
        return typeof FNClass === "function" && (oControl instanceof FNClass);
	}

	function isSmartTable(oControl){
		return isControlOfType(oControl, "sap/ui/comp/smarttable/SmartTable");
	}

	function isSmartChart(oControl){
		return isControlOfType(oControl, "sap/ui/comp/smartchart/SmartChart");
	}
	
	function isUiTable(oControl){
		return isControlOfType(oControl, "sap/ui/table/Table");
	}
	
	function isAnalyticalTable(oControl){
		return isControlOfType(oControl, "sap/ui/table/AnalyticalTable");
	}

	// Expose selected private static functions to unit tests
	/* eslint-disable */
	var isSmartTable = testableHelper.testableStatic(isSmartTable, "CommonUtils_isSmartTable");
	/* eslint-enable */

	function getMethods(oController, oServices, oComponentUtils) {

		var oNavigationHandler; // initialized on demand

		// defines a dependency from oControl to the view
		function fnAttachControlToView(oControl) {
		    oServices.oApplication.attachControlToParent(oControl, oController.getView());
		}

		// See documentation of
		// sap.suite.ui.generic.template.lib.CommonUtils.prototype.getSelectedContexts.getDialogFragment below
		function getDialogFragment(sName, oFragmentController, sModel, fnOnFragmentCreated) {
		    return oServices.oApplication.getDialogFragmentForView(oController.getView(), sName, oFragmentController, sModel, fnOnFragmentCreated);
		}

		var oResourceBundle; // initialized on first use
		function getText() {
			oResourceBundle = oResourceBundle || oController.getOwnerComponent().getModel("i18n").getResourceBundle();
			return oResourceBundle.getText.apply(oResourceBundle, arguments);
		}
		// This functions intends to give selection from different selection behavior
		function getSelectionPoints(oChart) {
			var sSelectionBehavior = oChart.getSelectionBehavior();
			if (sSelectionBehavior === "DATAPOINT"){
				return {"dataPoints": oChart.getSelectedDataPoints().dataPoints, "count": oChart.getSelectedDataPoints().count };
			} else if (sSelectionBehavior === "CATEGORY") {
				return {"dataPoints": oChart.getSelectedCategories().categories, "count": oChart.getSelectedCategories().count };
			} else if (sSelectionBehavior === "SERIES") {
				return {"dataPoints": oChart.getSelectedSeries().series, "count": oChart.getSelectedSeries().count };
			}
		}

		function getSelectedContexts(oControl) {
			var aSelectedContexts = [];
			if (isSmartTable(oControl)) {
				oControl = oControl.getTable();
			} else if (isSmartChart(oControl)) {
				oControl = oControl.getChart();
				if (oControl && oControl.getMetadata().getName() === "sap.chart.Chart") {
					var mDataPoints, isContext = false;
					mDataPoints = getSelectionPoints(oControl);
					if (mDataPoints && mDataPoints.count > 0) {
						if (oControl.getSelectionBehavior() === "DATAPOINT"){
							isContext = true;
						}
						var aDataPoints = mDataPoints.dataPoints;
						var paramList = [];
						for (var i = 0; i < aDataPoints.length; i++) {
							if (isContext){
								if (aDataPoints[i].context){
									aSelectedContexts.push(aDataPoints[i].context);
								}
							} else {
								//if context does not exist it is selection behavior category or series
								paramList.push(aDataPoints[i].dimensions);
							}
						}
						if (!isContext){
							aSelectedContexts[0] = paramList;
						}
					}
				}
			}
			if (oControl instanceof ListBase) {
				aSelectedContexts = oControl.getSelectedContexts();
			} else if (isUiTable(oControl)) {
				var aIndex = oControl.getSelectedIndices();
				for (var i = 0; i < aIndex.length; i++) {
					aSelectedContexts.push(oControl.getContextByIndex(aIndex[i]));
				}
			}
			return aSelectedContexts;
		}

		function getElementCustomData(oElement) {
			var oCustomData = {};
			if (oElement instanceof sap.ui.core.Element) {
				oElement.getCustomData().forEach(function(oCustomDataElement) {
					oCustomData[oCustomDataElement.getKey()] = oCustomDataElement.getValue();
				});
			}
			return oCustomData;
		}

		/*
		 * Sets the enabled value for Toolbar buttons
		 * @param {object} oSubControl
		 */
		function fnSetEnabledToolbarButtons (oSubControl) {
			var aToolbarControls, aButtons, oToolbarControl, sLocalButtonId, bEnabled, mCustomData;
			var oControl = getOwnerControl(oSubControl);  // look for parent table or chart
			if (!isSmartTable(oControl) && !isSmartChart(oControl)) {
				oControl = oControl.getParent();
			}
			var aContexts = getSelectedContexts(oControl);
			var oModel = oControl.getModel();
			var oMetaModel = oModel.getMetaModel();
			var oView = oController.getView();

			if (isSmartTable(oControl)) {
				aToolbarControls = oControl.getCustomToolbar() && oControl.getCustomToolbar().getContent();

				// Breakout Action buttons
				// for now the breakout actions is only for SmartTable and use a different approach to update the private model
				aButtons = getBreakoutActionsForTable(oControl);
				fnFillEnabledMapForBreakoutActions(aButtons, aContexts, oModel);
			} else if (isSmartChart(oControl)) {
				aToolbarControls = oControl.getToolbar() && oControl.getToolbar().getContent();
				var oAppComponent = oController.getOwnerComponent().getAppComponent();
				var oConfig = oAppComponent.getConfig();
				// ALP doesn't support quickVariantSelectionX Settings, hence this check to handle ALP's case
				if (oController.getMetadata().getName() === 'sap.suite.ui.generic.template.AnalyticalListPage.view.AnalyticalListPage'){
					aButtons = getBreakoutActionsForChart(oControl);
					fnFillEnabledMapForBreakoutActions(aButtons, aContexts, oModel, oControl);
				} else if (oConfig && oConfig.pages[0] && oConfig.pages[0].component && oConfig.pages[0].component.settings && oConfig.pages[0].component.settings.quickVariantSelectionX) {
					aButtons = getBreakoutActionsForChart(oControl);
					fnFillEnabledMapForBreakoutActions(aButtons, aContexts, oModel);
				}
			}

			// loop through the array of controls inside the toolbar
			if (aToolbarControls && aToolbarControls.length > 0) {
				for (var i = 0; i < aToolbarControls.length; i++) {
					bEnabled = undefined;
					oToolbarControl = aToolbarControls[i];

					if (oToolbarControl.getMetadata().getName() === "sap.m.Button" && oToolbarControl.getVisible()) {
						// we determine the type of button (e.g. Delete button, Annotated Action button etc...) via the CustomData "Type"
						mCustomData = getElementCustomData(oToolbarControl);
						if (mCustomData && mCustomData.Type) {
							// get the partial id, instead of the full id generated by ui5
							// partial id is used when initially building the expression - see method buildAnnotatedActionButtonEnablementExpression in AnnotationHelper.js
							sLocalButtonId = oView.getLocalId(oToolbarControl.getId());
							// 1. Type = "CRUDActionDelete" -> Delete button
							// 2. Type = "com.sap.vocabularies.UI.v1.DataFieldForAction" or "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" -> Annotated Action button
							if (mCustomData.Type === "CRUDActionDelete") {
								bEnabled = fnShouldDeleteButtonGetEnabled(oModel, oMetaModel, aContexts, oControl);
								oControl.getModel("_templPriv").setProperty("/listReport/deleteEnabled", bEnabled);
							} else if (mCustomData.Type === "com.sap.vocabularies.UI.v1.DataFieldForAction" || mCustomData.Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") {
								bEnabled = fnShouldAnnotatedActionButtonGetEnabled(oModel, oMetaModel, aContexts, mCustomData.Type, mCustomData.Action, oControl);
							}
						}

						// check if "enabled" is bound to the path '/generic/controlProperties/' in the model - otherwise it's bound to another path or has a hard coded true/false
						if (/generic\/controlProperties/.test(oToolbarControl.getBindingPath("enabled")) && bEnabled !== undefined) {
							fnSetPrivateModelControlProperty(sLocalButtonId, "enabled", bEnabled);
						}
					}
				}
			}
		}

		function fnSetEnabledFooterButtons (oEventSource) {
			var aButtons;
			var oControl = getOwnerControl(oEventSource);
			var aContexts = getSelectedContexts(oControl);
			var oModel = oEventSource.getModel();
			aButtons = getBreakoutActionsForFooter();
			fnFillEnabledMapForBreakoutActions(aButtons, aContexts, oModel, oControl);
		}

		/*
		 * Updates the private model control property
		 * @param {string} sId - the id of the button in the private model
		 * @param {string} sProperty - the name of the property in the private model
		 * @param {string} sValue - the value of the property
		 */
		function fnSetPrivateModelControlProperty (sId, sProperty, sValue) {
			var oTemplatePrivateModel = oController.getView().getModel("_templPriv");
			var mModelProperty = oTemplatePrivateModel.getProperty("/generic/controlProperties/" + sId);
			// check if the id exists in the model
			if (!mModelProperty) {
				mModelProperty = {};
				mModelProperty[sProperty] = sValue;
				oTemplatePrivateModel.setProperty("/generic/controlProperties/" + sId, mModelProperty);
			} else {
				oTemplatePrivateModel.setProperty("/generic/controlProperties/" + sId + "/" + sProperty, sValue);
			}
		}

		/*
		 * Determines whether an Annotated Action should be enabled or disabled
		 * @private
		 */
		function fnShouldAnnotatedActionButtonGetEnabled (oModel, oMetaModel, aContexts, sType, sAction, oControl) {
			var mFunctionImport, mData, sActionFor, sApplicablePath;
			var bEnabled = false;

			if (sType === "com.sap.vocabularies.UI.v1.DataFieldForAction") {
				mFunctionImport = oMetaModel.getODataFunctionImport(sAction);
				sActionFor = mFunctionImport && mFunctionImport["sap:action-for"];
				// check if 'sap:action-for' is defined
				if (sActionFor && sActionFor !== "" && sActionFor !== " ") {
					if (aContexts.length > 0) {
						sApplicablePath = mFunctionImport["sap:applicable-path"];
						// check if 'sap:applicable-path' is defined
						if (sApplicablePath && sApplicablePath !== "" && sApplicablePath !== " ") {
							for (var j = 0; j < aContexts.length; j++) {
								if (!aContexts[j]) {
									continue;
								}
								mData = oModel.getObject(aContexts[j].getPath()); // get the data
								if (mData && mData[sApplicablePath] === true) {
									bEnabled = true;  //  'sap:action-for' defined, 'sap:applicable-path' defined, 'sap-applicable-path' value is true, more than 1 selection -> enable button
									break;
								}
							}
						} else {
							bEnabled = true; // 'sap:action-for' defined, 'sap:applicable-path' not defined, more than 1 selection -> enable button
						}
					}
				} else {
					bEnabled = true; // 'sap:action-for' not defined, no selection required -> enable button
				}
			} else if (sType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") { // to enable UI.DataFieldForIntentBasedNavigation action button at least one selection is required
				// enable the button to true if any chart selection is made or any drill down is performed with some selections already being present
				if (aContexts.length > 0 || (isSmartChart(oControl) && oControl.getDrillStackFilters().length > 0)){
					bEnabled = true;
				}
			}

			return bEnabled;
		}

		/*
		 * Determines whether the Delete button should be enabled or disabled
		 * @private
		 */
		function fnShouldDeleteButtonGetEnabled (oModel, oMetaModel, aContexts, oControl) {
			// Get the DeleteRestrictions for the entity set
			var mDeleteRestrictions = fnGetDeleteRestrictions(oControl);

			// 1- Make Delete button disabled and assume all items are NOT deletable
			// 2- Check if the DeleteRestrictions are valid. if not-> Delete button disabled
			// 3- Check if the Deletable-path is defined. if not-> Delete button enabled.
			// if there is no DeleteRestrictions, this means the entities are deletable
			var bEnabled = false;
			var mRelatedEntitySet = oMetaModel.getODataEntitySet(oControl.getEntitySet());
			if (sap.suite.ui.generic.template.js.AnnotationHelper.areDeleteRestrictionsValid(oMetaModel, mRelatedEntitySet.entityType, mDeleteRestrictions)) {
				if (aContexts.length > 0) {
					var sDeletablePath = mDeleteRestrictions && mDeleteRestrictions.Deletable && mDeleteRestrictions.Deletable.Path;
					if (sDeletablePath) {
						for (var i = 0; i < aContexts.length; i++) {
							if (aContexts[i] && oModel.getProperty(sDeletablePath, aContexts[i])) {
								bEnabled = true;
								break;
							}
						}
					} else {
						bEnabled = true;
					}
				}
			}

			return bEnabled;
		}

		/*
		 * Returns the Deletable Restrictions
		 * @param {object} oControl - must be of a Smart Control (e.g. SmartTable, SmartChart)
		 */
		function fnGetDeleteRestrictions(oControl) {
			var oMetaModel = oControl.getModel() && oControl.getModel().getMetaModel();
			var mEntitySet = oMetaModel && oMetaModel.getODataEntitySet(oControl.getEntitySet());
			var mDeleteRestrictions = mEntitySet && mEntitySet["Org.OData.Capabilities.V1.DeleteRestrictions"];
			return mDeleteRestrictions;
		}

		/*
		* Update map /generic/listCommons/breakoutActionsEnabled from selected context,
		* considering the applicable path and action-for
		*/
		function fnFillEnabledMapForBreakoutActions(aButtons, aContexts, oModel, oControl) {
			var oBreakoutActions = fnGetBreakoutActionsFromManifest(oModel);
			var oTemplatePrivateModel = oController.getView().getModel("_templPriv");
			var oBreakOutActionEnabled = oTemplatePrivateModel.getProperty("/generic/listCommons/breakoutActionsEnabled");
			if (oBreakoutActions) {
				var oIconTabBar = oController.byId("template::IconTabBar");
				var sSelectedTabKey = "";
				if (oIconTabBar) {
					sSelectedTabKey = oIconTabBar.getSelectedKey();
				}
				fnUpdateBreakoutEnablement(oBreakOutActionEnabled, oBreakoutActions, aButtons, aContexts, oModel, sSelectedTabKey, oControl);
			}
			oTemplatePrivateModel.setProperty("/generic/listCommons/breakoutActionsEnabled", oBreakOutActionEnabled);
		}

		function fnUpdateBreakoutEnablement(oBreakOutActionEnabled, oBreakoutActions, aButtons, aContexts, oModel, sSelectedTabKey, oControl) {
			var bEnabled;
			for (var sAction in oBreakoutActions) {
				var sActionId = oBreakoutActions[sAction].id;
				if (sSelectedTabKey && !oBreakoutActions[sAction].determining) {
					sActionId = sActionId.concat("-", sSelectedTabKey);
				}
				if (jQuery.inArray(sActionId, aButtons) !== -1) {
					bEnabled = true;
					if (oBreakoutActions[sAction].requiresSelection) {
						if (aContexts.length > 0) { // context selected
							if (oBreakoutActions[sAction].applicablePath !== undefined && oBreakoutActions[sAction].applicablePath !== "") {
								// loop on all selected contexts: at least one must be selected with applicablePath = true
								bEnabled = false;
								for (var iContext = 0; iContext < aContexts.length; iContext++) {
									// check if applicablePath is true
									var sNavigationPath = "";
									var aPaths = oBreakoutActions[sAction].applicablePath.split("/");
									if (aPaths.length > 1) {
										for (var iPathIndex = 0; iPathIndex < aPaths.length - 1; iPathIndex++) {
											sNavigationPath +=  "/" + aPaths[iPathIndex];
										}
									}
									var oObject = oModel.getObject(aContexts[iContext].getPath() + sNavigationPath);
									var sApplicablePath = aPaths[aPaths.length - 1];
									if (oObject[sApplicablePath] === true) {
										bEnabled = true;
										break;
									}
								}
							}
						} else if (isSmartChart(oControl) && oControl.getDrillStackFilters().length > 0) {
							//Selection is made on the chart but drilldown is performed later.
							bEnabled = true;
						} else {
							// requiresSelection is defined, but no row is selected
							bEnabled = false;
						}
					}
					oBreakOutActionEnabled[sActionId] = {
							enabled: bEnabled
					};
				}
			}
		}

		function getBreakoutActionsForTable(oTable) {
			var aButtons = [];
			var aTableToolbarContent = jQuery.grep(oTable.getCustomToolbar().getContent(), function(oControl) {
				return oControl.getMetadata().getName() === "sap.m.Button";
			});
			for (var iTableToolbarContent = 0; iTableToolbarContent < aTableToolbarContent.length; iTableToolbarContent++) {
				var aSplitId = aTableToolbarContent[iTableToolbarContent].getId().split("--");
				aButtons.push(aSplitId[aSplitId.length - 1]);
			}
			return aButtons;
		}

		function getBreakoutActionsForChart(oChart) {
			var aButtons = [];
			var aChartToolbarContent = jQuery.grep(oChart.getToolbar().getContent(), function(oControl) {
				return oControl.getMetadata().getName() === "sap.m.Button";
			});
			for (var iChartToolbarContent = 0; iChartToolbarContent < aChartToolbarContent.length; iChartToolbarContent++) {
				var aSplitId = aChartToolbarContent[iChartToolbarContent].getId().split("--");
				aButtons.push(aSplitId[aSplitId.length - 1]);
			}
			return aButtons;
		}

		function getBreakoutActionsForFooter() {
			var aButtons = [];
			var aFooterToolbarContent = [];
			var oPage = oController.byId("page");
			if (oPage && oPage.getFooter()) {
					aFooterToolbarContent = jQuery.grep(oPage.getFooter().getContent(), function(oControl) {
						return oControl.getMetadata().getName() === "sap.m.Button";
					});
			}
			for (var iFooterToolbarContent = 0; iFooterToolbarContent < aFooterToolbarContent.length; iFooterToolbarContent++) {
					var aSplitId = aFooterToolbarContent[iFooterToolbarContent].getId().split("--");
					aButtons.push(aSplitId[aSplitId.length - 1]);
			}
			return aButtons;
		}


		function fnGetBreakoutActionsFromManifest(oModel) {
			// Loop on manifest for breakout actions
			var oManifest = oController.getOwnerComponent().getAppComponent().getManifestEntry("sap.ui5");
			var oExtensions = oManifest.extends && oManifest.extends.extensions && oManifest.extends.extensions["sap.ui.controllerExtensions"];
			if (oExtensions) {
				var	oTemplateExtensions = (oExtensions[oController.getOwnerComponent().getTemplateName()] || {})["sap.ui.generic.app"] || {};
				var oMetaModel = oModel.getMetaModel();
				var oBreakoutActions = (oTemplateExtensions[oMetaModel.getODataEntitySet(oController.getOwnerComponent().getEntitySet()).name] || {})["Actions"];
				if (!oBreakoutActions) {
					oBreakoutActions = {};
					var oSections = (oTemplateExtensions[oMetaModel.getODataEntitySet(oController.getOwnerComponent().getEntitySet()).name] || {})["Sections"];
					if (oSections) {
						for (var sSection in oSections) {
							oBreakoutActions = jQuery.extend(oBreakoutActions, oSections[sSection]["Actions"]);
						}
					}
				}
				return oBreakoutActions;
			}
		}

		/*
		 * Returns an ancestoral table/chart of the given element or null
		 *
		 * @param {sap.ui.core.Element} oSourceControl The element where to start searching for a ancestoral table/chart
		 * @returns {sap.ui.table.Table|sap.m.Table|sap.ui.comp.smarttable.SmartTable|sap.ui.comp.smartchart.SmartChart} The ancestoral table/chart or null
		 * @public
		 */
		function getOwnerControl(oSourceControl){
			var oCurrentControl = oSourceControl;
			while (oCurrentControl) {
				if (oCurrentControl instanceof ResponsiveTable || isUiTable(oCurrentControl) || isSmartTable(oCurrentControl) || isSmartChart(oCurrentControl)) {
					return oCurrentControl;
				}
				oCurrentControl = oCurrentControl.getParent && oCurrentControl.getParent();
			}
			return null;
		}

		/*
		 * Returns the binding of the given table
		 *
		 * @param {sap.ui.table.Table|sap.m.Table|sap.ui.comp.smarttable.SmartTable} oTable The table which's binding is to returned
		 * @returns {object} The found binding or null
		 * @public
		 */
		function getTableBindingInfo(oTable) {
			if (isSmartTable(oTable)) {
				oTable = oTable.getTable(); // get SmartTable's inner table first
			}

			if (isUiTable(oTable)) {
				return oTable.getBindingInfo("rows");
			} else if (oTable instanceof ResponsiveTable) {
				return oTable.getBindingInfo("items");
			}

			return null;
		}

		/*
		 * Refresh given SmartTable
		 *
		 * This method should be provided by SmartTable itself
		 *
		 * @param {sap.ui.table.Table|sap.m.Table|sap.ui.comp.smarttable.SmartTable} oSmartTable The table to refresh. Intended for SmartTable,
		 * but will also work if inner table is provided
		 */

		function fnRefreshSmartTable(oSmartTable) {
			var oBindingInfo = getTableBindingInfo(oSmartTable);
			if (oBindingInfo && oBindingInfo.binding) {
				oBindingInfo.binding.refresh();
			} else {
				oSmartTable.rebindTable();
			}
		}

		/*
		 * If at least one relevant entity set is etag enabled, refresh based on etags only. Else, whole model content will be deleted.
		 * The required content will automatically loaded again by UI5.
		 *@public
		*/
		function fnRefreshModel(oSmartTable) {
			//ALP have to check their coding themselves
			var oModel = oController.getOwnerComponent().getModel();
			var sPath, oTableBindingInfo;
			if (oController.getMetadata().getName() === 'sap.suite.ui.generic.template.AnalyticalListPage.view.AnalyticalListPage'){
			//	oModel.refresh(null, true);
			} else {
				var bMustRefresh = !oServices.oApplication.checkEtags();
				if (bMustRefresh) {
					oTableBindingInfo = getTableBindingInfo(oSmartTable);
					if (oTableBindingInfo) {
						sPath = oTableBindingInfo.path;
						oModel.invalidate(fnCheckEntry.bind(null, sPath));
						oServices.oApplication.unbindAllComponents();
					}
				}
			}
		}


		/**
		 * the callback function for ODataModel
		 */
		function fnCheckEntry(sPath, sKey, oEntry) {
			var sMatchTableItems = sPath[0] === "/" ? sPath.substr(1) : sPath;
			if (sKey.split("(")[0] === sMatchTableItems) {
				return true;
			} else {
				return false;
			}
		}

		/*
		 * Triggers navigation from a given list item.
		 *
		 * @param {sap.ui.model.context} selected context for navigation
		 * @param {object} oTable The table from which navigation was triggered
		 *        control in the table
		 * @public
		 */
		function fnNavigateFromListItem(oContext, oTable) {
			var sSelectedPath = oContext.getPath();
			var oComponent = oController.getOwnerComponent();

			// binding path of component - either binding path of list (list screen e.g. /SalesOrder) or binding path of details screen (e.g.
			// /SalesOrder(123) )
			var oElementBinding = oComponent.getComponentContainer().getElementBinding();
			var sPath = oElementBinding ? oElementBinding.getPath() : "";

			// check whether it is a navigation property binding or just a collection
			var sNavigationProperty = null;

			if (sSelectedPath.indexOf(sPath) !== 0) {
				// relative binding - table bound to navigation property e.g. Item - get binding of embedded table in details screen
				sNavigationProperty = getTableBindingInfo(oTable).path;
			}

			var bReplace = !oServices.oApplication.isNewHistoryEntryRequired(oContext, sNavigationProperty);
			var iDisplayMode;
			if (oComponentUtils.isDraftEnabled()){
				iDisplayMode = oServices.oDraftController.isActiveEntity(oContext) ? 1 : 6;
			} else {
				iDisplayMode = oComponent.getModel("ui").getProperty("/editable") ? 6 : 1;
			}

			var iViewLevel = oComponentUtils.getViewLevel();
			if (iViewLevel === 0) {
				var sForwardNavigationProperty = oServices.oApplication.getForwardNavigationProperty(iViewLevel);
			}

			// check if forwardNavigationProperty is set and navigate to the corrosponding page
			if (sForwardNavigationProperty) {
				var oContextCreationBindingPromise = new Promise(function(fnResolve){
					oContext.getModel().createBindingContext(sForwardNavigationProperty, oContext, null, function(oNavigationContext) {
						if (oNavigationContext) {
							oServices.oNavigationController.navigateToContext(oNavigationContext, sNavigationProperty, bReplace, iDisplayMode);
							fnResolve();
						} else {
							oComponentUtils.navigateToDataLoadedFailedPage();
							fnResolve();
						}
					});
				});
				var oBusyHelper = oServices.oApplication.getBusyHelper();
				oBusyHelper.setBusy(oContextCreationBindingPromise);
			} else {
				 oServices.oNavigationController.navigateToContext(oContext, sNavigationProperty, bReplace, iDisplayMode);
			}
		}

		/*
		 * Triggers navigation to the specified context.
		 *
		 * @param {sap.ui.model.Context} context for navigation
		 * @param {object} [oNavigationData] object containing navigation data
		 */
		function fnNavigateToContext(vContext, oNavigationData) {
			// Normal navigation (via a context)
			if (vContext instanceof Context){
				oServices.oNavigationController.navigateToContext(vContext, oNavigationData && oNavigationData.navigationProperty, oNavigationData && oNavigationData.replaceInHistory);
				return;
			}
			// Navigation via a virtual navigation property
			var sRouteName = oNavigationData && oNavigationData.routeName;
			if (sRouteName){
				oComponentUtils.navigateRoute(sRouteName, vContext, null, oNavigationData && oNavigationData.replaceInHistory);
				return;
			}
			jQuery.sap.log.warning("navigateToContext called without context or route");
		}

		// Fix for BCP 1770053414 where error message is displayed instead of error code
		function fnHandleError(oError) {
			if (oError instanceof NavError) {
				if (oError.getErrorCode() === "NavigationHandler.isIntentSupported.notSupported") {
					MessageBox.show(getText("ST_NAV_ERROR_NOT_AUTHORIZED_DESC"), {
						title: getText("ST_GENERIC_ERROR_TITLE")
					});
			} else {
					MessageBox.show(oError.getErrorCode(), {
						title: getText("ST_GENERIC_ERROR_TITLE")
					});
				}
			}
		}

		function fnNavigateExternal(oOutbound, oState) {
			fnProcessDataLossConfirmationIfNonDraft(function() {
				oNavigationHandler = getNavigationHandler();
				var oObjectInfo = {
						semanticObject: oOutbound.semanticObject,
						action: oOutbound.action
				};
				var oSelectionVariant = oNavigationHandler.mixAttributesAndSelectionVariant(oOutbound.parameters);
				oController.adaptNavigationParameterExtension(oSelectionVariant, oObjectInfo);
				oNavigationHandler.navigate(oOutbound.semanticObject, oOutbound.action, oSelectionVariant.toJSONString(),
						null, fnHandleError);
				//null object has to be passed to the NavigationHandler as an
				//indicator that the state should not be overwritten
			}, jQuery.noop, oState, "LeavePage");
		}

		function fnGetNavigationKeyProperties(sTargetEntitySet) {
			var i, ilength, aPageKeys = [], oKeyInfo, oEntityType, sEntityType;
			var oComponent = oController.getOwnerComponent();
			var oMetaModel = oComponent.getModel().getMetaModel();
			if (!sTargetEntitySet) {
				return {};
			}
			var oPages = oComponent.getAppComponent().getConfig().pages[0];
			if (!oPages) {
				return {};
			}
			var fnPrepareKeyInfo = function(oPage) {
				sEntityType = oMetaModel.getODataEntitySet(oPage.entitySet).entityType; //oPages.pages[i].entitySet).entityType;
				oEntityType = oMetaModel.getODataEntityType(sEntityType);
				oKeyInfo = {};
				oKeyInfo = {
					entitySet: oPage.entitySet,// sEntitySet, //oPages.pages[i].entitySet,
					aKeys: oMetaModel.getODataEntityType(sEntityType).key.propertyRef,
					navigationProperty: oPage.navigationProperty
				};
				for (var j = 0, jlength = oKeyInfo.aKeys.length; j < jlength; j++) {
					var k = 0, klength = oEntityType.property.length;
					for (k; k < klength; k++) {
						if (oKeyInfo.aKeys[j].name === oEntityType.property[k].name) {
							oKeyInfo.aKeys[j].type = oEntityType.property[k].type;
							break;
						}
					}
				}
			};
			var fnGetPathKeys = function(sTargetEntitySet, oPages) {
				if (!oPages.pages) {
					return aPageKeys;
				}
				for (i = 0, ilength = oPages.pages.length; i < ilength; i++) {
					if (!oPages.pages[i]) {
						break;
					}
					if (sTargetEntitySet === oPages.pages[i].entitySet) {
						fnPrepareKeyInfo(oPages.pages[i]);
						aPageKeys.splice(0, 0, oKeyInfo);
						break;
					}
					aPageKeys = fnGetPathKeys(sTargetEntitySet, oPages.pages[i]);
					if (aPageKeys.length > 0) {
						fnPrepareKeyInfo(oPages.pages[i]);
						aPageKeys.splice(0, 0, oKeyInfo);
					}
				}
				return aPageKeys;
			};
			return fnGetPathKeys(sTargetEntitySet, oPages);
		}

		function fnMergeNavigationKeyPropertiesWithValues(aKeys, Response) {
			var sKeySeparator, sRoute, i, ilength;
			for (i = 0, ilength = aKeys.length; i < ilength; i++) {
				if (aKeys[i].navigationProperty) {
					sRoute += "/" + aKeys[i].navigationProperty;
				} else {
					sRoute = "/" + aKeys[i].entitySet;
				}
				for (var j = 0, jlength = aKeys[i].aKeys.length; j < jlength; j++) {
					if (j === 0) {
						sRoute += "(";
						sKeySeparator = "";
					} else {
						sKeySeparator = ",";
					}

					switch (aKeys[i].aKeys[j].type) {
						case "Edm.Guid":
							if (Response.DraftAdministrativeData && Response.DraftAdministrativeData.DraftIsCreatedByMe) {
								sRoute += sKeySeparator + aKeys[i].aKeys[j].name + "=" + "guid'" + Response.DraftAdministrativeData[aKeys[i].aKeys[j].name] + "'";
							} else {
								sRoute += sKeySeparator + aKeys[i].aKeys[j].name + "=" + "guid'" + Response[aKeys[i].aKeys[j].name] + "'";
							}
							break;
						case "Edm.Boolean":
							if (Response.DraftAdministrativeData && Response.DraftAdministrativeData.DraftIsCreatedByMe) {
								sRoute += sKeySeparator + aKeys[i].aKeys[j].name + "=" + false;
							} else {
								sRoute += sKeySeparator + aKeys[i].aKeys[j].name + "=" + Response[aKeys[i].aKeys[j].name];
							}
							break;
						default:
							if (typeof Response[aKeys[i].aKeys[j].name] === "string") {
								sRoute += sKeySeparator + aKeys[i].aKeys[j].name + "=" + "'" + Response[aKeys[i].aKeys[j].name] + "'";
							} else {
								sRoute += sKeySeparator + aKeys[i].aKeys[j].name + "=" + Response[aKeys[i].aKeys[j].name];
							}
							break;
						}
						if (j === (jlength - 1)) {
							sRoute += ")";
						}
					}
				}
			return sRoute;
		}

		function fnSemanticObjectLinkNavigation(oEventParameters, sSelectionVariant, oController) {
			var oSelectionVariant, sSelectionVariantPrepared, sParameter, sSemanticObject, aSelVariantPropertyNames, aSelOptionPropertyNames, aParameterNames;
			var oObjectInfo = {
				semanticObject : "",
				action : ""
			};
			oNavigationHandler = getNavigationHandler();
			for (sSemanticObject in oEventParameters.semanticAttributesOfSemanticObjects) {
				oSelectionVariant = oNavigationHandler.mixAttributesAndSelectionVariant({}, sSelectionVariant);
				//collect the parameters without values!
				for (sParameter in oEventParameters.semanticAttributesOfSemanticObjects[sSemanticObject]) {
					if (!oSelectionVariant.getSelectOption(sParameter)) {
						oSelectionVariant.addParameter(sParameter, "");
					}
				}
				aSelVariantPropertyNames = oSelectionVariant.getPropertyNames();
				oObjectInfo.semanticObject = sSemanticObject;
				oController.adaptNavigationParameterExtension(oSelectionVariant, oObjectInfo);
				aSelOptionPropertyNames = oSelectionVariant.getSelectOptionsPropertyNames();
				aParameterNames = oSelectionVariant.getParameterNames();
				for (var i = 0, length = aSelVariantPropertyNames.length; i < length; i++) {
					if (aSelOptionPropertyNames.indexOf(aSelVariantPropertyNames[i]) < 0 && aParameterNames.indexOf(aSelVariantPropertyNames[i]) < 0) {
					//remove the not selected parameters and selectOptions
						delete oEventParameters.semanticAttributesOfSemanticObjects[sSemanticObject][aSelVariantPropertyNames[i]];
						oSelectionVariant.removeSelectOption(aSelVariantPropertyNames[i]);
					}
				}
				if (sSemanticObject === oEventParameters.semanticObject){
					var oSemObjEmpty = oEventParameters.semanticAttributesOfSemanticObjects[""];
					for (var j = 0, length = aParameterNames.length; j < length; j++ ) {
						if (aParameterNames[j] in oSemObjEmpty) {
							oSelectionVariant.removeParameter(aParameterNames[j]);
						} else {
							oSelectionVariant.removeParameter(aParameterNames[j]);
							oSelectionVariant.addParameter(aParameterNames[j], oEventParameters.semanticAttributesOfSemanticObjects[oEventParameters.semanticObject][aParameterNames[j]]);
						}
					}
					oSelectionVariant = oNavigationHandler.mixAttributesAndSelectionVariant(oEventParameters.semanticAttributesOfSemanticObjects[sSemanticObject], sSelectionVariant);
					sSelectionVariantPrepared = oSelectionVariant.toJSONString();
				}
			}
			delete oEventParameters.semanticAttributes;
			oNavigationHandler.processBeforeSmartLinkPopoverOpens(oEventParameters, sSelectionVariantPrepared);
		}

		function formatDraftLockText(IsActiveEntity, HasDraftEntity, LockedBy) {
			if (!IsActiveEntity) {
				// current assumption: is my Draft as I don't see other's draft -> TODO: to be checked
				return getText("DRAFT_OBJECT");
			} else if (HasDraftEntity) {
				return getText(LockedBy ? "LOCKED_OBJECT" : "UNSAVED_CHANGES");
			} else {
				return ""; // not visible
			}
		}

		function getDraftPopover() {
			var oDraftPopover = getDialogFragment("sap.suite.ui.generic.template.fragments.DraftAdminDataPopover", {
				formatText: function() {
					var aArgs = Array.prototype.slice.call(arguments, 1);
					var sKey = arguments[0];
					if (!sKey) {
						return "";
					}
					if (aArgs.length > 0 && (aArgs[0] === null || aArgs[0] === undefined || aArgs[0] === "")) {
						if (aArgs.length > 3 && (aArgs[3] === null || aArgs[3] === undefined || aArgs[3] === "")) {
							return (aArgs.length > 2 && (aArgs[1] === null || aArgs[1] === undefined || aArgs[1] === ""))
									? ""
									: aArgs[2];
						} else {
							return getText(sKey, aArgs[3]);
						}
					} else {
						return getText(sKey, aArgs[0]);
					}
				},
				closeDraftAdminPopover: function() {
					oDraftPopover.close();
				},
				formatDraftLockText: formatDraftLockText
			}, "admin");
			return oDraftPopover;
		}

		function fnProcessDataLossConfirmationIfNonDraftImpl(fnProcessFunction, fnCancelFunction, oState, sMode, bNoBusyCheck, oEvent) {
			var oBusyHelper = oServices.oApplication.getBusyHelper();
			if (!bNoBusyCheck && oBusyHelper.isBusy()) {
				return; // do not navigate away from a page that is currently busy
			}
			// DataLost Popup only for Non-Draft
			if ( !oComponentUtils.isDraftEnabled() ) {
				//Test all registered UnsavedDataCheckFunctions
				var bHasExternalChanges = false;
				if (oState && oState.aUnsavedDataCheckFunctions){
					bHasExternalChanges = oState.aUnsavedDataCheckFunctions.some(function(fnUnsavedCheck) {
						return fnUnsavedCheck();
					});
				}
				var oView = oController.getView();
				var oModel = oView.getModel();
				if ( bHasExternalChanges || oModel.hasPendingChanges() ) {
					var oExecutionPromise;
					fnDataLossConfirmation(function() {
						oView.setBindingContext(null);
						oModel.resetChanges();
						oView.setBindingContext();
						//Notification for reuse components and extensions
						oComponentUtils.fire(oController, "AfterCancel", {});
						oExecutionPromise = fnProcessFunction();
					},	function(){
						oExecutionPromise = fnCancelFunction();
					}, sMode, oEvent);
					return oExecutionPromise;
				}
			}
			return fnProcessFunction();
		}

		function fnProcessDataLossTechnicalErrorConfirmation(fnProcessFunction, fnCancelFunction, oState, sMode) {
			//Test all registered UnsavedDataCheckFunctions
			var bHasExternalChanges = false;
			if (oState && oState.aUnsavedDataCheckFunctions){
				bHasExternalChanges = oState.aUnsavedDataCheckFunctions.some(function(fnUnsavedCheck) {
					return fnUnsavedCheck();
				});
			}
			if ( bHasExternalChanges || oController.getView().getModel().hasPendingChanges() ) {
				var oExecutionPromise;
				fnDataLossTechnicalErrorConfirmation(
						function() {
							oController.getView().getModel().resetChanges();
							//Notification for reuse components and extensions
							oComponentUtils.fire(oController, "AfterCancel", {});
							oExecutionPromise = fnProcessFunction();
						},
						function(){
							oExecutionPromise = fnCancelFunction();
						},
						sMode );
				return oExecutionPromise;
			}
			return fnProcessFunction();
		}

		function fnProcessDataLossConfirmationIfNonDraft(fnProcessFunction, fnCancelFunction, oState, sMode, bNoBusyCheck, oEvent){
			if (bNoBusyCheck){
				return fnProcessDataLossConfirmationIfNonDraftImpl(fnProcessFunction, fnCancelFunction, oState, sMode, true, oEvent);
			}
			oServices.oApplication.performAfterSideEffectExecution(fnProcessDataLossConfirmationIfNonDraftImpl.bind(null, fnProcessFunction, fnCancelFunction, oState, sMode, false, oEvent));
		}

		var fnOnDataLossConfirmed; // the current handler for data loss confirmation
		/*
		Shows DataLoss popup or Discard popover in NonDraft Applications
		onBack, a dataloss popup is shown and in case on onCancel discardPopover is shown. oEvent is passed to attach popover on Cancel button
		*/
		function fnDataLossConfirmation(onDataLossConfirmed, onDataLossCancel, sMode, oEvent) {
			// note that we must pass the event handler to a global variable, since always the version of onDataLossOK will be
			// executed which was created, when fnDataLossConfirmation was called for the first time
			// (see documentation of getDialogFragment).
			var oDataLossModel;
			fnOnDataLossConfirmed = onDataLossConfirmed;
			// if sMode or oEvent is undefined then show DataLoss Popup
			if (!sMode || !oEvent) {
				var oDataLossPopup = getDialogFragment("sap.suite.ui.generic.template.fragments.DataLoss", {
				onDataLossOK: function() {
					oDataLossPopup.close();
					fnOnDataLossConfirmed(); // call the version of onDataLossConfirmed which is currently valid
				},
				onDataLossCancel: function() {
					oDataLossPopup.close();
					onDataLossCancel();
				}
			}, "dataLoss");
			if (!sMode) {
				sMode = "LeavePage";
			}
			oDataLossModel = oDataLossPopup.getModel("dataLoss");
			oDataLossModel.setProperty("/mode", sMode);
			oDataLossPopup.open();
			} else { // if sMode is Proceed or LeavePage then show Popover
			var oDataLossPopover = getDialogFragment("sap.suite.ui.generic.template.fragments.DiscardDraftPopover", {
				onDiscardConfirm: function() {
					fnOnDataLossConfirmed();
				}
			}, "discard");
			oDataLossModel = oDataLossPopover.getModel("discard");
			oDataLossModel.setProperty("/placement", sap.m.PlacementType.Top);
			if (sMode !== "Proceed") {
				oDataLossModel.setProperty("/isCreateDraft", true);
			} else {
				oDataLossModel.setProperty("/isCreateDraft", false);
			}
			oDataLossModel.setProperty("/mode", sMode);
			oDataLossPopover.openBy(oEvent.getSource());
			}
		}

		var fnOnDataTechnicalErrorLossConfirmed; // the current handler for data loss confirmation
		function fnDataLossTechnicalErrorConfirmation(onDataTechnicalErrorLossConfirmed, onDataLossCancel, sMode) {

			fnOnDataTechnicalErrorLossConfirmed = onDataTechnicalErrorLossConfirmed;
			if (!sMode){
				sMode = "LeavePage";
			}
			var oDataLossPopup = getDialogFragment("sap.suite.ui.generic.template.fragments.DataLossTechnicalError", {
				onDataLossOK: function() {
					oDataLossPopup.close();
					fnOnDataTechnicalErrorLossConfirmed(); // call the version of onDataLossConfirmed which is currently valid
				},
				onDataLossCancel: function() {
					oDataLossPopup.close();
					onDataLossCancel();
				}
			}, "dataLoss");

			var oDataLossModel = oDataLossPopup.getModel("dataLoss");
			oDataLossModel.setProperty("/mode", sMode);
			oDataLossPopup.open();
		}

		function fnSecuredExecutionImpl(fnFunction, mParameters, oState, oBusyHelper, resolve, reject) {
			if (mParameters.busy.check && oBusyHelper.isBusy()) {
				reject();
				return;
			}

			// In case the app should be set busy we make sure that the corresponding busy session contains the call of fnFunction.
			// This way all transient messages which are added by fnFunction synchronously will be shown at the end of this busy session.
			var fnExecute1 = mParameters.busy.set ? function(){
				oBusyHelper.setBusy(Promise.resolve());
				return fnFunction();
			} : fnFunction;

			var fnExecute2 = mParameters.mConsiderObjectsAsDeleted ? function(oParameter){
				oServices.oApplication.prepareDeletion(mParameters.mConsiderObjectsAsDeleted);
				return fnExecute1();
			} : fnExecute1;

			var oPromise = (mParameters.dataloss.popup ? fnProcessDataLossConfirmationIfNonDraft(fnExecute2, reject,
				oState, (mParameters.dataloss.navigation ? "LeavePage" : "Proceed"), true) : fnExecute2());

			if (oPromise instanceof Promise) {
				oPromise.then(resolve, reject);
			} else {
				resolve();
			}
		}

		function fnSecuredExecution(fnFunction, mParameters, oState) {
			mParameters = jQuery.extend(true, {
				busy: {set: true, check: true},
				dataloss: {popup: true, navigation: false}
			}, mParameters);
			var oBusyHelper = oServices.oApplication.getBusyHelper();
			var oResultPromise = new Promise(function(resolve, reject) {
				oServices.oApplication.performAfterSideEffectExecution(fnSecuredExecutionImpl.bind(null, fnFunction, mParameters, oState, oBusyHelper, resolve, reject));
			});
			if (mParameters.busy.set) {
				oBusyHelper.setBusy(oResultPromise);
			}
			return oResultPromise;
		}

		function getNavigationHandler() {
			oNavigationHandler = oNavigationHandler || new NavigationHandler(oController);
			return oNavigationHandler;
		}

		/*
		 * Visible property of toolbar buttons annotated with DataFieldForIntentBasedNavigation can be bound to certain paths in "_templPriv" Model during templating (see method buildVisibilityExprOfDataFieldForIntentBasedNaviButton in AnnotationHelper.js)
		 * The function checks if the navigation targets ( semanticObject+ action) are supported in the system and updates the corresponding paths of the model. Thus the visibility of buttons is updated.
		 */
		function fnCheckToolbarIntentsSupported(oSmartControl) {
			var oToolbar;
			var oTemplatePrivateModel = oComponentUtils.getTemplatePrivateModel();
			var oAppComponent, oXApplNavigation, oSupportedIntents, aToolbarContent, iButtonsNumber, aLinksToCheck = [], aInternalLinks = [], i, oCustomData, sSemObj, sAction, oLink, oInternalLink, oDeferredLinks;
			var iLinksNumber, oSemObjProp;
			oAppComponent = oController.getOwnerComponent().getAppComponent();
			oXApplNavigation = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService && sap.ushell.Container.getService("CrossApplicationNavigation");
			oSupportedIntents = oTemplatePrivateModel.getProperty("/generic/supportedIntents/");
			//handle toolbar buttons
			if (isSmartChart(oSmartControl)) {
				oToolbar = oSmartControl.getToolbar();
			} else if (isSmartTable(oSmartControl)) {
				oToolbar = oSmartControl.getCustomToolbar();
			}
			aToolbarContent = oToolbar.getContent();
			iButtonsNumber = aToolbarContent.length;
			for (i = 0; i < iButtonsNumber; i++) {
				oCustomData = getElementCustomData(aToolbarContent[i]);
				if (oCustomData.hasOwnProperty("SemanticObject") && oCustomData.hasOwnProperty("Action")) {
					sSemObj = oCustomData.SemanticObject;
					sAction = oCustomData.Action;
					oLink = {
						semanticObject: sSemObj,
						action: sAction,
						ui5Component: oAppComponent
					};
					aLinksToCheck.push([oLink]);
					oInternalLink = jQuery.extend({}, oLink);
					oInternalLink.bLinkIsSupported = false;
					aInternalLinks.push(oInternalLink);
				}
			}

			if (aLinksToCheck.length > 0 && oXApplNavigation) {
				oDeferredLinks = oXApplNavigation.getLinks(aLinksToCheck);
				oDeferredLinks.done(function(aLinks) {
					oSupportedIntents = oTemplatePrivateModel.getProperty("/generic/supportedIntents/");
					iLinksNumber = aLinks.length;
					//entries in aLinks should correspond to aInternalLinks: if a link is not supported an empty object is returned by the method getLinks
					for (i = 0; i < iLinksNumber; i++) {
						if (aLinks[i][0].length > 0) {
							aInternalLinks[i].bLinkIsSupported = true;
						}
						// add the value to the model
						sSemObj = aInternalLinks[i].semanticObject;
						sAction = aInternalLinks[i].action;

						oSemObjProp = oTemplatePrivateModel.getProperty("/generic/supportedIntents/" + sSemObj);
						if (!oSemObjProp) {  // no semantic object in the model yet
							oSupportedIntents[sSemObj] = {};
							oSupportedIntents[sSemObj][sAction] =
							{
								"visible" :aInternalLinks[i].bLinkIsSupported
							};
						} else if (!oSemObjProp[sAction]) {  // no action in the model yet
							oSemObjProp[sAction] =
							{
								"visible" :aInternalLinks[i].bLinkIsSupported
							};
						} else {
							oSemObjProp[sAction]["visible"] = aInternalLinks[i].bLinkIsSupported;
						}
					}
					oTemplatePrivateModel.updateBindings();
				});
			}
		}

		function fnGetSelectionVariantFilters(oSmartTable, oSegButtonOrVariantSelectItem) {
			var aSelectionVariantFilters = [], oSelectionVariantPath;
			var sSelectionVariantPath = getElementCustomData(oSmartTable).variantAnnotationPath;
			if (!sSelectionVariantPath && oSegButtonOrVariantSelectItem) {
				sSelectionVariantPath = getElementCustomData(oSegButtonOrVariantSelectItem).variantAnnotationPath;
			}
			if (sSelectionVariantPath) {
				var oModel = oSmartTable.getModel();
				var oMetaModel = oModel.getMetaModel();
				var sEntitySet = oSmartTable.getEntitySet();
				var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
				var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
				var oVariant = oEntityType[sSelectionVariantPath];
				if (!oVariant.SelectOptions && oVariant.SelectionVariant) {
					// for SelectionPresentationVariants, make sure to refer to SelectionVariant
					oVariant = oVariant.SelectionVariant;
				}
				if (oVariant.AnnotationPath) {
					oSelectionVariantPath = oVariant.AnnotationPath.split("@")[1];
					oVariant = oEntityType[oSelectionVariantPath];
				}
				for (var i in oVariant.SelectOptions) {
					if (oVariant.SelectOptions[i].PropertyName) {
						var sPath = oVariant.SelectOptions[i].PropertyName.PropertyPath;
						for (var j in oVariant.SelectOptions[i].Ranges) {
							var oOperator = oVariant.SelectOptions[i].Ranges[j].Option;
							oOperator.EnumMember = oOperator.EnumMember.replace("com.sap.vocabularies.UI.v1.SelectionRangeOptionType/", "");
							var oValueLow = oVariant.SelectOptions[i].Ranges[j].Low;
							var oValueHigh = oVariant.SelectOptions[i].Ranges[j].High;
							var sKeyLow = Object.keys(oValueLow)[0];
							if (oValueHigh) {
								var sKeyHigh = Object.keys(oValueHigh)[0];
								aSelectionVariantFilters.push(new sap.ui.model.Filter(sPath, oOperator.EnumMember, oValueLow[sKeyLow], oValueHigh[sKeyHigh]));
							} else {
								aSelectionVariantFilters.push(new sap.ui.model.Filter(sPath, oOperator.EnumMember, oValueLow[sKeyLow]));
							}
						}
					}
				}
			}
			return aSelectionVariantFilters;
		}

		// Expose selected private functions to unit tests
		// etBreakoutActionsForTable
		/* eslint-disable */
		var getNavigationHandler = testableHelper.testable(getNavigationHandler, "getNavigationHandler");
		var fnFillEnabledMapForBreakoutActions = testableHelper.testable(fnFillEnabledMapForBreakoutActions, "fillEnabledMapForBreakoutActions");
		var getBreakoutActionsForTable = testableHelper.testable(getBreakoutActionsForTable, "getBreakoutActionsForTable");
		var getOwnerControl = testableHelper.testable(getOwnerControl, "getOwnerControl");
		var getSelectedContexts = testableHelper.testable(getSelectedContexts, "getSelectedContexts");
		/* eslint-enable */

		return {
			isSmartTable: isSmartTable,
			isSmartChart: isSmartChart,
			isUiTable: isUiTable,
			isAnalyticalTable: isAnalyticalTable,
			getNavigationProperty: getNavigationProperty,
			getText: getText,
			getNavigationHandler: getNavigationHandler,
			getNavigationKeyProperties: fnGetNavigationKeyProperties,
			mergeNavigationKeyPropertiesWithValues: fnMergeNavigationKeyPropertiesWithValues,

			executeGlobalSideEffect: function() {
				if (oComponentUtils.isDraftEnabled()) {
					var oView = oController.getView();
					oView.attachBrowserEvent(
							"keyup",
							function(oBrowserEvent) {
								var isSearchField = (oBrowserEvent.target.type === "search") ? true : false;
								var isTextArea = (oBrowserEvent.target.type === "textarea") ? true : false;
								// CTRL key is checked with the ENTER key as CTRL + ENTER is used as a shortcut for adding entries to a table
								if (oBrowserEvent.keyCode === 13 && oBrowserEvent.ctrlKey !== true && oView.getModel("ui").getProperty("/editable") && !isSearchField && !isTextArea) {
									//Getting the value of bForceGlobalRefresh from Manifest
									var oConfig = oController.getOwnerComponent().getAppComponent().getConfig();
									var bForceGlobalRefresh = oConfig.settings && oConfig.settings.forceGlobalRefresh;
									var sideEffectPromise = oServices.oApplicationController.executeSideEffects(oView.getBindingContext(),null,null,bForceGlobalRefresh);
									sideEffectPromise.then(
										setTimeout(function() {
											document.getElementById(oBrowserEvent.target.id).focus(); //set focus back to the selected field
										}, 0));
								}
							});
				}
			},
			setEnabledToolbarButtons: fnSetEnabledToolbarButtons,
			setEnabledFooterButtons: fnSetEnabledFooterButtons,
			fillEnabledMapForBreakoutActions: fnFillEnabledMapForBreakoutActions,
			getBreakoutActionsForTable: getBreakoutActionsForTable,
			getBreakoutActionsFromManifest: fnGetBreakoutActionsFromManifest,
			getSelectedContexts: getSelectedContexts,
			getSelectionPoints: getSelectionPoints,
			getDeleteRestrictions: fnGetDeleteRestrictions,

			setPrivateModelControlProperty: fnSetPrivateModelControlProperty,

			navigateFromListItem: fnNavigateFromListItem,
			navigateToContext: fnNavigateToContext,
			navigateExternal: fnNavigateExternal,
			semanticObjectLinkNavigation: fnSemanticObjectLinkNavigation,

			getSelectionVariantFilters: fnGetSelectionVariantFilters,

			getCustomData: function(oEvent) {
				var aCustomData = oEvent.getSource().getCustomData();
				var oCustomData = {};
				for (var i = 0; i < aCustomData.length; i++) {
					oCustomData[aCustomData[i].getKey()] = aCustomData[i].getValue();
				}
				return oCustomData;
			},

			formatDraftLockText: formatDraftLockText,

			showDraftPopover: function(oBindingContext, oTarget) {
				var oPopover = getDraftPopover();
				var oAdminModel = oPopover.getModel("admin");
				oAdminModel.setProperty("/IsActiveEntity", oBindingContext.getProperty("IsActiveEntity"));
				oAdminModel.setProperty("/HasDraftEntity", oBindingContext.getProperty("HasDraftEntity"));
				oPopover.bindElement({
					path: oBindingContext.getPath() + "/DraftAdministrativeData"
				});
				if (oPopover.getBindingContext()) {
					oPopover.openBy(oTarget);
				} else {
					oPopover.getObjectBinding().attachDataReceived(function() {
						oPopover.openBy(oTarget);
					});
					// Todo: Error handling
				}
			},

			// provide the density class that should be used according to the environment (may be "")
			getContentDensityClass: function() {
				return oServices.oApplication.getContentDensityClass();
			},

			// defines a dependency from oControl to the view
			attachControlToView: fnAttachControlToView,

			/**
			 *
			 * @function
			 * @name sap.suite.ui.generic.template.lib.CommonUtils.prototype.getSelectedContexts.getDialogFragment(sName,
			 *       oFragmentController, sModel)
			 * @param sName name of a fragment defining a dialog for the current view
			 * @param oFragmentController controller for the fragment containing event handlers and formatters used by the
			 *          fragment
			 * @param sModel optional, name of a model. If this parameter is truthy a JSON model with the given name will be
			 *          attached to the dialog
			 * @return an instance of the specififed fragment which is already attached to the current view. Note that each
			 *         fragment will only be instantiated once. Hence, when the method is called several times for the same
			 *         name the same fragment will be returned in each case. <b>Attention:</b> The parameters
			 *         <code>oFragmentController</code> and <code>sModel</code> are only evaluated when the method is
			 *         called for the first time for the specified fragment. Therefore, it is essential that the functions in
			 *         <code>oFragmentController</code> do not contain 'local state'.
			 */
			getDialogFragment: getDialogFragment,
			processDataLossConfirmationIfNonDraft: fnProcessDataLossConfirmationIfNonDraft,
			processDataLossTechnicalErrorConfirmation: fnProcessDataLossTechnicalErrorConfirmation,
			securedExecution: fnSecuredExecution,
			getOwnerControl: getOwnerControl,
			getTableBindingInfo: getTableBindingInfo,
			refreshSmartTable: fnRefreshSmartTable,
			refreshModel: fnRefreshModel,
			getElementCustomData: getElementCustomData,
			triggerAction: function(aContexts, sBindingPath, oCustomData, oControl, oState) {
				// Assuming that this action is triggered from an action inside a table row.
				// Also this action is intended for triggering an OData operation.
				// i.e: Action, ActionImport, Function, FunctionImport
				// We require some properties to be defined in the Button's customData:
				//   Action: Fully qualified name of an Action, ActionImport, Function or FunctionImport to be called
				//   Label: Used to display in error messages
				// Once the CRUDManager callAction promise is resolved, if we received a context back from the OData call
				// we check to see if the context that was sent (actionContext) and the context that is returned (oResponse.reponse.context).
				// If they are the same we do nothing. If they are different we trigger any required navigations and set the newly navigated
				// page to dirty using the setMeToDirty function of the NavigationController so as to enter into edit mode and set the page
				// to edit mode.
				fnProcessDataLossConfirmationIfNonDraft(function() {
					oServices.oCRUDManager.callAction({
						functionImportPath: oCustomData.Action,
						contexts: aContexts,
						sourceControl: oControl,
						label: oCustomData.Label,
						operationGrouping: "",
						navigationProperty: ""
					}).then(function(aResponses) {
						if (aResponses && aResponses.length > 0) {
							var oResponse = aResponses[0];

							if (oResponse.response && oResponse.response.context && (!oResponse.actionContext || oResponse.actionContext && oResponse.response.context.getPath() !== oResponse.actionContext.getPath())) {
								oServices.oViewDependencyHelper.setMeToDirty(oController.getOwnerComponent(), sBindingPath);
							}
						}
					});
				}, jQuery.noop, oState, "Proceed");
			},
			checkToolbarIntentsSupported: fnCheckToolbarIntentsSupported
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.lib.CommonUtils", {
		constructor: function(oController, oServices, oComponentUtils) {

			jQuery.extend(this, getMethods(oController, oServices, oComponentUtils));
		}
	});
});