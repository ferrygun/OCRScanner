sap.ui.define(["jquery.sap.global", "sap/ui/base/Object", "sap/ui/Device", "sap/ui/model/json/JSONModel", "sap/ui/core/routing/History",
		"sap/ui/core/routing/HistoryDirection", "sap/m/MessageToast", "sap/m/ActionSheet", "sap/m/Dialog", "sap/m/Popover",
		"sap/suite/ui/generic/template/lib/deletionHelper", "sap/suite/ui/generic/template/lib/routingHelper", "sap/suite/ui/generic/template/lib/ContextBookkeeping", "sap/suite/ui/generic/template/lib/testableHelper"
	],
	function(jQuery, BaseObject, Device, JSONModel, History, HistoryDirection, MessageToast, ActionSheet, Dialog, Popover, deletionHelper, routingHelper, ContextBookkeeping, testableHelper) {
		"use strict";

		var sContentDensityClass = (testableHelper.testableStatic(function(bTouch, oBody) {
			var sCozyClass = "sapUiSizeCozy",
				sCompactClass = "sapUiSizeCompact";
			if (oBody.hasClass(sCozyClass) || oBody.hasClass(sCompactClass)) { // density class is already set by the FLP
				return "";
			} else {
				return bTouch ? sCozyClass : sCompactClass;
			}
		}, "Application_determineContentDensityClass")(Device.support.touch, jQuery(document.body)));

		function getContentDensityClass() {
			return sContentDensityClass;
		}

		// defines a dependency from oControl to a parent
		function fnAttachControlToParent(oControl, oParent) {
			jQuery.sap.syncStyleClass(sContentDensityClass, oParent, oControl);
			oParent.addDependent(oControl);
		}

		// Expose selected private static functions to unit tests
		/* eslint-disable */
		var fnAttachControlToParent = testableHelper.testableStatic(fnAttachControlToParent, "Application_attachControlToParent");
		/* eslint-enable */

		/* An instance of this class represents a Smart Template based application. Thus, there is a one-to-one relationship between
		 * instances of this class and instances of sap.suite.ui.generic.template.lib.AppComponent.
		 * However, this class is only used inside the sap.suite.ui.generic.template.lib package. It is not accessible to template developers
		 * or breakout developers.
		 * Instances of this class are generated in sap.suite.ui.generic.template.lib.TemplateAssembler.
		 * Note that TemplateAssembler also possesses a reference to the instance of this class which represents the app currently
		 * running.
		 * oTemplateContract: An object which is used for communication between this class and the AppComponent and its helper classes.
		 * Note that this class injects its api to these classes into the template contract object.
		 * Currently this class supports two use cases:
		 * 1. For non-draft apps it contains the information whether the app is currently in display or in edit state (methods set/getEditableNDC)
		 * 2. A 'navigation' model is supported. Thereby, we consider navigation to take place each time a route name or a route pattern is changed (but not when only the parameters added to the route are changed)
		 */
		function getMethods(oTemplateContract) {

			var oContextBookkeeping = new ContextBookkeeping(oTemplateContract.oAppComponent);
			var oListReportTable, bEtagsAvailable;

			function getListReportTable(){
				return oListReportTable;
			}

			function setListReportTable(oTable){
				oListReportTable = oTable;
			}

			function isComponentActive(oComponent){
				var aActiveComponents = oTemplateContract.oNavigationControllerProxy.getActiveComponents();
				return aActiveComponents.indexOf(oComponent.getId()) >= 0;
			}

			var bIsWaitingForSideEffectExecution = false;

			// Executes fnFunction as soon as all side-effects have been executed.
			function fnPerformAfterSideEffectExecution(fnFunction){
				if (bIsWaitingForSideEffectExecution){
					return;   // do not let two operation wait for side effect execution
				}
				var i = 0;
				for (; i < oTemplateContract.aRunningSideEffectExecutions.length && !oTemplateContract.aRunningSideEffectExecutions[i]; i++){
					i++;
				}
				if (oTemplateContract.aRunningSideEffectExecutions[i]){
					bIsWaitingForSideEffectExecution = true;
					var oPromise = oTemplateContract.aRunningSideEffectExecutions[i];
					oPromise.then(function(){
						if (oTemplateContract.aRunningSideEffectExecutions[i] === oPromise){
							oTemplateContract.aRunningSideEffectExecutions[i] = null;
						}
						bIsWaitingForSideEffectExecution = false;
						fnPerformAfterSideEffectExecution(fnFunction);
					});
				} else {
					fnFunction();
				}
			}

			function fnMakeBusyAware(oControl) {
				var sOpenFunction;
				if (oControl instanceof Dialog) {
					sOpenFunction = "open";
				} else if (oControl instanceof Popover || oControl instanceof ActionSheet) {
					sOpenFunction = "openBy";
				}
				if (sOpenFunction) {
					var fnOpenFunction = oControl[sOpenFunction];
					oControl[sOpenFunction] = function() {
						var myArguments = arguments;
						fnPerformAfterSideEffectExecution(function(){
							if (!oTemplateContract.oBusyHelper.isBusy()) { // suppress dialogs while being busy
								oTemplateContract.oBusyHelper.getUnbusy().then(function() { // but the busy dialog may still not have been removed
									fnOpenFunction.apply(oControl, myArguments);
								});
							}
						});
					};
				}
			}

			var mFragmentStores = {};

			function getDialogFragmentForView(oView, sName, oFragmentController, sModel, fnOnFragmentCreated) {
				oView = oView || oTemplateContract.oNavigationHost;
				var sViewId = oView.getId();
				var mFragmentStore = mFragmentStores[sViewId] || (mFragmentStores[sViewId] = {});
				var oFragment = mFragmentStore[sName];
				if (!oFragment) {
					oFragment = sap.ui.xmlfragment(sViewId, sName, oFragmentController);
					fnAttachControlToParent(oFragment, oView);
					var oModel;
					if (sModel) {
						oModel = new JSONModel();
						oFragment.setModel(oModel, sModel);
					}
					(fnOnFragmentCreated || jQuery.noop)(oFragment, oModel);
					mFragmentStore[sName] = oFragment;
					fnMakeBusyAware(oFragment);
				}
				return oFragment;
			}

			function getOperationEndedPromise() {
				return new Promise(function(fnResolve) {
					oTemplateContract.oNavigationObserver.getProcessFinished(true).then(function(){
						oTemplateContract.oBusyHelper.getUnbusy().then(fnResolve);
					});
				});
			}

			function setBackNavigation(fnBackNavigation) {
				oTemplateContract.oShellServicePromise.then(function(oShellService){
					oShellService.setBackNavigation(fnBackNavigation);
				});
			}

			function getFclProxyForView(iViewLevel) {
				if (!oTemplateContract.oFlexibleColumnLayoutHandler){
					return {
						handleDataReceived: function(){ return false; }
					};
				}
				return oTemplateContract.oFlexibleColumnLayoutHandler.getFclProxyForView(iViewLevel);
			}

			var bIsEditable = false;

			function setEditableNDC(isEditable) {
				bIsEditable = isEditable;
			}

			// This function indicates if a new HistoryEntry is required.
			// A new HistoryEntry is only required if the user navigates to an object which will be displayed in a new column.
			// If the object will be displayed in a column which is already visible no HistoryEntry is required
			function isNewHistoryEntryRequired(oTargetContext, sNavigationProperty){
				if (!oTemplateContract.oFlexibleColumnLayoutHandler){
					return true;
				}
				var oTarget = routingHelper.determineNavigationPath(oTargetContext, sNavigationProperty);
				return oTemplateContract.oFlexibleColumnLayoutHandler.isNewHistoryEntryRequired(oTarget);
			}

			function fnRegisterStateChanger(oStateChanger){
				oTemplateContract.aStateChangers.push(oStateChanger);
			}

			function getTargetAfterCancelPromise(oActive){
				return oTemplateContract.oFlexibleColumnLayoutHandler ? oTemplateContract.oFlexibleColumnLayoutHandler.getTargetAfterCancelPromise(oActive) : Promise.resolve(oActive);
			}
			
			function fnPrepareDeletion(sPath, oPromise){
				oPromise.then(function(){
					oContextBookkeeping.adaptAfterObjectDeleted(sPath);	
				});
			}

			function fnBuildSections(sEntitySet, bOnlyEntitySetNames, aSections){
				var oTreeNode = oTemplateContract.mEntityTree[sEntitySet];
				var sNewEntry;
				if (oTreeNode.navigationProperty && oTreeNode.parent){
					sNewEntry = bOnlyEntitySetNames ? oTreeNode.entitySet : oTreeNode.navigationProperty;
				} else {
					sNewEntry = sEntitySet;
				}
				if (aSections.indexOf(sNewEntry) < 0){
					aSections.unshift(sNewEntry);
					if (oTreeNode.navigationProperty && oTreeNode.parent){
						fnBuildSections(oTreeNode.parent, bOnlyEntitySetNames, aSections);
					}
				}
			}

			function getSections(sEntitySet, bOnlyEntitySetNames){
				var aRet = [];
				fnBuildSections(sEntitySet, bOnlyEntitySetNames, aRet);
				return aRet;
			}

			function getBreadCrumbInfo(sEntitySet){
				var aSections = getSections(sEntitySet);
				// remove the last one - this is the current shown section
				aSections.pop();
				var sPath = "";
				var delimiter = "";
				var aRet = [];
				for (var i = 0; i < aSections.length; i++){
					sPath = sPath + delimiter + aSections[i];
					aRet.push(sPath);
					delimiter = "/";
				}
				return aRet;
			}

			function getHierarchySectionsFromCurrentHash(){
				var sHash = oTemplateContract.oNavigationControllerProxy.oHashChanger.getHash();
						// remove query part if there's one
				var	sPath = sHash.split("?")[0];
				var aSections = sPath.split("/");

				if (aSections[0] === "" || aSections[0] === "#") {
					// Path started with a / - remove first section
					aSections.splice(0, 1);
				}
				return aSections;
			}

			function fnAdaptBreadCrumbUrl(sHash, iViewLevel, bIsHash){
				if (oTemplateContract.oFlexibleColumnLayoutHandler){
					return oTemplateContract.oFlexibleColumnLayoutHandler.adaptBreadCrumbUrl(sHash, iViewLevel, bIsHash);
				}
				return sHash;
			}

			function getResourceBundleForEditPromise(){
				var aActiveComponents = oTemplateContract.oNavigationControllerProxy.getActiveComponents();
				var iMinViewLevel = 0;
				var oComponent;
				for (var i = 0; i < aActiveComponents.length; i++){
					var oRegistryEntry = oTemplateContract.componentRegistry[aActiveComponents[i]];
					if (oRegistryEntry.viewLevel > 0 && (iMinViewLevel === 0 || oRegistryEntry.viewLevel < iMinViewLevel)){
						iMinViewLevel = oRegistryEntry.viewLevel;
						oComponent = oRegistryEntry.oComponent;
					}
				}
				var oComponentPromise = oComponent ? Promise.resolve(oComponent) : oTemplateContract.oNavigationControllerProxy.getRootComponentPromise();
				return oComponentPromise.then(function(oComp){
					return oComp.getModel("i18n").getResourceBundle();
				});
			}

			function getAppTitle() {
				return oTemplateContract.oNavigationControllerProxy.getAppTitle();
			}

			function fnSubTitleForViewLevelChanged(iViewLevel, sBreadCrumbText){
				oTemplateContract.oNavigationControllerProxy.subTitleForViewLevelChanged(iViewLevel, sBreadCrumbText);
			}

			function getCurrentKeys(iViewLevel){
				return oTemplateContract.oNavigationControllerProxy.getCurrentKeys(iViewLevel);
			}

			function getPathForViewLevelOneIfVisible() {
				for (var sComponentId in oTemplateContract.componentRegistry){
					var oRegistryEntry = oTemplateContract.componentRegistry[sComponentId];
					if (oRegistryEntry.viewLevel === 1) {
						if (isComponentActive(oRegistryEntry.oComponent)) {
							var oElementBinding = oRegistryEntry.oComponent.getComponentContainer().getElementBinding();
							return oElementBinding && oElementBinding.getPath();
						} else {
							return null;
						}
					}
				}
				return null;
			}

			function fnNavigateRoute(sRouteName, sKey, oComponentRegistryEntry, sEmbeddedKey, bReplace){
				var sEntitySet = oComponentRegistryEntry.oComponent.getEntitySet();
				var oTreeNode = oTemplateContract.mEntityTree[sEntitySet];
				var bIsEmbedded = false;
				var sFullRouteName;
				var bWithKey = true;
				for (var i = 0; i < oTreeNode.children.length && !sFullRouteName; i++){
					var sChild = oTreeNode.children[i];
					var oChildNode = oTemplateContract.mEntityTree[sChild];
					if (oChildNode.navigationProperty === sRouteName){
						sFullRouteName = oChildNode.sRouteName;
						bWithKey = !oChildNode.noKey;
					}
				}
				if (sEmbeddedKey && !sFullRouteName){
					var oEmbeddedComponent = oTreeNode.embeddedComponents[sEmbeddedKey];
					if (oEmbeddedComponent){
						for (var j = 0; j < oEmbeddedComponent.pages.length && !bIsEmbedded; j++){
							var oPage = oEmbeddedComponent.pages[j];
							if (oPage.navigationProperty === sRouteName){
								bIsEmbedded = true;
								sFullRouteName = sEntitySet + "/" + sEmbeddedKey + "/" + sRouteName;
								bWithKey = !(oPage.routingSpec && oPage.routingSpec.noKey);
							}
						}
					}
				}
				if (sFullRouteName){
					var sInfix = bIsEmbedded ? sEmbeddedKey + routingHelper.getPatternDelimiter() : "";
					var sKeyClause = bWithKey ? "(" + sKey + ")" : "";
					var sSuffix = sInfix + sRouteName + sKeyClause;
					oTemplateContract.oNavigationControllerProxy.navigateToSuffix(sSuffix, oComponentRegistryEntry.viewLevel + 1, sFullRouteName, bReplace);
				}
			}

			var oFallbackModel;
			function getCommunicationModel(oComponent){
				var sEntitySet = oComponent.getEntitySet();
				var oTreeNode = oTemplateContract.mEntityTree[sEntitySet];
				if (oTreeNode && oTreeNode.communicationModel){
					return oTreeNode.communicationModel;
				}
				oFallbackModel = oFallbackModel || new JSONModel();
				return oFallbackModel;
			}

			var oGlobalObject;
			function getCommunicationObject(oComponent, iLevel){
				var i = iLevel || 0;
				if (i > 0){
					// This is only allowed for ReuseComponents, which is not handled here
					return null;
				}
				var sEntitySet = oComponent.getEntitySet();
				var oTreeNode = oTemplateContract.mEntityTree[sEntitySet];
				var oRet = oTreeNode && oTreeNode.communicationObject;
				for (; i < 0 && oRet; ){
					oTreeNode = oTemplateContract.mEntityTree[oTreeNode.parent];
					if (oTreeNode.communicationObject !== oRet){
						i++;
						oRet = oTreeNode.communicationObject;
					}
				}
				if (i < 0 || oRet){
					return oRet;
				}
				oGlobalObject = oGlobalObject || {};
				return oGlobalObject;
			}

			function getForwardNavigationProperty(iViewLevel){
				for (var sKey in oTemplateContract.mEntityTree) {
					if (oTemplateContract.mEntityTree[sKey].navigationProperty && (oTemplateContract.mEntityTree[sKey].level === iViewLevel + 1)) {
						return oTemplateContract.mEntityTree[sKey].navigationProperty;
					}
				}
			}

			function getMaxColumnCountInFCL(){
				return oTemplateContract.oFlexibleColumnLayoutHandler ? oTemplateContract.oFlexibleColumnLayoutHandler.getMaxColumnCountInFCL() : false;
			}

			// This method is called when a draft modification is done. It enables all interested active components to mark their draft as modified
			function fnMarkCurrentDraftAsModified(){
				// All active components get the chance to declare one path as the path to be marked as modified
				var aActiveComponents = oTemplateContract.oNavigationControllerProxy.getActiveComponents();
				for (var i = 0; i < aActiveComponents.length; i++){
					var sComponentId = aActiveComponents[i];
					var oRegistryEntry = oTemplateContract.componentRegistry[sComponentId];
					var sModifiedPath = oRegistryEntry.methods.currentDraftModified && oRegistryEntry.methods.currentDraftModified();
					if (sModifiedPath){
						oContextBookkeeping.markDraftAsModified(sModifiedPath);
					}
				}
			}

			/*
			 * Check if entity sets (service) used are etag enabled
			 *
			 *@returns {boolean} return true to skip the model refresh, when:
								a) at least one entity set is etag enabled 
								b) model does not contain any contexts yet
			 *@private
			*/
			
			function fnCheckEtags() {
				if (bEtagsAvailable !== undefined) {
					return bEtagsAvailable;
				}
				var oEntity, sEtag, oContext, sEntitySet, sPath, oEntitySet, bEmptyModel = true;
				var oModel = oTemplateContract.oAppComponent.getModel();
				var oMetaModel = oModel.getMetaModel();
				//This will be improved. Waiting for an official model API to get contexts
				var mContexts = oModel.mContexts;
				for (oContext in mContexts) {
					bEmptyModel = false;
					sPath = mContexts[oContext].sPath;
					sEntitySet = sPath && sPath.substring(1, sPath.indexOf('('));
					oEntitySet = sEntitySet && oMetaModel.getODataEntitySet(sEntitySet);
					if (oEntitySet) {
						oEntity = oModel.getProperty(sPath);
						sEtag = oEntity && oModel.getETag(undefined, undefined, oEntity) || null;
						if (sEtag) {
							bEtagsAvailable = true;
							return bEtagsAvailable;
						}
					}
				}
				// if mContexts is an empty object, return true but do not alter bEtagsAvailable
				if (bEmptyModel) {
					return true;
				}
				bEtagsAvailable = false;
				return bEtagsAvailable;
			}


			function fnUnbindAllComponents() {
				var i, sId, oRegistryEntry;
				var aAllComponents = oTemplateContract.oNavigationControllerProxy.getAllComponents(); // get all components
				for (i = 0; i < aAllComponents.length; i++) {
					sId = aAllComponents[i];
					oRegistryEntry = oTemplateContract.componentRegistry[sId];
					oRegistryEntry.utils.refreshBinding();
				}
			}

			oTemplateContract.oApplicationProxy = { // inject own api for AppComponent into the Template Contract. Other classes (NavigationController, BusyHelper) will call these functions accordingly.
				getDraftSiblingPromise: oContextBookkeeping.getDraftSiblingPromise,

				getAlternativeContextPromise: oContextBookkeeping.getAlternativeContextPromise,
				getPathOfLastShownDraftRoot: oContextBookkeeping.getPathOfLastShownDraftRoot,

				getResourceBundleForEditPromise: getResourceBundleForEditPromise,

				getHierarchySectionsFromCurrentHash: getHierarchySectionsFromCurrentHash,
				getContentDensityClass: getContentDensityClass,
				setEditableNDC: setEditableNDC,
				getDialogFragment: getDialogFragmentForView.bind(null, null),
				destroyView: function(sViewId){
					delete mFragmentStores[sViewId];
				},
				setListReportTable: setListReportTable,
				markCurrentDraftAsModified: fnMarkCurrentDraftAsModified,
				prepareDeletion: fnPrepareDeletion
			};

			return {
				setEditableNDC: setEditableNDC,
				getEditableNDC: function() {
					return bIsEditable;
				},
				getContentDensityClass: getContentDensityClass,
				attachControlToParent: fnAttachControlToParent,
				getDialogFragmentForView: getDialogFragmentForView,
				getBusyHelper: function() {
					return oTemplateContract.oBusyHelper;
				},
				performAfterSideEffectExecution: fnPerformAfterSideEffectExecution,
				isComponentActive: isComponentActive,
				showMessageToast: function() {
					var myArguments = arguments;
					var fnMessageToast = function() {
						jQuery.sap.log.info("Show message toast");
						MessageToast.show.apply(MessageToast, myArguments);
					};
					Promise.all([getOperationEndedPromise(true), oTemplateContract.oBusyHelper.getUnbusy()]).then(fnMessageToast);
				},
				setBackNavigation: setBackNavigation,
				getFclProxyForView: getFclProxyForView,
				isNewHistoryEntryRequired: isNewHistoryEntryRequired,
				registerStateChanger: fnRegisterStateChanger,
				getDraftSiblingPromise: oContextBookkeeping.getDraftSiblingPromise,
				registerContext: oContextBookkeeping.registerContext,
				activationStarted: oContextBookkeeping.activationStarted,
				cancellationStarted: oContextBookkeeping.cancellationStarted,
				editingStarted: oContextBookkeeping.editingStarted,
				getTargetAfterCancelPromise: getTargetAfterCancelPromise,
				getBreadCrumbInfo: getBreadCrumbInfo,
				adaptBreadCrumbUrl: fnAdaptBreadCrumbUrl,
				getSections: getSections,
				getHierarchySectionsFromCurrentHash: getHierarchySectionsFromCurrentHash,
				getAppTitle: getAppTitle,
				subTitleForViewLevelChanged: fnSubTitleForViewLevelChanged,
				getCurrentKeys: getCurrentKeys,
				getPathForViewLevelOneIfVisible: getPathForViewLevelOneIfVisible,
				getCommunicationModel: getCommunicationModel,
				getCommunicationObject: getCommunicationObject,
				navigateRoute: fnNavigateRoute,
				getForwardNavigationProperty: getForwardNavigationProperty,
				getMaxColumnCountInFCL: getMaxColumnCountInFCL,
				getListReportTable: getListReportTable,
				markCurrentDraftAsModified: fnMarkCurrentDraftAsModified,
				checkEtags: fnCheckEtags,
				unbindAllComponents: fnUnbindAllComponents,
				getIsDraftModified: oContextBookkeeping.getIsDraftModified,
				prepareDeletion: deletionHelper.prepareDeletion.bind(null, oTemplateContract),
				prepareDeletionOfCreateDraft: deletionHelper.prepareDeletionOfCreateDraft.bind(null, oTemplateContract)
			};
		}

		return BaseObject.extend("sap.suite.ui.generic.template.lib.Application", {
			constructor: function(oTemplateContract) {
				jQuery.extend(this, getMethods(oTemplateContract));
			}
		});
	});