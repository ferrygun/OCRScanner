// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * The controller of AllMyApps MVC.<br>
 */

sap.ui.define([
    'sap/ushell/renderers/fiori2/allMyApps/AllMyAppsManager'
], function (AllMyAppsManager) {

    "use strict";
    /*global jQuery, sap, console, hasher, window*/
    /*jslint plusplus: true, nomen: true*/

    var bSingleDataSource = false,
        KeyboardNavigation = function (oView) {
            this.init(oView);
        };

    sap.ui.controller("sap.ushell.renderers.fiori2.allMyApps.AllMyApps", {

        // States of the Master area list, including DETAILS state for phone use-case
        oStateEnum : {
            FIRST_LEVEL : 0,
            SECOND_LEVEL : 1,
            DETAILS : 2,
            FIRST_LEVEL_SPREAD : 3
        },
        iNumberOfProviders : 0,

        /**
         * Initializing AllMyApps model, that will include apps data from the different providers
         */
        onInit: function () {
            this.bFirstLoadOfAllMyApps = true;
            var oAllMyAppsModel = new sap.ui.model.json.JSONModel();

            oAllMyAppsModel.setProperty("/AppsData", []);
            this.getView().setModel(oAllMyAppsModel, 'allMyAppsModel');

            sap.ui.getCore().getEventBus().subscribe("launchpad", "allMyAppsFirstCatalogLoaded", this.updateMasterFocusAndDetailsContext, this);
            sap.ui.getCore().getEventBus().subscribe("launchpad", "allMyAppsFirstCatalogLoaded", this.onDetailLoad, this);
            sap.ui.getCore().getEventBus().subscribe("launchpad", "allMyAppsMasterLoaded", this.onMasterLoad, this);
            sap.ui.getCore().getEventBus().subscribe("launchpad", "allMyAppsNoCatalogsLoaded", this.onNoCatalogsLoaded, this);
        },

        onExit: function () {
            sap.ui.getCore().getEventBus().unsubscribe("launchpad", "allMyAppsFirstCatalogLoaded", this.updateMasterFocusAndDetailsContext);
            sap.ui.getCore().getEventBus().unsubscribe("launchpad", "allMyAppsFirstCatalogLoaded", this.onDetailLoad, this);
            sap.ui.getCore().getEventBus().unsubscribe("launchpad", "allMyAppsMasterLoaded", this.onMasterLoad, this);
            sap.ui.getCore().getEventBus().unsubscribe("launchpad", "allMyAppsNoCatalogsLoaded", this.onNoCatalogsLoaded, this);
        },

        /**
         * Loads apps data (that needs to be updated each time AllMyapps UI is opened)
         * and switches the UI to the initial state
         */
        onAfterRendering: function () {
            var that = this,
                oView = this.getView(),
                oAllMyAppsModel = oView.getModel("allMyAppsModel"),
                oSplitApp = oView.oSplitApp;

            //Show busy indicator only upon initial loading of "AllMyApps".
            if (!this.bAfterInitialLoading) {
                oSplitApp.toMaster("allMyAppsMasterBusyIndicator", "show");
                //On "Phones" the sap.m.SplitApp displays only Detail or Master context at once.
                //Consequently, calling 'toDetail' on phones changes also the context to the Detail and this should be avoided.
                if (!sap.ui.Device.system.phone) {
                    oSplitApp.toDetail("allMyAppsDetailBusyIndicator", "show");
                }
            }
            if (this.bFirstLoadOfAllMyApps) {
              oAllMyAppsModel.setProperty("/AppsData", []);
            } else {
                var oModel = oAllMyAppsModel.getProperty("/AppsData");
                var oAllMyAppsService = sap.ushell.Container.getService("AllMyApps");
                if (oAllMyAppsService.isHomePageAppsEnabled()) {
                    oModel.splice(0, 1)
                }
              oAllMyAppsModel.setProperty("/AppsData", oModel);
            }

            setTimeout(function () {
                that._getAllMyAppsManager().loadAppsData(oAllMyAppsModel, that._getPopoverObject(), that.bFirstLoadOfAllMyApps);
                bSingleDataSource = that._isSingleDataSource();
                that.switchToInitialState();
                that.bFirstLoadOfAllMyApps = false;
            }, 100);
        },

        /******************************************************************************************************************/
        /********************************************* State handling - Begin *********************************************/

        /**
         * Setting the state of AllMyApps to the initial state.
         *
         * Called in two cases:
         * - After rendering
         * - Clicking back button when in SECOND_LEVEL
         *
         * The function performs the following:
         *  - allMyAppsMasterLevel should be set to either FIRST_LEVEL of FIRST_LEVEL_SPREAD
         *  - The list is bound to the correct context
         *  - Focus and list-selection should be placed on the first item in the master (providers) list
         *  - The first catalog's apps/tiles/items should be presented in the details area
         *  - Popover title set to the default one
         *  - Back button visibility is set according to the ShellAppTitle state
         */
        switchToInitialState: function () {
            var oView = this.getView(),
                oShellModel = oView.getModel(),
                oBackButton,
                oSplitApp,
                oSplitAppCurrentPage,
                oShellAppTitleState = oView.getModel().getProperty("/ShellAppTitleState");

            if (this._isSingleDataSource()) {
                oShellModel.setProperty('/allMyAppsMasterLevel', this.oStateEnum.FIRST_LEVEL_SPREAD);

                // Bind the master area list to the groups level of the single provider
                // (i.e. the data_sources/single_provider/groups array) in the model
                oView.oDataSourceList.bindItems("allMyAppsModel>/AppsData/0/groups", oView.oDataSourceListTemplate);
            } else {
                oShellModel.setProperty('/allMyAppsMasterLevel', this.oStateEnum.FIRST_LEVEL);

                // Bind the master area list to the first level (i.e. the data_sources/providers array) in the model
                oView.oDataSourceList.bindItems("allMyAppsModel>/AppsData", oView.oDataSourceListTemplate);
            }

            if (sap.ui.Device.system.phone) {
                oSplitApp = this.getView().oSplitApp;
                oSplitApp.toMaster("sapUshellAllMyAppsMasterPage", "show");
            }

            // Re-render the list before calculating the item on which the focus (and list selection) should be placed
            oView.oDataSourceList.rerender();

            this.updateMasterFocusAndDetailsContext(undefined, undefined, {bFirstCatalogLoadedEvent : true});
            this._getPopoverHeaderLabel().setText(sap.ushell.resources.i18n.getText("allMyApps_headerTitle"));

            oBackButton = this._getPopoverHeaderBackButton();
            if (oShellAppTitleState === this._getShellAppTitleStateEnum().ALL_MY_APPS_ONLY) {
                oBackButton.setVisible(false);
            } else {
                oBackButton.setVisible(true);
            }
        },

        /**
         * Handling the move from details area (oShellAppTitleState = DETAILS) to master area on phone.
         *
         * Called in case of back button press
         *
         * The function performs the following:
         * - Call splitSpp control navigation to the master page
         * - Setting allMyAppsMasterLevel to one of the following:
         *   -- FIRST_LEVEL_SPREAD - if there is single data source
         *   -- FIRST_LEVEL - if the context of the selected item is of a data source (e.g. "/AppsData/2")
         *   -- SECOND_LEVEL - if the context of the selected item is of a second_level item (e.g. "/AppsData/2/groups/1")
         *  - Hide back button in cases of FIRST_LEVEL_SPREAD or FIRST_LEVEL, if ShellAppTitle state is ALL_MY_APPS_ONLY
         */
        handleSwitchToMasterAreaOnPhone : function () {
            var oSplitApp = this.getView().oSplitApp,
                oShellModel = this.getView().getModel(),
                sSelectedPath = this._getDataSourcesSelectedPath(),
                sPathArray = sSelectedPath.split('/'),
                oShellAppTitleState = this.getView().getModel().getProperty("/ShellAppTitleState"),
                oBackButton = this._getPopoverHeaderBackButton();

            oSplitApp.toMaster("sapUshellAllMyAppsMasterPage", "show");
            if (this._isSingleDataSource()) {
                oShellModel.setProperty('/allMyAppsMasterLevel', this.oStateEnum.FIRST_LEVEL_SPREAD);

                // Change back button visibility according to the state (should be invisible in case of ALL_MY_APPS_ONLY)
                if (oShellAppTitleState === this._getShellAppTitleStateEnum().ALL_MY_APPS_ONLY) {
                    oBackButton.setVisible(false);
                }
            } else if (sPathArray.length === 3) {
                oShellModel.setProperty('/allMyAppsMasterLevel', this.oStateEnum.FIRST_LEVEL);
                if (oShellAppTitleState === this._getShellAppTitleStateEnum().ALL_MY_APPS_ONLY) {
                    oBackButton.setVisible(false);
                }
            } else {
                oShellModel.setProperty('/allMyAppsMasterLevel', this.oStateEnum.SECOND_LEVEL);
            }
        },

        /**
         * Handling click action on an item in the master area.
         *
         * The function performs the following:
         * - In the that the clicked item is either a catalog or a group, it means that the details area content should be affected,
         *   hence handleMasterListItemPress_toDetails is called
         * - In the that the clicked item is a first_level item (not a catalog or a group) then the master list should switch to the second level
         *   hence handleMasterListItemPress_toSecondLevel is called
         *
         * - The bindingContext of the custom label and link in the details area are updated
         */
        handleMasterListItemPress: function (obj) {
            var sClickedDataSourcePath = this._getClickedDataSourceItemPath(obj),
                oView = this.getView(),
                oAllMyAppsModel = oView.getModel('allMyAppsModel'),
                oClickedObjectType = oAllMyAppsModel.getProperty(sClickedDataSourcePath + "/type"),
                oShellModel = oView.getModel(),
                oAllMyAppsLevel = oShellModel.getProperty('/allMyAppsMasterLevel'),
                bIsCatalog = (oClickedObjectType === sap.ushell.Container.getService("AllMyApps").getProviderTypeEnum().CATALOG),
                bIsPhoneWidth = oShellModel.getProperty('/isPhoneWidth'),
                oToggleBtn = this.getShellAppTitleToggleListButton(),
                oBindingContext;

            this.lastPressedMasterItem = obj.getParameter('listItem');
            if (bIsCatalog || (oAllMyAppsLevel === this.oStateEnum.FIRST_LEVEL_SPREAD) || (oAllMyAppsLevel === this.oStateEnum.SECOND_LEVEL)) {
                oBindingContext = this.handleMasterListItemPress_toDetails(obj);
            } else {
                oBindingContext = this.handleMasterListItemPress_toSecondLevel(obj);
            }

            oView.oCustomLabel.setBindingContext(oBindingContext, 'allMyAppsModel');
            oView.oCustomLink.setBindingContext(oBindingContext, 'allMyAppsModel');
            oView.oCustomPanel.setBindingContext(oBindingContext, 'allMyAppsModel');

            if (oToggleBtn.getVisible()) {
                oToggleBtn.firePress();
                oToggleBtn.setPressed(false);
                oToggleBtn.focus();
            }
        },

        /**
         * Handling master list switch to second level
         *
         * Called in case of press event on first level item which is either HOME or an external provider (not catalog or group)
         *
         * The function performs the following:
         * - Binding the context of the master list to the groups level on the clocked data source
         * - Setting allMyAppsMasterLevel to SECOND_LEVEL
         * - If ShellAppTitleState is  ALL_MY_APPS_ONLY then back button was invisible (in first level), so it is changed to visible
         * - Details area context is bound to the apps in the first group
         * - The first group is selected and focused
         * - UI title and details area title are updated
         *
         * @param {object} The master list object that was pressed
         *
         * @returns {object} The bindingContext of the clicked object
         */
        handleMasterListItemPress_toSecondLevel : function (obj) {
            var sClickedDataSourcePath = this._getClickedDataSourceItemPath(obj),
                oView = this.getView(),
                oBackButton,
                oShellAppTitleState = oView.getModel().getProperty("/ShellAppTitleState"),
                oAllMyAppsModel = oView.getModel('allMyAppsModel'),
                oClickedObjectType = oAllMyAppsModel.getProperty(sClickedDataSourcePath + "/type"),
                oClickedObjectTitle = oAllMyAppsModel.getProperty(sClickedDataSourcePath + "/title"),
                oShellModel = oView.getModel(),
                oSplitApp = this.getView().oSplitApp,
                oBindingContext,
                oSelectedItem;

            //On Phone the sap.m.SplitApp displays only Detail or Master context at once.
            //Consequently, calling 'toDetail' on phones changes also the context to the Detail and this should be avoided.
            if (!sap.ui.Device.system.phone) {
                oSplitApp.toDetail("sapUshellAllMyAppsDetailsPage");
            }

            oView.oDataSourceList.bindItems('allMyAppsModel>' + sClickedDataSourcePath + "/groups", oView.oDataSourceListTemplate);
            oShellModel.setProperty('/allMyAppsMasterLevel', this.oStateEnum.SECOND_LEVEL);

            // In case of ALL_MY_APPS (when ShellNavMenu is also available) the back button is already visible
            if (oShellAppTitleState === this._getShellAppTitleStateEnum().ALL_MY_APPS_ONLY) {
                oBackButton = this._getPopoverHeaderBackButton();
                oBackButton.setVisible(true);
            }

            // Set the content of the details area to the items/apps of the group (i.e. second level)
            this._setBindingContext(sClickedDataSourcePath + "/groups/0", oView.oItemsContainer);
            oView.oDataSourceList.rerender();

            // Selecting the first item in the list and setting the focus
            oView.oDataSourceList.setSelectedItem(oView.oDataSourceList.getItems()[0]);
            oSelectedItem = oView.oDataSourceList.getSelectedItem();
            if (oSelectedItem) {
                oSelectedItem.focus();
            }

            if (oClickedObjectType === sap.ushell.Container.getService("AllMyApps").getProviderTypeEnum().HOME) {
                this._getPopoverHeaderLabel().setText(sap.ushell.resources.i18n.getText("allMyApps_homeEntryTitle"));
            } else if (oClickedObjectType === sap.ushell.Container.getService("AllMyApps").getProviderTypeEnum().EXTERNAL) {
                this._getPopoverHeaderLabel().setText(oClickedObjectTitle);
            }

            // Set the text of the details area header to show the title of the first group (i.e. second level)
            this._getDetailsHeaderLabel().setText(oAllMyAppsModel.getProperty(sClickedDataSourcePath + "/groups/0/title"));
            return oBindingContext;
        },

        /**
         * Master list item press - change of details area.
         * - Setting details area context according to the clicked master item (catalog/group) path.
         *   for example "/AppsData/3" in case of catalog or spread mode, or "/AppsData/3/groups/2" in case of group.
         * - Setting details area title according to catalog title (e.g. "/AppsData/3/title")
         * - If phone:
         *  -- Navigate the splitApp to details area
         *  -- Set the state to DETAILS
         *  -- BackButton visible
         *
         * @param {object} The master list object that was pressed
         *
         * @returns {object} The bindingContext of the clicked object
         */
        handleMasterListItemPress_toDetails : function (oClickedObject) {
            var sClickedDataSourcePath = this._getClickedDataSourceItemPath(oClickedObject),
                oView = this.getView(),
                oShellModel = oView.getModel(),
                oAllMyAppsModel = oView.getModel('allMyAppsModel'),
                oSplitApp = oView.oSplitApp,
                oBackButton = this._getPopoverHeaderBackButton(),
                oBindingContext = this._setBindingContext(sClickedDataSourcePath, oView.oItemsContainer);

            this._getDetailsHeaderLabel().setText(oAllMyAppsModel.getProperty(sClickedDataSourcePath + "/title"));
            if (sap.ui.Device.system.phone) {
                oSplitApp.toDetail("sapUshellAllMyAppsDetailsPage");
                oShellModel.setProperty('/allMyAppsMasterLevel', this.oStateEnum.DETAILS);
                oBackButton.setVisible(true);
            }
            return oBindingContext;
        },

        /********************************************** State handling - End **********************************************/
        /******************************************************************************************************************/

        onMasterLoad: function () {
            var oView = this.getView(),
                oSplitApp = oView.oSplitApp,
                oBackButton = this._getPopoverHeaderBackButton();

            this.bAfterInitialLoading = true;
            if (oSplitApp.getCurrentMasterPage() == oView.oMasterBusyIndicator) {
                oSplitApp.toMaster("sapUshellAllMyAppsMasterPage", "show");
            }

            oBackButton.focus();
            bSingleDataSource = this._isSingleDataSource();
            this.updateMasterFocusAndDetailsContext(undefined, undefined, {bFirstCatalogLoadedEvent : false});
        },

        onDetailLoad: function () {
            var oView = this.getView(),
                oSplitApp = oView.oSplitApp;

            this.bAfterInitialLoading = true;
            //On "Phones" the sap.m.SplitApp displays only Detail or Master context at once.
            //Consequently, calling 'toDetail' on phones changes also the context to the Detail and this should be avoided.
            if (!sap.ui.Device.system.phone) {
                oSplitApp.toDetail("sapUshellAllMyAppsDetailsPage", "show");
            }

        },

        onNoCatalogsLoaded: function () {
            var oView = this.getView(),
                oSplitApp = oView.oSplitApp;

            //On "Phones" the sap.m.SplitApp displays only Detail or Master context at once.
            //Consequently, calling 'toDetail' on phones changes also the context to the Detail and this should be avoided.
            if ((!sap.ui.Device.system.phone) && (!bSingleDataSource)) {
                oSplitApp.toDetail("sapUshellAllMyAppsEmptyDetailsPage", "show");
            } else if ((!sap.ui.Device.system.phone) && bSingleDataSource) {
                oSplitApp.toDetail("sapUshellAllMyAppsDetailsPage");
            }
        },

        /**
         * Place the focus and update the selected item in the master-area (providers list) on the first catalog.
         * If no catalogs exist in the list, place the focus on the first item.
         * Also: set the context of the details area
         */
        updateMasterFocusAndDetailsContext: function (sChannelId, sEventId, oData) {
            var oView = this.getView(),
                oShellModel = oView.getModel(),
                oAllMyAppsModel = oView.getModel('allMyAppsModel'),
                iFirstSelectedDataSourceIndex = this._getInitialFirstLevelSelectionIndex(),
                oBindingContext,
                oBindedEntryObject,
                oSelectedDataSource,
                oSplitApp = this.getView().oSplitApp;

            if (bSingleDataSource === true) {
                oBindingContext = oAllMyAppsModel.createBindingContext("/AppsData/0/groups/0");
                oBindedEntryObject = oAllMyAppsModel.getProperty(oBindingContext.sPath);
            } else {
                oBindingContext = oAllMyAppsModel.createBindingContext("/AppsData/" + iFirstSelectedDataSourceIndex);
                oBindedEntryObject = oAllMyAppsModel.getProperty(oBindingContext.sPath);
            }

            // Set the context of the details area to point the items/apps of the first catalog or (if no catalogs) the first group
            oView.oItemsContainer.setBindingContext(oBindingContext, 'allMyAppsModel');
            oView.oCustomLabel.setBindingContext(oBindingContext, 'allMyAppsModel');
            oView.oCustomLink.setBindingContext(oBindingContext, 'allMyAppsModel');
            oView.oCustomPanel.setBindingContext(oBindingContext, 'allMyAppsModel');

            if (oBindedEntryObject !== undefined) {
                // Set the text of the details area header to show the title of the first catalog or (if no catalogs) the first group
                this._getDetailsHeaderLabel().setText(oBindedEntryObject.title);
            }

            if (oData.bFirstCatalogLoadedEvent === true) {
                // Re-render the list before calculating the item on which the focus (and list selection) should be placed
                oView.oDataSourceList.rerender();
            }

            if (oData.bFirstCatalogLoadedEvent === false && iFirstSelectedDataSourceIndex === 0) {
                this.onNoCatalogsLoaded();
            }

            oView.oDataSourceList.setSelectedItem(oView.oDataSourceList.getItems()[iFirstSelectedDataSourceIndex]);
            oSelectedDataSource = oView.oDataSourceList.getSelectedItem();
            if (oSelectedDataSource) {
                oSelectedDataSource.focus();
            }
            if (oData.bFirstCatalogLoadedEvent) {
                jQuery.sap.measure.end("FLP:ShellAppTitle.onClick");
                jQuery.sap.measure.end("FLP:ShellNavMenu.footerClick");
            }
        },

        handleGroupPress : function (ev) {
            var oData = this.getView().oCustomLink.getBindingContext("allMyAppsModel").getObject();
            if (oData.handlePress) {
                oData.handlePress(ev, oData);
            }
        },

        toggleMasterArea : function () {
            var oSplitApp = this.getView().oSplitApp;

            !this.bMasterShown ? oSplitApp.showMaster() : oSplitApp.hideMaster();
            this.bMasterShown = !this.bMasterShown;
        },

        onAppItemClick : function (oClickedObject) {
            var oAllMyAppsModel = this.getView().getModel('allMyAppsModel'),
                sClickedItemPath = oClickedObject.getBindingContext("allMyAppsModel").sPath,
                sUrl = oAllMyAppsModel.getProperty(sClickedItemPath + "/url");

            if (sUrl) {
                if (sUrl[0] === '#') {
                    hasher.setHash(sUrl);
                    setTimeout(function () {
                        this.getView().getParent().close();
                    }.bind(this), 50);
                } else {
                    window.open(sUrl, '_blank');
                }
            }
        },

        /**
         * Returns the current state of AllMyApps UI, which is a value of oStateEnum that is read form the AllMyapps model
         */
        getCurrentState : function () {
            var oShellModel = this.getView().getModel();

            return oShellModel.getProperty('/allMyAppsMasterLevel');
        },

        getStateEnum : function () {
            return this.oStateEnum;
        },

        /******************************************************************************************************************/
        /************************************************* Helper functions ***********************************************/

        /**
         * Returns true if there is only a single entry in the sources (master) list
         *
         * A precondition is that catalogs will be disabled in configuration
         */
        _isSingleDataSource: function () {
            var oAllMyAppsService = sap.ushell.Container.getService("AllMyApps");

            if (oAllMyAppsService.isCatalogAppsEnabled()) {
                return false;
            }

            // External providers disabled and groups data enabled
            if (!oAllMyAppsService.isExternalProviderAppsEnabled() && oAllMyAppsService.isHomePageAppsEnabled()) {
                return true;
            }

            // External providers enabled and only single provider exists, groups data disabled
            if (oAllMyAppsService.isExternalProviderAppsEnabled() &&
                    Object.keys(oAllMyAppsService.getDataProviders()).length === 1 &&
                    !oAllMyAppsService.isHomePageAppsEnabled()) {
                return true;
            }

            return false;
        },

        /**
         * Returns the index of the first entry in the provider's list, or by default - return 0
         */
        _getInitialFirstLevelSelectionIndex: function () {
            var oView = this.getView(),
                oAllMyAppsModel = oView.getModel('allMyAppsModel'),
                aDataSources = oAllMyAppsModel.getProperty("/AppsData"),
                index,
                oTempDataSource;

            for (index = 0; index < aDataSources.length; index++) {
                oTempDataSource = aDataSources[index];
                if (oTempDataSource.type === sap.ushell.Container.getService("AllMyApps").getProviderTypeEnum().CATALOG) {
                    return index;
                }
            }
            return 0;
        },

        _getPopoverHeaderBackButton: function () {
            return this._getPopoverHeaderContent(0);
        },

        getShellAppTitleToggleListButton: function () {
            return this._getPopoverHeaderContent(1);
        },

        _getPopoverHeaderContent: function (iContentIndex) {
            var oCustomHeader,
                aHeaderLeftContent,
                oBackButton;

            oCustomHeader = this._getPopoverObject().getCustomHeader();
            aHeaderLeftContent = oCustomHeader.getContentLeft();
            oBackButton = aHeaderLeftContent[iContentIndex];

            return oBackButton;
        },

        _getPopoverHeaderLabel : function () {
            var oCustomHeader,
                oContentMiddle;

            oCustomHeader = this._getPopoverObject().getCustomHeader();
            oContentMiddle = oCustomHeader.getContentMiddle();
            return oContentMiddle[0];
        },

        _getPopoverObject : function () {
            return this.getView().getParent();
        },

        _getDetailsHeaderLabel : function () {
            return this.getView().oDetailsHeaderLabel;
        },

        _setBindingContext : function (sBindingPath, oBoundContainer) {
            var oAllMyAppsModel = this.getView().getModel("allMyAppsModel"),
                oBindingContext = oAllMyAppsModel.createBindingContext(sBindingPath);

            oBoundContainer.setBindingContext(oBindingContext, "allMyAppsModel");
            return oBindingContext;
        },

        _getClickedDataSourceItemPath : function (obj) {
            var oClickedDataSourceItem = obj.getParameter("listItem");

            return oClickedDataSourceItem.getBindingContext('allMyAppsModel').sPath;
        },

        _getAllMyAppsManager : function () {
            return AllMyAppsManager;
        },

        _getDataSourcesSelectedPath : function () {
            return this.lastPressedMasterItem.getBindingContextPath();
        },

        _getShellAppTitleStateEnum : function () {
            var oShellAppTitle = sap.ui.getCore().byId("shellAppTitle");
            return oShellAppTitle.getStateEnum();
        },

        initKeyBoardNavigationHandling: function () {
            if (this.keyboardNavigation) {
                this.keyboardNavigation.destroy();
            }
            this.keyboardNavigation = new KeyboardNavigation(this.getView());
        }
    });

    /************************************************************************************************************/
    /**************************************** Keyboard Navigation - Begin ***************************************/

    KeyboardNavigation.prototype.init = function (oView) {
        this.keyCodes = jQuery.sap.KeyCodes;
        oView.oDataSourceList.addEventDelegate({
            // on tab next (Tab)
            onsaptabnext: function (e) {
                var aDetailAppsElements = jQuery('.sapUshellAllMyAppsListItem');

                this.jqDetailAreaElement = oView.oItemsContainer.$();
                this.jqDetailAreaElement.on('keydown.keyboardNavigation', this.keydownHandler.bind(this));

                //Focus the first App in the Detail Area.
                this._setItemFocus(e, aDetailAppsElements[0]);
            }.bind(this)
        });
        oView.oItemsContainer.addEventDelegate({
            onsaptabprevious: function (e) {
                var oCurrentlyFocusedAppElement = jQuery('.sapUshellAllMyAppsListItem[tabindex="0"]')[0];

                jQuery(oCurrentlyFocusedAppElement).attr('tabindex', -1);
            },
            onsaptabnext: function (e) {
                var aCustomPanel = jQuery('.sapUshellAllMyAppsCustomPanel'),
                    oCurrentlyFocusedAppElement = jQuery('.sapUshellAllMyAppsListItem[tabindex="0"]')[0];

                // Since the is no custom panel, there is no need to "remember" the last selected item
                if (aCustomPanel.length === 0) {
                    jQuery(oCurrentlyFocusedAppElement).attr('tabindex', -1);
                }
            }
        });
        // Clicking SHIFT+TAB from the custom panel should return the focus to the last selected item/app.
        // Clicking TAB should move the focus to the master list and "forget" the last selected item/app
        oView.oCustomPanel.addEventDelegate({
            onsaptabnext: function (e) {
                var oCurrentlyFocusedAppElement = jQuery('.sapUshellAllMyAppsListItem[tabindex="0"]')[0];
                jQuery(oCurrentlyFocusedAppElement).attr('tabindex', -1);
            }
        });
    };

    KeyboardNavigation.prototype.keydownHandler = function (e) {
        var aDetailAppsElements = jQuery('.sapUshellAllMyAppsListItem'),
            oCurrentlyFocusedAppElement = jQuery('.sapUshellAllMyAppsListItem[tabindex="0"]')[0];

        switch (e.keyCode) {
        case this.keyCodes.ARROW_UP:
            this.arrowKeyHandler(e, -2);
            break;
        case this.keyCodes.ARROW_DOWN:
            this.arrowKeyHandler(e, 2);
            break;
        case this.keyCodes.ARROW_LEFT:
            this.arrowKeyHandler(e, -1);
            break;
        case this.keyCodes.ARROW_RIGHT:
            this.arrowKeyHandler(e, 1);
            break;
        default:
            break;
        }
    };

    KeyboardNavigation.prototype.arrowKeyHandler = function (e, iDirectionFactor) {
        var aDetailAppsElements = jQuery('.sapUshellAllMyAppsListItem').toArray(),
            oCurrentlyFocusedAppElement = jQuery('.sapUshellAllMyAppsListItem[tabindex="0"]')[0],
            iCurrentlyFocusedIndex = aDetailAppsElements.indexOf(oCurrentlyFocusedAppElement),
            oElementToFocus = aDetailAppsElements[iCurrentlyFocusedIndex + iDirectionFactor];

        if (oElementToFocus) {
            jQuery(oCurrentlyFocusedAppElement).attr('tabindex', -1);
            this._setItemFocus(e, oElementToFocus);
        }
    };

    KeyboardNavigation.prototype._setItemFocus = function (e, oElementToFocus) {
        if (oElementToFocus) {
            e.preventDefault();
            e.stopImmediatePropagation();
            jQuery(oElementToFocus).attr('tabindex', 0);
            oElementToFocus.focus();
        }
    };

    KeyboardNavigation.prototype.destroy = function () {
        if (this.jqDetailAreaElement) {
            this.jqDetailAreaElement.off(".keyboardNavigation");
        }
        delete this.jqDetailAreaElement;
    };

}, /* bExport= */ false);
