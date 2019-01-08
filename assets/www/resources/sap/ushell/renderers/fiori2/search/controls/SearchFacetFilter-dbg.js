/* global sap, alert, jQuery, $, my */
sap.ui.define([
    "sap/ushell/renderers/fiori2/search/controls/SearchFacet",
    "sap/ushell/renderers/fiori2/search/controls/SearchFacetTabBar",
    "sap/ushell/renderers/fiori2/search/controls/SearchFacetBarChart",
    "sap/ushell/renderers/fiori2/search/controls/SearchFacetPieChart",
    "sap/ushell/renderers/fiori2/search/controls/SearchFacetDialog",
    "sap/ushell/renderers/fiori2/search/SearchFacetDialogModel"
], function() {
    "use strict";

    sap.ushell.renderers.fiori2.search.controls.SearchFacetTabBar.extend('my.IconTabBar', {
        renderer: 'sap.ushell.renderers.fiori2.search.controls.SearchFacetTabBarRenderer',
        setEshRole: function() {
            var items = this.getItems();
            for (var i = 0; i < items.length; ++i) {
                var item = items[i];
                var facet = item.getContent()[0];
                facet.setEshRole.apply(facet, arguments);
            }
        },
        getEshRole: function() {
            var items = this.getItems();
            /*
            for (var i = 0; i < items.length; ++i) {
                var item = items[i];
                var facet = item.getContent()[0];
                return facet.getEshRole.apply(facet, arguments);
            }
			*/
            var item = items[0];
            var facet = item.getContent()[0];
            return facet.getEshRole.apply(facet, arguments);
        },

        attachSelectionChange: function() {}
    });


    return sap.ui.core.Control.extend('sap.ushell.renderers.fiori2.search.controls.SearchFacetFilter', {
        metadata: {
            properties: {
                title: "string"
            },
            aggregations: {
                "facets": {
                    //  type: "sap.ushell.renderers.fiori2.search.controls.SearchFacet",
                    multiple: true
                }
            }
        },

        init: function() {
            // define group for F6 handling
            this.data("sap-ui-fastnavgroup", "true", true /* write into DOM */ );
        },

        constructor: function(oOptions) {
            var that = this;
            oOptions = jQuery.extend({}, {}, oOptions);

            sap.ui.core.Control.prototype.constructor.apply(this, [oOptions]);

            this.bindAggregation('facets', '/facets', function() {

                if (that.getModel().config.charts) {
                    if (arguments[1].sPath !== "/facets/0") {
                        var barchartOptions = {};
                        barchartOptions.id = 'barChart' + arguments[0];
                        var oIconTabBar = new my.IconTabBar({
                            items: [new sap.m.IconTabFilter({
                                text: sap.ushell.resources.i18n.getText("facetList"),
                                icon: "sap-icon://list",
                                key: 'list' + arguments[0],
                                content: new sap.ushell.renderers.fiori2.search.controls.SearchFacet('list' + arguments[0])
                            }), new sap.m.IconTabFilter({
                                text: sap.ushell.resources.i18n.getText("facetBarChart"),
                                icon: "sap-icon://horizontal-bar-chart",
                                key: 'barChart' + arguments[0],
                                content: new sap.ushell.renderers.fiori2.search.controls.SearchFacetBarChart(barchartOptions)
                            }), new sap.m.IconTabFilter({
                                text: sap.ushell.resources.i18n.getText("facetPieChart"),
                                icon: "sap-icon://pie-chart",
                                key: 'pieChart' + arguments[0],
                                content: new sap.ushell.renderers.fiori2.search.controls.SearchFacetPieChart('pieChart' + arguments[0])
                            })]
                        });

                        oIconTabBar.addStyleClass("sapUshellSearchFacetIconTabBar");
                        //oIconTabBar.setModel(that.getModel(), 'facets').
                        return oIconTabBar;
                    } else {
                        return new sap.ushell.renderers.fiori2.search.controls.SearchFacet(arguments[0]);

                    }
                } else {
                    return new sap.ushell.renderers.fiori2.search.controls.SearchFacet(arguments[0]);
                }
            });

        },

        fireReset: function() {
            this.getModel().resetFilterConditions(false);
            this.getModel().setDataSource(this.getModel().allDataSource, true);
        },

        renderer: function(oRm, oControl) {
            /* eslint no-loop-func:0 */
            function createOpenFacetDialogFn(dimension) {
                return function(event) {
                    // since UI5 reuses the showMore link control, we have to traverse the DOM
                    // to find our facets dimension:
                    var facet = sap.ui.getCore().byId($($(this.getDomRef()).closest(".sapUshellSearchFacet")[0]).attr("id"));
                    var oFacetDialogModel = new sap.ushell.renderers.fiori2.search.SearchFacetDialogModel();
                    oFacetDialogModel.setData(oControl.getModel().getData());
                    //                    oFacetDialogModel.facetDialogCall().done(function() {
                    oFacetDialogModel.prepareFacetList();
                    var dimension = null;
                    if (facet && facet.getBindingContext() && facet.getBindingContext().getObject() && facet.getBindingContext().getObject().dimension) {
                        dimension = facet.getBindingContext().getObject().dimension;
                    }
                    var oDialog = new sap.ushell.renderers.fiori2.search.controls.SearchFacetDialog({
                        selectedAttribute: dimension
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
            oRm.write("<div");
            oRm.writeControlData(oControl);
            oRm.addClass("sapUshellSearchFacetFilter");
            oRm.writeClasses();
            oRm.write('>');

            for (var i = 0, len = oControl.getFacets().length; i < len; i++) {
                var facet = oControl.getFacets()[i];
                if (i === 0) {
                    facet.setEshRole("datasource");
                } else {
                    facet.setEshRole("attribute");
                    facet.attachSelectionChange(null, function() {
                        // dont show the showAllBtn while the facet pane is empty
                        jQuery(oControl.showAllBtn.getDomRef()).hide();
                    });
                    if (i === 1) {
                        facet.setHeaderText(sap.ushell.resources.i18n.getText("filterBy"));
                    }

                    var showMore = new sap.m.Link({
                        text: "{i18n>showMore}",
                        press: createOpenFacetDialogFn(),
                        visible: {
                            parts: [{
                                path: '/uiFilter/dataSource'
                            }],
                            formatter: function(datasource) {
                                return datasource.getType().toLowerCase() !== "category";
                            }
                        }
                    });
                    showMore.setModel(oControl.getModel());

                    if (!oControl.getModel().config.charts) {
                        var showMoreItem = new sap.m.CustomListItem({
                            content: showMore
                        });
                        showMoreItem.addStyleClass('sapUshellSearchFacetShowMoreLink');
                        showMoreItem.addEventDelegate({
                            onAfterRendering: function(elem) {
                                // delete the checkbox of the showMoreItem
                                var checkBox = jQuery(jQuery(elem.srcControl.getDomRef()).find(".sapMLIBSelectM:first"));
                                checkBox.remove();
                            }
                        });
                        facet.addItem(showMoreItem);

                    }
                    //else {
                    //oRm.renderControl(showMore); //to do: leave it to the SearchFacetTabBar

                    //}

                }
                oRm.renderControl(facet);
            }

            //show all filters button
            if (oControl.getFacets().length > 1 || oControl.getModel().getDataSource().type === 'BusinessObject') {
                oRm.write("<div>");
                oControl.showAllBtn = new sap.m.Button({
                    text: "{showAllFilters}",
                    press: createOpenFacetDialogFn(),
                    visible: false
                });
                oControl.showAllBtn.setModel(oControl.getModel("i18n"));
                oControl.showAllBtn.addStyleClass("sapUshellSearchFacetFilterShowAllFilterBtn");
                oRm.renderControl(oControl.showAllBtn);
                oRm.write("</div>");
            }

            // close searchfacetfilter div
            oRm.write("</div>");
        },

        onAfterRendering: function() {
            if (this.getModel().getProperty('/count') > 0) {
                if ((this.showAllBtn && this.getFacets().length > 1) && !this.getModel().isOtherCategory() && !this.getModel().isAllCategory() && !this.getModel().isAppCategory()) {
                    this.showAllBtn.setVisible(true);
                    this.showAllBtn.rerender();
                }
            }
            // add aria button role to atasource items
            //$('.searchFacetFilter .searchFacet').first().find('.searchFacetItem').attr('role', 'button');
            var $dataSource = $('.searchFacetFilter .searchFacet').first().find('ul');
            var $dataSourceItems = $dataSource.find('li');
            $dataSource.attr('role', 'tree');
            $dataSourceItems.attr('role', 'treeitem');
        }

    });

});
