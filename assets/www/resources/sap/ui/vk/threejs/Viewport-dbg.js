/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
// Provides control sap.ui.vk.threejs.Viewport.
sap.ui.define([ "jquery.sap.global", "../library", "../ViewportBase", "sap/ui/core/ResizeHandler", "../Loco", "./thirdparty/three", "../ContentConnector", "../ViewStateManager", "./ViewportGestureHandler", "./OrthographicCamera", "./NodesTransitionHelper" ],
	function(jQuery, library, ViewportBase, ResizeHandler, Loco, threeJs, ContentConnector, ViewStateManager,
		ViewportGestureHandler, OrthographicCamera, NodesTransitionHelper) {
		"use strict";

		/**
		 *  Constructor for a new three js viewport.
		 *
		 * @class Provides a base class control for three js canvas.
		 *
		 * @public
		 * @author SAP SE
		 * @version 1.52.8
		 * @extends sap.ui.core.Control
		 * @alias sap.ui.vk.threejs.Viewport
		 * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
		 */
		var Viewport = ViewportBase.extend("sap.ui.vk.threejs.Viewport", /** @lends sap.ui.vk.threejs.Viewport.prototype  */ {
			metadata: {
				library: "sap.ui.vk",
				publicMethods: [
					"setScene",
					"getScene",
					"getRenderer", // need to find out if we want to expose threejs object directly or not BEGIN // END
					"hitTest",
					"tap",
					"render",
					"getImage",
					"setCamera"
				],

				properties: {
				}
			}
		});

		var basePrototype = Viewport.getMetadata().getParent().getClass().prototype;

		Viewport.prototype.init = function() {

			if (basePrototype.init) {
				basePrototype.init.call(this);
			}

			this._resizeListenerId = null;
			this._renderLoopRequestId = 0;
			this._renderLoopFunction = this._renderLoop.bind(this);
			this._shouldRenderFrame = true;
			this._clippingPlanes = [];

			this._renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
			this._renderer.setPixelRatio(window.devicePixelRatio);
			this._renderer.setSize(1, 1); // set dummy size, resize event will correct this later
			this._renderer.shadowMap.enabled = true;

			// this._camera = new sap.ui.vk.threejs.OrthographicCamera();
			this._camera = new sap.ui.vk.threejs.PerspectiveCamera();

			var backgroundVertexShader = [
				"varying float vPos;",
				"void main() {",
				"	gl_Position = vec4(position, 1.0);",
				"	vPos = position.y * -0.5 + 0.5;",
				"}"
			].join("\n");

			var backgroundFragmentShader = [
				"uniform vec4 topColor;",
				"uniform vec4 bottomColor;",
				"varying float vPos;",
				"void main() {",
				"	gl_FragColor = mix(topColor, bottomColor, vPos);",
				"}"
			].join("\n");

			var backgroundColorTop = new THREE.Vector4();
			var backgroundColorBottom = new THREE.Vector4();
			this._updateColor(backgroundColorTop, this.getBackgroundColorTop());
			this._updateColor(backgroundColorBottom, this.getBackgroundColorBottom());
			this._checkBackgroundColor();

			this._backgroundMaterial = new THREE.ShaderMaterial({
				uniforms: {
					topColor: { value: backgroundColorTop },
					bottomColor: { value: backgroundColorBottom }
				},
				vertexShader: backgroundVertexShader,
				fragmentShader: backgroundFragmentShader,
				side: THREE.DoubleSide,
				depthTest: false,
				depthWrite: false,
				blending: THREE.NoBlending
			});

			var backgroundGeometry = new THREE.Geometry();
			backgroundGeometry.vertices.push(
				new THREE.Vector3(-1, 1, 0),
				new THREE.Vector3(1, 1, 0),
				new THREE.Vector3(-1, -1, 0),
				new THREE.Vector3(1, -1, 0)
			);
			backgroundGeometry.faces.push(new THREE.Face3(0, 2, 1), new THREE.Face3(1, 2, 3));

			this._backgroundCamera = new THREE.Camera();
			this._backgroundScene = new THREE.Scene();
			this._backgroundScene.add(new THREE.Mesh(backgroundGeometry, this._backgroundMaterial));

			this._viewportGestureHandler = new ViewportGestureHandler(this);

			this._loco = new Loco();
			this._loco.addHandler(this._viewportGestureHandler);

			this._zoomedObject = null;
			this._nodesTransitionHelper = new NodesTransitionHelper();
			this._nodesTransitionHelper.setViewport(this);

			this._cdsLoader = null;
		};

		Viewport.prototype.exit = function() {
			this._loco.removeHandler(this._viewportGestureHandler);
			this._viewportGestureHandler.destroy();

			if (this._resizeListenerId) {
				ResizeHandler.deregister(this._resizeListenerId);
				this._resizeListenerId = null;
			}

			this._stopRenderLoop();

			this.setScene(null);
			this.setCamera(null);
			this._renderer = null;
			this._backgroundCamera = null;
			this._backgroundMaterial = null;
			this._backgroundScene = null;
			this._loco = null;
			this._viewportGestureHandler = null;

			if (this._cdsLoader) {
				this._cdsLoader.detachSceneUpdated(this._handleCdsSceneUpdate, this);
			}

			if (basePrototype.exit) {
				basePrototype.exit.call(this);
			}
		};

		/**
		 * Starts the render loop.
		 * @returns {sap.ui.vk.threejs.Viewport} <code>this</code> to allow method chaining.
		 * @private
		 */
		Viewport.prototype._startRenderLoop = function() {
			if (!this._renderLoopRequestId) {
				this._renderLoopRequestId = window.requestAnimationFrame(this._renderLoopFunction);
			}
			return this;
		};

		/**
		 * Stops the render loop.
		 * @returns {sap.ui.vk.threejs.Viewport} <code>this</code> to allow method chaining.
		 * @private
		 */
		Viewport.prototype._stopRenderLoop = function() {
			if (this._renderLoopRequestId) {
				window.cancelAnimationFrame(this._renderLoopRequestId);
				this._renderLoopRequestId = 0;
			}
			return this;
		};

		Viewport.prototype.setBackgroundColorTop = function(value) {
			basePrototype.setBackgroundColorTop.call(this, value);

			if (this._backgroundMaterial !== null){
				this._updateColor(this._backgroundMaterial.uniforms.topColor.value, value);
				this._checkBackgroundColor();
			}

			return this;
		};

		Viewport.prototype.setBackgroundColorBottom = function(value) {
			basePrototype.setBackgroundColorBottom.call(this, value);

			if (this._backgroundMaterial !== null){
				this._updateColor(this._backgroundMaterial.uniforms.bottomColor.value, value);
				this._checkBackgroundColor();
			}
			return this;
		};

		Viewport.prototype.setClippingPlanes = function(clippingPlanes) {
			this._clippingPlanes = clippingPlanes;
			return this;
		};

		Viewport.prototype.onBeforeRendering = function() {
			if (this._resizeListenerId) {
				ResizeHandler.deregister(this._resizeListenerId);
				this._resizeListenerId = null;
			}

			this._stopRenderLoop();
		};

		Viewport.prototype.onAfterRendering = function() {
			var domRef = this.getDomRef();
			domRef.appendChild(this._renderer.domElement);

			this._resizeListenerId = ResizeHandler.register(this, this._handleResize.bind(this));

			this._handleResize({
				size: {
					width: domRef.clientWidth,
					height: domRef.clientHeight
				}
			});

			this._startRenderLoop();
		};

		Viewport.prototype._handleResize = function(event) {

			if (!this._camera || !this._renderer) {
				// nothing to do
				return false;
			}

			var width = event.size.width;
			var height = event.size.height;

			if (this._camera) {
				this._camera.update(width, height);
			}

			this._renderer.setSize(width, height);

			this.fireResize({
				size: {
					width: width,
					height: height
				}
			});

			this.setShouldRenderFrame();

			return true;

		};

		/**
		* Attaches the scene to the Viewport for rendering.
		* @param {sap.ui.vk.threejs.Scene} scene The scene to attach to the Viewport.
		* @returns {sap.ui.vk.threejs.Viewport}<code>this</code> to allow method chaining.
		* @public
		*/
		Viewport.prototype.setScene = function(scene) {
			this._scene = scene;
			this._homeCamera = null; // remove previous home camera

			var nativeScene = this._scene ? this._scene.getSceneRef() : undefined;
			if (nativeScene) {

				// we create the scene and assume we have lights. Grab 1st one so we do 'CAD optimize light'
				// Basically light at your eye position
				var group;
				for (var i = 0; i < nativeScene.children.length; i++) {
					group = nativeScene.children[ i ];
					if (group.name === "DefaultLights" && group.children.length) {
						if (group.children[0] instanceof THREE.PointLight) {
							this._eyePointLight = group.children[0];
						}
					}
				}
			}

			this.setShouldRenderFrame();

			return this;
		};

		/**
		* Gets the Viewport Scene
		* @returns {sap.ui.vk.threejs.Scene} returns Scene
		* @public
		*/
		Viewport.prototype.getScene = function() {
			return this._scene;
		};

		/**
		* Sets the camera for the Viewport
		* @param {sap.ui.vk.Camera} camera parameter
		* @returns {sap.ui.vk.threejs.Viewport} <code>this</code> to allow method chaining.
		* @public
		*/
		Viewport.prototype.setCamera = function(camera) {

			if (basePrototype.setCamera) {
				basePrototype.setCamera.call(this, camera);
			}

			var cam = this.getCamera();
			if (cam && this._renderer) {
				var size = this._renderer.getSize();
				cam.update(size.width, size.height);

				if (!this._homeCamera && cam.getCameraRef()) {
					this._homeCamera = cam.getCameraRef().clone(); // set home camera
				}
			}

			this.setShouldRenderFrame();

			return this;
		};

		Viewport.prototype.getRenderer = function() {
			return this._renderer;
		};

		Viewport.prototype._getViewStateManagerThreeJS = function() {
			if (this._viewStateManager) {
				if (this._viewStateManager.constructor === sap.ui.vk.threejs.ViewStateManager) {
					return this._viewStateManager;
				}
				if (this._viewStateManager.constructor === sap.ui.vk.ViewStateManager &&
					this._viewStateManager._implementation.constructor === sap.ui.vk.threejs.ViewStateManager) {
					return this._viewStateManager._implementation;
				}
			}
			return null;
		};

		Viewport.prototype._updateBoundingBoxesTransformation = function() {
			var vsm = this._getViewStateManagerThreeJS();
			if (vsm) {
				vsm._updateBoundingBoxesTransformation();
			}
		};

		Viewport.prototype._updateBoundingBoxesIfNeeded = function() {
			var vsm = this._getViewStateManagerThreeJS();
			if (vsm) {
				vsm._updateBoundingBoxesIfNeeded();
			}
		};

		/**
		 * @param {THREE.Vector4} destColor The destination color object.
		 * @param {number} cssColor The sap.ui.core.CSSColor color to be decomposed into RGBA.
		 * @private
		 */
		Viewport.prototype._updateColor = function(destColor, cssColor) {
			var color = sap.ui.vk.cssColorToColor(cssColor);
			destColor.color = new THREE.Color(color.red / 255, color.green / 255, color.blue / 255);
			destColor.alpha = color.alpha;
			destColor.x = destColor.color.r * destColor.alpha;
			destColor.y = destColor.color.g * destColor.alpha;
			destColor.z = destColor.color.b * destColor.alpha;
			destColor.w = destColor.alpha;
		};

		Viewport.prototype._checkBackgroundColor = function() {
			var colorTop = this.getBackgroundColorTop();
			if (colorTop === this.getBackgroundColorBottom()) {
				if (this._backgroundColor === null) {
					this._backgroundColor = new THREE.Vector4();
				}

				this._updateColor(this._backgroundColor, colorTop);
			} else {
				this._backgroundColor = null;
			}

			this.setShouldRenderFrame();
		};

		Viewport.prototype._handleCdsSceneUpdate = function() {
			this.setShouldRenderFrame();
		};

		/**
		 * @returns {sap.ui.vk.threejs.Viewport} <code>this</code> to allow method chaining.
		 * @protected
		 */
		Viewport.prototype.setShouldRenderFrame = function() {
			this._shouldRenderFrame = true;
			return this;
		};

		/**
		 * @returns {bool} It returns <code>true</code> or <code>false</code> whether the frame should be rendered or not.
		 * @experimental
		*/
		Viewport.prototype.shouldRenderFrame = function() {
			return this._shouldRenderFrame;
		};

		/**
		* Performs a screen-space hit test and gets the hit node reference, it must be called between beginGesture() and endGesture()
		*
		* @param {int} x: x coordinate in viewport to perform hit test
		* @param {int} y: y coordinate in viewport to perform hit test
		* @returns {object} object under the viewport coordinates (x, y).
		* @experimental
		*/
		Viewport.prototype.hitTest = function(x, y) {
			var nativeScene = this._scene ? this._scene.getSceneRef() : undefined;
			var nativeCamera = this._camera ? this._camera.getCameraRef() : undefined;
			if (!nativeCamera || !nativeScene) {
				return null;
			}

			var element = this._renderer.domElement;
			var mouse = new THREE.Vector2((x  - element.clientLeft) / element.clientWidth * 2 - 1,
				(element.clientTop - y) / element.clientHeight * 2 + 1);
			var raycaster = new THREE.Raycaster();

			raycaster.setFromCamera(mouse, nativeCamera);
			var intersects = raycaster.intersectObjects(nativeScene.children, true);

			if (intersects && intersects.length) {
				return intersects[ 0 ];
			}

			return null;
		};

		/**
		 * Executes a click or tap gesture.
		 *
		 * @param {int} x The tap gesture's x-coordinate.
		 * @param {int} y The tap gesture's y-coordinate.
		 * @param {boolean} isDoubleClick Indicates whether the tap gesture should be interpreted as a double-click. A value of <code>true</code> indicates a double-click gesture, and <code>false</code> indicates a single click gesture.
		 * @returns {sap.ui.vk.threejs.Viewport} this
		 */
		Viewport.prototype.tap = function(x, y, isDoubleClick) {

			if (!isDoubleClick) {
				if (this._viewStateManager) {
					var hit = this.hitTest(x, y); // NB: pass (x, y) in CSS pixels, hitTest will convert them to device pixels.

					var node = hit && hit.object;

					var parameters = {
						picked: node ? [ node ] : []
					};
					this.fireNodesPicked(parameters);

					if (this.getSelectionMode() === sap.ui.vk.SelectionMode.Exclusive) {
						this.exclusiveSelectionHandler(parameters.picked);
					} else if (this.getSelectionMode() === sap.ui.vk.SelectionMode.Sticky) {
						this.stickySelectionHandler(parameters.picked);
					}
				}
			} else {
				var hitForDB = this.hitTest(x, y);

				if (hitForDB && (this._zoomedObject === null || this._zoomedObject !== hitForDB.object)) {// doubleclick on new object
					this._zoomedObject = hitForDB.object;
					this._viewportGestureHandler.zoomObject(this._zoomedObject, true);
				} else { // doubleclick on previously doubleclicked object, or on empty space
					this._viewportGestureHandler.zoomObject(this._zoomedObject, false);
					this._zoomedObject = null;
				}
			}
			return this;
		};

		////////////////////////////////////////////////////////////////////////
		// Keyboard handling begins.

		var offscreenPosition = { x: -2, y: -2 };
		var rotateDelta = 2;
		var panDelta = 5;

		[
			{ key: "left", dx: -rotateDelta, dy: 0 },
			{ key: "right", dx: +rotateDelta, dy: 0 },
			{ key: "up", dx: 0, dy: -rotateDelta },
			{ key: "down", dx: 0, dy: +rotateDelta }
		].forEach(function(item) {
			Viewport.prototype[ "onsap" + item.key ] = function(event) {
				var cameraController = this._viewportGestureHandler._cameraController;
				cameraController.beginGesture(offscreenPosition.x, offscreenPosition.y);
				cameraController.rotate(item.dx, item.dy, true);
				cameraController.endGesture();
				this.setShouldRenderFrame();
				event.preventDefault();
				event.stopPropagation();
			};
		});

		[
			{ key: "left", dx: -panDelta, dy: 0 },
			{ key: "right", dx: +panDelta, dy: 0 },
			{ key: "up", dx: 0, dy: -panDelta },
			{ key: "down", dx: 0, dy: +panDelta }
		].forEach(function(item) {
			Viewport.prototype[ "onsap" + item.key + "modifiers" ] = function(event) {
				if (event.shiftKey && !(event.ctrlKey || event.altKey || event.metaKey)) {
					var cameraController = this._viewportGestureHandler._cameraController;
					cameraController.beginGesture(offscreenPosition.x, offscreenPosition.y);
					cameraController.pan(item.dx, item.dy);
					cameraController.endGesture();
					this.setShouldRenderFrame();
					event.preventDefault();
					event.stopPropagation();
				}
			};
		});

		[
			{ key: "minus", d: 0.98 },
			{ key: "plus", d: 1.02 }
		].forEach(function(item) {
			Viewport.prototype[ "onsap" + item.key ] = function(event) {
				var cameraController = this._viewportGestureHandler._cameraController;
				cameraController.beginGesture(this.$().width() / 2, this.$().height() / 2);
				cameraController.zoom(item.d);
				cameraController.endGesture();
				this.setShouldRenderFrame();
				event.preventDefault();
				event.stopPropagation();
			};
		});

		// Keyboard handling ends.
		////////////////////////////////////////////////////////////////////////

		Viewport.prototype._handleVisibilityChanged =
		Viewport.prototype._handleSelectionChanged =
		Viewport.prototype._handleOpacityChanged =
		Viewport.prototype._handleTintColorChanged =
		Viewport.prototype._handleHighlightColorChanged =
			function(event) {
				this.setShouldRenderFrame();
			};

		Viewport.prototype._renderLoop = function() {
			if (!this._renderer || !this.getDomRef()) {// break render loop
				this._renderLoopRequestId = 0;
				return;
			}

			if (this._viewportGestureHandler) {
				this._viewportGestureHandler.animateCameraUpdate();
			}

			if (this._nodesTransitionHelper){
				this._nodesTransitionHelper.displayNodesMoving();
			}

			// move light to eye position
			var nativeCamera = this.getCamera() ? this.getCamera().getCameraRef() : undefined;
			if (this._eyePointLight && nativeCamera) {
				this._eyePointLight.position.copy(nativeCamera.position);
			}

			// onBefore Rendering callback?

			if (this._shouldRenderFrame) {
				this._shouldRenderFrame = false;
				this.render();
			}

			this._renderLoopRequestId = window.requestAnimationFrame(this._renderLoopFunction); // request next frame
		};

		Viewport.prototype.render = function() {
			if (!this._renderer) {
				return;
			}

			this._renderer.autoClear = this._backgroundColor != null;
			if (this._renderer.autoClear) {
				this._renderer.setClearColor(this._backgroundColor.color, this._backgroundColor.alpha);
			} else {
				this._renderer.render(this._backgroundScene, this._backgroundCamera);
			}

			var nativeScene = this._scene ? this._scene.getSceneRef() : null;
			var nativeCamera = this._camera ? this._camera.getCameraRef() : null;

			if (!nativeScene || !nativeCamera) {
				return;
			}

			var tools = this.getTools();
			var i, tool, gizmo;

			if (this._camera.getUsingDefaultClipPlanes() || (nativeCamera.isOrthographicCamera && this._camera.getZoomNeedRecalculate())) {
				var boundingBox = this._scene._computeBoundingBox();
				if (!boundingBox.isEmpty()) {
					if (this._camera.getUsingDefaultClipPlanes()) {
						this._camera.adjustClipPlanes(boundingBox);

						for (i = 0; i < tools.length; i++) { // loop over all oTools
							tool = sap.ui.getCore().byId(tools[ i ]); // get control for associated control
							gizmo = tool.getGizmoForContainer(this);
							if (gizmo && gizmo.adjustCameraClipPlanes) {
								gizmo.adjustCameraClipPlanes(this._camera, boundingBox);
							}
						}
					}

					if (nativeCamera.isOrthographicCamera && this._camera.getZoomNeedRecalculate()) {
						this._camera.adjustZoom(boundingBox);
					}
				}
			}

			this._renderer.clippingPlanes = this._clippingPlanes;
			this._renderer.render(nativeScene, nativeCamera);
			this._renderer.clippingPlanes = [];
			this._renderer.autoClear = false;

			var vsm = this._getViewStateManagerThreeJS();
			if (vsm) {
				var boundingBoxesScene = vsm._boundingBoxesScene;
				if (boundingBoxesScene) {
					this._renderer.render(boundingBoxesScene, nativeCamera);
				}
			}

			for (i = 0; i < tools.length; i++) { // loop over all oTools
				tool = sap.ui.getCore().byId(tools[ i ]); // get control for associated control
				gizmo = tool.getGizmoForContainer(this);
				if (gizmo && gizmo.render) {
					gizmo.render(this);
				}
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
			if (this._scene === null) {
				return null;
			}

			if (width < 8) {
				width = 8;
			}

			if (height < 8) {
				height = 8;
			}

			if (width > 2048) {
				width = 2048;
			}

			if (height > 2048) {
				height = 2048;
			}

			var renderer = new THREE.WebGLRenderer({
				preserveDrawingBuffer: true
			});
			renderer.setSize(width, height);
			renderer.setClearColor("white", 1);
			document.body.appendChild(renderer.domElement);

			// Don't mess with existing camera, create a clone
			var camera = this._camera.getCameraRef().clone();
			var aspect = width / height;
			if (camera.isOrthographicCamera) {
				var w = camera.right - camera.left;
				var h = camera.top - camera.bottom;
				if (w > h) {
					camera.top = w / aspect / 2;
					camera.bottom = -w / aspect / 2;
				} else {
					camera.left = -h * aspect / 2;
					camera.right = h * aspect / 2;
				}
			} else {
				camera.aspect = aspect;
			}
			camera.updateProjectionMatrix();

			renderer.render(this._scene.getSceneRef(), camera);
			var imageData = renderer.getContext().canvas.toDataURL();
			document.body.removeChild(renderer.domElement);

			return imageData;
		};

		Viewport.prototype._setContent = function(content) {
			var scene;
			var camera;

			if (content) {
				scene = content.scene;
				if (!(scene instanceof sap.ui.vk.threejs.Scene)) {
					scene = null;
				}
				camera = content.camera;
				if (!(camera instanceof sap.ui.vk.threejs.OrthographicCamera || camera instanceof sap.ui.vk.threejs.PerspectiveCamera)) {
					camera = null;
				}

				// if cds loaded this content, we need to attach some event for refreshing
				// this is because cds can update content after the scene is loaded
				// as cds streaming information from the server
				if (content.loaders) {
					for (var i = 0; i < content.loaders.length; i++) {
						if (content.loaders[i] instanceof sap.ui.vk.threejs.ContentDeliveryService) {
							this._cdsLoader = content.loaders[i]; // grab 1st one as we can only have one cds with scene atm
							this._cdsLoader.attachSceneUpdated(this._handleCdsSceneUpdate, this);
							break;
						}
					}
				}
			}

			this.setScene(scene);

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
			this.setScene(null);
		};

		Viewport.prototype._handleContentReplaced = function(event) {
			var content = event.getParameter("newContent");
			this._setContent(content);

		};

		Viewport.prototype._onAfterUpdateViewStateManager = function() {
		};

		Viewport.prototype._onBeforeClearViewStateManager = function() {
		};

		ContentConnector.injectMethodsIntoClass(Viewport);
		ViewStateManager.injectMethodsIntoClass(Viewport);

		/**
		* Activates the view based on view object passed
		* @param {sap.ui.vk.View} view view object definition
		* @returns {sap.ui.vk.threejs.Viewport} returns this
		* @public
		* @since 1.52.0
		*/
		Viewport.prototype.activateView = function(view) {
			var camera = view.getCameraInfo();
			var newCamera;
			if (camera) {
				if (camera.type === "PerspectiveCamera") {
					newCamera = new sap.ui.vk.threejs.PerspectiveCamera();
					newCamera.setFov(camera.fov);
				}
				if (camera.type === "OrthographicCamera") {
					newCamera = new sap.ui.vk.threejs.OrthographicCamera();
					newCamera.setZoomFactor(camera.zoomFactor);
					if (camera.zoomNeedRecalculate){
						newCamera.setZoomNeedRecalculate(true);
					}
				}
				newCamera.setNearClipPlane(camera.nearClipPlane);
				newCamera.setFarClipPlane(camera.farClipPlane);
				newCamera.setUpDirection(camera.upDirection);
				newCamera.setPosition(camera.position);
				newCamera.setTargetDirection(camera.targetDirection);

				newCamera.setUsingDefaultClipPlanes(camera.usingDefaultClipPlanes);

				this._viewportGestureHandler.prepareForCameraUpdateAnimation(camera.type);
				this.setCamera(newCamera);
				this._viewportGestureHandler.startAnimatingCameraUpdate(500);
			}

			function arrayToMatrixThree(array) {
				return new THREE.Matrix4().set(array[0], array[1], array[2], array[3], array[4], array[5], array[6], array[7], array[8], array[9], array[10], array[11], 0, 0, 0, 1);
			}

			var nodeHierarchy = this._viewStateManager.getNodeHierarchy();

			var nodeInfo = view.getNodeInfos();



			if (nodeInfo) {
				this._nodesTransitionHelper.clear();
				nodeInfo.forEach(function(node) {
					if (node.target === null) {
						return;
					}

					function equalMatrices(matrix1, matrix2, error){
						for (var ei = 0; ei < matrix1.elements.length; ei++){
							if (Math.abs(matrix1.elements[ei] - matrix2.elements[ei]) > error){
								return false;
							}
						}
						return true;
					}

					if (node.transform) {
						var newMatrix = arrayToMatrixThree(node.transform);
						if (!equalMatrices(newMatrix, node.target.matrix, 1e-6)){
							var noteProxy = nodeHierarchy.createNodeProxy(node.target);
							this._nodesTransitionHelper.setNodeForDisplay(noteProxy);
							newMatrix.decompose(node.target.position, node.target.quaternion, node.target.scale);
							node.target.updateMatrix();
						}
					}



				}.bind(this));
				var nodeVisible = [];
				var nodeInvisible = [];

				for (var nfc = 0; nfc < nodeInfo.length; nfc++){

					if (nodeInfo[nfc].visible) {
						nodeVisible.push(nodeInfo[nfc].target);
					} else {
						nodeInvisible.push(nodeInfo[nfc].target);
					}
				}
				this._viewStateManager.setVisibilityState(nodeVisible, true, false);
				this._viewStateManager.setVisibilityState(nodeInvisible, false, false);

				this._nodesTransitionHelper.startDisplay(500);
			}

			return this;
		};

		/**
		 * Queues a command for execution during the rendering cycle. All gesture operations should be called using this method.
		 *
		 * @param {function} command The command to be executed.
		 * @returns {sap.ui.vk.threejs.Viewport} returns this
		 * @public
		 */
		Viewport.prototype.queueCommand = function(command) {
			if (this instanceof sap.ui.vk.threejs.Viewport) {
				command();
			}
			return this;
		};

		/**
		 * Gets position and size of the viewport square.
		 * The information can be used for making calculations when restoring Redlining elements.
		 * @returns {object} The information in this object:
		 *   <ul>
		 *     <li><b>left</b> - The x coordinate of the top-left corner of the square.</li>
		 *     <li><b>top</b> - The y coordinate of the top-left corner of the square.</li>
		 *     <li><b>sideLength</b> - The length of the square.</li>
		 *   </ul>
		 * @public
		 */
		Viewport.prototype.getOutputSize = function() {
			var boundingClientRect = this.getDomRef().getBoundingClientRect();
			var viewportWidth = boundingClientRect.width;
			var viewportHeight = boundingClientRect.height;
			var relevantDimension;

			relevantDimension = Math.min(viewportWidth, viewportHeight);

			return {
				 left: (viewportWidth - relevantDimension) / 2,
				 top: (viewportHeight - relevantDimension) / 2,
				 sideLength: relevantDimension
			};
		};

		return Viewport;
	});
