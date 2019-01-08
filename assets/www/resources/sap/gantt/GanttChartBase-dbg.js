/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	'jquery.sap.global', './library', 'sap/ui/core/Control',
	"./misc/Utility", "./config/TimeHorizon"
], function (jQuery, library, Control, Utility, TimeHorizon) {
	"use strict";

	/**
	 * Creates and initializes a new Gantt chart.
	 * 
	 * @param {string} [sId] ID for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * Base class for all Gantt charts.
	 * 
	 * <p>This base class defines:
	 * <ul>
	 * 		<li>Basic properties and aggregations.</li>
	 * 		<li>Metadata required integrate with GanttChartContainer.</li>
	 * </ul>
	 * sap.gantt provides two basic implementations of <code>GanttChartBase</code>:
	 * <ul>
	 * 		<li><code>sap.gantt.GanttChart</code> - A chart area that contains rows along the vertical axis and a time scale along the horizontal axis.</li>
	 * 		<li><code>sap.gantt.GanttChartWithTable</code> - A tree table and a chart area separated by a splitter with rows synchronized.</li>
	 * </ul>
	 * </p>
	 * 
	 * <p>A number of <code>get</code> and <code>select</code> functions in this class use the row ID, row UI ID (UID), shape ID, or shape UID as the input to identify the objects to 
	 * select or retrieve.
	 * 
	 * A row UID comprises the following parts:
	 * <ul>
	 * 		<li>Row ID: Identifier of a specific row. In most cases, this ID is specified in your data model, for example: 0001. The system generates a 
	 * random ID for a row if you do not specify the row ID.</li>
	 * 		<li>Row path: Represents the ID hierarchy in a tree structure. For example, if a tree has a three-level hierarchy, the row path 
	 * follows this pattern: Level_1_row_id|level_2_row_id|level_3_row_id</li>
	 * 		<li>Scheme: Chart scheme which is configured in shape configuration. The scheme controls what kind of shapes are shown in a row.</li>
	 * </ul>
	 * Row UID pattern: PATH:row_id|SCHEME:chart_scheme_key[index]
	 * 
	 * A shape UID comprises the following parts:
	 * <ul>
	 * 		<li>Row UID: UID of the row where the shape is located.</li>
	 * 		<li>Shape data name: Key of the shape in the data model. For example: DATA:activity_greedy</li>
	 * 		<li>Shape ID: Identifier of a specific shape. In most cases, this ID is specified in your data model. The system generates a 
	 * random ID for a shape if you do not specify the shape ID.</li>
	 * </ul>
	 * Row UID pattern: PATH:row_id|SCHEME:chart_scheme_key[index]|DATA:shape_data_name[shape_id]
	 * 
	 * Note that you do not need to specify the UID for a shape or row. Gantt  Chart automatically forms the UIDs for shapes or rows.
	 * </p>
	 * 
	 * @extends sap.ui.core.Control
	 * @abstract
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.GanttChartBase
	 */
	var GanttChartBase = Control.extend("sap.gantt.GanttChartBase", /** @lends sap.gantt.GanttChartBase.prototype */ {
		metadata: {
			"abstract": true,
			library: "sap.gantt",
			
			properties: {
				
				/**
				 * Width of the control.
				 */
				width: {type: "sap.ui.core.CSSSize", defaultValue: "100%"},
				
				/**
				 * Height of the control.
				 */
				height: {type: "sap.ui.core.CSSSize", defaultValue: "100%"},
				
				/**
				 * Switch to show and hide the cursor line that follows the cursor.
				 */
				enableCursorLine: {type: "boolean", defaultValue: true},
				
				/**
				 * Switch to show and hide the present time indicator
				 */
				enableNowLine: {type: "boolean", defaultValue: true},
				
				/**
				 * Switch to show and hide vertical lines representing intervals along the time axis
				 */
				enableVerticalLine: {type: "boolean", defaultValue: true},

				/**
				 * Switch to show and hide adhoc lines representing milestones and events along the time axis
				 */
				enableAdhocLine: {type: "boolean", defaultValue: true},

				/**
				 * Switch to show or hide the start time and end time of a shape when you drag it along the time line
				 */
				enableShapeTimeDisplay: {type: "boolean", defaultValue: false},

				/**
				 * Zoom level in float.
				 * 
				 * This property allows application developers to control the zoom level. 
				 * When GanttChart is embedded in <code>sap.gantt.GanttChartContainer</code>, you do not have to manage this property.
				 * @deprecated As of version 1.44, please use sap.gantt.axistime.AxisTimeStrategy to change the zoom rate
				 */
				timeZoomRate: {type: "float", defaultValue: 1},
				
				/**
				 * Current mode of the Gantt chart.
				 * 
				 * If no value is provided, GanttChart uses a default mode key.
				 */
				mode: {type: "string", defaultValue: sap.gantt.config.DEFAULT_MODE_KEY},

				/**
				 * Selection mode for GanttChart
				 * 
				 * This property controls whether multiToggle or multi-selection mode is enabled for the tree table and
				 * for shapes. It may also affect the visual appearance, such as whether check boxes are available for selection.
				 * From version 1.40 to upper versions, multi is replaced by multiToggle selection mode in tree table
				 * @deprecated Please use <code>tableProperties</code>(e.g. <code>setTableproperties({selectionMode: "None"})</code>)
				 * to control table selection mode, and <code>shapeSelectionMode</code>(e.g. <code>setShapeSelectionMode("None")</code>)
				 * to control shape selection mode.
				 */
				selectionMode: {type : "sap.gantt.SelectionMode", defaultValue : sap.gantt.SelectionMode.MultiWithKeyboard},

				/**
				 * Selection mode for shape
				 * 
				 * This property controls 4 shape selection modes(MultiWithKeyboard, Multiple, Single, None).
				 * You can use <code>setShapeSelectionMode("None")</code> to set shape selection mode.
				 */
				shapeSelectionMode: {type : "sap.gantt.SelectionMode", defaultValue : sap.gantt.SelectionMode.MultiWithKeyboard},

				/**
				 * If the implementation contains a selection panel, this is the initial width.
				 * 
				 * In the current library, <code>sap.gantt.GanttChart</code> does not have a selection panel. 
				 * <code>sap.gantt.GanttChart</code> has a selection panel implemented by <code>sap.ui.table.TreeTable</code>.
				 */
				selectionPanelSize: {type: "sap.ui.core.CSSSize", defaultValue: "30%"},
				
				/**
				 * Current hierarchy key referencing from configuration property <code>hierarchies</code>.
				 * 
				 * If <code>source select group</code> is enabled in the Gantt chart toolbar, the current hierarchy name referenced from <code>hierarchies</code>
				 * by this property is shown.
				 * For applications that do not require this function, this property can be ignored and a default value is used.
				 */
				hierarchyKey: {type: "string", defaultValue: sap.gantt.config.DEFAULT_HIERARCHY_KEY},
				
				baseRowHeight: {type : "int", group : "Appearance", defaultValue : null},

				/**
				 * SVG reusable element definitions.
				 * 
				 * If this property is provided, the paint server definition of the SVG is rendered. Method <code>getDefString()</code> should be
				 * implemented by all paint server classes that are passed in in this property.
				 * We recommend that you set the type of this argument to <code>sap.gantt.def.SvgDefs</code>. Otherwise some properties you set may not function properly.
				 */
				svgDefs: {type: "object", defaultValue: null},

				/**
				 * Configuration of the time axis.
				 *
				 * @deprecated As of version 1.44, replaced by aggregation 'axisTimeStrategy'.
				 * Planning horizon, initial horizon, and zoom level can be configured with this property. If not provided, a default
				 * configuration is provided.
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.TimeAxis</code>. Otherwise some properties you set may not function properly.
				 */
				timeAxis: {type: "object", defaultValue: sap.gantt.config.DEFAULT_TIME_AXIS},
				
				/**
				 * Configuration of available modes.
				 *
				 * List of available modes. To apply modes to toolbar and shapes, further configuration is needed. If not provided, a default
				 * configuration is provided.
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.Mode[]</code>. Otherwise some properties you set may not function properly.
				 */
				modes: {type: "object[]", defaultValue: sap.gantt.config.DEFAULT_MODES},
				
				/**
				 * Configuration of toolbar schemes.
				 *
				 * List of available toolbar schemes. If not provided, a default configuration is provided.
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.ToolbarScheme[]</code>. Otherwise some properties you set may not function properly.
				 */
				toolbarSchemes: {type: "object[]", defaultValue: sap.gantt.config.DEFAULT_GANTTCHART_TOOLBAR_SCHEMES},
				
				/**
				 * Configuration of hierarchies.
				 *
				 * List of available hierarchies. If not provided, a default configuration is provided.
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.Hierarchy[]</code>. Otherwise some properties you set may not function properly.
				 */
				hierarchies: {type: "object[]", defaultValue: sap.gantt.config.DEFAULT_HIERARCHYS},
				
				/**
				 * Configuration of object types.
				 *
				 * List of available object types. If not provided, a default configuration is provided.
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.ObjectType[]</code>. Otherwise some properties you set may not function properly.
				 */
				objectTypes: {type: "object[]", defaultValue: sap.gantt.config.DEFAULT_OBJECT_TYPES},
				
				/**
				 * Configuration of chart schemes.
				 *
				 * List of available chart schemes. If not provided, a default configuration is provided.
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.ChartScheme[]</code>. Otherwise some properties you set may not function properly.
				 */
				chartSchemes: {type: "object[]", defaultValue: sap.gantt.config.DEFAULT_CHART_SCHEMES},

				/**
				 * Configuration of locale settings.
				 *
				 * Most locale settings can be configured in sap.ui.configuration objects. Only the time zone and day-light-saving time option
				 * are provided by locale settings.
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.Locale</code>. Otherwise some properties you set may not function properly.
				 */
				locale: {type: "object", defaultValue: sap.gantt.config.DEFAULT_LOCALE_CET},

				/**
				 * Configuration of shape data names and the attribute in raw data that serves as 'id'.
				 * 
				 * This property value should be an array, either an array of string, each string represents one available shape data name, or an array of object, each object specifies the shape data name
				 * and data attribute that will serves as 'id'.
				 * This configuration must be provided if SVG graphics are needed.
				 */
				shapeDataNames: {type: "sap.gantt.GenericArray", defaultValue: []},

				/**
				 * Configuration of shape data against shape classes.
				 *
				 * List of available shapes. The shapes configured in this list are initialized inside <code>sap.gantt.GanttChartBase</code>.
				 * Note that for JSON data binding, this configuration supports deep structured data structures. For ODATA binding, only one level is supported.
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.Shape[]</code>. Otherwise some properties you set may not function properly.
				 */
				shapes: {type: "object[]", defaultValue: []},

				/**
				 * Specifies on which layer adhoc lines reside. By default, adhoc lines are on top of all other shapes and patterns.
				 */
				adhocLineLayer: {type: "string", defaultValue: sap.gantt.AdhocLineLayer.Top},

				/**
				 * Exposed properties from TreeTable
				 */
				tableProperties: {type: "object", defaultValue: {}},

				/**
				 * Defines how to adjust the relative position between a draggable shape and the mouse pointer.
				 */
				ghostAlignment: {type: "string", defaultValue: sap.gantt.dragdrop.GhostAlignment.None}

			},

			aggregations: {

				/**
				 * Rows of <code>sap.gantt.GanttChartBase</code>
				 *
				 * This aggregation is delegated to <code>sap.gantt.table.TreeTable</code>. Rows are provide a base for
				 * shapes with a category of <code>"InRowShape"</code>. The configuration in property <code>shapes</code>
				 * determines how the shapes are drawn.
				 */
				rows: {type: "sap.ui.core.Control", multiple: true, singularName: "row", bindable: "bindable", visibility: "public"},
					
				/**
				 * Relationships of shapes carried by rows.
				 *
				 * Similar to rows, this aggregation does not request templates either. Relationships are a special shape with a category of 
				 * <code>"crossRowShape"</code>. How relationships are drawn is also specified in configuration property <code>shapes</code>.
				 */
				relationships: {type: "sap.ui.core.Control", multiple: true, bindable: "bindable", visibility: "public"},

				/**
				 * Paint servers consumed by special shape <code>sap.gantt.shape.cal.Calendar</code>.
				 *
				 * This aggregation is designed to improve performance of calendar shapes. Rows usually share a similar definition with calendar shapes.
				 * It is possible to define a Calendar paint server to draw only one rectangle for each row. Notes for classes extended from
				 * <code>sap.gantt.def.cal.CalendarDef</code>: Different from property <code>paintServerDefs</code>, paint servers defined here must
				 * implement method <code>getDefNode()</code> instead of method <code>getDefString()</code>.
				 */	
				calendarDef: {type: "sap.gantt.def.cal.CalendarDefs", multiple: false, bindable: "bindable", visibility: "public"},
				/**
				 * This aggregation controls the zoom strategies and zoom rate in Gantt Chart.
				 */
				axisTimeStrategy: {type: "sap.gantt.axistime.AxisTimeStrategyBase", multiple: false, bindable: "bindable", visibility: "public"},

				/**
				 * The aggregation is used to store configuration of adhoc lines, adhoc lines represent milestones and events in axis time.
				 */
				adhocLines: {type: "sap.gantt.AdhocLine", multiple: true, singularName: "adhocLine", bindable: "bindable", visibility: "public"}
			},
			
			events: {
				
				/**
				 * Event fired when the hierarchy key has changed in the Gantt chart toolbar.
				 */
				ganttChartSwitchRequested: {
					parameters: {
						/**
						 * Target hierarchy key.
						 */
						hierarchyKey: {type: "string"}
					}
				},
				
				/**
				 * Splitter (if exists) resized.
				 *
				 * If a splitter exists and synchronization is needed with other Gantt charts in the container, use this event. 
				 * You can listen for this event and obtain <code>zoomInfo</code>.
				 *
				 */
				splitterResize: {
					parameters : {
						/**
						 * ID of the source control.
						 */
						id : {type : "string"},

						/**
						 * Old size in the form of [height, width].
						 */
						oldSizes : {type : "int[]"},

						/**
						 * New size in the form of [height, width].
						 */
						newSizes : {type : "int[]"},

						/**
						 * Zoom information.
						 *
						 * This object contains all related information for the listener to get the current zoom level of the time axis.
						 * Usually <code>zoomInfo</code> contains the following information:
						 * <ul>
						 * 	<li><code>"base"</code> - Base for zooming calculation.
						 *		<ul>
						 * 			<li><code>"sGranularity"</code>: "4day", - Zoom level that is used to calculate the zoom base; it is taken from timeAxis.granularity.</li>
						 * 			<li><code>"fScale"</code>: 3840000 - Base scale determined by zoomStrategy level and now().</li>
						 * 		</ul>
						 * 	</li>
						 * 	<li><code>"determinedByConfig"</code> - Zoom level calculated by configuration <code>timeAxis</code>.
						 * 		<ul>
						 * 			<li><code>"fRate"</code>: 1, - Zoom rate determined by configuration timeAxis.granularity.</li>
						 * 			<li><code>"fMaxRate"</code>: 384, - Maximum zoom rate determined by configuration timeAxis.finestGranularity.</li>
						 * 			<li><code>"fMinRate"</code>: 0.02197802197802198 - Minimum zoom rate determined by configuration timeAxis.coarsestGranularity.</li>
						 * 		</ul>
						 * 	</li>
						 * 	<li><code>"determinedByChartWidth"</code> - Zoom level calculated by the SVG width.
						 * 		<ul>
						 * 			<li><code>"fMinRate"</code>: 0.0279009617614573, - Minimum zoom rate determined by the chart width and configuration timeAxis.planHorizon.</li>
						 * 			<li><code>"fSuitableRate"</code>: 0.5078804440909039 - Suitable zoom rate determined by the chart width and configuration timeAxis.initHorizon.</li>
						 * 		</ul>					 
						 * 	</li>
						 * 	<li><code>iChartWidth</code>: 417 - Chart width in pixel.</li>
						 * </ul>
						 */
						zoomInfo: {type: "object"}
					}
				},

				/**
				 * Horizontal (time axis) scroll.
				 *
				 * If the horizontal scroll bar exists and synchronization is needed with other Gantt charts in the container, use this event. 
				 * @deprecated As of version 1.44
				 */
				horizontalScroll: {
					parameters: {
						/**
						 * Scroll steps.
						 */
						scrollSteps: {type: "int"},
						/**
						 * The start time of Gantt Chart visible area when the event fired
						 */
						startTime: {type: "string"},
						/**
						 * The end time of Gantt Chart visible area when the event fired
						 */
						endTime: {type: "string"}
					}
				},

				/**
				 * Vertical (row axis) scroll.
				 *
				 * If the vertical scroll bar exists and synchronization is needed with other Gantt charts in the container, use this event. 
				 * @deprecated As of version 1.44
				 */
				verticalScroll: {
					parameters: {
						/**
						 * Scroll steps.
						 */
						scrollSteps: {type: "int"}
					}
				},

				/**
				 * Event is fired when a mouse-hover occurs in the graphic part.
				 */
				chartMouseOver: {
					parameters: {
						/**
						 * Row object information of the current mouse point.
						 */
						objectInfo: {type: "object"},

						/**
						 * Leading row object information. null when it is the main row at current mouse point; main row information if it is one of multiple expanded rows.
						 */
						leadingRowInfo: {type: "object"},

						/**
						 * Timestamp of the current mouse point.
						 */
						timestamp: {type: "string"},

						/**
						 * ID of SVG.
						 */
						svgId: {type: "string"},

						/**
						 * [x, y] Coordinate of the current mouse point in the SVG coordinate system.
						 */
						svgCoordinate: {type: "int[]"},

						/**
						 * Effective mode. It can be the current Gantt Chart mode or the mode derived from the chart scheme mode.
						 */
						effectingMode: {type: "string"},

						/**
						 * Original JQuery event object.
						 */
						originEvent: {type: "object"}
					}
				},

				/**
				 * Event fired when the chart is clicked
				 */
				chartClick: {
					parameters:{
						/**
						 * Row object information of the current mouse point.
						 */
						objectInfo: {type: "object"},

						/**
						 * Leading row object information. null when it is the main row at current mouse point; main row information if it is one of multiple expanded rows.
						 */
						leadingRowInfo: {type: "object"},

						/**
						 * Timestamp of the current mouse point.
						 */
						timestamp: {type: "string"},

						/**
						 * ID of SVG.
						 */
						svgId: {type: "string"},

						/**
						 * [x, y] Coordinate of the current mouse point in the SVG coordinate system.
						 */
						svgCoordinate: {type: "int[]"},

						/**
						 * Effective mode. It can be the current Gantt Chart mode or the mode derived from the chart scheme mode.
						 */
						effectingMode: {type: "string"},

						/**
						 * Original JQuery event object.
						 */
						originEvent: {type: "object"}
					}
				},

				/**
				 * Event fired when the chart is double-clicked
				 */
				chartDoubleClick: {
					parameters:{
						/**
						 * Row object information of the current mouse point.
						 */
						objectInfo: {type: "object"},

						/**
						 * Leading row object information. null when it is the main row at current mouse point; main row information if it is one of multiple expanded rows.
						 */
						leadingRowInfo: {type: "object"},

						/**
						 * Timestamp of the current mouse point.
						 */
						timestamp: {type: "string"},

						/**
						 * ID of SVG.
						 */
						svgId: {type: "string"},

						/**
						 * [x, y] Coordinate of the current mouse point in the SVG coordinate system.
						 */
						svgCoordinate: {type: "int[]"},

						/**
						 * Effective mode. It can be the current Gantt Chart mode or the mode derived from the chart scheme mode.
						 */
						effectingMode: {type: "string"},

						/**
						 * Original JQuery event object.
						 */
						originEvent: {type: "object"}
					}
				},

				/**
				 * Event fired when the chart is right-clicked
				 */
				chartRightClick: {
					parameters:{
						/**
						 * Row object information of the current mouse point.
						 */
						objectInfo: {type: "object"},

						/**
						 * Leading row object information. null when it is the main row at current mouse point; main row information if it is one of multiple expanded rows.
						 */
						leadingRowInfo: {type: "object"},

						/**
						 * Timestamp of the current mouse point.
						 */
						timestamp: {type: "string"},

						/**
						 * ID of SVG.
						 */
						svgId: {type: "string"},

						/**
						 * [x, y] Coordinate of the current mouse point in the SVG coordinate system.
						 */
						svgCoordinate: {type: "int[]"},

						/**
						 * Effective mode. It can be the current Gantt Chart mode or a mode derived from the chart scheme mode.
						 */
						effectingMode: {type: "string"},

						/**
						 * Original JQuery event object.
						 */
						originEvent: {type: "object"}
					}
				},
				
				//Be used in Gantt to handle dragging shapes between different ganttCharts
				chartDragEnter: {
					parameters: {
						originEvent: {type: "object"}
					}
				},
				
				//Be used in Gantt to handle dragging shapes between different ganttCharts
				chartDragLeave: {
					parameters: {
						originEvent: {type: "object"},
						draggingSource: {type: "object"}
					}
				},
				
				/**
				 * Event fired when the selection status of rows changes.
				 */
				rowSelectionChange: {
					parameters: {
						/**
						 * Original JQuery event object.
						 */
						originEvent: {type: "object"}
					}
				
				},
				
				/**
				 * Event fired when the selection status of relationships changes.
				 */
				relationshipSelectionChange: {
					parameters: {
						/**
						 * Original JQuery event object.
						 */
						originEvent: {type: "object"}
					}
				},
				
				/**
				 * Event fired when the selection status of shapes changes.
				 */
				shapeSelectionChange: {
					parameters: {
						/**
						 * Original JQuery event object.
						 */
						originEvent: {type: "object"}
					}
				},
				
				/**
				 * Event fired when a drag-and-drop occurs on one or more selected shapes.
				 */
				shapeDragEnd: {
					parameters: {
						/**
						 * Original JQuery event object.
						 */
						originEvent: {type: "object"},

						/**
						 * List of source shape data.
						 */
						sourceShapeData: {type: "object[]"},

						/**
						 * Source SVG ID.
						 */
						sourceSvgId: {type: "string"},

						/**
						 * Information about the drop position and target row. It contains the following properties:
						 * <ul>
						 * 		<li>shapeTimestamp
						 * 		startTime and endTime of a dropped shape.
						 * 		This property is added to support the newly introduced drag-and-drop behaviors.
						 * 		For more information, see <code>sap.gantt.dragdrop.GhostAlignment</code>.
						 * 		</li>
						 * 		<li>cursorTimestamp
						 * 		Cursor timestamp when a shape is dropped.
						 * 		This property is added to support the newly introduced drag-and-drop behaviors.
						 * 		For more information, see <code>sap.gantt.dragdrop.GhostAlignment</code>.
						 * 		</li>
						 * 		<li>mode
						 * 		Mode of the current view.
						 * 		</li>
						 * 		<li>objectInfo
						 * 		Data of the row where you dropped the shape.
						 * 		</li>
						 * </ul>
						 * Note: The original property 'mouseTimestamp', which contains the startTime/endTime of a
						 * dropped shape has been deprecated.
						 */
						targetData: {type: "object"},

						/**
						 * Target SVG ID.
						 */
						targetSvgId: {type: "string"}
					}
				},

				/**
				 * Event fired when toggle node of the tree table.
				 */
				treeTableToggleEvent: {
					parameters: {
						/**
						 * The index of the expanded/collapsed row.
						 */
						rowIndex: {type: "int"},
						/**
						 * The binding context of the selected row.
						 */
						rowContext: {type: "object"},
						/**
						 * flag whether the node has been expanded or collapsed.
						 */
						expanded: {type: "boolean"}
					}
				},

				/**
				 * Event fired when a resizing occurs on a resized shape.
				 */
				shapeResizeEnd: {
					parameters: {
						/**
						 * UID of the resized shape.
						 */
						shapeUid: {type: "string"},
						/**
						 * Row object of the resizing shape.
						 */
						rowObject: {type: "object"},
						/**
						 * Original shape time array, including the start time and end time.
						 */
						oldTime: {type: "string[]"},
						
						/**
						 * New shape time array, including the start time and end time.
						 */
						newTime: {type: "string[]"}
					}
				},

				/**
				 * Event fired when the following conditions are met:
				 * The 'enableHover' property of Shape is set to true.
				 * You hover the mouse on a shape and keep the mouse stationary for 500 millisecond or longer.
				 */
				shapeMouseEnter: {
					parameters: {
						/**
						 * The data of the shape which fires this event.
						 */
						shapeData: {type: "object"},
						/**
						 * The mouse position relative to the left edge of the document.
						 */
						pageX: {type: "int"},
						/**
						 * The mouse position relative to the top edge of the document.
						 */
						pageY: {type: "int"},
						/**
						 * Original JQuery event object.
						 */
						originEvent: {type: "object"}
					}
				},

				/**
				 * Event fired when the following conditions are met:
				 * The 'enableHover' property of Shape is set to true.
				 * You move the mouse out of a shape and keep the mouse stationary for 500 millisecond or longer.
				 */
				shapeMouseLeave: {
					parameters: {
						/**
						 * The data of the shape which fires this event.
						 */
						shapeData: {type: "object"},
						/**
						 * Original JQuery event object.
						 */
						originEvent: {type: "object"}
					}
				}
			}
		}
	});

	// enable calling 'bindAggregation("rows")' without a factory
	GanttChartBase.getMetadata().getAllAggregations()["rows"]._doesNotRequireFactory = true;
	// enable calling 'bindAggrgation("rows")' without a factory
	GanttChartBase.getMetadata().getAllAggregations()["relationships"]._doesNotRequireFactory = true;

	/**
	 * Initializes the GanttChart instance after creation.
	 *
	 * @protected
	 */
	GanttChartBase.prototype.init = function () {
		this._iBaseRowHeight = undefined;
		
		// Exposed properties from TreeTable
		// These properties are exposed by both of GanttChart's TreeTable and GanttChartWithTable's TreeTable
		this.mDefaultTableProperties = {
			rowHeight: 33,
			threshold: 100,
			firstVisibleRow: 0,
			selectionMode: sap.ui.table.SelectionMode.MultiToggle
		};
	};

	/**
	 * Jumps to a given time.
	 * 
	 * This method sets the position of the visible area to a certain timestamp. It can be used to implement the function of
	 * Jump To First, Jump To Last, and Jump To Current.
	 * 
	 * A Redraw of SVG is triggered.
	 * 
	 * @name sap.gantt.GanttChartBase.prototype.jumpToPosition
	 * @function
	 * 
	 * @param {timestamp} vDate Accepted value is a 14-digit timestamp or a Date object.
	 * @public
	 */

	/**
	 * Provides the Ordinal Axis that is used to draw the SVG graphic.
	 *
	 * This method is intended to allow access to the ordinal axis. Do not change the ordinal axis.
	 * All subclasses must provide implementations.
	 *
	 * @name sap.gantt.GanttChartBase.prototype.getAxisOrdinal
	 * @function
	 *
	 * @return {sap.gantt.misc.AxisOrdinal} Returns the axis ordinal instance.
	 * @public
	 */

	/**
	 * Provides the Time Axis that is used to draw the SVG graphic.
	 *
	 * This method is intended to allow access to the time axis. Do not change the time axis.
	 * All subclasses must provide implementations.
	 *
	 * @name sap.gantt.GanttChartBase.prototype.getAxisTime
	 * @function
	 *
	 * @return {sap.gantt.misc.AxisTime} Returns the axis time instance.
	 * @public
	 */

	/**
	 * Selects shape data or row data by UI ID (UID).
	 *
	 * UID is generated by Gantt Chart to identify the appearance of shape data and row data. You can retrieve UIDs by certain events.
	 * The current implementation only supports shape selection by UID.
	 *
	 * @name sap.gantt.GanttChartBase.prototype.selectByUid
	 * @function
	 *
	 * @param {aUid} Array of the UIDs of the UI elements to be selected
	 * @public

	 * Gets the selected rows.
	 *
	 * @return {array} Row data of the selected rows
	 *
	 * @name sap.gantt.GanttChartBase.prototype.getSelectedRows
	 * @function
	 *
	 * @public
	 */

	/**
	 * Gets the selected rows, shapes, and relationships.
	 *
	 * @return {object} The returned object contains row data for all selected rows, shape data for all selected shapes, and relationship 
	 * data for all selected relationships.
	 *
	 * @name sap.gantt.GanttChartBase.prototype.getAllSelections
	 * @function
	 *
	 * @public
	 */

	/**
	 * Gets the shape data of the selected shapes.
	 *
	 * @return {array} Selected shapes. The returned structure is shown as below.
	 * {
	 *     "shapeDataName1": [oShapeData1, oShapeData2, ...]
	 *     "shapeDataName2": [oShapeData3, oShapeData3, ...]
	 *     ...
	 * }
	 *
	 * @name sap.gantt.GanttChartBase.prototype.getSelectedShapes
	 * @function
	 *
	 * @public
	 */

	/**
	 * Gets all the selected relationships.
	 *
	 * @return {array} selected relationships
	 *
	 * @name sap.gantt.GanttChartBase.prototype.getSelectedRelationships
	 * @function
	 *
	 * @public
	 */

	/**
	 * Gets a row object by the corresponding shape UID.
	 *
	 * @param {string} [sShapeUid] Shape UID
	 * @return {object} Row object
	 *
	 * @name sap.gantt.GanttChartBase.prototype.getRowByShapeUid
	 * @function
	 *
	 * @public
	 */

	/**
	 * Selects a group of shapes specified by the aId array. Alternatively, this function 
	 * deselects all selected shapes when aId is a null list and bExclusive is true.
	 *
	 * @param {array} [aId] List of the IDs of the shapes to select
	 * @param {boolean} [bExclusive] Whether or not to deselect all selected shapes when aId is null
	 * @return {sap.gantt.GanttChartBase} Gantt Chart instance
	 *
	 * @name sap.gantt.GanttChartBase.prototype.selectShapes
	 * @function
	 *
	 * @public
	 */

	/**
	 * Deselects a group of shapes specified by the aId array.
	 *
	 * @param {array} [aId] List of IDs of the shapes to deselect
	 * @return {sap.gantt.GanttChartBase} Gantt Chart instance
	 *
	 * @name sap.gantt.GanttChartBase.prototype.deselectShapes
	 * @function
	 *
	 * @public
	 */

	/**
	 * Selects rows and all shapes contained in those rows specified by an array of row IDs. Alternatively, this function 
	 * deselects all selected rows and shapes in those rows if the row ID array is null and bExclusive is true.
	 *
	 * @param {array} [aRowId] List of IDs of the rows to select
	 * @param {boolean} [bExclusive] Whether or not to deselect all selected rows and shapes when aRowId is null
	 * @return {sap.gantt.GanttChartBase} Gantt Chart instance
	 *
	 * @name sap.gantt.GanttChartBase.prototype.selectRowsAndShapes
	 * @function
	 *
	 * @public
	 */

	/**
	 * Selects a group of relationships specified by the aId array. Alternatively, this function 
	 * deselects all selected relationships if aId is a null list and bExclusive is true.
	 *
	 * @param {array} [aId] List of IDs of the relationships to select
	 * @param {boolean} [bExclusive] Whether or not to deselect all selected shapes when aId is null
	 * @return {sap.gantt.GanttChartBase} Gantt Chart instance
	 *
	 * @name sap.gantt.GanttChartBase.prototype.selectRelationships
	 * @function
	 *
	 * @public
	 */

	/**
	 * Deselects a group of relationships specified by the aId array.
	 *
	 * @param {array} [aId] List of IDs of the relationships to deselect
	 * @return {sap.gantt.GanttChartBase} Gantt Chart instance
	 *
	 * @name sap.gantt.GanttChartBase.prototype.deselectRelationships
	 * @function
	 *
	 * @public
	 */

	/**
	 * Selects a group of rows specified by the aId array.
	 *
	 * @param {array} [aId] List of IDs of the rows to select
	 * @param {boolean} [bExclusive] Whether or not to deselect all selected rows when aId is null
	 * @return {sap.gantt.GanttChartBase} Gantt Chart instance
	 * 
	 * @name sap.gantt.GanttChartBase.prototype.selectRows
	 * @function
	 * 
	 * @public
	 */

	/**
	 * Deselects a group of rows specified by the aId array.
	 *
	 * @param {array} [aId] List of the rows that you want to deselect
	 * @return {sap.gantt.GanttChartBase} Gantt Chart instance
	 *
	 * @name sap.gantt.GanttChartBase.prototype.deselectRows
	 * @function
	 *
	 * @public
	 */

	/**
	 * Expands the Gantt chart to the given level.
	 *
	 * @see sap.ui.table.TreeTable.expandToLevel
	 *
	 * @param {int} iLevel
	 *         Level to be expanded to
	 * @return {sap.gantt.GanttChartBase} Reference to the GanttChart control, which can be used for chaining
	 * 
	 * @name sap.gantt.GanttChartBase.prototype.expandToLevel
	 * @function
	 *
	 * @public
	 */

	/**
	 * Default event handler for the internal event expandChartChange from global TOOLBAR.
	 *
	 * @param {boolean} bExpanded expand or collapse the selected row
	 * @param {array} aChartSchemes bound chart scheme
	 * @param {array} aSelectedIndices user selected row indices
	 *
	 * @protected
	 */
	GanttChartBase.prototype.handleExpandChartChange = function(bExpanded, aChartSchemes, aSelectedIndices){

	};

	/**
	 * Notifies that the data source has changed.
	 * 
	 * @protected
	 */
	GanttChartBase.prototype.notifySourceChange = function(){

	};
	
	/**
	 * Utilize {@link sap.ui.Table}._setLargeDataScrolling method which 
	 * lets you control in which situation the <code>ScrollBar</code> fires scroll events.
	 * We can make this method public once sap.ui.Table._setLargeDataScrolling is public.
	 *
	 * @param {boolean} bLargeDataScrolling Set to true to let the <code>ScrollBar</code> only fires scroll events when
	 * the scroll handle is released. No matter what the setting is, the <code>ScrollBar</code> keeps on firing scroll events
	 * when the user scroll with the mousewheel or using touch
	 * @private
	 */
	GanttChartBase.prototype._setLargeDataScrolling = function(bLargeDataScrolling) {
		
	};

	/**
	 * get the keys for row data : id, type, which is configured when init gantt chart
	 * @return {object} indicate which attribute in raw rowData that serves as the purpose of 'id' and 'type'
	 * @private
	 */
	GanttChartBase.prototype._getConfiguredRowKeys = function(oBindingInfo) {
		if (!oBindingInfo) {
			oBindingInfo = this.getBindingInfo("rows");
		}
		var oRowConfiguredKeys;
		if (oBindingInfo && oBindingInfo.parameters) {
			oRowConfiguredKeys = oBindingInfo.parameters.gantt;
		}
		this._configuredRowKeys = {
				rowIdName : oRowConfiguredKeys && oRowConfiguredKeys.rowIdName ? oRowConfiguredKeys.rowIdName : "id",
				rowTypeName : oRowConfiguredKeys && oRowConfiguredKeys.rowTypeName ? oRowConfiguredKeys.rowTypeName : "type"
		};
		return this._configuredRowKeys;
	};

	GanttChartBase.prototype.getRowIdName = function() {
		if (!this._configuredRowKeys) {
			this._getConfiguredRowKeys();
		}
		return this._configuredRowKeys.rowIdName;
	};

	GanttChartBase.prototype.getRowTypeName = function() {
		if (!this._configuredRowKeys) {
			this._getConfiguredRowKeys();
		}
		return this._configuredRowKeys.rowTypeName;
	};
	
	GanttChartBase.prototype.getRlsIdName = function() {
		if (!this._configuredRlsKeys) {
			this._getConfiguredRlsKeys();
		}
		return this._configuredRlsKeys.rlsIdName;
	};
	
	GanttChartBase.prototype._getConfiguredRlsKeys = function() {
		var	oBindingInfo = this.getBindingInfo("relationships");
		var oConfiguredRlsKeys;
		if (oBindingInfo && oBindingInfo.parameters) {
			oConfiguredRlsKeys = oBindingInfo.parameters.gantt;
		}
		this._configuredRlsKeys = {
				rlsIdName : oConfiguredRlsKeys && oConfiguredRlsKeys.rlsIdName ? oConfiguredRlsKeys.rlsIdName : "id"
		};
		return this._configuredRlsKeys;
	};

	/**
	 * Wrap the selector of a dom element to the Attribute Equeal Selector, which can work fine even if the ID of the
	 * Gantt has some invalid character like colons "::".
	 * @param {string} sSuffix the ID suffix to get a dom object for
	 * @return {string} The wrapped selector for the Dom
	 */
	GanttChartBase.prototype.getDomSelectorById = function(sSuffix) {
		var selector = Utility.attributeEqualSelector("id", sSuffix ? this.getId() + "-" + sSuffix : this.getId());
		return selector;
	};

	/**
	 * Set exposed TreeTable properties
	 * @param {Object} oProperties The object include some properties from TreeTable
	 * @return {sap.gantt.GanttChart|sap.gantt.GanttChartWithTable} Reference to this in order to allow method chaining
	 * @public
	 */
	GanttChartBase.prototype.setTableProperties = function (oProperties) {
		var oTableProperties = jQuery.extend({}, this.getProperty("tableProperties"));
		Object.keys(oProperties).forEach(function (sKey) {
			if (this.mDefaultTableProperties.hasOwnProperty(sKey)) {
				oTableProperties[sKey] = oProperties[sKey];
				this._oTT["set" + sKey[0].toUpperCase() + sKey.slice(1)](oProperties[sKey]);
			}
			else {
				jQuery.sap.log.warning('The TreeTable property of "' + sKey + '" is not exposed by Gantt');
			}
		}, this);
		this.setProperty("tableProperties", oTableProperties, true);
		return this;
	};

	/**
	 * Get exposed TreeTable properties
	 * @return {Object} The all exposed TreeTable properties
	 * @public
	 */
	GanttChartBase.prototype.getTableProperties = function () {
		var oTableProperties = this.getProperty("tableProperties");
		Object.keys(oTableProperties).forEach(function (sKey) {
			oTableProperties[sKey] = this._oTT["get" + sKey[0].toUpperCase() + sKey.slice(1)]();
		}, this);
		return oTableProperties;
	};

	/**
	 * Expands the row for the given row index in the selection panel
	 *
	 * @see sap.ui.table.Table.expand
	 *
	 * @param {int} iRowIndex
	 *         Index of the row to expand
	 * @return {sap.gantt.GanttChartBase} A reference to the GanttChartBase control, which can be used for chaining
	 * @public
	 */

	/**
	 * Collapses the row for the given row index in the selection panel
	 *
	 * @see sap.ui.table.Table.collapse
	 *
	 * @param {int} iRowIndex
	 *         index of the row to expand
	 * @return {sap.gantt.GanttChartBase} A reference to the GanttChartBase control, which can be used for chaining
	 * @public
	 */

	/**
	 * Gets the number of visible rows in the selection panel.
	 *
	 * @see sap.ui.table.Table.getVisibleRowCount
	 *
	 * @return {int} The first visible row index
	 * @public
	 */

	return GanttChartBase;
}, true);
