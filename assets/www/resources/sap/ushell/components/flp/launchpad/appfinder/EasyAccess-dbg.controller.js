// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

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
