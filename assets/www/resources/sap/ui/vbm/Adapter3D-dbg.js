/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5) (c) Copyright 2009-2012 SAP AG. All rights reserved
 */

/* global THREE */

// Provides class sap.ui.vbm.Adapter3D
sap.ui.define([
	"jquery.sap.global", "./library", "sap/ui/core/Element", "sap/ui/base/ManagedObjectObserver",
	"sap/ui/vk/ContentConnector", "sap/ui/vk/ContentResource",
	"sap/ui/vk/threejs/Viewport", "sap/ui/vk/threejs/ViewStateManager",
	"./adapter3d/VisualObjectFactory", "./adapter3d/VBIJSONParser",
	"./adapter3d/SceneBuilder", "./adapter3d/Utilities"
], function(jQuery, library, Element, ManagedObjectObserver,
	ContentConnector, ContentResource,
	Viewport, ViewStateManager,
	VisualObjectFactory, Parser,
	SceneBuilder, Utilities
) {
	"use strict";

	var thisModule   = "sap.ui.vbm.adapter3d.Adapter3D";
	var log          = jQuery.sap.log;
	var toBoolean    = Utilities.toBoolean;
	var applyColor   = Utilities.applyColor;

	// Forward declaration;
	var viewportEventDelegate;

	/**
	 * Constructor for a new Visual Business Adapter 3D.
	 *
	 * @class
	 * Provides the ability to load VBI JSON into {@link sap.ui.vk.threejs.Viewport sap.ui.vk.threejs.Viewport} control.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new object
	 * @author SAP SE
	 * @version 1.52.4
	 * @extends sap.ui.core.Element
	 * @constructor
	 * @public
	 * @alias sap.ui.vbm.Adapter3D
	 * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
	 */
	var Adapter3D = Element.extend("sap.ui.vbm.Adapter3D", /** @lends sap.ui.vbm.Adapter3D.prototype */ {
		metadata: {
			library: "sap.ui.vbm",

			publicMethods: [
				"load"
			],

			associations: {
				/**
				 * The {@link sap.ui.vk.threejs.Viewport Viewport} control associated with the Adapter3D.
				 * The Adapter3D would invoke methods and subscribe to events on this {@link sap.ui.vk.threejs.Viewport Viewport} instance.
				 */
				viewport: {
					type: "sap.ui.vk.threejs.Viewport"
				}
			},

			events: {
				/**
				 * This event is fired when interactions in the viewport happen.
				 */
				submit: {
					parameters: {
						/**
						 * A string in the VBI JSON format.
						 */
						data: {
							type: "string"
						}
					}
				}
			}
		}
	});

	var basePrototype = Adapter3D.getMetadata().getParent().getClass().prototype;

	Adapter3D.prototype.init = function() {
		if (basePrototype.init) {
			basePrototype.init.call(this);
		}

		var that = this;

		this._contentConnector = new ContentConnector();
		// Bind the lifespan of the content connector to this adapter instance.
		this.addDependent(this._contentConnector);

		// The three.js scene will only be available after the content connector has resolved its only content resource.
		// That operation is asynchronous, so to get the three.js scene in subsequent calls we have to use a Promise.
		this._sceneRootPromise = new Promise(function(resolve) {
			// This event shoud be handled only once as we will not add or change content resources.
			that._contentConnector.attachEventOnce("contentReplaced", function(event) {
				// Put all visual instance objects under the grouping node corresponding to the only
				// content connector's content resource. This way the visual object instances will be
				// isolated from other auxiliary nodes that could live in the scene, e.g. default lights etc.
				var root = that._contentConnector.getContentResources()[0].getNodeProxy().getNodeRef();

				// Rotate the root node to make the initial view suitable for the default camera.
				// Should be removed when the initial view is implemented properly?
				root.rotateX(THREE.Math.degToRad(90));

				resolve(root);
			});
		});

		// Add the only content resource that will be used as a root for all visual object instances.
		this._contentConnector.addContentResource(new ContentResource({ name: "Root" }));

		// A view state manager will be used to handle selection and visibility.
		this._viewStateManager = new ViewStateManager({
			contentConnector: this._contentConnector
		});
		// Bind the lifespan of the view state manager to this adapter instance.
		this.addDependent(this._viewStateManager);

		// A strong reference to the associated viewport. It is used to track if the viewport association changed.
		// The viewport association will be checked in each call to the Adapter3D.load() method and updated properly.
		this._viewport = null;

		// A map with resource names as keys and resource content as values.
		// Resource content is a strinh that can be a Collada xml or base64 encoded image.
		// This map is shared between VBIJSONParser and SceneBuilder.
		// It is populated by VBIJSONParser and consumed by SceneBuilder.
		this._resources = new Map();

		// VBI Actions subscriptions
		this._actions = [];

		// An array of visual object groups corresponding to Scene.VO aggregations.
		// Elements of this array are created with sap.ui.vbm.adapter3d.VisualObjectFactory.createVisualObjectGroup().
		// This array is shared between VBIJSONParser and SceneBuilder.
		this._groups = [];

		// An array of fully resolved visual object instances.
		// Elements of this array are created with sap.ui.vbm.adapter3d.VisualObjectFactory.createVisualObject().
		// This array is shared between VBIJSONParser and SceneBuilder.
		this._instances = [];

		// An instance of VBIJSONParser.
		this._parser = null;

		// An instance of SceneBuilder.
		this._sceneBuilder = null;

		// The last instance that mouse hovered over.
		this._lastHoverInstance = null;

		// The timer ID to clear the first click to prevent two clicks instead of double click.
		this._clickTimerId = null;

		this._mouseDown = false;
		this._lastXY = { x: 0, y: 0 };

		// We will the observer to disconnect from destroyed viewports.
		this._viewportObserver = new ManagedObjectObserver(this._observeChanges.bind(this));
	};

	Adapter3D.prototype.exit = function() {
		if (this._clickTimerId) {
			jQuery.sap.clearDelayedCall(this._clickTimerId);
			this._clickTimerId = null;
		}

		this._disconnectViewport();

		this._viewportObserver.disconnect();
		this._viewportObserver = null;

		if (this._sceneBuilder) {
			this._sceneBuilder.destroy();
			this._sceneBuilder = null;
		}

		if (this._parser) {
			this._parser.destroy();
			this._parser = null;
		}

		// The content connector and view state manager will be destroyed automatically by the base class of this adapter
		// as part of the 'dependent' aggregation.
		this._contentConnector = null;
		this._viewStateManager = null;

		this._resources = null;
		this._actions = null;

		this._groups = null;
		this._instances = null;

		if (basePrototype.exit) {
			basePrototype.exit.call(this);
		}
	};

	/**
	 * Gets the scene's root node.
	 *
	 * @returns {Promise} A Promise object that resolves with the scene's root node.
	 * @private
	 */
	Adapter3D.prototype._getSceneRoot = function() {
		return this._sceneRootPromise;
	};

	// Override the auto-generated setter to suppress invalidation and to connect to the associated viewport.
	Adapter3D.prototype.setViewport = function(viewport) {
		this.setAssociation("viewport", viewport, true);
		this._configureViewport();
		return this;
	};

	/**
	 * Updates the connection to the associated viewport.
	 *
	 * @returns {sap.ui.vbm.Adapter3D} <code>this</code> to allow method chaining.
	 * @private
	 */
	Adapter3D.prototype._configureViewport = function() {
		// sap.ui.getCore().byId() does not define what it returns when it cannot find an element by ID,
		// the current implementation returns undefined, so coalesce the return value with null for predictable results.
		var associatedViewport = sap.ui.getCore().byId(this.getViewport()) || null;
		if (associatedViewport !== this._viewport) {
			this._disconnectViewport();
			this._viewport = associatedViewport;
			this._connectViewport();
		}
		return this;
	};

	/**
	 * Connects the associated viewport to the adapter's content connector and view state manager.
	 * Subscribes to events from the associated viewport.
	 *
	 * @returns {sap.ui.vbm.Adapter3D} <code>this</code> to allow method chaining.
	 * @private
	 */
	Adapter3D.prototype._connectViewport = function() {
		if (this._viewport) {
			this._viewportObserver.observe(this._viewport, { destroy: true });
			this._viewport.setContentConnector(this._contentConnector);
			this._viewport.setViewStateManager(this._viewStateManager);
			this._viewport.setSelectionMode(sap.ui.vk.SelectionMode.None); // We will handle selection ourselves.
			this._viewport.addEventDelegate(viewportEventDelegate, this);

			// Disable double click handling in the viewport.
			if (this._viewport._viewportGestureHandler && this._viewport._viewportGestureHandler.zoomObject) {
				this._viewport._viewportGestureHandler.zoomObject = function() {};
			}
		}
		return this;
	};

	/**
	 * Unsubscribes from events from the associated viewport.
	 * Disconnects the associated viewport from the adapter's content connector and view state manager.
	 *
	 * @returns {sap.ui.vbm.Adapter3D} <code>this</code> to allow method chaining.
	 * @private
	 */
	Adapter3D.prototype._disconnectViewport = function() {
		if (this._viewport) {
			this._viewport.removeEventDelegate(viewportEventDelegate);
			this._viewportObserver.unobserve(this._viewport, { destroy: true });
			if (!this._viewport.bIsDestroyed) {
				this._viewport.setViewStateManager(null);
				this._viewport.setContentConnector(null);
			}
			this._viewport = null;
		}
		return this;
	};

	/**
	 * Observes changes in the viewport associated with the adapter.
	 * If the viewport is about to be destroyed the adapter disconnects from the viewport.
	 *
	 * @param {object} change The changes that caused this call.
	 * @private
	 */
	Adapter3D.prototype._observeChanges = function(change) {
		if (change.type === 'destroy' && change.object === this._viewport) {
			this._disconnectViewport();
		}
	};

	/**
	 * Processes the various sections from the VBI JSON.
	 *
	 * The Resources, DataTypes, Scenes and Data sections from the VBI JSON are sequentially processed.
	 * Processing of the Data section would eventually lead to change in the content resources.
	 *
	 * @param {object|string} data The VBI JSON.
	 * @returns {Promise} A Promise object that is resolved when the VBI JSON is processed.
	 * @public
	 */
	Adapter3D.prototype.load = function(data) {
		var that = this;
		return this._getSceneRoot().then(function(root) {
			if (!that._parser) {
				that._parser = new Parser(that._groups, that._instances, that._resources, that._actions);
			}

			if (!that._sceneBuilder) {
				that._sceneBuilder = new SceneBuilder(
					that._groups,
					that._instances,
					that._resources,
					root
				);
			}

			// If the adapter was created before the associated viewport then the adapter might not be connected to the viewport.
			// In case if the associated viewport is destroyed that call will disconnect from the viewport.
			that._configureViewport();

			var payload = null;

			if (typeof data === "string") {
				try {
					payload = JSON.parse(data);
				} catch (ex) {
					log.error("sap.ui.vbm.Adapter: attempt to load invalid JSON string.");
					return Promise.resolve();
				}
			} else if (typeof data === "object") {
				payload = data;
			}

			if (!(payload && payload.SAPVB)) {
				log.error("sap.ui.vbm.Adapter3D: attempt to load null.");
				return Promise.resolve();
			}

			that._parser.loadVBIJSON(payload);

			that._sceneBuilder.synchronize().then(function() {
				for (var i = that._instances.length - 1; i >= 0; --i) {
					var instance = that._instances[i];
					if (instance.isDeleted) {
						that._deleteInstance(i);
					} else {
						instance.isAdded = instance.isUpdated = false;
					}
				}
				that._viewport.setShouldRenderFrame();
				that._processAutomation(payload);
				return Promise.resolve();
			});
		});
	};

	Adapter3D.prototype._deleteInstance = function(i) {
		var instance = this._instances[i];
		this._instances.splice(i, 1);
		var groupInstances = instance.voGroup.voInstances;
		groupInstances.splice(groupInstances.indexOf(instance), 1);
		var groupSelectedInstances = instance.voGroup.selected;
		var selectedIndex = groupSelectedInstances.indexOf(instance);
		if (selectedIndex >= 0) {
			groupSelectedInstances.splice(selectedIndex, 1);
		}
		if (instance === this._lastHoverInstance) {
			this._lastHoverInstance = null;
		}
		return this;
	};

	/**
	 * Processes the automation and Menus sections from the VBI JSON.
	 *
	 * The CONTEXTMENUHANDLER refers to a menu with its ID from the Menus section
	 * of the VBI JSON. This parsed to create a sap.ui.unified.MenuItem with appropriate
	 * event handler attached to each menu item.
	 *
	 * @param {object} payload The VBI JSON.
	 * @returns {sap.ui.vbm.Adapter3D} <code>this</code> to allow method chaining.
	 * @private
	 */
	Adapter3D.prototype._processAutomation = function(payload) {
		var that = this;

		var processMenuItem = function(menu, currentItem, call, name) {
			var menuItem = new sap.ui.unified.MenuItem({
				text: currentItem.text,
				enabled: currentItem.disabled === "X" ? false : true,
				select: that._menuItemSelectionHandler.bind(that, currentItem.id, call.instance, name, call.object)
			});

			if (currentItem.MenuItem) {
				var subMenu = new sap.ui.unified.Menu();
				[].concat(currentItem.MenuItem).forEach(function(mi) { processMenuItem(subMenu, mi, call, name); })
				menuItem.setSubmenu(subMenu);
			}

			menu.addItem(menuItem);
		};

		if (payload && payload.SAPVB && payload.SAPVB.Automation
			&& payload.SAPVB.Automation.Call && payload.SAPVB.Automation.Call) {

			if (payload.SAPVB.Automation.Call.handler
				&& payload.SAPVB.Automation.Call.handler === "CONTEXTMENUHANDLER") {

					var xOffset = [].concat(payload.SAPVB.Automation.Call.Param).filter(function(p) { return p.name === "x"; });
					var yOffset = [].concat(payload.SAPVB.Automation.Call.Param).filter(function(p) { return p.name === "y"; });

					var offset = undefined;
					if (xOffset.length > 0 && yOffset.length > 0) {
						offset = xOffset[0]["#"] + " " + yOffset[0]["#"];
					}


					if (payload.SAPVB && payload.SAPVB.Menus
						&& payload.SAPVB.Menus.Set) {

							var menuPayloads = [].concat(payload.SAPVB.Menus.Set).filter(function(m) {
								return m.Menu.id === payload.SAPVB.Automation.Call.refID;
							});

							if (menuPayloads.length > 0) {
								var contextMenu = new sap.ui.unified.Menu();
								[].concat(menuPayloads[0].Menu.MenuItem).forEach(function(mi) {
									processMenuItem(contextMenu, mi, payload.SAPVB.Automation.Call, menuPayloads[0].Menu.action);
								});

								var dock = sap.ui.core.Popup.Dock;
								contextMenu.open(false, this._viewport, dock.BeginTop, dock.BeginTop, this._viewport, offset);
							}
					}

			}
		}
		return this;
	};

	// This resolver is used just to have the scene's root node created.
	ContentConnector.addContentManagerResolver(function(contentResource) {
		return Promise.resolve(
			{
				dimension: 3,
				contentManagerClassName: "sap.ui.vk.threejs.ContentManager",
				settings: {
					loader: function(parentNode, contentResource) {
						return Promise.resolve({
							node: parentNode,
							contentResource: contentResource
						});
					}
				}
			}
		);
	});

	////////////////////////////////////////////////////////////////////////////
	// BEGIN: Event propagation.

	Adapter3D.prototype._menuItemSelectionHandler = function(id, instance, name, voGroupId) {
		var payload = {
			version    : "2.0",
			"xmlns:VB" : "VB",
			Action     : {
				id        : id,
				instance  : instance,
				name      : name,
				object    : voGroupId
			}
		};
		this.fireSubmit({data: JSON.stringify(payload)});
	};

	Adapter3D.prototype._genericEventHandler = function(name, event) {
		var instance = event.instance;
		var groupId = instance ? instance.voGroup.id : event.voGroupId;
		var actionDefinition = sap.ui.vbm.findInArray(this._actions, function(action) { return action.refVO === groupId && action.refEvent === name; });
		if (actionDefinition) {
			var payload = {
				version: "2.0",
				"xmlns:VB": "VB",
				Action: {
					id: actionDefinition.id,
					name: actionDefinition.name,
					object: actionDefinition.refVO, // The same as groupId.
					instance: instance ? instance.voGroup.datasource + "." + instance.id : "",
					Params: {
						Param: [ // x,y will need to be excluded for keyboard events.
							{
								name: "x",
								"#":  event.cursor.x
							},
							{
								name: "y",
								"#":  event.cursor.y
							}
						]
					}
				}
			};

			if (actionDefinition.AddActionProperty) {
				var actionProperties = [];
				[].concat(actionDefinition.AddActionProperty).forEach(function(actionProperty) {
					if (instance && instance.hasOwnProperty(actionProperty.name)) {
						actionProperties.push({
							name: actionProperty.name,
							"#":  instance[actionProperty.name]
						});
					}
				});
				if (actionProperties.length > 0) {
					payload.Action.AddActionProperties = {
						AddActionProperty: actionProperties
					};
				}
			}

			if (instance && name === "Click" && event.selectionChanges) {
				payload.Data = {
					Merge: {
						N: [
							{
								name: instance.voGroup.datasource,
								E: event.selectionChanges.selected.map(function(instance) {
										return {
											K: instance.id,
											"VB:s": "true"
										}
									}).concat(event.selectionChanges.deselected.map(function(instance) {
										return {
											K: instance.id,
											"VB:s": "false"
										}
									}))
							}
						]
					}
				};
			}
			this.fireSubmit({
				data: JSON.stringify(payload)
			});
		}
	};

	Adapter3D.prototype._propagateClick = function(event) {
		// var instance = event.instance;
		// var position = event.cursor;
		this._genericEventHandler("Click", event);
	};

	Adapter3D.prototype._propagateDoubleClick = function(event) {
		// var instance = event.instance;
		// var position = event.cursor;
		this._genericEventHandler("DoubleClick", event);
	};

	Adapter3D.prototype._propagateContextMenu = function(event) {
		// var instance = event.instance;
		// var position = event.cursor;
		this._genericEventHandler("ContextMenu", event);
	};

	Adapter3D.prototype._propagateKeyPress = function(event) {
		// There are no instance and cursor properties in the event parameter as for the keyboard they are irrelevant. (?)
		this._genericEventHandler("KeyPress", event);
	};

	// END: Event propagation.
	////////////////////////////////////////////////////////////////////////////

	////////////////////////////////////////////////////////////////////////////
	// BEGIN: Event handling.

	Adapter3D.prototype._handleClick = function(event) {
		var instance = event.instance;
		log.info("click", "x: " + event.cursor.x + ", y: " + event.cursor.y + ", instance: " + (instance ? instance.id : "") + ", tooltip: " + (instance ? instance.tooltip : ""), thisModule);

		this._extendEventWithSelection(event);
		if (event.selectionChanges) {
			this._applySelectionChangesToScene3D(event.selectionChanges.selected, event.selectionChanges.deselected);
		}
		this._propagateClick(event);
	};

	Adapter3D.prototype._handleDoubleClick = function(event) {
		var instance = event.instance;
		log.info("double click", "x: " + event.cursor.x + ", y: " + event.cursor.y + ", instance: " + (instance ? instance.id : "") + ", tooltip: " + (instance ? instance.tooltip : ""), thisModule);
		this._propagateDoubleClick(event);
	};

	Adapter3D.prototype._handleContextMenu = function(event) {
		var instance = event.instance;
		if (!instance) {
			// If right-click was on empty space, there is no visual object.
			// But there might be an action defined for an artificial refVO with name 'Scene'.
			event.voGroupId = "Scene";
		}
		log.info("context menu", "x: " + event.cursor.x + ", y: " + event.cursor.y + ", instance: " + (instance ? instance.id : "") + ", tooltip: " + (instance ? instance.tooltip : ""), thisModule);
		this._propagateContextMenu(event);
	};

	Adapter3D.prototype._handleHover = function(event) {
		var tooltip;
		var instance = event.instance;
		log.info("hover", "x: " + event.cursor.x + ", y: " + event.cursor.y + ", instance: " + (instance ? instance.id : "") + ", tooltip: " + (instance ? instance.tooltip : ""), thisModule);
		if (instance) {
			tooltip = instance.tooltip;
			if (!tooltip) {
				tooltip = instance.text;
			}
		}
		var domRef = this._viewport.getDomRef();
		if (domRef) {
			if (tooltip) {
				domRef.setAttribute("title", tooltip);
			} else {
				domRef.removeAttribute("title");
			}
		}
		this._applyHoverChangesToScene3D(instance);
	};

	Adapter3D.prototype._handleKeyPress = function(event) {
		log.info("keypress", event.key, thisModule);
		this._propagateKeyPress(event);
	};

	// BEGIN: Event handling.
	////////////////////////////////////////////////////////////////////////////

	////////////////////////////////////////////////////////////////////////////
	// BEGIN: Gesture handling.

	Adapter3D.prototype._getXY = function(event) {
		var rect = this._viewport.getDomRef().getBoundingClientRect();
		return {
			x: (event.pageX || event.originalEvent.pageX) - window.pageXOffset - rect.left,
			y: (event.pageY || event.originalEvent.pageY) - window.pageYOffset - rect.top
		};
	};

	Adapter3D.prototype._hitTest = function(event) {
		var sceneRef = this._viewport.getScene().getSceneRef();
		var cameraRef = this._viewport.getCamera().getCameraRef();
		var p = event.cursor || this._getXY(event);
		var hitInfo = this._viewport.hitTest(p.x, p.y, sceneRef, cameraRef);
		return hitInfo && hitInfo.object && hitInfo.object._sapInstance;
	};

	Adapter3D.prototype._extendEventWithInstanceAndCursor = function(event) {
		event.cursor = this._getXY(event);
		event.instance = this._hitTest(event);
		return this;
	};

	// The 'this' object in all methods is an Adapter3D instance.
	viewportEventDelegate = {
		onkeydown: function(event) {
			if (!event.originalEvent.repeat) {
				this._handleKeyPress(event);
			}
		},

		oncontextmenu: function(event) {
			this._extendEventWithInstanceAndCursor(event);
			this._handleContextMenu(event);
		},

		onmousedown: function(event) {
			this._mouseDown = true;
			this._extendEventWithInstanceAndCursor(event);
			log.info("mousedown", "x: " + event.cursor.x + ", y: " + event.cursor.y, thisModule);
			this._lastXY.x = event.cursor.x;
			this._lastXY.y = event.cursor.y;
		},

		onmouseup: function(event) {
			this._mouseDown = false;
		},

		onhover: function(event) {
			this._extendEventWithInstanceAndCursor(event);
			log.info("hover", "x: " + event.cursor.x + ", y: " + event.cursor.y, thisModule);
			if (this._mouseDown) {
				if (this._lastXY.x !== event.cursor.x || this._lastXY.y !== event.cursor.y) {
					this._skipClick = true;
				}
				return;
			}
			this._handleHover(event);
		},

		onmouseout: function(event) {
			this._extendEventWithInstanceAndCursor(event);
			delete event.instance;
			this._handleHover(event);
		},

		onBeforeRendering: function(event) {
			if (this._onhoverProxy) {
				this._viewport.$().off(sap.ui.Device.browser.msie || sap.ui.Device.browser.edge ? "pointermove" : "mousemove", this._onhoverProxy);
			}
			if (this._onpointerdownProxy) {
				this._viewport.$().off("pointerdown", this._onpointerdownProxy);
			}
			if (this._onpointeronProxy) {
				this._viewport.$().off("pointerup", this._onpointerupProxy);
			}
		},

		onAfterRendering: function(event) {
			if (!this._onhoverProxy) {
				this._onhoverProxy = viewportEventDelegate.onhover.bind(this);
			}
			this._viewport.$().on(sap.ui.Device.browser.msie || sap.ui.Device.browser.edge ? "pointermove" : "mousemove", this._onhoverProxy);
			if (sap.ui.Device.browser.msie || sap.ui.Device.browser.edge) {
				if (!this._onpointerdownProxy) {
					this._onpointerdownProxy = viewportEventDelegate.onmousedown.bind(this);
				}
				this._viewport.$().on("pointerdown", this._onpointerdownProxy);
				if (!this._onpointerupProxy) {
					this._onpointerupProxy = viewportEventDelegate.onmouseup.bind(this);
				}
				this._viewport.$().on("pointerup", this._onpointerupProxy);
			}
		}
	};


	viewportEventDelegate[sap.ui.Device.browser.msie || sap.ui.Device.browser.edge ? "onclick" : "ontap"] = function(event) {
		log.info("onclick", "", thisModule);
		this._extendEventWithInstanceAndCursor(event);
		if (this._skipClick) {
			this._skipClick = false;
			this._handleHover(event);
			return;
		}
		if (this._clickTimerId) {
			jQuery.sap.clearDelayedCall(this._clickTimerId);
			this._clickTimerId = null;
			this._handleDoubleClick(event);
		} else {
			this._clickTimerId = jQuery.sap.delayedCall(200, this, function() {
				 this._clickTimerId = null;
				 this._handleClick(event);
			});
		}
	};

	// END: Gesture handling.
	////////////////////////////////////////////////////////////////////////////

	////////////////////////////////////////////////////////////////////////////
	// BEGIN: Selection handling.

	var controlKeyName = sap.ui.Device.os.macintosh ? "metaKey" : "ctrlKey";

	/**
	 * Extends the event with selection changes if any.
	 *
	 * @param {jQuery.Event} event The event to extend with new properties
	 * @returns {sap.ui.vbm.Adapter3D} <code>this</code> to allow method chaining.
	 * @private
	 */
	Adapter3D.prototype._extendEventWithSelection = function(event) {
		var instance = event.instance;
		if (instance) {
			if (event.originalEvent.type === "click") {
				// When both the Control (Command in macOS) and Shift keys are pressed do not change the selection.
				if (!(event[controlKeyName] && event.shiftKey)) {
					var action;
					var exclusive;
					if (event[controlKeyName]) {
						action = "toggle";
						exclusive = false;
					} else if (event.shiftKey) {
						action = "select";
						exclusive = false;
					} else {
						action = "select";
						exclusive = true;
					}
					event.selectionChanges = this._changeSelection(instance, action, exclusive);
				}
			} else {
				event.selectionChanges = this._changeSelection(instance, "toggle", false);
			}
		}
		return this;
	};

	/**
	 * Changes the current selection list.
	 *
	 * The selection is controlled by the selection cardinality properties of the DataType node.
	 *
	 * @param {object}  instance The VO instance.
	 * @param {string}  action   If <code>'toggle'</code> then toggle the selection state of the VO instance,
	 *                           if <code>'select'</code> then add the VO instance to the selection list.
	 * @param {boolean} exclusive If <code>true</code> then deselect other selected VO instances,
	 *                            if <code>false</code> then add to the selection list.
	 * @returns {object} An object with two arrays of VO instances: <code>selected</code> and <code>deselected</code>.
	 * @private
	 */
	Adapter3D.prototype._changeSelection = function(instance, action, exclusive) {
		var selected = [];
		var deselected = [];
		var group = instance.voGroup;
		var wasSelected = toBoolean(instance["VB:s"]);
		var selectedIndex;

		if (action === "select") {
			if (group.maxSel !== "0") {
				if (wasSelected) {
					if (exclusive) {
						// Deselect other selected instances in the group.
						selectedIndex = group.selected.indexOf(instance);
						deselected = group.selected.splice(selectedIndex + 1).concat(group.selected.splice(0, selectedIndex));
					}
				} else {
					if (exclusive || group.maxSel === "1") {
						// Deselect all selected instances in the group.
						deselected = group.selected.splice(0);
					}
					group.selected.push(instance);
					selected = [ instance ];
				}
			}
		} else if (action === "toggle") {
			if (wasSelected) {
				if (group.minSel === "0" || group.selected.length > 1) {
					// Deselect instance
					selectedIndex = group.selected.indexOf(instance);
					deselected = group.selected.splice(selectedIndex, 1);
				}
			} else if (group.maxSel !== "0") {
				if (group.maxSel === "1") {
					// Deselect all
					deselected = group.selected.splice(0);
				}
				// Select instance
				group.selected.push(instance);
				selected = [ instance ];
			}
		}

		selected.forEach(function(instance) {
			instance["VB:s"] = "true";
		});

		deselected.forEach(function(instance) {
			instance["VB:s"] = "false";
		});

		return {
			selected: selected,
			deselected: deselected
		};
	};

	/**
	 * Applies selection changes to the three.js scene.
	 *
	 * @param {object[]} selected   The visual instance objects to select.
	 * @param {object[]} deselected The visual instance objects to deselect.
	 * @returns {sap.ui.vbm.Adapter3D} <code>this</code> to allow method chaining.
	 * @private
	 */
	Adapter3D.prototype._applySelectionChangesToScene3D = function(selected, deselected) {
		deselected.forEach(function(instance) {
			applyColor(instance, instance.color);
		});
		selected.forEach(function(instance) {
			applyColor(instance, instance.selectColor);
		});
		this._viewport.setShouldRenderFrame();
		return this;
	};

	Adapter3D.prototype._applyHoverChangesToScene3D = function(instance) {
		if (this._lastHoverInstance !== instance) {
			if (this._lastHoverInstance) {
				applyColor(this._lastHoverInstance, this._lastHoverInstance[toBoolean(this._lastHoverInstance["VB:s"]) ? "selectColor" : "color"]);
			}
			this._lastHoverInstance = instance;
			if (this._lastHoverInstance) {
				applyColor(this._lastHoverInstance, this._lastHoverInstance.hotDeltaColor);
			}
		}
		this._viewport.setShouldRenderFrame();
		return this;
	};

	// END: Selection handling.
	////////////////////////////////////////////////////////////////////////////

	return Adapter3D;
});
