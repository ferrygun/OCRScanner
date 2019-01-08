/* global sap, alert, jQuery */

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/SearchHelper'
], function(SearchHelper) {
    "use strict";

    return sap.m.Label.extend('sap.ushell.renderers.fiori2.search.controls.SearchLabel', {

        renderer: 'sap.m.LabelRenderer',
        onAfterRendering: function() {
            var d = this.getDomRef();

            // recover bold tag with the help of text() in a safe way
            SearchHelper.boldTagUnescaperByText(d);

            // forward ellipsis
            SearchHelper.forwardEllipsis4Whyfound(d);
        }
    });
});
