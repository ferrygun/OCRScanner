/* global jQuery, sap, window, $*/

sap.ui.define([], function() {
    "use strict";

    jQuery.sap.declare('sap.ushell.renderers.fiori2.search.SearchFacetsFormatter');
    var module = sap.ushell.renderers.fiori2.search.SearchFacetsFormatter = function() {
        this.init.apply(this, arguments);
    };

    jQuery.sap.declare('sap.ushell.renderers.fiori2.search.Facet');
    var Facet = sap.ushell.renderers.fiori2.search.Facet = function() {
        this.init.apply(this, arguments);
    };

    jQuery.sap.declare('sap.ushell.renderers.fiori2.search.FacetItem');
    var FacetItem = sap.ushell.renderers.fiori2.search.FacetItem = function() {
        this.init.apply(this, arguments);
    };

    // =======================================================================
    // Facet
    // =======================================================================
    Facet.prototype = {

        init: function(properties) {
            this.title = properties.title;
            this.facetType = properties.facetType; //datasource or attribute
            this.dimension = properties.dimension;
            this.dataType = properties.dataType;
            this.items = properties.items || [];
            this.totalCount = properties.totalCount;
        },

        /**
         * Checks if the facet has the given filter condition
         * @param   {object}  filterCondition the condition to check for in this facet
         * @returns {Boolean} true if the filtercondition was found in this facet
         */
        hasFilterCondition: function(filterCondition) {
            for (var i = 0, len = this.items.length; i < len; i++) {
                var fc = this.items[i].filterCondition || this.items[i];
                if (fc.equals && fc.equals(filterCondition)) {
                    return true;
                }
            }
            return false;
        },

        /**
         * Checks if this facet has at least one filter condition
         * @returns {Boolean} true if it has at least one filter condition, false otherwise
         */
        hasFilterConditions: function() {
            for (var i = 0, len = this.items.length; i < len; i++) {
                if (this.items[i].filterCondition) {
                    return true;
                }
            }
            return false;
        },

        removeItem: function(facetItem) {
            for (var i = 0, len = this.items.length; i < len; i++) {
                var fc = this.items[i].filterCondition || this.items[i];
                if (fc.equals && facetItem.filterCondition && fc.equals(facetItem.filterCondition)) {
                    return this.items.splice(i, 1);
                }
            }
        }

    };

    /* A FacetItem is an entry inside the facet. It can be a data source or an attribute.
     */
    FacetItem.prototype = {

        init: function(properties) {
            properties = properties || {};
            this.selected = properties.selected || false;
            this.level = properties.level || 0;
            //            this.sina = sap.ushell.Container.getService("Search").getSina();
            this.filterCondition = properties.filterCondition;
            this.value = properties.value || ""; //value here means count
            this.label = properties.label || "";
            this.facetTitle = properties.facetTitle || "";
            this.facetAttribute = properties.facetAttribute || "";
            this.valueLabel = this.value;
            this.advanced = properties.advanced || false;
            this.listed = properties.listed || false;
        },

        equals: function(otherFacetItem) {
            return (this.facetTitle === otherFacetItem.facetTitle &&
                this.label === otherFacetItem.label &&
                this.value === otherFacetItem.value &&
                this.filterCondition.equals(otherFacetItem.filterCondition));
        },

        clone: function() {
            var newFacetItem = new sap.ushell.renderers.fiori2.search.FacetItem();
            newFacetItem.facetTitle = this.facetTitle;
            newFacetItem.selected = this.selected;
            newFacetItem.label = this.label;
            newFacetItem.level = this.level;
            newFacetItem.value = this.value;
            newFacetItem.valueLabel = this.valueLabel;
            newFacetItem.filterCondition = this.filterCondition.clone();
            return newFacetItem;
        }

    };

    module.prototype = {
        init: function() {
            //            this.sina = sap.ushell.Container.getService("Search").getSina();
        },

        _getAncestorDataSources: function(oSearchModel) {
            var aRecentDataSources = [];
            var aAncestorNodes = oSearchModel.dataSourceTree.findNode(oSearchModel.getProperty("/uiFilter/dataSource")).getAncestors().reverse();
            for (var i = 0; i < aAncestorNodes.length; i++) {
                var ds = aAncestorNodes[i].dataSource;
                var dsFacetItem = new FacetItem({
                    label: ds.labelPlural,
                    filterCondition: ds,
                    level: 0,
                    value: aAncestorNodes[i].count
                });
                aRecentDataSources.push(dsFacetItem);
            }
            return aRecentDataSources;
        },

        _getSiblingDataSources: function(oSearchModel, level) {
            var aSiblingFacetItems = [];
            var currentDS = oSearchModel.getProperty("/uiFilter/dataSource");
            var currentNode = oSearchModel.dataSourceTree.findNode(currentDS);
            var aSiblingNodes;
            if (currentNode.parent && !currentNode.unsureWhetherNodeisBelowRoot) {
                aSiblingNodes = currentNode.parent.getChildren();
            } else {
                aSiblingNodes = [];
            }
            if (aSiblingNodes.length === 0) {
                aSiblingNodes.push(currentNode);
            }
            for (var j = 0, lenJ = aSiblingNodes.length; j < lenJ; j++) {
                var ds = aSiblingNodes[j].dataSource;
                var fi = new FacetItem({
                    label: ds.labelPlural,
                    value: aSiblingNodes[j].count,
                    filterCondition: ds,
                    selected: currentDS.equals(ds),
                    level: level
                });
                aSiblingFacetItems.push(fi);
                if (fi.selected) {
                    aSiblingFacetItems.push.apply(aSiblingFacetItems, this._getChildrenDataSources(oSearchModel, level + 1));
                }
            }
            return aSiblingFacetItems;
        },

        _getChildrenDataSources: function(oSearchModel, level) {
            //add children with data from the tree
            var aChildFacetItems = [];
            var currentDS = oSearchModel.getProperty("/uiFilter/dataSource");
            var aChildNodes = oSearchModel.dataSourceTree.findNode(currentDS).getChildren();
            for (var j = 0, lenJ = aChildNodes.length; j < lenJ; j++) {
                var ds = aChildNodes[j].dataSource;
                var fi = new FacetItem({
                    label: ds.labelPlural,
                    value: aChildNodes[j].count,
                    filterCondition: ds,
                    selected: false,
                    level: level
                });
                aChildFacetItems.push(fi);
            }
            return aChildFacetItems;
        },

        getDataSourceFacetFromTree: function(oSearchModel) {
            var oDataSourceFacet = new Facet({
                facetType: "datasource",
                title: "Search In"
            });
            var currentDS = oSearchModel.getProperty("/uiFilter/dataSource");
            var aAncestors = this._getAncestorDataSources(oSearchModel);
            oDataSourceFacet.items.push.apply(oDataSourceFacet.items, aAncestors);
            var aSiblings = this._getSiblingDataSources(oSearchModel, oSearchModel.allDataSource.equals(currentDS) ? 0 : 1);
            oDataSourceFacet.items.push.apply(oDataSourceFacet.items, aSiblings);
            return oDataSourceFacet;
        },

        _findAttributeLabelOfFilterGroup: function(filterConditionGroup) {
            for (var i = 0; i < filterConditionGroup.conditions.length; i++) {
                var filterCondition = filterConditionGroup.conditions[i];
                if (filterCondition instanceof window.filter.Condition) {
                    return filterCondition.attributeLabel;
                } else if (filterCondition instanceof window.filter.ConditionGroup) {
                    return this._findAttributeLabelOfFilterGroup(filterCondition);
                }
            }
        },

        _findAttributeOfFilterGroup: function(filterConditionGroup) {
            for (var i = 0; i < filterConditionGroup.conditions.length; i++) {
                var filterCondition = filterConditionGroup.conditions[i];
                if (filterCondition instanceof window.filter.Condition) {
                    return filterCondition.attribute;
                } else if (filterCondition instanceof window.filter.ConditionGroup) {
                    return this._findAttributeOfFilterGroup(filterCondition);
                }
            }
        },

        _createFacetItemsFromConditionGroup: function(conditionGroup) {
            var facetItems = [];
            for (var i = 0; i < conditionGroup.conditions.length; i++) {
                var filterCondition = conditionGroup.conditions[i];
                if (filterCondition instanceof window.filter.Condition) {
                    facetItems.push(new FacetItem({
                        label: filterCondition.valueLabel ? filterCondition.valueLabel : filterCondition.value,
                        facetTitle: filterCondition.attributeLabel,
                        facetAttribute: filterCondition.attribute,
                        filterCondition: filterCondition,
                        selected: true
                    }));
                } else if (filterCondition instanceof window.filter.ConditionGroup) {
                    for (var j = 0; j < filterCondition.conditions.length; j++) {
                        var nestedFilterCondition = filterCondition.conditions[j];
                        if (nestedFilterCondition instanceof window.filter.Condition) {
                            facetItems.push(new FacetItem({
                                label: nestedFilterCondition.valueLabel ? nestedFilterCondition.valueLabel : nestedFilterCondition.value,
                                filterCondition: nestedFilterCondition,
                                selected: true,
                                facetTitle: nestedFilterCondition.attributeLabel,
                                facetAttribute: nestedFilterCondition.attribute
                            }));
                        } else if (nestedFilterCondition instanceof window.filter.ConditionGroup) {
                            facetItems.push(new FacetItem({
                                label: nestedFilterCondition.label,
                                filterCondition: nestedFilterCondition,
                                selected: true,
                                facetTitle: this._findAttributeLabelOfFilterGroup(nestedFilterCondition),
                                facetAttribute: this._findAttributeOfFilterGroup(nestedFilterCondition)
                            }));
                        }
                    }
                }
            }
            return facetItems;
        },

        getAttributeFacetsFromPerspective: function(resultSet, oSearchModel) {
            var aServerSideFacets = resultSet.getChartFacets().filter(function(element) {
                return element.facetType === "attribute";
            });
            var aClientSideFacets = [];
            var oClientSideFacetsWithSelection = {};
            var aClientSideFacetsByDimension = {};
            var aFacetItemsWithFilterConditions = this._createFacetItemsFromConditionGroup(oSearchModel.getProperty("/uiFilter/defaultConditionGroup"));

            // extract facets from server response:
            for (var i = 0, len = aServerSideFacets.length; i < len; i++) {
                var oServerSideFacet = aServerSideFacets[i];
                var oClientSideFacet = new Facet({
                    title: oServerSideFacet.title,
                    facetType: oServerSideFacet.facetType,
                    dimension: oServerSideFacet.dimension,
                    totalCount: oServerSideFacet.query.resultSet.totalCount
                });
                if (!oServerSideFacet.query.resultSet || !oServerSideFacet.query.resultSet.elements || oServerSideFacet.query.resultSet.elements.length === 0) {
                    continue;
                }
                for (var j = 0; j < oServerSideFacet.query.resultSet.elements.length; j++) {
                    var oFacetListItem = oServerSideFacet.query.resultSet.elements[j];
                    var item = new FacetItem({
                        value: oFacetListItem.valueRaw,
                        filterCondition: oFacetListItem.dataSource || oFacetListItem.labelRaw,
                        label: oFacetListItem.label
                    });
                    if (oFacetListItem.labelRaw) {
                        if (oFacetListItem.labelRaw.attributeLabel) {
                            item.facetTitle = oFacetListItem.labelRaw.attributeLabel;
                        } else if (oFacetListItem.labelRaw.conditions) {
                            item.facetTitle = this._findAttributeLabelOfFilterGroup(oFacetListItem.labelRaw);
                        }
                    }
                    item.serverSideItem = true;
                    oClientSideFacet.items.push(item);
                }
                aClientSideFacetsByDimension[oServerSideFacet.dimension] = oClientSideFacet;
                aClientSideFacets.push(oClientSideFacet);
            }

            // add filter conditions as facet items:
            for (var k = 0, lenK = aFacetItemsWithFilterConditions.length; k < lenK; k++) {
                var oSelectedFacetItem = aFacetItemsWithFilterConditions[k];
                var oClientSideFacetWithSelection = aClientSideFacetsByDimension[oSelectedFacetItem.facetAttribute];
                if (!oClientSideFacetWithSelection) {
                    // facet was not send from server -> create it
                    oClientSideFacetWithSelection = new Facet({
                        dimension: oSelectedFacetItem.filterCondition.attribute ? oSelectedFacetItem.filterCondition.attribute : oSelectedFacetItem.filterCondition.conditions[0].attribute,
                        title: oSelectedFacetItem.facetTitle,
                        facetType: "attribute",
                        items: [oSelectedFacetItem]
                    });
                    aClientSideFacetsByDimension[oSelectedFacetItem.facetAttribute] = oClientSideFacetWithSelection;
                    aClientSideFacets.splice(0, 0, oClientSideFacetWithSelection); //insert selected facets on top

                } else {
                    // remove and insert selected facet on top, only in facet panel
                    var indexOfClientSideFacetWithSelection = aClientSideFacets.indexOf(oClientSideFacetWithSelection);
                    if (indexOfClientSideFacetWithSelection > 0) {
                        aClientSideFacets.splice(indexOfClientSideFacetWithSelection, 1);
                        aClientSideFacets.splice(0, 0, oClientSideFacetWithSelection);
                    }
                    // facet with the same title as a already selected facetitems facet was sent by the server
                    // -> merge the item into this facet. If the same facet item already exists just select it
                    var facetItemFoundInFacet = false;
                    for (var m = 0, lenM = oClientSideFacetWithSelection.items.length; m < lenM; m++) {
                        var facetItem = oClientSideFacetWithSelection.items[m];
                        if (oSelectedFacetItem.filterCondition.equals(facetItem.filterCondition)) {
                            facetItem.selected = true;
                            facetItemFoundInFacet = true;
                            if (!oSearchModel.config.multiSelect) {
                                facetItem.value = null;
                                facetItem.valueLabel = null;
                            }
                        }
                    }
                    if (!facetItemFoundInFacet) {
                        // there is no such facet item -> add the facet item to the facet
                        //oClientSideFacetWithSelection.items.splice(0, 0, oSelectedFacetItem);
                        oClientSideFacetWithSelection.items.push(oSelectedFacetItem);
                    }
                }
                oClientSideFacetsWithSelection[oSelectedFacetItem.facetTitle] = oClientSideFacetWithSelection;
            }

            if (!oSearchModel.config.multiSelect) {
                // remove all unselected attributes in facets which have selections
                // and make them single selected
                for (var facetTitle in oClientSideFacetsWithSelection) {
                    if (oClientSideFacetsWithSelection.hasOwnProperty(facetTitle)) {
                        var facet = oClientSideFacetsWithSelection[facetTitle];
                        for (var n = facet.items.length - 1; n >= 0; n--) {
                            var itemN = facet.items[n];
                            if (!itemN.selected) {
                                facet.items.splice(n, 1);
                            }
                        }
                    }
                }
            }
            return this.addDataTypeToClientSideFacets(aClientSideFacets, oSearchModel);
        },
        addDataTypeToClientSideFacets: function(aClientSideFacets, oSearchModel) {

            var oDataSource = oSearchModel.getDataSource();
            if (oDataSource.type === "Category" || oDataSource.type == "Apps") {
                //                return $.when(aClientSideFacets);
                return $.when([]); // UI decision: with Category, common attributes should not be shown
            }
            var oMetaData = oDataSource.getMetaData();
            if (!oMetaData || !oMetaData.then) {
                return $.when(aClientSideFacets);
            }
            return oMetaData.then(function(oMetaData) {

                var oMetaDataFacets, oFacet, sDimension, oAttributeFacet, sDataType;


                if (oDataSource.type === "Category") { //attributeSerivce only offered for BusinessObjects not Categories
                    return aClientSideFacets;
                }

                if (!oMetaData || !oMetaData.attributeMap) {
                    //if (!oMetaData) {
                    return aClientSideFacets;
                }

                oMetaDataFacets = oMetaData.attributeMap;
                //oMetaDataFacets = oMetaData[0];
                for (var i = 0; i < aClientSideFacets.length; i++) {
                    oFacet = aClientSideFacets[i];
                    sDimension = oFacet.dimension;
                    oAttributeFacet = oMetaDataFacets[sDimension];
                    sDataType = oAttributeFacet.type;
                    if (typeof sDataType === "string") {
                        sDataType = sDataType.toLowerCase();
                    }
                    if (sDataType === "string" || sDataType === "char" || sDataType === "edm.string") { //we have both string, text, and char of ODATA3, reduce to text
                        sDataType = "text";
                    }
                    oFacet.dataType = sDataType;
                }

                return aClientSideFacets;
            });

        },

        getFacets: function(oDataSource, oINAPerspective, oSearchModel) {

            // generate datasource facet
            var aFacets = [this.getDataSourceFacetFromTree(oSearchModel)];
            if (oDataSource.equals(oSearchModel.appDataSource) || (oDataSource.type && oDataSource.type.indexOf('Category') > -1)) {
                //return aFacets;
                return $.when(aFacets);
            }

            // return without perspective
            if (!oINAPerspective) {
                //return [];
                var ar = [];
                return $.when(ar);
            }

            // generate attribute facets
            var facets = this.getAttributeFacetsFromPerspective(oINAPerspective, oSearchModel);
            var res = facets.then(function(aAttributeFacets) {
                if (aAttributeFacets.length > 0) {
                    aFacets.push.apply(aFacets, aAttributeFacets);
                }
                return aFacets;
            });
            return res;
        },

        getFacetItemsWithFilterConditions: function(oSearchModel) {
            return this._createFacetItemsFromConditionGroup(oSearchModel.getProperty("/uiFilter/defaultConditionGroup"));
        },

        getDialogFacetsFromMetaData: function(oMetaData, oSearchModel) {
            var aServerSideFacets = jQuery.map(oMetaData.attributeMap, function(el) {
                return el;
            });
            var aClientSideFacets = [];

            // extract facets from server response:
            for (var i = 0, len = aServerSideFacets.length; i < len; i++) {
                var oServerSideFacet = aServerSideFacets[i];

                var bAccess = false;
                if (oServerSideFacet.accessUsage) {
                    for (var j = 0; j < oServerSideFacet.accessUsage.length; j++) {
                        if (oSearchModel.aAllowedAccessUsage.indexOf(oServerSideFacet.accessUsage[j]) >= 0) {
                            bAccess = true;
                            break;
                        }
                    }
                } else {
                    bAccess = true;
                }
                if (bAccess) {
                    var oClientSideFacet = new Facet({
                        title: oServerSideFacet.label,
                        facetType: "attribute",
                        dimension: oServerSideFacet.labelRaw,
                        dataType: oServerSideFacet.type
                    });

                    var aFacetItemsWithFilterConditions = this._createFacetItemsFromConditionGroup(oSearchModel.getProperty("/uiFilter/defaultConditionGroup"));
                    var count = 0;
                    for (var k = 0, lenK = aFacetItemsWithFilterConditions.length; k < lenK; k++) {
                        var oSelectedFacetItem = aFacetItemsWithFilterConditions[k];
                        if (oSelectedFacetItem.facetAttribute === oClientSideFacet.dimension) {
                            count++;
                            oClientSideFacet.items.splice(0, 0, oSelectedFacetItem);
                        }
                    }
                    oClientSideFacet.count = count;

                    aClientSideFacets.push(oClientSideFacet);
                }

            }
            return aClientSideFacets;
        },

        getDialogFacetsFromChartQuery: function(resultSet, oSearchModel, bInitialFilters) {

            var oClientSideFacet = new Facet({
                dimension: resultSet.dimensions[0]
            });
            for (var j = 0; j < resultSet.elements.length; j++) {
                var oFacetListItem = resultSet.elements[j];
                var item = new FacetItem({
                    value: oFacetListItem.valueRaw,
                    filterCondition: oFacetListItem.labelRaw,
                    label: oFacetListItem.label,
                    facetAttribute: resultSet.dimensions[0]
                });
                oClientSideFacet.items.push(item);
            }

            // add filter conditions as facet items:
            var aFacetItemsWithFilterConditions;
            if (bInitialFilters) {
                aFacetItemsWithFilterConditions = this._createFacetItemsFromConditionGroup(oSearchModel.getProperty("/uiFilter/defaultConditionGroup"));
            } else {
                aFacetItemsWithFilterConditions = oSearchModel.aFilters;
            }

            for (var k = 0, lenK = aFacetItemsWithFilterConditions.length; k < lenK; k++) {
                var oSelectedFacetItem = aFacetItemsWithFilterConditions[k];
                if (oSelectedFacetItem.facetAttribute === oClientSideFacet.dimension) {
                    var facetItemFoundInFacet = false;
                    for (var m = 0, lenM = oClientSideFacet.items.length; m < lenM; m++) {
                        var facetItem = oClientSideFacet.items[m];
                        if (oSelectedFacetItem.filterCondition.equals(facetItem.filterCondition)) {
                            facetItem.selected = true;
                            facetItemFoundInFacet = true;
                        }
                    }
                    if (!facetItemFoundInFacet) {
                        // there is no such facet item -> add the facet item to the facet
                        oClientSideFacet.items.splice(0, 0, oSelectedFacetItem);
                        oSelectedFacetItem.advanced = true;
                    } else {
                        oSelectedFacetItem.listed = true;
                    }
                }
            }
            return oClientSideFacet;
        }
    };
    return module;
});
