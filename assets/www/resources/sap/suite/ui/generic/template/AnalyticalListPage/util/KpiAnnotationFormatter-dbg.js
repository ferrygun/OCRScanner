// Copyright (c) 2009-2014 SAP SE, All Rights Reserved
/**
* @fileOverview This file contains miscellaneous utility functions.
*/
sap.ui.define([
	"sap/suite/ui/generic/template/AnalyticalListPage/util/KpiUtil",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/V4Terms",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/KpiAnnotationHelper"
	],
	function(KpiUtil, V4Terms, KpiAnnotationHelper) {
		"use strict";

		jQuery.sap.declare("sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter");

		sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter = {};
		sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter.formatFunctions = {
			count: 0
		};
		sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter.NumberFormatFunctions = {};

		sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter.criticalityConstants = {
			StateValues: {
				None: "None",
				Negative: "Error",
				Critical: "Warning",
				Positive: "Success"
			},
			ColorValues: {
				None: "Neutral",
				Negative: "Error",
				Critical: "Critical",
				Positive: "Good"
			}
		};

		function criticality2state(criticality, oCriticalityConfigValues) {
			var sState;
			if (oCriticalityConfigValues) {
				sState = oCriticalityConfigValues.None;
				if (criticality && criticality.EnumMember) {
					var val = criticality.EnumMember;
					if (endsWith(val, "Negative")) {
						sState = oCriticalityConfigValues.Negative;
					} else if (endsWith(val, "Critical")) {
						sState = oCriticalityConfigValues.Critical;
					} else if (endsWith(val, "Positive")) {
						sState = oCriticalityConfigValues.Positive;
					}
				}
			}
			return sState;
		}

		function endsWith(sString, sSuffix) {
			return sString && sString.indexOf(sSuffix, sString.length - sSuffix.length) !== -1;
		}
		/**
		* This function calculates criticality state;
		* @param	{string} sImproveDirection ImprovementDirection value
		* @param	{number} toleranceLow toleranceLow value from annotations
		* @param	{number} toleranceHigh deviationLow value from annotations
		* @param  {number} deviationLow toleranceHigh value from annotations
		* @param  {number} deviationHigh toleranceHigh value from annotations
		* @param 	{number} value Value for comparison
		* @param	{object} oCriticalityConfigValues different criticality values;
		*/
		function calculateCriticalityState(value, sImproveDirection, deviationLow, deviationHigh, toleranceLow, toleranceHigh,
			oCriticalityConfigValues) {

			var oCriticality = {};
			oCriticality.EnumMember = "None";

			// number could be a zero number so check if it is not undefined
			if (value !== undefined) {
				value = Number(value);
				if (endsWith(sImproveDirection, "Minimize") || endsWith(sImproveDirection, "Minimizing")) {
					oCriticality.EnumMember = "None";
					if (toleranceHigh || deviationHigh) {
						if (value <= toleranceHigh) {
							oCriticality.EnumMember = "Positive";
						} else if (value > deviationHigh) {
							oCriticality.EnumMember = "Negative";
						} else {
							oCriticality.EnumMember = "Critical";
						}
					}
				} else if (endsWith(sImproveDirection, "Maximize") || endsWith(sImproveDirection, "Maximizing")) {
					oCriticality.EnumMember = "None";
					if (toleranceLow || deviationLow) {
						if (value >= toleranceLow) {
							oCriticality.EnumMember = "Positive";
						} else if (value < deviationLow) {
							oCriticality.EnumMember = "Negative";
						} else {
							oCriticality.EnumMember = "Critical";
						}
					}

				} else if (endsWith(sImproveDirection, "Target")) {
					oCriticality.EnumMember = "None";
					if (toleranceLow && toleranceHigh) {
						if (value >= toleranceLow && value <= toleranceHigh) {
							oCriticality.EnumMember = "Positive";
						} else if (value < deviationLow || value > deviationHigh) {
							oCriticality.EnumMember = "Negative";
						} else {
							oCriticality.EnumMember = "Critical";
						}
					}
				}
			}

			return criticality2state(oCriticality, oCriticalityConfigValues);
		}

		/* Trend Direction for Header */
		function calculateTrendDirection(aggregateValue, referenceValue, upDifference, downDifference) {
			if (!aggregateValue || !referenceValue) {
				return;
			}

			aggregateValue = Number(aggregateValue);

			if (!upDifference && (aggregateValue - referenceValue >= 0)) {
				return "Up";
			}
			if (!downDifference && (aggregateValue - referenceValue <= 0)) {
				return "Down";
			}

			if (referenceValue && upDifference && (aggregateValue - referenceValue >= upDifference)) {
				return "Up";
			}
			if (referenceValue && downDifference && (aggregateValue - referenceValue <= downDifference)) {
				return "Down";
			}
		}

		/**
		* @private
		* [calculateFieldContentWithScale  this function calculates  KPI value]
		* @param  {object} aggregateValue            [KPI vlaue]
		* @param  {number} nNumberOfFractionalDigits [NumberOfFractionalDigits from the Datapoint value format annotation]
		* @param  {decimal} fScaleFactor 			 [scale factor from the data point annotation]
		* @param {string} sUnitOfMeasure 			 [Unit of Measure defined for the value]
		* @return {number}                           [returns the formatted KPI Value]
		*/
		function calculateFieldContentWithScale(value, nNumberOfFractionalDigits, fScaleFactor, sUnitOfMeasure) {
			//var bShowScale = !fScaleFactor;//If scalefactor is present in the annotation, don't display scale and vice versa
			var bShowScale = true;
			var sValue = KpiUtil.formatNumberForPresentation(value, bShowScale, nNumberOfFractionalDigits, fScaleFactor);
			return sValue + " " + ( sUnitOfMeasure ? sUnitOfMeasure : "" );
		}

		/**
		* @private
		* [calculateDeviationValue  this function calculates deviation from KPI value and TargetValue ]
		* @param  {object} aggregateValue            [KPI vlaue]
		* @param  {number} nNumberOfFractionalDigits [NumberOfFractionalDigits from the Datapoint value format annotation]
		* @param  {number} targetValue               [TargetValue from datapoint annotation]
		* @param  {decimal} fScaleFactor 			 [scale factor from the data point annotation]
		* @param {string} sUnitOfMeasure 			 [Unit of Measure defined for the value]
		* @return {number}                           [returns the deviationValue]
		*/
		function calculateDeviationValue(aggregateValue, nNumberOfFractionalDigits, targetValue, fScaleFactor, sUnitOfMeasure) {
			//var bShowScale = !fScaleFactor;//If scalefactor is present in the annotation, don't display scale and vice versa
			var bShowScale = true;
			if (!aggregateValue) {
				return ;
			}
			aggregateValue = Number(aggregateValue);
			var iDeviationValue = aggregateValue - targetValue;
			var iDeviationReturnValue = KpiUtil.formatNumberForPresentation(iDeviationValue, bShowScale, nNumberOfFractionalDigits, fScaleFactor);
			return iDeviationReturnValue + " " +  ( sUnitOfMeasure ? sUnitOfMeasure : "" );
		}

		function calculateReference(value, referenceValue, relative) {
			if (!referenceValue) {
				return;
			}
			referenceValue = Number(referenceValue);
			if (relative) {
				return referenceValue + "%";
			}
			return referenceValue;
		}


		/**
		 * @private
		 * [calculateTarget formats the the targetValue]
		 * @param  {string} value 				[Value to be formatted]
		 * @param  {number} targetValue 			[TargetValue from datapoint annotation]
		 * @param  {number} nNumberOfFractionalDigits   [numberOfFractionalDigits number ]
		 * @param  {decimal} fScaleFactor 				[scale factor from the data point annotation]
		 * @param  {string} sUnitOfMeasure 			 [Unit of Measure defined for the value]
		 * @return {sap.ui.core.format.NumberFormat}	[returns the float instance of the NumberFormat]
		 */
		function calculateTarget(value, targetValue, nNumberOfFractionalDigits, fScaleFactor, sUnitOfMeasure) {
			//var bShowScale = !fScaleFactor;//If scalefactor is present in the annotation, don't display scale and vice versa
			var bShowScale = true;
			if (!targetValue) {
				return ;
			} else {
				targetValue = Number(targetValue);
				var targetReturnValue = KpiUtil.formatNumberForPresentation(targetValue, bShowScale, nNumberOfFractionalDigits, fScaleFactor);
				return targetReturnValue + " " + ( sUnitOfMeasure ? sUnitOfMeasure : "" );
			}
		}

		/**
		 * [resolvePathForKpiTargetValue Creates binding path for NumericContent target value]
		 * @param  {object} iContext   [current context]
		 * @param  {object} oDataPoint [datapoint object from the annotation]
		 * @return {*}            		[returns binding path for KPI target value ]
		 */
		sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter.resolvePathForKpiTargetValue = function(iContext, oDataPoint) {
			if (!oDataPoint || !oDataPoint.Value || !oDataPoint.TargetValue  ) {
				return "";
			}
			var oSettings = iContext.getSetting("settings").getData();
			var value =  KpiUtil.getPathOrPrimitiveValue(oDataPoint.Value);
			var targetValue = KpiUtil.getPathOrPrimitiveValue(oDataPoint.TargetValue);
			var oModel = iContext.getSetting("dataModel");
			var oMetaModel = oModel.getMetaModel();
			var oEntitySet = oMetaModel.getODataEntitySet(oSettings.entitySet);
			var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
			var oEntityTypeProperty = oMetaModel.getODataProperty(oEntityType, oDataPoint.Value.Path);
			var sUnitOfMeasure = KpiUtil.getUnitofMeasure(oSettings.model, oEntityTypeProperty);
			var bIsTargetValBinding = KpiUtil.isBindingValue(targetValue);
			var bIsKpiValBinding = KpiUtil.isBindingValue(value);
			var nNumberOfFractionalDigits = 0 ;
			var fScaleFactor;
			if ( oDataPoint.ValueFormat) {
				nNumberOfFractionalDigits = KpiUtil.getPathOrPrimitiveValue(oDataPoint.ValueFormat.NumberOfFractionalDigits);
				fScaleFactor = KpiUtil.getPathOrPrimitiveValue(oDataPoint.ValueFormat.ScaleFactor);
			}
			var isUnitofMeasurei18n = sUnitOfMeasure.match(/{@i18n>.+}/gi);
			var bIsUoMValBinding = KpiUtil.isBindingValue(sUnitOfMeasure) && !isUnitofMeasurei18n;

			var bIsPercent = false;
			var sParts = "parts: [" + (bIsKpiValBinding ? value : "{path: 'DUMMY'}");  // parts has to constructed without the value
			sParts += bIsTargetValBinding ? "," + targetValue : "";
			sParts += bIsUoMValBinding && !isUnitofMeasurei18n ? "," + sUnitOfMeasure : "";
			sParts += "]";
			if (sUnitOfMeasure === "%") {
				bIsPercent = true;
			}

			if (nNumberOfFractionalDigits === "" || nNumberOfFractionalDigits === undefined) {
				nNumberOfFractionalDigits = 0;
				if (bIsPercent) {
					nNumberOfFractionalDigits = 1;
				}
			}
			fScaleFactor =  fScaleFactor == "" ?  undefined : fScaleFactor;

			var formatFunc = function() {
				var index = 1;
				if (bIsPercent) {
					return calculateTarget( bIsKpiValBinding ? arguments[0] : value,
						bIsTargetValBinding ? arguments[index++] : targetValue,
						nNumberOfFractionalDigits,
						fScaleFactor,
						bIsUoMValBinding ? arguments[index++] : sUnitOfMeasure
					);
				} else {
					return calculateTarget( bIsKpiValBinding ? arguments[0] : value,
						bIsTargetValBinding ? arguments[index++] : targetValue,
						nNumberOfFractionalDigits,
						fScaleFactor
					);
				}
			};

			var sFormatFuncName = setFormatFunctionAndGetFunctionName(formatFunc, "formatReferenceValueCalculation");
			return "{" + sParts + ", formatter: '" + sFormatFuncName + "'}";

		};


		/* Creates binding path for NumericContent referenceValue  */
		sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter.resolvePathForKpiReferenceValue = function(iContext, oDataPoint) {
			//var oSettings = iContext.getSetting("settings").getData();
			var value =  KpiUtil.getPathOrPrimitiveValue(oDataPoint.Value);
			var referenceValue = KpiUtil.getPathOrPrimitiveValue(oDataPoint.TrendCalculation.ReferenceValue);
			var relative = KpiUtil.isRelative(oDataPoint);
			var bIsRefValBinding = KpiUtil.isBindingValue(referenceValue);
			var sParts = "parts: [" + value;
			sParts += bIsRefValBinding ? "," + referenceValue : "";
			sParts += "]";
			var formatFunc = function() {
				var index = 1;
				return calculateReference(
					arguments[0],
					bIsRefValBinding ? arguments[index++] : referenceValue,
					relative
					);
			};
			var sFormatFuncName = setFormatFunctionAndGetFunctionName(formatFunc, "formatReferenceValueCalculation");
			return "{" + sParts + ", formatter: '" + sFormatFuncName + "'}";
		};


		/**
		* [resolvePathForKpiValue Creates binding path for NumericContent KPI value ]
		* @param  {object} iContext  current binding context
		* @param  {object} oDataPoint datapoint object from annotation
		* @return {sap.ui.core.format.NumberFormat} returns binding path to resolve KPI value in number format
		*/
		sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter.resolvePathForKpiValue = function(iContext, oDataPoint) {
			if (!oDataPoint || !oDataPoint.Value) {
				return "";
			}

			var oSettings = iContext.getSetting("settings").getData();
			var oModel = iContext.getSetting("dataModel");
			var oMetaModel = oModel.getMetaModel();
			var oEntitySet = oMetaModel.getODataEntitySet(oSettings.entitySet);
			var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
			var oEntityTypeProperty = oMetaModel.getODataProperty(oEntityType, oDataPoint.Value.Path);
			var sUnitOfMeasure = KpiUtil.getUnitofMeasure(oSettings.model , oEntityTypeProperty);
			var oSettings = iContext.getSetting("settings").getData();
			var value = KpiUtil.getPathOrPrimitiveValue(oDataPoint.Value);
			var isUnitofMeasurei18n = sUnitOfMeasure.match(/{@i18n>.+}/gi);
			var bIsUoMValBinding = KpiUtil.isBindingValue(sUnitOfMeasure) && !isUnitofMeasurei18n;
			var bIsKpiValBinding = KpiUtil.isBindingValue(value);

			var sParts = "parts: [" + (bIsKpiValBinding ? value : "{path: 'DUMMY'}");
			sParts += bIsUoMValBinding && !isUnitofMeasurei18n ? "," + sUnitOfMeasure : "";
			sParts += "]";

			var bIsPercent = false;
			if (sUnitOfMeasure === "%") {
				bIsPercent = true;
			}
			var nNumberOfFractionalDigits = 0 ;
			var fScaleFactor;
			if ( oDataPoint.ValueFormat) {
				nNumberOfFractionalDigits = KpiUtil.getPathOrPrimitiveValue(oDataPoint.ValueFormat.NumberOfFractionalDigits);
				fScaleFactor = KpiUtil.getPathOrPrimitiveValue(oDataPoint.ValueFormat.ScaleFactor);
			}
			if (nNumberOfFractionalDigits === "" || nNumberOfFractionalDigits === undefined) { //when numerofFractional Digits not specified in Annotations
				nNumberOfFractionalDigits = 0; // 0 for absolute value
				if (bIsPercent) {
					nNumberOfFractionalDigits = 1; // 1 for percentage based value
				}
			}
			fScaleFactor =  fScaleFactor == "" ?  undefined : fScaleFactor;
			var formatFunc = function() {
				var index = 1;
				if (bIsPercent) {
					return calculateFieldContentWithScale(
						bIsKpiValBinding ? arguments[0] : value,
						nNumberOfFractionalDigits,
						fScaleFactor,
						bIsUoMValBinding ? arguments[index++] : sUnitOfMeasure
					);
				} else {
					return calculateFieldContentWithScale(
						bIsKpiValBinding ? arguments[0] : value,
						nNumberOfFractionalDigits,
						fScaleFactor
					);
				}
			};
			var sFormatFuncName = setFormatFunctionAndGetFunctionName(formatFunc, "formatFieldWithScaleCalculation");
			return "{" + sParts + ", formatter: '" + sFormatFuncName + "'}";
		};

		sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter.resolveKpiHeaderState = function(iContext, oDataPoint) {
			return formatDataPointToValue(iContext, oDataPoint, sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter.criticalityConstants.ColorValues);
		};

		/**
		 * [resolvePathForDeviation resolves binding parth for deviation]
		 * @param  {object} iContext   [current binding context]
		 * @param  {object} oDataPoint [datapoint object from the annotaion]
		 * @return {*}            [returns binding path for deviation]
		 */
		sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter.resolvePathForDeviation = function(iContext, oDataPoint) {
			if (!oDataPoint || !oDataPoint.Value || !oDataPoint.TargetValue ) { // removed this check as currently deviation is not from calculated from trend  "!oDataPoint.TrendCalculation"
				return "";
			}
			var oSettings = iContext.getSetting("settings").getData();
			var value = KpiUtil.getPathOrPrimitiveValue(oDataPoint.Value);
			var targetValue = KpiUtil.getPathOrPrimitiveValue(oDataPoint.TargetValue);
			var oModel = iContext.getSetting("dataModel");
			var oMetaModel = oModel.getMetaModel();
			var oEntitySet = oMetaModel.getODataEntitySet(oSettings.entitySet);
			var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
			var oEntityTypeProperty = oMetaModel.getODataProperty(oEntityType, oDataPoint.Value.Path);
			var sUnitOfMeasure = KpiUtil.getUnitofMeasure(oSettings.model, oEntityTypeProperty);
			var bIsTargetValBinding = KpiUtil.isBindingValue(targetValue);
			var isUnitofMeasurei18n = sUnitOfMeasure.match(/{@i18n>.+}/gi);
			var bIsUoMValBinding = KpiUtil.isBindingValue(sUnitOfMeasure) && !isUnitofMeasurei18n;
			var bIsKpiValBinding = KpiUtil.isBindingValue(value);
			var bIsPercent = false ;
			var nNumberOfFractionalDigits = 0 ;
			var fScaleFactor ;
			if (oDataPoint.ValueFormat) {
				nNumberOfFractionalDigits = KpiUtil.getPathOrPrimitiveValue(oDataPoint.ValueFormat.NumberOfFractionalDigits);
				fScaleFactor = KpiUtil.getPathOrPrimitiveValue(oDataPoint.ValueFormat.ScaleFactor);
			}
			var sParts = "parts: [" + (bIsKpiValBinding ? value : "{path: 'DUMMY'}");
			sParts += bIsTargetValBinding ? "," + targetValue : "";
			sParts += bIsUoMValBinding  && !isUnitofMeasurei18n ? "," + sUnitOfMeasure : "";
			sParts += "]";
			if (sUnitOfMeasure === "%") {
				bIsPercent = true;
			}
			if (nNumberOfFractionalDigits === "" || nNumberOfFractionalDigits === undefined) {
				nNumberOfFractionalDigits = 0;
				if (bIsPercent) {
					nNumberOfFractionalDigits = 1;
				}
			}
			fScaleFactor =  fScaleFactor == "" ?  undefined : fScaleFactor;
			var formatFunc = function() {
				var index = 1 ;
				if (bIsPercent) {
					return calculateDeviationValue(
						bIsKpiValBinding ? arguments[0] : value,
						nNumberOfFractionalDigits,
						bIsTargetValBinding ? arguments[index++] : targetValue,
						fScaleFactor,
						bIsUoMValBinding ? arguments[index++] : sUnitOfMeasure
					);
				} else {
					return calculateDeviationValue(
						bIsKpiValBinding ? arguments[0] : value,
						nNumberOfFractionalDigits,
						bIsTargetValBinding ? arguments[index++] : targetValue,
						fScaleFactor
					);
				}
			};

			var sFormatFuncName = setFormatFunctionAndGetFunctionName(formatFunc, "formatDeviationCalculation");
			return "{" + sParts + ", formatter: '" + sFormatFuncName + "'}";
		};

		sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter.resolvePathForTrendIcon = function(iContext, oDataPoint) {
			if (!oDataPoint || !oDataPoint.Value || !oDataPoint.Value.Path || !oDataPoint.TrendCalculation) {
				return "";
			}

			//var oSettings = iContext.getSetting("settings").getData();

			if (oDataPoint.Trend) {
				var trend = KpiUtil.getPathOrPrimitiveValue(oDataPoint.Trend);
				return trend;
			}

			var value = KpiUtil.getPathOrPrimitiveValue(oDataPoint.Value);
			var referenceValue = KpiUtil.getPathOrPrimitiveValue(oDataPoint.TrendCalculation.ReferenceValue);
			var downDifference = KpiUtil.getPathOrPrimitiveValue(oDataPoint.TrendCalculation.DownDifference);
			var upDifference = KpiUtil.getPathOrPrimitiveValue(oDataPoint.TrendCalculation.UpDifference);

			var bIsRefValBinding = KpiUtil.isBindingValue(referenceValue);
			var bIsDownDiffBinding = KpiUtil.isBindingValue(downDifference);
			var bIsUpDiffBinding = KpiUtil.isBindingValue(upDifference);

			var sParts = "parts: [" + value;
			sParts += bIsRefValBinding ? "," + referenceValue : "";
			sParts += bIsDownDiffBinding ? "," + downDifference : "";
			sParts += bIsUpDiffBinding ? "," + upDifference : "";
			sParts += "]";

			var formatFunc = function() {
				var index = 1;
				return calculateTrendDirection(
					arguments[0],
					bIsRefValBinding ? arguments[index++] : referenceValue,
					bIsDownDiffBinding ? arguments[index++] : downDifference,
					bIsUpDiffBinding ? arguments[index++] : upDifference
					);
			};

			var sFormatFuncName = setFormatFunctionAndGetFunctionName(formatFunc, "formatTrendDirection");
			return "{" + sParts + ", formatter: '" + sFormatFuncName + "'}";
		};

		/**
		 * [formatDPTitle formats the KPI Card Title]
		 * @param  {object} iContext   [current binding context]
		 * @param  {object} oDataPoint [datapoint object from the annotaion]
		 * @return {*}            [returns binding path for KPI Card Title]
		 */
		sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter.formatDPTitle = function(iContext, oDataPoint) {

			var oSettings = iContext.getSetting("settings").getData();
			var oModel = iContext.getSetting("dataModel");
			var oMetaModel = oModel.getMetaModel();
			var oEntitySet = oMetaModel.getODataEntitySet(oSettings.entitySet);
			var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);

			var oEntityTypeProperty = oMetaModel.getODataProperty(oEntityType, oDataPoint.Value.Path);
			var sTitle = KpiUtil.getPathOrPrimitiveValue(oDataPoint.Title);
			var result = "", sUnit = "";

			//Add unit using path or string
			if (oEntityTypeProperty["Org.OData.Measures.V1.Unit"]) {
				var oUnit = oEntityTypeProperty["Org.OData.Measures.V1.Unit"];
				sUnit = KpiUtil.getPathOrPrimitiveValue(oUnit);
			} else if (oEntityTypeProperty["Org.OData.Measures.V1.ISOCurrency"]) {
				var oCurrency = oEntityTypeProperty["Org.OData.Measures.V1.ISOCurrency"];
				sUnit = KpiUtil.getPathOrPrimitiveValue(oCurrency);
			}

			var bIsUnitBinding = KpiUtil.isBindingValue(sUnit) && !sUnit.match(/{@i18n>.+}/gi),
				bIsTitleBinding = KpiUtil.isBindingValue(sTitle);

			var formatFunc = function(unit, title) {
				title = title || sTitle;
				unit = unit || sUnit;

				var bIsPercent = (sUnit === "%");

				if (unit === undefined) {
					return title;
				} else {
					//i18nstring valu is only parsed if the value isn't "%"
					if (!bIsPercent) {
						//Unit is first checked if it's i18n & then it's corresponding value is retrieved
						if (unit.match(/{@i18n>.+}/gi)) {
							return this.getModel('i18n').getResourceBundle().getText("KPI_CARD_TITLE_UNIT", [title, this.getModel('i18n').getResourceBundle().getText(unit.substring(7, sUnit.length - 1))]);
						} else {
							//else only unit is passed as the value to the key
							return this.getModel('i18n').getResourceBundle().getText("KPI_CARD_TITLE_UNIT", [title, unit]);
						}
					} else {
						//if it's "%" only title is shown with it.
						return title;
					}
				}
			};

			var sFormatFuncName = setFormatFunctionAndGetFunctionName(formatFunc, "formatTitleForDP");

			var sParts = "[" + (bIsUnitBinding ? sUnit : "{path:'DUMMY'}") + ", " +
				(bIsTitleBinding ? sTitle : "{path: 'DUMMY'}") + "]";

			result = "{parts: " + sParts + ", formatter: '" + sFormatFuncName + "'}";

			return result;
		};

		function formatDataPointToValue(iContext, oDataPoint, oCriticalityConfigValues) {
			var sState = oCriticalityConfigValues.None;
			if (oDataPoint.Criticality) {
				var criticality = oDataPoint.Criticality ? oDataPoint.Criticality.EnumMember.split("/")[1] : undefined;
				var bIsCriticalityBinding = KpiUtil.isBindingValue(criticality);
				if (bIsCriticalityBinding) {
					sState = criticality;
				} else {
					sState = criticality2state(oDataPoint.Criticality, oCriticalityConfigValues);
				}

			} else if (oDataPoint.CriticalityCalculation && oDataPoint.Value && oDataPoint.Value) {
				sState = formThePathForCriticalityStateCalculation(iContext, oDataPoint, oCriticalityConfigValues);
			}

			return sState;
		}


		function formThePathForCriticalityStateCalculation(iContext, oDataPoint, oCriticalityConfigValues) {
			//var oSettings = iContext.getSetting("settings").getData();
			var value = KpiUtil.getPathOrPrimitiveValue(oDataPoint.Value);
			var bIsKpiValBinding = KpiUtil.isBindingValue(value);
			var sImprovementDirection = oDataPoint.CriticalityCalculation.ImprovementDirection.EnumMember;

			var deviationLow = oDataPoint.CriticalityCalculation.DeviationRangeLowValue ? KpiUtil.getPathOrPrimitiveValue(oDataPoint.CriticalityCalculation.DeviationRangeLowValue) : undefined;
			var deviationHigh = oDataPoint.CriticalityCalculation.DeviationRangeHighValue ? KpiUtil.getPathOrPrimitiveValue(oDataPoint.CriticalityCalculation.DeviationRangeHighValue) : undefined;
			var toleranceLow = oDataPoint.CriticalityCalculation.ToleranceRangeLowValue ? KpiUtil.getPathOrPrimitiveValue(oDataPoint.CriticalityCalculation.ToleranceRangeLowValue) : undefined;
			var toleranceHigh = oDataPoint.CriticalityCalculation.ToleranceRangeHighValue ? KpiUtil.getPathOrPrimitiveValue(oDataPoint.CriticalityCalculation.ToleranceRangeHighValue) : undefined;

			var bIsDeviationLowBinding = KpiUtil.isBindingValue(deviationLow);
			var bIsDeviationHighBinding = KpiUtil.isBindingValue(deviationHigh);
			var bIsToleranceLowBinding = KpiUtil.isBindingValue(toleranceLow);
			var bIsToleranceHighBinding = KpiUtil.isBindingValue(toleranceHigh);

			var sParts = "parts: [" + (bIsKpiValBinding ? value : "{path:'DUMMY'}");
			sParts += bIsDeviationLowBinding ? "," + deviationLow : "";
			sParts += bIsDeviationHighBinding ? "," + deviationHigh : "";
			sParts += bIsToleranceLowBinding ? "," + toleranceLow : "";
			sParts += bIsToleranceHighBinding ? "," + toleranceHigh : "";
			sParts += "]";

			var formatFunc = function() {
				var index = 1;
				return calculateCriticalityState(
					bIsKpiValBinding ? arguments[0] : value,
					sImprovementDirection,
					bIsDeviationLowBinding ? arguments[index++] : deviationLow,
					bIsDeviationHighBinding ? arguments[index++] : deviationHigh,
					bIsToleranceLowBinding ? arguments[index++] : toleranceLow,
					bIsToleranceHighBinding ? arguments[index++] : toleranceHigh,
					oCriticalityConfigValues
					);
			};

			var sFormatFuncName = setFormatFunctionAndGetFunctionName(formatFunc, "formatCriticalityCalculation");
			return "{" + sParts + ", formatter: '" + sFormatFuncName + "'}";
		}

		function setFormatFunctionAndGetFunctionName(func, sNamePrefix) {
			if (!sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter.formatFunctions[sNamePrefix]) {
				sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter.formatFunctions[sNamePrefix] = 0;
			}
			sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter.formatFunctions[sNamePrefix]++;

			var sFuncName = sNamePrefix + sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter.formatFunctions[sNamePrefix];
			sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter.formatFunctions[sFuncName] = func;

			return "sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter.formatFunctions." + sFuncName;
		}

		sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter.getAggregateNumber = function(iContext, oEntitySet, oDataPoint, oSelectionVariant, oSettings) {
			var aSelectOptions = oSelectionVariant && oSelectionVariant.SelectOptions;
			//var oSelectOption, sPropertyPath, oRange;
			var sPropertyPath;

			var filtersString = ",filters:";

			var filtersArray = [];

			if (aSelectOptions) {
				aSelectOptions.forEach(function(oSelectOption) {
					sPropertyPath = oSelectOption.PropertyName.PropertyPath;
					oSelectOption[sPropertyPath].forEach(function(oRange) {
						if (oRange.Sign.EnumMember === V4Terms.SelectionRangeSignType + "/I" || oRange.Sign.EnumMember === V4Terms.SelectionRangeSignType + "/E") {
								if (oRange.Low){
									filtersArray.push(KpiUtil.getFilter(oRange, oSelectOption));
								}
						}
						});
				});
			}
			var measure = oDataPoint && oDataPoint.Value && oDataPoint.Value.Path;
			var target = oDataPoint && oDataPoint.TargetValue && oDataPoint.TargetValue.Path;
			var ret = "";

			filtersString += JSON.stringify(filtersArray);

			var sPath = KpiAnnotationHelper.resolveParameterizedEntitySet(iContext.getSetting("dataModel"), oEntitySet, oSelectionVariant);
			ret += "{path: '" + sPath + "',length:1";

			var oEntityType = oSettings.metaModel.getODataEntityType(oEntitySet.entityType, false);
			var oEntityTypeProperty = oSettings.metaModel.getODataProperty(oEntityType, measure);
			var unitColumn = oEntityTypeProperty && oEntityTypeProperty[V4Terms.Unit] && oEntityTypeProperty[V4Terms.Unit].Path;
			var currency = oEntityTypeProperty && oEntityTypeProperty[V4Terms.ISOCurrency] && oEntityTypeProperty[V4Terms.ISOCurrency].Path;

			var selectArr = [];
			selectArr.push(measure);
			if (unitColumn) {
				selectArr.push(unitColumn);
			}
			if (target) {
				selectArr.push(target);
			}
			if (currency) {
				selectArr.push(currency);
			}
			if (oDataPoint.TrendCalculation && oDataPoint.TrendCalculation.ReferenceValue && oDataPoint.TrendCalculation.ReferenceValue.Path) {
				selectArr.push(oDataPoint.TrendCalculation.ReferenceValue.Path);
			}

			return ret + ", parameters:{select:'" + selectArr.join(",") + "'}" + filtersString + "}";
		};

		sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter.getAggregateNumber.requiresIContext = true;
		sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter.resolveKpiHeaderState.requiresIContext = true;
		sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter.resolvePathForTrendIcon.requiresIContext = true;
		sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter.resolvePathForKpiValue.requiresIContext = true;
		sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter.resolvePathForDeviation.requiresIContext = true;
		sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter.resolvePathForKpiTargetValue.requiresIContext = true;
		sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter.formatDPTitle.requiresIContext = true;

		/*function getUnitColumn(measure, oEntityType) {
			var properties = oEntityType.property;
			for (var i = 0, len = properties.length; i < len; i++) {
				if (properties[i].name == measure) {
					if (properties[i].hasOwnProperty("sap:unit")) {
						return properties[i]["sap:unit"];
					}
					break;
				}
			}
			return null;
		}*/
		return sap.suite.ui.generic.template.AnalyticalListPage.util.KpiAnnotationFormatter;
	}, true);
