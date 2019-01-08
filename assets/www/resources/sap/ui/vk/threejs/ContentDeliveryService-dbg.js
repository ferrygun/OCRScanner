/*!
* SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
*/

/* global THREE, Matai */

// Provides control sap.ui.vk.threejs.ContentDeliveryService.
sap.ui.define([
	"jquery.sap.global", "sap/ui/base/ManagedObject", "./thirdparty/three", "sap/ui/vk/threejs/thirdparty/matai", "./PerspectiveCamera", "./OrthographicCamera", "sap/ui/vk/View"
], function(jQuery, ManagedObject, threeJs, mataiDummy, PerspectiveCamera, OrthographicCamera, View) {

	"use strict";

	/**
 	 *  Constructor for a new ContentDeliveryService.
 	 *
 	 * @class Provides a class to communicate with content delivery service.
 	 *
	 * @author SAP SE
	 * @version 1.52.8
	 * @extends sap.ui.core.ManagedObject
	 * @alias sap.ui.vk.threejs.ContentDeliveryService
	 * @experimental Since 1.51.0 This class is experimental and might be modified or removed in future versions.
	 */
	var ContentDeliveryService = ManagedObject.extend("sap.ui.vk.threejs.ContentDeliveryService", {
		metadata: {
			publicMethods: [
				"initUrl",
				"load",
				"update",
				"loadView"
			],

			events: {
				cameraChanged: {
					parameters: {
						sceneId: {
							type: "string"
						},
						camera: {
							type: "any"
						}
					},
					enableEventBubbling: true
				},
				sceneUpdated: {
					parameters: {
						sceneId: {
							type: "string"
						}
					},
					enableEventBubbling: true
				},
				errorReported: {
					paramters: {
						error: {
							type: "any"
						}
					}
				}
			}
		}
	});

	var basePrototype = ContentDeliveryService.getMetadata().getParent().getClass().prototype;
	ContentDeliveryService.prototype.init = function() {
		if (basePrototype.init) {
			basePrototype.init.call(this);
		}
		this._loader = null;

		// note we keep transientRoot in the map for reference.
		// we do not increase reference counter for resources (e.g geometry)
		// as transient ones will be removed anyway
		// We keep the original tree with userData in '_transientSceneMap'. and give cloned ones
		// when requested.
		// For now, we will keep the transient scene reference for the life time of
		// contentDeliveryService (mataiLoader)
		this._transientSceneMap = new Map(); // keeps transient scene. Typically POIs and symbols.

	};

	/**
 	 * Sets url of content delivery service server.
 	 * @param {string} url Url of content delievery service. Protocols are http, https, ws, wss.
 	 * @returns {bool} returns false when fails to initialise.
 	 */
	ContentDeliveryService.prototype.initUrl = function(url) {
		var that = this;
		var connection;
		var connectionInitPromise;

		if (!that._loader) {
			this._loader = new Matai.Loader();
		}

		var promiseList = [];
		if (jQuery.sap.startsWith(url, "ws")) {

			connection = new Matai.Loader.WebSocketConnection();
			connectionInitPromise = connection.init(url).then(function() {
				that._loader.init(connection);
			}).catch(function(error) {
				that._loader = null;
				throw error;
			});

			promiseList.push(connectionInitPromise);
		} else if (jQuery.sap.startsWith(url, "http")) {

			connection = new Matai.Loader.HttpConnection();
			connectionInitPromise = connection.init(url).then(function() {
				that._loader.init(connection);
			});

			promiseList.push(connectionInitPromise);
		} else {
			that._loader = null;
			promiseList.push(Promise.reject("Content Delivery Service only allows http and websocket connection"));
		}
		return Promise.all(promiseList);
	};

	function createCameraWithThreeJsCamera(threeJsCamera) {
		if (!threeJsCamera) {
			return null;
		}

		// internally we create cameras directly.
		// in public API, users have to create camera from contentManager to be consistent with DVL
		var camera;
		if (threeJsCamera.isOrthographicCamera) {
			camera = new sap.ui.vk.threejs.OrthographicCamera();
		} else if (threeJsCamera.isPerspectiveCamera) {
			camera = new sap.ui.vk.threejs.PerspectiveCamera();
		}
		camera.setCameraRef(threeJsCamera);

		camera.setUsingDefaultClipPlanes(true); // always use auto as specific near far always cause trouble

		if (threeJsCamera.cameraInfo && threeJsCamera.cameraInfo.zoom === -1){
			camera.setZoomNeedRecalculate(true);
		}

		return camera;
	}

	ContentDeliveryService.prototype._createLoadParam = function(resolve, reject, source, parentNode, contentResource) {
		var that = this;
		var initialCamera;

		var sceneLoaded = false;

		var isLoggerEnabled = false;
		if (source.logger === true) {
			isLoggerEnabled = true;
		}

		var contextParams = {
			root: parentNode,
			onActiveCamera: function(newCam) {

				var isInitialCam = false;
				var state = that._loader.getState();
				if (state) {
					var context = state.contextMap.get(source.veid);
					if (context && context.phase < 2) { // 2 -> FinishedMesh
						// CDS is still getting the model
						initialCamera = createCameraWithThreeJsCamera(newCam);
						isInitialCam = true;
					}
				}

				if (!isInitialCam) {
					that.fireCameraChanged({
						sceneId: source.veid,
						camera: createCameraWithThreeJsCamera(newCam)
					});
				}
			},
			onSetGeometry: function() {
				that.fireSceneUpdated({
					sceneId: source.veid
				});
			},
			onInitialSceneFinished: function() {
				sceneLoaded = true;
				resolve({
					node: parentNode,
					camera: initialCamera,
					contentResource: contentResource,
					loader: that // passing cds as loader
				});
			},
			activateView: source.activateView,
			logger: isLoggerEnabled,
			onError: function(error) {
				var reason;
				if (error.errorText) {
					reason = error.errorText;
				} else if (error.error) {
					reason = error.error;
				} else if (error.reason) {
					reason = error.reason;
				} else {
					reason = "failed to load: unknown reason";
				}

				if (!sceneLoaded) {
					reject(reason);
				} else {
					that.fireErrorReported(error);
				}

			}
		};

		return contextParams;
	};

	ContentDeliveryService.prototype.load = function(parentNode, contentResource) {
		var that = this;

		return new Promise(function(resolve, reject) {
			var source;

			try {
				source = JSON.parse(contentResource.getSource());
			} catch (e) {
				reject("ContentDeliveryService.load - invalid json: contentResource");
				return;
			}

			if (!source || !source.veid) {
				reject("url or veid not specified");
				return;
			}

			that.initUrl(source.url).then(function() {
				var contextParams = that._createLoadParam(resolve, reject, source, parentNode, contentResource);
				that._loader.request(source.veid, contextParams); // .request ends
			})
			.catch(function(reason){
				reject(reason);
			}); // when we load from default loader we might not have initialised it yet

		}); // promise ends
	};

	ContentDeliveryService.prototype.getState = function() {
		if (this._loader) {
			return this._loader.getState();
		}
		return null;
	};

	// as threejs node which is a tree node can be dropped by nodeHierarchy.removeNode, we need to update it to cds
	ContentDeliveryService.prototype.decrementResouceCountersForDeletedTreeNode = function(sid) {
		var state = this.getState();
		if (state) {

			state.contextMap.forEach(function(value, key){
				if (value.treeNodeMap.has(sid)) {
					Matai.decrementResouceCountersForDeletedTreeNode(state, value, sid);
				}
			});
		}
	};

	// We want to use this for light scene such as POIs and symbols
	// This is mainly used by authoring and whoever loaded transient scene should remove it when done with it.

	/**
	 * Add the transient scene to target parent.
	 * This method returns a promise which is resolves when we get all geometries for simplicity for now.
	 * @param {string} sceneVeId target scene id to update.
	 * @param {noderef} parentNodeRef parent nodeRef where this transient scene will be added
 	 * @returns {Promise} returns promise which gives nodeRef for transient scene.
 	 */
	ContentDeliveryService.prototype.loadTransientScene = function(sceneVeId, parentNodeRef) {
		var that = this;

		return new Promise(function(resolve, reject) {

			if (!sceneVeId || !parentNodeRef) {
				reject("invalid arguments");
				return;
			}

			if (that._transientSceneMap.has(sceneVeId)) {
				// if we already loaded this transientScene, just clone it
				var cloned = that._transientSceneMap.get(sceneVeId).clone(); // note this is cloned

				parentNodeRef.add(cloned);
				resolve({
					nodeRef: cloned
				});
				return;
			}

			if (!that._loader) { // check again
				reject("ContentDeliveryService is not initialised");
				return;
			}

			var transientRoot = new THREE.Object3D();
			transientRoot.name = "transient";

			var contextParams = {
				root: transientRoot,
				onSceneCompleted: function() {
					that._transientSceneMap.set(sceneVeId, transientRoot);

					var cloned = transientRoot.clone(); // note this is cloned.
					parentNodeRef.add(cloned);

					resolve({
						nodeRef: cloned
					});
				}
			};

			that._loader.request(sceneVeId, contextParams); // .request ends

		}); // promise ends
	};

	/**
 	 * Update contents from Content delivery service
	 * @param {string} sceneId target scene id to update.
	 * @param {string[]} sids target sids to update.
	 * @param {string} viewId optional. Associated view if exists
 	 * @returns {Promise} returns promise of content deliver service update
 	 */
	ContentDeliveryService.prototype.update = function(sceneId, sids, viewId) {
		if (!this._loader) {
			return Promise.reject("ContentDeliveryService is not initialised");
		} else {
			return Promise.resolve(this._loader.update(sceneId, sids, viewId));
		}
	};

	ContentDeliveryService.prototype.exit = function() {
		if (basePrototype.exit) {
			basePrototype.exit.call(this);
		}
		if (this._loader) {
			this._loader.dispose();
			this._loader = null;
		}

		this._transientSceneMap = null;
	};

	/**
 	 * Gets view object definition
	 * @param {string} sceneId target scene id
	 * @param {string} viewId view id
	 * @param {string} type type of view. (static or dynamic) - default static
 	 * @returns {sap.ui.vk.View} returns View object with definition
 	 */
	ContentDeliveryService.prototype.loadView = function(sceneId, viewId, type) {

		if (typeof type === "undefined") {
			type = "static";
		}

		return this._loader.requestView(sceneId, type, viewId).then(function(viewInfo) {



		var myView = new sap.ui.vk.View({
			name: viewInfo.name,
			nodeInfos: viewInfo.viewNodes
		});

		if (viewInfo.camera) {

			var defaultClipPlanes = true; // as explicit near far values cause more trouble than being efficient
										  // we set it to true all the time.

			var recalculateZoom = false;
			if (viewInfo.camera.cameraInfo && viewInfo.camera.cameraInfo.zoom === -1){
				recalculateZoom = true;
			}

			if (viewInfo.camera.type === "PerspectiveCamera") {
				myView.setCameraInfo({
					type: viewInfo.camera.type,
					fov: viewInfo.camera.cameraInfo.fov * 180 / Math.PI,
					position: viewInfo.camera.position.toArray(),
					nearClipPlane: viewInfo.camera.near,
					farClipPlane: viewInfo.camera.far,
					upDirection: viewInfo.camera.up.toArray(),
					targetDirection: viewInfo.camera.getWorldDirection().toArray(),
					usingDefaultClipPlanes: defaultClipPlanes
				});
			}

			if (viewInfo.camera.type === "OrthographicCamera") {
				myView.setCameraInfo({
					type: viewInfo.camera.type,
					zoomFactor: viewInfo.camera.zoom,
					position: viewInfo.camera.position.toArray(),
					nearClipPlane: viewInfo.camera.near,
					farClipPlane: viewInfo.camera.far,
					upDirection: viewInfo.camera.up.toArray(),
					targetDirection: viewInfo.camera.getWorldDirection().toArray(),
					usingDefaultClipPlanes: defaultClipPlanes,
					zoomNeedRecalculate: recalculateZoom
				});
			}
		}
		return myView;
		})
		.catch(function(error) {
			jQuery.sap.log.error(error);
			return null;
		});
	};

	ContentDeliveryService.prototype.printLogTokens = function() {
		if (this._loader) {
			this._loader.printLogTokens();
			return true;
		} else {
			return false;
		}
	};

	return ContentDeliveryService;
});
