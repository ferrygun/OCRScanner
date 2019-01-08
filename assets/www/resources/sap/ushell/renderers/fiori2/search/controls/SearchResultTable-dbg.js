/* global jQuery, sap, window */

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/SearchHelper'
], function(SearchHelper) {
    "use strict";

    return sap.m.Table.extend('sap.ushell.renderers.fiori2.search.controls.SearchResultTable', {

        renderer: 'sap.m.TableRenderer',

        onAfterRendering: function() {
            SearchHelper.attachEventHandlersForTooltip(this.getDomRef());
        }
    });
});
