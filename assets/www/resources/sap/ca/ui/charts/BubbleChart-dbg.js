/*!
 * SAP UI development toolkit for HTML5 (SAPUI5) (c) Copyright 2009-2014 SAP SE. All rights reserved
 */

/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.control, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides control sap.ca.ui.charts.BubbleChart.
jQuery.sap.declare("sap.ca.ui.charts.BubbleChart");
jQuery.sap.require("sap.ca.ui.library");
jQuery.sap.require("sap.ca.ui.charts.Chart");


/**
 * Constructor for a new charts/BubbleChart.
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
 * <li>{@link #getDataLabelFormat dataLabelFormat} : any</li>
 * <li>{@link #getShowTitle showTitle} : boolean (default: false)</li>
 * <li>{@link #getShowXAxisLabel showXAxisLabel} : boolean (default: true)</li>
 * <li>{@link #getXAxisFixedRange xAxisFixedRange} : boolean (default: false)</li>
 * <li>{@link #getXAxisMinValue xAxisMinValue} : float (default: 0)</li>
 * <li>{@link #getXAxisMaxValue xAxisMaxValue} : float (default: 0)</li>
 * <li>{@link #getShowYAxisLabel showYAxisLabel} : boolean (default: true)</li>
 * <li>{@link #getYAxisFixedRange yAxisFixedRange} : boolean (default: false)</li>
 * <li>{@link #getYAxisMinValue yAxisMinValue} : float (default: 0)</li>
 * <li>{@link #getYAxisMaxValue yAxisMaxValue} : float (default: 0)</li>
 * <li>{@link #getMinimumLabelSize minimumLabelSize} : int (default: 60)</li>
 * <li>{@link #getShowSizeLegend showSizeLegend} : boolean (default: false)</li>
 * <li>{@link #getXAxisTitle xAxisTitle} : string</li>
 * <li>{@link #getYAxisTitle yAxisTitle} : string</li>
 * <li>{@link #getShowCustomLabels showCustomLabels} : boolean (default: false)</li>
 * <li>{@link #getLabelProperty labelProperty} : object</li>
 * <li>{@link #getXAxisFormatFunction xAxisFormatFunction} : object</li>
 * <li>{@link #getXAxisFormatString xAxisFormatString} : string</li>
 * <li>{@link #getYAxisFormatFunction yAxisFormatFunction} : object</li>
 * <li>{@link #getYAxisFormatString yAxisFormatString} : string</li>
 * <li>{@link #getAxisTooltipFormatString axisTooltipFormatString} : any</li>
 * <li>{@link #getAxisFormatFunction axisFormatFunction} : object</li></ul>
 * </li>
 * <li>Aggregations
 * <ul>
 * <li>{@link #getContent content} : sap.ui.core.Control[]</li></ul>
 * </li>
 * <li>Associations
 * <ul></ul>
 * </li>
 * <li>Events
 * <ul></ul>
 * </li>
 * </ul> 
 *
 * 
 * In addition, all settings applicable to the base type {@link sap.ca.ui.charts.Chart#constructor sap.ca.ui.charts.Chart}
 * can be used as well.
 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given 
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * 
 * Bubble chart.
 * @extends sap.ca.ui.charts.Chart
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
 * @name sap.ca.ui.charts.BubbleChart
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ca.ui.charts.Chart.extend("sap.ca.ui.charts.BubbleChart", { metadata : {

	deprecated : true,
	library : "sap.ca.ui",
	properties : {

		/**
		 * Defines the formater string for the dataLabel value to be displayed on the bubble
		 * @deprecated Since version 7.20.0. 
		 * This method is deprecated now. Use the dataLabelFormatter for any formatting of data label
		 */
		"dataLabelFormat" : {type : "any", group : "Appearance", defaultValue : null, deprecated: true},

		/**
		 * Flag to display the title for the chart, default is set to false
		 */
		"showTitle" : {type : "boolean", group : "Appearance", defaultValue : false},

		/**
		 * Flag to set the visibility of x-axis label, default is set to true.
		 */
		"showXAxisLabel" : {type : "boolean", group : "Appearance", defaultValue : true},

		/**
		 * Flag to define x-axis scale range.
		 */
		"xAxisFixedRange" : {type : "boolean", group : "Appearance", defaultValue : false},

		/**
		 * Define the minimum value for x-axis scale
		 */
		"xAxisMinValue" : {type : "float", group : "Appearance", defaultValue : 0},

		/**
		 * Define the max value for x-axis scale
		 */
		"xAxisMaxValue" : {type : "float", group : "Appearance", defaultValue : 0},

		/**
		 * Flag to set the visibility of y-axis label, default is set to true.
		 */
		"showYAxisLabel" : {type : "boolean", group : "Appearance", defaultValue : true},

		/**
		 * Flag to define y-axis scale range.
		 */
		"yAxisFixedRange" : {type : "boolean", group : "Appearance", defaultValue : false},

		/**
		 * Define the minimum value for y-axis scale
		 */
		"yAxisMinValue" : {type : "float", group : "Appearance", defaultValue : 0},

		/**
		 * Define the max value for y-axis scale
		 */
		"yAxisMaxValue" : {type : "float", group : "Appearance", defaultValue : 0},

		/**
		 * The minimum size of the bubble before a label gets displayed
		 */
		"minimumLabelSize" : {type : "int", group : "Appearance", defaultValue : 60},

		/**
		 * Show / Hide the visibility the size legend of the chart
		 */
		"showSizeLegend" : {type : "boolean", group : "Appearance", defaultValue : false},

		/**
		 * Set x-axis title
		 */
		"xAxisTitle" : {type : "string", group : "Appearance", defaultValue : null},

		/**
		 * Set y-axis title
		 */
		"yAxisTitle" : {type : "string", group : "Appearance", defaultValue : null},

		/**
		 * Flag to show custom data labels
		 */
		"showCustomLabels" : {type : "boolean", group : "Appearance", defaultValue : false},

		/**
		 * Set the binding property values for the labels as array eg. ['property1','property2']. Only 2 labels are supported.
		 */
		"labelProperty" : {type : "object", group : "Appearance", defaultValue : null},

		/**
		 * Set the formatter function for the x-axis.
		 * @deprecated Since version 7.20.0. 
		 * This method is deprecated now. Use the xAxisLabelFormatter for any formatting of the axis labels
		 */
		"xAxisFormatFunction" : {type : "object", group : "Appearance", defaultValue : null, deprecated: true},

		/**
		 * Set the format string for x-axis
		 * @deprecated Since version 7.20.0. 
		 * This method is deprecated now. Use the xAxisLabelFormatter for any formatting of the axis labels
		 */
		"xAxisFormatString" : {type : "string", group : "Appearance", defaultValue : null, deprecated: true},

		/**
		 * Set the formatter function for the y-axis.
		 * @deprecated Since version 7.20.0. 
		 * This method is deprecated now. Use the yAxisLabelFormatter for any formatting of the axis labels
		 */
		"yAxisFormatFunction" : {type : "object", group : "Appearance", defaultValue : null, deprecated: true},

		/**
		 * Set the format string for y-axis
		 * @deprecated Since version 7.20.0. 
		 * This method is deprecated now. Use the yAxisLabelFormatter for any formatting of the axis labels
		 */
		"yAxisFormatString" : {type : "string", group : "Appearance", defaultValue : null, deprecated: true},

		/**
		 * Flag to set the formatting of the tooltip on x-axis
		 * @deprecated Since version 7.20.0. 
		 * This method is deprecated now. Use the plotAreaAxisTooltipFormatter
		 */
		"axisTooltipFormatString" : {type : "any", group : "Appearance", defaultValue : null, deprecated: true},

		/**
		 * Set the formatter function for the axis labels or tooltips
		 * @deprecated Since version 7.20.0. 
		 * This method is deprecated now. Use the plotAreaAxisTooltipFormatter
		 */
		"axisFormatFunction" : {type : "object", group : "Appearance", defaultValue : null, deprecated: true}
	},
	aggregations : {

		/**
		 * Deprecated aggregation, do not use. Left for compatibility purposes.
		 * @deprecated Since version 7.20.0. 
		 * This method is deprecated now.
		 */
		"content" : {type : "sap.ui.core.Control", multiple : true, singularName : "content", deprecated: true}
	}
}});


