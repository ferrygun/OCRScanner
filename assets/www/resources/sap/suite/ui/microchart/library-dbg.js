/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

/**
 * Initialization Code and shared classes of library sap.suite.ui.microchart.
 */
sap.ui.define([
	'jquery.sap.global', 'sap/ui/core/library', 'sap/ui/core/Core', 'sap/m/library'
], function(jQuery, coreLibrary, Core, mLibrary) {
	"use strict";

	/**
	 * UI5 library: sap.suite.ui.microchart.
	 *
	 * @namespace sap.suite.ui.microchart
	 * @name sap.suite.ui.microchart
	 * @author SAP SE
	 * @version 1.52.4
	 * @public
	 */

	// delegate further initialization of this library to the Core
	sap.ui.getCore().initLibrary({
		name: "sap.suite.ui.microchart",
		version: "1.52.4",
		// library dependencies
		dependencies: ["sap.ui.core", "sap.m"],
		types: [
			"sap.suite.ui.microchart.AreaMicroChartViewType",
			"sap.suite.ui.microchart.BulletMicroChartModeType",
			"sap.suite.ui.microchart.CommonBackgroundType",
			"sap.suite.ui.microchart.ComparisonMicroChartViewType",
			"sap.suite.ui.microchart.LoadStateType"
		],
		interfaces: [],
		controls: [
			"sap.suite.ui.microchart.AreaMicroChart",
			"sap.suite.ui.microchart.BulletMicroChart",
			"sap.suite.ui.microchart.ColumnMicroChart",
			"sap.suite.ui.microchart.ComparisonMicroChart",
			"sap.suite.ui.microchart.DeltaMicroChart",
			"sap.suite.ui.microchart.HarveyBallMicroChart",
			"sap.suite.ui.microchart.LineMicroChart",
			"sap.suite.ui.microchart.InteractiveBarChart",
			"sap.suite.ui.microchart.InteractiveDonutChart",
			"sap.suite.ui.microchart.InteractiveLineChart",
			"sap.suite.ui.microchart.RadialMicroChart",
			"sap.suite.ui.microchart.StackedBarMicroChart"
		],
		elements: [
			"sap.suite.ui.microchart.AreaMicroChartPoint",
			"sap.suite.ui.microchart.AreaMicroChartItem",
			"sap.suite.ui.microchart.AreaMicroChartLabel",
			"sap.suite.ui.microchart.BulletMicroChartData",
			"sap.suite.ui.microchart.ColumnMicroChartData",
			"sap.suite.ui.microchart.ColumnMicroChartLabel",
			"sap.suite.ui.microchart.ComparisonMicroChartData",
			"sap.suite.ui.microchart.HarveyBallMicroChartItem",
			"sap.suite.ui.microchart.LineMicroChartPoint",
			"sap.suite.ui.microchart.LineMicroChartEmphasizedPoint",
			"sap.suite.ui.microchart.InteractiveBarChartBar",
			"sap.suite.ui.microchart.InteractiveDonutChartSegment",
			"sap.suite.ui.microchart.InteractiveLineChartPoint",
			"sap.suite.ui.microchart.StackedBarMicroChartBar"
		]
	});

	/**
	 * Enum of available views for the area micro chart concerning the position of the labels.
	 *
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 * @since 1.34
	 */
	sap.suite.ui.microchart.AreaMicroChartViewType = {

		/**
		 * The view with labels on the top and bottom.
		 * @public
		 */
		Normal: "Normal",

		/**
		 * The view with labels on the left and right.
		 * @public
		 */
		Wide: "Wide"

	};

	/**
	 * Defines if the horizontal bar represents a current value only or if it represents the delta between a current value and a threshold value.
	 *
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 * @since 1.34
	 */
	sap.suite.ui.microchart.BulletMicroChartModeType = {
		/**
		 * Displays the Actual value.
		 * @public
		 */
		Actual: "Actual",

		/**
		 * Displays delta between the Actual and Threshold values.
		 * @public
		 */
		Delta: "Delta"
	};

	/**
	 * Lists the available theme-specific background colors.
	 *
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 * @since 1.34
	 */
	sap.suite.ui.microchart.CommonBackgroundType = {
		/**
		 * The lightest background color.
		 * @public
		 */
		Lightest: "Lightest",

		/**
		 * Extra light background color.
		 * @public
		 */
		ExtraLight: "ExtraLight",

		/**
		 * Light background color.
		 * @public
		 */
		Light: "Light",

		/**
		 * Medium light background color.
		 * @public
		 */
		MediumLight: "MediumLight",

		/**
		 * Medium background color.
		 * @public
		 */
		Medium: "Medium",

		/**
		 * Dark background color.
		 * @public
		 */
		Dark: "Dark",

		/**
		 * Extra dark background color.
		 * @public
		 */
		ExtraDark: "ExtraDark",

		/**
		 * The darkest background color.
		 * @public
		 */
		Darkest: "Darkest",

		/**
		 * The transparent background color.
		 * @public
		 */
		Transparent: "Transparent"
	};

	/**
	 * Lists the views of the comparison micro chart concerning the position of titles and labels.
	 *
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 * @since 1.34
	 */
	sap.suite.ui.microchart.ComparisonMicroChartViewType = {
		/**
		 * Titles and values are displayed above the bars.
		 * @public
		 */
		Normal: "Normal",

		/**
		 * Titles and values are displayed in the same line with the bars.
		 * @public
		 */
		Wide: "Wide"
	};

	/**
	 * Contains available loading states.
	 *
	 * @deprecated Since 1.46
	 */
	sap.suite.ui.microchart.LoadStateType = {
		/**
		 * LoadableView is loading the control.
		 * @public
		 */
		Loading: "Loading",

		/**
		 * LoadableView has loaded the control.
		 * @public
		 */
		Loaded: "Loaded",

		/**
		 * LoadableView failed to load the control.
		 * @public
		 */
		Failed: "Failed",

		/**
		 * LoadableView disabled to load the control.
		 * @public
		 */
		Disabled: "Disabled"
	};

	sap.suite.ui.microchart._aStandardMarginClassNames = [
		"sapUiTinyMargin", "sapUiSmallMargin", "sapUiMediumMargin", "sapUiLargeMargin", "sapUiTinyMarginBeginEnd", "sapUiTinyMarginTopBottom", "sapUiSmallMarginBeginEnd",
		"sapUiSmallMarginTopBottom", "sapUiMediumMarginBeginEnd", "sapUiMediumMarginTopBottom", "sapUiLargeMarginBeginEnd", "sapUiLargeMarginTopBottom", "sapUiTinyMarginTop",
		"sapUiTinyMarginBottom", "sapUiTinyMarginBegin", "sapUiTinyMarginEnd", "sapUiSmallMarginTop", "sapUiSmallMarginBottom", "sapUiSmallMarginBegin", "sapUiSmallMarginEnd",
		"sapUiMediumMarginTop", "sapUiMediumMarginBottom", "sapUiMediumMarginBegin", "sapUiMediumMarginEnd", "sapUiLargeMarginTop", "sapUiLargeMarginBottom", "sapUiLargeMarginBegin",
		"sapUiLargeMarginEnd", "sapUiResponsiveMargin", "sapUiNoMargin", "sapUiNoMarginTop", "sapUiNoMarginBottom", "sapUiNoMarginBegin", "sapUiNoMarginEnd"
	];

	/**
	 * Checks if the chart is in the GenericTile.
	 * @param {Object} oChart The microchart control instance that has to be checked whether it is in the GenericTile.
	 * @returns {boolean} True if the chart is in a GenericTile, false if not.
	 * @private
	 */
	sap.suite.ui.microchart._isInGenericTile = function(oChart) {
		var oParent = oChart.getParent();
		if (!oParent) {
			return false;
		}
		if (oParent instanceof sap.m.TileContent || oParent instanceof sap.m.GenericTile) {
			if (oParent instanceof sap.m.TileContent) {
				if (this._isInGenericTile(oParent)) {
					return true;
				}
			}
			if (oParent instanceof sap.m.GenericTile) {
				return true;
			}
		} else if (this._isInGenericTile(oParent)) {
			return true;
		}
	};

	/**
	 * Removes all SAP standard margin classes from control.
	 * @param {Object} oChart The outer Chart instance wrapper
	 * @private
	 */
	sap.suite.ui.microchart._removeStandardMargins = function(oChart) {
		for (var i = 0; i < sap.suite.ui.microchart._aStandardMarginClassNames.length; i++) {
			if (oChart.hasStyleClass(sap.suite.ui.microchart._aStandardMarginClassNames[i])) {
				oChart.removeStyleClass(sap.suite.ui.microchart._aStandardMarginClassNames[i]);
			}
		}
	};

	/**
	 * Passes the parent container context to the child of the chart.
	 * @param {Object} oChart The microchart control instance that may have sapMargins as a custom style.
	 * @param {Object} oChildChart The inner Chart instance which gets the outer Chart instance wrapper instance context
	 * @private
	 */
	sap.suite.ui.microchart._passParentContextToChild = function(oChart, oChildChart) {
		if (oChart.data("_parentRenderingContext")) {
			oChildChart.data("_parentRenderingContext", oChart.data("_parentRenderingContext"));
		} else if (jQuery.isFunction(oChart.getParent)) {
			oChildChart.data("_parentRenderingContext", oChart.getParent());
		}
	};

	/**
	 * Tests if tooltip consists of empty characters. In such case the tooltip should be suppressed.
	 * @param {string} tooltip The string to be checked.
	 * @returns {boolean} True if the tooltip consists of only whitespace characters, false otherwise.
	 * @private
	 */
	sap.suite.ui.microchart._isTooltipSuppressed = function(tooltip) {
		return tooltip !== null && tooltip !== undefined && !tooltip.trim();
	};

	/**
	 * Checks the given control's visibility in a defined interval and calls the given callback function when the control becomes visible.
	 *
	 * @param {sap.ui.core.Control} control The control whose visibility is to be checked
	 * @param {function} callback The callback function to be called when the control becomes visible
	 * @private
	 */
	sap.suite.ui.microchart._checkControlIsVisible = function(control, callback) {
		function isControlVisible() {
			return control.getVisible() && control.getDomRef() && control.$().is(":visible") && control.getDomRef().getBoundingClientRect().width !== 0;
		}

		/**
		 * Checks the control's visibility in a defined interval
		 */
		function doVisibilityCheck() {
			if (isControlVisible()) {
				sap.ui.getCore().detachIntervalTimer(doVisibilityCheck);
				callback.call(control);
			}
		}

		var fnOriginalExit = control.exit;
		control.exit = function() {
			sap.ui.getCore().detachIntervalTimer(doVisibilityCheck);
			if (fnOriginalExit) {
				fnOriginalExit.call(control);
			}
		};

		if (isControlVisible()) {
			callback.call(control);
		} else {
			sap.ui.getCore().attachIntervalTimer(doVisibilityCheck);
		}
	};

	/**
	 * Checks whether the current theme is a high contrast theme like sap_belize_hcb or sap_belize_hcw.
	 * @returns {boolean} True if the theme name contains hcb or hcw, false if otherwise
	 * @private
	 */
	sap.suite.ui.microchart._isThemeHighContrast = function() {
		return /(hcw|hcb)/g.test(sap.ui.getCore().getConfiguration().getTheme());
	};

	/**
	 * Overrides the method 'getAccessibilityInfo' of the given MicroChart prototype.
	 *
	 * @param {Object} microChartPrototype The MicroChart's prototype
	 * @private
	 */
	sap.suite.ui.microchart._overrideGetAccessibilityInfo = function(microChartPrototype) {
		microChartPrototype.getAccessibilityInfo = function() {
			return {
				type: this._getAccessibilityControlType(),
				description: this.getTooltip_AsString()
			};
		};
	};

	return sap.suite.ui.microchart;
});
