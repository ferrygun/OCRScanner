// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

/* global sap */

sap.ui.define([
    "sap/ushell/services/_Personalization/constants",
    "sap/ushell/services/_Personalization/constants.private",   // TODO: clarify if private access is OK for adapter
    "jquery.sap.global"
], function (oStorageConstants, oInternalPersonalizationConstants, jQuery) {
    "use strict";

    return Object.create(null, {
        PersonalizationAdapter: { value: PersonalizationAdapter },

        getStorageResourceRoot: { value: getStorageResourceRoot },
        getContainerPath: { value: getContainerPath },

        delAdapterContainer: { value: delAdapterContainer },
        createContainerData: { value: createContainerData },
        getAdapterContainer: { value: AdapterContainer },

        getContainerCategory: { value: getContainerCategory },
        isCategoryPContainer: { value: isCategoryPContainer },
        trimContainerKey: { value: trimContainerKey },

        save: { value: save },
        load: { value: load },
        del: { value: del },
        clearContainerData: { value: clearContainerData },
        getItemKeys: { value: getItemKeys },
        containsItem: { value: containsItem },

        setItemValue: { value: setItemValue },
        getItemValue: { value: getItemValue },
        delItem: { value: delItem },

        addPrefixToItemKey: { value: addPrefixToItemKey },
        stripPrefixFromItemKey: { value: stripPrefixFromItemKey }
    });

    function PersonalizationAdapter(fnHttpClient, oContainerCache, oSystem, sParameters, oConfig) {
        var sStorageResourceRoot, oHttpClient;
        var oHttpClientConfig = {
            cache: {},
            headers: {
                "sap-client": oSystem.getClient()
            }
        };

        oConfig = oConfig && oConfig.config;

        if (!oConfig) {
            throw new Error("PersonalizationAdapter: missing configuration.");
        }

        if (!oContainerCache) {
            oContainerCache = Object.create(null);
        }

        sStorageResourceRoot = getStorageResourceRoot(oConfig);
        oHttpClient = fnHttpClient(sStorageResourceRoot, oHttpClientConfig);

        return Object.create(null, {
            getAdapterContainer: {
                value: AdapterContainer.bind(null, oConfig, oContainerCache, oHttpClient)
            },
            delAdapterContainer: {
                value: delAdapterContainer.bind(null, oContainerCache, oHttpClient)
            }
        });
    }

    function getStorageResourceRoot(oConfig) {
        var bIsMissing = !oConfig || !oConfig.storageResourceRoot;

        if (bIsMissing) {
            throw new Error("Configuration error: storage resource root is not defined.");
        }

        return oConfig.storageResourceRoot;
    }

    function getRelativeUrlReadOptimized(oConfig) {
        var bIsMissing = !oConfig || !oConfig.relativeUrlReadOptimized;

        if (bIsMissing) {
            throw new Error("Configuration error: relative URL for read optimization is not defined.");
        }

        return oConfig.relativeUrlReadOptimized;
    }

    function getRelativeUrlWriteOptimized(oConfig) {
        var bIsMissing = !oConfig || !oConfig.relativeUrlWriteOptimized;

        if (bIsMissing) {
            throw new Error("Configuration error: relative URL for write optimization is not defined.");
        }

        return oConfig.relativeUrlWriteOptimized;
    }

    function getContainerPath(oConfig, oScope, sContainerKey) {
        return getRelativeContainerPath(oConfig, oScope)
            + "/"
            + encodeURIComponent(trimContainerKey(sContainerKey))
            + ".json";
    }

    // TODO: factor this out into utils shared with ABAP adapter
    function trimContainerKey(sContainerKey) {
        var sPrefix = oInternalPersonalizationConstants.S_CONTAINER_PREFIX,
            sContainerKeyWithoutPrefix,
            sResult;

        if (jQuery.type(sContainerKey) !== "string" || sContainerKey.length === 0) {
            throw new Error("Personalization container key must be a non-empty string");
        }

        // check for prefix; service always sets the same prefix for containers from adapter,
        // so we strip it to shorten the key that is persisted (same is done on classic ABAP platform)
        if (sContainerKey.substring(0, sPrefix.length) === sPrefix) {
            sContainerKeyWithoutPrefix = sContainerKey.substring(sPrefix.length);
        } else {
            jQuery.sap.log.error("Unexpected personalization container key: " + sContainerKey,
                "should always be prefixed with " + sPrefix,
                "sap.ushell.adapters.cdm.PersonalizationAdapter"
            );
            sContainerKeyWithoutPrefix = sContainerKey;
        }

        // check for maximum key length; if it is exceeded, it is shortened
        if (sContainerKeyWithoutPrefix.length <= 40) {
            sResult = sContainerKeyWithoutPrefix;
        } else {
            sResult = sContainerKeyWithoutPrefix.substring(0, 40);
            jQuery.sap.log.error("Invalid personalization container key: '" + sContainerKeyWithoutPrefix + "'"
                + " exceeds maximum key length (40 characters) and is shortened to '" + sResult + "'",
                undefined,
                "sap.ushell.adapters.cdm.PersonalizationAdapter"
            );
        }

        return sResult;
    }

    function getDefaultScope() {
        return {
            validity: Infinity,
            keyCategory: oStorageConstants.keyCategory.GENERATED_KEY,
            writeFrequency: oStorageConstants.writeFrequency.HIGH,
            clientStorageAllowed: false
        };
    }

    function delAdapterContainer(oContainerCache, oHttpClient, sPath) {
        var oContainer = oContainerCache && oContainerCache[sPath];

        if (oContainer) {
            delete oContainerCache[sPath];
        }

        return del(oHttpClient, sPath);
    }

    function createContainerData(oScope, sAppName) {
        var oContainerData;
        if ((!sAppName && sAppName !== "") || sAppName.constructor !== String) {
            jQuery.sap.log.warning(
                "Personalization container has an invalid app name; must be a non-empty string",
                null,
                "sap.ushell.adapters.cdm.PersonalizationAdapter"
            );
        }

        if (!oScope) {
            oScope = getDefaultScope();
        }

        oContainerData = Object.create(null, {
            items: {
                value: Object.create(null),
                enumerable: true
            },
            __metadata: {
                value: Object.create(null, {
                    appName: { value: sAppName, enumerable: true },
                    expiry: { value: Date.now() + oScope.validity * 60 * 1000, enumerable: true },
                    validity: { value: oScope.validity, enumerable: true },
                    category: { value: getContainerCategory(oScope), enumerable: true }
                }),
                enumerable: true,
                writable: true
            }
        });
        return oContainerData;
    }

    function AdapterContainer(oConfig, oContainerCache, oHttpClient, sContainerKey, oScope, sAppName) {
        var oContainerDataItems,
            oContainerData,
            sPath = getContainerPath(oConfig, oScope, sContainerKey);

        // TODO: revise container cache - is never filled
        if (oContainerCache && oContainerCache[sPath]) {
            return oContainerCache[sPath];
        }

        oContainerData = createContainerData(oScope, sAppName);
        oContainerDataItems = oContainerData.items;

        return Object.create(null, {
            // ---
            save: { value: save.bind(null, oHttpClient, oContainerData, sPath) },
            load: { value: load.bind(null, oHttpClient, oContainerData, sPath) },
            del: { value: del.bind(null, oHttpClient, oContainerData, sPath) },
            // ---
            setItemValue: { value: setItemValue.bind(null, oContainerDataItems) },
            getItemValue: { value: getItemValue.bind(null, oContainerDataItems) },
            getItemKeys: { value: getItemKeys.bind(null, oContainerDataItems) },
            containsItem: { value: containsItem.bind(null, oContainerDataItems) },
            delItem: { value: delItem.bind(null, oContainerDataItems) }
        });
    }

    function getContainerCategory(oScope) {
        return isCategoryPContainer(oScope) ? "p" : "u";
    }

    function getRelativeContainerPath(oConfig, oScope) {
        return isCategoryPContainer(oScope) ?
            getRelativeUrlReadOptimized(oConfig) :
            getRelativeUrlWriteOptimized(oConfig);
    }

    function isCategoryPContainer(oScope) {
        return oScope
            && oScope.keyCategory === oStorageConstants.keyCategory.FIXED_KEY
            && oScope.writeFrequency === oStorageConstants.writeFrequency.LOW
            && oScope.clientStorageAllowed;
    }

    function save(oHttpClient, oContainerData, sPath) {
        return new jQuery.Deferred(function (oDeferred) {
            oHttpClient.put(sPath, { data: oContainerData })
                .then(function (oResponse) {
                    oDeferred.resolve();
                })
                .catch(function (vReason) {
                    jQuery.sap.log.error(
                        "Failed to save personalization container; response: "
                        + (typeof vReason === "object" ? JSON.stringify(vReason) : vReason),
                        vReason.stack ? vReason.stack : null,
                        "sap.ushell.adapters.cdm.PersonalizationAdapter"
                    );
                    oDeferred.reject(vReason);
                });
        }).promise();
    }

    function load(oHttpClient, oContainerData, sPath) {
        return new jQuery.Deferred(function (oDeferred) {
            oHttpClient.get(sPath)
                .then(function (oResponse) {
                    var oRemoteData = JSON.parse(oResponse.responseText);
                    var oDataItems;

                    /// BEGIN: Fix bad data format saved during development
                    if (oRemoteData.data) {
                        oRemoteData.items = oRemoteData.data;
                        delete oRemoteData.data;
                        oRemoteData.__metadata = oContainerData.__metadata;
                    }
                    /// END: Fix bad data format saved during development

                    oDataItems = oRemoteData.items;

                    clearContainerData(oContainerData.items);
                    Object.keys(oDataItems)
                        .forEach(function (sItemKey) {
                            oContainerData.items[sItemKey] = oDataItems[sItemKey];
                        });
                    oContainerData.__metadata = oRemoteData.__metadata;

                    oDeferred.resolve();
                })
                .catch(function (oResponse) {
                    clearContainerData(oContainerData.items);
                    if (oResponse.status === 404) {
                        // not found is not an error, it simply means
                        // there's nothing to load
                        oDeferred.resolve();
                    } else {
                        oDeferred.reject(oResponse);
                    }
                });
        }).promise();
    }

    function del(oHttpClient, sPath) {
        return new jQuery.Deferred(function (oDeferred) {
            oHttpClient.delete(sPath)
                .then(function () {
                    oDeferred.resolve();
                })
                .catch(function (vReason) {
                    oDeferred.reject(vReason);
                });
        }).promise();
    }

    function clearContainerData(oContainerDataItems) {
        Object.keys(oContainerDataItems).forEach(function (sKey) {
            delete oContainerDataItems[sKey];
        });
    }

    function addPrefixToItemKey(sKey) {
        if (sKey === "__metadata") {
            // skip metadata
            return undefined;
        } else if (sKey.indexOf(oInternalPersonalizationConstants.S_VARIANT_PREFIX) === 0
            || sKey.indexOf(oInternalPersonalizationConstants.S_ADMIN_PREFIX) === 0) {

            // preserve prefixes for variants and admin
            // TODO: consider moving these to separate sections as well
            return sKey;
        } else {
            // add prefix for normal items
            return oInternalPersonalizationConstants.S_ITEM_PREFIX + sKey;
        }
    }

    function stripPrefixFromItemKey(sKey) {
        if (sKey.indexOf(oInternalPersonalizationConstants.S_ITEM_PREFIX) === 0) {
            // strip prefix for normal items
            return sKey.substring(oInternalPersonalizationConstants.S_ITEM_PREFIX.length);
        } else if (sKey.indexOf(oInternalPersonalizationConstants.S_VARIANT_PREFIX) === 0
            || sKey.indexOf(oInternalPersonalizationConstants.S_ADMIN_PREFIX) === 0) {

            // preserve prefixes for variants and admin
            // TODO: consider moving these to separate sections as well
            return sKey;
        } else {
            throw new Error(
                "Illegal item key for personalization container: '"
                + sKey
                + "'; must be prefixed with one of the following: ["
                + oInternalPersonalizationConstants.S_ITEM_PREFIX
                + ", "
                + oInternalPersonalizationConstants.S_VARIANT_PREFIX
                + ", "
                + oInternalPersonalizationConstants.S_ADMIN_PREFIX
                + "] "
            );
        }
    }

    function getItemKeys(oContainerDataItems) {
        return Object.keys(oContainerDataItems)
            .map(addPrefixToItemKey)
            .filter(function (sKey) { return !!sKey; });
    }

    function containsItem(oContainerDataItems, sKey) {
        return oContainerDataItems.hasOwnProperty(stripPrefixFromItemKey(sKey));
    }

    function setItemValue(oContainerDataItems, sKey, vValue) {
        oContainerDataItems[stripPrefixFromItemKey(sKey)] = vValue;
    }

    function getItemValue(oContainerDataItems, sKey) {
        return oContainerDataItems[stripPrefixFromItemKey(sKey)];
    }

    function delItem(oContainerDataItems, sKey) {
        delete oContainerDataItems[stripPrefixFromItemKey(sKey)];
    }
});
