/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	'jquery.sap.global', 'sap/ui/core/Element', "sap/ui/core/Core"
], function (jQuery, Element, Core) {
	"use strict";
	/**
	 * Constructor for a new AutoScrollHandler
	 *
	 * @param {string} [sId] ID of the new event handler, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new event handler
	 *
	 * @class
	 * Defines the properties required for the initialization of autoscroll setting
	 * @extends sap.ui.core.Element
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @constructor
	 * @private
	 * @alias sap.gantt.eventHandler.AutoScrollHandler
	 */
	var AutoScrollHandler = Element.extend("sap.gantt.eventHandler.AutoScrollHandler", /** @lends sap.gantt.config.AutoScrollHandler.prototype */ {
		metadata: {
			properties: {
				/**
				 *the horizontal distance next to which the scroll bar will move automatically
				 */
				horizontalThreshold: {type: "int", defaultValue: 50},
				/**
				 * the vertical distance next to which the scroll bar will move automatically
				 */
				verticalThreshold: {type: "int", defaultValue: 50 },
				/**
				 *the distance of every horizontal scroll
				 */
				horizontalScrollStep: {type: "int", defaultValue: 50},
				/**
				 *the distance of every vertical scroll
				 */
				verticalScrollStep: {type: "int", defaultValue: 50},
				/**
				 *the interval time between each scroll
				 */
				delayInMillis: {type: "int", defaultValue: 200}
			}
		}
	});

	//when the mouse enters a corner of GanttChart, trigger a horizontal or vertical auto-scroll
	AutoScrollHandler.prototype.autoScroll = function (oGanttChart, oEvent) {
		//when mouse moves, clear the timeout value
		this.stop();

		var $svgCtn = jQuery(oGanttChart.getDomSelectorById("svg-ctn"));
		var $hsb = oGanttChart._oTT.$(sap.ui.table.SharedDomRef.HorizontalScrollBar);
		var $vsb = oGanttChart._oTT.$(sap.ui.table.SharedDomRef.VerticalScrollBar);
		if($svgCtn.offset()){
			var iSvgLeft = $svgCtn.offset().left;
			var iSvgRight = iSvgLeft + $svgCtn.width();
			var iSvgTop = $svgCtn.offset().top;
			var iSvgBottom = $svgCtn.offset().top + $svgCtn.height();
			var iHorizontalThreshold = this.getHorizontalThreshold();
			var iVerticalThreshold = this.getVerticalThreshold();
			var iHorizontalScrollStep = this.getHorizontalScrollStep();
			var iVerticalScrollStep = this.getVerticalScrollStep();
			var iDelayInMillis = this.getDelayInMillis();//the interval of every scroll
	
			//when the mouse enters four corners(areas match the condition for both horizontal and vertical auto-scroll),
			//trigger the horizontal auto-scroll first until horizontal scroll bar reaches margin, then trigger vertical auto-scroll
			if (oEvent.pageX - iSvgLeft > 0 && oEvent.pageX - iSvgLeft < iHorizontalThreshold) {
				//when the mouse reaches the left margin of ganttChart with a distance < iHorizontalThreshold
				//shift the horizontal scroll bar to left by iHorizontalScrollStep
				oGanttChart._destroyCursorLine();
				this._iAutoScrollTimeout = jQuery.sap.intervalCall(iDelayInMillis, this, function() {
					if (Core.getConfiguration().getRTL()) {
						$hsb.scrollLeftRTL($hsb.scrollLeftRTL() - iHorizontalScrollStep);
					}else{
						$hsb.scrollLeft($hsb.scrollLeft() - iHorizontalScrollStep);
					}
				});
				return "scrollLeft";
			} else if (iSvgRight - oEvent.pageX > 0 && iSvgRight - oEvent.pageX < iHorizontalThreshold) {
				//when the mouse reaches the right margin of ganttChart with a distance < iHorizontalThreshold
				//shift the horizontal scroll bar to right by iHorizontalScrollStep
				oGanttChart._destroyCursorLine();
				this._iAutoScrollTimeout = jQuery.sap.intervalCall(iDelayInMillis, this, function() {
					if (Core.getConfiguration().getRTL()) {
						$hsb.scrollLeftRTL($hsb.scrollLeftRTL() + iHorizontalScrollStep);
					}else{
						$hsb.scrollLeft($hsb.scrollLeft() + iHorizontalScrollStep);
					}
				});
				return "scrollRight";
			} else if (oEvent.pageY - iSvgTop > 0 && oEvent.pageY - iSvgTop < (iVerticalThreshold - 4)) {
				//when the mouse reaches the top margin of ganttChart with a distance < iVerticalThreshold
				//shift the vertical scroll bar to top by iVerticalScrollStep
				//reserve 4px as the gap between mouse&shape
				this._iAutoScrollTimeout = jQuery.sap.intervalCall(iDelayInMillis, this, function() {
					$vsb.scrollTop($vsb.scrollTop() - iVerticalScrollStep);
				});
				return "scrollTop";
			} else if (iSvgBottom - oEvent.pageY > 0 && iSvgBottom - oEvent.pageY < (iVerticalThreshold + 4)) {
				//when the mouse reaches the bottom margin of ganttChart with a distance < iVerticalThreshold
				//shift the vertical scroll bar to bottom by iVerticalScrollStep
				//reserve 4px as the gap between mouse&shape
				this._iAutoScrollTimeout = jQuery.sap.intervalCall(iDelayInMillis, this, function() {
					$vsb.scrollTop($vsb.scrollTop() + iVerticalScrollStep);
				});
				return "scrollBottom";
			}
		}
	};

	//every time when mouse moves, clear the timeout value
	AutoScrollHandler.prototype.stop = function () {
		jQuery.sap.clearIntervalCall(this._iAutoScrollTimeout);
	};

	return AutoScrollHandler;
}, true);