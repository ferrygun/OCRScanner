// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The Unified Shell's page builder service.
 *
 * @version 1.52.4
 */
sap.ui.define([
], function () {
    "use strict";
    /*global jQuery, sap */

    /**
     * This method MUST be called by the Unified Shell's container only, others MUST call
     * <code>sap.ushell.Container.getService("LaunchPage")</code>.
     * Constructs a new instance of the page builder service.
     *
     * @name sap.ushell.services.LaunchPage
     *
     * @class A service for handling groups, tiles and catalogs.
     *
     * The functions that return the main objects are getGroups, getGroupTitle, getCatalogs and getCatalogTiles.
     * Since the implementation (i.e. adapter) is platform specific, do not call or access properties and functions of returned objects.
     * Instead, use other functions of the LaunchPage service with the relevant object as the input parameter.
     *
     * @param {object} oAdapter
     *     the page builder adapter for the logon system
     * @param {object} oContainerInterface
     *     the interface provided by the container
     *
     * @constructor
     * @see sap.ushell.services.Container#getService
     * @since 1.15.0
     *
     * @public
     */
    function LaunchPage (oAdapter, oContainerInterface) {
        var that = this,
            aTileActionsProviders = [];

        /**
         * Returns the groups of the user.
         * In case of success, the <code>done</code> function gets an array of 'anonymous' groups.
         * The order of the array is the order in which the groups will be displayed to the user.
         *
         * @returns {object}
         *  jQuery.promise object.
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getGroups
         */
        this.getGroups = function () {
            var oPromise = oAdapter.getGroups();
            oPromise.fail(function () {
                jQuery.sap.log.error("getGroups failed");
            });
            return oPromise;
        };

        /**
         * Returns the default group of the user.
         * In case of success, the <code>done</code> function gets an 'anonymous' object representing the default group.
         *
         * @returns {object}
         *  jQuery.promise object.
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getDefaultGroup
         */
        this.getDefaultGroup = function () {
            var oPromise  = oAdapter.getDefaultGroup();
            oPromise.fail(function () {
                jQuery.sap.log.error("getDefaultGroup failed");
            });
            return oPromise;
        };

        /**
         * Returns the title of the given group.
         *
         * @param {object} oGroup
         *     The group whose title is returned
         * @returns {string}
         *  group title
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getGroupTitle
         */
        this.getGroupTitle = function (oGroup) {
            return oAdapter.getGroupTitle(oGroup);
        };

        /**
         * Returns the unique identifier of the given group
         *
         * @param {object} oGroup
         *     The group whose id is returned
         * @returns {string}
         *  Group id
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getGroupId
         */
        this.getGroupId = function (oGroup) {
            return oAdapter.getGroupId(oGroup);
        };

        /**
         * Returns an array of 'anonymous' tiles of a group.
         * The order of the array is the order of tiles that will be displayed to the user.
         *
         * @param {object} oGroup
         *     The group whose tiles are returned
         *
         * @returns {Array}
         *  The group tiles array
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getGroupTiles
         */
        this.getGroupTiles = function (oGroup) {
            return oAdapter.getGroupTiles(oGroup);
        };

        /**
         * Returns an array of link tiles for a group.
         * The order of the array is the order in which the links will be displayed to the user.
         *
         * @param {object} oGroup
         *     The group whose link tiles are returned
         *
         * @returns {Array}
         *  The array of link tiles
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getLinkTiles
         */
        this.getLinkTiles = function (oGroup) {
            return oAdapter.getLinkTiles(oGroup);
        };



        /**
         * Adds a new group at a specific location.
         *
         * In case of success, the <code>done</code> function gets the new added group object.
         * Intention: the page builder adds this group to the specific location on the home screen.
         *
         * In case of failure, the <code>fail</code> function returns the consistent (i.e. persisted) backend state of all groups.
         *
         * @param {string} sTitle
         *     The title of the new group
         *
         * @param {integer} iIndex
         *     the location of the new group
         *
         * @returns {object}
         *  jQuery.promise object
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#addGroupAt
         */
        this.addGroupAt = function (sTitle, iIndex) {
            var oPromise, index = iIndex;

            if (oAdapter.addGroupAt) {
                oPromise = oAdapter.addGroupAt(sTitle, iIndex);
                oPromise.fail(function () {
                    jQuery.sap.log.error("addGroup " + sTitle + " failed");
                });
            } else {
                var oDeferred = new jQuery.Deferred();

                oPromise = oAdapter.addGroup(sTitle);
                oPromise.done(function (oNewGroup, sGroupId) {
                    var movePromise = this.moveGroup(oNewGroup, index),
                        newGroup = oNewGroup;
                    movePromise.done(function () {
                        oDeferred.resolve(newGroup);
                    });
                    movePromise.fail(function () {
                        oDeferred.reject();
                    });
                }.bind(this));

                oPromise.fail(function () {
                    jQuery.sap.log.error("addGroup " + sTitle + " failed");
                    oDeferred.reject();
                });

                return oDeferred.promise();
            }

            return oPromise;
        };

        /**
         * Adds a new group.
         *
         * In case of success, the <code>done</code> function gets the new added group object.
         * Intention: the page builder adds this group to the end of the home screen.
         *
         * In case of failure, the <code>fail</code> function returns the consistent (i.e. persisted) backend state of all groups.
         *
         * @param {string} sTitle
         *     The title of the new group
         *
         * @returns {object}
         *  jQuery.promise object
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#addGroup
         */
        this.addGroup = function (sTitle) {
            var oPromise = oAdapter.addGroup(sTitle);
            oPromise.fail(function () {
                jQuery.sap.log.error("addGroup " + sTitle + " failed");
            });
            return oPromise;
        };

        /**
         * Removes a group.
         *
         * In case of success, the <code>done</code> function is called without any value (i.e. input data).
         * Intention: the page builder already removed the page (or hid it from the user) and if successful - nothing needs to be done.
         *
         * In case of failure, the <code>fail</code> function returns the consistent (i.e. persisted) backend state of all groups.
         *
         * @param {object} oGroup
         *     The group to be removed
         * @param {integer} iIndex
         *     The index of the group to be removed
         *
         * @returns {object}
         *  jQuery.promise object
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#removeGroup
         */
        this.removeGroup = function (oGroup, iIndex) {
            var oPromise = oAdapter.removeGroup(oGroup, iIndex);
            oPromise.fail(function () {
                jQuery.sap.log.error("Fail to removeGroup " + that.getGroupTitle(oGroup));
            });
            return oPromise;
        };

        /**
         * Resets a group.
         *
         * The reset action is relevant for a group that was assigned to the user by an administrator.
         * The reset action means that the group is set back to the state defined by the administrator,
         * and changes made by the end user (e.g. adding tiles) are removed.
         * A group can be reset multiple times.
         *
         * In case of success, the <code>done</code> function gets the reset group object.
         *
         * In case of failure, or when the given group was created by the user (i.e. can't be reset)- <code>fail</code> handler is called,
         * returning the consistent (i.e. persisted) backend state of all groups.
         * The returned group object is the same as the one returned by @see sap.ushell.services.LaunchPage.getGroups
         *
         * @param {object} oGroup
         *     The group to be reset
         * @param {integer} iIndex
         *     The index of the group to be reset
         *
         * @returns {object}
         *  jQuery.promise object
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#resetGroup
         */
        this.resetGroup = function (oGroup, iIndex) {
            var oPromise = oAdapter.resetGroup(oGroup, iIndex);
            oPromise.fail(function () {
                jQuery.sap.log.error("Fail to resetGroup " + that.getGroupTitle(oGroup));
            });
            return oPromise;
        };

        /**
         * Checks if a group can be removed.
         *
         * Returns <code>true</code> if the group can be removed (i.e. if the given group was created by the user)
         * and <code>false</code> if the group can only be reset.
         *
         * @param {object} oGroup
         *     The group to be checked
         *
         * @returns {boolean}
         *  <code>true</code> if removable; <code>false</code> if resettable
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#isGroupRemovable
         */
        this.isGroupRemovable = function (oGroup) {
            return oAdapter.isGroupRemovable(oGroup);
        };

        /**
         * Checks if a group was marked as locked (meaning the group and its tiles will lack several capabilities such as Rename, Drag&Drop...).
         *
         * Returns <code>true</code> if the group is locked
         * and <code>false</code> if not.
         *
         * @param {object} oGroup
         *     The group to be checked
         *
         * @returns {boolean}
         *  <code>true</code> if locked; <code>false</code> if not (or as default in case the function was not implemented in the proper adapter).
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#isGroupLocked
         */
        this.isGroupLocked = function (oGroup) {
            if (typeof oAdapter.isGroupLocked === "function") {
                return oAdapter.isGroupLocked(oGroup);
            }
            return false;
        };
        /**
         * Moves a group to a new index (i.e. location).
         *
         * In case of success, the <code>done</code> function is called without any value.
         * Intention: the page builder already moved the page (visible to the user) and if successful - nothing needs to be done.
         * In case of failure, the <code>fail</code> function returns the consistent (i.e. persisted) backend state of all groups.
         *
         * @param {object} oGroup
         *     The group to be moved
         * @param {integer} iNewIndex
         *     The new index for the group
         * @returns {object}
         *  jQuery.promise object
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#moveGroup
         */
        this.moveGroup = function (oGroup, iNewIndex) {
            var oPromise = oAdapter.moveGroup(oGroup, iNewIndex);
            oPromise.fail(function () {
                jQuery.sap.log.error("Fail to moveGroup " + that.getGroupTitle(oGroup));
            });
            return oPromise;
        };

        /**
         * Sets the title of an existing group.
         *
         * In case of success, the <code>done</code> function returns nothing.
         * Intention: the page builder knows the new title, and if successful nothing needs to be done,
         *  as the title is already visible to the user.
         * In case of failure, the <code>fail</code> function returns the consistent (i.e. persisted) backend state
         *  of the group title, in most cases the old title.
         *
         * @param {string} sTitle
         *     The new title of the group
         * @param {object} oGroup
         *     The group whose title is set
         *
         * @returns {object}
         *  jQuery.promise object
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#setGroupTitle
         */
        this.setGroupTitle = function (oGroup, sTitle) {
            var oPromise = oAdapter.setGroupTitle(oGroup, sTitle);
            oPromise.fail(function () {
                jQuery.sap.log.error("Fail to set Group title: " + that.getGroupTitle(oGroup));
            });
            return oPromise;
        };

        /**
         * This function receives an array of groups IDs that were selected as hidden by the end user and stores them in the back-end for persistency.
         * Any group not in the list will become visible (again).
         *
         * @param {string[]} aHiddenGroupsIDs
         *    An Array containing the IDs of the groups that should be stored as hidden.
         * @returns {object}
         *  promise object.
         */
        this.hideGroups = function (aHiddenGroupsIDs) {
            var oDeferred = jQuery.Deferred();
            if (typeof oAdapter.hideGroups !== "function") {
                oDeferred.reject('hideGroups() is not implemented in the Adapter.');
            } else {
                oAdapter.hideGroups(aHiddenGroupsIDs).done(function () {
                    oDeferred.resolve();
                }).fail(function (sMsg) {
                        jQuery.sap.log.error("Fail to store groups visibility." + sMsg);
                        oDeferred.reject();
                    });
            }
            return oDeferred.promise();
        };

        /**
         * This function checks if a group should be visible or hidden for the specific end user.
         * An end user has the ability to configure which groups should be hidden in his dashboard (as long as edit mode is enabled).
         *
         * @param {object} oGroup
         *     A group to be checked
         * @returns {boolean} true \ false accordingly.
         */
        this.isGroupVisible = function (oGroup) {
            if (typeof oAdapter.isGroupVisible === "function") {
                return oAdapter.isGroupVisible(oGroup);
            }
            return true;
        };

        /**
         * Adds a tile to a group.
         *
         * If no group is provided then the tile is added to the default group.
         *
         * In case of success, the <code>done</code> function returns the new tile.
         * Intention: the page builder by default puts this tile at the end of the default group.
         * In case of failure, the <code>fail</code> function should return the consistent (i.e. persisted) backend state of the default group.
         *
         * @param {object} oCatalogTile
         *     An 'anonymous' tile from the tile catalog
         * @param {object} [oGroup]
         *     The target group
         *
         * @returns {object}
         *  jQuery.promise object
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#addTile
         */
        this.addTile = function (oCatalogTile, oGroup) {
            var oPromise = oAdapter.addTile(oCatalogTile, oGroup);
            oPromise.fail(function () {
                jQuery.sap.log.error("Fail to add Tile: " + that.getCatalogTileId(oCatalogTile));
            });
            return oPromise;
        };

        /**
         * Removes a tile from a group.
         *
         * In case of success, the <code>done</code> function returns the new tile.
         * Intention: the page builder has already 'hidden' (or removed) the tile.
         *
         * In case of failure, the <code>fail</code> function should return the consistent (i.e. persisted) backend state of the group.
         *
         * @param {object} oTile
         *     The tile instance to remove
         * @param {object} oGroup
         *     The group from which to remove the tile instance
         * @param {integer} iIndex
         *     The tile index
         *
         * @returns {object}
         *  jQuery.promise object
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#removeTile
         */
        this.removeTile = function (oGroup, oTile, iIndex) {
            var oPromise = oAdapter.removeTile(oGroup, oTile, iIndex);
            oPromise.fail(function () {
                jQuery.sap.log.error("Fail to remove Tile: " + that.getTileId(oTile));
            });
            return oPromise;
        };

        /**
         * Moves a tile within a group or between different groups.
         *
         * In case of success, the <code>done</code> function returns nothing.
         * Intention: the page builder already moved the tile.
         *
         * In case of failure, the <code>fail</code> function returns the consistent (i.e. persisted) backend state of the source group and the target group.
         * The result is in the following format {source:[{},{}], target:[{},{}]}.
         *
         * The source and the target groups tiles are in the form of the @see sap.ushell.services.LaunchPage.getGroupTiles
         *
         * @param {object} oTile
         *     a tile instance to be moved
         *     The same object type as the one returned by <code>sap.ushell.services.LaunchPage.getGroupTiles</code>
         * @param {integer} iSourceIndex
         *     the index in the source group
         * @param {integer} iTargetIndex
         * the target group index, in case this parameter is not supplied we assume the move tile is within the source group using iSourceIndex
         * @param {object} oSourceGroup
         *     the source group the tile came from
         * @param {object} [oTargetGroup]
         *    The same object type as the one returned by <code>sap.ushell.services.LaunchPage.getGroups</code>
         *    the target group the tile will be placed in, in case this
         *     parameter is not supplied we assume the move tile is within the source group
         * @param {string} newTileType
         *    The new type of the tile
         *
         * @returns {object}
         *  jQuery.promise object
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#moveTile
         */
        this.moveTile = function (oTile, iSourceIndex, iTargetIndex, oSourceGroup, oTargetGroup, newTileType) {
            var oPromise = oAdapter.moveTile(oTile, iSourceIndex, iTargetIndex, oSourceGroup, oTargetGroup, newTileType);
            oPromise.fail(function () {
                jQuery.sap.log.error("Fail to move Tile: " + that.getTileId(oTile)); // TODO: complete message
            });
            return oPromise;
        };

        /**
         * Returns <code>true</code> if link personalization is allowed for the tile.
         *
         * In case this tile parameter is not supplied, returns <code>true</code> if the link personalization
         * feature is allowed at least for some of the tiles.
         *
         * @param {object} oTile
         *   A tile instance.
         * @returns {boolean}
         *   Returns <code>true</code> if the tile's link personalization is allowed
         *
         * @private
         */
        this.isLinkPersonalizationSupported = function (oTile) {
            if (typeof oAdapter.isLinkPersonalizationSupported === "function") {
                return oAdapter.isLinkPersonalizationSupported(oTile);
            }
            return false;
        };

        /**
         * Returns the tile's unique identifier
         *
         * @param {object} oTile
         *     The tile
         * @returns {string}
         *     Tile id
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getTileId
         */
        this.getTileId = function (oTile) {
            return oAdapter.getTileId(oTile);
        };

        /**
         * Returns the tile's title.
         *
         * @param {object} oTile
         *     The tile
         * @returns {string}
         *     The title
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getTileTitle
         */
        this.getTileTitle = function (oTile) {
            return oAdapter.getTileTitle(oTile);
        };

        /**
         * Returns the tile's type.
         *
         * @param {object} oTile
         *     The tile
         * @returns {string}
         *     The type
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getTileType
         */
        this.getTileType = function (oTile) {
            if (oAdapter.getTileType) {
                return oAdapter.getTileType(oTile);
            }
            return 'tile';
        };

        /**
         * Returns UI5 view or control of the tile.
         * In case of success the <code>done</code> function should return UI5 view or control of the tile.
         * In case of failure the <code>fail</code> function should return nothing.
         *
         * @param {object} oTile
         *     The tile
         *
         * @returns {object}
         *  jQuery.promise object
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getTileView
         */
        this.getTileView = function (oTile) {
            var oDfd = oAdapter.getTileView(oTile);
            /**
             * API has change to return a promise object instead the tile view since 1.24 version.
             * For backwards compatibility we check if the adapter has return a promise object,
             * if not we create one resolve it with the tile view and return the promise
             */
            if (!jQuery.isFunction(oDfd.promise)){
                oDfd = jQuery.Deferred().resolve(oDfd).promise();
            }
            return oDfd;
        };


        /**
         * Returns the press handler for clicking on a tile.
         *
         * @param {object} oTile
         *     The tile
         *
         * @returns {function}
         *  handler for clicking on the tile.
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getAppBoxPressHandler
         */
        this.getAppBoxPressHandler = function (oTile) {
            if (oAdapter.getAppBoxPressHandler) {
                return oAdapter.getAppBoxPressHandler(oTile);
            }

            return undefined;
        };

        /**
         * Returns the tile size in the format of 1x1 or 1x2 string
         *
         * @param {object} oTile
         *     The tile
         *
         * @returns {string}
         *  tile size in units in 1x1 format
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getTileSize
         */
        this.getTileSize = function (oTile) {
            return oAdapter.getTileSize(oTile);
        };

        /**
         * Returns the tile's navigation target.
         *
         * The navigation target string is used (when assigned to <code>location.hash</code>) for performing a navigation action
         *  that eventually opens the application represented by the tile.
         *
         * @param {object} oTile
         *     the tile
         * @returns {string}
         *  the tile target
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getTileTarget
         */
        this.getTileTarget = function (oTile) {
            return oAdapter.getTileTarget(oTile);
        };

        /**
         * Returns the technical information about the tile which can be helpful for problem analysis.
         * <p>
         * The implementation of this method in the platform-specific adapter is optional.
         *
         * @param {object} oTile
         *     the tile
         * @returns {string}
         *     debug information for the tile
         */
        this.getTileDebugInfo = function (oTile) {
            if (typeof oAdapter.getTileDebugInfo === "function") {
                return oAdapter.getTileDebugInfo(oTile);
            }

            return undefined;
        };

        /**
         * Returns <code>true</code> if the tile's target intent is supported taking into account
         * the form factor of the current device. "Supported" means that navigation to the intent
         * is possible.
         * <p>
         * This function may be called both for group tiles and for catalog tiles.
         *
         * @param {object} oTile
         *   the group tile or catalog tile
         * @returns {boolean}
         *   <code>true</code> if the tile's target intent is supported
         * @since 1.21.0
         */
        this.isTileIntentSupported = function (oTile) {
            if (typeof oAdapter.isTileIntentSupported === "function") {
                return oAdapter.isTileIntentSupported(oTile);
            }

            return true;
        };

        /**
         * Triggers a refresh action of a tile.
         * Typically this action is related to the value presented in dynamic tiles
         *
         * @param {object} oTile
         *      The tile
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#refreshTile
         */
        this.refreshTile = function (oTile) {
            oAdapter.refreshTile(oTile);
        };

        /**
         * Sets the tile's visibility state and notifies the tile about the change.
         *
         * @param {object} oTile
         *     The tile
         * @param {boolean} bNewVisible
         *   The tile's required visibility state.
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#setTileVisible
         */
        this.setTileVisible = function (oTile, bNewVisible) {
            return oAdapter.setTileVisible(oTile, bNewVisible);
        };

        /**
         * Register an external tile actions provider callback function.
         *
         * The callback has to return an array of actions of the given tile. The callback is triggered when
         * @see sap.ushell.services.LaunchPage.getTileActions is called.
         *
         * Tile actions are additional operations that can be executed on a tile, and can be provided by
         * external providers.
         *
         * A tile action is an object with the following properties: text, icon and targetURL or a press handler.
         *
         * Tile actions should be returned immediately without any additional server access in order
         * to avoid delays in rendering the action list in the browser.
         *
         * @example of a tile actions provider callback:
         * <code>
         *     function (oTile){
         *          return [
         *                  {
         *                      text: "Some Action",
         *                      icon: "sap-icon://action",
         *                      targetURL: "#SemanticObject-Action"
         *                  },
         *                  {
         *                      text: "Settings",
         *                      icon: "sap-icon://action-settings",
         *                      press: function (){
         *                          //Open settings UI
         *                      }
         *                  }
         *              ];
         *       }
         * </code>.
         *
         *
         * Use <code>Function.prototype.bind()</code> to determine the callback's <code>this</code> or
         * some of its arguments.
         *
         * @param {Object} fnProvider
         *  A callback which returns an array of action objects.
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#registerTileActionsProvider
         */
        this.registerTileActionsProvider = function (fnProvider){
            if (typeof fnProvider !== 'function') {
                throw new Error("Tile actions Provider is not a function");
            }
            aTileActionsProviders.push(fnProvider);
        };

        /**
         * Returns internal and external tile actions.
         * Tile actions can be provided by external providers registered using
         * @see sap.ushell.services.LaunchPage.registerTileActionsProvider,
         * @alias sap.ushell.services.LaunchPage#getTileActions
         * and by internal provider that can provide tile actions
         * from the underlying implementation (i.e. adapter)
         *
         * @param oTile
         *      the tile
         * @returns {Array}
         *      tile actions
         */
        this.getTileActions = function (oTile){
            var aTileActions = [];
            var aActions;

            if (typeof oAdapter.getTileActions === 'function'){
                aActions = oAdapter.getTileActions(oTile);
                if (aActions && aActions.length && aActions.length > 0){
                    aTileActions.push.apply(aTileActions, aActions);
                }
            }

            for (var i = 0; i < aTileActionsProviders.length; i++){
                aActions = aTileActionsProviders[i](oTile);
                if (aActions && aActions.length && aActions.length > 0){
                    aTileActions.push.apply(aTileActions, aActions);
                }
            }

            return aTileActions;
        };

        /**
         * Returns the catalogs of the user.
         *
         * <p>
         * Only severe failures make the overall operation fail. If loading of a remote catalog fails,
         * this is handled gracefully by providing a "dummy" empty catalog (with ID instead of title).
         * Use {@link getCatalogError} to check if a (remote) catalog could not be loaded from the backend.
         * <p>
         * Progress notifications are sent for each single catalog, i.e. attaching a <code>progress</code> handler gives you the same
         * possibilities as attaching a <code>done</code> handler, but with the advantage of
         * improved responsiveness.
         *
         * @example
         *   sap.ushell.Container.getService("LaunchPage").getCatalogs()
         *   .fail(function (sErrorMessage) { // string
         *     // handle error situation
         *   })
         *   .progress(function (oCatalog) { // object
         *     // do s.th. with single catalog
         *   })
         *   .done(function (aCatalogs) { // object[]
         *     aCatalogs.forEach(function (oCatalog) {
         *       // do s.th. with single catalog
         *     });
         *   });
         *
         * @returns {object}
         *  <code>jQuery.Deferred</code> object's promise
         *   In case of success, an array of black-box catalog objects is provided (which might be empty).
         *   In case of failure, an error message is passed.
         *   Progress notifications are sent for each single catalog, providing a single black-box catalog object each time.
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getCatalogs
         */
        this.getCatalogs = function () {
            return oAdapter.getCatalogs();
        };

        /**
         * Returns whether the catalogs collection previously returned by <code>getCatalogs()</code> is still valid.
         *
         * Initially the result is <code>false</code> until <code>getCatalogs()</code> has been called.
         * Later, the result might be <code>false</code> again in case one of the catalogs has been invalidated,
         * e.g. due to adding a tile to a catalog ("Add to catalog" scenario).
         *
         * @returns {boolean} <code>true</code> in case the catalogs are still valid; <code>false</code> if not
         *
         * @since 1.16.4
         * @see #getCatalogs
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#isCatalogsValid
         */
        this.isCatalogsValid = function () {
            return oAdapter.isCatalogsValid();
        };

        /**
         * Returns catalog's technical data.
         *
         * @param {object} oCatalog
         *     the catalog
         *
         * @returns {object}
         *     An object that includes the following properties (the list may include additional properties):
         *     <ul>
         *     <li><code>id</code>: the catalog ID
         *     <li><code>systemId</code>: [remote catalogs] the ID of the remote system
         *     <li><code>remoteId</code>: [remote catalogs] the ID of the catalog in the
         *       remote system
         *     <li><code>baseUrl</code>: [remote catalogs] the base URL of the catalog in the
         *       remote system
         *     </ul>
         *
         * @since 1.21.2
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getCatalogData
         */
        this.getCatalogData = function (oCatalog) {
            if (typeof oAdapter.getCatalogData !== "function") {
                jQuery.sap.log.warning("getCatalogData not implemented in adapter", null,
                    "sap.ushell.services.LaunchPage");
                return {
                    id: this.getCatalogId(oCatalog)
                };
            }
            return oAdapter.getCatalogData(oCatalog);
        };

        /**
         * Returns the catalog's technical error message in case it could not be loaded from the
         * backend.
         * <p>
         * <b>Beware:</b> The technical error message is not translated!
         *
         * @param {object} oCatalog
         *     the catalog
         * @returns {string}
         *     The technical error message or <code>undefined</code> if the catalog was loaded
         *     properly
         * @since 1.17.1
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getCatalogError
         */
        this.getCatalogError = function (oCatalog) {
            return oAdapter.getCatalogError(oCatalog);
        };

        /**
         * Returns the catalog's unique identifier
         *
         * @param {object} oCatalog
         *     The catalog
         *
         * @returns {string}
         *  Catalog id
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getCatalogId
         */
        this.getCatalogId = function (oCatalog) {
            return oAdapter.getCatalogId(oCatalog);
        };

        /**
         * Returns the catalog's title
         *
         * @param {object} oCatalog
         *     The catalog
         *
         * @returns {string}
         *  Catalog title
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getCatalogTitle
         */
        this.getCatalogTitle = function (oCatalog) {
            return oAdapter.getCatalogTitle(oCatalog);
        };

        /**
         * Returns the tiles of a catalog.
         * In case of success, the <code>done</code> function of the returned promise object gets an array of 'anonymous' tiles of the catalog.
         *
         * @param {object} oCatalog
         *     The catalog
         *
         * @returns {object}
         *  jQuery.promise object.
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getCatalogTiles
         */
        this.getCatalogTiles = function (oCatalog) {
            var oPromise = oAdapter.getCatalogTiles(oCatalog);
            oPromise.fail(function () {
                jQuery.sap.log.error("Fail to get Tiles of Catalog: " + that.getCatalogTitle(oCatalog));
            });
            return oPromise;
        };

        /**
         * Returns catalog tile's unique identifier.
         * This function may be called for a catalog tile or (since 1.21.0) for a group tile.
         * In the latter case, the function returns the unique identifier of the catalog tile on which the group tile is based.
         *
         * @param {object} oTile
         *     The tile or the catalog tile
         *
         * @returns {string}
         *  Tile id
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getCatalogTileId
         */
        this.getCatalogTileId = function (oTile) {
            return oAdapter.getCatalogTileId(oTile);
        };

        /**
         * Returns the catalog tile's title
         *
         * @param {object} oCatalogTile
         *     The catalog tile
         *
         * @returns {string}
         *  Tile title
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getCatalogTileTitle
         */
        this.getCatalogTileTitle = function (oCatalogTile) {
            return oAdapter.getCatalogTileTitle(oCatalogTile);
        };

        /**
         * Returns the size of a catalog tile as a string. For example: "1x1", "1x2"
         *
         * @param {object} oCatalogTile
         *     The catalog tile
         *
         * @returns {string}
         *  Tile size in units in 1x1 or 1x2 format
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getCatalogTileSize
         */
        this.getCatalogTileSize = function (oCatalogTile) {
            return oAdapter.getCatalogTileSize(oCatalogTile);
        };

        /**
         * Returns the UI5 view or control  of a catalog tile
         *
         * @param {object} oCatalogTile
         *     The catalog tile
         *
         * @returns {object}
         *  jQuery.deferred.promise object that when resolved, returns the Catalog Tile View
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getCatalogTileViewControl
         */
        this.getCatalogTileViewControl = function (oCatalogTile) {
            if (typeof oAdapter.getCatalogTileViewControl === "function") {
               return oAdapter.getCatalogTileViewControl(oCatalogTile);
            } else {
               var oDeferred = new jQuery.Deferred(),
                   oResult = this.getCatalogTileView(oCatalogTile);

               oDeferred.resolve(oResult);
               return oDeferred.promise();
            }
        };

        /**
         * Returns the UI5 view or control  of a catalog tile
         *
         * @param {object} oCatalogTile
         *     The catalog tile
         *
         * @returns {object}
         *  UI5 view or control
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getCatalogTileView
         *
         * @deprecated since version 1.48 (as a result of XMLHttpRequest spec prohibiting the sending of synchronous requests). 
         * Use <code>getCatalogTileViewControl</code> instead
         */
        this.getCatalogTileView = function (oCatalogTile) {
            return oAdapter.getCatalogTileView(oCatalogTile);
        };

        /**
         * Returns the navigation target URL of a catalog tile.
         * If the catalog tile does not exist, this function implicitly instantiates it using {@link #getCatalogTileView(oCatalogTile)}.
         *
         * @param {object} oCatalogTile
         *     The catalog tile
         *
         * @returns {string}
         *     The target URL for the catalog tile's underlying application as provided via the
         *     "preview" contract
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getCatalogTileTargetURL
         */
        this.getCatalogTileTargetURL = function (oCatalogTile) {
            return oAdapter.getCatalogTileTargetURL(oCatalogTile);
        };

        /**
         * Returns the tags associated with a catalog tile which can be used to find the
         * catalog tile in a tag filter.
         *
         * @param {object} oCatalogTile
         *      The catalog tile
         *
         * @returns string[]
         *      The tags associated with this catalog tile
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getCatalogTileTags
         */
        this.getCatalogTileTags = function (oCatalogTile) {
            if (typeof oAdapter.getCatalogTileTags === "function") {
                return oAdapter.getCatalogTileTags(oCatalogTile);
            }

            return [];
        };

        /**
         * Returns the keywords associated with a catalog tile which can be used to find the
         * catalog tile in a search.
         * Note: getCatalogTileView <b>must</b> be called <b>before</b> this method. Otherwise the
         * keywords may be incomplete.
         *
         * @param {object} oCatalogTile
         *      The catalog tile
         *
         * @returns string[]
         *      The keywords associated with this catalog tile
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getCatalogTileKeywords
         */
        this.getCatalogTileKeywords = function (oCatalogTile) {
            return oAdapter.getCatalogTileKeywords(oCatalogTile);
        };

        /**
         * Returns preview title for a catalog tile.
         *
         * @param {object} oCatalogTile
         *     The catalog tile
         *
         * @returns {string}
         *     Preview title for the catalog tile's underlying application as provided via the
         *     "preview" contract
         *
         * @since 1.16.3
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getCatalogTilePreviewTitle
         */
        this.getCatalogTilePreviewTitle = function (oCatalogTile) {
            return oAdapter.getCatalogTilePreviewTitle(oCatalogTile);
        };

        /**
         * Returns preview subtitle for a catalog tile.
         *
         * @param {object} oCatalogTile
         *     The catalog tile
         *
         * @returns {string}
         *     Preview subtitle for the catalog tile's underlying application as provided via the
         *     "preview" contract
         *
         * @since 1.40
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getCatalogTilePreviewSubtitle
         */
        this.getCatalogTilePreviewSubtitle = function (oCatalogTile) {
            if (oAdapter.getCatalogTilePreviewSubtitle) {
                return oAdapter.getCatalogTilePreviewSubtitle(oCatalogTile);
            }
        };

        /**
         * Returns preview icon for a catalog tile.
         *
         * @param {object} oCatalogTile
         *     The catalog tile
         *
         * @returns {string}
         *     Preview icon as URL/URI for the catalog tile's underlying application as provided via the "preview" contract
         *
         * @since 1.16.3
         *
         * @public
         * @alias sap.ushell.services.LaunchPage#getCatalogTilePreviewIcon
         */
        this.getCatalogTilePreviewIcon = function (oCatalogTile) {
            return oAdapter.getCatalogTilePreviewIcon(oCatalogTile);
        };

        /**
         * Adds a bookmark tile to one of the user's home page groups.
         *
         * @param {object} oParameters
         *   bookmark parameters. In addition to title and URL, a bookmark might allow additional
         *   settings, such as an icon or a subtitle. Which settings are supported depends
         *   on the environment in which the application is running. Unsupported parameters will be
         *   ignored.
         * @param {string} oParameters.title
         *   The title of the bookmark.
         * @param {string} oParameters.url
         *   The URL of the bookmark. If the target application shall run in the Shell the URL has
         *   to be in the format <code>"#SO-Action~Context?P1=a&P2=x&/route?RPV=1"</code>
         * @param {string} [oParameters.icon]
         *   The icon URL of the bookmark (e.g. <code>"sap-icon://home"</code>).
         * @param {string} [oParameters.info]
         *   The information text of the bookmark.
         * @param {string} [oParameters.subtitle]
         *   The subtitle of the bookmark.
         * @param {string} [oParameters.serviceUrl]
         *   The URL to a REST or OData service that provides some dynamic information for the
         *   bookmark.
         * @param {string} [oParameters.serviceRefreshInterval]
         *   The refresh interval for the <code>serviceUrl</code> in seconds.
         * @param {string} [oParameters.numberUnit]
         *   The unit for the number retrieved from <code>serviceUrl</code>.
         * @param {object} [oGroup]
         *   Optional reference to the group the bookmark tile should be added to.
         *   If not given, the default group is used.
         * @returns {object}
         *   a jQuery promise.
         *
         * @see sap.ushell.services.URLParsing#getShellHash
         * @alias sap.ushell.services.LaunchPage#addBookmark
         * @since 1.15.0
         */
        this.addBookmark = function (oParameters, oGroup) {
            var oPromise,
                oDfd,
                sMessage;
            if (!oParameters.title) {
                jQuery.sap.log.error("Add Bookmark - Missing title");
                throw new Error("Title missing in bookmark configuration");
            }
            if (!oParameters.url) {
                jQuery.sap.log.error("Add Bookmark - Missing URL");
                throw new Error("URL missing in bookmark configuration");
            }
            if (oGroup && this.isGroupLocked(oGroup)) {
                oDfd = new jQuery.Deferred();
                oPromise = oDfd.promise();
                sMessage = 'Tile cannot be added, target group (' + this.getGroupTitle(oGroup) + ')is locked!';
                oDfd.reject(sMessage);
                jQuery.sap.log.error(sMessage);
            }else {
                oPromise = oAdapter.addBookmark(oParameters, oGroup);
                oPromise.fail(function () {
                    jQuery.sap.log.error("Fail to add bookmark for URL: " + oParameters.url + " and Title: " + oParameters.title);
                });
            }

            return oPromise;
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
         * @private
         */
        this.countBookmarks = function (sUrl) {
            if (!sUrl || typeof sUrl !== "string") {
                jQuery.sap.log.error("Fail to count bookmarks. No valid URL");
                throw new Error("Missing URL");
            }

            var oPromise = oAdapter.countBookmarks(sUrl);
            oPromise.fail(function () {
                jQuery.sap.log.error("Fail to count bookmarks");
            });
            return oPromise;
        };

        /**
         * Deletes <b>all</b> bookmarks pointing to the given URL from all of the user's pages.
         *
         * @param {string} sUrl
         *   The URL of the bookmarks to be deleted, exactly as specified to {@link #addBookmark}.
         * @returns {object}
         *   A <code>jQuery.Deferred</code> object's promise which informs about success or failure
         *   of this asynchronous operation. In case of success, the number of deleted bookmarks
         *   is provided (which might be zero). In case of failure, an error message is passed.
         *
         * @see #addBookmark
         * @see #countBookmarks
         * @private
         */
        this.deleteBookmarks = function (sUrl) {
            if (!sUrl || typeof sUrl !== "string") {
                throw new Error("Missing URL");
            }

            var oPromise = oAdapter.deleteBookmarks(sUrl);
            oPromise.fail(function () {
                jQuery.sap.log.error("Fail to delete bookmark for: " + sUrl);
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
         *   A <code>jQuery.Deferred</code> object's promise which informs about success or failure
         *   of this asynchronous operation.  In case of success, the number of updated bookmarks
         *   is provided (which might be zero). In case of failure, an error message is passed.
         *
         * @see #addBookmark
         * @see #countBookmarks
         * @see #deleteBookmarks
         * @private
         */
        this.updateBookmarks = function (sUrl, oParameters) {
            if (!sUrl || typeof sUrl !== "string") {
                jQuery.sap.log.error("Fail to update bookmark. No valid URL");
                throw new Error("Missing URL");
            }
            if (!oParameters || typeof oParameters !== "object") {
                jQuery.sap.log.error("Fail to update bookmark. No valid parameters, URL is: " + sUrl);
                throw new Error("Missing parameters");
            }

            var oPromise = oAdapter.updateBookmarks(sUrl, oParameters);
            oPromise.fail(function () {
                jQuery.sap.log.error("Fail to update bookmark for: " + sUrl);
            });
            return oPromise;
        };

        /**
         * This method is called to notify that the given tile has been added to some remote
         * catalog which is not specified further.
         *
         * @param {string} sTileId
         *   the ID of the tile that has been added to the catalog (as returned by that OData POST
         *   operation)
         * @private
         * @since 1.16.4
         */
        this.onCatalogTileAdded = function (sTileId) {
            return oAdapter.onCatalogTileAdded(sTileId);
        };
    };

    LaunchPage.hasNoAdapter = false;
    return LaunchPage;

}, true /* bExport */);
