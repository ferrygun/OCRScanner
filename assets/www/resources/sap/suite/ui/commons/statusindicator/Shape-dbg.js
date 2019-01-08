/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

// Provides control sap.suite.ui.commons.statusindicator.Shape.
sap.ui.define([
		"jquery.sap.global",
		"../library",
		"sap/ui/core/Control",
		"sap/suite/ui/commons/util/HtmlElement",
		"sap/suite/ui/commons/statusindicator/util/ThemingUtil"
	],
	function (jQuery, library, Control, HtmlElement, ThemingUtil) {
		"use strict";

		var FillingType = library.statusindicator.FillingType;

		var FillingDirectionType = library.statusindicator.FillingDirectionType;

		/**
		 * Constructor for a new Shape.
		 *
		 * @param {string} [sId] id for the new control, generated automatically if no id is provided
		 * @param {object} [mSettings] initial settings for the new control
		 *
		 * @class
		 * Abstract shape that displays the value of the status indicator. The shape reflects
		 * the status indicator's percentage value by filling one or more of its parts (SVG shapes)
		 * with the specified color.
		 * @extends sap.ui.core.Control
		 *
		 * @author SAP SE
		 * @version 1.52.3
		 * @since 1.50
		 *
		 * @constructor
		 * @public
		 * @alias sap.suite.ui.commons.statusindicator.Shape
		 * @ui5-metamodel This control/element will also be described in the UI5 (legacy) design time metamodel.
		 */
		var Shape = Control.extend("sap.suite.ui.commons.statusindicator.Shape",
			/** @lends sap.suite.ui.commons.Shape.prototype */
			{
				metadata: {
					"abstract": true,
					library: "sap.suite.ui.commons",
					properties: {

						/**
						 * Specifies the duration, in milliseconds, of the animation that would fill an empty
						 * shape to the full.
						 * The actual time it takes to change the shape's filling is proportional to the
						 * difference between the initial and the target status indicator's value. For example,
						 * a change from 20 percent to 70 percent takes only half of the time specified
						 * in the <code>fullAnimationDuration</code> property. If this property is set to
						 * <code>0</code>, changes are applied instantly without any animation.
						 */
						fullAnimationDuration: {type: "int", defaultValue: 0},

						/**
						 * Defines the color of the shape's fill.
						 */
						fillColor: {type: "sap.m.ValueCSSColor", defaultValue: "Neutral"},

						/**
						 * Defines if the initial value of the status indicator should be animated or
						 * directly displayed on startup. By default, it's displayed on startup without any
						 * animation.
						 */
						animationOnStartup: {type: "boolean", defaultValue: false},

						/**
						 * Specifies the delay of the initial value animation. Only applicable if the
						 * <code>animationOnStartup</code> property is set to <code>true</code>.
						 */
						animationOnStartupDelay: {type: "int", defaultValue: 0},

						/**
						 * Defines the direction in which the shape is filled.
						 */
						fillingDirection: {
							type: "sap.suite.ui.commons.statusindicator.FillingDirectionType",
							defaultValue: FillingDirectionType.Up
						},

						/**
						 * Defines the type of the shape's fill.
						 */
						fillingType: {
							type: "sap.suite.ui.commons.statusindicator.FillingType",
							defaultValue: FillingType.Linear
						}
					}
				}
			});

		/**
		 * Returns the currently displayed value
		 * This method must be overridden by a child class
		 *
		 * @public
		 * @returns void
		 */
		Shape.prototype.getDisplayedValue = function () {
			jQuery.sap.log.fatal("Must be overridden!");
		};

		Shape.prototype._setInitialValue = function (iInitialValue) {
			jQuery.sap.log.fatal("Must be overridden!");
		};

		Shape.prototype.init = function () {
			if (Control.prototype.init) {
				Control.prototype.init.apply(this, arguments);
			}
			this._oAnimationPropertiesResolver = null;
		};

		/**
		 * Returns HTML structure of the shape.
		 * This method has to be overridden by child class.
		 *
		 * @return void
		 */
		Shape.prototype._getHtmlElements = function () {
			jQuery.sap.log.fatal("Must be overridden!");
		};

		Shape.prototype._getCssFillColor = function () {
			if (!this._cssFillColor) {
				this._cssFillColor = ThemingUtil.resolveColor(this.getFillColor());
			}

			return this._cssFillColor;
		};

		Shape.prototype._getCssStrokeColor = function () {
			if (!this._cssStrokeColor) {
				this._cssStrokeColor = ThemingUtil.resolveColor(this.getStrokeColor());
			}

			return this._cssStrokeColor;
		};

		Shape.prototype._injectAnimationPropertiesResolver = function (oAnimationPropertiesResolver) {
			this._oAnimationPropertiesResolver = oAnimationPropertiesResolver;
		};

		Shape.prototype.getDisplayedFillColor = function (iDisplayedValue) {
			return this._oAnimationPropertiesResolver.getColor(this, iDisplayedValue);
		};

		Shape.prototype.getGradientElement = function (iDisplayedValue) {
			var oGradientElement = new HtmlElement(this.getFillingType() === FillingType.Linear ? "linearGradient" : "radialGradient");
			oGradientElement.setId(this._buildIdString(this.getId(), "gradient")); // todo hardcoded gradientId

			if (this.getFillingType() === FillingType.Linear) {
				oGradientElement.setAttribute("x1", this.getFillingDirection() === FillingDirectionType.Left ? 1 : 0);
				oGradientElement.setAttribute("y1", this.getFillingDirection() === FillingDirectionType.Up ? 1 : 0);
				oGradientElement.setAttribute("x2", this.getFillingDirection() === FillingDirectionType.Right ? 1 : 0);
				oGradientElement.setAttribute("y2", this.getFillingDirection() === FillingDirectionType.Down ? 1 : 0);
			}

			var fOffset = this._getDisplayedGradientOffset(iDisplayedValue);
			var oStopColorElement = new HtmlElement("stop");
			oStopColorElement.setAttribute("offset", fOffset);
			oStopColorElement.setAttribute("stop-color", "white");
			oGradientElement.addChild(oStopColorElement);

			var oStopTransparentElement = new HtmlElement("stop");
			oStopTransparentElement.setAttribute("offset", fOffset);
			oStopTransparentElement.setAttribute("stop-color", "transparent");
			oGradientElement.addChild(oStopTransparentElement);

			return oGradientElement;
		};

		/**
		 * Updates DOM to visualize passed value. The regular update convert the value before updating.
		 * The plain update simply updates the DOM to the given iDisplayedValue.
		 *
		 *
		 * @param {number} iDisplayedValue
		 * @param {boolean} bPlainUpdate
		 *
		 * @private
		 * @return void
		 */
		Shape.prototype._updateDom = function (iDisplayedValue, bPlainUpdate) {
			var iResolvedValue = iDisplayedValue;
			if (!bPlainUpdate) {
				iResolvedValue = this._oAnimationPropertiesResolver.getValue(this, iDisplayedValue);
			}

			if (!this.$stopNodes) {
				this.$stopNodes = this.$("gradient").find("stop"); // todo hardcoded gradientId
			}

			this.$stopNodes.attr("offset", this._getDisplayedGradientOffset(iResolvedValue));
		};

		Shape.prototype.isFillable = function () {
			return this.getFillingType() !== FillingType.None;
		};

		Shape.prototype._getDisplayedGradientOffset = function (iDisplayedValue) {
			if (this.isFillable()) {
				var result = iDisplayedValue / 100;
				return result;
			} else {
				return 1; // fill it all!
			}
		};

		Shape.prototype._getMaskShapeElement = function (sMaskShapeId, attributes) {
			var oMaskShapeElement = this._getSimpleShapeElement(sMaskShapeId);
			oMaskShapeElement.setAttribute('stroke', 'white');
			oMaskShapeElement.setAttribute("fill", attributes.fill);
			return oMaskShapeElement;
		};

		Shape.prototype._getMaskElement = function (sMaskId, oMaskShape) {
			var oMaskElement = new HtmlElement("mask");
			oMaskElement.setId(sMaskId);
			oMaskElement.addChild(oMaskShape);

			return oMaskElement;
		};

		Shape.prototype._buildSvgUrlString = function () {
			return "url(#" + this._buildIdString.apply(this, arguments) + ")";
		};

		Shape.prototype._buildIdString = function () {
			var sConcatenatedIds = jQuery.makeArray(arguments).join("-");
			return sConcatenatedIds;
		};

		return Shape;

	}, /* bExport= */ true);
