/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	"jquery.sap.global", "./library", "sap/m/library", "sap/ui/core/Control", "sap/m/FlexBox", "sap/ui/Device", "sap/ui/core/ResizeHandler"
], function(jQuery, library, MobileLibrary, Control, FlexBox, Device, ResizeHandler) {
	"use strict";

	/**
	 * Constructor for a new BulletMicroChart control.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Displays a colored horizontal bar representing a current value on top of a background bar representing the compared value. The vertical bars can represent the numeric values, the scaling factors, the thresholds, and the target values.  This control replaces the deprecated sap.suite.ui.commons.BulletChart.
	 * @extends sap.ui.core.Control
	 *
	 * @version 1.52.4
	 * @since 1.34
	 *
	 * @public
	 * @alias sap.suite.ui.microchart.BulletMicroChart
	 * @ui5-metamodel This control will also be described in the UI5 (legacy) design time metamodel
	 */
	var BulletMicroChart = Control.extend("sap.suite.ui.microchart.BulletMicroChart", /** @lends sap.suite.ui.microchart.BulletMicroChart.prototype */ { metadata : {

		library: "sap.suite.ui.microchart",
		properties: {
			/**
			 * The size of the microchart. If not set, the default size is applied based on the size of the device tile.
			 */
			size: {type: "sap.m.Size", group: "Misc", defaultValue: "Auto"},

			/**
			 * The mode of displaying the actual value itself or the delta between the actual value and the target value. If not set, the actual value is displayed.
			 */
			mode: {type: "sap.suite.ui.microchart.BulletMicroChartModeType", group: "Misc", defaultValue: "Actual"},

			/**
			 * The scaling suffix that is added to the actual and target values.
			 */
			scale: {type: "string", group: "Misc", defaultValue: ""},

			/**
			 * The forecast value that is displayed in Actual  mode only. If set, the forecast value bar appears in the background of the actual value bar.
			 */
			forecastValue: {type: "float", group: "Misc", defaultValue: null},

			/**
			 * The target value that is displayed as a black vertical bar.
			 */
			targetValue: {type: "float", group: "Misc", defaultValue: null},

			/**
			 * The minimum scale value for the bar chart used for defining a fixed size of the scale in different instances of this control.
			 */
			minValue: {type: "float", group: "Misc", defaultValue: null},

			/**
			 * The maximum scale value for the bar chart used for defining a fixed size of the scale in different instances of this control.
			 */
			maxValue: {type: "float", group: "Misc", defaultValue: null},

			/**
			 * If set to true, shows the numeric actual value. This property works in Actual mode only.
			 */
			showActualValue: {type: "boolean", group: "Misc", defaultValue: true},

			/**
			 * If set to true, shows the calculated delta value instead of the numeric actual value regardless of the showActualValue setting. This property works in Delta mode only.
			 */
			showDeltaValue: {type: "boolean", group: "Misc", defaultValue: true},

			/**
			 * If set to true, shows the numeric target value.
			 */
			showTargetValue: {type: "boolean", group: "Misc", defaultValue: true},

			/**
			 * If set to true, shows the value marker.
			 */
			showValueMarker: {type: "boolean", group: "Misc", defaultValue: false},

			/**
			 * If set, displays a specified label instead of the numeric actual value.
			 */
			actualValueLabel: {type: "string", group: "Misc", defaultValue: ""},

			/**
			 * If set, displays a specified label instead of the calculated numeric delta value.
			 */
			deltaValueLabel: {type: "string", group: "Misc", defaultValue: ""},

			/**
			 * If set, displays a specified label instead of the numeric target value.
			 */
			targetValueLabel: {type: "string", group: "Misc", defaultValue: ""},

			/**
			 * The width of the chart. If it is not set, the size of the control is defined by the size property.
			 */
			width: {type: "sap.ui.core.CSSSize", group: "Misc"},

			/**
			 * The background color of the scale. The theming is enabled only for the default value of this property.
			 */
			scaleColor: {type: "sap.suite.ui.microchart.CommonBackgroundType", group: "Misc", defaultValue: "MediumLight"},

			/**
			 * If this set to true, width and height of the control are determined by the width and height of the container in which the control is placed. Size and Width properties are ignored in such case.
			 * @since 1.38.0
			 */
			isResponsive: {type: "boolean", group: "Appearance", defaultValue: false}
		},
		defaultAggregation : "actual",
		aggregations: {
			/**
			 * Actual data of the BulletMicroChart.
			 */
			actual: {type: "sap.suite.ui.microchart.BulletMicroChartData", multiple: false, bindable : "bindable"},

			/**
			 * Threshold data of the BulletMicroChart.
			 */
			thresholds: {type: "sap.suite.ui.microchart.BulletMicroChartData", multiple: true, singularName: "threshold", bindable : "bindable"}
		},
		events: {
			/**
			 * The event is triggered when the chart is pressed.
			 */
			press : {}
		}
	}});

	BulletMicroChart.EDGE_CASE_WIDTH_RESIZEFONT = 168;

	BulletMicroChart.prototype.init = function() {
		this._oRb = sap.ui.getCore().getLibraryResourceBundle("sap.suite.ui.microchart");
		this.setAggregation("tooltip", "{AltText}", true);
		this._bThemeApplied = true;
		if (!sap.ui.getCore().isInitialized()) {
			this._bThemeApplied = false;
			sap.ui.getCore().attachInit(this._handleCoreInitialized.bind(this));
		} else {
			this._handleCoreInitialized();
		}
	};

	/**
	 * Handler for the core's init event. The control will only be rendered if all
	 * themes are loaded and everything is properly initialized. We attach a theme
	 * check here.
	 *
	 * @private
	 */
	BulletMicroChart.prototype._handleCoreInitialized = function() {
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
	BulletMicroChart.prototype._handleThemeApplied = function() {
		this._bThemeApplied = true;
		this.invalidate();
		sap.ui.getCore().detachThemeChanged(this._handleThemeApplied, this);
	};

	/**
	 * Calculates the width in percents of the chart elements according to the provided chart values.
	 *
	 * @returns {Object} object that contains calculated values for actual value, target value, thresholds and their colors.
	 * @private
	 */
	BulletMicroChart.prototype._calculateChartData = function() {
		var fScaleWidthPct = 98,
			aThresholds = this.getThresholds(),
			aCalculatedThresholds = [],
			fTarget = this.getTargetValue(),
			fForecast = this.getForecastValue(),
			fActual = this.getActual() && this.getActual().getValue() ? this.getActual().getValue() : 0,
			aValues = [],
			fLowestValue = 0,
			fHighestValue = 0,
			fTotal = 0,
			i;

		if (this.getActual() && this.getActual()._isValueSet) {
			aValues.push(fActual);
		}

		if (this._isForecastValueSet) {
			aValues.push(fForecast);
		}

		if (this._isTargetValueSet) {
			aValues.push(fTarget);
		}

		if (this._isMinValueSet) {
			aValues.push(this.getMinValue());
		}

		if (this._isMaxValueSet) {
			aValues.push(this.getMaxValue());
		}

		for (i = 0; i < aThresholds.length; i++) {
			aValues.push(aThresholds[i].getValue());
		}

		if (aValues.length > 0) {
			fLowestValue = fHighestValue = aValues[0];
			for (i = 0; i < aValues.length; i++){
				if (aValues[i] < fLowestValue) {
					fLowestValue = aValues[i];
				}
				if (aValues[i] > fHighestValue) {
					fHighestValue = aValues[i];
				}
			}

			fHighestValue = (fHighestValue < 0 && fHighestValue < 3 * (fLowestValue - fHighestValue)) ? 0 : fHighestValue;
			fLowestValue = (fLowestValue > 0 && fLowestValue > 3 * (fHighestValue - fLowestValue)) ? 0 : fLowestValue;

			fTotal = fHighestValue - fLowestValue;

			for (i = 0; i < aThresholds.length; i++) {
				aCalculatedThresholds[i] = {color: aThresholds[i].getColor(), valuePct: (!aThresholds[i]._isValueSet || fTotal === 0) ? 0 : ((aThresholds[i].getValue() - fLowestValue) * fScaleWidthPct / fTotal).toFixed(2)};
			}
		}

		var nActualValuePct, nTargetValuePct;
		if (this.getMode() === library.BulletMicroChartModeType.Delta) {
			// In case delat mode is used, the zero handling is different, as the left position is 49 instead of 0
			nActualValuePct = (!this.getActual() || !this.getActual()._isValueSet || fTotal === 0) ? 49 : (0.05 + (fActual - fLowestValue) * fScaleWidthPct / fTotal).toFixed(2);
			nTargetValuePct = (!this._isTargetValueSet || fTotal === 0) ? 49 : ((fTarget - fLowestValue) * fScaleWidthPct / fTotal).toFixed(2);
		} else {
			nActualValuePct = (!this.getActual() || !this.getActual()._isValueSet || fTotal === 0 || fLowestValue === 0 && this.getActual().getValue() === 0) ? 0 : (0.05 + (fActual - fLowestValue) * fScaleWidthPct / fTotal).toFixed(2);
			nTargetValuePct = (!this._isTargetValueSet || fTotal === 0) ? 0 : ((fTarget - fLowestValue) * fScaleWidthPct / fTotal).toFixed(2);
		}
		return {
			actualValuePct: nActualValuePct,
			targetValuePct: nTargetValuePct,
			forecastValuePct: (!this._isForecastValueSet || fTotal === 0) ? 0 : ((fForecast - fLowestValue) * fScaleWidthPct / fTotal).toFixed(2),
			thresholdsPct: aCalculatedThresholds,
			fScaleWidthPct: fScaleWidthPct
		};
	};

	/**
	 * Calculates the number of digits after the decimal point.
	 *
	 * @param {float} fValue float value
	 * @returns {int} number of digits after the decimal point in fValue.
	 * @private
	 */
	BulletMicroChart.prototype._digitsAfterDecimalPoint = function(fValue) {
		var sAfter = ("" + fValue).match(/[.,](\d+)/g);
		return (sAfter) ? ("" + sAfter).length - 1 : 0;
	};

	/**
	 * Calculates the delta between actual value and threshold.
	 *
	 * @returns {number} Delta value of delta between actual value and threshold.
	 * @private
	 */
	BulletMicroChart.prototype._calculateDeltaValue = function() {
		if (!this.getActual()._isValueSet || !this._isTargetValueSet) {
			return 0;
		} else {
			var fActual = this.getActual().getValue();
			var fTarget = this.getTargetValue();
			return Math.abs(fActual - fTarget).toFixed(Math.max(this._digitsAfterDecimalPoint(fActual), this._digitsAfterDecimalPoint(fTarget)));
		}
	};


	BulletMicroChart.prototype.setMinValue = function(fMinValue) {
		this._isMinValueSet = this._fnIsNumber(fMinValue);
		return this.setProperty("minValue", this._isMinValueSet ? fMinValue : NaN);
	};


	BulletMicroChart.prototype.setMaxValue = function(fMaxValue) {
		this._isMaxValueSet = this._fnIsNumber(fMaxValue);
		return this.setProperty("maxValue", this._isMaxValueSet ? fMaxValue : NaN);
	};


	BulletMicroChart.prototype.setTargetValue = function(fTargetValue) {
		this._isTargetValueSet = this._fnIsNumber(fTargetValue);
		return this.setProperty("targetValue", this._isTargetValueSet ? fTargetValue : NaN);
	};


	BulletMicroChart.prototype.setForecastValue = function(fForecastValue) {
		this._isForecastValueSet = this._fnIsNumber(fForecastValue);
		return this.setProperty("forecastValue", this._isForecastValueSet ? fForecastValue : NaN);
	};

	BulletMicroChart.prototype.setSize = function(size) {
		if (this.getSize() !== size) {
			if (size === MobileLibrary.Size.Responsive) {
				this.setProperty("isResponsive", true, true);
			} else {
				this.setProperty("isResponsive", false, true);
			}
			this.setProperty("size", size, false);
		}
		return this;
	};

	BulletMicroChart.prototype.ontap = function(oEvent) {
		if (Device.browser.msie) {
			this.$().focus();
		}
		this.firePress();
	};

	BulletMicroChart.prototype.onkeydown = function(oEvent) {
		if (oEvent.which ===  jQuery.sap.KeyCodes.SPACE) {
			oEvent.preventDefault();
		}
	};

	BulletMicroChart.prototype.onkeyup = function(oEvent) {
		if (oEvent.which === jQuery.sap.KeyCodes.ENTER || oEvent.which === jQuery.sap.KeyCodes.SPACE) {
			this.firePress();
			oEvent.preventDefault();
		}
	};

	BulletMicroChart.prototype._fnIsNumber = function(value) {
		return typeof value === 'number' && !isNaN(value) && isFinite(value);
	};

	BulletMicroChart.prototype.attachEvent = function(sEventId, oData, fnFunction, oListener) {
		Control.prototype.attachEvent.call(this, sEventId, oData, fnFunction, oListener);
		if (this.hasListeners("press")) {
			this.$().attr("tabindex", 0).addClass("sapSuiteUiMicroChartPointer");
		}
		return this;
	};

	BulletMicroChart.prototype.detachEvent = function(sEventId, fnFunction, oListener) {
		Control.prototype.detachEvent.call(this, sEventId, fnFunction, oListener);
		if (!this.hasListeners("press")) {
			this.$().removeAttr("tabindex").removeClass("sapSuiteUiMicroChartPointer");
		}
		return this;
	};

	BulletMicroChart.prototype.onBeforeRendering = function() {
		if (library._isInGenericTile(this)) {
			this.setIsResponsive(true);
			library._removeStandardMargins(this);
		}
		if (this._sChartResizeHandlerId ) {
			ResizeHandler.deregister(this._sChartResizeHandlerId);
		}
		if (this.getIsResponsive() && !this.data("_parentRenderingContext") && jQuery.isFunction(this.getParent)) {
			this.data("_parentRenderingContext", this.getParent());
		}

		//removes handler for mouseenter event
		this._unbindMouseEnterLeaveHandler();
	};

	BulletMicroChart.prototype.onAfterRendering = function() {
		if (this.getIsResponsive()) {
			this._adjustToParent();
		}
		library._checkControlIsVisible(this, this._onControlIsVisible);

		//attaches handler for mouseenter event
		this._bindMouseEnterLeaveHandler();
	};

	/**
	 * Callback function which is called when the control is visible, which means that the check via
	 * library._checkControlIsVisible was successful.
	 *
	 * @private
	 */
	BulletMicroChart.prototype._onControlIsVisible = function() {
		this._onResize();
		this._sChartResizeHandlerId = ResizeHandler.register(this, jQuery.proxy(this._onResize, this));
		if (this.getShowValueMarker()) {
			this._adjustValueToMarker();
		}
	};

	/**
	 * Conducts size adjustments that are necessary if the dimensions of the chart change.
	 *
	 * @private
	 */
	BulletMicroChart.prototype._onResize = function() {
		if (this.getIsResponsive()) {
			this.$().removeClass("sapSuiteBMCSmallFont sapSuiteBMCNoLabels");
			this._adjustLabelsPos();
			this._resizeHorizontally();
			this._resizeVertically();
		} else {
			this._adjustLabelsPos();
		}
	};

	/**
	 * Adjusts the height and width of the whole control if this is required depending on parent control.
	 *
	 * @private
	 */
	BulletMicroChart.prototype._adjustToParent = function() {
		if (this.data("_parentRenderingContext") && this.data("_parentRenderingContext") instanceof FlexBox) {
			var $Parent = this.data("_parentRenderingContext").$();
			var sParentHeight = parseInt($Parent.height(), 10);
			var sParentWidth = parseInt($Parent.width(), 10);
			var $this = this.$();
			$this.outerHeight(sParentHeight - parseInt($this.css("margin-top"), 10) - parseInt($this.css("margin-bottom"), 10));
			$this.outerWidth(sParentWidth - parseInt($this.css("margin-left"), 10) - parseInt($this.css("margin-right"), 10));
		}
	};

	/**
	 * Performs vertical responsiveness adjustment. Assumes that the height of the control will not change afterwards. Assumes that all the CSS have already been loaded and are available.
	 *
	 * @private
	 */
	BulletMicroChart.prototype._resizeVertically  = function() {
		var $this = this.$();
		var $OuterVerticalAlignmentContainer = $this.find(".sapSuiteBMCVerticalAlignmentContainer.sapSuiteBMCWholeControl");
		var $Canvas = $this.find(".sapSuiteBMCChartCanvas");
		// preparing resizing thresholds
		var iMaxChartHeight = parseInt($OuterVerticalAlignmentContainer.css("max-height"), 10);
		var iMinChartHeight = parseInt($OuterVerticalAlignmentContainer.css("min-height"), 10);
		var iMinCanvasHeight = parseInt($Canvas.css("min-height"), 10);
		var iCurrentControlHeight = parseInt($this.css("height"), 10);

		// font resizing
		if (iCurrentControlHeight < iMaxChartHeight) {
			$this.addClass("sapSuiteBMCSmallFont");
		}
		// vertical resizing
		if (iCurrentControlHeight < iMinCanvasHeight) {
			$this.hide();
		} else if (iCurrentControlHeight < iMinChartHeight) {
			$this.addClass("sapSuiteBMCNoLabels");
		}
	};

	/**
	 * Performs horizontal responsiveness adjustment. Assumes that the width of the control will not change afterwards. Assumes that all the CSS have already been loaded and are available.
	 *
	 * @private
	 */
	BulletMicroChart.prototype._resizeHorizontally = function() {
		var $this = this.$();
		var $OuterVerticalAlignmentContainer = $this.find(".sapSuiteBMCVerticalAlignmentContainer.sapSuiteBMCWholeControl");
		var iMinChartWidth = parseInt($OuterVerticalAlignmentContainer.css("min-width"), 10);
		var iCurrentControlWidth = parseInt($this.css("width"), 10);

		if (iCurrentControlWidth <= iMinChartWidth) {
			$this.hide();
			return;
		}
		if (iCurrentControlWidth < BulletMicroChart.EDGE_CASE_WIDTH_RESIZEFONT || this._isTruncatedLabel($this)) {
			$this.addClass("sapSuiteBMCSmallFont");
		}
		if (this._isTruncatedLabel($this)) {
			$this.hide();
		}
	};

	/**
	 * Checks if any label on the chart is truncated.
	 * @returns {boolean} True if the label is truncated, false if not.
	 * @private
	 */
	BulletMicroChart.prototype._isTruncatedLabel = function() {
		var $Labels = this.$().find(".sapSuiteBMCItemValue, .sapSuiteBMCTargetBarValue");
		for (var i = 0; i < $Labels.length; i++) {
			if ($Labels[i].scrollWidth > $Labels[i].offsetWidth) {
				return true;
			}
		}
		return false;
	};

	BulletMicroChart.prototype.exit = function() {
		ResizeHandler.deregister(this._sChartResizeHandlerId);
	};

	BulletMicroChart.prototype._adjustLabelsPos = function() {
		var bRtl = sap.ui.getCore().getConfiguration().getRTL();
		var oTBarVal = jQuery.sap.byId(this.getId() + "-bc-target-bar-value");
		var oChartBar = jQuery.sap.byId(this.getId() + "-chart-bar");
		var fFullWidth = oChartBar.width();
		if (fFullWidth) {
			var fTValWidth = 0;
			if (oTBarVal && oTBarVal.offset()) {
				fTValWidth = oTBarVal.offset().left - oChartBar.offset().left;
				if (bRtl) {
					fTValWidth = fFullWidth - fTValWidth;
				}
				this._adjustLabelPos(jQuery.sap.byId(this.getId() + "-bc-target-value"), fFullWidth, fTValWidth, bRtl);
			}

			var oValMarker = jQuery.sap.byId(this.getId() + "-bc-bar-value-marker");
			if (oValMarker && oValMarker.offset()) {
				var fAValWidth = oValMarker.offset().left - oChartBar.offset().left;
				if (bRtl) {
					fAValWidth = fFullWidth - fAValWidth;
				}

				if (this.getMode() === library.BulletMicroChartModeType.Delta) {
					fAValWidth = (fAValWidth + fTValWidth) / 2;
				}

				this._adjustLabelPos(jQuery.sap.byId(this.getId() + "-bc-item-value"), fFullWidth, fAValWidth, bRtl);
			}
		}
	};

	BulletMicroChart.prototype._adjustLabelPos = function(oLabel, fFullWidth, fOffset, bRtl) {
		var sDirection = bRtl ? "right" : "left";
		var fLabelWidth = oLabel.width();
		if (fLabelWidth > fFullWidth) {
			oLabel.css("width", "" + fFullWidth + "px");
			oLabel.css(sDirection, "0");
		} else {
			var fLabelLeft = fOffset - 0.5 * fLabelWidth;
			if (fLabelLeft < 0) {
				fLabelLeft = 0;
			}

			if (fLabelLeft + fLabelWidth > fFullWidth) {
				fLabelLeft = fFullWidth - fLabelWidth;
			}
			oLabel.css(sDirection, fLabelLeft);
			oLabel.css("width", "" + (parseInt(fLabelWidth, 10) + 1) + "px");
		}
	};

	BulletMicroChart.prototype._adjustValueToMarker = function() {
		var oValue = this.$("bc-bar-value");
		var oMarker = this.$("bc-bar-value-marker");
		if (oValue.offset() && oMarker.offset()) {
			var fValueWidth = oValue.width();
			var fValueLeft = oValue.offset().left;
			var fMarkerWidth = oMarker.width();
			var fMarkerLeft = oMarker.offset().left;

			if (sap.ui.getCore().getConfiguration().getRTL()) {
				if (fMarkerLeft < fValueLeft) { // browser's subpixel problem fix
					oMarker.css("right", "");
					oMarker.offset({left: fValueLeft});
				}
				if (fMarkerLeft + fMarkerWidth > fValueLeft + fValueWidth) { // bar value is less than marker min-width
					oMarker.css("right", "");
					oMarker.offset({left: fValueLeft + fValueWidth - fMarkerWidth});
				}
			} else {
				if (fMarkerLeft < fValueLeft) { // bar value is less than marker min-width
					oMarker.offset({left: fValueLeft});
				}
				if (fMarkerLeft + fMarkerWidth > fValueLeft + fValueWidth) { // browser's subpixel problem fix
					oValue.width(fMarkerLeft + fMarkerWidth - fValueLeft);
				}
			}
		}
	};

	BulletMicroChart.prototype._getLocalizedColorMeaning = function(sColor) {
		return this._oRb.getText(("SEMANTIC_COLOR_" + sColor).toUpperCase());
	};

	BulletMicroChart.prototype.getAltText = function() {
		var bIsActualSet = this.getActual() && this.getActual()._isValueSet;
		var sScale = this.getScale();
		var sTargetValueLabel = this.getTargetValueLabel();
		var sMeaning = !this.getActual() || !this.getActual().getColor() ? "" : this._getLocalizedColorMeaning(this.getActual().getColor());

		var sAltText = "";

		if (bIsActualSet) {
			var sActualValueLabel = this.getActualValueLabel();
			var sAValToShow = (sActualValueLabel) ? sActualValueLabel : "" + this.getActual().getValue();
			sAltText += this._oRb.getText("BULLETMICROCHART_ACTUAL_TOOLTIP", [sAValToShow + sScale, sMeaning]);
		}
		if (this.getMode() === library.BulletMicroChartModeType.Delta) {
			if (this._isTargetValueSet && bIsActualSet) {
				var sDeltaValueLabel = this.getDeltaValueLabel();
				var sDValToShow = (sDeltaValueLabel) ? sDeltaValueLabel : "" + this._calculateDeltaValue();
				sAltText += "\n" + this._oRb.getText("BULLETMICROCHART_DELTA_TOOLTIP", [sDValToShow + sScale, sMeaning]);
			}
		} else if (this._isForecastValueSet) {
			sAltText += (this._isForecastValueSet) ? "\n" + this._oRb.getText("BULLETMICROCHART_FORECAST_TOOLTIP", [this.getForecastValue() + sScale, sMeaning]) : "";
		}

		if (this._isTargetValueSet) {
			var sTValToShow = (sTargetValueLabel) ? sTargetValueLabel : "" + this.getTargetValue();
			sAltText += "\n" + this._oRb.getText("BULLETMICROCHART_TARGET_TOOLTIP", [sTValToShow + sScale]);
		}

		var aThresholds = this.getThresholds().sort(function(oFirst, oSecond) { return oFirst.getValue() - oSecond.getValue(); });

		for (var i = 0; i < aThresholds.length; i++) {
			var oThreshold = aThresholds[i];
			sAltText += "\n" + this._oRb.getText("BULLETMICROCHART_THRESHOLD_TOOLTIP", [oThreshold.getValue() + this.getScale(), this._getLocalizedColorMeaning(oThreshold.getColor())]);
		}

		return sAltText;
	};

	BulletMicroChart.prototype.getTooltip_AsString = function() { //eslint-disable-line
		var oTooltip = this.getTooltip();
		var sTooltip = this.getAltText();

		if (typeof oTooltip === "string" || oTooltip instanceof String) {
			sTooltip = oTooltip.split("{AltText}").join(sTooltip).split("((AltText))").join(sTooltip);
			return sTooltip;
		} else if (this.isBound("tooltip") && !oTooltip) {
			return sTooltip;
		}
		return oTooltip ? oTooltip : "";
	};

	/**
	 * Returns the translated accessibility control type. It describes the type of the MicroChart control.
	 *
	 * @returns {string} The translated accessibility control type
	 * @private
	 */
	BulletMicroChart.prototype._getAccessibilityControlType = function() {
		return this._oRb.getText("ACC_CTR_TYPE_BULLETMICROCHART");
	};

	BulletMicroChart.prototype.clone = function(sIdSuffix, aLocalIds, oOptions) {
		var oClone = Control.prototype.clone.apply(this, arguments);
		oClone._isMinValueSet = this._isMinValueSet;
		oClone._isMaxValueSet = this._isMaxValueSet;
		oClone._isForecastValueSet = this._isForecastValueSet;
		oClone._isTargetValueSet = this._isTargetValueSet;
		return oClone;
	};

	/**
	 * Adds the title attribute to show the tooltip when the mouse enters the chart.
	 *
	 * @private
	 */
	BulletMicroChart.prototype._addTitleAttribute = function() {
		if (!this.$().attr("title")) {
			this.$().attr("title", this.getTooltip_AsString());
		}
	};

	/**
	 * Removes the title attribute to hide the tooltip when the mouse leaves the chart.
	 *
	 * @private
	 */
	BulletMicroChart.prototype._removeTitleAttribute = function() {
		if (this.$().attr("title")) {
			this.$().removeAttr("title");
		}
	};

	/**
	 * Binds the handlers for mouseenter mouseleave events.
	 *
	 * @private
	 */
	BulletMicroChart.prototype._bindMouseEnterLeaveHandler = function () {

		// handlers need to be saved intermediately in order to unbind successfully
		if (!this._oMouseEnterLeaveHandler) {
			this._oMouseEnterLeaveHandler = {
				mouseEnterChart: this._addTitleAttribute.bind(this),
				mouseLeaveChart: this._removeTitleAttribute.bind(this)
			};
		}
		// bind events on chart
		this.$().bind("mouseenter", this._oMouseEnterLeaveHandler.mouseEnterChart);
		this.$().bind("mouseleave", this._oMouseEnterLeaveHandler.mouseLeaveChart);
	};

	/**
	 * Unbinds the handlers for mouseenter mouseleave events.
	 *
	 * @private
	 */
	BulletMicroChart.prototype._unbindMouseEnterLeaveHandler = function () {
		if (this._oMouseEnterLeaveHandler) {
			this.$().unbind("mouseenter", this._oMouseEnterLeaveHandler.mouseEnterChart);
			this.$().unbind("mouseleave", this._oMouseEnterLeaveHandler.mouseLeaveChart);
		}
	};

	library._overrideGetAccessibilityInfo(BulletMicroChart.prototype);

	return BulletMicroChart;
});
