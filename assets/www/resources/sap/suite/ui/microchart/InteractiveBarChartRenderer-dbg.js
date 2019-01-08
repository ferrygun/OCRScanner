 /*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([ "jquery.sap.global", "sap/m/library" ],
	function(jQuery, MobileLibrary) {
	"use strict";

	/**
	* InteractiveBarChartRenderer renderer.
	* @namespace
	*/
	var InteractiveBarChartRenderer = {};

	// bar direction positive constants
	InteractiveBarChartRenderer.BAR_DIRECTION_POSITIVE = {
		NAME: "positive",
		WRAPPER_CSSCLASS: "sapSuiteIBCBarWrapperPositive",
		CSSCLASS: "sapSuiteIBCBarPositive"
	};
	// bar direction negative constants
	InteractiveBarChartRenderer.BAR_DIRECTION_NEGATIVE = {
		NAME: "negative",
		WRAPPER_CSSCLASS: "sapSuiteIBCBarWrapperNegative",
		CSSCLASS: "sapSuiteIBCBarNegative"
	};

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the rendering buffer
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 */
	InteractiveBarChartRenderer.render = function(oRm, oControl) {
		if (!oControl._bThemeApplied) {
			return;
		}

		var aBars = oControl.getBars(),
			iBarsNum =  Math.min(oControl.getDisplayedBars(), aBars.length);

		oRm.write("<div");
		oRm.writeControlData(oControl);
		oRm.addClass("sapSuiteIBC");
		oRm.writeClasses();
		oRm.writeStyles();

		// tooltip for chart (non-interactive mode)
		if (!oControl._isChartEnabled()) {
			var sAreaTooltip = oControl.getTooltip_AsString();
			if (jQuery.type(sAreaTooltip) === "string") {
				oRm.writeAttributeEscaped("title", sAreaTooltip);
			}
		}

		// container accessibility
		var oAccOptions = {};
		oAccOptions.role = "listbox";
		oAccOptions.multiselectable = true;
		oAccOptions.disabled = !oControl._isChartEnabled();
		oAccOptions.labelledby = oControl.getAriaLabelledBy();
		oAccOptions.describedby = this._getAriaDescribedBy(oControl, iBarsNum);
		oRm.writeAccessibilityState(oControl, oAccOptions);

		oRm.write(">");
		if (!oControl.getSelectionEnabled()) {
			this.renderDisabledOverlay(oRm, oControl);
		}
		for (var i = 0; i < iBarsNum; i++) {
			this._renderBar(oRm, oControl, aBars[i], i, iBarsNum);
		}
		oRm.write("</div>");
	};

	/**
	 * Renders the HTML for the given bar, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the rendering buffer
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 * @param {sap.suite.ui.microchart.InteractiveBarChartBar} bar The bar segment to be rendered
	 * @param {int} barIndex The index of the bar inside the bars aggregation
	 * @param {int} barsCount The total number of displayed bars
	 * @private
	 */
	InteractiveBarChartRenderer._renderBar = function(oRm, oControl, bar, barIndex, barsCount) {
		var sValue, sLabel, sTooltip, sAriaLabel, sColor, sLocalizedColor;

		oRm.write("<div");
		oRm.writeAttributeEscaped("id", oControl.getId() + "-interactionArea-" + barIndex);
		oRm.writeAttributeEscaped("data-sap-ui-ibc-selection-index", barIndex);
		oRm.addClass("sapSuiteIBCBarInteractionArea");
		if (bar.getSelected()) {
			oRm.addClass("sapSuiteIBCBarSelected");
		}
		// the first bar has tab-index at the first rendering
		if (barIndex === 0 && oControl._isChartEnabled()) {
			oRm.writeAttribute("tabindex", "0");
		}
		// tooltip for bar (interactive mode)
		if (oControl._isChartEnabled()) {
			sTooltip = bar.getTooltip_AsString();
			if (jQuery.type(sTooltip) === "string") {
				oRm.writeAttributeEscaped("title", sTooltip);
			}
		}

		// bar accessibility
		sLabel = bar.getLabel();
		sAriaLabel = sLabel;
		if (oControl._bMinMaxValid) {
			sValue = this._getDisplayValue(bar, oControl);
			var sTooltip = bar.getTooltip_Text();
			if (sTooltip && jQuery.trim(sTooltip).length > 0) {
				sAriaLabel = sTooltip;
			} else {
				if (sAriaLabel) {
					sAriaLabel = sAriaLabel + " " + sValue;
				} else {
					sAriaLabel = sValue;
				}
				if (oControl._bUseSemanticTooltip) {
					sColor = bar.getColor();
					sLocalizedColor = oControl._oRb.getText(("SEMANTIC_COLOR_" + sColor.toUpperCase()));
					sAriaLabel += " " + sLocalizedColor;
				}
			}
		}

		var oAccOptions = {};
		oAccOptions.role = "option";
		oAccOptions.label = sAriaLabel;
		oAccOptions.selected = bar.getSelected();
		oAccOptions.posinset = barIndex + 1;
		oAccOptions.setsize = barsCount;
		oRm.writeAccessibilityState(bar, oAccOptions);

		oRm.writeStyles();
		oRm.writeClasses();
		oRm.write(">");
		sLabel = bar.getLabel();
		if (bar.getColor() !== MobileLibrary.ValueColor.Neutral) {
			oRm.write("<div");
			oRm.addClass("sapSuiteIBCSemanticMarker");
			oRm.addClass("sapSuiteIBCSemantic" + bar.getColor());
			oRm.writeClasses();
			oRm.write("/>");
		}
		oRm.write("<div");
		oRm.writeAttributeEscaped("id", oControl.getId() + "-label-" + barIndex);
		oRm.addClass("sapSuiteIBCBarLabel");
		oRm.writeClasses();
		oRm.write(">");
		oRm.write("<div");
		oRm.addClass("sapSuiteIBCBarLabelText");
		oRm.writeClasses();
		oRm.write(">");
		oRm.writeEscaped(sLabel);
		oRm.write("</div>");
		oRm.write("</div>");
		if (oControl._bMinMaxValid) {

			//renders the wrapper
			oRm.write("<div");
			oRm.addClass("sapSuiteIBCBarWrapper");
			oRm.writeClasses();
			oRm.write(">");

			//renders the negative bar
			this._renderBarDirection(oRm, oControl, bar, barIndex, sValue, InteractiveBarChartRenderer.BAR_DIRECTION_NEGATIVE);

			//renders the divider
			oRm.write("<div");
			oRm.addClass("sapSuiteIBCDivider");
			oRm.writeClasses();
			oRm.write("/>");

			//renders the positive bar
			this._renderBarDirection(oRm, oControl, bar, barIndex, sValue, InteractiveBarChartRenderer.BAR_DIRECTION_POSITIVE);

			oRm.write("</div>");
		}
		oRm.write("</div>");
	};

	/**
	 * Renders the HTML for the given bar direction, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the rendering buffer
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 * @param {sap.suite.ui.microchart.InteractiveBarChartBar} bar The bar segment to be rendered
	 * @param {int} barIndex The index of the bar inside the bars aggregation
	 * @param {string} displayValue The bar value to be displayed
	 * @param {int} barDirection The direction of the bar (positive or negative)
	 * @private
	 */
	InteractiveBarChartRenderer._renderBarDirection = function(oRm, oControl, bar, barIndex, displayValue, barDirection) {
		var fValue = bar.getValue();
		oRm.write("<div");
		oRm.addClass(barDirection.WRAPPER_CSSCLASS);
		oRm.writeClasses();
		oRm.write(">");
		oRm.write("<div");
		oRm.writeAttributeEscaped("id", oControl.getId() + "-bar-" + barDirection.NAME + "-" + barIndex);
		oRm.addClass("sapSuiteIBCBar");
		oRm.addClass(barDirection.CSSCLASS);
		if (fValue > 0) {
			oRm.addClass("sapSuiteIBCValuePositive");
		} else if (fValue === 0 || bar._bNullValue) {
			oRm.addClass("sapSuiteIBCBarValueNull");
		} else {
			oRm.addClass("sapSuiteIBCValueNegative");
		}
		oRm.writeClasses();
		oRm.write(">");
		this._renderDisplayedValue(oRm, oControl, bar, oControl.getId(), barIndex, displayValue, barDirection);
		oRm.write("</div>");
		oRm.write("</div>");
	};

	/**
	 * Renders the value to be displayed for the given bar, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the rendering buffer
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 * @param {sap.suite.ui.microchart.InteractiveBarChartBar} bar The bar segment to be rendered
	 * @param {string} controlId The id of the control to be rendered
	 * @param {int} barIndex The index of the bar inside the bars aggregation
	 * @param {string} displayValue The bar value to be displayed
	 * @param {object} barDirection The direction of the bar (positive or negative)
	 * @private
	 */
	InteractiveBarChartRenderer._renderDisplayedValue = function(oRm, oControl, bar, controlId, barIndex, displayValue, barDirection) {
		var bPositiveValue;
		if (bar._bNullValue) {
			if (oControl._fMin < 0 && oControl._fMax > 0) {
				// N/A position for mixed values: check which space is bigger for the label
				bPositiveValue = Math.abs(oControl._fMax) >= Math.abs(oControl._fMin);
			} else {
				// N/A position for non-mixed values: determine the direction of the space
				bPositiveValue = oControl._fMin >= 0;
			}
		} else {
			// Label position for non N/A
			bPositiveValue = bar.getValue() >= 0;
		}

		// only draw the span containing the displayedValue once in the correct corresponding positive/negative area as both areas always exist
		if (barDirection === InteractiveBarChartRenderer.BAR_DIRECTION_POSITIVE && bPositiveValue ||
				barDirection === InteractiveBarChartRenderer.BAR_DIRECTION_NEGATIVE && !bPositiveValue) {
			if (bar._bNullValue) {
				oRm.addClass("sapSuiteIBCBarValueNA");
				oRm.addClass("sapSuiteIBCBarValueOutside");
			}
			oRm.write("<span");
			oRm.writeAttributeEscaped("id", controlId + "-displayedValue-" + barIndex);
			oRm.addClass("sapSuiteIBCBarValue");
			oRm.writeClasses();
			oRm.write(">");
			oRm.writeEscaped(displayValue);
			oRm.write("</span>");
		}
	};

	/**
	 * Renders an additional disabling overlay.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the rendering buffer
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 * @private
	 */
	InteractiveBarChartRenderer.renderDisabledOverlay = function(oRm, oControl) {
		oRm.write("<div");
		oRm.addClass("sapSuiteIBCDisabledOverlay");
		oRm.writeClasses();
		oRm.write(">");
		oRm.write("</div>");
	};

	/**
	 * Creates the value to be displayed for the given bar.
	 *
	 * @param {sap.suite.ui.microchart.InteractiveBarChartBar} bar The bar segment to be rendered
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 * @returns {string} The display value for the bar
	 * @private
	 */
	InteractiveBarChartRenderer._getDisplayValue = function(bar, oControl) {
		var sValue, fValue;
		sValue = bar.getDisplayedValue();
		fValue = bar.getValue();
		if (bar._bNullValue) {
			// 'N/A' is displayed if value does not exist (regardless of whether the displayedValue exists or not)
			sValue = oControl._oRb.getText("INTERACTIVECHART_NA");
		} else if (!sValue) {
			sValue = fValue.toString();
		}
		return sValue;
	};

	/**
	 * Creates the value of the aria-describedby accessibility attribute
	 *
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 * @param {int} barsNum The amount of bars
	 * @returns {string} A comma-separated list of all InteractionArea's IDs
	 * @private
	 */
	InteractiveBarChartRenderer._getAriaDescribedBy = function(oControl, barsNum) {
		var aAreaIds = [];
		for (var i = 0; i < barsNum; i++) {
			aAreaIds.push(oControl.getId() + "-interactionArea-" + i);
		}
		return aAreaIds.join(",");
	};
	return InteractiveBarChartRenderer;

}, /* bExport */ true);