/**
 * Creates a new subclass of class sap.ca.ui.charts.BubbleChart with name <code>sClassName</code> 
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
 * @name sap.ca.ui.charts.BubbleChart.extend
 * @function
 */


/**
 * Getter for property <code>dataLabelFormat</code>.
 * Defines the formater string for the dataLabel value to be displayed on the bubble
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {any} the value of property <code>dataLabelFormat</code>
 * @public
 * @deprecated Since version 7.20.0. 
 * This method is deprecated now. Use the dataLabelFormatter for any formatting of data label
 * @name sap.ca.ui.charts.BubbleChart#getDataLabelFormat
 * @function
 */

/**
 * Setter for property <code>dataLabelFormat</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {any} oDataLabelFormat  new value for property <code>dataLabelFormat</code>
 * @return {sap.ca.ui.charts.BubbleChart} <code>this</code> to allow method chaining
 * @public
 * @deprecated Since version 7.20.0. 
 * This method is deprecated now. Use the dataLabelFormatter for any formatting of data label
 * @name sap.ca.ui.charts.BubbleChart#setDataLabelFormat
 * @function
 */


/**
 * Getter for property <code>showTitle</code>.
 * Flag to display the title for the chart, default is set to false
 *
 * Default value is <code>false</code>
 *
 * @return {boolean} the value of property <code>showTitle</code>
 * @public
 * @name sap.ca.ui.charts.BubbleChart#getShowTitle
 * @function
 */

/**
 * Setter for property <code>showTitle</code>.
 *
 * Default value is <code>false</code> 
 *
 * @param {boolean} bShowTitle  new value for property <code>showTitle</code>
 * @return {sap.ca.ui.charts.BubbleChart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.BubbleChart#setShowTitle
 * @function
 */


/**
 * Getter for property <code>showXAxisLabel</code>.
 * Flag to set the visibility of x-axis label, default is set to true.
 *
 * Default value is <code>true</code>
 *
 * @return {boolean} the value of property <code>showXAxisLabel</code>
 * @public
 * @name sap.ca.ui.charts.BubbleChart#getShowXAxisLabel
 * @function
 */

/**
 * Setter for property <code>showXAxisLabel</code>.
 *
 * Default value is <code>true</code> 
 *
 * @param {boolean} bShowXAxisLabel  new value for property <code>showXAxisLabel</code>
 * @return {sap.ca.ui.charts.BubbleChart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.BubbleChart#setShowXAxisLabel
 * @function
 */


/**
 * Getter for property <code>xAxisFixedRange</code>.
 * Flag to define x-axis scale range.
 *
 * Default value is <code>false</code>
 *
 * @return {boolean} the value of property <code>xAxisFixedRange</code>
 * @public
 * @name sap.ca.ui.charts.BubbleChart#getXAxisFixedRange
 * @function
 */

/**
 * Setter for property <code>xAxisFixedRange</code>.
 *
 * Default value is <code>false</code> 
 *
 * @param {boolean} bXAxisFixedRange  new value for property <code>xAxisFixedRange</code>
 * @return {sap.ca.ui.charts.BubbleChart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.BubbleChart#setXAxisFixedRange
 * @function
 */


/**
 * Getter for property <code>xAxisMinValue</code>.
 * Define the minimum value for x-axis scale
 *
 * Default value is <code>0</code>
 *
 * @return {float} the value of property <code>xAxisMinValue</code>
 * @public
 * @name sap.ca.ui.charts.BubbleChart#getXAxisMinValue
 * @function
 */

/**
 * Setter for property <code>xAxisMinValue</code>.
 *
 * Default value is <code>0</code> 
 *
 * @param {float} fXAxisMinValue  new value for property <code>xAxisMinValue</code>
 * @return {sap.ca.ui.charts.BubbleChart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.BubbleChart#setXAxisMinValue
 * @function
 */


/**
 * Getter for property <code>xAxisMaxValue</code>.
 * Define the max value for x-axis scale
 *
 * Default value is <code>0</code>
 *
 * @return {float} the value of property <code>xAxisMaxValue</code>
 * @public
 * @name sap.ca.ui.charts.BubbleChart#getXAxisMaxValue
 * @function
 */

