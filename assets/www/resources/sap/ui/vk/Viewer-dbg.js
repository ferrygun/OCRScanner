/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
// Provides control sap.ui.vk.Viewer.
sap.ui.define([
	"jquery.sap.global", "./library", "sap/ui/core/Control", "./Scene", "./ContentResource",
	"./FlexibleControl", "sap/ui/layout/VerticalLayout", "sap/ui/core/ResizeHandler", "./DvlException", "./Messages", "./ProgressIndicator", "./Notifications",
	"./ContentConnector", "./ViewStateManager", "./dvl/ContentManager"
], function(
	jQuery, library, Control, Scene, ContentResource,
	FlexibleControl, VerticalLayout, ResizeHandler, DvlException, Messages, ProgressIndicator, Notifications,
	ContentConnector, ViewStateManager, DvlContentManager
) {
	"use strict";

	var log = jQuery.sap.log;

	sap.ui.lazyRequire("sap.ui.vk.NativeViewport");
	sap.ui.lazyRequire("sap.ui.vk.Overlay");
	sap.ui.lazyRequire("sap.ui.vk.SceneTree");
	sap.ui.lazyRequire("sap.ui.vk.StepNavigation");
	sap.ui.lazyRequire("sap.ui.vk.Toolbar");
	sap.ui.lazyRequire("sap.ui.vk.Viewport");

	/**
	 * Constructor for a new Viewer.
	 *
	 * @class Provides simple 3D visualization capability by connecting, configuring and presenting the essential Visualization Toolkit controls a single composite control.
	 * @param {string} [sId] ID for the new Viewer control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new Viewer control
	 * @public
	 * @author SAP SE
	 * @version 1.52.8
	 * @extends sap.ui.core.Control
	 * @alias sap.ui.vk.Viewer
	 * @experimental Since 1.32.0 This class is experimental and might be modified or removed in future versions.
	 */
	var Viewer = Control.extend("sap.ui.vk.Viewer", /** @lends sap.ui.vk.Viewer.prototype */ {
		metadata: {
			library: "sap.ui.vk",

			properties: {
				/**
				 * Enables or disables the Overlay control
				 */
				enableOverlay: {
					type: "boolean",
					defaultValue: false
				},
				/**
				 * Disables the scene tree control Button on the menu
				 */
				enableSceneTree: {
					type: "boolean",
					defaultValue: true
				},
				/**
				 * Shows or hides the scene tree control
				 */
				showSceneTree: {
					type: "boolean",
					defaultValue: true
				},
				/**
				 * Disables the Step Navigation Control Button on the menu
				 */
				enableStepNavigation: {
					type: "boolean",
					defaultValue: true
				},
				/**
				 * Disables the Message Popover Control
				 */
				enableNotifications: {
					type: "boolean",
					defaultValue: true
				},
				/**
				 * Shows or hides the Step Navigation Control
				 */
				showStepNavigation: {
					type: "boolean",
					defaultValue: false
				},
				/**
				 * Shows or hides the Step Navigation thumbnails
				 */
				showStepNavigationThumbnails: {
					type: "boolean",
					defaultValue: true
				},
				/**
				 * Shows or hides Toolbar control
				 */
				enableToolbar: {
					type: "boolean",
					defaultValue: true
				},
				/**
				 * Enable / disable progress indicator for downloading and rendering VDS files
				 */
				enableProgressIndicator: {
					type: "boolean",
					defaultValue: true
				},
				/**
				 * Width of the Viewer control
				 */
				width: {
					type: "sap.ui.core.CSSSize",
					defaultValue: null
				},
				/**
				 * Height of the Viewer control
				 */
				height: {
					type: "sap.ui.core.CSSSize",
					defaultValue: null
				},
				/**
				 * The toolbar title
				 */
				toolbarTitle: {
					type: "string",
					defaultValue: ""
				},
				/**
				 * Whether or not we want ViewStateManager to keep track of visibility changes.
				 */
				shouldTrackVisibilityChanges: {
					type: "boolean",
					defaultValue: false
				},
				/**
				 * Optional Emscripten runtime module settings. A JSON object with the following properties:
				 * <ul>
				 * <li>totalMemory {int} size of Emscripten module memory in bytes, default value: 128 MB.</li>
				 * <li>logElementId {string} ID of a textarea DOM element to write the log to.</li>
				 * <li>statusElementId {string} ID of a DOM element to write the status messages to.</li>
				 * </ul>
				 * Emscripten runtime module settings cannot be changed after the control is fully initialized.
				 */
				runtimeSettings: {
					type: "object",
					defaultValue: {}
				},
				/**
				 * Optional WebGL context attributes. A JSON object with the following boolean properties:
				 * <ul>
				 * <li>antialias {boolean} default value <code>true</code>. If set to <code>true</code>, the context will attempt to perform
				 * antialiased rendering if possible.</li>
				 * <li>alpha {boolean} default value <code>true</code>. If set to <code>true</code>, the context will have an alpha
				 * (transparency) channel.</li>
				 * <li>premultipliedAlpha {boolean} default value <code>false</code>. If set to <code>true</code>, the color channels in the
				 * framebuffer will be stored premultiplied by the alpha channel to improve performance.</li>
				 * </ul>
				 * Other {@link https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.2 WebGL context attributes} are also supported. WebGL
				 * context attributes cannot be changed after the control is fully initialized.
				 */
				webGLContextAttributes: {
					type: "object",
					defaultValue: {
						antialias: true,
						alpha: true,
						premultipliedAlpha: false
					}
				},
				/**
				 * Enables or disables showing of all hotspots
				 */
				showAllHotspots: {
					type: "boolean",
					defaultValue: false
				},
				/**
				 * Color used for highlighting Smart2D hotspots in the ABGR format.
				 */
				hotspotColorABGR: {
					type: "int",
					defaultValue: 0xc00000ff
				},
				/**
				 * Color used for highlighting Smart2D hotspots in the CSS Color format.
				 */
				hotspotColor: {
					type: "sap.ui.core.CSSColor",
					defaultValue: "rgba(255, 0, 0, 0.7529411764705882)"
				}
			},

			publicMethods: [
				"activateFullScreenMode",
				"activateRedlineDesign",
				"destroyRedlineDesign",
				"getDecryptionHandler",
				"getGraphicsCore",
				"getNativeViewport",
				"getRedlineDesign",
				"getScene",
				"getViewport",
				"getViewStateManager",
				"setDecryptionHandler"
			],

			aggregations: {
				/**
				 * Content resources to load and display in the Viewer control.
				 */
				contentResources: {
					type: "sap.ui.vk.ContentResource"
				},

				overlay: {
					type: "sap.ui.vk.Overlay",
					multiple: false
				},

				toolbar: {
					type: "sap.ui.vk.Toolbar",
					multiple: false,
					visibility: "hidden"
				},

				progressIndicator: {
					type: "sap.ui.vk.ProgressIndicator",
					multiple: false,
					visibility: "hidden"
				},

				viewport: {
					type: "sap.ui.vk.ViewportBase",
					multiple: false,
					visibility: "hidden"
				},

				nativeViewport: {
					type: "sap.ui.vk.NativeViewport",
					multiple: false,
					visibility: "hidden"
				},

				stepNavigation: {
					type: "sap.ui.vk.StepNavigation",
					multiple: false,
					visibility: "hidden"
				},

				sceneTree: {
					type: "sap.ui.vk.SceneTree",
					multiple: false,
					visibility: "hidden"
				},

				layout: {
					type: "sap.ui.layout.VerticalLayout",
					multiple: false,
					visibility: "hidden"
				},

				contentConnector: {
					type: "sap.ui.vk.ContentConnector",
					multiple: false,
					visibility: "hidden"
				},

				viewStateManager: {
					type: "sap.ui.vk.ViewStateManager",
					multiple: false,
					visibility: "hidden"
				},

				messagePopover: {
					type: "sap.ui.vk.Notifications",
					multiple: false,
					visibility: "hidden"
				}
			},

			defaultAggregation: "contentResources",

			events: {
				/**
				 * This event will be fired when any content resource or the contentResources aggregation has been changed and processed.
				 */
				contentResourceChangesProcessed: {},

				/**
				 * This event will be fired when a scene / image has been loaded into the Viewer.
				 */
				sceneLoadingSucceeded: {
					parameters: {
						/**
						 * Returns a reference to the loaded Scene.
						 */
						scene: {
							type: "sap.ui.vk.Scene"
						}
					}
				},

				/**
				 * This event will be fired when a critical error occurs during scene / image loading.
				 */
				sceneLoadingFailed: {
					parameters: {
						/**
						 * Returns an optional object describing the reason of the failure.
						 */
						reason: {
							type: "object"
						}
					}
				},

				/**
				 * This event will be fired when scene / image loaded in Viewer is about to be destroyed.
				 */
				sceneDestroying: {
					parameters: {
						/**
						 * Returns a reference to the scene to be destroyed.
						 */
						scene: {
							type: "sap.ui.vk.Scene"
						},

						/**
						 * Returns a <code>function(prevent: boolean)</code> with one boolean parameter.
						 * To prevent garbage collection after the scene is destroyed call this function
						 * passing <code>true</code> as a parameter.
						 */
						preventGarbageCollection: {
							type: "function"
						}
					}
				},

				/**
				 * This event is fired when the nodes are selected/unselected.
				 */
				selectionChanged: {
					parameters: {
						/**
						 * Node references to the newly selected nodes.
						 */
						selected: {
							type: "any[]"
						},
						/**
						 * Node references to the newly unselected nodes.
						 */
						unselected: {
							type: "any[]"
						}
					}
				},

				/**
				 * This event is fired when viewer enters/exits full screen mode.
				 */
				fullScreen: {
					parameters: {
						/**
						 * true: entered full screen; false: exited full screen.
						 */
						isFullScreen: {
							type: "boolean"
						}
					}
				},

				/**
				 * This event will be fired when a URL in a note is clicked.
				 */
				urlClicked: {
					parameters: {
						/**
						 * Returns a node reference of the note that contains the URL.
						 */
						nodeRef: "any",
						/**
						 * Returns a URL that was clicked.
						 */
						url: "string"
					}
				},

				/**
				 * This event will be fired when a node is clicked.
				 */
				nodeClicked: {
					parameters: {
						/**
						 * Returns a node reference.
						 */
						nodeRef: "any",
						x: "int",
						y: "int"
					}
				}
			}
		}
	});

	Viewer.prototype.applySettings = function(settings) {
		this._inApplySettings = true;
		Control.prototype.applySettings.apply(this, arguments);
		delete this._inApplySettings;

		if (this._viewStateManager) {
			this._viewStateManager.setShouldTrackVisibilityChanges(this.getShouldTrackVisibilityChanges());
		}

		// _componentsState stores the default state of the scene tree and step navigation.
		// It also stores the last user interaction such as show/hide.
		// These settings are used to restore states after switching between 2D and 3D.
		this._componentsState = {
			sceneTree: {
				defaultEnable: this.getEnableSceneTree(),
				// shouldBeEnabled refers to certain scenarios when the scene tree should not be displayed (for example Smart2D files)
				shouldBeEnabled: true,
				// saving the last state set by user interaction (turn scene tree ON/OFF)
				userInteractionShow: this.getShowSceneTree()
			},
			stepNavigation: {
				defaultEnable: this.getEnableStepNavigation(),
				userInteractionShow: this.getShowStepNavigation()
			},
			progressIndicator: {
				defaultEnable: this.getEnableProgressIndicator()
			},
			messagePopover: {
				defaultEnable: this.getEnableNotifications()
			}
		};
		// We initialise the viewer with the both scene tree and step navigation disabled.
		this.setEnableSceneTree(false);
		this.setEnableStepNavigation(false);
	};

	Viewer.prototype.init = function() {
		if (Control.prototype.init) {
			Control.prototype.init.apply(this);
		}

		this._contentConnector = new ContentConnector(this.getId() + "-contentconnector");
		this.setAggregation("contentConnector", this._contentConnector);
		this._contentConnector.attachContentReplaced(this._handleContentReplaced, this);
		this._contentConnector.attachContentChangesStarted(this._handleContentChangesStarted, this);
		this._contentConnector.attachContentChangesFinished(this._handleContentChangesFinished, this);
		this._contentConnector.attachContentChangesProgress(this._handleContentChangesProgress, this);

		this._viewStateManager = new ViewStateManager(this.getId() + "-viewstatemanager", {
			contentConnector: this._contentConnector
		});
		this.setAggregation("viewStateManager", this._viewStateManager);

		log.debug("sap.ui.vk.Viewer.init() called.");

		this._mainScene = null;
		this._resizeListenerId = null;
		this._busyIndicatorCounter = 0;
		this._toolbar = null;
		this._viewport = null;
		this._nativeViewport = null;
		this._redlineDesign = null;
		this._stepNavigation = null;
		this._sceneTree = null;
		this._overlayManager = {
			initialized: false,
			changed: false,
			control: null,
			// Event handler for Native Viewport zoom & pan
			onNativeViewportMove: function(event) {
				var oPan = event.getParameter("pan");
				var zoomFactor = event.getParameter("zoom");
				this.control.setPanAndZoom(oPan.x, oPan.y, zoomFactor);
			},
			// Event handler for Viewport zoom
			onViewportZoom: function(event) {
				var zoomFactor = event.getParameter("zoomFactor");
				this.control.setPanAndZoom(0, 0, zoomFactor);
			},
			// Event handler for Viewport pan
			onViewportPan: function(event) {
				var dx = event.getParameter("dx");
				var dy = event.getParameter("dy");
				this.control.setPanAndZoom(dx, dy, 1);
			}
		};
		this._overlayManager.delegate = {
			onAfterRendering: this._onAfterRenderingOverlay.bind(this, this._viewport, this._nativeViewport, this._overlayManager)
		};

		this._updateSizeTimer = 0;

		this._layout = new sap.ui.layout.VerticalLayout(this.getId() + "-verticalLayout").addStyleClass("sapUiVizKitLayout");
		this.setAggregation("layout", this._layout);

		this._toolbar = new sap.ui.vk.Toolbar({
			title: this.getToolbarTitle(),
			visible: this.getEnableToolbar(),
			viewer: this
		});
		this.setAggregation("toolbar", this._toolbar);
		this._layout.addContent(this._toolbar);

		this._splitter = new sap.ui.layout.Splitter(this.getId() + "-splitter", {
			orientation: "Horizontal"
		});
		this._layout.addContent(this._splitter);

		this._stackedViewport = new FlexibleControl(this.getId() + "-stackedViewport", {
			width: "100%",
			height: "100%",
			layout: "Stacked",
			layoutData: new sap.ui.layout.SplitterLayoutData({
				size: "auto",
				minSize: 200
			})
		});
		this._splitter.addContentArea(this._stackedViewport);

		this._messagePopover = new Notifications({ visible: true });
		this._messagePopover.attachAllMessagesCleared(this._updateLayout, this);
		this._messagePopover.attachMessageAdded(this._updateLayout, this);
		this.setAggregation("messagePopover", this._messagePopover);
		this._layout.addContent(this._messagePopover);

		this.setTooltip(sap.ui.vk.getResourceBundle().getText("VIEWER_TITLE"));

		if (this.getEnableProgressIndicator()) {
			this._progressIndicator = new ProgressIndicator({
				visible: false
			}).addStyleClass("sapUiVizKitProgressIndicator");
			this.setAggregation("progressIndicator", this._progressIndicator);
		}
	};

	/**
	 * Destroys the Viewer control. All scenes will be destroyed and all Viewports will be unregistered by the Graphics Core.
	 *
	 * @private
	 */
	Viewer.prototype.exit = function() {
		log.debug("sap.ui.vk.Viewer.exit() called.");

		if (this._viewport) {
			this._viewport.detachEvent("viewActivated", this._onViewportViewActivated, this);
		}

		// All scenes will be destroyed and all viewports will be unregistered by GraphicsCore.destroy.
		this._setMainScene(null);
		this._toolbar = null;
		this._messagePopover = null;
		this._sceneTree = null;
		this._nativeViewport = null;
		this._stepNavigation = null;
		this._viewport = null;
		this._componentsState = null;
		this._viewStateManager = null;
		this._contentConnector = null;

		if (this._resizeListenerId) {
			ResizeHandler.deregister(this._resizeListenerId);
			this._resizeListenerId = null;
		}

		if (Control.prototype.exit) {
			Control.prototype.exit.apply(this);
		}
	};

	Viewer.prototype._setMainScene = function(scene) {
		if (scene) {
			if (scene !== this._mainScene) {
				this._mainScene = scene;
				this._showViewport();

				// Set the scene tree & step navigation state based on default settings and last user interaction (if any).
				if (this._componentsState.sceneTree.defaultEnable) {
					this._instantiateSceneTree();
					this.setEnableSceneTree(true);
					if (this._componentsState.sceneTree.userInteractionShow && this._componentsState.sceneTree.shouldBeEnabled) {
						this.setShowSceneTree(true);
						this._sceneTree.setVisible(true);
					} else {
						this.setShowSceneTree(false);
					}
				} else if (this._sceneTree && this._viewStateManager){
					this._sceneTree.setScene(scene, this._viewStateManager);
				}

				if (this._componentsState.stepNavigation.defaultEnable) {
					this._instantiateStepNavigation();
					this.setEnableStepNavigation(true);
					if (this._componentsState.stepNavigation.userInteractionShow) {
						this.setShowStepNavigation(true);
						this._stepNavigation.setVisible(true);
					} else {
						this.setShowStepNavigation(false);
					}
				}
			}

			if (this._sceneTree) {
				this._sceneTree.refresh();
			}
			if (this._stepNavigation) {
				this._stepNavigation.refresh(scene);
			}
		} else {
			this._mainScene = null;
			this.setEnableSceneTree(false);
			this.setEnableStepNavigation(false);
		}
		return this;
	};

	/**
	 * Gets the GraphicsCore object if the currently loaded content is a 3D model.
	 *
	 * @returns {sap.ui.vk.dvl.GraphicsCore} The GraphicsCore object. If there is no 3D scene loaded then <code>null</code> is returned.
	 * @public
	 * @deprecated Since version 1.50.0.
	 */
	Viewer.prototype.getGraphicsCore = function() {
		return this._mainScene instanceof sap.ui.vk.dvl.Scene ? this._mainScene.getGraphicsCore() : null;
	};

	/**
	 * Gets the Scene currently loaded in the Viewer control.
	 *
	 * @returns {sap.ui.vk.Scene} The scene loaded in the control.
	 * @public
	 */
	Viewer.prototype.getScene = function() {
		return this._mainScene;
	};

	/**
	 * Gets the view state manager object used for handling visibility and selection of nodes.
	 *
	 * @returns {sap.ui.vk.ViewStateManager} The view state manager object.
	 * @public
	 */
	Viewer.prototype.getViewStateManager = function() {
		return this._viewStateManager;
	};

	/**
	 * Gets the 3D viewport.
	 *
	 * @returns {sap.ui.vk.dvl.Viewport | sap.ui.vk.threejs.Viewport} The 3D viewport.
	 * @public
	 */
	Viewer.prototype.getViewport = function() {
		return this._viewport ? this._viewport.getImplementation() : null;
	};

	/**
	 * Gets the 2D viewport used for displaying format natively supported by the browser - 2D images etc.
	 *
	 * @returns {sap.ui.vk.NativeViewport} The 2D viewport.
	 * @public
	 */
	Viewer.prototype.getNativeViewport = function() {
		return this._nativeViewport;
	};

	/**
	 * Gets the RedlineDesign instance used for creating redlining shapes.
	 *
	 * @returns {sap.ui.vk.RedlineDesign} The RedlineDesign instance.
	 * @public
	 */
	Viewer.prototype.getRedlineDesign = function() {
		// Support for dvl viewport, threejs viewport and native viewport
		if (isDvlViewport(this.getViewport()) || this.getViewport() instanceof sap.ui.vk.threejs.Viewport || this.getNativeViewport() instanceof sap.ui.vk.NativeViewport) {
			return this._redlineDesign;
		} else {
			return null;
		}
	};

	Viewer.prototype.getOverlay = function() {
		// overlay control is not stored in overlay aggregation, since it may be aggregated by the stacked viewport
		// therefore we keep an additional reference in the _overlayManager
		return this._overlayManager.control;
	};

	Viewer.prototype.setEnableOverlay = function(oProperty) {
		if (oProperty !== this.getProperty("enableOverlay")) {
			this.setProperty("enableOverlay", oProperty);
			this._overlayManager.changed = true;
		}
		return this;
	};

	Viewer.prototype.setEnableSceneTree = function(oProperty) {
		this.setProperty("enableSceneTree", oProperty, true);
		if (!oProperty) {
			this.setProperty("showSceneTree", false);
		}
		this._updateLayout();
		return this;
	};

	Viewer.prototype.setEnableNotifications = function(oProperty) {
		this.setProperty("enableNotifications", oProperty, true);
		this._messagePopover.setVisible(false);
		this._updateLayout();
		return this;
	};

	Viewer.prototype.setShowSceneTree = function(oProperty) {
		this.setProperty("showSceneTree", oProperty, true);
		this._updateLayout();
		return this;
	};

	Viewer.prototype.setEnableStepNavigation = function(oProperty) {
		this.setProperty("enableStepNavigation", oProperty, true);
		if (!oProperty) {
			this.setProperty("showStepNavigation", false);
		}
		this._updateLayout();
		return this;
	};

	Viewer.prototype.setShowStepNavigation = function(oProperty) {
		this.setProperty("showStepNavigation", oProperty, true);
		this._updateLayout();
		return this;
	};

	Viewer.prototype.setEnableToolbar = function(oProperty) {
		this.setProperty("enableToolbar", oProperty, true);
		this._updateLayout();
		return this;
	};

	/**
	 * It activates or deactivates full screen mode.
	 * @param {boolean} value Parameter which specifies whether to activate or deactivate full screen mode.
	 * @returns {sap.ui.vk.Viewer} <code>this</code> to allow method chaining.
	 * @private
	 */
	Viewer.prototype.activateFullScreenMode = function(value) {
		// It checks if the current document is in full screen mode
		var isInFullScreenMode = function(document) {
			return !!(document.fullScreen || document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement);
		};

		// Fullscreen toggle
		if (value) {
			if (!isInFullScreenMode(document)) {
				if (!this._fullScreenHandler) {
					var that = this;
					this._fullScreenHandler = function(event) {
						var isFullScreen = isInFullScreenMode(document);
						if (!isFullScreen) {
							document.removeEventListener("fullscreenchange", that._fullScreenHandler);
							document.removeEventListener("mozfullscreenchange", that._fullScreenHandler);
							document.removeEventListener("webkitfullscreenchange", that._fullScreenHandler);
							document.removeEventListener("MSFullscreenChange", that._fullScreenHandler);
						}

						that.fireFullScreen({
							isFullScreen: isFullScreen
						});
					};
				}

				var bodyElement = document.getElementsByTagName("body")[0];
				if (bodyElement.requestFullScreen) {
					document.addEventListener("fullscreenchange", this._fullScreenHandler);
					bodyElement.requestFullScreen();
				} else if (bodyElement.webkitRequestFullScreen) {
					document.addEventListener("webkitfullscreenchange", this._fullScreenHandler);
					bodyElement.webkitRequestFullScreen();
				} else if (bodyElement.mozRequestFullScreen) {
					document.addEventListener("mozfullscreenchange", this._fullScreenHandler);
					bodyElement.mozRequestFullScreen();
				} else if (bodyElement.msRequestFullscreen) {
					document.addEventListener("MSFullscreenChange", this._fullScreenHandler);
					bodyElement.msRequestFullscreen();
				}
			}

			this.addStyleClass("sapVizKitViewerFullScreen");
		} else {
			if (isInFullScreenMode(document)) {
				if (document.cancelFullScreen) {
					document.cancelFullScreen();
				} else if (document.webkitCancelFullScreen) {
					document.webkitCancelFullScreen();
				} else if (document.mozCancelFullScreen) {
					document.mozCancelFullScreen();
				} else if (document.msExitFullscreen) {
					document.msExitFullscreen();
				}
			}

			this.removeStyleClass("sapVizKitViewerFullScreen");
		}

		return this;
	};

	function isDvlViewport(vp) {
		if (!vp) {
			return false;
		}
		return vp instanceof sap.ui.vk.dvl.Viewport;
	}

	Viewer.prototype.getShowAllHotspots = function() {
		return isDvlViewport(this.getViewport()) ? this.getViewport().getShowAllHotspots() : this.getProperty("showAllHotspots");
	};

	Viewer.prototype.setShowAllHotspots = function(value) {
		this.setProperty("showAllHotspots", value, true);
		if (isDvlViewport(this.getViewport())) {
			this.getViewport().setShowAllHotspots(value);
		}
		return this;
	};

	Viewer.prototype.getHotspotColorABGR = function() {
		return isDvlViewport(this.getViewport()) ? this.getViewport().getHotspotColorABGR() : this.getProperty("hotspotColorABGR");
	};

	Viewer.prototype.setHotspotColorABGR = function(value) {
		this.setProperty("hotspotColorABGR", value, true);
		this.setProperty("hotspotColor", sap.ui.vk.colorToCSSColor(sap.ui.vk.abgrToColor(value)), true);
		if (isDvlViewport(this.getViewport())) {
			this.getViewport().setHotspotColorABGR(value);
		}
		return this;
	};

	Viewer.prototype.getHotspotColor = function() {
		return isDvlViewport(this.getViewport()) ? this.getViewport().getHotspotColor() : this.getProperty("hotspotColor");
	};

	Viewer.prototype.setHotspotColor = function(value) {
		this.setProperty("hotspotColor", value, true);
		this.setProperty("hotspotColorABGR", sap.ui.vk.colorToABGR(sap.ui.vk.cssColorToColor(value)), true);
		if (isDvlViewport(this.getViewport())) {
			this.getViewport().setHotspotColor(value);
		}
		return this;
	};

	Viewer.prototype.setRuntimeSettings = function(settings) {
		if (this._inApplySettings) {
			this.setProperty("runtimeSettings", settings, true);
			DvlContentManager.setRuntimeSettings(settings);
		} else {
			// runtimeSettings property should not be changeable in other cases than the constructor
			log.error(sap.ui.vk.getResourceBundle().getText(Messages.VIT29.summary), Messages.VIT29.code, "sap.ui.vk.Viewer");
		}
		return this;
	};

	Viewer.prototype.setWebGLContextAttributes = function(attributes) {
		if (this._inApplySettings) {
			this.setProperty("webGLContextAttributes", attributes, true);
			DvlContentManager.setWebGLContextAttributes(attributes);
		} else {
			// webGLContextAttributes property should not be changeable in other cases than the constructor
			log.error(sap.ui.vk.getResourceBundle().getText(Messages.VIT30.summary), Messages.VIT30.code, "sap.ui.vk.Viewer");
		}
		return this;
	};

	////////////////////////////////////////////////////////////////////////////
	// BEGIN: forward access to the contentResources aggregation to the content connector.

	Viewer.prototype.invalidate = function(origin) {
		if (origin instanceof ContentResource) {
			this._contentConnector.invalidate(origin);
			return;
		}
		Control.prototype.invalidate.apply(this, arguments);
	};

	Viewer.prototype.validateAggregation = function(aggregationName, object, multiple) {
		if (aggregationName === "contentResources") {
			return this._contentConnector.validateAggregation(aggregationName, object, multiple);
		}
		return Control.prototype.validateAggregation.call(this, aggregationName, object, multiple);
	};

	Viewer.prototype.getAggregation = function(aggregationName, defaultForCreation) {
		if (aggregationName === "contentResources") {
			return this._contentConnector.getAggregation(aggregationName, defaultForCreation);
		}
		return Control.prototype.getAggregation.call(this, aggregationName, defaultForCreation);
	};

	Viewer.prototype.setAggregation = function(aggregationName, object, suppressInvalidate) {
		if (aggregationName === "contentResources") {
			this._contentConnector.setAggregation(aggregationName, object, suppressInvalidate);
			return this;
		}
		return Control.prototype.setAggregation.call(this, aggregationName, object, suppressInvalidate);
	};

	Viewer.prototype.addAggregation = function(aggregationName, object, suppressInvalidate) {
		if (aggregationName === "contentResources") {
			this._contentConnector.addAggregation(aggregationName, object, suppressInvalidate);
			return this;
		}
		return Control.prototype.addAggregation.call(this, aggregationName, object, suppressInvalidate);
	};

	Viewer.prototype.insertAggregation = function(aggregationName, object, index, suppressInvalidate) {
		if (aggregationName === "contentResources") {
			this._contentConnector.insertAggregation(aggregationName, object, index, suppressInvalidate);
			return this;
		}
		return Control.prototype.insertAggregation.call(this, aggregationName, object, index, suppressInvalidate);
	};

	Viewer.prototype.removeAggregation = function(aggregationName, object, suppressInvalidate) {
		if (aggregationName === "contentResources") {
			return this._contentConnector.removeAggregation(aggregationName, object, suppressInvalidate);
		}
		return Control.prototype.removeAggregation.call(this, aggregationName, object, suppressInvalidate);
	};

	Viewer.prototype.removeAllAggregation = function(aggregationName, suppressInvalidate) {
		if (aggregationName === "contentResources") {
			return this._contentConnector.removeAllAggregation(aggregationName, suppressInvalidate);
		}
		return Control.prototype.removeAllAggregation.call(this, aggregationName, suppressInvalidate);
	};

	Viewer.prototype.destroyAggregation = function(aggregationName, suppressInvalidate) {
		if (aggregationName === "contentResources") {
			this._contentConnector.destroyAggregation(aggregationName, suppressInvalidate);
			return this;
		}
		return Control.prototype.destroyAggregation.call(this, aggregationName, suppressInvalidate);
	};

	// END: forward access to the contentResources aggregation to the content connector.
	////////////////////////////////////////////////////////////////////////////

	Viewer.prototype.onBeforeRendering = function() {
		this._showOverlay();

		if (this._resizeListenerId) {
			ResizeHandler.deregister(this._resizeListenerId);
			this._resizeListenerId = null;
		}
	};

	Viewer.prototype.onAfterRendering = function() {
		this._resizeListenerId = ResizeHandler.register(this, this._handleResize.bind(this));
		this._handleResize();
	};

	/**
	 * Handles the resize events from the {@link sap.ui.core.ResizeHandler ResizeHandler} object.
	 *
	 * @param {jQuery.Event} event The event object.
	 * @private
	 */
	Viewer.prototype._handleResize = function(event) {
		this._updateSize();
	};

	Viewer.prototype._delayedUpdateSize = function() {
		if (this.getDomRef()) {
			if (this._updateSizeTimer) {
				clearTimeout(this._updateSizeTimer);
			}
			this._updateSizeTimer = setTimeout(this._updateSize.bind(this), 0);
		}
	};

	Viewer.prototype._updateSize = function() {
		this._updateSizeTimer = 0;
		if (!this.getDomRef()) {
			return;
		}

		var height = this.getDomRef().clientHeight;

		if (this._toolbar && this._toolbar.getDomRef() && this.getEnableToolbar()) {
			height -= this._toolbar.getDomRef().clientHeight;
		}

		if (this._stepNavigation && this._stepNavigation.getDomRef() && this.getShowStepNavigation()) {
			height -= this._stepNavigation.getDomRef().clientHeight;
		}

		if (this._messagePopover && this._messagePopover.getDomRef() && this._messagePopover.getVisible()) {
			height -= this._messagePopover.getDomRef().clientHeight;
		}

		if (this._sceneTree){
			this._sceneTree.updateHeight(height);
		}

		this._splitter.setHeight(Math.max(height, 100) + "px"); // set content height
	};

	Viewer.prototype.isTreeBinding = function(name) {
		return name === "contentResources";
	};

	Viewer.prototype.setBusy = function(busy) {
		if (busy) {
			if (this._busyIndicatorCounter === 0) {
				this.setBusyIndicatorDelay(0);
				Control.prototype.setBusy.call(this, true);
			}
			this._busyIndicatorCounter += 1;
		} else {
			this._busyIndicatorCounter -= 1;
			if (this._busyIndicatorCounter == 0) {
				Control.prototype.setBusy.call(this, false);
			}
		}
	};

	Viewer.prototype._updateLayout = function() {
		if (this._bIsBeingDestroyed) {
			return;
		}

		if (this._sceneTree) {
			if (this.getShowSceneTree() && this.getEnableSceneTree()) {
				this._sceneTree.setVisible(true);
				if (this._splitter.indexOfContentArea(this._sceneTree) < 0) {
					this._splitter.insertContentArea(this._sceneTree, 0);
					this._splitter.triggerResize(true);
				}
			} else {
				if (this._splitter.indexOfContentArea(this._sceneTree) >= 0) {
					this._splitter.removeContentArea(this._sceneTree);
					this._splitter.triggerResize(true);
				}
				this._sceneTree.setVisible(false);
			}
		}

		if (this._stepNavigation) {
			this._stepNavigation.setVisible(this.getShowStepNavigation() && this.getEnableStepNavigation());
		}

		if (this._messagePopover) {
			this._messagePopover.setVisible(this.getEnableNotifications() && this._messagePopover.getAggregation("_messagePopover").getItems().length > 0);
		}

		if (this._toolbar) {
			this._toolbar.setVisible(this.getEnableToolbar());
			this._toolbar.refresh();
		}

		this._delayedUpdateSize();
	};

	Viewer.prototype._instantiateSceneTree = function() {
		if (!this._sceneTree) {
			this._sceneTree = new sap.ui.vk.SceneTree({
				layoutData: new sap.ui.layout.SplitterLayoutData({
					size: "320px",
					minSize: 200
				}),
				viewStateManager: this._viewStateManager,
				contentConnector: this._contentConnector
			});
			this.setAggregation("sceneTree", this._sceneTree);
		}
		return this;
	};

	Viewer.prototype._instantiateStepNavigation = function() {
		if (!this._stepNavigation) {
			this._stepNavigation = new sap.ui.vk.StepNavigation(this.getId() + "-stepNavigation", {
				showThumbnails: this.getShowStepNavigationThumbnails(),
				contentConnector: this._contentConnector
			});
			this.setAggregation("stepNavigation", this._stepNavigation);
			this._layout.insertContent(this._stepNavigation, 3);
		}
		return this;
	};

	Viewer.prototype._showViewport = function() {
		if (!this._viewport) {
			this._viewport = new sap.ui.vk.Viewport(this.getId() + "-viewport", {
				viewStateManager: this._viewStateManager,
				selectionMode: sap.ui.vk.SelectionMode.Exclusive,
				contentConnector: this._contentConnector // content connector must be the last parameter in the list!
			});

			this.setAggregation("viewport", this._viewport);
			this._viewport.attachEvent("viewActivated", this._onViewportViewActivated, this);

			var vp = this.getViewport();
			if (isDvlViewport(vp)) {
				vp.setHotspotColor(this.getProperty("hotspotColor"));
				vp.setHotspotColorABGR(this.getProperty("hotspotColorABGR"));
				vp.setShowAllHotspots(this.getProperty("showAllHotspots"));
			}
		}

		if (this._nativeViewport) {
			this._nativeViewport.setVisible(false);
		}
		this._stackedViewport.removeAllContent();
		this._stackedViewport.addContent(this._viewport);
		this._viewport.setVisible(true);

		return this;
	};

	Viewer.prototype._showNativeViewport = function() {
		if (!this._nativeViewport) {
			this._nativeViewport = new sap.ui.vk.NativeViewport(this.getId() + "-nativeViewport", {
				limitZoomOut: true,
				contentConnector: this._contentConnector
			});
			this.setAggregation("nativeViewport", this._nativeViewport);
		}

		if (this._viewport) {
			this._viewport.setVisible(false);
		}
		this._stackedViewport.removeAllContent();
		this._stackedViewport.addContent(this._nativeViewport);
		this._nativeViewport.setVisible(true);

		return this;
	};

	Viewer.prototype._showOverlay = function() {
		var oOverlayManager = this._overlayManager;
		if (oOverlayManager.changed) {
			var oOverlay;
			if (this.getEnableOverlay()) {
				if (!oOverlayManager.initialized) {
					// overlay not yet initialized -> check if overlay is given
					if (!(oOverlay = this.getAggregation("overlay"))) {
						// no Overlay control given -> create one
						oOverlay = new sap.ui.vk.Overlay();
					}
					oOverlay.setZoomOnResize(false);
					oOverlayManager.control = oOverlay;
					oOverlayManager.initialized = true;
				} else {
					oOverlay = oOverlayManager.control;
					oOverlay.reset();
				}
				// The Overlay needs to be appended to either Viewport or Native Viewport
				// so we check which one is active.
				if (this._nativeViewport && this._nativeViewport.getVisible()) {
					oOverlay.setTarget(this._nativeViewport);
					// set zoom restriction
					oOverlayManager.savedLimitZoomOutState = this._nativeViewport.getLimitZoomOut();
					this._nativeViewport.setLimitZoomOut(true);
					// register move event of native Viewport to adapt pan and zoom state
					this._nativeViewport.attachEvent("move", oOverlayManager.onNativeViewportMove, oOverlayManager);
				} else if (this._viewport && this._viewport.getVisible()) {
					oOverlay.setTarget(this._viewport);
					oOverlayManager.savedLimitZoomOutState = false;
					// Capturing the Viewport zooming and panning events so we can pass them
					// through to the Overlay so it can zoom and pan the overlay areas (hotspots).
					this._viewport.attachEvent("zoom", oOverlayManager.onViewportZoom, oOverlayManager);
					this._viewport.attachEvent("pan", oOverlayManager.onViewportPan, oOverlayManager);
				}

				// add Overlay to stacked Viewport
				this._stackedViewport.addContent(oOverlay);
				this._stackedViewport.addDelegate(oOverlayManager.delegate);
			} else {
				// de-register move event of native Viewport to adapt pan and zoom state
				this._nativeViewport.detachEvent("move", oOverlayManager.onNativeViewportMove, oOverlayManager);
				// remove Overlay from stacked Viewport
				this._stackedViewport.removeDelegate(oOverlayManager.delegate);
				this._stackedViewport.removeContent(oOverlayManager.control);
				// remove zoom restriction
				this._nativeViewport.setLimitZoomOut(oOverlayManager.savedLimitZoomOutState);
			}
			oOverlayManager.changed = false;
		}
	};

	Viewer.prototype._onAfterRenderingOverlay = function(oEvent) {
		// manipulate DOM tree after rendering of stacked viewport
		var overlayDiv = this._overlayManager.control.getDomRef();

		if (overlayDiv && (this._nativeViewport || this._viewport)) {
			// viewportToAppend is the domRef to either viewport or nativeViewport
			var viewportToAppend = this._nativeViewport && this._nativeViewport.getVisible() ? this._nativeViewport.getDomRef() : this._viewport.getDomRef();

			if (overlayDiv.parentNode !== viewportToAppend) {
				// Do not display the content div the overlay belongs to;
				// otherwise it would receive all events we expect on the overlay
				overlayDiv.parentNode.style.display = "none";
			}
			// make overlay a child of viewport/nativeViewport to get event bubbling right
			viewportToAppend.appendChild(overlayDiv);
			// adapt overlay size to parent node
			overlayDiv.style.width = "100%";
			overlayDiv.style.height = "100%";
		}
	};

	/**
	 * Sets an object that decrypts content of encrypted models.
	 *
	 * @param {sap.ui.vk.DecryptionHandler} handler An object that decrypts content of encrypted models.
	 * @return {sap.ui.vk.Viewer} <code>this</code> to allow method chaining.
	 * @public
	 */
	Viewer.prototype.setDecryptionHandler = function(handler) {
		DvlContentManager.setDecryptionHandler(handler);
		return this;
	};

	/**
	 * Gets an object that decrypts content of encrypted models.
	 *
	 * @return {sap.ui.vk.DecryptionHandler} An object that decrypts content of encrypted models.
	 * @public
	 */
	Viewer.prototype.getDecryptionHandler = function() {
		return DvlContentManager.getDecryptionHandler();
	};

	/*
	 * It creates a new instance of {sap.ui.vk.RedlineDesign}.
	 * @returns {sap.ui.vk.Viewer} <code>this</code> to allow method chaining.
	 * @private
	 */
	Viewer.prototype._instantiateRedlineDesign = function(redlineElements) {

		// if either Viewport/NativeViewport exist and are visible, we instantiate RedlineDesign
		if ((this.getViewport() && this.getViewport().getVisible()) || (this.getNativeViewport() && this.getNativeViewport().getVisible())) {
			var activeViewport = this.getViewport() && this.getViewport().getVisible() ? this.getViewport() : this.getNativeViewport();
			var virtualViewportSize = activeViewport.getOutputSize();

			this._redlineDesign = new sap.ui.vk.RedlineDesign({
				visible: false,
				virtualTop: virtualViewportSize.top,
				virtualLeft: virtualViewportSize.left,
				virtualSideLength: virtualViewportSize.sideLength,
				redlineElements: redlineElements
			});

			this._redlineDesign._setTargetViewport(activeViewport);
		}
		return this;
	};

	/*
	 * Activates the redline design control.
	 * @param {sap.ui.vk.RedlineElement | sap.ui.vk.RedlineElement[]} The redline element/elements which will be rendered
	 * as soon as the redline design control is activated.
	 * @returns {sap.ui.vk.Viewer} <code>this</code> to allow method chaining.
	 * @public
	 */
	Viewer.prototype.activateRedlineDesign = function(redlineElements) {

		redlineElements = redlineElements || [];
		this._instantiateRedlineDesign(redlineElements);
		// placing the RedlineDesign inside the _stackedViewport
		this.getRedlineDesign().placeAt(this._stackedViewport);
		this.getRedlineDesign().setVisible(true);

		var onRedlineDesignPanViewport = function(event) {
			var deltaX = event.getParameter("deltaX"),
				deltaY = event.getParameter("deltaY");
			this.getViewport().queueCommand(function(deltaX, deltaY) {
				this.getViewport().pan(deltaX, deltaY);
				this.getViewport().endGesture();
			}.bind(this, deltaX, deltaY));
		};

		var onRedlineDesignZoomViewport = function(event) {
			var originX = event.getParameter("originX"),
				originY = event.getParameter("originY"),
				zoomFactor = event.getParameter("zoomFactor");
			this.getViewport().queueCommand(function(originX, originY, zoomFactor) {
				this.getViewport().beginGesture(originX, originY);
				this.getViewport().zoom(zoomFactor);
				this.getViewport().endGesture();
			}.bind(this, originX, originY, zoomFactor));
		};

		var onRedlineDesignPanNativeViewport = function(event) {
			var deltaX = event.getParameter("deltaX"),
				deltaY = event.getParameter("deltaY");

			this.getNativeViewport().queueCommand(function() {
				this.getNativeViewport().pan(deltaX, deltaY);
				this.getNativeViewport().endGesture();
			}.bind(this));
		};

		var onRedlineDesignZoomNativeViewport = function(event) {
			var originX = event.getParameter("originX"),
				originY = event.getParameter("originY"),
				zoomFactor = event.getParameter("zoomFactor");

			this.getNativeViewport().queueCommand(function(originX, originY, zoomFactor) {
				this.getNativeViewport().beginGesture(originX, originY);
				this.getNativeViewport().zoom(zoomFactor);
				this.getNativeViewport().endGesture();
			}.bind(this, originX, originY, zoomFactor));
		};

		var onRedlineDesignPanThreejsViewport = function(event) {
			var deltaX = event.getParameter("deltaX"),
				deltaY = event.getParameter("deltaY");
			this.getViewport().queueCommand(function(deltaX, deltaY) {
				this.getViewport()._viewportGestureHandler._cameraController.beginGesture(deltaX, deltaY);
				this.getViewport()._viewportGestureHandler._cameraController.pan(deltaX, deltaY);
				this.getViewport()._viewportGestureHandler._cameraController.endGesture();
			}.bind(this, deltaX, deltaY));
		};

		var onRedlineDesignZoomThreejsViewport = function(event) {
			var originX = event.getParameter("originX"),
				originY = event.getParameter("originY"),
				zoomFactor = event.getParameter("zoomFactor");
			this.getViewport().queueCommand(function(originX, originY, zoomFactor) {
				this.getViewport()._viewportGestureHandler._cameraController.beginGesture(originX, originY);
				this.getViewport()._viewportGestureHandler._cameraController.zoom(zoomFactor);
				this.getViewport()._viewportGestureHandler._cameraController.endGesture();
			}.bind(this, originX, originY, zoomFactor));
		};

		// Subscribing to the events fired by the RedlineDesign.
		// Everytime the RedlineDesign moves, we receive the new coordinates/zoom level
		// and we use them to update the Viewport/NativeViewport
		if (this.getNativeViewport() && this.getNativeViewport().getVisible()) {
			this.getRedlineDesign().attachEvent("pan", onRedlineDesignPanNativeViewport.bind(this));
			this.getRedlineDesign().attachEvent("zoom", onRedlineDesignZoomNativeViewport.bind(this));
		} else if (isDvlViewport(this.getViewport()) && this.getViewport() && this.getViewport().getVisible()) {
			this.getRedlineDesign().attachEvent("pan", onRedlineDesignPanViewport.bind(this));
			this.getRedlineDesign().attachEvent("zoom", onRedlineDesignZoomViewport.bind(this));
		} else if (this.getViewport() instanceof sap.ui.vk.threejs.Viewport && this.getViewport().getVisible()) {
			this.getRedlineDesign().attachEvent("pan", onRedlineDesignPanThreejsViewport.bind(this));
			this.getRedlineDesign().attachEvent("zoom", onRedlineDesignZoomThreejsViewport.bind(this));
		} else {
			jQuery.sap.log.Error("Error: Viewport not supported");
		}

		return this;
	};

	/*
	 * It destroys the current instance of {sap.ui.vk.RedlineDesign}.
	 * @returns {sap.ui.vk.Viewer} <code>this</code> to allow method chaining.
	 * @public
	 */
	Viewer.prototype.destroyRedlineDesign = function() {
		if (this.getRedlineDesign()) {
			this.getRedlineDesign().destroy();
			this._redlineDesign = null;
		}
		return this;
	};

	Viewer.prototype._onViewportViewActivated = function(event) {
		// If it's 3D content, we mark the scene tree as 'usable'.
		// In case of 2D, the scene tree should not be enabled.
		this._componentsState.sceneTree.shouldBeEnabled = event.getParameter("type") === "3D";
	};

	Viewer.prototype._handleContentReplaced = function(event) {
		var content = event.getParameter("newContent");

		if (content && content.scene instanceof sap.ui.vk.Scene) {
			this._showViewport();

			// each time we load a 3D mode, we have to update the panning ratio of the redline control
			if (this.getRedlineDesign()) {
				this.getRedlineDesign().updatePanningRatio();
			}

			this._setMainScene(content.scene);

			// this.fireSceneLoadingSucceeded({
			// 	scene: content
			// });
		} else if (content instanceof HTMLImageElement || content instanceof HTMLObjectElement) {
			this._setMainScene(null);
			this._showNativeViewport();

			if (this.getEnableOverlay()) {
				this._overlayManager.changed = true;
				this._showOverlay();
			}

			// this.fireSceneLoadingSucceeded({
			// 	scene: content
			// });
		} else {
			this._setMainScene(null);
			if (this._viewport) {
				this._viewport.setVisible(false);
			}
			if (this._nativeViewport) {
				this._nativeViewport.setVisible(false);
			}
			this._stackedViewport.removeAllContent();
		}
	};

	Viewer.prototype._handleContentChangesStarted = function(event) {
		this.setBusy(true);
		if (this._componentsState.progressIndicator.defaultEnable) {
			this._progressIndicator.setPercentValue(0.0);
			this._progressIndicator.setVisible(true);
		}
	};

	Viewer.prototype._handleContentChangesFinished = function(event) {
		log.info("Finished");
		this._progressIndicator.setVisible(false);
		this._progressIndicator.setDisplayValue("");
		this._progressIndicator.setPercentValue(0);
		this.setBusy(false);
		var content = event.getParameter("content");
		if (content) {
			this.fireSceneLoadingSucceeded({
				scene: content
			});
		}
		var failureReason = event.getParameter("failureReason");
		if (failureReason) {
			this.fireSceneLoadingFailed({
				reason: failureReason
			});
			// We check if Notifications control is off before showing the error images
			if (this.getEnableNotifications() === false) {
				this._showNativeViewport();
				// Content Connector throws this error if resource type is not supported.
				if (failureReason.errorMessage === "The content resources cannot be loaded. The type of content resources is unknown.") {
					// We call NV loadFiled method without parameter so that we use unsupported file text in method already.
					this._nativeViewport.loadFailed();
				} else {
					// If resource has supported type but other issues exist we throw Error loading image.
					// Translated text from Message library
					var errorLoadingFile = sap.ui.vk.getResourceBundle().getText("VIEWPORT_MESSAGEERRORLOADINGFILE");
					// LoadFailed passes parameter as text to present.
					this._nativeViewport.loadFailed(errorLoadingFile);
				}
			}
			(Array.isArray(failureReason) ? failureReason : [ failureReason ]).forEach(function(reason) {
				log.error(reason.errorMessage, "", "sap.ui.vk.Viewer");
			});
		}
		this.fireContentResourceChangesProcessed();
	};

	Viewer.prototype._handleContentChangesProgress = function(event) {
		if (this._progressIndicator.getVisible()) {
			var source = event.getParameter("source"),
			    percentage = event.getParameter("percentage"),
			    extension = source.match(/\..{3,4}$/),         // if the source has a proper filename with extension, we display it.
			                                                   // if the file is tokenized, we don't display anything.
			    processedSource = extension && extension[0] ? source.split(/\\|\//).pop() + " " : "";

			this._progressIndicator.setPercentValue(percentage);
			this._progressIndicator.setDisplayValue(processedSource + sap.ui.vk.getResourceBundle().getText("PROGRESS_INDICATOR_DOWNLOADING") + " " + (percentage ? Math.floor(percentage) + "%" : ""));
		}
	};

	Viewer.prototype._handleContentDestroying = function(event) {
		this.fireSceneDestroying({
			scene: event.getParameter("content").scene,
			preventGarbageCollection: event.getParameter("preventGarbageCollection")
		});
	};

	return Viewer;
});
