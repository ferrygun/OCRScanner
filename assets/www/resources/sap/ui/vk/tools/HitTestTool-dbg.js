/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides class sap.ui.vk.tools.HitTestTool control.
sap.ui.define([
	"jquery.sap.global", "./library", "./Tool", "./HitTestToolHandler", "sap/ui/vk/Loco", "./HitTestToolGizmo"
], function(jQuery, library, Tool, HitTestToolHandler, Loco, HitTestToolGizmo) {
	"use strict";

	/**
	 * Constructor for a new HitTestTool tool.
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
	 * @alias sap.ui.vk.tools.HitTestTool
	 * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
	 */
	var HitTestTool = Tool.extend("sap.ui.vk.tools.HitTestTool", /** @lends sap.ui.vk.tools.HitTestTool.prototype */ {
		metadata: {
			properties: {
				/**
				 * Indicates what schema the tool should use extract ids from hit objects
				 */
				IdMode: {
					type: "sap.ui.vk.tools.HitTestIdMode",
					defaultValue: sap.ui.vk.tools.HitTestIdMode.ThreeJS
				}
			},

			publicMethods: [
				"hitTest"
			],
            privateMethods: [],
            events: {
                /**
				 * This event will be fired when rotation occurs.
				 */
				hit: {
					parameters: {
						id: "any",
						object: "any",
						point: "any",
						clickType: "sap.ui.vk.tools.HitTestClickType"
					}
				}
			}
		},

		constructor: function(sId, mSettings) {
			// Treat tool instantiation as singleton
			if (HitTestTool._instance) {
				return HitTestTool._instance;
			}

			// extend the properties of the base class
			Tool.apply(this, arguments);

			// Set the GUID for this tool. For VIT native tools, used to avoid naming conflicts with third party tools
			this.setToolid("63150593-75f6-c330-2a7a-c1f85d36b2b9");

            // Configure dependencies
            this._viewport = null;
            this._handler = null;
			this._loco = null;

			HitTestTool._instance = this;
		}
	});

    HitTestTool.prototype.init = function() {
		if (Tool.prototype.init) {
			Tool.prototype.init.call(this);
		}

		// set footprint for tool
		this.setFootprint([ "sap.ui.vk.threejs.Viewport" ]);

		// !!! Tools dont need Gizmo's I added one for HitTest so I could see if the targeting coordinates were working properly
        this.setAggregation("gizmo", new HitTestToolGizmo());

		// Loco is a singleton, so you don't need to worry about where and when it is instantiated
		// this._loco =  // new Loco();
	};

	/*
    * Override the active property setter so that we execute activation / deactivation code at the same time
    */
    HitTestTool.prototype.setActive = function(value, activeViewport, gizmoContainer) {
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

    /*
    * Adds loco handler, manages UI
    */
    HitTestTool.prototype._activateTool = function(activeViewport) {
        // If target viewport supports dvl then...
        this._viewport = activeViewport;
        this._handler = new HitTestToolHandler(this);

        // Prepare the tool to execute
        this._prepare();
    };

	/*
	* Removes/Hides tool UI, removes handler from the loco stack and performs any other cleanup
	*/
	HitTestTool.prototype._deactivateTool = function() {
		// Remove tool hander from loco stack for viewport so that the tool no longer handles input from user
		if (this._handler) {
			this._viewport._loco.removeHandler(this._handler);
		}
		this._handler = null;
	};

    /*
    * Checks that the execution criteria for this tool are met before execution of tool commands
    */
    HitTestTool.prototype._prepare = function() {
        var okToExec = false;

        if (this._viewport._loco) {
            // Add tool hander to loco stack for viewport so that the tool can handler input from user
            this._viewport._loco.addHandler(this._handler);
            okToExec = true;
        }


		if (okToExec) {
			if (this.isViewportType("sap.ui.vk.dvl.Viewport") && this._viewport._dvl) {
				this._dvlRendererId = this._viewport._dvlRendererId;
				this._dvl = this._viewport._dvl;
				okToExec = true;
			} else if (this.isViewportType("sap.ui.vk.threejs.Viewport") && (this._viewport._scene && this._viewport._scene.getSceneRef())) {
				okToExec = true;
				}
		}
		return okToExec;
    };

    /** MOVE TO BASE
	 * Queues a command for execution during the rendering cycle. All gesture operations should be called using this method.
	 *
	 * @param {function} command The command to be executed.
	 * @returns {sap.ui.vk.Viewport} this
	 * @public
	 */
	HitTestTool.prototype.queueCommand = function(command) {
        if (this._prepare()) {
            if (this._dvlRendererId) {
                this._dvl.Renderer._queueCommand(command, this._dvlRendererId);
            }
        }
		return this;
	};

    // Figure out which helper is needed and execute rotate
    HitTestTool.prototype.hitTest = function(x, y, scene, camera, clicktype) {
        if (this._prepare()) {

			var hitResult = null;

			if (this.isViewportType("sap.ui.vk.dvl.Viewport") && this._viewport._dvl) {
				// Fire the DVL HitTest logic
				return null;
			} else if (this.isViewportType("sap.ui.vk.threejs.Viewport")) {

				if (!scene || !camera) {
					hitResult = null;
				} else if (this._viewport._renderer) {
					var element = this._viewport._renderer.domElement;
					// var mouse = new THREE.Vector2((x - element.offsetLeft) / element.width * 2 - 1, (element.offsetTop - y) / element.height * 2 + 1);
					var mouse = new THREE.Vector2((x - element.offsetLeft) / element.width * 2 - 1, (element.offsetTop - y) / element.height * 2 + 1);
					// var mouse = new THREE.Vector2(x, y);
					var raycaster = new THREE.Raycaster();

					raycaster.setFromCamera(mouse, camera);
					var intersects = raycaster.intersectObjects(scene.children, true);

					if (intersects && intersects.length) {
						hitResult = intersects[ 0 ];
					}
				}
			}

			if (hitResult) {
				var idResult;
				switch (this.getIdMode()) {
					case sap.ui.vk.tools.HitTestIdMode.VEsID:
						// Logic to extract VEsID from hitResult
						idResult = this._viewport._scene.nodeRefToPersistentId(hitResult.object);
						break;
					case sap.ui.vk.tools.HitTestIdMode.ThreeJS:
						idResult = hitResult.object.id;
						break;
					default:
						idResult = hitResult.object.id;
						break;
				}
				this.fireHit({
					id: idResult,
					object: hitResult.object,
					point: hitResult.point,
					clickType: clicktype
				});
			}
		}
    };

	HitTestTool.prototype.destroy = function() {
		// Destroy tool resources
		Tool.prototype.destroy.call(this);

        this._viewport = null;
        this._handler = null;
	};

	return HitTestTool;
});