/**
 * Setter for property <code>xAxisMaxValue</code>.
 *
 * Default value is <code>0</code> 
 *
 * @param {float} fXAxisMaxValue  new value for property <code>xAxisMaxValue</code>
 * @return {sap.ca.ui.charts.BubbleChart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.BubbleChart#setXAxisMaxValue
 * @function
 */


/**
 * Getter for property <code>showYAxisLabel</code>.
 * Flag to set the visibility of y-axis label, default is set to true.
 *
 * Default value is <code>true</code>
 *
 * @return {boolean} the value of property <code>showYAxisLabel</code>
 * @public
 * @name sap.ca.ui.charts.BubbleChart#getShowYAxisLabel
 * @function
 */

/**
 * Setter for property <code>showYAxisLabel</code>.
 *
 * Default value is <code>true</code> 
 *
 * @param {boolean} bShowYAxisLabel  new value for property <code>showYAxisLabel</code>
 * @return {sap.ca.ui.charts.BubbleChart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.BubbleChart#setShowYAxisLabel
 * @function
 */


/**
 * Getter for property <code>yAxisFixedRange</code>.
 * Flag to define y-axis scale range.
 *
 * Default value is <code>false</code>
 *
 * @return {boolean} the value of property <code>yAxisFixedRange</code>
 * @public
 * @name sap.ca.ui.charts.BubbleChart#getYAxisFixedRange
 * @function
 */

/**
 * Setter for property <code>yAxisFixedRange</code>.
 *
 * Default value is <code>false</code> 
 *
 * @param {boolean} bYAxisFixedRange  new value for property <code>yAxisFixedRange</code>
 * @return {sap.ca.ui.charts.BubbleChart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.BubbleChart#setYAxisFixedRange
 * @function
 */


/**
 * Getter for property <code>yAxisMinValue</code>.
 * Define the minimum value for y-axis scale
 *
 * Default value is <code>0</code>
 *
 * @return {float} the value of property <code>yAxisMinValue</code>
 * @public
 * @name sap.ca.ui.charts.BubbleChart#getYAxisMinValue
 * @function
 */

/**
 * Setter for property <code>yAxisMinValue</code>.
 *
 * Default value is <code>0</code> 
 *
 * @param {float} fYAxisMinValue  new value for property <code>yAxisMinValue</code>
 * @return {sap.ca.ui.charts.BubbleChart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.BubbleChart#setYAxisMinValue
 * @function
 */


/**
 * Getter for property <code>yAxisMaxValue</code>.
 * Define the max value for y-axis scale
 *
 * Default value is <code>0</code>
 *
 * @return {float} the value of property <code>yAxisMaxValue</code>
 * @public
 * @name sap.ca.ui.charts.BubbleChart#getYAxisMaxValue
 * @function
 */

/**
 * Setter for property <code>yAxisMaxValue</code>.
 *
 * Default value is <code>0</code> 
 *
 * @param {float} fYAxisMaxValue  new value for property <code>yAxisMaxValue</code>
 * @return {sap.ca.ui.charts.BubbleChart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.BubbleChart#setYAxisMaxValue
 * @function
 */


/**
 * Getter for property <code>minimumLabelSize</code>.
 * The minimum size of the bubble before a label gets displayed
 *
 * Default value is <code>60</code>
 *
 * @return {int} the value of property <code>minimumLabelSize</code>
 * @public
 * @name sap.ca.ui.charts.BubbleChart#getMinimumLabelSize
 * @function
 */

/**
 * Setter for property <code>minimumLabelSize</code>.
 *
 * Default value is <code>60</code> 
 *
 * @param {int} iMinimumLabelSize  new value for property <code>minimumLabelSize</code>
 * @return {sap.ca.ui.charts.BubbleChart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.BubbleChart#setMinimumLabelSize
 * @function
 */


/**
 * Getter for property <code>showSizeLegend</code>.
 * Show / Hide the visibility the size legend of the chart
 *
 * Default value is <code>false</code>
 *
 * @return {boolean} the value of property <code>showSizeLegend</code>
 * @public
 * @name sap.ca.ui.charts.BubbleChart#getShowSizeLegend
 * @function
 */

/**
 * Setter for property <code>showSizeLegend</code>.
 *
 * Default value is <code>false</code> 
 *
 * @param {boolean} bShowSizeLegend  new value for property <code>showSizeLegend</code>
 * @return {sap.ca.ui.charts.BubbleChart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.BubbleChart#setShowSizeLegend
 * @function
 */


/**
 * Getter for property <code>xAxisTitle</code>.
 * Set x-axis title
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {string} the value of property <code>xAxisTitle</code>
 * @public
 * @name sap.ca.ui.charts.BubbleChart#getXAxisTitle
 * @function
 */

/**
 * Setter for property <code>xAxisTitle</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {string} sXAxisTitle  new value for property <code>xAxisTitle</code>
 * @return {sap.ca.ui.charts.BubbleChart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.BubbleChart#setXAxisTitle
 * @function
 */


/**
 * Getter for property <code>yAxisTitle</code>.
 * Set y-axis title
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {string} the value of property <code>yAxisTitle</code>
 * @public
 * @name sap.ca.ui.charts.BubbleChart#getYAxisTitle
 * @function
 */

/**
 * Setter for property <code>yAxisTitle</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {string} sYAxisTitle  new value for property <code>yAxisTitle</code>
 * @return {sap.ca.ui.charts.BubbleChart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.BubbleChart#setYAxisTitle
 * @function
 */


/**
 * Getter for property <code>showCustomLabels</code>.
 * Flag to show custom data labels
 *
 * Default value is <code>false</code>
 *
 * @return {boolean} the value of property <code>showCustomLabels</code>
 * @public
 * @name sap.ca.ui.charts.BubbleChart#getShowCustomLabels
 * @function
 */

/**
 * Setter for property <code>showCustomLabels</code>.
 *
 * Default value is <code>false</code> 
 *
 * @param {boolean} bShowCustomLabels  new value for property <code>showCustomLabels</code>
 * @return {sap.ca.ui.charts.BubbleChart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.BubbleChart#setShowCustomLabels
 * @function
 */


