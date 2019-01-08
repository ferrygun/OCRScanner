/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2016 SAP SE. All rights reserved
    
 */
sap.ui.define(['jquery.sap.global', 'sap/ui/core/date/UniversalDate'],
	function (jQuery, UniversalDate) {
		"use strict";

		/**
		 * Constructor, create a Date.now date.
		 * @private
		 */
		var theCalendarDate = sap.ui.base.Object.extend("sap.me.CalendarDate", {
			constructor: function () {
				if (arguments.length === 0 || !(arguments[0] instanceof Date || arguments[0] instanceof UniversalDate)) {
					var oDate = new Date();
					this._date = theCalendarDate.createDate(oDate.getFullYear(), oDate.getMonth(), oDate.getDate());
				} else {
					var initDate = arguments[0];
					if (initDate  instanceof UniversalDate) {
						initDate = new Date(initDate.getTime());
					}
					this._date = theCalendarDate.createDate(initDate.getFullYear(), initDate.getMonth(), initDate.getDate());
				}
			}
		});

		/**
		 * Creates a Date, and sets the time to noon.
		 * @param {number} year The year
		 * @param {number} month The month
		 * @param {number} day The day of the month
		 * @private
		 * @returns {UniversalDate} The Date.
		 */
		theCalendarDate.createDate = function (year, month, day) {
			var oDate = new Date(year, month, day, 12, 0, 0);
			return new UniversalDate( oDate.getTime() );
		};

		/**
		 * ^ assert position at start of the string
		 * Non capturing group (?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)
		 *              Alternatives Mon, Tue, Wed, Thu, Fri, Sat, Sun
		 * space
		 * 1st Capturing group (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)
		 *              Alternatives: Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec
		 * space
		 * 2nd Capturing group (\d\d?)
		 *              \d match a digit [0-9]
		 *              \d? match a digit [0-9], between zero and one time, as many times as possible,
		 *              giving back as needed [greedy]. This is for IE9 support.
		 *              Could make the regexp stronger by forcing days between 01 and 31.
		 * space
		 * 3rd Capturing group (\d\d\d\d)
		 *              \d match a digit [0-9]
		 *              \d match a digit [0-9]
		 *              \d match a digit [0-9]
		 *              \d match a digit [0-9]
		 * $ assert position at end of the string
		 *
		 * i modifier: insensitive. Case insensitive match (ignores case of [a-zA-Z])
		 */
		theCalendarDate._regExpToDateString = /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d\d?) (\d\d\d\d)$/i;

		/**
		 * Returns the Date object.
		 * Warning, any operation like setMonth, setDate, ... will directly modify this object.
		 *
		 * @private
		 * @return {UniversalDate} The date object.
		 */
		theCalendarDate.prototype.getDateObject = function () {
			return this._date;
		};

		/**
		 * Returns a copy of the Date object
		 *
		 * @private
		 * @return {UniversalDate} The copy of the date object.
		 */
		theCalendarDate.prototype.getCopyDateObject = function () {
			var cloneDate = new UniversalDate(this._date.getTime());
			return cloneDate;
		};

		/**
		 * Returns the 0 based month index of the month contained in the given string.
		 * @private
		 * @param {String} strMonth The 3 first letters of the month, in American English.
		 * This string should not contain unicode characters. It must also match the months 'created' by a call to Date.toDateString.
		 * @return {number} A value between 0 and 11, matching the given month or -1 in case of error.
		 */
		theCalendarDate.getMonthFromString = function (strMonth) {
			var aMonths = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
			strMonth = strMonth.toLowerCase();
			return jQuery.inArray(strMonth, aMonths);
		};

		/**
		 * Parses a Date from a string, assuming it was created using Date.toDateString.
		 * If the function detects that something is not right, then it will just call the Date constructor
		 * and provide the string to it, as is. In that case, there will also be a warning log in the console.
		 *
		 * @param {String} fromToDateString The String to parse to create a Date.
		 * @param {boolean} bThrowOnParseError (Optional) Throws an error if the parsing. Default value is false.
		 * @return {UniversalDate} The Date created from the string.
		 * @throws {Error} If the string provided does not match a toDateString produced string.
		 * @private
		 * @static
		 */
		theCalendarDate.parseFromToDateString = function (fromToDateString, bThrowOnParseError) {
			var parsedDate;
			var aResult = theCalendarDate._regExpToDateString.exec(fromToDateString);
			// all groups must have been found and the matched string must be the given string.
			if (aResult !== null && aResult.length === 4 && aResult[0] === fromToDateString) {
				// var myRe = /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d\d?) (\d\d\d\d)$/i;
				// var arr = myRe.exec("Mon Apr 1 2041"); // the date might not exist, the day of the week was randomly typed.
				// arr is: ["Mon Apr 1 2041", "Apr", "1", "2041"]
				parsedDate = theCalendarDate.createDate(parseInt(aResult[3], 10), theCalendarDate.getMonthFromString(aResult[1]), parseInt(aResult[2], 10));
			}
			else {
				jQuery.sap.log.warning("The provided string does not match the toDateString format: " + fromToDateString);
				if (typeof bThrowOnParseError === "boolean" && bThrowOnParseError) {
					throw new Error("Unparseable string provided: " + fromToDateString);
				}
				var oDate = new Date(fromToDateString);
				parsedDate = new UniversalDate( oDate.getTime() );
			}

			return parsedDate;
		};

		/**
		 * Modifies the Date object and sets it to the first day of the next month.
		 *
		 * @private
		 * @return {UniversalDate} the first day of the next month.
		 */
		theCalendarDate.prototype.nextMonth = function () {
			this._date = theCalendarDate.getNextMonth(this._date);
			return this._date;
		};

		/**
		 * Returns the Date of the first day of the next month of the given Date.
		 * @param {UniversalDate} oDate The Date for which the date of the first day of the next month must be returned
		 * @private
		 * @static
		 * @return {UniversalDate} the first day of the next month of the given Date, in a new Date object.
		 */
		theCalendarDate.getNextMonth = function (oDate) {
			var nextMonth = new UniversalDate(oDate);
			nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
			nextMonth.setHours(12, 0, 0);
			return nextMonth;
		};

		/**
		 * Modifies the Date object and sets it to the first day of the previous month.
		 * @private
		 * @return {UniversalDate} The first day of the previous month.
		 */
		theCalendarDate.prototype.previousMonth = function () {
			this._date = theCalendarDate.getPreviousMonth(this._date);
			return this._date;
		};

		/**
		 * Returns the first day of the previous month of the given date.
		 * @private
		 * @static
		 * @param {UniversalDate} oDate The Date for which the date of the first day of the previous month must be returned
		 * @return {UniversalDate} the first day of the previous month of the given Date, in a new Date object.
		 */
		theCalendarDate.getPreviousMonth = function (oDate) {
			var previousMonth = new UniversalDate(oDate);
			previousMonth.setMonth(previousMonth.getMonth() - 1, 1);
			previousMonth.setHours(12, 0, 0);
			return previousMonth;
		};

		/**
		 * @private
		 */
		theCalendarDate.prototype.nextWeek = function () {
			this._date.setHours(12);
			this._date.setDate(this._date.getDate() + 7);
			return this._date;
		};

		/**
		 * @private
		 */
		theCalendarDate.prototype.previousWeek = function () {
			this._date.setHours(12);
			this._date.setDate(this._date.getDate() - 7);
			return this._date;
		};

		theCalendarDate.prototype.toDateString = function () {
			var oDate = new Date(this._date.getTime());
			return oDate.toDateString();
		};

		return theCalendarDate;
	}, /* bExport= */ true);
