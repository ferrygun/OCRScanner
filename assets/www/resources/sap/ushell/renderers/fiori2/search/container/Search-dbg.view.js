// Oliver+Jian //TODO
// iteration 0 //TODO
/* global window, jQuery, sap, $, document */
// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/controls/SearchLayout',
    'sap/ushell/renderers/fiori2/search/controls/SearchResultListContainer',
    'sap/ushell/renderers/fiori2/search/controls/SearchResultList',
    'sap/ushell/renderers/fiori2/search/controls/SearchResultTable',
    'sap/ushell/renderers/fiori2/search/controls/SearchNoResultScreen',
    'sap/ushell/renderers/fiori2/search/SearchHelper',
    'sap/ushell/renderers/fiori2/search/controls/SearchLabel',
    'sap/ushell/renderers/fiori2/search/controls/SearchLink',
    'sap/ushell/renderers/fiori2/search/controls/SearchResultMap',
    'sap/ushell/renderers/fiori2/search/controls/SearchResultListItem',
    'sap/ushell/renderers/fiori2/search/controls/CustomSearchResultListItem',
    'sap/ushell/renderers/fiori2/search/controls/SearchFacetFilter',
    'sap/ushell/renderers/fiori2/search/controls/DivContainer',
    'sap/ushell/renderers/fiori2/search/controls/SearchTilesContainer',
    'sap/ushell/renderers/fiori2/search/controls/SearchFilterBar',
    'sap/ushell/services/Personalization',
    'sap/m/TablePersoController',
    'sap/ui/vbm/AnalyticMap',
    'sap/ui/vbm/Spot',
    'sap/m/BusyDialog'
], function(
    SearchLayout, SearchResultListContainer, SearchResultList, SearchResultTable, SearchNoResultScreen,
    SearchHelper, SearchLabel, SearchLink, SearchMap, SearchResultListItem, CustomSearchResultListItem
) {
    "use strict";

    return sap.ui.jsview("sap.ushell.renderers.fiori2.search.container.Search", {

        // create content
        // ===================================================================
        createContent: function(oController) {
            var that = this;

            // center area
            that.centerArea = that.assembleCenterArea();

            // did you mean message bar
            var didYouMeanBar = new sap.m.MessageStrip({
                text: sap.ushell.resources.i18n.getText('did_you_mean', '{/queryFilter/searchTerms}'),
                showIcon: true,
                class: 'sapUiMediumMarginBottom',
                visible: {
                    parts: [{
                        path: '/fuzzy'
                    }, {
                        path: '/boCount'
                    }],
                    formatter: function(fuzzyFlag, boCount) {
                        if (fuzzyFlag === true &&
                            boCount > 0) {
                            return true;
                        } else {
                            return false;
                        }
                    }
                }
            });

            // main result list
            var resultListContainer = new SearchResultListContainer({
                centerAreaHeader: null,
                centerArea: that.centerArea,
                didYouMeanBar: didYouMeanBar,
                totalCountBar: that.assembleCountLabel(),
                noResultScreen: new SearchNoResultScreen({
                    searchBoxTerm: {
                        parts: [{
                            path: '/queryFilter/searchTerms'
                        }],
                        formatter: function(searchTerms) {
                            return searchTerms;
                        }
                    },
                    visible: {
                        parts: [{
                            path: '/count'
                        }, {
                            path: '/isBusy'
                        }],
                        formatter: function(count, isBusy) {
                            return count === 0 && !isBusy;
                        }
                    }
                })
            });

            // container for normal search result list + facets
            that.searchLayout = new SearchLayout({
                resultListContainer: resultListContainer,
                busyIndicator: new sap.m.BusyDialog(),
                isBusy: '{/isBusy}',
                showFacets: {
                    parts: [{
                        path: '/count'
                    }, {
                        path: '/facetVisibility'
                    }, {
                        path: '/uiFilter/defaultConditionGroup'
                    }],
                    formatter: function(count, facetVisibility, filterConditions) {
                        if (!facetVisibility) {
                            return false;
                        }
                        var filterExists = filterConditions && filterConditions.conditions &&
                            filterConditions.conditions.length > 0;
                        if (count === 0 && !filterExists) {
                            return false;
                        }
                        return true;
                    }
                },
                vertical: false,
                facets: new sap.ushell.renderers.fiori2.search.controls.SearchFacetFilter()
            });
            that.searchLayout.addStyleClass('sapUshellSearchLayout');

            // top container
            that.searchContainer = new sap.ushell.renderers.fiori2.search.controls.DivContainer({
                content: [that.searchLayout],
                cssClass: 'sapUshellSearchContainer'
            });

            // init search focus handler
            that.oFocusHandler = new SearchHelper.SearchFocusHandler(that);

            return that.searchContainer;

        },

        // assemble filter button
        // ===================================================================
        assembleFilterButton: function() {
            var that = this;
            var filterBtn = new sap.m.ToggleButton({
                icon: sap.ui.core.IconPool.getIconURI("filter"),
                tooltip: {
                    parts: [{
                        path: '/facetVisibility'
                    }],
                    formatter: function(facetVisibility) {
                        return facetVisibility ? sap.ushell.resources.i18n.getText("hideFacetBtn_tooltip") :
                            sap.ushell.resources.i18n.getText("showFacetBtn_tooltip");
                    }
                },
                pressed: '{/facetVisibility}',
                press: function() {
                    if (this.getPressed()) {
                        // show facet
                        that.getModel().setFacetVisibility(true);
                        //filterBtn.setTooltip(sap.ushell.resources.i18n.getText("hideFacetBtn_tooltip"));
                    } else {
                        //hide facet
                        that.getModel().setFacetVisibility(false);
                        //filterBtn.setTooltip(sap.ushell.resources.i18n.getText("showFacetBtn_tooltip"));
                    }
                },
                visible: {
                    parts: [{
                        path: '/businessObjSearchEnabled'
                    }, {
                        path: '/count'
                    }],
                    formatter: function(businessObjSearchEnabled, count) {
                        if (count === 0) {
                            return false;
                        }
                        return !sap.ui.Device.system.phone && businessObjSearchEnabled;
                    }
                }
            });
            filterBtn.addStyleClass('searchBarFilterButton');
            return filterBtn;
        },

        // visibility of search toolbar entry
        // ===================================================================
        searchToolbarEntryVisibility: {
            parts: [{
                path: '/count'
            }],
            formatter: function(count) {
                return count !== 0 && !sap.ui.Device.system.phone;
            }
        },

        // assemble count label
        // ===================================================================
        assembleCountLabel: function() {

            var label = new sap.m.Label({
                visible: {
                    parts: [{
                        path: '/count'
                    }],
                    formatter: function(count) {
                        return count !== 0;
                    }
                },
                text: {
                    parts: [{
                        path: '/count'
                    }],
                    formatter: function(count) {
                        if (typeof count !== 'number') {
                            return "";
                        }
                        var countAsStr = SearchHelper.formatInteger(count);
                        return sap.ushell.resources.i18n.getText("results") + ' (' + countAsStr + ')';
                    }
                }
            });
            label.addStyleClass('sapUshellSearchTotalCountSelenium');
            return label;
        },

        // search toolbar
        // ===================================================================
        assembleSearchToolbar: function(bWithoutShareButton) {
            var that = this;

            // display switch tap strips
            var displaySwitchTapStrips = that.assembleDisplaySwitchTapStrips();

            // table sort button
            var tableSortButton = new sap.m.Button({
                icon: "sap-icon://sort",
                tooltip: "{i18n>sortTable}",
                type: sap.m.ButtonType.Transparent,
                visible: {
                    parts: [{
                        path: '/displaySwitchVisibility'
                    }, {
                        path: '/count'
                    }, {
                        path: '/tableSortableColumns'
                    }],
                    formatter: function(displaySwitchVisibility, count, columns) {
                        return displaySwitchVisibility && count !== 0 && columns.length > 1;
                    }
                },
                press: function(evt) {
                    that.tableSortDialog.open();
                }
            });
            displaySwitchTapStrips.addEventDelegate({
                //needed as by refreshing page the view is not reassembled and hence "that.determineIfMaps(that)" is not run
                onAfterRendering: function(oEvent) {
                    var oDisplaySwitchButtons = oEvent.srcControl;
                    if (oDisplaySwitchButtons.getItems().length === 2 && that.determineIfMaps(that)) {
                        oDisplaySwitchButtons.addItem(new sap.m.SegmentedButtonItem({
                            icon: "sap-icon://map",
                            tooltip: sap.ushell.resources.i18n.getText("displayMap"),
                            key: "map"
                        }));
                    }
                }
            });
            displaySwitchTapStrips.addStyleClass("sapUshellSearchResultDisplaySwitch");
            tableSortButton.addStyleClass("sapUshellSearchTableSortButton");

            // table personalize button
            var tablePersonalizeButton = new sap.m.Button("tablePersonalizeButton", {
                icon: "sap-icon://action-settings",
                tooltip: "{i18n>personalizeTable}",
                type: sap.m.ButtonType.Transparent,
                visible: {
                    parts: [{
                        path: '/resultToDisplay'
                    }],
                    formatter: function(resultToDisplay) {
                        return resultToDisplay === "searchResultTable";
                    }
                },
                press: function(evt) {
                    that.oTablePersoController.openDialog();
                }
            });
            tablePersonalizeButton.addStyleClass("sapUshellSearchTablePersonalizeButton");

            //            //Fix bug: oTablePersoController is undefined when UI shows search result table back from fact sheet
            //            tablePersonalizeButton.addEventDelegate({
            //                onAfterRendering: function() {
            //                    that.updatePersoServiceAndController();
            //                }
            //            });

            if (!bWithoutShareButton) {
                var shareButton = this.assembleShareButton();
                return [tablePersonalizeButton, tableSortButton, shareButton, displaySwitchTapStrips];
            } else {
                return [tablePersonalizeButton, tableSortButton, displaySwitchTapStrips];
            }
        },

        // share button
        // ===================================================================
        assembleShareButton: function() {

            var that = this;

            // create bookmark button (entry in action sheet)
            var oBookmarkButton = new sap.ushell.ui.footerbar.AddBookmarkButton({
                beforePressHandler: function() {
                    var oAppData = {
                        url: document.URL,
                        title: that.getModel().getDocumentTitle(),
                        icon: sap.ui.core.IconPool.getIconURI("search")
                    };
                    oBookmarkButton.setAppData(oAppData);
                }
            });
            oBookmarkButton.setWidth('auto');

            var oEmailButton = new sap.m.Button();
            oEmailButton.setIcon("sap-icon://email");
            oEmailButton.setText(sap.ushell.resources.i18n.getText("eMailFld"));
            oEmailButton.attachPress(function() {
                sap.m.URLHelper.triggerEmail(null, that.getModel().getDocumentTitle(), document.URL);
            });
            oEmailButton.setWidth('auto');

            // add these two jam buttons when we know how to configure jam in fiori  //TODO
            //var oJamShareButton = new sap.ushell.ui.footerbar.JamShareButton();
            //var oJamDiscussButton = new sap.ushell.ui.footerbar.JamDiscussButton();

            // create action sheet
            var oActionSheet = new sap.m.ActionSheet({
                placement: 'Bottom',
                buttons: [oBookmarkButton, oEmailButton]
            });

            // button which opens action sheet
            var oShareButton = new sap.m.Button({
                icon: 'sap-icon://action',
                tooltip: sap.ushell.resources.i18n.getText('shareBtn'),
                press: function() {
                    oActionSheet.openBy(oShareButton);
                }
            });
            return oShareButton;
        },


        // datasource tap strips
        // ===================================================================
        assembleDataSourceTapStrips: function() {

            var that = this;

            var tabBar = new sap.m.OverflowToolbar({
                design: sap.m.ToolbarDesign.Transparent,
                visible: {
                    parts: [{
                        path: '/facetVisibility'
                    }, {
                        path: '/count'
                    }, {
                        path: '/businessObjSearchEnabled'
                    }],
                    formatter: function(facetVisibility, count, bussinesObjSearchEnabled) {
                        return !facetVisibility && count > 0 && bussinesObjSearchEnabled;
                    }
                }
            });
            // define group for F6 handling
            tabBar.data("sap-ui-fastnavgroup", "false", true /* write into DOM */ );
            tabBar.addStyleClass('searchTabStrips');
            that.tabBar = tabBar;

            var tabBarAriaLabel = new sap.ui.core.InvisibleText({
                text: "Data Sources"
            }).toStatic();
            tabBar.addDependent(tabBarAriaLabel);
            tabBar.addAriaLabelledBy(tabBarAriaLabel);

            tabBar.bindAggregation('content', '/tabStrips/strips', function(sId, oContext) {
                var button = new sap.m.ToggleButton({
                    text: '{labelPlural}',
                    type: {
                        parts: [{
                            path: '/tabStrips/selected'
                        }],
                        formatter: function(selectedDS) {
                            var myDatasource = this.getBindingContext().getObject();
                            if (myDatasource.equals(selectedDS) === true) {
                                return sap.m.ButtonType.Transparent; // changed
                            } else {
                                return sap.m.ButtonType.Transparent;
                            }
                        }
                    },
                    pressed: {
                        parts: [{
                            path: '/tabStrips/selected'
                        }],
                        formatter: function(selectedDS) {
                            var myDatasource = this.getBindingContext().getObject();
                            return myDatasource.equals(selectedDS);
                        }
                    },
                    press: function(event) {
                        this.setType(sap.m.ButtonType.Transparent); // changed

                        // clicking on the already selected button has neither UI effect(button stays pressed status) nor reloading of search
                        if (this.getBindingContext().getObject().equals(that.getModel().getProperty('/tabStrips/selected'))) {
                            this.setPressed(true);
                            return;
                        }
                        var aButtons = that.tabBar.getContent();

                        for (var i = 0; i < aButtons.length; i++) {
                            if (aButtons[i].getId() !== this.getId()) {
                                aButtons[i].setType(sap.m.ButtonType.Transparent);
                                if (aButtons[i].getPressed() === true) {
                                    aButtons[i].setPressed(false);
                                }
                            }
                        }

                        // set Datasource to current datasource;
                        that.getModel().setDataSource(this.getBindingContext().getObject());
                    }
                });
                var buttonAriaLabel = new sap.ui.core.InvisibleText({
                    text: oContext.getProperty("labelPlural") + ", " + sap.ushell.resources.i18n.getText("dataSource")
                }).toStatic();
                button.addAriaLabelledBy(buttonAriaLabel);
                button.addDependent(buttonAriaLabel);

                return button;
            });

            tabBar._setupItemNavigation = function() {
                if (!this.theItemNavigation) {
                    this.theItemNavigation = new sap.ui.core.delegate.ItemNavigation();
                    this.addDelegate(this.theItemNavigation);
                }
                this.theItemNavigation.setCycling(false);
                this.theItemNavigation.setRootDomRef(this.getDomRef());
                var itemDomRefs = [];
                var content = this.getContent();
                for (var i = 0; i < content.length; i++) {
                    if (!$(content[i].getDomRef()).attr("tabindex")) {
                        var tabindex = "-1";
                        if (content[i].getPressed && content[i].getPressed()) {
                            tabindex = "0";
                        }
                        $(content[i].getDomRef()).attr("tabindex", tabindex);
                    }
                    itemDomRefs.push(content[i].getDomRef());
                }

                var overflowButton = this.getAggregation("_overflowButton");
                if (overflowButton && overflowButton.getDomRef) {
                    var _overflowButton = overflowButton.getDomRef();
                    itemDomRefs.push(_overflowButton);
                    $(_overflowButton).attr("tabindex", "-1");
                }

                this.theItemNavigation.setItemDomRefs(itemDomRefs);
            };

            tabBar.addEventDelegate({
                onAfterRendering: function(oEvent) {
                    var that = this;

                    that.getAggregation("_overflowButton").addEventDelegate({
                        onAfterRendering: function(oEvent) {
                            that._setupItemNavigation();
                        }
                    }, that.getAggregation("_overflowButton"));

                    that._setupItemNavigation();
                }
            }, tabBar);

            return tabBar;
        },

        reorgTabBarSequence: function() {
            if (!this.tabBar) {
                return;
            }
            var highLayout = new sap.m.OverflowToolbarLayoutData({
                priority: sap.m.OverflowToolbarPriority.High
            });
            var neverOverflowLayout = new sap.m.OverflowToolbarLayoutData({
                priority: sap.m.OverflowToolbarPriority.NeverOverflow
            });

            var aButtons = this.tabBar.getContent();
            for (var i = 0; i < aButtons.length; i++) {
                if (this.getModel().getProperty('/tabStrips/selected').equals(aButtons[i].getBindingContext().getObject())) {
                    aButtons[i].setLayoutData(neverOverflowLayout);
                } else {
                    aButtons[i].setLayoutData(highLayout);
                }

            }

        },
        determineIfMaps: function(oContext) {
            var bIfMaps = false;
            if (oContext.getModel() && oContext.getModel().config.maps) {
                bIfMaps = true;
            }

            var oModel, oSina, oRootDataSource, oMetadata, oDataSource, oAttributeMap, key, oAttribute;
            oModel = oContext.getModel();

            if (oModel && oModel.sina) {
                //oSina = oModel.getSina();
                oSina = oModel.sina;
                oDataSource = oModel.getDataSource();
                oRootDataSource = oSina.getRootDataSource();
                if (!oDataSource.equals(oRootDataSource) && oDataSource.type !== 'Category') {
                    //only proceed to test if we are inside a single data source, not 'all' and not a 'category'

                    oMetadata = oSina.getBusinessObjectMetaDataSync(oDataSource);
                    if (oMetadata && oMetadata.attributeMap) {
                        oAttributeMap = oMetadata.attributeMap;
                        for (key in oAttributeMap) {
                            if (!oAttributeMap.hasOwnProperty(key)) continue;
                            oAttribute = oAttributeMap[key];
                            if (oAttribute.label === "LOC_4326") {
                                bIfMaps = true;
                                break;
                            }
                        }
                    }
                }
            }

            return bIfMaps;
        },
        // display switch tap strips
        // ===================================================================
        assembleDisplaySwitchTapStrips: function() {
            var that = this;
            var items = [
                new sap.m.SegmentedButtonItem({
                    icon: "sap-icon://list",
                    tooltip: sap.ushell.resources.i18n.getText("displayList"),
                    key: "list"
                }),
                new sap.m.SegmentedButtonItem({
                    icon: "sap-icon://table-view",
                    tooltip: sap.ushell.resources.i18n.getText("displayTable"),
                    key: "table"
                })
            ];
            if (that.determineIfMaps(that)) {
                items.push(new sap.m.SegmentedButtonItem({
                    icon: "sap-icon://map",
                    tooltip: sap.ushell.resources.i18n.getText("displayMap"),
                    key: "map"
                }));
            }
            var oSegmentedButton = new sap.m.SegmentedButton('ResultViewType', {
                selectedKey: {
                    parts: [{
                        path: '/resultToDisplay'
                    }],
                    formatter: function(resultToDisplay) {
                        var res = "list";
                        if (resultToDisplay === "searchResultTable") {
                            res = "table";
                        } else if (resultToDisplay === "searchResultList") {
                            res = "list";
                        } else if (resultToDisplay === "searchResultMap") {
                            res = "map";
                        }
                        return res;
                    }
                },
                items: items,
                visible: {
                    parts: [{
                        path: '/displaySwitchVisibility'
                    }, {
                        path: '/count'
                    }],
                    formatter: function(displaySwitchVisibility, count) {
                        return displaySwitchVisibility && count !== 0;
                    }
                },
                /*eslint-disable no-extra-bind*/
                select: function(eObj) {
                    var key = eObj.mParameters.key;
                    var model = that.getModel();
                    switch (key) {
                        case "list":
                            model.setProperty('/resultToDisplay', "searchResultList");
                            that.showMoreFooter.setVisible(that.isShowMoreFooterVisible());
                            that.searchResultMap.setVisible(false);
                            break;
                        case "table":
                            model.setProperty('/resultToDisplay', "searchResultTable");
                            that.showMoreFooter.setVisible(that.isShowMoreFooterVisible());
                            that.searchResultMap.setVisible(false);
                            break;
                        case "map":
                            model.setProperty('/resultToDisplay', "searchResultMap");
                            //that.searchResultMap.setVisible(that.isShowMoreFooterVisible());
                            that.showMoreFooter.setVisible(false);
                            break;
                        default:
                            model.setProperty('/resultToDisplay', "searchResultList");
                            that.showMoreFooter.setVisible(that.isShowMoreFooterVisible());
                    }
                    model.enableOrDisableMultiSelection();
                }.bind(this)
            });

            oSegmentedButton.addStyleClass("sapUshellSearchDisplaySwitchTapStrips");

            return oSegmentedButton;
        },

        isShowMoreFooterVisible: function() {
            var model = this.getModel();
            return model.getProperty("/boCount") > model.getProperty("/boResults").length;
        },

        // center area
        // ===================================================================
        assembleCenterArea: function() {
            var that = this;

            // sort dialog
            that.tableSortDialog = that.assembleSearchResultSortDialog();

            // search result list
            var searchResultList = that.assembleSearchResultList();
            // search result table
            that.searchResultTable = that.assembleSearchResultTable();
            that.searchResultTable.addDelegate({
                onBeforeRendering: function() {
                    that.updateTableLayout();
                }
            });
            that.searchResultMap = that.assembleSearchResultMap();
            that.searchResultMap.setVisible(false);
            // app search result
            that.appSearchResult = that.assembleAppSearch();
            // show more footer
            that.showMoreFooter = that.assembleShowMoreFooter();

            return [that.tableSortDialog, searchResultList, that.searchResultTable, that.searchResultMap, that.appSearchResult, that.showMoreFooter];
        },

        // sort dialog
        // ===================================================================
        assembleSearchResultSortDialog: function() {
            var that = this;
            var tableSortDialog = new sap.m.ViewSettingsDialog({
                sortDescending: {
                    parts: [{
                        path: "/orderBy"
                    }],
                    formatter: function(orderBy) {
                        return jQuery.isEmptyObject(orderBy) || orderBy.sortOrder === "DESC";
                    }
                },
                confirm: function(evt) {
                    var mParams = [];
                    mParams = evt.getParameters();
                    if (mParams.sortItem) {
                        var oCurrentModel = that.getModel();
                        if (mParams.sortItem.getKey() === "ushellSearchDefaultSortItem") {
                            oCurrentModel.resetOrderBy();
                            tableSortDialog.setSortDescending(true);
                        } else {
                            oCurrentModel.setOrderBy({
                                orderBy: mParams.sortItem.getBindingContext().getObject().originalKey,
                                sortOrder: mParams.sortDescending === true ? "DESC" : "ASC"
                            });
                        }
                    }
                },
                cancel: function(evt) {
                    // reset slected value to the last sort column item
                    var lastSortColumnKey = that.getModel().getOrderBy().orderBy === undefined ? "ushellSearchDefaultSortItem" : that.getModel().getOrderBy().orderBy;
                    this.setSelectedSortItem(lastSortColumnKey);
                }
            });

            tableSortDialog.bindAggregation("sortItems", "/tableSortableColumns", function(path, bData) {
                return new sap.m.ViewSettingsItem({
                    key: "{key}",
                    originalKey: "{originalKey}",
                    text: "{name}",
                    selected: "{selected}" // Not binding because of setSlected in ItemPropertyChanged event
                });
            });

            return tableSortDialog;
        },

        // main result table
        // ===================================================================
        assembleSearchResultTable: function() {
            var that = this;
            var resultTable = new SearchResultTable("ushell-search-result-table", {
                mode: {
                    parts: [{
                        path: '/multiSelectionEnabled'
                    }],
                    formatter: function(multiSelectionEnabled) {
                        return multiSelectionEnabled === true ? sap.m.ListMode.MultiSelect : sap.m.ListMode.None;
                    }
                },
                //                fixedLayout: false,
                noDataText: '{i18n>noCloumnsSelected}',
                visible: {
                    parts: [{
                        path: '/resultToDisplay'
                    }, {
                        path: '/count'
                    }],
                    formatter: function(resultToDisplay, count) {
                        return resultToDisplay === "searchResultTable" && count !== 0;
                    }
                },
                rememberSelections: false
                //                ,
                //                selectionChange: function(event) {
                //                    // write "selected" into model
                //                    // UI5 has issue of two way binding
                //                    var items = event.getParameters().listItems;
                //                    var i;
                //                    if (event.getParameters().selected) {
                //                        for (i = 0; i < items.length; i++) {
                //                            items[i].getBindingContext().getObject().selected = true;
                //                        }
                //                    } else {
                //                        for (i = 0; i < items.length; i++) {
                //                            items[i].getBindingContext().getObject().selected = false;
                //                        }
                //                    }
                //                }
            });

            //            resultTable.addDelegate({
            //                onAfterRendering: function() {
            //                    // update "selected" from model
            //                    // UI5 has issue of two way binding
            //                    if (resultTable.getMode() === sap.m.ListMode.MultiSelect) {
            //                        var selectedTableItems = resultTable.getItems();
            //                        for (var i = 0; i < selectedTableItems.length; i++) {
            //                            if (selectedTableItems[i].getBindingContext().getObject().selected === true) {
            //                                selectedTableItems[i].setSelected(true);
            //                            } else {
            //                                selectedTableItems[i].setSelected(false);
            //                            }
            //                        }
            //                    }
            //                }
            //            });

            resultTable.bindAggregation("columns", "/tableColumns", function(path, bData) {
                var tableColumn = bData.getObject();
                var column = new sap.m.Column(tableColumn.key, {
                    header: new sap.m.Label({
                        text: "{name}",
                        tooltip: "{name}"
                    }),
                    visible: {
                        parts: [{
                            path: 'index'
                        }],
                        formatter: function(index) {
                            return index < 5; // first 5 attributes are visible, including title
                        }
                    }
                });
                return column;
            });

            resultTable.bindAggregation("items", "/tableResults", function(path, bData) {
                return that.assembleTableItems(bData);
            });

            resultTable.addEventDelegate({
                onAfterRendering: function() {
                    that.updatePersoServiceAndController();
                }
            });

            return resultTable;
        },

        // assemble search result table item
        // ===================================================================
        assembleTableItems: function(bData) {
            var that = this;
            var oData = bData.getObject();
            if (oData.type === 'footer') {
                //                that.showMoreFooter.setVisible(true);
                return new sap.m.CustomListItem({
                    visible: false
                }); // return empty list item
            } else {
                return that.assembleTableMainItems(oData, bData.getPath());
            }
        },

        assembleTableMainItems: function(oData, path) {
            var subPath = path + "/itemattributes";
            var columnListItem = new sap.m.ColumnListItem({
                // one way binding of "selected"
                // UI5 has issue of two way binding
                selected: "{selected}"
                //                selected: {
                //                    parts: [{
                //                        path: 'selected'
                //                    }],
                //                    formatter: function(selected) {
                //                        return selected;
                //                    }
                //                    ,
                //                    mode: sap.ui.model.BindingMode.OneWay
                //                }
            });
            columnListItem.bindAggregation("cells", subPath, function(subPath, bData) {
                if (bData.getObject().isTitle) {
                    // build title cell
                    var titleUrl = "";
                    var target;
                    var titleNavigation = bData.getObject().titleNavigation;
                    if (titleNavigation) {
                        titleUrl = titleNavigation.getHref();
                        target = titleNavigation.getTarget();
                    }
                    var enabled = (titleUrl && titleUrl.length > 0) ? true : false;
                    var titleLink = new SearchLink({
                        text: "{value}",
                        enabled: enabled,
                        href: titleUrl,
                        press: function() {
                            var titleNavigation = bData.getObject().titleNavigation;
                            if (titleNavigation) {
                                titleNavigation.trackNavigation();
                            }
                        }
                    });

                    // for tooltip handling
                    // see in SearchResultTable.onAfterRendering for event handlers
                    titleLink.addStyleClass("sapUshellSearchResultListItem-MightOverflow");

                    if (target) {
                        titleLink.setTarget(target);
                    }
                    return titleLink;
                } else if ((bData.getObject().isNavigationObjects)) {
                    // build related objects aka navigation objects cell
                    var navigationObjects = bData.getObject().navigationObjects;
                    var navigationButtons = [];
                    var navigationButton = {};
                    var pressButton = function(event, navigationObject) {
                        navigationObject.performNavigation();
                    };
                    /*eslint-disable no-loop-func*/
                    for (var i = 0; i < navigationObjects.length; i++) {
                        var navigationObject = navigationObjects[i];
                        navigationButton = new sap.m.Button({
                            text: navigationObject.getText(),
                            tooltip: navigationObject.getText()
                        });
                        navigationButton.attachPress(navigationObject, pressButton);
                        navigationButtons.push(navigationButton);
                    }
                    /*eslint-enable no-loop-func*/

                    return new sap.m.Button({
                        icon: "sap-icon://action",
                        press: function() {
                            var actionSheet = new sap.m.ActionSheet({
                                buttons: navigationButtons
                            });
                            actionSheet.openBy(this);
                        }
                    });
                } else {
                    // build other cells
                    return new SearchLabel({
                            text: "{value}"
                        })
                        // for tooltip handling
                        // see in SearchResultTable.onAfterRendering for event handlers
                        .addStyleClass("sapUshellSearchResultListItem-MightOverflow");
                }
            });

            return columnListItem;
        },
        // assemble show more table
        // ===================================================================

        onRegionClick: function(e) {
            //alert("onRegionClick " + e.getParameter("code"));
        },

        onRegionContextMenu: function(e) {
            //alert("onRegionContextMenu: " + e.getParameter("code"));
        },
        assembleSearchResultMap: function() {
            var oSearchResultMap = new SearchMap({
                visible: {
                    parts: [{
                        path: '/resultToDisplay'
                    }, {
                        path: '/count'
                    }],
                    formatter: function(resultToDisplay, count) {
                        return resultToDisplay === "searchResultMap" && count !== 0;
                    }
                }
            });
            return oSearchResultMap;
        },
        // assemble show more footer
        // ===================================================================
        assembleShowMoreFooter: function() {
            var that = this;
            var button = new sap.m.Button({
                text: "{i18n>showMore}",
                type: sap.m.ButtonType.Transparent,
                press: function() {
                    var oCurrentModel = that.getModel();
                    oCurrentModel.setProperty('/focusIndex', oCurrentModel.getTop());
                    var newTop = oCurrentModel.getTop() + oCurrentModel.pageSize;
                    oCurrentModel.setTop(newTop);
                }
            });
            button.addStyleClass('sapUshellResultListMoreFooter');
            var container = new sap.m.FlexBox({ /* footer item in model no longer needed -> remove*/
                visible: {
                    parts: [{
                        path: '/boCount'
                    }, {
                        path: '/boResults'
                    }],
                    formatter: function(boCount, boResults) {
                        //                        switch (resultToDisplay) {
                        //                            case 'searchResultTable':
                        //                                return tableResults.length < boCount;
                        //                            case 'searchResultList':
                        //                                return boResults.length < boCount;
                        //                        }
                        return boResults.length < boCount;
                    }
                },
                justifyContent: sap.m.FlexJustifyContent.Center
            });
            container.addStyleClass('sapUshellResultListMoreFooterContainer');
            container.addItem(button);
            return container;
        },

        // main result list
        // ===================================================================
        assembleSearchResultList: function() {

            var that = this;

            that.resultList = new SearchResultList({
                mode: sap.m.ListMode.None,
                width: "auto",
                showNoData: false,
                visible: {
                    parts: [{
                        path: '/resultToDisplay'
                    }, {
                        path: '/count'
                    }],
                    formatter: function(resultToDisplay, count) {
                        return resultToDisplay === "searchResultList" && count !== 0;
                    }
                }
            });

            that.resultList.bindAggregation("items", "/results", function(path, oContext) {
                return that.assembleListItem(oContext);
            });

            return that.resultList;
        },

        // app search area
        // ===================================================================
        assembleAppSearch: function() {

            var that = this;

            // tiles container
            var tileContainer = new sap.ushell.renderers.fiori2.search.controls.SearchTilesContainer({
                addAccInformation: true,
                maxRows: 99999,
                totalLength: '{/appCount}',
                visible: {
                    parts: [{
                        path: '/resultToDisplay'
                    }, {
                        path: '/count'
                    }],
                    formatter: function(resultToDisplay, count) {
                        return resultToDisplay === "appSearchResult" && count !== 0;
                    }
                },
                highlightTerms: '{/uiFilter/searchTerms}',
                showMore: function() {
                    var model = that.getModel();
                    model.setProperty('/focusIndex', tileContainer.getNumberDisplayedTiles() - 1);
                    var newTop = model.getTop() + model.pageSize * tileContainer.getTilesPerRow();
                    model.setTop(newTop);
                }
            });

            tileContainer.bindAggregation('tiles', '/appResults', function(sId, oContext) {
                return that.getTileView(oContext.getObject().tile);
            });
            tileContainer.addStyleClass('sapUshellSearchTileResultList');

            sap.ui.getCore().getEventBus().subscribe('searchLayoutChanged', function() {
                tileContainer.delayedRerender();
            }, this);

            return tileContainer;
        },

        // assemble title item
        // ===================================================================
        assembleTitleItem: function(oData) {
            var item = new sap.m.CustomListItem();
            var title = new sap.m.Label({
                text: "{title}"
            });
            title.addStyleClass('bucketTitle');
            item.addStyleClass('bucketTitleContainer');
            item.addContent(new sap.m.HBox({
                items: [title]
            }));
            return item;
        },

        // assemble app container result list item
        // ===================================================================
        assembleAppContainerResultListItem: function(oData, path) {
            var that = this;
            var container = new sap.ushell.renderers.fiori2.search.controls.SearchTilesContainer({
                maxRows: sap.ui.Device.system.phone ? 2 : 1,
                totalLength: '{/appCount}',
                highlightTerms: '{/uiFilter/searchTerms}',
                enableKeyHandler: false,
                resultList: that.resultList,
                showMore: function() {
                    var model = that.getModel();
                    model.setDataSource(model.appDataSource);
                }
            });
            container.bindAggregation('tiles', 'tiles', function(sId, oContext) {
                return that.getTileView(oContext.getObject().tile);
            });

            var listItem = new sap.m.CustomListItem({
                content: container
            });
            listItem.addStyleClass('sapUshellSearchResultListItem');
            listItem.addStyleClass('sapUshellSearchResultListItemApps');

            listItem.addEventDelegate({
                onAfterRendering: function(oEvent) {
                    var $listItem = $(listItem.getDomRef());
                    $listItem.removeAttr("tabindex");
                    $listItem.removeAttr("role");
                    $listItem.attr("aria-hidden", "true");
                }
            }, listItem);

            sap.ui.getCore().getEventBus().subscribe('searchLayoutChanged', function() {
                container.delayedRerender();
            }, this);

            return listItem;
        },

        // assemble search result list item
        // ===================================================================
        assembleResultListItem: function(oData, path) {
            /* eslint new-cap:0 */
            var dataSourceConfig = this.getModel().config.getDataSourceConfig(oData.dataSource);

            var searchResultListItemSettings = {
                title: "{$$Name$$}",
                titleUrl: "{uri}",
                titleNavigation: "{titleNavigation}",
                type: "{dataSourceName}",
                imageUrl: "{imageUrl}",
                suvlink: "{suvlink}",
                containsThumbnail: "{containsThumbnail}",
                containsSuvFile: "{containsSuvFile}",
                attributes: "{itemattributes}",
                navigationObjects: "{navigationObjects}",
                selected: "{selected}",
                expanded: "{expanded}"
            };

            var item;
            if (dataSourceConfig.searchResultListItemControl) {
                item = new dataSourceConfig.searchResultListItemControl(searchResultListItemSettings);
            } else if (dataSourceConfig.searchResultListItemContentControl) {
                searchResultListItemSettings.content = new dataSourceConfig.searchResultListItemContentControl();
                item = new CustomSearchResultListItem(searchResultListItemSettings);
            } else {
                item = new SearchResultListItem(searchResultListItemSettings);
            }

            var listItem = new sap.m.CustomListItem({
                content: item
            });
            listItem.addStyleClass('sapUshellSearchResultListItem');

            if (item.setParentListItem) {
                item.setParentListItem(listItem);
            }

            return listItem;
        },

        // assemble search result list item
        // ===================================================================
        assembleListItem: function(oContext) {
            var that = this;
            var oData = oContext.getObject();
            if (oData.type === 'title') {
                return that.assembleTitleItem(oData);
            } else if (oData.type === 'footer') {
                //                that.showMoreFooter.setVisible(true);
                return new sap.m.CustomListItem(); // return empty list item
            } else if (oData.type === 'appcontainer') {
                return that.assembleAppContainerResultListItem(oData, oContext.getPath());
            } else {
                return that.assembleResultListItem(oData, oContext.getPath());
            }
        },


        // get tile view
        // ===================================================================
        getTileView: function(tile) {
            // try to set render mode as tile
            try {
                var typesContract = tile.getContract('types');
                typesContract.setType('tile');
            } catch (e) { /* nothing to do.. */ }
            // create view
            var view = sap.ushell.Container.getService('LaunchPage').getCatalogTileView(tile);
            // add event logging info
            var targetUrl = sap.ushell.Container.getService('LaunchPage').getCatalogTileTargetURL(tile);
            var title = 'app';
            if (tile.getTitle) {
                title = tile.getTitle();
            }
            view.eventLoggingData = {
                targetUrl: targetUrl,
                title: title
            };
            return view;
        },

        // event handler search started
        // ===================================================================
        onAllSearchStarted: function() {
            //            var that = this;
            //            that.showMoreFooter.setVisible(false);
        },

        // event handler search finished
        // ===================================================================
        onAllSearchFinished: function() {
            var that = this;
            that.reorgTabBarSequence();
            that.oFocusHandler.setFocus();
            //that.updatePersoServiceAndController();
            var viewPortContainer = sap.ui.getCore().byId('viewPortContainer');
            if (viewPortContainer && viewPortContainer.switchState) {
                viewPortContainer.switchState('Center');
            }
        },

        updatePersoServiceAndController: function() {
            var that = this;
            var model = that.getModel();
            var dsKey = model.getDataSource().key;

            if (!that.oTablePersoController) {
                var personalizationStorageInstance = model.getPersonalizationStorageInstance();
                that.oTablePersoController = new sap.m.TablePersoController({
                    table: sap.ui.getCore().byId("ushell-search-result-table"),
                    persoService: personalizationStorageInstance.getPersonalizer('search-result-table-state-' + dsKey)
                }).activate();
                that.oTablePersoController.refresh();
            }
            if (that.oTablePersoController &&
                that.oTablePersoController.getPersoService().getKey() !== 'search-result-table-state-' + dsKey) {
                that.oTablePersoController.setPersoService(model.getPersonalizationStorageInstance().getPersonalizer('search-result-table-state-' + dsKey));
                that.oTablePersoController.refresh();
            }
        },

        // set table layout
        // fixed or NOT fixed
        // ===================================================================
        updateTableLayout: function() {
            var that = this;
            if (that.searchResultTable) {
                var columns = that.searchResultTable.getColumns();
                var visibleCloumns = 0;
                for (var i = 0; i < columns.length; i++) {
                    if (columns[i].getVisible()) {
                        visibleCloumns++;
                    }
                }
                if (visibleCloumns <= 3) {
                    that.searchResultTable.setFixedLayout(false);
                } else {
                    that.searchResultTable.setFixedLayout(true);
                }
            }
        },


        // set appview container
        // ===================================================================
        setAppView: function(oAppView) {
            var that = this;
            that.oAppView = oAppView;
            if (that.oTilesContainer) {
                that.oTilesContainer.setAppView(oAppView);
            }
        },

        // get controller name
        // ===================================================================
        getControllerName: function() {
            return "sap.ushell.renderers.fiori2.search.container.Search";
        }
    });
});
