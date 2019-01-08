/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

 sap.ui.define(
     ["jquery.sap.global", "sap/ui/core/Control", "../Extension"],
     function (jQuery, SapUiCoreControl, SapUiVtmExtension) {

        "use strict";

        /**
         * Constructor for a new VisibilityIconClickExtension.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @name sap.ui.vtm.extensions.VisibilityIconClickExtension
         * @public
         * @class
         * Adds a behavior that updates visibility in the {@link sap.ui.vtm.Tree} when a visibility checkbox (eye) is clicked.
         * @author SAP SE
         * @version 1.52.0
         * @constructor
         * @param {string?} sId id for the new {@link sap.ui.vtm.extensions.VisibilityIconClickExtension} instance.
         * @param {object?} mSettings Object with initial property values, aggregated objects etc. for the new {@link sap.ui.vtm.extensions.VisibilityIconClickExtension} instance.
         * @extends sap.ui.vtm.Extension
         * @implements sap.ui.vtm.interfaces.IVisibilityIconClickExtension
         */
         var VisibilityIconClickExtension = SapUiVtmExtension.extend("sap.ui.vtm.extensions.VisibilityIconClickExtension", /** @lends sap.ui.vtm.extensions.VisibilityIconClickExtension.prototype */ {
             metadata: {
                 interfaces: [
                     "sap.ui.vtm.interfaces.IVisibilityIconClickExtension",
                     "sap.ui.vtm.interfaces.IVisibilityHeaderIconClickExtension"
                 ]
             },

             constructor: function(sId, mSettings) {
                 SapUiVtmExtension.apply(this, arguments); // Force non-lazy construction
             },

             initialize: function () {
                 this.applyPanelHandler(function (panel) {
                    var tree = panel.getTree();
                    var viewport = panel.getViewport();

                    tree.attachVisibilityIconClicked(function (event) {
                        if (!this.getEnabled()) {
                            return;
                        }
                        var item = event.getParameter("item");
                        var visibility = event.getParameter("visibility");
                        this._onTreeItemVisibilityClicked(tree, viewport, item, visibility);

                    }.bind(this));

                    tree.attachVisibilityHeaderIconClicked(function (event) {
                        if (!this.getEnabled()) {
                            return;
                        }
                        var visibility = event.getParameter("visibility");
                        tree.setVisibility(tree.getRootItems(), visibility, true);
                    }.bind(this));

                }.bind(this));
            },
            
            _onTreeItemVisibilityClicked: function(tree, viewport, item, visibility) {
                var selectedItems = tree.getSelectedItems();
                var clickedOnSelected = (selectedItems && selectedItems.indexOf(item) >= 0);
                if (!clickedOnSelected) {
                    selectedItems = [item];
                }
                tree.setVisibility(selectedItems, visibility, true);
            }
         });

         return VisibilityIconClickExtension;
     });