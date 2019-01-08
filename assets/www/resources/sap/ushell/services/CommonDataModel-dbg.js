// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview
 *
 * <p>This module exposes a CommonDataModel based site document in a platform neutral format
 * to it's clients
 * </p>
 *
 *
 * @version 1.52.4
 */
sap.ui.define( [
    "sap/ushell/services/_CommonDataModel/PersonalizationProcessor",
    "sap/ushell/services/ClientSideTargetResolution"
], function ( PersonalizationProcessor ) {

    "use strict";

    /*global jQuery sap Promise */

    var S_COMPONENT_NAME = "sap.ushell.services.CommonDataModel";

    /**
     * @param {object} oAdapter
     *   Adapter, provides an array of Inbounds
     * @param {object} oContainerInterface
     *   Not in use
     * @param {string} sParameters
     *   Parameter string, not in use
     * @param {object} oServiceConfiguration
     *   The service configuration not in use
     *
     * @constructor
     * @class
     * @see {@link sap.ushell.services.Container#getService}
     * @since 1.40.0
     */
    function CommonDataModel( oAdapter, oContainerInterface, sParameters, oServiceConfiguration ) {

        var that = this,
            oSiteDeferred = new jQuery.Deferred();

        function failure(sMessage) {
            oSiteDeferred.reject(sMessage);
        }

        this._oAdapter = oAdapter;
        this._oPersonalizationProcessor = new PersonalizationProcessor();
        this._oSitePromise = oSiteDeferred.promise();
        this._oContentProviderIndex = {};

        // load site and personalization as early as possible
        /*eslint-disable max-nested-callbacks*/
        oAdapter.getSite()
            .done(function (oSite) {
                that._oOriginalSite = jQuery.extend(true, {}, oSite);
                oAdapter.getPersonalization()
                    .done(function(oPers) {
                        that._oPersonalizationProcessor.mixinPersonalization(oSite, oPers)
                            .done(function (oPersonalizedSite) {
                                // Apply the Null Object Pattern to prevent errors
                                // e.g.: Avoid errors when accessing links when no links are present
                                // See internal incident BCP: 1780350619
                                that._oPersonalizedSite = that._ensureCompleteSite(oPersonalizedSite);

                                oSiteDeferred.resolve(that._oPersonalizedSite);
                            })
                        .fail(failure); // mixinPersonalization
                    })
                .fail(failure); // getPersonalizations
            })
            .fail(failure); //getSite
        /*eslint-enable max-nested-callbacks*/
    }

    /**
     * TODO to be removed
     * @private
     */
    CommonDataModel.prototype.getHomepageGroups = function () {
        var oDeferred = new jQuery.Deferred();

        this._oSitePromise.then(function(oSite) {
            // the group order was not available in the very first ABAP CDM RT Site
            var aGroupsOrder = (oSite && oSite.site && oSite.site.payload && oSite.site.payload.groupsOrder)
                ? oSite.site.payload.groupsOrder : [];

            oDeferred.resolve(aGroupsOrder);
        });
        return oDeferred.promise();
    };

    /**
     * TODO to be removed
     * @private
     */
    CommonDataModel.prototype.getGroups = function () {

        var oDeferred = new jQuery.Deferred();

        this._oSitePromise.then(function(oSite) {
            var aGroups = [];
            Object.keys(oSite.groups).forEach(function (sKey) {
                aGroups.push(oSite.groups[sKey]);
            });
            oDeferred.resolve(aGroups);
        });
        return oDeferred.promise();
    };

    /**
     * TODO to be removed
     * @private
     */
    CommonDataModel.prototype.getGroup = function (sId) {
        var oDeferred = new jQuery.Deferred();
        this._oSitePromise.then(function(oSite) {
            var oGroup = oSite.groups[sId];
            if (oGroup) {
                oDeferred.resolve(oGroup);
            } else {
                oDeferred.reject("Group " + sId + " not found");
            }
        });
        return oDeferred.promise();
    };

    /**
     * Returns the Common Data Model site with mixed in personalization.
     * The following sections are allowed to be changed:
     *   - site.payload.groupsOrder
     *   - groups
     * Everything else must not be changed.
     *
     * @returns {jQuery.promise}
     *    resolves with the Common Data Model site
     * @private
     *
     * @see #save
     * @since 1.40.0
     */
    CommonDataModel.prototype.getSite = function () {
        //TODO JSDoc: tbd is it allowed to change "personalization" section?
        return this._oSitePromise;
    };

    /**
     * Returns a given group from the original site.
     *
     * @param {string} sGroupId
     *  Group id
     * @returns {jQuery.promise}
     *  Resolves with the respective group from the original site.
     *  In case the group is not exisiting in the original site,
     *  a respective error message is passed to the fail handler.
     * @private
     *
     * @since 1.42.0
     */
    CommonDataModel.prototype.getGroupFromOriginalSite = function (sGroupId) {
        var oDeferred = new jQuery.Deferred();

        if (typeof sGroupId === "string" &&
                this._oOriginalSite &&
                this._oOriginalSite.groups &&
                this._oOriginalSite.groups[sGroupId]) {
            oDeferred.resolve(jQuery.extend(true, {}, this._oOriginalSite.groups[sGroupId]));
        } else {
            oDeferred.reject("Group does not exist in original site.");
        }

        return oDeferred.promise();
    };

    /**
     * Saves the personalization change together with the collected personalization
     * changes since the last FLP reload.
     *
     * @returns {jQuery.promise}
     *   The promise's done handler indicates whether the collected personalization has been saved successfully.
     *   In case an error occured, the promise's fail handler returns an error message.
     * @private
     *
     * @see #getSite
     * @since 1.40.0
     */
    CommonDataModel.prototype.save = function () {
        var oDeferred = new jQuery.Deferred(),
            that = this;

        this._oPersonalizationProcessor.extractPersonalization(this._oPersonalizedSite, this._oOriginalSite)
            .done(function (oExtractedPersonalization) {
                if (oExtractedPersonalization) {
                    that._oAdapter._storePersonalizationData(oExtractedPersonalization)
                        .done(function () {
                            oDeferred.resolve();
                        })
                        .fail(function (sMessage) {
                            oDeferred.reject(sMessage);
                        });
                } else {
                    // Nothing to store, but resolve the deferred object
                    oDeferred.resolve();
                }
            });

        return oDeferred.promise();
    };

    function loadContentProviderPlugins() {
        var oPluginManager = sap.ushell.Container.getService("PluginManager");

        return oPluginManager.loadPlugins("ContentProvider");
    }

    /**
     * Finds invalid applications in a site.
     *
     * @param {object} oExtensionSite
     *   The extension site to be checked
     *
     * @returns {object}
     *   An object indicating which apps from which catalogs are invalid:
     *   {
     *      CatalogId1: {   // only lists invalid apps
     *          AppId1: true,
     *          AppId2: true,
     *          ...
     *          AppIdN: true
     *      },
     *      ...
     *   }
     *   </pre>
     *   This method guarantees non-empty objects. Therefore it can be assumed
     *   that if the result is an empty object, there are no errors
     *
     * @private
     */
    CommonDataModel.prototype._getUnreferencedCatalogApplications = function (oExtensionSite) {
        var oUnreferencedApplicationPerCatalogIndex = {};

        // the id property counts in the end...
        var oAllApplicationIdsIndex = Object.keys(oExtensionSite.applications)
            .map(function (sAppId) {
                return oExtensionSite.applications[sAppId]["sap.app"].id;
            })
            .reduce(function (oIndex, sAppId) {
                oIndex[sAppId] = true;
                return oIndex;
            }, {});

        var oCatalogs = oExtensionSite.catalogs;

        Object.keys(oCatalogs).forEach(function (sCatalog) {
            var aAppDescriptors = oCatalogs[sCatalog].payload.appDescriptors;

            aAppDescriptors.map(function (oAppDescriptor) {
                return oAppDescriptor.id;
            }).filter(function (sAppIdFromAppDescriptors) {
                // only invalid: avoids empty catalogs
                return !oAllApplicationIdsIndex[sAppIdFromAppDescriptors];
            }).forEach(function (sBadAppIdFromAppDescriptors) {
                if (!oUnreferencedApplicationPerCatalogIndex.hasOwnProperty(sCatalog)) {
                    oUnreferencedApplicationPerCatalogIndex[sCatalog] = {};
                }

                // mark as invalid
                oUnreferencedApplicationPerCatalogIndex[sCatalog][sBadAppIdFromAppDescriptors]
                    = true;
            });
        });

        return oUnreferencedApplicationPerCatalogIndex;
    };

    /**
     * Formats an invalid application index into a human readable string.
     *
     * @param {string} sContentProviderId
     *   The id of the provider that returned the site.
     *
     * @param {object} oUnreferencedApplicationPerCatalogIndex
     *   An index of all the invalid applications per catalog as returned by
     *   <code>#_getUnreferencedCatalogApplications</code>.
     *
     * @returns {string}
     *   A nice error message
     *
     * @private
     */
    CommonDataModel.prototype._formatUnreferencedApplications = function (sContentProviderId, oUnreferencedApplicationPerCatalogIndex) {
        return "One or more apps from " + sContentProviderId + " content provider are not listed among the applications section of the extended site and will be discarded - "
            + Object.keys(oUnreferencedApplicationPerCatalogIndex)
                .map(function (sCatalogId) {

                    var aBadCatalogAppsQuoted = Object.keys(oUnreferencedApplicationPerCatalogIndex[sCatalogId])
                        .map(function (sUnquoted) {
                            return "'" + sUnquoted + "'";
                        });

                    return "From catalog '" + sCatalogId + "': "
                        + aBadCatalogAppsQuoted.join(", ");

                }).join("; ");
    };
    /**
     * Removes invalid appDescriptors from an extended site according to the
     * index. This method operates in place on the site.
     *
     * @param {object} oExtensionSite
     *   The extended site
     *
     * @param {object} oUnreferencedApplicationPerCatalogIndex
     *   An index of all the invalid applications per catalog as returned by
     *   <code>#_getUnreferencedCatalogApplications</code>.
     */
    CommonDataModel.prototype._removeUnreferencedApplications = function (oExtensionSite, oUnreferencedApplicationPerCatalogIndex) {
        Object.keys(oExtensionSite.catalogs).forEach(function (sCatalogId) {
            var oCatalogPayload = oExtensionSite.catalogs[sCatalogId].payload;
            var aAppDescriptors = oCatalogPayload.appDescriptors;

            oCatalogPayload.appDescriptors = aAppDescriptors.filter(function (oAppDescriptor) {
                return oUnreferencedApplicationPerCatalogIndex[sCatalogId]
                    && !oUnreferencedApplicationPerCatalogIndex[sCatalogId][oAppDescriptor.id];
            });
        });
    };

    /**
     * Loads extension sites from ContentProvider plugins.
     *
     * @returns {jQuery.promise}
     *   A promise that resolves when all the ContentProviders have returned a
     *   site or failed to do so. This promise is always resolved (and never
     *   rejected) with an array of "report" objects also indicating if the
     *   operation of retrieving the site was successful. For example, when the
     *   site is correctly retrieved, an item of this array is an object like:
     *   <pre>
     *   {
     *      providerId: "SomeProviderId",
     *      success: true,
     *      site: { ... }  // the extension site
     *   }
     *   </pre>
     *   Likewise, when the operation fails, the object looks more like:
     *   <pre>
     *   {
     *      providerId: "SomeProviderId",
     *      success: false,
     *      error: "..."
     *   }
     *   </pre>
     *   The promise .progress handler is called only when a site is
     *   successfully loaded, therefore the consumer must check the result of
     *   the done handler to inspect or report failures.
     *
     * @private
     */
    CommonDataModel.prototype.getExtensionSites = function () {
        var that = this;

        //jQuery promise as all other methods also return those
        var oDeferred = new jQuery.Deferred();

        loadContentProviderPlugins().done(function () {
            var aContentProviderIds = Object.keys(that._oContentProviderIndex),
                iTotalContentProviders = aContentProviderIds.length;

            if (iTotalContentProviders === 0) {
                oDeferred.resolve([]);
                return;
            }

            // assumption: all ContentProvider register themselves on init
            var aGetSitePromises = aContentProviderIds.map(function (sContentProviderId, iIdx) {
                var oContentProvider = that._oContentProviderIndex[sContentProviderId];

                var oGetSitePromise;
                try {
                    oGetSitePromise = oContentProvider.getSite();
                    if (!oGetSitePromise || typeof oGetSitePromise.then !== "function") {
                        throw "getSite does not return a Promise";
                    }
                } catch (oError) {
                    oGetSitePromise = Promise.reject(
                        "call to getSite failed: " + oError
                    );
                }

                return oGetSitePromise
                    .then(
                        // success handler
                        function (/* bound */ sContentProviderId, oExtensionSite) {
                            var oExtensionSiteClone = jQuery.extend(true, {}, oExtensionSite);

                            var oUnreferencedApplicationPerCatalogIndex = that._getUnreferencedCatalogApplications(oExtensionSite);
                            if (Object.keys(oUnreferencedApplicationPerCatalogIndex).length > 0) {
                                var sErrorMessage = that._formatUnreferencedApplications(
                                    sContentProviderId,
                                    oUnreferencedApplicationPerCatalogIndex
                                );

                                jQuery.sap.log.error(sErrorMessage, null, S_COMPONENT_NAME);

                                that._removeUnreferencedApplications(oExtensionSiteClone, oUnreferencedApplicationPerCatalogIndex);
                            }

                            var oLoadResult = {
                                providerId: sContentProviderId,
                                success: true,
                                site: oExtensionSiteClone
                            };

                            oDeferred.notify(oLoadResult);

                            return oLoadResult;
                        }.bind(null, sContentProviderId),

                        // fail handler
                        function (/* bound */ sContentProviderId, sErrorMessage) {
                            return {
                                providerId: sContentProviderId,
                                success: false,
                                error: sErrorMessage
                            };
                        }.bind(null, sContentProviderId)
                    );
            });

            Promise.all(aGetSitePromises).then(function (aLoadResults) {
                oDeferred.resolve(aLoadResults);
            });
        });
        // .fail({
        //   On failure just leave promise in pending state. This should be fine
        //   with the caller.
        // });

        return oDeferred.promise();

    };

    /**
     * Registers extension catalogs (i.e., 3rd Party catalogs).
     *
     * @param {string} sId
     *   The unique id of the content provider.
     * @param {object} oSiteContentProvider
     *   The site content provider implementation.
     * @private
     */
    CommonDataModel.prototype.registerContentProvider = function (sId, oSiteContentProvider) {
        if (this._oContentProviderIndex[sId]) {
            jQuery.sap.log.error(
                "a content provider with ID '" + sId + "' is already registered",
                null,
                S_COMPONENT_NAME
            );
            return;
        }

        this._oContentProviderIndex[sId] = oSiteContentProvider;

        jQuery.sap.log.debug(
            "ContentProvider '" + sId + "' was registered",
            null,
            S_COMPONENT_NAME
        );
    };

    /**
     * Applies the Null Object Pattern to make sure that all group payload properties are initialised with empty
     * arrays or objects.
     *
     * Example:
     * Some adapter functions might assume empty arrays which produces errors if the property is undefined instead.
     * To avoid these problems we just add empty properties where they are needed.
     *
     * @param oPersonalizedSite
     *      Site with personalization.
     *
     * @returns {object}
     *   The modified site
     *
     * @private
     */
    CommonDataModel.prototype._ensureCompleteSite = function (oPersonalizedSite) {
        if (oPersonalizedSite.groups) {
            var oGroups = oPersonalizedSite.groups;

            Object.keys(oGroups).forEach(function (sKey) {
                if (!oGroups[sKey]) {
                    // Undefined group detected. Cleaning it up...
                    delete oGroups[sKey];
                } else {
                    if (!oGroups[sKey].payload) {
                        // We need a payload first
                        oGroups[sKey].payload = {};
                    }

                    // Links
                    if (!oGroups[sKey].payload.links) {
                        oGroups[sKey].payload.links = [];
                    }
                    // Tiles
                    if (!oGroups[sKey].payload.tiles) {
                        oGroups[sKey].payload.tiles = [];
                    }
                    // Groups
                    if (!oGroups[sKey].payload.groups) {
                        oGroups[sKey].payload.groups = [];
                    }
                }
            });
        }

        return oPersonalizedSite;
    };

    /**
     * Gets all plugins of every category in the site.
     *
     * @param {object} [oPluginSetsCache] Cache to use for fetching plugin set.
     * This is useful for testing, if the value is undefined then an internal cache will be used.
     * To invalidate the internal cache, pass null as the value.
     *
     * @returns {jQuery.promise}
     *  A promise which may resolve to the list of plugins on the site.
     *  In the case where the promise gets resolved, it resolves to an immutable
     *  reference.
     *
     * @since 1.48.0
     */
    CommonDataModel.prototype.getPlugins = ( function () {
        var fnDeepFreeze,
            fnExtractPluginConfigFromInboundSignature,
            oPluginSets;

        fnExtractPluginConfigFromInboundSignature = function(sPluginName, oSignatureInbounds) {
            var oSignatureParams,
                iNumInbounds = Object.keys(oSignatureInbounds).length;

            if (iNumInbounds === 0) {
                return {};
            }

            if (!oSignatureInbounds.hasOwnProperty("Shell-plugin")) {
                jQuery.sap.log.error(
                    "Cannot find inbound with id 'Shell-plugin' for plugin '" +
                       sPluginName + "'",
                    "plugin startup configuration cannot be determined correctly",
                    S_COMPONENT_NAME
                );
                return {};
            }

            if (iNumInbounds > 1) {
                jQuery.sap.log.warning(
                    "Multiple inbounds are defined for plugin '" + sPluginName + "'",
                    "plugin startup configuration will be determined using "
                        + "the signature of 'Shell-plugin' inbound.",
                    S_COMPONENT_NAME
                );
            }

            oSignatureParams = jQuery.sap.getObject(
                "signature.parameters",
                undefined,
                oSignatureInbounds["Shell-plugin"]
            ) || {};

            return Object.keys(oSignatureParams).reduce(

                function(oResult, sNextParam) {
                    var sDefaultValue = jQuery.sap.getObject(
                        sNextParam + ".defaultValue.value",
                        undefined,
                        oSignatureParams
                    );

                    if (typeof sDefaultValue === "string") {
                        oResult[sNextParam] = sDefaultValue;
                    }

                    return oResult;
                },
                {} /* oResult */
            );
        };

        // Recursively freezes an object.
        fnDeepFreeze = function ( o ) {
            Object.keys( o )
                .filter( function ( sProperty ) {
                    return typeof o[sProperty] === "object";
                } )
                .forEach( function ( sProperty ) {
                    o[sProperty] = fnDeepFreeze( o[sProperty] );
                } );

            return Object.freeze( o );
        };

        return function ( oPluginSetsCache ) {

            if ( oPluginSetsCache !== undefined ) {
                oPluginSets = oPluginSetsCache;
            }

            if ( oPluginSets ) {
                return jQuery.when( oPluginSets );
            }

            oPluginSets = { };

            return this.getSite().then( function ( oSite ) {
                var oApplications = oSite.applications || { };

                Object.keys( oApplications ).filter( function ( sAppName ) {

                    return "plugin" === jQuery.sap.getObject(
                        "type", undefined, this[sAppName]["sap.flp"]
                    );

                }, oApplications ).forEach( function ( sPluginName ) {
                    var oPluginConfig,
                        oConfigFromInboundSignature,
                        oPlugin = this[sPluginName],
                        oComponentProperties = {};

                    if (!jQuery.isPlainObject(oPlugin["sap.platform.runtime"])) {
                        jQuery.sap.log.error("Cannot find 'sap.platform.runtime' section for plugin '" + sPluginName + "'",
                            "plugin might not be started correctly",
                            "sap.ushell.services.CommonDataModel");
                    } else if (!jQuery.isPlainObject(oPlugin["sap.platform.runtime"].componentProperties)) {
                        jQuery.sap.log.error("Cannot find 'sap.platform.runtime/componentProperties' section for plugin '" + sPluginName + "'",
                            "plugin might not be started correctly",
                            "sap.ushell.services.CommonDataModel");
                    } else {
                        oComponentProperties = oPlugin["sap.platform.runtime"].componentProperties;
                    }

                    oPluginSets[sPluginName] = {
                        url: oComponentProperties.url,
                        component: oPlugin["sap.ui5"].componentName
                    };

                    //
                    // define plugin configuration
                    //
                    var oSignatureInbounds = jQuery.sap.getObject(
                        "crossNavigation.inbounds", undefined, oPlugin["sap.app"]
                    ) || {};

                    oConfigFromInboundSignature = fnExtractPluginConfigFromInboundSignature(
                        sPluginName,
                        oSignatureInbounds
                    );

                    oPluginConfig = jQuery.extend(
                        oComponentProperties.config || {},
                        oConfigFromInboundSignature  // has precendence
                    );

                    if ( oPluginConfig ) {
                        oPluginSets[sPluginName].config = oPluginConfig;
                    }

                    if ( oComponentProperties.asyncHints ) {
                        oPluginSets[sPluginName].asyncHints = oComponentProperties.asyncHints;
                    }
                }, oApplications );

                return fnDeepFreeze( oPluginSets );
            }, function ( vError ) {
                return vError;
            } );
        };
    } )();

    CommonDataModel.hasNoAdapter = false;
    return CommonDataModel;

}, true /* bExport */ );
