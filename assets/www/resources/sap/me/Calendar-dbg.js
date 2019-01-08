/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2016 SAP SE. All rights reserved
    
 */

// Provides control sap.me.Calendar.
sap.ui.define(['jquery.sap.global', './CalendarDate', './library', 'sap/ui/core/Control', 'sap/ui/core/LocaleData', 'sap/ui/core/IconPool', 'sap/ui/core/date/UniversalDate'],
	function(jQuery, CalendarDate, library, Control, LocaleData, IconPool, UniversalDate) {
	"use strict";



	/**
	 * Constructor for a new Calendar.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given 
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * This is the Calendar control
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 *
	 * @constructor
	 * @public
	 * @deprecated Since version 1.26.0.
	 * This control was experimental since 1.12. Please use the sap.ui.unified.Calendar instead!
	 * @alias sap.me.Calendar
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var Calendar = Control.extend("sap.me.Calendar", /** @lends sap.me.Calendar.prototype */ { metadata : {

		library : "sap.me",
		properties : {

			/**
			 * visibility of the control
			 */
			visible : {type : "boolean", group : "Misc", defaultValue : true},

			/**
			 * hides the area of navigation controls
			 */
			hideNavControls : {type : "boolean", group : "Misc", defaultValue : false},

			/**
			 * hides the area of month titles
			 */
			hideMonthTitles : {type : "boolean", group : "Misc", defaultValue : false},

			/**
			 * months to display in a row. This sets the width of the whole control in order to contain the desired number of months per row
			 */
			monthsPerRow : {type : "int", group : "Misc", defaultValue : 1},

			/**
			 * the width of a day
			 */
			dayWidth : {type : "int", group : "Misc", defaultValue : 45},

			/**
			 * the height of a day
			 */
			dayHeight : {type : "int", group : "Misc", defaultValue : 50},

			/**
			 * weeks to display in a row
			 */
			weeksPerRow : {type : "int", group : "Misc", defaultValue : 1},

			/**
			 * boolean that sets the view to week mode or month mode
			 */
			singleRow : {type : "boolean", group : "Misc", defaultValue : null},

			/**
			 * number of months in a row.
			 */
			monthsToDisplay : {type : "int", group : "Misc", defaultValue : 1},

			/**
			 * the center date where the month/week will be built around
			 */
			currentDate : {type : "string", group : "Misc", defaultValue : null},

			/**
			 * to enable multiselection feature
			 */
			enableMultiselection : {type : "boolean", group : "Misc", defaultValue : false},

			/**
			 * to offset the first day of the week (0 = sunday)
			 */
			firstDayOffset : {type : "int", group : "Misc", defaultValue : 0},

			/**
			 * Array of weekDays (as integers where 0=Sunday, 1=Monday etc) to be disabled. Interaction will be disabled for these week days.
			 */
			disabledWeekDays : {type : "any", group : "Misc", defaultValue : null},

			/**
			 * Array of specific dates (strings or Date objects) that will be disabled/non interactive
			 */
			disabledDates : {type : "any", group : "Misc", defaultValue : null},

			/**
			 * When enabled, swipe gestures will navigate and not select
			 */
			swipeToNavigate : {type : "boolean", group : "Misc", defaultValue : false},

			/**
			 * Indicates the design of the calendar (mainly colors)
			 */
			design : {type : "sap.me.CalendarDesign", group : "Appearance", defaultValue : sap.me.CalendarDesign.Approval},

			/**
			 * Indicates the design of the calendar (mainly colors)
			 */
			selectionMode : {type : "sap.me.CalendarSelectionMode", group : "Behavior", defaultValue : sap.me.CalendarSelectionMode.SINGLE},

			/**
			 * The width of the calendar
			 */
			width : {type : "sap.ui.core.CSSSize", group : "Dimension", defaultValue : '100%'},

			/**
			 * Array of day names, default value is sap.m.getLocaleData().getDays("abbreviated")
			 * Check sap.ui.core.LocaleData documentation for more info.
			 */
			days : {type : "any", group : "Appearance", defaultValue : null},

			/**
			 * Array of month names, default value is sap.m.getLocaleData().getMonths("abbreviated")
			 * Check sap.ui.core.LocaleData documentation for more info.
			 */
			months : {type : "any", group : "Appearance", defaultValue : null}
		},
		events : {

			/**
			 * event fired when a date is tapped
			 */
			tapOnDate : {
				parameters : {

					/**
					 * date tapped
					 */
					date : {type : "string"},

					/**
					 * if day was selected
					 */
					didSelect : {type : "boolean"}
				}
			},

			/**
			 * event fired when tap to next or previous button and currentDate is updated
			 */
			changeCurrentDate : {
				parameters : {

					/**
					 * new date
					 */
					currentDate : {type : "string"}
				}
			},

			/**
			 * when the range of selected dates changes
			 */
			changeRange : {
				parameters : {

					/**
					 * from date
					 */
					fromDate : {type : "string"},

					/**
					 * to date
					 */
					toDate : {type : "string"}
				}
			}
		}
	}});


	/**
	 * @private
	 */
	Calendar.prototype.init = function () {
		// by default set internalDate and currentDate to now
		this.__setCurrentDate((new CalendarDate().toDateString()), true);

		// TODO: should use _oLocaleData below.
		var oi18n = sap.m.getLocaleData();
		this.setDays(oi18n.getDays("abbreviated"));
		this.setMonths(oi18n.getMonths("abbreviated"));

		var oPrevBtn = new sap.ui.core.Icon({
			src: IconPool.getIconURI("navigation-left-arrow")
		});
		oPrevBtn.addStyleClass("sapMeCalendarPrevious");
		oPrevBtn.attachPress(null, this._gotoPrevious, this);
		oPrevBtn.setParent(this);
		this._oPrevBtn = oPrevBtn;

		var oNextBtn = new sap.ui.core.Icon({
			src: IconPool.getIconURI("navigation-right-arrow")
		});
		oNextBtn.addStyleClass("sapMeCalendarNext");
		oNextBtn.attachPress(null, this._gotoNext, this);
		oNextBtn.setParent(this);
		this._oNextBtn = oNextBtn;

		this._oDatesClasses = {};

		this._$interactiveDates = null;

		this._oLocale = sap.ui.getCore().getConfiguration().getFormatSettings().getFormatLocale();
		this._oLocaleData = LocaleData.getInstance(this._oLocale);

		this._bRtl  = sap.ui.getCore().getConfiguration().getRTL();
	};

	Calendar.prototype.exit = function () {
		this._oPrevBtn.destroy();
		delete this._oPrevBtn;
		this._oNextBtn.destroy();
		delete this._oNextBtn;

		delete this._oDatesClasses;
		delete this._$interactiveDates;

		delete this._$fromDate;
		delete this._$toDate;
	};

	Calendar.prototype.onBeforeRendering = function () {
		delete this._$interactiveDates;
	};

	Calendar.prototype.onAfterRendering = function () {
		var $this = this.$();
		var $dates = null;
		var aDisabledWeekDays = this.getDisabledWeekDays() || [];
		var aClassesToDisable = [];
		var i;
		var sDate;
		for (i = 0; i < aDisabledWeekDays.length; i++) {
			aClassesToDisable.push(".sapMeCalendarWeekDay" + aDisabledWeekDays[i]);
		}

		var bIncludeNotInCurrentMonth = this.getSingleRow() || this.getMonthsToDisplay() === 1;
		if (!bIncludeNotInCurrentMonth) {
			aClassesToDisable.push(".sapMeCalendarDayNotInCurrentMonth");
		}
		if (aClassesToDisable.length) {
			var sToExclude = aClassesToDisable.join(", ");
			// remove pointer events for non-interactive dates
			$this.find(".sapMeCalendarMonth > div.sapMeCalendarMonthDays")
				.children(sToExclude).css({
					"pointer-events": "none"
				});
			$dates = $this.find(".sapMeCalendarMonth > div.sapMeCalendarMonthDays > .sapMeCalendarMonthDay:not(" + sToExclude + ")");
		} else {
			$dates = $this.find(".sapMeCalendarMonth > div.sapMeCalendarMonthDays > .sapMeCalendarMonthDay");
		}
		var aDatesToDisable = this.getDisabledDates() || [];
		for (i = 0; i < aDatesToDisable.length; i++) {
			sDate = aDatesToDisable[i];
			$dates.children("input[value='" + sDate + "']") // get the right input
				.parent() // get the date
				.css({
					"pointer-events": "none"
				}); // disable
		}
		for (sDate in this._oDatesClasses) {
			var sStates = this._oDatesClasses[sDate].join(" ");
			$dates.children("input[value='" + sDate + "']") // get the right input
				.parent() // get the date
				.addClass(sStates); // set selection
		}
		// i save this array so it will be more performant instead of doing
		// selectors.
		this._$interactiveDates = $dates;

		// hiding nav controls
		var bHide = this.getHideNavControls();
		this._oPrevBtn.$().css({
			display: bHide ? "none" : ""
		});
		this._oNextBtn.$().css({
			display: bHide ? "none" : ""
		});
	};

	Calendar.prototype.setEnableMultiselection = function (bEnable) {
		// no rerender needed
		return this.setProperty("selectionMode", bEnable ? sap.me.CalendarSelectionMode.MULTIPLE : sap.me.CalendarSelectionMode.SINGLE, true);
	};

	Calendar.prototype.getEnableMultiselection = function () {
		return this.getProperty("selectionMode") == sap.me.CalendarSelectionMode.MULTIPLE;
	};

	Calendar.prototype.setHideNavControls = function (bHide) {
		if (this.getDomRef()) {
			this._oPrevBtn.$().css({
				// Should use visibility-hidden instead, to ensure the controls maintain their ground
				// and don't get overlapped by all the other controls. Unused in the renderer anyway...
				display: bHide ? "none" : ""
			});
			this._oNextBtn.$().css({
				// should use visibility-hidden instead, to ensure the controls maintain their spaces
				// and don't get overlapped by all the other controls. Unused in the renderer anyway...
				display: bHide ? "none" : ""
			});
		}
		return this.setProperty("hideNavControls", bHide, true); // no rerender
		// needed
	};

	Calendar.prototype.setHideMonthTitles = function (bHide) {
		if (this.getDomRef()) {
			this.$().find(".sapMeCalendarMonthName").css({
				visibility: bHide ? "hidden" : ""
			});
		}
		return this.setProperty("hideMonthTitles", bHide, true); // no rerender
		// needed
	};

	Calendar.prototype.setFirstDayOffset = function (iOffset) {
		iOffset = iOffset % this.getDays().length;
		return this.setProperty("firstDayOffset", iOffset);
	};

	Calendar.prototype.setWeeksPerRow = function (iWeeks) {
		iWeeks = iWeeks % 5;
		return this.setProperty("weeksPerRow", iWeeks);
	};

	Calendar.prototype.setDisabledWeekDays = function (aWeekDays) {
		aWeekDays = aWeekDays || [];
		return this.setProperty("disabledWeekDays", aWeekDays);
	};

	Calendar.prototype.setDisabledDates = function (aDates) {
		aDates = aDates || [];
		var i;
		for (i = 0; i < aDates.length; i++) {
			var oDate = aDates[i];
			if (typeof oDate === "string") {
				// this will change the type of oDate from String to Date.
				oDate = CalendarDate.parseFromToDateString(oDate);
			}
			var sDate = oDate.toDateString();
			aDates[i] = sDate;
		}
		return this.setProperty("disabledDates", aDates);
	};

	// ** GESTURE HANDLERS ** //

	Calendar.prototype.ontouchstart = function (oEvent) {
		if (!this.getSwipeToNavigate()) {
			this._gestureStart(oEvent);
		}
	};

	Calendar.prototype._gestureStart = function (oEvent) {
		this._$fromDate = this.getEnableMultiselection() ? this
				._getDateDomRef(oEvent.target) : null;
	};

	Calendar.prototype.ontouchmove = function (oEvent) {
		if (!this.getSwipeToNavigate()) {
			this._gestureMove(oEvent);
		}
	};

	Calendar.prototype._gestureMove = function (oEvent) {
		if (this._$fromDate) {
			if (!this._$toDate) { // it means it is the first time it moves
				this._$fromDate.addClass("sapMeCalendarHighlight");
				this._$toDate = this._$fromDate;
			}
			oEvent.stopPropagation();
			oEvent.preventDefault();
			var oDomRef = oEvent.target;
			if (oEvent.touches.length) {
				var oTouch = oEvent.touches[0];
				oDomRef = document.elementFromPoint(oTouch.clientX, oTouch.clientY);
			}
			var $toDate = this._getDateDomRef(oDomRef);
			if ($toDate && $toDate != this._$toDate) {
				this._$toDate.removeClass("sapMeCalendarHighlight");
				this._$fromDate.addClass("sapMeCalendarHighlight"); // because it
				// could have
				// been = toDate
				$toDate.addClass("sapMeCalendarHighlight");
				this._$toDate = $toDate;
			}
		}
	};

	Calendar.prototype.ontouchend = function (oEvent) {
		if (!this.getSwipeToNavigate()) {
			this._gestureEnd(oEvent);
		}
	};

	Calendar.prototype._gestureEnd = function (oEvent) {
		if (this._$fromDate && this._$toDate) { // this means it has moved
			oEvent.stopPropagation();
			oEvent.preventDefault();
			var sFromDate = this._getDateValue(this._$fromDate);
			var sToDate = this._getDateValue(this._$toDate);
			this._$fromDate.removeClass("sapMeCalendarHighlight");
			this._$toDate.removeClass("sapMeCalendarHighlight");
			this.toggleDatesRangeSelection(sFromDate, sToDate, true);
			this.fireChangeRange({
				fromDate: sFromDate,
				toDate: sToDate
			});
		}
		delete this._$fromDate;
		delete this._$toDate;
	};

	Calendar.prototype.ontap = function (oEvent) {
		this._gestureSelect(oEvent);
	};

	Calendar.prototype._gestureSelect = function (oEvent) {
		var $date = this._getDateDomRef(oEvent.target);
		// CSS 0120061532 0001461331 2014
		// In IE < 11, the pointer-events none on a div is still throwing event so we check here
		if ( sap.ui.Device.browser.msie && sap.ui.Device.browser.version < 11 ) {
			if ( $date.css("pointer-events") == "none" ){
				return;
			}
		}
		if ($date) { // handle tap-like event
			var sDate = this._getDateValue($date);
			var bDidSelect = !$date.hasClass("sapMeCalendarSelected");

			if (!this.getEnableMultiselection()) {
				if (this.getSelectionMode() == sap.me.CalendarSelectionMode.SINGLE) {
					this.unselectAllDates();
				} else if (this.getSelectedDates().length > 1) {
					this.unselectAllDates();
				}
			}
			if ((this.getSelectionMode() == sap.me.CalendarSelectionMode.RANGE) && (this.getSelectedDates().length == 1)) {
				var sFromDate = this.getSelectedDates()[0];
				this.toggleDatesRangeSelection(sFromDate, sDate, true);
				this.fireChangeRange({
					fromDate: sFromDate,
					toDate: sDate
				});
			} else {
				$date.toggleClass("sapMeCalendarSelected", bDidSelect);
				this._updateDatesWithClass("sapMeCalendarSelected", sDate, bDidSelect);
				this.fireTapOnDate({
					didSelect: bDidSelect,
					date: sDate
				});
			}
		}
	};

	Calendar.prototype.onswipeleft = function (oEvent) {
		if (this.getSwipeToNavigate()) {
			if (!this._bRtl) {
				this._gotoNext();
			} else {
				this._gotoPrevious();
			}
		}
	};

	Calendar.prototype.onswiperight = function (oEvent) {
		if (this.getSwipeToNavigate()) {
			if (!this._bRtl) {
				this._gotoPrevious();
			} else {
				this._gotoNext();
			}
		}
	};

	// ** PUBLIC METHODS **//


	/**
	 * returns an array of the currently selected dates (dates are strings formatted as Date.toDateString())
	 *
	 * @type any
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	Calendar.prototype.getSelectedDates = function () {
		return this._getDatesWithStyleClass("sapMeCalendarSelected");
	};


	/**
	 * it toggles the passed dates to selected/unselected
	 *
	 * @param {any} aDates
	 *         Array of the dates to be toggled. they can be Strings or Date objects.
	 * @param {boolean} bSelected
	 *         select/unselect. Optional, if omitted it inverts each date's current state
	 * @type void
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	Calendar.prototype.toggleDatesSelection = function (aDates, bSelected) {
		this._toggleDatesStyleClass("sapMeCalendarSelected", aDates, bSelected);
	};


	/**
	 * Change the type of the given dates
	 *
	 * @param {any} aDates
	 *         An array of dates in string representation
	 * @param {sap.me.CalendarEventType} sType
	 *         The type of event
	 * @param {boolean} bSelected
	 *         Add/remove the type, if ommited it will toggle
	 * @type void
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	Calendar.prototype.toggleDatesType = function (aDates, sType, bSelected) {
		this._toggleDatesStyleClass("sapMeCalendar" + sType, aDates, bSelected);
	};

	Calendar.prototype.removeTypesOfAllDates = function () {
		this._removeStyleClassOfAllDates("sapMeCalendar" + sap.me.CalendarEventType.Type00);
		this._removeStyleClassOfAllDates("sapMeCalendar" + sap.me.CalendarEventType.Type01);
		this._removeStyleClassOfAllDates("sapMeCalendar" + sap.me.CalendarEventType.Type04);
		this._removeStyleClassOfAllDates("sapMeCalendar" + sap.me.CalendarEventType.Type06);
		this._removeStyleClassOfAllDates("sapMeCalendar" + sap.me.CalendarEventType.Type07);
		this._removeStyleClassOfAllDates("sapMeCalendar" + sap.me.CalendarEventType.Type10);
	};


	/**
	 * unselect all the dates
	 *
	 * @type void
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	Calendar.prototype.unselectAllDates = function () {
		this._removeStyleClassOfAllDates("sapMeCalendarSelected");
	};


	/**
	 * it toggles the selection of the dates within the passed range to selected/unselected
	 *
	 * @param {any} oDateStart
	 *         starting date of the range. It can be Strings or Date objects.
	 * @param {any} oDateEnd
	 *         ending date of the range. It can be Strings or Date objects.
	 * @param {boolean} bSelected
	 *         selected/unselected. Optional, if omitted it inverts each date's current state
	 * @type void
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	Calendar.prototype.toggleDatesRangeSelection = function (oDateStart, oDateEnd, bSelected) {
		this._toggleDatesRangeStyleClass("sapMeCalendarSelected", oDateStart,
			oDateEnd, bSelected);
	};

	// ** PRIVATE, INTERNAL METHODS **//
	Calendar.prototype._getDatesWithStyleClass = function (sState) {
		var aDates = [];
		var sDate;
		for (sDate in this._oDatesClasses) {
			if (jQuery.inArray(sState, this._oDatesClasses[sDate]) !== -1) {
				aDates.push(sDate);
			}
		}
		return aDates;
	};

	Calendar.prototype._toggleDatesRangeStyleClass = function (sClass, oDateStart, oDateEnd, bActive) {

		var oUniversalDateStart;
		var oUniversalDateEnd;
		if (typeof oDateStart == "string") {
			// this will change the type of oDateStart from String to Date.
			oUniversalDateStart = CalendarDate.parseFromToDateString(oDateStart);
		}else if ( oDateStart instanceof Date){
			oUniversalDateStart = new UniversalDate( oDateStart.getTime() );
		}
		if (typeof oDateEnd == "string") {
			// this will change the type of oDateEnd from String to Date.
			oUniversalDateEnd = CalendarDate.parseFromToDateString(oDateEnd);
		}else if ( oDateEnd instanceof Date){
			oUniversalDateEnd = new UniversalDate( oDateEnd.getTime() );
		}

		if (oUniversalDateStart && oUniversalDateEnd && typeof oUniversalDateStart.getTime == "function"
			&& typeof oUniversalDateEnd.getTime == "function") {
			if (oUniversalDateStart.getTime() > oUniversalDateEnd.getTime()) {
				var oTemp = new UniversalDate(oUniversalDateStart.getTime());
				oUniversalDateStart = oUniversalDateEnd;
				oUniversalDateEnd = oTemp;
			}
			var aDates = [];
			var oDateStartCopy = new UniversalDate(oUniversalDateStart.getTime());
			var oDate;
			while (oUniversalDateEnd - oDateStartCopy >= 0) {
				oDate = new Date(oDateStartCopy.getTime());
				aDates.push(oDate.toDateString());
				oDateStartCopy.setDate(oDateStartCopy.getDate() + 1);
			}
			this._toggleDatesStyleClass(sClass, aDates, bActive);
		}
	};

	Calendar.prototype._toggleDatesStyleClass = function (sClass, aDates, bActive) {
		var i;
		for (i = 0; i < aDates.length; i++) {
			var oDate = aDates[i];
			if (typeof oDate == "string") {
				// Type change String to Date
				oDate = CalendarDate.parseFromToDateString(oDate);
			}else if ( oDate instanceof Date){
				oDate = new UniversalDate( oDate.getTime() );
			}
			oDate = new Date(oDate.getTime());
			var sDate = oDate.toDateString();
			aDates[i] = sDate;
			this._updateDatesWithClass(sClass, sDate, bActive);
			if (this._$interactiveDates) {
				this._$interactiveDates.children("input[value='" + sDate + "']")
					.parent().toggleClass(sClass, bActive);
			}
		}
	};

	Calendar.prototype._removeStyleClassOfAllDates = function (sClass) {
		var sDate;
		for (sDate in this._oDatesClasses) {
			this._updateDatesWithClass(sClass, sDate, false);
		}
		if (this._$interactiveDates) {
			this._$interactiveDates.removeClass(sClass);
		}
	};

	Calendar.prototype._gotoPrevious = function () {
		var bSingleRow = this.getSingleRow();
		if (bSingleRow) {
			this._oInternalDate.previousWeek();
		} else {
			this._oInternalDate.previousMonth();
		}
		var sCurDate = this._oInternalDate.toDateString();
		this.setCurrentDate(sCurDate);
		this.fireChangeCurrentDate({
			currentDate: sCurDate
		});
	};

	Calendar.prototype._gotoNext = function () {
		var bSingleRow = this.getSingleRow();
		if (bSingleRow) {
			this._oInternalDate.nextWeek();
		} else {
			this._oInternalDate.nextMonth();
		}
		var sCurDate = this._oInternalDate.toDateString();
		this.setCurrentDate(sCurDate);
		this.fireChangeCurrentDate({
			currentDate: sCurDate
		});
	};

	Calendar.prototype._updateDatesWithClass = function (sClass, sDate, bActive) {
		var aStates = this._oDatesClasses[sDate] || [];
		var i = jQuery.inArray(sClass, aStates);
		if (bActive && i === -1) {
			aStates.push(sClass);
		} else if (!bActive && i !== -1) {
			aStates.splice(i, 1);
		}

		if (aStates.length === 0) {
			this._oDatesClasses[sDate] = null;
			delete this._oDatesClasses[sDate];
		} else {
			this._oDatesClasses[sDate] = aStates;
		}
	};

	Calendar.prototype._getDateValue = function ($date) {
		// TODO find proper way (e.g. do CalendarDay control)
		return $date.children("input").eq(0).val();
	};

	Calendar.prototype._getMonthDate = function (oDomRef) {
		var $domref = jQuery(oDomRef);
		var $this = jQuery(this.getDomRef());
		while ($domref && $domref != $this
				&& !$domref.hasClass("sapMeCalendarMonthDay")) {
			$domref = $domref.parent();
		}
		return $domref && $domref.parent().hasClass("sapMeCalendarMonth") ? $domref
				: null;
	};

	Calendar.prototype._getDateDomRef = function (oDomRef) {
		var $src = oDomRef ? jQuery(oDomRef) : null;
		var sThisId = this.getId();
		var $result = null;
		while ($src && $src[0].id != sThisId
				&& !$src.hasClass("sapMeCalendarMonth")) {
			if ($src.hasClass("sapMeCalendarMonthDay")
					&& $src.parent().hasClass("sapMeCalendarMonthDays")) {
				$result = $src;
				break;
			}
			$src = $src.parent();
		}
		return $result;
	};

	Calendar.prototype._checkLanguageRegion = function (language, region) {
		return (region === this._oLocale.getRegion() && language === this._oLocale.getLanguage());
	};

	Calendar.prototype._getIntervalPattern = function (pattern) {
		return this._oLocaleData.getIntervalPattern(pattern);
	};

	Calendar.prototype.getCurrentDate = function () {
		return this._oInternalDate.toDateString();
	};

	/**
	 * Sets the current date of the calendar.
	 * @param {String} strDate The Date to set, the format being identical to a date string produced by "toDateString".
	 *
	 * @return {sap.me.Calendar} <code>this</code> to allow method chaining.
	 * @public
	 */
	Calendar.prototype.setCurrentDate = function (strDate) {
		this.__setCurrentDate(strDate, false);
		return this;
	};

	/**
	 * Sets the current date of the calendar.
	 * @param {String} strDate The Date to set, the format being identical to a date string produced by "toDateString".
	 * @param {boolean} bSuppressInvalidate Set to true to prevent invalidation of the control
	 * @private
	 */
	Calendar.prototype.__setCurrentDate = function (strDate, bSuppressInvalidate) {
		this._oInternalDate = new CalendarDate(CalendarDate.parseFromToDateString(strDate));
		this.setProperty("currentDate", this._oInternalDate.toDateString(), bSuppressInvalidate);
	};

	/**
	 * Helper function to instantiate a Date from the string(s) provided
	 * by the getCurrentDate, getSelectedDates methods.
	 * <B>IMPORTANT:</B> The only valid values for the created Date are: year, month, day.
	 * Disregard any other value: hours, minutes, seconds, milliseconds...
	 *
	 * @param {String} strDate The date, produced by a former call to Date.toDateString.
	 * @throws {Error} If the string provided does not match a toDateString produced string.
	 * @public
	 * @static
	 * @return {Date} The Date, parsed from the input string.
	 */
	Calendar.parseDate = function (strDate) {
		// DO NOT USE sap.me.CalendarDate directly
		var oDate = CalendarDate.parseFromToDateString(strDate, true);
		return new Date( oDate.getTime());
	};

	/**
	 * This method returns the first day to display, based on the current date's value and the defined
	 * first day of the week.
	 * Please note that this function was only tested for single row calendars.
	 *
	 * @returns {Date} The calendar's current date if it is not a single row calendar.
	 * Otherwise, the date is the first day of the week as set by using setFirstDayOffset that
	 * is on or before the current date.
	 *
	 * @private
	 */
	Calendar.prototype._getCalendarFirstDate = function () {
		// copy the current date, we will modify this copy to "move back in time" or return it as is.
		var oFirstDate = new UniversalDate(this._oInternalDate._date.getTime());

		if (this.getSingleRow()) {
			// since we're not working with UTC, we set the hour to noon so that we can safely add/remove days
			oFirstDate.setHours(12);
			// How many days are there between the current date's day and the first day of the week?
			var deltaDays = oFirstDate.getDay() - this.getFirstDayOffset();
			var daysToGoBack;
			// if the difference is negative, this means that the first day of the week is later in the week
			if (deltaDays < 0) {
				// we have to move back to the previous week. %7 is for safety, it shouldn't be useful (depends on getFirstDayOffset).
				daysToGoBack = (7 - Math.abs(deltaDays)) % 7;
			} else {
				daysToGoBack = deltaDays;
			}
			// Move our copy date back of the necessary amount of days
			oFirstDate.setDate(oFirstDate.getDate() - daysToGoBack);
		} else {
			jQuery.sap.log.error("You cannot use this method in a non single row calendar, returning current date.");
		}

		return oFirstDate;
	};

	/**
	 * This function returns true if the given day is a weekend, based on the current locale.
	 *
	 * @param {number} dayOfTheWeek The day of the week, as provided by the getDay() of the Javascript Date object.
	 * Must be between 0 and 6.
	 *
	 * @returns {boolean} true if the given day of the week is a week end, based on the current locale.
	 */
	Calendar.prototype.isWeekend = function (dayOfTheWeek) {
		var start = this._oLocaleData.getWeekendStart(),
			end = this._oLocaleData.getWeekendEnd(),
			bIsWeekend = false;

		if (start <= end) {
			bIsWeekend = (start <= dayOfTheWeek) && (dayOfTheWeek <= end);
		}
		else {
			bIsWeekend = (dayOfTheWeek >= start) || (dayOfTheWeek <= end);
		}

		return bIsWeekend;
	};

	return Calendar;

}, /* bExport= */ true);
