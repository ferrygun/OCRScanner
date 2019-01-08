/*!
 * SAP UI development toolkit for HTML5 (SAPUI5) (c) Copyright 2009-2014 SAP SE. All rights reserved
 */

/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.control, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides control sap.ca.ui.charts.Chart.
jQuery.sap.declare("sap.ca.ui.charts.Chart");
jQuery.sap.require("sap.ca.ui.library");
jQuery.sap.require("sap.ui.core.Control");


/**
 * Constructor for a new charts/Chart.
 * 
 * Accepts an object literal <code>mSettings</code> that defines initial 
 * property values, aggregated and associated objects as well as event handlers. 
 * 
 * If the name of a setting is ambiguous (e.g. a property has the same name as an event), 
 * then the framework assumes property, aggregation, association, event in that order. 
 * To override this automatic resolution, one of the prefixes "aggregation:", "association:" 
 * or "event:" can be added to the name of the setting (such a prefixed name must be
 * enclosed in single or double quotes).
 *
 * The supported settings are:
 * <ul>
 * <li>Properties
 * <ul>
 * <li>{@link #getWidth width} : sap.ui.core.CSSSize (default: '100%')</li>
 * <li>{@link #getHeight height} : sap.ui.core.CSSSize (default: '100%')</li>
 * <li>{@link #getDataset dataset} : object</li>
 * <li>{@link #getChartType chartType} : string (default: 'Bar')</li>
 * <li>{@link #getMinShapeSize minShapeSize} : sap.ui.core.CSSSize (default: '48px')</li>
 * <li>{@link #getLabel label} : string (default: '')</li>
 * <li>{@link #getTitle title} : string (default: '')</li>
 * <li>{@link #getIcon icon} : string (default: '')</li>
 * <li>{@link #getSecondAxisVisible secondAxisVisible} : boolean (default: true)</li>
 * <li>{@link #getShowLegend showLegend} : boolean (default: true)</li>
 * <li>{@link #getSelectionMode selectionMode} : sap.ca.ui.charts.ChartSelectionMode (default: sap.ca.ui.charts.ChartSelectionMode.Multiple)</li>
 * <li>{@link #getShowHoverBackground showHoverBackground} : boolean (default: false)</li>
 * <li>{@link #getShowTooltip showTooltip} : boolean (default: false)</li>
 * <li>{@link #getShowPopover showPopover} : boolean (default: true)</li>
 * <li>{@link #getShowDataLabel showDataLabel} : boolean (default: true)</li>
 * <li>{@link #getYAxisLabelFormatter yAxisLabelFormatter} : string</li>
 * <li>{@link #getYAxis2LabelFormatter yAxis2LabelFormatter} : string</li>
 * <li>{@link #getXAxisLabelFormatter xAxisLabelFormatter} : string</li>
 * <li>{@link #getXAxis2LabelFormatter xAxis2LabelFormatter} : string</li>
 * <li>{@link #getPlotAreaAxisTooltipFormatter plotAreaAxisTooltipFormatter} : object</li>
 * <li>{@link #getTooltipFormatter tooltipFormatter} : object</li>
 * <li>{@link #getDataLabelFormatter dataLabelFormatter} : object</li>
 * <li>{@link #getPopoverFormatter popoverFormatter} : object</li>
 * <li>{@link #getPopoverGroupFormatter popoverGroupFormatter} : string</li>
 * <li>{@link #getChartSemanticColorFormatter chartSemanticColorFormatter} : object</li>
 * <li>{@link #getInternalVizChart internalVizChart} : sap.ui.core.Control</li>
 * <li>{@link #getChartPopOver chartPopOver} : sap.ui.core.Control</li>
 * <li>{@link #getPopoverSubHeader popoverSubHeader} : sap.ui.core.Control</li>
 * <li>{@link #getPopoverFooter popoverFooter} : sap.ui.core.Control</li>
 * <li>{@link #getAdvancedChartSettings advancedChartSettings} : object</li>
 * <li>{@link #getStackedChartWidthEnhancer stackedChartWidthEnhancer} : boolean (default: false)</li>
 * <li>{@link #getNoData noData} : sap.ui.core.Control</li></ul>
 * </li>
 * <li>Aggregations
 * <ul></ul>
 * </li>
 * <li>Associations
 * <ul></ul>
 * </li>
 * <li>Events
 * <ul>
 * <li>{@link sap.ca.ui.charts.Chart#event:selectDataPoint selectDataPoint} : fnListenerFunction or [fnListenerFunction, oListenerObject] or [oData, fnListenerFunction, oListenerObject]</li>
 * <li>{@link sap.ca.ui.charts.Chart#event:popoverBeforeOpen popoverBeforeOpen} : fnListenerFunction or [fnListenerFunction, oListenerObject] or [oData, fnListenerFunction, oListenerObject]</li>
 * <li>{@link sap.ca.ui.charts.Chart#event:popoverAfterOpen popoverAfterOpen} : fnListenerFunction or [fnListenerFunction, oListenerObject] or [oData, fnListenerFunction, oListenerObject]</li></ul>
 * </li>
 * </ul> 

 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given 
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * Chart implementation on top of sap.viz that takes care of common functionality.
 * - Embedding in a scroll container
 * - Common color palette
 * - Minimum bar / dot / blip ... size
 * - Integration with ChartToolbar and ChartPopover
 * @extends sap.ui.core.Control
 * @version 1.52.0
 *
 * @constructor
 * @public
 * @deprecated Since version 1.24. 
 * 
 * Sap.ca charts have been replaced with sap.viz and vizFrame in 1.24.
 * The UI5 control "sap.viz.ui5.controls.VizFrame" serves as a single point of entry for all the new charts.
 * Now that 1.24 is available you are asked to use sap.viz charts and the VizFrame instead!
 * This control will not be supported anymore from 1.24.
 * @name sap.ca.ui.charts.Chart
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ui.core.Control.extend("sap.ca.ui.charts.Chart", { metadata : {

	deprecated : true,
	library : "sap.ca.ui",
	properties : {

		/**
		 * Target width for the charting area
		 */
		"width" : {type : "sap.ui.core.CSSSize", group : "Dimension", defaultValue : '100%'},

		/**
		 * Target height for the charting area
		 */
		"height" : {type : "sap.ui.core.CSSSize", group : "Dimension", defaultValue : '100%'},

		/**
		 * Viz Dataset that will hold the data to be displayed.
		 */
		"dataset" : {type : "object", group : "Data", defaultValue : null},

		/**
		 * Type of viz chart that will be displayed.
		 */
		"chartType" : {type : "string", group : "Data", defaultValue : 'Bar'},

		/**
		 * Minimum shape size for touch enabled actions, default and minimum to 48px !
		 */
		"minShapeSize" : {type : "sap.ui.core.CSSSize", group : "Data", defaultValue : '48px'},

		/**
		 * User friendly name for the current chart type
		 */
		"label" : {type : "string", group : "Data", defaultValue : '', bindable : "bindable"},

		/**
		 * Title of the chart
		 */
		"title" : {type : "string", group : "Appearance", defaultValue : ''},

		/**
		 * Icon of the Chart
		 */
		"icon" : {type : "string", group : "Appearance", defaultValue : ''},

		/**
		 * Flag to show the second axis. Default is true
		 */
		"secondAxisVisible" : {type : "boolean", group : "Appearance", defaultValue : true},

		/**
		 * Hide / Show the legend of the chart
		 */
		"showLegend" : {type : "boolean", group : "Behavior", defaultValue : true},

		/**
		 * Define the selection mode for the chart
		 */
		"selectionMode" : {type : "sap.ca.ui.charts.ChartSelectionMode", group : "Behavior", defaultValue : sap.ca.ui.charts.ChartSelectionMode.Multiple},

		/**
		 * Hide / Show the hover background
		 */
		"showHoverBackground" : {type : "boolean", group : "Behavior", defaultValue : false},

		/**
		 * Hide / Show the CVOM tooltip
		 */
		"showTooltip" : {type : "boolean", group : "Behavior", defaultValue : false},

		/**
		 * Hide / Show the sap.ca popover that gives information about what is available
		 */
		"showPopover" : {type : "boolean", group : "Behavior", defaultValue : true},

		/**
		 * Flag to display data values on the bar, default is set to true
		 */
		"showDataLabel" : {type : "boolean", group : "Behavior", defaultValue : true},

		/**
		 * Formatter for Y Axis Label
		 */
		"yAxisLabelFormatter" : {type : "string", group : "Data", defaultValue : null},

		/**
		 * Formatter for Y Axis 2 Label
		 */
		"yAxis2LabelFormatter" : {type : "string", group : "Data", defaultValue : null},

		/**
		 * Formatter for X Axis Label
		 */
		"xAxisLabelFormatter" : {type : "string", group : "Data", defaultValue : null},

		/**
		 * Formatter for X Axis 2 Label
		 */
		"xAxis2LabelFormatter" : {type : "string", group : "Data", defaultValue : null},

		/**
		 * Formatter for plotArea Axis Tooltip in bubble charts
		 */
		"plotAreaAxisTooltipFormatter" : {type : "object", group : "Data", defaultValue : null},

		/**
		 * Formatter for toolTip
		 */
		"tooltipFormatter" : {type : "object", group : "Data", defaultValue : null},

		/**
		 * Formatter for Data Label
		 */
		"dataLabelFormatter" : {type : "object", group : "Data", defaultValue : null},

		/**
		 * Formatter for popover
		 */
		"popoverFormatter" : {type : "object", group : "Data", defaultValue : null},

		/**
		 * Formatter for group label in the popover
		 */
		"popoverGroupFormatter" : {type : "string", group : "Data", defaultValue : null},

		/**
		 * Function that will be called when the chart is rendered in order to let the
		 * application decide which color should be use for each bar.
		 * The method should take the following parameter as input :
		 * - The data context of the current datashape
		 * And as output :
		 * - One of sap.ca.ui.charts.ChartSemanticColor type
		 */
		"chartSemanticColorFormatter" : {type : "object", group : "Data", defaultValue : null},

		/**
		 * Retrieve the internal viz chart to allow some operation on it.
		 */
		"internalVizChart" : {type : "sap.ui.core.Control", group : "Data", defaultValue : null},

		/**
		 * Retrieve the chart popover instance to allow some operation on it.
		 */
		"chartPopOver" : {type : "sap.ui.core.Control", group : "Data", defaultValue : null},

		/**
		 * custom subHeader for popover
		 */
		"popoverSubHeader" : {type : "sap.ui.core.Control", group : "Appearance", defaultValue : null},

		/**
		 * custom footer for popover
		 */
		"popoverFooter" : {type : "sap.ui.core.Control", group : "Appearance", defaultValue : null},

		/**
		 * You can specify here any advanced viz chart settings that have not been exposed as a chart
		 * property.
		 */
		"advancedChartSettings" : {type : "object", group : "Appearance", defaultValue : null},

		/**
		 * You can use it if stacked bar width are to big. Disabled by default
		 */
		"stackedChartWidthEnhancer" : {type : "boolean", group : "Appearance", defaultValue : false},

		/**
		 * Control tree to display when there is no data available
		 */
		"noData" : {type : "sap.ui.core.Control", group : "Appearance", defaultValue : null}
	},
	aggregations : {

		/**
		 */
		"internalContent" : {type : "sap.ui.core.Control", multiple : false, visibility : "hidden"}, 

		/**
		 */
		"chartPopover" : {type : "sap.ui.core.Control", multiple : false, visibility : "hidden"}
	},
	events : {

		/**
		 * Event is fired when the data point is selected/unselected on the chart
		 */
		"selectDataPoint" : {}, 

		/**
		 * Event is fired before the popover is opened
		 */
		"popoverBeforeOpen" : {}, 

		/**
		 * Event is fired after the popover is opened
		 */
		"popoverAfterOpen" : {}
	}
}});


/**
 * Creates a new subclass of class sap.ca.ui.charts.Chart with name <code>sClassName</code> 
 * and enriches it with the information contained in <code>oClassInfo</code>.
 * 
 * <code>oClassInfo</code> might contain the same kind of informations as described in {@link sap.ui.core.Element.extend Element.extend}.
 *   
 * @param {string} sClassName name of the class to be created
 * @param {object} [oClassInfo] object literal with informations about the class  
 * @param {function} [FNMetaImpl] constructor function for the metadata object. If not given, it defaults to sap.ui.core.ElementMetadata.
 * @return {function} the created class / constructor function
 * @public
 * @static
 * @name sap.ca.ui.charts.Chart.extend
 * @function
 */

sap.ca.ui.charts.Chart.M_EVENTS = {'selectDataPoint':'selectDataPoint','popoverBeforeOpen':'popoverBeforeOpen','popoverAfterOpen':'popoverAfterOpen'};


/**
 * Getter for property <code>width</code>.
 * Target width for the charting area
 *
 * Default value is <code>100%</code>
 *
 * @return {sap.ui.core.CSSSize} the value of property <code>width</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getWidth
 * @function
 */

/**
 * Setter for property <code>width</code>.
 *
 * Default value is <code>100%</code> 
 *
 * @param {sap.ui.core.CSSSize} sWidth  new value for property <code>width</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setWidth
 * @function
 */


/**
 * Getter for property <code>height</code>.
 * Target height for the charting area
 *
 * Default value is <code>100%</code>
 *
 * @return {sap.ui.core.CSSSize} the value of property <code>height</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getHeight
 * @function
 */

/**
 * Setter for property <code>height</code>.
 *
 * Default value is <code>100%</code> 
 *
 * @param {sap.ui.core.CSSSize} sHeight  new value for property <code>height</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setHeight
 * @function
 */


/**
 * Getter for property <code>dataset</code>.
 * Viz Dataset that will hold the data to be displayed.
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {object} the value of property <code>dataset</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getDataset
 * @function
 */

/**
 * Setter for property <code>dataset</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {object} oDataset  new value for property <code>dataset</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setDataset
 * @function
 */


/**
 * Getter for property <code>chartType</code>.
 * Type of viz chart that will be displayed.
 *
 * Default value is <code>Bar</code>
 *
 * @return {string} the value of property <code>chartType</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getChartType
 * @function
 */

/**
 * Setter for property <code>chartType</code>.
 *
 * Default value is <code>Bar</code> 
 *
 * @param {string} sChartType  new value for property <code>chartType</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setChartType
 * @function
 */


/**
 * Getter for property <code>minShapeSize</code>.
 * Minimum shape size for touch enabled actions, default and minimum to 48px !
 *
 * Default value is <code>48px</code>
 *
 * @return {sap.ui.core.CSSSize} the value of property <code>minShapeSize</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getMinShapeSize
 * @function
 */

/**
 * Setter for property <code>minShapeSize</code>.
 *
 * Default value is <code>48px</code> 
 *
 * @param {sap.ui.core.CSSSize} sMinShapeSize  new value for property <code>minShapeSize</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setMinShapeSize
 * @function
 */


