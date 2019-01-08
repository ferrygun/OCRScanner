/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	"jquery.sap.global",
	"./library",
	"sap/m/library",
	"sap/ui/core/Control",
	"sap/ui/Device",
	"sap/ui/core/ResizeHandler"
], function(jQuery, library, MobileLibrary, Control, Device, ResizeHandler) {
	"use strict";

	/**
	 * Constructor for a new LineMicroChart control.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Chart that displays the history of values as segmented lines along a threshold line. The scale is optional and showing the points is also optional.
	 * @extends sap.ui.core.Control
	 *
	 * @version 1.52.4
	 * @since 1.48.0
	 *
	 * @public
	 * @alias sap.suite.ui.microchart.LineMicroChart
	 * @ui5-metamodel This control will also be described in the UI5 (legacy) designtime metamodel
	 */
	var LineMicroChart = Control.extend("sap.suite.ui.microchart.LineMicroChart", /** @lends sap.suite.ui.microchart.LineMicroChart.prototype */ {
		metadata: {
			library: "sap.suite.ui.microchart",
			properties: {

				/**
				 * The size of the chart. If not set, the default size is applied based on the type of the device.
				 */
				size: { type: "sap.m.Size", group: "Appearance", defaultValue: "Auto" },

				/**
				 * Determines the chart threshold which is used for vertical normalization.
				 * If the threshold does not belong to the value range given by minYValue...maxYValue, the threshold is ignored.
				 * By setting the threshold property's value to null, the threshold is disabled and excluded from range calculations.
				 */
				threshold: { type: "float", group: "Appearance", defaultValue: 0 },

				/**
				 * If this property is set, it indicates the value the X-axis starts with.
				 */
				minXValue: { type: "float", group: "Appearance" },

				/**
				 * If this property is set, it indicates the value the X-axis ends with.
				 */
				maxXValue: { type: "float", group: "Appearance" },

				/**
				 * If this property is set, it indicates the value the Y-axis starts with.
				 */
				minYValue: { type: "float", group: "Appearance" },

				/**
				 * If this property is set, it indicates the value the Y-axis ends with.
				 */
				maxYValue: { type: "float", group: "Appearance" },

				/**
				 * Describes the left top label of the chart.
				 * The label color is determined by the color property of the first LineMicroChartPoint in the points aggregation.
				 * The space for the label is not reserved if the label is not set.
				 */
				leftTopLabel: { type: "string", group: "Data", defaultValue: null },

				/**
				 * Describes the right top label of the chart.
				 * The label color is determined by the color property of the last LineMicroChartPoint in the points aggregation.
				 * The space for the label is not reserved if the label is not set.
				 */
				rightTopLabel: { type: "string", group: "Data", defaultValue: null },

				/**
				 * Describes the left bottom label of the chart.
				 * The label color is set internally.
				 * The space for the label is not reserved if the label is not set.
				 */
				leftBottomLabel: { type: "string", group: "Data", defaultValue: null },

				/**
				 * Describes the right bottom label of the chart.
				 * The label color is set automatically.
				 * The space for the label is not reserved if the label is not set.
				 */
				rightBottomLabel: { type: "string", group: "Data", defaultValue: null },

				/**
				 * Describes the color of the chart.
				 * In conjunction with emphasized points, it is only used if all points have the sap.m.ValueColor.Neutral color.
				 * The color can be set as an {@link sap.m.ValueCSSColor} or as a plain object. It has the 'above' and 'below' properties that determine the color of the graph above and below the threshold, respectively.
				 */
				color: { type: "any", group: "Appearance", defaultValue: "Neutral" },

				/**
				 * Defines if the control renders the points or not.
				 * If emphasized points are used, there is no effect.
				 * If the value is true, the points in the aggregation are shown.
				 */
				showPoints: { type: "boolean", group: "Appearance", defaultValue: false }

			},
			defaultAggregation: "points",
			aggregations: {
				/**
				 * Aggregation that contains all data points that should be provided in an ordered way.
				 */
				points: { type: "sap.suite.ui.microchart.LineMicroChartPoint", multiple: true, bindable: "bindable" }
			},
			events: {
				/**
				 * The event is triggered when the chart is pressed.
				 */
				press: {}
			}
		}
	});

	LineMicroChart.MIN_SIZE_CHART = 5; // 1rem - 11pixel (2* 5,5 pixels padding to make space for points radius on each side)
	LineMicroChart.EDGE_CASE_HEIGHT_SHOWBOTTOMLABEL = 16; // 1rem on the basis of design
	LineMicroChart.EDGE_CASE_HEIGHT_SHOWTOPLABEL = 32; // 2rem on the basis of design
	LineMicroChart.EDGE_CASE_WIDTH_RESIZEFONT = 168; // Corresponds to M size 10.5rem
	LineMicroChart.EDGE_CASE_HEIGHT_RESIZEFONT = 72; // Corresponds to M size 4.5rem

	/* =========================================================== */
	/* Events */
	/* =========================================================== */
	LineMicroChart.prototype.ontap = function(oEvent) {
		if (Device.browser.msie) {
			this.$().focus();
		}
		this.firePress();
	};

	LineMicroChart.prototype.onkeydown = function(oEvent) {
		if (oEvent.which === jQuery.sap.KeyCodes.SPACE) {
			oEvent.preventDefault();
		}
	};

	LineMicroChart.prototype.onkeyup = function(oEvent) {
		if (oEvent.which === jQuery.sap.KeyCodes.ENTER || oEvent.which === jQuery.sap.KeyCodes.SPACE) {
			this.firePress();
			oEvent.preventDefault();
		}
	};

	LineMicroChart.prototype.attachEvent = function(sEventId, oData, fnFunction, oListener) {
		Control.prototype.attachEvent.call(this, sEventId, oData, fnFunction, oListener);
		if (this.hasListeners("press")) {
			this.$().attr("tabindex", 0).addClass("sapSuiteUiMicroChartPointer");
		}

		return this;
	};

	LineMicroChart.prototype.detachEvent = function(sEventId, fnFunction, oListener) {
		Control.prototype.detachEvent.call(this, sEventId, fnFunction, oListener);
		if (!this.hasListeners("press")) {
			this.$().removeAttr("tabindex").removeClass("sapSuiteUiMicroChartPointer");
		}
		return this;
	};

	/**
	 * Handler for click event
	 */
	LineMicroChart.prototype.onclick = function() {
		if (Device.browser.msie || Device.browser.edge) {
			this.$().focus();
		}
		this.firePress();
	};

	/**
	 * Handler for space button event
	 */
	LineMicroChart.prototype.onsapspace = LineMicroChart.prototype.onclick;

	/**
	 * Handler for enter button event
	 */
	LineMicroChart.prototype.onsapenter = LineMicroChart.prototype.onclick;

	/* =========================================================== */
	/* API methods */
	/* =========================================================== */

	LineMicroChart.prototype.getTooltip_AsString = function() { //eslint-disable-line
		var sTooltip = this.getTooltip_Text();
		if (!sTooltip) { //tooltip will be set by the control
			sTooltip = this._createTooltipText();
		} else if (library._isTooltipSuppressed(sTooltip)) {
			sTooltip = null;
		}

		return sTooltip;
	};

	/**
	 * Returns the translated accessibility control type. It describes the type of the MicroChart control.
	 *
	 * @returns {string} The translated accessibility control type
	 * @private
	 */
	LineMicroChart.prototype._getAccessibilityControlType = function() {
		return this._oRb.getText("ACC_CTR_TYPE_LINEMICROCHART");
	};

	LineMicroChart.prototype.getThreshold = function() {
		if (this._bThresholdNull) {
			return null;
		} else {
			return this.getProperty("threshold");
		}
	};

	/* =========================================================== */
	/* Protected methods */
	/* =========================================================== */
	LineMicroChart.prototype.init = function() {
		this._bFocusMode = false;
		this._bSemanticMode = false;
		this._aNormalizedPoints = [];
		this._minXScale = null;
		this._maxXScale = null;
		this._minYScale = null;
		this._maxYScale = null;
		this._fNormalizedThreshold = 0;
		this._bScalingValid = false;
		this._bThresholdNull = false;
		this._bNoTopLabels = false;
		this._bNoBottomLabels = false;

		this._oRb = sap.ui.getCore().getLibraryResourceBundle("sap.suite.ui.microchart");
		this._bThemeApplied = true;

		if (!sap.ui.getCore().isInitialized()) {
			this._bThemeApplied = false;
			sap.ui.getCore().attachInit(this._handleCoreInitialized.bind(this));
		} else {
			this._handleCoreInitialized();
		}
	};

	/**
	 * Handler for the core's init event. The control will only be rendered if all themes are loaded
	 * and everything is properly initialized. We attach a theme check here.
	 *
	 * @private
	 */
	LineMicroChart.prototype._handleCoreInitialized = function() {
		this._bThemeApplied = sap.ui.getCore().isThemeApplied();
		if (!this._bThemeApplied) {
			sap.ui.getCore().attachThemeChanged(this._handleThemeApplied, this);
		}
	};

	/**
	 * The chart will only be rendered if the theme is applied.
	 * If this is the case, the control invalidates itself.
	 *
	 * @private
	 */
	LineMicroChart.prototype._handleThemeApplied = function() {
		this._bThemeApplied = true;
		this.invalidate();
		sap.ui.getCore().detachThemeChanged(this._handleThemeApplied, this);
	};

	LineMicroChart.prototype.onBeforeRendering = function() {
		if (library._isInGenericTile(this)) {
			library._removeStandardMargins(this);
		}
		if (this.getPoints().length > 0) {
			this._setModeFlags();
			this._normalizePoints();
		}
		this._unbindMouseEnterLeaveHandler();
	};

	LineMicroChart.prototype.onAfterRendering = function() {
		if (this.getSize() === MobileLibrary.Size.Responsive) {
			this._sResizeHandlerId = ResizeHandler.register(this, this._onResize.bind(this));
			this._onResize();
		}
		this._bindMouseEnterLeaveHandler();
	};

	LineMicroChart.prototype.exit = function() {
		this._deregisterResizeHandler();
	};

	LineMicroChart.prototype.validateProperty = function(propertyName, value) {
		if (propertyName === "threshold") {
			if (value === null) {
				this._bThresholdNull = true;
			} else {
				this._bThresholdNull = false;
			}
		}
		if (value === null || value === undefined) {
			return Control.prototype.validateProperty.apply(this, [propertyName, null]);
		}
		// a valid color must consist of either a single valid ValueCSSColor or an object composed of the valid ValueCSSColor properties 'above' and 'below'
		if (propertyName === "color" &&
			((!MobileLibrary.ValueCSSColor.isValid(value) || value === "") &&
			(!MobileLibrary.ValueCSSColor.isValid(value.below) || value.below === "" || !MobileLibrary.ValueCSSColor.isValid(value.above) || value.above === ""))) {
			jQuery.sap.log.warning("Color property of LineMicroChart must be of type sap.m.ValueCSSColor either as single value or as composite value (above: value, below: value)");
			value = null;
		} else if (jQuery.inArray(propertyName, ["minXValue", "maxXValue", "minYValue", "maxYValue"]) >= 0) {
			// min and max X/Y values must not be smaller/greater than their respective min/max coordinate;
			// otherwise, a warning will be logged and the property value will be set to null
			if (!jQuery.isNumeric(value)) {
				jQuery.sap.log.warning("Property " + propertyName + " of LineMicroChart is not numeric and it will be reset to default");
				value = null;
			}
		}
		return Control.prototype.validateProperty.apply(this, [propertyName, value]);
	};

	/* =========================================================== */
	/* Private methods */
	/* =========================================================== */
	/**
	 * Determines the semantic and focused modes.
	 *
	 * @private
	 */
	LineMicroChart.prototype._setModeFlags = function() {
		this._bFocusMode = false;
		this._bSemanticMode = false;
		var oPoints = this.getPoints();

		// initialize scale variables with first point coordinates for future comparison.
		this._minXScale = this._maxXScale = oPoints[0].getX();
		// initialize with threshold value if not null. Upper/lower boundries will be overwritten later if applicable.
		if (this._bThresholdNull) {
			this._minYScale = this._maxYScale = oPoints[0].getY();
		} else {
			this._minYScale = this._maxYScale = this.getThreshold();
		}
		for (var i = 0; i < oPoints.length; i++) {
			this._minXScale = Math.min(oPoints[i].getX(), this._minXScale);
			this._maxXScale = Math.max(oPoints[i].getX(), this._maxXScale);
			this._minYScale = Math.min(oPoints[i].getY(), this._minYScale);
			this._maxYScale = Math.max(oPoints[i].getY(), this._maxYScale);
			// focusMode is activated if emphasizedPoints are used
			if (oPoints[i].getMetadata().getName() === "sap.suite.ui.microchart.LineMicroChartEmphasizedPoint") {
				this._bFocusMode = true;
				// semanticMode is only active for emphasized points if at least one emphasized point is shown and has a different color than Neutral.
				if (oPoints[i].getColor() !== MobileLibrary.ValueColor.Neutral && oPoints[i].getShow()) {
					this._bSemanticMode = true;
				}
			}
		}

		// if focusMode is not active, only simple points can be used
		if (!this._bFocusMode) {
			// semanticMode is only active if the chart's color property is an object composed of both above and below entries.
			if (this.getColor() && this.getColor().above && this.getColor().below && !this._bThresholdNull) {
				this._bSemanticMode = true;
			} else {
				this._bSemanticMode = false;
			}
		}

		// log warnings for invalid properties if they are different from the default value
		if (this._bFocusMode && this._bSemanticMode && this.getColor() !== MobileLibrary.ValueColor.Neutral) {
			jQuery.sap.log.info("Property Color of LineMicroChart has no effect if EmphasizedPoints with colors different from Neutral are used.");
		}
		if (this._bFocusMode && this.getShowPoints()) {
			jQuery.sap.log.info("Property ShowPoints of LineMicroChart has no effect if EmphasizedPoints are used.");
		}
		if (this.getColor() && this.getColor().above && this.getColor().below && this._bThresholdNull) {
			jQuery.sap.log.info("Property Color of LineMicroChart has no effect if it is composed of colors for above and below when property Threshold is null");
		}

		// set markers for space allocation of labels
		var sLeftTopLabel = this.getLeftTopLabel(), sRightTopLabel = this.getRightTopLabel(),
			sLeftBottomLabel = this.getLeftBottomLabel(), sRightBottomLabel = this.getRightBottomLabel();
		if (sRightBottomLabel.length === 0 && sLeftBottomLabel.length === 0) {
			this._bNoBottomLabels = true;
		} else {
			this._bNoBottomLabels = false;
		}
		if (sLeftTopLabel.length === 0 && sRightTopLabel.length === 0) {
			this._bNoTopLabels = true;
		} else {
			this._bNoTopLabels = false;
		}
	};

	/**
	 * Normalizes the points based on the scale determined by the min and max values.
	 *
	 * @private
	 */
	LineMicroChart.prototype._normalizePoints = function() {
		this._aNormalizedPoints = [];

		// compute min and max chart values
		var iMinXActual = this._minXScale,
			iMaxXActual = this._maxXScale,
			iMinYActual = this._minYScale,
			iMaxYActual = this._maxYScale;

		// determine if set min/max values are smaller/greater than their non-set min/max counterpart and log errors.
		// e.g.: maxXValue = 50 & observed minimal X value = 51
		if (jQuery.isNumeric(this.getMinXValue())) {
			this._minXScale = this.getMinXValue();
			if (!jQuery.isNumeric(this.getMaxXValue()) && this._minXScale > iMaxXActual) {
				jQuery.sap.log.error("Property minXValue of LineMicroChart must be smaller to at least one X value of the points aggregation if property maxXValue is not set");
			}
		}
		if (jQuery.isNumeric(this.getMaxXValue())) {
			this._maxXScale = this.getMaxXValue();
			if (!jQuery.isNumeric(this.getMinXValue()) && this._maxXScale < iMinXActual) {
				jQuery.sap.log.error("Property maxXValue of LineMicroChart must be greater to at least one X value of the points aggregation if property minXValue is not set");
			}
		}
		if (jQuery.isNumeric(this.getMinYValue())) {
			this._minYScale = this.getMinYValue();
			if (!jQuery.isNumeric(this.getMaxYValue()) && this._minYScale > iMaxYActual) {
				jQuery.sap.log.error("Property minYValue of LineMicroChart must be greater to threshold or at least one Y value of the points aggregation if property maxYValue is not set");
			}
		}
		if (jQuery.isNumeric(this.getMaxYValue())) {
			this._maxYScale = this.getMaxYValue();
			if (!jQuery.isNumeric(this.getMinYValue()) && this._maxYScale < iMinYActual) {
				jQuery.sap.log.error("Property maxYValue of LineMicroChart must be smaller to threshold or at least one Y value of the points aggregation if property minYValue is not set");
			}
		}
		// log error if X or Y boundaries overlap.
		if (this.getMaxYValue() < this.getMinYValue()) {
			jQuery.sap.log.error("Property maxYValue of LineMicroChart must not be smaller to minYValue");
		}
		if (this.getMaxXValue() < this.getMinXValue()) {
			jQuery.sap.log.error("Property maxXValue of LineMicroChart must not be smaller to minXValue");
		}

		var oPoints = this.getPoints(),
			fXScale = this._maxXScale - this._minXScale,
			fYScale = this._maxYScale - this._minYScale,
			fNormalizedX, fNormalizedY;
		// set flag for valid scaling which influences the rendering of points and lines (used in renderer).
		// no point will be drawn if delta of min and max X/Y is negative
		this._bScalingValid = fXScale >= 0 && fYScale >= 0;
		if (this._bScalingValid) {
			for (var i = 0; i < oPoints.length; i++) {
				// normalize Points in relation to scale but draw straight line in the middle of the chart
				if (this._minXScale === this._maxXScale && oPoints[i].getX() === this._maxXScale) {
					fNormalizedX = 50;
				} else {
					fNormalizedX = (((oPoints[i].getX() - this._minXScale) / fXScale) * 100);
				}
				if (this._minYScale === this._maxYScale && oPoints[i].getY() === this._maxYScale) {
					fNormalizedY = 50;
				} else {
					fNormalizedY = (((oPoints[i].getY() - this._minYScale) / fYScale) * 100);
				}
				this._aNormalizedPoints.push({ x: fNormalizedX, y: fNormalizedY });
			}
			this._fNormalizedThreshold = ((this.getThreshold() - this._minYScale) / fYScale) * 100;
		}
	};

	/**
	 * Performs size adjustments that are necessary if the dimensions of the chart change.
	 *
	 * @private
	 */
	LineMicroChart.prototype._onResize = function() {
		this._adjustToParent();
		var $Control = this.$(),
			$Canvas = this.$("sapSuiteLMCSvgElement"),
			$PointsContainer = this.$("sapSuiteLMCPointsContainer"),
			iControlWidth = parseInt($Control.width(), 10),
			iControlHeight = parseInt($Control.height(), 10),
			iChartWidth,
			iChartHeight,
			$TopLabels = $Control.find(".sapSuiteLMCLeftTopLabel, .sapSuiteLMCRightTopLabel"),
			$BottomLabels = $Control.find(".sapSuiteLMCLeftBottomLabel, .sapSuiteLMCRightBottomLabel");

		// resizes the fonts
		if (iControlHeight <= LineMicroChart.EDGE_CASE_HEIGHT_RESIZEFONT || iControlWidth <= LineMicroChart.EDGE_CASE_WIDTH_RESIZEFONT) {
			$Control.addClass("sapSuiteLMCSmallFont");
		} else {
			$Control.removeClass("sapSuiteLMCSmallFont");
		}

		// calculate svg dimensions after font sizes have been applied
		iChartWidth = parseInt($Canvas.width(), 10);
		iChartHeight = parseInt($Canvas.height(), 10);

		// show/hide svg canvas
		if (iChartHeight <= LineMicroChart.MIN_SIZE_CHART || iChartWidth < LineMicroChart.MIN_SIZE_CHART) {
			$Canvas.css("visibility", "hidden");
			$PointsContainer.hide();
		} else {
			$Canvas.css("visibility", "");
			$PointsContainer.show();
		}

		// hides the top labels
		if (iControlHeight <= LineMicroChart.EDGE_CASE_HEIGHT_SHOWTOPLABEL) {
			$TopLabels.css("visibility", "hidden");
		} else if (this._updateLabelVisibility($TopLabels)) { // verifies if the labels are truncated
			$Control.addClass("sapSuiteLMCNoTopLabels");
		}

		// hides the bottom labels
		if (iControlHeight <= LineMicroChart.EDGE_CASE_HEIGHT_SHOWBOTTOMLABEL) {
			$BottomLabels.css("visibility", "hidden");
		} else if (this._updateLabelVisibility($BottomLabels)) { // verifies if the labels are truncated
			$Control.addClass("sapSuiteLMCNoBottomLabels");
		}
	};

	/**
	 * Checks if the label is truncated.
	 *
	 * @private
	 * @param {HTMLElement} label The label to be checked
	 * @returns {boolean} True if the label is truncated, false otherwise.
	 */
	LineMicroChart.prototype._isLabelTruncated = function(label) {
		var $Label = jQuery(label);
		return $Label.prop("offsetWidth") < $Label.prop("scrollWidth") || $Label.prop("offsetLeft") < 0;
	};

	/**
	 * Hide/show the label.
	 *
	 * @private
	 * @param {jQuery} labels The set of labels (top/bottom) to be checked.
	 * @returns {boolean} True if the labels are truncated, otherwise false.
	 */
	LineMicroChart.prototype._updateLabelVisibility = function(labels) {
		if (labels.length === 0) {
			return false;
		}
		var bTruncated = this._isLabelTruncated(labels[0]);
		if (!bTruncated && labels.length > 1) {
			bTruncated = this._isLabelTruncated(labels[1]);
		}
		if (bTruncated) {
			labels.css("visibility", "hidden");
		} else {
			labels.css("visibility", "");
		}

		return bTruncated;
	};

	/**
	 * Adjusts the height and width of the whole control, depending on the parent control.
	 *
	 * @private
	 */
	LineMicroChart.prototype._adjustToParent = function() {
		var $Control = this.$(),
			sParentHeight, sParentWidth,
			oParent = this.getParent();
		if (!oParent) {
			return;
		}

		// flexbox and tile content
		if (oParent.getMetadata().getName() === "sap.m.FlexBox") {
			sParentHeight = oParent.getHeight();
			sParentWidth = oParent.getWidth();
		} else if (jQuery.isFunction(oParent.getRootNode)) {
			sParentHeight = Math.round(jQuery(oParent.getRootNode()).height());
			sParentWidth = Math.round(jQuery(oParent.getRootNode()).width());
		}
		if (sParentHeight) {
			$Control.height(sParentHeight);
		}
		if (sParentWidth) {
			$Control.width(sParentWidth);
		}
	};

	/**
	 * Creates text for ARIA label and tooltip value.
	 * If tooltip was set to an empty string (using whitespaces) by the application or the tooltip was not set (null/undefined),
	 * the ARIA text gets generated by the control. Otherwise, the given tooltip will also be set as ARIA text.
	 *
	 * @returns {string} The tooltip text
	 * @private
	 */
	LineMicroChart.prototype._createTooltipText = function() {
		var sTooltipText = "";
		var sStartTopLabel = this.getLeftTopLabel();
		var sStartBottomLabel = this.getLeftBottomLabel();
		var sEndTopLabel = this.getRightTopLabel();
		var sEndBottomLabel = this.getRightBottomLabel();
		var bIsFirst = true;

		// add the start labels
		if (sStartTopLabel || sStartBottomLabel) {
			sTooltipText += this._oRb.getText(("LINEMICROCHART_START")) + ": " + sStartBottomLabel + " " + sStartTopLabel;
			bIsFirst = false;
		}
		// add the end labels
		if (sEndTopLabel || sEndBottomLabel) {
			sTooltipText += (bIsFirst ? "" : "\n") + this._oRb.getText(("LINEMICROCHART_END")) + ": " + sEndBottomLabel + " " + sEndTopLabel;
		}

		return sTooltipText;
	};

	/**
	 * Adds the title attribute to show the tooltip when the mouse enters the chart.
	 *
	 * @private
	 */
	LineMicroChart.prototype._addTitleAttribute = function() {
		if (!this.$().attr("title")) {
			this.$().attr("title", this.getTooltip_AsString());
		}
	};

	/**
	 * Removes the title attribute to hide the tooltip when the mouse leaves the chart.
	 *
	 * @private
	 */
	LineMicroChart.prototype._removeTitleAttribute = function() {
		if (this.$().attr("title")) {
			this.$().removeAttr("title");
		}
	};

	/**
	 * Binds the handlers for mouseenter mouseleave events.
	 *
	 * @private
	 */
	LineMicroChart.prototype._bindMouseEnterLeaveHandler = function() {
		this.$().bind("mouseenter.tooltip", this._addTitleAttribute.bind(this));
		this.$().bind("mouseleave.tooltip", this._removeTitleAttribute.bind(this));
	};

	/**
	 * Unbinds the handlers for mouseenter mouseleave events.
	 *
	 * @private
	 */
	LineMicroChart.prototype._unbindMouseEnterLeaveHandler = function() {
		this.$().unbind("mouseenter.tooltip");
		this.$().unbind("mouseleave.tooltip");
	};

	/**
	 * Deregisters all handlers.
	 *
	 * @private
	 */
	LineMicroChart.prototype._deregisterResizeHandler = function() {
		if (this._sResizeHandlerId) {
			ResizeHandler.deregister(this._sResizeHandlerId);
			this._sResizeHandlerId = null;
		}
	};

	library._overrideGetAccessibilityInfo(LineMicroChart.prototype);

	return LineMicroChart;
});
