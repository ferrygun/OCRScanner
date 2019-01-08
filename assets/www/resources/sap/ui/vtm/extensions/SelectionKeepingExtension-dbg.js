/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ["jquery.sap.global", "sap/ui/core/Control", "../Extension"],
    function (jQuery, SapUiCoreControl, SapUiVtmExtension) {

        "use strict";

        /**
         * Constructor for a new SelectionKeepingExtension.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @name sap.ui.vtm.extensions.SelectionKeepingExtension
         * @public
         * @class
         * Workaround for {@link sap.ui.table.TreeTable} behaviour in which selections are lost after collapse/expand.
         * The {@link sap.ui.table.TreeTable} only allows items in the currently expanded tree to be selected.<br/>
         * This extension is expected to be removed in the future when {@link sap.ui.vtm.Tree} is rewritten to manage selection state independently from the underlying {@link sap.ui.table.TreeTable}.
         * @author SAP SE
         * @version 1.52.0
         * @constructor
         * @param {string?} sId id for the new {@link sap.ui.vtm.extensions.SelectionKeepingExtension} instance.
         * @param {object?} mSettings Object with initial property values, aggregated objects etc. for the new {@link sap.ui.vtm.extensions.SelectionKeepingExtension} instance.
         * @extends sap.ui.vtm.Extension
         */
        var SelectionKeepingExtension = SapUiVtmExtension.extend("sap.ui.vtm.extensions.SelectionKeepingExtension", /** @lends sap.ui.vtm.extensions.SelectionKeepingExtension.prototype */ {
            initialize: function () {
                this._selectionSetsByPanel = new Map();

                this.applyPanelHandler(function(panel) {
                    var tree = panel.getTree();

                    tree.attachSelectionChanged(function (event) {
                        if (!this.getEnabled()) {
                            return;
                        }
                        var itemsAdded = event.getParameter("addedItems");
                        var itemsRemoved = event.getParameter("removedItems");
                        this._updateSelectionSet(panel, itemsAdded, itemsRemoved);
                    }.bind(this));

                    tree.attachExpandedChanged(function (event) {
                        if (!this.getEnabled()) {
                            return;
                        }
                        if (event.getParameter("expanded") !== true) {
                            return;
                        }
                        this._synchroniseSelection(panel);
                    }.bind(this));
                }.bind(this));
            },

            constructor: function(sId, mSettings) {
                SapUiVtmExtension.apply(this, arguments); // Force non-lazy construction
            },

            _synchroniseSelection: function(panel) {
                var tree = panel.getTree();
                var selectionSet = this._selectionSetsByPanel.get(panel);
                if (selectionSet) {
                    var items = [];
                    selectionSet.forEach(function(item) {
                        if (tree.getItem(item.id)) {
                            items.push(item);
                        }
                    });
                    tree.setSelectedItems(items, false);
                }
            },

            _updateSelectionSet: function(panel, selected, unselected) {
                var selectionSet = this._selectionSetsByPanel.get(panel);
                if (!selectionSet) {
                    selectionSet = new Set();
                    this._selectionSetsByPanel.set(panel, selectionSet);
                }

                if (unselected) {
                    unselected.forEach(function(item) {
                        selectionSet.delete(item);
                    });
                }
                if (selected) {
                    selected.forEach(function(item) {
                        selectionSet.add(item);
                    });
                }
            }
        });

        return SelectionKeepingExtension;
    });