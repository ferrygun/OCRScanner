/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

/**
 * Initialization Code and shared classes of library sap.suite.ui.commons.
 */
sap.ui.define(function () {
	"use strict";

	/**
	 * SAP UI library: sap.suite.ui.commons
	 *
	 * @namespace
	 * @name sap.suite.ui.commons
	 * @public
	 */


	// library dependencies
	// delegate further initialization of this library to the Core
	sap.ui.getCore().initLibrary({
		name: "sap.suite.ui.commons",
		dependencies: ["sap.ui.core", "sap.m"],
		types: [
			"sap.suite.ui.commons.BulletChartMode",
			"sap.suite.ui.commons.CommonBackground",
			"sap.suite.ui.commons.ComparisonChartView",
			"sap.suite.ui.commons.DeviationIndicator",
			"sap.suite.ui.commons.FacetOverviewHeight",
			"sap.suite.ui.commons.FrameType",
			"sap.suite.ui.commons.HeaderContainerView",
			"sap.suite.ui.commons.InfoTileSize",
			"sap.suite.ui.commons.InfoTileTextColor",
			"sap.suite.ui.commons.InfoTileValueColor",
			"sap.suite.ui.commons.LoadState",
			"sap.suite.ui.commons.MicroAreaChartView",
			"sap.suite.ui.commons.networkgraph.NodeShape",
			"sap.suite.ui.commons.networkgraph.LineType",
			"sap.suite.ui.commons.networkgraph.Orientation",
			"sap.suite.ui.commons.networkgraph.LineArrowPosition",
			"sap.suite.ui.commons.networkgraph.LineArrowOrientation",
			"sap.suite.ui.commons.networkgraph.NodePlacement",
			"sap.suite.ui.commons.networkgraph.NodeSize",
			"sap.suite.ui.commons.networkgraph.ElementStatus",
			"sap.suite.ui.commons.ProcessFlowConnectionLabelState",
			"sap.suite.ui.commons.ProcessFlowConnectionState",
			"sap.suite.ui.commons.ProcessFlowConnectionType",
			"sap.suite.ui.commons.ProcessFlowDisplayState",
			"sap.suite.ui.commons.ProcessFlowLaneState",
			"sap.suite.ui.commons.ProcessFlowNodeState",
			"sap.suite.ui.commons.ProcessFlowNodeType",
			"sap.suite.ui.commons.ProcessFlowZoomLevel",
			"sap.suite.ui.commons.SelectionState",
			"sap.suite.ui.commons.statusindicator.FillingType",
			"sap.suite.ui.commons.statusindicator.FillingDirectionType",
			"sap.suite.ui.commons.ThingGroupDesign",
			"sap.suite.ui.commons.TimelineAlignment",
			"sap.suite.ui.commons.TimelineAxisOrientation",
			"sap.suite.ui.commons.TimelineFilterType",
			"sap.suite.ui.commons.TimelineGroupType",
			"sap.suite.ui.commons.TimelineScrollingFadeout",
			"sap.suite.ui.commons.ValueStatus"
		],
		interfaces: [],
		controls: [
			"sap.suite.ui.commons.BulletChart",
			"sap.suite.ui.commons.BusinessCard",
			"sap.suite.ui.commons.ChartContainer",
			"sap.suite.ui.commons.ChartContainerContent",
			"sap.suite.ui.commons.ChartContainerToolbarPlaceholder",
			"sap.suite.ui.commons.ChartTile",
			"sap.suite.ui.commons.ColumnMicroChart",
			"sap.suite.ui.commons.ComparisonChart",
			"sap.suite.ui.commons.DateRangeScroller",
			"sap.suite.ui.commons.DateRangeSlider",
			"sap.suite.ui.commons.DateRangeSliderInternal",
			"sap.suite.ui.commons.DeltaMicroChart",
			"sap.suite.ui.commons.DynamicContainer",
			"sap.suite.ui.commons.FacetOverview",
			"sap.suite.ui.commons.FeedItemHeader",
			"sap.suite.ui.commons.FeedTile",
			"sap.suite.ui.commons.GenericTile",
			"sap.suite.ui.commons.GenericTile2X2",
			"sap.suite.ui.commons.HarveyBallMicroChart",
			"sap.suite.ui.commons.HeaderCell",
			"sap.suite.ui.commons.HeaderContainer",
			"sap.suite.ui.commons.InfoTile",
			"sap.suite.ui.commons.JamContent",
			"sap.suite.ui.commons.KpiTile",
			"sap.suite.ui.commons.LaunchTile",
			"sap.suite.ui.commons.LinkActionSheet",
			"sap.suite.ui.commons.MicroAreaChart",
			"sap.suite.ui.commons.MonitoringContent",
			"sap.suite.ui.commons.MonitoringTile",
			"sap.suite.ui.commons.networkgraph.Graph",
			"sap.suite.ui.commons.networkgraph.Node",
			"sap.suite.ui.commons.NewsContent",
			"sap.suite.ui.commons.NoteTaker",
			"sap.suite.ui.commons.NoteTakerCard",
			"sap.suite.ui.commons.NoteTakerFeeder",
			"sap.suite.ui.commons.NumericContent",
			"sap.suite.ui.commons.NumericTile",
			"sap.suite.ui.commons.PictureZoomIn",
			"sap.suite.ui.commons.ProcessFlow",
			"sap.suite.ui.commons.ProcessFlowConnection",
			"sap.suite.ui.commons.ProcessFlowConnectionLabel",
			"sap.suite.ui.commons.ProcessFlowLaneHeader",
			"sap.suite.ui.commons.ProcessFlowNode",
			"sap.suite.ui.commons.RepeaterViewConfiguration",
			"sap.suite.ui.commons.SplitButton",
			"sap.suite.ui.commons.statusindicator.StatusIndicator",
			"sap.suite.ui.commons.statusindicator.ShapeGroup",
			"sap.suite.ui.commons.statusindicator.Shape",
			"sap.suite.ui.commons.statusindicator.Rectangle",
			"sap.suite.ui.commons.statusindicator.Circle",
			"sap.suite.ui.commons.statusindicator.CustomShape",
			"sap.suite.ui.commons.statusindicator.PropertyThreshold",
			"sap.suite.ui.commons.statusindicator.DiscreteThreshold",
			"sap.suite.ui.commons.TargetFilter",
			"sap.suite.ui.commons.ThingCollection",
			"sap.suite.ui.commons.ThreePanelThingInspector",
			"sap.suite.ui.commons.ThreePanelThingViewer",
			"sap.suite.ui.commons.TileContent",
			"sap.suite.ui.commons.TileContent2X2",
			"sap.suite.ui.commons.Timeline",
			"sap.suite.ui.commons.TimelineFilterListItem",
			"sap.suite.ui.commons.TimelineItem",
			"sap.suite.ui.commons.UnifiedThingGroup",
			"sap.suite.ui.commons.UnifiedThingInspector",
			"sap.suite.ui.commons.VerticalNavigationBar",
			"sap.suite.ui.commons.ViewRepeater"
		],
		elements: [
			"sap.suite.ui.commons.BulletChartData",
			"sap.suite.ui.commons.ColumnData",
			"sap.suite.ui.commons.ColumnMicroChartLabel",
			"sap.suite.ui.commons.ComparisonData",
			"sap.suite.ui.commons.CountingNavigationItem",
			"sap.suite.ui.commons.FeedItem",
			"sap.suite.ui.commons.HarveyBallMicroChartItem",
			"sap.suite.ui.commons.HeaderCellItem",
			"sap.suite.ui.commons.MicroAreaChartItem",
			"sap.suite.ui.commons.MicroAreaChartLabel",
			"sap.suite.ui.commons.MicroAreaChartPoint",
			"sap.suite.ui.commons.TargetFilterColumn",
			"sap.suite.ui.commons.TargetFilterMeasureColumn"
		],
		version: "1.52.3",
		extensions: {
			flChangeHandlers: {
				"sap.suite.ui.commons.Timeline": "sap/suite/ui/commons/flexibility/Timeline"
			}
		}
	});

	/**
	 * Enumeration of possible BulletChart display modes.
	 *
	 * @enum {string}
	 * @public
	 * @deprecated Since version 1.34.
	 * Deprecated. sap.suite.ui.microchart.BulletMicroChartModeType should be used.
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.BulletChartMode = {

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
	 * Enumeration of possible theme specific background colors.
	 *
	 * @enum {string}
	 * @public
	 * @deprecated Since version 1.34.
	 * Deprecated. Moved to sapui5.runtime.
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.CommonBackground = {

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
		Darkest: "Darkest"

	};
	/**
	 * The view of the ComparisonChart.
	 *
	 * @enum {string}
	 * @public
	 * @deprecated Since version 1.34.
	 * Deprecated. sap.suite.ui.microchart.ComparisonMicroChartViewType should be used.
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.ComparisonChartView = {

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
	 * The marker for the deviation trend.
	 *
	 * @author SAP AG
	 * @enum {string}
	 * @public
	 * @deprecated Since version 1.34.
	 * Deprecated. Moved to sapui5.runtime.
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.DeviationIndicator = {

		/**
		 * The actual value is more than the target value.
		 * @public
		 */
		Up: "Up",

		/**
		 * The actual value is less than the target value.
		 * @public
		 */
		Down: "Down",

		/**
		 * No value.
		 * @public
		 */
		None: "None"

	};
	/**
	 * Enumeration of possible FacetOverview height settings.
	 *
	 * @enum {string}
	 * @public
	 * @deprecated Since version 1.32.
	 * Deprecated. Object page should be used instead.
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.FacetOverviewHeight = {

		/**
		 * Extra small height
		 * @public
		 */
		XS: "XS",

		/**
		 * Small height
		 * @public
		 */
		S: "S",

		/**
		 * Medium height
		 * @public
		 */
		M: "M",

		/**
		 * Large height
		 * @public
		 */
		L: "L",

		/**
		 * Extra Large height
		 * @public
		 */
		XL: "XL",

		/**
		 * Extra extra large height
		 * @public
		 */
		XXL: "XXL",

		/**
		 * Content based height
		 * @public
		 */
		Auto: "Auto",

		/**
		 * No value. The height of the control is defined by depricated height property.
		 * @public
		 */
		None: "None"

	};
	/**
	 * Enumeration of possible frame types.
	 *
	 * @enum {string}
	 * @public
	 * @deprecated Since version 1.34.
	 * Deprecated. Moved to openUI5.
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.FrameType = {

		/**
		 * The 1x1 frame type.
		 * @public
		 */
		OneByOne: "OneByOne",

		/**
		 * The 2x1 frame type.
		 * @public
		 */
		TwoByOne: "TwoByOne",

		/**
		 * The 2/3 frame type.
		 * @public
		 */
		TwoThirds: "TwoThirds",

		/**
		 * The Auto frame type that adjusts the size of the control to the content.
		 * @public
		 */
		Auto: "Auto"

	};
	/**
	 * The list of possible HeaderContainer views.
	 *
	 *
	 * @enum {string}
	 * @public
	 * @deprecated Since version 1.48.
	 * This control is deprecated since 1.48. Please use the equivalent sap.ui.core.Orientation.
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.HeaderContainerView = {

		/**
		 * The horizontal orientation of the control.
		 *
		 * @public
		 */
		Horizontal: "Horizontal",

		/**
		 * The vertical orientation of the control.
		 *
		 * @public
		 */
		Vertical: "Vertical"

	};
	/**
	 * Enumeration of possible PointTile size settings.
	 *
	 * @enum {string}
	 * @public
	 * @deprecated Since version 1.34.
	 * Deprecated. sap.m.InfoTileSize should be used.
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.InfoTileSize = {

		/**
		 * Extra small size.
		 * @public
		 */
		XS: "XS",

		/**
		 * Small size.
		 * @public
		 */
		S: "S",

		/**
		 * Medium size.
		 * @public
		 */
		M: "M",

		/**
		 * Large size.
		 * @public
		 */
		L: "L",

		/**
		 * The size of the tile depends on the device it is running on. It is large on desktop, medium on tablet and small on phone.
		 * @public
		 */
		Auto: "Auto"

	};
	/**
	 * Enumeration of possible InfoTile text color settings.
	 *
	 * @enum {string}
	 * @public
	 * @deprecated Since version 1.34.
	 * Deprecated. sap.m.InfoTileTextColor should be used.
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.InfoTileTextColor = {

		/**
		 * Positive InfoTile text color.
		 * @public
		 */
		Positive: "Positive",

		/**
		 * Critical InfoTile text color.
		 * @public
		 */
		Critical: "Critical",

		/**
		 * Negative InfoTile text color.
		 * @public
		 */
		Negative: "Negative"

	};
	/**
	 * Enumeration of possible InfoTile value color settings.
	 *
	 * @enum {string}
	 * @public
	 * @deprecated Since version 1.34.
	 * Deprecated. sap.m.InfoTileValueColor should be used.
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.InfoTileValueColor = {

		/**
		 * Neutral InfoTile value color.
		 * @public
		 */
		Neutral: "Neutral",

		/**
		 * Good InfoTile value color.
		 * @public
		 */
		Good: "Good",

		/**
		 * Critical InfoTile value color.
		 * @public
		 */
		Critical: "Critical",

		/**
		 * Error InfoTile value color.
		 * @public
		 */
		Error: "Error"

	};
	/**
	 * Enumeration of possible load states for LoadableView.
	 *
	 * @enum {string}
	 * @public
	 * @deprecated Since version 1.34.
	 * Deprecated. sap.m.LoadState should be used.
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.LoadState = {

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
	/**
	 * The list of possible MicroAreaChart views.
	 *
	 * @enum {string}
	 * @public
	 * @deprecated Since version 1.34.
	 * Deprecated. sap.suite.ui.microchart.AreaMicroChartViewType should be used.
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.MicroAreaChartView = {

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
	 * Shape of a node in a network graph.
	 *
	 * @enum {string}
	 * @public
	 */
	sap.suite.ui.commons.networkgraph.NodeShape = {
		/**
		 * Round shape with a text label below.
		 * @public
		 */
		Circle: "Circle",

		/**
		 * Rectangular shape with an optional list of attributes.
		 * @public
		 */
		Box: "Box"
	};

	/**
	 * Type of connector line used in the network graph.
	 *
	 * @enum {string}
	 * @public
	 */
	sap.suite.ui.commons.networkgraph.LineType = {
		/**
		 * Solid connector line.
		 * @public
		 */
		Solid: "Solid",

		/**
		 * Dashed connector line.
		 * @public
		 */
		Dashed: "Dashed",

		/**
		 * Dotted connector line.
		 * @public
		 */
		Dotted: "Dotted"
	};

	/**
	 * Type of node placement for Layered Algorithm.
	 * See {@link https://rtsys.informatik.uni-kiel.de/confluence/display/KIELER/KLay+Layered+Layout+Options#KLayLayeredLayoutOptions-nodePlacement}
	 *
	 * @enum {string}
	 * @public
	 */
	sap.suite.ui.commons.networkgraph.NodePlacement = {
		/**
		 * Minimizes the number of edge bends at the expense of the graph size.
		 * @public
		 */
		BrandesKoepf: "BrandesKoepf",

		/**
		 * Calculates the most optimal layout balance.
		 * @public
		 */
		LinearSegments: "LinearSegments",

		/**
		 * Minimizes the area taken by the graph at the expense of everything else.
		 * @public
		 */
		Simple: "Simple"
	};

	/**
	 * Semantic type of the node status.
	 *
	 * @enum {string}
	 * @public
	 */
	sap.suite.ui.commons.networkgraph.ElementStatus = {
		/**
		 * A standard node
		 * @public
		 */
		Standard: "Standard",

		/**
		 * A node type that communicates success.
		 * @public
		 */
		Success: "Success",

		/**
		 * A node type that communicates a warning.
		 * @public
		 */
		Warning: "Warning",

		/**
		 * A node type that communicates an error.
		 * @public
		 */
		Error: "Error"
	};

	/**
	 * Orientation of layered layout.
	 *
	 * @enum {string}
	 * @public
	 */
	sap.suite.ui.commons.networkgraph.Orientation = {
		/**
		 * The flow of the graph is left to right.
		 * @public
		 */
		LeftRight: "LeftRight",

		/**
		 * The flow of the graph is right to left.
		 * @public
		 */
		RightLeft: "RightLeft",

		/**
		 * The flow of the graph is top to bottom.
		 * @public
		 */
		TopBottom: "TopBottom"
	};

	/**
	 * Orientation of line's arrow
	 *
	 * @enum {string}
	 * @public
	 */
	sap.suite.ui.commons.networkgraph.LineArrowOrientation = {
		/**
		 * Orientation is from parent to child.
		 * @public
		 */
		ParentOf: "ParentOf",

		/**
		 * Orientation is from child to parent.
		 * @public
		 */
		ChildOf: "ChildOf",

		/**
		 * Arrow is hidden.
		 * @public
		 */
		None: "None"
	};

	/**
	 * Position of the arrow on a connector line.
	 *
	 * @enum {string}
	 * @public
	 */
	sap.suite.ui.commons.networkgraph.LineArrowPosition = {
		/**
		 * The arrow is placed at the beginning of the first line segment.
		 * @public
		 */
		Start: "Start",

		/**
		 * The arrow is placed in the middle of the last line segment. If the line has only one segment,
		 * the arrow appears in the middle of the line.
		 * @public
		 */
		Middle: "Middle",

		/**
		 * The arrow is placed at the end of the last line segment.
		 * @public
		 */
		End: "End"
	};

	/**
	 * Describes the state of a connection label.
	 *
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.ProcessFlowConnectionLabelState = {

		/**
		 * Neutral connection label.
		 * @public
		 */
		Neutral: "Neutral",

		/**
		 * Positive connection label.
		 * @public
		 */
		Positive: "Positive",

		/**
		 * Critical connection label.
		 * @public
		 */
		Critical: "Critical",

		/**
		 * Negative connection label.
		 * @public
		 */
		Negative: "Negative"

	};
	/**
	 * Describes the state of a connection.
	 *
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.ProcessFlowConnectionState = {

		/**
		 * Highlighted connection.
		 * @public
		 */
		Highlighted: "Highlighted",

		/**
		 * Dimmed connection.
		 * @public
		 */
		Dimmed: "Dimmed",

		/**
		 * Regular connection.
		 * @public
		 */
		Regular: "Regular",

		/**
		 * Selected connection.
		 * @public
		 */
		Selected: "Selected"

	};
	/**
	 * Describes the type of a connection.
	 *
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.ProcessFlowConnectionType = {

		/**
		 * Planned connection.
		 * @public
		 */
		Planned: "Planned",

		/**
		 * Normal connection.
		 * @public
		 */
		Normal: "Normal"

	};
	/**
	 * The ProcessFlow calculates the ProcessFlowDisplayState based on the 'focused' and 'highlighted' properties of each node.
	 *
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.ProcessFlowDisplayState = {

		/**
		 * The control is in the regular display state
		 * @public
		 */
		Regular: "Regular",

		/**
		 * The control is in the combination of regular and focused display state
		 * @public
		 */
		RegularFocused: "RegularFocused",

		/**
		 * The control is in highlighted display state
		 * @public
		 */
		Highlighted: "Highlighted",

		/**
		 * The control is in the combination of highlighted and focused display state
		 * @public
		 */
		HighlightedFocused: "HighlightedFocused",

		/**
		 * The control is in the dimmed state
		 * @public
		 */
		Dimmed: "Dimmed",

		/**
		 * The control is in the combination of dimmed and focused display state
		 * @public
		 */
		DimmedFocused: "DimmedFocused",

		/**
		 * The control is in the selected display state
		 * @public
		 */
		Selected: "Selected",

		/**
		 * The control is in the combination of selected and highlighted display state
		 * @public
		 */
		SelectedHighlighted: "SelectedHighlighted",

		/**
		 * The control is in the combination of selected, highlighted and focused display state
		 * @public
		 */
		SelectedHighlightedFocused: "SelectedHighlightedFocused",

		/**
		 * The control is in the combination of selected and focused display state
		 * @public
		 */
		SelectedFocused: "SelectedFocused"

	};
	/**
	 * This type is used in the 'state' property of the ProcessFlowLaneHeader. For example, app developers can set the status of the lane header if lanes are displayed without documents.
	 * If the complete process flow is displayed (that is, if the lane header is displayed with documents underneath), the given state values of the lane header are ignored and will be calculated in the ProcessFlow according to the current state of the documents.
	 *
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.ProcessFlowLaneState = {

		/**
		 * In the 'state' array, the total amount of values needs to be 100%.
		 * @public
		 */
		value: "value",

		/**
		 * The 'state' property is associated with the given value. Possible states are: positive, negative, neutral, and planned.
		 * @public
		 */
		state: "state"

	};
	/**
	 * Describes the state connected to the content it is representing in the Process Flow Node. The state is also displayed in the Process Flow Lane Header as a color segment of the donut.
	 *
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.ProcessFlowNodeState = {

		/**
		 * Positive status for a created document: the document is done, finished, solved.
		 * @public
		 */
		Positive: "Positive",

		/**
		 * Negative status for a created document: with this document, an issue occurred.
		 * @public
		 */
		Negative: "Negative",

		/**
		 * Critical status for a created document: with this document, a critical issue occurred, for example, the business process can be interrupted.
		 * @public
		 * @since 1.42.0
		 */
		Critical: "Critical",

		/**
		 * Planned status for a document: the document is planned to be started.
		 * @public
		 */
		Planned: "Planned",

		/**
		 * Neutral status for a created document: the document is in progress.
		 * @public
		 */
		Neutral: "Neutral",

		/**
		 * Planned, but negative status for a document: the planned document has an issue but has not yet been started.
		 * @public
		 */
		PlannedNegative: "PlannedNegative"

	};
	/**
	 * Describes the type of a node. The type value could be single or aggregated. With this type,
	 * the application can define if several nodes should be displayed as one aggregated node in a path per column to
	 * represent a grouping of semantically equal nodes.
	 *
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.ProcessFlowNodeType = {

		/**
		 * Single node - one node is illustrated in a column.
		 * @public
		 */
		Single: "Single",

		/**
		 * Aggregated node - several nodes are illustrated as a stack of nodes in the same path and in one column.
		 * @public
		 */
		Aggregated: "Aggregated"

	};
	/**
	 * The zoom level defines level of details for the node and how much space the process flow requires.
	 *
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.ProcessFlowZoomLevel = {

		/**
		 * The full details with normal font size.
		 * @public
		 */
		One: "One",

		/**
		 * The full detail view of the node but with smaller font size.
		 * @public
		 */
		Two: "Two",

		/**
		 * The details are the icon, title text and no additional texts.
		 * @public
		 */
		Three: "Three",

		/**
		 * Zoom level for least details - only icon is displayed.
		 * @public
		 */
		Four: "Four"

	};
	/**
	 * SelectionState
	 *
	 * @enum {string}
	 * @public
	 * @deprecated Since version 1.48.
	 * This Enumeration is deprecated as it is not used anywhere.
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.SelectionState = {

		/**
		 * Selected
		 * @public
		 */
		Selected: "Selected",

		/**
		 * Not Selected
		 * @public
		 */
		NotSelected: "NotSelected",

		/**
		 * Semantic
		 * @public
		 */
		Semantic: "Semantic"

	};

	/**
	 * The direction of animation.
	 *
	 * @public
	 * @enum {string}
	 */
	sap.suite.ui.commons.statusindicator.FillingDirectionType = {

		/**
		 * From bottom upwards.
		 *
		 * @public
		 */
		Up: "Up",

		/**
		 * From top to bottom.
		 */
		Down: "Down",

		/**
		 * From right to left.
		 */
		Left: "Left",

		/**
		 * From left to right.
		 */
		Right: "Right"
	};

	/**
	 * The type of filling.
	 *
	 * @public
	 * @enum {string}
	 */
	sap.suite.ui.commons.statusindicator.FillingType = {

		/**
		 * The shape is filled with a linear gradient.
		 */
		Linear: "Linear",

		/**
		 * The shape is filled with a radial gradient.
		 */
		Radial: "Radial",

		/**
		 * No filling is applied.
		 */
		None: "None"
	};

	/**
	 * Defines the way how UnifiedThingGroup control is rendered.
	 *
	 * @enum {string}
	 * @public
	 * @deprecated Since version 1.32.
	 * Deprecated. Object page should be used instead.
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.ThingGroupDesign = {

		/**
		 * In this design there is no indentation between header and content of the group.
		 * @public
		 */
		ZeroIndent: "ZeroIndent",

		/**
		 * In this design there is indentation between header and content of the group.
		 * @public
		 */
		TopIndent: "TopIndent"

	};
	/**
	 * The alignment of timeline posts relative to the timeline axis.
	 *
	 * @author SAP SE
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.TimelineAlignment = {

		/**
		 * Entries are displayed to the right of the timeline axis.<br>
		 * In a horizontal timeline, entries are displayed below the timeline axis. Synonym for Bottom.
		 * @public
		 */
		Right: "Right",

		/**
		 * Entries are displayed to the left of the timeline axis.<br>
		 * In a horizontal timeline, entries are displayed above the timeline axis. Synonym for Top.
		 * @public
		 */
		Left: "Left",

		/**
		 * Entries are displayed above the timeline axis.<br>
		 * In a vertical timeline, entries are displayed to the left of the timeline axis. Synonym for Left.
		 * @public
		 */
		Top: "Top",

		/**
		 * Entries are displayed below the timeline axis.<br>
		 * In a vertical timeline, entries are displayed to the right of the timeline axis. Synonym for Right.
		 * @public
		 */
		Bottom: "Bottom"

	};
	/**
	 * Defines the orientation of the timeline axis.
	 *
	 * @author SAP SE
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.TimelineAxisOrientation = {

		/**
		 * Vertical timeline.
		 * @public
		 */
		Vertical: "Vertical",

		/**
		 * Horizontal timeline.
		 * @public
		 */
		Horizontal: "Horizontal"

	};
	/**
	 * Filter type for the timeline.
	 *
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.TimelineFilterType = {

		/**
		 * Items filter based on data, defined by the {@link sap.suite.ui.commons.TimelineItem#getFilterValue filterValue}
		 * property or by a custom value.
		 * @public
		 */
		Data: "Data",

		/**
		 * Time range filter, defined by the start date (<code>from</code>) and end date
		 * (<code>to</code>) of the time range.
		 * @public
		 */
		Time: "Time",

		/**
		 * Search results filter.
		 * @public
		 */
		Search: "Search"

	};
	/**
	 * Type of grouping for timeline entries.
	 *
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.TimelineGroupType = {

		/**
		 * No grouping is used.
		 * @public
		 */
		None: "None",

		/**
		 * Data is grouped by year.
		 * @public
		 */
		Year: "Year",

		/**
		 * Data is grouped by month.
		 * @public
		 */
		Month: "Month",

		/**
		 * Data is grouped by quarter.
		 * @public
		 */
		Quarter: "Quarter",

		/**
		 * Data is grouped by week.
		 * @public
		 */
		Week: "Week",

		/**
		 * Data is grouped by day.
		 * @public
		 */
		Day: "Day"

	};
	/**
	 * Type of the fadeout effect applied to the upper and lower margins of the visible timeline area.
	 *
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.TimelineScrollingFadeout = {

		/**
		 * Timeline does not fade out.
		 * @public
		 */
		None: "None",

		/**
		 * Timeline fades into the lower and upper margins of the visible area,
		 * but no scroll buttons are displayed.
		 * @public
		 */
		Area: "Area",

		/**
		 * Timeline fades into the lower and upper margins of the visible area,
		 * and scroll buttons are displayed.
		 * @public
		 */
		AreaWithButtons: "AreaWithButtons"

	};
	/**
	 * Marker for the key value status.
	 *
	 * @author SAP AG
	 * @enum {string}
	 * @public
	 * @deprecated Since version 1.32.
	 * Deprecated. Numeric content or any other standard Fiori control should be used instead.
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.suite.ui.commons.ValueStatus = {

		/**
		 * Good value.
		 * @public
		 */
		Good: "Good",

		/**
		 * Positive value.
		 * @public
		 */
		Neutral: "Neutral",

		/**
		 * Critical value.
		 * @public
		 */
		Critical: "Critical",

		/**
		 * Bad value.
		 * @public
		 */
		Bad: "Bad"
	};

	return sap.suite.ui.commons;
});
