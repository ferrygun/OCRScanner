/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

// Provides control sap.gantt.shape.ResizeShadowShape.
sap.ui.define([
	"sap/gantt/shape/Path", "sap/gantt/misc/Utility", "sap/gantt/misc/Format", "sap/ui/core/Core"
], function (Path, Utility, Format, Core) {
	"use strict";
	
	/**
	 * Constructor for a new ResizeShadowShape.
	 *
	 * @param {string} [sId] ID of the ResizeShadowShape instance
	 * @param {object} [mSettings] Initial instance for the new control
	 *
	 * @class
	 * <p>
	 *     Provides an implementation of shadow shapes, allowing you to create a highlighting effect by drawing the shadow shapes with thicker strokes in red. 
	 * </p>
	 *
	 *
	 * @extends sap.gantt.shape.Path
	 * @version 1.52.4
	 *
	 * @constructor
	 * @public
	 * @alias sap.gantt.shape.ResizeShadowShape
	 */
	var ResizeShadowShape = Path.extend("sap.gantt.shape.ResizeShadowShape", {
		metadata: {
			properties: {
				height: {type: "int", defaultValue: 15}
			}
		}
	});
	
	ResizeShadowShape.prototype.getIsDuration = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("isDuration")) {
			return this._configFirst("isDuration", oData);
		}
		return this.getParent().getIsDuration();
	};
	
	ResizeShadowShape.prototype.getD = function (oData, oRowInfo) {
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
				var	startTime = this.getParent().getTime(oData, oRowInfo);
				var	endTime = this.getParent().getEndTime(oData, oRowInfo);
				var	oAxisTime = this.getParent().getAxisTime();
				var iHeight = this.getHeight(oData) + iParentStrokeWidth;

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
					y1 = this.getParent().getRowYCenter(oData, oRowInfo) - iHeight / 2 - iStrokeWidth / 2;
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
			jQuery.sap.log.warning("ResizeShadowShape generated invalid d: " + sPath + " from the given data: " + oData);
			return null;
		}
	};
	
	ResizeShadowShape.prototype.getStrokeWidth = function (oData, oRowInfo) {
		var iStrokeWidth = this.getParent().getStrokeWidth(oData, oRowInfo);
		return iStrokeWidth ? iStrokeWidth : 2;
	};
	
	ResizeShadowShape.prototype.getTransform = function (oData, oRowInfo) {
		return this.getParent().getTransform(oData, oRowInfo);
	};
	
	ResizeShadowShape.prototype.getEnableSelection = function (oData, oRowInfo) {
		return false;
	};
	
	ResizeShadowShape.prototype.getStroke = function (oData, oRowInfo) {
		return "red";
	};
	
	ResizeShadowShape.prototype.getFill = function (oData, oRowInfo) {
		return "none";
	};
	
	ResizeShadowShape.prototype.getHeight = function (oData) {
		return this._configFirst("height", oData, true);
	};
	
	return ResizeShadowShape;
}, true);
