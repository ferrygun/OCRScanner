/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	"jquery.sap.global", "./library", "sap/m/library", "sap/m/FlexBox", "sap/ui/core/Control", "sap/ui/Device", "sap/ui/core/ResizeHandler"
], function(jQuery, library, MobileLibrary, FlexBox, Control, Device, ResizeHandler) {
	"use strict";

	/**
	 * Constructor for a new DeltaMicroChart control.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Represents the delta of two values as a chart. This control replaces the deprecated sap.suite.ui.commons.DeltaMicroChart.
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 * @since 1.34
	 *
	 * @public
	 * @alias sap.suite.ui.microchart.DeltaMicroChart
	 * @ui5-metamodel This control will also be described in the UI5 (legacy) designtime metamodel
	 */
	var DeltaMicroChart = Control.extend("sap.suite.ui.microchart.DeltaMicroChart", /** @lends sap.suite.ui.microchart.DeltaMicroChart.prototype */ { metadata: {

		library: "sap.suite.ui.microchart",
		properties: {

			/**
			 * The first value for delta calculation.
			 */
			value1: {type: "float", group: "Misc", defaultValue: null},

			/**
			 * The second value for delta calculation.
			 */
			value2: {type: "float", group: "Misc", defaultValue: null},

			/**
			 * The first value title.
			 */
			title1: {type: "string", group: "Misc", defaultValue: null},

			/**
			 * The second value title.
			 */
			title2: {type: "string", group: "Misc", defaultValue: null},

			/**
			 * If this property is set, it is rendered instead of value1.
			 */
			displayValue1: {type: "string", group: "Misc", defaultValue: null},

			/**
			 * If this property is set, it is rendered instead of value2.
			 */
			displayValue2: {type: "string", group: "Misc", defaultValue: null},

			/**
			 * If this property is set, it is rendered instead of a calculated delta.
			 */
			deltaDisplayValue: {type: "string", group: "Misc", defaultValue: null},

			/**
			 * The semantic color of the delta value.
			 */
			color: {type: "sap.m.ValueColor", group: "Misc", defaultValue: "Neutral"},

			/**
			 * The width of the chart.
			 */
			width: {type: "sap.ui.core.CSSSize", group: "Misc"},

			/**
			 * The size of the chart. If is not set, the default size is applied based on the device type.
			 */
			size: {type: "sap.m.Size", group: "Misc", defaultValue: "Auto"},

			/**
			 * If this set to true, width and height of the control are determined by the width and height of the container in which the control is placed. Size and Width properties are ignored in such case.
			 * @since 1.38.0
			 */
			isResponsive: {type: "boolean", group: "Appearance", defaultValue: false}

		},

		events: {

			/**
			 * The event is triggered when the chart is pressed.
			 */
			press: {}

		}

	}});

	DeltaMicroChart.EDGE_CASE_WIDTH_RESIZEFONT = 168; // Corresponds to M size width 10.5rem
	DeltaMicroChart.EDGE_CASE_HEIGHT_SHOW_BOTTOM_LABEL = 16; // 1rem on the basis of design
	DeltaMicroChart.EDGE_CASE_HEIGHT_SHOW_TOP_BOTTOM_LABELS = 32; // 2rem on the basis of design

	DeltaMicroChart.prototype.init = function() {
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

	DeltaMicroChart.prototype.setSize = function(size) {
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

	/**
	 * Handler for the core's init event. The control will only be rendered if all themes are loaded
	 * and everything is properly initialized. We attach a theme check here.
	 *
	 * @private
	 */
	DeltaMicroChart.prototype._handleCoreInitialized = function() {
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
	DeltaMicroChart.prototype._handleThemeApplied = function() {
		this._bThemeApplied = true;
		this.invalidate();
		sap.ui.getCore().detachThemeChanged(this._handleThemeApplied, this);
	};

	DeltaMicroChart.prototype._calcChartData = function() {
		var fVal1 = this.getValue1();
		var fVal2 = this.getValue2();

		var fMin = Math.min(fVal1, fVal2, 0);
		var fMax = Math.max(fVal1, fVal2, 0);
		var fTotal = fMax - fMin;

		function calcPercent(fVal) {
			return (fTotal === 0 ?  0 : Math.abs(fVal) / fTotal * 100).toFixed(2);
		}

		var oConf = {};
		var fDelta = fVal1 - fVal2;

		oConf.delta = {
			left: fMax === 0,
			width: calcPercent(fDelta),
			isFirstStripeUp: fVal1 < fVal2,
			isMax: (fVal1 < 0 && fVal2 >= 0) || (fVal1 >= 0 && fVal2 < 0),
			isZero: fVal1 === 0 && fVal2 === 0,
			isEqual: fDelta === 0
		};

		oConf.bar1 = {
			left: fVal2 >= 0,
			width: calcPercent(fVal1),
			isSmaller: Math.abs(fVal1) < Math.abs(fVal2)
		};

		oConf.bar2 = {
			left: fVal1 >= 0,
			width: calcPercent(fVal2),
			isSmaller: Math.abs(fVal2) < Math.abs(fVal1)
		};

		return oConf;
	};

	DeltaMicroChart.prototype._getLocalizedColorMeaning = function(sColor) {
		return this._oRb.getText(("SEMANTIC_COLOR_" + sColor).toUpperCase());
	};

	/**
	 * Calculates the number of digits after the decimal point.
	 *
	 * @param {float} fValue float value
	 * @returns {int} number of digits after the decimal point in fValue.
	 * @private
	 */
	DeltaMicroChart.prototype._digitsAfterDecimalPoint = function(fValue) {
		var sAfter = ("" + fValue).match(/[.,](\d+)/g);
		return (sAfter) ? ("" + sAfter).length - 1 : 0;
	};

	DeltaMicroChart.prototype.getAltText = function() {
		var sDv1 = this.getDisplayValue1();
		var sDv2 = this.getDisplayValue2();
		var sDdv = this.getDeltaDisplayValue();
		var fVal1 = this.getValue1();
		var fVal2 = this.getValue2();
		var sAdv1ToShow = sDv1 ? sDv1 : "" + fVal1;
		var sAdv2ToShow = sDv2 ? sDv2 : "" + fVal2;
		var sAddvToShow = sDdv ? sDdv : "" + Math.abs(fVal1 - fVal2).toFixed(Math.max(this._digitsAfterDecimalPoint(fVal1), this._digitsAfterDecimalPoint(fVal2)));
		var sMeaning = this._getLocalizedColorMeaning(this.getColor());

		return this.getTitle1() + " " + sAdv1ToShow + "\n" + this.getTitle2() + " " + sAdv2ToShow + "\n" +  this._oRb.getText("DELTAMICROCHART_DELTA_TOOLTIP", [sAddvToShow, sMeaning]);
	};

	DeltaMicroChart.prototype.getTooltip_AsString  = function() { //eslint-disable-line
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
	DeltaMicroChart.prototype._getAccessibilityControlType = function() {
		return this._oRb.getText("ACC_CTR_TYPE_DELTAMICROCHART");
	};

	DeltaMicroChart.prototype._isCalcSupported = function() {
		return jQuery.sap.byId(this.getId() + "-calc").css("max-width") === "11px";
	};

	DeltaMicroChart.prototype._isRoundingSupported = function() {
		return jQuery.sap.byId(this.getId() + "-calc1").width() === 4;
	};

	DeltaMicroChart.prototype.onBeforeRendering = function() {
		if (library._isInGenericTile(this)) {
			this.setIsResponsive(true);
			library._removeStandardMargins(this);
		}
		this._oChartData = this._calcChartData();
		if (this._sResizeHandlerId) {
			ResizeHandler.deregister(this._sResizeHandlerId);
		}
		this.$().unbind("mouseenter", this._addTitleAttribute);
		this.$().unbind("mouseleave", this._removeTitleAttribute);
	};

	DeltaMicroChart.prototype.onAfterRendering = function() {
		this._bCalc = this._isCalcSupported();
		this._bRounding = this._isRoundingSupported();

		if (this.getIsResponsive()){
			this._adjustToParent();
		}
		library._checkControlIsVisible(this, this._onControlIsVisible);

		//attaches handler for mouse enter event
		this.$().bind("mouseenter", this._addTitleAttribute.bind(this));
		this.$().bind("mouseleave", this._removeTitleAttribute.bind(this));
	};

	/**
	 * Callback function which is called when the control is visible, which means that the check via
	 * library._checkControlIsVisible was successful.
	 *
	 * @private
	 */
	DeltaMicroChart.prototype._onControlIsVisible = function() {
		if (this.getIsResponsive()){
			this._resizeVertically();
			this._resizeHorizontally();
		}
		if (!this._bCalc || !this._bRounding) {
			var oChart = jQuery.sap.domById(this.getId() + "-dmc-chart");
			this._sResizeHandlerId = ResizeHandler.register(oChart,  jQuery.proxy(this._adjust, this));

			if (!this._bCalc) {
				this._adjustCalc();
			}

			if (!this._bRounding) {
				this._adjustRound();
			}
		}
	};

	/**
	 * Adjusts the height and width of the whole control if this is required depending on parent control.
	 *
	 * @private
	 */
	DeltaMicroChart.prototype._adjustToParent = function() {
		if (jQuery.isFunction(this.getParent) && this.getParent() instanceof FlexBox) {
			var sParentHeight = parseInt(this.getParent().$().height(), 10);
			var sParentWidth = parseInt(this.getParent().$().width(), 10);
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
	DeltaMicroChart.prototype._resizeVertically = function() {
		var $this = this.$();
		var $VerticalCenteredWrapper = $this.find(".sapSuiteDMCVerticalAlignmentContainer");
		var $Chart = $this.find(".sapSuiteDMCResponsive.sapSuiteDMCChart");
		var $LeftTopLabel = $this.find(".sapSuiteDMCPositionTop.sapSuiteDMCTitle");
		var $RightTopLabel = $this.find(".sapSuiteDMCLbls .sapSuiteDMCValue1");
		var $RightMiddleLabel = $this.find(".sapSuiteDMCLbls .sapSuiteDMCDelta");

		// preparing resizing thresholds
		var iHeightThrescholdHideChart = DeltaMicroChart.EDGE_CASE_HEIGHT_SHOW_TOP_BOTTOM_LABELS + parseInt($Chart.css("min-height"), 10);

		// font resizing
		var iVerticalCenteredWrapperHeigth = parseInt($VerticalCenteredWrapper.css("height"), 10);
		var iHeight = parseInt($this.css("height"), 10);
		if (iHeight <= iVerticalCenteredWrapperHeigth){
			$this.addClass("sapSuiteDMCSmallFont");
		}

		// vertical resizing
		if (iHeight < DeltaMicroChart.EDGE_CASE_HEIGHT_SHOW_BOTTOM_LABEL){
			$this.hide();
		} else if (iHeight < DeltaMicroChart.EDGE_CASE_HEIGHT_SHOW_TOP_BOTTOM_LABELS){
			$RightTopLabel.hide();
			$RightMiddleLabel.hide();
			$LeftTopLabel.hide();
			$Chart.hide();
		} else if (iHeight <= iHeightThrescholdHideChart){
			$RightMiddleLabel.hide();
			$Chart.hide();
		}
	};

	/**
	 * Performs horizontal responsiveness adjustment. Assumes that the width of the control will not change afterwards. Assumes that all the CSS have already been loaded and are available.
	 *
	 * @private
	 */
	DeltaMicroChart.prototype._resizeHorizontally = function() {
		var $this = this.$();
		// jQuery objects necessary for resizing
		var $LeftSide = $this.find(".sapSuiteDMCResponsive.sapSuiteDMCCnt");
		var $RightSide = $this.find(".sapSuiteDMCResponsive.sapSuiteDMCLbls");
		var iCurrentControlWidth = parseInt($this.css("width"), 10);

		// preparing resizing thresholds
		var iWidthThrescholdHideLeftSide = parseInt($LeftSide.css("min-width"), 10);

		if (iCurrentControlWidth < DeltaMicroChart.EDGE_CASE_WIDTH_RESIZEFONT || !this._rightSideTruncated($RightSide)) {
			$this.addClass("sapSuiteDMCSmallFont");
		}

		if (!this._rightSideTruncated($RightSide)) {
			//Never truncate numeric values on the right
			$this.hide();
		}

		if (parseInt($LeftSide.css("width"), 10) <= iWidthThrescholdHideLeftSide) {
			// The space on the left is too small even for truncated text in labels
			$LeftSide.hide();
		}
	};

	/**
	 * Checks if the whole control has enough width to display the right side of the control without truncation.
	 * @param {jQuery} $RightSide The label part of the row
	 * @returns {boolean} True if the given element's width is smaller than or equal to the chart's, otherwise false
	 * @private
	 */
	DeltaMicroChart.prototype._rightSideTruncated = function($RightSide) {
		return parseInt(this.$().css("width"), 10) >= parseInt($RightSide.css("width"), 10);
	};

	DeltaMicroChart.prototype._adjust = function() {
		if (!this._bCalc) {
			this._adjustCalc();
		}

		if (!this._bRounding) {
			this._adjustRound();
		}
	};

	DeltaMicroChart.prototype._adjustRound = function() {
		var iChartWidth = jQuery.sap.byId(this.getId() + "-dmc-chart").width();
		var iDeltaWidth = Math.round(iChartWidth * this._oChartData.delta.width / 100);

		jQuery.sap.byId(this.getId() + "-dmc-bar-delta").width(iDeltaWidth);

		if (this._oChartData.bar1.isSmaller && !this._oChartData.delta.isMax) {
			jQuery.sap.byId(this.getId() + "-dmc-bar1").width(iChartWidth - iDeltaWidth);
		}

		if (this._oChartData.bar2.isSmaller && !this._oChartData.delta.isMax) {
			jQuery.sap.byId(this.getId() + "-dmc-bar2").width(iChartWidth - iDeltaWidth);
		}
	};

	DeltaMicroChart.prototype._adjustCalc = function() {
		var iChartWidth = jQuery.sap.byId(this.getId() + "-dmc-chart").width();

		function adjustBar(oBar) {
			oBar.css("max-width", iChartWidth - parseInt(oBar.css("max-width"), 10) + "px");
		}

		adjustBar(jQuery.sap.byId(this.getId() + "-dmc-bar1"));
		adjustBar(jQuery.sap.byId(this.getId() + "-dmc-bar2"));
		adjustBar(jQuery.sap.byId(this.getId() + "-dmc-bar-delta"));
	};

	DeltaMicroChart.prototype.attachEvent = function(sEventId, oData, fnFunction, oListener) {
		Control.prototype.attachEvent.call(this, sEventId, oData, fnFunction, oListener);
		if (this.hasListeners("press")) {
			this.$().attr("tabindex", 0).addClass("sapSuiteUiMicroChartPointer");
		}
		return this;
	};

	DeltaMicroChart.prototype.detachEvent = function(sEventId, fnFunction, oListener) {
		Control.prototype.detachEvent.call(this, sEventId, fnFunction, oListener);
		if (!this.hasListeners("press")) {
			this.$().removeAttr("tabindex").removeClass("sapSuiteUiMicroChartPointer");
		}
		return this;
	};

	DeltaMicroChart.prototype.ontap = function(oEvent) {
		if (Device.browser.msie) {
			this.$().focus();
		}
		this.firePress();
	};

	DeltaMicroChart.prototype.onkeydown = function(oEvent) {
		if (oEvent.which === jQuery.sap.KeyCodes.SPACE) {
			oEvent.preventDefault();
		}
	};

	DeltaMicroChart.prototype.onkeyup = function(oEvent) {
		if (oEvent.which === jQuery.sap.KeyCodes.ENTER || oEvent.which === jQuery.sap.KeyCodes.SPACE) {
			this.firePress();
			oEvent.preventDefault();
		}
	};

	/**
	 * Adds title attribute to show tooltip when the mouse enters chart.
	 *
	 * @private
	 */
	DeltaMicroChart.prototype._addTitleAttribute = function() {
		if (this.$().attr("title")) {
			return;
		} else {
			this.$().attr("title", this.getTooltip_AsString());
		}
	};

	/**
	 * Removes title attribute to let tooltip disappear when the mouse left the chart.
	 *
	 * @private
	 */
	DeltaMicroChart.prototype._removeTitleAttribute = function() {
		if (this.$().attr("title")) {
			this.$().removeAttr("title");
		}
	};

	library._overrideGetAccessibilityInfo(DeltaMicroChart.prototype);

	return DeltaMicroChart;
});
