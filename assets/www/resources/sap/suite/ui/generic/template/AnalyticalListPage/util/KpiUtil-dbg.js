sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/Context",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/V4Terms"
	],	function(BaseObject, Context, V4Terms) {
		"use strict";
		var KpiUtil = BaseObject.extend("sap.suite.ui.generic.template.AnalyticalListPage.util.KpiUtil");

		/**
		 * [getNumberValue parses the oValue into the number value based on the type ]
		 * @param  {object} oValue [value]
		 * @return {number}        [returns the value in the number format  ]
		 */
		KpiUtil.getNumberValue = function (oValue) {
		//Here the oValue obj always returns one key which is either of value present in the array.
			if (oValue) {
				var val = Object.keys(oValue)[0];
				return (oValue && val && ["String","Int","Decimal","Double","Single"].indexOf(val) !== -1 ) ? Number(oValue[val]) : undefined;
			}
		};
		/**
		 * [getBooleanValue  get the boolean value ]
		 * @param  {object} oValue   [Value]
		 * @param  {boolean} bDefault [default value ]
		 * @return {boolean}          [returns true/false based on the value]
		 */
		KpiUtil.getBooleanValue = function(oValue, bDefault){
			if (oValue && oValue.Bool) {
				if (oValue.Bool.toLowerCase() === "true") {
					return true;
				} else if (oValue.Bool.toLowerCase() === "false") {
					return false;
				}
			}
			return bDefault;
		};


		/**
		 * [getPrimitiveValue returns the value with respective type]
		 * @param  {object} oValue [description]
		 * @return {*}        [returns the primitive type]
		 */
		KpiUtil.getPrimitiveValue = function (oValue) {
			var value;
			if (oValue) {
				if (oValue.String ) {
					value = oValue.String;
					if (value.indexOf(">") > 0) {
						value = value.replace(/[{}]/g, "");
					}
				} else if (oValue.Bool) {
					value = KpiUtil.getBooleanValue(oValue);
				} else if (oValue.EnumMember){
					value = oValue.EnumMember.split("/")[1];
				} else {
					value = KpiUtil.getNumberValue(oValue);
				}
			}
			return value;
		};

		/**
		 * [getPathOrPrimitiveValue returns the path of the oItem ]
		 * @param  {object} oModel [model name against which path to be verified]
		 * @param  {object} oItem     [oItem]
		 * @return {*}           [returns the path or its primitive Value]
		 */
		KpiUtil.getPathOrPrimitiveValue = function (oItem) {
			if (oItem) {
				return (oItem.Path) ? "{path:'" + oItem.Path + "'}" : KpiUtil.getPrimitiveValue(oItem);
			} else {
				return "";
			}
		};
	/**
	 * [isBindingValue  ]
	 * @param  {object}  oValue [value]
	 * @return {Boolean}        [returns true or false]
	 */
	KpiUtil.isBindingValue = function(oValue) {
		return (typeof oValue === "string") && oValue.charAt(0) === "{";
	};

	KpiUtil.getNumberFormatter = function(showMeasure, scale, maxFractionDigits) {
		var fixedInteger = sap.ui.core.format.NumberFormat.getIntegerInstance({
			style: "short",
			minFractionDigits: 0,
			maxFractionDigits: maxFractionDigits,
			showScale: showMeasure,
			shortRefNumber: scale
		});
		return fixedInteger;
	};

	KpiUtil.determineThousandsRefNumber = function(scaleFactor) {
		var shiftedFactor = scaleFactor;

		if (scaleFactor >= 1000) {
			var thousandsCount = 0;
			while (shiftedFactor >= 1000) {
				shiftedFactor /= 1000;
				thousandsCount++;
			}
			return thousandsCount == 0 ? undefined : thousandsCount * 1000;
		} else {
			return undefined;
		}
	};


	/**
	 * [formatNumberForPresentation formats the absolute number value]
	 * @param  {object} oValue                   [value to be formatted]
	 * @param  {boolean} bShowScale               [if if the scale has to be shown with the format]
	 * @param  {number} nNumberOfFractionalDigits [numberOfFractionalDigits from the datapoint annotation for the enityset]
	 * @return {sap.ui.core.format.NumberFormat}	[returns the float instance of the NumberFormat]
    */
	KpiUtil.formatNumberForPresentation = function(oValue, bShowScale, nNumberOfFractionalDigits, fScaleFactor) {
		var num = Number(oValue);
		var sCurrentLocale = sap.ui.getCore().getConfiguration().getLanguage();
		var oCurrentLocale = new sap.ui.core.Locale(sCurrentLocale);
		if (nNumberOfFractionalDigits > 2) {
			nNumberOfFractionalDigits = 2 ; // additional check is required here since decimals param is taking precendence over maxFractionDigits below
		}
		var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
			style: "short",
			showScale: bShowScale,
			minFractionDigits: 0,
			maxFractionDigits: 2,
			decimals: nNumberOfFractionalDigits,
			shortRefNumber: fScaleFactor
		}, oCurrentLocale).format(num) ;
		return oNumberFormat;
	};

	/**
	 * [formatNumberForPercentPresentation formats the number with percent presentation]]
	 * @param  {object} oValue                   [value]
	 * @param  {number} nNumberOfFractionalDigits [number of fractional Digits from OdataPOint annotations]
	 * @return {sap.ui.core.format.NumberFormat}	[returns integer instance of the NumberFormat]

	 */
	KpiUtil.formatNumberForPercentPresentation = function (oValue, nNumberOfFractionalDigits) {
		var percentNumber = Number(oValue);
		if (nNumberOfFractionalDigits) {
			var minDigits = 0;
			//var maxDigits = nNumberOfFractionalDigits;
			var maxDigits = nNumberOfFractionalDigits ;
			if (nNumberOfFractionalDigits > 2) { // check to restrict the max allowed digit to two at all times
				maxDigits = 2;
			}
			var percentFormatter = sap.ui.core.format.NumberFormat.getPercentInstance({
			style: "short",
			minFractionDigits: minDigits,
			maxFractionDigits: maxDigits
			});
			return percentFormatter.format(percentNumber);
		} else {
		 var percentFormatter = sap.ui.core.format.NumberFormat.getPercentInstance({
			style: "short",
			minFractionDigits: 0,
			maxFractionDigits: 1
		});

		return percentFormatter.format(percentNumber);
		}
	};


	/**
	 * [getUnitofMeasure checks for unit of measure]
	 * @param  {object} oModel [Context   current context]
	 * @param  {object} oEntityTypeProperty [enity property for the respective entity type and enity set]
	 * @return {string}      [returns the Unit of Measure]
	 */
	KpiUtil.getUnitofMeasure = function(oModel, oEntityTypeProperty) {
		return (oEntityTypeProperty) ? oEntityTypeProperty["Org.OData.Measures.V1.ISOCurrency"] || oEntityTypeProperty["Org.OData.Measures.V1.Unit"] : "";
	};


	/**
	 * [isRelative checks if the passed datapoint is relative]
	 * @param  {object}  oDataPoint [data point annotation]
	 * @return {Boolean}            [returns true/false]
	 */
	KpiUtil.isRelative = function(oDataPoint) {
		var trendCalc = oDataPoint.TrendCalculation;
		var relative = false;
		if (trendCalc) {
			var defaultVal = trendCalc.IsRelativeDifference.DefaultValue;
			relative = KpiUtil.getBooleanValue(trendCalc.IsRelativeDifference, defaultVal ? ({
				"true": true,
				"false": false
			})[defaultVal.toLowerCase()] : false);
		}
		return relative;
	};

	/**
	 * [getFilter creates a filter object out of select options ranges ]
	 * @param  {object}  oRange [Range object of Ranges]
	 * @return {object}  [filter object as jsobject]
	 */
	KpiUtil.getFilter = function(oRange, oSelectOption) {
		//create the filter. the Low value is mandatory
		var oFilter = {
			path: oSelectOption.PropertyName.PropertyPath,
			operator: oRange.Option.EnumMember.split("/")[1],
			value1: oRange.Low.String,
			value2: oRange.High ? oRange.High.String : "",
			sign: oRange.Sign.EnumMember === V4Terms.SelectionRangeSignType + "/I" ? "I" : "E"
		};
		// exclude sign is supported only with EQ operator
		if (oFilter.sign === "E" && oFilter.operator !== sap.ui.model.FilterOperator.EQ) {
			jQuery.sap.log.error("Exclude sign is supported only with EQ operator");
		} else {
			// aFilters will be used later in the flow to create filter object. (sap.ui.model.Filter),
			// that does not support sign property, so the sign property will be ignored later in the flow.

			if (oFilter.sign === "E" && oFilter.operator === sap.ui.model.FilterOperator.EQ) {
				oFilter.operator = sap.ui.model.FilterOperator.NE;
				oFilter.sign = "I";
			}
			return oFilter;
		}

	};



	return KpiUtil;

}, true);
