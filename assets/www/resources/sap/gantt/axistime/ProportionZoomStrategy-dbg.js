sap.gantt.axistime.ProportionTimeLineOptions = sap.gantt.config.DEFAULT_TIME_ZOOM_STRATEGY;

sap.ui.define([
	"./AxisTimeStrategyBase","sap/gantt/misc/Utility", "sap/gantt/misc/Format", "sap/ui/core/Locale", "sap/ui/core/Core",
	"sap/gantt/config/TimeHorizon"
], function (AxisTimeStrategyBase, Utility, Format, Locale, Core, TimeHorizon) {
	"use strict";

	/**
	 * Creates and initializes a ProportionZoomStrategy.
	 *
	 * @param {string} [sId] ID for the new AxisTimeStrategy, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new AxisTimeStrategy
	 *
	 * @class
	 * ProportionZoomStrategy
	 *
	 * <p>
	 * A zoom strategy that provides the proportional change ability. Proportional change
	 * ensures that Gantt Chart dynamically adjusts the zoom rate to be the best fit
	 * for rendering shapes in the chart area. This strategy cannot be used by the Select control.
	 * </p>
	 *
	 * @extends sap.gantt.axistime.AxisTimeStrategyBase
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @constructor
	 * @public
	 * @alias sap.gantt.axistime.ProportionZoomStrategy
	 */
	var ProportionZoomStrategy = AxisTimeStrategyBase.extend("sap.gantt.axistime.ProportionZoomStrategy");

	ProportionZoomStrategy.prototype.init = function () {
		this._aZoomRate = new Array(10);
		this.setProperty("coarsestTimeLineOption", sap.gantt.axistime.ProportionTimeLineOptions["1month"], true);
		this.setProperty("finestTimeLineOption", sap.gantt.axistime.ProportionTimeLineOptions["5min"], true);
		this.setProperty("timeLineOptions", sap.gantt.axistime.ProportionTimeLineOptions, true);
		this.setProperty("timeLineOption", sap.gantt.axistime.ProportionTimeLineOptions["4day"], true);
		this.setProperty("zoomLevel", 0, true);
		this.setProperty("zoomLevels", 10, true);
	};

	ProportionZoomStrategy.prototype.setVisibleHorizon = function (oVisibleHorizon) {
		if (!oVisibleHorizon.getStartTime() && !oVisibleHorizon.getEndTime()){
			this._bHorizontalScroll = false;
		} else if (!oVisibleHorizon.getStartTime() || !oVisibleHorizon.getEndTime()){
			this._bHorizontalScroll = true;
		} else {
			this._bHorizontalScroll = false;
		}
		//redraw will call syncContent(), in there rate will be updated
		var oLastVisibleHorizon = this.getVisibleHorizon();
		AxisTimeStrategyBase.prototype.setVisibleHorizon.apply(this, arguments);
		this.fireRedrawRequest(false, "visibleHorizonUpdated", oLastVisibleHorizon);
		return this;
	};

	ProportionZoomStrategy.prototype.setTotalHorizon = function (oTotalHorizon) {
		AxisTimeStrategyBase.prototype.setTotalHorizon.apply(this, arguments);
		if (this.getAxisTime()){
			this.calZoomBase();
			this.createAxisTime(this.getAxisTime().getLocale());
			this.fireRedrawRequest(true, "totalHorizonUpdated");
		}
		return this;
	};

	/*
	 * @protected
	 */
	ProportionZoomStrategy.prototype.updateStopInfo = function (oStopInfo) {
		this.setZoomLevel(oStopInfo.index);
		return this;
	};

	ProportionZoomStrategy.prototype.setZoomLevel = function (iZoomLevel) {
		if (iZoomLevel >= 0 && iZoomLevel !== this.getZoomLevel()) {
			this.setProperty("zoomLevel", iZoomLevel, true);

			if (this._aZoomRate[iZoomLevel]) {
				var oNewVisibleHorizon = this.calVisibleHorizonByRate(this._aZoomRate[iZoomLevel]);
				this.setVisibleHorizon(oNewVisibleHorizon);
			}
		}
		return this;
	};

	ProportionZoomStrategy.prototype.setZoomLevels = function (iZoomLevels) {
		this.setProperty("zoomLevels", iZoomLevels, true);

		if (iZoomLevels > 1) {
			this._aZoomRate = new Array(iZoomLevels);
		} else {
			this._aZoomRate = [1];
		}
		this._updateZoomRateOnStops();
		return this;
	};

	ProportionZoomStrategy.prototype.syncContext = function (nClientWidth) {
		var bAxisTimeNeedChange = false,
			bZoomBoundaryConditionChange = false;

		var oRetVal = {
			zoomLevelChanged : false,
			axisTimeChanged : false
		};

		var iOriginalVisibleWidth = this.getGanttVisibleWidth();
		if ((iOriginalVisibleWidth !== undefined) && (nClientWidth !== iOriginalVisibleWidth)){ //in situation move Gantt resize
			//when Gantt resize, we can't change zoom rate
			this._updateVisibleHorizon(nClientWidth);
		}

		var oDeterminedByStrategy = this._determineZoomBoundaryByStrategy();
		var oDeterminedByChartWidth = this._determineZoomRateByChartWidth(nClientWidth);

		if (oDeterminedByChartWidth) {

			this.updateGanttVisibleWidth(nClientWidth);

			var fLastMinRate = this._oZoom.minRate || -1;
			this._oZoom.minRate = Math.max(oDeterminedByStrategy.minRate,oDeterminedByChartWidth.minRate) ||
				oDeterminedByStrategy.minRate;

			var fLastMaxRate = this._oZoom.maxRate || -1;
			this._oZoom.maxRate = oDeterminedByStrategy.maxRate;

			var fLastRate = this._oZoom.rate || -1;

			bZoomBoundaryConditionChange =  
				!Utility.floatEqual(fLastMinRate, this._oZoom.minRate) ||
				!Utility.floatEqual(fLastMaxRate, this._oZoom.maxRate);

			if (bZoomBoundaryConditionChange) {
				this._updateZoomRateOnStops();
				this._adjustRateByBoundary();
			}

			if (oDeterminedByChartWidth.suitableRate && !this._bHorizontalScroll) {
				this._oZoom.rate = oDeterminedByChartWidth.suitableRate;
				this._adjustRateByBoundary();
			}

			var iLastZoomLevel = this.getZoomLevel(),
				iZoomLevel = this._calcZoomLevelFromZoomRate(this._oZoom.rate);

			var bZoomLevelChanged = iLastZoomLevel !== iZoomLevel;
			if (bZoomLevelChanged) {
				//this method is mainly called in init period of TimeAxisStrategy, 
				//and init this._oZoom.rate always not equal this._aZoomRate[iZoomLevel], so if call setZoomLevel(iZoomLevel)
				//will cause wrong suitable rate.
				this.setProperty("zoomLevel", iZoomLevel, true);
			}
			oRetVal.zoomLevelChanged = bZoomLevelChanged;

			bAxisTimeNeedChange = !Utility.floatEqual(fLastRate, this._oZoom.rate);
			if (bAxisTimeNeedChange) {
				this.getAxisTime().setZoomRate(this._oZoom.rate);
				this._updateTimeLineOption();
			}
			oRetVal.axisTimeChanged = bAxisTimeNeedChange;
		}

		return oRetVal;
	};

	ProportionZoomStrategy.prototype._updateVisibleHorizon = function (nClientWidth) {
		var oOriginalVisibleHorizon = this.getVisibleHorizon();
		var iOriginalVisibleWidth = this.getGanttVisibleWidth();
		var oCurrentVisibleHorizon = Utility.calculateHorizonByWidth(oOriginalVisibleHorizon, iOriginalVisibleWidth, nClientWidth);
		AxisTimeStrategyBase.prototype.setVisibleHorizon.call(this, oCurrentVisibleHorizon);
	};

	ProportionZoomStrategy.prototype._adjustRateByBoundary = function () {
		if(this._oZoom.rate) {
			this._oZoom.rate = Math.max(this._oZoom.rate, this._oZoom.minRate);
			this._oZoom.rate = Math.min(this._oZoom.rate, this._oZoom.maxRate);
		}
	};

	ProportionZoomStrategy.prototype._updateZoomRateOnStops = function () {
		if (this._oZoom && this._oZoom.maxRate && this._oZoom.minRate) {
			var fMaxRate = this._oZoom.maxRate,
				fMinRate = this._oZoom.minRate,
				iSteps = this.getZoomLevels();

			this._oLog = {};
			this._oLog.fMax = Math.log(fMaxRate);
			this._oLog.fMin = Math.log(fMinRate);
			this._oLog.fStep = (this._oLog.fMax - this._oLog.fMin) / iSteps;
			
			if (iSteps > 0) {
				for (var i = 0; i < iSteps; i++) {
					this._aZoomRate[i] = Math.pow(Math.E, this._oLog.fMin + this._oLog.fStep * i);
				}
			} else {
				this._aZoomRate[0] = 1;
			}
		}
	};

	ProportionZoomStrategy.prototype._calcZoomLevelFromZoomRate = function (fRate) {
		if (this._oZoom && this._oLog && fRate) {
			return Math.round((Math.log(fRate) - this._oLog.fMin) / this._oLog.fStep);
		}
	};

	ProportionZoomStrategy.prototype._determineZoomBoundaryByStrategy = function () {
		if (this._oZoom && this._oZoom.base) {
			var oCoarsestTimeLineOption = this.getCoarsestTimeLineOption(),
				oFinestTimeLineOption = this.getFinestTimeLineOption();
			return {
					minRate:  this._oZoom.base.scale / this.calZoomScale(
							oCoarsestTimeLineOption.innerInterval.unit,
							oCoarsestTimeLineOption.innerInterval.span,
							oCoarsestTimeLineOption.innerInterval.range
					),
					maxRate: this._oZoom.base.scale / this.calZoomScale(
							oFinestTimeLineOption.innerInterval.unit,
							oFinestTimeLineOption.innerInterval.span,
							oFinestTimeLineOption.innerInterval.range * 4
					)
			};
		}
	};

	ProportionZoomStrategy.prototype._determineZoomRateByChartWidth = function (nClientWidth) {
		var oTotalHorizon = this.getTotalHorizon(),
			 oVisibleHorizon = this.getVisibleHorizon(),
			 oRetVal = {};

		if (!this._oZoom) {
			return null;
		}

		if (!Utility.judgeTimeHorizonValidity(oVisibleHorizon, oTotalHorizon)){
			this.setProperty("visibleHorizon", oTotalHorizon, true);
			jQuery.sap.log.warning("Visible horizon is not in total horizon, so convert visible horizon to total horizon",
				null,
				"sap.gantt.axistime.ProportionZoomStrategy.syncContext()");
		}

		// calculate min zoom rate by time horizon against svg container width
		if (oTotalHorizon) {
			var fMinScale = this.calZoomScaleByDate(
				Format.abapTimestampToDate(oTotalHorizon.getStartTime()),
				Format.abapTimestampToDate(oTotalHorizon.getEndTime()),
				nClientWidth);
			oRetVal.minRate =  this._oZoom.base.scale / fMinScale;
		}
		// calculate suitable zoom rate by init horizon against svg container width
		if (oVisibleHorizon && oVisibleHorizon.getStartTime() && oVisibleHorizon.getEndTime()) {
			var fSuitableScale = this.calZoomScaleByDate(
				Format.abapTimestampToDate(oVisibleHorizon.getStartTime()),
				Format.abapTimestampToDate(oVisibleHorizon.getEndTime()),
				nClientWidth);
			oRetVal.suitableRate = this._oZoom.base.scale / fSuitableScale;
		}
		return oRetVal;
	};

	ProportionZoomStrategy.prototype._updateTimeLineOption = function(){
		var startTime = Format.getTimeStampFormatter().parse("20000101000000"),
		iCurrentTickKey,
		i,
		oTimeLineOptions = this.getTimeLineOptions(),
		oTimeLineOption = this.getProperty("timeLineOption");

		var oAxisTime = this.getAxisTime();
		if (oAxisTime) {
			var start = oAxisTime.timeToView(startTime);

			for (i in oTimeLineOptions) {
				var interval = oTimeLineOptions[i].innerInterval;
				var end = oAxisTime.timeToView(jQuery.sap.getObject(interval.unit).offset(startTime, interval.span));
				var r = Math.abs(Math.ceil((end - start)));
				if (r >= interval.range) {
					iCurrentTickKey = i;
					break;
				}
			}
			oTimeLineOption = iCurrentTickKey ? oTimeLineOptions[iCurrentTickKey] : oTimeLineOptions[i];
			this.setProperty("timeLineOption", oTimeLineOption, true);
		}
	};

	ProportionZoomStrategy.prototype.onSetTimeZoomRate = function(fTimeZoomRate){
		var oNewVisibleHorizon = this.calVisibleHorizonByRate(fTimeZoomRate);
		this.setVisibleHorizon(oNewVisibleHorizon);
	};

	return ProportionZoomStrategy;
}, true);