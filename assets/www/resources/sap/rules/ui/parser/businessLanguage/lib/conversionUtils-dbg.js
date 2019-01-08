jQuery.sap.declare("sap.rules.ui.parser.businessLanguage.lib.conversionUtils");

jQuery.sap.require("sap.rules.ui.parser.infrastructure.errorHandling.hrfException");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.localeConversion");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.parseUtils");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.constantsBase");
	
sap.rules.ui.parser.businessLanguage.lib.conversionUtils = sap.rules.ui.parser.businessLanguage.lib.conversionUtils|| {}; 
sap.rules.ui.parser.businessLanguage.lib.conversionUtils.lib = (function() {
	var hrfException = sap.rules.ui.parser.infrastructure.errorHandling.hrfException.lib;
	var constantsLib = sap.rules.ui.parser.businessLanguage.lib.constants.lib;
	var localeConversionLib = sap.rules.ui.parser.businessLanguage.lib.localeConversion.lib;
	var parseUtils = sap.rules.ui.parser.businessLanguage.lib.parseUtils.lib;
	var parseUtilsLib = new parseUtils.parseUtilsLib();
	var vocabularyConstants = sap.rules.ui.parser.resources.vocabulary.lib.constantsBase.lib;


	function conversionUtilsLib() {

	}

	function validateConversion(newValue, token, modelManager){
		var error_msg = {args : []};
		if (newValue === null) {
			//collect error
			error_msg.key = "error_in_expression_invalid_value_from_list_message";
			error_msg.args[0] = token.token.slice(1, -1); //remove quotes
			error_msg.args[1] = token.info.key;
			modelManager.parseResult.cursorPosition = token.start;
			modelManager.parseResult.convertedExpression = null;
			parseUtilsLib.handleError(error_msg.key, error_msg.args, modelManager);
			throw new hrfException.HrfException ();
		}
	}

	function technicalError(err, token, modelManager){
		var error_msg = {args : []};
		//collect error
		error_msg.key = "techincal_error";
		error_msg.args[0] = err.message;
		modelManager.parseResult.cursorPosition = token.start;
		modelManager.parseResult.convertedExpression = null;
		parseUtilsLib.handleError(error_msg.key, error_msg.args, modelManager);
		throw new hrfException.HrfException ();
	}

	conversionUtilsLib.prototype.needsNativeValueListConversion = function(modelManager) {
		return modelManager.hasOwnProperty(constantsLib.propertiesEnum.flags) && 
			modelManager.flags.hasOwnProperty(constantsLib.propertiesEnum.conversionOutput) &&
				((modelManager.flags[constantsLib.propertiesEnum.conversionOutput] === constantsLib.conversionOutputEnum.toKeys) || 
				(modelManager.flags[constantsLib.propertiesEnum.conversionOutput] === constantsLib.conversionOutputEnum.toDescriptions));
	};

	conversionUtilsLib.prototype.needsLocaleConversion = function(modelManager) {
		return modelManager.hasOwnProperty(constantsLib.propertiesEnum.flags) && 
			modelManager.flags.hasOwnProperty(constantsLib.propertiesEnum.locale) &&
			modelManager.flags.locale.hasOwnProperty(constantsLib.propertiesEnum.convert) &&
			modelManager.flags.locale.convert.hasOwnProperty(constantsLib.propertiesEnum.source) &&
			modelManager.flags.locale.convert.hasOwnProperty(constantsLib.propertiesEnum.target) &&
			modelManager.flags.locale.convert.source !== modelManager.flags.locale.convert.target;
	};
	
	conversionUtilsLib.prototype.needsTermConversion = function(modelManager) {
		return modelManager.hasOwnProperty(constantsLib.propertiesEnum.flags) && 
			modelManager.flags.hasOwnProperty(constantsLib.propertiesEnum.termMode) &&
			modelManager.flags.termMode.hasOwnProperty(constantsLib.propertiesEnum.convert) &&
			modelManager.flags.termMode.convert.hasOwnProperty(constantsLib.propertiesEnum.source) &&
			modelManager.flags.termMode.convert.hasOwnProperty(constantsLib.propertiesEnum.target) &&
			modelManager.flags.termMode.convert.source !== modelManager.flags.termMode.convert.target;
	};

	conversionUtilsLib.prototype.isConvertRequested = function(modelManager) {
		return modelManager.hasOwnProperty(constantsLib.propertiesEnum.flags) && 
			modelManager.flags.hasOwnProperty(constantsLib.propertiesEnum.locale) &&
			modelManager.flags.locale.hasOwnProperty(constantsLib.propertiesEnum.convert);
	};
	
	conversionUtilsLib.prototype.needsConversion = function(modelManager) {
		return this.needsNativeValueListConversion(modelManager) ||
			this.isConvertRequested (modelManager);
	};
	
	conversionUtilsLib.prototype.convertValueNativeList = function(vocaRTServ, vocaName, modelManager, token) {
		var direction = modelManager.flags[constantsLib.propertiesEnum.conversionOutput];
		var toKeys = (direction === constantsLib.conversionOutputEnum.toKeys);
		var newValue = "";
		var valueListName;
		if (token.tokenType === constantsLib.tokenTypesEnum.valueList && vocaRTServ.IsValueListDescriptionExist(vocaName, token.info.key)){
			valueListName = token.info.key;
			try {
				//get new value
				newValue = ( toKeys ? vocaRTServ.GetValueFromValueListDescription(vocaName, valueListName, token.token) 
								: vocaRTServ.GetDescriptionFromValueListValue(vocaName, valueListName, token.token) );
			} catch (err) {
				technicalError(err, token, modelManager);
			}
			validateConversion(newValue, token, modelManager);
			newValue = ( newValue.indexOf("'") !== 0 ) ? "'" + newValue + "'" : newValue;
		}
		else {
			newValue = token.token;
		}
		return newValue;
	};
	
	conversionUtilsLib.prototype.convertLocale = function(modelManager, token) {
		var newValue = localeConversionLib.convertLocaleFormat(token.token, modelManager, token.info.type);
		validateConversion(newValue, token, modelManager);
//		newValue = ( newValue.indexOf("'") !== 0 ) ? "'" + newValue + "'" : newValue;
		return newValue;
	};
	
	conversionUtilsLib.prototype.convertTerm = function(modelManager, tokensStr, startSegment) {
		
		var termObj = null;
		var termModeFlag = null;
		var targetTermObjProperty = null;
		var sourceFormat = modelManager.flags.termMode.convert.source;
		var whitespaces = '';
		var convertedTerm = null;
		
    	if(sourceFormat === constantsLib.DISPLAY_TEXT){
			termModeFlag = vocabularyConstants.TermModeRelated.TERM_MODE_BY_DESCRIPTION;
			targetTermObjProperty = vocabularyConstants.TermModeRelated.TERM_PROPERTY_DESCRIPTION;
		}
		else{
			termModeFlag = vocabularyConstants.TermModeRelated.TERM_MODE_BY_NAME;
			targetTermObjProperty = vocabularyConstants.TermModeRelated.TERM_PROPERTY_FRIENDLY_TERM;
		}
    	
    	//Check if tokensStr ends with whitespace ==> remove it before getTerm() and add it back to the converted term
    	//We should be tolerant to more than one ' '
    	while(tokensStr[tokensStr.length-1] === ' '){
    		whitespaces = whitespaces + ' ';
    		tokensStr = tokensStr.slice(0, tokensStr.length-1);
    	}
    	termObj = modelManager.vocaRTServ.getTerm(modelManager.vocabulary, tokensStr, termModeFlag);
    	if(termObj){
	    	convertedTerm = termObj[targetTermObjProperty];
	    	if(whitespaces.length){
	    		convertedTerm += whitespaces;
	    	}
    	}
    	else {
    		var attr = null;
    		var dataObjectName = modelManager.getTokenContext(startSegment,tokensStr);
    		if (dataObjectName) {
    			attr = modelManager.vocaRTServ.getAttributeByTermMode(modelManager.vocabulary, dataObjectName, tokensStr, termModeFlag);
               	if (attr) {
               		convertedTerm = termModeFlag === vocabularyConstants.TermModeRelated.TERM_MODE_BY_DESCRIPTION ? attr.name : attr.description; 
        	    	if(whitespaces.length){
        	    		convertedTerm += whitespaces;
        	    	}
               	}
    		}
    	}
    	return convertedTerm;
	};
	
	
	conversionUtilsLib.prototype.convert = function(vocaRTServ, vocaName, modelManager, tokens, originalExpression) { 
		var convertedExpression = originalExpression;
		var offset = 0;
		var newValue = "";
		var oldValue = "";
		var i;
		var tokenNeedsConversion;
		var token;
		var endIndx;
		var tokensStr = null;
		var startSegment = 0; 
		var endSegment = 0;
		
		for (i = 0; i < tokens.length; i++) {
			tokenNeedsConversion = false;
			token = tokens[i];
			endIndx = 0;
			tokensStr = "";
			oldValue = "";
			switch (token.tokenType) {
			case constantsLib.tokenTypesEnum.valueList:
				if (this.needsNativeValueListConversion(modelManager)) {
					tokenNeedsConversion = true;
					startSegment = token.start;
					endSegment = token.end;
					oldValue = token.token;
					newValue = this.convertValueNativeList(vocaRTServ, vocaName, modelManager, token);
				}
				break;
			case constantsLib.tokenTypesEnum.constant:
				if (this.needsLocaleConversion(modelManager)) {
					switch (token.info.type) {
					case constantsLib.TYPE_DATE:
					case constantsLib.TYPE_TIMESTAMP:
					case constantsLib.TYPE_TIME:
					case constantsLib.TYPE_NUMERIC:
						tokenNeedsConversion = true;
						startSegment = token.start;
						endSegment = token.end;
						oldValue = token.token;
						newValue = this.convertLocale(modelManager, token);
						break;
					}
				}
				break;
			case  constantsLib.tokenTypesEnum.vocabulary:
				if(this.needsTermConversion(modelManager)){
					startSegment = token.start;
					while((i + endIndx) < tokens.length && 
							(tokens[i + endIndx].tokenType === constantsLib.tokenTypesEnum.vocabulary || 
							 tokens[i + endIndx].tokenType === constantsLib.tokenTypesEnum.whitespace)){
						//Skip redundant white spaces, if tokenType is whitespace it could be " " or "  " or "   " or ...:
						if(tokens[i + endIndx].tokenType === constantsLib.tokenTypesEnum.whitespace){
							tokensStr += " ";
						}
						else{
							tokensStr += tokens[i + endIndx].token;
						}
						oldValue += tokens[i + endIndx].token;
						endIndx++;
					}
					endIndx--;
					i += endIndx;
					token = tokens[i];
					endSegment = token.end;
					tokenNeedsConversion = true;
					newValue = this.convertTerm(modelManager, tokensStr, startSegment);
				}
				break;
			}
			if (tokenNeedsConversion && newValue) { 
				convertedExpression = convertedExpression.slice(0,startSegment + offset) + newValue + convertedExpression.slice(endSegment + 1 + offset) ;
				offset += newValue.length -	oldValue.length;
			}
		}
		return convertedExpression;
		

	};
	
	return {
		conversionUtilsLib: conversionUtilsLib
	};
}());
