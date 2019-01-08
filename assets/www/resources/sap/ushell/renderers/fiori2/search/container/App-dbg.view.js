// iteration 0 ok
/* global jQuery, sap, window, console, document */

// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview
 *
 * @version
 */

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/SearchModel',
    'sap/ushell/renderers/fiori2/search/SearchShellHelper',
    'sap/m/Bar', 'sap/ushell/renderers/fiori2/search/SearchHelper',
    'sap/ushell/renderers/fiori2/search/controls/SearchFilterBar'
], function(SearchModel, SearchShellHelper, Bar, SearchHelper, SearchFilterBar) {
    "use strict";

    return sap.ui.jsview("sap.ushell.renderers.fiori2.search.container.App", {

        createContent: function() {
            var that = this;

            // create search model
            if (!this.oModel) {
                this.oModel = sap.ushell.renderers.fiori2.search.getModelSingleton();
            }
            this.setModel(sap.ushell.resources.i18nModel, "i18n");

            // search result screen
            this.oSearchResults = sap.ui.view({
                id: "searchContainerResultsView",
                tooltip: "{i18n>searchResultsView_tooltip}",
                viewName: "sap.ushell.renderers.fiori2.search.container.Search",
                type: sap.ui.core.mvc.ViewType.JS
            });
            this.oSearchResults.setModel(that.oModel);
            this.oSearchResults.setAppView(that);

            // search bar
            var searchBar = new sap.m.Bar({
                contentLeft: [
                    that.oSearchResults.assembleFilterButton(),
                    that.oSearchResults.assembleDataSourceTapStrips()
                ],
                contentRight: that.oSearchResults.assembleSearchToolbar()
            });
            searchBar.addStyleClass('sapUshellSearchBar');

            // filter contextual bar
            var filterBar = new sap.ushell.renderers.fiori2.search.controls.SearchFilterBar({
                visible: {
                    parts: [{
                        path: '/facetVisibility'
                    }, {
                        path: '/uiFilter/defaultConditionGroup'
                    }],
                    formatter: function(facetVisibility, filterConditions) {
                        if (!facetVisibility &&
                            filterConditions &&
                            filterConditions.conditions &&
                            filterConditions.conditions.length > 0) {
                            return true;
                        } else {
                            return false;
                        }
                    }
                }
            });


            // deserialze URL
            this.oModel.deserializeURL();

            // create page
            this.oPage = this.pageFactory("searchPage", this.oSearchResults, searchBar, filterBar);

            // reorg tab strips
            this.oSearchResults.reorgTabBarSequence();

            return this.oPage;
        },

        beforeExit: function() {

        },

        pageFactory: function(sId, oControl, header, subHeader) {
            var that = this;

            var oPage = new sap.m.Page({
                id: sId,
                customHeader: header,
                subHeader: subHeader,
                content: [oControl],
                enableScrolling: true,
                showFooter: {
                    parts: ['/multiSelectionAvailable', '/multiSelectionActions', '/errors/length'],
                    formatter: function(multiSelectionAvailable, multiSelectionActions, numberErrors) {
                        return multiSelectionAvailable || numberErrors > 0;
                    }
                },
                showHeader: true,
                showSubHeader: {
                    parts: [{
                        path: '/facetVisibility'
                    }, {
                        path: '/uiFilter/defaultConditionGroup'
                    }],
                    formatter: function(facetVisibility, filterConditions) {
                        if (!facetVisibility &&
                            filterConditions &&
                            filterConditions.conditions &&
                            filterConditions.conditions.length > 0) {
                            return true;
                        } else {
                            return false;
                        }
                    }
                }
            });
            oPage.setModel(that.oModel);

            // who is using these events? Necessary? //TODO
            var aEvents = ["onAfterHide", "onAfterShow", "onBeforeFirstShow",
                "onBeforeHide", "onBeforeShow"
            ];
            var oDelegates = {};

            that.createFooter(oPage);

            // Pass navigation container events to children.
            jQuery.each(aEvents, function(iIndex, sEvent) {
                oDelegates[sEvent] = jQuery.proxy(function(evt) {
                    jQuery.each(this.getContent(), function(iIndex, oControl) {
                        /*jslint nomen: true */
                        oControl._handleEvent(evt);
                    });
                }, oPage);
            });

            oPage.addEventDelegate(oDelegates);
            if (!sap.ui.Device.system.desktop) {
                oPage._bUseIScroll = true;
            }
            //            if (false) {
            //                this.disableBouncing(oPage);
            //            }

            return oPage;
        },

        getControllerName: function() {
            return "sap.ushell.renderers.fiori2.search.container.App";
        },

        createFooter: function(oPage) {

            var that = this;

            // no footer on phone
            if (jQuery.device.is.phone) {
                return;
            }

            // button which enables multi-selection-mode
            var oMultiSelectionButton = new sap.m.ToggleButton({
                icon: "sap-icon://multi-select",
                tooltip: sap.ushell.resources.i18n.getText("toggleSelectionModeBtn"),
                press: function() {

                    var content = that.oBar.getContent();
                    var i, control;

                    if (this.getPressed()) {
                        that.oSearchResults.resultList.enableSelectionMode();
                        that.oModel.setProperty("/multiSelectionEnabled", true);

                        for (i = 0; i < content.length; i++) {
                            control = content[i];
                            if (control.hasStyleClass("sapUshellSearchResultList-multiSelectionActionButton")) {
                                that.oBar.removeContent(control);
                            }
                        }

                        var dataSource = that.oModel.getDataSource();
                        var dataSourceConfig = that.oModel.config.getDataSourceConfig(dataSource);
                        /* eslint new-cap:0 */
                        var selectionHandler = new dataSourceConfig.searchResultListSelectionHandlerControl();

                        var actions = selectionHandler.actionsForDataSource();
                        that.oModel.setProperty("/multiSelectionActions", actions);
                        // if one cannot program performant, at least take the blame in style
                        /*eslint-disable no-loop-func*/
                        for (i = 0; i < actions.length; i++) {
                            var action = actions[i];
                            var actionButton = new sap.m.Button({
                                text: action.text,
                                press: function() {
                                    var results = that.oModel.getProperty("/results");
                                    var selectedItems = [];
                                    for (var i = 0; i < results.length; i++) {
                                        var item = results[i];
                                        if (item.selected) {
                                            selectedItems.push(item);
                                        }
                                    }

                                    action.action(selectedItems);
                                },
                                visible: {
                                    parts: [{
                                        path: '/multiSelectionEnabled'
                                    }],
                                    mode: sap.ui.model.BindingMode.OneWay
                                }
                            });
                            actionButton.setModel(that.oModel);
                            actionButton.addStyleClass("sapUshellSearchResultList-multiSelectionActionButton");
                            that.oBar.insertContent(actionButton, 2);
                        }
                        /*eslint-enable no-loop-func*/
                    } else {
                        var disablePromise = that.oSearchResults.resultList.disableSelectionMode();
                        disablePromise.done(function() {
                            that.oModel.setProperty("/multiSelectionEnabled", false);
                            that.oModel.setProperty("/multiSelectionActions", undefined);

                            var results = that.oModel.getProperty("/boResults");
                            if (results) {
                                for (var j = 0; j < results.length; j++) {
                                    var result = results[j];
                                    result.selected = false;
                                }
                            }

                            for (i = 0; i < content.length; i++) {
                                control = content[i];
                                if (control.hasStyleClass("sapUshellSearchResultList-multiSelectionActionButton")) {
                                    that.oBar.removeContent(control);
                                }
                            }
                        });
                    }
                },
                visible: {
                    parts: [{
                        path: '/multiSelectionAvailable'
                    }],
                    mode: sap.ui.model.BindingMode.OneWay
                }
            });
            oMultiSelectionButton.setModel(this.oModel);
            oMultiSelectionButton.addStyleClass("sapUshellSearchResultList-toggleMultiSelectionButton");

            // create error message popover
            var oErrorPopover = new sap.m.MessagePopover({
                placement: "Top"
            });
            oErrorPopover.setModel(this.oModel);

            oErrorPopover.bindAggregation("items", "/errors", function(sId, oContext) {
                var item = new sap.m.MessagePopoverItem({
                    title: "{title}",
                    description: "{description}"
                });
                switch (oContext.oModel.getProperty(oContext.sPath).type.toLowerCase()) {
                    case "error":
                        item.setType(sap.ui.core.MessageType.Error);
                        break;
                    case "warning":
                        item.setType(sap.ui.core.MessageType.Warning);
                        break;
                    default:
                        item.setType(sap.ui.core.MessageType.Information);
                }
                return item;
            });

            // create error message popover button
            var oErrorButton = new sap.m.Button("searchErrorButton", {
                //icon: 'sap-icon://action',
                icon: sap.ui.core.IconPool.getIconURI("alert"),
                text: {
                    parts: [{
                        path: '/errors/length'
                    }],
                    formatter: function(length) {
                        return length;
                    }
                },
                visible: {
                    parts: [{
                        path: '/errors/length'
                    }],
                    formatter: function(length) {
                        return length > 0;
                    },
                    mode: sap.ui.model.BindingMode.OneWay
                },
                type: sap.m.ButtonType.Emphasized,
                tooltip: sap.ushell.resources.i18n.getText('errorBtn'),
                press: function() {
                    oErrorPopover.openBy(oErrorButton);
                }
            });

            oErrorButton.addDelegate({
                onAfterRendering: function() {
                    if (!that.oModel.getProperty('/isErrorPopovered')) {
                        oErrorButton.firePress();
                        that.oModel.setProperty('/isErrorPopovered', true);
                    }
                }
            });

            oErrorButton.setLayoutData(new sap.m.OverflowToolbarLayoutData({
                priority: sap.m.OverflowToolbarPriority.NeverOverflow
            }));

            oMultiSelectionButton.setLayoutData(new sap.m.OverflowToolbarLayoutData({
                priority: sap.m.OverflowToolbarPriority.NeverOverflow
            }));

            var content = [
                oErrorButton,
                new sap.m.ToolbarSpacer(),
                oMultiSelectionButton
            ];

            // create footer bar
            that.oBar = new sap.m.OverflowToolbar({
                content: content
            }).addStyleClass("MyBar");

            //destroy footer if available
            var oFooter = oPage.getFooter();
            if (oFooter && oFooter.destroy) {
                oFooter.destroy();
            }

            oPage.setFooter(that.oBar);
        }
    });
});
