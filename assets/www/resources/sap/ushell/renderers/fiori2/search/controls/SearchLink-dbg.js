/* global sap, alert, jQuery */

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/SearchHelper'
], function(SearchHelper) {
    "use strict";

    return sap.m.Link.extend('sap.ushell.renderers.fiori2.search.controls.SearchLink', {

        renderer: 'sap.m.LinkRenderer',
        onAfterRendering: function() {
            var d = this.getDomRef();

            // recover bold tag with the help of text() in a safe way
            SearchHelper.boldTagUnescaperByText(d);
        }
    });
});
