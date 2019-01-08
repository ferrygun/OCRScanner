/* global hasher */
sap.ui.define(["jquery.sap.global", "sap/ui/model/json/JSONModel", "sap/m/ObjectIdentifier", "sap/m/Table",
		"sap/m/Text", "sap/ui/comp/smartfield/SmartField", "sap/ui/generic/app/navigation/service/SelectionVariant",
		"sap/suite/ui/generic/template/ListReport/extensionAPI/ExtensionAPI", "sap/m/MessageBox", "sap/suite/ui/generic/template/js/AnnotationHelper",
		"sap/suite/ui/generic/template/lib/MessageUtils", 
		"sap/suite/ui/generic/template/ListReport/controller/IappStateHandler", "sap/suite/ui/generic/template/ListReport/controller/MultipleViewsHandler",
		"sap/ui/model/Filter", "sap/ui/comp/navpopover/LinkData"],
	function(jQuery, JSONModel, ObjectIdentifier, Table, Text, SmartField, SelectionVariant, ExtensionAPI, MessageBox, AnnotationHelper, MessageUtils, IappStateHandler, MultipleViewsHandler, Filter, LinkData) {
		"use strict";

		return {
			getMethods: function(oViewProxy, oTemplateUtils, oController) {
				var oState = {}; // contains instance attributes that are shared with helper classes:
				                 // oSmartFilterbar, oSmartTable, oIappStateHandler, oMultipleViewsHandler, bLoadListAndFirstEntryOnStartup, bWorkListEnabled
				                 // and functions updateControlOnSelectionChange and (from oIappStateHandler) getCurrentAppState. 
				                 // Initialized in onInit.

				var bIsStartingUp = true;
				var oFclProxy;
				
				var aWaitingForDisplayNextObjectInfo = null;

				// -- Begin of methods that are used in onInit only
				function fnSetIsLeaf() {
					var oComponent = oController.getOwnerComponent();
					var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
					oTemplatePrivateModel.setProperty("/listReport/isLeaf", oComponent.getIsLeaf());
				}

				function fnSetShareModel() {
					var fnGetUser = jQuery.sap.getObject("sap.ushell.Container.getUser");
					var oManifest = oController.getOwnerComponent().getAppComponent().getMetadata().getManifestEntry("sap.ui");
					var sBookmarkIcon = (oManifest && oManifest.icons && oManifest.icons.icon) || "";
					// share Model: holds all the sharing relevant texts and info used in the XML view
					var oShareInfo = {
						// BOOKMARK
						bookmarkIcon: sBookmarkIcon,
						bookmarkCustomUrl: function() {
							var sHash = hasher.getHash();
							return sHash ? ("#" + sHash) : window.location.href;
						},
						bookmarkServiceUrl: function() {
							var oTable = oState.oSmartTable.getTable();
							var oBinding = oTable.getBinding("rows") || oTable.getBinding("items");
							return oBinding ? oBinding.getDownloadUrl() + "&$top=0&$inlinecount=allpages" : "";
						},
						// JAM
						isShareInJamActive: !!fnGetUser && fnGetUser().isJamActive()
					};
					var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
					oTemplatePrivateModel.setProperty("/listReport/share", oShareInfo);
				}

				function onSmartFilterBarInitialise(oEvent){
					oController.onInitSmartFilterBarExtension(oEvent);
					oState.oIappStateHandler.onSmartFilterBarInitialise();
				}

				function onSmartFilterBarInitialized(){
					var oAppStatePromise = oState.oIappStateHandler.parseUrlAndApplyAppState();
					oAppStatePromise.then(function(){
						bIsStartingUp = false;
					}, function(oError){ // improve?
						if (oError instanceof Error) {
							oError.showMessageBox(); // improve?
							bIsStartingUp = false;
						}
					});
				}

				function onFilterChange(){
					if (!bIsStartingUp){
						oState.oIappStateHandler.changeIappState(true, false);
					}
				}

				// oControl is either a SmartTable or a SmartChart
				function fnUpdateControlOnSelectionChange(oControl) {
					var oModel =  oController.getOwnerComponent().getModel(),
						oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
					var oMetaModel = oModel.getMetaModel(),
						oEntitySet = oMetaModel.getODataEntitySet(oController.getOwnerComponent().getEntitySet()),
						oDeleteRestrictions = oEntitySet["Org.OData.Capabilities.V1.DeleteRestrictions"];
					var bDeleteEnabled = false;
					if (sap.suite.ui.generic.template.js.AnnotationHelper.areDeleteRestrictionsValid(oMetaModel, oEntitySet.entityType, oDeleteRestrictions)) {
						var sDeletablePath = oDeleteRestrictions && oDeleteRestrictions.Deletable && oDeleteRestrictions.Deletable.Path;
						var aContexts = oTemplateUtils.oCommonUtils.getSelectedContexts(oControl);
						// search for at least one deletable entry
						bDeleteEnabled = aContexts.some(function(oContext){
							var oDraftAdministrativeData = oModel.getObject(oContext.getPath() + "/DraftAdministrativeData");
							var bIsObjectNotLocked = !(oDraftAdministrativeData && oDraftAdministrativeData.InProcessByUser && !oDraftAdministrativeData.DraftIsProcessedByMe);
							// The object is deletable if it is not locked and we do not have a deleteable path that disallows the deletion of that object
							return bIsObjectNotLocked && !(sDeletablePath && !oModel.getProperty(sDeletablePath, oContext));
						});
					}
					oTemplatePrivateModel.setProperty("/listReport/deleteEnabled", bDeleteEnabled);
					oTemplateUtils.oCommonUtils.setEnabledToolbarButtons(oControl);
					if (!oTemplateUtils.oCommonUtils.isSmartChart(oControl)) { //Chart does not have footer buttons
						oTemplateUtils.oCommonUtils.setEnabledFooterButtons(oControl);
					}
				}

				function fnOnSemanticObjectLinkNavigationPressed(oEvent){
					var oEventParameters = oEvent.getParameters();
					var oEventSource = oEvent.getSource();
					oTemplateUtils.oCommonEventHandlers.onSemanticObjectLinkNavigationPressed(oEventSource, oEventParameters);
				}
				
				function fnOnSemanticObjectLinkNavigationTargetObtained(oEvent) {
					var oEventParameters, oEventSource;
					oEventParameters = oEvent.getParameters();
					oEventSource = oEvent.getSource();	//set on semanticObjectController	
					oTemplateUtils.oCommonEventHandlers.onSemanticObjectLinkNavigationTargetObtained(oEventSource, oEventParameters, oState, undefined, undefined);
				}

				function fnOnSemanticObjectLinkNavigationTargetObtainedSmartLink(oEvent) {
					var oMainNavigation, sTitle, oCustomData, sDescription, oEventParameters, oEventSource;
					oMainNavigation = oEvent.getParameters().mainNavigation;
					oEventParameters = oEvent.getParameters();
					oEventSource = oEvent.getSource(); //set on smart link
					if (oMainNavigation) {
						sTitle = oEventSource.getText && oEventSource.getText();
						oCustomData = oTemplateUtils.oCommonUtils.getCustomData(oEvent);
						if (oCustomData && oCustomData["LinkDescr"]) {
							sDescription = oCustomData["LinkDescr"];
							oMainNavigation.setDescription(sDescription);
						}
					}
					oEventSource = oEventSource.getParent().getParent().getParent().getParent(); //set on smart table
					oTemplateUtils.oCommonEventHandlers.onSemanticObjectLinkNavigationTargetObtained(oEventSource, oEventParameters, oState, sTitle, oMainNavigation);
					//oEventParameters.show(sTitle, oMainNavigation, undefined, undefined);
				}
				
				function getItemInTable(sContextPath) {
					var aItems = oViewProxy.getItems();
					for (var i = 0; i < aItems.length; i++) {
						if (!sContextPath || aItems[i].getBindingContextPath() === sContextPath) {
							return aItems[i];
						}
					}
				}

				// Generation of Event Handlers
				return {
					onInit: function() {
						// check if worklist is enabled
						var oAppComponent = oController.getOwnerComponent().getAppComponent();
						var oManifestEntryGenricApp = oAppComponent.getConfig();
						oState.bWorkListEnabled = !!oManifestEntryGenricApp.pages[0].component.settings && oManifestEntryGenricApp.pages[0].component.settings.isWorklist || false;
						oState.oSmartFilterbar = oController.byId("listReportFilter");
						oState.oSmartTable = oController.byId("listReport");
						// Make the fnUpdateControlOnSelectionChange function available for others via the oState object
						oState.updateControlOnSelectionChange = fnUpdateControlOnSelectionChange;
						oFclProxy = oTemplateUtils.oServices.oApplication.getFclProxyForView(0);
						oState.bLoadListAndFirstEntryOnStartup = oFclProxy && oFclProxy.isListAndFirstEntryLoadedOnStartup && oFclProxy.isListAndFirstEntryLoadedOnStartup();	
						oState.oMultipleViewsHandler = new MultipleViewsHandler(oState, oController, oTemplateUtils);

						oState.oIappStateHandler = new IappStateHandler(oState, oController, oTemplateUtils.oCommonUtils.getNavigationHandler());
						oTemplateUtils.oServices.oApplication.registerStateChanger({
							isStateChange: oState.oIappStateHandler.isStateChange
						});
						// Give component access to some methods
						oViewProxy.getUrlParameterInfo = oState.oIappStateHandler.getUrlParameterInfo;
						oViewProxy.getItems = function(){
							var oTable = oState.oSmartTable.getTable();
							if (oTemplateUtils.oCommonUtils.isUiTable(oTable))	{
								return oTable.getRows();
							}
							return oTable.getItems();
						};
						oViewProxy.displayNextObject = function(aOrderObjects){
							return new Promise(function(resolve, reject){
								aWaitingForDisplayNextObjectInfo = {
									aWaitingObjects: aOrderObjects,
									resolve: resolve,
									reject: reject
								};	
							});
						};
						
						oViewProxy.onComponentActivate = function(){
							if (!bIsStartingUp){
								oState.oIappStateHandler.parseUrlAndApplyAppState();
							}
						};
						oViewProxy.refreshBinding = function(){
							// refresh list, but only if the list is currently showing data
							if (oState.oIappStateHandler.areDataShownInTable()){
								oTemplateUtils.oCommonUtils.refreshSmartTable(oState.oSmartTable);
							}
						};

						fnSetIsLeaf();
						fnSetShareModel();
						oController.byId("template::FilterText").attachBrowserEvent("click", function () {
							oController.byId("page").setHeaderExpanded(true);
						});
						var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();

						// Initialise headerExpanded property to true as a fix for incident 1770402849. Text of toggle filter button depends on this value.
						oTemplatePrivateModel.setProperty("/listReport/isHeaderExpanded", true);

						// set property for enable/disable of the Delete button
						oTemplatePrivateModel.setProperty("/listReport/deleteEnabled", false);

						if (oState.bWorkListEnabled) {
							oState.oSmartFilterbar.setSuppressSelection(false);
							oState.oSmartFilterbar.search();
						}
					},

					handlers: {
						addEntry: function(oEvent) {
							var oEventSource = oEvent.getSource();
							oTemplateUtils.oCommonUtils.processDataLossConfirmationIfNonDraft(function(){
								oTemplateUtils.oCommonEventHandlers.addEntry(oEventSource, false, oState.oSmartFilterbar);
							}, jQuery.noop, oState);
						},
						deleteEntries: function(oEvent) {
							oTemplateUtils.oCommonEventHandlers.deleteEntries(oEvent);
						},
						updateTableTabCounts: function() {
							oState.oMultipleViewsHandler.fnUpdateTableTabCounts();
						},
						onSelectionChange: function(oEvent) {
							var oTable = oEvent.getSource();
							fnUpdateControlOnSelectionChange(oTable);
						},
						onChange: function(oEvent) {
							oTemplateUtils.oCommonEventHandlers.onChange(oEvent);
						},
						onSmartFieldUrlPressed: function(oEvent) {
							oTemplateUtils.oCommonEventHandlers.onSmartFieldUrlPressed(oEvent, oState);
						},
						onBreadCrumbUrlPressed: function(oEvent) {
							oTemplateUtils.oCommonEventHandlers.onBreadCrumbUrlPressed(oEvent, oState);
						},
						onContactDetails: function(oEvent) {
							oTemplateUtils.oCommonEventHandlers.onContactDetails(oEvent);
						},
						onSmartFilterBarInitialise: onSmartFilterBarInitialise,
						onSmartFilterBarInitialized: onSmartFilterBarInitialized,

						onBeforeSFBVariantFetch: function() {
							oState.oIappStateHandler.onBeforeSFBVariantFetch();
						},

						onAfterSFBVariantSave: function(){
							oState.oIappStateHandler.onAfterSFBVariantSave();
						},

						onAfterSFBVariantLoad: function(oEvent) {
							oState.oIappStateHandler.onAfterSFBVariantLoad(oEvent);
						},
						onDataRequested: function(){
							oState.oMultipleViewsHandler.onDataRequested();	
						},
						onDataReceived: function(oEvent){
							oTemplateUtils.oCommonEventHandlers.onDataReceived(oEvent);
							var oImplementingHelper = oState.oMultipleViewsHandler.getImplementingHelper();
							if (oImplementingHelper && typeof oImplementingHelper.setTableDirty === 'function') {
								oImplementingHelper.setTableDirty(oState.oSmartTable, false);
							}
							if (aWaitingForDisplayNextObjectInfo){
								var oItem;
								var bSuccess = false;
								for (var i = 0; i < aWaitingForDisplayNextObjectInfo.aWaitingObjects.length && !bSuccess; i++) {
									oItem = getItemInTable(aWaitingForDisplayNextObjectInfo.aWaitingObjects[i]);
									if (oItem) {
										oTemplateUtils.oCommonEventHandlers.onListNavigate(oItem, oState);
										aWaitingForDisplayNextObjectInfo.resolve();
										bSuccess = true;
									}
								}
								if (!bSuccess){
									oItem = getItemInTable();
									if (oItem){
										oTemplateUtils.oCommonEventHandlers.onListNavigate(oItem, oState);
										aWaitingForDisplayNextObjectInfo.resolve();
									} else {
										aWaitingForDisplayNextObjectInfo.reject();
									}
								}
								aWaitingForDisplayNextObjectInfo = null;
								return;
							}

							var oTable = oEvent.getSource().getTable();
							oFclProxy.handleDataReceived(oTable, oState, oTemplateUtils);
						},
						// it is a workaround for the time being till SmartChart fired an Event DataRequested; then it has to be changed
						onSmartChartDataReceived: function() {
							oState.oMultipleViewsHandler.onDataRequested();
						},
						onBeforeRebindTable: function(oEvent) {
							oTemplateUtils.oCommonEventHandlers.onBeforeRebindTable(oEvent, {
								determineSortOrder: oState.oMultipleViewsHandler.determineSortOrder
							});
							oController.onBeforeRebindTableExtension(oEvent);
							oState.oMultipleViewsHandler.onRebindContentControl(oEvent);
						},
						onShowDetails: function(oEvent) {
							oTemplateUtils.oCommonEventHandlers.onShowDetails(oEvent.getSource(), oState);
						},
						onListNavigate: function(oEvent) {
							if (!oController.onListNavigationExtension(oEvent)) {
								oTemplateUtils.oCommonEventHandlers.onListNavigate(oEvent.getSource(), oState);
							}
						},
						onCallActionFromToolBar: function(oEvent) {
							oTemplateUtils.oCommonEventHandlers.onCallActionFromToolBar(oEvent, oState);
						},
						onDataFieldForIntentBasedNavigation: function(oEvent) {
							oTemplateUtils.oCommonEventHandlers.onDataFieldForIntentBasedNavigation(oEvent, oState);
						},
						onDataFieldWithIntentBasedNavigation: function(oEvent) {
							oTemplateUtils.oCommonEventHandlers.onDataFieldWithIntentBasedNavigation(oEvent, oState);
						},
						onBeforeSemanticObjectLinkPopoverOpens: function(oEvent) {

							var oEventParameters = oEvent.getParameters();

							oTemplateUtils.oCommonUtils.processDataLossConfirmationIfNonDraft(function(){
							  //Success function
									var sSelectionVariant = JSON.stringify(oState.oSmartFilterbar.getUiState().getSelectionVariant());
									oTemplateUtils.oCommonUtils.semanticObjectLinkNavigation(oEventParameters, sSelectionVariant, oController);
							}, jQuery.noop, oState, jQuery.noop);
						},
						onSemanticObjectLinkNavigationPressed: fnOnSemanticObjectLinkNavigationPressed,
						onSemanticObjectLinkNavigationTargetObtained: fnOnSemanticObjectLinkNavigationTargetObtained,
						onSemanticObjectLinkNavigationTargetObtainedSmartLink: fnOnSemanticObjectLinkNavigationTargetObtainedSmartLink,
						onDraftLinkPressed: function(oEvent) {
							var oButton = oEvent.getSource();
							var oBindingContext = oButton.getBindingContext();
							oTemplateUtils.oCommonUtils.showDraftPopover(oBindingContext, oButton);
						},
						onAssignedFiltersChanged: function(oEvent) {
							if (oEvent.getSource()) {
								oController.byId("template::FilterText").setText(oEvent.getSource().retrieveFiltersWithValuesAsText());
							}
						},
						onFilterChange: onFilterChange,
						onToggleFiltersPressed: function() {
							var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
							oTemplatePrivateModel.setProperty("/listReport/isHeaderExpanded", !oTemplatePrivateModel.getProperty("/listReport/isHeaderExpanded"));
						},

						// the search is automatically performed by the SmartTable
						// so we only need to
						// - ensure that all cached data for the object pages are refreshed, too
						// - update our internal state (data are shown in table)
						onSearchButtonPressed: function() {
							oTemplateUtils.oCommonUtils.refreshModel(oState.oSmartTable);
							oState.oIappStateHandler.changeIappState(false, true);
						},
						onSemanticObjectLinkPopoverLinkPressed: function(oEvent) {
							oTemplateUtils.oCommonEventHandlers.onSemanticObjectLinkPopoverLinkPressed(oEvent, oState);
						},
						onAfterTableVariantSave: function() {
							oState.oIappStateHandler.onAfterTableVariantSave();
						},
						onAfterApplyTableVariant: function() {
							if (!bIsStartingUp) {
								oState.oIappStateHandler.onAfterApplyTableVariant();
							}
						},
						onAfterChartVariantSave: function(oEvent) {
							oState.oIappStateHandler.onAfterTableVariantSave();
						},
						onAfterApplyChartVariant: function(oEvent) {
							if (!bIsStartingUp) {
								oState.oIappStateHandler.onAfterApplyTableVariant();
							}
						},
						onBeforeRebindChart: function(oEvent) {
							// get Smart filter values
							oTemplateUtils.oCommonEventHandlers.onBeforeRebindChart(oEvent);
							// add custom filters
							// it is necessary to get the smart filters and custom filters first so that they will be added to the oState.oTableTabData.oCurrentBindingParams
							// oState.oTableTabData.oCurrentBindingParams will get values from the SelectionVariants later and will be used for sending the counter requests
							oController.onBeforeRebindChartExtension(oEvent);
								oState.oMultipleViewsHandler.onRebindContentControl(oEvent);
						},
						onChartInitialise: function(oEvent) {
							oState.oMultipleViewsHandler.fnRegisterToChartEvents(oEvent);
						//	oState.oMultipleViewsHandler.onChartInit(oEvent);
							oState.oMultipleViewsHandler.init(oEvent);
							oTemplateUtils.oCommonUtils.checkToolbarIntentsSupported(oEvent.getSource());
						},
						onSelectionDetailsActionPress: function(oEvent) {
							oState.oMultipleViewsHandler.onDetailsActionPress(oEvent);
						},

						// ---------------------------------------------
						// END store navigation context
						// ---------------------------------------------

						onShareListReportActionButtonPress: function (oEvent) {
							var oShareActionSheet = oTemplateUtils.oCommonUtils.getDialogFragment(
								"sap.suite.ui.generic.template.fragments.lists.ShareSheet", {
									shareEmailPressed: function() {
										sap.m.URLHelper.triggerEmail(null, oTemplateUtils.oCommonUtils.getText("EMAIL_HEADER", [oTemplateUtils.oServices.oApplication.getAppTitle()]), document.URL);
									},
									shareJamPressed: function() {
										var oShareDialog = sap.ui.getCore().createComponent({
											name: "sap.collaboration.components.fiori.sharing.dialog",
											settings: {
												object: {
													id: document.URL,
													share: oTemplateUtils.oServices.oApplication.getAppTitle()
												}
											}
										});
										oShareDialog.open();
									}

								}, "share", function(oFragment, oShareModel) {
									var oResource = sap.ui.getCore().getLibraryResourceBundle("sap.m");
									oShareModel.setProperty("/emailButtonText", oResource.getText("SEMANTIC_CONTROL_SEND_EMAIL"));
									oShareModel.setProperty("/jamButtonText", oResource.getText("SEMANTIC_CONTROL_SHARE_IN_JAM"));
									oShareModel.setProperty("/bookmarkButtonText", oResource.getText("SEMANTIC_CONTROL_SAVE_AS_TILE"));
									var fnGetUser = jQuery.sap.getObject("sap.ushell.Container.getUser");
									oShareModel.setProperty("/jamVisible", !!fnGetUser && fnGetUser().isJamActive());
								});
							oShareActionSheet.openBy(oEvent.getSource());

							// workaround for focus loss issue for AddBookmarkButton ("save as tile" button)
							var oShareButton = this.getView().byId("template::Share");
							var oBookmarkButton = this.getView().byId("bookmarkButton");
							oBookmarkButton.setBeforePressHandler(function() {
								// set the focus to share button
								oShareButton.focus();
							});
						},
						onInlineDataFieldForAction: function(oEvent) {
							oTemplateUtils.oCommonEventHandlers.onInlineDataFieldForAction(oEvent, oState);
						},
						onInlineDataFieldForIntentBasedNavigation: function(oEvent) {
							oTemplateUtils.oCommonEventHandlers.onInlineDataFieldForIntentBasedNavigation(oEvent.getSource(), oState);
						},
						onDeterminingDataFieldForAction: function(oEvent) {
							oTemplateUtils.oCommonEventHandlers.onDeterminingDataFieldForAction(oEvent, oState.oSmartTable.getTable());
						},
						onDeterminingDataFieldForIntentBasedNavigation: function(oEvent) {
							var oButton = oEvent.getSource();
							oTemplateUtils.oCommonEventHandlers.onDeterminingDataFieldForIntentBasedNavigation(oButton, oState.oSmartTable.getTable(), oState);
						},

						// Note: In the multiple view multi tables mode this will be called once for each SmartTable
						onTableInit: function(oEvent) {
							var oSmartTable = oEvent.getSource(); // do not use oState.oSmartTable, since this is not reliable in the multiple view multi tables mode
							oTemplateUtils.oCommonUtils.checkToolbarIntentsSupported(oSmartTable);
							oState.oMultipleViewsHandler.init(oEvent);
						},
						//search function called in worklist light version of LR
						onSearchWorkListLight: function(oEvent) {
							var oSmartTable = oState.oSmartTable;
							oSmartTable.data("searchString", oEvent.getSource().getValue());
							oSmartTable.data("allowSearchWorkListLight", true);
							oSmartTable.rebindTable();

							var oModel = oController.getOwnerComponent().getModel();
							var fnRequestFailed = function(oEvent) {
								MessageUtils.handleError("getCollection", oController, oTemplateUtils.oServices, oEvent.getParameters());
								oState.oSmartTable.getTable().setBusy(false);
								MessageUtils.handleTransientMessages(oTemplateUtils.oServices.oApplication.getDialogFragmentForView.bind(null, oController.getView()));
							};
							oModel.attachEvent('requestFailed', fnRequestFailed);
							oModel.attachEventOnce('requestCompleted', function() {
								oModel.detachEvent('requestFailed', fnRequestFailed);
							});
						},
						// functions for sort, filter group in table header in worklist light
						onWorkListLightTableSort: function(oEvent) {
							var oSmartTable = oState.oSmartTable;
							if (oSmartTable) {
								oSmartTable.openPersonalisationDialog("Sort");
							}
						},
						onWorkListLightTableFilter: function() {
							var oSmartTable = oState.oSmartTable;
							if (oSmartTable) {
								oSmartTable.openPersonalisationDialog("Filter");
							}
						},
						onWorkListLightTableGroup: function() {
							var oSmartTable = oState.oSmartTable;
							if (oSmartTable) {
							oSmartTable.openPersonalisationDialog("Group");
							}
						},
						onWorkListLightTableColumns: function() {
							var oSmartTable = oState.oSmartTable;
							if (oSmartTable) {
								oSmartTable.openPersonalisationDialog("Columns");
							}
						}
					},
					formatters: {
						formatDraftType: function(oDraftAdministrativeData, bIsActiveEntity, bHasDraftEntity) {
							if (oDraftAdministrativeData && oDraftAdministrativeData.DraftUUID) {
								if (!bIsActiveEntity) {
									return sap.m.ObjectMarkerType.Draft;
								} else if (bHasDraftEntity) {
									return oDraftAdministrativeData.InProcessByUser ? sap.m.ObjectMarkerType.Locked : sap.m.ObjectMarkerType.Unsaved;
								}
							}
							return sap.m.ObjectMarkerType.Flagged;
						},

						formatDraftVisibility: function(oDraftAdministrativeData, bIsActiveEntity) {
							if (oDraftAdministrativeData && oDraftAdministrativeData.DraftUUID) {
								if (!bIsActiveEntity) {
									return sap.m.ObjectMarkerVisibility.TextOnly; //for Draft mode only the text will be shown
								}
							}
							return sap.m.ObjectMarkerVisibility.IconAndText; //Default text and icon
						},

						formatDraftLineItemVisible: function(oDraftAdministrativeData) {
							if (oDraftAdministrativeData && oDraftAdministrativeData.DraftUUID) {
								return true;
							}
							return false;
						},

						// Returns full user name or ID of owner of a draft with status "unsaved changes" or "locked" in the format "by full name" or "by UserId"
						// If the user names and IDs are not maintained we display for example "locked by another user"
						formatDraftOwner: function(oDraftAdministrativeData, bHasDraftEntity) {
							var sDraftOwnerDescription = "";
							if (oDraftAdministrativeData && oDraftAdministrativeData.DraftUUID && bHasDraftEntity) {
								var sUserDescription = oDraftAdministrativeData.InProcessByUserDescription || oDraftAdministrativeData.InProcessByUser || oDraftAdministrativeData.LastChangedByUserDescription || oDraftAdministrativeData.LastChangedByUser;
								if (sUserDescription){
									sDraftOwnerDescription = oTemplateUtils.oCommonUtils.getText("ST_DRAFT_OWNER", [sUserDescription]);
								} else {
									sDraftOwnerDescription = oTemplateUtils.oCommonUtils.getText("ST_DRAFT_ANOTHER_USER");
								}
							}
							return sDraftOwnerDescription;
						},
						
						formatItemTextForMultipleView: function(oItem){
							return oState.oMultipleViewsHandler ? oState.oMultipleViewsHandler.formatItemTextForMultipleView(oItem) : "";
						}
					},

					extensionAPI: new ExtensionAPI(oTemplateUtils, oController, oState)
				};
			}
		};

	});