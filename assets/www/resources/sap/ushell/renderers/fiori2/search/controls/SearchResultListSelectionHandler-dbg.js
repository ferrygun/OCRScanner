/* global sap,window,jQuery */

sap.ui.define([
    'sap/ui/base/Object'
], function() {
    "use strict";

    return sap.ui.base.Object.extend("sap.ushell.renderers.fiori2.search.controls.SearchResultListSelectionHandler", {

        isMultiSelectionAvailable: function(dataSource) {
            return false;
        },

        actionsForDataSource: function(dataSource) {
            return [];
        }
    });
});
