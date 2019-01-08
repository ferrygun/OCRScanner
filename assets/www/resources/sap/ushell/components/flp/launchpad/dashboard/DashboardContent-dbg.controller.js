// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define([
    './DashboardUIActions',
    'sap/ushell/ui/launchpad/TileContainer',
    'sap/ushell/utils'
],
	function(DashboardUIActions, TileContainer, utils) {
	"use strict";

    /*global jQuery, sap, setTimeout, clearTimeout, $ */
    /*jslint plusplus: true, nomen: true */
    sap.ui.controller("sap.ushell.components.flp.launchpad.dashboard.DashboardContent", {

        onInit: function () {
            var oEventBus = sap.ui.getCore().getEventBus();
            this.isActionModeInited = false;

            this.handleDashboardScroll = this._handleDashboardScroll.bind(this);

            oEventBus.subscribe("launchpad", "appClosed", this._resizeHandler, this);
            oEventBus.subscribe("launchpad", "appOpened", this._appOpenedHandler, this);
            oEventBus.subscribe("launchpad", "dashboardModelContentLoaded", this._modelLoaded, this);
            oEventBus.subscribe('launchpad', 'actionModeInactive', this._handleGroupVisibilityChanges, this);
            oEventBus.subscribe("launchpad", 'animationModeChange', this._handleAnimationModeChange, this);
            oEventBus.subscribe("launchpad", 'switchTabBarItem', this._handleTabBarItemPressEventHandler, this);

            //when the browser tab is hidden we want to stop sending requests from tiles
            window.document.addEventListener("visibilitychange", utils.handleTilesVisibility, false);
            this.sViewId = "#" + this.oView.getId();

            //On Android 4.x, and Safari mobile in Chrome and Safari browsers sometimes we can see bug with screen rendering
            //so _webkitMobileRenderFix function meant to fix it after  `contentRefresh` event.
            if (sap.ui.Device.browser.mobile) {
                oEventBus.subscribe("launchpad", "contentRefresh", this._webkitMobileRenderFix, this);
            }
            this.isDesktop = (sap.ui.Device.system.desktop && (navigator.userAgent.toLowerCase().indexOf('tablet') < 0));
            this.isNotificationPreviewLoaded = false;

            this._setCenterViewPortShift();
        },

        onExit: function () {
            var oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.unsubscribe("launchpad", "contentRefresh", this._webkitMobileRenderFix, this);
            oEventBus.unsubscribe("launchpad", "appClosed", this._resizeHandler, this);
            oEventBus.unsubscribe("launchpad", "appOpened", this._appOpenedHandler, this);
            oEventBus.unsubscribe("launchpad", "dashboardModelContentLoaded", this._modelLoaded, this);
            oEventBus.unsubscribe("launchpad", 'switchTabBarItem', this._handleTabBarItemPressEventHandler, this);
            window.document.removeEventListener("visibilitychange", utils.handleTilesVisibility, false);
        },

        onAfterRendering: function () {
            var oEventBus = sap.ui.getCore().getEventBus(),
                oModel,
                topViewPortGroupIndex,
                oGroup,
                bIsInEditTitle,
                timer;

            //Bind launchpad event handlers
            oEventBus.unsubscribe("launchpad", "scrollToGroup", this._scrollToGroup, this);
            oEventBus.unsubscribe("launchpad", "scrollToGroupByName", this._scrollToGroupByName, this);
            oEventBus.subscribe("launchpad", "scrollToGroup", this._scrollToGroup, this);
            oEventBus.subscribe("launchpad", "scrollToGroupByName", this._scrollToGroupByName, this);
            oEventBus.unsubscribe("launchpad", "scrollToFirstVisibleGroup", this._scrollToFirstVisibleGroup, this);
            oEventBus.subscribe("launchpad", "scrollToFirstVisibleGroup", this._scrollToFirstVisibleGroup, this);

            sap.ui.Device.orientation.attachHandler(function () {
                var jqTileContainers = jQuery('#dashboardGroups').find('.sapUshellTileContainer:visible');
                if (jqTileContainers.length) {
                    oModel = this.getView().getModel();
                    topViewPortGroupIndex = oModel.getProperty('/topGroupInViewPortIndex');

                    if (jqTileContainers.get(topViewPortGroupIndex)) {
                        oGroup = sap.ui.getCore().byId(jqTileContainers.get(topViewPortGroupIndex).id);
                        bIsInEditTitle = oModel.getProperty('/editTitle');
                        this._publishAsync("launchpad", "scrollToGroup", {
                            group: oGroup,
                            isInEditTitle: bIsInEditTitle
                        });
                    }
                }
            }, this);

            jQuery(window).bind("resize", function () {
                clearTimeout(timer);
                timer = setTimeout(this._resizeHandler.bind(this), 300);
            }.bind(this));

            if (this.getView().getModel().getProperty("/personalization") && !this.isActionModeInited) {
                sap.ui.require(["sap/ushell/components/flp/ActionMode"], function (ActionMode) {
                    ActionMode.init(this.getView().getModel());
                }.bind(this));
                this.isActionModeInited = true;
            }
            this._updateTopGroupInModel();
        },

        _setCenterViewPortShift: function () {
            var oViewPortContainer = sap.ui.getCore().byId("viewPortContainer");
            if (oViewPortContainer) {
                // The dashboard can contain the notification preview, hence,
                // shifting the scaled center veiwport (when moving to the right viewport) might be needed
                oViewPortContainer.shiftCenterTransition(true);
            }
        },

        _dashboardDeleteTileHandler: function (oEvent) {
            var oTileControl = oEvent.getSource(), oTile = oTileControl.getBindingContext().getObject().object,
                oData = {originalTileId: sap.ushell.Container.getService("LaunchPage").getTileId(oTile)};
            sap.ui.getCore().getEventBus().publish("launchpad", "deleteTile", oData, this);
        },

        dashboardTilePress: function (oEvent) {
            var oTileControl = oEvent.getSource();

            //Set focus on tile upon clicking on the tile
            //Unless there is an input element inside tile, then leave the focus on it
            if (oTileControl && document.activeElement.tagName !== "INPUT") {
                if (oTileControl && sap.ui.getCore().byId(oTileControl.getId())) {
                    sap.ushell.components.flp.ComponentKeysHandler.setTileFocus(oTileControl.$());
                }
            }
            sap.ui.getCore().getEventBus().publish("launchpad", "dashboardTileClick");
        },

        _updateTopGroupInModel: function () {
            var oModel = this.getView().getModel(),
                topViewPortGroupIndex = this._getIndexOfTopGroupInViewPort();

            oModel.setProperty('/iSelectedGroup', topViewPortGroupIndex);
            oModel.setProperty('/topGroupInViewPortIndex', topViewPortGroupIndex);
        },

        _getIndexOfTopGroupInViewPort: function () {
            var oView = this.getView(),
                oDomRef = oView.getDomRef(),
                oScrollableElement = oDomRef.getElementsByTagName('section'),
                jqTileContainers = $(oScrollableElement).find('.sapUshellTileContainer'),
                oOffset = jqTileContainers.not('.sapUshellHidden').first().offset(),
                firstContainerOffset = (oOffset && oOffset.top) || 0,
                aTileContainersTopAndBottoms = [],
                nScrollTop = oScrollableElement[0].scrollTop,
                topGroupIndex = 0;

            // In some weird corner cases, those may not be defined -> bail out.
            if (!jqTileContainers || !oOffset) {
                return topGroupIndex;
            }

            jqTileContainers.each(function () {
                if (!jQuery(this).hasClass("sapUshellHidden")) {
                    var nContainerTopPos = jQuery(this).parent().offset().top;
                    aTileContainersTopAndBottoms.push([nContainerTopPos, nContainerTopPos + jQuery(this).parent().height()]);
                }
            });
            var viewPortTop = nScrollTop + firstContainerOffset;

            jQuery.each(aTileContainersTopAndBottoms, function (index, currentTileContainerTopAndBottom) {
                var currentTileContainerTop = currentTileContainerTopAndBottom[0],
                    currentTileContainerBottom = currentTileContainerTopAndBottom[1];

                //'24' refers to the hight decrementation of the previous TileContainer to improve the sync between the  top group in the viewport and the  selected group in the anchor bar.
                if (currentTileContainerTop - 24 <= viewPortTop && viewPortTop <= currentTileContainerBottom) {
                    topGroupIndex = index;
                    return false;
                }
            });
            return topGroupIndex;
        },

        _handleDashboardScroll: function () {
            var oView = this.getView(),
                oModel = oView.getModel(),
                nDelay = 400;

            var sHomePageGroupDisplay = oModel.getProperty("/homePageGroupDisplay"),
                bEnableAnchorBar = sHomePageGroupDisplay !== "tabs",
                bTileActionModeActive = oModel.getProperty("/tileActionModeActive");

            // We want to set tiles visibility only after the user finished the scrolling.
            // In IE this event is thrown also after scroll direction change, so we wait 1 second to
            // determine whether scrolling was ended completely or not
            function fHandleTilesVisibility() {
                utils.handleTilesVisibility();
            }
            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(fHandleTilesVisibility, nDelay);

            if (!sap.ui.Device.system.phone) {
                //close anchor popover if it is open
                oView.oAnchorNavigationBar.closeOverflowPopup();
            }

            if (bEnableAnchorBar || bTileActionModeActive) {
                this._updateTopGroupInModel();

                //Handle scrolling for the Notifications Preview.
                //oView._handleHeadsupNotificationsPresentation.apply(oView, [sCurrentViewPortState]);
            }

            //update anchor navigation bar
            oView.oAnchorNavigationBar.reArrangeNavigationBarElements();
        },

        //Delete or Reset a given group according to the removable state.
        _handleGroupDeletion: function (oGroupBindingCtx) {

            var oEventBus = sap.ui.getCore().getEventBus(),
                oGroup = oGroupBindingCtx.getObject(),
                bIsGroupRemovable = oGroup.removable,
                sGroupTitle = oGroup.title,
                sGroupId = oGroup.groupId,
                oResourceBundle = sap.ushell.resources.i18n,
                oMessageSrvc = sap.ushell.Container.getService("Message"),
                mActions,
                mCurrentAction,
                oView = this.getView();

            sap.ui.require(['sap/m/MessageBox'], function (MessageBox) {
                mActions = MessageBox.Action;
                mCurrentAction = (bIsGroupRemovable ? mActions.DELETE : oResourceBundle.getText('ResetGroupBtn'));
                oMessageSrvc.confirm(oResourceBundle.getText(bIsGroupRemovable ? 'delete_group_msg' : 'reset_group_msg', sGroupTitle), function (oAction) {
                    if (oAction === mCurrentAction) {
                        oEventBus.publish("launchpad", bIsGroupRemovable ? 'deleteGroup' : 'resetGroup', {
                            groupId: sGroupId
                        });
                    }
                }, oResourceBundle.getText(bIsGroupRemovable ? 'delete_group' : 'reset_group'), [mCurrentAction, mActions.CANCEL]);
                oView.oAnchorNavigationBar.updateVisibility();
            });
        },

        _modelLoaded: function () {
            this.bModelInitialized = true;
            sap.ushell.Layout.getInitPromise().then(function () {
                this._initializeUIActions();
            }.bind(this));
        },
        _initializeUIActions: function () {
            this.oDashboardUIActionsModule = new DashboardUIActions();
            this.oDashboardUIActionsModule.initializeUIActions(this);
        },
        //force browser to repaint Body, by setting it `display` property to 'none' and to 'block' again
        _forceBrowserRerenderElement: function (element) {
            var animationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
            if (animationFrame) {
                animationFrame(function () {
                    var display = element.style.display;
                    element.style.display = 'none';
                    element.style.display = display;
                });
            } else {
                jQuery.sap.log.info('unsupported browser for animation frame');
            }
        },

        //function fixes Android 4.x Chrome, and Safari bug with poor rendering
        _webkitMobileRenderFix: function () {
            //force Chrome to repaint Body, by setting it `display` property to 'none' and to 'block' again
            if (sap.ui.Device.browser.chrome || sap.ui.Device.os.android) {
                // this includes almost all browsers and devices
                // if this is the IOS6 (as the previous fix causes double flickering
                // and this one only one flickering)
                this._forceBrowserRerenderElement(document.body);
            }
        },

        _resizeHandler: function () {
            this._addBottomSpace();
            utils.handleTilesVisibility();

            //Layout calculation is relevant only when the dashboard is presented
            var bInDahsboard = jQuery.find("#dashboardGroups:visible").length;

            if (sap.ushell.Layout && bInDahsboard) {
                sap.ushell.Layout.reRenderGroupsLayout(null);
                this._initializeUIActions();
            }
        },

        _handleAnimationModeChange: function (sChannelId, sEventId, sAnimationMode) {
            var oModel = this.getView().getModel();

            oModel.setProperty('/animationMode', sAnimationMode);
        },

        _appOpenedHandler: function (sChannelId, sEventId, oData) {
            var oViewPortContainer,
                oParentComponent,
                sParentName,
                oModel = this.getView().getModel();

            // checking if application component opened is not the FLP App Component (e.g. navigation to an app, not 'Home')
            // call to set all tiles visibility off (so no tile calls will run in the background)
            oParentComponent = this.getOwnerComponent();
            sParentName = oParentComponent.getMetadata().getComponentName();
            if (oData.additionalInformation.indexOf(sParentName) === -1) {
                utils.setTilesNoVisibility();// setting no visibility on all visible tiles
                // After an application is opened - the notification preview is not shown,
                // hence, shifting the scaled center veiwport (when moving to the right viewport) is not needed
                oViewPortContainer = sap.ui.getCore().byId("viewPortContainer");
                if (oViewPortContainer) {
                    oViewPortContainer.shiftCenterTransition(false);
                }
            }

            // in a direct navigation scenario the ActionMode might not exist yet.
            // In this case we would like to skip this check.
            if (sap.ushell.components.flp.ActionMode && sap.ushell.components.flp.ActionMode.oModel &&
                    sap.ushell.components.flp.ActionMode.oModel.getProperty("/tileActionModeActive")) {

                sap.ushell.components.flp.ActionMode.toggleActionMode(oModel, "Menu Item");
            }

            if (this.oDashboardUIActionsModule) {
                this.oDashboardUIActionsModule.disableAllDashboardUiAction();
            }
        },
        _addBottomSpace: function () {
            utils.addBottomSpace();
        },

        _scrollToFirstVisibleGroup: function (sChannelId, sEventId, oData) {
            var sGroupId,
                oViewGroups = this.oView.oDashboardGroupsBox.getGroups(),
                fromTop = oData.fromTop > 0 ? oData.fromTop : 0;

            if (oData.group) {
                sGroupId = oData.group.getGroupId();
            } else {
                // in case of scroll after deletion, the oData contains only the groupId.
                sGroupId = oData.groupId;
            }

            if (oViewGroups) {
                jQuery.each(oViewGroups, function (nIndex, oGroup) {
                    if (oGroup.getGroupId() === sGroupId) {
                        var iY = document.getElementById(oGroup.sId).offsetTop;
                        jQuery('.sapUshellDashboardView section').stop().animate({scrollTop: iY + fromTop}, 0);

                        // we focus first tile automatically
                        sap.ushell.components.flp.ComponentKeysHandler.setTileFocus(jQuery("#" + oGroup.getId() + " li").first());

                        return false;
                    }
                });
                utils.addBottomSpace();
            }
        },
        /**
         * Scrolling the dashboard according to group name, in order to show a desired group
         */
        _scrollToGroupByName: function (sChannelId, sEventId, oData) {
            var oGroups = this.getView().getModel().getProperty("/groups"),
                sGroupName = oData.groupName,
                oLaunchPageSrv = sap.ushell.Container.getService('LaunchPage');

            jQuery.each(oGroups, function (nIndex, oGroup) {
                if (oLaunchPageSrv.getGroupTitle(oGroup.object)  === sGroupName) {
                    this._scrollToGroup(sChannelId, sEventId, {
                        groupId: oGroup.groupId
                    });
                }
            }.bind(this));
        },
        /**
         * Scrolling the dashboard in order to show a desired group
         */
        _scrollToGroup: function (sChannelId, sEventId, oData, iDuration) {
            var sGroupId,
                iDuration = oData.iDuration == undefined ? 500 : oData.iDuration,
                oView = this.getView(),
                oModel = oView.getModel(),
                bMinimalAnimationMode = oModel.getProperty('/animationMode') === 'minimal',
                that = this;

            if (bMinimalAnimationMode) {
                iDuration = 0;
            }
            if (oData.group) {
                sGroupId = oData.group.getGroupId();
            } else {
                // in case of scroll after deletion, the oData contains only the groupId.
                sGroupId = oData.groupId;
            }
            that.iAnimationDuration = iDuration;
            // The model flag /scrollingToGroup indicates a scroll-to-group action currently occurs,
            if (this.oView.oDashboardGroupsBox.getGroups()) {
                // Calling again getGroups() because of the lazy loading mechanism
                jQuery.each(this.oView.oDashboardGroupsBox.getGroups(), function (nIndex, oGroup) {
                    if (oGroup.getGroupId() === sGroupId) {
                        var iY;
                        setTimeout(function () {
                            iY = -1 * (document.getElementById('dashboardGroups').getBoundingClientRect().top) + document.getElementById(oGroup.sId).getBoundingClientRect().top;
                            var groupHeaderHeight = jQuery(document.getElementById(oGroup.sId)).find(".sapUshellTileContainerHeader").height();
                            var groupBeforeContentHeight = jQuery(document.getElementById(oGroup.sId)).find(".sapUshellTileContainerBeforeContent").height();
                            var bIsActionsModeActive = oGroup.getModel().getProperty('/tileActionModeActive');
                            // don't display group header after scroll in non edit mode. Group header will be visible in the anchor bar
                            // check if group header is visible, and only then scroll additional 3rem to hide it
                            // in edit mode hide the before content + 0.5rem padding
                            iY = groupHeaderHeight > 0 && !bIsActionsModeActive ? iY + 48 : iY + groupBeforeContentHeight + 8;
                            jQuery('.sapUshellDashboardView section').stop().animate({scrollTop: iY}, that.iAnimationDuration,
                            function() {
                                // set first tile focus on animation end
                                if (oData.groupChanged) {
                                    if (!oData.restoreLastFocusedTile) {
                                        // set focus on the first tile of the group we scrolled to
                                        sap.ushell.components.flp.ComponentKeysHandler.setTileFocus(jQuery("#" + oGroup.getId() + " li").first());
                                    }
                                }

                                // regardless to group change - if we need to restore last focused tile we must do so.
                                if (oData.restoreLastFocusedTile){

                                    var sTileContainerSelector = "#" + oGroup.getId();
                                    var bLookForLastVisitedInSameGroup = false;

                                    // if we need to restore focus on a specific tile-container (rather then current group)
                                    // then we supply the tile container and set true to bLookForLastVisitedInSameGroup (see goToLastVisitedTile method)
                                    if (oData.restoreLastFocusedTileContainerById) {
                                        sTileContainerSelector = "#" + oData.restoreLastFocusedTileContainerById;
                                        bLookForLastVisitedInSameGroup = true;
                                    }

                                    sap.ushell.components.flp.ComponentKeysHandler.goToLastVisitedTile(jQuery(sTileContainerSelector), bLookForLastVisitedInSameGroup);
                                }

                            });
                            if (oData.isInEditTitle) {
                                oGroup.setEditMode(true);
                            }
                        }, 0);

                        //fix bottom space, if this a deletion scenario the 'oData.groupId' will return true
                        if (oData.groupId || oData.groupChanged) {
                            that._addBottomSpace();
                        }
                        // Recalculate tiles visibility
                        utils.handleTilesVisibility();
                        return false;
                    }
                });
            }
        },

        /**
         * Handler for dropping a tile object at the end of drag and drop action.
         *
         * @param event
         * @param ui : tile DOM Reference
         * @private
         */
        _handleDrop: function (event, ui) {
            var oLayout = sap.ushell.Layout.getLayoutEngine(),
                tileMoveInfo = oLayout.layoutEndCallback(),
                bIsShortDrop = !tileMoveInfo.dstArea,
                oEventBus = sap.ui.getCore().getEventBus(),
                noRefreshSrc,
                noRefreshDst,
                sTileUuid,
                oDeferred = jQuery.Deferred(),
                oView = this.getView(),
                oModel = oView.getModel(),
                bTabMode = oModel.getProperty('/homePageGroupDisplay') && oModel.getProperty('/homePageGroupDisplay') === 'tabs',
                bEditMode = oModel.getProperty('/tileActionModeActive'),
                bIsShortDropToLocked = true,
                ieHtml5DnD = !!(oModel.getProperty("/personalization") && (sap.ui.Device.browser.msie || sap.ui.Device.browser.edge) && sap.ui.Device.browser.version >= 11 &&
                (sap.ui.Device.system.combi || sap.ui.Device.system.tablet)),
                oPageBuilderService = sap.ushell.Container.getService("LaunchPage"),
                oTile = tileMoveInfo.tile.getBindingContext().getObject().object,
                bIsLinkPersonalizationSupported = oPageBuilderService.isLinkPersonalizationSupported(oTile);

            sap.ushell.Layout.getLayoutEngine()._toggleAnchorItemHighlighting(false);
            //Short drop to a locked group
            if (tileMoveInfo.dstGroup) {
                var dstGroupBindingContext = tileMoveInfo.dstGroup.getBindingContext(),
                    isDestGroupLocked = dstGroupBindingContext.getProperty(dstGroupBindingContext.sPath).isGroupLocked;
                bIsShortDropToLocked = bIsShortDrop && isDestGroupLocked;
            }

            if (!tileMoveInfo.tileMovedFlag || (ieHtml5DnD && oLayout.isTabBarCollision()) || bIsShortDropToLocked || (!bIsLinkPersonalizationSupported && tileMoveInfo.dstArea === 'links')) {
                oEventBus.publish("launchpad", "sortableStop");
                return; //tile was not moved
            }

            //If we are in EditMode and the target group has no links (empty links area) and the anchor bar isn't in tabs mode,
            //then we continue as tile was not moved.
            if (!bEditMode && !bTabMode && tileMoveInfo.dstArea === "links" && !tileMoveInfo.dstGroupData.getLinks().length) {
                oEventBus.publish("launchpad", "sortableStop");
                return; //tile was not moved
            }

            noRefreshSrc = true;
            noRefreshDst = true; //Default - suppress re-rendering after drop
            //if src and destination groups differ - refresh src and dest groups
            //else if a tile has moved & dropped in a different position in the same group - only dest should refresh (dest == src)
            //if a tile was picked and dropped - but never moved - the previous if would have returned
            if ((tileMoveInfo.srcGroup !== tileMoveInfo.dstGroup)) {
                noRefreshSrc = noRefreshDst = false;
            } else if (tileMoveInfo.tile !== tileMoveInfo.dstGroup.getTiles()[tileMoveInfo.dstTileIndex]) {
                noRefreshDst = false;
            }

            sTileUuid = this._getTileUuid(tileMoveInfo.tile);
            if (tileMoveInfo.srcGroup && tileMoveInfo.srcGroup.removeAggregation && tileMoveInfo.srcArea) {
                tileMoveInfo.srcGroup.removeAggregation('tiles', tileMoveInfo.tile, noRefreshSrc);
            }

            // If this is Tab Bar use-case, and the action is "long" Drag&Drop of a tile on a tab (group):
            // the destination group (whose aggregation needs to be updated) is not in the dashboard, unless the drag is to the same group.
            // Instead - the publish of movetile event will update the group in the model
            var bSameDropArea = tileMoveInfo.dstGroupData && tileMoveInfo.dstGroupData.insertAggregation && tileMoveInfo.dstArea === tileMoveInfo.srcArea;

            //Handles two scenarios - 1. Same group drop - tile to tile/link to link 2. Long drop - tile to tile/link to link
            if (bSameDropArea) {
                tileMoveInfo.tile.sParentAggregationName = tileMoveInfo.dstArea;//"tiles"
                tileMoveInfo.dstGroupData.insertAggregation(tileMoveInfo.dstArea, tileMoveInfo.tile, tileMoveInfo.dstTileIndex, noRefreshDst);

                this._showDropToastMessage(tileMoveInfo);

                oDeferred = this._handleSameTypeDrop(tileMoveInfo, sTileUuid, bSameDropArea);

            //Handles three scenarios - 1. Short drop 2. Same group - tile to link/link to tile 3. Long drop - tile to link/link to tile
            } else {
                this._showDropToastMessage(tileMoveInfo);

                if (bIsShortDrop) {
                    oDeferred = this._handleShortDrop(tileMoveInfo, sTileUuid, bSameDropArea);
                } else {
                    oDeferred = this._handleConvertDrop(tileMoveInfo, bSameDropArea, ui);
                }
            }

            if (this.getView().getModel()) {
                this.getView().getModel().setProperty('/draggedTileLinkPersonalizationSupported', true);
            }
            oEventBus.publish("launchpad", "sortableStop");
            return oDeferred.promise();
        },

        _showDropToastMessage: function (tileMoveInfo) {
            var sTileTitle = this._getTileTitle(tileMoveInfo),
                sDestGroupName = tileMoveInfo.dstGroup.getHeaderText ? tileMoveInfo.dstGroup.getHeaderText() : tileMoveInfo.dstGroup.getTitle(),
                sToastStaticText = sap.ushell.resources.i18n.getText('added_tile_to_group'),
                sToastMessageText = sTileTitle + ' ' + sToastStaticText + ' ' + sDestGroupName,
                toGroupId = tileMoveInfo.dstGroupData.getGroupId ? tileMoveInfo.dstGroupData.getGroupId() : tileMoveInfo.dstGroupData.groupId,
                srcGroupId = tileMoveInfo.srcGroup.getGroupId ? tileMoveInfo.srcGroup.getGroupId() : tileMoveInfo.srcGroup.groupId;

            if (toGroupId !== srcGroupId) {
                sap.m.MessageToast.show(sap.ushell.resources.i18n.getText(sToastMessageText));
            }
        },

        _handleSameTypeDrop: function (tileMoveInfo, sTileUuid, bSameDropArea) {
            var oEventBus = sap.ui.getCore().getEventBus(),
                oDeferred = jQuery.Deferred();
            tileMoveInfo.tile._getBindingContext().oModel.setProperty(tileMoveInfo.tile._getBindingContext().sPath + '/draggedInTabBarToSourceGroup', false);
            oEventBus.publish("launchpad", "movetile", {
                sTileId: sTileUuid,
                sToItems: tileMoveInfo.dstArea ? tileMoveInfo.dstArea : "tiles",
                sFromItems: tileMoveInfo.srcArea ? tileMoveInfo.srcArea : "tiles",
                sTileType: tileMoveInfo.dstArea ? tileMoveInfo.dstArea.substr(0, tileMoveInfo.dstArea.length - 1) : undefined,
                toGroupId: tileMoveInfo.dstGroupData.getGroupId ? tileMoveInfo.dstGroupData.getGroupId() : tileMoveInfo.dstGroupData.groupId,
                toIndex: tileMoveInfo.dstTileIndex,
                longDrop: bSameDropArea,
                callBack: function () {
                    oDeferred.resolve();
                }
            });
            return oDeferred.promise();
        },

        _handleShortDrop: function (tileMoveInfo, sTileUuid, bSameDropArea) {
            var oEventBus = sap.ui.getCore().getEventBus(),
                oDeferred = jQuery.Deferred();
            oEventBus.publish("launchpad", "movetile", {
                sTileId: sTileUuid,
                sToItems: tileMoveInfo.srcArea || "tiles",
                sFromItems: tileMoveInfo.srcArea || "tiles",
                sTileType: tileMoveInfo.srcArea ? tileMoveInfo.srcArea.substr(0, tileMoveInfo.srcArea.length - 1) : undefined,
                toGroupId: tileMoveInfo.dstGroupData.getGroupId ? tileMoveInfo.dstGroupData.getGroupId() : tileMoveInfo.dstGroupData.groupId,
                toIndex: tileMoveInfo.dstTileIndex,
                longDrop: bSameDropArea,
                callBack: function () {
                    oDeferred.resolve();
                }
            });
            return oDeferred.promise();
        },

        _handleConvertDrop: function (tileMoveInfo, bSameDropArea, ui) {
            var oEventBus = sap.ui.getCore().getEventBus(),
                oDeferred = jQuery.Deferred();
            oEventBus.publish("launchpad", "convertTile", {
                toGroupId: tileMoveInfo.dstGroupData.getGroupId ? tileMoveInfo.dstGroupData.getGroupId() : tileMoveInfo.dstGroupData.groupId,
                toIndex: tileMoveInfo.dstTileIndex,
                tile: sap.ui.getCore().byId(ui.id),
                srcGroupId: tileMoveInfo.srcGroup.getGroupId ? tileMoveInfo.srcGroup.getGroupId() : tileMoveInfo.srcGroup.groupId,
                longDrop: bSameDropArea,
                callBack: function () {
                    oDeferred.resolve();
                }
            });
            return oDeferred.promise();
        },

        _getTileTitle: function (oTileMoveInfo) {
            var oModel = this.getView().getModel(),
                sBindingCtxPath = oTileMoveInfo.tile.getBindingContext().getPath(),
                oTileChipObj = oModel.getProperty(sBindingCtxPath).object,
                sTileTitle = sap.ushell.Container.getService('LaunchPage').getTileTitle(oTileChipObj);

            return sTileTitle;
        },

        _getTileUuid: function (oTileObject) {
            var sType = oTileObject.getMode ? oTileObject.getMode() : 'ContentMode',
                sTileUuid;

            if (sType === 'LineMode') {
                sTileUuid = oTileObject.getUuid ? oTileObject.getUuid() : oTileObject.getBindingContext().getObject().uuid;
            } else {
                sTileUuid = oTileObject.getUuid ? oTileObject.getUuid() : oTileObject.getBindingContext().getObject().getParent().getUuid();
            }

            return sTileUuid;
        },

        _handleDrag: function (event, ui) {
          var tileDragInfo = sap.ushell.Layout.getLayoutEngine().layoutEndCallback(),
              oPageBuilderService = sap.ushell.Container.getService("LaunchPage"),
              oTile = tileDragInfo.tile.getBindingContext().getObject().object,
              bIsLinkPersonalizationSupported = oPageBuilderService.isLinkPersonalizationSupported(oTile),
              oView = this.getView(),
              oModel = oView.getModel();

          if (oModel) {
              oModel.setProperty('/draggedTileLinkPersonalizationSupported', bIsLinkPersonalizationSupported);
          }
        },

        _handleTabBarItemPressEventHandler : function (sChannelId, sEventId, oData) {
        	var oView = this.getView(),
                oModel = oView.getModel(),
                aGroups = oModel.getProperty("/groups"),
                iGroupIndex = oData.iGroupIndex;

        	// first reset the isGroupSelected property for all groups.
            for (var i = 0; i < aGroups.length; i++) {
                oModel.setProperty("/groups/" + i + "/isGroupSelected", false);
            }
            // set the selected group (for the model update we use the original index)
            oModel.setProperty("/groups/" + iGroupIndex + "/isGroupSelected", true);

            this._handleTabBarItemPress(sChannelId, sEventId, iGroupIndex);
        },

        _handleTabBarItemPress: function (sChannelId, sEventId, iGroupIndex, oEvent) {
        	var oView = this.getView(),
                oModel = oView.getModel(),
                aGroups = oModel.getProperty("/groups"),
                // Fix the selected group index not to include the hidden groups.
                selectedGroupIndex,
                iHiddenGroupsCount = 0,
                fixedIndex,
                i;

        	if (oEvent) {
        		selectedGroupIndex = oEvent.getParameter("group").getIndex();
        	} else {
        		selectedGroupIndex = iGroupIndex;
        	}

            sap.ui.getCore().getEventBus().publish("launchpad", "tabSelected", { iSelectedGroup: selectedGroupIndex });

            // Go through the groups that are located before the selected group
            for (i = 0; i < selectedGroupIndex; i++) {
                if (!aGroups[i].isGroupVisible || !aGroups[i].visibilityModes[0]) {
                    // Count all groups that are not visible in non-edit mode
                    iHiddenGroupsCount++;
                }
            }
            fixedIndex = selectedGroupIndex - iHiddenGroupsCount;
            // apply the filter
            oView.oDashboardGroupsBox.removeLinksFromUnselectedGroups();
            oView.oDashboardGroupsBox.getBinding("groups").filter([oView.oFilterSelectedGroup]);
            // change the anchor bar selection
            oView.oAnchorNavigationBar.setSelectedItemIndex(fixedIndex);
            oView.oAnchorNavigationBar.reArrangeNavigationBarElements();
            // change tiles visibility of the new selected group
            setTimeout(function () {
                sap.ushell.utils.handleTilesVisibility();
            }, 0);
        },

        _handleAnchorItemPress: function (oEvent) {
            var oView = this.getView(),
                oModel = oView.getModel(),
                iSelectedGroup = oModel.getProperty("/iSelectedGroup"),
                aGroups,
                i;

            //press on item could also be fired from overflow popup, but it will not have "manualPress" parameter
            if (sap.ui.Device.system.phone && oEvent.getParameter("manualPress")) {
                oEvent.oSource.openOverflowPopup();
            }

            if (iSelectedGroup !== undefined) {
                oModel.setProperty("/groups/" + iSelectedGroup + "/isGroupSelected", false);
            }

            // set the selected group (for the model update we use the original index)
            oModel.setProperty("/groups/" + oEvent.getParameter("group").getIndex() + "/isGroupSelected", true);
            oModel.setProperty("/iSelectedGroup", oEvent.getParameter("group").getIndex());

            // if tabs
            if (oModel.getProperty("/homePageGroupDisplay") && oModel.getProperty("/homePageGroupDisplay") === "tabs" && !oModel.getProperty("/tileActionModeActive")) {
            	this._handleTabBarItemPress(undefined, undefined, undefined, oEvent);

            // else scroll or edit mode
            } else {
                // reset the filter

                if (!oModel.getProperty("/tileActionModeActive")) {
                    oView.oDashboardGroupsBox.getBinding("groups").filter([new sap.ui.model.Filter("isGroupVisible", sap.ui.model.FilterOperator.EQ, true)]);
                } else {
                    oView.oDashboardGroupsBox.getBinding("groups").filter([]);
                }

                // scroll to selected group
                this._scrollToGroup("launchpad", "scrollToGroup", {
                    group: oEvent.getParameter('group'),
                    groupChanged: true,
                    focus: (oEvent.getParameter("action") === "sapenter")
                });
            }
        },
        _addGroupHandler: function (oData) {
            var index,
                path = oData.getSource().getBindingContext().getPath(),
                parsePath = path.split("/");

            index = window.parseInt(parsePath[parsePath.length - 1], 10);

            if (oData.getSource().sParentAggregationName === "afterContent") {
                index = index + 1;
            }

            sap.ui.getCore().getEventBus().publish("launchpad", "createGroupAt", {
                title: sap.ushell.resources.i18n.getText("new_group_name"),
                location: index,
                isRendered: true
            });
        },

        /**
         * Callback functions that is registered for notification update.
         * Queries notifications service for the updated notifications, and updates the model with the relevant/recent ones
         */
        _notificationsUpdateCallback: function () {
            var that = this,
                iRequiredNotificationsNumber = 5,
                iTempRequiredNotificationsNumber = 0,
                aRecentNotificationsArray = this.getView().getModel().getProperty("/previewNotificationItems"),
                aNewNotifications = [],
                aNewNotificationsIds = [],
                tRecentCreationTime,
                tRecentCreationTimeFormatted,
                tTempCreationTime,
                tTempCreationTimeFormatted,
                index,
                i,
                oNotificationItem,
                bNotificationItemsRemoved = false,
                iMissingPreviewNotificationCount = iRequiredNotificationsNumber - aRecentNotificationsArray.length - 1;

            sap.ushell.Container.getService("Notifications").getNotifications().done(function (aNotifications) {
                if (!aNotifications) {
                    return;
                }

                var oNotificationsPreview = sap.ui.getCore().byId("notifications-preview-container"),
                    viewPortContainer;

                if (!this.isNotificationPreviewLoaded) {
                    oNotificationsPreview.setEnableBounceAnimations(true);
                }
                // remove from the preview notifications panel notifications that the user dismissed in the notifications view
                if (aRecentNotificationsArray && aRecentNotificationsArray.length) {
                    for (index = 0; index < aRecentNotificationsArray.length; index++) {
                        var sOriginalNotificationItemId = aRecentNotificationsArray[index].originalItemId,
                            bNotificationExists = false;

                        for (i = 0; i < aNotifications.length; i++) {
                            if (aNotifications[i].Id === sOriginalNotificationItemId) {
                                bNotificationExists = true;
                                break;
                            }
                            if (aRecentNotificationsArray[index].originalTimestamp > aNotifications[i].CreatedAt) {
                                break;
                            }
                        }

                        if (!bNotificationExists) {
                            aRecentNotificationsArray.splice(index, 1);
                            bNotificationItemsRemoved = true;
                            index--;
                        }
                    }
                }
                // Getting the time stamp of the previous most recent notification in case of new notification
                if (aRecentNotificationsArray && aRecentNotificationsArray.length > 0) {
                    tRecentCreationTime = aRecentNotificationsArray[0].originalTimestamp;
                    tRecentCreationTimeFormatted = sap.ushell.Container.getService("Notifications")._formatAsDate(tRecentCreationTime);
                }

                // From the given notifications - get the first five (up to five, actually) that:
                // - Have CteatedAt time stamp higher (i.e. more recent) than the previous most recent one
                for (index = 0; (index < aNotifications.length) && (iTempRequiredNotificationsNumber < iRequiredNotificationsNumber); index++) {
                    tTempCreationTime = aNotifications[index].CreatedAt;
                    tTempCreationTimeFormatted = sap.ushell.Container.getService("Notifications")._formatAsDate(tTempCreationTime);
                        if ((tRecentCreationTimeFormatted ? tTempCreationTimeFormatted > tRecentCreationTimeFormatted : true)) {
                        aNewNotifications[iTempRequiredNotificationsNumber] = aNotifications[index];
                        iTempRequiredNotificationsNumber++;
                    }
                }

                // case of dismiss notification need to bring "old" notification
                var newNotificationsCount = aNewNotifications.length;
                if (aRecentNotificationsArray && aRecentNotificationsArray.length > 0 && aRecentNotificationsArray.length < iRequiredNotificationsNumber && aNotifications.length > aRecentNotificationsArray.length) {
                    tRecentCreationTime = aRecentNotificationsArray[aRecentNotificationsArray.length - 1].originalTimestamp;
                    tRecentCreationTimeFormatted = sap.ushell.Container.getService("Notifications")._formatAsDate(tRecentCreationTime);
                    iTempRequiredNotificationsNumber = 0;
                    for (index = 0; (index < aNotifications.length) && (iTempRequiredNotificationsNumber <= iMissingPreviewNotificationCount); index++) {
                        tTempCreationTime = aNotifications[index].CreatedAt;
                        tTempCreationTimeFormatted = sap.ushell.Container.getService("Notifications")._formatAsDate(tTempCreationTime);
                        if ( tTempCreationTimeFormatted < tRecentCreationTimeFormatted ) {
                            aNewNotifications[newNotificationsCount + iTempRequiredNotificationsNumber] = aNotifications[index];
                            iTempRequiredNotificationsNumber++;
                        }
                    }
                }
                // Check if there are any new notification objects, if not - return
                if (aNewNotifications.length === 0 && !bNotificationItemsRemoved) {
                    this._disableNotificationPreviewBouncingAnimation(oNotificationsPreview);
                    return;
                }

                // Create new notification items, and store only their Id
                for (i = 0; i < aNewNotifications.length; i++) {
                    oNotificationItem = new sap.m.NotificationListItem ({
                        hideShowMoreButton: true,
                        title:  aNewNotifications[i].SensitiveText ? aNewNotifications[i].SensitiveText : aNewNotifications[i].Text,
                        description:aNewNotifications[i].SubTitle ,
                        datetime: utils.formatDate(aNewNotifications[i].CreatedAt),
                        priority: sap.ui.core.Priority[aNewNotifications[i].Priority.charAt(0) + aNewNotifications[i].Priority.substr(1).toLowerCase()],
                        press: function (oEvent) {
                            var sNotificationPathInModel = this.getBindingContext().getPath(),
                                aPathParts = sNotificationPathInModel.split("/"),
                                sPathToNotification = "/" + aPathParts[1] + "/" + aPathParts[2],
                                oNotificationModelEntry = this.getModel().getProperty(sPathToNotification),
                                sSemanticObject = oNotificationModelEntry.NavigationTargetObject,
                                sAction = oNotificationModelEntry.NavigationTargetAction,
                                aParameters = oNotificationModelEntry.NavigationTargetParams,
                                sNotificationId = oNotificationModelEntry.originalItemId,
                                oNotificationsService = sap.ushell.Container.getService("Notifications");
                            utils.toExternalWithParameters(sSemanticObject, sAction, aParameters);
                            var oPromise = oNotificationsService.markRead(sNotificationId);
                            oPromise.fail(function () {
                                sap.ushell.Container.getService('Message').error(sap.ushell.resources.i18n.getText('notificationsFailedMarkRead'));
                            });
                        },
                        close: function (oEvent) {
                            var sNotificationPathInModel = this.getBindingContext().getPath(),
                                aPathParts = sNotificationPathInModel.split("/"),
                                sPathToNotification = "/" + aPathParts[1] + "/" + aPathParts[2],
                                oNotificationModelEntry = this.getModel().getProperty(sPathToNotification),
                                sNotificationId = oNotificationModelEntry.originalItemId,
                                aRecentNotificationsArray = that.getView().getModel().getProperty("/previewNotificationItems"),
                                oNotificationsService = sap.ushell.Container.getService("Notifications"),
                                oPromise = oNotificationsService.dismissNotification(sNotificationId);

                            oPromise.done(function () {
                                //remove item from the notifications preview model
                                var i;

                                for (i = 0; i < aRecentNotificationsArray.length; i++) {
                                    if (aRecentNotificationsArray[i].originalItemId === sNotificationId) {
                                        break;
                                    }
                                }
                                aRecentNotificationsArray.splice(i, 1);
                                that.getView().getModel().setProperty("/previewNotificationItems", aRecentNotificationsArray);
                            });

                            oPromise.fail(function () {
                                sap.ushell.Container.getService('Message').error(sap.ushell.resources.i18n.getText('notificationsFailedDismiss'));
                                that.getView().getModel().setProperty("/previewNotificationItems", aRecentNotificationsArray);
                            });
                        }

                    }).addStyleClass("sapUshellNotificationsListItem");

                    aNewNotificationsIds.push({
                        previewItemId: oNotificationItem.getId(),
                        originalItemId: aNewNotifications[i].Id,
                        originalTimestamp: aNewNotifications[i].CreatedAt,
                        NavigationTargetObject: aNewNotifications[i].NavigationTargetObject,
                        NavigationTargetAction: aNewNotifications[i].NavigationTargetAction,
                        NavigationTargetParams: aNewNotifications[i].NavigationTargetParams
                    });

                    //don't show preview notification when notification view is active

                    viewPortContainer = sap.ui.getCore().byId('viewPortContainer');

                    if (viewPortContainer.getCurrentState() === "RightCenter") {
                        oNotificationItem.addStyleClass("sapUshellRightFloatingContainerItemBounceOut");
                    }
                }

                // Check if there were any notifications in the model's previewNotificationItems property,
                // if not - simply assign the new ones
                if (aRecentNotificationsArray.length === 0) {
                    that.getView().getModel().setProperty("/previewNotificationItems", aNewNotificationsIds);
                    this._disableNotificationPreviewBouncingAnimation(oNotificationsPreview);
                    return;
                }

                // For each new notification - remove an old one from the model (if there are already 5) and add the new one
                // The For loop counts backwards since the aNewNotifications has the most recent object in index 0
                //  and we would like to be the last that is put in previewNotificationItems
                for (index = aNewNotificationsIds.length - 1; index > -1; index--) {

                    // there may be temporary situation where the recent-array size is larger then the max allowed number
                    // as the redundant notifications are popped out using time-out of one second
                    if (aRecentNotificationsArray.length >= iRequiredNotificationsNumber) {
                        setTimeout(function () {
                            aRecentNotificationsArray.pop();
                            that.getView().getModel().setProperty("/previewNotificationItems", aRecentNotificationsArray);
                        }, 1000);
                    }
                    if (aNewNotificationsIds[index].originalTimestamp > aRecentNotificationsArray[0].originalTimestamp) {
                        aRecentNotificationsArray.unshift(aNewNotificationsIds[index]);
                    } else {
                        aRecentNotificationsArray.push(aNewNotificationsIds[index]);
                    }
                }
                that.getView().getModel().setProperty("/previewNotificationItems", aRecentNotificationsArray);
                this._disableNotificationPreviewBouncingAnimation(oNotificationsPreview);

            }.bind(this)).fail(function () {
            });
        },

        _disableNotificationPreviewBouncingAnimation: function (oNotificationsPreview) {
            if (!this.isNotificationPreviewLoaded) {
                this.isNotificationPreviewLoaded = true;
                oNotificationsPreview.setEnableBounceAnimations(false);
            }
        },

        _publishAsync: function (sChannelId, sEventId, oData) {
            var oBus = sap.ui.getCore().getEventBus();
            window.setTimeout(jQuery.proxy(oBus.publish, oBus, sChannelId, sEventId, oData), 1);
        },
        _changeGroupVisibility: function (oGroupBindingCtx) {
            var sBindingCtxPath = oGroupBindingCtx.getPath(),
                oModel = oGroupBindingCtx.getModel(),
                bGroupVisibilityState = oModel.getProperty(sBindingCtxPath + '/isGroupVisible'),
                oView = this.getView();
            oModel.setProperty(sBindingCtxPath + '/isGroupVisible', !bGroupVisibilityState);
            oView.oAnchorNavigationBar.updateVisibility();
        },

        //Persist the group visibility changes (hidden groups) in the back-end upon deactivation of the Actions Mode.
        _handleGroupVisibilityChanges: function (sChannelId, sEventId, aOrigHiddenGroupsIds) {
            var oLaunchPageSrv = sap.ushell.Container.getService('LaunchPage'),
                oModel = this.getView().getModel(),
                aCurrentHiddenGroupsIds = utils.getCurrentHiddenGroupIds(oModel),
                bSameLength = aCurrentHiddenGroupsIds.length === aOrigHiddenGroupsIds.length,
                bIntersect = bSameLength,
                oPromise;

            //Checks whether there's a symmetric difference between the current set of hidden groups and the genuine one
            aCurrentHiddenGroupsIds.some(function (sHiddenGroupId, iIndex) {
                if (!bIntersect) {
                    return true;
                }
                bIntersect = jQuery.inArray(sHiddenGroupId, aOrigHiddenGroupsIds) !== -1;

                return !bIntersect;
            });

            if (!bIntersect) {
                oPromise = oLaunchPageSrv.hideGroups(aCurrentHiddenGroupsIds);
                oPromise.done(function () {
                    oModel.updateBindings('groups');
                }.bind(this));
                oPromise.fail(function () {
                    var msgService = sap.ushell.Container.getService('Message');

                    msgService.error(sap.ushell.resources.i18n.getText('hideGroups_error'));
                });
            }
        },

        _updateShellHeader: function () {
            if (!this.oShellUIService) {
                this._initializeShellUIService();
            } else {
                // As the Dashboard is currently the default page for the Shell, we call set title and set hierarchy with no value
                // so the default value will be set
                this.oShellUIService.setTitle();
                this.oShellUIService.setHierarchy();
            }

        },

        _initializeShellUIService: function () {
            return sap.ui.require(["sap/ushell/ui5service/ShellUIService"], function (ShellUIService) {
                this.oShellUIService = new ShellUIService({
                    scopeObject: this.getOwnerComponent(),
                    scopeType: "component"
                });
                // As the Dashboard is currently the default page for the Shell, we call set title and set hierarchy with no value
                // so the default value will be set
                this.oShellUIService.setTitle();
                this.oShellUIService.setHierarchy();
                return this.oShellUIService;
            }.bind(this));
        },

        _deactivateActionModeInTabsState : function () {
            var oView = this.getView(),
                oModel = oView.getModel();
            // First reset the isGroupSelected property for all groups.
            var aGroups = oModel.getProperty("/groups");
            for (var i = 0; i < aGroups.length; i++) {
                oModel.setProperty("/groups/" + i + "/isGroupSelected", false);
            }

            var selectedIndex = oView.oAnchorNavigationBar.getSelectedItemIndex();

            var iHiddenGroupsCount = 0;
            // If the selected group is a hidden group, go to the first visible group
            if (!this._isGroupVisible(selectedIndex)) {
                for (var i = 0; i < aGroups.length; i++) {
                    if (!this._isGroupVisible(i)) {
                        iHiddenGroupsCount++;
                    } else {
                        selectedIndex = i;
                        break;
                    }
                }
            } else {
                // Count all hidden groups that are located before the selected group
                for (var i = 0; i < selectedIndex; i++) {
                    if (!this._isGroupVisible(i)) {
                        iHiddenGroupsCount++;
                    }
                }
            }

            // Fix the selected index not to include the hidden groups
            var fixedIndex = selectedIndex - iHiddenGroupsCount;
            // Change the anchor bar selection
            oView.oAnchorNavigationBar.adjustItemSelection(fixedIndex);
            oView.oAnchorNavigationBar.setSelectedItemIndex(fixedIndex);

            // Set the selected group and then filter
            oModel.setProperty("/groups/" + selectedIndex + "/isGroupSelected", true);
            oView.oDashboardGroupsBox.removeLinksFromAllGroups();
            oView.oDashboardGroupsBox.getBinding("groups").filter([oView.oFilterSelectedGroup]);
        },

        _isGroupVisible : function (groupIndex) {
            var aGroups = this.getView().getModel().getProperty("/groups");
            return (aGroups[groupIndex].isGroupVisible && aGroups[groupIndex].visibilityModes[0]);
        }
    });


}, /* bExport= */ false);
