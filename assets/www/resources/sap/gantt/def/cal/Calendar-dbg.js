/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"../DefBase", "sap/gantt/misc/Format"
], function (DefBase,Format) {
	"use strict";
	
	/**
	 * Creates and initializes a calendar defined and embedded in a 'defs' tag for later reuse.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * A calendar that contains a list of time interval definitions.
	 * 
	 * <p>
	 * A pattern definition is generated per calendar key.
	 * </p>
	 * 
	 * @extends sap.gantt.def.DefBase
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.def.cal.Calendar
	 */
	var Calendar = DefBase.extend("sap.gantt.def.cal.Calendar", /** @lends sap.gantt.def.cal.Calendar */ {
		metadata: {
			properties: {
				
				/**
				 * Key of the calendar. Note that this value is used to generate the referencing string of the calendar pattern.
				 */
				key: {type : "string", defaultValue : "calendar"},
				
				/**
				 * Background color of time intervals.
				 */
				backgroundColor: {type : "sap.gantt.ValueSVGPaintServer", defaultValue: "#e5e5e5"}
			},
			aggregations: {
				
				/**
				 * Time intervals that should be painted with the value of <code>backgroundColor</code>.
				 */
				timeIntervals: {type: "sap.gantt.def.cal.TimeInterval", multiple: true,
					singularName: "timeInterval",bindable: "bindable"}
			}
		}
	});
	
	Calendar.prototype.getDefNode = function () {
		var aTimeIntervals = this.getTimeIntervals();
		var oStatusSet = (this.getParent() && this.getParent().getParent()) ? this.getParent().getParent()._oStatusSet : null;
		var oViewBoundary = oStatusSet ? oStatusSet.aViewBoundary : null;
		var oTimeBoundary = oStatusSet ? oStatusSet.aTimeBoundary : null;

		var aFilteredTimeIntervals = aTimeIntervals;
		if (oTimeBoundary && oStatusSet) {
			aFilteredTimeIntervals = aTimeIntervals.filter(function(oItem){
				var startTime = Format.abapTimestampToDate(oItem.getStartTime());
				var endTime = Format.abapTimestampToDate(oItem.getEndTime());
				if (oStatusSet.bRTL === true){
					return (endTime < oTimeBoundary[0] && endTime > oTimeBoundary[1]) || (startTime > oTimeBoundary[1] && startTime < oTimeBoundary[0]);
				} else {
					return (endTime < oTimeBoundary[1] && endTime > oTimeBoundary[0]) || (startTime > oTimeBoundary[0] && startTime < oTimeBoundary[1]);
				}
			});
		}

		var width = (oViewBoundary && oViewBoundary.length > 1 ) ? (oViewBoundary[1] - oViewBoundary[0]) : 1;
		var patternObj = { id: this.generateRefId(), x: 0, y: 0, width: width, timeIntervals: [] };
		for (var i = 0; i < aFilteredTimeIntervals.length; i++) {
			var oInterval = aFilteredTimeIntervals[i].getDefNode();
			oInterval.fill = this.getBackgroundColor();
			patternObj.timeIntervals.push(oInterval);
		}

		return patternObj;
	};

	Calendar.prototype.generateRefId = function () {
		var sId = (this.getParent() && this.getParent().getParent()) ? this.getParent().getParent().getId() : "";
		return sId + "_" + this.getKey();
	};

	return Calendar;
}, true);
