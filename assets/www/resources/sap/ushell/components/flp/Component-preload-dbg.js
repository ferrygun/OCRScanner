jQuery.sap.registerPreloadedModules({
"name":"Component-preload",
"version":"2.0",
"modules":{
	"sap/ushell/components/flp/ActionMode.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview
 * Tile action mode implementation.
 *
 * In tile action mode the user can launch an action associated with a tile.
 * The mode is launched when clicking on one of the two activation buttons:
 * 1. In the user menu
 * 2. A floating button on the bottom-right corner on the launchpad.
 * Creation of the buttons depends on the following configuration properties:
 *  - enableActionModeMenuButton
 *  - enableActionModeFloatingButton
 *
 * Tile action mode can be activated only from the launchpad. it is not accessible from the catalog or from an application.
 * When the mode is active and the user clicks on a tile - the tile's corresponding actions are presented in an action sheet
 *  and the user can click/launch any of them.
 *
 * Every user action (e.g. menu buttons, drag-and-drop) except for clicking a tile - stops/deactivates the action mode.
 *
 * This module Contains the following:
 *  - Constructor function that creates action mode activation buttons
 *  - Activation handler
 *  - Deactivation handler
 *  - Rendering tile action menu
 *
 * @version 1.52.4
 */
/**
 * @namespace
 *
 * @name sap.ushell.components.flp.ActionMode
 *
 * @since 1.26.0
 * @private
 */
sap.ui.define([], function() {
	"use strict";

    /*global jQuery, sap, window, hasher, $ */
    /*jslint nomen: true */
    /**
     * Constructor function
     * Creates action mode activation buttons:
     *  1. A new button in the user menu
     *  2. A floating button
     */
    var ActionMode = function () {
            this.oEventBus = sap.ui.getCore().getEventBus();
            this.oEventBus.subscribe('launchpad', 'actionModeInactive', this.scrollToViewPoint, this);
            this.oEventBus.subscribe('launchpad', 'actionModeActive', this.scrollToViewPoint, this);

            this.viewPoint = undefined;

            this.init = function (oModel) {
                this.oModel = oModel;
            };
        };

   /**
    * Activation handler of tile actions mode 
    * 
    * Performs the following actions:
    * - Shows a toast message indicating the activated mode
    * - Sets the feature's model property to indicate that the feature is activated
    * - Registers deactivation click handler, called when the user clicks outside of a tile
    * - Adds the cover DIV to all tiles adding the mode's grey opacity and click handler for opening the actions menu
    * - Disables drag capability on tiles
    * - Changes the appearance of the floating activation button
    */
    ActionMode.prototype.activate = function () {
        var oTileActionsButton;

        this.oModel.setProperty('/tileActionModeActive', true);
        this.aOrigHiddenGroupsIds = sap.ushell.utils.getCurrentHiddenGroupIds(this.oModel);
        var oDashboardGroups = sap.ui.getCore().byId("dashboardGroups");
        oDashboardGroups.addLinksToUnselectedGroups();

        // Change action mode button display in the user actions menu
        oTileActionsButton = sap.ui.getCore().byId("ActionModeBtn");
        if (oTileActionsButton) {
            oTileActionsButton.setTooltip(sap.ushell.resources.i18n.getText("exitEditMode"));
            oTileActionsButton.setText(sap.ushell.resources.i18n.getText("exitEditMode"));
            if(oTileActionsButton.data("isShellHeader")){
                oTileActionsButton.setSelected(true);
            }
        }
        this.oEventBus.publish('launchpad', 'actionModeActive');
    };

    ActionMode.prototype.scrollToViewPoint = function () {
        var oData = this.viewPoint;
        oData.restoreLastFocusedTile = true;

        // if we switch from edit mode to non-edit mode
        if (!this.oModel.getProperty('/tileActionModeActive')) {

            // if before me switch to non-edit mode we were focused on the TileContainer header
            // we need to restore focus such as the tile that will be focused will belong to this group
            var jqLastFocusedHeader = jQuery(".sapUshellTileContainerHeader[tabindex=0]");
            if (jqLastFocusedHeader && jqLastFocusedHeader.length > 0) {
                var jqTileContainer = jqLastFocusedHeader[0].closest('.sapUshellTileContainer');
                if (jqTileContainer) {

                    // adding the focused header tile-container ID
                    oData.restoreLastFocusedTileContainerById = jqTileContainer.id;
                }
            }

        }

        oData.iDuration = 0;
        window.setTimeout(jQuery.proxy(this.oEventBus.publish, this.oEventBus, "launchpad", "scrollToGroup", oData), 0);
    };

    /**
     * Deactivation handler of tile actions mode
     *
     * Performs the following actions:
     * - Unregisters deactivation click handler
     * - Sets the feature's model property to indicate that the feature is deactivated
     * - Enables drag capability on tiles
     * - Destroys the tile actions menu control
     * - Removed the cover DIV from to all the tiles
     * - Adds the cover DIV to all tiles adding the mode's grey opacity and click handler for opening the actions menu
     * - Changes the appearance of the floating activation button
     */
    ActionMode.prototype.deactivate = function () {
        var tileActionsMenu = sap.ui.getCore().byId("TileActions"),
            oTileActionsButton;

        this.oModel.setProperty('/tileActionModeActive', false);
        this.oEventBus.publish("launchpad", 'actionModeInactive', this.aOrigHiddenGroupsIds);
        if (tileActionsMenu !== undefined) {
            tileActionsMenu.destroy();
        }
        sap.ui.require(['sap/m/MessageToast'],
            function (MessageToast) {
                MessageToast.show(sap.ushell.resources.i18n.getText("savedChanges"), {duration: 4000});
            });
        // Change action mode button display in the user actions menu
        oTileActionsButton = sap.ui.getCore().byId("ActionModeBtn");
        if (oTileActionsButton) {
            oTileActionsButton.setTooltip(sap.ushell.resources.i18n.getText("activateEditMode"));
            oTileActionsButton.setText(sap.ushell.resources.i18n.getText("activateEditMode"));
            if(oTileActionsButton.data("isShellHeader")) {
                oTileActionsButton.setSelected(false);
            }
        }
    };

    ActionMode.prototype.toggleActionMode = function (oModel, sSource, dashboardGroups) {
        var bTileActionModeActive = oModel.getProperty('/tileActionModeActive');
        var currentGroupIndex = oModel.getProperty('/topGroupInViewPortIndex');
        var sHomePageGroupDisplay = oModel.getProperty("/homePageGroupDisplay");
        if (!dashboardGroups) {
            dashboardGroups = [];
        }
        var visibleGroups = dashboardGroups.filter(function (group) {
            return group.getVisible();
        });

        var currentGroup = visibleGroups[currentGroupIndex];
        if (currentGroup) {
            var editModelDelta = bTileActionModeActive ? -49 : 49;
            var domRef = (sHomePageGroupDisplay === "tabs") ? dashboardGroups[0].getDomRef() : currentGroup.getDomRef();
            var groupScrolled = document.getElementById("sapUshellDashboardPage-cont").scrollTop - domRef.offsetTop;
            this.viewPoint = {
                group: visibleGroups[currentGroupIndex],
                fromTop: groupScrolled + editModelDelta
            };
        } else {
            this.viewPoint = {fromTop: 0};
        }


        if (bTileActionModeActive) {
            this.deactivate();
        } else {
            this.activate();
        }
    };

    /**
     * Apply action/edit mode CSS classes on a group.
     * This function is called when in edit/action mode and tiles were dragged,
     *  since the group is being re-rendered and the dashboard is still in action/edit mode
     */
    ActionMode.prototype.activateGroupEditMode = function (oGroup) {
        var jqGroupElement = jQuery(oGroup.getDomRef()).find('.sapUshellTileContainerContent');

        jqGroupElement.addClass("sapUshellTileContainerEditMode");
    };

   /**
    * Opens the tile menu, presenting the tile's actions
    *
    * Performs the following actions:
    * - Returning the clicked tile to its original appearance
    * - Tries to get an existing action sheet in case actions menu was already opened during this session of action mode 
    * - If this is the first time the user opens actions menu during this session of action mode - create a new action sheet
    * - Gets the relevant tile's actions from launch page service and create buttons accordingly
    * - Open the action sheet by the clicked tile
    *
    * @param oEvent Event object of the tile click action
    */
    ActionMode.prototype._openActionsMenu = function (oEvent, oView) {
        var that = this,
            oTileControl = oView ? oView : oEvent.getSource(),
            launchPageServ =  sap.ushell.Container.getService("LaunchPage"),
            aActions = [],
            oActionSheet = sap.ui.getCore().byId("TileActions"),
            index,
            noActionsButton,
            oButton,
            oAction,
            oTile,
            fnHandleActionPress,
            coverDiv,
            actionSheetIconInEditMode;

        if (oTileControl) {
            oTile = oTileControl.getBindingContext().getObject().object;
            aActions = launchPageServ.getTileActions(oTile);
        }
        that.oTileControl = oTileControl;
        jQuery(".sapUshellTileActionLayerDivSelected").removeClass("sapUshellTileActionLayerDivSelected");

        coverDiv = jQuery(oEvent.getSource().getDomRef()).find(".sapUshellTileActionLayerDiv");
        coverDiv.addClass("sapUshellTileActionLayerDivSelected");
        if (oActionSheet === undefined) {
            oActionSheet = new sap.m.ActionSheet("TileActions", {
                placement: sap.m.PlacementType.Bottom,
                afterClose: function () {
                    $(".sapUshellTileActionLayerDivSelected").removeClass("sapUshellTileActionLayerDivSelected");
                    var oEventBus = sap.ui.getCore().getEventBus();
                    oEventBus.publish("dashboard", "actionSheetClose", that.oTileControl);
                }
            });
        } else {
            oActionSheet.destroyButtons();
        }


        // in a locked group we do not show any action (this is here to prevent the tile-settings action added by Dynamic & Static tiles from being opened)
        // NOTE - when removeing this check (according to requirements by PO) - we must disable the tileSettings action in a different way
        if (aActions.length === 0 || oTileControl.oParent.getProperty("isGroupLocked")) {
            // Create a single button for presenting "Tile has no actions" message to the user
            noActionsButton = new sap.m.Button({
                text:  sap.ushell.resources.i18n.getText("tileHasNoActions"),
                enabled: false
            });
            oActionSheet.addButton(noActionsButton);
        } else {
            /*eslint-disable no-loop-func*/
            /*eslint-disable wrap-iife*/
            for (index = 0; index < aActions.length; index++) {
                oAction = aActions[index];
                // The press handler of a button (representing a single action) in a tile's action sheet
                fnHandleActionPress = function (oAction) {
                    return function () {
                        that._handleActionPress(oAction, oTileControl);
                    };
                }(oAction);
                oButton = new sap.m.Button({
                    text:  oAction.text,
                    icon:  oAction.icon,
                    press: fnHandleActionPress
                });
                oActionSheet.addButton(oButton);
            }
            /*eslint-enable no-loop-func*/
            /*eslint-enable wrap-iife*/
        }
        actionSheetIconInEditMode = oEvent.getSource().getActionSheetIcon ? oEvent.getSource().getActionSheetIcon() : undefined;
        //For tiles - actions menu is opened by "more" icon, for links, there is an action button
        //Which cannot be controlled by FLP code.
        //In case of link, we first try to access the "more" button and open an action sheet by it.
        //Otherwise the action sheet will not be located under the "more" button and other weird things will happen.
        if (actionSheetIconInEditMode) {
            oActionSheet.openBy(actionSheetIconInEditMode);
        } else {
            var oMoreAction = sap.ui.getCore().byId(oEvent.getSource().getId() + "-action-more");
            if (oMoreAction) {
                oActionSheet.openBy(oMoreAction);
            } else {
                oActionSheet.openBy(oEvent.getSource());
            }
        }
    };

    /**
     * Press handler of a button (representing a single action) in a tile's action sheet
     *
     * @param oAction The event object initiated by the click action on an element in the tile's action sheet.
     *               In addition to the text and icon properties, oAction contains one of the following:
     *               1. A "press" property that includes a callback function.
     *                  In this case the action (chosen by the user) is launched by calling the callback is called
     *               2. A "targetUrl" property that includes either a hash part of a full URL.
     *                  In this case the action (chosen by the user) is launched by navigating to the URL
     */
    ActionMode.prototype._handleActionPress = function (oAction, oTileControl) {
        if (oAction.press) {
            oAction.press.call(oAction, oTileControl);
        } else if (oAction.targetURL) {
            if (oAction.targetURL.indexOf("#") === 0) {
                hasher.setHash(oAction.targetURL);
            } else {
                window.open(oAction.targetURL, '_blank');
            }
        } else {
            sap.ui.require(['sap/m/MessageToast'],
                function (MessageToast) {
                    MessageToast.show("No Action");
                });
        }
    };

	return new ActionMode();

}, /* bExport= */ true);
},
	"sap/ushell/components/flp/Component.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define(['sap/ushell/components/flp/launchpad/DashboardManager', 'sap/ushell/resources', 'sap/ui/core/UIComponent', 'sap/ushell/components/flp/ComponentKeysHandler', 'sap/ushell/components/flp/CustomRouter'], function (DashboardManager, resources, UIComponent, ComponentKeysHandler, CustomRouter) {
    return UIComponent.extend("sap.ushell.components.flp.Component", {

        metadata: {
            routing : {
                config: {
                    viewType: "JS",
                    controlAggregation : "pages",
                    controlId : "navContainerFlp",
                    clearAggregation: false,
                    routerClass : CustomRouter
                },
                targets: {
                    appFinder: {
                        viewName : "sap.ushell.components.flp.launchpad.appfinder.AppFinder"
                    },
                    home: {
                        viewName : "sap.ushell.components.flp.launchpad.dashboard.DashboardContent"
                    }
                },
                routes : [
                    {
                        name : "home",
                        target: 'home',
                        pattern : "home"
                    }
                ]
            },

            version: "1.52.4",

            library: "sap.ushell.components.flp",

            dependencies: {
                libs: ["sap.m"]
            },
            config: {
                semanticObject: 'Shell',
                action: 'home',
                title: resources.i18n.getText("homeBtn_tooltip"),
                fullWidth: true,
                hideLightBackground: true
            }
        },
        PERS_KEY: "flp.settings.FlpSettings",

        parseOldCatalogParams: function (sUrl) {
            "use strict";
            var mParameters = jQuery.sap.getUriParameters(sUrl).mParams,
                sValue,
                sKey;

            for (sKey in mParameters) {
                if (mParameters.hasOwnProperty(sKey)) {
                    sValue = mParameters[sKey][0];
                    mParameters[sKey] = sValue.indexOf('/') !== -1 ? encodeURIComponent(sValue) : sValue;
                }
            }
            return mParameters;
        },

        handleNavigationFilter: function (sNewHash) {
            "use strict";
            var oShellHash =  sap.ushell.Container.getService("URLParsing").parseShellHash(sNewHash),
                mParameters;

            if (oShellHash && oShellHash.semanticObject === 'shell' && oShellHash.action === 'catalog') {
                mParameters = this.parseOldCatalogParams(sNewHash);
                setTimeout(function () {
                    this.getRouter().navTo('appFinder', {'menu': 'catalog', filters : JSON.stringify(mParameters)});
                }.bind(this), 0);
                return this.oShellNavigation.NavigationFilterStatus.Abandon;
            }
            return this.oShellNavigation.NavigationFilterStatus.Continue;
        },

        createContent: function () {
            "use strict";
            this.oRouter = this.getRouter();
            this.oModel = new sap.ui.model.json.JSONModel({
                animationMode: 'full',
                groups : [],
                animationRendered : false,
                tagFiltering: true,
                searchFiltering: true,
                catalogSelection: true,
                tileActionModeEnabled: false,
                tileActionModeActive: false,
                isInDrag: false,
                rtl: sap.ui.getCore().getConfiguration().getRTL(),
                personalization: true,
                editTitle: false,
                tagList : [],
                selectedTags : [],
                userPreferences : {
                    entries : []
                },
                enableNotificationsPreview: false,
                previewNotificationItems: [],
                viewPortState: sap.ushell.Container.getRenderer('fiori2').getCurrentViewportState(),
                draggedTileLinkPersonalizationSupported: true
            });
            this.bCoreResourcesLoaded = !!jQuery.sap.isDeclared('sap.fiori.core-ext-light', true);

        // Subscribe to the event published by Notification settings UI
        //   after the user enables or disables notification preview
        sap.ui.getCore().getEventBus().subscribe("sap.ushell.services.Notifications", "enablePreviewNotificationChanged", this.updateNotificationConfiguration, this);
        sap.ui.getCore().getEventBus().subscribe("sap.ushell.services.UsageAnalytics", "usageAnalyticsStarted", function () {
            sap.ui.require(["sap/ushell/components/flp/FLPAnalytics"]);
        });
        sap.ui.getCore().getEventBus().subscribe("sap.ushell", "coreResourcesFullyLoaded", function(){
            this.bCoreResourcesLoaded = true;
            this.updateNotificationConfiguration();
        }, this);

            this.oModel.setSizeLimit(10000); // override default of 100 UI elements on list bindings
            this.setModel(this.oModel);
            this.oConfig = this.getComponentData().config;
            //check the personalization flag in the Component configuration and in the Renderer configuration
            this.oShellConfig = sap.ushell.renderers.fiori2.RendererExtensions.getConfiguration();
            sap.ui.getCore().getEventBus().subscribe('launchpad', 'afterSwitchState', this._handleShellViewPortSateChange, this);

            var oNavContainer,
                mediaQ,
                handleMedia,
                sHash,
                oShellHash,
                mParameters,
                oComponentConfig,
                bPersonalizationActive = (this.oConfig && (this.oConfig.enablePersonalization || this.oConfig.enablePersonalization === undefined))
                    && (this.oShellConfig && this.oShellConfig.enablePersonalization || this.oShellConfig.enablePersonalization === undefined);

            //the catalog route should be added only if personalization is active
            if (bPersonalizationActive) {
                this.oRouter.addRoute({
                    name : "catalog",
                    target: 'appFinder',
                    pattern : "catalog/:filters:"
                });
                this.oRouter.addRoute({
                    name : "appFinder",
                    target: 'appFinder',
                    pattern : "appFinder/{menu}/:filters:"
                });
            }
            //add the "all" route after the catalog route was added
            this.oRouter.addRoute({
                name : "all",
                target: 'home',
                pattern : ":all*:"
            });
            this._setConfigurationToModel(this.oConfig);

            //TODO: Please remove all 'NewDashboardManager' references after complete alignment!
            var oDashboardMgrData = {
                model : this.oModel,
                config : this.oConfig,
                router : this.oRouter
            };
            this.oDashboardManager = new DashboardManager("dashboardMgr",oDashboardMgrData);
            this.setModel(resources.i18nModel, "i18n");

            mediaQ = window.matchMedia("(min-width: 800px)");
            handleMedia = function (mq) {
                this.oModel.setProperty("/isPhoneWidth", !mq.matches);
            }.bind(this);
            if (mediaQ.addListener) {// condition check if mediaMatch supported(Not supported on IE9)
                mediaQ.addListener(handleMedia);
                handleMedia(mediaQ);
            }

        sap.ui.getCore().getEventBus().subscribe("launchpad", "togglePane", this._createAndAddGroupList, this);

        this.bContactSupportEnabled = sap.ushell.Container.getService("SupportTicket").isEnabled();
        if (this.bContactSupportEnabled) {
            jQuery.sap.require("sap.ushell.UserActivityLog");
            sap.ushell.UserActivityLog.activate();
        }
        oNavContainer = this.initNavContainer();

            this.setInitialConfiguration();

            this.oShellNavigation = sap.ushell.Container.getService("ShellNavigation");
            this.oShellNavigation.registerNavigationFilter(jQuery.proxy(this.handleNavigationFilter, this));

            //handle direct navigation with the old catalog intent format
            sHash = hasher.getHash();
            oShellHash =  sap.ushell.Container.getService("URLParsing").parseShellHash(sHash);
            if (oShellHash && oShellHash.semanticObject === 'shell' && oShellHash.action === 'catalog') {
                mParameters = this.parseOldCatalogParams(sHash);
                oComponentConfig = this.getMetadata().getConfig();
                this.oShellNavigation.toExternal({
                    target: {
                        semanticObject: oComponentConfig.semanticObject,
                        action: oComponentConfig.action
                    }
                });
                this.getRouter().navTo('appFinder', {'menu': 'catalog', filters : JSON.stringify(mParameters)});
            }

            if (this.oConfig.enableHomePageSettings !== false) {
                sap.ui.getCore().getEventBus().subscribe("launchpad", "contentRendered", this._addFlpSettings, this);
            }

            return oNavContainer;
        },

        _createAndAddGroupList: function (sChannel, sEventName, oData) {
            "use strict";
            if (oData.currentContent && (oData.currentContent.indexOf('groupList') !== -1 || !oData.currentContent.length)) {
                var oConfig = this.oConfig,
                    oGroupListData = this.runAsOwner(function () {
                        return this.oDashboardManager.getGroupListView(oConfig);
                    }.bind(this));

                if (!oGroupListData.alreadyCreated) {
                    oGroupListData.groupList.setModel(this.oModel);
                    oGroupListData.groupList.setModel(resources.i18nModel, "i18n");
                    sap.ushell.renderers.fiori2.RendererExtensions.setLeftPaneContent(oGroupListData.groupList, "home");
                }
            }
        },

        _setConfigurationToModel : function (oConfig) {
            "use strict";
            var oModel = this.oModel,
                tileActionModeEnabled,
                oRendererConfig = sap.ushell.Container.getRenderer('fiori2').getModelConfiguration();

            this.updateNotificationConfiguration();

            if (oConfig) {
                if (oConfig.enablePersonalization !== undefined && this.oShellConfig.enablePersonalization !== undefined) {
                    oModel.setProperty("/personalization", oConfig.enablePersonalization && this.oShellConfig.enablePersonalization);
                } else if (oConfig.enablePersonalization !== undefined) {
                    oModel.setProperty("/personalization", oConfig.enablePersonalization);
                } else if (this.oShellConfig.enablePersonalization !== undefined) {
                    oModel.setProperty("/personalization", this.oShellConfig.enablePersonalization);
                }

                if (oConfig.optimizeTileLoadingThreshold !== undefined) {
                    oModel.setProperty("/OptimizeTileLoadingThreshold", oConfig.optimizeTileLoadingThreshold);
                }
                if (oConfig.enableLockedGroupsCompactLayout !== undefined) {
                    oModel.setProperty("/enableLockedGroupsCompactLayout", oConfig.enableLockedGroupsCompactLayout);
                }
                if (oConfig.enableCatalogSelection !== undefined) {
                    oModel.setProperty("/catalogSelection", oConfig.enableCatalogSelection);
                }
                if (oConfig.enableTilesOpacity !== undefined) {
                    oModel.setProperty("/tilesOpacity", oConfig.enableTilesOpacity);
                }
                if (oConfig.enableDragIndicator !== undefined) {
                    oModel.setProperty("/enableDragIndicator", oConfig.enableDragIndicator);
                }
                tileActionModeEnabled = false;
                if (oConfig.enableActionModeMenuButton !== undefined) {
                    oModel.setProperty("/actionModeMenuButtonEnabled", oConfig.enableActionModeMenuButton);
                    tileActionModeEnabled = oConfig.enableActionModeMenuButton;
                }
                if (oConfig.enableRenameLockedGroup !== undefined) {
                    oModel.setProperty("/enableRenameLockedGroup", oConfig.enableRenameLockedGroup);
                } else {
                    oModel.setProperty("/enableRenameLockedGroup", false);
                }

                if (oConfig.enableActionModeFloatingButton !== undefined) {
                    oModel.setProperty("/actionModeFloatingButtonEnabled", oConfig.enableActionModeFloatingButton);
                    tileActionModeEnabled = tileActionModeEnabled || oConfig.enableActionModeFloatingButton;
                }
                oModel.setProperty("/tileActionModeEnabled", tileActionModeEnabled);
                if (oConfig.enableTileActionsIcon !== undefined) {
                    //Available only for desktop
                    oModel.setProperty("/tileActionsIconEnabled", sap.ui.Device.system.desktop ? oConfig.enableTileActionsIcon : false);
                }
                if (oConfig.enableHideGroups !== undefined) {
                    oModel.setProperty("/enableHideGroups", oConfig.enableHideGroups);
                }
                // check for title
                if (oConfig.title) {
                    oModel.setProperty("/title", oConfig.title);
                }

                /** Easy Access Menues configuration Flags**/
                // if 'enableEasyAccess' is supplied but is false
                if (oConfig.enableEasyAccess != undefined && !oConfig.enableEasyAccess) {
                    oModel.setProperty("/enableEasyAccessSAPMenu", oConfig.enableEasyAccess);
                    oModel.setProperty("/enableEasyAccessUserMenu", oConfig.enableEasyAccess);
                    oModel.setProperty("/enableEasyAccessUserMenuSearch", oConfig.enableEasyAccess);
                    oModel.setProperty("/enableEasyAccessSAPMenuSearch", oConfig.enableEasyAccess);
                } else {
                    // else 'enableEasyAccess' not supplied, OR, it is true

                    // (1) check 'enableEasyAccessSAPMenu'
                    // if parameter is supplied (regardless to its value)
                    if (oConfig.enableEasyAccessSAPMenu !== undefined) {

                        // set its value
                        oModel.setProperty("/enableEasyAccessSAPMenu", oConfig.enableEasyAccessSAPMenu);

                        // in case 'enableEasyAccessSAPMenu' supplied but is false, we force 'enableEasyAccessSAPMenuSearch' to be false
                        if (!oConfig.enableEasyAccessSAPMenu) {
                            oModel.setProperty("/enableEasyAccessSAPMenuSearch", false);
                        } else {
                            // if 'enableEasyAccessSAPMenu' supplied and true, we set the 'enableEasyAccessSAPMenuSearch' (and if not supplied default is true)
                            if (oConfig.enableEasyAccessSAPMenuSearch !== undefined) {
                                oModel.setProperty("/enableEasyAccessSAPMenuSearch", oConfig.enableEasyAccessSAPMenuSearch);
                            } else {
                                // else 'enableEasyAccessSAPMenu' not supplied - default is true
                                oModel.setProperty("/enableEasyAccessSAPMenuSearch", true);
                            }
                        }
                    } else {
                        // else 'enableEasyAccessSAPMenu' is not defined. so we set its value to be enableEasyAccess as a fall back
                        oModel.setProperty("/enableEasyAccessSAPMenu", oConfig.enableEasyAccess);

                        // now we need to see if the 'enableEasyAccessSAPMenuSearch' was suppled or not
                        // if 'enableEasyAccessSAPMenu' supplied and true, we set the 'enableEasyAccessSAPMenuSearch' (and if not supplied default is true)
                        if (oConfig.enableEasyAccessSAPMenuSearch !== undefined) {
                            oModel.setProperty("/enableEasyAccessSAPMenuSearch", oConfig.enableEasyAccessSAPMenuSearch);
                        } else {
                            oModel.setProperty("/enableEasyAccessSAPMenuSearch", oConfig.enableEasyAccess);
                        }
                    }


                    // (2) check 'enableEasyAccessUserMenu'
                    // if parameter is supplied (regardless to its value)
                    if (oConfig.enableEasyAccessUserMenu !== undefined) {

                        // set its value
                        oModel.setProperty("/enableEasyAccessUserMenu", oConfig.enableEasyAccessUserMenu);

                        // in case 'enableEasyAccessUserMenu' supplied but is false, we force 'enableEasyAccessUserMenuSearch' to be false
                        if (!oConfig.enableEasyAccessUserMenu) {
                            oModel.setProperty("/enableEasyAccessUserMenuSearch", false);
                        } else {
                            // if 'enableEasyAccessUserMenu' supplied and true, we set the 'enableEasyAccessUserMenu' (and if not supplied default is true)
                            if (oConfig.enableEasyAccessUserMenuSearch !== undefined) {
                                oModel.setProperty("/enableEasyAccessUserMenuSearch", oConfig.enableEasyAccessUserMenuSearch);
                            } else {
                                // else 'enableEasyAccessUserMenu' not supplied - default is true
                                oModel.setProperty("/enableEasyAccessUserMenuSearch", true);
                            }
                        }
                    } else {
                        // else 'enableEasyAccessUserMenu' is not defined. so we set its value to be enableEasyAccess as a fall back
                        oModel.setProperty("/enableEasyAccessUserMenu", oConfig.enableEasyAccess);

                        // now we need to see if the 'enableEasyAccessSAPMenuSearch' was suppled or not
                        // if 'enableEasyAccessSAPMenu' supplied and true, we set the 'enableEasyAccessSAPMenuSearch' (and if not supplied default is true)
                        if (oConfig.enableEasyAccessUserMenuSearch !== undefined) {
                            oModel.setProperty("/enableEasyAccessUserMenuSearch", oConfig.enableEasyAccessUserMenuSearch);
                        } else {
                            oModel.setProperty("/enableEasyAccessUserMenuSearch", oConfig.enableEasyAccess);
                        }
                    }
                }

                /** Catalog Search **/
                // old flag support 'enableSearchFiltering' & new flag 'enableCatalogSearch'
                if (oConfig.enableSearchFiltering !== undefined) {
                    oModel.setProperty("/searchFiltering", oConfig.enableSearchFiltering);
                } else if (oConfig.enableCatalogSearch !== undefined) {
                    oModel.setProperty("/searchFiltering", oConfig.enableCatalogSearch);
                } else {
                    // deafult is true
                    oModel.setProperty("/searchFiltering", true);
                }

                /** Catalog Search Tags**/
                // old flag support 'enableTagFiltering' & new flag 'enableCatalogTagFilter'
                if (oConfig.enableTagFiltering !== undefined) {
                    oModel.setProperty("/tagFiltering", oConfig.enableTagFiltering);
                } else  if (oConfig.enableCatalogTagFilter !== undefined) {
                    oModel.setProperty("/tagFiltering", oConfig.enableCatalogTagFilter);
                } else {
                    // deafult is true
                    oModel.setProperty("/tagFiltering", true);
                }

                if (oConfig.sapMenuServiceUrl !== undefined) {
                    oModel.setProperty("/sapMenuServiceUrl", oConfig.sapMenuServiceUrl);
                }
                if (oConfig.userMenuServiceUrl !== undefined) {
                    oModel.setProperty("/userMenuServiceUrl", oConfig.userMenuServiceUrl);
                }
                if (oConfig.easyAccessNumbersOfLevels !== undefined) {
                    oModel.setProperty("/easyAccessNumbersOfLevels", oConfig.easyAccessNumbersOfLevels);
                }

                // Unless explicitly turned off, enable home page settings.
                var oDisplayPromise = oConfig.enableHomePageSettings !== false ?
                    this._getCurrentHomePageGroupDisplay() : jQuery.Deferred().resolve();

                oDisplayPromise.done(function(sDisplay) {
                    sDisplay = sDisplay || oConfig.homePageGroupDisplay;

                    if (sDisplay !== undefined) {
                        oModel.setProperty("/homePageGroupDisplay", sDisplay);
                    }
                });

                // xRay enablement configuration
                oModel.setProperty("/enableHelp", !!this.oShellConfig.enableHelp);
                oModel.setProperty("/disableSortedLockedGroups", !!oConfig.disableSortedLockedGroups);

                // enable/disable animations
                if (oRendererConfig.animationMode) {
                    oModel.setProperty("/animationMode", oRendererConfig.animationMode);
                }
            }
        },

        initNavContainer: function (oController) {
            "use strict";
            var oNavContainer = new sap.m.NavContainer({
                id: "navContainerFlp",
                defaultTransitionName: 'show'
            });

            return oNavContainer;
        },

        setInitialConfiguration: function () {
            "use strict";
            this.oRouter.initialize();

            //no need to enable accessibility feature on phone devices
            if (!sap.ui.Device.system.phone) {
                // set keyboard navigation handler
                ComponentKeysHandler.init(this.oModel, this.oRouter);
                sap.ushell.renderers.fiori2.AccessKeysHandler.registerAppKeysHandler(ComponentKeysHandler.handleFocusOnMe);
                var translationBundle = resources.i18n,
                    aShortcutsDescriptions = [];

                aShortcutsDescriptions.push({text: "Alt+H", description: translationBundle.getText("hotkeyHomePage")});

                if (this.oModel.getProperty("/personalization")) {
                    aShortcutsDescriptions.push({text: "Alt+A", description: translationBundle.getText("hotkeyAppFinder")});
                    aShortcutsDescriptions.push({text: "Ctrl+Enter", description: translationBundle.getText("hotkeySaveEditing")});
                }

                sap.ushell.renderers.fiori2.AccessKeysHandler.registerAppShortcuts(ComponentKeysHandler.handleShortcuts, aShortcutsDescriptions);

            }
            sap.ui.getCore().getEventBus().publish("launchpad", "initialConfigurationSet");
        },

        _handleShellViewPortSateChange: function (sNameSpace, sEventName, oEventData) {
            "use strict";
            var sCurrentShellViewportState = oEventData ? oEventData.getParameter('to') : '';

            this.oModel.setProperty('/viewPortState', sCurrentShellViewportState);
        },

        /**
         * Handler for the use-case in which the user enables or disables notifications preview in the notification settings UI.
         * In this case the value of enableNotificationsPreview needs to be re-calculated, considering the choice of the user
         */
        updateNotificationConfiguration: function (sChannelId, sEventId, oData) {
            "use strict";
            var that = this,
                oRendererConfig = sap.ushell.Container.getRenderer('fiori2').getModelConfiguration(),
                oDevice = sap.ui.Device,
                bEnableNotificationsUI = oRendererConfig.enableNotificationsUI,
                bNotificationServiceEnabled = sap.ushell.Container.getService("Notifications").isEnabled(),
                bNotificationSupportedAppState = oRendererConfig.appState !== "embedded" && oRendererConfig.appState !== "headerless" && oRendererConfig.appState !== "merged" && oRendererConfig.appState !== "standalone",
                oDevice = sap.ui.Device,
                bUserPreviewNotificationEnabled = true,
                bPreviewNotificationEnabledConfig = true,
                oNotificationUserFlagsPromise,
                bEligibleDeviceForPreview = oDevice.system.desktop || sap.ui.Device.system.tablet || sap.ui.Device.system.combi;

            if (!this.bCoreResourcesLoaded){
                return;
            }

            if (bNotificationServiceEnabled === true) {
                // Getting user settings flags from Notifications service and settings the model with the preview (user) enabling flag
                oNotificationUserFlagsPromise = sap.ushell.Container.getService("Notifications").getUserSettingsFlags();

                oNotificationUserFlagsPromise.done(function (oNotificationUserFlags) {
                    bUserPreviewNotificationEnabled = oNotificationUserFlags.previewNotificationEnabled;
                    that.oModel.setProperty("/userEnableNotificationsPreview", bUserPreviewNotificationEnabled);

                    that.oModel.setProperty("/configEnableNotificationsPreview", bPreviewNotificationEnabledConfig);

                    if (bPreviewNotificationEnabledConfig && bEnableNotificationsUI && bNotificationServiceEnabled &&
                        bEligibleDeviceForPreview && bNotificationSupportedAppState) {
                        that.oModel.setProperty("/enableNotificationsPreview", bUserPreviewNotificationEnabled);
                    }
                });
            }
        },

        _addFlpSettings: function () {
            "use strict";

            // Add FLP settings only once.
            if (this.bFlpSettingsAdded){
                return;
            }

            var oRenderer = sap.ushell.Container.getRenderer("fiori2"),
                oResourceBundle = resources.i18n,
                that = this;

            var flpSettingsView;

            var oEntry = {
                title: oResourceBundle.getText('FlpSettings_entry_title'),
                entryHelpID: "flpSettingsEntry",
                value: function () {
                    return jQuery.Deferred().resolve(" ");
                },
                content: function () {
                    flpSettingsView = sap.ui.xmlview({
                        viewName: "sap.ushell.components.flp.settings.FlpSettings",
                        viewData: {
                            initialDisplayMode: that.oModel.getProperty("/homePageGroupDisplay") || "scroll"
                        }
                    });
                    return jQuery.Deferred().resolve(flpSettingsView);
                },
                onSave: function () {
                    var sDisplay = flpSettingsView.getController().onSave();

                    // save anchor bar mode in personalization
                    var oDeferred = that._getPersonalizer("homePageGroupDisplay")
                        .setPersData(sDisplay);

                    // Log failure if occurs.
                    oDeferred.fail(function (error) {
                        jQuery.sap.log.error(
                            "Failed to save the anchor bar mode in personalization", error,
                            "sap.ushell.components.flp.settings.FlpSettings");
                    });

                    that.oModel.setProperty("/homePageGroupDisplay", sDisplay);
                    return jQuery.Deferred().resolve();
                },
                onCancel: function () {
                    return jQuery.Deferred().resolve();
                },
                icon: "sap-icon://home"
            };

            oRenderer.addUserPreferencesEntry(oEntry);
            this.bFlpSettingsAdded = true;
        },

        _getCurrentHomePageGroupDisplay: function () {
            'use strict';

            var dfdPers = this._getPersonalizer('homePageGroupDisplay').getPersData();

            dfdPers.fail(function (error) {
                jQuery.sap.log.error(
                    "Failed to load anchor bar state from the personalization", error,
                    "sap.ushell.components.flp.settings.FlpSettings");
            });

            return dfdPers;
        },

        _getPersonalizer: function (sItem) {
            "use strict";

            if (this.oPersonalizer) {
                return this.oPersonalizer;
            }
            var oPersonalizationService = sap.ushell.Container.getService("Personalization");
            var oComponent = sap.ui.core.Component.getOwnerComponentFor(this);
            var oScope = {
                keyCategory: oPersonalizationService.constants.keyCategory.FIXED_KEY,
                writeFrequency: oPersonalizationService.constants.writeFrequency.LOW,
                clientStorageAllowed: true
            };

            var oPersId = {
                container: this.PERS_KEY,
                item: sItem
            };

            this.oPersonalizer = oPersonalizationService.getPersonalizer(oPersId, oScope, oComponent);
            return this.oPersonalizer;
        },

        exit : function () {
            "use strict";
            sap.ui.getCore().getEventBus().unsubscribe('launchpad', 'shellViewStateChanged', this._handleShellViewPortSateChange, this);
            this.oDashboardManager.destroy();
        }
    });

});
},
	"sap/ushell/components/flp/ComponentKeysHandler.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

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
},
	"sap/ushell/components/flp/CustomRouter.js":function(){sap.ui.define(function() {
	"use strict";

    var CustomRouter = sap.ui.core.routing.Router.extend("sap.ushell.components.flp.CustomRouter", {

        constructor : function() {
            sap.ui.core.routing.Router.apply(this, arguments);
            //this._oRouteMatchedHandler = new sap.m.routing.RouteMatchedHandler(this);
            this.attachRouteMatched(this._onHandleRouteMatched, this);
            //this.attachRoutePatternMatched(this._handleRoutePatternMatched, this);
        },

        navTo : function() {
            if (!this._bIsInitialized) {
                this.initialize();
            }
            sap.ui.core.routing.Router.prototype.navTo.apply(this, arguments);
        },

        destroy : function() {
            sap.ui.core.routing.Router.prototype.destroy.apply(this, arguments);
        },
        _onHandleRouteMatched : function (oEvent) {
            var mParameters = oEvent.getParameters(),
                oTargetControl = sap.ui.getCore().byId(mParameters.config.controlId);
            var result = this.getTarget(mParameters.config.target).display();
            oTargetControl.to(result.oTargetParent);
            setTimeout(function () {
                sap.ui.getCore().getEventBus().publish("launchpad", "launchpadCustomRouterRouteMatched");
            }, 0);
        }
    });


	return CustomRouter;

});
},
	"sap/ushell/components/flp/FLPAnalytics.js":function(){sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap, hasher */
    /**
     * Manage UsageAnalytics event logging as a result of FLP user flows
     */

    // Launchpad action events that trigger logging
    var aObservedLaunchpadActions = ["appOpened", "deleteTile", "createGroup", "actionModeActive", "catalogTileClick", "dashboardTileClick", "dashboardTileLinkClick"],
        oEventBus = sap.ui.getCore().getEventBus(),
        that = this,
        oLaunchedApplications = {};

    /**
     * Updates oLaunchedApplications with the title and opening time of the given application
     */
    function saveOpenAppicationData(applicationId) {
        var oMetadataOfTarget = sap.ushell.services.AppConfiguration.getMetadata();
        oLaunchedApplications[applicationId] = {};
        oLaunchedApplications[applicationId].startTime = new Date();
        oLaunchedApplications[applicationId].title = oMetadataOfTarget.title;
    }

    /**
     * Logs a "Time in App" event according to the given application ID
     *
     * Calculates the time according to the current (closing) time
     *  and the opening time that is kept on oLaunchedApplications[applicationId]
     */
    function logTimeInAppEvent(applicationId) {
        var appDuration = 0;

        try {
            appDuration = (new Date() - oLaunchedApplications[applicationId].startTime) / 1000;
            sap.ushell.Container.getService("UsageAnalytics").logCustomEvent("FLP: Time in Application (sec)", appDuration, [oLaunchedApplications[applicationId].title]);
        } catch (e) {
            jQuery.sap.log.warning("Duration in application " + applicationId + " could not be calculated", null, "sap.ushell.components.flp.FLPAnalytics");
        }
    }

    /**
     * Handler for published usageAnalytics events.
     */
    function handleAction(sChannelId, sEventId, oData) {
        var sApplicationId = hasher.getHash(),
            sApplicationTitle;

        window.swa.custom1 = {ref: sApplicationId};
        switch (sEventId) {
        case 'appOpened':
            // In order to be notified when applications are launched - we rely on navContainer's attachAfterNavigate event.
            // but for the first navigation (e.g. login or direct URL in a new tab) we still need the "appOpened" event.
            saveOpenAppicationData(sApplicationId);
            sap.ushell.Container.getService("UsageAnalytics").logCustomEvent("FLP: Application Opened", "Direct Launch", [oLaunchedApplications[sApplicationId].title]);
            oEventBus.unsubscribe("launchpad", "appOpened", handleAction);
            break;
        case 'bookmarkTileAdded':
            sApplicationTitle = window.document.title;
            sap.ushell.Container.getService("UsageAnalytics").logCustomEvent("FLP: Personalization", "Save as Tile", [
                sApplicationTitle,
                oData && oData.group && oData.group.title ? oData.group.title : "",
                oData && oData.group && oData.group.id ? oData.group.id : "",
                oData && oData.tile && oData.tile.title ? oData.tile.title : sApplicationTitle
            ]);
            break;
        case 'actionModeActive':
            sap.ushell.Container.getService("UsageAnalytics").logCustomEvent("FLP: Personalization", "Enter Action Mode", [oData.source]);
            break;
        case 'catalogTileClick':
            sap.ushell.Container.getService("UsageAnalytics").logCustomEvent("FLP: Application Launch point", "Catalog", []);
            break;
        case 'dashboardTileClick':
            sap.ushell.Container.getService("UsageAnalytics").logCustomEvent("FLP: Application Launch point", "Homepage", []);
            break;
        case 'dashboardTileLinkClick':
            sap.ushell.Container.getService("UsageAnalytics").logCustomEvent("FLP: Application Launch point", "Tile Group Link", []);
            break;
        default:
            break;
        }
    }

    /**
     * Handler of navContainer's AfterNavigate event (i.e. navigation between the container's pages)
     *
     * - Logs "TimeInAppEvent" for the source application (i.e. from which the navigation occurred)
     * - Updated data about the opened application
     * - Logs "Application Opened" event
     */
    function handleAfterNavigate(oEvent) {
        var sFromApplicationId,
            sToApplicationId,
            oTargetApplication;

        // For the source application (the one from which the user navigates) -
        // Calculate the time duration and log a "Time in Application" event
        if (oEvent.getParameter("from") && oEvent.getParameter("to")) {
            sFromApplicationId = oEvent.getParameter("from").getId().replace("application-", "").replace("applicationShellPage-", "");
            window.swa.custom1 = {ref: sFromApplicationId};
            logTimeInAppEvent(sFromApplicationId);
            // For the target application (the one to which the user navigates) -
            // Keep the opening time and title, and log an "Application Opened" event
            oTargetApplication = oEvent.getParameter("to");
            sToApplicationId = oTargetApplication.getId().replace("application-", "").replace("applicationShellPage-", "");
            saveOpenAppicationData(sToApplicationId);
            window.swa.custom1 = {ref: sToApplicationId};
            sap.ushell.Container.getService("UsageAnalytics").logCustomEvent("FLP: Application Opened", "Fiori Navigation", [oLaunchedApplications[sToApplicationId].title]);
        }
    }

    /**
     * Handler of browser tab close event
     *
     * Logs a "Time in App" event
     */
    jQuery(window).unload(function (event) {
        var currentApp = window.location.hash.substr(1);
        logTimeInAppEvent(currentApp);
    });

    try {
        sap.ui.getCore().byId('viewPortContainer').attachAfterNavigate(handleAfterNavigate, that);
    } catch (e) {
        jQuery.sap.log.warning("Failure when subscribing to viewPortContainer 'AfterNavigate' event", null, "sap.ushell.components.flp.FLPAnalytics");
    }
    oEventBus.subscribe("sap.ushell.services.Bookmark", "bookmarkTileAdded", handleAction, that);
    aObservedLaunchpadActions.forEach(function (item, i, arr) {
        oEventBus.subscribe("launchpad", item, handleAction, that);
    });


}, /* bExport= */ false);
},
	"sap/ushell/components/flp/launchpad/DashboardLoadingManager.js":function(){// @copyright@

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
},
	"sap/ushell/components/flp/launchpad/DashboardManager.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

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
},
	"sap/ushell/components/flp/launchpad/PagingManager.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(["sap/ui/base/EventProvider"], function(EventProvider) {
	"use strict";

    /*global jQuery, sap, document, setTimeout, window */
    /*jslint plusplus: true, nomen: true, bitwise: true */

    var PagingManager = EventProvider.extend("sap.ushell.components.flp.launchpad.PagingManager", {
        metadata : {
            publicMethods : ["setElementClass", "setContainerSize", "getNumberOfAllocatedElements", "moveToNextPage", "getTileHeight"]
        },
        constructor : function (sId, mSettings) {
            //make this class only available once
//            if (sap.ushell.components.flp.launchpad.getPagingManager && sap.ushell.components.flp.launchpad.getPagingManager()) {
//                return sap.ushell.components.flp.launchpad.getPagingManager();
//            }
            sap.ushell.components.flp.launchpad.getPagingManager = jQuery.sap.getter(this.getInterface());
            this.currentPageIndex = 0;
            this.containerHeight = mSettings.containerHeight || 0;
            this.containerWidth = mSettings.containerWidth || 0;
            this.supportedElements = mSettings.supportedElements || "";
            this.tileHeight = 0;
        },
        getTileHeight : function () {
            return this.tileHeight;
        },
        setElementClass : function (sClassName) {
            this.supportedElements = sClassName;
        },

        setContainerSize : function (nHeight, nWidth) {
            var totalNumberAllocatedTiles = this.getNumberOfAllocatedElements();
            this.containerHeight = nHeight;
            this.containerWidth = nWidth;
            this._changePageSize(totalNumberAllocatedTiles);
        },

        getNumberOfAllocatedElements : function () {
            return this._calcElementsPerPage() * this.currentPageIndex;
        },

        _changePageSize: function (totlaNumberAllocateedTiles) {
            this.currentPageIndex = Math.ceil(totlaNumberAllocateedTiles / this._calcElementsPerPage());
        },

        moveToNextPage : function () {
            this.currentPageIndex++;
        },

        getSizeofSupportedElementInUnits : function (tileType) {
            return this.supportedElements[tileType].sizeInBaseUnits;
        },

        _calcElementMatrix: function (className) {
            var oElement = jQuery("<div>").addClass(className);
            jQuery('body').append(oElement);
            var elementHeight = oElement.height();
            var elementWidth = oElement.width();

            if (elementHeight < 20 || elementWidth < 40) {
                elementWidth = 40;
                elementHeight = 20;
            }

            oElement.remove();

            return {width: elementWidth, height: elementHeight};
        },

        _calcElementsPerPage : function () {
            var supportedElementKey, baseUnitSize, supportedElement, matrix, supportedElement, mat, elementsPerColumn, elementsPerRow;

            for (supportedElementKey in this.supportedElements) {
                supportedElement = this.supportedElements[supportedElementKey];
                matrix = this._calcElementMatrix(supportedElement.className);
                supportedElement.matrix = matrix;
                if (baseUnitSize) {
                    baseUnitSize.width = baseUnitSize.width > matrix.width ? matrix.width : baseUnitSize.width;
                    baseUnitSize.height = baseUnitSize.height > matrix.height ? matrix.height : baseUnitSize.height;
                } else {
                    baseUnitSize = {width: matrix.width, height: matrix.height};
                }
            }

            //calculate sizeofSupportedelEmentInUnits
            for (supportedElementKey in this.supportedElements) {
                supportedElement = this.supportedElements[supportedElementKey];
                mat = supportedElement.matrix;
                supportedElement.sizeInBaseUnits = Math.round(mat.width / baseUnitSize.width * mat.height / baseUnitSize.height);
            }

            //calc number of units can feet in a page.
            elementsPerColumn =  Math.round(this.containerWidth / baseUnitSize.width);
            elementsPerRow =  Math.round(this.containerHeight / baseUnitSize.height);


            if (!elementsPerRow || !elementsPerColumn || elementsPerColumn === Infinity || elementsPerRow === Infinity || elementsPerColumn === 0 || elementsPerRow === 0) {
                return 10;
            }
            return elementsPerRow * elementsPerColumn;
        }
    });


	return PagingManager;

});
},
	"sap/ushell/components/flp/launchpad/appfinder/AppFinder.controller.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(['sap/ushell/ui/launchpad/AccessibilityCustomData', 'sap/ushell/ui5service/ShellUIService'],
    function (AccessibilityCustomData, ShellUIService) {
        "use strict";

        sap.ui.controller("sap.ushell.components.flp.launchpad.appfinder.AppFinder", {
            onInit: function () {
                sap.ushell.Container.getRenderer("fiori2").createExtendedShellState("appFinderExtendedShellState", function () {
                    sap.ushell.Container.getRenderer("fiori2").showHeaderItem('backBtn', true);
                    sap.ushell.Container.getRenderer("fiori2").showHeaderItem('homeBtn', true);
                });
                var oView = this.getView(),
                    oModel = oView.getModel(),
                    showEasyAccessMenu = oView.showEasyAccessMenu;

                //make sure the groups are loaded
                if (!oModel.getProperty("/groups") || oModel.getProperty("/groups").length === 0) {
                    var dashboardMgr = sap.ushell.components.flp.launchpad.getDashboardManager();
                    dashboardMgr.loadPersonalizedGroups();
                }

                // model
                this.getView().setModel(this._getSubHeaderModel(), "subHeaderModel");
                this.oConfig = oView.parentComponent.getComponentData().config;
                this.catalogView = sap.ui.view("catalogView", {
                    type: sap.ui.core.mvc.ViewType.JS,
                    viewName: "sap.ushell.components.flp.launchpad.appfinder.Catalog",
                    height: "100%",
                    viewData: {
                        parentComponent: oView.parentComponent,
                        subHeaderModel: this._getSubHeaderModel()
                    }
                });
                this.catalogView.addStyleClass('sapUiGlobalBackgroundColor sapUiGlobalBackgroundColorForce');
                this._addViewCustomData(this.catalogView, "appFinderCatalogTitle");


                // routing for both 'catalog' and 'appFinder' is supported and added below
                this.oRouter = this.getView().parentComponent.getRouter();
                this.oRouter.getRoute("catalog").attachPatternMatched(function (oEvent) {
                    this._navigateTo.apply(this, ["appFinder", "catalog"]);
                }.bind(this));
                this.oRouter.getRoute("appFinder").attachPatternMatched(this._handleAppFinderNavigation.bind(this));

                // setting first focus
                if (!showEasyAccessMenu) {
                    oView.oPage.addContent(this.catalogView);
                    setTimeout(function () {
                        jQuery('#catalogSelect').focus();
                    }, 0);
                }

                // attaching a resize handler to determine is hamburger button should be visible or not in the App Finder sub header.
                sap.ui.Device.resize.attachHandler(this._resizeHandler.bind(this));
            },

        _resizeHandler: function () {
            // update the visibiilty of the hamburger button upon resizing
            var bShowOpenCloseSplitAppButton = this._showOpenCloseSplitAppButton();

            var bCurrentShowOpenCloseSplitAppButton = this.oSubHeaderModel.getProperty('/openCloseSplitAppButtonVisible');
            if (bShowOpenCloseSplitAppButton != bCurrentShowOpenCloseSplitAppButton) {
                this.oSubHeaderModel.setProperty('/openCloseSplitAppButtonVisible', bShowOpenCloseSplitAppButton);

                // in case we now show the button, then it must be foced untoggled, as the left panel closes automatically
                if (bShowOpenCloseSplitAppButton) {
                    this.oSubHeaderModel.setProperty('/openCloseSplitAppButtonToggled', false);
                }
            }
            // toggle class on app finder page
            this._toggleViewWithToggleButtonClass(bShowOpenCloseSplitAppButton);
        },

        _handleAppFinderNavigation: function (oEvent) {
            var oView = this.getView();

            this._preloadAppHandler();
            this._getPathAndHandleGroupContext(oEvent);
            // first create the sub header
            oView.createSubHeader();
            // toggle class on app finder page
            this._toggleViewWithToggleButtonClass(this._showOpenCloseSplitAppButton());
            if (oView.showEasyAccessMenu) {
                // in case we need to show the easy access menu buttons
                // update sub header accordingly (within the onShow)
                this.onShow(oEvent);
            } else if (oView._showSearch('catalog')) {
                // else no easy access menu buttons
                // update sub header accordingly
                oView.updateSubHeader('catalog', false);
                // we still have to adjust the view in case we do show the tags in subheader
                this._toggleViewWithSearchAndTagsClasses('catalog');
            }
            sap.ui.getCore().getEventBus().publish("showCatalog");
            sap.ui.getCore().getEventBus().publish("launchpad", "contentRendered");
        },

        _showOpenCloseSplitAppButton: function () {
            return !sap.ui.Device.orientation.landscape || sap.ui.Device.system.phone;
        },


        _resetSubHeaderModel: function () {
            this.oSubHeaderModel.setProperty('/activeMenu', null);

            this.oSubHeaderModel.setProperty('/search', {
                searchMode: false,
                searchTerm: null
            });

            this.oSubHeaderModel.setProperty('/tag', {
                tagMode: false,
                selectedTags: []
            });

            this.oSubHeaderModel.setProperty('/openCloseSplitAppButtonVisible', this._showOpenCloseSplitAppButton());
            this.oSubHeaderModel.setProperty('/openCloseSplitAppButtonToggled', false);
        },


        _getSubHeaderModel : function () {
            if (this.oSubHeaderModel) {
                return this.oSubHeaderModel;
            }
            this.oSubHeaderModel = new sap.ui.model.json.JSONModel();
            this._resetSubHeaderModel();
            return this.oSubHeaderModel;
        },

        onTagsFilter : function (oEvent) {
            var oTagsFilter = oEvent.getSource(),
                oSubHeaderModel = oTagsFilter.getModel('subHeaderModel'),
                aSelectedTags = oEvent.getSource().getSelectedItems(),
                bTagsMode = aSelectedTags.length > 0,
                oTagsData = {
                    tagMode: bTagsMode,
                    selectedTags: []
                };

            aSelectedTags.forEach(function (oTag, iTagIndex) {
                oTagsData.selectedTags.push(oTag.getText());
            });
            oSubHeaderModel.setProperty('/activeMenu', this.getCurrentMenuName());
            oSubHeaderModel.setProperty('/tag', oTagsData);

        },

        searchHandler : function (oEvent) {
            //get all custom tile keywords
            var dashboardMgr = sap.ushell.components.flp.launchpad.getDashboardManager();
            dashboardMgr.loadCustomTilesKeyWords();

            var sSearchTerm = oEvent.getSource().getValue();
            if (sSearchTerm == null || oEvent.getParameter('clearButtonPressed')) {
                return;
            }

            // take the data from the model
            var oSearchData = this.oSubHeaderModel.getProperty('/search');
            var sActiveMenu = this.oSubHeaderModel.getProperty('/activeMenu');

            // update active menu to current
            if (this.getCurrentMenuName() != sActiveMenu) {
                sActiveMenu = this.getCurrentMenuName();
            }
            // update search mode to true - ONLY in case the handler is not invoked by the 'X' button.
            // In case it does we do not update the search mode, it stays as it is
            if (!oSearchData.searchMode && !oEvent.getParameter('clearButtonPressed')) {
                oSearchData.searchMode = true;
            }

            // we are in search mode and on Phone
            if (oSearchData.searchMode && sap.ui.Device.system.phone) {

                // in case we are in phone we untoggle the toggle button when search is invoked as
                // the detailed page of the search results is nevigated to and opened.
                // therefore we untoggle the button of the master page
                this.oSubHeaderModel.setProperty("/openCloseSplitAppButtonToggled", false);
            }

            // check and update the search term
            if (sSearchTerm != oSearchData.searchTerm) {
                if (this.containsOnlyWhiteSpac(sSearchTerm)) {
                    sSearchTerm = '*';
                }
                oSearchData.searchTerm = sSearchTerm;
            }

            // setting property once so no redundant binding updates will occur
            this.oSubHeaderModel.setProperty("/search", oSearchData);
            this.oSubHeaderModel.setProperty("/activeMenu", sActiveMenu);
            this.oSubHeaderModel.refresh(true);
        },

        /**
         * This method comes to prepare relevant modifications before loading the app.
         * This includes;
         *  - applying custom shell states
         *  - setting the shell-header-title accordingly
         **/
        _preloadAppHandler : function() {
            setTimeout(function () {
                if (sap.ushell.Container) {
                    sap.ushell.Container.getRenderer("fiori2").applyExtendedShellState("appFinderExtendedShellState");
                }
                this._updateShellHeader(this.oView.oPage.getTitle());
            }.bind(this), 0);
        },
        getCurrentMenuName: function () {
            return this.currentMenu;
        },
        _navigateTo: function(sName, sMenu) {
            var sGroupContext = this.oView.getModel().getProperty("/groupContext");
            var sGroupContextPath = sGroupContext ? sGroupContext.path : null;
            if (sGroupContextPath) {
                this.oRouter.navTo(sName, {
                    'menu': sMenu,
                    filters: JSON.stringify({targetGroup: encodeURIComponent(sGroupContextPath)})
                }, true);
            } else {
                this.oRouter.navTo(sName, {
                    'menu': sMenu
                }, true);

            }
        },

        getSystemsModels: function () {
            var that = this;
            if (this.getSystemsPromise) {
                return this.getSystemsPromise;
            }

            var getSystemsDeferred = new jQuery.Deferred();
            this.getSystemsPromise = getSystemsDeferred.promise();

            var aModelPromises = ["userMenu", "sapMenu"].map(function (menuType) {
                var systemsModel = new sap.ui.model.json.JSONModel();
                systemsModel.setProperty("/systemSelected", null);
                systemsModel.setProperty("/systemsList", []);

                return that.getSystems(menuType).then(function (aReturnSystems) {
                    systemsModel.setProperty("/systemsList", aReturnSystems);
                    return systemsModel;
                });
            });
            jQuery.when.apply(jQuery, aModelPromises).then(function (userMenuModel, sapMenuModel) {
                getSystemsDeferred.resolve(userMenuModel, sapMenuModel);
            });

            return this.getSystemsPromise;
        },
        onSegmentButtonClick: function (oEvent) {
            switch (oEvent.getParameters().id) {
                case "catalog":
                    this._navigateTo("appFinder","catalog");
                    break;
                case "userMenu":
                    this._navigateTo("appFinder","userMenu");
                    break;
                case "sapMenu":
                    this._navigateTo("appFinder","sapMenu");
                    break;
            }
        },
        onShow: function (oEvent) {
            var oParameters = oEvent.getParameter('arguments');
            var menu = oParameters.menu;
            if (menu === this.getCurrentMenuName()) {
                return;
            }

            // update place holder string on the search input according to the showed menu
            var oView = this.getView();
            oView._updateSearchWithPlaceHolder(menu);

            this._updateCurrentMenuName(menu);
            this.getSystemsModels().then(function (userMenuSystemsModel, sapMenuSystemsModel) {
                var sapMenuSystemsList = sapMenuSystemsModel.getProperty("/systemsList");
                var userMenuSystemsList = userMenuSystemsModel.getProperty("/systemsList");

                // call view to remove content from page
                oView.oPage.removeAllContent();

                // in case we have systems we do want the sub header to be rendered accordingly
                // (no systems ==> no easy access menu buttons in sub header)
                var systemsList = (this.currentMenu === 'sapMenu' ? sapMenuSystemsList : userMenuSystemsList);
                if (systemsList && systemsList.length) {
                    // call view to render the sub header with easy access menus
                    oView.updateSubHeader(this.currentMenu, true);
                } else if (oView._showSearch(this.currentMenu)){
                    // call view to render the sub header without easy access menus
                    oView.updateSubHeader(this.currentMenu, false);
                }

                if (this.currentMenu === 'catalog') {
                    // add catalog view
                    oView.oPage.addContent(this.catalogView);
                } else if (this.currentMenu === 'userMenu') {
                    // add user menu view
                    // create if first time.
                    if (!this.userMenuView) {
                        this.userMenuView = new sap.ui.view("userMenuView", {
                            type: sap.ui.core.mvc.ViewType.JS,
                            viewName: "sap.ushell.components.flp.launchpad.appfinder.EasyAccess",
                            height: "100%",
                            viewData: {
                                menuName: "USER_MENU",
                                easyAccessSystemsModel: userMenuSystemsModel,
                                parentComponent: oView.parentComponent,
                                subHeaderModel: this._getSubHeaderModel(),
                                enableSearch: this.getView()._showSearch("userMenu")
                            }
                        });
                        this._addViewCustomData(this.userMenuView, "appFinderUserMenuTitle");
                    }
                    oView.oPage.addContent(this.userMenuView);
                } else if (this.currentMenu === 'sapMenu') {
                    // add sap menu view
                    // create if first time.
                    if (!this.sapMenuView) {
                        this.sapMenuView = new sap.ui.view("sapMenuView", {
                            type: sap.ui.core.mvc.ViewType.JS,
                            viewName: "sap.ushell.components.flp.launchpad.appfinder.EasyAccess",
                            height: "100%",
                            viewData: {
                                menuName: "SAP_MENU",
                                easyAccessSystemsModel: sapMenuSystemsModel,
                                parentComponent: oView.parentComponent,
                                subHeaderModel: this._getSubHeaderModel(),
                                enableSearch: this.getView()._showSearch("sapMenu")
                            }
                        });
                        this._addViewCustomData(this.sapMenuView, "appFinderSapMenuTitle");
                    }
                    oView.oPage.addContent(this.sapMenuView);
                }

                // focus is set on segmented button
                this._setFocusToSegmentedButton(systemsList);

                // SubHeader Model active-menu is updated with current menu
                this.oSubHeaderModel.setProperty("/activeMenu", this.currentMenu);

                // In case toggle button is visible (SubHeader Model toggle button toggled)
                // then it is set to false as we switch the menu
                if (this.oSubHeaderModel.getProperty("/openCloseSplitAppButtonVisible")) {
                    this.oSubHeaderModel.setProperty("/openCloseSplitAppButtonToggled", false);
                }

                this.oSubHeaderModel.refresh(true);
            }.bind(this));
        },

        _updateCurrentMenuName: function(sMenu){
            /**
             * verify that the menu exist!
             * in case one of the easy access menu is disabled and the
             * user is navigating to the desabled menu (using some existing link)
             * we need to make sure we will not show the disabled menu!
             */
            var oView = this.getView();

            if (!oView.showEasyAccessMenu ||
                (sMenu === "sapMenu" && !oView.enableEasyAccessSAPMenu) ||
                (sMenu === "userMenu" && !oView.enableEasyAccessUserMenu)){
                this.currentMenu = "catalog";
            } else {
                this.currentMenu = sMenu;
            }

            // toggle relevant classes on the App Finder page according to wether it displays search or tags in its
            // subheader or not
            this._toggleViewWithSearchAndTagsClasses(sMenu);
        },

        /*
         this method sets a class on the AppFinder page to state if tags are shown or not currently
         in the subheader.
         The reason for it is that if tags do appear than we have a whole set of different styling to the header
         and its behavior, so we use different css selectors
         */
        _toggleViewWithSearchAndTagsClasses: function(sMenu) {
            var oView = this.getView();

            if (oView._showSearch(sMenu)) {
                oView.oPage.addStyleClass('sapUshellAppFinderSearch');
            } else {
                oView.oPage.removeStyleClass('sapUshellAppFinderSearch');
            }

            if (oView._showSearchTag(sMenu)) {
                oView.oPage.addStyleClass('sapUshellAppFinderTags');
            } else {
                oView.oPage.removeStyleClass('sapUshellAppFinderTags');
            }
        },

        _toggleViewWithToggleButtonClass: function(bButtonVisible) {
            var oView = this.getView();
            if (bButtonVisible) {
                oView.oPage.addStyleClass('sapUshellAppFinderToggleButton');
            } else {
                oView.oPage.removeStyleClass('sapUshellAppFinderToggleButton');
            }
        },

        _setFocusToSegmentedButton: function(systemsList) {
            var oView = this.getView();

            if (systemsList && systemsList.length) {
                var sButtonId = oView.segmentedButton.getSelectedButton();
                setTimeout(function () {
                    jQuery("#" + sButtonId).focus();
                }, 0);

            } else {
                setTimeout(function () {
                    jQuery('#catalogSelect').focus();
                }, 0);
            }
        },

        /**
         *get the group path (if exists) and update the model with the group context
         * @param oEvent
         * @private
         */
        _getPathAndHandleGroupContext : function (oEvent) {
            var oParameters = oEvent.getParameter('arguments');
            var sDataParam = oParameters.filters;
            var oDataParam = sDataParam ? JSON.parse(sDataParam) : sDataParam;
            var sPath = (oDataParam && decodeURIComponent(oDataParam.targetGroup)) || "";

            sPath = sPath === 'undefined' ? undefined : sPath;
            this._updateModelWithGroupContext(sPath);
        },

        /**
         * Update the groupContext part of the model with the path and ID of the context group, if exists
         *
         * @param {string} sPath - the path in the model of the context group, or empty string if no context exists
         */
        _updateModelWithGroupContext : function (sPath) {
            var oLaunchPageService = sap.ushell.Container.getService("LaunchPage"),
                oModel  = this.oView.getModel(),
                oGroupModel,
                oGroupContext = {
                    path : sPath,
                    id : "",
                    title : ""
                };

            // If sPath is defined and is different than empty string - set the group context id.
            // The recursive call is needed in order to wait until groups data is inserted to the model
            if (sPath && sPath !== "") {
                var timeoutGetGroupDataFromModel = function () {
                    var aModelGroups = oModel.getProperty("/groups");
                    if (aModelGroups.length) {
                        oGroupModel = oModel.getProperty(sPath);
                        oGroupContext.id = oLaunchPageService.getGroupId(oGroupModel.object);
                        oGroupContext.title = oGroupModel.title || oLaunchPageService.getGroupTitle(oGroupModel.object);
                        return;
                    }
                    setTimeout(timeoutGetGroupDataFromModel, 100);
                };
                timeoutGetGroupDataFromModel();
            }
            oModel.setProperty("/groupContext", oGroupContext);
        },

        /**
         *
         * @param {string} sMenuType - the menu type. One of sapMenu, userMenu.
         * @returns {*} - a list of systems to show in the system selector dialog
         */
        getSystems: function (sMenuType) {
            var oDeferred = new jQuery.Deferred();
            var clientService = sap.ushell.Container.getService("ClientSideTargetResolution");
            if (!clientService) {
                oDeferred.reject("cannot get ClientSideTargetResolution service");
            } else {
                clientService.getEasyAccessSystems(sMenuType).done(function (oSystems) {
                    var systemsModel = [];
                    var aSystemsID = Object.keys(oSystems);
                    for (var i = 0; i < aSystemsID.length; i++) {
                        var sCurrentsystemID = aSystemsID[i];
                        systemsModel[i] = {
                            "systemName": oSystems[sCurrentsystemID].text,
                            "systemId": sCurrentsystemID
                        };
                    }

                    oDeferred.resolve(systemsModel);
                }).fail(function (sErrorMsg) {
                    oDeferred.reject("An error occurred while retrieving the systems: " + sErrorMsg);
                });
            }
            return oDeferred.promise();
        },

        _addViewCustomData: function (oView, sTitleName) {
            var oResourceBundle = sap.ushell.resources.i18n;

            oView.addCustomData(new AccessibilityCustomData({
                key: "role",
                value: "region",
                writeToDom: true
            }));
            oView.addCustomData(new AccessibilityCustomData({
                key: "aria-label",
                value: oResourceBundle.getText(sTitleName),
                writeToDom: true
            }));
        },

        _initializeShellUIService: function () {
        	this.oShellUIService = new ShellUIService({
                scopeObject: this.getOwnerComponent(),
                scopeType: "component"
            });
        },

        _updateShellHeader: function (sTitle) {
            if (!this.oShellUIService) {
                this._initializeShellUIService();
            }
            this.oShellUIService.setTitle(sTitle);
            this.oShellUIService.setHierarchy([{
                icon: 'sap-icon://home',
                title: 'Home',
                intent: '#'
            }]);
        },

        /**
         *
         * @param sTerm - the input fiels
         * @returns {boolean} - the function return true if the input field is ' ' (space)  or '    '(a few spaces)
         * if the input field contains a not only spaces (for example 'a b')  or if it is an empty string the function should return false
         */
        containsOnlyWhiteSpac: function (sTerm) {
            if (!sTerm || sTerm === "")
                return false;
            var sTemp = sTerm;
            return (!sTemp.replace(/\s/g, '').length)
        }

    });
}, /* bExport= */ false);
},
	"sap/ushell/components/flp/launchpad/appfinder/AppFinder.view.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(function () {
    "use strict";

    /*global jQuery, sap, jQuery */
    /*jslint nomen: true */

    sap.ui.jsview("sap.ushell.components.flp.launchpad.appfinder.AppFinder", {

        createContent: function () {
            this.oController = this.getController();
            this.parentComponent = sap.ui.core.Component.getOwnerComponentFor(this);
            this.setModel(this.parentComponent.getModel());
            this.enableEasyAccessSAPMenu = this.getModel().getProperty("/enableEasyAccessSAPMenu");
            this.enableEasyAccessUserMenu = this.getModel().getProperty("/enableEasyAccessUserMenu");

            if ((!this.enableEasyAccessSAPMenu && !this.enableEasyAccessUserMenu) || //show only catalog in case both menus are not enabled
                    (sap.ui.Device.system.phone || sap.ui.Device.system.tablet && (!sap.ui.Device.system.combi))) {
                this.showEasyAccessMenu = false;
            } else {
                this.showEasyAccessMenu = true;
            }
            var oResourceBundle = sap.ushell.resources.i18n;

            this.oPage = new sap.m.Page("appFinderPage", {
                showHeader: false,
                showSubHeader: false,
                showFooter: false,
                showNavButton: false,
                enableScrolling: false,
                title : {
                    parts : ["/groupContext/title"],
                    formatter : function (title) {
                        return !title ? oResourceBundle.getText("appFinderTitle") : oResourceBundle.getText("appFinder_group_context_title", title);
                    }
                }
            });
            return this.oPage;
        },

        /*
         This method checks according to the menu id if search is enabled
         according to the configuration.
         Empty menu id is treated as 'catalog' as when loading the appFinder if no menu
         identified as a routing parameter then we load catalog by default
         */
        _showSearch: function (sMenu) {
            var sModelProperty = "searchFiltering";
            if (sMenu === "userMenu") {
                sModelProperty = "enableEasyAccessUserMenuSearch";
            } else if (sMenu === "sapMenu") {
                sModelProperty = "enableEasyAccessSAPMenuSearch";
            }

            return this.getModel().getProperty("/" + sModelProperty);
        },

        /*
         This method checks according to the menu id if tags is enabled
         according to the configuration.
         Empty menu id is treated as 'catalog' as when loading the appFinder if no menu
         identified as a routing parameter then we load catalog by default
         */
        _showSearchTag: function (sMenu) {
            if (sMenu === "userMenu" || sMenu === "sapMenu") {
                return false;
            }
            return this.getModel().getProperty("/tagFiltering");
        },

        // onAfterHide: function () {
        //     var oController = this.getController(),
        //         bResetSearch = oController.oSubHeaderModel.getProperty("/search/searchMode") || oController.oSubHeaderModel.getProperty("/search/searchTerm");
        //
        //     //If searchMode is true, we need to reset the search model and term in preparation to the next entrance to the app finder
        //     if (bResetSearch) {
        //         // reset the model
        //         oController._resetSubHeaderModel();
        //         // reset the actual vlue on the search field control
        //         this.oAppFinderSearchControl.setValue("");
        //     }
        // },

        createSubHeader: function () {

            // first time creation for the toolbar - which is the actual control of the page's sub header
            if (!this.oToolbar) {
                this.oToolbar = new sap.m.Toolbar("appFinderSubHeader", {
                });

                this.oToolbar.addEventDelegate({
                    onsapskipback: function (oEvent) {
                        oEvent.preventDefault();
                        sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                        sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                    },
                    onsapskipforward: function (oEvent) {
                        var openCloseSplitAppButton = sap.ui.getCore().byId("openCloseButtonAppFinderSubheader");
                        if (openCloseSplitAppButton.getVisible() && !openCloseSplitAppButton.getPressed()) {
                            oEvent.preventDefault();
                            sap.ushell.components.flp.ComponentKeysHandler.setFocusOnCatalogTile();
                        }
                    },
                    onAfterRendering: function () {
                        jQuery("#catalog").attr("accesskey", "a");
                    }
                });

                this.oToolbar.addCustomData(new sap.ushell.ui.launchpad.AccessibilityCustomData({
                    key: "role",
                    value: "heading",
                    writeToDom: true
                }));

                this.oToolbar.addCustomData(new sap.ushell.ui.launchpad.AccessibilityCustomData({
                    key: "aria-level",
                    value: "2",
                    writeToDom: true
                }));

                this.oToolbar.addStyleClass('sapUshellAppFinderHeader');
                this.oPage.setSubHeader(this.oToolbar);
                this.oPage.setShowSubHeader(true);
            }


            if (!this.openCloseSplitAppButton) {
                //create toggle button for open/close the master part of the splitApp control
                this.openCloseSplitAppButton = new sap.m.ToggleButton("openCloseButtonAppFinderSubheader", {
                    icon: "sap-icon://menu2",
                    visible: "{/openCloseSplitAppButtonVisible}",
                    pressed: "{/openCloseSplitAppButtonToggled}",
                    press: function (oEvent) {
                        this.getController().oSubHeaderModel.setProperty('/openCloseSplitAppButtonToggled', oEvent.getSource().getPressed());
                        this.openCloseSplitAppButton.setTooltip(oEvent.getParameter("pressed") ?
                            sap.ushell.resources.i18n.getText("ToggleButtonHide") :
                            sap.ushell.resources.i18n.getText("ToggleButtonShow"))
                    }.bind(this),
                    tooltip: sap.ushell.resources.i18n.getText("ToggleButtonShow")
                });

                this.openCloseSplitAppButton.addEventDelegate({
                    onsaptabprevious: function (oEvent) {
                        oEvent.preventDefault();
                        sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                        sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                    }
                });

                this.openCloseSplitAppButton.setModel(this.getController().oSubHeaderModel);
                this.oToolbar.addContent(this.openCloseSplitAppButton);
            }
        },

        updateSubHeader: function (sMenu, bEasyAccess) {
            var segmentedButtons,
                searchControl;

            // clear content from toolbar
            this.oToolbar.removeAllContent();
            this.oToolbar.addContent(this.openCloseSplitAppButton);

            // bEasyAccess means that we need the segmented button easy access menu entries
            if (bEasyAccess) {
                segmentedButtons = this.createSegmentedButtons(sMenu);
                this.oPage.addStyleClass('sapUshellAppFinderWithEasyAccess');
                this.oToolbar.addContent(segmentedButtons);
            }

            // render the search control in the sub-header
            if (this._showSearch(sMenu)) {
                searchControl = this.createSearchControl(sMenu);
                this.oToolbar.addContent(searchControl);
            }
            // make sure we always update the current menu when updating the sub header
            this.getController()._updateCurrentMenuName(sMenu);
        },

        createSegmentedButtons: function (sMenu) {
            var oController,
                oResourceBundle,
                segmentedButtonsArray,
                aButtons,
                button,
                i;

            if (this.segmentedButton) {
                this.segmentedButton.setSelectedButton(sMenu);
                return this.segmentedButton;
            }

            oController = this.getController();
            oResourceBundle = sap.ushell.resources.i18n;
            segmentedButtonsArray = [];
            segmentedButtonsArray.push(new sap.m.Button("catalog", {
                text: oResourceBundle.getText("appFinderCatalogTitle"),
                press: function (oEvent) {
                    oController.onSegmentButtonClick(oEvent);
                }
            }));
            if (this.enableEasyAccessUserMenu) {
                segmentedButtonsArray.push(new sap.m.Button('userMenu', {
                    text: oResourceBundle.getText("appFinderUserMenuTitle"),
                    press: function (oEvent) {
                        oController.onSegmentButtonClick(oEvent);
                    }
                }));
            }
            if (this.enableEasyAccessSAPMenu) {
                segmentedButtonsArray.push(new sap.m.Button('sapMenu', {
                    text: oResourceBundle.getText("appFinderSapMenuTitle"),
                    press: function (oEvent) {
                        oController.onSegmentButtonClick(oEvent);
                    }
                }));
            }
            this.segmentedButton = new sap.m.SegmentedButton("appFinderSegmentedButtons", {
                buttons: segmentedButtonsArray
            });

            this.segmentedButton.addEventDelegate({
                onsaptabprevious: function (oEvent) {
                    var openCloseSplitAppButton = sap.ui.getCore().byId("openCloseButtonAppFinderSubheader");
                    if (!openCloseSplitAppButton.getVisible()) {
                        oEvent.preventDefault();
                        sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                        sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                    }
                }
            });

            this.segmentedButton.setSelectedButton(sMenu);
            aButtons = this.segmentedButton.getButtons();
            for (i = 0; i < aButtons.length; i++) {
                button = aButtons[i];
                button.addCustomData(new sap.ushell.ui.launchpad.AccessibilityCustomData({
                    key: "aria-controls",
                    value: button.getId() + "View",
                    writeToDom: true
                }));
            }

            return this.segmentedButton;
        },

        _handleSearch: function () {
            // invoke the search handler on the controller
            this.getController().searchHandler.apply(this.getController(), arguments);
            // select text right after search executed
            jQuery('#appFinderSearch input').select();
        },

        createSearchControl: function (sMenu) {
            if (!this.oAppFinderSearchContainer) {
                this.oAppFinderSearchContainer = new sap.m.FlexBox("appFinderSearchContainer");
            }

            this.oAppFinderSearchContainer.removeAllItems();

            if (sMenu === 'catalog' && this._showSearchTag('catalog')) {
                this.createTagControl();
                this.oAppFinderSearchContainer.addItem(this.oAppFinderTagFilter);
            }

            if (!this.oAppFinderSearchControl) {
                this.oAppFinderSearchControl = new sap.m.SearchField("appFinderSearch", {
                    search: this._handleSearch.bind(this),
                    value: {
                        path: 'subHeaderModel>/search/searchTerm',
                        mode: sap.ui.model.BindingMode.OneWay
                    }
                }).addStyleClass('help-id-catalogSearch');// xRay help ID;

                this.oAppFinderSearchControl.addCustomData(new sap.ushell.ui.launchpad.AccessibilityCustomData({
                    key: "aria-controls",
                    value: "",
                    writeToDom: true
                }));

                this.oAppFinderSearchControl.addEventDelegate({
                    onsaptabnext: function (oEvent) {
                        var openCloseSplitAppButton = sap.ui.getCore().byId("openCloseButtonAppFinderSubheader");
                        if (openCloseSplitAppButton.getVisible() && !openCloseSplitAppButton.getPressed()) {
                            oEvent.preventDefault();
                            sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                            sap.ushell.components.flp.ComponentKeysHandler.setFocusOnCatalogTile();
                        }
                    }
                });
            }
            this.oAppFinderSearchContainer.addItem(this.oAppFinderSearchControl);

            this._updateSearchWithPlaceHolder(sMenu);
            return this.oAppFinderSearchContainer;

        },

        _updateSearchWithPlaceHolder: function (sMenu) {
            var sSearchPlaceHolderKey = "";
            if (sMenu === 'catalog') {
                sSearchPlaceHolderKey = "EasyAccessMenu_SearchPlaceHolder_Catalog";
            } else if (sMenu === 'userMenu') {
                sSearchPlaceHolderKey = "EasyAccessMenu_SearchPlaceHolder_UserMenu";
            } else if (sMenu === 'sapMenu') {
                sSearchPlaceHolderKey = "EasyAccessMenu_SearchPlaceHolder_SAPMenu";
            }

            if (sSearchPlaceHolderKey && this.oAppFinderSearchControl) {
                this.oAppFinderSearchControl.setPlaceholder(sap.ushell.resources.i18n.getText(sSearchPlaceHolderKey));
                this.oAppFinderSearchControl.setTooltip(sap.ushell.resources.i18n.getText(sSearchPlaceHolderKey));
            }
        },




        createTagControl : function () {
            if (this.oAppFinderTagFilter) {
                return this.oAppFinderTagFilter;
            }
            this.oAppFinderTagFilter = new sap.m.MultiComboBox("appFinderTagFilter", {
                selectedKeys: {
                    path: "subHeaderModel>/tag/selectedTags"
                },
                tooltip: "{i18n>catalogTilesTagfilter_tooltip}",
                placeholder: "{i18n>catalogTilesTagfilter_HintText}",
                visible: {
                    path : "/tagList",
                    formatter: function (aTagList) {
                        return aTagList.length > 0;
                    }
                },
                //Use catalogs model as a demo content until the real model is implemented
                items : {
                    path : "/tagList",
                    sorter : new sap.ui.model.Sorter("tag", false, false),
                    template : new sap.ui.core.ListItem({
                        text : "{tag}",
                        key : "{tag}"
                    })
                },
                selectionChange : [ this.oController.onTagsFilter, this.oController ]
            }).addStyleClass('help-id-catalogTagFilter');// xRay help ID;

            return this.oAppFinderTagFilter;
        },

        getControllerName: function () {
            return "sap.ushell.components.flp.launchpad.appfinder.AppFinder";
        }
    });


}, /* bExport= */ false);
},
	"sap/ushell/components/flp/launchpad/appfinder/Catalog.controller.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(["sap/ushell/components/flp/launchpad/PagingManager"], function(PagingManager) {
	"use strict";

    /*global jQuery, $, sap, window, hasher*/
    /*jslint nomen: true */

    sap.ui.controller("sap.ushell.components.flp.launchpad.appfinder.Catalog", {
        oPopover: null,
        onInit: function () {
            // take the sub-header model
            this.categoryFilter = "";
            this.oMainModel = this.oView.getModel();
            this.oSubHeaderModel = this.oView.getModel("subHeaderModel");

            var that = this,
                oSelectedTagsBinding = this.oSubHeaderModel.bindProperty("/tag/selectedTags"),
                oSearchModelBinding = this.oSubHeaderModel.bindProperty("/search"),
                oTagMode = this.oSubHeaderModel.bindProperty("/tag/tagMode");

            sap.ui.getCore().byId("catalogSelect").addEventDelegate({
                onBeforeRendering : this.onBeforeSelectRendering
            }, this);
            var oRouter = this.getView().parentComponent.getRouter();
            oRouter.getRoute("catalog").attachPatternMatched(function (oEvent) {
                that.onShow(oEvent);
            });
            oRouter.getRoute("appFinder").attachPatternMatched(function (oEvent) {
                that.onShow(oEvent);
            });
            this.timeoutId = 0;

            document.subHeaderModel = this.oSubHeaderModel;
            document.mainModel = this.oMainModel;

            oSearchModelBinding.attachChange(that.handleSearchModelChanged.bind(this));
            oSelectedTagsBinding.attachChange(that.handleSearchModelChanged.bind(this));
            oTagMode.attachChange(that.handleSearchModelChanged.bind(this));
            // init listener for the toggle button bindig context
            var oToggleButtonModelBinding = this.oSubHeaderModel.bindProperty("/openCloseSplitAppButtonToggled");
            oToggleButtonModelBinding.attachChange(that.handleToggleButtonModelChanged.bind(this));
        },

        onBeforeRendering: function () {
            //Invoking loading of all catalogs here instead of 'onBeforeShow' as it improves the perceived performance.
            //Fix of incident#:1570469901
            sap.ui.getCore().getEventBus().publish("renderCatalog");
        },

        onAfterRendering: function () {
            // disable swipe gestures -> never show master in Portait mode
            var oModel = this.getView().getModel(),
                aCurrentCatalogs = oModel.getProperty('/catalogs'),
                that = this;
            //check if the catalogs were already loaded, if so, we don't need the loading message
            if (!aCurrentCatalogs.length) {
//                oModel.setProperty('/catalogsNoDataText', sap.ushell.resources.i18n.getText('loadingTiles'));
                //TODO daniel & eran: Add text propery on the catalog container to display the status message.
            } else if (aCurrentCatalogs[0].title != sap.ushell.resources.i18n.getText('catalogsLoading')) {
                //oModel.setProperty('/catalogsNoDataText', sap.ushell.resources.i18n.getText('noFilteredItems'));
            }

            if (!this.PagingManager) {
                this.lastCatalogId = 0;
                this.PagingManager = new PagingManager('catalogPaging', {
                    supportedElements: {
                        tile : {className: 'sapUshellTile'}
                    },
                    containerHeight: window.innerHeight,
                    containerWidth: window.innerWidth
                });

                //we need PagingManager in CatalogContainer in order to allocate page if catalog is selected.
                this.getView().getCatalogContainer().setPagingManager(this.PagingManager);
            }

            //just the first time
            if (this.PagingManager.currentPageIndex === 0) {
                that.allocateNextPage();
            }

            jQuery(window).resize(function () {
                var windowWidth = $(window).width(),
                    windowHeight = $(window).height();

                that.PagingManager.setContainerSize(windowWidth, windowHeight);
            });
            that._handleAppFinderWithDocking();
            sap.ui.getCore().getEventBus().subscribe("launchpad", "appFinderWithDocking", that._handleAppFinderWithDocking,this);
        },

        _decodeUrlFilteringParameters: function (sUrlParameters) {
            var oUrlParameters = sUrlParameters ? JSON.parse(sUrlParameters) : sUrlParameters,
                hashTag = (oUrlParameters && oUrlParameters.tagFilter && oUrlParameters.tagFilter) || "";

            if (hashTag) {
                try {
                    this.tagFilter = JSON.parse(hashTag);
                } catch (e) {
                    this.tagFilter = [];
                }
            } else {
                this.tagFilter = [];
            }
            this.categoryFilter = (oUrlParameters && oUrlParameters.catalogSelector && oUrlParameters.catalogSelector) || this.categoryFilter;
            if (this.categoryFilter) {
                this.categoryFilter = window.decodeURIComponent(this.categoryFilter);
            }
            this.searchFilter = (oUrlParameters && oUrlParameters.tileFilter && oUrlParameters.tileFilter) || null;
            if (this.searchFilter) {
                this.searchFilter = window.decodeURIComponent(this.searchFilter);
            }
        },

        _applyFilters: function () {
            if (this.categoryFilter) {
                // If all is selected pass an empty string.
                this.categoryFilter = sap.ushell.resources.i18n.getText('all') === this.categoryFilter ? '' : this.categoryFilter;
                this.getView().getModel().setProperty("/categoryFilter", this.categoryFilter);
                //According to UX definitions, if we have 'Category Filter' we shouldn't carry-on with the other filters.
                return;
            }


            if (this.searchFilter && this.searchFilter.length) {
                //Remove all asterisks from search query before applying the filter
                this.searchFilter = this.searchFilter.replace(/\*/g, '');
                this.oSubHeaderModel.setProperty('/search', {
                    searchMode: true,
                    searchTerm: this.searchFilter
                });
            }
            if (this.tagFilter && this.tagFilter.length) {
                this.oSubHeaderModel.setProperty('/tag', {
                    tagMode: true,
                    selectedTags: this.tagFilter
                });
            }
        },

        onShow: function (oEvent) {
            //if the user goes to the catalog directly (not via the dashboard)
            //we must close the loading dialog
            var oViewPortContainer,
                sUrlParameters = oEvent.getParameter('arguments').filters;

            // The catalog does not contain the notification preview,
            // hence, shifting the scaled center veiwport (when moving to the right viewport) is not needed
            oViewPortContainer = sap.ui.getCore().byId("viewPortContainer");
            if (oViewPortContainer) {
                oViewPortContainer.shiftCenterTransition(false);
            }

            $.extend(this.getView().getViewData(), oEvent);
            this._decodeUrlFilteringParameters(sUrlParameters);
            this._applyFilters();
        },

        resetPageFilter : function () {
            this.lastCatalogId = 0;
            this.allocateTiles = this.PagingManager.getNumberOfAllocatedElements();
            this.getView().getCatalogContainer().setCategoryAllocateTiles(this.allocateTiles);
        },

        allocateNextPage : function () {
            var oCatalogContainer = this.getView().getCatalogContainer();
            if (!this.nAllocatedTiles || this.nAllocatedTiles === 0) {
                //calculate the number of tiles in the page.
                this.PagingManager.moveToNextPage();
                this.allocateTiles = this.PagingManager._calcElementsPerPage();
                oCatalogContainer.setCategoryAllocateTiles(this.allocateTiles);
            }
        },

        onBeforeSelectRendering : function () {
            var oSelect = sap.ui.getCore().byId("catalogSelect"),
                aItems = jQuery.grep(oSelect.getItems(), jQuery.proxy(function (oItem) {
                    return oItem.getBindingContext().getObject().title === this.categoryFilter;
                }, this));

            if (!aItems.length && oSelect.getItems()[0]) {
                aItems.push(oSelect.getItems()[0]);
            }
        },

        setTagsFilter : function (aFilter) {
            var oParameterObject = {
                catalogSelector : this.categoryFilter,
                tileFilter : this.searchFilter ? encodeURIComponent(this.searchFilter) : "",
                tagFilter : aFilter,
                targetGroup : encodeURIComponent(this.getGroupContext())
            };
            this.getView().parentComponent.getRouter().navTo('appFinder', {'menu': 'catalog', filters: JSON.stringify(oParameterObject)}, true);
        },

        setCategoryFilter : function (aFilter) {
            var oParameterObject = {
                catalogSelector : aFilter,
                tileFilter : this.searchFilter ? encodeURIComponent(this.searchFilter) : "",
                tagFilter: JSON.stringify(this.tagFilter),
                targetGroup : encodeURIComponent(this.getGroupContext())
            };
            this.getView().parentComponent.getRouter().navTo('appFinder', {'menu': 'catalog', filters : JSON.stringify(oParameterObject)}, true);
        },

        setSearchFilter : function (aFilter) {
            var oParameterObject = {
                catalogSelector : this.categoryFilter,
                tileFilter : aFilter ? encodeURIComponent(aFilter) : "",
                tagFilter: JSON.stringify(this.tagFilter),
                targetGroup : encodeURIComponent(this.getGroupContext())
            };
            this.getView().parentComponent.getRouter().navTo('appFinder', {'menu': 'catalog', 'filters' : JSON.stringify(oParameterObject)});
        },

        /**
         * Returns the group context path string as kept in the model
         *
         * @returns {string} Group context
         */
        getGroupContext :  function () {
            var oModel = this.getView().getModel(),
                sGroupContext = oModel.getProperty("/groupContext/path");

            return sGroupContext ? sGroupContext : "";
        },

        _isTagFilteringChanged: function (aSelectedTags) {
            var bSameLength = aSelectedTags.length === this.tagFilter.length,
                bIntersect = bSameLength;

            //Checks whether there's a symmetric difference between the currently selected tags and those persisted in the URL.
            if (!bIntersect) {
                return true;
            }
            aSelectedTags.some(function (sTag, iIndex) {
                bIntersect = jQuery.inArray(sTag, this.tagFilter) !== -1;

                return !bIntersect;
            }.bind(this));

            return bIntersect;
        },

        _setUrlWithTagsAndSearchTerm: function(sSearchTerm, aSelectedTags) {
            var oUrlParameterObject = {
                tileFilter : sSearchTerm && sSearchTerm.length ? encodeURIComponent(sSearchTerm) : '',
                tagFilter: aSelectedTags.length ? JSON.stringify(aSelectedTags) : [],
                targetGroup : encodeURIComponent(this.getGroupContext())
            };

            this.getView().parentComponent.getRouter().navTo('appFinder', {
                'menu': 'catalog',
                'filters' : JSON.stringify(oUrlParameterObject)
            });
        },


        handleSearchModelChanged: function () {
            var sActiveMenu = this.oSubHeaderModel.getProperty('/activeMenu'),
                bSearchMode = this.oSubHeaderModel.getProperty('/search/searchMode'),
                bTagMode = this.oSubHeaderModel.getProperty('/tag/tagMode'),
                sPageName,
                sSearchTerm = this.oSubHeaderModel.getProperty('/search/searchTerm'),
                aSelectedTags = this.oSubHeaderModel.getProperty('/tag/selectedTags'),
                otagFilter,
                aFilters = [],
                oSearchResults;

            // if view ID does not contain the active menu then return
            if (this.oView.getId().indexOf(sActiveMenu) !== -1) {
                if (bSearchMode || bTagMode) {
                    //cahnge the category selection to all
                    this.oView.setCategoryFilterSelection();

                    if (!this.oView.oCatalogEntrySearchContainer.getBinding("customTilesContainer")) {
                        this.oView.oCatalogEntrySearchContainer.bindAggregation("customTilesContainer", {
                            path : "/catalogSearchEntity/customTiles",
                            template: this.oView.oTileTemplate,
                            // Table rows (i.e. notification types) are sorted by type name, which is the NotificationTypeDesc field
                            templateShareable: true
                        });
                    }

                    if (!this.oView.oCatalogEntrySearchContainer.getBinding("appBoxesContainer")) {
                        this.oView.oCatalogEntrySearchContainer.bindAggregation("appBoxesContainer", {
                            path : "/catalogSearchEntity/appBoxes",
                            template: this.oView.oAppBoxesTemplate,
                            // Table rows (i.e. notification types) are sorted by type name, which is the NotificationTypeDesc field
                            templateShareable: true
                        });
                    }

                    if (aSelectedTags && aSelectedTags.length > 0) {
                        otagFilter = new sap.ui.model.Filter('tags', 'EQ', 'v');
                        otagFilter.fnTest = function (oTags) {
                            var ind, filterByTag;
                            if (aSelectedTags.length === 0) {
                                return true;
                            }

                            for (ind = 0; ind < aSelectedTags.length; ind++) {
                                filterByTag = aSelectedTags[ind];
                                if (oTags.indexOf(filterByTag) === -1) {
                                    return false;
                                }
                            }
                            return true;
                        }.bind(this);

                        aFilters.push(otagFilter);
                    }

                    //Remove all asterisks from search query before applying the filter
                    sSearchTerm = sSearchTerm ? sSearchTerm.replace(/\*/g, '') : sSearchTerm;

                    if (sSearchTerm) {
                        var aSearchTermParts = sSearchTerm.split(/[\s,]+/);
                        //create search filter with all the parts for keywords and apply AND operator ('true' indicates that)
                        var keywordsSearchFilter = new sap.ui.model.Filter(jQuery.map(aSearchTermParts, function (value) {
                            return (value && new sap.ui.model.Filter("keywords", sap.ui.model.FilterOperator.Contains, value));
                        }), true);

                        //create search filter with all the parts for title and apply AND operator ('true' indicates that)
                        var titleSearchFilter = new sap.ui.model.Filter($.map(aSearchTermParts, function (value) {
                            return (value && new sap.ui.model.Filter("title", sap.ui.model.FilterOperator.Contains, value));
                        }), true);

                        //create search filter with all the parts for subtitle and apply AND operator ('true' indicates that)
                        var subtitleSearchFilter = new sap.ui.model.Filter($.map(aSearchTermParts, function (value) {
                            return (value && new sap.ui.model.Filter("subtitle", sap.ui.model.FilterOperator.Contains, value));
                        }), true);

                        aFilters.push(keywordsSearchFilter);
                        aFilters.push(titleSearchFilter);
                        aFilters.push(subtitleSearchFilter);
                    }

                    this.oView.oCatalogEntrySearchContainer.getBinding("customTilesContainer").filter(aFilters);
                    this.oView.oCatalogEntrySearchContainer.getBinding("appBoxesContainer").filter(aFilters);

                    oSearchResults = this.oView.oCatalogEntrySearchContainer.getNumberResults();
                    this.bSearchResults = (oSearchResults.nAppboxes + oSearchResults.nCustom > 0);

                    this.oView.oCatalogEntrySearchContainer.setAfterHandleElements(function(oInstance) {
                        var oNumberOfElements = oInstance.getNumberResults();
                        this.bSearchResults = (oNumberOfElements.nAppboxes + oNumberOfElements.nCustom > 0);
                        this.oView.splitApp.toDetail(this.getView()._calculateDetailPageId());
                    }.bind(this));

                    //It has been required by UX to set 'All Catalogs' as selected when in search/tag mode
                    this._showHideSelectedMasterItem(false);

                    // set the filtering parameters in the url.
                    if (this._isTagFilteringChanged(aSelectedTags)) {
                        this._setUrlWithTagsAndSearchTerm(sSearchTerm, aSelectedTags);
                    }
                } else {
                    this._showHideSelectedMasterItem(true);
                    this.setCategoryFilter(this.categoryFilter);
                }
                sPageName = this.getView()._calculateDetailPageId();
                this.oView.splitApp.toDetail(sPageName);
            } else {
                //For the edge case in which we return to the catalog after exsiting search mode in the EAM.
                this._restoreSelectedMasterItem();
            }
        },


        _handleAppFinderWithDocking: function () {
            //check if docking
            if (jQuery(".sapUshellContainerDocked").length > 0) {
                // 710 is the size of sap.ui.Device.system.phone
                // 1024 docking supported only in L size.
                if (jQuery("#mainShell").width() < 710) {
                    if (window.innerWidth < 1024) {
                        this.oSubHeaderModel.setProperty("/openCloseSplitAppButtonVisible", false);
                        this.oView.splitApp.setMode(sap.m.SplitAppMode.ShowHideMode);
                    } else {
                        this.oView.splitApp.setMode(sap.m.SplitAppMode.HideMode);
                        this.oSubHeaderModel.setProperty("/openCloseSplitAppButtonVisible", true);
                    }
                } else {
                    this.oSubHeaderModel.setProperty("/openCloseSplitAppButtonVisible", false);
                    this.oView.splitApp.setMode(sap.m.SplitAppMode.ShowHideMode);
                }
            }else{
                if(window.innerWidth < 1024 && window.innerWidth > 715 ){
                    this.oSubHeaderModel.setProperty("/openCloseSplitAppButtonVisible", false);
                    this.oView.splitApp.setMode(sap.m.SplitAppMode.ShowHideMode);
                }
            }
        },


        _showHideSelectedMasterItem: function (bIsVisible) {
            var oCatalogsList = this.oView.splitApp.getMasterPage('catalogSelect'),
                oCatalogsListSelectedItem = oCatalogsList.getSelectedItem();

            if (oCatalogsListSelectedItem) {
                oCatalogsListSelectedItem.toggleStyleClass("sapUshellHideSelectedListItem",!bIsVisible);
            }
        },

        _restoreSelectedMasterItem: function () {
            var oCatalogsList = this.oView.splitApp.getMasterPage('catalogSelect'),
                oOrigSelectedListItem = sap.ui.getCore().byId(this.selectedCategoryId);

            if (oOrigSelectedListItem) {
                this.categoryFilter = oOrigSelectedListItem.getTitle();
            }
            oCatalogsList.setSelectedItem(oOrigSelectedListItem);
        },

        handleToggleButtonModelChanged: function () {
            var bButtonVisible = this.oSubHeaderModel.getProperty("/openCloseSplitAppButtonVisible"),
                bButtonToggled = this.oSubHeaderModel.getProperty("/openCloseSplitAppButtonToggled");

            // if there was a change in the boolean toogled flag
            // (this can be called via upadte to subheader model from AppFinder, in such a case we do not
            // need to switch the views)
            if (bButtonToggled != this.bCurrentButtonToggled) {

                // for device which is not a Phone
                if (!sap.ui.Device.system.phone) {

                    if (bButtonVisible) {
                        if (bButtonToggled && !this.oView.splitApp.isMasterShown()) {
                            this.oView.splitApp.showMaster();
                        } else if (this.oView.splitApp.isMasterShown()) {
                            this.oView.splitApp.hideMaster();
                        }
                    }
                } else {

                    // for Phone the split app is behaving differently
                    if (bButtonVisible) {
                        if (bButtonToggled && !this.oView.splitApp.isMasterShown()) {

                            // go to master
                            var oCatalogSelectMaster = sap.ui.getCore().byId('catalogSelect');
                            this.oView.splitApp.backMaster(oCatalogSelectMaster);

                        } else if (this.oView.splitApp.isMasterShown()) {
                            // calculate the relevant detailed page to nav to
                            var oDetail = sap.ui.getCore().byId(this.getView()._calculateDetailPageId());
                            this.oView.splitApp.toDetail(oDetail);
                        }
                    }
                }
            }

            this.bCurrentButtonToggled = bButtonToggled;
        },

        _handleCatalogListItemPress: function (oEvent) {
            this.onCategoryFilter(oEvent);
            //eliminate the Search and Tag mode.
            this.oSubHeaderModel.setProperty('/search/searchMode', false);
            this.oSubHeaderModel.setProperty('/tag/tagMode', false);

            // on phone, we must make sure the toggle button gets untoggled on every navigation
            // in the master page
            if (sap.ui.Device.system.phone || sap.ui.Device.system.tablet) {
                this.oSubHeaderModel.setProperty('/openCloseSplitAppButtonToggled', !this.oSubHeaderModel.setProperty('/openCloseSplitAppButtonToggled'));
            }
            this.handleSearchModelChanged();
        },

        onCategoryFilter : function (oEvent) {
            var oMasterList = oEvent.getSource(),
                oSelectedCatalog = oMasterList.getSelectedItem(),
                oSelectedCatalogBindingCtx = oSelectedCatalog.getBindingContext(),
                oModel = oSelectedCatalogBindingCtx.getModel();
            if (oModel.getProperty("static", oSelectedCatalogBindingCtx)) { // show all categories
                oModel.setProperty("/showCatalogHeaders", true);
                this.setCategoryFilter();
                this.selectedCategoryId = undefined;
                this.categoryFilter = undefined;
            } else { // filter to category
                oModel.setProperty("/showCatalogHeaders", false);
                this.setCategoryFilter(window.encodeURIComponent(oSelectedCatalog.getBindingContext().getObject().title));
                this.categoryFilter = oSelectedCatalog.getTitle();
                this.selectedCategoryId = oSelectedCatalog.getId();
            }
        },

        onTileAfterRendering : function (oEvent) {
            var jqTile = jQuery(oEvent.oSource.getDomRef()),
                jqTileInnerTile = jqTile.find(".sapMGT");

            jqTileInnerTile.attr("tabindex", "-1");
        },

        catalogTilePress : function (oController) {
            sap.ui.getCore().getEventBus().publish("launchpad", "catalogTileClick");
        },

        onAppBoxPressed: function (oEvent) {
            var oAppBox = oEvent.getSource(),
                oTile = oAppBox.getBindingContext().getObject(),
                fnPressHandler;
            if (oEvent.mParameters.srcControl.$().closest(".sapUshellPinButton").length) {
                return;
            }

            fnPressHandler = sap.ushell.Container.getService("LaunchPage").getAppBoxPressHandler(oTile);

            if (fnPressHandler) {
                fnPressHandler(oTile);
            } else {
                var sUrl = oAppBox.getProperty("url");
                if (sUrl && sUrl.indexOf("#") === 0) {
                    hasher.setHash(sUrl);
                }
                else {
                    window.open(sUrl, '_blank');
                }
            }
        },


        /**
         * Event handler triggered if tile should be added to the default group.
         *
         * @param {sap.ui.base.Event} oEvent
         *     the event object. It is expected that the binding context of the event source points to the tile to add.
         */
        onTilePinButtonClick : function (oEvent) {
            var launchPageService = sap.ushell.Container.getService("LaunchPage");
            var oDefaultGroupPromise = launchPageService.getDefaultGroup();

            oDefaultGroupPromise.done(function(oDefaultGroup) {
                var clickedObject = oEvent.getSource(),
                    oSourceContext = clickedObject.getBindingContext(),
                    oModel = this.getView().getModel(),
                    sGroupModelPath = oModel.getProperty("/groupContext/path");

                // Check if the catalog was opened in the context of a group, according to the groupContext ("/groupContext/path") in the model
                if (sGroupModelPath) {
                    this._handleTileFooterClickInGroupContext(oSourceContext, sGroupModelPath);

                // If the catalog wasn't opened in the context of a group - the action of clicking a catalog tile should open the groups popover
                } else {
                    var groupList = oModel.getProperty("/groups");
                    var launchPageService = sap.ushell.Container.getService("LaunchPage");
                    var catalogTile = this.getCatalogTileDataFromModel(oSourceContext);
                    var tileGroups = catalogTile.tileData.associatedGroups;
                    var aGroupsInitialState = [];
                    var index = 0;
                    var groupsData = groupList.map(function (group) {
                        var realGroupID,
                            selected,
                            oTemp;

                        // Get the group's real ID
                        realGroupID = launchPageService.getGroupId(group.object);
                        // Check if the group (i.e. real group ID) exists in the array of groups that contain the relevant Tile
                        // if so - the check box that represents this group should be initially selected
                        selected = !($.inArray(realGroupID, tileGroups) == -1);
                        oTemp = {
                            id: realGroupID,
                            title: this._getGroupTitle(oDefaultGroup, group.object),
                            selected: selected
                        }
                        // Add the group to the array that keeps the groups initial state
                        // mainly whether or not the group included the relevant tile
                        aGroupsInitialState.push(oTemp);
                        index++;
                        return {
                            selected: selected,
                            initiallySelected: selected,
                            oGroup: group
                        };
                    }.bind(this));

                    // @TODO:Instead of the jQuery, we should maintain the state of the popover (i.e. opened/closed)
                    // using the afterOpen and afterClose events of sap.m.ResponsivePopover
                    var existingPopover = jQuery("#groupsPopover-popover");
                    if(existingPopover.length === 1) {
                        var oPopoverView = sap.ui.getCore().byId("sapUshellGroupsPopover");
                        oPopoverView.destroy();
                    }
                    var popoverView = new sap.ui.view("sapUshellGroupsPopover", {
                        type: sap.ui.core.mvc.ViewType.JS,
                        viewName: "sap.ushell.components.flp.launchpad.appfinder.GroupListPopover",
                        viewData: {
                            groupData: groupsData,
                            title: launchPageService.getCatalogTileTitle(oModel.getProperty(oSourceContext.sPath).src),
                            enableHideGroups: oModel.getProperty("/enableHideGroups"),
                            enableHelp: oModel.getProperty("/enableHelp"),
                            sourceContext: oSourceContext,
                            catalogModel: this.getView().getModel(),
                            catalogController: this


                        }
                    });
                    popoverView.getController().setSelectedStart(aGroupsInitialState);
                    popoverView.open(clickedObject).then(this._handlePopoverResponse.bind(this, oSourceContext, catalogTile));
                    }
            }.bind(this));
        },
        _getGroupTitle: function (oDefaultGroup, oGroupObject) {
            var oLaunchPageService = sap.ushell.Container.getService("LaunchPage"),
                title;
                //check if is it a default group- change title to "my home".
                if (oLaunchPageService.getGroupId(oDefaultGroup) === oLaunchPageService.getGroupId(oGroupObject)) {
                    title = sap.ushell.resources.i18n.getText("my_group");
                }
                else{
                    title = oLaunchPageService.getGroupTitle(oGroupObject);
                }
                return title;
        },
        _handlePopoverResponse: function (oSourceContext, catalogTile, responseData) {
            if (!responseData.addToGroups.length && !responseData.newGroups.length && !responseData.removeFromGroups.length) {
                return;
            }

            var oModel = this.getView().getModel();
            var groupList = oModel.getProperty("/groups");
            var promiseList = [];

            responseData.addToGroups.forEach(function (group) {
                var index = groupList.indexOf(group);
                var oGroupContext = new sap.ui.model.Context(oModel, "/groups/" + index);
                var promise = this._addTile(oSourceContext, oGroupContext);
                promiseList.push(promise);
            }.bind(this));
            responseData.removeFromGroups.forEach(function (group) {
                var tileCatalogId = oSourceContext.getModel().getProperty(oSourceContext.getPath()).id;
                var index = groupList.indexOf(group);
                var promise = this._removeTile(tileCatalogId, index);
                promiseList.push(promise);
            }.bind(this));
            responseData.newGroups.forEach(function (group) {
                var sNewGroupName = (group.length > 0) ? group : sap.ushell.resources.i18n.getText("new_group_name");
                var promise = this._createGroupAndSaveTile(oSourceContext, sNewGroupName);
                promiseList.push(promise);
            }.bind(this));

            jQuery.when.apply(jQuery, promiseList).then(function () {
                var resultList = Array.prototype.slice.call(arguments);
                this._handlePopoverGroupsActionPromises(catalogTile, responseData, resultList);
            }.bind(this));
        },

        _handlePopoverGroupsActionPromises: function (catalogTile, popoverResponse, resultList) {
            var errorList = resultList.filter(function (result, index, resultList) {
                return !result.status;
            });
            if (errorList.length) {
                var oErrorMessageObj = this.prepareErrorMessage(errorList, catalogTile.tileData.title);
                var dashboardMgr = sap.ushell.components.flp.launchpad.DashboardManager();
                dashboardMgr.resetGroupsOnFailure(oErrorMessageObj.messageId, oErrorMessageObj.parameters);
                return;
            }

            var tileGroupsIdList = [];
            var oLaunchPageService = sap.ushell.Container.getService("LaunchPage");
            popoverResponse.allGroups.forEach(function (group) {
                if (group.selected) {
                    var realGroupID = oLaunchPageService.getGroupId(group.oGroup.object);
                    tileGroupsIdList.push(realGroupID);
                }
            });
            var oModel = this.getView().getModel();
            if (popoverResponse.newGroups.length) {
                var dashboardGroups = oModel.getProperty("/groups");
                var newDashboardGroups = dashboardGroups.slice(dashboardGroups.length - popoverResponse.newGroups.length);
                newDashboardGroups.forEach(function (newGroup) {
                    var realGroupID = oLaunchPageService.getGroupId(newGroup.object);
                    tileGroupsIdList.push(realGroupID);
                });
            }

            oModel.setProperty(catalogTile.bindingContextPath + "/associatedGroups", tileGroupsIdList);
            var firstAddedGroupTitle = (!!popoverResponse.addToGroups[0]) ? popoverResponse.addToGroups[0].title : "";
            if (!firstAddedGroupTitle.length && popoverResponse.newGroups.length) {
                firstAddedGroupTitle = popoverResponse.newGroups[0];
            }
            var firstRemovedGroupTitle = (!!popoverResponse.removeFromGroups[0]) ? popoverResponse.removeFromGroups[0].title : "";
            var sDetailedMessage = this.prepareDetailedMessage(catalogTile.tileData.title, popoverResponse.addToGroups.length + popoverResponse.newGroups.length,
                popoverResponse.removeFromGroups.length, firstAddedGroupTitle, firstRemovedGroupTitle);
            sap.m.MessageToast.show( sDetailedMessage, {
                duration: 3000,// default
                width: "15em",
                my: "center bottom",
                at: "center bottom",
                of: window,
                offset: "0 -50",
                collision: "fit fit"
            });
        },

        _getCatalogTileIndexInModel : function (oSourceContext) {
            var tilePath = oSourceContext.sPath,
                tilePathPartsArray = tilePath.split("/"),
                tileIndex = tilePathPartsArray[tilePathPartsArray.length - 1];

            return tileIndex;
        },

        _handleTileFooterClickInGroupContext : function (oSourceContext, sGroupModelPath) {
            var oLaunchPageService = sap.ushell.Container.getService("LaunchPage"),
                oModel = this.getView().getModel(),
                catalogTile = this.getCatalogTileDataFromModel(oSourceContext),
                aAssociatedGroups = catalogTile.tileData.associatedGroups,
                oGroupModel = oModel.getProperty(sGroupModelPath), // Get the model of the group according to the group's model path (e.g. "groups/4")
                sGroupId = oLaunchPageService.getGroupId(oGroupModel.object),
                iCatalogTileInGroup = $.inArray(sGroupId, aAssociatedGroups),
                tileIndex = this._getCatalogTileIndexInModel(oSourceContext),
                oGroupContext,
                oAddTilePromise,
                oRemoveTilePromise,
                sTileCataogId,
                groupIndex,
                that = this;

            if (catalogTile.isBeingProcessed) {
                return;
            }
            oModel.setProperty('/catalogTiles/' + tileIndex + '/isBeingProcessed', true);
            // Check if this catalog tile already exist in the relevant group
            if (iCatalogTileInGroup == -1) {
                oGroupContext = new sap.ui.model.Context(oSourceContext.getModel(), sGroupModelPath);
                oAddTilePromise = this._addTile(oSourceContext, oGroupContext);

                // Function createTile of Dashboard manager always calls defferred.resolve,
                // and the success/failure indicator is the returned data.status
                oAddTilePromise.done(function (data) {
                    if (data.status == 1) {
                        that._groupContextOperationSucceeded(oSourceContext, catalogTile, oGroupModel, true);
                    } else {
                        that._groupContextOperationFailed(catalogTile, oGroupModel, true);
                    }
                });
                oAddTilePromise.always(function () {
                    oModel.setProperty('/catalogTiles/' + tileIndex + '/isBeingProcessed', false);
                });

            } else {
                sTileCataogId = oSourceContext.getModel().getProperty(oSourceContext.getPath()).id;
                groupIndex = sGroupModelPath.split('/')[2];
                oRemoveTilePromise = this._removeTile(sTileCataogId, groupIndex);

                // Function deleteCatalogTileFromGroup of Dashboard manager always calls defferred.resolve,
                // and the success/failure indicator is the returned data.status
                oRemoveTilePromise.done(function (data) {
                    if (data.status == 1) {
                        that._groupContextOperationSucceeded(oSourceContext, catalogTile, oGroupModel, false);
                    } else {
                        that._groupContextOperationFailed(catalogTile, oGroupModel, false);
                    }
                });
                oRemoveTilePromise.always(function () {
                    oModel.setProperty('/catalogTiles/' + tileIndex + '/isBeingProcessed', false);
                });
            }
        },

        /**
         * Handles success of add/remove tile action in group context.
         * Updates the model and shows an appropriate message to the user.
         *
         * @param {object} oSourceContext
         * @param {object} oCatalogTileModel - The catalog tile model from /catalogTiles array
         * @param {object} oGroupModel - The model of the relevant group
         * @param {boolean} bTileAdded - Whether the performed action is adding or removing the tile to/from the group
         */
        _groupContextOperationSucceeded : function (oSourceContext, oCatalogTileModel, oGroupModel, bTileAdded) {
            var oLaunchPageService = sap.ushell.Container.getService("LaunchPage"),
                sGroupId = oLaunchPageService.getGroupId(oGroupModel.object),
                aAssociatedGroups = oCatalogTileModel.tileData.associatedGroups,
                detailedMessage,
                i;

            // Check if this is an "add tile to group" action
            if (bTileAdded) {
                // Update the associatedGroups array of the catalog tile
                aAssociatedGroups.push(sGroupId);

                // Update the model of the catalog tile with the updated associatedGroups
                oSourceContext.getModel().setProperty(oCatalogTileModel.bindingContextPath + "/associatedGroups", aAssociatedGroups);

                detailedMessage = this.prepareDetailedMessage(oCatalogTileModel.tileData.title, 1, 0, oGroupModel.title, "");

            } else {
                // If this is a "remove tile from group" action

                // Update the associatedGroups array of the catalog tile
                for (i in aAssociatedGroups) {
                    if (aAssociatedGroups[i] == sGroupId) {
                        aAssociatedGroups.splice(i, 1);
                        break;
                    }
                }

                // Update the model of the catalog tile with the updated associatedGroups
                oSourceContext.getModel().setProperty(oCatalogTileModel.bindingContextPath + "/associatedGroups", aAssociatedGroups);
                detailedMessage = this.prepareDetailedMessage(oCatalogTileModel.tileData.title, 0, 1, "", oGroupModel.title);
            }

            sap.m.MessageToast.show(detailedMessage, {
                duration: 3000,// default
                width: "15em",
                my: "center bottom",
                at: "center bottom",
                of: window,
                offset: "0 -50",
                collision: "fit fit"
            });
        },

        /**
         * Handles failure of add/remove tile action in group context.
         * Shows an appropriate message to the user and reloads the groups.
         *
         * @param {object} oCatalogTileModel - The catalog tile model from /catalogTiles array
         * @param {object} oGroupModel - The model of the relevant group
         * @param {boolean} bTileAdded - Whether the performed action is adding or removing the tile to/from the group
         */
        _groupContextOperationFailed : function (oCatalogTileModel, oGroupModel, bTileAdded) {
            var dashboardMgr = sap.ushell.components.flp.launchpad.getDashboardManager(),
                oErrorMessage;

            if (bTileAdded) {
                oErrorMessage = sap.ushell.resources.i18n.getText({messageId: "fail_tile_operation_add_to_group", parameters: [oCatalogTileModel.tileData.title, oGroupModel.title]});
            } else {
                oErrorMessage = sap.ushell.resources.i18n.getText({messageId: "fail_tile_operation_remove_from_group", parameters: [oCatalogTileModel.tileData.title, oGroupModel.title]});
            }

            dashboardMgr.resetGroupsOnFailure(oErrorMessage.messageId, oErrorMessage.parameters);
        },

        prepareErrorMessage : function (aErroneousActions, sTileTitle) {
            var oGroup,
                sAction,
                sFirstErroneousAddGroup,
                sFirstErroneousRemoveGroup,
                iNumberOfFailAddActions = 0,
                iNumberOfFailDeleteActions = 0,
                bCreateNewGroupFailed = false,
                message;

            for (var index in aErroneousActions) {

                // Get the data of the error (i.e. action name and group object)

                oGroup = aErroneousActions[index].group;
                sAction = aErroneousActions[index].action;

                if (sAction == 'add') {
                    iNumberOfFailAddActions++;
                    if (iNumberOfFailAddActions == 1) {
                        sFirstErroneousAddGroup = oGroup.title;
                    }
                } else if (sAction == 'remove') {
                    iNumberOfFailDeleteActions++;
                    if (iNumberOfFailDeleteActions == 1) {
                        sFirstErroneousRemoveGroup = oGroup.title;
                    }
                } else if (sAction == 'addTileToNewGroup') {
                    iNumberOfFailAddActions++;
                    if (iNumberOfFailAddActions == 1) {
                        sFirstErroneousAddGroup = oGroup.title;
                    }
                } else {
                    bCreateNewGroupFailed = true;
                }
            }
            // First - Handle bCreateNewGroupFailed
            if (bCreateNewGroupFailed) {
                if (aErroneousActions.length == 1) {
                    message = sap.ushell.resources.i18n.getText({messageId: "fail_tile_operation_create_new_group"});
                } else {
                    message = sap.ushell.resources.i18n.getText({messageId: "fail_tile_operation_some_actions"});
                }
                // Single error - it can be either one add action or one remove action
            } else if (aErroneousActions.length == 1) {
                if (iNumberOfFailAddActions) {
                    message = sap.ushell.resources.i18n.getText({messageId: "fail_tile_operation_add_to_group", parameters: [sTileTitle, sFirstErroneousAddGroup]});
                } else {
                    message = sap.ushell.resources.i18n.getText({messageId: "fail_tile_operation_remove_from_group", parameters: [sTileTitle, sFirstErroneousRemoveGroup]});
                }
                // 	Many errors (iErrorCount > 1) - it can be several remove actions, or several add actions, or a mix of both
            } else {
                if (iNumberOfFailDeleteActions == 0) {
                    message = sap.ushell.resources.i18n.getText({messageId: "fail_tile_operation_add_to_several_groups", parameters: [sTileTitle]});
                } else if (iNumberOfFailAddActions == 0) {
                    message = sap.ushell.resources.i18n.getText({messageId: "fail_tile_operation_remove_from_several_groups", parameters: [sTileTitle]});
                } else {
                    message = sap.ushell.resources.i18n.getText({messageId: "fail_tile_operation_some_actions"});
                }
            }
            return message;
        },

        prepareDetailedMessage : function (tileTitle, numberOfAddedGroups, numberOfRemovedGroups, firstAddedGroupTitle, firstRemovedGroupTitle) {
            var message;

            if (numberOfAddedGroups == 0) {
                if (numberOfRemovedGroups == 1) {
                    message = sap.ushell.resources.i18n.getText("tileRemovedFromSingleGroup", [tileTitle, firstRemovedGroupTitle]);
                } else if (numberOfRemovedGroups > 1) {
                    message = sap.ushell.resources.i18n.getText("tileRemovedFromSeveralGroups", [tileTitle, numberOfRemovedGroups]);
                }
            } else if (numberOfAddedGroups == 1) {
                if (numberOfRemovedGroups == 0) {
                    message = sap.ushell.resources.i18n.getText("tileAddedToSingleGroup", [tileTitle, firstAddedGroupTitle]);
                } else if (numberOfRemovedGroups == 1) {
                    message = sap.ushell.resources.i18n.getText("tileAddedToSingleGroupAndRemovedFromSingleGroup", [tileTitle, firstAddedGroupTitle, firstRemovedGroupTitle]);
                } else if (numberOfRemovedGroups > 1) {
                    message = sap.ushell.resources.i18n.getText("tileAddedToSingleGroupAndRemovedFromSeveralGroups", [tileTitle, firstAddedGroupTitle, numberOfRemovedGroups]);
                }
            } else if (numberOfAddedGroups > 1) {
                if (numberOfRemovedGroups == 0) {
                    message = sap.ushell.resources.i18n.getText("tileAddedToSeveralGroups", [tileTitle, numberOfAddedGroups]);
                } else if (numberOfRemovedGroups == 1) {
                    message = sap.ushell.resources.i18n.getText("tileAddedToSeveralGroupsAndRemovedFromSingleGroup", [tileTitle, numberOfAddedGroups, firstRemovedGroupTitle]);
                } else if (numberOfRemovedGroups > 1) {
                    message = sap.ushell.resources.i18n.getText("tileAddedToSeveralGroupsAndRemovedFromSeveralGroups", [tileTitle, numberOfAddedGroups, numberOfRemovedGroups]);
                }
            }
            return message;
        },

        /**
         * Returns the part of the model that contains the IDs of the groups that contain the relevant Tile
         *
         * @param {} oSourceContext
         *     model context
         */
        getCatalogTileDataFromModel : function (oSourceContext) {
            var sBindingCtxPath = oSourceContext.getPath(),
                oModel = oSourceContext.getModel(),
                oTileData = oModel.getProperty(sBindingCtxPath);

            // Return an object containing the Tile in the CatalogTiles Array (in the model) ,its index and whether it's in the middle of add/removal proccess.
            return {
                tileData: oTileData,
                bindingContextPath: sBindingCtxPath,
                isBeingProcessed: oTileData.isBeingProcessed ? true : false
            };
        },

        /**
         * Send request to add a tile to a group. Request is triggered asynchronously, so UI is not blocked.
         *
         * @param {sap.ui.model.Context} oTileContext
         *     the catalog tile to add
         * @param {sap.ui.model.Context} oGroupContext
         *     the group where the tile should be added
         * @private
         */
        _addTile : function (oTileContext, oGroupContext) {
            var oDashboardManager = sap.ushell.components.flp.launchpad.getDashboardManager(),
                deferred = jQuery.Deferred(),
                promise = oDashboardManager.createTile({
                    catalogTileContext : oTileContext,
                    groupContext: oGroupContext
                });

            promise.done(function(data){
                deferred.resolve(data);
            });

            return deferred;
        },

        /**
         * Send request to delete a tile from a group. Request is triggered asynchronously, so UI is not blocked.
         *
         * @param tileCatalogId
         *     the id of the tile
         * @param index
         *     the index of the group in the model
         * @private
         */
        _removeTile : function (tileCatalogId, index) {
            var oDashboardManager = sap.ushell.components.flp.launchpad.getDashboardManager(),
                deferred = jQuery.Deferred(),
                promise = oDashboardManager.deleteCatalogTileFromGroup({
                    tileId : tileCatalogId,
                    groupIndex : index
                });

            // The function deleteCatalogTileFromGroup always results in deferred.resolve
            // and the actual result of the action (success/failure) is contained in the data object
            promise.done(function(data){
                deferred.resolve(data);
            });

            return deferred;
        },

        /**
         * Send request to create a new group and add a tile to this group. Request is triggered asynchronously, so UI is not blocked.
         *
         * @param {sap.ui.model.Context} oTileContext
         *     the catalog tile to add
         * @param newGroupName
         *     the name of the new group where the tile should be added
         * @private
         */
        _createGroupAndSaveTile : function (oTileContext, newGroupName) {
            var oDashboardManager = sap.ushell.components.flp.launchpad.getDashboardManager(),
                deferred = jQuery.Deferred(),
                promise = oDashboardManager.createGroupAndSaveTile({
                    catalogTileContext : oTileContext,
                    newGroupName: newGroupName
                });

            promise.done(function(data){
                deferred.resolve(data);
            });

            return deferred;
        },


        onExit:function(){
            sap.ui.getCore().getEventBus().unsubscribe("launchpad", "appFinderWithDocking", this._handleAppFinderWithDocking,this);
        }
    });


}, /* bExport= */ false);
},
	"sap/ushell/components/flp/launchpad/appfinder/Catalog.view.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define([
		'sap/ui/core/HTML',
		'sap/ui/core/IconPool',
		'sap/ushell/ui/appfinder/AppBox',
		'sap/ushell/ui/appfinder/PinButton',
		'sap/ushell/ui/launchpad/CatalogEntryContainer',
		'sap/ushell/ui/launchpad/CatalogTileContainer',
		'sap/ushell/ui/launchpad/CatalogsContainer',
		'sap/ushell/ui/launchpad/Panel',
		'sap/ushell/ui/launchpad/Tile',
		'sap/ushell/ui/launchpad/TileContainerUtils'
	], function(HTML, IconPool, AppBox, PinButton, CatalogEntryContainer, CatalogTileContainer, CatalogsContainer, Panel, Tile, TileContainerUtils) {
	"use strict";

    /*global jQuery, sap, $ */
    /*jslint nomen: true */

    sap.ui.jsview("sap.ushell.components.flp.launchpad.appfinder.Catalog", {

        oController: null,

        createContent: function (oController) {
            var that = this;

            this.oViewData = this.getViewData();
            this.parentComponent = this.oViewData.parentComponent;

            var oModel = this.parentComponent.getModel();
            this.setModel(oModel);
            this.setModel(this.oViewData.subHeaderModel, "subHeaderModel");
            this.oController = oController;

            function iflong(sLong) {
                return ((sLong !== null) && (sLong === "1x2" || sLong === "2x2")) || false;
            }
            function to_int(v) {
                return parseInt(v, 10) || 0;
            }
            function get_tooltip(sAddTileGroups, sAddTileToMoreGroups, aGroupsIDs, sGroupContextModelPath, sGroupContextId, sGroupContextTitle) {
                var sTooltip;

                if (sGroupContextModelPath) {
                    var oResourceBundle = sap.ushell.resources.i18n,
                        iCatalogTileInGroup = $.inArray(sGroupContextId, aGroupsIDs);

                    sTooltip = oResourceBundle.getText(iCatalogTileInGroup !== -1 ? "removeAssociatedTileFromContextGroup" : "addAssociatedTileToContextGroup", sGroupContextTitle);
                } else {
                    sTooltip = aGroupsIDs && aGroupsIDs.length ? sAddTileToMoreGroups : sAddTileGroups;
                }
                return sTooltip;
            }

            var oTilePinButton  = new PinButton({
                icon: 'sap-icon://pushpin-off',
                selected: {
                    parts: ["associatedGroups", "associatedGroups/length", "/groupContext/path", "/groupContext/id"],
                    formatter : function (aAssociatedGroups, associatedGroupsLength, sGroupContextModelPath, sGroupContextId) {
                        if (sGroupContextModelPath) {
                            // If in group context - the icon is determined according to whether this catalog tile exists in the group or not
                            var iCatalogTileInGroup = $.inArray(sGroupContextId, aAssociatedGroups);
                            return iCatalogTileInGroup !== -1;
                        } else {
                            return !!associatedGroupsLength;
                        }
                    }
                },
                tooltip: {
                    parts: ["i18n>EasyAccessMenu_PinButton_UnToggled_Tooltip", "i18n>EasyAccessMenu_PinButton_Toggled_Tooltip", "associatedGroups", "associatedGroups/length", "/groupContext/path", "/groupContext/id", "/groupContext/title"],
                    formatter : function (sAddTileGroups, sAddTileToMoreGroups, aGroupsIDs, associatedGroupsLength, sGroupContextModelPath, sGroupContextId, sGroupContextTitle) {
                        return get_tooltip(sAddTileGroups, sAddTileToMoreGroups, aGroupsIDs, sGroupContextModelPath, sGroupContextId, sGroupContextTitle);
                    }
                },
                press : [ oController.onTilePinButtonClick, oController ]
            });

            var oAppBoxPinButton  = new PinButton({
                icon: 'sap-icon://pushpin-off',
                selected: {
                    parts: ["associatedGroups", "associatedGroups/length", "/groupContext/path", "/groupContext/id"],
                    formatter : function (aAssociatedGroups, associatedGroupsLength, sGroupContextModelPath, sGroupContextId) {
                        if (sGroupContextModelPath) {
                            // If in group context - the icon is determined according to whether this catalog tile exists in the group or not
                            var iCatalogTileInGroup = $.inArray(sGroupContextId, aAssociatedGroups);
                            return iCatalogTileInGroup !== -1;
                        } else {
                            return !!associatedGroupsLength;
                        }
                    }
                },
                tooltip: {
                    parts: ["i18n>EasyAccessMenu_PinButton_UnToggled_Tooltip", "i18n>EasyAccessMenu_PinButton_Toggled_Tooltip", "associatedGroups", "associatedGroups/length", "/groupContext/path", "/groupContext/id", "/groupContext/title"],
                    formatter : function (sAddTileGroups, sAddTileToMoreGroups, aGroupsIDs, associatedGroupsLength, sGroupContextModelPath, sGroupContextId, sGroupContextTitle) {
                        return get_tooltip(sAddTileGroups, sAddTileToMoreGroups, aGroupsIDs, sGroupContextModelPath, sGroupContextId, sGroupContextTitle);
                    }
                },
                press : [ oController.onTilePinButtonClick, oController ]
            });

            this.oAppBoxesTemplate = new AppBox({
                title:'{title}',
                icon:'{icon}',
                subtitle: '{subtitle}',
                url: '{url}',
                navigationMode: '{navigationMode}',
                pinButton: oAppBoxPinButton,
                press: [ oController.onAppBoxPressed, oController ]
            });

            oAppBoxPinButton.addCustomData(new sap.ushell.ui.launchpad.AccessibilityCustomData({
                key: "tabindex",
                value: "-1",
                writeToDom: true
            }));
            oAppBoxPinButton.addStyleClass("sapUshellPinButton");

            oTilePinButton.addCustomData(new sap.ushell.ui.launchpad.AccessibilityCustomData({
                key: "tabindex",
                value: "-1",
                writeToDom: true
            }));
            oTilePinButton.addStyleClass("sapUshellPinButton");

            this.oTileTemplate = new Tile({
                tileViews : {
                    path : "content",
                    factory : function (sId, oContext) { return oContext.getObject(); }
                },
                "long" : {
                    path : "size",
                    formatter : iflong
                },
                index: {
                    path : "id",
                    formatter : to_int
                },
                tileCatalogId : "{id}",
                pinButton: oTilePinButton,
                press : [ oController.catalogTilePress, oController ],
                afterRendering: oController.onTileAfterRendering
            });

            this.oCatalogSelect = new sap.m.List("catalogSelect", {
                    visible: "{/catalogSelection}",
                    name : "Browse",
                    rememberSelections: true,
                    mode: "SingleSelectMaster",
                    // width: sap.ui.Device.system.phone ? "100%" : "17rem",
                    items : {
                        path : "/masterCatalogs",
                        template : new sap.m.StandardListItem({
                            type: "Active",
                            title : "{title}"
                        })
                        /* filters: [oFilterVisibleTiles],*/
                    },
                    showNoData: false,
                    itemPress: [ oController._handleCatalogListItemPress, oController ]
                });
                /*
                 override original onAfterRendering as currently sap.m.Select
                 does not support afterRendering handler in the constructor
                 this is done to support tab order accessibility
                 */

            this.getCatalogSelect = function () {
                return this.oCatalogSelect;
            };

            var origCatalogSelectOnAfterRendering = this.oCatalogSelect.onAfterRendering;
            this.oCatalogSelect.addEventDelegate({
                onsaptabnext: function (oEvent) {
                    try {
                        oEvent.preventDefault();
                        sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                        sap.ushell.components.flp.ComponentKeysHandler.setFocusOnCatalogTile();
                        //var firstTile = jQuery('#catalogTiles .sapUshellTile:visible:first');
                        //firstTile.focus();
                    } catch (e) {
                        // continue regardless of error
                    }
                },
                onsapskipforward: function (oEvent) {
                    try {
                        oEvent.preventDefault();
                        sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                        sap.ushell.components.flp.ComponentKeysHandler.setFocusOnCatalogTile();
                        //var firstTile = jQuery('#catalogTiles .sapUshellTile:visible:first');
                        //firstTile.focus();
                    } catch (e) {
                        // continue regardless of error
                    }
                },
                onsapskipback: function (oEvent) {
                    try {
                        oEvent.preventDefault();
                        sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                        var openCloseSplitAppButton = sap.ui.getCore().byId("openCloseButtonAppFinderSubheader");
                        if (openCloseSplitAppButton.getVisible()) {
                            openCloseSplitAppButton.focus();
                        } else {
                            sap.ushell.components.flp.ComponentKeysHandler.appFinderFocusMenuButtons(oEvent);
                        }
                    } catch (e) {
                        // continue regardless of error
                    }
                }
            });
            // if xRay is enabled
            if (oModel.getProperty("/enableHelp")) {
                this.oCatalogSelect.addStyleClass('help-id-catalogCategorySelect');// xRay help ID
            }

            this.setCategoryFilterSelection = function (sSelection) {
                var oCatalogSelection = that.getCatalogSelect(),
                    aCatalogListItems = oCatalogSelection.getItems(),
                    bTagMode = that.oController.oSubHeaderModel.getProperty('/tag/tagMode'),
                    bSearchMode = that.oController.oSubHeaderModel.getProperty('/search/searchMode'),
                    sSelected = sSelection;

                if (bSearchMode || bTagMode) {
                    oCatalogSelection.setSelectedItem();
                } else {
                    aCatalogListItems.forEach(function (oListItem, nIndex) {
                        if (oListItem.getTitle() === sSelected) {
                            oCatalogSelection.setSelectedItem(oListItem);
                        }
                    });
                }
            };

            this.oCatalogSelect.onAfterRendering = function () {
                //set the selected item.
                var sSelected = that.oController.categoryFilter || sap.ushell.resources.i18n.getText('all');

                that.setCategoryFilterSelection(sSelected);

                if (origCatalogSelectOnAfterRendering) {
                    origCatalogSelectOnAfterRendering.apply(this, arguments);
                }

                if (!this.getSelectedItem()) {
                    this.setSelectedItem(this.getItems()[0]);
                }

                //set focus on first segmented button
                setTimeout(function() {
                    var buttons = jQuery("#catalog, #userMenu, #sapMenu").filter("[tabindex=0]");
                    if (buttons.length) {
                        buttons.eq(0).focus();
                    } else {
                        jQuery("#catalog").focus();
                    }
                }, 0);

            };

            /*
             * setting followOf to false, so the popover won't close on IE.
             */
            var origOnAfterRenderingPopover = this.oCatalogSelect._onAfterRenderingPopover;
            this.oCatalogSelect._onAfterRenderingPopover = function () {
                if (this._oPopover) {
                    this._oPopover.setFollowOf(false);
                }
                if (origOnAfterRenderingPopover) {
                    origOnAfterRenderingPopover.apply(this, arguments);
                }
            };

            var oEventBus = sap.ui.getCore().getEventBus(),
                sDeatailPageId,
                fnUpdateMasterDetail = function () {
                    this.splitApp.toMaster('catalogSelect','show');
                    if (!sap.ui.Device.system.phone) {
                        sDeatailPageId = this._calculateDetailPageId();
                        if (sDeatailPageId != this.splitApp.getCurrentDetailPage().getId()) {
                            this.splitApp.toDetail(sDeatailPageId);
                        }
                    }
                };

            oEventBus.subscribe("launchpad", "catalogContentLoaded", function() {
                setTimeout(fnUpdateMasterDetail.bind(this), 500);
            }, this);
            oEventBus.subscribe("launchpad", "afterCatalogSegment", fnUpdateMasterDetail, this);

            var oAccessibilityTileText = new HTML("sapUshellCatalogAccessibilityTileText", {
                content:
                "<div style='height: 0px; width: 0px; overflow: hidden; float: left;'>" + sap.ushell.resources.i18n.getText("tile") + "</div>"
            });

            //This renderes the catalogs.
            var oCatalogTemplate = new CatalogEntryContainer({
                header: "{title}",
//                catalogSearchTerm: "{/catalogSearchFilter}",
                customTilesContainer : {
                    path : "customTiles",
                    template : this.oTileTemplate,
                    templateShareable: true
                },
                appBoxesContainer : {
                    path : "appBoxes",
                    template : this.oAppBoxesTemplate,
                    templateShareable: true
                }
            });

            // create message-page as invisible by default
            this.oMessagePage = new sap.m.MessagePage({
                visible: true,
                showHeader: false,
                text: sap.ushell.resources.i18n.getText('EasyAccessMenu_NoAppsToDisplayMessagePage_Text'),
                description: ''
            });

            //This renderes the catalogs.
            this.oCatalogsContainer = new CatalogsContainer("catalogTiles", {
                categoryFilter: "{/categoryFilter}",
//                categoryAllocateTiles: "{/categoryAllocateTiles}",
                catalogs : {
                    path: "/catalogs",
                    templateShareable: true,
                    template : oCatalogTemplate
                    //here add the filter for the catalog.
                },
                busy: true
            });

            this.oCatalogsContainer.addStyleClass('sapUshellCatalogTileContainer');

            this.oCatalogsContainer.addEventDelegate({
                onsaptabprevious: function (oEvent) {
                    var openCloseSplitAppButton = sap.ui.getCore().byId("openCloseButtonAppFinderSubheader"),
                        jqCurrentElement = jQuery(oEvent.srcControl.getDomRef());
                    if (openCloseSplitAppButton.getVisible() && !openCloseSplitAppButton.getPressed() &&
                        !jqCurrentElement.hasClass("sapUshellPinButton")) {
                        oEvent.preventDefault();
                        var appFinderSearch = sap.ui.getCore().byId("appFinderSearch");
                        appFinderSearch.focus();
                    }
                },
                onsapskipback: function (oEvent) {
                    var openCloseSplitAppButton = sap.ui.getCore().byId("openCloseButtonAppFinderSubheader");
                    if (openCloseSplitAppButton.getVisible() && !openCloseSplitAppButton.getPressed()) {
                        oEvent.preventDefault();
                        openCloseSplitAppButton.focus();
                    }
                }
            });

            this.oCatalogsContainer.onAfterRendering = function () {
                var oCatalogTilesDetailedPage = sap.ui.getCore().byId('catalogTilesDetailedPage');
                if (!this.getBusy()) {
                    oCatalogTilesDetailedPage.setBusy(false);
                    jQuery.sap.measure.end("FLP:AppFinderLoadingStartToEnd");
                } else {
                    oCatalogTilesDetailedPage.setBusy(true);
                }

                jQuery("#catalogTilesDetailedPage-cont").scroll(function () {
                    var oPage = sap.ui.getCore().byId('catalogTilesDetailedPage'),
                        scroll = oPage.getScrollDelegate(),
                        currentPos = scroll.getScrollTop(),
                        max = scroll.getMaxScrollTop();

                    if (max - currentPos <= 30 + that.oController.PagingManager.getTileHeight()) {
                        that.oController.allocateNextPage();
                    }
                });

            };

            this.oCatalogEntrySearchContainer = new CatalogEntryContainer({
                header: "{i18n>results_count}"
            });

            this.oCatalogEntrySearchContainer.addStyleClass('sapUshellCatalogTileContainer');

            //This renderes the catalogs.
            this.oCatalogsSearchContainer = new CatalogsContainer("catalogSearchContainer", {
                catalogs: [this.oCatalogEntrySearchContainer]
            });

            this.wrapCatalogsContainerInDetailPage = function (aCatalogsContainerContnet, sId) {
                var oDetailPage1 = new sap.m.Page(sId, {
                    showHeader : false,
                    showFooter : false,
                    showNavButton : false,
                    content : [ new Panel({
                        translucent : true,
                        content : aCatalogsContainerContnet
                    }).addStyleClass("sapUshellCatalogPage")]
                });

                return oDetailPage1
            },

                this.getCatalogContainer = function () {
                    return this.oCatalogsContainer;
                }

            new sap.m.Page({
                showHeader : false,
                showFooter : false,
                showNavButton : false,
                content : [ new Panel({
                    translucent : true,
                    content : [oAccessibilityTileText, this.getCatalogContainer()]
                }).addStyleClass("sapUshellCatalogPage")]
            });
            var oCatalogDetailedPage = this.wrapCatalogsContainerInDetailPage([oAccessibilityTileText, this.getCatalogContainer()], 'catalogTilesDetailedPage'),
                oCatalogMessage = new sap.m.Page('catalogMessagePage', {
                    showHeader : false,
                    showFooter : false,
                    showNavButton : false,
                    content : [this.oMessagePage]
                }),
                oCatalogSearchPage = this.wrapCatalogsContainerInDetailPage([this.oCatalogsSearchContainer], 'catalogTilesSearchPage');

            oCatalogSearchPage.addEventDelegate({
                onAfterShow: function (oEvent) {
                    jQuery(".sapUshellTile").find('[tabindex*=0]').attr("tabindex", -1);
                    jQuery(".sapUshellAppBox:visible, .sapUshellTile:visible").first().attr("tabindex", 0);
                }
            });

            var oSelectBusyIndicator = new sap.m.BusyIndicator('catalogSelectBusyIndicator', {size: "1rem"});
            this.splitApp = new sap.m.SplitApp('catalogViewMasterDetail',{
                masterPages: [oSelectBusyIndicator, this.oCatalogSelect],
                detailPages: [oCatalogDetailedPage, oCatalogSearchPage, oCatalogMessage]
            });

            //Remove this: intended for testing porpuses.
            document.toSearch = function () {
                this.splitApp.toDetail('catalogTilesSearchPage');
            }.bind(this);
            document.toDetail = function () {
                this.splitApp.toDetail('catalogTilesDetailedPage');
            }.bind(this);
            document.toMessage = function () {
                this.splitApp.toDetail('catalogMessagePage');
            }.bind(this);

            return this.splitApp;
        },

        // calculate what is the relevant current detail page according to configuration and state of the view
        _calculateDetailPageId: function() {
            var oSubHeaderModel = this.getModel('subHeaderModel');
            var bSearchMode = oSubHeaderModel.getProperty('/search/searchMode');
            var bTagMode = oSubHeaderModel.getProperty('/tag/tagMode');
            var aCatalogs = this.getModel().getProperty("/catalogs");
            var sId;
            if (bSearchMode || bTagMode) {
                sId = this.getController().bSearchResults ? 'catalogTilesSearchPage' : 'catalogMessagePage';
            } else if (aCatalogs && !aCatalogs.length) {
                sId = "catalogMessagePage";
            } else {
                sId = "catalogTilesDetailedPage";
            }
            return sId;
        },

        getControllerName: function () {
            return "sap.ushell.components.flp.launchpad.appfinder.Catalog";
        }
    });


}, /* bExport= */ false);
},
	"sap/ushell/components/flp/launchpad/appfinder/EasyAccess.controller.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap, window, OData */
    /*jslint nomen: true */

    sap.ui.controller("sap.ushell.components.flp.launchpad.appfinder.EasyAccess", {

        DEFAULT_URL : "/sap/opu/odata/UI2",
        DEFAULT_NUMBER_OF_LEVELS: 3,
        SEARCH_RESULTS_PER_REQUEST : 100,

        onInit: function () {
            var that = this;
            this.translationBundle = sap.ushell.resources.i18n;
            this.oView = this.getView();
            var oEasyAccessSystemsModel = this.oView.getModel("easyAccessSystemsModel");
            //var systemSelectedBinding = new sap.ui.model.Binding(oEasyAccessSystemsModel, "/systemSelected", oEasyAccessSystemsModel.getContext("/systemSelected"));
            var systemSelectedBinding = oEasyAccessSystemsModel.bindProperty("/systemSelected");
            systemSelectedBinding.attachChange(that.adjustUiOnSystemChange.bind(this));

            this.menuName = this.oView.getViewData().menuName;
            this.systemId = null;
            this.easyAccessCache = {};

            this.easyAccessModel = new sap.ui.model.json.JSONModel();
            this.oView.hierarchyFolders.setModel(this.easyAccessModel, "easyAccess");
            this.oView.hierarchyApps.setModel(this.easyAccessModel, "easyAccess");

            // take the sub-header model
            var oSubHeaderModel = this.oView.getModel("subHeaderModel");

            // init listener for the toggle button bindig context
            var oToggleButtonModelBinding = oSubHeaderModel.bindProperty("/openCloseSplitAppButtonToggled");
            oToggleButtonModelBinding.attachChange(that.handleToggleButtonModelChanged.bind(this));

            // only in case search is enabled for this View, we init the listener on the search binding context
            if (this.oView.getViewData().enableSearch) {
                var oSearchModelBinding = oSubHeaderModel.bindProperty("/search");
                oSearchModelBinding.attachChange(that.handleSearchModelChanged.bind(this));
            }

            this.checkIfSystemSelectedAndLoadData();
        },

        onAfterRendering: function () {
            setTimeout(function () {
                this.oView.hierarchyApps.getController()._updateAppBoxedWithPinStatuses();
            }.bind(this), 0);
        },

        checkIfSystemSelectedAndLoadData: function () {
            var oSystemSelected = this.oView.getModel("easyAccessSystemsModel").getProperty("/systemSelected");
            if (oSystemSelected) {
                this.systemId = oSystemSelected.systemId;
                this.loadMenuItemsFirstTime(this.oView.getViewData().menuName, oSystemSelected);
            }
        },

        navigateHierarchy: function (path, forward) {
            this.oView.hierarchyFolders.setBusy(false);
            var entity = this.easyAccessModel.getProperty(path ? path : "/");
            if (typeof entity.folders != "undefined") {
                this.oView.hierarchyFolders.updatePageBindings(path, forward);
                this.oView.hierarchyApps.getController().updatePageBindings(path);
                return;
            }
            this.oView.hierarchyFolders.setBusy(true);
            this.getMenuItems(this.menuName, this.systemId, entity.id, entity.level).then(function (path, response) {
                this.easyAccessModel.setProperty(path + "/folders", response.folders);
                this.easyAccessModel.setProperty(path + "/apps", response.apps);
                this.oView.hierarchyFolders.updatePageBindings(path, forward);
                this.oView.hierarchyApps.getController().updatePageBindings(path);
                this.oView.hierarchyFolders.setBusy(false);
            }.bind(this, path), function (error) {
                this.handleGetMenuItemsError(error);
            }.bind(this));
        },

        handleSearch: function (searchTerm) {

            var isFirstTime = !this.hierarchyAppsSearchResults;

            if (isFirstTime) {

                // create the Hierarchy-Apps view for search-result
                this.hierarchyAppsSearchResults = new sap.ui.view(this.getView().getId() + "hierarchyAppsSearchResults",{
                    type: sap.ui.core.mvc.ViewType.JS,
                    viewName: "sap.ushell.components.flp.launchpad.appfinder.HierarchyApps",
                    height: "100%",
                    viewData: {
                        easyAccessSystemsModel: this.oView.getModel("easyAccessSystemsModel"),
                        getMoreSearchResults : this.getMoreSearchResults.bind(this)
                    }
                });

                // set the model
                this.easyAccessSearchResultsModel = new sap.ui.model.json.JSONModel();
                //change the default value of the maximum number of entries which are used for list bindings
                this.easyAccessSearchResultsModel.setSizeLimit(10000);
                this.hierarchyAppsSearchResults.setModel(this.easyAccessSearchResultsModel, "easyAccess");
                this.hierarchyAppsSearchResults.setBusyIndicatorDelay(this.getView().BUSY_INDICATOR_DELAY);
                this.hierarchyAppsSearchResults.addStyleClass(" sapUshellAppsView sapMShellGlobalInnerBackground");
                this.hierarchyAppsSearchResults.addCustomData(new sap.ushell.ui.launchpad.AccessibilityCustomData({
                    key: "role",
                    value: "region",
                    writeToDom: true
                }));
                this.hierarchyAppsSearchResults.addCustomData(new sap.ushell.ui.launchpad.AccessibilityCustomData({
                    key: "aria-label",
                    value: this.oView.oResourceBundle.getText("easyAccessTileContainer"),
                    writeToDom: true
                }));
            }

            //reset for the paging mechanism
            this.searchResultFrom = 0;
            this.oView.splitApp.getCurrentDetailPage().setBusy(true);
            this.easyAccessSearchResultsModel.setProperty("/apps", []);
            this.easyAccessSearchResultsModel.setProperty("/total",0);
            this._getSearchResults(searchTerm, this.searchResultFrom).then(function (response) {
                this.easyAccessSearchResultsModel.setProperty("/apps", response.results);
                this.easyAccessSearchResultsModel.setProperty("/total",response.count);
                this.searchResultFrom = response.results.length; //for the pagin mechanism -> update the next search results
                if (isFirstTime) {
                    this.oView.splitApp.addDetailPage(this.hierarchyAppsSearchResults);
                }
                // we must initiate an update to the result text / messagePage to rerun its formatter function
                // which resides on the Hierarchy-Apps View
                this.hierarchyAppsSearchResults.updateResultSetMessage(parseInt(response.count, 10), true);

                this.oView.splitApp.getCurrentDetailPage().setBusy(false);
                if (this.oView.splitApp.getCurrentDetailPage() !== this.hierarchyAppsSearchResults) {
                    this.oView.splitApp.toDetail(this.getView().getId() + "hierarchyAppsSearchResults");
                }
            }.bind(this), function (error) {
                this.handleGetMenuItemsError(error);
                this.oView.splitApp.getCurrentDetailPage().setBusy(false);
            }.bind(this));

        },

        getMoreSearchResults : function () {
            if (this.oView.splitApp.getCurrentDetailPage().setShowMoreResultsBusy) {
                this.oView.splitApp.getCurrentDetailPage().setShowMoreResultsBusy(true)
            }
            var oSubHeaderModel = this.oView.getModel("subHeaderModel");
            var sSearchTerm = oSubHeaderModel.getProperty("/search/searchTerm");
            this._getSearchResults(sSearchTerm, this.searchResultFrom).then(function (response) {
                var aCurrentResults = this.easyAccessSearchResultsModel.getProperty("/apps");
                //Due to a bug -> need to copy the array by reference in order for the binding to the model will behave as expected
                var aNewResults = aCurrentResults.slice();
                Array.prototype.push.apply(aNewResults,response.results);
                this.easyAccessSearchResultsModel.setProperty("/apps", aNewResults);
                if (this.oView.splitApp.getCurrentDetailPage().setShowMoreResultsBusy) {
                    this.oView.splitApp.getCurrentDetailPage().setShowMoreResultsBusy(false)
                }
                this.searchResultFrom = aNewResults.length; //for the pagin mechanism -> update the next search results
            }.bind(this), function (error) {
                this.handleGetMenuItemsError(error);
                if (this.oView.splitApp.getCurrentDetailPage().setShowMoreResultsBusy) {
                    this.oView.splitApp.getCurrentDetailPage().setShowMoreResultsBusy(true)
                }
            }.bind(this));
        },

        _getSearchResults: function (searchTerm, from) {
            var oDeferred = new jQuery.Deferred();
            var sServiceUrl = this._getODataRequestForSearchUrl(this.menuName, this.systemId, searchTerm, from);

            var oRequest = {
                requestUri: sServiceUrl
            };

            var oCallOdataServicePromise = this._callODataService(oRequest, this.handleSuccessOnReadFilterResults);
            oCallOdataServicePromise.done(function (data) {
                oDeferred.resolve(data);
            });
            oCallOdataServicePromise.fail(function(error){
                oDeferred.reject(error);
            });

            return oDeferred.promise();

        },

        getSystemNameOrId: function () {
            var oSystemSelected = this.oView.getModel("easyAccessSystemsModel").getProperty("/systemSelected");
            if (oSystemSelected) {
                return oSystemSelected.name || oSystemSelected.id;
            }
            return;
        },

        adjustUiOnSystemChange: function () {

            var oCurrentData = this.easyAccessModel.getData();
            // we do not put in cache empty objects
            // if there is no data for system then we do not cache this
            // this causes inconsistencies when looking at the data
            if (this.systemId && oCurrentData && oCurrentData.id) {
                this.easyAccessCache[this.systemId] = oCurrentData;
            }

            var oSystemSelected = this.oView.getModel("easyAccessSystemsModel").getProperty("/systemSelected");
            if (oSystemSelected) {
                this.systemId = oSystemSelected.systemId;
                var newData = this.easyAccessCache[this.systemId];

                if (newData) {
                    this.easyAccessModel.setData(newData);
                    this.navigateHierarchy("", false);
                } else {
                    this.oView.hierarchyFolders.setBusy(true);
                    this.oView.hierarchyApps.setBusy(true);
                    this.loadMenuItemsFirstTime(this.menuName, oSystemSelected);
                }
            }
        },

        handleToggleButtonModelChanged: function () {
            var oSubHeaderModel = this.oView.getModel("subHeaderModel");
            var bButtonVisible = oSubHeaderModel.getProperty("/openCloseSplitAppButtonVisible");
            var bButtonToggled = oSubHeaderModel.getProperty("/openCloseSplitAppButtonToggled");

            var oSplitApp = this.getView().splitApp;

            if (bButtonVisible) {
                if (bButtonToggled && !oSplitApp.isMasterShown()) {
                    oSplitApp.showMaster();
                } else if (oSplitApp.isMasterShown()) {
                    oSplitApp.hideMaster();
                }
            }
        },

        handleSearchModelChanged: function () {
            var oSubHeaderModel = this.oView.getModel("subHeaderModel");
            var sActiveMenu = oSubHeaderModel.getProperty("/activeMenu");

            // if view ID does not contain the active menu then return
            if (this.getView().getId().indexOf(sActiveMenu) === -1) {
                return;
            }

            var sSearchTerm = oSubHeaderModel.getProperty("/search/searchTerm");
            var bSearchMode = oSubHeaderModel.getProperty("/search/searchMode");

            // make sure search mode is true && the search term is not null or undefined
            if (bSearchMode) {

                // update 'aria-controls' property of the App Finder's Search Field
                // (This property is the first custom data of the search-field control)
                sap.ui.getCore().byId('appFinderSearch').getCustomData()[0].setValue(this.getView().getId() + "hierarchyAppsSearchResults");

                // of search term is a real value (not empty) then we perform search
                if (sSearchTerm) {
                    this.handleSearch(sSearchTerm);
                }
                // otherwise it is null/undefined/"", in such a case we will do nothing, as search mode is true
                // so this is a search click on 'X' scenario OR empty search scenario
            } else {

                // clear the 'aria-controls' property of the App Finder's Search Field
                sap.ui.getCore().byId('appFinderSearch').getCustomData()[0].setValue('');

                // else - search mode is false, so we go back to the hierarchy apps regular view
                this.oView.splitApp.toDetail(this.getView().getId() + "hierarchyApps");
            }
        },

        loadMenuItemsFirstTime: function (menuName, oSystem) {
            return this.getMenuItems(menuName, oSystem.systemId, "", 0).then(function (response) {
                response.text = oSystem.systemName || oSystem.systemId;
                this.easyAccessModel.setData(response);
                this.oView.hierarchyFolders.setBusy(false);
                this.oView.hierarchyApps.setBusy(false);
                this.navigateHierarchy("", false);
            }.bind(this), function (error) {
                this.handleGetMenuItemsError(error);
                this.oView.hierarchyFolders.updatePageBindings("/", false);
                this.oView.hierarchyApps.getController().updatePageBindings("/");
            }.bind(this));
        },

        handleGetMenuItemsError: function(error) {
            var sErrorMessage = this.getErrorMessage(error);
            sap.ui.require(["sap/m/MessageBox"], function (MessageBox){
                MessageBox.error(sErrorMessage);
            });
            this.easyAccessModel.setData("");
            this.oView.hierarchyFolders.setBusy(false);
            this.oView.hierarchyApps.setBusy(false);
        },

        getErrorMessage: function(error) {
            var sMenuNameString = "";
            if (this.menuName == "SAP_MENU") {
                sMenuNameString = this.translationBundle.getText("easyAccessSapMenuNameParameter");
            } else if (this.menuName == "USER_MENU") {
                sMenuNameString = this.translationBundle.getText("easyAccessUserMenuNameParameter");
            }

            if (error) {
                if (error.message) {
                    return this.translationBundle.getText("easyAccessErrorGetDataErrorMsg",[sMenuNameString, error.message]);
                } else {
                    return this.translationBundle.getText("easyAccessErrorGetDataErrorMsg",[sMenuNameString, error]);
                }
            } else {
                return this.translationBundle.getText("easyAccessErrorGetDataErrorMsgNoReason",sMenuNameString);
            }
        },


        /**
         *
         * @param {string} menuType - the service that need to be called (can be USER_MENU or SAP_MENU)
         * @param {string} systemId - the system that the user choose in the system selector
         * @param {string} entityId - the "root" entity. Can be a specific id or "" in case it is the first call
         * @param {number} entityLevel - the entity level (if it is the root entity the level should be 0)
         * @param {string} numberOfNextLevels - how much levels would like to retrieve. id no value is passed the default value is 3
         * @returns {*} - an object to add to the system easy access model
         */
        getMenuItems: function (menuType, systemId, entityId, entityLevel, numberOfNextLevels) {
            var oDeferred = new jQuery.Deferred();

            if (menuType != "SAP_MENU" && menuType != "USER_MENU") {
                oDeferred.reject("Invalid menuType parameter");
                return oDeferred.promise();
            }

            if (typeof systemId !== "string" || systemId === "") {
                oDeferred.reject("Invalid systemId parameter");
                return oDeferred.promise();
            }

            if (typeof entityId !== "string") {
                oDeferred.reject("Invalid entityId parameter");
                return oDeferred.promise();
            }

            if (typeof entityLevel !== "number") {
                oDeferred.reject("Invalid entityLevel parameter");
                return oDeferred.promise();
            }

            if (numberOfNextLevels && typeof numberOfNextLevels !== "number") {
                oDeferred.reject("Invalid numberOfNextLevels parameter");
                return oDeferred.promise();
            }

            if (entityId == "") {
                entityLevel = 0;
            }
            var iNumberOfNextLevelsValue;
            var oModel = this.getView().getModel();
            var iConfiguredNumbersOfLevels = oModel.getProperty("/easyAccessNumbersOfLevels");
            if (iConfiguredNumbersOfLevels) {
                iNumberOfNextLevelsValue = iConfiguredNumbersOfLevels;
            } else if (numberOfNextLevels) {
                iNumberOfNextLevelsValue = numberOfNextLevels;
            } else {
                iNumberOfNextLevelsValue = this.DEFAULT_NUMBER_OF_LEVELS;
            }
            var iLevelFilter = entityLevel + iNumberOfNextLevelsValue + 1;

            var sServiceUrl = this._getODataRequestUrl(menuType, systemId, entityId, iLevelFilter);

            var oRequest = {
                requestUri: sServiceUrl
            };

            var oCallOdataServicePromise = this._callODataService(oRequest,this.handleSuccessOnReadMenuItems, {systemId: systemId, entityId: entityId ,iLevelFilter: iLevelFilter});
            oCallOdataServicePromise.done(function (data) {
                oDeferred.resolve(data);
            });
            oCallOdataServicePromise.fail(function(error){
                oDeferred.reject(error);
            });

            return oDeferred.promise();
        },

        _callODataService: function (oRequest, fSuccessHandler, oSucceessHandlerParameters) {

            var that = this;
            var oDeferred = new jQuery.Deferred();

            if (!oSucceessHandlerParameters) {
                oSucceessHandlerParameters = {};
            }
            sap.ui.require(["sap/ui/thirdparty/datajs"], function () {
                OData.read(
                    oRequest,

                    // Success handler
                    function (oResult, oResponseData) {
                        if (oResult && oResult.results && oResponseData && oResponseData.statusCode === 200) {
                            var oReturnedModel = fSuccessHandler.bind(that, oResult, oSucceessHandlerParameters)();
                            oDeferred.resolve(oReturnedModel);

                        }

                    },

                    //Fail handler
                    function (oMessage) {
                        oDeferred.reject(oMessage);
                    }
                );
            });

            return oDeferred.promise();

        },

        handleSuccessOnReadMenuItems : function (oResult, oParameters) {
            var oReturnedModel = this._oDataResultFormatter(oResult.results, oParameters.systemId, oParameters.entityId, oParameters.iLevelFilter);
            return oReturnedModel;

        },

        handleSuccessOnReadFilterResults : function (oResult) {
            var sUpdatedUrl;

            oResult.results.forEach (function (oResultItem, iIndex) {
                sUpdatedUrl =  this._appendSystemToUrl(oResultItem, this.systemId);
                oResultItem.url = sUpdatedUrl
            }.bind(this));

            return {
                results: oResult.results,
                count: oResult.__count
            }
        },

        _appendSystemToUrl: function (oData, sSystemId) {
            if (oData.url) {
                return oData.url + (oData.url.indexOf('?') > 0 ? '&' : '?') + 'sap-system=' + sSystemId;
            }
        },
        
        _oDataResultFormatter: function (aResults, systemId, entityId, iLevelFilter) {
            var oFoldersMap = {};
            var oReturnedData = {};

            if (entityId == "") {
                oReturnedData = {
                    id: "root",
                    text: "root",
                    level: 0,
                    folders: [],
                    apps: []
                };
                oFoldersMap.root = oReturnedData;
            } else {
                oReturnedData = {
                    id: entityId,
                    folders: [],
                    apps: []
                };
                oFoldersMap[entityId] = oReturnedData;
            }

            var odataResult;
            for (var i = 0; i < aResults.length; i++) {
                odataResult = aResults[i];

                var oParent;
                if (odataResult.level == "01") {
                    oParent = oFoldersMap["root"];
                } else {
                    oParent = oFoldersMap[odataResult.parentId];
                }

                var oMenuItem = {
                    id : odataResult.Id,
                    text: odataResult.text,
                    subtitle: odataResult.subtitle,
                    icon: odataResult.icon,
                    level: parseInt(odataResult.level, 10)
                };
                if (odataResult.type == 'FL') {
                    oMenuItem.folders = [];
                    oMenuItem.apps = [];
                    if (odataResult.level == iLevelFilter - 1) {
                        oMenuItem.folders = undefined;
                        oMenuItem.apps = undefined;
                    }
                    if (oParent && oParent.folders) {
                        oParent.folders.push(oMenuItem);
                    }
                    oFoldersMap[odataResult.Id] = oMenuItem;
                } else {
                    oMenuItem.url = this._appendSystemToUrl(odataResult, systemId);
                    if (oParent && oParent.apps) {
                        oParent.apps.push(oMenuItem);
                    }
                }
            }
            return oReturnedData;
        },

        _getODataRequestUrl: function (menuType, systemId, entityId, iLevelFilter) {
            var sServiceUrl = this._getServiceUrl(menuType);

            var sLevelFilter;
            if (iLevelFilter < 10) {
                sLevelFilter = "0" + iLevelFilter;
            } else {
                sLevelFilter = iLevelFilter.toString();
            }

            var entityIdFilter = "";
            if (entityId) {

                // we check if the entityId is already encoded
                // in case not (e.g. decoding it equals to the value itself) - we encode it
                if (decodeURIComponent(entityId) === entityId) {
                    entityId = encodeURIComponent(entityId);
                }

                entityIdFilter = "('" + entityId + "')/AllChildren";
            }

            sServiceUrl = sServiceUrl + ";o=" + systemId + "/MenuItems" + entityIdFilter + "?$filter=level lt '" + sLevelFilter + "'&$orderby=level,text";
            return sServiceUrl;
        },

        _getODataRequestForSearchUrl: function (menuType, systemId, sTerm, iFrom) {
            var sServiceUrl = this._getServiceUrl(menuType);
            var iNumOfRecords = this.SEARCH_RESULTS_PER_REQUEST;
            var sTerm = this._removeWildCards(sTerm);
            var iFrom = !iFrom ? 0 : iFrom;
            sServiceUrl = sServiceUrl + ";o=" + systemId + "/MenuItems" + "?$filter=type ne 'FL' and substringof('" + sTerm + "', text) or substringof('" + sTerm + "', subtitle) or substringof('" + sTerm + "', url)&$orderby=text,subtitle,url&$inlinecount=allpages&$skip=" + iFrom + "&$top=" + iNumOfRecords;
            return sServiceUrl;
        },

        _getServiceUrl : function (menuType) {
            var sServiceUrl;
            var oModel = this.getView().getModel();
            if (menuType == "SAP_MENU"){
                var oSapMenuServiceUrlConfig = oModel.getProperty("/sapMenuServiceUrl");
                if (oSapMenuServiceUrlConfig){
                    sServiceUrl = oSapMenuServiceUrlConfig;
                } else {
                    sServiceUrl = this.DEFAULT_URL + "/EASY_ACCESS_MENU";
                }

            } else if (menuType == "USER_MENU"){
                var oUserMenuServiceUrlConfig = oModel.getProperty("/userMenuServiceUrl");
                if (oUserMenuServiceUrlConfig){
                    sServiceUrl = oUserMenuServiceUrlConfig;
                } else {
                    sServiceUrl = this.DEFAULT_URL + "/USER_MENU";
                }
            }
            return sServiceUrl;
        },

        _removeWildCards: function (sTerm) {
            return sTerm.replace(/\*/g , "");
        }

    });


}, /* bExport= */ false);
},
	"sap/ushell/components/flp/launchpad/appfinder/EasyAccess.view.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap, jQuery */
    /*jslint nomen: true */

    sap.ui.jsview("sap.ushell.components.flp.launchpad.appfinder.EasyAccess", {

        BUSY_INDICATOR_DELAY: 1000,

        createContent: function (oController) {
            this.oResourceBundle = sap.ushell.resources.i18n;

            this.setModel(this.getViewData().easyAccessSystemsModel, "easyAccessSystemsModel");
            this.setModel(this.getViewData().subHeaderModel, "subHeaderModel");
            this.setModel(this.getViewData().parentComponent.getModel());

            /*
             * Initialize split app master view.
             */
            this.hierarchyFolders = sap.ui.view({
                type: sap.ui.core.mvc.ViewType.JS,
                viewName: "sap.ushell.components.flp.launchpad.appfinder.HierarchyFolders",
                height: "100%",
                viewData: {
                    navigateHierarchy: this.oController.navigateHierarchy.bind(oController),
                    easyAccessSystemsModel: this.getModel("easyAccessSystemsModel"),
                    subHeaderModel: this.getModel("subHeaderModel")
                }
            });

            this.hierarchyFolders.setBusyIndicatorDelay(this.BUSY_INDICATOR_DELAY);
            this.hierarchyFolders.addStyleClass("sapUshellHierarchyFolders");
            this.hierarchyFolders.addCustomData(new sap.ushell.ui.launchpad.AccessibilityCustomData({
                key: "role",
                value: "navigation",
                writeToDom: true
            }));
            this.hierarchyFolders.addCustomData(new sap.ushell.ui.launchpad.AccessibilityCustomData({
                key: "aria-label",
                value: this.oResourceBundle.getText("easyAccessListNavigationContainer"),
                writeToDom: true
            }));

            /*
             * Initialize split app details view.
             */
            this.hierarchyApps = new sap.ui.view(this.getId() +"hierarchyApps",{
                type: sap.ui.core.mvc.ViewType.JS,
                viewName: "sap.ushell.components.flp.launchpad.appfinder.HierarchyApps",
                height: "100%",
                viewData: {
                    navigateHierarchy: this.oController.navigateHierarchy.bind(oController)
                }
            });
            this.hierarchyApps.setBusyIndicatorDelay(this.BUSY_INDICATOR_DELAY);
            this.hierarchyApps.addStyleClass(" sapUshellAppsView sapMShellGlobalInnerBackground");
            this.hierarchyApps.addCustomData(new sap.ushell.ui.launchpad.AccessibilityCustomData({
                key: "role",
                value: "region",
                writeToDom: true
            }));
            this.hierarchyApps.addCustomData(new sap.ushell.ui.launchpad.AccessibilityCustomData({
                key: "aria-label",
                value: this.oResourceBundle.getText("easyAccessTileContainer"),
                writeToDom: true
            }));

            /*
             * Setup split app
             */
            this.splitApp = new sap.m.SplitApp({
                masterPages: this.hierarchyFolders,
                detailPages: this.hierarchyApps
            });
            this.splitApp.setInitialMaster(this.hierarchyFolders);
            this.splitApp.setInitialDetail(this.hierarchyApps);


            return this.splitApp;
        },

        getControllerName: function () {
            return "sap.ushell.components.flp.launchpad.appfinder.EasyAccess";
        }
    });


}, /* bExport= */ false);
},
	"sap/ushell/components/flp/launchpad/appfinder/GroupListPopover.controller.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(function () {
	"use strict";

    /*global jQuery, sap, window */
    /*jslint nomen: true */

    sap.ui.controller("sap.ushell.components.flp.launchpad.appfinder.GroupListPopover", {
        onInit: function () {
            var oView = this.getView(),
                groupData = oView.getViewData().groupData;
            this.oPopoverModel = new sap.ui.model.json.JSONModel({userGroupList: groupData});
            oView.oPopover.setModel(this.oPopoverModel);
        },

        okButtonHandler: function (oEvent) {
            oEvent.preventDefault();
            oEvent._bIsStopHandlers = true;
            var oView = this.getView(),
            userGroupList = this.oPopoverModel.getProperty("/userGroupList"),
            returnChanges = {
              addToGroups: [],
              removeFromGroups: [],
              newGroups: [],
              allGroups: userGroupList
            };
            userGroupList.forEach(function (group) {
                if (group.selected === group.initiallySelected) {
                    return;
                }
                if (group.selected) {
                    returnChanges.addToGroups.push(group.oGroup);
                } else {
                    returnChanges.removeFromGroups.push(group.oGroup);
                }
            });
            if (oView.newGroupInput && oView.newGroupInput.getValue().length) {
                returnChanges.newGroups.push(oView.newGroupInput.getValue());
            }
            oView.oPopover.close();
            oView.deferred.resolve(returnChanges);
        },

        _closeButtonHandler: function (oEvent) {
            //oEvent.preventDefault();
            oEvent._bIsStopHandlers = true;
            var oView = this.getView();
            oView.oPopover.close();
            oView.deferred.reject();
        },
	       _createGroupAndSaveTile : function (oTileContext, newGroupName) {
						var oDashboardManager = sap.ushell.components.flp.launchpad.getDashboardManager(),
								deferred = jQuery.Deferred(),
								promise = oDashboardManager.createGroupAndSaveTile( {
										catalogTileContext : oTileContext,
										newGroupName: newGroupName
								});

						promise.done(function (data) {
								deferred.resolve(data);
						});

						return deferred;
				},

        /**
         * On clicking an item in the group list (displayListItem):
         * 1. Check if the relevant tile was added or removed to/from the associated group
         * 2. Call the actual add/remove functionality
         */
        groupListItemClickHandler: function (obj) {
            obj.oSource.setSelected(!obj.oSource.getSelected());
            var sItemModelPath = obj.oSource.getBindingContextPath(),
                oPopoverModel = obj.oSource.getModel(),
                bSelected = obj.oSource.getSelected() ? true : false;
            this.addRemoveTileFromGroup(sItemModelPath, oPopoverModel, bSelected);
        },

        getGroupsBeforeChanges : function (sPath) {
            var oModel = this.getView().getViewData().sourceContext.oModel;
            return oModel.getProperty(sPath +  "/associatedGroups");
        },

        getGroupsAfterChanges : function (sPath) {
            var oGroupsPopover = sap.ui.getCore().byId("groupsPopover");
            return oGroupsPopover.getModel().getProperty("/userGroupList");
        },

        /**
         * Handler for checking/unchecking group item in the tile groups popover.
         * - If the group is locked - ignore it 
         */
        checkboxClickHandler: function (oObjData) {
            var oView = this.getView(),
                sPath = oView.getViewData().sourceContext.sPath,
                aGroupsBeforeChanges = this.getGroupsBeforeChanges(sPath),
                aGroupsAfterChanges = this.getGroupsAfterChanges(),
                oLaunchPageService = sap.ushell.Container.getService("LaunchPage"),
                oPopoverModel = oObjData.oSource.getModel(),
                bSelected = oObjData.getParameter("selected"),
                indexBefore = 0,
                i = 0,
                done = false,
                sGroupModelPath;

            while (oLaunchPageService.isGroupLocked(aGroupsAfterChanges[i].oGroup.object) === true) {
                i++;
            }
            for (i; i < aGroupsAfterChanges.length; i++) {
                var existsBefore = false;
                if (done === true) {
                    break;
                }
                for (indexBefore = 0; indexBefore < aGroupsBeforeChanges.length; indexBefore++) {
                    if (oLaunchPageService.getGroupId(aGroupsAfterChanges[i].oGroup.object) === aGroupsBeforeChanges[indexBefore]) {
                        existsBefore = true;
                        //check if there is a need to remove tile
                        if (aGroupsAfterChanges[i].selected === false) {
                            done = true;
                            sGroupModelPath = ("/userGroupList/" + i);
                            this.addRemoveTileFromGroup(sGroupModelPath, oPopoverModel, bSelected);
                            break;
                        }
                    }
                }
                //Uncheck
                if(aGroupsAfterChanges[i].selected === true && existsBefore === false) {
                	sGroupModelPath = ("/userGroupList/" + i);
                    //afterChanges[i].oGroup.index
                    this.addRemoveTileFromGroup(sGroupModelPath, oPopoverModel, bSelected);
                    break;
                }
            }
        },

        /**
         * Add/remove a tile to/from a group
         * The adding/removing action is done by calls to catalogController.
         * The array associatedGroups in the tile's model is updated accordingly
         */
        addRemoveTileFromGroup: function (sItemModelPath, oPopoverModel, bToAdd) {

            var that = this.getView(),
                catalogController = this.getView().getViewData().catalogController,
                catalogModel = this.getView().getViewData().catalogModel,
                oTileContext = this.getView().getViewData().sourceContext,
                groupList = catalogModel.getProperty("/groups"),
                index = groupList.indexOf(oPopoverModel.getProperty(sItemModelPath).oGroup),
                oGroupContext = new sap.ui.model.Context(catalogModel, "/groups/" + index),
                launchPageService = sap.ushell.Container.getService("LaunchPage"),
                sGroupId = launchPageService.getGroupId(catalogModel.getProperty("/groups/" + index).object);

            // The tile is added to the group
            if (bToAdd) {
                var oAddPromise =  catalogController._addTile(oTileContext, oGroupContext);

                oAddPromise.done(function (data) {
                    var catalogTilePath = that.getViewData().sourceContext,
                        aCurrentTileGroups = catalogModel.getProperty(catalogTilePath + "/associatedGroups");

                    aCurrentTileGroups.push(sGroupId);
                    catalogModel.setProperty(catalogTilePath + "/associatedGroups", aCurrentTileGroups );
                })
            }
            // The tile is removed from the group
            else {
                var sTileCatalogId = oTileContext.getModel().getProperty(oTileContext.getPath()).id,
                    oRemovePromise = catalogController._removeTile(sTileCatalogId, index);

                oRemovePromise.done(function (data) {
                    var catalogTilePath = that.getViewData().sourceContext,
                        aCurrentTileGroups = catalogModel.getProperty(catalogTilePath + "/associatedGroups"),
                        indexToRemove = jQuery.inArray(sGroupId, aCurrentTileGroups);

                    if (indexToRemove >= 0) {
                    	aCurrentTileGroups.splice(indexToRemove, 1);
                    }
                    catalogModel.setProperty(catalogTilePath + "/associatedGroups", aCurrentTileGroups);
                })
            }
        },

          _switchGroupsPopoverButtonPress: function () {
              var groupsPopoverId = "groupsPopover-popover";
              if (sap.ui.Device.system.phone) {
                  // a different popover is used for phones
                  groupsPopoverId = "groupsPopover-dialog";
              }
              if (sap.ui.getCore().byId(groupsPopoverId).getContent()[0].getId() === "newGroupNameInput") {
					var userGroupList = this.oPopoverModel.getProperty("/userGroupList"),
                        returnChanges = {
                            addToGroups: [],
		                    removeFromGroups: [],
		                    newGroups: [],
		                    allGroups: userGroupList
						};
                    if (this.getView().newGroupInput.getValue().length) {
                        returnChanges.newGroups.push(this.getView().newGroupInput.getValue());
                    }
					this.getView().oPopover.close();
					this.getView().deferred.resolve(returnChanges);
            } else {
                this._closeButtonHandler(this);
            }
        },

        _navigateToCreateNewGroupPane: function () {
            var oView = this.getView();
            if (!oView.headBarForNewGroup) {
                oView.headBarForNewGroup = oView._createHeadBarForNewGroup();
            }
            if (!oView.newGroupInput) {
                oView.newGroupInput = oView._createNewGroupInput();
            }
            oView.oPopover.removeAllContent();
            oView.oPopover.addContent(oView.newGroupInput);
            oView.oPopover.setCustomHeader(oView.headBarForNewGroup);
            oView.oPopover.setContentHeight("");
            setTimeout(function(){
              oView.oPopover.getBeginButton().setText(sap.ushell.resources.i18n.getText("okDialogBtn"));
            },0);
            if (oView.oPopover.getEndButton()){
                oView.oPopover.getEndButton().setVisible(true);
            }

            if (
                sap.ui.getCore().byId("groupsPopover-popover") &&
                (sap.ui.getCore().byId("groupsPopover-popover").getContent()[0].getId() === "newGroupNameInput") && !oView.oPopover.getEndButton()
            ){
                oView.oPopover.setEndButton(oView._createCancelButton());
            };
            setTimeout(function(){
              oView.oPopover.getEndButton().setText(sap.ushell.resources.i18n.getText("cancelBtn"));
            },0);
            if (oView.getViewData().singleGroupSelection){
                this._setFooterVisibility(true);
            };
            setTimeout(function () {
                oView.newGroupInput.focus();
            }, 0);
        },
        setSelectedStart: function (start) {
            this.start = start;
        },
        _afterCloseHandler: function () {
            var oView = this.getView(),
            catalogModel = this.getView().getViewData().catalogModel;
            // catalog view is active. Not needed in user menu and SAP menu
            if (catalogModel) {
                var selectedEnd = catalogModel.getProperty(this.getView().getViewData().sourceContext + "/associatedGroups");
                this.showToastMessage(selectedEnd, this.start);
            }
            oView.oGroupsContainer.destroy();
            if (oView.headBarForNewGroup) {
                oView.headBarForNewGroup.destroy();
            }
            if (oView.newGroupInput) {
                oView.newGroupInput.destroy();
            }
            oView.oPopover.destroy();
            oView.destroy();
        },

        showToastMessage: function (end, start) {

                var added = 0,
                    removed = 0,
                    firstAddedGroupTitle,
                    firstRemovedGroupTitle,
                    endSelected = {};

                end.forEach (function (eGroup, eIndex){
                    endSelected[eGroup] = eGroup;//performance improve..
                })
                start.forEach (function (sGroup, sIndex) {
                    if (endSelected[sGroup.id]) {
                        if (sGroup.selected === false){
                            added++;
                            firstAddedGroupTitle = sGroup.title;
                        }
                    }
                    else{
                        if(sGroup.selected === true){
                            removed++;
                            firstRemovedGroupTitle = sGroup.title;
                        }
                    }

                })

                var message = this.getView().getViewData().catalogController.prepareDetailedMessage(this.getView().getViewData().title, added, removed, firstAddedGroupTitle, firstRemovedGroupTitle);
                if(message){
                    sap.m.MessageToast.show(message, {
                        duration: 6000,// default
                        width: "15em",
                        my: "center bottom",
                        at: "center bottom",
                        of: window,
                        offset: "0 -50",
                        collision: "fit fit"
                    });
                }
         },

        _backButtonHandler: function () {
            var oView = this.getView();
            oView.oPopover.removeAllContent();
            if (oView.getViewData().singleGroupSelection){
                this._setFooterVisibility(false);
            }

            if (!sap.ui.Device.system.phone) {
                oView.oPopover.setContentHeight(oView.iPopoverDataSectionHeight + "px");
            } else {
                oView.oPopover.setContentHeight("100%");
            }

            oView.oPopover.setVerticalScrolling(true);
            oView.oPopover.setHorizontalScrolling(false);
            oView.oPopover.addContent(oView.oGroupsContainer);
            oView.oPopover.setTitle(sap.ushell.resources.i18n.getText("addTileToGroups_popoverTitle"));
            oView.oPopover.setCustomHeader();
            oView.newGroupInput.setValue('');
            if (sap.ui.getCore().byId("groupsPopover-popover") && (sap.ui.getCore().byId("groupsPopover-popover").getContent()[0].getId() != "newGroupNameInput")){
                oView.oPopover.getEndButton().setVisible(false);
            };
            setTimeout(function(){
              oView.oPopover.getBeginButton().setText(sap.ushell.resources.i18n.getText("close"));
            },0);
        },

        _setFooterVisibility: function(bVisible){
            //as there is not public API to control the footer we get the control by its id
            //and set its visibility
            var oFooter = sap.ui.getCore().byId("groupsPopover-footer");
            if (oFooter){
                oFooter.setVisible(bVisible);
            }
        }
    });

