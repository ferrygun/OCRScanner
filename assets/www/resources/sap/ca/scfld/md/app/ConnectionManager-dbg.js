/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
/*global URI *///declare unusual global vars for JSLint/SAPUI5 validation
jQuery.sap.declare("sap.ca.scfld.md.app.ConnectionManager");
jQuery.sap.require("sap.ca.ui.message.message");
jQuery.sap.require("sap.ca.ui.utils.busydialog");
jQuery.sap.require("sap.ui.model.odata.ODataUtils");
//jQuery.sap.require("sap.ca.scfld.md.ComponentBase");

sap.ui.base.ManagedObject.extend("sap.ca.scfld.md.app.ConnectionManager", {
	metadata : {
		properties : {
			identity : "string",
			configuration : "object",
			defaultConfiguration : "object",
			component : "object"
		}
	},

	/**
	 * Initialize all the models as defined in the configuration service list. The models should define : - their
	 * url - the name of the model that they will create - a isDefault property that will set the model as the
	 * undefined model (to support getModel()) - a mockedDataSource to define if mock data are available (and to
	 * switch to MockServer class in this case)
	 */
	initModels : function () {

		function attachParams (oParams, sAdditionalParams) {
			(sAdditionalParams || "").split("&").forEach(function (sParam) {
				var i = sParam.indexOf("="), sKey = sParam, sValue = "";
				if (i >= 0) {
					sValue = decodeURIComponent(sKey.slice(i + 1));
					sKey = sKey.slice(0, i);
				}
				sKey = decodeURIComponent(sKey);
				if (sKey) {
					oParams[sKey] = sValue;
				}
			});
		}

		function cloneServiceList (aServiceList) {
			var aClone = JSON.parse(JSON.stringify(aServiceList));

			jQuery.each(aClone, function (i, oService) {
				oService.fRequestFailed = aServiceList[i].fRequestFailed;
			});

			return aClone;
		}

		this.modelList = {}; // Map containing all the models
		this.mockServerList = {}; // Map containing all the models
		this.iRequestCount = 0;
		// Init all the ODataModel based on the configuration
		//*deep* array clone in order not to overwrite SAP app configuration
		var serviceList = jQuery.isArray(this.getConfiguration().getServiceList())
				? cloneServiceList(this.getConfiguration().getServiceList())
				: null;
		var excludedParameters = this.getConfiguration().getExcludedQueryStringParameters() || [];
		var isMocked = this.getConfiguration().isMock();
		var that = this;
		var sapServer = jQuery.sap.getUriParameters().get("sap-server");
		var sapHost = jQuery.sap.getUriParameters().get("sap-host");
		var sapHostHttp = jQuery.sap.getUriParameters().get("sap-host-http");
		var sapClient = jQuery.sap.getUriParameters().get("sap-client");

		var oComponent = that.getComponent();
		// check if system alias is contained in startup parameters of the component
		var mStartupParameters = (oComponent.getComponentData() || {}).startupParameters || {};
		var vSapSystem = mStartupParameters["sap-system"] || {};
		var sSystemAlias = typeof vSapSystem === "object" ? vSapSystem[0] : vSapSystem;

		this.sErrorInStartMessage = "";
		this.bIsComponentBase = !!oComponent.setRouterSetCloseDialogs;
//		this.bIsComponentBase = oComponent instanceof sap.ca.scfld.md.ComponentBase;  // added value can be provided in this case
		this.bIsShowingMessage = false;   // suppress more then one message box (e.g. when several models provide an error
		if (!sap.ui.getCore().getConfiguration().getDisableCustomizing() && oComponent && oComponent.getMetadata()) {

			var oConfig = oComponent.getMetadata().getConfig(),
				sParentComponentName = oComponent.getMetadata().getParent().getName(),
				serviceListExt = oConfig["sap.ca.serviceConfigs"] || [];

			var fMergeConfigs = function (aServiceList, aExtensionConfig) {
				var oServiceList, oExtConfig;
				//*deep* array clone in order not to overwrite the custom configuration
				var aExtConfig = jQuery.isArray(aExtensionConfig)
						? cloneServiceList(aExtensionConfig)
						: [];
				for (var i = 0; i < aServiceList.length; i++) {
					oServiceList = aServiceList[i];
					for (var j = 0; j < aExtConfig.length; j++) {
						oExtConfig = aExtConfig[j];
						if (oServiceList.name == oExtConfig.name) {
							for (var key in oExtConfig) {
								oServiceList[key] = oExtConfig[key];
							}
							aExtConfig.splice(j, 1);
							//array was sqashed - adapt the index in order to
							//check the 'new entry' that moved its position
							j--;
						}
					}
				}
				aServiceList = aServiceList.concat(aExtConfig);
				return aServiceList;
			};

			if (sParentComponentName !== "sap.ca.scfld.md.ComponentBase") {
				// oComponent is an extension of an scfld based app --> fill serviceListExt
				// from config[sap.ca.serviceConfigs] and app descriptor
				var oManifestEntry = oComponent.getMetadata().getManifestEntry("sap.app");
				if (oManifestEntry && oManifestEntry.dataSources) {
					// an app descriptor with a new service is available, convert and use it
					var oDataSources = oManifestEntry.dataSources,
						aServiceListFromManifest = [];
					for (var key in oDataSources) {
						var oDataSource = oDataSources[key],
							oDataSourceSettings = oDataSource.settings,
							oServiceObject = {
								name : key,
								serviceUrl : oDataSource.uri
							};

						if (oDataSourceSettings && oDataSourceSettings.localUri) {
							oServiceObject.mockedDataSource =
								jQuery.sap.getModulePath(oManifestEntry.id) + "/"
									+ oDataSourceSettings.localUri;
						}
						aServiceListFromManifest.push(oServiceObject);
					}
					if (aServiceListFromManifest.length > 0) {
						serviceListExt = fMergeConfigs(serviceListExt, aServiceListFromManifest);
					}
				}
			}

			if (serviceListExt.length > 0 && serviceList != null) {
				serviceList = fMergeConfigs(serviceList, serviceListExt);
			}

		}

		if (serviceList != null) {
			jQuery
				.each(
					serviceList,
					function (index, service) {
						function logMetadataError(oEvt, oService) {
							var sError = "Cannot load meta data for service " + oService.serviceUrl,
								sDetails = oEvt.getParameter("statusCode"),
								sComponent = that.getIdentity() || "sap.ca.scfld.md.app.ConnectionManager";
							sDetails += " (";
							sDetails += oEvt.getParameter("statusText");
							sDetails += ") - ";
							sDetails += oEvt.getParameter("message");
							sDetails += "\n";
							sDetails += oEvt.getParameter("responseText");
							jQuery.sap.log.error(sError, sDetails, sComponent);
						}
						var sUrlUri = URI(service.serviceUrl),
							bUseV2Model = (service.useV2ODataModel === true);

						if (sapServer != null && (jQuery.inArray("sap-server", excludedParameters) == -1)) {
							sUrlUri.addSearch("sap-server", sapServer);
						} else if (sapHost != null && (jQuery.inArray("sap-host", excludedParameters) == -1)) {
							sUrlUri.addSearch("sap-host", sapHost);
						} else if (sapHostHttp != null && (jQuery.inArray("sap-host-http", excludedParameters) == -1)) {
							sUrlUri.addSearch("sap-host-http", sapHostHttp);
						}
						if (sapClient != null && (jQuery.inArray("sap-client", excludedParameters) == -1)) {
							sUrlUri.addSearch("sap-client", sapClient);
						}
						var sUrl = sUrlUri.toString();
						// Add origin segment if sap-system start parameter is available
						if (sSystemAlias) {
							sUrl = sap.ui.model.odata.ODataUtils.setOrigin(sUrl, sSystemAlias);
						}
						if (isMocked) {
							jQuery.sap.require("sap.ui.core.util.MockServer");
							// remove query parameters, add trailing '/'
							var sMockServerUrl = (sUrl.split("?")[0]).replace(/\/?$/, "/");
							var oMockServer = new sap.ui.core.util.MockServer({
								rootUri : sMockServerUrl
							});
							if (service.mockedDataSource) {
								oMockServer.simulate(service.mockedDataSource, {
									// the replace instruction strips the filename, returning only the path with trailing slash
									// eg. model/metadata.xml --> model/
									sMockdataBaseUrl: service.mockedDataSource.replace(/[^\/]+$/, ""),
									bGenerateMissingMockData: true
								});
							} else {
								oMockServer.simulate(sMockServerUrl + "$metadata");
							}
							oMockServer.start();
							that.mockServerList[service.name] = oMockServer;
							if (service.isDefault) {
								that.mockServerList[undefined] = oMockServer;
							}
						}

						var oConfig = {
								metadataUrlParams: {},
								json: true,
								loadMetadataAsync: service.loadMetadataAsync === true || bUseV2Model //v2.ODataModel always loads metadata async
							};
						attachParams(oConfig.metadataUrlParams, service.metadataParams);
						if (service.serviceUrl.indexOf("/sap/opu/") === 0) {
							// a Gateway URL, try adding sap-language to $metadata
							var sapLanguage = sap.ushell && sap.ushell.Container
									? sap.ushell.Container.getUser().getLanguage()
									: jQuery.sap.getUriParameters().get("sap-language");
							if (sapLanguage && excludedParameters.indexOf("sap-language") < 0) {
								oConfig.metadataUrlParams["sap-language"] = sapLanguage;
							}
						}
						var oModel = bUseV2Model
								? new sap.ui.model.odata.v2.ODataModel(sUrl, oConfig)
								: new sap.ui.model.odata.ODataModel(sUrl, oConfig);
						if (oConfig.loadMetadataAsync) {
							oModel.attachMetadataLoaded({oModel: oModel, oService: service}, function (oEvt, oParams) {
								that.checkModelMetaData(oParams.oModel,oParams.oService);
							}, this);
							oModel.attachMetadataFailed({oModel: oModel, oService: service}, function (oEvt, oParams) {
								logMetadataError(oEvt, oParams.oService);
								that.checkModelMetaData(oParams.oModel,oParams.oService);
							}, this);

						} else {
							oModel.attachMetadataFailed(service, logMetadataError, this);
							that.checkModelMetaData(oModel, service);
						}

						// Override Metadata way of returning properties
						if (service.overrideGetPropertyMetadata && oModel.oMetadata) {
							oModel.oMetadata._getPropertyMetadata = function (oEntityType, sProperty) {
								sProperty = sProperty.replace(/^\/|\/$|\)$|\w*\(/g, "");
								return sap.ui.model.odata.ODataMetadata.prototype._getPropertyMetadata.apply(this, [oEntityType, sProperty]);
							};
						}

						// To comply with security guidelines, batch mode is used except if :
						// - service configuration explicitly contains useBatch:false
						// - service is a mock service
						if ((service.useBatch) && !isMocked) {
							oModel.setUseBatch(true);
						}
						if (service.countSupported) {
							// v2.ODataModel has no method setCountSupported; we keep it however for the ODataModel as apps may call oModel.isCountSupported then
							if (bUseV2Model) {
								oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.Request);
							} else {
								oModel.setCountSupported(true);
							}
						} else {
							if (bUseV2Model) {
								oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.Inline);
							} else {
								oModel.setCountSupported(false);
							}
						}
						if (service.sDefaultBindingMode) {
							oModel.setDefaultBindingMode(service.sDefaultBindingMode);
						}
						// test whether the call went through
						//if (!oModel.getServiceMetadata()) {
						//	var oII18NModel = that.getProperty("configuration").oApplicationFacade.oApplicationImplementation.UilibI18nModel
						//		.getResourceBundle();
						//	that.sErrorInStartMessage = oII18NModel.getText("ERROR_MSG_NO_METADATA", [service.name]);
						//	var oSettings = {
						//		type : sap.ca.ui.message.Type.ERROR,
						//		message : that.sErrorInStartMessage,
						//		details : oII18NModel.getText("ERROR_DETAIL_NO_METADATA", [service.serviceUrl])
						//		};
						//	that.showMessageBox(oSettings);
						//	return;
						//}
						if (service.fRequestFailed) {
							oModel.attachRequestFailed(null, service.fRequestFailed);
						} else {
							oModel.attachRequestFailed(null, jQuery.proxy(that.handleRequestFailed, that));
						}
						// some applications requested the possibility to avoid the busy indicator
						if (service.noBusyIndicator == true) {
							// attach only default logic
							oModel.attachRequestSent(null, jQuery.proxy(that.handleRequestSentInner, that));
							oModel.attachRequestCompleted(null, jQuery.proxy(that.handleRequestCompletedInner, that));
						} else {
							// attach default logic + busy Indicator
							oModel.attachRequestSent(null, jQuery.proxy(that.handleRequestSent, that));
							oModel.attachRequestCompleted(null, jQuery.proxy(that.handleRequestCompleted, that));
						}
						if (service.isDefault) {
							that.modelList[undefined] = oModel;
							that.setDefaultConfiguration(service);
						} else {
							that.modelList[service.name] = oModel;
						}
					});
		}
	},

	checkModelMetaData: function (oModel, oService) {
		if (!oModel.getServiceMetadata()) {
			var oII18NModel = this.getProperty("configuration").oApplicationFacade.oApplicationImplementation.UilibI18nModel
					.getResourceBundle();
			this.sErrorInStartMessage = oII18NModel.getText("ERROR_MSG_NO_METADATA", [oService.name]);
			var oSettings = {
				type : sap.ca.ui.message.Type.ERROR,
				message : this.sErrorInStartMessage,
				details : oII18NModel.getText("ERROR_DETAIL_NO_METADATA", [oService.serviceUrl])
			};
			this.showMessageBox(oSettings);
			return;
		}
	},

	setIdentity : function (sIdentity) {
		var oldIdentity = this.getIdentity();
		if (oldIdentity != sIdentity) {
			this.setProperty("identity", sIdentity);
		}
	},

	/**
	 * Retrieve a single model based on its name
	 *
	 * @param {string} sName
	 * @returns {*}
	 */
	getModel : function (sName) {
		return this.modelList[sName];
	},

	/**
	 * Method to be called each time a request is sent on the ODataModel
	 *
	 * @param {object} oEvent
	 */
	handleRequestSent : function (oEvent) {
		sap.ca.ui.utils.busydialog.requireBusyDialog();
		this.handleRequestSentInner(oEvent);
	},

	handleRequestSentInner : function (oEvent) {
		this.iRequestCount++;
		jQuery.sap.log.info("Connection Manager", "Request sent");
	},

	/**
	 * Method to be called each time a request fails on the ODataModel
	 *
	 * @param {object} oEvent
	 */
	handleRequestFailed : function (oEvent) {
		jQuery.sap.log.error("Connection Manager", "Failed to load data");
		// v2 provides the error nested in response parameter
		var oResponse = oEvent.getParameter("response"),
			oSettings = {
				type : sap.ca.ui.message.Type.ERROR,
				message : oEvent.getParameter("message")
					|| (oResponse && oResponse.message),
				details : oEvent.getParameter("responseText")
					|| (oResponse && oResponse.responseText)
			};
		this.showMessageBox(oSettings);
	},

	/**
	 * Method to be called each time a request is completed on the ODataModel
	 *
	 * @param {object} oEvent
	 */
	handleRequestCompleted : function (oEvent) {
		sap.ca.ui.utils.busydialog.releaseBusyDialog();
		this.handleRequestCompletedInner(oEvent);
	},

	handleRequestCompletedInner : function (oEvent) {
		if (oEvent.getParameter("success")) {
			jQuery.sap.log.info("Connection Manager", "Request succesfully completed");
		} else {
			jQuery.sap.log
					.info("Connection Manager", "Request completed with errors", oEvent.getParameter("message"));
		}
	},

	showMessageBox : function (oSettings) {
		if (this.bIsShowingMessage) {
			return;
		}
		this.bIsShowingMessage = true;
		if (this.bIsComponentBase) {
			var oComponent = this.getComponent();
			var bIsClosing = oComponent._bRouterCloseDialogs;
			oComponent.setRouterSetCloseDialogs(false);
		}
		sap.ca.ui.message.showMessageBox(oSettings, jQuery.proxy(function () {
			this.bIsShowingMessage = false;
			if (this.bIsComponentBase) {
				oComponent.setRouterSetCloseDialogs(bIsClosing);
			}
		}, this));
	}
});

// factory method may be more flexible in future
sap.ca.scfld.md.app.ConnectionManager.getNewInstance = function (sIdentity, oConfiguration, oDefaultConfiguration,
		oComponent) {
	var oConnManager = new sap.ca.scfld.md.app.ConnectionManager({
		identity : sIdentity,
		configuration : oConfiguration,
		defaultConfiguration : oDefaultConfiguration,
		component : oComponent
	});
	oConnManager.initModels();
	return oConnManager;
};
