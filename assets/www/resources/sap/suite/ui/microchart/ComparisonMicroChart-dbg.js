/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	"jquery.sap.global", "./library", "sap/ui/core/Control", "sap/m/Size", "sap/ui/Device", "sap/m/FlexBox"
], function(jQuery, library, Control, Size, Device, FlexBox) {
	"use strict";

	/**
	 * Constructor for a new ComparisonMicroChart control.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Illustrates values as colored bar charts with title, numeric value, and scaling factor in the content area. This control replaces the deprecated sap.suite.ui.commons.ComparisonChart.
	 * @extends sap.ui.core.Control
	 *
	 * @version 1.52.4
	 * @since 1.34
	 *
	 * @public
	 * @alias sap.suite.ui.microchart.ComparisonMicroChart
	 * @ui5-metamodel This control will also be described in the UI5 (legacy) design time metamodel
	 */
	var ComparisonMicroChart = Control.extend("sap.suite.ui.microchart.ComparisonMicroChart", /** @lends sap.suite.ui.microchart.ComparisonMicroChart.prototype */ { metadata : {

		library: "sap.suite.ui.microchart",
		properties: {
			/**
			 * The size of the chart. If not set, the default size is applied based on the size of the device tile.
			 */
			size: {type: "sap.m.Size", group: "Misc", defaultValue: "Auto"},

			/**
			 * The scaling suffix that is added to the actual and target values.
			 */
			scale: {type: "string", group: "Misc", defaultValue: ""},

			/**
			 * The minimum scale value for the chart used to define the value range of the scale for comparing different values.
			 * @since 1.42.0
			 */
			minValue: {type: "float", group: "Appearance", defaultValue: null},

			/**
			 * The maximum scale value for the chart used to define the value range of the scale for comparing different values.
			 * @since 1.42.0
			 */
			maxValue: {type: "float", group: "Appearance", defaultValue: null},

			/**
			 * The view of the chart. If not set, the Normal view is used by default.
			 */
			view: {type: "sap.suite.ui.microchart.ComparisonMicroChartViewType", group: "Appearance", defaultValue: "Normal"},

			/**
			 * The color palette for the chart. If this property is set, semantic colors defined in ComparisonData are ignored. Colors from the palette are assigned to each bar consequentially. When all the palette colors are used, assignment of the colors begins from the first palette color.
			 */
			colorPalette: {type: "string[]", group: "Appearance", defaultValue: []},

			/**
			 * If it is set to true, the height of the control is defined by its content.
			 */
			shrinkable: {type: "boolean", group: "Misc", defaultValue: false},

			/**
			 * The width of the chart. If it is not set, the size of the control is defined by the size property.
			 */
			width: {type: "sap.ui.core.CSSSize", group: "Misc"},

			/**
			 * Height of the chart.
			 */
			height: {type: "sap.ui.core.CSSSize", group: "Appearance"},

			/**
			 * If this set to true, width and height of the control are determined by the width and height of the container in which the control is placed. Size and Width properties are ignored in such case.
			 * @since 1.38.0
			 * */
			isResponsive: {type: "boolean", group: "Appearance", defaultValue: false}
		},
		defaultAggregation : "data",
		aggregations: {
			/**
			 * The comparison chart bar data.
			 */
			data: {type: "sap.suite.ui.microchart.ComparisonMicroChartData", multiple: true, bindable : "bindable"}
		},
		events: {
			/**
			 * The event is triggered when the chart is pressed.
			 */
			press : {}
		}
	}});

	ComparisonMicroChart.WIDTH_FONT_THRESHOLD = 168;
	ComparisonMicroChart.HEIGHT_PER_CHART_DISAPPEAR_THRESHOLD = 16;
	ComparisonMicroChart.EDGE_CASE_WIDTH_HIDE_CHART = 32;

	/* =========================================================== */
	/* API events */
	/* =========================================================== */

	ComparisonMicroChart.prototype.attachEvent = function(sEventId, oData, fnFunction, oListener) {
		Control.prototype.attachEvent.call(this, sEventId, oData, fnFunction, oListener);
		if (this.hasListeners("press")) {
			this.$().attr("tabindex", 0).addClass("sapSuiteUiMicroChartPointer");
		}

		return this;
	};

	ComparisonMicroChart.prototype.detachEvent = function(sEventId, fnFunction, oListener) {
		Control.prototype.detachEvent.call(this, sEventId, fnFunction, oListener);
		if (!this.hasListeners("press")) {
			this.$().removeAttr("tabindex").removeClass("sapSuiteUiMicroChartPointer");
		}
		return this;
	};

	ComparisonMicroChart.prototype.ontap = function(oEvent) {
		if (Device.browser.edge) {
			this.onclick(oEvent);
		}
	};

	ComparisonMicroChart.prototype.onclick = function(oEvent) {
		if (!this.fireBarPress(oEvent)) {
			this.firePress();
			if (Device.browser.msie || Device.browser.edge) {
				this.$().focus();
				oEvent.preventDefault();
			}
		}
	};

	ComparisonMicroChart.prototype.fireBarPress = function(oEvent) {
		var oBar = jQuery(oEvent.target);
		if (oBar && oBar.attr("data-bar-index")) {
			var iIndex = parseInt(oBar.attr("data-bar-index"), 10);
			var oComparisonData = this.getData()[iIndex];
			if (oComparisonData && oComparisonData.hasListeners("press")) {
				oComparisonData.firePress();
				oEvent.preventDefault();
				oEvent.stopImmediatePropagation();
				if (Device.browser.msie) {
					jQuery.sap.byId(this.getId() + "-chart-item-bar-" + iIndex).focus();
				}
				// find out which bar has tabindex = 0 at this moment
				var $Bars = this.$().find(".sapSuiteCpMCChartBar");
				var iBarFocusedIndex = $Bars.index(this.$().find(".sapSuiteCpMCChartBar[tabindex='0']"));
				this._switchTabindex(iBarFocusedIndex, iIndex, $Bars);
				return true;
			}
		}
		return false;
	};

	ComparisonMicroChart.prototype.onsaptabprevious = function() {
		this.$().css("outline-color", "");
	};

	ComparisonMicroChart.prototype.onsaptabnext = function() {
		var $Next = this.$().next();
		// when the next element is a focusable comparison chart, activate the outline
		if ($Next.hasClass("sapSuiteCpMC") && $Next.attr("tabindex")) {
			$Next.css("outline-color", "");
		}
	};

	ComparisonMicroChart.prototype.onsapenter = function(event) {
		if (!this.fireBarPress(event)) {
			this.firePress();
			event.preventDefault();
			event.stopImmediatePropagation();
		}
	};

	ComparisonMicroChart.prototype.onsapspace = ComparisonMicroChart.prototype.onsapenter;

	ComparisonMicroChart.prototype.onsapup = function(event) {
		var $Bars = this.$().find(".sapSuiteUiMicroChartPointer");
		if ($Bars.length > 0) {
			var iIndex = $Bars.index(event.target);
			this._switchTabindex(iIndex, iIndex - 1, $Bars);
		}
		event.preventDefault();
		event.stopImmediatePropagation();
	};

	ComparisonMicroChart.prototype.onsapdown = function(event) {
		var $Bars = this.$().find(".sapSuiteUiMicroChartPointer");
		if ($Bars.length > 0) {
			var iIndex = $Bars.index(event.target);
			this._switchTabindex(iIndex, iIndex + 1, $Bars);
		}
		event.preventDefault();
		event.stopImmediatePropagation();
	};

	ComparisonMicroChart.prototype.onsaphome = function(event) {
		var $Bars = this.$().find(".sapSuiteUiMicroChartPointer");
		var iIndex = $Bars.index(event.target);
		if (iIndex !== 0 && $Bars.length > 0) {
			this._switchTabindex(iIndex, 0, $Bars);
		}
		event.preventDefault();
		event.stopImmediatePropagation();
	};

	ComparisonMicroChart.prototype.onsapend = function(event) {
		var $Bars = this.$().find(".sapSuiteUiMicroChartPointer");
		var iIndex = $Bars.index(event.target),
			iLength = $Bars.length;
		if (iIndex !== iLength - 1 && iLength > 0) {
			this._switchTabindex(iIndex, iLength - 1, $Bars);
		}
		event.preventDefault();
		event.stopImmediatePropagation();
	};

	ComparisonMicroChart.prototype.onsapleft = ComparisonMicroChart.prototype.onsapup;

	ComparisonMicroChart.prototype.onsapright = ComparisonMicroChart.prototype.onsapdown;

	/* =========================================================== */
	/* API methods */
	/* =========================================================== */

	ComparisonMicroChart.prototype.setMinValue = function(fMinValue) {
		this._isMinValueSet = jQuery.isNumeric(fMinValue);
		return this.setProperty("minValue", this._isMinValueSet ? fMinValue : NaN);
	};

	ComparisonMicroChart.prototype.setMaxValue = function(fMaxValue) {
		this._isMaxValueSet = jQuery.isNumeric(fMaxValue);
		return this.setProperty("maxValue", this._isMaxValueSet ? fMaxValue : NaN);
	};

	ComparisonMicroChart.prototype.setSize = function(size) {
		if (this.getSize() !== size) {
			if (size === Size.Responsive) {
				this.setProperty("isResponsive", true, true);
			} else {
				this.setProperty("isResponsive", false, true);
			}
			this.setProperty("size", size, false);
		}
		return this;
	};

	/* =========================================================== */
	/* Protected methods */
	/* =========================================================== */

	ComparisonMicroChart.prototype.init = function() {
		this._oRb = sap.ui.getCore().getLibraryResourceBundle("sap.suite.ui.microchart");
		this.setAggregation("tooltip", "{AltText}", true);
		this._isMinValueSet = false;
		this._isMaxValueSet = false;
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
	ComparisonMicroChart.prototype._handleCoreInitialized = function() {
		this._bThemeApplied = sap.ui.getCore().isThemeApplied();
		if (!this._bThemeApplied) {
			sap.ui.getCore().attachThemeChanged(this._handleThemeApplied, this);
		}
	};

	/**
	 * The chart will only be rendered if the theme is applied.
	 * If the theme is applied, rendering starts by the control itself.
	 *
	 * @private
	 */
	ComparisonMicroChart.prototype._handleThemeApplied = function() {
		this._bThemeApplied = true;
		this.invalidate();
		sap.ui.getCore().detachThemeChanged(this._handleThemeApplied, this);
	};

	ComparisonMicroChart.prototype.onBeforeRendering = function() {
		if (library._isInGenericTile(this)) {
			this.setIsResponsive(true);
			library._removeStandardMargins(this);
		}

		//removes handler for mouseenter event
		this._unbindMouseEnterLeaveHandler();
	};

	ComparisonMicroChart.prototype.onAfterRendering = function() {
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
	ComparisonMicroChart.prototype._onControlIsVisible = function() {
		if (this.getHeight() !== "" || this.getIsResponsive()) {
			Device.media.attachHandler(this._onResize, this);
			this._onResize();
		}
	};

	ComparisonMicroChart.prototype.setBarPressable = function(iBarIndex, bPressable) {
		if (bPressable) {
			var sBarAltText = this._getBarAltText(iBarIndex);
			jQuery.sap.byId(this.getId() + "-chart-item-bar-" + iBarIndex).addClass("sapSuiteUiMicroChartPointer").attr("tabindex", 0).attr("title", sBarAltText).attr("role", "presentation").attr("aria-label", sBarAltText);
		} else {
			jQuery.sap.byId(this.getId() + "-chart-item-bar-" + iBarIndex).removeAttr("tabindex").removeClass("sapSuiteUiMicroChartPointer").removeAttr("title").removeAttr("role").removeAttr("aria-label");
		}
	};

	ComparisonMicroChart.prototype.getAltText = function() {
		var sAltText = "", sBarText;
		for (var i = 0; i < this.getData().length; i++) {
			sBarText = this._getBarAltText(i);
			if (!library._isTooltipSuppressed(sBarText)) {
				if (!library._isTooltipSuppressed(sAltText)) {
					sAltText += "\n";
				}
				sAltText += sBarText;
			}
		}
		return sAltText;
	};

	ComparisonMicroChart.prototype.getTooltip_AsString  = function() { //eslint-disable-line
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
	ComparisonMicroChart.prototype._getAccessibilityControlType = function() {
		return this._oRb.getText("ACC_CTR_TYPE_COMPARISONMICROCHART");
	};

	/* =========================================================== */
	/* Private methods */
	/* =========================================================== */
	/**
	 * Calculates the width in percent of the chart bar elements accordingly with provided chart values.
	 *
	 * @returns {Array} array of calculated values for each chart bar.
	 * @private
	 */
	ComparisonMicroChart.prototype._calculateChartData = function() {
		var aResult = [];
		var aData = this.getData();
		var iCount = aData.length;
		var iMaxValue = 0;
		var iMinValue = 0;
		var iTotal;
		var iMaxPercent;
		var iMinPercent;
		var i;

		for (i = 0; i < iCount; i++) {
			var iDataValue = isNaN(aData[i].getValue()) ? 0 : aData[i].getValue();
			iMaxValue = Math.max(iMaxValue, iDataValue);
			iMinValue = Math.min(iMinValue, iDataValue);
		}
		if (this._isMinValueSet) {
			iMinValue = Math.min(iMinValue, this.getMinValue());
		}
		if (this._isMaxValueSet) {
			iMaxValue = Math.max(iMaxValue, this.getMaxValue());
		}

		iTotal = iMaxValue - iMinValue;
		iMaxPercent = (iTotal == 0) ? 0 : Math.round(iMaxValue * 100 / iTotal);

		if (iMaxPercent == 0 && iMaxValue != 0) {
			iMaxPercent = 1;
		} else if (iMaxPercent == 100 && iMinValue != 0) {
			iMaxPercent = 99;
		}

		iMinPercent = 100 - iMaxPercent;

		for (i = 0; i < iCount; i++) {
			var oItem = {};
			var iDataVal = isNaN(aData[i].getValue()) ? 0 : aData[i].getValue();

			oItem.value = (iTotal == 0) ? 0 : Math.round(iDataVal * 100 / iTotal);

			if (oItem.value == 0 && iDataVal != 0) {
				oItem.value = (iDataVal > 0) ? 1 : -1;
			} else if (oItem.value == 100) {
				oItem.value = iMaxPercent;
			} else if (oItem.value == -100) {
				oItem.value = -iMinPercent;
			}

			if (oItem.value >= 0) {
				oItem.negativeNoValue = iMinPercent;
				oItem.positiveNoValue = iMaxPercent - oItem.value;
			} else {
				oItem.value = -oItem.value;
				oItem.negativeNoValue = iMinPercent - oItem.value;
				oItem.positiveNoValue = iMaxPercent;
			}

			aResult.push(oItem);
		}

		return aResult;
	};

	ComparisonMicroChart.prototype._getLocalizedColorMeaning = function(sColor) {
		return this._oRb.getText(("SEMANTIC_COLOR_" + sColor).toUpperCase());
	};

	ComparisonMicroChart.prototype._getBarAltText = function(iBarIndex) {
		var oBar = this.getData()[iBarIndex];
		var oBarTooltip = this.getData()[iBarIndex].getTooltip();
		if (oBarTooltip) {
			return oBarTooltip;
		} else {
			var sMeaning = this.getColorPalette().length ? "" : this._getLocalizedColorMeaning(oBar.getColor());
			return oBar.getTitle() + " " + (oBar.getDisplayValue() ? oBar.getDisplayValue() : oBar.getValue()) + this.getScale() + " " + sMeaning;
		}
	};

	ComparisonMicroChart.prototype._adjustBars = function() {
		var iBarContainerHeight;
		var iHeight = parseFloat(this.$().find(".sapSuiteCpMCVerticalAlignmentContainer").css("height"));
		var iBarCount = this.getData().length;
		var aBarContainers = this.$().find(".sapSuiteCpMCChartItem");
		var iMinHeight = parseFloat(aBarContainers.css("min-height"));
		var iMaxHeight = parseFloat(aBarContainers.css("max-height"));

		if (iBarCount !== 0) {
			iBarContainerHeight = this._calculateBarContainerHeight(Device.browser.firefox, iHeight, iBarCount);

			if (iBarContainerHeight > iMaxHeight) {
				iBarContainerHeight = iMaxHeight;
			} else if (iBarContainerHeight < iMinHeight) {
				iBarContainerHeight = iMinHeight;
			}
			aBarContainers.css("height", iBarContainerHeight);

			var iChartsHeightDelta = (iHeight - iBarContainerHeight * iBarCount) / 2;
			if (iChartsHeightDelta > 0) {
				jQuery(aBarContainers[0]).css("margin-top", iChartsHeightDelta + "px");
			}
		}
	};

	/**
	 * Calculates the bar container height based on the browser, responsiveness, and view mode.
	 *
	 * @param {Boolean} firefox Flag showing if the used browser is Firefox.
	 * @param {int} height Height of the alignment container.
	 * @param {int} barCount The number of bars in the chart.
	 * @returns {int} Height of each individual bar.
	 * @private
	 */
	ComparisonMicroChart.prototype._calculateBarContainerHeight = function(firefox, height, barCount) {
		if (firefox && !this.getIsResponsive() && this.getView() !== "Wide") {
			var iHeaderHeight = this.$().find(".sapSuiteCpMCChartItemHeader").outerHeight(true);
			var iBarHeight = this.$().find(".sapSuiteCpMCChartBar").outerHeight(true);
			return iHeaderHeight + iBarHeight;
		} else {
			return height / barCount;
		}
	};

	/**
	 * Conducts size adjustments that are necessary if the dimensions of the chart change.
	 *
	 * @private
	 */
	ComparisonMicroChart.prototype._onResize = function() {
		if (this.getIsResponsive()) {
			this._adjustBars();
			this._resizeVertically();

			this._resizeHorizontally();
		} else {
			this._adjustBars();
		}
	};

	/**
	 * Adjusts the height and width of the whole control if this is required depending on parent control.
	 *
	 * @private
	 */
	ComparisonMicroChart.prototype._adjustToParent = function() {
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
	ComparisonMicroChart.prototype._resizeVertically = function() {
		var $this = this.$();
		var $OuterVerticalAlignmentContainer = $this.find(".sapSuiteCpMCVerticalAlignmentContainer");
		var iMaxChartHeight = parseInt($OuterVerticalAlignmentContainer.css("max-height"), 10);
		var iCurrentControlHeight = parseInt($this.css("height"), 10);
		var iCurrentChartHeight = parseInt($OuterVerticalAlignmentContainer.css("height"), 10);
		var iBarHeight = this.$().find(".sapSuiteCpMCChartBar").outerHeight();
		var iBarCount = this.getData().length;

		if (iCurrentControlHeight <= iMaxChartHeight) {
			$this.addClass("sapSuiteCpMCSmallFont");
		}
		if (this.getView() === "Normal" && iCurrentChartHeight < (ComparisonMicroChart.HEIGHT_PER_CHART_DISAPPEAR_THRESHOLD + iBarHeight) * iBarCount ) {
			$this.find(".sapSuiteCpMCChartBar>div").hide();
		}
		if (iCurrentChartHeight < ComparisonMicroChart.HEIGHT_PER_CHART_DISAPPEAR_THRESHOLD * iBarCount ) {
			$this.hide();
		}
	};

	/**
	 * Performs horizontal responsiveness adjustment. Assumes that the width of the control will not change afterwards. Assumes that all the CSS have already been loaded and are available.
	 *
	 * @private
	 */
	ComparisonMicroChart.prototype._resizeHorizontally = function() {
		var $this = this.$();
		var $Bars = $this.find(".sapSuiteCpMCChartBar");
		var iBarWidth = parseInt($Bars.width(), 10);
		var iWidth = parseInt($this.width(), 10);
		if (this.getView() === "Wide" && iBarWidth < ComparisonMicroChart.EDGE_CASE_WIDTH_HIDE_CHART) {
			$Bars.hide();
		}

		if (iWidth < ComparisonMicroChart.WIDTH_FONT_THRESHOLD || this._isTruncatedLabel(".sapSuiteCpMCChartItemTitle, .sapSuiteCpMCChartItemValue")) {
			$this.addClass("sapSuiteCpMCSmallFont");
		}
		if (iWidth < ComparisonMicroChart.EDGE_CASE_WIDTH_HIDE_CHART) {
			$this.hide();
		}
		if (this._isTruncatedLabel(".sapSuiteCpMCChartItemValue")) {
			$this.hide();
		}
	};

	/**
	 * Checks if any label of the specified CSS class on the chart is truncated.
	 *
	 * @private
	 * @param {string} sClassSelector Representation of CSS classes
	 * @returns {boolean} True if the label is truncated, false if not.
	 */
	ComparisonMicroChart.prototype._isTruncatedLabel = function(sClassSelector) {
		var $Labels = this.$().find(sClassSelector);
		for (var i = 0; i < $Labels.length; i++) {
			if ($Labels[i].offsetWidth < $Labels[i].scrollWidth - 1) {
				return true;
			}
		}
		return false;
	};

	/**
	 * Adds the title attribute to show the tooltip when the mouse enters the chart.
	 *
	 * @private
	 */
	ComparisonMicroChart.prototype._addTitleAttribute = function() {
		var sTooltip = this.getTooltip_AsString();
		if (!library._isTooltipSuppressed(sTooltip)) {
			if (this.getIsResponsive()){
				this.$().find(".sapSuiteCpMCVerticalAlignmentContainer").attr("title", sTooltip);
			} else {
				this.$().attr("title", sTooltip);
			}
		}
	};

	/**
	 * Removes the title attribute to hide the tooltip when the mouse leaves the chart.
	 *
	 * @private
	 */
	ComparisonMicroChart.prototype._removeTitleAttribute = function() {
		if (this.getIsResponsive()){
			this.$().find(".sapSuiteCpMCVerticalAlignmentContainer").removeAttr("title");
		} else {
			this.$().removeAttr("title");
		}
	};

	/**
	 * Resolves the chart focus in case a chart bar is activated/released.
	 * @param {jQuery.Event} oEvent The jQuery event object.
	 * @private
	 */
	ComparisonMicroChart.prototype._resolveFocus = function(oEvent) {
		var oBar = jQuery(oEvent.target);
		if (oBar && oBar.attr("data-bar-index")) {
			var iIndex = parseInt(oBar.attr("data-bar-index"), 10);
			var oData = this.getData()[iIndex];
			if (oData && oData.hasListeners("press")) {
				this.$().css("outline-color", "transparent");
			} else {
				this.$().css("outline-color", "");
			}
		} else {
			this.$().css("outline-color", "");
		}
	};

	/**
	 * Adds and removes the tabindex between elements to support keyboard navigation.
	 *
	 * @param {int} oldIndex The index of the previously focused bar
	 * @param {int} newIndex The index of the bar that is to be focused
	 * @param {jQuery} bars All valid clickable bars inside the chart
	 * @private
	 */
	ComparisonMicroChart.prototype._switchTabindex = function(oldIndex, newIndex, bars) {
		if (oldIndex >= 0 && oldIndex < bars.length && newIndex >= 0 && newIndex < bars.length) {
			bars.eq(oldIndex).removeAttr("tabindex");
			bars.eq(newIndex).attr("tabindex", "0").focus();
		}
	};

	/**
	 * Binds the handlers for mouseenter mouseleave events.
	 *
	 * @private
	 */
	ComparisonMicroChart.prototype._bindMouseEnterLeaveHandler = function () {

		// handlers need to be saved intermediately in order to unbind successfully
		if (!this._oMouseEnterLeaveHandler) {
			this._oMouseEnterLeaveHandler = {
				mouseEnterChart: this._addTitleAttribute.bind(this),
				mouseLeaveChart: this._removeTitleAttribute.bind(this),
				mouseDownChart: this._resolveFocus.bind(this)
			};
		}
		// bind events on chart
		this.$().bind("mouseenter", this._oMouseEnterLeaveHandler.mouseEnterChart);
		this.$().bind("mouseleave", this._oMouseEnterLeaveHandler.mouseLeaveChart);
		this.$().bind("mousedown", this._oMouseEnterLeaveHandler.mouseDownChart);
	};

	/**
	 * Unbinds the handlers for mouseenter mouseleave events.
	 *
	 * @private
	 */
	ComparisonMicroChart.prototype._unbindMouseEnterLeaveHandler = function () {
		if (this._oMouseEnterLeaveHandler) {
			this.$().unbind("mouseenter", this._oMouseEnterLeaveHandler.mouseEnterChart);
			this.$().unbind("mouseleave", this._oMouseEnterLeaveHandler.mouseLeaveChart);
			this.$().unbind("mousedown", this._oMouseEnterLeaveHandler.mouseDownChart);
		}
	};

	library._overrideGetAccessibilityInfo(ComparisonMicroChart.prototype);

	return ComparisonMicroChart;
});
