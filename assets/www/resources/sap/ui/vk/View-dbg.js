/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([ "jquery.sap.global", "sap/ui/base/ManagedObject" ], function(jQuery, ManagedObject) {
	"use strict";

	var View = ManagedObject.extend("sap.ui.vk.View", /** @lends sap.ui.vk.View.prototype */ {
		metadata: {
			library: "sap.ui.vk",
			properties: {
				/**
				* string name (optional)
				*/
				name: {
				    type: "string"
				},
				/**
				* Object containing camera info (optional)
				* Perspective camera requires: type (String) must be "PerspectiveCamera", fov (Number), position [Array of 3 Numbers], nearClipPlane (Number), farClipPlane (Number), targetDirection - [Array of 3 Numbers], upDirection - [Array of 3 Numbers]
				* Orthographic camera requires: type (String) must be  "OrthographicCamera", nearClipPlane (Number), farClipPlane (Number), zoomFactor (Number), position [Array of 3 Numbers], targetDirection - [Array of 3 Numbers], upDirection - [Array of 3 Numbers]
				*/
				cameraInfo: {
					type: "object"
				},
				/**
				* Array of objects containing node information. nodeRef -required (THREE.Object3D), transform- optional [Array of 12 Numbers], visibility-optional (Boolean)
				*/
                nodeInfos: {
                    type: "object[]"
                }
			}
		}
	});

	return View;
});
