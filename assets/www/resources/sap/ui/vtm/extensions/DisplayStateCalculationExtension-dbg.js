/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

 sap.ui.define(
     ["jquery.sap.global", "sap/ui/core/Control", "../Extension"],
     function (jQuery, SapUiCoreControl, SapUiVtmExtension) {

        "use strict";

        /**
         * Constructor for a new DisplayStateCalculationExtension.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @name sap.ui.vtm.extensions.DisplayStateCalculationExtension
         * @public
         * @class
         * Adds a behavior that calculates display state (visibility, opacity, highlight color) for the scene nodes in a viewport using
         * information in the tree items, context display groups and override display groups.
         * 
         * Excluded tree items are ignored when calculating display state since visible scene nodes that are not visible due to a context or override display group should relate to one or more selectable tree items in the tree.
         * @author SAP SE
         * @version 1.52.0
         * @constructor
         * @param {string?} sId id for the new {@link sap.ui.vtm.extensions.DisplayStateCalculationExtension} instance.
         * @param {object?} mSettings Object with initial property values, aggregated objects etc. for the new {@link sap.ui.vtm.extensions.DisplayStateCalculationExtension} instance.
         * @extends sap.ui.vtm.Extension
         * @implements sap.ui.vtm.interfaces.IDisplayStateCalculationExtension
         */
         var DisplayStateCalculationExtension = SapUiVtmExtension.extend("sap.ui.vtm.extensions.DisplayStateCalculationExtension", /** @lends sap.ui.vtm.extensions.DisplayStateCalculationExtension.prototype */ {
             metadata: {
                 interfaces: [
                     "sap.ui.vtm.interfaces.IDisplayStateCalculationExtension"
                 ]
             },

             constructor: function(sId, mSettings) {
                 SapUiVtmExtension.apply(this, arguments); // Force non-lazy construction
             },

             initialize: function () {
                this._handlingEvent = false;
                this._defaultVisibility = false;
                this._defaultOpacity = null;
                this._defaultHighlightColor = null;

                this.applyPanelHandler(function(panel) {
                    var viewport = panel.getViewport();
                    viewport.attachRefreshRequested(function(event) {
                        if (!this.getEnabled()) {
                            return;
                        }
                        this._updateDisplayStates(panel);
                    }.bind(this));
                }.bind(this));
            },

            _updateDisplayStates: function(panel) {
                var sceneNodeIdsByOpacity = new sap.ui.vtm.Lookup(),
                    sceneNodeIdsByHighlightColor = new sap.ui.vtm.Lookup(),
                    hiddenSceneNodeIds = [],
                    visibleSceneNodeIds = [];
                this._calculateDisplayStates(panel, hiddenSceneNodeIds, visibleSceneNodeIds, sceneNodeIdsByOpacity, sceneNodeIdsByHighlightColor);
                this._applyDisplayStates(panel, hiddenSceneNodeIds, visibleSceneNodeIds, sceneNodeIdsByOpacity, sceneNodeIdsByHighlightColor);
             },

             _applyContextUpdates: function(panel, displayStates) {
                 var viewport = panel.getViewport();
                 var scene = viewport.getScene();
                 var contextDisplayGroups = viewport.getContextDisplayGroups();
                 contextDisplayGroups.reverse().forEach(function(contextDisplayGroup) {
                     var displayStatesBySceneNodeId = contextDisplayGroup.getDisplayStatesBySceneNodeId();
                     if (displayStatesBySceneNodeId) {
                         var sceneNodeIds = Object.getOwnPropertyNames(displayStatesBySceneNodeId);

                         sceneNodeIds.forEach(function(sceneNodeId) {
                             var contextGroupDisplayState = displayStatesBySceneNodeId[sceneNodeId];
                             var visibility = contextGroupDisplayState.visibility;
                             var opacity = contextGroupDisplayState.opacity;
                             var highlightColor = contextGroupDisplayState.highlightColor;
                             var recursive = contextGroupDisplayState.recursive;

                             var sceneNodeIdsToUpdate = [sceneNodeId];
                             if (recursive === true) {
                                 Array.prototype.push.apply(sceneNodeIdsToUpdate, scene.getDescendantIds(sceneNodeId));
                             }

                             sceneNodeIdsToUpdate.forEach(function(sceneNodeIdToUpdate) {
                                 var displayState = displayStates.get(sceneNodeIdToUpdate);
                                 if (visibility !== null && visibility !== undefined) {
                                     displayState.visibility = visibility;
                                 }
                                 if (opacity !== null && opacity !== undefined) {
                                     displayState.opacity = opacity;
                                 }
                                 if (highlightColor !== null && highlightColor !== undefined) {
                                     displayState.highlightColor = highlightColor === "" ? this._defaultHighlightColor : highlightColor;
                                 }
                             });
                         });
                     }
                 });
             },
             
             _applyTreeItemUpdates: function(panel, displayStates) {
                 var tree = panel.getTree();
                 var treeItems = tree.getAllItems();

                 treeItems.forEach(function(treeItem) {
                     var visibility = treeItem.visibility === true;
                     if (visibility) {
                         var sceneNodeIds = sap.ui.vtm.TreeItemUtilities.getSceneNodeIds(treeItem);
                         var opacity = treeItem.opacity;
                         var highlightColor = treeItem.highlightColor;

                         sceneNodeIds.forEach(function(sceneNodeId) {
                             var displayState = displayStates.get(sceneNodeId);
                             displayState.visibility = visibility;
                             displayState.opacity = opacity || this._defaultOpacity;
                             displayState.highlightColor = highlightColor || this._defaultHighlightColor;
                         }.bind(this));
                     }
                 }.bind(this));
             },
             
             _applyOverrideUpdates: function(panel, displayStates) {
                 var viewport = panel.getViewport();
                 var scene = viewport.getScene();
                 var overrideDisplayGroups = viewport.getOverrideDisplayGroups();
                 overrideDisplayGroups.reverse().forEach(function(overrideDisplayGroup) {
                     var displayStatesBySceneNodeId = overrideDisplayGroup.getDisplayStatesBySceneNodeId();
                     if (displayStatesBySceneNodeId) {
                         var sceneNodeIds = Object.getOwnPropertyNames(displayStatesBySceneNodeId);

                         sceneNodeIds.forEach(function(sceneNodeId) {
                             var overrideGroupDisplayState = displayStatesBySceneNodeId[sceneNodeId];
                             var visibility = overrideGroupDisplayState.visibility;
                             var opacity = overrideGroupDisplayState.opacity;
                             var highlightColor = overrideGroupDisplayState.highlightColor;
                             var recursive = overrideGroupDisplayState.recursive;

                             var sceneNodeIdsToUpdate = [sceneNodeId];
                             if (recursive === true) {
                                 Array.prototype.push.apply(sceneNodeIdsToUpdate, scene.getDescendantIds(sceneNodeId));
                             }

                             sceneNodeIdsToUpdate.forEach(function(sceneNodeIdToUpdate) {
                                 var displayState = displayStates.get(sceneNodeIdToUpdate);
                                 if (visibility !== null && visibility !== undefined) {
                                     displayState.visibility = visibility;
                                 }
                                 if (opacity !== null && opacity !== undefined) {
                                     displayState.opacity = opacity;
                                 }
                                 if (highlightColor !== null && highlightColor !== undefined) {
                                     displayState.highlightColor = highlightColor === "" ? this._defaultHighlightColor : highlightColor;
                                 }
                             });
                         });
                     }
                 });
             },

             
             _calculateDisplayStates: function(panel, hiddenSceneNodeIds, visibleSceneNodeIds, sceneNodeIdsByOpacity, sceneNodeIdsByHighlightColor) {
                 sap.ui.vtm.measure(this, "_calculateDisplayStates", function() {
                     var allSceneNodeIds;
                     var displayStates = new Map();
                     
                     sap.ui.vtm.measure(this, "_calculateDisplayStates - Get all ids", function() {
                         allSceneNodeIds = this._vtm.getScene().getCachedIds();
                     }.bind(this));

                     sap.ui.vtm.measure(this, "creating display states", function() {
                         allSceneNodeIds.forEach(function(sceneNodeId) {
                             displayStates.set(sceneNodeId, {
                                 visibility: this._defaultVisibility,
                                 opacity: this._defaultOpacity,
                                 highlightColor: this._defaultHighlightColor
                             });
                         }.bind(this));
                     }.bind(this));

                     sap.ui.vtm.measure(this, "_applyContextUpdates (" + panel.getId() + ")", function() {
                         this._applyContextUpdates(panel, displayStates);
                     }.bind(this));

                     sap.ui.vtm.measure(this, "_applyTreeItemUpdates (" + panel.getId() + ")", function() {
                         this._applyTreeItemUpdates(panel, displayStates);
                     }.bind(this));

                     sap.ui.vtm.measure(this, "_applyOverrideUpdates (" + panel.getId() + ")", function() {
                         this._applyOverrideUpdates(panel, displayStates);
                     }.bind(this));

                     sap.ui.vtm.measure(this, "_calculateDisplayStates - Populating lookups", function() {
                         displayStates.forEach(function(displayState, sceneNodeId) {
                             if (displayState.visibility) {
                                 visibleSceneNodeIds.push(sceneNodeId);
                                 sceneNodeIdsByOpacity.addValue(displayState.opacity, sceneNodeId);
                                 sceneNodeIdsByHighlightColor.addValue(displayState.highlightColor, sceneNodeId);
                             } else {
                                 hiddenSceneNodeIds.push(sceneNodeId);
                             }
                         });
                     });
                 }.bind(this));
             },

             _applyDisplayStates: function(panel, hiddenSceneNodeIds, visibleSceneNodeIds, sceneNodeIdsByOpacity, sceneNodeIdsByHighlightColor) {
                 sap.ui.vtm.measure(this, "_applyDisplayStates", function() {
                     var viewport = panel.getViewport();
                     viewport.setVisibility(hiddenSceneNodeIds, false, false);

                     if (visibleSceneNodeIds.length) {
                         viewport.setVisibility(visibleSceneNodeIds, true, false);

                         sceneNodeIdsByOpacity.forEach(function(sceneNodeIds, opacity) {
                             viewport.setOpacity(sceneNodeIds, opacity, false);
                         });

                         sceneNodeIdsByHighlightColor.forEach(function(sceneNodeIds, highlightColor) {
                             viewport.setHighlightColor(sceneNodeIds, highlightColor, false);
                         });
                     }
                 });
             }
         });

         return DisplayStateCalculationExtension;
     });