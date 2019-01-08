/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// ----------------------------------------------------------------------------------
// This abstract class is used as common base class for all Components implementing a Smart Template based application.
// More precisely, when generating a project for a Smart Template based App a subclass of this class is generated as root component for the project.
//
// An instance of this class represents the Smart Template Application as a whole. Note that this instance is accessible for Template developers, for Break-out developers and even for external tools (e.g. Co-pilot).
// Therefore, the set of (public) methods is reduced to a minimum.
// Note that there are two other instances that represent the application as a whole:
// - the TemplateContract is responsible for data interchange between objects on framework level. Note that no class has been modelled for the TemplateContract.
//   See documentation below for more information about TemplateContract.
// - the Application (instance of sap.suite.ui.generic.template.lib.Application) represents the App for Template developers.
//
// Note that there are additional helper classes which are instantiated once per App (during startup of this class):
// - sap.ui.generic.app.ApplicationController from Denver layer
// - NavigationController, BusyHelper, ViewDependencyHelper from namespace sap.suite.ui.generic.template.lib
// -----------------------------------------------------------------------------------------------------------------------------------------------------------------
sap.ui.define([
	"jquery.sap.global",
	"sap/ui/core/UIComponent", "sap/m/NavContainer",
	"sap/f/FlexibleColumnLayout",
	"sap/ui/model/Filter", "sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel", "sap/ui/model/resource/ResourceModel",
	"sap/ui/generic/app/ApplicationController",
	"sap/suite/ui/generic/template/lib/Application",
	"sap/suite/ui/generic/template/lib/BusyHelper",
	"sap/suite/ui/generic/template/lib/NavigationController",
	"sap/suite/ui/generic/template/lib/ProcessObserver",
	"sap/suite/ui/generic/template/lib/TemplateAssembler",
	"sap/suite/ui/generic/template/lib/CRUDHelper",
	"sap/suite/ui/generic/template/lib/ViewDependencyHelper",
	"sap/suite/ui/generic/template/lib/testableHelper",
	"sap/suite/ui/generic/template/library"
], function(jQuery, UIComponent, NavContainer, FlexibleColumnLayout, Filter, FilterOperator, JSONModel, ResourceModel, ApplicationController,
	Application, BusyHelper, NavigationController,  ProcessObserver, TemplateAssembler, CRUDHelper, ViewDependencyHelper, testableHelper) {
	"use strict";

	ApplicationController = testableHelper.observableConstructor(ApplicationController); // make the constructor accessible for unit tests

	var DraftIndicatorState = sap.m.DraftIndicatorState; // namespace cannot be imported by sap.ui.define

	var fnRegisterAppComponent = TemplateAssembler.getRegisterAppComponent(); // Retrieve the possibility to register at TemplateAssembler

	var oRB; // initialized on demand
	function getText() { // static method used to read texts from the i18n-file in the lib folder. Should only be used when no view is available.
		oRB = oRB || new ResourceModel({
			bundleName: "sap/suite/ui/generic/template/lib/i18n/i18n"
		}).getResourceBundle();
		return oRB.getText.apply(oRB, arguments);
	}

	function compoundObserver(){
		return new ProcessObserver({ processObservers: [] });
	}

	var oMessageModel = sap.ui.getCore().getMessageManager().getMessageModel();
	var oValidationMessasageFilter = new Filter({
			path: "validation",
			operator: FilterOperator.EQ,
			value1: true
		});

	// "Constructor": oAppComponent is the instance to be created. oAppId is an id provided by the testableHelper that can be used to end the productive mode
	function getMethods(oAppComponent, oAppId) {

		var	oTemplateContract = { // template contract object which is used for data interchange between framework classes
			oAppComponent: oAppComponent,
			componentRegistry: Object.create(null),	// registry for all TemplateComponents instantiated in the context of this App
													// maps the ids of these components on an object (called registry entry)
													// The registry entries are instantiated in function fnCreateComponentInstance of NavigationController
													// They are inserted into the registry in method setContainer of TemplateComponent,
													// which can actually be found in TemplateAssembler
													// See documentation of function getComponentRegistryEntry in TemplateAssembler for the structure of the
													// registry entries
			aRunningSideEffectExecutions: [], // an array containing Promises for running side-effect executions
			getText: getText,
			mRouteToTemplateComponentPromise: Object.create(null),	// maps the name of a route onto a Promise that res
																	// to the TemplateComponent that implements the view the route points to.
																	// The Promise is entered into the map in function createRoute of routingHelper
																	// Note that the map does not contain entries for the query-routes.
			oTemplatePrivateGlobalModel: (new JSONModel()).setDefaultBindingMode("TwoWay"), // a global model that can be used for declarative binding
			                                                                                // in the whole App as named model _templPrivGlobal.
			                                                                                // In function createGlobalTemplateModel it gets initial data
			                                                                                // and is attached to oAppComponent
			aStateChangers: [], // an array of agents that modify the url in order to store their state
			                   // a state changer can be added via Application.registerStateChanger.
			oPaginatorInfo: Object.create(null),	// Maps view levels onto paginator info objects that describe the paginator info
													// that is provided for the follow-up page.
													// The paginator objects are set in function storeObjectPageNavigationRelatedInformation of CommonEventHandlers.
													// Class sap.suite.ui.generic.template.detailTemplates.PaginatorButtonsHelper evaluates (and modifies) the content.
													// Function fnAdaptPaginatorInfoAfterNavigation of NavigationController does a cleanup of the content.
			oValidationMessageBinding: oMessageModel.bindList("/", null, null, oValidationMessasageFilter) // a list binding that filters all validation messages
		};

		// the following additional properties are added to TemplateContract later:
		// - oBusyHelper (instance of BusyHelper) by function createContent
		// - oNavigationHost (the navigation control hosting the App) by function createContent
		// - oNavigationControllerProxy an instance providing access to some internal methods of the NavigationController.
		//   It is added in the constructor of the NavigationController.
		// - sRoutingType constant describing the type of oNavigationHost ("m" = NavContainer, "f" = FlexibleColumnLayout) by function createContent
		// - function createContent adds several instances and arrays of class ProcessObserver, namely:
		//   # oNavigationObserver observes wether any navigation is currently running
		//   # aNavigationObservers only available if App runs in FCL. Contains an observer for each column.
		//   # oHeaderLoadingObserver observes whether any header data are currently loaded. It is started and stopped in ComponentUtils.
		//   # aHeaderLoadingObservers only available if App runs in FCL. Contains an observer for each column.
		//   # oPagesDataLoadedObserver observes whether header data are currently loaded or a navigation is currently running.
		// - oApplicationProxy an 'interface' provided by Application for the framework classes. It is added in the constructor of Application.
		// - oShellServicePromise a Promise that resolves to the ShellService. Added in init().
		// - oViewDependencyHelper helper class for refreshing view content. Added in init().
		//   Note that the following methods are used setTitle, setBackNavigation, and setHierarchy.
		// - rootContainer The ComponentContainer for the Component of the root-view. Added in the constructor of the NavigationController.
		//                 Note that this property will be available as soon as the root view is displayed (which may be delayed due to use of deep links).
		// - mEntityTree Initialized (generateRoutingMetadataAndGetRootEntitySet) and filled (function createRoutes) by the routingHelper, while creating the routes.
		//               Maps the names of the entity sets onto objects containing metadata about the target of the route
		//               Metadata properties are: 
		//               # sRouteName: name of the route
		//               # parent: name of parent entity set, if existing
		//               # level: hierarchy level
		//               # children: array containing the names of the child entity sets
		//               # navigationProperty: Navigation property leading to this entity set (if existing)
		//               # embeddedComponents: Map that maps the ids of the embedded reuse components defined on the corresponding page onto some metadata of these reuse components.
		//                 This property is filled in function fnHandleSubComponents.
		//               # communicationObject: For pages which are embedded via reuse components: An object which can be used for communication with other pages
		// - oFlexibleColumnLayoutHandler (instance of FlexibleColumnLayoutHandler) only available if App runs in FCL. Added by function fnStartupRouter of routingHelper
		// - routeViewLevel1 an object containing information about the route to the main object. Properties are pattern and name.
		//                   Added by function createRoute of routingHelper.

		oTemplateContract.oValidationMessageBinding.attachChange(jQuery.noop); // initialization step required by UI5

		var oApplicationController; // instance of sap.ui.generic.app.ApplicationController
		var oNavigationController; // instance of NavigationController
		var fnDeregister; // function to be called to deregister at TemplateContract

		// Begin: Private helper methods called in init

		// This function instantiates the global private model that can be used as named model with name  _templPrivGlobal in all views and fragments.
		// Note: Only data which is shared across more than one page should be stored in this model.
		// Data which is used on one page only should be stored in the private model of the corresponding component.
		// Moreover, only data used for declarative binding should be stored in this model.
		// Data which is global, but is only needed in javascript coding, should be stored either in oTemplateContract or as instance variable in one
		// of the global helper classes (e.g. Application).
		// The content of this model may contain several 'sections'. The section with path '/generic' is already instantiated here.
		// Currently it is the only section being used.
		// The generic section contains the three parameters found below. Moreover, it contains two subsections, namely:
		// - FCL: only used in case the App runs in FCL. In this case the FlexibleColumnLayoutHandler instantiates and maintains this subsection
		// - messagePage: is used to control the MessagePage. It is set on demand by the NavigationController.
		function createGlobalTemplateModel(){
			var oParsingSerive = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("URLParsing");
			oTemplateContract.oTemplatePrivateGlobalModel.setProperty("/generic", {
					// information whether cross app navigation is supported
					crossAppNavSupport: !!oParsingSerive && oParsingSerive.isIntentUrl(document.URL),
					// Since draft saving is done globally, there is a global state which applies to all DraftIndicators
					draftIndicatorState: DraftIndicatorState.Clear,
					// if the ShellService is unavailable some of its tasks have to be done by ourselves. Assume that this is not the case.
					shellServiceUnavailable: false,
					// experimental: not yet used
					forceFullscreenCreate: false
			});
			oAppComponent.setModel(oTemplateContract.oTemplatePrivateGlobalModel, "_templPrivGlobal");
			oTemplateContract.oShellServicePromise.catch(function(){
				// it turns out that the ShellService is not available
				oTemplateContract.oTemplatePrivateGlobalModel.setProperty("/generic/shellServiceUnavailable", true);
			});
		}

		function attachToApplicationController() {
			oApplicationController.attachEvent("beforeSideEffectExecution", function (oEvent) {
				if (oEvent.getParameter("valueChange") || oEvent.getParameter("fieldControl")) {
					var oPromise = oEvent.getParameter("promise");
					oTemplateContract.oBusyHelper.setBusy(oPromise);
					var i = 0;
					for (; oTemplateContract.aRunningSideEffectExecutions[i]; ){
						i++;
					}
					oTemplateContract.aRunningSideEffectExecutions[i] = oPromise;
					var fnRemovePromise = function(){
						oTemplateContract.aRunningSideEffectExecutions[i] = null;
					};
					oPromise.then(fnRemovePromise, fnRemovePromise);
				}
			});

			var oTemplatePrivateGlobal = oAppComponent.getModel("_templPrivGlobal");
			var sDraftIndicatorState = "/generic/draftIndicatorState";

			oApplicationController.attachBeforeQueueItemProcess(function (oEvent) {
				if (oEvent.draftSave) {
					oTemplatePrivateGlobal.setProperty(sDraftIndicatorState, DraftIndicatorState.Saving);
				}
			});
			oApplicationController.attachOnQueueCompleted(function () {
				if (oTemplatePrivateGlobal.getProperty(sDraftIndicatorState) === DraftIndicatorState.Saving) {
					oTemplatePrivateGlobal.setProperty(sDraftIndicatorState, DraftIndicatorState.Saved);
				}
			});
			oApplicationController.attachOnQueueFailed(function () {
				if (oTemplatePrivateGlobal.getProperty(sDraftIndicatorState) === DraftIndicatorState.Saving) {
					oTemplatePrivateGlobal.setProperty(sDraftIndicatorState, DraftIndicatorState.Clear);
				}
			});

			oTemplatePrivateGlobal.setProperty("/generic/appComponentName", oAppComponent.getMetadata().getComponentName());
		}

		// End private helper methods called in init

		// Begin: Implementation of standard lifecycle methods

		function init(){
			var oAppRegistryEntry = {
				appComponent: oAppComponent,
				oTemplateContract: oTemplateContract,
				application: new Application(oTemplateContract),
				oViewDependencyHelper: new ViewDependencyHelper(oTemplateContract)
			};
			oTemplateContract.oViewDependencyHelper = oAppRegistryEntry.oViewDependencyHelper;
			var oShellServiceFactory = sap.ui.core.service.ServiceFactoryRegistry.get("sap.ushell.ui5service.ShellUIService");
			oTemplateContract.oShellServicePromise = (oShellServiceFactory && oShellServiceFactory.createInstance()) || Promise.reject();
			oTemplateContract.oShellServicePromise.catch(function(){
				jQuery.sap.log.warning("No ShellService available");
			});
			(UIComponent.prototype.init || jQuery.noop).apply(oAppComponent, arguments);
			oTemplateContract.oBusyHelper.setBusy(oTemplateContract.oShellServicePromise);
			fnDeregister = fnRegisterAppComponent(oAppRegistryEntry);

			var oModel = oAppComponent.getModel();
			// workaround until Modules Factory is available
			oApplicationController = new ApplicationController(oModel);
			createGlobalTemplateModel();
			oNavigationController = new NavigationController(oTemplateContract);

			attachToApplicationController();
			CRUDHelper.enableAutomaticDraftSaving(oTemplateContract);

			// Error handling for erroneous metadata request
			// TODO replace access to oModel.oMetadata with official API call when available (recheck after 03.2016)
			// TODO move error handling to central place (e.g. create new MessageUtil.js)
			if ( (!oModel.oMetadata || !oModel.oMetadata.isLoaded()) || oModel.oMetadata.isFailed()) {
				oModel.attachMetadataFailed(function() {
					oNavigationController.navigateToMessagePage({
						title: getText("ST_GENERIC_ERROR_TITLE"),
						text: getText("ST_GENERIC_ERROR_SYSTEM_UNAVAILABLE"),
						icon: "sap-icon://message-error",
						description: getText("ST_GENERIC_ERROR_SYSTEM_UNAVAILABLE_DESC")
					});
					/* When the application's OData service's metadata document
					 * can't be retrieved or loaded, then none of children components
					 * can load. It is therefore important to look through those components
					 * and resolve their promises to register themselves with a view. */
					for (var childComponent in oTemplateContract.componentRegistry) {
						oTemplateContract.componentRegistry[childComponent].fnViewRegisteredResolve(true);
					}
				});
			}
			oTemplateContract.oBusyHelper.setBusyReason("initAppComponent", false);
		}

		function createContent(){
			// Method must only be called once
			if (oTemplateContract.oNavigationHost){
				return "";
			}
			if (oTemplateContract.sRoutingType === "f"){
				var oFCL = new FlexibleColumnLayout();
				oTemplateContract.oNavigationHost = oFCL;
				oTemplateContract.aNavigationObservers = [
					new ProcessObserver({
						processName: "BeginColumnNavigation",
						eventHandlers: {
							attachProcessStart: oFCL.attachBeginColumnNavigate.bind(oFCL),
							attachProcessStop: oFCL.attachAfterBeginColumnNavigate.bind(oFCL)
					}}),
					new ProcessObserver({
						processName: "MidColumnNavigation",
						eventHandlers: {
							attachProcessStart: oFCL.attachMidColumnNavigate.bind(oFCL),
							attachProcessStop: oFCL.attachAfterMidColumnNavigate.bind(oFCL)
					}}), new ProcessObserver({
						processName: "EndColumnNavigation",
						eventHandlers: {
							attachProcessStart: oFCL.attachEndColumnNavigate.bind(oFCL),
							attachProcessStop: oFCL.attachAfterEndColumnNavigate.bind(oFCL)
					}})
				];
				oTemplateContract.oNavigationObserver = new ProcessObserver({
					processObservers: oTemplateContract.aNavigationObservers
				});
				oTemplateContract.aHeaderLoadingObservers = [compoundObserver(), compoundObserver(), compoundObserver()];
			} else {
				var oNavContainer = new NavContainer({
					id: oAppComponent.getId() + "-appContent"
				});
				oTemplateContract.oNavigationHost = oNavContainer;
				oTemplateContract.oNavigationObserver = new ProcessObserver({
					processName: "Navigation",
					eventHandlers: {
						attachProcessStart: oNavContainer.attachNavigate.bind(oNavContainer),
						attachProcessStop: oNavContainer.attachAfterNavigate.bind(oNavContainer)
				}});
			}
			oTemplateContract.oHeaderLoadingObserver = new ProcessObserver({
				processObservers: oTemplateContract.aHeaderLoadingObservers || []
			});
			oTemplateContract.oPagesDataLoadedObserver = new ProcessObserver({
				processObservers: [oTemplateContract.oHeaderLoadingObserver, oTemplateContract.oNavigationObserver]
			});
			oTemplateContract.oNavigationHost.addStyleClass(oTemplateContract.oApplicationProxy.getContentDensityClass());
			oTemplateContract.oBusyHelper = new BusyHelper(oTemplateContract);
			oTemplateContract.oBusyHelper.setBusyReason("initAppComponent", true, true);
			return oTemplateContract.oNavigationHost;
		}

		function exit() {
			if (oTemplateContract.oNavigationHost) {
				oTemplateContract.oNavigationHost.destroy();
			}
			if (oApplicationController) {
				oApplicationController.destroy();
			}
			if (oNavigationController) {
				oNavigationController.destroy();
			}
			if (oTemplateContract.oValidationMessageBinding){
				oTemplateContract.oValidationMessageBinding.destroy();
			}
			(UIComponent.prototype.exit || jQuery.noop).apply(oAppComponent, arguments);
			fnDeregister();
			testableHelper.endApp(oAppId); // end of productive App
		}

		// End: Implementation of standard lifecycle methods

		function pagesMap2Array(input) {
			var output = Object.keys(input).map(function(key) {
				var page = input[key];
				//add the key to the array for reference
				//page["id"] = key;
				//Recursive call for nested pages
				if (page.pages) {
					page.pages = pagesMap2Array(page.pages);
				}
				return input[key];
			});
			return output;
		}
		
		// This is a temporary solution. It maps routing information onto 'virtual OData information', since the implementation currently
		// derives routing information only from OData information.
		function fnNormalizeRoutingInformation(aPages){
			if (!aPages){
				return;
			}
			for (var i = 0; i < aPages.length; i++){
				var oPage = aPages[i];
				if (oPage.routingSpec && oPage.routingSpec.noOData){
					oPage.entitySet = oPage.routingSpec.routeName;
					oPage.navigationProperty = oPage.routingSpec.routeName;
				}
				fnNormalizeRoutingInformation(oPage.pages);
				if (oPage.embeddedComponents){
					for (var sComponentId in oPage.embeddedComponents){
						var oEmbeddedComponent = oPage.embeddedComponents[ sComponentId];
						fnNormalizeRoutingInformation(oEmbeddedComponent.pages);
					}
				}
				fnNormalizeRoutingInformation(oPage.implementingComponent && oPage.implementingComponent.pages);
			}
		}

		var oConfig; // initialized on demand
		function getConfig() {
			if (!oConfig) {
				var oMeta = oAppComponent.getMetadata();
				oConfig = oMeta.getManifestEntry("sap.ui.generic.app");
				//Version 1.3.0 is made only to have a map in the app. descriptor with the runtime that accepts only pages
				//Background for the map are appdescriptor variants which are based on changes on an app. descriptor
				//Arrays don't work for changes as they do not have a stable identifier besides the position (index)
				//Once we have a runtime that accepts a map we need to increase the version to higher than 1.3.0 e.g. 1.4.0
				if (oConfig._version === "1.3.0" && oConfig.pages && jQuery.isPlainObject(oConfig.pages)) {
					oConfig.pages = pagesMap2Array(oConfig.pages);
				}
				fnNormalizeRoutingInformation(oConfig.pages);
			}
			return oConfig;
		}

		var oInternalManifest;  // initialized on demand
		function getInternalManifest() {
			if (!oInternalManifest) {
				//We need to copy the original manifest due to read-only settings of the object
				oInternalManifest = jQuery.extend({}, oAppComponent.getMetadata().getManifest());
				//Overwrite the part with our app. descriptor (see getConfig)
				oInternalManifest["sap.ui.generic.app"] = getConfig();
			}
			return oInternalManifest;
		}

		function getRouterClassName(){
			var oManifestObject = oAppComponent.getManifestObject();
			var oSettings = oManifestObject.getEntry("sap.ui.generic.app").settings;
			oTemplateContract.sRoutingType = (oSettings && oSettings.flexibleColumnLayout) ? "f" : "m";
			return "sap." + oTemplateContract.sRoutingType + ".routing.Router";
		}

		return {
			init: init,
			createContent: createContent,
			exit: exit,
			_getRouterClassName: getRouterClassName,
			getConfig: getConfig,
			getInternalManifest: getInternalManifest,

			getTransactionController: function() {
				return oApplicationController.getTransactionController();
			},

			getApplicationController: function() {
				return oApplicationController;
			},

			/*
			 * Returns the reference to the navigation controller instance that has been created by AppComponent.
			 *
			 * @returns {sap.suite.ui.generic.template.lib.NavigationController} the navigation controller instance
			 * @public
			 */
			getNavigationController: function() {
				return oNavigationController;
			}
		};
	}

	return UIComponent.extend("sap.suite.ui.generic.template.lib.AppComponent", {
		metadata: {
			config: {
				title: "SAP UI Application Component", // TODO: This should be set from App descriptor
				fullWidth: true
			},
			properties: {
				forceGlobalRefresh: {
					type: "boolean",
					defaultValue: true
				}
			},
			events: {
				pageDataLoaded: {}
			},
			routing: {
				config: {
					async: true,
					viewType: "XML",
					viewPath: "",
					clearTarget: false
				},
				routes: [],
				targets: []
			},
			library: "sap.suite.ui.generic.template"
		},

		constructor: function() {
			var oAppId = testableHelper.startApp(); // suppress access to private methods in productive coding
			jQuery.extend(this, getMethods(this, oAppId));
			(UIComponent.prototype.constructor || jQuery.noop).apply(this, arguments);
		}
	});
});