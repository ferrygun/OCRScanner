/*
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(['jquery.sap.global', 'sap/suite/ui/commons/ProcessFlowLaneHeader'],
		function(jQuery, ProcessFlowLaneHeader) {
	"use strict";

	/**
	 * @class ProcessFlowLaneHeader renderer.
	 * @static
	 */
	var ProcessFlowLaneHeaderRenderer = {
	};

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl An object representation of the control that should be rendered
	 */
	ProcessFlowLaneHeaderRenderer.render = function (oRm, oControl) {
		// Write the HTML into the render manager
		switch (oControl._getSymbolType()) {
			case ProcessFlowLaneHeader.symbolType.startSymbol:
				this._writeSymbolNodeType(
					oRm,
					oControl,
					"-start",
					["suiteUiProcessFlowLaneHeaderStartEndSymbol", "suiteUiProcessFlowLaneHeaderStartSymbol"],
					["suiteUiProcessFlowLaneHeaderStartEndSymbolContainer", "suiteUiProcessFlowLaneHeaderNoSelection"],
					false /* do not draw icon */,
					oControl._isHeaderMode()
				);
				break;
			case ProcessFlowLaneHeader.symbolType.endSymbol:
				this._writeSymbolNodeType(
					oRm,
					oControl,
					"-end",
					["suiteUiProcessFlowLaneHeaderStartEndSymbol", "suiteUiProcessFlowLaneHeaderEndSymbol"],
					["suiteUiProcessFlowLaneHeaderStartEndSymbolContainer", "suiteUiProcessFlowLaneHeaderNoSelection"],
					false /* do not draw icon */,
					oControl._isHeaderMode()
				);
				break;
			case ProcessFlowLaneHeader.symbolType.processSymbol:
				this._writeSymbolNodeType(
					oRm,
					oControl,
					"-process",
					["suiteUiProcessFlowLaneHeaderProcessSymbol"],
					["suiteUiProcessFlowLaneHeaderProcessSymbolContainer", "suiteUiProcessFlowLaneHeaderNoSelection"],
					true /* draw icon */,
					oControl._isHeaderMode()
				);
				break;
			default:
				this._writeDefaultNodeType(oRm, oControl);
		}
	};

	/* =========================================================== */
	/* Helper methods                                              */
	/* =========================================================== */

	/**
	 * Node symbol renderer.
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl An object representation of the control that should be rendered
	 * @param {string} symbolId ID suffix of the symbol node
	 * @param {string[]} symbolClasses Array of names of classes for symbol node div element
	 * @param {string[]} containerClasses Array of names of classes for the symbol container div element
	 * @param {boolean} isIconRendered True if the icon should be rendered
	 * @since 1.22
	 */
	ProcessFlowLaneHeaderRenderer._writeSymbolNodeType = function (oRm, oControl, symbolId, symbolClasses, containerClasses, isIconRendered) { // EXC_JSHINT_034
		oRm.write("<div");
		oRm.writeControlData(oControl);
		containerClasses.forEach(function (containerClass) {
			oRm.addClass(jQuery.sap.encodeHTML(containerClass));
		});
		oRm.writeClasses();
		//Write ARIA details
		oRm.writeAttribute("role", "separator");
		oRm.writeAttributeEscaped("aria-label", oControl._getSymbolAriaText());

		oRm.write(">"); // symbol container
		oRm.write("<div"); // symbol
		oRm.writeAttributeEscaped("id", oControl.getId() + symbolId);
		symbolClasses.forEach(function (symbolClass) {
			oRm.addClass(jQuery.sap.encodeHTML(symbolClass));
		});
		oRm.writeClasses();
		oRm.write(">");
		if (isIconRendered) {
			var sIconSrc = oControl.getIconSrc();
			if (sIconSrc) {
				var oIcon = oControl._getImage(oControl.getId() + "-lh-icon", sIconSrc);
				oRm.renderControl(oIcon);
			}
		}
		oRm.write("</div>"); // symbol
		oRm.write("</div>"); // symbol container
	};

	/**
	 * Default node renderer.
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl An object representation of the control that should be rendered
	 * @since 1.22
	 */
	ProcessFlowLaneHeaderRenderer._writeDefaultNodeType = function (oRm, oControl) {  // EXC_SAP_006_1, EXC_JSHINT_046
		oRm.write("<div");
		oRm.writeControlData(oControl);
		oRm.addClass("suiteUiProcessFlowLaneHeaderContainer");
		oRm.addClass("suiteUiProcessFlowLaneHeaderNoSelection");
		oRm.writeClasses();
		oRm.write(">"); // div element for the whole control

		oRm.write("<div");
		oRm.writeAttribute("id", oControl.getId() + "-standard");

		//Write ARIA details
		oRm.writeAttribute("role", "image");
		var statusText = oControl.getText() + ", " + oControl._getAriaText();
		oRm.writeAttributeEscaped("aria-label", statusText);

		oRm.addClass("suiteUiProcessFlowLaneHeaderBodyContainer");
		oRm.writeClasses();
		oRm.write(">"); // div element for header
		oRm.write("<div");
		oRm.writeAttribute("id", oControl.getId() + "-horizontal-line");
		oRm.addClass("suiteUiProcessFlowLaneHeaderHorizontalLine");
		oRm.writeClasses();
		oRm.write("></div>");

		oRm.write("<svg");
		oRm.writeAttribute("id", oControl.getId() + "-donut-chart");
		oRm.addClass("suiteUiProcessFlowLaneHeaderDonutSvg");
		oRm.writeClasses();
		oRm.write(">");
		oControl._renderDonutPercentages(oRm);
		oRm.write("</svg>"); // div element for the donut chart

		oRm.write("<div");
		oRm.writeAttribute("id", oControl.getId() + "-lh-icon-container");
		oRm.addClass("suiteUiProcessFlowLaneHeaderIconContainer");
		oRm.writeClasses();
		oRm.write(">"); // div element for header

		var sIconSrc = oControl.getIconSrc();
		if (sIconSrc) {
			var oIcon = oControl._getImage(oControl.getId() + "-lh-icon", sIconSrc);
			oIcon.addStyleClass("suiteUiProcessFlowLaneHeaderProcessSymbolIcon");
			oRm.renderControl(oIcon);
		}
		oRm.write("</div>"); // icon container
		oRm.write("</div>"); // body container

		oRm.write("<div");
		oRm.writeAttribute("id", oControl.getId() + "-lh-text-container");
		oRm.addClass("suiteUiProcessFlowLaneHeaderTextContainer");
		oRm.writeClasses();
		oRm.write(">"); // div element for the text container

		oRm.write("<span");
		oRm.writeAttribute("id", oControl.getId() + "-lh-text");
		oRm.addClass("suiteUiProcessFlowLaneHeaderText");
		oRm.writeClasses();
		oRm.writeAttribute("aria-hidden", true);
		oRm.write(">"); // div element for the text span
		oRm.writeEscaped(oControl.getText());
		oRm.write("</span>"); // text

		oRm.write("</div>"); // text container

		oRm.write("</div>"); // whole control
	};


	return ProcessFlowLaneHeaderRenderer;

}, /* bExport= */ true);
