/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides class sap.ui.vk.tools.RotateObitTool control.
sap.ui.define([
		"jquery.sap.global", "./library", "./Tool", "sap/ui/vk/helpers/RotateOrbitHelperDvl", "sap/ui/vk/helpers/RotateOrbitHelperThree"
	], function(jQuery, library, Tool, RotateOrbitHelperDvl, RotateOrbitHelperThree) {
	"use strict";

	/**
	 * Constructor for a new RotateOrbitTool tool.
	 *
	 * @class
	 * Specifies a resource to load.

	 * @param {string} [sId] ID of the new content resource. <code>sId</code>is generated automatically if no non-empty ID is given.
	 *                       Note: this can be omitted, regardless of whether <code>mSettings</code> will be provided or not.
	 * @param {object} [mSettings] An optional map/JSON object with initial property values, aggregated objects etc. for the new tool instance.
	 * @param {object} [oScope] scope An object for resolving string-based type and formatter references in bindings.
	 * @public
	 * @author SAP SE
	 * @version 1.52.8
	 * @extends sap.ui.base.ManagedObject
	 * @alias sap.ui.vk.tools.RotateOrbitTool
	 * @experimental Since 1.52.0 This class is experimental and might be modified or removed in future versions.
	 */
	var RotateOrbitTool = Tool.extend("sap.ui.vk.tools.RotateOrbitTool", /** @lends sap.ui.vk.tools.RotateOrbitTool.prototype */ {
		metadata: {
			properties: {
			},

			publicMethods: [
				"rotate"
			],
			privateMethods: [
			],
			events: {
				/**
				* This event will be fired when rotation occurs.
				*/
				rotate: {
					parameters: {
						dx: "int",
						dy: "int"
					}
				}
			}
		},

		constructor: function(sId, mSettings) {
			// Treat tool instantiation as singleton
			if (RotateOrbitTool._instance) {
				return RotateOrbitTool._instance;
			}

			Tool.apply(this, arguments);

			this.setToolid("1a1fced1-9b42-d7f3-5fdf-8d338b3591a6");

			// Configure dependencies
			this._viewport = null;
			this._rotateOrbitHelper = null;

			RotateOrbitTool._instance = this;
		}
	});

	RotateOrbitTool.prototype.init = function() {
		if (Tool.prototype.init) {
			Tool.prototype.init.call(this);
		}

		// set footprint for tool
		this.setFootprint([ "sap.ui.vk.dvl.Viewport", "sap.ui.vk.threejs.Viewport" ]);
	};

	// Override the active property setter so that we execute activation / deactivation code at the same time
	RotateOrbitTool.prototype.setActive = function(value, activeViewport, gizmoContainer) {
		if (Tool.prototype.setActive) {
			Tool.prototype.setActive.call(this, value, activeViewport, gizmoContainer);
		}

		if (value) {
			this._activateTool(activeViewport);
		} else {
			this._deactivateTool();
		}

		return this;
	};

	RotateOrbitTool.prototype._activateTool = function(activeViewport) {
		this._viewport = activeViewport;
		this._prepare();

		// Turn on orbit mode
		this._rotateOrbitHelper.activateOrbitMode();
	};

	RotateOrbitTool.prototype._deactivateTool = function() {
		if (this._rotateOrbitHelper) {
			this._rotateOrbitHelper.deactivateOrbitMode();
			this._rotateOrbitHelper = null;
		}
	};

	/*
	* Checks that the execution criteria for this tool are met before execution of tool commands
	*/
	RotateOrbitTool.prototype._prepare = function() {
		if (this.isViewportType("sap.ui.vk.dvl.Viewport") && this._viewport._dvl) {
			if (this._rotateOrbitHelper == null) {
				this._dvlRendererId = this._viewport._dvlRendererId;
				this._dvl = this._viewport._dvl;
				this._rotateOrbitHelper = new RotateOrbitHelperDvl(this, this._dvl);
			}
		} else if (this.isViewportType("sap.ui.vk.threejs.Viewport")) {
			if (this._rotateOrbitHelper == null) {
				this._rotateOrbitHelper = new RotateOrbitHelperThree(this);
			}
		}

        return true;
    };

	/**
	* Executes Orbit rotation for the target Viewport.
	*
	* @param {int} dx The change in x-coordinate used to define the desired rotation.
	* @param {int} dy The change in y-coordinate used to define the desired rotation.
	* @public
	*/
    RotateOrbitTool.prototype.rotate = function(dx, dy) {
		// This function figures out which helper is needed (dvl/threejs) and calls rotate method of appropriate helper
        if (this._prepare()) {
			// rotateOrbitHelper will be either an instance of RotateOrbitHelperDvl or RotateOrbitHelperThree depending on the Viewport being used
			this._rotateOrbitHelper.rotate(dx, dy);
		}
    };

	RotateOrbitTool.prototype.destroy = function() {
		// Destroy tool resources
		Tool.prototype.destroy.call(this);

        this._viewport = null;
        this._rotateOrbitHelper = null;
	};

	return RotateOrbitTool;
});
