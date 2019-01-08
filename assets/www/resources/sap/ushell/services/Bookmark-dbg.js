// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The Unified Shell's bookmark service, which allows you to create shortcuts on the
 * user's home page.
 *
 * @version 1.52.4
 */
sap.ui.define([
], function () {
    "use strict";
    /*global jQuery, sap */

    /**
     * This method MUST be called by the Unified Shell's container only, others MUST call
     * <code>sap.ushell.Container.getService("Bookmark")</code>.
     * Constructs a new instance of the bookmark service.
     *
     * @name sap.ushell.services.Bookmark
     *
     * @class The unified shell's bookmark service, which allows you to create shortcuts on the
     * user's home page.
     *
     * @constructor
     * @see sap.ushell.services.Container#getService
     * @since 1.15.0
     * @public
     */
    function Bookmark () {
        var oLaunchPageService = sap.ushell.Container.getService("LaunchPage");

        /**
         * Returns <code>true</code> if the given catalog data matches a remote catalog. This
         * requires that the LaunchPageAdapter supports getCatalogData().
         * @param {object} oCatalog
         *   a catalog as given from LaunchPage service
         * @param {object} oRemoteCatalogData
         *   the description of the catalog from a remote system
         * @param {string} oRemoteCatalogData.remoteId
         *   the catalog ID in the remote system
         * @param {string} oRemoteCatalogData.baseUrl
         *   the base URL of the catalog in the remote system
         */
        this._isMatchingRemoteCatalog = function (oCatalog, oRemoteCatalogData) {
            var oCatalogData = oLaunchPageService.getCatalogData(oCatalog);
            // systemAlias is not considered yet, which might lead to multiple matches
            return oCatalogData.remoteId === oRemoteCatalogData.remoteId
                && oCatalogData.baseUrl.replace(/\/$/, "")
                    === oRemoteCatalogData.baseUrl.replace(/\/$/, ""); // ignore trailing slashes
        };

        /**
         * Adds a bookmark tile to one of the user's home page groups.
         *
         * @param {object} oParameters
         *   bookmark parameters. In addition to title and URL, a bookmark might allow additional
         *   settings, such as an icon or a subtitle. Which settings are supported depends
         *   on the environment in which the application is running. Unsupported parameters will be
         *   ignored.
         *
         * @param {string} oParameters.title
         *   The title of the bookmark.
         * @param {string} oParameters.url
         *   The URL of the bookmark. If the target application shall run in the Shell the URL has
         *   to be in the format <code>"#SO-Action~Context?P1=a&P2=x&/route?RPV=1"</code>.
         * @param {string} [oParameters.icon]
         *   The optional icon URL of the bookmark (e.g. <code>"sap-icon://home"</code>).
         * @param {string} [oParameters.info]
         *   The optional information text of the bookmark. This property is not relevant in the CDM
         *   context.
         * @param {string} [oParameters.subtitle]
         *   The optional subtitle of the bookmark.
         * @param {string} [oParameters.serviceUrl]
         *   The URL to a REST or OData service that provides some dynamic information for the
         *   bookmark.
         * @param {string} [oParameters.serviceRefreshInterval]
         *   The refresh interval for the <code>serviceUrl</code> in seconds.
         * @param {string} [oParameters.numberUnit]
         *   The unit for the number retrieved from <code>serviceUrl</code>.
         *   This property is not relevant in the CDM context.
         * @param {object} [oGroup]
         *   Optional reference to the group the bookmark tile should be added to.
         *   If not given, the default group is used.
         *
         * @returns {object}
         *   A <code>jQuery.Deferred</code> promise which resolves on success, but rejects
         *   (with a reason-message) on failure to add the bookmark to the specified or implied group.
         *
         * @see sap.ushell.services.URLParsing#getShellHash
         * @since 1.15.0
         * @public
         * @alias sap.ushell.services.Bookmark#addBookmark
         */
        this.addBookmark = function (oParameters, oGroup) {
            var oPromise = oLaunchPageService.addBookmark(oParameters, oGroup);
            oPromise.done(function (oTile) {
                var oData = {
                    tile: oTile,
                    group: oGroup
                };
                sap.ui.getCore().getEventBus().publish("sap.ushell.services.Bookmark", "bookmarkTileAdded", oData);
            });
            return oPromise;
        };

        /**
         * Adds the tile with the given id <code>sCatalogTileId</code> from the catalog with id
         * <code>sCatalogId</code> to the given group.
         * @param {jQuery.Deferred} oDeferred
         *   a deferred object to be resolved/rejected when finished. In case of success, no
         *   further details are passed. In case of failure, an error message is passed.
         * @param {string} sCatalogTileId
         *   the ID of the tile within the catalog
         * @param {object} oCatalog
         *   the catalog containing the catalog tile
         * @param {string} [sGroupId]
         *   The id of the group. If not given, the tile is added to the default group
         * @returns {object}
         *   <code>oDeferred</code>
         */
        this._doAddCatalogTileToGroup = function (oDeferred, sCatalogTileId, oCatalog, sGroupId) {
            var sError,
                fnFailure = oDeferred.reject.bind(oDeferred);

            function isSameCatalogTile(sCatalogTileId, oCatalogTile) {
                var sIdWithPotentialSuffix = oLaunchPageService.getCatalogTileId(oCatalogTile);

                if (sIdWithPotentialSuffix === undefined) {
                    // prevent to call undefined.indexOf.
                    // assumption is that undefined is not a valid ID, so it is not the same tile. Thus false is returned.
                    return false;
                }
                // getCatalogTileId appends the system alias of the catalog if present.
                // This must be considered when comparing the IDs.
                // see BCP 0020751295 0000142292 2017
                return sIdWithPotentialSuffix.indexOf(sCatalogTileId) === 0;
            }

            function addToGroup(oGroup) {
                oLaunchPageService.getCatalogTiles(oCatalog)
                    .fail(fnFailure)
                    .done(function (aCatalogTiles) {
                        var sGroupId = oLaunchPageService.getGroupId(oGroup),
                            bTileFound = aCatalogTiles.some(function (oCatalogTile) {
                                if (isSameCatalogTile(sCatalogTileId, oCatalogTile)) {
                                    oLaunchPageService.addTile(oCatalogTile, oGroup)
                                        .fail(fnFailure)
                                        .done(function () { // ignore argument oTile!
                                            oDeferred.resolve();
                                            sap.ui.getCore().getEventBus().publish("sap.ushell.services.Bookmark", "catalogTileAdded", sGroupId);
                                        });
                                    return true;
                                }
                        });
                        if (!bTileFound) {
                            sError = "No tile '" + sCatalogTileId + "' in catalog '"
                                + oLaunchPageService.getCatalogId(oCatalog) + "'";
                            jQuery.sap.log.error(sError, null, "sap.ushell.services.Bookmark");
                            fnFailure(sError);
                        }
                    });
            }

            if (sGroupId) {
                oLaunchPageService.getGroups()
                    .fail(fnFailure)
                    .done(function (aGroups) {
                        var bGroupFound = aGroups.some(function (oGroup) {
                            if (oLaunchPageService.getGroupId(oGroup) === sGroupId) {
                                addToGroup(oGroup);
                                return true;
                            }
                        });
                        if (!bGroupFound) {
                            // TODO: Consider adding the tile to the default group. This would
                            // enable the user to add tiles if no valid group ID is available.
                            // Take into account how the consumer app requests the group ids.
                            sError = "Group '" + sGroupId + "' is unknown";
                            jQuery.sap.log.error(sError, null, "sap.ushell.services.Bookmark");
                            fnFailure(sError);
                        }
                    });
            } else {
                oLaunchPageService.getDefaultGroup()
                    .fail(fnFailure)
                    .done(addToGroup);
            }
            return oDeferred.promise();
        };

        /**
         * Adds the catalog tile with the given ID to given group. The catalog tile is looked up in
         * the legacy SAP HANA catalog unless data to look up a remote catalog is provided.
         *
         * @param {string} sCatalogTileId
         *   The ID of the tile within the catalog
         * @param {string} [sGroupId]
         *   The id of the group. If not given, the tile is added to the default group
         * @param {object} [oCatalogData]
         *   The data to identify the catalog containing the tile with the given ID
         * @param {string} oCatalogData.baseUrl
         *   The remote catalog's base URL such as
         *   "/sap/hba/apps/kpi/s/odata/hana_chip_catalog.xsodata/"
         * @param {string} oCatalogData.remoteId
         *   The remote catalog's id on the remote system such as "HANA_CATALOG"
         * @returns {object}
         *   A <code>jQuery.Deferred</code> object's promise which informs about success or failure
         *   of this asynchronous operation. In case of success, no further details are passed.
         *   In case of failure, an error message is passed.
         *
         * @since 1.21.2
         * @public
         * @alias sap.ushell.services.Bookmark#addCatalogTileToGroup
         */
        this.addCatalogTileToGroup = function (sCatalogTileId, sGroupId, oCatalogData) {
            var oDeferred = new jQuery.Deferred(),
                sError,
                fnFailure = oDeferred.reject.bind(oDeferred),
                fnMatcher,
                sLegacyHanaCatalogId = "X-SAP-UI2-HANA:hana?remoteId=HANA_CATALOG",
                that = this;

            function isLegacyHanaCatalog(oCatalog) {
                // this is ABAP specific but should not harm other platforms
                return oLaunchPageService.getCatalogId(oCatalog) === sLegacyHanaCatalogId;
            }

            fnMatcher = oCatalogData ? this._isMatchingRemoteCatalog : isLegacyHanaCatalog;
            oCatalogData = oCatalogData || {id: sLegacyHanaCatalogId};
            // TODO first determine the catalog, then call onCatalogTileAdded incl. its ID
            oLaunchPageService.onCatalogTileAdded(sCatalogTileId);
            oLaunchPageService.getCatalogs()
                .fail(fnFailure)
                .done(function (aCatalogs) {
                    var oSourceCatalog;
                    aCatalogs.forEach(function (oCatalog) {
                        if (fnMatcher(oCatalog, oCatalogData)) {
                            if (!oSourceCatalog) {
                                oSourceCatalog = oCatalog;
                            } else {
                                // Note: We use the first match. If more than one catalog matches
                                // this might be the wrong one, resulting in a "missing tile"
                                // error. However we log the multiple catalog match before.
                                jQuery.sap.log.warning("More than one matching catalog: "
                                    + JSON.stringify(oCatalogData), null,
                                    "sap.ushell.services.Bookmark");
                            }
                        }
                    });
                    if (oSourceCatalog) {
                        that._doAddCatalogTileToGroup(oDeferred, sCatalogTileId, oSourceCatalog,
                            sGroupId);
                    } else {
                        sError = "No matching catalog found: " + JSON.stringify(oCatalogData);
                        jQuery.sap.log.error(sError, null, "sap.ushell.services.Bookmark");
                        oDeferred.reject(sError);
                    }
                });
            return oDeferred.promise();
        };

        /**
         * Counts <b>all</b> bookmarks pointing to the given URL from all of the user's pages. You
         * can use this method to check if a bookmark already exists.
         * <p>
         * This is a potentially asynchronous operation in case the user's pages have not yet been
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
         * @since 1.17.1
         * @public
         * @alias sap.ushell.services.Bookmark#countBookmarks
         */
        this.countBookmarks = function (sUrl) {
            return oLaunchPageService.countBookmarks(sUrl);
        };

        /**
         * Deletes <b>all</b> bookmarks pointing to the given URL from all of the user's pages.
         *
         * @param {string} sUrl
         *   The URL of the bookmarks to be deleted, exactly as specified to {@link #addBookmark}.
         * @returns {object}
         *   A <code>jQuery.Deferred</code> object's promise which informs about success or
         *   failure of this asynchronous operation. In case of success, the number of deleted
         *   bookmarks is provided (which might be zero). In case of failure, an error message is
         *   passed.
         *
         * @see #addBookmark
         * @see #countBookmarks
         * @since 1.17.1
         * @public
         * @alias sap.ushell.services.Bookmark#deleteBookmarks
         */
        this.deleteBookmarks = function (sUrl) {
            var oPromise = oLaunchPageService.deleteBookmarks(sUrl);

            oPromise.done(function () {
                sap.ui.getCore().getEventBus().publish("sap.ushell.services.Bookmark", "bookmarkTileDeleted", sUrl);
            });
            return oPromise;
        };

        /**
         * Updates <b>all</b> bookmarks pointing to the given URL on all of the user's pages
         * with the given new parameters. Parameters which are omitted are not changed in the
         * existing bookmarks.
         *
         * @param {string} sUrl
         *   The URL of the bookmarks to be updated, exactly as specified to {@link #addBookmark}.
         *   In case you need to update the URL itself, pass the old one here and the new one as
         *   <code>oParameters.url</code>!
         * @param {object} oParameters
         *   The bookmark parameters as documented in {@link #addBookmark}.
         * @returns {object}
         *   A <code>jQuery.Deferred</code> object's promise which informs about success or
         *   failure of this asynchronous operation.  In case of success, the number of updated
         *   bookmarks is provided (which might be zero). In case of failure, an error message is
         *   passed.
         *
         * @see #addBookmark
         * @see #countBookmarks
         * @see #deleteBookmarks
         * @since 1.17.1
         * @public
         * @alias sap.ushell.services.Bookmark#updateBookmarks
         */
        this.updateBookmarks = function (sUrl, oParameters) {
            return oLaunchPageService.updateBookmarks(sUrl, oParameters);
        };
    };

    Bookmark.hasNoAdapter = true;
    return Bookmark;

}, true /* bExport */);
