// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * The view of AllMyApps MVC.<br>
 * Creates a Master-Details UI (SplitApp) that presents the following:
 * - Master area - List of data_sources/providers list or the data-sources 2nd level data (groups)
 * - Details area - Grid that contains the items\apps of the group that is selected in the master area
 */

sap.ui.define([
    'sap/m/BusyIndicator',
    'sap/m/SplitApp',
    'sap/m/Label',
    'sap/m/Link',
    'sap/m/Text',
    'sap/m/Page',
    'sap/m/StandardListItem',
    'sap/m/CustomListItem',
    'sap/m/List',
    'sap/m/VBox',
    'sap/m/Bar',
    'sap/m/ScrollContainer',
    'sap/m/ListType',
    'sap/m/BarDesign'
], function (BusyIndicator, SplitApp, Label, Link, Text, Page, StandardListItem, CustomListItem, List, VBox, Bar, ScrollContainer, ListType, BarDesign) {
    "use strict";
    /*global jQuery, sap, document */
    /*jslint plusplus: true, nomen: true */

    sap.ui.jsview("sap.ushell.renderers.fiori2.allMyApps.AllMyApps", {

        createContent: function (oController) {
            this.oMasterBusyIndicator = new BusyIndicator('allMyAppsMasterBusyIndicator', {
                size: "1rem"
            }).addStyleClass("sapUshellAllMyAppsBusyIndicator");

            this.oDetailBusyIndicator = new BusyIndicator('allMyAppsDetailBusyIndicator', {
                size: "1rem"
            }).addStyleClass("sapUshellAllMyAppsBusyIndicator");

            this.oSplitApp =  new SplitApp("sapUshellAllMyAppsMasterDetail", {
                masterPages: [this.oMasterBusyIndicator, this.getMasterPartContent(oController)],
                detailPages: [this.oDetailBusyIndicator, this.getEmptyDetailsContent(), this.getDetailsPartContent(oController)],
                mode: {
                    path: '/isPhoneWidth',
                    formatter: function (bIsMobile) {
                        return bIsMobile ? sap.m.SplitAppMode.ShowHideMode : sap.m.SplitAppMode.StretchCompressMode;
                    }
                }
            }).addStyleClass("sapUshellAllMyAppsView");
            this.bAfterOpenHandlerCalled = false;
            return this.oSplitApp;
        },

        getEmptyDetailsContent: function () {
            var oTitleLabel,
                oEmptyDetailsPage;

            oTitleLabel = new Label({
                text : sap.ushell.resources.i18n.getText('AllMyAppsEmptyText'),
                textAlign: sap.ui.core.TextAlign.Center
            }).addStyleClass('sapUshellAllMyAppsEmptyDetailsPageText');

            oEmptyDetailsPage = new Page('sapUshellAllMyAppsEmptyDetailsPage', {
                content: [oTitleLabel],
                showHeader : false,
                enableScrolling : false
            });
            return oEmptyDetailsPage;
        },

        /**
         * Creates and returns the Master part of AllMyApps Master-Details UI
         */
        getMasterPartContent : function (oController) {
            var oListPage;

            if (!this.oDataSourceList) {
                this.oDataSourceListTemplate = new StandardListItem({
                    type: {
                        parts : ['allMyAppsModel>type', '/allMyAppsMasterLevel'],
                        formatter : function (oType, oLevel) {
                            var bShowArrow = sap.ui.Device.system.phone ||
                                ((oLevel === this.getController().oStateEnum.FIRST_LEVEL) &&
                                (oType !== sap.ushell.Container.getService('AllMyApps').getProviderTypeEnum().CATALOG));

                            return bShowArrow ? ListType.Navigation : ListType.Active;
                        }.bind(this)
                    },
                    title : '{allMyAppsModel>title}'
                });

                this._addCustomData(this.oDataSourceListTemplate, "aria-controls", "sapUshellAllMyAppsDetailsPage");

                this.oDataSourceList = new List('sapUshellAllMyAppsDataSourcesList', {
                    tooltip: '{i18n>catalogSelect_tooltip}',
                    rememberSelections: true,
                    mode: sap.ui.Device.system.phone ? sap.m.ListMode.None : sap.m.ListMode.SingleSelectMaster,
                    items : {
                        path : 'allMyAppsModel>/AppsData',
                        template : this.oDataSourceListTemplate
                    },
                    growingThreshold: 100,
                    showNoData: false,
                    itemPress: [oController.handleMasterListItemPress, oController]
                });

                this._addCustomData(this.oDataSourceList, "role", "navigation");
            }
            oListPage = new Page("sapUshellAllMyAppsMasterPage", {
                showHeader : false
            });

            oListPage.addContent(this.oDataSourceList);
            return oListPage;
        },

        /**
         * Creates and returns the details part of AllMyApps master-details UI
         *
         * Content structure:
         *
         * -- Page
         *    -- Header Bar
         *       -- HeaderLabel
         *    -- Content Scroll Container
         *       -- CustomListItems
         */
        getDetailsPartContent : function (oController) {
            var oListItemVBox = new VBox(),
                oTitleLabel = new Label({text : '{allMyAppsModel>title}'}),
                oSubTitleLabel = new Label({
                    text : '{allMyAppsModel>subTitle}',
                    visible : {
                        parts : ['allMyAppsModel>subTitle'],
                        formatter : function (sSubTitle) {
                            return sSubTitle ? true : false;
                        }
                    }
                }),
                oItemListTemplate,
                oDetailsHeaderBar,
                oDetailsPage;

            oTitleLabel.addStyleClass("sapUshellAllMyAppsItemTitle");
            oSubTitleLabel.addStyleClass("sapUshellAllMyAppsItemSubTitle");

            oListItemVBox.addItem(oTitleLabel);
            oListItemVBox.addItem(oSubTitleLabel);

            oItemListTemplate = new CustomListItem({
                content: oListItemVBox,
                type : ListType.Active,
                press: function () {
                    oController.onAppItemClick(this);
                }
            });

            oItemListTemplate.addStyleClass("sapUshellAllMyAppsListItem");
            oItemListTemplate.addEventDelegate({
                onsapenter: function (e) {
                    oController.onAppItemClick(e.srcControl);
                },
                onsapspace: function (e) {
                    oController.onAppItemClick(e.srcControl);
                }
            });

            this.oDetailsHeaderLabel = new Label("sapUshellAllMyAppsDetailsHeaderLabel", {

            });
            oDetailsHeaderBar = new Bar("sapUshellDetailsPageHeaderBar", {
                contentLeft : this.oDetailsHeaderLabel,
                contentRight : [],
                contentMiddle : [],
                design: BarDesign.Header
            });

            this.oItemsContainerlist = new List("oItemsContainerlist",{
                items : {
                    path : "allMyAppsModel>apps",
                    template: oItemListTemplate
                }
            });

            this.oItemsContainer = new ScrollContainer("allMyAppsScrollContainer", {
                horizontal : false,
                vertical : true,
                content: this.oItemsContainerlist
            }).addStyleClass("sapUshellAllMyAppsDetailsItemContainer");

            this.oCustomLink = new Link({
                text: {
                    path: "allMyAppsModel>sCustomLink"
                },
                press: function (evt) {
                    oController.handleGroupPress(evt);
                }
            });
            this.oCustomLabel = new Text({
                text: {
                    path: "allMyAppsModel>sCustomLabel"
                }
            });
            this.oCustomPanel = new VBox({
                visible: {
                    parts: [{
                        path: "allMyAppsModel>numberCustomTiles"
                    }],
                    formatter: function (numberCustomTiles) {
                        return !!numberCustomTiles;
                    }
                },
                items : [this.oCustomLabel, this.oCustomLink]
            });
            this.oCustomPanel.addStyleClass("sapUshellAllMyAppsCustomPanel");
            oDetailsPage = new Page("sapUshellAllMyAppsDetailsPage", {
                content: [oDetailsHeaderBar, this.oItemsContainer, this.oCustomPanel],
                showHeader : false,
                enableScrolling : true
            });

            this._addCustomData(oDetailsPage, "role", "applications");

            return oDetailsPage;
        },

        _afterOpen : function () {
            if (!this.bAfterOpenHandlerCalled) {
                this.bAfterOpenHandlerCalled = true;
                if (sap.ui.Device.system.desktop) {
                    // initializing keyboard navigation
                    this.getController().initKeyBoardNavigationHandling();
                }
            }
        },

        _addCustomData : function (oItem, sKey, sValue) {
            oItem.addCustomData(new sap.ushell.ui.launchpad.AccessibilityCustomData({
                key: sKey,
                value: sValue,
                writeToDom: true
            }));
        },

        getControllerName : function () {
            return "sap.ushell.renderers.fiori2.allMyApps.AllMyApps";
        }
    });
},/* bExport= */false);