/**
 * Getter for property <code>label</code>.
 * User friendly name for the current chart type
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {string} the value of property <code>label</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getLabel
 * @function
 */

/**
 * Setter for property <code>label</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {string} sLabel  new value for property <code>label</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setLabel
 * @function
 */


/**
 * Binder for property <code>label</code>.
 *
 * @param {string} sPath path to a property in the model 
 * @param {function} [fnFormatter=null] the formatter function
 * @param {sap.ui.model.BindingMode} [sMode=Default] the binding mode to be used for this property binding (e.g. one way) 
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#bindLabel
 * @function
 */

/**
 * Unbinder for property <code>label</code>.
 *
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#unbindLabel
 * @function
 */


/**
 * Getter for property <code>title</code>.
 * Title of the chart
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {string} the value of property <code>title</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getTitle
 * @function
 */

/**
 * Setter for property <code>title</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {string} sTitle  new value for property <code>title</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setTitle
 * @function
 */


/**
 * Getter for property <code>icon</code>.
 * Icon of the Chart
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {string} the value of property <code>icon</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getIcon
 * @function
 */

/**
 * Setter for property <code>icon</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {string} sIcon  new value for property <code>icon</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setIcon
 * @function
 */


/**
 * Getter for property <code>secondAxisVisible</code>.
 * Flag to show the second axis. Default is true
 *
 * Default value is <code>true</code>
 *
 * @return {boolean} the value of property <code>secondAxisVisible</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getSecondAxisVisible
 * @function
 */

/**
 * Setter for property <code>secondAxisVisible</code>.
 *
 * Default value is <code>true</code> 
 *
 * @param {boolean} bSecondAxisVisible  new value for property <code>secondAxisVisible</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setSecondAxisVisible
 * @function
 */


/**
 * Getter for property <code>showLegend</code>.
 * Hide / Show the legend of the chart
 *
 * Default value is <code>true</code>
 *
 * @return {boolean} the value of property <code>showLegend</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getShowLegend
 * @function
 */

/**
 * Setter for property <code>showLegend</code>.
 *
 * Default value is <code>true</code> 
 *
 * @param {boolean} bShowLegend  new value for property <code>showLegend</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setShowLegend
 * @function
 */


/**
 * Getter for property <code>selectionMode</code>.
 * Define the selection mode for the chart
 *
 * Default value is <code>Multiple</code>
 *
 * @return {sap.ca.ui.charts.ChartSelectionMode} the value of property <code>selectionMode</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getSelectionMode
 * @function
 */

/**
 * Setter for property <code>selectionMode</code>.
 *
 * Default value is <code>Multiple</code> 
 *
 * @param {sap.ca.ui.charts.ChartSelectionMode} oSelectionMode  new value for property <code>selectionMode</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setSelectionMode
 * @function
 */


/**
 * Getter for property <code>showHoverBackground</code>.
 * Hide / Show the hover background
 *
 * Default value is <code>false</code>
 *
 * @return {boolean} the value of property <code>showHoverBackground</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getShowHoverBackground
 * @function
 */

/**
 * Setter for property <code>showHoverBackground</code>.
 *
 * Default value is <code>false</code> 
 *
 * @param {boolean} bShowHoverBackground  new value for property <code>showHoverBackground</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setShowHoverBackground
 * @function
 */


/**
 * Getter for property <code>showTooltip</code>.
 * Hide / Show the CVOM tooltip
 *
 * Default value is <code>false</code>
 *
 * @return {boolean} the value of property <code>showTooltip</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getShowTooltip
 * @function
 */

/**
 * Setter for property <code>showTooltip</code>.
 *
 * Default value is <code>false</code> 
 *
 * @param {boolean} bShowTooltip  new value for property <code>showTooltip</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setShowTooltip
 * @function
 */


/**
 * Getter for property <code>showPopover</code>.
 * Hide / Show the sap.ca popover that gives information about what is available
 *
 * Default value is <code>true</code>
 *
 * @return {boolean} the value of property <code>showPopover</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getShowPopover
 * @function
 */

/**
 * Setter for property <code>showPopover</code>.
 *
 * Default value is <code>true</code> 
 *
 * @param {boolean} bShowPopover  new value for property <code>showPopover</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setShowPopover
 * @function
 */


/**
 * Getter for property <code>showDataLabel</code>.
 * Flag to display data values on the bar, default is set to true
 *
 * Default value is <code>true</code>
 *
 * @return {boolean} the value of property <code>showDataLabel</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getShowDataLabel
 * @function
 */

/**
 * Setter for property <code>showDataLabel</code>.
 *
 * Default value is <code>true</code> 
 *
 * @param {boolean} bShowDataLabel  new value for property <code>showDataLabel</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setShowDataLabel
 * @function
 */


/**
 * Getter for property <code>yAxisLabelFormatter</code>.
 * Formatter for Y Axis Label
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {string} the value of property <code>yAxisLabelFormatter</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getYAxisLabelFormatter
 * @function
 */

/**
 * Setter for property <code>yAxisLabelFormatter</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {string} sYAxisLabelFormatter  new value for property <code>yAxisLabelFormatter</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setYAxisLabelFormatter
 * @function
 */


/**
 * Getter for property <code>yAxis2LabelFormatter</code>.
 * Formatter for Y Axis 2 Label
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {string} the value of property <code>yAxis2LabelFormatter</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getYAxis2LabelFormatter
 * @function
 */

/**
 * Setter for property <code>yAxis2LabelFormatter</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {string} sYAxis2LabelFormatter  new value for property <code>yAxis2LabelFormatter</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setYAxis2LabelFormatter
 * @function
 */


/**
 * Getter for property <code>xAxisLabelFormatter</code>.
 * Formatter for X Axis Label
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {string} the value of property <code>xAxisLabelFormatter</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getXAxisLabelFormatter
 * @function
 */

/**
 * Setter for property <code>xAxisLabelFormatter</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {string} sXAxisLabelFormatter  new value for property <code>xAxisLabelFormatter</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setXAxisLabelFormatter
 * @function
 */


/**
 * Getter for property <code>xAxis2LabelFormatter</code>.
 * Formatter for X Axis 2 Label
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {string} the value of property <code>xAxis2LabelFormatter</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getXAxis2LabelFormatter
 * @function
 */

/**
 * Setter for property <code>xAxis2LabelFormatter</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {string} sXAxis2LabelFormatter  new value for property <code>xAxis2LabelFormatter</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setXAxis2LabelFormatter
 * @function
 */


/**
 * Getter for property <code>plotAreaAxisTooltipFormatter</code>.
 * Formatter for plotArea Axis Tooltip in bubble charts
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {object} the value of property <code>plotAreaAxisTooltipFormatter</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getPlotAreaAxisTooltipFormatter
 * @function
 */

/**
 * Setter for property <code>plotAreaAxisTooltipFormatter</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {object} oPlotAreaAxisTooltipFormatter  new value for property <code>plotAreaAxisTooltipFormatter</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setPlotAreaAxisTooltipFormatter
 * @function
 */


/**
 * Getter for property <code>tooltipFormatter</code>.
 * Formatter for toolTip
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {object} the value of property <code>tooltipFormatter</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getTooltipFormatter
 * @function
 */

/**
 * Setter for property <code>tooltipFormatter</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {object} oTooltipFormatter  new value for property <code>tooltipFormatter</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setTooltipFormatter
 * @function
 */


/**
 * Getter for property <code>dataLabelFormatter</code>.
 * Formatter for Data Label
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {object} the value of property <code>dataLabelFormatter</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getDataLabelFormatter
 * @function
 */

/**
 * Setter for property <code>dataLabelFormatter</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {object} oDataLabelFormatter  new value for property <code>dataLabelFormatter</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setDataLabelFormatter
 * @function
 */


/**
 * Getter for property <code>popoverFormatter</code>.
 * Formatter for popover
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {object} the value of property <code>popoverFormatter</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getPopoverFormatter
 * @function
 */

/**
 * Setter for property <code>popoverFormatter</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {object} oPopoverFormatter  new value for property <code>popoverFormatter</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setPopoverFormatter
 * @function
 */


/**
 * Getter for property <code>popoverGroupFormatter</code>.
 * Formatter for group label in the popover
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {string} the value of property <code>popoverGroupFormatter</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getPopoverGroupFormatter
 * @function
 */

/**
 * Setter for property <code>popoverGroupFormatter</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {string} sPopoverGroupFormatter  new value for property <code>popoverGroupFormatter</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setPopoverGroupFormatter
 * @function
 */


/**
 * Getter for property <code>chartSemanticColorFormatter</code>.
 * Function that will be called when the chart is rendered in order to let the
 * application decide which color should be use for each bar.
 * The method should take the following parameter as input :
 * - The data context of the current datashape
 * And as output :
 * - One of sap.ca.ui.charts.ChartSemanticColor type
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {object} the value of property <code>chartSemanticColorFormatter</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getChartSemanticColorFormatter
 * @function
 */

/**
 * Setter for property <code>chartSemanticColorFormatter</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {object} oChartSemanticColorFormatter  new value for property <code>chartSemanticColorFormatter</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setChartSemanticColorFormatter
 * @function
 */


/**
 * Getter for property <code>internalVizChart</code>.
 * Retrieve the internal viz chart to allow some operation on it.
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {sap.ui.core.Control} the value of property <code>internalVizChart</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getInternalVizChart
 * @function
 */

/**
 * Setter for property <code>internalVizChart</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {sap.ui.core.Control} oInternalVizChart  new value for property <code>internalVizChart</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setInternalVizChart
 * @function
 */


/**
 * Getter for property <code>chartPopOver</code>.
 * Retrieve the chart popover instance to allow some operation on it.
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {sap.ui.core.Control} the value of property <code>chartPopOver</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getChartPopOver
 * @function
 */

/**
 * Setter for property <code>chartPopOver</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {sap.ui.core.Control} oChartPopOver  new value for property <code>chartPopOver</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setChartPopOver
 * @function
 */


/**
 * Getter for property <code>popoverSubHeader</code>.
 * custom subHeader for popover
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {sap.ui.core.Control} the value of property <code>popoverSubHeader</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getPopoverSubHeader
 * @function
 */

/**
 * Setter for property <code>popoverSubHeader</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {sap.ui.core.Control} oPopoverSubHeader  new value for property <code>popoverSubHeader</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setPopoverSubHeader
 * @function
 */


/**
 * Getter for property <code>popoverFooter</code>.
 * custom footer for popover
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {sap.ui.core.Control} the value of property <code>popoverFooter</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getPopoverFooter
 * @function
 */

/**
 * Setter for property <code>popoverFooter</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {sap.ui.core.Control} oPopoverFooter  new value for property <code>popoverFooter</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setPopoverFooter
 * @function
 */


/**
 * Getter for property <code>advancedChartSettings</code>.
 * You can specify here any advanced viz chart settings that have not been exposed as a chart
 * property.
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {object} the value of property <code>advancedChartSettings</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getAdvancedChartSettings
 * @function
 */

/**
 * Setter for property <code>advancedChartSettings</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {object} oAdvancedChartSettings  new value for property <code>advancedChartSettings</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setAdvancedChartSettings
 * @function
 */


/**
 * Getter for property <code>stackedChartWidthEnhancer</code>.
 * You can use it if stacked bar width are to big. Disabled by default
 *
 * Default value is <code>false</code>
 *
 * @return {boolean} the value of property <code>stackedChartWidthEnhancer</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getStackedChartWidthEnhancer
 * @function
 */

/**
 * Setter for property <code>stackedChartWidthEnhancer</code>.
 *
 * Default value is <code>false</code> 
 *
 * @param {boolean} bStackedChartWidthEnhancer  new value for property <code>stackedChartWidthEnhancer</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setStackedChartWidthEnhancer
 * @function
 */


/**
 * Getter for property <code>noData</code>.
 * Control tree to display when there is no data available
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {sap.ui.core.Control} the value of property <code>noData</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getNoData
 * @function
 */

/**
 * Setter for property <code>noData</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {sap.ui.core.Control} oNoData  new value for property <code>noData</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setNoData
 * @function
 */


/**
 * Event is fired when the data point is selected/unselected on the chart
 *
 * @name sap.ca.ui.charts.Chart#selectDataPoint
 * @event
 * @param {sap.ui.base.Event} oControlEvent
 * @param {sap.ui.base.EventProvider} oControlEvent.getSource
 * @param {object} oControlEvent.getParameters
 * @public
 */
 
/**
 * Attach event handler <code>fnFunction</code> to the 'selectDataPoint' event of this <code>sap.ca.ui.charts.Chart</code>.<br/>.
 * When called, the context of the event handler (its <code>this</code>) will be bound to <code>oListener<code> if specified
 * otherwise to this <code>sap.ca.ui.charts.Chart</code>.<br/> itself. 
 *  
 * Event is fired when the data point is selected/unselected on the chart
 *
 * @param {object}
 *            [oData] An application specific payload object, that will be passed to the event handler along with the event object when firing the event.
 * @param {function}
 *            fnFunction The function to call, when the event occurs.  
 * @param {object}
 *            [oListener] Context object to call the event handler with. Defaults to this <code>sap.ca.ui.charts.Chart</code>.<br/> itself.
 *
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#attachSelectDataPoint
 * @function
 */

/**
 * Detach event handler <code>fnFunction</code> from the 'selectDataPoint' event of this <code>sap.ca.ui.charts.Chart</code>.<br/>
 *
 * The passed function and listener object must match the ones used for event registration.
 *
 * @param {function}
 *            fnFunction The function to call, when the event occurs.
 * @param {object}
 *            oListener Context object on which the given function had to be called.
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#detachSelectDataPoint
 * @function
 */

/**
 * Fire event selectDataPoint to attached listeners.
 *
 * @param {Map} [mArguments] the arguments to pass along with the event.
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @protected
 * @name sap.ca.ui.charts.Chart#fireSelectDataPoint
 * @function
 */


/**
 * Event is fired before the popover is opened
 *
 * @name sap.ca.ui.charts.Chart#popoverBeforeOpen
 * @event
 * @param {sap.ui.base.Event} oControlEvent
 * @param {sap.ui.base.EventProvider} oControlEvent.getSource
 * @param {object} oControlEvent.getParameters
 * @public
 */
 
/**
 * Attach event handler <code>fnFunction</code> to the 'popoverBeforeOpen' event of this <code>sap.ca.ui.charts.Chart</code>.<br/>.
 * When called, the context of the event handler (its <code>this</code>) will be bound to <code>oListener<code> if specified
 * otherwise to this <code>sap.ca.ui.charts.Chart</code>.<br/> itself. 
 *  
 * Event is fired before the popover is opened
 *
 * @param {object}
 *            [oData] An application specific payload object, that will be passed to the event handler along with the event object when firing the event.
 * @param {function}
 *            fnFunction The function to call, when the event occurs.  
 * @param {object}
 *            [oListener] Context object to call the event handler with. Defaults to this <code>sap.ca.ui.charts.Chart</code>.<br/> itself.
 *
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#attachPopoverBeforeOpen
 * @function
 */

