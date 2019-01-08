/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"jquery.sap.global", "sap/ui/Device", "sap/ui/base/Object", "sap/gantt/misc/ShapeManager", 
	"sap/gantt/misc/Format", "sap/ui/core/Core", "sap/gantt/misc/Utility", "sap/gantt/drawer/ShapeInRow"
], function (jQuery, Device, BaseObject, ShapeManager, Format, Core, Utility, ShapeInRowDrawer) {
	"use strict";
	/**
	 * Constructor for a new ShapeResizeHandler
	 *
	 * Initializes the handler and reserves the caller of this handler as the '_oSourceChart'. 
	 * '_oSourceChart' can either be an instance of GanttChart or an instance of GanttChartWithTable.
	 * @param {object} oChart An instance of the caller
	 * 
	 * @class
	 * Defines the properties required for the initialization of shape resizing
	 * @extends sap.ui.base.Object
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @constructor
	 * @private
	 * @alias sap.gantt.eventHandler.ShapeResizeHandler
	 */
	var ShapeResizeHandler = BaseObject.extend("sap.gantt.eventHandler.ShapeResizeHandler", {
		constructor : function (oChart) {
			BaseObject.call(this);
			this._oSourceChart = oChart;
			this._bResizing = false;
			this._oResizingData = undefined;
			this._oShapeManager = oChart._oShapeManager;
			this._oSourceChartId = this._oSourceChart.getId();
			this._oShapeInRowDrawer = new ShapeInRowDrawer();
			/*The threshold to show the resize cursor.
			  If the distance between the hover position in the shape and the any side of the shape is less than this threshold,the resize cursor appears.
			  The default value is 15 pixels.*/
			this._DEFAULT_RESIZE_CURSOR_SHOWING_THRESHOLD = 15;
			//Defines the minimum mouse moving distance that triggers the shape resize process, which defaults to 3 pixels.
			this._DEFAULT_MOUSE_MOVE_PIXEL = 3;
			//Identifies the configured shape start time
			this._TIMESTAMP_START_TIME_KEY = "time";
			//Identifies the configured shape end time
			this._TIMESTAMP_END_TIME_KEY = "endTime";
		}
	});
	
	/**
	 * Getter for the resizing behavior
	 * @param {boolean} Indicates whether or not the resize process occurs
	 */
	ShapeResizeHandler.prototype.getIsResizing = function () {
		return this._bResizing;
	};
	
	/**
	 * Getter for the resizing data
	 * @param {object} Get resizing related data
	 */
	ShapeResizeHandler.prototype.getResizingData = function () {
		return this._oResizingData;
	};
	

	/**
	 * Invoke shape resize
	 * @param {object} oEvent JQuery event object
	 */
	ShapeResizeHandler.prototype.handleShapeResize = function (oEvent) {
		if (oEvent.button === 0) {
			var oShapeData = d3.select(oEvent.target).datum();
			if (oEvent.target.getAttribute("class") && oShapeData) {
				var sClassId = oEvent.target.getAttribute("class").split(" ")[0];
				if (d3.select(oEvent.target).classed("sapUiShapeResizingCursor") 
						&& this._oShapeManager.isShapeResizable(oShapeData, sClassId)
						&& this._oShapeManager.isShapeDuration(oShapeData, sClassId)) {
					this._handleShapeResizeStart(oEvent);
					this._preventBubbleAndDefault(oEvent);
				}
			}
		}
	};
	
	ShapeResizeHandler.prototype._handleShapeResizeStart = function (oEvent) {
		var aSvg = jQuery(this._oSourceChart.getDomSelectorById("svg"));
		//if mouse down on a shape that is resizable
		var shapeData = d3.select(oEvent.target).datum();
		if (shapeData) {
			var rowInfo = Utility.getRowDatumByShapeUid(shapeData.uid, this._oSourceChart.getId());
			if (rowInfo) {
				//+y info
				rowInfo.y = this._oSourceChart._oAxisOrdinal.elementToView(rowInfo.uid);
				//get current position of the mouse
				var x = oEvent.pageX - aSvg.offset().left || oEvent.offsetX;
				//var topShapeInstance = this._oShapeManager.getShapeInstance(shapeData, oEvent.target.getAttribute("class").split(" ")[0]);
				var topShapeInstance = this._getTopShapeInstance(shapeData, oEvent.target.getAttribute("class").split(" ")[0]);
				var startTime, endTime;
				if (topShapeInstance) {
					if (Core.getConfiguration().getRTL() === true) {
						startTime = topShapeInstance.getEndTime(shapeData);
						endTime = topShapeInstance.getTime(shapeData);
					} else {
						startTime = topShapeInstance.getTime(shapeData);
						endTime = topShapeInstance.getEndTime(shapeData);
					}
				}
				var oShapeData = {
						"shapeData": shapeData,
						"objectInfoRef": rowInfo
				};
				this._oResizingData = {
						"oShapeData": oShapeData,
						"aOldTime": [startTime, endTime],
						"resizeStartPointX": x,
						"topShapeInstance": topShapeInstance
				};
				jQuery(document.body).unbind("mousemove.shapeResizing");
				jQuery(document.body).unbind("mouseup.shapeResizing");
				jQuery(document.body).bind("mousemove.shapeResizing", this._handleShapeResizing.bind(this));
				jQuery(document.body).bind("mouseup.shapeResizing", this._handleShapeResizeEnd.bind(this));
			}	
		}
	};
	
	ShapeResizeHandler.prototype.checkShapeResizable = function (oShapeData, sTarget, sPointX) {
		if (oShapeData && sTarget && sPointX) {
			jQuery(sTarget).removeClass("sapUiShapeResizingCursor");
			var sClassId = sTarget.getAttribute("class") ? 
					sTarget.getAttribute("class").split(" ")[0] : undefined;
			//prevent pass special class like "sapGanttExpandChartCntBG", "sapGanttChartAdhocTimestamp"	
			if (sClassId.indexOf("__") < 0) {
				return;
			} 		
			if (this._oShapeManager.isShapeResizable(oShapeData, sClassId)) {
				var hoverPointDistance, shapeStartX, shapeEndX;
				var oShapeInstance = this._getShapeInstance(oShapeData, sClassId);
				
				if (oShapeInstance) {
					var oStartTime = oShapeInstance.getTime(oShapeData);
					var oEndTime = oShapeInstance.getEndTime(oShapeData);
					
					shapeStartX = this._oSourceChart.getAxisTime().timeToView(Format.abapTimestampToDate(oStartTime));
					shapeEndX = this._oSourceChart.getAxisTime().timeToView(Format.abapTimestampToDate(oEndTime));
					
					hoverPointDistance = Math.abs(shapeEndX - sPointX) < Math.abs(shapeStartX - sPointX) 
											? Math.abs(shapeEndX - sPointX) :  Math.abs(shapeStartX - sPointX);
				}
				//if the distance between hover position in the shape and the any side of the shape is less than 15 pixel, show the cursor
				if (hoverPointDistance <= this._DEFAULT_RESIZE_CURSOR_SHOWING_THRESHOLD) { 
					jQuery(sTarget).addClass("sapUiShapeResizingCursor");
				} else {
					jQuery(sTarget).removeClass("sapUiShapeResizingCursor");
				}
			}
		}		
	};
	
	ShapeResizeHandler.prototype._preventBubbleAndDefault = function (oEvent) {
		oEvent.preventDefault();
		oEvent.stopPropagation();
	};
	
	ShapeResizeHandler.prototype._handleShapeResizing = function (oEvent) {
		if (!Device.support.touch && (oEvent.button !== 0 || oEvent.buttons === 0 || oEvent.ctrlKey)) {
			return false;
		}
		var aSvg = jQuery(this._oSourceChart.getDomSelectorById("svg"));
		var dx = Math.abs((oEvent.pageX - aSvg.offset().left || oEvent.offsetX) - this._oResizingData.resizeStartPointX);
		//if the mouse moving distance is greater than 3 pixels, resizing can be easily to identify
		if (dx > this._DEFAULT_MOUSE_MOVE_PIXEL) {
			if (this._oResizingData !== undefined) {
				this._updateResizingShapeData(oEvent);
				this._bResizing = true;
				//trigger auto-scrolling when resizing
				this._oSourceChart._oAutoScrollHandler.autoScroll(this._oSourceChart, oEvent);
			}
		}
	};
	
	ShapeResizeHandler.prototype._updateResizingShapeData = function (oEvent) {
		var aSvg = jQuery(this._oSourceChart.getDomSelectorById("svg"));
		var currentX = oEvent.pageX - aSvg.offset().left || oEvent.offsetX;
		var aResizedNewTime = this._calculateResizedNewTime(currentX);
		this._drawResizingShadow(aResizedNewTime);
	};
	
	ShapeResizeHandler.prototype._parseShapeTimeProperty = function (oShapeInstance, sAttrName) {
		var sPropertyValue;
		if (oShapeInstance.mShapeConfig.hasShapeProperty(sAttrName)) {
			var sConfigAttr = oShapeInstance.mShapeConfig.getShapeProperty(sAttrName);
			if (typeof sConfigAttr === "string" 
				&& sConfigAttr.charAt(0) === "{" 
					&& sConfigAttr.charAt(sConfigAttr.length - 1) === "}") {
				sPropertyValue = sConfigAttr.substring(1, sConfigAttr.length - 1);
			}
		} 
		return sPropertyValue;
	};
	
	ShapeResizeHandler.prototype._drawResizingShadow = function (oResizedNewTime) {
		var aSvg = d3.select(this._oSourceChart.getDomSelectorById("svg"));
		if (oResizedNewTime) {
			//clone data
			var clonedShapeData = jQuery.extend(true, {}, this._oResizingData.oShapeData.shapeData);
			var oShadowShape = this._oResizingData.topShapeInstance.getAggregation("resizeShadowShape");
			
			var oConfigTime = this._parseShapeTimeProperty(oShadowShape, this._TIMESTAMP_START_TIME_KEY);
			var oConfigEndTime = this._parseShapeTimeProperty(oShadowShape, this._TIMESTAMP_END_TIME_KEY);
			
			var sNewStartTime, sNewEndTime;
			if (Core.getConfiguration().getRTL() === true) {
				sNewStartTime = oResizedNewTime[1];
				sNewEndTime = oResizedNewTime[0];
			} else {
				sNewStartTime = oResizedNewTime[0];
				sNewEndTime = oResizedNewTime[1];
			}
			if (clonedShapeData[oConfigTime]) {
				clonedShapeData[oConfigTime] = sNewStartTime;
			}
			if (clonedShapeData[oConfigEndTime]) {
				clonedShapeData[oConfigEndTime] = sNewEndTime;
			}
			var sBaseDataSet = {
					"objectInfoRef" : this._oResizingData.oShapeData.objectInfoRef
			};
			sBaseDataSet.shapeData = clonedShapeData;
			//draw shadow through shapeInRow drawer
			oShadowShape.dataSet = [sBaseDataSet];
			this._oShapeInRowDrawer.drawResizeShadow(aSvg, oShadowShape,
					this._oSourceChart.getAxisTime(), this._oSourceChart._oAxisOrdinal, this._oSourceChart._oStatusSet);		
		}
	};
	
	ShapeResizeHandler.prototype._calculateResizedNewTime = function (oCurrentX) {
		var aResizedNewTime = [];
		var aNewStartTime, aNewEndTime;
		
		var oldStartTime = this._oResizingData.aOldTime[0];
		var oldEndTime = this._oResizingData.aOldTime[1];
		
		var oldStartTimeX = this._oSourceChart.getAxisTime().timeToView(Format.abapTimestampToDate(oldStartTime));
		var oldEndTimeX = this._oSourceChart.getAxisTime().timeToView(Format.abapTimestampToDate(oldEndTime));
		
		var isLeftSideClick = undefined;
		if (this._oResizingData.isLeftSideClick !== undefined 
				&& this._oResizingData.isLeftSideClick !== null) {
			isLeftSideClick = this._oResizingData.isLeftSideClick;
		} else {
			isLeftSideClick = Math.abs(this._oResizingData.resizeStartPointX - oldStartTimeX) < Math.abs(this._oResizingData.resizeStartPointX - oldEndTimeX) ? true : false;
			this._oResizingData.isLeftSideClick = isLeftSideClick;
		}
		if (isLeftSideClick) {//click shape start point to reduce or increase shape
			aNewEndTime = oldEndTime;
			//if resize the shape left start point to move to exceed the right end point of the shape, 
			//set the start x coordinate value as the one of end x
			if (oCurrentX >= oldEndTimeX) {
				aNewStartTime = oldEndTime;//this._oResizingData.originalShapeData.shapeData.endTime;
			} else {
				aNewStartTime = Format.dateToAbapTimestamp(this._oSourceChart.getAxisTime().viewToTime(oCurrentX));
			}
			
		} else {//click shape end point to reduce or increase shape
			aNewStartTime = oldStartTime;
			//if resize the shape right end point to move to exceed the left start point of the shape, 
			//set the end x coordinate value as the one of start x
			if (oCurrentX <= oldStartTimeX) {
				aNewEndTime = oldStartTime;//this._oResizingData.originalShapeData.shapeData.startTime;
			} else {
				aNewEndTime = Format.dateToAbapTimestamp(this._oSourceChart.getAxisTime().viewToTime(oCurrentX));
			}
		}
		aResizedNewTime = [aNewStartTime, aNewEndTime];
		return aResizedNewTime;
	};
	
	ShapeResizeHandler.prototype._getShapeInstance = function (oShapeData, sClassId) {
		var mShapeInstance = this._oShapeManager.getShapeInstance(oShapeData, sClassId);
		if (mShapeInstance) {
			if (mShapeInstance.getId() === sClassId) {
				return mShapeInstance;
			} else if (mShapeInstance.getShapes()) {
				var shapes = mShapeInstance.getShapes();
				for (var i = 0; i < shapes.length; i++) {
					if (shapes[i].getId() === sClassId) {
						return shapes[i];
					}
				}
			}
		} else { //fix the issue of 0 duration shape can't be resized, here using selected shapeId to get the top shape
			var oTopShapeInstance = Core.byId(sClassId).getParent();
			if (oTopShapeInstance) {
				return oTopShapeInstance;
			}
		}
		return undefined;
	};
	
	ShapeResizeHandler.prototype._getTopShapeInstance = function (oShapeData, sClassId) {
		var mShapeInstance = this._oShapeManager.getShapeInstance(oShapeData, sClassId);
		if (mShapeInstance) {
			return mShapeInstance;
		} else { //fix the issue of 0 duration shape can't be resized, here using selected shapeId to get the top shape
			var oTopShapeInstance = Core.byId(sClassId).getParent();
			if (oTopShapeInstance) {
				return oTopShapeInstance;
			}
		}
		return undefined;
	};
	
	ShapeResizeHandler.prototype._handleShapeResizeEnd = function (oEvent) {
		this._oSourceChart._oAutoScrollHandler.stop();
		var resizeShadowG = d3.selectAll(".resizingShadow");
		if (!resizeShadowG.empty()){
			resizeShadowG.remove();
		}
		if (this._bResizing && this._oResizingData !== undefined) {
			this._collectResizingShapeData(oEvent);
			this._oSourceChart.fireShapeResizeEnd({
				shapeUid: this._oResizingData.oShapeData.shapeData.uid,
				rowObject: this._oResizingData.oShapeData.objectInfoRef,
				oldTime: this._oResizingData.aOldTime,
				newTime: this._oResizingData.aNewTime
			});
		}
		jQuery(document.body).unbind("mousemove.shapeResizing");
		jQuery(document.body).unbind("mouseup.shapeResizing");
		jQuery(oEvent.target).removeClass("sapUiShapeResizingCursor");
		
		this._bResizing = false;
		this._oResizingData = undefined;
	};
	
	ShapeResizeHandler.prototype._collectResizingShapeData = function (oEvent) {
		var aSvg = jQuery(this._oSourceChart.getDomSelectorById("svg"));
		var oCurrentX = oEvent.pageX - aSvg.offset().left || oEvent.offsetX;
		var resizedShapeData = this._calculateResizedNewTime(oCurrentX);
		var sNewStartTime, sNewEndTime;
		if (Core.getConfiguration().getRTL() === true) {
			sNewStartTime = resizedShapeData[1];
			sNewEndTime = resizedShapeData[0];
		} else {
			sNewStartTime = resizedShapeData[0];
			sNewEndTime = resizedShapeData[1];
		}
		this._oResizingData.aNewTime = [sNewStartTime, sNewEndTime];
	};


	return ShapeResizeHandler;
}, true);
