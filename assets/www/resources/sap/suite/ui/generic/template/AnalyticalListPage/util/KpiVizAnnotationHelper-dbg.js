sap.ui.define(["sap/ui/base/Object", "sap/ui/model/Context", "sap/ui/model/odata/AnnotationHelper", "sap/suite/ui/generic/template/AnalyticalListPage/util/V4Terms"],
    function(BaseObject, Context, ODataAnnoHelper, V4Terms) {
        "use strict";

        var AnnotationHelper = BaseObject.extend("sap.suite.ui.generic.template.AnalyticalListPage.util.KpiVizAnnotationHelper");

        sap.suite.ui.generic.template.AnalyticalListPage.util.KpiVizAnnotationHelper.constants = {
            LABEL_KEY: "sap:label",
            TEXT_KEY: "sap:text",
            TYPE_KEY: "type"
        };

        sap.suite.ui.generic.template.AnalyticalListPage.util.KpiVizAnnotationHelper.config = {
            "Line": {
                "type": "line",
                "dimensions": {
                    "min": 1,
                    "defaultRole": "Category"
                },
                "measures": {
                    "min": 1
                },
                "feeds": [{
                    "uid": "valueAxis",
                    "type": "measure"
                }, {
                    "uid": "categoryAxis",
                    "min": 1,
                    "type": "dimension",
                    "role": "Category"
                }, {
                    "uid": "color",
                    "type": "dimension",
                    "role": "Series"
                }]
            },
            "Column": {
                "type": "column",
                "dimensions": {
                    "min": 1,
                    "defaultRole": "Category"
                },
                "measures": {
                    "min": 1,
                    "defaultRole": "Axis1"
                },
                "feeds": [{
                    "uid": "valueAxis",
                    "min": 1,
                    "type": "measure"
                }, {
                    "uid": "categoryAxis",
                    "min": 1,
                    "type": "dimension"
                }]
            },
            "Donut": {
                "type": "donut",
                "dimensions": {
                    "min": 1
                },
                "measures": {
                    "min": 1,
                    "max": 1
                },
                "feeds": [{
                    "uid": "size",
                    "min": 1,
                    "max": 1,
                    "type": "measure"
                }, {
                    "uid": "color",
                    "min": 1,
                    "type": "dimension"
                }]
            },
            "Bar": {
                "type": "bar",
                "dimensions": {
                    "min": 1,
                    "defaultRole": "Category"
                },
                "measures": {
                    "min": 1,
                    "defaultRole": "Axis1"
                },
                "feeds": [{
                    "uid": "valueAxis",
                    "min": 1,
                    "type": "measure"
                }, {
                    "uid": "categoryAxis",
                    "min": 1,
                    "type": "dimension"
                }]
            }
        };

        AnnotationHelper._createSortObject = function(oDimensions, oMeasures, oChartType) {
            var sSortBy = "";
            if (oChartType.EnumMember == "com.sap.vocabularies.UI.v1.ChartType/Line") {
                sSortBy = oDimensions[0].Dimension.PropertyPath;
            } else {
                sSortBy = oMeasures[0].Measure.PropertyPath;
            }
            return sSortBy;
        };

        AnnotationHelper.formatItems = function(iContext, oEntitySet, oSelectionVariant, oPresentationVariant, oDimensions, oMeasures, oChartType, oSettings) {
            var oModel = iContext.getSetting("dataModel");
            var resultString = "{";
            var dimensionsList = [];
            var measuresList = [];
            var sorterList = [];
            var bFilter = oSelectionVariant && oSelectionVariant.SelectOptions;
            var bParams = oSelectionVariant && oSelectionVariant.Parameters;
            var bSorter = oPresentationVariant && oPresentationVariant.SortOrder;
            var maxItemTerm = oPresentationVariant && oPresentationVariant.MaxItems,
                maxItems = null;
            var tmp;
            var entitySet = null;
            var self = sap.suite.ui.generic.template.AnalyticalListPage.util.KpiVizAnnotationHelper;
            var textKey = "sap:text";

            if (maxItemTerm) {
                maxItems = maxItemTerm.Int32 ? maxItemTerm.Int32 : maxItemTerm.Int;
            }

            if (maxItems) {
                if (maxItems == "0") {
                    jQuery.sap.log.error("maxItems is configured as " +
                        maxItems);
                    resultString += "}";
                    return resultString;
                }
                if (!/^\d+$/.test(maxItems)) {
                    jQuery.sap.log.error("maxItems is Invalid. " +
                        "Please enter an Integer.");
                    resultString += "}";
                    return resultString;
                }
            }

            if (bParams) {
                var path = sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationHelper.resolveParameterizedEntitySet(oModel, oEntitySet, oSelectionVariant);
                resultString += "path: '" + path + "'";
            } else {
                resultString += "path: '" + oSettings.model + ">/" + oEntitySet.name + "'";
            }

            var filters = [];
            if (!oSettings) {
                jQuery.sap.log.error("NO KPI card settings in card formmater");
                resultString += "}";
                return resultString;
            }
            entitySet = oSettings.entitySet;
            if (!oModel || !entitySet) {
                return resultString;
            }
            var oMetadata = self.getMetadata(oModel, entitySet);

            if (bFilter) {
                bFilter.forEach(function(oSelectOption) {
                    var sPropertyPath = oSelectOption.PropertyName.PropertyPath;
                    oSelectOption[sPropertyPath].forEach(function(oRange) {
                        if (oRange.Sign.EnumMember === V4Terms.SelectionRangeSignType + "/I") {
                            var oFilter = {
                                path: sPropertyPath,
                                operator: oRange.Option.EnumMember.split("/")[1],
                                value1: oRange.Low.String,
                                value2: oRange.High ? oRange.High.String : ""
                            };
                            filters.push(oFilter);
                        }
                    });
                });
            }

            if (filters.length > 0) {
                resultString += ", filters: " + JSON.stringify(filters);
            }

            if (bSorter) {
                var oSortAnnotationCollection = oPresentationVariant.SortOrder;
                if (oSortAnnotationCollection.length < 1) {
                    jQuery.sap.log.warning("Kpi Card no Sort annotaion defined");
                } else {
                    var sSorterValue = "";
                    var oSortOrder;
                    var sSortOrder;
                    var sSortBy;
                    for (var i = 0; i < oSortAnnotationCollection.length; i++) {
                        oSortOrder = oSortAnnotationCollection[i];
                        sSortBy = oSortOrder.Property.PropertyPath;
                        if (!sSortBy || !oMetadata[sSortBy]) {
                            sSortBy = self._createSortObject(oDimensions, oMeasures, oChartType);
                        }
                        sorterList.push(sSortBy);
                        if (typeof oSortOrder.Descending == "undefined") {
                            sSortOrder = "true";
                        } else {
                            var sCheckFlag = oSortOrder.Descending.Bool;
                            if (!sCheckFlag) {
                                jQuery.sap.log.warning(self.errorMessages.CARD_WARNING + self.errorMessages.BOOLEAN_ERROR);
                                sSortOrder = "true";
                            } else {
                                sSortOrder = sCheckFlag.toLowerCase() === "true";
                            }
                        }
                        sSorterValue = sSorterValue + "{path: '" + sSortBy + "',descending: " + sSortOrder + "},";
                    }
                    /* trim the last ',' */
                    resultString += ", sorter: [" + sSorterValue.substring(0, sSorterValue.length - 1) + "]";
                }
            }

            jQuery.each(oMeasures, function(i, m) {
                tmp = m.Measure.PropertyPath;
                measuresList.push(tmp);
                if (oMetadata && oMetadata[tmp] && oMetadata[tmp][textKey] && tmp != oMetadata[tmp][textKey]) {
                    measuresList.push(oMetadata[tmp][textKey] ? oMetadata[tmp][textKey] : tmp);
                }
            });
            jQuery.each(oDimensions, function(i, d) {
                tmp = d.Dimension.PropertyPath;
                dimensionsList.push(tmp);
                if (oMetadata && oMetadata[tmp] && oMetadata[tmp][textKey] && tmp != oMetadata[tmp][textKey]) {
                    dimensionsList.push(oMetadata[tmp][textKey] ? oMetadata[tmp][textKey] : tmp);
                }
            });
            resultString += ", parameters: {select:'" + [].concat(dimensionsList, measuresList).join(",");
            if (sorterList.length > 0) {
                resultString += "," + sorterList.join(",");
            }
            /* close `parameters` */
            resultString += "'}";

            if (maxItems) {
                resultString += ", length: " + maxItems;
            }
            resultString += "}";
            return resultString;
        };

        /*
         * Formatter for VizFrame type.
         * @param {Object} oChartType - Chart Annotation Object
         * @returns {String} Valid Enum for Vizframe type
         */
        AnnotationHelper.getChartType = function(oChartType) {

            var aChartAnno = [];
            if (!oChartType.EnumMember ||
                !(aChartAnno = oChartType.EnumMember.split("/")) ||
                aChartAnno.length < 2) {
                jQuery.sap.log.error("KPI Card M - wrong or missing chart type");
                return "";
            } else {
                return AnnotationHelper.config[aChartAnno[1]].type;
            }
        };

        /*
         * Construct VizProperties and Feeds for VizFrame
         * @param {Object} VizFrame
         */
        AnnotationHelper.setupChartAttributes = function(vizFrame, oSettings) {
            var oCardsModel, /* oEntityTypeModel, */ entityTypeObject, chartContext;
            var oChartType, chartType, config, aDimensions, aMeasures;
            var oVizProperties;
            var aQueuedProperties, aQueuedDimensions, aQueuedMeasures;
            var aPropertyWithoutRoles, aDimensionWithoutRoles = [],
                aMeasureWithoutRoles = [];

            config = AnnotationHelper.config;

            var self = sap.suite.ui.generic.template.AnalyticalListPage.util.KpiVizAnnotationHelper;

            if (!(oCardsModel = oSettings)) {
                jQuery.sap.log.error("KPI Card no card settings");
                return;
            }

            var oModel = vizFrame.getModel();
            var oMetaModel = oModel.getMetaModel();
            var entitySet = oCardsModel.entitySet;
            var oEntitySet = oMetaModel.getODataEntitySet(entitySet);

            if (!oModel || !entitySet) {
                return;
            }

            entityTypeObject = oMetaModel.getODataEntityType(oEntitySet.entityType, false);

            if (!entityTypeObject) {
                jQuery.sap.log.error("KPI Card no entityType");
                return;
            }
            var oMetadata = self.getMetadata(oModel, entitySet);
            var chartAnno = "com.sap.vocabularies.UI.v1.Chart#" + oCardsModel.qualifier;
            if (!chartAnno || !(chartContext = entityTypeObject[chartAnno])) {
                jQuery.sap.log.error("KPI Card no chart annotations");
                return;
            }

            if (!(aDimensions = chartContext.DimensionAttributes) ||
                !aDimensions.length) {
                jQuery.sap.log.error("KPI Card no dimension annotations defined");
                return;
            }
            if (!(aMeasures = chartContext.MeasureAttributes) ||
                !aMeasures.length) {
                jQuery.sap.log.error("KPI Card no measure annotations defined");
                return;
            }

            var aChartAnno = [];
            oChartType = chartContext.ChartType;
            if (!oChartType.EnumMember ||
                !(aChartAnno = oChartType.EnumMember.split("/")) ||
                aChartAnno.length < 2) {
                jQuery.sap.log.error("KPI Card M - wrong or missing chart type");
            } else {
                chartType = aChartAnno[1];
            }

            var bHideAxisTitle = true;

            vizFrame.removeAllAggregation();
            /*
             * Default viz properties template
             */
            oVizProperties = {
                legend: {
                    isScrollable: false
                },
                general: {
                    background: {
                        color: "transparent"
                    },
                    layout: {
                        padding: 15
                    },
                    groupData: false
                },
                title: {
                    visible: false
                },
                interaction: {
                    noninteractiveMode: false,
                    selectability: {
                        legendSelection: false,
                        axisLabelSelection: false,
                        mode: "NONE",
                        plotLassoSelection: false,
                        plotStdSelection: true
                    }
                },
                plotArea: {
                    window: {
                        start: "firstDataPoint",
                        end: "lastDataPoint"
                    },
                    background: {
                        color: "transparent"
                    }
                }
            };

            aQueuedDimensions = aDimensions.slice();
            aQueuedMeasures = aMeasures.slice();
            jQuery.each(config[chartType].feeds, function(i, feed) {
                var uid = feed.uid;
                var aFeedProperties = [];
                if (feed.type) {
                    var iPropertiesLength, feedtype, propertyName;
                    if (feed.type === "dimension") {
                        iPropertiesLength = aDimensions.length;
                        feedtype = "Dimension";
                        propertyName = "dimensions";
                        aQueuedProperties = aQueuedDimensions;
                        aPropertyWithoutRoles = aDimensionWithoutRoles;
                    } else {
                        iPropertiesLength = aMeasures.length;
                        feedtype = "Measure";
                        propertyName = "measures";
                        aQueuedProperties = aQueuedMeasures;
                        aPropertyWithoutRoles = aMeasureWithoutRoles;
                    }
                    var min = 0,
                        max = iPropertiesLength;
                    if (feed.min) {
                        min = min > feed.min ? min : feed.min;
                    }
                    if (feed.max) {
                        max = max < feed.max ? max : feed.max;
                    }
                    /* If no roles configured - add the property to feed */
                    if (!feed.role) {
                        var len = aQueuedProperties.length;
                        for (var j = 0; j < len && aFeedProperties.length < max; ++j) {
                            var val = aQueuedProperties[j];
                            aQueuedProperties.splice(j, 1);
                            --len;
                            --j;
                            aFeedProperties.push(val);
                        }
                    } else {
                        var rolesByPrio = feed.role.split("|");
                        jQuery.each(rolesByPrio, function(j, role) {
                            if (aFeedProperties.length == max) {
                                return false;
                            }
                            var len = aQueuedProperties.length;
                            for (var k = 0; k < len && aFeedProperties.length < max; ++k) {
                                var val = aQueuedProperties[k];
                                if (val && val.Role && val.Role.EnumMember &&
                                    val.Role.EnumMember.split("/") && val.Role.EnumMember.split("/")[1]) {
                                    var annotationRole = val.Role.EnumMember.split("/")[1];
                                    if (annotationRole == role) {
                                        aQueuedProperties.splice(k, 1);
                                        --len;
                                        --k;
                                        aFeedProperties.push(val);
                                    }
                                } else if (jQuery.inArray(val, aPropertyWithoutRoles) == -1) {
                                    aPropertyWithoutRoles.push(val);
                                }
                            }
                        });
                        if (aFeedProperties.length < max) {
                            jQuery.each(aPropertyWithoutRoles, function(k, val) {
                                /* defaultRole is the fallback role */
                                var defaultRole;
                                var index;
                                if ((defaultRole = config[propertyName].defaultRole) &&
                                    (jQuery.inArray(defaultRole, rolesByPrio) !== -1) &&
                                    (index = jQuery.inArray(val, aQueuedProperties)) !== -1) {
                                    aQueuedProperties.splice(index, 1);
                                    aFeedProperties.push(val);
                                    if (aFeedProperties.length == max) {
                                        return false;
                                    }
                                }
                            });
                        }
                        if (aFeedProperties.length < min) {
                            jQuery.sap.log.error("KPI card feed propperties < min");
                            return false;
                        }
                    }
                    if (aFeedProperties.length) {
                        var aFeeds = [];
                        var dataset;
                        if (!(dataset = vizFrame.getDataset())) {
                            jQuery.sap.log.error("KPI Card Viz framework no Dataset");
                            return false;
                        }
                        jQuery.each(aFeedProperties, function(i, val) {
                            if (!val || !val[feedtype] || !val[feedtype].PropertyPath) {
                                jQuery.sap.log.error("KPI Card invalid chart annotations - propertypath");
                                return false;
                            }
                            var property = val[feedtype].PropertyPath;
                            var feedName = property;
                            var textColumn = property;

                            if (oMetadata && oMetadata[property]) {
                                feedName = oMetadata[property][self.constants.LABEL_KEY] || property;
                                textColumn = oMetadata[property][self.constants.TEXT_KEY] || property;
                            }

                            var displayBindingPath = "{" + textColumn + "}";
                            aFeeds.push(feedName);
                            if (feedtype == "Dimension") {
                                dataset.addDimension(new sap.viz.ui5.data.DimensionDefinition({
                                    name: feedName,
                                    value: "{" + property + "}",
                                    displayValue: displayBindingPath
                                }));
                            } else {
                                dataset.addMeasure(new sap.viz.ui5.data.MeasureDefinition({
                                    name: feedName,
                                    value: "{" + property + "}"
                                }));
                            }

                        });
                        var newFeed = new sap.viz.ui5.controls.common.feeds.FeedItem({
                            "uid": uid,
                            "type": feedtype,
                            "values": aFeeds
                        });
                        vizFrame.addFeed(newFeed);
                        oVizProperties[uid] = {
                            title: {
                                visible: bHideAxisTitle ? false : true,
                                text: aFeeds.join(", ")
                            },
                            label: {
                                formatString: "axisFormatter"
                            }
                        };
                        if (uid == "valueAxis") {
                            oVizProperties[uid].layout = {
                                maxWidth: 0.4
                            };
                        }
                    }
                }
            });


            vizFrame.setVizProperties(oVizProperties);
        };

        AnnotationHelper.formatByType = function(oMetadata, sProp, sVal) {
            var self = sap.ovp.cards.charts.VizAnnotationManager;
            var typeKey = self.constants.TYPE_KEY;
            if (!oMetadata || !oMetadata[sProp] || !oMetadata[sProp][typeKey]) {
                return sVal;
            }
            var aNumberTypes = [
                "Edm.Int",
                "Edmt.Int16",
                "Edm.Int32",
                "Edm.Int64",
                "Edm.Decimal"
            ];
            var currentType = oMetadata[sProp][typeKey];
            if (jQuery.inArray(currentType, aNumberTypes) !== -1) {
                return Number(sVal);
            }
            return sVal;
        };

        /*
         * Get the (cached) OData metadata information.
         */
        AnnotationHelper.getMetadata = function(model, entitySet) {
            var map = this.cacheODataMetadata(model);
            if (!map) {
                return undefined;
            }
            return map[entitySet];
        };


        /*
         * Cache OData metadata information with key as UI5 ODataModel id.
         */
        AnnotationHelper.cacheODataMetadata = function(model) {
            var self = sap.suite.ui.generic.template.AnalyticalListPage.util.KpiVizAnnotationHelper;
            if (model) {
                if (!jQuery.sap.getObject("sap.suite.ui.generic.template.AnalyticalListPage.kpi.cachedMetaModel")) {
                    self.cachedMetaModel = {};
                }
                var map = self.cachedMetaModel[model.getId()];
                if (!map) {
                    var metaModel = model.getMetaModel();
                    map = {};
                    var container = metaModel.getODataEntityContainer();
                    jQuery.each(container.entitySet, function(anIndex, entitySet) {
                        var entityType = metaModel.getODataEntityType(entitySet.entityType);
                        var entitysetMap = {};
                        jQuery.each(entityType.property, function(propertyIndex, property) {
                            entitysetMap[property.name] = property;
                        });
                        map[entitySet.name] = entitysetMap;
                    });
                    self.cachedMetaModel[model.getId()] = map;
                }
                return map;
            } else {
                jQuery.sap.log.error(self.errorMessages.CARD_ERROR + self.errorMessages.CACHING_ERROR);
            }
        };


        /*
         * formatChartAxes for setting the numericFormatter in charts of KPI card.
         */
        AnnotationHelper.formatChartAxes = function(iScaleFactorMeasure) {

            jQuery.sap.require("sap.viz.ui5.format.ChartFormatter");
            jQuery.sap.require("sap.ui.core.format.NumberFormat");
            jQuery.sap.require("sap.viz.ui5.api.env.Format");

            var chartFormatter = sap.viz.ui5.format.ChartFormatter.getInstance();
            var bShowScale = true;
            if (!iScaleFactorMeasure) {
                iScaleFactorMeasure = undefined;
            } else {
                bShowScale = false;
            }
            if (chartFormatter != null) {
                chartFormatter.registerCustomFormatter("axisFormatter", function(value) {
                    var numberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
                        style: "short",
                        minFractionDigits: 0,
                        maxFractionDigits: 1,
                        decimals: 2,
                        showScale: bShowScale,
                        shortRefNumber: iScaleFactorMeasure
                    });
                    return numberFormat.format(Number(value));
                });
                sap.viz.ui5.api.env.Format.numericFormatter(chartFormatter);
            }
        };

        sap.suite.ui.generic.template.AnalyticalListPage.util.KpiVizAnnotationHelper.formatItems.requiresIContext = true;

        return AnnotationHelper;

    }, true);
