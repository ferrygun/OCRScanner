// @copyright@

sap.ui.define(["sap/ui/base/EventProvider", 'sap/ushell/ui/launchpad/TileState'], function(EventProvider, TileState) {
	"use strict";

    /*global jQuery, sap, document, setTimeout, window */
    /*jslint plusplus: true, nomen: true, bitwise: true */

    var DashboardLoadingManager = EventProvider.extend("sap.ushell.components.flp.launchpad.DashboardLoadingManager", {
        metadata: {
            publicMethods: []
        },
        constructor: function (sId, mSettings) {
            var oEventBus = sap.ui.getCore().getEventBus();

            this.currentVisibleTiles = [];
            this.oBusyIndicatorTiles = {};
            this.oActiveDynamicTiles = {};
            this.oResolvedTiles = {};
            this.oInProgressTiles = {};
            this.oDashboardManager = mSettings.oDashboardManager;

            oEventBus.subscribe("launchpad", "visibleTilesChanged", this._onVisibilityChanged, this);
            oEventBus.subscribe("launchpad", "refresTiles", this._refreshTiles, this);
            oEventBus.subscribe("launchpad", "setTilesNoVisibility", this._setTilesNoVisibility, this);
            oEventBus.subscribe("launchpad", "onHiddenTab", this._setTilesNoVisibility, this);

        },
        _onVisibilityChanged: function (sChannelId, sEventId, aVisibleTiles) {
            this.currentVisibleTiles = aVisibleTiles;
            if (this.oDashboardManager.isBlindLoading()) {
                this.manageTilesView();
            }
            this.manageBusyIndicatorTiles();
            this.manageDynamicTiles();
        },
        manageDynamicTiles: function () {
            var oVisObj;
            jQuery.sap.measure.average("DashboardLoadingManagerActiveDynamicTile", "Manage Active Dynamic Tiles", "FLP_SHELL");

            var launchPageService = sap.ushell.Container.getService("LaunchPage"),
                oKey,
                iVisibleTileIndex,
                oNewActiveDynamicTiles = {},
                oCloneActiveTiles = jQuery.extend(true, {}, {}, this.oActiveDynamicTiles);

            //handle old dynamic tiles (that not exist in the visible tile that will be handle next in loop
            for (var index = 0; index < this.currentVisibleTiles.length; index++) {
                var oVisTile = this.currentVisibleTiles[index];
                if (!oVisTile.bIsExtanded) {
                    delete oCloneActiveTiles[oVisTile.oTile.uuid];
                }
            }

            for (oKey in oCloneActiveTiles) {
                var oTile = this.oActiveDynamicTiles[oKey];
                var tileObject = oTile.object;
                    launchPageService.setTileVisible(tileObject, false);

            }
            // handle visible  dynamic tiles
            for (iVisibleTileIndex = 0; iVisibleTileIndex < this.currentVisibleTiles.length; iVisibleTileIndex++) {
                oVisObj = this.currentVisibleTiles[iVisibleTileIndex];
                if (!oVisObj.bIsExtanded) {
                    oTile = oVisObj.oTile;
                    //refresh only the tiles that are not part of the active dynamic tiles and handled
                    var tileObject = oTile.object;
                    if (this.oActiveDynamicTiles[oTile.uuid] === undefined && tileObject ) {
                        launchPageService.setTileVisible(tileObject, true);
                    }
                    oNewActiveDynamicTiles[oTile.uuid] = oTile;
                }
            }

            this.oActiveDynamicTiles = oNewActiveDynamicTiles;
            jQuery.sap.measure.end("DashboardLoadingManagerActiveDynamicTile");

        },
        isTileViewRequestIssued: function (oTile) {
            if (this.oInProgressTiles[oTile.uuid] == undefined && this.oResolvedTiles[oTile.uuid] == undefined) {
                return false;
            } else {
                return true;
            }
        },
        manageBusyIndicatorTiles: function () {
            jQuery.sap.measure.average("DashboardLoadingManagerBusyIndicators","Manage Busy Indicators on Tiles","FLP_SHELL");

            var iVisibleTileIndex,
                oCurrentKey,
                oCurrentTile,
                oItherBusyIndicatorTile,
                aRemoveBusyIndicator = [],
                bIsInVisibleTile,
                aAddBusyIndecator = [];

            //remove busy indicators.
            //this.oBusyIndicatorTiles - this.currentVisibleTiles
            for (oCurrentKey in this.oBusyIndicatorTiles) {
                bIsInVisibleTile = true;
                oItherBusyIndicatorTile = this.oBusyIndicatorTiles[oCurrentKey];
                if (this.oResolvedTiles[oCurrentKey] === undefined) {
                    for (var i = 0; i < this.currentVisibleTiles.length; i++) {
                        if (this.currentVisibleTiles[i].oTile.uuid === oItherBusyIndicatorTile.oTile.uuid) {
                            bIsInVisibleTile = false;
                            break;
                        }
                    }

                    if (bIsInVisibleTile) {
                        aRemoveBusyIndicator.push(oItherBusyIndicatorTile);
                    }
                }
            }

            //calculate busy indicators.
            //this.currentVisibleTiles - this.oBusyIndicatorTiles - this.oResolvedTiles
            for (iVisibleTileIndex = 0; iVisibleTileIndex < this.currentVisibleTiles.length; iVisibleTileIndex++) {
                oCurrentTile = this.currentVisibleTiles[iVisibleTileIndex];
                if (this.oBusyIndicatorTiles[oCurrentTile.oTile.uuid] === undefined && this.oResolvedTiles[oCurrentTile.oTile.uuid] === undefined) {
                    aAddBusyIndecator.push(oCurrentTile);
                }
            }

            //manage remove busy indicator.
            for (iVisibleTileIndex = 0; iVisibleTileIndex < aRemoveBusyIndicator.length; iVisibleTileIndex++) {
                oCurrentTile = aRemoveBusyIndicator[iVisibleTileIndex];
                //set tile view to none.
                if (oCurrentTile.oTile.content[0] && oCurrentTile.oTile.content[0].setState) {
                    if (oCurrentTile.oTile.content[0].getState) {
                        if (oCurrentTile.oTile.content[0].getState() !== "Failed") {
                            oCurrentTile.oTile.content[0].setState();
                        }
                    } else {
                        oCurrentTile.oTile.content[0].setState();
                    }
                }
                //update this.oBusyIndicatorTiles.
                delete this.oBusyIndicatorTiles[oCurrentTile.oTile.uuid];
            }

            //manage add busy indicator.
            for (iVisibleTileIndex = 0; iVisibleTileIndex < aAddBusyIndecator.length; iVisibleTileIndex++) {
                oCurrentTile = aAddBusyIndecator[iVisibleTileIndex];
                //set tile view to busy.
                if (oCurrentTile.oTile.content[0] && oCurrentTile.oTile.content[0].setState) {
                    if (oCurrentTile.oTile.content[0].getState) {
                        if (oCurrentTile.oTile.content[0].getState() !== "Failed") {
                            oCurrentTile.oTile.content[0].setState("Loading");
                        }
                    } else {
                        oCurrentTile.oTile.content[0].setState("Loading");
                    }
                }
                //update this.oBusyIndicatorTiles.
                this.oBusyIndicatorTiles[oCurrentTile.oTile.uuid] = oCurrentTile;
            }

            jQuery.sap.measure.end("DashboardLoadingManagerBusyIndicators");

        },
        setTileInProgress: function (oTile) {
            this.oInProgressTiles[oTile.uuid] = oTile;
        },
        setTileResolved: function (oTile) {
            delete this.oInProgressTiles[oTile.uuid];
            this.oResolvedTiles[oTile.uuid] = oTile;

//            var aGroups = this.oDashboardManager.oModel.getProperty("/groups");
//            this.oDashboardManager.oModel.setProperty("/groups", aGroups);

        },
        _refreshTiles: function () {
            var launchPageService = sap.ushell.Container.getService("LaunchPage");
            for (var iVisibleTileIndex = 0; iVisibleTileIndex < this.currentVisibleTiles.length; iVisibleTileIndex++) {
                var oTile = this.currentVisibleTiles[iVisibleTileIndex].oTile;
                var tileObject = oTile.object;
                if (tileObject) {
                    launchPageService.setTileVisible(tileObject, true);
                }
            };
        },
        _setTilesNoVisibility: function () {
            var launchPageService = sap.ushell.Container.getService("LaunchPage");
            for (var iVisibleTileIndex = 0; iVisibleTileIndex < this.currentVisibleTiles.length; iVisibleTileIndex++) {
                var oTile = this.currentVisibleTiles[iVisibleTileIndex].oTile;
                var tileObject = oTile.object;
                if (tileObject) {
                    launchPageService.setTileVisible(tileObject, false);
                }
                delete this.oActiveDynamicTiles[oTile.uuid];
            };
        },
        manageTilesView: function () {
            //aRequestTileView = this.currentVisibleTiles - this.oInProgressTiles - this.oResolvedTiles
            var iVisibleTileIndex,
                oCurrentTile,
                aRequestTileView = [];

            for (iVisibleTileIndex = 0; iVisibleTileIndex < this.currentVisibleTiles.length; iVisibleTileIndex++) {
                oCurrentTile = this.currentVisibleTiles[iVisibleTileIndex];

                if (this.oInProgressTiles[oCurrentTile.oTile.uuid] == undefined && this.oResolvedTiles[oCurrentTile.oTile.uuid] == undefined) {
                    aRequestTileView.push(oCurrentTile);
                }
            }

            //can insert it to the for that appears just above.
            for (iVisibleTileIndex = 0; iVisibleTileIndex < aRequestTileView.length; iVisibleTileIndex++) {
                oCurrentTile = aRequestTileView[iVisibleTileIndex];

                this.oDashboardManager.getTileView(oCurrentTile.oTile, oCurrentTile.iGroup);
            }
        }
    });


	return DashboardLoadingManager;

});
