// iteration 0 : Holger
/* global sap,window,jQuery */

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/controls/SearchResultListItem',
    'sap/ushell/renderers/fiori2/search/controls/CustomSearchResultListItemContent'
], function() {
    "use strict";

    return sap.ushell.renderers.fiori2.search.controls.SearchResultListItem.extend("sap.ushell.renderers.fiori2.search.controls.CustomSearchResultListItem", {
        // the control API:
        metadata: {
            properties: {
                content: {
                    type: "sap.ushell.renderers.fiori2.search.controls.CustomSearchResultListItemContent"
                }
            }
        },

        init: function() {
            sap.ushell.renderers.fiori2.search.controls.SearchResultListItem.prototype.init.apply(this, arguments);
        },

        setupCustomContentControl: function() {
            var content = this.getContent();
            content.setTitle(this.getTitle());
            content.setTitleUrl(this.getTitleUrl());
            content.setType(this.getType());
            content.setImageUrl(this.getImageUrl());
            content.setAttributes(this.getAttributes());
            // content.setIntents(this.getIntents());
        },

        renderer: function(oRm, oControl) {
            oControl.setupCustomContentControl();
            sap.ushell.renderers.fiori2.search.controls.SearchResultListItemRenderer.render.apply(this, arguments);
        },

        //         renderer: function(oRm, oControl) { // static function, so use the given "oControl" instance instead of "this" in the renderer function
        //
        //             oControl._renderer(oRm);
        //
        // //             oRm.write('<div');
        // //             oRm.writeControlData(oControl); // writes the Control ID
        // //             oRm.writeClasses(); // this call writes the above class plus enables support for Square.addStyleClass(...)
        // //             oRm.write('>');
        // //
        // //             var searchResultListItemContent = oControl.getContent();
        // //             if (searchResultListItemContent) {
        // //                 var customContent = searchResultListItemContent.getContent();
        // //                 if (customContent) {
        // //                     if (jQuery.isArray(customContent)) {
        // //                         for (var i = 0; i < customContent.length; i++) {
        // //                             oRm.renderControl(customContent[i]);
        // //                         }
        // //                     } else {
        // //                         oRm.renderControl(customContent);
        // //                     }
        // //                 }
        // //             }
        // //
        // //             oRm.write('</div>');
        //         },

        // after rendering
        // ===================================================================
        onAfterRendering: function() {
            sap.ushell.renderers.fiori2.search.controls.SearchResultListItem.prototype.onAfterRendering.apply(this, arguments);

            this.getContent().getTitleVisibility();
        }

    });
});