/**
 * Detach event handler <code>fnFunction</code> from the 'popoverBeforeOpen' event of this <code>sap.ca.ui.charts.Chart</code>.<br/>
 *
 * The passed function and listener object must match the ones used for event registration.
 *
 * @param {function}
 *            fnFunction The function to call, when the event occurs.
 * @param {object}
 *            oListener Context object on which the given function had to be called.
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#detachPopoverBeforeOpen
 * @function
 */

/**
 * Fire event popoverBeforeOpen to attached listeners.
 *
 * @param {Map} [mArguments] the arguments to pass along with the event.
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @protected
 * @name sap.ca.ui.charts.Chart#firePopoverBeforeOpen
 * @function
 */


/**
 * Event is fired after the popover is opened
 *
 * @name sap.ca.ui.charts.Chart#popoverAfterOpen
 * @event
 * @param {sap.ui.base.Event} oControlEvent
 * @param {sap.ui.base.EventProvider} oControlEvent.getSource
 * @param {object} oControlEvent.getParameters
 * @public
 */
 
/**
 * Attach event handler <code>fnFunction</code> to the 'popoverAfterOpen' event of this <code>sap.ca.ui.charts.Chart</code>.<br/>.
 * When called, the context of the event handler (its <code>this</code>) will be bound to <code>oListener<code> if specified
 * otherwise to this <code>sap.ca.ui.charts.Chart</code>.<br/> itself. 
 *  
 * Event is fired after the popover is opened
 *
 * @param {object}
 *            [oData] An application specific payload object, that will be passed to the event handler along with the event object when firing the event.
 * @param {function}
 *            fnFunction The function to call, when the event occurs.  
 * @param {object}
 *            [oListener] Context object to call the event handler with. Defaults to this <code>sap.ca.ui.charts.Chart</code>.<br/> itself.
 *
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#attachPopoverAfterOpen
 * @function
 */

/**
 * Detach event handler <code>fnFunction</code> from the 'popoverAfterOpen' event of this <code>sap.ca.ui.charts.Chart</code>.<br/>
 *
 * The passed function and listener object must match the ones used for event registration.
 *
 * @param {function}
 *            fnFunction The function to call, when the event occurs.
 * @param {object}
 *            oListener Context object on which the given function had to be called.
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#detachPopoverAfterOpen
 * @function
 */

/**
 * Fire event popoverAfterOpen to attached listeners.
 *
 * @param {Map} [mArguments] the arguments to pass along with the event.
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @protected
 * @name sap.ca.ui.charts.Chart#firePopoverAfterOpen
 * @function
 */

// Start of sap/ca/ui/charts/Chart.js
/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
/*global d3 *///declare unusual global vars for JSLint/SAPUI5 validation
jQuery.sap.require("sap.m.ScrollContainer");
jQuery.sap.require("sap.m.Bar");
jQuery.sap.require("sap.m.Page");
jQuery.sap.require("sap.m.Label");
jQuery.sap.require("sap.m.Button");
jQuery.sap.require("sap.m.ResponsivePopover");
jQuery.sap.require("sap.m.PlacementType");
jQuery.sap.require("sap.m.PopoverRenderer");
jQuery.sap.require("sap.ui.core.theming.Parameters");
jQuery.sap.require("sap.ca.ui.charts.ChartType");
jQuery.sap.require("sap.ca.ui.charts.ChartSelectionMode");
jQuery.sap.require("sap.ca.ui.charts.ChartSemanticColor");
jQuery.sap.require("sap.ca.ui.charts.ChartColor");
jQuery.sap.require("sap.ca.ui.charts.ClusterList");
jQuery.sap.require("sap.ca.ui.charts.ChartFormatter");
sap.ui.getCore().loadLibrary("sap.viz");
/**
 * Prepare the creation of the chart layout by creating the internal scroll container that will be displayed
 *
 */
sap.ca.ui.charts.Chart.prototype.init = function () {
	this._oScrollContainer = new sap.m.ScrollContainer(this._createId("scroll"), {
		width:"100%",
		height:"100%"
	});

	this.setAggregation("internalContent", this._oScrollContainer);

	this._oSelectedDataList = new sap.ca.ui.charts.ClusterList(this._createId("clusterList"));
	this._createPopover();
	this.oChartFormatter = sap.ca.ui.charts.ChartFormatter.getInstance();

	this._oMinimumShapeSizes = {
		desktop:24,
		mobile:48,
		desktop_px:jQuery.proxy(function () {
			return this._oMinimumShapeSizes.desktop + "px";
		}, this),
		mobile_px:jQuery.proxy(function () {
			return this._oMinimumShapeSizes.mobile + "px";
		}, this)
	};
};

/**
 * create the responsive popover for the chart
 */
sap.ca.ui.charts.Chart.prototype._createPopover = function () {
	var oCustomHeader = new sap.m.Bar(this._createId("popoverHeaderBar"), {
		contentMiddle:[ new sap.m.Label(this._createId("--popoverLabel"), {
			text:sap.ca.ui.utils.resourcebundle.getText("ChartPopover.title")
		})],
		contentRight:(jQuery.device.is.phone) ? [] :
			[new sap.m.Button(this._createId("--popoverCloseButton"), {
				icon:"sap-icon://" + sap.ui.core.theming.Parameters.get("sapCaUiChartPopoverCloseIcon"),
				width:sap.ui.core.theming.Parameters.get("sapCaUiChartPopoverCloseIconSize"),
				press:jQuery.proxy(this._closePopover, this)
			})]
	});
	this._oChartPopover = new sap.m.ResponsivePopover(this._createId("popover"), {
		modal:false,
		enableScrolling:true,
		verticalScrolling:true,
		horizontalScrolling:false,
		placement:sap.m.PlacementType.Auto,
		contentWidth:"18rem",
		customHeader:oCustomHeader,
		content:[this._oSelectedDataList.getControl()]
	});
	this._oChartPopover.addStyleClass('sapCaUiChartPopOver');
	this.setAggregation("chartPopover", this._oChartPopover);
	if (!jQuery.device.is.phone) {
		this._oChartPopover._oControl.oPopup.setAutoClose(false);
	}
	//The content of the popover is added in the static UIArea.
	//Thus the first time the popup is opened we avoid a re-renderer.
	var oStatic = sap.ui.getCore().getStaticAreaRef();
	oStatic = sap.ui.getCore().getUIArea(oStatic);
	oStatic.addContent(this._oChartPopover, true);
	this._oChartPopover._bAppendedToUIArea = true;
	this._oChartPopover.attachAfterOpen(null, jQuery.proxy(this._afterOpenPopover, this));
	if (!jQuery.device.is.phone) {
	   jQuery(document).bind(sap.ui.Device.support.touch ? "touchstart" : "mousedown", jQuery.proxy(this._mouseDownHandler, this));
	}
	if (sap.ui.Device.browser.internet_explorer) {
		//The focus will not be restored to the viz chart after the popup is closed
		// otherwise the  chart will scroll to its initial position.
		this._oChartPopover._oControl.oPopup.restoreFocus = false;
	}
	this.bIsRTL = sap.ui.getCore().getConfiguration().getRTL() && !jQuery.device.is.phone;
	if (this.bIsRTL) {
		this._oChartPopover.attachBeforeClose(null, jQuery.proxy(this._beforeClosePopover, this));
		var fnAdjustPopoverPosition = jQuery.proxy(this._adjustPopoverPosition, this);
		var fnApplyPosition = jQuery.proxy(this._oChartPopover._oControl.oPopup._applyPosition, this._oChartPopover._oControl.oPopup);
		// the _applyPosition is called in several cases to calculate the position of the popup
		this._oChartPopover._oControl.oPopup._applyPosition = function(oPosition, bFromResize) {
			//call the current implementation in the sap.m.popover
			fnApplyPosition(oPosition, bFromResize);
			//modify the placement of the popover
			fnAdjustPopoverPosition(oPosition.of);
		};
	}
};

/**
 * close the popover if we click outside the chart area
 */
sap.ca.ui.charts.Chart.prototype._mouseDownHandler = function (oEvent) {
	var target = oEvent.target;
	if (!this._isInChartArea(target)) {
		this._closePopover();
	}
};

sap.ca.ui.charts.Chart.prototype._isInChartArea = function (oTarget) {
	if (!oTarget || !oTarget.getAttribute) {
		return false;
	}
	var sClassname = oTarget.getAttribute('class');
	if (sClassname &&
		(sClassname.indexOf('sapCaUiChartPopOver') >= 0
		|| sClassname.indexOf('sapCaUiCLI') >= 0
		|| sClassname.indexOf('v-datapoint') >= 0
		|| sClassname.indexOf('v-morphable') >= 0
		|| sClassname.indexOf('v-datashape') >= 0
		|| sClassname.indexOf('v-datashapesgroup') >= 0
		|| sClassname.indexOf('v-bound') >= 0
		|| sClassname.indexOf('v-gridline') >= 0
		|| sClassname.indexOf('v-datalabel') >= 0
		|| sClassname.indexOf('v-lines') >= 0
		|| sClassname.indexOf('v-label') >= 0
		|| sClassname.indexOf('v-labelarea') >= 0
		|| sClassname.indexOf('v-hovershadow') >= 0
		|| sClassname.indexOf('v-m-root') >= 0
		|| sClassname.indexOf('v-m-background') >= 0
		|| sClassname.indexOf('v-m-yAxis') >= 0
		|| sClassname.indexOf('v-m-xAxis') >= 0
		|| sClassname.indexOf('v-m-title') >= 0
		|| sClassname.indexOf('v-m-main') >= 0
		|| sClassname.indexOf('v-m-plot') >= 0
		|| sClassname.indexOf('v-m-legend') >= 0
		|| sClassname.indexOf('v-legend-item') >= 0
		|| sClassname.indexOf('v-body') >= 0
		|| sClassname.indexOf('v-subtitle') >= 0
		|| sClassname.indexOf('v-title') >= 0
		|| sClassname.indexOf('v-incised-gridline') >= 0
		|| sClassname.indexOf('v-fixed-valueaxisline') >= 0
		|| sClassname.indexOf('v-multiValue') >= 0
		|| sClassname.indexOf('v-background-body') >= 0
		|| sClassname.indexOf('v-background-border') >= 0
		|| sClassname.indexOf('v-axis') >= 0
		|| sClassname.indexOf('v-axis-item') >= 0
		|| sClassname.indexOf('v-subaxis') >= 0
		|| sClassname.indexOf('v-valueaxis') >= 0
		|| sClassname.indexOf('v-valueaxisline') >= 0
		|| sClassname.indexOf('v-categoryaxisline') >= 0
		|| sClassname.indexOf('viz-axis') >= 0
		|| sClassname.indexOf('viz-axis-body') >= 0
		|| sClassname.indexOf('viz-axis-label') >= 0
		|| sClassname.indexOf('viz-legend') >= 0)) {
	   return true;
	}
    if (oTarget.parentElement) {
		return this._isInChartArea(oTarget.parentElement);
	}
    if (oTarget.parentNode) {
		return this._isInChartArea(oTarget.parentNode);
	}
	return false;
};

/**
 * close the popover for the chart
 */
sap.ca.ui.charts.Chart.prototype._closePopover = function () {
	if (this._oChartPopover) {
		if (this._oChartPopover.isOpen()) {
			this._oChartPopover.close();
		}
	}
};
/**
 * handle the beforeClose of the popover
 */
sap.ca.ui.charts.Chart.prototype._beforeClosePopover = function () {
	if (this.bIsRTL) {
		//deregister the resize handler for the  popover content
		this._deregisterContentResizeHandler();
		//restore the default implementation of the sap.ui.getCore().getConfiguration().getRTL
		this._enableConfigurationRTL();
		this.sPopoverPlacement = null;
	}
};
/**
 * handle the afterOpen event in the popover
 */
sap.ca.ui.charts.Chart.prototype._afterOpenPopover = function () {
	this.firePopoverAfterOpen();
	if (this.bIsRTL) {
		//register the resize handler for the  popover content
	   this._registerPopupContentResizeHandler();
	}

};
/**
 * Make sure that every object that was created and not added to any aggregation are destroyed.
 * Also remove all the handler that were created.
 */
sap.ca.ui.charts.Chart.prototype.exit = function () {
	this._deregisterEvent();
	this._closePopover();
	if (this._oSelectedDataList) {
		this._oSelectedDataList.destroy();
		this._oSelectedDataList = null;
	}
	if (this._oChartPopover) {
		if (this.bIsRTL) {
			//deregister the resize handler for the  popover content
			this._deregisterContentResizeHandler();
			//restore the default implementation of the sap.ui.getCore().getConfiguration().getRTL
			this._enableConfigurationRTL();
			this.sPopoverPlacement = null;
		}
		this._oChartPopover.destroy();
		this._oChartPopover = null;
	}
};

/**
 * Remove all event listeners for the resize / orientation change
 *
 * @private
 */
sap.ca.ui.charts.Chart.prototype._deregisterEvent = function () {
	if (jQuery.device.is.desktop) {
		jQuery(window).unbind("resize", jQuery.proxy(this._onResize, this));
	} else {
		sap.ui.Device.orientation.detachHandler(this._onOrientationChange, this);
		sap.ui.Device.resize.detachHandler(this._onResize, this);
	}
};

/**
 * Creates an id for an Element prefixed with the control id
 *
 * @return {string} id
 * @public
 */
sap.ca.ui.charts.Chart.prototype._createId = function (sId) {
	return this.getId() + "-" + sId;
};

sap.ca.ui.charts.Chart.prototype._findInCss = function (rClassName) {
	var matchingRules = [];
	if (!this._sapCaStylesheet) {
		var sapCaStylesheet = null;
		jQuery.each(document.styleSheets, function (iIndex, oStyleSheet) {
			//ie8 doesn't know ownerNode
			if ((!!oStyleSheet.ownerNode && /sap.ca.ui/.test(oStyleSheet.ownerNode.id))
				|| (!!oStyleSheet.owningElement && /sap.ca.ui/.test(oStyleSheet.owningElement.id))) {
				sapCaStylesheet = oStyleSheet;
			}
		});
		// In some cases the sap.ca.ui stylesheet is merged with other stylesheet, so in order to find the style
		// we need to be a little bit more aggressive with our search....
		if (sapCaStylesheet == null) {
			// Let's find the node that contain the rule we want as this will be the correct one
			jQuery.each(document.styleSheets, function (iIndex, oStyleSheet) {
				if (oStyleSheet.rules && oStyleSheet.rules.length > 0) {
					jQuery.each(oStyleSheet.rules, function (iIndexRule, oRule) {
						if (rClassName.test(oRule.selectorText)) {
							sapCaStylesheet = oStyleSheet;
							return false;
						}
					});
				} else if (oStyleSheet.cssRules && oStyleSheet.cssRules.length > 0) {
					jQuery.each(oStyleSheet.cssRules, function (iIndexRule, oRule) {
						if (rClassName.test(oRule.selectorText)) {
							sapCaStylesheet = oStyleSheet;
							return false;
						}
					});
				}
				if (sapCaStylesheet) {
					return false;
				}
			});
		}
		this._sapCaStylesheet = sapCaStylesheet;
	}
	if (this._sapCaStylesheet) {
		if (this._sapCaStylesheet.rules && this._sapCaStylesheet.rules.length > 0) {
			jQuery.each(this._sapCaStylesheet.rules, function (iIndexRule, oRule) {
				if (rClassName.test(oRule.selectorText)) {
					matchingRules.push(oRule);

				}
			});
		} else if (this._sapCaStylesheet.cssRules && this._sapCaStylesheet.cssRules.length > 0) {
			jQuery.each(this._sapCaStylesheet.cssRules, function (iIndexRule, oRule) {
				if (rClassName.test(oRule.selectorText)) {
					matchingRules.push(oRule);

				}
			});
		}
	}
	return matchingRules;

};
/**
 * Read the color palette from the css files directly, this is done to allow
 * easy modification depending on the used theme
 *
 * @returns {Array} the color palette for this chart
 * @private
 */
