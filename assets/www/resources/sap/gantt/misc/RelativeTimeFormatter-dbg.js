/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
], function () {
	"use strict";

	/**
	 * Constructor for a new RelativeTimeFormatter
	 *
	 *The private relative formatter for Gantt to format a time label in header, when user use relative time axis
	 * @param {Date} oBaseTime the base start time to calculate the relative time
	 * @param {string} sUnit the time unit defined in library.js
	 * @param {string} sPrefix the prefix of the time label
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @constructor
	 * @private
	 * @alias sap.gantt.misc.RelativeTimeFormatter
	 */
	var RelativeTimeFormatter = function(oBaseTime, sUnit, sPrefix) {
		this.oBaseTime = oBaseTime;
		this.sUnit = sUnit;
		this.sPrefix = sPrefix;
		this.iIntervalMillisecond = jQuery.sap.getObject(sUnit).offset(oBaseTime, 1).getTime() - oBaseTime.getTime();
	};

	RelativeTimeFormatter.prototype.format = function(oDate){
		var sTimeLabel;
		var iSpan = Math.floor((oDate.getTime() - this.oBaseTime.getTime()) / this.iIntervalMillisecond) + 1;
		sTimeLabel = this.sPrefix + " " + iSpan;
		return sTimeLabel;
	};

	return RelativeTimeFormatter;
}, true);
