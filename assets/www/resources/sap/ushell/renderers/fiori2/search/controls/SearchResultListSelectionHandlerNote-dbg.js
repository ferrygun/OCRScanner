// iteration 0 : Holger
/* global sap,window */

sap.ui.define([
    './SearchResultListSelectionHandler'
], function(SearchResultListSelectionHandler) {
    "use strict";

    return SearchResultListSelectionHandler.extend("sap.ushell.renderers.fiori2.search.controls.SearchResultListSelectionHandlerNote", {

        isMultiSelectionAvailable: function(dataSource) {
            return true;
        },

        actionsForDataSource: function(dataSource) {
            var actions = [{
                text: "Show Selected Items",
                action: function(selection) {
                    console.log("Show Selected Items");

                    var message = "No Items were selected!";

                    if (selection.length > 0) {
                        message = "Following Items were selected:"
                        for (var i = 0; i < selection.length; i++) {
                            message += "\n" + selection[i].title;
                        }
                    }

                    sap.m.MessageBox.show(
                        message, {
                            icon: sap.m.MessageBox.Icon.INFORMATION,
                            title: "I'm a Custom Action for testing Multi-Selection",
                            actions: [sap.m.MessageBox.Action.OK]
                        }
                    );
                }
            }]
            return actions;
        }
    });
});
