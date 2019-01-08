/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides class sap.ui.vk.tools.Tool
sap.ui.define([
	"jquery.sap.global", "./library", "sap/ui/core/Element"
], function(jQuery, library, Element) {
	"use strict";

	/**
	 * Base for all tool controls.
	 *
	 * @class
	 * Specifies base for all tools to extend

	 * @param {string} [sId] ID of the new control instance. <code>sId</code>is generated automatically if no non-empty ID is given.
	 *                       Note: this can be omitted, regardless of whether <code>mSettings</code> will be provided or not.
	 * @param {object} [mSettings] An optional map/JSON object with initial property values, aggregated objects etc. for the new tool instance.
	 * @param {object} [oScope] scope An object for resolving string-based type and formatter references in bindings.
	 * @public
	 * @author SAP SE
	 * @version 1.52.8
	 * @extends sap.ui.base.ManagedObject
	 * @alias sap.ui.vk.tools.Tool
	 * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
	 */
	var Tool = Element.extend("sap.ui.vk.tools.Tool", /** @lends sap.ui.vk.tools.Tool.prototype */ {
		metadata: {
			properties: {
				/**
				 *
				 */
				targetViewportType: "any",

				/**
				 * GUID identifier for the tool to prevent naming conflicts.
				 */
				toolid: "string",

                /**
				 * Used to control the tool rendering and interaction pipeline.
				 */
                active: {
					type: "boolean",
					defaultValue: false
				},

                /**
				 * Used to decide whether this tool should be enabled for the target viewport.
				 */
                footprint: {
                    type: "string[]"
                }
			},
            associations: {
				/**
				 * Control into which the gizmo is intended to render .
				 */
				gizmoContainer: {
					type: "sap.ui.core.Control",
					cardinality: "0..1"

				}
			},
            aggregations: {
					/**
					 * sap.ui.vk.tools.Gizmo owned by this control and used for rendering floating UI
					 */
					gizmo: {
						type: "sap.ui.vk.tools.Gizmo",
						multiple: false
					},

                    /**
					 * TODO: sap.ui.vk.tools.Widget owned by this control and used for rendering docked UI
					 */
					widget: {
						type: "sap.ui.vk.tools.Widget",
						multiple: false
					}
            },
            events: {
                enabled: {
					parameters: {
						/**
						 * Returns the true or false to indicated that the tool is enabled or not.
                         * This event is fired by the tool under various conditions,
                         * including an attempt to set an activeViewport that is incompatibe with the tool.
                         * use getActive / setActive to turn the tool on or off
						 */
						enabled: "bool",
                        reason: "string"
					}
				}
			}
		},

		constructor: function(sId, mSettings) {
			Element.apply(this, arguments);

            // Configure dependencies
            this._viewport = null;
            this._handler = null;
		}
	});

    Tool.prototype.init = function() {
		if (Element.prototype.init) {
			Element.prototype.init.call(this);
		}
	};

	// Checks if the current viewport is of a specified type
	Tool.prototype.isViewportType = function(typeString){
		if (this._viewport && this._viewport.getMetadata().getName() === typeString) {
			return true;
		}
		return false;
	};

    /**
	 * Manages the 'active' flag for this tool and any other internals required
	 *
     * @param {boolean} [value] indicates whether this tools is active or not
     * @param {object} [activeTarget] the tool target is used by the tool to carry out its operations
     * @param {object} [gizmoContainer] used to evaluate whether a tool should be rendered as part of the activeTarget
	 * @returns {void}
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
    Tool.prototype.setActive = function(value, activeTarget, gizmoContainer) {
		// If caller is attempting activation, check that the tool supports the target Viewport
		if (value) {
			var _implementation = activeTarget;
			var _implementationType;
			var _reason = "";
			if (_implementation.hasOwnProperty("getImplementation")) {
				_implementation = activeTarget.getImplementation();
			}

			// get control class name for viewport implementation
			_implementationType = _implementation && _implementation.getMetadata().getName();

			// decide whether the tool is compatible with the viewport being targeted
			if (this.getFootprint().indexOf(_implementationType) >= 0) {
				// OK to activate on basis of footprint (Can later look at implementing conflict resolution based on gestures etc.)
				this.setProperty("active", value, true);
			} else {
				this.setProperty("active", false, true);
				_reason = "Tool does not support Viewport type: " + _implementationType;
			}

			// If a gizmo has been set, but no gizmoContainer specified, then use the target for rendering gizmo
			if (this.getGizmo) {
				if (gizmoContainer) {
					this.setAssociation("gizmoContainer", gizmoContainer);
					gizmoContainer.rerender();
				} else {
					this.setAssociation("gizmoContainer", activeTarget);
					activeTarget.rerender();
				}

			}

			this.fireEnabled({
				enabled: this.getProperty("active"),
				reason: _reason
			});
		} else {
			this.setProperty("active", value, true);
			this.fireEnabled({
				enabled: value,
				reason: "Disabled by application logic."
			});
		}
    };

    /* Evaluates default conditions for rendering a gizmo in a container and returns the gizmo instance if true
	 *
     * @param {object} [renderingControl] the potential rendering target for the gizmo
	 * @returns {sap.ui.vk.tools.Gizmo}
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
    Tool.prototype.getGizmoForContainer = function(renderingControl) {
        var _gizmo = this.getGizmo(); // Get the gizmo instance if it exists
        // Don't return the gizmo for rendering if it already exists
        if ((renderingControl.getId() === this.getGizmoContainer()) && _gizmo && this.getActive()) {
            return _gizmo;
        }
    };

	Tool.prototype.destroy = function() {
		// Destroy tool resources
		Element.prototype.destroy.call(this);

        this._viewport = null;
        this._handler = null;
	};

	return Tool;
});
