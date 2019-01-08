/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define(['jquery.sap.global', './library'],
	function(jQuery, library) {
	"use strict";

	/**
	 * ComparisonMicroChart renderer.
	 * @namespace
	 */
	var ComparisonMicroChartRenderer = {};

	/**
	 * Renders the HTML for the given control, using the provided
	 * {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm
	 *			the RenderManager that can be used for writing to
	 *			the Render-Output-Buffer
	 * @param {sap.ui.core.Control} oControl
	 *			the control to be rendered
	 */
	ComparisonMicroChartRenderer.render = function (oRm, oControl) {
		if (!oControl._bThemeApplied) {
			return;
		}
		var sAriaLabel = oControl.getAltText();

		oRm.write("<div");
		oRm.writeControlData(oControl);
		oRm.addClass("sapSuiteCpMC");
		oRm.addClass("sapSuiteCpMCChartContent");
		var sSize = oControl.getIsResponsive() ? "sapSuiteCpMCResponsive" : "sapSuiteCpMCSize" + oControl.getSize();
		oRm.addClass(sSize);
		if (oControl.hasListeners("press")) {
			oRm.writeAttribute("tabindex", "0");
			oRm.addClass("sapSuiteUiMicroChartPointer");
		}
		oRm.writeClasses();
		oRm.writeAttribute("role", "presentation");
		oRm.writeAttributeEscaped("aria-label", sAriaLabel);

		if (oControl.getShrinkable()) {
			oRm.addStyle("min-height", "0px");
		}
		if (!oControl.getIsResponsive() && oControl.getWidth()) {
			oRm.addStyle("width", oControl.getWidth());
		}
		if (!oControl.getIsResponsive() && oControl.getHeight()) {
			oRm.addStyle("height", oControl.getHeight());
		}
		oRm.writeStyles();
		oRm.write(">");
		this._renderInnerContent(oRm, oControl, sAriaLabel);
			oRm.write("<div");
			oRm.writeAttribute("id", oControl.getId() + "-info");
			oRm.writeAttribute("aria-hidden", "true");
			oRm.addStyle("display", "none");
			oRm.writeStyles();
			oRm.write(">");
				oRm.writeEscaped(sAriaLabel);
			oRm.write("</div>");

			oRm.write("<div");
			oRm.writeAttribute("id", oControl.getId() + "-hidden");
			oRm.writeAttribute("aria-hidden", "true");
			oRm.writeAttribute("tabindex", "-1");
			oRm.writeStyles();
			oRm.write(">");
			oRm.write("</div>");
		oRm.write("</div>");
	};

	ComparisonMicroChartRenderer._renderInnerContent = function(oRm, oControl, sAriaLabel) {
		var iCPLength = oControl.getColorPalette().length;
		var iCPIndex = 0;

		var fnNextColor = function() {
			if (iCPLength) {
				if (iCPIndex == iCPLength) {
					iCPIndex = 0;
				}
				return oControl.getColorPalette()[iCPIndex++];
			}
		};
		oRm.write("<div");
		oRm.addClass("sapSuiteCpMCVerticalAlignmentContainer");
		oRm.writeClasses();
		oRm.write(">");

		var aChartData = oControl._calculateChartData();
		for (var i = 0; i < aChartData.length; i++) {
			this._renderChartItem(oRm,  oControl, aChartData[i], i, fnNextColor());
		}
		oRm.write("</div>");
	};

	ComparisonMicroChartRenderer._renderChartItem = function(oRm, oControl, oChartData, iIndex, sColor) {
		var sSize = oControl.getIsResponsive() ? "sapSuiteCpMCResponsive" : "sapSuiteCpMCSize" + oControl.getSize();
		oRm.write("<div");
		oRm.writeAttribute("id", oControl.getId() + "-chart-item-" + iIndex);
		oRm.addClass("sapSuiteCpMCChartItem");
		oRm.addClass("sapSuiteCpMCViewType" + oControl.getView());
		if (!oControl.getIsResponsive()) {
			oRm.addClass(sSize);
		}
		oRm.writeClasses();
		oRm.write(">");
			this._renderChartHeader(oRm, oControl, iIndex, sColor);
			this._renderChartBar(oRm, oControl, oChartData, iIndex, sColor);
		oRm.write("</div>");
	};

	ComparisonMicroChartRenderer._renderChartBar = function(oRm, oControl, oChartData, iIndex, sColor) {
		var sSize = oControl.getIsResponsive() ? "sapSuiteCpMCResponsive" : "sapSuiteCpMCSize" + oControl.getSize();
		var oData = oControl.getData()[iIndex];

		oRm.write("<div");
		oRm.writeAttribute("id", oControl.getId() + "-chart-item-bar-" + iIndex);
		oRm.addClass("sapSuiteCpMCChartBar");
		oRm.addClass("sapSuiteCpMCViewType" + oControl.getView());
		oRm.addClass(sSize);
		if (oControl.getData()[iIndex].hasListeners("press")) {
			if (iIndex === 0) {
				oRm.writeAttribute("tabindex", "0");
			}
			oRm.writeAttribute("role", "presentation");
			oRm.writeAttributeEscaped("aria-label", oControl._getBarAltText(iIndex));
			if (!library._isTooltipSuppressed(oControl._getBarAltText(iIndex))) {
				oRm.writeAttributeEscaped("title", oControl._getBarAltText(iIndex));
			} else {
				// By setting the empty title attribute on the bar, the followng desired behavior is achieved:
				// no tooltip is displayed when hovering over the bar press area, independent whether the tooltip of the chart is suppressed or displayed.
				oRm.writeAttribute("title", "");
			}
			oRm.writeAttribute("data-bar-index", iIndex);
			oRm.addClass("sapSuiteUiMicroChartPointer");
		}
		oRm.writeClasses();
		oRm.write(">");

		if (oChartData.negativeNoValue > 0) {
			oRm.write("<div");
			oRm.writeAttribute("data-bar-index", iIndex);
			oRm.addClass("sapSuiteCpMCChartBarNegNoValue");
			if (oChartData.value > 0 || oChartData.positiveNoValue > 0) {
				oRm.addClass("sapSuiteCpMCNotLastBarPart");
			}
			oRm.writeClasses();
			oRm.addStyle("width", jQuery.sap.encodeHTML(oChartData.negativeNoValue + "%"));
			oRm.writeStyles();
			oRm.write("></div>");
		}

		if (oChartData.value > 0) {
			oRm.write("<div");
			oRm.writeAttribute("data-bar-index", iIndex);
			oRm.addClass("sapSuiteCpMCChartBarValue");
			oRm.addClass(jQuery.sap.encodeHTML("sapSuiteCpMCSemanticColor" + oData.getColor()));
			oRm.writeClasses();
			oRm.addStyle("background-color", sColor ? jQuery.sap.encodeHTML(sColor) : "");
			oRm.addStyle("width", jQuery.sap.encodeHTML(oChartData.value + "%"));
			oRm.writeStyles();
			oRm.write("></div>");
		}

		if (oChartData.positiveNoValue > 0) {
			oRm.write("<div");
			oRm.writeAttribute("data-bar-index", iIndex);
			oRm.addClass("sapSuiteCpMCChartBarNoValue");
			if (!!oChartData.negativeNoValue && !oChartData.value) {
				oRm.addClass("sapSuiteCpMCNegPosNoValue");
			} else if (!!oChartData.negativeNoValue || !!oChartData.value) {
				oRm.addClass("sapSuiteCpMCNotFirstBarPart");
			}
			oRm.writeClasses();
			oRm.addStyle("width", jQuery.sap.encodeHTML(oChartData.positiveNoValue + "%"));
			oRm.writeStyles();
			oRm.write("></div>");
		}

		oRm.write("</div>");
	};

	ComparisonMicroChartRenderer._renderChartHeader = function(oRm, oControl, iIndex, sColor) {
		var sSize = oControl.getIsResponsive() ? "sapSuiteCpMCResponsive" : "sapSuiteCpMCSize" + oControl.getSize();
		var oData = oControl.getData()[iIndex];
		var sScale = oControl.getScale();
		var sDisplayValue = oData.getDisplayValue();
		var sAValToShow = sDisplayValue ? sDisplayValue : "" + oData.getValue();
		var sValScale = sAValToShow + sScale;

		oRm.write("<div");
		oRm.writeAttribute("id", oControl.getId() + "-chart-item-" + iIndex + "-header");
		oRm.addClass("sapSuiteCpMCChartItemHeader");
		oRm.addClass("sapSuiteCpMCViewType" + oControl.getView());
		oRm.addClass(sSize);
		oRm.writeClasses();
		oRm.write(">");
			oRm.write("<div");
				oRm.writeAttribute("id", oControl.getId() + "-chart-item-" + iIndex + "-value");
				oRm.addClass("sapSuiteCpMCChartItemValue");
				oRm.addClass(sSize);
				oRm.addClass(jQuery.sap.encodeHTML("sapSuiteCpMCViewType" + oControl.getView()));
				if (!sColor) {
					oRm.addClass(jQuery.sap.encodeHTML("sapSuiteCpMCSemanticColor" + oData.getColor()));
				}

				if (oData.getTitle()) {
					oRm.addClass("sapSuiteCpMCTitle");
				}
				oRm.writeClasses();
				oRm.write(">");
				if (!isNaN(oData.getValue())) {
					oRm.writeEscaped(sValScale);
				}
			oRm.write("</div>");

			oRm.write("<div");
			oRm.writeAttribute("id", oControl.getId() + "-chart-item-" + iIndex + "-title");
			oRm.addClass("sapSuiteCpMCChartItemTitle");
			oRm.writeClasses();
			oRm.write(">");
				oRm.writeEscaped(oData.getTitle());
			oRm.write("</div>");
		oRm.write("</div>");
	};

	return ComparisonMicroChartRenderer;

}, /* bExport= */ true);
