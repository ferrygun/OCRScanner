/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides the PerspectiveCamera class.
sap.ui.define([
    "jquery.sap.global", "../PerspectiveCamera", "./thirdparty/three"
], function(jQuery, PerspectiveCamera, threeJs) {
    "use strict";

	/**
	 * Constructor for a new PerspectiveCamera.
	 *
	 *
	 * @class Provides the interface for the camera.
	 *
	 *
	 * @public
	 * @author SAP SE
	 * @version 1.52.8
	 * @extends sap.ui.base.Object
	 * @alias sap.ui.vk.threejs.PerspectiveCamera
	 * @experimental Since 1.52.0 This class is experimental and might be modified or removed in future versions.
	 */
    var ThreeJsPerspectiveCamera = PerspectiveCamera.extend("sap.ui.vk.threejs.PerspectiveCamera", /** @lends sap.ui.vk.three.PerspectiveCamera.prototype */ {
        metadata: {
            publicMethods: [
                "update"
            ],
            properties: {
            }
        }
    });

    var basePrototype = PerspectiveCamera.getMetadata().getParent().getClass().prototype;

    ThreeJsPerspectiveCamera.prototype.init = function() {

        if (basePrototype.init) {
            basePrototype.init.call(this);
        }

        var near = 1;
        var far = 10000;

        this._nativeCamera = new THREE.PerspectiveCamera(30, 1, near, far);

        this._nativeCamera.position.set(0, 0, 100);

        this.setUsingDefaultClipPlanes(true);
    };

    /**
	 * Updates the camera properties with width and height of viewport
	 *
	 * @param {float} width width of the viewport
     * @param {float} height height of the viewport
     * @public
	 */
    ThreeJsPerspectiveCamera.prototype.update = function(width, height) {
        this._nativeCamera.aspect = width / height;

        this._nativeCamera.updateProjectionMatrix();
    };

    ThreeJsPerspectiveCamera.prototype.exit = function() {

        if (basePrototype.exit) {
            basePrototype.exit.call(this);
        }

        this._nativeCamera = null;
    };

    ThreeJsPerspectiveCamera.prototype.getFov = function() {
        return this._nativeCamera.fov;
    };

    ThreeJsPerspectiveCamera.prototype.setFov = function(val) {
        this._nativeCamera.fov = val;
        return this;
    };

    // base class - camera properties..
    ThreeJsPerspectiveCamera.prototype.getCameraRef = function() {
        return this._nativeCamera;
    };

    ThreeJsPerspectiveCamera.prototype.setCameraRef = function(camRef) {
        this._nativeCamera = camRef;
        return this;
    };

    ThreeJsPerspectiveCamera.prototype.getNearClipPlane = function() {
        return this._nativeCamera.near;
    };

    ThreeJsPerspectiveCamera.prototype.setNearClipPlane = function(val) {
        this._nativeCamera.near = val;
        this.setUsingDefaultClipPlanes(false);
        return this;
    };

    ThreeJsPerspectiveCamera.prototype.getFarClipPlane = function() {
        return this._nativeCamera.far;
    };

    ThreeJsPerspectiveCamera.prototype.setFarClipPlane = function(val) {
        this._nativeCamera.far = val;
        this.setUsingDefaultClipPlanes(false);
        return this;
    };

    ThreeJsPerspectiveCamera.prototype.getPosition = function() {
        return this._nativeCamera.position.toArray();
    };

    ThreeJsPerspectiveCamera.prototype.setPosition = function(vals) {
        this._nativeCamera.position.fromArray(vals);
        return this;
    };

    ThreeJsPerspectiveCamera.prototype.getUpDirection = function() {
        return this._nativeCamera.up.toArray();
    };

    ThreeJsPerspectiveCamera.prototype.setUpDirection = function(vals) {
        this._nativeCamera.up.fromArray(vals);
        return this;
    };

    ThreeJsPerspectiveCamera.prototype.getTargetDirection = function() {
        return this._nativeCamera.getWorldDirection().toArray();
    };

    ThreeJsPerspectiveCamera.prototype.setTargetDirection = function(vals) {
        var target = new THREE.Vector3().fromArray(vals);
        target.add(this._nativeCamera.position);

        this._nativeCamera.lookAt(target);
        return this;
    };

    ThreeJsPerspectiveCamera.prototype.setUsingDefaultClipPlanes = function(val) {
        this._nativeCamera.userData.usingDefaultClipPlanes = val;
        return this;
    };

    ThreeJsPerspectiveCamera.prototype.getUsingDefaultClipPlanes = function() {
        return this._nativeCamera.userData.usingDefaultClipPlanes;
    };

    /**
	 * Adjust the camera near and far clipping planes to include the entire specified bounding box
	 *
	 * @param {THREE.Box3} boundingBox Bounding box
     * @returns {sap.ui.vk.threejs.PerspectiveCamera} this
     * @public
	 */
    ThreeJsPerspectiveCamera.prototype.adjustClipPlanes = function(boundingBox) {
        var camera = this._nativeCamera;
        camera.updateMatrixWorld();
        camera.matrixWorldInverse.getInverse(camera.matrixWorld);
        boundingBox = boundingBox.clone().applyMatrix4(camera.matrixWorldInverse);

        camera.near = -boundingBox.max.z;
        camera.far = -boundingBox.min.z;

        var epsilon = Math.max((camera.far - camera.near) * 0.0025, 0.001);
        camera.far = Math.max(camera.far, 0.1);
        epsilon = Math.max(epsilon, camera.far * 0.0025);
        camera.near -= epsilon;
        camera.far += epsilon;
        camera.near = Math.max(camera.near, camera.far * 0.0025);

        // console.log(camera.near, camera.far, epsilon);
        camera.updateProjectionMatrix();
        return this;
    };

    return PerspectiveCamera;
});
