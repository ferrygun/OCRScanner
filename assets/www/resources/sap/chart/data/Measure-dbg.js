/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	"sap/ui/core/Element",
	"sap/chart/utils/ChartUtils",
	"sap/chart/data/MeasureSemantics"
], function(
	Element,
	ChartUtils,
	MeasureSemantics
) {
	"use strict";
	var _SUPPORTED_ROLE = {axis1:true,axis2:true,axis3:true,axis4:true};
	
	/**
	 * Constructor for a new ui5/data/Measure.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Definition of a single measure in a chart
	 * @extends sap.ui.core.Element
	 *
	 * @constructor
	 * @public
	 * @since 1.32.0
	 * @name sap.chart.data.Measure
	 */
	var Measure = Element.extend("sap.chart.data.Measure", {
		metadata: {
			library : "sap.chart",
			properties: {
				/**
				 * Property in the "data" model holding the raw measure value.
				 */
				name: {type: "string"},
				/**
				 * Label for the Measure, either as a string literal or by a pointer using the binding syntax to some property containing the label.
				 */
				label: {type: "string"},
				// Need to discuss behavior for these 2 properties
				/**
				 * Unit for the measure, a pointer using the binding syntax to some field containing the unit.
				 * Value of the given field from the same data record will be displayed after formatted measure value in data label, tooltip and chart popover.
				 * NOTE: If the unit field is not set as visible dimension in chart, or more than one unit value exists
				 * for any visible dimension value combination, it will be rendered in the chart as well but with different layout when the field is set as visible dimension..
				 */
				unitBinding: {type: "string"},
				/**
				 * A (core UI5) format pattern to be used by the formatter to format the measure value.
				 * @deprecated
				 * Please use {@link sap.chart.Chart#setVizProperties} to set related formatStrings instead.
				 *
				 */
				valueFormat: {type: "string", defaultValue: null},
				/**
				 * How values of measure will be rendered in the chart. Possible role values are "axis1", "axis2", "axis3", and "axis4".
				 * The default is "axis1".
				 * They correspond to the well-known concepts of axis identifiers in the Cartesian coordinate system, e.g. a Y-axis in a bar/column/line chart, an X- and a Y-axis in a scatter chart, or two Y-axes in bar charts, and an optional third axis for the weight/size/intensity/temperature of a data point.
				 *
				 * <b>NOTE:</b> Role definition would not work for Bullet Chart and users need to set semantics instead.
				 */
				role: {type: "string", defaultValue: "axis1"},
				/**
				 * The semantics of the measure.
				 *
				 * <b>NOTE:</b> Dimension-based coloring (see {@link sap.chart.Chart#setColorings}) does not work when semantics is set to {@link sap.chart.data.MeasureSemantics.Projected} or {@link sap.chart.data.MeasureSemantics.Reference} for visible measure(s).
				 *
				 * <b>NOTE:</b> In Bullet chart measure defined as "Reference" maps to targetValues and "Projected" maps to additionalValues. Measures without definition will be recognized as actualValues.
				 */
				semantics: {type: "sap.chart.data.MeasureSemantics", defaultValue: MeasureSemantics.Actual},
				/**
				 * Semantically related measures for a measure with semantics "actual" value. It is an object with two properties:
				 * <ol>
				 *   <li>"projectedValueMeasure" identifing the projected value measure, and</li>
				 *   <li>"referenceValueMeasure" identifing the reference value measure.</li>
				 * </ol>
				 */
				semanticallyRelatedMeasures: {type: "object", defaultValue: null}
			}
		}
	});

	Measure.prototype.setLabel = ChartUtils.makeNotifyParentProperty("label");
	var roleSetter = ChartUtils.makeNotifyParentProperty("role");
	Measure.prototype.setRole = function(sValue, bSuppressInvalidate) {
		if (!_SUPPORTED_ROLE[sValue]) {
			jQuery.error("Invalide Measure role: " + sValue);
		}
		return roleSetter.apply(this, arguments);
	};
	Measure.prototype.setUnitBinding = ChartUtils.makeNotifyParentProperty("unitBinding");
	Measure.prototype.setValueFormat = ChartUtils.makeNotifyParentProperty("valueFormat");
	Measure.prototype.setSemantics = ChartUtils.makeNotifyParentProperty("semantics");
	Measure.prototype.setSemanticallyRelatedMeasures = ChartUtils.makeNotifyParentProperty("semanticallyRelatedMeasures");
	Measure.prototype._getFixedRole = function() {
		return this._sFixedRole || this.getRole();
	};
	return Measure;
});
