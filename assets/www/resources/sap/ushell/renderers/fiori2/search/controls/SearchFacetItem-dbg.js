/* global jQuery, sap, window */

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/SearchHelper',
    'sap/ui/core/format/NumberFormat',
    'sap/m/StandardListItem'
], function(SearchHelper) {
    "use strict";

    return sap.m.StandardListItem.extend('sap.ushell.renderers.fiori2.search.controls.SearchFacetItem', {

        constructor: function(sId, options) {
            var that = this;
            that.options = jQuery.extend({}, {
                type: sap.m.ListType.Active,
                title: "{label}",
                tooltip: "{label}" + ": " + "{valueLabel}",
                info: {
                    parts: [{
                        path: 'value'
                    }],
                    formatter: function(valueLabel) {
                        return typeof valueLabel === "number" ? SearchHelper.formatInteger(valueLabel) : "";
                    }
                },
                selected: "{selected}"
            }, options);

            sap.m.StandardListItem.prototype.constructor.apply(this, [sId, that.options]);
            this.addStyleClass('sapUshellSearchFacetItem');
            this.addEventDelegate({
                onAfterRendering: function() {
                    if (that.getBindingContext() && that.getBindingContext().getObject()) {
                        var level = that.getBindingContext().getObject().level;
                        if (jQuery("html").attr("dir") === 'rtl') {
                            jQuery(that.getDomRef()).children(".sapMLIBContent").css("padding-right", level + "rem");
                        } else {
                            jQuery(that.getDomRef()).children(".sapMLIBContent").css("padding-left", level + "rem");
                        }
                    }

                }
            });
        },

        renderer: 'sap.m.StandardListItemRenderer'
    });
});