/*


*/
}, /* bExport= */ false);
},
	"sap/ushell/components/flp/launchpad/appfinder/GroupListPopover.view.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap */
    /*jslint nomen: true */


    sap.ui.jsview("sap.ushell.components.flp.launchpad.appfinder.GroupListPopover", {
        /*
            view receives viewData with following structure
            {
                groupData: [
                    {
                        initiallySelected: true,
                        selected: true,
                        oGroup: group1Object
                    },
                    {
                        initiallySelected: false,
                        selected: false,
                        oGroup: group2Object
                    }
                ]
                enableHideGroups: true,
                enableHelp: true,
                singleGroupSelection: false
         }
         */

        createContent: function (oController) {
            this.iPopoverDataSectionHeight = 192;
            this.oGroupsContainer = this._createPopoverContainer(this.iPopoverDataSectionHeight);
            this.oLaunchPageService = sap.ushell.Container.getService("LaunchPage");

            this.oPopover = sap.ui.getCore().byId("groupsPopover") || new sap.m.ResponsivePopover({
                id : "groupsPopover",
                placement : "Auto",
                title: sap.ushell.resources.i18n.getText("addTileToGroups_popoverTitle"),
                contentWidth: '20rem',
                beginButton: this._createCloseButton(),
                content: this.oGroupsContainer,
                afterClose: this.getController()._afterCloseHandler.bind(this.getController())
            });

            this.oPopover.setInitialFocus('newGroupItem');
            //return this.oPopover;
        },

        open: function (openByControl) {
            if (document.body.clientHeight - openByControl.getDomRef().getBoundingClientRect().bottom >= 310) {
                this.oPopover.setPlacement("Bottom");
            }
            this.oPopover.openBy(openByControl);
            if (this.getViewData().singleGroupSelection) {
                this.getController()._setFooterVisibility(false);
            }
            this.deferred = jQuery.Deferred();
            return this.deferred.promise();
        },

        _createPopoverContainer: function (iPopoverDataSectionHeight) {
            var oNewGroupItemList = this._createNewGroupUiElements(),
                oGroupList = this._createPopoverGroupList();

            var popoverContainer = sap.ui.getCore().byId("popoverContainer") || new sap.m.ScrollContainer({
                    id: "popoverContainer",
                    horizontal : false,
                    vertical : true,
                    content: [oNewGroupItemList, oGroupList]
                });

            if (!sap.ui.Device.system.phone) {
                popoverContainer.setHeight((iPopoverDataSectionHeight - 2) + "px");
            } else {
                popoverContainer.setHeight("100%");
            }

            return popoverContainer;
        },

        _createNewGroupUiElements: function () {
            var oNewGroupItem = sap.ui.getCore().byId("newGroupItem") || new sap.m.StandardListItem({
                id : "newGroupItem",
                title : sap.ushell.resources.i18n.getText("newGroup_listItemText"),
                type : "Navigation",
                press : this.getController()._navigateToCreateNewGroupPane.bind(this.getController())
            });
            var oNewGroupItemList = new sap.m.List({});
            // if xRay is enabled
            if (this.getViewData().enableHelp) {
                oNewGroupItem.addStyleClass('help-id-newGroupItem');// xRay help ID
            }
            oNewGroupItemList.addItem(oNewGroupItem);

            oNewGroupItemList.addEventDelegate({
                onsapdown: function (oEvent) {
                    try {
                        oEvent.preventDefault();
                        oEvent._bIsStopHandlers = true;
                        var jqFirstGroupListItem = jQuery("#popoverContainer .sapMListModeMultiSelect li, #popoverContainer .sapMListModeSingleSelectMaster li").first();
                        jqFirstGroupListItem.focus();
                    } catch (e) {
                        // continue regardless of error
                    }
                },
                onsaptabnext: function (oEvent) {
                    try {
                        oEvent.preventDefault();
                        oEvent._bIsStopHandlers = true;
                        var jqCloseButton = jQuery("#closeButton");
                        jqCloseButton.focus();
                    } catch (e) {
                        // continue regardless of error
                    }
                }
            });

            return oNewGroupItemList;
        },

        _createNewGroupInput: function () {
            var oNewGroupNameInput = new sap.m.Input({
                id : "newGroupNameInput",
                type : "Text",
                placeholder : sap.ushell.resources.i18n.getText("new_group_name")
            });
            oNewGroupNameInput.setValueState(sap.ui.core.ValueState.None);
            oNewGroupNameInput.setPlaceholder(sap.ushell.resources.i18n.getText("new_group_name"));
            oNewGroupNameInput.enabled = true;
            oNewGroupNameInput.addStyleClass("sapUshellCatalogNewGroupInput");
            return oNewGroupNameInput;
        },

        _createHeadBarForNewGroup: function () {
            var oBackButton = new sap.m.Button({
                icon: sap.ui.core.IconPool.getIconURI("nav-back"),
                press : this.getController()._backButtonHandler.bind(this.getController()),
                tooltip : sap.ushell.resources.i18n.getText("newGroupGoBackBtn_tooltip")
            });
            oBackButton.addStyleClass("sapUshellCatalogNewGroupBackButton");

            // new group panel's header
            var oHeadBar = new sap.m.Bar({
                contentLeft : [oBackButton],
                contentMiddle : [
                    new sap.m.Label({
                        text : sap.ushell.resources.i18n.getText("newGroup_popoverTitle")
                    })
                ]
            });
            return oHeadBar;
        },

        getControllerName: function () {
            return "sap.ushell.components.flp.launchpad.appfinder.GroupListPopover";
        },

        _createPopoverGroupList: function () {

            var oListItemTemplate = new sap.m.DisplayListItem({
                label : "{oGroup/title}",
                selected : "{selected}",
                tooltip: "{oGroup/title}",
                type: sap.m.ListType.Active,
                press: this.getController().groupListItemClickHandler.bind(this.getController())
            });
            var aUserGroupsFilters = [];
            aUserGroupsFilters.push(new sap.ui.model.Filter("oGroup/isGroupLocked", sap.ui.model.FilterOperator.EQ, false));
            if (this.getViewData().enableHideGroups) {
                aUserGroupsFilters.push(new sap.ui.model.Filter("oGroup/isGroupVisible", sap.ui.model.FilterOperator.EQ, true));
            }
            var bSingleSelection = this.getViewData().singleGroupSelection,
             	oList = new sap.m.List({
                    mode : bSingleSelection ? sap.m.ListMode.SingleSelectMaster : sap.m.ListMode.MultiSelect,
                    growing: true,
                    growingThreshold: 200,
                    items: {
                        path: "/userGroupList",
                        template: oListItemTemplate,
                        filters: aUserGroupsFilters
                    }
                });

            if (bSingleSelection){
                oList.attachSelect(this.getController().okButtonHandler.bind(this.getController()));
            } else {
                // While clicking on the checkbox - Check if a group was added or removed
                oList.attachSelectionChange(this.getController().checkboxClickHandler.bind(this.getController()));
            }

            oList.addEventDelegate({
                //used for accessibility, so "new group" element will be a part of it
                onsapup: function (oEvent) {
                    try {
                        oEvent.preventDefault();

                        var jqNewGroupItem,
                            currentFocusGroup = jQuery(":focus");
                        if (currentFocusGroup.index() == 0) {   //first group in the list
                            jqNewGroupItem = jQuery("#newGroupItem");
                            jqNewGroupItem.focus();
                            oEvent._bIsStopHandlers = true;
                        }
                    } catch (e) {
                        // continue regardless of error
                        jQuery.sap.log.error("Groups popup Accessibility `up` key failed");
                    }
                }
            });
            return oList;
        },

        _createOkButton: function () {
            var oOkBtn = new sap.m.Button( {
                id : "okButton",
                press : this.getController().okButtonHandler.bind(this.getController()),
                text : sap.ushell.resources.i18n.getText("okBtn")
            });

            oOkBtn.addEventDelegate({
                onsaptabprevious: function(oEvent) {
                    try {
                        oEvent.preventDefault();
                        oEvent._bIsStopHandlers = true;
                        var jqNewGroupItem = jQuery("#newGroupItem");
                        if (!jqNewGroupItem.length) {
                            jqNewGroupItem = jQuery("#newGroupNameInput input");
                        }
                        jqNewGroupItem.focus();
                    } catch (e) {
                        // continue regardless of error
                        jQuery.sap.log.error("Groups popup Accessibility `shift-tab` key failed");
                    }
                }
            });
            return oOkBtn;
        },

        _createCancelButton: function () {
            return new sap.m.Button({
                id : "cancelButton",
                press: this.getController()._closeButtonHandler.bind(this.getController()),
                text : sap.ushell.resources.i18n.getText("cancelBtn")
            });
        },

        _createCloseButton: function () {
            return sap.ui.getCore().byId("closeButton") || new sap.m.Button({
                id : "closeButton",
                press: this.getController()._switchGroupsPopoverButtonPress.bind(this.getController()),
                text : sap.ushell.resources.i18n.getText(sap.ushell.resources.i18n.getText("close"))
            });
        }
    });


}, /* bExport= */ false);
},
	"sap/ushell/components/flp/launchpad/appfinder/HierarchyApps.controller.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap, window, hasher */
    /*jslint nomen: true */

    sap.ui.controller("sap.ushell.components.flp.launchpad.appfinder.HierarchyApps", {
        onInit: function () {
            var easyAccessSystemsModel = this.getView().getViewData().easyAccessSystemsModel;
            if (easyAccessSystemsModel) {
                this.getView().setModel(easyAccessSystemsModel,"easyAccessSystems");
            }
        },

        getCrumbsData: function (path, mainModel) {
            var pathChunks = path.split("/");
            pathChunks.splice(pathChunks.length - 2, 2);
            var newCrumbs = [];
            while (pathChunks.length) {
                var sPath = pathChunks.join("/");
                var text = mainModel.getProperty(sPath + "/text");
                newCrumbs.unshift({text: text, path: sPath});
                pathChunks.splice(pathChunks.length - 2, 2);
            }
            return newCrumbs;
        },

        _updateAppBoxedWithPinStatuses: function (path) {
            var oView = this.getView();
            if (!path) {
                path = oView.layout.getBinding("items").getPath();
            }
            var easyAccessModel = oView.getModel("easyAccess");
            var appsData = easyAccessModel.getProperty(path) ? easyAccessModel.getProperty(path) : [];
            var bookmarkService = sap.ushell.Container.getService("Bookmark");
            var countPromiseList = appsData.map(function (appData) {
                return bookmarkService.countBookmarks(appData.url).then(function (count) {
                    appData.bookmarkCount = count;
                    return appData;
                });
            });
            jQuery.when.apply(jQuery, countPromiseList).then(function () {
                var appsData = Array.prototype.slice.call(arguments);
                easyAccessModel.setProperty(path, appsData);
            });
        },

        updatePageBindings: function (path) {
            this.getView().layout.bindAggregation("items", "easyAccess>" + path + "/apps", this.getView().oItemTemplate);
            this._updateAppBoxedWithPinStatuses(path + "/apps");
            this.getView().breadcrumbs.bindProperty("currentLocationText", "easyAccess>" + path + "/text");
            var crumbsData = this.getCrumbsData(path, this.getView().getModel("easyAccess"));
            this.getView().crumbsModel.setProperty("/crumbs", crumbsData);

            // when navigation in hierarchy folders had occureed and model had been updated
            // in case no results found we hide the app-boxes layout and display a message page
            // with relevant message
            var aNewItems = this.getView().getModel("easyAccess").getProperty( path + '/apps');

            // call to update message with length of the items, and false indicating this is not searcg results
            this.getView().updateResultSetMessage(aNewItems.length, false);
        },

        onAppBoxPressed: function (oEvent) {
            if (oEvent.mParameters.srcControl.$().closest(".sapUshellPinButton").length) {
                return;
            }
            var sUrl = oEvent.getSource().getProperty("url");
            if (sUrl && sUrl.indexOf("#") === 0) {
                hasher.setHash(sUrl);
            }
        },

        _handleSuccessMessage: function (app, popoverResponse) {
            var message;
            var numberOfExistingGroups = popoverResponse.addToGroups ? popoverResponse.addToGroups.length : 0;
            var numberOfNewGroups =      popoverResponse.newGroups   ? popoverResponse.newGroups.length   : 0;
            var totalNumberOfGroups = numberOfExistingGroups + numberOfNewGroups;

            if (totalNumberOfGroups === 1) {
                // determine the group's title
                var groupName;
                if (numberOfExistingGroups === 1) {
                    // for an existing group we have an object in the array items
                    groupName = popoverResponse.addToGroups[0].title;
                } else {
                    // for a new group, we have the title in the array items
                    groupName = popoverResponse.newGroups[0];
                }

                message = sap.ushell.resources.i18n.getText("appAddedToSingleGroup", [app.text, groupName]);
            } else {
                message = sap.ushell.resources.i18n.getText("appAddedToSeveralGroups", [app.text, totalNumberOfGroups]);
            }

            if (totalNumberOfGroups > 0) {
                sap.m.MessageToast.show(message, {
                    duration: 3000,// default
                    width: "15em",
                    my: "center bottom",
                    at: "center bottom",
                    of: window,
                    offset: "0 -50",
                    collision: "fit fit"
                });
            }
            return message;
        },

        _prepareErrorMessage : function (aErroneousActions, sAppTitle) {
            var group,
                sAction,
                sFirstErroneousAddGroup,
                iNumberOfFailAddActions = 0,
                bCreateNewGroupFailed = false,
                message;

            for (var index in aErroneousActions) {

                // Get the data of the error (i.e. action name and group object).
                // the group's value -
                // in case the group is an existing group we will have an object
                // in case the group is a new group we will have a title instead of an object
                group = aErroneousActions[index].group;
                sAction = aErroneousActions[index].action;

                if (sAction == 'addBookmark_ToExistingGroup') {
                    // add bookmark to EXISTING group failed
                    iNumberOfFailAddActions++;
                    if (iNumberOfFailAddActions == 1) {
                        sFirstErroneousAddGroup = group.title;
                    }
                } else if (sAction == 'addBookmark_ToNewGroup') {
                    // add bookmark to a NEW group failed
                    iNumberOfFailAddActions++;
                    if (iNumberOfFailAddActions == 1) {

                        //in case of a new group we have the title and not an object
                        sFirstErroneousAddGroup = group;
                    }
                } else {
                    // sAction is "addBookmark_NewGroupCreation"
                    // e.g. new group creation failed
                    bCreateNewGroupFailed = true;
                }
            }

            // First - Handle bCreateNewGroupFailed
            if (bCreateNewGroupFailed) {
                if (aErroneousActions.length == 1) {
                    message = sap.ushell.resources.i18n.getText({messageId: "fail_tile_operation_create_new_group"});
                } else {
                    message = sap.ushell.resources.i18n.getText({messageId: "fail_tile_operation_some_actions"});
                }
                // Single error - it can be either one add action or one remove action
            } else if (aErroneousActions.length == 1) {
                message = sap.ushell.resources.i18n.getText({messageId: "fail_app_operation_add_to_group", parameters: [sAppTitle, sFirstErroneousAddGroup]});
            } else {
                message = sap.ushell.resources.i18n.getText({messageId: "fail_app_operation_add_to_several_groups", parameters: [sAppTitle]});
            }
            return message;
        },

        _handleBookmarkAppPopoverResponse: function (app, popoverResponse) {
            var addBookmarksPromiseList = [];

            popoverResponse.newGroups.forEach(function (group) {
                addBookmarksPromiseList.push(this._createGroupAndAddBookmark(group, app));
            }.bind(this));

            popoverResponse.addToGroups.forEach(function (group) {
                addBookmarksPromiseList.push(this._addBookmark(group, app));
            }.bind(this));

            jQuery.when.apply(jQuery, addBookmarksPromiseList).then(function () {
                var resultList = Array.prototype.slice.call(arguments);
                this._handlePopoverGroupsActionPromises(app, popoverResponse, resultList);
            }.bind(this));
        },

        _handlePopoverGroupsActionPromises: function (app, popoverResponse, resultList) {
            var errorList = resultList.filter(function (result, index, resultList) {
                return !result.status;
            });
            if (errorList.length) {

                var oErrorMessageObj = this._prepareErrorMessage(errorList, app.text);
                var dashboardMgr = sap.ushell.components.flp.launchpad.getDashboardManager();
                dashboardMgr.resetGroupsOnFailure(oErrorMessageObj.messageId, oErrorMessageObj.parameters);
                return;
            }

            this._updateAppBoxedWithPinStatuses();

            this._handleSuccessMessage(app, popoverResponse);
        },

        _createGroupAndAddBookmark: function (newGroup, app) {
            var dashboardMgr = sap.ushell.components.flp.launchpad.getDashboardManager();
            var deferred = jQuery.Deferred(), oResponseData = {};

            var newGroupPromise = dashboardMgr.createGroup(newGroup);
            newGroupPromise.done(function (newGroupContext) {

                var addBookmarkPromise = this._addBookmark(newGroupContext.getObject(), app, true);
                addBookmarkPromise.done(function (data) {
                    deferred.resolve(data);
                }).fail(function () {
                    oResponseData = {group: newGroup, status: 0, action: 'addBookmark_ToNewGroup'}; // 0 - failure
                    deferred.resolve(oResponseData);
                });

            }.bind(this)).fail(function () {
                oResponseData = {group: newGroup, status: 0, action: 'addBookmark_NewGroupCreation'}; // 0 - failure
                deferred.resolve(oResponseData);
            });

            return deferred.promise();
        },

        _addBookmark: function (group, app, isNewGroup) {
            var bookmarkService = sap.ushell.Container.getService("Bookmark");
            var deferred = jQuery.Deferred(), oResponseData = {};
            var addBookmarkPromise = bookmarkService.addBookmark({
                url: app.url,
                title: app.text,
                subtitle: app.subtitle,
                icon: app.icon
            }, group.object);

            var action = isNewGroup ? "addBookmark_ToNewGroup" : "addBookmark_ToExistingGroup";

            addBookmarkPromise.done(function () {
                oResponseData = {group: group, status: 1, action: action}; // 1 - success
                deferred.resolve(oResponseData);
            }).fail(function () {
                oResponseData = {group: group, status: 0, action: action}; // 0 - failure
                deferred.resolve(oResponseData);
            });

            return deferred.promise();
        },

        showSaveAppPopover: function (event) {
            var oModel = this.getView().getModel();
            var app = event.oSource.getParent().getBinding("title").getContext().getObject();

            //if we in context of some dashboard group, no need to open popup
            if (!!oModel.getProperty("/groupContext").path) {
                var groupPath = oModel.getProperty("/groupContext").path;
                var oGroup = oModel.getProperty(groupPath);
                var customResponse = {
                    newGroups: [],
                    addToGroups: [oGroup]
                };
                this._handleBookmarkAppPopoverResponse(app, customResponse);
                return;
            }

            var groupData = oModel.getProperty("/groups").map(function (group) {
                return {
                    selected: false,
                    initiallySelected: false,
                    oGroup: group
                };
            });

            var popoverView = new sap.ui.view({
                type: sap.ui.core.mvc.ViewType.JS,
                viewName: "sap.ushell.components.flp.launchpad.appfinder.GroupListPopover",
                viewData: {
                    groupData: groupData,
                    enableHideGroups: oModel.getProperty("/enableHideGroups"),
                    enableHelp: oModel.getProperty("/enableHelp"),
                    singleGroupSelection: true
                }
            });

            var popoverPromise = popoverView.open(event.oSource);
            popoverPromise.then(this._handleBookmarkAppPopoverResponse.bind(this, app));
        },

        resultTextFormatter: function (oSystemSelected, iTotal) {
            var oResourceBundle = sap.ushell.resources.i18n;
            if (oSystemSelected) {
                var sSystem = oSystemSelected.systemName ? oSystemSelected.systemName : oSystemSelected.systemId;
                var sResultText = "";
                if (iTotal) {
                    sResultText = oResourceBundle.getText('search_easy_access_results', [iTotal, sSystem]);
                }

                return sResultText;
            }
            return "";
        },

        showMoreResultsVisibilityFormatter: function (apps, total) {
            if (apps && apps.length < total) {
                return true;
            }
            return false;
        },

        showMoreResultsTextFormatter: function (apps, total) {
            if (!apps || !total) {
                return "";
            }
            var currentlyNumOfApps = apps.length;
            return  sap.ushell.resources.i18n.getText('EasyAccessSearchResults_ShowMoreResults',[currentlyNumOfApps,total]);
        }

    });


}, /* bExport= */ true);
},
	"sap/ushell/components/flp/launchpad/appfinder/HierarchyApps.view.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(['sap/ushell/ui/appfinder/AppBox','sap/ushell/ui/appfinder/PinButton'],
	function(AppBox, PinButton) {
	"use strict";

    /*global jQuery, sap*/
    /*jslint nomen: true */

    sap.ui.jsview("sap.ushell.components.flp.launchpad.appfinder.HierarchyApps", {

        createContent: function (oController) {
            this.oController = oController;

            function getTooltip(aGroupsIDs, bookmarkCount, sGroupContextModelPath, sGroupContextId, sGroupContextTitle) {
                var oResourceBundle = sap.ushell.resources.i18n,
                    sTooltip;

                if (sGroupContextModelPath) {
                    var iCatalogTileInGroup = jQuery.inArray(sGroupContextId, aGroupsIDs);

                    var sTooltipKey = iCatalogTileInGroup !== -1
                        ? "removeAssociatedTileFromContextGroup"
                        : "addAssociatedTileToContextGroup";

                    sTooltip = oResourceBundle.getText(sTooltipKey, sGroupContextTitle);
                } else {
                    sTooltip = bookmarkCount 
                        ? oResourceBundle.getText("EasyAccessMenu_PinButton_Toggled_Tooltip")
                        : oResourceBundle.getText("EasyAccessMenu_PinButton_UnToggled_Tooltip");
                }
                return sTooltip;
            }

            var oPinButton = new PinButton({
                icon: 'sap-icon://pushpin-off',
                selected: {
                    path: "easyAccess>bookmarkCount",
                    formatter : function (bookmarkCount) {
                        return (!!bookmarkCount);
                    }
                },
                tooltip: {
                    parts: ["associatedGroups", "easyAccess>bookmarkCount", "/groupContext/path", "/groupContext/id", "/groupContext/title"],
                    formatter : function (aGroupsIDs, bookmarkCount, sGroupContextModelPath, sGroupContextId, sGroupContextTitle) {
                        return getTooltip(aGroupsIDs, bookmarkCount, sGroupContextModelPath, sGroupContextId, sGroupContextTitle);
                    }
                },
                press: oController.showSaveAppPopover.bind(oController)
            });
            oPinButton.addCustomData(new sap.ushell.ui.launchpad.AccessibilityCustomData({
                key: "tabindex",
                value: "-1",
                writeToDom: true
            }));
            oPinButton.addStyleClass("sapUshellPinButton");

            this.oItemTemplate = new AppBox({
                title: "{easyAccess>text}",
                subtitle: "{easyAccess>subtitle}",
                url: "{easyAccess>url}",
                icon: "{easyAccess>icon}",
                pinButton: oPinButton,
                tabindex: {
                    path: "easyAccess>text"
                },
                press: [oController.onAppBoxPressed, oController]
            });
            this.oItemTemplate.addCustomData(new sap.ushell.ui.launchpad.AccessibilityCustomData({
                key: "tabindex",
                value: "-1",
                writeToDom: true
            }));


            this.layout = new sap.m.FlexBox(this.getId() + '_hierarchyAppsLayout',{
                items: {
                    path: "easyAccess>/apps",
                    template: this.oItemTemplate
                },
                wrap: sap.m.FlexWrap.Wrap
            });

            this.layout.addDelegate({
                onAfterRendering: function () {
                    var items = this.getItems();
                    var updateTabindex = function (customData) {
                        if (customData.getKey() === "tabindex") {
                            customData.setValue("0");
                        }
                    };
                    if (items.length) {
                        items[0].getCustomData().forEach(updateTabindex);
                        items[0].getPinButton().getCustomData().forEach(updateTabindex);
                    }
                }.bind(this.layout)
            });

            // create message-page as invisible by default
            this.oMessagePage = new sap.m.MessagePage({
                visible: false,
                showHeader: false,
                text: sap.ushell.resources.i18n.getText('EasyAccessMenu_NoAppsToDisplayMessagePage_Text'),
                description: ''
            });


            var aContent = [];

            // if it is not a search result view - e.g. this is a regular hierarchy Apps content view
            if (this.getViewData() && this.getViewData().navigateHierarchy) {
                this.crumbsModel = new sap.ui.model.json.JSONModel({crumbs:[]});

                this.linkTemplate = new sap.m.Link({
                    text: "{crumbs>text}",
                    press: function (e) {
                        var crumbData = e.oSource.getBinding("text").getContext().getObject();
                        this.getViewData().navigateHierarchy(crumbData.path, false);

                    }.bind(this)
                });


                this.breadcrumbs = new sap.m.Breadcrumbs({
                    links: {
                        path: "crumbs>/crumbs",
                        template: this.linkTemplate
                    },
                    currentLocationText: "{/text}"
                });

                this.breadcrumbs.setModel(this.crumbsModel, "crumbs");
                aContent.push(this.breadcrumbs);
            } else {
                // else we are in search results content view
                this.resultText = new sap.m.Text({
                    text: {
                        parts: [
                            {path: "easyAccessSystemsModel>/systemSelected"},
                            {path: "easyAccess>/total"}
                        ],
                        formatter: oController.resultTextFormatter.bind(oController)
                    }
                }).addStyleClass('sapUshellEasyAccessSearchResultText');

                this.resultText.addCustomData(new sap.ushell.ui.launchpad.AccessibilityCustomData({
                    key: "role",
                    value: "heading",
                    writeToDom: true
                }));
                this.resultText.addCustomData(new sap.ushell.ui.launchpad.AccessibilityCustomData({
                    key: "aria-level",
                    value: "3",
                    writeToDom: true
                }));

                aContent.push(this.resultText);

                this.showMoreResultsLink = new sap.m.Button({
                    text: {
                        parts: [
                            {path: "easyAccess>/apps"},
                            {path: "easyAccess>/total"}
                        ],
                        formatter: oController.showMoreResultsTextFormatter.bind(oController)
                    },
                    press: this.getViewData().getMoreSearchResults,
                    visible: {
                        parts: [
                            {path: "easyAccess>/apps"},
                            {path: "easyAccess>/total"}
                        ],
                        formatter: oController.showMoreResultsVisibilityFormatter.bind(oController)
                    },
                    type: sap.m.ButtonType.Transparent
                });
            }

            // adding the message-page
            aContent.push(this.oMessagePage);
            aContent.push(this.layout);
            if (this.showMoreResultsLink) {
                aContent.push(this.showMoreResultsLink)
            }
            return aContent;
        },

        /*
            updates the text-field OR the messagePage according to
            - if items exist we update the text-field, otherwise show message page
            - if bIsSearchResults we use different text then if is not (e.g. standard empty folder navigation)
         */
        updateResultSetMessage: function (bItemsExist, bIsSearchResults) {

            var sEmptyContentMessageKey;
            if (bIsSearchResults) {
                sEmptyContentMessageKey = 'noFilteredItems';
            } else {
                sEmptyContentMessageKey = 'EasyAccessMenu_NoAppsToDisplayMessagePage_Text';
            }


            // if there are items in the results
            if (bItemsExist) {

                // if this is search results --> update the result-text which we display at the top of page
                // when there are results
                if (bIsSearchResults) {
                    this.resultText.updateProperty('text');
                    this.resultText.setVisible(true);
                }

                // set layout visible, hide the message page
                this.layout.setVisible(true);
                this.oMessagePage.setVisible(false);
            } else {
                // in case this is search results --> hide the result-text which we display at the top of page
                // as there are no results. we will display the message page instaed
                if (bIsSearchResults) {
                    this.resultText.setVisible(false);
                }

                this.layout.setVisible(false);
                this.oMessagePage.setVisible(true);

                var sEmptyContentMessageText = sap.ushell.resources.i18n.getText(sEmptyContentMessageKey);
                this.oMessagePage.setText(sEmptyContentMessageText);
            }
        },

        setShowMoreResultsBusy : function (bBusy) {
            if (this.showMoreResultsLink) {
                this.showMoreResultsLink.setBusy(bBusy);
            }
        },

        getControllerName: function () {
            return "sap.ushell.components.flp.launchpad.appfinder.HierarchyApps";
        }
    });


}, /* bExport= */ true);
},
	"sap/ushell/components/flp/launchpad/appfinder/HierarchyFolders.controller.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(function() {
	"use strict";

    /*global jQuery, jQuery, sap, window */
    /*jslint nomen: true */

    sap.ui.controller("sap.ushell.components.flp.launchpad.appfinder.HierarchyFolders", {

        onInit: function () {
            this.oDialog = null;
            this.getView().setModel(this.getView().getViewData().easyAccessSystemsModel,"easyAccessSystems");
            this.getView().setModel(this.getView().getViewData().subHeaderModel,"subHeaderModel");
            this.getSelectedSystem().then(function (oSystem) {
                if (oSystem) {
                    this.setSystemSelected(oSystem);
                } else {
                    this.setSystemSelected(undefined);
                    //if no system selected -> 'select system' dialog will automatically appear
                    this.onSystemSelectionPress();
                }
            }.bind(this), function () {
                this.setSystemSelected(undefined);
                this.onSystemSelectionPress();
            });
        },

        onExit: function() {
            if (this.oDialog) {
                this.destroyDialog();
            }
        },

        onAfterRendering: function () {

            // making sure that on every click anywhere on the left panel which is basically
            // the hierarchy-folders view (this view), we invoke exit search mode (if necessary)
            var jqThis = jQuery('#' + this.getView().getId());
            jqThis.on("click", function(event) {
                this.exitSearchMode();
            }.bind(this));
        },

        getPersonalizer: function () {
            if (this.oPersonalizer) {
                return this.oPersonalizer;
            }
            var oPersonalizationService = sap.ushell.Container.getService("Personalization");
            var oComponent = sap.ui.core.Component.getOwnerComponentFor(this);
            var oScope = {
                keyCategory: oPersonalizationService.constants.keyCategory.FIXED_KEY,
                writeFrequency: oPersonalizationService.constants.writeFrequency.LOW,
                clientStorageAllowed: true
            };

            var oPersId = {
                container: "flp.launchpad.appfinder.HierarchyFolders",
                item: "lastSelectedSystem"
            };

            this.oPersonalizer = oPersonalizationService.getPersonalizer(oPersId, oScope, oComponent);
            return this.oPersonalizer;
        },

        /**
         * get the selected system
         * if only one system available - it be automatically selected
         * if user has defined a system, and it in the list of available systems it will be selected
         * Note: this function does not set anything in the persistence layer.
         * @See {this.setSystemSelected}
         * @return {Promise} with the selected system object
         */
        getSelectedSystem: function () {
            var oDeferred = new jQuery.Deferred();
            var aSystemsList = this.getView().getModel("easyAccessSystems").getProperty("/systemsList");

            //if there is only one system -> this system is selected
            if (aSystemsList && aSystemsList.length && aSystemsList.length === 1) {
                var oEasyAccessSystemSelected = aSystemsList[0];
                this.setSystemSelectedInPersonalization(oEasyAccessSystemSelected);
                oDeferred.resolve(oEasyAccessSystemSelected);
            } else {
                this.getSelectedSystemInPersonalization().then(function (persSystemSelected) {
                    if (persSystemSelected) {
                        //if there is a system in the personalization-> need to check if the system exists in the system list
                        var bSystemInList = false;
                        for (var i = 0; i < aSystemsList.length; i++) {
                            if ((aSystemsList[i].systemName && aSystemsList[i].systemName === persSystemSelected.systemName) ||
                                (aSystemsList[i].systemId === persSystemSelected.systemId)) {
                                bSystemInList = true;
                                oDeferred.resolve(persSystemSelected);
                            }
                        }
                        // if personalized system not part of the system list
                        if (!bSystemInList) {
                            oDeferred.resolve();
                            // remove this system from the personalization
                            this.setSystemSelectedInPersonalization();
                        }
                    } else {
                        oDeferred.resolve();
                    }
                }.bind(this));
            }
            return oDeferred.promise();
        },

        setSystemSelected: function (oSystem) {
            this.getView().getModel("easyAccessSystems").setProperty("/systemSelected", oSystem);
            this.setSystemSelectedInPersonalization(oSystem);
        },

        getSelectedSystemInPersonalization: function () {
            var oDeferred = new jQuery.Deferred();
            
            this.getPersonalizer().getPersData().then(function (persSystemSelected) {
                if (persSystemSelected) {
                    oDeferred.resolve(persSystemSelected);
                } else {
                    oDeferred.resolve();
                }
            }, function (error) {
                jQuery.sap.log.error(
                    "Failed to get selected system from the personalization",
                    error,
                    "sap.ushell.components.flp.launchpad.appfinder.HierarchyFolders"
                );
                oDeferred.reject();
            });
            
            return oDeferred.promise();
        },

        setSystemSelectedInPersonalization: function (oSystem) {
            this.getPersonalizer().setPersData(oSystem).fail(function (error) {
                jQuery.sap.log.error(
                    "Failed to save selected system in the personalization",
                    error,
                    "sap.ushell.components.flp.launchpad.appfinder.HierarchyFolders"
                );
            });
        },

        onSystemSelectionPress: function () {
            var systemsList = this.getView().getModel("easyAccessSystems").getProperty("/systemsList");
            if (systemsList && systemsList.length && systemsList.length <= 1) {
                return;
            }

            var oDialog = this.createDialog();
            oDialog.open();
        },

        createDialog: function() {
            var that = this;

            if (!this.oDialog) {
                this.oDialog = new sap.m.SelectDialog({
                    id: "systemSelectionDialog",
                    title: that.getView().translationBundle.getText("easyAccessSelectSystemDialogTitle"),
                    multiSelect: false,
                    contentHeight: "20rem",
                    items: {
                        path: "/systemsList",
                        template: new sap.m.StandardListItem({
                            adaptTitleSize: false,
                            title: {
                                parts: ["systemName","systemId"],
                                formatter: that.titleFormatter
                            },
                            description: {
                                parts: ["systemName","systemId"],
                                formatter: that.descriptionFormatter
                            },
                            selected: {
                                parts: ["systemName","systemId"],
                                formatter: that.selectedFormatter.bind(this)
                            }
                        })
                    },
                    confirm: that.systemConfirmHandler.bind(that),
                    search: that.systemSearchHandler.bind(that),
                    cancel: that.destroyDialog.bind(that)
                });
                this.oDialog.setModel(this.getView().getModel("easyAccessSystems"));
            }

            return this.oDialog;
        },

        destroyDialog: function() {
            this.oDialog.destroyItems();
            this.oDialog.destroy();
            this.oDialog = null;
        },

        systemConfirmHandler: function (oEvent) {
            var oItem = oEvent.getParameters().selectedItem;
            var oSystem = oItem.getBindingContext().getObject();
            this.setSystemSelected(oSystem);
            this.destroyDialog();
        },

        //implement the search functionality in the system selector dialog
        systemSearchHandler: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilterName = new sap.ui.model.Filter("systemName", sap.ui.model.FilterOperator.Contains, sValue);
            var oFilterId = new sap.ui.model.Filter("systemId", sap.ui.model.FilterOperator.Contains, sValue);
            var oSystemSelectorDialogFilter = new sap.ui.model.Filter({
                filters: [oFilterId, oFilterName],
                and: false
            });
            var oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter(oSystemSelectorDialogFilter);
        },

        titleFormatter: function (systemName, systemId) {
            return systemName || systemId;
        },

        descriptionFormatter: function (systemName, systemId) {
            if (systemName) {
                return systemId;
            }
            return null;
        },
        selectedFormatter: function (systemName, systemId) {
            var userSystemSelected = this.getView().getModel("easyAccessSystems").getProperty("/systemSelected");
            if (!userSystemSelected) {
                return false;
            }
            if (systemName) {
                return (userSystemSelected.systemName === systemName);
            } else {
                return (userSystemSelected.systemId === systemId);
            }
        },

        systemSelectorTextFormatter : function (systemSelected) {
            if (systemSelected) {
                if (systemSelected.systemName) {
                    return systemSelected.systemName;
                } else {
                    return systemSelected.systemId;
                }
            } else {
                return this.getView().translationBundle.getText("easyAccessSelectSystemTextWithoutSystem");
            }
        },

        exitSearchMode : function () {
            var oSubHeaderModel = this.getView().getModel('subHeaderModel');
            oSubHeaderModel.setProperty('/search/searchMode', false);
            oSubHeaderModel.refresh(true);
        }

    });


}, /* bExport= */ true);
},
	"sap/ushell/components/flp/launchpad/appfinder/HierarchyFolders.view.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap, jQuery */
    /*jslint nomen: true */

    sap.ui.jsview("sap.ushell.components.flp.launchpad.appfinder.HierarchyFolders", {

        createContent: function (oController) {
            var that = this;
            this.translationBundle = sap.ushell.resources.i18n;

            this.treePath = "";

            this.systemSelectorText = new sap.m.Text({
                text: {
                    path: "easyAccessSystemsModel>/systemSelected",
                    formatter: oController.systemSelectorTextFormatter.bind(oController)
                }
            });

            this.oItemTemplate = new sap.m.StandardListItem({
                title: "{easyAccess>text}",
                type: "Navigation",
                press: function () {
                    var path = this.getBindingContextPath();
                    that.getViewData().navigateHierarchy(path, true);
                }
            });

            this.oList = new sap.m.List({
                showSeparators: sap.m.ListSeparators.None,
                items: {
                    path: "easyAccess>" + this.treePath + "/folders",
                    template: this.oItemTemplate
                },
                updateFinished: function () {
                    var aListItems = this.getItems();

                    that.finishEasyAccessAnimation(true);
                    aListItems.forEach(function (oListItem) {
                        //UI5 Doesn't support 'space' and 'enter' press behavior alignment while it is required by UX defentions.
                        oListItem.onsapspace = oListItem.onsapenter;
                    });
                },
                noDataText: {
                    path: "easyAccessSystemsModel>/systemSelected",
                    formatter: function (oSystemSelected) {
                        if (oSystemSelected) {
                            return that.translationBundle.getText("easyAccessFolderWithNoItems");
                        }
                    }
                }
            });

            this.pageMenu = new sap.m.Page({
                showNavButton: false,
                enableScrolling: true,
                headerContent:  new sap.m.Bar({
                    contentLeft: [new sap.m.Label({text: {
                                parts: ["easyAccessSystemsModel>/systemSelected"],
                                formatter: oController.systemSelectorTextFormatter.bind(oController)
                            }})],
                    contentRight: [new sap.m.Button({
                        text: this.translationBundle.getText("action_change"),
                        type: sap.m.ButtonType.Transparent,
                        visible: {
                            path: "easyAccessSystemsModel>/systemsList",
                            formatter: function (systemsList) {
                                return systemsList.length > 1;
                            }
                        },
                        press: [oController.onSystemSelectionPress, oController]
                    })]
                }).addStyleClass("sapUshellEasyAccessMasterPageHeader"),
                content: this.oList
            });

            this.pageMenu.attachNavButtonPress(function () {
                var pathChunks = this.treePath.split("/");
                var newPathChunks = pathChunks.slice(0, pathChunks.length - 2);
                this.getViewData().navigateHierarchy(newPathChunks.join("/"), false);
            }.bind(this));

            return this.pageMenu;
        },

        getControllerName: function () {
            return "sap.ushell.components.flp.launchpad.appfinder.HierarchyFolders";
        },

        finishEasyAccessAnimation: function () {
            if (!this.jqFolderClone) {
                return;
            }

            if (this.forwardAnimation) {
                this.pageMenu.$().addClass("forwardToViewAnimation");
                this.jqFolderClone.addClass("forwardOutOfViewAnimation");
            } else {
                this.pageMenu.$().addClass("backToViewAnimation");
                this.jqFolderClone.addClass("backOutOfViewAnimation");
            }
            this.jqFolderClone.on("animationend", function () {
                this.pageMenu.$().removeClass("forwardToViewAnimation backToViewAnimation");
                var backButton = this.pageMenu.$().find(".sapMBarLeft button");
                if (backButton.length) {
                    backButton.focus();
                } else {
                    //timeout needed becouse firefox hides menu without it
                    setTimeout(function () {
                        this.pageMenu.$().find("header + header").focus();
                    }.bind(this));
                }
                if (this.jqFolderClone) {
                    this.jqFolderClone.remove();
                }
            }.bind(this));
        },

        prepareEasyAccessAnimation: function (forward) {
            this.forwardAnimation = forward;
            this.jqFolderClone = this.pageMenu.$().clone().removeAttr("data-sap-ui").css("z-index", "1");
            this.jqFolderClone.find("*").removeAttr("id");
            this.pageMenu.$().parent().append(this.jqFolderClone);
        },

        updatePageBindings: function (path, forwardAnimation) {
            var bShowBack = path.split("/").length > 2;
            this.treePath = path;
            this.pageMenu.setShowNavButton(bShowBack);
            this.pageMenu.setShowSubHeader(!bShowBack);
            this.prepareEasyAccessAnimation(forwardAnimation);
            this.oList.bindItems("easyAccess>" + path + "/folders", this.oItemTemplate);
        }
    });


}, /* bExport= */ true);
},
	"sap/ushell/components/flp/launchpad/dashboard/DashboardContent.controller.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

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
},
	"sap/ushell/components/flp/launchpad/dashboard/DashboardContent.view.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
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
},
	"sap/ushell/components/flp/launchpad/dashboard/DashboardGroupsBox.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview A module that is responsible for creating the groups part (i.e. box) of the dashboard.<br>
 * Extends <code>sap.ui.base.Object</code><br>
 * Exposes the public function <code>createGroupsBox</code>
 * @see sap.ushell.components.flp.launchpad.dashboard.DashboardContent.view
 *
 * @version 1.52.4
 * @name sap.ushell.components.flp.launchpad.dashboard.DashboardGroupsBox
 * @since 1.35.0
 * @private
 */
