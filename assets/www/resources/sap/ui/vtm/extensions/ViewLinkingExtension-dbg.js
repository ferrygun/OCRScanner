/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ["jquery.sap.global", "sap/ui/core/Control", "../Extension"],
    function (jQuery, SapUiCoreControl, SapUiVtmExtension) {

        "use strict";

        /**
         * Constructor for the ViewLinkingExtension.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @name sap.ui.vtm.extensions.ViewLinkingExtension
         * @public
         * @class
         * Adds a behavior that links the camera views for all the {@link sap.ui.vtm.Viewport} instances associated with a {@link sap.ui.vtm.Vtm} instance.
         * @author SAP SE
         * @version 1.52.0
         * @extends sap.ui.vtm.Extension
         * @implements sap.ui.vtm.interfaces.IViewLinkingExtension
         */
        var ViewLinkingExtension = SapUiVtmExtension.extend("sap.ui.vtm.extensions.ViewLinkingExtension", /** @lends sap.ui.vtm.extensions.ViewLinkingExtension.prototype */ {
            metadata: {
                interfaces: [
                    "sap.ui.vtm.interfaces.IViewLinkingExtension"
                ]
            },

            constructor: function(sId, mSettings) {
                SapUiVtmExtension.apply(this, arguments); // Force non-lazy construction
            },

            initialize: function () {
                this._skipCount = new Map();

                this.applyPanelHandler(function (panel) {
                    var viewport = panel.getViewport();

                    viewport.attachEvent("frameRenderingFinished", function (event) {
                        if (!this.getEnabled()) {
                            return;
                        }
                        var primaryPanel = this._getPrimaryPanel();
                        if (event.getSource() != primaryPanel.getViewport()) {
                            return;
                        }
                        this._updateViews(panel);
                    }.bind(this));

                }.bind(this));

                this.attachEnabledChanged(function(event) {
                    if (this.getEnabled()) {
                        var primaryPanel = this._getPrimaryPanel();
                        if (primaryPanel) {
                            this._updateViews(primaryPanel);
                        }
                    }
                }.bind(this));
            },
            
            _getPrimaryPanel: function() {
                var panels = this._vtm.getPanels();
                if (!panels || !panels.length) {
                    return null;
                }
                return this._vtm.getActivePanel() || panels[0];
            },

            _updateViews: function(sourcePanel) {
                var sourceViewport = sourcePanel.getViewport();
                if (!sourceViewport.getInitialized()) {
                    return;
                }
                var cameraInfo = sourceViewport.getCameraInfo();
                var panels = this._vtm.getPanels();
                panels.forEach(function(targetPanel) {
                    if (targetPanel !== sourcePanel) {
                        var targetViewport = targetPanel.getViewport();
                        if (targetViewport.getInitialized()) {
                            targetViewport.setCameraInfo(cameraInfo);
                        }
                    }
                });
            }
        });

        return ViewLinkingExtension;
    });