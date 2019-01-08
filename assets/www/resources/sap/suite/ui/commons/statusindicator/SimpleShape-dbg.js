/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

// Provides control sap.suite.ui.commons.statusindicator.SimpleShape.
sap.ui.define([
		"jquery.sap.global",
		"../library",
		"sap/ui/core/Control",
		"sap/suite/ui/commons/statusindicator/Shape",
		"sap/suite/ui/commons/util/HtmlElement"
	],
	function (jQuery, library, Control, Shape, HtmlElement) {
		"use strict";

		var FillingType = library.statusindicator.FillingType;

		/**
		 * Constructor for a new SimpleShape.
		 *
		 * @param {string} [sId] id for the new control, generated automatically if no id is given
		 * @param {object} [mSettings] initial settings for the new control
		 *
		 * @class
		 * A simple shape that consists of a single SVG shape.
		 * @extends sap.suite.ui.commons.Shape
		 *
		 * @author SAP SE
		 * @version 1.52.3
		 * @since 1.50
		 *
		 * @constructor
		 * @public
		 * @alias sap.suite.ui.commons.statusindicator.SimpleShape
		 * @ui5-metamodel This control/element will also be described in the UI5 (legacy) design time metamodel
		 */
		var SimpleShape = Shape.extend("sap.suite.ui.commons.statusindicator.SimpleShape",
			/** @lends sap.suite.ui.commons.Shape.prototype */
			{
				metadata: {
					"abstract": true,
					library: "sap.suite.ui.commons",
					properties: {
						/**
						 * Specifies the width of the shape's outline.
						 */
						strokeWidth: {type: "float", defaultValue: 0.25},

						/**
						 * Specifies the color of the shape's outline.
						 */
						strokeColor: {type: "sap.m.ValueCSSColor", defaultValue: "sapUiContentIconColor"}
					}
				}
			});

		SimpleShape.prototype._getSimpleShapeElement = function () {
			jQuery.sap.log.fatal("Must be overriden!");
		};

		SimpleShape.prototype.init = function () {
			if (Shape.prototype.init) {
				Shape.prototype.init.apply(this, arguments);
			}

			this._iDisplayedValue = 0;
		};

		/**
		 * Updates DOM to visualize passed value. The regular update convert the value before updating.
		 * The plain update simply updates the DOM to the given iDisplayedValue.
		 *
		 * @param {number} iDisplayedValue
		 * @param {boolean} bPlainUpdate
		 *
		 * @private
		 * @return void
		 */
		SimpleShape.prototype._updateDom = function (iDisplayedValue, bPlainUpdate) {
			var newFillColor = this.getDisplayedFillColor(iDisplayedValue);
			this.$("shape").attr("fill", newFillColor);
			Shape.prototype._updateDom.apply(this, arguments);
			this._iDisplayedValue = iDisplayedValue;
		};

		/**
		 * Returns currently displayed value.
		 *
		 * @public
		 * @returns {number}
		 */
		SimpleShape.prototype.getDisplayedValue = function () {
			return this._iDisplayedValue;
		};

		SimpleShape.prototype._setInitialValue = function(iInitialValue){
			this._iDisplayedValue = iInitialValue;
		};

		/**
		 * Returns the HTML structure of the shape.
		 *
		 * @private
		 * @returns {HtmlElement}
		 */
		SimpleShape.prototype._getHtmlElements = function () {
			var sMaskId = "mask";
			var oShapeRootElement = new HtmlElement("g");
			oShapeRootElement.addControlData(this);

			var oDefsElement = new HtmlElement("defs");

			if (this.getFillingType() === FillingType.Linear || this.getFillingType() === FillingType.Radial) {
				// gradient element

				oDefsElement.addChild(this.getGradientElement(this._iDisplayedValue));

				// mask element
				var sMaskShapeId = "mask-shape";
				var oMaskShapeElement = this._getMaskShapeElement(this._buildIdString(this.getId(), sMaskShapeId), {
					fill: this._buildSvgUrlString(this.getId(), "gradient") // todo hardcoded gradientId
				});
				var oMaskElement = this._getMaskElement(this._buildIdString(this.getId(), sMaskId), oMaskShapeElement);
				oDefsElement.addChild(oMaskElement);
				oShapeRootElement.addChild(oDefsElement);
			}

			// element
			var sShapeId = this._buildIdString(this.getId(), "shape");
			var oShapeElement = this._getSimpleShapeElement(sShapeId);
			oShapeElement.setAttribute("fill", this._getCssFillColor());
			oShapeElement.setAttribute("mask", this._buildSvgUrlString(this.getId(), sMaskId));

			if (this._sStyleAttribute) {
				oShapeElement.setAttribute("style", this._sStyleAttribute);
			}

			oShapeRootElement.addChild(oShapeElement);

			return oShapeRootElement;
		};

		SimpleShape.prototype._setStyle = function (sStyleAttribute) {
			this._sStyleAttribute = sStyleAttribute;
		};

		return SimpleShape;

	}, /* bExport= */ true);
