sap.ui.define(["jquery.sap.global", "sap/ui/core/routing/HashChanger", "sap/suite/ui/generic/template/extensionAPI/NavigationController",
	"sap/suite/ui/generic/template/lib/MessageButtonHelper", "sap/suite/ui/generic/template/lib/testableHelper", "sap/suite/ui/generic/template/detailTemplates/PaginatorButtonsHelper",
		"sap/suite/ui/generic/template/ObjectPage/extensionAPI/DraftTransactionController", "sap/suite/ui/generic/template/ObjectPage/extensionAPI/NonDraftTransactionController",	
	"sap/m/DraftIndicator"], 
	function(jQuery, HashChanger, NavigationController, MessageButtonHelper, testableHelper, PaginatorButtonsHelper, DraftTransactionController, NonDraftTransactionController) {
		"use strict";
		
		var DraftIndicatorState = sap.m.DraftIndicatorState; // namespace cannot be imported by sap.ui.define
		
		function getComponentBase(oComponent, oComponentUtils, oViewProxy){
			function init(){
				var oTemplatePrivateModel = oComponentUtils.getTemplatePrivateModel();
				oTemplatePrivateModel.setProperty("/objectPage", {
					displayMode: 0 // 0 = unknown, 1 = display, 2 = edit, 4 = add, 6 = change (edit or add)
				});
			}
			
			function onActivate(sBindingPath) {
				// preliminary: in draft case maybe on first time property is not set
				var oUIModel = oComponent.getModel("ui");
				var oTemplatePrivateModel = oComponentUtils.getTemplatePrivateModel();
				if (oComponentUtils.getEditableNDC()) {
					oUIModel.setProperty("/editable", true);
					var bCreateMode = oComponentUtils.isNonDraftCreate();
					oUIModel.setProperty("/createMode", bCreateMode);
					oTemplatePrivateModel.setProperty("/objectPage/displayMode", bCreateMode ? 4 : 2);
				} else if (!oComponentUtils.isDraftEnabled()) {
					oUIModel.setProperty("/editable", false);
					oUIModel.setProperty("/createMode", false);
					oTemplatePrivateModel.setProperty("/objectPage/displayMode", 1);
				}
				(oViewProxy.onComponentActivate || jQuery.noop)(sBindingPath);
			}
			
			// This method is called when a new binding context has been retrieved for this Component.
			// If the entity is draft enabled this happens whenever a different instance is displayed or the edit status changes.
			// If the entity is not draft enabled this only happens when a different instance is displayed.
			// It does not happen when changing to edit mode or creating a new instance. In this case the adjustment of the JSON models is already done in onActivate.
			function updateBindingContext() {

				var oBindingContext = oComponent.getBindingContext();
				var oContextInfo = oComponentUtils.registerContext(oBindingContext);
				// set draft status to blank according to UI decision
				var oTemplatePrivateGlobal = oComponent.getModel("_templPrivGlobal");
				oTemplatePrivateGlobal.setProperty("/generic/draftIndicatorState", DraftIndicatorState.Clear);

				//call the rebindTable explicitly since the smart table enableAutoBinding=true 
				//didn't trigger GET of 1:n all cases
				(oViewProxy.refreshFacets || jQuery.noop)(null, true);
				
				(oViewProxy.getHeaderInfoTitleForNavigationMenue || jQuery.noop)();
				
				var oActiveEntity = oBindingContext.getObject();
				var oUIModel = oComponent.getModel("ui");
				var bIsEditable;
				var oTemplatePrivateModel = oComponentUtils.getTemplatePrivateModel();
				if (oContextInfo.bIsDraft) {
					bIsEditable = true;
					oUIModel.setProperty("/enabled", true);
					oTemplatePrivateModel.setProperty("/objectPage/displayMode", oContextInfo.bIsCreate ? 4 : 2);
				} else {
					bIsEditable = oComponentUtils.getEditableNDC();
					oTemplatePrivateModel.setProperty("/objectPage/displayMode", bIsEditable ? 2 : 1);
					if (oActiveEntity.hasOwnProperty("HasDraftEntity") && oActiveEntity.HasDraftEntity) {
						oUIModel.setProperty("/enabled", false);
						var oModel = oComponent.getModel();
						var oReadDraftInfoPromise = new Promise(function(fnResolve, fnReject) {
							oModel.read(
								oBindingContext.getPath(), {
									urlParameters: {
										"$expand": "SiblingEntity,DraftAdministrativeData"
									},
									success: fnResolve,
									error: fnReject
								});
						});
						var oBusyHelper = oComponentUtils.getBusyHelper();
						oBusyHelper.setBusy(oReadDraftInfoPromise);
						oReadDraftInfoPromise.then(
							function(oResponseData) {
								var oSiblingContext = oModel.getContext(
									"/" + oModel.getKey(oResponseData.SiblingEntity));
								if (oSiblingContext) {
									(oViewProxy.draftResume || jQuery.noop)(oSiblingContext, oActiveEntity,
										oResponseData.DraftAdministrativeData);
								}
								// enable the buttons
								oUIModel.setProperty("/enabled", true);
							},
							function(oError) {
								// open: error handling
							}
						);
					} else {
						// enable the buttons
						oUIModel.setProperty("/enabled", true);
					}
				}
				oUIModel.setProperty("/createMode", oContextInfo.bIsCreate);
				oUIModel.setProperty("/editable", bIsEditable);
			}
			
			// This method is called by the framework, when some saving action has been observed. In this case it returns the context path for the
			// current draft root (if we are in draft mode).  This will cause this draft to be marked as modified.
			function fnCurrentDraftModified(){
				return oComponentUtils.getDraftRootPath();
			}
			
			function fnNavigateUp(){
				oViewProxy.navigateUp();	
			}
			
			return {
				init: init,
				onActivate: onActivate,
				getTitle: oComponentUtils.getTitleFromTreeNode,
				updateBindingContext: updateBindingContext,
				currentDraftModified: fnCurrentDraftModified,
				navigateUp: fnNavigateUp
			};
			
		}
		
		function getControllerBase(oViewProxy, oTemplateUtils, oController){
			
			var oControllerBase;
			var aEntitySets; // initialized in onInit
			var sLinkUp;
			
			var oPaginatorButtonsHelper; // initialized in onInit, if needed
			
			var oHashChanger; // initialized on first use
			function fnGetHashChangerInstance() {
				return oHashChanger || HashChanger.getInstance();
			}
			
			function fnCreateBreadCrumbLinkHandler(j, oMyLink){
				return function(){
					oTemplateUtils.oServices.oApplication.subTitleForViewLevelChanged(j, oMyLink.getText());
				};
			}
			
			// this method is called, when the editablity status is changed
			function setEditable(bIsEditable) {
				var bIsNonDraft = !oTemplateUtils.oComponentUtils.isDraftEnabled();
				// Setting editable to false is done immidiately
				// Setting editable to true is (in draft case) postponed until the header data are read (method updateBindingContext).
				if (bIsNonDraft || !bIsEditable){
					var oUIModel = oController.getView().getModel("ui");
					oUIModel.setProperty("/editable", bIsEditable);
				}
				if (bIsNonDraft) {
					oTemplateUtils.oComponentUtils.setEditableNDC(bIsEditable);
				}
			}
			
			function fnOnBack() {
				oTemplateUtils.oCommonUtils.processDataLossConfirmationIfNonDraft(function() {
					// only for Non-Draft the editable must be set to false
					var bIsDraft = oTemplateUtils.oComponentUtils.isDraftEnabled();
					if (!bIsDraft){
						setEditable(false);
					}
					oTemplateUtils.oServices.oNavigationController.navigateBack();
				}, jQuery.noop, oControllerBase.state);
			}
			
			function fnAdaptLinksToUpperLevels(){
				var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
				var iUpLinksCount = oTemplatePrivateModel.getProperty("/generic/viewLevel") - 1;
				var aSections = iUpLinksCount ? oTemplateUtils.oServices.oApplication.getHierarchySectionsFromCurrentHash() : [];
				// there's at least one section left - create / bind breadcrumbs
				var aBreadCrumbs = oViewProxy.aBreadCrumbs;
				oHashChanger = fnGetHashChangerInstance();

				sLinkUp = "";
				var sDelimiter = "";
				for (var i = 0; i < iUpLinksCount; i++) {
					var sSection = aSections[i];
					sLinkUp = sLinkUp + sDelimiter + sSection;
					sDelimiter = "/";
					/*
					 * we don't use the navigation path but the canonical URL. The reason for this is that there's no
					 * join done in the backend, therefore the GET-request is much faster in deeper breadcrumbs. Also
					 * the UI5 Odata model keeps track of already requested ressources, so if user navigates from the
					 * top level there's no additional request, if he uses a bookmark the request is only done once. We
					 * assume that the key of the navigation path is the same as the canonical URL. This is an
					 * assumption that does not fit to all ODATA services (but 99% of them) - BUT: Smart Templates and
					 * the navigation controller already takes this assumption. Once this is changed also this coding
					 * needs to be changed. Ideally with a configuration as most of the ODATA services have a big
					 * benefit through reading with the canonical URL
					 */
					var sEntitySet = aEntitySets[i];
					var aSubSections = sSection.split("(");
					if (aSubSections && aSubSections[1]) {
						var oLink = aBreadCrumbs && aBreadCrumbs[i];
						if (oLink){
							var sHash = oHashChanger.hrefForAppSpecificHash ? oHashChanger.hrefForAppSpecificHash(sLinkUp) : "#/" + sLinkUp;
							sHash = oTemplateUtils.oServices.oApplication.adaptBreadCrumbUrl(sHash, i + 1);
							var sCanonicalUrl = "/" + sEntitySet + "(" + aSubSections[1];
							oLink.setHref(sHash);
							oLink.bindElement({
								path: sCanonicalUrl,
								events: {
									change: fnCreateBreadCrumbLinkHandler(i + 1, oLink)
								}
							});
						}
					}
				}
			}			
			
			function getApplyChangesPromise(oControl){
				var oContext = oControl.getBindingContext();
				var sHash = fnGetHashChangerInstance().getHash();
				return oTemplateUtils.oServices.oApplicationController.propertyChanged(sHash, oContext);
			}
			
			function fnNavigateUp(){
				if (sLinkUp){
					oTemplateUtils.oServices.oNavigationController.navigateToContext(sLinkUp, "", true);
				} else {
					oTemplateUtils.oServices.oNavigationController.navigateToRoot(true);
				}
			}
			
			// Event handler for the Apply button. Only visible in draft scenarios and not on the object root.
			function fnApplyAndUp(oEvent) {
				var oControl = oEvent.getSource();
				oTemplateUtils.oServices.oApplication.performAfterSideEffectExecution(function(){
					var oBusyHelper = oTemplateUtils.oServices.oApplication.getBusyHelper();
					if (oBusyHelper.isBusy()){
						return; // Ignore the button if something is already running
					}
					var oUIModel = oController.getView().getModel("ui");
					var oTemplatePrivateGlobalModel = oController.getOwnerComponent().getModel("_templPrivGlobal");
					var oApplyPromise = getApplyChangesPromise(oControl).then(function(oReponse){
						if (!oControllerBase.fclInfo.isContainedInFCL || oTemplatePrivateGlobalModel.getProperty("/generic/FCL/isVisuallyFullScreen")){
							fnNavigateUp();
						}
						//the toast is shown independent of FCL
						//the next statement should not be deleted but a comment!!
//						oTemplateUtils.oServices.oApplication.showMessageToast(oTemplateUtils.oCommonUtils.getText("ST_CHANGES_APPLIED"));
					}, function(){
						oBusyHelper.getUnbusy().then(function(oReponse){
							if (!oControllerBase.fclInfo.isContainedInFCL || oTemplatePrivateGlobalModel.getProperty("/generic/FCL/isVisuallyFullScreen")) {
								oTemplateUtils.oCommonUtils.processDataLossTechnicalErrorConfirmation(function() {
									fnNavigateUp();
									oUIModel.setProperty("/enabled", true); //in case you leave the page set this
								}, jQuery.noop, oControllerBase.state);
							} else {
							//if the UI show FCL, one object next to the other, then another popup is needed						
							oTemplateUtils.oCommonUtils.processDataLossTechnicalErrorConfirmation(jQuery.noop, jQuery.noop, oControllerBase.state, "StayOnPage");
							}
						});
					});
					oBusyHelper.setBusy(oApplyPromise);
				});
			}
			
			function onShowMessages() {
				oControllerBase.state.messageButtonHelper.toggleMessagePopover();
			}
			
			function getNavigationControllerFunction(){
				var oNavigationController;
				return function(){
					oNavigationController = oNavigationController || new NavigationController(oTemplateUtils, oController, oControllerBase.state);
					return oNavigationController;
				};
			}
			
			function getTransactionControllerFunction() {
				var oTransactionController;
				return function(){
					if (!oTransactionController) {
						var Class = oTemplateUtils.oComponentUtils.isDraftEnabled() ? DraftTransactionController : NonDraftTransactionController;
						oTransactionController = new Class(oTemplateUtils, oController, oControllerBase.state);
					}
					return oTransactionController;
				};
			}
			
			function handleShowNextObject(){
				oPaginatorButtonsHelper.handleShowNextObject();
			}
			
			function handleShowPrevObject(){
				oPaginatorButtonsHelper.handleShowPrevObject();
			}
			
			// Expose selected private functions to unit tests
			/* eslint-disable */
			var fnGetHashChangerInstance = testableHelper.testable(fnGetHashChangerInstance, "getHashChangerInstance");
			var fnAdaptLinksToUpperLevels = testableHelper.testable(fnAdaptLinksToUpperLevels, "adaptLinksToUpperLevels");
			/* eslint-enable */
			
			oControllerBase = {
				onInit: function(oRequiredControls){
					aEntitySets = oTemplateUtils.oServices.oApplication.getSections(oController.getOwnerComponent().getEntitySet(), true);
					if (!oRequiredControls || oRequiredControls.footerBar){
						var bIsODataBased = oTemplateUtils.oComponentUtils.isODataBased();
						oControllerBase.state.messageButtonHelper = new MessageButtonHelper(oTemplateUtils.oCommonUtils, oController, bIsODataBased);
						oTemplateUtils.oServices.oTemplateCapabilities.oMessageButtonHelper = oControllerBase.state.messageButtonHelper;
					}
					if (!oRequiredControls || oRequiredControls.paginatorButtons){
						oPaginatorButtonsHelper = new PaginatorButtonsHelper(oControllerBase, oController, oTemplateUtils);
					}
				},
				handlers: {
					handleShowNextObject: handleShowNextObject,
					handleShowPrevObject: handleShowPrevObject,
					onShowMessages: onShowMessages,
					applyAndUp: fnApplyAndUp,
					onBack: fnOnBack
				},
				extensionAPI: {
					getNavigationControllerFunction: getNavigationControllerFunction,
					getTransactionControllerFunction: getTransactionControllerFunction
				},
				fclInfo: {
					isContainedInFCL: false	
				},
				state: {},
				onComponentActivate: function(sBindingPath){
					if (oControllerBase.state.messageButtonHelper){
						oControllerBase.state.messageButtonHelper.adaptToContext(sBindingPath);
					}
					oTemplateUtils.oComponentUtils.setBackNavigation(fnOnBack);
					fnAdaptLinksToUpperLevels();
					// set visibility of up/down buttons
					if (oPaginatorButtonsHelper){
                        oPaginatorButtonsHelper.computeAndSetVisibleParamsForNavigationBtns();
					}
				}
			};
			
			oViewProxy.navigateUp = fnNavigateUp;
			oViewProxy.setEditable = setEditable;
			
			var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
			var iViewLevel = oTemplatePrivateModel.getProperty("/generic/viewLevel");
			var oFclProxy = oTemplateUtils.oServices.oApplication.getFclProxyForView(iViewLevel);
			if (oFclProxy.oActionButtonHandlers){
				oControllerBase.handlers.fclActionButtonHandlers = oFclProxy.oActionButtonHandlers;
				oControllerBase.fclInfo.isContainedInFCL = true;
			}
			oControllerBase.fclInfo.navigateToDraft = oFclProxy.navigateToDraft;
			
			return oControllerBase;
		}
		
		return {
			getComponentBase: getComponentBase,
			getControllerBase: getControllerBase
		};
	});