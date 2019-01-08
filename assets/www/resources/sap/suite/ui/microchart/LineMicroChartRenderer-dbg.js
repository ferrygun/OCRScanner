/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([ 'jquery.sap.global', './library', 'sap/m/library', 'sap/ui/core/theming/Parameters' ],
	function(jQuery, library, MobileLibrary, Parameters) {
	"use strict";

	/**
	 * LineMicroChart renderer.
	 * @namespace
	 */
	var LineMicroChartRenderer = {};

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 * @public
	 */
	LineMicroChartRenderer.render = function(oRm, oControl) {
		oRm.write("<div");
		oRm.writeControlData(oControl);
		oRm.addClass("sapSuiteLMC");
		if (!library._isInGenericTile(oControl)) {
			// no focus for generic tile
			oRm.addClass("sapSuiteLMCFocus");
		}
		if (oControl._bSemanticMode) {
			oRm.addClass("sapSuiteLMCSemanticMode");
		}
		if (oControl._bFocusMode) {
			oRm.addClass("sapSuiteLMCFocusMode");
		}
		if (oControl.getSize()) {
			oRm.addClass("sapSuiteLMCSize" + oControl.getSize());
		}
		if (oControl.hasListeners("press")) {
			oRm.addClass("sapSuiteUiMicroChartPointer");
			oRm.writeAttribute("tabindex", "0");
		}
		if (oControl._bNoBottomLabels) {
			oRm.addClass("sapSuiteLMCNoBottomLabels");
		}
		if (oControl._bNoTopLabels) {
			oRm.addClass("sapSuiteLMCNoTopLabels");
		}
		if (jQuery.inArray(oControl.getSize(), ["S", "XS", "M"]) >= 0) {
			oRm.addClass("sapSuiteLMCSmallFont");
		}
		oRm.writeClasses();

		// screen reader
		var sAriaLabel = oControl._createTooltipText();
		oRm.writeAttribute("role", "presentation");
		oRm.writeAttributeEscaped("aria-label", sAriaLabel);
		oRm.write(">");

		oRm.write("<div");
		oRm.addClass("sapSuiteLMCSvgWrapper");
		oRm.writeClasses();
		oRm.write(">");

		// Top Labels
		this._renderLabelsTop(oRm, oControl);

		// Canvas and SVG
		this._renderCanvas(oRm, oControl);

		// Bottom Labels
		this._renderLabelsBottom(oRm, oControl);
		oRm.write("</div>");

		oRm.write("</div>");
	};

	/**
	 * Renders the HTML for the canvas.
	 *
	 * @param {sap.ui.core.RenderManager} oRm RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 * @private
	 */
	LineMicroChartRenderer._renderCanvas = function(oRm, oControl) {
		var aPoints = oControl.getPoints();
		var iPointsCount = aPoints.length;

		oRm.write("<div");
		oRm.addClass("sapSuiteLMCSvgCanvas");
		oRm.writeClasses();
		oRm.write(">");

		oRm.write("<svg");
		oRm.writeAttributeEscaped("id", oControl.getId() + "-sapSuiteLMCSvgElement");
		oRm.writeAttribute("focusable", "false");
		oRm.addClass("sapSuiteLMCSvgElement");
		oRm.writeClasses();
		oRm.write(">");

		// render the lines if valid scaling
		if (oControl._bScalingValid) {
			this._renderThresholdLine(oRm, oControl);
			for (var i = 1; i < iPointsCount; i++) {
				this._renderLine(oRm, oControl,
					oControl._aNormalizedPoints[i - 1].x, oControl._aNormalizedPoints[i - 1].y,
					oControl._aNormalizedPoints[i].x, oControl._aNormalizedPoints[i].y);
			}
		}
		oRm.write('</svg>');
		oRm.write("<div");
		oRm.writeAttributeEscaped("id", oControl.getId() + "-sapSuiteLMCPointsContainer");
		oRm.writeClasses();
		oRm.write(">");

		// render the points if valid scaling
		var bShowPoints = oControl.getShowPoints(),
			oPoint,
			bPointEmphasized;
		if (oControl._bScalingValid && (oControl._bFocusMode || bShowPoints)) {
			for (var j = 0; j < iPointsCount; j++) {
				oPoint = aPoints[j];
				bPointEmphasized = this._isPointEmphasized(oPoint);
				if (!oControl._bFocusMode && bShowPoints || oControl._bFocusMode && bPointEmphasized && oPoint.getShow()) {
					this._renderPoint(oRm, oControl, oPoint, j, bPointEmphasized);
				}
			}
		}

		oRm.write( "</div>");
		oRm.write( "</div>");
	};

	/**
	 * Renders the HTML for the point.
	 *
	 * @param {sap.ui.core.RenderManager} oRm RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 * @param {sap.suite.ui.microchart.LineMicroChartPoint} point The point to be rendered
	 * @param {integer} pointIndex The position of the point in the aggregation
	 * @param {boolean} emphasized Sets whether or not an emphasized point is to be rendered
	 * @private
	 */
	LineMicroChartRenderer._renderPoint = function(oRm, oControl, point, pointIndex, emphasized) {
		var oNormalizedPoint = oControl._aNormalizedPoints[pointIndex],
			oChartColor = oControl.getColor();

		// do not draw point if it is outside the canvas
		if (oNormalizedPoint.x < 0 || oNormalizedPoint.x > 100 || oNormalizedPoint.y < 0 || oNormalizedPoint.y > 100) {
			return;
		}

		oRm.write("<div");
		oRm.addStyle("left", jQuery.sap.encodeHTML(oNormalizedPoint.x + "%"));
		oRm.addStyle("top", jQuery.sap.encodeHTML(100 - oNormalizedPoint.y + "%"));

		if (oControl._bFocusMode && oControl._bSemanticMode) {
			oRm.addClass("sapSuiteLMCPoint" + jQuery.sap.encodeHTML(point.getColor()));
		} else if (!oControl._bFocusMode && oControl._bSemanticMode) {
			if (point.getY() >= oControl.getThreshold()) {
				if (MobileLibrary.ValueColor[oChartColor.above]) {
					oRm.addClass("sapSuiteLMCPoint" + jQuery.sap.encodeHTML(oChartColor.above));
				} else {
					oRm.addStyle("background-color", jQuery.sap.encodeHTML(this._getHexColor(oChartColor.above)));
				}
			} else if (MobileLibrary.ValueColor[oChartColor.below]) {
				oRm.addClass("sapSuiteLMCPoint" + jQuery.sap.encodeHTML(oChartColor.below));
			} else {
				oRm.addStyle("background-color", jQuery.sap.encodeHTML(this._getHexColor(oChartColor.below)));
			}
		} else if (!oControl._bSemanticMode && typeof oChartColor === "string") {
			if (MobileLibrary.ValueColor[oChartColor]) {
				oRm.addClass("sapSuiteLMCPoint" + jQuery.sap.encodeHTML(oChartColor));
			} else {
				oRm.addStyle("background-color", jQuery.sap.encodeHTML(this._getHexColor(oChartColor)));
			}
		} else {
			oRm.addClass("sapSuiteLMCPointNeutral");
		}

		oRm.addClass("sapSuiteLMCPoint");
		if (emphasized && point.getShow()) {
			oRm.addClass("sapSuiteLMCPointEmphasized");
		}

		oRm.writeClasses();
		oRm.writeStyles();
		oRm.write("/>");
	};

	/**
	 * Renders the HTML for the threshold line.
	 *
	 * @param {sap.ui.core.RenderManager} oRm RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 * @private
	 */
	LineMicroChartRenderer._renderThresholdLine = function(oRm, oControl) {
		if (oControl._fNormalizedThreshold >= 0 && oControl._fNormalizedThreshold <= 100 && !oControl._bThresholdNull) {
			oRm.write("<line");
			oRm.writeAttribute("x1", "0%");
			oRm.writeAttributeEscaped("y1", (100 - oControl._fNormalizedThreshold) + "%");
			oRm.writeAttribute("x2", "100%");
			oRm.writeAttributeEscaped("y2", (100 - oControl._fNormalizedThreshold) + "%");
			oRm.addClass("sapSuiteLMCLineThreshold");
			oRm.writeClasses();
			oRm.write("/>");
		}
	};

	/**
	 * Renders the HTML for the line.
	 *
	 * @param {sap.ui.core.RenderManager} oRm RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 * @param {int} startPosX The horizontal dimension of the starting point
	 * @param {int} startPosY The vertical dimension of the starting point
	 * @param {int} endPosX The horizontal dimension of the ending point
	 * @param {int} endPosY The vertical dimension of the ending point
	 * @private
	 */
	LineMicroChartRenderer._renderLine = function(oRm, oControl, startPosX, startPosY, endPosX, endPosY) {
		// ignore the points which are outside of the scaled canvas ({0, 0}; {100, 100})
		if (this._isDimensionLineOutsideCanvas(oControl, startPosX, endPosX, "X") || // X dimension
			this._isDimensionLineOutsideCanvas(oControl, startPosY, endPosY, "Y")) { // Y dimension
			return;
		}

		var fIntersectionX, fIntersectionY,
			iLineWidth = endPosX - startPosX,
			iLineHeight = endPosY - startPosY;
		if ((startPosY - oControl._fNormalizedThreshold) * (endPosY - oControl._fNormalizedThreshold) < 0) {
			// in case the line intersects 0, two different lines will be drawn instead;
			// infinite loop will not occur because the above condition (0*0) < 0 is always false
			fIntersectionX = startPosX + (oControl._fNormalizedThreshold - startPosY) * iLineWidth / iLineHeight;
			this._renderLine(oRm, oControl, startPosX, startPosY, fIntersectionX, oControl._fNormalizedThreshold);
			this._renderLine(oRm, oControl, fIntersectionX, oControl._fNormalizedThreshold, endPosX, endPosY);
			// for line strokes to be round rather than cut-off, we must allow visible overflow and get rid of actual overflowing elements manually;
			// detect intersections with regard to the given scaling and split lines recursively while keeping directional angles unchanged
		} else if (startPosY * endPosY < 0) { // intersection bottom
			fIntersectionX = startPosX - startPosY * iLineWidth / iLineHeight;
			this._renderLine(oRm, oControl, startPosX, startPosY, fIntersectionX, 0);
			this._renderLine(oRm, oControl, fIntersectionX, 0, endPosX, endPosY);
		} else if ((startPosY - 100) * (endPosY - 100) < 0) { // intersection top
			fIntersectionX = startPosX + (100 - startPosY) * iLineWidth / iLineHeight;
			this._renderLine(oRm, oControl, startPosX, startPosY, fIntersectionX, 100);
			this._renderLine(oRm, oControl, fIntersectionX, 100, endPosX, endPosY);
		} else if (startPosX * endPosX < 0) { // intersection left
			fIntersectionY = startPosY - startPosX * iLineHeight / iLineWidth;
			this._renderLine(oRm, oControl, startPosX, startPosY, 0, fIntersectionY);
			this._renderLine(oRm, oControl, 0, fIntersectionY, endPosX, endPosY);
		} else if ((startPosX - 100) * (endPosX - 100) < 0) { // intersection right
			fIntersectionY = startPosY + (100 - startPosX) * iLineHeight / iLineWidth;
			this._renderLine(oRm, oControl, startPosX, startPosY, 100, fIntersectionY);
			this._renderLine(oRm, oControl, 100, fIntersectionY, endPosX, endPosY);
		} else {
			this._displayLine(oRm, oControl, startPosX, startPosY, endPosX, endPosY);
		}
	};

	/**
	 * Displays the HTML for the line.
	 *
	 * @param {sap.ui.core.RenderManager} oRm RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 * @param {int} startPosX The horizontal dimension of the starting point
	 * @param {int} startPosY The vertical dimension of the starting point
	 * @param {int} endPosX The horizontal dimension of the ending point
	 * @param {int} endPosY The vertical dimension of the ending point
	 * @private
	 */
	LineMicroChartRenderer._displayLine = function(oRm, oControl, startPosX, startPosY, endPosX, endPosY) {
		oRm.write("<line");
		oRm.writeAttributeEscaped("x1", startPosX + "%");
		oRm.writeAttributeEscaped("y1", (100 - startPosY) + "%");
		oRm.writeAttributeEscaped("x2", endPosX + "%");
		oRm.writeAttributeEscaped("y2", (100 - endPosY) + "%");
		oRm.addClass("sapSuiteLMCLine");

		if (oControl._bSemanticMode && !oControl._bFocusMode) {
			if (startPosY >= oControl._fNormalizedThreshold && endPosY >= oControl._fNormalizedThreshold) {
				if (MobileLibrary.ValueColor[oControl.getColor().above]) {
					oRm.addClass("sapSuiteLMCLine" + jQuery.sap.encodeHTML(oControl.getColor().above));
				} else {
					oRm.addStyle("stroke", jQuery.sap.encodeHTML(this._getHexColor(oControl.getColor().above)));
				}
			} else if (MobileLibrary.ValueColor[oControl.getColor().below]) {
				oRm.addClass("sapSuiteLMCLine" + jQuery.sap.encodeHTML(oControl.getColor().below));
			} else {
				oRm.addStyle("stroke", jQuery.sap.encodeHTML(this._getHexColor(oControl.getColor().below)));
			}
		} else if (!oControl._bSemanticMode && typeof oControl.getColor() === "string") {
			if (MobileLibrary.ValueColor[oControl.getColor()]) {
				oRm.addClass("sapSuiteLMCLine" + jQuery.sap.encodeHTML(oControl.getColor()));
			} else {
				oRm.addStyle("stroke", jQuery.sap.encodeHTML(this._getHexColor(oControl.getColor())));
			}
		} else {
			oRm.addClass("sapSuiteLMCLineNeutral");
		}
		oRm.writeStyles();
		oRm.writeClasses();
		oRm.write("/>");
	};

	/**
	 * Renders the HTML for the bottom labels.
	 *
	 * @param {sap.ui.core.RenderManager} oRm RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 * @private
	 */
	LineMicroChartRenderer._renderLabelsBottom = function(oRm, oControl) {
		// left bottom label
		var sLeftBottomLabel = oControl.getLeftBottomLabel();
		if (sLeftBottomLabel && sLeftBottomLabel.length > 0) {
			oRm.write("<div");
			oRm.addClass("sapSuiteLMCLeftBottomLabel");
			oRm.addClass("sapSuiteLMCLabel");
			oRm.writeClasses();
			oRm.write(">");
			oRm.writeEscaped(sLeftBottomLabel);
			oRm.write("</div>");
		}

		// right bottom label
		var sRightBottomLabel = oControl.getRightBottomLabel();
		if (sRightBottomLabel && sRightBottomLabel.length > 0) {
			oRm.write("<div");
			oRm.addClass("sapSuiteLMCRightBottomLabel");
			oRm.addClass("sapSuiteLMCLabel");
			oRm.writeClasses();
			oRm.write(">");
			oRm.writeEscaped(sRightBottomLabel);
			oRm.write("</div>");
		}
	};

	/**
	 * Renders the HTML for the top labels.
	 *
	 * @param {sap.ui.core.RenderManager} oRm RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 * @private
	 */
	LineMicroChartRenderer._renderLabelsTop = function(oRm, oControl) {
		var sTopLeftSemanticClass = "",
			sTopRightSemanticClass = "",
			aPoints = oControl.getPoints(),
			iPointsNum = aPoints.length,
			oFirstPoint,
			oLastPoint;

		if (iPointsNum >= 1) {
			oFirstPoint = aPoints[0];
			oLastPoint = aPoints[iPointsNum - 1];

			if (oControl._bFocusMode && oControl._bSemanticMode && oControl._bScalingValid) {
				if (this._isPointEmphasized(oFirstPoint) && oFirstPoint.getShow()) {
					sTopLeftSemanticClass = "sapSuiteLMCLabel" + oFirstPoint.getColor();
				} else {
					sTopLeftSemanticClass = "sapSuiteLMCLabelNeutral";
				}
				if (this._isPointEmphasized(oLastPoint) && oLastPoint.getShow()) {
					sTopRightSemanticClass = "sapSuiteLMCLabel" + oLastPoint.getColor();
				} else {
					sTopRightSemanticClass = "sapSuiteLMCLabelNeutral";
				}
			} else if (!oControl._bFocusMode && oControl._bSemanticMode && oControl._bScalingValid && oControl.getShowPoints() &&
					MobileLibrary.ValueColor[oControl.getColor().above] && MobileLibrary.ValueColor[oControl.getColor().below]) {

				if (oFirstPoint.getY() >= oControl.getThreshold()) {
					sTopLeftSemanticClass = "sapSuiteLMCLabel" + oControl.getColor().above;
				} else {
					sTopLeftSemanticClass = "sapSuiteLMCLabel" + oControl.getColor().below;
				}
				if (oLastPoint.getY() >= oControl.getThreshold()) {
					sTopRightSemanticClass = "sapSuiteLMCLabel" + oControl.getColor().above;
				} else {
					sTopRightSemanticClass = "sapSuiteLMCLabel" + oControl.getColor().below;
				}
			} else {
				sTopLeftSemanticClass = "sapSuiteLMCLabelNeutral";
				sTopRightSemanticClass = "sapSuiteLMCLabelNeutral";
			}
		}

		// left top label
		var sLeftTopLabel = oControl.getLeftTopLabel();
		if (sLeftTopLabel && sLeftTopLabel.length > 0) {
			oRm.write("<div");
			oRm.addClass("sapSuiteLMCLeftTopLabel");
			oRm.addClass("sapSuiteLMCLabel");
			oRm.addClass(jQuery.sap.encodeHTML(sTopLeftSemanticClass));
			oRm.writeClasses();
			oRm.write(">");
			oRm.writeEscaped(sLeftTopLabel);
			oRm.write("</div>");
		}

		// right top label
		var sRightTopLabel = oControl.getRightTopLabel();
		if (sRightTopLabel && sRightTopLabel.length > 0) {
			oRm.write("<div");
			oRm.addClass("sapSuiteLMCRightTopLabel");
			oRm.addClass("sapSuiteLMCLabel");
			oRm.addClass(jQuery.sap.encodeHTML(sTopRightSemanticClass));
			oRm.writeClasses();
			oRm.write(">");
			oRm.writeEscaped(oControl.getRightTopLabel());
			oRm.write("</div>");
		}
	};

	/**
	 * Checks if the given point is an emphasized point.
	 * @param {sap.suite.ui.microchart.LineMicroChartPoint} point The instance of point to be checked
	 * @returns {boolean} True if the given point is emphasized, false if not
	 * @private
	 */
	LineMicroChartRenderer._isPointEmphasized = function(point) {
		return point && point.getMetadata().getName() === "sap.suite.ui.microchart.LineMicroChartEmphasizedPoint";
	};

	/**
	 * Returns the hex color corresponding to the provided color name.
	 *
	 * @private
	 * @param {string} color The name of the color
	 * @returns {string} The corresponding hex color
	 */
	LineMicroChartRenderer._getHexColor = function(color) {
		return Parameters.get(color) || color;
	};

	/**
	 * Tests (one dimension only) if the line is outside of the scaled canvas.
	 *
	 * @private
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 * @param {int} startPos The starting point dimension
	 * @param {int} endPos The ending point dimension
	 * @param {string} axis The axis type of values ('X' or 'Y')
	 * @returns {boolean} True if the line is outside, false otherwise.
	 */
	LineMicroChartRenderer._isDimensionLineOutsideCanvas = function(oControl, startPos, endPos, axis) {
		var iMaxLimit = 100, iMinLimit = 0;
		if (axis === "X" && oControl._minXScale === oControl._maxXScale) { // X axis limits
			iMaxLimit = 50;
			iMinLimit = 50;
		} else if (axis === "Y" && oControl._minYScale === oControl._maxYScale) { // Y axis limits
			iMaxLimit = 50;
			iMinLimit = 50;
		}

		return ((startPos >= iMaxLimit && endPos >= iMaxLimit) && !(startPos === iMaxLimit && endPos === iMaxLimit)) || // iMaxLimit
			((startPos <= iMinLimit && endPos <= iMinLimit) && !(startPos === iMinLimit && endPos === iMinLimit)); // iMinLimit
	};

	return LineMicroChartRenderer;

}, /* bExport= */ true);
