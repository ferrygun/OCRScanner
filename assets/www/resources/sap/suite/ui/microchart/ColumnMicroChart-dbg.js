/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

// Provides control sap.suite.ui.microchart.Example.
sap.ui.define([
	"jquery.sap.global", "./library", "sap/ui/core/Control", "sap/m/Size", "sap/ui/Device", "sap/ui/core/ResizeHandler"
], function(jQuery, library, Control, Size, Device, ResizeHandler) {
	"use strict";

	/**
	 * Constructor for a new ColumnMicroChart control.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Compares different values which are represented as vertical bars. This control replaces the deprecated sap.suite.ui.commons.ColumnMicroChart.
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 * @since 1.34
	 *
	 * @public
	 * @alias sap.suite.ui.microchart.ColumnMicroChart
	 * @ui5-metamodel This control will also be described in the UI5 (legacy) designtime metamodel
	 */
	var ColumnMicroChart = Control.extend("sap.suite.ui.microchart.ColumnMicroChart", /** @lends sap.suite.ui.microchart.ColumnMicroChart.prototype */ {
		metadata: {
			library: "sap.suite.ui.microchart",
			properties: {
				/**
				 * Updates the size of the chart. If not set then the default size is applied based on the device tile.
				 */
				size: {group: "Misc", type: "sap.m.Size", defaultValue: "Auto"},

				/**
				 * The width of the chart. If it is not set, the width of the control is defined by the size property.
				 */
				width: {group: "Misc", type: "sap.ui.core.CSSSize"},

				/**
				 * The height of the chart. If it is not set, the height of the control is defined by the size property.
				 */
				height: {group: "Misc", type: "sap.ui.core.CSSSize"},

				/**
				 * If set to true, width and height of the control are determined by the width and height of the container in which the control is placed. Size, width and height properties are ignored in this case.
				 * @since 1.38.0
				 */
				isResponsive: {type: "boolean", group: "Appearance", defaultValue: false}
			},

			events : {

				/**
				 * The event is triggered when the chart is pressed.
				 */
				press : {}
			},
			defaultAggregation : "columns",
			aggregations: {

				/**
				 * The column chart data.
				 */
				columns: { multiple: true, type: "sap.suite.ui.microchart.ColumnMicroChartData", defaultValue : null, bindable : "bindable"},

				/**
				 * The label on the left top corner of the chart.
				 */
				leftTopLabel: {  multiple: false, type: "sap.suite.ui.microchart.ColumnMicroChartLabel", defaultValue : null},

				/**
				 * The label on the right top corner of the chart.
				 */
				rightTopLabel: { multiple: false, type: "sap.suite.ui.microchart.ColumnMicroChartLabel", defaultValue : null},

				/**
				 * The label on the left bottom corner of the chart.
				 */
				leftBottomLabel: { multiple: false, type: "sap.suite.ui.microchart.ColumnMicroChartLabel", defaultValue: null},

				/**
				 * The label on the right bottom corner of the chart.
				 */
				rightBottomLabel: { multiple: false, type: "sap.suite.ui.microchart.ColumnMicroChartLabel", defaultValue : null}
			}
		}
	});

	//Constants
	ColumnMicroChart.EDGE_CASE_WIDTH_SHOWCHART = 32; // 2rem for hiding the chart
	ColumnMicroChart.EDGE_CASE_HEIGHT_SHOWCANVAS = 16; // 1rem for hiding the canvas (bars)
	ColumnMicroChart.EDGE_CASE_HEIGHT_SHOWLABELS = 16; // 1rem for hiding the labels
	ColumnMicroChart.EDGE_CASE_HEIGHT_SHOWTOPLABEL = 32; // 2rem for hiding the top label
	ColumnMicroChart.EDGE_CASE_WIDTH_RESIZEFONT = 168; // Corresponds to M size 10.5rem
	ColumnMicroChart.EDGE_CASE_HEIGHT_RESIZEFONT = 72; // Corresponds to M size 4.5rem

	ColumnMicroChart.prototype.init = function(){
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
	 * Handler for the core's init event. The control will only be rendered if all themes are loaded
	 * and everything is properly initialized. We attach a theme check here.
	 *
	 * @private
	 */
	ColumnMicroChart.prototype._handleCoreInitialized = function() {
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
	ColumnMicroChart.prototype._handleThemeApplied = function() {
		this._bThemeApplied = true;
		this.invalidate();
		sap.ui.getCore().detachThemeChanged(this._handleThemeApplied, this);
	};

	ColumnMicroChart.prototype.onBeforeRendering = function() {
		if (library._isInGenericTile(this)) {
			this.setIsResponsive(true);
			library._removeStandardMargins(this);
		}

		this.$().unbind("mouseenter", this._addTitleAttribute);
		this.$().unbind("mouseleave", this._removeTitleAttribute);
	};

	ColumnMicroChart.prototype.onAfterRendering = function() {
		if (this._sChartResizeHandlerId) {
			ResizeHandler.deregister(this._sChartResizeHandlerId);
		}

		this._sChartResizeHandlerId = ResizeHandler.register(jQuery.sap.domById(this.getId()),  jQuery.proxy(this._calcColumns, this));
		this._fChartWidth = undefined;
		this._fChartHeight = undefined;
		this._aBars = [];

		var iColumnsNum = this.getColumns().length;

		for (var i = 0; i < iColumnsNum; i++) {
			this._aBars.push({});
		}
		this._adjustToParent();
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
	ColumnMicroChart.prototype._onControlIsVisible = function() {
		this._calcColumns();
		this._resize();
	};

	ColumnMicroChart.prototype.exit = function() {
		ResizeHandler.deregister(this._sChartResizeHandlerId);
	};

	/**
	 * Resizes the control based on parent dimensions (width and height)
	 * Required for rendering in page element. Otherwise, the element is cut at the top.
	 * Two pixels are subtracted from the parent values. Otherwise, there's not enough space for the outline and it won't render correctly.
	 *
	 * @private
	 */
	ColumnMicroChart.prototype._adjustToParent = function() {
		if (this.getIsResponsive()) {
			//checks if there is a parent method available
			if (!jQuery.isFunction(this.getParent)) {
				return;
			}
			//set width and height
			var oParent = this.getParent();
			var $this = this.$();
			if (jQuery.isFunction(oParent.getHeight)) {
				var sParentHeight = parseFloat(oParent.$().height()) - 2;
				$this.height(sParentHeight);
			}
			if (jQuery.isFunction(oParent.getWidth)) {
				var sParentWidth = parseFloat(oParent.$().width()) - 2;
				$this.width(sParentWidth);
			}
		}
	};

	/**
	 * Handles the responsiveness.
	 *
	 * @private
	 */
	ColumnMicroChart.prototype._resize = function() {
		if (this.getIsResponsive()) {
			//width threshold
			this._resizeHorizontally();

			//height threshold
			this._resizeVertically();

			//resize when bars are too small
			this._resizeBars();
		}
	};

	/**
	 * Resizes vertically the control
	 *
	 * @private
	 */
	ColumnMicroChart.prototype._resizeVertically = function() {
		var $this = this.$();
		//for canvas
		var $Canvas = $this.find(".sapSuiteClMCBars");
		var iHeightCanvas = parseFloat($Canvas.css("height"));
		if (iHeightCanvas <= ColumnMicroChart.EDGE_CASE_HEIGHT_SHOWCANVAS) {
			$Canvas.hide();
		}

		//for control
		var iHeight = parseFloat($this.css("height"));
		if ($this.find(".sapSuiteClMCPositionBtm.sapSuiteClMCLbls").length !== 0) {
			//hide the top label when there is a bottom label
			if (iHeight <= ColumnMicroChart.EDGE_CASE_HEIGHT_SHOWTOPLABEL) {
				$this.find(".sapSuiteClMCPositionTop.sapSuiteClMCLbls").hide();
			}
			//hide the bottom label
			if (iHeight <= ColumnMicroChart.EDGE_CASE_HEIGHT_SHOWLABELS) {
				$this.find(".sapSuiteClMCPositionBtm.sapSuiteClMCLbls").hide();
			}
		} else if (iHeight <= ColumnMicroChart.EDGE_CASE_HEIGHT_SHOWLABELS) {
			//hide the top label when there is no bottom label
			$this.find(".sapSuiteClMCPositionTop.sapSuiteClMCLbls").hide();
		}
		//resize the font
		if (iHeight <= ColumnMicroChart.EDGE_CASE_HEIGHT_RESIZEFONT) {
			this._resizeFont();
		}
	};

	/**
	 * Resizes horizontally the control
	 *
	 * @private
	 */
	ColumnMicroChart.prototype._resizeHorizontally = function() {
		var $this = this.$();
		//for control and canvas at the same time as the width is the same
		var iWidth = parseFloat($this.css("width"));
		if (iWidth <= ColumnMicroChart.EDGE_CASE_WIDTH_SHOWCHART) {
			$this.hide();
			return;
		}
		//resize the font when less than threshold
		if (iWidth <= ColumnMicroChart.EDGE_CASE_WIDTH_RESIZEFONT) {
			this._resizeFont();
		}

		//check for labels truncated in case of width shrinking
		var $LabelsParent = $this.find(".sapSuiteClMCPositionTop.sapSuiteClMCLbls");
		//top labels
		if (this._isTruncatedLabel($LabelsParent)) {
			$LabelsParent.hide();
		}
		//bottom labels
		$LabelsParent = $this.find(".sapSuiteClMCPositionBtm.sapSuiteClMCLbls");
		if (this._isTruncatedLabel($LabelsParent)) {
			$LabelsParent.hide();
		}
	};

	/**
	 * Resizes the bars
	 *
	 * @private
	 */
	ColumnMicroChart.prototype._resizeBars = function() {
		//if bars cannot be properly displayed, hide the chart
		var iWidth = this.getDomRef().getBoundingClientRect().width - 1;
		var $this = this.$();
		var iNumBars = $this.find(".sapSuiteClMCBar").size();
		var iMinBarWidth = parseFloat($this.find(".sapSuiteClMCBar").css("min-width"));
		if ((iMinBarWidth === 0) || isNaN(iMinBarWidth)) {
			iMinBarWidth = 1;
		}
		var iNumMargins = iNumBars - 1;
		var bRtl = sap.ui.getCore().getConfiguration().getRTL();
		if (iNumBars * iMinBarWidth + iNumMargins >= iWidth) {
			$this.hide();
		} else if (parseFloat($this.find(".sapSuiteClMCBar:last").css("margin-" + (bRtl ? "right" : "left"))) < 1) {
			//divide the space equally among the bars
			$this.find(".sapSuiteClMCBar:not(:first)").css("margin-left", "1px");
			$this.find(".sapSuiteClMCBar").css("width", (((iWidth - iNumMargins) / iNumBars)));
		}
	};

	/**
	 * Resizes the labels font if they are truncated;
	 * Hides the labels if they are still truncated after font resizing
	 *
	 * @private
	 * @param {Object} $LabelsParent The parent of labels right and left
	 * @returns {boolean} Returns true if the label is still truncated after font resizing, otherwise false
	 */
	ColumnMicroChart.prototype._isTruncatedLabel = function($LabelsParent) {
		var $Labels = $LabelsParent.find(".sapSuiteClMCPositionRight.sapSuiteClMCLbl,.sapSuiteClMCPositionLeft.sapSuiteClMCLbl");
		for (var i = 0; i < $Labels.size(); i++) {
			//resize the font (+1 is needed in IE because of flickering)
			if ($Labels[i].offsetWidth + 1 < $Labels[i].scrollWidth) {
				this._resizeFont();
			}
			//the label is truncated (+1 is needed in IE because of flickering)
			if ($Labels[i].offsetWidth + 1 < $Labels[i].scrollWidth) {
				return true;
			}
		}
		return false;
	};

	/**
	 * Resizes the font
	 * Font resizing happens for all labels inside the chart even if only one label is affected (keep the same font size overall)*
	 *
	 * @private
	 */
	ColumnMicroChart.prototype._resizeFont = function() {
		this.$().find(".sapSuiteClMCLbl").addClass("sapSuiteClMCSmallFont");
	};

	ColumnMicroChart.prototype._calcColumns = function() {
		var iColumnsNum = this.getColumns().length;
		if (iColumnsNum) {
			var fChartWidth = parseFloat(this.$().css("width"));
			if (fChartWidth != this._fChartWidth) {
				this._fChartWidth = fChartWidth;

				var iColumnMargin = 0;
				var oBar;
				if (iColumnsNum > 1) {
					oBar = jQuery.sap.byId(this.getId() + "-bar-1");
					var bRtl = sap.ui.getCore().getConfiguration().getRTL();
					iColumnMargin = parseInt(oBar.css("margin-" + (bRtl ? "right" : "left")), 10);
				} else {
					oBar = jQuery.sap.byId(this.getId() + "-bar-0");
				}

				var iColumMinWidth = parseInt(oBar.css("min-width"), 10);

				this._calcColumnsWidth(iColumnMargin, iColumMinWidth, fChartWidth, this._aBars);
			}

			var fChartHeight = parseFloat(this.$().css("height"));
			if (fChartHeight != this._fChartHeight) {
				this._fChartHeight = fChartHeight;
				this._calcColumnsHeight(fChartHeight, this._aBars);
			}

			for (var i = 0; i < iColumnsNum; i++) {
				jQuery.sap.byId(this.getId() + "-bar-" + i).css(this._aBars[i]);
			}

			if (this._aBars.overflow) {
				jQuery.sap.log.warning(this.toString() + " Chart overflow",  "Some columns were not rendered");
			}
		}
	};

	ColumnMicroChart.prototype._calcColumnsWidth = function(iColumnMargin, iColumMinWidth, fChartWidth, aBars) {
		var iColumnsNum = this.getColumns().length;
		var iVisibleColumnsNum = Math.floor((fChartWidth + iColumnMargin) / (iColumMinWidth + iColumnMargin));
		var iMarginWidthPercent = 2;
		var iColumnWidthPercent = (100 - iMarginWidthPercent * (iColumnsNum - 1)) / iColumnsNum;

		for (var i = 0; i < iColumnsNum; i++) {
			if (i < iVisibleColumnsNum) {
				aBars[i].width = iColumnWidthPercent + "%";
				if (i > 0) {
					var bRtl = sap.ui.getCore().getConfiguration().getRTL();
					aBars[i]["margin-" + (bRtl ? "right" : "left")] = iMarginWidthPercent + "%";
				}
			} else {
				aBars[i].display = "none";
			}
		}

		aBars.overflow = iVisibleColumnsNum != iColumnsNum;
	};

	ColumnMicroChart.prototype._calcColumnsHeight = function(fChartHeight, aBars) {
		var iClmnsNum = this.getColumns().length;

		var fMaxVal, fMinVal, fValue;
		fMaxVal = fMinVal = 0;

		for (var i = 0; i < iClmnsNum; i++) {
			var oClmn = this.getColumns()[i];
			if (fMaxVal < oClmn.getValue()) {
				fMaxVal = oClmn.getValue();
			} else if (fMinVal > oClmn.getValue()) {
				fMinVal = oClmn.getValue();
			}
		}

		var fDelta = fMaxVal - fMinVal;
		var fOnePxVal = fDelta / fChartHeight;

		var fDownShift, fTopShift;
		fDownShift = fTopShift = 0;

		for (var iCl = 0; iCl < iClmnsNum; iCl++) {
			fValue = this.getColumns()[iCl].getValue();

			if (Math.abs(fValue) < fOnePxVal) {
				if (fValue >= 0) {
					if (fValue == fMaxVal) {
						fTopShift = fOnePxVal - fValue;
					}
				} else if (fValue == fMinVal) {
					fDownShift = fOnePxVal + fValue;
				}
			}
		}

		if (fTopShift) {
			fMaxVal += fTopShift;
			fMinVal -= fTopShift;
		}

		if (fDownShift) {
			fMaxVal -= fDownShift;
			fMinVal += fDownShift;
		}

		var fNegativeOnePxVal =  0 - fOnePxVal;

		for (var iClmn = 0; iClmn < iClmnsNum; iClmn++) {
			fValue = this.getColumns()[iClmn].getValue();
			var fCalcVal = fValue;

			if (fValue >= 0) {
				fCalcVal = Math.max(fCalcVal + fTopShift - fDownShift, fOnePxVal);
			} else {
				fCalcVal = Math.min(fCalcVal + fTopShift - fDownShift, fNegativeOnePxVal);
			}

			aBars[iClmn].value = fCalcVal;
		}

		function calcPersent(fValue) {
			return (fValue / fDelta * 100).toFixed(2) + "%";
		}

		var fZeroLine = calcPersent(fMaxVal);

		for (var iCol = 0; iCol < iClmnsNum; iCol++) {
			fValue = aBars[iCol].value;
			aBars[iCol].top = (fValue < 0) ? fZeroLine : calcPersent(fMaxVal - fValue);
			aBars[iCol].height = calcPersent(Math.abs(fValue));
		}
	};

	ColumnMicroChart.prototype.attachEvent = function(sEventId, oData, fnFunction, oListener) {
		Control.prototype.attachEvent.call(this, sEventId, oData, fnFunction, oListener);
		if (this.hasListeners("press")) {
			this.$().attr("tabindex", 0).addClass("sapSuiteUiMicroChartPointer");
		}
		return this;
	};

	ColumnMicroChart.prototype.detachEvent = function(sEventId, fnFunction, oListener) {
		Control.prototype.detachEvent.call(this, sEventId, fnFunction, oListener);
		if (!this.hasListeners("press")) {
			this.$().removeAttr("tabindex").removeClass("sapSuiteUiMicroChartPointer");
		}
		return this;
	};

	ColumnMicroChart.prototype.getLocalizedColorMeaning = function(sColor) {
		if (sColor) {
			return this._oRb.getText(("SEMANTIC_COLOR_" + sColor).toUpperCase());
		}
	};

	ColumnMicroChart.prototype.setSize = function(size) {
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

	ColumnMicroChart.prototype.getAltText = function() {
		var sAltText = "";
		var bIsFirst = true;
		var oLeftTopLabel = this.getLeftTopLabel();
		var oRightTopLabel = this.getRightTopLabel();
		var oLeftBtmLabel = this.getLeftBottomLabel();
		var oRightBtmLabel = this.getRightBottomLabel();

		var sColor;

		if (oLeftTopLabel && oLeftTopLabel.getLabel() || oLeftBtmLabel && oLeftBtmLabel.getLabel()) {
			if (oLeftTopLabel) {
				sColor = oLeftTopLabel.getColor();
			} else if (oLeftBtmLabel){
				sColor = oLeftBtmLabel.getColor();
			} else {
				sColor = "";
			}

			sAltText += (bIsFirst ? "" : "\n") + this._oRb.getText(("COLUMNMICROCHART_START")) + ": " + (oLeftBtmLabel ? oLeftBtmLabel.getLabel() + " " : "")
				+ (oLeftTopLabel ? oLeftTopLabel.getLabel() + " " : "") + this.getLocalizedColorMeaning(sColor);
			bIsFirst = false;
		}

		if (oRightTopLabel && oRightTopLabel.getLabel() || oRightBtmLabel && oRightBtmLabel.getLabel()) {
			if (oRightTopLabel) {
				sColor = oRightTopLabel.getColor();
			} else if (oRightBtmLabel){
				sColor = oRightBtmLabel.getColor();
			} else {
				sColor = "";
			}

			sAltText += (bIsFirst ? "" : "\n") + this._oRb.getText(("COLUMNMICROCHART_END")) + ": " + (oRightBtmLabel ? oRightBtmLabel.getLabel() + " " : "")
				+ (oRightTopLabel ? oRightTopLabel.getLabel() + " " : "") + this.getLocalizedColorMeaning(sColor);
			bIsFirst = false;
		}

		var aColumns = this.getColumns();
		for (var i = 0; i < aColumns.length; i++) {
			var oBar = aColumns[i];
			var sMeaning = this.getLocalizedColorMeaning(oBar.getColor());
			sAltText += ((!bIsFirst || i != 0) ? "\n" : "") + oBar.getLabel() + " " + oBar.getValue() + " " + sMeaning;
		}

		return sAltText;
	};

	ColumnMicroChart.prototype.getTooltip_AsString  = function() { //eslint-disable-line
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
	ColumnMicroChart.prototype._getAccessibilityControlType = function() {
		return this._oRb.getText("ACC_CTR_TYPE_COLUMNMICROCHART");
	};

	ColumnMicroChart.prototype.ontap = function(oEvent) {
		if (Device.browser.edge) {
			this.onclick(oEvent);
		}
	};

	ColumnMicroChart.prototype.onclick = function(oEvent) {
		if (!this.fireBarPress(oEvent)) {
			if (Device.browser.msie || Device.browser.edge) {
				this.$().focus();
			}
			this.firePress();
		}
	};

	ColumnMicroChart.prototype.onkeydown = function(oEvent) {
		var iThis, oFocusables;
		switch (oEvent.keyCode) {
			case jQuery.sap.KeyCodes.SPACE:
				oEvent.preventDefault();
				break;

			case jQuery.sap.KeyCodes.ARROW_LEFT:
			case jQuery.sap.KeyCodes.ARROW_UP:
				oFocusables = this.$().find(":focusable"); // all tabstops in the control
				iThis = oFocusables.index(oEvent.target);  // focused element index
				if (oFocusables.length > 0) {
					oFocusables.eq(iThis - 1).get(0).focus();	// previous tab stop element
					oEvent.preventDefault();
					oEvent.stopPropagation();
				}
				break;

			case jQuery.sap.KeyCodes.ARROW_DOWN:
			case jQuery.sap.KeyCodes.ARROW_RIGHT:
				oFocusables = this.$().find(":focusable"); // all tabstops in the control
				iThis = oFocusables.index(oEvent.target);  // focused element index
				if (oFocusables.length > 0) {
					oFocusables.eq((iThis + 1 < oFocusables.length) ? iThis + 1 : 0).get(0).focus(); // next tab stop element
					oEvent.preventDefault();
					oEvent.stopPropagation();
				}
				break;
			default:
		}
	};

	ColumnMicroChart.prototype.onkeyup = function(oEvent) {
		if (oEvent.which == jQuery.sap.KeyCodes.ENTER || oEvent.which == jQuery.sap.KeyCodes.SPACE) {
			if (!this.fireBarPress(oEvent)) {
				this.firePress();
				oEvent.preventDefault();
			}
		}
	};

	ColumnMicroChart.prototype.fireBarPress = function(oEvent) {
		var oBar = jQuery(oEvent.target);
		if (oBar && oBar.attr("data-bar-index")) {
			var iIndex = parseInt(oBar.attr("data-bar-index"), 10);
			var oCmcData = this.getColumns()[iIndex];
			if (oCmcData && oCmcData.hasListeners("press")) {
				oCmcData.firePress();
				oEvent.preventDefault();
				oEvent.stopPropagation();
				if (Device.browser.msie) {
					oBar.focus();
				}
				return true;
			}
		}
		return false;
	};

	ColumnMicroChart.prototype._getBarAltText = function(iBarIndex) {
		var oBar = this.getColumns()[iBarIndex];
		var sMeaning = this.getLocalizedColorMeaning(oBar.getColor());
		return oBar.getLabel() + " " + oBar.getValue() + " " + sMeaning;
	};

	ColumnMicroChart.prototype.setBarPressable = function(iBarIndex, bPressable) {
		if (bPressable) {
			var sBarAltText = this._getBarAltText(iBarIndex);
			jQuery.sap.byId(this.getId() + "-bar-" + iBarIndex).addClass("sapSuiteUiMicroChartPointer").attr("tabindex", 0).attr("title", sBarAltText).attr("role", "presentation").attr("aria-label", sBarAltText);
		} else {
			jQuery.sap.byId(this.getId() + "-bar-" + iBarIndex).removeAttr("tabindex").removeClass("sapSuiteUiMicroChartPointer").removeAttr("title").removeAttr("role").removeAttr("aria-label");
		}
	};

	ColumnMicroChart.prototype.onsaptabnext = function(oEvent) {
		var oLast = this.$().find(":focusable").last();  // last tabstop in the control
		if (oLast) {
			this._bIgnoreFocusEvt = true;
			oLast.get(0).focus();
		}
	};

	ColumnMicroChart.prototype.onsaptabprevious = function(oEvent) {
		if (oEvent.target.id != oEvent.currentTarget.id) {
			var oFirst = this.$().find(":focusable").first(); // first tabstop in the control
			if (oFirst) {
				oFirst.get(0).focus();
			}
		}
	};

	ColumnMicroChart.prototype.onfocusin = function(oEvent) {
		if (this._bIgnoreFocusEvt) {
			this._bIgnoreFocusEvt = false;
			return;
		}
		if (this.getId() + "-hidden" == oEvent.target.id) {
			this.$().focus();
			oEvent.preventDefault();
			oEvent.stopPropagation();
		}
	};

	/**
	 * Adds title attribute to show tooltip when the mouse enters chart.
	 *
	 * @private
	 */
	ColumnMicroChart.prototype._addTitleAttribute = function() {
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
	ColumnMicroChart.prototype._removeTitleAttribute = function() {
		if (this.$().attr("title")) {
			this.$().removeAttr("title");
		}
	};

	library._overrideGetAccessibilityInfo(ColumnMicroChart.prototype);

	return ColumnMicroChart;
});
