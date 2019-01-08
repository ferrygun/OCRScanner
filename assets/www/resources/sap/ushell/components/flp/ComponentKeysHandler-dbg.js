// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

/* eslint-disable no-cond-assign */

sap.ui.define(['sap/ushell/ui/launchpad/AccessibilityCustomData'],
	function(AccessibilityCustomData) {
	"use strict";

    var componentKeysHandler = function () {
        this.aTileWrapperClasses = ['.sapUshellTile', '.sapUshellLinkTile'];
    };

    componentKeysHandler.prototype = {
        keyCodes: jQuery.sap.KeyCodes,

        // this static member represents tab-index 0 for the tile-to-focus on
        // (see setTileFocus method)
        tileFocusCustomData : new AccessibilityCustomData({
            key: "tabindex",
            value: "0",
            writeToDom: true
        }),

        handleCatalogKey: function () {
            this.oRouter.navTo("appFinder", {'menu': 'catalog'});
        },

        handleHomepageKey: function () {
            this.oRouter.navTo("home");
            //close MeAre or notifications view if opened
            var oMeAreaButton = sap.ui.getCore().byId("meAreaHeaderButton");
            if (oMeAreaButton && oMeAreaButton.getSelected()) {
                oMeAreaButton.firePress();
                return;
            }
            var oNotificationsButton = sap.ui.getCore().byId("NotificationsCountButton");
            if (oNotificationsButton && oNotificationsButton.getSelected()) {
                oNotificationsButton.firePress();
            }
        },

        handleDoneEditMode: function () {
            var bIsActionsModeActive = this.oModel.getProperty('/tileActionModeActive');

            if (bIsActionsModeActive) {
                var oDoneButton = sap.ui.getCore().byId("sapUshellDashboardFooterDoneBtn");
                if (oDoneButton) {
                    oDoneButton.firePress();
                }
            }
        },

        getNumberOfTileInRow: function (pageName, bIsLink) {
            var jqTile = jQuery(bIsLink ? ".sapUshellLinkTile:first" : ".sapUshellTile:first");
            if (!jqTile.length) {
                return false;
            }
            var contentWidth;
            if (pageName === "catalog") {
                contentWidth = jQuery("#catalogTiles .sapUshellTileContainerContent").width();
            } else {
                contentWidth = jQuery("#dashboardGroups").width();
            }
            var numberTilesInRow = Math.floor(contentWidth / jqTile.outerWidth(true));
            return numberTilesInRow;
        },

        goToTileContainer: function (keyup) {
            var bIsActionsModeActive = this.oModel.getProperty('/tileActionModeActive');

            if (bIsActionsModeActive) {
                ComponentKeysHandler.goToFirstVisibleTileContainer();
            } else {
                ComponentKeysHandler.goToLastVisitedTile();
            }
            return true;
        },

        /*  Go to last visited tile.
            In general, FLP should remember last focused tile, and refocus it when tabbing into the tiles container.
            There are cases where there is no-last focused tile, and in those cases a default behavior will be applied,
            that is, selecting the first tile.

            In addition this method also recieves 2 parameters;
            - jqTileContainerToLookUnder
            - bLookForLastVisitedInSameGroup

            in case a tile container supplied :
                the fallback (choosing first tile) will be made on this container instead of the first container

            in case bLookForLastVisitedInSameGroup is supplied and true :
                this means we search for the last focused tile only in the supplied tile container and not entire tile-containers

         */
        goToLastVisitedTile: function (jqTileContainerToLookUnder, bLookForLastVisitedInSameGroup) {

            var jqTileContainers = jQuery('#dashboardGroups').find('.sapUshellTileContainer:visible'),
                topGroupInViewPortIndex = this.oModel.getProperty("/topGroupInViewPortIndex");

            // resolving and setting the tile-container under which we will look
            var jqTileContainer = jqTileContainerToLookUnder || jQuery(jqTileContainers.get(topGroupInViewPortIndex));

            // setting the default tile to select - under the resolved-tile container
            var defaultTileToSelect = jqTileContainer.find('.sapUshellTile:visible')["first"](),
                lastVisitedTile,lastVisitedLink;


            // in case we were supplied with both a tile-container to look under, and a flag which states that we must
            // focus a tile under the same group (and not overall groups which may happen)
            if (jqTileContainer && bLookForLastVisitedInSameGroup) {

                // we look for the last visited items under the supplied tile-container
                lastVisitedTile = jqTileContainer.find(".sapUshellTile:visible[tabindex='0']");
                lastVisitedLink = jqTileContainer.find(".sapMGTLineMode:visible[tabindex='0']");
            } else {

                // we look for the last visited items under all containers
                lastVisitedTile = jQuery(".sapUshellTile:visible[tabindex='0']");
                lastVisitedLink = jQuery(".sapMGTLineMode:visible[tabindex='0']");
            }


            if (!defaultTileToSelect.length && !lastVisitedTile.length && !lastVisitedLink.length) {
                return false;
            }

            if (lastVisitedTile.length) {
                this.setTileFocus(lastVisitedTile);
                return true;
            }

            if (lastVisitedLink.length) {
                this.setTileFocus(lastVisitedLink);
                return true;
            }

            this.setTileFocus(defaultTileToSelect);
            return true;
        },

        goToFirstVisibleTileContainer: function () {
            var jqTileContainers = jQuery('#dashboardGroups').find('.sapUshellTileContainer:visible'),
                topGroupInViewPortIndex = this.oModel.getProperty("/topGroupInViewPortIndex"),
                jqTileContainerToSelect = jQuery(jqTileContainers.get(topGroupInViewPortIndex));

            if (!jqTileContainerToSelect[0]) {
                return false;
            }
            this.setTileContainerSelectiveFocus(jqTileContainerToSelect);
            return true;
        },

        goToFirstTileOfSiblingGroup: function (selector, e) {
            // Prevent page scrolling.
            e.preventDefault();

            // Get current group container.
            var currentGroup = jQuery(document.activeElement).closest(".sapUshellDashboardGroupsContainerItem");
            if (!currentGroup.length) return;

            // get next group container.
            var tileSelector = 'first',
                nextGroup = currentGroup[selector + "All"](
                    ".sapUshellDashboardGroupsContainerItem:has(.sapUshellTile:visible):not(.sapUshellCloneArea)");

            if (!nextGroup.length) {
                nextGroup = currentGroup;
                tileSelector = ( selector === "next" ) ? 'last' : 'first';
            } else {
                nextGroup = nextGroup.first();
            }

            // scroll next group into view.
            var jqTileToSelect = nextGroup.find(".sapUshellTile:visible")[tileSelector]();

            this.moveScrollDashboard(jqTileToSelect);
            return false;
        },

        animateTileMoveInGroup: function (group, firstTile, secondTile) {
            var deferred = jQuery.Deferred();
            sap.ushell.Layout.initGroupDragMode(group);
            var tiles = group.getTiles().slice();
            var firstTileIndex = tiles.indexOf(firstTile);
            var secondTileIndex = tiles.indexOf(secondTile);
            //insert the first tile in the seconde tile index
            tiles.splice(secondTileIndex, 1, firstTile);
            //insert the second tile in the first tile index
            tiles.splice(firstTileIndex, 1, secondTile);

            var currentGroupMatrix = sap.ushell.Layout.organizeGroup(tiles);
            setTimeout(function () {
                sap.ushell.Layout.renderLayoutGroup(group, currentGroupMatrix);
            }, 0);
            setTimeout(function () {
                sap.ushell.Layout.endDragMode();
                deferred.resolve();
            }, 300);
            return deferred.promise();
        },
        _getTileMode: function (tile) {
            return tile.getMode ? tile.getMode() : 'ContentMode';
        },

        _moveTileInGroup: function (group, firstTile, secondTile, direction) {
            var firstTileMode = this._getTileMode(firstTile),
                secondTileMode = this._getTileMode(secondTile),
                oEventBus = sap.ui.getCore().getEventBus();
            if (firstTileMode === secondTileMode) {
                oEventBus.publish("launchpad", "movetile", this._getTileMoveInfo({group: group, dstGroup: group, firstTile: firstTile, secondTile: secondTile}));
            } else {
                oEventBus.publish("launchpad", "convertTile", this._getTileConvertInfo({group: group, firstTile: firstTile, secondTile: secondTile, direction: direction}));
            }
        },
        _getDestinationTileIndex: function (moveInfo) {
            var groupModelObj = moveInfo.group.getBindingContext().getObject(),
                tileIndex,
                groupTiles = moveInfo.dstGroup ? this._getGroupTiles(moveInfo.dstGroup, moveInfo.secondTile) : this._getGroupTiles(moveInfo.group, moveInfo.secondTile),
                firstTileMode = moveInfo.firstTile.getMode ? moveInfo.firstTile.getMode() : 'ContentMode',
                secondTileMode = moveInfo.secondTile.getMode ? moveInfo.secondTile.getMode() : 'ContentMode',
                changedArea = firstTileMode !== secondTileMode;
            if (changedArea || moveInfo.dstGroup !== moveInfo.group) {
                if (moveInfo.direction && (moveInfo.direction === "left" || moveInfo.direction === "up")) {
                    tileIndex = groupTiles.length;
                } else if (moveInfo.direction) {
                    tileIndex = 0;
                }
            } else {
                if (secondTileMode === 'LineMode') {
                    tileIndex = moveInfo.secondTile.getBindingContext()? groupModelObj.links.indexOf(moveInfo.secondTile.getBindingContext().getObject()) : 0;
                } else {
                    tileIndex  = moveInfo.secondTile.getBindingContext()? groupModelObj.tiles.indexOf(moveInfo.secondTile.getBindingContext().getObject()) : 0;
                }
            }

            return tileIndex;
        },

        moveTileInGroup: function (group, firstTile, secondTile, direction) {
            var firstTileMode = this._getTileMode(firstTile),
                secondTileMode = this._getTileMode(secondTile);
            document.activeElement.blur(); //this will prevent tile move from interruption, focus will be returned after action
            if (sap.ushell.Layout.isAnimationsEnabled() && (firstTileMode === secondTileMode)) {
                this.animateTileMoveInGroup(group, firstTile, secondTile, direction).then(function () {
                    this._moveTileInGroup(group, firstTile, secondTile, direction);
                }.bind(this));
            } else {
                this._moveTileInGroup(group, firstTile, secondTile, direction);
            }
        },

        animateMoveTileToDifferentGroup: function (sourceGroup, destGroup, curTile, direction) {
            var deferred = jQuery.Deferred();
            sap.ushell.Layout.initGroupDragMode(sourceGroup);
            sap.ushell.Layout.initGroupDragMode(destGroup);
            var srcTiles = sourceGroup.getTiles().slice();
            var dstTiles = destGroup.getTiles().slice();
            var tileIndex = srcTiles.indexOf(curTile);

            if (direction === "left" || direction === "up") {
                dstTiles.push(srcTiles.splice(tileIndex, 1)[0]);
            }
            if (direction === "right" || direction === "down") {
                dstTiles.unshift(srcTiles.splice(tileIndex, 1)[0]);
            }
            var srcGroupMatrix = sap.ushell.Layout.organizeGroup(srcTiles);
            var dstGroupMatrix = sap.ushell.Layout.organizeGroup(dstTiles);

            //clone tile to dashboardGroups, hide real one, and animate it to further place
            var tilePosInMatrix = sap.ushell.Layout.getTilePositionInMatrix(curTile, dstGroupMatrix);
            var destGroupRect = destGroup.getDomRef().querySelector(".sapUshellInner").getBoundingClientRect();
            var tileTranslateOffset = sap.ushell.Layout.calcTranslate(tilePosInMatrix.row, tilePosInMatrix.col);
            var futureTileRectLeft = destGroupRect.left + tileTranslateOffset.x; //tile future rect position
            var futureTileRectTop = destGroupRect.top + tileTranslateOffset.y;  //in destination group
            var jqDashboardGroups = jQuery("#dashboardGroups");
            var DGroupsRect = jqDashboardGroups.get(0).getBoundingClientRect();
            var curTileRect = curTile.getDomRef().getBoundingClientRect();
            var curTileY = (-DGroupsRect.top) + curTileRect.top;
            var curTileX = (-DGroupsRect.left) + curTileRect.left;
            var futureTileY = (-DGroupsRect.top) + futureTileRectTop;
            var futureTileX = (-DGroupsRect.left) + futureTileRectLeft;
            jqDashboardGroups.css("position", "relative");
            var jqFirstTileClone = curTile.$().clone().removeAttr("id data-sap-ui").css({
                "transform": "translate3d(" + curTileX + "px, " + curTileY + "px, 0px)",
                "list-style-type": "none",
                "transition": "transform 0.3s cubic-bezier(0.46, 0, 0.44, 1)",
                position: "absolute",
                left: 0,
                top: 0
            });
            jqDashboardGroups.append(jqFirstTileClone);
            curTile.$().css("visibility", "hidden");
            jqFirstTileClone.height();
            jqFirstTileClone.css("transform", "translate3d(" + futureTileX + "px, " + futureTileY + "px, 0px)");

            setTimeout(function () {
                sap.ushell.Layout.renderLayoutGroup(sourceGroup, srcGroupMatrix);
                sap.ushell.Layout.renderLayoutGroup(destGroup, dstGroupMatrix);
            });
            setTimeout(function () {
                sap.ushell.Layout.endDragMode();
                jqFirstTileClone.remove();
                jqDashboardGroups.removeAttr("style");
                deferred.resolve();
            }, 300);
            return deferred.promise();
        },

        _moveTileToDifferentGroup: function (sourceGroup, destGroup, curTile, nextTile, direction) {
                var tileMoveInfo = this._getTileMoveInfo({group: sourceGroup, dstGroup: destGroup, firstTile: curTile, secondTile: nextTile, direction: direction}),
                    tileConvertInfo = this._getTileConvertInfo({group: sourceGroup, dstGroup: destGroup, firstTile: curTile, secondTile: nextTile, direction: direction}),
                    oEventBus = sap.ui.getCore().getEventBus(),
                    firstTileMode= curTile.getMode ? curTile.getMode() : "ContentMode",
                    secondTileMode = nextTile.getMode ? nextTile.getMode() : 'ContentMode';
                if (firstTileMode === secondTileMode) {
                    oEventBus.publish("launchpad", "movetile", tileMoveInfo);
                } else {
                    oEventBus.publish("launchpad", "convertTile", tileConvertInfo);
                }

        },

        moveTileToDifferentGroup:function (sourceGroup, destGroup, curTile, nextTile,  direction) {
            var firstTileMode = this._getTileMode(curTile),
                secondTileMode = this._getTileMode(nextTile);

            document.activeElement.blur(); //this will prevent tile move from interruption, focus will be returned after action
            if (sap.ushell.Layout.isAnimationsEnabled() && (secondTileMode === firstTileMode)) {
                this.animateMoveTileToDifferentGroup(sourceGroup, destGroup, curTile, nextTile, direction).then(function() {
                    this._moveTileToDifferentGroup(sourceGroup, destGroup, curTile, nextTile, direction);
                }.bind(this));
            } else {
                this._moveTileToDifferentGroup(sourceGroup, destGroup, curTile, nextTile, direction);
            }
        },

        moveTile: function (direction) {
            var jqDashboard = jQuery(".sapUshellDashboardView"),
                dashboardView = sap.ui.getCore().byId(jqDashboard.attr("id")),
                oPageBuilderService = sap.ushell.Container.getService("LaunchPage"),
                oTile,
                bIsLinkPersonalizationSupported;
            dashboardView.getModel().setProperty('/isInDrag', true);
            setTimeout(function () {
                dashboardView.getModel().setProperty('/isInDrag', false);
            }, 300);
            if (this.oModel.getProperty("/personalization")) {
                var info = this.getGroupAndTilesInfo();
                //Tiles of locked groups cannot be reordered
                if (!info || info.group.getProperty('isGroupLocked')) {
                    return;
                }
                oTile = info.curTile.getBindingContext().getObject().object;
                bIsLinkPersonalizationSupported = oPageBuilderService.isLinkPersonalizationSupported(oTile);
                var bMoveTile = true,
                    bIsActionsModeActive,
                    nextTile = this.getNextTile(direction, info, bIsActionsModeActive, bMoveTile, !bIsLinkPersonalizationSupported);

                if (!nextTile) {
                    return;
                }  else {
                    var nextTileGroup = nextTile.getParent();
                }

                if (nextTileGroup === info.group) {
                    this.moveTileInGroup(info.group, info.curTile, nextTile, direction);
                } else {
                    this.moveTileToDifferentGroup(info.group, nextTileGroup, info.curTile, nextTile, direction);
                }
            }
        },

        _getTileMoveInfo: function (moveInfo) {
            var firstTileMode = moveInfo.firstTile.getMode ? moveInfo.firstTile.getMode() : 'ContentMode',
                secondTileIndex = this._getDestinationTileIndex(moveInfo),
                jqDashboard = jQuery(".sapUshellDashboardView"),
                dashboardView = sap.ui.getCore().byId(jqDashboard.attr("id")),
                dashboardController = dashboardView.getController(),
                tileUuid = dashboardController._getTileUuid(moveInfo.firstTile),
                groupTiles = moveInfo.dstGroup ? this._getGroupTiles(moveInfo.dstGroup, moveInfo.secondTile) : this._getGroupTiles(moveInfo.group, moveInfo.secondTile),
                oGroup = moveInfo.dstGroup ? moveInfo.dstGroup : moveInfo.group,
                oTileMoveInfo;
            oTileMoveInfo = {
                    sTileId: tileUuid,
                    sToItems: firstTileMode === 'LineMode' ? 'links' : 'tiles',
                    sFromItems: firstTileMode === 'LineMode' ? 'links' : 'tiles',
                    sTileType: firstTileMode === 'LineMode' ? 'link' : 'tile',
                    toGroupId: oGroup.getGroupId ? oGroup.getGroupId() : oGroup.groupId,
                    toIndex: secondTileIndex,
                    callBack: function (oTile) {
                        setTimeout(function() {
                            this.setTileFocus(jQuery(oTile.getDomRef()));
                        }.bind(this), 100);
                    }.bind(this)
                };
            return oTileMoveInfo;
        },
        _getGroupTiles: function (oGroup, oTile) {
            var tileMode = this._getTileMode(oTile);
            return tileMode === 'LineMode' ? oGroup.getLinks() : oGroup.getTiles();

        },
        _getTileConvertInfo: function (moveInfo) {
            var oDstGroup = moveInfo.dstGroup ? moveInfo.dstGroup : moveInfo.group,
                secondTileIndex = this._getDestinationTileIndex(moveInfo),
                oTileConvertInfo = {
                    toGroupId: oDstGroup.getGroupId ? oDstGroup.getGroupId() : oDstGroup.groupId,
                    toIndex: secondTileIndex,
                    tile: moveInfo.firstTile,
                    srcGroupId: moveInfo.group.getGroupId ? moveInfo.group.getGroupId() : moveInfo.group.groupId,
                    longDrop: false,
                    callBack: function (oTile) {
                        setTimeout(function() {
                            this.setTileFocus(jQuery(oTile.getDomRef()));
                        }.bind(this), 100);
                    }.bind(this)
                };
            return oTileConvertInfo;
        },

        _findClosestTile: function (direction, tiles, curTile) {
            var jqCurHelpers;
            //this part of code responsible for links accessibility
            //links could be in wrapped state, it means that link will be braked down to second line,
            //when in happens bouncingRectangle of such link will return us height of 2 lines, and width of 100%, which could not be used for calculations.
            //to handle cases with wrapped links we have to use special API for them, which return "Helpers", div's which represent every string of link
            //and give us real sizes of strings belonged to link
            //currently we don't have API for that, so we just use jQuery to get them, when API will be submitted it has to be changed.
            if (curTile.getMode && curTile.getMode() === "LineMode" && (jqCurHelpers = curTile.$().find(".sapMGTLineStyleHelper"))) {
                if (jqCurHelpers.length === 1) {
                    var curTileRect = jqCurHelpers.get(0).getBoundingClientRect();
                } else if (direction === "down"){
                    var curTileRect = jqCurHelpers.get(jqCurHelpers.length - 1).getBoundingClientRect();
                } else if (direction === "up") {
                    var curTileRect = jqCurHelpers.get(0).getBoundingClientRect();
                }
            } else {
                var curTileRect = (curTile instanceof HTMLElement) ? curTile.getBoundingClientRect() : curTile.getDomRef().getBoundingClientRect();
            }
            var curCenter = curTileRect.right - ((curTileRect.right - curTileRect.left) / 2);
            if (curTile.getMode && curTile.getMode() === "LineMode") {
                var multilineLink = curTile.$().height() > parseInt(curTile.$().css("line-height"), 10);
                if (multilineLink) {
                    //when link is wrapped down key select closest last tile, and otherwise.
                    curCenter = (direction === "down") ? curTileRect.right : curTileRect.left;
                }
            }

            var curTileIndex = tiles.indexOf(curTile);
            var step = direction === "down" ? 1 : -1;
            var nextTile, closestTile, rowTop;
            var minDiff = Infinity;
            for (var i = curTileIndex + step; !nextTile; i += step) {
                var tile = tiles[i];
                if (!tile) {
                    break;
                }
                //this part of code responsible for links accessibility
                //please read explanation for wrapped links above.
                var jqHelpers;
                if (tile.getMode && tile.getMode() === "LineMode" && (jqHelpers = tile.$().find(".sapMGTLineStyleHelper"))) {
                    if (jqHelpers.length === 1) {
                        var tileRect = jqHelpers.get(0).getBoundingClientRect();
                    } else if (direction === "down"){
                        for (var i = 0; i < jqHelpers.length; i++) {
                            if (curTileRect.bottom < jqHelpers.get(i).getBoundingClientRect().bottom) {
                                var tileRect = jqHelpers.get(i).getBoundingClientRect();
                                break;
                            }
                        }
                    } else if (direction === "up"){
                        for (var i = jqHelpers.length-1; i >= 0; i--) {
                            if (curTileRect.top > jqHelpers.get(i).getBoundingClientRect().top) {
                                var tileRect = jqHelpers.get(i).getBoundingClientRect();
                                break;
                            }
                        }
                    }

                } else {
                    var tileRect = (tile instanceof HTMLElement) ? tile.getBoundingClientRect() : tile.getDomRef().getBoundingClientRect();
                }

                if (direction === "down" && curTileRect.bottom >= tileRect.bottom) {
                    continue;
                }
                if (direction === "up" && curTileRect.top <= tileRect.top) {
                    continue;
                }
                if (closestTile && rowTop != tileRect.top) {
                    nextTile = closestTile;
                    break;
                }
                rowTop = tileRect.top;
                var lDiff =  Math.abs(tileRect.left - curCenter);
                var rDiff =  Math.abs(tileRect.right - curCenter);
                var tileDiff =  lDiff > rDiff ? rDiff : lDiff;
                if (minDiff > tileDiff) {
                    minDiff = tileDiff;
                    closestTile = tile;
                    rowTop = tileRect.top;
                } else {
                    nextTile = closestTile;
                }
            }

            return nextTile || closestTile;
        },

        getNextUpDownTileWithScreenPosition: function (direction, info, bMoveTile, bPreventTileConvert) {
            var groupTiles = !(bPreventTileConvert && bMoveTile) ? info.tiles.concat(info.links) : info.tiles;
            if (!groupTiles.length) {
                groupTiles.push(info.group.oPlusTile)
            }
            var nextGroup = this.getNextGroup(direction, info);
            if (nextGroup) {
                var nextGroupTiles = !(bPreventTileConvert && bMoveTile) ? nextGroup.getTiles().concat(nextGroup.getLinks()) : nextGroup.getTiles();
                if (!nextGroupTiles.length) {
                    nextGroupTiles.push(nextGroup.oPlusTile);
                }
            }
            nextGroupTiles = nextGroupTiles ? nextGroupTiles : [];
            var allTiles = direction === "down" ? groupTiles.concat(nextGroupTiles) : nextGroupTiles.concat(groupTiles);
            return this._findClosestTile(direction, allTiles, info.curTile);
        },


        getNextUpDownTileWithLayout: function (direction, info, bMoveTile) {
            var nextTile, nextGroup;
            var nDirection = direction === "down" ? 1 : -1;
            var isEmptyGroup = !info.tiles.length && !info.links.length;
            var bIsGroupLocked = info.group.getIsGroupLocked();
            var bIsPlusTile = jQuery(info.curTile.getDomRef()).hasClass('sapUshellPlusTile');
            var aLinks = info.group.getLinks();
            var layoutMatrix = sap.ushell.Layout.organizeGroup(info.curTile.isLink ? info.links : info.tiles, info.curTile.isLink);
            var tPos = sap.ushell.Layout.getTilePositionInMatrix(info.curTile, layoutMatrix);
            if (!tPos && !isEmptyGroup && !bIsPlusTile) {
                return;
            }
            //Handle the case in which the user has reached the last line of the currently navigated tile aggregation (whether it's a regular tile aggregation or link).
            if (!layoutMatrix[tPos.row + nDirection]) {
                //Handle the case in which the focus is on one of the tiles in the last row and the tile container contains links.
                if (!info.curTile.isLink && aLinks.length && direction === 'down') {
                    // In case actionMode is active
                    if (!bMoveTile) {
                        return aLinks[0];
                    }
                }
                //Handle the case in which the focus is on one of the links in the fist row and the direction is 'up'.
                if (info.curTile.isLink && info.tiles.length && direction === 'up') {
                    return info.tiles[info.tiles.length - 1];
                }
                tPos = isEmptyGroup || bIsPlusTile ? {row: 0, col: 0} : tPos;
                nextGroup = this.getNextGroup(direction, info);
                if (!nextGroup) {
                    return;
                }
                isEmptyGroup = !nextGroup.getTiles().length && !nextGroup.getLinks().length;
                if (!isEmptyGroup) {
                    var aFocussedTileAgg = this._getAggregationToFocusInNextGroup(nextGroup, direction);
                    var bNextTileLink = this._isNextTileLink(aFocussedTileAgg);


                    layoutMatrix = sap.ushell.Layout.organizeGroup(aFocussedTileAgg, bNextTileLink);
                    nDirection = 0;
                    tPos.row = direction === "down" ? 0 : layoutMatrix.length - 1;
                }
            }
            if (isEmptyGroup && bIsGroupLocked) {
                return undefined;
            }
            if (isEmptyGroup) {
                return nextGroup.oPlusTile;
            }

            if (typeof layoutMatrix[tPos.row + nDirection][tPos.col] === "object" && !isEmptyGroup) {
                nextTile = layoutMatrix[tPos.row + nDirection][tPos.col];
            } else {
                nextTile = this.getNextUpDownTile(layoutMatrix, tPos.row + nDirection, tPos.col, direction);
            }

            return nextTile;
        },

        _isNextTileLink: function (aTileAggregation) {
            if (aTileAggregation && aTileAggregation.length) {
                var jqFirstTileInAgg = jQuery(aTileAggregation[0].getDomRef());
                return jqFirstTileInAgg.hasClass("sapUshellLinkTile") || jqFirstTileInAgg.hasClass("sapMGTLineMode");
            }
            return false;
        },

        _getAggregationToFocusInNextGroup: function (nextGroup, direction, bMoveTile, bPreventTileConvert) {
            var getTilesItems = function () {
                if (nextGroup.getTiles().length) {
                    return nextGroup.getShowPlaceholder() ? [].concat(nextGroup.getTiles(), nextGroup.oPlusTile) : nextGroup.getTiles();
                }
            };

            var getTilesLinks = function () {
                if (nextGroup.getLinks().length) {
                    return !(bPreventTileConvert && bMoveTile) ? nextGroup.getLinks() : undefined;
                }
            };


            var bIsRTL = sap.ui.getCore().getConfiguration().getRTL();
            if (bIsRTL) {
                if (direction === "down" || direction === "left") {
                    return getTilesItems() || getTilesLinks();
                } else if (direction === "up" || direction === "right") {
                    return getTilesLinks() || getTilesItems();
                }
            } else {
                if (direction === "down" || direction === "right") {
                    return getTilesItems() || getTilesLinks();
                } else if (direction === "up" || direction === "left") {
                    return  getTilesLinks() || getTilesItems();
                }
            }
        },

        isLastLineFull: function (aLayoutMatrix) {
            var iMaxTilesInRow = this.getNumberOfTileInRow(),
                aActualLastRow = aLayoutMatrix[aLayoutMatrix.length - 1].filter(Boolean);

            return aActualLastRow.length === iMaxTilesInRow;
        },

        getNextUpDownTile: function (layoutMatrix, row, column, direction) {
            var newRow = row,
                len = layoutMatrix.length,
                nextTile,
                nDirection = direction === "up" ? -1 : 1;

            while ((newRow >= 0 && newRow < len) && !nextTile) {
                if (typeof layoutMatrix[newRow][column] !== "object") {
                    nextTile = layoutMatrix[newRow][column];
                }
                newRow = newRow + nDirection;
            }
            if (nextTile) {
                return;
            }

            newRow = row;
            while (( typeof layoutMatrix[newRow][column] !== "object") && column >= 0) {
                column--;
            }

            return layoutMatrix[newRow][column];
        },

        getNextTile: function (direction, info, bIsActionsModeActive, bMoveTile, bPreventTileConvert) {
            var nextTile,
                nRTL = sap.ui.getCore().getConfiguration().getRTL() ? -1 : 1,
                nDirection = direction === "right" ? 1 : -1;

            if (info.pageName === 'catalog') { // In catalog mode
                nextTile = this.getNextTileInCatalog(info, direction);
                // In dashboard mode
            } else {
                if (direction === "left" || direction === "right") {
                    //nDirection is a parameter that influence in which direction we move in array iRTL will change it
                    // to opposite direction if it's RTL
                    var nextTileIndex = info.curTileIndex + ( nRTL * nDirection );
                    var aFocussedTileAgg = info.curTile.isLink ? info.links : info.tiles;
                    // next tile is not the plus tile
                    if (aFocussedTileAgg[nextTileIndex] && !(bMoveTile && aFocussedTileAgg[nextTileIndex].getDomRef().className.indexOf("sapUshellPlusTile") > 0)) {
                        nextTile = aFocussedTileAgg.length ? aFocussedTileAgg[nextTileIndex] : undefined;
                    }

                    if (nextTile) {
                        return nextTile;
                    }
                    if (nRTL == 1) {
                        if (direction === "right" && !info.curTile.isLink && info.links.length && !bPreventTileConvert) {
                            return info.links[0];
                        }
                        if (direction === "left" && info.curTile.isLink && info.tiles.length) {
                            return info.group.getShowPlaceholder() ? info.group.oPlusTile : info.tiles[info.tiles.length - 1];
                        }
                    } else {
                        if (direction === "left" && !info.curTile.isLink && info.links.length && !bPreventTileConvert) {
                            return info.links[0];
                        }
                        if (direction === "right" && info.curTile.isLink && info.tiles.length) {
                            return info.group.getShowPlaceholder() ? info.group.oPlusTile : info.tiles[info.tiles.length - 1];
                        }
                    }

                    // if next tile wasn't exist in the current group need to look on next one
                    var nextGroup = this.getNextGroup(direction, info);
                    if (!nextGroup) {
                        return;
                    } else {
                        var nextGroupTiles = this._getAggregationToFocusInNextGroup(nextGroup, direction, bMoveTile, bPreventTileConvert);
                        if (nextGroupTiles && nextGroupTiles.length) {
                            var last = nextGroupTiles.length - 1;
                            if (direction === "right") {
                                nextTile = nextGroupTiles[nRTL === 1 ? 0 : last];
                            } else {
                                nextTile = nextGroupTiles[nRTL === 1 ? last : 0];
                            }
                        } else {
                            nextTile = nextGroup.oPlusTile;
                        }
                    }
                }

                if (direction === "down" || direction === "up") {
                    nextTile = this.getNextUpDownTileWithScreenPosition(direction, info, bMoveTile, bPreventTileConvert);
                }
            }
            return nextTile;
        },
        getNextTileInCatalog: function (info, direction) {
            var nextTile,
                currentTileRow,
                nearTilesArr,
                startIndex,
                tileElement,
                leftOffset,
                width,
                leftAndWidth,
                origTileLeftOffset,
                nRTL = sap.ui.getCore().getConfiguration().getRTL() ? -1 : 1,
                isEmptyGroup = !info.tiles.length,
                nDirection = direction === "right" ? 1 : -1;
            if (direction == 'right' || direction == 'left') {
                nextTile = !isEmptyGroup ? info.tiles[info.curTileIndex + ( nRTL * nDirection )] : undefined;
                return nextTile;
            }

            if (info.curTileIndex === '0' && direction === 'up') {
                return undefined;
            }

            currentTileRow = this.whichTileRow(info.curTileIndex, info);
            origTileLeftOffset = parseFloat(info.curTile.getDomRef().offsetLeft);
            if (direction == "down") {
                nearTilesArr = info.tiles.slice(info.curTileIndex + 1, info.curTileIndex + (info.sizeOfLine * 2));
            } else {
                startIndex = (startIndex > 0) ? startIndex : 0;
                nearTilesArr = info.tiles.slice(startIndex, info.curTileIndex).reverse();
            }
            for (var i = 0, length = nearTilesArr.length; i < length; i++) {
                tileElement = nearTilesArr[i].getDomRef();
                leftOffset = parseFloat(tileElement.offsetLeft);
                width = parseFloat(tileElement.offsetWidth);
                leftAndWidth = leftOffset + width;

                if (leftOffset <= origTileLeftOffset && leftAndWidth >= origTileLeftOffset) {
                    nextTile = nearTilesArr[i];

                    return nextTile;
                }
            }

            if (this.nextRowIsShorter(direction, currentTileRow, info)) {
                nextTile = this.getNextTileInShorterRow(direction, currentTileRow, info);
                return nextTile;
            }
        },

        getNextTileInShorterRow: function (direction, currentRow, info) {
            var lastTileInRowId = direction === 'down' ? this.getLastTileIdInRow(info, currentRow + 1) : this.getLastTileIdInRow(info, currentRow - 1);
            return info.tiles[lastTileInRowId];
        },

        getLastTileIdInRow: function (info, lineNumber) {
            var count = 0;
            for (var i = 0; i < info.rowsData.length; i++) {
                count += info.rowsData[i];
                if (i === lineNumber) {
                    break;
                }
            }

            return count - 1;
        },

        nextRowIsShorter: function (direction, currentRow, info) {
            if (direction === 'down' && currentRow != info.rowsData.length - 1) {
                return info.rowsData[currentRow] > info.rowsData[currentRow + 1];
            }
            if (direction === 'up' && currentRow != 0) {
                return info.rowsData[currentRow] > info.rowsData[currentRow - 1];
            } else {
                return false;
            }
        },

        getNextGroup: function (direction, info) {
            var nextGroup,
                groups = info.group.getParent().getGroups(),
                isRTL = sap.ui.getCore().getConfiguration().getRTL(),
                curGroupIndex = groups.indexOf(info.group);

            if (direction === "right" || direction === "left") {
                if (isRTL) {
                    direction = (direction === "right") ? "up" : "down";
                } else {
                    direction = (direction === "right") ? "down" : "up";
                }
            }

            if (direction === "down" || direction === "up") {
                var nDirection = direction === "up" ? -1 : 1;
                nextGroup = groups[curGroupIndex + nDirection];
                if (!nextGroup) {
                    return;
                }

                while (!nextGroup.getVisible() && (curGroupIndex >= 0 && curGroupIndex < groups.length)) {
                    curGroupIndex = curGroupIndex + nDirection;
                    nextGroup = groups[curGroupIndex];
                    if (!nextGroup) {
                        return;
                    }
                }
            }
            if (!nextGroup.getVisible()) {
                return;
            }
            return nextGroup;
        },

        getGroupAndTilesInfo: function (jqTile, pageName) {
            if (!jqTile) {
                jqTile = this.getFocusOnTile(jQuery(document.activeElement));
            }
            if (!jqTile.length) {
                return;
            }
            if (!jqTile.hasClass("sapUshellTile") && !jqTile.hasClass("sapUshellLinkTile")) {
                jqTile = jqTile.closest(".sapUshellTile, .sapUshellLinkTile");
            }
            var curTile = sap.ui.getCore().byId(jqTile.attr('id'));
            var jqQroup = jqTile.closest(".sapUshellTileContainer");
            var group = sap.ui.getCore().byId(jqQroup.attr('id'));
            var rowsData;
            var tiles;
            var links;
            if (!group.getTiles) {
                curTile = group;
                group = group.getParent();
            }
            curTile.isLink = jqTile.hasClass('sapUshellLinkTile') || jqTile.hasClass('sapMGTLineMode');

            if (group.getTiles) {
                tiles = group.getTiles();
                links = group.getLinks();
                if (group.getShowPlaceholder() && !curTile.isLink) {
                    tiles.push(group.oPlusTile);
                }
            }

            var sizeOfLine = this.getNumberOfTileInRow(pageName, curTile.isLink);
            return {
                pageName: pageName,
                curTile: curTile,
                curTileIndex: curTile.isLink ? links.indexOf(curTile) : tiles.indexOf(curTile),
                tiles: tiles,
                links: links,
                sizeOfLine: sizeOfLine,
                group: group,
                rowsData: rowsData
            };
        },

        whichTileRow: function (id, info) {
            var tilesSum = 0,
                i;

            for (i = 0; i < info.rowsData.length; i++) {
                tilesSum += info.rowsData[i];
                if (id < tilesSum) {
                    return i;
                }
            }
        },

        goToSiblingElementInTileContainer: function (direction, jqFocused, pageName) {
            var jqTileContainer = jqFocused.closest('.sapUshellTileContainer'),
                jqTileContainerElement,
                jqFirstTileInTileContainer,
                jqTileContainerHeader;

            //If current focused item is the Before Content of a Tile Container.
            if (jqTileContainerElement = this.getFocusTileContainerBeforeContent(jqFocused)) {
                if (direction === 'up' || direction === "left") {
                    this._goToNextTileContainer(jqTileContainerElement, direction);
                } else {
                    jqTileContainerHeader = jqTileContainer.find('.sapUshellTileContainerHeader:first');
                    this.setTabIndexOnTileContainerHeader(jqTileContainerHeader);
                    jqTileContainerHeader.focus();
                }
                return;
            }
            // If current focused item is the Header of a Tile Container.
            if (jqTileContainerElement = this.getFocusTileContainerHeader(jqFocused)) {
                if (direction === 'up') {
                    this.setTabIndexOnTileContainerHeader(jqTileContainerHeader);
                    if (!this._goToTileContainerBeforeContent(jqTileContainer)) {
                        //If the Tile Container doesn't have a Before Content, go to the Tile Container above.
                        this._goToNextTileContainer(jqTileContainerElement, direction);
                    }
                } else if (direction === "down") {
                    jqFirstTileInTileContainer = jqTileContainer.find('.sapUshellTile:first');
                    //If this Tile Container doesn't have tiles at all (not even a Plus Tile), it means that the group is empty and locked.
                    //Thus the next arrow down navigation should be to the descending Tile Container.
                    if (jqFirstTileInTileContainer.length) {
                        var tile = jQuery(jqFirstTileInTileContainer);
                        this.moveScrollDashboard(tile);

                    } else {
                        this._goToNextTileContainer(jqTileContainerElement, direction);
                    }
                } else if (direction === "left") {
                    if (jqFocused.hasClass("sapUshellTileContainerHeader")) {
                        if (!this._goToTileContainerBeforeContent(jqTileContainer)) {
                            //If the Tile Container doesn't have a Before Content, go to the Tile Container above.
                            this._goToNextTileContainer(jqTileContainerElement, "left");
                        }
                    } else {
                        jqTileContainerHeader = jqFocused.closest(".sapUshellTileContainerHeader");
                        jqTileContainerHeader.focus();
                    }
                } else if (direction === "right") {
                    var editInputField = jqFocused.hasClass("sapMInputBaseInner");
                    if (!editInputField) {
                        jqFirstTileInTileContainer = jqTileContainer.find('.sapUshellTile:first');
                        //If this Tile Container doesn't have tiles at all (not even a Plus Tile), it means that the group is empty and locked.
                        //Thus the next arrow down navigation should be to the descending Tile Container.
                        if (jqFirstTileInTileContainer.length) {
                            this.setTileFocus(jqFirstTileInTileContainer);
                        } else {
                            this._goToNextTileContainer(jqTileContainerElement, "down");
                        }
                    }
                }
                return;
            }
            // If current focused item is a Tile.
            if (jqTileContainerElement = this.getFocusOnTile(jqFocused)) {
                this.goFromFocusedTile(direction, jqTileContainerElement, pageName, true);
                return;
            }
            // If current focused item is an After Content of a Tile Container.
            if (jqTileContainerElement = this.getFocusOnTileContainerAfterContent(jqFocused)) {
                if (direction === 'up' || direction === "left") {
                    this._goToFirstTileInTileContainer(jqTileContainerElement);
                } else {
                    this._goToNextTileContainer(jqTileContainerElement, direction);
                }
            }
        },

        _goToNextTileContainer: function (jqTileContainerElement, direction) {
            var jqCurrentTileContainer = jqTileContainerElement.closest('.sapUshellTileContainer'),
                aAllTileContainers = jQuery('.sapUshellTileContainer:visible'),
                nDirection = (direction === 'down') ? 1 : -1,
                jqNextTileContainer,
                jqNextTileContainerHeader;

            jqNextTileContainer = jQuery(aAllTileContainers[aAllTileContainers.index(jqCurrentTileContainer) + nDirection]);
            if (jqNextTileContainer) {
                jqNextTileContainerHeader = jqNextTileContainer.find('.sapUshellTileContainerHeader');
                if (direction === 'down') {
                    if (!this._goToTileContainerBeforeContent(jqNextTileContainer)) {
                        this.setTabIndexOnTileContainerHeader(jqNextTileContainerHeader);
                        this.setTileContainerSelectiveFocus(jqNextTileContainer);
                    }
                } else {
                    if (this._goToTileContainerAfterContent(jqNextTileContainer)) {
                        return;
                    }
                    if (direction === 'up') {
                        if (!this._goToFirstTileInTileContainer(jqNextTileContainer)) {
                            this.setTabIndexOnTileContainerHeader(jqNextTileContainerHeader);
                            jqNextTileContainerHeader.focus();
                        }
                    } else if (direction === 'left') {
                        if (!this._goToLastTileInTileContainer(jqNextTileContainer)) {
                            this.setTabIndexOnTileContainerHeader(jqNextTileContainerHeader);
                            jqNextTileContainerHeader.focus();
                        }
                    }
                }
            }
        },

        _goToLastTileInTileContainer: function (jqTileContainerElement) {
            var jqTileContainer = jqTileContainerElement.hasClass('sapUshellTileContainer') ? jqTileContainerElement : jqTileContainerElement.closest('.sapUshellTileContainer'),
                jqLastTileInTileContainer = jqTileContainer.find('.sapUshellTile:last'),
                jqLastLinkInTileContainer = jqTileContainer.find('.sapUshellLinkTile:last');

            if (!jqLastLinkInTileContainer.length && !jqLastTileInTileContainer.length) {
                return false;
            }
            this.setTileFocus(jqLastLinkInTileContainer.length ? jqLastLinkInTileContainer : jqLastTileInTileContainer);
            return true;
        },

        _goToFirstTileInTileContainer: function (jqTileContainerElement) {
            var jqTileContainer = jqTileContainerElement.hasClass('sapUshellTileContainer') ? jqTileContainerElement : jqTileContainerElement.closest('.sapUshellTileContainer'),
                jqFirstTileInTileContainer = jQuery(jqTileContainer.find('.sapUshellTile').get(0));

            if (jqFirstTileInTileContainer.length) {
                this.setTileFocus(jqFirstTileInTileContainer);
                return true;
            } else {
                return false;
            }
        },

        _goToTileContainerBeforeContent: function (jqTileContainerElement) {
            var jqTileContainer = jqTileContainerElement.hasClass('sapUshellTileContainer') ? jqTileContainerElement : jqTileContainerElement.closest('.sapUshellTileContainer'),
                jqTileContainerBeforeContent = jqTileContainer.find('.sapUshellTileContainerBeforeContent button:visible');

            if (jqTileContainerBeforeContent.length) {
                jqTileContainerBeforeContent.focus();
                return true;
            } else {
                return false;
            }
        },

        _goToTileContainerAfterContent: function (jqTileContainerElement) {
            var jqTileContainer = jqTileContainerElement.hasClass('sapUshellTileContainer') ? jqTileContainerElement : jqTileContainerElement.closest('.sapUshellTileContainer'),
                jqTileContainerAfterContent = jqTileContainer.find('.sapUshellTileContainerAfterContent button:visible');

            if (jqTileContainerAfterContent.length) {
                jqTileContainerAfterContent.focus();
                return true;
            } else {
                return false;
            }
        },

        goFromFocusedTile: function (direction, jqTile, pageName, bIsActionsModeActive) {
            var info = this.getGroupAndTilesInfo(jqTile, pageName),
                nextTile,
                jqCurrentTileContainer,
                jqNextTileContainer,
                jqCurrentTileContainerHeader,
                jqTileContainerAfterContent,
                bIsSameTileContainer;

            if (!info) {
                return;
            }
            nextTile = this.getNextTile(direction, info, bIsActionsModeActive);
            if (bIsActionsModeActive) {
                jqCurrentTileContainer = jQuery(jqTile).closest('.sapUshellTileContainer');
                if (!nextTile) {
                    if (direction === 'down' || direction === 'right') {
                        jqTileContainerAfterContent = jQuery(jqCurrentTileContainer).find('.sapUshellTileContainerAfterContent button:visible');
                        jqTileContainerAfterContent.focus();
                        return;
                    }
                    if (direction === 'up') {
                        this.setTabIndexOnTileContainerHeader(jqCurrentTileContainer.find('.sapUshellTileContainerHeader'));
                        this.setTileContainerSelectiveFocus(jqCurrentTileContainer);
                        return;
                    }
                    if (direction === 'left') {
                        jqCurrentTileContainerHeader = jqCurrentTileContainer.find('.sapUshellTileContainerHeader');
                        jqCurrentTileContainerHeader.focus();
                    }
                } else {
                    jqNextTileContainer = jQuery(nextTile.getDomRef()).closest('.sapUshellTileContainer');
                    bIsSameTileContainer = jqCurrentTileContainer.length && jqNextTileContainer.length && (jqCurrentTileContainer.attr('id') === jqNextTileContainer.attr('id'));
                    if (bIsSameTileContainer) {
                        var tile = jQuery(nextTile.getDomRef());
                        this.moveScrollDashboard(tile);
                    } else {
                        if (direction === 'down' || direction === 'right') {
                            if (!this._goToTileContainerAfterContent(jqCurrentTileContainer)) {
                                //If the Tile Container doesn't have a visible AfterContent, go to the next Tile Container.
                                this.setTabIndexOnTileContainerHeader(jqNextTileContainer.find('.sapUshellTileContainerHeader'));
                                this.setTileContainerSelectiveFocus(jqNextTileContainer);
                            }
                        } else if (direction === 'up' || 'left') {
                            jqCurrentTileContainerHeader = jqCurrentTileContainer.find('.sapUshellTileContainerHeader');
                            this.setTabIndexOnTileContainerHeader(jqCurrentTileContainerHeader);
                            jqCurrentTileContainerHeader.focus();
                        }
                    }
                }
            } else if (nextTile) {
                var tile = jQuery(nextTile.getDomRef());
                this.moveScrollDashboard(tile);
            }
        },

        deleteTile: function (jqTile) {
            var tileId = jqTile.attr("id");
            if (!tileId) {
                return;
            }
            var oTile = sap.ui.getCore().byId(tileId);
            var info = this.getGroupAndTilesInfo(jqTile);
            var nextTile = this.getNextTile("right", info);
            if (!nextTile || (nextTile && nextTile.getParent() != info.group)) {
                nextTile = this.getNextTile("left", info);
            }
            if (!nextTile || (nextTile && nextTile.getParent() != info.group)) {
                nextTile = info.group.oPlusTile;
            }
            if (nextTile) {
                if (!info.curTile.isLink) {
                    this.setTileFocus(jQuery(nextTile.getDomRef()));
                }
                setTimeout(function (group, nextTileUuid) {
                    var tiles = group.getTiles();
                    if (!tiles.length) {
                        if (info.links.length && info.curTile.isLink) {
                            nextTile = this.getNextTile("right", info);
                            if (!nextTile || (nextTile && nextTile.getParent() != info.group)) {
                                nextTile = info.curTile;
                            }
                            this.setTileFocus(jQuery(nextTile.getDomRef()));
                            return;
                        }
                        if (info.group.getProperty('defaultGroup')) {
                            var nextGroup = this.getNextGroup("right", info);
                            nextTile = nextGroup.getTiles()[0] || nextGroup.oPlusTile;
                            this.setTileFocus(jQuery(nextTile.getDomRef()));
                        }
                        this.setTileFocus(jQuery(group.oPlusTile.getDomRef()));
                        return;
                    }
                    var nextTile;
                    for (var i = 0; i < tiles.length; i++) {
                        if (tiles[i].getProperty('uuid') == nextTileUuid) {
                            nextTile = tiles[i];
                            break;
                        }
                    }
                    if (nextTile) {
                        this.setTileFocus(jQuery(nextTile.getDomRef()));
                    }
                }.bind(this, info.group, nextTile.getProperty('uuid')), 100);
            }
            var oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.publish("launchpad", "deleteTile", {
                tileId: oTile.getUuid()
            });
        },

        setTabIndexOnTileContainerHeader: function (jqTileContainerHeader) {
            jQuery(".sapUshellTileContainerHeader").attr("tabindex", -1);
            jQuery(".sapUshellTileContainerHeader .sapUshellContainerTitle").attr("tabindex", -1);
            jQuery(".sapUshellTileContainerHeader .sapUshellContainerHeaderActions button").attr("tabindex", -1);

            if (jqTileContainerHeader) {
                var jqTileConainerHeaderTitle = jqTileContainerHeader.find('.sapUshellContainerTitle:first'),
                    jqTileContainerHeaderActions = jqTileContainerHeader.find('.sapUshellContainerHeaderActions:first');

                jqTileContainerHeader.attr('tabindex', 0);
                jqTileConainerHeaderTitle.attr('tabindex', 0);
                jqTileContainerHeaderActions.find('button').attr('tabindex', 0);
            }
        },

        setTileContainerSelectiveFocus: function (jqTileContainer) {
            var jqTileContainerBeforeContent = jqTileContainer.find('.sapUshellTileContainerBeforeContent button'),
                jqTileContainerHeader = jqTileContainer.find('.sapUshellTileContainerHeader:first'),
                bBeforeContentDisplayed = jqTileContainerBeforeContent.length && jqTileContainerBeforeContent.is(":visible");

            if (bBeforeContentDisplayed) {
                jqTileContainerBeforeContent.focus();
            } else if (jqTileContainerHeader.length) {
                //Set tab-index on tileContainerHeader and its' children.
                this.setTabIndexOnTileContainerHeader(jqTileContainerHeader);
                jqTileContainerHeader.focus();
            }
        },

        setTileFocus: function (jqTile) {
            if (!jqTile.hasClass('sapUshellPlusTile')) {
                var oNavContainerFlp = sap.ui.getCore().byId('navContainerFlp'),
                    oCurrentPage = oNavContainerFlp.getCurrentPage(),
                    oCurrentViewName = oNavContainerFlp ? oNavContainerFlp.getCurrentPage().getViewName() : undefined,
                    jqFocusables;
                var bIsInCatalog = !!((oCurrentViewName === "sap.ushell.components.flp.launchpad.appfinder.AppFinder") && (oCurrentPage.getController().getCurrentMenuName() === "catalog"));

                jqFocusables = jqTile.find('[tabindex]');
                if (bIsInCatalog) {
                    var handler = ComponentKeysHandler;
                    handler.setFocusOnCatalogTile(jqFocusables.eq(0));
                }
            }

            //remove tablindex from all tiles
            jQuery(".sapUshellTile").attr("tabindex", -1);
            jQuery(".sapMGTLineMode").attr("tabindex", -1);
            jQuery(".sapUshellLinkTile").attr("tabindex", -1);
            jqTile.attr("tabindex", 0);
            var jqLoadingDialog = jQuery("#Fiori2LoadingDialog")[0];
            if (!jqLoadingDialog || jqLoadingDialog.style.visibility === "hidden") {

                // on ABAP - link is wrapped by Div - so we take the first child which is span
                if (jqTile.prop("tagName") === "DIV" && jQuery(jqTile).hasClass("sapUshellLinkTile") && jqTile.getMode == undefined){
                    jqTile = jqTile.find("a").length ? jqTile.find("a")[0] : jqTile;
                }
                jqTile.focus();

                // setting a custom data on the Tile control object, so it would be kept after re-rendering
                // (e.g. switching edit mode/non edit mode scenario for example)
                var oTile;
                if (jqTile[0] && jqTile[0].id) {
                    var oTile = sap.ui.getCore().byId(jqTile[0].id);

                    // as we always set the static member created which represents tab-index 0 for the tile-to-focus on
                    // we gain the consistency which ensures us only one tile will have tab-index 0
                    // as setting the same instance of a different tile removes it from its previous parent
                    var customDataParent = this.tileFocusCustomData.getParent && this.tileFocusCustomData.getParent();
                    if (customDataParent) {
                        customDataParent.removeAggregation("customData", this.tileFocusCustomData, true);
                    }

                    if (oTile && sap.ui.getCore().byId(oTile.getId()) && this.tileFocusCustomData && sap.ui.getCore().byId(this.tileFocusCustomData.getId())) {
                        oTile.addAggregation("customData", this.tileFocusCustomData, true);
                    }
                }
            }
        },

        setFocusOnCatalogTile: function(jqTile){
            var oPrevFirsTile = jQuery(".sapUshellTile[tabindex=0]"),
                aAllTileFocusableElements,
                aVisibleTiles;

            if (oPrevFirsTile.length) {
                //remove tabindex attribute to all tile's elements in TAB cycle if exists
                jQuery(".sapUshellTileContainerContent").find('[tabindex*=0]').attr("tabindex", -1);
                aAllTileFocusableElements = oPrevFirsTile.find('[tabindex], a').andSelf().filter('[tabindex], a');
                aAllTileFocusableElements.attr("tabindex", -1);
            }

            if (!jqTile){
                aVisibleTiles = jQuery(".sapUshellTile:visible,.sapUshellAppBox:visible");
                if (aVisibleTiles.length) {
                    jqTile = jQuery(aVisibleTiles[0]);
                } else {
                    return;
                }
            }

            //add tabindex attribute to all tile's elements in TAB cycle
            jqTile.attr("tabindex", 0);
            jqTile.find("button").attr("tabindex", 0);
            jqTile.focus();
        },

        moveScrollDashboard: function (jqTileSelected) {
            var containerId = jqTileSelected.closest(".sapUshellTileContainer")[0].id,
                iY = -1 * ( document.getElementById('dashboardGroups').getBoundingClientRect().top) + document.getElementById(containerId).getBoundingClientRect().top;
            iY += 49; // don't display group header after scroll. Group header will be visible in the anchor bar
            jQuery('#sapUshellDashboardPage section').stop().animate({scrollTop: iY}, 0, function () {
                this.setTileFocus(jqTileSelected);
            }.bind(this));
        },

        moveGroupFromDashboard: function(direction, jqGroup) {
            var jqCurrentTileContainer,
                aTileContainers = jQuery(".sapUshellDashboardGroupsContainerItem"),
                indexOfTileContainer,
                toIndex;

            jqCurrentTileContainer = jqGroup.closest(".sapUshellDashboardGroupsContainerItem");
            indexOfTileContainer = aTileContainers.index(jqCurrentTileContainer);
            toIndex = direction == "up" || direction == "left" ? indexOfTileContainer - 1 : indexOfTileContainer + 1;
            this.moveGroup(indexOfTileContainer, toIndex);
        },

        moveGroup: function(fromIndex, toIndex) {
            var aGroups = jQuery(".sapUshellDashboardGroupsContainerItem"),
                numOfDisabledDragAndDropGroups = jQuery(".sapUshellDisableDragAndDrop").length;
            if (toIndex < 0 || toIndex >= aGroups.length || toIndex < numOfDisabledDragAndDropGroups) { return; }
            var core = sap.ui.getCore();
            var oData = {fromIndex: fromIndex, toIndex: toIndex};
            var oBus = core.getEventBus();
            oBus.publish("launchpad", "moveGroup", oData);

            setTimeout(function () {
                var tileContainerHeader = jQuery(".sapUshellTileContainerHeader")[toIndex];
                this.setTabIndexOnTileContainerHeader(jQuery(tileContainerHeader));
                jQuery(tileContainerHeader).focus();
            }.bind(this), 100);
        },

        getFocusGroupFromDashboard: function (jqFocused) {
            var bIsFocusedOnHeaderTitle = jqFocused.closest('.sapUshellTileContainerHeader').length && jqFocused[0].tagName === 'H2';
            return bIsFocusedOnHeaderTitle ? jqFocused : false;
        },

        getFocusTileContainerBeforeContent: function (jqFocusedElement) {
            var jqTileContainerBeforeContent = jqFocusedElement.closest('.sapUshellTileContainerBeforeContent');
            return jqTileContainerBeforeContent.length ? jqTileContainerBeforeContent : false;
        },

        getFocusTileContainerHeader: function (jqFocusedElement) {
            var jqTileContainerHeader = jqFocusedElement.closest('.sapUshellTileContainerHeader');
            return jqTileContainerHeader.length ? jqTileContainerHeader : false;
        },

        getFocusOnTileContainerAfterContent: function (jqFocusedElement) {
            var jqTileContainerAfterContent = jqFocusedElement.closest('.sapUshellTileContainerAfterContent');
            return jqTileContainerAfterContent.length ? jqTileContainerAfterContent : false;
        },

        getFocusOnTile: function (jqFocused) {
            var jqFocusedTile;

            jQuery.each(this.aTileWrapperClasses, function (index, sTileWrapperClass) {
                var jqTileWrapper = jqFocused.closest(sTileWrapperClass);
                jqFocusedTile = jqTileWrapper.length ? jqTileWrapper : false;
                return !(jqFocusedTile);
            });

            return jqFocusedTile;
        },

        renameGroup: function () {
            var jqFocused = jQuery(document.activeElement);
            var jqTileContainerTitle = this.getFocusGroupFromDashboard(jqFocused);

            if (jqTileContainerTitle) {
                jqTileContainerTitle.click();
            }
        },

        arrowsButtonsHandler: function (direction, e) {

            var jqFocused = jQuery(document.activeElement),
                bIsActionsModeActive = this.oModel.getProperty('/tileActionModeActive');

            if (jqFocused.hasClass("sapUshellAnchorItem")) {
                e.preventDefault();
                this.handleAnchorNavigationItemsArrowKeys(direction);
            } else {
                if (bIsActionsModeActive) {
                    if (!jqFocused.hasClass('sapMInputBaseInner')) {
                        e.preventDefault();
                        this.goToSiblingElementInTileContainer(direction, jqFocused);
                    }
                } else {
                    e.preventDefault();
                    this.goFromFocusedTile(direction, jqFocused);
                }
            }
        },

        _preventBrowserDefaultScrollingBehavior: function (oEvent) {
            //prevent browser event ctrl+up/down from scrolling page
            //created by user `keydown` native event needs to be cancelled so browser will not make default action, which is scroll.
            //Instead we clone same event and dispatch it programmatic, so all handlers expecting to this event will still work
            oEvent.preventDefault();
            oEvent.stopPropagation();
            oEvent.stopImmediatePropagation();
        },

        handleAnchorNavigationItemsArrowKeys: function(direction) {
            var anchorItems = jQuery(".sapUshellAnchorItem:visible"),
                jqFocused = jQuery(document.activeElement),
                indexOfFocusedItem = anchorItems.index(jqFocused),
                nextElement = jqFocused,
                bIsRTL = sap.ui.getCore().getConfiguration().getRTL();

            if (bIsRTL) {
                direction = direction === 'left' ? 'right' : 'left';
            }

            if (direction === "left" || direction === "up") {
                if (indexOfFocusedItem > 0) {
                    nextElement = anchorItems.get(indexOfFocusedItem - 1);
                }
            } else if (direction === "right" || direction === "down") {
                if (indexOfFocusedItem < anchorItems.length - 1) {
                    nextElement = anchorItems.get(indexOfFocusedItem + 1);
                }
            }

            this.setAnchorItemFocus(jQuery(nextElement));
        },

        setAnchorItemFocus: function(jqAnchorItem) {
            //remove tablindex from all tiles
            jQuery(".sapUshellAnchorItem").attr("tabindex", -1);
            jqAnchorItem.attr("tabindex", 0);
            jqAnchorItem.focus();
        },

        appFinderHomeEndButtonsHandler: function (direction, keyup) {
            keyup.preventDefault();
            var aVisibleCatalogEntries = jQuery(".sapUshellTile:visible,.sapUshellAppBox:visible"),
                jqCurrentFocus = jQuery(document.activeElement),
                jqFocusElement;
            if (aVisibleCatalogEntries.length) {
                if (direction === "home") {
                    jqFocusElement = jQuery(aVisibleCatalogEntries.get(0));
                }
                if (direction === "end") {
                    jqFocusElement = jQuery(aVisibleCatalogEntries.get(aVisibleCatalogEntries.length - 1));
                }
            }
            if (jqFocusElement) {
                this.appFinderFocusAppBox(jqCurrentFocus, jqFocusElement);
            }
        },

        appFinderPageUpDownButtonsHandler: function (direction, keyup) {
            keyup.preventDefault();
            var jqFocused = jQuery(document.activeElement);
            var jqCatalogContainer = jQuery(jqFocused.parents()[2]);

            var nextCatalog = this.getNextCatalog(direction, jqCatalogContainer);
            if (nextCatalog) {
                var nextCatalogEnrtiesList = nextCatalog.find("li"),
                    firstEntryInNextCatalog = jQuery(nextCatalogEnrtiesList.get(0));
            }
            if (firstEntryInNextCatalog.length) {
                this.appFinderFocusAppBox(jqFocused, firstEntryInNextCatalog);
            } else if (direction === "down"){
                //find last element in current catalog
                var currentCatalogEntries = jqCatalogContainer.find("li"),
                    lastEntryInCurrentCatalog = jQuery(currentCatalogEntries.get(currentCatalogEntries.length - 1));
                this.appFinderFocusAppBox(jqFocused, lastEntryInCurrentCatalog);
            }
        },

        homeEndButtonsHandler: function (selector, e) {
            var jqFocused = jQuery(document.activeElement),
                tileToSelect;

            if (jqFocused.hasClass("sapUshellAnchorItem")) {
                e.preventDefault();
                this.setAnchorItemFocus(jQuery(".sapUshellAnchorItem:visible:" + selector));
                return;
            }
            if (jqFocused.hasClass("sapUshellTile") && jqFocused.closest("#dashboardGroups").length) {
                e.preventDefault();
                if (e.ctrlKey === true) {
                    tileToSelect = jQuery(".sapUshellTile:visible:not('.sapUshellPlusTile')")[selector]();
                } else {
                    tileToSelect = jqFocused.parent().find(".sapUshellTile:visible:not('.sapUshellPlusTile')")[selector]();
                }
                this.setTileFocus(tileToSelect);
                return;
            }
        },

        deleteButtonHandler: function () {
            if (this.oModel.getProperty("/personalization") && this.oModel.getProperty("/tileActionModeActive")) {
                var jqElement,
                    jqFocused = jQuery(document.activeElement);
                if (jqElement = this.getFocusOnTile(jqFocused)) {
                    if (!jqElement.hasClass('sapUshellLockedTile') && !jqElement.hasClass('sapUshellPlusTile')) {
                        this.deleteTile(jqElement);
                    }
                    return;
                }
            }
        },

        ctrlPlusArrowKeyButtonsHandler: function (direction) {
            var jqElement,
                jqFocused = jQuery(document.activeElement);
            if ((jqElement = this.getFocusOnTile(jqFocused))) {
                this.moveTile(direction);
                return;
            }
            if (jqElement = this.getFocusTileContainerHeader(jqFocused)) {
                // first we check if we should prevent the move of the group - obtain the wrapping container (content div)
                var jqFocusGroupContentElement = jqElement.closest('.sapUshellTileContainerContent');
                // if the group is the Home group OR Locked group - do not initiate move
                if (jqFocusGroupContentElement.hasClass('sapUshellTileContainerDefault') || jqFocusGroupContentElement.hasClass('sapUshellTileContainerLocked')) {
                    return;
                } else {
                    this.moveGroupFromDashboard(direction, jqElement);
                }
            }
        },

        spaceButtonHandler: function (e) {
            var jqFocused = jQuery(document.activeElement);
            if (jqFocused.hasClass("sapUshellTile") ) {
                e.preventDefault();
                var genericButton = jqFocused.find('[role="button"]');
                if (genericButton) {
                    var genericButtonId = genericButton.attr("id");
                    var genericTile = sap.ui.getCore().byId(genericButtonId),
                        bIsActionsModeActive = this.oModel.getProperty('/tileActionModeActive');
                    if (genericTile && !bIsActionsModeActive) {
                        genericTile.firePress();
                        return false;
                    }
                }
                jqFocused.click();
                return false;
            }
        },

        goToFirstAnchorNavigationItem: function () {
            this.setAnchorItemFocus(jQuery(".sapUshellAnchorItem:visible:first"));
        },

        goToSelectedAnchorNavigationItem: function () {
            this.setAnchorItemFocus(jQuery(".sapUshellAnchorItemSelected"));
            return jQuery(document.activeElement).hasClass("sapUshellAnchorItemSelected");
        },

        handleFocusOnMe: function(keyup, bFocusPassedFirstTime) {
            var handler = ComponentKeysHandler,
                oNavContainerFlp = sap.ui.getCore().byId('navContainerFlp'),
                oCurrentPage = oNavContainerFlp.getCurrentPage(),
                oCurrentViewName = oCurrentPage.getViewName();

            //we in dashboard
            if (oCurrentViewName == "sap.ushell.components.flp.launchpad.dashboard.DashboardContent") {
                // we got the focus from the shell
                if (bFocusPassedFirstTime) {
                    if (keyup.shiftKey) {
                        var floatingFooterDoneBtn = jQuery("#sapUshellDashboardFooterDoneBtn:visible");
                        if (floatingFooterDoneBtn.length) {
                            floatingFooterDoneBtn.focus();
                        } else {
                            handler.goToTileContainer(keyup);
                        }
                    } else {
                        if (!handler.goToSelectedAnchorNavigationItem()) {
                            //when focus on anchor bar failed, we pass it to tile
                            ComponentKeysHandler.goToLastVisitedTile()
                        }
                    }
                } else {
                    handler.mainKeydownHandler(keyup);
                    handler.dashboardKeydownHandler(keyup);
                }
            }

            //we in appFinder
            if (oCurrentViewName == "sap.ushell.components.flp.launchpad.appfinder.AppFinder") {
                // we got the focus from the shell
                if (bFocusPassedFirstTime) {
                    //forward navigation
                    if (!keyup.shiftKey) {
                        var openCloseSplitAppButton = sap.ui.getCore().byId("openCloseButtonAppFinderSubheader");
                        if (openCloseSplitAppButton && openCloseSplitAppButton.getVisible()) {
                            openCloseSplitAppButton.focus();
                        } else {
                            handler.appFinderFocusMenuButtons(keyup);
                        }
                    } else { //backwards navigation
                        handler.setFocusOnCatalogTile();
                    }
                } else {
                    handler.mainKeydownHandler(keyup);
                    handler.appFinderKeydownHandler(keyup);
                }
            }
        },

        groupHeaderNavigation: function() {
            var jqFocusItem = jQuery(document.activeElement),
                jqElement;

            if (jqFocusItem.hasClass("sapUshellTileContainerHeader")) {
                jqElement = jqFocusItem.find(".sapUshellContainerTitle");
                jqElement.focus();
            } else if (jqElement = jqFocusItem.closest(".sapUshellTileContainerHeader")){
                jqElement.focus();
            }
        },

        handleShortcuts: function (oEvent) {
            var handler = ComponentKeysHandler;

            if (oEvent.altKey) {
                switch (String.fromCharCode(oEvent.keyCode)) {
                    case 'A':
                        if (handler.oModel.getProperty("/personalization")) {
                            handler.handleCatalogKey();
                        }
                        break;
                    case 'H':
                        handler.handleHomepageKey();
                        break;
                }
            }
            // ctrl + Enter
            if (oEvent.ctrlKey && oEvent.keyCode === 13) {
                handler.handleDoneEditMode();
            }
        },

        mainKeydownHandler: function (e) {
            e = e || window.event;

            switch (e.keyCode) {
                case this.keyCodes.SPACE:
                    this.spaceButtonHandler(e);
                    break;
                case this.keyCodes.HOME: //Home button
                    this.homeEndButtonsHandler("first", e);
                    break;
                case this.keyCodes.END: //End button
                    this.homeEndButtonsHandler("last", e);
                    break;
            }
        },

        appFinderKeydownHandler: function (keyup) {
            var handler = ComponentKeysHandler;
            if (keyup.srcElement.id != "appFinderSearch-I") {
                switch (keyup.keyCode) {
                    case handler.keyCodes.ARROW_UP: //Up
                        handler.appFinderUpDownHandler("up", keyup);
                        break;
                    case handler.keyCodes.ARROW_DOWN: //Down
                        handler.appFinderUpDownHandler("down", keyup);
                        break;
                    case handler.keyCodes.ARROW_RIGHT: // Right ->
                        handler.appFinderRightLeftHandler("right", keyup);
                        break;
                    case handler.keyCodes.ARROW_LEFT: // Left <-
                        handler.appFinderRightLeftHandler("left", keyup);
                        break;
                    case handler.keyCodes.PAGE_UP: //Page Up button
                        handler.appFinderPageUpDownButtonsHandler('up', keyup);
                        break;
                    case handler.keyCodes.PAGE_DOWN: //Page Down
                        handler.appFinderPageUpDownButtonsHandler('down', keyup);
                        break;
                    case handler.keyCodes.HOME:
                        handler.appFinderHomeEndButtonsHandler("home", keyup);
                        break;
                    case handler.keyCodes.END:
                        handler.appFinderHomeEndButtonsHandler("end", keyup);
                        break;
                }
            }
        },

        appFinderFocusAppBox: function (jqPrevAppBox, jqNextAppBox) {
            jqPrevAppBox.attr("tabindex", "-1").find(".sapUshellPinButton").attr("tabindex", "-1");
            jqNextAppBox.find(".sapUshellPinButton").attr("tabindex", "0");
            jqNextAppBox.attr("tabindex", "0").focus();
        },

        appFinderFocusMenuButtons: function (keyup) {
            var buttons = jQuery("#catalog, #userMenu, #sapMenu").filter("[tabindex=0]");
            if (buttons.length) {
                buttons.eq(0).focus();
                keyup.preventDefault();
                return true;
            } else {
                return false;
            }

        },

        appFinderUpDownHandler: function (direction, keyup) {
            keyup.preventDefault();

            var jqFocused = jQuery(document.activeElement);
            if (!jqFocused.is(".sapUshellAppBox, .sapUshellTile")) {
                return;
            }
            var jqCatalogContainer = jQuery(jqFocused.parents()[2]);
            var catalogEnrtiesList = jqCatalogContainer.find("li.sapUshellAppBox, li.sapUshellTile"),
                aCatalogEnrties = jQuery.makeArray(catalogEnrtiesList),
                aNextCatalogEnrties = [];

            var nextCatalog = this.getNextCatalog(direction, jqCatalogContainer);
            if (nextCatalog) {
                var nextCatalogEnrtiesList = nextCatalog.find("li.sapUshellAppBox, li.sapUshellTile"),
                    aNextCatalogEnrties = jQuery.makeArray(nextCatalogEnrtiesList);
            }
            var allCatalogEntries = direction === "down" ? aCatalogEnrties.concat(aNextCatalogEnrties) : aNextCatalogEnrties.concat(aCatalogEnrties);

            var jqNextFocused = jQuery(this._findClosestTile(direction, allCatalogEntries, jqFocused.get(0)));
            this.appFinderFocusAppBox(jqFocused, jqNextFocused);
        },

        getNextCatalog: function (direction, currentCatalog) {
            var nextCatalog;

            if (direction === "down") {
                nextCatalog = currentCatalog.next();
            }
            if (direction === "up") {
                nextCatalog = currentCatalog.prev();
            }

            if (!nextCatalog) {
                return;
            }

            return nextCatalog;
        },

        appFinderRightLeftHandler: function (direction, keyup) {
            keyup.preventDefault();
            var jqFocused = jQuery(document.activeElement);
            if (!jqFocused.is(".sapUshellAppBox, .sapUshellTile")) {
                return;
            }
            var jqCatalogContainer = jQuery(jqFocused.parents()[2]);
            var aCatalogItems = jqCatalogContainer.find("li.sapUshellAppBox, li.sapUshellTile");
            var indexOfCurrentItem = aCatalogItems.index(jqFocused);
            var indexOfNextItem = direction === "right" ? indexOfCurrentItem + 1 : indexOfCurrentItem - 1,
                jqNextFocused;

            //same catalog
            if (indexOfNextItem >= 0 && indexOfNextItem < aCatalogItems.length) {
                //set Focus on the next entry
                jqNextFocused = jQuery(aCatalogItems[indexOfNextItem]);
            } else if (indexOfNextItem < 0) {
            //prev catalog
                //TODO:
                var nextCatalog = this.getNextCatalog("up", jqCatalogContainer);
                if (nextCatalog) {
                    var nextCatalogEnrtiesList = nextCatalog.find("li.sapUshellAppBox, li.sapUshellTile");

                    if (nextCatalogEnrtiesList.length) {
                        jqNextFocused = jQuery(nextCatalogEnrtiesList.get(nextCatalogEnrtiesList.length - 1));
                    } else {
                        return;
                    }
                }
            } else if (indexOfNextItem === aCatalogItems.length) {
            //next catalog
                //TODO:
                var nextCatalog = this.getNextCatalog("down", jqCatalogContainer);
                if (nextCatalog) {
                    var nextCatalogEnrtiesList = nextCatalog.find("li");

                    if (nextCatalogEnrtiesList.length) {
                        jqNextFocused = jQuery(nextCatalogEnrtiesList.get(0));
                    } else {
                        return;
                    }
                }
            }

            this.appFinderFocusAppBox(jqFocused, jqNextFocused);
        },

        dashboardKeydownHandler: function (keyup) {
            var handler = ComponentKeysHandler;
            switch (keyup.keyCode) {
                case handler.keyCodes.F2:
                    handler.renameGroup();
                    break;
                case handler.keyCodes.F7:
                    handler.groupHeaderNavigation();
                    break;
                case handler.keyCodes.DELETE: // Delete
                    handler.deleteButtonHandler();
                    break;
                case handler.keyCodes.BACKSPACE: // Delete
                    handler.deleteButtonHandler();
                    break;
                case handler.keyCodes.ARROW_UP: //Up
                    if (keyup.ctrlKey === true) {
                        handler._preventBrowserDefaultScrollingBehavior(keyup);
                        handler.ctrlPlusArrowKeyButtonsHandler("up");
                    } else {
                        handler.arrowsButtonsHandler("up", keyup);
                    }
                    break;
                case handler.keyCodes.ARROW_DOWN: //Down
                    if (keyup.ctrlKey === true) {
                        handler._preventBrowserDefaultScrollingBehavior(keyup);
                        handler.ctrlPlusArrowKeyButtonsHandler("down");
                    } else {
                        handler.arrowsButtonsHandler("down", keyup);
                    }
                    break;
                case handler.keyCodes.ARROW_RIGHT: // Right ->
                    if (keyup.ctrlKey === true) {
                        handler.ctrlPlusArrowKeyButtonsHandler("right");
                    } else {
                        handler.arrowsButtonsHandler("right", keyup);
                    }
                    break;
                case handler.keyCodes.ARROW_LEFT: // Left <-
                    if (keyup.ctrlKey === true) {
                        handler.ctrlPlusArrowKeyButtonsHandler("left");
                    } else {
                        handler.arrowsButtonsHandler("left", keyup);
                    }
                    break;
                case handler.keyCodes.PAGE_UP: //Page Up button //TODO : check what happen when the tile is  empty
                    handler.goToFirstTileOfSiblingGroup("prev", keyup);
                    break;
                case handler.keyCodes.PAGE_DOWN: //Page Down
                    handler.goToFirstTileOfSiblingGroup("next", keyup);
                    break;
            }

            return true;
        },

        init: function (oModel, oRouter) {
            this.oModel = oModel;
            this.oRouter = oRouter;
        }
    };

    var ComponentKeysHandler = new componentKeysHandler();

    return ComponentKeysHandler

}, /* bExport= */ true);
