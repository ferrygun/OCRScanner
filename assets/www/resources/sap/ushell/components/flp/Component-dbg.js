// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
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
