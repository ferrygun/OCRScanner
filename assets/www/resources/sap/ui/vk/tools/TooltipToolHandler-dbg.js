/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.vk.tools.TooltipToolHandler
sap.ui.define([
    "jquery.sap.global", "sap/ui/base/EventProvider"
], function(jQuery, EventProvider) {
    "use strict";

    var TooltipToolHandler = EventProvider.extend("sap.ui.vk.tools.TooltipToolHandler", {
        metadata: {
            publicMethods: [
                "hover",
                "beginGesture",
                "move",
                "endGesture",
                "click",
                "doubleClick",
                "contextMenu" ]
        },
        constructor: function(tool) {
            this._tool = tool;
            this._rect = null;
            this._rayCaster = new THREE.Raycaster();
            this._mouse = new THREE.Vector2();
        }
    });

    TooltipToolHandler.prototype.destroy = function() {
        this._tool = null;
        this._rect = null;
    };

    TooltipToolHandler.prototype._updateMouse = function(event) {
        var size = this.getViewport().getRenderer().getSize();
        this._mouse.x = ((event.x - this._rect.x) / size.width) * 2 - 1;
        this._mouse.y = ((event.y - this._rect.y) / size.height) * -2 + 1;
        this._rayCaster.setFromCamera(this._mouse, this.getViewport().getCamera().getCameraRef());
    };

    TooltipToolHandler.prototype.hover = function(event) {
        var gizmo = this._tool.getGizmo();
        if (gizmo && this._inside(event)) {
            this._updateMouse(event);
            var intersects = this._rayCaster.intersectObject(this.getViewport().getScene().getSceneRef(), true);
            gizmo.update(event.x - this._rect.x, event.y - this._rect.y, event.x, event.y, intersects.length > 0 ? intersects[ 0 ].object : null); // move the gizmo with the mouse
            event.handled = intersects.length > 0;
        }
    };

    TooltipToolHandler.prototype.beginGesture = function(event) { };

    TooltipToolHandler.prototype.move = function(event) { };

    TooltipToolHandler.prototype.endGesture = function(event) { };

    TooltipToolHandler.prototype.click = function(event) { };

    TooltipToolHandler.prototype.doubleClick = function(event) { };

    TooltipToolHandler.prototype.contextMenu = function(event) { };

    TooltipToolHandler.prototype.getViewport = function() {
        return this._tool._viewport;
    };

    // GENERALISE THIS FUNCTION
    TooltipToolHandler.prototype._getOffset = function(obj) {
        var rectangle = obj.getBoundingClientRect();
        var p = {
            x: rectangle.left + window.pageXOffset,
            y: rectangle.top + window.pageYOffset
        };
        return p;
    };

    // GENERALISE THIS FUNCTION
    TooltipToolHandler.prototype._inside = function(event) {
        var id = this._tool._viewport.getIdForLabel();
        var domobj = document.getElementById(id);

        if (domobj == null) {
            return false;
        }

        var o = this._getOffset(domobj);
        this._rect = {
            x: o.x,
            y: o.y,
            w: domobj.offsetWidth,
            h: domobj.offsetHeight
        };

        return (event.x >= this._rect.x && event.x <= this._rect.x + this._rect.w && event.y >= this._rect.y && event.y <= this._rect.y + this._rect.h);
    };

    return TooltipToolHandler;
}, /* bExport= */ true);