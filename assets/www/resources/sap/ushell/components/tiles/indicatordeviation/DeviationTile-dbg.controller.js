(function () {
    "use strict";
    jQuery.sap.require("sap.ushell.components.tiles.generic");
    sap.ushell.components.tiles.generic.extend("sap.ushell.components.tiles.indicatordeviation.DeviationTile", {
        onInit :  function(){
            this.KPI_VALUE_REQUIRED = true;
        },

        doProcess : function(kpiValue, sThresholdObject) {
            var that = this;
            var formattedTargetvalue, formattedValue;
            var calculatedValueForScaling = Number(kpiValue);
            var thresholdObject = this.setThresholdValues();
            if (this.oConfig.EVALUATION.SCALING == -2){
                calculatedValueForScaling *= 100;
            }
            var c = this.isCurrencyMeasure(this.oConfig.EVALUATION.COLUMN_NAME);
            formattedValue = sap.ushell.components.tiles.indicatorTileUtils.util.getLocaleFormattedValue(Number(calculatedValueForScaling), this.oConfig.EVALUATION.SCALING,this.oConfig.EVALUATION.DECIMAL_PRECISION, c, this.CURRENCY_CODE);
//          if (this.oConfig.EVALUATION.SCALING == -2){
//          formattedValue += " %";
//          }

            this.CALCULATED_KPI_VALUE = Number(kpiValue);
            var deviationTileObj = {};
            var applyColor = this.getThresholdsObjAndColor(sThresholdObject).returnColor;
            var actualKpiObj = {value: Number(kpiValue), color: applyColor};

            deviationTileObj.actualValueLabel = formattedValue.toString();
            deviationTileObj.actual = actualKpiObj;
            deviationTileObj.thresholds = [];
            deviationTileObj.thresholds = this.getThresholdsObjAndColor(thresholdObject).arrObj;
            var evalValue = this.DEFINITION_DATA.EVALUATION_VALUES;
            if (this.DEFINITION_DATA.EVALUATION.VALUES_SOURCE == "MEASURE"){
                var calculatedTargetValue = Number(thresholdObject.targetValue);
                if (this.oConfig.EVALUATION.SCALING == -2) {
                    calculatedTargetValue *= 100;
                }
                c = this.isCurrencyMeasure(this.oConfig.EVALUATION.COLUMN_NAME);
                formattedTargetvalue = sap.ushell.components.tiles.indicatorTileUtils.util.getLocaleFormattedValue(calculatedTargetValue, this.oConfig.EVALUATION.SCALING,this.oConfig.EVALUATION.DECIMAL_PRECISION, c, this.CURRENCY_CODE);
//              if (this.oConfig.EVALUATION.SCALING == -2) {
//              formattedTargetvalue += "%";
//              }
                deviationTileObj.targetValue = Number(thresholdObject.targetValue);
                deviationTileObj.targetValueLabel = formattedTargetvalue.toString();
            } else {
                for (var itr = 0; itr < evalValue.length; itr++){
                    if (evalValue[itr].TYPE === "TA") {
                        var calculatedTargetValue = Number(evalValue[itr].FIXED);
                        if (this.oConfig.EVALUATION.SCALING == -2) {
                            calculatedTargetValue *= 100;
                        }
                        c = this.isCurrencyMeasure(this.oConfig.EVALUATION.COLUMN_NAME);
                        formattedTargetvalue = sap.ushell.components.tiles.indicatorTileUtils.util.getLocaleFormattedValue(calculatedTargetValue, this.oConfig.EVALUATION.SCALING,this.oConfig.EVALUATION.DECIMAL_PRECISION, c, this.CURRENCY_CODE);
//                      if (this.oConfig.EVALUATION.SCALING == -2) {
//                      formattedTargetvalue += "%";
//                      }
                        deviationTileObj.targetValue =  Number(evalValue[itr].FIXED);
                        deviationTileObj.targetValueLabel = formattedTargetvalue.toString();
                    }
                }
            }

            if (this.oConfig.EVALUATION.SCALING == -2) {
                deviationTileObj.scale = "%";
            }
            this._updateTileModel(deviationTileObj);
            if (this.DEFINITION_DATA.TILE_PROPERTIES.frameType == sap.m.FrameType.TwoByOne){
                that.getView().getViewData().parentController._updateTileModel(this.getTile().getModel().getData());
                that.getView().getViewData().deferredObj.resolve();
                sap.ushell.components.tiles.indicatorTileUtils.util.setUnsetCallInProgress(that.oConfig.TILE_PROPERTIES.id + "defferedRight",false);
            } else {
               /* var navTarget = sap.ushell.components.tiles.indicatorTileUtils.util.getNavigationTarget(that.oConfig,that.system);
                that.oKpiTileView.oGenericTile.$().wrap("<a href ='" + navTarget + "'/>");*/
                this.oKpiTileView.oGenericTile.setState(sap.m.LoadState.Loaded);
            }
            this.setToolTip(applyColor,calculatedValueForScaling,"DT");
            if (!sap.ushell.components.tiles.indicatorTileUtils.util.isDualTile(this.oConfig)) {
                if (that.chipCacheTime &&
                        !sap.ushell.components.tiles.indicatorTileUtils.util.isDualTile(this.oConfig)) {
                    sap.ushell.components.tiles.indicatorTileUtils.util.scheduleFetchDataJob.call(this, this.oTileApi.visible.isVisible());
                }
            }
        },

        getThresholdsObjAndColor : function(thresholdObject) {
            try {
                var oThresholdObjAndColor = {};
                oThresholdObjAndColor.arrObj = [];
                oThresholdObjAndColor.returnColor = sap.m.ValueColor.Neutral;
                var improvementDirection = this.DEFINITION_DATA.EVALUATION.GOAL_TYPE;
                //var evalValue = this.DEFINITION_DATA.EVALUATION_VALUES;
                var wL,cL,cH,wH;
                if (improvementDirection === "MI") {
                    cH = Number(thresholdObject.criticalHighValue) || 0;
                    wH = Number(thresholdObject.warningHighValue) || 0;
                    if (cH && wH) {
                        cH = window.parseFloat(cH);
                        wH = window.parseFloat(wH);
                        oThresholdObjAndColor.arrObj.push({value:cH,color:sap.m.ValueColor.Error});
                        oThresholdObjAndColor.arrObj.push({value:wH,color:sap.m.ValueColor.Critical});
                        if (this.CALCULATED_KPI_VALUE < wH) {
                            oThresholdObjAndColor.returnColor = sap.m.ValueColor.Good;
                        } else if (this.CALCULATED_KPI_VALUE <= cH) {
                            oThresholdObjAndColor.returnColor = sap.m.ValueColor.Critical;
                        } else {
                            oThresholdObjAndColor.returnColor = sap.m.ValueColor.Error;
                        }
                    }

                } else if (improvementDirection === "MA") {
                    cL = Number(thresholdObject.criticalLowValue) || 0;
                    wL = Number(thresholdObject.warningLowValue) || 0;
                    if (cL && wL) {
                        cL = window.parseFloat(cL);
                        wL = window.parseFloat(wL);
                        oThresholdObjAndColor.arrObj.push({value:cL,color:sap.m.ValueColor.Error});
                        oThresholdObjAndColor.arrObj.push({value:wL,color:sap.m.ValueColor.Critical});
                        if (this.CALCULATED_KPI_VALUE < cL) {
                            oThresholdObjAndColor.returnColor = sap.m.ValueColor.Error;
                        } else if (this.CALCULATED_KPI_VALUE <= wL) {
                            oThresholdObjAndColor.returnColor = sap.m.ValueColor.Critical;
                        } else {
                            oThresholdObjAndColor.returnColor = sap.m.ValueColor.Good;
                        }
                    }
                } else {
                    cH = Number(thresholdObject.criticalHighValue) || 0;
                    wH = Number(thresholdObject.warningHighValue) || 0;
                    cL = Number(thresholdObject.criticalLowValue) || 0;
                    wL = Number(thresholdObject.warningLowValue) || 0;
                    if (wL && wH && cL && cL) {
                        cH = window.parseFloat(cH);
                        wH = window.parseFloat(wH);
                        wL = window.parseFloat(wL);
                        cL = window.parseFloat(cL);
                        oThresholdObjAndColor.arrObj.push({value:cH,color:sap.m.ValueColor.Error});
                        oThresholdObjAndColor.arrObj.push({value:wH,color:sap.m.ValueColor.Critical});
                        oThresholdObjAndColor.arrObj.push({value:wL,color:sap.m.ValueColor.Critical});
                        oThresholdObjAndColor.arrObj.push({value:cL,color:sap.m.ValueColor.Error});
                        if (this.CALCULATED_KPI_VALUE < cL || this.CALCULATED_KPI_VALUE > cH) {
                            oThresholdObjAndColor.returnColor = sap.m.ValueColor.Error;
                        } else if ((this.CALCULATED_KPI_VALUE >= cL && this.CALCULATED_KPI_VALUE <= wL) ||
                                (this.CALCULATED_KPI_VALUE >= wH && this.CALCULATED_KPI_VALUE <= cH)
                        ) {
                            oThresholdObjAndColor.returnColor = sap.m.ValueColor.Critical;
                        } else {
                            oThresholdObjAndColor.returnColor = sap.m.ValueColor.Good;
                        }
                    }
                }
                return oThresholdObjAndColor;

            } catch (e) {
                this.logError(e);
            }
        },
        doDummyProcess : function(){
            var that = this;
            this.setTextInTile();
            that._updateTileModel({
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
            this.oKpiTileView.oGenericTile.setState(sap.m.LoadState.Loaded);
        }

    });
}());
