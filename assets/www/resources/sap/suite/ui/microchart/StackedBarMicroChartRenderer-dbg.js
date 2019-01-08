/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define(['jquery.sap.global', 'sap/m/ValueColor', 'sap/ui/core/theming/Parameters'],
	function(jQuery, ValueColor, Parameters) {
	"use strict";

	/**
	 * StackedBarMicroChart renderer.
	 * @namespace
	 */
	var StackedBarMicroChartRenderer = {};

	StackedBarMicroChartRenderer.LABEL_COLOR_LIGHT = "#ffffff";
	StackedBarMicroChartRenderer.LABEL_COLOR_DARK = "#000000";
	StackedBarMicroChartRenderer.COLORNAME_TO_HEX_MAP = {aliceblue: "#f0f8ff", antiquewhite: "#faebd7", aqua: "#00ffff", aquamarine: "#7fffd4", azure: "#f0ffff", beige: "#f5f5dc",
		bisque: "#ffe4c4", black: "#000000", blanchedalmond: "#ffebcd", blue: "#0000ff", blueviolet: "#8a2be2", brown: "#a52a2a", burlywood: "#deb887", cadetblue: "#5f9ea0",
		chartreuse: "#7fff00", chocolate: "#d2691e", coral: "#ff7f50", cornflowerblue: "#6495ed", cornsilk: "#fff8dc", crimson: "#dc143c", cyan: "#00ffff",
		darkblue: "#00008b", darkcyan: "#008b8b", darkgoldenrod: "#b8860b", darkgray: "#a9a9a9", darkgrey: "#a9a9a9", darkgreen: "#006400", darkkhaki: "#bdb76b", darkmagenta: "#8b008b",
		darkolivegreen: "#556b2f", darkorange: "#ff8c00", darkorchid: "#9932cc", darkred: "#8b0000", darksalmon: "#e9967a", darkseagreen: "#8fbc8f",
		darkslateblue: "#483d8b", darkslategray: "#2f4f4f", darkslategrey: "#2f4f4f", darkturquoise: "#00ced1", darkviolet: "#9400d3", deeppink: "#ff1493", deepskyblue: "#00bfff",
		dimgray: "#696969", dimgrey: "#696969", dodgerblue: "#1e90ff", firebrick: "#b22222", floralwhite: "#fffaf0", forestgreen: "#228b22", fuchsia: "#ff00ff", gainsboro: "#dcdcdc",
		ghostwhite: "#f8f8ff", gold: "#ffd700", goldenrod: "#daa520", gray: "#808080", grey: "#808080", green: "#008000", greenyellow: "#adff2f", honeydew: "#f0fff0", hotpink: "#ff69b4",
		indianred: "#cd5c5c", indigo: "#4b0082", ivory: "#fffff0", khaki: "#f0e68c", lavender: "#e6e6fa", lavenderblush: "#fff0f5", lawngreen: "#7cfc00",
		lemonchiffon: "#fffacd", lightblue: "#add8e6", lightcoral: "#f08080", lightcyan: "#e0ffff", lightgoldenrodyellow: "#fafad2", lightgrey: "#d3d3d3", lightgray: "#d3d3d3",
		lightgreen: "#90ee90", lightpink: "#ffb6c1", lightsalmon: "#ffa07a", lightseagreen: "#20b2aa", lightskyblue: "#87cefa", lightslategray: "#778899", lightslategrey: "#778899",
		lightsteelblue: "#b0c4de", lightyellow: "#ffffe0", lime: "#00ff00", limegreen: "#32cd32", linen: "#faf0e6", magenta: "#ff00ff", maroon: "#800000",
		mediumaquamarine: "#66cdaa", mediumblue: "#0000cd", mediumorchid: "#ba55d3", mediumpurple: "#9370d8", mediumseagreen: "#3cb371", mediumslateblue: "#7b68ee",
		mediumspringgreen: "#00fa9a", mediumturquoise: "#48d1cc", mediumvioletred: "#c71585", midnightblue: "#191970", mintcream: "#f5fffa", mistyrose: "#ffe4e1",
		moccasin: "#ffe4b5", navajowhite: "#ffdead", navy: "#000080", oldlace: "#fdf5e6", olive: "#808000", olivedrab: "#6b8e23", orange: "#ffa500", orangered: "#ff4500",
		orchid: "#da70d6", palegoldenrod: "#eee8aa", palegreen: "#98fb98", paleturquoise: "#afeeee", palevioletred: "#d87093", papayawhip: "#ffefd5", peachpuff: "#ffdab9",
		peru: "#cd853f", pink: "#ffc0cb", plum: "#dda0dd", powderblue: "#b0e0e6", purple: "#800080", rebeccapurple: "#663399", red: "#ff0000", rosybrown: "#bc8f8f",
		royalblue: "#4169e1", saddlebrown: "#8b4513", salmon: "#fa8072", sandybrown: "#f4a460", seagreen: "#2e8b57", seashell: "#fff5ee", sienna: "#a0522d",
		silver: "#c0c0c0", skyblue: "#87ceeb", slateblue: "#6a5acd", slategray: "#708090", slategrey: "#708090", snow: "#fffafa", springgreen: "#00ff7f", steelblue: "#4682b4", tan: "#d2b48c",
		teal: "#008080", thistle: "#d8bfd8", tomato: "#ff6347", turquoise: "#40e0d0", violet: "#ee82ee", wheat: "#f5deb3", white: "#ffffff", whitesmoke: "#f5f5f5",
		yellow: "#ffff00", yellowgreen: "#9acd32"};

	StackedBarMicroChartRenderer.SEMANTIC_COLORS = {
		Good: "Positive",
		Error: "Negative"
	};

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 */
	StackedBarMicroChartRenderer.render = function (oRm, oControl) {
		var aChartData = oControl._calculateChartData();

		if (!oControl._bThemeApplied) {
			return;
		}
		this._aBars = oControl.getAggregation("bars");
		oRm.write("<div");
		oRm.writeControlData(oControl);
		if (oControl.hasListeners("press")) {
			oRm.writeAttribute("tabindex", "0");
			oRm.addClass("sapSuiteUiMicroChartPointer");
		}
		oRm.addClass("sapSuiteStackedMC");
		oRm.addClass("sapSuiteStackedMCSize" + oControl.getSize());
		oRm.writeClasses();

		// tooltip and aria label
		var sTooltip = oControl._getTooltip(aChartData);
		if (sTooltip && typeof sTooltip === "string") {
			oRm.writeAttributeEscaped("title", sTooltip);
		}
		oRm.writeAttribute("role", "presentation");
		oRm.writeAttributeEscaped("aria-label", oControl._createTooltipText(aChartData));

		oRm.writeStyles();
		oRm.write(">");
		this._renderInnerContent(oRm, oControl, aChartData);
		oRm.write("</div>");
	};

	/**
	 * Renders the control's inner content, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 * @param {Object} chartData The calculated data needed for the chart to be displayed
	 */
	StackedBarMicroChartRenderer._renderInnerContent = function(oRm, oControl, chartData) {
		for (var i = 0; i < chartData.length; i++) {
			this._renderChartBar(oRm, oControl, chartData[i], i, i === chartData.length - 1);
		}
	};

	/**
	 * Renders the bar area for the given control.
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 * @param {Object} dataBar The calculated data needed for the bar to be displayed
	 * @param {int} index The index inside bars aggregation
	 * @param {Boolean} isLastBar Flag indicating if the current bar is the last bar inside bars aggregation
	 */
	StackedBarMicroChartRenderer._renderChartBar = function(oRm, oControl, dataBar, index, isLastBar) {
		var sColor;
		if (dataBar.width > 0) {
			oRm.write("<div");
			oRm.addClass("sapSuiteStackedMCBar");
			if (!isLastBar) {
				oRm.addClass("sapSuiteStackedMCBarNoLast");
			}
			if (!dataBar.color) {
				oRm.addStyle("background-color", "transparent");
			} else if (ValueColor[dataBar.color]) {
				oRm.addClass("sapSuiteStackedMCBarSemanticColor" + jQuery.sap.encodeHTML(dataBar.color));
				sColor = Parameters.get(this._getValueCssParameter(dataBar.color));
			} else {
				sColor = Parameters.get(dataBar.color);
				if (!sColor) {
					sColor = dataBar.color;
				}
				oRm.addStyle("background-color", jQuery.sap.encodeHTML(sColor));
			}
			oRm.addStyle("width", jQuery.sap.encodeHTML(dataBar.width + "%"));
			oRm.writeClasses();
			oRm.writeStyles();
			oRm.write(">");
			if (sColor) {
				this._renderChartBarLabel(oRm, oControl, dataBar.displayValue, sColor);
			}
			oRm.write("</div>");
		}
	};

	/**
	 * Renders the label text for the current bar area.
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.ui.core.Control} oControl The control to be rendered
	 * @param {String} displayValue The value that should be displayed
	 * @param {String} backgroundColor The background color of the current bar area
	 */
	StackedBarMicroChartRenderer._renderChartBarLabel = function(oRm, oControl, displayValue, backgroundColor) {
		if (!displayValue) {
			return;
		}
		oRm.write("<div");
		oRm.addClass("sapSuiteStackedMCBarLabel");
		oRm.writeClasses();
		oRm.addStyle("color", jQuery.sap.encodeHTML(this._getLabelColor(backgroundColor)));
		oRm.writeStyles();
		oRm.write(">");
		oRm.writeEscaped(displayValue);
		oRm.write("</div>");
	};

	/**
	 * Returns the color value of the label by calculating the data point color brightness
	 *
	 * @private
	 * @param {string} backgroundColor The background color
	 * @returns {string} The color of the label
	 */
	StackedBarMicroChartRenderer._getLabelColor = function(backgroundColor) {
		var sHexColor = this._colorNameToHex(backgroundColor);
		// convert 3-digit hexcolor to 6-digit first (e.g.: #abc -> #aabbcc)
		if (!sHexColor && backgroundColor.length === 4) {
			// concatenate each char after repeating it
			sHexColor = "#" + new Array(3).join(backgroundColor.substring(1, 2)) + new Array(3).join(backgroundColor.substring(2, 3)) + new Array(3).join(backgroundColor.substring(3, 4));
		} else if (!sHexColor) {
			sHexColor = backgroundColor;
		}
		var iRedValue = parseInt(sHexColor.substring(1, 3), 16),
			iGreenValue = parseInt(sHexColor.substring(3, 5), 16),
			iBlueValue = parseInt(sHexColor.substring(5, 7), 16);

		// apply the data point color brightness algorithm
		var fDataPoint = ((iRedValue * 299) + (iGreenValue * 587) + (iBlueValue * 114)) / 1000;
		if (fDataPoint > 127.5) {
			return StackedBarMicroChartRenderer.LABEL_COLOR_DARK;
		} else {
			return StackedBarMicroChartRenderer.LABEL_COLOR_LIGHT;
		}
	};

	/**
	 * Returns the color css parameter
	 *
	 * @private
	 * @param {string} color The bar color
	 * @returns {string} The css parameter
	 */
	StackedBarMicroChartRenderer._getValueCssParameter = function(color) {
		var sSemanticColor = this.SEMANTIC_COLORS[color] || color;
		return "sapUi" + sSemanticColor + "Element";
	};

	/**
	 * Converts a color keyword to its HEX color value.
	 *
	 * @private
	 * @param {string} color The css color name
	 * @returns {string} The css hex representation or undefined if the keyword cannot be found
	 */
	StackedBarMicroChartRenderer._colorNameToHex = function(color) {
		return StackedBarMicroChartRenderer.COLORNAME_TO_HEX_MAP[color];
	};

	return StackedBarMicroChartRenderer;

}, /* bExport= */ true);
