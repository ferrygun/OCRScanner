/* global jQuery, sap, window, document, $ */

sap.ui.define([], function() {
    "use strict";

    jQuery.sap.declare('sap.ushell.renderers.fiori2.search.SearchFacetDialogHelperCharts');
    var module = sap.ushell.renderers.fiori2.search.SearchFacetDialogHelperCharts = {};

    jQuery.extend(module, {

        init: function(dialog) {
            this.dialog = dialog;
        },

        //create bar chart
        getBarChartPlaceholder: function() {
            var that = this;
            var oChart1;
            oChart1 = new sap.suite.ui.microchart.ComparisonMicroChart({
                height: "90%",
                width: "100%",
                colorPalette: "", //the colorPalette merely stops the evaluation of the bar with 'neutral', 'good' etc
                tooltip: ""

            });
            oChart1.addStyleClass('largeChart1barchart');

            var oBarchartFilter1 = new sap.ui.model.Filter("value", sap.ui.model.FilterOperator.GT, 0);
            var oBindingInfo2 = {
                path: "items",
                factory: function(sId, oContext) {
                    var oComparisonMicroChartData = new sap.suite.ui.microchart.ComparisonMicroChartData({
                        title: '{label}',
                        value: '{value}',
                        color: {
                            path: 'selected',
                            formatter: function(val) {
                                var res = sap.m.ValueColor.Good;
                                if (!val) {
                                    res = sap.m.ValueColor.Neutral;
                                }
                                return res;
                            }
                        },
                        displayValue: '{valueLabel}',
                        press: function(oEvent) {
                            that.dialog.onDetailPageSelectionChangeCharts(oEvent);
                        }
                    });
                    return oComparisonMicroChartData;
                },
                filters: [oBarchartFilter1]
            };
            oChart1.bindAggregation("data", oBindingInfo2);
            oChart1.setBusyIndicatorDelay(0);
            return oChart1;
        },

        testWhetherPieWedgeOrLabelIsDummy: function(oEvent) {
            var res = false;
            var label = "";
            var possibleNumPerc = 0,
                possibleNumTop = 0;
            try {
                label = JSON.stringify(oEvent.getParameters().data[0].data).split("\"")[3];
                //"75% of data is outside the top 9 shown in pie chart"
                possibleNumPerc = label.match(/\d+/g)[0];
                possibleNumTop = label.match(/\d+/g)[1];
                if (label === sap.ushell.resources.i18n.getText("facetPieChartOverflowText2", [possibleNumPerc, possibleNumTop])) {
                    res = true;
                } else if (label === sap.ushell.resources.i18n.getText("facetPieChartOverflowText2", [possibleNumTop, possibleNumPerc])) {
                    res = true; //in case order of numbers reversed in foreign language
                }

            } catch (e) {
                // do nothing
            }
            return res;
        },
        //###########################################################
        //create new pie chart
        getPieChartPlaceholder2: function() {
            var that = this;
            var oChart1;
            oChart1 = new sap.viz.ui5.controls.VizFrame({
                width: "100%",
                vizType: "info/pie",
                selectData: function(oEvent) {
                    if (!that.testWhetherPieWedgeOrLabelIsDummy(oEvent)) {
                        that.dialog.onDetailPageSelectionChangeCharts(oEvent);
                    }
                },
                deselectData: function(oEvent) {
                    if (!that.testWhetherPieWedgeOrLabelIsDummy(oEvent)) {
                        that.dialog.onDetailPageSelectionChangeCharts(oEvent);
                    }
                }
            });



            oChart1.attachRenderComplete(function(oEvent) {
                var points = [];
                var oItem;
                var aSearchFacetItems = this.getBindingContext().getObject().items4pie;
                if (!aSearchFacetItems) {
                    return oChart1;
                }
                for (var i = 0; i < aSearchFacetItems.length; i++) {
                    oItem = aSearchFacetItems[i];
                    if (oItem.selected === true) {
                        points.push({
                            data: {
                                Label: (oItem.label)
                            }
                        });
                    }
                }
                var action = {
                    clearSelection: true
                };

                oChart1.vizSelection(points, action);

                var sIdCurrentComponent, indexWedgeItem, $wedgeElement;
                var $legendBullet, $legendItem, indexLastLegendItem, allWedgeItems;

                sIdCurrentComponent = oEvent.getSource().sId;
                $legendBullet = $("#" + sIdCurrentComponent + " .v-legend-marker").last();
                $legendItem = $("#" + sIdCurrentComponent + " .v-legend-item").last();

                if (this.getBindingContext().getObject().items4pie[0].percentageMissingInBigPie > 0) {

                    indexLastLegendItem = $("#" + sIdCurrentComponent + " .v-legend-item").length - 1;
                    allWedgeItems = $("#" + sIdCurrentComponent + " .v-datapoint-group").children();

                    for (var j = 0; j < allWedgeItems.length; j++) {
                        $wedgeElement = allWedgeItems[j];
                        indexWedgeItem = $wedgeElement.getAttribute("data-id");
                        indexWedgeItem = parseInt(indexWedgeItem, 10);
                        if (indexWedgeItem === indexLastLegendItem) {
                            $wedgeElement.remove();
                            break;
                        }
                    }
                    $legendBullet.attr("fill-opacity", "0");
                    $legendBullet.attr("stroke-opacity", "1");
                    $legendBullet.attr("stroke", "black");
                    $legendBullet.attr("stroke-width", "0.5");

                    $legendItem.unbind();
                    $legendItem.off();
                }

                //lastly try to kill any click on background
                var $background = $("#" + sIdCurrentComponent + " .v-background-body");
                $background.unbind();
                $background.off();

            });

            oChart1.setVizProperties({
                legendGroup: {
                    linesOfWrap: 0,
                    layout: {
                        //position: "bottom",
                        maxWidth: 0.5
                    }
                },
                title: {
                    visible: false
                },
                interaction: {
                    selectability: {
                        mode: "multiple"
                    }
                }
            });

            oChart1.addStyleClass('largeChart2piechart');

            var oPiechartFilter1 = new sap.ui.model.Filter("pieReady", sap.ui.model.FilterOperator.EQ, true);
            //var oPiechartFilter2 = new sap.ui.model.Filter("value", sap.ui.model.FilterOperator.GT, 1);
            var oDataset = new sap.viz.ui5.data.FlattenedDataset({
                dimensions: [{
                    name: 'Label',
                    //name: "{facetTitle}",
                    value: "{label}"
                }],

                measures: [{
                    name: 'Value',
                    value: '{valueLabel}'
                }],

                data: {
                    path: "items4pie",
                    filters: [oPiechartFilter1]
                }

            });


            var feedx = new sap.viz.ui5.controls.common.feeds.FeedItem({
                uid: "size",
                type: "Measure",
                values: ["Value"]
            });

            var feedy = new sap.viz.ui5.controls.common.feeds.FeedItem({
                uid: "color",
                type: "Dimension",
                values: ["Label"]
            });

            oChart1.setDataset(oDataset);
            oChart1.addFeed(feedx);
            oChart1.addFeed(feedy);
            //oChart1.setBusyIndicatorDelay(0);
            return oChart1;
        },
        //###########################################################
        getPieChartPlaceholder: function() {
            var that = this;
            var oChart2;
            var piechartOptions = {};
            piechartOptions.oSearchFacetDialog = that.dialog;
            oChart2 = new sap.ushell.renderers.fiori2.search.controls.SearchFacetPieChart(piechartOptions);
            oChart2.addStyleClass('largeChart2piechart');
            sap.ui.core.ResizeHandler.register(oChart2, function(oEvent) {
                var svgX = 0;
                var marginLeft = 0;
                if (oEvent.target.firstChild) {
                    svgX = parseInt(window.getComputedStyle(oEvent.target.firstChild, null).getPropertyValue("transform-origin").split(" ")[0], 10);
                    marginLeft = (oEvent.size.width / 2) - svgX;
                    oEvent.target.firstChild.style.marginLeft = marginLeft + "px";
                    //console.debug("\pie move:" + oEvent.size.width + ", svgX: " + svgX + ", marginLeft: " + marginLeft + "\n ");
                }
            });
            return oChart2;
        },
        getHeaderWithDropDown: function(title) {
            var that = this;
            var oChartSelectionButton = that.getDropDownButton();

            var label = new sap.m.Label({
                text: title
            });
            var headerWithDropDown = new sap.m.Bar({
                translucent: true,
                design: sap.m.BarDesign.Header,
                contentMiddle: [label, oChartSelectionButton]
            });
            headerWithDropDown.addStyleClass("sapUshellSearchFacetDialogTabBarHeader");
            return headerWithDropDown;
        },

        setDummyTabBarItems: function(oControl) {
            oControl.tabBarItems = [new sap.m.IconTabFilter({
                text: sap.ushell.resources.i18n.getText("facetList"),
                icon: "sap-icon://list",
                key: 'list' + arguments[0]
            }), new sap.m.IconTabFilter({
                text: sap.ushell.resources.i18n.getText("facetBarChart"),
                icon: "sap-icon://horizontal-bar-chart",
                key: 'barChart' + arguments[0]
            }), new sap.m.IconTabFilter({
                text: sap.ushell.resources.i18n.getText("facetPieChart"),
                icon: "sap-icon://pie-chart",
                key: 'pieChart' + arguments[0]

            })];
            oControl.chartOnDisplayIndex = 0;
        },

        //create an DropDownButton with an actionsheet
        getDropDownButton: function(oControl) {
            var aButtons = [];
            var oButton;
            var oDropDownButton = new sap.m.Button({
                icon: oControl.tabBarItems[oControl.chartOnDisplayIndex].getIcon()
            });
            /*eslint-disable no-loop-func*/
            for (var i = 0; i < oControl.tabBarItems.length; i++) {
                oButton = new sap.m.Button({
                    text: oControl.tabBarItems[i].getText(),
                    icon: oControl.tabBarItems[i].getIcon(),
                    press: function(oEvent) {

                        var buttonClickedIndex, buttonClickedId;
                        buttonClickedId = oEvent.getSource().sId;
                        buttonClickedIndex = document.getElementById(buttonClickedId).dataset.facetViewIndex;
                        buttonClickedIndex = parseInt(buttonClickedIndex, 10);
                        oControl.chartOnDisplayIndex = buttonClickedIndex;

                        if (oControl.chartOnDisplayIndex === 0) {
                            $(".sapUshellSearchFacetDialogSettingsContainer").css('display', 'block');
                        } else {
                            $(".sapUshellSearchFacetDialogSettingsContainer").css('display', 'none');
                        }

                        //change the chartOnDisplayIndex value for the current filter selection
                        oControl.chartOnDisplayIndexByFilterArray[oControl.facetOnDisplayIndex] = buttonClickedIndex;

                        //reset the main button
                        var btn = oControl.tabBarItems[oControl.chartOnDisplayIndex].getIcon();
                        oDropDownButton.setIcon(btn);
                        var asWhat = oControl.tabBarItems[oControl.chartOnDisplayIndex].getText();

                        //reset the main button tooltip
                        var displayAs = sap.ushell.resources.i18n.getText('displayAs', [asWhat]);
                        oDropDownButton.setTooltip(displayAs);

                        //change what is displayed in the detail page
                        var elemFacetList = $(".sapUshellSearchFacetDialogFacetList")[0];
                        if (elemFacetList) {
                            var oFacetList = sap.ui.getCore().byId(elemFacetList.id);
                            if (!oFacetList.getSelectedItem()) {
                                oFacetList.setSelectedItem(oFacetList.getItems()[0]);
                            }
                            oFacetList.fireSelectionChange({
                                listItem: oFacetList.getSelectedItem()
                            });
                        }
                        oControl.controlChartVisibility(oControl, buttonClickedIndex);
                    }
                });
                oButton.data("facet-view-index", "" + i, true);
                aButtons.push(oButton);
            }
            var oActionSheet = new sap.m.ActionSheet({
                showCancelButton: true,
                buttons: aButtons,
                placement: sap.m.PlacementType.Bottom,
                cancelButtonPress: function() {
                    jQuery.sap.log.info("sap.m.ActionSheet: cancelButton is pressed");
                }
            });
            oDropDownButton.addStyleClass("sapUshellSearchFacetDialogTabBarButton");
            var asWhat = oControl.tabBarItems[oControl.chartOnDisplayIndex].getText();
            var displayAs = sap.ushell.resources.i18n.getText('displayAs', [asWhat]);
            oDropDownButton.setTooltip(displayAs);
            oDropDownButton.attachPress(function(oEvent) {
                oActionSheet.openBy(this);
            });
            return oDropDownButton;
        },
        getListContainersForDetailPage: function() {
            var textChartNode, barChartNode, pieChartNode;
            var res = [];
            var relevantContainerIndex = 0;
            var relevantContainerHeight = 440;
            var searchFacetLargeChartContainer = $(".searchFacetLargeChartContainer");
            for (var i = 0; i < searchFacetLargeChartContainer.length; i++) {
                if (searchFacetLargeChartContainer[i].clientHeight > 0) { //this appears to be always true so finding is not strictly valid
                    relevantContainerHeight = searchFacetLargeChartContainer[i].offsetParent.offsetParent.offsetParent.clientHeight;
                    relevantContainerIndex = i;
                    break;
                }
            }
            var chartParent = $(".searchFacetLargeChartContainer")[relevantContainerIndex]; // relevantContainerIndex arbitrary?
            if (chartParent) {
                var oListContainer = sap.ui.getCore().byId(chartParent.id);

                var oSortButtonSet, oInputFieldForFilterTextSet;
                oInputFieldForFilterTextSet = $('.sapUshellSearchFacetDialogSubheaderToolbar .sapMSF');
                oSortButtonSet = $('.sapUshellSearchFacetDialogSortButton');

                textChartNode = chartParent.firstChild.children[0];
                barChartNode = chartParent.firstChild.children[1];
                pieChartNode = chartParent.firstChild.children[2];

                res.push(chartParent);
                res.push(oListContainer);
                res.push(relevantContainerHeight);
                res.push(textChartNode);
                res.push(barChartNode);
                res.push(pieChartNode);
                res.push(oSortButtonSet);
                res.push(oInputFieldForFilterTextSet);
            }
            return res;
        }

    });

    return module;
});
