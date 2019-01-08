/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"../DefBase", "sap/gantt/misc/Format", "sap/ui/core/Core"
], function (DefBase, Format, Core) {
	"use strict";

	/**
	 * Creates and initializes a time interval inside the calendar.
	 * 
	 * @param {string} [sId] ID of the new element, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new element
	 * 
	 * @class 
	 * A time interval pattern.
	 * 
	 * @extends sap.gantt.def.DefBase
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.def.cal.TimeInterval
	 */
	var TimeInterval = DefBase.extend("sap.gantt.def.cal.TimeInterval", {
		metadata: {
			properties: {

				/**
				 * Start Time of timeHorizon. Format: YYYYMMDDHHMMSS. If the type of startTime is object, the value is converted to string.
				 */
				startTime: {type: "string", group: "Misc", defaultValue: null},

				/**
				 * End time of timeHorizon. Format: YYYYMMDDHHMMSS. If the type of startTime is object, the value is converted to string.
				 */
				endTime: {type: "string", group: "Misc", defaultValue: null}
			}
		}
	});

	TimeInterval.prototype.setStartTime = function (vStartTime) {
		this.setProperty("startTime", this._convertTimestamp(vStartTime));
		return this;
	};

	TimeInterval.prototype.setEndTime = function (vEndTime) {
		this.setProperty("endTime", this._convertTimestamp(vEndTime));
		return this;
	};

	TimeInterval.prototype._convertTimestamp = function (vTime) {
		var sRetVal = vTime;
		if (sRetVal && typeof sRetVal === "object") {
			sRetVal = Format.dateToAbapTimestamp(sRetVal);
		}
		return sRetVal;
	};

	TimeInterval.prototype.getDefNode = function () {
		var oAxisTime = (this.getParent() && this.getParent().getParent() && this.getParent().getParent().getParent()) ?
				this.getParent().getParent().getParent().getAxisTime() : null;
		var startX;
		var width;
		if (oAxisTime) { 
			if (Core.getConfiguration().getRTL() === true) {
				startX = oAxisTime.timeToView(Format.abapTimestampToDate(this.getEndTime()));
				width = oAxisTime.timeToView(Format.abapTimestampToDate(this.getStartTime())) - startX;
			} else {
				startX = oAxisTime.timeToView(Format.abapTimestampToDate(this.getStartTime()));
				width = oAxisTime.timeToView(Format.abapTimestampToDate(this.getEndTime())) - startX;
			}
		}

		return {x: startX, y: 0, width: width};
	};

	return TimeInterval;
}, true);
