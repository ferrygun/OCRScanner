/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"jquery.sap.global", "sap/ui/Device", "sap/ui/base/Object"
], function (jQuery, Device, BaseObject) {
	"use strict";
	/**
	 * Constructor for a new MouseWheelHandler
	 *
	 * Initialize the handler and reserve the caller of this handler as the '_oSourceChart'
	 * currently, '_oSourceChart' may be an instance of GanttChart or GanttChartWithTable
	 * @param {object} oChart an instance of the caller
	 * 
	 * @class
	 * Defines the properties required for the initialization of mouse wheel zooming
	 * @extends sap.ui.base.Object
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @constructor
	 * @private
	 * @alias sap.gantt.eventHandler.MouseWheelHandler
	 */
	var MouseWheelHandler = BaseObject.extend("sap.gantt.eventHandler.MouseWheelHandler", {
		constructor : function (oChart) {
			BaseObject.call(this);
			this._oSourceChart = oChart;
			this._lastCalledMouseWheelZoom = 0;
			this._iMouseWheelZoomTimer = undefined;
		}
	});

	/**
	 * All pre-process work for mouse wheel event are handled here
	 * @param {object} oEvent JQuery event object
	 * @return {boolean} true if mouse wheel zoom is triggered
	 */
	MouseWheelHandler.prototype.handleEvent = function (oEvent) {
		var oOriginalEvent = oEvent.originalEvent;

		var bIsShitKey = oOriginalEvent.shiftKey;
		var bIsCtrlKey = oOriginalEvent.ctrlKey;
		var iScrollDelta = this._getScrollDelta(oOriginalEvent);
		//this flag is used for outer caller to know whether a zoom is actually triggered, if so, a sync between
		//multiple views may be needed
		var bIsZoomTriggerred = false;

		if (bIsShitKey) {
			//SHIFT + CTRL + WHEEL for zoom
			if (bIsCtrlKey) {
				bIsZoomTriggerred = this._handleZoom(oEvent, iScrollDelta);
			} else {
				//SHIFT+WHEEL for horizontal scrolling
				this._handleHScroll(oEvent, iScrollDelta);
			}
		} else {
			//Pure wheel scroll trigger a vertical scroll
			this._handleVScroll(oEvent, iScrollDelta);
		}
		return bIsZoomTriggerred;
	};

	/**
	 * calculate the scroll delta
	 * @param {object} oEvent JQuery event object
	 * @return {number} the scroll range of the wheel event
	 */
	MouseWheelHandler.prototype._getScrollDelta = function (oEvent) {
		var iScrollDelta = 0;
		if (Device.browser.firefox) {
			iScrollDelta = oEvent.detail;
		} else {
			//For IE, FF, CHROME, the scroll delta is all on 'deltaY', even with key 'shift', 'ctrl', 'alt', or 'shift+ctrl'
			iScrollDelta = oEvent.deltaY || oEvent.deltaX;
		}
		return iScrollDelta;
	};

	/**
	 * when the mouse SCROLL + SHIFT + CTRL key, trigger a zoom
	 * @param {object} oEvent JQuery event object
	 * @param {number} iScrollDelta scroll range of wheel event
	 * @return {boolean} true if mouse wheel zoom is triggered
	 */
	MouseWheelHandler.prototype._handleZoom = function (oEvent, iScrollDelta) {
		var oOriginalEvent = oEvent.originalEvent;
		var oZoomStrategy = this._oSourceChart.getAxisTimeStrategy();
		var bIsZoomTriggerred = false;

		if (oZoomStrategy.getMouseWheelZoomType() !== sap.gantt.MouseWheelZoomType.None) {
			var bZoomIn = iScrollDelta < 0;
			if ((!bZoomIn && oZoomStrategy.getZoomLevel() > 0 ) || (bZoomIn && oZoomStrategy.getZoomLevel() < oZoomStrategy.getZoomLevels() - 1)) {
				if (this._oSourceChart._destroyCursorLine) {
					this._oSourceChart._destroyCursorLine();
				}
				// update the visible horizon by using a delayed mechanism to avoid to many update
				// it will trigger an update each 100ms, so the update requests fired with 100ms will be done once
				// Except: if it is firstly triggered, or the last delayed call is finished and the time elapsed since last call is long enough for the 
				// whole re-draw to be finished, we do an immediate update instead of a delayed one
				var iTimerDelay = (!this._iMouseWheelZoomTimer && (Date.now() - this._lastCalledMouseWheelZoom > 100)) ? 0 : 100;
				if (iTimerDelay === 0) {
					this._updateVisibleHorizon(oOriginalEvent, iScrollDelta);
				} else {
					this._iMouseWheelZoomTimer = this._iMouseWheelZoomTimer || jQuery.sap.delayedCall(iTimerDelay, this, this._updateVisibleHorizon, [oOriginalEvent, iScrollDelta]);
				}
				bIsZoomTriggerred = true;
			}
			this._preventBubbleAndDefault(oEvent);
		}
		return bIsZoomTriggerred;
	};

	/**
	 * calculate new visible horizon time range
	 * @param {object} oEvent JQuery event object
	 * @param {number} iScrollDelta scroll range of wheel event
	 */
	MouseWheelHandler.prototype._updateVisibleHorizon = function (oEvent, iScrollDelta) {
		this._lastCalledMouseWheelZoom = Date.now();

		var oZoomStrategy = this._oSourceChart.getAxisTimeStrategy();

		//calculate the time where mouse pointer located
		var $chartSvg = jQuery(this._oSourceChart.getDomSelectorById("svg"));
		if ($chartSvg) {
			//for MS Edge, the pageX is not usable when browser zoom rate <> 100% and RTL = true,
			//instead, clientX is always right for all zoom rate and RTL scenario
			var iMousePosition = (Device.browser.edge ? oEvent.clientX : oEvent.pageX) - $chartSvg.offset().left || oEvent.offsetX;
			var oTimeAtMousePosition = oZoomStrategy.getAxisTime().viewToTime(iMousePosition);
			// update visible horizon according to different zoom granularity configured in zoom strategy
			oZoomStrategy.updateVisibleHorizonOnMouseWheelZoom(oTimeAtMousePosition, iScrollDelta);
		}
		this._iMouseWheelZoomTimer = undefined;
	};

	/**
	 * SHIFT+WHEEL for horizontal scrolling
	 * @param {object} oEvent JQuery event object
	 * @param {number} iScrollDelta scroll range of wheel event
	 */
	MouseWheelHandler.prototype._handleHScroll = function (oEvent, iScrollDelta) {
		var oHSb = this._oSourceChart.getTTHsbDom();
		var bScrolledToEnd = false;
		var bScrollingForward = iScrollDelta > 0;

		if (oHSb) {
			if (bScrollingForward) {
				bScrolledToEnd = Math.round(oHSb.scrollLeft) === oHSb.scrollWidth - oHSb.clientWidth;
			} else {
				bScrolledToEnd = oHSb.scrollLeft === 0;
			}
			//bubble-up only when scrolling reaches ganttchart boundary
			if (!bScrolledToEnd) {
				this._preventBubbleAndDefault(oEvent);
				oHSb.scrollLeft += iScrollDelta;
			}
		}
	};

	/**
	 * Pure WHEEL for vertical scrolling
	 * @param {object} oEvent JQuery event object
	 * @param {number} iScrollDelta scroll range of wheel event
	 */
	MouseWheelHandler.prototype._handleVScroll = function (oEvent, iScrollDelta) {
		var oVSb = this._oSourceChart.getTTVsbDom();
		var bScrolledToEnd = false;
		var bScrollingForward = iScrollDelta > 0;

		if (oVSb) {
			if (bScrollingForward) {
				bScrolledToEnd = Math.round(oVSb.scrollTop) === oVSb.scrollHeight - oVSb.clientHeight;
			} else {
				bScrolledToEnd = oVSb.scrollTop === 0;
			}
			//bubble-up only when scrolling reaches ganttchart boundary
			if (!bScrolledToEnd) {
				this._preventBubbleAndDefault(oEvent);

				var iRowsPerStep = iScrollDelta / this._oSourceChart.getBaseRowHeight();
				// If at least one row is scrolled, floor to full rows.
				// Below one row, just scroll pixels.
				if (iRowsPerStep > 1) {
					iRowsPerStep = Math.floor(iRowsPerStep);
				}

				oVSb.scrollTop += iRowsPerStep * this._getScrollingPixelsForRow();
			}
		}
	};

	//calculate pixels of a row in scrollable area
	MouseWheelHandler.prototype._getScrollingPixelsForRow = function () {
		var oTable = this._oSourceChart._oTT;
		if (oTable) {
			var iVisibleRowCount = oTable.getVisibleRowCount();
			var iScrollableRowCount = Math.max(1, iVisibleRowCount - oTable.getFixedRowCount() - oTable.getFixedBottomRowCount());
			var iRowHeight = this._oSourceChart.getBaseRowHeight();
			var iVSbHeight = iScrollableRowCount * iRowHeight;
			var iBindingRowCount = oTable.getBinding("rows").getLength();
			var iTotalScrollRowCount = Math.max(iBindingRowCount, iVisibleRowCount + 1);
			var iTotalScrollRange = iTotalScrollRowCount * iRowHeight;
			var iVirtualScrollRange = Math.max(1, iTotalScrollRange - iVSbHeight - this._getRowHeightsDelta());

			var iMaxRowCountForScroll;
			if (iVisibleRowCount > iBindingRowCount) {
				iMaxRowCountForScroll = iBindingRowCount;
			} else {
				iMaxRowCountForScroll = Math.max(0, iBindingRowCount - iVisibleRowCount - 1);
			}

			return Math.ceil(iVirtualScrollRange / Math.max(1, iMaxRowCountForScroll));
		}
		return 0;
	};

	//calculate the delta heights in case expand chart is opened
	MouseWheelHandler.prototype._getRowHeightsDelta = function() {
		var oTable = this._oSourceChart._oTT;
		if (oTable) {
			var iBindingRowCount = oTable.getBinding("rows").getLength();
			var iVisibleRowCount = oTable.getVisibleRowCount();
			var iEstimatedViewportHeight = this._oSourceChart.getBaseRowHeight() * iVisibleRowCount;
			var aRowHeights = this._oSourceChart._getRowHeights();
			// Case: Not enough data to fill all available rows, only sum used rows.
			if (iVisibleRowCount > iBindingRowCount) {
				aRowHeights = aRowHeights.slice(0, iBindingRowCount);
			}
			var iRowHeightsDelta = aRowHeights.reduce(function(a, b) { return a + b; }, 0) - iEstimatedViewportHeight;
			if (iRowHeightsDelta > 0) {
				iRowHeightsDelta = Math.ceil(iRowHeightsDelta);
			}
			return Math.max(0, iRowHeightsDelta);
		}
		return 0;
	};

	MouseWheelHandler.prototype._preventBubbleAndDefault = function (oEvent) {
		oEvent.preventDefault();
		oEvent.stopPropagation();
	};

	return MouseWheelHandler;
}, true);