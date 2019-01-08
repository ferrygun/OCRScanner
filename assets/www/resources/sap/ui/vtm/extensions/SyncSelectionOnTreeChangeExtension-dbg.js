/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ["jquery.sap.global", "sap/ui/core/Control", "../Extension"],
    function (jQuery, SapUiCoreControl, SapUiVtmExtension) {

        "use strict";

        /**
         * Constructor for a new SyncSelectionOnTreeChangeExtension.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @name sap.ui.vtm.extensions.SyncSelectionOnTreeChangeExtension
         * @public
         * @class
         * Workaround for {@link sap.ui.table.TreeTable} behaviour in which the selection can change when the model is updated, but no selection changed event is fired.<br/>
         * This extension is expected to be removed in the future when {@link sap.ui.vtm.Tree} is rewritten to manage selection state independently from the underlying {@link sap.ui.table.TreeTable}.
         * @author SAP SE
         * @version 1.52.0
         * @constructor
         * @param {string?} sId id for the new {@link sap.ui.vtm.extensions.SyncSelectionOnTreeChangeExtension} instance.
         * @param {object?} mSettings Object with initial property values, aggregated objects etc. for the new {@link sap.ui.vtm.extensions.SyncSelectionOnTreeChangeExtension} instance.
         * @extends sap.ui.vtm.Extension
         */
        var SyncSelectionOnTreeChangeExtension = SapUiVtmExtension.extend("sap.ui.vtm.extensions.SyncSelectionOnTreeChangeExtension", /** @lends sap.ui.vtm.extensions.SyncSelectionOnTreeChangeExtension.prototype */ {
            initialize: function () {
                this._selectedItemsByPanel = new Map();

                this.applyPanelHandler(function(panel) {
                    var tree = panel.getTree();

                    tree.attachSelectionChanged(function (event) {
                        if (!this.getEnabled()) {
                            return;
                        }
                        var selectedItems = tree.getSelectedItems();
                        this._selectedItemsByPanel.set(panel, selectedItems);
                    }.bind(this));

                    tree.attachModelUpdated(function (event) {
                        if (!this.getEnabled()) {
                            return;
                        }
                        if (!this._selectedItemsByPanel.has(panel)) {
                            return;
                        }
                        var selectedItems = tree.getSelectedItems();
                        var savedSelectedItems = this._selectedItemsByPanel.get(panel);
                        this._fireSelectionChangedIfSelectedItemsChanged(tree, selectedItems, savedSelectedItems);
                    }.bind(this));
                }.bind(this));
            },

            constructor: function(sId, mSettings) {
                SapUiVtmExtension.apply(this, arguments); // Force non-lazy construction
            },

            _fireSelectionChangedIfSelectedItemsChanged: function(tree, newSelectedItems, oldSelectedItems) {
                var newSelectedItemsSet = sap.ui.vtm.ArrayUtilities.toSet(newSelectedItems);
                var oldSelectedItemsSet = sap.ui.vtm.ArrayUtilities.toSet(oldSelectedItems);

                var addedItems = [];
                var removedItems = [];

                newSelectedItems.forEach(function(item) {
                    if (!oldSelectedItemsSet.has(item)) {
                        addedItems.push(item);
                    }
                });
                oldSelectedItems.forEach(function(item) {
                    if (!newSelectedItemsSet.has(item)) {
                        removedItems.push(item);
                    }
                });

                if (addedItems.length || removedItems.length) {
                    tree.fireSelectionChanged({
                        addedItems: addedItems,
                        removedItems: removedItems,
                        userInteraction: false
                    });
                }
            }
        });

        return SyncSelectionOnTreeChangeExtension;
    });