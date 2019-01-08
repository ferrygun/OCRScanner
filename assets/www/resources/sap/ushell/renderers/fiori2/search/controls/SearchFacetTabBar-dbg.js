/* global sap */
/* global alert */
/* global jQuery */
/* global $ */
/* global document */


sap.ui.define([
    'sap/ushell/renderers/fiori2/search/SearchFacetDialogModel',
    'sap/ushell/renderers/fiori2/search/controls/SearchFacetDialog',
    'sap/m/GroupHeaderListItemRenderer',
    'sap/m/ButtonRenderer'
], function() {
    "use strict";


    sap.m.Button.extend('sap.ushell.renderers.fiori2.search.controls.SearchFacetDisplayModeDropDown', {
        renderer: 'sap.ushell.renderers.fiori2.search.controls.SearchFacetDisplayModeDropDownRenderer'
    });

    sap.ushell.renderers.fiori2.search.controls.SearchFacetDisplayModeDropDownRenderer = jQuery.extend(true, {}, sap.m.ButtonRenderer); // clone

    /*
    sap.ushell.renderers.fiori2.search.controls.SearchFacetDisplayModeDropDownRenderer.writeImgHtml = function(oRm, oButton) {
        var icon1 = oButton._getImage((oButton.getId() + "-img"), oButton.getIcon(), oButton.getActiveIcon(), oButton.getIconDensityAware());
        oRm.renderControl(icon1);
        oRm.renderControl(new sap.ui.core.Icon({
            src: 'sap-icon://slim-arrow-down',
            useIconTooltip: false
        }).addStyleClass("sapMBtnIcon"));
    };
	*/



    sap.m.GroupHeaderListItemRenderer.extend('sap.ushell.renderers.fiori2.search.controls.SearchGroupHeaderListItemRenderer');
    sap.m.GroupHeaderListItem.extend('sap.ushell.renderers.fiori2.search.controls.SearchGroupHeaderListItem', {
        renderer: 'sap.ushell.renderers.fiori2.search.controls.SearchGroupHeaderListItemRenderer',
        metadata: {
            properties: {
                button: {
                    type: "control",
                    defaultValue: null
                }, // new
                upperCase: {
                    type: "boolean",
                    group: "Appearance",
                    defaultValue: false
                } // change default
            }
        }
    });

    sap.ushell.renderers.fiori2.search.controls.SearchGroupHeaderListItemRenderer.renderCounter = function(rm, oLI) {
        var btn = oLI.getButton();
        if (btn) {
            this.renderCounterContent(rm, oLI, btn);
        }
    };
    sap.ushell.renderers.fiori2.search.controls.SearchGroupHeaderListItemRenderer.renderCounterContent = function(rm, oLI, btn) {
        /* //old button
        rm.write("<div");
        rm.addClass("sapUiTinyMarginBegin");
        rm.writeClasses();
        rm.write(">");
        rm.renderControl(btn);
        rm.write("</div>");
		*/
        rm.write('<div>');
        rm.renderControl(btn);
        rm.write('</div>');
    };


    sap.m.SegmentedButtonItem.extend('my.SegmentedButtonItem', {
        aggregations: {
            "content1": {
                type: "sap.ui.core.Control",
                multiple: false
            }
        }
    });

    sap.ui.core.Control.extend('sap.ushell.renderers.fiori2.search.controls.SearchFacetTabBar', {

        //setEshRole: function(role) {},

        metadata: { // the Control API
            properties: {
                "eshRole": "string", // setter and getter are created behind the scenes,
                "headerText": "string", // including data binding and type validation
                "selectedButtonParameters": {
                    type: "object",
                    defaultValue: null
                }
            },
            aggregations: {
                items: {
                    type: "sap.m.IconTabFilter",
                    multiple: true // default type is "sap.ui.core.Control", multiple is "true"
                }
            }
        },

        getSearchFacetTabBarAndDimensionById: function(buttonId) { //__button17
            var returnOBj = {};
            returnOBj.index = 0;
            var button = document.getElementById(buttonId);
            var view = button.dataset.facetView;
            var buttonIndex = button.dataset.facetViewIndex;
            var actionSheet = $("#" + buttonId).parent()[0];
            var dimension = actionSheet.dataset.facetDimension;
            var ar = $(".sapUshellSearchFacetTabBar");
            for (var i = 0; i < ar.length; i++) {
                var currentHeader = $(".sapUshellSearchFacetTabBar .sapUshellSearchFacetTabBarHeader")[i];
                var headerDimension = currentHeader.dataset.facetDimension;
                if (headerDimension === dimension) {
                    returnOBj.index = i;
                    returnOBj.control = sap.ui.getCore().byId(ar[i].id);
                    returnOBj.view = view;
                    returnOBj.buttonIndex = buttonIndex;
                    returnOBj.dimension = dimension;
                    break;
                }
            }
            return returnOBj;
        },

        storeClickedTabInformation: function(oEvent) {
            var searchFacetTabBarDimension, searchFacetTabBarControl, searchFacetTabBarView, dimension, buttonIndex;
            var tabId = oEvent.getSource().sId;
            var searchFacetTabBarInfo = this.getSearchFacetTabBarAndDimensionById(tabId);
            //            var previousClickedTabInformation = $.sap.storage.get("selectedButtonParameters");
            var previousClickedTabInformation = searchFacetTabBarInfo.control.getModel().getPersonalizationStorageInstance().getItem("search-facet-panel-chart-state");

            searchFacetTabBarDimension = searchFacetTabBarInfo.dimension;
            searchFacetTabBarControl = searchFacetTabBarInfo.control;
            searchFacetTabBarView = searchFacetTabBarInfo.view;
            buttonIndex = searchFacetTabBarInfo.buttonIndex;
            dimension = searchFacetTabBarControl.getBindingContext().getObject().dimension;

            var buttonId = oEvent.getParameters().id;

            var clickedTabInformation = [];
            var obj = {};
            obj.tabId = tabId;
            obj.searchFacetTabBarIndex = searchFacetTabBarInfo.searchFacetTabBarIndex;
            obj.buttonId = buttonId;
            obj.buttonIndex = buttonIndex;
            obj.dimension = dimension;
            obj.view = searchFacetTabBarView;
            clickedTabInformation.push(obj);
            if (previousClickedTabInformation &&
                Object.prototype.toString.call(previousClickedTabInformation) === '[object Array]') {
                for (var i = 0; i < previousClickedTabInformation.length; i++) {
                    var item = previousClickedTabInformation[i];
                    if (item.dimension !== searchFacetTabBarDimension) {
                        clickedTabInformation.push(item);
                    }
                }
            }

            //$.sap.storage.put("selectedButtonParameters", simpleStringify(oEvent.getParameters()));
            //            $.sap.storage.put("selectedButtonParameters", JSON.stringify(clickedTabInformation));
            searchFacetTabBarInfo.control.getModel().getPersonalizationStorageInstance().setItem("search-facet-panel-chart-state", clickedTabInformation);

            //also store information in model
            searchFacetTabBarControl.getBindingContext().getObject().chartIndex = buttonIndex;

        },


        renderer: function(oRm, oControl) {
            /* eslint no-loop-func:0 */
            function createOpenFacetDialogFn(iSelectedTabBarIndex, aTabBarItems) {

                return function(event) {
                    var dimension;
                    // since UI5 reuses the showMore link control, we have to traverse the DOM
                    // to find our facets dimension:

                    //sapUshellSearchFacetTabBar sapUshellSearchFacet
                    var node = $(this.getDomRef()).closest(".sapUshellSearchFacetTabBar")[0];
                    var facet = sap.ui.getCore().byId($(node).attr("id"));
                    var oFacetDialogModel = new sap.ushell.renderers.fiori2.search.SearchFacetDialogModel();
                    oFacetDialogModel.setData(oControl.getModel().getData());
                    //                    oFacetDialogModel.facetDialogCall().done(function() {
                    oFacetDialogModel.prepareFacetList();
                    if (facet && facet.getBindingContext() && facet.getBindingContext().getObject() && facet.getBindingContext().getObject().dimension) {
                        dimension = facet.getBindingContext().getObject().dimension;
                    }
                    var oDialog = new sap.ushell.renderers.fiori2.search.controls.SearchFacetDialog({
                        selectedAttribute: dimension,
                        selectedTabBarIndex: iSelectedTabBarIndex,
                        tabBarItems: aTabBarItems

                    });
                    oDialog.setModel(oFacetDialogModel);
                    oDialog.setModel(oControl.getModel(), 'searchModel');
                    oDialog.open();
                    //referece to page, so that dialog can be destroy in onExit()
                    var oPage = oControl.getParent().getParent().getParent().getParent();
                    oPage.oFacetDialog = oDialog;
                    //                    });

                };

            }


            // outer div
            oRm.write("<div ");
            oRm.writeControlData(oControl);
            oRm.addClass("sapUshellSearchFacetTabBar");
            oRm.writeClasses();
            oRm.write('>');


            //var currentTabFacetIndex = 0;
            var dimension = oControl.getBindingContext().getObject().dimension;
            var dataType = oControl.getBindingContext().getObject().dataType;
            var title = oControl.getBindingContext().getObject().title;
            var clickedTabInformation;
            var selectedButtonParameters;

            //            clickedTabInformation = $.sap.storage.get("selectedButtonParameters");
            clickedTabInformation = oControl.getModel().getPersonalizationStorageInstance().getItem("search-facet-panel-chart-state");
            if (clickedTabInformation && Object.prototype.toString.call(clickedTabInformation) === '[object Array]') {
                for (var k = 0; k < clickedTabInformation.length; k++) {
                    if (clickedTabInformation[k].dimension === dimension) {
                        selectedButtonParameters = clickedTabInformation[k];
                        break;
                    }
                }
            }

            var buttons2 = [];
            var contents = [];
            var oContent = null;
            var oButton = null;



            var selectedButtonIndex = 0;
            if (selectedButtonParameters && selectedButtonParameters.buttonIndex) {
                selectedButtonIndex = selectedButtonParameters.buttonIndex;
                selectedButtonIndex = parseInt(selectedButtonIndex, 10);
            }
            if (dataType != "text") {
                selectedButtonIndex = 0;
            }

            //also store information in model
            oControl.getBindingContext().getObject().chartIndex = selectedButtonIndex;
            var tabBarItems = oControl.getItems();


            var oDropDownButton = new sap.ushell.renderers.fiori2.search.controls.SearchFacetDisplayModeDropDown({
                icon: tabBarItems[selectedButtonIndex].getIcon(), //now  "sap-icon://list" //was "sap-icon://overflow"
                type: 'Transparent'
            });


            /*eslint-disable no-loop-func*/
            for (var i = 0; i < tabBarItems.length; i++) {
                oContent = tabBarItems[i].getContent()[0];
                oButton = new sap.m.Button({
                    text: tabBarItems[i].getText(),
                    icon: tabBarItems[i].getIcon(),
                    press: function(oEvent) {
                        oControl.storeClickedTabInformation(oEvent);
                        oControl.setSelectedButtonParameters(oEvent.getParameters()); //needed to trigger rerender
                    }

                });
                oButton.data("facet-view", tabBarItems[i].getText(), true);
                oButton.data("facet-view-index", "" + i, true);
                oButton.data("dimension", dimension, true);

                buttons2.push(oButton);
                contents.push(oContent);
            }




            var oActionSheet = new sap.m.ActionSheet({
                showCancelButton: false,
                buttons: buttons2,
                placement: sap.m.PlacementType.Bottom,
                cancelButtonPress: function(oControlEvent) {
                    jQuery.sap.log.info("sap.m.ActionSheet: cancelButton is pressed");
                },
                afterClose: function(oControlEvent) {
                    var that = this;

                    window.setTimeout(function() {
                        var dimension = that.getFocusDomRef().getAttribute('data-facet-dimension');
                        var tabBarButtons = $(".sapUshellSearchFacetTabBarButton");
                        for (var i = 0; i < tabBarButtons.length; i++) {

                            var tabBarButton = tabBarButtons[i];
                            var tabBarButtonDimension = tabBarButton.parentNode.parentNode.getAttribute('data-facet-dimension');
                            if (tabBarButtonDimension === dimension) {
                                tabBarButton.focus();
                                break;
                            }
                        }
                    }, 100);

                    jQuery.sap.log.info("=====================");
                    jQuery.sap.log.info("sap.m.ActionSheet: closed");
                }
            });
            oActionSheet.data("facet-dimension", dimension, true);

            oDropDownButton.addStyleClass("sapUshellSearchFacetTabBarButton");
            var asWhat = tabBarItems[selectedButtonIndex].getText();
            var displayAs = sap.ushell.resources.i18n.getText('displayAs', [asWhat]);
            oDropDownButton.setTooltip(displayAs);
            oDropDownButton.attachPress(function(oEvent) {
                oActionSheet.openBy(this);
            });





            //RENDERING

            //set 'filter by' header
            if (oControl.getHeaderText()) {


                //===============================================
                var oHeader = new sap.m.List({
                    //headerText: oControl.getHeaderText()
                });
                oHeader.setShowNoData(false);
                oHeader.setShowSeparators(sap.m.ListSeparators.None);

                oHeader.data("sap-ui-fastnavgroup", "false", true /* write into DOM */ );

                var bFiltersExist = false;
                var filterConditions = oControl.getModel().getProperty("/uiFilter/defaultConditionGroup");
                if (filterConditions && filterConditions.conditions && filterConditions.conditions.length > 0) {
                    bFiltersExist = true;
                } else {
                    bFiltersExist = false;
                }


                var oResetButton = new sap.m.Button({
                    icon: "sap-icon://clear-filter",
                    tooltip: sap.ushell.resources.i18n.getText("resetFilterButton_tooltip"),
                    type: 'Transparent',
                    enabled: bFiltersExist,
                    press: function(oEvent) {
                        oControl.getModel().resetFilterConditions(true);
                    }
                });
                oResetButton.addStyleClass("sapUshellSearchFilterByResetButton");



                var oLabel = new sap.m.Title({
                    text: oControl.getHeaderText()
                });
                oLabel.addStyleClass("sapUshellSearchFilterByResetButtonLabel");


                var oSpacer = new sap.m.ToolbarSpacer();

                var oHeaderToolbar = new sap.m.Toolbar({
                    content: [oLabel, oSpacer, oResetButton]
                });

                oHeaderToolbar.data("sap-ui-fastnavgroup", "false", true /* write into DOM */ );

                oHeader.setHeaderToolbar(oHeaderToolbar);
                oRm.renderControl(oHeader);


                //===============================================
            }


            var oListItem = new sap.m.CustomListItem({
                content: contents[selectedButtonIndex]
                //the above line sadly removes the control from the searchFacetTabBar and relocates it in the ListItem
            });
            oListItem.setModel(oControl.getModel(), 'facets');
            oListItem.addStyleClass("sapUshellSearchFacetList");

            var oGroupHeaderListItem;

            if (dataType === "text") {
                oGroupHeaderListItem = new sap.ushell.renderers.fiori2.search.controls.SearchGroupHeaderListItem({
                    title: title,
                    button: oDropDownButton
                });
            } else {
                oGroupHeaderListItem = new sap.ushell.renderers.fiori2.search.controls.SearchGroupHeaderListItem({
                    title: title
                });
            }

            oGroupHeaderListItem.data("facet-dimension", dimension, true);
            oGroupHeaderListItem.addStyleClass("sapUshellSearchFacetTabBarHeader");


            //---------------------
            var oShowMore = new sap.m.Link({
                text: sap.ushell.resources.i18n.getText("showMore"),
                press: createOpenFacetDialogFn(selectedButtonIndex, tabBarItems)
            });
            oShowMore.setModel(oControl.getModel("i18n"));
            oShowMore.addStyleClass('sapUshellSearchFacetShowMoreLink');


            var oInfoZeile = new sap.m.Label({
                text: ""
            });
            oInfoZeile.addStyleClass('sapUshellSearchFacetInfoZeile');

            var oShowMoreSlot = new sap.m.VBox({
                items: [
                    oInfoZeile,
                    oShowMore
                ]
            });


            var oShowMoreItem = new sap.m.CustomListItem({
                content: oShowMoreSlot, //oShowMore,
                visible: {
                    parts: [{
                        path: '/uiFilter/dataSource'
                    }],
                    formatter: function(datasource) {
                        return datasource.getType().toLowerCase() !== "category";
                    }
                }
            });

            oShowMoreItem.addStyleClass('sapUshellSearchFacetShowMoreItem');

            //------------------------
            var oList = new sap.m.List({
                showSeparators: sap.m.ListSeparators.None,
                items: [
                    oGroupHeaderListItem,
                    oListItem,
                    oShowMoreItem
                ]
            });
            oList.data("sap-ui-fastnavgroup", "false", true /* write into DOM */ );
            oList.setModel(oControl.getModel());
            oRm.renderControl(oList);
            //oRm.renderControl(oShowMoreSlot);

            oControl.getItems()[selectedButtonIndex].addContent(contents[selectedButtonIndex]);
            //KLUDGE: the above line returns the control to the searchFacetTabBar - otherwise it is lost by being passed to another control


            oRm.write("</div>");


        },

        onAfterRendering: function() {}

    });

});
