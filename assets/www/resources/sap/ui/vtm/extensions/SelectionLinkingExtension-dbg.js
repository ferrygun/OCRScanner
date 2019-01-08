/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ["jquery.sap.global", "sap/ui/core/Control", "../Extension"],
    function (jQuery, SapUiCoreControl, SapUiVtmExtension) {

        "use strict";

        /**
         * Constructor for a new SelectionLinkingExtension.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @name sap.ui.vtm.extensions.SelectionLinkingExtension
         * @public
         * @class
         * Adds a behavior that links items the visibility of tree items in a {@link sap.ui.vtm.Tree} with the visibility of their associated scene nodes in the {@link sap.ui.vtm.Viewport} in the same {@link sap.ui.vtm.Panel}.
         * @author SAP SE
         * @version 1.52.0
         * @constructor
         * @param {string?} sId id for the new {@link sap.ui.vtm.extensions.SelectionLinkingExtension} instance.
         * @param {object?} mSettings Object with initial property values, aggregated objects etc. for the new {@link sap.ui.vtm.extensions.SelectionLinkingExtension} instance.
         * @extends sap.ui.vtm.Extension
         * @implements sap.ui.vtm.interfaces.ISelectionLinkingExtension
         */
        var SelectionLinkingExtension = SapUiVtmExtension.extend("sap.ui.vtm.extensions.SelectionLinkingExtension", /** @lends sap.ui.vtm.extensions.SelectionLinkingExtension.prototype */ {
            metadata: {
                interfaces: [
                    "sap.ui.vtm.interfaces.ISelectionLinkingExtension"
                ],
                properties: {
                    /**
                     * The value is a callback function that finds tree items in a particular tree that match a given tree item.
                     *
                     * The first parameter is the tree item to match against.<br>
                     * The second parameter is the {@link sap.ui.vtm.Tree} containing the specified tree item being matched against.<br>
                     * The third parameter is the {@link sap.ui.vtm.Tree} to search for matches in.<br>
                     * The function returns an array of tree items that match the specified tree item.
                     */
                    findMatchingTreeItems: {type: "any", group: "Behavior", defaultValue: null}
                }
            },

            constructor: function(sId, mSettings) {
                SapUiVtmExtension.apply(this, arguments); // Force non-lazy construction
            },

            initialize: function () {
                this._handlingEvent = new Map();

                this.applyPanelHandler(function(panel) {
                    var tree = panel.getTree();

                    tree.attachSelectionChanged(function (event) {
                        if (!this.getEnabled()) {
                            return;
                        }
                        if (this._handlingEvent.get(panel)) {
                            return;
                        }
                        this._onSelectionChanged(tree.getPanel());
                    }.bind(this));

                    tree.attachEvent("vtmInternalSetTreeSelectionComplete", function (event) {
                        this._handlingEvent.set(panel, false);
                    }.bind(this));

                    tree.attachModelUpdated(function(event) {
                        if (!this.getEnabled()) {
                            return;
                        }
                        var primaryPanel = this._getPrimaryPanel();
                        if (primaryPanel) {
                            this._onSelectionChanged(primaryPanel);
                        }
                    }.bind(this));
                }.bind(this));
                
                this.attachEnabledChanged(function() {
                    if (this.getEnabled()) {
                        var primaryPanel = this._getPrimaryPanel();
                        if (primaryPanel) {
                            this._onSelectionChanged(primaryPanel);
                        }
                    }
                });
            },

            _getPrimaryPanel: function() {
                var panels = this._vtm.getPanels();
                if (!panels || !panels.length) {
                    return null;
                }
                return this._vtm.getActivePanel() || panels[0];
            },

            _onSelectionChanged: function(sourcePanel) {
                var sourceTree = sourcePanel.getTree();
                var selectedSourceTreeItems = sourceTree.getSelectedItems();
                var panels = this._vtm.getPanels();
                var findMatchingTreeItems = this.getFindMatchingTreeItems();
                if (!findMatchingTreeItems) {
                    return;
                }

                panels.forEach(function(targetPanel) {
                    var targetTree = targetPanel.getTree();
                    var targetTreeItems = [];

                    if (targetPanel !== sourcePanel) {
                        selectedSourceTreeItems.forEach(function(selectedSourceTreeItem) {
                            var matchingTreeItems = findMatchingTreeItems(selectedSourceTreeItem, sourceTree, targetTree);
                            Array.prototype.push.apply(targetTreeItems, matchingTreeItems);
                        });

                        this._handlingEvent.set(targetPanel, true);
                        targetTree.setSelectedItems(targetTreeItems);
                    }
                }.bind(this));

                return;
            }
        });

        return SelectionLinkingExtension;
    });