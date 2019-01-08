// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The purpose Fiori20AdapterTest in this file is to decide whether to load
 * the Fiori20Adapter at all. This file is kept small in size on purpose
 * as it is always required in productive code even when Fiori 2 adaptation
 * is not required.
 *
 * @version 1.52.4
 */

sap.ui.define(['sap/ui/core/UIComponent'],
	function(UIComponent) {
	"use strict";

    /*
     * Note: the code below runs once ever after the Launchpad is started.
     */

    /**
     * Resolves Fiori20Adapter configuration options from three possible sources (whitelist, URL parameter, app metadata)
     *
     *      -- “off” by default, and “on” by default for whitelisted apps with minUI5 version < 1.39
     *      -- the above defaults are overridden if fiori20Adapter configuration is explicitly specified as
     *      (1) url parameter sap-ui-xx-fiori2Adaptation or
     *      (2) parameter “sapFiori2Adaptation” in the metadata or the app descriptor
     *      (where the url parameter is given priority over metadata)
     */
    var Fiori20AdapterConfiguration =  {

        I_DEFAULT_SEARCH_DEPTH: 5,
        B_DEFAULT_LATE_ADAPTATION: false,
        S_FIORI20ADAPTER_URL_PARAM_NAME: "sap-ui-xx-fiori2Adaptation",
        S_FIORI20ADAPTER_METADATA_PARAM_NAME: "sapFiori2Adaptation",
        A_WHITELIST: ["fin.*",
                      "ssuite.fin.*",
                      "fscm.*",
                      "sap.fin.*",
                      "cus.sd.*",
                      "cus.o2c.*",
                      "sap.apf.*",
                      "tl.ibp.*",
                      "ux.fnd.apf.o2c.*",
                      "fnd.apf.*",
                      "fnd.pob.o2c.*",
                      "fcg.sll.*",
                      "ux.fnd.generic-apf-application.*",
                      "hpa.cei.*",
                      "query.viewbrowser.s1.*",
                      "ssuite.vdm.viewbrowser.s1.*",
                      "ssuite.smartbusiness.kpi.s1.*",
                      "ssuite.smartbusiness.evaluation.s1.*",
                      "ssuite.smartbusiness.association.s1.*",
                      "ssuite.smartbusiness.drilldown.s1.*",
                      "ssuite.smartbusiness.tile.s1.*",
                      "ssuite.smartbusiness.tile.ce.s1.*",
                      "ssuite.smartbusiness.workspace.s1.*",
                      "ssuite.smartbusiness.runtime.s1.*",
                      "gs.fin.customersummarycn.display.*",
                      "gs.fin.financialstatement.structure.manage.*",
                      "gs.fin.financialstatement.display.*",
                      "uipsm.*",
                      "publicservices.her.*"],

        getConfiguration: function(oComp) {

            var oConfig = this._getURLParamConfiguration(); // highest priority

            if (!oConfig) {
                oConfig = this._getMetadataConfiguration(oComp); // second source, if no URL config specified
            }

            if (!oConfig) {
                oConfig = this._getDefaultConfiguration(oComp); // default config, if no custom config specified
            }

            oConfig.iSearchDepth = oConfig.iSearchDepth || Fiori20AdapterConfiguration.I_DEFAULT_SEARCH_DEPTH; //undocumented config option for handling special cases
            if ((typeof oConfig.iSearchDepth === "string") && !isNaN(oConfig.iSearchDepth)) {
                oConfig.iSearchDepth = parseInt(oConfig.iSearchDepth, 10);
            }

            return oConfig;
        },

        _getURLParamConfiguration: function() {

            if (typeof sap.ui.getCore().getConfiguration().getFiori2Adaptation !== "function") {
                return; //parameter is not defined in the Core
            }

            if (!this._isURLParameterSpecified(Fiori20AdapterConfiguration.S_FIORI20ADAPTER_URL_PARAM_NAME)) {
                return; //no param value specified in the URL
            }

            var oUrlConfig = sap.ui.getCore().getConfiguration().getFiori2Adaptation(),
                bUrlConfig,
                sUrlConfig;

            if (typeof (oUrlConfig) === "boolean") {
                bUrlConfig = oUrlConfig;
            } else if (oUrlConfig && (oUrlConfig.length >= 1)) {
                sUrlConfig = oUrlConfig;
            }

            if (!sUrlConfig && (bUrlConfig === undefined)) {
                return;
            }

            return {
                bStylePage: sUrlConfig ? sUrlConfig.indexOf("style") > -1 : bUrlConfig,
                bMoveTitle: sUrlConfig ? sUrlConfig.indexOf("title") > -1  : bUrlConfig,
                bHideBackButton: sUrlConfig ? sUrlConfig.indexOf("back") > -1 : bUrlConfig,
                bCollapseHeader: sUrlConfig ? sUrlConfig.indexOf("collapse") > -1 : bUrlConfig,
                bHierarchy: sUrlConfig ? sUrlConfig.indexOf("hierarchy") > -1 : bUrlConfig
            };

        },

        _getMetadataConfiguration: function(oComp) {

            var oAppConfig = oComp.getMetadata("config").getConfig(Fiori20AdapterConfiguration.S_FIORI20ADAPTER_METADATA_PARAM_NAME),
                bAppConfig,
                aAppConfig;

            if (typeof (oAppConfig) === "boolean") {
                bAppConfig = oAppConfig;
            } else if ((typeof oAppConfig === "object") && !jQuery.isEmptyObject(oAppConfig)) {
                aAppConfig = oAppConfig;
            }

            if (!aAppConfig && (bAppConfig === undefined)) {
                return;
            }

            return {
                bStylePage: aAppConfig ? this._isSgnTrue(aAppConfig["style"]) : bAppConfig,
                bMoveTitle: aAppConfig ? this._isSgnTrue(aAppConfig["title"]) : bAppConfig,
                bHideBackButton: aAppConfig ? this._isSgnTrue(aAppConfig["back"]) : bAppConfig,
                bCollapseHeader: aAppConfig ? this._isSgnTrue(aAppConfig["collapse"]) : bAppConfig,
                bHierarchy: aAppConfig ? this._isSgnTrue(aAppConfig["hierarchy"]) : bAppConfig,
                bLateAdaptation: aAppConfig ? this._isSgnTrue(aAppConfig["lateAdaptation"]) : Fiori20AdapterConfiguration.B_DEFAULT_LATE_ADAPTATION //undocumented option for adapting content added to the control tree at a later point of time
            };
        },

        _getDefaultConfiguration: function(oComp) {

            var bEnabled = this._hasMinVersionSmallerThan(oComp, "1.42") && this._isWhitelisted(oComp);
            return {
                bStylePage: bEnabled,
                bMoveTitle: bEnabled,
                bHideBackButton: bEnabled,
                bCollapseHeader: bEnabled,
                bHierarchy: bEnabled
            };
        },

        _isURLParameterSpecified: function(sParamName) {
            var aArr = jQuery.sap.getUriParameters().mParams && jQuery.sap.getUriParameters().mParams[sParamName];
            return aArr && (aArr.length > 0);
        },

        _isWhitelisted: function(oComp) {
            var sComponentName = oComp.getMetadata().getName();
            for (var i = 0; i < Fiori20AdapterConfiguration.A_WHITELIST.length; i++) {
                var sNextPrefix = Fiori20AdapterConfiguration.A_WHITELIST[i].substring(0, Fiori20AdapterConfiguration.A_WHITELIST[i].length - 2);
                if (this._isPrefixedString(sComponentName, sNextPrefix)) {
                    return true;
                }
            }
            return false;
        },

        _isAdaptationRequired: function(oAdaptOptions) {
            for (var sOption in oAdaptOptions) {
                if (oAdaptOptions[sOption] === true) {
                    return true;
                }
            }
            return false;
        },

        _isPrefixedString: function(sStringVal, sPrefix) {
            return sStringVal && sPrefix && (sStringVal.substring(0, sPrefix.length) === sPrefix);
        },

        /*
         * The whitelist is only used for applications with minUI5Version lower than 1.38
         * and for applications without valid minUI5Version or valid app descriptor.
         * Any new/modified app with version 1.38 and higher is assumed to be built according to the Fiori 2.0 guidelines
         */
        _hasMinVersionSmallerThan: function(oComp, sVersion) {
            var oInfo = oComp.getMetadata().getManifestEntry("sap.ui5"),
                bMinVersion = true; //by default considered smaller unless otherwise specified (in order to cover old apps that do not specify min version)

            if (oInfo && oInfo.dependencies && oInfo.dependencies.minUI5Version) {
                var oMinVersion = new jQuery.sap.Version(oInfo.dependencies.minUI5Version);
                bMinVersion = oMinVersion.compareTo(new jQuery.sap.Version(sVersion)) < 0;
            }
            return bMinVersion;
        },
        _isSgnTrue: function(vValue) {
            return (vValue === true) || (vValue === "true"); // need to keep the string option for backward compatibility
        }
    };

    UIComponent._fnOnInstanceInitialized = function(oComponent) {
        var oControl = oComponent.getAggregation("rootControl");

        if (!oControl
            || oControl.getId() === "navContainerFlp"             // skip flp home page
            || oComponent.getId().indexOf("application-") !== 0) {// skip ui5 application component
            return;
        }

        /* check: adaptation is required by configuration */
        var oConfig = Fiori20AdapterConfiguration.getConfiguration(oComponent);
        if (!Fiori20AdapterConfiguration._isAdaptationRequired(oConfig)) {
            return;
        }


        /* check: Service registry is available */
        if (!sap.ui.core.service
            || !sap.ui.core.service.ServiceFactoryRegistry
            || typeof sap.ui.core.service.ServiceFactoryRegistry.get !== "function") {

            jQuery.sap.log.warning(
                "Fiori20Adapter not loaded because static FactoryRegistry is not available",
                "sap.ui.core.service.ServiceFactoryRegistry should be a function",
                "sap.ushell.Fiori20AdapterTest"
            );
            return;
        }


        var oDelegate = {
            onBeforeRendering: function () {

                oControl.removeEventDelegate(oDelegate);

                /* check: ShellUIService is available 
                 * this check is done after attaching onBeforeRendering 
                 * since the service is obtained asynchronously */
                var oService = sap.ui.core.service.ServiceFactoryRegistry.get("sap.ushell.ui5service.ShellUIService"),
                oServiceInstance = oService && oService.createInstance();

                if (!oService || !oServiceInstance) {
                    jQuery.sap.log.warning(
                            "Fiori20Adapter not loaded because ShellUIService is not available",
                            "sap.ushell.ui5service.ShellUIService should be declared by configuration",
                            "sap.ushell.Fiori20AdapterTest"
                    );
                    return;
                }

                oServiceInstance.then(
                    function(oService) {
                        if (oService && (oService.getUxdVersion() === 2)) {  /* check3: this is Fiori 2.0 FLP */

                            jQuery.sap.require("sap.ushell.Fiori20Adapter");

                            sap.ushell.Fiori20Adapter.applyTo(oControl, oComponent, oConfig, oService);
                        }
                    },
                    function(oError) {
                        jQuery.sap.log.warning(
                            "Fiori20Adapter not loaded as ShellUIService is not available",
                            oError,  // uses toString
                            "sap.ushell.Fiori20AdapterTest"
                        );
                    }
                );
            }
        };
        oControl.addEventDelegate(oDelegate);
    };



}, /* bExport= */ false);
