/* global sap */
/* global alert */
/* global jQuery */
/* global $ */

sap.ui.define([
    'sap/suite/ui/microchart/ComparisonMicroChart'
], function(Helper) {
    "use strict";

    sap.ui.core.Control.extend('sap.ushell.renderers.fiori2.search.controls.SearchFacetBarChart', {
        metadata: {
            properties: {
                lastUpdated: {
                    type: "string"
                },
                aItems: {
                    type: "object"
                }
            },
            aggregations: {
                'items': {
                    type: 'sap.suite.ui.microchart.ComparisonMicroChartData',
                    multiple: true
                }
            }
        },

        constructor: function(options) {
            var that = this;
            that.options = options;
            sap.ui.core.Control.prototype.constructor.apply(this);
            this.bindAggregation('items', 'items', function() {
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
                        var context = oEvent.getSource().getBindingContext();
                        var model = context.getModel();
                        var data = context.getObject();
                        var isSelected = data.selected;
                        var filterCondition = data.filterCondition;

                        if (isSelected) {
                            //deselect
                            if (that.options.oSearchFacetDialog) {
                                that.options.oSearchFacetDialog.onDetailPageSelectionChangeCharts(oEvent);
                            } else {
                                model.removeFilterCondition(filterCondition, true);
                            }
                        } else if (that.options.oSearchFacetDialog) { //select  ie set filter, first for searchFacetDialog
                            that.options.oSearchFacetDialog.onDetailPageSelectionChangeCharts(oEvent);
                        } else { //select  ie set filter, without searchFacetDialog ie for small facets
                            model.addFilterCondition(filterCondition, true);
                        }
                    }
                });
                return oComparisonMicroChartData;
            });
        },
        renderer: function(oRm, oControl) {


            // render start of tile container
            oRm.write('<div');
            oRm.writeControlData(oControl);
            oRm.writeClasses();
            oRm.write('>');


            var oComparisonMicroChart = new sap.suite.ui.microchart.ComparisonMicroChart({
                width: "90%",
                colorPalette: "", //the colorPalette merely stops the evaluation of the bar with 'neutral', 'good' etc
                press: function(oEvent) {
                    //not used
                },
                tooltip: ""

            });
            if (oControl.options.oSearchFacetDialog) {
                oComparisonMicroChart.setWidth("95%");
                oComparisonMicroChart.addStyleClass("sapUshellSearchFacetBarChartLarge");
            } else {
                oComparisonMicroChart.addStyleClass("sapUshellSearchFacetBarChart");
            }

            oComparisonMicroChart.addEventDelegate({
                onAfterRendering: function(oEvent) {
                    $('#' + this.sId).has('.Good').addClass("sapUshellSearchFacetBarChartSelected");
                }
            });

            var items = oControl.getItems();
            var items2 = oControl.getAItems();
            if (items.length === 0 && items2) {
                items = items2;
            }
            var iMissingCnt = 0;
            for (var i = 0; i < items.length; ++i) {
                var item = items[i];
                if (!oControl.options.oSearchFacetDialog) {
                    if (item.mProperties && item.mProperties.value) {
                        oComparisonMicroChart.addData(item);
                    } else if (item.mProperties && !item.mProperties.value) {
                        iMissingCnt++;
                    }
                } else {
                    oComparisonMicroChart.addData(item);
                }
            }
            oControl.iMissingCnt = iMissingCnt;
            oRm.renderControl(oComparisonMicroChart);

            // render end of tile container
            oRm.write('</div>');
        },
        onAfterRendering: function() {
            var that = this;
            if (that.iMissingCnt > 0) {
                var infoZeile = $(this.getDomRef()).closest(".sapUshellSearchFacetIconTabBar").find(".sapUshellSearchFacetInfoZeile")[0];
                var oInfoZeile = sap.ui.getCore().byId(infoZeile.id);
                var message = sap.ushell.resources.i18n.getText("infoZeileNumberMoreSelected", [that.iMissingCnt]);
                oInfoZeile.setText(message);
            }

            //change tooltip by adding ":"
            var aAllBarchartTooltips = $(".sapSuiteUiMicroChartPointer");
            for (var i = 0; i < aAllBarchartTooltips.length; i++) {
                var tt = aAllBarchartTooltips[i];
                var s = tt.title;
                if (s && s.indexOf(":") === -1) {
                    tt.title = s.replace(/( \d+) *$/, ':$1');
                    //console.log(s);
                }
            }
        },

        setEshRole: function() {}
    });
});
