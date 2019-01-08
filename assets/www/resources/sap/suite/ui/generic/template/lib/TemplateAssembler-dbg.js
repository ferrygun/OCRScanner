// This class is the central facility assembling Templates that can be used within a Smart Template application.
// Moreover, it serves as a registry for all central objects used in context of Smart Templates. 
// In order to achieve this it provides three static methods:
// - getTemplateComponent creates a Template out of an abstract Template definition
// - getRegisterAppComponent is used by class AppComponent to establish a communication between the classes AppComponent and TemplateAssembler. 
//   Note that this method cannot be used by any other class.
// - getExtensionAPIPromise provides access to the instance of the extensionAPI suitable for a certain control

sap.ui
	.define(["jquery.sap.global", "sap/ui/core/mvc/View", "sap/ui/model/json/JSONModel", "sap/ui/model/resource/ResourceModel",
			"sap/suite/ui/generic/template/lib/TemplateViewController",
			"sap/suite/ui/generic/template/lib/TemplateComponent", "sap/suite/ui/generic/template/lib/Application",
			"sap/suite/ui/generic/template/lib/CRUDManager", "sap/suite/ui/generic/template/lib/CommonUtils",
			"sap/suite/ui/generic/template/lib/ComponentUtils", "sap/suite/ui/generic/template/lib/CommonEventHandlers",
			"sap/suite/ui/generic/template/lib/ViewDependencyHelper", "sap/suite/ui/generic/template/lib/routingHelper",
			"sap/suite/ui/generic/template/lib/testableHelper"
		],
		function(jQuery, View, JSONModel, ResourceModel, TemplateViewController, TemplateComponent, Application, CRUDManager, CommonUtils,
			ComponentUtils, CommonEventHandlers, ViewDependencyHelper, routingHelper, testableHelper) {
			"use strict";

			var mAppRegistry = Object.create(null); // Registry for the AppComponents (mapping the id of the AppComponent onto its registry entry).
			                                        // Note that currently there is no scenario known, in which more than one AppComponent is active at the same time.
			                                        // Therefore, this map will never contain more than one entry.
			                                        // fnRegisterAppComponent (see below) is used to register/deregister an AppComponent into this registry.
			                                        // See also there for information, which properties are contained in a registry entry.
			var mControllerRegistry = Object.create(null); // Registry for the controllers (instances of TemplateViewController) of TemplateComponents.
			                                               // It maps the id of the controller onto the corresponding registry entry.
			                                               // See below (function getTemplateViewController) for the mechanism of registering (oControllerDefinition.constructor)
			                                               // resp. deregistering (oControllerDefinition.onExit) from this registry.
			                                               // The registry entry itself is created within the method fnGenericOnInit which is temporarily attached
			                                               // to the controller.
			                                               // Note that this instance is also added as property oControllerRegistryEntry to the registry entry of the
			                                               // corresponding TemplateComponent.
			                                               // The registry entry contains the following properties:
			                                               // - onExit: exit function of the controller as defined in the methods-object provided in the controller definition
			                                               // - oTemplateUtils: utils object being passed to the controller
			                                               // - oAppRegistryEntry: registry entry for the AppComponent the controller belongs to
			                                               
			// This function is handed over to class AppComponent. The variable will be set to null, once this has happened.
			// oAppRegistryEntry is a registry entry for the AppComponent. When it is registered it contains the following properties:
			// - appComponent: the AppComponent to be registered
			// - oTemplateContract: the TemplateContract for this App, as described in AppComponent
			// - application: instance of class Application 
			// - oViewDependencyHelper: instance of class ViewDependencyHelper
			// This function returns a function that can be used to deregister the AppComponent from the registry when it is exited.
			var fnRegisterAppComponent = function(oAppRegistryEntry){
				var sAppComponentId = oAppRegistryEntry.appComponent.getId();
				mAppRegistry[sAppComponentId] = oAppRegistryEntry;
				return function(){
					delete mAppRegistry[sAppComponentId];
				};
			};

			// retrieve the registry entry for an AppComponent
			function getAppRegistryEntry(oAppComponent) {
				var sAppComponentId = oAppComponent.getId();
				var oRet = mAppRegistry[sAppComponentId];
				return oRet;
			}

			// retrieve the registry entry of a TemplateComponent. Note that the component registry is stored within the TemplateContract.
			// A component registry entry is instantiated in function fnCreateComponentInstance of NavigationController.
			// At this point in time it contains the following properties:
			// - componentCreateResolve: as soon as the component is created it will be passed to this function andthe function will be deleted from the registry entry
			// - route: name of the route leading to the component
			// - routeConfig: configuration of the route leading to the component
			// - viewLevel: the hierarchical level of the component in the pages tree (root has level 0)
			// - routingSpec: routing spec from the routingConfig
			// - oNavigationObserver: a ProcessObserver observing the navigation in the NavContainer hosting the component
			//   Note: For Non-FCL-apps this will be the same instance for all components. For FCL-apps there will be one observer for each column.
			// - oHeaderLoadingObserver: a ProcessObserver observing the loading of the header data of the component
			// - preprocessorsData: data collected via templating and needed during runtime
			// The following properties will be added in method setContainer (of TemplateComponent, which can be found in this class):
			// - oApplication: Instance of class Application representing the whole app
			// - createViewController: A function that can be used to create the controller of the view realizing the component.
			//   Called in function createXMLView of TemplateComponent.
			// The following properties will be added in method getTemplateComponent:
			// - viewRegisterd: A Promise that is resolved as soon as the controller of the view realizing the component is initialized
			// - fnViewRegisteredResolve: A function used to resolve or reject the Promise above. Will be deleted, when the Promise is resolved.
			// - oViewRenderedPromise: A Promise that is resolved as soon as the view realizing the component has been rendered the first time
			// - fnViewRenderdResolve: A function used to resolve the Promise above. Will be deleted, when the Promise is resolved.
			// - reuseComponentProxies: An array representing the reuse component instances embedded into the component
			//   function dealWithEmbeddedComponent adds entries to this array
			// - componentName: full path (.-separated) to class realizing the component
			// - oComponent: the component
			// - activationTakt: The last logical navigation step that showed the component.
			//   See class NavigationController for the notion of logical navigation steps. In particular this property corresponds to oCurrentHash.iHashChangeCount of NavigationController.
			//   This property is used to check whether the component is currently visible.
			// - utils: Instance of ComponentUtils attached to the component
			// - methods: Result of getMethods which was passed to getTemplateComponent
			// - oGenericData: An object containing data for generic functionality.
			//   Currently, this object only contains a property mRefreshInfos which is used to control the behaviour of the refreshBinding-method
			function getComponentRegistryEntry(oComponent) {
				return getAppRegistryEntry(oComponent.getAppComponent()).oTemplateContract.componentRegistry[oComponent.getId()];
			}

			// Returns the view (instance of sap.ui.core.mvc.View) hosting the given control. Returns a faulty value if oControl is not directly or indirectly
			// hosted within a view.
			function fnFindView(oControl) {
				while (oControl && !(oControl instanceof View)) {
					oControl = oControl.getParent();
				}
				return oControl;
			}

			// Returns the registry entry for the TemplateComponent hosting the given control. Returns a faulty value if oControl is not directly or indirectly
			// hosted within a TemplateComponent.
			function fnGetComponentRegistryEntryForControl(oControl) {
				while (oControl) {
					var oView = fnFindView(oControl);
					var oController = oView && oView.getController();
					var oComponent = oController && oController.getOwnerComponent();
					if (oComponent instanceof TemplateComponent) {
						var oComponentRegistryEntry = getComponentRegistryEntry(oComponent);
						return oComponentRegistryEntry;
					} else {
						oControl = oComponent && oComponent.oContainer;
					}
				}
			}

			// This method assembles (and returns) the controller of a template view. The controller will be a subclass of TemplateViewController. However, the common functionaliy of
			// all template controllers is not ensured by inheritance from a common superclass. It is injected by the assembly process.
			// The parameters describe the behaviour of the controller in detail.
			// More precisely the meaning of the parameters is as follows:
			// - sControllerName is the name given to the controller. It should be the path (.-separated) to the view (without suffix ".view.xml")
			// - oControllerDefinition (optional) is an object which is merged into the controller. This object should only contain extension functions that are intended to
			//   be overwritten by breakout-developers. As a convention the names of these methods should end with suffix "Extension".
			//   The functions contained within this object should be the default implementations of these extensions (normally doing nothing).
			//   Note that the state of oControllerDefinition is not defined after having been passed to this function.
			// - oTemplateUtils a collection of utils that can be used within the controller implementation. When passed to this method this object contains properties
			//   oComponentUtils (see corresponding class in this package) and oServices. Thereby, oServices has the following properties: 
			//   ~ to be filled by the template: oTemplateCapabilities, 
			//   ~ fom Denver layer: oApplicationController, oTransactionController, oDraftController, 
			//   ~ from this package: oApplication, oNavigationController, oViewDependencyHelper
			//   Note: This method will add additional properties to oTemplateUtils, namely oCommonUtils and oCommonEventHandlers. Moreover, it will add property
			//   oCRRUDManager to oTemplateUtils.oServices.
			// - oAppRegistryEntry is the rgistry entry of the enclosing smart templates app (see documentation of fnRegisterAppComponent for the structure of this object)
			// - getMethods is a function that will be called before the controller is instantiated. This method should have two parameters, namely oTemplateUtils and oController.
			//   The first parameter is exactly the oTemplateUtils object described above. The second parameter represents the controller to be created. It can be used like 'this'
			//   in normal class definitions.
			//   The function getMethods must return a complex object possessing the following (optional) properties:
			//   ~ onInit: will be called within onInit of the resulting controller
			//   ~ handlers: An object containing the event handlers provided by the controller. A member <handler> can be accessed via _templateEventHandlers.<handler>
			//   ~ formatters: An object containing the formatters provided by the controller. A member <formatter> can be accessed via _templateFormatters.<formatter>
			//   ~ extensionAPI: The extensionAPI provided for breakout developers (and developers of reuse components). It will be available as property extensionAPI of the controller
			function getTemplateViewController(getMethods, sControllerName, oControllerDefinition, oTemplateUtils, oAppRegistryEntry) {
				oControllerDefinition = oControllerDefinition || {};

				oControllerDefinition.constructor = function() {
					TemplateViewController.prototype.constructor.apply(this, arguments);
					var oMethods = getMethods(oTemplateUtils, this);
					this._templateEventHandlers = Object.freeze(oMethods.handlers || {});
					this._templateFormatters = Object.freeze(oMethods.formatters || {});
					this.extensionAPI = Object.freeze(oMethods.extensionAPI || {});
					this.fnGenericOnInit = function(oController) {
						var oView = oController.getView();
						var sViewId = oView.getId();
						jQuery.sap.log.info("Init view " + sViewId + " of template " + sControllerName);
						var oComponent = oController.getOwnerComponent();
						var oComponentRegistryEntry = getComponentRegistryEntry(oComponent);
						oComponentRegistryEntry.oControllerRegistryEntry = {
							onExit: oMethods.onExit || jQuery.noop,
							oTemplateUtils: oTemplateUtils,
							oAppRegistryEntry: oAppRegistryEntry
						};
						mControllerRegistry[sViewId] = oComponentRegistryEntry.oControllerRegistryEntry;
						oTemplateUtils.oServices.oApplicationController.registerView(oView);
						oTemplateUtils.oCommonUtils = new CommonUtils(oController, oTemplateUtils.oServices, oTemplateUtils.oComponentUtils);
						oTemplateUtils.oServices.oCRUDManager = new CRUDManager(oController,
							oTemplateUtils.oComponentUtils, oTemplateUtils.oServices, oTemplateUtils.oCommonUtils, oAppRegistryEntry.oTemplateContract.oBusyHelper
						);
						oTemplateUtils.oCommonEventHandlers = new CommonEventHandlers(oController,
							oTemplateUtils.oComponentUtils, oTemplateUtils.oServices, oTemplateUtils.oCommonUtils);
						(oMethods.onInit || jQuery.noop)();
						// Note: This relies on the fact, that there is a 1-1 relationship between TemplateView and
						// TemplateComponent.
						// If we introduce Templates using more then one view, this must be reworked.
						oComponentRegistryEntry.oController = this;
						oComponentRegistryEntry.fnViewRegisteredResolve();
					};
				};

				oControllerDefinition.onInit = function() {
					this.fnGenericOnInit(this);
					delete this.fnGenericOnInit;
				};
				oControllerDefinition.onExit = function() {
					var sViewId = this.getView().getId();
					var oControllerRegistryEntry = mControllerRegistry[sViewId];
					oControllerRegistryEntry.oAppRegistryEntry.oTemplateContract.oApplicationProxy.destroyView(sViewId);
					oControllerRegistryEntry.onExit();
					delete mControllerRegistry[sViewId];
					jQuery.sap.log.info("View " + sViewId + " of template " + sControllerName + " exited");
				};

				return TemplateViewController.extend(sControllerName, oControllerDefinition);
			}

			// This function returns a function that can be used to create a controller instance for a template view.
			// Thereby, oComponentRegistryEntry contains the data of the corresponding component (see above).
			// In particular property methods.oControllerSpecification of the registry entry is required (see documentation of getTemplateComponent)
			// This object should contain two properties, namely getMethods and oControllerDefinition.
			// These two properties will be passed to getTemplateViewController. See documentation of that method for the expected structure of these objects.
			function fnGetViewControllerCreator(oComponentRegistryEntry) {
				var oControllerSpecification = oComponentRegistryEntry.methods.oControllerSpecification;
				return oControllerSpecification && function(){
					var oAppComponent = oComponentRegistryEntry.oComponent.getAppComponent();
					var oAppRegistryEntry = getAppRegistryEntry(oAppComponent);
					var oTransactionController = oAppComponent.getTransactionController();
					var oNavigationController = oAppComponent.getNavigationController();
					var oTemplateUtils = {
						oComponentUtils: oComponentRegistryEntry.utils,
						oServices: {
							oTemplateCapabilities: {}, // Templates will add their capabilities which are used by the framework into this object
							oApplicationController: oAppComponent.getApplicationController(),
							oTransactionController: oTransactionController,
							oNavigationController: oNavigationController,
							oDraftController: oTransactionController.getDraftController(),
							oApplication: oAppRegistryEntry.application,
							oViewDependencyHelper: oAppRegistryEntry.oViewDependencyHelper
						}
					};
					oComponentRegistryEntry.viewRegisterd.catch(function(oError){
						oNavigationController.navigateToMessagePage({
							viewLevel: oComponentRegistryEntry.viewLevel,                         
							title: oComponentRegistryEntry.oTemplateContract.getText("ST_ERROR"),
							text:  oComponentRegistryEntry.oTemplateContract.getText("ST_GENERIC_UNKNOWN_NAVIGATION_TARGET"),
							description: ""							
						});                         		
					});
					return getTemplateViewController(oControllerSpecification.getMethods, oComponentRegistryEntry.oComponent.getTemplateName(), oControllerSpecification.oControllerDefinition, oTemplateUtils, oAppRegistryEntry);
				};
			}
			
			function dealWithEmbeddedComponent(oComponentRegistryEntry, oControl){
				var sEntitySet = oComponentRegistryEntry.oComponent.getEntitySet();
				var oTemplateContract = getAppRegistryEntry(oComponentRegistryEntry.oComponent.getAppComponent()).oTemplateContract;
				var oTreeNode = oTemplateContract.mEntityTree[sEntitySet];
				var mEmbeddedComponents = oTreeNode.embeddedComponents;
				for (var sEmbeddedKey in mEmbeddedComponents){
					var oEmbeddedComponent = mEmbeddedComponents[sEmbeddedKey];
					if (oComponentRegistryEntry.oController.byId(oEmbeddedComponent.containerId) === oControl){
						var oReuseComponent = oControl.getComponentInstance();
						oComponentRegistryEntry.reuseComponentProxies.push(oReuseComponent._stProxy);
						var oTemplateModel = oComponentRegistryEntry.utils.getTemplatePrivateModel();                         
						oTemplateModel.setProperty("/generic/embeddedComponents/" + sEmbeddedKey, {});
						return {
							embeddedKey: sEmbeddedKey,
							embeddedComponent: oEmbeddedComponent,
							templateContract: oTemplateContract,
							reuseComponent: oReuseComponent
						};
					}
				}
			}
			
			function fnEnhanceExtensionAPI4Reuse(oComponentRegistryEntry, oEmbeddedComponentInfo){
				var oExtensionAPI = oComponentRegistryEntry.oController.extensionAPI;
				var oRet = jQuery.extend({}, oExtensionAPI);
				if (oExtensionAPI.getNavigationController){
					var oNavigationController = jQuery.extend({}, oExtensionAPI.getNavigationController());
					var fnNavigateInternal = oNavigationController.navigateInternal;
					oNavigationController.navigateInternal = function(vContext, oNavigationData){
						var sRoutename = oNavigationData && oNavigationData.routeName;
						if (sRoutename){
							oComponentRegistryEntry.utils.navigateRoute(sRoutename, vContext, oEmbeddedComponentInfo.embeddedKey, oNavigationData && oNavigationData.replaceInHistory);
						} else {
							fnNavigateInternal(vContext, oNavigationData);	
						}
					};                     
					oRet.getNavigationController = function(){
						return oNavigationController;
					};
					oNavigationController.getSubCommunicationModel = function(){
						return oEmbeddedComponentInfo.embeddedComponent.communicationModel;      
					};
				}
				oRet.getCommunicationObject = function(iLevel){
					return iLevel === 1 ? oEmbeddedComponentInfo.embeddedComponent.communicationObject : oComponentRegistryEntry.utils.getCommunicationObject(iLevel);
				};
				(oComponentRegistryEntry.methods.enhanceExtensionAPI4Reuse || jQuery.noop)(oRet, oEmbeddedComponentInfo);
				return oRet;
			}
			
			fnRegisterAppComponent = testableHelper.testableStatic(fnRegisterAppComponent, "TemplateComponent_RegisterAppComponent");
			
			return {
				// This method assembles a Template that can be used in Smart Template applications.
				// Thereby, getMethods, sComponentName, and oComponentDefinition describe the behaviour of the component in detail.
				// More precisely the meaning of the parameters is as follows:
				// - sComponentName is the name of the component that realizes the Template. More precisely it describes the path (.-separated) 
				//   to a folder which contains a file Component.js which is built using this function.
				// - oComponentDefinition is an object containing a property metadata which contains the metadata for the TemplateComponent realizing the Template.
				// - getMethods is a function that will be called once for each instance of the Template to be assembled.
				//   The parameters passed to this function are oComponent and oComponentUtils
				//   ~ oComponent is the instance of class TemplateComponent that is created (can be considered as 'this')
				//   ~ oComponentUtils is an instance of class ComponentUtils that provides certain reusable tasks
				//   the return value of getMethods must be an object possessing the following (optional) properties:
				//   ~ init: a function that serves as init for the component. Note that it is not necessary to call init of a superclass
				//   ~ onActivate: a function that is called when the component becomes visible resp. its binding should be adapted.
				//     For non-list Templates parameter sBindingPath is passed to this function.
				//   ~ refreshBinding: a function with parameters bUnconditional and mRefreshInfos which is called when the data displayed by the
				//     Template instance should be refreshed. If bUnconditional is true, all data should be refreshed. Otherwise mRefreshInfos
				//     contains detailed information which data should be refreshed.
				//   ~ getUrlParameterInfo a function that allows the instance to pass its current state into url parameters. getUrlParameterInfo must return
				//     a Promise which resolves to a map mapping parameter names onto arrays of their values.
				//   ~ presetDisplayMode: a function possessing parameters iDisplayMode and bIsAlreadyDisplayed that may be called before onActivate is called.
				//     iDisplayMode contains information whether the data shown in the instance will be in display, edit, or create mode.
				//     bIsAlreadyDisplayed contains the information whether the Template instance is already inplace or will be navigated to.
				//   ~ updateBindingContext: a function that is called when a new binding context is available for the Template instance.
				//     Note that when switching to change (edit or create) this method will only be called in draft scenarios, since in non-draft scenarios
				//     no binding context from the backend is retrieved.
				//   ~ getTemplateSpecificParameters: a function providing an object containing specific parameters used during the template process when generating
				//     the xml view for this component. The corresponding object can be accessed via path "/templateSpecific" in the named model "parameter".
				//   ~ enhanceExtensionAPI4Reuse: a method that is called for each reuse component placed on the corresponding component. This method receives two parameters.
				//     The first one is the extensionAPI that would be provided for the reuse component according to the framework
				//     The second one is an object representing the meta data of the embedded component (in particular it contains a property embeddedKey containing the identification of the reuse component).
				//     The function might enhance the extensionAPI by additional features.
				//   ~ getTitle: a function that provides a title for this page. If not available the app title will be used.
				//   ~ beoreRebind/afterRebind: Methods that are called immediately before and after the component is rebound. Currently used for lazy loading.
				//   ~ currentDraftModified: function that is called, when an automated draft saving action is triggered centrally. 
				//   ~ getItems: Method for retrieving the items currently available in the list (currently only for list-Templates) <- Note: Check whether paginator infrastructure might be used for this
				//   ~ displayNextObject: Currently also only for list-Templates: A function that can be called to inform the list, that after next list-update it should navigate to
				//     another item. The preferred items are passed in an array of binding pathes. The method should return a Promise that is resolved when it was
				//     possible to perform this movement. Otherwise the Promise must be rejected.
				//   ~ navigateUp: Inform the template that it should perform an up navigation to the next level. Note that this is a workwaround. The framework itself
				//     should be able to perform an up navigation.				
				//   ~ oControllerSpecification: an object specifying the controller for the view realizing this Template.
				//     For more details see comments at function fnGetViewControllerCreator
				getTemplateComponent: function(getMethods, sComponentName, oComponentDefinition) {
					var sComponentNameFull = sComponentName + ".Component";
					oComponentDefinition = oComponentDefinition || {};

					oComponentDefinition.init = function() {
						var oComponentRegistryEntry = this.getComponentData().registryEntry;
						oComponentRegistryEntry.viewRegisterd = new Promise(function(fnResolve, fnReject) {
							// Note: oError is faulty in regular situations
							oComponentRegistryEntry.fnViewRegisteredResolve = function(oError){
								if (oError){
									oComponentRegistryEntry.fnViewRegisteredResolve = jQuery.noop;
									fnReject(oError);
								} else {
									delete oComponentRegistryEntry.fnViewRegisteredResolve;
									fnResolve();
								}
							};
						});
						oComponentRegistryEntry.oViewRenderedPromise = new Promise(function(fnResolve) {
							oComponentRegistryEntry.fnViewRenderdResolve = fnResolve;
						});
						oComponentRegistryEntry.reuseComponentProxies = [];
						(TemplateComponent.prototype.init || jQuery.noop).apply(this, arguments);
						oComponentRegistryEntry.componentName = sComponentNameFull;
						oComponentRegistryEntry.oComponent = this;
						oComponentRegistryEntry.activationTakt = 0;
						oComponentRegistryEntry.utils = new ComponentUtils(this, oComponentRegistryEntry);
						oComponentRegistryEntry.methods = getMethods(this, oComponentRegistryEntry.utils) || {};
						oComponentRegistryEntry.oGenericData = {
							mRefreshInfos: {}
						};
						(oComponentRegistryEntry.methods.init || jQuery.noop)();
					};

					oComponentDefinition.exit = function() {
						var sId = this.getId();
						var oComponentRegistryEntry = getComponentRegistryEntry(this);
						var oAppRegistryEntry = getAppRegistryEntry(this.getAppComponent());
						var oMethods = oComponentRegistryEntry.methods;
						(oMethods.exit || jQuery.noop)();
						delete oAppRegistryEntry.oTemplateContract.componentRegistry[sId];
						(TemplateComponent.prototype.exit || jQuery.noop).apply(this, arguments);
					};

					oComponentDefinition.onBeforeRendering = function() {
						var oComponentRegistryEntry = getComponentRegistryEntry(this);
						if (!oComponentRegistryEntry.oTemplateContract){
							var oAppRegistryEntry = getAppRegistryEntry(this.getAppComponent());
							oComponentRegistryEntry.oTemplateContract = oAppRegistryEntry.oTemplateContract;
						}
						(TemplateComponent.prototype.onBeforeRendering || jQuery.noop).bind(this, oComponentRegistryEntry).apply(this, arguments);
						var oMethods = oComponentRegistryEntry.methods;
						(oMethods.onBeforeRendering || jQuery.noop)();
					};
					
					oComponentDefinition.onAfterRendering = function() {
						var oComponentRegistryEntry = getComponentRegistryEntry(this);
						if (oComponentRegistryEntry.fnViewRenderdResolve && !oComponentRegistryEntry.fnViewRegisteredResolve){
							oComponentRegistryEntry.fnViewRenderdResolve();
							delete oComponentRegistryEntry.fnViewRenderdResolve;
						}
						(TemplateComponent.prototype.onAfterRendering || jQuery.noop).bind(this, oComponentRegistryEntry).apply(this, arguments);
						var oMethods = oComponentRegistryEntry.methods;
						(oMethods.onAftereRendering || jQuery.noop)();
					};

					oComponentDefinition.onActivate = function(sBindingPath, bIsComponentCurrentlyActive) {
						var oComponentRegistryEntry = getComponentRegistryEntry(this);
						oComponentRegistryEntry.sCurrentBindingPath = sBindingPath;
						var fnActivate = function() {
							oComponentRegistryEntry.utils.bindComponent(oComponentRegistryEntry.sCurrentBindingPath, bIsComponentCurrentlyActive);
							var bUnconditionalRefresh = this.getIsRefreshRequired();
							if (bUnconditionalRefresh || !jQuery.isEmptyObject(oComponentRegistryEntry.oGenericData.mRefreshInfos)) {
								(oComponentRegistryEntry.methods.refreshBinding || jQuery.noop)(bUnconditionalRefresh,
									bUnconditionalRefresh ? {} :
									oComponentRegistryEntry.oGenericData.mRefreshInfos);
								this.setIsRefreshRequired(false);
								oComponentRegistryEntry.oGenericData.mRefreshInfos = {};
							}
							return (oComponentRegistryEntry.methods.onActivate || jQuery.noop)(sBindingPath);
						}.bind(this);
						// If view is not registered yet ( == oComponentRegistryEntry.fnViewRegisteredResolve still available) perform fnActivate asyncronously, otherwise synchronosly
						return oComponentRegistryEntry.fnViewRegisteredResolve ? oComponentRegistryEntry.viewRegisterd.then(fnActivate) : (fnActivate() || Promise.resolve());
					};

					oComponentDefinition.setContainer = function() {
						TemplateComponent.prototype.setContainer.apply(this, arguments);
						var sId = this.getId();
						var oAppComponent = this.getAppComponent();
						var oAppRegistryEntry = getAppRegistryEntry(oAppComponent);

						if (!oAppRegistryEntry.oTemplateContract.componentRegistry[sId]) {
							var oComponentData = this.getComponentData();
							var oComponentRegistryEntry = oComponentData.registryEntry;
							delete oComponentData.registryEntry;
							oComponentRegistryEntry.componentCreateResolve(this);
							delete oComponentRegistryEntry.componentCreateResolve;
							oAppRegistryEntry.oTemplateContract.componentRegistry[sId] = oComponentRegistryEntry;

							oAppRegistryEntry.oTemplateContract.oBusyHelper.setBusy(oComponentRegistryEntry.viewRegisterd, true);
							oComponentRegistryEntry.oApplication = oAppRegistryEntry.application;
							oComponentRegistryEntry.createViewController = fnGetViewControllerCreator(oComponentRegistryEntry);
						}
					};
					
					oComponentDefinition.setIsRefreshRequired = function(bIsRefreshRequired) {
						if (bIsRefreshRequired){ // check whether refresh must be performed immediately
							var oComponentRegistryEntry = getComponentRegistryEntry(this);
							if (oComponentRegistryEntry.methods.refreshBinding && oComponentRegistryEntry.utils.isComponentActive()){
								oComponentRegistryEntry.viewRegisterd.then(oComponentRegistryEntry.methods.refreshBinding.bind(null, true, {}));
								bIsRefreshRequired = false;
							}	
						}
						this.setProperty("isRefreshRequired", bIsRefreshRequired);
					};

					oComponentDefinition.onDeactivate = jQuery.noop;

					return TemplateComponent.extend(sComponentNameFull, oComponentDefinition);
				},
				
				// This method is called by class AppComponent when it is initialized. It hands over a registration method to this class.
				// This registration method can be used to register an AppComponent in the central AppComponentRegistry handled by this class.
				// See fnRegisterAppComponent for details.
				// Note that getRegisterAppComponent can only be called once.
				getRegisterAppComponent: function(){
					var fnRet = fnRegisterAppComponent;
					fnRegisterAppComponent = null;
					return fnRet;
				},                                

				getExtensionAPIPromise: function(oControl) {
					var oComponentRegistryEntry = fnGetComponentRegistryEntryForControl(oControl);
					if (!oComponentRegistryEntry) {
						return Promise.reject();
					}
					return oComponentRegistryEntry.viewRegisterd.then(function() {
						// first check whether oControl is the ComponentContainer of a reuse component
						var oEmbeddedComponentInfo = dealWithEmbeddedComponent(oComponentRegistryEntry, oControl);
						if (oEmbeddedComponentInfo){
							return fnEnhanceExtensionAPI4Reuse(oComponentRegistryEntry, oEmbeddedComponentInfo);
						}
						return oComponentRegistryEntry.oController.extensionAPI;
					});
				},

				// Obsolete. Use getExtensionAPIPromise instead.
				getExtensionAPI: function(oControl) {
					var oComponentRegistryEntry = fnGetComponentRegistryEntryForControl(oControl);
					return oComponentRegistryEntry && oComponentRegistryEntry.oController && oComponentRegistryEntry.oController.extensionAPI;
				}
			};
		});