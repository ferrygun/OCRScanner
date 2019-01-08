/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides the PerspectiveCamera class.
sap.ui.define([
	"jquery.sap.global", "./Camera"
], function(jQuery, Camera) {
	"use strict";

	/**
	 * Constructor for a new perspective camera.
	 *
	 *
	 * @class Provides the interface for the camera.
	 *
	 *
	 * @public
	 * @author SAP SE
	 * @version 1.52.8
	 * @extends sap.ui.base.Object
	 * @alias sap.ui.vk.PerspectiveCamera
	 * @experimental Since 1.52.0 This class is experimental and might be modified or removed in future versions.
	 */
	var PerspectiveCamera = Camera.extend("sap.ui.vk.PerspectiveCamera", /** @lends sap.ui.vk.PerspectiveCamera.prototype */ {
		metadata: {
			properties: {
				/**
				 * Camera frustum field of view in degree
				 */
				"fov": {
					type: "float"
				}
			}
		}
	});

	return PerspectiveCamera;
});
