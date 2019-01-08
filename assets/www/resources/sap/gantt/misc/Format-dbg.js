/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/ui/core/format/DateFormat",
	"sap/ui/thirdparty/d3"
], function (DateFormat) {
	"use strict";

	/**
	 * A dummy constructor for Format. Do not construct a Format object; instead, call static methods abapTimestampToDate, dateToAbapTimestamp, and abapTimestampToTimeLabel directly.
	 *
	 * @class
	 * The Format class provides static methods for formatting dates, times, and timestamps to be used in sap.gantt
	 *
	 * @public
	 * @alias sap.gantt.misc.Format
	 */

	var Format = function() {
		// Do not use the constructor
		throw new Error();
	};

	Format._oDefaultDateTimeFormat = DateFormat.getDateTimeInstance();

	/**
	 * Converts an ABAP timestamp(eg:"20150909000000" ) into a Date instance.
	 *
	 * @param {string} sTimestamp The ABAP timestamp to convert
	 * @return {Date} The output date instance
	 * @static
	 * @public
	 */

	Format.abapTimestampToDate = function (sTimestamp) {
		if (typeof sTimestamp === "string") {
			// for the timestamp format such as "20150909000000"
			var date = new Date(sTimestamp.substr(0, 4),
					parseInt(sTimestamp.substr(4, 2), 0) - 1,
					sTimestamp.substr(6, 2),
					sTimestamp.substr(8, 2),
					sTimestamp.substr(10, 2),
					sTimestamp.substr(12, 2));
			//In case ts is in format of "Fri Jun 12 2015 08:00:00 GMT+0800 (China Standard Time)"
			if (!jQuery.isNumeric(date.getTime())){
				date = new Date(sTimestamp);
			}
			return date;
		} else if (jQuery.type(sTimestamp) === "date"){
			return sTimestamp;
		}
		return null;
	};
	
	
	/**
	 * Converts a Date instance into an ABAP timestamp.
	 *
	 * @param {Date} oDate The date instance to convert
	 * @return {string} The output ABAP timestamp
	 * @static
	 * @public
	 */

	Format.dateToAbapTimestamp = function (oDate) {
		if (oDate) {
			return "" + oDate.getFullYear() +
			(oDate.getMonth() < 9 ? "0" : "") + (oDate.getMonth() + 1) +
			(oDate.getDate() < 10 ? "0" : "") + oDate.getDate() +
			(oDate.getHours() < 10 ? "0" : "") + oDate.getHours() +
			(oDate.getMinutes() < 10 ? "0" : "") + oDate.getMinutes() +
			(oDate.getSeconds() < 10 ? "0" : "") + oDate.getSeconds();
		}
		return "";
	};
	
	
	/**
	 * Converts an ABAP timestamp into a time label to be used in Gantt.
	 *
	 * @param {string} sTimestamp The ABAP timestamp to convert
	 * @param {sap.gantt.config.Locale} oLocale The locale object has the time zone and DST info; this determines how the function converts the timestamp into a locale-specific time label
	 * @return {string} The output time label
	 * @static
	 * @public
	 */
	Format.abapTimestampToTimeLabel = function (sTimestamp, oLocale) {
		var localDate = sap.gantt.misc.Format._convertUTCToLocalTime(sTimestamp, oLocale);
		var sLabel = sap.gantt.misc.Format._oDefaultDateTimeFormat.format(localDate);
		return sLabel;

	};

	/**
	 * Converts a relative time object into an absolute time object. Use this method only in relative time axis mode.
	 *
	 * @param {int} iIntervalDays difference in the day segment between the target time and base time
	 * @param {int} iIntervalHours difference in the hour segment between the target time and base time
	 * @param {int} iIntervalMinutes difference in the minute segment between the target time and base time
	 * @param {int} iIntervalSeconds difference in the second segment between the target time and base time
	 * @return {Date} converted absolute time object
	 * @static
	 * @public
	 */

	Format.relativeTimeToAbsolutTime = function (iIntervalDays, iIntervalHours, iIntervalMinutes, iIntervalSeconds) {
		iIntervalDays = iIntervalDays !== undefined ? iIntervalDays : 0;
		iIntervalHours = iIntervalHours !== undefined ? iIntervalHours : 0;
		iIntervalMinutes = iIntervalMinutes !== undefined ? iIntervalMinutes : 0;
		iIntervalSeconds = iIntervalSeconds !== undefined ? iIntervalSeconds : 0;

		var oBaseTime = this.abapTimestampToDate("20120101000000");
		var oTargetTime = new Date();
		oTargetTime.setTime(oBaseTime.getTime() + iIntervalSeconds * 1000 + iIntervalMinutes * 60 * 1000 + iIntervalHours * 3600 * 1000 + iIntervalDays * 24 * 3600 * 1000);

		return oTargetTime;
	};

	/**
	 * Converts an absolute time object into a relative time object, which contains the following properties:
	 *  {
			intervalDays: * difference in the day segment between the target time and base time*,
			intervalHours: * difference in the hour segment between the target time and base time*,
			intervalMinutes: * difference in the minute segment between the target time and base time*,
			intervalSecond: * difference in the segment segment between the target time and base time*
		}
	 * Use this method only in relative time axis mode.
	 *
	 * @param {Date} oTime the absolute time object will be converted
	 * @return {object} relative time information object
	 * @static
	 * @public
	 */

	Format.absolutTimeToRelativeTime = function (oTime) {
		var oBaseTime = this.abapTimestampToDate("20120101000000");
		var iMiliseciondInterval = oTime.getTime() - oBaseTime.getTime();

		var iIntervalDays = Math.floor(iMiliseciondInterval / (24 * 3600 * 1000));
		var iRemainder = iMiliseciondInterval % (24 * 3600 * 1000);

		var iIntervalHours = Math.floor(iRemainder / (3600 * 1000));
		iRemainder = iRemainder % (3600 * 1000);

		var iIntervalMinutes = Math.floor(iRemainder / (60 * 1000));
		iRemainder = iRemainder % (60 * 1000);

		var iIntervalSeconds = Math.floor(iRemainder / 1000);

		var oResult = {
			intervalDays: iIntervalDays,
			intervalHours: iIntervalHours,
			intervalMinutes: iIntervalMinutes,
			intervalSecond: iIntervalSeconds
		};

		return oResult;
	};

	Format._convertUTCToLocalTime = function (sTimeStamp, oLocale) {

		//convert utc date to local date
		//code is from axistime.js
		var timeZoneOffset = 0;
		if (oLocale && oLocale.getUtcdiff()) {
			var format = this.getTimeStampFormatter();
			timeZoneOffset = Math.round((format.parse("20000101" + oLocale.getUtcdiff()).getTime() - format.parse("20000101000000").getTime()) / 1000);
			if (oLocale.getUtcsign() === "-") {
				timeZoneOffset = -timeZoneOffset;
			}
		}
		var utcDate = sap.gantt.misc.Format.abapTimestampToDate(sTimeStamp);
		var localDate = d3.time.second.offset(utcDate, timeZoneOffset);

		//to solve the daylight saving time
		var aDstHorizons = oLocale.getDstHorizons();
		if (aDstHorizons.length > 0) {
			for (var i = 0; i < aDstHorizons.length; i++) {
				var startDate = sap.gantt.misc.Format.abapTimestampToDate(aDstHorizons[i].getStartTime());
				var endDate = sap.gantt.misc.Format.abapTimestampToDate(aDstHorizons[i].getEndTime());
				if (localDate >= startDate && localDate <= endDate) {
					localDate = d3.time.second.offset(localDate, 60 * 60);
				}
			}
		}
		return localDate;
	};

	Format.getTimeStampFormatter = function(){
		return d3.time.format("%Y%m%d%H%M%S");
	};

	return Format;
}, true);