sap.ca.ui.charts.Chart.prototype._getColorPalette = function () {
	var colorPalette = [];
	var i;
	for (i = 1; i < 12; i++) {
	   colorPalette.push(sap.ui.core.theming.Parameters.get("sapUiChart" + i));
	}
	return colorPalette;
};

/**
 * Read the color palette from the css files directly, this is done to allow
 * easy modification depending on the used theme
 *
 * @returns {Array} the color palette for this chart
 * @private
 */
sap.ca.ui.charts.Chart.prototype._getSemanticPalette = function () {
	var semanticPalette = [];
	semanticPalette[sap.ca.ui.charts.ChartSemanticColor.NeutralDark] = sap.ui.core.theming.Parameters.get("sapCaUiChartSemanticColor-Neutral-Dark");
	semanticPalette[sap.ca.ui.charts.ChartSemanticColor.Neutral] = sap.ui.core.theming.Parameters.get("sapCaUiChartSemanticColor-Neutral");
	semanticPalette[sap.ca.ui.charts.ChartSemanticColor.NeutralLight] = sap.ui.core.theming.Parameters.get("sapCaUiChartSemanticColor-Neutral-Light");
	semanticPalette[sap.ca.ui.charts.ChartSemanticColor.GoodDark] = sap.ui.core.theming.Parameters.get("sapCaUiChartSemanticColor-Good-Dark");
	semanticPalette[sap.ca.ui.charts.ChartSemanticColor.Good] = sap.ui.core.theming.Parameters.get("sapCaUiChartSemanticColor-Good");
	semanticPalette[sap.ca.ui.charts.ChartSemanticColor.GoodLight] = sap.ui.core.theming.Parameters.get("sapCaUiChartSemanticColor-Good-Light");
	semanticPalette[sap.ca.ui.charts.ChartSemanticColor.CriticalDark] = sap.ui.core.theming.Parameters.get("sapCaUiChartSemanticColor-Critical-Dark");
	semanticPalette[sap.ca.ui.charts.ChartSemanticColor.Critical] = sap.ui.core.theming.Parameters.get("sapCaUiChartSemanticColor-Critical");
	semanticPalette[sap.ca.ui.charts.ChartSemanticColor.CriticalLight] = sap.ui.core.theming.Parameters.get("sapCaUiChartSemanticColor-Critical-Light");
	semanticPalette[sap.ca.ui.charts.ChartSemanticColor.BadDark] = sap.ui.core.theming.Parameters.get("sapCaUiChartSemanticColor-Bad-Dark");
	semanticPalette[sap.ca.ui.charts.ChartSemanticColor.Bad] = sap.ui.core.theming.Parameters.get("sapCaUiChartSemanticColor-Bad");
	semanticPalette[sap.ca.ui.charts.ChartSemanticColor.BadLight] = sap.ui.core.theming.Parameters.get("sapCaUiChartSemanticColor-Bad-Light");
	return semanticPalette;
};
/**
 * Return the secondary color palette based on the first and the number of measure in the measure group
 *
 * @returns {Array} the color palette for this chart
 * @private
 */
sap.ca.ui.charts.Chart.prototype._getSecondaryColorPalette = function (colorPalette) {
	var dataset = this.getDataset();
	var secondaryColorPaletteArr = [];
	if (dataset && dataset.getVIZDataset()) {
		var startIndexSecondaryColorPalette = dataset.getVIZDataset().getMeasureValuesGroupByIdx(0).getMeasureValues().length;
		jQuery.extend(secondaryColorPaletteArr, colorPalette);
		secondaryColorPaletteArr.splice(0, startIndexSecondaryColorPalette);
	}
	return secondaryColorPaletteArr;
};

/**
 * Read the v-datalabel css property from the stylesheet
 *
 * @returns {string} the v-datalabel rule
 * @private
 */
sap.ca.ui.charts.Chart.prototype._getDataLabelCss = function () {
	var dataLabelRule = ".v-datalabel {"
		+  "font-family:" + sap.ui.core.theming.Parameters.get("sapCaUiChartFontFamily") + ";"
		+  "font-size:" + sap.ui.core.theming.Parameters.get("sapCaUiChartFontSize") + ";"
		+ "font-weight:" + sap.ui.core.theming.Parameters.get("sapCaUiChartFontWeight") + ";"
		+ "text-shadow:" + sap.ui.core.theming.Parameters.get("sapCaUiChartDataLabelShadow") + ";"
		+  "fill:"  + sap.ui.core.theming.Parameters.get("sapCaUiChartFontColor") + ";"
		+ "}";
	return dataLabelRule;
 };

sap.ca.ui.charts.Chart.prototype._getDataPointCss = function () {
	if (!this._sDataPointRule) {
		var dataPointRule = "";
		var dataPointRules = this._findInCss(/.sapCaUiChart .v-datapoint/);
		if (dataPointRules.length > 0) {
			var oRule = dataPointRules[0];
			dataPointRule = ".v-datapoint {";
			var i;
			for (i = 0; i < oRule.style.length; i++) {
				dataPointRule += oRule.style[i] + ": " + oRule.style[oRule.style[i]] + "; ";
			}
			dataPointRule += "}";
		}
		this._sDataPointRule = dataPointRule;
	}
	return this._sDataPointRule;
};

sap.ca.ui.charts.Chart.prototype._getEMSize = function (input) {
	if (!this._emSize) {
		this._emSize = parseFloat(jQuery("body").css("font-size"));
	}
	var pxSize;
	if (jQuery.sap.endsWith(input, "em") || jQuery.sap.endsWith(input, "rem")) {
		pxSize = this._emSize * parseFloat(input);
	} else {
		pxSize = parseFloat(input);
	}
	return pxSize;
};

sap.ca.ui.charts.Chart.prototype._getMarkerSize = function () {
	if (!this._iMarkerSize) {
		var iMarkerSize = 0;
		var markerSizeRules = this._findInCss(/.sapCaUiChartMarkerSize/);
		if (markerSizeRules.length > 0) {
			var oRule = markerSizeRules[0];
			var fontSize = oRule.style['font-size'];
			if (fontSize == null) { // IE, Firefox
				fontSize = oRule.style['fontSize'];
			}
			iMarkerSize = parseInt(this._getEMSize(fontSize), 10);
		}
		this._iMarkerSize = iMarkerSize;
	}
	return this._iMarkerSize;
};


sap.ca.ui.charts.Chart.prototype._getAlignedScale = function () {
	var scaleMin = 0;
	var scaleMax;
	var scale = null;
	if (this.getDataset()) {
		var crossData = this.getDataset().getVIZDataset();
		var measureGroup = [];
		var j;
		for (j = 0; j < crossData.getMeasureValuesGroupByIdx(1).getMeasureValues()[0]._values[0].length; j++) {
			measureGroup.push(parseInt(crossData.getMeasureValuesGroupByIdx(1).getMeasureValues()[0]._values[0][j], 10) + parseInt(crossData.getMeasureValuesGroupByIdx(1).getMeasureValues()[1]._values[0][j], 10));
		}

		var measureGroupMax = Math.max.apply(Math, measureGroup);
		var measureGroupMin = Math.min.apply(Math, measureGroup);

		var i;
		for (i = 0; i < crossData.getMeasureValuesGroupCount(); i++) {
			var tempMax = Math.max(Math.max.apply(Math, crossData.getMeasureValuesGroupByIdx(i).getMeasureValues()[0]._values[0]), measureGroupMax);
			var tempMin = Math.min(Math.min.apply(Math, crossData.getMeasureValuesGroupByIdx(i).getMeasureValues()[0]._values[0]), measureGroupMin);
			if (!scaleMax) {
				scaleMax = tempMax;
			}
			scaleMin = (scaleMin < tempMin) ? scaleMin : tempMin;
			scaleMax = (scaleMax > tempMax) ? scaleMax : tempMax;
		}

		scaleMax = (scaleMax > 0) ? parseInt(1.05 * scaleMax, 10) : parseInt(0.95 * scaleMax, 10);
		scale = {fixedRange: true, minValue: scaleMin, maxValue: scaleMax};
	}
	return scale;

};

/*
 * Merge the chart settings with the "advanced" chart settings defined by the app
 */
sap.ca.ui.charts.Chart.prototype._getMergedChartSettings = function () {
	var chartSettings = this._getChartSettings();

	var parentSettings = {};
	if (this._oInternalVizChart) {
		parentSettings = this._oInternalVizChart._getOptions();
	}

	// First add the non existing properties of the parent chart into this chart
	// Then, overwrite the existing properties in the parent chart with the ones from this chart.
	return jQuery.extend(true, parentSettings, chartSettings, this.getAdvancedChartSettings());
};


