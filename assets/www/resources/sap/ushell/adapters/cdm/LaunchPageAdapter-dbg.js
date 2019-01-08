// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The Unified Shell's LaunchPageAdapter for the 'CDM'
 *               platform.
 *
 * @version 1.52.4
 */
sap.ui.define([
    "sap/m/Text",
    "sap/m/GenericTile",
    "sap/m/GenericTileMode",
    "sap/ushell/resources",
    "sap/ushell/utils/utilsCdm"
], function ( Text, GenericTile, oGenericTileMode, oResources, oUtils) {
    "use strict";
    /* global jQuery sap window Promise hasher */

    /* eslint-disable no-warning-comments, consistent-this */

    // As the LaunchPageAdapter for the CDM platform is currently not in a finished state,
    // todo comments get disabled in EsLint

    /**
     * This method MUST be called by the Unified Shell's container only.
     * Constructs a new instance of the LaunchPageAdapter for the 'CDM' platform.
     *
     * @param {object} oUnused
     *     the system served by the adapter
     * @param {string} sParameter
     *     parameter as string (legacy, was used before oAdapterConfiguration was added)
     * @param {oject} oAdapterConfiguration
     *     configuration for the adapter.
     *
     * @class
     *
     * @constructor
     * @since 1.15.0
     */
     function LaunchPageAdapter (oUnused, sParameter, oAdapterConfiguration) {
        var _oDefaultGroup;

        this._mResolvedTiles = {};
        this._mResolvedCatalogTiles = {};
        this._mCatalogTilePromises = {};
        this._mFailedResolvedCatalogTiles = {};
        this._mFailedResolvedTiles = {};
        this._mContentProviders = {};

        //TODO: Rectify jQuery.sap.log.error calls and pass correct parameters
        // https://sapui5.netweaver.ondemand.com/sdk/#docs/api/symbols/jQuery.sap.log.html#.error

        this.TileType = {
            Tile: "tile",
            Link: "link"
        };

        /**
         * Returns the groups of the user. These group objects can be passed in to all
         * functions expecting a group.
         *
         * The first group in this list is considered the default group.
         *
         * @returns {jQuery.Promise}
         *  A promise which will be always resolved. In case of success the array consists
         *  of group objects, in case the groups could not be loaded the array is empty.
         */
        this.getGroups = function () {
            var oDeferred = new jQuery.Deferred();

            this._assureLoaded()
                .done(function (aGroups) {
                    oDeferred.resolve(aGroups);
                })
                .fail(function () {
                    // resolve with an empty array in case no groups could be loaded
                    oDeferred.resolve([]);
                });
            return oDeferred.promise();
        };



        /**
         * Returns the tile resolution result in the context of a given site.
         *
         * @param {function} fnResolver
         *  The resolve function. Must take <code>sIntent</code> and return a
         *  promise that resolves with the corresponding tile resolution
         *  result.
         *
         * @param {object} oCatalogTilePromiseCache
         *  A cache of promises that may include the tile resolution result
         *  already.
         *
         * @param {string} sIntent
         *   The intent to be resolved (including '#').
         *
         * @returns {jQuery.Promise}
         *   A promise which will be resolved with an object representing the
         *   tile resolution result, and rejected when the tile resolution
         *   failed.
         *
         * @private
         */
        this._getTileFromHashInContextOfSite = function (fnResolver, oCatalogTilePromiseCache, sIntent) {
            var oDeferred = new jQuery.Deferred(),
                oCatalogTilePromise = oCatalogTilePromiseCache[sIntent];

            if (!oCatalogTilePromise) {
                // only call resolve if it was not resolved before
                oCatalogTilePromise = fnResolver(sIntent);

                // store promise for the next call
                oCatalogTilePromiseCache[sIntent] = oCatalogTilePromise;
            }

            oCatalogTilePromise.done(function (oTileIntentResolutionResult) {
                var oTileResolutionResult = {
                    tileIntent: sIntent,
                    tileResolutionResult: oTileIntentResolutionResult
                };

                oDeferred.resolve(oTileResolutionResult);
            }).fail(function (sErrorMsg) {
                oDeferred.reject("Hash '" + sIntent + "' could not be resolved to a tile. " + sErrorMsg);
            });

            return oDeferred.promise();
        };

        /**
         * Construct an appropriate tile by resolving a given intent.
         *
         * @param {string} sIntent
         *  Intent to be resolved including leading "#"
         *
         * @returns {jQuery.Promise}
         *  A promise which will be resolved with an object representing the
         *  tile resolution result, and rejected when the tile resolution
         *  failed.
         *
         * @private
         */
        this._getTileFromHash = function (sIntent) {
            var oCstrService = sap.ushell.Container.getService("ClientSideTargetResolution");
            var fnResolveTile = oCstrService.resolveTileIntent.bind(oCstrService);

            return this._getTileFromHashInContextOfSite(fnResolveTile, this._mCatalogTilePromises, sIntent);
        };

        /**
         * Construct an appropriate tile by resolving a given intent.
         *
         * @param {object} oSite
         *  The site that provides the inbounds to resolve the intent.
         *
         * @param {string} sIntent
         *  Intent to be resolved including leading "#"
         *
         * @returns {jQuery.Promise}
         *  A promise which will be resolved with an object representing the
         *  tile resolution result, and rejected when the tile resolution
         *  failed.
         *
         * @private
         */
        this._getTileFromHashFromSite = function (oSite, sIntent) {
            var oCstrService = sap.ushell.Container.getService("ClientSideTargetResolution");
            var aInboundsFromSite = oUtils.formatSite(oSite);
            var fnResolveTile = oCstrService.resolveTileIntentInContext.bind(/*this*/oCstrService, aInboundsFromSite);

            // ignore _mCatalogTilePromises and use an empty object instead, as otherwise the
            // following will happen when the external content provider provides catalog tiles which
            // cannot be resolved without the applications of the provider:
            // first session:
            //   1. catalog is shown in the AppFinder
            //   2. user adds tile to Home page -> works, all good
            // second session:
            //   3. during Start-up of the Homepage, the FLP tries to resolve the tiles but
            //      (as the extension applications are missing) the tiles added in step 2
            //      cannot be resolved. This is cached in _mCatalogTilePromises!
            //   4. The tiles are filtered out (because of 3)
            //   5. The user opens the AppFinder and the FLP tries to resolve the tiles but
            //      because of the _mCatalogTilePromises cache, the remote tiles are not resolved
            //      anymore (see 3).
            //   6. The catalog is hidden when none of the tiles can be resolved (if all tiles were added
            //      during 2)
            //   7. The "evil" tiles are hidden, so the user has no chance to delete them & the catalog
            //      will be gone "forever"!
            // NOTE: This behaviour may get fixed, if addTile() creates (URL) Bookmarks instead of "real" tiles
            var oCatalogTilePromiseCache = {};

            return this._getTileFromHashInContextOfSite(fnResolveTile, oCatalogTilePromiseCache, sIntent);
        };


        /**
         * Construct an appropriate tile from an URL.
         * @param {object} oTile
         * @returns {object}
         *  The tile resolution result
         *
         * @private
         */
        this._getTileForUrl = function (oTile) {
            var sTileComponentLoadInfo = oTile.indicatorDataSource ? "#Shell-dynamicTile" : "#Shell-staticTile";
            return {
                tileIntent: "#", //TODO this is not a good intent for arbitrary URL tiles, is it?
                tileResolutionResult: {
                    tileComponentLoadInfo: sTileComponentLoadInfo,
                    isCustomTile: false
                }
            };
        };

        /**
         * Resolves items (tiles and links) for a given group.
         *
         * @param {object} oGroup
         *  Group for which the items should be resolved
         *
         * @returns {array}
         *  An array of jQuery promises each belonging to a respective item.
         *
         * @private
         */
        this._assureGroupItemsResolved = function (oGroup) {
            var aPromises = [],
                aResolvedTilesPromises,
                aResolvedLinksPromises;

            // Tiles
            if (oGroup.payload && oGroup.payload.tiles) {
                aResolvedTilesPromises = this._assureGroupTilesResolved(oGroup.payload.tiles);
                Array.prototype.push.apply(aPromises, aResolvedTilesPromises);
            }

            // Links
            if (oGroup.payload && oGroup.payload.links) {
                aResolvedLinksPromises = this._assureGroupLinksResolved(
                    oGroup.payload.links, oGroup.identification.id
                );
                Array.prototype.push.apply(aPromises, aResolvedLinksPromises);
            }

            return aPromises;
        };

        /**
         * Resolves the given group tiles.
         *
         * @param {array} aGroupTiles
         *  Array of tiles which should be resolved
         *
         * @returns {array}
         *  An array of jQuery promises each belonging to a respective tile.
         *
         * @private
         */
        this._assureGroupTilesResolved = function (aGroupTiles) {
            return (aGroupTiles || []).map(function (oTile, iIndex) {
                return this._getResolvedTile(oTile, iIndex)
                    .then(function (oResolvedTileOutcome) {
                        oResolvedTileOutcome.isLink = false;

                        return oResolvedTileOutcome;
                    });
            }, this);
        };

        /**
         * Resolves the given group links.
         *
         * @param {array} aGroupLinks
         *  Array of links which should be resolved
         * @param {string} sGroupId
         *  Group ID
         *
         * @returns {array}
         *  An array of jQuery promises each belonging to a respective link.
         *
         * @private
         */
        this._assureGroupLinksResolved = function (aGroupLinks, sGroupId) {
            return (aGroupLinks || []).map(function (oLink, iIndex) {
                return this._getResolvedTile(oLink, iIndex)
                    .then(function (oResolvedLinkOutcome) {
                        oResolvedLinkOutcome.isLink = true;

                        return oResolvedLinkOutcome;
                    });
            }, this);
        };

        /**
         * Constructs the hash for a given tile object. Additionaly parameters
         * get formatted.
         *
         * @param {object} oTile
         *  Tile object for which the hash should be constructed.
         * @returns {string} constructed hash or <code>undefined</code>
         *   in case something went wrong.
         *
         * @private
         */
        this._prepareTileHash = function (oTile) {
            var oURLParsing = sap.ushell.Container.getService("URLParsing"),
                oParams = {},
                oTarget,
                aRawParams;

            if (this._isCatalogTile(oTile)) {
                return oTile.tileIntent;
            }

            if (this._isGroupTile(oTile)) {
                // TODO use hash from _mResolvedTiles if tile has been already resolved
                aRawParams = oTile.target.parameters || [];
                aRawParams.forEach(function (oParameter) {
                    if (oParameter.name && oParameter.value) {
                        oParams[oParameter.name] = [oParameter.value];
                    }
                });

                oTarget = {
                    target: {
                        semanticObject: oTile.target.semanticObject,
                        action: oTile.target.action
                    },
                    params: oParams,
                    appSpecificRoute: oTile.target.appSpecificRoute
                };

                return "#" + oURLParsing.constructShellHash(oTarget);
            }
            return undefined;
        };

        /**
         * Works similar to jQuery.Deferred.when except for:
         * <ul>
         *    <li> does not stop as soon as the first promise has failed</li>
         *    <li>always resolves, even if some promise(s) failed</li>
         *    <li>does not return the original array with promises in another
         *        state it rather replaces the result array with a new array of
         *        promises.</li>
         * </ul>
         *
         * @param {array} aPromises
         *  Array of promises. The array may be empty.
         * @returns {jQuery.Promise}
         *  A promise which will be resolved in any case, success or failure.
         *
         * @private
         */
        this._allPromisesDone = function (aPromises) {
            var oDeferred = new jQuery.Deferred(),
                oDeferredAlways;

            if (aPromises.length === 0) {
                oDeferred.resolve([]);
            } else {
                // "replace" aPromises with an array of promises which will always resolve.
                var aNoneFailingPromises = aPromises.map(function (oPromise) {
                    oDeferredAlways = new jQuery.Deferred();
                    oPromise.always(oDeferredAlways.resolve.bind(oDeferredAlways));
                    return oDeferredAlways.promise();
                });
                // This jQuery.Deferred.when call will never fail, as all promises will always be resolved.
                // This is needed because jQuery.when will otherwise abort on the first fail and will
                // not wait for the remaining promises.
                jQuery.when.apply(this, aNoneFailingPromises).done(function () {
                    var aArgs = Array.prototype.slice.call(arguments);
                    oDeferred.resolve(aArgs);
                });
            }
            return oDeferred.promise();
        };

        /**
         * Generates a default group as no existing group is yet flagged
         * as a default group.
         *
         * @returns {jQuery.Promise}
         *  A promise which will be resolved when the default group has been generated
         *  successfully. The generated default group will then get passed to the
         *  <code>done</code> handler as an argument. The promise will be rejected
         *  with a respective error message when the generation did not work as expected.
         *
         * @private
         */
        this._generateDefaultGroup = function () {
            var sGeneratedId,
                oGeneratedDefaultGroup,
                oDeferred = new jQuery.Deferred(),
                oCdmService = sap.ushell.Container.getService("CommonDataModel");

            oCdmService.getSite()
                .done(function (oSite) {
                    // All existing group ids are stored in the groupsOrder array of the site
                    sGeneratedId = sap.ushell.utils.
                        generateUniqueId(oSite.site.payload.groupsOrder);

                    oGeneratedDefaultGroup = {
                            "identification": {
                                "id": sGeneratedId,
                                "namespace": "",
                                "title": "Home"
                            },
                            "payload": {
                                "isDefaultGroup": true,
                                "locked": false,
                                "tiles": [],
                                "links": [],
                                "groups": []
                            }
                    };

                    // assign default group to the closure variable of the LaunchPageAdapter
                    _oDefaultGroup = oGeneratedDefaultGroup;

                    // attach group to site object
                    oSite.groups[sGeneratedId] = oGeneratedDefaultGroup;

                    // add group in the front to groupsOrder array
                    oSite.site.payload.groupsOrder.unshift(sGeneratedId);

                    oDeferred.resolve(oGeneratedDefaultGroup);
                })
                .fail(function (sErrorMessage) {
                    oDeferred.reject("Failed to access site. " + sErrorMessage);
                });

            return oDeferred.promise();
        };

        /**
         * Assures that all items (tiles and links) for all groups returned by the CDM site
         * are resolved. Furthermore the default group gets set. If the default group does
         * not exist yet, one will get generated.
         *
         * @returns {jQuery.Promise}
         *  A promise which will be always resolved. In case all items (tiles and links)
         *  of all groups could be loaded using ClientSideTargetResolution the array
         *  contains the group objects. In case something went wrong
         *  The promise will be rejected when the resolution did not work as expected.
         *
         * @private
         */
        this._assureLoaded = function () {
            var that = this,
                oCDMSiteService = sap.ushell.Container.getService("CommonDataModel"),
                oDefaultGroupPromise,
                aLoadedGroups = [],
                oDeferred;

            // bundle multiple requests running in parallel
            if (this._assureLoadedDeferred) {
                return this._assureLoadedDeferred.promise();
            }

            oDeferred = new jQuery.Deferred();
             this._assureLoadedDeferred = oDeferred;

            oCDMSiteService.getSite()
                .done(function (oSite) {
                    var aItemPromises = [];

                    // order groups based on groupsOrder
                    oSite.site.payload.groupsOrder.forEach(function (sGroupId, iIndex) {
                        var oGroup = oSite.groups[sGroupId];
                        if (oGroup) {
                            oGroup.payload = oGroup.payload || {};

                            if (oGroup.payload.hasOwnProperty("isDefaultGroup")) {
                                _oDefaultGroup = oGroup;
                            }

                            // add groups in the correct order
                            aLoadedGroups.push(oGroup);

                            // resolve the tile intents already now, as methods like getGroupTiles
                            // or getTileTitle are synchronously called
                            aItemPromises = that._assureGroupItemsResolved(oGroup).concat(aItemPromises);
                        }
                    });

                    // generate a new default group if no group was flagged as a default group
                    if (_oDefaultGroup === undefined) {
                        // generate default group
                        oDefaultGroupPromise = that._generateDefaultGroup();
                        // attach promise to the collection of item promises which
                        // contains all the promises of all items of all groups.
                        // Once this collection of item promises is resolved,
                        // the loading of groups (including the default group, which might
                        // be generated) is complete.
                        aItemPromises.push(oDefaultGroupPromise);
                        oDefaultGroupPromise
                            .done(function (oGeneratedDefaultGroup) {
                                // attach generated default group in the front of the loaded groups collection
                                aLoadedGroups.unshift(oGeneratedDefaultGroup);
                            })
                            .fail(function (sErrorMessage) {
                                jQuery.sap.log.error("Delivering hompage groups failed - " + sErrorMessage);
                                that._assureLoadedDeferred.resolve([]);
                            });
                    }

                    // wait for resolving of all items
                    // Note: _allPromisesDone does never reject. Therefore no fail handler is required.
                    that._allPromisesDone(aItemPromises)
                        .done(function () {
                            that._assureLoadedDeferred.resolve(aLoadedGroups);
                            // ensure that following _assureLoaded calls get resolved with a new parameter
                            delete that._assureLoadedDeferred;
                        });
                })
                .fail(function (sErrorMessage0) {
                    jQuery.sap.log.error("Delivering hompage groups failed - " + sErrorMessage0);
                    that._assureLoadedDeferred.resolve([]);
                    // ensure that following _assureLoaded calls get resolved with a new parameter
                    delete that._assureLoadedDeferred;
                });

            return oDeferred.promise();
        };

        /**
         * Returns the default group.
         *
         * @returns {jQuery.Promise}
         *  In case of success its <code>done</code> handler is called with the default
         *  group as an argument. In case of failure an error message gets passed to the
         *  fail handler.
         *
         * @public
         */
        this.getDefaultGroup = function () {
            var oDeferred = new jQuery.Deferred(),
                oAssureLoadedDeferred;

            // check whether assureLoaded was already called.
            // The default group is not set before.
            if (!_oDefaultGroup) {
                oAssureLoadedDeferred = this._assureLoaded();
            }

            if (oAssureLoadedDeferred) {
                oAssureLoadedDeferred
                    .done(function () {
                        oDeferred.resolve(_oDefaultGroup);
                    })
                    .fail(function (sMessage) {
                        oDeferred.reject("Failed to access default group. " + sMessage);
                    });
            } else {
                oDeferred.resolve(_oDefaultGroup);
            }

            return oDeferred.promise();
        };

        /**
         * Checks whether a given title is valid string.
         *
         * @param {string} sTitle
         *  Title
         * @returns {boolean}
         *  Indicates whether a string is valid or not.
         *
         * @private
         */
        this._isValidTitle = function (sTitle) {
            if (typeof sTitle !== 'string' || !sTitle) {
                return false;
            }
            return true;
        };

        /**
         * Tells if the group is preset, meaning that the group was not added by the user but by an admin
         * (assigned group).
         * @param oGroup
         *  Group to be checked
         * @return {boolean}
         *  true if the group is preset (assigned by admin), false if added by the user.
         *
         * @private
         */
        this._isGroupPreset = function (oGroup) {
            if (!oGroup.payload.hasOwnProperty("isPreset")) {
                // the default is true as for all user-created groups false is set
                 return true;
            }
            return !!oGroup.payload.isPreset;
        };

        /**
         * Tells if the group is locked, meaning that the user is not able to do modifications.
         * @param oGroup
         *  Group to be checked
         * @return {boolean}
         *  true if the group is locked.
         *
         * @private
         */
        this._isGroupLocked = function (oGroup) {
            return !!oGroup.payload.locked;
        };

        /**
         * Adds a group to the homepage. Furthermore the personalization will be
         * persisted for the end user.
         *
         * @param {string} sTitle
         *  Group title
         * @returns {jQuery.Promise}
         *  A promise which will be resolved when group has been added successfully.
         *  The group object itself and the group id will be passed to the promise's
         *  done handler. In case of failure, the fail handler will be called with
         *  a respective error message.
         */
        this.addGroup = function (sTitle) {
            var oDeferred = new jQuery.Deferred(),
                oCdmSiteService = sap.ushell.Container.getService("CommonDataModel"),
                oGroup,
                sGeneratedId,
                sGenericErrorMessage,
                that = this;

            if (!this._isValidTitle(sTitle)) {
                return oDeferred.reject("No valid group title").promise();
            }

            sGenericErrorMessage = "Failed to add the group with title '" + sTitle +
                "' to the homepage. ";

            // add group to site
            oCdmSiteService.getSite()
                .done(function (oSite) {
                    // all existing group ids are stored in the groupsOrder array of the site
                    sGeneratedId = sap.ushell.utils.
                        generateUniqueId(oSite.site.payload.groupsOrder);

                    // prepare new group object
                    oGroup = {
                        "identification": {
                            "id": sGeneratedId,
                            "namespace": "",
                            "title": sTitle
                        },
                        "payload": {
                            "locked": false,
                            "isPreset": false,
                            "tiles": [],
                            "links": [],
                            "groups": []
                        }
                    };

                    oSite.groups[sGeneratedId] = oGroup;

                    // add group to groupsOrder array
                    oSite.site.payload.groupsOrder.push(oGroup.identification.id);

                    // store personalization
                    oCdmSiteService.save()
                        .done(function () {
                            delete that._assureLoadedDeferred;
                            oDeferred.resolve(oSite.groups[sGeneratedId], sGeneratedId);
                        })
                        .fail(function (sErrorMsg0) {
                            oDeferred.reject(sErrorMsg0);
                        });
                })
                .fail(function (sErrorMsg) {
                    oDeferred.reject(sGenericErrorMessage + sErrorMsg);
                });

            return oDeferred.promise();
        };

        /**
         * Returns the title for a given group
         *
         * @param {object} oGroup
         *  Group object
         * @returns {string}
         *  Title for a given group
         */
        this.getGroupTitle = function (oGroup) {
            return oGroup.identification.title;
        };

        /**
         * Sets a new title for a given group
         *
         * @param {object} oGroup
         *  Group object
         * @param {string} sNewTitle
         *  Title which should be set
         * @returns {jQuery.Promise}
         *  A promise which will be resolved when the group has been set successfully.
         *  In case of failure, the fail handler will be called with the old group title.
         */
        this.setGroupTitle = function (oGroup, sNewTitle) {
            var that = this,
                oDeferred = new jQuery.Deferred(),
                oCdmSiteService = sap.ushell.Container.getService("CommonDataModel"),
                sOldTitle, // necessary in case the renaming operation fails
                sGenericErrorMessage;

            if (typeof oGroup !== 'object' || !oGroup.identification || !oGroup.identification.id) {
                return oDeferred.reject("Unexpected group value").promise();
            }
            if (!that._isValidTitle(sNewTitle)) {
                return oDeferred.reject("Unexpected oGroup title value").promise();
            }
            sGenericErrorMessage = "Failed to set new title for group with id '" +
            oGroup.identification.id + "'. ";

            sOldTitle = oGroup.identification.title;

            oCdmSiteService.getSite()
                .done(function (oSite) {
                    // adapt title
                    if (oSite.groups[oGroup.identification.id]) {
                        oSite.groups[oGroup.identification.id].identification.title = sNewTitle;
                    }

                    // save personalization
                    oCdmSiteService.save()
                        .done(function () {
                            oDeferred.resolve();
                        })
                        .fail(function (sErrorMsg) {
                            jQuery.sap.log.error(sErrorMsg);
                            oDeferred.reject(sOldTitle);
                        });
                })
                .fail(function (sError) {
                    oDeferred.reject(sOldTitle, sGenericErrorMessage + sError);
                });

            return oDeferred.promise();
        };

        /**
         * Returns the ID of a given group
         *
         * @param {object} oGroup
         *  Group object
         * @returns {string}
         *  Group ID
         */
        this.getGroupId = function (oGroup) {
            return oGroup.identification.id;
        };

        /**
         * Hides a given set of groups on the homepage.
         * In case an empty array gets passed, all exisiting groups
         * on the homepage should be set to be visible.
         *
         * @param {object} aHiddenGroupIds
         *  Groups which should be set to be hidden
         * @returns {jQuery.Promise}
         *  Resolves in case the groups are set to be hidden successfully.
         *  In case of failure, the promise rejects with a respective
         *  error message.
         */
        this.hideGroups = function (aHiddenGroupIds) {
            var oDeferred = new jQuery.Deferred(),
                oCdmSiteService = sap.ushell.Container.getService("CommonDataModel"),
                sGenericErrorMessage;

            if (aHiddenGroupIds && jQuery.isArray(aHiddenGroupIds)) {
                sGenericErrorMessage = "Failed to hide group. ";
                oCdmSiteService.getSite()
                    .done(function (oSite) {
                        if (aHiddenGroupIds.length > 0) {
                            // set given groups to be hidden, the other ones to visible
                            Object.keys(oSite.groups).forEach(function (sGroupKey) {
                                if (jQuery.inArray(oSite.groups[sGroupKey].identification.id, aHiddenGroupIds) > -1) {
                                    oSite.groups[sGroupKey].identification.isVisible = false;
                                } else {
                                    // if the isVisible property does not exist on a group,
                                    // it means that it is visible.
                                    delete oSite.groups[sGroupKey].identification.isVisible;
                                }
                            });
                        }
                        if (aHiddenGroupIds.length === 0) {
                            // set all exisiting groups to be visible
                            Object.keys(oSite.groups).forEach(function (sGroupKey) {
                                // if the isVisible property does not exist on a group,
                                // it means that it is visible.
                                delete oSite.groups[sGroupKey].identification.isVisible;
                            });
                        }

                        // persist personalization
                        oCdmSiteService.save()
                            .done(function () {
                                oDeferred.resolve();
                            })
                            .fail(function (oErrorMsg0) {
                                oDeferred.reject("Hiding of groups did not work as expected - " + oErrorMsg0);
                            });
                    })
                    .fail(function (sError) {
                        oDeferred.reject(sGenericErrorMessage + sError);
                    });
            } else {
                oDeferred.reject("Invalid input parameter aHiddenGroupIds. Please pass a valid input parameter.");
            }

            return oDeferred.promise();
        };

        /**
         * Checks if a given group is visible
         *
         * @param {object} oGroup
         *  Group object
         * @returns {boolean}
         *  The return value is <code>true</code> if the given group is visible,
         *  and <code>false</code> if it is not visible.
         */
        this.isGroupVisible = function (oGroup) {
            if (oGroup.identification.isVisible === undefined || oGroup.identification.isVisible === true) {
                return true;
            } else {
                return false;
            }
        };

        /**
         * Moves a given group to a defined position
         *
         * @param {object} oGroup
         *  Group object
         * @param {number} nNewIndex
         *  New index the group will be moved to
         * @returns {jQuery.Deferred}
         *  A promise which will be resolved when the group has been moved successfully.
         *  In case of failure, the fail handler will be called with a respective error message.
         */
        this.moveGroup = function (oGroup, nNewIndex) {
            var oDeferred = new jQuery.Deferred(),
                oCdmSiteService = sap.ushell.Container.getService("CommonDataModel"),
                aGroupsOrderAfterMove,
                sGenericErrorMessage;

            if (!oGroup || !oGroup.identification || !oGroup.identification.id || nNewIndex < 0) {
                return oDeferred.reject("Unable to move groups - invalid parameters").promise();
            }

            sGenericErrorMessage = "Failed to move group with id '" + oGroup.identification.id + "'. ";
            // move group inside the site object
            oCdmSiteService.getSite()
                .done(function (oSite) {
                    if (!oSite.site.payload.groupsOrder) {
                        return oDeferred.reject("groupsOrder not found - abort operation of adding a group.");
                    } else if (oSite.site.payload.groupsOrder.indexOf(oGroup.identification.id) === nNewIndex) {
                        return oDeferred.resolve();
                    }

                    // move group inside the groupsOrder array
                    aGroupsOrderAfterMove = sap.ushell.utils
                        .moveElementInsideOfArray(oSite.site.payload.groupsOrder, oSite.site.payload.groupsOrder.indexOf(oGroup.identification.id), nNewIndex);

                    if (!aGroupsOrderAfterMove) {
                        return oDeferred.reject("invalid move group operation - abort.");
                    }

                    // store personalization
                    oCdmSiteService.save()
                        .done(function () {
                            oDeferred.resolve();
                        })
                        .fail(function (sErrorMsg) {
                            oDeferred.reject(sErrorMsg);
                        });
                })
                .fail(function (sError) {
                    oDeferred.reject(sGenericErrorMessage + sError);
                });
            return oDeferred.promise();
        };

        /**
         * Removes a given group
         *
         * @param {object} oGroup
         *  Group object
         * @returns {jQuery.Deferred}
         *  A promise which will be resolved when the group has been removed successfully.
         *  In case of failure, the fail handler will be called with a respective error message.
         */
        this.removeGroup = function (oGroup) {
            var oDeferred = new jQuery.Deferred(),
                oCdmSiteService = sap.ushell.Container.getService("CommonDataModel"),
                sGenericErrorMessage;

            if (!oGroup || typeof oGroup !== "object" || !oGroup.identification || !oGroup.identification.id) {
                return oDeferred.reject("no valid input parameter for 'oGroup'").promise();
            }

            sGenericErrorMessage = "Failed to remove group with id '" + oGroup.identification.id + "'. ";

            // remove group from site object
            oCdmSiteService.getSite()
                .done(function (oSite) {
                    if (oSite && oSite.groups && oSite.groups[oGroup.identification.id]) {
                        delete oSite.groups[oGroup.identification.id];
                    }

                    // remove group id from groupsOrder array
                    if (oSite && oSite.site && oSite.site.payload && oSite.site.payload.groupsOrder) {
                        oSite.site.payload.groupsOrder = jQuery.grep(oSite.site.payload.groupsOrder, function (sGroupId) {
                            return sGroupId !== oGroup.identification.id;
                        });
                    }

                    oCdmSiteService.save()
                        .done(function () {
                            oDeferred.resolve();
                        })
                        .fail(function (sErrorMsg) {
                            oDeferred.reject(sErrorMsg);
                        });
                })
                .fail(function (sError) {
                    oDeferred.reject(sGenericErrorMessage + sError);
                });

            return oDeferred.promise();
        };

        /**
         * Resets a given group. Only groups for which <code>isGroupRemovable</code> returns
         * false can be reset.
         *
         * @param {object} oGroup
         *  Group object
         * @returns {jQuery.Deferred}
         *  A promise which will be resolved when the group has been reset successfully.
         *  In case of failure, the fail handler will be called with a respective error message
         *  and the set of groups.
         */
        this.resetGroup = function (oGroup) {
            var oDeferred = new jQuery.Deferred(),
                oCdmSiteService = sap.ushell.Container.getService("CommonDataModel"),
                oSiteGroupsBackup = {},
                that = this,
                sGenericErrorMessage;

            if (oGroup && typeof oGroup === "object" &&
                oGroup.identification &&
                oGroup.identification.id) {

                sGenericErrorMessage = "Failed to reset group with id '" + oGroup.identification.id + "'. ";

                oCdmSiteService.getSite()
                    .done(function (oSite) {
                        jQuery.extend(true, oSiteGroupsBackup, oSite.groups);

                        if (that.isGroupRemovable(oGroup) === false) {
                            oCdmSiteService.getGroupFromOriginalSite(oGroup.identification.id)
                                .done(function (oGroupFromOriginalSite) {
                                    // overwrite respective group in site with the one returned by the original site
                                    if (oSite && typeof oSite === "object" &&
                                        oSite.groups && oSite.groups[oGroup.identification.id]) {
                                        oSite.groups[oGroup.identification.id] = oGroupFromOriginalSite;
                                    }

                                    // persist personalization
                                    oCdmSiteService.save()
                                        .done(function () {
                                            oDeferred.resolve(oGroupFromOriginalSite);
                                        })
                                        .fail(function (sErrorMsg1) {
                                            oDeferred.reject("Group could not be reset - " + sErrorMsg1, oSiteGroupsBackup);
                                        });
                                })
                                .fail(function (sErrorMsg) {
                                    oDeferred.reject("Group could not be reset - " + sErrorMsg, oSiteGroupsBackup);
                                });
                        } else {
                            oDeferred.reject("Group could not be reset as it was created by the user", oSiteGroupsBackup);
                        }
                    })
                    .fail(function (sError) {
                        oDeferred.reject(sGenericErrorMessage + sError, oSiteGroupsBackup);
                    });
            }
            return oDeferred.promise();
        };

        /**
         * Returns the title for a given tile
         *
         * @param {object} oTile
         *  Tile object
         * @returns {string}
         *  The tile's title
         */
        this.getTileTitle = function (oTile) {
            var oResolvedTile;

            if (oTile && oTile.isBookmark) {
                return oTile.title;
            }

            oResolvedTile = this._mResolvedTiles[oTile.id];
            if (oResolvedTile) {
                // oTile.title is set by the user and overwrites the default title
                return oTile.title || oResolvedTile.tileResolutionResult.title;
            } else {
                return "";
            }

        };

        /**
         * Returns the subtitle for a given tile
         *
         * @param {object} oTile
         *  Tile object
         * @returns {string}
         *  The tile's subtitle
         *
         *  @private
         */
        this.getTileSubtitle = function (oTile) {
            var oResolvedTile;

            if (oTile.isBookmark) {
                return oTile.subTitle;
            }

            // TODO works in all cases? e.g. for tiles added via addTile?
            oResolvedTile = this._mResolvedTiles[oTile.id];

            // oTile.subTitle is set by the user and overwrites the default subtitle
            return oTile.subTitle || oResolvedTile.tileResolutionResult.subTitle;
        };

        /**
         * Returns the icon for a given tile
         *
         * @param {object} oTile
         *  Tile object
         * @returns {string}
         *  The tile's icon string
         *
         *  @private
         */
        this.getTileIcon = function (oTile) {
            var oResolvedTile;

            if (oTile.isBookmark) {
                return oTile.icon;
            }

            // TODO works in all cases? e.g. for tiles added via addTile?
            oResolvedTile = this._mResolvedTiles[oTile.id];

            // oTile.icon is set by the user and overwrites the default icon
            return oTile.icon || oResolvedTile.tileResolutionResult.icon;
        };

        /**
         * Returns the description for a given tile
         *
         * @param {object} oTile
         *  Tile object
         * @returns {string}
         *  The tile's description string
         *
         *  @private
         */
        this.getTileInfo = function (oTile) {
            var oResolvedTile;

            if (oTile.isBookmark) {
                return oTile.info;
            }
            oResolvedTile = this._mResolvedTiles[oTile.id];
            return oTile.info || oResolvedTile.tileResolutionResult.info;
        };

        /**
         * Returns the indicatorDataSource for a given tile.
         *
         * @param {object} oTile
         *  Tile object
         * @returns {object}
         *  The returned object will be empty if no indicatorDataSource exists,
         *  or it will have one of the following structures:
         *  <pre>
         *  {
         *     dataSource : {
         *          // same structure as in sap.app/datasources/datasource)
         *          "uri" : "/sap/opu/odata/snce/SRV/",
         *          "type" : "OData",
         *          "settings" : {
         *              // ...
         *          }
         *      },
         *      indicatorDataSource : {
         *          // relative path:
         *          "path" : "Foo$fitler=startswith(lastName, 'A') eq true",
         *          "refresh" : 10
         *      },
         *  }
         *  </pre>
         *  OR
         *  <pre>
         *  {
         *      indicatorDataSource : {
         *          // absolute path:
         *          "path" : "/sap/opu/odata/snce/SRV/Foo$fitler=startswith(lastName, 'A') eq true",
         *          "refresh" : 10
         *      },
         *  }
         *  </pre>
         *
         *  @private
         */
        this.getTileIndicatorDataSource = function (oTile) {
            // TODO works in all cases? e.g. for tiles added via addTile?
            var oResolvedTile = this._mResolvedTiles[oTile.id];
            var oResult = {};
            var oResolutionResult;

            if (oTile.indicatorDataSource) {
                // oTile is set by the user (Bookmark Service) and overwrites the defaults
                oResult.indicatorDataSource = oTile.indicatorDataSource;
                if (oTile.dataSource) {
                    oResult.dataSource = oTile.dataSource;
                }

                return oResult;
            }

            if (oResolvedTile) {
                oResolutionResult = oResolvedTile.tileResolutionResult;

                if (oResolutionResult.indicatorDataSource) {
                    oResult.indicatorDataSource = oResolutionResult.indicatorDataSource;
                }

                if (oResolutionResult.dataSource) {
                    oResult.dataSource = oResolutionResult.dataSource;
                }
            }

            return oResult;
        };

        /**
         * Checks if a given group is removable
         *
         * @param {object} oGroup
         *  Group object
         * @returns {boolean}
         *  The return value is <code>true</true> if the given group is
         *  removable, and <code>false</code> if not.
         */
        this.isGroupRemovable = function (oGroup) {
            return !this._isGroupPreset(oGroup);
        };

        /**
         * Checks if a given group is locked
         *
         * @param {object} oGroup
         *  Group object
         * @returns {boolean}
         *  The return value is <code>true</true> if the given group is
         *  locked, and <code>false</code> if not.
         */
        this.isGroupLocked = function (oGroup) {
            return this._isGroupLocked(oGroup);
        };

        /**
         * Returns the tiles for a given group
         *
         * @param {object} oGroup
         *  Group object
         * @returns {array}
         *  The array consists of all group items (tiles and links).
         *  In case the group does not have items, the array will
         *  be empty.
         */
        this.getGroupTiles = function (oGroup) {
            var aTilesAndLinks = oGroup.payload.tiles || [];
            if (oGroup.payload.links && jQuery.isArray(oGroup.payload.links) && oGroup.payload.links.length > 0) {
                // join both arrays
                aTilesAndLinks = aTilesAndLinks.concat(oGroup.payload.links);
            }
            return aTilesAndLinks;
        };

        /**
         * Returns the links for a given group
         *
         * @param {object} oGroup
         *  Group object
         * @returns {array}
         *  The array consists of all group items (tiles and links).
         *  In case the group does not have items, the array will
         *  be empty.
         */
        this.getLinkTiles = function (oGroup) {
            // Note: This method is actually not used by the FLP Renderer ...
            // getGroupTiles + getTileType is used instead
            if (oGroup.payload.links && jQuery.isArray(oGroup.payload.links) && oGroup.payload.links.length > 0) {
                return oGroup.payload.links;
            } else {
                return [];
            }
        };

        /**
         * Returns the type for a given tile
         *
         * @param {object} oTile
         *  Tile object
         * @returns {string}
         *  Tile type
         */
        this.getTileType = function (oTile) {
            var oResolvedTile = this._mResolvedTiles[oTile.id];
            if (oResolvedTile && oResolvedTile.isLink) {
                return this.TileType.Link;
            }

            return this.TileType.Tile;
        };

        /**
         * Returns the ID for a given tile
         *
         * @param {object} oTile
         *  Tile object
         * @returns {string}
         *  Tile ID
         */
        this.getTileId = function (oTile) {
            return oTile.id;
        };

        /**
         * Returns the size for a given tile
         *
         * @param {object} oTile
         *  Tile object
         * @returns {string}
         *  Tile size
         */
        this.getTileSize = function (oTile) {
            var oResolvedTile = this._mResolvedTiles[oTile.id];
            if (oResolvedTile && oResolvedTile.tileResolutionResult &&
                oResolvedTile.tileResolutionResult.size) {
                return oResolvedTile.tileResolutionResult.size;
            }
            return "1x1";
        };

        /**
         * Returns the target URL for a given tile
         *
         * @param {object} oTile
         *  Tile object
         * @returns {string}
         *  Tile target.
         *  String could be empty.
         */
        this.getTileTarget = function (oTile) {
            var oResolutionResult,
                oResolvedTile = this._mResolvedTiles[oTile.id],
                sTargetUrl;

            if (oTile.target && oTile.target.url) {
                // this seems to be a URL bookmark tile
                return oTile.target.url;
            }

            if (oResolvedTile && oResolvedTile.tileResolutionResult) {
                oResolutionResult = oResolvedTile.tileResolutionResult;

                if (oResolutionResult.isCustomTile !== true) {
                    // static or dynamic app launcher
                    return oResolvedTile.tileIntent;
                }

                if (oResolutionResult && typeof oResolutionResult.targetOutbound === "object") {
                    // custom tile with a target outbound
                    sTargetUrl = this._toHashFromOutbound(oResolutionResult.targetOutbound);

                    if (sTargetUrl) {
                        return sTargetUrl;
                    }
                }
            }

            jQuery.sap.log.warning(
                "Could not find a target for Tile with id '" + oTile.id + "'",
                "sap.ushell.adapters.cdm.LaunchPageAdapter"
            );
            return "";
        };

        /**
         * Checks if a tile personalization is supported
         *
         * @param {object} oTile
         *  Tile to check for personalization support
         * @returns {boolean}
         *  The return value is <code>true</true> if the tile personalizationis is
         *  supported, and <code>false</code> if not.
         */
        this.isLinkPersonalizationSupported = function (oTile) {
            return true;
        };

        /**
         * Checks if a tile intent is supported
         *
         * @param {object} oTile
         *  Tile object
         * @returns {boolean}
         *  The return value is <code>true</true> if the tile intent is
         *  supported, and <code>false</code> if not.
         */
        this.isTileIntentSupported = function (oTile) {
            return (this._mFailedResolvedTiles[oTile.id] === undefined) ? true : false;
        };

        /**
         * Refreshs a given tile
         *
         * @param {object} oTile
         *  Tile object
         */
        this.refreshTile = function (oTile) {
            // nothing to do here for the moment as we don't have dynamic data
        };

        /**
         * Sets the visibility for a given tile
         *
         * @param {object} oTile
         *  Tile object
         * @param {boolean} bNewVisible
         *  New visibility
         */
        this.setTileVisible = function (oTile, bNewVisible) {
            var oResolvedTile = this._mResolvedTiles[oTile.id];

            if (oResolvedTile && oResolvedTile.tileComponent && typeof oResolvedTile.tileComponent.tileSetVisible === "function") {
                // only inform the tile if something changed
                if (oResolvedTile.visibility !== bNewVisible) {
                    oResolvedTile.visibility = bNewVisible;
                    oResolvedTile.tileComponent.tileSetVisible(bNewVisible);
                }
            }
        };

        /**
         * Returns the UI for a given group tile
         *
         * @param {object} oGroupTile
         *  Group tile
         * @returns {jQuery.Promise}
         *  In case of success, the done handler is called with the respective
         *  tile UI. In case of failure a respective error message is passed
         *  to the fail handler which will be called in this case.
         */
        this.getTileView = function (oGroupTile) {
            var oAdapter = this;
            return new jQuery.Deferred(function (oDeferred) {
                return oAdapter._getTileView(oGroupTile, false).then(function (oTileUI) {
                    oDeferred.resolve(oTileUI);
                }, function (sReason) {
                    var sErrorMessage = "Tile with ID '" + oGroupTile.id + "' could not be initialized" + (sReason ? ":\n" + sReason : ".");

                    jQuery.sap.log.error(sErrorMessage, null, oGroupTile.tileType);
                    oDeferred.reject(sErrorMessage);
                });
            }).promise();
        };

        this._getResolvedTile = function (oTile, iIndex) {
            var sHash;
            var mSuccessCache = this._mResolvedTiles;
            var mFailureCache = this._mFailedResolvedTiles;

            function updateCaches(oResolvedTile) {
                mSuccessCache[oTile.id] = oResolvedTile;

                if (mFailureCache[oTile.id]) {
                    delete mFailureCache[oTile.id];
                }

                return oResolvedTile;
            }

            if (mSuccessCache[oTile.id]) {
                return (new jQuery.Deferred())
                    .resolve(mSuccessCache[oTile.id])
                    .promise();
            }

            if (oTile.target && oTile.target.url) {
                // seems to be a URL bookmark tile launching an arbitrary URL.
                // It cannot be resolved.
                return new jQuery.Deferred()
                    .resolve(updateCaches(this._getTileForUrl(oTile)))
                    .promise();
            }

            sHash = this._prepareTileHash(oTile, iIndex);

            return this._getTileFromHash(sHash).then(
                updateCaches,
                function (sError) {
                    mFailureCache[oTile.id] = sError;

                    return sError;
                }
            );
        };

        /**
         * Returns the component container including the respective UI
         * component for group and catalog tiles.
         * Helper function for _getCatalogTileView and _getTileView
         * functions. It bundles the common logic for both functions.
         *
         *
         * @param {object} oTile
         *  Group or catalog tile
         * @param {object} oResolvedTile
         *  Resolved group or catalog tile
         * @param {boolean} bIsCatalogTile
         *  Indicates whether the tile is a catalog tile or not
         *
         * @returns {object}
         *  promise that resolves to Component container including the respective UI component
         *
         * @private
         */
        this._getTileUiComponentContainer = function (oTile, oResolvedTile, bIsCatalogTile) {
            var that = this,
                oResolutionResult,
                oTileComponentData,
                sNavigationMode,
                oTileComponentInstance,
                oCompContainer;

            var oComponentLoader = sap.ushell.Container.getService("Ui5ComponentLoader");

            // should only be called after tile has been resolved
            if (bIsCatalogTile === true) {
                oTileComponentData = that._createTileComponentData(oTile, true, oResolvedTile);
            } else {
                oTileComponentData = that._createTileComponentData(oTile, false, oResolvedTile);
            }

            oResolutionResult = oResolvedTile.tileResolutionResult;

            if (oResolvedTile.isLink) {
                sNavigationMode = oResolutionResult.navigationMode;
                // Do not instantiate the actual tile but only return a Link control
                var oDeferred = new jQuery.Deferred();
                oDeferred.resolve(that._createLinkInstance(oTile, bIsCatalogTile, sNavigationMode, GenericTile, oResources));
                return oDeferred.promise();
            }

            var oTileComponentProperties = this._createTileComponentProperties(
                oTileComponentData,
                oResolutionResult.tileComponentLoadInfo
            );

            if (!oTileComponentProperties.name) {
                return new jQuery.Deferred()
                    .reject("Cannot find name of tile component for tile with id: '"+ oTile.id + "'")
                    .promise();
            }

            // FIXME: remove temporary HACK for making SSB tiles running:
            // expose manifest in componentData properties
            if (oTileComponentProperties.manifest) {
                oTileComponentData.properties = oTileComponentData.properties || {};
                oTileComponentData.properties.manifest = oTileComponentProperties.manifest;
            }

            return oComponentLoader.createComponent({
                loadCoreExt: true,
                loadDefaultDependencies: false,
                componentData: oTileComponentData,
                url: oTileComponentProperties.url,
                applicationConfiguration: {},
                reservedParameters: {},
                applicationDependencies: oTileComponentProperties,
                ui5ComponentName: oTileComponentProperties.name
            },
            {}, // don't generate an id
                // TODO: clarify about having stable IDs!
            []  // instantiate directly
            ).then(function (oAppProperties) {
                oTileComponentInstance = oAppProperties.componentHandle.getInstance();

                oCompContainer = new sap.ui.core.ComponentContainer({
                    component: oTileComponentInstance,
                    height: '100%'
                });

                if (bIsCatalogTile === true) {
                    that._mResolvedCatalogTiles[oTile.id].tileComponent = oTileComponentInstance;
                } else {
                    that._mResolvedTiles[oTile.id].tileComponent = oTileComponentInstance;
                }

                return oCompContainer;
            });
        };

        this._createTileComponentProperties = function (oTileComponentData, vTileComponentLoadInfo) {
            var oTileComponentProperties = {};

            if (typeof vTileComponentLoadInfo === "string") {
                // This is a Static or Dynamic App Launcher
                // Consider also the indicatorDataSource from oTile, even if none is set in
                // oResolutionResult. This is done by using oTileComponentData instead of oResolutionResult
                if (oTileComponentData.properties.indicatorDataSource &&
                    oTileComponentData.properties.indicatorDataSource.path) {
                    // Dynamic App launcher
                    oTileComponentProperties.name = "sap.ushell.components.tiles.cdm.applauncherdynamic";
                } else {
                    // Static App Launcher
                    oTileComponentProperties.name = "sap.ushell.components.tiles.cdm.applauncher";
                }

                return oTileComponentProperties;
            }

            if (typeof vTileComponentLoadInfo === "object" && vTileComponentLoadInfo !== null) {
                // Custom tile
                // Do not use tileComponentLoadInfo["sap.platform.runtime"].componentProperties
                // as with "includeManifest" tileComponentLoadInfo.componentProperties contains
                // the entire manifest already
                oTileComponentProperties = vTileComponentLoadInfo.componentProperties || {};
                oTileComponentProperties.name = vTileComponentLoadInfo.componentName;
            }

            return oTileComponentProperties;
        };

        /**
         * Returns the UI for a given tile.
         *
         * @param {object} oGroupTile
         *  Group tile
         *
         * @returns {jQuery.Deferred}
         *  On success, returns a promise that resolves to tile UI or null
         *  (when component name is unknown or the tile component could not be
         *  instantiated).
         *
         *  Or rejects when tile data cannot be accessed successfully.
         *
         * @private
         */
        this._getTileView = function (oGroupTile) {
            var that = this,
                oTileDataPromise,
                sTileHash,
                sErrorMessage,
                oDeferred = new jQuery.Deferred();

            if (typeof oGroupTile !== "object" || !oGroupTile.id) {
                sErrorMessage = "Invalid input parameter passed to _getTileView: " + oGroupTile;
                jQuery.sap.log.error(sErrorMessage);
                return oDeferred.reject(sErrorMessage).promise();
            }

            sTileHash = this._prepareTileHash(oGroupTile);

            oTileDataPromise = (oGroupTile.id && this._mResolvedTiles[oGroupTile.id])
                || this._getTileFromHash(sTileHash);

            return jQuery.when(oTileDataPromise)
                .then(function (oResolvedTile) {
                    if (that._mResolvedTiles.hasOwnProperty(oGroupTile.id) === false) {
                        that._mResolvedTiles[oGroupTile.id] = oResolvedTile;
                    }

                    return that._getTileUiComponentContainer(oGroupTile, oResolvedTile, false);
                });

        };

        /**
         * Returns the UI for a given catalog tile.
         *
         * @param {object} oCatalogTile
         *  Catalog tile
         *
         * @returns {object}
         * return promise of Catalog tile view of given catalog tile
         *
         * @private
         */
        this._getCatalogTileView = function (oCatalogTile) {

            if (typeof oCatalogTile !== "object") {
                return new jQuery.Deferred().reject(oCatalogTile);
            }

            // As catalog tiles are already passed as resolved catalog tiles,
            // we do not distinguish between the unresolved and resolved variant
            // as part of the following call.
            return this._getTileUiComponentContainer(oCatalogTile, oCatalogTile, true);
        };

        /**
         * Creates the component data needed to instantiate tiles
         *
         * @param {object} oTile
         *  tile to create the component data for
         *  @param {boolean} bIsCatalogTile True, if given tile is a catalog tile.
         */
        this._createTileComponentData = function (oTile, bIsCatalogTile, oResolutionResult) {
            var sTitle = bIsCatalogTile ? this.getCatalogTileTitle(oTile) : this.getTileTitle(oTile),
                sSubTitle = bIsCatalogTile ? this.getCatalogTilePreviewSubtitle(oTile) : this.getTileSubtitle(oTile),
                sIcon = bIsCatalogTile ? this.getCatalogTilePreviewIcon(oTile) : this.getTileIcon(oTile),
                sInfo = bIsCatalogTile ? this.getCatalogTilePreviewInfo(oTile) : this.getTileInfo(oTile),
                sTarget = bIsCatalogTile ? this.getCatalogTileTargetURL(oTile) : this.getTileTarget(oTile),
                oIndicatorDataSource = this.getTileIndicatorDataSource(oTile),
                oComponentData = {
                    properties: {},
                    startupParameters: {}
                };

            // Check whether tile is a custim tile
            if (oResolutionResult.tileResolutionResult.isCustomTile === true
                && oResolutionResult.tileResolutionResult.startupParameters) {
                // Pass startup parameters to tile component data
                oComponentData.startupParameters = oResolutionResult.tileResolutionResult.startupParameters;
            }

            if (sTitle) {
                oComponentData.properties.title = sTitle;
            }
            if (sInfo) {
                oComponentData.properties.info = sInfo;
            }
            if (sSubTitle) {
                oComponentData.properties.subtitle = sSubTitle;
            }
            if (sIcon) {
                oComponentData.properties.icon = sIcon;
            }
            if (sTarget) {
                oComponentData.properties.targetURL = sTarget;
            }
            if (oIndicatorDataSource.indicatorDataSource) {
                oComponentData.properties.indicatorDataSource =
                    oIndicatorDataSource.indicatorDataSource;

                // data source is only relevant if the indicatorDataSource is present as well
                if (oIndicatorDataSource.dataSource) {
                    oComponentData.properties.dataSource =
                        oIndicatorDataSource.dataSource;
                }
            }
            if (oResolutionResult.tileResolutionResult) {
                oComponentData.properties.navigationMode = oResolutionResult.tileResolutionResult.navigationMode;
            }
            return oComponentData;
        };

        /**
         * Creates a link instance for the given tile
         *
         * @param {string} sTitle
         *  The title serves as text for the link
         * @param {s} sUrl
         *  tThe URL serves as HREF for the link.
         * @returns {object}
         *  Link object
         *
         * @private
         */
        this._createLinkInstance = function (oTile, bIsCatalogTile, sNavigationMode, fnGenericTile, oResources) {
            var sTileTitle,
                linkTileControl,
                sTranslatedNavMode,
                sTileSubTitle = this.getTileSubtitle(oTile);

            var GenericTile = fnGenericTile;

            // should only be called after tile has been resolved
            if (bIsCatalogTile === true) {
                sTileTitle = this.getCatalogTileTitle(oTile);
            } else {
                sTileTitle = this.getTileTitle(oTile);
            }

            // By using the LineMode, the GenericTile is displayed as a Link
            linkTileControl = new GenericTile ({
                mode: oGenericTileMode.LineMode,
                subheader: sTileSubTitle,
                header: sTileTitle,
                //TODO: The below code is for POC only, should be removed once UI5 provide action buttons for line mode
                press: function(oEvent) {
                    this._genericTilePressHandler(oTile, oEvent);
                }.bind(this)
            });
            if(sNavigationMode){
                sTranslatedNavMode = oResources.i18n.getText(sNavigationMode + "NavigationMode");
                //According to ACC-257 aria-label should start with the navigation mode, then the tile content
                linkTileControl.setAriaLabel(sTranslatedNavMode + " " + sTileTitle + " " + sTileSubTitle);
            }
            this._mResolvedTiles[oTile.id].linkTileControl = linkTileControl;
            return linkTileControl;
        };


        this._genericTilePressHandler = function (oTile, oEvent) {
            var sTargetURL;

            if (oEvent.getSource().getScope && oEvent.getSource().getScope() === "Display") {
                sTargetURL = this.getTileTarget(oTile);
                if (sTargetURL) {
                    if (sTargetURL[0] === '#') {
                        hasher.setHash(sTargetURL);
                    } else {
                        window.open(sTargetURL, '_blank');
                    }
                }
            }
        };

        this._addTileToSite = function (oPersonalizedSite, oGroup, newTile, oCdmSiteService) {
            // TODO JSDoc
            // TODO consider to change the interface so it is not needed to pass newTile
            //  which should be created inside this method
            var that = this,
                oDeferred = new jQuery.Deferred(),
                oIntent = sap.ushell.Container.getService("URLParsing").parseShellHash(newTile.properties.targetURL),
                oTileToBeAdded = {
                    "id": that.getTileId(newTile),
                    "target": {
                        "semanticObject": oIntent.semanticObject,
                        "action": oIntent.action,
                        "parameters": createTileParametersFromIntentParams(oIntent.params)
                    }
                };

            oPersonalizedSite.groups[oGroup.identification.id].payload.tiles.push(oTileToBeAdded);

            //store personalization
            oCdmSiteService.save()
                .done(function () {
                    oDeferred.resolve(oTileToBeAdded);
                })
                .fail(function (sMessage) {
                    oDeferred.reject(sMessage);
                });

            return oDeferred.promise();
        };

        /**
         * Adds a tile to the homepage. Furthermore the personalization will be
         * persisted for the end user.
         *
         * @param {object} oCatalogTile
         *  Catalog Tile
         * @param {object} oGroup
         *  Group object
         * @returns {jQuery.Promise}
         *  A promise which will be resolved when the tile has been added successfully.
         *  The new tile itself will be passed to the promise's done handler in case of
         *  success. In case of failure, the fail handler will be called with a respective
         *  error message.
         */
        this.addTile = function (oCatalogTile, oGroup) {
            if (!oGroup) {
                oGroup = _oDefaultGroup;
            }

            var oDeferred = new jQuery.Deferred(),
                that = this,
                sGenericErrorMessage;

            if (oCatalogTile.contentProviderId) {
                if (oCatalogTile.externalUrl) {
                    // Add extension catalog tile as bookmark so that the
                    // extension site is not needed during FLP start-up for
                    // resolving the tile (fast, stable startup). This is a
                    // restriction for extension tiles.
                    return this.addBookmark(
                        this._getBookmarkDataForExtensionCatalogTile(oCatalogTile),
                        oGroup
                    );
                }
                return oDeferred.reject("Extension Tile without URL").promise();
            }

            // in the process of adding a catalog tile to the group, we resolve the tile
            var sHash = that.getCatalogTileTargetURL(oCatalogTile); // TODO check escaping

            var oUrlParsing = sap.ushell.Container.getService("URLParsing");
            var oIntent = oUrlParsing.parseShellHash(sHash);
            var oTile = composeNewTile(
                {}, // oParameters
                createNewTargetFromIntent(oIntent)
            );

            sGenericErrorMessage = "Failed to add tile with id '" + oTile.id +
                "' to group with id '" + oGroup.identification.id + "'. ";

            that._getTileFromHash(sHash)
                .fail(function (sErrorMsg) {
                    that._mFailedResolvedTiles[oTile.id] = sErrorMsg;
                })
                .done(function (newTile) {
                    // add new tile to list of resolved tiles
                    that._mResolvedTiles[oTile.id] = newTile;


                    var oCdmSiteService = sap.ushell.Container.getService("CommonDataModel");
                    // change title in site object

                    oCdmSiteService.getSite()
                        .done(function (oSite) {
                            // We should think about the reasons why it's not safe to
                            // do the following, even though it's more succint:
                            //     oGroup.payload.tiles.push(oTile);
                            oSite.groups[oGroup.identification.id].payload.tiles.push(oTile);

                            oCdmSiteService.save()
                                .done(function () {
                                    oDeferred.resolve(oTile);
                                })
                                .fail(function (sReason) {
                                    oDeferred.reject(sReason);
                                });
                        })
                        .fail(function (sError) {
                            oDeferred.reject(sGenericErrorMessage + sError);
                        });
                });

            return oDeferred.promise();
        };

        /**
         * Returns a settings object (necessary to call
         * <code>#addBookmark</code>) out of a tile from an extension
         * catalog.
         *
         * @param {object} oExtensionCatalogTile
         *    Catalog tile from an extension catalog. Catalog tiles form the
         *    main site's catalogs are not supported!
         *
         * @returns {object}
         *  Object as expected by <code>#addBookmark</code>
         *
         * @private
         */
        this._getBookmarkDataForExtensionCatalogTile = function (oExtensionCatalogTile) {
            var oBookmarkSettings = {
                title: oExtensionCatalogTile.tileResolutionResult.title,
                subtitle: oExtensionCatalogTile.tileResolutionResult.subTitle,
                icon: oExtensionCatalogTile.tileResolutionResult.icon,
                info: oExtensionCatalogTile.tileResolutionResult.info,
                url: oExtensionCatalogTile.externalUrl
            };

            if (oExtensionCatalogTile.tileResolutionResult.indicatorDataSource &&
                    oExtensionCatalogTile.tileResolutionResult.indicatorDataSource.path) {
                oBookmarkSettings.serviceUrl = oExtensionCatalogTile.tileResolutionResult.indicatorDataSource.path;
                oBookmarkSettings.serviceRefreshInterval = oExtensionCatalogTile.tileResolutionResult.indicatorDataSource.refresh;
            }

            return oBookmarkSettings;
        };

        /**
         * Removes a tile from a given group on the homepage. Furthermore the personalization will be
         * persisted for the end user.
         *
         * @param {object} oGroup
         *  Group object
         * @param {object} oTile
         *  Tile object
         * @param {number} iIndex
         *  Index of the given tile in the respective group
         * @returns {jQuery.Promise}
         *  A promise which will be resolved when the tile has been removed successfully.
         *  In case of failure, the fail handler will be called with a collection of existing groups.
         */
        this.removeTile = function (oGroup, oTile, iIndex) {
            var oCdmSiteService,
                sGenericErrorMessage,
                oDeferred = new jQuery.Deferred(),
                that = this;

            if (!oGroup || typeof oGroup !== "object" || !oGroup.identification || !oGroup.identification.id ||
                    !oTile || typeof oTile !== "object" || !oTile.id) {
                return oDeferred.reject({}, "Failed to remove tile. No valid input parameters passed to removeTile method.").promise();
            }

            sGenericErrorMessage = "Failed to remove tile with id '" + oTile.id + "' from group with id '" + oGroup.identification.id + "'. ";

            oCdmSiteService = sap.ushell.Container.getService("CommonDataModel");
            oCdmSiteService.getSite()
                .done(function (oSite) {
                    var oPayload,
                        sPayloadType;

                    // Succintly convert iIndex to number
                    iIndex = +iIndex;

                    try {
                        oPayload = oSite.groups[oGroup.identification.id].payload;
                    } catch (e) {
                        oDeferred.reject(oSite.groups[oGroup.identification.id], sGenericErrorMessage);
                    }

                    //according to the tile type set oPayload tile / links to be trancated.
                    sPayloadType = that.getTileType(oTile) === that.TileType.Link? "links" : "tiles";

                    //In case the target is a link convert the iTargetIndex to the index of links payload.
                    if (that.getTileType(oTile) === that.TileType.Link) {
                        iIndex -= oPayload.tiles.length;
                    }

                    if (iIndex >= 0) {
                        // remove element in group
                        oPayload[sPayloadType].splice(iIndex, 1);
                    } else {
                        oPayload[sPayloadType] = oPayload[sPayloadType].filter(function (oGroupElement) {
                            return oGroupElement.id !== oTile.id;
                        });
                    }

                    oCdmSiteService.save()
                        .done(function () {
                            oDeferred.resolve();
                        })
                        .fail(function (sErrorMsg) {
                            jQuery.sap.log.error(sErrorMsg);
                            oDeferred.reject(oSite.groups[oGroup.identification.id], sErrorMsg);
                        });
                })
                .fail(function (sError) {
                    // Reject an empty group object, as site with correct group data could not get accessed
                    oDeferred.reject({}, sGenericErrorMessage + sError);
                });

            return oDeferred.promise();
        };

        /**
         * Moves a tile within a certain group or across different groups
         * on the homepage
         *
         * @param {object} oTile
         *  Tile to be moved
         * @param {number} iSourceIndex
         *  Position index of tile in source group
         * @param {number} iTargetIndex
         *  Aimed position index of tile in target group
         * @param {object} oSourceGroup
         *  Source group which currently contains the tile
         * @param {object} oTargetGroup
         *  Aimed target group where the tile should be moved to
         * @returns {jQuery.Promise}
         *  A promise which will be resolved when the tile has been removed successfully.
         *  In case of failure, the fail handler will be called with a collection of existing groups.
         */
        this.moveTile = function (oTile, iSourceIndex, iTargetIndex, oSourceGroup, oTargetGroup, newTileType) {
            var oDeferred = new jQuery.Deferred(),
                oCdmSiteService = sap.ushell.Container.getService("CommonDataModel"),
                that = this,
                sGenericErrorMessage;

            if (!oTile || jQuery.isEmptyObject(oTile) ||
                iSourceIndex === undefined || iSourceIndex < 0 ||
                iTargetIndex === undefined || iTargetIndex < 0 ||
                !oSourceGroup || !oSourceGroup.identification || !oSourceGroup.identification.id ||
                !oTargetGroup || !oTargetGroup.identification || !oTargetGroup.identification.id) {
                return oDeferred.reject("Invalid input parameters").promise();
            }

            sGenericErrorMessage = "Failed to move tile with id '" + oTile.id + "'. ";

            oCdmSiteService.getSite()
                .done(function (oSite) {
                    var sTargetPayloadType,
                        oGroupPayload,
                        sOrigTileType = that.getTileType(oTile) === that.TileType.Link? "links" : "tiles";

                    //if newTileType is not defined convert to the same type.
                    if (!newTileType) {
                        newTileType = that._mResolvedTiles[oTile.id].isLink? "link": "tile";
                    }

                    sTargetPayloadType = newTileType === "link"? "links" : "tiles";

                    // change the _mResolvedTiles tile type.
                    if (sOrigTileType != sTargetPayloadType && that._mResolvedTiles[oTile.id]) {
                        that._mResolvedTiles[oTile.id].isLink = newTileType === "link"; // currently only bookmark tiles can be created
                    }

                    //In case the target is a link convert the iTargetIndex to the index of links payload.
                    if (sTargetPayloadType === "links") {
                        iTargetIndex -= oSite.groups[oTargetGroup.identification.id].payload.tiles.length;
                    }

                    //In case the source is a link convert the index to the index of links payload.
                    if (sOrigTileType === "links") {
                        iSourceIndex -= oSite.groups[oSourceGroup.identification.id].payload.tiles.length;
                    }

                    // check for move operation within a group or across different groups
                    if (oSourceGroup.identification.id === oTargetGroup.identification.id) {

                        // within a group
                        if (iSourceIndex !== iTargetIndex || sOrigTileType != sTargetPayloadType) {
                            oGroupPayload = oSite.groups[oTargetGroup.identification.id].payload;

                            if (sOrigTileType === "tiles") {
                                iTargetIndex++;
                            }
                            oGroupPayload[sOrigTileType].splice(iSourceIndex, 1); // remove tile at source index
                            oGroupPayload[sTargetPayloadType].splice(iTargetIndex, 0, oTile); // add tile at target index
                        } else {
                            // no move operation took place
                            return oDeferred.resolve(oTile).promise();
                        }
                    } else {
                        // across different groups
                        oSite.groups[oSourceGroup.identification.id].payload[sOrigTileType].splice(iSourceIndex, 1); // remove tile in source group
                        oSite.groups[oTargetGroup.identification.id].payload[sTargetPayloadType].splice(iTargetIndex, 0, oTile); // add tile to target group
                    }

                    oCdmSiteService.save()
                        .done(function () {
                            oDeferred.resolve(oTile);
                        })
                        .fail(function (sError) {
                            jQuery.sap.log.error(sGenericErrorMessage + sError);
                            oDeferred.reject(sGenericErrorMessage + sError);
                        });
                })
                .fail(function (sError) {
                    jQuery.sap.log.error(sGenericErrorMessage + sError);
                    oDeferred.reject(sGenericErrorMessage + sError);
                });

            return oDeferred.promise();
        };
        /**
         * Determines if a given Catalog A is bigger than a given Catalog B
         * It is assumed that A.identification.id is unequal B.identification.id
         */
        this._compareCatalogs = function (oA, oB) {
            // note: do not return a boolean as IE does not accept it
            if ( oA.identification.id > oB.identification.id) {
                return 1;
            }
            return -1;
        };

        /**
         * Requests a collection of catalogs. The catalogs get extracted out of
         * the Common Data Model site. Consumers of this method have the
         * opportunity to attach a progress handler to the returned jQuery
         * Promise to get notified for each catalog once it got processed.
         * The argument of the attached progress handler will be the respective
         * catalog object.
         *
         * @returns {jQuery.Promise}
         *  In case of success the done handler will be called with an array of
         *  catalog objects. In case of failure the fail handler will be called
         *  with a respective error message. No assumption should be made on
         *  the order with which the catalogs are returned.
         */
        this.getCatalogs = function () {
            var that = this,
                oDeferred = new jQuery.Deferred(),
                aCatalogs = [],
                oCDMSiteService = sap.ushell.Container.getService("CommonDataModel");

            function processCatalog(oCdmSite, sCatalogId, aCatalogs, oGetCatalogsDeferred, sProviderId, oProviderCache) {
                var oCatalog = oCdmSite.catalogs[sCatalogId];
                oCatalog.id = sCatalogId;
                if (sProviderId && oProviderCache) {
                    oCatalog.contentProviderId = sProviderId;
                    oProviderCache.catalogsMap[sCatalogId] = oCatalog;
                }
                aCatalogs.push(oCatalog);
                oGetCatalogsDeferred.notify(oCatalog);
            }

            // setTimeout is required here. Otherwise the the oDeferred.notify() would
            // be a synchrounous call, which would cause wrong behaviour in some scenarios
            window.setTimeout(function () {

                oCDMSiteService.getSite().done(function (oSite) {
                    // catalogs from site should be loaded first as they require
                    // loading of less resources
                    Object.keys(oSite.catalogs).forEach(function (sCatalogId) {
                        processCatalog(oSite, sCatalogId, aCatalogs, oDeferred);
                    });

                    oCDMSiteService.getExtensionSites().progress(function (oLoadResult) {
                        var sProviderId = oLoadResult.providerId;
                        var oExtensionSite = oLoadResult.site;
                        var oExtensionSitePromise = Promise.resolve(oExtensionSite);

                        var oProviderCache = {
                            sitePromise: oExtensionSitePromise,
                            site: oExtensionSite,
                            catalogsMap: {} // added later
                        };

                        // one site was loaded
                        Object.keys(oExtensionSite.catalogs).forEach(function (sCatalogId) {
                            that._mContentProviders[sProviderId] = oProviderCache;

                            processCatalog(
                                oExtensionSite,
                                sCatalogId,
                                aCatalogs,
                                oDeferred,
                                sProviderId, // note: difference to .getSite() catalogs
                                oProviderCache
                            );
                        });

                    }).done(function (aLoadReport) {
                        aLoadReport.filter(function (oLoadReport) {
                            // error logging
                            return !oLoadReport.success;
                        }).forEach(function (oFailedLoadReport, iIdx) {
                            // Add the failed site as a catalog to signal that
                            // an error occurred. The consumer should always
                            // call #getCatalogError on the returned catalog.
                            aCatalogs.push({
                                identification: {
                                    // id needed for sorting
                                    id: oFailedLoadReport.providerId
                                },
                                contentProviderId: oFailedLoadReport.providerId,
                                error: "The following content providers could not provide catalogs: "
                                    + oFailedLoadReport.providerId
                                    + ( oFailedLoadReport.error
                                        ? " -> " + oFailedLoadReport.error
                                        : ""
                                    )
                            });
                        });

                        // In our tests we use indices to access specific
                        // catalogs from the getCatalogs response. For this
                        // reason we are sorting the result. As stated in the
                        // documentation, this shouldn't really matter for the
                        // caller. The caller should not code against a
                        // specific sort order.
                        //
                        // Note that oA.identification.id is a string and
                        // usually not a number Note that "A" is bigger than
                        // "1"
                        oDeferred.resolve(aCatalogs.sort(that._compareCatalogs));
                    });
                });
            }, 0);
            return oDeferred.promise();
        };


        /**
         * Test whether an inbound is potentially startable, e.g. has not  an obvious
         * filter.
         *
         * @param {object} oInbound
         *  An inbound
         * @returns {boolean}
         *  Indicates whether the inbound appears as startable
         *
         * @private
         */
        this._isStartableInbound = function (oInbound) {
            if (!jQuery.sap.getObject("signature.parameters", undefined, oInbound)) {
                return true;
            }
            var bRes = Object.keys(oInbound.signature.parameters).every(function (sParameter) {
                // there is a special modelling that an exported tile pointing to a URL
                // is matched by exactly this inbound with a plain filter.
                // The export models tiles in this way (Shell-startUrl), however, generically
                // enabling to display values with a filter would bring up tiles which are
                // explicitely "filtered out" by requiring filters
                return !oInbound.signature.parameters[sParameter].filter
                    || (sParameter === "sap-external-url");
            });
            return bRes;
        };

        this._isHiddenInbound = function (oInbound) {
            return !!oInbound.hideLauncher;
        };

        /**
         * Constructs an inner shell hash for an inbound which represents a hash.
         * This includes the hash, e.g. #SO-action?abc=def
         *
         * @param {object} oInbound
         *  Inbound which gets used to construct the hash
         *
         * @returns {string}
         *  Constructed Hash (with prefix '#')
         *
         * @private
         */
        this._toHashFromInbound = function (oInbound) {
            var oShellHash,
                oParams,
                sConstructedHash;

            oShellHash = {
                target: {
                    semanticObject: oInbound.semanticObject,
                    action: oInbound.action
                },
                params: {}
            };

            oParams = jQuery.sap.getObject("signature.parameters", undefined, oInbound) || {};

            Object.keys(oParams).forEach(function (sKey) {
                if (oParams[sKey].filter && Object.prototype.hasOwnProperty.call(oParams[sKey].filter, "value") &&
                    (oParams[sKey].filter.format === undefined || oParams[sKey].filter.format === "plain")) {
                    oShellHash.params[sKey] = [oParams[sKey].filter.value];
                }

                if (oParams[sKey].launcherValue && Object.prototype.hasOwnProperty.call(oParams[sKey].launcherValue, "value") &&
                        (oParams[sKey].launcherValue.format === undefined || oParams[sKey].launcherValue.format === "plain")) {
                        oShellHash.params[sKey] = [oParams[sKey].launcherValue.value];
                    }
            });

            sConstructedHash = sap.ushell.Container.getService("URLParsing").constructShellHash(oShellHash);

            if (!sConstructedHash) {
                return undefined;
            }
            return "#" + sConstructedHash;
        };

        /**
         * Returns the URL to be launched from a given inbound.
         *
         * @param {object} oInbound
         *    An application inbound as found in the site
         *
         * @returns {string}
         *    The URL to launch when the tile is clicked or null if the launch
         *    url cannot be found.
         *
         * @private
         */
        this._getExternalUrlFromInbound = function (oInbound) {
            return jQuery.sap.getObject("signature.parameters.sap-external-url.launcherValue.value",
                    undefined, oInbound) || null;
        };

        /**
         * Constructs an inner shell hash for an outbound which represents a hash.
         * This includes the hash, e.g. #SO-action?abc=def
         *
         * @param {object} oOutbound
         *  Outbound which gets used to construct the hash
         *
         * @returns {string}
         *  Constructed Hash (with prefix '#')
         *
         * @private
         */
        this._toHashFromOutbound = function (oOutbound) {
            var oShellHash,
                oParams,
                sConstructedHash;

            oShellHash = {
                target: {
                    semanticObject: oOutbound.semanticObject,
                    action: oOutbound.action
                },
                params: {}
            };

            oParams = oOutbound.parameters || {};

            Object.keys(oParams).forEach(function (sKey) {
                if (oParams.hasOwnProperty(sKey) && typeof oParams[sKey].value === "object") {
                    oShellHash.params[sKey] = [oParams[sKey].value.value];
                }
            });

            sConstructedHash = sap.ushell.Container.getService("URLParsing").constructShellHash(oShellHash);

            if (!sConstructedHash) {
                return undefined;
            }
            return "#" + sConstructedHash;
        };

        /**
         * Checks if an application represents a custom tile
         * @param {object} oApplication
         *  An AppDescriptor subset
         * @returns {boolean}
         *  Indicates whether the application represents a custom tile or not
         *
         * @private
         */
        this._isCustomTile = function (oApplication) {
            if (sap.ushell.utils.getMember(oApplication, "sap|flp.type") === "tile") {
                return true;
            }
            return false;
        };

        /**
         * Delivers the catalog tiles for a given catalog
         *
         * @param {object} oCatalog
         *  Catalog
         * @returns {jQuery.Promise}
         *  In case of success the done handler will be called with an array
         *  of catalog tiles.
         */
        this.getCatalogTiles = function (oCatalog) {
            var that = this,
                oDeferred = new jQuery.Deferred();

            if (typeof oCatalog !== "object" || oCatalog === null) {
                return oDeferred.reject("Invalid input parameter '" + oCatalog + "' passed to getCatalogTiles.").promise();
            }

            if (oCatalog.contentProviderId && this._mContentProviders[oCatalog.contentProviderId]) {
                this._mContentProviders[oCatalog.contentProviderId].sitePromise.then(function (oSite) {
                    getCatalogTilesFromSite.call(that, oCatalog, oSite)
                        .done(oDeferred.resolve)
                        .fail(oDeferred.reject);
                }, function (sErrorMessage2) {
                        oDeferred.reject("Failed to get site: " + sErrorMessage2);
                    });
            } else {
                sap.ushell.Container.getService("CommonDataModel").getSite()
                    .done(function(oSite) {
                        getCatalogTilesFromSite.call(that, oCatalog, oSite)
                            .done(oDeferred.resolve)
                            .fail(oDeferred.reject);
                    })
                    .fail(function (sErrorMessage2) {
                        oDeferred.reject("Failed to get site: " + sErrorMessage2);
                    });
            }

            return oDeferred.promise();
        };

        /**
         * Returns unique inbounds.
         *
         * <p>
         * If the application has multiple inbounds defined and some of them
         * share the same combination of semantic object and action, just one
         * tile should be displayed.  Different parameters that are part of the
         * signature do not influence this behaviour.  Note: Multiple equal
         * inbounds accross different applications will result in multiple
         * tiles, which in the end resolve to the same application.
         * </p>
         *
         * @param {object} oInbounds
         *   Multiple site application inbounds. Keys of this object are ids of
         *   the inbounds and values are objects that describe a single
         *   inbounds.
         *
         * @private
         */
        function getUniqueInbounds(oInbounds) {
            return Object.keys(oInbounds).map(function (sKey) {
                var oInbound = oInbounds[sKey];
                return {
                    intent: oInbound.semanticObject + "-" + oInbound.action,
                    inbound: oInbound
                };
            })
            .sort(function (oInboundInfoA, oInboundInfoB) {
                if (oInboundInfoA.intent === oInboundInfoB.intent) {
                    return 0;
                }
                return oInboundInfoA.intent < oInboundInfoB.intent
                    ? -1
                    : 1;
            })
            .reduce(function (aUniqueInbounds, oInboundInfo) {
                var iUniqueInboundsLength = aUniqueInbounds.length;

                if (iUniqueInboundsLength === 0) {
                    aUniqueInbounds.push(oInboundInfo);
                    return aUniqueInbounds;
                }

                if (aUniqueInbounds[iUniqueInboundsLength - 1].intent !== oInboundInfo.intent) {
                    aUniqueInbounds.push(oInboundInfo);
                    return aUniqueInbounds;
                }

                // skip this inbound (was already present)

                return aUniqueInbounds;
            }, [] /* initially no inbounds */)
            .map(function (oInboundInfo) {
                return oInboundInfo.inbound;
            });
        }

        function getCatalogTilesFromSite(oCatalog, oSite) {
            var that = this,
                oDeferred = new jQuery.Deferred(),
                aCatalogTilePromises = [],
                oTilePromise;

            oCatalog.payload = oCatalog.payload || {};

            // find all intents which can be started, represent them as tiles.
            (oCatalog.payload.appDescriptors || []).forEach(function (oAppID) {
                var oApplication = oSite.applications[oAppID.id];
                var oInbounds = that._getMember(oApplication, "sap|app.crossNavigation.inbounds") || {};
                var aUniqueInbounds = getUniqueInbounds(oInbounds);

                var aResolvedTilePromises = aUniqueInbounds
                    .filter(function (oInbound) {
                        // Check for whether the inbound is startable or not and
                        // whether the inbound has the 'hideLauncher' flag attached
                        // or not
                        return that._isStartableInbound(oInbound)
                            && !that._isHiddenInbound(oInbound);
                    })
                    .map(function (oInbound) {
                        var sTargetUrl = that._toHashFromInbound(oInbound, oApplication);

                        if (that._mResolvedCatalogTiles[sTargetUrl] || that._mFailedResolvedCatalogTiles[sTargetUrl]) {
                            // ------------------------
                            // Tile is already resolved
                            // ------------------------

                            // Directly resolve with the result
                            if (that._mResolvedCatalogTiles.hasOwnProperty(sTargetUrl)) {
                                return new jQuery.Deferred()
                                    .resolve(that._mResolvedCatalogTiles[sTargetUrl]).promise();
                            }

                            // sTargetUrl in _mFailedResolvedCatalogTiles
                            jQuery.sap.log.error(
                                that._mFailedResolvedCatalogTiles[sTargetUrl],
                                "sap.ushell.adapters.cdm.LaunchPageAdapter"
                            );

                            return new jQuery.Deferred()
                                .reject(that._mFailedResolvedCatalogTiles[sTargetUrl]).promise();
                        }

                        // ------------------------
                        // Tile is not yet resolved
                        // ------------------------

                        if (oCatalog.contentProviderId) {
                            // catalog form extension site
                            // the intents only need to be resolved here in context of
                            // the extension site. Later (on HOME and in the AppFinder)
                            // the tiles should be startable also without the
                            // extension site. Otherwise the plugin must be loaded
                            // on start-up of the FLP, what is performance critical!
                            oTilePromise = that._getTileFromHashFromSite(oSite, sTargetUrl);
                        } else {
                            // catalog from "internal" site
                            oTilePromise = that._getTileFromHash(sTargetUrl);
                        }

                        return oTilePromise
                            .done(function (oResolvedTile) {
                                var sExternalUrl;

                                oResolvedTile.id = sTargetUrl; // may be overwritten for extension tiles

                                if (oCatalog.contentProviderId) { // it's an extension tile
                                    //
                                    // special handling for extension tiles below
                                    //
                                    oResolvedTile.contentProviderId = oCatalog.contentProviderId;

                                    sExternalUrl = that._getExternalUrlFromInbound(oInbound);
                                    if (sExternalUrl) {
                                        oResolvedTile.id = sExternalUrl; // to make the pin in appFinder work
                                        oResolvedTile.externalUrl = sExternalUrl;
                                        that._mResolvedCatalogTiles[oResolvedTile.id] = oResolvedTile;
                                    }
                                }

                                // add new tile to list of resolved tiles
                                that._mResolvedCatalogTiles[sTargetUrl] = oResolvedTile;
                            })
                            .fail(function (sErrorMessage0) {
                                jQuery.sap.log.error(sErrorMessage0,
                                    "sap.ushell.adapters.cdm.LaunchPageAdapter");

                                that._mFailedResolvedCatalogTiles[sTargetUrl] = sErrorMessage0;
                            });
                    });

                aCatalogTilePromises = aCatalogTilePromises.concat(aResolvedTilePromises);
            });  // -- forEach appDescriptor

            that._allPromisesDone(aCatalogTilePromises)
                .done(function (aCatalogTilesAndErrorMessages) {
                    var aSuccessfulCatalogTiles = aCatalogTilesAndErrorMessages.filter(function (vTileOrError) {
                        return typeof vTileOrError !== "string";
                    });
                    oDeferred.resolve(aSuccessfulCatalogTiles);
                })
                .fail(function (sErrorMessage1) {
                    if (oCatalog.identification && oCatalog.identification.id) {
                        oDeferred.reject("Failed to deliver tiles for catalog '" +
                            oCatalog.identification.id + "'. " + sErrorMessage1);
                    }
                });

            return oDeferred.promise();
        }

        /**
         * Returns the catalog's technical error message in case it could not be loaded.
         * <p>
         * <b>Beware:</b> The technical error message is not translated!
         *
         * @param {object} oCatalog
         *  Catalog
         * @returns {string}
         *  Technical error message or <code>undefined</code> if the catalog was loaded
         *  properly
         */
        this.getCatalogError = function (oCatalog) {
            if (oCatalog.error) {
                return oCatalog.error;
            }
            return;
        };

        /**
         * Returns the ID for a given catalog
         *
         * @param {object} oCatalog
         *  Catalog object
         * @returns {string}
         *  Catalog ID
         */
        this.getCatalogId = function (oCatalog) {
            return oCatalog.identification.id;
        };

        /**
         * Returns the title for a given catalog
         *
         * @param {object} oCatalog
         *  Catalog object
         * @returns {string}
         *  Catalog title
         */
        this.getCatalogTitle = function (oCatalog) {
            return oCatalog.identification.title;
        };

        this._isGroupTile = function (oTile) {
            return !!(oTile && oTile.id && oTile.target);
        };

        this._isCatalogTile = function (oTile) {
            return !!(oTile && oTile.id && oTile.tileIntent && oTile.tileResolutionResult);
        };

        this._isFailedGroupTile = function (oTile) {
            return !!(oTile && this._mFailedResolvedTiles &&
                this._mFailedResolvedTiles[oTile.id]);
        };

        this._isFailedCatalogTile = function (oTile) {
            return !!(oTile && this._mFailedResolvedCatalogTiles &&
                this._mFailedResolvedCatalogTiles[oTile.id]);
        };

        /*eslint-disable no-lonely-if*/
        /**
         * Returns the catalog tile id for a given group tile or catalog tile
         *
         * @param {object} oGroupTileOrCatalogTile
         *  Group tile or catalog tile
         *
         * @returns {string}
         *  ID of respective group tile or catalog tile.
         *  In case the id could not be determined for group tiles,
         *  <code>undefined<code> is returned.
         */
        this.getCatalogTileId = function (oGroupTileOrCatalogTile) {
            if (this._isGroupTile(oGroupTileOrCatalogTile)) {
                if (this._isFailedGroupTile(oGroupTileOrCatalogTile)) {
                    return undefined;
                }

                // for bookmarks group tiles the target url corresponds to the id of the catalog tile
                if (oGroupTileOrCatalogTile.isBookmark
                    && jQuery.sap.getObject("target.url", undefined, oGroupTileOrCatalogTile)) {

                    return oGroupTileOrCatalogTile.target.url;
                }

                // the hash of the group tile is the id of the catalog tile
                return (this._mResolvedTiles[oGroupTileOrCatalogTile.id] || {}).tileIntent;
            }

            if (this._isCatalogTile(oGroupTileOrCatalogTile)) {
                return oGroupTileOrCatalogTile.id;
            }
        };
        /*eslint-enable no-lonely-if*/

        /**
         * Returns the catalog tile title for a given tile (group or catalog tile)
         *
         * @param {object} oGroupTileOrCatalogTile
         *  Group tile or catalog tile
         * @returns {string}
         *  Title of respective group tile or catalog tile.
         *  In case the title could not be determined,
         *  <code>""<code> is returned.
         *  @throws an exception when the tile is not valid
         */
        this.getCatalogTileTitle = function (oGroupTileOrCatalogTile) {
            if (this._isGroupTile(oGroupTileOrCatalogTile)) {
                if (this._isFailedGroupTile(oGroupTileOrCatalogTile)) {
                    return "";
                }
                // the hash of the group tile is the id of the catalog tile
                return this._mResolvedTiles[oGroupTileOrCatalogTile.id].tileResolutionResult.title;
            }

            if (this._isCatalogTile(oGroupTileOrCatalogTile)) {
                if (this._isFailedCatalogTile(oGroupTileOrCatalogTile)) {
                    return undefined;
                }
                return oGroupTileOrCatalogTile.tileResolutionResult.title;
            }
        };

        /**
         * Returns the size for a given catalog tile
         *
         * @param {object} oCatalogTile
         *  Catalog tile
         * @returns {string}
         *  Size of given catalog tile
         */
        this.getCatalogTileSize = function (oCatalogTile) {
            //TODO getTileSize may not be applicable!
            return this.getTileSize(oCatalogTile);
        };

        /**
         * Returns the UI for a given catalog tile
         *
         * @param {object} oCatalogTile
         *  Catalog tile
         * @returns {object}
         *  returns a promise of a given catalog tile
         */
        this.getCatalogTileView = function (oCatalogTile) {
            return this._getCatalogTileView(oCatalogTile);
        };

        /**
         * Returns the catalog tile target url for a given tile (group or catalog tile)
         *
         * @param {object} oGroupTileOrCatalogTile
         *  Group tile or catalog tile
         * @returns {string}
         *  Target URL of respective catalog tile
         * @throws an exception when the tile is not valid
         */
        this.getCatalogTileTargetURL = function (oGroupTileOrCatalogTile) {
            if (!oGroupTileOrCatalogTile) {
                // all getCatalogTile[Preview] methods should behave equally, so fail early
                throw new Error("The given tile is falsy");
            }

            // The target is used as an id for catalog tiles
            return this.getCatalogTileId(oGroupTileOrCatalogTile);
        };

        /**
         * Returns the preview title for a given catalog tile
         *
         * @param {object} oGroupTileOrCatalogTile
         *  Group tile or catalog tile
         * @returns {string}
         *  Preview title of given catalog tile
         * @throws an exception when the tile is not valid
         */
        this.getCatalogTilePreviewTitle = function (oGroupTileOrCatalogTile) {
            if (this._isGroupTile(oGroupTileOrCatalogTile)) {
                return this.getTileTitle(oGroupTileOrCatalogTile);
            }
            return (oGroupTileOrCatalogTile.tileResolutionResult &&
                oGroupTileOrCatalogTile.tileResolutionResult.title) || "";
        };

        /**
         * Returns the preview subTitle for a given catalog tile
         *
         * @param {object} oGroupTileOrCatalogTile
         *  Group tile or catalog tile
         * @returns {string}
         *  Preview subtitle of given catalog tile
         * @throws an exception when the tile is not valid
         */
        this.getCatalogTilePreviewSubtitle = function (oGroupTileOrCatalogTile) {
            if (this._isGroupTile(oGroupTileOrCatalogTile)) {
                return this.getTileSubtitle(oGroupTileOrCatalogTile);
            }
            return (oGroupTileOrCatalogTile.tileResolutionResult &&
                oGroupTileOrCatalogTile.tileResolutionResult.subTitle) || "";
        };

        /**
         * Returns the preview icon for a given catalog tile
         *
         * @param {object} oGroupTileOrCatalogTile
         *  Group tile or catalog tile
         * @returns {string}
         *  Preview icon of given catalog tile
         * @throws an exception when the tile is not valid
         */
        this.getCatalogTilePreviewIcon = function (oGroupTileOrCatalogTile) {
            if (this._isGroupTile(oGroupTileOrCatalogTile)) {
                return this.getTileIcon(oGroupTileOrCatalogTile);
            }
            return (oGroupTileOrCatalogTile.tileResolutionResult &&
                oGroupTileOrCatalogTile.tileResolutionResult.icon) || "";
        };

        /**
         * Returns the preview Info for a given catalog tile
         *
         * @param {object} oGroupTileOrCatalogTile
         *  Group tile or catalog tile
         * @returns {string}
         *  Preview Info of given catalog tile
         * @throws an exception when the tile is not valid
         */
        this.getCatalogTilePreviewInfo = function (oGroupTileOrCatalogTile) {
            if (this._isGroupTile(oGroupTileOrCatalogTile)) {
                return this.getTileInfo(oGroupTileOrCatalogTile);
            }
            return (oGroupTileOrCatalogTile.tileResolutionResult &&
                oGroupTileOrCatalogTile.tileResolutionResult.info) || "";
        };

        /**
         * Returns the keywords for a given tile (group or catalog tile)
         *
         * @param {object} oGroupTileOrCatalogTile
         *  Group tile or catalog tile
         * @returns {array}
         *  Keywords of respective catalog tile
         */
        this.getCatalogTileKeywords = function (oGroupTileOrCatalogTile) {
            var aKeywords = [],
                oResolvedTile = oGroupTileOrCatalogTile;

            if (!oResolvedTile) {
                jQuery.sap.log.error(
                        "Could not find the Tile",
                        "sap.ushell.adapters.cdm.LaunchPageAdapter"
                    );
                return aKeywords;
            }

            if (this._mResolvedTiles && this._mResolvedTiles[oGroupTileOrCatalogTile.id]) {
                // input tile is a group tile
                oResolvedTile = this._mResolvedTiles[oGroupTileOrCatalogTile.id];
            }

            // Keywords from catalog tile
            if (oResolvedTile && oResolvedTile.tileResolutionResult &&
                    oResolvedTile.tileResolutionResult.title) {
                aKeywords.push(oResolvedTile.tileResolutionResult.title);
            }
            if (oResolvedTile && oResolvedTile.tileResolutionResult &&
                    oResolvedTile.tileResolutionResult.subTitle) {
                aKeywords.push(oResolvedTile.tileResolutionResult.subTitle);
            }

            return aKeywords;
        };

        /**
         * Counts <b>all</b> bookmarks pointing to the given URL from all of the user's groups.
         * The count is performed by visiting each matching bookmark and executing the optional
         * visitor procedure if it was provided. This method can be used to check if a bookmark
         * already exists. It will return a promise that resolves to a number greater than zero
         * if a bookmark exists.
         * <p>
         * This is a potentially asynchronous operation in case the user's groups have not yet been
         * loaded completely!
         *
         * @param {string} sUrl
         *   The URL of the bookmarks to be counted, exactly as specified to {@link #addBookmark}.
         * @param {function} [fnVisitor]
         *   For each bookmark tile that matches the given url, this function will be called with
         *   the respective tile as argument.
         *
         * @returns {object}
         *   A <code>jQuery.Deferred</code> object's promise which informs about success or failure
         *   of this asynchronous operation. In case of success, the count of existing bookmarks
         *   is provided (which might be zero). In case of failure, an error message is passed.
         *
         * @see #countBookmark
         * @see #addBookmark
         *
         * @private
         */
        this._visitBookmarks = function (sUrl, fnVisitor) {
            var oContainer = sap.ushell.Container;
            var oUrlParser = oContainer.getService("URLParsing");
            var oCDM = oContainer.getService("CommonDataModel");
            var oReferenceTarget;
            var oIntent = oUrlParser.parseShellHash(sUrl);

            if (oIntent) {
                // oUrlParser.parseShellHash was successful
                oReferenceTarget = createNewTargetFromIntent(oIntent);
            } else {
                // this is an arbitrary URL as oUrlParser.parseShellHash failed
                oReferenceTarget = createNewTargetFromUrl(sUrl);
            }

            return oCDM.getSite().then(function (oSite) {
                var oGroups = oSite.groups;

                var aTiles = Object.keys(oGroups)
                    .filter(function (sKey) {
                        // Always ignore locked groups.
                        return !oGroups[sKey].payload.locked;
                    })
                    .map(function (sKey) {
                        return oGroups[sKey].payload.tiles.filter(function (oTile) {
                            // Consider only matching bookmark tiles.
                            return oTile.isBookmark && isSameTarget(oReferenceTarget, oTile.target);
                        });
                    })
                    .reduce(function (aAllTiles, aCurrentGroupTiles) {
                        Array.prototype.push.apply(aAllTiles, aCurrentGroupTiles);
                        return aAllTiles;
                    }, []);

                if (!fnVisitor) {
                    return aTiles.length;
                }

                return jQuery.when(aTiles.map(fnVisitor)).then(function () {
                    return aTiles.length;
                });
            });
        };

        /**
         * Adds a bookmark to the user's home page.
         * Given a specific group the bookmark is added to the group,
         * otherwise it's added to the default group on the user's home page.
         *
         * @param {object} oParameters
         *   Bookmark parameters. In addition to title and URL, a bookmark might allow additional
         *   settings, such as an icon or a subtitle. Which settings are supported depends
         *   on the environment in which the application is running. Unsupported parameters will be
         *   ignored.
         *   <p>
         *   The <code>oParameters.dataSource</code> property always shadows <code>oParameters.serviceUrl</code>.
         *   So if both are provided, the former is used and the later ignored. In essence, note that
         *   <code>oParameters.serviceUrl</code> is marked for eventual deprecation.
         *
         * @param {string} oParameters.title
         *   The title of the bookmark.
         * @param {string} oParameters.url
         *   The URL of the bookmark. If the target application shall run in the Shell the URL has
         *   to be in the format <code>"#SO-Action~Context?P1=a&P2=x&/route?RPV=1"</code>
         * @param {string} [oParameters.icon]
         *   The optional icon URL of the bookmark (e.g. <code>"sap-icon://home"</code>).
         * @param {string} [oParameters.info]
         *   The optional information text of the bookmark. This is a legacy property
         *   and is not applicable in CDM context.
         * @param {string} [oParameters.subtitle]
         *   The optional subtitle of the bookmark.
         *
         * @param {object} [oParameters.dataSource]
         *   This object describes settings for reaching the service the service
         *   that provides dynamic information for the bookmark. This property,
         *   together with the <code>serviceUrlPath</code> are the accepted means
         *   for specifying the location of the dynamic data resource.
         * @param {string} [oParameters.dataSource.uri]
         *   The base URL to the REST or OData service.
         * @param {string} [oParameters.dataDource.type]
         *   The type of the service e.g. "OData".
         * @param {object} [oParameters.dataDource.Settings]
         *   In-depth details of the data source service.
         * @param {string} [oParameters.dataSource.Settings.odataVersion]
         *   The version of oData implementation the service is based on.
         * @param {string} [oParameters.dataSource.Settings.annotations]
         * @param {string} [oParameters.dataSource.Settings.localUri]
         * @param {number} [oParameters.dataSource.Settings.maxAge]
         *
         * @param {string} [oParameter.serviceUrlPath]
         *   The path to the service method/action that actually returns the dynamic
         *   information.
         * @param {string} [oParameters.serviceRefreshInterval]
         *   The refresh interval for the <code>serviceUrl</code> in seconds.
         *
         * @param {string} [oParameters.serviceUrl]
         *   The URL to a REST or OData service that provides some dynamic information
         *   for the bookmark.
         *   The <code>dataSource</code> property is the preferred interface for
         *   defining where and how the dynamic data is fetched. This property
         *   remains for legacy reasons. Going forward, you are highly discouraged
         *   from utilising this property.
         * @param {string} [oParameters.numberUnit]
         *   The unit for the number retrieved from <code>serviceUrl</code>. This
         *   is a legacy property and is not applicable in CDM context.
         *
         * @param {object} [oGroup]
         *   Reference to the group the bookmark should be added to.
         *
         * @returns {object}
         *   A <code>jQuery.Deferred</code> promise which resolves on success, but rejects
         *   (with a reason-message) on failure to add the bookmark to the specified or implied group.
         *
         * @see sap.ushell.services.URLParsing#getShellHash
         * @since 1.42.0
         * @public
         */
        this.addBookmark = function (oParameters, oGroup) {
            var oThisAdapter = this;

            return new jQuery.Deferred(function (oDeferred) {
                var oContainer = sap.ushell.Container;
                var oUrlParsing = oContainer.getService("URLParsing");
                var oCdmSiteService = oContainer.getService("CommonDataModel");

                jQuery.when(oGroup || oThisAdapter.getDefaultGroup(), oCdmSiteService.getSite())
                    .done(function (oGroup, oSite) {
                        var oTile,
                            oTarget,
                            oIntent = oUrlParsing.parseShellHash(oParameters.url),
                            oNewResolvedTile,
                            oResolveTilePromise,
                            bIsUrlBookmarkTile = false;

                        if (!oIntent) {
                            oTarget = createNewTargetFromUrl(oParameters.url);
                            bIsUrlBookmarkTile = true;
                        } else {
                            oTarget = createNewTargetFromIntent(oIntent);
                        }

                        oTile = composeNewBookmarkTile(
                            oParameters,
                            oTarget
                        );

                        if (bIsUrlBookmarkTile) {
                            oResolveTilePromise = new jQuery.Deferred();
                            oResolveTilePromise.resolve(oThisAdapter._getTileForUrl(oTile));

                        } else {
                            // resolve tile for later use (other tiles are resolved in getGroups)
                            oResolveTilePromise = oThisAdapter._getTileFromHash(oParameters.url);
                        }

                        oResolveTilePromise
                            .done(function (oNewResolvedTile) {
                                oNewResolvedTile.isLink = false; // currently only bookmark tiles can be created
                                oThisAdapter._mResolvedTiles[oTile.id] = oNewResolvedTile;

                                // add tile to the side and save
                                oSite.groups[oGroup.identification.id].payload.tiles.push(oTile);
                                oCdmSiteService.save()
                                    .done(function () {
                                        oDeferred.resolve(oTile);
                                    })
                                    .fail(function (sReason) {
                                        oDeferred.reject(sReason);
                                    });
                            })
                            .fail(function (sErrorMsg) {
                                // Note: do not add error message to oThisAdapter._mFailedResolvedTiles[oTile.id]
                                // as the tile was not created which makes the cache useless
                                oDeferred.reject("Bookmark creation failed because: " + sErrorMsg);
                            });
                    })
                    .fail(function (sReason) {
                        oDeferred.reject(sReason);
                    });
            }).promise();
        };

        /**
         * Counts <b>all</b> bookmarks pointing to the given URL from all of the user's groups. You
         * can use this method to check if a bookmark already exists.
         * <p>
         * This is a potentially asynchronous operation in case the user's groups have not yet been
         * loaded completely!
         *
         * @param {string} sUrl
         *   The URL of the bookmarks to be counted, exactly as specified to {@link #addBookmark}.
         * @returns {object}
         *   A <code>jQuery.Deferred</code> object's promise which informs about success or failure
         *   of this asynchronous operation. In case of success, the count of existing bookmarks
         *   is provided (which might be zero). In case of failure, an error message is passed.
         *
         * @see #addBookmark
         * @private
         */
        this.countBookmarks = function (sUrl) {
            return this._visitBookmarks(sUrl);
        };

        /**
         * Updates <b>all</b> bookmarks pointing to the given URL in all of the user's groups
         * with the given new parameters. Parameters which are omitted are not changed in the
         * existing bookmarks.
         *
         * @param {string} sUrl
         *   The URL of the bookmarks to be updated, exactly as specified to {@link #addBookmark}.
         *   In case you need to update the URL itself, pass the old one here and the new one as
         *   <code>oParameters.url</code>!
         * @param {object} oParameters
         *   The bookmark parameters as documented in {@link #addBookmark}.
         *   <p>
         *   If it is desired to remove the dynamic nature of the bookmark,
         *   set either <code>oParameters.dataSource</code> or <code>oParameters.serviceUrl</code> to null.
         *   <p>
         *   The <code>oParameters.dataSource</code> property always shadows <code>oParameters.serviceUrl</code>.
         *   So if both are provided, the former is used and the later ignored. Trying to update
         *   <code>oParameters.dataSource</code> with <code>oParameters.serviceUrl</code> results
         *   in a warning.
         *   <p>
         *   In essence, note that <code>oParameters.serviceUrl</code> is marked for eventual deprecation.
         *
         * @returns {object}
         *   A <code>jQuery.Deferred</code> object's promise which informs about success or failure
         *   of this asynchronous operation.  In case of success, the number of updated bookmarks
         *   is provided (which might be zero). In case of failure, an error message is passed.
         *
         * @see #addBookmark
         * @see #countBookmarks
         * @see #deleteBookmarks
         *
         * @since 1.42.0
         */
        this.updateBookmarks = function (sUrl, oParameters) {
            var oContainer = sap.ushell.Container;
            var oUrlParsing = oContainer.getService("URLParsing");
            var oCdmSiteService = oContainer.getService("CommonDataModel");

            var mResolvedTiles = this._mResolvedTiles;

            // Visitor function that updates each encountered bookmark tile as necessary.
            function updateEach(oTile) {
                return new jQuery.Deferred(function (oDeferred) {
                    var oIntent, oNewTarget;

                    var oTileComponent;
                    var bTileViewPropertiesChanged = false;
                    var oChangedTileViewProperties = {};

                    if (oParameters.url || oParameters.url === "") {
                        oIntent = oUrlParsing.parseShellHash(oParameters.url);

                        if (!oIntent) {
                            // url bookmark tile
                            oNewTarget = createNewTargetFromUrl(oParameters.url);
                        } else {
                            oNewTarget = createNewTargetFromIntent(oIntent);
                        }
                    }

                    // Check if necessary to propagate change in certain
                    // properties to the view. This check must be done before
                    // oTile is mutated with the effect that it's properties
                    // assume the updated state.
                    if (oTile.icon !== oParameters.icon) {
                        oChangedTileViewProperties.icon = oParameters.icon;
                        bTileViewPropertiesChanged = true;
                    }
                    if (oTile.title !== oParameters.title) {
                        oChangedTileViewProperties.title = oParameters.title;
                        bTileViewPropertiesChanged = true;
                    }
                    if (oTile.subTitle !== oParameters.subtitle) {
                        oChangedTileViewProperties.subtitle = oParameters.subtitle;
                        bTileViewPropertiesChanged = true;
                    }

                    if (oParameters.url && sUrl !== oParameters.url) {
                        // target URL is given and was changed, so inform the view
                        oChangedTileViewProperties.targetURL = oParameters.url;
                        bTileViewPropertiesChanged = true;
                    }
                    if (oTile.info !== oParameters.info) {
                        // target URL is given and was changed, so inform the view
                        oChangedTileViewProperties.info = oParameters.info;
                        bTileViewPropertiesChanged = true;
                    }

                    // Update tile model - mutates the given oTile reference.
                    updateTileComposition(oTile, oParameters, oNewTarget);

                    if (bTileViewPropertiesChanged && mResolvedTiles[oTile.id]) {
                        oTileComponent = mResolvedTiles[oTile.id].tileComponent;
                        oTileComponent.tileSetVisualProperties(oChangedTileViewProperties);
                    }

                    oDeferred.resolve(oTile);
                }).promise();
            }

            // When save is successful, return count of updated bookmarks,
            // otherwise the rejected promise due to the failed save operation is returned.
            return this._visitBookmarks(sUrl, updateEach)
                .then(function (iUpdatedCount) {
                    return oCdmSiteService.save().then(function () {
                        return iUpdatedCount;
                    });
                });
        };

        /**
         * Deletes <b>all</b> bookmarks pointing to the given URL from all of the user's groups.
         *
         * @param {string} sUrl
         *   The URL of the bookmarks to be deleted, exactly as specified to {@link #addBookmark}.
         *
         * @returns {object}
         *   A <code>jQuery.Deferred</code> object's promise which informs about success or failure
         *   of this asynchronous operation. In case of success, the number of deleted bookmarks
         *   is provided (which might be zero). In case of failure, an error message is passed.
         *
         * @see #addBookmark
         * @see #countBookmarks
         * @since 1.42.0
         */
        this.deleteBookmarks = function (sUrl) {
            var oContainer = sap.ushell.Container;
            var oUrlParser = oContainer.getService("URLParsing");
            var oCDM = oContainer.getService("CommonDataModel");
            var oIntent = oUrlParser.parseShellHash(sUrl);
            var oReferenceTarget;

            if (oIntent) {
                // oUrlParser.parseShellHash was successful
                oReferenceTarget = createNewTargetFromIntent(oIntent);
            } else {
                // this is an arbitrary URL as oUrlParser.parseShellHash failed
                oReferenceTarget = createNewTargetFromUrl(sUrl);
            }

            return oCDM.getSite().then(function (oSite) {
                var oGroups = oSite.groups;

                var iDeletedTiles = Object.keys(oGroups)
                    .map(function (sKey) {
                        var oPayload = oGroups[sKey].payload;
                        var iCountGroupTilesToDelete = 0;

                        oPayload.tiles = oPayload.tiles.filter(function (oTile) {
                            if (oTile.isBookmark
                                && isSameTarget(oReferenceTarget, oTile.target)) {
                                ++iCountGroupTilesToDelete;
                                return false;
                            }

                            return true;
                        });

                        return iCountGroupTilesToDelete;
                    })
                    .reduce(function (aggregateSum, groupSum) {
                        aggregateSum += groupSum;

                        return aggregateSum;
                    }, 0);

                return oCDM.save().then(function () {
                    return iDeletedTiles;
                });
            });
        };

        /**
         * This method is called to notify that the given tile has been added to some remote
         * catalog which is not specified further.
         *
         * @param {string} sTileId
         *   the ID of the tile that has been added to the catalog (as returned by that OData POST
         *   operation)
         * @private
         * @since 1.42.0
         */
        this.onCatalogTileAdded = function (sTileId) {
            // TODO implement (getCatalogs should relaod on the following call)
        };

        /**
         * Callback function which gets triggered once
         * the end user submits the tile settings dialog.
         * Updates the visual properties of the tile and
         * reflects the change to the Common Data Model site.
         * In addition it triggers saving the changes to
         * the personalization delta.
         *
         * @param {object} oTile
         *  Tile for which the settings dialog got opened
         * @param {object} oSettingsView
         *  Tile settings dialog view instance containing
         *  the input values of the dialog
         *
         * @private
         */
        this._onTileSettingsSave = function (oTile, oSettingsView) {
            var oDeferred = new jQuery.Deferred(),
                oCdmSrvc,
                oUpdatedVisualTileProperties,
                sNewTitle,
                sNewInfo,
                sNewSubtitle,
                sOldTitle,
                sOldInfo,
                sOldSubtitle;


            if (oTile && oTile.id && oSettingsView) {
                sNewTitle = oSettingsView.oTitleInput.getValue();
                sNewSubtitle = oSettingsView.oSubTitleInput.getValue();
                sNewInfo = oSettingsView.oInfoInput.getValue();
                sOldTitle = this.getTileTitle(oTile);
                sOldInfo = this.getTileInfo(oTile);
                sOldSubtitle = this.getTileSubtitle(oTile);

                // Check whether the end user changed the title or subtitle.
                // If nothing changed, return.
                if (sOldTitle === sNewTitle &&
                    sOldSubtitle === sNewSubtitle &&
                    sOldInfo === sNewInfo
                ) {
                    return;
                }

                oCdmSrvc = sap.ushell.Container.getService("CommonDataModel");
                var that = this;
                oCdmSrvc.getSite()
                    .done(function (oSite) {
                        if (!oSite.modifiedTiles) {
                            oSite.modifiedTiles = {};
                        }

                        // Check if tile is already part of the modifiedTiles collection
                        if (!oSite.modifiedTiles[oTile.id]) {
                            oSite.modifiedTiles[oTile.id] = {
                                id: oTile.id
                            };
                        }

                        oUpdatedVisualTileProperties = {};
                        if (sOldTitle !== sNewTitle) {
                            oUpdatedVisualTileProperties.title = sNewTitle;

                            // Update properties also in the modifiedTiles section of the site itself,
                            // this a mandatory hint for the personalization processor.
                            oSite.modifiedTiles[oTile.id].title = sNewTitle;
                            // Add new properties also to tile for next startup
                            oTile.title = sNewTitle;
                        }
                        if (sOldSubtitle !== sNewSubtitle) {
                            oUpdatedVisualTileProperties.subtitle = sNewSubtitle;

                            // Update properties also in the modifiedTiles section of the site itself,
                            // this a mandatory hint for the personalization processor.
                            oSite.modifiedTiles[oTile.id].subTitle = sNewSubtitle;
                            // Add new properties also to tile for next startup
                            oTile.subTitle = sNewSubtitle;
                        }
                        if (sOldInfo !== sNewInfo) {
                            oUpdatedVisualTileProperties.info = sNewInfo;

                            // Update properties also in the modifiedTiles section of the site itself,
                            // this a mandatory hint for the personalization processor.
                            oSite.modifiedTiles[oTile.id].info = sNewInfo;
                            // Add new properties also to tile for next startup
                            oTile.info = sNewInfo;
                        }
                        // Update visual tile properties for current session,
                        // otherwise the change will only be visually reflected
                        // after a page reload.
                        //
                        // This is done conditionally, because this process may
                        // not be relevant for some tile types.
                        if(that._mResolvedTiles[oTile.id].tileComponent){
                            that._mResolvedTiles[oTile.id].tileComponent.tileSetVisualProperties(oUpdatedVisualTileProperties);
                        }
                        else{
                            // Update visual link properties for current session,
                            // otherwise the change will only be visually reflected
                            // after a page reload.
                            if(that._mResolvedTiles[oTile.id].linkTileControl){
                                // update title if changed
                                if( oUpdatedVisualTileProperties.title){
                                    that._mResolvedTiles[oTile.id].linkTileControl.setHeader( oUpdatedVisualTileProperties.title);
                                }
                                // update subtitle if changed
                                if(oUpdatedVisualTileProperties.subtitle){
                                    that._mResolvedTiles[oTile.id].linkTileControl.setSubheader(oUpdatedVisualTileProperties.subtitle);
                                }
                                if(( oUpdatedVisualTileProperties.title)||(oUpdatedVisualTileProperties.subtitle)){
                                    //rerender the link to see the changes immediately
                                    that._mResolvedTiles[oTile.id].linkTileControl.rerender();
                                }
                            }
                        }

                        // Persist personalization changes
                        oCdmSrvc.save()
                            .fail(function (sErrorMsg0) {
                                jQuery.sap.log.error(sErrorMsg0);
                                oDeferred.reject("Could not save personalization changes: " + sErrorMsg0);
                            })
                            .done(function () {
                                oDeferred.resolve();
                            });
                    })
                    .fail(function (sErrorMsg) {
                        jQuery.sap.log.error(sErrorMsg);
                        oDeferred.reject("Cannot get site: " + sErrorMsg);
                    });
            }

            return oDeferred.promise();
        };

        /**
         * Returns the tile actions for a given tile.
         *
         * @param {object} oTile
         *  Tile object
         * @returns {array}
         *  Tile actions for the given tile
         *
         * @public
         */
        this.getTileActions = function (oTile) {
            var aTileActions = [],
                oTileSettingsAction,
                oModel;

            if (this._isGroupTile(oTile) && !this._isFailedGroupTile(oTile)) {
                // Create necessary model for dialog to pass actual properties
                oModel = new sap.ui.model.json.JSONModel({
                    config: {
                        display_title_text: this.getTileTitle(oTile),
                        display_subtitle_text: this.getTileSubtitle(oTile),
                        display_info_text:this.getTileInfo(oTile)
                    }
                });

                // Get tile settings action
                oTileSettingsAction = sap.ushell.components.tiles.utilsRT
                    .getTileSettingsAction(oModel, this._onTileSettingsSave.bind(this, oTile), this.getTileType(oTile));
                aTileActions.push(oTileSettingsAction);
            }
            return aTileActions;
        };

        function composeNewBookmarkTile(oParameters, oTarget) {
            var oTile = composeNewTile(oParameters, oTarget);

            oTile.isBookmark = true;

            return oTile;
        }

        function composeNewTile(oParameters, oTarget) {
            // TODO Collect all tile ids to pass them as an arry to
            // generateUniqueId
            var oTile = {
                id: sap.ushell.utils.generateUniqueId([])
            };

            updateTileComposition(oTile, oParameters, oTarget);

            return oTile;
        }

        function updateTileComposition(oTile, oParameters, oTarget) {
            // Avoid modifying callers reference.
            oParameters = jQuery.extend(true, {}, oParameters);

            if (oTarget) {
                oTile.target = oTarget;
            }

            if (oParameters.title || oParameters.title === "") {
                oTile.title = oParameters.title;
            }

            if (oParameters.icon || oParameters.icon === "") {
                oTile.icon = oParameters.icon;
            }

            if (oParameters.subtitle || oParameters.subtitle === "") {
                oTile.subTitle = oParameters.subtitle;
            }
            if (oParameters.info || oParameters.info === "") {
                oTile.info = oParameters.info;
            }

            if (oParameters.dataSource) {
                oTile.dataSource = {};
                jQuery.extend(true, oTile.dataSource, oParameters.dataSource);

                // Just in case serviceUrl is set as well, we'll ignore it.
                // Since dataSource is preferred.
                delete oParameters.serviceUrl;
            } else if (oParameters.dataSource === null) {
                delete oTile.dataSource;
                delete oTile.indicatorDataSource;

                // Changes due to the preferred dataSource trumps any potential
                // change due to the serviceUrl property.
                delete oParameters.serviceUrl;
            }

            // Consider that the serviceUrlPath has no use when no dataSource exists
            if ((oParameters.dataSource || oTile.dataSource) && oParameters.serviceUrlPath) {
                oTile.indicatorDataSource = {
                    path: oParameters.serviceUrlPath
                };
            }

            if (oParameters.serviceUrl || oParameters.serviceUrl === "") {
                if (oTile.dataSource) {
                    // Warn about planned deprecation of serviceUrl.
                    jQuery.sap.log.warning(
                        "`serviceUrl` is marked for deprecation in the future." +
                        "It is not the preferred means for defining a dynamic " +
                        "tile's data source. Please use `oParameter.dataSource`"
                    );
                    delete oTile.dataSource;
                }

                oTile.indicatorDataSource = {
                    path: oParameters.serviceUrl
                };
            } else if (oParameters.serviceUrl === null && !oTile.dataSource) {
                delete oTile.indicatorDataSource;
            }

            if (oParameters.serviceRefreshInterval
                || oParameters.serviceRefreshInterval === 0) {
                oTile.indicatorDataSource.refresh
                    = oParameters.serviceRefreshInterval;
            }
        }

        function isSameTarget(oTarget, oOther) {
            if (oTarget && oOther) {
                if (oTarget.url) {
                    // url bookmark tile
                    return oTarget.url === oOther.url;
                }

                return oTarget.semanticObject === oOther.semanticObject
                    && oTarget.action === oOther.action
                    && isSameParameters(oTarget.parameters, oOther.parameters);
            }

            return oTarget === oOther;
        }

        function isSameParameters(aParameters, aOthers) {
            var sFirst, sOther;

            aParameters = aParameters || [];
            aOthers = aOthers || [];

            if (aParameters.length === aOthers.length) {
                sFirst = transformParameterListToString(aParameters);
                sOther = transformParameterListToString(aOthers);

                return sFirst === sOther;
            }

            return false;
        }

        function transformParameterListToString(aList) {
            return aList
                .map(function (oParameter) {
                    return oParameter.name + oParameter.value;
                })
                .sort()
                .join();
        }

        function createNewTargetFromUrl(sUrl) {
            return {
                url: sUrl
            };
        }

        function createNewTargetFromIntent(oIntent) {
            var oTarget = {
                semanticObject: oIntent.semanticObject,
                action: oIntent.action,
                parameters: createTileParametersFromIntentParams(oIntent.params)
            };

            if (oIntent.appSpecificRoute) {
                // do not loose the inner-app hash (e.g. &/ShoppingCart(12345))
                // BCP 1670533333
                oTarget.appSpecificRoute = oIntent.appSpecificRoute;
            }

            return oTarget;
        }

        function createTileParametersFromIntentParams(oIntentParams) {
            return Object.keys(oIntentParams).map(function (sKey) {
                var sValue = oIntentParams[sKey] && oIntentParams[sKey][0];

                return {
                    name: sKey,
                    // sValue maybe undefined.
                    value: sValue || ""
                };
            });
        }
    };

    // TODO check if this is really needed:
    LaunchPageAdapter.prototype._getMember = function (oObject, sAccessPath) {
        return sap.ushell.utils.getMember(oObject, sAccessPath);
    };

    /* eslint-enable no-warning-comments, consistent-this */

    return LaunchPageAdapter;
}, /* bExport = */ true );
