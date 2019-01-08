/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides object sap.ui.vk.ContentManager.
sap.ui.define([
	"jquery.sap.global", "sap/ui/base/ManagedObject"
], function(jQuery, ManagedObject) {
	"use strict";

	/**
	 * Constructor for a new ContentManager.
	 *
	 * @class
	 * Provides a base loader interface.
	 *
	 * To load content a concrete loader class is to be used.
	 *
	 * @param {string} [sId] ID for the new ContentManager object. Generated automatically if no ID is given.
	 * @param {object} [mSettings] Initial settings for the new ContentConnector object.
	 * @protected
	 * @abstract
	 * @author SAP SE
	 * @version 1.52.8
	 * @extends sap.ui.base.ManagedObject
	 * @alias sap.ui.vk.ContentManager
	 * @since 1.50.0
	 * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
	 */
	var ContentManager = ManagedObject.extend("sap.ui.vk.ContentManager", /** @lends sap.ui.vk.ContentManager.prototype */ {
		metadata: {
			library: "sap.ui.vk",

			events: {
				/**
				 * This event will be fired when content resources are about to be loaded.
				 */
				contentChangesStarted: {
					parameters: {
					}
				},

				/**
				 * This event will be fired when content resources have been loaded successfully or with a failure.
				 */
				contentChangesFinished: {
					parameters: {
						/**
						 * The content created or updated.
						 */
						content: {
							type: "any"
						},

						/**
						 * The failure reason if any.<br>
						 * An single element or an array of elements with the following structure:
						 * <ul>
						 *   <li>error - An object with details of the error.
						 *   <li>contentResource - A {@link sap.ui.vk.ContentResource sap.ui.vk.ContentResource} object when it is possible to
						 *       match <code>error</code> to a {@link sap.ui.vk.ContentResource sap.ui.vk.ContentResource} object.
						 * </ul>
						 */
						failureReason: {
							type: "object"
						}
					}
				},

				/**
				 * This event will be fired to report the progress of content changes.
				 */
				contentChangesProgress: {
					parameters: {
						/**
						 * The name of the loading phase. It can be e.g. 'downloading', 'building the scene' etc.
						 * It might be null if reporting this parameter does not make sense.
						 */
						phase: {
							type: "string"
						},

						/**
						 * The overall percentage of the loading process.
						 */
						percentage: {
							type: "float"
						},

						/**
						 * The content resource currently being loaded. It might be null if reporting this parameter does not make sense.
						 */
						source: {
							type: "any"
						}
					}
				}
			}
		}
	});

	/**
	 * Starts downloading and building or updating the content from the content resources.
	 *
	 * This method is asynchronous.
	 *
	 * @function
	 * @name sap.ui.vk.ContentManager#loadContent
	 * @param {any}                         content          The current content to update. It can be <code>null</code> if this is an initial loading call.
	 * @param {sap.ui.vk.ContentResource[]} contentResources The content resources to load or update.
	 * @returns {sap.ui.vk.ContentManager} <code>this</code> to allow method chaining.
	 * @public
	 * @abstract
	 * @since 1.50.0
	 */

	/**
	 * Destroys the content.
	 *
	 * @param {any} content The content to destroy.
	 * @returns {sap.ui.vk.ContentManager} <code>this</code> to allow method chaining.
	 * @public
	 * @since 1.50.0
	 */
	ContentManager.prototype.destroyContent = function(content) {
		return this;
	};

	/**
	 * Collects and destroys unused objects and resources.
	 *
	 * @returns {sap.ui.vk.ContentManager} <code>this</code> to allow method chaining.
	 * @public
	 * @since 1.50.0
	 */
	 ContentManager.prototype.collectGarbage = function() {
		 return this;
	 };

	/**
	 * Creates a Perspective camera
	 *
	 * @returns {sap.ui.vk.OrthographicCamera} Created Camera.
	 * @public
	 * @since 1.52.0
	 */
	 ContentManager.prototype.createOrthographicCamera = function() {
		 return null;
	 };

	/**
	 * Creates a Orthographic camera
	 *
	 * @returns {sap.ui.vk.PerspectiveCamera} Created Camera.
	 * @public
	 * @since 1.52.0
	 */
	 ContentManager.prototype.createPerspectiveCamera = function() {
		 return null;
	 };

	/**
	 * Destroys a camera for the content type
	 *
	 * @param {any} camera The camera to destroy.
	 * @returns {sap.ui.vk.ContentManager} <code>this</code> to allow method chaining.
	 * @public
	 * @since 1.52.0
	 */
	 ContentManager.prototype.destroyCamera = function(camera) {
		 return this;
	 };

	return ContentManager;
});