sap.ca.ui.charts.Chart.prototype._getChartSettings = function () {
	// Prepare chart settings
	var colorPalette = this._getColorPalette().concat();
	var paletteIdx;
	if (this.getDataset()) {
		var semanticChartPalette = this._getSemanticPalette();
		var i;
		this.semanticColorFormatterAllowed = false;
		var semanticCallback = this.getChartSemanticColorFormatter();
		if (this._vizChartType.name != sap.ca.ui.charts.ChartType.Bubble) {

			var measures = this.getDataset().getMeasures();
			var colorSemanticPaletteMap = {};
			var colorPaletteMap = {};
			var  notMappedMeasure = false;
			for (i = 0; i < measures.length; i++) {
				var fillColor = measures[i].data("fillColor");
				if (fillColor != null) {
					if (semanticChartPalette.hasOwnProperty(fillColor)) {
						colorSemanticPaletteMap[i] = semanticChartPalette[fillColor];
					  } else {
						colorPaletteMap[i] = sap.ui.core.theming.Parameters.get(fillColor);
					}
				} else {
					notMappedMeasure = true;
					break;
				}
			}
			if (!notMappedMeasure) {
				//All measures are assigned with a semantic color
				if (!jQuery.isEmptyObject(colorSemanticPaletteMap)
					&& jQuery.isEmptyObject(colorPaletteMap)) {
					for (paletteIdx in colorSemanticPaletteMap) {
						colorPalette.splice(paletteIdx, 0, colorSemanticPaletteMap[paletteIdx]);
					}
					if (semanticCallback != null && semanticCallback instanceof Function) {
						// The color semantic formatter could be applied on the chart only if we use the semantic palette
						this.semanticColorFormatterAllowed = true;
					}
				}
				//All measures are assigned with a non-semantic color
				if (!jQuery.isEmptyObject(colorPaletteMap)
					&& jQuery.isEmptyObject(colorSemanticPaletteMap)) {
					for (paletteIdx in colorPaletteMap) {
						colorPalette.splice(paletteIdx, 0, colorPaletteMap[paletteIdx]);
					}
					//In the case we use the non-semantic color palette we could not use the color semantic formatter
					if (semanticCallback != null && semanticCallback instanceof Function) {
					   jQuery.sap.log.error("chartSemanticColorFormatter couldn't be used in the chart [chart ID:" + this.getId() + "]  because " +
						   "all measures aren't associated with a semantic chart color.");
					}
				}
				if (!jQuery.isEmptyObject(colorPaletteMap)
					&& !jQuery.isEmptyObject(colorSemanticPaletteMap)) {
					jQuery.sap.log.error("Chart colors and semantic chart colors couldn't be mixed.");
				}
			} else {
				if (!jQuery.isEmptyObject(colorPaletteMap)
					|| !jQuery.isEmptyObject(colorSemanticPaletteMap)) {
					jQuery.sap.log.error("All measures must be associated with a chart color or a semantic chart color.");
				}
				//In the case we use the default color palette we could not use the color semantic formatter
				if (jQuery.isEmptyObject(colorSemanticPaletteMap)
					&& jQuery.isEmptyObject(colorPaletteMap)
					&& semanticCallback != null
					&& semanticCallback instanceof Function) {
					jQuery.sap.log.error("chartSemanticColorFormatter couldn't be used in the chart [chart ID:" + this.getId() + "]  because " +
						"all measures aren't associated with a semantic chart color.");
				}
			}
		} else {
			var dimensions = this.getDataset().getDimensions();
			var analysisAxis = this.getDataset().getVIZDataset()._dataSet.analysisAxis[0].data;
			var colorSemanticPaletteMap = {};
			var colorPaletteMap = {};
			var  notMappedValue = false;
			for (i = 0; i < dimensions.length; i++) {
				// Map of the color per value
				var fillColors = dimensions[i].data("fillColors");
				if (fillColors != null) {
					var j;
					for (j = 0; j < analysisAxis.length; j++) {
						if (analysisAxis[j].name == dimensions[i].getName()) {
							var values = analysisAxis[j].values;
							var uniqueValues = [];
							jQuery.each(values, function (i, el) {
								if (jQuery.inArray(el, uniqueValues) === -1) {
									uniqueValues.push(el);
								}
							});
							var k;
							for (k = 0; k < uniqueValues.length; k++) {
								if (fillColors.hasOwnProperty(uniqueValues[k])) {
									var fillColor = fillColors[uniqueValues[k]];
									if (semanticChartPalette.hasOwnProperty(fillColor)) {
										colorSemanticPaletteMap[k] = semanticChartPalette[fillColor];
										var colorPaletteIdx = jQuery.inArray(colorSemanticPaletteMap[k], colorPalette);
										if (colorPaletteIdx != -1) {
											colorPalette.splice(colorPaletteIdx, 1);
										}
								   } else {
										colorPaletteMap[k] = sap.ui.core.theming.Parameters.get(fillColor);
										var colorPaletteIdx = jQuery.inArray(colorPaletteMap[k], colorPalette);
										if (colorPaletteIdx != -1) {
											colorPalette.splice(colorPaletteIdx, 1);
										}
									}
								} else {
									notMappedValue = true;
									break;
								}
							}
						}
					}
				}
			}
			if (!notMappedValue) {
				//All values in the dimensions are assigned with a semantic color
				if (!jQuery.isEmptyObject(colorSemanticPaletteMap)
					&& jQuery.isEmptyObject(colorPaletteMap)) {
					for (paletteIdx in colorSemanticPaletteMap) {
						colorPalette.splice(paletteIdx, 0, colorSemanticPaletteMap[paletteIdx]);
					}
					if (semanticCallback != null && semanticCallback instanceof Function) {
						// The color semantic formatter could be applied on the chart only if we use the semantic palette
						this.semanticColorFormatterAllowed = true;
					}
				}
				//All values in the dimensions are assigned with a non-semantic color
				if (!jQuery.isEmptyObject(colorPaletteMap)
					&& jQuery.isEmptyObject(colorSemanticPaletteMap)) {
					for (paletteIdx in colorPaletteMap) {
						colorPalette.splice(paletteIdx, 0, colorPaletteMap[paletteIdx]);
					}
					//In the case we use the non-semantic color palette we could not use the color semantic formatter
					if (semanticCallback != null && semanticCallback instanceof Function) {
						jQuery.sap.log.error("chartSemanticColorFormatter couldn't be used in the chart [chart ID:" + this.getId() + "]  because " +
							"all values in a dimension aren't associated with a semantic chart color.");
					}
				}
				if (!jQuery.isEmptyObject(colorSemanticPaletteMap)
					&& !jQuery.isEmptyObject(colorPaletteMap)) {
					   jQuery.sap.log.error("Chart colors and semantic chart colors couldn't be mixed.");
				}
			} else {
				if (!jQuery.isEmptyObject(colorSemanticPaletteMap)
					|| !jQuery.isEmptyObject(colorPaletteMap)) {
					jQuery.sap.log.error("All values in a dimension must be associated with a chart color or a semantic chart color.");
				}
			}
			//In the case we use the default color palette we could not use the color semantic formatter
			if (jQuery.isEmptyObject(colorSemanticPaletteMap)
				&& jQuery.isEmptyObject(colorPaletteMap)
				&& semanticCallback != null
				&& semanticCallback instanceof Function) {
				jQuery.sap.log.error("chartSemanticColorFormatter couldn't be used in the chart [chart ID:" + this.getId() + "]  because " +
					"all values in a dimension aren't associated with a semantic chart color.");
			}
		}

	}
	var chartSettings = {
		width:"100%",
		height:"100%",
		general:{
			layout:{
				padding:5
			}
		},
		plotArea:{
			colorPalette:colorPalette,
			marker:{
				visible:true,
				size:this._getMarkerSize()
			},
			axisTooltip:{
				formatString:this.getProperty("plotAreaAxisTooltipFormatter")
			},
			animation:{
				dataLoading:true,
				dataUpdating:true,
				resizing:false
			}
		},
		title:{
			visible: this.getProperty("title") !== undefined && this.getProperty("title") !== null && this.getProperty("title") !== "",
			text: this.getProperty("title")
		},
		dataLabel:{
			visible:this.getProperty("showDataLabel"),
			position:this._vizChartType.dataLabelPosition,
			formatString:this.getProperty("dataLabelFormatter")
		},
		legend:{
			visible:this.getShowLegend(),
			isScrollable:true
		},
		tooltip:{
			visible:this.getShowTooltip(),
			formatString:this.getProperty("tooltipFormatter")
		},

		hoverline:{
			visible:this._vizChartType.showHoverLine
		},
		interaction:{
			pan: {
				enable : false
			},
		supportLassoEvent:false,
		selectability:{
				mode:this.getSelectionMode().toLowerCase()
		   }
		},
		background:{
			visible:true,
			border:{
				left:{
					visible:false
				},
				right:{
					visible:false
				},
				bottom:{
					visible:true
				},
				top:{
					visible:true
				}
			}
		},
		xAxis:{
			label:{
				formatString:this.getProperty("xAxisLabelFormatter")
			}
		},
		xAxis2:{
			label:{
				formatString:this.getProperty("xAxis2LabelFormatter")
			},
			visible:this.getProperty("secondAxisVisible")
		},
		yAxis:{
			label:{
				formatString:this.getProperty("yAxisLabelFormatter")
			}
		},
		yAxis2:{
			label:{
				formatString:this.getProperty("yAxis2LabelFormatter")
			},
			visible:this.getProperty("secondAxisVisible")
		}
	};
	if (this._vizChartType.dualAxis) {
		chartSettings.plotArea.primaryValuesColorPalette = colorPalette;
		chartSettings.plotArea.secondaryValuesColorPalette = this._getSecondaryColorPalette(colorPalette);
		if (!this.getProperty("secondAxisVisible") && this._vizChartType.alignScales) {
			var alignedScales = this._getAlignedScale();
			if (this._vizChartType.scroll.horizontal) {
				chartSettings.yAxis2.scale = alignedScales;
				chartSettings.yAxis.scale = alignedScales;
			} else {
				chartSettings.xAxis2.scale = alignedScales;
				chartSettings.xAxis.scale = alignedScales;
			}
		}
	}

	return chartSettings;
};

/**
 * This is called after all the properties are set on the control.
 * At this point we can initalize the internal chart without any problem
 *
 * @inherit
 */
sap.ca.ui.charts.Chart.prototype.applySettings = function (mSettings, oScope) {
	sap.ui.core.Control.prototype.applySettings.apply(this, arguments);
	this._initChart();
};

sap.ca.ui.charts.Chart.prototype._initChart = function () {
	this._vizChartType = sap.ca.ui.charts.ChartType.getChartProperties(this.getChartType());

	var chartSettings = this._getMergedChartSettings();

	if (this._vizChartType != null) {
		if (this.getLabel() == "" && !(this.mBindingInfos["label"])) {
			this.setLabel(this._vizChartType.displayLabel);
		}

		// If the icon has not been set, use the default one for this chart type
		if (this.getIcon() == "") {
			this.setProperty("icon", this._vizChartType.icon);
		}
		if (this._oInternalVizChart != null) {
			this._oInternalVizChart.destroy();
		}
		// Tooltip is reserved in UI5 naming so doing that create issue for us
		chartSettings.tooltip = null;
		this._oInternalVizChart = new sap.viz.ui5[this._vizChartType.name](this._createId("vizChart"), chartSettings);
		this._oInternalVizChart.addDelegate({
			onAfterRendering:function () {
				this._onResizeInt();
			}
		}, true, this);

		this._oInternalVizChart.attachBeforeCreateViz(function (oEvent) {
			var oUsrOptions = oEvent.getParameter("usrOptions");
			if (this._vizChartType.vizType) {
				oUsrOptions.type = this._vizChartType.vizType;
			}
			oUsrOptions.css = this._getDataLabelCss() + this._getDataPointCss();
			oUsrOptions.options = this._getMergedChartSettings();
		}, this);

		this._oScrollContainer.addContent(this._oInternalVizChart);

		this._oScrollContainer.setVertical(this._vizChartType.scroll.vertical);
		this._oScrollContainer.setHorizontal(this._vizChartType.scroll.horizontal);

		this._oInternalVizChart.attachInitialized(this.onChartInitialized, this);
		this._oInternalVizChart.attachSelectData(this.onSelectData, this);
		this._oInternalVizChart.attachDeselectData(this.onDeselectData, this);
		if (jQuery.sap.touchEventMode == "ON" && jQuery.device.is.tablet) {
			//Close the popover when we scroll on a tablet
			this._oInternalVizChart.attachBrowserEvent("touchmove", jQuery.proxy(this._closePopover, this));
		}
		this.setMinShapeSize();

	} else {
		jQuery.sap.log.error("Cannot instantiate the Chart control, " + this.getVizType() + " is not a recognized type");
	}
};

/**
 * Create or update local bindings.
 *
 * Called when model or binding contexts have changed. Creates bindings when the model was not available
 * at the time bindProperty or bindAggregation was called. Recreates the bindings when they exist already
 * and when the model has changed.
 *
 * @param {boolean} bUpdateAll forces an update of all bindings, sModelName will be ignored
 * @param {string|undefined} sModelName name of a model whose bindings should be updated
 *
 * @private
 */
sap.ca.ui.charts.Chart.prototype.updateBindings = function (bUpdateAll, sModelName) {
	sap.ui.core.Control.prototype.updateBindings.apply(this, arguments);
};

sap.ca.ui.charts.Chart.prototype.invalidate = function (oOrigin, bInvalidateSize) {
	if (bInvalidateSize) {
		// Delay the invalidation for a few second in case of subsequent resize
		if (this._sInvalidateDelay) {
			jQuery.sap.clearDelayedCall(this._sInvalidateDelay);
		}
		this._sInvalidateDelay = jQuery.sap.delayedCall(200, this, sap.ui.core.Control.prototype.invalidate, arguments);
	} else {
		sap.ui.core.Control.prototype.invalidate.apply(this, arguments);
	}
};

sap.ca.ui.charts.Chart.prototype.setChartType = function (oType) {
	this.setProperty("chartType", oType);
	this.setProperty("icon", "");
	this._vizChartType = sap.ca.ui.charts.ChartType.getChartProperties(this.getChartType());
	this._initChart();

	return this;
};

/**
 * Setter for property <code>title</code>.
 *
 * Default value is <code>Chart</code>
 *
 * @param {string} sTitle  new value for property <code>title</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setTitle
 * @function
 */
sap.ca.ui.charts.Chart.prototype.setTitle = function (sTitle) {
	this.setProperty("title", sTitle);
	return this;
};

/**
 * Setter for property <code>internalVizChart</code>.
 *
 * Default value is <code>oChart</code>
 *
 * @param {sap.viz.ui5.BaseChart} oInternalVizChart  new value for property <code>title</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setInternalVizChart
 * @function
 */
sap.ca.ui.charts.Chart.prototype.setInternalVizChart = function (oInternalVizChart) {
	// We don't accept public setter
	jQuery.sap.log.warning("InternalVizChart cannot be set from outside a sap.ca.ui.chart.Chart class.");
	return this;
};

/**
 * Setter for property <code>chartPopOver</code>.
 *
 *
 * @param {sap.m.ResponsivePopover} oChartPopOver  new value for property <code>chartPopOver</code>
 * @return {sap.m.ResponsivePopover} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setChartPopOver
 * @function
 */
sap.ca.ui.charts.Chart.prototype.setChartPopOver = function (oChartPopOver) {
	// We don't accept public setter
	jQuery.sap.log.warning("ChartPopOver cannot be set from outside a sap.ca.ui.chart.Chart class.");
	return this;
};

/**
 * Setter for property <code>dataset</code>.
 *
 * Default value is empty/<code>undefined</code>
 *
 * @param {sap.viz.ui5.data.Dataset} oDataset  new value for property <code>dataset</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setDataset
 * @function
 */
sap.ca.ui.charts.Chart.prototype.setDataset = function (oDataset) {
	this._oInternalVizChart.setDataset(oDataset);
	this.setProperty("dataset", oDataset);
	return this;
};

/**
 * Getter for property <code>dataset</code>.
 * Viz Dataset that will hold the data to be displayed.
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {object} oDataset the value of property <code>dataset</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getDataset
 * @function
 */
sap.ca.ui.charts.Chart.prototype.getDataset = function () {
	var dataset = null;
	if (this._oInternalVizChart) {
		dataset = this._oInternalVizChart.getDataset();
	}
	return dataset;
};
/**
 * Getter for property <code>internalVizChart</code>.
 * internal Viz Chart
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {object} oInternalVizChart the value of property <code>internalVizChart</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getInternalVizChart
 * @function
 */
sap.ca.ui.charts.Chart.prototype.getInternalVizChart = function () {
	return this._oInternalVizChart;
};

/**
 * Getter for property <code>chartPopOver</code>.
 * chart PopOver
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {sap.m.ResponsivePopover} oChartPopOver the value of property <code>chartPopOver</code>
 * @public
 * @name sap.ca.ui.charts.Chart#getChartPopOver
 * @function
 */
sap.ca.ui.charts.Chart.prototype.getChartPopOver = function () {
	return this._oChartPopover;
};

/**
 * Catch the setModel call and make sure we refresh the size of the chart.
 *
 * @param {sap.ui.model.Model} oModel the model to be set or <code>null</code> or <code>undefined</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setModel
 * @function
 */
sap.ca.ui.charts.Chart.prototype.setModel = function (oModel) {
	if (this._oSelectedDataList) {
		this._oSelectedDataList.reset();
	}
	sap.ui.core.Control.prototype.setModel.apply(this, arguments);
	return this;
};


/**
 * Setter for property <code>height</code>.
 *
 * Default value is <code>100%</code>
 *
 * @param {sap.ui.core.CSSSize} sHeight  new value for property <code>height</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setHeight
 * @function
 */
sap.ca.ui.charts.Chart.prototype.setHeight = function (sHeight) {
	this.setProperty("height", sHeight);
	return this;
};

/**
 * Setter for property <code>width</code>.
 *
 * Default value is <code>100%</code>
 *
 * @param {sap.ui.core.CSSSize} sWidth  new value for property <code>width</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setWidth
 * @function
 */
sap.ca.ui.charts.Chart.prototype.setWidth = function (sWidth) {
	this.setProperty("width", sWidth);
	return this;
};

/**
 * Setter for property <code>showLegend</code>.
 *
 * Default value is <code>true</code>
 *
 * @param {boolean} bShowLegend  new value for property <code>showLegend</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setShowLegend
 * @function
 */
sap.ca.ui.charts.Chart.prototype.setShowLegend = function (bShowLegend) {
	this.setProperty("showLegend", bShowLegend);
	if (this._oInternalVizChart) {
		this._oInternalVizChart.getLegend().setVisible(bShowLegend);
	}
	return this;
};

/**
 * Setter for property <code>showTooltip</code>.
 *
 * Default value is <code>false</code>
 *
 * @param {boolean} bShowTooltip  new value for property <code>showTooltip</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setShowTooltip
 * @function
 */
sap.ca.ui.charts.Chart.prototype.setShowTooltip = function (bShowTooltip) {
	this.setProperty("showTooltip", bShowTooltip);
	if (this._oInternalVizChart) {
		var toolTip = this._oInternalVizChart.getToolTip();
		if (toolTip) {
			if (toolTip.setVisible) {
				toolTip.setVisible(bShowTooltip);
			}
			if (toolTip.setEnabled) {
				toolTip.setEnabled(bShowTooltip);
			}
		} else {
			jQuery.sap.log.error("Aggregation toolTip couldn't be found in viz chart.");
		}
	}
	return this;
};

/**
 * Setter for property <code>selectionMode</code>.
 *
 * Default value is <code>Multi</code>
 *
 * @param {sap.ca.ui.charts.ChartSelectionMode} sSelectionMode  new value for property <code>selectionMode</code>
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setSelectionMode
 * @function
 */
