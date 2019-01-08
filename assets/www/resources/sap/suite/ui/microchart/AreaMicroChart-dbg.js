/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	"jquery.sap.global",
	"./library",
	"sap/ui/core/Control",
	"sap/ui/Device",
	"sap/m/FlexBox"
], function(jQuery, library, Control, Device, FlexBox) {
	"use strict";

	/**
	 * Constructor for a new AreaMicroChart control.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Chart that displays the history of values and target values as segmented lines and shows thresholds as colored background. This control replaces the deprecated sap.suite.ui.commons.MicroAreaChart.
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 * @since 1.34
	 *
	 * @public
	 * @alias sap.suite.ui.microchart.AreaMicroChart
	 * @ui5-metamodel This control will also be described in the UI5 (legacy) design time metamodel
	 */
	var AreaMicroChart = Control.extend("sap.suite.ui.microchart.AreaMicroChart", /** @lends sap.suite.ui.microchart.AreaMicroChart.prototype */ {
		metadata: {
			library: "sap.suite.ui.microchart",
			properties: {
				/**
				 * The width of the chart.
				 */
				width: { type: "sap.ui.core.CSSSize", group: "Misc", defaultValue: null },

				/**
				 * The height of the chart.
				 */
				height: { type: "sap.ui.core.CSSSize", group: "Misc", defaultValue: null },

				/**
				 * If this property is set, it indicates the value the X-axis ends with.
				 */
				maxXValue: { type: "float", group: "Misc", defaultValue: null },

				/**
				 * If this property is set it indicates the value X axis ends with.
				 */
				minXValue: { type: "float", group: "Misc", defaultValue: null },

				/**
				 * If this property is set it indicates the value X axis ends with.
				 */
				maxYValue: { type: "float", group: "Misc", defaultValue: null },

				/**
				 * If this property is set it indicates the value X axis ends with.
				 */
				minYValue: { type: "float", group: "Misc", defaultValue: null },

				/**
				 * The view of the chart.
				 */
				view: { type: "sap.suite.ui.microchart.AreaMicroChartViewType", group: "Appearance", defaultValue: "Normal" },

				/**
				 * The color palette for the chart. If this property is set,
				 * semantic colors defined in AreaMicroChartItem are ignored.
				 * As a result, colors of the palette are assigned to each line.
				 * When all the palette colors are used up, assignment of the colors starts again from the beginning of the palette.
				 */
				colorPalette: { type: "string[]", group: "Appearance", defaultValue: [] },

				/**
				 * Determines if the labels are displayed or not.
				 */
				showLabel: { type: "boolean", group: "Misc", defaultValue: true },

				/**
				 * If this set to true, width and height of the control are determined by the width and height of the container in which the control is placed. Width and height properties are ignored in this case.
				 * @since 1.38.0
				 */
				isResponsive: { type: "boolean", group: "Appearance", defaultValue: false }

			},
			events: {

				/**
				 * The event is triggered when the chart is pressed.
				 */
				press: {}

			},
			defaultAggregation: "lines",
			aggregations: {
				/**
				 * The configuration of the actual values line.
				 * The color property defines the color of the line.
				 * Points are rendered in the same sequence as in this aggregation.
				 */
				chart: { multiple: false, type: "sap.suite.ui.microchart.AreaMicroChartItem", bindable: "bindable" },

				/**
				 * The configuration of the max threshold area. The color property defines the color of the area above the max threshold line. Points are rendered in the same sequence as in this aggregation.
				 */
				maxThreshold: { multiple: false, type: "sap.suite.ui.microchart.AreaMicroChartItem" },

				/**
				 * The configuration of the upper line of the inner threshold area. The color property defines the color of the area between inner thresholds. For rendering of the inner threshold area, both innerMaxThreshold and innerMinThreshold aggregations must be defined. Points are rendered in the same sequence as in this aggregation.
				 */
				innerMaxThreshold: { multiple: false, type: "sap.suite.ui.microchart.AreaMicroChartItem" },

				/**
				 * The configuration of the bottom line of the inner threshold area. The color property is ignored. For rendering of the inner threshold area, both innerMaxThreshold and innerMinThreshold aggregations must be defined. Points are rendered in the same sequence as in this aggregation.
				 */
				innerMinThreshold: { multiple: false, type: "sap.suite.ui.microchart.AreaMicroChartItem" },

				/**
				 * The configuration of the min threshold area. The color property defines the color of the area below the min threshold line. Points are rendered in the same sequence as in this aggregation.
				 */
				minThreshold: { multiple: false, type: "sap.suite.ui.microchart.AreaMicroChartItem" },

				/**
				 * The configuration of the target values line. The color property defines the color of the line. Points are rendered in the same sequence as in this aggregation.
				 */
				target: { multiple: false, type: "sap.suite.ui.microchart.AreaMicroChartItem", bindable: "bindable" },

				/**
				 * The label on X axis for the first point of the chart.
				 */
				firstXLabel: { multiple: false, type: "sap.suite.ui.microchart.AreaMicroChartLabel" },

				/**
				 * The label on Y axis for the first point of the chart.
				 */
				firstYLabel: { multiple: false, type: "sap.suite.ui.microchart.AreaMicroChartLabel" },

				/**
				 * The label on X axis for the last point of the chart.
				 */
				lastXLabel: { multiple: false, type: "sap.suite.ui.microchart.AreaMicroChartLabel" },

				/**
				 * The label on Y axis for the last point of the chart.
				 */
				lastYLabel: { multiple: false, type: "sap.suite.ui.microchart.AreaMicroChartLabel" },

				/**
				 * The label for the maximum point of the chart.
				 */
				maxLabel: { multiple: false, type: "sap.suite.ui.microchart.AreaMicroChartLabel" },

				/**
				 * The label for the minimum point of the chart.
				 */
				minLabel: { multiple: false, type: "sap.suite.ui.microchart.AreaMicroChartLabel" },

				/**
				 * The set of lines.
				 */
				lines: { multiple: true, type: "sap.suite.ui.microchart.AreaMicroChartItem", bindable: "bindable" }
			}

		}
	});

	// Constants
	AreaMicroChart.EDGE_CASE_WIDTH_SHOWCHART = 32; // 2rem on the basis of design
	AreaMicroChart.EDGE_CASE_HEIGHT_WIDE_VIEW_SHOWCHART = 27;
	AreaMicroChart.EDGE_CASE_HEIGHT_SHOWCANVAS = 16; // 1rem on the basis of design
	AreaMicroChart.EDGE_CASE_HEIGHT_SHOWBOTTOMLABEL = 16; // 1rem on the basis of design
	AreaMicroChart.EDGE_CASE_HEIGHT_SHOWTOPLABEL = 32; // 2rem on the basis of design
	AreaMicroChart.EDGE_CASE_HEIGHT_SHOWLABEL = 16; // 1rem on the basis of design
	AreaMicroChart.EDGE_CASE_WIDTH_RESIZEFONT = 168; // Corresponds to M size 10.5rem
	AreaMicroChart.EDGE_CASE_HEIGHT_RESIZEFONT = 72; // Corresponds to M size 4.5rem
	AreaMicroChart.WIDE_MODE_LABEL_PADDING = 8; // 0.5rem on the basis of design
	AreaMicroChart.ITEM_NEUTRAL_COLOR = "sapSuiteAMCSemanticColorNeutral";
	AreaMicroChart.ITEM_NEUTRAL_NOTHRESHOLD_CSSCLASS = "sapSuiteAMCNeutralNoThreshold";

	AreaMicroChart.prototype.init = function() {
		this._oRb = sap.ui.getCore().getLibraryResourceBundle("sap.suite.ui.microchart");
		this.setAggregation("tooltip", "{AltText}", true);
		this._bThemeApplied = true;
		if (!sap.ui.getCore().isInitialized()) {
			this._bThemeApplied = false;
			sap.ui.getCore().attachInit(this._handleCoreInitialized.bind(this));
		} else {
			this._handleCoreInitialized();
		}
		if (Device.system.tablet || Device.system.phone) {
			Device.orientation.attachHandler(this._onOrientationChange, this);
		}
	};

	/**
	 * Handler for the core's init event. The control will only be rendered if all
	 * themes are loaded and everything is properly initialized. We attach a theme
	 * check here.
	 *
	 * @private
	 */
	AreaMicroChart.prototype._handleCoreInitialized = function() {
		this._bThemeApplied = sap.ui.getCore().isThemeApplied();
		sap.ui.getCore().attachThemeChanged(this._handleThemeApplied, this);
	};

	/**
	 * The chart will only be rendered if the theme is applied. If this is the case,
	 * the control invalidates itself.
	 *
	 * @private
	 */
	AreaMicroChart.prototype._handleThemeApplied = function() {
		this._bThemeApplied = true;
		this.invalidate();
	};

	/**
	 * Retrieves the computed styles of the internally used CSS helper element.
	 * In case the backgroundColor, outlineStyle, and outlineWidth styles do not exist, they are replaced by their hyphenated
	 * equivalents.
	 *
	 * @returns {CSSStyleDeclaration} The CSS style declaration of the internal CSS helper element
	 * @private
	 */
	AreaMicroChart.prototype._getCssValues = function() {
		this._$CssHelper.className = Array.prototype.slice.call(arguments).join(" ");
		var oStyles = window.getComputedStyle(this._$CssHelper);

		if (!oStyles.backgroundColor) {
			oStyles.backgroundColor = oStyles["background-color"];
		}

		if (!oStyles.outlineStyle) {
			oStyles.outlineStyle = oStyles["outline-style"];
		}

		if (!oStyles.outlineWidth) {
			oStyles.outlineWidth = oStyles["outline-width"];
		}
		return oStyles;
	};

	/**
	 * Fills the area between the lines specified via points1 and points2 with the given color.
	 *
	 * @param {CanvasRenderingContext2D} context The rendering context of the HTML canvas.
	 * @param {object[]} points1 The points array used for rendering the multi line.
	 * @param {object[]} points2 The points array used for rendering the multi line.
	 * @param {string} color The color to fill the area with.
	 * @private
	 */
	AreaMicroChart.prototype.__fillThresholdArea = function(context, points1, points2, color) {
		context.beginPath();
		context.moveTo(points1[0].x, points1[0].y);

		for (var i = 1, length = points1.length; i < length; i++) {
			context.lineTo(points1[i].x, points1[i].y);
		}

		for (var j = points2.length - 1; j >= 0; j--) {
			context.lineTo(points2[j].x, points2[j].y);
		}

		context.closePath();

		context.fillStyle = "white";
		context.fill();

		context.fillStyle = color;
		context.fill();

		context.lineWidth = 1;
		context.strokeStyle = "white";
		context.stroke();

		context.strokeStyle = color;
		context.stroke();
	};

	/**
	 * Renders a dashed line by using the context's native line dash functionality or a helper function.
	 *
	 * @param {CanvasRenderingContext2D} context The rendering context of the HTML canvas.
	 * @param {object[]} points The points array used for rendering the multi line.
	 * @param {int[]} dasharray The array containing the sequence of blanks and dashes as pixel values.
	 * @private
	 */
	AreaMicroChart.prototype._renderDashedLine = function(context, points, dasharray) {
		if (context.setLineDash) {
			context.setLineDash(dasharray);
			this._renderLine(context, points);
			context.setLineDash([]);
		} else {
			context.beginPath();
			for (var i = 0, length = points.length - 1; i < length; i++) {
				context._dashedLine(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, dasharray);
			}
			context.stroke();
		}
	};

	/**
	 * Renders a multi line using the given points array.
	 * If a color is to be used, it has to be set prior to calling this function.
	 *
	 * @param {CanvasRenderingContext2D} context The rendering context of the HTML canvas.
	 * @param {object[]} points The points array used for rendering the multi line.
	 * @private
	 */
	AreaMicroChart.prototype._renderLine = function(context, points) {
		context.beginPath();
		context.moveTo(points[0].x, points[0].y);

		for (var i = 1, length = points.length; i < length; i++) {
			context.lineTo(points[i].x, points[i].y);
		}

		context.stroke();
	};

	/**
	 * Defines the color class based on the threshold values.
	 *
	 * @private
	 * @param {object} canvasDimensions The canvas' calculated dimensions object.
	 * @param {boolean} targetColor Flag indicating render target.
	 * @returns {String} The CSS class used for line color.
	 */
	AreaMicroChart.prototype._getItemColor = function(canvasDimensions, targetColor) {
		var sItemColor;
		if (targetColor && this.getTarget()) {
			sItemColor = "sapSuiteAMCSemanticColor" + this.getTarget().getColor();
		} else if (!targetColor && this.getChart()) {
			sItemColor = "sapSuiteAMCSemanticColor" + this.getChart().getColor();
		}
		if ((sItemColor === AreaMicroChart.ITEM_NEUTRAL_COLOR) && !this._isThresholdPresent(canvasDimensions)) {
			return AreaMicroChart.ITEM_NEUTRAL_NOTHRESHOLD_CSSCLASS;
		} else {
			return sItemColor;
		}
	};

	/**
	 * Identifies if the control has thresholds based on the threshold's number of elements.
	 *
	 * @private
	 * @param {object} canvasDimensions - the canvas' calculated dimensions object
	 * @returns {boolean} - flag showing if thresholds exist
	 */
	AreaMicroChart.prototype._isThresholdPresent = function(canvasDimensions) {
		var aThreshold = [canvasDimensions.minThreshold.length, canvasDimensions.maxThreshold.length, canvasDimensions.innerMinThreshold.length, canvasDimensions.innerMaxThreshold.length];
		for (var i = 0; i < aThreshold.length; i++) {
			if (aThreshold[i] > 1) {
				return true;
			}
		}

		return false;
	};

	/**
	 * Renders the target line onto the given rendering context.
	 *
	 * @param {CanvasRenderingContext2D} context The rendering context of the HTML canvas.
	 * @param {object} dimensions The object containing the calculated and scaled dimensions of the chart.
	 * @private
	 */
	AreaMicroChart.prototype._renderTarget = function(context, dimensions) {
		if (dimensions.target.length > 1) {
			var sColorClass = this._getItemColor(dimensions, true);
			var oStyles = this._getCssValues("sapSuiteAMCTarget", sColorClass);
			context.strokeStyle = oStyles.color;
			context.lineWidth = parseFloat(oStyles.width);

			if (oStyles.outlineStyle == "dotted") {
				this._renderDashedLine(context, dimensions.target, [ parseFloat(oStyles.outlineWidth), 3 ]);
			} else {
				this._renderLine(context, dimensions.target, dimensions);
			}
		} else if (dimensions.target.length == 1) {
			jQuery.sap.log.warning("Target is not rendered because only 1 point was given");
		}
	};

	/**
	 * Renders the threshold line with the given points onto the given rendering context.
	 *
	 * @param {CanvasRenderingContext2D} context The rendering context of the HTML canvas.
	 * @param {object[]} points The points array used for rendering the multi line.
	 * @private
	 */
	AreaMicroChart.prototype._renderThresholdLine = function(context, points) {
		if (points && points.length) {
			var oStyles = this._getCssValues("sapSuiteAMCThreshold");

			context.strokeStyle = oStyles.color;
			context.lineWidth = oStyles.width;
			this._renderLine(context, points);
		}
	};

	/**
	 * Renders a filled path and a threshold line for the 'max' threshold.
	 *
	 * @param {CanvasRenderingContext2D} context The rendering context of the HTML canvas.
	 * @param {object} dimensions The object containing the calculated and scaled dimensions of the chart.
	 * @private
	 */
	AreaMicroChart.prototype._fillMaxThreshold = function(context, dimensions) {
		if (dimensions.maxThreshold.length > 1) {
			var oStyles = this._getCssValues("sapSuiteAMCThreshold", "sapSuiteAMCSemanticColor" + this.getMaxThreshold().getColor());

			this.__fillThresholdArea(context, dimensions.maxThreshold, [
				{ x: dimensions.maxThreshold[0].x, y: dimensions.minY },
				{ x: dimensions.maxThreshold[dimensions.maxThreshold.length - 1].x, y: dimensions.minY }
			], oStyles.backgroundColor);

			this._renderThresholdLine(context, dimensions.maxThreshold, dimensions);
		} else if (dimensions.maxThreshold.length == 1) {
			jQuery.sap.log.warning("Max Threshold is not rendered because only 1 point was given");
		}
	};

	/**
	 * Renders a filled path and a threshold line for the 'min' threshold.
	 *
	 * @param {CanvasRenderingContext2D} context The rendering context of the HTML canvas.
	 * @param {object} dimensions The object containing the calculated and scaled dimensions of the chart.
	 * @private
	 */
	AreaMicroChart.prototype._fillMinThreshold = function(context, dimensions) {
		if (dimensions.minThreshold.length > 1) {
			var oStyles = this._getCssValues("sapSuiteAMCThreshold", "sapSuiteAMCSemanticColor" + this.getMinThreshold().getColor());
			this.__fillThresholdArea(context, dimensions.minThreshold, [
				{ x: dimensions.minThreshold[0].x, y: dimensions.maxY },
				{ x: dimensions.minThreshold[dimensions.minThreshold.length - 1].x, y: dimensions.maxY }
			], oStyles.backgroundColor);
		} else if (dimensions.minThreshold.length == 1) {
			jQuery.sap.log.warning("Min Threshold is not rendered because only 1 point was given");
		}
	};

	/**
	 * Renders a filled path and a threshold line for the 'min' threshold.
	 *
	 * @param {CanvasRenderingContext2D} context The rendering context of the HTML canvas.
	 * @param {object} dimensions The object containing the calculated and scaled dimensions of the chart.
	 * @private
	 */
	AreaMicroChart.prototype._fillThresholdArea = function(context, dimensions) {
		if (dimensions.minThreshold.length > 1 && dimensions.maxThreshold.length > 1) {
			var oStyles = this._getCssValues("sapSuiteAMCThreshold", "sapSuiteAMCSemanticColorCritical");

			this.__fillThresholdArea(context, dimensions.maxThreshold, dimensions.minThreshold, oStyles.backgroundColor);
		}
	};

	/**
	 * Renders a filled path and a threshold line for the 'min' threshold.
	 *
	 * @param {CanvasRenderingContext2D} context The rendering context of the HTML canvas.
	 * @param {object} dimensions The object containing the calculated and scaled dimensions of the chart.
	 * @private
	 */
	AreaMicroChart.prototype._fillInnerThresholdArea = function(context, dimensions) {
		if (dimensions.innerMinThreshold.length > 1 && dimensions.innerMaxThreshold.length > 1) {
			var oStyles = this._getCssValues("sapSuiteAMCThreshold", "sapSuiteAMCSemanticColor" + this.getInnerMaxThreshold().getColor());

			this.__fillThresholdArea(context, dimensions.innerMaxThreshold, dimensions.innerMinThreshold, oStyles.backgroundColor);
		} else if (dimensions.innerMinThreshold.length || dimensions.innerMaxThreshold.length) {
			jQuery.sap.log.warning("Inner threshold area is not rendered because inner min and max threshold were not correctly set");
		}
	};

	/**
	 * Renders the chart line for actual value. This line's points are retrieved from the 'chart' aggregation.
	 *
	 * @param {CanvasRenderingContext2D} context The rendering context of the HTML canvas.
	 * @param {object} dimensions The object containing the calculated and scaled dimensions of the chart.
	 * @private
	 */
	AreaMicroChart.prototype._renderChart = function(context, dimensions) {
		if (dimensions.chart.length > 1) {
			var sColorClass = this._getItemColor(dimensions);
			var oStyles = this._getCssValues("sapSuiteAMCChart", sColorClass);
			context.strokeStyle = oStyles.color;
			context.lineWidth = parseFloat(oStyles.width);

			this._renderLine(context, dimensions.chart, dimensions);
		} else if (dimensions.chart.length == 1) {
			jQuery.sap.log.warning("Actual values are not rendered because only 1 point was given");
		}
	};

	/**
	 * Renders the additional lines from the 'lines' aggregation onto the canvas.
	 * The lines get a palette color or a semantic color, depending on their 'color' properties.
	 *
	 * @param {CanvasRenderingContext2D} context The rendering context of the HTML canvas.
	 * @param {object} dimensions The object containing the calculated and scaled dimensions of the chart.
	 * @private
	 */
	AreaMicroChart.prototype._renderLines = function(context, dimensions) {
		var iCpLength = this.getColorPalette().length;
		var iCpIndex = 0;
		var that = this;

		var fnNextColor = function() {
			if (iCpLength) {
				if (iCpIndex == iCpLength) {
					iCpIndex = 0;
				}
				return that.getColorPalette()[iCpIndex++];
			}
		};

		var oStyles = this._getCssValues("sapSuiteAMCLine");
		context.lineWidth = parseFloat(oStyles.width);

		var iLength = dimensions.lines.length;
		for (var i = 0; i < iLength; i++) {
			if (dimensions.lines[i].length > 1) {
				if (iCpLength) {
					context.strokeStyle = fnNextColor();
				} else {
					oStyles = this._getCssValues("sapSuiteAMCLine", "sapSuiteAMCSemanticColor" + this.getLines()[i].getColor());
					context.strokeStyle = oStyles.color;
				}
				this._renderLine(context, dimensions.lines[i], dimensions);
			}
		}
	};

	/**
	 * Renders the canvas.
	 *
	 * @private
	 */
	AreaMicroChart.prototype._renderCanvas = function() {
		this._$CssHelper = this.getDomRef("css-helper");

		var $this = this.$();
		var sLabelsWidth = $this.find(".sapSuiteAMCSideLabels").css("width");
		$this.find(".sapSuiteAMCCanvas, .sapSuiteAMCLabels").css("right", sLabelsWidth).css("left", sLabelsWidth);

		var oCanvas = this.getDomRef("canvas");
		var oCanvasSettings = window.getComputedStyle(oCanvas);

		var fWidth = parseFloat(oCanvasSettings.width);
		oCanvas.setAttribute("width", fWidth || 360);

		var fHeight = parseFloat(oCanvasSettings.height);
		oCanvas.setAttribute("height", fHeight || 242);

		var oRenderContext = oCanvas.getContext("2d");

		oRenderContext.lineJoin = "round";
		oRenderContext._dashedLine = this._drawDashedLine;

		var oDimensions = this._calculateDimensions(oCanvas.width, oCanvas.height);

		if (this._isThresholdPresent(oDimensions)) {
			$this.find(".sapSuiteAMCCanvas").addClass("sapSuiteAMCWithThreshold");
		}

		this._fillMaxThreshold(oRenderContext, oDimensions);
		this._fillMinThreshold(oRenderContext, oDimensions);
		this._fillThresholdArea(oRenderContext, oDimensions);
		this._renderThresholdLine(oRenderContext, oDimensions.minThreshold, oDimensions);
		this._renderThresholdLine(oRenderContext, oDimensions.maxThreshold, oDimensions);
		this._fillInnerThresholdArea(oRenderContext, oDimensions);
		this._renderThresholdLine(oRenderContext, oDimensions.innerMinThreshold, oDimensions);
		this._renderThresholdLine(oRenderContext, oDimensions.innerMaxThreshold, oDimensions);
		this._renderTarget(oRenderContext, oDimensions);
		this._renderChart(oRenderContext, oDimensions);
		this._renderLines(oRenderContext, oDimensions);
	};

	/**
	 * Draws a single dashed line using the given dasharray from the first point with x and y to the
	 * second point with x2 and y2.
	 *
	 * @param {float} x The first x value of the line.
	 * @param {float} y The first y value of the line.
	 * @param {float} x2 The second x value of the line.
	 * @param {float} y2 The second y value of the line.
	 * @param {float[]} dasharray The array containing the sequence of blanks and dashes as pixel values.
	 * @private
	 */
	AreaMicroChart.prototype._drawDashedLine = function(x, y, x2, y2, dasharray) {
		var iDashCount = dasharray.length;
		this.moveTo(x, y);

		var fDelta = (x2 - x), dy = (y2 - y),
			fSlope = fDelta ? dy / fDelta : 1e15,
			fRemainingDist = Math.sqrt(fDelta * fDelta + dy * dy),
			i = 0,
			bDraw = true;

		while (fRemainingDist >= 0.1) {
			var dashLength = dasharray[i++ % iDashCount];
			if (dashLength > fRemainingDist) {
				dashLength = fRemainingDist;
			}
			var fStep = Math.sqrt(dashLength * dashLength / (1 + fSlope * fSlope));
			if (fDelta < 0) {
				fStep = -fStep;
			}
			x += fStep;
			y += fSlope * fStep;
			this[bDraw ? "lineTo" : "moveTo"](x, y);
			fRemainingDist -= dashLength;
			bDraw = !bDraw;
		}
	};

	/**
	 * Calculates the dimensions of the chart.
	 * The dimensions correspond to the current scaling given through control properties.
	 *
	 * @private
	 * @param {float} width Canvas width
	 * @param {float} height Canvas height
	 * @returns {object} An object containing the dimensions calculation results
	 */
	AreaMicroChart.prototype._calculateDimensions = function(width, height) {
		var fMaxX, fMaxY, fMinX, fMinY;

		function calculateExtrema() {
			if (!this._isMinXValue || !this._isMaxXValue || !this._isMinYValue || !this._isMaxYValue) {
				var aLines = this.getLines();
				if (this.getMaxThreshold()) {
					aLines.push(this.getMaxThreshold());
				}

				if (this.getMinThreshold()) {
					aLines.push(this.getMinThreshold());
				}

				if (this.getChart()) {
					aLines.push(this.getChart());
				}

				if (this.getTarget()) {
					aLines.push(this.getTarget());
				}

				if (this.getInnerMaxThreshold()) {
					aLines.push(this.getInnerMaxThreshold());
				}

				if (this.getInnerMinThreshold()) {
					aLines.push(this.getInnerMinThreshold());
				}

				for (var i = 0, iLines = aLines.length; i < iLines; i++) {
					var aPoints = aLines[i].getPoints();

					for (var k = 0, a = aPoints.length; k < a; k++) {
						var fValueX = aPoints[k].getXValue();
						if (fValueX > fMaxX || fMaxX === undefined) {
							fMaxX = fValueX;
						}
						if (fValueX < fMinX || fMinX === undefined) {
							fMinX = fValueX;
						}

						var fValueY = aPoints[k].getYValue();
						if (fValueY > fMaxY || fMaxY === undefined) {
							fMaxY = fValueY;
						}
						if (fValueY < fMinY || fMinY === undefined) {
							fMinY = fValueY;
						}
					}
				}
			}
			if (this._isMinXValue) {
				fMinX = this.getMinXValue();
			}

			if (this._isMaxXValue) {
				fMaxX = this.getMaxXValue();
			}

			if (this._isMinYValue) {
				fMinY = this.getMinYValue();
			}

			if (this._isMaxYValue) {
				fMaxY = this.getMaxYValue();
			}
		}

		calculateExtrema.call(this);

		var oResult = {
			minY: 0,
			minX: 0,
			maxY: height,
			maxX: width,
			lines: []
		};

		var kx;
		var fDeltaX = fMaxX - fMinX;

		if (fDeltaX > 0) {
			kx = width / fDeltaX;
		} else if (fDeltaX == 0) {
			kx = 0;
			oResult.maxX /= 2;
		} else {
			jQuery.sap.log.warning("Min X is greater than max X.");
		}

		var ky;
		var fDeltaY = fMaxY - fMinY;

		if (fDeltaY > 0) {
			ky = height / (fMaxY - fMinY);
		} else if (fDeltaY == 0) {
			ky = 0;
			oResult.maxY /= 2;
		} else {
			jQuery.sap.log.warning("Min Y is greater than max Y.");
		}

		function calculateCoordinates(line) {
			var bRtl = sap.ui.getCore().getConfiguration().getRTL();

			var fnCalcX = function(fValue) {
				var x = kx * (fValue - fMinX);

				if (bRtl) {
					x = oResult.maxX - x;
				}
				return x;
			};

			var fnCalcY = function(fValue) {
				return oResult.maxY - ky * (fValue - fMinY);
			};

			var aResult = [];
			if (line && kx !== undefined && ky !== undefined) {
				var aPoints = line.getPoints();
				var iLength = aPoints.length;
				var xi, yi, tmpXValue, tmpYValue;

				if (iLength == 1) {
					tmpXValue = aPoints[0].getXValue();
					tmpYValue = aPoints[0].getYValue();

					if (tmpXValue == undefined ^ tmpYValue == undefined) {
						var xn, yn;
						if (tmpXValue == undefined) {
							yn = yi = fnCalcY(tmpYValue);
							xi = oResult.minX;
							xn = oResult.maxX;
						} else {
							xn = xi = fnCalcX(tmpXValue);
							yi = oResult.minY;
							yn = oResult.maxY;
						}

						aResult.push({ x: xi, y: yi }, { x: xn, y: yn });
					} else {
						jQuery.sap.log.warning("Point with coordinates [" + tmpXValue + " " + tmpYValue + "] ignored");
					}
				} else {
					for (var i = 0; i < iLength; i++) {
						tmpXValue = aPoints[i].getXValue();
						tmpYValue = aPoints[i].getYValue();

						if (tmpXValue != undefined && tmpYValue != undefined) {
							xi = fnCalcX(tmpXValue);
							yi = fnCalcY(tmpYValue);

							aResult.push({ x: xi, y: yi });
						} else {
							jQuery.sap.log.warning("Point with coordinates [" + tmpXValue + " " + tmpYValue + "] ignored");
						}
					}
				}
			}
			return aResult;
		}

		oResult.maxThreshold = calculateCoordinates(this.getMaxThreshold());
		oResult.minThreshold = calculateCoordinates(this.getMinThreshold());
		oResult.chart = calculateCoordinates(this.getChart());
		oResult.target = calculateCoordinates(this.getTarget());
		oResult.innerMaxThreshold = calculateCoordinates(this.getInnerMaxThreshold());
		oResult.innerMinThreshold = calculateCoordinates(this.getInnerMinThreshold());

		var iLength = this.getLines().length;
		for (var i = 0; i < iLength; i++) {
			oResult.lines.push(calculateCoordinates(this.getLines()[i]));
		}
		return oResult;
	};

	/**
	 * Property setter for the Min X value
	 *
	 * @param {float} value - new value Min X
	 * @param {boolean} bSuppressInvalidate - Suppress in validate
	 * @returns {void}
	 * @public
	 */
	AreaMicroChart.prototype.setMinXValue = function(value, bSuppressInvalidate) {
		this._isMinXValue = this._isNumber(value);

		return this.setProperty("minXValue", this._isMinXValue ? value : NaN, bSuppressInvalidate);
	};

	/**
	 * Property setter for the Max X value
	 *
	 * @param {float} value - new value Max X
	 * @param {boolean} bSuppressInvalidate - Suppress in validate
	 * @returns {void}
	 * @public
	 */
	AreaMicroChart.prototype.setMaxXValue = function(value, bSuppressInvalidate) {
		this._isMaxXValue = this._isNumber(value);

		return this.setProperty("maxXValue", this._isMaxXValue ? value : NaN, bSuppressInvalidate);
	};

	/**
	 * Property setter for the Min Y value
	 *
	 * @param {float} value - new value Min Y
	 * @param {boolean} bSuppressInvalidate - Suppress in validate
	 * @returns {void}
	 * @public
	 */
	AreaMicroChart.prototype.setMinYValue = function(value, bSuppressInvalidate) {
		this._isMinYValue = this._isNumber(value);

		return this.setProperty("minYValue", this._isMinYValue ? value : NaN, bSuppressInvalidate);
	};

	/**
	 * Property setter for the Max Y value
	 *
	 * @param {float} value - new value Max Y
	 * @param {boolean} bSuppressInvalidate - Suppress in validate
	 * @returns {void}
	 * @public
	 */
	AreaMicroChart.prototype.setMaxYValue = function(value, bSuppressInvalidate) {
		this._isMaxYValue = this._isNumber(value);

		return this.setProperty("maxYValue", this._isMaxYValue ? value : NaN, bSuppressInvalidate);
	};

	AreaMicroChart.prototype._isNumber = function(n) {
		return typeof n === "number" && !isNaN(n) && isFinite(n);
	};

	AreaMicroChart.prototype.onBeforeRendering = function() {
		if (this._bUseIndex) {
			this._indexChartItems();
		}
		if (this.getIsResponsive() && !this.data("_parentRenderingContext") && jQuery.isFunction(this.getParent)) {
			this.data("_parentRenderingContext", this.getParent());
		}
		if (library._isInGenericTile(this)) {
			this.setIsResponsive(true);
			library._removeStandardMargins(this);
		}

		this._unbindMouseEnterLeaveHandler();
	};

	AreaMicroChart.prototype.onAfterRendering = function() {
		if (this.getIsResponsive()) {
			this._adjustToParent();
		}
		library._checkControlIsVisible(this, this._onControlIsVisible);

		this._bindMouseEnterLeaveHandler();
	};

	/**
	 * Callback function which is called when the control is visible, which means that the check via
	 * library._checkControlIsVisible was successful.
	 *
	 * @private
	 */
	AreaMicroChart.prototype._onControlIsVisible = function() {
		this._adjustLabelWidth();
		if (this.getIsResponsive()) {
			this._onResize();
		} else {
			this._renderCanvas();
		}
	};

	AreaMicroChart._CHARTITEM_AGGREGATIONS = ["chart", "target", "minThreshold", "maxThreshold", "innerMinThreshold", "innerMaxThreshold"];

	/**
	 * Applies numeric indices to the x-coordinates of all points in all AreaMicroChartItem aggregations in order to have them be enumerable.
	 * This simple enumeration causes an equidistant point distribution on the x-axis.
	 *
	 * @private
	 */
	AreaMicroChart.prototype._indexChartItems = function() {
		var oChartItem, n = AreaMicroChart._CHARTITEM_AGGREGATIONS.length;
		for (var i = 0; i < n; i++) {
			oChartItem = this.getAggregation(AreaMicroChart._CHARTITEM_AGGREGATIONS[i]);
			if (oChartItem) {
				this._indexChartItemPoints(oChartItem);
			}
		}
	};

	/**
	 * Sets the property "x" of all points in the given AreaMicroChartItem to their respective index in the "points" aggregation.
	 *
	 * @param {sap.suite.ui.microchart.AreaMicroChartItem} chartItem The AreaMicroChartItem whose points are to be indexed.
	 * @private
	 */
	AreaMicroChart.prototype._indexChartItemPoints = function(chartItem) {
		var oPoints = chartItem.getPoints();
		for (var i = 0; i < oPoints.length; i++) {
			oPoints[i].setProperty("x", i, true);
		}
	};

	/**
	 * Enables x-values of all points are automatically indexed with numeric, equidistant values.
	 *
	 * @param {boolean} useIndex Flag to activate automatic index
	 * @protected
	 */
	AreaMicroChart.prototype.enableXIndexing = function(useIndex) {
		this._bUseIndex = useIndex;
	};

	/**
	 * Handles the responsiveness.
	 *
	 * @private
	 */
	AreaMicroChart.prototype._onResize = function() {
		this.$().addClass("sapSuiteMicroChartsResponsive");
		this._resizeHorizontally();
		this._resizeVertically();
	};

	/**
	 * Handles the orientation change. The position and width of the canvas need to be
	 * recalculated after an orientation change.
	 *
	 * @private
	 */
	AreaMicroChart.prototype._onOrientationChange = function() {
		this._renderCanvas(this.$());
	};

	/**
	 * Adjusts the height and width of the whole control if this is required depending on parent control.
	 *
	 * @private
	 */
	AreaMicroChart.prototype._adjustToParent = function() {
		if (this.data("_parentRenderingContext") && this.data("_parentRenderingContext") instanceof FlexBox) {
			// Subtracts two pixels, otherwise there's not enough space for the outline, and the chart won't be rendered properly
			var $Parent = this.data("_parentRenderingContext").$();
			var fParentWidth = parseFloat($Parent.width()) - 2;
			var fParentHeight = parseFloat($Parent.height()) - 2;
			this.$().outerWidth(fParentWidth).outerHeight(fParentHeight);
		}
	};

	/**
	 * Resizes the chart vertically. If the height of the chart is less or equal to min-height (less), it hides the chart. Assuming that all the CSS has already been loaded and are available.
	 *
	 * @private
	 */
	AreaMicroChart.prototype._resizeVertically = function() {
		var $this = this.$(),
			fCurrentControlHeight = parseFloat($this.css("height")),
			$Canvas = $this.find(".sapSuiteAMCCanvas"),
			fCurrentCanvasContentHeight = parseFloat($Canvas.css("height"));

		// Hides the canvas' content if needed
		if (fCurrentCanvasContentHeight <= AreaMicroChart.EDGE_CASE_HEIGHT_SHOWCANVAS) {
			$Canvas.hide();
		} else {
			this._renderCanvas($this);
		}
		// Resizes the fonts
		if (fCurrentControlHeight <= AreaMicroChart.EDGE_CASE_HEIGHT_RESIZEFONT) {
			$this.addClass("sapSuiteAMCSmallFont");
		}
		// Hides chart in wide and normal view
		if (this.getView() === library.AreaMicroChartViewType.Wide) {
			if (this._hideWholeChartInWideMode(true)) {
				$this.hide();
			}
		} else {
			// Hides the top labels EDGE_CASE_HEIGHT_SHOWBOTTOMLABEL
			if (fCurrentControlHeight <= AreaMicroChart.EDGE_CASE_HEIGHT_SHOWTOPLABEL) {
				$this.find(".sapSuiteAMCPositionTop.sapSuiteAMCLabels").hide();
			}
			// Hides the bottom labels
			if (fCurrentControlHeight <= AreaMicroChart.EDGE_CASE_HEIGHT_SHOWBOTTOMLABEL) {
				$this.find(".sapSuiteAMCPositionBtm.sapSuiteAMCLabels").hide();
			}
		}
	};

	/**
	 * Adjusts the width of the labels if the chart is not in wide mode.
	 *
	 * @private
	 */
	AreaMicroChart.prototype._adjustLabelWidth = function() {
		var oMinLabel = this.getMinLabel();
		var oMaxLabel = this.getMaxLabel();
		if (this.getView() !== library.AreaMicroChartViewType.Wide) {
			if (oMinLabel && oMinLabel.getLabel()) {
				this._setValueLabelsWidth(".sapSuiteAMCLabels.sapSuiteAMCPositionBtm");
			}
			if (oMaxLabel && oMaxLabel.getLabel()) {
				this._setValueLabelsWidth(".sapSuiteAMCLabels.sapSuiteAMCPositionTop");
			}
		}
	};

	/**
	 * Calculates and sets the width of the labels if the chart is not in wide mode.
	 *
	 * @param {string} selector The selector to search for.
	 * @private
	 */
	AreaMicroChart.prototype._setValueLabelsWidth = function(selector) {
		var $this = this.$();
		var $LabelContainer = $this.find(selector);
		var iLeftLabelWidth, iRightLabelWidth, iLeftLabelPerCent, iRightLabelPerCent, iCenterLabelPerCent;
		var fCurrentControlWidth = parseFloat($this.css("width"));

		$LabelContainer.children().css("width", "auto");
		iLeftLabelWidth = $LabelContainer.children(".sapSuiteAMCPositionLeft").width();
		iRightLabelWidth = $LabelContainer.children(".sapSuiteAMCPositionRight").width();
		iLeftLabelPerCent = Math.round(iLeftLabelWidth / fCurrentControlWidth * 100) + 1;
		iRightLabelPerCent = Math.round(iRightLabelWidth / fCurrentControlWidth * 100) + 1;
		iCenterLabelPerCent = 100 - (iLeftLabelPerCent + iRightLabelPerCent);

		$LabelContainer.children(".sapSuiteAMCPositionLeft").css("width", iLeftLabelPerCent + "%");
		$LabelContainer.children(".sapSuiteAMCPositionRight").css("width", iRightLabelPerCent + "%");
		$LabelContainer.children(".sapSuiteAMCPositionCenter").css("width", iCenterLabelPerCent + "%");
	};

	/**
	 * Resizes the chart horizontally. If the width of the chart is less or equal to min-width (less), it hides the chart. Assumes that all the CSS has already been loaded and are available.
	 *
	 * @private
	 */
	AreaMicroChart.prototype._resizeHorizontally = function() {
		var $this = this.$();
		var fCurrentControlWidth = parseFloat($this.css("width"));
		var $TopLabelContainer = $this.find(".sapSuiteAMCPositionTop.sapSuiteAMCLabels");
		var $BottomLabelContainer = $this.find(".sapSuiteAMCPositionBtm.sapSuiteAMCLabels");
		var sView = this.getView();
		// Hides the entire chart if needed
		if (fCurrentControlWidth <= AreaMicroChart.EDGE_CASE_WIDTH_SHOWCHART || this.getView() === library.AreaMicroChartViewType.Wide && this._hideWholeChartInWideMode(false)) {
			$this.hide();
		} else {
			this._renderCanvas($this);
			// Resizes the fonts
			if (fCurrentControlWidth <= AreaMicroChart.EDGE_CASE_WIDTH_RESIZEFONT) {
				$this.addClass("sapSuiteAMCSmallFont");
			}
			// Hides the labels if truncated
			var aLabelContainer = [];
			aLabelContainer.push($TopLabelContainer, $BottomLabelContainer);
			for (var i = 0; i < aLabelContainer.length; i++) {
				var $Labels;
				if (sView === library.AreaMicroChartViewType.Wide) {
					$Labels = aLabelContainer[i].find(".sapSuiteAMCPositionCenter");
				} else {
					$Labels = aLabelContainer[i].find(".sapSuiteAMCLbl");
				}
				for (var j = 0; j < $Labels.size(); j++) {
					if (this._isLabelTruncated($Labels[j])) {
						aLabelContainer[i].hide();
						if (jQuery($Labels[j]).parent().is($TopLabelContainer)) {
							$this.removeClass("sapSuiteAMCTopLbls");
						} else if (jQuery($Labels[j]).parent().is($BottomLabelContainer)) {
							$this.removeClass("sapSuiteAMCBtmLbls");
						}
						break;
					}
				}
			}
		}
	};

	/**
	 * Checks if the chart should be hidden in wide mode.
	 *
	 * @private
	 * @param {boolean} vertical true indicates the size change comes from vertical direction, otherwise is horizontal direction
	 * @returns {boolean} True if the chart should be hidden, otherwise not.
	 */
	AreaMicroChart.prototype._hideWholeChartInWideMode = function(vertical) {
		var $this = this.$();
		var $RightLabels = this.$().find(".sapSuiteAMCPositionRight.sapSuiteAMCSideLabels");
		var $LeftLabels = this.$().find(".sapSuiteAMCPositionLeft.sapSuiteAMCSideLabels");
		if (vertical) {
			return $RightLabels.height() < AreaMicroChart.EDGE_CASE_HEIGHT_WIDE_VIEW_SHOWCHART || $LeftLabels.height() <= AreaMicroChart.EDGE_CASE_HEIGHT_WIDE_VIEW_SHOWCHART;
		} else {
			var iRightLabelWidth = $RightLabels.width();
			var iLeftLabelWidth = $LeftLabels.width();
			// Hides the chart especially for safari browser
			if (iRightLabelWidth + iLeftLabelWidth >= $this.width()) {
				$this.find(".sapSuiteAMCCanvas").hide();
			}
			// Removes the padding width from the label to the chart
			iRightLabelWidth = iRightLabelWidth ? iRightLabelWidth - AreaMicroChart.WIDE_MODE_LABEL_PADDING : 0;
			iLeftLabelWidth = iLeftLabelWidth ? iLeftLabelWidth - AreaMicroChart.WIDE_MODE_LABEL_PADDING : 0;
			return iRightLabelWidth + iLeftLabelWidth >= this.$().width();
		}
	};

	/**
	 * Checks if the label is truncated.
	 *
	 * @private
	 * @param {Object} label The label to be checked.
	 * @returns {boolean} True if the label is truncated, false if not.
	 */
	AreaMicroChart.prototype._isLabelTruncated = function(label) {
		var iSubtrahend;

		/* Both Internet Explorer and Edge browser compute the scrollWidth with 1px more.
		 * In this case the scrollWidth needs to be reduced by 1px */
		if (Device.browser.msie || Device.browser.edge) {
			iSubtrahend = 1;
		} else {
			iSubtrahend = 0;
		}
		return label.offsetWidth < label.scrollWidth - iSubtrahend;
	};

	AreaMicroChart.prototype.ontap = function(oEvent) {
		if (Device.browser.msie) {
			this.$().focus();
		}
		this.firePress();
	};

	AreaMicroChart.prototype.onkeydown = function(oEvent) {
		if (oEvent.which == jQuery.sap.KeyCodes.SPACE) {
			oEvent.preventDefault();
		}
	};

	AreaMicroChart.prototype.onkeyup = function(oEvent) {
		if (oEvent.which == jQuery.sap.KeyCodes.ENTER || oEvent.which == jQuery.sap.KeyCodes.SPACE) {
			this.firePress();
			oEvent.preventDefault();
		}
	};

	AreaMicroChart.prototype.attachEvent = function() {
		Control.prototype.attachEvent.apply(this, arguments);

		if (this.hasListeners("press")) {
			this.$().attr("tabindex", 0).addClass("sapSuiteUiMicroChartPointer");
		}

		return this;
	};

	AreaMicroChart.prototype.detachEvent = function() {
		Control.prototype.detachEvent.apply(this, arguments);

		if (!this.hasListeners("press")) {
			this.$().removeAttr("tabindex").removeClass("sapSuiteUiMicroChartPointer");
		}
		return this;
	};

	/**
	 * Retrieves the translated name of the given semantic color from the resource bundle.
	 *
	 * @param {sap.m.ValueColor} color The semantic color to be translated.
	 * @returns {string} The translated text.
	 * @private
	 */
	AreaMicroChart.prototype._getLocalizedColorMeaning = function(color) {
		return this._oRb.getText(("SEMANTIC_COLOR_" + color).toUpperCase());
	};

	AreaMicroChart.prototype.getAltText = function() {
		var sAltText = "";
		var oFirstXLabel = this.getFirstXLabel();
		var oFirstYLabel = this.getFirstYLabel();
		var oLastXLabel = this.getLastXLabel();
		var oLastYLabel = this.getLastYLabel();
		var oMinLabel = this.getMinLabel();
		var oMaxLabel = this.getMaxLabel();
		var oActual = this.getChart();
		var oTarget = this.getTarget();
		var bIsFirst = true;
		if (oFirstXLabel && oFirstXLabel.getLabel() || oFirstYLabel && oFirstYLabel.getLabel()) {
			sAltText += (bIsFirst ? "" : "\n") + this._oRb.getText(("AREAMICROCHART_START")) + ": " + (oFirstXLabel ? oFirstXLabel.getLabel() : "") + " " + (oFirstYLabel ? oFirstYLabel.getLabel() + " " + this._getLocalizedColorMeaning(oFirstYLabel.getColor()) : "");
			bIsFirst = false;
		}
		if (oLastXLabel && oLastXLabel.getLabel() || oLastYLabel && oLastYLabel.getLabel()) {
			sAltText += (bIsFirst ? "" : "\n") + this._oRb.getText(("AREAMICROCHART_END")) + ": " + (oLastXLabel ? oLastXLabel.getLabel() : "") + " " + (oLastYLabel ? oLastYLabel.getLabel() + " " + this._getLocalizedColorMeaning(oLastYLabel.getColor()) : "");
			bIsFirst = false;
		}
		if (oMinLabel && oMinLabel.getLabel()) {
			sAltText += (bIsFirst ? "" : "\n") + this._oRb.getText(("AREAMICROCHART_MINIMAL_VALUE")) + ": " + oMinLabel.getLabel() + " " + this._getLocalizedColorMeaning(oMinLabel.getColor());
			bIsFirst = false;
		}
		if (oMaxLabel && oMaxLabel.getLabel()) {
			sAltText += (bIsFirst ? "" : "\n") + this._oRb.getText(("AREAMICROCHART_MAXIMAL_VALUE")) + ": " + oMaxLabel.getLabel() + " " + this._getLocalizedColorMeaning(oMaxLabel.getColor());
			bIsFirst = false;
		}
		if (oActual && oActual.getPoints() && oActual.getPoints().length > 0) {
			sAltText += (bIsFirst ? "" : "\n") + this._oRb.getText(("AREAMICROCHART_ACTUAL_VALUES")) + ":";
			bIsFirst = false;
			var aActual = oActual.getPoints();
			for (var i = 0; i < aActual.length; i++) {
				sAltText += " " + aActual[i].getY();
			}
		}
		if (oTarget && oTarget.getPoints() && oTarget.getPoints().length > 0) {
			sAltText += (bIsFirst ? "" : "\n") + this._oRb.getText(("AREAMICROCHART_TARGET_VALUES")) + ":";
			var aTarget = oTarget.getPoints();
			for (var j = 0; j < aTarget.length; j++) {
				sAltText += " " + aTarget[j].getY();
			}
		}
		for (var k = 0; k < this.getLines().length; k++) {
			var oLine = this.getLines()[k];
			if (oLine.getPoints() && oLine.getPoints().length > 0) {
				sAltText += (bIsFirst ? "" : "\n") + oLine.getTitle() + ":";
				var aLine = oLine.getPoints();
				for (var y = 0; y < aLine.length; y++) {
					sAltText += " " + aLine[y].getY();
				}

				if (this.getColorPalette().length == 0) {
					sAltText += " " + this._getLocalizedColorMeaning(oLine.getColor());
				}
			}
		}
		return sAltText;
	};

	AreaMicroChart.prototype.getTooltip_AsString = function() { //eslint-disable-line
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
	AreaMicroChart.prototype._getAccessibilityControlType = function() {
		return this._oRb.getText("ACC_CTR_TYPE_AREAMICROCHART");
	};

	AreaMicroChart.prototype.clone = function() {
		var oClone = Control.prototype.clone.apply(this, arguments);
		oClone._isMinXValue = this._isMinXValue;
		oClone._isMaxXValue = this._isMaxXValue;
		oClone._isMinYValue = this._isMinYValue;
		oClone._isMaxYValue = this._isMaxYValue;
		return oClone;
	};

	AreaMicroChart.prototype.exit = function() {
		if (Device.system.tablet || Device.system.phone) {
			Device.orientation.detachHandler(this._onOrientationChange, this);
		}
		sap.ui.getCore().detachThemeChanged(this._handleThemeApplied, this);
	};

	/**
	 * Adds the title attribute to show the tooltip when the mouse enters the chart.
	 *
	 * @private
	 */
	AreaMicroChart.prototype._addTitleAttribute = function() {
		if (!this.$().attr("title")) {
			this.$().attr("title", this.getTooltip_AsString());
		}
	};

	/**
	 * Removes the title attribute to hide the tooltip when the mouse leaves the chart.
	 *
	 * @private
	 */
	AreaMicroChart.prototype._removeTitleAttribute = function() {
		if (this.$().attr("title")) {
			this.$().removeAttr("title");
		}
	};

	/**
	 * Binds the handlers for mouseenter mouseleave events.
	 *
	 * @private
	 */
	AreaMicroChart.prototype._bindMouseEnterLeaveHandler = function() {
		// handlers need to be saved intermediately in order to unbind successfully
		if (!this._oMouseEnterLeaveHandler) {
			this._oMouseEnterLeaveHandler = {
				mouseEnterChart: this._addTitleAttribute.bind(this),
				mouseLeaveChart: this._removeTitleAttribute.bind(this)
			};
		}
		// bind events on chart
		this.$().bind("mouseenter", this._oMouseEnterLeaveHandler.mouseEnterChart);
		this.$().bind("mouseleave", this._oMouseEnterLeaveHandler.mouseLeaveChart);
	};

	/**
	 * Unbinds the handlers for mouseenter mouseleave events.
	 *
	 * @private
	 */
	AreaMicroChart.prototype._unbindMouseEnterLeaveHandler = function() {
		if (this._oMouseEnterLeaveHandler) {
			this.$().unbind("mouseenter", this._oMouseEnterLeaveHandler.mouseEnterChart);
			this.$().unbind("mouseleave", this._oMouseEnterLeaveHandler.mouseLeaveChart);
		}
	};

	library._overrideGetAccessibilityInfo(AreaMicroChart.prototype);

	return AreaMicroChart;
});
