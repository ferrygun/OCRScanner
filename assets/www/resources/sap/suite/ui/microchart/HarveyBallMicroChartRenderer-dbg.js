/*!
* SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
*/

sap.ui.define([
	"jquery.sap.global", "sap/m/library", "sap/ui/Device", "./library", "./HarveyBallMicroChart"
], function(jQuery, MobileLibrary, Device, library, HarveyBallMicroChart) {
	"use strict";

	/**
	 * HarveyBallMicroChartRenderer renderer.
	 * @namespace
	 */
	var HarveyBallMicroChartRenderer = {};

	HarveyBallMicroChartRenderer._iReferenceControlHeight = 72;
	HarveyBallMicroChartRenderer._iReferenceControlWidth = 168;

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the Render - Output - Buffer
	 * @param {sap.ui.core.Control} oControl the control to be rendered
	 */
	HarveyBallMicroChartRenderer.render = function(oRm, oControl) {
		if (!oControl._bThemeApplied) {
			return;
		}
		this._calculatePath(oControl);
		var aColorPalette = oControl.getColorPalette();
		var bRtl = sap.ui.getCore().getConfiguration().getRTL();
		var sAriaLabel = oControl.getAltText();
		var sTotalScale = "";
		var sValueLabel = "";
		var sValueScale = "";
		var bFmtLabel = false;
		var fValue = 0;
		var sColorClass = "";
		var sColor = aColorPalette.length > 0 ? aColorPalette[0] : null;
		var iCircleRadius = this._oPath.center;

		if (library._isThemeHighContrast()) {
			iCircleRadius -= 1;
		}

		if (MobileLibrary.ValueCSSColor.isValid(sColor)) {
			sColor = jQuery.sap.encodeHTML(aColorPalette[0]);
		} else {
			sColor = null;
		}

		// currently only value from first item is supported
		if (oControl.getItems().length) {
			var oPieItem = oControl.getItems()[0];
			fValue = oPieItem.getFraction();
			sColorClass = "sapSuiteHBMCSemanticColor" + jQuery.sap.encodeHTML(oPieItem.getColor());
			sValueLabel = oPieItem.getFractionLabel() ? oPieItem.getFractionLabel() : sValueLabel + oPieItem.getFraction();
			sValueScale = oPieItem.getFractionScale() ? oPieItem.getFractionScale().substring(0, 3) : sValueScale;
			bFmtLabel = oPieItem.getFormattedLabel();
		}

		if (bFmtLabel) {
			var oFormattedValue = oControl._parseFormattedValue(sValueLabel);

			sValueScale = oFormattedValue.scale.substring(0, 3);
			sValueLabel = oFormattedValue.value;
		}

		var fTotal = oControl.getTotal();
		var sTotalLabel = oControl.getTotalLabel() ? oControl.getTotalLabel() : "" + oControl.getTotal();
		if (oControl.getTotalScale()) {
			sTotalScale = oControl.getTotalScale().substring(0, 3);
		}

		if (oControl.getFormattedLabel()) {
			var oFormattedTotal = oControl._parseFormattedValue(sTotalLabel);
			sTotalScale = oFormattedTotal.scale.substring(0, 3);
			sTotalLabel = oFormattedTotal.value;
		}

		if (sValueLabel) {
			sValueLabel = HarveyBallMicroChart._truncateValue(sValueLabel, HarveyBallMicroChart.VALUE_TRUNCATION_DIGITS);
		}
		if (sTotalLabel) {
			sTotalLabel = HarveyBallMicroChart._truncateValue(sTotalLabel, HarveyBallMicroChart.VALUE_TRUNCATION_DIGITS);
		}

		var sSizeClass = "sapSuiteHBMCSize" + oControl.getSize();
		oRm.write("<div");
		oRm.writeControlData(oControl);
		oRm.writeAttribute("role", "presentation");
		oRm.writeAttributeEscaped("aria-label", sAriaLabel);
		oRm.addClass("sapSuiteHBMC");
		oRm.addClass(oControl.getIsResponsive() ? "sapSuiteHBMCResponsive" : jQuery.sap.encodeHTML(sSizeClass));
		if (oControl.hasListeners("press")) {
			oRm.addClass("sapSuiteUiMicroChartPointer");
			oRm.writeAttribute("tabindex", "0");
		}
		oRm.writeClasses();

		if (!oControl.getIsResponsive() && oControl.getWidth()) {
			oRm.addStyle("width", oControl.getWidth());
		}
		oRm.writeStyles();
		oRm.write(">");

		oRm.write("<div");
		oRm.addClass("sapSuiteHBMCChart");
		oRm.addClass(oControl.getIsResponsive() ? "sapSuiteHBMCResponsive" : jQuery.sap.encodeHTML(sSizeClass));
		oRm.writeClasses();
		oRm.addStyle("display", "inline-block");
		oRm.writeStyles();
		oRm.write(">");

		oRm.write("<svg");
		oRm.writeAttribute("id", oControl.getId() + "-harvey-ball");
		if (oControl.getIsResponsive()) {
			oRm.addClass("sapSuiteHBMCChart");
			oRm.addClass("sapSuiteHBMCResponsive");
			oRm.writeClasses();
			oRm.writeAttributeEscaped("viewBox", this._getSvgViewBoxProperties());
		} else {
			oRm.writeAttributeEscaped("width", this._oPath.size);
			oRm.writeAttributeEscaped("height", this._oPath.size);
		}
		oRm.writeAttribute("focusable", false);
		oRm.write(">");
		oRm.write("<g>");
		oRm.write("<circle");
		if (bRtl && oControl.getIsResponsive()) {
			oRm.writeAttributeEscaped("cx", HarveyBallMicroChartRenderer._iReferenceControlWidth - this._oPath.center);
		} else {
			oRm.writeAttributeEscaped("cx", this._oPath.center);
		}
		oRm.writeAttributeEscaped("cy", this._oPath.center);
		oRm.writeAttributeEscaped("r", iCircleRadius);
		oRm.addClass("sapSuiteHBMCBackgroundCircle");
		oRm.writeClasses();
		oRm.write("/>");

		if (fValue && fValue >= fTotal) {
			oRm.write("<circle");
			if (bRtl && oControl.getIsResponsive()) {
				oRm.writeAttributeEscaped("cx", HarveyBallMicroChartRenderer._iReferenceControlWidth - this._oPath.center);
			} else {
				oRm.writeAttributeEscaped("cx", this._oPath.center);
			}
			oRm.writeAttributeEscaped("cy", this._oPath.center);
			oRm.writeAttributeEscaped("r", iCircleRadius - this._oPath.border);
			oRm.addClass("sapSuiteHBMCSegment");
			if (sColor) {
				oRm.addStyle("fill", sColor);
				oRm.writeStyles();
			} else {
				oRm.addClass(jQuery.sap.encodeHTML(sColorClass));
			}
			oRm.writeClasses();

			oRm.write("/>");
		} else if (fValue > 0) {
			oRm.write("<path");
			oRm.writeAttribute("id", oControl.getId() + "-segment");
			oRm.addClass("sapSuiteHBMCSegment");
			if (sColor) {
				oRm.addStyle("fill", sColor);
				oRm.writeStyles();
			} else {
				oRm.addClass(jQuery.sap.encodeHTML(sColorClass));
			}
			oRm.writeClasses();
			oRm.writeAttributeEscaped("d", this._serializePieChart());

			oRm.write("/>");
		}

		oRm.write("</g>");
		if (oControl.getIsResponsive()) {
			if (oControl.getShowFractions()) {
				oRm.write("<text");
				oRm.writeAttribute("id", "sapSuiteHBMCTopText");
				if (bRtl && (Device.browser.msie || Device.browser.edge)) {
					oRm.writeAttribute("text-anchor", "end");
				} else {
					oRm.writeAttribute("text-anchor", "start");
				}
				oRm.writeAttribute("x", "80");
				oRm.writeAttribute("y", "30");
				oRm.addClass("sapSuiteHBMCResponsive");
				oRm.addClass("sapSuiteHBMCValueContainer");
				if (!sColor) {
					oRm.addClass(jQuery.sap.encodeHTML(sColorClass));
				}
				oRm.writeClasses();
				oRm.write(">");
				if (!bRtl) {
					this.renderFractionLabel(oRm, sValueLabel, sColor, bRtl);
					this.renderFractionScale(oRm, sValueScale, sColor, bRtl);
				} else {
					this.renderFractionScale(oRm, sValueScale, sColor, bRtl);
					this.renderFractionLabel(oRm, sValueLabel, sColor, bRtl);
				}
				oRm.write("</text>");
			}
			if (oControl.getShowTotal()) {
				oRm.write("<text");
				oRm.writeAttribute("id", "sapSuiteHBMCBottomText");
				if (!bRtl) {
					oRm.writeAttributeEscaped("x", HarveyBallMicroChartRenderer._iReferenceControlWidth);
				} else {
					oRm.writeAttribute("x", "0");
				}
				oRm.writeAttribute("y", "65");

				if (bRtl && (Device.browser.msie || Device.browser.edge)) {
					oRm.writeAttribute("text-anchor", "start");
				} else {
					oRm.writeAttribute("text-anchor", "end");
				}

				oRm.addClass("sapSuiteHBMCResponsive");
				oRm.addClass("sapSuiteHBMCTotal");
				oRm.addClass("sapSuiteHBMCTotalContainer");
				oRm.writeClasses();
				oRm.write(">");
				if (!bRtl) {
					this.renderTotalLabel(oRm, sTotalLabel, bRtl);
					this.renderTotalScale(oRm, sTotalScale, bRtl);
				} else {
					this.renderTotalScale(oRm, sTotalScale, bRtl);
					this.renderTotalLabel(oRm, sTotalLabel, bRtl);
				}
				oRm.write("</text>");
			}
		}
		oRm.write("</svg>");
		oRm.write("</div>");

		if (!oControl.getIsResponsive()) {
			oRm.write("<div");
			oRm.addClass("sapSuiteHBMCValueContainer");
			oRm.addClass(jQuery.sap.encodeHTML(sSizeClass));
			oRm.writeClasses();
			oRm.addStyle("display", oControl.getShowFractions() ? "inline-block" : "none");
			oRm.writeStyles();
			oRm.write(">");
			this.renderLabel(oRm, oControl, [
				sColorClass,
				sSizeClass,
				"sapSuiteHBMCValue"
			], sValueLabel, sColor, "-fraction");
			this.renderLabel(oRm, oControl, [
				sColorClass,
				sSizeClass,
				"sapSuiteHBMCValueScale"
			], sValueScale, sColor, "-fraction-scale");
			oRm.write("</div>");

			oRm.write("<div");
			oRm.addClass("sapSuiteHBMCTotalContainer");
			oRm.addClass(jQuery.sap.encodeHTML(sSizeClass));
			oRm.writeClasses();
			if (bRtl) {
				oRm.addStyle("left", "0");
			} else {
				oRm.addStyle("right", "0");
			}
			oRm.addStyle("display", oControl.getShowTotal() ? "inline-block" : "none");
			oRm.writeStyles();
			oRm.write(">");
			this.renderLabel(oRm, oControl, [
				sColorClass,
				sSizeClass,
				"sapSuiteHBMCTotal"
			], sTotalLabel, sColor, "-total");
			this.renderLabel(oRm, oControl, [
				sColorClass,
				sSizeClass,
				"sapSuiteHBMCTotalScale"
			], sTotalScale, sColor, "-total-scale");
			oRm.write("</div>");
		}
		oRm.write("</div>");
	};

	HarveyBallMicroChartRenderer.renderFractionLabel = function(oRm, sFractionLabel, sColor, bRtl) {
		oRm.write("<tspan");
		if (bRtl) {
			// px is used instead of rem for IE compatibility reasons
			oRm.writeAttribute("dx", "4.8px");
		}
		if (sColor) {
			oRm.addStyle("fill", sColor);
			oRm.writeStyles();
		}
		oRm.write(">");
		oRm.writeEscaped(sFractionLabel);
		oRm.write("</tspan>");
	};

	HarveyBallMicroChartRenderer.renderFractionScale = function(oRm, sFractionScale, sColor, bRtl) {
		oRm.write("<tspan");
		oRm.writeAttribute("font-size", "0.8rem");
		if (!bRtl) {
			// px is used instead of rem for IE compatibility reasons
			oRm.writeAttribute("dx", "4.8px");
		}
		if (sColor) {
			oRm.addStyle("fill", sColor);
			oRm.writeStyles();
		}
		oRm.write(">");
		oRm.writeEscaped(sFractionScale);
		oRm.write("</tspan>");
	};

	HarveyBallMicroChartRenderer.renderTotalLabel = function(oRm, sTotalLabel, bRtl) {
		oRm.write("<tspan");
		if (bRtl) {
			// px is used instead of rem for IE compatibility reasons
			oRm.writeAttribute("dx", "4.8px");
		} else if (Device.browser.msie || Device.browser.edge) {
			oRm.writeAttribute("dx", "-4.8px");
		}
		oRm.write(">");
		oRm.writeEscaped(sTotalLabel);
		oRm.write("</tspan>");
	};

	HarveyBallMicroChartRenderer.renderTotalScale = function(oRm, sTotalScale, bRtl) {
		oRm.write("<tspan");
		if (!bRtl) {
			// px is used instead of rem for IE compatibility reasons
			oRm.writeAttribute("dx", "4.8px");
		}
		oRm.write(">");
		oRm.writeEscaped(sTotalScale);
		oRm.write("</tspan>");
	};

	HarveyBallMicroChartRenderer.renderLabel = function(oRm, oControl, aClasses, sLabel, sColor, sId) {
		var bUseColorPalette = !(aClasses.indexOf("sapSuiteHBMCTotal") > -1 || aClasses.indexOf("sapSuiteHBMCTotalScale") > -1);
		oRm.write("<span");
		oRm.writeAttribute("id", oControl.getId() + sId);
		for (var i = 0; i < aClasses.length; i++) {
			// uses palette color only for fraction label and scale
			if (i === 0 && sColor && bUseColorPalette) {
				oRm.addStyle("color", sColor);
				oRm.writeStyles();
			} else {
				oRm.addClass(jQuery.sap.encodeHTML(aClasses[i]));
			}
		}
		oRm.writeClasses();
		oRm.write(">");
		if (sLabel) {
			oRm.writeEscaped(sLabel);
		}
		oRm.write("</span>");

	};

	HarveyBallMicroChartRenderer._getSvgViewBoxProperties = function() {
		return "0 0 " + HarveyBallMicroChartRenderer._iReferenceControlWidth + " " + HarveyBallMicroChartRenderer._iReferenceControlHeight;
	};

	HarveyBallMicroChartRenderer._calculatePath = function(oControl) {
		var oSize = oControl.getSize();
		var fTot = oControl.getTotal();
		var fFrac = 0;
		if (oControl.getItems().length) {
			fFrac = oControl.getItems()[0].getFraction();
		}
		var bIsPhone = false;

		if (oSize == "Auto") {
			bIsPhone = jQuery("html").hasClass("sapUiMedia-Std-Phone");
		}

		if (oSize == "S" || oSize == "XS") {
			bIsPhone = true;
		}

		var iMediaSize = bIsPhone ? 56 : 72;
		if (oControl.getIsResponsive()) {
			iMediaSize = HarveyBallMicroChartRenderer._iReferenceControlHeight;
		}
		var iCenter = iMediaSize / 2;
		var iBorder = 4;
		var bRtl = sap.ui.getCore().getConfiguration().getRTL();
		var bRtlResponsive;
		if (oControl.getIsResponsive() && bRtl) {
			bRtlResponsive = true;
		} else {
			bRtlResponsive = false;
		}
		this._oPath = {
			initial: {
				x: !bRtlResponsive ? iCenter : HarveyBallMicroChartRenderer._iReferenceControlWidth - iCenter,
				y: iCenter,
				x1: !bRtlResponsive ? iCenter : HarveyBallMicroChartRenderer._iReferenceControlWidth - iCenter,
				y1: iCenter
			},
			lineTo: {
				x: !bRtlResponsive ? iCenter : HarveyBallMicroChartRenderer._iReferenceControlWidth - iCenter,
				y: iBorder
			},
			arc: {
				x1: iCenter - iBorder,
				y1: iCenter - iBorder,
				xArc: 0,
				largeArc: 0,
				sweep: 1,
				x2: "",
				y2: ""
			},
			size: iMediaSize,
			border: iBorder,
			center: iCenter
		};

		var fAngle = fFrac / fTot * 360;
		if (fAngle < 10) {
			this._oPath.initial.x -= 1.5;
			this._oPath.initial.x1 += 1.5;
			this._oPath.arc.x2 = this._oPath.initial.x1;
			this._oPath.arc.y2 = this._oPath.lineTo.y;
		} else if (fAngle > 350 && fAngle < 360) {
			this._oPath.initial.x += 1.5;
			this._oPath.initial.x1 -= 1.5;
			this._oPath.arc.x2 = this._oPath.initial.x1;
			this._oPath.arc.y2 = this._oPath.lineTo.y;
		} else {
			var fRad = Math.PI / 180.0;
			var fRadius = this._oPath.center - this._oPath.border;
			var ix;
			if (!bRtlResponsive) {
				ix = fRadius * Math.cos((fAngle - 90) * fRad) + this._oPath.center;
			} else {
				ix = fRadius * Math.cos((fAngle - 90) * fRad) + HarveyBallMicroChartRenderer._iReferenceControlWidth - this._oPath.center;
			}
			var iy = this._oPath.size - (fRadius * Math.sin((fAngle + 90) * fRad) + this._oPath.center);
			this._oPath.arc.x2 = ix.toFixed(2);
			this._oPath.arc.y2 = iy.toFixed(2);
		}
		var iLargeArc = fTot / fFrac < 2 ? 1 : 0;

		this._oPath.arc.largeArc = iLargeArc;
	};

	HarveyBallMicroChartRenderer._serializePieChart = function() {
		var p = this._oPath;
		return [
			"M", p.initial.x, ",", p.initial.y, " L", p.initial.x, ",", p.lineTo.y, " A", p.arc.x1, ",", p.arc.y1,
			" ", p.arc.xArc, " ", p.arc.largeArc, ",", p.arc.sweep, " ", p.arc.x2, ",", p.arc.y2, " L", p.initial.x1,
			",", p.initial.y1, " z"
		].join("");
	};

	return HarveyBallMicroChartRenderer;

}, /* bExport */ true);