sap.ca.ui.charts.Chart.prototype.setSelectionMode = function (sSelectionMode) {
	this.setProperty("selectionMode", sSelectionMode);
	if (this._oInternalVizChart) {
		this._oInternalVizChart.getInteraction().getSelectability().setMode(sSelectionMode.toLowerCase());
		// clear the selection up selection mode change
		this._oInternalVizChart.selection([], {clearSelection:true} );
	}
	// clear the contents of the cluster list
	this._oSelectedDataList.reset();
	// close the popover if it is open
	this._closePopover();

	return this;
};

/**
 * For 'none' selection mode, we want a standard cursor, not the pointer (hand) cursor.
 * CSS  0120061532 0003810745 2013 - FF3-CTRL Wrong mouse pointer on Chart
 * @private
 */
sap.ca.ui.charts.Chart.prototype._setCursorStyle = function () {
	var $domRef = this.$();
	var sNonNullSelectionMode = (!!this.getSelectionMode()) ? this.getSelectionMode() : "";
	if (sNonNullSelectionMode.toLowerCase() === sap.ca.ui.charts.ChartSelectionMode.None.toLowerCase()) {
		$domRef.addClass('sapCaUiChartSelectionNoneCursor');
	} else {
		$domRef.removeClass('sapCaUiChartSelectionNoneCursor');
	}
};

/**
 * Getter for property <code>selectionMode</code>.
 *
 * @return {sap.ca.ui.charts.ChartSelectionMode} The selection mode
 * @public
 * @name sap.ca.ui.charts.Chart#getSelectionMode
 * @function
 */
sap.ca.ui.charts.Chart.prototype.getSelectionMode = function () {
	if (this._oInternalVizChart) {
		return this._oInternalVizChart.getInteraction().getSelectability().getMode();
	}
	jQuery.sap.log.debug("getSelectionMode called without an internal chart");
	return this.getProperty("selectionMode");
};

/**
 * Setter for property <code>xAxisLabelFormatter</code>.
 *
 *
 * @param {object} formatter  new value for property <code>xAxisLabelFormatter</code>
 *		formatter can be:
 *		  - a custom formatting function
 *		  - a value of enum sap.ca.ui.charts.DefaultFormatterFunction
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#xAxisLabelFormatter
 * @function
 */
sap.ca.ui.charts.Chart.prototype.setXAxisLabelFormatter = function (formatter) {
	var formatString = this.oChartFormatter.addFormatter(this._oInternalVizChart, "xAxisLabelFormatter", formatter);
	this.setProperty("xAxisLabelFormatter", formatString);
	return this;
};

/**
 * Setter for property <code>xAxis2LabelFormatter</code>.
 *
 *
 * @param {object} formatter  new value for property <code>xAxis2LabelFormatter</code>
 *		formatter can be:
 *		  - a custom formatting function
 *		  - a value of enum sap.ca.ui.charts.DefaultFormatterFunction
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#xAxis2LabelFormatter
 * @function
 */
sap.ca.ui.charts.Chart.prototype.setXAxis2LabelFormatter = function (formatter) {
	var formatString = this.oChartFormatter.addFormatter(this._oInternalVizChart, "xAxis2LabelFormatter", formatter);
	this.setProperty("xAxis2LabelFormatter", formatString);
	return this;
};

/**
 * Setter for property <code>yAxisLabelFormatter</code>.
 *
 *
 * @param {object} formatter  new value for property <code>yAxisLabelFormatter</code>
 *		formatter can be:
 *		  - a custom formatting function
 *		  - a value of enum sap.ca.ui.charts.DefaultFormatterFunction
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#yAxisLabelFormatter
 * @function
 */
sap.ca.ui.charts.Chart.prototype.setYAxisLabelFormatter = function (formatter) {
	var formatString = this.oChartFormatter.addFormatter(this._oInternalVizChart, "yAxisLabelFormatter", formatter);
	this.setProperty("yAxisLabelFormatter", formatString);
	return this;
};

/**
 * Setter for property <code>yAxis2LabelFormatter</code>.
 *
 *
 * @param {object} formatter  new value for property <code>yAxis2LabelFormatter</code>
 *		formatter can be:
 *		  - a custom formatting function
 *		  - a value of enum sap.ca.ui.charts.DefaultFormatterFunction
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#yAxis2LabelFormatter
 * @function
 */
sap.ca.ui.charts.Chart.prototype.setYAxis2LabelFormatter = function (formatter) {
	var formatString = this.oChartFormatter.addFormatter(this._oInternalVizChart, "yAxis2LabelFormatter", formatter);
	this.setProperty("yAxis2LabelFormatter", formatString);
	return this;
};

/**
 * Setter for property <code>dataLabelFormatter</code>.
 *
 *
 * @param {object} formatterArray  new value for property <code>dataLabelFormatter</code>
 *		[formatterArray] must be a 2 dimensions array of formatters.
 *			[  [ measure 1 of X Axis , ...,  [measure n of X Axis] ],
 *			   [ measure 1 of X Axis 2 , ...,  [measure n of X Axis 2] ]
 *		Each of these formatters can be:
 *		  - a custom formatting function
 *		  - a value of enum sap.ca.ui.charts.DefaultFormatterFunction
 *		If for an axis, formatters count < measures count, then first formatter of axis will be used
 *		for other measures.

 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#dataLabelFormatter
 * @function
 */
sap.ca.ui.charts.Chart.prototype.setDataLabelFormatter = function (formatterArray) {
	var formatString;
	var formatStringArray = [
		[]
	];
	if (Array.isArray(formatterArray)) {
		var i;
		var j;
		for (i = 0; i < formatterArray.length; i++) {
			if (Array.isArray(formatterArray[i])) {
				if (i > 0) {
					formatStringArray.push([]);
				}
				for (j = 0; j < formatterArray[i].length; j++) {
					formatString = this.oChartFormatter.addFormatter(this._oInternalVizChart, "dataLabelFormatter" + i + "-" + j, formatterArray[i][j]);
					formatStringArray[i][j] = formatString;
				}
			} else {
				jQuery.sap.log.error("dataLabelFormatter must be an array of arrays");
				return this;
			}
		}
	} else {
		jQuery.sap.log.error("dataLabelFormatter must be an array of arrays");
		return this;
	}
	this.setProperty("dataLabelFormatter", formatStringArray);
	return this;
};


/**
 * Setter for property <code>plotAreaAxisTooltipFormatter</code>.
 *
 *
 * @param {object} [formatterArray] new value for property <code>plotAreaAxisTooltipFormatter</code>
 *		This is the tooltip for "bubbles" of bubble chart.
 *		[formatterArray] must be an array of 2 formatters (one for X Axis, one for Y axis).
 *		Each of these formatters can be:
 *		  - a custom formatting function
 *		  - a value of enum sap.ca.ui.charts.DefaultFormatterFunction
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#setPlotAreaAxisTooltipFormatter
 * @function
 */
sap.ca.ui.charts.Chart.prototype.setPlotAreaAxisTooltipFormatter = function (formatterArray) {
	var formatString;
	var formatStringArray = [];
	if (Array.isArray(formatterArray)) {
		var i;
		for (i = 0; i < formatterArray.length; i++) {
			formatString = this.oChartFormatter.addFormatter(this._oInternalVizChart, "plotAreaAxisTooltipFormatter" + i, formatterArray[i]);
			formatStringArray[i] = formatString;
		}
	} else {
		jQuery.sap.log.error("plotAreaAxisTooltipFormatter must be an array");
		return this;
	}
	this.setProperty("plotAreaAxisTooltipFormatter", formatStringArray);
	return this;
};

/**
 * Setter for property <code>tooltipFormatter</code>.
 *
 *
 * @param {object} formatterArray  new value for property <code>tooltipFormatter</code>
 *		[formatterArray] must be a 2 dimensions array of formatters.
 *			[  [ measure 1 of X Axis , ...,  [measure n of X Axis] ],
 *			   [ measure 1 of X Axis 2 , ...,  [measure n of X Axis 2] ]
 *		Each of these formatters can be:
 *		  - a custom formatting function
 *		  - a value of enum sap.ca.ui.charts.DefaultFormatterFunction
 *		If for an axis, formatters count < measures count, then first formatter of axis will be used
 *		for other measures.
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#tooltipFormatter
 * @function
 */
sap.ca.ui.charts.Chart.prototype.setTooltipFormatter = function (formatterArray) {
	var formatString;
	var formatStringArray = [
		[]
	];
	if (Array.isArray(formatterArray)) {
		var i, j;
		for (i = 0; i < formatterArray.length; i++) {
			if (Array.isArray(formatterArray[i])) {
				if (i > 0) {
					formatStringArray.push([]);
				}
				for (j = 0; j < formatterArray[i].length; j++) {
					formatString = this.oChartFormatter.addFormatter(this._oInternalVizChart, "tooltipFormatter" + i + "-" + j, formatterArray[i][j]);
					formatStringArray[i][j] = formatString;
				}
			} else {
				jQuery.sap.log.error("tooltipFormatter must be an array of arrays");
				return this;
			}
		}
	} else {
		jQuery.sap.log.error("tooltipFormatter must be an array of arrays");
		return this;
	}
	this.setProperty("tooltipFormatter", formatStringArray);
	return this;
};

/**
 * Setter for property <code>popoverFormatter</code>.
 *
 *
 * @param {object} formatterArray  new value for property <code>popoverFormatter</code>
 *		[formatterArray] must be a 2 dimensions array of formatters.
 *			[  [ measure 1 of X Axis , ...,  [measure n of X Axis] ],
 *			   [ measure 1 of X Axis 2 , ...,  [measure n of X Axis 2] ]
 *		Each of these formatters can be:
 *		  - a custom formatting function
 *		  - a value of enum sap.ca.ui.charts.DefaultFormatterFunction
 *		If for an axis, formatters count < measures count, then first formatter of axis will be used
 *		for other measures.

 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#popoverFormatter
 * @function
 */
sap.ca.ui.charts.Chart.prototype.setPopoverFormatter = function (formatterArray) {
	var formatString;
	var formatStringArray = [
		[]
	];
	var i, j;
	if (Array.isArray(formatterArray)) {
		for (i = 0; i < formatterArray.length; i++) {
			if (Array.isArray(formatterArray[i])) {
				if (i > 0) {
					formatStringArray.push([]);
				}
				for (j = 0; j < formatterArray[i].length; j++) {
					formatString = this.oChartFormatter.addFormatter(this._oInternalVizChart, "popoverFormatter" + i + "-" + j, formatterArray[i][j]);
					formatStringArray[i][j] = formatString;
				}
			} else {
				jQuery.sap.log.error("popoverFormatter must be an array of arrays");
				return this;
			}
		}
	} else {
		jQuery.sap.log.error("popoverFormatter must be an array of arrays");
		return this;
	}
	this.setProperty("popoverFormatter", formatStringArray);
	return this;
};

/**
 * Setter for property <code>popoverGroupFormatter</code>.
 *
 *
 * @param {object} formatter  new value for property <code>popoverGroupFormatter</code>
 *		formatter can be:
 *		  - a custom formatting function
 *		  - a value of enum sap.ca.ui.charts.DefaultFormatterFunction
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#popoverGroupFormatter
 * @function
 */
sap.ca.ui.charts.Chart.prototype.setPopoverGroupFormatter = function (formatter) {
	var formatString = this.oChartFormatter.addFormatter(this._oInternalVizChart, "popoverGroupFormatter", formatter);
	this.setProperty("popoverGroupFormatter", formatString);
	return this;
};

/**
 * Setter for property <code>advancedChartSettings</code>.
 *
 *
 * @param {object} settings
 * You can specify here any advanced viz chart settings that have not been exposed as a chart property.
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#advancedChartSettings
 * @function
 */
sap.ca.ui.charts.Chart.prototype.setAdvancedChartSettings = function (settings) {
	this.setProperty("advancedChartSettings", settings);
	return this;
};

/**
 * Setter for property <code>minShapeSize</code>.
 * Note: doesn't work for the bubble chart's bubbles sizes.
 *
 * @param {string} sMinShapeSize Minimum shape size in pixels.
 *
 * @return {sap.ca.ui.charts.Chart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.Chart#minShapeSize
 * @function
 */
sap.ca.ui.charts.Chart.prototype.setMinShapeSize = function (sMinShapeSize) {

	if (jQuery.device.is.desktop) {
		if (typeof sMinShapeSize !== "undefined") {
			jQuery.sap.log.warning("MinShapeSize must be 24px for desktop. Forcing to 24px.");
		}
		sMinShapeSize = this._oMinimumShapeSizes.desktop_px();
	} else {
		if (typeof sMinShapeSize !== "undefined") {
			jQuery.sap.log.warning("MinShapeSize must be 48px to be clickable on mobile. Forcing to 48px.");
		}
		sMinShapeSize = this._oMinimumShapeSizes.mobile_px();
	}
	this.setProperty("minShapeSize", sMinShapeSize);
	return this;
};

/**
 *  =============
 *  Event Handling
 *  =============
 **/

/**
 * Function that is called after the chart has been rendered
 *
 * @param oEvent viz initialized event that is triggered when the chart has been rendered
 */
sap.ca.ui.charts.Chart.prototype.onChartInitialized = function (oEvent) {
	// Depending on selection mode, the cursor might have to be changed
	this._setCursorStyle();
//	Using a code like this we can ask the team to implement a simple callback that would
//	take the datapoint details (with the context / values etc) return us a semantic color value from the type
//	and use this to color the datashape.
	var semanticCallback = this.getChartSemanticColorFormatter();
	// The color semantic formatter could be applied on the chart only if we use the semantic palette
	//and all measures or values in the dimension are assigned with a semantic color
	if (semanticCallback != null && semanticCallback instanceof Function && this.semanticColorFormatterAllowed) {
		var chart = d3.select(this._oInternalVizChart.getDomRef()).select('.v-m-root');
		var semanticPalette = this._getSemanticPalette();
		chart.selectAll('g.v-datashape').selectAll('rect').attr('fill', function (d) {
			var semanticColorType = semanticCallback(d);
			var fillColor;
			//the color could be stored in the element fillColor or in the element colorValue
			if (d.hasOwnProperty('fillColor')) {
				fillColor = d.fillColor;
			} else if (d.hasOwnProperty('colorValue')) {
				fillColor = d.colorValue;
			} else {
				jQuery.sap.log.error("property 'fillColor' or 'colorValue' is missing in the datapoint.");
			}
			if (semanticColorType && semanticPalette.hasOwnProperty(semanticColorType)) {
				fillColor = semanticPalette[semanticColorType];
			}
			return fillColor;
		});
		chart.selectAll('g.v-datashape').selectAll('path').attr('fill', function (d) {
			var semanticColorType = semanticCallback(d);
			var fillColor;
			//the color could be stored in the element fillColor or in the element colorValue
			if (d.hasOwnProperty('fillColor')) {
				fillColor = d.fillColor;
			} else if (d.hasOwnProperty('colorValue')) {
				fillColor = d.colorValue;
			} else {
				jQuery.sap.log.error("property 'fillColor' or 'colorValue' is missing in the datapoint.");
			}
			if (semanticColorType && semanticPalette.hasOwnProperty(semanticColorType)) {
			   fillColor = semanticPalette[semanticColorType];
			}
			return fillColor;
		});
	}
};