sap.ui.define (["sap/ushell/ui/launchpad/AccessibilityCustomData", "sap/ui/base/Object", "sap/ushell/ui/launchpad/DashboardGroupsContainer"], function(AccessibilityCustomData, baseObject, DashboardGroupsContainer) {
	"use strict";

    /*global jQuery, sap, window */
    /*jslint nomen: true */
    var DashboardGroupsBox = baseObject.extend("sap.ushell.components.flp.launchpad.dashboard.DashboardGroupsBox", {
        metadata: {
            publicMethods: ["createGroupsBox"]
        },
        constructor: function (sId, mSettings) {
            // Make this class only available once
            if (sap.ushell.components.flp.launchpad.dashboard.getDashboardGroupsBox && sap.ushell.components.flp.launchpad.dashboard.getDashboardGroupsBox()) {
                return sap.ushell.components.flp.launchpad.dashboard.getDashboardGroupsBox();
            }
            sap.ushell.components.flp.launchpad.dashboard.getDashboardGroupsBox = jQuery.sap.getter(this.getInterface());

            this.oController = undefined;
            this.oGroupsContainer = undefined;
            this.bTileContainersContentAdded = false;
            this.isLinkPersonalizationSupported = sap.ushell.Container.getService("LaunchPage").isLinkPersonalizationSupported();

            sap.ui.getCore().getEventBus().subscribe("launchpad", "actionModeActive", this._addTileContainersContent, this);
        },
        destroy: function () {
            sap.ui.getCore().getEventBus().unsubscribe("launchpad", "actionModeActive", this._addTileContainersContent, this);
            sap.ushell.components.flp.launchpad.dashboard.getDashboardGroupsBox = undefined;
        },
        /**
         * Creating the groups part (i.e. box) of the dashboard
         */
        createGroupsBox : function (oController, oModel) {
            this.oController = oController;
            var that = this,
                fAfterLayoutInit,
                fGroupsContainerAfterRenderingHandler,
                oTilesContainerTemplate = this._getTileContainerTemplate(oController, oModel),
                fnEnableLockedGroupCompactLayout = function () {
                    return that.oModel.getProperty('/enableLockedGroupsCompactLayout') && !that.oModel.getProperty('/tileActionModeActive');
                },
                getPlusTileFromGroup = function (oGroup) {
                    var groupDomRef,
                        plusTileDomRef;
                    if (oGroup && (groupDomRef = oGroup.getDomRef())) {
                        plusTileDomRef = groupDomRef.querySelector('.sapUshellPlusTile');
                        if (plusTileDomRef) {
                            return plusTileDomRef;
                        }
                    }
                    return null;
                },
                reorderTilesCallback = function (layoutInfo) {
                    var plusTileStartGroup = getPlusTileFromGroup(layoutInfo.currentGroup),
                        plusTileEndGroup = getPlusTileFromGroup(layoutInfo.endGroup),
                        isPlusTileVanishRequired = (layoutInfo.tiles[layoutInfo.tiles.length - 2] === layoutInfo.item) || (layoutInfo.endGroup.getTiles().length === 0);
                    if (isPlusTileVanishRequired) {
                        that._hidePlusTile(plusTileEndGroup);
                    } else {
                        that._showPlusTile(plusTileEndGroup);
                    }

                    if (layoutInfo.currentGroup !== layoutInfo.endGroup) {
                        that._showPlusTile(plusTileStartGroup);
                    }
                };

            //Since the layout initialization is async, we need to execute the below function after initialization is done
            fAfterLayoutInit = function () {
                //Prevent Plus Tile influence on the tiles reordering by exclude it from the layout matrix calculations
                sap.ushell.Layout.getLayoutEngine().setExcludedControl(sap.ushell.ui.launchpad.PlusTile);
                //Hide plus tile when collision with it
                sap.ushell.Layout.getLayoutEngine().setReorderTilesCallback.call(sap.ushell.Layout.layoutEngine, reorderTilesCallback);
            };

            fGroupsContainerAfterRenderingHandler = function () {

                if (!sap.ushell.Layout.isInited) {
                    sap.ushell.Layout.init({
                        getGroups: this.getGroups.bind(this),
                        getAllGroups: that.getAllGroupsFromModel.bind(that),
                        isTabBarActive: that.isTabBarActive.bind(that),
                        isLockedGroupsCompactLayoutEnabled: fnEnableLockedGroupCompactLayout,
                        animationsEnabled: (that.oModel.getProperty('/animationMode') === 'full')
                    }).done(fAfterLayoutInit);

                    //when media is changed we need to rerender Layout
                    //media could be changed by SAPUI5 without resize, or any other events. look for internal Incident ID: 1580000668
                    sap.ui.Device.media.attachHandler(function () {
                        if (!this.bIsDestroyed) {
                            sap.ushell.Layout.reRenderGroupsLayout(null);
                        }
                    }, this, sap.ui.Device.media.RANGESETS.SAP_STANDARD);

                    var oDomRef = this.getDomRef();
                    oController.getView().sDashboardGroupsWrapperId = !jQuery.isEmptyObject(oDomRef) && oDomRef.parentNode ? oDomRef.parentNode.id : '';
                }
                sap.ushell.Layout.reRenderGroupsLayout(null);

                if (this.getGroups().length) {
                    if (oController.bModelInitialized) {
                        oController._initializeUIActions();
                    }

                    sap.ui.getCore().getEventBus().publish("launchpad", "contentRendered");
                    sap.ui.getCore().getEventBus().publish("launchpad", "contentRefresh");

                    oController._addBottomSpace();

                    //Tile opacity is enabled by default, therefore we handle tile opacity in all cases except
                    //case where flag is explicitly set to false
                    if (this.getModel().getProperty("/tilesOpacity")) {
                        sap.ushell.utils.handleTilesOpacity(this.getModel());
                    }
                }

                // get the homeGroupDisplayMode and do the filter accordingly
                var oFilter = new sap.ui.model.Filter("isGroupSelected", sap.ui.model.FilterOperator.EQ, true);
                var sGroupsMode = that.oModel.getProperty('/homePageGroupDisplay'),
                    bEditMode = that.oModel.getProperty("/tileActionModeActive");
                if (sGroupsMode && sGroupsMode === "tabs" && !bEditMode) {
                    //Performing filter causes all aggregations of the tile containers to be destroyed by calling "destroy" of each
                    //entry and not by "destroyAll" method of the control. Since links are not controlled by GLP, we cannot allow to destroy them.
                    //In order to prevent destruction of all links, we remove all links from all tile containers except for the selected one.
//                    this.removeLinksFromUnselectedGroups();
                    this.getBinding("groups").filter([oFilter]);
                } else if (!bEditMode){
                    oFilter = new sap.ui.model.Filter("isGroupVisible", sap.ui.model.FilterOperator.EQ, true);
                    this.getBinding("groups").filter([oFilter]);
                }

                //Recheck tiles visibility on first load, and make visible tiles active
                try {
                    sap.ushell.utils.handleTilesVisibility();
                } catch (e) {
                    //nothing has to be done
                }

            };

            this.isTabBarActive = function () {
                return this.oModel.getProperty("/homePageGroupDisplay") === "tabs";
            };

            this.oGroupsContainer = new DashboardGroupsContainer("dashboardGroups", {
                accessibilityLabel : sap.ushell.resources.i18n.getText("DashboardGroups_label"),
                groups : {
                    path: "/groups",
                    template : oTilesContainerTemplate
                },
                displayMode: "{/homePageGroupDisplay}",
                afterRendering : fGroupsContainerAfterRenderingHandler
            });

            this.oGroupsContainer.addEventDelegate({
                onsapskipback: function (oEvent) {
                    oEvent.preventDefault();
                    sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);

                    var jqElement = jQuery(".sapUshellAnchorItem:visible:first");
                    if (!jqElement.length) {
                        sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                    } else {
                        sap.ushell.components.flp.ComponentKeysHandler.goToSelectedAnchorNavigationItem();
                    }
                },
                onsapskipforward: function (oEvent) {
                    oEvent.preventDefault();
                    var floatingFooterDoneBtn = jQuery("#sapUshellDashboardFooterDoneBtn:visible");
                    if (floatingFooterDoneBtn.length) {
                        floatingFooterDoneBtn.focus();
                    } else {
                        // if co-pilot exists and we came from tile - need to focus on copilot - otherwise - on mearea
                        if(jQuery("#sapUshellFloatingContainerWrapper:visible").length == 1 &&  (oEvent.originalEvent.srcElement.id) != ""){
                            sap.ui.getCore().getEventBus().publish("launchpad", "shellFloatingContainerIsAccessible" );
                        }else{
                            sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                            sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                        }
                    }
                },
                onsaptabnext: function (oEvent) {
                    if (that.oModel.getProperty("/tileActionModeActive")) {
                        var jqClosestHeader = jQuery(document.activeElement).closest(".sapUshellTileContainerHeader");
                        if (!jqClosestHeader || jqClosestHeader.length === 0) {
                            oEvent.preventDefault();
                            var floatingFooterDoneBtn = jQuery("#sapUshellDashboardFooterDoneBtn:visible");
                            if (floatingFooterDoneBtn.length) {
                                floatingFooterDoneBtn.focus();
                            }
                        } else {
                            /*
                                We are inside the header.
                                ONLY focused element is last before the tiles-list we call to set focus on tiles list.
                                otherwise - let the browser handle it.
                              */

                            // if we have tiles in this container
                            var jqCurrentTileContainer = jQuery(document.activeElement).closest(".sapUshellTileContainer");

                            //inside header we can be on 2 section elements - title OR delete/reset button (in case exist)
                            //check if we are on the title itself
                            var isCurrentElementTitle = jQuery(document.activeElement).hasClass("sapUshellContainerTitle");

                            //  search for actions inside the header title element
                            var jqChildActions = jqCurrentTileContainer.find('.sapUshellHeaderActionButton');

                            // check if actions exist on header title element
                            var isActionsExistOnTitleElement = jqChildActions && jqChildActions.length > 0;

                            // check if the current element is the last action in the header-title element
                            var isCurrentElementLastAction = false;
                            if (isActionsExistOnTitleElement) {
                                isCurrentElementLastAction = document.activeElement.id === jqChildActions.last()[0].id;
                            }

                            /*
                             In the cases of:
                             - current element is the title itself, and there are no actions on header title
                             - current element is an action of the header title, and it is the last action

                             We tab into the tiles-container and enforce focusing the last focused tile in this group
                             (fallback will be selecting the first tile on the group)
                             */
                            if ((isCurrentElementTitle && !isActionsExistOnTitleElement) ||
                                (isCurrentElementLastAction)) {

                                oEvent.preventDefault();

                                // check for items (tiles/links) we can focus on
                                var bHasItemsToFocusOn =  jqCurrentTileContainer.find(".sapUshellTile:visible, sapUshellLink:visible").length > 0;

                                // as we inside the header, additional tab requires us to focus last visited tile on the current container
                                // if we have tiles/links to focus on - do it
                                if (bHasItemsToFocusOn) {
                                    sap.ushell.components.flp.ComponentKeysHandler.goToLastVisitedTile(jqCurrentTileContainer, true);
                                } else {

                                    // else - focus on Done button (same as F6 from tiles)
                                    var floatingFooterDoneBtn = jQuery("#sapUshellDashboardFooterDoneBtn:visible");
                                    if (floatingFooterDoneBtn.length) {
                                        floatingFooterDoneBtn.focus();
                                    } else {
                                        // if co-pilot exists and we came from tile - need to focus on copilot - otherwise - on mearea
                                        if(jQuery("#sapUshellFloatingContainerWrapper:visible").length == 1 &&  (oEvent.originalEvent.srcElement.id) != ""){
                                            sap.ui.getCore().getEventBus().publish("launchpad", "shellFloatingContainerIsAccessible");
                                        }else{
                                            sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                                            sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        oEvent.preventDefault();
                        if(jQuery("#sapUshellFloatingContainerWrapper:visible").length == 1 &&  (oEvent.originalEvent.srcElement.id) != ""){
                            sap.ui.getCore().getEventBus().publish("launchpad", "shellFloatingContainerIsAccessible");
                        }else{
                            sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                            sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                        }
                    }
                },
                onsaptabprevious: function (oEvent) {
                    sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                    var jqFocused = jQuery(":focus");
                    if (!that.oModel.getProperty("/tileActionModeActive") || jqFocused.hasClass("sapUshellTileContainerHeader")) {
                        oEvent.preventDefault();
                        var jqElement = jQuery(".sapUshellAnchorItem:visible:first"),
                            jqOverflowElement = jQuery(".sapUshellAnchorItemOverFlow");
                        if (!jqElement.length) {
                            sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                        }
                        if (jqOverflowElement.hasClass("sapUshellShellHidden")) {
                            sap.ushell.components.flp.ComponentKeysHandler.goToSelectedAnchorNavigationItem();
                        } else {
                            jqOverflowElement.find("button").focus();
                        }
                        // only in case we in edit mode
                    } else if (that.oModel.getProperty("/tileActionModeActive")) {
                        var jqActiveElement = jQuery(document.activeElement);

                        // only in case focus is on a tile we need custom behavior upon shift-tab
                        // otherwise let the browser handle it
                        if (jqActiveElement.hasClass('sapUshellTile')) {
                            oEvent.preventDefault();

                            // take reference to current tile container
                            var jqCurrentTileContainer = jqActiveElement.closest(".sapUshellTileContainer");

                            //  search for actions inside the header title element
                            var jqLastAction = jqCurrentTileContainer.find('.sapUshellHeaderActionButton:visible').last();

                            // check if actions exist on header title element
                            // if there are actions of tile container header - focus on last one
                            if (jqLastAction.length > 0) {
                                jqLastAction.focus();
                            } else {
                                // else focus on title
                                jqCurrentTileContainer.find('.sapUshellContainerTitle').focus();
                            }
                        }
                    }
                }
            });
            this.oModel = oModel;
            return this.oGroupsContainer;
        },
        getAllGroupsFromModel : function () {
            return this.oModel.getProperty("/groups");
        },

        /**
         * Returns a template of a dashboard group.
         * Contains aggregations of links and tiles
         */
        _getTileContainerTemplate : function (oController, oModel) {
            var that = this,
                oTilesContainerTemplate = new sap.ushell.ui.launchpad.TileContainer({
                    headerText: "{title}",
                    tooltip: "{title}",
                    tileActionModeActive: '{/tileActionModeActive}',
                    ieHtml5DnD: oController.getView().ieHtml5DnD,
                    enableHelp: '{/enableHelp}',
                    groupId: "{groupId}",
                    defaultGroup: "{isDefaultGroup}",
                    isLastGroup: "{isLastGroup}",
                    isGroupLocked: "{isGroupLocked}",
                    isGroupSelected: "{isGroupSelected}",
                    showHeader: true,
                    editMode: "{editMode}",
                    supportLinkPersonalization: this.isLinkPersonalizationSupported,
                    titleChange: function (oEvent) {
                        sap.ui.getCore().getEventBus().publish("launchpad", "changeGroupTitle", {
                            groupId: oEvent.getSource().getGroupId(),
                            newTitle: oEvent.getParameter("newTitle")
                        });
                    },
                    showEmptyLinksAreaPlaceHolder: {
                        parts: ['links/length', '/isInDrag', '/homePageGroupDisplay'],
                        formatter: function (numOfLinks, bIsInDrag, sAnchorbarMode) {
                            return bIsInDrag && sAnchorbarMode === 'tabs' && !numOfLinks;
                        }
                    },
                    showPlaceholder: {
                        parts: ["/tileActionModeActive", "tiles/length"],
                        formatter: function (tileActionModeActive) {
                            return (tileActionModeActive || !this.groupHasTiles()) && !this.getIsGroupLocked();
                        }
                    },
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
                    hidden: {
                        parts: ['/tileActionModeActive', 'isGroupVisible'],
                        formatter: function (bIsActionModeActive, bIsGroupVisible) {
                            return bIsActionModeActive && !bIsGroupVisible;
                        }
                    },
                    links: this._getLinkTemplate(),
                    tiles: this._getTileTemplate(),
                    add: /*oController._addTileContainer,*/ function (oEvent) {
                        //Fix internal incident #1780370222 2017
                        if (document.toDetail) {
                            document.toDetail();
                        }
                        that.oController.getView().parentComponent.getRouter().navTo('appFinder', {
                            'menu': 'catalog',
                            filters: JSON.stringify({
                                targetGroup: encodeURIComponent(oEvent.getSource().getBindingContext().sPath)
                            })
                        });
                    },
                    afterRendering: jQuery.proxy(this._tileContainerAfterRenderingHandler, that/*, oEvent*/)
                });
            return oTilesContainerTemplate;
        },
        _getLinkTemplate : function () {
            var oFilter = new sap.ui.model.Filter("isTileIntentSupported", sap.ui.model.FilterOperator.EQ, true);

            if (!this.isLinkPersonalizationSupported) {
                return {
                    path: "links",
                    templateShareable: true,
                    template: new sap.ushell.ui.launchpad.LinkTileWrapper({
                        uuid: "{uuid}",
                        tileCatalogId: "{tileCatalogId}",
                        target: "{target}",
                        isLocked: "{isLocked}",
                        tileActionModeActive: "{/tileActionModeActive}",
                        animationRendered: false,
                        debugInfo: "{debugInfo}",
                        ieHtml5DnD: this.oController.getView().ieHtml5DnD,
                        tileViews: {
                            path: "content",
                            factory: function (sId, oContext) {
                                return oContext.getObject();
                            }
                        },
                        afterRendering: function (oEvent) {
                            var jqHrefElement = jQuery(this.getDomRef().getElementsByTagName("a"));
                            // Remove tabindex from links
                            //  so that the focus will not be automatically set on the focusable link when returning to the launchpad
                            jqHrefElement.attr("tabindex", -1);
                        }
                    }),
                    filters: [oFilter]
                };
            } else {
                return {
                    path: "links",
                    factory: function (sId, oContext) {
                        return oContext.getObject().content[0];
                    },
                    filters: [oFilter]
                };
            }
        },
        _getTileTemplate : function () {
            var oFilter = new sap.ui.model.Filter("isTileIntentSupported", sap.ui.model.FilterOperator.EQ, true);
            var oTile = new sap.ushell.ui.launchpad.Tile({
                "long": "{long}",
                // The model flag draggedInTabBarToSourceGroup was set for the tile in when it was dragged on TabBar between groups
                isDraggedInTabBarToSourceGroup: "{draggedInTabBarToSourceGroup}",
                uuid: "{uuid}",
                        tileCatalogId: "{tileCatalogId}",
                            isCustomTile : "{isCustomTile}",
                            target: "{target}",
                            isLocked: "{isLocked}",
                            navigationMode: "{navigationMode}",
                            tileActionModeActive: "{/tileActionModeActive}",
                            showActionsIcon: "{showActionsIcon}",
                            rgba: "{rgba}",
                            animationRendered: false,
                            debugInfo: "{debugInfo}",
                            ieHtml5DnD: this.oController.getView().ieHtml5DnD,
                            afterRendering: function (oEvent) {
                            var oContext = oEvent.getSource().getBindingContext(),
                                oTileModel;
                            if (oContext) {
                                oTileModel = oContext.getObject();
                                sap.ui.getCore().getEventBus().publish("launchpad", "tileRendered", {
                                    tileId: oTileModel.originalTileId,
                                    tileDomElementId: oEvent.getSource().getId()
                                });
                    }
                },
                tileViews: {
                    path: "content",
                    factory: function (sId, oContext) {
                        return oContext.getObject();
                    }
                },
                coverDivPress: function (oEvent) {
                    // if this tile had just been moved and the move itself did not finish refreshing the tile's view
                    // we do not open the actions menu to avoid inconsistencies
                    if (!oEvent.oSource.getBindingContext().getObject().tileIsBeingMoved) {
                        sap.ushell.components.flp.ActionMode._openActionsMenu(oEvent);
                    }
                },
                showActions: function (oEvent) {
                    sap.ushell.components.flp.ActionMode._openActionsMenu(oEvent);
                },
                deletePress: function (oEvent) {
                    var oTileControl =  oEvent.getSource(), oTile = oTileControl.getBindingContext().getObject().object,
                        oData = {originalTileId : sap.ushell.Container.getService("LaunchPage").getTileId(oTile)};

                    sap.ui.getCore().getEventBus().publish("launchpad", "deleteTile", oData, this);
                },// TODO Call this controller function: this.oController._dashboardDeleteTileHandler,
                press : [ this.oController.dashboardTilePress, this.oController ]
            });
            var oViewPortContainer = sap.ui.getCore().byId("viewPortContainer");
            oTile.addEventDelegate({
                onclick: function (oEvent) {
                    jQuery.sap.measure.start("FLP:DashboardGroupsBox.onclick", "Click on tile", "FLP");
                    jQuery.sap.measure.start("FLP:OpenApplicationonClick", "Open Application", "FLP");
                    function endTileMeasurement(){
                        jQuery.sap.measure.end("FLP:DashboardGroupsBox.onclick");
                        oViewPortContainer.detachAfterNavigate(endTileMeasurement);
                    }
                    oViewPortContainer.attachAfterNavigate(endTileMeasurement);
                }
            });
            return {
                path: "tiles",
                templateShareable: true,
                template: oTile,
                filters: [oFilter]
            };
        },
        _tileContainerAfterRenderingHandler : function (oEvent) {
            oEvent.oSource.bindProperty("showBackground", "/tileActionModeActive");
            oEvent.oSource.bindProperty("showDragIndicator", {
                parts: ['/tileActionModeActive', '/enableDragIndicator'],
                formatter: function (bIsActionModeActive, bDragIndicator) {
                    return bIsActionModeActive && bDragIndicator && !this.getIsGroupLocked() && !this.getDefaultGroup();
                }
            });
            oEvent.oSource.bindProperty("showEmptyLinksArea", {
                parts: ['/tileActionModeActive', 'links/length',  "isGroupLocked", '/isInDrag', '/homePageGroupDisplay'],
                formatter: function (tileActionModeActive, numOfLinks, isGroupLocked, bIsInDrag, sAnchorbarMode) {
                    if (numOfLinks) {
                        return true;
                    } else if (isGroupLocked) {
                        return false;
                    } else {
                        return tileActionModeActive || bIsInDrag && sAnchorbarMode === 'tabs';
                    }
                }
            });
            oEvent.oSource.bindProperty("showMobileActions", {
                parts: ['/tileActionModeActive'],
                formatter: function (bIsActionModeActive) {
                    return bIsActionModeActive && !this.getDefaultGroup();
                }
            });
            oEvent.oSource.bindProperty("showIcon", {
                parts: ['/isInDrag', '/tileActionModeActive'],
                formatter: function (bIsInDrag, bIsActionModeActive) {
                    return (this.getIsGroupLocked() && (bIsInDrag || bIsActionModeActive));
                }
            });
            oEvent.oSource.bindProperty("deluminate", {
                parts: ['/isInDrag'],
                formatter: function (bIsInDrag) {
                  //  return oEvent.oSource.getIsGroupLocked() && bIsInDrag;
                    return this.getIsGroupLocked() && bIsInDrag;
                }
            });

            oEvent.oSource.bindProperty("transformationError", {
                parts: ['/isInDrag', '/draggedTileLinkPersonalizationSupported'],
                formatter: function (bIsInDrag, bDraggedTileLinkPersonalizationSupported) {
                    return bIsInDrag && !bDraggedTileLinkPersonalizationSupported;
                }
            });

            if (this.bTileContainersContentAdded && !oEvent.oSource.getBeforeContent().length) {
                var aGroups = oEvent.oSource.getModel().getProperty("/groups"),
                    i;

                for (i = 0; i < aGroups.length; i++) {
                    if (aGroups[i].groupId === oEvent.oSource.getGroupId()) {
                        break;
                    }
                }
                this._addTileContainerContent(i);
            }
            // in order to set groups again to their right position after closing edit mode, we will need to re-render
            // the groups layout. We need it for the Locked Groups Compact Layout feature
            sap.ushell.Layout.reRenderGroupsLayout(null);

            this._updateFirstGroupHeaderVisibility(
                oEvent.oSource.getProperty('tileActionModeActive'),
                oEvent.oSource.getModel().getProperty('/homePageGroupDisplay') !== "tabs");
        },
        _updateFirstGroupHeaderVisibility: function (bIsEditMode, bEnableAnchorBar) {
            var aGroups = this.oGroupsContainer.getGroups(),
                iFirstVisible = undefined,
                iVisibleGroups = 0;

            for (var i = aGroups.length - 1; i >= 0; --i) {
                aGroups[i].setShowGroupHeader(bIsEditMode || bEnableAnchorBar);
                if (aGroups[i].getProperty("visible")) {
                    iVisibleGroups++;
                    iFirstVisible = i;
                }
            }

            if (iFirstVisible !== undefined)
                aGroups[iFirstVisible].setShowGroupHeader(bIsEditMode || (iVisibleGroups == 1 && bEnableAnchorBar));
        },
        _addTileContainersContent : function () {
            if (!this.bTileContainersContentAdded) {
                var aGroups = this.oGroupsContainer.getGroups();

                aGroups.forEach(function (group, groupIndex) {
                    this._addTileContainerContent(groupIndex);
                }.bind(this));
                this.bTileContainersContentAdded = true;
            }
        },
        _addTileContainerContent : function (groupIndex) {
            var oGroup = this.oGroupsContainer.getGroups()[groupIndex],
                sBindingCtxPath;

            if (oGroup) {
                sBindingCtxPath = oGroup.getBindingContext().getPath() + '/';

                oGroup.addBeforeContent(this._getBeforeContent(this.oController, sBindingCtxPath));
                oGroup.addAfterContent(this._getAfterContent(this.oController, sBindingCtxPath));
                sap.ui.require(["sap/ushell/ui/launchpad/GroupHeaderActions"], function (GroupHeaderActions) {
                    var oHeaderAction = new GroupHeaderActions({
                        content : this._getHeaderActions(),
                        tileActionModeActive: {
                            parts: ['/tileActionModeActive', sBindingCtxPath + 'isDefaultGroup'],
                            formatter: function (bIsActionModeActive, bIsDefaultGroup) {
                                return bIsActionModeActive && !bIsDefaultGroup;
                            }
                        },
                        isOverflow: '{/isPhoneWidth}'
                    }).addStyleClass("sapUshellOverlayGroupActionPanel");
                    oGroup.addHeaderAction(oHeaderAction);
                }.bind(this));
            }
        },
        _getBeforeContent : function (oController) {
            var addGrpBtn = new sap.m.Button({
                icon: "sap-icon://add",
                text : sap.ushell.resources.i18n.getText("add_group_at"),
                visible : {
                    parts: ["/tileActionModeActive"],
                    formatter : function (tileActionModeActive) {
                        return (!this.getParent().getIsGroupLocked() && !this.getParent().getDefaultGroup() && tileActionModeActive);
                    }
                },
                enabled: {
                    parts: ["/editTitle"],
                    formatter : function (isEditTitle) {
                        return !isEditTitle;
                    }
                },
                press : [ this.oController._addGroupHandler]
            }).addStyleClass("sapUshellAddGroupButton");

            addGrpBtn.addDelegate({
                onAfterRendering: function () {
                    jQuery(".sapUshellAddGroupButton").attr("tabindex", -1);
                }
            });

            return addGrpBtn;
        },
        _getAfterContent : function (oController) {
            var addGrpBtn = new sap.m.Button({
                icon: "sap-icon://add",
                text : sap.ushell.resources.i18n.getText("add_group_at"),
                visible : {
                    parts: ["isLastGroup", "/tileActionModeActive", "/isInDrag"],
                    formatter : function (isLast, tileActionModeActive, isInDrag) {
                        // Calculate the result only if isInDrag is false,
                        // meaning - if there was a drag-and-drop action - is it already ended
                        return (isLast && tileActionModeActive);
                    }
                },
                enabled: {
                    parts: ["/editTitle"],
                    formatter : function (isEditTitle) {
                        return !isEditTitle;
                    }
                },
                press : [ this.oController._addGroupHandler]
            }).addStyleClass("sapUshellAddGroupButton");

            addGrpBtn.addDelegate({
                onAfterRendering: function () {
                    jQuery(".sapUshellAddGroupButton").attr("tabindex", -1);
                }
            });

            return addGrpBtn;
        },
        _getHeaderActions: function () {
            var oShowHideBtn = new sap.m.Button({
                text: {
                    path: 'isGroupVisible',
                    formatter: function (bIsGroupVisible) {
                        if (sap.ui.Device.system.phone) {
                            this.setIcon(bIsGroupVisible ? "sap-icon://hide" : "sap-icon://show");
                        }
                        return sap.ushell.resources.i18n.getText(bIsGroupVisible ? 'HideGroupBtn' : 'ShowGroupBtn');
                    }
                },
                visible: {
                    parts: ['/tileActionModeActive', '/enableHideGroups', 'isGroupLocked', 'isDefaultGroup'],
                    formatter: function (bIsActionModeActive, bIsHideGroupsEnabled, bIsGroupLocked, bIsDefaultGroup) {
                        return bIsActionModeActive && bIsHideGroupsEnabled && !bIsGroupLocked && !bIsDefaultGroup;
                        //return true;
                    }
                },
                press: function (oEvent) {
                    var oSource = oEvent.getSource(),
                        oGroupBindingCtx = oSource.getBindingContext();
                    this.oController._changeGroupVisibility(oGroupBindingCtx);
                }.bind(this)
            }).addStyleClass("sapUshellHeaderActionButton");
            var oDeleteBtn = new sap.m.Button({
                text: {
                    path: 'removable',
                    formatter: function (bIsRemovable) {
                        if (sap.ui.Device.system.phone) {
                            if (bIsRemovable) {
                                this.setIcon("sap-icon://delete");
                            } else {
                                this.setIcon("sap-icon://refresh");
                            }
                        }
                        return sap.ushell.resources.i18n.getText(bIsRemovable ? 'DeleteGroupBtn' : 'ResetGroupBtn');
                    }
                },
                visible: {
                    parts: ['/tileActionModeActive', 'isDefaultGroup'],
                    formatter: function (bIsActionModeActive, bIsDefaultGroup) {
                        return bIsActionModeActive && !bIsDefaultGroup;
                    }
                },
                enabled: {
                    parts: ["/editTitle"],
                    formatter : function (isEditTitle) {
                        return !isEditTitle;
                    }
                },
                press: function (oEvent) {
                    var oSource = oEvent.getSource(),
                        oGroupBindingCtx = oSource.getBindingContext();
                    this.oController._handleGroupDeletion(oGroupBindingCtx);
                }.bind(this)
            }).addStyleClass("sapUshellHeaderActionButton");
            return [oShowHideBtn, oDeleteBtn];
        },
        _hidePlusTile : function (plusTileDomRef) {
            if (plusTileDomRef) {
                plusTileDomRef.className += " sapUshellHidePlusTile";
            }
        },
        _showPlusTile: function (plusTileDomRef) {
            if (plusTileDomRef) {
                plusTileDomRef.className = plusTileDomRef.className.split(' ' + 'sapUshellHidePlusTile').join('');
            }
        }
    });


	return DashboardGroupsBox;

});
},
	"sap/ushell/components/flp/launchpad/dashboard/DashboardUIActions.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview A module that is responsible for initializing the dashboard UIActions (i.e. drag and drop) of groups and tiles.<br>
 * Extends <code>sap.ui.base.Object</code><br>
 * Exposes the public function <code>initializeUIActions</code>
 * @version 1.52.4
 * @name sap.ushell.components.flp.launchpad.dashboard.DashboardUIActions
 *
 * @since 1.35.0
 * @private
 */
sap.ui.define(["sap/ui/base/Object"], function(baseObject) {
	"use strict";

    /*global jQuery, sap, window */
    /*jslint nomen: true */
    var DashboardUIActions = baseObject.extend("sap.ushell.components.flp.launchpad.dashboard.DashboardUIActions", {
        metadata: {
            publicMethods: ["initializeUIActions"]
        },
        constructor: function (sId, mSettings) {
        	this.aTabBarItemsLocation = [];

            // Make this class only available once
            if (sap.ushell.components.flp.launchpad.dashboard.getDashboardUIActions && sap.ushell.components.flp.launchpad.dashboard.getDashboardUIActions()) {
                return sap.ushell.components.flp.launchpad.dashboard.getDashboardUIActions();
            }
            sap.ushell.components.flp.launchpad.dashboard.getDashboardUIActions = jQuery.sap.getter(this.getInterface());

            this.oTileUIActions = undefined;
            this.oLinkUIActions = undefined;
            this.oGroupUIActions = undefined;
            this.oController = undefined;
            this.UIActionsInitialized = false;

            // Enabling and disabling drag and drop of groups (groupsUIAction) depends of activation and activation of ActionMode
            sap.ui.getCore().getEventBus().subscribe('launchpad', 'actionModeActive', this._enableGroupUIActions, this);
            sap.ui.getCore().getEventBus().subscribe('launchpad', 'actionModeInactive', this._disableGroupUIActions, this);
        },
        destroy: function () {
            sap.ui.getCore().getEventBus().unsubscribe('launchpad', 'actionModeActive', this._enableGroupUIActions, this);
            sap.ui.getCore().getEventBus().unsubscribe('launchpad', 'actionModeInactive', this._disableGroupUIActions, this);
            sap.ushell.components.flp.launchpad.dashboard.getDashboardUIActions = undefined;
            this.oGroupUIActions = null;
            this.oTileUIActions = null;
            this.oLinkUIActions = null;
        },
        /**
         * Creating UIAction objects for tiles and groups in order to allow dashboard drag and drop actions
         *
         * @param {object} The DashboardContent.controller instance
         *
         * @since 1.35
         *
         * @private
         */
        initializeUIActions : function (oController) {
            this.oController = oController;
            // If TabBar mode active - calculate TabBar items position
            if(oController.getView().getModel().getProperty("/homePageGroupDisplay") === "tabs") {
            	this._fillTabBarItemsArray();
            }

            var isLinkPersonalizationSupported = sap.ushell.Container ? sap.ushell.Container.getService("LaunchPage").isLinkPersonalizationSupported() : null;

            var sDashboardGroupsWrapperId = oController.getView().sDashboardGroupsWrapperId,
                bActionModeActive,
                bRightToLeft = sap.ui.getCore().getConfiguration().getRTL(),

                // Object that contains the common attributed required of the creation of oTileUIActions and oGroupUIActions in Win8 use-case
                oCommonUIActionsDataForWin8 = {
                    containerSelector: '#dashboardGroups',
                    wrapperSelector: sDashboardGroupsWrapperId ? "#" + sDashboardGroupsWrapperId : undefined, // The id of the <section> that wraps dashboardGroups div: #__page0-cont
                    rootSelector : "#shell"
                },
                // Object that contains the common attributed required of the creation of oTileUIActions and oGroupUIActions, including Win8 attributes
                oCommonUIActionsData = jQuery.extend(true, {}, oCommonUIActionsDataForWin8, {
                    switchModeDelay: 1000,
                    isTouch: oController.getView().isTouch,
                    isCombi: oController.getView().isCombi,
                    debug: false
                }),
                oLinkUIActionsData = {
                    draggableSelector: ".sapUshellLinkTile",
                    placeHolderClass: "sapUshellLinkTile-placeholder",
                    cloneClass: "sapUshellLinkTile-clone",
                    startCallback: this._handleTileUIStart.bind(this),
                    endCallback: this._handleLinkDrop.bind(this),
                    dragCallback: this._handleStartDragTile.bind(this),
                    onBeforeCreateClone: this._onBeforeCreateLinkClone.bind(this),
                    dragAndScrollCallback: this._handleTileDragMove.bind(this),
                    endDragAndScrollCallback: this._handleTileDragAndScrollContinuation.bind(this),
                    moveTolerance: oController.getView().isTouch || oController.getView().isCombi ? 10 : 3,
                    isLayoutEngine: true,
                    disabledDraggableSelector: 'sapUshellLockedTile',//check licked links
                    onDragStartUIHandler: this._markDisableGroups.bind(this),
                    onDragEndUIHandler: this._endUIHandler.bind(this),
                    offsetLeft: bRightToLeft ? jQuery(".sapUshellViewPortLeft").width() : -jQuery(".sapUshellViewPortLeft").width()
                },
                oTileUIActionsData = {
                    draggableSelector: ".sapUshellTile",
                    draggableSelectorExclude: ".sapUshellPlusTile",
                    placeHolderClass: "sapUshellTile-placeholder",
                    cloneClass: "sapUshellTile-clone",
                    deltaTop: -44,
                    scrollContainerSelector: undefined, // @TODO remove this
                    startCallback: this._handleTileUIStart.bind(this),
                    endCallback: this._handleTileDrop.bind(this),
                    dragCallback: this._handleStartDragTile.bind(this),
                    dragAndScrollCallback: this._handleTileDragMove.bind(this),
                    endDragAndScrollCallback: this._handleTileDragAndScrollContinuation.bind(this),
                    moveTolerance: oController.getView().isTouch || oController.getView().isCombi ? 10 : 3,
                    isLayoutEngine: true,
                    disabledDraggableSelector: 'sapUshellLockedTile',
                    onDragStartUIHandler: this._markDisableGroups.bind(this),
                    onDragEndUIHandler: this._endUIHandler.bind(this),
                    offsetLeft: bRightToLeft ? jQuery(".sapUshellViewPortLeft").width() : -jQuery(".sapUshellViewPortLeft").width()
                },
                oGroupUIActionsData = {
                    draggableSelector: ".sapUshellDashboardGroupsContainerItem:not(.sapUshellDisableDragAndDrop)",
                    draggableSelectorBlocker: ".sapUshellTilesContainer-sortable, .sapUshellTileContainerBeforeContent, .sapUshellTileContainerAfterContent",
                    draggableSelectorExclude: ".sapUshellHeaderActionButton",
                    placeHolderClass: "sapUshellDashboardGroupsContainerItem-placeholder",
                    cloneClass: "sapUshellDashboardGroupsContainerItem-clone",
                    startCallback: this._handleGroupsUIStart.bind(this),
                    endCallback: this._handleGroupDrop.bind(this),
                    dragCallback: this._handleGroupStartDrag.bind(this),
                    moveTolerance: oController.getView().isTouch || oController.getView().isCombi ? 10 : 0.1,
                    isLayoutEngine: false,
                    isVerticalDragOnly: true,
                    draggableElement: ".sapUshellTileContainerHeader"
                },
                oWin8TileUIActionsData = {
                    type: "tiles",
                    draggableSelector: ".sapUshellTile",
                    placeHolderClass : "sapUshellTile-placeholder",
                    cloneClass: "sapUshellTile-clone",
                    startCallback : this._handleTileUIStart.bind(this),
                    endCallback : this._handleTileDrop.bind(this),
                    dragCallback : this._handleStartDragTile.bind(this),
                    dragAndScrollCallback : this._handleTileDragMove.bind(this),
                    onDragStartUIHandler : this._markDisableGroups.bind(this),
                    onDragEndUIHandler : this._endUIHandler.bind(this),
                    offsetLeft: bRightToLeft ? jQuery(".sapUshellViewPortLeft").width() : -jQuery(".sapUshellViewPortLeft").width()
                },
                oWin8LinkUIActionsData = {
                    type: "links",
                    draggableSelector: ".sapUshellLinkTile",
                    placeHolderClass: "sapUshellLinkTile-placeholder",
                    startCallback: this._handleTileUIStart.bind(this),
                    endCallback: this._handleLinkDrop.bind(this),
                    dragCallback: this._handleStartDragTile.bind(this),
                    dragAndScrollCallback: this._handleTileDragMove.bind(this),
                    onBeforeCreateClone: this._onBeforeCreateLinkClone.bind(this),
                    onDragStartUIHandler: this._markDisableGroups.bind(this),
                    onDragEndUIHandler: this._endUIHandler.bind(this),
                    offsetLeft: bRightToLeft ? jQuery(".sapUshellViewPortLeft").width() : -jQuery(".sapUshellViewPortLeft").width()
                },
                oWin8GroupUIActionsData = {
                    type: "groups",
                    draggableSelector: ".sapUshellTileContainerHeader",
                    placeHolderClass : "sapUshellDashboardGroupsContainerItem-placeholder",
                    _publishAsync: oController._publishAsync
                };

            // Creating the sap.ushell.UIActions objects for tiles and groups
            if (oController.getView().oDashboardGroupsBox.getGroups().length) {
                if (oController.getView().getModel().getProperty("/personalization")) {


                    if (!oController.getView().ieHtml5DnD) {
                        sap.ui.require(['sap/ushell/UIActions'], function (UIActions) {
                            // Disable the previous instances of UIActions
                            this._disableTileUIActions();
                            this._disableGroupUIActions();
                            this._disableLinkUIActions();

                            // Create and enable tiles UIActions
                            this.oTileUIActions = new UIActions(jQuery.extend(true, {}, oCommonUIActionsData, oTileUIActionsData)).enable();
                            // Create groups UIActions, enabling happens according to ActionMode
                            this.oGroupUIActions = new UIActions(jQuery.extend(true, {}, oCommonUIActionsData, oGroupUIActionsData));

                            if(isLinkPersonalizationSupported) {
                                this.oLinkUIActions = new UIActions(jQuery.extend(true, {}, oCommonUIActionsData, oLinkUIActionsData)).enable();
                            }

                            bActionModeActive = oController.getView().getModel().getProperty("/tileActionModeActive");
                            if (bActionModeActive) {
                                this.oGroupUIActions.enable();
                            }
                        }.bind(this));

                    } else {
                        sap.ui.require(['sap/ushell/UIActionsWin8'], function (UIActionsWin8) {
                            this._disableTileUIActions();
                            this._disableGroupUIActions();
                            this._disableLinkUIActions();
                            // Create and enable tiles and groups UIActions
                            this.oTileUIActions = UIActionsWin8.getInstance(jQuery.extend(true, {}, oCommonUIActionsDataForWin8, oWin8TileUIActionsData)).enable();
                            this.oLinkUIActions = UIActionsWin8.getInstance(jQuery.extend(true, {}, oCommonUIActionsDataForWin8, oWin8LinkUIActionsData)).enable();
                            this.oGroupUIActions = UIActionsWin8.getInstance(jQuery.extend(true, {}, oCommonUIActionsDataForWin8, oWin8GroupUIActionsData)).enable();
                        }.bind(this));

                    }
                }
            }
        },
        _enableGroupUIActions: function () {
            if (this.oGroupUIActions) {
                this.oGroupUIActions.enable();
            }
        },

        disableAllDashboardUiAction: function () {
            this._disableTileUIActions();
            this._disableLinkUIActions();
            this._disableGroupUIActions();

        },
        _disableTileUIActions : function () {
            if (this.oTileUIActions) {
                this.oTileUIActions.disable();
            }
        },
        _disableLinkUIActions : function () {
          if (this.oLinkUIActions) {
              this.oLinkUIActions.disable();
          }
        },
        _disableGroupUIActions : function () {
            if (this.oGroupUIActions) {
                this.oGroupUIActions.disable();
                //this.oGroupUIActions = null;
            }
        },

       // ****************************************************************************************
       // *************************** Tile UIActions functions - Begin ***************************

        _handleTileDragMove : function (cfg) {
            if (!cfg.isScrolling) {
                sap.ushell.Layout.getLayoutEngine().moveDraggable(cfg.moveX, cfg.moveY, this.aTabBarItemsLocation);
            }
        },

        _handleTileDragAndScrollContinuation : function (moveY) {
            var iAnchorBarHeight = jQuery("#anchorNavigationBar").height(),
                oAnchorBarOffset = jQuery("#anchorNavigationBar").offset(),
                iAnchorBarOffsetTop = oAnchorBarOffset.top;

            if (moveY < iAnchorBarOffsetTop) {
                sap.ushell.Layout.getLayoutEngine()._cancelLongDropTimmer();
            }
            return sap.ushell.Layout.getLayoutEngine()._isTabBarCollision(moveY);
        },

        _fillTabBarItemsArray: function () {
            var aItems = jQuery(".sapUshellAnchorItem"),
                iLength = aItems.length,
                index,
                iBasicWidthUnit = 10,
                iTempIndex = 0,
                aTabBarItemsBasic = [],
                oItem,
                oItemMeasures,
                oItemWidth,
                iNumOfBasicUnits;

            for (index = 0; index < iLength; index++) {
                oItem = aItems[index];
                oItemMeasures = oItem.getBoundingClientRect();

                aTabBarItemsBasic[index] = oItemMeasures.width;
            }
            for (index = 0; index < iLength; index++) {
                oItemWidth = aTabBarItemsBasic[index];
                if (oItemWidth === 0) {
                    continue;
                }
                iNumOfBasicUnits = Math.round(oItemWidth / iBasicWidthUnit);
                for (var iTempIndex_ = iTempIndex; iTempIndex_ < iTempIndex + iNumOfBasicUnits; iTempIndex_++) {
            		this.aTabBarItemsLocation[iTempIndex_] = index;
				}
            	iTempIndex = iTempIndex_;
        	}
        },

        _handleTileUIStart : function (evt, ui) {
            if ((sap.ui.Device.browser.msie) &&
                    ((navigator.msMaxTouchPoints > 0) || (navigator.maxTouchPoints > 0))) {
                //Remove title so tooltip will not be displayed while dragging tile (IE10 and above)
                this.titleElement = ui.querySelector("[title]");
                if (this.titleElement) {
                    //it solves issue with IE and android, when browsers automatically show tooltip
                    this.titleElement.setAttribute("data-title", this.titleElement.getAttribute("title"));
                    this.titleElement.removeAttribute("title");
                }
            }
        },
        _changeTileDragAndDropAnimate : function (evt, ui) {
            var dashboardPageScrollTop = this.dragNDropData.jqDashboard.scrollTop(),
                jqTile,
                tile,
                currentTilePosition,
                currentTileOffset,
                tileLeftOffset,
                iTileTopOffset,
                i,
                oClonedTile;

            for (i = 0; i < this.dragNDropData.jqDraggableElements.length; i++) {
                jqTile = this.dragNDropData.jqDraggableElements.eq(i);
                tile = jqTile[0];
                //Get the original tile and its clone
                currentTilePosition = jqTile.position();
                currentTileOffset = jqTile.offset();
                if ((currentTileOffset.left === tile.offset.left) && (currentTileOffset.top === tile.offset.top)) {
                    continue;
                }
                tile.position = currentTilePosition;
                tile.offset = currentTileOffset;
                oClonedTile = jqTile.data("clone");
                if (!oClonedTile) {
                    continue;
                }

                //Get the invisible tile that has snapped to the new
                //location, get its position, and animate the visible
                //clone to it
                tileLeftOffset = tile.position.left + this.dragNDropData.containerLeftMargin;
                iTileTopOffset = this._getTileTopOffset(jqTile, tile.position, dashboardPageScrollTop);

                //Stop currently running animations
                //Without this, animations would queue up
                oClonedTile.stop(true, false).animate({left: tileLeftOffset, top: iTileTopOffset}, {duration: 250}, {easing: "swing"});
            }
        },

        _preventTextSelection: function () {
            //Prevent selection of text on tiles and groups
            if (window.getSelection) {
                var selection = window.getSelection();
                // fix IE9 issue (CSS 1580181391)
                try {
                    selection.removeAllRanges();
                } catch (e) {
                    // continue regardless of error
                }
            }
        },

       /**
        *
        * @param ui : tile DOM reference
        * @private
        */
        _handleStartDragTile : function (evt, tileElement) {
        	var selection,
                oTabBarDraggedTile;

           this._preventTextSelection();

            sap.ushell.Layout.getLayoutEngine().layoutStartCallback(tileElement);
            if (sap.ushell.Layout.isAnimationsEnabled()) {
                sap.ushell.Layout.initDragMode();
            }
            //Prevent the tile to be launched after drop
            jQuery(tileElement).find("a").removeAttr('href');
            this.oController._handleDrag.call(this.oController, evt, tileElement);
            sap.ui.getCore().getEventBus().publish("launchpad", "sortableStart");
        },
        _onBeforeCreateLinkClone: function (evt, LinkElement) {
            //we need to save the link bounding rects before uiactions.js create a clone because after it oLink.getBoundingRects will return zero offsets
            sap.ushell.Layout.getLayoutEngine().saveLinkBoundingRects(LinkElement);
        },
        _handleLinkDrop : function (evt, tileElement, oAdditionalParams) {
          var deferred = jQuery.Deferred(),
              oPromise;

          if (sap.ushell.Layout.isTabBarActive()) {
              sap.ushell.Layout.tabBarTileDropped();
          }
          if (sap.ushell.Layout.isAnimationsEnabled() && oAdditionalParams && oAdditionalParams.clone) {
              jQuery(oAdditionalParams.clone).animate({
                  opacity: 0
              }, 100, function() {
                // Animation complete.
              });
          }
          if ((sap.ui.Device.browser.msie) &&
              ((navigator.msMaxTouchPoints > 0) || (navigator.maxTouchPoints > 0)) && this.titleElement) {
              //it solves issue with IE and android, when browsers automatically show tooltip
              this.titleElement.setAttribute("title", this.titleElement.getAttribute("data-title"));//check if we need this
          }
          if (sap.ui.Device.desktop) {
              jQuery('body').removeClass("sapUshellDisableUserSelect");//check if we need this
          }
          if (sap.ushell.Layout.getLayoutEngine().isLinkIntersected() || sap.ushell.Layout.getLayoutEngine().isOriginalAreaChanged()) {
            oPromise = this.oController._handleDrop.call(this.oController, evt, tileElement);
          }

          if (oPromise) {
              oPromise.then(function () {
                  jQuery('#dashboardGroups .sapUshellHidePlusTile').removeClass('sapUshellHidePlusTile');
                  setTimeout(function () {
                      deferred.resolve();
                  }.bind(this), 300);
              });
          } else {
              setTimeout(function () {
                  deferred.resolve();
              }.bind(this), 0);
          }

          return deferred.promise();
        },
        /**
        *
        * @param ui : tile DOM reference
        * @private
        */
        _handleTileDrop : function (evt, tileElement, oAdditionalParams) {
            if (sap.ushell.Layout.getLayoutEngine().isOriginalAreaChanged()) {
              return this._handleTileToLinkDrop(evt, tileElement, oAdditionalParams);
            } else {
              return this._handleTileToTileDrop(evt, tileElement, oAdditionalParams);
            }
        },
        _handleTileToLinkDrop : function (evt, tileElement, oAdditionalParams) {
          return this._handleLinkDrop(evt, tileElement, oAdditionalParams);
        },
        _handleTileToTileDrop : function (evt, tileElement, oAdditionalParams) {
            var jqClone,
                oHoveredTabBarItem,
                oTabBarDraggedTile,
                handleTileDropInternal = function (evt, tileElement) {
                    if (sap.ushell.Layout.isAnimationsEnabled()) {
                        sap.ushell.Layout.endDragMode();
                    }
                    jQuery('#dashboardGroups .sapUshellHidePlusTile').removeClass('sapUshellHidePlusTile');
                    if ((sap.ui.Device.browser.msie) &&
                        ((navigator.msMaxTouchPoints > 0) || (navigator.maxTouchPoints > 0)) && this.titleElement) {
                        //it solves issue with IE and android, when browsers automatically show tooltip
                        this.titleElement.setAttribute("title", this.titleElement.getAttribute("data-title"));
                    }
                    this.oController._handleDrop.call(this.oController, evt, tileElement);
                    if (sap.ui.Device.desktop) {
                        jQuery('body').removeClass("sapUshellDisableUserSelect");
                    }
                },

                oHoveredTabBarItem = jQuery(".sapUshellTabBarHoverOn");
            oHoveredTabBarItem.removeClass("sapUshellTabBarHoverOn");

            oTabBarDraggedTile = jQuery(".sapUshellTileDragOpacity");
            oTabBarDraggedTile.removeClass("sapUshellTileDragOpacity");

            if (sap.ushell.Layout.isTabBarActive()) {
                sap.ushell.Layout.tabBarTileDropped();
            }

            // In tab bar mode, when the tile is dropped on an anchor tab bar item.
            // In this case the tile should not flow back to the source group
            if (sap.ushell.Layout.isTabBarActive() &&  sap.ushell.Layout.isOnTabBarElement()) {

                if (oAdditionalParams && oAdditionalParams.clone) {
                    var oDeferred = jQuery.Deferred();
                    jqClone = jQuery(oAdditionalParams.clone);
                    jqClone.css("display","none");
                    setTimeout(function () {
                        oDeferred.resolve();
                        handleTileDropInternal.call(this, evt, tileElement);
                    }.bind(this), 300);
                    return oDeferred.promise();
                } else {
                    handleTileDropInternal.apply(this, arguments);
                }
            }

            if (sap.ushell.Layout.isAnimationsEnabled() && oAdditionalParams && oAdditionalParams.clone) {
                var deferred = jQuery.Deferred();
                jqClone = jQuery(oAdditionalParams.clone);
                var cloneRect = oAdditionalParams.clone.getBoundingClientRect();
                var placeholderRect = tileElement.getBoundingClientRect();
                var splittedTransform = jqClone.css("transform").split(",");
                var diffY = placeholderRect.top - cloneRect.top;
                var diffX = placeholderRect.left - cloneRect.left;
                var translateX = parseInt(splittedTransform[4], 10) + diffX;
                var translateY = parseInt(splittedTransform[5], 10) + diffY;
                jqClone.css({
                    "transform": "translate3d(" + translateX + "px, " + translateY + "px, 0px)",
                    "transition": "transform 0.3s cubic-bezier(0.46, 0, 0.44, 1)"
                });
                setTimeout(function () {
                    deferred.resolve();
                    handleTileDropInternal.call(this, evt, tileElement);
                }.bind(this), 300);
                return deferred.promise();
            } else {
                handleTileDropInternal.apply(this, arguments);
            }
        },
        _getTileTopOffset : function (oTile, position, dashboardScrollTop) {
            var i = 0,
                iTileTopOffset = i + dashboardScrollTop;

            iTileTopOffset += oTile.closest(".sapUshellDashboardGroupsContainerItem").position().top;
            iTileTopOffset += position.top;
            return iTileTopOffset;
        },
        //During drag action, locked groups should be mark with a locked icon and group opacity should be changed to grayish
        _markDisableGroups : function () {
            if (this.oController.getView().getModel()) {
                this.oController.getView().getModel().setProperty('/isInDrag', true);
            }
        },
        //once d&d ends, restore locked groups appearance and remove locked icons and grayscale
        _endUIHandler : function () {
            if (sap.ushell.Layout.isAnimationsEnabled()) {
                sap.ushell.Layout.endDragMode();
            }
            if (this.oController.getView().getModel()) {
                this.oController.getView().getModel().setProperty('/isInDrag', false);
            }
        },
        // **************************** Tile UIActions functions - End ****************************
        // ****************************************************************************************
        // *************************** Group UIActions functions - Begin **************************

        _handleGroupStartDrag : function (evt, ui) {
            this.oTileUIActions.disable();
            if(this.oLinkUIActions) {
              this.oLinkUIActions.disable();
            }
            var groupContainerClone = jQuery(".sapUshellDashboardGroupsContainerItem-clone"),
                groupContainerCloneTitle = groupContainerClone.find(".sapUshellContainerTitle"),
                titleHeight = groupContainerCloneTitle.height(),
                titleWidth = groupContainerCloneTitle.width(),
                groupsTop,
                groupPlaceholder,
                groupClone,
                scrollY,
                bRightToLeft = sap.ui.getCore().getConfiguration().getRTL();

            if (!sap.ui.Device.system.phone) {
                groupContainerClone.find(".sapUshellTileContainerEditMode").offset({
                    top: this.oGroupUIActions.getMove().y - titleHeight,
                    left: bRightToLeft ? jQuery(".sapUshellViewPortCenter").width() + this.oGroupUIActions.getMove().x + titleWidth :
                    this.oGroupUIActions.getMove().x - (titleWidth / 2)
                });
                jQuery(".sapUshellTileContainerBeforeContent").addClass("sapUshellTileContainerHidden");
            } else {
                jQuery(".sapUshellTilesContainer-sortable").addClass("sapUshellTileContainerRemoveContent");
                jQuery(".sapUshellLineModeContainer, .sapUshellLinksContainer").addClass("sapUshellTileContainerRemoveContent");
                jQuery(".sapUshellTileContainerBeforeContent").addClass("sapUshellTileContainerRemoveContent");
                jQuery(".sapUshellContainerHeaderActions").addClass("sapUshellTileContainerHidden");
            }
            jQuery(".sapUshellTileContainerAfterContent").addClass("sapUshellTileContainerRemoveContent");
            jQuery(ui).find(".sapUshellContainerHeaderActions").addClass("sapUshellTileContainerHidden");

            this.oController.getView().getModel().setProperty('/isInDrag', true);
            jQuery(ui).attr('startPos', jQuery(ui).index());

            jQuery.sap.log.info('startPos - ' + jQuery(ui).index());
            setTimeout(function () {
                sap.ui.getCore().getEventBus().publish("launchpad", "sortableStart");
            }, 0);

            //scroll to group
            groupsTop = jQuery("#dashboardGroups").offset().top;
            groupPlaceholder = jQuery(".sapUshellDashboardGroupsContainerItem-placeholder").offset().top;
            groupClone = jQuery(".sapUshellDashboardGroupsContainerItem-clone").offset().top;
            scrollY = groupPlaceholder - groupsTop - groupClone;
            jQuery('.sapUshellDashboardView section').animate({scrollTop : scrollY}, 0);

        },
        _handleGroupsUIStart : function (evt, ui) {
            jQuery(ui).find(".sapUshellTileContainerContent").css("outline-color", "transparent");
        },

        _handleGroupDrop : function (evt, ui) {

            var oBus = sap.ui.getCore().getEventBus(),
                jQueryObj = jQuery(ui),
                firstChildId = jQuery(jQueryObj.children()[0]).attr("id"),
                oGroup = sap.ui.getCore().byId(firstChildId),
                oDashboardGroups = sap.ui.getCore().byId("dashboardGroups"),
                oData = {group : oGroup, groupChanged : false, focus : false},
                nNewIndex = jQueryObj.index();

            jQueryObj.startPos = window.parseInt(jQueryObj.attr('startPos'), 10);
            oDashboardGroups.removeAggregation('groups', oGroup, true);
            oDashboardGroups.insertAggregation('groups', oGroup, nNewIndex, true);

            this._handleGroupMoved(evt, {item : jQueryObj});
            jQueryObj.removeAttr('startPos');
            sap.ui.getCore().getEventBus().publish("launchpad", "sortableStop");

            // avoid tile to be clicked after group was dropped
            setTimeout(function () {
                jQuery(".sapUshellContainerHeaderActions").removeClass("sapUshellTileContainerHidden");
                jQuery(".sapUshellTileContainerBeforeContent").removeClass("sapUshellTileContainerHidden");
                jQuery(".sapUshellTileContainerBeforeContent").removeClass("sapUshellTileContainerRemoveContent");
                jQuery(".sapUshellTileContainerAfterContent").removeClass("sapUshellTileContainerRemoveContent");
                jQuery(".sapUshellTilesContainer-sortable").removeClass("sapUshellTileContainerRemoveContent");
                jQuery(".sapUshellLineModeContainer, .sapUshellLinksContainer").removeClass("sapUshellTileContainerRemoveContent");
            }, 0);

            window.setTimeout(jQuery.proxy(oBus.publish, oBus, "launchpad", "scrollToGroup", oData), 1);
            this.oTileUIActions.enable();
            if (this.oLinkUIActions) {
              this.oLinkUIActions.enable();
            }
        },
        _handleGroupMoved : function (evt, ui) {
            var fromIndex = ui.item.startPos,
                toIndex = ui.item.index(),
                oModel = this.oController.getView().getModel();

            if (toIndex !== -1) {
                this.oController._publishAsync("launchpad", "moveGroup", {
                    fromIndex  : fromIndex,
                    toIndex    : toIndex
                });
                setTimeout(function () {
                    oModel.setProperty('/isInDrag', false);
                }, 100);
            }
        },
        // **************************** Group UIActions functions - End ****************************
        // *****************************************************************************************

        _setController : function (oController) {
            this.oController = oController;
        }
    });


	return DashboardUIActions;

});
},
	"sap/ushell/components/flp/launchpad/group_list/GroupList.controller.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap, console, window, $ */
    /*jslint plusplus: true, nomen: true*/

    sap.ui.controller("sap.ushell.components.flp.launchpad.group_list.GroupList", {
        onInit : function () {
            this.sViewId = "#" + this.getView().getId();
            this.sGroupListId = "#" + this.getView().oGroupList.getId();
            this.handleScroll = this._fHandleScroll.bind(this);
        },
        onAfterRendering : function () {
            this.jqView = jQuery(this.sViewId);
            this.jgGroupList = jQuery(this.sGroupListId);

            var oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.unsubscribe("grouplist", "ScrollAnimationEnd", this._handleScrollAnimationEnd, this);
            oEventBus.subscribe("grouplist", "ScrollAnimationEnd", this._handleScrollAnimationEnd, this);
            oEventBus.unsubscribe("grouplist", "DashboardRerender", this._addScroll, this);
            oEventBus.subscribe("grouplist", "DashboardRerender", this._addScroll, this);
            oEventBus.unsubscribe("launchpad", "dashboardScroll", this.handleScroll, this);
            oEventBus.subscribe("launchpad", "dashboardScroll", this.handleScroll, this);

            this._addScroll();
        },

        _addScroll : function () {
            var that = this;

            //setTimeout is required because for some reason the event handler is not called when 'scroll' event is fired
            setTimeout(function () {
                this.dashboardElement = document.querySelector(".sapUshellDashboardView section");
                if (this.dashboardElement) {
                    this.dashboardElement.removeEventListener('scroll', that.handleScroll);
                    this.dashboardElement.addEventListener('scroll', that.handleScroll);
                }
            }.bind(this), 0);
        },

        _fHandleScroll : function () {
            var oModel = this.getView().getModel(),
                iTopViewPortGroupIndex = oModel.getProperty("/topGroupInViewPortIndex");

            // If scroll handler was called while performing a scroll-to-group action -
            // then nothing should be done except for tiles visibility calculation
            if (!oModel.getProperty("/scrollingToGroup")) {
                if (!oModel.getProperty("/groupList-skipScrollToGroup")) {
                    var groupItems = jQuery('#groupList li.sapUshellGroupLI');
                    var selectedGroupListItem = groupItems.removeClass('sapUshellSelected').eq(iTopViewPortGroupIndex);
                    selectedGroupListItem.addClass('sapUshellSelected');
                    var groupListScrollElement = document.getElementById('groupListPage-cont');
                    var groupListScrollTop = groupListScrollElement.scrollTop;
                    var groupListScrollBottom = groupListScrollTop + groupListScrollElement.offsetHeight;
                    var groupOffsetTop = selectedGroupListItem[0] ? selectedGroupListItem[0].offsetTop : undefined;
                    if (groupOffsetTop < groupListScrollTop) {
                        jQuery('#groupListPage section').animate({scrollTop: groupItems[iTopViewPortGroupIndex].offsetTop}, 0);
                    } else if (groupOffsetTop + selectedGroupListItem[0].offsetHeight > groupListScrollBottom) {
                        jQuery('#groupListPage section').animate({scrollTop: groupListScrollTop + groupItems[iTopViewPortGroupIndex].offsetHeight}, 0);
                    }
                }
                sap.ushell.utils.handleTilesVisibility();
            }
        },

        _handleGroupListItemPress : function (oEvent) {
            var oSource = oEvent.getSource(),
                focus;

            //to support accessibility tab order we set focus in press in case edit mode is off
            focus = oEvent.getParameter("action") === "sapenter";
            this._handleScrollToGroup(oSource, false, focus);
        },

        _handleScrollToGroup : function (oGroupItem, groupChanged, focus) {
            if (!oGroupItem) {
                return;
            }
            var that = this;
            document.querySelector(".sapUshellDashboardView").removeEventListener('scroll', that.handleScroll);

            this._publishAsync("launchpad", "scrollToGroup", {
                group : oGroupItem,
                groupChanged : groupChanged,
                focus : focus
            });
        },

        _handleScrollAnimationEnd : function () {
            var that = this;
            document.querySelector(".sapUshellDashboardView").addEventListener('scroll', that.handleScroll);
            this.getView().getModel().setProperty("/scrollingToGroup", false);
        },

        _publishAsync : function (sChannelId, sEventId, oData) {
            var oBus = sap.ui.getCore().getEventBus();
            window.setTimeout($.proxy(oBus.publish, oBus, sChannelId, sEventId, oData), 1);
        }
    });


}, /* bExport= */ true);
},
	"sap/ushell/components/flp/launchpad/group_list/GroupList.view.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(['sap/ui/core/IconPool','sap/ushell/ui/launchpad/GroupListItem', 'sap/ushell/override'],
	function(IconPool, GroupListItem, override) {
	"use strict";

    /*global jQuery, sap, document */
    /*jslint plusplus: true, nomen: true */

    sap.ui.jsview("sap.ushell.components.flp.launchpad.group_list.GroupList", {
        createContent: function (oController) {
            this.parentComponent = sap.ui.core.Component.getOwnerComponentFor(this);
            this.oModel = this.parentComponent.getModel();
            var that = this,
                oGroupListItemTemplate = this._getGroupListItemTemplate(oController);
            this.bAnimate = sap.ui.Device.system.desktop;
            this.isTouch = !sap.ui.Device.system.desktop;
            this.oGroupList = new sap.m.List("groupListItems", {
                items : {
                    path     : "/groups",
                    template : oGroupListItemTemplate
                }
            }).addStyleClass("sapUshellGroupItemList");
            //This two functions overwrite methods from ListBase class
            // to avoid unpredicted behavior with F6
            jQuery.extend(this.oGroupList, {
                onsapskipforward: function (oEvent) {
                    oEvent.preventDefault();
                    sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                    sap.ushell.components.flp.ComponentKeysHandler.goToTileContainer(oEvent);
                },
                onsapskipback: function (oEvent) {
                    oEvent.preventDefault();
                    sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                    sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                },
                onsaptabprevious: function (oEvent) {
                    oEvent.preventDefault();
                    sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                    sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                }
            });

            this.oGroupList.onAfterRendering = function () {
                //set not as large element for F6 keyboard navigation
                this.data("sap-ui-fastnavgroup", "false", false);
                jQuery("#groupListFooter").attr("data-sap-ui-fastnavgroup", "false");

                that.oController.handleScroll();
            };
            this.oGroupList.updateItems = override.updateAggregatesFactory("items");

            if (this.getViewData().enablePersonalization === undefined || this.getViewData().enablePersonalization !== false) {
                this.oActionList = new sap.m.List({
                    items : [ ]
                });

                /*
                 override original onAfterRendering as currently sap.m.List
                 does not support afterRendering handler in the constructor
                 this is done to support tab order accessibility
                 */
                var origOpenCatalogListOnAfterRendering = this.oActionList.onAfterRendering;
                this.oActionList.onAfterRendering = function (oEvent) {
                    origOpenCatalogListOnAfterRendering.call(this, oEvent);
                };

                var groupListFooter = new sap.m.Bar({
                    id: "groupListFooter",
                    contentMiddle: [this.oActionList]
                });
                groupListFooter.addStyleClass("sapUshellPersonalizationOn");

                this.groupListPage = new sap.m.Page({
                    id: "groupListPage", // sap.ui.core.ID
                    showHeader: false,
                    showFooter: true,
                    content: [this.oGroupList]
                });
                this.groupListPage.addStyleClass("sapUshellPersonalizationOn");
            } else {
                this.groupListPage = new sap.m.Page({
                    id: "groupListPage", // sap.ui.core.ID
                    showHeader: false,
                    showFooter: false,
                    content: [this.oGroupList] // sap.ui.core.Control
                });
            }
            this.addStyleClass("sapUshellGroupList");

            return [this.groupListPage];
        },
        _getGroupListItemTemplate : function (oController) {
            var fOnAfterRenderingHandler = function (oEvent) {
                var xRayEnabled = this.getModel() && this.getModel().getProperty('/enableHelp');
                if (this.getDefaultGroup()) {
                    this.addStyleClass("sapUshellDefaultGroupItem");
                    // if xRay is enabled
                    if (xRayEnabled) {
                        this.addStyleClass("help-id-homeGroupListItem"); //xRay help ID
                    }
                } else {
                    this.addStyleClass("sapUshellGroupListItem");
                    // if xRay is enabled
                    if (xRayEnabled) {
                        this.addStyleClass("help-id-groupListItem"); //xRay help ID
                    }
                }

                jQuery(this.getDomRef()).attr("tabindex", "0");
            };

            return new GroupListItem({
                index : "{index}",
                title : "{title}",
                tooltip : "{title}",
                defaultGroup : "{isDefaultGroup}",
                groupId : "{groupId}",
                numberOfTiles : "{tiles/length}",
                afterRendering : fOnAfterRenderingHandler,
                isGroupVisible: "{isGroupVisible}",
                press : [ function (oEvent) {
                    this._handleGroupListItemPress(oEvent);
                }, oController ],
                visible: {
                    parts: ["/tileActionModeActive", "isGroupVisible", "visibilityModes"],
                    formatter: function (tileActionModeActive, isGroupVisible, visibilityModes) {
                        //Empty groups should not be displayed when personalization is off or if they are locked or default group not in action mode
                        if (!visibilityModes[tileActionModeActive ? 1 : 0]) {
                            return false;
                        }
                        return isGroupVisible || tileActionModeActive;
                    }
                }
            });
        },

        getControllerName: function () {
            return "sap.ushell.components.flp.launchpad.group_list.GroupList";
        }
    });


}, /* bExport= */ true);
},
	"sap/ushell/components/flp/settings/FlpSettings.controller.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("sap.ushell.components.flp.settings.FlpSettings", {

        /* enum */ DISPLAY_MODES: { 
            'scroll': 0, 'tabs': 1,
        
            getName: function (iValue) {
                return Object.keys(this)[iValue];
            }
        },

        onInit: function () {
            // Set configuration.
            this.oConfModel = new sap.ui.model.json.JSONModel({});

            this.oConfModel.setData({
                isRTL: sap.ui.getCore().getConfiguration().getRTL(),
                flexAlignItems: sap.ui.Device.system.phone ? 'Stretch' : 'Start',
                textAlign: sap.ui.Device.system.phone ? 'Begin' : 'End',
                textDirection: sap.ui.Device.system.phone ? 'Column' : 'Row',
                labelWidth: sap.ui.Device.system.phone ? "auto" : "12rem"
            });

            this.getView().setModel(this.oConfModel, "config");

            // Set translation.
            var oResourceModel = new sap.ui.model.resource.ResourceModel({
                bundleUrl: jQuery.sap.getModulePath(
                    "sap.ushell.renderers.fiori2.resources.resources",
                    ".properties"
                )
            });

            this.getView().setModel(oResourceModel, "i18n");

            // Set initial group display mode.
            var initModeName = this.getView().getViewData().initialDisplayMode;
            this.iCurrentMode = this.DISPLAY_MODES[initModeName] || this.DISPLAY_MODES.scroll;
        },

        onBeforeRendering: function () {
            this.oConfModel.setProperty("/displayMode", this.iCurrentMode);
        },

        onSave: function() {
            this.iCurrentMode = this.oConfModel.getProperty("/displayMode");
            return this.DISPLAY_MODES.getName(this.iCurrentMode);
        }
    });
});

},
	"sap/ushell/components/flp/settings/FlpSettings.view.xml":'<View controllerName="sap.ushell.components.flp.settings.FlpSettings"\n      width="100%"\n      xmlns:m="sap.m">\n\n    <m:VBox visible="true" class="sapUiSmallMargin">\n        <m:items>\n            <m:HBox>\n                <m:items>\n                    <m:Label text="{i18n>AnchorBarLabel}:"\n                             class="sapUshellFlpSettingsLabel"\n                             width="{config>/labelWidth}"\n                             textAlign="{config>/textAlign}"/>\n\n                    <m:VBox>\n                        <m:items>\n                            <m:RadioButtonGroup selectedIndex="{config>/displayMode}">\n                                <m:buttons>\n                                    <m:RadioButton text="{i18n>anchorBarScrollMode}" class="sapUshellAnchorBarScrollMode"/>\n                                    <m:RadioButton text="{i18n>anchorBarTabMode}" class="sapUshellAnchorBarTabsMode"/>\n                                </m:buttons>\n                            </m:RadioButtonGroup>\n                            <m:VBox class ="sapUshellFlpSettingsDescriptionBorder">\n                                <m:items>\n                                    <m:Text text="{i18n>homePageGroupDisplayDescriptionText}" class="sapUshellFlpSettingsDescription" />\n                                    <!-- second paragraph will be shown only if the user has edit option for his dashboard -->\n                                    <m:Text text="{i18n>homePageGroupDisplayDescriptionText_secondParagraph}"\n                                            class="sapUshellFlpSettingsDescription"\n                                            visible="false"/>\n                                </m:items>\n                            </m:VBox>\n                        </m:items>\n                    </m:VBox>\n                </m:items>\n            </m:HBox>\n        </m:items>\n    </m:VBox>\n</View>'
}});
