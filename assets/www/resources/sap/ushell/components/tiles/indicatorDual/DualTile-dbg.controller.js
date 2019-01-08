//jQuery.sap.require("sap.ushell.components.tiles.generic");

(function () {
	/* global $ */
	"use strict";
	sap.ui.controller("sap.ushell.components.tiles.indicatorDual.DualTile", {

		getRelativeTime: function() {
			var curDate = sap.ushell.components.tiles.indicatorTileUtils.util.getUTCDate();
			this.cacheTime = (jQuery.type(this.cacheTime) == "date") ? this.cacheTime : new Date(parseInt(this.cacheTime.substr(6), 10)); // 10 redix - http://eslint.org/docs/rules/radix
			var relativeTime = sap.ushell.components.tiles.indicatorTileUtils.util.getTimeDifference(curDate - this.cacheTime);
			var retDate;
			switch (relativeTime.unit) {
			case "minutes":
				var offsetInMilliSeconds = sap.ushell.components.tiles.indicatorTileUtils.util.getMillisecond(relativeTime.time, "minutes");
				curDate = curDate - offsetInMilliSeconds;
				retDate = new Date(curDate);
				break;
			case "hours":
				var offsetInMilliSeconds = sap.ushell.components.tiles.indicatorTileUtils.util.getMillisecond(relativeTime.time, "hours");
				curDate = curDate - offsetInMilliSeconds;
				retDate = new Date(curDate);
				break;
			case "days":
				var offsetInMilliSeconds = sap.ushell.components.tiles.indicatorTileUtils.util.getMillisecond(relativeTime.time, "days");
				curDate = curDate - offsetInMilliSeconds;
				retDate = new Date(curDate);
				break;
			}
			return retDate;
		},


		getTile : function() {
			return this.oKpiTileView.oGenericTile;
		},

		setTimeStamp : function() {
			this.updateTimeStampjobScheduled = false;
			var oFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({relative:true, relativeSource:"auto"});
			var timeStamp = oFormat.format(this.getRelativeTime());
			var leftTileContent = this.getView().oGenericTile.getTileContent()[0];
			leftTileContent && leftTileContent.setRefreshOption && leftTileContent.setRefreshOption(true);
			leftTileContent && leftTileContent.setTimestamp && leftTileContent.setTimestamp(timeStamp);
			this.updateTimeStampjobScheduled = false;
			var key = this.oConfig.TILE_PROPERTIES.id + "time";
			var runningJob = sap.ushell.components.tiles.indicatorTileUtils.util.getScheduledJob(key);
			if (runningJob) {
				clearTimeout(runningJob);
				runningJob = undefined;
			}

			sap.ushell.components.tiles.indicatorTileUtils.util.scheduleTimeStampJob.call(this, this.oTileApi.visible.isVisible());
		},

		getLocalCache : function(cache) {
			var localCache = {};
			localCache.ChipId = cache.ChipId;
			localCache.Data = cache.Data;
			localCache.CacheMaxAge = cache.CacheMaxAgeUnit;
			localCache.CacheMaxAgeUnit = cache.CacheMaxAgeUnit;
			localCache.CacheType = cache.CacheType;
			localCache.CachedTime = sap.ushell.components.tiles.indicatorTileUtils.util.getUTCDate();
			return localCache;
		},

		refreshPress: function() {
			this.initProcess(true);
		},



		_getView : function(viewName,deferredObj, refresh){
			var viewData = this.oKpiTileView.getViewData();
			var view = sap.ui.view({
				type: sap.ui.core.mvc.ViewType.JS,
				viewName: viewName,
				viewData: jQuery.extend(true, {}, viewData, {parentController : this}, {deferredObj : deferredObj}, {refresh : refresh})
			});
			return view;
		},



		logError : function(err){
			this._updateTileModel({
				value : "",
				scale : "",
				unit: ""
			});
			if (this.getView().getViewData().deferredObj) {
				this.getView().getViewData().deferredObj.reject();
			}
		},

		doProcess : function(refresh) {
			sap.ushell.components.tiles.indicatorTileUtils.util.setUnsetCallInProgress(this.oKpiTileView.oConfig.TILE_PROPERTIES.id + "defferedLeft", this.deferred_left);
			sap.ushell.components.tiles.indicatorTileUtils.util.setUnsetCallInProgress(this.oKpiTileView.oConfig.TILE_PROPERTIES.id + "defferedRight",this.deferred_right);
			var that = this;
			this.getView().oGenericTile.removeAllTileContent();

			var oStaticArea =  this.getView().oGenericTile;//sap.ui.getCore().getUIArea(sap.ui.getCore().getStaticAreaRef());
			this.leftView;
			this.rightView;

			this.system = this.oTileApi.url.getApplicationSystem();
			this.oKpiTileView.oGenericTile.setState(sap.m.LoadState.Loading);
			var tileType = that.tileType.split("-")[1];
			try {
				var viewName;

				viewName = "sap.ushell.components.tiles.indicatornumeric.NumericTile";
				this.leftView = that._getView(viewName,this.deferred_left, refresh);
				this.leftView.getController().dataCallInProgress = false;

				oStaticArea.addTileContent(this.leftView.oGenericTile.getTileContent()[0]);

				switch (tileType){
				case "CM":
					viewName = "sap.ushell.components.tiles.indicatorcomparison.ComparisonTile";
					this.rightView = that._getView(viewName,this.deferred_right, refresh);
					this.rightView.getController().dataCallInProgress = false;
					oStaticArea.addTileContent(this.rightView.oGenericTile.getTileContent()[0]);
					break;

				case "CT":
					viewName = "sap.ushell.components.tiles.indicatorcontribution.ContributionTile";
					this.rightView = that._getView(viewName,this.deferred_right, refresh);
					this.rightView.getController().dataCallInProgress = false;
					oStaticArea.addTileContent(this.rightView.oGenericTile.getTileContent()[0]);
					break;

				case "AT":
					viewName = "sap.ushell.components.tiles.indicatordeviation.DeviationTile";
					this.rightView = that._getView(viewName,this.deferred_right, refresh);
					this.rightView.getController().dataCallInProgress = false;
					oStaticArea.addTileContent(this.rightView.oGenericTile.getTileContent()[0]);
					break;

				case "TT":
					viewName = "sap.ushell.components.tiles.indicatorArea.AreaChartTile";
					this.rightView = that._getView(viewName,this.deferred_right, refresh);
					this.rightView.getController().dataCallInProgress = false;
					oStaticArea.addTileContent(this.rightView.oGenericTile.getTileContent()[0]);
					break;
				}
				this.leftView.getController().onAfterTileRendering();
				this.rightView.getController().onAfterTileRendering();
				var leftTileContent = this.getView().oGenericTile.getTileContent()[0];
				leftTileContent && leftTileContent.attachRefresh && leftTileContent.attachRefresh(jQuery.proxy(this.refreshPress,that));
			} catch (e) {
				this.logError(e);
			}
		},


		_updateTileModel : function(newData) {
			var modelData  = this.getTile().getModel().getData();
			jQuery.extend(modelData,newData);
			this.getTile().getModel().setData(modelData);
		},

		setTextInTile : function(){

			var that = this;
			var titleObj = sap.ushell.components.tiles.indicatorTileUtils.util.getTileTitleSubtitle(this.oTileApi);
			this._updateTileModel({

				header : titleObj.title || sap.ushell.components.tiles.indicatorTileUtils.util.getChipTitle(that.oConfig ),
				subheader : titleObj.subTitle || sap.ushell.components.tiles.indicatorTileUtils.util.getChipSubTitle(that.oConfig )
			});
		},

		doDummyProcess : function(){

			var that = this;
			try {
				that.setTextInTile();

				switch (that.tileType){
				case "DT-CM":
					that._updateTileModel({
						value: 1,
						size: sap.m.Size.Auto,
						frameType: sap.m.FrameType.TwoByOne,
						state: sap.m.LoadState.Loading,
						valueColor:sap.m.ValueColor.Good,
						indicator: sap.m.DeviationIndicator.None,
						title : "Liquidity Structure",
						footer : "Current Quarter",
						description: "Apr 1st 2013 (B$)",
						data: [
						       { title: "Measure 1", value: 1, color: "Good"},
						       { title: "Measure 2", value: 2, color: "Good" },
						       { title: "Measure 3", value: 3, color: "Good" }
						       ]
					});

					break;

				case "DT-AT":
					that._updateTileModel({
						valueColor: "Good",
						value : 100,
						frameType: sap.m.FrameType.TwoByOne,
						unit: "USD",
						actual: { value: 120, color: sap.m.ValueColor.Good},
						targetValue: 100,
						thresholds: [
						             { value: 0, color: sap.m.ValueColor.Error },
						             { value: 50, color: sap.m.ValueColor.Critical },
						             { value: 150, color: sap.m.ValueColor.Critical },
						             { value: 200, color: sap.m.ValueColor.Error }
						             ],
						             showActualValue: true,
						             showTargetValue: true
					});

					break;

				case "DT-CT":
					that._updateTileModel({
						value: 8888,
						size: sap.m.Size.Auto,
						frameType:sap.m.FrameType.TwoByOne,
						state: sap.m.LoadState.Loading,
						valueColor:sap.m.ValueColor.Error,
						indicator: sap.m.DeviationIndicator.None,
						title : "US Profit Margin",
						footer : "Current Quarter",
						description: "Maximum deviation",
						data: [
						       { title: "Americas", value: 10, color: "Neutral",displayValue:"" },
						       { title: "EMEA", value: 50, color: "Neutral" ,displayValue:""},
						       { title: "APAC", value: -20, color: "Neutral" ,displayValue:""}
						       ]
					});
					break;

				case "DT-TT":
					this._updateTileModel({

						value: 8888,
						size: sap.m.Size.Auto,
						frameType:sap.m.FrameType.TwoByOne,
						state: sap.m.LoadState.Loading,
						valueColor:sap.m.ValueColor.Error,
						indicator: sap.m.DeviationIndicator.None,
						title : "Liquidity Structure",
						footer : "Current Quarter",
						description: "Apr 1st 2013 (B$)",

						width: "100%",
						height: "100%",
						chart: {
							color:"Good",
							data: [
							       {day: 0, balance: 0},
							       {day: 30, balance: 20},
							       {day: 60, balance: 20},
							       {day: 100, balance: 80}
							       ]
						},
						target: {
							color:"Error",
							data: [
							       {day: 0, balance: 0},
							       {day: 30, balance: 30},
							       {day: 60, balance: 40},
							       {day: 100, balance: 90}
							       ]
						},
						maxThreshold: {
							color: "Good",
							data: [
							       {day: 0, balance: 0},
							       {day: 30, balance: 40},
							       {day: 60, balance: 50},
							       {day: 100, balance: 100}
							       ]
						},
						innerMaxThreshold: {
							color: "Error",
							data: [
							       ]
						},
						innerMinThreshold: {
							color: "Neutral",
							data: [
							       ]
						},
						minThreshold: {
							color: "Error",
							data: [
							       {day: 0, balance: 0},
							       {day: 30, balance: 20},
							       {day: 60, balance: 30},
							       {day: 100, balance: 70}
							       ]
						},
						minXValue: 0,
						maxXValue: 100,
						minYValue: 0,
						maxYValue: 100,
						firstXLabel: { label: "June 123", color: "Error"   },
						lastXLabel: { label: "June 30", color: "Error" },
						firstYLabel: { label: "0M", color: "Good" },
						lastYLabel: { label: "80M", color: "Critical" },
						minLabel: { },
						maxLabel: { }
					});
					break;

				}
				//that.oKpiTileView.getViewData().deferredObj.resolve();

			} catch (e) {
				//that.oKpiTileView.getViewData().deferredObj.reject();

			}

		},




		visibleHandler : function (isVisible) {
			if (!isVisible) {
				if (this.leftView) {
					this.leftView.getController().firstTimeVisible = false;
				}
				if (this.rightView) {
					this.rightView.getController().firstTimeVisible = false;
				}
				sap.ushell.components.tiles.indicatorTileUtils.util.abortPendingODataCalls(this.queryServiceUriODataReadRef);
				sap.ushell.components.tiles.indicatorTileUtils.util.abortPendingODataCalls(this.trendChartODataReadRef);
				sap.ushell.components.tiles.indicatorTileUtils.util.abortPendingODataCalls(this.comparisionChartODataRef);
			}
			if (isVisible) {
				if (this.leftView) {
					this.leftView.getController().refreshHandler();
				}
				if (this.rightView) {
					this.rightView.getController().refreshHandler();
				}
			}
		},

		initProcess : function(refresh) {
			var that = this;
			this.oKpiTileView = this.getView();
			this.oResourceBundle = sap.ushell.components.tiles.utils.getResourceBundleModel().getResourceBundle();
			this.viewData = {};
			that.viewData = this.oKpiTileView.getViewData();
			this.oTileApi = this.viewData.chip; // instance specific CHIP API
			if (this.oTileApi.visible) {
				this.oTileApi.visible.attachVisible(this.visibleHandler.bind(this));
			}

			this.deferred_left = new jQuery.Deferred();
			this.deferred_right = new jQuery.Deferred();

			$.when(this.deferred_left,this.deferred_right).done(function(){
				that.setTextInTile();
				that.oConfig = that.oKpiTileView.oConfig;
				that.chipCacheTime = sap.ushell.components.tiles.indicatorTileUtils.util.getCachingTime(that.oConfig);
				that.chipCacheTimeUnit = sap.ushell.components.tiles.indicatorTileUtils.util.getCachingTimeUnit(that.oConfig);
				var leftData = that.leftView.getController().cacheWriteData;
				var rightData = that.rightView.getController().cacheWriteData;
				that.oKpiTileView.oGenericTile.setState(sap.m.LoadState.Loaded);
				var navTarget = sap.ushell.components.tiles.indicatorTileUtils.util.getNavigationTarget(that.oKpiTileView.oConfig,that.system);
				that.oKpiTileView.oGenericTile.$().wrap("<a href ='" + navTarget + "'/>");
				that.oKpiTileView.oGenericTile.attachPress(function(){
					that.tilePressed = true;
					sap.ushell.components.tiles.indicatorTileUtils.cache.setKpivalueById(that.oKpiTileView.oConfig.TILE_PROPERTIES.id, null);
					window.location.hash = navTarget;
                });
				var cacheData = {};
				var writeData = {};
				writeData.leftData = leftData;
				writeData.rightData = rightData;
//				this.getView().oGenericTile.removeAllTileContent();
//				this.leftView.oGenericTile.getTileContent()[0]
//				this.rightView.oGenericTile.getTileContent()[0]
//				cacheData.DATA = JSON.stringify(writeData);
//				cacheData.CHIPID = that.oConfig.TILE_PROPERTIES.id;
//				cacheData.CHIP_CHANGED_TIME = new Date();
//				cacheData.EVALUATION_CHANGED_TIME  = new Date();
//				cacheData.EVALUATIONID = that.oConfig.EVALUATION.ID;
//				cacheData.CACHEDTIME = new Date();
//				cacheData.USERID = sap.ushell.Container.getUser().getId();

				cacheData.ChipId = that.oConfig.TILE_PROPERTIES.id;
				cacheData.Data = JSON.stringify(writeData);
				cacheData.CacheMaxAge = Number(that.chipCacheTime);
				cacheData.CacheMaxAgeUnit = that.chipCacheTimeUnit;
				cacheData.CacheType = 1;

				var localCache = that.getLocalCache(cacheData);
				if (writeData.leftData && writeData.rightData) {
					sap.ushell.components.tiles.indicatorTileUtils.cache.setKpivalueById(that.oConfig.TILE_PROPERTIES.id, localCache);
				}
				var cachedValue = sap.ushell.components.tiles.indicatorTileUtils.cache.getKpivalueById(that.oConfig.TILE_PROPERTIES.id);

				if (that.chipCacheTime &&
						writeData.leftData && writeData.rightData) {
					sap.ushell.components.tiles.indicatorTileUtils.util.writeFrontendCacheByChipAndUserId(that.oTileApi, that.oConfig.TILE_PROPERTIES.id, cacheData ,
							false, function(data){
						if (data) {
							sap.ushell.components.tiles.indicatorTileUtils.cache.setKpivalueById(that.oConfig.TILE_PROPERTIES.id, data);
							that.cacheTime = data.CachedTime;
							that.setTimeStamp.call(that);
						}
					});
				}
				if (that.chipCacheTime) {
					if (!that.cacheTime) {
						that.cacheTime = cachedValue.CachedTime;
					}
					that.setTimeStamp.call(that);
					sap.ushell.components.tiles.indicatorTileUtils.util.scheduleFetchDataJob.call(that, that.oTileApi.visible.isVisible());
				}
			}).fail(function(){
				that.oKpiTileView.oGenericTile.setState(sap.m.LoadState.Failed);
			});

			that.tileType = that.oKpiTileView.oConfig.TILE_PROPERTIES.tileType;
			this.oTileApi = that.viewData.chip; // instance specific CHIP API
			if (this.oTileApi.preview.isEnabled()){
				this.doDummyProcess();
				that.oKpiTileView.oGenericTile.attachPress(function(){
					sap.m.MessageToast.show(that.oResourceBundle.getText("sb.NavigationHelp"));
				});
			} else {
				this.doProcess(refresh);
			}
		},

		onAfterRendering : function() {
			this.initProcess();
		},



		setNoData : function(){
			try {
				this._updateTileModel({
					value : "",
					scale : "",
					unit : "",
					footerNum : this.oResourceBundle.getText("sb.noDataAvailable"),
					footerComp : this.oResourceBundle.getText("sb.noDataAvailable") // in case of comparison( and mm) tiles
				});
				this.oKpiTileView.oGenericTile.setState(sap.m.LoadState.Loaded);
			}catch (e){
				//do nothing
			}
		},
		getChipConfiguration : function(callback){
			var that = this;
			try {
				sap.ushell.components.tiles.indicatorTileUtils.util.getParsedChip(
						that.oTileApi.configuration.getParameterValueAsString("tileConfiguration"), that.oTileApi.preview.isEnabled(), function(config){
							that.oConfig = config;
							callback.call();
						});
			} catch (e) {
				that.logError(e.message);
			}
		}


	});
}());
