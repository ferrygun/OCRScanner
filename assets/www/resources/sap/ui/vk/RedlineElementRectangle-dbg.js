/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides a class for the redlining elements.
sap.ui.define([
	"jquery.sap.global", "./RedlineElement"
], function(jQuery, RedlineElement) {
	"use strict";

	/**
	 * Redline element control for rectangle.
	 *
	 * @class Provides a control for creating rectangle redline elements.
	 *
	 * @public
	 * @author SAP SE
	 * @version 1.52.8
	 * @extends sap.ui.vk.RedlineElement
	 * @alias sap.ui.vk.RedlineElementRectangle
	 * @experimental Since 1.40.0 This class is experimental and might be modified or removed in future versions.
	 */

	var RedlineElementRectangle = RedlineElement.extend("sap.ui.vk.RedlineElementRectangle", {
		metadata: {
			library: "sap.ui.vk",
			properties: {
				width: {
					type: "float",
					defaultValue: 0.001
				},
				height: {
					type: "float",
					defaultValue: 0.001
				},
				fillColor: {
					type: "sap.ui.core.CSSColor",
					defaultValue: "rgba(0, 0, 0, 0)"
				}
			}
		}
	});

	RedlineElementRectangle.prototype.init = function() {

	};

	/**
	 * Changes the current width and height of the rectangle redline element with the values passed as parameters.
	 * @param {number} offsetX The value in pixels that will be set as the width for the rectangle redline element.
	 * @param {number} offsetY The value in pixels that will be set as the height for the rectangle redline element.
	 * @returns {sap.ui.vk.RedlineElementRectangle} <code>this</code> to allow method chaining.
	 * @public
	 */
	RedlineElementRectangle.prototype.edit = function(offsetX, offsetY) {
		var parent = this.getParent(),
			translated = parent._toVirtualSpace(offsetX, offsetY),
			width = translated.x - this.getOriginX(),
			height = translated.y - this.getOriginY(),
			onePixelSize = parent._toVirtualSpace(1);

		this.setWidth(width > 0 ? width : onePixelSize);
		this.setHeight(height > 0 ? height : onePixelSize);
		return this;
	};

	/**
	 * Changes the current width and height of the rectangle redline element by a factor which gets passed as parameter.
	 * @param {number} zoomBy The factor to be applied to the current width and height.
	 * @returns {sap.ui.vk.RedlineElementRectangle} <code>this</code> to allow method chaining.
	 * @public
	 */
	RedlineElementRectangle.prototype.applyZoom = function(zoomBy) {
		this.setProperty("width", this.getWidth() * zoomBy, true);
		this.setProperty("height", this.getHeight() * zoomBy, true);
		return this;
	};

	RedlineElementRectangle.prototype.setWidth = function(width) {
		this.setProperty("width", width, true);
		var domRef = this.getDomRef();
		if (domRef) {
			domRef.setAttribute("width", this.getParent()._toPixelSpace(width));
		}
	};

	RedlineElementRectangle.prototype.setHeight = function(height) {
		this.setProperty("height", height, true);
		var domRef = this.getDomRef();
		if (domRef) {
			domRef.setAttribute("height", this.getParent()._toPixelSpace(height));
		}
	};

	/**
	 * Creates and renders the DOM element.
	 * @param { sap.ui.core.RenderManager} renderManager Instance of RenderManager.
	 * @public
	 */
	RedlineElementRectangle.prototype.render = function(renderManager) {
		var parent = this.getParent();
		renderManager.write("<rect");
		renderManager.writeElementData(this);
		var origin = parent._toPixelSpace(this.getOriginX(), this.getOriginY());
		renderManager.writeAttribute("x", origin.x);
		renderManager.writeAttribute("y", origin.y);
		renderManager.writeAttribute("width", parent._toPixelSpace(this.getWidth()));
		renderManager.writeAttribute("height", parent._toPixelSpace(this.getHeight()));
		renderManager.writeAttribute("fill", this.getFillColor());
		renderManager.writeAttribute("stroke", this.getStrokeColor());
		renderManager.writeAttribute("stroke-width", this.getStrokeWidth());
		renderManager.writeAttribute("opacity", this.getOpacity());
		renderManager.write("></rect>");
	};

	/**
	 * Exports all the relevant data contained in the rectangle redline element to a JSON object.
	 * @returns {object} Data that can be serialized and later used to restore the rectangle redline element.
	 * @public
	 */
	RedlineElementRectangle.prototype.exportJSON = function() {
		return jQuery.extend(true, RedlineElement.prototype.exportJSON.call(this), {
			type: sap.ui.vk.Redline.ElementType.Rectangle,
			version: 1,
			width: this.getWidth(),
			height: this.getHeight(),
			fillColor: this.getFillColor()
		});
	};

	/**
	 * Imports data from a JSON object into the rectangle redline element.
	 * @param {object} json Relevant data used to restore the rectangle redline element.
	 * @returns {sap.ui.vk.RedlineElementRectangle} <code>this</code> to allow method chaining.
	 * @public
	 */
	RedlineElementRectangle.prototype.importJSON = function(json) {
		if (json.type === sap.ui.vk.Redline.ElementType.Rectangle) {
			if (json.version === 1) {

				RedlineElement.prototype.importJSON.call(this, json);

				if (json.hasOwnProperty("width")) {
					this.setWidth(json.width);
				}

				if (json.hasOwnProperty("height")) {
					this.setHeight(json.height);
				}

				if (json.hasOwnProperty("fillColor")) {
					this.setFillColor(json.fillColor);
				}

			} else {
				// TO DO error version number
				jQuery.sap.log("wrong version number");
			}
		} else {
			jQuery.sap.log("Redlining JSON import: Wrong element type");
		}

		return this;
	};

	return RedlineElementRectangle;
});
