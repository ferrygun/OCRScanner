/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2016 SAP SE. All rights reserved
    
 */

// Provides control sap.me.OverlapCalendar.
sap.ui.define(['jquery.sap.global', './Calendar', './CalendarDate', './library', 'sap/ui/core/Control', 'sap/ui/core/theming/Parameters', 'sap/ui/core/date/UniversalDate'],
	function(jQuery, Calendar, CalendarDate, library, Control, Parameters, UniversalDate) {
	"use strict";

	/**
	 * Constructor for a new OverlapCalendar.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * A calendar that allows to display events in a grid and show the overlapped events
	 * @extends sap.ui.core.Control
	 *
	 * @constructor
	 * @public
	 * @deprecated Since version 1.34.0.
	 * This control was experimental since 1.12. Please use the sap.m.PlanningCalendar instead!
	 * @alias sap.me.OverlapCalendar
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var OverlapCalendar = Control.extend("sap.me.OverlapCalendar", /** @lends sap.me.OverlapCalendar.prototype */ { metadata : {
		library : "sap.me",
		properties: {
			/**
			 * The first date to display for the calendar
			 */
			startDate: {type: "string", group: "Data", defaultValue: null},

			/**
			 * Number of weeks
			 */
			weeksPerRow: {type: "int", group: "Appearance", defaultValue: 2},

			/**
			 * Indicate how to offset the first day in regards to a Sunday (by default)
			 */
			firstDayOffset: {type: "int", group: "Appearance", defaultValue: 0},

			/**
			 * Do we want to display the overlap indicator
			 */
			showOverlapIndicator: {type: "boolean", group: "Appearance", defaultValue: false},

			/**
			 * Indicates if we should render this component
			 */
			visible: {type: "boolean", group: "Appearance", defaultValue: true},

			/**
			 * Use swipe gesture to navigate
			 */
			swipeToNavigate: {type: "boolean", group: "Behavior", defaultValue: true},

			/**
			 * The width of the calendar
			 */
			width: {type: "sap.ui.core.CSSSize", group: "Dimension", defaultValue: '100%'}
		},
		aggregations: {
			/**
			 * The list of events to display in the calendar grid
			 */
			calendarEvents: {type: "sap.me.OverlapCalendarEvent", multiple: true, singularName: "calendarEvent"},

			/**
			 * Calendar instance
			 */
			calendar: {type: "sap.me.Calendar", multiple: false, visibility: "hidden"},

			/**
			 * Hidden aggregation of the label for event type
			 */
			typeLabels: {type: "sap.m.Label", multiple: true, singularName: "typeLabel", visibility: "hidden"},

			/**
			 * Hidden aggregation for the name label
			 */
			nameLabels: {type: "sap.m.Label", multiple: true, singularName: "nameLabel", visibility: "hidden"}
		},
		events: {
			/**
			 * Indicates that we have reach the last week with data
			 */
			endOfData: {
				parameters: {

					/**
					 * Indicates if the data missing are before the start date or at the end
					 */
					before: {type: "boolean"}
				}
			},

			/**
			 * Triggered when the displayed dates change
			 */
			changeDate: {
				parameters: {

					/**
					 * The first date displayed in the calendar
					 */
					firstDate: {type: "object"},

					/**
					 * The last date that will be displayed
					 */
					lastDate: {type: "object"}
				}
			}
		}
	}
	});


	/**
	 * @private
	 */
	OverlapCalendar.prototype.init = function () {
		// Private property for the sap.me.Calendar control instance
		this.setAggregation("calendar", new Calendar({
			singleRow: true,
			weeksPerRow: this.getWeeksPerRow(),
			monthsPerRow: 1,
			monthsToDisplay: 1,
			dayWidth: 48,
			dayHeight: 48,
			swipeToNavigate: this.getSwipeToNavigate()
		}));
		this.getCalendar().attachChangeCurrentDate(this.onCurrentDateChanged, this);
		this._typeWithBgImages = ["04", "07"];
		this._oDaysOverlap = {};
		this._bRtl = sap.ui.getCore().getConfiguration().getRTL();
	};

	/**
	 * @param {event} oEvent
	 * @public
	 */
	OverlapCalendar.prototype.onswiperight = function (oEvent) {
		if (this.getSwipeToNavigate()) {
			this.getCalendar().onswiperight(oEvent);
		}
	};

	/**
	 * @param {event} oEvent
	 * @public
	 */
	OverlapCalendar.prototype.onswipeleft = function (oEvent) {
		if (this.getSwipeToNavigate()) {
			this.getCalendar().onswipeleft(oEvent);
		}
	};

	/**
	 * @param {boolean} bSwipe
	 * @public
	 */
	OverlapCalendar.prototype.setSwipeToNavigate = function (bSwipe) {
		this.getCalendar().setSwipeToNavigate(bSwipe);
		this.setProperty("swipeToNavigate", bSwipe, true);
	};

	/**
	 * @returns {*}
	 * @private
	 */
	OverlapCalendar.prototype._getFirstDateDisplayed = function () {
		var iFirstDayOffset = this.getCalendar().getFirstDayOffset();
		var currentDate = this._createDateInDays(this.getStartDate());
		var iCurrentDate = currentDate.getDate();
		var iCurrentDay = currentDate.getDay();
		currentDate.setDate(1); // go to first day of month
		var iDaysToGoBack = iCurrentDay + 1 - iFirstDayOffset;
		currentDate.setDate(iCurrentDate - iDaysToGoBack + 1);
		return currentDate;
	};

	/**
	 * @returns {*}
	 * @private
	 */
	OverlapCalendar.prototype._getLastDateDisplayed = function () {
		var aWeekDays = this.getCalendar().getDays();
		var iWeekDays = aWeekDays.length;
		var iWeeksPerRow = this.getCalendar().getWeeksPerRow();
		var iDaysInRow = iWeeksPerRow * iWeekDays;
		var currentDate = this._getFirstDateDisplayed();
		var tempDate = this._createDateInDays(currentDate.getTime());
		tempDate.setDate(tempDate.getDate() + iDaysInRow - 1);
		return tempDate;
	};

	/**
	 * @param {number} iWeeksPerRow The integer number of weeks per row
	 * @public
	 */
	OverlapCalendar.prototype.setWeeksPerRow = function (iWeeksPerRow) {
		this.getCalendar().setWeeksPerRow(iWeeksPerRow);
		this.setProperty("weeksPerRow", iWeeksPerRow);
	};

	/**
	 * @public
	 * @returns {sap.me.Calendar} The calendar object
	 */
	OverlapCalendar.prototype.getCalendar = function () {
		return this.getAggregation("calendar");
	};

	/**
	 * The output of this function can be passed to the javascript Date constructor.
	 * The main purpose is to prevent a UniversalDate to be passed to the Date ctor.
	 *
	 * @param {Date | string | UniversalDate} date
	 * @returns {Date | number} The input itself or the getTime value of the UniversalDate.
	 * @private
	 */
	OverlapCalendar._ctorSafeDate = function (date) {
		var safeDate = date;
		if (date instanceof UniversalDate) {
			safeDate = date.getTime();
		}

		return safeDate;
	};

	/**
	 * Transforms a UniversalDate into a Date object.
	 * If the parameter is not a UniversalDate, this function does nothing.
	 *
	 * @param {Date | string | UniversalDate} date The parameter to convert from UniversalDate to Date or to leave unchanged.
	 * @returns {Date | string} A Date, if the parameter was a UniversalDate.
	 * @private
	 */
	OverlapCalendar._getJSDate = function (date) {
		var jsDate = date;
		if (date instanceof UniversalDate) {
			jsDate = new Date(date.getTime());
		}
		return jsDate;
	};

	/**
	 * @param {string|Date} sDate The start date, expected toDateString.
	 * @public
	 */
	OverlapCalendar.prototype.setStartDate = function (sDate) {
		var safeDate = OverlapCalendar._ctorSafeDate(sDate);
		this.getCalendar().setFirstDayOffset(0);
		this.getCalendar().setCurrentDate(safeDate);
		this.setProperty("startDate", safeDate);
		var offset = this._getDaysOffset(this._createDateInDays(safeDate), this._getFirstDateDisplayed());
		this.getCalendar().setFirstDayOffset(offset);
	};

	/**
	 * @param {event} oEvent Event emitted by the Calendar. See changeCurrentDate event of sap.me.Calendar.
	 *
	 * @fires OverlapCalendar#changeDate
	 * @private
	 */
	OverlapCalendar.prototype.onCurrentDateChanged = function (oEvent) {
		this.setProperty("startDate", oEvent.getParameter("currentDate"), true);
		this.getCalendar().invalidate();
		this._renderCalendarEvents();
		/**
		 * changeDate event.
		 *
		 * @event OverlapCalendar#changeDate
		 * @type {object}
		 * @property {Date} firstDate - Javascript Date object representing the first date displayed by the overlap calendar.
		 * @property {Date} endDate - Javascript Date object representing the last date displayed by the overlap calendar.
		 */
		this.fireChangeDate({
			firstDate: OverlapCalendar._getJSDate(this._getFirstDateDisplayed()),
			endDate: OverlapCalendar._getJSDate(this._getLastDateDisplayed())
		});
	};

	/**
	 * @public
	 */
	OverlapCalendar.prototype.onBeforeRendering = function () {
		this._cleanUp();
		this._aRows = [];
		this._lastDate = null;
		this._firstDate = null;
		var aCalendarEvents = this.getCalendarEvents();
		jQuery.each(aCalendarEvents, jQuery.proxy(this._parseCalendarEvent, this));
	};

	/**
	 * @public
	 */
	OverlapCalendar.prototype.onAfterRendering = function () {
		this._renderCalendarEvents();
		sap.ui.Device.resize.attachHandler(this._onResize, this);
	};

	/**
	 * on resize handler
	 * @private
	 */
	OverlapCalendar.prototype._onResize = function () {
		if (this._sDelayedResize) {
			jQuery.sap.clearIntervalCall(this._sDelayedResize);
		}
		this._sDelayedResize = jQuery.sap.delayedCall(200, this, this._fireRecomputeElementsSizes);
	};

	/**
	 * @private
	 */
	OverlapCalendar.prototype.exit = function () {
		this._cleanUp();
	};

	/**
	 * clean up function, removes the on resize handler.
	 * @private
	 */
	OverlapCalendar.prototype._cleanUp = function () {
		sap.ui.Device.resize.detachHandler(this._onResize, this);
	};

	/**
	 * Retrieves all the elements that need to be resized based on their parents.
	 * @private
	 */
	OverlapCalendar.prototype._fireRecomputeElementsSizes = function () {
		var oCalendar = this.$();
		// Get all the half days
		var aElements = oCalendar.find(".sapMeOverlapCalendarHalfDay");
		// Add all the rows containing the labels.
		jQuery.merge(aElements, oCalendar.find(".sapMeOverlapCalendarRowLabels"));
		// resize them all
		this._sizeElementsToParent(aElements);
	};

	/**
	 * @param {date} date
	 * @returns {number} The number of days between the given date and the first date displayed
	 * @private
	 */
	OverlapCalendar.prototype._getDayId = function (date) {
		var currentDate = this._createDateInDays(this._getFirstDateDisplayed());
		return this._getDaysOffset(currentDate, this._createDateInDays(date));
	};

	/**
	 * @private
	 */
	OverlapCalendar.prototype._cleanUpDivs = function () {
		// filter the queries on the calendar.
		var oCalendar = this.$();
		// Clean up the divs
		oCalendar.find(".sapMeOverlapCalendarDay").removeClass().addClass("sapMeOverlapCalendarDay");
		oCalendar.find(".sapMeOverlapCalendarHalfDay").remove();
		oCalendar.find(".sapMeOverlapCalendarDay.sapMeOverlapCalendarDayWithHalf").removeClass(".sapMeOverlapCalendarDayWithHalf");
		oCalendar.find(".sapMeOverlapCalendarOverlap").css("background-color", "transparent").css("border", "none");
		oCalendar.find(".sapMeOverlapCalendarTypeLbl").remove();
	};

	/**
	 * @private
	 */
	OverlapCalendar.prototype._renderCalendarEvents = function () {
		var id;
		this._mHalfDays = {};
		this._cleanUpDivs();
		// Render the events
		this._oDaysOverlap = {};
		var aCalendarEvents = this.getCalendarEvents();
		jQuery.each(aCalendarEvents, jQuery.proxy(this._renderCalendarEvent, this));
		jQuery.each(this._mHalfDays, jQuery.proxy(this._renderHalfDayCalendarEvent, this));
		// Render overlap
		if (this.getShowOverlapIndicator()) {
			for (id in this._oDaysOverlap) {
				if (this._oDaysOverlap[id] != undefined && this._oDaysOverlap[id] > 1) {
					var $div = jQuery.sap.byId(this._provideId("overlap", id));
					$div.css("background-color", Parameters.get("sapMeOverlapCalendarIndicator"));
					$div.css("border-right", "1px solid " + Parameters.get("sapMeOverlapCalendarIndicator"));
				}
			}
		}

		// Test if we reach the end
		if (this._firstDate && this._lastDate) {
			var currentDatePlus7 = this._getFirstDateDisplayed();
			currentDatePlus7.setDate(currentDatePlus7.getDate() + 7);
			var currentDateEndMinus7 = this._getLastDateDisplayed();
			currentDateEndMinus7.setDate(currentDateEndMinus7.getDate() - 7);
			if ((this._dayIsBefore(this._lastDate, currentDatePlus7) )) {
				this.fireEndOfData({before: false});
			} else if (this._dayIsAfter(this._firstDate, currentDateEndMinus7)) {
				this.fireEndOfData({before: true});
			}
		}
	};

	/**
	 *
	 * @returns {string} A string prefixed by this control's ID, to which the optional parameters are concatenated.
	 * @private
	 */
	OverlapCalendar.prototype._provideId = function (/*arguments*/) {
		var strPrefix = jQuery.makeArray(arguments).join("-");
		return this.getId() + "-" + strPrefix;
	};

	/**
	 * @param {number} dayId The ID of the day
	 * @private
	 */
	OverlapCalendar.prototype._addToDayOverlap = function (dayId) {
		if (this._oDaysOverlap[dayId] == undefined) {
			this._oDaysOverlap[dayId] = 0;
		}
		this._oDaysOverlap[dayId]++;
	};

	/**
	 * @param {date} firstDate First date of the offset
	 * @param {date} secondDate Second date of the offset
	 * @returns {number} The number of days (integer) between the two dates. Always positive or zero.
	 * @private
	 */
	OverlapCalendar.prototype._getDaysOffset = function (firstDate, secondDate) {
		return Math.abs(this._getRawDaysDifference(firstDate, secondDate));
	};

	/**
	 * @param {date} firstDate First date of the difference
	 * @param {date} secondDate Second date of the difference
	 * @returns {number} The number (integer) of days between the dates.
	 * @private
	 */
	OverlapCalendar.prototype._getDaysDifference = function (firstDate, secondDate) {
		return this._getRawDaysDifference(firstDate, secondDate);
	};

	/**
	 * @param {date} firstDate First date of the difference
	 * @param {date} secondDate Second date of the difference
	 * @returns {number} The number of days, as an integer, between the two dates.
	 * @private
	 */
	OverlapCalendar.prototype._getRawDaysDifference = function (firstDate, secondDate) {
		// The number of milliseconds in one day = 1000 * 60 * 60 * 24
		var ONE_DAY = 86400000;

		// Convert both dates to milliseconds
		var date1_ms = firstDate.getTime();
		var date2_ms = secondDate.getTime();

		// Calculate the difference in milliseconds
		var difference_ms = date1_ms - date2_ms;

		// Between two dates there can be a non integer difference due to daylight saving
		return Math.round(difference_ms / ONE_DAY);
	};

	/**
	 * @param {date} date The date to test
	 * @param {date} dateToCompare The date to compare against.
	 * @returns {boolean} true if the tested date is after the date to compare against.
	 * @private
	 */
	OverlapCalendar.prototype._dayIsAfter = function (date, dateToCompare) {
		return (this._getDaysDifference(date, dateToCompare) > 0 );
	};

	/**
	 * @param {date} date The date to test
	 * @param {date} dateToCompare The date to compare against.
	 * @returns {boolean} true if the tested date is before the date to compare against.
	 * @private
	 */
	OverlapCalendar.prototype._dayIsBefore = function (date, dateToCompare) {
		return (this._getDaysDifference(date, dateToCompare) < 0 );
	};

	/**
	 * @param {date} date The date to use to create a new Date object with a precision of the day ; everything smaller is zeroed out.
	 * @returns {Date} The date, without any information lower than a day.
	 * @private
	 */
	OverlapCalendar.prototype._createDateInDays = function (date) {
		var ctorSafeDate = OverlapCalendar._ctorSafeDate(date);
		var dateInDays = new Date(ctorSafeDate);
		// This is because of DST, 0120061532 0001393111 2014, 0120025231 0000919744 2015
		return CalendarDate.createDate(dateInDays.getUTCFullYear(), dateInDays.getUTCMonth(), dateInDays.getUTCDate());
	};

	/**
	 * Changes the sizes of the given jQuery elements to have the same size than their parents.
	 * This will be used to modify the half days as well as the row of the labels.
	 * The labels themselves are created using percentage values of their parents and don't
	 * need to be modified after having been created.
	 * @param {array} aElements Array of jQuery elements.
	 * @private
	 */
	OverlapCalendar.prototype._sizeElementsToParent = function (aElements) {
		var count = (aElements !== null && aElements.length) ? aElements.length : 0;
		var $el, $parent;
		var i, w, h;
		for (i = 0; i < count; i++) {
			$el = jQuery(aElements[i]);
			if ($el) {
				$parent = $el.parent();
				w = $parent.width();
				h = $parent.height();
				$el.width(w).height(h);
			}
		}
	};

	/**
	 * @param {string} key
	 * @param {array} aHalfDaysEvent
	 * @private
	 */
	OverlapCalendar.prototype._renderHalfDayCalendarEvent = function (key, aHalfDaysEvent) {
		var e = aHalfDaysEvent[0];
		var $div = jQuery.sap.byId(key);
		var t = e.getType();
		var b = (jQuery.inArray(t, this._typeWithBgImages) > -1 );
		$div.addClass("sapMeOverlapCalendarDayWithHalf");

		var $newStartDiv = jQuery("<div/>");
		$newStartDiv.addClass("sapMeOverlapCalendarHalfDay")
		.addClass("sapMeOverlapCalendarType" + t + "HalfDayStart");
		$div.append($newStartDiv);

		var $newEndDiv = null;
		if (aHalfDaysEvent.length > 1) {
			var e2 = aHalfDaysEvent[1];
			var t2 = e2.getType();
			$newEndDiv = jQuery("<div/>");
			$newEndDiv.addClass("sapMeOverlapCalendarHalfDay")
			.addClass("sapMeOverlapCalendarType" + t2 + "HalfDayEnd");
		} else if (b) {
			$newEndDiv = jQuery("<div/>");
			$newEndDiv.addClass("sapMeOverlapCalendarHalfDay")
			.addClass("sapMeOverlapCalendarTypeHalfDayEnd");
		}
		if ($newEndDiv !== null) {
			$div.append($newEndDiv);
		}

		this._sizeElementsToParent([$newStartDiv, $newEndDiv]);
	};

	/**
	 * Ensures the first and last date are properly defined
	 * @param {Date} startDate The start date
	 * @param {Date} endDate The end date
	 * @private
	 */
	OverlapCalendar.prototype._defineFirstAndLastDates = function (startDate, endDate) {
		if (this._lastDate == undefined) {
			this._lastDate = endDate;
		}
		if (this._dayIsAfter(endDate, this._lastDate)) {
			this._lastDate = endDate;
		}
		if (this._firstDate == undefined) {
			this._firstDate = startDate;
		}
		if (this._dayIsBefore(startDate, this._firstDate)) {
			this._firstDate = startDate;
		}
	};

	/**
	 * @param {number} index
	 * @param {event} oCalendarEvent
	 * @private
	 */
	OverlapCalendar.prototype._renderCalendarEvent = function (index, oCalendarEvent) {
		var startDate = this._createDateInDays(oCalendarEvent.getStartDay());
		var endDate = this._createDateInDays(oCalendarEvent.getEndDay());

		this._defineFirstAndLastDates(startDate, endDate);

		var currentDate = this._getFirstDateDisplayed();
		var lastDate = this._getLastDateDisplayed();

		if ((!this._dayIsBefore(endDate, currentDate)) && (!this._dayIsAfter(startDate, lastDate))) {
			var row = oCalendarEvent.getRow();

			var date = this._dayIsAfter(startDate, currentDate) ? startDate : currentDate;
			endDate = this._dayIsAfter(endDate, lastDate) ? lastDate : endDate;
			var nbOfDays = this._getDaysOffset(date, endDate) + 1;
			var nbOfDaysOffset = this._getDaysOffset(currentDate, date);
			var css = "sapMeOverlapCalendarType" + oCalendarEvent.getType();
			var $div;
			// save the id of the first day of the event
			var id;
			if (oCalendarEvent.getHalfDay() === true) {
				id = this._getDayId(date);
				var rowId = this._provideId(row, id);
				if (this._mHalfDays[rowId] == undefined) {
					this._mHalfDays[rowId] = [];
					$div = jQuery.sap.byId(rowId);
				}
				this._mHalfDays[rowId].push(oCalendarEvent);
			} else {
				while (!this._dayIsAfter(date, endDate)) {
					id = this._getDayId(date);
					this._addToDayOverlap(id);
					$div = jQuery.sap.byId(this._provideId(row, id));
					$div.addClass(css);
					date.setDate(date.getDate() + 1);
				}
			}
			if ($div != undefined) {
				this._createEventLabel(oCalendarEvent, date, nbOfDays, nbOfDaysOffset);
			}
		}
	};

	/**
	 * Creates a new label for one event
	 * @param {event} oCalendarEvent The calendar event.
	 * @param {date} date The date of the event
	 * @param {number} nbOfDays The number of days this event takes
	 * @param {number} nbOfDaysOffset Where the event starts in the displayed week
	 * @private
	 */
	OverlapCalendar.prototype._createEventLabel = function (oCalendarEvent, date, nbOfDays, nbOfDaysOffset) {
		// The type of the event, aka the text to display
		var type = oCalendarEvent.getTypeName();

		// create a label only if there is a text to display
		if (type && type.length > 0) {
			// the current row
			var row = oCalendarEvent.getRow();
			// The ID of the label to create
			var lblId = this._provideId(row, this._getDayId(date));

			var labelDivId = this._provideId("row", row, "lbls");
			// This is the jQuery object of the DIV containing all the labels
			var $labelDiv = jQuery.sap.byId(labelDivId);

			// Ensure the maximum width of the label's DIV is the calendar's width.
			// This DIV has a position:absolute CSS attribute, which seems to change the parent.
			// this.getWidth might return a width in percentage. The jQuery width is in pixels.
			$labelDiv.width(jQuery.sap.byId(this.getId()).width());

			var newLblId = this._provideId("lbl", lblId);

			// Do not recreate a label if there was already one created.
			if (jQuery.sap.byId(newLblId).length === 0) {
				var $lbl = jQuery("<label dir='Inherit' id='" + newLblId + "'>" + type + "</label>");
				$labelDiv.append($lbl);
				$lbl.addClass("sapMeOverlapCalendarTypeLbl sapMLabel");

				this._modifyLabel($lbl, nbOfDays, nbOfDaysOffset);
			}
		}
	};

	/**
	 * Sets various parameters on the given label: width, height.
	 * @param {object} $lbl jQuery object representing a label. Additional attributes will be added.
	 * @param {number} nbOfDays Length of the event.
	 * @param {number} nbOfDaysOffset Offset of the event, from the first displayed date of the calendar.
	 * @private
	 */
	OverlapCalendar.prototype._modifyLabel = function ($lbl, nbOfDays, nbOfDaysOffset) {
		var dayWidth = (100 / (this.getCalendar().getWeeksPerRow() * 7));
		var width = (nbOfDays * dayWidth);
		$lbl.width(width + "%");
		var offset = (nbOfDaysOffset * dayWidth);
		var m = (nbOfDaysOffset == 0 ) ? 1 : 0.5;
		var leftOffset = offset + "%";
		if (this._bRtl) {
			$lbl.css("right", leftOffset);
			$lbl.css("padding-right", m + "rem");
			$lbl.css("text-align", "right");
		} else {
			$lbl.css("left", leftOffset);
			$lbl.css("padding-left", m + "rem");
		}
	};

	/**
	 * @param {number} i
	 * @param {event} oCalendarEvent
	 * @private
	 */
	OverlapCalendar.prototype._parseCalendarEvent = function (i, oCalendarEvent) {
		var row = oCalendarEvent.getRow();
		if (row != -1) {
			if (oCalendarEvent.getName() != undefined) {
				if (this._aRows[row] == undefined && oCalendarEvent.getName() != "") {
					this._aRows[row] = oCalendarEvent.getName();
				}
			} else {
				jQuery.sap.log.debug("Calendar event has no name");
			}
		} else {
			jQuery.sap.log.debug("Invalid calendar event row");
		}
	};

	/**
	 * @param {number} index The row index
	 * @returns {sap.m.Label} The label of the row
	 * @private
	 */
	OverlapCalendar.prototype._getLabelForRow = function (index) {
		return this._getLabel(this._aRows[index], "nameLabels").addStyleClass("sapMeOverlapCalendarNameLbl");
	};

	/**
	 * @param {string} sText The text to display in the label
	 * @param {string} sAggregationName The name of the aggregation in which the label is added
	 * @returns {sap.m.Label} The label
	 * @private
	 */
	OverlapCalendar.prototype._getLabel = function (sText, sAggregationName) {
		var l = new sap.m.Label({text: sText});
		this.addAggregation(sAggregationName, l, true);
		return l;
	};


	return OverlapCalendar;

}, /* bExport= */ true);
