/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
// Provides control sap.ui.vk.RedlineDesign.
sap.ui.define([
	"jquery.sap.global", "./library", "sap/ui/core/Control", "./RedlineSurface", "./RedlineElement", "./RedlineGesturesHandler", "./RedlineDesignHandler", "./Loco"
], function(jQuery, library, Control, RedlineSurface, RedlineElement, RedlineGesturesHandler, RedlineDesignHandler, Loco) {
		"use strict";

		/**
		 *  Constructor for a new RedlineDesign.
		 *
		 * @class Provides a control for designing redlining shapes.
		 *
		 * @public
		 * @author SAP SE
		 * @version 1.52.8
		 * @extends sap.ui.vk.RedlineSurface
		 * @alias sap.ui.vk.RedlineDesign
		 * @experimental Since 1.40.0 This class is experimental and might be modified or removed in future versions.
		 */
		var RedlineDesign = RedlineSurface.extend("sap.ui.vk.RedlineDesign", /** @lends sap.ui.vk.RedlineDesign.prototype */ {
			metadata: {
				library: "sap.ui.vk",
				events: {
					elementCreated: {
						parameters: {
							element: "object"
						}
					}
				},
				aggregations: {
					/**
					 * activeElementInstance is the element being currently drawn.
					 */
					activeElementInstance: {
						type: "sap.ui.vk.RedlineElement",
						multiple: false,
						visibility: "hidden"
					}
				}
			}
		});

		RedlineDesign.prototype.init = function() {
			this._isAddingModeActive = false;
			this._isDrawingOn = false;
			this._activeElementInstance = null;
			this.addStyleClass("sapUiVizkitRedlineInteractionMode");

			// Instantiating the interaction and design handlers
			this._gestureHandler = new RedlineGesturesHandler(this);
			this._designHandler = new RedlineDesignHandler(this);
		};

		RedlineDesign.prototype.onBeforeRendering = function() {
			// If there is a Loco already registered, we remove it.
			if (this._loco) {
				this._loco.removeHandler(this._gestureHandler);
				this._loco.removeHandler(this._designHandler);
			}
		};

		RedlineDesign.prototype.onAfterRendering = function() {
			var domRef = this.getDomRef();
			// We make the RedlineDesign control take the full width and size of the parent container.
			domRef.style.width = "100%";
			domRef.style.height = "100%";

			// Registering a Loco handler for gestures.
			this._loco = new Loco();
			if (this._isAddingModeActive) {
				this._loco.addHandler(this._designHandler);
			} else {
				this._loco.addHandler(this._gestureHandler);
			}
			this.updatePanningRatio();
		};

		/**
		 * Wrapper method that calls the <code>edit</code> method from {sap.ui.vk.RedlineElement}.
		 * @param {sap.ui.vk.RedlineElement} element The redlining element which needs to be edited.
		 * @param {number} offsetX The number of pixels representing the horizontal offset of the event.
		 * @param {number} offsetY The number of pixels representing the vertical offset of the event.
		 * @returns {sap.ui.vk.RedlineDesign} <code>this</code> to allow method chaining.
		 * @private
		 */
		RedlineDesign.prototype._editElement = function(element, offsetX, offsetY) {
			element.edit(offsetX, offsetY);
			return this;
		};

		/**
		 * Determines whether you are currently in drawing mode or not.
		 * @returns {boolean} Returns <code>true</code> if drawing mode is ON.
		 * @private
		 */
		RedlineDesign.prototype._getIsDrawingOn = function() {
			return this._isDrawingOn;
		};

		/**
		 * Sets the drawing mode to either ON or OFF.
		 * @param {boolean} isDrawingOn <code>true</code> or <code>false</code> depending on whether you want to set the drawing mode to ON or OFF.
		 * @returns {sap.ui.vk.RedlineDesign} <code>this</code> to allow method chaining.
		 * @private
		 */
		RedlineDesign.prototype._setIsDrawingOn = function(isDrawingOn) {
			this._isDrawingOn = isDrawingOn;
			return this;
		};

		/**
		 * Prepares the RedlineDesign control for adding a new instance of {sap.ui.vk.RedlineElement}.
		 * @param {sap.ui.vk.RedlineElement} elementInstance The redlining element which needs to be added.
		 * @returns {sap.ui.vk.RedlineDesign} <code>this</code> to allow method chaining.
		 * @public
		 */
		RedlineDesign.prototype.startAdding = function(elementInstance) {
			this._isAddingModeActive = true;
			// save a reference to the current element instance
			this._activeElementInstance = elementInstance;
			this.setAggregation("activeElementInstance", this._activeElementInstance);

			// set the correct style class for this mode
			this.addStyleClass("sapUiVizkitRedlineDesignMode");
			this.removeStyleClass("sapUiVizkitRedlineInteractionMode");
			return this;
		};

		/**
		 * Stops the mode for adding redlining, which begins when the {@link sap.ui.vk.RedlineDesign#startAdding startAdding} method is called.
		 * @returns {sap.ui.vk.RedlineDesign} <code>this</code> to allow method chaining.
		 * @public
		 */
		RedlineDesign.prototype.stopAdding = function() {
			this._isAddingModeActive = false;
			this._setIsDrawingOn(false);
			this.setAggregation("activeElementInstance", null);
			this._activeElementInstance = null;

			this.addStyleClass("sapUiVizkitRedlineInteractionMode");
			this.removeStyleClass("sapUiVizkitRedlineDesignMode");
			return this;
		};

		RedlineDesign.prototype._getOffset = function(obj) {
			var rectangle = obj.getBoundingClientRect();
			return {
				x: rectangle.left + window.pageXOffset,
				y: rectangle.top + window.pageYOffset
			};
		};

		RedlineDesign.prototype._getTargetViewport = function() {
			return this._targetViewport;
		};

		RedlineDesign.prototype._setTargetViewport = function(v) {
			this._targetViewport = v;
			this._targetViewport.attachEvent("resize", this, this._onresize, this);
		};

		RedlineDesign.prototype._onresize = function(event) {
			// Re-calculate top,left and length.
			var virtualViewportSize = event.oSource.getOutputSize();
			this.setProperty("virtualLeft", virtualViewportSize.left, true);
			this.setProperty("virtualTop", virtualViewportSize.top, true);
			this.setProperty("virtualSideLength", virtualViewportSize.sideLength, true);
			this.invalidate();
		};

		return RedlineDesign;
	});
