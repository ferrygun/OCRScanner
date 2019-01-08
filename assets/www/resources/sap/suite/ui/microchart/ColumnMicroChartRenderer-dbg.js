 /*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define(['jquery.sap.global'],
	function(jQuery) {
	"use strict";

	/**
	 * ColumnMicroChartRenderer renderer.
	 * @namespace
	 */
	var ColumnMicroChartRenderer = {};

	/**
	 * Renders the HTML for the given control, using the provided
	 * {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to	the Render-Output-Buffer
	 * @param {sap.ui.core.Control} oControl the control to be rendered
	 */
	ColumnMicroChartRenderer.render = function(oRm, oControl) {
		if (!oControl._bThemeApplied) {
			return;
		}
		function fnWriteLbl(oLabel, sId, sClass, bWideBtmLbl) {
			oRm.write("<div");
			oRm.writeAttributeEscaped("id", oControl.getId() + sId);
			oRm.addClass("sapSuiteClMCLbl");
			oRm.addClass(jQuery.sap.encodeHTML(sClass));
			oRm.addClass(jQuery.sap.encodeHTML("sapSuiteClMCSemanticColor" + oLabel.getColor()));
			if (bWideBtmLbl) {
				oRm.addClass("sapSuiteClMCWideBtmLbl");
			}
			oRm.writeClasses();
			oRm.write(">");
				oRm.writeEscaped(oLabel.getLabel());
			oRm.write("</div>");
		}

		oRm.write("<div");
		oRm.writeControlData(oControl);
		oRm.addClass("sapSuiteClMC");
		var sSize = "sapSuiteClMCSize" + oControl.getSize();
		if (oControl.getIsResponsive()) {
			sSize = "sapSuiteClMCResponsive";
		}
		oRm.addClass(sSize);
		var sAriaLabel = oControl.getAltText();

		if (oControl.hasListeners("press")) {
			oRm.addClass("sapSuiteUiMicroChartPointer");
			oRm.writeAttribute("tabindex", "0");
		}
		oRm.writeAttribute("role", "presentation");
		oRm.writeAttributeEscaped("aria-label", sAriaLabel);

		oRm.writeClasses();
		oRm.addStyle("width", oControl.getWidth());
		oRm.addStyle("height", oControl.getHeight());
		oRm.writeStyles();
		oRm.write(">");
			var bLeftTopLbl = oControl.getLeftTopLabel() && oControl.getLeftTopLabel().getLabel() != "";
			var bRightTopLbl = oControl.getRightTopLabel() && oControl.getRightTopLabel().getLabel() != "";
			var bLeftBtmLbl = oControl.getLeftBottomLabel() && oControl.getLeftBottomLabel().getLabel() != "";
			var bRightBtmLbl = oControl.getRightBottomLabel() && oControl.getRightBottomLabel().getLabel() != "";

			if (bLeftTopLbl || bRightTopLbl) {
				oRm.write("<div");
				oRm.writeAttributeEscaped("id", oControl.getId() + "-top-lbls");
				oRm.addClass("sapSuiteClMCLbls");
				oRm.addClass("sapSuiteClMCPositionTop");
				oRm.writeClasses();
				oRm.write(">");
					var bWideTopLbl = bLeftTopLbl ^ bRightTopLbl;
					if (bLeftTopLbl) {
						fnWriteLbl(oControl.getLeftTopLabel(), "-left-top-lbl", "sapSuiteClMCPositionLeft", bWideTopLbl);
					}

					if (bRightTopLbl) {
						fnWriteLbl(oControl.getRightTopLabel(), "-right-top-lbl", "sapSuiteClMCPositionRight", bWideTopLbl);
					}
				oRm.write("</div>");
			}

			oRm.write("<div");
			oRm.writeAttributeEscaped("id", oControl.getId() + "-content");
			oRm.addClass("sapSuiteClMCCnt");
			if (bLeftTopLbl || bRightTopLbl) {
				oRm.addClass("sapSuiteClMCPositionTop");
			}
			if (bLeftBtmLbl || bRightBtmLbl) {
				oRm.addClass("sapSuiteClMCPositionBtm");
			}
			oRm.writeClasses();
			oRm.write(">");
				oRm.write("<div");
				oRm.writeAttributeEscaped("id", oControl.getId() + "-bars");
				oRm.addClass("sapSuiteClMCBars");
				oRm.writeClasses();
				oRm.write(">");
					var iColumnsNum = oControl.getColumns().length;
					for (var i = 0; i < iColumnsNum; i++) {
						var oColumn = oControl.getColumns()[i];
						oRm.write("<div");
						oRm.writeAttributeEscaped("id", oControl.getId() + "-bar-" + i);
						oRm.writeAttribute("data-bar-index", i);
						oRm.addClass("sapSuiteClMCBar");
						oRm.addClass(jQuery.sap.encodeHTML("sapSuiteClMCSemanticColor" + oColumn.getColor()));
						if (oColumn.hasListeners("press")) {
							oRm.writeAttribute("tabindex", "0");
							oRm.writeAttribute("role", "presentation");
							var sBarAltText = oControl._getBarAltText(i);
							oRm.writeAttributeEscaped("title", sBarAltText);
							oRm.writeAttributeEscaped("aria-label", sBarAltText);
							oRm.addClass("sapSuiteUiMicroChartPointer");
						}
						oRm.writeClasses();
						oRm.write(">");
						oRm.write("</div>");
					}
				oRm.write("</div>");
			oRm.write("</div>");

			if (bLeftBtmLbl || bRightBtmLbl) {
				oRm.write("<div");
				oRm.writeAttributeEscaped("id", oControl.getId() + "-btm-lbls");
				oRm.addClass("sapSuiteClMCLbls");
				oRm.addClass("sapSuiteClMCPositionBtm");
				oRm.writeClasses();
				oRm.write(">");
					var bWideBtmLbl = bLeftBtmLbl ^ bRightBtmLbl;
					if (bLeftBtmLbl) {
						fnWriteLbl(oControl.getLeftBottomLabel(), "-left-btm-lbl", "sapSuiteClMCPositionLeft", bWideBtmLbl);
					}

					if (bRightBtmLbl) {
						fnWriteLbl(oControl.getRightBottomLabel(), "-right-btm-lbl", "sapSuiteClMCPositionRight", bWideBtmLbl);
					}
				oRm.write("</div>");
			}

			oRm.write("<div");
			oRm.writeAttributeEscaped("id", oControl.getId() + "-hidden");
			oRm.writeAttribute("aria-hidden", "true");
			oRm.writeAttribute("tabindex", "0");
			oRm.writeStyles();
			oRm.write(">");
			oRm.write("</div>");
		oRm.write("</div>");
	};

	return ColumnMicroChartRenderer;

}, /* bExport= */ true);
