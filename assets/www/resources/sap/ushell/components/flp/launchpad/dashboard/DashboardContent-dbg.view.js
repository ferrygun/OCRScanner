// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The Fiori launchpad main view.<br>
 * The view is of type <code>sap.ui.jsview</code> that includes a <code>sap.m.page</code>
 * with a header of type <code>sap.ushell.ui.launchpad.AnchorNavigationBar</code>
 * and content of type <code>sap.ushell.ui.launchpad.DashboardGroupsContainer</code>.
 *
 * @version 1.52.4
 * @name sap.ushell.components.flp.launchpad.dashboard.DashboardContent.view
 * @private
 */
sap.ui.define([
		'sap/ushell/Layout',
		'./DashboardGroupsBox',
		'sap/ushell/override',
		'sap/ushell/resources',
		'sap/ushell/ui/launchpad/AnchorItem',
		'sap/ushell/ui/launchpad/Tile',
		'sap/ushell/ui/launchpad/TileContainer',
		'sap/ushell/ui/shell/RightFloatingContainer'
	], function(Layout, DashboardGroupsBox, override, resources, AnchorItem, Tile, TileContainer, RightFloatingContainer) {
	"use strict";

    /*global jQuery, sap, document, self */
    /*jslint plusplus: true, nomen: true, vars: true */

    sap.ui.jsview("sap.ushell.components.flp.launchpad.dashboard.DashboardContent", {

        /**
         * Creating the content of the main dashboard view.
         * The view is basically a sap.m.Page control that contains:
         *  - AnchorNavigationBar as header.
         *  - DashboardGroupsBox that contains the groups and tiles as content.
         */
        createContent: function (oController) {
            var oDashboardGroupsBoxModule,
                oViewPortContainer = sap.ui.getCore().byId("viewPortContainer"),
                bConfigEnableNotificationsPreview,
                oDashboardManager = sap.ushell.components.flp.launchpad.getDashboardManager ? sap.ushell.components.flp.launchpad.getDashboardManager() : undefined,
                that = this;

            this.isTouch = sap.ui.Device.system.combi ? false : (sap.ui.Device.system.phone || sap.ui.Device.system.tablet);
            this.isCombi = sap.ui.Device.system.combi;
            this.parentComponent = sap.ui.core.Component.getOwnerComponentFor(this);
            this.oModel = this.parentComponent.getModel();
            this.addStyleClass("sapUshellDashboardView");
            this.ieHtml5DnD = this.oModel.getProperty("/personalization") && oDashboardManager && oDashboardManager.isIeHtml5DnD();

            sap.ui.getCore().getEventBus().subscribe("launchpad", "contentRendered", this._onAfterDashboardShow, this);
            sap.ui.getCore().getEventBus().subscribe("launchpad", "initialConfigurationSet", this._onAfterDashboardShow, this);
            sap.ui.getCore().getEventBus().subscribe("launchpad", 'actionModeInactive', this._handleEditModeChange, this);
            sap.ui.getCore().getEventBus().subscribe("launchpad", 'actionModeActive', this._handleEditModeChange, this);
            sap.ui.getCore().getEventBus().subscribe("sap.ushell.services.Notifications", "enablePreviewNotificationChanged", this._enablePreviewNotificationChanged, this);
            sap.ui.getCore().getEventBus().subscribe("sap.ushell", "coreResourcesFullyLoaded", this._enableAnchorBarOverflowAndCreateFooter, this);


            sap.ui.getCore().byId('navContainerFlp').attachAfterNavigate(this.onAfterNavigate, this);

            this.addEventDelegate({
                onBeforeFirstShow: function () {
                    var oDashboardManager = sap.ushell.components.flp.launchpad.getDashboardManager();
                    oDashboardManager.loadPersonalizedGroups();
                    this.onAfterNavigate();
                }.bind(this),
                onAfterShow: function () {
                    //in case we came back from the catalog, and groups were added to home page
                    this.getController()._addBottomSpace();
                    //Removed untill the shellModel will know how to handle the viewport, This is causeing the notifications not to appear when in the meArea.
//                    sap.ushell.Container.getRenderer('fiori2').showRightFloatingContainer(false);
                    // call to update shell header title
                    this.getController()._updateShellHeader();
                    this._onAfterDashboardShow();
                }.bind(this),
                onAfterHide: function (evt) {
                }
            });

            // Create that AnchorNavigationBar object - the header of the dashboard page
            this.oAnchorNavigationBar = this._getAnchorNavigationBar(oController);

            oDashboardGroupsBoxModule = new DashboardGroupsBox();
            // Create the DashboardGroupsBox object that contains groups and tiles
            this.oDashboardGroupsBox = oDashboardGroupsBoxModule.createGroupsBox(oController, this.oModel);

            // If NotificationsPreview is enabled by configuration and by the user - then shifting the scaled center viewPort (when moving ot he right viewport) is also enabled.
            // When notification preview in rendered  the dashboard is smaller in width,
            // hence, when it is being scaled it also needs to be shifted in order to "compensate" for the area of the notifications preview
            bConfigEnableNotificationsPreview = this._previewNotificationEnabled();
            if (oViewPortContainer) {
                oViewPortContainer.shiftCenterTransitionEnabled(bConfigEnableNotificationsPreview);
            }

            var fnUpdateAggregation = function (sName) {
                /*jslint nomen: true */
                var oBindingInfo = this.mBindingInfos[sName],
                    oAggregationInfo = this.getMetadata().getJSONKeys()[sName],
                    oClone;

                jQuery.each(this[oAggregationInfo._sGetter](), jQuery.proxy(function (i, v) {
                    this[oAggregationInfo._sRemoveMutator](v);
                }, this));
                jQuery.each(oBindingInfo.binding.getContexts(), jQuery.proxy(function (i, v) {
                    oClone = oBindingInfo.factory(this.getId() + "-" + i, v) ? oBindingInfo.factory(this.getId() + "-" + i, v).setBindingContext(v, oBindingInfo.model) : "";
                    this[oAggregationInfo._sMutator](oClone);
                }, this));
            };

            this.oPreviewNotificationsContainerPlaceholder = new RightFloatingContainer({
                id: 'notifications-preview-container-placeholder',
                visible: {
                    path: '/enableNotificationsPreview',
                    formatter: function (bVisible) {
                        return that._handleNotificationsPreviewVisibility.apply(that, [bVisible]);
                    }
                }
            }).addStyleClass('sapUshellPreviewNotificationsConainer');
            this.oPreviewNotificationsContainer = new RightFloatingContainer({
                id: 'notifications-preview-container',
                top: 4,
                right: '1rem',
                actAsPreviewContainer: true,
                floatingContainerItems: {
                    path: "/previewNotificationItems",
                    factory: function (functionId, oContext) {
                        return sap.ui.getCore().byId(oContext.getObject().previewItemId);
                    }
                },
                insertItemsWithAnimation: {
                    path: '/animationMode',
                    formatter: function (sAnimationMode) {
                        return sAnimationMode !== 'minimal';
                    }
                },
                visible: {
                    path: '/enableNotificationsPreview',
                    formatter: this._handleNotificationsPreviewVisibility.bind(this)
                }
            }).addStyleClass('sapContrastPlus')
                .addStyleClass('sapContrast');
            this.oPreviewNotificationsContainer.updateAggregation = fnUpdateAggregation;

            this.oFilterSelectedGroup = new sap.ui.model.Filter("isGroupSelected", sap.ui.model.FilterOperator.EQ, true);

            this.oPage = new sap.m.Page('sapUshellDashboardPage', {
                customHeader: this.oAnchorNavigationBar,
                content: [
                    this.oDashboardGroupsBox
                ]
            });

            var fOrigAfterRendering = this.oPage.onAfterRendering;
            this.oPage.onAfterRendering = function () {
                if (fOrigAfterRendering) {
                    fOrigAfterRendering.apply(this, arguments);
                }
                var oDomRef = this.getDomRef(),
                    oScrollableElement = oDomRef.getElementsByTagName('section');

                jQuery(oScrollableElement[0]).off("scrollstop", oController.handleDashboardScroll);
                jQuery(oScrollableElement[0]).on("scrollstop", oController.handleDashboardScroll);
            };

            //we need to make sure that core ext is loaded to avoid additional requests for resorces
            //therefore we check if core ext is already loaded, if not we will disable the oveflow button
            //till it will be loaded
            if (!!jQuery.sap.isDeclared('sap.fiori.core-ext-light', true)){
                this._enableAnchorBarOverflowAndCreateFooter();
            }


            return [
                this.oPage,
                this.oPreviewNotificationsContainerPlaceholder,
                this.oPreviewNotificationsContainer
            ];
        },

        _handleNotificationsPreviewVisibility: function (bEnableNotificationsPreview) {
            var oRenderer = sap.ushell.Container.getRenderer('fiori2'),
                sCurrentViewPortState = oRenderer.getCurrentViewportState(),
                bIsCenter = sCurrentViewPortState === 'Center',
                oNotificationSrvc = sap.ushell.Container.getService('Notifications');

            this.oDashboardGroupsBox.toggleStyleClass('sapUshellDashboardGroupsContainerSqueezed', bEnableNotificationsPreview);
            this.oAnchorNavigationBar.toggleStyleClass('sapUshellAnchorNavigationBarSqueezed', bEnableNotificationsPreview);
            bEnableNotificationsPreview = bEnableNotificationsPreview && bIsCenter;
            if (bEnableNotificationsPreview) {
                if (!this.bNotificationsRegistered) {
                    oNotificationSrvc.registerNotificationsUpdateCallback(this.oController._notificationsUpdateCallback.bind(this.oController));
                    this.bNotificationsRegistered = true;
                }
                // If the first Notifications read already happened, then this registration is too late and we missed the data of the first read
                if (oNotificationSrvc.isFirstDataLoaded()) {
                    setTimeout(function () {
                        if (this.oController && this.oController._notificationsUpdateCallback) {
                            this.oController._notificationsUpdateCallback();
                        }
                    }.bind(this), 300);
                }
                if (!this.bSubscribedToViewportStateSwitch) {
                    this.bHeadsupNotificationsInitialyVisible = oRenderer.getRightFloatingContainerVisibility();
                    sap.ui.getCore().getEventBus().subscribe("launchpad", "afterSwitchState", this._handleViewportStateSwitch, this);
                    this.bSubscribedToViewportStateSwitch = true;
                }
                //this._handleHeadsupNotificationsPresentation(sCurrentViewPortState);
            }

            return bEnableNotificationsPreview;
        },

        // *********************************************************************************************
        // *************************** AnchorNavigationBar functions - Begin ***************************

        _fOnAfterAnchorBarRenderingHandler: function (oEvent) {
            var xRayEnabled = this.getModel() && this.getModel().getProperty('/enableHelp');
            if (this.getDefaultGroup()) {
                // if xRay is enabled
                if (xRayEnabled) {
                    this.addStyleClass("help-id-homeAnchorNavigationBarItem"); //xRay help ID
                }
            } else {
                // if xRay is enabled
                if (xRayEnabled) {
                    this.addStyleClass("help-id-anchorNavigationBarItem"); //xRay help ID
                }
            }
        },

        _getAnchorItemTemplate: function () {
            var oAnchorItemTemplate = new AnchorItem({
                index : "{index}",
                title: "{title}",
                groupId: "{groupId}",
                defaultGroup : "{isDefaultGroup}",
                selected: false,
                isGroupRendered: "{isRendered}",
                visible: {
                    parts: ["/tileActionModeActive", "isGroupVisible", "visibilityModes"],
                    formatter: function (tileActionModeActive, isGroupVisible, visibilityModes) {
                        //Empty groups should not be displayed when personalization is off or if they are locked or default group not in action mode
                        if (!visibilityModes[tileActionModeActive ? 1 : 0]) {
                            return false;
                        }
                        return isGroupVisible || tileActionModeActive;
                    }
                },
                locked: "{isGroupLocked}",
                isGroupDisabled: {
                    parts: ['isGroupLocked', '/isInDrag', '/homePageGroupDisplay'],
                    formatter: function (bIsGroupLocked, bIsInDrag, sAnchorbarMode) {
                        return bIsGroupLocked && bIsInDrag && sAnchorbarMode === 'tabs';
                    }
                },
                afterRendering : this._fOnAfterAnchorBarRenderingHandler
            });
            return oAnchorItemTemplate;
        },

        _getAnchorNavigationBar: function (oController) {
            var oAnchorItemTemplate = this._getAnchorItemTemplate(),
                oAnchorNavigationBar = new sap.ushell.ui.launchpad.AnchorNavigationBar("anchorNavigationBar", {
                    selectedItemIndex: "{/topGroupInViewPortIndex}",
                    itemPress: [ function (oEvent) {
                        this._handleAnchorItemPress(oEvent);
                    }, oController ],
                    groups: {
                        path: "/groups",
                        template: oAnchorItemTemplate
                    },
                    overflowEnabled: false //we will enable the overflow once coreExt will be loaded!!!
                });
            oAnchorNavigationBar = this._extendAnchorNavigationBar(oAnchorNavigationBar);
            oAnchorNavigationBar.addStyleClass("sapContrastPlus");
            oAnchorItemTemplate.attachBrowserEvent("focus", function () {
                oAnchorNavigationBar.setNavigationBarItemsVisibility();
            });
            return oAnchorNavigationBar;
        },

        _extendAnchorNavigationBar: function (oAnchorNavigationBar) {
            var oExtendedAnchorNavigationBar = jQuery.extend(oAnchorNavigationBar, {
                onsapskipforward: function (oEvent) {
                    oEvent.preventDefault();
                    sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                    sap.ushell.components.flp.ComponentKeysHandler.goToTileContainer(oEvent, this.bGroupWasPressed);
                    this.bGroupWasPressed = false;
                },
                onsaptabnext: function (oEvent) {
                    oEvent.preventDefault();
                    var jqFocused = jQuery(":focus");
                    if (!jqFocused.parent().parent().siblings().hasClass("sapUshellAnchorItemOverFlow") ||
                        (jqFocused.parent().parent().siblings().hasClass("sapUshellAnchorItemOverFlow") &&
                        jqFocused.parent().parent().siblings().hasClass("sapUshellShellHidden"))) {
                        sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                        sap.ushell.components.flp.ComponentKeysHandler.goToTileContainer(oEvent);
                        this.bGroupWasPressed = false;
                    } else {
                        var jqElement = jQuery(".sapUshellAnchorItemOverFlow button");
                        jqElement.focus();
                    }
                },
                onsapskipback: function (oEvent) {
                    oEvent.preventDefault();
                    sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                    sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                },
                onsaptabprevious: function (oEvent) {
                    oEvent.preventDefault();
                    var jqFocused = jQuery(":focus");
                    if (!jqFocused.parent().hasClass("sapUshellAnchorItemOverFlow")) {
                        sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                        sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                    } else {
                        var jqElement = jQuery(".sapUshellAnchorItem:visible:first");
                        if (!jqElement.length) {
                            sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                        } else {
                            sap.ushell.components.flp.ComponentKeysHandler.goToSelectedAnchorNavigationItem();
                        }
                    }
                },
                onsapenter: function (oEvent) {
                    oEvent.srcControl.getDomRef().click();
                },
                onsapspace: function (oEvent) {
                    oEvent.srcControl.getDomRef().click();
                }
            });
            return oExtendedAnchorNavigationBar;
        },

        // **************************** AnchorNavigationBar functions - End ****************************
        // *********************************************************************************************

        _addActionModeButtonsToDashboard: function () {
            if (sap.ushell.components.flp.ActionMode) {
                sap.ushell.components.flp.ActionMode.init(this.getModel());
            }
        },

        _createActionModeMenuButton : function () {
            var that = this,
                oAddActionButtonParameters = {},
                oActionButtonPromise,
                oActionButtonObjectData = {
                    id: "ActionModeBtn",
                    text: resources.i18n.getText("activateEditMode"),
                    icon: 'sap-icon://edit',
                    press: function () {
                        this.oDashboardGroupsBox.getBinding("groups").filter([]);
                        var dashboardGroups = this.oDashboardGroupsBox.getGroups();
                        sap.ushell.components.flp.ActionMode.toggleActionMode(this.oModel, "Menu Item", dashboardGroups);
                        this.oAnchorNavigationBar.updateVisibility();
                        var view = sap.ui.getCore().byId('viewPortContainer');
                        if(view.getCurrentState() !=  "Center"){
                            sap.ui.getCore().byId("viewPortContainer").switchState("Center");
                        }
                        if (this.oModel.getProperty("/homePageGroupDisplay")) {
                            if (this.oModel.getProperty("/tileActionModeActive")) { // To edit mode
                                if (this.oModel.getProperty("/homePageGroupDisplay") === "tabs") {
//                                    this.oDashboardGroupsBox.removeLinksFromUnselectedGroups();
                                    this.oDashboardGroupsBox.getBinding("groups").filter([]);
                                    // find the selected group
                                    var aGroups = this.oModel.getProperty("/groups"),
                                        selectedGroup;
                                    for (var i = 0; i < aGroups.length; i++) {
                                        if (aGroups[i].isGroupSelected) {
                                            selectedGroup = i;
                                            break;
                                        }
                                    }
                                    // scroll to selected group
                                    this.getController()._scrollToGroup("launchpad", "scrollToGroup", {
                                        group: {
                                            getGroupId: function () {
                                                return aGroups[selectedGroup].groupId
                                            }
                                        },
                                        groupChanged: false,
                                        focus: true
                                    });
                                } else {
                                    this.oDashboardGroupsBox.getBinding("groups").filter([]);
                                }
                            } else { // To non-edit mode
                                this.getController()._deactivateActionModeInTabsState();
                            }
                        }
                    }.bind(this)
                };
            //in case the edit home page button was moved to the shell header, it was already created as an icon only in shell.model.js so it will be shown immidiatly in the header.
            //only here we have access to the text and press method
            this.oTileActionsButton = sap.ui.getCore().byId(oActionButtonObjectData.id);
            if(this.oTileActionsButton && this.oTileActionsButton.data("isShellHeader")){
                jQuery.sap.measure.start("FLP:DashboardContent,view._createActionModeMenuButton", "attach press and text to edit home page button","FLP");
                this.oTileActionsButton.setTooltip(oActionButtonObjectData.text);
                this.oTileActionsButton.setText(oActionButtonObjectData.text);
                this.oTileActionsButton.attachPress(oActionButtonObjectData.press);
                jQuery.sap.measure.end("FLP:DashboardContent,view._createActionModeMenuButton");
            }
            else{
                oAddActionButtonParameters.controlType = "sap.ushell.ui.launchpad.ActionItem";
                oAddActionButtonParameters.oControlProperties = oActionButtonObjectData;
                oAddActionButtonParameters.bIsVisible = true;
                oAddActionButtonParameters.bCurrentState = true;

                oAddActionButtonParameters.controlType = "sap.ushell.ui.launchpad.ActionItem";
                oAddActionButtonParameters.oControlProperties = oActionButtonObjectData;
                oAddActionButtonParameters.bIsVisible = true;
                oAddActionButtonParameters.bCurrentState = true;

                oActionButtonPromise = sap.ushell.Container.getRenderer("fiori2").addUserAction(oAddActionButtonParameters).done(function (oActionButton) {
                    that.oTileActionsButton = oActionButton;
                    // if xRay is enabled
                    if (that.oModel.getProperty("/enableHelp")) {
                        that.oTileActionsButton.addStyleClass('help-id-ActionModeBtn');// xRay help ID
                    }
                });
            }
        },

        _handleEditModeChange: function () {
            if (this.oTileActionsButton) {
                this.oTileActionsButton.toggleStyleClass('sapUshellAcionItemActive');
            }
        },

        _enablePreviewNotificationChanged: function (sChannelId, sEventId, oData) {
            this.oModel.setProperty("/userEnableNotificationsPreview", oData.bPreviewEnabled);
        },

        /**
         * In order to minimize core-min we delay the footer creation and enabling anchorBar overflow
         * till core-ext file will be loaded.
         * This is done so Popover, OverflowToolbal, List and other controls will bondled with core-ext
         * and not core-min
         */
        _enableAnchorBarOverflowAndCreateFooter: function (sChannelId, sEventId, oData) {
            if (this.oFooter){
                return;
            }

            this.oAnchorNavigationBar.setOverflowEnabled(true);

            this.oDoneBtn = new sap.m.Button('sapUshellDashboardFooterDoneBtn', {
                type: sap.m.ButtonType.Emphasized,
                text : resources.i18n.getText("closeEditMode"),
                tooltip: resources.i18n.getText("doneBtnTooltip"),
                press: function () {
                    jQuery("#sapUshellDashboardPage .sapUshellAnchorNavigationBarSqueezed").toggleClass("sapUshellAnchorBarEditMode");
                    var dashboardGroups = this.oDashboardGroupsBox.getGroups();
                    sap.ushell.components.flp.ActionMode.toggleActionMode(this.oModel, "Menu Item", dashboardGroups);
                    this.oAnchorNavigationBar.updateVisibility();
                    if (this.oModel.getProperty("/homePageGroupDisplay") && this.oModel.getProperty("/homePageGroupDisplay") === "tabs") {
                        this.getController()._deactivateActionModeInTabsState();
                    }
                }.bind(this)
            });
            this.oDoneBtn.addEventDelegate({
                onsapskipforward: function(oEvent) {
                    oEvent.preventDefault();
                    sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                    sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                },
                onsapskipback: function(oEvent) {
                    oEvent.preventDefault();
                    sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                    sap.ushell.components.flp.ComponentKeysHandler.goToFirstVisibleTileContainer();
                },
                onsaptabprevious: function(oEvent) {
                    oEvent.preventDefault();
                    sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                    sap.ushell.components.flp.ComponentKeysHandler.goToFirstVisibleTileContainer();
                },
                onsaptabnext: function(oEvent) {
                    oEvent.preventDefault();
                    sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                    sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                }
            });
            this.oFooter = new  sap.m.OverflowToolbar('sapUshellDashboardFooter', {

                visible: {
                    parts: ['/tileActionModeActive', '/viewPortState'],
                    formatter: function (bActionModeActive, sCurrentViewPortState) {
                        return bActionModeActive && sCurrentViewPortState === 'Center';
                    }
                },
                layoutData: new sap.m.OverflowToolbarLayoutData({moveToOverflow: false}),
                content: [new sap.m.ToolbarSpacer(), this.oDoneBtn]
            });
            this.oPage.setFooter(this.oFooter);
            this.oPage.setFloatingFooter(true);
        },

        /**
         * Returns a boolean value indicating whether notifications preview is enabled by the configuration and by the user
         */
        _previewNotificationEnabled: function () {
            var bConfigEnableNotificationsPreview = this.oModel.getProperty("/configEnableNotificationsPreview"),
                bUserEnableNotificationsPreview = this.oModel.getProperty("/userEnableNotificationsPreview");

            return (bConfigEnableNotificationsPreview && bUserEnableNotificationsPreview);
        },

        _createActionButtons : function () {
            var bEnablePersonalization = this.oModel.getProperty("/personalization");
            // Create action mode button in the user actions menu
            if (bEnablePersonalization) {
                if (this.oModel.getProperty("/actionModeMenuButtonEnabled")) {
                    this._createActionModeMenuButton();
                }
            }
        },

        onAfterNavigate: function (oEvent) {
            var oNavContainerFlp = sap.ui.getCore().byId('navContainerFlp'),
                oCurrentViewName = oNavContainerFlp ? oNavContainerFlp.getCurrentPage().getViewName() : undefined,
                bInDashboard = oCurrentViewName == "sap.ushell.components.flp.launchpad.dashboard.DashboardContent",
                oRenderer = sap.ushell.Container.getRenderer("fiori2"),
                editHomePageBtn = sap.ui.getCore().byId("ActionModeBtn");
            //need to show the edit home page button if it is in the shellheader
            if( editHomePageBtn){
                if(editHomePageBtn.data){
                    if(editHomePageBtn.data("isShellHeader")){
                        editHomePageBtn.setVisible(true);
                    }
                }
            }
            //toggle the overflow container in the me area
            if(oRenderer.toggleOverFlowActions){
                oRenderer.toggleOverFlowActions();
            }
            if (bInDashboard) {
                oRenderer.createExtendedShellState("dashboardExtendedShellState", function () {
                    this._createActionButtons();
                    oRenderer.setHeaderHiding(false);

                    if (!sap.ui.Device.system.phone) {
                        oRenderer.showRightFloatingContainer(false);
                    }
                }.bind(this));

                this.getController()._setCenterViewPortShift();

                //Add action menu items
                this._addActionModeButtonsToDashboard();

                setTimeout(function () {
                    if (sap.ushell.Container) {
                        oRenderer.applyExtendedShellState("dashboardExtendedShellState");
                    }
                }, 0);

                if (this.oAnchorNavigationBar && this.oAnchorNavigationBar.anchorItems) {
                    this.oAnchorNavigationBar.setNavigationBarItemsVisibility();
                    this.oAnchorNavigationBar.adjustItemSelection(this.oAnchorNavigationBar.getSelectedItemIndex());
                }

                // in rare timing cases the activeElement is undefined thus causing an exception
                if (document.activeElement && document.activeElement.tagName === "BODY") {
                    //set focus back to the shell header
                    sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell();
                }

            }
        },

        _handleViewportStateSwitch: function (sChannelId, sEventId, oData) {
            var sCurrentViewportState = oData.getParameter('to');
            //this._handleHeadsupNotificationsPresentation(sCurrentViewportState);

            if (sCurrentViewportState == 'Center') {
                var oNotificationsPreviewContainer = sap.ui.getCore().byId("notifications-preview-container");
                if (oNotificationsPreviewContainer && oNotificationsPreviewContainer.setFloatingContainerItemsVisiblity) {
                    oNotificationsPreviewContainer.setFloatingContainerItemsVisiblity(true);
                }

            }
        },

        _handleHeadsupNotificationsPresentation : function (sCurrentViewPortState) {
            var oRenderer = sap.ushell.Container.getRenderer('fiori2'),
                bIsCenterViewportState = sCurrentViewPortState === 'Center',
                oPreviewNotificationsContainerDomRef = this.oPreviewNotificationsContainer.getDomRef(),
                oHeadsupNotificationsContainerBoundingRect = oPreviewNotificationsContainerDomRef && oPreviewNotificationsContainerDomRef.getBoundingClientRect(),
                bPreviewContainerNotInViewport = oHeadsupNotificationsContainerBoundingRect ? oHeadsupNotificationsContainerBoundingRect.bottom < 0 : false,
                bShowHeadsupNotificationsContainer = bIsCenterViewportState ? bPreviewContainerNotInViewport : this.bHeadsupNotificationsInitialyVisible;

            oRenderer.showRightFloatingContainer(bShowHeadsupNotificationsContainer);
        },

        _onAfterDashboardShow : function (oEvent) {
            var aJqTileContainers = jQuery('.sapUshellTileContainer:visible'),
                oNavContainerFlp = sap.ui.getCore().byId('navContainerFlp'),
                oCurrentViewName = oNavContainerFlp ? oNavContainerFlp.getCurrentPage().getViewName() : undefined,
                bIsInDashboard = oCurrentViewName == "sap.ushell.components.flp.launchpad.dashboard.DashboardContent",
                bTileActionsModeActive = this.oModel.getProperty('/tileActionModeActive'),
                oViewPortContainer,
                bPreviewNotificationsActive;

            if (bIsInDashboard) {
                if (!bTileActionsModeActive) {
                    sap.ushell.utils.handleTilesVisibility();
                    sap.ushell.utils.refreshTiles();
                    var iTopGroupInViewPortIndex = this.oModel.getProperty('/topGroupInViewPortIndex'),
                        jqTopGroupInViewPort = jQuery(aJqTileContainers[iTopGroupInViewPortIndex]),
                        jqLastFocusedTile = aJqTileContainers.find("li[class*='sapUshellTile']li[tabindex=0]"),
                        jqFirstTile = jqTopGroupInViewPort.find('.sapUshellTile:first'),
                        jqElementToFocus;

                    // if we have a last focused element - this is the element to focus
                    if (jqLastFocusedTile.length) {
                        jqElementToFocus = jqLastFocusedTile;
                    // if we do not have a last focused element - see if we have a tile (first of a group) to focus on
                    } else if (jqFirstTile.length) {
                        jqElementToFocus = jqFirstTile;
                    // no tiles exist - focus on config button
                    } else {
                        jqElementToFocus = jQuery("#configBtn");
                    }

                    // The ViewPortContainer needs to be notified whether Preview of NotificationsPreview is enabled or not,
                    //  since it has effect on the transition of the scaled center viewPort when switching to the right viewport
                    bPreviewNotificationsActive = this.oModel.getProperty('/enableNotificationsPreview');
                    oViewPortContainer = sap.ui.getCore().byId("viewPortContainer");
                    if (oViewPortContainer) {
                        oViewPortContainer.shiftCenterTransition(bPreviewNotificationsActive);
                    }

                    setTimeout(function() {
                        jqElementToFocus.focus();
                    }, 0);
                }
                this.onAfterNavigate();
            }
        },

        getControllerName: function () {
            return "sap.ushell.components.flp.launchpad.dashboard.DashboardContent";
        },

        _isInDeashboard: function () {
            var oNavContainer = sap.ui.getCore().byId("viewPortContainer"),
                oControl = sap.ui.getCore().byId("dashboardGroups");

            return ((oNavContainer.getCurrentCenterPage() === "application-Shell-home") && (oControl.getModel().getProperty("/currentViewName") === "home"));
        },

        exit: function () {
            if (this.oAnchorNavigationBar) {
                this.oAnchorNavigationBar.handleExit();
            }
            if (this.oTileActionsButton) {
                this.oTileActionsButton.destroy();
            }
            sap.ui.core.mvc.View.prototype.exit.apply(this, arguments);
            sap.ui.getCore().getEventBus().unsubscribe("launchpad", "contentRendered", this._onAfterDashboardShow, this);
            sap.ui.getCore().getEventBus().unsubscribe("launchpad", "initialConfigurationSet", this._onAfterDashboardShow, this);
            sap.ui.getCore().getEventBus().unsubscribe("launchpad", 'actionModeInactive', this._handleEditModeChange, this);
            sap.ui.getCore().getEventBus().unsubscribe("launchpad", 'actionModeActive', this._handleEditModeChange, this);
            sap.ui.getCore().getEventBus().unsubscribe("sap.ushell", "coreResourcesFullyLoaded", this._enableAnchorBarOverflowAndCreateFooter, this);
            if (this.bSubscribedToViewportStateSwitch) {
                sap.ui.getCore().getEventBus().unsubscribe("launchpad", "afterSwitchState", this._handleViewportStateSwitch, this);
                this.bSubscribedToViewportStateSwitch = false;
            }
        }
    });


}, /* bExport= */ false);
