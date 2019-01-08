/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides class sap.ui.vk.tools.move.
sap.ui.define([
		"jquery.sap.global", "./library", "./Tool", "sap/ui/vk/helpers/RotateTurntableHelperDvl", "sap/ui/vk/helpers/RotateTurntableHelperThree"
	], function(jQuery, library, Tool, RotateTurntableHelperDvl, RotateTurntableHelperThree) {
	"use strict";

	/**
	 * Constructor for a new RotateTurntableTool tool.
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
	 * @alias sap.ui.vk.tools.PanTool
	 * @experimental Since 1.52.0 This class is experimental and might be modified or removed in future versions.
	 */
	var RotateTurntableTool = Tool.extend("sap.ui.vk.tools.RotateTurntableTool", /** @lends sap.ui.vk.tools.RotateTurntableTool.prototype */ {
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
			if (RotateTurntableTool._instance) {
				return RotateTurntableTool._instance;
			}

			Tool.apply(this, arguments);

			// Set the GUID for this tool. For VIT native tools, used to avoid naming conflicts with third party tools
			this.setToolid("f271c082-676c-adc6-167f-0d5ce602aa45");

			// Configure dependencies
			this._viewport = null;
			this._rotateTurntableHelper = null;

			RotateTurntableTool._instance = this;
		}
	});

	RotateTurntableTool.prototype.init = function() {
		if (Tool.prototype.init) {
			Tool.prototype.init.call(this);
		}
		// set footprint for tool
		this.setFootprint([ "sap.ui.vk.dvl.Viewport", "sap.ui.vk.threejs.Viewport" ]);
	};

	// Override the active property setter so that we execute activation / deactivation code at the same time
	RotateTurntableTool.prototype.setActive = function(value, activeViewport, gizmoContainer) {
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

	RotateTurntableTool.prototype._activateTool = function(activeViewport) {
		this._viewport = activeViewport;

		// Prepare the tool to execute
		this._prepare();

		this._rotateTurntableHelper.activateTurntableMode();
	};

	RotateTurntableTool.prototype._deactivateTool = function() {
		if (this._rotateTurntableHelper) {
			this._rotateTurntableHelper.deactivateTurntableMode();
			this._rotateTurntableHelper = null;
		}
	};

    /*
    * Checks that the execution criteria for this tool are met before execution of tool commands
    */
	RotateTurntableTool.prototype._prepare = function() {
		if (this.isViewportType("sap.ui.vk.dvl.Viewport") && this._viewport._dvl) {
			if (this._rotateTurntableHelper == null) {
				this._dvlRendererId = this._viewport._dvlRendererId;
				this._dvl = this._viewport._dvl;
				this._rotateTurntableHelperDvl = new RotateTurntableHelperDvl(this, this._dvl);

				// Turn on turntable mode
				this._rotateTurntableHelperDvl.activateTurntableMode();
			}
		} else if (this.isViewportType("sap.ui.vk.threejs.Viewport")) {
			if (this._rotateTurntableHelper == null) {
				this._rotateTurntableHelper = new RotateTurntableHelperThree(this);
			}
		}

		return true;
	};

	  /**
	 * Executes Turntable rotation for the target Viewport.
	 *
	 * @param {int} dx The change in x-coordinate used to define the desired rotation.
	 * @param {int} dy The change in y-coordinate used to define the desired rotation.
	 * @public
	 */
	RotateTurntableTool.prototype.rotate = function(dx, dy) {
		// This function figures out which helper is needed (dvl/threejs) and calls rotate method of appropriate helper
		if (this._prepare()) {
			// rotateOrbitHelper will be either an instance of RotateOrbitHelperDvl or RotateOrbitHelperThree depending on the Viewport being used
			this._rotateTurntableHelper.rotate(dx, dy);
		}
	};

	RotateTurntableTool.prototype.destroy = function() {
		// Destroy tool resources
		Tool.prototype.destroy.call(this);

		this._viewport = null;
		this._rotateTurntableHelper = null;
	};

	return RotateTurntableTool;
});
