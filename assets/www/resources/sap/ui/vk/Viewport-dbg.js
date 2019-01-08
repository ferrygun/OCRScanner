/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.vk.Viewport.
sap.ui.define([
	"jquery.sap.global", "./library", "./ViewportBase", "sap/ui/core/ResizeHandler", "./Loco", "./ViewportHandler",
	"./Smart2DHandler", "./Messages", "./ContentConnector", "./ViewStateManager"
], function(
	jQuery, library, ViewportBase, ResizeHandler, Loco, ViewportHandler,
	Smart2DHandler, Messages, ContentConnector, ViewStateManager
) {
	"use strict";

	/**
	 * Constructor for a new Viewport.
	 *
	 * @class
	 * Provides a rendering canvas for the 3D elements of a loaded scene.
	 *
	 * @param {string} [sId] ID for the new Viewport control. Generated automatically if no ID is given.
	 * @param {object} [mSettings] Initial settings for the new Viewport control.
	 * @public
	 * @author SAP SE
	 * @version 1.52.8
	 * @extends sap.ui.vk.ViewportBase
	 * @alias sap.ui.vk.Viewport
	 * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
	 */
	var Viewport = ViewportBase.extend("sap.ui.vk.Viewport", /** @lends sap.ui.vk.Viewport.prototype */ {
		metadata: {
			library: "sap.ui.vk",

			publicMethods: [

			]
		}
	});

	var basePrototype = Viewport.getMetadata().getParent().getClass().prototype;

	Viewport.prototype.init = function() {
		if (basePrototype.init) {
			basePrototype.init.call(this);
		}

		this._implementation = null;
		this._deferred = {};              // properties/objects that are to be forwarded to _implementation when it is created.
	};

	Viewport.prototype.exit = function() {
		this._deferred = null;
		this._destroyImplementation();

		if (basePrototype.exit) {
			basePrototype.exit.call(this);
		}
	};

	Viewport.prototype.getImplementation = function() {
		return this._implementation;
	};

	Viewport.prototype._destroyImplementation = function() {
		if (this._implementation) {
			this._implementation.destroy();
			this._implementation = null;
		}
		return this;
	};

	////////////////////////////////////////////////////////////////////////
	// Propagate public properties to implementation

	Viewport.prototype.getShowDebugInfo = function() {
		if (this._implementation) {
			return this._implementation.getShowDebugInfo();
		}
		return basePrototype.getShowDebugInfo.call(this);
	};

	Viewport.prototype.setShowDebugInfo = function(value) {
		basePrototype.setShowDebugInfo.call(this, value);
		if (this._implementation) {
			this._implementation.setShowDebugInfo(value);
		}
		return this;
	};

	Viewport.prototype.getBackgroundColorTop = function() {
		if (this._implementation) {
			return this._implementation.getBackgroundColorTop();
		}
		return basePrototype.getBackgroundColorTop.call(this);
	};

	Viewport.prototype.setBackgroundColorTop = function(value) {
		basePrototype.setBackgroundColorTop.call(this, value);
		if (this._implementation) {
			this._implementation.setBackgroundColorTop(value);
		}
		return this;
	};

	Viewport.prototype.getBackgroundColorBottom = function() {
		if (this._implementation) {
			return this._implementation.getBackgroundColorBottom();
		}
		return basePrototype.getBackgroundColorBottom.call(this);
	};

	Viewport.prototype.setBackgroundColorBottom = function(value) {
		basePrototype.setBackgroundColorBottom.call(this, value);
		if (this._implementation) {
			this._implementation.setBackgroundColorBottom(value);
		}
		return this;
	};

	Viewport.prototype.setWidth = function(value) {
		basePrototype.setWidth.call(this, value);
		if (this._implementation) {
			this._implementation.setWidth(value);
		}
		return this;
	};

	Viewport.prototype.setHeight = function(value) {
		basePrototype.setHeight.call(this, value);
		if (this._implementation) {
			this._implementation.setHeight(value);
		}
		return this;
	};

	Viewport.prototype.setSelectionMode = function(value) {
		basePrototype.setSelectionMode.call(this, value);
		if (this._implementation) {
			this._implementation.setSelectionMode(value);
		}
		return this;
	};

	Viewport.prototype.getSelectionMode = function() {
		if (this._implementation) {
			return this._implementation.getSelectionMode();
		}
		return basePrototype.getSelectionMode.call(this);
	};

	Viewport.prototype.setCamera = function(value) {
		basePrototype.setCamera.call(this, value);
		if (this._implementation) {
			this._implementation.setCamera(value);
			return this;
		}

		return this;
	};

	Viewport.prototype.getCamera = function() {
		if (this._implementation) {
			return this._implementation.getCamera();
		}
		return basePrototype.getCamera.call(this);
	};

	Viewport.prototype.setShouldRenderFrame = function() {
		if (this._implementation) {
			this._implementation.setShouldRenderFrame();
		}
		return this;
	};

	Viewport.prototype.shouldRenderFrame = function() {
		if (this._implementation) {
			this._implementation.shouldRenderFrame();
		}
	};

	////////////////////////////////////////////////////////////////////////
	// Content connector handling begins.

	Viewport.prototype._setContent = function(content) {
		var scene = null;
		var camera = null;

		if (content) {
			scene = content.scene;
			if (!(scene instanceof sap.ui.vk.Scene)) {
				scene = null;
			}
			camera = content.camera;
			if (!(camera instanceof sap.ui.vk.Camera)) {
				camera = null;
			}
		}

		this._setScene(scene);

		if (camera) { // camera is optional so only set it if exist
			this.setCamera(camera);
		}
	};

	Viewport.prototype._onAfterUpdateContentConnector = function() {
		this._setContent(this._contentConnector.getContent());
	};

	Viewport.prototype._onBeforeClearContentConnector = function() {

		if (basePrototype._onBeforeClearContentConnector) {
			basePrototype._onBeforeClearContentConnector.call(this);
		}

		this._setScene(null);
	};

	Viewport.prototype._handleContentReplaced = function(event) {
		var content = event.getParameter("newContent");
		this._setContent(content);
	};

	Viewport.prototype._setScene = function(scene) {
		if (scene instanceof sap.ui.vk.Scene) {
			var sceneType = scene.getMetadata().getName(),
			    implementationType = this._implementation && this._implementation.getMetadata().getName(),
			    reuseImplemenation = sceneType === "sap.ui.vk.dvl.Scene" && implementationType === "sap.ui.vk.dvl.Viewport" ||
			                         sceneType === "sap.ui.vk.threejs.Scene" && implementationType === "sap.ui.vk.threejs.Viewport";

			if (!reuseImplemenation) {
				this._destroyImplementation();
				var newImplementationType;
				var that = this;
				var camera = this.getCamera();

				if (sceneType === "sap.ui.vk.dvl.Scene") {
					newImplementationType = "sap.ui.vk.dvl.Viewport";

					jQuery.sap.require(newImplementationType);
					this._implementation = new (jQuery.sap.getObject(newImplementationType))({
						viewStateManager: this.getViewStateManager(),
						// Check.. as we don't have these in the base....
						// urlClicked: function(event) {
						// 	that.fireUrlClicked({
						// 		nodeRef: event.getParameter("nodeRef"),
						// 		url: event.getParameter("url")
						// 	});
						// },
						// nodeClicked: function(event) {
						// 	that.fireNodeClicked({
						// 		nodeRef: event.getParameter("nodeRef"),
						// 		x: event.getParameter("x"),
						// 		y: event.getParameter("y")
						// 	});
						// },
						// pan: function(event) {
						// 	that.firePan({
						// 		dx: event.getParameter("dx"),
						// 		dy: event.getParameter("dy")
						// 	});
						// },
						// zoom: function(event) {
						// 	that.fireZoom({
						// 		zoomFactor: event.getParameter("zoomFactor")
						// 	});
						// },
						// rotate: function(event) {
						// 	that.fireRotate({
						// 		dx: event.getParameter("dx"),
						// 		dy: event.getParameter("dy")
						// 	});
						// },
						resize: function(event) {
							that.fireResize({
								size: event.getParameter("size")
							});
						},
						// viewActivated: function(event) {
						// 	that.fireViewActivated({
						// 		type: event.getParameter("type")
						// 	});
						// },
						// frameRenderingFinished: function(event) {
						// 	that.fireFrameRenderingFinished();
						// },
						showDebugInfo: this.getShowDebugInfo(),
						width: this.getWidth(),
						height: this.getHeight(),
						backgroundColorTop: this.getBackgroundColorTop(),
						backgroundColorBottom: this.getBackgroundColorBottom(),
						selectionMode: this.getSelectionMode(),
						contentConnector: this.getContentConnector() // content connector must be the last parameter in the list!
					});

				} else if (sceneType === "sap.ui.vk.threejs.Scene") {
					newImplementationType = "sap.ui.vk.threejs.Viewport";

					jQuery.sap.require(newImplementationType);
					this._implementation = new (jQuery.sap.getObject(newImplementationType))({
						viewStateManager: this.getViewStateManager(),
						showDebugInfo: this.getShowDebugInfo(),
						width: this.getWidth(),
						height: this.getHeight(),
						backgroundColorTop: this.getBackgroundColorTop(),
						backgroundColorBottom: this.getBackgroundColorBottom(),
						selectionMode: this.getSelectionMode(),
						contentConnector: this.getContentConnector() // content connector must be the last parameter in the list!
					});
				}

				if (newImplementationType) {

					// pass the camera, if we have one
					if (camera) {
						this._camera = null; // proxy no longer owns the camera
						this._implementation.setCamera(camera); // forward the camera to implementation
					}

					if ("graphicsCore" in this._deferred && this._implementation.setGraphicsCore) {
						this._implementation.setGraphicsCore(this._deferred.graphicsCore);
					}
					delete this._deferred.graphicsCore;

					if ("scene" in this._deferred && this._implementation.setScene) {
						this._implementation.setScene(this._deferred.scene);
					}
					delete this._deferred.scene;

					this._implementation.attachNodesPicked(function(event) {
						this.fireNodesPicked({
							picked: event.getParameter("picked")
						});
					}, this);

					this._implementation.attachNodeZoomed(function(event) {
						this.fireNodeZoomed({
							zoomed: event.getParameter("zoomed"),
							isZoomIn: event.getParameter("isZoomIn")
						});
					}, this);
				}

				this.invalidate();
			}
		} else {
			this._destroyImplementation();
			this.invalidate();
		}
		return this;
	};

	// Content connector handling ends.
	////////////////////////////////////////////////////////////////////////

	Viewport.prototype._onAfterUpdateViewStateManager = function() {
		if (this._implementation) {
			this._implementation.setViewStateManager(this._viewStateManager);
		}
	};

	Viewport.prototype._onBeforeClearViewStateManager = function() {
		if (this._implementation) {
			this._implementation.setViewStateManager(null);
		}
	};

	/**
	 * Calls activateView with view definition
	 *
	 * @param {sap.ui.vk.View} view object definition
	 * @returns {sap.ui.vk.Viewport} returns this
	 */
	Viewport.prototype.activateView = function(view) {
		if (this._implementation) {
			this._implementation.activateView(view);
			return this;
		} else {
			jQuery.sap.log.error("no implementation");
			return this;
		}
	};

	/**
	 * Returns viewport content as an image of desired size.
	 *
	 * @param {int} width Requested image width in pixels (allowed values 8 to 2048)
	 * @param {int} height Requested image height in pixels (allowed values 8 to 2048)
	 * @returns {string} Base64 encoded PNG image
	 */
	Viewport.prototype.getImage = function(width, height) {
		if (this._implementation && this._implementation.getImage) {
			return this._implementation.getImage(width, height);
		}

		return null;
	};

	ContentConnector.injectMethodsIntoClass(Viewport);
	ViewStateManager.injectMethodsIntoClass(Viewport);

	return Viewport;
});
