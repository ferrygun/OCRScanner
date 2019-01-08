/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides the Scene class.
sap.ui.define([
	"jquery.sap.global", "sap/ui/base/Object"
], function(jQuery, BaseObject) {
	"use strict";

	/**
	 * Constructor for a new Scene.
	 *
	 * The objects of this class should not be created directly.
	 * They should be created via {@link sap.ui.vk.ContentConnector sap.ui.vk.ContentConnector}.
	 *
	 * @class Provides the interface for the 3D model.
	 *
	 * The objects of this class should not be created directly.
	 * They should be created via {@link sap.ui.vk.ContentConnector sap.ui.vk.ContentConnector}.
	 *
	 * @public
	 * @abstract
	 * @author SAP SE
	 * @version 1.52.8
	 * @extends sap.ui.base.Object
	 * @alias sap.ui.vk.Scene
	 * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
	 */
	var Scene = BaseObject.extend("sap.ui.vk.Scene", /** @lends sap.ui.vk.Scene.prototype */ {
		metadata: {
			"abstract": true
		}
	});

	/**
	 * Gets the unique ID of the Scene object.
	 *
	 * @function
	 * @name sap.ui.vk.Scene#getId
	 *
	 * @returns {string} The unique ID of the Scene object.
	 * @public
	 */

	/**
	 * Gets the default node hierarchy in the Scene object.
	 *
	 * @function
	 * @name sap.ui.vk.Scene#getDefaultNodeHierarchy
	 *
	 * @returns {sap.ui.vk.NodeHierarchy} The default node hierarchy in the Scene object.
	 * @public
	 */

	/**
	 * Gets the scene reference that this Scene object wraps.
	 *
	 * @function
	 * @name sap.ui.vk.Scene#getSceneRef
	 *
	 * @returns {any} The scene reference that this Scene object wraps.
	 * @public
	 */

	return Scene;
});
