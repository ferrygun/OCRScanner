/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ["jquery.sap.global", "sap/ui/core/Control", "../Extension", "../ViewportHandler"],
    function (jQuery, SapUiCoreControl, SapUiVtmExtension, SapUiVtmHoverHandler) {

        "use strict";

        /**
         * Constructor for a new SceneNodeHoverTooltipExtension.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @name sap.ui.vtm.extensions.SceneNodeHoverTooltipExtension
         * @public
         * @class
         * Adds a behaviour in which a tooltip (which can be specified by application code using a callback function) is displayed when the mouse is hovering over a scene node.
         * @author SAP SE
         * @version 1.52.0
         * @constructor
         * @param {string?} sId id for the new instance.
         * @param {object?} mSettings Object with initial property values, aggregated objects etc. for the new instance.
         * @extends sap.ui.vtm.Extension
         * @implements sap.ui.vtm.interfaces.ISceneNodeHoverTooltipExtension
         */
        var SceneNodeHoverTooltipExtension = SapUiVtmExtension.extend("sap.ui.vtm.extensions.SceneNodeHoverTooltipExtension", /** @lends sap.ui.vtm.extensions.SceneNodeHoverTooltipExtension.prototype */ {
            metadata: {
                interfaces: [
                    "sap.ui.vtm.interfaces.ISceneNodeHoverTooltipExtension"
                ],
                properties: {
                    /**
                    * A callback function that gets a tooltip for a given {@link sap.ui.vtm.SceneNode}.
                    * If unspecified, the scene node name is used for the tooltip text.
                    *
                    * The first parameter is the {@link sap.ui.vtm.SceneNode} under cursor.<br>
                    * The function should return an object containing a tooltip text for the specified scene node.
                    * <pre>
                    *   {
                    *     text: [string]
                    *   }
                    * </pre>
                    * If function returns null no tooltip will be displayed.
                    */
                    tooltipCallback: {type: "any", group: "Behavior", defaultValue: null}
                }
            },

            constructor: function(sId, mSettings) {
                SapUiVtmExtension.apply(this, arguments); // Force non-lazy construction
            },

            createTooltip: function(id, text) {
                var tooltip = document.createElement("div");
                tooltip.className = "sapUiVtmSceneNode-Tooltip";
                tooltip.innerText = text;
                return tooltip;
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

                        var currentHoverNodeId = sap.ve.dvl.DVLID_INVALID;
                        var vkViewport = viewport._getVkViewport();
                        var x, y;
                        var tooltipDiv;

                        var defaultTooltipFunction = function(sceneNode) {
                            return { text: sceneNode.getName() };
                        };
                        var hoverSceneNode = new sap.ui.vtm.SceneNode({
                            scene: scene
                        });

                        var hideTooltip = function() {
                            if (tooltipDiv) {
                                vkViewport.getDomRef().removeChild(tooltipDiv);
                                tooltipDiv = undefined;
                            }
                        };

                        var showTooltip = function(nodeId, x, y) {
                            if (nodeId !== sap.ve.dvl.DVLID_INVALID) {
                                hoverSceneNode.setSceneNodeId(nodeId);
                                var callback = this.getTooltipCallback() || defaultTooltipFunction;
                                var tooltip = callback(hoverSceneNode);
                                if (tooltip) {
                                    tooltipDiv = this.createTooltip(nodeId, tooltip.text);
                                    tooltipDiv.style.left = "calc(" + Math.floor(x) + "px + 1em)";
                                    tooltipDiv.style.top = "calc(" + Math.floor(y) + "px + 1.5em)";
                                    vkViewport.getDomRef().appendChild(tooltipDiv);
                                }
                            }
                        }.bind(this);

                        this.attachEnabledChanged(function(event) {
                            if (this.getEnabled() && currentHoverNodeId) {
                                showTooltip(currentHoverNodeId, x, y);
                            } else {
                                hideTooltip();
                            }
                            vkViewport.renderFrame();
                        }.bind(this));

                        viewport.addEventDelegate({
                            onmouseout: function() {
                                hideTooltip();
                                currentHoverNodeId = sap.ve.dvl.DVLID_INVALID;
                                x = y = null;
                                viewport.refresh();
                            }
                        }, viewport);

                        viewport.attachHover(function(event) {
                            var nodeId = event.getParameter("nodeId");
                            x = event.getParameter("x");
                            y = event.getParameter("y");

                            if (!this.getEnabled()) {
                                currentHoverNodeId = nodeId;
                                return;
                            }
                            if (nodeId !== currentHoverNodeId) {
                                hideTooltip();
                                currentHoverNodeId = nodeId;
                                showTooltip(nodeId, x, y);
                            }
                            vkViewport.renderFrame();
                        }.bind(this));

                        viewport.attachBeginGesture(function(event) {
                            hideTooltip();
                            currentHoverNodeId = sap.ve.dvl.DVLID_INVALID;
                            x = y = null;
                            viewport.refresh();
                        });

                    }.bind(this));

                }.bind(this));
            }
        });

        return SceneNodeHoverTooltipExtension;
    });