// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

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
