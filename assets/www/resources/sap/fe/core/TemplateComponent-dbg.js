/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

jQuery.sap.require("sap.ui.core.CustomizingConfiguration");
(function () {
	"use strict";

	sap.ui.define([
		"jquery.sap.global",
		"sap/ui/core/mvc/ViewType",
		"sap/ui/core/UIComponent",
		"sap/ui/model/json/JSONModel",
		"sap/ui/model/resource/ResourceModel",
		"sap/ui/Device"
	], function (jQuery, ViewType, UIComponent, JSONModel, ResourceModel, Device) {

		// This method enhances the i18n model which has been attached to the application component via the manifest
		// For this purpose the following enhancement chain is built:
		// Generic Template texts <- Template specific texts <- Application specific texts
		// the method supports async loading as well as sync loading (and mixtures of both) and returns a promise that is resolved once all necessary bundles are loaded
		// and the enhancement is done

		function fnEnhanceI18nModel(oComponent) {
			var aPromises = [];

			// as long as we can't clone resource models we will create a new instance of a resource model causing additional requests
			//var oI18nModel = oComponent.getModel("sap.fe.i18n");
			//var oI18nModelClone = jQuery.extend(true, {}, oI18nModel);
			var oI18nModelClone = new ResourceModel({
				bundleName: "sap/fe/messagebundle",
				async: true
			});

			// add promise to load general text resource model
			aPromises.push(oI18nModelClone.getResourceBundle());

			/*
			Currently we don't allow template and application i18n models - once we support them we need to activate this
			coding. we might introduce a library i18n that is allowed to be overwritten by the application as well
			we need to invent a new model name as sap.fe.i18n is already used or rename this one
			// get template and application model
			var oTemplateModel = oComponent.getModel("i18n"), oPromiseTemplateModel;
			var oApplicationModel = oComponent.getAppComponent().getModel("i18n|" + oComponent.getMetadata().getComponentName() + "|" + oComponent.getEntitySet());

			if (oTemplateModel) {
				oPromiseTemplateModel = Promise.resolve(oTemplateModel.getResourceBundle()).then(function (oResourceBundle) {
					return oI18nModelClone.enhance(oResourceBundle);
				});
				aPromises.push(oPromiseTemplateModel);
			}

			if (oApplicationModel) {
				aPromises.push(Promise.resolve(oApplicationModel.getResourceBundle()).then(function (oResourceBundle) {
					return (oPromiseTemplateModel || Promise.resolve()).then(function () {
						return oI18nModelClone.enhance(oResourceBundle);
					});
				}));
			}*/

			Promise.all(aPromises).then(function () {
				oI18nModelClone.getResourceBundle().then(function (oResourceBundle) {
					// as we need the resource bundle in the formatter synchronously and as we take care that the
					// view is not rendered before all bundles are loaded we overwrite the getResourceBundle and
					// return the resource bundle instead of a (resolved) promise
					oI18nModelClone.getResourceBundle = function () {
						return oResourceBundle;
					};

					oComponent.setModel(oI18nModelClone, "sap.fe.i18n");
				});

			});

			return aPromises;
		}

		function fnDetermineStableID(oComponent) {
			// TODO Navigation: the navigation path is missing here - we should create real unique IDs, maybe we can also use the ID specified in the Page settings
			if (oComponent.getAppComponent().getMetadata().getComponentName() === "" || oComponent.getTemplateName() === "" || oComponent.getEntitySet() === "") {
				return false;
			}
			return oComponent.getAppComponent().getMetadata().getComponentName() + "::" + oComponent.getTemplateName() + "::" + oComponent.getEntitySet();
		}

		function createParameterModel(sEntityType, oComponent, oMetaModel) {
			var oSettings = null;
			var oAllSettings = oComponent.getComponentContainer().getSettings(); // this should have all settings passed to the component during creation

			// create settings section in parameter model with all settings passed to
			// the component
			oSettings = jQuery.extend({}, oAllSettings);

			// remove properties not needed or available on the component itself
			delete oSettings.appComponent;
			delete oSettings.entitySet;
			delete oSettings.navigationProperty;

			return new JSONModel({
				entitySet: oComponent.getEntitySet(),
				"sap-ui-debug": window["sap-ui-debug"],
				"settings": oSettings,
				"manifest": oComponent.getAppComponent().getMetadata().getManifest(),
				metaModel: oMetaModel
			});
		}

		/*
		 * Creates the XMLView based on some models.
		 *
		 */
		function createXMLView(oComponentRegistryEntry) {
			var oComponent = oComponentRegistryEntry.oComponent,
				fnCreateViewController = oComponentRegistryEntry.createViewController;
			//fnTemplateSpecificParameters = oComponentRegistryEntry.methods && oComponentRegistryEntry.methods.getTemplateSpecificParameters;
			var oView = null, oViewSettings;
			var oModel = oComponent.getModel();
			var oMetaModel = oModel.getMetaModel();
			var oEntitySet = oMetaModel.getObject("/$EntityContainer/" + oComponent.getEntitySet());
			var sStableId = fnDetermineStableID(oComponent);

			if (!oEntitySet || !sStableId) {
				oComponentRegistryEntry.oTemplateUtils.getNavigationController().navigateToMessagePage(
					{
						text: oComponentRegistryEntry.oTemplateUtils.getText("SAPFE_APPSTART_TECHNICAL_ISSUES"),
						description: oComponentRegistryEntry.oTemplateUtils.getText("SAPFE_APPSTART_WRONG_CONFIGURATION")
					}
				);
				return Promise.reject();
			}

			// TODO Navigation: should this happen at all if we have unique IDs? Couldn't we remove this?
			oView = sap.ui.getCore().byId(sStableId);
			if (oView) {
				jQuery.sap.log.warning("View with ID: " + sStableId + " already exists - old view is getting destroyed now!");
				try {
					oView.destroy();
				} catch (ex) {
					jQuery.sap.log.warning("Error destroying view: " + ex);
				}
				oView = null;
			}

			// device model
			var oDeviceModel = new JSONModel(sap.ui.Device);
			oDeviceModel.setDefaultBindingMode("OneWay");

			// parameter model
			var oParameterModel = createParameterModel(oEntitySet.$Type, oComponent, oMetaModel);

			var oViewPromise = new Promise(function (fnResolve, fnReject) {
				var mPreTemplaterParameters = {
					oParameterModel: oParameterModel.createBindingContext("/")
				};
				var checkTimeStamp = Date.now();

				// Pre PreProcessor to determine cross service navigations
				Promise.all(oComponent.preTemplater(mPreTemplaterParameters)).then(function (context) {
					oComponent.runAsOwner(function () {
						var mCache = null,
							sCacheKey = "",
							mDataSourceETags = oMetaModel.getETags(),
							aUrls = Object.keys(mDataSourceETags).sort(),
							bETagsAreValid = false;

						bETagsAreValid = aUrls.every(function(sUrl) {
							if (mDataSourceETags[sUrl]) {
								if (mDataSourceETags[sUrl].getTime) {
									if (mDataSourceETags[sUrl].getTime() > checkTimeStamp - 60000) {
										//timestamp, but a new one -> not worth using it as cache key
										return false;
									} else {
										//timestamp, but an older one -> worth using it as cache key
										sCacheKey += sUrl + " " + mDataSourceETags[sUrl].getTime() + " ";
										return true;
									}
								} else {
									//ETag -> should be used as cache key
									sCacheKey += sUrl + " " + mDataSourceETags[sUrl] + " ";
									return true;
								}
							} else {
								//no ETag, no last-Modified -> no cache
								return false;
							}
						});
						if (sCacheKey && bETagsAreValid) {
							//cut the last " " from the cache key and hash it
							mCache = { keys: [ jQuery.sap.hashCode(sCacheKey.slice(0, -1)) ] };
						}

						oViewSettings = {
							async: true,
							preprocessors: {
								xml: {
									bindingContexts: {
										entitySet: oMetaModel.createBindingContext("/" + oComponent.getEntitySet())
									},
									models: {
										entitySet: oMetaModel,
										'sap.fe.metaModel': oMetaModel,
										'sap.fe.deviceModel': oDeviceModel,
										parameter: oParameterModel
									},
									preprocessorsData: oComponent.getComponentData().preprocessorsData
								}
							},
							id: sStableId,
							type: ViewType.XML,
							viewName: oComponent.getTemplateName(),
							cache: mCache,
							height: "100%"
						};

						if (fnCreateViewController) {
							var ControllerClass = fnCreateViewController();
							oViewSettings.controller = new ControllerClass();
						}

						oView = sap.ui.view(oViewSettings);
						/* eslint max-nested-callbacks: 0 */
						oView.loaded().then(function (oView) {
							fnResolve(oView);
						}).catch(function (error) {
							oComponentRegistryEntry.oTemplateUtils.getNavigationController().navigateToMessagePage(
								{
									text: oComponentRegistryEntry.oTemplateUtils.getText("SAPFE_APPSTART_TECHNICAL_ISSUES"),
									description: oComponentRegistryEntry.oTemplateUtils.getText("SAPFE_APPSTART_TEMPLATING_ISSUE"),
									technicalMessage: error.message || ( error.messages && error.messages[0] && error.messages[0].text ) || "",
									technicalDetails: error.stack || error
								}
							);
							fnReject(error);
						});
					});
				}).catch(oComponent.preTemplaterReject.bind(oComponentRegistryEntry.oComponent));
			});

			// return oView;
			return oViewPromise;
		}

		return UIComponent.extend("sap.fe.core.TemplateComponent", {

			metadata: {
				properties: {
					/**
					 * Name of template
					 */
					templateName: {
						type: "string",
						defaultValue: null
					},
					/**
					 * Entity Set
					 */
					entitySet: {
						type: "string",
						defaultValue: null
					}
				}
			},

			getAppComponent: function () {
				// search for sap.fe.AppComponent
				var oControl;

				if (!this._oAppComponent) {
					oControl = this.getComponentContainer();
					while (oControl && !(oControl instanceof sap.fe.AppComponent)) {
						oControl = oControl.getParent();
					}
					this._oAppComponent = oControl;
				}

				return this._oAppComponent;
			},

			init: function () {

				(UIComponent.prototype.init || jQuery.noop).apply(this, arguments);

				// TODO: TO be discussed, still one UI model for each component or shall we have one for all?
				var oUIModel = new JSONModel({
					editable: false,
					enabled: false,
					busyControls: {},
					outdatedControls: {}
				});
				this.setModel(oUIModel, "ui");

				var oParsingService = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("URLParsing");

				// TODO Marcel: to be discussed, shall we have the _templPriv again? Should we have one for each template and one global?
				var oTemplatePrivate = new JSONModel({
					generic: {
						crossAppNavSupport: !!oParsingService && oParsingService.isIntentUrl(document.URL),
						draftIndicatorState: sap.m.DraftIndicatorState.Clear,
						listCommons: {
							functionEnabled: {}
						}
					},
					viewLevel: this.getComponentData().registryEntry.viewLevel
				});
				oTemplatePrivate.setDefaultBindingMode("TwoWay");
				this.setModel(oTemplatePrivate, "_templPriv");

			},

			// TODO: clearify with UI5 how to access the component container
			getComponentContainer: function () {
				return this.oContainer;
			},

			onBeforeRendering: function (oComponentRegistryEntry) {
				// oComponentRegistryEntry will be provided by TemplateAssembler
				// if Component is assembled without TemplateAssembler it could be that oComponentRegistryEntry is undefined
				// e.g. an application has an own implementation of Component
				if (oComponentRegistryEntry && !oComponentRegistryEntry.createViewStarted) {
					oComponentRegistryEntry.createViewStarted = true;

					oComponentRegistryEntry.aI18nLoadPromises = fnEnhanceI18nModel(oComponentRegistryEntry.oComponent);

					var oContainer = oComponentRegistryEntry.oComponent.getComponentContainer();
					var oModel = oContainer && oContainer.getModel();
					if (oModel) {
						// Do the templating once the $metadata documents and the annotation documents are loaded and all i18n Texts are loaded
						oModel.getMetaModel().requestObject("/$EntityContainer/").then(function () {
							createXMLView(oComponentRegistryEntry).then(function (oView) {
								// check that all i18n models
								Promise.all(oComponentRegistryEntry.aI18nLoadPromises).then(function () {
									oComponentRegistryEntry.oComponent.setAggregation("rootControl", oView);
									oContainer.invalidate();
								 });
							}, function(){
								// Resolve view registered promise to disable busy handling
								oComponentRegistryEntry.fnViewRegisteredResolve();
							});

						});
					}
				}
			}

		});
	});

})();
