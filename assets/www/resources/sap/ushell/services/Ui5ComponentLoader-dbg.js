// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The Unified Shell's UI5 component loader service.
 *  This is a shell-internal service and no public or application facing API!
 *
 * @version 1.52.4
 */
sap.ui.define([
    "sap/ushell/services/Ui5ComponentHandle",
    "sap/ushell/services/_Ui5ComponentLoader/utils"
], function (Ui5ComponentHandle, oUtils) {
    "use strict";
    /*jslint nomen: true */
    /*global jQuery, sap, window */

    /**
     * This method MUST be called by the Unified Shell's container only, others
     * MUST call <code>sap.ushell.Container.getService("Ui5ComponentLoader")</code>.
     * Constructs a new instance of the UI5 Component Loader service.
     *
     * @class The Unified Shell's UI5 Component Loader service
     *
     * Note: This loader adds some hardcoded libraries for the standard fiori packaging.
     * Notably scaffolding libraries and core-ext-light must be available. This can be turned off
     * explicitly by setting the <code>amendedLoading</code> property to <code>false</code> in the
     * service configuration:
     * <pre>
     *  window["sap-ushell-config"] = {
     *      services : {
     *          "Ui5ComponentLoader": {
     *              config : {
     *                  amendedLoading : false
     *              }
     *          }
     *      }
     * </pre>
     *
     * @private
     * @constructor
     * @see sap.ushell.services.Container#getService
     *
     * @since 1.38.0
     */
    function Ui5ComponentLoader (oContainerInterface, sParameter, oConfig) {
        this._oConfig = (oConfig && oConfig.config) || {};

        /**
         * Loads and creates the UI5 component from the specified application properties object (the result of
         * a navigation target resolution).
         *
         * @param {object} oAppProperties
         *    Application properties as typically produced by resolveHashFragment,
         *    note that some members of componentData are propagated, this is used in the myinbox scenario,
         *    see (CrossApplicationNavigation.createComponentInstance)
         * @param {object} oParsedShellHash
         *    The shell hash of the application that is to be opened already
         *    parsed via
         *    <code>sap.ushell.services.URLParsing#parseShellHash</code><code>sap.ushell.services.URLParsing#parseShellHash</code>.
         * @param {array} aWaitForBeforeInstantiation
         *    An array of promises which delays the instantiation of the
         *    Component class until those Promises are resolved.
         * @return {jQuery.Deferred.promise}
         *  a jQuery promise which resolves with the application properties object which is enriched
         *  with an <code>componentHandle<code> object that encapsulates the loaded component.
         *  If the UI5 core resources have been loaded completely as a result of this call (either amendedLoading is
         *  disabled or the core-ext-light.js module is loaded as part of this call or was already loaded), the result
         *  object also gets a flag <code>coreResourcesFullyLoaded</code> which is true.
         *
         * @private
         */
        this.createComponent = function (oAppProperties, oParsedShellHash, aWaitForBeforeInstantiation) {
            var oAppPropertiesSafe = oAppProperties || {};
            var bLoadCoreExt = oUtils.shouldLoadCoreExt(oAppPropertiesSafe);
            var bCoreExtAlreadyLoaded = oUtils.isCoreExtAlreadyLoaded();
            var bAmendedLoading = oUtils.shouldUseAmendedLoading(this._oConfig);
            var bLoadDefaultDependencies = oUtils.shouldLoadDefaultDependencies(oAppPropertiesSafe, this._oConfig, bAmendedLoading);

            var oApplicationDependencies = oAppPropertiesSafe.applicationDependencies || {};
            oUtils.logAnyApplicationDependenciesMessages(
                oApplicationDependencies.name,
                oApplicationDependencies.messages
            );

            if (!oAppPropertiesSafe.ui5ComponentName) {
                return new jQuery.Deferred().resolve(oAppProperties).promise();
            }

            // Avoid warnings in ApplicationContainer.
            // TODO: can be removed when ApplicationContainer construction is
            // changed.
            delete oAppPropertiesSafe.loadCoreExt;
            delete oAppPropertiesSafe.loadDefaultDependencies;

            var oComponentData = this._createComponentData(
                oAppPropertiesSafe.componentData || {},
                oAppPropertiesSafe.url,
                oAppPropertiesSafe.applicationConfiguration,
                oAppPropertiesSafe.reservedParameters
            );

            var sComponentId = oUtils.constructAppComponentId(oParsedShellHash || {});
            var bIncludePreloadModule = bLoadCoreExt && bAmendedLoading && !bCoreExtAlreadyLoaded;
            var oComponentProperties = this._createComponentProperties(
                bIncludePreloadModule,
                bLoadDefaultDependencies,
                aWaitForBeforeInstantiation,
                oAppPropertiesSafe.applicationDependencies || {},
                oAppPropertiesSafe.ui5ComponentName,
                oAppPropertiesSafe.url,
                sComponentId
            );

            // notify we are about to create component
            Ui5ComponentHandle.onBeforeApplicationInstanceCreated.call(null, oComponentProperties);

            var oDeferred = new jQuery.Deferred();

            oUtils.createUi5Component(oComponentProperties, oComponentData)
                .then(function (oComponent) {
                    var oComponentHandle = new Ui5ComponentHandle(oComponent);
                    oAppPropertiesSafe.componentHandle = oComponentHandle;

                    var bCoreResourcesFullyLoaded = bLoadCoreExt && ( bLoadCoreExt || bCoreExtAlreadyLoaded || (bAmendedLoading === false) );
                    if (bCoreResourcesFullyLoaded) {
                        oAppPropertiesSafe.coreResourcesFullyLoaded = bCoreResourcesFullyLoaded;
                    }

                    oDeferred.resolve(oAppPropertiesSafe);
                }, function (vError) {
                    var sComponentProperties = JSON.stringify(oComponentProperties, null, 4);

                    oUtils.logInstantiateComponentError(
                        oComponentProperties.name,
                        vError + "",
                        vError.status,
                        vError.stack,
                        sComponentProperties
                    );

                    oDeferred.reject(vError);
                });

             return oDeferred.promise();
        };

        /*
         * Creates a componentData object that can be used to instantiate a ui5
         * component.
         */
        this._createComponentData = function (oBaseComponentData, sComponentUrl, oApplicationConfiguration, oTechnicalParameters) {
            var oComponentData = jQuery.extend(true, {
                startupParameters: {}
            }, oBaseComponentData);

            if (oApplicationConfiguration) {
                oComponentData.config = oApplicationConfiguration;
            }
            if (oTechnicalParameters) {
                oComponentData.technicalParameters = oTechnicalParameters;
            }

            if (oUtils.urlHasParameters(sComponentUrl)) {
                var oUrlData = oUtils.getParameterMap(sComponentUrl);

                // pass GET parameters of URL via component data as member
                // startupParameters and as xAppState (to allow blending with
                // other oComponentData usage, e.g. extensibility use case)
                oComponentData.startupParameters = oUrlData.startupParameters;
                if (oUrlData["sap-xapp-state"]) {
                    oComponentData["sap-xapp-state"] = oUrlData["sap-xapp-state"];
                }
            }

            return oComponentData;
        };

        /*
         * Creates a componentProperties object that can be used to instantiate
         * a ui5 component.
         */
        this._createComponentProperties = function (
            bIncludePreloadModule,
            bLoadDefaultDependencies,
            aWaitForBeforeInstantiation,
            oApplicationDependencies,
            sUi5ComponentName,
            sComponentUrl,
            sAppComponentId
        ) {
            // take over all properties of applicationDependencies to enable extensions in server w/o
            // necessary changes in client
            var oComponentProperties = jQuery.extend(true, {}, oApplicationDependencies);

            // set default library dependencies if no asyncHints defined (apps without manifest)
            // TODO: move fallback logic to server implementation
            if (!oComponentProperties.asyncHints) {
                oComponentProperties.asyncHints = bLoadDefaultDependencies
                    ? {"libs": ["sap.ca.scfld.md", "sap.ca.ui", "sap.me", "sap.ui.unified"]}
                    : {};
            }

            if (bIncludePreloadModule) {
                var sPreloadModule = window["sap-ui-debug"] === true
                    ? "sap/fiori/core-ext-light-dbg.js"
                    : "sap/fiori/core-ext-light.js";

                oComponentProperties.asyncHints.preloadBundles =
                    oComponentProperties.asyncHints.preloadBundles || [];
                oComponentProperties.asyncHints.preloadBundles.push(sPreloadModule);
            }

            if (aWaitForBeforeInstantiation) {
                oComponentProperties.asyncHints.waitFor = aWaitForBeforeInstantiation;
            }

            // Use component name from app properties (target mapping) only if no name
            // was provided in the component properties (applicationDependencies)
            // for supporting application variants, we have to differentiate between app ID
            // and component name
            if (!oComponentProperties.name) {
                oComponentProperties.name = sUi5ComponentName;
            }

            if (sComponentUrl) {
                oComponentProperties.url = oUtils.removeParametersFromUrl(sComponentUrl);
            }

            if (sAppComponentId) {
                oComponentProperties.id = sAppComponentId;
            }

            return oComponentProperties;
        };

    };

    Ui5ComponentLoader.hasNoAdapter = true;
    return Ui5ComponentLoader;

}, true /* bExport */);
