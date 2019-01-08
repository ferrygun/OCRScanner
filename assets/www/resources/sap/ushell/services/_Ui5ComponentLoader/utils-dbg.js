// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview Helper functions for <code>sap.ushell.services.Ui5ComponentLoader
 *  This is a shell-internal service and no public or application facing API!
 *
 * @version 1.52.4
 */
sap.ui.define([], function () {

    /**
     * Creates a UI5 component instance asynchronously.
     *
     * @param {object} oComponentProperties
     *  the Ui5 component properties
     * @param {object} oComponentData
     *  the Ui5 component data
     * @return {jQuery.Deferred.promise}
     *  a jQuery promise which resolves with an instance of
     *  <code>sap.ui.component</code> containing the instantiated
     *  Ui5 component.
     *
     * @private
     */
    function createUi5Component (oComponentProperties, oComponentData) {
        var oDeferred = new jQuery.Deferred();

        oComponentProperties.componentData = oComponentData;
        oComponentProperties.async = true;

        sap.ui.component(oComponentProperties).then(function(oComponent) {
            oDeferred.resolve(oComponent);
        }, function (vError) {
            oDeferred.reject(vError);
        });

        return oDeferred.promise();
    }

    function shouldUseAmendedLoading(oServiceConfig) {
        // optimized loading (default libs, core-ext-light) is on by default, but can be switched off explicitly
        // by platforms which do not support it (sandbox, demo); productive platforms should use it by default
        // see BCP 1670249780 (no core-ext loading in cloud portal)
        var bAmendedLoading = (oServiceConfig && oServiceConfig.hasOwnProperty("amendedLoading"))
            ? oServiceConfig.amendedLoading
            : true;

        return bAmendedLoading;
    }

    function shouldLoadCoreExt(oAppProperties) {
        var bLoadCoreExt = true; /* default */
        if (oAppProperties.hasOwnProperty("loadCoreExt")) {
            bLoadCoreExt = oAppProperties.loadCoreExt;
        }
        return bLoadCoreExt;
    }

    function shouldLoadDefaultDependencies(oAppProperties, oServiceConfig, bAmendedLoading) {
        // default dependencies loading can be skipped explicitly (homepage component use case)
        var bLoadDefaultDependencies = true;
        if (oAppProperties.hasOwnProperty("loadDefaultDependencies")) {
            bLoadDefaultDependencies = oAppProperties.loadDefaultDependencies;
        }

        // or via service configuration (needed for unit tests)
        if (oServiceConfig && oServiceConfig.hasOwnProperty("loadDefaultDependencies")) {
            bLoadDefaultDependencies = bLoadDefaultDependencies && oServiceConfig.loadDefaultDependencies;
        }

        bLoadDefaultDependencies = bLoadDefaultDependencies && bAmendedLoading;

        return bLoadDefaultDependencies;
    }

    function constructAppComponentId(oParsedShellHash) {
        var sSemanticObject = oParsedShellHash.semanticObject || null;
        var sAction = oParsedShellHash.action || null;

        if (!sSemanticObject || !sAction) {
            return null;
        }

        return "application-" + sSemanticObject + "-" + sAction + "-component";
    }

    function urlHasParameters(sUrl) {
        return sUrl && sUrl.indexOf("?") >= 0;
    }

    function removeParametersFromUrl(sUrl) {
        if (!sUrl) { return sUrl; }

        var iIndex = sUrl.indexOf("?");
        if (iIndex >= 0) {
            return sUrl.slice(0, iIndex);
        }
        return sUrl;
    }

    function isCoreExtAlreadyLoaded() {
        return jQuery.sap.isDeclared('sap.fiori.core', true)
            || jQuery.sap.isDeclared('sap.fiori.core-ext-light', true);
    }

    function logInstantiateComponentError(sApplicationName, sErrorMessage, sErrorStatus, sErrorStackTrace, sComponentProperties) {
        var sErrorReason = "The issue is most likely caused by application " + sApplicationName,
            sAppPropertiesErrorMsg = "Failed to load UI5 component with properties: '" + sComponentProperties + "'."

        if (sErrorStackTrace) {
            sAppPropertiesErrorMsg += " Error likely caused by:\n" + sErrorStackTrace
        } else {
            // Error usually appears in the stack trace if the app
            // threw with new Error... but if it didn't we add it here:
            sAppPropertiesErrorMsg += " Error: '" + sErrorMessage + "'";
        }

        if (sErrorStatus === "parsererror") {
            sErrorReason += ", as one or more of its resources could not be parsed"
        }
        sErrorReason += ". Please create a support incident and assign it to the support component of the respective application.";

        jQuery.sap.log.error(sErrorReason, sAppPropertiesErrorMsg, sApplicationName);
    }

    /**
     * Returns a map of all search parameters present in the search string of the given URL.
     *
     * @param {string} sUrl
     *   the URL
     * @returns {object}
     *   in member <code>startupParameters</code> <code>map&lt;string, string[]}></code> from key to array of values,
     *   in members <code>sap-xapp-state</code> an array of Cross application Navigation state keys, if present
     *   Note that this key is removed from startupParameters!
     * @private
     */
    function getParameterMap(sUrl) {
        var mParams = jQuery.sap.getUriParameters(sUrl).mParams,
            xAppState = mParams["sap-xapp-state"],
            oResult;
        delete mParams["sap-xapp-state"];
        oResult = {
            startupParameters : mParams
        };
        if (xAppState) {
            oResult["sap-xapp-state"] = xAppState;
        }
        return oResult;
    }

    function logAnyApplicationDependenciesMessages(sApplicationDependenciesName, aMessages) {
        if (!jQuery.isArray(aMessages)) {
            return;
        }

        aMessages.forEach(function (oMessage) {
            var sSeverity = String.prototype.toLowerCase.call(oMessage.severity || "");
            sSeverity = ["trace", "debug", "info", "warning", "error", "fatal"].indexOf(sSeverity) !== -1 ? sSeverity : "error";
            jQuery.sap.log[sSeverity](oMessage.text, oMessage.details, sApplicationDependenciesName);
        });
    }

    return {
        constructAppComponentId: constructAppComponentId,
        getParameterMap: getParameterMap,
        isCoreExtAlreadyLoaded: isCoreExtAlreadyLoaded,
        logAnyApplicationDependenciesMessages: logAnyApplicationDependenciesMessages,
        logInstantiateComponentError: logInstantiateComponentError,
        shouldLoadCoreExt: shouldLoadCoreExt,
        shouldLoadDefaultDependencies: shouldLoadDefaultDependencies,
        shouldUseAmendedLoading: shouldUseAmendedLoading,
        urlHasParameters: urlHasParameters,
        removeParametersFromUrl: removeParametersFromUrl,
        createUi5Component: createUi5Component
    };

}, false /* bExport */);
