jQuery.sap.declare("sap.rules.ui.parser.resources.vocabulary.lib.utils");

jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.utilsBase");
jQuery.sap.require("sap.rules.ui.parser.infrastructure.util.constants");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.parsingBackendMediator");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.ruleBody.lib.constantsBase");
jQuery.sap.require("sap.rules.ui.parser.infrastructure.messageHandling.lib.responseCollector");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.infrastructure.errorHandling.hrfException");
jQuery.sap.require("sap.rules.ui.parser.resources.common.lib.constants");

jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderFactory");


sap.rules.ui.parser.resources.vocabulary.lib.utils = sap.rules.ui.parser.resources.vocabulary.lib.utils|| {}; 
sap.rules.ui.parser.resources.vocabulary.lib.utils.lib = (function() {

	var vocaUtilsBase = sap.rules.ui.parser.resources.vocabulary.lib.utilsBase.lib;
	var vocaUtilsBaseLib = new vocaUtilsBase.utilsBaseLib();
	var utilConstants = sap.rules.ui.parser.infrastructure.util.constants.lib;
	var constantsLib = sap.rules.ui.parser.resources.vocabulary.lib.constants.lib;
	var ruleBodyConstantsLib = sap.rules.ui.parser.ruleBody.lib.constantsBase.lib;
	var ResponseCollector = sap.rules.ui.parser.infrastructure.messageHandling.lib.responseCollector.lib.ResponseCollector;
	var constantsParserLib = sap.rules.ui.parser.businessLanguage.lib.constants.lib;
	var hrfException = sap.rules.ui.parser.infrastructure.errorHandling.hrfException.lib;
	var resourcesConstants = sap.rules.ui.parser.resources.common.lib.constants.lib;

	
	function utilsLib() {
		//Constructor to enable usage of public method on the client side.
		//This mechanism was used in HRF to enable association to corresponding namespace in the client side.
	}

	
	
	//***************************************************************************
	//***************************************************************************
	utilsLib.prototype.handleError = function(msgText, params, allMsg){
		var msgObj = JSON.stringify(ResponseCollector.getInstance().addMessage(msgText, params));
		if (allMsg){
			allMsg.allMsg += msgObj;
		} else {
			throw new hrfException.HrfException (msgObj, false);
		}	
	};
	
	//**************************************************************************************************/
	//**************************************************************************************************/
	utilsLib.prototype.validateAliasNamesUniquenessAgainstOtherVocabularies = function(aliasesNamesArr, allAliasNamesMap, allOMNamesMap, allAttributesMap, isThisPrivateVoca, allMsg) {
		var i;
		var aliasName;
		var params;
		var attributeInfo;
		var aliasInfo;
	
		//Validate aliases names
		for (i = 0; i < aliasesNamesArr.length; i++) {
	
			aliasName = aliasesNamesArr[i];
	
			//Validate aliases names against other aliases names in the same scope
			aliasInfo = allAliasNamesMap[aliasName];
			if (aliasInfo && (!isThisPrivateVoca || aliasInfo.isPrivate)) {
				params = [constantsLib.PROPERTY_NAME_ALIASES, aliasName, constantsLib.PROPERTY_NAME_ALIASES, aliasInfo.vocaName];
				this.handleError("error_vocabulary_parameter_name_exists_in_other_voca", params, allMsg);
			}
	
			//Check alias name against other OM names in the same scope
			if (allOMNamesMap.hasOwnProperty(aliasName)) {
				//If one of global objects names (ruleTemplate, offer..)
				if (allOMNamesMap[aliasName] === null) {
					params = [aliasName];
					this.handleError("error_vocabulary_alias_name_cant_be_reserved_word", params, allMsg);
				}
	
				params = [constantsLib.PROPERTY_NAME_ALIASES, aliasName, constantsLib.PROPERTY_NAME_DATA_OBJECTS, allOMNamesMap[aliasName]];
				this.handleError("error_vocabulary_parameter_name_exists_in_other_voca", params, allMsg);
			}
	
			//Check aliases names against attributes names in the same scope
			if (allAttributesMap.hasOwnProperty(aliasName)) {
				attributeInfo = allAttributesMap[aliasName];
	
				//If one of global objec's attributes (ruleTemplate - id, name.., offer - from_date, to_date..)
				if (allAttributesMap[aliasName].vocaName === null) {
					params = [aliasName, attributeInfo.objectName];
					this.handleError("error_vocabulary_alias_name_exists_as_an_attribute_name_in_global_attribute", params, allMsg);
				}
	
				params = [aliasName, attributeInfo.objectName, attributeInfo.vocaName];
				this.handleError("error_vocabulary_alias_name_exists_as_an_attribute_name_in_other_vocabulary", params, allMsg);
			}
		}
	};
	
	//**************************************************************************************************/
	//**************************************************************************************************/
	utilsLib.prototype.isAlpha = function(charCode) {
		return (charCode >= "A".charCodeAt(0) && charCode <= "Z".charCodeAt(0)) ||
			(charCode >= "a".charCodeAt(0) && charCode <= "z".charCodeAt(0));
	};
	
	//**************************************************************************************************/
	//**************************************************************************************************/
	utilsLib.prototype.isNumeric = function(charCode) {
		return charCode >= "0".charCodeAt(0) && charCode <= "9".charCodeAt(0);
	};
	
	//**************************************************************************************************/
	//**************************************************************************************************/
	utilsLib.prototype.isAllowedSpecialChar = function(charCode) {
		return charCode === "_".charCodeAt(0);
	};
	
	//**************************************************************************************************/
	//**************************************************************************************************/
	utilsLib.prototype.isReservedWord = function(name) {
		var parser = new sap.rules.ui.parser.businessLanguage.lib.parsingBackendMediator.lib.parsingBackendMediatorLib();
		return parser.isReservedWord(name);
	};
	
	//**************************************************************************************************/
	//**************************************************************************************************/
	utilsLib.prototype.isValidToken = function(name) {
		var charCode;
	
		if (name.length < 1) {
			return false;
		}
	
		if (!this.isAlpha(name.charCodeAt(0))) {
			return false;
		}
	
		var i;
		for (i = 1; i < name.length; i++) {
			charCode = name.charCodeAt(i);
			if (!this.isAlpha(charCode) && !this.isNumeric(charCode) && !this.isAllowedSpecialChar(charCode)) {
				return false;
			}
		}
	
		return true;
	};
	
	//**************************************************************************************************/
	//**************************************************************************************************/
	utilsLib.prototype.isValidName = function(name) {
		if (!this.isValidToken(name)) {
			return false;
		}
	
		if (this.isReservedWord(name) === true) {
			return false;
		}
	
		return true;
	};
	
	//**************************************************************************************************/
	//**************************************************************************************************/
	utilsLib.prototype.isValidSize = function(dataTypeSize, dataType) {
		var size = dataTypeSize.replace(/\s+/g, ''); // removes white spaces
		var decimalArr = [];
		if (dataType === utilConstants.SQL_TYPES.DECIMAL) {
			decimalArr = size.split(",");
			// DECIMAL size must contain digits, comma and digits. Also size must not be zero.
			if ((decimalArr.length !== 2) || !/^\d+$/.test(decimalArr[0]) || !/^\d+$/.test(decimalArr[1]) || (parseInt(decimalArr[0], 10) === 0)) {
				return false;
			}
		} else if (!/^\d+$/.test(size) || (parseInt(size, 10) === 0)){
	
			return false;
		}
	
		return true;
	};
	
	//**************************************************************************************************/
	//**************************************************************************************************/
	utilsLib.prototype.validateAliases = function(aliasesArray, dataObjectsInfo, allMsg) {
		var i;
		var aliasNames = [];
		var aliasName;
		var aliasContent;
		var params;
		var aliasesMap = {};
	
		for (i = 0; i < aliasesArray.length; i++) {
	
			aliasName = aliasesArray[i][constantsLib.PROPERTY_NAME_ALIAS_NAME];
			aliasContent = aliasesArray[i][constantsLib.PROPERTY_NAME_ALIAS_CONTENT];
	
			//If not a valid name? (reserved tokens, contain spaces etc.)
			if (!this.isValidName(aliasName)) {
				params = [aliasName];
				this.handleError("error_vocabulary_invalid_alias_name", params, allMsg);			
			}
	
			if (!aliasContent || 0 === aliasContent.length) {
	
				params = [aliasName];
				this.handleError("error_vocabulary_alias_content_couldnt_be_empty", params, allMsg);			
				continue;
			}
	
			//If name appears more than once
			if (aliasesMap.hasOwnProperty(aliasName)) {
	
				params = [aliasName];
				this.handleError("error_vocabulary_alias_name_already_exists", params, allMsg);			
				continue;
			}
	
			//If name exists as one of the object models names
			if (dataObjectsInfo) {
	
				if (dataObjectsInfo.dataObjects.hasOwnProperty(aliasName)) {
	
					params = [aliasName];
					this.handleError("error_vocabulary_invalid_alias_name_exist_as_om", params, allMsg);
					continue;
				}
	
				//If name exists as one of the attributes names
				if (dataObjectsInfo.attributes.hasOwnProperty(aliasName)) {
	
					params = [aliasName, dataObjectsInfo.attributes[aliasName]];
					this.handleError("error_vocabulary_alias_name_exists_as_an_attribute_name", params, allMsg);
					continue;
				}
			}
	
			aliasesMap[aliasesArray[i][constantsLib.PROPERTY_NAME_ALIAS_NAME]] = aliasesArray[i][constantsLib.PROPERTY_NAME_ALIAS_NAME];
			aliasNames.push(aliasesArray[i][constantsLib.PROPERTY_NAME_ALIAS_NAME]);
		}
		return aliasNames;
	};
	
	//**************************************************************************************************/
	//**************************************************************************************************/
	utilsLib.prototype.validateValueLists = function(valueListMap, dataObjectsInfo, allMsg) {
			var valueListNames = [];
			var valueListName = null;
			var valueListContent;
			var params;
			var attrValueListMap = dataObjectsInfo.valueLists;
	
			for (valueListName in valueListMap) {
				if (valueListMap.hasOwnProperty(valueListName)) {
	
					valueListContent = valueListMap[valueListName];
	
					//If not a valid name? (reserved tokens, contain spaces etc.)
					if (!this.isValidName(valueListName)) {
	
						params = [valueListName];
						this.handleError("error_vocabulary_invalid_value_list_name", params, allMsg);
					}
	
					if (!valueListContent || 0 === valueListContent.length) {
						params = [valueListName];
						this.handleError("error_vocabulary_value_list_content_couldnt_be_empty", params, allMsg);
					}
	
					valueListNames.push(valueListMap[valueListName]);
				}
			}
	
			var i;
			// Validate that all used value lists in attributes really exist
			for (valueListName in attrValueListMap) {
				if (attrValueListMap.hasOwnProperty(valueListName)) {
					if (valueListMap.hasOwnProperty(valueListName) === false) {
						for (i = 0; i < attrValueListMap[valueListName].length; i++) {
							params = [valueListName, attrValueListMap[valueListName][i].attribute, attrValueListMap[valueListName][i].dataObject];
							this.handleError("error_vocabulary_value_list_does_not_exist", params, allMsg);
						}
					}
				}
			}
			
			return valueListNames;
		};
		//**************************************************************************************************/
		//**************************************************************************************************/
		utilsLib.prototype.collectErrorMessages = function(aliasType, validationResult, standByMessages) {
	
		var messageArray = [];
	
		if (aliasType === constantsLib.ALIAS_CONTENT_DECISION_TABLE) {
	
			messageArray = messageArray.concat(standByMessages);
		} else if (aliasType === constantsLib.ALIAS_CONTENT_EXPRESSION) {
	
			//To be align with standby messages from the responseCollector
			var message = {
				"description": validationResult[constantsParserLib.attributesNamesEnum.errorDetails]
			};
	
			messageArray = messageArray.concat(message);
		}
	
		return messageArray;
	};
	
	//**************************************************************************************************/
	//**************************************************************************************************/
	utilsLib.prototype.isAliasContentValid = function(validationResult, aliasType) {
	
		var isValid = false;
	
		if (aliasType === constantsLib.ALIAS_CONTENT_DECISION_TABLE) {
	
			if (validationResult.status === "Error") {
	
				isValid = false;
			} else {
	
				isValid = true;
			}
		} else if (aliasType === constantsLib.ALIAS_CONTENT_EXPRESSION) {
	
			if (validationResult[constantsParserLib.attributesNamesEnum.isValid] === true) {
	
				isValid = true;
			} else {
	
				isValid = false;
			}
		}
	
		return isValid;
	};
	
	//*************************************************************************************************/
	// Revalidation of an alias in case of nested dependency                                          */    
	//*************************************************************************************************/
	utilsLib.prototype.reValidateAliasContent = function(validator, content, vocabularyFullName, aliasType, vocaRTServ) {
	
		var validationResult = null;
	
		if (aliasType === constantsLib.ALIAS_CONTENT_DECISION_TABLE) {
	
			var validationFlags = {};
			validationFlags[ruleBodyConstantsLib.OUTPUT_FLAGS_ENUM.validationOutput] = true;
			validationFlags[ruleBodyConstantsLib.OUTPUT_FLAGS_ENUM.unknownTokensOutput] = true;
			validationFlags[ruleBodyConstantsLib.OUTPUT_FLAGS_ENUM.isAlias] = true;
	
			validationResult = validator.reValidateBusinessRule(vocabularyFullName, vocaRTServ, validationFlags, null);
		} else if (aliasType === constantsLib.ALIAS_CONTENT_EXPRESSION) {
	
			validationResult = validator.validateAndGetExpressionActualReturnTypeRT(vocaRTServ, content, vocabularyFullName, null, false);
		}
	
		return validationResult;
	};
	
	//*************************************************************************************************/
	//Get the full name out of the name, package and suffix                                        */    
	//*************************************************************************************************/
	utilsLib.prototype.getVocabularyFullName = function(resourceID, resourceContent) {
		var vocabularyFullName = "";
		//if resource has name property --> take vocabulary name
		if (resourceContent && resourceContent.hasOwnProperty(constantsLib.PROPERTY_NAME_NAME)) {
			vocabularyFullName = resourceContent[constantsLib.PROPERTY_NAME_NAME];
		} else {
			//Support transient vocabulary - vocabulary without package name
			if (resourceID[resourcesConstants.PROPERTY_NAME_PACKAGE] === undefined) {
				vocabularyFullName = resourceID[resourcesConstants.PROPERTY_NAME_NAME];
			} else {
				vocabularyFullName = resourceID[resourcesConstants.PROPERTY_NAME_PACKAGE] + "::" + resourceID[resourcesConstants.PROPERTY_NAME_NAME];
			}
		}
		return vocabularyFullName;
	};
	
	
	
	//*************************************************************************************************/
	//If alias type is empty, fill it with type expression which was the only type in release 1 and 2 */    
	//*************************************************************************************************/
	utilsLib.prototype.autoCompleteAliasType = function(aliasInstance) {
	
		if (!aliasInstance[constantsLib.PROPERTY_NAME_TYPE]) {
	
			aliasInstance[constantsLib.PROPERTY_NAME_TYPE] = constantsLib.ALIAS_CONTENT_EXPRESSION;
		}
	};
	
	//***************************************************************************
	//***************************************************************************
	utilsLib.prototype.addErrorMessages = function(prefixMessage, errorMessagesArray, aliasName, endlessLoopParam) {
		var errorMessage;
		var params = [];
		var i;
		var msgObj, fullStr = '';
	
		for (i = 0; i < errorMessagesArray.length; ++i) {
			errorMessage = errorMessagesArray[i];
			params = [aliasName, errorMessage.description];
			msgObj = ResponseCollector.getInstance().addMessage(prefixMessage, params);
			fullStr += JSON.stringify (msgObj);
		}
	
		if (endlessLoopParam) {
			ResponseCollector.getInstance().addMessage("error_vocabulary_invalid_alias_dependancy", endlessLoopParam);
		}
		
		return fullStr;
	};
	
	//***************************************************************************
	//***************************************************************************
	utilsLib.prototype.validateAliasContent = function(validator, content, vocabularyFullName, aliasType, vocaRTServ) {
	
		var validationResult = null;
	
		if (aliasType === constantsLib.ALIAS_CONTENT_DECISION_TABLE) {
	
			var validationFlags = {};
			validationFlags[ruleBodyConstantsLib.OUTPUT_FLAGS_ENUM.validationOutput] = true;
			validationFlags[ruleBodyConstantsLib.OUTPUT_FLAGS_ENUM.unknownTokensOutput] = true;
			validationFlags[ruleBodyConstantsLib.OUTPUT_FLAGS_ENUM.isAlias] = true;
	
			validationResult = validator.validateBusinessRule(content, vocabularyFullName, vocaRTServ, validationFlags, null);
		} else if (aliasType === constantsLib.ALIAS_CONTENT_EXPRESSION) {
	
			validationResult = validator.validateAndGetExpressionActualReturnTypeRT(vocaRTServ, content, vocabularyFullName, null, false);
		}
	
		return validationResult;
	};
	
	//***************************************************************************
	//***************************************************************************
	utilsLib.prototype.getValidatorInstance = function(aliasType) {
	
		var validator;
	
		if (aliasType === constantsLib.ALIAS_CONTENT_DECISION_TABLE) {
			jQuery.sap.require("sap.rules.ui.parser.ruleBody.lib.ruleBodyValidator");
			var ruleBodyValidatorLib = sap.rules.ui.parser.ruleBody.lib.ruleBodyValidator.lib;
			validator = new ruleBodyValidatorLib.RuleBodyValidator();
		} else {
			var parser = new sap.rules.ui.parser.businessLanguage.lib.parsingBackendMediator.lib.parsingBackendMediatorLib();
			validator = parser;
		}
	
		return validator;
	};
	
	//***************************************************************************
	//***************************************************************************
	utilsLib.prototype.getHanaDataType = function(modelType) {
		return vocaUtilsBaseLib.getHanaDataType(modelType);
	};
	
	//***************************************************************************
	//***************************************************************************
	utilsLib.prototype.getBusinessDataType = function(hanaType) {
		return vocaUtilsBaseLib.getBusinessDataType(hanaType);
	};
	
	utilsLib.prototype.isVocabularySuffix = function(suffix) {
		return suffix === "hprvocabulary" || suffix === "hrfvocabulary";
	};
	
	//*************************************************************************************************************************************************************/
	// Scope is calculated in the following way:
	// If no dependency exists - scope will be the vocabulary full name
	// If dependency exists    - retrieve the scope of the first reference vocabulary
	//                           if the scope of the reference vocabulary is global then don't inherit its scope and leave it as the vocabulary full name,
	//                           if the scope , of the reference vocabulary, is something different than global then inherit the scope of the reference vocabulary
	//**************************************************************************************************************************************************************/
	utilsLib.prototype.calculateScope = function(resourceContent, vocabularyFullName, dbConn) {
	
		var scope = vocabularyFullName;
		var referenceVocaFullName;
		var vocabularyDependenciesContent;
		var vocabularyDataProvider = null;
		var runtimeServicesLib = null;
		


		var vocaRuntimeServicesFactory = sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderFactory.lib;
		runtimeServicesLib = new vocaRuntimeServicesFactory.vocaDataProviderFactoryLib();
		vocabularyDataProvider = runtimeServicesLib.getVocabularyDataProvider();
		
		if (resourceContent[constantsLib.PROPERTY_NAME_VOCABULARY_SCOPE]) {
			scope = constantsLib.GLOBAL;
		}
		//If dependency exist, check
		else if (resourceContent.hasOwnProperty(constantsLib.PROPERTY_NAME_DEPENDENCY)) {
			vocabularyDependenciesContent = resourceContent[constantsLib.PROPERTY_NAME_DEPENDENCY];
			if (vocabularyDependenciesContent[0] && this.isVocabularySuffix(vocabularyDependenciesContent[0].suffix)) {
				referenceVocaFullName = vocabularyDependenciesContent[0][constantsLib.PROPERTY_NAME_DEPENDS_ON_PACKAGE] + "::" + vocabularyDependenciesContent[0][constantsLib.PROPERTY_NAME_DEPENDS_ON_NAME];
				var vocaInfo = vocabularyDataProvider.getVocabulary(referenceVocaFullName);
				if (vocaInfo.scope === constantsLib.GLOBAL) {
					scope = vocabularyFullName;
				} else {
					scope = vocaInfo.scope;
				}
			}
		}
		return scope;
	};

	
	return {
		utilsLib: utilsLib
	}; 
	
}());