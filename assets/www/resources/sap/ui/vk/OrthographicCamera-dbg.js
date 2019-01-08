/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides the OrthographicCamera class.
sap.ui.define([
	"jquery.sap.global", "./Camera"
], function(jQuery, Camera) {
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
	 * @alias sap.ui.vk.OrthographicCamera
	 * @experimental Since 1.52.0 This class is experimental and might be modified or removed in future versions.
	 */
	var OrthographicCamera = Camera.extend("sap.ui.vk.OrthographicCamera", /** @lends sap.ui.vk.OrthographicCamera.prototype */ {
		metadata: {
			properties: {
				/**
				 * Camera zoom factor
				 */
				"zoomFactor": {
					type: "float"
				}
			}
		}
	});

	return OrthographicCamera;
});
