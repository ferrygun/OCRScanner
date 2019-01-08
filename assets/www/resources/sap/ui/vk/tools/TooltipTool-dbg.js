/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.vk.tools.TooltipTool
sap.ui.define([
	"jquery.sap.global", "./library", "./Tool", "./TooltipToolHandler", "./TooltipToolGizmo"
], function(jQuery, library, Tool, TooltipToolHandler, TooltipToolGizmo) {
	"use strict";

	/**
	 * Constructor for a new TooltipTool.
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
	 * @alias sap.ui.vk.tools.TooltipTool
	 * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
	 */
	var TooltipTool = Tool.extend("sap.ui.vk.tools.TooltipTool", /** @lends sap.ui.vk.tools.TooltipTool.prototype */ {
		metadata: {
			properties: {
			},
			publicMethods: [
				"setTitle"
			],
			events: {
				/**
				 * This event will be fired when mouse hover occurs.
				 */
				hover: {
					parameters: {
						x: "int",
						y: "int",
						nodeRef: "any"
					}
				}
			}
		},

		constructor: function(sId, mSettings) {
			// Treat tool instantiation as singleton
			if (TooltipTool._instance) {
				return TooltipTool._instance;
			}

			Tool.apply(this, arguments);

			// Configure dependencies
			this._viewport = null;
			this._handler = null;

			TooltipTool._instance = this;
		}
	});

	TooltipTool.prototype.init = function() {
		if (Tool.prototype.init) {
			Tool.prototype.init.call(this);
		}

		// set footprint for tool
		this.setFootprint([ "sap.ui.vk.threejs.Viewport" ]);

		this.setAggregation("gizmo", new TooltipToolGizmo());
	};

	// Override the active property setter so that we execute activation / deactivation code at the same time
	TooltipTool.prototype.setActive = function(value, activeViewport, gizmoContainer) {
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

	TooltipTool.prototype._activateTool = function(activeViewport) {
		// If target viewport supports dvl then...
		this._viewport = activeViewport;
		this._handler = new TooltipToolHandler(this);
		this._gizmo = this.getGizmo();
		if (this._gizmo) {
			this._gizmo.show(activeViewport, this);
		}

		// Prepare the tool to execute
		this._prepare();
	};

	TooltipTool.prototype._deactivateTool = function() {
		// Remove tool handler from loco stack for viewport so that the tool no longer handles input from user
		if (this._handler) {
			if (this._viewport._loco) {
				this._viewport._loco.removeHandler(this._handler);
			}
			this._handler = null;
		}

		if (this._gizmo) {
			this._gizmo.hide();
			this._gizmo = null;
		}
	};

	/*
	* Checks that the execution criteria for this tool are met before execution of tool commands
	*/
	TooltipTool.prototype._prepare = function() {
		var okToExec = false;

		if (this._viewport._loco) {
			// Add tool hander to loco stack for viewport so that the tool can handler input from user
			this._viewport._loco.addHandler(this._handler);
			okToExec = true;
		}

		return okToExec;
	};

	/**
	 * Sets the tooltip title
	 *
	 * @param {string} [title] Title
	 * @returns {sap.ui.vk.tools.TooltipTool} <code>this</code> to allow method chaining.
	 * @public
	 */
	TooltipTool.prototype.setTitle = function(title) {
		if (this._gizmo) {
			this._gizmo.setTitle(title);
		}
		return this;
	};

	/** MOVE TO BASE
	 * Queues a command for execution during the rendering cycle. All gesture operations should be called using this method.
	 *
	 * @param {function} command The command to be executed.
	 * @returns {sap.ui.vk.tools.TooltipTool} <code>this</code> to allow method chaining.
	 * @public
	 */
	TooltipTool.prototype.queueCommand = function(command) {
		if (this._prepare()) {

			if (this.isViewportType("sap.ui.vk.dvl.Viewport")) {
				if (this._dvlRendererId) {
					this._dvl.Renderer._queueCommand(command, this._dvlRendererId);
				}
			} else if (this.isViewportType("sap.ui.vk.threejs.Viewport")) {
				command();
			}
		}
		return this;
	};

	TooltipTool.prototype.destroy = function() {
		// Destroy tool resources
		Tool.prototype.destroy.call(this);

		this._viewport = null;
		this._handler = null;
	};

	return TooltipTool;
});
