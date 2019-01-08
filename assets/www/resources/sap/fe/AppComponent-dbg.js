/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

// ----------------------------------------------------------------------------------
// Provides base class sap.fe.AppComponent for all generic app components
// ----------------------------------------------------------------------------------
sap.ui.define([
	"jquery.sap.global",
	"sap/ui/core/UIComponent",
	"sap/m/NavContainer",
	"sap/fe/core/BusyHelper",
	"sap/fe/core/TemplateAssembler",
	"sap/ui/core/ComponentContainer",
	"sap/fe/core/internal/testableHelper",
	"sap/fe/model/DraftModel",
	"sap/fe/model/NamedBindingModel",
	"sap/fe/controller/NavigationController"
], function (jQuery,
			 UIComponent,
			 NavContainer,
			 BusyHelper,
			 TemplateAssembler,
			 ComponentContainer,
			 testableHelper,
			 DraftModel,
			 NamedBindingModel,
			 NavigationController) {
	"use strict";

	var fnRegisterAppComponent = TemplateAssembler.getRegisterAppComponent(); // Retrieve the possibility to register at TemplateAssembler

	var bCreateFirstPage = true;
	testableHelper.testableStatic(function() {
		bCreateFirstPage = false;
	}, "suppressPageCreation");

	function getMethods(oAppComponent, oTemplateContract) {
		// initialized on demand
		var oConfig;
		var fnDeregister; // function to be called to deregister at TemplateContract

		// // template contract which is used for data interchange between framework classes
		var oTemplateContract = {
			oAppComponent: oAppComponent, // reference to this application component

			// registry for all TemplateComponents instantiated in the context of this App
			// maps the ids of these components on an object (called registry entry)
			// They are inserted into the registry in method setContainer of TemplateComponent which can actually be found in TemplateAssembler
			// each entry of the component registry contains the following information:
			//		- oComponent : the component instance
			//		- componentName : name of the component
			//		- methods : methods of the component

			//		- methods.oControllerSpecification - specification of template view controller
			//		- createViewController - create template view controller
			//		- oController - template view controller
			//		- ControllerRegistryEntry - registry entry of template view controllers
			//			- onExit
			//			- oTemplateUtils
			//			- oAppRegistryEntry

			//		- viewRegistered : Promise which is resolved once the view is registered
			//		- fnViewRegisteredResolve : function to resolve the viewRegistered promise, deleted after usage

			//		- oViewRenderedPromise : Promise which is resolved once the view is rendered
			//		- fnViewRenderedResolve : function to resolve the oViewRenderedPromise promise, deleted after usage

			//		- componentCreateResolve : function which is called once the component is created
			componentRegistry: {},

			oBusyHelper: null, // instantiated in createContent
			oMessageUtils: null, // instantiated in templateUtils on demand
			oActionController: null, // instantiated in templateUtils on demand
			oCommonUtils: null, // instantiated in templateUtils on demand
			// oTemplatePrivateGlobalModel: (new JSONModel()).setDefaultBindingMode("TwoWay")

			aAppStateChangedListener: [], // listeners to the app state changed event

			getNavigationController: function () {
				// in case anything happens before the templateUtils are created we need to allow access to the navigation controller
				return new NavigationController(oTemplateContract);
			}

		};

		function getText(sId) {
			var oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.fe");
			return oResourceBundle.getText(sId);
		}

		function createPageComponentContainer(sEntitySet, oConfig) {
			var sComponent = 'sap.fe.templates.' + oConfig.template,
				oSettings = {
					entitySet: sEntitySet,
					componentData: {
						preprocessorsData: {},
						registryEntry: {
							componentCreateResolve: jQuery.noop,
							viewLevel: 1
						}
					}
				};

			if (oConfig.settings) {
				// consider component specific settings from app descriptor
				jQuery.extend(oSettings, oConfig.settings);
			}

			var oPage = null;
			oAppComponent.runAsOwner(function(){
				 oPage = new ComponentContainer({
					name: sComponent,
					propagateModel: true,
					width: "100%",
					height: "100%",
					handleValidation: true,
					settings: oSettings
				});
			});
			return oPage;
		}

		testableHelper.testable({
			createPageComponentContainer: createPageComponentContainer,
			appComponent: oAppComponent
		}, "templateTester");

		function createFirstPage() {
			var oConfig = getConfig();
			var oPageConfigs,
				oDefaultPageConfig,
				oStartPage,
				aTargetParts,
				sEntitySet,
				sIntent;

			function wrongConfiguration(){
				return oTemplateContract.getNavigationController().navigateToMessagePage({
					text: getText("SAPFE_APPSTART_TECHNICAL_ISSUES"),
					description: getText("SAPFE_APPSTART_WRONG_CONFIGURATION")
				});
			}

			if (!oConfig ||  !oConfig.entitySets || !oConfig.navigation) {
				return wrongConfiguration();
			}

			for (var p in oConfig.navigation){
				if (oConfig.navigation[p].isStartPage){
					if (oStartPage){
						// having more than one start page is not allowed
						return wrongConfiguration();
					} else {
						oStartPage = oConfig.navigation[p];
					}
				}

			}

			if (!oStartPage || !oStartPage.target){
				return wrongConfiguration();
			}

			aTargetParts = oStartPage.target.split("/");

			if (aTargetParts.length !== 2){
				// currently we support only accessing directly the feed
				return wrongConfiguration();
			}

			sEntitySet = aTargetParts[0];
			sIntent = aTargetParts[1];

			if (sIntent !== "feed"){
				// currently we support only feed as target
				return wrongConfiguration();
			}

			oPageConfigs = oConfig.entitySets[sEntitySet][sIntent];

			if (!oPageConfigs || !oPageConfigs.default){
				// currently only the default config is supported
				return wrongConfiguration();
			}

			oDefaultPageConfig = oPageConfigs.default;

			if (!oDefaultPageConfig.template){
				// currently we support only specifying a template name
				return wrongConfiguration();
			}

			if (oDefaultPageConfig.template !== 'ListReport'){
				// currently we support only the List Report
				return wrongConfiguration();
			}
			try {
				var oPage = createPageComponentContainer(sEntitySet, oDefaultPageConfig);
				oTemplateContract.oNavContainer.addPage(oPage);
				var oRouter = oAppComponent.getRouter();

				oRouter.attachRoutePatternMatched(function (oEvent) {
					if (oEvent.getParameters().name === "root") {
						// no inner app state used
						oTemplateContract.oInnerAppStatePromise.resolve();

						if (oTemplateContract.oAppState) {
							// the app had an app state but navigated back to the initial route, we need to clean up the appstate
							oTemplateContract.oAppState = null;
							oTemplateContract.oAppStateModel.setData({});
							// fire app state change event
							for (var i = 0; i < oTemplateContract.aAppStateChangedListener.length; i++) {
								oTemplateContract.aAppStateChangedListener[i]();
							}
						}


					} else {
						var sInnerAppStateKey = oEvent.getParameters().arguments.iAppState;

						if (oTemplateContract.oAppState && sInnerAppStateKey === oTemplateContract.oAppState.getKey()) {
							// the app state was set by the app
							oTemplateContract.oInnerAppStatePromise.resolve();
							return;
						}

						// we must apply the inner App State *after* treating CrossAppState (x-app-state), reset InnerAppStatePromise
						//oTemplateContract.oCrossAppStatePromise.done(function () {
						sap.ushell.Container.getService("CrossApplicationNavigation").getAppState(oAppComponent, sInnerAppStateKey).done(function (oStartupInnerAppState) {
							oTemplateContract.oAppState = oStartupInnerAppState;
							updateAppStateModel(oTemplateContract.oAppStateModel, oStartupInnerAppState);
							oTemplateContract.oInnerAppStatePromise.resolve();

							// fire app state change event
							for (var i = 0; i < oTemplateContract.aAppStateChangedListener.length; i++) {
								oTemplateContract.aAppStateChangedListener[i]();
							}
						});
						//});
					}
				});

				oRouter.initialize();
			} catch (e) {
				oTemplateContract.getNavigationController().navigateToMessagePage({
					text: getText("SAPFE_APPSTART_TECHNICAL_ISSUES"),
					description: getText("SAPFE_APPSTART_WRONG_CONFIGURATION")
				});
			}
		}

		function getConfig() {
			if (!oConfig) {
				var oMeta = oAppComponent.getMetadata();
				oConfig = oMeta.getManifestEntry("sap.fe");
			}
			return oConfig;
		}

		function updateAppStateModel(oAppStateModel, oAppState) {
			var oData = oAppState.getData();

			if (oData && (JSON.stringify(oData) !== JSON.stringify(oAppStateModel.getProperty("/"))) && oAppStateModel) {
				oAppStateModel.setProperty("/", oData);
				return true;
			}
			return false;
		}

		return {
			init: function () {
				var oAppRegistryEntry = {
					appComponent: oAppComponent,
					oTemplateContract: oTemplateContract
				};
				var oShellServiceFactory = sap.ui.core.service.ServiceFactoryRegistry.get("sap.ushell.ui5service.ShellUIService");
				oTemplateContract.oShellServicePromise = (oShellServiceFactory && oShellServiceFactory.createInstance()) || Promise.reject();
				oTemplateContract.oShellServicePromise.catch(function () {
					jQuery.sap.log.warning("No ShellService available");
				});

				/* as the cross app state is not yet defined and supported the crossappstate coding is kept but deactivated
				 oTemplateContract.oCrossAppStatePromise = new jQuery.Deferred(); // Done when startup CrossAppState has been transferred into the model
				 sap.ushell.Container.getService("CrossApplicationNavigation").getStartupAppState(oAppComponent).done(function (oStartupCrossAppState) {
				 updateAppStateModel(oTemplateContract.oAppStateModel, oStartupCrossAppState);
				 oTemplateContract.oCrossAppStatePromise.resolve();
				 });
				 */

				oTemplateContract.oInnerAppStatePromise = new jQuery.Deferred(); // Done when above and startup InnerAppState transferred into the model

				// create AppState Model
				oTemplateContract.oAppStateModel = new sap.ui.model.json.JSONModel();

				// as the cross app state is not yet defined and supported we skip this coding and resolve the promise immediately
				// sap.ushell.Container.getService("CrossApplicationNavigation").getStartupAppState(oAppComponent).done(function (oStartupCrossAppState) {
				// 	updateAppStateModel(oTemplateContract.oAppStateModel, oStartupCrossAppState);
				// 	oTemplateContract.oCrossAppStatePromise.resolve();
				// });

				var oModel = oAppComponent.getModel();
				if (oModel) {
					// upgrade the model to a named binding model
					NamedBindingModel.upgrade(oModel).then(function() {

						// we call the UIComponent init once we upgraded our model to a named binding model
						(UIComponent.prototype.init || jQuery.noop).apply(oAppComponent, arguments);

						oTemplateContract.oBusyHelper.setBusy(oTemplateContract.oShellServicePromise);
						fnDeregister = fnRegisterAppComponent(oAppRegistryEntry);
						oTemplateContract.oBusyHelper.setBusyReason("initAppComponent", false);

						// Test if draft Model
						DraftModel.isDraftModel(oModel).then(function (bIsDraft) {
							if (bIsDraft) {
								// service contains a draft entity therefore upgrade the model to a draft model
								DraftModel.upgrade(oModel).then(function () {
									oAppComponent.setModel(oModel.getDraftAccessModel(), "$draft");
								});
							}
						});
					});

					// Error handling for erroneous metadata request
					oModel.getMetaModel().requestObject("/$EntityContainer/").catch(function (oError) {
						oTemplateContract.getNavigationController().navigateToMessagePage({
							text: getText("SAPFE_APPSTART_TECHNICAL_ISSUES"),
							description: oError.message
						});

						/* When the application's OData service's metadata document
						 * can't be retrieved or loaded, then none of children components
						 * can load. It is therefore important to look through those components
						 * and resolve their promises to register themselves with a view. */
						for (var childComponent in oTemplateContract.componentRegistry) {
							oTemplateContract.componentRegistry[childComponent].fnViewRegisteredResolve();
						}
					});
				}
			},
			exit: function () {
				if (oTemplateContract.oNavContainer) {
					oTemplateContract.oNavContainer.destroy();
				}
				fnDeregister();
			},
			createContent: function () {
				// Method must only be called once
				if (oTemplateContract.oNavContainer) {
					return "";
				}

				oTemplateContract.oNavContainer = new NavContainer({
					id: oAppComponent.getId() + "-appContent"
				});

				oTemplateContract.oBusyHelper = new BusyHelper(oTemplateContract);
				oTemplateContract.oBusyHelper.setBusyReason("initAppComponent", true, true);

				// as long as we don't introduce the navigation controller again we create the first page directly
				if (bCreateFirstPage) {
					createFirstPage();
				}

				return oTemplateContract.oNavContainer;
			}
		};
	}

	return UIComponent.extend("sap.fe.AppComponent", {
		metadata: {
			config: {
				fullWidth: true
			},
			events: {
				pageDataLoaded: {}
			},
			routing: {
				config: {},
				routes: [
					{
						pattern: "",
						name: "root"
					},
					{
						pattern: "?sap-iapp-state={iAppState}",
						name: "rootWithAppState"
					}],
				targets: []
			},
			library: "sap.fe"
		},

		constructor: function () {
			var oAppId = testableHelper.startApp(); // suppress access to private methods in productive coding
			jQuery.extend(this, getMethods(this, oAppId));

			(UIComponent.prototype.constructor || jQuery.noop).apply(this, arguments);
		}
	});
});
