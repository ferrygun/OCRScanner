/* global jQuery, sap, window */
sap.ui.define([
    'sap/ushell/renderers/fiori2/search/SearchHelper',
    'sap/m/Button'
], function(SearchHelper) {
    "use strict";

    sap.m.Button.extend('sap.ushell.renderers.fiori2.search.controls.SearchButton', {

        constructor: function(sId, options) {
            options = jQuery.extend({}, {
                icon: sap.ui.core.IconPool.getIconURI("search"),
                tooltip: sap.ushell.resources.i18n.getText("search"),
                enabled: {
                    parts: [{
                        path: "/initializingObjSearch"
                    }],
                    formatter: function(initializingObjSearch) {
                        return !SearchHelper.isSearchAppActive() || !initializingObjSearch;
                    }
                }
            }, options);
            sap.m.Button.prototype.constructor.apply(this, [sId, options]);
            this.addStyleClass('searchBtn');
        },

        renderer: 'sap.m.ButtonRenderer'

    });

});
