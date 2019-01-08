/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2016 SAP SE. All rights reserved
    
 */
sap.ui.define(['jquery.sap.global', './CalendarDate', 'sap/ui/core/LocaleData', 'sap/ui/core/format/DateFormat', 'sap/ui/core/date/UniversalDate'],
	function(jQuery, CalendarDate, LocaleData, DateFormat, UniversalDate) {
	"use strict";



	/**
	 * @class Calendar renderer.
	 * @static
	 */
	var CalendarRenderer = {
	};

	/**
	 *
	 * @param {object} oRm
	 * @param {sap.m.Calendar} oControl
	 * @private
	 */
	CalendarRenderer.render = function (oRm, oControl) {
		if (!oControl.getVisible()) {
			return;
		}

		oRm.write("<div");
		oRm.writeControlData(oControl);
		oRm.addClass("sapMeCalendar");
		var sClass = "sapMeCalendar" + oControl.getDesign();
		oRm.addClass(sClass);
		oRm.writeClasses();
		var w = oControl.getWidth();
		if (w != undefined) {
			oRm.addStyle("width", w);
			oRm.writeStyles();
		}
		oRm.write(">");

		oRm.renderControl(oControl._oPrevBtn);
		oRm.renderControl(oControl._oNextBtn);

		var bSingleRow = oControl.getSingleRow();

		var iMonths = bSingleRow ? 1 : oControl.getMonthsToDisplay();
		var oNow = new CalendarDate();
		var sNow = oNow.toDateString(); // so it is same time as other dates
		var i;
		if (iMonths === 1) {
			this._renderMonth(oRm, oControl, oControl._oInternalDate.getDateObject(), sNow);
		}else {
			var currentDate = oControl._oInternalDate.getCopyDateObject();
			var iMonthToGoBack = Math.floor(iMonths / 2);
			for (i = 0; i < iMonthToGoBack; i++) { // we go first back in time
				currentDate = CalendarDate.getPreviousMonth(currentDate);
			}
			for (i = 0; i < iMonths; i++) {
				this._renderMonth(oRm, oControl, currentDate, sNow);
				currentDate = CalendarDate.getNextMonth(currentDate);
			}
		}

		oRm.write("</div>"); // sapMeCalendar DIV
	};

	/**
	 *
	 * @param {UniversalDate} currentDate
	 * @param {sap.me.Calendar} oControl The Calendar control
	 * @param {integer} iTotalDays The total number of days displayed.
	 * @returns {string} A formatted string to display the month above the calendar.
	 * @private
	 */
	CalendarRenderer._getMonthTitle = function (oCurrentDate, bSingleRow, iTotalDays) {
		var oFormatOption = {
			format: "yMMM"
		};

		var oFormat;
		var oTempDate;

		if (bSingleRow) {
			oTempDate = new UniversalDate(oCurrentDate.getTime());
			oTempDate.setDate(oTempDate.getDate() + iTotalDays - 1);

			// change the displayed date to be an interval
			oFormatOption.interval = true;
		}

		oFormat = DateFormat.getDateInstance(oFormatOption);

		return oFormatOption.interval ? oFormat.format([oCurrentDate, oTempDate]) : oFormat.format(oCurrentDate);
	};

	/**
	 *
	 * @param {object} oRm The render manager.
	 * @param {sap.me.Calendar} oControl The sap.me calendar.
	 * @param {UniversalDate} oMonthDate This date must be cloned! The month to render.
	 * @param {string} sDateNow Today's date (as a toDateString string) so that
	 * it is shown with a border around it if it is in the month being rendered.
	 * @private
	 */
	CalendarRenderer._renderMonth = function (oRm, oControl, oMonthDate, sDateNow) {
		var bSingleRow = oControl.getSingleRow();
		var iFirstDayOffset = oControl.getFirstDayOffset();
		var aWeekDays = oControl.getDays();
		var iWeekDays = aWeekDays.length;
		var iWeeksPerRow = oControl.getWeeksPerRow();
		var iDaysInRow = iWeeksPerRow * iWeekDays;
		var iDayWidth = (100 / iDaysInRow);
		var iDayHeight = oControl.getDayHeight();
		var iMonthWidth = (100 / (bSingleRow ? 1 : oControl.getMonthsPerRow()));

		var oTmpDate = new Date(oMonthDate.getTime());
		var currentDate = CalendarDate.createDate(oTmpDate.getFullYear(), oTmpDate.getMonth(), oTmpDate.getDate());
		// save the current day in the month
		var iCurrentDate = currentDate.getDate();
		// save the current week day of the date
		var iCurrentDay = currentDate.getDay();

		// go to first day of month
		currentDate.setDate(1);
		var iMonthFirstDay = currentDate.getDay();
		if (iMonthFirstDay < iFirstDayOffset) {
			iMonthFirstDay += 7;
		}
		var iCurrentMonth = currentDate.getMonth();
		var dateForNbOfDaysInThisMonth = new UniversalDate(currentDate);
		dateForNbOfDaysInThisMonth.setMonth(iCurrentMonth + 1, 0);
		var nbOfDaysInThisMonth = dateForNbOfDaysInThisMonth.getDate();

		var iDaysToGoBack = bSingleRow ? iCurrentDay + 1 - iFirstDayOffset : iCurrentDate + iMonthFirstDay - iFirstDayOffset;

		var nbOfRows = Math.ceil((nbOfDaysInThisMonth + iDaysToGoBack - iCurrentDate) / 7);
		var iTotalDays = bSingleRow ? iDaysInRow : (nbOfRows * 7);

		// 002075129500003097872016
		// For single row calendars, we want to be able to see all the month names displayed so we change
		// the current date before asking for the month title. For regular (non single row) calendars, we don't
		// want to change a thing, which is why the date is changed as usual, after the getMonthTitle call.
		if (bSingleRow) {
			currentDate = oControl._getCalendarFirstDate();
		}

		// default title (in en_US, for instance): MMM y
		var sMonthTitle = this._getMonthTitle(currentDate, bSingleRow, iTotalDays);

		if (!bSingleRow) {
			currentDate.setDate(iCurrentDate - iDaysToGoBack + 1);
		}

		oRm.write('<div'); // month div
		oRm.addClass("sapMeCalendarMonth");
		if (!bSingleRow) {
			oRm.addClass("sapMeCalendarMonthNotSingle");
		}
		oRm.writeClasses();
		oRm.addStyle("width", iMonthWidth + "%");
		oRm.writeStyles();
		oRm.write(">");

		oRm.write('<div'); // monthname div
		oRm.addClass("sapMeCalendarMonthName");
		oRm.writeClasses();
		if (oControl.getHideMonthTitles()) {
			oRm.addStyle("visibility", "hidden");
			oRm.writeStyles();
		}
		oRm.write(">");
		oRm.writeEscaped(sMonthTitle);
		oRm.write("</div>"); // monthname


		oRm.write('<div'); // MonthDayNames div
		oRm.addClass("sapMeCalendarMonthDayNames");
		oRm.writeClasses();
		oRm.write(">");

		var i;
		for (i = 0; i < iDaysInRow; i++) {
			var sContent = aWeekDays[(i + iFirstDayOffset) % iWeekDays];
			this._renderDay(oRm, oControl, null, sContent, iDayWidth);
		}

		oRm.write('</div>'); // MonthDayNames div

		oRm.write('<div'); // MonthDays div
		oRm.addClass("sapMeCalendarMonthDays");
		oRm.writeClasses();
		oRm.write(">");

		for (i = 0; i < iTotalDays; i++) { // max days of a month
			var iMonth = currentDate.getMonth();
			var iDayInWeek = currentDate.getDay();
			iCurrentDay = currentDate.getDate();

			var bNotThisMonth = iMonth !== iCurrentMonth;
			oTmpDate = new Date(currentDate.getTime());
			var sId = oTmpDate.toDateString();
			var bIsToday = sId == sDateNow;
			this._renderDay(oRm, oControl, sId, iCurrentDay + "", iDayWidth, iDayHeight, iDayInWeek, bNotThisMonth, bIsToday);

			currentDate.setDate(currentDate.getDate() + 1);
		}

		oRm.write('</div>'); // MonthDays div

		oRm.write('</div>'); // month div
	};

	/**
	 *
	 * @param {object} oRm
	 * @param {object} oControl
	 * @param {string} sId
	 * @param {string} sContent
	 * @param {number} iDayWidth
	 * @param {number} iDayHeight
	 * @param {number} iDayInWeek
	 * @param {boolean} bNotThisMonth
	 * @param {boolean} bIsToday
	 * @private
	 */
	CalendarRenderer._renderDay = function (oRm, oControl, sId, sContent, iDayWidth, iDayHeight, iDayInWeek, bNotThisMonth, bIsToday) {
		oRm.write("<div");
		oRm.addClass("sapMeCalendarMonthDay");

		if (bIsToday) {
			oRm.addClass("sapMeCalendarDayNow");
		}
		if (bNotThisMonth && !oControl.getSingleRow()) {
			oRm.addClass("sapMeCalendarDayNotInCurrentMonth");
		}
		if (typeof iDayInWeek === "number") {
			oRm.addClass("sapMeCalendarWeekDay" + iDayInWeek);
			if (oControl.isWeekend(iDayInWeek)) {
				oRm.addClass("sapMeCalendarWeekendDay");
			}
		}
		oRm.writeClasses();
		oRm.addStyle("width", iDayWidth + "%");
		if (iDayHeight) {
			oRm.addStyle("height", iDayHeight + "px");
		}
		oRm.writeStyles();
		if ( sId != null ){
			var sIdWithDashes = sId.replace(/\s/g,"-");
			oRm.writeAttribute('id', oControl.getId() + "-" + sIdWithDashes);
		}
		oRm.write(">");
		oRm.write('<span>');
		oRm.writeEscaped(sContent);
		oRm.write("</span>");
		if ( sId != null ){
			oRm.write('<input type="hidden" value="' + sId + '"></input>');
		}
		oRm.write("</div>");
	};


	return CalendarRenderer;

}, /* bExport= */ true);