/**
 * Getter for property <code>labelProperty</code>.
 * Set the binding property values for the labels as array eg. ['property1','property2']. Only 2 labels are supported.
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {object} the value of property <code>labelProperty</code>
 * @public
 * @name sap.ca.ui.charts.BubbleChart#getLabelProperty
 * @function
 */

/**
 * Setter for property <code>labelProperty</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {object} oLabelProperty  new value for property <code>labelProperty</code>
 * @return {sap.ca.ui.charts.BubbleChart} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.BubbleChart#setLabelProperty
 * @function
 */


/**
 * Getter for property <code>xAxisFormatFunction</code>.
 * Set the formatter function for the x-axis.
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {object} the value of property <code>xAxisFormatFunction</code>
 * @public
 * @deprecated Since version 7.20.0. 
 * This method is deprecated now. Use the xAxisLabelFormatter for any formatting of the axis labels
 * @name sap.ca.ui.charts.BubbleChart#getXAxisFormatFunction
 * @function
 */

/**
 * Setter for property <code>xAxisFormatFunction</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {object} oXAxisFormatFunction  new value for property <code>xAxisFormatFunction</code>
 * @return {sap.ca.ui.charts.BubbleChart} <code>this</code> to allow method chaining
 * @public
 * @deprecated Since version 7.20.0. 
 * This method is deprecated now. Use the xAxisLabelFormatter for any formatting of the axis labels
 * @name sap.ca.ui.charts.BubbleChart#setXAxisFormatFunction
 * @function
 */


/**
 * Getter for property <code>xAxisFormatString</code>.
 * Set the format string for x-axis
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {string} the value of property <code>xAxisFormatString</code>
 * @public
 * @deprecated Since version 7.20.0. 
 * This method is deprecated now. Use the xAxisLabelFormatter for any formatting of the axis labels
 * @name sap.ca.ui.charts.BubbleChart#getXAxisFormatString
 * @function
 */

/**
 * Setter for property <code>xAxisFormatString</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {string} sXAxisFormatString  new value for property <code>xAxisFormatString</code>
 * @return {sap.ca.ui.charts.BubbleChart} <code>this</code> to allow method chaining
 * @public
 * @deprecated Since version 7.20.0. 
 * This method is deprecated now. Use the xAxisLabelFormatter for any formatting of the axis labels
 * @name sap.ca.ui.charts.BubbleChart#setXAxisFormatString
 * @function
 */


/**
 * Getter for property <code>yAxisFormatFunction</code>.
 * Set the formatter function for the y-axis.
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {object} the value of property <code>yAxisFormatFunction</code>
 * @public
 * @deprecated Since version 7.20.0. 
 * This method is deprecated now. Use the yAxisLabelFormatter for any formatting of the axis labels
 * @name sap.ca.ui.charts.BubbleChart#getYAxisFormatFunction
 * @function
 */

/**
 * Setter for property <code>yAxisFormatFunction</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {object} oYAxisFormatFunction  new value for property <code>yAxisFormatFunction</code>
 * @return {sap.ca.ui.charts.BubbleChart} <code>this</code> to allow method chaining
 * @public
 * @deprecated Since version 7.20.0. 
 * This method is deprecated now. Use the yAxisLabelFormatter for any formatting of the axis labels
 * @name sap.ca.ui.charts.BubbleChart#setYAxisFormatFunction
 * @function
 */


/**
 * Getter for property <code>yAxisFormatString</code>.
 * Set the format string for y-axis
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {string} the value of property <code>yAxisFormatString</code>
 * @public
 * @deprecated Since version 7.20.0. 
 * This method is deprecated now. Use the yAxisLabelFormatter for any formatting of the axis labels
 * @name sap.ca.ui.charts.BubbleChart#getYAxisFormatString
 * @function
 */

/**
 * Setter for property <code>yAxisFormatString</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {string} sYAxisFormatString  new value for property <code>yAxisFormatString</code>
 * @return {sap.ca.ui.charts.BubbleChart} <code>this</code> to allow method chaining
 * @public
 * @deprecated Since version 7.20.0. 
 * This method is deprecated now. Use the yAxisLabelFormatter for any formatting of the axis labels
 * @name sap.ca.ui.charts.BubbleChart#setYAxisFormatString
 * @function
 */


/**
 * Getter for property <code>axisTooltipFormatString</code>.
 * Flag to set the formatting of the tooltip on x-axis
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {any} the value of property <code>axisTooltipFormatString</code>
 * @public
 * @deprecated Since version 7.20.0. 
 * This method is deprecated now. Use the plotAreaAxisTooltipFormatter
 * @name sap.ca.ui.charts.BubbleChart#getAxisTooltipFormatString
 * @function
 */

/**
 * Setter for property <code>axisTooltipFormatString</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {any} oAxisTooltipFormatString  new value for property <code>axisTooltipFormatString</code>
 * @return {sap.ca.ui.charts.BubbleChart} <code>this</code> to allow method chaining
 * @public
 * @deprecated Since version 7.20.0. 
 * This method is deprecated now. Use the plotAreaAxisTooltipFormatter
 * @name sap.ca.ui.charts.BubbleChart#setAxisTooltipFormatString
 * @function
 */


/**
 * Getter for property <code>axisFormatFunction</code>.
 * Set the formatter function for the axis labels or tooltips
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {object} the value of property <code>axisFormatFunction</code>
 * @public
 * @deprecated Since version 7.20.0. 
 * This method is deprecated now. Use the plotAreaAxisTooltipFormatter
 * @name sap.ca.ui.charts.BubbleChart#getAxisFormatFunction
 * @function
 */

/**
 * Setter for property <code>axisFormatFunction</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {object} oAxisFormatFunction  new value for property <code>axisFormatFunction</code>
 * @return {sap.ca.ui.charts.BubbleChart} <code>this</code> to allow method chaining
 * @public
 * @deprecated Since version 7.20.0. 
 * This method is deprecated now. Use the plotAreaAxisTooltipFormatter
 * @name sap.ca.ui.charts.BubbleChart#setAxisFormatFunction
 * @function
 */


