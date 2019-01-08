/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	'sap/chart/data/TimeDimension',
	'sap/chart/utils/MeasureSemanticsUtils',
	'sap/chart/utils/ChartUtils',
	'sap/chart/utils/DateFormatUtil',
	'sap/chart/data/MeasureSemantics',
	'sap/chart/ChartLog'
], function(
	TimeDimension,
	MeasureSemanticsUtils,
	ChartUtils,
	DateFormatUtil,
	MeasureSemantics,
	ChartLog
) {
	"use strict";

	function RoleMapper(sFeedingId) {
		this._bTimeFed = false;
	}

	RoleMapper.prototype.toFeedingId = function(oDim) {
		if (oDim instanceof TimeDimension && !this._bTimeFed) {
			this._bTimeFed = true;
			return "timeAxis";
		} else {
			return "@context";
		}
	};

	function isTimeChart(chartType) {
		return ChartUtils.CONFIG.timeChartTypes.indexOf(chartType) > -1;
	}

	function semanticBulletMsrs(aSemanticTuples, mMsrs, oMsrFeeds) {
		var oSemFeeds = {
			actualValues: [],
			targetValues: []
		};

		jQuery.each(aSemanticTuples, function(idx, oTuple) {
			if (oTuple.actual) {
				oSemFeeds.actualValues.push(mMsrs[oTuple.actual]);
				oTuple.valueAxisID = 'actualValues';
			}
			if (oTuple.projected) {
				oSemFeeds.actualValues.push(mMsrs[oTuple.projected]);	
				oTuple.valueAxisID = 'actualValues';
			}
			if (oTuple.reference) {
				if ((oTuple.actual || oTuple.projected)) {
					oSemFeeds.targetValues.push(mMsrs[oTuple.reference]);
					oTuple.valueAxisID = 'targetValues';
				} else {
					oSemFeeds.actualValues.push(mMsrs[oTuple.reference]);	
					oTuple.valueAxisID = 'actualValues';
				}
			}
		});

		delete oMsrFeeds["@semanticBulletMsrs"];

		jQuery.extend(oMsrFeeds, oSemFeeds);
	}

	function buildBulletMsrs(aSemanticTuples, oMsrFeeds){
		var aMsrs = oMsrFeeds["@semanticBulletMsrs"];
		if (aMsrs) {
			var oFeeds = {
				actualValues: []
			};
			for (var i = 0 ; i < aMsrs.length; i++) {
				oFeeds.actualValues.push(aMsrs[i]);
			}

			for (var i = 0 ; i < aSemanticTuples.length; i++) {
				aSemanticTuples[i].valueAxisID = 'actualValues';
			}

			delete oMsrFeeds["@semanticBulletMsrs"];

			jQuery.extend(oMsrFeeds, oFeeds);
		}
	}

	RoleMapper.semantics = {
		hasSemanticMeasures : function(oFeeds){
			return Object.keys(oFeeds.msrs).some(function(key){
				var result = false;
				var aMsrs = oFeeds.msrs[key];
				result = aMsrs.some(function(msr){
					if (msr.getSemantics) {
						var role = msr.getSemantics();
						return role && role !== 'actual';
					}
				});
				return result;
			});
		},
		semanticPatternMsrs : function(oFeeds, chartType, bIsInValidatedSemanticPattern){
			var aAllSemanticTuples = [], aAllSemanticContext = [], mMsrs = {}, hasValidSemanticRules, chartLog;
			//No color feeds and time axis's max size is 1
			var hasContinuesSemanticRules = isTimeChart(chartType) && (oFeeds.dims.timeAxis && oFeeds.dims.timeAxis.length === 1);

			var aMsrFeedingOrder = ['valueAxis', 'valueAxis2'];
			var aMsrFeedings = Object.keys(oFeeds.msrs).sort(function(sFeedA, sFeedB) {
				return aMsrFeedingOrder.indexOf(sFeedA) - aMsrFeedingOrder.indexOf(sFeedB);
			});
			var hasSemanticRules = this.hasSemanticMeasures(oFeeds);
			//Build internal semantic tuples structure. 
			aMsrFeedings.forEach(function(key){
				var aMsrs = oFeeds.msrs[key], aInvisibleMsrs;
				//Get a new Object which use measure name as key
				jQuery.extend(true, mMsrs, aMsrs.reduce(function(mMsrs, oMsr) {
					mMsrs[oMsr.getName()] = oMsr;
					return mMsrs;
				}, {}));

				if (chartType && chartType.indexOf('bullet') > -1 && oFeeds.invisibleMsrs) {
					aInvisibleMsrs = oFeeds.invisibleMsrs.filter(function(oMsr){
						return oMsr.getSemantics() === 'actual' && oMsr.getSemanticallyRelatedMeasures();
					});
				}

				if (jQuery.isEmptyObject(oFeeds.dims)) {
					chartLog = new ChartLog('error', 'Semantic Pattern', 
						"Semantic Pattern doesn't work when there is no dimension.");
					bIsInValidatedSemanticPattern = bIsInValidatedSemanticPattern || true;
				} else if (oFeeds.dims.color && oFeeds.dims.color.length > 0) {
					chartLog = new ChartLog('error', 'Semantic Pattern', 
						"Semantic pattern doesn't work when there is series dimension.");
					bIsInValidatedSemanticPattern = bIsInValidatedSemanticPattern || true;
				}

				var aSemanticTuples = MeasureSemanticsUtils.getTuples(aMsrs, aInvisibleMsrs, bIsInValidatedSemanticPattern);
				
				// hasSemanticRules = aSemanticTuples.filter(function(tuple){
				// 	//Only have actual meausre
				// 	return tuple.actual && !tuple.projected && !tuple.reference;
				// }).length !== aMsrs.length;
				
				aSemanticTuples.forEach(function(value){
					value.valueAxisID = key;
				});
				if (hasSemanticRules && bIsInValidatedSemanticPattern && chartLog) {
					chartLog.display();
				}
				aAllSemanticTuples = aAllSemanticTuples.concat(aSemanticTuples);
			});

			//Handle bullet chart
			if (chartType && chartType.indexOf('bullet') > -1) {
				hasContinuesSemanticRules = hasContinuesSemanticRules &&
					aAllSemanticTuples.some(function(tuple){
						return tuple.actual && tuple.projected;
					});
				hasValidSemanticRules = aAllSemanticTuples.some(function(tuple){
					return (tuple.actual && tuple.projected) || 
						(tuple.actual && tuple.reference) ||
						(tuple.projected && tuple.reference);
				});
				if (hasValidSemanticRules && (!hasContinuesSemanticRules)) {
					//Bullet has semantic relation. Bullet's feed should be changed.
					semanticBulletMsrs(aAllSemanticTuples, mMsrs, oFeeds.msrs);
				} else {
					//If no semantic relation, draw as simple bar. 
					buildBulletMsrs(aAllSemanticTuples, oFeeds.msrs);
				}
			}
					
			if ((!bIsInValidatedSemanticPattern) && hasContinuesSemanticRules) {
				var aSemanticContext = [];
				var filterContextMsr = function(oMsr){
					var filter = aSemanticContext.indexOf(oMsr.getName()) === -1;
					if (!filter) {
						aAllSemanticContext.push(oMsr);
					}
					return filter;
				};
				for (var i = 0 ; i < aAllSemanticTuples.length; i++) {
					var tuple = aAllSemanticTuples[i];					
					var timeAxis = oFeeds.dims.timeAxis[0];
					
					var projectedValueStartTime = timeAxis.getProjectedValueStartTime();
					if (projectedValueStartTime) {
						//Format startTime value according with timeUnit setting	
						var timeUnit = timeAxis.getTimeUnit(), startTime;
						if (timeUnit === 'fiscalyearperiod' || timeUnit === 'fiscalyear') {
							startTime = projectedValueStartTime;
						} else {
							var oDateInstance = DateFormatUtil.getInstance(timeUnit);
							if (oDateInstance) {
								if (oDateInstance.parse(projectedValueStartTime)) {
									startTime = oDateInstance.parse(projectedValueStartTime).getTime();
								}
							} else {
								startTime = new Date(projectedValueStartTime).getTime();
							}
						}
						if (startTime) {
							var oCurMsr = oFeeds.msrs[tuple.valueAxisID];
							if (tuple.actual && tuple.projected) {
								tuple.timeAxis = oFeeds.dims.timeAxis[0].getName();
								tuple.projectedValueStartTime = startTime;
								tuple.semanticMsrName = tuple.actual + "-" + tuple.projected;
								aSemanticContext.push(tuple.actual);
								aSemanticContext.push(tuple.projected);
								oCurMsr.push(mMsrs[tuple.actual].clone().setName(tuple.semanticMsrName));
							}
							oFeeds.msrs[tuple.valueAxisID] = oCurMsr.filter(filterContextMsr);			
						} else {
							chartLog = new ChartLog('error', 'Semantic Pattern', "The value of projectedValueStartTime is invalid.");
							chartLog.display();
						}
					}
				}
			}
			if ((aAllSemanticTuples.length > 0) && (!bIsInValidatedSemanticPattern)) {
				//Reorder feed's measures
				var aAllSemanticTuplesList = [];
				var aMsrOrder = ['actual', 'projected', 'semanticMsrName', 'reference'];

				aAllSemanticTuples.forEach(function(elem){
					for (var i = 0; i < aMsrOrder.length; i++) {
						if (elem[aMsrOrder[i]]) {
							aAllSemanticTuplesList.push(elem[aMsrOrder[i]]);	
						}
					}
				});
				jQuery.each(oFeeds.msrs, function(key){
					oFeeds.msrs[key].sort(function(a, b){
						return aAllSemanticTuplesList.indexOf(a.getName()) - aAllSemanticTuplesList.indexOf(b.getName());
					});
				});
			}

			return {
				semanticTuples : aAllSemanticTuples,
				contexts: aAllSemanticContext
			};
		}
	};

	return RoleMapper;
});
