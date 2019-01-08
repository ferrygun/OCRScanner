/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(['./library'],
	function(library) {
	"use strict";

	/**
	 * @class ProcessFlowConnection renderer.
	 * @static
	 */
	var ProcessFlowConnectionRenderer = {};

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl An object representation of the control that should be rendered
	 */
	ProcessFlowConnectionRenderer.render = function (oRm, oControl) {
		var oConnection = oControl._traverseConnectionData();
		var sZoomLevel = oControl.getZoomLevel();

		oRm.write("<div");
		oRm.writeAttribute("id", oControl.getId());

		//Writes ARIA details.
		oRm.writeAttribute("role", "presentation");
		oRm.writeAttributeEscaped("aria-label", oControl._getAriaText(oConnection));
		oRm.write(">");

		//Writes the lines.
		if (oControl._isHorizontalLine(oConnection)) {
			this._writeHorizontalLine(oRm, oConnection, sZoomLevel, oControl);
		} else if (oControl._isVerticalLine(oConnection)) {
			this._writeVerticalLine(oRm, oConnection, sZoomLevel, oControl._getShowLabels());
		} else {
			this._writeSpecialLine(oRm, oConnection, sZoomLevel, oControl);
		}
		oRm.write("</div>");
	};

	/* =========================================================== */
	/* Helper methods                                              */
	/* =========================================================== */

	/**
	 * Writes the vertical line.
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
	 * @param {object} connection Connection which needs to be checked
	 * @param {object} zoomLevel Zoom level of control
	 * @param {boolean} showLabels Show labels
	 */
	ProcessFlowConnectionRenderer._writeVerticalLine = function (oRm, connection, zoomLevel, showLabels) {
		// Left column
		oRm.write("<div");
		oRm.addClass("sapSuiteUiCommonsFloatLeft");
		if (showLabels) {
			oRm.addClass("sapSuiteUiCommonsPFWithLabel");
		}
		switch (zoomLevel) {
			case library.ProcessFlowZoomLevel.One:
				oRm.addClass("sapSuiteUiCommonsBoxZoom1Width");
				oRm.addClass("sapSuiteUiCommonsBoxWideZoom1Height");
				break;
			case library.ProcessFlowZoomLevel.Three:
				oRm.addClass("sapSuiteUiCommonsBoxZoom3Width");
				oRm.addClass("sapSuiteUiCommonsBoxWideZoom3Height");
				break;
			case library.ProcessFlowZoomLevel.Four:
				oRm.addClass("sapSuiteUiCommonsBoxZoom4Width");
				oRm.addClass("sapSuiteUiCommonsBoxWideZoom4Height");
				break;
			default:
				oRm.addClass("sapSuiteUiCommonsBoxZoom2Width");
				oRm.addClass("sapSuiteUiCommonsBoxWideZoom2Height");
		}
		oRm.writeClasses();
		oRm.write(">");
		oRm.write("</div>");

		// Middle column
		oRm.write("<div");
		oRm.addClass("sapSuiteUiCommonsFloatLeft");
		oRm.addClass("sapSuiteUiCommonsBoxMiddleBorderWidth");
		switch (zoomLevel) {
			case library.ProcessFlowZoomLevel.One:
				oRm.addClass("sapSuiteUiCommonsBoxWideZoom1Height");
				break;
			case library.ProcessFlowZoomLevel.Three:
				oRm.addClass("sapSuiteUiCommonsBoxWideZoom3Height");
				break;
			case library.ProcessFlowZoomLevel.Four:
				oRm.addClass("sapSuiteUiCommonsBoxWideZoom4Height");
				break;
			default:
				oRm.addClass("sapSuiteUiCommonsBoxWideZoom2Height");
		}
		oRm.addClass("sapSuiteUiCommonsBorderLeft");
		if (connection.top.type === library.ProcessFlowConnectionType.Planned) {
			oRm.addClass("sapSuiteUiCommonsBorderLeftTypePlanned");
		} else {
			oRm.addClass("sapSuiteUiCommonsBorderLeftTypeNormal");
		}
		if (connection.top.state === library.ProcessFlowConnectionState.Highlighted) {
			oRm.addClass("sapSuiteUiCommonsBorderLeftStateHighlighted");
			oRm.addClass("sapSuiteUiCommonsStateHighlighted");
		} else if (connection.top.state === library.ProcessFlowConnectionState.Dimmed) {
			oRm.addClass("sapSuiteUiCommonsBorderLeftStateDimmed");
		} else if (connection.top.state === library.ProcessFlowConnectionState.Selected) {
			oRm.addClass("sapSuiteUiCommonsBorderLeftStateSelected");
			oRm.addClass("sapSuiteUiCommonsStateSelected");
		} else {
			oRm.addClass("sapSuiteUiCommonsBorderLeftStateRegular");
			oRm.addClass("sapSuiteUiCommonsStateRegular");
		}
		oRm.writeClasses();
		oRm.write(">");
		oRm.write("</div>");

		// Right column
		// Omitted

		ProcessFlowConnectionRenderer._resetFloat(oRm);
	};

	/**
	 * Writes the horizontal line.
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
	 * @param {object} connection Connection which needs to be checked
	 * @param {object} zoomLevel Zoom level of control
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 */
	ProcessFlowConnectionRenderer._writeHorizontalLine = function (oRm, connection, zoomLevel, oControl) {
		//1st row
		oRm.write("<div");
		oRm.addClass("sapSuiteUiCommonsBoxWideWidth");
		switch (zoomLevel) {
			case library.ProcessFlowZoomLevel.One:
				oRm.addClass("sapSuiteUiCommonsBoxTopZoom1Height");
				break;
			case library.ProcessFlowZoomLevel.Three:
				oRm.addClass("sapSuiteUiCommonsBoxTopZoom3Height");
				break;
			case library.ProcessFlowZoomLevel.Four:
				oRm.addClass("sapSuiteUiCommonsBoxTopZoom4Height");
				break;
			default:
				oRm.addClass("sapSuiteUiCommonsBoxTopZoom2Height");
		}
		oRm.writeClasses();
		oRm.write(">");
		oRm.write("</div>");

		// 2nd row
		oRm.write("<div");
		if (connection.arrow) {
			// connection column
			oRm.addClass("sapSuiteUiCommonsParentPosition");
			if (oControl._getShowLabels()) {
				oRm.addClass("sapSuiteUiCommonsPFWithLabel");
			}
			switch (zoomLevel) {
				case library.ProcessFlowZoomLevel.One:
					oRm.addClass("sapSuiteUiCommonsBoxWideArrowZoom1Width");
					break;
				case library.ProcessFlowZoomLevel.Three:
					oRm.addClass("sapSuiteUiCommonsBoxWideArrowZoom3Width");
					break;
				case library.ProcessFlowZoomLevel.Four:
					oRm.addClass("sapSuiteUiCommonsBoxWideArrowZoom4Width");
					break;
				default:
					oRm.addClass("sapSuiteUiCommonsBoxWideArrowZoom2Width");
			}
		} else {
			oRm.addClass("sapSuiteUiCommonsBoxWideWidth");
		}
		oRm.addClass("sapSuiteUiCommonsBoxMiddleBorderHeight");
		oRm.addClass("sapSuiteUiCommonsBorderBottom");
		if (connection.right.type === library.ProcessFlowConnectionType.Planned) {
			oRm.addClass("sapSuiteUiCommonsBorderBottomTypePlanned");
		} else {
			oRm.addClass("sapSuiteUiCommonsBorderBottomTypeNormal");
		}
		if (connection.right.state === library.ProcessFlowConnectionState.Highlighted) {
			oRm.addClass("sapSuiteUiCommonsBorderBottomStateHighlighted");
			oRm.addClass("sapSuiteUiCommonsStateHighlighted");
		} else if (connection.right.state === library.ProcessFlowConnectionState.Dimmed) {
			oRm.addClass("sapSuiteUiCommonsBorderBottomStateDimmed");
		} else if (connection.right.state === library.ProcessFlowConnectionState.Selected) {
			oRm.addClass("sapSuiteUiCommonsBorderBottomStateSelected");
			oRm.addClass("sapSuiteUiCommonsStateSelected");
		} else {
			oRm.addClass("sapSuiteUiCommonsBorderBottomStateRegular");
			oRm.addClass("sapSuiteUiCommonsStateRegular");
		}
		oRm.writeClasses();
		oRm.write(">");

		if (connection.labels && oControl._showLabels) {
			ProcessFlowConnectionRenderer._renderLabel(oRm, oControl, connection);
		}

		if (connection.arrow) {
			oRm.write("<div");
			oRm.addClass("sapSuiteUiCommonsArrowRight");
			if (connection.right.state === library.ProcessFlowConnectionState.Highlighted) {
				oRm.addClass("sapSuiteUiCommonsBorderLeftStateHighlighted");
			} else if (connection.right.state === library.ProcessFlowConnectionState.Dimmed) {
				oRm.addClass("sapSuiteUiCommonsBorderLeftStateDimmed");
			} else if (connection.right.state === library.ProcessFlowConnectionState.Selected) {
				oRm.addClass("sapSuiteUiCommonsBorderLeftStateSelected");
			} else {
				oRm.addClass("sapSuiteUiCommonsBorderLeftStateRegular");
			}
			oRm.writeClasses();
			oRm.write(">");
			oRm.write("</div>");
		}
		oRm.write("</div>");

		// 3rd row
		// Omitted
	};

	/**
	 * Writes the special line (e.g. branch or corner).
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
	 * @param {object} connection Connection which needs to be checked
	 * @param {object} zoomLevel Zoom level of control
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 */
	ProcessFlowConnectionRenderer._writeSpecialLine = function (oRm, connection, zoomLevel, oControl) {
		ProcessFlowConnectionRenderer._writeFirstRowOfSpecialLine(oRm, connection, zoomLevel, oControl);
		ProcessFlowConnectionRenderer._writeSecondRowOfSpecialLine(oRm, connection, zoomLevel, oControl);
		ProcessFlowConnectionRenderer._writeThirdRowOfSpecialLine(oRm, connection, zoomLevel, oControl);
		ProcessFlowConnectionRenderer._resetFloat(oRm);
	};

	/**
	 * Writes the first row of a special line (e.g. branch).
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
	 * @param {object} connection Connection which needs to be checked
	 * @param {object} zoomLevel Zoom level of control
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 */
	ProcessFlowConnectionRenderer._writeFirstRowOfSpecialLine = function (oRm, connection, zoomLevel, oControl) {
		// Left column
		oRm.write("<div");
		oRm.addClass("sapSuiteUiCommonsFloatLeft");
		if (oControl._getShowLabels()) {
			oRm.addClass("sapSuiteUiCommonsPFWithLabel");
		}
		switch (zoomLevel) {
			case library.ProcessFlowZoomLevel.One:
				oRm.addClass("sapSuiteUiCommonsBoxZoom1Width");
				oRm.addClass("sapSuiteUiCommonsBoxTopZoom1Height");
				break;
			case library.ProcessFlowZoomLevel.Three:
				oRm.addClass("sapSuiteUiCommonsBoxZoom3Width");
				oRm.addClass("sapSuiteUiCommonsBoxTopZoom3Height");
				break;
			case library.ProcessFlowZoomLevel.Four:
				oRm.addClass("sapSuiteUiCommonsBoxZoom4Width");
				oRm.addClass("sapSuiteUiCommonsBoxTopZoom4Height");
				break;
			default:
				oRm.addClass("sapSuiteUiCommonsBoxZoom2Width");
				oRm.addClass("sapSuiteUiCommonsBoxTopZoom2Height");
		}
		oRm.writeClasses();
		oRm.write(">");
		oRm.write("</div>");

		// Middle column
		oRm.write("<div");
		if (oControl._getShowLabels()) {
			oRm.addClass("sapSuiteUiCommonsPFWithLabel");
		}
		oRm.addClass("sapSuiteUiCommonsFloatLeft");
		switch (zoomLevel) {
			case library.ProcessFlowZoomLevel.One:
				oRm.addClass("sapSuiteUiCommonsBoxTopZoom1Height");
				break;
			case library.ProcessFlowZoomLevel.Three:
				oRm.addClass("sapSuiteUiCommonsBoxTopZoom3Height");
				break;
			case library.ProcessFlowZoomLevel.Four:
				oRm.addClass("sapSuiteUiCommonsBoxTopZoom4Height");
				break;
			default:
				oRm.addClass("sapSuiteUiCommonsBoxTopZoom2Height");
		}
		if (connection.hasOwnProperty("top") && connection.top.draw) {
			oRm.addClass("sapSuiteUiCommonsBoxMiddleBorderWidth");
			oRm.addClass("sapSuiteUiCommonsBorderLeft");
			if (connection.top.type === library.ProcessFlowConnectionType.Planned) {
				oRm.addClass("sapSuiteUiCommonsBorderLeftTypePlanned");
			} else {
				oRm.addClass("sapSuiteUiCommonsBorderLeftTypeNormal");
			}
			if (connection.top.state === library.ProcessFlowConnectionState.Highlighted) {
				oRm.addClass("sapSuiteUiCommonsBorderLeftStateHighlighted");
				oRm.addClass("sapSuiteUiCommonsStateHighlighted");
			} else if (connection.top.state === library.ProcessFlowConnectionState.Dimmed) {
				oRm.addClass("sapSuiteUiCommonsBorderLeftStateDimmed");
			} else if (connection.top.state === library.ProcessFlowConnectionState.Selected) {
				oRm.addClass("sapSuiteUiCommonsBorderLeftStateSelected");
				oRm.addClass("sapSuiteUiCommonsStateSelected");
			} else {
				oRm.addClass("sapSuiteUiCommonsBorderLeftStateRegular");
				oRm.addClass("sapSuiteUiCommonsStateRegular");
			}
		} else {
			oRm.addClass("sapSuiteUiCommonsBoxMiddleWidth");
		}
		oRm.writeClasses();
		oRm.write(">");
		oRm.write("</div>");

		// Right column
		// Omitted
	};

	/**
	 * Writes the second row of a special line (e.g. branch).
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
	 * @param {object} connection Connection which needs to be checked
	 * @param {object} zoomLevel Zoom level of control
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 */
	ProcessFlowConnectionRenderer._writeSecondRowOfSpecialLine = function (oRm, connection, zoomLevel, oControl) {
		ProcessFlowConnectionRenderer._resetFloat(oRm);

		// Left column
		oRm.write("<div");
		oRm.addClass("sapSuiteUiCommonsFloatLeft");
		if (oControl._getShowLabels()) {
			oRm.addClass("sapSuiteUiCommonsPFWithLabel");
		}
		switch (zoomLevel) {
			case library.ProcessFlowZoomLevel.One:
				oRm.addClass("sapSuiteUiCommonsBoxZoom1Width");
				break;
			case library.ProcessFlowZoomLevel.Three:
				oRm.addClass("sapSuiteUiCommonsBoxZoom3Width");
				break;
			case library.ProcessFlowZoomLevel.Four:
				oRm.addClass("sapSuiteUiCommonsBoxZoom4Width");
				break;
			default:
				oRm.addClass("sapSuiteUiCommonsBoxZoom2Width");
		}
		if (connection.hasOwnProperty("left") && connection.left.draw) {
			oRm.addClass("sapSuiteUiCommonsBoxMiddleBorderHeight");
			oRm.addClass("sapSuiteUiCommonsBorderBottom");
			if (connection.left.type === library.ProcessFlowConnectionType.Planned) {
				oRm.addClass("sapSuiteUiCommonsBorderBottomTypePlanned");
			} else {
				oRm.addClass("sapSuiteUiCommonsBorderBottomTypeNormal");
			}
			if (connection.left.state === library.ProcessFlowConnectionState.Highlighted) {
				oRm.addClass("sapSuiteUiCommonsBorderBottomStateHighlighted");
				oRm.addClass("sapSuiteUiCommonsStateHighlighted");
			} else if (connection.left.state === library.ProcessFlowConnectionState.Dimmed) {
				oRm.addClass("sapSuiteUiCommonsBorderBottomStateDimmed");
			} else if (connection.left.state === library.ProcessFlowConnectionState.Selected) {
				oRm.addClass("sapSuiteUiCommonsBorderBottomStateSelected");
				oRm.addClass("sapSuiteUiCommonsStateSelected");
			} else {
				oRm.addClass("sapSuiteUiCommonsBorderBottomStateRegular");
				oRm.addClass("sapSuiteUiCommonsStateRegular");
			}
		} else {
			oRm.addClass("sapSuiteUiCommonsBoxMiddleHeight");
		}
		oRm.writeClasses();
		oRm.write(">");
		oRm.write("</div>");

		// Middle column
		oRm.write("<div");
		oRm.addClass("sapSuiteUiCommonsFloatLeft");
		if (oControl._getShowLabels()) {
			oRm.addClass("sapSuiteUiCommonsPFWithLabel");
		}
		oRm.addClass("sapSuiteUiCommonsBoxMiddleWidth");
		oRm.addClass("sapSuiteUiCommonsBoxMiddleBorderHeight");
		if ((connection.hasOwnProperty("left") && connection.left.draw) ||
			(connection.hasOwnProperty("right") && connection.right.draw) ||
			(connection.hasOwnProperty("top") && connection.top.draw) ||
			(connection.hasOwnProperty("bottom") && connection.bottom.draw)) {
			oRm.addClass("sapSuiteUiCommonsBorderBottom");
			oRm.addClass("sapSuiteUiCommonsBorderBottomTypeNormal");
			if (connection.right.state === library.ProcessFlowConnectionState.Highlighted ||
				connection.top.state === library.ProcessFlowConnectionState.Highlighted ||
				connection.left.state === library.ProcessFlowConnectionState.Highlighted ||
				connection.bottom.state === library.ProcessFlowConnectionState.Highlighted) {
				oRm.addClass("sapSuiteUiCommonsBorderBottomStateHighlighted");
				oRm.addClass("sapSuiteUiCommonsStateHighlighted");
			} else if (connection.right.state === library.ProcessFlowConnectionState.Selected ||
				connection.top.state === library.ProcessFlowConnectionState.Selected ||
				connection.left.state === library.ProcessFlowConnectionState.Selected ||
				connection.bottom.state === library.ProcessFlowConnectionState.Selected) {
				oRm.addClass("sapSuiteUiCommonsBorderBottomStateSelected");
				oRm.addClass("sapSuiteUiCommonsStateSelected");
			} else if (connection.right.state === library.ProcessFlowConnectionState.Dimmed ||
				connection.top.state === library.ProcessFlowConnectionState.Dimmed ||
				connection.left.state === library.ProcessFlowConnectionState.Dimmed ||
				connection.bottom.state === library.ProcessFlowConnectionState.Dimmed) {
				oRm.addClass("sapSuiteUiCommonsBorderBottomStateDimmed");
			} else {
				oRm.addClass("sapSuiteUiCommonsBorderBottomStateRegular");
				oRm.addClass("sapSuiteUiCommonsStateRegular");
			}
		}
		oRm.writeClasses();
		oRm.write(">");
		oRm.write("</div>");

		// Right column
		oRm.write("<div");
		oRm.addClass("sapSuiteUiCommonsFloatLeft");
		if (oControl._getShowLabels()) {
			oRm.addClass("sapSuiteUiCommonsPFWithLabel");
		}
		if (connection.arrow) {
			oRm.addClass("sapSuiteUiCommonsParentPosition");
			switch (zoomLevel) {
				case library.ProcessFlowZoomLevel.One:
					oRm.addClass("sapSuiteUiCommonsBoxArrowZoom1Width");
					break;
				case library.ProcessFlowZoomLevel.Three:
					oRm.addClass("sapSuiteUiCommonsBoxArrowZoom3Width");
					break;
				case library.ProcessFlowZoomLevel.Four:
					oRm.addClass("sapSuiteUiCommonsBoxArrowZoom4Width");
					break;
				default:
					oRm.addClass("sapSuiteUiCommonsBoxArrowZoom2Width");
			}
		} else if (oControl._getShowLabels()) {
			switch (zoomLevel) {
				case library.ProcessFlowZoomLevel.One:
					oRm.addClass("sapSuiteUiCommonsBoxZoom1WidthWithLabel");
					break;
				case library.ProcessFlowZoomLevel.Three:
					oRm.addClass("sapSuiteUiCommonsBoxZoom3WidthWithLabel");
					break;
				case library.ProcessFlowZoomLevel.Four:
					oRm.addClass("sapSuiteUiCommonsBoxZoom4WidthWithLabel");
					break;
				default:
					oRm.addClass("sapSuiteUiCommonsBoxZoom2WidthWithLabel");
			}
		} else {
			switch (zoomLevel) {
				case library.ProcessFlowZoomLevel.One:
					oRm.addClass("sapSuiteUiCommonsBoxZoom1Width");
					break;
				case library.ProcessFlowZoomLevel.Three:
					oRm.addClass("sapSuiteUiCommonsBoxZoom3Width");
					break;
				case library.ProcessFlowZoomLevel.Four:
					oRm.addClass("sapSuiteUiCommonsBoxZoom4Width");
					break;
				default:
					oRm.addClass("sapSuiteUiCommonsBoxZoom2Width");
			}
		}
		if (connection.hasOwnProperty("right") && connection.right.draw) {
			oRm.addClass("sapSuiteUiCommonsBoxMiddleBorderHeight");
			oRm.addClass("sapSuiteUiCommonsBorderBottom");
			if (connection.right.type === library.ProcessFlowConnectionType.Planned) {
				oRm.addClass("sapSuiteUiCommonsBorderBottomTypePlanned");
			} else {
				oRm.addClass("sapSuiteUiCommonsBorderBottomTypeNormal");
			}
			if (connection.right.state === library.ProcessFlowConnectionState.Highlighted) {
				oRm.addClass("sapSuiteUiCommonsBorderBottomStateHighlighted");
				oRm.addClass("sapSuiteUiCommonsStateHighlighted");
			} else if (connection.right.state === library.ProcessFlowConnectionState.Dimmed) {
				oRm.addClass("sapSuiteUiCommonsBorderBottomStateDimmed");
			} else if (connection.right.state === library.ProcessFlowConnectionState.Selected) {
				oRm.addClass("sapSuiteUiCommonsBorderBottomStateSelected");
				oRm.addClass("sapSuiteUiCommonsStateSelected");
			} else {
				oRm.addClass("sapSuiteUiCommonsBorderBottomStateRegular");
				oRm.addClass("sapSuiteUiCommonsStateRegular");
			}
		} else {
			oRm.addClass("sapSuiteUiCommonsBoxMiddleHeight");
		}
		oRm.writeClasses();
		oRm.write(">");

		if (connection.labels && oControl._showLabels) {
			ProcessFlowConnectionRenderer._renderLabel(oRm, oControl, connection);
		}

		if (connection.arrow) {
			oRm.write("<div");
			oRm.addClass("sapSuiteUiCommonsArrowRight");
			if (connection.hasOwnProperty("right")) {
				if (connection.right.state === library.ProcessFlowConnectionState.Highlighted) {
					oRm.addClass("sapSuiteUiCommonsBorderLeftStateHighlighted");
				} else if (connection.right.state === library.ProcessFlowConnectionState.Dimmed) {
					oRm.addClass("sapSuiteUiCommonsBorderLeftStateDimmed");
				} else if (connection.right.state === library.ProcessFlowConnectionState.Selected) {
					oRm.addClass("sapSuiteUiCommonsBorderLeftStateSelected");
				} else {
					oRm.addClass("sapSuiteUiCommonsBorderLeftStateRegular");
				}
			}
			oRm.writeClasses();
			oRm.write(">");
			oRm.write("</div>");
		}
		oRm.write("</div>");
	};

	/**
	 * Writes the third row of a special line (e.g. branch).
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
	 * @param {object} connection Connection which needs to be checked
	 * @param {object} zoomLevel Zoom level of control
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 */
	ProcessFlowConnectionRenderer._writeThirdRowOfSpecialLine = function (oRm, connection, zoomLevel, oControl) {
		ProcessFlowConnectionRenderer._resetFloat(oRm);

		// Left column
		oRm.write("<div");
		oRm.addClass("sapSuiteUiCommonsFloatLeft");
		if (oControl._getShowLabels()) {
			oRm.addClass("sapSuiteUiCommonsPFWithLabel");
		}
		switch (zoomLevel) {
			case library.ProcessFlowZoomLevel.One:
				oRm.addClass("sapSuiteUiCommonsBoxZoom1Width");
				oRm.addClass("sapSuiteUiCommonsBoxBottomZoom1Height");
				break;
			case library.ProcessFlowZoomLevel.Three:
				oRm.addClass("sapSuiteUiCommonsBoxZoom3Width");
				oRm.addClass("sapSuiteUiCommonsBoxBottomZoom3Height");
				break;
			case library.ProcessFlowZoomLevel.Four:
				oRm.addClass("sapSuiteUiCommonsBoxZoom4Width");
				oRm.addClass("sapSuiteUiCommonsBoxBottomZoom4Height");
				break;
			default:
				oRm.addClass("sapSuiteUiCommonsBoxZoom2Width");
				oRm.addClass("sapSuiteUiCommonsBoxBottomZoom2Height");
		}
		oRm.writeClasses();
		oRm.write(">");
		oRm.write("</div>");

		// Middle column
		oRm.write("<div");
		if (oControl._getShowLabels()) {
			oRm.addClass("sapSuiteUiCommonsPFWithLabel");
		}
		oRm.addClass("sapSuiteUiCommonsFloatLeft");
		switch (zoomLevel) {
			case library.ProcessFlowZoomLevel.One:
				oRm.addClass("sapSuiteUiCommonsBoxBottomZoom1Height");
				break;
			case library.ProcessFlowZoomLevel.Three:
				oRm.addClass("sapSuiteUiCommonsBoxBottomZoom3Height");
				break;
			case library.ProcessFlowZoomLevel.Four:
				oRm.addClass("sapSuiteUiCommonsBoxBottomZoom4Height");
				break;
			default:
				oRm.addClass("sapSuiteUiCommonsBoxBottomZoom2Height");
		}
		if (connection.hasOwnProperty("bottom") && connection.bottom.draw) {
			oRm.addClass("sapSuiteUiCommonsBoxMiddleBorderWidth");
			oRm.addClass("sapSuiteUiCommonsBorderLeft");
			if (connection.bottom.type === library.ProcessFlowConnectionType.Planned) {
				oRm.addClass("sapSuiteUiCommonsBorderLeftTypePlanned");
			} else {
				oRm.addClass("sapSuiteUiCommonsBorderLeftTypeNormal");
			}
			if (connection.bottom.state === library.ProcessFlowConnectionState.Highlighted) {
				oRm.addClass("sapSuiteUiCommonsBorderLeftStateHighlighted");
				oRm.addClass("sapSuiteUiCommonsStateHighlighted");
			} else if (connection.bottom.state === library.ProcessFlowConnectionState.Dimmed) {
				oRm.addClass("sapSuiteUiCommonsBorderLeftStateDimmed");
			} else if (connection.bottom.state === library.ProcessFlowConnectionState.Selected) {
				oRm.addClass("sapSuiteUiCommonsBorderLeftStateSelected");
				oRm.addClass("sapSuiteUiCommonsStateSelected");
			} else {
				oRm.addClass("sapSuiteUiCommonsBorderLeftStateRegular");
				oRm.addClass("sapSuiteUiCommonsStateRegular");
			}
		} else {
			oRm.addClass("sapSuiteUiCommonsBoxMiddleWidth");
		}
		oRm.writeClasses();
		oRm.write(">");
		oRm.write("</div>");

		// Right column
		// Omitted
	};

	/**
	 * Resets the float.
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
	 */
	ProcessFlowConnectionRenderer._resetFloat = function (oRm) {
		oRm.write("<div");
		oRm.addClass("sapSuiteUiCommonsFloatClear");
		oRm.writeClasses();
		oRm.write(">");
		oRm.write("</div>");
	};

	/**
	 * Renders the label based on criteria like state and priority.
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 */
	ProcessFlowConnectionRenderer._renderLabel = function (oRm, oControl) {
		var oLabel = oControl._getVisibleLabel();
		if (oControl.getAggregation("_labels")) {
			var aLabels = oControl.getAggregation("_labels");
			for (var i = 0; i < aLabels.length; i++) {
				if (aLabels[i]._getSelected()) {
					oLabel._setDimmed(false);
					if (aLabels[i].getId() !== oLabel.getId()) {
						oLabel._setSelected(true);
						aLabels[i]._setSelected(false);
					}
				}
			}
		}
		if (oLabel) {
			oRm.renderControl(oLabel);
		}
	};


	return ProcessFlowConnectionRenderer;

}, /* bExport= */ true);
