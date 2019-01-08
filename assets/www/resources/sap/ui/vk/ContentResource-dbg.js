/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides class sap.ui.vk.ContentResource.
sap.ui.define([
	"jquery.sap.global", "./library", "sap/ui/base/ManagedObject"
], function(jQuery, library, ManagedObject) {
	"use strict";

	/**
	 * Constructor for a new ContentResource.
	 *
	 * @class
	 * Specifies a resource to load.

	 * @param {string} [sId] ID of the new content resource. <code>sId</code>is generated automatically if no non-empty ID is given.
	 *                       Note: this can be omitted, regardless of whether <code>mSettings</code> will be provided or not.
	 * @param {object} [mSettings] An optional map/JSON object with initial property values, aggregated objects etc. for the new content resource.
	 * @param {object} [oScope] scope An object for resolving string-based type and formatter references in bindings.
	 * @public
	 * @author SAP SE
	 * @version 1.52.8
	 * @extends sap.ui.base.ManagedObject
	 * @alias sap.ui.vk.ContentResource
	 * @experimental Since 1.32.0 This class is experimental and might be modified or removed in future versions.
	 */
	var ContentResource = ManagedObject.extend("sap.ui.vk.ContentResource", /** @lends sap.ui.vk.ContentResource.prototype */ {
		metadata: {
			properties: {
				/**
				 * The source URL or the {@link https://developer.mozilla.org/en-US/docs/Web/API/File File} object of the content resource/file to load from.
				 * The source may be omitted if a grouping node is needed.
				 */
				source: "any",

				/**
				 * The source type of the content resource. Valid types:
				 * <ul>
				 *   <li>vds</li>
				 *   <li>png</li>
				 *   <li>jpg</li>
				 *   <li>gif</li>
				 * </ul>
				 * The source type may be omitted if this is a grouping content node.
				 */
				sourceType: "string",

				/**
				 * The unique ID of the content resource.
				 */
				sourceId: "string",

				/**
				 * The local transformation matrix of the node created for this content resource.
				 */
				localMatrix: "sap.ui.vk.TransformationMatrix",

				/**
				 * The name of the node created for this content resource.
				 */
				name: "string",

				/**
				 * The password to use when opening the resource.
				 */
				password: "string"
			},

			aggregations: {
				/**
				 * Child content resources.
				 */
				contentResources: "sap.ui.vk.ContentResource"
			},

			publicMethods: [
				"getNodeProxy",
				"getSourceProperties"
			]
		},

		constructor: function(sId, mSettings, oScope) {
			ManagedObject.apply(this, arguments);
		}
	});

	ContentResource.prototype.isTreeBinding = function(name) {
		return name === "contentResources";
	};

	ContentResource.prototype.destroy = function() {
		ManagedObject.prototype.destroy.call(this);
	};

	ContentResource.prototype.setLocalMatrix = function(value) {
		var nodeProxy = this.getNodeProxy();
		if (nodeProxy) {
			nodeProxy.setLocalMatrix(value);
		}
		this.setProperty("localMatrix", value, true);
		return this;
	};

	/**
	 * Gets content resource source properties.
	 *
	 * The content resource source properties depend on the content resource source type. They are different for VDS and PNG for example.
	 * The list of possible source properties:
	 * <ul>
	 *   <li>version - object
	 *     <ul>
	 *       <li>major - number</li>
	 *       <li>minor - number</li>
	 *     </ul>
	 *   </li>
	 *   <li>compressed - boolean</li>
	 *   <li>encrypted - boolean</li>
	 * </ul>
	 * The source properties are optional and the list might be extended in future versions.
	 *
	 * @returns {object} A JSON like object containing the content resource source properties.
	 * @public
	 */
	ContentResource.prototype.getSourceProperties = function() {
		return this._shadowContentResource && this._shadowContentResource.sourceProperties || {};
	};

	/**
	 * Gets the {@link sap.ui.vk.NodeProxy NodeProxy} object created for this content resource.
	 *
	 * If this is the only top level content resource, the {@link sap.ui.vk.NodeProxy NodeProxy} object is not set since
	 * the grouping node is not created, which means that there may be multiple top level nodes.
	 *
	 * @returns {sap.ui.vk.NodeProxy} The {@link sap.ui.vk.NodeProxy NodeProxy} object created for this content resource if any, otherwise <code>null</code>.
	 * @public
	 */
	ContentResource.prototype.getNodeProxy = function() {
		return this._shadowContentResource && this._shadowContentResource.nodeProxy || null;
	};

	/**
	 * Collects content resource categories. The result is tested if the content resource hierarchy has the same category - 2D or 3D.
	 *
	 * @param {sap.ui.vk.ContentResource[]} resources The array of content resources.
	 * @returns {sap.ui.vk.ContentResourceSourceCategory[]} The array of distinct content resource categories.
	 * @static
	 * @public
	 * @deprecated Since version 1.50.0.
	 */
	ContentResource.collectCategories = function(resources) {
		var categories = [];
		var map = {};

		function getResourceCategory(resource) {
			var sourceType = (resource.getSourceType() || "").toLowerCase();
			if (sourceType) {
				var category = sap.ui.vk.ContentResourceSourceTypeToCategoryMap[sourceType] || "unknown";
				if (!map.hasOwnProperty(category)) {
					map[category] = true;
					categories.push(category);
				}
			}
			resource.getContentResources().forEach(getResourceCategory);
		}

		resources.forEach(getResourceCategory);

		return categories;
	};

	return ContentResource;
});
