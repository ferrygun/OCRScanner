/* global jQuery, sap, window, document */
sap.ui.define([
    'sap/ushell/renderers/fiori2/search/controls/SearchFieldGroup',
    'sap/ushell/renderers/fiori2/search/controls/SearchFilterBar'
], function(SearchFieldGroup, SearchFilterBar) {
    "use strict";

    var module = sap.ushell.renderers.fiori2.search.container.ComponentControl = {};
    jQuery.extend(module, {

        init: function() {

            this.oSearchFieldGroup = new SearchFieldGroup("searchFieldGroup");

            this.oSearchResults = sap.ui.view({
                id: "searchContainerResultsView",
                viewName: "sap.ushell.renderers.fiori2.search.container.Search",
                type: sap.ui.core.mvc.ViewType.JS
            });

            this.oSearchBar = new sap.m.Bar({
                visible: {
                    parts: [{
                        path: '/count'
                    }, {
                        path: '/facetVisibility'
                    }],
                    formatter: function(count, facetVisibility) {
                        if (facetVisibility) {
                            return count !== 0;
                        } else {
                            return count !== 0;
                        }
                    }
                },
                contentLeft: [
                    this.oSearchResults.assembleFilterButton(),
                    this.oSearchResults.assembleDataSourceTapStrips()
                ],
                contentRight: this.oSearchResults.assembleSearchToolbar(true)
            });
            this.oSearchBar.addStyleClass('sapUshellSearchBar');

            this.oFilterBar = new sap.ushell.renderers.fiori2.search.controls.SearchFilterBar({
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

            this.oSearchPage = new sap.m.Page({
                id: 'searchPage',
                customHeader: this.oSearchBar,
                subHeader: this.oFilterBar,
                content: [this.oSearchResults],
                enableScrolling: true,
                showFooter: false,
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

        }
    });

    return module;
});
