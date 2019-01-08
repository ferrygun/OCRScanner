/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/ui/core/Element", "sap/gantt/misc/Utility", "sap/gantt/misc/Format",
	"sap/ui/core/Core", "sap/ui/core/format/NumberFormat"
], function (Element, Utility, Format, Core, NumberFormat) {
	"use strict";
	
	/**
	 * Creates and initializes a new Shape class.
	 * 
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 * 
	 * @class 
	 * Base class for all shape classes.
	 * 
	 * <p>
	 * Shape class is designed to  describe how data should be visualized by an SVG tag. Most shape classes contain only properties and only one aggregation:
	 * <ul>
	 * 	<li>Some properties come from standard SVG attribute. Examples are <code>fill</code>, <code>stroke</code> etc.</li>
	 * 	<li>Some properties designed to put Shape class into Gantt chart's coordinate system, especially the X axis called <code>sap.gantt.misc.AxisTime</code>. Examples are <code>time</code>, <code>endTime</code> etc.</li>
	 * 	<li>Some properties are designed to provide some geometry attributes. Examples are <code>side</code>, <code>center</code> in some extend shapes.</li>
	 * 	<li>Every shape has aggregation called selectedShape to provide a way to specify how selection of the shape should be designed.</li>
	 * 	<li>Some container shapes like <code>g</code> and <code>clippath</code> has aggregation to aggregate other shapes in.</li>
	 * </ul>
	 * 
	 * Because d3 is used underneath and d3 use array to do batch data-binding, therefore Shape classes are not designed in the way of SAPUI5 standard data-binding (one shape instance per data). 
	 * Instead, each Shape instance stands for a particular way of visualize one data structure. And one Shape instance is used to draw a list of data by Drawers in Gantt chart. 
	 * 
	 * Because of this specialty, application cannot instantiate a shape class directly. Instead they can use configuration {@link sap.gantt.config.Shape} to describe which Shape class is used to draw
	 * which data in what way. And pass this configuration to Gantt chart control by property <code>shapes</code>. Gantt chart control use these configurations to instatiate Shape instances and Drawers. Drawers
	 * consumes Shape instances to draw real SVG shapes.
	 * 
	 * Each shape classes are designed to support 'configuration-first' principle. So called configure is the <code>shapeProperties</code> property of <code>sap.gantt.config.Shape</code>.
	 * In this object property, application can provide following things:
	 * <ul>
	 * 	<li>A value. Example: <code>{tooltip: 'svg rocks'}.</code></li>
	 * 	<li>An attribute from data. Example: <code>{time: {startTime}}</code></li>
	 * 	<li>Formatted attribute from data. <code>{tooltip: "{time:Timestamp} the stock price falls to {price:Number}."}</code> The typed values are formatted by global legacy
	 * 		number, date and time configurations by {@link sap.gantt.misc.Format}.</li>
	 * </ul>
	 * 
	 * In many applications, simple configuration or even binding cannot meet business requriement. Therefore applications are allowed to extend shapes and provide their own getter methods
	 * to effect all properties by data. For in row shapes, two parameters are injected to help application to do coding. All the shapes provided by Gantt chart follows 'configuration first'
	 * principle by invoking method <code>_configFirst()</code>. Meaning if application provide value by sap.gantt.config.Shape, the configuration over-write code logic in getters.
	 * 
	 * <b>Note:</b> Setter methods are only used for set default values. Because a Shape instance stands for a way of drawing. The instance self does not hold any status (property values).
	 * Meanwhile, all getter are injected with actual data and related informations to adapt to d3 paradigm. 
	 * </p>
	 * 
	 * @extend sap.ui.core.Element
	 * @abstract
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.shape.Shape
	 */
	var Shape = Element.extend("sap.gantt.shape.Shape", /** @lends sap.gantt.shape.Shape.prototype */ {
		metadata: {
			"abstract": true,
			/*
			 * See getters for property jsdoc.
			 */
			properties: {
				tag: {type: "string"},
				category: {type: "string", defaultValue: sap.gantt.shape.ShapeCategory.InRowShape},
				htmlClass: {type: "string"},
				isDuration: {type: "boolean", defaultValue: false},
				time: {type: "string"},
				endTime: {type: "string"},
				title: {type: "string"},
				ariaLabel: {type: "string"},
				xBias: {type: "float", defaultValue: 0},
				yBias: {type: "float", defaultValue: 0},
				fill: {type : "sap.gantt.ValueSVGPaintServer"},
				strokeOpacity: {type: "float", defaultValue: 1},
				fillOpacity: {type: "float", defaultValue: 1},
				stroke: {type : "sap.gantt.ValueSVGPaintServer"},
				strokeWidth: {type: "float", defaultValue: 0},
				strokeDasharray: {type: "string"},
				clipPath: {type: "string"},
				transform: {type: "string"},
				filter: {type: "string"},
				enableHover: {type: "boolean", defaultValue: false},
				enableDnD: {type: "boolean", defaultValue: false},
				enableSelection: {type: "boolean", defaultValue: true},
				enableResize: {type: "boolean", defaultValue: false},
				rowYCenter: {type: "float", defaultValue: 7.5},
				rotationCenter: {type: "float[]"}, // only two elements, 0 for x, 1 for y
				rotationAngle: {type: "float"},
				isBulk: {type: "boolean", defaultValue: false},
				arrayAttribute: {type: "string"},
				timeFilterAttribute: {type: "string"},
				endTimeFilterAttribute: {type: "string"},
				legend: {type: "string"}
			},
			aggregations: {
				
				/**
				 * Selected Shape.
				 * 
				 * Selected shape specifies how to draw the selection high-light. Application can implement it by extending
				 * <code>sap.gantt.shape.SelectedShape</code> and configure it in <code>sap.gantt.config.Shape</code>.
				 */
				selectedShape: {type: "sap.gantt.shape.SelectedShape", multiple: false},
				
				/**
				 * Resize Shadow Shape.
				 * 
				 * Resize Shadow shape specifies how to draw the shadow highlight when resizing. Applications can implement it by extending
				 * <code>sap.gantt.shape.ResizeShadowShape</code> and configure it in <code>sap.gantt.config.Shape</code>.
				 */
				resizeShadowShape: {type: "sap.gantt.shape.ResizeShadowShape", multiple: false}
			}
		}
	});
	
	Shape.prototype.init = function () {
		var oRb = sap.ui.getCore().getLibraryResourceBundle("sap.gantt");
		this.setProperty("ariaLabel", oRb.getText("ARIA_SHAPE"));

		this.mShapeConfig = null;
		this.mChartInstance = null;
	};

	// used to cache LESS parameter colors
	var mValueColors = {};

	// theme change need reset colors
	sap.ui.getCore().attachThemeChanged(function() {
		mValueColors = {};
	});

	/**
	 * Gets current value of property <code>tag</code>.
	 * 
	 * SVG tag name of the shape.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html SVG 1.1 specification for shapes}.<br/>
	 * <b>Note:</b> This value is not recommended to be over-written by configuration or coding.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {string} Value of property <code>tag</code>.
	 * @public
	 */
	Shape.prototype.getTag = function (oData) {
		return this._configFirst("tag", oData);
	};
	
	/**
	 * Gets current value of property <code>category</code>.
	 * 
	 * Values are in enum {@link sap.gantt.shape.ShapeCategory}.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {string} Value of property <code>category</code>.
	 * @public
	 */
	Shape.prototype.getCategory = function (oData) {
		return this._configFirst("category", oData);
	};
	
	/**
	 * Gets current value of property <code>htmlClass</code>.
	 * 
	 * Customized html classes. Multiple classes can be provided and seperated by space.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {string} Value of property <code>htmlClass</code>.
	 * @public
	 */
	Shape.prototype.getHtmlClass = function (oData) {
		return this._configFirst("htmlClass", oData);
	};
	
	/**
	 * Gets current value of property <code>isDuration</code>.
	 * 
	 * <p>
	 * When this flag is set to true, the shape is called 'duration shape'. And <code>time</code> stands for startTime, <code>endTime</code> stands for end time.
	 * When this flag is set to be false, the shape is called 'transient shape'. And only <code>time</code> is used.
	 * Usually these 3 properties are used to determine x position of one shape.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {boolean} Value of property <code>isDuration</code>.
	 * @public
	 */
	Shape.prototype.getIsDuration = function (oData) {
		return this._configFirst("isDuration", oData);
	};
	
	/**
	 * Gets current value of property <code>time</code>.
	 * 
	 * Timestamp for transient shape or start timestamp for duration shape.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {string} Value of property <code>time</code>.
	 * @public
	 */
	Shape.prototype.getTime = function (oData) {
		return this._configFirst("time", oData);
	};
	
	/**
	 * Gets current value of property <code>endTime</code>.
	 * 
	 * End timestamp for duration shape.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {string} Value of property <code>endTime</code>.
	 * @public
	 */
	Shape.prototype.getEndTime = function (oData) {
		return this._configFirst("endTime", oData);
	};
	
	/**
	 * Gets current value of property <code>title</code>.
	 * 
	 * Title is visualized as tooltip by browser.
	 * <b>Notes:</b> Use character entity to do simple text tabbing and breaking. (Use "&#09;" for tab and "&#10;" for break.)
	 * See {@link http://www.w3.org/TR/SVG/struct.html#TitleElement SVG 1.1 specification for 'title'}.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {string} Value of property <code>title</code>.
	 * @public
	 */
	Shape.prototype.getTitle = function (oData) {
		return this._configFirst("title", oData);
	};
	
	/**
	 * Gets current value of property <code>ariaLabel</code>.
	 * 
	 * Arial Label enables screen readers.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {string} Value of property <code>ariaLabel</code>.
	 * @public
	 */
	Shape.prototype.getAriaLabel = function (oData) {
		return this._configFirst("ariaLabel", oData);
	};
	
	/**
	 * Gets current value of property <code>xBias</code>.
	 * 
	 * <p>
	 * Fine-tune x coordinate.
	 * This value only works for category <code>inRowShape</code>.
	 * Shape usually determines position in x coordinate by property <code>isDuration</code>, <code>time</code> and <code>endTime</code>.
	 * Application can use this property to do some x coordinate adjustment in pixel.
	 * The xBias will be automatically mirrored for RTL mode. It means if you set 10 to property xBias, in RTL mode, the value of the xBias will be -10.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {number} Value of property <code>xBias</code>.
	 * @public
	 */
	Shape.prototype.getXBias = function (oData) {
		if (Core.getConfiguration().getRTL() === true) {
			return 0 - this._configFirst("xBias", oData);
		} else {
			return this._configFirst("xBias", oData);
		}
	};
	
	/**
	 * Gets current value of property <code>yBias</code>.
	 * 
	 * <p>
	 * Fine-tune y coordinate.
	 * This value only works for category <code>inRowShape</code>.
	 * Y coordinate is automatically determined by row. Application can use this property to do some y coordinate adjustment in pixel. 
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {number} Value of property <code>yBias</code>.
	 * @public
	 */
	Shape.prototype.getYBias = function (oData) {
		return this._configFirst("yBias", oData, true);
	};
	
	/**
	 * Gets current value of property <code>fill</code>.
	 * 
	 * <p> 
	 * Standard SVG 'fill' attribute.
	 * See {@link http://www.w3.org/TR/SVG/painting.html#FillProperty SVG 1.1 specification for 'fill'}.
	 * <b>Note:</b> HTML color and url reference to paint server can be provided to fill. Paint server definitions usually comes from paint servers rendered by
	 * {@link sap.gantt.GanttChartContainer}, {@link sap.gantt.GanttChartWithTable} or {@link sap.gantt.GanttChart}.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {string} Value of property <code>fill</code>.
	 * @public
	 */
	Shape.prototype.getFill = function (oData, oRowInfo) {
		return this._configFirst("fill", oData);
	};

	/**
	 * Gets current value of property <code>strokeOpacity</code>.
	 * 
	 * <p>
	 * Standard SVG 'stroke-Opacity' attribute.
	 * See {@link http://www.w3.org/TR/SVG/painting.html#StrokeOpacityProperty SVG 1.1 specification for 'stroke-opacity'}.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @return {number} Value of property <code>strokeOpacity</code>.
	 * @public
	 */
	Shape.prototype.getStrokeOpacity = function (oData) {
		return this._configFirst("strokeOpacity", oData);
	};
	
	/**
	 * Gets current value of property <code>fillOpacity</code>.
	 * 
	 * <p>
	 * Standard SVG 'fill-Opacity' attribute.
	 * See {@link http://www.w3.org/TR/SVG/painting.html#FillOpacityProperty SVG 1.1 specification for 'fill-opacity'}.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {number} Value of property <code>fillOpacity</code>.
	 * @public
	 */
	Shape.prototype.getFillOpacity = function (oData) {
		return this._configFirst("fillOpacity", oData);
	};
	
	/**
	 * Gets current value of property <code>stroke</code>.
	 * 
	 * <p>
	 * Standard SVG 'stroke' attribute.
	 * See {@link http://www.w3.org/TR/SVG/painting.html#StrokeProperty SVG 1.1 specification for 'stroke'}.
	 * <b>Note:</b> HTML color and url reference to paint server can be provided to stroke. Paint server definitions usually comes from paint servers rendered by
	 * {@link sap.gantt.GanttChartContainer}, {@link sap.gantt.GanttChartWithTable} or {@link sap.gantt.GanttChart}.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {string} Value of property <code>stroke</code>.
	 * @public
	 */
	Shape.prototype.getStroke = function (oData) {
		return this._configFirst("stroke", oData);
	};
	
	/**
	 * Gets current value of property <code>strokeWidth</code>.
	 * 
	 * <p>
	 * Standard SVG 'stroke-width' attribute.
	 * See {@link http://www.w3.org/TR/SVG/painting.html#StrokeWidthProperty SVG 1.1 specification for 'stroke-width'}.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {number} Value of property <code>strokeWidth</code>.
	 * @public
	 */
	Shape.prototype.getStrokeWidth = function (oData) {
		return this._configFirst("strokeWidth", oData, true);
	};
	
	/**
	 * Gets current value of property <code>strokeDasharray</code>.
	 * 
	 * <p>
	 * Standard SVG 'stroke-dasharray' attribute.
	 * See {@link http://www.w3.org/TR/SVG/painting.html#StrokeWidthProperty SVG 1.1 specification for 'stroke-dasharray'}.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {string} Value of property <code>strokeDasharray</code>.
	 * @public
	 */
	Shape.prototype.getStrokeDasharray = function (oData) {
		return this._configFirst("strokeDasharray", oData);
	};
	
	/**
	 * Gets current value of property <code>clipPath</code>.
	 * 
	 * <p>
	 * Standard SVG 'clippath' attribute.
	 * See {@link http://www.w3.org/TR/SVG/masking.html#ClipPathProperty SVG 1.1 specification for 'clippath'}.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {string} Value of property <code>clipPath</code>.
	 * @public
	 */
	Shape.prototype.getClipPath = function (oData) {
		return this._configFirst("clipPath", oData);
	};
	

	/**
	 * Gets current value of property <code>transform</code>.
	 * 
	 * <p>
	 * Standard SVG 'transform' attribute.
	 * See {@link http://www.w3.org/TR/SVG/coords.html#TransformAttribute SVG 1.1 specifica6tion for 'transform'}.
	 * Some logic in getTransform() is provided to enable property <code>rotationCenter</code> and <code>rotationAngle</code>. If application over-write this property by
	 * configuration or coding, rotation behavior cannot be guaranteed.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {string} Value of property <code>transform</code>.
	 * @public
	 */
	Shape.prototype.getTransform = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("transform")) {
			return this._configFirst("transform", oData);
		}
		
		var aRetVal = [];
		/*
		 * in transform, the later function take effect first,
		 * so in this sequence, rotate first, then translate.
		 */
		this._translate(oData, oRowInfo, aRetVal);
		this._rotate(oData, oRowInfo, aRetVal);
		
		if (aRetVal.length > 0) {
			return aRetVal.join(" ");
		}
	};
	
	/**
	 * Rotate Shape
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Shape Row Info.
	 * @param {object} aRetVal Return Value.
	 * @protected
	 */
	Shape.prototype._rotate = function (oData, oRowInfo, aRetVal) {
		var aCenter = this.getRotationCenter(oData, oRowInfo),
			nRotationAngle = this.getRotationAngle(oData, oRowInfo);
		
		if (aCenter && aCenter.length === 2 && nRotationAngle) {
			aRetVal.push("rotate(" + nRotationAngle + " " + aCenter[0] + " " + aCenter[1] + ")");
		}
	};
	
	/**
	 * Translate Shape
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Shape Row Info.
	 * @param {object} aRetVal Return Value.
	 * @protected
	 */
	Shape.prototype._translate = function (oData, oRowInfo, aRetVal) {
		var nXBias = this.getXBias(oData, oRowInfo),
			nYBias = this.getYBias(oData, oRowInfo);
		
		if (nXBias || nYBias) {
			nXBias = nXBias ? nXBias : 0;
			nYBias = nYBias ? nYBias : 0;
			aRetVal.push("translate(" + nXBias + " " + nYBias + ")");
		}
	};
	
	/**
	 * Gets current value of property <code>filter</code>.
	 * 
	 * <p>
	 * Standard SVG 'filter' attribute.
	 * See {@link http://www.w3.org/TR/SVG/filters.html#FilterProperty SVG 1.1 specifica6tion for 'filter'}.
	 * Usually value of filter is an url referenced from paint server definition rendered by
	 * {@link sap.gantt.GanttChartContainer}, {@link sap.gantt.GanttChartWithTable} or {@link sap.gantt.GanttChart}.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {string} Value of property <code>filter</code>.
	 * @public
	 */
	Shape.prototype.getFilter = function (oData) {
		return this._configFirst("filter", oData);
	};
	
	/**
	 * Gets current value of property <code>enableDnD</code>.
	 * 
	 * <p>
	 * This value controls whether a shape is enabled for drag-and-drop behavior.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {boolean} Value of property <code>enableDnD</code>.
	 * @public
	 */
	Shape.prototype.getEnableDnD = function (oData) {
		return this._configFirst("enableDnD", oData);
	};
	
	/**
	 * Gets current value of property <code>enableSelection</code>.
	 * 
	 * <p>
	 * This value controls whether a shape is enabled for selection behavior.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {boolean} Value of property <code>enableSelection</code>.
	 * @public
	 */
	Shape.prototype.getEnableSelection = function (oData) {
		return this._configFirst("enableSelection", oData);
	};

	/**
	 * Gets current value of property <code>enableResize</code>.
	 * 
	 * <p>
	 * This value controls whether a shape is enabled for the resize behavior.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {boolean} Value of property <code>enableResize</code>.
	 * @public
	 */
	Shape.prototype.getEnableResize = function (oData) {
		return this._configFirst("enableResize", oData);
	};

	/**
	 * Gets current value of property <code>enableHover</code>.
	 *
	 * <p>
	 * This value controls whether a shape is enabled to fire mouse enter and leave event.
	 * </p>
	 *
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {boolean} Value of property <code>enableHover</code>.
	 * @public
	 */
	Shape.prototype.getEnableHover = function (oData) {
		return this._configFirst("enableHover", oData);
	};


	/**
	 * Gets current value of property <code>rotationAngle</code>.
	 * 
	 * <p>
	 * This value is used in combination of property <code>rotationCenter</code>. By providing both shape can be rotated with any angle around rotation center.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {number} Value of property <code>rotationAngle</code>.
	 * @public
	 */
	Shape.prototype.getRotationAngle = function (oData) {
		return this._rtlRotation(this._configFirst("rotationAngle", oData));
	};
	
	/**
	 * Provide logic for rotation considering RTL.
	 * 
	 * @param {number} nAngle Rotation angle.
	 * @return {number} Actual rotation angle.
	 * @protected
	 */
	Shape.prototype._rtlRotation = function (nAngle) {
		if (nAngle > 0 || nAngle < 0) {
			if (Core.getConfiguration().getRTL()){
				return 360 - nAngle;
			} else {
				return nAngle;
			}
		}
	};
	
	/**
	 * Gets current value of property <code>rowYCenter</code>.
	 * 
	 * <p>
	 * Default implementation is return the middle position of the row in y direction.
	 * If application over-write this property by configuration or code, the logic cannot be guaranteed.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {array} Value of property <code>rowYCenter</code>.
	 * @public
	 */
	Shape.prototype.getRowYCenter = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("rowYCenter")) {
			return this._configFirst("rowYCenter", oData);
		}
		
		if (oRowInfo) {
			return oRowInfo.y + oRowInfo.rowHeight / 2;
		} else {
			return this.getProperty("rowYCenter");
		}
	};
	
	/**
	 * Gets current value of property <code>rotationCenter</code>.
	 * 
	 * <p>
	 * This value is used in combination of property <code>rotationAngle</code>. By providing both shape can be rotated with any angle around rotation center.
	 * Default implementation is the coordinate at <code>time</code> in x coordinate, and <code>rowYCenter</code> in y coordinate.
	 * If application over-write this property by configuration or code, the logic cannot be guaranteed.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {array} Value of property <code>rotationCenter</code>.
	 * @public
	 */
	Shape.prototype.getRotationCenter = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("rotationCenter")) {
			return this._configFirst("rotationCenter", oData);
		}
		
		return this._getCenter(oData, oRowInfo);
	};
	
	Shape.prototype._getCenter = function (oData, oRowInfo, bEnd) {
		var oAxisTime = this.getAxisTime();
		
		var sTime = bEnd ? this.getEndTime(oData, oRowInfo) : this.getTime(oData, oRowInfo);
		
		if (!sTime) {
			return undefined;
		}
		var nX = oAxisTime.timeToView(Format.abapTimestampToDate(sTime));
		if (!nX && !nX == 0) {
			nX = oAxisTime.timeToView(0);
		}
		
		var nY = this.getRowYCenter(oData, oRowInfo);
		
		return [nX, nY];
	};
	
	/**
	 * Gets current value of property <code>isBulk</code>.
	 * 
	 * <p>
	 * Gantt chart do filtering of data by timestamp for performance sake. For simple shapes which has <code>time</code> or <code>endTime</code> provided, set this flag
	 * to false. For shapes (path or polygon) which connect a list of data, set this value to false. And if filtering is required to next level data, provide <code>arrayAttribute</code>,
	 * <code>timeFilterAttribute</code> and <code>endTimeFilterAttribute</code> in combination.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {boolean} Value of property <code>isBulk</code>.
	 * @public
	 */
	Shape.prototype.getIsBulk = function (oData) {
		return this._configFirst("isBulk", oData);
	};
	
	/**
	 * Gets current value of property <code>arrayAttribute</code>.
	 * 
	 * <p>
	 * Specify which attribute is child array.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {string} Value of property <code>arrayAttribute</code>.
	 * @public
	 */
	Shape.prototype.getArrayAttribute = function (oData) {
		return this._configFirst("arrayAttribute", oData);
	};

	/**
	 * Gets current value of property <code>timeFilterAttribute</code>.
	 * 
	 * <p>
	 * Specify which is time attribute of items in child array.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {string} Value of property <code>timeFilterAttribute</code>.
	 * @public
	 */
	Shape.prototype.getTimeFilterAttribute = function (oData) {
		return this._configFirst("timeFilterAttribute", oData);
	};

	/**
	 * Gets current value of property <code>endTimeFilterAttribute</code>.
	 * 
	 * <p>
	 * Specify which is end time attribute of items in child array.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {string} Value of property <code>endTimeFilterAttribute</code>.
	 * @public
	 */
	Shape.prototype.getEndTimeFilterAttribute = function (oData) {
		return this._configFirst("endTimeFilterAttribute", oData);
	};

	/**
	 * Gets legend value of property <code>legend</code>.
	 * 
	 * <p>
	 * Specifies the legend text of the shape.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @return {string} Value of property <code>legend</code>.
	 * @public
	 */
	Shape.prototype.getLegend = function (oData) {
		return this._configFirst("legend", oData);
	};

	/**
	 * This method must be used to ensure 'configuration-first' principle for extended shapes.
	 * 
	 * @param {string} sAttrName Attribute name.
	 * @param {object} oData Shape data.
	 * @param {boolean} bScaleBySapUiSizeMode whether scale by size mode or not
	 * @return {string} Resolved attribute.
	 * @protected
	 */
	Shape.prototype._configFirst = function (sAttrName, oData, bScaleBySapUiSizeMode) {
		var sPropertyValue = null;
		if (this.mShapeConfig.hasShapeProperty(sAttrName)) {
			var sConfigAttr = this.mShapeConfig.getShapeProperty(sAttrName);
			if (typeof sConfigAttr === "string") {
				sPropertyValue = this._formatting(oData, sAttrName, sConfigAttr);
			} else {
				sPropertyValue = sConfigAttr;
			}
		} else {
			sPropertyValue = this.getProperty(sAttrName);
		}

		if (bScaleBySapUiSizeMode && this.mChartInstance) {
			var sMode = this.mChartInstance.getSapUiSizeClass();
			sPropertyValue = Utility.scaleBySapUiSize(sMode, sPropertyValue);
		}

		return sPropertyValue;
	};

	/**
	 * Get the shape style string
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {string} shape styles
	 * @protected
	 */
	Shape.prototype.getStyle = function(oData, oRowInfo) {
		var oStyles = {
			"stroke": this.determineValueColor(this.getStroke(oData, oRowInfo)),
			"stroke-width": this.getStrokeWidth(oData, oRowInfo)
		};
		return this.getInlineStyle(oStyles);
	};

	/**
	 * Get the AxisTime of gantt chart instance
	 * 
	 * @return {object} the AxisTime instance
	 * @public
	 */
	Shape.prototype.getAxisTime = function() {
		var oAxisTime = null;
		if(this.mChartInstance) {
			oAxisTime = this.mChartInstance.getAxisTime();
		}

		return oAxisTime;
	};

	/**
	 * Get Inline style string. Convert style object to string and remove invalid values.
	 * 
	 * @param {object} oStyles an object with style attribute and value
	 * @return {string} inline style
	 * @private
	 */
	Shape.prototype.getInlineStyle = function(oStyles) {
		return Object.keys(oStyles).reduce(function(initial, attr){ 
			if (oStyles[attr] !== undefined && oStyles[attr] !== null && oStyles[attr] !== "") {
				initial += (attr + ":" + oStyles[attr] + "; ");
			}
			return initial;
		}, "");
	};

	/**
	 * Determine the actual value color of the less parameter.
	 * 
	 * @param {string} sParameter LESS parameter "@sapUiChartSequence1" for instance
	 * @return {string} real color hex or color name
	 * @private
	 */
	Shape.prototype.determineValueColor = function(sParameter) {
		var sFoundColor = mValueColors[sParameter];
		if (!sFoundColor && sParameter) {
			// if attribute has value but no paint server value
			sFoundColor = sap.gantt.ValueSVGPaintServer.normalize(sParameter);
			mValueColors[sParameter] = sFoundColor;
		}
		return sFoundColor;
	};

	/**
	 * This method is used to get view boundary for visible area in Gantt Chart. The view boundary is 
	 * a range of x-coordinate for visible area.
	 * 
	 * @return {array} View boundary for visible area in Gantt Chart.
	 * @protected
	 */
	Shape.prototype.getShapeViewBoundary = function() {
		var oStatusSet = this.mChartInstance._oStatusSet;
		if (oStatusSet && oStatusSet.aViewBoundary) {
			return oStatusSet.aViewBoundary;
		}
		return null;
	};

	Shape.prototype._formatting = function (oData, sAttrName, sAttrValue) {
		if (!sAttrValue) {
			return "";
		}
		
		//In shapes' configuration, when attribute name binding (e.g. {id}) is used, we cache the result of parsing
		//so that whenever the get<Attribute> methods are called (which are called thousands times in huge data scenario)
		//the binding paths (e.g. {id}) don't need to be parsed all the time which is also time consuming.
		this._attributeNameBindingMap = this._attributeNameBindingMap || {};
		
		if (!this._attributeNameBindingMap[sAttrName]) {
			this._attributeNameBindingMap[sAttrName] = this._resolveAttributeMap(sAttrValue);
		}
		
		return this._formatFromResolvedAttributeMap(oData, sAttrName);
	};

	Shape.prototype._resolveAttributeMap = function (sAttrValue) {
		var aRetVal = [];
		var aMatchResult = sAttrValue.match(/[^\{\}]*(\{.*?\})?/g);
		aMatchResult.pop(); 

		aMatchResult.forEach(function (sValue, iIndex, aArray){
			var oAttrItem = {}, aSplit = sValue.split("{");
			// resolve plain leading text
			if (aSplit[0].length > 0) {
				oAttrItem.leadingText = aSplit[0];
			}
			// resolve binding, if "{" exist, find the part in between "{}", and split the part by ":"
			if (aSplit[1]) {
				aSplit = aSplit[1].split("}")[0].split(":");
				// resolve attribute path + name
				if (aSplit[0].length > 0) {
					oAttrItem.attributeName = aSplit[0].trim().split("/");
				}
				// resolve attribute type
				if (aSplit[1]) {
					oAttrItem.attributeType = aSplit[1].trim();
				}
			}
			aRetVal.push(oAttrItem);
		});
		return aRetVal;
	};

	Shape.prototype._formatFromResolvedAttributeMap = function (oData, sAttrName) {
		var aAttributeNameBindingParts = this._attributeNameBindingMap[sAttrName],
			aRetVal = [], sPart, oValue;
		if (aAttributeNameBindingParts) {
			aAttributeNameBindingParts.forEach(function (oPart, iIndex){
				sPart = oPart.leadingText;
				if (oPart.attributeName) {
					oValue = oData;
					oPart.attributeName.forEach(function (sPath, iIndex){
						oValue = oValue[sPath];
					});
					if (sPart) {
						sPart = sPart + this._formatValue(oValue, oPart.attributeType);
					} else {
						sPart = this._formatValue(oValue, oPart.attributeType);
					}
				}
				aRetVal.push(sPart);
			}.bind(this));
		}
		
		if (aRetVal.length === 1) {
			return aRetVal[0];
		}
		return aRetVal.join("");
	};

	Shape.prototype._formatValue = function (sAttrValue, sType) {
		var sRetVal = sAttrValue;

		switch (sType) {
			case "Number": // fill data for handling resource
				sRetVal = this._formatNumber(sAttrValue);
				break;

			case "Timestamp":
				// This is a possibility that mChartInstance is Legend instance :[
				// but Legend doesn't have locale property and Timestamp type, so move getLocale here
				// to prevent runtime error.
				var oLocaleConfig = this.mChartInstance.getLocale();
				if (oLocaleConfig) {
					sRetVal = Format.abapTimestampToTimeLabel(sAttrValue, oLocaleConfig);
				}
				break;
			default:
				if (sRetVal === undefined || sRetVal === null) {
					sRetVal = "";
				}
				break;
		}
		return sRetVal;
	};

	Shape.prototype._formatNumber = function (number,decimalPlaces) {
		var sRetValue = "";
		if (decimalPlaces !== undefined) {
			sRetValue = NumberFormat.getFloatInstance({
				minFractionDigits: decimalPlaces, // minimal number of fraction digits
				maxFractionDigits: decimalPlaces // maximal number of fraction digits
			}).format(number);
		} else {
			sRetValue = NumberFormat.getFloatInstance().format(number);
		}
		return sRetValue;
	};

	/**
	 * Retrieves the parent shape's referenceId.
	 * 
	 * <p>
	 * The referenceId, which is related to shape data, is generated by a Group shape.
	 * Aggregation shapes can use this method to retrieve the referenceId.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {string} Value of <code>referenceId</code>.
	 * @public
	 */
	Shape.prototype.getParentReferenceId = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("referenceId")) {
			return this._configFirst("referenceId", oData);
		}
		if (this.getParent() && this.getParent().genReferenceId) {
			return this.getParent().genReferenceId(oData, oRowInfo);
		}
	};

	return Shape;
}, true);
