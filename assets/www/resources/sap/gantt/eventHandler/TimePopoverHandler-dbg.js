/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"jquery.sap.global", "sap/ui/base/Object", "sap/ui/core/Core"
], function (jQuery, BaseObject, Core) {
	"use strict";

	/**
	 * Constructor for a new TimePopoverHandler
	 *
	 * Initialize the handler and reserve the caller of this handler as the '_oSourceChart'
	 * currently, '_oSourceChart' may be an instance of GanttChart or GanttChartWithTable
	 * @param {object} oChart an instance of the caller
	 *
	 * @class
	 * Handler for shape dragging event
	 * @extends sap.ui.base.Object
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @constructor
	 * @private
	 * @alias sap.gantt.eventHandler.TimePopoverHandler
	 */
	var TimePopoverHandler = BaseObject.extend("sap.gantt.eventHandler.TimePopoverHandler", {
		constructor : function (oChart) {
			BaseObject.call(this);
			this._bSelectShape = false;
			this._bDragShape = false;
			this._iOffsetX = 0;
			this._iOffsetY = -28;
			this._oSourceChart = oChart;
			this._oTimePopoverModel = undefined;
		}
	});

	TimePopoverHandler.prototype.handleTimePopover = function (oEvent) {
		this._handleTimePopoverDragStart(oEvent);
	};

	TimePopoverHandler.prototype._handleTimePopoverDragStart = function(oEvent){
		var iMouseXpos = this._oSourceChart._getMouseXPos(oEvent);
		this._bSelectShape = false;
		this._bDragShape = false;
		if (Core.getConfiguration().getRTL()){
			var iToXGap = this._oSourceChart._oDraggingData.dragStartPoint.x - this._oSourceChart._oDraggingData.dragStartPoint.shapeX;
			this._iOffsetX = Math.ceil(iToXGap);
		}else{
			var iToXGap = this._oSourceChart._oDraggingData.dragStartPoint.shapeX + this._oSourceChart._oDraggingData.dragStartPoint.shapeWidth - this._oSourceChart._oDraggingData.dragStartPoint.x;
			this._iOffsetX = -Math.ceil(iToXGap);
		}
		var iRowHeight = this._oSourceChart.getBaseRowHeight();
		this._iOffsetY = parseInt(-(iRowHeight) / 2, 10);

		jQuery(document.body).unbind("mousemove.shapeDragDrop");
		jQuery(document).unbind("mouseup.shapeDragDrop");
		jQuery(document.body).bind("mousemove.shapeDragDrop", this._handleTimePopoverDragging.bind(this));
		jQuery(document).bind("mouseup.shapeDragDrop", this._handleTimePopoverEnd.bind(this));

	};

	TimePopoverHandler.prototype._handleTimePopoverDragging = function (oEvent) {
		var aSvg = jQuery(this._oSourceChart.getDomSelectorById("svg"));
		var aDragDiv = d3.select("#dragDropShadow");
		var dragDiv = aDragDiv[0];
		if (this._oSourceChart.getEnableShapeTimeDisplay() && dragDiv[0]){
			var oPositionData = this._getPopoverPosition(oEvent);
			this._displayTimePopover(oPositionData, dragDiv);
		}
	};

	TimePopoverHandler.prototype._displayTimePopover = function(oPositionData, dragDiv) {
		if (!this._isDraggingShape()){
			this._changeDraggingStatus();
		}
		else if (!this._existsPopover()){
			this._buildPopover(oPositionData);
			this.oTimePopover.openBy(dragDiv);
		}
		else{
			this._updatePopover(oPositionData);
		}

	};

	TimePopoverHandler.prototype._buildPopover = function(oPositionData) {
		var sStart = sap.ui.getCore().getLibraryResourceBundle("sap.gantt").getText("GNT_CURRENT_START");
		var sEnd = sap.ui.getCore().getLibraryResourceBundle("sap.gantt").getText("GNT_CURRENT_END");

		this.oTimePopover = new sap.m.ResponsivePopover({
			showArrow: false,
			showHeader: false,
			offsetX: "{time>/offsetX}",
			offsetY: "{time>/offsetY}",
			placement: "{time>/placement}",
			//title : "Current time interval",
			content : [new sap.m.FlexBox({
				alignItems: "Center",
				items: [new sap.m.Panel({
					content: [ new sap.m.FlexBox({
						alignItems: "Center",
						justifyContent: "End",
						items: [new sap.m.Label({text : sStart})]
					}).addStyleClass("sapUiTinyMargin"),
					new sap.m.FlexBox({
						alignItems: "Center",
						justifyContent: "End",
						items: [new sap.m.Label({text : sEnd})]
					}).addStyleClass("sapUiTinyMargin")]
				}).addStyleClass("sapUiNoContentPadding"),
				new sap.m.Panel({
					content: [ new sap.m.FlexBox({
						justifyContent: "Start",
						items: [new sap.m.Label({text: "{time>/startNewDate}"})]
					}).addStyleClass("sapUiTinyMargin"),
					new sap.m.FlexBox({
						justifyContent: "Start",
						items: [new sap.m.Label({text: "{time>/endNewDate}"})]
					}).addStyleClass("sapUiTinyMargin")]
				}).addStyleClass("sapUiNoContentPadding")]
			})]
		});

		this._oTimePopoverModel = new sap.ui.model.json.JSONModel(oPositionData);
		this.oTimePopover.setModel(this._oTimePopoverModel, "time");
	};

	TimePopoverHandler.prototype._updatePopover = function(oPositionData){
		/*Popover must create new model when updating data*/
		this._oTimePopoverModel = new sap.ui.model.json.JSONModel();
		this._oTimePopoverModel.setData(oPositionData);
		this.oTimePopover.setModel(this._oTimePopoverModel, "time");

	};

	TimePopoverHandler.prototype._calPopoverPosition = function(sStartTimetamp, sEndTimestamp){
		var oFormatOptions = {
			pattern: "yyyy-MM-dd HH:mm:ss"
		};
		var sLang = sap.ui.getCore().getConfiguration().getLanguage();
		var oLocale = new sap.ui.core.Locale(sLang);
		var oFormatter = sap.ui.core.format.DateFormat.getDateTimeInstance(oFormatOptions, oLocale);

		var sStartNewDate = oFormatter.format(new Date(sStartTimetamp));
		var sEndNewDate = oFormatter.format(new Date(sEndTimestamp));

		var oPositionData = {
			startNewDate: sStartNewDate,
			endNewDate: sEndNewDate,
			offsetX: this._iOffsetX,
			offsetY: this._iOffsetY,
			placement: sap.m.PlacementType.Right
		};

		return oPositionData;
	};

	TimePopoverHandler.prototype._changeDraggingStatus = function(){
		if (this._bSelectShape){
			this._bDragShape = true;
		}
		if (!this._bSelectShape){
			this._bSelectShape  = true;
		}
	};

	TimePopoverHandler.prototype._isDraggingShape = function(){
		return this._bSelectShape && this._bDragShape;
	};

	TimePopoverHandler.prototype._existsPopover = function(){
		return this.oTimePopover !== undefined;
	};

	TimePopoverHandler.prototype._getPopoverPosition = function(oEvent) {
		this._oSourceChart._collectDraggingShapeData(this._oSourceChart._oDraggingData, oEvent);
		var oTargetData = this._oSourceChart._oDraggingData.targetData;
		var oPosition = this._calPopoverPosition(oTargetData["mouseTimestamp"].startTime,  oTargetData["mouseTimestamp"].endTime);
		return oPosition;
	};

	TimePopoverHandler.prototype._handleTimePopoverEnd = function() {
		if (this.oTimePopover /*&& this.oTimePopover.isOpen()*/){
			this.oTimePopover.destroy();
			this.oTimePopover = undefined;
		}
		jQuery(document.body).unbind("mousemove.shapeDragDrop");
		jQuery(document.body).unbind("mouseup.shapeDragDrop");
	};

	return TimePopoverHandler;
}, true);