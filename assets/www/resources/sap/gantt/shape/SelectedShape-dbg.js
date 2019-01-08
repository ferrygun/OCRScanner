/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

// Provides control sap.gantt.shape.SelectedShape.
sap.ui.define([
	"sap/gantt/shape/Path", "sap/gantt/misc/Utility", "sap/gantt/misc/Format", "sap/ui/core/Core"
], function (Path, Utility, Format, Core) {
	"use strict";
	
	/**
	 * Constructor for a new SelectedShape.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * <p>
	 *     Provides an implementation of selected shapes, allowing you to create a highlighting effect by drawing the selected shapes with red and thicker strokes. 
	 * </p>
	 *
	 *
	 * @extends sap.gantt.shape.Path
	 * @version 1.52.4
	 *
	 * @constructor
	 * @public
	 * @alias sap.gantt.shape.SelectedShape
	 */
	var SelectedShape = Path.extend("sap.gantt.shape.SelectedShape", {
		metadata: {
			properties: {
				fill: {type: "string", defaultValue: "none"},
				fillOpacity: {type: "float", defaultValue: 0},
				strokeOpacity: {type: "float", defaultValue: 0},
				height: {type: "int", defaultValue: 15}
			}
		}
	});

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
	SelectedShape.prototype.getIsDuration = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("isDuration")) {
			return this._configFirst("isDuration", oData);
		}
		return this.getParent().getIsDuration();
	};

	/**
	 * Gets the value of property <code>d</code>.
	 * 
	 * <p>
	 * d attribute of the path element.
	 * See {@link http://www.w3.org/TR/SVG/paths.html#DAttribute SVG 1.1 specification for 'd' attribute of 'path'}.
	 * 
	 * Usually applications do not set this value. This getter carries out the calculation using properties <code>time</code>, <code>endTime</code>,
	 * <code>tailLength</code>, <code>headLength</code>, and <code>height</code>.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of property <code>d</code> or null if the generated d is invalid according to the given data.
	 * @public
	 */
	SelectedShape.prototype.getD = function (oData, oRowInfo) {
		var iStrokeWidth, x1, x2, y1, y2;
		var sPath = "";
		var sParentTag = this.getParent().getTag();
		switch (sParentTag) {
			case "rect": case "image":
				iStrokeWidth = this.getStrokeWidth(oData, oRowInfo);
				x1 = this.getParent().getX(oData, oRowInfo) - iStrokeWidth / 2;
				y1 = this.getParent().getY(oData, oRowInfo) - iStrokeWidth / 2;
				x2 = x1 + this.getParent().getWidth(oData, oRowInfo) + iStrokeWidth;
				y2 = y1 + this.getParent().getHeight(oData) + iStrokeWidth;
				sPath = "M " + x1 + " " + y1 +
					" L " + x2 + " " + y1 +
					" L " + x2 + " " + y2 +
					" L " + x1 + " " + y2 + " z";
				break;
			case "line":
				iStrokeWidth = this.getStrokeWidth(oData, oRowInfo);
				x1 = this.getParent().getX1(oData, oRowInfo) - iStrokeWidth / 2;
				y1 = this.getParent().getY1(oData, oRowInfo) - iStrokeWidth / 2;
				x2 = this.getParent().getX2(oData, oRowInfo) + iStrokeWidth;
				y2 = this.getParent().getY2(oData, oRowInfo) + iStrokeWidth;
				sPath = "M " + x1 + " " + y1 +
				" L " + x2 + " " + y1 +
				" L " + x2 + " " + y2 +
				" L " + x1 + " " + y2 + " z";
				break;
			case "path":
				sPath = this.getParent().getD(oData, oRowInfo);
				break;
			case "clippath":
				sPath = this.getParent().getPaths()[0].getD(oData, oRowInfo);
				break;
			case "polygon": case "polyline":
				var sPoints = this.getParent().getPoints(oData, oRowInfo);
				var aPoints = sPoints.split(" ");
				if (aPoints !== undefined && aPoints[0] == ""){
					aPoints.splice(0, 1);
				}
				if (aPoints !== undefined && aPoints.length > 1) {
					sPath = "M ";
					var sP;
					for (var i in aPoints) {
						sP = aPoints[i].split(",");
						if (aPoints[i] !== "" && sP.length > 1) {
							if (i == aPoints.length - 1) {//polygon has a closed path and the polyline doesn't need to be closed
								if (sParentTag === "polygon") {
									sPath = sPath + sP[0] + " " + sP[1] + " z";
								}else {
									sPath = sPath + sP[0] + " " + sP[1];
								}
							}else {
								sPath = sPath + sP[0] + " " + sP[1] + " L ";
							}
						}
					}
				}
				break;
			case "circle":
				var cX, cY, r;
				cX = this.getParent().getCx(oData, oRowInfo);
				cY = this.getParent().getCy(oData, oRowInfo);
				r = this.getParent().getR(oData);
				//e.g. "M230 230 A 45 45, 0, 1, 1, 275 275--3/4 circle
				sPath = "M " + cX + " " + cY 
						+ " A " + r + " " + r + ", 0, 1, 1, " + cX + " " + cY;
				break;
			case "text":
				break;
			default://group
				var iWidth;
				var iParentStrokeWidth = this.getParent().getStrokeWidth(oData, oRowInfo);
				iStrokeWidth = this.getStrokeWidth(oData, oRowInfo);
				var startTime = this.getParent().getTime(oData, oRowInfo);
				var endTime = this.getParent().getEndTime(oData, oRowInfo);
				var oAxisTime = this.getParent().getAxisTime();
				var iHeight = this.getHeight(oData);

				if (Core.getConfiguration().getRTL()) {
					x1 = oAxisTime.timeToView(Format.abapTimestampToDate(endTime));
					x2 = oAxisTime.timeToView(Format.abapTimestampToDate(startTime));
				} else {
					x1 = oAxisTime.timeToView(Format.abapTimestampToDate(startTime));
					x2 = oAxisTime.timeToView(Format.abapTimestampToDate(endTime));
				}
				if (this.getParent().mShapeConfig.hasShapeProperty("y")) {
					y1 = this.getParent()._configFirst("y", oData) - iStrokeWidth / 2;
				}else {
					y1 = this.getParent().getRowYCenter(oData, oRowInfo) - iHeight / 2;
				}

				if (this.getParent().mShapeConfig.hasShapeProperty("width")) {
					iWidth = this.getParent()._configFirst("width", oData) + iStrokeWidth;
				}else {
					iWidth = x2 - x1 - iParentStrokeWidth - 1 + iStrokeWidth;
				}

				if (iWidth === 0 || iWidth < 0 || !iWidth) {
					iWidth = 2;
				}
				x2 = x1 + iWidth;
				y2 = y1 + iHeight;
				sPath = "M " + x1 + " " + y1 +
					" L " + x2 + " " + y1 +
					" L " + x2 + " " + y2 +
					" L " + x1 + " " + y2 + " z";
				break;
		}
		if(this.isValid(sPath)) {
			return sPath;
		} else {
			jQuery.sap.log.warning("SelectedShape generated invalid d: " + sPath + " from the given data: " + oData);
			return null;
		}
	};

	/**
	 * Gets the value of property <code>stroke</code>.
	 * 
	 * <p>
	 * Standard SVG 'stroke' attribute.
	 * See {@link http://www.w3.org/TR/SVG/painting.html#StrokeProperty SVG 1.1 specification for 'stroke'}.
	 * <b>Note:</b> An HTML color and URL reference to an SVG definition can be provided for strokes. SVG definitions usually come from SVG definitions rendered by
	 * {@link sap.gantt.GanttChartContainer}, {@link sap.gantt.GanttChartWithTable}, or {@link sap.gantt.GanttChart}.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of property <code>stroke</code>.
	 * @public
	 */
	SelectedShape.prototype.getStroke = function (oData, oRowInfo) {
		return "red";
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
	SelectedShape.prototype.getFill = function (oData, oRowInfo) {
		return "none";
	};

	/**
	 * Gets the value of property <code>strokeWidth</code>.
	 * 
	 * <p>
	 * Standard SVG 'stroke-width' attribute.
	 * See {@link http://www.w3.org/TR/SVG/painting.html#StrokeWidthProperty SVG 1.1 specification for 'stroke-width'}.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {number} Value of property <code>strokeWidth</code>.
	 * @public
	 */
	SelectedShape.prototype.getStrokeWidth = function (oData, oRowInfo) {
		var iStrokeWidth = this.getParent().getStrokeWidth(oData, oRowInfo);
		return iStrokeWidth ? iStrokeWidth : 2;
	};
	
	/**
	 * Gets the value of property <code>transform</code>.
	 * 
	 * <p>
	 * Standard SVG 'transform' attribute.
	 * See {@link http://www.w3.org/TR/SVG/coords.html#TransformAttribute SVG 1.1 specifica6tion for 'transform'}.
	 * The implementation of getTransform() provides some logic to enable properties <code>rotationCenter</code> and <code>rotationAngle</code>. 
	 * If you override the default value calculated by the getter, proper rotation is not guaranteed.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of property <code>transform</code>.
	 * @public
	 */
	SelectedShape.prototype.getTransform = function (oData, oRowInfo) {
		return this.getParent().getTransform(oData, oRowInfo);
	};
	
	/**
	 * Gets the value of property <code>enableDnD</code>.
	 * 
	 * <p>
	 * This value determines whether the selectedShape of a shape is enabled for drag-and-drop.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {boolean} Value of property <code>enableDnD</code>.
	 * @public
	 */
	SelectedShape.prototype.getEnableDnD = function (oData, oRowInfo) {
		return false;
	};
	
	/**
	 * Gets the value of property <code>enableSelection</code>.
	 * 
	 * <p>
	 * This value determines whether the selectedShape of a shape is enabled for selection.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {boolean} Value of property <code>enableSelection</code>.
	 * @public
	 */
	SelectedShape.prototype.getEnableSelection = function (oData, oRowInfo) {
		return false;
	};
	
	/**
	 * Gets the value of property <code>height</code>.
	 * 
	 * <p>
	 * This value determines the height of the selectedShape.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @return {number} Value of property <code>height</code>.
	 * @public
	 */
	SelectedShape.prototype.getHeight = function (oData) {
		return this._configFirst("height", oData, true);
	};
	
	return SelectedShape;
}, true);
