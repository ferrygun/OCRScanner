/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ["jquery.sap.global", "sap/ui/core/Control", "../Extension"],
    function (jQuery, SapUiCoreControl, SapUiVtmExtension) {
        "use strict";


        /**
         * Constructor for a new SceneNodeHoverTooltipExtension.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @name sap.ui.vtm.extensions.SceneNodeHoverHighlightExtension
         * @public
         * @class
         * Adds a behaviour which highlights a scene node when the mouse hovers over it.
         * @author SAP SE
         * @version 1.52.0
         * @constructor
         * @param {string?} sId id for the new instance.
         * @param {object?} mSettings Object with initial property values, aggregated objects etc. for the new instance.
         * @extends sap.ui.vtm.Extension
         * @implements sap.ui.vtm.interfaces.ISceneNodeHoverHighlightExtension
         */
        var SceneNodeHoverHighlightExtension = SapUiVtmExtension.extend("sap.ui.vtm.extensions.SceneNodeHoverHighlightExtension", /** @lends sap.ui.vtm.extensions.SceneNodeHoverHighlightExtension.prototype */ {
           metadata: {
                interfaces: [
                    "sap.ui.vtm.interfaces.ISceneNodeHoverHighlightExtension"
                ],
                properties: {
                    /**
                     * The highlight color to use for the scene node being hovered over.
                     */
                    highlightColor: {type: "sap.ui.core.CSSColor", defaultValue: "rgba(0, 0, 255, 0.7)"}
                }
            },

            constructor: function (sId, mSettings) {
                SapUiVtmExtension.apply(this, arguments); // Force non-lazy construction
            },

            initialize: function () {
                this._panelPanelInitialized = new Map();

                this.applyPanelHandler(function (panel) {
                    var viewport = panel.getViewport();
                    var scene = this._vtm.getScene();

                    scene.attachLoadCompleted(function(event) {
                        if (!event.getParameter("succeeded")) {
                            return;
                        }
                        if (this._panelPanelInitialized.get(panel)) {
                            return;
                        }
                        this._panelPanelInitialized.set(panel, true);

                        var hoverHighlightOverrideDisplayGroup = new sap.ui.vtm.DisplayGroup();
                        var displayStatesBySceneNodeId = hoverHighlightOverrideDisplayGroup.getDisplayStatesBySceneNodeId();
                        var currentHoverNodeId = sap.ve.dvl.DVLID_INVALID;

                        viewport.addOverrideDisplayGroup(hoverHighlightOverrideDisplayGroup);

                        var removeExistingHighlight = function() {
                            if (currentHoverNodeId) {
                                if (displayStatesBySceneNodeId[currentHoverNodeId]) {
                                    delete displayStatesBySceneNodeId[currentHoverNodeId];
                                }
                            }
                        };

                        var applyHighlight = function(nodeId, highlightColor) {
                            if (nodeId !== sap.ve.dvl.DVLID_INVALID) {
                                displayStatesBySceneNodeId[nodeId] = {
                                    highlightColor: highlightColor
                                };
                            }
                        };

                        this.attachEnabledChanged(function(event) {
                            if (this.getEnabled() && currentHoverNodeId) {
                                applyHighlight(currentHoverNodeId, this.getHighlightColor());
                            } else {
                                removeExistingHighlight();
                            }
                            viewport.refresh();
                        }.bind(this));

                        viewport.addEventDelegate({
                            onmouseout: function() {
                                removeExistingHighlight();
                                currentHoverNodeId = sap.ve.dvl.DVLID_INVALID;
                                viewport.refresh();
                            }
                        }, viewport);

                        viewport.attachHover(function(event) {
                            var nodeId = event.getParameter("nodeId");
                            if (!this.getEnabled()) {
                                currentHoverNodeId = nodeId;
                                return;
                            }
                            if (nodeId !== currentHoverNodeId) {
                                removeExistingHighlight();
                                currentHoverNodeId = nodeId;
                                applyHighlight(nodeId, this.getHighlightColor());
                                viewport.refresh();
                            }
                        }.bind(this));

                        viewport.attachBeginGesture(function(event) {
                            removeExistingHighlight();
                            currentHoverNodeId = sap.ve.dvl.DVLID_INVALID;
                            viewport.refresh();
                        });

                    }.bind(this));

                }.bind(this));
            }
        });

        return SceneNodeHoverHighlightExtension;
    });