/*!
* SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
*/

sap.ui.define([
	"jquery.sap.global"
], function(jQuery) {
	"use strict";

	/**
	 * AreaMicroChartRenderer renderer.
	 * @namespace
	 */
	var AreaMicroChartRenderer = {};

	/**
	 * Renders the HTML for the given control, using the provided
	 * {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 */
	AreaMicroChartRenderer.render = function(oRm, oControl) {
		if (!oControl._bThemeApplied) {
			return;
		}
		var sAriaLabel = oControl.getAltText();

		var sTopLblType = ((oControl.getView() == "Normal" && oControl.getFirstYLabel() && oControl.getFirstYLabel().getLabel()) ? "L" : "")
			+ ((oControl.getMaxLabel() && oControl.getMaxLabel().getLabel()) ? "C" : "")
			+ ((oControl.getView() == "Normal" && oControl.getLastYLabel() && oControl.getLastYLabel().getLabel()) ? "R" : "");

		var sBtmLblType = ((oControl.getView() == "Normal" && oControl.getFirstXLabel() && oControl.getFirstXLabel().getLabel()) ? "L" : "")
			+ ((oControl.getMinLabel() && oControl.getMinLabel().getLabel()) ? "C" : "")
			+ ((oControl.getView() == "Normal" && oControl.getLastXLabel() && oControl.getLastXLabel().getLabel()) ? "R" : "");

		var bLeftLbls, bRightLbls;
		bRightLbls = bLeftLbls = oControl.getView() == "Wide";

		oRm.write("<div");
		oRm.writeControlData(oControl);
		oRm.addStyle("width", oControl.getIsResponsive() ? "100%" : oControl.getWidth());
		oRm.addStyle("height", oControl.getIsResponsive() ? "100%" : oControl.getHeight());
		oRm.writeStyles();
		oRm.writeAttribute("role", "presentation");
		oRm.writeAttributeEscaped("aria-label", sAriaLabel);
		oRm.addClass("sapSuiteAMC");
		if (oControl.hasListeners("press")) {
			oRm.addClass("sapSuiteUiMicroChartPointer");
			oRm.writeAttribute("tabindex", "0");
		}

		if (sTopLblType) {
			oRm.addClass("sapSuiteAMCTopLbls");
		}
		if (sBtmLblType) {
			oRm.addClass("sapSuiteAMCBtmLbls");
		}

		oRm.writeClasses();
		oRm.write(">");
		if (sTopLblType && oControl.getShowLabel()) {
			var sTopLblTypeClass = "sapSuiteAMCLblType" + sTopLblType;
			oRm.write("<div");
			oRm.writeAttributeEscaped("id", oControl.getId() + "-top-labels");
			oRm.addClass("sapSuiteAMCLabels");
			oRm.addClass("sapSuiteAMCPositionTop");
			oRm.writeClasses();
			oRm.write(">");
			this._writeLabel(oRm, oControl, oControl.getFirstYLabel(), "-top-left-lbl", "sapSuiteAMCPositionLeft", sTopLblTypeClass);
			this._writeLabel(oRm, oControl, oControl.getMaxLabel(), "-top-center-lbl", "sapSuiteAMCPositionCenter", sTopLblTypeClass);
			this._writeLabel(oRm, oControl, oControl.getLastYLabel(), "-top-right-lbl", "sapSuiteAMCPositionRight", sTopLblTypeClass);
			oRm.write("</div>");
		}

		if (bLeftLbls && oControl.getShowLabel()) {
			oRm.write("<div");
			oRm.writeAttributeEscaped("id", oControl.getId() + "-left-labels");
			oRm.addClass("sapSuiteAMCSideLabels");
			oRm.addClass("sapSuiteAMCPositionLeft");
			oRm.writeClasses();
			oRm.write(">");
			this._writeLabel(oRm, oControl, oControl.getFirstYLabel(), "-top-left-lbl", "sapSuiteAMCPositionTop", "sapSuiteAMCPositionLeft");
			this._writeLabel(oRm, oControl, oControl.getFirstXLabel(), "-btm-left-lbl", "sapSuiteAMCPositionBtm", "sapSuiteAMCPositionLeft");
			oRm.write("</div>");
		}

		oRm.write("<div");
		oRm.writeAttributeEscaped("id", oControl.getId() + "-canvas-cont");
		oRm.addClass("sapSuiteAMCCanvas");
		oRm.writeClasses();
		oRm.write(">");
		oRm.write("<canvas");
		oRm.writeAttributeEscaped("id", oControl.getId() + "-canvas");
		oRm.addStyle("width", "100%");
		oRm.addStyle("height", "100%");
		oRm.addStyle("position", "absolute");
		oRm.addStyle("display", "block");
		oRm.writeStyles();
		oRm.write("></canvas>");
		oRm.write("</div>");

		if (bRightLbls && oControl.getShowLabel()) {
			oRm.write("<div");
			oRm.writeAttributeEscaped("id", oControl.getId() + "-right-labels");
			oRm.addClass("sapSuiteAMCSideLabels");
			oRm.addClass("sapSuiteAMCPositionRight");
			oRm.writeClasses();
			oRm.write(">");
			this._writeLabel(oRm, oControl, oControl.getLastYLabel(), "-top-right-lbl", "sapSuiteAMCPositionTop", "sapSuiteAMCPositionRight");
			this._writeLabel(oRm, oControl, oControl.getLastXLabel(), "-btm-right-lbl", "sapSuiteAMCPositionBtm", "sapSuiteAMCPositionRight");
			oRm.write("</div>");
		}

		if (sBtmLblType && oControl.getShowLabel()) {
			var sBtmLblTypeClass = "sapSuiteAMCLblType" + sBtmLblType;
			oRm.write("<div");
			oRm.writeAttributeEscaped("id", oControl.getId() + "-bottom-labels");
			oRm.addClass("sapSuiteAMCLabels");
			oRm.addClass("sapSuiteAMCPositionBtm");
			oRm.writeClasses();
			oRm.write(">");
			this._writeLabel(oRm, oControl, oControl.getFirstXLabel(), "-btm-left-lbl", "sapSuiteAMCPositionLeft", sBtmLblTypeClass);
			this._writeLabel(oRm, oControl, oControl.getMinLabel(), "-btm-center-lbl", "sapSuiteAMCPositionCenter", sBtmLblTypeClass);
			this._writeLabel(oRm, oControl, oControl.getLastXLabel(), "-btm-right-lbl", "sapSuiteAMCPositionRight", sBtmLblTypeClass);
			oRm.write("</div>");
		}

		oRm.write("<div");
		oRm.writeAttributeEscaped("id", oControl.getId() + "-css-helper");
		oRm.addStyle("display", "none");
		oRm.writeStyles();
		oRm.write("></div>");

		oRm.write("</div>");
	};

	AreaMicroChartRenderer._writeLabel = function(oRm, oControl, oLabel, sId, sClass, sType) {
		var sLabel = oLabel ? oLabel.getLabel() : "";
		oRm.write("<div");
		oRm.writeAttribute("id", oControl.getId() + sId);

		if (oLabel) {
			oRm.addClass(jQuery.sap.encodeHTML("sapSuiteAMCSemanticColor" + oLabel.getColor()));
		}

		oRm.addClass("sapSuiteAMCLbl");
		oRm.addClass(jQuery.sap.encodeHTML(sClass));
		oRm.addClass(jQuery.sap.encodeHTML(sType));
		oRm.writeClasses();
		oRm.write(">");
		oRm.writeEscaped(sLabel);
		oRm.write("</div>");
	};

	return AreaMicroChartRenderer;

}, /* bExport= */ true);
