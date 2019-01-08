// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

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
