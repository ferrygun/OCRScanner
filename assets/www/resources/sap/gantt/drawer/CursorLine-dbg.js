/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/ui/core/Core", "sap/ui/Device", "sap/gantt/misc/Format", "sap/gantt/drawer/Drawer", "sap/gantt/misc/Utility",
	// 3rd party lib
	"sap/ui/thirdparty/d3"
], function (Core, Device, Format, Drawer, Utility) {
	"use strict";

	/**
	 * CursorLine drawer.
	 *  ________
	 * | 12.Feb |
	 * |________|
	 *     |
	 *     |
	 *     |
	 *     |
	 *     |
	 */
	var CursorLine = Drawer.extend("sap.gantt.drawer.CursorLine");

	/**
	 * Draw cursor line to all gantt chart instances currently displayed.
	 * 
	 * @param {object} [aSvgBodyNode]: SVG body of all chart instances. update synchronized
	 * @param {object} [aSvgHeaderNode] Header SVG documents of Gantt Chart
	 * @param {sap.gantt.config.Locale} [oLocale] Locale instance
	 * @param {object} [oCursorPoint] Cursor point of the target element information including 
	 *	x: x coordinate of mouse in the triggering SVG relative to the document: pageX,
	 *	y: y coordinate of mouse in the triggering SVG relative to the document: pageY,
	 *	svgHeight: height of the triggering SVG,
	 *	svgId: id of the triggering SVG
	 */
	CursorLine.prototype.drawSvg = function (aSvgBodyNode, aSvgHeaderNode, oLocale, oCursorPoint) {

		this._oLocale = oLocale;

		// Find out the left offset of SVG document which triggered the event 
		var iCursorOffsetLeft = jQuery(Utility.attributeEqualSelector("id", oCursorPoint.svgId)).offset().left;
		
		// The Gantt might have multiple charts. Here find out the chart SVG DOM node offset regarding to the document
		// Notice: Only Gantt charts in vertical layout are considered. It makes sure cursor line is draw vertical axis.
		//         It might have potential drawing problem on horizontal gantt chart layout
		var aActualDrawingPoints = [];
		aSvgBodyNode.each(function(data, index){
			var oSvg = jQuery(this),
				offset = oSvg.offset();
			aActualDrawingPoints.push({
				x: oCursorPoint.x + iCursorOffsetLeft - offset.left,
				y: oCursorPoint.y,

				svgId: oSvg.attr("id"),
				svgHeight: oSvg.height()
			});
		});

		var that = this;

		// Draw rectangle time label in Gantt Chart header SVG document
		aSvgHeaderNode.each(function(data, index){
			var aHeaderTopG = that._createHeaderTopG(d3.select(this));
			that._drawHeaderLabel(aHeaderTopG, aActualDrawingPoints[index]);
		});

		// Draw vertical line indicates the time in Gantt Chart body SVG document
		aSvgBodyNode.each(function(data, index){
			var aBodyTopG = that._createBodyTopG(d3.select(this));
			that._drawCursorLine(aBodyTopG, aActualDrawingPoints[index]);
		});
	};

	CursorLine.prototype._createBodyTopG = function (aSvgBodyNode) {
		// update body top g and bind data
		var aBodyTopG = aSvgBodyNode.selectAll(".cursorline-top")
			.data(function(){
				// use current svg height and id of topG data
				return [{
					svgHeight: jQuery(this.parentNode).height()
				}];
			});
		aBodyTopG.enter().append("g")
			.classed("cursorline-top", true);
		aBodyTopG.exit().remove();
		return aBodyTopG;
	};

	CursorLine.prototype._drawCursorLine = function (aGroup, oSvgPoint) {
		// update path
		var aPath = aGroup.selectAll("path")
			.data(function(d) {
				return [{
					svgHeight: d.svgHeight,
					x: oSvgPoint.x,
					y: oSvgPoint.y
				}];
			});
		aPath.enter().append("path")
			.classed("sapGanttCursorLineBody", true);
		aPath
			.attr("d", function (d) {
				return "M" + d.x + ",0v" + d.svgHeight + "h1h-1";
			});
		aPath.exit().remove();
	};

	CursorLine.prototype._createHeaderTopG = function (aSvgHeaderNode) {
		// update chart header top g and bind data
		var aHeaderTopG = aSvgHeaderNode.selectAll(".cursorline-header-top")
			.data(function(){
				// use current svg height and id of topG data
				return [{
					svgHeight: jQuery(this.parentNode).height()
				}];
			});
		aHeaderTopG.enter().append("g")
			.classed("cursorline-header-top", true);
		aHeaderTopG.exit().remove();
		return aHeaderTopG;
	};

	CursorLine.prototype._drawHeaderLabel = function (aGroup, oSvgPoint) {
		var that = this;
		var oAxisTime = this._getAxisTime(oSvgPoint.svgId);
		// update path
		var aRect = aGroup.selectAll("rect")
			.data(function(d) {
				return [{
					svgHeight: d.svgHeight,
					svgId: d.svgId,
					x: oSvgPoint.x,
					y: oSvgPoint.y
				}];
			});
		
		aRect.enter().append("rect")
			.classed("sapGanttCursorLineHeader", true);
		aRect
			.attr("width", function (d) {
				// Since width and height are not style class in SVG for FF and IE 
				// Have provide default width and height here
				return 64;
			}).attr("height", function (d) {
				// If more than 80, most likely it's in Cozy Mode, so make the height larger
				return d.svgHeight > 80 ? 30 : 25;
			})
			.attr("x", function (d) {
				// Move the start point by moving half of the rectangle width
				return d.x - parseFloat(aRect.attr('width')) / 2;
			})
			.attr("y", function (d) {
				// Minus the height of the rectangle and 5 for the margin
				return d.svgHeight - parseFloat(aRect.attr('height')) - 5;
			});
		aRect.exit().remove();

		var aText = aGroup.selectAll("text")
						.data(function(d) {
							return [{
								x: parseFloat(aRect.attr('x')) + parseFloat(aRect.attr('width') / 2),
								y: parseFloat(aRect.attr('y')) + parseFloat(aRect.attr('height') / 2)
							}];
						});
		aText.enter().append("text").classed("sapGanttCursorLineLabel", true);
		aText
			.attr("x", function (d) {
				return d.x;
			})
			.attr("y", function (d) {
				return d.y;
			})
			.text(function (d) {
				return that._getTimeLabel(
						Format.dateToAbapTimestamp(oAxisTime.viewToTime(d.x)),
						that._oLocale,
						oAxisTime);
			});
		if (Device.browser.msie) {
			// IE doesn't support alignment-baseline, so here need add relative vertical alignment
			aText.attr("dy", ".35em");
		}
		aText.exit().remove();
	};

	CursorLine.prototype.destroySvg = function (aSvgBodyNode, aSvgHeaderNode) {
		aSvgBodyNode.selectAll(".cursorline-top").remove();
		aSvgHeaderNode.selectAll(".cursorline-header-top").remove();
	};

	/**
	 * Get the AxisTime instance associated with the Gantt Chart SVG document
	 * 
	 * @param {string} [elementId] SVG document ID
	 * @returns {AxisTime} AxisTime instance of the Gantt Chart control
	 */
	CursorLine.prototype._getAxisTime = function (elementId) {
		var sWrapSelector = Utility.attributeEqualSelector("id", elementId);
		var $element = jQuery(sWrapSelector);
		var oAxisTime = null;
		if ($element && $element.control()) {
			oAxisTime = $element.control()[0].getAxisTime();
		}
		return oAxisTime;
	};

	CursorLine.prototype._getTimeLabel = function (sTimeStamp, oLocale, oAxisTime) {
		var oLocalTime = Format._convertUTCToLocalTime(sTimeStamp, oLocale),
			oZoomStrategy = oAxisTime.getZoomStrategy();

		return oZoomStrategy.getLowerRowFormatter().format(oLocalTime);
	};

	return CursorLine;
}, true);