sap.ca.ui.charts.Chart.prototype._showDetailInPopover = function() {
	if (!this.oSelectedData) {
		return;
	}
	var oData = this.oSelectedData;
	// if single select mode is enabled, we reset the cluster list
	if (this.getSelectionMode() === sap.ca.ui.charts.ChartSelectionMode.Single.toLowerCase()) {
		this._oChartPopover.detachAfterClose(jQuery.proxy(this._showDetailInPopover,this), this);
		// reset the cluster list
		this._oSelectedDataList.reset();
	}
	var oTarget = oData[oData.length - 1].target;
	var vizDataset = this._oInternalVizChart.getDataset().getVIZDataset();
	var measureValuesGroup = vizDataset._measureValuesGroup;
	var p, q;
	for (p = 0; p < oData.length; p++) {
		for (q = 0; q < oData[p].data.length; q++) {
			if (!oData[p].data[q] || !oData[p].data[q].ctx || !jQuery.isNumeric(oData[p].data[q].val)) {
				continue;
			}
			var oContext = oData[p].data[q].ctx;
			var oColor = oData[p].target.attributes.fill.value;
			var sValue = oData[p].data[q].val;
			var dimAxis1 = vizDataset._analysisAxis[0]._dimensionLabels;
			var measures = measureValuesGroup[oContext.path.mg].getMeasureValues();
			var sMeasureName = measures[oContext.path.mi]._uId;
			var sAxisName = "";
			var aGroupKey = [];
			if (oContext.type === 'Measure') {
				var path = oContext.path;
				var sKey = path.dii_a1.toString();
				sKey += path.dii_a2.toString();
				sKey += path.mg.toString();
				sKey += path.mi.toString();
				var that = this;
				var groupFormatString;
				if (this.getProperty("popoverGroupFormatter")) {
					groupFormatString = this.getProperty("popoverGroupFormatter");
				}
				jQuery.each(dimAxis1, jQuery.proxy(function (i, dimension) {
					sAxisName = dimension._values[oContext.path.dii_a1];
					aGroupKey.push(sAxisName);
					if (that._oSelectedDataList.getGroupIndexFor(aGroupKey) === -1) {
						if (groupFormatString && groupFormatString.length >0) {
							sAxisName = this.oChartFormatter.format(sAxisName.toString(), groupFormatString);
						}
						that._oSelectedDataList.addGroup({
							key:aGroupKey,
							title:sAxisName
						});
					}
				}, this));
				var formatString = "";
				if (!this.getProperty("popoverFormatter") ||
					!Array.isArray(this.getProperty("popoverFormatter")) ||
					this.getProperty("popoverFormatter").length < oContext.path.mg ||
					!this.getProperty("popoverFormatter")[oContext.path.mg] ||
					!Array.isArray(this.getProperty("popoverFormatter")[oContext.path.mg]) ||
					this.getProperty("popoverFormatter")[oContext.path.mg].length == 0) {
					formatString = sap.ca.ui.charts.DefaultFormatterFunction.STANDARDNUMBER;
				} else {
					if (this.getProperty("popoverFormatter")[oContext.path.mg].length < oContext.path.mi) {
						formatString = this.getProperty("popoverFormatter")[oContext.path.mg][0];
					} else {
						formatString = this.getProperty("popoverFormatter")[oContext.path.mg][oContext.path.mi];
					}
				}

				if (this._oSelectedDataList.getItemIndexFor(aGroupKey, sKey) === -1) {
					this._oSelectedDataList.addItemTo(aGroupKey, [
						{
							key:sKey,
							color:oColor,
							label:sMeasureName,
							value:this.oChartFormatter.format(sValue.toString(), formatString)
						}
					]);
				}
			}
		}
	}
	var aSelection = this._oInternalVizChart.selection();
	var oCloneData = jQuery.extend(true, {}, oData);
	this.firePopoverBeforeOpen({isOpen:this._oChartPopover.isOpen(), openBy:oTarget, selection:aSelection, data:oCloneData});
	if (!this._oChartPopover.isOpen()) {
		var offsetX = 0;
		var offsetY = 0;
		if (oTarget.width != null) {
			offsetX = Math.floor(oTarget.width.baseVal.value);
			offsetY = Math.floor((oTarget.height.baseVal.value / 2));
		}

		if (this._vizChartType.name == sap.ca.ui.charts.ChartType.Bubble) {
			if (oTarget && oTarget.getBoundingClientRect()) {
				var iBoundingWidth = oTarget.getBoundingClientRect().width;
				var iBoundingHeight = oTarget.getBoundingClientRect().height;
				if (iBoundingWidth) {
				   offsetX = Math.floor(iBoundingWidth / 2);
				   offsetY = Math.floor(iBoundingHeight / 2);
				}
			}
		}
		this._oChartPopover.setOffsetX(offsetX);
		this._oChartPopover.setOffsetY(offsetY);
		if (!jQuery.device.is.phone) {
			this._oChartPopover._oControl.$().css("max-height", this._oInternalVizChart.getHeight());
		}
		if (this.bIsRTL) {
			this.sPopoverPlacement = null;
			//disable the RTL before we open the popover
			this._disableConfigurationRTL();
		}
		this._oChartPopover.openBy(oTarget);
	} else if (!jQuery.device.is.phone) {
		//If the popover is opened we rerender its content.
		this._invalidatePopover();
	}
	this.oSelectedData = undefined;
};
/**
 * modify the placement of the popover
 * The popover has been rendered or has been opened at least once
 */
sap.ca.ui.charts.Chart.prototype._adjustPopoverPosition = function(oTarget) {
	var $arrow = this._oChartPopover._oControl.$('arrow');
	if ($arrow) {
	var sClassName = $arrow.attr('class');
	if (sClassName) {
	   if (!this.sPopoverPlacement) {
		   if (sClassName.indexOf('sapMPopoverArrLeft') >= 0) {
			   this.sPopoverPlacement = sap.m.PlacementType.Right;
		   }
		   if (sClassName.indexOf('sapMPopoverArrRight') >= 0) {
			   this.sPopoverPlacement = sap.m.PlacementType.Left;
		   }
	   }
	   $arrow.removeClass("sapMPopoverArrRight sapMPopoverArrLeft");
	   if (this.sPopoverPlacement == sap.m.PlacementType.Right) {
		   $arrow.addClass("sapMPopoverArrRight");
	   }
	   if (this.sPopoverPlacement == sap.m.PlacementType.Left) {
			 $arrow.addClass("sapMPopoverArrLeft");
		 }
		}
	}
};
/**
 * register the resize handler for the  popover content
 * A resize involves a new calculation of the position of the popover
 */
sap.ca.ui.charts.Chart.prototype._registerPopupContentResizeHandler = function() {
	if (!this._sResizeListenerId) {
		var popoverScroll = this._oChartPopover._oControl.getDomRef("scroll");
		if (popoverScroll) {
			this._sResizeListenerId = sap.ui.core.ResizeHandler.register(popoverScroll,  this._disableConfigurationRTL);
		}
	}
};
/**
 * deregister the resize handler for the  popover content
 *
 */
sap.ca.ui.charts.Chart.prototype._deregisterContentResizeHandler = function() {
	if (this._sResizeListenerId) {
		sap.ui.core.ResizeHandler.deregister(this._sResizeListenerId);
		this._sResizeListenerId = null;
	}
};
/**
 * disable temporarily the RTL when we open the open popover
 * The sap.ui.getCore().getConfiguration().getRTL() function permits to know if we are
 * in a RTL mode.
 * Unfortunately sap.ui.getCore().getConfiguration().setRTL function doesn't change the rtl configuration
 *  There is not option to ignore the RTL for a particular control.
 *  The sap.ui.getCore().getConfiguration().getRTL() function is called by the sap.ui.core.Popup and the
 *  sap.m.Popover to calculate the position and orientation of the popover
 *
 */
sap.ca.ui.charts.Chart.prototype._disableConfigurationRTL = function() {
	//save the default implementation of the getRTL() function
	this.fn_getRTL = jQuery.proxy(sap.ui.getCore().getConfiguration().getRTL);
	sap.ui.getCore().getConfiguration().getRTL = function() { return false; };
};
/**
 * re-enable the RTL in particular before we close the popover
 *
 */
sap.ca.ui.charts.Chart.prototype._enableConfigurationRTL = function()   {
	if (typeof (this.fn_getRTL) == "function") {
		//restore the default implementation of the getRTL() function
		sap.ui.getCore().getConfiguration().getRTL  = this.fn_getRTL;
		this.fn_getRTL = null;
	}
};

sap.ca.ui.charts.Chart.prototype._invalidatePopover = function() {
	var popover = this._oChartPopover._oControl;
	sap.m.PopoverRenderer.rerenderContentOnly(popover);
	var $popover = popover.$();
	$popover.addClass('sapCaUiChartPopOver');
	var $popoverContent = jQuery.sap.byId(popover.getId() + "-cont");
	$popoverContent.css("overflow-y","auto");
};

/**
 * Function that is called after a shape has been selected
 *
 * @param oEvent viz selectData event that is triggered when the chart has been rendered
 */
sap.ca.ui.charts.Chart.prototype.onSelectData = function (oEvent) {
	var aSelection = this._oInternalVizChart.selection();
	this.oSelectedData = oEvent.getParameter("data");
	var selectedItem = null;
	if (aSelection.length > 0) {
		// set the last selected item
		selectedItem = aSelection[aSelection.length - 1];
		// if single select mode is enabled, the selection is the last selected item
		if (this.getSelectionMode() === sap.ca.ui.charts.ChartSelectionMode.Single.toLowerCase()) {
			aSelection = [ selectedItem ];
			//In the case we have showPopover == true
			if (this.getShowPopover()) {
				//display the detail selection in the popover once the popover is effectively closed
				this._oChartPopover.attachAfterClose(null, jQuery.proxy(this._showDetailInPopover,this), this);
				if (this._oChartPopover.isOpen()) {
					//close the popover if it is opened
					this._oChartPopover.close();
				} else {
					//display the detail selection in the popover  when we click the first time
					this._showDetailInPopover();
				}
			}
		} else  {
			//In the case we have showPopover == true
			if (this.getShowPopover()) {
				//display the detail selection in the popover  when we are in a multiple select mode
				this._showDetailInPopover();
			}
		}
	}
	this.fireSelectDataPoint({
		popover:this._oChartPopover,
		srcEvent:oEvent,
		selection:aSelection,
		selectedItem:selectedItem
	});
};

/**
 * Function that is called after a shape has been deselected
 *
 * @param oEvent viz deselectData event that is triggered when the chart has been rendered
 */
sap.ca.ui.charts.Chart.prototype.onDeselectData = function (oEvent) {
	var aSelection = this._oInternalVizChart.selection();
	var p, q;
	if (this.getShowPopover()) {
		if (aSelection.length == 0) {
			this._oSelectedDataList.reset();
			this._closePopover();
		} else {
			//if single select mode is enabled we do nothing since the reset
			// is already managed by the onSelectData handler
			if (this.getSelectionMode() !== sap.ca.ui.charts.ChartSelectionMode.Single.toLowerCase()) {
				var oData = oEvent.getParameter("data");
				for (p = 0; p < oData.length; p++) {
					for (q = 0; q < oData[p].data.length; q++) {
						if (!oData[p].data[q] || !oData[p].data[q].ctx || !jQuery.isNumeric(oData[p].data[q].val)) {
							continue;
						}

						var oContext = oData[p].data[q].ctx;
						if (oContext.type == 'Measure') {
							var path = oContext.path;
							var sKey = path.dii_a1.toString();
							sKey += path.dii_a2.toString();
							sKey += path.mg.toString();
							sKey += path.mi.toString();
							var vizDataset = this._oInternalVizChart.getDataset().getVIZDataset();
							var dimAxis1 = vizDataset._analysisAxis[0]._dimensionLabels;
							var aGroupKey = [];
							jQuery.each(dimAxis1, function (i, dimension) {
								aGroupKey.push(dimension._values[oContext.path.dii_a1]);
							});

							if (this._oSelectedDataList.getItemIndexFor(aGroupKey, sKey) !== -1) {
								this._oSelectedDataList.removeItemFrom(aGroupKey, sKey);
							}
							if (this._oSelectedDataList.getNumberOfItemsFor(aGroupKey) === 0) {
								this._oSelectedDataList.removeGroup(aGroupKey);
							}
						}
					}
				}
				if (this._oChartPopover.isOpen() && !jQuery.device.is.phone) {
					//If the popover is opened we rerender its content.
					this._invalidatePopover();
				}
			}
		}
	}
	this.fireSelectDataPoint({
		popover:this._oChartPopover,
		srcEvent:oEvent,
		selection:this._oInternalVizChart.selection(),
		selectedItem:null
	});
};

/**
 * Function is called before the rendering of the control is started.
 *
 * Applications must not call this hook method directly, it is called by the framework.
 *
 * Subclasses of Control should override this hook to implement any necessary actions before the rendering.
 *
 * @function
 * @name sap.ui.core.Control.prototype.onBeforeRendering
 * @protected
 */
sap.ca.ui.charts.Chart.prototype.onBeforeRendering = function () {
	this._deregisterEvent();

};

/**
 * Function is called when the rendering of the control is completed.
 *
 * Applications must not call this hook method directly, it is called by the framework.
 *
 * Subclasses of Control should override this hook to implement any necessary actions after the rendering.
 *
 * @function
 * @name sap.ui.core.Control.prototype.onAfterRendering
 * @protected
 */
sap.ca.ui.charts.Chart.prototype.onAfterRendering = function () {

	if (jQuery.device.is.desktop) {
		jQuery(window).bind("resize", jQuery.proxy(this._onResize, this));
	} else {
		sap.ui.Device.orientation.attachHandler(this._onOrientationChange, this);
		sap.ui.Device.resize.attachHandler(this._onResize, this);
	}

	// CSS: 0120031469 0000259259 2014
	jQuery(this._oScrollContainer.getDomRef()).attr("dir","ltr");

};

/**
 * Function to calculate the size of the chart to display.
 * It is based on the vizdataset by looking at the dimension in each analysis axis.
 *
 * The size of the chart is also defined based on the available space in the chart or its container.
 * Special handling is done for the ChartToolbar integration case.
 *
 * @private
 */
sap.ca.ui.charts.Chart.prototype._onResize = function () {
	if (this._sDelayedResize) {
		jQuery.sap.clearIntervalCall(this._sDelayedResize);
	}
	this._sDelayedResize = jQuery.sap.delayedCall(200, this, this._onResizeInt);
};

