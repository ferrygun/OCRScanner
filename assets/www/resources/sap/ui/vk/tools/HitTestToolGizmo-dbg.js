/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.vk.SceneTree.
sap.ui.define([
	"jquery.sap.global", "./library", "./Gizmo"
], function(jQuery, library, Gizmo) {
	"use strict";

	/**
	 * Constructor for a new HitTestToolGizmo.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Provides buttons to hide or show certain sap.ui.vk controls.
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 * @version 1.52.8
	 *
	 * @constructor
	 * @public
	 * @alias sap.ui.vk.tools.HitTestToolGizmo
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
	 */
	var HitTestToolGizmo = Gizmo.extend("sap.ui.vk.tools.HitTestToolGizmo", /** @lends sap.ui.vk.tools.HitTestToolGizmo.prototype */ {
		metadata: {
			library: "sap.ui.vk.tools",
			properties: {
			},
			events: {},
			associations: {
			},
			aggregations: {

			}
		}
	});


	HitTestToolGizmo.prototype.init = function() {
		if (Gizmo.prototype.init) {
			Gizmo.prototype.init.apply(this);
		}
	};

    HitTestToolGizmo.prototype.createGizmo = function() {
            /* var _button = new sap.m.Button({
                text: "test"
            });
			*/

            // this.addContent(_button);
            // TODO: Create fixed and floating content... remember that the tool itself can have a renderer
            // So we will likely have 'widget', 'gizmo' & a regular control UI

            var _container = this.getDomRef();
			_container.className = "orbitGizmo";
			_container.innerText = "+";
            jQuery(_container).css({
                "position": "absolute",
                "color": "blue",
                "background-color": "rgba(100, 100, 255, 0.25)",
                "cursor": "default",
                "padding": "3px",
                "border-radius": "5px",
                "display": "none"
            });

			return _container;
    };

    HitTestToolGizmo.prototype.show = function(targetContainer) {
        var _container = this.getDomRef();
        jQuery(_container).css({
                "display": "block"
        });
        // Should create a gizmo aggregation on Viewport and add to this instead of appending to DOM
        // this._targetContainer.getDomRef().appendChild(this.getDomRef());
    };

    HitTestToolGizmo.prototype.hide = function() {
        var _container = this.getDomRef();
        jQuery(_container).css({
                "display": "none"
        });
        // this._targetContainer.getDomRef().removeChild(this.getDomRef());
    };

    HitTestToolGizmo.prototype.moveGizmo = function(x, y) {
        var _container = this.getDomRef();
        // Move gizmo with mouse
        if (_container) {
            _container.style.left = Math.floor(x) + "px";
            _container.style.top = Math.floor(y) + "px";
        }
    };

    HitTestToolGizmo.prototype.destroyGizmo = function() {
    };

	HitTestToolGizmo.prototype.onBeforeRendering = function() {
	};

	HitTestToolGizmo.prototype.onAfterRendering = function() {
        this.createGizmo();
	};

	return HitTestToolGizmo;

}, /* bExport= */ true);
