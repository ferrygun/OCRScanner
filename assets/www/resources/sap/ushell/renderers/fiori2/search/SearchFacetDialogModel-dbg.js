/* global jQuery,window, sap */

(function(global) {
    "use strict";
    sap.ui.define([
        'sap/ushell/renderers/fiori2/search/SearchModel'
    ], function(SearchModel) {


        return SearchModel.extend("sap.ushell.renderers.fiori2.search.SearchFacetDialogModel", {

            constructor: function() {

                var that = this;

                SearchModel.prototype.constructor.apply(that, []);

                that.aAllowedAccessUsage = ["AutoFacet", "AdvancedSearch"];

                // create sina query for facet dialog popover
                that.facetQuery = that.sina.createPerspectiveQuery({
                    templateFactsheet: true
                });

                that.chartQuery = that.sina.createChartQuery();

                that.aFilters = [];
            },

            prepareFacetList: function() {
                var that = this;
                var metaData = that.getDataSource().getMetaDataSync();

                that.setProperty('/facetDialog', that.oFacetFormatter.getDialogFacetsFromMetaData(metaData, that));
            },

            //properties: sAttribute, sBindingPath
            facetDialogSingleCall: function(properties) {
                var that = this;

                that.chartQuery.setDataSource(that.getDataSource());
                that.chartQuery.setSkip(0);
                that.chartQuery.setTop(1);
                that.chartQuery.dimensions = [];
                that.chartQuery.addDimension(properties.sAttribute);
                that.chartQuery.setAttributeLimit(properties.sAttributeLimit);
                if (that.getProperty("/fuzzy")) {
                    that.chartQuery.addOption(global.sinabase.QueryOptions.FUZZY);
                } else {
                    that.chartQuery.removeOption(global.sinabase.QueryOptions.FUZZY);
                }
                if (properties.bValueHelpMode) {
                    that.chartQuery.addOption(global.sinabase.QueryOptions.VALUEHELP);
                } else {
                    that.chartQuery.removeOption(global.sinabase.QueryOptions.VALUEHELP);
                }

                return that.chartQuery.getResultSet().then(function(resultSet) {
                    if (resultSet.dimensions.length === 0) {
                        resultSet.dimensions = [properties.sAttribute];
                    }
                    var oFacet = that.oFacetFormatter.getDialogFacetsFromChartQuery(resultSet, that, properties.bInitialFilters);


                    var oFacet2 = jQuery.extend(true, {}, oFacet);
                    oFacet.items4pie = oFacet2.items;

                    var amountInPie = 0,
                        amountNotInPie = 0,
                        percentageMissingInPie = 0,
                        averageSliceValue = 0;
                    for (var i = 0; i < oFacet.items4pie.length; i++) {
                        if (i < 9) {
                            oFacet.items4pie[i].pieReady = true;
                            if (oFacet.items4pie[i].value > 0) {
                                amountInPie += oFacet.items4pie[i].value;
                            }
                        } else {
                            oFacet.items4pie[i].pieReady = false;
                            if (oFacet.items4pie[i].value > 0) {
                                amountNotInPie += oFacet.items4pie[i].value;
                            }
                        }
                    }
                    percentageMissingInPie = amountNotInPie * 100 / (amountInPie + amountNotInPie);
                    percentageMissingInPie = Math.ceil(percentageMissingInPie);
                    averageSliceValue = amountInPie / 9;
                    averageSliceValue = Math.floor(averageSliceValue);


                    if (percentageMissingInPie > 0) {
                        var newItem = oFacet.items4pie[0].clone([true, true]);
                        newItem.value = averageSliceValue;
                        newItem.label = sap.ushell.resources.i18n.getText("facetPieChartOverflowText2", [percentageMissingInPie, 9]);
                        newItem.pieReady = true;
                        newItem.valueLabel = "" + averageSliceValue;
                        newItem.isPieChartDummy = true;
                        oFacet.items4pie.push(newItem);
                    }

                    for (var j = 0; j < oFacet.items4pie.length; j++) {
                        oFacet.items4pie[j].percentageMissingInBigPie = percentageMissingInPie;
                    }



                    that.setProperty(properties.sBindingPath + "/items4pie", oFacet.items4pie);
                    that.setProperty(properties.sBindingPath + "/items", oFacet.items);
                });
            },

            resetFacetQueryFilterConditions: function() {
                var that = this;
                that.facetQuery.resetFilterConditions();
            },

            resetChartQueryFilterConditions: function() {
                var that = this;
                that.chartQuery.resetFilterConditions();
            },

            hasFilterCondition: function(filterCondition) {
                var that = this;
                for (var i = 0; i < that.aFilters.length; i++) {
                    if (that.aFilters[i].filterCondition.equals && that.aFilters[i].filterCondition.equals(filterCondition)) {
                        return true;
                    }
                }
                return false;
            },

            hasFilter: function(item) {
                var that = this;
                var filterCondition = item.filterCondition;
                return that.hasFilterCondition(filterCondition);
            },

            addFilter: function(item) {
                var that = this;
                if (!that.hasFilter(item)) {
                    that.aFilters.push(item);
                }
            },

            removeFilter: function(item) {
                var that = this;
                var filterCondition = item.filterCondition;
                for (var i = 0; i < that.aFilters.length; i++) {
                    if (that.aFilters[i].filterCondition.equals && that.aFilters[i].filterCondition.equals(filterCondition)) {
                        that.aFilters.splice(i, 1);
                        return;
                    }
                }
            },

            changeFilterAdvaced: function(item, bAdvanced) {
                var that = this;
                var filterCondition = item.filterCondition;
                for (var i = 0; i < that.aFilters.length; i++) {
                    if (that.aFilters[i].filterCondition.equals && that.aFilters[i].filterCondition.equals(filterCondition)) {
                        that.aFilters[i].advanced = bAdvanced;
                        return;
                    }
                }
            },

            //determinate the attribute list data type
            getAttributeDataType: function(dataType) {
                switch (dataType) {
                    case "Double":
                        return "number";
                    case "Timestamp":
                        return "date";
                    case "String":
                        return "string";
                    case "Text":
                        return "text";
                    case "Edm.Decimal":
                    case "Edm.Double":
                    case "Edm.Int16":
                    case "Edm.Int32":
                    case "Edm.Int64":
                    case "Edm.Single":
                        return "number";
                    case "Edm.DateTime":
                        return "date";
                    default:
                        return "string";
                }
            }

        });
    });
})(window);