sap.ca.ui.charts.Chart.prototype._onResizeInt = function () {
	this._oSelectedDataList.reset();
	this._closePopover();

	var dataset = this._oInternalVizChart.getDataset();
	if (!dataset) {
		return;
	}
	var vizDataset = dataset.getVIZDataset();
	var iShapeSize = parseInt(this.getMinShapeSize(), 10);
	if (vizDataset && !vizDataset._emptyDataset && vizDataset._analysisAxis.length > 0) {
		// Number of data point is derived from the multiplication of both analysis axises length.
		var iShapeCount = vizDataset._analysisAxis[0]._dimensionLabels[0]._values.length;
		var iPaddingCount = iShapeCount;
		var iSpacingCount = 0;

		// Handle the rare case where we are in a stacked chart but don't have multiple measure to display...
		if (!this.getStackedChartWidthEnhancer() && vizDataset._analysisAxis[1] != null) {
			iShapeCount *= vizDataset._analysisAxis[1]._dimensionLabels[0]._values.length;
			iSpacingCount = iShapeCount;
		}
		if (!this._vizChartType.stacked) {
			iShapeCount *= vizDataset._measures.length;
			iSpacingCount = iShapeCount * (vizDataset._measures.length - 1);
		}
		var calculatedSize = (iShapeCount * iShapeSize) + (iPaddingCount * iShapeSize) + (iSpacingCount * 4);

		var initialWidth = this.getWidth();
		var initialHeight = this.getHeight();
		var initialWidthI = parseInt(initialWidth, 10);
		var initialHeightI = parseInt(initialHeight, 10);

		if (jQuery.sap.endsWith(initialWidth, "%") || initialWidth == "auto") {
			// Try to read from DomRef if possible at that point
			// Either the domRef exists (cool), or its parent has already been rendered (also cool)
			// Or we need to get the size from the UIArea...
			if (this.getParent() != null && this.getParent().getDomRef() != null && this.$().parents('[class^=sapUiRespGridSpan]').length == 0) {
				var $DomRef = this.$();
				var $PageSection = $DomRef.parents('.sapMPage').first();
				var $ParentSection = $PageSection.children('section').first();
				var hiddenSection = $ParentSection.parents('.sapMNavItemHidden');
				if (hiddenSection.length != 0) {
					hiddenSection.removeClass('sapMNavItemHidden');
				}
				if ($ParentSection.length == 0) {
					$ParentSection = this.getParent().$().parents('section').first();
				}
				if ($ParentSection.length == 0) {
					$ParentSection = $DomRef.parents('body').first();
				}


				var iSectionWidth = $ParentSection.width();
				var iSectionOffsetLeft = 0;
				if ($ParentSection && $ParentSection.offset()) {
					iSectionOffsetLeft = $ParentSection.offset().left;
				}
				var iEltOffsetLeft = 0;
				if ($DomRef && $DomRef.offset()) {
					iEltOffsetLeft = $DomRef.offset().left;
				}

				var iEltOffsetRight = 1;
				// try to find out if there is a padding-bottom / margin-bottom in between here and the section
				var $ParentDom = $DomRef;//this.getParent().$();
				while ($ParentDom != null && $ParentDom.length != 0 && $ParentDom.attr("id") != $ParentSection.attr("id")) {
					var marginRight = parseInt($ParentDom.css("margin-right"), 10);
					var paddingRight = parseInt($ParentDom.css("padding-right"), 10);
					var borderRight = parseInt($ParentDom.css("border-right-width"), 10);
					if (!isNaN(marginRight)) {
						iEltOffsetRight += marginRight;
					}
					if (!isNaN(paddingRight)) {
						iEltOffsetRight += paddingRight;
					}
					if (!isNaN(borderRight)) {
						iEltOffsetRight += borderRight;
					}
					$ParentDom = $ParentDom.parent();
				}
				if (hiddenSection.length != 0) {
					hiddenSection.addClass('sapMNavItemHidden');
				}
				initialWidthI = (iSectionWidth - (iEltOffsetLeft - iSectionOffsetLeft) - iEltOffsetRight);
			} else if (this.$().parents('[class^=sapUiRespGridSpan]').length != 0) {
				initialWidthI = this.$().parents('[class^=sapUiRespGridSpan]').first().width();
			} else if (this.getUIArea()) {
				initialWidthI = jQuery(this.getUIArea().oRootNode).width();
			} else {
				initialWidthI = "800";
			}

			// Apply the actual percent to the size
			initialWidthI = (initialWidthI * parseInt(initialWidth, 10)) / 100;
		}
		if (jQuery.sap.endsWith(initialHeight, "%") || initialHeight == "auto") {
			// Try to read from DomRef if possible at that point
			// Either the domRef exists (cool), or its parent has already been rendered (also cool)
			// When the parent is a VBox though the height will never be set prior to rendering...
			// Or we need to get the size from the UIArea...
			if (this.getParent() != null && this.getParent().getDomRef() != null) {
				var $DomRef = this.$();
				var $PageSection = $DomRef.parents('.sapMPage').first();
				var $ParentSection = $PageSection.children('section').first();
				var hiddenSection = $ParentSection.parents('.sapMNavItemHidden');
				if (hiddenSection.length != 0) {
					hiddenSection.removeClass('sapMNavItemHidden');
				}
				if ($ParentSection.length == 0) {
					$ParentSection = this.getParent().$().parents('section').first();
				}
				if ($ParentSection.length == 0) {
					$ParentSection = $DomRef.parents('body').first();
				}

				//JQuery is rounding the Height which creates scroll bars (1024.20 become 1025)
				var iSectionHeight = $ParentSection.height()  - 2;

				var iSectionOffsetTop = 0;
				if ($ParentSection && $ParentSection.offset()) {
					iSectionOffsetTop = $ParentSection.offset().top;
				}
				var iEltOffsetTop = 0;
				if ($DomRef && $DomRef.offset()) {
					iEltOffsetTop = $DomRef.offset().top;
				}
				var iEltPaddingTop = 0;
				if ($DomRef) {
					iEltPaddingTop = parseInt($DomRef.css("padding-top"), 10);
				}
				var iEltOffsetBottom = 0;
				// try to find out if there is a padding-bottom / margin-bottom in between here and the section
				var $ParentDom = $DomRef;
				while ($ParentDom != null && $ParentDom.length != 0 && $ParentDom.attr("id") != $ParentSection.attr("id")) {
					var marginBottom = parseInt($ParentDom.css("margin-bottom"), 10);
					var paddingBottom = parseInt($ParentDom.css("padding-bottom"), 10);
					var borderBottom = parseInt($ParentDom.css("border-bottom-width"), 10);
					if (!isNaN(marginRight)) {
						iEltOffsetBottom += marginBottom;
					}
					if (!isNaN(paddingBottom)) {
						iEltOffsetBottom += paddingBottom;
					}
					if (!isNaN(borderBottom)) {
						iEltOffsetBottom += borderBottom;
					}
					$ParentDom = $ParentDom.parent();
				}
				if (hiddenSection.length != 0) {
					hiddenSection.addClass('sapMNavItemHidden');
				}


				initialHeightI = (iSectionHeight - (iEltOffsetTop - iSectionOffsetTop) - iEltOffsetBottom - iEltPaddingTop);
			} else if (this.getUIArea()) {
				initialHeightI = jQuery(this.getUIArea().oRootNode).height();
			} else {
				initialHeightI = "480";
			}
			//Fixed margin issue in the sap.m.ScrollContainer for Internet Explorer 11
			if (sap.ui.Device.browser.internet_explorer && sap.ui.Device.browser.version > 10) {
				if (this._oInternalVizChart.$()) {
					var iVizChartMarginTop = parseInt(this._oInternalVizChart.$().css("margin-top"), 10);
					if (!isNaN(iVizChartMarginTop) && iVizChartMarginTop > 0) {
						initialHeightI = initialHeightI - iVizChartMarginTop;
					}
					var iVizChartMarginBottom = parseInt(this._oInternalVizChart.$().css("margin-bottom"), 10);
					if (!isNaN(iVizChartMarginBottom) && iVizChartMarginBottom > 0) {
						initialHeightI = initialHeightI - iVizChartMarginBottom;
					}
				}
			}
			// Apply the actual percent to the size
			if (this.getParent() && this.getParent() instanceof sap.ca.ui.charts.ChartToolBar
				&& parseInt(initialHeight, 10) != 100) {
				// In case the parent is a chart toolbar we need to take that into account when calculating the percentage if different from 100%
				var toolbarHeight = this.getParent().$().find(".sapMBar").height();
				initialHeightI = (((initialHeightI + toolbarHeight) * parseInt(initialHeight, 10)) / 100) - toolbarHeight;
			} else {
				initialHeightI = (initialHeightI * parseInt(initialHeight, 10)) / 100;
			}

		}

		var iScrollbarSize = { height:0, width:0};
		if ($ParentSection) {
			var domParentSection = $ParentSection.get(0);
			if (domParentSection && domParentSection.scrollHeight > domParentSection.clientHeight) {
				iScrollbarSize = jQuery.sap.scrollbarSize();
			}
		}
		if (initialHeightI == 0) {
			// In the event the page does not exist or something go wrong we can have a 0 height, in that case we need to try again.
			initialHeightI = 100;
			// Force rerendering when the page is available
			jQuery.sap.delayedCall(200, this, this.invalidate);
		}
		if (this._vizChartType.scroll.horizontal) {
			if (calculatedSize > initialWidthI) {
				this._oInternalVizChart.setWidth(calculatedSize + "px");
				iScrollbarSize = jQuery.sap.scrollbarSize();
				if (this._oScrollContainer.$()) {
					this._oScrollContainer.$().width(initialWidthI + "px");
				}
			} else {
				this._oInternalVizChart.setWidth(initialWidthI + "px");
			}

			this._oInternalVizChart.setHeight((initialHeightI - iScrollbarSize.height) + "px");
		} else if (this._vizChartType.scroll.vertical) {
			iScrollbarSize =  jQuery.sap.scrollbarSize();
			if (calculatedSize > initialHeightI) {
				this._oInternalVizChart.setHeight(calculatedSize + "px");
				this._oScrollContainer.setHeight(initialHeightI + "px");
				//For the first resize in order to avoid invalidating everything...
				if (this._oScrollContainer.$()) {
					this._oScrollContainer.$().height(initialHeightI + "px");
				}


			} else {
				this._oInternalVizChart.setHeight(initialHeightI + "px");
				this._oScrollContainer.setHeight("100%");
				//For the first resize in order to avoid invalidating everything...
				if (this._oScrollContainer.$()) {
					this._oScrollContainer.$().height("100%");
				}
			}
			this._oInternalVizChart.setWidth((initialWidthI - iScrollbarSize.width) + "px");
		} else { // No scrolling but we still need to give in a correct height
			this._oInternalVizChart.setWidth(initialWidthI + "px");
			this._oInternalVizChart.setHeight(initialHeightI + "px");
		}
		if (this._oInternalVizChart.$()) {
			this._oInternalVizChart.$().height(this._oInternalVizChart.getHeight());
				 this._oInternalVizChart.$().width(this._oInternalVizChart.getWidth());
   }
	} else if (!vizDataset || vizDataset._emptyDataset) { // if there is no data, then there must be no VIZDataset. Charts will render "no data" then.
		this._oScrollContainer.setHeight("100%");
		this._oScrollContainer.setWidth("100%");
		if (this._oScrollContainer.$()) {
			this._oScrollContainer.$().height("100%");
			this._oScrollContainer.$().width("100%");
		}
		this._oInternalVizChart.setWidth("100%");
		this._oInternalVizChart.setHeight('100%');
		if (this._oInternalVizChart.$()) {
			this._oInternalVizChart.$().height('100%');
			this._oInternalVizChart.$().width("100%");
		}
	}

};

/**
 * Handler for the mobile orientationchange.
 * We just make sure that the chart is being resized properly !
 * @private
 */
sap.ca.ui.charts.Chart.prototype._onOrientationChange = function (oEvent) {
	var bIsLandscape = oEvent.landscape;
	if (this._vizChartType.scroll.horizontal) {
		if (bIsLandscape) {
			//Reinitialize the width of the internal scroll container when the new orientation is landscape
			if (this._oScrollContainer.$()) {
				this._oScrollContainer.$().width("100%");
			}
		}
	}
	this._onResize();
};

/**
 * setter for subHeader in the Popover.
 *
 * @param {sap.m.Bar} oSubHeader new value for sub header
 * @public
 * @name sap.ca.ui.charts.Chart#setPopoverSubHeader
 * @function
 */
sap.ca.ui.charts.Chart.prototype.setPopoverSubHeader = function (oSubHeader) {
	if (oSubHeader && oSubHeader instanceof sap.m.Bar) {
		this._oChartPopover.setSubHeader(oSubHeader);
	}
};

/**
 * setter for footer in the Popover.
 *
 * @param {sap.m.Bar} oFooter new value for footer
 * @public
 * @name sap.ca.ui.charts.Chart#setPopoverFooter
 * @function
 */
sap.ca.ui.charts.Chart.prototype.setPopoverFooter = function (oFooter) {
	if (oFooter) {
		if (oFooter instanceof sap.m.Bar) {
			if (!jQuery.device.is.phone) {
				this._oChartPopover._oControl.setFooter(oFooter);
			} else {
				var oPage = new sap.m.Page({
					showHeader:false,
					showFooter:true,
					footer:oFooter,
					content:[this._oSelectedDataList.getControl()]
				});
				this._oChartPopover.destroyContent();
				this._oChartPopover.addContent(oPage);
			}
		}
		else if (oFooter instanceof sap.ui.core.Control) {
			if (!jQuery.device.is.phone) {
				this._oChartPopover.addContent(oFooter);
			} else {
				oFooter.addStyleClass('sapCaUiPopOverFooter');
				var oPage = new sap.m.Page({
					showHeader:false,
					showFooter:false,
					content:[this._oSelectedDataList.getControl(), oFooter]
				});
				this._oChartPopover.destroyContent();
				this._oChartPopover.addContent(oPage);
			}
		}
	}
};


/**
 * setter for aggregation noData in Viz Chart.
 *Control tree to display when there is no data available
 * @param {sap.ui.core.Control} oControl new value for aggregation noData
 * @public
 * @name sap.ca.ui.charts.Chart#setNoData
 * @function
 */
sap.ca.ui.charts.Chart.prototype.setNoData = function (oControl) {
	this._oInternalVizChart.setNoData(oControl);
	return this;
};
/**
 * Getter for aggregation noData in Viz Chart.
 * Control tree to display when there is no data available
 *
 * @return {sap.ui.core.Control} the value for aggregation noData
 * @public
 * @name sap.ca.ui.charts.Chart#getNoData
 * @function
 */
sap.ca.ui.charts.Chart.prototype.getNoData = function () {
	return this._oInternalVizChart.getNoData();
};