/**
 * Getter for aggregation <code>content</code>.<br/>
 * Deprecated aggregation, do not use. Left for compatibility purposes.
 * 
 * @return {sap.ui.core.Control[]}
 * @public
 * @deprecated Since version 7.20.0. 
 * This method is deprecated now.
 * @name sap.ca.ui.charts.BubbleChart#getContent
 * @function
 */


/**
 * Inserts a content into the aggregation named <code>content</code>.
 *
 * @param {sap.ui.core.Control}
 *          oContent the content to insert; if empty, nothing is inserted
 * @param {int}
 *             iIndex the <code>0</code>-based index the content should be inserted at; for 
 *             a negative value of <code>iIndex</code>, the content is inserted at position 0; for a value 
 *             greater than the current size of the aggregation, the content is inserted at 
 *             the last position        
 * @return {sap.ca.ui.charts.BubbleChart} <code>this</code> to allow method chaining
 * @public
 * @deprecated Since version 7.20.0. 
 * This method is deprecated now.
 * @name sap.ca.ui.charts.BubbleChart#insertContent
 * @function
 */

/**
 * Adds some content <code>oContent</code> 
 * to the aggregation named <code>content</code>.
 *
 * @param {sap.ui.core.Control}
 *            oContent the content to add; if empty, nothing is inserted
 * @return {sap.ca.ui.charts.BubbleChart} <code>this</code> to allow method chaining
 * @public
 * @deprecated Since version 7.20.0. 
 * This method is deprecated now.
 * @name sap.ca.ui.charts.BubbleChart#addContent
 * @function
 */

/**
 * Removes an content from the aggregation named <code>content</code>.
 *
 * @param {int | string | sap.ui.core.Control} vContent the content to remove or its index or id
 * @return {sap.ui.core.Control} the removed content or null
 * @public
 * @deprecated Since version 7.20.0. 
 * This method is deprecated now.
 * @name sap.ca.ui.charts.BubbleChart#removeContent
 * @function
 */

/**
 * Removes all the controls in the aggregation named <code>content</code>.<br/>
 * Additionally unregisters them from the hosting UIArea.
 * @return {sap.ui.core.Control[]} an array of the removed elements (might be empty)
 * @public
 * @deprecated Since version 7.20.0. 
 * This method is deprecated now.
 * @name sap.ca.ui.charts.BubbleChart#removeAllContent
 * @function
 */

/**
 * Checks for the provided <code>sap.ui.core.Control</code> in the aggregation named <code>content</code> 
 * and returns its index if found or -1 otherwise.
 *
 * @param {sap.ui.core.Control}
 *            oContent the content whose index is looked for.
 * @return {int} the index of the provided control in the aggregation if found, or -1 otherwise
 * @public
 * @deprecated Since version 7.20.0. 
 * This method is deprecated now.
 * @name sap.ca.ui.charts.BubbleChart#indexOfContent
 * @function
 */
	

/**
 * Destroys all the content in the aggregation 
 * named <code>content</code>.
 * @return {sap.ca.ui.charts.BubbleChart} <code>this</code> to allow method chaining
 * @public
 * @deprecated Since version 7.20.0. 
 * This method is deprecated now.
 * @name sap.ca.ui.charts.BubbleChart#destroyContent
 * @function
 */

// Start of sap/ca/ui/charts/BubbleChart.js
/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
///**
// * This file defines behavior for the control,
// */
/*global d3 *///declare unusual global vars for JSLint/SAPUI5 validation
sap.ca.ui.charts.BubbleChart.prototype.init = function () {

	sap.ca.ui.charts.Chart.prototype.init.apply(this);
	this.setChartType("Bubble");
	this.setProperty("showSizeLegend", this.getShowSizeLegend());

	this.sId = this.getId();
	this._aVerticalLines = [];
};

sap.ca.ui.charts.BubbleChart.prototype._getChartSettings = function () {

	var genericChartSettings = sap.ca.ui.charts.Chart.prototype._getChartSettings.call(this);
	var specificBubbleSettings = {
		sizeLegend:{
			visible:this.getShowLegend()
		},
		xAxis:{
			title:{
				visible:true,
				text:this.getXAxisTitle()
			},
			label:{
				visible:this.getShowXAxisLabel(),
				formatString:this.getXAxisFormatString()
			},
			scale:{
				fixedRange:this.getXAxisFixedRange(),
				minValue:this.getXAxisMinValue(),
				maxValue:this.getXAxisMaxValue()
			}
		},
		yAxis:{
			title:{
				visible:true,
				text:this.getYAxisTitle()
			},
			label:{
				visible:this.getShowYAxisLabel(),
				formatString:this.getYAxisFormatString()
			},
			scale:{
				fixedRange:this.getYAxisFixedRange(),
				minValue:this.getYAxisMinValue(),
				maxValue:this.getYAxisMaxValue()
			}
		},
		plotArea:{
			axisTooltip:{
				formatString:this.getAxisTooltipFormatString()
			}
		},
		dataLabel:{
			visible:this.getShowDataLabel(),
			formatString:this.getDataLabelFormat()
		}
	};
	return jQuery.extend(true, genericChartSettings, specificBubbleSettings);
};

sap.ca.ui.charts.BubbleChart.prototype.setXAxisFixedRange = function (bValue) {
	this._oInternalVizChart.getXAxis().getScale().setFixedRange(bValue);
	this.setProperty("xAxisFixedRange", bValue);
};

sap.ca.ui.charts.BubbleChart.prototype.setYAxisFixedRange = function (bValue) {
	this._oInternalVizChart.getYAxis().getScale().setFixedRange(bValue);
	this.setProperty("yAxisFixedRange", bValue);
};

sap.ca.ui.charts.BubbleChart.prototype.setXAxisMinValue = function (iValue) {
	this._oInternalVizChart.getXAxis().getScale().setMinValue(iValue);
	this.setProperty("xAxisMinValue", iValue);
};

sap.ca.ui.charts.BubbleChart.prototype.setYAxisMinValue = function (iValue) {
	this._oInternalVizChart.getYAxis().getScale().setMinValue(iValue);
	this.setProperty("yAxisMinValue", iValue);
};

