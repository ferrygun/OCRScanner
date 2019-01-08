/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

sap.ui.define([
	"jquery.sap.global",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/resource/ResourceModel",
	"sap/fe/core/TemplateComponent",
	"sap/fe/core/internal/testableHelper",
	"sap/fe/core/TemplateUtils"
], function (jQuery, Controller, JSONModel, ResourceModel, TemplateComponent, testableHelper, TemplateUtils) {
	"use strict";

	var mAppRegistry = {};
	var mControllerRegistry = {};

	// This function is handed over to class AppComponent. The variable will be set to null, once this has happened.
	// oAppRegistryEntry is a registry entry for the AppComponent. When it is registered it contains the following properties:
	// - appComponent: the AppComponent to be registered
	// - oTemplateContract: the TemplateContract for this App, as described in AppComponent
	// This function returns a function that can be used to deregister the AppComponent from the registry when it is exited.
	var fnRegisterAppComponent = function (oAppRegistryEntry) {
		var sAppComponentId = oAppRegistryEntry.appComponent.getId();
		mAppRegistry[sAppComponentId] = oAppRegistryEntry;
		return function () {
			delete mAppRegistry[sAppComponentId];
		};
	};

	function getAppRegistryEntry(oAppComponent) {
		var sAppComponentId = oAppComponent.getId();
		var oRet = mAppRegistry[sAppComponentId];
		return oRet;
	}

	function getComponentRegistryEntry(oComponent) {
		return getAppRegistryEntry(oComponent.getAppComponent()).oTemplateContract.componentRegistry[oComponent.getId()];
	}

	function getTemplateViewController(getMethods, sControllerName, oControllerDefinition, oTemplateUtils, oAppRegistryEntry) {
		oControllerDefinition = oControllerDefinition || {};

		oControllerDefinition.constructor = function () {
			Controller.prototype.constructor.apply(this, arguments);
			var oMethods = getMethods(oTemplateUtils, this);
			this._templateEventHandlers = Object.freeze(oMethods.handlers || {});
			this._templateFormatters = Object.freeze(oMethods.formatters || {});
			this.extensionAPI = Object.freeze(oMethods.extensionAPI || {});
			this.fnGenericOnInit = function (oController) {
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

				(oMethods.onInit || jQuery.noop)();
				// Note: This relies on the fact, that there is a 1-1 relationship between TemplateView and
				// TemplateComponent.
				// If we introduce Templates using more then one view, this must be reworked.
				oComponentRegistryEntry.oController = this;
				oComponentRegistryEntry.fnViewRegisteredResolve();
				delete oComponentRegistryEntry.fnViewRegisteredResolve;
			};
		};

		oControllerDefinition.onInit = function () {
			this.fnGenericOnInit(this);
			delete this.fnGenericOnInit;
		};

		oControllerDefinition.onExit = function () {
			var sViewId = this.getView().getId();
			var oControllerRegistryEntry = mControllerRegistry[sViewId];
			// TODO Marcel: destroy view is not implemented but seems to be not needed for now
			//oControllerRegistryEntry.oAppRegistryEntry.oTemplateContract.oApplicationProxy.destroyView(sViewId);
			oControllerRegistryEntry.onExit();
			delete mControllerRegistry[sViewId];
			jQuery.sap.log.info("View " + sViewId + " of template " + sControllerName + " exited");
		};

		return Controller.extend(sControllerName, oControllerDefinition);
	}

	function fnGetViewControllerCreator(oComponentRegistryEntry) {
		var oControllerSpecification = oComponentRegistryEntry.methods.oControllerSpecification;
		return oControllerSpecification && function () {
				var oAppComponent = oComponentRegistryEntry.oComponent.getAppComponent();
				var oAppRegistryEntry = getAppRegistryEntry(oAppComponent);

				return getTemplateViewController(oControllerSpecification.getMethods, oComponentRegistryEntry.oComponent.getTemplateName(), oControllerSpecification.oControllerDefinition, oComponentRegistryEntry.oTemplateUtils, oAppRegistryEntry);
			};
	}

	fnRegisterAppComponent = testableHelper.testableStatic(fnRegisterAppComponent, "TemplateComponent_RegisterAppComponent");

	return {
		// This method assembles a Template that can be used in Fiori Elements applications.
		// Thereby, getMethods, sComponentName, and oComponentDefinition describe the behaviour of the component in detail.
		// More precisely the meaning of the parameters is as follows:
		// - sComponentName is the name of the component that realizes the Template. More precisely it describes the path (.-separated)
		//   to a folder which contains a file Component.js which is built using this function.
		// - oComponentDefinition is an object containing a property metadata which contains the metadata for the TemplateComponent realizing the Template.
		// - getMethods is a function that will be called once for each instance of the Template to be assembled.
		//   The parameters passed to this function are oComponent and oTemplateUtils
		//   ~ oComponent is the instance of class TemplateComponent that is created (can be considered as 'this')
		//   ~ oTemplateUtils is an instance of class TemplateUtils that provides certain reusable tasks
		//   the return value of getMethods must be an object possessing the following (optional) properties:
		//   ~ init: a function that serves as init for the component. Note that it is not necessary to call init of a superclass
		//   ~ onActivate: not yet implemented
		//   ~ onDeactivate: not yet implemented
		//   ~ refreshBinding: not yet implemented
		//   ~ updateBindingContext: a function that is called when a new binding context is available for the Template instance.
		//     Note that when switching to change (edit or create) this method will only be called in draft scenarios, since in non-draft scenarios
		//     no binding context from the backend is retrieved.
		//   ~ oControllerSpecification: an object specifying the controller for the view realizing this Template.
		//     For more details see comments at function fnGetViewControllerCreator
		getTemplateComponent: function (getMethods, sComponentName, oComponentDefinition) {
			var sComponentNameFull = sComponentName + ".Component";
			oComponentDefinition = oComponentDefinition || {};

			oComponentDefinition.init = function () {
				var oComponentRegistryEntry = this.getComponentData().registryEntry;
				oComponentRegistryEntry.viewRegistered = new Promise(function (fnResolve) {
					oComponentRegistryEntry.fnViewRegisteredResolve = fnResolve;
				});
				oComponentRegistryEntry.oViewRenderedPromise = new Promise(function (fnResolve) {
					oComponentRegistryEntry.fnViewRenderedResolve = fnResolve;
				});
				(TemplateComponent.prototype.init || jQuery.noop).apply(this, arguments);
				oComponentRegistryEntry.componentName = sComponentNameFull;
				oComponentRegistryEntry.oComponent = this;

				oComponentRegistryEntry.methods = getMethods(this, oComponentRegistryEntry.oTemplateUtils) || {};

				(oComponentRegistryEntry.methods.init || jQuery.noop)();
			};

			oComponentDefinition.preTemplater = function (mParameters) {
				var oComponentRegistryEntry = getComponentRegistryEntry(this);
				if (oComponentRegistryEntry.methods.preTemplater) {
					return oComponentRegistryEntry.methods.preTemplater(mParameters, oComponentRegistryEntry.oTemplateUtils);
				} else {
					return Promise.resolve();
				}
			};

			oComponentDefinition.preTemplaterReject = function (oError) {
				var oComponentRegistryEntry = getComponentRegistryEntry(this);

				// Resolve view registered promise to disable busy handling
				oComponentRegistryEntry.fnViewRegisteredResolve();

				oComponentRegistryEntry.oTemplateUtils.getNavigationController().navigateToMessagePage({
					text: "Application could not be started due to technical issues.",
					description: oError.message
				});
			};

			oComponentDefinition.exit = function () {
				var sId = this.getId();
				var oComponentRegistryEntry = getComponentRegistryEntry(this);
				var oAppRegistryEntry = getAppRegistryEntry(this.getAppComponent());
				var oMethods = oComponentRegistryEntry.methods;
				(oMethods.exit || jQuery.noop)();
				delete oAppRegistryEntry.oTemplateContract.componentRegistry[sId];
				(TemplateComponent.prototype.exit || jQuery.noop).apply(this, arguments);
			};

			oComponentDefinition.onBeforeRendering = function () {
				var oComponentRegistryEntry = getComponentRegistryEntry(this);
				(TemplateComponent.prototype.onBeforeRendering || jQuery.noop).bind(this, oComponentRegistryEntry).apply(this, arguments);
				var oMethods = oComponentRegistryEntry.methods;
				(oMethods.onBeforeRendering || jQuery.noop)();
			};

			oComponentDefinition.onAfterRendering = function () {
				var oComponentRegistryEntry = getComponentRegistryEntry(this);
				if (oComponentRegistryEntry.fnViewRenderedResolve && !oComponentRegistryEntry.fnViewRegisteredResolve) {
					oComponentRegistryEntry.fnViewRenderedResolve();
					delete oComponentRegistryEntry.fnViewRenderedResolve;
				}
				(TemplateComponent.prototype.onAfterRendering || jQuery.noop).bind(this, oComponentRegistryEntry).apply(this, arguments);
				var oMethods = oComponentRegistryEntry.methods;
				(oMethods.onAftereRendering || jQuery.noop)();
			};

			oComponentDefinition.setContainer = function () {
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

					oAppRegistryEntry.oTemplateContract.oBusyHelper.setBusy(oComponentRegistryEntry.viewRegistered, true);

					oComponentRegistryEntry.oTemplateUtils = new TemplateUtils(oComponentRegistryEntry, oAppRegistryEntry.oTemplateContract);

					oComponentRegistryEntry.createViewController = fnGetViewControllerCreator(oComponentRegistryEntry);
					(oComponentRegistryEntry.methods.setContainer || jQuery.noop)();
				}
			};

			// not yet implemented and needed
			oComponentDefinition.onActivate = jQuery.noop;
			oComponentDefinition.onDeactivate = jQuery.noop;
			oComponentDefinition.refreshBinding = jQuery.noop;

			return TemplateComponent.extend(sComponentNameFull, oComponentDefinition);
		},

		// This method is called by class AppComponent when it is initialized. It hands over a registration method to this class.
		// This registration method can be used to register an AppComponent in the central AppComponentRegistry handled by this class.
		// See fnRegisterAppComponent for details.
		// Note that getRegisterAppComponent can only be called once.
		getRegisterAppComponent: function () {
			var fnRet = fnRegisterAppComponent;
			fnRegisterAppComponent = null;
			return fnRet;
		}
	};
});

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */
