/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides sap.ui.comp.config.condition.DateRangeType.
sap.ui.define([
	'jquery.sap.global', 'sap/ui/comp/config/condition/Type', 'sap/m/Input', 'sap/m/DateRangeSelection', 'sap/m/DatePicker', 'sap/m/Text', 'sap/m/Select', 'sap/ui/core/date/UniversalDate', 'sap/ui/core/Locale', 'sap/ui/core/LocaleData', 'sap/ui/model/odata/Filter'
], function(jQuery, Type, Input, DateRangeSelection, DatePicker, Text, Select, UniversalDate, Locale, LocaleData, Filter) {
	"use strict";

	sap.ui.model.type.Integer.extend("sap.ui.model.type.NullableInteger", {
		parseValue: function(oValue, sInternalType) {
			switch (this.getPrimitiveType(sInternalType)) {
				case "string":
					if (oValue === "") {
						return null;
					}
			}

			return sap.ui.model.type.Integer.prototype.parseValue.apply(this, arguments);
		}
	});


	var DateRangeType = Type.extend("sap.ui.comp.config.condition.DateRangeType", /** @lends "sap.ui.comp.config.condition.DateRangeType.prototype */ {
		constructor: function(sFieldName, oFilterProvider, oFieldViewMetadata) {
			Type.apply(this, [
				sFieldName, oFilterProvider, oFieldViewMetadata
			]);
			this.oDateFormat = oFilterProvider && oFilterProvider._oDateFormatSettings ? oFilterProvider._oDateFormatSettings : {
				UTC: true
			};

			this._bIgnoreTime = false;
			this._maxIntValue = 10000; // max int value for "LAST/NEXT X DAYS/MONTH...." operators
			this.bMandatory = this.oFieldMetadata ? this.oFieldMetadata.isMandatory : false;
		}
	});

	DateRangeType.prototype.applySettings = function(oSettings) {
		Type.prototype.applySettings.apply(this, arguments);

		if (oSettings && oSettings.ignoreTime) {
			this._bIgnoreTime = oSettings.ignoreTime;
		}
	};


	/**
	 * Sets and returns the given date with the start time 00:00:00.000 UTC
	 *
	 * @param {UniversalDate} oDate the date
	 * @returns {UniversalDate} the given date with the start time 00:00:00.000 UTC
	 */
	DateRangeType.setStartTime = function(oDate) {
		if (oDate instanceof Date) {
			oDate = new UniversalDate(oDate);
		}
		if (!oDate) {
			oDate = new UniversalDate();
		}
		oDate.setHours(0);
		oDate.setMinutes(0);
		oDate.setSeconds(0);
		oDate.setMilliseconds(0);
		return oDate;
	};

	/**
	 * Sets and returns the given date with the end time 23:59:59.999 UTC
	 *
	 * @param {UniversalDate} oDate the date
	 * @returns {UniversalDate} the given date with the end time 23:59:59.999 UTC
	 */
	DateRangeType.setEndTime = function(oDate) {
		oDate = DateRangeType.toUniversalDate(oDate);
		oDate.setHours(23);
		oDate.setMinutes(59);
		oDate.setSeconds(59);
		oDate.setMilliseconds(999);
		return oDate;
	};

	DateRangeType.toUniversalDate = function(oDate) {
		if (oDate instanceof Date) {
			oDate = new UniversalDate(oDate);
		}
		if (!oDate) {
			oDate = new UniversalDate();
		}
		return oDate;
	};

	/**
	 * Returns the weeks start date of a given universal date based on the locale and format settings
	 */
	DateRangeType.getWeekStartDate = function(oUniversalDate) {
		var oLocale = new Locale(sap.ui.getCore().getConfiguration().getFormatSettings().getFormatLocale().toString()),
			oLocaleData = LocaleData.getInstance(oLocale),
			iFirstDayOfWeek = oLocaleData.getFirstDayOfWeek();
		if (!oUniversalDate) {
			oUniversalDate = new UniversalDate();
		}
		oUniversalDate.setDate(oUniversalDate.getDate() - oUniversalDate.getDay() + iFirstDayOfWeek);
		return DateRangeType.setStartTime(oUniversalDate);
	};

	/**
	 * Returns the month start date of a given universal date
	 */
	DateRangeType.getMonthStartDate = function(oUniversalDate) {
		if (!oUniversalDate) {
			oUniversalDate = new UniversalDate();
		}
		oUniversalDate.setDate(1);
		return DateRangeType.setStartTime(oUniversalDate);
	};

	/**
	 * Returns the quarter start date of a given universal date
	 */
	DateRangeType.getQuarterStartDate = function(oUniversalDate) {
		if (!oUniversalDate) {
			oUniversalDate = new UniversalDate();
		}
		oUniversalDate.setMonth(3 * Math.floor(oUniversalDate.getMonth() / 3));
		oUniversalDate.setDate(1);
		return DateRangeType.setStartTime(oUniversalDate);
	};

	/**
	 * Returns the years start date of a given universal date. If no date is given, today is used.
	 *
	 * @param {sap.ui.core.date.UniversalDate} [oUniversalDate] the universal date
	 * @returns the years start date of a given universal date.
	 * @public
	 */
	DateRangeType.getYearStartDate = function(oUniversalDate) {
		if (!oUniversalDate) {
			oUniversalDate = new UniversalDate();
		}
		oUniversalDate.setMonth(0);
		oUniversalDate.setDate(1);
		return DateRangeType.setStartTime(oUniversalDate);
	};

	/**
	 * Returns an array of a date range based on the given universal date If no date is given, today is used.
	 *
	 * @param {int} iValue positive and negative values to calculate the date range
	 * @param {string} sType defines the range that the iValue refers to ("DAY","WEEK","MONTH","QUARTER","YEAR")
	 * @param {sap.ui.core.date.UniversalDate} [oUniversalDate] the universal date
	 * @param {boolean} bCalcBaseStartDate calculate start date even if Date is provided
	 * @param {boolean} bIgnoreCurrentInterval If iValue > 0 the start date is the begin of the next interval
	 * @returns {sap.ui.core.date.UniversalDate[]} array with 2 values where [0] is the start and [1] is the end date for the range
	 * @public
	 */
	DateRangeType.getDateRange = function(iValue, sType, oUniversalDate, bCalcBaseStartDate, bIgnoreCurrentInterval) {
		if (oUniversalDate === true) {
			bCalcBaseStartDate = true;
			oUniversalDate = null;
		}
		if (!oUniversalDate) {
			oUniversalDate = new UniversalDate();
		} else if (!(oUniversalDate instanceof UniversalDate)) {
			throw new Error("Date must be a UniversalDate object " + this);
		}

		var oStartDate = new UniversalDate(),
			oEndDate;
		if (oUniversalDate) {
			oStartDate.getJSDate().setTime(oUniversalDate.getTime());
			oStartDate = DateRangeType.setStartTime(oStartDate);
		}
		if (iValue !== 0 && !isNaN(iValue)) {
			if (sType === "DAY") {
				if (bIgnoreCurrentInterval && iValue > 0) {
					oStartDate.setDate(oStartDate.getDate() + 1);
				}
				oEndDate = new UniversalDate(oStartDate);
				oEndDate.setDate(oStartDate.getDate() + iValue);
			} else if (sType === "WEEK") {
				if (bCalcBaseStartDate) {
					oStartDate = DateRangeType.getWeekStartDate(oStartDate);
				}
				if (bIgnoreCurrentInterval && iValue > 0) {
					oStartDate.setDate(oStartDate.getDate() + 7);
				}
				oEndDate = new UniversalDate(oStartDate);
				oEndDate.setDate(oStartDate.getDate() + (iValue * 7));
			} else if (sType === "MONTH") {
				if (bCalcBaseStartDate) {
					oStartDate = DateRangeType.getMonthStartDate(oStartDate);
				}
				if (bIgnoreCurrentInterval && iValue > 0) {
					oStartDate.setMonth(oStartDate.getMonth() + 1);
				}
				oEndDate = new UniversalDate(oStartDate);
				oEndDate.setMonth(oStartDate.getMonth() + iValue);
			} else if (sType === "QUARTER") {
				if (bCalcBaseStartDate) {
					oStartDate = DateRangeType.getQuarterStartDate(oStartDate);
				}
				if (bIgnoreCurrentInterval && iValue > 0) {
					oStartDate.setMonth(oStartDate.getMonth() + 3);
				}
				oEndDate = new UniversalDate(oStartDate);
				oEndDate.setMonth(oStartDate.getMonth() + (iValue * 3));
			} else if (sType === "YEAR") {
				if (bCalcBaseStartDate) {
					oStartDate = DateRangeType.getYearStartDate(oStartDate);
				}
				if (bIgnoreCurrentInterval && iValue > 0) {
					oStartDate.setFullYear(oStartDate.getFullYear() + 1);
				}
				oEndDate = new UniversalDate(oStartDate);
				oEndDate.setFullYear(oStartDate.getFullYear() + iValue);
			}
		}
		if (!oEndDate) {
			return [];
		}
		if (oEndDate.getTime() < oStartDate.getTime()) {
			// swap start/end date
			oEndDate = [oStartDate, oStartDate = oEndDate][0];
		}

		// adjust endDate
		oEndDate.setDate(oEndDate.getDate() - 1);

		return [
			DateRangeType.setStartTime(oStartDate), DateRangeType.setEndTime(oEndDate)
		];
	};

	DateRangeType.getTextField = function(oInstance, bExpression) {
		if (bExpression) {
			return new Text(Type._createStableId(oInstance, "text"), {
				text: "{path: '$smartEntityFilter>value1', type:'sap.ui.model.type.Date', formatOptions:" + JSON.stringify({
					style: oInstance.oDateFormat.style,
					pattern: oInstance.oDateFormat.pattern
				}) + "} - {path: '$smartEntityFilter>value2', type:'sap.ui.model.type.Date', formatOptions:" + JSON.stringify({
					style: oInstance.oDateFormat.style,
					pattern: oInstance.oDateFormat.pattern
				}) + "}"
			});
		}
		return new Text(Type._createStableId(oInstance, "text"), {
			text: {
				path: '$smartEntityFilter>value1',
				type: 'sap.ui.model.type.Date',
				formatOptions: {
					style: oInstance.oDateFormat.style,
					pattern: oInstance.oDateFormat.pattern
				}
			}
		});
	};

	DateRangeType.getIntField = function(oInstance) {
		return new Input(Type._createStableId(oInstance, "field"), {
			ariaLabelledBy: oInstance.oOperationSelect || null,
			value: {
				path: "$smartEntityFilter>value1",
				type: new sap.ui.model.type.NullableInteger({}, { minimum: 0, maximum: oInstance._maxIntValue })
			},
			textAlign: "End",
			//type: "Number",
			width: "100%"
		});
	};

	DateRangeType.ControlFactory = function(oInstance, aResult, oOperation) {
		if (oOperation.type === "range") {
			var oControl = DateRangeType.getTextField(oInstance, oOperation.display !== "start");
			oControl.addStyleClass("sapUiCompFilterBarCTPaddingTop");
			aResult.push(oControl);
			return;
		}
		if (oOperation.type === "int") {
			var oControl = DateRangeType.getIntField(oInstance);
			aResult.push(oControl);
			if (oOperation.descriptionTextKeys) {
				oControl.setFieldWidth("auto");
				oControl.bindProperty("description", {
					path: "$smartEntityFilter>value1",
					type: "sap.ui.model.type.Integer",
					formatter: function() {
						var sTextKey = oOperation.descriptionTextKeys[0];
						var sTextMulti = oOperation.descriptionTextKeys[1];
						if (this.getBinding("description").getValue() === 1) {
							return Type.getTranslatedText(sTextKey);
						} else {
							return Type.getTranslatedText(sTextMulti || sTextKey);
						}
					}
				});
			}
		}
	};

	DateRangeType._defaultOnChangeHandler = function(sValue, oInstance) {
		//console.log("---> onChange :" + sValue);

		if (sValue.toLowerCase() === this.languageText.toLowerCase()) {
			oInstance.oModel.setProperty("/condition/operation", this.key);
			oInstance.oModel.setProperty("inputstate", "NONE", oInstance.getContext());

			if (this.category.indexOf("FIXED") !== 0) {
				//oInstance._toggleOpen();
				oInstance.oModel.setProperty("inputstate", "ERROR", oInstance.getContext());
			}

			return true;
		}
		return false;
	};

	DateRangeType._IntOnChangeHandler = function(sValue, oInstance) {
		if (this.basicLanguageText.indexOf("{0}") >= 0) {
			var rx = new RegExp(this.basicLanguageText.replace("{0}", "[a-zA-Z0-9_]+") + "$", 'i');
			if (sValue.match(rx)) {
				//jQuery.sap.log.debug("DateRangeType -->>> ", oOperation.languageText + " found!");

				var xPos = this.basicLanguageText.indexOf("{0}");
				if (xPos >= 0) {
					var n1 = this.basicLanguageText.length - xPos;
					sValue = sValue.slice(0, sValue.length - n1 + 3);
					sValue = sValue.slice(xPos);
					//jQuery.sap.log.debug("DateRangeType Value ", sValue);
					var iValue = parseInt(sValue, 10);

					if (!isNaN(iValue) && iValue <= oInstance._maxIntValue) {
						oInstance.oModel.setProperty("/condition/operation", this.key);
						oInstance.oModel.setProperty("/condition/value1", iValue);
						oInstance.oModel.setProperty("inputstate", "NONE", oInstance.getContext());
					} else {
						oInstance.oModel.setProperty("inputstate", "ERROR", oInstance.getContext());
					}
					return true;
				}
			}
		}
		return false;
	};

	DateRangeType._DateOnChangeHandler = function(sValue, oInstance) {
		if (sValue.toLowerCase().indexOf(this.languageText.toLowerCase()) === 0) {
			var s = sValue.slice(this.languageText.length);
			if (s.length > 0 && s[0] === " ") {
				s = s.trim();
				if (s[0] === "(" && s[s.length - 1] === ")") {
					s = s.slice(1, s.length - 1);
				}

				var oDateFormatter = oInstance._getDateFormatter(true);
				var oDate = oDateFormatter.parse(s);

				if (oDate) {
					oInstance.oModel.setProperty("/condition/operation", this.key);
					oInstance.oModel.setProperty("/condition/value1", oDate);
					oInstance.oModel.setProperty("inputstate", "NONE", oInstance.getContext());
				} else {
					oInstance.oModel.setProperty("inputstate", "ERROR", oInstance.getContext());
				}

				return true;
			}
		}
		return false;
	};

	DateRangeType._DateRangeOnChangeHandler = function(sValue, oInstance) {
		if (sValue.toLowerCase().indexOf(this.languageText.toLowerCase()) === 0) {
			var s = sValue.slice(this.languageText.length).trim();
			if (s[0] === "(" && s[s.length - 1] === ")") {
				s = s.slice(1, s.length - 1);
			}
			var sValue1 = s.split("-")[0];
			var sValue2 = s.split("-")[1];

			var oDateFormatter = oInstance._getDateFormatter(true);
			var oDate1 = oDateFormatter.parse(sValue1);
			var oDate2 = oDateFormatter.parse(sValue2);

			if (oDate1 && oDate2) {
				oInstance.oModel.setProperty("/condition/operation", this.key);
				oInstance.oModel.setProperty("/condition/value1", oDate1);
				oInstance.oModel.setProperty("/condition/value2", oDate2);
				oInstance.oModel.setProperty("inputstate", "NONE", oInstance.getContext());
			} else {
				oInstance.oModel.setProperty("inputstate", "ERROR", oInstance.getContext());
			}

			return true;
		}
		return false;
	};

	DateRangeType._MonthOnChangeHandler = function(sValue, oInstance) {
		var sMonth;
		var bResult = false;

		if (sValue.toLowerCase().indexOf(this.languageText.toLowerCase()) === 0) {
			sMonth = sValue.slice(this.languageText.length).trim();
			if (sMonth.indexOf("(") == 0) {
				sMonth = sMonth.slice(1);
				sMonth = sMonth.slice(0, sMonth.length - 1);
			}
			bResult = true;
		} else {
			sMonth = sValue;
		}

		var aMonth = this.getValueList();
		var iMonthIndex = -1;
		aMonth.some(function(oItem, index) {
			var bResult = oItem.text.toLowerCase() === sMonth.toLowerCase();
			if (bResult) {
				iMonthIndex = index;
			}
			return bResult;
		});

		if (iMonthIndex > -1) {
			oInstance.oModel.setProperty("/condition/operation", this.key);
			oInstance.oModel.setProperty("/condition/value1", iMonthIndex);
			oInstance.oModel.setProperty("inputstate", "NONE", oInstance.getContext());
			return true;
		} else {
			if (bResult) {
				oInstance.oModel.setProperty("inputstate", "ERROR", oInstance.getContext());
			}
			return bResult;
		}
	};

	DateRangeType._DefaultFilterSuggestItem = function(sValue, oItem, oInstance) {
		var bMatch = false;
		if (jQuery.sap.startsWithIgnoreCase(this.languageText.toLowerCase(), sValue.toLowerCase())) {
			bMatch = true;
		} else {
			var aWords = this.languageText.split(" ");
			for (var i = 0; i < aWords.length; i++) {
				var sWord = aWords[i];
				if (jQuery.sap.startsWithIgnoreCase(sWord.toLowerCase(), sValue.toLowerCase())) {
					bMatch = true;
				}
			}
		}

		oItem.setAdditionalText(this.textValue);
		oItem.setText(this.languageText);
		return bMatch;
	};

	DateRangeType._HideFilterSuggestItem = function(sValue, oItem, oInstance) {
		return false;
	};

	DateRangeType._IntFilterSuggestItem = function(sValue, oItem, oInstance) {
		var xPos = this.basicLanguageText.indexOf("{0}");
		var sPart1;
		var sPart2;
		if (xPos >= 0) {
			sPart1 = this.basicLanguageText.slice(0, xPos).trim();
			sPart2 = this.basicLanguageText.slice(xPos + 3).trim();
		}

		var aParts = sValue.split(" ");
		if (aParts.length < 1 || aParts.length > 3) {
			return false;
		}
		var bMatch = false;
		var sNumber;
		var isValidNumber = function(sValue) {
			return !!sValue.match(/(?!(0))(^[0-9]+$)/) && parseInt(sValue, 10) > 0;
		};

		if (jQuery.sap.startsWithIgnoreCase(sPart1.toLowerCase(), aParts[0].toLowerCase())) {
			// starts with the first word
			if (aParts[1]) {
				if (isValidNumber(aParts[1])) {
					// second part is number
					sNumber = aParts[1];
					if (aParts[2]) {
						if (jQuery.sap.startsWithIgnoreCase(sPart2.toLowerCase(), aParts[2].toLowerCase())) {
							bMatch = true;
						}
					} else {
						bMatch = true;
					}
				}
			} else {
				// only first part -> OK
				bMatch = true;
			}
		} else if (isValidNumber(aParts[0]) && aParts.length < 3) {
			// starts with number
			sNumber = aParts[0];
			if (aParts[1]) {
				if (jQuery.sap.startsWithIgnoreCase(sPart2.toLowerCase(), aParts[1].toLowerCase())) {
					bMatch = true;
				}
			} else {
				// only number -> OK
				bMatch = true;
			}
		} else if (jQuery.sap.startsWithIgnoreCase(sPart2.toLowerCase(), aParts[0].toLowerCase()) && aParts.length == 1) {
			// starts with last word
			bMatch = true;
		}

		if (bMatch && sNumber) {
			var sType;
			switch (this.category) {
				case "DYNAMIC.DATE.INT":
					sType = "DAY";
					break;
				case "DYNAMIC.WEEK.INT":
					sType = "WEEK";
					break;
				case "DYNAMIC.MONTH.INT":
					sType = "MONTH";
					break;
				case "DYNAMIC.QUARTER.INT":
					sType = "QUARTER";
					break;
				case "DYNAMIC.YEAR.INT":
					sType = "YEAR";
					break;

				default:
					sType = "DAY";
					break;
			}

			var iNumber = parseInt(sNumber, 10),
				bFlag = true;

			if (iNumber > oInstance._maxIntValue) {
				bMatch = false;
			}

			if (jQuery.sap.startsWith(this.key, "LAST")) {
				iNumber = iNumber * -1;
				bFlag = false;
			}

			var aDates = DateRangeType.getDateRange(iNumber, sType, true, bFlag, bFlag);

			// if (aDates.length > 0) {
			// 	if (isNaN(aDates[0].getTime())) {
			// 		bMatch = false;
			// 	}
			// 	if (isNaN(aDates[1].getTime())) {
			// 		bMatch = false;
			// 	}
			// }

			var oDateFormatter = oInstance._getDateFormatter(true);
			if (Math.abs(iNumber) === 1 && this.singulareBasicLanguageText) {
				oItem.setText(this.singulareBasicLanguageText);
				if (sType !== "DAY") {
					oItem.setAdditionalText(oDateFormatter.format(aDates[0]) + " - " + oDateFormatter.format(aDates[1]));
				} else {
					oItem.setAdditionalText(oDateFormatter.format(aDates[0]));
				}
			} else {
				oItem.setText(oInstance._fillNumberToText(this.basicLanguageText, sNumber));
				oItem.setAdditionalText(oDateFormatter.format(aDates[0]) + " - " + oDateFormatter.format(aDates[1]));
			}
			oItem._value1 = parseInt(sNumber, 10);
		} else {
			oItem.setAdditionalText(null);
			oItem.setText(this.languageText);
			oItem._value1 = null;
		}
		return bMatch;
	};

	DateRangeType._DateFilterSuggestItem = function(sValue, oItem, oInstance) {
		var oDateFormatter = oInstance._getDateFormatter(true);
		var oDate = oDateFormatter.parse(sValue);

		if (oDate) {
			oItem.setText(this.languageText + " (" + oDateFormatter.format(oDate) + ")");
			oItem._value1 = oDate;
			return true;
		} else {
			oItem.setText(this.languageText);
			oItem._value1 = null;
			return false;
		}
	};

	DateRangeType._DateRangeFilterSuggestItem = function(sValue, oItem, oInstance) {
		var oDateFormatter = oInstance._getDateFormatter(true);
		var oDate1, oDate2;
		var sDelimiter = "-";
		var bValid = false;

		var aDates = sValue.split(sDelimiter);
		if (aDates.length === 2) {
			// if delimiter only appears once in value (not part of date pattern) remove " " to be more flexible for input
			if (aDates[0].slice(aDates[0].length - 1, aDates[0].length) == " ") {
				aDates[0] = aDates[0].slice(0, aDates[0].length - 1);
			}
			if (aDates[1].slice(0, 1) == " ") {
				aDates[1] = aDates[1].slice(1);
			}
		} else {
			aDates = sValue.split(" " + sDelimiter + " "); // Delimiter appears more than once -> try with separators
		}
		if (aDates.length < 2) {
			// no delimiter found -> maybe only " " is used
			var aDates2 = sValue.split(" ");
			if (aDates2.length === 2) {
				aDates = aDates2;
			}
		}

		if (aDates.length >= 1 && aDates.length <= 2) {
			oDate1 = oDateFormatter.parse(aDates[0]);
			if (oDate1) {
				oItem._value1 = oDate1;
				if (aDates.length == 2 && aDates[1] === "") {
					// second date empty - just ignore
					aDates.splice(1, 1);
				}
				if (aDates.length == 2) {
					oDate2 = oDateFormatter.parse(aDates[1]);
					if (oDate2) {
						// start and end date
						oItem._value2 = oDate2;
						bValid = true;
						oItem.setText(this.languageText + " (" + oDateFormatter.format(oDate1) + " " + sDelimiter + " " + oDateFormatter.format(oDate2) + ")");
					}
				} else {
					// only start date
					bValid = true;
					oItem.setText(this.languageText + " (" + oDateFormatter.format(oDate1) + " " + sDelimiter + ")");
				}
			}
		}
		if (!bValid) {
			oItem.setText(this.languageText);
			oItem._value1 = null;
			oItem._value2 = null;
		}

		return bValid;
	};

	DateRangeType._MonthFilterSuggestItem = function(sValue, oItem, oInstance) {
		var bMonthFound = false;
		oItem._value1 = null;
		var aMonths = this.getValueList();
		for (var i = 0; i < aMonths.length; i++) {
			var oMonth = aMonths[i];
			bMonthFound = jQuery.sap.startsWithIgnoreCase(oMonth.text.toLowerCase(), sValue.toLowerCase());
			if (bMonthFound) {
				oItem.setText(this.languageText + " (" + oMonth.text + ")");
				oItem._value1 = i;
				break;
			}
		}
		return bMonthFound;
	};

	DateRangeType._DefaultOnItemSelected = function(sValue, oItem, oInstance) {

		oInstance.oModel.setProperty("/condition/operation", this.key);
		if ("value1" in this) {
			oInstance.oModel.setProperty("/condition/value1", oItem._value1);
		}
		if ("value2" in this) {
			oInstance.oModel.setProperty("/condition/value2", oItem._value2);
		}
		oInstance.oModel.setProperty("inputstate", "NONE", oInstance.getContext());
		oInstance._bSuggestItemSelected = true;

	};

	DateRangeType._IntOnItemSelected = function(sValue, oItem, oInstance) {

		var iNumber = oItem._value1;

		oInstance.oModel.setProperty("/condition/operation", this.key);
		oInstance.oModel.setProperty("/condition/value1", iNumber);
		oInstance.oModel.setProperty("inputstate", "NONE", oInstance.getContext());
		oInstance._bSuggestItemSelected = true;
	};


	DateRangeType.getFixedRangeOperation = function(sKey, sTextKey, sCategory, aDefaults, fnFilterSuggestItem, iOrder) {
		return {
			key: sKey,
			textKey: sTextKey,
			category: sCategory,
			order: iOrder || 100,
			defaultValues: aDefaults || null,
			type: "range",
			display: "range",
			//onChange: DateRangeType._defaultOnChangeHandler,
			filterSuggestItem: fnFilterSuggestItem || DateRangeType._DefaultFilterSuggestItem,
			onItemSelected: DateRangeType._DefaultOnItemSelected,
			getControls: DateRangeType.ControlFactory
		};
	};

	/**
	 * Supported operations of the DateRangeType
	 */
	DateRangeType.Operations = {
		DATERANGE: {
			key: "DATERANGE",
			textKey: "CONDITION_DATERANGETYPE_DATERANGE",
			category: "DYNAMIC.DATERANGE",
			order: 2,
			defaultOperation: true,
			defaultValues: [
				null, null
			],
			value1: null,
			value2: null,
			onChange: DateRangeType._DateRangeOnChangeHandler,
			filterSuggestItem: DateRangeType._DateRangeFilterSuggestItem,
			onItemSelected: DateRangeType._DefaultOnItemSelected,
			getControls: function(oInstance, aResult) {
				var oLabel = new sap.m.Label({ text: Type.getTranslatedText("CONDITION_DATERANGETYPE_DATERANGE_LABELFROM") });
				oLabel.addStyleClass("sapUiCompFilterBarCTPaddingTop");
				aResult.push(oLabel);

				var oControl = new DatePicker(Type._createStableId(oInstance, "field1"), {
					dateValue: { path: "$smartEntityFilter>value1" },
					displayFormat: oInstance.oDateFormat.style || oInstance.oDateFormat.pattern || "",
					change: function(oEvent) {
						var bValid = oEvent.getParameter("valid");

						if (bValid) {
							this.getModel("$smartEntityFilter").setProperty("inputstate", "NONE", this.getModel("$smartEntityFilter").getContext("/"));
						} else {
							this.getModel("$smartEntityFilter").setProperty("inputstate", "ERROR", this.getModel("$smartEntityFilter").getContext("/"));
							//TODO remove the old value1 from model
						}
					}
				});
				oLabel.setLabelFor(oControl);
				aResult.push(oControl);

				oLabel = new sap.m.Label({ text: Type.getTranslatedText("CONDITION_DATERANGETYPE_DATERANGE_LABELTO") });
				oLabel.addStyleClass("sapUiCompFilterBarCTPaddingTop");
				aResult.push(oLabel);

				oControl = new DatePicker(Type._createStableId(oInstance, "field2"), {
					//ariaLabelledBy: oInstance.oOperationSelect || null,
					dateValue: { path: "$smartEntityFilter>value2" },
					minDate: { path: "$smartEntityFilter>value1" },
					displayFormat: oInstance.oDateFormat.style || oInstance.oDateFormat.pattern || "",
					change: function(oEvent) {
						var bValid = oEvent.getParameter("valid");

						if (bValid) {
							this.getModel("$smartEntityFilter").setProperty("inputstate", "NONE", this.getModel("$smartEntityFilter").getContext("/"));
						} else {
							this.getModel("$smartEntityFilter").setProperty("inputstate", "ERROR", this.getModel("$smartEntityFilter").getContext("/"));
							//TODO remove the old value2 from model
						}
					}
				});
				oLabel.setLabelFor(oControl);
				aResult.push(oControl);
			}
		},
		FROM: {
			key: "FROM",
			textKey: "CONDITION_DATERANGETYPE_FROM",
			category: "DYNAMIC.DATE",
			order: 0,
			defaultValues: [
				null
			],
			value1: null,
			onChange: DateRangeType._DateOnChangeHandler,
			filterSuggestItem: DateRangeType._DateFilterSuggestItem,
			onItemSelected: DateRangeType._DefaultOnItemSelected,
			getControls: function(oInstance, aResult) {
				var oControl = new DatePicker(Type._createStableId(oInstance, "field"), {
					ariaLabelledBy: oInstance.oOperationSelect || null,
					dateValue: { path: "$smartEntityFilter>value1" },
					displayFormat: oInstance.oDateFormat.style || oInstance.oDateFormat.pattern || "",
					change: function(oEvent) {
						var bValid = oEvent.getParameter("valid");

						if (bValid) {
							this.getModel("$smartEntityFilter").setProperty("inputstate", "NONE", this.getModel("$smartEntityFilter").getContext("/"));
						} else {
							this.getModel("$smartEntityFilter").setProperty("inputstate", "ERROR", this.getModel("$smartEntityFilter").getContext("/"));
							//TODO remove the old value1 from model
						}
					}
				});
				aResult.push(oControl);
			}
		},
		TO: {
			key: "TO",
			textKey: "CONDITION_DATERANGETYPE_TO",
			category: "DYNAMIC.DATE",
			order: 1,
			defaultValues: [
				null
			],
			value1: null,
			onChange: DateRangeType._DateOnChangeHandler,
			filterSuggestItem: DateRangeType._DateFilterSuggestItem,
			onItemSelected: DateRangeType._DefaultOnItemSelected,
			getControls: function(oInstance, aResult, oOperation) {
				var oControl = new DatePicker(Type._createStableId(oInstance, "field"), {
					ariaLabelledBy: oInstance.oOperationSelect || null,
					dateValue: { path: "$smartEntityFilter>value1" },
					displayFormat: oInstance.oDateFormat.style || oInstance.oDateFormat.pattern || "",
					change: function(oEvent) {
						var bValid = oEvent.getParameter("valid");

						if (bValid) {
							this.getModel("$smartEntityFilter").setProperty("inputstate", "NONE", this.getModel("$smartEntityFilter").getContext("/"));
						} else {
							this.getModel("$smartEntityFilter").setProperty("inputstate", "ERROR", this.getModel("$smartEntityFilter").getContext("/"));
							//TODO remove the old value1 from model
						}
					}
				});
				aResult.push(oControl);
			}
		},
		LASTDAYS: {
			key: "LASTDAYS",
			textKey: "CONDITION_DATERANGETYPE_LASTDAYS",
			singularTextKey: "CONDITION_DATERANGETYPE_YESTERDAY",
			category: "DYNAMIC.DATE.INT",
			order: 4,
			defaultValues: [
				1
			],
			value1: null,
			type: "int",
			descriptionTextKeys: ["CONDITION_DATERANGETYPE_SINGLE_DAY", "CONDITION_DATERANGETYPE_MULTIPLE_DAYS"],
			onChange: DateRangeType._IntOnChangeHandler,
			filterSuggestItem: DateRangeType._IntFilterSuggestItem,
			onItemSelected: DateRangeType._IntOnItemSelected,
			getControls: DateRangeType.ControlFactory
		},
		LASTWEEKS: {
			key: "LASTWEEKS",
			textKey: "CONDITION_DATERANGETYPE_LASTWEEKS",
			singularTextKey: "CONDITION_DATERANGETYPE_LASTWEEK",
			category: "DYNAMIC.WEEK.INT",
			order: 8,
			defaultValues: [
				1
			],
			value1: null,
			type: "int",
			descriptionTextKeys: ["CONDITION_DATERANGETYPE_SINGLE_WEEK", "CONDITION_DATERANGETYPE_MULTIPLE_WEEKS"],
			onChange: DateRangeType._IntOnChangeHandler,
			filterSuggestItem: DateRangeType._IntFilterSuggestItem,
			onItemSelected: DateRangeType._IntOnItemSelected,
			getControls: DateRangeType.ControlFactory
		},
		LASTMONTHS: {
			key: "LASTMONTHS",
			textKey: "CONDITION_DATERANGETYPE_LASTMONTHS",
			singularTextKey: "CONDITION_DATERANGETYPE_LASTMONTH",
			category: "DYNAMIC.MONTH.INT",
			order: 14,
			defaultValues: [
				1
			],
			value1: null,
			type: "int",
			descriptionTextKeys: ["CONDITION_DATERANGETYPE_SINGLE_MONTH", "CONDITION_DATERANGETYPE_MULTIPLE_MONTHS"],
			onChange: DateRangeType._IntOnChangeHandler,
			filterSuggestItem: DateRangeType._IntFilterSuggestItem,
			onItemSelected: DateRangeType._IntOnItemSelected,
			getControls: DateRangeType.ControlFactory
		},
		LASTQUARTERS: {
			key: "LASTQUARTERS",
			textKey: "CONDITION_DATERANGETYPE_LASTQUARTERS",
			singularTextKey: "CONDITION_DATERANGETYPE_LASTQUARTER",
			category: "DYNAMIC.QUARTER.INT",
			order: 19,
			defaultValues: [
				1
			],
			value1: null,
			type: "int",
			descriptionTextKeys: ["CONDITION_DATERANGETYPE_SINGLE_QUARTER", "CONDITION_DATERANGETYPE_MULTIPLE_QUARTERS"],
			onChange: DateRangeType._IntOnChangeHandler,
			filterSuggestItem: DateRangeType._IntFilterSuggestItem,
			onItemSelected: DateRangeType._IntOnItemSelected,
			getControls: DateRangeType.ControlFactory
		},
		LASTYEARS: {
			key: "LASTYEARS",
			textKey: "CONDITION_DATERANGETYPE_LASTYEARS",
			singularTextKey: "CONDITION_DATERANGETYPE_LASTYEAR",
			category: "DYNAMIC.YEAR.INT",
			order: 28,
			defaultValues: [
				1
			],
			value1: null,
			type: "int",
			descriptionTextKeys: ["CONDITION_DATERANGETYPE_SINGLE_YEAR", "CONDITION_DATERANGETYPE_MULTIPLE_YEARS"],
			onChange: DateRangeType._IntOnChangeHandler,
			filterSuggestItem: DateRangeType._IntFilterSuggestItem,
			onItemSelected: DateRangeType._IntOnItemSelected,
			getControls: DateRangeType.ControlFactory
		},
		NEXTDAYS: {
			key: "NEXTDAYS",
			textKey: "CONDITION_DATERANGETYPE_NEXTDAYS",
			singularTextKey: "CONDITION_DATERANGETYPE_TOMORROW",
			category: "DYNAMIC.DATE.INT",
			order: 5,
			defaultValues: [
				1
			],
			value1: null,
			type: "int",
			descriptionTextKeys: ["CONDITION_DATERANGETYPE_SINGLE_DAY", "CONDITION_DATERANGETYPE_MULTIPLE_DAYS"],
			onChange: DateRangeType._IntOnChangeHandler,
			filterSuggestItem: DateRangeType._IntFilterSuggestItem,
			onItemSelected: DateRangeType._IntOnItemSelected,
			getControls: DateRangeType.ControlFactory
		},
		NEXTWEEKS: {
			key: "NEXTWEEKS",
			textKey: "CONDITION_DATERANGETYPE_NEXTWEEKS",
			singularTextKey: "CONDITION_DATERANGETYPE_NEXTWEEK",
			category: "DYNAMIC.WEEK.INT",
			order: 10,
			defaultValues: [
				1
			],
			value1: null,
			type: "int",
			descriptionTextKeys: ["CONDITION_DATERANGETYPE_SINGLE_WEEK", "CONDITION_DATERANGETYPE_MULTIPLE_WEEKS"],
			onChange: DateRangeType._IntOnChangeHandler,
			filterSuggestItem: DateRangeType._IntFilterSuggestItem,
			onItemSelected: DateRangeType._IntOnItemSelected,
			getControls: DateRangeType.ControlFactory
		},
		NEXTMONTHS: {
			key: "NEXTMONTHS",
			textKey: "CONDITION_DATERANGETYPE_NEXTMONTHS",
			singularTextKey: "CONDITION_DATERANGETYPE_NEXTMONTH",
			category: "DYNAMIC.MONTH.INT",
			order: 16,
			defaultValues: [
				1
			],
			value1: null,
			type: "int",
			descriptionTextKeys: ["CONDITION_DATERANGETYPE_SINGLE_MONTH", "CONDITION_DATERANGETYPE_MULTIPLE_MONTHS"],
			onChange: DateRangeType._IntOnChangeHandler,
			filterSuggestItem: DateRangeType._IntFilterSuggestItem,
			onItemSelected: DateRangeType._IntOnItemSelected,
			getControls: DateRangeType.ControlFactory
		},
		NEXTQUARTERS: {
			key: "NEXTQUARTERS",
			textKey: "CONDITION_DATERANGETYPE_NEXTQUARTERS",
			singularTextKey: "CONDITION_DATERANGETYPE_NEXTQUARTER",
			category: "DYNAMIC.QUARTER.INT",
			order: 21,
			defaultValues: [
				1
			],
			value1: null,
			type: "int",
			descriptionTextKeys: ["CONDITION_DATERANGETYPE_SINGLE_QUARTER", "CONDITION_DATERANGETYPE_MULTIPLE_QUARTERS"],
			onChange: DateRangeType._IntOnChangeHandler,
			filterSuggestItem: DateRangeType._IntFilterSuggestItem,
			onItemSelected: DateRangeType._IntOnItemSelected,
			getControls: DateRangeType.ControlFactory
		},
		NEXTYEARS: {
			key: "NEXTYEARS",
			textKey: "CONDITION_DATERANGETYPE_NEXTYEARS",
			singularTextKey: "CONDITION_DATERANGETYPE_NEXTYEAR",
			category: "DYNAMIC.YEAR.INT",
			order: 30,
			defaultValues: [
				1
			],
			value1: null,
			type: "int",
			descriptionTextKeys: ["CONDITION_DATERANGETYPE_SINGLE_YEAR", "CONDITION_DATERANGETYPE_MULTIPLE_YEARS"],
			onChange: DateRangeType._IntOnChangeHandler,
			filterSuggestItem: DateRangeType._IntFilterSuggestItem,
			onItemSelected: DateRangeType._IntOnItemSelected,
			getControls: DateRangeType.ControlFactory
		},
		SPECIFICMONTH: {
			key: "SPECIFICMONTH",
			textKey: "CONDITION_DATERANGETYPE_SPECIFICMONTH",
			category: "DYNAMIC.MONTH",
			order: 11,
			defaultValues: function() {
				var oDate = new UniversalDate();
				return [
					oDate.getMonth()
				];
			},
			value1: null,
			onChange: DateRangeType._MonthOnChangeHandler,
			onItemSelected: DateRangeType._DefaultOnItemSelected,
			filterSuggestItem: DateRangeType._MonthFilterSuggestItem,
			getControls: function(oInstance, aResult, oOperation) {
				var oSelect = new Select(Type._createStableId(oInstance, "field"), {
					ariaLabelledBy: oInstance.oOperationSelect || null,
					width: "100%",
					selectedKey: {
						path: "$smartEntityFilter>value1",
						type: "sap.ui.model.type.Integer"
					}
				});
				oSelect.bindAggregation("items", {
					path: "$smartEntityFilter>/currentoperation/valueList",
					template: new sap.ui.core.ListItem({
						text: {
							path: "$smartEntityFilter>text"
						},
						key: {
							path: "$smartEntityFilter>key"
						}
					})
				});
				aResult.push(oSelect);
			},
			getValueList: function() {
				var oDate = new UniversalDate(),
					aMonths = [],
					oFormatter = sap.ui.core.format.DateFormat.getDateInstance({
						pattern: "MMMM"
					});
				oDate.setDate(15);
				oDate.setMonth(0);
				for (var i = 0; i < 12; i++) {
					aMonths.push({
						text: oFormatter.format(oDate),
						key: i
					});
					oDate.setMonth(oDate.getMonth() + 1);
				}
				return aMonths;
			}
		},
		TODAY: {
			key: "TODAY",
			textKey: "CONDITION_DATERANGETYPE_TODAY",
			category: "FIXED.DATE",
			order: 3,
			defaultValues: function() {
				return DateRangeType.getDateRange(1, "DAY", true);
			},
			type: "range",
			display: "start",
			onChange: DateRangeType._defaultOnChangeHandler,
			onItemSelected: DateRangeType._DefaultOnItemSelected,
			getControls: DateRangeType.ControlFactory
		},
		THISWEEK: DateRangeType.getFixedRangeOperation("THISWEEK", "CONDITION_DATERANGETYPE_THISWEEK", "FIXED.WEEK", function() {
			return DateRangeType.getDateRange(1, "WEEK", true);
		}, DateRangeType._DefaultFilterSuggestItem, 6),
		LASTWEEK: DateRangeType.getFixedRangeOperation("LASTWEEK", "CONDITION_DATERANGETYPE_LASTWEEK", "FIXED.WEEK", function() {
			return DateRangeType.getDateRange(-1, "WEEK", true);
		}, DateRangeType._DefaultFilterSuggestItem, 7),
		LAST2WEEKS: DateRangeType.getFixedRangeOperation("LAST2WEEKS", "CONDITION_DATERANGETYPE_LAST2WEEKS", "FIXED.WEEK", function() {
			return DateRangeType.getDateRange(-2, "WEEK", true);
		}, DateRangeType._HideFilterSuggestItem, -1),
		LAST3WEEKS: DateRangeType.getFixedRangeOperation("LAST3WEEKS", "CONDITION_DATERANGETYPE_LAST3WEEKS", "FIXED.WEEK", function() {
			return DateRangeType.getDateRange(-3, "WEEK", true);
		}, DateRangeType._HideFilterSuggestItem, -1),
		LAST4WEEKS: DateRangeType.getFixedRangeOperation("LAST4WEEKS", "CONDITION_DATERANGETYPE_LAST4WEEKS", "FIXED.WEEK", function() {
			return DateRangeType.getDateRange(-4, "WEEK", true);
		}, DateRangeType._HideFilterSuggestItem, -1),
		LAST5WEEKS: DateRangeType.getFixedRangeOperation("LAST5WEEKS", "CONDITION_DATERANGETYPE_LAST5WEEKS", "FIXED.WEEK", function() {
			return DateRangeType.getDateRange(-5, "WEEK", true);
		}, DateRangeType._HideFilterSuggestItem, -1),
		NEXTWEEK: DateRangeType.getFixedRangeOperation("NEXTWEEK", "CONDITION_DATERANGETYPE_NEXTWEEK", "FIXED.WEEK", function() {
			return DateRangeType.getDateRange(1, "WEEK", true, true, true);
		}, DateRangeType._DefaultFilterSuggestItem, 9),
		NEXT2WEEKS: DateRangeType.getFixedRangeOperation("NEXT2WEEKS", "CONDITION_DATERANGETYPE_NEXT2WEEKS", "FIXED.WEEK", function() {
			return DateRangeType.getDateRange(2, "WEEK", true, true, true);
		}, DateRangeType._HideFilterSuggestItem, -1),
		NEXT3WEEKS: DateRangeType.getFixedRangeOperation("NEXT3WEEKS", "CONDITION_DATERANGETYPE_NEXT3WEEKS", "FIXED.WEEK", function() {
			return DateRangeType.getDateRange(3, "WEEK", true, true, true);
		}, DateRangeType._HideFilterSuggestItem, -1),
		NEXT4WEEKS: DateRangeType.getFixedRangeOperation("NEXT4WEEKS", "CONDITION_DATERANGETYPE_NEXT4WEEKS", "FIXED.WEEK", function() {
			return DateRangeType.getDateRange(4, "WEEK", true, true, true);
		}, DateRangeType._HideFilterSuggestItem, -1),
		NEXT5WEEKS: DateRangeType.getFixedRangeOperation("NEXT5WEEKS", "CONDITION_DATERANGETYPE_NEXT5WEEKS", "FIXED.WEEK", function() {
			return DateRangeType.getDateRange(5, "WEEK", true, true, true);
		}, DateRangeType._HideFilterSuggestItem, -1),
		THISMONTH: DateRangeType.getFixedRangeOperation("THISMONTH", "CONDITION_DATERANGETYPE_THISMONTH", "FIXED.MONTH", function() {
			return DateRangeType.getDateRange(1, "MONTH", true);
		}, DateRangeType._DefaultFilterSuggestItem, 12),
		LASTMONTH: DateRangeType.getFixedRangeOperation("LASTMONTH", "CONDITION_DATERANGETYPE_LASTMONTH", "FIXED.MONTH", function() {
			return DateRangeType.getDateRange(-1, "MONTH", true);
		}, DateRangeType._DefaultFilterSuggestItem, 13),
		NEXTMONTH: DateRangeType.getFixedRangeOperation("NEXTMONTH", "CONDITION_DATERANGETYPE_NEXTMONTH", "FIXED.MONTH", function() {
			return DateRangeType.getDateRange(1, "MONTH", true, true, true);
		}, DateRangeType._DefaultFilterSuggestItem, 15),
		THISQUARTER: DateRangeType.getFixedRangeOperation("THISQUARTER", "CONDITION_DATERANGETYPE_THISQUARTER", "FIXED.QUARTER", function() {
			return DateRangeType.getDateRange(1, "QUARTER", true);
		}, DateRangeType._DefaultFilterSuggestItem, 17),
		LASTQUARTER: DateRangeType.getFixedRangeOperation("LASTQUARTER", "CONDITION_DATERANGETYPE_LASTQUARTER", "FIXED.QUARTER", function() {
			return DateRangeType.getDateRange(-1, "QUARTER", true);
		}, DateRangeType._DefaultFilterSuggestItem, 18),
		NEXTQUARTER: DateRangeType.getFixedRangeOperation("NEXTQUARTER", "CONDITION_DATERANGETYPE_NEXTQUARTER", "FIXED.QUARTER", function() {
			return DateRangeType.getDateRange(1, "QUARTER", true, true, true);
		}, DateRangeType._DefaultFilterSuggestItem, 20),
		YEARTODATE: DateRangeType.getFixedRangeOperation("YEARTODATE", "CONDITION_DATERANGETYPE_YEARTODATE", "FIXED.YEAR", function() {
			return [
				DateRangeType.getYearStartDate(new UniversalDate()), DateRangeType.setEndTime()
			];
		}, DateRangeType._DefaultFilterSuggestItem, 31),
		THISYEAR: DateRangeType.getFixedRangeOperation("THISYEAR", "CONDITION_DATERANGETYPE_THISYEAR", "FIXED.YEAR", function() {
			return DateRangeType.getDateRange(1, "YEAR", true);
		}, DateRangeType._DefaultFilterSuggestItem, 26),
		LASTYEAR: DateRangeType.getFixedRangeOperation("LASTYEAR", "CONDITION_DATERANGETYPE_LASTYEAR", "FIXED.YEAR", function() {
			return DateRangeType.getDateRange(-1, "YEAR", true);
		}, DateRangeType._DefaultFilterSuggestItem, 27),
		NEXTYEAR: DateRangeType.getFixedRangeOperation("NEXTYEAR", "CONDITION_DATERANGETYPE_NEXTYEAR", "FIXED.YEAR", function() {
			return DateRangeType.getDateRange(1, "YEAR", true, true, true);
		}, DateRangeType._DefaultFilterSuggestItem, 29),
		QUARTER1: DateRangeType.getFixedRangeOperation("QUARTER1", "CONDITION_DATERANGETYPE_QUARTER1", "FIXED.QUARTER", function() {
			var oStartDate = DateRangeType.getYearStartDate();
			return DateRangeType.getDateRange(1, "QUARTER", oStartDate);
		}, DateRangeType._DefaultFilterSuggestItem, 22),
		QUARTER2: DateRangeType.getFixedRangeOperation("QUARTER2", "CONDITION_DATERANGETYPE_QUARTER2", "FIXED.QUARTER", function() {
			var oStartDate = DateRangeType.getDateRange(1, "QUARTER", DateRangeType.getYearStartDate())[1];
			oStartDate.setMilliseconds(1000);
			return DateRangeType.getDateRange(1, "QUARTER", oStartDate);
		}, DateRangeType._DefaultFilterSuggestItem, 23),
		QUARTER3: DateRangeType.getFixedRangeOperation("QUARTER3", "CONDITION_DATERANGETYPE_QUARTER3", "FIXED.QUARTER", function() {
			var oStartDate = DateRangeType.getDateRange(2, "QUARTER", DateRangeType.getYearStartDate())[1];
			oStartDate.setMilliseconds(1000);
			return DateRangeType.getDateRange(1, "QUARTER", oStartDate);
		}, DateRangeType._DefaultFilterSuggestItem, 24),
		QUARTER4: DateRangeType.getFixedRangeOperation("QUARTER4", "CONDITION_DATERANGETYPE_QUARTER4", "FIXED.QUARTER", function() {
			var oStartDate = DateRangeType.getDateRange(3, "QUARTER", DateRangeType.getYearStartDate())[1];
			oStartDate.setMilliseconds(1000);
			return DateRangeType.getDateRange(1, "QUARTER", oStartDate);
		}, DateRangeType._DefaultFilterSuggestItem, 25)
	};

	/**
	 * Returns the controls to be used for the given operation
	 *
	 * @param {object} oOperation the current operation of the condition type
	 * @returns [sap.ui.core.Control] Array of controls to be used to visualize the condition types operation
	 * @protected
	 */
	DateRangeType.prototype.getControls = function(oOperation) {
		var aControls = [];
		if (!oOperation) {
			return;
		}
		oOperation.getControls(this, aControls, oOperation);
		return aControls;
	};


	/**
	 * Property setter for the ignoreTime
	 *
	 * @param {boolean} bIgnoreTime new value of this property
	 * @public
	 */
	DateRangeType.prototype.setIgnoreTime = function(bIgnoreTime) {
		this._bIgnoreTime = bIgnoreTime;
	};

	/**
	 * Gets current value of property ignoreTime.
	 * When the value is true, the returned range enddate has a time stamp of 00:00:00. The default for the time stamp is 23:59:59:999
	 *
	 * Default value is false.
	 *
	 * @returns {boolean} of controls to be used to visualize the condition types operation
	 * @public
	 */
	Type.prototype.getIgnoreTime = function(bIgnoreTime) {
		return this._bIgnoreTime;
	};

	/**
	 * Returns the default values for the given operation
	 *
	 * @param {object} oOperation the current operation of the condition type
	 * @returns [object] Array of default values to be used for the operation
	 * @protected
	 */
	DateRangeType.prototype.getDefaultValues = function(oOperation) {
		if (!oOperation) {
			return [];
		}
		var aDefaultValues = oOperation.defaultValues || [];
		if (typeof aDefaultValues === "function") {
			aDefaultValues = oOperation.defaultValues();
		}
		var oCondition = this.getCondition(),
			oValue1 = aDefaultValues[0] || null,
			oValue2 = aDefaultValues[1] || null;
		if (oOperation.key === "DATERANGE" && oCondition && oCondition.value1 && oCondition.value2) {
			//Default fallback to a date range if value1 and value2 are already provided as dates
			oValue1 = oCondition.value1.oDate || oCondition.value1;
			oValue2 = oCondition.value2.oDate || oCondition.value2;
		} else {
			// make sure that both values are of type UniversalDate
			if (oValue1 instanceof Date) {
				oValue1 = new UniversalDate(oValue1);
			}
			if (oValue2 instanceof Date) {
				oValue2 = new UniversalDate(oValue2);
			}
		}

		return [
			oValue1, oValue2
		];
	};

	DateRangeType.prototype.getOperations = function() {
		var aOperations = [];
		for (var n in DateRangeType.Operations) {
			var oOperation = DateRangeType.Operations[n];
			if (this._filterOperation(oOperation)) {
				aOperations.push(oOperation);
			}
		}
		return aOperations;
	};

	DateRangeType.prototype._updateOperation = function(oOperation) {
		Type.prototype._updateOperation.apply(this, [oOperation]);

		if (oOperation.languageText && !oOperation.basicLanguageText) {
			oOperation.basicLanguageText = oOperation.languageText;
			if (!oOperation.singulareBasicLanguageText && oOperation.singularTextKey) {
				oOperation.singulareBasicLanguageText = this.getTranslatedText(oOperation.singularTextKey);
			}
			oOperation.languageText = this._fillNumberToText(oOperation.languageText);
		}

		if (oOperation.display) {
			var aDefaultValues = this.getDefaultValues(oOperation);
			var oDateFormatter = this._getDateFormatter(false);

			if (oOperation.display === "start") {
				oOperation.textValue = oDateFormatter.format(aDefaultValues[0].oDate);
			} else if (oOperation.display === "range" && aDefaultValues && aDefaultValues[0] && aDefaultValues[1]) {
				// in some cases (when you toggle between variants which use async app operations) the aDefaultValues can be empty or the values null 
				// BCP 002075129500003647642017
				oOperation.textValue = oDateFormatter.format(aDefaultValues[0].oDate) + " - " + oDateFormatter.format(aDefaultValues[1].oDate);
			}
		}

		oOperation.suggestText = oOperation.languageText;
	};

	DateRangeType.prototype.updateOperations = function() {
		var aOperations = this.getOperations();
		for (var i = 0; i < aOperations.length; i++) {
			this._updateOperation(aOperations[i]);
		}
		return this.oModel.setProperty("operations", aOperations, this.getContext(), true);
	};

	DateRangeType.prototype.isValidCondition = function() {
		var oCondition = this.getCondition(),
			oOperation = this.getOperation(oCondition.operation);
		if (oOperation && oCondition && oCondition.key && oCondition.operation) {
			if ("value1" in oOperation && "value2" in oOperation) {
				return "value1" in oCondition && oCondition.value1 !== null && "value2" in oCondition && oCondition.value2 !== null;
			} else if ("value1" in oOperation) {
				return "value1" in oCondition && oCondition.value1 !== null;
			} else if ("value2" in oOperation) {
				return "value2" in oCondition && oCondition.value2 !== null;
			} else if (!("value1" in oOperation) && !("value2" in oOperation)) {
				return true;
			}
		}
		return false;
	};

	DateRangeType.prototype.providerDataUpdated = function(aUpdatedFieldNames, oData) {
		/*		
		jQuery.sap.log.error(">>> " + this.sFieldName + " / "+ JSON.stringify(oData[this.sFieldName]));
		jQuery.sap.log.error(">>> " + JSON.stringify(aUpdatedFieldNames));
		for (var n in aUpdatedFieldNames) {
			jQuery.sap.log.error(">>> " + aUpdatedFieldNames[n] + ": " + JSON.stringify(oData[aUpdatedFieldNames[n]]));
		}
		jQuery.sap.log.error(">>> "); 
		*/
	};

	DateRangeType.prototype.initialize = function(oJson) {
		Type.prototype.initialize.apply(this, [oJson]);
		this.oModel.suspend();
		var oOrgJson = jQuery.extend({}, oJson, true);

		var sCalendarType = (new UniversalDate()).getCalendarType();
		if (!oJson.conditionTypeInfo) {
			if (oJson.ranges && oJson.ranges.length == 1) {
				// if no conditionTypeInfo exist but one ranges item we restore the date range as DATERANGE operation. This is required for a better deserialize handling of DataSuite format.
				var sOperation = "DATERANGE";
				if (oJson.ranges[0].operation === "GE") {
					//if the range operation is GE we map it on the FROM DateRangeType operation 
					sOperation = "FROM";
				}
				if (oJson.ranges[0].operation === "LE") {
					//if the range operation is LE we map it on the TO DateRangeType operation 
					sOperation = "TO";
				}
				oJson.conditionTypeInfo = {
					name: this.getName(),
					data: {
						key: this.sFieldName,
						operation: sOperation,
						value1: oJson.ranges[0].value1,
						value2: oJson.ranges[0].value2,
						calendarType: sCalendarType
					}
				};
			} else {
				var oDefaultOperation = this.getDefaultOperation(),
					sKey = oDefaultOperation ? oDefaultOperation.key : "";
				oJson.conditionTypeInfo = {
					name: this.getName(),
					data: {
						key: this.sFieldName,
						operation: sKey,
						calendarType: sCalendarType
					}
				};
			}
		}
		if (oJson.conditionTypeInfo) {
			oJson = oJson.conditionTypeInfo;
		}
		if (oJson.name && oJson.data) {
			if (oJson.name !== this.getName()) {

				jQuery.sap.log.debug("ConditionType " + this.getName() + " tries to deserialize data from " + oJson.name);
			}
			oJson = oJson.data;
		}
		if (!oJson.operation) {
			return;
		}


		// map not supported operations like NEXT2WEEKS to NEXTWEEKS with value1=2
		if (this.getOperation(oJson.operation) && this.getOperation(oJson.operation).order < 0) {
			var index = ["LAST2WEEKS", "LAST3WEEKS", "LAST4WEEKS", "LAST5WEEKS"].indexOf(oJson.operation);
			if (index >= 0) {
				oJson.operation = "LASTWEEKS";
				oJson.value1 = index + 2;
			}
			index = ["NEXT2WEEKS", "NEXT3WEEKS", "NEXT4WEEKS", "NEXT5WEEKS"].indexOf(oJson.operation);
			if (index >= 0) {
				oJson.operation = "NEXTWEEKS";
				oJson.value1 = index + 2;
			}
		}

		var oOperation = this.getOperation(oJson.operation);
		if (!oOperation) {
			// if no operation is found and the Type is async we wait for PendingChange
			if (this.getAsync()) {

				this.setPending(true);

				var that = this,
					fnHandler = function(oEvent) {
						if (oEvent.getParameter("pending") === false) {
							that.oFilterProvider.detachPendingChange(fnHandler);
							that.initialize(oOrgJson);
						}
					};
				this.oFilterProvider.attachPendingChange(fnHandler);

				this.oModel.resume();
				return;
			}
			//TODO if not async we could use the DefaultOperation????
		}

		var aValues;
		// handle transform from calendar type differences
		if (sCalendarType !== oJson.calendarType && (oJson.calendarType === "Islamic" || sCalendarType === "Islamic") && oJson.operation === "SPECIFICMONTH") {
			oJson.operation = "DATERANGE";
			var iValue = parseInt(oJson.value1, 10),
				oDate = UniversalDate.getInstance(new Date(), oJson.calendarType);
			oDate.setMonth(iValue);
			oDate = DateRangeType.getMonthStartDate(oDate);
			aValues = DateRangeType.getDateRange(1, "MONTH", oDate, true);
			oJson.value1 = aValues[0].oDate.toISOString();
			oJson.value2 = aValues[1].oDate.toISOString();
		}

		var oProperty = this.getConditionContext().getObject();

		oProperty.operation = oJson.operation;
		oProperty.key = oJson.key;
		oProperty.value1 = null;
		oProperty.value2 = null;
		if (oJson.operation === "DATERANGE") {
			if (typeof oJson.value1 === "string") {
				oJson.value1 = oJson.value1 === "" ? null : (new UniversalDate(oJson.value1)).oDate;
			}
			if (typeof oJson.value2 === "string") {
				oJson.value2 = oJson.value2 === "" ? null : (new UniversalDate(oJson.value2)).oDate;
			}
			oProperty.value1 = oJson.value1;
			oProperty.value2 = oJson.value2;
		} else if (oJson.operation === "FROM") {
			if (typeof oJson.value1 === "string") {
				oJson.value1 = oJson.value1 === "" ? null : (new UniversalDate(oJson.value1)).oDate;
			}
			oProperty.value1 = oJson.value1;
		} else if (oJson.operation === "TO") {
			if (typeof oJson.value1 === "string") {
				oJson.value1 = oJson.value1 === "" ? null : (new UniversalDate(oJson.value1)).oDate;
			}
			oProperty.value1 = oJson.value1;
		} else if ([
				"LASTDAYS", "LASTWEEKS", "LASTMONTHS", "LASTQUARTERS", "LASTYEARS"
			].indexOf(oJson.operation) > -1) {
			oProperty.value1 = oJson.value1;
		} else if (oJson.operation === "SPECIFICMONTH") {
			oProperty.value1 = oJson.value1 + "";
		} else {
			aValues = this.getDefaultValues(this.getOperation(oJson.operation));
			oProperty.value1 = aValues[0];
			oProperty.value2 = aValues[1];
		}

		// ignore some model change events, so that we not overwrite the values by some defaultValues 
		this.bIgnoreBindingChange = true;
		this.oModel.resume();
		delete this.bIgnoreBindingChange;

		this.serialize(true, false);
	};

	DateRangeType.prototype.serialize = function(bUpdateProviderSyncron, bFireFilterChange) {
		var oJson = {},
			oCondition = this.getCondition();
		if (!oCondition.operation) {
			return null;
		}
		var oOperation = this.getOperation(oCondition.operation);
		if (!oOperation || !("value1" in oOperation)) {
			oCondition.value1 = null;
		}
		if (!oOperation || !("value2" in oOperation)) {
			oCondition.value2 = null;
		}
		oCondition.calendarType = (new UniversalDate()).getCalendarType();
		oJson.conditionTypeInfo = {
			name: this.getName(),
			data: oCondition
		};

		if (this.iChangeTimer) {
			jQuery.sap.clearDelayedCall(this.iChangeTimer);
			delete this.iChangeTimer;
		}

		if (bUpdateProviderSyncron) {
			this._updateProvider(oJson, true, bFireFilterChange);
		} else {
			this.iChangeTimer = jQuery.sap.delayedCall(1, this, this._updateProvider, [oJson, false, bFireFilterChange]);
		}

		return oJson;
	};


	DateRangeType.prototype._updateProvider = function(oJson, bSync, bFireFilterChange) {
		//this.validate(false);
		oJson.ranges = this.getFilterRanges();
		oJson.items = [];
		var bSetCursor = false;
		var iCursorPos = 0;
		var iSelectionStart = 0;
		var iSelectionEnd = 0;

		//TODO newDRTUI
		//  update the formattedText and the inputstate which we display in the input field   
		if (this.oModel.getData().currentoperation.languageText) {
			var oData = this.oModel.getData();
			//TODO Check if we can do this calculation of formattedText at another place
			var sFormattedText = oData.currentoperation.languageText;

			if (oData.currentoperation.basicLanguageText.indexOf("{0}") >= 0) {
				if (oJson.conditionTypeInfo.data.value1 != null && oJson.conditionTypeInfo.data.value1 != "") {
					if (oJson.conditionTypeInfo.data.value1 === 1 && oData.currentoperation.singulareBasicLanguageText) {
						sFormattedText = oData.currentoperation.singulareBasicLanguageText;
					} else {
						sFormattedText = this._fillNumberToText(oData.currentoperation.basicLanguageText, oJson.conditionTypeInfo.data.value1);
					}
					this.oModel.setProperty("inputstate", "NONE", this.getContext());
				} else if (this._bSuggestItemSelected) {
					sFormattedText = this._fillNumberToText(oData.currentoperation.basicLanguageText);
					var xPos = oData.currentoperation.basicLanguageText.indexOf("{0}");
					iCursorPos = xPos + 1;
					iSelectionStart = xPos;
					iSelectionEnd = xPos + 1;
					bSetCursor = true;
				} else {
					sFormattedText = "";
					this.oModel.setProperty("inputstate", "NONE", this.getContext());
				}
			} else if (oData.currentoperation.textValue) {
				sFormattedText = oData.currentoperation.languageText + " (" + oData.currentoperation.textValue + ")";
				this.oModel.setProperty("inputstate", "NONE", this.getContext());
			} else {
				if (oJson.conditionTypeInfo.data.value1 !== null && oJson.conditionTypeInfo.data.value1 !== "") {
					var v1 = oJson.conditionTypeInfo.data.value1;
					var v2 = oJson.conditionTypeInfo.data.value2;
					var sValue;
					if (typeof v1 === "number" && oData.currentoperation.valueList) {
						// in case of number access the month from  the value List array
						sValue = oData.currentoperation.valueList[v1].text;
					} else if (v1 instanceof Date) {
						var oDateFormatter = this._getDateFormatter(false);
						if (oJson.conditionTypeInfo.data.operation !== "DATERANGE" && (v1 && !v2)) {
							sValue = oDateFormatter.format(v1);
						} else if (oJson.conditionTypeInfo.data.operation === "DATERANGE" && v1 && v2) {
							//TODO replace "-" by Delimiter 
							sValue = oDateFormatter.format(v1) + " - " + oDateFormatter.format(v2);
						} else if (oJson.conditionTypeInfo.data.operation === "DATERANGE" && v1 && !v2 && !(this._oPopup && this._oPopup.isOpen())) {
							//TODO replace "-" by Delimiter 
							sValue = oDateFormatter.format(v1) + " - ";
							bSetCursor = true;
						} else {
							sValue = "";
						}
					} else {
						sValue = oJson.conditionTypeInfo.data.value1;
					}

					if (sValue) {
						sFormattedText = oData.currentoperation.languageText + " (" + sValue + ")";
						iCursorPos = sFormattedText.length - 1;
						this.oModel.setProperty("inputstate", "NONE", this.getContext());
					} else {
						sFormattedText = "";
					}
				} else {
					// not a valid condition
					sFormattedText = "";
				}
			}
			this._bSuggestItemSelected = false;
			this.oModel.setProperty("/formattedText", sFormattedText);

			if (bSetCursor && !(this._oPopup && this._oPopup.isOpen())) {
				// set cursor to placeholder
				this._oInput.$("inner").cursorPos(iCursorPos);
				if (iSelectionStart < iSelectionEnd) {
					this._oInput.selectText(iSelectionStart, iSelectionEnd);
				}
				this._oInput._lastValue = ""; // to recheck by focusout again as it might be an invalid value
			}
		}

		if (this.oFilterProvider) {
			this.oFilterProvider.oModel.setProperty("/" + this.sFieldName, oJson);
			this.oFilterProvider.setFilterData({}, false, this.sFieldName);

			if (bFireFilterChange && this.oFilterProvider._oSmartFilter) {
				//call the fireFilterChange syncron 
				this.oFilterProvider._oSmartFilter.fireFilterChange();

				// because the DateRangeType does not have a change event which will in case of liveMode trigger a search we call the triggerSearch explicit. 
				if (this.oFilterProvider._oSmartFilter.getLiveMode()) {
					this.oFilterProvider._oSmartFilter.triggerSearch(sap.ui.comp.smartfilterbar.SmartFilterBar.LIVE_MODE_INTERVAL);
				}
			}
		}
	};

	DateRangeType.prototype.getFilterRanges = function() {
		var oCondition = this.getCondition(),
			aValues = [];

		if (oCondition.operation === "LASTDAYS") {
			aValues = DateRangeType.getDateRange(-oCondition.value1, "DAY", true);
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "LASTWEEKS") {
			aValues = DateRangeType.getDateRange(-oCondition.value1, "WEEK", true);
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "LASTMONTHS") {
			aValues = DateRangeType.getDateRange(-oCondition.value1, "MONTH", true);
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "LASTQUARTERS") {
			aValues = DateRangeType.getDateRange(-oCondition.value1, "QUARTER", true);
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "LASTYEARS") {
			aValues = DateRangeType.getDateRange(-oCondition.value1, "YEAR", true);
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "NEXTDAYS") {
			aValues = DateRangeType.getDateRange(oCondition.value1, "DAY", true, true, true);
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "NEXTWEEKS") {
			aValues = DateRangeType.getDateRange(oCondition.value1, "WEEK", true, true, true);
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "NEXTMONTHS") {
			aValues = DateRangeType.getDateRange(oCondition.value1, "MONTH", true, true, true);
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "NEXTQUARTERS") {
			aValues = DateRangeType.getDateRange(oCondition.value1, "QUARTER", true, true, true);
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "NEXTYEARS") {
			aValues = DateRangeType.getDateRange(oCondition.value1, "YEAR", true, true, true);
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		} else if (oCondition.operation === "SPECIFICMONTH") {
			var iValue = parseInt(oCondition.value1, 10),
				oDate = new UniversalDate();
			oDate.setMonth(iValue);
			oDate = DateRangeType.getMonthStartDate(oDate);
			aValues = DateRangeType.getDateRange(1, "MONTH", oDate, true);
			oCondition.value1 = aValues[0];
			oCondition.value2 = aValues[1];
		}

		if (oCondition.value1 instanceof UniversalDate) {
			oCondition.value1 = oCondition.value1.oDate;
		}
		if (oCondition.value2 instanceof UniversalDate) {
			oCondition.value2 = oCondition.value2.oDate;
		}

		if (oCondition.operation === "FROM") {
			if (!(this.isValidCondition() && oCondition.value1)) {
				return [];
			}
			oCondition.operation = "GE";
			delete oCondition.value2;
		} else if (oCondition.operation === "TO") {
			if (!(this.isValidCondition() && oCondition.value1)) {
				return [];
			}
			oCondition.operation = "LE";
			delete oCondition.value2;

			if (this._bIgnoreTime) {
				oCondition.value1 = DateRangeType.setStartTime(oCondition.value1).oDate;
			} else {
				oCondition.value1 = DateRangeType.setEndTime(oCondition.value1).oDate;
			}
		} else {
			if (!(this.isValidCondition() && oCondition.value1 && oCondition.value2)) {
				return [];
			}
			oCondition.operation = "BT";

			if (this._bIgnoreTime) {
				// set the time to 00:00:00
				oCondition.value2 = DateRangeType.setStartTime(oCondition.value2).oDate;
			} else {
				// ensure the day and set time to beginning of day
				oCondition.value1 = DateRangeType.setStartTime(oCondition.value1).oDate;

				// include the day and set time to 23:59:59:999
				oCondition.value2 = DateRangeType.setEndTime(oCondition.value2).oDate;
			}
		}

		oCondition.exclude = false;
		oCondition.keyField = oCondition.key;
		delete oCondition.key;

		return [
			oCondition
		];
	};

	DateRangeType.prototype.getTokenText = function() {
		return "";
	};

	DateRangeType.prototype.getName = function() {
		return this.getMetadata().getName();
	};

	DateRangeType.prototype.getType = function() {
		return "Edm.Date";
	};

	DateRangeType.prototype._bindValueState = function(oControl) {
		oControl.bindProperty("valueState", {
			path: "$smartEntityFilter>inputstate",
			formatter: function() {
				if (this.getBinding("valueState").getValue() === "ERROR") {
					return sap.ui.core.ValueState.Error;
				} else {
					return sap.ui.core.ValueState.None;
				}
			}
		});
	};

	DateRangeType.prototype.initializeFilterItem = function() {
		this._oInput = new sap.m.Input(Type._createStableId(this), {
			value: "{$smartEntityFilter>formattedText}",
			//tooltip: "{$smartEntityFilter>formattedText}",
			showValueHelp: true,
			showSuggestion: true,
			maxSuggestionWidth: "auto",
			valueHelpRequest: this._toggleOpen.bind(this)
		});

		//TODO overwrite the default highlight function and not hightligh values in the addtionalValue column
		this._oInput._highlightListText = function() {
			var i,
				label,
				labels = this._oList.$().find('.sapMDLILabel, .sapMSLITitleOnly');

			for (i = 0; i < labels.length; i++) {
				label = labels[i];
				label.innerHTML = this._createHighlightedText(label);
			}
		};

		// Test: if we can open the suggest list via CTRL+SPACE
		// this._oInput.onkeydown = function(oEvent) {

		// 	if (oEvent.keyCode == jQuery.sap.KeyCodes.SPACE && oEvent.ctrlKey) {
		// 		oEvent.preventDefault();
		// 		this._triggerSuggest(" ");
		// 	}

		// 	sap.m.Input.prototype.onkeydown.apply( this, arguments );
		// };		

		this._bindValueState(this._oInput);

		this._oInput.bindAggregation("suggestionItems", {
			path: "$smartEntityFilter>operations",
			sorter: new sap.ui.model.Sorter("order", false, false),
			filters: new sap.ui.model.Filter("order", function(oValue) {
				return oValue !== undefined && oValue > -1;
			}),
			template: new sap.ui.core.ListItem({
				//				text: {
				//					path: "$smartEntityFilter>suggestText"
				//				},
				key: {
					path: "$smartEntityFilter>key"
						//				},
						//				additionalText: {
						//					path: "$smartEntityFilter>textValue"
				}
			})
		});

		this._oInput.setFilterFunction(function(sValue, oItem) {
			if (this._oPopup && this._oPopup.isOpen()) {
				return false;
			}

			var oOperation = this.getOperation(oItem.getKey());

			sValue = sValue.trim();
			if (sValue === "?") {
				// make all operations visible which can be selected and not do open the _oPopup
				DateRangeType._DefaultFilterSuggestItem.call(oOperation, sValue, oItem, this);
				return oOperation.category !== "DYNAMIC.DATERANGE" && oOperation.category !== "DYNAMIC.DATE";
			}

			if (oOperation.filterSuggestItem) {
				return oOperation.filterSuggestItem(sValue, oItem, this);
			} else {
				// default filtering
				return DateRangeType._DefaultFilterSuggestItem.call(oOperation, sValue, oItem, this);
			}
		}.bind(this));

		this._oInput.attachSuggestionItemSelected(function(oEvent) {
			var oItem = oEvent.getParameter("selectedItem");
			if (!oItem) {
				return;
			}
			var sOperation = oItem.getKey();
			var oOperation = this.getOperation(sOperation);
			var sValue = oEvent.oSource.getValue().trim();

			if (oOperation.onItemSelected) {
				oOperation.onItemSelected(sValue, oItem, this);
				return;
			} else {
				DateRangeType._DefaultOnItemSelected.call(oOperation, sValue, oItem, this);
			}
		}.bind(this));

		this._oInput.attachChange(function(oEvent) {
			var sValue = oEvent.getParameter("value");
			if (sValue) {

				//jQuery.sap.log.debug("DateRangeType ", sValue);

				var aOperarations = this.getOperations();
				var bHandled = aOperarations.some(function(oOperation) {
					if (oOperation.onChange) {
						return oOperation.onChange(sValue, this);
					} else {
						return DateRangeType._defaultOnChangeHandler.call(oOperation, sValue, this);
					}
				}, this);

				if (!bHandled) {
					this.oModel.setProperty("inputstate", "ERROR", this.getContext());
				}
			} else {
				// field is blanked/empty

				this.setCondition({
					key: this.sFieldName,
					operation: "FROM",
					value1: null,
					value2: null
				});

				this.oModel.setProperty("inputstate", "NONE", this.getContext());
			}
		}.bind(this));

		this._oInput.attachBrowserEvent("focusin", function(oEvent) {
			if (jQuery(oEvent.target).hasClass("sapMInputBaseInner") && this._oPopup && this._oPopup.isOpen()) {
				this._oPopup.close();
			}
		}.bind(this));

		this._oInput.setBindingContext(this.getContext(), "$smartEntityFilter");

		this._oInput.setModel(this.getModel(), "$smartEntityFilter");
		//this.bIgnoreBindingChange = true;
		this.bFireFilterChange = false;
		this.getModel().checkUpdate(true);
		this.bFireFilterChange = true;
		//this.bIgnoreBindingChange = false;
		
		return this._oInput;
	};

	DateRangeType.prototype._toggleOpen = function(oEvent) {
		//		var sOperation = this.oModel.getProperty("operation", this.oConditionContext);
		//		var oOperation = this.getOperation(sOperation);
		//		var bOpenSuggest = false;
		//		if (oOperation.category.indexOf("DYNAMIC") < 0) {
		//			bOpenSuggest = true;
		//		}

		//		if ((this.oInput.getValue() === "" || bOpenSuggest) && oEvent) {
		//			this.oInput.setFilterFunction(function() { return true; } );
		//			//this.oInput._oSuggestionPopup.open();
		//			var sOrgValue = this.oInput.getValue(" ");
		//			this.oInput.setValue(" ");
		//			this.oInput._triggerSuggest(" ");		
		//			jQuery.sap.delayedCall(500, this, function(){ 
		//				this.oInput.setFilterFunction();
		//				this.oInput.setValue(sOrgValue);
		//			});
		//			return;
		//		}

		// create popover
		if (!this._oPopup) {
			this._oPopupLayout = new sap.m.VBox();
			this._oPopupLayout.addStyleClass("sapUiCompDateRangeType");
			this._initializeFilterItemPopoverContent(this._oPopupLayout);

			this._oPopup = new sap.m.ResponsivePopover({
				showCloseButton: false,
				showArrow: true,
				showHeader: false,
				horizontalScrolling: false,
				//				title: "{$smartEntityFilter>/currentoperation/languageText}",
				placement: sap.m.PlacementType.VerticalPreferedBottom,
				//				beginButton: new sap.m.Button({ 
				//					text: "Ok", 
				//					press: jQuery.proxy(function(oEvent){
				//						this._oPopup.close();
				//					}, this)
				//				}),
				//				endButton: new sap.m.Button({ 
				//					text: "Cancel", 
				//					press: jQuery.proxy(function(oEvent){
				//						this._oPopup.close();
				//					}, this)}),
				content: this._oPopupLayout,
				contentWidth: "18rem"
			});
			
			this._oPopup.addAriaLabelledBy(this._oOperationLabel);

			if (sap.ui.Device.system.phone) {
				// One phone we have to provide at lease a close button
				this._oPopup.setBeginButton(new sap.m.Button({
					text: Type.getTranslatedText("CONDITION_DATERANGETYPE_POPOVER_CLOSEBUTTON"),
					type: "Emphasized",
					press: function(oEvent) {
						this._oPopup.close();
					}.bind(this)
				}));
			}

			sap.ui.getCore().getMessageManager().registerObject(this._oPopup, true);
			this._oPopup.setModel(this.getModel(), "$smartEntityFilter");
			this._oPopup._oControl.oPopup.setAutoCloseAreas([this._oInput.getDomRef()]);
		}

		if (!this._oPopup.isOpen()) {
			this._oPopup.openBy(this._oInput._getValueHelpIcon());
		} else {
			this._oPopup.close();
		}
	};

	DateRangeType.prototype._getDateFormatter = function(bStrict) {
		var oFormatSettings = {
			style: this.oDateFormat.style,
			pattern: this.oDateFormat.pattern,
			strictParsing: bStrict
		};
		return sap.ui.core.format.DateFormat.getInstance(oFormatSettings);
	};

	DateRangeType.prototype._fillNumberToText = function(sText, iNumber) {
		var sNumber = "X";
		if (iNumber) {
			sNumber = String(iNumber);
		}
		return sText.replace("{0}", sNumber);
	};

	DateRangeType.prototype.destroy = function() {
		if (this.iChangeTimer) {
			jQuery.sap.clearDelayedCall(this.iChangeTimer);
			delete this.iChangeTimer;
		}
		if (this._oPopup) {
			sap.ui.getCore().getMessageManager().unregisterObject(this._oPopup);
			this._oPopup.destroy();
		}
		Type.prototype.destroy.apply(this, arguments);
	};

	return DateRangeType;
}, /* bExport= */ true);