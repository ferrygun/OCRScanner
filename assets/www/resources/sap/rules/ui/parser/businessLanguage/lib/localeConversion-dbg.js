jQuery.sap.declare("sap.rules.ui.parser.businessLanguage.lib.localeConversion");

//Import relevant libraries:
jQuery.sap.require("sap.rules.ui.parser.infrastructure.locale.lib.moment_JS_min");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.parseUtils");  //TBD: Delete this import once all date/time conversions will be implemented in this lib
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.numberConversion");
jQuery.sap.require("sap.rules.ui.parser.infrastructure.errorHandling.hrfException");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.parseUtils");


sap.rules.ui.parser.businessLanguage.lib.localeConversion = sap.rules.ui.parser.businessLanguage.lib.localeConversion|| {}; 
sap.rules.ui.parser.businessLanguage.lib.localeConversion.lib = (function() {
	
	//External libraries pointers:
	var moment_JS_lib = sap.rules.ui.parser.infrastructure.locale.lib.moment_JS_min.lib;
//	var parseUtils =  $.sap.hrf.businessLanguage.lib.parseUtils.lib;
//	var parseUtilsLib = new parseUtils.parseUtilsLib();
	var constantsLib = sap.rules.ui.parser.businessLanguage.lib.constants.lib;
	var numberConversionLib = sap.rules.ui.parser.businessLanguage.lib.numberConversion.lib;
	var hrfException = sap.rules.ui.parser.infrastructure.errorHandling.hrfException.lib;
	var parseUtils = sap.rules.ui.parser.businessLanguage.lib.parseUtils.lib;
	var parseUtilsLib = new parseUtils.parseUtilsLib();
	
	
	//Constants:
	var HANA_DATE_FORMAT = "YYYY-MM-DD";
	var NATIVE_DATE_FORMATS = ["D/M/YYYY", "D-M-YYYY", "D.M.YYYY"];

	var HANA_TIME_FORMAT = "HH:mm:ss.SSSSSS";   
	var NATIVE_TIME_FORMATS = ["H:mm:ss","TH:mm:ss"];

	var HANA_FULL_DATE_FORMAT = "YYYY-MM-DD HH:mm:ss.SSSSSS";
	var NATIVE_FULL_DATE_FORMATS = ["YYYY-MM-DD HH:mm:ss","D/M/YYYY H:mm:ss", "D-M-YYYY H:mm:ss", "D.M.YYYY H:mm:ss","D/M/YYYYTH:mm:ss", "D-M-YYYYTH:mm:ss", "D.M.YYYYTH:mm:ss"];
	
	
	var timeZoneDirections= {
		toUTC: "toUTC",
		toTimeZone: "toTimeZone"
	};
	
	var supportedDateFormats = {
			"DD.MM.YYYY": null,
			"D.M.Y": null,
			"DD.MM.YY": null,
			"D.M.YY": null,
			"D.M.YY.": null,
			"D.MM.YY": null,
			"D.MM.Y": null,
			"D.M.Y.": null,
			"DD.MM.Y": null,
			"DD.MM.Y.": null,
			"DD.MM.YY.": null,
			"DD. MM. YY": null,
			"DD.MM.YY Г.": null,
			"YYYY.MM.DD": null,
			"YY. M. D.": null,
			"Y. MM. DD.": null,
			"Y.MM.DD": null,
			"Y.MM.DD.": null,
			"DD-MM-YY": null,
			"DD-MM-YYYY": null,
			"MM-DD-YYYY": null,
			"YYYY-MM-DD": null,
			"Y-MM-DD": null,
			"DD-MM-Y": null,
			"DD/MM/Y": null,
			"D/M/Y": null,
			"DD/MM/YY": null,
			"D/M/YY": null,
			"MM/DD/YY": null,
			"M/D/YY": null,
			"DD/MM/YYYY": null,
			"MM/DD/YYYY": null,
			"YYYY/MM/DD": null,
			"Y/M/D": null,
			"Y/MM/DD": null,
			"M/D/Y": null
	};
	
	var supportedTimeFormats = {
			"hh:mm:ss a": null,
			"hh:mm:ss A": null,
			"h:mm:ss a": null,
			"h:mm:ss A": null,
			"H:mm:ss": null,
			"HH:mm:ss": null,
			"ah:mm:ss": null,
			"kl. HH:mm:ss": null,
			"KK:mm:ss A": null, //0-11 + AM/PM
			"KK:mm:ss a": null  //0-11 + am/pm
	};
	
	var supportedNumberFormats = {
			"123,456,789.00": null,
			"123.456.789,00": null,
			"123456789,00": null
	};
	
	//Library methods:
	var clearQuotesFromGivenStr = function(str){
		var tmpStr = str;
		
		if(tmpStr.charAt(0) === "'" && tmpStr.charAt(tmpStr.length-1) === "'"){
			tmpStr = tmpStr.slice(1, tmpStr.length - 1);
		}
		return tmpStr;
	};
	
	var getActualFormat = function(dateFormat, timeFormat){
		// Get the actual format
		if (dateFormat === null) {
			return timeFormat;
		}
		if (timeFormat === null) {
			return dateFormat.toUpperCase();
		}
		
		return dateFormat.toUpperCase() + " " + timeFormat; 
	};
	

	var convertUI5ToHHmmssTimeFormat = function(str, timeFormat){        //To conver from "KK:mm:ss a" to "HH:mm:ss"
		var HHmmssSTR = null;
		var tmpSTR = str;
		var tmpArr = null;
		var suffix = tmpSTR.slice(9);
		
		if(timeFormat.indexOf("KK") === 0){
			HHmmssSTR = tmpSTR.slice(0, 8);
			if(suffix === "pm" || suffix === "PM"){
				//add the 12 hrs
				tmpArr = HHmmssSTR.split(":");
				tmpArr[0] = parseInt(tmpArr[0], 10) + 12;
				HHmmssSTR = tmpArr.join(":");
			}
		}
		return HHmmssSTR;
	};
	
	var convertHHmmssToUI5TimeFormat = function(str, timeFormat){         //To conver from "HH:mm:ss" to "KK:mm:ss a"
		var UI5Str = null;
		var tmpSTR = str;
		var tmpArr = null;
		var hrs = null;
		var suffix = null;
		
		tmpArr = tmpSTR.split(":");
		hrs = parseInt(tmpArr[0], 10);
		if(hrs > 11){
			//reduce 12 hrs and add pm/PM
			hrs -= 12;
			suffix = timeFormat.endsWith("A") ? "PM" : "pm";
		}
		else{
			//just add am/AM
			suffix = timeFormat.endsWith("A") ? "AM" : "am";
		}
		tmpArr[0] = hrs;
		UI5Str = tmpArr.join(":");
		UI5Str = UI5Str + " " + suffix;
		return UI5Str;
	};
	
	
	var correctNonStandardGregorianFormats = function(str, dateFormat, timeFormat) {
		var correctData = { str: str, dateFormat: dateFormat, timeFormat: timeFormat };
		
		if (timeFormat) {
			var zIndex = timeFormat.indexOf('z');
			if (zIndex >= 0) { //remove the zzzz
				correctData.timeFormat = timeFormat.substring(0, zIndex-1);
			}
		}
		
		//check if the given str/dateFormat contains known constants (e.g. 'г' in Bulgarian date format dd.mm.yy 'г'.)
		if(correctData.dateFormat && 
				((correctData.str.indexOf("г") >= 0 && correctData.dateFormat.indexOf("г") >= 0) ||
				(correctData.str.indexOf("Ð³") >= 0 && correctData.dateFormat.indexOf("Ð³") >= 0))){
			var endDateIndex = correctData.str.indexOf("г");
			var endDateFormat = correctData.dateFormat.indexOf("г");
			if (endDateIndex < 0) {
				endDateIndex = correctData.str.indexOf("Ð");
				endDateFormat = correctData.dateFormat.indexOf("Ð");
			}
			correctData.str = correctData.str.slice(0,endDateIndex-1) + (correctData.timeFormat !== null ? correctData.str.slice(endDateIndex +2 ) : '');
			correctData.dateFormat = correctData.dateFormat.slice(0,endDateFormat-1);
		}
			
		//check if the given str/timeFormat contains known constants (e.g. 'a' in Chinese time format ah:mm:ss. 下午 = pm, 上午 = am )
		if(correctData.timeFormat && 
				(correctData.str.indexOf("下午") >= 0 || correctData.str.indexOf("上午") >= 0) && correctData.timeFormat.indexOf("a") === 0) {
			if (correctData.str.indexOf("下午") >= 0) {
				correctData.str = correctData.str.replace("下午",'') + " pm";
			}
			else {
				correctData.str = correctData.str.replace("上午",'') + " am";
			}
			correctData.timeFormat = correctData.timeFormat.replace("a","") + " a";
		}
		//check if the given str/timeFormat contains known constants (e.g. 'Kl.' in Slovakian time format Kl. HH:mm:ss)
		if(correctData.timeFormat && 
				correctData.str.indexOf("kl. ") >= 0 && correctData.timeFormat.indexOf("kl. ") === 0) {
			correctData.str = correctData.str.replace("kl. ",'');
			correctData.timeFormat = correctData.timeFormat.replace("kl. ","");
		}
		//to convert from "KK:mm:ss a" to "HH:mm:ss"
		if(timeFormat && timeFormat.indexOf("KK") === 0 && (str.toLowerCase().indexOf("pm") !== -1 || str.toLowerCase().indexOf("am") !== -1)){
			correctData.str = convertUI5ToHHmmssTimeFormat(str, timeFormat);
			correctData.timeFormat = "HH:mm:ss";
		}
		
		return correctData;
		
	};
	

	var createMomentObjForDateTime = function(str, dateFormat, timeFormat){
		var tmpStr = clearQuotesFromGivenStr(str);
		var momentObj = null;
		var actualFormat = '';
		
		var correctData = correctNonStandardGregorianFormats(tmpStr, dateFormat, timeFormat);
		
		// Get the actual format
		actualFormat = getActualFormat(correctData.dateFormat, correctData.timeFormat);
		
		momentObj = moment_JS_lib.moment(correctData.str, actualFormat, true);
		return momentObj;
	};
	
	
	var tryNativeDateTimeFormats = function(str, nativeFormats){
		var momentObj = null;
		var tmpStr = clearQuotesFromGivenStr(str);

		if (nativeFormats && nativeFormats.length > 0) {
			momentObj = moment_JS_lib.moment(tmpStr, nativeFormats, true);			
		}
		return momentObj;
	};
	
	
	var codeTextDateTimeFormats = function(str, hanaFormat, nativeFormats){
		var momentObj = null;
		var tmpStr = clearQuotesFromGivenStr(str);
		
		//try given str in HANA/ISO format
		momentObj = moment_JS_lib.moment(tmpStr, hanaFormat, true);
		//if it's not in HANA format, try given str in Native format
		if(!momentObj.isValid()){
			momentObj = tryNativeDateTimeFormats(str, nativeFormats);
		}
		return momentObj;
	};
	

	var throwInvalidLocale = function(localePart, localeValue, modelManager) {
		var error_msg = {};
		error_msg.key = "error_in_expression_unsupported_locale_settings";
		error_msg.args = [localePart, localeValue];
		parseUtilsLib.handleError(error_msg.key, error_msg.args, modelManager);
		throw new hrfException.HrfException ();
	};
	
	var validateLocale = function(modelManager){
		
		function validateNumberLocale (localeSettings)
		{
			if (!localeSettings.hasOwnProperty(constantsLib.propertiesEnum.number)) {
				throwInvalidLocale('Number format', null, modelManager);
			}
			if (!localeSettings.number.hasOwnProperty(constantsLib.propertiesEnum.groupSeparator)) {
				throwInvalidLocale('Group separator', null, modelManager);
			}
			if (!localeSettings.number.hasOwnProperty(constantsLib.propertiesEnum.decimalSeparator)) {
				throwInvalidLocale('Decimal separator', null, modelManager);
			}
			
			var groupSeparator = localeSettings [constantsLib.propertiesEnum.number] [constantsLib.propertiesEnum.groupSeparator];
			groupSeparator = (groupSeparator === ' ')? '': groupSeparator;
			var decimalSeparator = localeSettings [constantsLib.propertiesEnum.number] [constantsLib.propertiesEnum.decimalSeparator];
			var numberFormat = "123" + groupSeparator + "456" + groupSeparator + "789" + decimalSeparator + "00";
			if (!supportedNumberFormats.hasOwnProperty (numberFormat) ) {
				throwInvalidLocale('Number format', numberFormat, modelManager);
			}
		}
		
		var flags = modelManager.flags;
		if (!flags.locale.hasOwnProperty(constantsLib.propertiesEnum.localeSettings) || !flags.locale.localeSettings) {
			throwInvalidLocale('Date format', null, modelManager);
		}
		var localeSettings = flags.locale.localeSettings;
		if (!localeSettings.hasOwnProperty(constantsLib.propertiesEnum.dateFormat) || !localeSettings.dateFormat) {
			throwInvalidLocale('Date format', null, modelManager);
		}
		
		var dateFormat = localeSettings.dateFormat;
		if (!supportedDateFormats.hasOwnProperty(dateFormat.toUpperCase())) {
			throwInvalidLocale('Date format', dateFormat, modelManager);
		}
		if (!localeSettings.hasOwnProperty(constantsLib.propertiesEnum.timeFormat) || !localeSettings.timeFormat) {
			throwInvalidLocale('Time format', null, modelManager);
		}
		var timeFormat = localeSettings.timeFormat;
		var zIndex = timeFormat.indexOf('z');
		if (zIndex >= 0) { //remove the zzzz
			timeFormat = timeFormat.substring(0, zIndex-1);
		}
		if (!supportedTimeFormats.hasOwnProperty(timeFormat)) {
			throwInvalidLocale('Time format', localeSettings.timeFormat, modelManager);
		}

		
		// Handle Number validation
		validateNumberLocale (localeSettings);
	};
	
	var isLocaleExistsInFlags = function(modelManager){
		var flags = modelManager.flags;
		if (! flags || !flags.hasOwnProperty(constantsLib.propertiesEnum.locale)) {
			return false;
		}
		validateLocale(modelManager);
		return true;
	};
	
	var getLocalePropeties = function(modelManager) {
		var flags = modelManager.flags;
		var localeDirection = {};
		localeDirection.isLocaleExists = isLocaleExistsInFlags(modelManager);
		localeDirection.isCodeText = localeDirection.isLocaleExists && 
									 flags.locale.hasOwnProperty(constantsLib.propertiesEnum.convert) && 
									 flags.locale.convert.hasOwnProperty(constantsLib.propertiesEnum.target) &&  
									 flags.locale.convert.target === constantsLib.DISPLAY_TEXT;
		return localeDirection;
	};
	
	
	var isDisplayMode = function(localeDirection) {
		return localeDirection.isLocaleExists && !localeDirection.isCodeText;
	};
	
	
	var isCodeMode = function(localeDirection) {
		return !localeDirection.isLocaleExists || localeDirection.isCodeText;
	};

	var getTimeZoneOffsetWithDirection = function(timeZoneOffset, timeZoneDirection) {
		switch (timeZoneDirection) {
		case timeZoneDirections.toUTC:
			return (-1) * Number(timeZoneOffset);
		default:
			return Number(timeZoneOffset);
		}
	};
	
	var handleTimeZone = function(momentObj, timeZoneOffset, timeZoneDirection) {
		if (!momentObj.isValid() || !timeZoneOffset || !timeZoneDirection) {
			return;
		}
		
		var timeZone = getTimeZoneOffsetWithDirection(timeZoneOffset, timeZoneDirection);
		momentObj.add(timeZone, 'Minutes');
//		momentObj.utcOffset(timeZone);
	};
	
	var isDateStr = function(str, modelManager){
		var momentObj = null;
		var dateFormat = '';
		var isItDate = false;
		var flags = modelManager.flags;
		
		var localeDirection = getLocalePropeties(modelManager);
		if(isDisplayMode(localeDirection)){
			dateFormat = flags.locale.localeSettings.dateFormat.replace('z','');
			momentObj = createMomentObjForDateTime(str, dateFormat, null);
		}
		//try HANA and Native formats as a fall back
		if(isCodeMode(localeDirection) && (!momentObj || !momentObj.isValid())){
			momentObj = codeTextDateTimeFormats(str, HANA_DATE_FORMAT, NATIVE_DATE_FORMATS);
		}
		if(momentObj){
			isItDate = momentObj.isValid();
		}
		return isItDate;
	};
	
	var isTimestampStr = function(str, modelManager){
		var momentObj = null;
		var dateFormat = '';
		var timeFormat = '';
		var isItDate = false;
		var flags = modelManager.flags;
		
		var localeDirection = getLocalePropeties(modelManager);
		if(isDisplayMode(localeDirection)){
			dateFormat = flags.locale.localeSettings.dateFormat.replace('z','');
			timeFormat = flags.locale.localeSettings.timeFormat;
			momentObj = createMomentObjForDateTime(str, dateFormat, timeFormat);
		}
		//try HANA and Native formats as a fall back
		if(isCodeMode(localeDirection) && (!momentObj || !momentObj.isValid())){
			momentObj = codeTextDateTimeFormats(str, HANA_FULL_DATE_FORMAT, NATIVE_FULL_DATE_FORMATS);
		}
		if(momentObj){
			isItDate = momentObj.isValid();
		}
		return isItDate;
	};
	
	var isTimeStr = function(str, modelManager){
		var momentObj = null;
		var timeFormat = '';
		var isItTimeStr = false;
		var flags = modelManager.flags;
		
		var localeDirection = getLocalePropeties(modelManager);
		if(isDisplayMode(localeDirection)){
			timeFormat = flags.locale.localeSettings.timeFormat;
			momentObj = createMomentObjForDateTime(str, null, timeFormat);
		}
		//try HANA and Native formats as a fall back
		if(isCodeMode(localeDirection) && (!momentObj || !momentObj.isValid())){
			momentObj = codeTextDateTimeFormats(str, HANA_TIME_FORMAT, NATIVE_TIME_FORMATS);
		}
		if(momentObj){
			isItTimeStr = momentObj.isValid();
		}
		return isItTimeStr;
	};

	var formatDate = function(momentObj, dateFormat) {
		var tmpDateFormat = dateFormat;
		var specialConst = '';
		var dateStr = '';

		// Bulgarian date format
		if(dateFormat && (dateFormat.indexOf("г") >= 0 || dateFormat.indexOf("Ð³") >= 0)){
			var endDateIndex =dateFormat.indexOf("г");
			if (endDateIndex < 0) {
				endDateIndex =dateFormat.indexOf("Ð");
			}
			specialConst = dateFormat.substr(endDateIndex - 1,3);
			tmpDateFormat = dateFormat.slice(0,endDateIndex - 1);
		}
		
		dateStr =  momentObj.format(tmpDateFormat.toUpperCase()) + specialConst;
		return dateStr;
	};
	
	var formatTime = function(momentObj, timeFormat) {
		var tmpTimeFormat = timeFormat;
		var specialConsts = '';
		var timeStr = '';
		var HHmmssSTR = null;

		//check if need to conver to "KK:mm:ss a" format
		if(timeFormat.indexOf("KK") === 0){   
			HHmmssSTR = momentObj.format("HH:mm:ss");
			timeStr = convertHHmmssToUI5TimeFormat(HHmmssSTR, timeFormat);              
		}
		else{
			//check if the given str/timeFormat contains known constants (e.g. 'a' in Chinese time format ah:mm:ss.)
			if(timeFormat.indexOf("a") === 0) {
				specialConsts = momentObj.hour() >= 12 ? '下午' : '上午';
				tmpTimeFormat = tmpTimeFormat.replace("a","");
			}
			//check if the given str/timeFormat contains known constants (e.g. 'Kl.' in Slovakian time format Kl. HH:mm:ss)
			if(timeFormat.indexOf("kl. ") === 0) {
				specialConsts = "kl. ";
				tmpTimeFormat = tmpTimeFormat.replace("kl. ","");
			}
			
			timeStr =  specialConsts + momentObj.format(tmpTimeFormat);
		}
		return timeStr;
	};
	
	var convertDateTimeStr = function(str, fromDateFormat, fromTimeFormat, toDateFormat, toTimeFormat, hanaFormat, nativeFormats, timeZoneOffset, timeZoneDirection){
		var momentObj = null;
		var convertedDateStr = '';
		var convertedTimeStr = '';
		
		momentObj = createMomentObjForDateTime(str, fromDateFormat, fromTimeFormat);

		//try HANA and Native formats as a fall back
		if(!momentObj.isValid() && nativeFormats){
			momentObj = codeTextDateTimeFormats(str, hanaFormat, nativeFormats);
		}
		if(momentObj.isValid()){
			handleTimeZone(momentObj, timeZoneOffset, timeZoneDirection);
			if(toDateFormat){
				convertedDateStr = formatDate(momentObj, toDateFormat);
			}
			
			if (toTimeFormat) {
				var timeFormat = toTimeFormat;
				var zIndex = timeFormat.indexOf('z');
				if (zIndex >= 0) {
					timeFormat = timeFormat.substring(0, zIndex-1);
				}
				convertedTimeStr = formatTime(momentObj, timeFormat);
				convertedDateStr += (toDateFormat ? " " : "") + convertedTimeStr;
			}
		}
		return convertedDateStr;
	};
	
	var isLocaleConversionFromCodeText = function(flags) {
		return (flags.locale.hasOwnProperty(constantsLib.propertiesEnum.convert) && 
				flags.locale.convert.hasOwnProperty(constantsLib.propertiesEnum.source) &&  
				flags.locale.convert.source === constantsLib.CODE_TEXT &&
				flags.locale.convert.hasOwnProperty(constantsLib.propertiesEnum.target) &&  
				flags.locale.convert.target === constantsLib.DISPLAY_TEXT);
	};
	
	var isLocaleConversionFromDisplayText = function(flags) {
		return (flags.locale.hasOwnProperty(constantsLib.propertiesEnum.convert) && 
				flags.locale.convert.hasOwnProperty(constantsLib.propertiesEnum.source) &&  
				flags.locale.convert.source === constantsLib.DISPLAY_TEXT &&
				flags.locale.convert.hasOwnProperty(constantsLib.propertiesEnum.target) &&  
				flags.locale.convert.target === constantsLib.CODE_TEXT);
	};
	
	var convertToHanaLocaleFormat = function(str, modelManager, type){
		var dateFormat = ''; 
		var timeFormat = ''; 
		var momentObj = null;
		var convertedLocale = null;
		var timeZoneOffset = 0;
		var flags = modelManager.flags;
		
		var localeDirection = getLocalePropeties(modelManager);
		if(isDisplayMode(localeDirection)){
			dateFormat = flags.locale.localeSettings.dateFormat.replace('z','');
			timeFormat = flags.locale.localeSettings.timeFormat;
			if (flags.locale.localeSettings.timeZoneOffset) {
				timeZoneOffset = flags.locale.localeSettings.timeZoneOffset;
			}
		}
		
		// dateFormat = '' && timeFormat = '' when locale is not provided or we are already in code text: Only hana format or native formats are valid
		switch (type){
			case constantsLib.TYPE_DATE:
				if(dateFormat !== ''){
					convertedLocale = convertDateTimeStr(str, dateFormat, null, HANA_DATE_FORMAT, null, HANA_DATE_FORMAT, NATIVE_DATE_FORMATS, null, null);
				}
				else{
					momentObj = codeTextDateTimeFormats(str,  HANA_DATE_FORMAT, NATIVE_DATE_FORMATS);
					if (momentObj.isValid) {
						convertedLocale = momentObj.format(HANA_DATE_FORMAT);
					}
				}
				break;
			case constantsLib.TYPE_TIME:
				//TBD: replace the following line by implementing 'convertTimeStr' in this lib
//				convertedDateStr = parseUtilsLib.buildHanaDateString(str, "", parseUtilsLib.TimeFormatEnum.HHMISS);
				if(timeFormat !== ''){
					convertedLocale = convertDateTimeStr(str, null, timeFormat, null, HANA_TIME_FORMAT,  HANA_TIME_FORMAT, NATIVE_TIME_FORMATS, timeZoneOffset, timeZoneDirections.toUTC);
				}
				else{
					momentObj = codeTextDateTimeFormats(str,  HANA_TIME_FORMAT, NATIVE_TIME_FORMATS);
					if (momentObj.isValid) {
						convertedLocale = momentObj.format(HANA_TIME_FORMAT);
					}
				}
				break;
			case constantsLib.TYPE_TIMESTAMP:
				//TBD: replace the following line by implementing 'convertTimestampStr' in this lib
//				convertedDateStr = parseUtilsLib.buildHanaDateString(str, parseUtilsLib.DateFormatEnum.DDMMYYYY, parseUtilsLib.TimeFormatEnum.HHMISS);
				if(dateFormat !== '' && timeFormat !== ''){
					convertedLocale = convertDateTimeStr(str, dateFormat, timeFormat, HANA_DATE_FORMAT , HANA_TIME_FORMAT, HANA_FULL_DATE_FORMAT, NATIVE_FULL_DATE_FORMATS, timeZoneOffset, timeZoneDirections.toUTC);
				}
				else{
					momentObj = codeTextDateTimeFormats(str, HANA_FULL_DATE_FORMAT, NATIVE_FULL_DATE_FORMATS);
					if (momentObj.isValid) {
						convertedLocale = momentObj.format(HANA_FULL_DATE_FORMAT);
					}
				}
				break;
			case constantsLib.TYPE_NUMERIC:
				convertedLocale = numberConversionLib.convertNumber(str, flags);
				break;
		}
		if(type !== constantsLib.TYPE_NUMERIC){
			convertedLocale = ( convertedLocale && convertedLocale.indexOf("'") !== 0 ) ? "'" + convertedLocale + "'" : convertedLocale;
		}
		
		return convertedLocale;
	};
	


	var convertLocaleFormat = function(token, modelManager, type){
		var flags = modelManager.flags;
		var dateFormat = '';
		var timeFormat = '';
		var timeZoneOffset = 0;
		var direction = '';
		var convertedLocale = null;
		
		if(isLocaleExistsInFlags(modelManager)){
			dateFormat = flags.locale.localeSettings.dateFormat.replace('z','');
			timeFormat = flags.locale.localeSettings.timeFormat;
			if (flags.locale.localeSettings.timeZoneOffset) {
				timeZoneOffset = flags.locale.localeSettings.timeZoneOffset;
			}
			
			if(flags.locale.hasOwnProperty(constantsLib.propertiesEnum.convert) && 
			   flags.locale.convert.hasOwnProperty(constantsLib.propertiesEnum.target)){
				direction = flags.locale.convert.target;
			}
		}
		if(direction === constantsLib.CODE_TEXT){
			convertedLocale = convertToHanaLocaleFormat(token, modelManager, type);
		}
		else if(direction === constantsLib.DISPLAY_TEXT){
			switch (type){
			case constantsLib.TYPE_DATE:
				convertedLocale = convertDateTimeStr(token, HANA_DATE_FORMAT, null, dateFormat, null, HANA_DATE_FORMAT, NATIVE_DATE_FORMATS, null, null);
				break;
			case constantsLib.TYPE_TIME:
				convertedLocale = convertDateTimeStr(token, null, HANA_TIME_FORMAT, null, timeFormat, HANA_TIME_FORMAT, NATIVE_TIME_FORMATS, timeZoneOffset, timeZoneDirections.toTimeZone);
				break;
			case constantsLib.TYPE_TIMESTAMP:
				//TBD
				convertedLocale = convertDateTimeStr(token, HANA_DATE_FORMAT, HANA_TIME_FORMAT, dateFormat, timeFormat, HANA_FULL_DATE_FORMAT, NATIVE_FULL_DATE_FORMATS, timeZoneOffset, timeZoneDirections.toTimeZone);
				break;
			case constantsLib.TYPE_NUMERIC: 
				convertedLocale = numberConversionLib.convertNumber(token, flags);
				break;
			}
		}
		
		if(type !== constantsLib.TYPE_NUMERIC){
			convertedLocale = ( convertedLocale && convertedLocale.indexOf("'") !== 0 ) ? "'" + convertedLocale + "'" : convertedLocale;
		}
		
		return convertedLocale; 
	};
	
	
	
	return {
		"isLocaleExistsInFlags": isLocaleExistsInFlags,
		"isLocaleConversionFromCodeText": isLocaleConversionFromCodeText,
		"isLocaleConversionFromDisplayText": isLocaleConversionFromDisplayText,
		"isDateStr": isDateStr,
		"isTimestampStr": isTimestampStr,
		"isTimeStr": isTimeStr,
		"convertToHanaLocaleFormat" : convertToHanaLocaleFormat,
		"convertLocaleFormat": convertLocaleFormat
	};
	
}());
