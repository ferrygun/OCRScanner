 /*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([ "jquery.sap.global", "sap/ui/Device", "sap/m/ValueColor" ],
	function(jQuery, Device, ValueColor) {
	"use strict";

	/**
	* RadialMicroChartRenderer renderer.
	* @namespace
	* @since 1.36.0
	*/
	var RadialMicroChartRenderer = {};

	//Constants
	RadialMicroChartRenderer.FORM_RATIO = 100; //Form ratio for the control, means the calculation base
	RadialMicroChartRenderer.BACKGROUND_CIRCLE_BORDER_WIDTH = 1;
	RadialMicroChartRenderer.BACKGROUND_CIRCLE_RADIUS = (RadialMicroChartRenderer.FORM_RATIO / 2.0) - (RadialMicroChartRenderer.BACKGROUND_CIRCLE_BORDER_WIDTH / 2.0);
	RadialMicroChartRenderer.RING_WIDTH = 8.75; //Calculated by: RadialMicroChartRenderer.BACKGROUND_CIRCLE_RADIUS * 0.175<WHEEL_WIDTH_FACTOR
	RadialMicroChartRenderer.RING_CORE_RADIUS = RadialMicroChartRenderer.BACKGROUND_CIRCLE_RADIUS - (RadialMicroChartRenderer.RING_WIDTH / 2.0) - RadialMicroChartRenderer.BACKGROUND_CIRCLE_BORDER_WIDTH;
	RadialMicroChartRenderer.SVG_VIEWBOX_CENTER_FACTOR = "50%";
	RadialMicroChartRenderer.X_ROTATION = 0;
	RadialMicroChartRenderer.SWEEP_FLAG = 1;
	RadialMicroChartRenderer.PADDING_WIDTH = 0.22;//Should be 1 px
	RadialMicroChartRenderer.NUMBER_FONT_SIZE = 23.5; //Calculated by: RadialMicroChartRenderer.BACKGROUND_CIRCLE_RADIUS * 0.47<NUMBER_FONT_SIZE_FACTOR>
	RadialMicroChartRenderer.EDGE_CASE_SIZE_USE_SMALL_FONT = 54; // this value corresponds to 14 px for text font size
	RadialMicroChartRenderer.EDGE_CASE_SIZE_SHOW_TEXT = 46;
	RadialMicroChartRenderer.EDGE_CASE_SIZE_MICRO_CHART = 24;

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the Render - Output - Buffer
	 * @param {sap.ui.core.Control} oControl the control to be rendered
	 */
	RadialMicroChartRenderer.render = function(oRm, oControl) {
		if (!oControl._bThemeApplied) {
			return;
		}

		// Write the HTML into the render manager
		this._writeDivStartElement(oControl, oRm);
		this._writeSVGStartElement(oControl, oRm);
		this._writeBackground(oRm);
		if (this._renderingOfInnerContentIsRequired(oControl)) {
			this._writeBorders(oRm);
			if (this._innerCircleRequired(oControl)) {
				this._writeCircle(oControl, oRm);
			} else {
				this._writeCircleWithPathElements(oControl, oRm);
			}
			this._writeText(oControl, oRm);
		}
		oRm.write("</svg>");
		oRm.write("</div>");
	};

	/* Rendering Write-Helpers */

	/**
	 * Writes the start tag for the surrounding div-element incl. ARIA text and required classes
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @param {sap.ui.core.RenderManager} oRm the render manager
	 */
	RadialMicroChartRenderer._writeDivStartElement = function(control, oRm) {
		oRm.write("<div");
		oRm.writeControlData(control);
		var sAriaLabel = control._getTooltipText();
		oRm.writeAttribute("role", "img");
		oRm.writeAttributeEscaped("aria-label", sAriaLabel);
		if (control.hasListeners("press")) {
			oRm.addClass("sapSuiteUiMicroChartPointer");
			oRm.writeAttribute("tabindex", "0");
		}
		oRm.addClass("sapSuiteRMC");
		var sSizeClass = "sapSuiteRMCSize" + control.getSize();
		oRm.addClass(jQuery.sap.encodeHTML(sSizeClass));
		oRm.writeClasses();
		oRm.writeStyles();
		oRm.write(">");
	};

	/**
	 * Writes the start tag for the SVG element.
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @param {sap.ui.core.RenderManager} oRm the render manager
	 */
	RadialMicroChartRenderer._writeSVGStartElement = function(control, oRm) {
		var sPreserveAspectRatio;
		if (!sap.ui.getCore().getConfiguration().getRTL()) {
			sPreserveAspectRatio = "xMaxYMid meet";
		} else {
			sPreserveAspectRatio = "xMinYMid meet";
		}
		var sSizeClass = "sapSuiteRMCSize" + control.getSize();
		oRm.write("<svg class=\"sapSuiteRMC " + jQuery.sap.encodeHTML(sSizeClass) + "\" focusable=\"false" + "\" viewBox=\"0 0 " + RadialMicroChartRenderer.FORM_RATIO + ' ' + RadialMicroChartRenderer.FORM_RATIO + "\" preserveAspectRatio=\"" + jQuery.sap.encodeHTML(sPreserveAspectRatio) + "\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\">");
	};

	/**
	 * Writes the background circle.
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm the render manager
	 */
	RadialMicroChartRenderer._writeBackground = function(oRm) {
		oRm.write("<circle class=\"sapSuiteRMCCircleBackground\" cx=\"" + RadialMicroChartRenderer.SVG_VIEWBOX_CENTER_FACTOR + "\" cy=\"" + RadialMicroChartRenderer.SVG_VIEWBOX_CENTER_FACTOR + "\" r=\"" + RadialMicroChartRenderer.BACKGROUND_CIRCLE_RADIUS + "\" stroke-width=\"" + this.BACKGROUND_CIRCLE_BORDER_WIDTH + "\" />");
	};

	/**
	 * Writes the Borders, required for High Contrast themes.
	 * In case of other themes, they are also available to avoid issues while switching themes.
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm the render manager
	 */
	RadialMicroChartRenderer._writeBorders = function(oRm) {
		var fRadius1 = RadialMicroChartRenderer.RING_CORE_RADIUS + (RadialMicroChartRenderer.RING_WIDTH / 2.0) - (RadialMicroChartRenderer.BACKGROUND_CIRCLE_BORDER_WIDTH / 2.0),
			fRadius2 = RadialMicroChartRenderer.RING_CORE_RADIUS - (RadialMicroChartRenderer.RING_WIDTH / 2.0) + (RadialMicroChartRenderer.BACKGROUND_CIRCLE_BORDER_WIDTH / 2.0);

		oRm.write("<circle");
		oRm.addClass("sapSuiteRMCRing");
		oRm.writeClasses();
		oRm.writeAttribute("cx", RadialMicroChartRenderer.SVG_VIEWBOX_CENTER_FACTOR);
		oRm.writeAttribute("cy", RadialMicroChartRenderer.SVG_VIEWBOX_CENTER_FACTOR);
		oRm.writeAttribute("r", fRadius1);
		oRm.writeAttribute("stroke-width", RadialMicroChartRenderer.BACKGROUND_CIRCLE_BORDER_WIDTH);
		oRm.write("/>");

		oRm.write("<circle");
		oRm.addClass("sapSuiteRMCRing");
		oRm.writeClasses();
		oRm.writeAttribute("cx", RadialMicroChartRenderer.SVG_VIEWBOX_CENTER_FACTOR);
		oRm.writeAttribute("cy", RadialMicroChartRenderer.SVG_VIEWBOX_CENTER_FACTOR);
		oRm.writeAttribute("r", fRadius2);
		oRm.writeAttribute("stroke-width", RadialMicroChartRenderer.BACKGROUND_CIRCLE_BORDER_WIDTH);
		oRm.write("/>");
	};

	/**
	 * Writes the circle element, required for 0% and 100% cases.
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @param {sap.ui.core.RenderManager} oRm the render manager
	 */
	RadialMicroChartRenderer._writeCircle = function(control, oRm) {
		var sColor = this._getFullCircleColor(control);
		oRm.write("<circle");
		if (control._isValueColorValid() || sColor === "sapSuiteRMCRemainingCircle") {
			oRm.addClass(jQuery.sap.encodeHTML(sColor));
		} else {
			oRm.writeAttributeEscaped("stroke", sColor);
		}
		oRm.writeClasses();
		oRm.writeStyles();
		oRm.write("cx=\"" + RadialMicroChartRenderer.SVG_VIEWBOX_CENTER_FACTOR + "\" cy=\"" + RadialMicroChartRenderer.SVG_VIEWBOX_CENTER_FACTOR + "\" r=\"" + RadialMicroChartRenderer.RING_CORE_RADIUS + "\" fill=\"transparent\" stroke-width=\"" + RadialMicroChartRenderer.RING_WIDTH + "px\" />");
	};

	/**
	 * Writes the two path elements, required for all cases between 1% and 99%.
	 * Keeps a padding of 1px between the paths.
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @param {sap.ui.core.RenderManager} oRm the render manager
	 */
	RadialMicroChartRenderer._writeCircleWithPathElements = function(control, oRm) {
		var iLargeArcFlag = control.getPercentage() > 50 ? 1 : 0;
		//decrease/increase the percentage to have a padding between paths
		var fPercentage = this._getPercentageForCircleRendering(control) - RadialMicroChartRenderer.PADDING_WIDTH;
		var aPathCoordinates = this._calculatePathCoordinates(control, fPercentage, false);
		this._writePath1(iLargeArcFlag, aPathCoordinates, control, oRm);
		fPercentage = this._getPercentageForCircleRendering(control) + RadialMicroChartRenderer.PADDING_WIDTH;
		aPathCoordinates = this._calculatePathCoordinates(control, fPercentage, true);
		this._writePath2(iLargeArcFlag, aPathCoordinates, control, oRm);
	};

	/**
	 * Writes the first path element for cases between 1% and 99%.
	 *
	 * @private
	 * @param {int} largeArcFlag for check of smaller or bigger than 180 degrees
	 * @param {float[]} pathCoordinates array containing specific coordinates for the path
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @param {sap.ui.core.RenderManager} oRm the render manager
	 */
	RadialMicroChartRenderer._writePath1 = function(largeArcFlag, pathCoordinates, control, oRm) {
		var sPathData1 = "M" + pathCoordinates[0] + " " + pathCoordinates[1] + " A " + RadialMicroChartRenderer.RING_CORE_RADIUS + " " + RadialMicroChartRenderer.RING_CORE_RADIUS +
		", " + RadialMicroChartRenderer.X_ROTATION + ", " + largeArcFlag + ", " + RadialMicroChartRenderer.SWEEP_FLAG + ", " + pathCoordinates[2] + " " + pathCoordinates[3];

		var sColor = this._getPathColor(control);
		oRm.write("<path");
		oRm.addClass("sapSuiteRMCPath");
		if (control._isValueColorValid() || sColor === "sapSuiteRMCRemainingCircle") {
			oRm.addClass(jQuery.sap.encodeHTML(sColor));
		} else {
			oRm.writeAttributeEscaped("stroke", sColor);
		}
		oRm.writeClasses();
		oRm.writeStyles();
		oRm.write("d=\"" + jQuery.sap.encodeHTML(sPathData1) + "\" fill=\"transparent\" stroke-width=\"" + RadialMicroChartRenderer.RING_WIDTH + "px\" />");
	};

	/**
	 * Writes the second path element for cases between 1% and 99%.
	 *
	 * @private
	 * @param {int} largeArcFlag for check of smaller or bigger than 180 degrees
	 * @param {float[]} pathCoordinates array containing specific coordinates for the path
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @param {sap.ui.core.RenderManager} oRm the render manager
	 */
	RadialMicroChartRenderer._writePath2 = function(largeArcFlag, pathCoordinates, control, oRm) {
		var sPathData2 = "M" + pathCoordinates[2] + " " + pathCoordinates[3] + " A " + RadialMicroChartRenderer.RING_CORE_RADIUS + " " + RadialMicroChartRenderer.RING_CORE_RADIUS +
		", " + RadialMicroChartRenderer.X_ROTATION + ", " + (1 - largeArcFlag) + ", " + RadialMicroChartRenderer.SWEEP_FLAG + ", " + pathCoordinates[0] + " " + pathCoordinates[1];

		oRm.write("<path class=\"sapSuiteRMCPath sapSuiteRMCRemainingCircle\" d=\"" + jQuery.sap.encodeHTML(sPathData2) + "\" fill=\"transparent\" stroke-width=\"" + RadialMicroChartRenderer.RING_WIDTH + "px\" />");
	};

	/**
	 * Writes the text content inside the chart.
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @param {sap.ui.core.RenderManager} oRm the render manager
	 */
	RadialMicroChartRenderer._writeText = function(control, oRm) {
		oRm.write("<text class=\"sapSuiteRMCFont\" text-anchor=\"middle\" alignment-baseline=\"middle\"" + "\" font-size=\"" + RadialMicroChartRenderer.NUMBER_FONT_SIZE + "\" x=\"" + RadialMicroChartRenderer.SVG_VIEWBOX_CENTER_FACTOR + "\" y=\"" + jQuery.sap.encodeHTML(this._getVerticalViewboxCenterFactorForText()) + "\"> " + jQuery.sap.encodeHTML(this._generateTextContent(control)) + "</text>");
	};

	/* Helpers */

	/**
	 * Checks if rendering of inner content (circle or path-elements) is required.
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @returns {boolean} true if rendering is required, false if rendering is not required
	 */
	RadialMicroChartRenderer._renderingOfInnerContentIsRequired = function(control) {
		if (control._getPercentageMode() || (control.getTotal() !== 0)){
			return true;
		} else {
			return false;
		}
	};

	/**
	 * Returns the center factor for the text element.
	 * Since browsers interpret the text differently, the constant SVG_VIEWBOX_CENTER_FACTOR can not be used.
	 *
	 * @private
	 * @returns {string} factor for vertical center of text
	 */
	RadialMicroChartRenderer._getVerticalViewboxCenterFactorForText = function() {
		if (Device.browser.msie || Device.browser.mozilla || Device.browser.edge) {
			return "57%";
		} else {
			return "51%";
		}
	};

	/**
	 * Checks if the inner circle is required. This is valid for 0% or 100% scenarios.
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @returns {boolean} True if inner circle has to be rendered, false if inner circle is not required
	 */
	RadialMicroChartRenderer._innerCircleRequired = function(control) {
		return control.getPercentage() >= 100 || control.getPercentage() <= 0;
	};

	/**
	 * Generates the coordinates needed for drawing the two path elements.
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control - the current chart control
	 * @param {float} percentage The calculated percentage value for bar rendering
	 * @param {boolean} hasPadding Padding is required or not
	 * @returns {float[]} Array with calculated coordinates
	 */
	RadialMicroChartRenderer._calculatePathCoordinates = function(control, percentage, hasPadding) {
		var aCoordinates = [];
		var fPadding = 0;
		var fCenter = RadialMicroChartRenderer.FORM_RATIO / 2;

		if (hasPadding) {
			fPadding = 2 * RadialMicroChartRenderer.PADDING_WIDTH / 100 * 2 * Math.PI;
		}

		aCoordinates.push(fCenter + RadialMicroChartRenderer.RING_CORE_RADIUS * Math.cos(-Math.PI / 2.0 - fPadding));
		aCoordinates.push(fCenter + RadialMicroChartRenderer.RING_CORE_RADIUS * Math.sin(-Math.PI / 2.0 - fPadding));
		aCoordinates.push(fCenter + RadialMicroChartRenderer.RING_CORE_RADIUS * Math.cos(-Math.PI / 2.0 + percentage / 100 * 2 * Math.PI));
		aCoordinates.push(fCenter + RadialMicroChartRenderer.RING_CORE_RADIUS * Math.sin(-Math.PI / 2.0 + percentage / 100 * 2 * Math.PI));

		return aCoordinates;
	};

	/**
	 * Generates percentage value for rendering the circle.
	 * For edge cases (99% and 1%) a specific handling is implemented.
	 * For values between 99.0% - 99.9%, 99% will be retrieved to make sure the circle is not completely filled setting thos big values.
	 * For values between 0.1% - 0.9%, 1% will be returned to make sure the circle is not completely empty settings those small values.
	 * This is only used for painting the circle by path elements. For the text area, the value of the percentage property can be used.
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @returns {float} the calculated percentage value for bar rendering
	 */
	RadialMicroChartRenderer._getPercentageForCircleRendering = function(control) {
		var fPercentage = control.getPercentage();
		var fPercentageForEdgeCases = fPercentage;
		if (fPercentage > 99 - RadialMicroChartRenderer.PADDING_WIDTH) {
			fPercentageForEdgeCases = 99 - RadialMicroChartRenderer.PADDING_WIDTH;
		}
		if (fPercentage < 1 + RadialMicroChartRenderer.PADDING_WIDTH) {
			fPercentageForEdgeCases = 1 + RadialMicroChartRenderer.PADDING_WIDTH;
		}
		return fPercentageForEdgeCases;
	};

	/**
	 * Handles the UI specific stuff in onAfterRendering.
	 *
	 * @private
	 * @param {object} control instance of RadialMicroChart
	 */
	RadialMicroChartRenderer._handleOnAfterRendering = function(control) {
		var sParentWidth, sParentHeight;
		var $Text = control.$().find("text");
		var $Svg = control.$().children("svg");
		if (control.getSize() === "Responsive") {
			//Applies fixed size of parent to make SVG work in all browsers.
			if (control.getParent() !== undefined && control.getParent() !== null &&
					control.getParent().getHeight !== undefined && control.getParent().getHeight !== null) {
				// Two pixels are subtracted from the original value. Otherwise, there's not enough space for the outline and it won't render correctly.
				sParentHeight = parseFloat(control.getParent().$().height()) - 2;
				control.$().height(sParentHeight); //Required for rendering in page element. Otherwise element is cutted at the top.
				$Svg.height(sParentHeight);
			}
			if (control.getParent() !== undefined && control.getParent() !== null &&
					control.getParent().getWidth !== undefined && control.getParent().getWidth !== null) {
				// Two pixels are subtracted from the original value. Otherwise, there's not enough space for the outline and it won't render correctly.
				sParentWidth = parseFloat(control.getParent().$().width()) - 2;
				control.$().width(sParentWidth); //Required for rendering in page element. Otherwise element is cutted at the top.
				$Svg.width(sParentWidth);
			}
		}
		if (control.getSize() === "Responsive") {
			//Hides control when threshold for visibility reached
			if (parseInt($Svg.css("height"), 10) < RadialMicroChartRenderer.EDGE_CASE_SIZE_MICRO_CHART ||
					parseInt($Svg.css("width"), 10) < RadialMicroChartRenderer.EDGE_CASE_SIZE_MICRO_CHART) {
				control.$().hide();
				return;
			}
			//Hides text element for small elements (<46px)
			if (parseInt($Svg.css("height"), 10) <= RadialMicroChartRenderer.EDGE_CASE_SIZE_SHOW_TEXT ||
					parseInt($Svg.css("width"), 10) <= RadialMicroChartRenderer.EDGE_CASE_SIZE_SHOW_TEXT) {
				$Text.hide();
			}
		}
		//Applies correct color classes
		var sTextColorClass = this._getTextColorClass(control); // Gets the correct color
		var sCurrentSVGClass = $Svg.attr("class") || ""; // Gets all the classes applied to the SVG element or uses an empty string if none are found
		if (sCurrentSVGClass.indexOf(sTextColorClass) < 0) {
			var sNewClasses = sCurrentSVGClass + " " + sTextColorClass;
			// If the SVG element is small, then additional class should be added indicating that small fonts are applied
			var iSvgElementHeight = parseInt($Svg.css("height"), 10);
			if (iSvgElementHeight <= RadialMicroChartRenderer.EDGE_CASE_SIZE_USE_SMALL_FONT) {
				sNewClasses += " sapSuiteRMCSmallFont";
			}
			// Writes a new class attribute with all the other classes and the new correct color
			// SVG instead of Text element is used to work around a bug on mobile devices using the Edge browser
			$Svg.attr("class", sNewClasses );
		}
	};

	/**
	 * Returns the text color of the control. Also handles switch for accessibility features.
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @returns {string} value for CSS Text color class
	 */
	RadialMicroChartRenderer._getTextColorClass = function(control) {
		switch (control.getValueColor()){
			case ValueColor.Good:
				return "sapSuiteRMCGoodTextColor";
			case ValueColor.Error:
				return "sapSuiteRMCErrorTextColor";
			case ValueColor.Critical:
				return "sapSuiteRMCCriticalTextColor";
			default:
				return "sapSuiteRMCNeutralTextColor";
		}
	};

	/**
	 * Returns the color for full circles required for 100% or 0% charts.
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @returns {string} value for full circle CSS color class or css attribute
	 */
	RadialMicroChartRenderer._getFullCircleColor = function(control) {
		if (control.getPercentage() >= 100) {
			return this._getPathColor(control);
		}
		if (control.getPercentage() <= 0) {
			return "sapSuiteRMCRemainingCircle";
		}
	};

	/**
	 * Gets the CSS class or CSS attribute to apply the right color to the circle path
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @returns {string} containing the name of the CSS class or the CSS value
	 */
	RadialMicroChartRenderer._getPathColor = function(control) {
		var sValueColor = control.getValueColor();
		if (control._isValueColorValid()) {
			switch (sValueColor){
				case ValueColor.Good:
					return "sapSuiteRMCPathGood";
				case ValueColor.Error:
					return "sapSuiteRMCPathError";
				case ValueColor.Critical:
					return "sapSuiteRMCPathCritical";
				default:
					return "sapSuiteRMCPathNeutral";
			}
		} else {
			return sValueColor;
		}
	};

	/**
	 * Generates the text content of the chart
	 *
	 * @private
	 * @param {sap.suite.ui.microchart.RadialMicroChart} control the current chart control
	 * @returns {string} value for text element in the chart
	 */
	RadialMicroChartRenderer._generateTextContent = function(control) {
		if (control.getPercentage() === 100) {
			return control._oRb.getText("RADIALMICROCHART_PERCENTAGE_TEXT", [100]);
		}
		if (control.getPercentage() === 0) {
			return control._oRb.getText("RADIALMICROCHART_PERCENTAGE_TEXT", [0]);
		}
		if (control.getPercentage() >= 100) {
			jQuery.sap.log.error("Values over 100%(" + control.getPercentage() + "%) are not supported");
			return control._oRb.getText("RADIALMICROCHART_PERCENTAGE_TEXT", [100]);
		}
		if (control.getPercentage() <= 0) {
			jQuery.sap.log.error("Values below 0%(" + control.getPercentage() + "%) are not supported");
			return control._oRb.getText("RADIALMICROCHART_PERCENTAGE_TEXT", [0]);
		}
		return control._oRb.getText("RADIALMICROCHART_PERCENTAGE_TEXT", [control.getPercentage()]);
	};

	return RadialMicroChartRenderer;
}, /* bExport */ true);
