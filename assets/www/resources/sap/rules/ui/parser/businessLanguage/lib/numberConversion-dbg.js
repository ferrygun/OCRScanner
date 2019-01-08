jQuery.sap.declare("sap.rules.ui.parser.businessLanguage.lib.numberConversion");

jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.parseUtils");

sap.rules.ui.parser.businessLanguage.lib.numberConversion = sap.rules.ui.parser.businessLanguage.lib.numberConversion|| {}; 
sap.rules.ui.parser.businessLanguage.lib.numberConversion.lib = (function() {
	
	var constantsLib = sap.rules.ui.parser.businessLanguage.lib.constants.lib;
	var parseUtils = sap.rules.ui.parser.businessLanguage.lib.parseUtils.lib;
	var parseUtilsLib = new parseUtils.parseUtilsLib();
	
	//----------------------------------------------------------------------------------------------------------------------
	// Number Conversions
	//----------------------------------------------------------------------------------------------------------------------
	
	var isNumberFormatFlagsOfGroupSeparatorComma = function(flags){
		if (flags && 
				flags.hasOwnProperty(constantsLib.propertiesEnum.locale) && 
				flags.locale.hasOwnProperty(constantsLib.propertiesEnum.localeSettings)&&
				flags.locale.localeSettings.hasOwnProperty(constantsLib.propertiesEnum.number) &&
				flags.locale.localeSettings.number.hasOwnProperty(constantsLib.propertiesEnum.groupSeparator) &&
				flags.locale.localeSettings.number.groupSeparator === ','){
			return true;
		}	
		return false;
	};

	var isNumberFormatFlagsOfDecimalSeparatorDot = function(flags){
		if (flags && 
				flags.hasOwnProperty(constantsLib.propertiesEnum.locale) && 
				flags.locale.hasOwnProperty(constantsLib.propertiesEnum.localeSettings)&&
				flags.locale.localeSettings.hasOwnProperty(constantsLib.propertiesEnum.number) &&
				flags.locale.localeSettings.number.hasOwnProperty(constantsLib.propertiesEnum.decimalSeparator) &&
				flags.locale.localeSettings.number.decimalSeparator === '.'){
			return true;
		}	
		return false;
	};

	var isNumberFormatFlagsOfGroupSeparatorDot = function(flags){
		if (flags && 
				flags.hasOwnProperty(constantsLib.propertiesEnum.locale) && 
				flags.locale.hasOwnProperty(constantsLib.propertiesEnum.localeSettings)&&
				flags.locale.localeSettings.hasOwnProperty(constantsLib.propertiesEnum.number) &&
				flags.locale.localeSettings.number.hasOwnProperty(constantsLib.propertiesEnum.groupSeparator) &&
				flags.locale.localeSettings.number.groupSeparator === '.'){
			return true;
		}
		return false;
	};

	var isNumberFormatFlagsOfDecimalSeparatorComma = function(flags){
		if (flags && 
				flags.hasOwnProperty(constantsLib.propertiesEnum.locale) && 
				flags.locale.hasOwnProperty(constantsLib.propertiesEnum.localeSettings)&&
				flags.locale.localeSettings.hasOwnProperty(constantsLib.propertiesEnum.number) &&
				flags.locale.localeSettings.number.hasOwnProperty(constantsLib.propertiesEnum.decimalSeparator) &&
				flags.locale.localeSettings.number.decimalSeparator === ','){
			return true;
		}
		return false;
	};

	var isNumberFormatFlagsOfGroupSeparatorSpace = function(flags){
		if (flags && 
				flags.hasOwnProperty(constantsLib.propertiesEnum.locale) && 
				flags.locale.hasOwnProperty(constantsLib.propertiesEnum.localeSettings)&&
				flags.locale.localeSettings.hasOwnProperty(constantsLib.propertiesEnum.number) &&
				flags.locale.localeSettings.number.hasOwnProperty(constantsLib.propertiesEnum.groupSeparator) &&
				flags.locale.localeSettings.number.groupSeparator === ' '){
			return true;
		}
		return false;
	};
	
	//----------------------------------------------------------------------------------------------------------------------
	// Check if the number is a valid native format
	//----------------------------------------------------------------------------------------------------------------------
	var isValidNativeFormat = function (number){
		var regex = new RegExp(/^\d+(\.\d+)?$/);
		return regex.test(number);
	};
	
	//----------------------------------------------------------------------------------------------------------------------
	// conversion from: locale format to: native format
	//----------------------------------------------------------------------------------------------------------------------
	var convertNumberToNativeFormat = function(number, flags){
		var nativeNumber = number;
		
		if (flags && 
		    flags.hasOwnProperty(constantsLib.propertiesEnum.locale)){
			
			if(isNumberFormatFlagsOfGroupSeparatorComma(flags) &&
			   isNumberFormatFlagsOfDecimalSeparatorDot(flags)){
				nativeNumber = number.replace(/\,/g, "");
			}
			else if(isNumberFormatFlagsOfGroupSeparatorDot(flags) &&
					isNumberFormatFlagsOfDecimalSeparatorComma(flags)){
				nativeNumber = number.replace(/\./g, "").replace(/\,/g, '.');
			}
			else if(isNumberFormatFlagsOfGroupSeparatorSpace(flags) &&
					isNumberFormatFlagsOfDecimalSeparatorComma(flags)){
				nativeNumber = number.replace(/\,/g, '.');
			}
		}		
		return nativeNumber;
	};
	
	var convertNumber = function(number, flags){
		var conversionData = null;
		var numberFormat = null;
		var convertedNumber = null;
		
		function getNumberFormat(flags){
			var numberFormat = null;
			
			if (flags &&
				flags.hasOwnProperty(constantsLib.propertiesEnum.locale) &&
				flags[constantsLib.propertiesEnum.locale].hasOwnProperty(constantsLib.propertiesEnum.localeSettings) &&
				flags[constantsLib.propertiesEnum.locale][constantsLib.propertiesEnum.localeSettings].hasOwnProperty(constantsLib.propertiesEnum.number)){
				numberFormat = flags[constantsLib.propertiesEnum.locale][constantsLib.propertiesEnum.localeSettings][constantsLib.propertiesEnum.number];
			}
			return numberFormat;
		}
		
		function getConvertData(flags){
			var convertData = null;
			
			if (flags &&
				flags.hasOwnProperty(constantsLib.propertiesEnum.locale) &&
				flags[constantsLib.propertiesEnum.locale].hasOwnProperty(constantsLib.propertiesEnum.convert)){
				convertData = flags[constantsLib.propertiesEnum.locale][constantsLib.propertiesEnum.convert];
			}
			return convertData;
		}
		
		//----------------------------------------------------------------------------------------------------------------------
		// conversion from: native format to: locale format
		//----------------------------------------------------------------------------------------------------------------------
		function convertNativeNumberAccordingFormat(number, numberFormat){
			var numberParts = [];
			var convertedNumber = number;
			
			if (isValidNativeFormat(number) &&
			    numberFormat && 
				numberFormat.hasOwnProperty(constantsLib.propertiesEnum.groupSeparator) && 
				numberFormat.hasOwnProperty(constantsLib.propertiesEnum.decimalSeparator)){	
				
				numberParts = number.split(".");
				if(numberFormat.groupSeparator !== ' '){
					numberParts[0] = numberParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, numberFormat[constantsLib.propertiesEnum.groupSeparator]);
				}
				convertedNumber = numberParts.join(numberFormat[constantsLib.propertiesEnum.decimalSeparator]);
			}
			return convertedNumber;
		}
		
		
		//Access Point:
		numberFormat = getNumberFormat(flags);
		conversionData = getConvertData(flags);
		
		if(numberFormat){
			if(conversionData[constantsLib.propertiesEnum.source] === constantsLib.CODE_TEXT &&
			   conversionData[constantsLib.propertiesEnum.target] === constantsLib.DISPLAY_TEXT){
				convertedNumber = convertNativeNumberAccordingFormat(number, numberFormat);
			}
			else if(conversionData[constantsLib.propertiesEnum.source] === constantsLib.DISPLAY_TEXT &&
					conversionData[constantsLib.propertiesEnum.target] === constantsLib.CODE_TEXT){
				convertedNumber = convertNumberToNativeFormat(number, flags);
			}
		}
		
		return convertedNumber;
	};
	
	var isValidNumberWithGroupSeperator = function(str, modelManager, groupSeperator, cursorPosition){
		var position = str.indexOf(groupSeperator);
		var error_msg = {};
        error_msg.args = [];
        
		if (position > 3){
			error_msg.key = "error_in_expression_enter_suggestions_format_instead_message";
			error_msg.args[0] = 'Number';
			error_msg.args[1] = parseUtilsLib.getLocaleFormat(modelManager, false).DECIMAL;
			error_msg.args[2] = str;
			modelManager.parseResult.cursorPosition = cursorPosition;
            parseUtilsLib.handleError(error_msg.key, error_msg.args, modelManager);
		}
	};
	
	return {
		"convertNumber": convertNumber,
		"convertNumberToNativeFormat": convertNumberToNativeFormat,
		"isNumberFormatFlagsOfGroupSeparatorComma": isNumberFormatFlagsOfGroupSeparatorComma,
		"isNumberFormatFlagsOfDecimalSeparatorDot": isNumberFormatFlagsOfDecimalSeparatorDot,
		"isNumberFormatFlagsOfGroupSeparatorDot": isNumberFormatFlagsOfGroupSeparatorDot,
		"isNumberFormatFlagsOfDecimalSeparatorComma": isNumberFormatFlagsOfDecimalSeparatorComma,
		"isNumberFormatFlagsOfGroupSeparatorSpace": isNumberFormatFlagsOfGroupSeparatorSpace,
		"isValidNumberWithGroupSeperator": isValidNumberWithGroupSeperator
	};
	
}());
