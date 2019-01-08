/* global $, jQuery, sap, window, document */

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/SearchFacetDialogHelper',
    'sap/ushell/renderers/fiori2/search/SearchFacetDialogHelperCharts',
    'sap/ushell/renderers/fiori2/search/controls/SearchAdvancedCondition',
    'sap/m/Dialog'
], function(searchFacetDialogHelper, searchFacetDialogHelperCharts) {
    "use strict";

    sap.m.Dialog.extend('sap.ushell.renderers.fiori2.search.controls.SearchFacetDialog', {
        constructor: function(options) {
            var that = this;
            that.bShowCharts = true; //change this to completely turn off charts in show more dialog
            that.bOldPieChart = true;
            if (jQuery.sap.getUriParameters().mParams.newpie && jQuery.sap.getUriParameters().get("newpie") !== "false") {
                that.bOldPieChart = false;
            }
            that.chartOnDisplayIndex = options.selectedTabBarIndex; //charts
            that.facetOnDisplayIndex = 0; //charts
            that.chartOnDisplayIndexByFilterArray = []; //charts
            that.aItemsForBarChart = []; //charts
            that.tabBarItems = options.tabBarItems; //charts
            that.searchFacetDialogHelperCharts = searchFacetDialogHelperCharts;
            if (!that.tabBarItems) {
                searchFacetDialogHelperCharts.setDummyTabBarItems(that);
            }

            options = jQuery.extend({}, {
                showHeader: false,
                horizontalScrolling: false,
                verticalScrolling: false,
                contentHeight: '35rem',
                beginButton: new sap.m.Button({
                    text: sap.ushell.resources.i18n.getText("okDialogBtn"),
                    press: function(oEvent) {
                        that.onOkClick(oEvent);
                        that.close();
                        that.destroy();
                    }
                }),
                endButton: new sap.m.Button({
                    text: sap.ushell.resources.i18n.getText("cancelDialogBtn"),
                    press: function(oEvent) {
                        that.close();
                        that.destroy();
                    }
                }),
                content: [that.createContainer()]
            }, options);

            that.selectedAttribute = options.selectedAttribute ? options.selectedAttribute : "";

            //cleanup before applying options to sap.m.Dialog constructor  avr
            delete options.selectedAttribute;
            delete options.selectedTabBarIndex;
            delete options.tabBarItems;

            sap.m.Dialog.prototype.constructor.apply(this, [options]);

            searchFacetDialogHelper.init(that);
            searchFacetDialogHelperCharts.init(that);

            that.addStyleClass('sapUshellSearchFacetDialog');
        },
        renderer: 'sap.m.DialogRenderer',
        createContainer: function() {
            var that = this;

            //create SplitContainer with masterPages
            that.oSplitContainer = new sap.m.SplitContainer({
                masterPages: that.createMasterPages()
            });

            //binding detailPages in SplitContainer
            that.oSplitContainer.bindAggregation("detailPages", "/facetDialog", function(sId, oContext) {
                return that.createDetailPages(sId, oContext);
            });

            that.oSplitContainer.addStyleClass('sapUshellSearchFacetDialogContainer');

            return that.oSplitContainer;
        },
        //create masterPages in splitContainer
        createMasterPages: function() {
            var that = this;
            //create facet list
            var oFacetList = new sap.m.List({
                mode: sap.m.ListMode.SingleSelectMaster,
                selectionChange: function(oEvent) {
                    that.onMasterPageSelectionChange(oEvent);
                }
            });
            oFacetList.addStyleClass('sapUshellSearchFacetDialogFacetList');
            oFacetList.bindAggregation("items", "/facetDialog", function(sId, oContext) {
                var oListItem = new sap.m.StandardListItem({
                    title: "{title}",
                    counter: "{count}"
                });
                return oListItem;
            });
            //create a scrollContainer, content is the facet list
            var oResetButton = new sap.m.Button({
                icon: "sap-icon://clear-filter",
                tooltip: sap.ushell.resources.i18n.getText("resetFilterButton_tooltip"),
                type: 'Transparent',
                enabled: false,
                press: function(oEvent) {
                    that.resetAllFilters(oEvent);
                }
            });
            oResetButton.addStyleClass("sapUshellSearchFacetDialogFilterResetButton");

            var oMasterPage = new sap.m.Page({
                title: sap.ushell.resources.i18n.getText("filters"),
                headerContent: oResetButton,
                content: [oFacetList]
            }).addStyleClass('sapUshellSearchFacetDialogMasterContainer');

            oMasterPage.addEventDelegate({
                onAfterRendering: function(oEvent) {
                    if (that.selectedAttribute) {
                        for (var i = 0; i < oFacetList.getItems().length; i++) {
                            var oListItem = oFacetList.getItems()[i];
                            var oBindingObject = oListItem.getBindingContext().getObject();
                            if (that.selectedAttribute === oBindingObject.dimension) {
                                oFacetList.setSelectedItem(oListItem);
                                that.facetOnDisplayIndex = i;
                                that.chartOnDisplayIndexByFilterArray.push(that.chartOnDisplayIndex); //avr initial setting of array
                            } else {
                                var n = 0;
                                var ar = oListItem.getBindingContext().getModel().oData.facets;
                                for (var j = 0; j < ar.length; j++) {
                                    if (ar[j].chartIndex && ar[j].dimension === oBindingObject.dimension && !isNaN(ar[j].chartIndex)) {
                                        n = ar[j].chartIndex;
                                    }
                                }
                                that.chartOnDisplayIndexByFilterArray.push(n); //avr initial setting of array
                            }
                        }
                    }
                    if (!oFacetList.getSelectedItem()) {
                        oFacetList.setSelectedItem(oFacetList.getItems()[0]);
                    }
                    var oSelectedItem = oFacetList.getSelectedItem();
                    searchFacetDialogHelper.updateDetailPage(oSelectedItem, null, true);

                    that.resetEnabledForFilterResetButton();

                }
            });
            //masterPages has only one page
            var oMasterPages = [oMasterPage];
            return oMasterPages;
        },
        resetAllFilters: function(oEvent) {
            //if 'show selected on top' is checked, uncheck
            var $checkbox = $(".sapUshellSearchFacetDialogSettingsContainer").find(".sapMCbBg.sapMCbHoverable.sapMCbMark");
            if ($checkbox.length === 1) {
                var id = $checkbox[0].parentNode.id;
                var oCheckbox = sap.ui.getCore().byId(id);
                oCheckbox.setSelected(false);
                oCheckbox.setEnabled(false);
            }


            var oModel = this.getModel();

            oModel.aFilters = [];
            //oModel.resetFilterConditions();
            //oModel.resetFacetQueryFilterConditions();
            //oModel.resetChartQueryFilterConditions();
            //none of the above work since selections in all lists are physically counted to addFilterCondition
            searchFacetDialogHelper.bResetFilterIsActive = true;

            var oMasterPageList = searchFacetDialogHelper.getFacetList();
            var aFacets = oMasterPageList.getItems();
            for (var j = 0; j < aFacets.length; j++) {
                aFacets[j].setCounter(0);
            }
            this.resetAdvancedConditionFilters();

            searchFacetDialogHelper.resetChartQueryFilters();

            searchFacetDialogHelper.updateDetailPage(oMasterPageList.getSelectedItem());


            this.resetEnabledForFilterResetButton();

            searchFacetDialogHelper.bResetFilterIsActive = false;



        },
        resetAdvancedConditionFilters: function() {
            var that = this;
            var oAdvancedContainer, condition1, n1, n2, oParent, oChild, j;
            var oDetailPages = that.oSplitContainer.getDetailPages();
            for (var i = 0; i < oDetailPages.length; i++) {
                var oDetailPage = oDetailPages[i];
                n1 = searchFacetDialogHelper.POS_ATTRIBUTE_LIST_CONTAINER;
                oAdvancedContainer = oDetailPage.getContent()[n1]; //for numbers, dates etc, not strings or texts

                if (oAdvancedContainer) {
                    for (j = oAdvancedContainer.getContent().length - 2; j > 0; j--) {
                        condition1 = oAdvancedContainer.getContent()[j];
                        oParent = condition1.getParent();
                        oChild = condition1;
                        oParent.removeContent(oChild);
                    }

                } else {
                    n1 = searchFacetDialogHelper.POS_ICONTABBAR;
                    n2 = searchFacetDialogHelper.POS_TABBAR_CONDITION;
                    oAdvancedContainer = oDetailPage.getContent()[n1].getItems()[n2].getContent()[0]; //for numbers, dates etc, not strings or texts
                    if (oAdvancedContainer) {
                        for (j = oAdvancedContainer.getContent().length - 1; j > -1; j--) {
                            condition1 = oAdvancedContainer.getContent()[j];
                            if (condition1.getContent && condition1.getContent()[1]) {
                                var conditionItem = condition1.getContent()[1].getContent()[1]; //condition1 = [a box, a layout, and an x button]
                                var conditionValue = conditionItem.getValue();
                                if (conditionValue && ("" + conditionValue).length > 0) {
                                    oParent = condition1.getParent();
                                    oChild = condition1;
                                    oParent.removeContent(oChild);
                                }
                            }
                        }
                    }
                }
            }
        },
        resetEnabledForFilterResetButton: function(bForceEnabled) {
            var bFiltersExist = false;
            var overallCounter = 0;
            var oMasterPageList = searchFacetDialogHelper.getFacetList();
            var aFacets = oMasterPageList.getItems();
            for (var i = 0; i < aFacets.length; i++) {
                overallCounter += aFacets[i].getCounter();
            }
            var oModel = this.getModel();
            if (oModel.aFilters && oModel.aFilters.length > 0 || bForceEnabled || overallCounter > 0) {
                bFiltersExist = true;
            }
            var id = $('.sapUshellSearchFacetDialogFilterResetButton')[0].id;
            var oResetButton = sap.ui.getCore().byId(id);
            oResetButton.setEnabled(bFiltersExist);
        },
        //event: select listItems in masterPage
        onMasterPageSelectionChange: function(oEvent) {
            var that = this;
            var oListItem = oEvent.mParameters.listItem;
            that.facetOnDisplayIndex = oListItem.getParent().indexOfItem(oListItem.getParent().getSelectedItem());
            that.setChartOnDisplayIndexForFacetListItem(that.facetOnDisplayIndex);
            var oModel = oListItem.getParent().getModel();
            var sBindingPath = oListItem.getBindingContext().sPath;
            that.resetIcons(oModel, sBindingPath, that);
            searchFacetDialogHelper.updateDetailPage(oListItem);
            if (that.oSplitContainer.getMode() === "ShowHideMode") {
                that.oSplitContainer.hideMaster();
            }
            that.controlChartVisibility(that, that.chartOnDisplayIndex);
        },

        //create detailPage in splitContainer, using data binding
        createDetailPages: function(sId, oContext) {
            var that = this;
            var sFacetType = oContext.oModel.getProperty(oContext.sPath).facetType;
            var sDataType = oContext.oModel.getAttributeDataType(oContext.oModel.getProperty(oContext.sPath).dataType);

            //create a settings container with select and checkBox, initial is not visible
            var oSelect = new sap.m.Select({
                items: [
                    new sap.ui.core.Item({
                        text: sap.ushell.resources.i18n.getText("notSorted"),
                        key: "notSorted"
                    }),
                    new sap.ui.core.Item({
                        text: sap.ushell.resources.i18n.getText("sortByCount"),
                        key: "sortCount"
                    }),
                    new sap.ui.core.Item({
                        text: sap.ushell.resources.i18n.getText("sortByName"),
                        key: "sortName"
                    })
                ],
                selectedKey: (sDataType === "string" || sDataType === "text") ? "sortCount" : "notSorted",
                change: function(oEvent) {
                    that.onSelectChange(oEvent);
                }
            }).addStyleClass('sapUshellSearchFacetDialogSettingsSelect');
            var oHBox = new sap.m.HBox({
                alignItems: sap.m.FlexAlignItems.End,
                justifyContent: sap.m.FlexJustifyContent.End,
                items: [oSelect]
            });
            var oCheckBox = new sap.m.CheckBox({
                text: sap.ushell.resources.i18n.getText("showSelectedOnTop"),
                enabled: false,
                select: function(oEvent) {
                    that.onCheckBoxSelect(oEvent);
                }
            });
            //            var oSettings = new sap.ui.layout.VerticalLayout({
            //                content: [oSelect, oCheckBox]
            //            }).addStyleClass('sapUshellSearchFacetDialogSettingsContainer');
            var oSettings = new sap.m.VBox({
                items: [oHBox, oCheckBox]
            }).addStyleClass('sapUshellSearchFacetDialogSettingsContainer');
            oSettings.setVisible(false);

            //create the attribute list for each facet
            var oList = new sap.m.List({
                backgroundDesign: sap.m.BackgroundDesign.Transparent,
                includeItemInSelection: true,
                showNoData: false,
                showSeparators: sap.m.ListSeparators.None,
                selectionChange: function(oEvent) {
                    that.onDetailPageSelectionChange(oEvent);
                }
            });
            oList.addStyleClass('sapUshellSearchFacetDialogDetailPageList');
            oList.addStyleClass('largeChart0');

            if (sFacetType === "attribute") {
                oList.setMode(sap.m.ListMode.MultiSelect);
            }
            var oBindingInfo = {
                path: "items",
                factory: function(sId, oContext) {
                    var oBinding = oContext.oModel.getProperty(oContext.sPath);
                    var oListItem = new sap.m.StandardListItem({
                        title: "{label}",
                        tooltip: sap.ushell.resources.i18n.getText("facetListTooltip", ["{label}", "{value}"]),
                        info: "{valueLabel}",
                        selected: "{selected}"
                    });

                    //prepare the local filterConditions array in facet dialog
                    if (oBinding.selected) {
                        oContext.oModel.addFilter(oBinding);
                    }

                    return oListItem;
                }
            };
            if (sDataType === "number") {
                oSelect.removeItem(2);
            }
            oBindingInfo.filters = new sap.ui.model.Filter("advanced", sap.ui.model.FilterOperator.NE, true);
            oList.bindAggregation("items", oBindingInfo);
            oList.setBusyIndicatorDelay(0);
            oList.data('dataType', sDataType);
            if (that.bShowCharts) {
                oList.addEventDelegate({
                    onAfterRendering: function(oEvent) {
                        that.hideSelectively(oEvent, that, 0);
                    }
                });
            }
            var oListContainer, oChartPlaceholder1, oChartPlaceholder2;
            oChartPlaceholder1 = searchFacetDialogHelperCharts.getBarChartPlaceholder();
            oChartPlaceholder1.addEventDelegate({
                onAfterRendering: function(oEvent) {
                    that.hideSelectively(oEvent, that, 1);
                }
            });

            oChartPlaceholder1.data('dataType', sDataType);
            if (that.bOldPieChart) {
                oChartPlaceholder2 = searchFacetDialogHelperCharts.getPieChartPlaceholder();
            } else {
                oChartPlaceholder2 = {}; //searchFacetDialogHelperCharts.getPieChartPlaceholder2();
            }
            oChartPlaceholder2.addEventDelegate({
                onAfterRendering: function(oEvent) {
                    that.hideSelectively(oEvent, that, 2);
                }
            });

            if (that.bShowCharts && (sDataType === "string" || sDataType === "text")) {
                oListContainer = new sap.m.ScrollContainer({
                    height: '67.2%',
                    horizontal: false,
                    vertical: true,
                    content: [oList, oChartPlaceholder1, oChartPlaceholder2]
                });
            } else {
                oListContainer = new sap.m.ScrollContainer({
                    height: 'calc(100% - 0.25rem)',
                    horizontal: false,
                    vertical: true,
                    content: [oList]
                });
            }

            oListContainer.addStyleClass('sapUshellSearchFacetDialogDetailPageListContainer');
            oListContainer.addStyleClass('searchFacetLargeChartContainer');

            //create advanced search
            var oAdvancedCondition = new sap.ushell.renderers.fiori2.search.controls.SearchAdvancedCondition({
                type: sDataType,
                odata2: (oContext.oModel.config.odataProvider || oContext.oModel.config.sinaProvider === 'ODATA2')
            });

            var oPage;
            if (sDataType === "string" || sDataType === "text") {
                var oAdvancedContainer = new sap.m.ScrollContainer({
                    horizontal: false,
                    vertical: true,
                    content: [oAdvancedCondition]
                });
                oAdvancedContainer.addStyleClass('sapUshellSearchFacetDialogDetailPageAdvancedContainer');
                var oPlusButton = new sap.m.Button({
                    icon: "sap-icon://add",
                    type: sap.m.ButtonType.Transparent,
                    press: function(oEvent) {
                        that.onPlusButtonPress(oEvent, sDataType);
                    }
                });
                oAdvancedContainer.addContent(oPlusButton);
                oAdvancedContainer.data('dataType', sDataType);
                oAdvancedContainer.data('initial', true);
                //create a page for type string or text, content include settings container and attribute list, head toolbar has a setting button and a search field
                oListContainer.setHeight('calc(100% - 0.25rem)');
                oAdvancedContainer.setHeight('100%');
                var oChartSelectionButton = searchFacetDialogHelperCharts.getDropDownButton(that);
                var subheader = new sap.m.Toolbar({
                    content: [
                        new sap.m.SearchField({
                            //showSearchButton: false,
                            placeholder: sap.ushell.resources.i18n.getText("filterPlaceholder"),
                            liveChange: function(oEvent) {
                                that.onSearchFieldLiveChange(oEvent);
                            }
                        }),
                        new sap.m.ToggleButton({
                            icon: "sap-icon://sort",
                            press: function(oEvent) {
                                that.onSettingButtonPress(oEvent);
                            }
                        }).addStyleClass('sapUshellSearchFacetDialogSortButton')
                    ]
                }).addStyleClass('sapUshellSearchFacetDialogSubheaderToolbar');
                subheader.addEventDelegate({
                    onAfterRendering: function(oEvent) {
                        $('.sapUshellSearchFacetDialogSubheaderToolbar').removeClass("sapContrastPlus");
                    }
                });
                if (that.bShowCharts) {
                    subheader.addContent(oChartSelectionButton);
                }
                var oTabListPage = new sap.m.Page({
                    showHeader: false,
                    subHeader: subheader,
                    content: [oSettings, oListContainer]
                }).addStyleClass('sapUshellSearchFacetDialogDetailPage');
                var oIconTabBar = new sap.m.IconTabBar({
                    //                    upperCase: true,
                    expandable: false,
                    stretchContentHeight: true,
                    backgroundDesign: sap.m.BackgroundDesign.Transparent,
                    applyContentPadding: false,
                    select: function(oEvent) {
                        that.controlChartVisibility(that, that.chartOnDisplayIndex);
                    },
                    items: [
                        new sap.m.IconTabFilter({
                            text: sap.ushell.resources.i18n.getText("selectFromList"),
                            content: [oTabListPage]
                        }),
                        new sap.m.IconTabFilter({
                            text: sap.ushell.resources.i18n.getText("defineCondition"),
                            content: [oAdvancedContainer]
                        })
                    ]
                });
                oIconTabBar.addStyleClass('sapUshellSearchFacetDialogIconTabBar');
                oPage = new sap.m.Page({
                    showHeader: true,
                    title: oContext.oModel.getProperty(oContext.sPath).title,
                    content: [oIconTabBar]
                });
                oPage.addStyleClass('sapUshellSearchFacetDialogDetailPageString');
            } else {
                oListContainer.addContent(oAdvancedCondition);
                oListContainer.data('dataType', sDataType);
                oListContainer.data('initial', true);
                //create a page for type number or date
                if (that.bShowCharts) {
                    var title = oContext.oModel.getProperty(oContext.sPath).title;
                    oPage = new sap.m.Page({
                        title: title,
                        showHeader: true,
                        content: [oSettings, oListContainer]
                    });
                } else {
                    oPage = new sap.m.Page({
                        showHeader: true,
                        title: oContext.oModel.getProperty(oContext.sPath).title,
                        content: [oSettings, oListContainer]
                    });
                }
                oPage.addStyleClass('sapUshellSearchFacetDialogDetailPage');
            }

            return oPage;
        },

        //event: select listItems in detailPages
        onDetailPageSelectionChange: function(oEvent) {
            var that = this;

            var oSelectedItem = oEvent.mParameters.listItem;
            //            var sSelectedBindingPath = oSelectedItem.getBindingContext().sPath + "/selected";
            //            oSelectedItem.getBindingContext().oModel.setProperty(sSelectedBindingPath, oSelectedItem.getSelected());

            //update aFilters
            var oBindingObject = oSelectedItem.getBindingContext().getObject();
            if (oSelectedItem.getSelected()) {
                oBindingObject.listed = true;
                that.getModel().addFilter(oBindingObject);
            } else {
                oBindingObject.listed = false;
                that.getModel().removeFilter(oBindingObject);
            }

            //update the count info in masterPageList
            var oList = oEvent.oSource;
            var oDetailPage;
            if (oList.data('dataType') === "string" || oList.data('dataType') === "text") {
                oDetailPage = oList.getParent().getParent().getParent().getParent().getParent().getParent();
            } else {
                oDetailPage = oList.getParent().getParent();
            }
            searchFacetDialogHelper.updateCountInfo(oDetailPage);

            //deselect setting check box
            var oSettings = oList.getParent().getParent().getContent()[searchFacetDialogHelper.POS_SETTING_CONTAINER];
            var oCheckbox = oSettings.getItems()[searchFacetDialogHelper.POS_SHOWONTOP_CHECKBOX];
            var oSelect = oSettings.getItems()[searchFacetDialogHelper.POS_SORTING_SELECT].getItems()[0];
            if (oCheckbox.getSelected()) {
                oCheckbox.setSelected(false);
                oSelect.setSelectedKey("notSorted");
            }
            if (oList.getSelectedContexts().length > 0) {
                oCheckbox.setEnabled(true);
            } else {
                oCheckbox.setEnabled(false);
            }
        },

        //event: search in detailPages
        onSearchFieldLiveChange: function(oEvent) {
            var sFilterTerm = oEvent.getSource().getValue();
            var oSelectedItem = searchFacetDialogHelper.getFacetList().getSelectedItem();
            searchFacetDialogHelper.updateDetailPage(oSelectedItem, sFilterTerm);
        },

        //event: click setting button
        onSettingButtonPress: function(oEvent) {
            var bPressed = oEvent.oSource.getPressed();
            var oSettings = oEvent.oSource.getParent().getParent().getContent()[searchFacetDialogHelper.POS_SETTING_CONTAINER];
            var oListContainer = oEvent.oSource.getParent().getParent().getContent()[searchFacetDialogHelper.POS_ATTRIBUTE_LIST_CONTAINER];
            if (bPressed) {
                oSettings.setVisible(true);
                oListContainer.setHeight('calc(100% - 4.25rem)');
            } else {
                oSettings.setVisible(false);
                oListContainer.setHeight('calc(100% - 0.25rem)');
            }
        },
        //event: change select box in settings
        onSelectChange: function(oEvent) {
            searchFacetDialogHelper.sortingAttributeList(oEvent.oSource.getParent().getParent().getParent());
        },
        //event: select check box in settings
        onCheckBoxSelect: function(oEvent) {
            searchFacetDialogHelper.sortingAttributeList(oEvent.oSource.getParent().getParent());
        },
        //event: advanced condition plus button pressed
        onPlusButtonPress: function(oEvent, type) {
            var oAdvancedContainer = oEvent.getSource().getParent();
            var oNewAdvancedCondition = new sap.ushell.renderers.fiori2.search.controls.SearchAdvancedCondition({
                type: type
            });
            var insertIndex = oAdvancedContainer.getAggregation("content").length - 1;
            oAdvancedContainer.insertAggregation("content", oNewAdvancedCondition, insertIndex);
        },
        //event: click ok button
        onOkClick: function(oEvent) {
            var that = this;
            var oModel = that.getModel();
            var oSearchModel = that.getModel('searchModel');
            oSearchModel.resetFilterConditions(false);
            var aDetailPages = that.oSplitContainer.getDetailPages();

            //no advanced filter
            for (var m = 0; m < oModel.aFilters.length; m++) {
                var item = oModel.aFilters[m];
                if (!item.advanced || item.listed) {
                    oSearchModel.addFilterCondition(item.filterCondition, false);
                }
            }
            //advanced filter
            for (var i = 0; i < aDetailPages.length; i++) {
                if (searchFacetDialogHelper.getFacetList().getItems()[i]) {
                    searchFacetDialogHelper.applyAdvancedCondition(aDetailPages[i], searchFacetDialogHelper.getFacetList().getItems()[i].getBindingContext().getObject(), oSearchModel);
                }
            }
            oSearchModel.filterChanged = true;
            oSearchModel._firePerspectiveQuery();
        },
        setChartOnDisplayIndexForFacetListItem: function(facetOnDisplayIndex) {
            var that = this;
            var res = 0;
            try {
                res = that.chartOnDisplayIndexByFilterArray[facetOnDisplayIndex];
            } catch (e) {
                res = 0;
            }
            if (res === undefined) {
                res = 0;
            }
            that.chartOnDisplayIndex = res;

        },

        //ensure dropdown icons are correct //used in SearchFacetDialogHelper.js:89
        resetIcons: function(oModel, sPath, oControl) {
            var that = this;
            var isTextDataType = false;
            var sDataType = oModel.getAttributeDataType(oModel.getProperty(sPath).dataType);
            if (that.bShowCharts && (sDataType === "string" || sDataType === "text")) {
                isTextDataType = true;
            }
            var allDropdownbuttons = $('.sapUshellSearchFacetDialogTabBarButton');
            if (isTextDataType) {
                allDropdownbuttons.css("display", "block");

                for (var i = 0; i < allDropdownbuttons.length; i++) {
                    var id = allDropdownbuttons[i].id;
                    var oDropDownButton = sap.ui.getCore().byId(id);

                    //reset the main button
                    var btn = oControl.tabBarItems[oControl.chartOnDisplayIndex].getIcon();
                    oDropDownButton.setIcon(btn);
                    var asWhat = oControl.tabBarItems[oControl.chartOnDisplayIndex].getText();

                    //reset the main button tooltip
                    var displayAs = sap.ushell.resources.i18n.getText('displayAs', [asWhat]);
                    oDropDownButton.setTooltip(displayAs);
                }


            } else {
                allDropdownbuttons.css("display", "none");
            }


        },
        //event: select chart elements
        onDetailPageSelectionChangeCharts: function(oEvent) {
            var that = this;
            var cnt = 0;
            var context, model, data, isSelected, becomesSelected, oSelectedItem, sSelectedBindingPath, oBindingObject, sPath, oMasterPageList;
            var itemIndex, j, ar, oNode, i, oMasterPageListItem;
            if (oEvent.getSource && oEvent.sId === "press") {
                context = oEvent.getSource().getBindingContext();
                model = context.getModel();
                data = context.getObject();
                isSelected = data.selected;
                becomesSelected = isSelected ? false : true;

                //first set the selected value in model
                oSelectedItem = oEvent.getSource();
                sSelectedBindingPath = oSelectedItem.getBindingContext().sPath + "/selected";
                model.setProperty(sSelectedBindingPath, becomesSelected);

                //update aFilters
                oBindingObject = oSelectedItem.getBindingContext().getObject();
                if (becomesSelected) {
                    model.addFilter(oBindingObject);
                } else {
                    model.removeFilter(oBindingObject);
                }

                //count the number of selected items in the model
                sPath = sSelectedBindingPath.replace(/\/items.+/, ''); //"/facetDialog/1/items/11/selected"
                sPath += "/items";
                ar = model.getProperty(sPath);
                cnt = 0;
                for (i = 0; i < ar.length; i++) {
                    oNode = ar[i];
                    if (oNode.selected === true) {
                        cnt++;
                    }
                }
            } else if (oEvent.getSource && (oEvent.sId === "selectData" || oEvent.sId === "deselectData")) { //new pie chart

                context = oEvent.getSource().getBindingContext();
                model = context.getModel();
                data = context.getObject();
                becomesSelected = (oEvent.sId === "selectData") ? true : false;

                //first set the selected value in model
                oSelectedItem = oEvent.getSource();
                sSelectedBindingPath = oSelectedItem.getBindingContext().sPath + "/items/"; // have "/facetDialog/1/", want "/facetDialog/1/items/11/selected"

                for (j = 0; j < oEvent.getParameters().data.length; j++) {
                    itemIndex = oEvent.getParameters().data[j].data._context_row_number;
                    sSelectedBindingPath += itemIndex + "/selected";
                    model.setProperty(sSelectedBindingPath, becomesSelected);

                    //update aFilters
                    oBindingObject = oSelectedItem.getBindingContext().getObject().items[itemIndex];
                    if (becomesSelected) {
                        model.addFilter(oBindingObject);
                    } else {
                        model.removeFilter(oBindingObject);
                    }
                }

                //count the number of selected items in the model
                sPath = sSelectedBindingPath.replace(/\/items.+/, ''); //"/facetDialog/1/items/11/selected"
                sPath += "/items";
                ar = model.getProperty(sPath);
                cnt = 0;
                for (i = 0; i < ar.length; i++) {
                    if (ar[i].selected === true) {
                        cnt++;
                    }
                }
                //if we deselect all at once by clicking the white background then this cnt is incomplete
                //bug! now adjust
                var curCntOfAffectedWedges = oEvent.mParameters.data.length;
                if (!becomesSelected && curCntOfAffectedWedges > 1) {
                    cnt = 0;
                    for (i = 0; i < ar.length; i++) {
                        ar[i].selected = false;
                    }
                }

            } else { //old pie chart
                data = oEvent.dataObject;
                isSelected = data.selected;
                becomesSelected = isSelected ? false : true;
                cnt = oEvent.cnt;
                model = oEvent.model;
                oBindingObject = new sap.ushell.renderers.fiori2.search.FacetItem();
                oBindingObject.facetAttribute = data.dimension;
                oBindingObject.filterCondition = data.filterCondition;
                oBindingObject.label = data.label;
                oBindingObject.selected = data.selected;
                oBindingObject.listed = data.selected;
                oBindingObject.value = data.value;
                oBindingObject.valueLabel = data.valueLabel;

                //update aItemsForBarChart

                for (j = 0; j < that.aItemsForBarChart.length; j++) {
                    var item = that.aItemsForBarChart[j];
                    if (item.label === data.label) {
                        item.selected = data.selected;
                    }
                }

                if (isSelected) {
                    that.getModel().addFilter(oBindingObject);
                } else {
                    that.getModel().removeFilter(oBindingObject);
                }
            }

            //update the count info in masterPageList
            oMasterPageList = searchFacetDialogHelper.getFacetList();
            oMasterPageListItem = oMasterPageList.getSelectedItem();
            if (!oMasterPageListItem) {
                oMasterPageListItem = oMasterPageList.getItems()[0];
            }
            oMasterPageListItem.setCounter(cnt);
            this.resetEnabledForFilterResetButton();
        },
        updateDetailPageCharts: function(aItems, oModel) {
            var that = this;
            if (that.bShowCharts === false) {
                return;
            }
            that.aItemsForBarChart = aItems;

            var listContainers = searchFacetDialogHelperCharts.getListContainersForDetailPage();
            var oListContainer = listContainers[1];
            var contents = oListContainer.getContent();

            //update pie chart (only for oPieChart.directUpdate ie old pie)
            if (contents && that.chartOnDisplayIndex === 2) {
                var oPieChart = contents[2];
                var elemChart = listContainers[5];
                var relevantContainerHeight = listContainers[2];
                relevantContainerHeight = 0.9 * relevantContainerHeight;
                if (oPieChart.directUpdate) { //== old pie chart
                    var piechartOptions = {};
                    piechartOptions.relevantContainerHeight = relevantContainerHeight;
                    piechartOptions.oSearchFacetDialog = that;

                    var oModel1 = new sap.ui.model.json.JSONModel();
                    oModel1.setData(aItems);

                    $("#" + elemChart.id).empty(); //elemChart.innerHTML = "";
                    oPieChart.directUpdate(aItems, elemChart, oModel1, piechartOptions);
                }
            }

            //take care to adjust visability of pie and bar chart
            var elem, $elem;
            //pie chart
            if (contents && that.chartOnDisplayIndex === 1) {
                //hide pie chart if exits
                elem = listContainers[0].firstChild.children[2];
                if (elem) {
                    $elem = $("#" + elem.id);
                    $elem.css("display", "none");
                }
            }
            //bar chart
            if (contents && that.chartOnDisplayIndex === 2) {
                //hide pie chart if exits
                elem = listContainers[0].firstChild.children[1];
                if (elem) {
                    $elem = $("#" + elem.id);
                    $elem.css("display", "none");
                }
            }
        },
        //this is for the button that toggles the charts but also calls updateDetailPageCharts() for pie chart
        controlChartVisibility: function(oControl, chartIndexToShow, forcePie) {
            //return;
            var that = this;
            var elem, $elem, classNames, isChart;
            if (that.bShowCharts === false) {
                return;
            }
            var listContainers = oControl.searchFacetDialogHelperCharts.getListContainersForDetailPage();
            var oListContainer = listContainers[1];
            if (!oListContainer || !oListContainer.getContent) {
                return;
            }
            var contents = oListContainer.getContent();
            for (var i = 0; i < contents.length; i++) {
                elem = listContainers[0].firstChild.children[i];
                if (!elem) {
                    return;
                }
                classNames = elem.className;
                isChart = false;
                if (classNames.indexOf("largeChart") > -1) {
                    isChart = true;
                }

                $elem = $("#" + elem.id);
                if (isChart && i !== chartIndexToShow) {
                    $elem.css("display", "none");
                } else {
                    $elem.css("display", "block");
                }

            }
            if (oControl.bOldPieChart) {
                if (isChart && chartIndexToShow === 2 && forcePie) {
                    var aItems = that.aItemsForBarChart;
                    var oModel = that.getModel();
                    that.updateDetailPageCharts(aItems, oModel);
                }
                if (isChart && chartIndexToShow === 2) {
                    oListContainer.setVertical(false);
                } else {
                    oListContainer.setVertical(true);
                }
            }
            var oSortButtonSet = listContainers[6];
            var oInputFieldForFilterTextSet = listContainers[7];
            if (oSortButtonSet) {
                if (chartIndexToShow === 0) {
                    oSortButtonSet.css("display", "block");
                    oInputFieldForFilterTextSet.css('visibility', 'visible');
                } else {
                    oSortButtonSet.css("display", "none");
                    oInputFieldForFilterTextSet.css('visibility', 'hidden');
                }
            }
        },
        hideSelectively: function(oEvent, oControl, chartIndex) {
            //return;
            var elem = $("#" + oEvent.srcControl.sId);
            var chartIndexToShow = oControl.chartOnDisplayIndex;
            var listContainers = oControl.searchFacetDialogHelperCharts.getListContainersForDetailPage();
            var oListContainer = listContainers[1];
            //var contents = oListContainer.getContent();
            if (listContainers[0].firstChild.children.length != 3) {
                return;
            }
            if (chartIndexToShow !== undefined) {
                if (oControl.chartOnDisplayIndex !== chartIndex) {
                    elem.css("display", "none");
                } else {
                    elem.css("display", "block");
                }
            } else {
                elem.css("display", "block");
            }

            if (chartIndexToShow === 2) {
                if (!listContainers[0].firstChild.children[2] || !listContainers[0].firstChild.children[2].firstChild) {
                    //if (!listContainers[0].firstChild.children[2].firstChild) {
                    oControl.controlChartVisibility(oControl, oControl.chartOnDisplayIndex, true);
                }
                if (oControl.bOldPieChart) {
                    oListContainer.setVertical(false);
                }
            } else {
                oListContainer.setVertical(true);
            }

            var oSortButton = listContainers[6];
            if (oSortButton) {
                var elemSortButton = $("#" + oSortButton.sId);
                if (chartIndexToShow === 0) {
                    elemSortButton.css("display", "block");
                } else {
                    elemSortButton.css("display", "none");
                }
            }
        }

    });
});
