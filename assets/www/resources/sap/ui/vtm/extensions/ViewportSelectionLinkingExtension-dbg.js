/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ["jquery.sap.global", "sap/ui/core/Control", "../Extension"],
    function (jQuery, SapUiCoreControl, SapUiVtmExtension) {

        "use strict";

        /**
         * Constructor for a new ViewportSelectionLinkingExtension.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @name sap.ui.vtm.extensions.ViewportSelectionLinkingExtension
         * @public
         * @class
         * Adds a behavior that links the selection state of tree items in a {@link sap.ui.vtm.Tree} with their corresponding scene nodes in the {@link sap.ui.vtm.Viewport} in the same {@link sap.ui.vtm.Panel}.
         * @author SAP SE
         * @version 1.52.0
         * @constructor
         * @param {string?} sId id for the new {@link sap.ui.vtm.extensions.ViewportSelectionLinkingExtension} instance.
         * @param {object?} mSettings Object with initial property values, aggregated objects etc. for the new {@link sap.ui.vtm.extensions.ViewportSelectionLinkingExtension} instance.
         * @extends sap.ui.vtm.Extension
         * @implements sap.ui.vtm.interfaces.IViewportSelectionLinkingExtension
         */
        var ViewportSelectionLinkingExtension = SapUiVtmExtension.extend("sap.ui.vtm.extensions.ViewportSelectionLinkingExtension", /** @lends sap.ui.vtm.extensions.ViewportSelectionLinkingExtension.prototype */ {
            metadata: {
                interfaces: [
                    "sap.ui.vtm.interfaces.IViewportSelectionLinkingExtension"
                ]
            },

            constructor: function(sId, mSettings) {
                SapUiVtmExtension.apply(this, arguments); // Force non-lazy construction
            },

            initialize: function () {
                this.applyPanelHandler(function (panel) {
                    var tree = panel.getTree();
                    var viewport = panel.getViewport();
                    var handlingEvent = false;

                    tree.attachSelectionChanged(function (event) {
                        if (!this.getEnabled()) {
                            return;
                        }
                        if (handlingEvent) {
                            return;
                        }

                        handlingEvent = true;

                        var itemsAdded = event.getParameter("addedItems");
                        var itemsRemoved = event.getParameter("removedItems");

                        var sceneNodeIdsToDeselect = [];
                        itemsRemoved.forEach(function(item) {
                            if (item.sceneNodeIds) {
                                Array.prototype.push.apply(sceneNodeIdsToDeselect, sap.ui.vtm.TreeItemUtilities.getSceneNodeIds(item));
                            }
                        });
                        viewport.setSelected(sceneNodeIdsToDeselect, false, false);

                        var sceneNodeIdsToSelect = [];
                        itemsAdded.forEach(function(item) {
                            if (item.sceneNodeIds) {
                                Array.prototype.push.apply(sceneNodeIdsToSelect, sap.ui.vtm.TreeItemUtilities.getSceneNodeIds(item));
                            }
                        });
                        viewport.setSelected(sceneNodeIdsToSelect, true, false);

                        handlingEvent = false;

                    }.bind(this));

                    tree.attachEvent("vtmInternalSetTreeSelectionComplete", function(event) {
                        handlingEvent = false;
                    });

                    viewport.attachSelectionChanged(function (event) {
                        if (!this.getEnabled()) {
                            return;
                        }

                        var selectedSceneNodeIds = event.getParameter("selectedIds");
                        var userInteraction = event.getParameter("userInteraction");
                        if (userInteraction) {
                            var selectedTreeItems = tree.getItemsBySceneNodeId(selectedSceneNodeIds);
                            tree.setSelectedItems(selectedTreeItems);
                        }
                    }.bind(this));

                }.bind(this));
            }
        });

        return ViewportSelectionLinkingExtension;
    });