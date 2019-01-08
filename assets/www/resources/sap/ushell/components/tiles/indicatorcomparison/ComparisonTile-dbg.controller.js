jQuery.sap.require("sap.ushell.components.tiles.generic");


(function () {
    "use strict";
    sap.ushell.components.tiles.generic.extend("sap.ushell.components.tiles.indicatorcomparison.ComparisonTile", {
        onInit :  function(){
            this.KPI_VALUE_REQUIRED = false;
        },
        _processDataForComparisonChart: function(data, measure, unit) {

            var finalOutput = [], LABEL_MAPPING = {}, i, tempObject, l;
            var tempVar;
            var aTitles = [];
            var that = this;
            var unitValue = null;
            for (i = 0; i < data.results.length; i++) {
                var eachData = data.results[i];
            }
            aTitles = sap.ushell.components.tiles.indicatorTileUtils.util.getAllMeasuresWithLabelText(this.oTileApi.url.addSystemToServiceUrl(this.oConfig.EVALUATION.ODATA_URL), this.oConfig.EVALUATION.ODATA_ENTITYSET);
            for (i = 0 , l = aTitles.length; i < l; i++) {
                tempObject = aTitles[i];
                LABEL_MAPPING[tempObject.key] = tempObject.value;
            }

            var columnName = that.oConfig.TILE_PROPERTIES.COLUMN_NAMES ||  that.oConfig.EVALUATION.COLUMN_NAMES;
            for (i = 0; i < columnName.length; i++){
                var temp = {};
                var columnObject = columnName[i];
                temp.value = Number(eachData[columnObject.COLUMN_NAME]);
                var calculatedValueForScaling = Number(eachData[columnObject.COLUMN_NAME]);

                var isEvaluationThresholdMeasure = false;
                var scaling = 0;
                var tMeasures = that._getEvaluationThresholdMeasures();
                var mIndex = jQuery.inArray(columnObject.COLUMN_NAME, tMeasures);
                if (mIndex > -1 ) {
                    /* the measure is a kpi measure or a threshold measure */
                    isEvaluationThresholdMeasure = true;
                    scaling = that.oConfig.EVALUATION.SCALING;
                }

                if (that.oConfig.EVALUATION.SCALING == -2 && isEvaluationThresholdMeasure) {
                    calculatedValueForScaling *= 100;
                }
                var c = that.isCurrencyMeasure(columnObject.COLUMN_NAME);
                if (unit && unit[i] && eachData[unit[i].name]) {
                    unitValue = eachData[unit[i].name];
                }
                tempVar = sap.ushell.components.tiles.indicatorTileUtils.util.getLocaleFormattedValue(calculatedValueForScaling, scaling, that.oConfig.EVALUATION.SCALING,that.oConfig.EVALUATION.DECIMAL_PRECISION, c, unitValue);
                if (that.oConfig.EVALUATION.SCALING == -2 && isEvaluationThresholdMeasure) {
                    tempVar += " %";
                }
                temp.displayValue = tempVar.toString();
                if (unit) {
                    if (unit[i] && eachData[unit[i].name]){
                        temp.displayValue += " " + eachData[unit[i].name];
                    }
                }
                temp.color = columnObject.semanticColor;
                temp.title = LABEL_MAPPING[columnObject.COLUMN_NAME] || columnObject.COLUMN_NAME;
                temp.measure = columnObject.COLUMN_NAME;
                temp.isCurM = c;

                finalOutput.push(temp);

            }

            return finalOutput;
        },
        fetchChartData: function(bRefreshClick, isAutoRefresh, fnSuccess, fnError){
            function checkIfDataPresent(data,columnNames){
                var isPresent = false;
                if (data && data.results && data.results.length){
                    for (var i = 0, l = columnNames.length; i < l && !isPresent; i++) {
                        isPresent = data.results[0][columnNames[i].COLUMN_NAME] !== null;
                    }
                }
                return isPresent;
            }

            var that = this;

            try {
                /* Preparing arguments for the prepareQueryServiceUri function */
//                var sUri = this.oConfig.EVALUATION.ODATA_URL;
                var entitySet = this.oConfig.EVALUATION.ODATA_ENTITYSET;
                var measure = this.oConfig.EVALUATION.COLUMN_NAME;
                var measures = measure;
                if (this.oConfig.TILE_PROPERTIES.COLUMN_NAMES){
                    for (var j = 0; j < this.oConfig.TILE_PROPERTIES.COLUMN_NAMES.length; j++){
                        if (this.oConfig.TILE_PROPERTIES.COLUMN_NAMES[j].COLUMN_NAME != this.oConfig.EVALUATION.COLUMN_NAME) {
                            measures = measures + "," + this.oConfig.TILE_PROPERTIES.COLUMN_NAMES[j].COLUMN_NAME;
                        }

                    }
                } else {
                    for (var j = 0; j < this.oConfig.EVALUATION.COLUMN_NAMES.length; j++){
                        if (this.oConfig.EVALUATION.COLUMN_NAMES[j].COLUMN_NAME != this.oConfig.EVALUATION.COLUMN_NAME) {
                            measures = measures + "," + this.oConfig.EVALUATION.COLUMN_NAMES[j].COLUMN_NAME;
                        }
                    }
                }

                //var data = this.oConfig.EVALUATION_VALUES;
                var isRefreshClick = sap.ushell.components.tiles.indicatorTileUtils.util.getBoolValue(bRefreshClick);
                var cachedValue = sap.ushell.components.tiles.indicatorTileUtils.cache.getKpivalueById(that.oConfig.TILE_PROPERTIES.id);
               
                if (sap.ushell.components.tiles.indicatorTileUtils.util.isDualTile(that.oConfig)) {
                    if (cachedValue) {
                            var tempData = cachedValue.Data && JSON.parse(cachedValue.Data);
                            
                    }        
             }
                var chipUpdateTime = that.oTileApi.configuration.getParameterValueAsString("timeStamp");
                var isCacheValid = sap.ushell.components.tiles.indicatorTileUtils.util.isCacheValid(that.oConfig.TILE_PROPERTIES.id, chipUpdateTime, that.chipCacheTime, that.chipCacheTimeUnit, that.tilePressed);
                if ((tempData && !tempData.rightData) || !cachedValue || (!isCacheValid && that.oTileApi.visible.isVisible()) || isRefreshClick || (isAutoRefresh && that.oTileApi.visible.isVisible()) || that.getView().getViewData().refresh) {
                    if (that.kpiValueFetchDeferred) {
                        that.kpiValueFetchDeferred = false;
                        var variants = sap.ushell.components.tiles.indicatorTileUtils.util.prepareFilterStructure(this.oConfig.EVALUATION_FILTERS,this.oConfig.ADDITIONAL_FILTERS);

                        /* commented by chan .. sorting is not required
                         * var orderByObject = {};
                    orderByObject["0"] = measure + ",asc";
                    orderByObject["1"] = measure + ",desc";

                    var orderByElement = orderByObject[this.oConfig.TILE_PROPERTIES.sortOrder || "0"].split(",");
                         */
                        var finalQuery = sap.ushell.components.tiles.indicatorTileUtils.util.prepareQueryServiceUri(that.oRunTimeODataModel, entitySet, measures,null, variants, 3);
                        /*
                         *  commented by chan .. sorting is not required
                         *
                     if (this.oConfig.TILE_PROPERTIES.semanticMeasure) {
                        finalQuery.uri += "&$orderby=" + orderByElement[0] + " " + orderByElement[2];
                    } else {
                        finalQuery.uri += "&$orderby=" + orderByElement[0] + " " + orderByElement[1];
                    }*/


                        this.comparisionChartODataRef = finalQuery.model.read(finalQuery.uri, null, null, true, function(data) {
                            that.kpiValueFetchDeferred = true;
                            var writeData = {};
                            if (finalQuery.unit){
                                writeData.unit = finalQuery.unit;

                            }

                            if (checkIfDataPresent(data,that.oConfig.TILE_PROPERTIES.COLUMN_NAMES || that.oConfig.EVALUATION.COLUMN_NAMES)) {


                                that.oConfig.TILE_PROPERTIES.FINALVALUE = data;
                                that.oConfig.TILE_PROPERTIES.FINALVALUE = that._processDataForComparisonChart(that.oConfig.TILE_PROPERTIES.FINALVALUE,measures.split(",")[0], finalQuery.unit);
//                              if (sap.ushell.components.tiles.indicatorTileUtils.cache.getKpivalueById(that.oConfig.TILE_PROPERTIES.id)){
//                              writeData = sap.ushell.components.tiles.indicatorTileUtils.cache.getKpivalueById(that.oConfig.TILE_PROPERTIES.id);
//                              writeData.data = data;
//                              } else {
                                writeData.data = that.oConfig.TILE_PROPERTIES.FINALVALUE;
                                var cacheData = {};
//                              cacheData.DATA = JSON.stringify(writeData);
//                              cacheData.CHIPID = that.oConfig.TILE_PROPERTIES.id;
//                              cacheData.CHIP_CHANGED_TIME = new Date();
//                              cacheData.EVALUATION_CHANGED_TIME  = new Date();
//                              cacheData.EVALUATIONID = that.oConfig.EVALUATION.ID;
//                              cacheData.CACHEDTIME = new Date();
//                              cacheData.USERID = sap.ushell.Container.getUser().getId();
                                that.cacheTime = sap.ushell.components.tiles.indicatorTileUtils.util.getUTCDate();

                                cacheData.ChipId = that.oConfig.TILE_PROPERTIES.id;
                                cacheData.Data = JSON.stringify(writeData);
                                cacheData.CacheMaxAge = Number(that.chipCacheTime);
                                cacheData.CacheMaxAgeUnit = that.chipCacheTimeUnit;
                                cacheData.CacheType = 1;

                                var localCache = that.getLocalCache(cacheData);


                                that.updateDatajobScheduled = false;
                                var key = that.oConfig.TILE_PROPERTIES.id + "data";
                                var runningJob = sap.ushell.components.tiles.indicatorTileUtils.util.getScheduledJob(key);
                                if (runningJob) {
                                    clearTimeout(runningJob);
                                    runningJob = undefined;
                                }
                                if (!sap.ushell.components.tiles.indicatorTileUtils.util.isDualTile(that.oConfig)) {
                                    sap.ushell.components.tiles.indicatorTileUtils.cache.setKpivalueById(that.oConfig.TILE_PROPERTIES.id, localCache);
                                    var bUpdate = false;
                                    if (cachedValue) {
                                        bUpdate = true;
                                    }
                                    if (that.chipCacheTime) {
                                        sap.ushell.components.tiles.indicatorTileUtils.util.writeFrontendCacheByChipAndUserId(that.oTileApi, that.oConfig.TILE_PROPERTIES.id, cacheData,
                                                bUpdate, function(data){
                                            if (data) {
                                                that.cacheTime = data && data.CachedTime;
                                                sap.ushell.components.tiles.indicatorTileUtils.cache.setKpivalueById(that.oConfig.TILE_PROPERTIES.id, data);
                                                that.setTimeStamp();
                                            }
                                            if (that.chipCacheTime &&
                                                    !sap.ushell.components.tiles.indicatorTileUtils.util.isDualTile(that.oConfig)) {
                                                jQuery.proxy(that.setTimeStamp(that.cacheTime), that);
                                            }
                                        });
                                    }
                                } else {
                                    var tempCacheData = sap.ushell.components.tiles.indicatorTileUtils.cache.getKpivalueById(that.oConfig.TILE_PROPERTIES.id);
                                    if (tempCacheData) {
                                        if (!tempCacheData.CachedTime) {
                                            tempCacheData.CachedTime = sap.ushell.components.tiles.indicatorTileUtils.util.getUTCDate();
                                        }
                                        var avilableCacheData = tempCacheData.Data;
                                        if (avilableCacheData) {
                                            avilableCacheData = JSON.parse(avilableCacheData);
                                            avilableCacheData.rightData = writeData;
                                        }
                                        tempCacheData.Data = JSON.stringify(avilableCacheData);
                                        sap.ushell.components.tiles.indicatorTileUtils.cache.setKpivalueById(that.oConfig.TILE_PROPERTIES.id, tempCacheData);
                                    } else {
                                        var avilableCacheData = {};
                                        avilableCacheData.rightData = writeData;
                                        localCache.Data = JSON.stringify(avilableCacheData);
                                        sap.ushell.components.tiles.indicatorTileUtils.cache.setKpivalueById(that.oConfig.TILE_PROPERTIES.id, localCache);
                                    }
                                    that.cacheWriteData = writeData;
                                }
                                fnSuccess.call(that,that.oConfig.TILE_PROPERTIES.FINALVALUE);
                            } else if (data.results.length == 0) {
                                that.oConfig.TILE_PROPERTIES.FINALVALUE = data;
                                if (sap.ushell.components.tiles.indicatorTileUtils.cache.getKpivalueById(that.oConfig.TILE_PROPERTIES.id)) {
                                    writeData = sap.ushell.components.tiles.indicatorTileUtils.cache.getKpivalueById(that.oConfig.TILE_PROPERTIES.id);
                                    writeData.data = data;
                                } else {
                                    writeData.data = data;
                                }
                                sap.ushell.components.tiles.indicatorTileUtils.cache.setKpivalueById(that.oConfig.TILE_PROPERTIES.id, writeData);
                                fnSuccess.call(that,that.oConfig.TILE_PROPERTIES.FINALVALUE);
                                that.setNoData();
                            } else {
                                sap.ushell.components.tiles.indicatorTileUtils.cache.setKpivalueById(that.oConfig.TILE_PROPERTIES.id, {empty:"empty"});
                                that.setNoData();
                            }
                        },function(eObject) {
                            that.kpiValueFetchDeferred = true;
                            if (eObject && eObject.response) {
                                jQuery.sap.log.error(eObject.message  + " : " + eObject.request.requestUri);
                                fnError.call(that, eObject);
                            }
                        });
                    }
                } else {
                    if (cachedValue && cachedValue.Data) {
                        var kpiData;
                        var tileType = that.oConfig && that.oConfig.TILE_PROPERTIES && that.oConfig.TILE_PROPERTIES.tileType;
                        if (tileType.indexOf("DT-") == -1) {
                            kpiData = cachedValue.Data && JSON.parse(cachedValue.Data);
                        } else {
                            kpiData =  cachedValue.Data && JSON.parse(cachedValue.Data);
                            kpiData = kpiData.rightData;
                        }
                        that.cacheTime = cachedValue.CachedTime;
                        if (that.chipCacheTime &&
                                !sap.ushell.components.tiles.indicatorTileUtils.util.isDualTile(that.oConfig)) {
                            jQuery.proxy(that.setTimeStamp(that.cacheTime), that);
                        }
                        if (kpiData.data && kpiData.data.length) {

                            that.oConfig.TILE_PROPERTIES.FINALVALUE = kpiData.data;
                            //that.oConfig.TILE_PROPERTIES.FINALVALUE = that._processDataForComparisonChart(that.oConfig.TILE_PROPERTIES.FINALVALUE, measures, kpiData.unit);
                            fnSuccess.call(that,that.oConfig.TILE_PROPERTIES.FINALVALUE);
                        } else {
                            that.oConfig.TILE_PROPERTIES.FINALVALUE = kpiData.data;
                            fnSuccess.call(that,that.oConfig.TILE_PROPERTIES.FINALVALUE);
                            that.setNoData();
                        }
                    } else {
                        that.setNoData();
                    }
                }
            } catch (e) {
                that.kpiValueFetchDeferred = true;
                fnError.call(that,e);
            }
        },
       
        doProcess : function(bRefreshClick, isAutoRefresh){

            var that = this;
            this.setTextInTile();
            this.fetchChartData(bRefreshClick, isAutoRefresh, function(kpiValue){
                this.CALCULATED_KPI_VALUE = kpiValue;
                this._updateTileModel({
                    data : this.CALCULATED_KPI_VALUE
                });
                if (that.oConfig.TILE_PROPERTIES.frameType == sap.m.FrameType.TwoByOne){
                    that.oKpiTileView.oGenericTile.setFrameType(sap.m.FrameType.TwoByOne);
                    //that.oKpiTileView.oGenericTile.removeAllTileContent();
                    that.getView().getViewData().parentController._updateTileModel(this.getTile().getModel().getData());
                    //that.oKpiTileView.oGenericTile.addTileContent(that.oKpiTileView.oNVConfS);
                    var columnNames = {};
                    columnNames.data = this.CALCULATED_KPI_VALUE;
                    //that.getView().getViewData().parentController._updateTileModel(columnNames);
                    that.getView().getViewData().deferredObj.resolve();
                } else {
                    that.oKpiTileView.oGenericTile.setFrameType(sap.m.FrameType.OneByOne);
                    that.oKpiTileView.oGenericTile.removeAllTileContent();
                    that.oKpiTileView.oGenericTile.addTileContent(that.oKpiTileView.oNVConfS);
                    /*var navTarget = sap.ushell.components.tiles.indicatorTileUtils.util.getNavigationTarget(that.oConfig,that.system);
                    that.oKpiTileView.oGenericTile.$().wrap("<a href ='" + navTarget + "'/>");*/
                    this.oKpiTileView.oGenericTile.setState(sap.m.LoadState.Loaded);
                }
                this.setToolTip(null,this.CALCULATED_KPI_VALUE,"COMP");
                if (this.chipCacheTime &&
                        !sap.ushell.components.tiles.indicatorTileUtils.util.isDualTile(this.oConfig)) {
                    sap.ushell.components.tiles.indicatorTileUtils.util.scheduleFetchDataJob.call(this, this.oTileApi.visible.isVisible());
                }
            }, this.logError);
        },

       
       

        doDummyProcess : function(){
            var that = this;
            this.setTextInTile();
            that._updateTileModel({
                value: 8888,
                size: sap.m.Size.Auto,
                frameType : sap.m.FrameType.OneByOne,
                state: sap.m.LoadState.Loading,
                valueColor:sap.m.ValueColor.Error,
                indicator: sap.m.DeviationIndicator.None,
                title : "Liquidity Structure",
                footer : "Current Quarter",
                description: "Apr 1st 2013 (B$)",
                data: [
                       { title: "Measure 1", value: 1.2, color: "Good" },
                       { title: "Measure 2", value: 0.78, color: "Good" },
                       { title: "Measure 3", value: 1.4, color: "Error" }
                       ]
            });
            this.oKpiTileView.oGenericTile.setState(sap.m.LoadState.Loaded);
        }

    });

}());
