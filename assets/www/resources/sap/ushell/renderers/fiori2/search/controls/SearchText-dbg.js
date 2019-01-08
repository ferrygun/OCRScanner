/* global sap, alert, jQuery */

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/SearchHelper'
], function(SearchHelper) {
    "use strict";

    return sap.m.Text.extend('sap.ushell.renderers.fiori2.search.controls.SearchText', {

        renderer: 'sap.m.TextRenderer',
        onAfterRendering: function() {

            var d = this.getDomRef();

            // recover bold tag with the help of text() in a safe way
            SearchHelper.boldTagUnescaperByText(d);

            // emphasize whyfound in case of ellipsis
            // the problem
            // Logic is moved to SearchResultListItem OnAfterrendering()
            // because both offsetWidth and scrollWidth are 0 when parent .searchResultListItemDetails2 display:none
            //searchHelper.forwardEllipsis4Whyfound(d);
        }
    });
});
