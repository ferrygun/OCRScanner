// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define([
], function () {
/**
 * Reading apps data from all the data_sources/providers and updating AllMyApps model.
 *
 * loadAppsData is the main function that is responsible for reading apps data from all data_sources/providers,
 *  using the following functionality:
 * - _handleGroupsData - Reading groups data
 * - _handleExternalProvidersData - Reading external_providers data
 * - _addCatalogToModel - Reading catalogs data
 */
    "use strict";
    var AllMyAppsManager = function () {};

    AllMyAppsManager.prototype.loadAppsData = function (oModel, oPopoverObject, loadCatalogs) {
        var oAllMyAppsService = sap.ushell.Container.getService("AllMyApps");

        this.oPopover = oPopoverObject;
        if (!oAllMyAppsService.isEnabled()) {
            return;
        }

        this.iNumberOfProviders = 0;
        this.oModel = oModel;

        if (oAllMyAppsService.isHomePageAppsEnabled()) {
            this._handleGroupsData();
        }

        if (oAllMyAppsService.isExternalProviderAppsEnabled()) {
            this._handleExternalProvidersData(oModel);
        }

        if (oAllMyAppsService.isCatalogAppsEnabled()) {
            this._handleCatalogs(loadCatalogs);
        }
    };

    AllMyAppsManager.prototype._handleGroupsData = function () {
        var that = this,
            oGroupsDataPromise = this._getGroupsData(),
            oHomeModelEntry = {
                title : sap.ushell.resources.i18n.getText("allMyApps_homeEntryTitle")
            },
            aProvidersArray;

        // Get groups apps
        oGroupsDataPromise.done(function (oGroupsArray) {
            oHomeModelEntry.groups = oGroupsArray;
            oHomeModelEntry.type = sap.ushell.Container.getService("AllMyApps").getProviderTypeEnum().HOME;

            if (oGroupsArray.length === 0) {
                return;
            }

            // Home (groups) provider should be at the 1st place in the providers list, hence we use array unshift in order to put it at index 0
            aProvidersArray = that.oModel.getProperty("/AppsData");
            aProvidersArray.unshift(oHomeModelEntry);
            that.oModel.setProperty("/AppsData", aProvidersArray);
            that.iNumberOfProviders += 1;

            //Publish event all my apps finished loading.
            var oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.publish("launchpad", "allMyAppsMasterLoaded");
        });
    };

    AllMyAppsManager.prototype._getGroupsData = function () {
        var that = this,
            oLaunchPageService = sap.ushell.Container.getService("LaunchPage"),
            oDeferred = new jQuery.Deferred(),
            oGroupsPromise = oLaunchPageService.getGroups(),
            oDefaultGroupPromise = oLaunchPageService.getDefaultGroup(),
            aPromises = [],
            oGroupsFormattedData = [],
            iGroupIndex,
            oTempGroup,
            oTempNewGroup,
            sGroupTitle,
            aTilesArray,
            iTileIndex,
            oTempTile,
            oApp,
            iNumberCustomTiles;

        that.oDefaultGroup = undefined;
        aPromises.push(oDefaultGroupPromise);
        aPromises.push(oGroupsPromise);

        // Waiting until the following two calls to LAunchPage service will succeed:
        // - getGroups
        // - getDefaultGroup
        jQuery.when(aPromises).then(function (args) {
            aPromises[0].done(function (oDefaultGroupFromService) {
                that.oDefaultGroup = oDefaultGroupFromService;
            });
            // oLaunchPageService.getGroups done handler
            aPromises[1].done(function (oGroupsArray) {
                for (iGroupIndex = 0; iGroupIndex < oGroupsArray.length; iGroupIndex++) {
                    iNumberCustomTiles = 0;
                    // @TODO What about hidden groups?  => isGroupVisible(group) === true
                    oTempGroup = oGroupsArray[iGroupIndex];
                    if (oLaunchPageService.isGroupVisible(oTempGroup) === false) {
                        continue;
                    }
                    // The default group gets "My Home" title
                    if (oLaunchPageService.getGroupId(oTempGroup) === oLaunchPageService.getGroupId(that.oDefaultGroup)) {
                        sGroupTitle = sap.ushell.resources.i18n.getText("my_group");
                    } else {
                        sGroupTitle = oLaunchPageService.getGroupTitle(oTempGroup);
                    }
                    oTempNewGroup = {};
                    oTempNewGroup.title = sGroupTitle;
                    oTempNewGroup.apps = [];

                    aTilesArray = oLaunchPageService.getGroupTiles(oTempGroup);
                    for (iTileIndex = 0; iTileIndex < aTilesArray.length; iTileIndex++) {
                        oTempTile = aTilesArray[iTileIndex];
                        if (oLaunchPageService.isTileIntentSupported(oTempTile)) {
                            oApp = that._getAppEntityFromTile(oTempTile);
                            if (oApp) {
                                oTempNewGroup.apps.push(oApp);
                            } else {
                                // if this is not an app this is a custom tile.
                                iNumberCustomTiles++;
                            }
                        }
                    }
                    oTempNewGroup.numberCustomTiles = iNumberCustomTiles;
                    if (iNumberCustomTiles === 1) {
                        oTempNewGroup.sCustomLabel = sap.ushell.resources.i18n.getText("allMyApps_customStringSingle");
                        oTempNewGroup.sCustomLink = sap.ushell.resources.i18n.getText("allMyApps_customLinkHomePageSingle");
                    } else {
                        oTempNewGroup.sCustomLabel = sap.ushell.resources.i18n.getText("allMyApps_customString", [iNumberCustomTiles]);
                        oTempNewGroup.sCustomLink = sap.ushell.resources.i18n.getText("allMyApps_customLinkHomePage");
                    }
                    oTempNewGroup.handlePress = function (ev, oData) {
                        hasher.setHash("#Shell-home");
                        // Close the popover on navigation (it should be explicitly closed when navigating with the same hash)
                        this.oPopover.close();
                        var oBus = sap.ui.getCore().getEventBus();

                        //This is in the case of cold start
                        oBus.subscribe("launchpad", "dashboardModelContentLoaded", function () {
                            oBus.publish("launchpad", "scrollToGroupByName", {
                                groupName: oData.title,
                                isInEditTitle: false
                            });
                        }, this);

                        //Try to open in case we are not in cold start
                        oBus.publish("launchpad", "scrollToGroupByName", {
                            groupName: oData.title,
                            isInEditTitle: false
                        });
                    }.bind(that);
                    if (oTempNewGroup.apps.length > 0 || oTempNewGroup.numberCustomTiles > 0) {
                        oGroupsFormattedData.push(oTempNewGroup);
                    }
                }
                oDeferred.resolve(oGroupsFormattedData);
            });
        });
     /*   oGroupsPromise.fail(function (sMsg) {
            oDeferred.reject();
        });*/
        return oDeferred.promise();
    };

    AllMyAppsManager.prototype._handleExternalProvidersData = function () {
        var that = this,
            oExternalProviders = sap.ushell.Container.getService("AllMyApps").getDataProviders(),
            aExtarnalProvidersIDs = Object.keys(oExternalProviders),
            sExternalProviderId,
            oExternalProvider,
            sExternalProviderTitle,
            oExternalProviderModelEntry,
            index,
            oExternalProviderPromise;

        // Get external providers apps
        if (aExtarnalProvidersIDs.length > 0) {
            for (index = 0; index < aExtarnalProvidersIDs.length; index++) {
                sExternalProviderId = aExtarnalProvidersIDs[index];
                oExternalProvider = oExternalProviders[sExternalProviderId];
                sExternalProviderTitle = oExternalProvider.getTitle();
                oExternalProviderModelEntry = {};
                oExternalProviderModelEntry.title = sExternalProviderTitle;
                oExternalProviderPromise = oExternalProvider.getData();
                oExternalProviderPromise.done(function (aProviderDataArray) {
                    // If the promise for data is resolved valid array of at least one group
                    if (aProviderDataArray && (aProviderDataArray.length > 0)) {
                        oExternalProviderModelEntry.groups = aProviderDataArray;
                        oExternalProviderModelEntry.type = sap.ushell.Container.getService("AllMyApps").getProviderTypeEnum().EXTERNAL;
                        that.oModel.setProperty("/AppsData/" + that.iNumberOfProviders, oExternalProviderModelEntry);
                        that.iNumberOfProviders += 1;
                        //Publish event all my apps finished loading.
                        var oEventBus = sap.ui.getCore().getEventBus();
                        oEventBus.publish("launchpad", "allMyAppsMasterLoaded");
                    }
                });
            }
        }
    };

    AllMyAppsManager.prototype._handleNotFirstCatalogsLoad = function () {
        var oModel = this.oModel.getProperty("/AppsData"),
            sCatalogProvider = sap.ushell.Container.getService("AllMyApps").getProviderTypeEnum().CATALOG;
        if (oModel.length && oModel[oModel.length - 1].type === sCatalogProvider) {
          this.bFirstCatalogLoaded = true;
          sap.ui.getCore().getEventBus().publish("launchpad", "allMyAppsFirstCatalogLoaded", {bFirstCatalogLoadedEvent: true});
        }
    };

    AllMyAppsManager.prototype._handleCatalogs = function (loadCatalogs) {
        if(!loadCatalogs) {
            this._handleNotFirstCatalogsLoad();
        } else {
            this.bFirstCatalogLoaded = false;
            // Array of promise objects that are generated inside addCatalogToModel (the "progress" function of getCatalogs)
            this.aPromises = [];
            // Get catalog apps
            sap.ushell.Container.getService("LaunchPage").getCatalogs()
                // There's a need to make sure that onDoneLoadingCatalogs is called only after all catalogs are loaded
                // (i.e. all calls to addCatalogToModel are finished).
                // For this, all the promise objects that are generated inside addCatalogToModel are generated into this.aPromises,
                // and jQuery.when calls onDoneLoadingCatalogs only after all the promises are resolved
                .done(function (catalogs) {
                    jQuery.when.apply(jQuery, this.aPromises).then(this._onDoneLoadingCatalogs.bind(this));
                }.bind(this))
                //in case of a severe error, show an error message
                .fail(function (args) {
                    this._onGetCatalogsFail(sap.ushell.resources.i18n.getText("fail_to_load_catalog_msg"));
                }.bind(this))
                //for each loaded catalog, add it to the model
                .progress(this._addCatalogToModel.bind(this));
            var oAllMyAppsService = sap.ushell.Container.getService("AllMyApps");
            if (!oAllMyAppsService.isHomePageAppsEnabled()) {
                //Publish event all my apps finished loading.
                var oEventBus = sap.ui.getCore().getEventBus();
                oEventBus.publish("launchpad", "allMyAppsMasterLoaded");
            }

          }
    };

    AllMyAppsManager.prototype._addCatalogToModel = function (oCatalog) {
        var oProviderModelEntry = {
                apps : [],
                numberCustomTiles: 0,
                type: sap.ushell.Container.getService("AllMyApps").getProviderTypeEnum().CATALOG
            },
            that = this,
            aProviders,
            iProvidersIndex,
            index,
            oApp,
            oLaunchPageService = sap.ushell.Container.getService("LaunchPage"),
            oCatalogTilesPromise = oLaunchPageService.getCatalogTiles(oCatalog);

        this.aPromises.push(oCatalogTilesPromise);
        oCatalogTilesPromise.done(function (aCatalogTiles) {
            if (aCatalogTiles.length === 0) {
                return;
            }
            //find if catalog with the same name alreay exsists.
            var sCatalogName = oLaunchPageService.getCatalogTitle(oCatalog);

            aProviders = that.oModel.getProperty("/AppsData");
            for (iProvidersIndex = 0; iProvidersIndex < aProviders.length; iProvidersIndex++) {
                if ((aProviders[iProvidersIndex].type === sap.ushell.Container.getService("AllMyApps").getProviderTypeEnum().CATALOG) && (aProviders[iProvidersIndex].title === sCatalogName)) {
                    //if not create a new catalog entry.
                    oProviderModelEntry = aProviders[iProvidersIndex];
                    break;
                }
            }

            //add the attributes and tile for the catalog.
            oProviderModelEntry.title = oLaunchPageService.getCatalogTitle(oCatalog);
            for (index = 0; index < aCatalogTiles.length; index++) {
                if (oLaunchPageService.isTileIntentSupported(aCatalogTiles[index])) {
                    oApp = that._getAppEntityFromTile(aCatalogTiles[index]);
                    if (oApp) {
                        oProviderModelEntry.apps.push(oApp);
                    } else {
                        // if this is not an app this is a custom tile.
                        oProviderModelEntry.numberCustomTiles++;
                    }
                }
            }

            if (oProviderModelEntry.numberCustomTiles === 1) {
                oProviderModelEntry.sCustomLabel = sap.ushell.resources.i18n.getText("allMyApps_customStringSingle");
                oProviderModelEntry.sCustomLink = sap.ushell.resources.i18n.getText("allMyApps_customLinkAppFinderSingle");
            } else {
                oProviderModelEntry.sCustomLabel = sap.ushell.resources.i18n.getText("allMyApps_customString", [oProviderModelEntry.numberCustomTiles]);
                oProviderModelEntry.sCustomLink = sap.ushell.resources.i18n.getText("allMyApps_customLinkAppFinder");
            }

            oProviderModelEntry.handlePress = function (ev, oData) {
                // Close the popover on navigation (it should be explicitly closed when navigating with the same hash)
                this.oPopover.close();
                hasher.setHash("#Shell-home&/appFinder/catalog/" + JSON.stringify({
                    catalogSelector: oData.title,
                    tileFilter: "",
                    tagFilter: "[]",
                    targetGroup: ""
                }));
            }.bind(that);

            // Add the catalog to the model as a data-source/provider only if it includes at least one app
            if (oProviderModelEntry.apps.length > 0 || oProviderModelEntry.numberCustomTiles > 0) {
                that.oModel.setProperty("/AppsData/" + iProvidersIndex, oProviderModelEntry);
                if (that.bFirstCatalogLoaded === false) {
                    sap.ui.getCore().getEventBus().publish("launchpad", "allMyAppsFirstCatalogLoaded", {bFirstCatalogLoadedEvent: true});
                    that.bFirstCatalogLoaded = true;
                }
                that.iNumberOfProviders += 1;
            }
        });
    };

    AllMyAppsManager.prototype._onGetCatalogsFail = function (sMessage) {
        sap.ushell.Container.getService('Message').show(sap.ushell.services.Message.Type.INFO, sMessage);
    };

    AllMyAppsManager.prototype._onDoneLoadingCatalogs = function () {
        var oEventBus = sap.ui.getCore().getEventBus();

        if (!this.bFirstCatalogLoaded) {
            oEventBus.publish('launchpad', 'allMyAppsNoCatalogsLoaded');
        }
    };

    AllMyAppsManager.prototype._getAppEntityFromTile = function (oCatlaogTile) {
        var oApp,
            oLaunchPageService = sap.ushell.Container.getService("LaunchPage"),
            sTileTitle = oLaunchPageService.getCatalogTilePreviewTitle(oCatlaogTile),
            sTileSubTitle = oLaunchPageService.getCatalogTilePreviewSubtitle(oCatlaogTile),
            sTileUrl = oLaunchPageService.getCatalogTileTargetURL(oCatlaogTile);

        // If the tile has a valid url and either title or subtitle
        if (sTileUrl && (sTileTitle || sTileSubTitle)) {
            oApp = {};
            oApp.url = sTileUrl;
            if (sTileTitle) {
                oApp.title = sTileTitle;
                oApp.subTitle = sTileSubTitle;
            } else {
                oApp.title = sTileSubTitle;
            }
            return oApp;
        }
    };

    return new AllMyAppsManager();
},/* bExport= */true);
