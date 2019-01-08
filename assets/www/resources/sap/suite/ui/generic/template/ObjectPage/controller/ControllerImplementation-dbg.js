sap.ui
	.define(
		["jquery.sap.global", "sap/ui/core/format/DateFormat",
			"sap/m/MessageBox", "sap/m/MessageToast", "sap/ui/model/Filter", "sap/ui/model/Sorter",
			"sap/ui/comp/smarttable/SmartTable", "sap/ui/generic/app/navigation/service/SelectionVariant",
			"sap/suite/ui/generic/template/lib/testableHelper", "sap/suite/ui/generic/template/detailTemplates/detailUtils",
			"sap/suite/ui/generic/template/ObjectPage/extensionAPI/ExtensionAPI", "sap/ui/model/json/JSONModel", "sap/suite/ui/generic/template/js/AnnotationHelper", "sap/ui/core/mvc/ViewType", "sap/m/Table"
		],
		function(jQuery, DateFormat, MessageBox, MessageToast, Filter, Sorter,
			SmartTable, SelectionVariant, testableHelper, detailUtils, ExtensionAPI, JSONModel, AnnotationHelper, ViewType, ResponsiveTable) {
			"use strict";
			function fnIsEventForTableWithInlineCreate(oSmartTable){
				return oSmartTable.data("inlineCreate") === "true";
			}
			
			// end of helper functions for setting sections to lazy loading
			
			return {
				getMethods: function(oViewProxy, oTemplateUtils, oController) {
					var oBase = detailUtils.getControllerBase(oViewProxy, oTemplateUtils, oController);
					oBase.state.aUnsavedDataCheckFunctions = []; //array for external unsaved data check functions that can be registered
					var bIsObjectRoot; // will currently be set first time, when edit button is pressed
					var oObjectPage;  // the object page, initialized in onInit
					
					function onActivateImpl() {
						var oConfig = oController.getOwnerComponent().getAppComponent().getConfig();
						if (oTemplateUtils.oServices.oApplication.getBusyHelper().isBusy()){
							jQuery.sap.log.info("Activation of object suppressed, since App is currently busy");
							return; // this is again tested by the CRUDManager. But in order to suppress the AfterActivate-Event in the busy case we also need to check this here.
						}
						jQuery.sap.log.info("Activate object");
						var oActivationPromise = oTemplateUtils.oServices.oCRUDManager.activateDraftEntity();
						oActivationPromise.then(function(oResponse) {
							oTemplateUtils.oServices.oApplication.showMessageToast(oTemplateUtils.oCommonUtils.getText("OBJECT_SAVED"));
							if (oResponse && oResponse.context) {
								// it's not enough to set root to dirty: Scenario: subitem has been displayed (active document), then changed (draft) and shall be
								// displayed again after activation - now data has to be read again
								// therefore we set all pages to dirty, excluding the current one (here the active data is already returned by the function import)
								oTemplateUtils.oServices.oViewDependencyHelper.setAllPagesDirty([oController.getOwnerComponent().getId()]);
								oTemplateUtils.oServices.oViewDependencyHelper.unbindChildren(oController.getOwnerComponent());
								var bNavToListOnSave = oConfig && oConfig.pages && oConfig.pages[0] && oConfig.pages[0].pages && oConfig.pages[0].pages[0] && oConfig.pages[0].pages[0].component && oConfig.pages[0].pages[0].component.settings && oConfig.pages[0].pages[0].component.settings.navToListOnSave;
								if (bNavToListOnSave) {
									// Activate and navigate to List Report Page
									oTemplateUtils.oServices.oNavigationController.navigateToRoot(true);
								} else {
									// navigate to activate document
									oTemplateUtils.oServices.oNavigationController.navigateToContext(
											oResponse.context, undefined, true);
								}
							}
						});
						var oEvent = {
							activationPromise: oActivationPromise
						};
						oTemplateUtils.oComponentUtils.fire(oController, "AfterActivate", oEvent);
					}
					
					function fnOpenConfirmationDialog(oScope, aPersistentMessageModel, sMessageType) {
					    var oMessageTemplate = new sap.m.MessageItem({
					        type: '{type}',
					        title: '{title}'
					    });
					    var oModel = new JSONModel();
					    var that = oScope;

					    oModel.setData(aPersistentMessageModel);

					    oScope._oMessageView = new sap.m.MessageView({
					        showDetailsPageHeader: false,
					        itemSelect: function() {
					            that._oBackButton.setVisible(true);
					        },
					        items: {
					            path: "/",
					            template: oMessageTemplate
					        }
					    });

					    oScope._oBackButton = new sap.m.Button({
					        icon: sap.ui.core.IconPool.getIconURI("nav-back"),
					        visible: false,
					        press: function() {
					            that._oMessageView.navigateBack();
					            oScope.setVisible(false);
					        }
					    });

					    oScope._oMessageView.setModel(oModel);
					    var oDialog = oTemplateUtils.oCommonUtils.getDialogFragment("sap.suite.ui.generic.template.ObjectPage.view.fragments.ShowConfirmationOnDraftActivate", {
							onCancel: function() {
								oDialog.close();
							},
							onSave: function() {
								oDialog.close();
								oTemplateUtils.oServices.oApplication.performAfterSideEffectExecution(onActivateImpl);
							}
						});
					    oDialog.removeAllContent();
					    oDialog.addContent(oScope._oMessageView);
					    oDialog.setContentHeight("300px");
					    oDialog.setContentWidth("500px");
					    oDialog.setVerticalScrolling(false);
					    oDialog.aCustomStyleClasses = ["sapMNavItem"];
					    oDialog.setState(sMessageType);
					    oDialog.open();
					}
					
					function onActivate() {
					    var oConfig = oController.getOwnerComponent().getAppComponent().getConfig();
					    if (oConfig && oConfig.pages && oConfig.pages[0] && oConfig.pages[0].pages && oConfig.pages[0].pages[0] && oConfig.pages[0].pages[0].component && oConfig.pages[0].pages[0].component.settings && oConfig.pages[0].pages[0].component.settings.showConfirmationOnDraftActivate) {
					        var oMessagePopover = oTemplateUtils.oCommonUtils.getDialogFragment("sap.suite.ui.generic.template.fragments.MessagePopover");
					        var aBindingForPersistentMessage = oMessagePopover.getBinding("items").aIndices;
					        var aPersistentMessageModel = [];
					        var iWarningCount = 0;
					        var sMessageType = "Warning";
					        for (var i in aBindingForPersistentMessage) {
					            var sState = oMessagePopover.getBinding("items").oList[aBindingForPersistentMessage[i]].type;
					            if (sState == "Warning") {
					                iWarningCount++;
					            } else if (sState == "Error") {
					                sMessageType = "Error";
					            }
					            var sMessage = oMessagePopover.getBinding("items").oList[aBindingForPersistentMessage[i]].message;
					            aPersistentMessageModel.push({
					                type: sState,
					                title: sMessage
					            });
					        }
					        if (iWarningCount) {
					            fnOpenConfirmationDialog(this, aPersistentMessageModel, sMessageType);
					        } else {
					            oTemplateUtils.oServices.oApplication.performAfterSideEffectExecution(onActivateImpl);
					        }
					    } else {
					        oTemplateUtils.oServices.oApplication.performAfterSideEffectExecution(onActivateImpl);
					    }
					}
					
					function fnAdaptBindingParamsForInlineCreate(oEvent) {
						if (fnIsEventForTableWithInlineCreate(oEvent.getSource())) {
							var oBindingParams = oEvent.getParameter("bindingParams");
							if (oBindingParams.filters && oBindingParams.filters.length) {
								/*
								 * Add a new filter condition to always show all items that are just created. In case we are in a draft,
								 * that just means to add "or HasActiveEntity = false". For active documents however, that condition
								 * would always be true. Thus, we have to add 
								 * "or (HasActiveEntity = false and IsActiveEntity = false)". 
								 * However, this condition is not evaluated correctly by gateway, so we have to transform it to
								 * (IsActvieEntity = true and x) or (Is ActvieEntity = false and (x or HasActvieEntity = false)), 
								 * where x is the condition provided by the user
								 */
								var oUserFilter = new Filter(oBindingParams.filters);
								oBindingParams.filters = new Filter({
									filters: [new Filter({
										filters: [new Filter({
											path: "IsActiveEntity",
											operator: "EQ",
											value1: true
										}), oUserFilter],
										and: true
									}), new Filter({
										filters: [new Filter({
											path: "IsActiveEntity",
											operator: "EQ",
											value1: false
										}), new Filter({
											filters: [oUserFilter, new Filter({
												path: "HasActiveEntity",
												operator: "EQ",
												value1: false
											})],
											and: false
										})],
										and: true
									})],
									and: false
								});
							}
							var fnGroup = oBindingParams.sorter[0] && oBindingParams.sorter[0].getGroupFunction();
							var fnGroupExtended = fnGroup && function(oContext){
								var oObject = oContext.getObject();
								if (oObject.IsActiveEntity || oObject.HasActiveEntity){
									var oRet =  jQuery.extend({}, fnGroup(oContext));
									oRet.key = oRet.key.charAt(0) === "§" ? "§" + oRet.key : oRet.key;
									return oRet;
								}
								return {
									key: "§",
									text: oTemplateUtils.oCommonUtils.getText("NEW_ENTRY_GROUP")
								};
							};
							oBindingParams.sorter.unshift(new Sorter("HasActiveEntity", false, fnGroupExtended));
						}
					}
					function fnOnShareObjectPageEmailPress(sObjectTitle, sObjectSubtitle) {
						var sEmailSubject = sObjectTitle;
						if (sObjectSubtitle) {
							sEmailSubject = sEmailSubject + " - " + sObjectSubtitle;
						}
						var emailBody = document.URL;
						if ((emailBody.indexOf("(") == 0)) {
							emailBody = "%28" + emailBody.slice(1, emailBody.length);
						}
						if ((emailBody.lastIndexOf(")") == (emailBody.length - 1))) {
							emailBody = emailBody.slice(0, (emailBody.length - 1)) + "%29";
						}
						sap.m.URLHelper.triggerEmail(null, sEmailSubject, emailBody);
					}
					function fnOnShareObjectPageInJamPress(sObjectTitle, sObjectSubtitle) {
						var oShareDialog = sap.ui.getCore().createComponent({
							name: "sap.collaboration.components.fiori.sharing.dialog",
							settings: {
								object: {
									id: document.URL,
									share: sObjectTitle + " " + sObjectSubtitle
								}
							}
						});
						oShareDialog.open();
					}

					function getObjectHeader() {
						return oObjectPage.getHeaderTitle();
					}

					function onShareObjectPageActionButtonPress(oEvent) {
						var oShareActionSheet = oTemplateUtils.oCommonUtils.getDialogFragment(
							"sap.suite.ui.generic.template.fragments.ShareSheet", {
								shareEmailPressed: function() {
									var oShareModel = oShareActionSheet.getModel("share");
									fnOnShareObjectPageEmailPress(oShareModel.getProperty("/objectTitle"), oShareModel
										.getProperty("/objectSubtitle"));
								},
								shareJamPressed: function() {
									var oShareModel = oShareActionSheet.getModel("share");
									fnOnShareObjectPageInJamPress(oShareModel.getProperty("/objectTitle"), oShareModel
										.getProperty("/objectSubtitle"));
								}
							}, "share", function(oFragment, oShareModel) {
								var oResource = sap.ui.getCore().getLibraryResourceBundle("sap.m");
								oShareModel.setProperty("/emailButtonText", oResource.getText("SEMANTIC_CONTROL_SEND_EMAIL"));
								oShareModel.setProperty("/jamButtonText", oResource.getText("SEMANTIC_CONTROL_SHARE_IN_JAM"));
								oShareModel
									.setProperty("/bookmarkButtonText", oResource.getText("SEMANTIC_CONTROL_SAVE_AS_TILE"));
								var fnGetUser = jQuery.sap.getObject("sap.ushell.Container.getUser");
								oShareModel.setProperty("/jamVisible", !!fnGetUser && fnGetUser().isJamActive());
							});
						var oShareModel = oShareActionSheet.getModel("share");
						var oObjectHeader = getObjectHeader();
						oShareModel.setProperty("/objectTitle", oObjectHeader.getProperty("objectTitle"));
						oShareModel.setProperty("/objectSubtitle", oObjectHeader.getProperty("objectSubtitle"));
						oShareModel.setProperty("/bookmarkCustomUrl", document.URL);
						oShareActionSheet.openBy(oEvent.getSource());
					}

					function getRelatedAppsSheet() {
						var oRelatedAppsSheet = oTemplateUtils.oCommonUtils.getDialogFragment(
							"sap.suite.ui.generic.template.ObjectPage.view.fragments.RelatedAppsSheet", {
								buttonPressed: function(oEvent) {
									var oButton = oEvent.getSource();
									var oButtonsContext = oButton.getBindingContext("buttons");
									var oLink = oButtonsContext.getProperty("link");
									var oParam = oButtonsContext.getProperty("param");
									var str = oLink.intent;
									var sSemanticObject = str.split('#')[1].split('-')[0];
									var sAction = str.split('-')[1].split('?')[0].split('~')[0];
									var oNavArguments = {
										target: {
											semanticObject: sSemanticObject,
											action: sAction
										},
										params: oParam
									};
								//Extension point to remove properties from link for external navigation will be NOT supported for related apps
									sap.ushell.Container.getService("CrossApplicationNavigation").toExternal(oNavArguments);
								}
							}, "buttons");
						return oRelatedAppsSheet;
					}

					function onDeleteImpl() {
						var oBusyHelper = oTemplateUtils.oServices.oApplication.getBusyHelper();
						if (oBusyHelper.isBusy()){
							return;
						}
						var oComponent = oController.getOwnerComponent();
						var sNavigationProperty = oComponent.getNavigationProperty();
						var oUtils = oTemplateUtils.oCommonUtils;
						var oPageHeader = oController.byId("objectPageHeader");
						var sMessageText, aParams;
						if (oPageHeader.getProperty("objectTitle") !== "") {
							if (oPageHeader.getProperty("objectSubtitle") !== "") {
								aParams = [" ", oPageHeader.getProperty("objectTitle").trim(), oPageHeader.getProperty("objectSubtitle")];
								sMessageText = oUtils.getText("DELETE_WITH_OBJECTINFO", aParams);
							} else {
								aParams = [oPageHeader.getProperty("objectTitle").trim()];
								sMessageText = oUtils.getText("DELETE_WITH_OBJECTTITLE", aParams);
							}
						} else {
							sMessageText = oUtils.getText("ST_GENERIC_DELETE_SELECTED");
						}

						MessageBox.show(sMessageText, {
							icon: MessageBox.Icon.WARNING,
							styleClass: oTemplateUtils.oCommonUtils.getContentDensityClass(),
							title: oUtils.getText("DELETE"),
							actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
							onClose: function(oAction) {
								if (oAction === MessageBox.Action.DELETE) {
									var oDeleteEntityPromise = oTemplateUtils.oServices.oCRUDManager.deleteEntity();
									var sPath = oComponent.getBindingContext() && oComponent.getBindingContext().getPath();
									var mObjectsToDelete = Object.create(null);
									mObjectsToDelete[sPath] = oDeleteEntityPromise;
									
									oTemplateUtils.oServices.oApplication.prepareDeletion(mObjectsToDelete);
									
									oDeleteEntityPromise.then(function() {
										oTemplateUtils.oServices.oViewDependencyHelper.setParentToDirty(oComponent, sNavigationProperty, 1);
										oTemplateUtils.oServices.oViewDependencyHelper.unbindChildren(oComponent, true);
									});
									var oEvent = {
										deleteEntityPromise: oDeleteEntityPromise
									};
									oBusyHelper.setBusy(oDeleteEntityPromise);
									oTemplateUtils.oComponentUtils.fire(oController, "AfterDelete", oEvent);
								}
							}
						});
					}
					
					function onDelete(oEvent) {
						oTemplateUtils.oServices.oApplication.performAfterSideEffectExecution(onDeleteImpl);
					}
					
					// This method is called when editing of an entity has started and the corresponding context is available
					function fnStartEditing(oResult){
						var oDraft, oContext;
						if (oResult) {
							oContext = oResult.context || oResult;
							if (oTemplateUtils.oServices.oDraftController.getDraftContext().hasDraft(oContext)) {
								oTemplateUtils.oServices.oViewDependencyHelper.setRootPageToDirty();
								oDraft = oResult.context && oResult.context.context || oResult.context || oResult;
							}
						}
						if (oDraft) {
							// navigate to draft
							if (oBase.fclInfo.navigateToDraft) {
								oBase.fclInfo.navigateToDraft(oDraft);
							} else {
								oTemplateUtils.oServices.oNavigationController.navigateToContext(oDraft, undefined, true, 2);
							}
						} else {
							var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
							oTemplatePrivateModel.setProperty("/objectPage/displayMode", 2);
						}
						//set Editable independent of the fact that the instance is a draft or not
						oViewProxy.setEditable(true);
					}

					var fnExpiredLockDialog;  // declare function already here, to avoid usage before declaration
					// This method is called when the user decides to edit an entity.
					// Parameter bUnconditional contains the information, whether the user has already confirmed to take over unsaved changes of another user, or whether this is still open
					function fnEditEntity(bUnconditional) {
						oTemplateUtils.oServices.oCRUDManager.editEntity(bUnconditional).then(function(oEditInfo){
							if (oEditInfo.draftAdministrativeData){
								fnExpiredLockDialog(oEditInfo.draftAdministrativeData.CreatedByUserDescription || oEditInfo.draftAdministrativeData.CreatedByUser);
							} else {
								fnStartEditing(oEditInfo.context);
							}
						});
					}

					// This method is called when the user wants to edit an entity, for which a non-locking draft of another user exists.
					// The method asks the user, whether he wants to continue editing anyway. If this is the case editing is triggered.
					// sCreatedByUser is the name of the user possessing the non-locking draft
					fnExpiredLockDialog = function(sCreatedByUser) {
						var oUnsavedChangesDialog = oTemplateUtils.oCommonUtils.getDialogFragment(
							"sap.suite.ui.generic.template.ObjectPage.view.fragments.UnsavedChangesDialog", {
								onEdit: function() {
									oUnsavedChangesDialog.close();
									fnEditEntity(true);
								},
								onCancel: function() {
									oUnsavedChangesDialog.close();
								}
							}, "Dialog");
						var oDialogModel = oUnsavedChangesDialog.getModel("Dialog");
						var sDialogContentText = oTemplateUtils.oCommonUtils.getText("DRAFT_LOCK_EXPIRED", [sCreatedByUser]);
						oDialogModel.setProperty("/unsavedChangesQuestion", sDialogContentText);
						oUnsavedChangesDialog.open();
					};

					var sDefaultObjectTitleForCreated; // instantiated on demand

					function getDefaultObjectTitleForCreated() {
						sDefaultObjectTitleForCreated = sDefaultObjectTitleForCreated || oTemplateUtils.oCommonUtils.getText("NEW_OBJECT");
						return sDefaultObjectTitleForCreated;
					}

					function fnRefreshBlock(mRefreshInfos, bForceRefresh, oBlock){
						if (!oBlock.getContent){ // dummy-blocks need not to be refreshed
							return;
						}
						oBlock.getContent().forEach(function (oContent) {
							if (oContent instanceof SmartTable) {
								if (bForceRefresh || mRefreshInfos[oContent.getTableBindingPath()]) {
									if (oContent.isInitialised()){
										oTemplateUtils.oCommonUtils.refreshSmartTable(oContent);
									} else {
										oContent.attachInitialise(function(){
											oTemplateUtils.oCommonUtils.refreshSmartTable(oContent);
										});
									}

									if (!bForceRefresh) {
										oTemplateUtils.oServices.oApplicationController.executeSideEffects(oController.getOwnerComponent().getBindingContext(), [], [oContent.getTableBindingPath()]);
									}
								}
							}
						});
					}

					function setLockButtonVisible(bVisible) {
						var oLockButton = sap.ui.getCore().byId(getObjectHeader().getId() + "-lock");
						oLockButton.setVisible(bVisible);
					}

					function getSelectionVariant() {
						// oTemplateUtils, oController
						// if there is no selection we pass an empty one with the important escaping of ", passing "" or
						// null...was not possible
						// "{\"SelectionVariantID\":\"\"}";
						var sResult = "{\"SelectionVariantID\":\"\"}";

						/*
						 * rules don't follow 1:1 association, only header entity type fields don't send fields with empty
						 * values also send not visible fields remove Ux fields (e.g. UxFcBankStatementDate) send all kinds of
						 * types String, Boolean, ... but stringify all types
						 */

						var oComponent = oController.getOwnerComponent();
						var sEntitySet = oComponent.getEntitySet();
						var model = oComponent.getModel();
						var oMetaModel = model.getMetaModel();
						var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
						var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
						var aAllFieldsMetaModel = oEntityType.property;

						//collect the names of attributes to be deleted 
						//objects with existing sap:field-control -> mapped to com.sap.vocabularies.Common.v1.FieldControl attribute
						//e.g. ProductForEdit_fc field control fields shouldn't be transferred
						var aFieldsToBeIgnored = [];
						for (var x in aAllFieldsMetaModel) {
							var controlname = aAllFieldsMetaModel[x]["com.sap.vocabularies.Common.v1.FieldControl"] &&
								aAllFieldsMetaModel[x]["com.sap.vocabularies.Common.v1.FieldControl"].Path;
							if (controlname && aFieldsToBeIgnored.indexOf(controlname) < 0) {
								aFieldsToBeIgnored.push(controlname);
							}
						}

						var context = oController.getView().getBindingContext();
						var object = context.getObject();

						var oSelectionVariant = new SelectionVariant();
						for (var i in aAllFieldsMetaModel) {
							var type = aAllFieldsMetaModel[i].type;
							var name = aAllFieldsMetaModel[i].name;
							var value = object[aAllFieldsMetaModel[i].name];

							if (aFieldsToBeIgnored.indexOf(name) > -1) {
								continue;
							}

							if (name && (value || type === "Edm.Boolean")) { // also if boolean is false this must be sent
								if (type === "Edm.Time" && value.ms !== undefined) { // in case of Time an object is returned
									value = value.ms;
								}
								if (typeof value !== "string") {
									try {
										value = value.toString();
									} catch (e) {
										value = value + "";
									}
								}
								oSelectionVariant.addParameter(name, value);
							}
						}

						sResult = oSelectionVariant.toJSONString();
						return sResult;
					}

					function fnIsEntryDeletable(oContext, oSmartTable) {
						var bDeletable = true;
						var oModel = oSmartTable.getModel();
						var oDeleteRestrictions = oTemplateUtils.oCommonUtils.getDeleteRestrictions(oSmartTable);
						var sDeletablePath = oDeleteRestrictions && oDeleteRestrictions.Deletable && oDeleteRestrictions.Deletable.Path;
						if (sDeletablePath) {
							 bDeletable = oModel.getProperty(sDeletablePath, oContext);
						}
						return bDeletable;
					}
					
					function fnDeleteEntries(oEvent){
						var oBusyHelper = oTemplateUtils.oServices.oApplication.getBusyHelper();
						if (oBusyHelper.isBusy()){
							return; // this is again tested by the CRUDManager. But in order to suppress the check for selected lines in the busy case we also need to check this here.
						}
						var oEventSource = oEvent.getSource();
						var oSmartTable = oTemplateUtils.oCommonUtils.getOwnerControl(oEventSource);
						var aContexts = oTemplateUtils.oCommonUtils.getSelectedContexts(oSmartTable);
						if (aContexts.length === 0){
							MessageBox.error(oTemplateUtils.oCommonUtils.getText("ST_GENERIC_NO_ITEM_SELECTED"), {
								styleClass: oTemplateUtils.oCommonUtils.getContentDensityClass()
							});
							return;
						}
						var aPath = [];
						var aNonDeletableContext = [];
						for (var i = 0; i < aContexts.length; i++){
							// check if item is deletable
							if (fnIsEntryDeletable(aContexts[i], oSmartTable)) {
							aPath.push(aContexts[i].getPath());
							} else {
								aNonDeletableContext.push(aContexts[i]);
							}
						}
						if (aNonDeletableContext.length > 0) {
							MessageBox.error(oTemplateUtils.oCommonUtils.getText("ST_GENERIC_DELETE_UNDELETABLE_SUBITEMS", [aNonDeletableContext.length, aContexts.length]), {
								styleClass: oTemplateUtils.oCommonUtils.getContentDensityClass()
							});
						}
						
						var oDeletePromise = oTemplateUtils.oServices.oCRUDManager.deleteEntities(aPath);
						oBusyHelper.setBusy(oDeletePromise);
						oTemplateUtils.oServices.oApplicationController.executeSideEffects(oSmartTable.getBindingContext(), [], [oSmartTable.getTableBindingPath()]);

						var sUiElementId = oEventSource.getParent().getParent().getId();
						oDeletePromise.then(function() {
							oTemplateUtils.oServices.oViewDependencyHelper.unbindChildren(oController.getOwnerComponent());
							oTemplateUtils.oCommonUtils.refreshSmartTable(oSmartTable);
						});

						// This object will be consumed by Application Developer via attachAfterLineItemDelete extension API                                      
						var oAttachAfterLineItemDeleteProperties = {
								deleteEntitiesPromise: oDeletePromise,
								sUiElementId: sUiElementId,
								aContexts: aContexts
						};
						oTemplateUtils.oComponentUtils.fire(oController, "AfterLineItemDelete", oAttachAfterLineItemDeleteProperties);
					}

					function getImageDialog() {
						var oImageDialog = oController.byId("imageDialog") || oTemplateUtils.oCommonUtils.getDialogFragment(
							"sap.suite.ui.generic.template.ObjectPage.view.fragments.ImageDialog", {
								onImageDialogClose: function() {
									oImageDialog.close();
								}
							}, "headerImage");

						return oImageDialog;
					}
					
					// Begin: Filling the viewProxy with functions provided for the TemplateComponent to be called on the view
					
					oViewProxy.refreshFacets = function(mRefreshInfos, bForceRefresh) {
						var fnMyRefreshBlock = fnRefreshBlock.bind(null, mRefreshInfos, bForceRefresh);
						var fnRefreshSubSection = function(oSubSection){
							oSubSection.getBlocks().forEach(fnMyRefreshBlock);
							oSubSection.getMoreBlocks().forEach(fnMyRefreshBlock);							
						};
						oObjectPage.getSections().forEach(function(oSection){
							oSection.getSubSections().forEach(fnRefreshSubSection);
						});
					};
					
					oViewProxy.getHeaderInfoTitleForNavigationMenue = function(){
						var oPageHeader = oController.byId("objectPageHeader");
						var sTitle = oPageHeader.getProperty("objectTitle");
						
						var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
						var iViewLevel = oTemplatePrivateModel.getProperty("/generic/viewLevel");
						
						oTemplateUtils.oServices.oApplication.subTitleForViewLevelChanged(iViewLevel, sTitle);
					};
					
					oViewProxy.onComponentActivate = oBase.onComponentActivate;
					
					//Function is called if there is a draft document and the user navigate via bookmark to the active document
					oViewProxy.draftResume = function(oSiblingContext, oActiveEntity, oDraftAdministrativeData) {
						var oSiblingEntity = oSiblingContext.getObject();
						if (!oSiblingEntity || !oSiblingEntity.hasOwnProperty("IsActiveEntity") || oSiblingEntity.IsActiveEntity !== false) {
							return;
						}

						var oModel = oController.getView().getModel();
						var oMetaModel = oModel.getMetaModel();
						var oModelEntitySet = oMetaModel.getODataEntitySet(oController.getOwnerComponent().getEntitySet());
						var oDataEntityType = oMetaModel.getODataEntityType(oModelEntitySet.entityType);

						var sType = "";
						var sObjectKey = "";
						var aSemKey = oDataEntityType["com.sap.vocabularies.Common.v1.SemanticKey"];
						for (var i in aSemKey) {
							var oPropertyRef = aSemKey[i];
							if (sObjectKey === "") {
								sObjectKey = oActiveEntity[oPropertyRef.PropertyPath];
							} else {
								sObjectKey = sObjectKey + "-" + oActiveEntity[oPropertyRef.PropertyPath];
							}
						}

						var sChangedAt = "-";
						if (oDraftAdministrativeData && oDraftAdministrativeData.LastChangeDateTime !== null) {
							var oDateFormatter = DateFormat.getDateTimeInstance({
								pattern: "MMMM d, yyyy HH:mm",
								style: "long"
							});
							sChangedAt = oDateFormatter.format(oDraftAdministrativeData.LastChangeDateTime);
						}

						var aParams = [sType, sObjectKey, sChangedAt];
						var sDraftFoundText = oTemplateUtils.oCommonUtils.getText("DRAFT_FOUND_RESUME", aParams);

						var oDialogModel;
						var oResumeDialog = oTemplateUtils.oCommonUtils.getDialogFragment(
							"sap.suite.ui.generic.template.ObjectPage.view.fragments.DraftResumeDialog", {
								onDraftResume: function() {
									oResumeDialog.close();
									// Do not use variable oSiblingContext directly, because this will always be the instance used
									// at the first use of this fragment!
									oTemplateUtils.oServices.oNavigationController.navigateToContext(
										oDialogModel.getProperty("/siblingContext"), null, true);
								},
								onDraftDiscard: function() {
									oResumeDialog.close();
									// enable the buttons
									oController.getView().getModel("ui").setProperty("/enabled", true);
									// delete the draft node
									oTemplateUtils.oServices.oCRUDManager.deleteEntity(true);
									setLockButtonVisible(false);
									// Do not use variable oActiveEntity directly, because this will always be the instance used at
									// the first use of this fragment!
									oDialogModel.getProperty("/activeEntity").HasDraftEntity = false;
									// refresh the nodes
									oTemplateUtils.oServices.oViewDependencyHelper.setAllPagesDirty();
								},
								onResumeDialogClosed: function() {
									// support garbage collection
									oDialogModel.setProperty("/siblingContext", null);
									oDialogModel.setProperty("/activeEntity", null);
								}
							}, "Dialog");
						oDialogModel = oResumeDialog.getModel("Dialog");
						oDialogModel.setProperty("/draftResumeText", sDraftFoundText);
						oDialogModel.setProperty("/siblingContext", oSiblingContext);
						oDialogModel.setProperty("/activeEntity", oActiveEntity);
						oResumeDialog.open();
					};


					var mStrategiesForVisibilityChangeOfSubsection = {
						lazyLoading: function(bIsGettingVisible, oSubSection){
							// Call of setBindingContext with value null sets the current binding to inactive.
							// Call of setBindingContext with value undefined sets the current binding to active
							oSubSection.setBindingContext(bIsGettingVisible ? undefined : null);	
						},
						reuseComponent: function(bIsGettingVisible, oSubSection){
							var oComponentContainer = oSubSection.getBlocks()[0];
							oTemplateUtils.oComponentUtils.onVisibilityChangeOfReuseComponent(bIsGettingVisible, oComponentContainer);	
						}
					};
					
					function getStrategyForVisibilityChangeOfSubsection(oSubSection){
						var aCustomData = oSubSection.getCustomData();
						for (var i = 0; i < aCustomData.length; i++){
							var oCustomData = aCustomData[i];
							if (oCustomData.getProperty("key") === "strategyForVisibilityChange"){
								return mStrategiesForVisibilityChangeOfSubsection[oCustomData.getProperty("value")];
							}
						}
					}
			
					function fnHandleVisibilityChangeOfSubsection(bIsGettingVisible, oSubSection){
						var fnStrategy = getStrategyForVisibilityChangeOfSubsection(oSubSection);
						if (fnStrategy){
							if (bIsGettingVisible){
								var oHeaderDataAvailablePromise = oTemplateUtils.oComponentUtils.getHeaderDataAvailablePromise() || Promise.resolve();
								oHeaderDataAvailablePromise.then(function(){
									fnStrategy(true, oSubSection);
								});						
							} else {
								fnStrategy(false, oSubSection);	
							}
						}
					}
					
					function fnHandleVisibilityLossOfSubsection(oSubSection){
						fnHandleVisibilityChangeOfSubsection(false, oSubSection);					
					}
					
					function fnHandleVisibilityLossOfSection(oSection){
						oSection.getSubSections().forEach(fnHandleVisibilityLossOfSubsection);	
					}

					oViewProxy.beforeRebind = function(){
						oObjectPage.getSections().forEach(fnHandleVisibilityLossOfSection);
					};

					oViewProxy.afterRebind = function(){
						oObjectPage._triggerVisibleSubSectionsEvents();
					};
					
					// End: Filling the viewProxy with functions provided for the TemplateComponent to be called on the view.
					// Note that one last member is added to the viewProxy in onInit, since it is only available at this point in time.

					// Expose selected private functions to unit tests
					/* eslint-disable */
					var fnEditEntity = testableHelper.testable(fnEditEntity, "editEntity");
					var fnIsEntryDeletable = testableHelper.testable(fnIsEntryDeletable, "isEntryDeletable");
					var onActivateImpl = testableHelper.testable(onActivateImpl,"onActivateImpl");
					var onActivate = testableHelper.testable(onActivate,"onActivate");
					var fnOpenConfirmationDialog = testableHelper.testable(fnOpenConfirmationDialog,"fnOpenConfirmationDialog");
					/* eslint-enable */
								
					// Generation of Event Handlers
					var oControllerImplementation = {
						onInit: function() {
							oObjectPage = oController.byId("objectPage");													// there's at least one section left - create / bind breadcrumbs
							var oTitle = getObjectHeader();
							oViewProxy.aBreadCrumbs = oTitle && oTitle.getBreadCrumbsLinks();
							oBase.onInit();
							oTemplateUtils.oCommonUtils.executeGlobalSideEffect();
							oObjectPage.attachEvent("subSectionEnteredViewPort", function(oEvent) {
								var oSubSection = oEvent.getParameter("subSection");
								fnHandleVisibilityChangeOfSubsection(true, oSubSection);
							});
						},

						handlers: {
							addEntry: function(oEvent) {
								var oEventSource = oEvent.getSource();
								var oSmartTable = oTemplateUtils.oCommonUtils.getOwnerControl(oEventSource);
								var bSuppressNavigation = fnIsEventForTableWithInlineCreate(oSmartTable);

								if (!oEventSource.data("CrossNavigation") && bSuppressNavigation) {
									oTemplateUtils.oCommonEventHandlers.addEntry(oEventSource, true);
									return;
								}
								oTemplateUtils.oCommonUtils.processDataLossConfirmationIfNonDraft(function(){
									oTemplateUtils.oCommonEventHandlers.addEntry(oEventSource, false);
								}, jQuery.noop, oBase.state);
							},

							deleteEntries: fnDeleteEntries,

							onSelectionChange: function(oEvent) {
								oTemplateUtils.oCommonUtils.setEnabledToolbarButtons(oEvent.getSource());
							},

							//Cancel event is only triggered in non-draft scenario. For draft see onDiscardDraft
							// oEvent is passed to attach the DiscardPopover on Cancel button in case of NonDraft Applications
							onCancel: function(oEvent) {
								var sMode = "Proceed";
								var bNoBusyCheck; // Passed to processDataLossConfirmationIfNonDraft along with oEvent 
								if (oTemplateUtils.oComponentUtils.isNonDraftCreate() || !bIsObjectRoot){
									sMode = "LeavePage";
								}
								oTemplateUtils.oCommonUtils.processDataLossConfirmationIfNonDraft(function() {
									var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
									oTemplatePrivateModel.setProperty("/objectPage/displayMode", 1);
									if (oTemplateUtils.oComponentUtils.isNonDraftCreate()) {
										oViewProxy.setEditable(false);
									} else if (bIsObjectRoot){
										oViewProxy.setEditable(false);
									}
									if (oTemplateUtils.oComponentUtils.isNonDraftCreate() || !bIsObjectRoot) {
										oTemplateUtils.oServices.oNavigationController.navigateBack();
									}
								}, jQuery.noop, oBase.state, sMode, bNoBusyCheck, oEvent);
							},

							onContactDetails: function(oEvent) {
								oTemplateUtils.oCommonEventHandlers.onContactDetails(oEvent);
							},
							onPressDraftInfo: function(oEvent) {
								var oBindingContext = oController.getView().getBindingContext();
								var oLockButton = sap.ui.getCore().byId(
									oEvent.getSource().getId() + (oEvent.getId() === "markChangesPress" ? "-changes" : "-lock"));

								oTemplateUtils.oCommonUtils.showDraftPopover(oBindingContext, oLockButton);
							},
							onShareObjectPageActionButtonPress: onShareObjectPageActionButtonPress,
							onRelatedApps: function(oEvent) {
								var oButton, oURLParsing, oParsedUrl, oViewBindingContext, oAppComponent, oXApplNavigation, oLinksDeferred;
								var oActionSheet, oButtonsModel, oUshellContainer, sCurrentSemObj, sCurrentAction;
								oButton = oEvent.getSource();
								oUshellContainer = sap.ushell && sap.ushell.Container;
								oURLParsing = oUshellContainer && oUshellContainer.getService("URLParsing");
								oParsedUrl = oURLParsing.parseShellHash(
									document.location.hash);
								sCurrentSemObj = oParsedUrl.semanticObject;
								sCurrentAction = oParsedUrl.action;
								oViewBindingContext = oController.getView && oController.getView().getBindingContext();

								var oMetaModel = oController.getOwnerComponent().getModel().getMetaModel();

								var oEntity = oViewBindingContext.getObject();
								var sEntityType = oEntity.__metadata.type;
								var oDataEntityType = oMetaModel.getODataEntityType(sEntityType);
								var aSemKey = oDataEntityType["com.sap.vocabularies.Common.v1.SemanticKey"];
								var oParam = {};
								// var oSemKeyParam = {};
								if (aSemKey && aSemKey.length > 0) {
									for (var j = 0; j < aSemKey.length; j++) {
										var sSemKey = aSemKey[j].PropertyPath;
										if (!oParam[sSemKey]) {
											oParam[sSemKey] = [];
											oParam[sSemKey].push(oEntity[sSemKey]);
										}
									}
								} else {
									// Fallback if no SemanticKey
									for (var k in oDataEntityType.key.propertyRef) {
										var sObjKey = oDataEntityType.key.propertyRef[k].name;
										if (!oParam[sObjKey]) {
											oParam[sObjKey] = [];
											oParam[sObjKey].push(oEntity[sObjKey]);
										}
									}
								}

								oAppComponent = oController.getOwnerComponent().getAppComponent();
								oXApplNavigation = oUshellContainer && oUshellContainer.getService("CrossApplicationNavigation");

								oLinksDeferred = oXApplNavigation.getLinks({
									semanticObject: sCurrentSemObj,
									params: oParam,
									ui5Component: oAppComponent
								});

								oActionSheet = getRelatedAppsSheet();
								oButtonsModel = oActionSheet.getModel("buttons");
								oButtonsModel.setProperty("/buttons", []);
								oActionSheet.openBy(oButton);
								oLinksDeferred
									.done(function(aLinks) {
										var aButtons = [];
										// Sorting the related app links alphabetically to align with Navigation Popover in List Report - BCP(1770251716)
										aLinks.sort(function(oLink1, oLink2){
											if (oLink1.text < oLink2.text) {
                                                                                          return -1;
                                                                                        }
											if (oLink1.text > oLink2.text) {
                                                                                          return 1;
                                                                                        }
											return 0;
										});
										// filter current semanticObject-action
										for (var i = 0; i < aLinks.length; i++) {
											var oLink = aLinks[i];
											var sIntent = oLink.intent;
											var sAction = sIntent.split("-")[1].split("?")[0];
											if (sAction !== sCurrentAction) {
												aButtons.push({
													enabled: true, // used in declarative binding
													text: oLink.text, // used in declarative binding
													link: oLink, // used by the event handler
													param: oParam
													// used by the event handler
												});
											}
										}
										if (aButtons.length === 0) {
											aButtons.push({
												enabled: false, // used in declarative binding
												text: oTemplateUtils.oCommonUtils.getText("NO_RELATED_APPS")
												// used in declarative binding
											});
										}
										oButtonsModel.setProperty("/buttons", aButtons);
									});
							},
							onSemanticObjectLinkPopoverLinkPressed: function(oEvent) {
								oTemplateUtils.oCommonEventHandlers.onSemanticObjectLinkPopoverLinkPressed(oEvent, oBase.state);
							},

							onEdit: function(oEvent) {
								var oEventSource = oEvent.getSource();
								if (oEventSource.data("CrossNavigation")) {
									// intent based navigation
									oTemplateUtils.oCommonEventHandlers.onEditNavigateIntent(oEventSource);
									return;
								}
								bIsObjectRoot = true; // temporarily logic until we know how to decide this in onInit
								fnEditEntity();
							},
							// The event is only called in a non-draft scenario. For draft see onActivate
							onSave: function() {
								if (oTemplateUtils.oServices.oApplication.getBusyHelper().isBusy()){
									return; // this is again tested by the CRUDManager. But in order to suppress the AfterSave-Event in the busy case we also need to check this here.
								}
								var oCurrentContext = oController.getView().getBindingContext();
								var oPendingChanges =  oController.getView().getModel().getPendingChanges();
								oPendingChanges = oPendingChanges && oPendingChanges[oCurrentContext.getPath().replace("/", "")] || {};
								var aPendingChanges = Object.keys(oPendingChanges) || [];
								var bCreateMode = oTemplateUtils.oComponentUtils.isNonDraftCreate();
								/*	The OData model returns also a __metadata object with the canonical URL and further
									information. As we don't want to check if sideEffects are annotated for this
									property we remove it from the pending changes
								*/
								var iMetaDataIndex = aPendingChanges.indexOf("__metadata");
								if (iMetaDataIndex > -1){
									aPendingChanges.splice(iMetaDataIndex,1);
								}

								var oSaveEntityPromise = oTemplateUtils.oServices.oCRUDManager.saveEntity();
								oSaveEntityPromise.then(function(oContext) {
									var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
									oTemplatePrivateModel.setProperty("/objectPage/displayMode", 1);
									//	switch to display mode
									oViewProxy.setEditable(false);

									if (bCreateMode) {
										// in case of create mode navigate to new item
										if (oContext && oContext.getPath() !== "/undefined") {
											oTemplateUtils.oServices.oNavigationController.navigateToContext(oContext, undefined, true);
										} else {
											// fallback no context returned / correct path determined by transaction controller
											oTemplateUtils.oServices.oNavigationController.navigateBack();
										}
										oTemplateUtils.oServices.oApplication.showMessageToast(oTemplateUtils.oCommonUtils.getText("OBJECT_CREATED"));
									} else {
										oTemplateUtils.oServices.oApplication.showMessageToast(oTemplateUtils.oCommonUtils.getText("OBJECT_SAVED"));
										//for NON-Draft: navigate back after save if not root object
										if (!oTemplateUtils.oComponentUtils.isDraftEnabled() && !bIsObjectRoot) {
											oTemplateUtils.oServices.oNavigationController.navigateBack();
										}
									}
									if (aPendingChanges.length > 0){
										oTemplateUtils.oServices.oApplicationController.executeSideEffects(oCurrentContext, aPendingChanges);
									}
								});
								var oEvent = {
									saveEntityPromise: oSaveEntityPromise
								};
								oTemplateUtils.oComponentUtils.fire(oController, "AfterSave", oEvent);
							},
							onActivate: onActivate,
							onSmartFieldUrlPressed: function(oEvent) {
								oTemplateUtils.oCommonEventHandlers.onSmartFieldUrlPressed(oEvent, oBase.state);
							},
							onBreadCrumbUrlPressed: function(oEvent) {
								oTemplateUtils.oCommonEventHandlers.onBreadCrumbUrlPressed(oEvent, oBase.state);
							},
							onDiscardDraft: function(oEvent) {
								oTemplateUtils.oCommonEventHandlers.onDiscardDraft(oEvent);
							},
							onDelete: onDelete         ,
							onCallActionFromToolBar: function (oEvent) {
								oTemplateUtils.oCommonEventHandlers.onCallActionFromToolBar(oEvent, oBase.state);
							},
							onCallAction: function(oEvent) {
								var oComponent = oController.getOwnerComponent();
								var sNavigationProperty = oComponent.getNavigationProperty();
								var oCustomData = oTemplateUtils.oCommonUtils.getCustomData(oEvent);
								var aContext = [];
								aContext.push(oController.getView().getBindingContext());
								if (aContext[0] && oCustomData.Type === "com.sap.vocabularies.UI.v1.DataFieldForAction") {
									//var oEventSource = oEvent.getSource();
									oTemplateUtils.oCommonUtils.processDataLossConfirmationIfNonDraft(function() {
										var mParameters = {
											functionImportPath: oCustomData.Action,
											contexts: aContext,
											sourceControl: "",
											label: oCustomData.Label,
											operationGrouping: oCustomData.InvocationGrouping,
											navigationProperty: oController.getOwnerComponent().getNavigationProperty()
										};
										oTemplateUtils.oServices.oCRUDManager.callAction(mParameters).then(function(aResponses){
											var oResponse = aResponses && aResponses[0];
											if (oResponse && oResponse.response && oResponse.response.context && (!oResponse.actionContext || oResponse.actionContext && oResponse.response.context.getPath() !== oResponse.actionContext.getPath())){
												// set my parent page to dirty
												oTemplateUtils.oServices.oViewDependencyHelper.setParentToDirty(oComponent, sNavigationProperty, 1);
											}
										});
									}, jQuery.noop, oBase.state, "Proceed");
								}
							},
							onDataFieldForIntentBasedNavigation: function(oEvent) {
								oTemplateUtils.oCommonEventHandlers.onDataFieldForIntentBasedNavigation(oEvent,oBase.state);
							},
							onDataFieldWithIntentBasedNavigation: function(oEvent) {
								oTemplateUtils.oCommonEventHandlers.onDataFieldWithIntentBasedNavigation(oEvent, oBase.state);
							},
							onDataFieldWithNavigationPath: function(oEvent) {
								oTemplateUtils.oCommonEventHandlers.onDataFieldWithNavigationPath(oEvent);
							},
							onChartInit: function (oEvent) {
								var oChart = oEvent.getSource().getChart();
								var fnOnSelectionChange = oController._templateEventHandlers.onSelectionChange;
								oChart.attachSelectData(fnOnSelectionChange).attachDeselectData(fnOnSelectionChange);
								var oSmartChart = oChart.getParent();
								oTemplateUtils.oCommonUtils.checkToolbarIntentsSupported(oSmartChart);
							},
							onDataReceived: function(oEvent){
								oTemplateUtils.oCommonEventHandlers.onDataReceived(oEvent);
							},
							onBeforeRebindDetailTable: function(oEvent) {
								oTemplateUtils.oCommonEventHandlers.onBeforeRebindTable(oEvent);
								oController.onBeforeRebindTableExtension(oEvent);
								fnAdaptBindingParamsForInlineCreate(oEvent);
								if (oTemplateUtils.oCommonUtils.isAnalyticalTable(oEvent.getSource().getTable())) {
									var oBindingParams = oEvent.getParameter("bindingParams");
									oBindingParams.parameters.entitySet = oEvent.getSource().getEntitySet();
								}
							},
							onShowDetails: function(oEvent) {
								oTemplateUtils.oCommonEventHandlers.onShowDetails(oEvent.getSource(), oBase.state);
							},
							onListNavigate: function(oEvent) {
								if (!oController.onListNavigationExtension(oEvent)){
								oTemplateUtils.oCommonEventHandlers.onListNavigate(oEvent.getSource(), oBase.state);
								}
							},
							onBeforeSemanticObjectLinkPopoverOpens: function(oEvent) {
								var oEventParameters = oEvent.getParameters();
								oTemplateUtils.oCommonUtils.processDataLossConfirmationIfNonDraft(function(){
									//Success function
									var sSelectionVariant = getSelectionVariant();
									oTemplateUtils.oCommonUtils.semanticObjectLinkNavigation(oEventParameters, sSelectionVariant, oController);
								}, jQuery.noop, oBase.state, jQuery.noop);
							},
							
							onSemanticObjectLinkNavigationPressed : function(oEvent) {
								var oEventParameters = oEvent.getParameters();
								var oEventSource = oEvent.getSource();
								oTemplateUtils.oCommonEventHandlers.onSemanticObjectLinkNavigationPressed(oEventSource, oEventParameters);
							},
							
							onSemanticObjectLinkNavigationTargetObtained : function(oEvent) {
								var oEventParameters = oEvent.getParameters();
								var oEventSource = oEvent.getSource(); //set on semanticObjectController
								oTemplateUtils.oCommonEventHandlers.onSemanticObjectLinkNavigationTargetObtained(oEventSource, oEventParameters, oBase.state);
								//fnOnSemanticObjectLinkNavigationTargetObtained(oEvent);
							},
							onSemanticObjectLinkNavigationTargetObtainedSmartLink : function(oEvent) {
								var oEventParameters, oEventSource;
								oEventParameters = oEvent.getParameters();
								oEventSource = oEvent.getSource(); //set on smart link
								oEventSource = oEventSource.getParent().getParent().getParent().getParent(); //set on smart table
								oTemplateUtils.oCommonEventHandlers.onSemanticObjectLinkNavigationTargetObtained(oEventSource, oEventParameters, oBase.state);
							},
							onHeaderImagePress: function(oEvent) {
								var oImageDialog = getImageDialog();
								var sId = oEvent.getSource().getId();
								oImageDialog.addAriaLabelledBy(sId);
								var oImageDialogModel = oImageDialog.getModel("headerImage");
								oImageDialogModel.setProperty("/src", oEvent.getSource().getSrc());
								if (sap.ui.Device.system.phone) {
									oImageDialog.setProperty("stretch", true);
								}
								oImageDialog.open();
							},
							onInlineDataFieldForAction: function(oEvent) {
								oTemplateUtils.oCommonEventHandlers.onInlineDataFieldForAction(oEvent,oBase.state);
							},
							onInlineDataFieldForIntentBasedNavigation: function(oEvent) {
								oTemplateUtils.oCommonEventHandlers.onInlineDataFieldForIntentBasedNavigation(oEvent.getSource(), oBase.state);
							},
							onDeterminingDataFieldForAction: function(oEvent) {
								oTemplateUtils.oCommonEventHandlers.onDeterminingDataFieldForAction(oEvent);
							},
							onBeforeRebindChart: function(oEvent) {
								var oSmartChart = oEvent.getSource();
								oSmartChart.oModels = oSmartChart.getChart().oPropagatedProperties.oModels;
							},
							onTableInit: function(oEvent) {
								var oSmartTable = oEvent.getSource();
								var oTable = oSmartTable.getTable();

								oTemplateUtils.oCommonUtils.checkToolbarIntentsSupported(oSmartTable);
								oSmartTable.attachModelContextChange(function() {
									if (oSmartTable.getCustomToolbar && oSmartTable.getCustomToolbar().getContent){
										var oContents = oSmartTable.getCustomToolbar().getContent();
										for (var i in oContents){
											if (oContents[i].getShowSearchButton){
												oContents[i].setValue("");
												oSmartTable.rebindTable();
												break;
											}
										}
									}
								});
								// CTRL + ENTER Shortcut to add an entry for tables with inline support.
								if (fnIsEventForTableWithInlineCreate(oSmartTable) && !oSmartTable.data("CrossNavigation")) {
									oTable.addEventDelegate({
										onkeyup: function(oEvent) {
											if (oEvent.ctrlKey && oEvent.keyCode == jQuery.sap.KeyCodes.ENTER && oSmartTable.getEditable()) {
												oTemplateUtils.oCommonEventHandlers.addEntry(oSmartTable, true);
												oEvent.preventDefault();
												oEvent.setMarked();
											}
										}
									});
								}
							},
							onSearchObjectPage: function (oEvent) {
								var oSmartTable = (oEvent.getSource().getParent()).getParent();
								oSmartTable.data("searchString", oEvent.getSource().getValue());
								oSmartTable.data("allowSearch", true);
								oSmartTable.data("tableId", oSmartTable.getId());
								oSmartTable.data("objectPath", oSmartTable.getBindingContext().getPath());
// check whether oCommonUtils.refreshSmartTable has to called instead or additionally
								oSmartTable.rebindTable();
							}
						},
						formatters: {
							formatDefaultObjectTitle: function(bCreateMode, sHeaderInfoTitle) {
								// return DefaultTitle in createMode
								if (sHeaderInfoTitle || !bCreateMode) {
									return;
								}
								var oContext = oController.getView().getBindingContext();
								var oObject = oContext && oContext.getObject();
								if (bCreateMode && oObject && (oObject.IsActiveEntity === undefined || oObject.IsActiveEntity === false || oObject.HasActiveEntity ===
									false)) {
									return getDefaultObjectTitleForCreated();
								}
							},

							// Sets custom noData text for smart table if provided by developer,
							// else returns "", which will load default noData text by SmartTable
							setNoDataTextForSmartTable: function() {
								var oResourceBundle = oController.getOwnerComponent() && oController.getOwnerComponent().getModel("i18n") && oController.getOwnerComponent().getModel("i18n").getResourceBundle();
								if (oResourceBundle && oResourceBundle.getText("NOITEMS_SMARTTABLE") !== "NOITEMS_SMARTTABLE") {
									return oResourceBundle.getText("NOITEMS_SMARTTABLE");
									} else {
										var oAppComponent = oController.getOwnerComponent().getAppComponent();
										oResourceBundle = oAppComponent && oAppComponent.getModel("i18n") && oAppComponent.getModel("i18n").getResourceBundle();
										if (oResourceBundle && oResourceBundle.hasText("NOITEMS_SMARTTABLE")) {
											return oResourceBundle.getText("NOITEMS_SMARTTABLE");
										} else {
											return "";
										}
									}
							}
						},
						extensionAPI: new ExtensionAPI(oTemplateUtils, oController, oBase)
					};
					
					oControllerImplementation.handlers = jQuery.extend(oBase.handlers, oControllerImplementation.handlers);
					
					return oControllerImplementation;
				}
			};
		});