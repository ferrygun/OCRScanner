sap.ui.define(["jquery.sap.global", "sap/ui/base/Object"], function(jQuery, BaseObject) {
	"use strict";

	var CONTEXT_FAILED = {};  // constant indicating that reading failed
	
	function getMethods(oComponent, oComponentRegistryEntry) {

		// This promise if resolved when the element binding for the header data have been read. Note that the promise
		// stored in this variable is replaced each time the function fnRebindHeaderData is called.
		// Thus, the promise allways represents the loading of the currently relevant header data.
		var oHeaderDataAvailablePromise;
		var fnHeaderDataAvailableResolve = null; // function to resolve the promise (or null if it is resolved)
		
		var oContextToAdaptTo;  // a context for an element binding that is still waiting to be analyzed

		var fnBusyResolve;
		var bIsDataLoading = false;
		
		var aCurrentKeys = [];

		// Registry for the event handling facility (see fnAttach, fnDetach, and fnFire)
		var aEventHandlerRegistry = [];
		
		// Check whether this binding path represents a transient context. In our scenario this means that we
		// are in a create scenario for a non-draft entity.
		function isNonDraftCreate(sBindingPath) {
			var oEntity;
			var oModel = oComponent.getModel();
			if (sBindingPath) {
				if (oModel) {
					oEntity = oModel.getProperty(sBindingPath);
				}
			} else {
				var oContext = oComponent.getBindingContext();
				if (oContext) {
					oEntity = oContext.getObject();
				}
			}

			// workaround until ODataModel provides method
			return !!(oEntity && oEntity.__metadata && oEntity.__metadata.created);
		}
		
		function getTemplatePrivateModel() {
			return oComponent.getModel("_templPriv");
		}
		
		function getViewLevel(){
			return getTemplatePrivateModel().getProperty("/generic/viewLevel");
		}
		
		function getPreprocessorsData(){
			return oComponentRegistryEntry.preprocessorsData;	
		}
		
		function getParameterModelForTemplating(){
			return oComponentRegistryEntry.oParameterModel; // prepared by method createXMLView() in TemplateComponent
		}
		
		function getODataLoadFailedTexts() {
			var oRB = oComponent.getModel("i18n").getResourceBundle();
			return {
				dataLoadFailedTitle: oRB.getText("ST_ERROR"),
				dataLoadFailedText: oRB.getText("ST_GENERIC_ERROR_LOAD_DATA_TEXT")
			};
		}

		function fnAttach(sTemplate, sEvent, fnFunction) {
			if (typeof fnFunction !== "function") {
				throw new Error("Event handler must be a function");
			}
			aEventHandlerRegistry.push({
				template: sTemplate,
				event: sEvent,
				handler: fnFunction
			});
		}

		function fnDetach(sTemplate, sEvent, fnFunction) {
			for (var i = aEventHandlerRegistry.length; i--; ) {
				if (aEventHandlerRegistry[i].handler === fnFunction && aEventHandlerRegistry[i].event === sEvent && aEventHandlerRegistry[i].template ===
					sTemplate) {
					aEventHandlerRegistry.splice(i, 1);
				}
			}
		}

		function fnFire(sTemplate, sEvent, oEvent) {
			for (var i = 0; i < aEventHandlerRegistry.length; i++) {
				if (aEventHandlerRegistry[i].event === sEvent && aEventHandlerRegistry[i].template === sTemplate) {
					aEventHandlerRegistry[i].handler(oEvent);
				}
			}
		}

		function getTemplateName(oController) {
			return oController.getMetadata().getName();
		}
		
		function isComponentActive(){
			return oComponentRegistryEntry.oApplication.isComponentActive(oComponent);	
		}

		function fnPageDataLoadedOnNavigation(oContext, bCallReuseCallbacks){
			var oNavigationFinishedPromise = oComponentRegistryEntry.oNavigationObserver.getProcessFinished(true);                                 
			oNavigationFinishedPromise.then(function() {
				if (isComponentActive()){
					if (bCallReuseCallbacks){
						fnCallReuseCallbacks(true);	
					}
					fnFire(getTemplateName(oComponentRegistryEntry.oController), "PageDataLoaded", {
						context: oContext
					});
				}
			});			
		}
		
		function fnPreparePageDataLoaded() {
			oHeaderDataAvailablePromise.then(function(oContext) {
				if (oContext) {
					fnPageDataLoadedOnNavigation(oContext);
				}
			});
		}
		
		function fnStartBusy(){
			oComponentRegistryEntry.oHeaderLoadingObserver.startProcess();
			if (!fnBusyResolve){
				var oBusyPromise = new Promise(function(fnResolve){
					fnBusyResolve = fnResolve;	
				});
				oComponentRegistryEntry.oApplication.getBusyHelper().setBusy(oBusyPromise);
			}			
		}

		function fnDataRequested() {
			bIsDataLoading = true;
			if (!fnHeaderDataAvailableResolve) { // the current HeaderDataAvailablePromise was already resoled -> create a new one
				oHeaderDataAvailablePromise = new Promise(function(fnResolve) {
					fnHeaderDataAvailableResolve = fnResolve;
				});
			}
			if (!oComponent.getComponentContainer().getElementBinding().isSuspended()) {
				fnStartBusy();
			}
		}

		function fnEndBusy(){
			if (fnBusyResolve){
				fnBusyResolve();
				fnBusyResolve = null;
			}
			oComponentRegistryEntry.oHeaderLoadingObserver.stopProcess();
		}
		
		function getReadContext(oEvent){
			var oRet = oEvent.getSource().getBoundContext();
			if (oRet) {
				return oRet;
			}
			if (oComponent.getComponentContainer().getElementBinding().isSuspended()) {
				oRet = null;
			} else {
				oRet = CONTEXT_FAILED;
			}
			fnUnbind();
			fnEndBusy();
			return oRet; 
		}
		
		function fnNavigateToDataLoadedFailedPage(){
			var oDataLoadFailedTexts = getODataLoadFailedTexts();
			var oNavigationController = oComponent.getAppComponent().getNavigationController();
			oNavigationController.navigateToMessagePage({
				title: oDataLoadFailedTexts.dataLoadFailedTitle,
				text: oDataLoadFailedTexts.dataLoadFailedText,
				description: "",
				viewLevel: getViewLevel()
			});
		}
		
		function fnAdaptToContext(){
			bIsDataLoading = false;
			if (!oContextToAdaptTo){
				return;
			}
			if (oContextToAdaptTo === CONTEXT_FAILED){
				fnNavigateToDataLoadedFailedPage();
			} else if (!oComponent.getComponentContainer().getElementBinding().isSuspended()) {
				if (fnHeaderDataAvailableResolve) {
					fnHeaderDataAvailableResolve(oContextToAdaptTo);
				}
				(oComponentRegistryEntry.methods.updateBindingContext || jQuery.noop)();
			} else {
				return;
			}
			fnHeaderDataAvailableResolve = null;
			oContextToAdaptTo = null;
		}
		
		function fnDataReceived(oEvent){
			fnEndBusy();
			if (bIsDataLoading){ // otherwise this has already been handled by the Change-Handler
				oContextToAdaptTo = getReadContext(oEvent);	
			}
			fnAdaptToContext();
		}

		function fnChange(oEvent) {
			oContextToAdaptTo = getReadContext(oEvent);
			fnAdaptToContext();
			oComponentRegistryEntry.oHeaderLoadingObserver.stopProcess();
		}

		// Note: This method is called by fnBindComponent only.
		// Therefore it is ensured, that oComponentRegistryEntry.viewRegisterd is already resolved, when this method is called.
		function fnRebindHeaderData(sBindingPath) {
			var oParameter = {};
			var oPreprocessorsData = getPreprocessorsData();
			if (oPreprocessorsData.rootContextExpand && oPreprocessorsData.rootContextExpand.length) {
				oParameter.expand = oPreprocessorsData.rootContextExpand.join(",");
			}
			oComponentRegistryEntry.oHeaderLoadingObserver.startProcess();
			//In case the component needs to prepare anything
			if (oComponentRegistryEntry.methods.beforeRebind) {
				oComponentRegistryEntry.methods.beforeRebind();
			}			
			oHeaderDataAvailablePromise = new Promise(function(fnResolve) {
				oContextToAdaptTo = null;
				fnHeaderDataAvailableResolve = fnResolve;
				oComponent.getComponentContainer().bindElement({
					path: sBindingPath,
					events: {
						dataRequested: fnDataRequested,
						dataReceived: fnDataReceived,
						change: fnChange
					},
					parameters: oParameter,
					batchGroupId: "Changes", // get navigation controller constant?
					changeSetId: "Changes"
				});
			});
			//In case the component needs to reset anything
			if (oComponentRegistryEntry.methods.afterRebind) {
				oComponentRegistryEntry.methods.afterRebind();
			}
		}
		
		function fnUnbind(){
			var oComponentContainer = oComponent.getComponentContainer();
			oComponentContainer.unbindElement();
			oContextToAdaptTo = null;
		}

		// Refreshes the content of aCurrentKeys and returns whether this was necessary.
		function fnCompareKeysAndStoreNewOnes(){
			var aNewKeys = getCurrentKeys();
			var bNoDifferenz = (aNewKeys.length === aCurrentKeys.length);
			for (var i = 0; i < aNewKeys.length && bNoDifferenz; i++){
				bNoDifferenz = aNewKeys[i] === aCurrentKeys[i];	
			}
			aCurrentKeys = aNewKeys;
			return !bNoDifferenz;
		}
		
		function fnCallReuseCallbacks(bUnconditional){
			var aReuseComponentProxies = oComponentRegistryEntry.reuseComponentProxies;	
			for (var i = 0; i < aReuseComponentProxies.length; i++){
				aReuseComponentProxies[i].pathUnchangedCallBack(bUnconditional);	
			}			
		}
		
		// Note: This method is called by TemplateComponent.onActivate. The definition can be found in class TemplateAssembler.
		// There it is ensured that oComponentRegistryEntry.viewRegisterd is already resolved, when this method is called. 
		function fnBindComponent(sBindingPath, bIsComponentCurrentlyActive) {
			var bAreKeysDifferent = fnCompareKeysAndStoreNewOnes();
			if (!sBindingPath){
				if (oComponentRegistryEntry.routingSpec && oComponentRegistryEntry.routingSpec.noOData){
					fnPageDataLoadedOnNavigation(null, bAreKeysDifferent);
				}				
				return;
			}
			var oComponentContainer = oComponent.getComponentContainer();
			if (!oComponentContainer){
				return;
			}
			if (isNonDraftCreate(sBindingPath)) {
				fnUnbind();
				oComponentContainer.setBindingContext(oComponentContainer.getModel().getContext(sBindingPath));
				Promise.all([oComponentRegistryEntry.oViewRenderedPromise, oComponentRegistryEntry.viewRegisterd]).then(fnCallReuseCallbacks.bind(null, true));
			} else {
				var oElementBinding = oComponentContainer.getElementBinding();
				if (oElementBinding){
					if (oElementBinding.getPath() === sBindingPath) {
						/*
						* component is already bound to this object - no rebound to avoid that 1:1, 1:N and expands are read
						* again
						*/
						if (oElementBinding.isSuspended()) {
							oElementBinding.resume();
							fnAdaptToContext();
						}
						if (bIsDataLoading){
							fnStartBusy();
						}
						oComponentRegistryEntry.oApplication.getBusyHelper().getUnbusy().then(fnCallReuseCallbacks.bind(null, bAreKeysDifferent && oComponentRegistryEntry.routingSpec.noOData));
						if (!bIsComponentCurrentlyActive){
							fnPreparePageDataLoaded();
						}
						return;
					} else if (!bIsComponentCurrentlyActive){
						fnUnbind();
					}
				}
				// set the UI model to not editable / enabled as long as the binding data is read
				var oUIModel = oComponent.getModel("ui");
				oUIModel.setProperty("/enabled", false);
				oUIModel.setProperty("/editable", false);
				// and read the header data if necessary
				fnRebindHeaderData(sBindingPath);

				fnPreparePageDataLoaded();
			}
		}

		function fnRefreshBinding() {
			var oComponentContainer, oElementBinding;
			oComponentContainer = oComponent.getComponentContainer();
			if (!oComponentContainer){
				return;
			}
			oElementBinding = oComponentContainer.getElementBinding();
			if (oElementBinding){
				oElementBinding.refresh();
			}
		}

		function fnSuspendBinding(){
			var oComponentContainer = oComponent.getComponentContainer();
			var oContext = oComponentContainer.getBindingContext();
			var sBindingPath = oContext && oContext.getPath();
			var bIsNonDraftCreate = sBindingPath && isNonDraftCreate(sBindingPath);
			if (bIsNonDraftCreate){
				oComponentContainer.setBindingContext();
				return;
			}
			var oElementBinding = oComponentContainer.getElementBinding();
			if (oElementBinding && !oElementBinding.isSuspended()){ // suspend element bindings of inactive components
				// if there are validation messages remove the binding. This also removes the validation messages, such that they are not visible on the next page
				if (oComponentRegistryEntry.oTemplateContract.oValidationMessageBinding.getLength()){
					fnUnbind();
				} else {
					oElementBinding.suspend();
				}
				fnEndBusy();
			}			
		}

		function setBackNavigation(fnBackNavigation) {
			oComponentRegistryEntry.oApplication.setBackNavigation(fnBackNavigation);
		}

		function registerContext(oContext){
			var iViewLevel = getViewLevel();
			return oComponentRegistryEntry.oApplication.registerContext(oContext, iViewLevel);
		}
		
		function getBreadCrumbInfo(){
			return oComponentRegistryEntry.oApplication.getBreadCrumbInfo(oComponent.getEntitySet());
		}
		
		function getCurrentKeys(){
			return oComponentRegistryEntry.oApplication.getCurrentKeys(getViewLevel());
		}
		
		function getCommunicationModel(){
			return oComponentRegistryEntry.oApplication.getCommunicationModel(oComponent);
		}
		
		function getCommunicationObject(iLevel){
			return oComponentRegistryEntry.oApplication.getCommunicationObject(oComponent, iLevel);	
		}
		
		function fnNavigateRoute(sRouteName, sKey, sEmbeddedKey, bReplace){
			oComponentRegistryEntry.oApplication.navigateRoute(sRouteName, sKey, oComponentRegistryEntry, sEmbeddedKey, bReplace);	
		}
		
		function getTitleFromTreeNode(){
			var sEntitySet = oComponent.getEntitySet();
			var oTreeNode = oComponentRegistryEntry.oTemplateContract.mEntityTree[sEntitySet];
			return oTreeNode.headerTitle;
		}
		
		function isDraftEnabled() {
			var sEntitySet = oComponent.getEntitySet();
			var oTreeNode = oComponentRegistryEntry.oTemplateContract.mEntityTree[sEntitySet];
			return oTreeNode.isDraft;
		}
		
		// get the path to the root of the currently edited draft
		function getDraftRootPath(){
			if (isDraftEnabled()){
				var aSections = oComponentRegistryEntry.oApplication.getHierarchySectionsFromCurrentHash();
				return "/" + aSections[0];
			}	
		}
		
		function isODataBased(){
			return !(oComponentRegistryEntry.routingSpec && oComponentRegistryEntry.routingSpec.noOData);	
		}
		
		function getHeaderDataAvailablePromise(){
			return oHeaderDataAvailablePromise;
		}
		
		// get the paginator info relevant for me
		function getPaginatorInfo(){
			return oComponentRegistryEntry.oTemplateContract.oPaginatorInfo[getViewLevel() - 1];	
		}
		
		// set the paginator info. This is done either for the children (when navigating to an item) or for my own level
		// (this is used to modify the paginator buttons, when they are used for navigation).
		function setPaginatorInfo(oPaginatorInfo, bForChildren){
			var iViewLevel = getViewLevel();
			if (!bForChildren){
				iViewLevel--;
			}
			oComponentRegistryEntry.oTemplateContract.oPaginatorInfo[iViewLevel] = oPaginatorInfo;
		}
		
		function onVisibilityChangeOfReuseComponent(bIsGettingVisible, oComponentContainer){
			var sContainerId = oComponentContainer.getId();
			var aPartsOfId = sContainerId.split("::");
			var sReuseComponentId = aPartsOfId[aPartsOfId.length - 2];
			var oTemplatePrivateModel = getTemplatePrivateModel();
			oTemplatePrivateModel.setProperty("/generic/embeddedComponents/" + sReuseComponentId + "/isInVisibleArea", bIsGettingVisible);
		}
		
		return {
			setEditableNDC: function(bIsEditable) {
				oComponentRegistryEntry.oApplication.setEditableNDC(bIsEditable);
			},
			getEditableNDC: function() {
				return oComponentRegistryEntry.oApplication.getEditableNDC();
			},

			getBusyHelper: function() {
				return oComponentRegistryEntry.oApplication.getBusyHelper();
			},

			isNonDraftCreate: isNonDraftCreate,

			attach: function(oController, sEvent, fnFunction) {
				fnAttach(getTemplateName(oController), sEvent, fnFunction);
			},
			detach: function(oController, sEvent, fnFunction) {
				fnDetach(getTemplateName(oController), sEvent, fnFunction);
			},
			fire: function(oController, sEvent, oEvent) {
				fnFire(getTemplateName(oController), sEvent, oEvent);
			},
			
			// temporary solution
			isListReportTemplate: function(){
				return sap.suite.ui.generic.template.js.AnnotationHelper.isListReportTemplate(oComponentRegistryEntry.routeConfig);	
			},

			getPreprocessorsData: getPreprocessorsData,
			getParameterModelForTemplating: getParameterModelForTemplating,
			bindComponent: fnBindComponent,
			refreshBinding: fnRefreshBinding,
			suspendBinding: fnSuspendBinding,
			setBackNavigation: setBackNavigation,
			getTemplatePrivateModel: getTemplatePrivateModel,
			registerContext: registerContext,
			getViewLevel: getViewLevel,
			getBreadCrumbInfo: getBreadCrumbInfo,
			getCurrentKeys: getCurrentKeys,
			getDraftRootPath: getDraftRootPath,
			getCommunicationModel: getCommunicationModel,
			getCommunicationObject: getCommunicationObject,
			navigateRoute: fnNavigateRoute,
			getTitleFromTreeNode: getTitleFromTreeNode,
			isDraftEnabled: isDraftEnabled,
			isODataBased: isODataBased,
			isComponentActive: isComponentActive,
			navigateToDataLoadedFailedPage: fnNavigateToDataLoadedFailedPage,
			getHeaderDataAvailablePromise: getHeaderDataAvailablePromise,
			getPaginatorInfo: getPaginatorInfo,
			setPaginatorInfo: setPaginatorInfo,
			onVisibilityChangeOfReuseComponent: onVisibilityChangeOfReuseComponent
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.lib.ComponentUtils", {
		constructor: function(oComponent, oComponentRegistryEntry) {
			jQuery.extend(this, getMethods(oComponent, oComponentRegistryEntry));
		}
	});
});