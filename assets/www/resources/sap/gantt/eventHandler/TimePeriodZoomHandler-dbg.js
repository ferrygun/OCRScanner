/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"jquery.sap.global", "sap/ui/base/Object", "sap/gantt/misc/Format", "sap/gantt/config/TimeHorizon",
	"sap/gantt/drawer/TimePeriodZoomRectangle", "sap/ui/core/Orientation", "sap/gantt/misc/Utility"
], function (jQuery, BaseObject, Format, TimeHorizon, TimePeriodZoomRectangle, Orientation, Utility) {
	"use strict";

	/**
	 * Constructor for a new TimePeriodZoomHandler
	 *
	 * Initialize the handler and reserve the caller of this handler as the '_oSourceChart'
	 * currently, '_oSourceChart' may be an instance of GanttChart or GanttChartWithTable
	 * @param {object} oChart an instance of the caller
	 * 
	 * @class
	 * Defines the properties required for the initialization of time period zooming
	 * @extends sap.ui.base.Object
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @constructor
	 * @private
	 * @alias sap.gantt.eventHandler.TimePeriodZoomHandler
	 */
	var TimePeriodZoomHandler = BaseObject.extend("sap.gantt.eventHandler.TimePeriodZoomHandler", {
		constructor : function (oChart) {
			BaseObject.call(this);
			this._oSourceChart = oChart;
			this._oTimePeriodZoomRectangleDrawer = new TimePeriodZoomRectangle();
			this._bActive = false;
			//we need to lock mode because when user is dragging but release(key up) the Z button on keyboard,
			//gantt chart must keep the cursor style.
			this._bLocked = false;
			this._bMouseOnSvg = false;
			this._bEnableSetVisibleHorizon = false;
			this._sAutoScrollDirection = undefined;
		}
	});

	TimePeriodZoomHandler.prototype.activate = function (bSuppressEvent){
		this._bActive = true;
		var $svgCtn = jQuery(this._oSourceChart.getDomSelectorById("svg-ctn"));
		$svgCtn.css("cursor", "crosshair");
		if (!bSuppressEvent){
			this.fireActiveStatusChangeEvent(this._bActive);
		}
	};

	TimePeriodZoomHandler.prototype.deactivate = function (bSuppressEvent){
		this._bActive = false;
		var $svgCtn = jQuery(this._oSourceChart.getDomSelectorById("svg-ctn"));
		$svgCtn.css("cursor", "auto");
		if (!bSuppressEvent){
			this.fireActiveStatusChangeEvent(this._bActive);
		}
	};

	TimePeriodZoomHandler.prototype.invertActiveStatus = function (){
		if (this._bActive){
			this.deactivate();
		} else {
			this.activate();
		}
	};

	TimePeriodZoomHandler.prototype.fireActiveStatusChangeEvent = function (bActive){
		this._oSourceChart.fireEvent("_timePeriodZoomStatusChange", {
			isActive: bActive
		});
	};

	TimePeriodZoomHandler.prototype.isTimePeriodZoomEnabled = function (){
		var oAxisTimeStrategy = this._oSourceChart.getAxisTimeStrategy();
		return oAxisTimeStrategy.isTimePeriodZoomEnabled() && this._bMouseOnSvg;
	};

	TimePeriodZoomHandler.prototype.isActive = function (){
		return this._bActive;
	};

	TimePeriodZoomHandler.prototype.handleDragStart = function (oEvent, bSuppressEvent){

		var oGantt = this._oSourceChart;
		this._bLocked = true;
		this._bEnableSetVisibleHorizon = true;

		this.oStartEvent = oEvent;
		this.oStartTime = this._caculateEventTime(oEvent);

		this.createRectangle(this.oStartTime);

		var $GanttSvg = jQuery(oGantt.getDomSelectorById("svg"));

		$GanttSvg.unbind("mousemove.timePeriodZoomDragDrop");
		jQuery(document.body).unbind("mouseup.timePeriodZoomDragDrop");
		oGantt.detachHorizontalScroll(this.handleAutoScroll, this);

		$GanttSvg.bind("mousemove.timePeriodZoomDragDrop", this.handleDragging.bind(this));
		jQuery(document.body).bind("mouseup.timePeriodZoomDragDrop", this.handleDragEnd.bind(this));
		oGantt.attachHorizontalScroll(this.handleAutoScroll, this);

		if(!bSuppressEvent){
			this._bMouseOnSvg = true;
			oGantt.fireEvent("_timePeriodZoomOperation", {
				type: "dragStart",
				dragStartTime: this.oStartTime,
				originalEvent: oEvent
			});
		}
	};

	TimePeriodZoomHandler.prototype.createRectangle = function (oDragStartTime){
		var oGantt = this._oSourceChart;
		var iDragStartX = oGantt.getAxisTime().timeToView(oDragStartTime);
		var aSvgNode = d3.select(oGantt.getDomSelectorById("svg"));
		this._oTimePeriodZoomRectangleDrawer.drawSvg(aSvgNode, iDragStartX);
	};

	TimePeriodZoomHandler.prototype.handleDragging = function (oEvent, bSuppressEvent) {
		var oGantt = this._oSourceChart;

		var oDraggingTime = this._caculateEventTime(oEvent);
		this.updateRectangle(this.oStartTime, oDraggingTime);

		if(!bSuppressEvent){
			var sDirection = oGantt._handleAutoScroll(oEvent);//trigger auto-scrolling when dragging
			if (sDirection){
				this._sAutoScrollDirection = sDirection;
			}
			oGantt.fireEvent("_timePeriodZoomOperation", {
				type: "dragging",
				dragStartTime: this.oStartTime,
				draggingTime: oDraggingTime,
				originalEvent: oEvent
			});
		}
	};

	TimePeriodZoomHandler.prototype.updateRectangle = function (oDragStartTime, oDraggingTime){
		var oGantt = this._oSourceChart;
		var iDragStartX = oGantt.getAxisTime().timeToView(oDragStartTime);
		var iDraggingX = oGantt.getAxisTime().timeToView(oDraggingTime);
		var aSvgNode = d3.select(oGantt.getDomSelectorById("svg"));
		if (iDraggingX > iDragStartX){
			this._oTimePeriodZoomRectangleDrawer.updateSvg(aSvgNode, iDragStartX, iDraggingX);
		} else {
			this._oTimePeriodZoomRectangleDrawer.updateSvg(aSvgNode, iDraggingX, iDragStartX);
		}
	};

	TimePeriodZoomHandler.prototype.handleDragEnd = function (oEvent, bSuppressEvent) {
		var oGantt = this._oSourceChart;
		oGantt._oAutoScrollHandler.stop();
		this._bLocked = false;
		this.deactivate();
		this._sAutoScrollDirection = undefined;

		this.destoryRectangle();

		var oDragEndTime;

		if (this._bEnableSetVisibleHorizon){
			var iDragStartX = oGantt.getAxisTime().timeToView(this.oStartTime);
			var iDraggingX = this._caculateXPosition(oEvent);
			oDragEndTime = this._caculateEventTime(oEvent);
			var oEndTime = oDragEndTime;

			// Time period zoom only can be triggered when drag and drop than 5 px 
			var iOperationIgnoreExtents = 5;
			if (Math.abs(iDraggingX - iDragStartX) > iOperationIgnoreExtents){ 

				var oStartTime = this.oStartTime;

				if (oEndTime.getTime() < oStartTime.getTime()){
					var oTempTime = oStartTime;
					oStartTime = oEndTime;
					oEndTime = oTempTime;
				}

				var oTargetTimeHorizon = new TimeHorizon({
					startTime: oStartTime,
					endTime: oEndTime
				});
				oGantt.syncVisibleHorizon(oTargetTimeHorizon);
			}
		}

		var $GanttSvg = jQuery(oGantt.getDomSelectorById("svg"));
		$GanttSvg.unbind("mousemove.timePeriodZoomDragDrop");
		jQuery(document.body).unbind("mouseup.timePeriodZoomDragDrop");
		oGantt.detachHorizontalScroll(this.handleAutoScroll, this);

		if(!bSuppressEvent){
			var iVisibleWidth = oGantt.getVisibleWidth();
			oGantt.fireEvent("_timePeriodZoomOperation", {
				type: "dragEnd",
				dragStartTime: this.oStartTime,
				dragEndTime: oDragEndTime,
				visibleWidth: iVisibleWidth,
				originalEvent: oEvent
			});
			this.fireActiveStatusChangeEvent(this._bActive);
		}
	};

	TimePeriodZoomHandler.prototype.destoryRectangle = function(){
		var oGantt = this._oSourceChart;
		var aSvgNode = d3.select(oGantt.getDomSelectorById("svg"));
		this._oTimePeriodZoomRectangleDrawer.destroySvg(aSvgNode);
	};

	TimePeriodZoomHandler.prototype.handleAutoScroll = function (oEvent) {
		if (this._bMouseOnSvg){
			var oGantt = this._oSourceChart;
			var oParameter = oEvent.getParameters();
			var iTimeBias;

			if (this._sAutoScrollDirection === "scrollLeft"){
				var oVisibleHorizonStratTime = Format.abapTimestampToDate(oParameter.startTime);
				iTimeBias = oVisibleHorizonStratTime.getTime() - this.oStartTime.getTime();
			} else if (this._sAutoScrollDirection === "scrollRight"){
				var oVisibleHorizonEndTime = Format.abapTimestampToDate(oParameter.endTime);
				iTimeBias = oVisibleHorizonEndTime.getTime() - this.oStartTime.getTime();
			}

			oGantt.fireEvent("_timePeriodZoomOperation", {
				type: "autoScroll",
				timeBias: iTimeBias,
				originalEvent: oEvent
			});
		}
	};

	TimePeriodZoomHandler.prototype.attachEvents = function(){
		var $GanttSvg = jQuery(this._oSourceChart.getDomSelectorById("svg"));
		$GanttSvg.bind("mouseenter.timePeriodZoomDragDrop", this.handleMouseEnter.bind(this));
		$GanttSvg.bind("mouseleave.timePeriodZoomDragDrop", this.handleMouseLeave.bind(this));
	};

	TimePeriodZoomHandler.prototype.detachEvents = function(){
		var $GanttSvg = jQuery(this._oSourceChart.getDomSelectorById("svg"));
		$GanttSvg.unbind("mouseenter.timePeriodZoomDragDrop");
		$GanttSvg.unbind("mouseleave.timePeriodZoomDragDrop");
	};

	TimePeriodZoomHandler.prototype.handleMouseEnter = function (oEvent) {
		this._bMouseOnSvg = true;
		this._bLocked = true;
		this.setEnableSetVisibleHorizon(true);
	};

	TimePeriodZoomHandler.prototype.handleMouseLeave = function (oEvent) {
		this._bMouseOnSvg = false;
		this._oSourceChart._oAutoScrollHandler.stop();
		this._bLocked = false;
		this.setEnableSetVisibleHorizon(false);
	};

	TimePeriodZoomHandler.prototype.setEnableSetVisibleHorizon = function (bEnable, bSuppressEvent) {
		this._bEnableSetVisibleHorizon = bEnable;

		if(!bSuppressEvent){
			var oGantt = this._oSourceChart;
			oGantt.fireEvent("_timePeriodZoomOperation", {
				type: "enableSetVisibleHorizon",
				enable: bEnable
			});
		}
	};

	TimePeriodZoomHandler.prototype.calculateTargetVisibleHorizonByTimeBias = function (iTimeBias) {
		var oTargetVisibleTimeHorizon;
		var oTargetTime;

		if (iTimeBias !== undefined){
			var oGantt = this._oSourceChart;
			var oTotalHorizon = oGantt.getAxisTimeStrategy().getTotalHorizon();
			oTargetTime = new Date();
			oTargetTime.setTime(this.oStartTime.getTime() + iTimeBias);

			if (iTimeBias < 0) { //left auto-scroll
				var oTotalHorizonStartTime = Format.abapTimestampToDate(oTotalHorizon.getStartTime());
	
				if (oTargetTime.getTime() < oTotalHorizonStartTime.getTime()) {// beyond the left boundary
					oTargetTime = oTotalHorizonStartTime;
					this.oStartTime.setTime(oTargetTime.getTime() - iTimeBias);
				}

				oTargetVisibleTimeHorizon = new TimeHorizon({
					startTime: oTargetTime
				});
			} else { //right auto-scroll
				var oTotalHorizonEndTime = Format.abapTimestampToDate(oTotalHorizon.getEndTime());

				if (oTargetTime.getTime() > oTotalHorizonEndTime.getTime()) {// beyond the right boundary
					oTargetTime = oTotalHorizonEndTime;
					this.oStartTime.setTime(oTargetTime.getTime() - iTimeBias);
				}

				oTargetVisibleTimeHorizon = new TimeHorizon({
					startTime: undefined,
					endTime: oTargetTime
				});
			}
		}
		

		return oTargetVisibleTimeHorizon;
	};

	TimePeriodZoomHandler.prototype.calculateTargetVisibleHorizon = function (oEventData, bSyncStartTime) {
		var oTargetVisibleTimeHorizon;

		if (oEventData.dragEndTime){
			var oGantt = this._oSourceChart;
			var oAxisTimeStrategy = oGantt.getAxisTimeStrategy();
			var oOriginalVisibleHorizon = oAxisTimeStrategy.getVisibleHorizon();
			var iGanttVisibleWidth = oGantt.getVisibleWidth();
			var iDragStartTime = oEventData.dragStartTime.getTime();
			var iDragEndTime = oEventData.dragEndTime.getTime();

			var oStartTime;
			if (bSyncStartTime) {
				oStartTime = iDragStartTime < iDragEndTime ? oEventData.dragStartTime : oEventData.dragEndTime;
			} else {
				oStartTime = Format.abapTimestampToDate(oAxisTimeStrategy.getVisibleHorizon().getStartTime());
			}

			oTargetVisibleTimeHorizon = Utility.calculateHorizonByWidth(oOriginalVisibleHorizon, oEventData.visibleWidth, iGanttVisibleWidth, oStartTime);
		}

		return oTargetVisibleTimeHorizon;
	};

	TimePeriodZoomHandler.prototype.syncTimePeriodZoomOperation = function(oEvent, bTimeScrollSync, sOrientation){
		var oGantt = this._oSourceChart;
		var oParameter = oEvent.getParameters();

		if (sOrientation === Orientation.Vertical){
			if (oParameter.type === "dragStart"){
				this.handleDragStart(oParameter.originalEvent, true);
			} else if (oParameter.type === "dragging"){
				this.handleDragging(oParameter.originalEvent, true);
			} else if (oParameter.type === "dragEnd"){
				this.handleDragEnd(oParameter.originalEvent, true);
			} else if (oParameter.type === "enableSetVisibleHorizon"){
				this.setEnableSetVisibleHorizon(oParameter.enable, true);
			} else if (oParameter.type === "autoScroll"){
				if (!bTimeScrollSync) {
					var oTargetTimeHorizon = this.calculateTargetVisibleHorizonByTimeBias(oParameter.timeBias);
					if (oTargetTimeHorizon) {
						oGantt.syncVisibleHorizon(oTargetTimeHorizon);
					}
				}
			}
		} else if (sOrientation === Orientation.Horizontal){
			if (oParameter.type === "dragStart" && bTimeScrollSync){
				this.createRectangle(oParameter.dragStartTime);
			} else if (oParameter.type === "dragging" && bTimeScrollSync){
				this.updateRectangle(oParameter.dragStartTime, oParameter.draggingTime);
			} else if (oParameter.type === "dragEnd"){
				if (bTimeScrollSync){
					this.destoryRectangle();
				}
				var oTargetTimeHorizon = this.calculateTargetVisibleHorizon(oParameter, bTimeScrollSync);
				if (oTargetTimeHorizon) {
					oGantt.syncVisibleHorizon(oTargetTimeHorizon);
				}
			}
		}
		
	};

	TimePeriodZoomHandler.prototype._caculateXPosition = function (oEvent) {
		var oGantt = this._oSourceChart;

		var iMouseXPos = oGantt._getMouseXPos(oEvent);
		var aSvgNode = jQuery(oGantt.getDomSelectorById("svg"));
		if (aSvgNode.offset()){
			var iXPosition = iMouseXPos - aSvgNode.offset().left || oEvent.offsetX;
		} else {
			return iMouseXPos;
		}

		return iXPosition;
	};

	TimePeriodZoomHandler.prototype._caculateEventTime = function (oEvent) {
		var oGantt = this._oSourceChart;
		var iXPosition = this._caculateXPosition(oEvent);
		return oGantt.getAxisTime().viewToTime(iXPosition);
	};

	return TimePeriodZoomHandler;
}, true);