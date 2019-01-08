sap.ui.define([
	"sap/ui/core/Element"
], function (Element) {
	"use strict";

	/**
	 * Creates and initializes a new AdhocLine class.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * The AdhocLine class contains properties to draw an additional vertical line at specific
	 * time points in the chart area. You can use this line to mark milestones, such as the
	 * start of a project start, and special events, such as holidays.
	 * 
	 * @extends sap.ui.core.Element
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.AdhocLine
	 */
	var AdhocLine = Element.extend("sap.gantt.AdhocLine", /** @lends sap.gantt.AdhocLine.prototype */{
		metadata: {
			library: "sap.gantt",
			properties: {
				/**
				 * Standard SVG 'stroke' attribute.
				 * See {@link http://www.w3.org/TR/SVG/painting.html#StrokeProperty SVG 1.1 specification for 'stroke'}.
				 * You can provide the stroke attribute with HTML colors and the URL reference to the paint server.
				 * Paint server definitions usually come from paint servers rendered by {@link sap.gantt.GanttChartContainer},
				 * {@link sap.gantt.GanttChartWithTable} or {@link sap.gantt.GanttChart}.
				 */
				stroke: {type : "sap.gantt.ValueSVGPaintServer"},

				/**
				 * Standard SVG 'stroke-width' attribute.
				 * See {@link http://www.w3.org/TR/SVG/painting.html#StrokeWidthProperty SVG 1.1 specification for 'stroke-width'}.
				 */
				strokeWidth: {type: "float", defaultValue: 1},

				/**
				 * Standard SVG 'stroke-dasharray' attribute.
				 * See {@link http://www.w3.org/TR/SVG/painting.html#StrokeWidthProperty SVG 1.1 specification for 'stroke-dasharray'}.
				 */
				strokeDasharray: {type: "string"},

				/**
				 * Standard SVG 'stroke-opacity' attribute.
				 * See {@link http://www.w3.org/TR/SVG11/painting.html#StrokeOpacityProperty SVG 1.1 specification for 'stroke-opacity'}.
				 */
				strokeOpacity: {type: "float", defaultValue: 1},
				//enableDnD: {type: "boolean", defaultValue: false},

				/**
				 * Time stamp of the adhoc line
				 */
				timeStamp: {type: "string"},

				/**
				 * Description of the time stamp
				 */
				description: {type: "string"}
			}
		}
	});

	return AdhocLine;
}, true);