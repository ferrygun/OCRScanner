// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(['sap/ushell/services/Message', 'sap/ui/base/EventProvider', 'sap/ushell/ui/launchpad/TileState', "sap/ushell/components/flp/launchpad/PagingManager", "sap/ushell/components/flp/launchpad/DashboardLoadingManager"],
	function(Message, EventProvider, TileState, PagingManager, DashboardLoadingManager) {
	"use strict";

    /*global jQuery, sap, document, $, setTimeout, window */
    /*jslint plusplus: true, nomen: true, bitwise: true */

    /**
     * Return translated text. Private function in this module.
     * @param sMsgId
     *      Id of the text that is to be translated.
     * @param aParams
     *      Array of parameters to be included in the resulted string instead of place holders.
     */
    var getLocalizedText = function (sMsgId, aParams) {
            return aParams ? sap.ushell.resources.i18n.getText(sMsgId, aParams) : sap.ushell.resources.i18n.getText(sMsgId);
        };

        /**
         * This function returns the number of tiles which are supported on the current device in the current catalog.
         * The catalog is identified by its title, so if several catalogs exists with the same title -
         * the returned value is the number of the intent-supported-tiles in all of them.
         * @param oCatalogModel
         * @returns {Number}
         * @private
         */

        /*getNumIntentSupportedTiles = function (oCatalogModel) {
            var aCatalogTiles = this.oModel.getProperty('/catalogTiles'),
                aCurrentCatalogSupportedTiles = aCatalogTiles.filter(function (oTile) {
                    return oTile.catalog === oCatalogModel.title && oTile.isTileIntentSupported === true;
                });

            return aCurrentCatalogSupportedTiles.length;
        };*/

    var DashboardManager = EventProvider.extend("sap.ushell.components.flp.launchpad.DashboardManager", {
        metadata: {
            publicMethods: ["getModel", "getDashboardView", "loadPersonalizedGroups", "attachEvent", "detachEvent", "attachEventOnce", "createTile", "deleteCatalogTileFromGroup", "resetGroupsOnFailure", "createGroupAndSaveTile"]
        },
        analyticsConstants: {
            PERSONALIZATION: "FLP: Personalization",
            RENAME_GROUP: "FLP: Rename Group",
            MOVE_GROUP: "FLP: Move Group",
            DELETE_GROUP: "FLP: Delete Group",
            RESET_GROUP: "FLP: Reset Group",
            DELETE_TILE: "FLP: Delete Tile",
            ADD_TILE: "FLP: Add Tile",
            MOVE_TILE: "FLP: Move Tile"
        },
        constructor: function (sId, mSettings) {
            //make this class only available once
            if (sap.ushell.components.flp.launchpad.getDashboardManager && sap.ushell.components.flp.launchpad.getDashboardManager()) {
                return sap.ushell.components.flp.launchpad.getDashboardManager();
            }
            sap.ushell.components.flp.launchpad.getDashboardManager = jQuery.sap.getter(this.getInterface());
            this.oPageBuilderService = sap.ushell.Container.getService("LaunchPage");
            this.oModel = mSettings.model;
            this.oConfig = mSettings.config;
            this.oRouter = mSettings.router;
            this.oSortableDeferred = $.Deferred();
            this.oSortableDeferred.resolve();
            this.aRequestQueue = [];
            this.aPendingCatalogQueue = [];
            this.bRequestRunning = false;
            this.tagsPool = [];
            this.skippedProcessCatalogs = 0;
            this.registerEvents();
            this.oTileCatalogToGroupsMap = {};
            this.iTabSelected = 0;
            this.tileViewUpdateQueue = [];
            this.tileViewUpdateTimeoutID = 0;
            this.oSegmentedTabTileViewDB = {};
            this.oPopover = null;
            this.tileUuid = null;
            this.segmentsStore = [];
            this.iMinNumOfTilesForBlindLoading = this.oModel.getProperty("/OptimizeTileLoadingThreshold") || 100;
            this.bIsScorllModeAccordingKPI = false;
            this.oGroupNotLockedFilter = new sap.ui.model.Filter("isGroupLocked", sap.ui.model.FilterOperator.EQ, false);
            this.bLinkPersonalizationSupported = this.oPageBuilderService.isLinkPersonalizationSupported();
            this.oDashboardLoadingManager = new DashboardLoadingManager("loadingManager", {
                oDashboardManager: this
            });
            //get 'home' view from the router
            if (this.oRouter) {
                var oTarget = this.oRouter.getTarget('home');
                oTarget.attachDisplay(function (oEvent) {
                    this.oDashboardView = oEvent.getParameter('view');
                }.bind(this));
            }

            this.oModel.bindProperty("/tileActionModeActive").attachChange(this._changeLinksScope.bind(this));
        },

        isBlindLoading : function () {
            jQuery.sap.log.setLevel(3)
            var homePageGroupDisplay = this.oModel.getProperty("/homePageGroupDisplay");
            var bIsScorllMode = (homePageGroupDisplay === undefined || homePageGroupDisplay === "scroll") && this.bIsScorllModeAccordingKPI;
            jQuery.sap.log.info("isBlindLoading reason IsScorllModeAccordingKPI and IsScorllMode: " + bIsScorllMode);
            this.oModel.getProperty("/tileActionModeActive") !=undefined ? jQuery.sap.log.info("isBlindLoading reason TileActionModeActive : " + this.oModel.getProperty("/tileActionModeActive")):"";
            return this.oModel.getProperty("/tileActionModeActive") || bIsScorllMode ;
        },

        createMoveActionDialog: function (sId) {
            var oGroupFilter = this.oGroupNotLockedFilter,
                oMoveDialog = new sap.m.SelectDialog(sId, {
                    title: sap.ushell.resources.i18n.getText('moveTileDialog_title'),
                    rememberSelections: false,
                    search: function (oEvent) {
                        var sValue = oEvent.getParameter("value"),
                            oFilter = new sap.ui.model.Filter("title", sap.ui.model.FilterOperator.Contains, sValue),
                            oBinding = oEvent.getSource().getBinding("items");
                        oBinding.filter([oFilter, oGroupFilter]);
                    },
                    contentWidth: '400px',
                    contentHeight:"auto",
                    confirm: function (oEvent) {
                        var aContexts = oEvent.getParameter("selectedContexts");
                        this.publishMoveActionEvents(oEvent, aContexts, "move" + this.tileType);

                    }.bind(this),
                    cancel: function () {
                        var oCurrentlyFocusedTile = jQuery('.sapUshellTile[tabindex="0"]')[0];
                        if (oCurrentlyFocusedTile) {
                            oCurrentlyFocusedTile.focus();
                        }
                    },
                    items: {
                        path: "/groups",
                        filters: [oGroupFilter],
                        template: new sap.m.StandardListItem({
                            title: "{title}"
                        })
                    }
                });
            return oMoveDialog;
        },

        publishMoveActionEvents: function (oEvent, aContexts, sMoveAction) {
            var oEventBus = sap.ui.getCore().getEventBus();
            if (aContexts.length) {
              var stileType = this.tileType === "link" ? "links" : "tiles";
                oEventBus.publish("launchpad", sMoveAction, {
                    sTileId: this.tileUuid,
                    sToItems: stileType,
                    sFromItems: stileType,
                    sTileType: stileType,
                    toGroupId: aContexts[0].getObject().groupId,
                    toIndex: aContexts[0].getObject()[this.tileType === "link" ? "links" : "tiles"].length,
                    source: oEvent.getSource().getId()
                });


                oEventBus.publish("launchpad", "scrollToGroup", {
                    groupId: aContexts[0].getObject().groupId,
                    groupChanged: false,
                    focus: false
                });

            }
        },

        _changeLinksScope: function (oEvent) {
            var that = this;
            if (this.bLinkPersonalizationSupported) {
                var bIsTileActionModeActive = oEvent.getSource().getValue();
                this.oModel.getProperty("/groups").forEach(function (oGroup, index) {
                    if (!oGroup.isGroupLocked) {
                        that._changeGroupLinksScope(oGroup, bIsTileActionModeActive ? 'Actions' : 'Display');
                    }
                });
            }
        },

        _changeGroupLinksScope: function (oGroup, scope) {
            var that = this;

            oGroup.links.forEach(function (oLink, index) {
                that._changeLinkScope(oLink.content[0], scope);
            });
        },

        _changeLinkScope: function (oLink, scope) {
            var oLinkView = oLink.getScope ? oLink : oLink.getContent()[0];//hack for demo content

            //if LinkPersonalization is supported by platform, then the link must support personalization
            if (this.bLinkPersonalizationSupported && oLinkView.setScope) {
                oLinkView.setScope(scope);
            }
        },

        registerEvents: function () {
            var oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.subscribe("launchpad", "addBookmarkTile", this._createBookmark, this);
            oEventBus.subscribe("launchpad", "tabSelected", this.getSegmentTabContentViews, this);
            oEventBus.subscribe("sap.ushell.services.Bookmark", "bookmarkTileAdded", this._addBookmarkToModel, this);
            oEventBus.subscribe("sap.ushell.services.Bookmark", "catalogTileAdded", this._refreshGroupInModel, this);
            oEventBus.subscribe("sap.ushell.services.Bookmark", "bookmarkTileDeleted", this.loadPersonalizedGroups, this);
            oEventBus.subscribe("launchpad", "loadDashboardGroups", this.loadPersonalizedGroups, this);
            oEventBus.subscribe("launchpad", "createGroupAt", this._createGroupAt, this);
            oEventBus.subscribe("launchpad", "createGroup", this._createGroup, this);
            oEventBus.subscribe("launchpad", "deleteGroup", this._deleteGroup, this);
            oEventBus.subscribe("launchpad", "resetGroup", this._resetGroup, this);
            oEventBus.subscribe("launchpad", "changeGroupTitle", this._changeGroupTitle, this);
            oEventBus.subscribe("launchpad", "moveGroup", this._moveGroup, this);
            oEventBus.subscribe("launchpad", "deleteTile", this._deleteTile, this);
            oEventBus.subscribe("launchpad", "movetile", this._moveTile, this);
            oEventBus.subscribe("launchpad", "movelink", this._moveLink, this);
            oEventBus.subscribe("launchpad", "sortableStart", this._sortableStart, this);
            oEventBus.subscribe("launchpad", "sortableStop", this._sortableStop, this);
            oEventBus.subscribe("renderCatalog", this.loadAllCatalogs, this);
            oEventBus.subscribe("showCatalog", this.updateTilesAssociation, this);
            oEventBus.subscribe("launchpad", "dashboardModelContentLoaded", this._modelLoaded, this);
            oEventBus.subscribe("launchpad", "convertTile", this._convertTile, this);

            //add Remove action for all tiles
            this.oPageBuilderService.registerTileActionsProvider(this._addFLPActionsToTile.bind(this));
        },

        _addFLPActionsToTile: function (oTile) {
            var bLinkPersonalizationSupportedForTile = this.bLinkPersonalizationSupported && this.oPageBuilderService.isLinkPersonalizationSupported(oTile),
                aActions = [];

            aActions.push(this._getMoveTileAction(oTile));

            if (bLinkPersonalizationSupportedForTile) {
                aActions.push(this._getConvertTileAction(oTile));
            }

            return aActions;
        },

        _getConvertTileAction: function (oTile) {
            var oEventBus = sap.ui.getCore().getEventBus(),
                that = this,
                sTileType = that.oPageBuilderService.getTileType(oTile);
            return {
                //Convert Tile action
                text: sTileType === 'link' ? sap.ushell.resources.i18n.getText('ConvertToTile') : sap.ushell.resources.i18n.getText('ConvertToLink'), //TODO: verify strings with Michael
                press: function (oSourceTile) {
                    oEventBus.publish("launchpad", "convertTile", oSourceTile);
                }
            };
        },

        _getMoveTileAction: function (oTile) {
            var that = this;
            return {
                //Move Tile action
                text: sap.ushell.resources.i18n.getText('moveTileDialog_action'),
                press: function () {
                    that.tileType = that.oPageBuilderService.getTileType(oTile);
                    that.tileUuid = that.getModelTileById(that.oPageBuilderService.getTileId(oTile), that.tileType === "link" ? "links" : "tiles").uuid;
                    var oMoveDialog =  that.tileType === "tile" ? that.moveTileDialog : that.moveLinkDialog;
                    if (that.tileType === "tile" || (that.tileType === "link")) {
                        if (!oMoveDialog) {
                            oMoveDialog = that.createMoveActionDialog("move" + that.tileType + "Dialog");
                            oMoveDialog.setModel(that.oModel);
                            if (that.tileType === "tile") {
                                that.moveTileDialog = oMoveDialog;
                            } else {
                                that.moveLinkDialog = oMoveDialog;
                            }
                        } else {
                            oMoveDialog.getBinding("items").filter([that.oGroupNotLockedFilter]);
                        }
                        oMoveDialog.open();
                     }
                }
            };
        },

        _handleTileAppearanceAnimation: function (oSourceTile) {
            if (!oSourceTile) {
               return;
            }
            var pfx = ["webkit", ""];
            function PrefixedEvent(element, type) {
                for (var i = 0; i < pfx.length; i++) {
                    type = type.toLowerCase();
                    oSourceTile.attachBrowserEvent(pfx[i]+type, function (oEvent) {
                        if (oEvent.originalEvent && oEvent.originalEvent.animationName === "sapUshellTileEntranceAnimation") {
                            oSourceTile.removeStyleClass("sapUshellTileEntrance")
                        }
                    }, false);
                }
            }
            PrefixedEvent(oSourceTile, "AnimationEnd");
            oSourceTile.addStyleClass("sapUshellTileEntrance");
        },

        destroy: function () {
            var oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.unsubscribe("launchpad", "addBookmarkTile", this._createBookmark, this);
            oEventBus.unsubscribe("launchpad", "loadDashboardGroups", this.loadPersonalizedGroups, this);
            oEventBus.unsubscribe("launchpad", "createGroupAt", this._createGroupAt, this);
            oEventBus.unsubscribe("launchpad", "createGroup", this._createGroup, this);
            oEventBus.unsubscribe("launchpad", "deleteGroup", this._deleteGroup, this);
            oEventBus.unsubscribe("launchpad", "resetGroup", this._resetGroup, this);
            oEventBus.unsubscribe("launchpad", "changeGroupTitle", this._changeGroupTitle, this);
            oEventBus.unsubscribe("launchpad", "moveGroup", this._moveGroup, this);
            oEventBus.unsubscribe("launchpad", "deleteTile", this._deleteTile, this);
            oEventBus.unsubscribe("launchpad", "movetile", this._moveTile, this);
            oEventBus.unsubscribe("launchpad", "movelink", this._moveLink, this);
            oEventBus.unsubscribe("launchpad", "sortableStart", this._sortableStart, this);
            oEventBus.unsubscribe("launchpad", "sortableStop", this._sortableStop, this);
            oEventBus.unsubscribe("renderCatalog", this.loadAllCatalogs, this);
            oEventBus.unsubscribe("showCatalog", this.updateTilesAssociation, this);
            oEventBus.unsubscribe("launchpad", "dashboardModelContentLoaded", this._modelLoaded, this);

            sap.ushell.components.flp.launchpad.getDashboardManager = undefined;
        },


        _refreshTiles: function () {
            var that = this,
                aGroups = this.oModel.getProperty("/groups");

            jQuery.each(aGroups, function (nIndex, oGroup) {
                jQuery.each(oGroup.tiles, function (nIndex, oTile) {
                    that.oPageBuilderService.refreshTile(oTile.object);
                });
            });
        },

        _sortableStart: function () {
            this.oSortableDeferred = $.Deferred();
        },

        _createBookmark: function (sChannelId, sEventId, oData) {
            var tileGroup = oData.group ? oData.group.object : "";

            delete oData.group;

            this._addRequest($.proxy(function () {
                var oResultPromise = sap.ushell.Container.getService("Bookmark").addBookmark(oData, tileGroup),
                    oResourceBundle = sap.ushell.resources.i18n;
                oResultPromise.always($.proxy(this._checkRequestQueue, this));
                oResultPromise.done(function () {
                    //the tile is added to our model in "_addBookmarkToModel" here we just show the
                    //success toast.
                    if (sap.ushell.Container) {
                        sap.ushell.Container.getService('Message').info(oResourceBundle.getText('tile_created_msg'));
                    }
                });
                oResultPromise.fail(function (sMsg) {
                    jQuery.sap.log.error(
                        "Failed to add bookmark",
                        sMsg,
                        "sap.ushell.ui.footerbar.AddBookmarkButton"
                    );
                    if (sap.ushell.Container) {
                        sap.ushell.Container.getService('Message').error(oResourceBundle.getText('fail_to_add_tile_msg'));
                    }
                });
            }, this));
        },

        /**
         * Add a bookmark to a dashboard group.
         * If no group is specified then the bookmark is added to th edefault group.
         * This function will be called also if an application used the bookmark service directly to add a bookmark.
         * the bookmark service publishes an event so that we will be able to update the model.
         * This method doesn't display a success toast since the application should show success or failure messages
         */
        _addBookmarkToModel: function (sChannelId, sEventId, oData) {
            var oTile = oData.tile,
                aGroups,
                oGroup = oData.group,
                srvc,
                sTileType,
                newTile,
                indexOfGroup,
                targetGroup,
                iNumTiles,
                iIndex;

            if (!oData || !oTile) {
                //this.loadPersonalizedGroups();
                this.bIsGroupsModelDirty = true;
                if (!this.bGroupsModelLoadingInProcess) {
                    this._handleBookmarkModelUpdate();
                }
                return;
            }

            // If no group was specified then the target group is the default one.
            if (!oGroup) {
                aGroups = this.getModel().getProperty("/groups");
                for (iIndex = 0; iIndex < aGroups.length; iIndex++) {
                    if (aGroups[iIndex].isDefaultGroup === true) {
                        oGroup = aGroups[iIndex].object;
                        break;
                    }
                }
            }

            //The create bookmark popup should not contain the locked groups anyway,
            //so this call not suppose to happen for a target locked group (we may as well always send false)
            srvc = this.oPageBuilderService;
            sTileType = srvc.getTileType(oTile);
            newTile = this._getTileModel(oTile, srvc.isGroupLocked(oGroup), sTileType, this._addModelToTileViewUpdateQueue);
            this.getTileView(newTile);
            indexOfGroup = this._getIndexOfGroupByObject(oGroup);
            targetGroup = this.oModel.getProperty("/groups/" + indexOfGroup);

            // The function calcVisibilityModes requires the group from the model
            targetGroup.tiles.push(newTile);
            targetGroup.visibilityModes = sap.ushell.utils.calcVisibilityModes(targetGroup, true);
            iNumTiles = targetGroup.tiles.length;
            this._updateModelWithTileView(indexOfGroup, iNumTiles);

            this.oModel.setProperty("/groups/" + indexOfGroup, targetGroup);
        },

        _refreshGroupInModel: function (sChannelId, sEventId, sGroupId) {
            var oLaunchPageService = sap.ushell.Container.getService("LaunchPage"),
                sErrorMsg = 'Failed to refresh group with id:' + sGroupId + ' in the model',
                that = this;

            oLaunchPageService.getGroups()
                .fail(jQuery.sap.log.error(sErrorMsg, null, "sap.ushell.components.flp.launchpad.DashboardManager"))
                .done(function (aGroups) {
                    aGroups.some(function (oGroup) {
                        if (oLaunchPageService.getGroupId(oGroup) === sGroupId) {
                            oLaunchPageService.getDefaultGroup().done(function (oDefaultGroup) {
                                var bIsDefaultGroup = sGroupId === oDefaultGroup.getId() ? true : false,
                                    oGroupModel = that._getGroupModel(oGroup, bIsDefaultGroup),
                                    indexOfGroup = that._getIndexOfGroupByObject(oGroupModel.object);

                                that.oModel.setProperty("/groups/" + indexOfGroup, oGroupModel);
                            });
                            return true;
                        }
                    });
                });
        },

        _sortableStop: function () {
            this.oSortableDeferred.resolve();
        },

        _handleAfterSortable: function (fFunc) {
            return $.proxy(function () {
                var outerArgs = Array.prototype.slice.call(arguments);
                this.oSortableDeferred.done(function () {
                    fFunc.apply(null, outerArgs);
                });
            }, this);
        },

        _addRequest: function (fRequest) {
            this.aRequestQueue.push(fRequest);
            if (!this.bRequestRunning) {
                this.bRequestRunning = true;
                this.aRequestQueue.shift()();
            }
        },

        _checkRequestQueue: function () {
            if (this.aRequestQueue.length === 0) {
                this.bRequestRunning = false;
            } else {
                this.aRequestQueue.shift()();
            }
        },

        _requestFailed: function () {
            this.aRequestQueue = [];
            this.bRequestRunning = false;
        },

        /*
         * oData should have the following parameters:
         * title
         */
        _createGroup: function (sChannelId, sEventId, oData) {
            var oGroup = this._getGroupModel(null),
                aGroups = this.oModel.getProperty("/groups"),
                oModel = this.oModel;

            oModel.setProperty("/groupList-skipScrollToGroup", true);
            window.setTimeout(function () {
                oModel.setProperty("/groups/" + aGroups.length, oGroup);
            }, 500);
            window.setTimeout(function () {
                oModel.setProperty("/groupList-skipScrollToGroup", false);
            }, 1000);

            // We don't call the backend here as the user hasn't had the opportunity to give the group a name yet.
            // The group will be persisted after it got a name, in the changeGroupTitle handler.
            // TODO: This depends on the behaviour of the GroupList, which enters edit-mode immediately after creating a group.
            //       It would be better if this event would be fired after the group has a name.
        },

        /*
         * oData should have the following parameters:
         * title
         * location
         */
        _createGroupAt: function (sChannelId, sEventId, oData) {
            var newGroupIndex = parseInt(oData.location, 10),
                aGroups = this.oModel.getProperty("/groups"),
                oGroup = this._getGroupModel(null, false, newGroupIndex === aGroups.length, oData),
                oModel = this.oModel,
                i;

            oGroup.index = newGroupIndex;

            aGroups.splice(newGroupIndex, 0, oGroup);
            for (i = 0; i < aGroups.length - 1; i++) {
                aGroups[i].isLastGroup = false;
            }

            //set new groups index
            for (i = newGroupIndex + 1; i < aGroups.length; i++) {
                aGroups[i].index++;
            }
            oModel.setProperty("/groups", aGroups);
        },

        _getIndexOfGroup: function (sGroupId) {
            var nGroupIndex = null,
                aGroups = this.oModel.getProperty("/groups");
            jQuery.each(aGroups, function (nIndex, oGroup) {
                if (oGroup.groupId === sGroupId) {
                    nGroupIndex = nIndex;
                    return false;
                }
            });
            return nGroupIndex;
        },

        _getIndexOfGroupByObject: function (oGroup) {
            var nGroupIndex = null,
                aGroups = this.oModel.getProperty("/groups"),
                sGroupId = this.oPageBuilderService.getGroupId(oGroup);
            aGroups.every(function (oModelGroup, nIndex) {
                var sCurrentGroupId = this.oPageBuilderService.getGroupId(oModelGroup.object);
                if (sCurrentGroupId === sGroupId) {
                    nGroupIndex = nIndex;
                    return false;
                }
                return true;
            }.bind(this));
            return nGroupIndex;
        },

        _getPathOfGroup: function (sGroupId) {
            return "/groups/" + this._getIndexOfGroup(sGroupId);
        },

        _getPathOfTile: function (sTileId) {
            var aGroups = this.oModel.getProperty("/groups"),
                nResGroupIndex = null,
                nResTileIndex = null,
                sType,
                fnEqual = function (nTileIndex, oTile) {
                    if (oTile.uuid === sTileId) {
                        nResTileIndex = nTileIndex;
                        return false;
                    }
                }

            jQuery.each(aGroups, function (nGroupIndex, oGroup) {
                jQuery.each(oGroup.tiles, fnEqual);
                if (nResTileIndex !== null) {
                    nResGroupIndex = nGroupIndex;
                    sType = "tiles";
                    return false;
                }
                jQuery.each(oGroup.links, fnEqual);
                if (nResTileIndex !== null) {
                    nResGroupIndex = nGroupIndex;
                    sType = "links";
                    return false;
                }
            });

            return nResGroupIndex !== null ? "/groups/" + nResGroupIndex + "/" + sType + "/" + nResTileIndex : null;
        },

        // see http://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another
        _moveInArray: function (aArray, nFromIndex, nToIndex) {
            if (nToIndex >= aArray.length) {
                var k = nToIndex - aArray.length;
                while ((k--) + 1) {
                    aArray.push(undefined);
                }
            }
            aArray.splice(nToIndex, 0, aArray.splice(nFromIndex, 1)[0]);
        },

        _updateGroupIndices: function (aArray) {
            var k;
            for (k = 0; k < aArray.length; k++) {
                aArray[k].index = k;
            }
        },
        /*
         * oData should have the following parameters
         * groupId
         */
        _deleteGroup: function (sChannelId, sEventId, oData) {
            var that = this,
                sGroupId = oData.groupId,
                sGroupObjectId,
                aGroups = this.oModel.getProperty("/groups"),
                nGroupIndex = this._getIndexOfGroup(sGroupId),
                bIsLast = aGroups.length - 1 === nGroupIndex,
                oGroup = null,
                oResultPromise,
                oModel,
                nextSelectedItemIndex,
                oBus;

            nextSelectedItemIndex = bIsLast ? nGroupIndex - 1 : nGroupIndex;
            this._destroyGroupModel("/groups/" + nGroupIndex);
            oGroup = aGroups.splice(nGroupIndex, 1)[0].object;
            if (bIsLast) {
                this.oModel.setProperty("/groups/" + nextSelectedItemIndex + "/isLastGroup", bIsLast);
            }
            sGroupObjectId = sap.ushell.Container.getService("LaunchPage").getGroupId(oGroup);
            oModel = this.oModel;
            oModel.setProperty("/groupList-skipScrollToGroup", true);
            oModel.setProperty("/groups", aGroups);
            this._updateGroupIndices(aGroups);

            if (nextSelectedItemIndex >= 0) {
                oBus = sap.ui.getCore().getEventBus();
                window.setTimeout($.proxy(oBus.publish, oBus, "launchpad", "scrollToGroup", {groupId: this.oModel.getProperty("/groups")[nextSelectedItemIndex].groupId}), 200);
            }

            window.setTimeout(function () {
                oModel.setProperty("/groupList-skipScrollToGroup", false);
            }, 1000);

            this._addRequest($.proxy(function () {
                var groupName = sap.ushell.Container.getService("LaunchPage").getGroupTitle(oGroup);
                try {
                    oResultPromise = this.oPageBuilderService.removeGroup(oGroup);
                } catch (err) {
                    this._resetGroupsOnFailure("fail_to_delete_group_msg");
                    return;
                }

                oResultPromise.done(function () {
                    sap.ushell.Container.getService("UsageAnalytics").logCustomEvent(
                        this.analyticsConstants.PERSONALIZATION,
                        this.analyticsConstants.DELETE_GROUP,
                        [groupName, sGroupObjectId]
                    );
                    this._showLocalizedMessage("group_deleted_msg", [groupName]);
                }.bind(this));
                oResultPromise.fail(this._handleAfterSortable(that._resetGroupsOnFailureHelper("fail_to_delete_group_msg")));
                oResultPromise.always($.proxy(this._checkRequestQueue, this));
            }, this));
        },

        /*
         * oData should have the following parameters
         * groupId
         */
        _resetGroup: function (sChannelId, sEventId, oData) {
            var that = this,
                sGroupId = oData.groupId,
                nGroupIndex = this._getIndexOfGroup(sGroupId),
                oGroup = this.oModel.getProperty("/groups/" + nGroupIndex),
                sGroupTitle,
                sGroupObjectId,
                oResultPromise,
                oGroupControl;

            this.oModel.setProperty("/groups/" + nGroupIndex + "/sortable", false);
            sGroupObjectId = sap.ushell.Container.getService("LaunchPage").getGroupId(oGroup.object);
            sGroupTitle = sap.ushell.Container.getService("LaunchPage").getGroupTitle(oGroup.object);
            this._addRequest($.proxy(function () {
                try {
                    oResultPromise = this.oPageBuilderService.resetGroup(oGroup.object);
                } catch (err) {
                    this._resetGroupsOnFailure("fail_to_reset_group_msg");
                    return;
                }

                oResultPromise.done(this._handleAfterSortable($.proxy(function (sGroupId, oGroup, oResetedGroup) {
                    sap.ushell.Container.getService("UsageAnalytics").logCustomEvent(
                        this.analyticsConstants.PERSONALIZATION,
                        this.analyticsConstants.RESET_GROUP,
                        [sGroupTitle, sGroupObjectId]
                    );
                    var nGroupIndex = that._getIndexOfGroup(sGroupId);

                    this._loadGroup(nGroupIndex, oResetedGroup || oGroup.object, this._addAndUpdateModelWithTileView);
                    this._showLocalizedMessage("group_reset_msg", [oGroup.title]);
                    this.oModel.setProperty("/groups/" + nGroupIndex + "/sortable", true);

                    oGroupControl = sap.ui.getCore().byId('dashboardGroups').getGroupControlByGroupId(sGroupId);

                    if (oGroupControl.getBindingContext().getObject().links && oGroupControl.getBindingContext().getObject().links.length && !oGroupControl.getIsGroupLocked()) {
                        this._changeGroupLinksScope(oGroupControl.getBindingContext().getObject(), this.oModel.getProperty("/tileActionModeActive") ? sap.m.GenericTileScope.Actions : sap.m.GenericTileScope.Display);
                    }

                    if (oGroupControl) {
                        oGroupControl.rerender();
                        this.updateTilesAssociation();
                        sap.ushell.utils.handleTilesVisibility();
                    }

                }, this, sGroupId, oGroup)));

                oResultPromise.fail(this._handleAfterSortable(that._resetGroupsOnFailureHelper("fail_to_reset_group_msg")));
                oResultPromise.always($.proxy(this._checkRequestQueue, this));
            }, this));
        },

        /*
         * oData should have the following parameters
         * fromIndex
         * toIndex
         */
        _moveGroup: function (sChannelId, sEventId, oData) {
            var iFromIndex = oData.fromIndex,
                iToIndex = oData.toIndex,
                aGroups = this.oModel.getProperty("/groups"),
                oModel = this.oModel,
                bActionMode = this.oModel.getProperty("/tileActionModeActive"),
                oResultPromise,
                oGroup,
                sGroupId,
                that = this,
                i,
                oDestinationObj;

            //Fix the indices to support hidden groups
            if (!bActionMode) {
                iFromIndex = this._adjustFromGroupIndex(iFromIndex, aGroups);
            }

            //Move var definition after fixing the from index.
            oGroup = aGroups[iFromIndex];
            sGroupId = oGroup.groupId;
            //Fix the to index accordingly
            if (!bActionMode) {
                iToIndex = this._adjustToGroupIndex(iToIndex, aGroups, sGroupId);
            }

            oDestinationObj = aGroups[iToIndex].object;
            this._moveInArray(aGroups, iFromIndex, iToIndex);
            this._updateGroupIndices(aGroups);
            oModel.setProperty("/groupList-skipScrollToGroup", true);
            for (i = 0; i < aGroups.length - 1; i++) {
                aGroups[i].isLastGroup = false;
            }
            aGroups[aGroups.length - 1].isLastGroup = true;
            oModel.setProperty("/groups", aGroups);

            window.setTimeout(function () {
                oModel.setProperty("/groupList-skipScrollToGroup", false);
            }, 1000);

            this._addRequest($.proxy(function () {
                var oGroup = this.oModel.getProperty(this._getPathOfGroup(sGroupId));
                try {
                    this._getOriginalGroupIndex(oDestinationObj).done(function (nGroupOrgIndex) {
                        oResultPromise = this.oPageBuilderService.moveGroup(oGroup.object, nGroupOrgIndex);
                        oResultPromise.done(function () {
                            sap.ushell.Container.getService("UsageAnalytics").logCustomEvent(
                                that.analyticsConstants.PERSONALIZATION,
                                that.analyticsConstants.MOVE_GROUP,
                                [oGroup.title, iFromIndex, iToIndex, sGroupId]
                            );
                        });
                        oResultPromise.fail(this._handleAfterSortable(this._resetGroupsOnFailureHelper("fail_to_move_group_msg")));
                        oResultPromise.always($.proxy(this._checkRequestQueue, this));
                    }.bind(this));
                } catch (err) {
                    this._resetGroupsOnFailure("fail_to_move_group_msg");
                    return;
                }

            }, this));
        },

        /*
         * toIndex - The index in the UI of the required group new index. (it is not including the group itself)
         * groups - The list of groups in the model (including hidden and visible groups)
         * The function returns the new index to be used in the model - since there might be hidden groups that should be taken in account
         */
        _adjustToGroupIndex: function (toIndex, groups, groupId) {
            var visibleCounter = 0,
                bIsGroupIncluded = false,
                i = 0;
            // In order to get the new index, count all groups (visible+hidden) up to the new index received from the UI.
            for (i = 0; i < groups.length && visibleCounter < toIndex; i++) {
                if (groups[i].isGroupVisible) {
                    if (groups[i].groupId === groupId) {
                        bIsGroupIncluded = true;
                    } else {
                        visibleCounter++;
                    }
                }
            }
            if (bIsGroupIncluded) {
                return i - 1;
            }
            return i;
        },

        _adjustFromGroupIndex: function (index, groups) {
            var visibleGroupsCounter = 0,
                i;
            for (i = 0; i < groups.length; i++) {
                if (groups[i].isGroupVisible) {
                    visibleGroupsCounter++;
                }
                if (visibleGroupsCounter === index + 1) {
                    return i;
                }
            }
            //Not suppose to happen, but if not found return the input index
            return index;
        },
        /*
         * returns the adapter cosponsoring group index
         */
        _getOriginalGroupIndexByIndex: function (nGroupIndex) {
            var aGroups = this.oModel.getProperty("/groups"),
                oServerGroupObject = aGroups[nGroupIndex].object;

            return this._getOriginalGroupIndex(oServerGroupObject);
        },
        /*
         * returns the adapter cosponsoring group index
         */
        _getOriginalGroupIndex: function (oServerGroupObject) {
            var srvc = this.oPageBuilderService,
                that = this,
                oGroupsPromise = this.oPageBuilderService.getGroups(),
                oDeferred = new jQuery.Deferred();

            oGroupsPromise.done(function (aGroups) {
                var nGroupOrgIndex = null;

                jQuery.each(aGroups, function (nIndex, oGroup) {
                    if (srvc.getGroupId(oGroup) === srvc.getGroupId(oServerGroupObject)) {
                        nGroupOrgIndex = nIndex;
                        return false;
                    }
                });

                oDeferred.resolve(nGroupOrgIndex);
            });

            oGroupsPromise.fail(function () {
                that._showLocalizedErrorHelper("fail_to_load_groups_msg")();
                oDeferred.reject();
            });

            return oDeferred;

        },        /*
         * oData should have the following parameters
         * groupId
         * newTitle
         */
        _changeGroupTitle: function (sChannelId, sEventId, oData) {
            var sNewTitle = oData.newTitle,
                aGroups = this.oModel.getProperty("/groups"),
                sGroupId = oData.groupId,
                sGroupOriginalId = oData.groupId,
                nGroupIndex = this._getIndexOfGroup(sGroupId),
                oGroup = this.oModel.getProperty("/groups/" + nGroupIndex),
                sOldTitle = oGroup.title,
                oResultPromise,
                that = this;

            this.oModel.setProperty("/groups/" + nGroupIndex + "/title", sNewTitle);

            // Check, if the group has already been persisted.
            if (!oGroup.object) {
                // Add the group in the backend.
                this._addRequest($.proxy(function () {
                    try {
                        if (nGroupIndex === aGroups.length - 1) {
                            oResultPromise = this.oPageBuilderService.addGroup(sNewTitle, nGroupIndex);
                            oResultPromise.done(this._handleAfterSortable($.proxy(function (sGroupId, oNewGroup) {
                                var nGroupIndex = this._getIndexOfGroup(sGroupId);
                                this._loadGroup(nGroupIndex, oNewGroup);
                                sap.ushell.Container.getService("UsageAnalytics").logCustomEvent(
                                    that.analyticsConstants.PERSONALIZATION,
                                    that.analyticsConstants.RENAME_GROUP,
                                    [sOldTitle, sNewTitle, sGroupId]
                                );
                            }, this, sGroupId)));

                            oResultPromise.fail(this._handleAfterSortable(this._resetGroupsOnFailureHelper("fail_to_create_group_msg")));
                            oResultPromise.always($.proxy(this._checkRequestQueue, this));
                        } else {
                            //handle new group creation.
                            this._getOriginalGroupIndexByIndex(nGroupIndex + 1).done(function (nGroupOrgIndex) {
                                oResultPromise = this.oPageBuilderService.addGroupAt(sNewTitle, nGroupOrgIndex);

                                oResultPromise.done(this._handleAfterSortable($.proxy(function (sGroupId, oNewGroup) {
                                    var nGroupIndex = this._getIndexOfGroup(sGroupId);
                                    this._loadGroup(nGroupIndex, oNewGroup);
                                    sap.ushell.Container.getService("UsageAnalytics").logCustomEvent(
                                        that.analyticsConstants.PERSONALIZATION,
                                        that.analyticsConstants.RENAME_GROUP,
                                        [sOldTitle, sNewTitle, sGroupId]
                                    );
                                }, this, sGroupId)));

                                oResultPromise.fail(this._handleAfterSortable(this._resetGroupsOnFailureHelper("fail_to_create_group_msg")));
                                oResultPromise.always($.proxy(this._checkRequestQueue, this));
                            }.bind(this));
                        }
                    } catch (err) {
                        this._resetGroupsOnFailure("fail_to_create_group_msg");
                        return;
                    }

                }, this));
            } else {
                // Rename the group in the backend.
                // model is already changed - it only has to be made persistent in the backend
                this._addRequest($.proxy(function () {
                    try {
                        oResultPromise = this.oPageBuilderService.setGroupTitle(oGroup.object, sNewTitle);
                    } catch (err) {
                        this._resetGroupsOnFailure("fail_to_rename_group_msg");
                        return;
                    }
                    oResultPromise.done(function () {
                        sGroupOriginalId = sap.ushell.Container.getService("LaunchPage").getGroupId(oGroup.object);
                        sap.ushell.Container.getService("UsageAnalytics").logCustomEvent(
                            that.analyticsConstants.PERSONALIZATION,
                            that.analyticsConstants.RENAME_GROUP,
                            [sOldTitle, sNewTitle, sGroupOriginalId]
                        );
                    });
                    // Revert to the old title.
                    oResultPromise.fail(this._handleAfterSortable($.proxy(function (sGroupId, sOldTitle) {
                        var sGroupPath = this._getPathOfGroup(sGroupId);
                        this._showLocalizedError("fail_to__msg");
                        this.oModel.setProperty(sGroupPath + "/title", sOldTitle);
                        this._requestFailed();
                    }, this, sGroupId)));

                    oResultPromise.always($.proxy(this._checkRequestQueue, this));
                }, this));
            }
        },

        createTile: function (oData) {
            var oCatalogTileContext = oData.catalogTileContext,
                oContext = oData.groupContext,
                oGroup = this.oModel.getProperty(oContext.getPath()),
                sGroupId = oGroup.groupId,
                oResultPromise,
                deferred = jQuery.Deferred(),
                oResponseData = {},
                oBus;

            //publish event for UserActivityLog
            oBus = sap.ui.getCore().getEventBus();
            $.proxy(oBus.publish, oBus, "launchpad", "addTile", {
                catalogTileContext: oCatalogTileContext,
                groupContext: oContext
            });

            if (!oCatalogTileContext) {
                jQuery.sap.log.warning("DashboardManager: Did not receive catalog tile object. Abort.", this);
                return;
            }

            this._addRequest($.proxy(function () {
                try {
                    oResultPromise = this.oPageBuilderService.addTile(oCatalogTileContext.getProperty("src"), oContext.getProperty("object"));
                } catch (err) {
                    this._resetGroupsOnFailure("fail_to_add_tile_msg");
                    return;
                }

                var that = this;
                oResultPromise
                    .done(function (oTile) {
                        var sGroupPath = that._getPathOfGroup(sGroupId),
                            sTileTitle = sap.ushell.Container.getService("LaunchPage").getTileTitle(oTile);

                        that._addTileToGroup(sGroupPath, oTile);
                        oResponseData = {group: oGroup, status: 1, action: 'add'}; // 1 - success
                        sap.ushell.Container.getService("UsageAnalytics").logCustomEvent(
                            that.analyticsConstants.PERSONALIZATION,
                            that.analyticsConstants.ADD_TILE,
                            [oGroup.title, sTileTitle]
                        );
                        deferred.resolve(oResponseData);
                    })
                    .fail(function () {
                        oResponseData = {group: oGroup, status: 0, action: 'add'};  // 0 - failure
                        deferred.resolve(oResponseData);
                    })
                    .always(
                        function () {
                            that._checkRequestQueue();
                        }
                    );
            }, this));

            return deferred.promise();
        },

        createGroup: function (title) {
            var deferred = jQuery.Deferred();
            if (!sap.ushell.utils.validHash(title)) {
                return deferred.reject({status: 0, action: 'createNewGroup'});
            }

            var oGroup = this._getGroupModel(null, false, true);
            var aGroups = this.oModel.getProperty("/groups");
            var sGroupId = oGroup.groupId;
            var index = aGroups.length;
            if (index > 0) {
                aGroups[index - 1].isLastGroup = false;
            }
            oGroup.title = title;
            oGroup.index = index;
            oGroup.editMode = false;
            aGroups.push(oGroup);
            this.oModel.setProperty("/groups/", aGroups);

            // Create new group
            this._addRequest(function (title) {
                try {
                    var oResultPromise = this.oPageBuilderService.addGroup(title);
                } catch (err) {
                    this._resetGroupsOnFailure("fail_to_create_group_msg");
                    return;
                }

                oResultPromise.done(this._handleAfterSortable(function (sGroupId, oNewGroup) {
                    var nGroupIndex = this._getIndexOfGroup(sGroupId);
                    this._loadGroup(nGroupIndex, oNewGroup);
                    var oContext = new sap.ui.model.Context(this.oModel, "/groups/" + nGroupIndex);
                    deferred.resolve(oContext);
                }.bind(this, sGroupId)));

                oResultPromise.fail(function (data) {
                    this._handleAfterSortable(this._resetGroupsOnFailureHelper("fail_to_create_group_msg"));
                    var oResponseData = {group: data.group, status: 0, action: 'createNewGroup'}; // 0 - failure
                    deferred.resolve(oResponseData); // 0 - failure
                }.bind(this));

                oResultPromise.always($.proxy(this._checkRequestQueue, this));
            }.bind(this, title));

            return deferred.promise();
        },

        createGroupAndSaveTile: function (oData) {
            var oCatalogTileContext = oData.catalogTileContext,
                sNewTitle = oData.newGroupName,
                deferred = jQuery.Deferred(),
                oResponseData = {};

            if (sap.ushell.utils.validHash(sNewTitle) && oCatalogTileContext) {
                this.createGroup(sNewTitle).then(function (oContext) {
                    var promise = this.createTile({
                        catalogTileContext: oCatalogTileContext,
                        groupContext: oContext
                    });

                    promise.done(function (data) {
                        oResponseData = {group: data.group, status: 1, action: 'addTileToNewGroup'}; // 1 - success
                        deferred.resolve(oResponseData);
                    }).fail(function (data) {
                        oResponseData = {group: data.group, status: 0, action: 'addTileToNewGroup'}; // 0 - failure
                        deferred.resolve(oResponseData);
                    });
                }.bind(this));
            }
            return deferred.promise();
        },

        /*
         * Dashboard
         * oData should have the following parameters
         * tileId
         * groupId
         */
        _deleteTile: function (sChannelId, sEventId, oData) {
            var that = this,
                sTileId = oData.tileId || oData.originalTileId,
                aGroups = this.oModel.getProperty("/groups"),
                sItems = oData.items || 'tiles';

            jQuery.each(aGroups, function (nGroupIndex, oGroup) {
                var bFoundFlag = false;
                jQuery.each(oGroup[sItems], function (nTileIndex, oTmpTile) {
                    if (oTmpTile.uuid === sTileId || oTmpTile.originalTileId === sTileId) {
                        // Remove tile from group.
                        that._destroyTileModel("/groups/" + nGroupIndex + "/" + sItems + "/" + nTileIndex);
                        var oTile = oGroup[sItems].splice(nTileIndex, 1)[0],
                            oResultPromise,
                            sTileName = sap.ushell.Container.getService("LaunchPage").getTileTitle(oTile.object),
                            sCatalogTileId = sap.ushell.Container.getService("LaunchPage").getCatalogTileId(oTile.object),
                            sCatalogTileTitle = sap.ushell.Container.getService("LaunchPage").getCatalogTileTitle(oTile.object),
                            sTileRealId = sap.ushell.Container.getService("LaunchPage").getTileId(oTile.object),
                            personalization = that.oModel.getProperty("/personalization");

                        oGroup.visibilityModes = sap.ushell.utils.calcVisibilityModes(oGroup, personalization);
                        that.oModel.setProperty("/groups/" + nGroupIndex, oGroup);
                        that._addRequest(function () {
                            try {
                                oResultPromise = that.oPageBuilderService.removeTile(oGroup.object, oTile.object);
                            } catch (err) {
                                this._resetGroupsOnFailure("fail_to_remove_tile_msg");
                                return;
                            }

                            oResultPromise.done(that._handleAfterSortable(function () {

                                that._showLocalizedMessage("tile_deleted_msg", [sTileName, oGroup.title]);
                                sap.ushell.Container.getService("UsageAnalytics").logCustomEvent(
                                    that.analyticsConstants.PERSONALIZATION,
                                    that.analyticsConstants.DELETE_TILE,
                                    [sTileName || sTileRealId, sCatalogTileId, sCatalogTileTitle, oGroup.title]
                                );
                            }));
                            oResultPromise.fail(that._handleAfterSortable(that._resetGroupsOnFailureHelper("fail_to_remove_tile_msg")));
                            oResultPromise.always($.proxy(that._checkRequestQueue, that));
                        });
                        sap.ushell.utils.handleTilesVisibility();
                        bFoundFlag = true;
                        return false;
                    }
                });
                if (bFoundFlag) {
                    return false;
                }
            });
        },

        _sendDeleteTileRequest: function (oGroup, oTile) {
            var oResultPromise,
                tmpPageBuilderService = sap.ushell.Container.getService('LaunchPage');
            try {
                oResultPromise = tmpPageBuilderService.removeTile(oGroup, oTile.object);
            } catch (err) {
                jQuery.sap.log.error("deleteCatalogTileFromGroup ; removeTile ; Exception occurred: " + err);
            }

            return oResultPromise;
        },

        /*
         * Delete all instances of a catalog Tile from a Group
         */
        deleteCatalogTileFromGroup: function (oData) {
            var that = this,
                sDeletedTileCatalogId = decodeURIComponent(oData.tileId),
                iGroupIndex = oData.groupIndex,
                oGroup = this.oModel.getProperty("/groups/" + iGroupIndex),
                serv = sap.ushell.Container.getService("LaunchPage"),
                deferred = jQuery.Deferred(),
                aDeleteTilePromises = [],
                aFilteredTiles,
                oPositiveDeferred,
                oDeletePromise;

            aFilteredTiles = oGroup.tiles.filter(
                function (oTile) {
                    var sTmpTileCatalogId = serv.getCatalogTileId(oTile.object);
                    if (sTmpTileCatalogId !== sDeletedTileCatalogId) {
                        return true;
                    } else {
                        // Initialize oPositiveDeferred object that will later be resolved with the status of the delete request
                        oPositiveDeferred = jQuery.Deferred();
                        // Send the delete request to the server
                        oDeletePromise = that._sendDeleteTileRequest(oGroup.object, oTile);

                        oDeletePromise.done(
                            (function (deferred) {
                                return function () {
                                    deferred.resolve({status: true});
                                };
                            })(oPositiveDeferred));

                        oDeletePromise.fail(
                            (function (deferred) {
                                return function () {
                                    deferred.resolve({status: false});
                                };
                            })(oPositiveDeferred));

                        aDeleteTilePromises.push(oPositiveDeferred);

                        return false;
                    }
                }
            );

            oGroup.tiles = aFilteredTiles;
            oGroup.visibilityModes = sap.ushell.utils.calcVisibilityModes(oGroup, true);

            // Wait for all of the delete requests before resolving the deferred
            jQuery.when.apply(jQuery, aDeleteTilePromises).
            done(
                function (result) {
                    var bSuccess = true,
                        index = 0,
                        promisesLength = aDeleteTilePromises.length;

                    // Check if at least one deleteTilePromises has failure status
                    for (index; index < promisesLength; index++) {
                        if (!result.status) {
                            bSuccess = false;
                            break;
                        }
                    }
                    if (bSuccess) {
                        // that.oModel.setProperty("/groups/" + iGroupIndex + "/tiles/", oGroup.tiles);
                        that.oModel.setProperty("/groups/" + iGroupIndex, oGroup);
                    }
                    deferred.resolve({group: oGroup, status: bSuccess, action: 'remove'});
                }
            );
            return deferred.promise();
        },
        _getGroupIndex: function (sId) {
            var aGroups = this.oModel.getProperty("/groups"),
                oGroupInfo = this._getNewGroupInfo(aGroups, sId);
            if (oGroupInfo) {
                return oGroupInfo.newGroupIndex;
            }
        },
        _convertTile: function (sChannelId, sEventId, oData) {
            var oSourceTile = oData.tile ? oData.tile : oData,//temp solution - i should change all calls for convert to support oData obj
                nGroupIndex = oData.srcGroupId ? this._getGroupIndex(oData.srcGroupId) : undefined,
                oGroup = oData.srcGroupId ? this.oModel.getProperty("/groups/" + nGroupIndex) : oSourceTile.getParent().getBindingContext().getObject(),//please humafy this
                aTileBindingContext = oSourceTile.getBindingContext().sPath.split("/"),
                oTile = oSourceTile.getBindingContext().getObject(),
                sType = aTileBindingContext[aTileBindingContext.length - 2],
                sTileId = oTile.uuid,
                curTileIndex = parseInt(aTileBindingContext[aTileBindingContext.length - 1],10),
                newTileIndex = oData.toIndex !== undefined ? oData.toIndex : undefined,
                oResultPromise,
                bActionMode = this.oModel.getProperty("/tileActionModeActive"),
                newGroupIndex = oData.toGroupId ? this._getGroupIndex(oData.toGroupId) : oGroup.index,
                oDstGroup =  oData.toGroupId ? this.oModel.getProperty("/groups/" + newGroupIndex) : oGroup;

            var oIndexInfo =  this._getIndexForConvert(sType, curTileIndex, newTileIndex, oGroup, oDstGroup),
                sourceInfo = {
                  "tileIndex": curTileIndex,
                  "groupIndex": nGroupIndex,
                  "group": oGroup
                };

            this._addRequest($.proxy(function () {
                try {
                    oResultPromise = this.oPageBuilderService.moveTile(oTile.object, oIndexInfo.tileIndex, oIndexInfo.newTileIndex, oGroup.object, oDstGroup.object, sType === "links" ? "tile" : "link");
                } catch (err) {
                    this._resetGroupsOnFailure("fail_to_move_tile_msg");
                    return;
                }

                // Putting a special flag on the Tile's object
                // this enables us to disable opening the tile's action until it has been updated from the backend
                // (see in DashboardContent.view
                oTile.tileIsBeingMoved = true;

                //we call to _handleAfterSortable to handle the case in which convertTile is called by dragAndDrop flow
                oResultPromise.done(this._handleAfterSortable($.proxy(function (sTileId, oTargetTile) {
                    var sTilePath = this._getPathOfTile(sTileId);

                    // If we cannot find the tile, it might have been deleted -> Check!
                    if (sTilePath) {
                        this._checkRequestQueue();
                        // get the target-tile view and align the Model for consistency
                        this.oPageBuilderService.getTileView(oTargetTile).done(function (oView) {
                            if (sType === "tiles") {//it means we convert to link
                              this._attachLinkPressHandlers(oView);
                              this._addDraggableAttribute(oView);
                              this._changeLinkScope(oView, bActionMode && sType !== 'links' ? 'Actions' : 'Display');
                            }
                            var dstGroupInfo = {
                              "tileIndex": newTileIndex,
                              "groupIndex": newGroupIndex,
                              "group": oDstGroup
                            },
                            tileInfo = {
                              "tile": oTile,
                              "view": oView,
                              "type": sType,
                              "tileObj": oTargetTile
                            };

                            this.replaceTileViewAfterConvert(sourceInfo, dstGroupInfo, tileInfo);
                            this.updateTilesAssociation();
                            sap.ushell.utils.handleTilesVisibility();
                            if (oData.callBack) {
                              oData.callBack(oView);
                            }
                        }.bind(this));
                    }
                }, this, sTileId)));

                oResultPromise.fail(this._handleAfterSortable(this._resetGroupsOnFailureHelper("fail_to_move_tile_msg")));
            }, this));
        },

        replaceTileViewAfterConvert: function (oSourceInfo, oDstInfo, oTileInfo) {
            // get the old view from tile's model
            var oTile = oTileInfo.tile,
                oldViewContent = oTile.content;
                // first we set new view, new tile object and new Id. And reset the move-scenario flag
                oTile.tileIsBeingMoved = false;
                oTile.content = [oTileInfo.view];
                oTile.object = oTileInfo.tileObj;
                oTile.originalTileId = this.oPageBuilderService.getTileId(oTileInfo.tileObj);

            //fix the tile position in the model and insert the converted tile\link to the group
            oSourceInfo.group[oTileInfo.type].splice(oSourceInfo.tileIndex, 1);
            if (oDstInfo.tileIndex !== undefined) {
              oDstInfo.group[oTileInfo.type === "tiles" ? "links" : "tiles"].splice(oDstInfo.tileIndex, 0, oTile);
            } else {
              oDstInfo.group[oTileInfo.type === "tiles" ? "links" : "tiles"].push(oTile);
            }

            this.oModel.setProperty("/groups/" + oDstInfo.groupIndex , oDstInfo.group);
            this.oModel.setProperty("/groups/" + oSourceInfo.groupIndex , oSourceInfo.group);

            //handle animation
            if (oTileInfo.type === "links") {
                this._handleTileAppearanceAnimation(oTile.content[0].getParent());
            } else {
                this._handleTileAppearanceAnimation(oTile.content[0]);
            }

            if (oldViewContent && oldViewContent[0]) {
                oldViewContent[0].destroy();
            }
        },
        /*
        * sType: the type of the tile(lineMode/ContentMode) befor the convert action
        */
        _getIndexForConvert: function (sType, curTileIndex, newTileIndexInShellModel, oGroup, oDstGroup) {
            var nNewTileIndex;
            if (sType === "tiles") {
                //If we convert ContentMode-tile to link then we want to enter the new link to the end of the array or to provided newTileIndex
                if (newTileIndexInShellModel !== undefined) {
                  nNewTileIndex = oDstGroup[sType].length + newTileIndexInShellModel;
                } else {
                  nNewTileIndex = oDstGroup[sType].length + oDstGroup["links"].length;
                }
                if (oGroup.groupId === oDstGroup.groupId) {
                    nNewTileIndex--;
                }
            } else {
                //If we convert link to ContentMode-tile then we want to enter the new tile after the the last ContentMode-tile
                nNewTileIndex = newTileIndexInShellModel ? newTileIndexInShellModel : oGroup['tiles'].length;
                curTileIndex += oGroup["tiles"].length;
            }
            return {"tileIndex": curTileIndex, "newTileIndex": nNewTileIndex};
        },
        _getIndexForMove: function (sType, curTileIndex, newTileIndexInShellModel, oDstGroup, oSourceGroup) {
          var nNewTileIndex;
          if (sType === "tiles") {
              //case move tile
              nNewTileIndex = newTileIndexInShellModel !== undefined ? newTileIndexInShellModel : oDstGroup[sType].length;
          } else {
              //case move link
              if (newTileIndexInShellModel !== undefined) {
                nNewTileIndex = oDstGroup["tiles"].length + newTileIndexInShellModel;
              } else {
                nNewTileIndex = oDstGroup["tiles"].length + oDstGroup["links"].length;
              }
              curTileIndex +=  oSourceGroup["tiles"].length;
          }
          return {"tileIndex": curTileIndex, "newTileIndex": nNewTileIndex};
        },

        _moveLink: function (sChannelId, sEventId, oData) {
            this._moveTile(sChannelId, sEventId, oData);
        },

        _getTileInfo: function (aGroups, sTileId, sItems) {
            var oTileInfo;
            jQuery.each(aGroups, function (nTmpGroupIndex, oTmpGroup) {
                var bFoundFlag = false;
                jQuery.each(oTmpGroup[sItems], function (nTmpTileIndex, oTmpTile) {
                    if (oTmpTile.uuid === sTileId) {
                        //the order is oTile, nTileIndex, oOldGroup, nOldGroupIndex
                        oTileInfo = {"oTile": oTmpTile, "tileIndex": nTmpTileIndex, "oGroup": oTmpGroup, "groupIndex": nTmpGroupIndex};
                        bFoundFlag = true;
                        return false;
                    }
                });
                return !bFoundFlag;
            });
            return oTileInfo;
        },

        _getNewGroupInfo: function (aGroups, sNewGroupId) {//should be concidered to improve by inserting the logic into _getTileInfo function
            var oNewGroupInfo;
            jQuery.each(aGroups, function (nTmpGroupIndex, oTmpGroup) {
                if (oTmpGroup.groupId === sNewGroupId) {
                    //order is oNewGroup, nNewGroupIndex
                    oNewGroupInfo = {"oNewGroup" : oTmpGroup, "newGroupIndex": nTmpGroupIndex};
                }
            });
            return oNewGroupInfo;
        },


         /*
          * oData should have the following parameters:
          * fromGroupId
          * toGroupId
          * fromIndex
          * toIndex can be null => append as last tile in group
          */
         _moveTile: function (sChannelId, sEventId, oData) {
             var nNewIndex = oData.toIndex,
                 sNewGroupId = oData.toGroupId,
                 sTileId = oData.sTileId,
                 sSource = oData.source,
                 sType = oData.sTileType === "tiles" || oData.sTileType === "tile" ? "tile" : "link",
                 sToItems = oData.sToItems,
                 sFromItems = oData.sFromItems,
                 srvc = sap.ushell.Container.getService("LaunchPage"),
                 bActionMode = this.oModel.getProperty("/tileActionModeActive"),
                 aGroups = this.oModel.getProperty("/groups"),
                 oSourceGroup,
                 oTargetGroup,
                 oResultPromise,
                 personalization,
                 oTileInfo,
                 oGroupInfo,
                 oIndexInfo = {};

             oTileInfo = this._getTileInfo(aGroups, sTileId, sFromItems);
             oGroupInfo = this._getNewGroupInfo(aGroups, sNewGroupId);

             //When moving a tile to the group it is already in using the move dialog, there is no change
             if (oTileInfo.oGroup.groupId == oGroupInfo.oNewGroup.groupId && (sSource === "movetileDialog" || nNewIndex === null || sSource === "movelinkDialog")) {
                 return;
             }
             if (sType === "link") {
                 oTileInfo.oTile.content[0].addStyleClass("sapUshellZeroOpacity");
             }

             // When a tile is dragged into an empty group, the Plus-Tiles in the empty list cause
             // the new index to be off by one, i.e. 1 instead of 0, which causes an error.
             // This is a generic check which sanitizes the values if necessary.
             if (sType === "tile" && sToItems === 'tiles') {
                 if (nNewIndex && nNewIndex > oGroupInfo.oNewGroup[sToItems].length) {
                     nNewIndex = oGroupInfo.oNewGroup[sToItems].length;
                 }
             }
             if (oTileInfo.oGroup.groupId === sNewGroupId && sToItems === sFromItems) {
                 if (nNewIndex === null || nNewIndex === undefined) {
                     // moved over group list to same group
                     oTileInfo.oGroup[sToItems].splice(oTileInfo.tileIndex, 1);
                     // Tile is appended. Set index accordingly.
                     nNewIndex = oTileInfo.oGroup[sToItems].length;
                     // append as last item
                     oTileInfo.oGroup[sToItems].push(oTileInfo.oTile);
                 } else {
                     nNewIndex = this._adjustTileIndex(nNewIndex, oTileInfo.oTile, oTileInfo.oGroup, sToItems);
                     this._moveInArray(oTileInfo.oGroup[sToItems], oTileInfo.tileIndex, nNewIndex);
                 }

                 this.oModel.setProperty("/groups/" + oTileInfo.groupIndex + "/" + sToItems, oTileInfo.oGroup[sToItems]);
             } else {
                 // remove from old group
                 personalization = this.oModel.getProperty("/personalization");
                 oTileInfo.oGroup[sFromItems].splice(oTileInfo.tileIndex, 1);
                 oTileInfo.oGroup.visibilityModes = sap.ushell.utils.calcVisibilityModes(oTileInfo.oGroup, personalization);
                 this.oModel.setProperty("/groups/" + oTileInfo.groupIndex + "/" + sFromItems, oTileInfo.oGroup[sFromItems]);

                 // add to new group
                 if (nNewIndex === null || nNewIndex === undefined) {
                     // Tile is appended. Set index accordingly.
                     nNewIndex = oGroupInfo.oNewGroup[sToItems].length;
                     // append as last item
                     oGroupInfo.oNewGroup[sToItems].push(oTileInfo.oTile);
                 } else {
                     nNewIndex = this._adjustTileIndex(nNewIndex, oTileInfo.oTile, oGroupInfo.oNewGroup, sToItems);
                     oGroupInfo.oNewGroup[sToItems].splice(nNewIndex, 0, oTileInfo.oTile);
                 }
                 oGroupInfo.oNewGroup.visibilityModes = sap.ushell.utils.calcVisibilityModes(oGroupInfo.oNewGroup, personalization);
                 this.oModel.setProperty("/groups/" + oGroupInfo.newGroupIndex + "/" + sToItems, oGroupInfo.oNewGroup[sToItems]);
             }

             //recalculate the associated groups for catalog tiles
             this.updateTilesAssociation();
             // Re-calculate the visibility of the Tiles
             sap.ushell.utils.handleTilesVisibility();


             // change in backend
             oSourceGroup = this.oModel.getProperty("/groups/" + oTileInfo.groupIndex);
             oTargetGroup = this.oModel.getProperty("/groups/" + oGroupInfo.newGroupIndex);
             oIndexInfo =  this._getIndexForMove(sFromItems, oTileInfo.tileIndex, nNewIndex, oGroupInfo.oNewGroup, oSourceGroup);

             this._addRequest($.proxy(function () {
                 try {
                     oResultPromise = this.oPageBuilderService.moveTile(oTileInfo.oTile.object, oIndexInfo.tileIndex, oIndexInfo.newTileIndex, oSourceGroup.object, oTargetGroup.object, sType);
                 } catch (err) {
                     this._resetGroupsOnFailure("fail_to_move_tile_msg");
                     return;
                 }

                 // Putting a special flag on the Tile's object
                 // this enables us to disable opening the tile's action until it has been updated from the backend
                 // (see in DashboardContent.view
                 oTileInfo.oTile.tileIsBeingMoved = true;

                 oResultPromise.done(this._handleAfterSortable($.proxy(function (sTileId, oTargetTile) {
                     var sTilePath,
                         aUsageAnalyticsCustomProps = [
                             srvc.getTileTitle(oTileInfo.oTile.object),
                             srvc.getGroupTitle(oSourceGroup.object),
                             srvc.getGroupTitle(oTargetGroup.object),
                             sTileId];

                     sap.ushell.Container.getService("UsageAnalytics").logCustomEvent(
                         this.analyticsConstants.PERSONALIZATION,
                         this.analyticsConstants.MOVE_TILE,
                         aUsageAnalyticsCustomProps
                     );
                     sTilePath = this._getPathOfTile(sTileId);

                     // If we cannot find the tile, it might have been deleted -> Check!
                     if (sTilePath) {
                         // Update the model with the new tile object and new Id.
                         this.oModel.setProperty(sTilePath + "/object", oTargetTile);
                         this.oModel.setProperty(sTilePath + "/originalTileId", this.oPageBuilderService.getTileId(oTargetTile));

                         this._checkRequestQueue();
                         // get the target-tile view and align the Model for consistency
                         this.oPageBuilderService.getTileView(oTargetTile).done(function (oView) {
                             // get the old view from tile's model
                             var oldViewContent = this.oModel.getProperty(sTilePath + "/content");

                             // first we set new view
                             if (sToItems === 'links') {
                                 this._changeLinkScope(oView, bActionMode ? "Actions" : "Display");
                                 this._attachLinkPressHandlers(oView);
                                 this._addDraggableAttribute(oView);
                                 this._handleTileAppearanceAnimation(oView);
                                 oTileInfo.oTile.content = [oView];
                                 this.oModel.setProperty(sTilePath, jQuery.extend({}, oTileInfo.oTile));
                                 this.oModel.setProperty("/groups/" + oGroupInfo.newGroupIndex + "/" + sToItems, this.oModel.getProperty("/groups/" + oGroupInfo.newGroupIndex + "/" + sToItems));
                             } else {
                                 this.oModel.setProperty(sTilePath + "/content", [oView]);
                             }

                             //now we destroy the old view
                             if (oldViewContent && oldViewContent[0]) {
                                var origOnAfterRendering = oView.onAfterRendering;
                                oView.onAfterRendering = function () {
                                    origOnAfterRendering.apply(this);
                                    oldViewContent[0].destroy();
                                    oView.onAfterRendering = origOnAfterRendering;
                                }
                             }
                             // reset the move-scenario flag
                             this.oModel.setProperty(sTilePath + "/tileIsBeingMoved", false);
                             if (oData.callBack) {
                               oData.callBack(oView);
                             }
                         }.bind(this));
                     }
                 }, this, sTileId)));

                 oResultPromise.fail(this._handleAfterSortable(this._resetGroupsOnFailureHelper("fail_to_move_tile_msg")));
             }, this));
         },

        // Adjust the moved-tile new index according to the visible+hidden tiles
        _adjustTileIndex: function (newLocationIndex, oTile, newGroup, sItems) {
            var visibleCounter = 0,
                bIsTileIncluded = false,
                i = 0;
            // In order to get the new index, count all tiles (visible+hidden) up to the new index received from the UI.
            for (i = 0; i < newGroup[sItems].length && visibleCounter < newLocationIndex; i++) {
                if (newGroup[sItems][i].isTileIntentSupported) {
                    if (newGroup[sItems][i] === oTile) {
                        bIsTileIncluded = true;
                    } else {
                        visibleCounter++;
                    }
                }
            }
            if (bIsTileIncluded) {
                return i - 1;
            }
            return i;
        },

        // temporary - should not be exposed
        getModel: function () {
            return this.oModel;
        },

        getDashboardView: function () {
            return this.oDashboardView;
        },

        updateTilesAssociation: function () {
            this.mapCatalogTilesToGroups();
            // update the catalogTile model after mapCatalogTilesToGroups() was called
            this.updateCatalogTilesToGroupsMap();
        },
        // CATALOG LOADING
        loadAllCatalogs: function (sChannelId, sEventId, oData) {
            var oGroupsPromise = new jQuery.Deferred(),
                that = this,
                setDoneCBForGroups;

            // automatically resolving the group's promise for the scenario where the groups are
            // already loaded (so the group's promise Done callback will execute automatically is such a case)
            oGroupsPromise.resolve();

            // this is a local function (which could be invoked at 2 pointsin thie method).
            // this sets a Done callback on the promise object of the groups.
            setDoneCBForGroups = function () {
                oGroupsPromise.done(function () {
                    var aGroups = that.getModel().getProperty("/groups");
                    if (aGroups && aGroups.length !== 0) {
                        that.updateTilesAssociation();
                    }
                });
            };

            if (!this.oModel.getProperty("/catalogs")) {

                // catalog also needs groups
                if (!this.oModel.getProperty("/groups") || this.oModel.getProperty("/groups").length === 0) {
                    oGroupsPromise = this.loadPersonalizedGroups();
                }
                this._destroyAllGroupModels("/catalogs");
                this._destroyAllTileModels("/catalogTiles");
                // Clear existing Catalog items
                this.oModel.setProperty("/catalogs", []);
                this.oModel.setProperty("/catalogSearchEntity", {
                    appBoxes: [],
                    customTiles: []
                });

                // Array of promise objects that are generated inside addCatalogToModel (the "progress" function of getCatalogs)
                this.aPromises = [];

                jQuery.sap.measure.start("FLP:DashboardManager.GetCatalogsRequest", "GetCatalogsRequest","FLP");

                jQuery.sap.measure.start("FLP:DashboardManager.getCatalogTiles", "getCatalogTiles","FLP");
                jQuery.sap.measure.pause("FLP:DashboardManager.getCatalogTiles");

                jQuery.sap.measure.start("FLP:DashboardManager.BuildCatalogModelWithRendering", "BuildCatalogModelWithRendering","FLP");
                jQuery.sap.measure.pause("FLP:DashboardManager.BuildCatalogModelWithRendering");

                // Trigger loading of catalogs
                sap.ushell.Container.getService("LaunchPage").getCatalogs()
                // There's a need to make sure that onDoneLoadingCatalogs is called only after all catalogs are loaded
                // (i.e. all calls to addCatalogToModel are finished).
                // For this, all the promise objects that are generated inside addCatalogToModel are generated into this.aPromises,
                // and jQuery.when calls onDoneLoadingCatalogs only after all the promises are resolved
                    .done(function (catalogs) {
                        jQuery.sap.measure.end("FLP:DashboardManager.GetCatalogsRequest");
                        jQuery.sap.measure.end("FLP:DashboardManager.getCatalogTiles");

                        jQuery.when.apply(jQuery, this.aPromises).then(function () {
                            that.onDoneLoadingCatalogs(catalogs);
                        });
                        setDoneCBForGroups();
                    }.bind(this))
                    //in case of a severe error, show an error message
                    .fail(that._showLocalizedErrorHelper("fail_to_load_catalog_msg"))
                    //for each loaded catalog, add it to the model
                    .progress(this.addCatalogToModel.bind(this));
            } else {

                // when groups are loaded we can map the catalog tiles <-> groups map
                setDoneCBForGroups();
            }
        },


        updateCatalogTilesToGroupsMap: function () {
            var aCatalog = this.getModel().getProperty("/catalogs"),
                index,
                tileId,
                associatedGrps,
                aGroups,
                aCatalogCustom,
                aCatalogAppboxes,
                aCatalogCustomIndex,
                aCatalogAppboxesIndex,
                oAppBoxTile,
                oCustomTile,
            srvc = sap.ushell.Container.getService("LaunchPage");
            // if the catalogTile model doesn't exist, it will be updated in some time later
            if (aCatalog) {
                for (index = 0; index < aCatalog.length; index++) {
                    aCatalogAppboxes = aCatalog[index].appBoxes;

                    if (aCatalogAppboxes) {
                        //Iterate over all the appBoxes.
                        for (aCatalogAppboxesIndex = 0; aCatalogAppboxesIndex < aCatalogAppboxes.length; aCatalogAppboxesIndex++) {
                            oAppBoxTile = aCatalogAppboxes[aCatalogAppboxesIndex];
                            tileId = encodeURIComponent(srvc.getCatalogTileId(oAppBoxTile.src));
                            //Get the mapping of the associated groups map.
                            aGroups = this.oTileCatalogToGroupsMap[tileId];
                            associatedGrps = aGroups ? aGroups : [];
                            oAppBoxTile.associatedGroups = associatedGrps;
                        }
                    }

                    aCatalogCustom = aCatalog[index].customTiles;

                    if (aCatalogCustom) {
                        //Iterate over all the appBoxes.
                        for (aCatalogCustomIndex = 0; aCatalogCustomIndex < aCatalogCustom.length; aCatalogCustomIndex++) {
                            oCustomTile = aCatalogCustom[aCatalogCustomIndex];
                            tileId = encodeURIComponent(srvc.getCatalogTileId(oCustomTile.src));
                            //Get the mapping of the associated groups map.
                            aGroups = this.oTileCatalogToGroupsMap[tileId];
                            associatedGrps = aGroups ? aGroups : [];
                            oCustomTile.associatedGroups = associatedGrps;
                        }
                    }
                }
            }
            this.getModel().setProperty("/catalogs", aCatalog);
        },


        _getIsIntentSupported: function (oCatalogTile) {
            var srvc = sap.ushell.Container.getService("LaunchPage"),
                bIsIntentSupported = !!(srvc.isTileIntentSupported(oCatalogTile));
            return bIsIntentSupported;

        },


        _getIsAppBox: function (oCatalogTile) {
            if(!sap.ushell.Container){
                return false;
            }
            var srvc = sap.ushell.Container.getService("LaunchPage"),
                bIsAppBox = !!(srvc.getCatalogTileTargetURL(oCatalogTile) && (srvc.getCatalogTilePreviewTitle(oCatalogTile) || srvc.getCatalogTilePreviewSubtitle(oCatalogTile)));
            return bIsAppBox;

        },

        createCatalogAppBoxes: function (oCatalogTile,bGetTileKeyWords) {
            var srvc = sap.ushell.Container.getService("LaunchPage"),
                catalogTileId = encodeURIComponent(srvc.getCatalogTileId(oCatalogTile)),
                associatedGrps = this.oTileCatalogToGroupsMap[catalogTileId] || [],
                tileTags = srvc.getCatalogTileTags(oCatalogTile) || [];

            if (tileTags.length > 0) {
                this.tagsPool = this.tagsPool.concat(tileTags);
            }
            var sNavigationMode = undefined; //defualt value
            if(oCatalogTile.tileResolutionResult){
                sNavigationMode = oCatalogTile.tileResolutionResult.navigationMode;
            }

            return {
                id: catalogTileId,
                associatedGroups: associatedGrps,
                src: oCatalogTile,
                title: srvc.getCatalogTilePreviewTitle(oCatalogTile),
                subtitle: srvc.getCatalogTilePreviewSubtitle(oCatalogTile),
                icon: srvc.getCatalogTilePreviewIcon(oCatalogTile),
                keywords: bGetTileKeyWords ? (srvc.getCatalogTileKeywords(oCatalogTile) || []).join(',') : [],
                tags: tileTags,
                navigationMode: sNavigationMode,
                url: srvc.getCatalogTileTargetURL(oCatalogTile)
            };
        },

        /**
         * Adds a catalog object to the model including the catalog tiles.
         * The catalog is added to the "/catalogs" array in the model, and the tiles are added to "/catalogTiles".
         * If a catalog with the same title already exists - no new entry is added to the model for the new catalog,
         *  and the tiles are added to "/catalogTiles" with indexes that place them under the catalog (with the same title) that already exists
         *
         *  @param {object} catalog
         */

        /**TODOs: We want to remove the catalogTiles.
         *
         * Align to the Data structure according to the wiki.
         * I have updated it abit.
         *
         * catalogs : [
         catalog: {
                    title: srvc.getCatalogTitle(oCatalog),
                    id: srvc.getCatalogId(oCatalog),
                    numIntentSupportedTiles: 0,
                    "static": false,
                    customTiles: [
                        the notmal tile model.
                    ],
                    appBoxes: [
                        {
                            title: ,
                            subtitle: ,
                            icon: ,
                            url: ,
                            catalogIndex:
                        }
                    ],
                    numberOfCustomTiles: 0,
                    numberOfAppBoxs: 0
                }
         ]

         Also We can simplify TileContainer to support Flat List. with no headers.
         TileContainer to support one level indexing visible (true / false).
         */

        addCatalogToModel: function (oCatalog) {
            var srvc = sap.ushell.Container.getService("LaunchPage"),
                oCatalogModel = {
                    title: srvc.getCatalogTitle(oCatalog),
                    id: srvc.getCatalogId(oCatalog),
                    numberTilesSupportedOnCurrectDevice: 0,
                    static: false,
                    customTiles: [],
                    appBoxes: []
                },
                oPromise;

            jQuery.sap.measure.resume("FLP:DashboardManager.getCatalogTiles");

            oPromise = srvc.getCatalogTiles(oCatalog);
            this.aPromises.push(oPromise);

            oPromise.done(function (oCatalogEntry) {
                jQuery.sap.measure.pause("FLP:DashboardManager.getCatalogTiles");

                //if this catalog has no tiles we do not need to add it to the model
                    if (!oCatalogEntry.length) {
                        return;
                    }
                    this.aPendingCatalogQueue.push({
                        oCatalogEntry: oCatalogEntry,
                        oCatalogModel: oCatalogModel
                    });

                    // Check if another catalog is currently being put in the model, allow max of 10 skipped catalog processing.
                    if (this.skippedProcessCatalogs < 10) {
                        clearTimeout(this.oprocessCatalogsTimer);
                        this.skippedProcessCatalogs++;
                        this.oprocessCatalogsTimer = setTimeout(function () {
                            this.processPendingCatalogs();
                            if (this.oModel.getProperty("/tagFiltering") === true) {
                                this.getTagList();
                            }
                        }.bind(this), 20);
                    }
                }.bind(this)
            ).fail(this._showLocalizedErrorHelper("fail_to_load_catalog_tiles_msg")
            );
        },
        loadCustomTilesKeyWords: function () {
          var fn;
          if (this.aFnToGetTileView) {
            while (this.aFnToGetTileView.length > 0) {
              fn = this.aFnToGetTileView.pop();
              fn();
            }
          }
        },
        processPendingCatalogs: function () {
            var that = this,
                aCurrentCatalogs = this.oModel.getProperty('/catalogs'),
                oPendingCatalogEntry,
                oCatalogEntry,
                oCatalogModel,
                oExistingCatalogInModel,
                bIsNewCatalog,
                oCatalogSearchObject,
                oCatalogObject,
                oCatalogTileNew,
                oEventBus = sap.ui.getCore().getEventBus(),
                oAppBoxNew,
                aAllEntryInCatalogMaster = this.oModel.getProperty('/masterCatalogs') || [{
                    title: getLocalizedText("all")
                }];
            jQuery.sap.measure.resume("FLP:DashboardManager.BuildCatalogModelWithRendering");

            //reset skippedProcessCatalogs counter
            this.skippedProcessCatalogs = 0;
            // Check if a catalog with the given title already exists in the model.
            while (this.aPendingCatalogQueue.length > 0) {
                    oPendingCatalogEntry = this.aPendingCatalogQueue.shift(),
                    oCatalogEntry = oPendingCatalogEntry.oCatalogEntry,
                    oCatalogModel = oPendingCatalogEntry.oCatalogModel,
                    oExistingCatalogInModel = this.searchModelCatalogByTitle(oCatalogModel.title),
                    oCatalogSearchObject = this.oModel.getProperty('/catalogSearchEntity');

                if (oExistingCatalogInModel.result) {
                    oCatalogObject = this.oModel.getProperty('/catalogs')[oExistingCatalogInModel.indexOfPreviousInstanceInModel];
                    bIsNewCatalog = false;
                } else {
                    bIsNewCatalog = true;
                    oCatalogObject = oCatalogModel;
                }

                oCatalogEntry.forEach(function (oCatalogEntry, iCatalogEntryIndex) {
                    //Do not add Item if no intent supported
                    if (this._getIsIntentSupported(oCatalogEntry)) {
                        if (this._getIsAppBox(oCatalogEntry)) {
                            oAppBoxNew = this.createCatalogAppBoxes(oCatalogEntry,true);
                            oCatalogObject.appBoxes.push(oAppBoxNew);
                            oCatalogSearchObject.appBoxes.push(oAppBoxNew);
                        } else {
                            oCatalogTileNew = this.createCatalogTiles(oCatalogEntry);
                            oCatalogObject.customTiles.push(oCatalogTileNew);
                            //add the getTileView to an array of functions that will be executed once the caatalog finishs to load
                            //we need this array in order to call geTileView for all customTiles. see incident: ******
                            if (!this.aFnToGetTileView) {
                              this.aFnToGetTileView = [];
                            }

                            this.aFnToGetTileView.push((function (oCatalogEntry) {
                              return function () {
                                var oCatalogTileNew = that.createCatalogTiles(oCatalogEntry, true);
                                oCatalogSearchObject.customTiles.push(oCatalogTileNew);
                              };
                            })(oCatalogEntry));
                          }
                    }
                }.bind(this));

                //Update model just if catalog has tiles or appbox.
                if (oCatalogObject.appBoxes.length > 0 || oCatalogObject.customTiles.length > 0) {
                    if (bIsNewCatalog) {
                        aCurrentCatalogs.push(oCatalogModel);
                        aAllEntryInCatalogMaster.push({
                            title: oCatalogModel.title
                        });

                    }
                }
            }

            //this.oModel.setProperty('/catalogSearchEntity', oCatalogSearchObject);
            this.oModel.setProperty('/masterCatalogs', aAllEntryInCatalogMaster);
            this.oModel.setProperty('/catalogs', aCurrentCatalogs);
            oEventBus.publish("launchpad", "afterCatalogSegment");

            jQuery.sap.measure.pause("FLP:DashboardManager.BuildCatalogModelWithRendering");

        },

            /**
         * check if a catalog with the given title already exists in the model.
         *
         *  @param {string} catalogTitle
         *
         *  @returns {object} - an object that includes:
         *  - result - a boolean value indicating whether the model already includes a catalog with the same title
         *  - indexOfPreviousInstanceInModel - the index in the model (in /catalogs) of the existing catalog with the given title
         *  - indexOfPreviousInstanceInPage - the index in the page of the existing  catalog with the given title,
         *     this value usually equals (indexOfPreviousInstanceInModel-1) since the model includes the dummy-catalog "All Cataslogs"
         *     that doesn't appear in the page
         *  - numOfTilesInCatalog - the number of tiles in the catalog with the given title
         */
        searchModelCatalogByTitle: function (catalogTitle) {
            var catalogs = this.oModel.getProperty('/catalogs'),
                catalogTitleExists = false,
                indexOfPreviousInstance,
                numOfTilesInCatalog = 0,
                bGeneralCatalogAppeared = false;

            $.each(catalogs, function (index, tempCatalog) {
                // If this is the catalogsLoading catalog - remember that it was read since the found index should be reduced by 1
                if (tempCatalog.title === sap.ushell.resources.i18n.getText('catalogsLoading')) {
                    bGeneralCatalogAppeared = true;
                } else if (catalogTitle == tempCatalog.title) {
                    indexOfPreviousInstance = index;
                    numOfTilesInCatalog = tempCatalog.numberOfTiles;
                    catalogTitleExists = true;
                    return false;
                }
            });
            return {
                result: catalogTitleExists,
                indexOfPreviousInstanceInModel: indexOfPreviousInstance,
                indexOfPreviousInstanceInPage: bGeneralCatalogAppeared ? indexOfPreviousInstance - 1 : indexOfPreviousInstance,
                numOfTilesInCatalog: numOfTilesInCatalog
            };
        },

        getTagList: function (maxTags) {
            var indexedTags = {},
                ind = 0,
                tempTagsLst = [],
                tag,
                oTag,
                sorted;

            if (this.oModel.getProperty("/tagList") && this.oModel.getProperty("/tagList").length > 0) {
                this.tagsPool.concat(this.oModel.getProperty("/tagList"))
            }

            for (ind = 0; ind < this.tagsPool.length; ind++) {
                oTag = this.tagsPool[ind];
                if (indexedTags[oTag]) {
                    indexedTags[oTag]++;
                } else {
                    indexedTags[oTag] = 1;
                }
            }

            //find the place in the sortedTopTiles.
            for (tag in indexedTags) {
                tempTagsLst.push({tag: tag, occ: indexedTags[tag]});
            }

            sorted = tempTagsLst.sort(function (a, b) {
                return b.occ - a.occ;
            });

            if (maxTags) {
                this.oModel.setProperty("/tagList", sorted.slice(0, maxTags));
            } else {
                this.oModel.setProperty("/tagList", sorted);
            }
        },

        onDoneLoadingCatalogs: function (aCatalogs) {
            if (!aCatalogs.length) {
                this.oModel.setProperty("/catalogsNoDataText", sap.ushell.resources.i18n.getText('noCatalogs'));
            }

            //Publish event catalog finished loading.
            var oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.publish("launchpad", "catalogContentLoaded");

            var srvc = sap.ushell.Container.getService("LaunchPage"),
                aLoadedCatalogs = aCatalogs.filter(function (oCatalog) {
                    var sCatalogError = srvc.getCatalogError(oCatalog);
                    if (sCatalogError) {
                        jQuery.sap.log.error(
                            "A catalog could not be loaded",
                            sCatalogError,
                            "sap.ushell.components.flp.launchpad.DashboardManager"
                        );
                    }
                    return !sCatalogError;
                });
                //aCurrentCatalogs;
            //check if some of the catalogs failed to load
            if (aLoadedCatalogs.length !== aCatalogs.length) {
                this._showLocalizedError("partialCatalogFail");
            }

            /*            aCurrentCatalogs = this.oModel.getProperty('/catalogs');
             //filter out the "Loading Catalogs..." menu item if exists
             if (aCurrentCatalogs[0] && aCurrentCatalogs[0].title === sap.ushell.resources.i18n.getText('catalogsLoading')) {
             aCurrentCatalogs.splice(0, 1);
             }
             /*            //create the "All" static entry for the catalogSelect menu
             aCurrentCatalogs.splice(0, 0, {
             title: getLocalizedText("catalogSelect_initial_selection"),
             "static": true,
             tiles: [],
             numIntentSupportedTiles: -1//only in order to present this option in the Catalog.view (dropdown menu)since there is a filter there on this property
             });
             this.oModel.setProperty('/catalogs', aCurrentCatalogs);*/
            sap.ushell.utils.handleTilesVisibility();
        },

        createCatalogTiles: function (oCatalogTile, bGetTileKeyWords) {
            var srvc = sap.ushell.Container.getService("LaunchPage"),
                tileView,
                catalogTileId = encodeURIComponent(srvc.getCatalogTileId(oCatalogTile)),
                associatedGrps = this.oTileCatalogToGroupsMap[catalogTileId] || [],
                tileTags = srvc.getCatalogTileTags(oCatalogTile) || [];

            if (tileTags.length > 0) {
                this.tagsPool = this.tagsPool.concat(tileTags);
            }

            tileView = new TileState({state: "Loading"});
            if (bGetTileKeyWords) {
              srvc.getCatalogTileView(oCatalogTile);
            }
            return {
                associatedGroups: associatedGrps,
                src: oCatalogTile,
                catalog: oCatalogTile.title,
                catalogId: oCatalogTile.id,
                title: srvc.getCatalogTileTitle(oCatalogTile),
                tags: tileTags,
                keywords: bGetTileKeyWords ? (srvc.getCatalogTileKeywords(oCatalogTile) || []).join(',') : [],
                id: catalogTileId,
                size: srvc.getCatalogTileSize(oCatalogTile),
                content: [tileView],
                isTileIntentSupported: srvc.isTileIntentSupported(oCatalogTile),
                tileType: oCatalogTile.tileType
            };
        },

        /**
         * Calculate the index of a catalog tile in the catalog page.
         *  @param the index of the catalog
         *  @param the number of catalog tiles that were already loaded for previous catalog/s with the same title
         *  @param the index of the current catalog tile in the containing catalog
         */
        calculateCatalogTileIndex : function (catalogIndex, numberOfExistingTiles, iTile) {
            var result = parseInt(catalogIndex * 100000, 10);
            result += (numberOfExistingTiles !== undefined ? numberOfExistingTiles : 0) +  iTile;
            return result;
        },

        mapCatalogTilesToGroups: function () {

            this.oTileCatalogToGroupsMap = {};

            //Calculate the relation between the CatalogTile and the instances.
            var oGroups = this.oModel.getProperty("/groups"),
                srvc = sap.ushell.Container.getService("LaunchPage"),
                indexGrps = 0,
                oGroup,
                tileInd,
                oTiles,
                tileId,
                tileGroups,
                groupId;

            for (indexGrps = 0; indexGrps < oGroups.length; indexGrps++) {
                oGroup = oGroups[indexGrps];
                oTiles = oGroup.tiles;
                if (oTiles) {
                    for (tileInd = 0; tileInd < oTiles.length; ++tileInd) {
                        tileId = encodeURIComponent(srvc.getCatalogTileId(oTiles[tileInd].object));
                        tileGroups = this.oTileCatalogToGroupsMap[tileId] || [];
                        groupId = srvc.getGroupId(oGroup.object);
                        // We make sure the group is visible and not locked, otherwise we should not put it in the map it fills.
                        if (tileGroups.indexOf(groupId) === -1 && (typeof (oGroup.isGroupVisible) === 'undefined' || oGroup.isGroupVisible) && !oGroup.isGroupLocked) {
                            tileGroups.push(groupId);
                        }
                        this.oTileCatalogToGroupsMap[tileId] = tileGroups;
                    }
                }
            }
        },

        /**
         * Shows a localized message in the Message-Toast.
         * @param {string} sMsgId
         *      The localization id of the message
         * @param {object} oParams
         *      Additional parameters for the Message Toast showing the message. Can be undefined.
         * @param {sap.ushell.services.Message.Type} [iType=sap.ushell.services.Message.Type.INFO]
         *      The message type (optional)
         */
        _showLocalizedMessage: function (sMsgId, oParams, iType) {
            sap.ushell.Container.getService("Message").show(iType || Message.Type.INFO, getLocalizedText(sMsgId, oParams), oParams);
        },
        /**
         * Shows a localized error message in the Message-Toast.
         * @param {string} sMsgId
         *      The localization id of the message
         * @param {object} oParams
         *      Additional parameters for the Message Toast showing the message. Can be undefined.
         *
         */
        _showLocalizedError: function (sMsgId, oParams) {
            this._showLocalizedMessage(sMsgId, oParams, Message.Type.ERROR);
        },

        /**
         * A wrapper for _showLocalizedError to reduce boilerplate code in error handling.
         * @param {string} sMsgId
         *      The localization id of the message
         * @param {object} oParams
         *      Additional parameters for the Message Toast showing the message. Can be undefined.
         * @returns {Function}
         *      A function that will call _showLocalizedError with the given parameters.
         */
        _showLocalizedErrorHelper: function (sMsgId, oParams) {
            var that = this;
            return function () {
                that._showLocalizedError(sMsgId, oParams);
            };
        },

        /**
         * Helper function to bind an error message to a reset-function, which reloads all groups
         * from a group array when called.
         * @param {string} sMsgId
         *      The id of the localized string.
         * @returns {Function}
         *      The reset function, which returns the dashboard into an consistent state.
         */
        _resetGroupsOnFailureHelper: function (sMsgId) {
            var that = this;
            return function (aGroups) {
                that._showLocalizedError(sMsgId);
                that._requestFailed();

                // Give the Toast a chance to be shown before the reload freezes the screen.
                setTimeout(function () {
                    that.loadGroupsFromArray(aGroups);
                });
            };
        },

        /**
         * Helper function to reset groups after a backend failure.
         * @param {string} sMsgId
         *      The id of the localized string.
         */
        _resetGroupsOnFailure: function (sMsgId, aParameters) {
            this._requestFailed();
            this._showLocalizedError(sMsgId, aParameters);
            this.loadPersonalizedGroups();
            this.oModel.updateBindings(true);
        },

        resetGroupsOnFailure: function () {
            this._resetGroupsOnFailure.apply(this, arguments);
        },

        _bindSegment: function (aGroups, segment) {
            var segIndex, oGrp, oSegGroup, groupIndex;

            for (segIndex = 0; segIndex < segment.length; segIndex++) {
                oSegGroup = segment[segIndex];
                groupIndex = oSegGroup.index;
                oGrp = aGroups[groupIndex];
                if (oGrp) {
                    oGrp.isRendered = true;
                    oGrp.tiles = oGrp.tiles.concat(oSegGroup.tiles);
                    oGrp.links = oGrp.links.concat(oSegGroup.links);                }
            }

            return aGroups;
        },

        createGroupsModelFrame: function (aGroups, personalization) {
            var grpsIndex,
                aCloneGroups = [],
                oOrgGroup,
                fnCreateFlatGroupClone;

            fnCreateFlatGroupClone = function (oGroup) {
                var clnGroup = jQuery.extend({}, oGroup);
                clnGroup.tiles = [];
                clnGroup.pendingLinks = [];
                clnGroup.links = [];
                return clnGroup;
            };

            for (grpsIndex = 0; grpsIndex < aGroups.length; grpsIndex++) {
                oOrgGroup = aGroups[grpsIndex];
                aCloneGroups[grpsIndex] = fnCreateFlatGroupClone(oOrgGroup);
                //group variable setup.
                aCloneGroups[grpsIndex].isRendered = false;
                aCloneGroups[grpsIndex].visibilityModes = sap.ushell.utils.calcVisibilityModes(oOrgGroup, personalization);
            }

            return aCloneGroups;
        },

        _splitGroups: function (segmentSize, aGroups, iFirstSegmentSize) {
            //segmentsStore
            var grpsIndex, tileIndex,
                allocatedBU = segmentSize,
                pendingBU = iFirstSegmentSize,
                tempSegment = [],
                tempGroup,
                splitObjectIndex,
                splitObject,
                splitObjects = ["tiles", "pendingLinks"],
                objectBUCost = 1,
                fnCreateFlatGroupClone,
                bIsTabsMode = (this.oModel.getProperty("/homePageGroupDisplay") && this.oModel.getProperty("/homePageGroupDisplay") === 'tabs'),
                grp;

            fnCreateFlatGroupClone = function (oGroup) {
                var clnGroup = jQuery.extend({}, oGroup);
                clnGroup.tiles = [];
                clnGroup.pendingLinks = [];
                return clnGroup;
            };

            for (grpsIndex = 0; grpsIndex < aGroups.length; grpsIndex++) {
                grp = aGroups[grpsIndex];
                tempGroup = fnCreateFlatGroupClone(grp);
                tempSegment.push(tempGroup);

                for (splitObjectIndex = 0; splitObjectIndex < splitObjects.length; splitObjectIndex++) {
                    splitObject = splitObjects[splitObjectIndex];
                    objectBUCost = this.PagingManager.getSizeofSupportedElementInUnits(splitObject === 'pendingLinks' ? 'link' : 'tile');
                    for (tileIndex = 0; tileIndex < grp[splitObject].length; tileIndex++) {
                        if (pendingBU <= 0) {
                            pendingBU = allocatedBU;
                            if (tempSegment) {
                                if (bIsTabsMode) {
                                    tempSegment.iGroupIndex = grpsIndex;
                                }

                                this.segmentsStore.push(tempSegment);
                            }
                            tempGroup = fnCreateFlatGroupClone(grp);
                            tempSegment = [];
                            tempSegment.push(tempGroup);
                        }
                        tempGroup[splitObject].push(grp[splitObject][tileIndex]);
                        pendingBU -= objectBUCost;
                    }
                }

                //In case tab mode no cross groups segments for Tabs mode
                if (bIsTabsMode) {
                    if (tempSegment) {
                        tempSegment.iGroupIndex = grpsIndex;
                        this.segmentsStore.push(tempSegment);
                        tempSegment = [];
                    }
                }
            }

            if (tempSegment) {
                //in tabs mode last segment will be saved alreay by the code above.
                if (!bIsTabsMode) {
                    this.segmentsStore.push(tempSegment);
                }
            }
        },

        _processSegment: function (modelGroups) {
            var oEventBus = sap.ui.getCore().getEventBus(),
                groupSegment,
                groupIndex,
                tileIndex;

            if (this.segmentsStore.length > 0) {
                groupSegment = this.segmentsStore.shift();
                groupIndex = groupSegment[0].index;
                tileIndex = modelGroups[groupIndex].tiles.length +  modelGroups[groupIndex].pendingLinks.length;

                if (this.isBlindLoading() === false) {
                    if (this.oModel.getProperty("/homePageGroupDisplay") && this.oModel.getProperty("/homePageGroupDisplay") === 'tabs') {
                        if (groupSegment.iGroupIndex === this.iTabSelected) {
                            //this is the current tab, display the tile views.
                            this.getSegmentContentViews(groupSegment);
                        } else {
                            //store segment for use when tab is clicked.
                            if (!this.oSegmentedTabTileViewDB[groupSegment.iGroupIndex]) {
                                this.oSegmentedTabTileViewDB[groupSegment.iGroupIndex] = [];
                            }
                            this.oSegmentedTabTileViewDB[groupSegment.iGroupIndex].push(groupSegment);
                        }
                    } else {
                        this.getSegmentContentViews(groupSegment);
                    }
                }
                modelGroups = this._bindSegment(modelGroups, groupSegment);

                this.oModel.setProperty('/groups', modelGroups);
                //set new length in case there are less new groups
                this._updateModelWithTileView(groupIndex, tileIndex);
                this._handleSegment();
            } else {
                //publish event dashboard model finished loading.
                this._updateModelWithTileView(0, 0);
                sap.ushell.utils.handleTilesVisibility();
                oEventBus.publish("launchpad", "dashboardModelContentLoaded");
            }
        },

        getSegmentContentViews: function (groupSegment) {
            var nGroupSegmentIndex, nTilesIndex, oSegnmentGrp, oSegmentTile;

            for (nGroupSegmentIndex = 0; nGroupSegmentIndex < groupSegment.length; nGroupSegmentIndex++) {
                oSegnmentGrp = groupSegment[nGroupSegmentIndex];
                for(nTilesIndex = 0; nTilesIndex < oSegnmentGrp.tiles.length; nTilesIndex++) {
                    oSegmentTile = oSegnmentGrp.tiles[nTilesIndex];
                    this.getTileView(oSegmentTile);
                }

                for(nTilesIndex = 0; nTilesIndex < oSegnmentGrp.links.length; nTilesIndex++) {
                    oSegmentTile = oSegnmentGrp.links[nTilesIndex];
                    this.getTileView(oSegmentTile, oSegnmentGrp.index);
                }

            }
        },

        getSegmentTabContentViews: function (sChannelId, sEventId, iProcessTileViewSegmentsForGroup) {
            var  nTilesIndex,  oSegmentTile,
                iSegmentsGroup = iProcessTileViewSegmentsForGroup.iSelectedGroup,
                oGroup;

                oGroup = this.oModel.getProperty("/groups/" + iSegmentsGroup);

                for (nTilesIndex = 0; nTilesIndex < oGroup.tiles.length; nTilesIndex++) {
                    oSegmentTile = oGroup.tiles[nTilesIndex];
                    this.getTileView(oSegmentTile);
                }

                for (nTilesIndex = 0; nTilesIndex < oGroup.links.length; nTilesIndex++) {
                    oSegmentTile = oGroup.links[nTilesIndex];
                    this.getTileView(oSegmentTile, iSegmentsGroup);
                }

                this.oSegmentedTabTileViewDB[iSegmentsGroup] = [];
        },

        /**
         * Prevent calling loadPersonalizedGroups while model is still loading.
         */
        _handleBookmarkModelUpdate: function () {
            this.bIsGroupsModelDirty = false;
            this.bGroupsModelLoadingInProcess = true;
            this.loadPersonalizedGroups();
        },

        _modelLoaded: function () {
            this.bGroupsModelLoadingInProcess = false;
            if (this.bIsGroupsModelDirty) {
                this._handleBookmarkModelUpdate();
            }
        },

        _handleSegment: function () {
            clearTimeout(this.oSegmentTimer);
            this.oSegmentTimer = setTimeout(function () {
                this._processSegment(this.oModel.getProperty('/groups'));
            }.bind(this), 100);

        },

        /**
         * Load all groups in the given array. The default group will be loaded first.
         * @param aGroups
         *      The array containing all groups (including the default group).
         */
        loadGroupsFromArray: function (aGroups) {
            var that = this;
            //For Performance debug only, enabled only when URL parameter sap-flp-perf activated
            jQuery.sap.measure.start("FLP:DashboardManager.loadGroupsFromArray", "loadGroupsFromArray","FLP");
            this.oPageBuilderService.getDefaultGroup().done(function (oDefaultGroup) {
                // In case the user has no groups
                if (aGroups.length == 0 && oDefaultGroup == undefined) {
                    return;
                }
                var i = 0,
                    lockedGroups = [],
                    buildSortedGroups,
                    indexOfDefaultGroup = aGroups.indexOf(oDefaultGroup),
                    numOfLockedGroup,
                    oNewGroupModel,
                    aNewGroups = [],
                    oGroup,
                    isLocked,
                    groupLength,
                    iSelectedGroup,
                    modelGroupsLength,
                    segmentSize,
                    linkBUSize,
                    tileBUSize,
                    numberOfSegments = { desktop: 5, tablet: 10, phone: 15 },
                    allocatedBaseUnits = 0,
                    numSeg = 0,
                    groupModel,
                    numberOfTilesAndLinks = 0,
                    oDashboardView,
                    totalVisibleTileLinks = 0,
                    oDashboardGroupsBox;

                // remove default group from array
                aGroups.splice(indexOfDefaultGroup, 1);

                while (i < aGroups.length) {
                    oGroup = aGroups[i];
                    isLocked = that.oPageBuilderService.isGroupLocked(oGroup);

                    if (isLocked) {
                        lockedGroups.push(oGroup);
                        aGroups.splice(i, 1);
                    } else {
                        i++;
                    }
                }

                numOfLockedGroup = lockedGroups.length;
                // sort only locked groups
                if (!that.oModel.getProperty('/disableSortedLockedGroups')) {
                    lockedGroups.sort(function (x, y) {
                        var xTitle = that.oPageBuilderService.getGroupTitle(x).toLowerCase(),
                            yTitle = that.oPageBuilderService.getGroupTitle(y).toLowerCase();
                        return xTitle < yTitle ? -1 : 1;
                    });
                }
                // bring back default group to array
                buildSortedGroups = lockedGroups;
                buildSortedGroups.push(oDefaultGroup);
                buildSortedGroups.push.apply(buildSortedGroups, aGroups);
                aGroups = buildSortedGroups;
                groupLength = aGroups.length;
                modelGroupsLength = that.oModel.getProperty("/groups/length");
                // save default group index
                that.oModel.setProperty("/groups/indexOfDefaultGroup", numOfLockedGroup);

                for (i = groupLength; i < modelGroupsLength; ++i) {
                    that._destroyGroupModel("/groups/" + i);
                }


                if (!that.PagingManager) {
                    that.PagingManager = new PagingManager('dashboardPaging', {
                            supportedElements: {
                                tile : {className: 'sapUshellTile'},
                                link : {className: 'sapUshellLinkTile'}
                            },
                            containerHeight: window.innerHeight,
                            containerWidth: window.innerWidth
                        });
                    }

                    if (that.PagingManager.currentPageIndex === 0) {
                        that.PagingManager.moveToNextPage();
                        allocatedBaseUnits = that.PagingManager._calcElementsPerPage();
                    }
                    linkBUSize = that.PagingManager.getSizeofSupportedElementInUnits('link');
                    tileBUSize = that.PagingManager.getSizeofSupportedElementInUnits('tile');

                jQuery.sap.measure.start("FLP:DashboardManager._getGroupModel", "_getGroupModel","FLP");

                for (i = 0; i < groupLength; ++i) {
                    oNewGroupModel = that._getGroupModel(aGroups[i], i === numOfLockedGroup, i === groupLength - 1);
                    oNewGroupModel.index = i;
                    numberOfTilesAndLinks += oNewGroupModel.tiles.length * tileBUSize + oNewGroupModel.links.length * linkBUSize;
                    if (oNewGroupModel.isGroupVisible) {
                        //Hidden tilesAndLinks not calculate for the bIsScorllModeAccordingKPI
                        totalVisibleTileLinks += oNewGroupModel.tiles.length * tileBUSize + oNewGroupModel.links.length * linkBUSize;
                    }
                    // Check if blind loading should be activated
                    that.bIsScorllModeAccordingKPI = totalVisibleTileLinks > that.iMinNumOfTilesForBlindLoading * tileBUSize;

                    aNewGroups.push(oNewGroupModel);
                }
                that.oModel.setProperty("/iSelectedGroup", iSelectedGroup);

                jQuery.sap.measure.end("FLP:DashboardManager._getGroupModel");

                if (sap.ui.Device.system.desktop) {
                    numSeg = numberOfSegments.desktop;
                } else if (sap.ui.Device.system.tablet) {
                    numSeg = numberOfSegments.tablet;
                } else {
                    numSeg = numberOfSegments.phone;
                }

                segmentSize = (numberOfTilesAndLinks - allocatedBaseUnits) / numSeg;

                //make sure segment size is not less then 14 BU.
                if (segmentSize < 14) {
                    segmentSize = 14;
                }

                groupModel = that.createGroupsModelFrame(aNewGroups, that.oModel.getProperty("/personalization"));
                that._splitGroups(segmentSize, aNewGroups, allocatedBaseUnits);
                jQuery.sap.measure.start("FLP:DashboardManager._processSegment", "_processSegment","FLP");
                that._processSegment(groupModel);

                for (var i = 0; i < groupModel.length; i++) {
                    if (groupModel[i].isGroupVisible && groupModel[i].visibilityModes[0]) {
                        that.oModel.setProperty("/groups/" + i + "/isGroupSelected", true);
                        that.oModel.setProperty("/iSelectedGroup", i);
                        that.iTabSelected = i;
                        break;
                    }
                }
                if (that.oModel.getProperty("/homePageGroupDisplay") && that.oModel.getProperty("/homePageGroupDisplay") === 'tabs') {
                    oDashboardView = that.getDashboardView();
                    oDashboardGroupsBox = oDashboardView.oDashboardGroupsBox;
                    oDashboardGroupsBox.getBinding('groups').filter([oDashboardView.oFilterSelectedGroup]);
                }

                jQuery.sap.measure.end("FLP:DashboardManager._processSegment");
                that.oModel.setProperty("/groups/length", groupModel.length);
                if (that.oModel.getProperty('/currentState/stateName') === "catalog") {
                    // update the catalogTile's groups mapping, and update the catalogTile
                    // model if nedded only when in the catalog flow
                    //that.mapCatalogTilesToGroups();
                    //that.updateCatalogTilesToGroupsMap();
                    //this.getModel().setProperty("/catalogTiles", []);
                }
                jQuery.sap.measure.end("FLP:DashboardManager.loadGroupsFromArray");
            }).fail(that._resetGroupsOnFailureHelper("fail_to_get_default_group_msg"));
        },

        /**
         * Load all tiles in a group and add the group to the internal model.
         * @param nIndex
         *      The index at which the group should be added. 0 is reserved for the default group.
         * @param oGroup
         *      The group as it is returned by the UI2 services.
         */
        _loadGroup: function (nIndex, oGroup, fnHandle) {
            var that = this,
                sGroupPath = "/groups/" + nIndex,
                defaultGroupIndex = that.oModel.getProperty("/groups/indexOfDefaultGroup"),
                bIsLast = that.oModel.getProperty(sGroupPath).isLastGroup,
                sOldGroupId,
                oNewGroupModel;

            this._destroyGroupModel(sGroupPath);
            // Set group on model
            sOldGroupId = this.oModel.getProperty(sGroupPath + "/groupId");
            oNewGroupModel = this._getGroupModel(oGroup, nIndex === defaultGroupIndex, bIsLast, undefined, fnHandle);

            // If the group already exists, keep the id. The backend-handlers relay on the id staying the same.
            if (sOldGroupId) {
                oNewGroupModel.groupId = sOldGroupId;
            }

            oNewGroupModel.index = nIndex;
            oNewGroupModel.isRendered = true;
            this.oModel.setProperty(sGroupPath, oNewGroupModel);
        },

        _getGroupModel: function (oGroup, bDefault, bLast, oData, fnHandle) {
            var srvc = this.oPageBuilderService,
                aGroupTiles = (oGroup && srvc.getGroupTiles(oGroup)) || [],
                aModelTiles = [],
                aModelLinks = [],
                i,
                isSortable,
                oModel = this.getModel();
            isSortable = oModel.getProperty("/personalization");

            // in a new group scenario we create the group as null at first.
            var isGroupLocked = oGroup && srvc.isGroupLocked(oGroup) ? true : false;

            for (i = 0; i < aGroupTiles.length; ++i) {
                var oTile = aGroupTiles[i],
                    sTileType = srvc.getTileType(oTile).toLowerCase(); //lowercase to make comparison easier
                if (sTileType === "tile") {
                    aModelTiles.push(this._getTileModel(aGroupTiles[i], isGroupLocked, sTileType, fnHandle));
                } else if (sTileType === "link") {
                    aModelLinks.push(this._getTileModel(aGroupTiles[i], isGroupLocked, sTileType, fnHandle));
                } else {
                    jQuery.sap.log.error("Unknown tile type: '" + sTileType + "'",
                        undefined,
                        "sap.ushell.components.flp.launchpad.DashboardManager"
                    );
                }
            }

            /*
            In case we have pending links (links that their view is not set yet), we cannot
            render the exising ones, but wait for the all first.
            this is due to the fact that we do not have link wrapper and therefore changes
            to the links view do not trigger the control rerender or calling the factory method
            to get the updated link.
            therefore we create a new array for the pending links and once all links would
            updated in the model we will set the links group parameter.
             */
//            var bHasPendingLinks = this._hasPendingLinks(aModelLinks);

            return {
                title: (bDefault && getLocalizedText("my_group")) ||
                (oGroup && srvc.getGroupTitle(oGroup)) || (oData && oData.title) ||
                "",
                object: oGroup,
                groupId: jQuery.sap.uid(),
                links: aModelLinks,
                pendingLinks: [],
                tiles: aModelTiles,
                isDefaultGroup: bDefault || false,
                editMode: !oGroup /*&& isStateHome*/,
                isGroupLocked: isGroupLocked,
                visibilityModes: [true, true],
                removable: !oGroup || srvc.isGroupRemovable(oGroup),
                sortable: isSortable,
                isGroupVisible: !oGroup || srvc.isGroupVisible(oGroup),
                isEnabled: !bDefault, //Currently only default groups is considered as locked
                isLastGroup: bLast || false,
                isRendered: oData ? !!oData.isRendered : false,
                isGroupSelected: false
            };
        },

        _hasPendingLinks: function(aModelLinks){
            for (var i = 0; i < aModelLinks.length; i++){
                if (aModelLinks[i].content[0] === undefined){
                    return true;
                }
            }
            return false;
        },

        _addTileToGroup: function (sGroupPath, oTile) {
            var sTilePath = sGroupPath + "/tiles",
                oGroup = this.oModel.getProperty(sGroupPath),
                iNumTiles = this.oModel.getProperty(sTilePath).length,
                srvc = this.oPageBuilderService,
                sTileType = srvc.getTileType(oTile);

            //Locked groups cannot be added with tiles, so the target group will not be locked, however just for safety we will check the target group locking state
            var isGroupLocked = this.oModel.getProperty(sGroupPath + "/isGroupLocked"),
                personalization = this.oModel.getProperty("/personalization");
            oGroup.tiles[iNumTiles] = this._getTileModel(oTile, isGroupLocked, sTileType, this._addModelToTileViewUpdateQueue);
            this.getTileView(oGroup.tiles[iNumTiles]);
            oGroup.visibilityModes = sap.ushell.utils.calcVisibilityModes(oGroup, personalization);
            this._updateModelWithTileView(oGroup.index, iNumTiles);
            this.oModel.setProperty(sGroupPath, oGroup);
        },

        _addAndUpdateModelWithTileView: function (sTileUUID, oTileView) {
            this._addModelToTileViewUpdateQueue(sTileUUID, oTileView);
            this._updateModelWithTileView(0, 0);
        },

        _addModelToTileViewUpdateQueue: function (sTileUUID, oTileView) {
            //add the tile view to the update queue
            this.tileViewUpdateQueue.push({uuid: sTileUUID, view: oTileView});
        },

        _updateModelWithTileView: function (startGroup, startTile) {
            var that = this;

            /*
             in order to avoid many updates to the model we wait to allow
             other tile update to accumulate in the queue.
             therefore we clear the previous call to update the model
             and create a new one
             */
            if (this.tileViewUpdateTimeoutID) {
                clearTimeout(this.tileViewUpdateTimeoutID);
            }
            this.tileViewUpdateTimeoutID = setTimeout(function () {
                that.tileViewUpdateTimeoutID = undefined;
                /*
                 we wait with the update till the personalization operation is done
                 to avoid the rendering of the tiles during D&D operation
                 */
                that.oSortableDeferred.done(function () {
                    that._updateModelWithTilesViews(startGroup, startTile);
                });
            }, 50);
        },


        _updateGroupModelWithTilesViews: function(aTiles, startTile, handledUpdatesIndex, isLink){
            var oTileModel,
                oUpdatedTile,
                sSize,
                bLong,
                stTile = startTile || 0;

            for (var j = stTile; j < aTiles.length; j = j + 1) {
                //group tiles loop - get the tile model
                oTileModel = aTiles[j];
                for (var q = 0; q < this.tileViewUpdateQueue.length; q++) {
                    //updated tiles view queue loop - check if the current tile was updated
                    oUpdatedTile = this.tileViewUpdateQueue[q];
                    if (oTileModel.uuid == oUpdatedTile.uuid) {
                        //mark tileViewUpdate index for removal oUpdatedTile from tileViewUpdateQueue.
                        handledUpdatesIndex.push(q);
                        if (oUpdatedTile.view) {
                            /*
                             if view is provided then we destroy the current content
                             (TileState control) and set the tile view
                             In case of link we do not have a loading link therefor we don't destroy it
                             */
                            if (isLink){

                                oTileModel.content = [oUpdatedTile.view];
                            } else {
                                oTileModel.content[0].destroy();
                                oTileModel.content = [oUpdatedTile.view];
                            }
                            this.oDashboardLoadingManager.setTileResolved(oTileModel);

                            /*
                             in some cases tile size can be different then the initial value
                             therefore we read and set the size again
                             */
                            sSize = this.oPageBuilderService.getTileSize(oTileModel.object);
                            bLong = ((sSize !== null) && (sSize === "1x2")) || false;
                            if (oTileModel['long'] !== bLong) {
                                oTileModel['long'] = bLong;
                            }
                        } else {
                            //some error on getTileView, therefore we set the state to 'Failed'
                            oTileModel.content[0].setState("Failed");
                        }
                        break;
                    }
                }
            }
        },

        _updateModelWithTilesViews: function (startGroup, startTile) {
            var aGroups = this.oModel.getProperty("/groups"),
                stGroup = startGroup || 0,
                handledUpdatesIndex = [];

            if (!aGroups || this.tileViewUpdateQueue.length === 0) {
                return;
            }

            /*
             go over the tiles in the model and search for tiles to update.
             tiles are identified using uuid
             */
            for (var i = stGroup; i < aGroups.length; i = i + 1) {
                //group loop - get the groups tiles
                this._updateGroupModelWithTilesViews(aGroups[i].tiles, startTile, handledUpdatesIndex);
                if (aGroups[i].links){
                    this._updateGroupModelWithTilesViews(aGroups[i].links, startTile, handledUpdatesIndex, true);
                    if (aGroups[i].pendingLinks.length > 0){
                        if (!aGroups[i].links) {
                            aGroups[i].links = [];
                        }
                        aGroups[i].links = aGroups[i].links.concat(aGroups[i].pendingLinks);
                        aGroups[i].pendingLinks = [];
                    }
                }

//                this.oModel.setProperty("/groups/" + i, aGroups[i]);
            }

            //clear the handled updates from the tempTileViewUpdateQueue and set the model
            var tempTileViewUpdateQueue = [], tileViewUpdateQueueIndex;
            for (tileViewUpdateQueueIndex = 0; tileViewUpdateQueueIndex < this.tileViewUpdateQueue.length; tileViewUpdateQueueIndex++) {
                if (handledUpdatesIndex.indexOf(tileViewUpdateQueueIndex) === -1) {
                    tempTileViewUpdateQueue.push( this.tileViewUpdateQueue[tileViewUpdateQueueIndex]);
                }
            }
            this.tileViewUpdateQueue = tempTileViewUpdateQueue;

            this.oModel.setProperty("/groups", aGroups);
        },

        getModelTileById: function (sId, sItems) {
            var aGroups = this.oModel.getProperty('/groups'),
                oModelTile,
                bFound = false;
            aGroups.every(function (oGroup, index) {
                oGroup[sItems].every(function (oTile, index) {
                    if (oTile.uuid === sId || oTile.originalTileId === sId) {
                        oModelTile = oTile;
                        bFound = true;
                    }
                    return !bFound;
                });
                return !bFound;
            });
            return oModelTile;
        },
        _addDraggableAttribute: function (oView) {
            if (this.isIeHtml5DnD()) { //should be sap.ushell.Container.getService("LaunchPage").isLinkPersonalizationSupported(oTile)
                oView.addEventDelegate({
                   onAfterRendering: function() {
                       this.$().attr("draggable","true");
                   }.bind(oView)
                });
            }
        },

        _attachLinkPressHandlers: function (oView) {
            var oEventBus = sap.ui.getCore().getEventBus(),
                oTileView = oView.attachPress ? oView : oView.getContent()[0]; // a hack to support demoContent
            oTileView.attachPress(function(oEvent){
                var bTileBeingMoved = oView.getBindingContext().getObject().tileIsBeingMoved;
                if (!bTileBeingMoved && this.getScope && this.getScope() === "Actions") {
                    switch (oEvent.getParameters().action) {
                        case "Press":
                            sap.ushell.components.flp.ActionMode._openActionsMenu(oEvent, oView);
                            break;
                        case "Remove":
                            var tileUuid = oView.getBindingContext().getObject().uuid;
                            oEventBus.publish("launchpad", "deleteTile", {tileId: tileUuid, items: 'links'});
                            break;
                    }
                } else {
                    sap.ui.getCore().getEventBus().publish("launchpad", "dashboardTileLinkClick");
                }
            });
        },

        getTileView: function (oTile, iGroup) {
            var oDfd,
                that = this,
                srvc = this.oPageBuilderService,
                sMode,
                aGroups,
                oGroupLinks,
                fUpdateModelWithView = this._addModelToTileViewUpdateQueue,
                oTileView,
                bNeedRefreshLinks = false,
                sTileUUID = oTile.uuid;

            if (that.oDashboardLoadingManager.isTileViewRequestIssued(oTile)) {
                //no need to get tile view, it was alreay issued.
                return;
            }
            this.oDashboardLoadingManager.setTileInProgress(oTile);
            srvc.setTileVisible(oTile.object, false);
            oDfd = srvc.getTileView(oTile.object);

            /*
             register done and fail handlers for the getTileView API.
             */
            oDfd.done(function (oView) {
                //setting the value of the target when the view is valid and make sure it is not custom tile
                if (oView.oController && oView.oController.navigationTargetUrl && !oTile.isCustomTile) {
                    oTile.target = oView.oController.navigationTargetUrl;
                }
                oTileView = oView;
                //in CDM content, the tils view should have this function
                if(oTileView.getComponentInstance){
                    jQuery.sap.measure.average("FLP:getComponentInstance", "get info for navMode", "FLP1");
                    var oCompData = oTileView.getComponentInstance().getComponentData();
                    if(oCompData && oCompData.properties){
                        oTile.navigationMode = oCompData.properties.navigationMode;
                    }
                    jQuery.sap.measure.end("FLP:getComponentInstance");
                }
                that.oDashboardLoadingManager.setTileResolved(oTile);
                sMode = oView.getMode ? oView.getMode() : "ContentMode";
                if (that.bLinkPersonalizationSupported && sMode === "LineMode") { //If the tileType is link and the personalization is supported by the platform, the the link must support personalization
                    that._attachLinkPressHandlers(oTileView);
                    that._addDraggableAttribute(oTileView);

                    if (iGroup != undefined) {
                        aGroups = that.oModel.getProperty("/groups");

                        if (aGroups[iGroup]) {
                            oTile.content = [oTileView];
                            oGroupLinks = that.oModel.getProperty("/groups/" + iGroup + "/links");
                            that.oModel.setProperty("/groups/" + iGroup + "/links", []);
                            that.oModel.setProperty("/groups/" + iGroup + "/links", oGroupLinks);
                        }
                    }
                } else {
                    if (that.isBlindLoading()) {
                        if (oTile.content.length > 0) {
                            oTile.content[0].destroy();
                        }
                        oTile.content = [oTileView];
                        if(iGroup){
                        var oGroup = that.oModel.getProperty("/groups/" + iGroup);
                        that.oModel.setProperty("/groups/" + iGroup, oGroup);
                    }
                }
                }

                if (that.isBlindLoading()) {
                    /*
                     in some cases tile size can be different then the initial value
                     therefore we read and set the size again
                     */
                    var sSize = that.oPageBuilderService.getTileSize(oTile.object);
                    var bLong = ((sSize !== null) && (sSize === "1x2")) || false;
                    if (oTile['long'] !== bLong) {
                        oTile['long'] = bLong;
                    }
                } else {
                    if (sMode === "LineMode") {
                        oTile.content = [oTileView];

                        if (bNeedRefreshLinks) {
                            oGroupLinks = that.oModel.getProperty("/groups/" + iGroup + "/links");
                            that.oModel.setProperty("/groups/" + iGroup + "/links", []);
                            that.oModel.setProperty("/groups/" + iGroup + "/links", oGroupLinks);
                        }
                    } else if (oTile.content.length === 0) {
                         oTile.content = [oTileView];
                    } else {
                        fUpdateModelWithView.apply(that, [sTileUUID, oTileView]);
                        that._updateModelWithTileView(0,0);
                    }
                }

            });
            oDfd.fail(function () {
                if (that.sTileType === "link") {
                    // in case call is synchronise we set the view with 'TileState' control with 'Failed' status
                    if (!this.bLinkPersonalizationSupported) {
                        oTileView = new TileState({state: "Failed"});
                    } else {
                        var LaunchPage = sap.ushell.Container.getService("LaunchPage");
                        var subHeader = LaunchPage.getCatalogTilePreviewSubtitle(oTile);
                        subHeader = (!subHeader || !subHeader.length) ? undefined : subHeader;
                        var header = LaunchPage.getCatalogTilePreviewTitle(oTile);
                        header = ((!header || !header.length) && !subHeader) ? sap.ushell.resources.i18n.getText('cannotLoadLinkInformation') : header;
                        oTileView =  new sap.m.GenericTile({
                            mode: "LineMode",
                            state: "Failed",
                            header: header,
                            subheader: subHeader
                        });
                    }
                } else {
                    oTileView = new TileState({state: "Failed"});
                }

                    oTile.content = [oTileView];
            });

            if (!oTileView) {
                if (srvc.getTileType(oTile.object) === "link") {
                    bNeedRefreshLinks = true;
                    oTileView = new sap.m.GenericTile({
                        mode: "LineMode"
                    });
                } else {
                    oTileView = new TileState();
                }
                    oTile.content = [oTileView];
                }
        },
        _getTileModel: function (oTile, isGroupLocked, sTileType, fUpdateModel) {
            var srvc = this.oPageBuilderService,
                sTileUUID = jQuery.sap.uid(),
                oTileView,
                oTileModelData;

            this.sTileType = sTileType;

            var sSize = srvc.getTileSize(oTile);

            var aLinks = [];
            if (sTileType === "link") {
                aLinks = [new sap.m.GenericTile({
                    mode: "LineMode"
                })];
            }

            oTileModelData = {
                "isCustomTile" : !this._getIsAppBox(oTile),
                "object": oTile,
                "originalTileId": srvc.getTileId(oTile),
                "uuid": sTileUUID,
                "tileCatalogId": encodeURIComponent(srvc.getCatalogTileId(oTile)),
                "content": aLinks,
                "long": ((sSize !== null) && (sSize === "1x2")) || false,
                "target": srvc.getTileTarget(oTile) || "", // 'target' will be defined (and get a value) later on after the tile will be valid
                "debugInfo": srvc.getTileDebugInfo(oTile),
                "isTileIntentSupported": srvc.isTileIntentSupported(oTile),
                "rgba": "",
                "isLocked": isGroupLocked,
                "showActionsIcon": this.oModel.getProperty("/tileActionsIconEnabled") || false,
                "navigationMode": this.navigationMode
            };

            return oTileModelData;
        },

        isIeHtml5DnD: function () {
            return !!((sap.ui.Device.browser.msie || sap.ui.Device.browser.edge) && sap.ui.Device.browser.version >= 11 &&
                        (sap.ui.Device.system.combi || sap.ui.Device.system.tablet));
        },

        _destroyAllGroupModels: function (oTarget) {
            var aGroups = (typeof oTarget === "string") ? this.oModel.getProperty(oTarget) : oTarget,
                i;
            if (aGroups) {
                for (i = 0; i < aGroups.length; i = i + 1) {
                    this._destroyGroupModel(aGroups[i]);
                }
            }
        },

        _destroyGroupModel: function (oTarget) {
            var oGroupModel = (typeof oTarget === "string") ? this.oModel.getProperty(oTarget) : oTarget;
            if (oGroupModel) {
                this._destroyAllTileModels(oGroupModel.tiles);
            }
        },

        _destroyAllTileModels: function (oTarget) {
            var aTiles = (typeof oTarget === "string") ? this.oModel.getProperty(oTarget) : oTarget,
                i;
            if (aTiles) {
                for (i = 0; i < aTiles.length; i = i + 1) {
                    this._destroyTileModel(aTiles[i]);
                }
            }
        },

        _destroyTileModel: function (oTarget) {
            var oTileModel = (typeof oTarget === "string") ? this.oModel.getProperty(oTarget) : oTarget,
                i;
            if (oTileModel && oTileModel.content) {
                for (i = 0; i < oTileModel.content.length; i = i + 1) {
                    oTileModel.content[i].destroy();
                }
            }
        },

        /**
         * Load all user groups from the backend. (Triggered on initial page load.)
         */
        loadPersonalizedGroups: function () {
            var that = this,
                oGroupsPromise = this.oPageBuilderService.getGroups(),
                oDeferred = new jQuery.Deferred();

            oGroupsPromise.done(function (aGroups) {
                that.loadGroupsFromArray(aGroups);
                oDeferred.resolve();
            });

            oGroupsPromise.fail(function() {
                that._showLocalizedErrorHelper("fail_to_load_groups_msg")();
                oDeferred.reject();
            });

            return oDeferred;
        }
    });


	return DashboardManager;

});
