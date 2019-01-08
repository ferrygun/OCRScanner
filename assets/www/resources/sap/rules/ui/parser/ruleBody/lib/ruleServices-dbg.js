jQuery.sap.declare("sap.rules.ui.parser.ruleBody.lib.ruleServices");

jQuery.sap.require("sap.rules.ui.parser.infrastructure.messageHandling.lib.responseCollector");
jQuery.sap.require("sap.rules.ui.parser.resources.common.lib.resourcesConvertor");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderInitiator");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.ruleBody.lib.ruleBodyServices");
jQuery.sap.require("sap.rules.ui.parser.ruleBody.lib.decisionTableCell");
jQuery.sap.require("sap.rules.ui.parser.ruleBody.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.resources.common.lib.oDataHandler");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.resources.dependencies.lib.constants");

sap.rules.ui.parser.ruleBody.lib.ruleServices = sap.rules.ui.parser.ruleBody.lib.ruleServices|| {}; 
sap.rules.ui.parser.ruleBody.lib.ruleServices.lib = (function(){
	
	//Imported Libs
	var ResponseCollector = sap.rules.ui.parser.infrastructure.messageHandling.lib.responseCollector.lib.ResponseCollector;
	var resCollector = ResponseCollector.getInstance();
	var resourceConvertor = sap.rules.ui.parser.resources.common.lib.resourcesConvertor.lib;
	var vocabularyConstants = sap.rules.ui.parser.resources.vocabulary.lib.constants.lib;
	var vocabularyDataProviderInitiator = sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderInitiator.lib;
	var vocaDataProviderInitiatorLib = new vocabularyDataProviderInitiator.vocaDataProviderInitiatorLib();
	var ruleBodyServLib = sap.rules.ui.parser.ruleBody.lib.ruleBodyServices.lib;
	var ruleBodyServ = new ruleBodyServLib.RuleBodyServicesLib();
	var ruleBodyConstants = sap.rules.ui.parser.ruleBody.lib.constants.lib;
	var decisionTableCellLib = sap.rules.ui.parser.ruleBody.lib.decisionTableCell.lib;
	var oDataHandler = sap.rules.ui.parser.resources.common.lib.oDataHandler.lib;
	var parserConstantsLib = sap.rules.ui.parser.businessLanguage.lib.constants.lib;
	var depConstants = sap.rules.ui.parser.resources.dependencies.lib.constants.lib;
	
	
	//Constants
	var ODATA_PAYLOAD_PROPERTY_RULE = "rule";
	var ODATA_PAYLOAD_PROPERTY_RULES = "rules";
	var ODATA_PAYLOAD_PROPERTY_ID = "id";
	var ODATA_PAYLOAD_PROPERTY_NAME = "name";
	var ODATA_PAYLOAD_PROPERTY_CONTENT = "content";
	var ODATA_PAYLOAD_PROPERTY_PARAMETERS = "parameters";
	var ODATA_PAYLOAD_PROPERTY_DATA_OBJECT_USAGE="usage";
	var ODATA_PAYLOAD_PROPERTY_DATA_OBJECT_USAGE_RESULT="RESULT";
	var ODATA_PAYLOAD_PROPERTY_FLAGS = "flags";
	var ODATA_PAYLOAD_PROPERTY_VOCABULARY_RULES = "vocabularyRules";
	
	var RESULT_DEPENDENCIES = "dependencies";
	
	
	/*
	 * this method check if the given Property exists in the given Object. if the property exist the method return it otherwise return null 
	 */
	var getPropertyFromObject = function(object,propertyName){
		var realPropName = oDataHandler.getOdataPropName(object,propertyName);
		var propertyObject = null;
		if(realPropName){
			propertyObject = object[realPropName];
		}
		return propertyObject;
	};
	
	/*
	 * Note: This voca_init will be called only as part of executeRuleValidation() OR executeRuleServiceValidation() 
	 *       that will be called from the sap\hrf\ruleBody\src\parsingServices.xsjs by T3.
	 */
	var initVocaDataProvider = function(vocaId, vocaContent){
		
		var inputParamObj = null;
		var vocaDataProvider = null;
		
		inputParamObj = {
            "connection" : null, 
            "resourceID" : vocaId,
            "vocaLoadingType" : vocabularyConstants.vocaContextTypeEnum.JSON,
            "resourceContent" : vocaContent,
			"termModes": ["byName"]
		};
		vocaDataProvider = vocaDataProviderInitiatorLib.init(inputParamObj);
		return vocaDataProvider;
	};
	
	
	var getRuleServiceDataObjectID = function(oData){
		
		var resultDataObjectId = null;
		var tempObj = oData;
		if((tempObj= getPropertyFromObject(tempObj,ruleBodyConstants.EXECUTION_CONTEXT ))
				&& 	(tempObj = getPropertyFromObject(tempObj,ruleBodyConstants.RESULT_DATA_OBJECT_ID))) {
			resultDataObjectId = tempObj; // get result data object id
		}
		return resultDataObjectId;
	};
	

	var validateRuleServiceResultDataObject = function(oData){
		
		var i = 0;
		var dataObject = null;
		var paramsArr = null;
		var additionalInfo = null;
		var resultDataObjectId = getRuleServiceDataObjectID(oData);
		var tempObj = oData;
		if( (tempObj= getPropertyFromObject(tempObj,ruleBodyConstants.VOCABULARY ))
		&& (tempObj= getPropertyFromObject(tempObj,ruleBodyConstants.RULE_CONTENT ))
		&& (tempObj= getPropertyFromObject(tempObj,ruleBodyConstants.DATA_OBJECTS ))){
			var dataObjects = tempObj;
			for (i = 0; i < dataObjects.length; i++) {
				dataObject = dataObjects[i];
				if( (tempObj= getPropertyFromObject(dataObject,ruleBodyConstants.ID))=== resultDataObjectId
					&& (tempObj= getPropertyFromObject(dataObject,ODATA_PAYLOAD_PROPERTY_DATA_OBJECT_USAGE))=== ODATA_PAYLOAD_PROPERTY_DATA_OBJECT_USAGE_RESULT){
						return true;
				}	
			}
		}
		tempObj= getPropertyFromObject(oData,ruleBodyConstants.ID);
		additionalInfo = {"type":ruleBodyConstants.additionalInfoTypeEnum.executionContext};
		paramsArr = [resultDataObjectId,tempObj];
		resCollector.addMessage("result_data_object_of_the_rule_services_is_not_valid", paramsArr, null, additionalInfo);
		return false;
	};
	
	
	
	var validateRulesResultDataObject = function(oData, rulesToValidateExCntxt){

		var i = 0;
		var rule = null;
		var rules = null;
		var paramsArr = null;
		var additionalInfo = null;
		var ruleDataObjectID = null;
		var ruleID = null;
		var ruleName = null;
		var ruleServiceID = getPropertyFromObject(oData,ruleBodyConstants.ID); 
		var resultDataObjectId = getRuleServiceDataObjectID(oData);
		var tempObj = getPropertyFromObject(oData,ruleBodyConstants.RULES);
		if(resultDataObjectId && tempObj){
			rules = tempObj;
			for (i = 0; i < rules.length; i++) {
				rule = rules[i];
				if((tempObj = getPropertyFromObject(rule,ruleBodyConstants.RULE_CONTENT))
					&& (tempObj = getPropertyFromObject(tempObj,ruleBodyConstants.RESULT_DATA_OBJECT_ID))){
					ruleDataObjectID = tempObj;
					if(ruleDataObjectID === resultDataObjectId ){
						continue;
					}
					if((ruleID = getPropertyFromObject(rule,ODATA_PAYLOAD_PROPERTY_ID))
						&&(tempObj = getPropertyFromObject(rule,ruleBodyConstants.RULE_CONTENT))
						&& (ruleName = getPropertyFromObject(tempObj,ODATA_PAYLOAD_PROPERTY_NAME))){
							rulesToValidateExCntxt[ruleID] = ruleName;
					}
					additionalInfo = {"ruleID":rule[ODATA_PAYLOAD_PROPERTY_ID],
							"type":ruleBodyConstants.additionalInfoTypeEnum.ruleResult};
					paramsArr = [ruleDataObjectID,
					             ruleID,
					             resultDataObjectId,
					             ruleServiceID];
					resCollector.addMessage("result_data_object_of_the_rule_is_not_valid", paramsArr, null, additionalInfo);
				}	
			}
		}
	};
	
	
	
	var validateExctCntxtParameters = function(oData, vocaDataProvider){
		
		var i = 0;
		var j = 0;
		var result = true;
		var vocaParamAttrArr = null;
		var allVocaParams = [];
		var allOdataParams = [];
		var paramsArr = null;
		var additionalInfo = null;
		var vocaParametersArr = vocaDataProvider.getParameters() || [];
		var tempObj = getPropertyFromObject(oData,ruleBodyConstants.EXECUTION_CONTEXT);
		var oDataParametersArr = getPropertyFromObject(tempObj,ODATA_PAYLOAD_PROPERTY_PARAMETERS) || [];
		var ruleServiceID = getPropertyFromObject(oData,ruleBodyConstants.ID); 
		tempObj = getPropertyFromObject(oData,ruleBodyConstants.VOCABULARY);
		var vocabularyID = getPropertyFromObject(tempObj,ruleBodyConstants.ID);
		//Collect all voca parameters
		for(i = 0; i < vocaParametersArr.length; i++){
			vocaParamAttrArr = vocaParametersArr[i][ruleBodyConstants.ATTRIBUTES] || [];
			for(j = 0; j < vocaParamAttrArr.length; j++){
				allVocaParams.push(vocaParamAttrArr[j][ruleBodyConstants.PARAMETER_NAME]);
			}
		}
		//Collect all oData parameters
		for(i = 0; i < oDataParametersArr.length; i++){
			allOdataParams.push(getPropertyFromObject(oDataParametersArr[i],ODATA_PAYLOAD_PROPERTY_NAME));
		}
		//Check that each voca param attribute exists in the oDataParametersArr
		for(i = 0; i < allVocaParams.length; i++){
			if(allOdataParams.indexOf(allVocaParams[i]) === -1){
				result = false;
				additionalInfo = {"type":ruleBodyConstants.additionalInfoTypeEnum.executionContext};
				paramsArr = [allVocaParams[i], 
				             vocabularyID,
				             ruleServiceID];
				resCollector.addMessage("execution_context_parameter_of_the_rule_services_is_not_valid", paramsArr, null, additionalInfo);
				break;
			}
		}
		return result;
	};
	
	
	
	/**
	 * Executes the validation of Rule/RuleService ExecutionContext section
	 * @param oData : The given resource.
	 * @returns = {status : Success/Error}.
	 */
	var validateExecutionContext = function(oData, vocaDataProvider, failedRulesObj){
		
		var finalValidationResult = {};
		var isRS_ResultDataObjectValid = false;
		var isRS_ExecutionContextParametersValid = false;
		
		failedRulesObj = failedRulesObj || {};
		finalValidationResult[ruleBodyConstants.RULE_STATUS] = ruleBodyConstants.RULE_ERROR;
		isRS_ResultDataObjectValid = validateRuleServiceResultDataObject(oData);
		//Continue only if RuleService ResultDataObject is valid
		if(isRS_ResultDataObjectValid){
			isRS_ExecutionContextParametersValid = validateExctCntxtParameters(oData, vocaDataProvider);
			//Continue only if RuleService ExecutionContext Parameters are valid
			if(isRS_ExecutionContextParametersValid){
				validateRulesResultDataObject(oData, failedRulesObj);
				if(Object.keys(failedRulesObj).length === 0){
					finalValidationResult[ruleBodyConstants.RULE_STATUS] = ruleBodyConstants.RULE_SUCCESS;
				}
			}
		}
		return finalValidationResult;
	};
	
	
	/**
	 * Updates the flags parameter with the format type and the rule id. 
	 * @param ruleId
	 * @param flags {object}
	 */
	var updateFlags = function(ruleId, vocaRuleNameToRootObjectMap, flags){
		
		if (!flags) {
			flags = {};
		}
		
		flags[ruleBodyConstants.ODATA_FORMAT_PAYLOAD] = {};
		flags[ruleBodyConstants.ODATA_FORMAT_PAYLOAD][ruleBodyConstants.RULE_ID] = ruleId;
		flags[ruleBodyConstants.outputFlagsEnum.validationOutput] = false; 
		flags[ruleBodyConstants.outputFlagsEnum.rootObjectContextOutput] = true;
		flags[ruleBodyConstants.outputFlagsEnum.dependenciesOutput] = true;
		if (!flags.vocaRules) {
			flags.vocaRules = {};
		}
		flags.vocaRules.rootObjectMap = vocaRuleNameToRootObjectMap;
	};
	
	/**
	 * Updates the flags parameter with the format type and the rule id. 
	 * @param ruleId
	 * @param flags {object}
	 */
	//var updateFlagsForVocabularyRule = function(flags){
		
		//if (!flags) {
			//flags = {};
		//}
		
		//flags[ruleBodyConstants.outputFlagsEnum.rootObjectContextOutput] = true;
	//};
	
	/**
	 * Validates a cell with its header and its fixedOperator
	 * @param cellExpression
	 * @param fixedOperator
	 * @param headerExpression
	 * @param businessDataType
	 * @param vocabulary
	 * @param vocaDataProvider
	 * @param flags
	 */
	var validateDecisionTableExpression = function validateDecisionTableExpression(headerExpression, fixedOperator, cellExpression, businessDataType, vocabulary, vocaDataProvider, parserVersion, flags)
	{
		var decisionTableCell = new decisionTableCellLib.DecisionTableCell(headerExpression, fixedOperator, cellExpression, businessDataType, vocabulary, vocaDataProvider);
		var result = decisionTableCell.validateAndConvert(flags, parserVersion);
		
		return result;
	};
	
	var updateDependencies = function(dependencies, dependenciesMap) {
		var dependency = null;
		if (dependencies) {
			for (dependency in dependencies) {
				if (dependencies.hasOwnProperty(dependency)) {
					if (dependencies[dependency][depConstants.PROPERTY_NAME_CATEGORY] === depConstants.CATEGORY_VOCA_DO) {
						dependenciesMap[dependencies[dependency].DOName] = null;
					}
				}
			}
		}
		
	};

	/**
	 * Note: This method should receive an instance of vocaDataProvider as a parameter.
	 *       It will be called directly by T1 or indirectly (via executeRuleValidation) by T3.
	 * @param oDataRule : The given resource.
	 * @param vocaId : A vocabulary id from the given resource.
	 * @param vocaDataProvider : Vocabulary data provider instance.
	 * @returns
	 */
	var validateRule = function(oDataRule, vocaId, vocaDataProvider, flags, vocaRuleNameToRootObjectMap, dependenciesMap)
	{
		var convertedRule = null;
		var outputName = null;
		var result = null;
		
		var mFlags = flags ? JSON.parse(JSON.stringify(flags)) : {};
		convertedRule = resourceConvertor.convertRuleODataToInternalModel(oDataRule, null);
		outputName = convertedRule[ruleBodyConstants.EXPLICIT_OUTPUT];
        var dependenciesWasRequested = mFlags && mFlags[ruleBodyConstants.outputFlagsEnum.dependenciesOutput];
		updateFlags(getPropertyFromObject(oDataRule,ODATA_PAYLOAD_PROPERTY_ID), vocaRuleNameToRootObjectMap, mFlags);
		result = ruleBodyServ.process(convertedRule.ruleBody, vocaId, vocaDataProvider, mFlags, outputName, null, oDataRule);
		if(result[ruleBodyConstants.RULE_STATUS] === ruleBodyConstants.RULE_SUCCESS){
			if (dependenciesMap !== null && dependenciesMap !== undefined) {
				updateDependencies(result[RESULT_DEPENDENCIES], dependenciesMap);
			}
			if (!dependenciesWasRequested) {
				delete result[RESULT_DEPENDENCIES];
			}
		}
		return result;
	};
	
	
	/**
	 * Note: This method should receive an instance of vocaDataProvider as a parameter.
	 *       It will be called directly by T1 or indirectly (via executeRuleServiceValidation) by T3.
	 * @param oData : The given resource.
	 * @param vocaId : A vocabulary id from the given resource. 
	 * @param vocaDataProvider : Vocabulary data provider instance.
	 */
	var validateRuleService = function(oData, vocaId, vocaDataProvider, vocaRuleNameToRootObjectMap, dependenciesMap){
		
		var i = 0;
		var oDataRulesArr = getPropertyFromObject(oData,ODATA_PAYLOAD_PROPERTY_RULES);
		var ruleToValidate = null;
		var validateRuleResult = null;
		var validateRuleServiceResult = {};
		var failedRulesObj = {};
		var ruleID = null;
		validateRuleServiceResult = validateExecutionContext(oData, vocaDataProvider, failedRulesObj);
		//Continue only if RuleService ResultDataObject and RuleService ExecutionContext Parameters are valid
		if(!(validateRuleServiceResult[ruleBodyConstants.RULE_STATUS] === ruleBodyConstants.RULE_ERROR && Object.keys(failedRulesObj).length === 0)){
			//Iterate over each Rule to perform it's validation
			for(i = 0; i < oDataRulesArr.length; i++){
				ruleToValidate = oDataRulesArr[i];
				//Skip the Rules with non-valid ResultDataObjectName
				ruleID = getPropertyFromObject(ruleToValidate,ODATA_PAYLOAD_PROPERTY_ID);
				if(!failedRulesObj[ruleID]){
					validateRuleResult = validateRule(getPropertyFromObject(ruleToValidate,ODATA_PAYLOAD_PROPERTY_CONTENT), vocaId, vocaDataProvider, null, vocaRuleNameToRootObjectMap, dependenciesMap);
					if(validateRuleResult[ruleBodyConstants.RULE_STATUS] === ruleBodyConstants.RULE_ERROR){
						validateRuleServiceResult = validateRuleResult;
					}
				}
			}
		}
		return validateRuleServiceResult;
	};

	
	var validateVocabularyRules = function(oDataRulesArr, vocaDataProvider, vocaId, vocaRulesMap, dependenciesMap) {
		var validateVocaRulesResult = null;
		var i = 0;
		var ruleToValidate = null;
		var validateRuleResult = null;
		var ruleName = null;
		var ruleContent = null;
		var flags = {};
		//Iterate over each Rule to perform it's validation
		for(i = 0; i < oDataRulesArr.length; i++){
			ruleToValidate = oDataRulesArr[i];
			ruleContent = getPropertyFromObject(ruleToValidate,ODATA_PAYLOAD_PROPERTY_CONTENT);
			ruleName = getPropertyFromObject(ruleContent,ODATA_PAYLOAD_PROPERTY_NAME);
			if (dependenciesMap.hasOwnProperty(ruleName) === false) {
				continue;
			}
			validateRuleResult = validateRule(ruleContent, vocaId, vocaDataProvider, flags, null, null);
			if(validateRuleResult[ruleBodyConstants.RULE_STATUS] === ruleBodyConstants.RULE_ERROR){
				validateVocaRulesResult = validateRuleResult;
			}
			else {
				vocaRulesMap[ruleName] = validateRuleResult[ruleBodyConstants.RULE_ROOT_OBJECT_CONTEXT];
			}
			
		}
		return validateVocaRulesResult;
		
	};
	/**
	 * This method will be called from the parsingServices.xsjs, therefore it's inits the vocaDataProvider. 
	 * @param requestBodyPayload - service request payload  
	 * @responseObj passed empty to be updated with {status : Success/Error}.
	 */
	var executeRuleValidation = function(requestBodyPayload){
	    
	    var vocaId = null;
	    var responseObj = {};
	    var vocaRuleResponse = null;
	    var vocaDataProvider = null;
	    var vocaContent = null;
	    var flags = null;
	    var oDataVocaRulesArr = null;
	    var vocaRuleNameToRootObjectMap = null;
	    var dependenciesMap = {};
	    var rule = getPropertyFromObject(requestBodyPayload,ODATA_PAYLOAD_PROPERTY_RULE);
	    var ruleContent = getPropertyFromObject(rule ,ODATA_PAYLOAD_PROPERTY_CONTENT);
	    var vocabulary = getPropertyFromObject(requestBodyPayload,ruleBodyConstants.VOCABULARY);
	    if(!vocabulary){
	                    resCollector.addMessage("voca_is_missing_in_the_payload", [], null, null);
	                    responseObj[ruleBodyConstants.RULE_STATUS] = ruleBodyConstants.RULE_ERROR;
	    }
	    else{
	        vocaContent = getPropertyFromObject(vocabulary,ODATA_PAYLOAD_PROPERTY_CONTENT);
	        vocaId = getPropertyFromObject(vocaContent,ODATA_PAYLOAD_PROPERTY_ID);
	        flags = getPropertyFromObject(requestBodyPayload,ODATA_PAYLOAD_PROPERTY_FLAGS);
	        vocaDataProvider = initVocaDataProvider(vocaId, vocaContent);
			oDataVocaRulesArr = getPropertyFromObject(requestBodyPayload,ODATA_PAYLOAD_PROPERTY_VOCABULARY_RULES);
	        responseObj = validateRule(ruleContent, vocaId, vocaDataProvider, flags, null, dependenciesMap);
			if(responseObj[ruleBodyConstants.RULE_STATUS] === ruleBodyConstants.RULE_SUCCESS){
				if (oDataVocaRulesArr !== null) {
					vocaRuleNameToRootObjectMap = {};
					vocaRuleResponse = validateVocabularyRules(oDataVocaRulesArr, vocaDataProvider, vocaId, vocaRuleNameToRootObjectMap, dependenciesMap);
					if(vocaRuleResponse === null){ //Success
						responseObj = validateRule(ruleContent, vocaId, vocaDataProvider, flags, vocaRuleNameToRootObjectMap);
					}
					else {
						responseObj = vocaRuleResponse;
					}
				}
			}
	    }
	    return responseObj;
	};
	

	/**
	 * This method will be called from the parsingServices.xsjs, therefore it inits the vocaDataProvider. 
	 * @param requestBodyPayload - service request payload  
	 * @responseObj passed empty to be updated with {status : Success/Error}.
	 */
	var executeRuleServiceValidation = function(requestBodyPayload){
		
		var vocaId = null;
		var vocaContent = null;
	    var vocaRuleResponse = null;
		var responseObj = {};
	    var oDataVocaRulesArr = null;
		var vocaDataProvider = null;
	    var vocaRuleNameToRootObjectMap = null;
	    var dependenciesMap = {};
		var vocabulary = getPropertyFromObject(requestBodyPayload,ruleBodyConstants.VOCABULARY);
		if(!vocabulary){
			resCollector.addMessage("voca_is_missing_in_the_payload", [], null, null);
			responseObj[ruleBodyConstants.RULE_STATUS] = ruleBodyConstants.RULE_ERROR;
	    }
		else{
			vocaContent = getPropertyFromObject(vocabulary,ODATA_PAYLOAD_PROPERTY_CONTENT);
		    vocaId = getPropertyFromObject(vocaContent,ODATA_PAYLOAD_PROPERTY_ID);
		    vocaDataProvider = initVocaDataProvider(vocaId, vocaContent);
			oDataVocaRulesArr = getPropertyFromObject(requestBodyPayload,ODATA_PAYLOAD_PROPERTY_VOCABULARY_RULES);
		    responseObj = validateRuleService(requestBodyPayload, vocaId, vocaDataProvider, null, dependenciesMap);	    
			if(responseObj[ruleBodyConstants.RULE_STATUS] === ruleBodyConstants.RULE_SUCCESS){
				if (oDataVocaRulesArr !== null) {
					vocaRuleNameToRootObjectMap = {};
					vocaRuleResponse = validateVocabularyRules(oDataVocaRulesArr, vocaDataProvider, vocaId, vocaRuleNameToRootObjectMap, dependenciesMap);
					if(vocaRuleResponse === null){ //Success
						responseObj = validateRuleService(requestBodyPayload, vocaId, vocaDataProvider, vocaRuleNameToRootObjectMap, null);
					}
					else {
						responseObj = vocaRuleResponse;
					}
				}
			}
		}
		return responseObj;
	};

	/**
	 * Supply current expression languge version supported by this parser. 
	 * @param  
	 * @responseObj string with version number
	 */
	 var getParserExprLangVersion = function(){
		 return parserConstantsLib.PARSER_EXPR_LANG_VERSION;
	 };	
	
	return {
		executeRuleValidation : executeRuleValidation,
		executeRuleServiceValidation : executeRuleServiceValidation,
		validateRuleService : validateRuleService,
		validateDecisionTableExpression : validateDecisionTableExpression,
		validateRule : validateRule,
		validateExecutionContext : validateExecutionContext,
		getParserExprLangVersion : getParserExprLangVersion
	};

}());
