/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides the OrthographicCamera class.
sap.ui.define([
    "jquery.sap.global", "../OrthographicCamera", "./thirdparty/three"
], function(jQuery, OrthographicCamera, threeJs) {
    "use strict";

	/**
	 * Constructor for a new OrthographicCamera.
	 *
	 *
	 * @class Provides the interface for the camera.
	 *
	 *
	 * @public
	 * @author SAP SE
	 * @version 1.52.8
	 * @extends sap.ui.base.Object
	 * @alias sap.ui.vk.threejs.OrthographicCamera
	 * @experimental Since 1.52.0 This class is experimental and might be modified or removed in future versions.
	 */
    var ThreeJsOrthographicCamera = OrthographicCamera.extend("sap.ui.vk.threejs.OrthographicCamera", /** @lends sap.ui.vk.three.OrthographicCamera.prototype */ {
        metadata: {
            publicMethods: [
                "update"
            ],
            properties: {
            }
        }
    });

    var basePrototype = OrthographicCamera.getMetadata().getParent().getClass().prototype;

    ThreeJsOrthographicCamera.prototype.init = function() {

        if (basePrototype.init) {
            basePrototype.init.call(this);
        }

        var near = 1;
        var far = 200000;

        var dummyWidth = 1; // resize event will correct this later
        var dummyHeight = 1;
        this._nativeCamera = new THREE.OrthographicCamera(dummyWidth / -2, dummyWidth / 2, dummyHeight / 2, dummyHeight / -2, near, far);

        this._nativeCamera.position.set(0, 0, 10000);
        this._nativeCamera.zoom = 10;

        this.setUsingDefaultClipPlanes(true);
    };

    /**
	 * Updates the camera properties with width and height of viewport
	 *
	 * @param {float} width width of the viewport
     * @param {float} height height of the viewport
     * @public
	 */
    ThreeJsOrthographicCamera.prototype.update = function(width, height) {
        this.setLeft(width / -2);
        this.setRight(width / 2);
        this.setTop(height / 2);
        this.setBottom(height / -2);

        this._nativeCamera.updateProjectionMatrix();
    };

    ThreeJsOrthographicCamera.prototype.exit = function() {

        if (basePrototype.exit) {
            basePrototype.exit.call(this);
        }
        this._nativeCamera = null;
    };



    ThreeJsOrthographicCamera.prototype.getLeft = function() {
        return this._nativeCamera.left;
    };

    ThreeJsOrthographicCamera.prototype.setLeft = function(val) {
        this._nativeCamera.left = val;
        return this;
    };

    ThreeJsOrthographicCamera.prototype.getRight = function() {
        return this._nativeCamera.right;
    };

    ThreeJsOrthographicCamera.prototype.setRight = function(val) {
        this._nativeCamera.right = val;
        return this;
    };

    ThreeJsOrthographicCamera.prototype.getTop = function() {
        return this._nativeCamera.top;
    };

    ThreeJsOrthographicCamera.prototype.setTop = function(val) {
        this._nativeCamera.top = val;
        return this;
    };

    ThreeJsOrthographicCamera.prototype.getBottom = function() {
        return this._nativeCamera.bottom;
    };

    ThreeJsOrthographicCamera.prototype.setBottom = function(val) {
        this._nativeCamera.bottom = val;
        return this;
    };

    ThreeJsOrthographicCamera.prototype.getZoomFactor = function() {
        return this._nativeCamera.zoom;
    };

    ThreeJsOrthographicCamera.prototype.setZoomFactor = function(val) {
        this._nativeCamera.zoom = val;
        return this;
    };

    // base class - camera properties..
    ThreeJsOrthographicCamera.prototype.getCameraRef = function() {
        return this._nativeCamera;
    };

    ThreeJsOrthographicCamera.prototype.setCameraRef = function(camRef) {
        this._nativeCamera = camRef;
        return this;
    };

    ThreeJsOrthographicCamera.prototype.getNearClipPlane = function() {
        return this._nativeCamera.near;
    };

    ThreeJsOrthographicCamera.prototype.setNearClipPlane = function(val) {
        this._nativeCamera.near = val;
        this.setUsingDefaultClipPlanes(false);
        return this;
    };

    ThreeJsOrthographicCamera.prototype.getFarClipPlane = function() {
        return this._nativeCamera.far;
    };

    ThreeJsOrthographicCamera.prototype.setFarClipPlane = function(val) {
        this._nativeCamera.far = val;
        this.setUsingDefaultClipPlanes(false);
        return this;
    };

    ThreeJsOrthographicCamera.prototype.getPosition = function() {
        return this._nativeCamera.position.toArray();
    };

    ThreeJsOrthographicCamera.prototype.setPosition = function(vals) {
        this._nativeCamera.position.fromArray(vals);
        return this;
    };

    ThreeJsOrthographicCamera.prototype.getUpDirection = function() {
        return this._nativeCamera.up.toArray();
    };

    ThreeJsOrthographicCamera.prototype.setUpDirection = function(vals) {
        this._nativeCamera.up.fromArray(vals);
        return this;
    };

    ThreeJsOrthographicCamera.prototype.getTargetDirection = function() {
        return this._nativeCamera.getWorldDirection().toArray();
    };

    ThreeJsOrthographicCamera.prototype.setTargetDirection = function(vals) {
        var target = new THREE.Vector3().fromArray(vals);
        target.add(this._nativeCamera.position);

        this._nativeCamera.lookAt(target);
        return this;
    };

    ThreeJsOrthographicCamera.prototype.setUsingDefaultClipPlanes = function(val) {
        this._nativeCamera.userData.usingDefaultClipPlanes = val;
        return this;
    };

    ThreeJsOrthographicCamera.prototype.getUsingDefaultClipPlanes = function() {
        return this._nativeCamera.userData.usingDefaultClipPlanes;
    };

    /**
	 * Adjust the camera near and far clipping planes to include the entire specified bounding box
	 *
	 * @param {THREE.Box3} boundingBox Bounding box
     * @returns {sap.ui.vk.threejs.OrthographicCamera} this
     * @public
	 */
    ThreeJsOrthographicCamera.prototype.adjustClipPlanes = function(boundingBox) {
        var camera = this._nativeCamera;
        camera.updateMatrixWorld();
        camera.matrixWorldInverse.getInverse(camera.matrixWorld);
        boundingBox = boundingBox.clone().applyMatrix4(camera.matrixWorldInverse);

        camera.near = -boundingBox.max.z;
        camera.far = -boundingBox.min.z;

        var epsilon = Math.max((camera.far - camera.near) * 0.0025, 0.001);
        camera.near -= epsilon;
        camera.far += epsilon;

        // console.log(camera.near, camera.far, epsilon);
        camera.updateProjectionMatrix();
        return this;
    };

    ThreeJsOrthographicCamera.prototype.getZoomNeedRecalculate = function() {
        if (this._nativeCamera.userData) {
            return this._nativeCamera.userData.zoomNeedRecalculate;
        }
    };

    ThreeJsOrthographicCamera.prototype.setZoomNeedRecalculate = function(val) {
        this._nativeCamera.userData.zoomNeedRecalculate = val;
    };

    /**
	 * Adjust the camera zoom to include the entire specified bounding box
	 *
	 * @param {THREE.Box3} boundingBox Bounding box
     * @returns {sap.ui.vk.threejs.OrthographicCamera} this
     * @public
	 */
    ThreeJsOrthographicCamera.prototype.adjustZoom = function(boundingBox) {
        var camera = this._nativeCamera;
        camera.updateMatrixWorld();
        camera.matrixWorldInverse.getInverse(camera.matrixWorld);
        boundingBox = boundingBox.clone().applyMatrix4(camera.matrixWorldInverse);

        camera.zoom = 1 / Math.max(boundingBox.min.x / camera.left, boundingBox.max.y / camera.top,
            boundingBox.max.x / camera.right, boundingBox.min.y / camera.bottom);
        camera.updateProjectionMatrix();
        this.setZoomNeedRecalculate(false);
        return this;
    };

    return OrthographicCamera;
});
