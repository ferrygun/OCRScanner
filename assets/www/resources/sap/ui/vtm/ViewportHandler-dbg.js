/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(
    ["jquery.sap.global", "sap/ui/vk/ViewportHandler"],
    function (jQuery, SapUiVkViewportHandler) {
        "use strict";

        /**
         * Constructor for a new ViewportHandler.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @name sap.ui.vtm.ViewportHandler
         * @private
         * @class
         * A {@link sap.ui.vk.ViewportHandler} that fires {@link sap.ui.vtm.Viewport.hover}, {@link sap.ui.vtm.Viewport.beginGesture} and {@link sap.ui.vtm.Viewport.endGesture} events for a {@link sap.ui.vtm.Viewport}.
         * @author SAP SE
         * @version 1.52.0
         * @extends sap.ui.core.Control
         */
        var ViewportHandler = sap.ui.vk.ViewportHandler.extend("sap.ui.vtm.ViewportHandler", /** @lends sap.ui.vtm.ViewportHandler.prototype */ {

            constructor: function(viewport) {
                sap.ui.vk.ViewportHandler.prototype.constructor.call(this, viewport._getVkViewport());
                this._vtmViewport = viewport;
            },

            hover: function(event) {
                if (event.n == 1 && this._inside(event) && this._rect) {
                    var x = event.x - this._rect.x,
                        y = event.y - this._rect.y;

                    var nodeId = this._viewport.hitTest(x, y);
                    this._vtmViewport._raiseHover(x, y, nodeId);
                }
            },

            beginGesture: function(event) {
                this._vtmViewport._raiseBeginGesture();
                SapUiVkViewportHandler.prototype.beginGesture.call(this, event);
            },

            endGesture: function(event) {
                this._vtmViewport._raiseEndGesture();
                SapUiVkViewportHandler.prototype.endGesture.call(this, event);
            }
        });

        return ViewportHandler;
    });