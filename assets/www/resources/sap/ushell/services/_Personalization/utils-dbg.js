// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/ushell/utils",
    "sap/ushell/services/_Personalization/constants",
    "sap/ushell/services/_Personalization/constants.private"
], function (utils, constants, privateConstants) {
    "use strict";

    /**
     * Checks if given value is part of enum
     * @returns {boolean}
     * @private
     */
    function checkIfEntryExistsInEnum(entry, passedEnum) {
        var enumElement;
        for (enumElement in passedEnum) {
            if (typeof passedEnum[enumElement] !== 'function') {
                if (passedEnum.hasOwnProperty(enumElement)) {
                    if (enumElement === entry) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function addContainerPrefix(sContainerKey) {
        return privateConstants.S_CONTAINER_PREFIX + sContainerKey;
    }

    function adjustScopePickAdapter(sContainerKey, oScope, _oAdapterWithBackendAdapter, _oAdapterWindowOnly) {
        var sPrefixedContainerKey = "",
            bLaunchpadReload,
            oAdapterForScope;
        if (typeof sContainerKey !== "string") {
            throw new utils.Error("sContainerKey is not a string: sap.ushell.services.Personalization", " " /* Empty string for missing component information */);
        }
        if (sContainerKey.length > 40) {
            jQuery.sap.log.error("Personalization Service container key (\"" + sContainerKey + "\") should be less than 40 characters [current :" + sContainerKey.length + "]");
        }
        oScope = this._adjustScope(oScope);
        sPrefixedContainerKey = addContainerPrefix(sContainerKey);
        bLaunchpadReload = window["sap-ushell-config"] && window["sap-ushell-config"].services &&
            window["sap-ushell-config"].services.ShellNavigation &&
            window["sap-ushell-config"].services.ShellNavigation.config &&
            window["sap-ushell-config"].services.ShellNavigation.config.reload;
            // default = false
        oAdapterForScope = _oAdapterWithBackendAdapter;
        if (oScope && oScope.validity === 0) {
            if (bLaunchpadReload) {
                oScope.validity = 1440; // 24h
                                        // reason: balance between risk of loosing parameters while navigation and
                                        // data amount per user
            } else {
                oAdapterForScope = _oAdapterWindowOnly;
            }
        }
        return { oAdapterForScope : oAdapterForScope,
            oScope : oScope,
            sPrefixedContainerKey : sPrefixedContainerKey
            };
    }

    /**
     * construct a cleansed scope object, returning only valid recognized parameters
     * This functionality is used to cleanse user input
     * @private
     */
    function adjustScope(oScope) {
        var oConstants = constants,
            // default scope values
            oDefaultScope = {
                validity : Infinity,
                keyCategory : oConstants.keyCategory.GENERATED_KEY,
                writeFrequency: oConstants.writeFrequency.HIGH,
                clientStorageAllowed: false
            };
        if (!oScope) {
            return oDefaultScope;
        }
        oDefaultScope.validity = oScope && oScope.validity;
        if (oDefaultScope.validity === null || oDefaultScope.validity === undefined || typeof oDefaultScope.validity !== "number") {
            oDefaultScope.validity = Infinity;
        }
        if (!(typeof oDefaultScope.validity === "number" &&  ((oDefaultScope.validity >= 0 && oDefaultScope.validity < 1000) || oDefaultScope.validity === Infinity))) {
            oDefaultScope.liftime = Infinity;
        }

        oDefaultScope.keyCategory = checkIfEntryExistsInEnum(oScope.keyCategory, oConstants.keyCategory) ? oScope.keyCategory : oDefaultScope.keyCategory;
        oDefaultScope.writeFrequency = checkIfEntryExistsInEnum(oScope.writeFrequency, oConstants.writeFrequency) ? oScope.writeFrequency : oDefaultScope.writeFrequency;
        if (typeof oScope.clientStorageAllowed === 'boolean' && (oScope.clientStorageAllowed === true || oScope.clientStorageAllowed === false)) {
            oDefaultScope.clientStorageAllowed = oScope.clientStorageAllowed;
        }

        //Combination of FixKey & CrossUserRead is an illegal combination because the user who was creating the container is no longer available
        //The other users have no chance to write on that container
        //if (oDefaultScope.keyCategory === oConstants.keyCategory.FIXED_KEY && oDefaultScope.access === oConstants.access.CROSS_USER_READ) {
        //    throw new utils.Error("Wrong defined scope. FixKey and CrossUserRead is an illegal combination: sap.ushell.services.Personalization", " ");
        // }
        return oDefaultScope;
    }

    function cloneToObject(oObject) {
        if (oObject === undefined) {
            return undefined;
        }
        try {
            return JSON.parse(oObject);
        } catch (e) {
            return undefined;
        }
    }

    function clone(oObject) {
        if (oObject === undefined) {
            return undefined;
        }
        try {
            return JSON.parse(JSON.stringify(oObject));
        } catch (e) {
            return undefined;
        }
    }

    return {
        adjustScope: adjustScope,
        adjustScopePickAdapter: adjustScopePickAdapter,
        cloneToObject: cloneToObject,
        clone: clone,
        addContainerPrefix: addContainerPrefix
    };
});