sap.ca.ui.charts.BubbleChart.prototype.setXAxisMaxValue = function (iValue) {
	this._oInternalVizChart.getXAxis().getScale().setMaxValue(iValue);
	this.setProperty("xAxisMaxValue", iValue);
};

sap.ca.ui.charts.BubbleChart.prototype.setYAxisMaxValue = function (iValue) {
	this._oInternalVizChart.getYAxis().getScale().setMaxValue(iValue);
	this.setProperty("yAxisMaxValue", iValue);
};

sap.ca.ui.charts.BubbleChart.prototype.setXAxisTitle = function (sValue) {
	this._oInternalVizChart.getXAxis().getTitle().setText(sValue);
	this.setProperty("xAxisTitle", sValue);
};

sap.ca.ui.charts.BubbleChart.prototype.setYAxisTitle = function (sValue) {
	this._oInternalVizChart.getYAxis().getTitle().setText(sValue);
	this.setProperty("yAxisTitle", sValue);
};

sap.ca.ui.charts.BubbleChart.prototype.setShowXAxisLabel = function (bValue) {
	this._oInternalVizChart.getXAxis().getLabel().setVisible(bValue);
	this.setProperty("xAxisLabel", bValue);
};

sap.ca.ui.charts.BubbleChart.prototype.setShowYAxisLabel = function (bValue) {
	this._oInternalVizChart.getYAxis().getLabel().setVisible(bValue);
	this.setProperty("yAxisLabel", bValue);
};

sap.ca.ui.charts.BubbleChart.prototype.setDataLabelFormat = function (aFormat) {
	this._oInternalVizChart.getDataLabel().setFormatString(aFormat);
	this.setProperty("dataLabelFormat", aFormat);
};

sap.ca.ui.charts.BubbleChart.prototype.getDataLabelFormat = function () {
	if (!this.getProperty("dataLabelFormat")) {
		return this.getProperty("dataLabelFormatter");
	}
	jQuery.sap.log.warning("dataLabelFormat property is deprecated. Please use dataLabelFormatter.");
	return this.getProperty("dataLabelFormat");
};

sap.ca.ui.charts.BubbleChart.prototype.setShowSizeLegend = function (bShowSizeLegend) {
	this.setProperty("showSizeLegend", bShowSizeLegend);
	if (this._oInternalVizChart) {
		this._oInternalVizChart.getSizeLegend().setVisible(bShowSizeLegend);
	}
	return this;
};

sap.ca.ui.charts.BubbleChart.prototype.formatDataLabel = function (oEvent) {
	var aLabelProperties = this.getLabelProperty();
	if (!aLabelProperties || aLabelProperties.length == 0) {
		jQuery.sap.log.debug("BubbleChart: formatDataLabel not possible without defined properties ; use setLabelProperty(['prop1', 'prop2'])");
		if (this.getShowCustomLabels() && this.getShowDataLabel()) {
			jQuery.sap.log.error("showCustomLabels and showDataLabel should not be true at the same time");
		}
		return;
	}

	var oChartElt = d3.select(jQuery.sap.byId(this.getId()).children()[0]).select('.v-m-root');
	oChartElt.selectAll('.sapBubbleTxt').remove();

	if (this._oInternalVizChart.getDataset() && this.aData.length > 0) {
		oChartElt = d3.select(jQuery.sap.byId(this.getId()).children()[0]).select('.v-m-root');
		var aDatapoints = oChartElt.selectAll('.v-datapoint');
		var oChartBoundingRect = oChartElt.node().getBoundingClientRect();
		var aBubbleData = this.aData;
		var minimumLabelSize = this.getProperty("minimumLabelSize");
		oChartElt.selectAll('.sapBubbleTxt').remove();

		aDatapoints.each(function (d, i) {
			var oPointBoundingRect = this.getBoundingClientRect();
			var x = oPointBoundingRect.left - oChartBoundingRect.left;
			var y = oPointBoundingRect.top + oPointBoundingRect.height / 2 - oChartBoundingRect.top;
			var nTextLength = oPointBoundingRect.right - oPointBoundingRect.left;

			if (sap.ui.Device.browser.firefox) {
				y = y - 10;
			}

			if ((oPointBoundingRect.right - oPointBoundingRect.left) > minimumLabelSize) {
				var sLabelProp1 = aLabelProperties[0];
				if (sLabelProp1) {
					var sLabel1 = aBubbleData[this.__data__.ctx[0].path.dii_a1][sLabelProp1];
					if (sap.ui.Device.browser.internet_explorer) {
						var xPathId = "path" + d.x + sLabel1;
						oChartElt.append("path").attr("id", xPathId).attr("d", 'M ' + (x + 10) + " " + (y) + ' h ' + (nTextLength - 20)).style('stroke', 'none');
						oChartElt.append('text')
							.attr('pointer-events', 'none')
							.append("textPath").attr("xlink:href", "#" + xPathId)
							.attr('class', 'sapBubbleTxt')
							.text(sLabel1);
					} else {
						oChartElt.append("foreignObject")
							.attr("width", nTextLength)
							.attr("height", 20)
							.attr('x', x)
							.attr('y', y - 7)
							.attr('text-anchor', 'middle')
							.attr('pointer-events', 'none')
							.attr('class', 'sapBubbleTxt')
							.append("xhtml:body")
							.style("background", "transparent")
							.html("<div class='sapBubbleTxtDiv'>" + sLabel1 + "</div>");
					}
				}

				var sLabelProp2 = aLabelProperties[1];
				if (sLabelProp2) {
					var sLabel2 = aBubbleData[this.__data__.ctx[0].path.dii_a1][sLabelProp2];
					if (sap.ui.Device.browser.internet_explorer) {
						var yPathId = "path" + d.y + sLabel2;
						oChartElt.append("path").attr("id", yPathId).attr("d", 'M ' + (x + 10) + " " + (y + 12) + ' h ' + (nTextLength - 20)).style('stroke', 'none');
						oChartElt.append('text')
							.attr('pointer-events', 'none')
							.append("textPath")
							.attr("xlink:href", "#" + yPathId)
							.attr('class', 'sapBubbleTxt')
							.text(sLabel2);
					} else {
						oChartElt.append("foreignObject")
							.attr("width", nTextLength)
							.attr("height", 20)
							.attr('x', x)
							.attr('y', y + 4)
							.attr('text-anchor', 'middle')
							.attr('pointer-events', 'none')
							.attr('class', 'sapBubbleTxt')
							.append("xhtml:body")
							.style("background", "transparent")
							.html("<div class='sapBubbleTxtDiv' >" + sLabel2 + "</div>");
					}
				}
			}
		});

	} else {
		jQuery.sap.log.error("BubbleChart: formatDataLabel not possible without dataset");
	}
};

