/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides a class for the redlining freehand elements.
sap.ui.define([
	"jquery.sap.global", "./RedlineElement"
], function(jQuery, RedlineElement) {
	"use strict";

	/**
	 * Redline element control for freehand.
	 *
	 * @class Provides a control for creating freehand redline elements.
	 *
	 * @public
	 * @author SAP SE
	 * @version 1.52.8
	 * @extends sap.ui.vk.RedlineElement
	 * @alias sap.ui.vk.RedlineElementFreehand
	 * @experimental Since 1.40.0 This class is experimental and might be modified or removed in future versions.
	 */

	var RedlineElementFreehand = RedlineElement.extend("sap.ui.vk.RedlineElementFreehand", {
		metadata: {
			library: "sap.ui.vk",
			properties: {
				path: {
					type: "float[]",
					defaultValue: null
				}
			}
		}
	});

	RedlineElementFreehand.prototype.init = function() {

	};

	RedlineElementFreehand.prototype.setPath = function(path) {
		this.setProperty("path", path, true);
		var domRef = this.getDomRef();
		if (domRef) {
			domRef.setAttribute("d", this._getProcessedPath());
		}
	};

	/**
	 * Adds a new point to the current freehand path.
	 * @param {number} offsetX The value in pixels that will be set as the origin of the x-coordinate for a new point in the freehand path.
	 * @param {number} offsetY The value in pixels that will be set as the origin of the y-coordinate for a new point in the freehand path.
	 * @returns {sap.ui.vk.RedlineElementFreehand} <code>this</code> to allow method chaining.
	 * @public
	 */
	RedlineElementFreehand.prototype.edit = function(offsetX, offsetY) {
		var parent = this.getParent();
		var translated = parent._toVirtualSpace(offsetX, offsetY);

		var currentPath = this.getPath() || [];
		currentPath.push(translated.x - this.getOriginX(), translated.y - this.getOriginY());
		this.setPath(currentPath);

		var domRef = this.getDomRef();
		if (domRef) {
			domRef.setAttribute("d", this._getProcessedPath());
		}
		return this;
	};

	/**
	 * Applies a zoom factor to the current freehand redline element.
	 * @param {number} zoomBy The factor to be applied to the current freehand drawing.
	 * @returns {sap.ui.vk.RedlineElementFreehand} <code>this</code> to allow method chaining.
	 * @public
	 */
	RedlineElementFreehand.prototype.applyZoom = function(zoomBy) {
		this.setProperty("path", this.getPath().map(function(value) {
			return value * zoomBy;
		}), true);
		return this;
	};

	/**
	 * Creates a string path based on the current <code>path</code> property.
	 * The string path can then be used to set the "d" attribute of an SVG <path> element.
	 * @returns {string} String to be used as "d" attribute value for <path> element.
	 * @public
	 */
	RedlineElementFreehand.prototype._getProcessedPath = function() {
		var parent = this.getParent(),
			origin = parent._toPixelSpace(this.getOriginX(), this.getOriginY());

		var d = "";
		(this.getPath() || []).forEach(function(element, index) {
			element = parent._toPixelSpace(element);
			if (index === 0) {
				d += "M " + (origin.x + element);
			} else if (index === 1) {
				d += " " + (origin.y + element);
			} else {
				d += " " + (index % 2 === 0 ? "L " + (origin.x + element) : (origin.y + element));
			}
		});
		return d;
	};

	/**
	 * Creates and renders the DOM element.
	 * @param { sap.ui.core.RenderManager} renderManager Instance of RenderManager.
	 * @public
	 */
	RedlineElementFreehand.prototype.render = function(renderManager) {
		renderManager.write("<path");
		renderManager.writeElementData(this);
		renderManager.writeAttribute("d", this._getProcessedPath());
		renderManager.writeAttribute("stroke", this.getStrokeColor());
		renderManager.writeAttribute("stroke-width", this.getStrokeWidth());
		renderManager.writeAttribute("opacity", this.getOpacity());
		renderManager.writeAttribute("fill", "none");
		renderManager.write("></path>");
	};

	/**
	 * Exports all the relevant data contained in the freehand redline element to a JSON object.
	 * @returns {object} Data that can be serialized and later used to restore the freehand redline element.
	 * @public
	 */
	RedlineElementFreehand.prototype.exportJSON = function() {

		return jQuery.extend(true, RedlineElement.prototype.exportJSON.call(this), {
			type: sap.ui.vk.Redline.ElementType.Freehand,
			version: 1,
			path: (this.getPath() || []).slice()
		});
	};

	/**
	 * Imports data from JSON into the redline element.
	 * @param {object} json Relevant data that can be used to restore the freehand redline element.
	 * @returns {sap.ui.vk.RedlineElementFreehand} <code>this</code> to allow method chaining.
	 * @public
	 */
	RedlineElementFreehand.prototype.importJSON = function(json) {
		if (json.type === sap.ui.vk.Redline.ElementType.Freehand) {
			if (json.version === 1) {

				RedlineElement.prototype.importJSON.call(this, json);

				if (json.hasOwnProperty("path")) {
					this.setPath(json.path.slice());
				}

			} else {
				// TO DO error version number
				jQuery.sap.log.error("wrong version number");
			}
		} else {
			jQuery.sap.log.error("Redlining JSON import: Wrong element type");
		}

		return this;
	};

	return RedlineElementFreehand;
});
