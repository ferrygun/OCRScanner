/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/misc/Utility",   // cannot be referenced because of loop dependency between AxisOrdinal and Utility, use global name to reference
	// Unreferenced libs
	"sap/ui/thirdparty/d3"
], function () {
	"use strict";

	/**
	 * Creates and initializes an AxisOrdinal class.

	 * @class The reusable functional class represents an instance of ordinal pattern coordinate mapping.
	 * 
	 * @param {array} aAlementArray Element array corresponding to an ordinal axis.
	 * @param {array} aScaleArray Scale array where each item represents one or more smallest width units in one-to-one relationship with aAlementArray.
	 * @param {number} nViewBandWidth Smallest width unit for elements.
	 * @param {number} nViewRangeStart Start position of an axis in the viewport area.
	 * @param {number} nViewRangeEnd End position of an axis in the viewport area. The parameter is ignored if viewBandWidth is set.
	 * @param {number} nZoomRate Zoom rate of the viewport area.
	 * @param {number} nZoomOrigin Zoom origin of the viewport area.
	 * @param {number} nPadding Padding for each band.
	 * 
	 * @return Instance of an AxisOrdinal.
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.misc.AxisOrdinal
	 */
	
	var AxisOrdinal = function (aAlementArray, aScaleArray, nViewBandWidth, nViewRangeStart,
	                            nViewRangeEnd, nZoomRate, nZoomOrigin, nPadding) {
		this.elementArray = aAlementArray;
		this.scaleArray = aScaleArray;

		this.padding = sap.gantt.misc.Utility.assign(nPadding, 0);

		this.zoomRate = sap.gantt.misc.Utility.assign(nZoomRate, 1);
		this.zoomOrigin = sap.gantt.misc.Utility.assign(nZoomOrigin, 0);

		this.viewRangeStart = sap.gantt.misc.Utility.assign(nViewRangeStart, 0);
		this.viewBandWidth = nViewBandWidth;
		this.viewRangeEnd = nViewRangeEnd;
		this.scale = d3.scale.ordinal();
	//	this.scaleForVisibleRow = null;
		this._createScale();
	};

	/*
	 * Constants
	 */
	AxisOrdinal.prototype.CONSTANT = {
		C_SEPARATOR: "_@@_",
		C_MESSAGE: {
			ARGUMENT_ERROR: "AxisOrdinal: Argument Error!"
		}
	};

	// private methods =>
	AxisOrdinal.prototype._createScale = function(){
		if (typeof (this.viewBandWidth) !== "undefined"){
			this.viewRangeEnd = undefined;
			this.scale.domain(this._calculateInternalValuesByElements())
				.rangeRoundBands(this._calculateViewRangeByViewBandWidth());
		} else if (typeof (this.viewRangeEnd) !== "undefined"){
			this.viewBandWidth = undefined;
			this.scale.domain(this._calculateInternalValuesByElements())
				.rangeRoundBands([this.viewRangeStart, this.viewRangeEnd]);
		} else {
			//sap.gantt.Message.create("Error", this.CONSTANT.C_MESSAGE.ARGUMENT_ERROR);
		}
	};
	
	AxisOrdinal.prototype._calculateInternalValuesByElements = function(){
		var values = [];
		for (var i = 0; i < this.scaleArray.length; i++){
			var id = this.elementArray[i] + this.CONSTANT.C_SEPARATOR;
			for (var j = 0; j < this.scaleArray[i]; j++){
				values.push(id + j);
			}
		}
		return values;
	};
	

	AxisOrdinal.prototype._calculateViewRangeByViewBandWidth = function(){
		var viewRangeWidth = 0;
		for (var i = 0; i < this.scaleArray.length; i++){
			viewRangeWidth += this.scaleArray[i] * this.viewBandWidth;
		}
		return [this.viewRangeStart, this.viewRangeStart + viewRangeWidth];
	};
	// <= private methods

	// public methods =>
	
	/**
	 * Transforms an element to a position in the coordinate system
	 * 
	 * @param {Object} element Element that exists in parameter elementArray of the constructor
	 * 
	 * @return Position in the coordinate system
	 * 
	 * @public
	 */
	
	AxisOrdinal.prototype.elementToView = function(element){
		return (this.scale(element + this.CONSTANT.C_SEPARATOR + 0) + this.padding - this.zoomOrigin) * this.zoomRate;
	};

	/**
	 * Transforms a position in the coordinate system to an element
	 * 
	 * @param {Number} value Position in the coordinate system
	 * 
	 * @return Element that exists in parameter elementArray of the constructor
	 * 
	 * @public
	 */
	
	AxisOrdinal.prototype.viewToElement = function(value){
		var curValue = value / this.zoomRate + this.zoomOrigin;

		var head = 0;
		var tail = this.elementArray.length - 1;
		while (head < tail){
			var mid = Math.ceil((head + tail) / 2);
			var midValue = this.scale(this.elementArray[mid] + this.CONSTANT.C_SEPARATOR + 0);
			if (curValue < midValue){
				tail = mid - 1;
			} else {
				head = mid;
			}
		}

		var ret = this.elementArray[head];
		var retValue = this.scale(ret + this.CONSTANT.C_SEPARATOR + 0);
		if (curValue < retValue + this.padding || curValue >= retValue + this.scale.rangeBand() * this.scaleArray[head]){
			return undefined;
		}
		return ret;
	};

	/**
	 * Transforms a position in the coordinate system to an element index
	 * 
	 * @param {Number} value Position in the coordinate system
	 * 
	 * @return Index of the corresponding element that exists in parameter elementArray of the constructor
	 * 
	 * @public
	 */
	
	AxisOrdinal.prototype.viewToElementIndex = function(value){
		var curValue = value / this.zoomRate + this.zoomOrigin;
				
		var head = 0;
		var tail = this.elementArray.length - 1;
		
		while (head < tail){
			var mid = Math.ceil((head + tail) / 2);
			var midValue = this.scale(this.elementArray[mid] + this.CONSTANT.C_SEPARATOR + 0);

			if (curValue < midValue){
				tail = mid - 1;
			} else {
				head = mid;
			}
		}

		var ret = this.elementArray[head];
		var retValue = this.scale(ret + this.CONSTANT.C_SEPARATOR + 0);

		if (curValue < retValue + this.padding || curValue >= retValue + this.scale.rangeBand() * this.scaleArray[head]){
			return -1;
		}
		
		return head;
	};

	/**
	 * Transforms a position in the coordinate system to a band index
	 * 
	 * @param {Number} value A position in the coordinate system
	 * 
	 * @return Index that describes which band the position is located in
	 * 
	 * @public
	 */
	
	AxisOrdinal.prototype.viewToBandIndex = function(value){
		var curValue = value / this.zoomRate + this.zoomOrigin;

		var aInternalElements = this._calculateInternalValuesByElements();
		var head = 0;
		var tail = aInternalElements.length - 1;

		while (head < tail){
			var mid = Math.ceil((head + tail) / 2);
			var midValue = this.scale(aInternalElements[mid]);

			if (curValue < midValue){
				tail = mid - 1;
			} else {
				head = mid;
			}
		}

		var retValue = this.scale(aInternalElements[head]);

		if (curValue < retValue + this.padding || curValue >= retValue + this.scale.rangeBand()){
			return -1;
		}

		return head;
	};

	/**
	 * Transforms a position in the coordinate system to a row index
	 * 
	 * @param {Number} value Position in the coordinate system
	 * @param {Number} iMaxIndex Max row index in the coordinate system
	 * 
	 * @return Index of the corresponding row
	 * 
	 * @public
	 */
	
	AxisOrdinal.prototype.viewToRowIndex = function(value, iMaxIndex){
		var curValue = value / this.zoomRate + this.zoomOrigin;

		var head = 0;
		//Get the scale of elements
		var viewWidth = this._calculateViewRangeByViewBandWidth();
		
		if (curValue <= viewWidth[1] && curValue >= viewWidth[0]) {
			//If current position is in the elements scale, calculate the row index
			return this.viewToElementIndex(value);
		} else if (jQuery.isNumeric(iMaxIndex) && iMaxIndex > this.elementArray.length) {
			//if current position is out of elements scale, calculate the row index
			var blankIndex = parseInt( ( value - viewWidth[1] - viewWidth[0] ) / this.viewBandWidth, 10);
			var rowIndex = blankIndex + this.elementArray.length;
			head = rowIndex;
		} else {
			return -1;
		}
		return head;
	};

	/**
	 * Sets a new value of elementArray with the corresponding scaleArray.
	 * 
	 * @param {array} elementArray New element array corresponding to an ordinal axis.
	 * @param {array} scaleArray Corresponding scale array where each item represents one or more smallest width units in one-to-one relationship with elementArray.
	 * 
	 * @return {sap.gantt.misc.AxisOrdinal} Reference to this in order to allow method chaining.
	 * 
	 * @public
	 */

	AxisOrdinal.prototype.setElements = function(elementArray, scaleArray){
		this.elementArray = elementArray;
		this.scaleArray = scaleArray;
		this._createScale();
		return this;
	};

	/**
	 * Retrieves the value of elementArray.
	 * 
	 * @return {array} Value of elementArray.
	 * 
	 * @public
	 */
	
	AxisOrdinal.prototype.getElementArray = function(){
		return this.elementArray;
	};

	/**
	 * Retrieves the value of scaleArray.
	 * 
	 * @return {array} Value of scaleArray.
	 * 
	 * @public
	 */

	AxisOrdinal.prototype.getScaleArray = function(){
		return this.scaleArray;
	};

	/**
	 * Sets a new value of the start position of a view range.
	 * 
	 * @param {number} viewRangeStart Start position of an axis in the viewport area.
	 * 
	 * @return {sap.gantt.misc.AxisOrdinal} Reference to this in order to allow method chaining.
	 * 
	 * @public
	 */

	AxisOrdinal.prototype.setViewRangeStart = function(viewRangeStart){
		this.viewBandWidth = undefined;
		this.viewRangeStart = sap.gantt.misc.Utility.assign(viewRangeStart, 0);
		this.scale.rangeRoundBands([this.viewRangeStart, this.viewRangeEnd]);
		return this;
	};

	/**
	 * Sets a new value of the end position of a view range.
	 * 
	 * @param {number} viewRangeEnd End position of axis in the viewport area. The parameter is ignored if viewBandWidth is set.
	 * 
	 * @return {sap.gantt.misc.AxisOrdinal} Reference to this in order to allow method chaining.
	 * 
	 * @public
	 */

	AxisOrdinal.prototype.setViewRangeEnd = function(viewRangeEnd){
		this.viewBandWidth = undefined;
		this.viewRangeEnd = viewRangeEnd;
		this.scale.rangeRoundBands([this.viewRangeStart, this.viewRangeEnd]);
		return this;
	};

	/**
	 * Retrieves the view range of the current viewport area.
	 * 
	 * @return {array} Value of the view range containing the start and end positions.
	 * 
	 * @public
	 */

	AxisOrdinal.prototype.getViewRange = function(){
		var viewRange = this.scale.rangeExtent();
		return [(viewRange[0] - this.zoomOrigin) * this.zoomRate, (viewRange[1] - this.zoomOrigin) * this.zoomRate];
	};

	/**
	 * Sets a new value of viewBandWidth.
	 * 
	 * @param {number} viewBandWidth Smallest width unit for elements.
	 * 
	 * @return {sap.gantt.misc.AxisOrdinal} Reference to this in order to allow method chaining.
	 * 
	 * @public
	 */

	AxisOrdinal.prototype.setViewBandWidth = function(viewBandWidth){
		this.viewRangeEnd = undefined;
		this.viewBandWidth = viewBandWidth;
		this.scale.rangeRoundBands(this._calculateViewRangeByViewBandWidth());
		return this;
	};

	/**
	 * Retrieves the value of viewBandWidth.
	 * 
	 * @return {number} Value of viewBandWidth that indicates the smallest width unit for elements.
	 * 
	 * @public
	 */

	AxisOrdinal.prototype.getViewBandWidth = function(){
		return this.scale.rangeBand() * this.zoomRate;
	};

	/**
	 * Sets a new value of zoom rate.
	 * 
	 * @param {number} zoomRate New zoom rate of the viewport area.
	 * 
	 * @return {sap.gantt.misc.AxisOrdinal} Reference to this in order to allow method chaining.
	 * 
	 * @public
	 */

	AxisOrdinal.prototype.setZoomRate = function(zoomRate){
		this.zoomRate = sap.gantt.misc.Utility.assign(zoomRate, 1);
		return this;
	};

	/**
	 * Retrieves the value of zoom rate.
	 * 
	 * @return {number} Value of zoom rate.
	 * 
	 * @public
	 */

	AxisOrdinal.prototype.getZoomRate = function(){
		return this.zoomRate;
	};

	/**
	 * Sets the zoom origin.
	 * 
	 * @param {number} zoomOrigin Zoom origin of the viewport area.
	 * 
	 * @return {sap.gantt.misc.AxisOrdinal} Reference to this in order to allow method chaining.
	 * 
	 * @public
	 */

	AxisOrdinal.prototype.setZoomOrigin = function(zoomOrigin){
		this.zoomOrigin = sap.gantt.misc.Utility.assign(zoomOrigin, 0);
		return this;
	};

	/**
	 * Retrieves the zoom origin.
	 * 
	 * @return {number} Zoom origin.
	 * 
	 * @public
	 */

	AxisOrdinal.prototype.getZoomOrigin = function(){
		return this.zoomOrigin;
	};

	/**
	 * Clones a new AxisOrdinal from the current one.
	 * 
	 * @return {sap.gantt.misc.AxisOrdinal} Reference to the newly created clone.
	 * 
	 * @public
	 */

	AxisOrdinal.prototype.clone = function(){
		return new AxisOrdinal(this.elementArray.slice(0), this.scaleArray.slice(0), this.viewBandWidth,
			this.viewRangeStart, this.viewRangeEnd, this.zoomRate, this.zoomOrigin, this.padding);
	};
	// <= public methods

	return AxisOrdinal;
}, true);
