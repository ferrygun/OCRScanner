/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ["jquery.sap.global", "sap/ui/core/Control", "sap/ui/vk/dvl/Viewport", "sap/m/OverflowToolbar", "./ViewportHandler", "sap/ui/vk/FlexibleControl", "sap/ui/vk/FlexibleControlLayoutData"],
    function (jQuery, SapUiCoreControl, SapUiVkDvlViewport, SapMOverflowToolbar, SapUiVtmViewportHandler, SapUiVkFlexibleControl, SapUiVkFlexibleControlLayoutData) {

        "use strict";

        /**
         * This class is not intended to be instantiated directly by application code.
         * A {@link sap.ui.vtm.Viewport} object is created when a {@link sap.ui.vtm.Panel} object is instantiated.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @name sap.ui.vtm.Viewport
         * @public
         * @class
         * A control that contains a 3D viewport.
         * @author SAP SE
         * @version 1.52.0
         * @extends sap.ui.core.Control
         */
        var Viewport = SapUiCoreControl.extend("sap.ui.vtm.Viewport", /** @lends sap.ui.vtm.Viewport.prototype */ {
            metadata: {
                properties:{
                    /**
                     * The background gradient top color.
                     */
                    backgroundGradientTopColor: {type: "sap.ui.core.CSSColor", defaultValue: "black"},

                    /**
                     * The background gradient bottom color
                     */
                    backgroundGradientBottomColor: {type: "sap.ui.core.CSSColor", defaultValue: "white"},

                    /**
                     * Allows the calculated display state of scene nodes in the viewport o be overridden.
                     *
                     * A set of {@link sap.ui.vtm.DisplayGroup} objects that each specify the display state for a set of scene nodes.
                     * Precedence is inherent in the array ordering.
                     * Any display state specified in this way takes precedence over display states specified for geometry associated with tree items
                     * or specified using {@link #contextGroups}.
                     * Call {@link #refresh} to recalculate the display state in the viewport after modifying override display groups.
                     */
                    overrideDisplayGroups: {type: "object[]", defaultValue: []},

                    /**
                     * Allows the calculated display state for scene nodes whose display state is not determined by
                     * tree item associations or override display groups to be specified.
                     *
                     * A set of {@link sap.ui.vtm.DisplayGroup} objects objects that describe display states to apply to scene nodes.
                     * Precedence is inherent in the array ordering.
                     * Call {@link #refresh} to recalculate the display state in the viewport after modifying override display groups.
                     */
                    contextDisplayGroups: {type: "object[]", defaultValue: []}
                },
                aggregations: {
                    _container: {
                        type: "sap.m.VBox",
                        multiple: false,
                        visibility: "hidden"
                    }
                },
                associations : {
                    /**
                     * A set of controls such as toolbars to appear above the 3D viewport.
                     */
                    headerControls: {
                        type: "sap.ui.core.Control",
                        multiple: true
                    }
                },
                events: {
                    /**
                     * Raised when the selection is changed due to a click in the viewport (either on a node or in empty space).
                     */
                    selectionChanged: {
                        parameters: {
                            /**
                             * IDs of newly selected nodes.
                             */
                            selectedIds: { type: "string[]" },
                            /**
                             * IDs of newly unselected nodes.
                             */
                            unselectedIds: { type: "string[]" },
                            /**
                             * <code>true</code> if this event is raised as a result of a user clicking in the viewport.
                             */
                            userInteraction: { type: "boolean"}
                        }
                    },

                    /**
                     * Raised when a node in the viewport is clicked.
                     */
                    nodeClicked: {
                        /**
                         * The clicked scene node.
                         */
                        sceneNode: {type: "sap.ui.vtm.SceneNode"}
                    },

                    /**
                     * Raised when the visibility of scene nodes changed in the viewport.
                     */
                    visibilityChanged: {
                        parameters: {
                            /**
                             * The IDs of newly shown nodes.
                             */
                            visibleIds: {type: "string[]"},
                            /**
                             * The IDs of newly hidden nodes.
                             */
                            hiddenIds: {type: "string[]" },
                            /**
                             * <code>true</code> if this event is raised as a result of a user clicking in the viewport.
                             */
                            userInteraction: { type: "boolean"}
                        }
                    },

                    /**
                     * Raised when viewport's camera view changed.
                     */
                    viewChanged: {
                        parameters: {
                            /**
                             * Information about the current camera view. Can be passed to {@link sap.ui.vk.dvl.Viewport#setCameraInfo setCameraInfo}.
                             */
                            cameraInfo: {type: "object"}
                        }
                    },

                    /**
                     * Raised when {@link sap.ui.vk.dvl.Viewport#refresh refresh} is called.
                     * This event can be used by code that is managing the viewport display state.
                     */
                    refreshRequested: {},

                    /**
                     * Raised on mouse move over viewport.
                     */
                    hover: {
                        parameters: {
                            /**
                             * Mouse X-coordinate within viewport
                             */
                            x: {type: "float"},
                            /**
                             * Mouse Y-coordinate within viewport
                             */
                            y: {type: "float"},
                            /**
                             * The ID of the node that is under the viewport coordinates (x, y).
                             */
                            nodeId: {type: "string"}
                        }
                    },

                    /**
                     * Raised when a gesture begins.
                     */
                    beginGesture: {},

                    /**
                     * Raised when a gesture ends.
                     */
                    endGesture: {}
                }
            },

            _getVkViewport: function () {
                return this.vkViewport;
            },

            _getContainer: function () {
                return this.getAggregation("_container");
            },

            init: function() {
                this._programmaticSelectionChangeInProgress = false;
                this._programmaticVisibilityChangeInProgress = false;
            },

            _initialize: function() {
                var vtm = this.getPanel().getVtm();
                if (vtm) {
                    var scene = vtm.getScene();
                    this._setScene(scene);

                    var vkViewport = this._getVkViewport();
                    var loco = vkViewport._loco;
                    if (vkViewport._viewportHandler) {
                        loco.removeHandler(vkViewport._viewportHandler);
                    }
                    if (vkViewport._smart2DHandler) {
                        loco.removeHandler(vkViewport._smart2DHandler);
                    }
                    var viewportHandler = new SapUiVtmViewportHandler(this);
                    loco.addHandler(viewportHandler);

                    scene.attachEvent("sceneCreated", function() {
                        this._onSceneCreated();
                    }.bind(this));
                }
            },

            renderer: function (oRM, oControl) {
                oRM.write("<div");
                oRM.writeControlData(oControl);
                oRM.addStyle("height", "inherit");
                oRM.addStyle("overflow", "hidden");
                oRM.writeStyles();
                oRM.writeClasses();
                oRM.write(">");

                var container = oControl._getContainer();
                oRM.renderControl(container);

                oRM.write("</div>");
            },

            onBeforeRendering: function() {
                if (!this._initialized) {
                    this._initialized = true;
                    this._initialize();
                }
            },

            /**
             * Returns whether the {@link sap.ui.vtm.Viewport} has been initialized.
             * @public
             * @function
             * @returns {boolean} Whether the {@link sap.ui.vtm.Viewport} has been initialized.
             */
            getInitialized: function() {
                return this._initialized;
            },

            /**
             * Fires a <code>refreshRequested</code> event.
             * @public
             * @function
             * @returns {sap.ui.vtm.Viewport} <code>this</code> for method chaining.
             * @fires refresh
             */
            refresh: function() {
                sap.ui.vtm.measure(this, "fireRefreshRequested", function() {
                    this.fireRefreshRequested();
                }.bind(this));
                return this;
            },

            _raiseHover: function(x, y, nodeId) {
                this.fireHover({x: x, y: y, nodeId: nodeId});
            },

            _raiseBeginGesture: function() {
                this.fireBeginGesture();
            },

            _raiseEndGesture: function() {
                this.fireEndGesture();
            },

            setBackgroundGradientTopColor: function(sColor) {
                this.setProperty("backgroundGradientTopColor", sColor);
                this._getVkViewport().setBackgroundColorTop(sColor);
                return this;
            },

            setBackgroundGradientBottomColor: function(sColor) {
                this.setProperty("backgroundGradientBottomColor", sColor);
                this._getVkViewport().setBackgroundColorBottom(sColor);
                return this;
            },

            _getAncestor: function(ancestorType) {
                var ancestor = this.getParent();
                while (ancestor && ancestor.getMetadata().getName() !== ancestorType) {
                    ancestor = ancestor.getParent();
                }
                return ancestor;
            },

            /**
             * Gets the panel this viewport belongs to.
             * @function
             * @public
             * @return {sap.ui.vtm.Panel} The panel this viewport belongs to.
             */
            getPanel: function() {
                if (!this._panel) {
                    this._panel = this._getAncestor("sap.ui.vtm.Panel");
                }
                return this._panel;
            },

            /**
             * Gets the {@link sap.ui.vtm.Scene} used by this {@link sap.ui.vtm.Viewport}.
             * @public
             * @function
             * @returns {sap.ui.vtm.Scene} The sap.ui.vtm.Scene used by this Viewport.
             */
            getScene: function () {
                return this._scene;
            },

            _onSceneCreated: function (event) {
                var scene = this.getScene();
                var vkScene = scene._vkScene;

                if (!this._vkScene && vkScene) {

                    var vkViewport = this._getVkViewport();
                    this._vkScene = vkScene;
                    vkViewport.setScene(vkScene);

                    this._vkDefaultNodeHierarchy = vkScene.getDefaultNodeHierarchy();
                    if (this._vkDefaultNodeHierarchy && this._vkGraphicsCore) {

                        this._vkViewStateManager = this._vkGraphicsCore.createViewStateManager(this._vkDefaultNodeHierarchy, true, true);
                        if (this._vkViewStateManager) {
                            vkViewport.setViewStateManager(this._vkViewStateManager);

                            this._vkViewStateManager.attachSelectionChanged(function(event) {
                                var selectedIds = event.getParameter("selected");
                                var unselectedIds = event.getParameter("unselected");

                                sap.ui.vtm.measure(this, "fireSelectionChanged", function() {
                                    this.fireSelectionChanged({
                                        selectedIds: selectedIds,
                                        unselectedIds: unselectedIds,
                                        userInteraction: !this._programmaticSelectionChangeInProgress
                                    });
                                }.bind(this));
                            }.bind(this));

                            this._vkViewStateManager.attachVisibilityChanged(function(event) {
                                var visibleIds = event.getParameter("visible");
                                var hiddenIds = event.getParameter("hidden");

                                sap.ui.vtm.measure(this, "fireVisibilityChanged", function() {
                                    this.fireVisibilityChanged({
                                        visibleIds: visibleIds,
                                        hiddenIds: hiddenIds,
                                        userInteraction: !this._programmaticVisibilityChangeInProgress
                                    });
                                }.bind(this));
                            }.bind(this));

                            var onViewChanged = function() {
                                sap.ui.vtm.measure(this, "fireViewChanged", function() {
                                    this.fireViewChanged({
                                        cameraInfo: this.getCameraInfo()
                                    });
                                }.bind(this));
                            }.bind(this);

                            vkViewport.attachZoom(onViewChanged);
                            vkViewport.attachPan(onViewChanged);
                            vkViewport.attachRotate(onViewChanged);

                            vkViewport.attachNodeClicked(function(event) {
                                var nodeId = event.getParameters().nodeId;
                                sap.ui.vtm.measure(this, "fireNodeClicked", function() {
                                    var sceneNode = scene._getSceneNode(nodeId);
                                    try {
                                        this.fireNodeClicked({sceneNode: sceneNode});
                                    } finally {
                                        sceneNode.destroy();
                                    }
                                }.bind(this));
                            }.bind(this));

                            vkViewport.attachFrameRenderingFinished(function(event) {
                                this.fireEvent("frameRenderingFinished", event);
                            }.bind(this));
                        }
                    }
                }
            },

            getHeaderControls: function() {
                var ids = this.getAssociation("headerControls");
                var controls = [];
                if (ids) {
                    ids.forEach(function(id) {
                        var control = sap.ui.getCore().byId(id);
                        if (control) {
                            controls.push(control);
                        }
                    });
                }
                return controls;
            },

            /**
             * Sets the {@link sap.ui.vtm.Scene} used by this {@link sap.ui.vtm.Viewport}.
             * @private
             * @function
             * @param {sap.ui.vtm.Scene} oScene The sap.ui.vtm.Scene to be used by this Viewport.
             * @returns {sap.ui.vtm.Viewport} Returns <code>this</code> for method chaining.
             */
            _setScene: function(oScene) {
                if (!oScene || this._scene) {
                    return this;
                }

                var vkViewport = new sap.ui.vk.dvl.Viewport(this.getId() + "_sapUiVkViewport", {
                    height: "100%"
                });
                this.vkViewport = vkViewport;

                this._scene = oScene;
                if (oScene) {
                    this._vkGraphicsCore = this._scene._vkGraphicsCore;
                    if (this._vkGraphicsCore) {
                        vkViewport.setGraphicsCore(this._vkGraphicsCore);
                        vkViewport.setBackgroundColorTop(this.getBackgroundGradientTopColor());
                        vkViewport.setBackgroundColorBottom(this.getBackgroundGradientBottomColor());
                    }
                }

                var headerControls = this.getHeaderControls();
                headerControls.forEach(function(headerControl) {
                    if (headerControl) {
                        headerControl.setLayoutData(new sap.m.FlexItemData({growFactor: 0, shrinkFactor: 0}));
                    }
                });
                vkViewport.setLayoutData(new sap.m.FlexItemData({growFactor: 1, shrinkFactor: 1, minHeight: "10px"}));

                var container = new sap.m.VBox({
                    fitContainer: true,
                    // due to the bugs in IE related with flexible box layout different render type has to be used
                    renderType: sap.ui.Device.browser.msie ? sap.m.FlexRendertype.Div : sap.m.FlexRendertype.Bare,
                    items: [headerControls, vkViewport]
                });
                this.setAggregation("_container", container);

                return this;
            },

            /**
             * Zooms to the set of geometry that is selected in the current viewport.
             * If no geometry is selected, no action is taken.
             * @public
             * @function
             * @param {number?} durationInSeconds The duration of the zoom animation in seconds.
             * @returns {sap.ui.vtm.Viewport} Returns <code>this</code> for method chaining.
             */
            zoomToSelected: function(durationInSeconds) {
                sap.ui.vtm.measure(this, "zoomToSelected", function() {
                    if (durationInSeconds === null || durationInSeconds === undefined) {
                        durationInSeconds = 0.2;
                    }
                    this._getVkViewport().zoomTo(sap.ui.vk.ZoomTo.Selected, null, durationInSeconds, 0);
                }.bind(this));
                return this;
            },

            /**
             * Zooms to the set of geometry that is visible in the current viewport.
             * If no geometry is visible, this zooms to all geometry in the current viewport.
             * @public
             * @function
             * @param {number?} durationInSeconds The duration of the zoom animation in seconds.
             * @returns {sap.ui.vtm.Viewport} Returns <code>this</code> for method chaining.
             */
            zoomToVisible: function(durationInSeconds) {
                sap.ui.vtm.measure(this, "zoomToVisible", function() {
                    if (durationInSeconds === null || durationInSeconds === undefined) {
                        durationInSeconds = 0.2;
                    }
                    this._getVkViewport().zoomTo(sap.ui.vk.ZoomTo.Visible, null, durationInSeconds, 0);
                }.bind(this));
                return this;
            },

            /**
             * Calls {@link sap.ui.vtm.Viewport#zoomToSelected zoomToSelected} if any geometry is selected in this viewport, otherwise calls {@link sap.ui.vtm.Viewport#zoomToAll zoomToAll}.
             * @public
             * @function
             * @param {number?} durationInSeconds The duration of the zoom animation in seconds.
             * @returns {sap.ui.vtm.Viewport} Returns <code>this</code> for method chaining.
             */
            zoomToFit: function(durationInSeconds) {
                var anyItemsSelected = false;
                if (this._vkViewStateManager) {
                    this._vkViewStateManager.enumerateSelection(function() { anyItemsSelected = true; });
                }
                if (anyItemsSelected) {
                    this.zoomToSelected(durationInSeconds);
                } else {
                    this.zoomToVisible(durationInSeconds);
                }
                return this;
            },

            /**
             * Zooms to a view in the current viewport that can fit all geometry in the scene (visible or not).
             * @public
             * @function
             * @param {number?} durationInSeconds The duration of the zoom animation in seconds.
             * @returns {sap.ui.vtm.Viewport} Returns <code>this</code> for method chaining.
             */
            zoomToAll: function(durationInSeconds) {
                sap.ui.vtm.measure(this, "zoomToAll", function() {
                    if (durationInSeconds === null || durationInSeconds === undefined) {
                        durationInSeconds = 0.2;
                    }
                    this._getVkViewport().zoomTo(sap.ui.vk.ZoomTo.All, null, durationInSeconds, 0);
                }.bind(this));
                return this;
            },

            /**
             * Gets the visibility state for a set of scene nodes in this viewport.
             * @public
             * @function
             * @param {string|string[]} sceneNodeIds A scene node ID or an array of scene node IDs.
             * @returns {boolean|boolean[]} The visibility states for the relevant scene nodes.
             */
            getVisibility: function (sceneNodeIds) {
                var visibilityValues;
                sap.ui.vtm.measure(this, "getVisibility", function() {
                    if (this._vkViewStateManager) {
                        visibilityValues = this._vkViewStateManager.getVisibilityState(sceneNodeIds);
                    }
                }.bind(this));
                return visibilityValues;
            },

            /**
             * Sets the visibility state for a set of scene nodes in this viewport.
             * 
             * This method should not be called by application code when an extension implementing {@link sap.ui.vtm.interfaces.IDisplayStateCalculationExtension} is being used.
             * In that case the extension implementing {@link sap.ui.vtm.interfaces.IDisplayStateCalculationExtension} should perform all management of scene node visibility in the viewports.
             * @public
             * @function
             * @param {string|string[]} sceneNodeIds A scene node ID or an array of scene node IDs.
             * @param {boolean} visibility The visibility state to apply to the relevant scene nodes.
             * @param {boolean} recursive If true the specified visibility state will be applied to the descendants of the specified scene nodes.
             * @returns {sap.ui.vtm.Viewport} <code>this</code> for method chaining.
             */
            setVisibility: function (sceneNodeIds, visibility, recursive) {
                if (jQuery.sap.debug()) {
                    var params = {
                        viewport: this.getId(),
                        visibility: visibility,
                        recursive: recursive,
                        sceneNodeIds: sceneNodeIds
                    };
                    jQuery.sap.log.warning("setVisibility " + JSON.stringify(params));
                }
                sap.ui.vtm.measure(this, "setVisibility", function() {
                    if (Array.isArray(sceneNodeIds) && !sceneNodeIds.length) {
                        return this;
                    }
                    if (this._vkViewStateManager) {
                        try {
                            this._programmaticVisibilityChangeInProgress = true;
                            this._vkViewStateManager.setVisibilityState(sceneNodeIds, visibility, recursive);
                        } finally {
                            this._programmaticVisibilityChangeInProgress = false;
                        }
                    }
                }.bind(this));
                return this;
            },

            /**
             * Gets the opacity for a set of scene nodes in this viewport.
             * Opacity is specified as a floating point value in the interval [0,1].
             * @public
             * @function
             * @param {string|string[]} sceneNodeIds A scene node ID or an array of scene node IDs.
             * @returns {number|number[]} The opacity states for the relevant scene nodes.
             */
            getOpacity: function (sceneNodeIds) {
                var opacityValues;
                sap.ui.vtm.measure(this, "getOpacity", function() {
                    if (this._vkViewStateManager) {
                        opacityValues = this._vkViewStateManager.getOpacity(sceneNodeIds);
                        this._scene.traverseNodes(sceneNodeIds, function(sceneNode, i) {
                            if (Array.isArray(sceneNodeIds)) {
                                if (opacityValues[i] == null) {
                                    opacityValues[i] = sceneNode._vkNodeProxy.getOpacity();
                                }
                            } else if (opacityValues == null) {
                                opacityValues = sceneNode._vkNodeProxy.getOpacity();
                            }
                        });
                    }
                }.bind(this));
                return opacityValues;
            },

            /**
             * Sets the opacity for a set of scene nodes in this viewport.
             * Opacity is specified as a floating point value in the interval [0,1].
             * 
             * This method should not be called by application code when an extension implementing {@link sap.ui.vtm.interfaces.IDisplayStateCalculationExtension} is being used.
             * In that case the extension implementing {@link sap.ui.vtm.interfaces.IDisplayStateCalculationExtension} should perform all management of scene node visibility in the viewports.
             * @public
             * @function
             * @param {string|string[]} sceneNodeIds A scene node ID or an array of scene node IDs.
             * @param {number} opacity The opacity state to apply to the relevant scene nodes.
             * @param {boolean} recursive If true the specified opacity state will be applied to the descendants of the specified scene nodes.
             * @returns {sap.ui.vtm.Viewport} <code>this</code> for method chaining.
             */
            setOpacity: function (sceneNodeIds, opacity, recursive) {
                if (jQuery.sap.debug()) {
                    var params = {
                        viewport: this.getId(),
                        opacity: opacity,
                        recursive: recursive,
                        sceneNodeIds: sceneNodeIds
                    };
                    jQuery.sap.log.warning("setOpacity " + JSON.stringify(params));
                }
                sap.ui.vtm.measure(this, "setOpacity", function() {
                    if (Array.isArray(sceneNodeIds) && !sceneNodeIds.length) {
                        return this;
                    }
                    if (this._vkViewStateManager) {
                        this._vkViewStateManager.setOpacity(sceneNodeIds, opacity, recursive);
                    }
                }.bind(this));
                return this;
            },

            /**
             * Gets the highlight colors for a set of scene nodes in this viewport.
             * @public
             * @function
             * @param {string|string[]} sceneNodeIds A scene node ID or an array of scene node IDs.
             * @returns {sap.ui.core.CSSColor|sap.ui.core.CSSColor[]} The highlight colors for the relevant scene nodes. The
             */
            getHighlightColor: function (sceneNodeIds) {
                var highlightColorValues;
                sap.ui.vtm.measure(this, "getHighlightColor", function() {
                    if (this._vkViewStateManager) {
                        highlightColorValues = this._vkViewStateManager.getTintColor(sceneNodeIds);
                        this._scene.traverseNodes(sceneNodeIds, function(sceneNode, i) {
                            if (Array.isArray(sceneNodeIds)) {
                                if (highlightColorValues[i] == null) {
                                    highlightColorValues[i] = sceneNode._vkNodeProxy.getTintColor();
                                }
                            } else if (highlightColorValues == null) {
                                highlightColorValues = sceneNode._vkNodeProxy.getTintColor();
                            }
                        });
                    }
                }.bind(this));
                return highlightColorValues;
            },

            /**
             * Sets the highlight color for a set of scene nodes in this viewport.
             * 
             * This method should not be called by application code when an extension implementing {@link sap.ui.vtm.interfaces.IDisplayStateCalculationExtension} is being used.
             * In that case the extension implementing {@link sap.ui.vtm.interfaces.IDisplayStateCalculationExtension} should perform all management of scene node visibility in the viewports.
             * @public
             * @function
             * @param {string|string[]} sceneNodeIds A scene node ID or an array of scene node IDs.
             * @param {sap.ui.core.CSSColor|null} color The highlight color to apply to the relevant scene nodes. If null, the highlight color is removed.<br/>
             * The alpha component of the color controls the blending ratio between the highlight color and the geometry color.
             * @param {boolean} recursive If true the specified highlight color will be applied to the descendants of the specified scene nodes.
             * @returns {sap.ui.vtm.Viewport} <code>this</code> for method chaining.
             */
            setHighlightColor: function (sceneNodeIds, color, recursive) {
                 if (jQuery.sap.debug()) {
                    var params = {
                        viewport: this.getId(),
                        color: color,
                        recursive: recursive,
                        sceneNodeIds: sceneNodeIds
                    };
                    jQuery.sap.log.warning("setHighlightColor " + JSON.stringify(params));
                }
                sap.ui.vtm.measure(this, "setHighlightColor", function() {
                    if (Array.isArray(sceneNodeIds) && !sceneNodeIds.length) {
                        return this;
                    }
                    if (this._vkViewStateManager) {
                        this._vkViewStateManager.setTintColor(sceneNodeIds, color, recursive);
                    }
                }.bind(this));
                return this;
            },

            /**
             * Gets the selection state for a set of scene nodes in this viewport.
             * @public
             * @function
             * @param {string|string[]} sceneNodeIds A scene node ID or an array of scene node IDs.
             * @returns {boolean|boolean[]} The selection states for the relevant scene nodes.
             */
            getSelected: function (sceneNodeIds) {
                var selectedValues;
                sap.ui.vtm.measure(this, "getSelected", function() {
                    if (this._vkViewStateManager) {
                        selectedValues = this._vkViewStateManager.getSelectionState(sceneNodeIds);
                    }
                }.bind(this));
                return selectedValues;
             },

            /**
             * Sets the selection state for a set of scene nodes in this viewport.
             * 
             * This method should not be called by application code when an extension implementing {@link sap.ui.vtm.interfaces.IViewportSelectionLinkingExtension} is being used.
             * In that case the extension implementing {@link sap.ui.vtm.interfaces.IViewportSelectionLinkingExtension} should perform all management of scene node selection in the viewports.
             * @public
             * @function
             * @param {string|string[]} sceneNodeIds A scene node ID or an array of scene node IDs.
             * @param {boolean} selected The new selection state of the nodes.
             * @param {boolean} recursive The flags indicates if the change needs to propagate recursively to child nodes.
             * @returns {sap.ui.vtm.Viewport} <code>this</code> for method chaining.
             */
            setSelected: function (sceneNodeIds, selected, recursive) {
                if (jQuery.sap.debug()) {
                    var params = {
                        viewport: this.getId(),
                        selected: selected,
                        recursive: recursive,
                        sceneNodeIds: sceneNodeIds
                    };
                    jQuery.sap.log.warning("setSelected " + JSON.stringify(params));
                }
                sap.ui.vtm.measure(this, "setSelected", function() {
                    if (Array.isArray(sceneNodeIds) && !sceneNodeIds.length) {
                        return this;
                    }
                    if (this._vkViewStateManager) {
                        try {
                            this._programmaticSelectionChangeInProgress = true;
                            this._vkViewStateManager.setSelectionState(sceneNodeIds, selected, recursive);
                        } finally {
                            this._programmaticSelectionChangeInProgress = false;
                        }
                    }
                }.bind(this));
                return this;
            },

            /**
             * Gets the IDs of the scene nodes that are selected in this viewport.
             * @public
             * @function
             * @return {string[]} The IDs of the scene nodes that are selected in this viewport.
             */
            getSelectedIds: function() {
                var ids = [];
                sap.ui.vtm.measure(this, "getSelectedIds", function() {
                    if (this._vkViewStateManager) {
                        this._vkViewStateManager.enumerateSelection(function (itemId) { ids.push(itemId); });
                    }
                }.bind(this));
                return ids;
            },

            /**
             * Sets the view in the current viewport to one of the predefined views.
             * @public
             * @function
             * @param {sap.ui.vtm.PredefinedView} view The predefined view to apply.
             * @returns {sap.ui.vtm.Viewport} <code>this</code> for method chaining.
             */
            setPredefinedView: function(view) {
                var zoomTo;
                switch (view) {
                case sap.ui.vtm.PredefinedView.Top:
                    zoomTo = sap.ui.vk.ZoomTo.ViewTop;
                    break;
                case sap.ui.vtm.PredefinedView.Bottom:
                    zoomTo = sap.ui.vk.ZoomTo.ViewBottom;
                    break;
                case sap.ui.vtm.PredefinedView.Front:
                    zoomTo = sap.ui.vk.ZoomTo.ViewFront;
                    break;
                case sap.ui.vtm.PredefinedView.Back:
                    zoomTo = sap.ui.vk.ZoomTo.ViewBack;
                    break;
                case sap.ui.vtm.PredefinedView.Left:
                    zoomTo = sap.ui.vk.ZoomTo.ViewLeft;
                    break;
                case sap.ui.vtm.PredefinedView.Right:
                    zoomTo = sap.ui.vk.ZoomTo.ViewRight;
                    break;
                default:
                    throw "Unexpected view value: '" + view + "'.";
                }
                this._getVkViewport().zoomTo(zoomTo, null, 0.2, 0);
                return this;
            },

            /**
             * Retrieves an object containing the current camera information for this viewport.
             *
             * This value can then be passed to {@link sap.ui.vtm.Viewport#setCameraInfo setCameraInfo} to restore the camera position at a later point in time.
             * @public
             * @function
        	 * @returns {object} An object containing the current camera information for this viewport.
             */
            getCameraInfo: function() {
                var viewInfo = this._getVkViewport().getViewInfo({
                    camera: {
                        useTransitionCamera: true
                    },
                    animation: false
                });
                return viewInfo.camera;
            },

            /**
             * Updates the camera for this viewport.
             * @public
             * @function
        	 * @param {object} cameraInfo An object containing camera information returned by {@link sap.ui.vtm.Viewport#getCameraInfo getCameraInfo}.
        	 * @param {float?} flyToDuration A duration in seconds for the transition to the new camera position. Defaults to 0.
        	 * @returns {sap.ui.vtm.Viewport} A reference to <code>this</code> to allow method chaining.
             */
            setCameraInfo: function(cameraInfo, flyToDuration) {
                var viewInfo = {
                    camera: cameraInfo,
                    flyToDuration: flyToDuration || 0
                };
                this._getVkViewport().setViewInfo(viewInfo);
                return this;
            },

            /**
             * Adds an override display group to the <code>overrideDisplayGroups</code> property.
             * @public
             * @function
             * @param {sap.ui.vtm.DisplayGroup} overrideDisplayGroup The override display group to add to the <code>overrideDisplayGroups</code> property.
             * @returns {sap.ui.vtm.Viewport} <code>this</code> for method chaining.
             */
            addOverrideDisplayGroup: function(overrideDisplayGroup) {
                var overrideDisplayGroups = this.getOverrideDisplayGroups();
                overrideDisplayGroups.push(overrideDisplayGroup);
                this.setOverrideDisplayGroups(overrideDisplayGroups);
                return this;
            },

            /**
             * Adds an override display group to the <code>overrideDisplayGroups</code> property.
             * @public
             * @function
             * @param {sap.ui.vtm.DisplayGroup} contextDisplayGroup The context display group to add to the <code>contextDisplayGroups</code> property.
             * @returns {sap.ui.vtm.Viewport} <code>this</code> for method chaining.
             */
            addContextDisplayGroup: function(contextDisplayGroup) {
                var contextDisplayGroups = this.getContextDisplayGroups();
                contextDisplayGroups.push(contextDisplayGroup);
                this.setContextDisplayGroups(contextDisplayGroups);
                return this;
            }
        });

        return Viewport;
    });