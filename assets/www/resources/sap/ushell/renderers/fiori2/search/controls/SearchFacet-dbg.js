/* global jQuery, sap, window */

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/controls/SearchFacetItem',
    'sap/m/List'
], function() {
    "use strict";

    sap.m.List.extend('sap.ushell.renderers.fiori2.search.controls.SearchFacet', {

        metadata: {
            properties: {
                eshRole: {
                    type: "string",
                    defaultValue: "datasource" //"datasource" or "attribute"
                }
            }
        },

        init: function() {
            // define group for F6 handling
            this.data("sap-ui-fastnavgroup", "false", true /* write into DOM */ );
        },

        constructor: function(sId, options) {
            options = jQuery.extend({}, {
                mode: sap.m.ListMode.SingleSelectMaster,
                showSeparators: sap.m.ListSeparators.None,
                includeItemInSelection: true,
                selectionChange: function(event) {
                    if (this.getEshRole() === "attribute") {
                        this.handleItemPress(event);
                    }
                },
                itemPress: function(event) {
                    if (this.getEshRole() === "datasource") {
                        this.handleItemPress(event);
                    }
                }
            }, options);
            sap.m.List.prototype.constructor.apply(this, [sId, options]);
            this.addStyleClass('sapUshellSearchFacet');
        },

        handleItemPress: function(event) {
            var listItem = event.mParameters.listItem;
            var oSelectedItem = listItem.getBindingContext().getObject();
            if (listItem.getSelected()) {
                this.getModel().addFilterCondition(oSelectedItem.filterCondition);
            } else {
                this.getModel().removeFilterCondition(oSelectedItem.filterCondition);
            }
        },

        renderer: 'sap.m.ListRenderer',

        setEshRole: function(role) {
            var that = this;
            var items = {
                path: "items",
                template: new sap.ushell.renderers.fiori2.search.controls.SearchFacetItem(),
                groupHeaderFactory: function(oGroup) {
                    var groupHeader = new sap.m.GroupHeaderListItem({
                        title: oGroup.key,
                        upperCase: false
                    });
                    if (that.getModel().config.charts) {
                        groupHeader.setVisible(false);

                    }
                    return groupHeader;
                }
            };
            switch (role.toLowerCase()) {
                default:
                    case "datasource":
                    this.setMode(sap.m.ListMode.SingleSelectMaster);
                this.setHeaderText(sap.ushell.resources.i18n.getText("searchIn"));
                break;
                case "attribute":
                        this.setMode(sap.m.ListMode.MultiSelect);
                    this.setHeaderText("");
                    items.sorter = new sap.ui.model.Sorter("facetTitle", false, false);
                    break;
            }
            this.bindAggregation("items", items);
            this.setProperty("eshRole", role); // this validates and stores the new value
            return this; // return "this" to allow method chaining
        },
        setModel: function() {

            return sap.m.List.prototype.setModel.apply(this, arguments);
        }
    });

});
