/*sap.gantt.axistime.AxisTimeCategory = {
	consecutive: "consecutive",
	discretive: "discretive"
};*/

sap.ui.define([
	"sap/ui/core/Element", "sap/gantt/misc/Utility", "sap/gantt/misc/Format", "sap/gantt/misc/RelativeTimeFormatter", "sap/gantt/config/TimeHorizon", "sap/ui/core/Locale"
], function (Element, Utility, Format, RelativeTimeFormatter, TimeHorizon, Locale) {
	"use strict";

	/**
	 * Creates and initializes a new AxisTimeStrategy.
	 * 
	 * @param {string} [sId] ID for the new AxisTimeStrategy, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new AxisTimeStrategy
	 * 
	 * @class 
	 * Base class for all zoom strategies. This base class defines basic properties and aggregations.
	 * 
	 * <p>This base class defines:
	 * <ul>
	 * 		<li>Basic properties and aggregations.</li>
	 * </ul>
	 * This class controls the zoom strategies and zoom rate in Gantt Chart.
	 * sap.gantt provides three basic implementations of <code>AxisTimeStrategy</code>:
	 * <ul>
	 * 		<li><code>sap.gantt.axistime.ProportionZoomStrategy</code> - A zoom strategy that provides the proportional change ability. Proportional change 
	 * ensures that Gantt Chart dynamically adjusts the zoom rate to be the best fit 
	 * for rendering shapes in the chart area. This strategy cannot be used by the Select control.</li>
	 * 		<li><code>sap.gantt.axistime.FullScreenStrategy</code> - A zoom strategy that sets the value of <code>totalHorizon</code> to the value of <code>visibleHorizon</code>. 
	 * When this strategy is implemented, <code>visibleHorizon</code> is fixed. Because of this, when you scroll the splitter to expand or shrink the chart area, 
	 * the value of <code>visibleHorizon</code> remains intact, which makes shapes look larger or smaller accordingly.
	 * Moreover, the horizontal scroll bar never appears and the zoom control is deactivated.</li>
	 * 		<li><code>sap.gantt.axistime.StepwiseZoomStrategy</code> - A zoom strategy that provides the stepwise change ability to control the zoom level of Gantt Chart, 
	 *         which is often used by the Select zoom control.</li>
	 * </ul>
	 * </p>
	 * 
	 * @extends sap.ui.core.Element
	 * @abstract
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.axistime.AxisTimeStrategyBase
	 */
	var AxisTimeStrategyBase = Element.extend("sap.gantt.axistime.AxisTimeStrategyBase", /* @lends sap.gantt.axistime.AxisTimeStrategyBase */ {
		metadata: {
			"abstract": true,
			properties: {
				/**
				 * Entire time span Gantt Chart can display in the chart area
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.TimeHorizon</code>. 
				 * Otherwise some properties you set may not function properly.
				 */
				totalHorizon: {type: "object", defaultValue: sap.gantt.config.DEFAULT_PLAN_HORIZON},
				/**
				 * Time span Gantt Chart currently displays in the chart area
				 * Specifies the start and end points of the time span that is visible in the chart area. <code>visibleHorizon</code> is less
				 * than or equal to <code>totalHorizon</code>.
				 * You can configure the time horizon using one of the following patterns:
				 * <ul>
				 * 		<li>[startTime, null]: Jump to the position where the start time is on the left edge of the screen without changing the zoom rate. When you 
				 * use this pattern, Gantt Chart calculates the endTime according to the current zoom rate.</li>
				 * 		<li>[null, endTime]: Jump to the position where the end time is on the right edge of the screen without changing the zoom rate.
				 *  When you use this pattern, Gantt Chart calculates the startTime accoridng to the current zoom rate.</li>
				 * 		<li>[startTime, endTime]: Every strategy has their own implementation to control misc.AxisTime.</li>
				 * </ul>
				 * 
				 * <b>Note:</b> Before you set visibleHorizon, you have to set totalHorizon first.
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.TimeHorizon</code>. 
				 * Otherwise some properties you set may not function properly.
				 */
				visibleHorizon: {type: "object", defaultValue: sap.gantt.config.DEFAULT_INIT_HORIZON},
				/**
				 * Defines granularity levels, labelling formats, and range of the time line. 
				 * <ul>
				 * <li>granularity level: time span between two neighboring vertical lines. Examples: 12 hours.</li>
				 * <li>labelling format: time formats for the upper row and lower row in the time line. These two rows do not have to share the same format. </li>
				 * <li>range: defines a certain length in pixel. Gantt Chart loops the granularity levels from the beginning and chooses the first granularity 
				 * level with the time span that consumes more than the defined length.</li>
				 * For example, if the current range is 90, Gantt Chart loops the granularity levels from the default initial granularity level 5min. If the 6hour 
				 * granularity level consumes 50 pixels, 12hour consumes 100 pixels, and 1Day consumes 200 pixels, the 12hour granularity level is selected as the 
				 * current granularity level as it's the first level with the time span that consumes more than 90 pixels.
				 * </ul>
				 *  
				 * The granularity level is a JSON object with the granularity as the key and some internal information such as formatting. 
				 * 
				 * Take the <code>"12hour"</code> granularity level for example.
				 * 	<ul>
				 * 		<li><code>"12hour":</code> - Granularity level ID.
				 * 			<ul>
				 * 				<li>
				 * 					<code>"innerInterval"</code> - Time interval between neighboring vertical lines is 12 hours. 
				 * 					<ul> 
				 * 						<li><code>"unit": sap.gantt.config.TimeUnit.day</code> - Time unit is day.</li>
				 * 						<li><code>"span": 1</code> - Span is 1.</li>
				 * 						<li><code>"range": 90</code> - This granularity level is selected as the current level if 12 hours is the first time span that 
				 *                                 consumes more than 90 pixels to be displayed in the chart area.</li>
				 * 					</ul>
				 * 				</li>
				 * 				<li>
				 * 					<code>largeInterval</code> - Time interval of the upper row in the timeline is 1 day. Formatted in the locale language with the format string. 
				 *                                               This zoom level implements an interval larger than the interval in the default zoom level.
				 * 					<ul>
				 * 						<li><code>"unit": sap.gantt.config.TimeUnit.day</code> Time unit is day. </li>
				 * 						<li><code>"span": 1</code> - Time span is 1.</li>
				 * 						<li><code>"format": "cccc dd.M.yyyy"</code> - Formats the string in CLDR date/time symbols.</li>
				 * 						<li><code>"pattern": "yyyy"</code> -Aa data pattern in LDML format. This setting takes precedence over the setting of "format".</li>
				 * 						<li><code>"relativeTime": true</code> - Specifies whether or not to use relative time mode, which defaults to "false". When you set this property to "true", Gantt Chart ignores the values of "format" and "pattern". 
				 *                                In this mode, if the largeInterval or the smallInterval of the timeline option uses the "sap.gantt.config.TimeUnit.day" or "sap.gantt.config.TimeUnit.week" unit, you must set the span to 1.</li>
				 * 						<li><code>"relativeTimePrefix": "Day"</code> - A string that specifies the prefix displayed before every relative time point. For example, if you set this property to "Day", the relative timeline will display "Day 1", "Day 2", "Day 3", and so on so forth.</li>
				 * 					</ul>
				 * 				</li>
				 * 				<li>
				 * 					<code>smallInterval</code> - Time interval of the lower row in the timeline is 12 hours. Formatted in the locale language with the format string. 
				 *                                               This zoom level implements an interval the same as the that of the default zoom level.
				 * 					<ul>
				 * 						<li><code>"unit": sap.gantt.config.TimeUnit.hour</code> - Time unit is hour.</li>
				 * 						<li><code>"span": 2</code> - Time span is 2.</li>
				 * 						<li><code>"format": "HH:mm"</code> - Formats the string in CLDR date/time symbols.</li>
				 * 						<li><code>"relativeTime": false</code>
				 * 					</ul>
				 * 				</li>
				 * 			</ul>
				 * 		</li>
				 * 	</ul>
				 * 
				 * The current granularity setting provides the following values in the default time line option:<br/>
				 * <code>5min</code>, <code>10min</code>, <code>15min</code>, <code>30min</code>,<br/>
				 * <code>1hour</code>, <code>2hour</code>, <code>4hour</code>, <code>6hour</code>, <code>12hour</code>,<br/>
				 * <code>1day</code>, <code>2day</code>, <code>4day</code>,<br/>
				 * <code>1week</code>, <code>2week</code>,<br/>
				 * <code>1month</code>, <code>2month</code>, <code>4month</code>, <code>6month</code>,<br/>
				 * <code>1year</code>, <code>2year</code>, <code>5year</code>.
				 * We recommend that you use the default time line option object instead of creating one by yourself. Because the default time line option object has been precisely calculated and it fits most use cases.
				 * If the default time line option is not the best-fit, you can select a time line option from the range (coarsestTimeLineOption, 5 years to finestTimeLineOption, 5 minutes) listed above.
				 * Note that creating a new time line option object is a complex process. Moreover, the extra effort may not serve significant purposes and is likely to cause text overlay in the Gantt Chart header.
				 */
				timeLineOptions: {type: "object"},
				/**
				 * Current time line option of AxisTimeStrategy
				 */
				timeLineOption: {type: "object"},
				/**
				 * Coarsest time line option of AxisTimeStrategy
				 */
				coarsestTimeLineOption: {type: "object"},
				/**
				 * Finest time line option of AxisTimeStrategy
				 */
				finestTimeLineOption: {type: "object"},
				/**
				 * Total number of zoom levels on your zoom control. For example, the step count of Slider control and the item count of Select control.
				 */
				zoomLevels: {type: "int", defaultValue: 10},
				/**
				 * Current zoom level of your Gantt chart with 0 representing the initial zoom level. The value of this property must be lower than that of totalZoomLevels.
				 */
				zoomLevel: {type: "int", defaultValue: 0},
				/**
				 * Configures the calendar type for the Gantt Chart time label.
				 * We recommend that you set the type of this argument to <code>sap.ui.core.CalendarType</code>. 
				 * Otherwise some properties you set may not function properly.
				 */
				calendarType: {type: "string", defaultValue: sap.ui.core.CalendarType.Gregorian},
				/**
				 * Configures the locale of the Gantt Chart time label.
				 * We recommend that you set the type of this argument to <code>sap.ui.core.Locale</code>.
				 * Otherwise some properties you set may not function properly.
				 */
				locale: {type: "object"},
				/**
				 * Specifies the mouse wheel zooming type, which determines the zoom granularity
				 */
				mouseWheelZoomType: {type: "sap.gantt.MouseWheelZoomType", defaultValue: sap.gantt.MouseWheelZoomType.FineGranular}
			},
			aggregations: {
				_axisTime: {type: "sap.gantt.misc.AxisTime", multiple: false, visibility: "hidden"}
			}
		}
	});

	AxisTimeStrategyBase.prototype.applySettings = function () {
		Element.prototype.applySettings.apply(this, arguments);
		this.calZoomBase();
		return this;
	};

	/**
	 * Check if this axis time strategy enable period zoom

	 * @return {boolean} Boolean value shows whether this axis time strategy enable period zoom
	 * @private
	 */
	AxisTimeStrategyBase.prototype.isTimePeriodZoomEnabled = function () {
		return true;
	};

	AxisTimeStrategyBase.prototype.setVisibleHorizon = function (oVisibleHorizon) {
		this.setProperty("visibleHorizon", this._completeTimeHorizon(oVisibleHorizon), true);
		return this;
	};

	AxisTimeStrategyBase.prototype._completeTimeHorizon = function (oVisibleHorizon) {
		var oRetVal = new TimeHorizon({
				startTime: this.getVisibleHorizon().getStartTime(),
				endTime: this.getVisibleHorizon().getEndTime()
			});

		if (oVisibleHorizon) {
			var sStartTime = oVisibleHorizon.getStartTime(),
				sEndTime = oVisibleHorizon.getEndTime(),
				oDate,
				oTotalStartDate = Format.abapTimestampToDate(this.getTotalHorizon().getStartTime()),
				oTotalEndDate = Format.abapTimestampToDate(this.getTotalHorizon().getEndTime());

			if (!sStartTime && !sEndTime) { // illegal case
				return oRetVal;
			}

			var iTimeSpan;

			if (this._oZoom && this._oZoom.base && this._oZoom.base.scale !== undefined && this._nGanttVisibleWidth !== undefined && this.getAxisTime()){
				var nCurrentZoomRate = this.getAxisTime().getZoomRate();
				var nCurrentScale = this._oZoom.base.scale/nCurrentZoomRate;
				iTimeSpan = this._nGanttVisibleWidth * nCurrentScale;
			} else {
				iTimeSpan = Format.abapTimestampToDate(oRetVal.getEndTime()).getTime() -
							Format.abapTimestampToDate(oRetVal.getStartTime()).getTime();
			}

			if (!sStartTime) {
				oDate = Format.abapTimestampToDate(sEndTime);
				oDate.setTime(oDate.getTime() - iTimeSpan);
				if (oDate < oTotalStartDate) {
					oDate = oTotalStartDate;
					sEndTime = Format.dateToAbapTimestamp(new Date(oTotalStartDate + iTimeSpan));
				}
				sStartTime = Format.dateToAbapTimestamp(oDate);
			} else if (!sEndTime) {
				oDate = Format.abapTimestampToDate(sStartTime);
				oDate.setTime(oDate.getTime() + iTimeSpan);
				if (oDate > oTotalEndDate) {
					oDate = oTotalEndDate;
					sStartTime = Format.dateToAbapTimestamp(new Date(oTotalEndDate - iTimeSpan));
				}
				sEndTime = Format.dateToAbapTimestamp(oDate);
			} else {
				oDate = Format.abapTimestampToDate(sStartTime);
				if (oDate < oTotalStartDate) {
					sStartTime = this.getTotalHorizon().getStartTime();
				}
				oDate = Format.abapTimestampToDate(sEndTime);
				if (oDate > oTotalEndDate) {
					sEndTime = this.getTotalHorizon().getEndTime();
				}
			}
			oRetVal.setStartTime(sStartTime);
			oRetVal.setEndTime(sEndTime);
		}

		return oRetVal;
	};

	/**
	 * Creates an AixsTime instance to be used in Gantt Chart.
	 * If you build your own AxisTimeStrategy, you may need to implement this method and return your own AxisTime.
	 * 
	 * @param {sap.gantt.config.Locale} oLocale Locale configuration passed from GanttChart
	 * @public
	 */
	AxisTimeStrategyBase.prototype.createAxisTime = function (oLocale) {
		var oTimeLineOption = this.getTimeLineOption(),
			oVisibleHorizon = this.getVisibleHorizon(),
			oTotalHorizon = this.getTotalHorizon();

		if (!Utility.judgeTimeHorizonValidity(oVisibleHorizon, oTotalHorizon)){
			this.setProperty("visibleHorizon", oTotalHorizon, true);

			jQuery.sap.log.warning("Visible horizon is not in total horizon, so convert visible horizon to total horizon",
				null,
				"sap.gantt.axistime.AxisTimeStrategyBase.createAxisTime()");
		}

		var oHorizonStartTime = Format.getTimeStampFormatter().parse(oTotalHorizon.getStartTime());
		var oHorizonEndTime = Format.getTimeStampFormatter().parse(oTotalHorizon.getEndTime());
		var nHorizonTimeRange = oHorizonEndTime.valueOf() - oHorizonStartTime.valueOf();

		var nUnitTimeRange = jQuery.sap.getObject(oTimeLineOption.innerInterval.unit)
				.offset(oHorizonStartTime, oTimeLineOption.innerInterval.span).valueOf() - oHorizonStartTime.valueOf();

		var oAxisTime = new sap.gantt.misc.AxisTime(
			[oHorizonStartTime, oHorizonEndTime],
			[0, Math.ceil(nHorizonTimeRange * oTimeLineOption.innerInterval.range / nUnitTimeRange)],
			1, null, null,
			oLocale, this);

		this.setAggregation("_axisTime", oAxisTime, true);
	};

	/**
	 * In the shape drawing process, Gantt Chart calls this function to get the latest information about Stop and AxisTime. 
	 * Moreover, when you run this function, AxisTimeStrategy updates the GanttChart status such as the zoom rate of AxisTime.
	 * 
	 * @param {int} nClientWidth Width of the visible area in Gantt Chart
	 * @return {object} The status plain object about AxisTimeStrategy. The return contains two properties <code>zoomLevelChanged</code> and <code>axisTimeChanged</code>.
	 * @public
	 */
	AxisTimeStrategyBase.prototype.syncContext = function (nClientWidth) {
		var oRetVal = {
				zoomLevelChanged : false,
				axisTimeChanged : false
			};
		return oRetVal;
	};

	/**
	 * This is the delegate function of the zoom control event, such as the zoom in or zoom out event.
	 * You must implement your zoom level change logic.
	 * @param {object} oStopInfo Zoom stop information, which contains the parameters <code>key</code> and <code>text</code>.
	 * @public
	 */
	AxisTimeStrategyBase.prototype.updateStopInfo = function (oStopInfo) {
		return null;
	};

	AxisTimeStrategyBase.prototype.setTotalHorizon = function (oTotalHorizon, bSuppressInvalidate) {
		if (typeof bSuppressInvalidate === "undefined") {
			bSuppressInvalidate = true;
		}
		this.setProperty("totalHorizon", oTotalHorizon, bSuppressInvalidate);
		return this;
	};

	/**
	 * Gets the time label formatter for Gantt Chart to draw the top row in the timeline.
	 * 
	 * @return {sap.ui.core.format.DateFormat} Date formatter
	 * @public
	 */
	AxisTimeStrategyBase.prototype.getUpperRowFormatter = function () {
		var oTimeLineOption = this.getTimeLineOption();
		var oLargeInterval = oTimeLineOption.largeInterval;
		var oFormatter;
		if (oLargeInterval.relativeTime){
			var oTotalHorizonStartTime = Format.abapTimestampToDate(this.getTotalHorizon().getStartTime());
			oFormatter = new RelativeTimeFormatter(oTotalHorizonStartTime, oLargeInterval.unit, oLargeInterval.relativeTimePrefix);
		} else {
			var oCalendarType = this.getCalendarType(),
			oCoreLocale = this.getLocale() ? this.getLocale() :
				new Locale(sap.ui.getCore().getConfiguration().getLanguage().toLowerCase());

			oFormatter = sap.ui.core.format.DateFormat.getDateTimeInstance({
				format: oLargeInterval.format,
				pattern: oLargeInterval.pattern,
				style: oLargeInterval.style,
				calendarType: oTimeLineOption.calendarType || oCalendarType
			}, oLargeInterval.locale ? new Locale(oLargeInterval.locale) : oCoreLocale);
		}

		return oFormatter;
	};

	/**
	 * Gets the time label formatter for Gantt Chart to draw the lower row in the timeline.
	 * 
	 * @return {sap.ui.core.format.DateFormat} Date formatter
	 * @public
	 */
	AxisTimeStrategyBase.prototype.getLowerRowFormatter = function () {
		var oTimeLineOption = this.getTimeLineOption();
		var oSmallInterval = oTimeLineOption.smallInterval;
		var oFormatter;
		if (oSmallInterval.relativeTime){
			var oTotalHorizonStartTime = Format.abapTimestampToDate(this.getTotalHorizon().getStartTime());
			oFormatter = new RelativeTimeFormatter(oTotalHorizonStartTime, oSmallInterval.unit, oSmallInterval.relativeTimePrefix);
		} else {
			var oCalendarType = this.getCalendarType(),
			oCoreLocale = this.getLocale() ? this.getLocale() :
				new Locale(sap.ui.getCore().getConfiguration().getLanguage().toLowerCase());

			oFormatter = sap.ui.core.format.DateFormat.getDateTimeInstance({
				format: oSmallInterval.format,
				pattern: oSmallInterval.pattern,
				style: oSmallInterval.style,
				calendarType: oCalendarType
			}, oSmallInterval.locale ? new Locale(oSmallInterval.locale) : oCoreLocale);
		}
		return oFormatter;
	};

	/**
	 * Checks whether the current level is hour sensitive
	 * @private
	 */
	AxisTimeStrategyBase.prototype.isLowerRowTickHourSensitive = function () {
		var oTimeLineOption = this.getTimeLineOption();
		var sUnit = oTimeLineOption.innerInterval.unit;
		var sSpan = oTimeLineOption.innerInterval.span;

		var oStartTime = Format.getTimeStampFormatter().parse("20000101000000");
		var oEndTime = jQuery.sap.getObject(sUnit).offset(oStartTime, sSpan);

		return (oEndTime.getTime() - oStartTime.getTime()) <= 60 * 60 * 1000; //if span is equal or less than 1h
	};

	/**
	 * Gets the AxiaTime instance in AxisTimeStrategy
	 * @private
	 */
	AxisTimeStrategyBase.prototype.getAxisTime = function () {
		return this.getAggregation("_axisTime");
	};

	/**
	 * Fire the redraw request to Gantt Chart
	 * @private
	 */
	AxisTimeStrategyBase.prototype.fireRedrawRequest = function (bForceUpdated, sReasonCode, oValueBeforeChange) {
		this.fireEvent("_redrawRequest", {forceUpdate: bForceUpdated, reasonCode: sReasonCode, valueBeforeChange: oValueBeforeChange});
	};
	
	/**
	 * Update the Gantt visible width
	 * @private
	 */
	AxisTimeStrategyBase.prototype.updateGanttVisibleWidth = function (nWidth) {
		this._nGanttVisibleWidth = nWidth;
	};

	/**
	 * Get the Gantt visible width
	 * @private
	 */
	AxisTimeStrategyBase.prototype.getGanttVisibleWidth = function () {
		return this._nGanttVisibleWidth;
	};

	/**
	 * @protected
	 */
	AxisTimeStrategyBase.prototype.calZoomScale = function (sUnit, iSpan, iRange) {
		// get granularity objects
		var oStart = Format.getTimeStampFormatter().parse("20000101000000");
		// calculate base rate scale
		var oEnd = jQuery.sap.getObject(sUnit).offset(oStart, iSpan);
		return this.calZoomScaleByDate(oStart, oEnd, iRange);
	};
	
	/**
	 * @protected
	 */
	AxisTimeStrategyBase.prototype.calZoomScaleByDate = function (oStart, oEnd, iRange) {
		return (oEnd.valueOf() - oStart.valueOf()) / iRange;
	};
	
	/**
	 * @protected
	 * @returns {boolean} whether this._oZoom.base is generated
	 */
	AxisTimeStrategyBase.prototype.calZoomBase = function () {
		var oBaseTimeLineOption = this.getTimeLineOption() || this.getFinestTimeLineOption();

		if (oBaseTimeLineOption) {
			var fScale = this.calZoomScale(
					oBaseTimeLineOption.innerInterval.unit,
					oBaseTimeLineOption.innerInterval.span,
					oBaseTimeLineOption.innerInterval.range
			);

			this._oZoom = {
					base: {
						timeLineOption: oBaseTimeLineOption,
						rate: 1,
						scale: fScale
					}
				};
			return true;
		}
		return false;
	};

	/**
	 * update visible horizon for mouse wheel zoom according to configured zoom type
	 * @param {Date} oTimeAtZoomCenter the time where mouse pointer located during the zooming
	 * @param {number} iScrollDelta the range of each mouse wheel scrolling
	 * @protected
	 */
	AxisTimeStrategyBase.prototype.updateVisibleHorizonOnMouseWheelZoom = function(oTimeAtZoomCenter, iScrollDelta) {
		//determin zoomin or zoomout
		var bZoomIn = iScrollDelta < 0;
		var iZoomFactor =  Math.round(Math.abs(iScrollDelta) / 100);

		var sMouseWheelZoomType = this.getMouseWheelZoomType();
		if (sMouseWheelZoomType === sap.gantt.MouseWheelZoomType.FineGranular) {
			this.updateVisibleHorizonOnFineGranularMouseWheelZoom(oTimeAtZoomCenter, bZoomIn, iZoomFactor);
		} else if (sMouseWheelZoomType === sap.gantt.MouseWheelZoomType.Stepwise) {
			this.updateVisibleHorizonOnStepWiseMouseWheelZoom(oTimeAtZoomCenter, bZoomIn, iZoomFactor);
		}
	};

	/**
	 * Calculate and set new visible horizon for fine granular mouse wheel zoom
	 * @param {Date} oTimeAtZoomCenter the time where mouse pointer located during the zooming
	 * @param {boolean} bZoomIn true if zoom in, false if zoom out
	 * @param {number} iZoomFactor the scroll range of each mouse wheel scrolling / 100, serves as a coefficient when calculating zoom delta
	 * @protected
	 */
	AxisTimeStrategyBase.prototype.updateVisibleHorizonOnFineGranularMouseWheelZoom = function(oTimeAtZoomCenter, bZoomIn, iZoomFactor) {
		//change one time unit of the innerInterval for each zoom
		var oVisibleHorizon = this.getVisibleHorizon();
		var oVisibleHorizonStartTime = Format.abapTimestampToDate(oVisibleHorizon.getStartTime());

		var oTimeLineOption = this.getTimeLineOption();
		var nZoomDelta = jQuery.sap.getObject(oTimeLineOption.innerInterval.unit)
							.offset(oVisibleHorizonStartTime, iZoomFactor * oTimeLineOption.innerInterval.span).getTime() - oVisibleHorizonStartTime.getTime();

		var iZoomIncrementSign = bZoomIn ? -1 : 1;
		var oNewVisibleHorizon = this.calVisibleHorizonByDelta(iZoomIncrementSign * nZoomDelta, oTimeAtZoomCenter);

		this.setVisibleHorizon(oNewVisibleHorizon);
	};

	/**
	 * Calculate and set new visible horizon for step-wise mouse wheel zoom
	 * @param {Date} oTimeAtZoomCenter the time where mouse pointer located during the zooming
	 * @param {boolean} bZoomIn true if zoom in, false if zoom out
	 * @param {number} iZoomFactor the scroll range of each mouse wheel scrolling / 100, serves as a coefficient when calculating zoom delta
	 * @protected
	 */
	AxisTimeStrategyBase.prototype.updateVisibleHorizonOnStepWiseMouseWheelZoom = function(oTimeAtZoomCenter, bZoomIn, iZoomFactor) {
		var iZoomIncrementSign = bZoomIn ? -1 : 1;
		var iZoomLevel = this.getZoomLevel() - iZoomIncrementSign * iZoomFactor;
		if (iZoomLevel > -1 && iZoomLevel < this.getZoomLevels()) {
			if (this._aZoomRate[iZoomLevel] && !Utility.floatEqual(this._aZoomRate[iZoomLevel], this._oZoom.rate)) {
				var nZoomRate = this._aZoomRate[iZoomLevel];
				var oNewVisibleHorizon = this.calVisibleHorizonByRate(nZoomRate, oTimeAtZoomCenter);
				this.setVisibleHorizon(oNewVisibleHorizon);
			}
		}
	};

	/**
	 * Calculate new visible horizon according to specified zoom center and zoom rate
	 * @param {number} nZoomRate the rate for new visible horizon
	 * @param {Date} [oAnchorTime] optional the time where the zoom center located, if not provided, take the center of current visible horizon as the zoom center
	 * @return {object} a new visible horizon
	 * @protected
	 */
	AxisTimeStrategyBase.prototype.calVisibleHorizonByRate = function(nZoomRate, oAnchorTime) {
		var nTimeSpanDelta = 0;
		if (this._oZoom && this._oZoom.base && this._oZoom.base.scale !== undefined && this._nGanttVisibleWidth !== undefined){
			var oVisibleHorizonStartTime = Format.abapTimestampToDate(this.getVisibleHorizon().getStartTime());
			var oVisibleHorizonEndTime = Format.abapTimestampToDate(this.getVisibleHorizon().getEndTime());

			var nCurrentTimeSpan = oVisibleHorizonEndTime.getTime() - oVisibleHorizonStartTime.getTime();
			//Calculate new time span according to specified zoom rate
			var nScale = this._oZoom.base.scale/nZoomRate;
			var nNewTimeSpan = this._nGanttVisibleWidth * nScale;
			nTimeSpanDelta = nNewTimeSpan - nCurrentTimeSpan;
		}
		return this.calVisibleHorizonByDelta(nTimeSpanDelta, oAnchorTime);
	};

	/**
	 * Calculate new visible horizon according to specified zoom center and zoom delta
	 * @param {number} nTimeSpanDelta the delta of visible horizon time range in MS unit
	 * @param {Date} [oAnchorTime] optional the time where the zoom center located, if not provided, take the center of current visible horizon as the zoom center
	 * @return {object} a new visible horizon
	 * @protected
	 */
	AxisTimeStrategyBase.prototype.calVisibleHorizonByDelta = function(nTimeSpanDelta, oAnchorTime) {
		var oVisibleHorizon = this.getVisibleHorizon();
		if (nTimeSpanDelta !== 0) {
			//calculate the time in ms for current visible horizon start time and time at zoom center
			var nVisibleHorizonStartTimeInMs = Format.abapTimestampToDate(oVisibleHorizon.getStartTime()).getTime();
			var nVisibleHorizonEndTimeInMs = Format.abapTimestampToDate(oVisibleHorizon.getEndTime()).getTime();
			var nVisibleTimeRange = nVisibleHorizonEndTimeInMs - nVisibleHorizonStartTimeInMs;

			var nAnchorTimeInMs = 0;
			var nLeftTimeDeltaPercentage, nRightTimeDeltaPercentage;

			var nTotalHorizonStartTimeInMs = Format.abapTimestampToDate(this.getTotalHorizon().getStartTime()).getTime();
			var nTotalHorizonEndTimeInMs = Format.abapTimestampToDate(this.getTotalHorizon().getEndTime()).getTime();
			//if start time or end time is at the boundary and try to do zoom out
			if (nTimeSpanDelta > 0 && nVisibleHorizonStartTimeInMs <= nTotalHorizonStartTimeInMs) {
				nLeftTimeDeltaPercentage = 0;
				nRightTimeDeltaPercentage = 1;
				nAnchorTimeInMs = nTotalHorizonStartTimeInMs;
			} else if (nTimeSpanDelta > 0 && nVisibleHorizonEndTimeInMs >= nTotalHorizonEndTimeInMs) {
				nLeftTimeDeltaPercentage = 1;
				nRightTimeDeltaPercentage = 0;
				nAnchorTimeInMs = nTotalHorizonEndTimeInMs;
			} else {
				//if no anchor time is provided, take the middle time of current visible horizon as the anchor
				if (!oAnchorTime) {
					nAnchorTimeInMs = nVisibleHorizonStartTimeInMs +  nVisibleTimeRange / 2;
				} else {
					nAnchorTimeInMs = oAnchorTime.getTime();
				}
				//calculate the percentage of the left and right side according to the zoom center
				nLeftTimeDeltaPercentage = (nAnchorTimeInMs - nVisibleHorizonStartTimeInMs) / nVisibleTimeRange;
				nRightTimeDeltaPercentage = 1 - nLeftTimeDeltaPercentage;
			}

			//new time in ms for visible horizon
			var nNewVisibleTimeRange = nVisibleTimeRange + nTimeSpanDelta;
			var nNewStartTimeInMs = nAnchorTimeInMs - nLeftTimeDeltaPercentage * nNewVisibleTimeRange;
			var nNewEndTimeInMs = nAnchorTimeInMs + nRightTimeDeltaPercentage * nNewVisibleTimeRange;

			var oNewStartTime, oNewEndTime;
			if (nNewStartTimeInMs <= nTotalHorizonStartTimeInMs) {
				oNewStartTime = this.getTotalHorizon().getStartTime();
			} else {
				oNewStartTime = new Date();
				oNewStartTime.setTime(nNewStartTimeInMs);
			}
			if (nNewEndTimeInMs >= nTotalHorizonEndTimeInMs) {
				oNewEndTime = this.getTotalHorizon().getEndTime();
			} else {
				oNewEndTime = new Date();
				oNewEndTime.setTime(nNewEndTimeInMs);
			}

			return new TimeHorizon({
				startTime: oNewStartTime,
				endTime: oNewEndTime
			});
		}
		return oVisibleHorizon;
	};
	
	/**
	 * Calculates the middle date of the given two dates.
	 * @param {date} dStart the start date
	 * @param {date} dEnd the end date
	 * @returns {date} the middle date
	 * @protected
	 */
	AxisTimeStrategyBase.prototype.calMiddleDate = function(dStart, dEnd) {
		return new Date(dStart.getTime() + (dEnd.getTime() - dStart.getTime()) / 2);
	};
	return AxisTimeStrategyBase;
}, true);