sap.ca.ui.charts.BubbleChart.prototype.setXAxisFormatFunction = function (fnValue) {
	if (fnValue) {
		this.setXAxisLabelFormatter(fnValue);
		this.oChartFormatter._legacyBubbleFormatter = fnValue;
	}
	this.setProperty("xAxisFormatFunction", fnValue);
};

sap.ca.ui.charts.BubbleChart.prototype.getXAxisFormatString = function () {
	if (!this.getProperty("xAxisFormatString") || this.getProperty("xAxisFormatString") == "") {
		return this.getProperty("xAxisLabelFormatter");
	}
	jQuery.sap.log.warning("xAxisFormatString property is deprecated. Please use xAxisLabelFormatter.");
	return this.getProperty("xAxisFormatString");

};

sap.ca.ui.charts.BubbleChart.prototype.setXAxisFormatString = function (sFormatString) {
	jQuery.sap.log.warning("xAxisFormatString property is deprecated. Please use xAxisLabelFormatter.");
	this.setProperty("xAxisFormatString", sFormatString);
	return this;
};

sap.ca.ui.charts.BubbleChart.prototype.getYAxisFormatString = function () {
	if (!this.getProperty("yAxisFormatString") || this.getProperty("yAxisFormatString") == "") {
		return this.getProperty("yAxisLabelFormatter");
	}
	jQuery.sap.log.warning("yAxisFormatString property is deprecated. Please use yAxisLabelFormatter.");
	return this.getProperty("yAxisFormatString");
};

sap.ca.ui.charts.BubbleChart.prototype.getAxisTooltipFormatString = function () {
	if (!this.getProperty("axisTooltipFormatString") || this.getProperty("axisTooltipFormatString") == "") {
		return this.getProperty("plotAreaAxisTooltipFormatter");
	}
	jQuery.sap.log.warning("axisTooltipFormatString property is deprecated. Please use plotAreaAxisTooltipFormatter.");
	return this.getProperty("axisTooltipFormatString");

};

sap.ca.ui.charts.BubbleChart.prototype.setAxisTooltipFormatString = function (sFormatString) {
	jQuery.sap.log.warning("axisTooltipFormatString property is deprecated. Please use axisTooltipFormatString.");
	this.setProperty("axisTooltipFormatString", sFormatString);
	return this;
};

sap.ca.ui.charts.BubbleChart.prototype.setYAxisFormatString = function (sFormatString) {
	jQuery.sap.log.warning("yAxisFormatString property is deprecated. Please use yAxisLabelFormatter.");
	this.setProperty("yAxisFormatString", sFormatString);
	return this;
};

sap.ca.ui.charts.BubbleChart.prototype.setYAxisFormatFunction = function (fnValue) {
	if (fnValue) {
		jQuery.sap.log.warning("yAxisFormatFunction property is deprecated. Please use yAxisLabelFormatter.");
		this.setYAxisLabelFormatter(fnValue);
		this.oChartFormatter._legacyBubbleFormatter = fnValue;
	}
	this.setProperty("yAxisFormatFunction", fnValue);
};

sap.ca.ui.charts.BubbleChart.prototype.setAxisFormatFunction = function (fnValue) {
	if (fnValue) {
		jQuery.sap.log.warning("axisFormatFunction property is deprecated. Please use plotAreaAxisTooltipFormatter.");
		this.axisLabelFormatter = fnValue;
		this.oChartFormatter._legacyBubbleFormatter = fnValue;
	}
	this.setProperty("axisFormatFunction", fnValue);
};

sap.ca.ui.charts.BubbleChart.prototype.getShowTitle = function () {
	return sap.ca.ui.charts.Chart.prototype.getTitle.apply(this);
};

sap.ca.ui.charts.BubbleChart.prototype.setShowTitle = function (sTitle) {
	sap.ca.ui.charts.Chart.prototype.setTitle.apply(this, sTitle);
};

/**
 * Draws a vertical line at the given x axis value. Also display the text.
 *
 * @param xAxisValue Value where to draw the vertical line
 * @param text The text to display.
 * @public
 * @name sap.ca.ui.charts.BubbleChart.prototype#drawVerticalLineAt
 */
sap.ca.ui.charts.BubbleChart.prototype.drawVerticalLineAt = function (xAxisValue, text) {
	if (this._saveVerticalLine(xAxisValue, text)) {
		this._innerDrawVerticalLineAt(xAxisValue, text);
	}
};

sap.ca.ui.charts.BubbleChart.prototype._innerDrawVerticalLineAt = function (xAxisValue, text) {
	var plot = jQuery('.v-m-plot');
	var fnExists = function (aArray) {
		return (typeof aArray !== "undefined" && typeof aArray[0] !== "undefined");
	};

	if (fnExists(plot) === false) {
		return;
	}
	var xaxis = jQuery('.v-m-xAxis .v-body');
	var lines = jQuery(xaxis).find('line');
	if (fnExists(lines) === false) {
		return;
	}
	var height = plot[0].getBoundingClientRect('height').height;
	var xmin = parseFloat(lines[0].getAttribute("x1"));
	var xmax = parseFloat(lines[0].getAttribute("x1"));
	for (var i = 1; i < lines.length; i++) {
		var line = lines[i];
		var x1 = parseFloat(line.getAttribute("x1"));
		if (x1 > xmax) {
			xmax = x1;
		}
		if (x1 < xmin) {
			xmin = x1;
		}
	}

	var valuemin = this.getXAxisMinValue();
	var valuemax = this.getXAxisMaxValue();

	var xScale = d3.scale.linear().domain([valuemin, valuemax]).range([xmin, xmax]);

	var anchor = "middle";
	if (valuemin == xAxisValue) {
		anchor = "start";
	} else if (valuemax == xAxisValue) {
		anchor = "end";
	}

	if (text) {
		var iTodaysLineOrdinate = 2 * this._getFontSize();
		plot.append(this._createLine(xScale(xAxisValue), xScale(xAxisValue), iTodaysLineOrdinate, height, "#000000"));
		// put the text a little bit higher than where the line ends
		plot.append(this._createText(xScale(xAxisValue), iTodaysLineOrdinate - 5, text, anchor));
	} else {
		plot.append(this._createLine(xScale(xAxisValue), xScale(xAxisValue), 0, height, "#000000"));
	}
};

