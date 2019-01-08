/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides a class for the redlining ellipse elements.
sap.ui.define([
	"jquery.sap.global", "./RedlineElement"
], function(jQuery, RedlineElement) {
	"use strict";

	/**
	 * Redline element control for ellipse.
	 *
	 * @class Provides a control for creating ellipse redline elements.
	 *
	 * @public
	 * @author SAP SE
	 * @version 1.52.8
	 * @extends sap.ui.vk.RedlineElement
	 * @alias sap.ui.vk.RedlineElementEllipse
	 * @experimental Since 1.40.0 This class is experimental and might be modified or removed in future versions.
	 */

	var RedlineElementEllipse = RedlineElement.extend("sap.ui.vk.RedlineElementEllipse", {
		metadata: {
			library: "sap.ui.vk",
			properties: {
				radiusX: {
					type: "float",
					defaultValue: 0.0001
				},
				radiusY: {
					type: "float",
					defaultValue: 0.0001
				},
				fillColor: {
					type: "sap.ui.core.CSSColor",
					defaultValue: "rgba(0, 0, 0, 0)"
				}
			}
		}
	});

	RedlineElementEllipse.prototype.init = function() {

	};

	/**
	 * Changes the current radiusX and radiusY of the ellipse redline element with the values passed as parameters.
	 * @param {number} offsetX The value in pixels that will be set as radiusX for the ellipse.
	 * @param {number} offsetY The value in pixels that will be set as radiusY for the ellipse.
	 * @returns {sap.ui.vk.RedlineElementEllipse} <code>this</code> to allow method chaining.
	 * @public
	 */
	RedlineElementEllipse.prototype.edit = function(offsetX, offsetY) {
		var parent = this.getParent(),
			translated = parent._toVirtualSpace(offsetX, offsetY),
			radiusX = translated.x - this.getOriginX(),
			radiusY = translated.y - this.getOriginY(),
			onePixelSize = parent._toVirtualSpace(1);

		this.setRadiusX(radiusX > 0 ? radiusX : onePixelSize);
		this.setRadiusY(radiusY > 0 ? radiusY : onePixelSize);
		return this;
	};

	/**
	 * Changes the current radiusX and radiusY of the ellipse redline element by a factor which gets passed as parameter.
	 * @param {number} zoomBy The factor to be applied to the current radiusX and radiusY.
	 * @returns {sap.ui.vk.RedlineElementEllipse} <code>this</code> to allow method chaining.
	 * @public
	 */
	RedlineElementEllipse.prototype.applyZoom = function(zoomBy) {
		this.setProperty("radiusX", this.getRadiusX() * zoomBy, true);
		this.setProperty("radiusY", this.getRadiusY() * zoomBy, true);
		return this;
	};

	RedlineElementEllipse.prototype.setRadiusX = function(radiusX) {
		this.setProperty("radiusX", radiusX, true);
		var domRef = this.getDomRef();
		if (domRef) {
			domRef.setAttribute("rx", this.getParent()._toPixelSpace(radiusX));
		}
	};

	RedlineElementEllipse.prototype.setRadiusY = function(radiusY) {
		this.setProperty("radiusY", radiusY, true);
		var domRef = this.getDomRef();
		if (domRef) {
			domRef.setAttribute("ry", this.getParent()._toPixelSpace(radiusY));
		}
	};

	/**
	 * Creates and renders the DOM element.
	 * @param {sap.ui.core.RenderManager} renderManager Instance of RenderManager.
	 * @public
	 */
	RedlineElementEllipse.prototype.render = function(renderManager) {

		var parent = this.getParent();

		renderManager.write("<ellipse");
		renderManager.writeElementData(this);
		var origin = parent._toPixelSpace(this.getOriginX(), this.getOriginY());
		renderManager.writeAttribute("cx", origin.x);
		renderManager.writeAttribute("cy", origin.y);
		renderManager.writeAttribute("rx", parent._toPixelSpace(this.getRadiusX()));
		renderManager.writeAttribute("ry", parent._toPixelSpace(this.getRadiusY()));
		renderManager.writeAttribute("fill", this.getFillColor());
		renderManager.writeAttribute("stroke", this.getStrokeColor());
		renderManager.writeAttribute("stroke-width", this.getStrokeWidth());
		renderManager.writeAttribute("opacity", this.getOpacity());
		renderManager.write("></ellipse>");

	};

	/**
	 * Exports all the relevant data contained in the ellipse redline element to a JSON object.
	 * @returns {object} Data that can be serialized and later used to restore the ellipse redline element.
	 * @public
	 */
	RedlineElementEllipse.prototype.exportJSON = function() {

		return jQuery.extend(true, RedlineElement.prototype.exportJSON.call(this), {
			type: sap.ui.vk.Redline.ElementType.Ellipse,
			version: 1,
			radiusX: this.getRadiusX(),
			radiusY: this.getRadiusY(),
			fillColor: this.getFillColor()
		});
	};

	/**
	 * Imports data from a JSON object into the ellipse redline element.
	 * @param {object} json Relevant data used to restore the ellipse redline element.
	 * @returns {sap.ui.vk.RedlineElementEllipse} <code>this</code> to allow method chaining.
	 * @public
	 */
	RedlineElementEllipse.prototype.importJSON = function(json) {
		if (json.type === sap.ui.vk.Redline.ElementType.Ellipse) {
			if (json.version === 1) {

				RedlineElement.prototype.importJSON.call(this, json);

				if (json.hasOwnProperty("radiusX")) {
					this.setRadiusX(json.radiusX);
				}

				if (json.hasOwnProperty("radiusY")) {
					this.setRadiusY(json.radiusY);
				}

				if (json.hasOwnProperty("fillColor")) {
					this.setFillColor(json.fillColor);
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

	return RedlineElementEllipse;
});