/**
 * Clears the array of saved vertical lines.
 * @public
 * @name sap.ca.ui.charts.BubbleChart.prototype#clearVerticalLines
 */
sap.ca.ui.charts.BubbleChart.prototype.clearVerticalLines = function () {
	this._aVerticalLines = [];
};

/**
 * Saves the vertical lines to redisplay them after rendering.
 *
 * @param xAxisValue The x axis value where to draw the line
 * @param text The text to display
 * @private
 * @name sap.ca.ui.charts.BubbleChart.prototype#_saveVerticalLine
 * @return {Boolean} true if the line was saved, false if it already existed.
 */
sap.ca.ui.charts.BubbleChart.prototype._saveVerticalLine = function (xAxisValue, text) {
	var bFound = false;
	for (var i = 0; i < this._aVerticalLines.length; i++) {
		var vl = this._aVerticalLines[i];
		if (vl.xAxisValue === xAxisValue && vl.text === text) {
			bFound = true;
		}
	}
	if (bFound === false) {
		this._aVerticalLines.push({ "xAxisValue":xAxisValue, "text":text });
	}

	return !bFound;
};

/**
 * Redraws all vertical lines after a rendering.
 *
 * @private
 * @name sap.ca.ui.charts.BubbleChart.prototype#_redrawVerticalLines
 */
sap.ca.ui.charts.BubbleChart.prototype._redrawVerticalLines = function () {
	for (var i = 0; i < this._aVerticalLines.length; i++) {
		var vl = this._aVerticalLines[i];
		this._innerDrawVerticalLineAt(vl.xAxisValue, vl.text);
	}
};

/**
 * Creates a SVG line.
 *
 * @param x1
 * @param x2
 * @param y1
 * @param y2
 * @param color
 * @return {Element} The line
 * @private
 * @name sap.ca.ui.charts.BubbleChart.prototype#_createLine */
sap.ca.ui.charts.BubbleChart.prototype._createLine = function (x1, x2, y1, y2, color) {
	var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
	line.setAttribute("x1", x1);
	line.setAttribute("x2", x2);
	line.setAttribute("y1", y1);
	line.setAttribute("y2", y2);
	line.setAttribute("stroke", color);
	line.setAttribute("stroke-width", 1);
	line.setAttribute("stroke-dasharray", "10, 10");
	return line;
};

/**
 * Creates an SVG text.
 *
 * @param x Text coordinate
 * @param y Text coordinate
 * @param value Text to display
 * @param anchor Alignment of the text to the given coordinate (start/middle/end)
 * @return {Element} The text element
 * @private
 * @name sap.ca.ui.charts.BubbleChart.prototype#_createText
 */
sap.ca.ui.charts.BubbleChart.prototype._createText = function (x, y, value, anchor) {
	var textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
	textElement.appendChild(document.createTextNode(value));
	textElement.setAttribute("x", x);
	textElement.setAttribute("y", y);
	var fontSize = this._getFontSize();
	textElement.setAttribute("font-size", fontSize);
	textElement.setAttribute("text-anchor", anchor);
	return textElement;
};

sap.ca.ui.charts.BubbleChart.prototype._getFontSize = function () {
	if (!this._iBubbleFontSize) {
		// default font size value
		var iFontSize = 15;
		var fontSizeRules = this._findInCss(/.sapCaUiChart .v-datalabel/);
		if (fontSizeRules.length > 0) {
			var oRule = fontSizeRules[0];
			var oFontSize = oRule.style['font-size'];
			if (oFontSize == null) { // IE, Firefox
				oFontSize = oRule.style['fontSize'];
			}
			iFontSize = parseInt(this._getEMSize(oFontSize), 10);
		}
		this._iBubbleFontSize = iFontSize;
	}
	return this._iBubbleFontSize;
};

sap.ca.ui.charts.BubbleChart.prototype.setContent = function (oContent) {
	jQuery.sap.log.warning("Usage of deprecated feature, please use setAggregation('internalContent')");
};

sap.ca.ui.charts.BubbleChart.prototype.getContent = function () {
	jQuery.sap.log.warning("Usage of deprecated feature please use getAggregation('internalContent')");
	return null;
};

sap.ca.ui.charts.BubbleChart.prototype.onChartInitialized = function (oEvent) {
	sap.ca.ui.charts.Chart.prototype.onChartInitialized.apply(this, arguments);
	var oData = this._oInternalVizChart.getModel().getData();
	this.aData = [];
	// Parse the data
	for (var key in oData) {
		if (jQuery.isArray(oData[key])) {
			this.aData = oData[key];
		}
	}

///	this.aData = this._oInternalVizChart.getDataset().getVIZDataset().getMeasureValuesGroupByIdx(2).getMeasureValues()[0].getValues()[0];

	if (this.getShowCustomLabels()) {
		this.formatDataLabel();
	}
};

sap.ca.ui.charts.BubbleChart.prototype.getShowLegend = function () {
	// one of them true => true
	return sap.ca.ui.charts.Chart.prototype.getShowLegend.call(this) || this.getShowSizeLegend();
};

sap.ca.ui.charts.BubbleChart.prototype.setShowLegend = function (bShow) {
	sap.ca.ui.charts.Chart.prototype.setShowLegend.call(this, bShow);
	this.setShowSizeLegend(bShow);
	return this;
};

sap.ca.ui.charts.BubbleChart.prototype._initChart = function () {
	sap.ca.ui.charts.Chart.prototype._initChart.apply(this);
	this._oInternalVizChart.attachInitialized(function (oEvent) {
		this._redrawVerticalLines();
	}, this);
};
