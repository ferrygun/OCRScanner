jQuery.sap.declare("sap.rules.ui.parser.ruleBody.lib.ruleBodyValidator");

jQuery.sap.require("sap.rules.ui.parser.ruleBody.lib.ruleBody");
jQuery.sap.require("sap.rules.ui.parser.ruleBody.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.resources.dependencies.lib.objects");
jQuery.sap.require("sap.rules.ui.parser.ruleBody.lib.dependenciesHandler");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.infrastructure.messageHandling.lib.responseCollector");
jQuery.sap.require("sap.rules.ui.parser.infrastructure.util.utilsBase");
jQuery.sap.require("sap.rules.ui.parser.infrastructure.util.constants");
jQuery.sap.require("sap.rules.ui.parser.ruleBody.lib.decisionTableCell");
jQuery.sap.require("sap.rules.ui.parser.resources.dependencies.lib.constants");

/** 
 * This class is a for rule body validations:
 * @constructor
	 */

sap.rules.ui.parser.ruleBody.lib.ruleBodyValidator = sap.rules.ui.parser.ruleBody.lib.ruleBodyValidator|| {}; 
sap.rules.ui.parser.ruleBody.lib.ruleBodyValidator.lib = (function() {
	
	var ruleBodyBase = sap.rules.ui.parser.ruleBody.lib.ruleBody.lib;
	var ruleBodyConstants = sap.rules.ui.parser.ruleBody.lib.constants.lib;
	var RelConstants = sap.rules.ui.parser.businessLanguage.lib.constants.lib;
	var dependenciesObjectsLib = sap.rules.ui.parser.resources.dependencies.lib.objects.lib;
	var dependenciesHandlerLib = sap.rules.ui.parser.ruleBody.lib.dependenciesHandler.lib;
	var vocConstants = sap.rules.ui.parser.resources.vocabulary.lib.constants.lib;
	var ResponseCollector = sap.rules.ui.parser.infrastructure.messageHandling.lib.responseCollector.lib.ResponseCollector;
	var utilsBaseLib = sap.rules.ui.parser.infrastructure.util.utilsBase.lib;
	var utilsLib = new utilsBaseLib.utilsBaseLib();
	var utilConstantsLib = sap.rules.ui.parser.infrastructure.util.constants.lib;
	var decisionTableCellLib = sap.rules.ui.parser.ruleBody.lib.decisionTableCell.lib;
	var depConstants = sap.rules.ui.parser.resources.dependencies.lib.constants.lib;
	
	function RuleBodyValidator() {
	
		jQuery.sap.log.debug("CTOR - Rule Validator");
		ruleBodyBase.RuleBody.call(this); //improve inheritance writing
	
		this.initValidation();
	
		//invalid ruleBody - saved for re-validation
		this.invalidRuleBody = null;
	
		//init mode
		this.mode = ruleBodyConstants.RULE_MODE_VALIDATION;
	
		//for alias output pram data type
		this.aliasOutputBusinessDataType = null;
		
		//Data for saving root object + keys
		this.rootObjectContext = {};
		this.rootObjectContext.name = null;
		this.rootObjectContext.keysMap = {};
		this.haveSameRootObject = true;
		this.vocaRulesRootObjectMap = null;
		this.dependenciesByFlags = false;
	}
	
	RuleBodyValidator.prototype = Object.create(ruleBodyBase.RuleBody.prototype); //Inherit rule body properties and functions
	RuleBodyValidator.prototype.constructor = RuleBodyValidator; //Change the reference of the constructor 
	
	/**
	 *
	 */
	RuleBodyValidator.prototype.initValidation = function initValidation() {
	
		//invalid headers - for not to validate the the header's column cells
		this.invalidHeaders = [];
		this.headersOfInvalidCells = {};
	
		this.actionMap = {};
	
		//validation status - Error/Success
		this.status = ruleBodyConstants.RULE_SUCCESS;
	
		//validation output - invalid instances  
		this.ruleBody = {};
		this.ruleBody.type = "";
		this.ruleBody.content = {};
	
		//flags for required output
		this.flags = {};
		this.flags[ruleBodyConstants.outputFlagsEnum.dependenciesOutput] = false;
		this.flags[ruleBodyConstants.outputFlagsEnum.validationOutput] = true;
		this.flags[ruleBodyConstants.outputFlagsEnum.unknownTokensOutput] = false;
		this.flags[ruleBodyConstants.outputFlagsEnum.isAlias] = false;
	
		//dependencies handler
		this.depHandler = null;
	
		//unknown tokens map
		this.unknownTokens = {};
	
		//output params counter per row
		this.rowOutputParamsCnt = 0;
		
		//condition columns counter
		this.conditionColumnsCnt = 0;
		
		this.currentParserResult = null;
	};
	
	/**
	 * Returns true if parser returned error message. false otherwise
	 * 
	 */
	RuleBodyValidator.prototype.isParserReturnedErrorMessage = function isParserReturnedErrorMessage() {
	
		if (this.currentParserResult.hasOwnProperty('status') && this.currentParserResult.status === ruleBodyConstants.RULE_ERROR) {
			return true;
		}
	
		return false;
	};
	
	/**
	 * Updates an object of the validation result
	 * @param object
	 * 
	 */
	RuleBodyValidator.prototype.updateValidateResult = function updateValidateResult(object) {
		//$.trace.debug("parserResult --> " + JSON.stringify(this.currentParserResult));
	
		if (this.currentParserResult.hasOwnProperty('status') && this.currentParserResult.status === ruleBodyConstants.RULE_ERROR) {
			object.errorDetails = this.currentParserResult.errorDetails;
			object.status = this.currentParserResult.status;
			object.cursorPosition = this.currentParserResult.cursorPosition;
			return object;
		}
	
		return null;
	};
	
	/**
	 * Adding messages to response collector
	 * @param parserResult
	 * @param path
	 * @param errorID
	 * @param paramsArr
	 * @param additionalInfo
	 * 
	 */
	
	RuleBodyValidator.prototype.handleMessages = function handleMessages(parserResult, path, errorID, paramsArr, additionalInfo) {
	
		if (parserResult !== null && parserResult !== undefined) { //Adding parser formatted messages
			var additionalInfoFromParser = additionalInfo || {'cursorPosition': parserResult.cursorPosition};
			

			//ResponseCollector.getInstance().addFormattedMessage(parserResult.errorDetails, parserResult.errorID, path, additionalInfoFromParser);
			ResponseCollector.getInstance().addMessage(parserResult.errorID, undefined, path, additionalInfoFromParser, parserResult.errorDetails);
		} else { //Adding ruleBody messages
			//if additionalInfo exists, the output should be in ODATA format, it means without path
			if (additionalInfo){
				path = null;
			}
			ResponseCollector.getInstance().addMessage(errorID, paramsArr, path, additionalInfo);
		}
	};
	
	/**
	 * Adding messages to response collector with additional data for OData format output
	 * @param parserResult
	 * @param type
	 * @param colId
	 * @param rowId
	 * 
	 */
	RuleBodyValidator.prototype.handleMessages4OdataFormatOutput = function handleMessages4OdataFormatOutput(parserResult, type, colId, rowId, errorID, paramsArr, path){
		var additionalInfo = null;
			
		if(parserResult){ // Handles parser message
			if(this.flags[ruleBodyConstants.ODATA_FORMAT_PAYLOAD]){
				additionalInfo = {};
				additionalInfo.type = type;
				additionalInfo.ruleId = this.flags[ruleBodyConstants.ODATA_FORMAT_PAYLOAD][ruleBodyConstants.RULE_ID];
				additionalInfo.colId = colId;
				additionalInfo.cursorPosition = parserResult.cursorPosition;
				if (rowId){
					additionalInfo.rowId = rowId;
				}
				this.handleMessages(parserResult, path, parserResult.errorID, null, additionalInfo);
			}
		}
		else{ // Handles ruleBody messages
			if(this.flags[ruleBodyConstants.ODATA_FORMAT_PAYLOAD]){
				additionalInfo = {};
				additionalInfo.type = type;
				additionalInfo.ruleId = this.flags[ruleBodyConstants.ODATA_FORMAT_PAYLOAD][ruleBodyConstants.RULE_ID];
				if(colId){
					additionalInfo.colId = colId;
				}
				if (rowId){
					additionalInfo.rowId = rowId;
				}
			}
			this.handleMessages(null, path, errorID, paramsArr, additionalInfo);
		}
	};
	

	/**
	 * Updates the root object context for all expressions in the ruleBody
	 */
	RuleBodyValidator.prototype.updateRootObjectContext = function updateRootObjectContext(currentObjectContext) {
		var errorMessage, errorString = null;
		var i, params = [];
		
		if(this.rootObjectContext.name && currentObjectContext.name && 
		   this.rootObjectContext.name !== currentObjectContext.name){ // both are not empty + have different root
			
			// Adding error message for all ruleBody
			this.haveSameRootObject = false;
			this.status = ruleBodyConstants.RULE_ERROR;
			params = [this.rootObjectContext.name];
			errorMessage = "rule_body_validator_expressions_need_to_have_same_root_object";
			errorString = ResponseCollector.getInstance().getMessage(errorMessage, params);
			this.handleMessages4OdataFormatOutput(null, ruleBodyConstants.additionalInfoTypeEnum.ruleResult, null, null, errorMessage, params, null);
		}
		else{
			// Updating keys from parser
			if(currentObjectContext.associations){
				for(i=0; i<currentObjectContext.associations.length; i++){
					this.rootObjectContext.keysMap[currentObjectContext.associations[i]] = true;
				}
			}
			
			// Updating keys from vocabulary rules
			if(currentObjectContext.keys){
				for(i=0; i<currentObjectContext.keys.length; i++){
					this.rootObjectContext.keysMap[currentObjectContext.keys[i]] = true;
				}
			}
			// Updating root object
			if(!this.rootObjectContext.name && currentObjectContext.name){ // ruleBody root is empty + result is not empty
				this.rootObjectContext.name = currentObjectContext.name;
			}
		}
		
		return errorString;
	};
	/**
	 * Updates the root object context for all expressions in the ruleBody
	 */
	RuleBodyValidator.prototype.updateRootObjectContextFromParser = function updateRootObjectContextFromParser() {
		var currentObjectContext, errorString = null;
		
		if (this.currentParserResult.hasOwnProperty(RelConstants.propertiesEnum.rootObjectContext) &&
			this.currentParserResult.status === RelConstants.statusEnum.SUCCESS &&
			this.haveSameRootObject) {
			
			currentObjectContext = this.currentParserResult[RelConstants.propertiesEnum.rootObjectContext];
			
			errorString = this.updateRootObjectContext(currentObjectContext);
			
		}
		
		return errorString;
	};
	
	RuleBodyValidator.prototype.validateRootObjectContextAgainstVocaRules = function validateRootObjectContextAgainstVocaRules() {
		var errorString = null;
		var dependency;
		var vocaObjectContext;
		
		if (this.vocaRulesRootObjectMap) {
			var dependencies = this.depHandler.getDependencies();
			if (dependencies) {
				for (dependency in dependencies) {
					if (dependencies.hasOwnProperty(dependency)) {
						if (dependencies[dependency][depConstants.PROPERTY_NAME_CATEGORY] === depConstants.CATEGORY_VOCA_DO && 
								this.vocaRulesRootObjectMap.hasOwnProperty(dependencies[dependency].DOName)) {
							vocaObjectContext = this.vocaRulesRootObjectMap[dependencies[dependency].DOName];
							errorString = this.updateRootObjectContext(vocaObjectContext);
						}
					}
				}
			}
		}
		return errorString;
	};
	
	/**
	 * Updates the dependencies handler with the new dependency
	 */
	RuleBodyValidator.prototype.updateDependnciesFromParser = function updateDependnciesFromParser() {
		if (this.currentParserResult.hasOwnProperty(ruleBodyConstants.outputFlagsEnum.dependenciesOutput) &&
			this.status === ruleBodyConstants.RULE_SUCCESS) {
			this.depHandler.addDependencies(this.currentParserResult[ruleBodyConstants.outputFlagsEnum.dependenciesOutput]);
		}
	};
	
	/**
	 * Updates the
	 * 
	 */
	RuleBodyValidator.prototype.updateUnknownTokensFromParser = function updateUnknownTokensFromParser() {
		var key = "";
	
		if (this.currentParserResult.hasOwnProperty('unknownTokens')) { 
	
			for (key in this.currentParserResult.unknownTokens) {
	
				if (this.currentParserResult.unknownTokens.hasOwnProperty(key)) {
	
					if (this.unknownTokens.hasOwnProperty(key) === false) {
						this.unknownTokens[key] = 1;
					} else {
						this.unknownTokens[key] ++;
					}
	
				}
			}
		}
	};
	
	/**
	 * Validates collection info on an output parameter
	 * @param parserResult
	 * @param paramName
	 * @param pathPrefix
	 */
	RuleBodyValidator.prototype.valiadteCollectionInfoOnOutputParameter= function valiadteCollectionInfoOnOutputParameter(parserResult, paramName, path){
		var params = [];
		var errorString = null;
		var errorMessage = null;
		
		if(parserResult !== null){
			
			if(!this.outputInfo && 
				this.flags[ruleBodyConstants.outputFlagsEnum.isAlias]) { // alias + not explicit output
				
				//in this case, output parameter cannot be a collection
				if(this.isOutputParameterCollection(parserResult)){
					
					this.status = ruleBodyConstants.RULE_ERROR;
					params = [paramName];
					errorMessage = "rule_body_validator_alias_output_parameter_cannot_be_collection";
					errorString = ResponseCollector.getInstance().getMessage(errorMessage, params);
					this.handleMessages(null, path, errorMessage, params);
				}
			}
		}
		
		return errorString;
	};
	
	/*****************************************************************************************************************
	 * Text handlers
	 *****************************************************************************************************************/
	/**
	 * handles Text Condition
	 */
	RuleBodyValidator.prototype.handleTextCondition = function handleTextCondition(condition, result, pathPrefix) {
		jQuery.sap.log.debug("Validate Condition");
	
		this.currentParserResult = this.getParserAST(condition, RelConstants.VALIDATE_MODE, null, RelConstants.TYPE_BOOLEAN, this.flags);
		
		if (this.isParserReturnedErrorMessage()) {
			this.status = ruleBodyConstants.RULE_ERROR;
	
			//Updating response collector with validation messages
			this.handleMessages(this.currentParserResult, pathPrefix);
	
			//Updating unknown tokens
			if (this.flags[ruleBodyConstants.outputFlagsEnum.unknownTokensOutput]) {
				this.updateUnknownTokensFromParser();
			}
		}
	
		//Updating dependencies
		if (this.flags[ruleBodyConstants.outputFlagsEnum.dependenciesOutput]) {
			this.updateDependnciesFromParser();
		}
	};
	
	/**
	 * init Text Outputs Result
	 */
	RuleBodyValidator.prototype.initTextOutputsResult = function initTextOutputsResult() {
		this.ruleBody.content.outputs = [];
	};
	
	/*****************************************************************************************************************
	 * Text handlers
	 *****************************************************************************************************************/
	RuleBodyValidator.prototype.getOutputParamBusinessDataType = function getOutputParamBusinessDataType(paramName, suppliedType) {
	
		var businessDataType = null;
	
		if (this.outputInfo === null) { //Not an explicit output
	
			if (suppliedType !== null) { //if business data type was sent
	
				businessDataType = suppliedType;
			} else {
				if (this.flags[ruleBodyConstants.outputFlagsEnum.isAlias] &&
					this.aliasOutputBusinessDataType !== null) {
	
					businessDataType = this.aliasOutputBusinessDataType;
				} else {
	
					businessDataType = RelConstants.TYPE_ALL;
				}
			}
		} else { //explicit output
	
			var index;
	
			var requiredParamsArray = this.outputInfo.requiredParams;
	
			//get the right type from outputInfo (vocabulary)
			for (index = 0; index < requiredParamsArray.length; index++) {
	
				if (paramName === requiredParamsArray[index].name) {
	
					businessDataType = requiredParamsArray[index].businessDataType;
	
					break;
				}
			}
		}
	
		return businessDataType;
	};
	
	/****************************************************************************************************************
	 * Get specific output param info from runtime services explicit output info
	 ****************************************************************************************************************/
	RuleBodyValidator.prototype.getOutputParamFromOutputRTInfo = function getOutputParamFromOutputRTInfo(paramName){
		var index;
		var requiredParamsArray;
		
		if(this.outputInfo !== null){
			
			requiredParamsArray = this.outputInfo.requiredParams;
			
			for (index = 0; index < requiredParamsArray.length; index++) {
	
				if (paramName === requiredParamsArray[index].name) {
	
					return requiredParamsArray[index];
				}
			}
		}
		
		return null;
	};
	
	/****************************************************************************************************************
	 * update is collection flag in order to check collections
	 ****************************************************************************************************************/
	RuleBodyValidator.prototype.updateParserIsCollectionFlag = function updateParserIsCollectionFlag(paramName){
		
		var flags = this.flags;
		var outputParamRTInfo = this.getOutputParamFromOutputRTInfo(paramName);
		
		if(outputParamRTInfo !== null && 
		   outputParamRTInfo.hasOwnProperty(vocConstants.PROPERTY_NAME_IS_COLLECTION) &&
		   outputParamRTInfo[vocConstants.PROPERTY_NAME_IS_COLLECTION] === true){
		
			flags = JSON.parse(JSON.stringify(this.flags));
			flags[ruleBodyConstants.outputPropertiesEnum.isCollection] = true;
		}
		
		return flags;
	};
	
	/*****************************************************************************************************************
	 * Is output parameter name is valid
	 *****************************************************************************************************************/
	RuleBodyValidator.prototype.isValidOutputName = function isValidOutputName(paramName) {
	
		if (this.outputInfo === null) { //Not an explicit output
	
			return true;
		}
	
	
		var index;
	
		var requiredParamsArray = this.outputInfo.requiredParams;
	
		//get the right type from outputInfo (vocabulary)
		for (index = 0; index < requiredParamsArray.length; index++) {
	
			if (paramName === requiredParamsArray[index].name) {
	
				return true;
			}
		}
	
		//This is a case of an explicit output with a wrong parameter name
		return false;
	};
	
	/*****************************************************************************************************************
	 * Checks if an explicit output parameter defined in the vocabulary as a collection, 
	 * then the parameter expression need to be also of type collection (by the parser) 
	 *****************************************************************************************************************/
	/*RuleBodyValidator.prototype.isExplicitOutputParameterValidCollection = function isExplicitOutputParameterValidCollection(parserResult, paramName){
		var requiredParamsArray = this.outputInfo.requiredParams;
		var index;
		
		if(parserResult.hasOwnProperty(RelConstants.propertiesEnum.isCollection) && 
		   parserResult[RelConstants.propertiesEnum.isCollection] === true){
			
			//get the right type from outputInfo (vocabulary)
			for (index = 0; index < requiredParamsArray.length; index++) {
		
				if (paramName === requiredParamsArray[index].name){
			
					if(requiredParamsArray[index].isCollection === true) {
						return true;
					}
					
					return false;
				}
			}
		}
		
		return true;
	};*/
	
	/*****************************************************************************************************************
	 * Checks if an output parameter is not a collection 
	 *****************************************************************************************************************/
	RuleBodyValidator.prototype.isOutputParameterCollection = function isOutputParameterCollection(parserResult){
		
		if(parserResult.hasOwnProperty(RelConstants.propertiesEnum.isCollection) && 
		   parserResult[RelConstants.propertiesEnum.isCollection] === true){
		
			return true;
		}
		
		return false;
	};
	
	/*****************************************************************************************************************
	 * Handle text output parameter
	 *****************************************************************************************************************/
	RuleBodyValidator.prototype.handleTextOutputParameter = function handleTextOutputParameter(currentOutput, result, pathPrefix) {
		var isValidName;
		var params;
		var path;
		var flags;
		
		//increase the counter of the output parameters
		this.rowOutputParamsCnt++;
	
		isValidName = this.isValidOutputName(currentOutput.name);
		
		//checks if output param name is aligned with vocabulary
		if (isValidName === false) {
			this.status = ruleBodyConstants.RULE_ERROR;
			path = utilsLib.buildJsonPath(pathPrefix, ruleBodyConstants.RULE_OUTPUT_PARAM_NAME);
			params = [currentOutput.name, this.outputInfo.name];
			this.handleMessages(null, path, "rule_body_validator_parameter_not_exists_in_output", params);
			return;
		}
	
		//getting business type
		var suppliedType = null;
		if (currentOutput.hasOwnProperty(ruleBodyConstants.RULE_PARAM_BUSINESS_DATA_TYPE)) { //if business data type was sent
			suppliedType = currentOutput[ruleBodyConstants.RULE_PARAM_BUSINESS_DATA_TYPE];
		}
		var businessDataType = this.getOutputParamBusinessDataType(currentOutput.name, suppliedType);
	
		//When business data type is available for this parameter, gets the parser validation result
		if (businessDataType !== null) { 
			
			flags = this.updateParserIsCollectionFlag(currentOutput.name);
			this.currentParserResult = this.getParserAST(currentOutput.content, RelConstants.VALIDATE_MODE, null, businessDataType, flags);
	
			if (this.isParserReturnedErrorMessage()) { //parser error
				this.status = ruleBodyConstants.RULE_ERROR;
	
				//Updating response collector with validation messages
				path = utilsLib.buildJsonPath(pathPrefix, ruleBodyConstants.RULE_CONTENT);
				this.handleMessages(this.currentParserResult, path);
	
				//Updating unknown tokens
				if (this.flags[ruleBodyConstants.outputFlagsEnum.unknownTokensOutput]) {
					this.updateUnknownTokensFromParser();
				}
			}
			else{ //parser validation OK
				path = utilsLib.buildJsonPath(pathPrefix, ruleBodyConstants.RULE_CONTENT);
				this.valiadteCollectionInfoOnOutputParameter(this.currentParserResult, currentOutput.name, path);
			}
			
			if (this.flags[ruleBodyConstants.outputFlagsEnum.dependenciesOutput]) {
				this.updateDependnciesFromParser();
			}
		}
	};
	
	/**
	 * init Text Parameters Result
	 */
	RuleBodyValidator.prototype.initTextParametersResult = function initTextParametersResult() {
		this.ruleBody.content.parameters = [];
	};
	
	/**
	 * init Text Parameters Result
	 */
	RuleBodyValidator.prototype.initTextActionsResult = function initTextActionsResult() {
		this.ruleBody.content.actions = [];
	};
	
	/**
	 * handles Text Action Parameter
	 * @param currentParam
	 */
	RuleBodyValidator.prototype.handleTextActionParameter = function handleTextActionParameter(currentParam, result, index, pathPrefix) {
		var i;
		var businessDataType;
		var path;
	
		this.handleActionParameterForText(currentParam.actionReference, currentParam.name, index, pathPrefix);
	
		var businessDtArray = this.getActionParamBusinessDataArray({
			"colID": index
		});
	
		for (i = 0; i < businessDtArray.length; i++) {
	
			businessDataType = businessDtArray[i];
	
			this.currentParserResult = this.getParserAST(currentParam.content, RelConstants.VALIDATE_MODE, null, businessDataType, this.flags);
	
			if (this.isParserReturnedErrorMessage()) {
				this.status = ruleBodyConstants.RULE_ERROR;
	
				//Updating response collector with validation messages
				path = utilsLib.buildJsonPath(pathPrefix, ruleBodyConstants.RULE_CONTENT);
				this.handleMessages(this.currentParserResult, path);
	
				//Updating unknown tokens
				if (this.flags[ruleBodyConstants.outputFlagsEnum.unknownTokensOutput]) {
					this.updateUnknownTokensFromParser();
				}
			}
	
			if (this.flags[ruleBodyConstants.outputFlagsEnum.dependenciesOutput]) {
				this.updateDependnciesFromParser();
			}
		}
	};
	
	/*****************************************************************************************************************
	 * is action exists
	 *****************************************************************************************************************/
	RuleBodyValidator.prototype.isActionExists = function isActionExists(actionName) {
	
		var actionInfo = null;
	
		//If action name isn't cached, get it from the runtimeServices
		if (this.actionsMap.hasOwnProperty(actionName) === false) {
	
			actionInfo = this.vocabularyDataProvider.getAction(this.vocabulary, actionName,null);
	
			if (actionInfo === null) {
	
				return false;
			}
	
			this.actionsMap[actionName] = {
				"paramMap": {}
			};
		}
	
		return true;
	};
	
	
	
	/**
	 * handles Text Action
	 * @param currentAction
	 */
	RuleBodyValidator.prototype.handleTextAction = function handleTextAction(currentAction, result, pathPrefix) {
		var depMap = {};
	
		var actionName = currentAction.name;
	
		var isActionExists = this.isActionExists(actionName);
	
		if (isActionExists === false) { //add error of action doesn't exists
			var path = utilsLib.buildJsonPath(pathPrefix, ruleBodyConstants.RULE_ACTION_NAME);
			var params = [actionName];
			this.handleMessages(null, path, "rule_body_validator_action_not_exists", params);
	
			this.status = ruleBodyConstants.RULE_ERROR;
		}
	
		//build action dependency object
		if (this.flags[ruleBodyConstants.outputFlagsEnum.dependenciesOutput] &&
			this.status === ruleBodyConstants.RULE_SUCCESS) {
	
			if (currentAction.hasOwnProperty(ruleBodyConstants.RULE_ACTION_NAME)) {
	
				var actionInfo = this.vocabularyDataProvider.getAction(this.vocabulary, actionName,null);
	
				var vocabulary = null;
	
				//action exists
				if (actionInfo !== null) {
	
					vocabulary = actionInfo.vocaName;
				}
	
				var dependencyKey = vocConstants.PROPERTY_NAME_ACTIONS.concat("." + actionName);
				depMap[dependencyKey] = new dependenciesObjectsLib.VocaAction(actionName, vocabulary);
	
				//add the dependency to the dependencies handler
				this.depHandler.addDependencies(depMap);
			}
		}
	};
	
	/*****************************************************************************************************************
	 * Get and Set action Info
	 *****************************************************************************************************************/
	RuleBodyValidator.prototype.setActionInfoInActionMap = function setActionInfoInActionMap(actionName) {
	
		var actionInfo = null;
	
		//was not yet cached
		if (this.actionsMap.hasOwnProperty(actionName) === false) {
	
			actionInfo = this.vocabularyDataProvider.getAction(this.vocabulary, actionName,null);
	
			//Action not exists in the vocabulary
			if (actionInfo === null) {
	
				return false;
			}
	
			this.actionsMap[actionName] = {
				"paramMap": {},
				"vocabulary": actionInfo.vocaName
			};
			var paramIndex;
			var requiredParamName;
			var businessDataType;
	
			//Check if parameter name exists in the requiredParameters of the action
			for (paramIndex = 0; paramIndex < actionInfo.requiredParams.length; paramIndex++) {
	
				requiredParamName = actionInfo.requiredParams[paramIndex].name;
				businessDataType = actionInfo.requiredParams[paramIndex].businessDataType;
	
				this.actionsMap[actionName].paramMap[requiredParamName] = {
					"bdType": businessDataType,
					"isExists": false,
					"colID": null
				};
			}
		}
	
		return true;
	};
	
	/*****************************************************************************************************************
	 * Check if the input parameter name is really an action parameter
	 *****************************************************************************************************************/
	RuleBodyValidator.prototype.isParameterExistsInActionMap = function isParameterExistsInActionMap(paramName, actionName, colID) {
	
		if (this.actionsMap.hasOwnProperty(actionName) === false) {
	
			return false;
		}
	
		var actionObj = this.actionsMap[actionName];
	
		//If this parameter name exists in vocabulary as required parameter - mark it as exists
		if (actionObj.paramMap.hasOwnProperty(paramName) === false) {
	
			return false;
		}
	
		actionObj.paramMap[paramName].isExists = true;
	
		actionObj.paramMap[paramName].colID = colID;
	
		return true;
	};
	
	
	/*******************************************************************************************
	 * Handle action parameter name
	 ********************************************************************************************/
	RuleBodyValidator.prototype.handleActionParameterForText = function handleActionParameterForText(actionReferenceArray, paramName, colID, pathPrefix) {
	
		var index;
		var actionReferenceName;
		var isActionExists;
		var params;
		var path;
	
		for (index = 0; index < actionReferenceArray.length; index++) {
	
			actionReferenceName = actionReferenceArray[index];
	
			isActionExists = this.setActionInfoInActionMap(actionReferenceName);
	
			//Action not exists in the vocabulary
			if (isActionExists === false) {
	
				path = utilsLib.buildJsonPath(pathPrefix, ruleBodyConstants.RULE_ACTION_REFERENCE);
				params = [actionReferenceName];
				this.handleMessages(null, path, "rule_body_validator_action_ref_not_exists", params);
	
				this.status = ruleBodyConstants.RULE_ERROR;
			} else if (this.isParameterExistsInActionMap(paramName, actionReferenceName, colID) === false) {
	
				path = utilsLib.buildJsonPath(pathPrefix, ruleBodyConstants.RULE_ACTION_PARAM_NAME);
				params = [paramName, actionReferenceName];
				this.handleMessages(null, path, "rule_body_validator_param_name_not_exists", params);
	
				this.status = ruleBodyConstants.RULE_ERROR;
			}
		}
	};
	
	
	/*******************************************************************************************
	 * Handle action parameter name
	 ********************************************************************************************/
	RuleBodyValidator.prototype.handleActionParameterForDecisionTable = function handleActionParameteForDecisionTable(actionReferenceArray, paramName, colID) {
	
		var index;
		var actionReferenceName;
		var isActionExists;
		var errorString;
		var params;
		var currentCell;
	
		for (index = 0; index < actionReferenceArray.length; index++) {
	
			actionReferenceName = actionReferenceArray[index];
	
			isActionExists = this.setActionInfoInActionMap(actionReferenceName);
	
			//Action not exists in the vocabulary
			if (isActionExists === false) {
	
				params = [actionReferenceName];
				errorString = ResponseCollector.getInstance().getMessage("rule_body_validator_action_ref_not_exists", params);
				this.handleMessages(null, undefined, "rule_body_validator_action_ref_not_exists", params);
	
				currentCell = {};
	
				currentCell.colID = colID;
				currentCell.status = ruleBodyConstants.RULE_ERROR;
				currentCell.errorDetails = errorString;
	
				this.status = ruleBodyConstants.RULE_ERROR;
	
				if (this.flags[ruleBodyConstants.outputFlagsEnum.validationOutput]) {
					this.ruleBody.content.headers.push(currentCell);
				}
	
				this.invalidHeaders[colID] = true;
	
			} else if (this.isParameterExistsInActionMap(paramName, actionReferenceName, colID) === false) {
	
				params = [paramName, actionReferenceName];
				errorString = ResponseCollector.getInstance().getMessage("rule_body_validator_param_name_not_exists", params);
				this.handleMessages(null, undefined, "rule_body_validator_param_name_not_exists", params);
	
				currentCell = {};
	
				currentCell.colID = colID;
				currentCell.status = ruleBodyConstants.RULE_ERROR;
				currentCell.errorDetails = errorString;
	
				this.status = ruleBodyConstants.RULE_ERROR;
	
				if (this.flags[ruleBodyConstants.outputFlagsEnum.validationOutput]) {
					this.ruleBody.content.headers.push(currentCell);
				}
	
				this.invalidHeaders[colID] = true;
			}
		}
	};
	
	/*****************************************************************************************************************
	 * Handle output parameter
	 *****************************************************************************************************************/
	RuleBodyValidator.prototype.handleOutputParameterHeader = function handleOutputParameterHeader(paramName, paramType, colID) {
	
		var isValidName = this.isValidOutputName(paramName);
		var errorMessage = "";
		var params;
	
		//increase number of output parameters
		this.rowOutputParamsCnt++;
	
		if (isValidName === false || (this.flags[ruleBodyConstants.outputFlagsEnum.isAlias] && this.rowOutputParamsCnt > 1)) {
	
			if (isValidName === false) {
				params = [paramName, this.outputInfo.name];
				errorMessage = "rule_body_validator_parameter_not_exists_in_output";
			} else if (this.flags[ruleBodyConstants.outputFlagsEnum.isAlias] && this.rowOutputParamsCnt > 1) {
				errorMessage = "rule_body_validator_one_alias_output_param_allowed";
			}
	
			var errorString = ResponseCollector.getInstance().getMessage(errorMessage, params);
			this.handleMessages4OdataFormatOutput(null, ruleBodyConstants.additionalInfoTypeEnum.column, colID, null, errorMessage, params, null);
	
			var currentCell = {};
	
			currentCell.colID = colID;
			currentCell.name = paramName;
			currentCell.type = paramType;
			currentCell.status = ruleBodyConstants.RULE_ERROR;
			currentCell.errorDetails = errorString;
	
			this.status = ruleBodyConstants.RULE_ERROR;
	
			if (this.flags[ruleBodyConstants.outputFlagsEnum.validationOutput]) {
				this.ruleBody.content.headers.push(currentCell);
			}
	
			this.invalidHeaders[colID] = true;
		}
	};
	
	
	/*****************************************************************************************************************
	 * Decision Table handlers
	 *****************************************************************************************************************/
	RuleBodyValidator.prototype.updateHeaderValidationResult = function updateHeaderValidationResult(header) {
		var currentCell = {};
	
		currentCell.expression = header.expression;
		currentCell.colID = header.colID;
		currentCell.type = header.type;
		currentCell = this.updateValidateResult(currentCell);
	
		return currentCell;
	};
	
	/**
	 * validates the condition header:
	 * 1. validates header is not boolean
	 * 2. validates there is only one condition column when it is the ruleBody is from ruleSet type
	 * @param header
	 */
	RuleBodyValidator.prototype.handleConditionHeader = function handleConditionHeader(header){
		var currentCell = {};
		var params = [];
		var errorMessage;
		var errorString;
		
		this.conditionColumnsCnt++;
		
		//validates there is only one condition column when it is the ruleBody is from ruleSet type
		if(this.ruleType === ruleBodyConstants.RULE_SET &&
		   this.conditionColumnsCnt > 1){                                                         
			
			errorMessage = "rule_body_validator_one_condition_column_allowed";
			errorString = ResponseCollector.getInstance().getMessage(errorMessage, params);
			this.handleMessages(null, undefined, errorMessage, params);
		
			this.status = ruleBodyConstants.RULE_ERROR;
		
			if (this.flags[ruleBodyConstants.outputFlagsEnum.validationOutput]) {
				currentCell.expression = header.expression;
				currentCell.colID = header.colID;
				currentCell.type = header.type;
				currentCell.status = ruleBodyConstants.RULE_ERROR;
				currentCell.errorDetails = errorString;
			
				this.ruleBody.content.headers.push(currentCell);
			}
		
			this.invalidHeaders[header.colID] = true;
			
		}
		else //validates header is not boolean
		{ 
			this.currentParserResult = this.getParserAST(header.expression, RelConstants.VALIDATE_MODE, null, RelConstants.TYPE_SINGLE_EXPRESSION, this.flags);
	
			if (header.expression !== null &&
				header.expression !== undefined &&
				header.expression !== "") {
	
				currentCell = this.updateHeaderValidationResult(header);
	
				//update validation result + unknown tokens map in case of error
				if (currentCell !== null) {

					this.handleMessages4OdataFormatOutput(this.currentParserResult, ruleBodyConstants.additionalInfoTypeEnum.column, header.colID, null, null, null, null);
					
					this.status = ruleBodyConstants.RULE_ERROR;
					if (!this.ruleBody.content.hasOwnProperty("headers")) {
						this.ruleBody.content.headers = [];
					}
					if (this.flags[ruleBodyConstants.outputFlagsEnum.validationOutput]) {   
						this.ruleBody.content.headers.push(currentCell);
					}
					this.invalidHeaders[header.colID] = true;
	
					if (this.flags[ruleBodyConstants.outputFlagsEnum.unknownTokensOutput]) { 
						this.updateUnknownTokensFromParser();
					}
				}
	
				//update dependencies in case of success
				if (this.flags[ruleBodyConstants.outputFlagsEnum.dependenciesOutput]) {
					this.updateDependnciesFromParser();    
				}
				
				//update root object + keys in case of success
				if (this.flags[ruleBodyConstants.outputFlagsEnum.rootObjectContextOutput]) {
					this.updateRootObjectContextFromParser();    
				}
			}
		}
	};
	
	/**
	 * Validating decision table headers
	 * @param headers
	 * @returns
	 */
	RuleBodyValidator.prototype.validateHeader = function validateHeader(header) {
	
		jQuery.sap.log.debug("validate header");
	
		if (header.hasOwnProperty(ruleBodyConstants.RULE_CELL_TYPE)) {
	
			this.invalidHeaders[header.colID] = false;
	
			if (header.type === ruleBodyConstants.CONDITION &&
				header.hasOwnProperty(ruleBodyConstants.RULE_DT_EXPRESSION)) {
	
				this.handleConditionHeader(header);
			} 
			else if (header.type === ruleBodyConstants.PARAM) { //action parameter
	
				this.handleActionParameterForDecisionTable(header.actionReference, header.name, header.colID);
			} 
			else if (header.type === ruleBodyConstants.OUTPUT_PARAM) { //output parameter
	
				this.handleOutputParameterHeader(header.name, header.type, header.colID);
			}
		}
	};
	
	
	/**
	 * row init for results
	 * @param rowIndex
	 * @returns
	 */
	RuleBodyValidator.prototype.initRow = function initRow(rowIndex) {
		var currentRow = {};
	
		currentRow.rowID = rowIndex;
		currentRow.row = []; //array of columns
	
		return currentRow;
	};
	
	/**
	 * validate headers
	 * @param rule
	 * @returns
	 */
	RuleBodyValidator.prototype.handleHeaders = function handleHeaders(rule) {
		/*eslint consistent-this: ["error", "current"]*/
		//Validating headers
		var current = this;
		this.conditionColumnsCnt = 0;
		
		this.traverseDecisionTableHeaders(rule, function(header) {
			current.validateHeader(header);
		});
	
		//headers map (by colID)
		var headersMap = this.buildHeadersMap(rule);
	
		return headersMap;
	};
	
	/**
	 * validating condition
	 * @param header
	 * @param currentRow
	 * @param colIndex
	 * @param rowResult
	 * @returns
	 */
	RuleBodyValidator.prototype.handleDecisionTableCondition = function handleDecisionTableCondition(header, currentRow, colIndex, rowResult) {
		var result = rowResult;
		var expression = null;
	
		ruleBodyBase.RuleBody.prototype.handleDecisionTableCondition.call(this, header, currentRow, colIndex, rowResult);
		
		if (header !== null && header.hasOwnProperty(ruleBodyConstants.RULE_DT_EXPRESSION) &&
			currentRow.row[colIndex].hasOwnProperty(ruleBodyConstants.RULE_CONTENT)) {
	
			if (this.flags[ruleBodyConstants.outputFlagsEnum.unknownTokensOutput] || this.invalidHeaders[header.colID] !== true) {
	
				expression = this.concatToDecisionTableCondition(header.expression, currentRow.row[colIndex].content);
				this.currentParserResult = this.getParserAST(expression, RelConstants.VALIDATE_MODE, null, RelConstants.TYPE_BOOLEAN_ENHANCED, this.flags);
	
				var currentCell = {};
				currentCell.expression = expression;
				currentCell.colID = currentRow.row[colIndex].colID;
				currentCell.content = currentRow.row[colIndex].content; //ADDED
				currentCell = this.updateValidateResult(currentCell);
	
				if (currentCell !== null) {
					this.status = ruleBodyConstants.RULE_ERROR;
					
					this.handleMessages4OdataFormatOutput(this.currentParserResult, ruleBodyConstants.additionalInfoTypeEnum.cell, header.colID, currentRow.rowID, null, null, null);
				
					if (this.flags[ruleBodyConstants.outputFlagsEnum.validationOutput]) {
						if (result === null) {
							result = this.initRow(currentRow.rowID);
						}
						result.row.push(currentCell);
					}
	
					if (this.flags[ruleBodyConstants.outputFlagsEnum.unknownTokensOutput]) {
						this.updateUnknownTokensFromParser();
	
						if (this.invalidHeaders[header.colID] !== true) {
							this.headersOfInvalidCells[header.colID] = header;
						}
					}
				}
				
				if (this.flags[ruleBodyConstants.outputFlagsEnum.dependenciesOutput]) {
					this.updateDependnciesFromParser();
				}
				
				//update root object + keys in case of success
				if (this.flags[ruleBodyConstants.outputFlagsEnum.rootObjectContextOutput]) {
					this.updateRootObjectContextFromParser();    
				}
			}
		}
	
		return result;
	};
	
	RuleBodyValidator.prototype.getActionParamBusinessDataArray = function getActionParamBusinessDataArray(position) {
	
		var actionObj = null;
		var paramObj = null;
		var paramName = null;
		var actionName = null;
		var businessDtArray = [];
	
		for (actionName in this.actionsMap) {
	
			if (this.actionsMap.hasOwnProperty(actionName)) {
	
				actionObj = this.actionsMap[actionName];
	
				for (paramName in actionObj.paramMap) {
	
					if (actionObj.paramMap.hasOwnProperty(paramName)) {
	
						paramObj = actionObj.paramMap[paramName];
	
						if (paramObj.colID !== null && paramObj.colID === position.colID) {
	
							businessDtArray.push(paramObj.bdType);
						}
					}
				}
			}
		}
	
		return businessDtArray;
	};
	
	
	/**
	 * Validating action parameter
	 * @param header
	 * @param currentRow
	 * @param colIndex
	 * @param rowResult
	 * @returns
	 */
	RuleBodyValidator.prototype.handleDecisionTableActionParameter = function handleDecisionTableActionParameter(header, currentRow, colIndex, rowResult) {
		var result;
		
		var businessDtArray = this.getActionParamBusinessDataArray({
			"colID": currentRow.row[colIndex].colID
		});
	
		result = this.validateParameter(header, currentRow, colIndex, rowResult, businessDtArray, this.flags);
		if(result.hasOwnProperty(ruleBodyConstants.ROW_RESULT)){
			return result[ruleBodyConstants.ROW_RESULT];
		}
	};
	
	/**
	 * Validating output parameter
	 * @param header
	 * @param currentRow
	 * @param colIndex
	 * @param rowResult
	 * @returns
	 */
	RuleBodyValidator.prototype.handleDecisionTableOutputParameter = function handleDecisionTableOutputParameter(header, currentRow, colIndex, rowResult) {
		//var errorString = null;
		var paramName = header.name;
		var suppliedType = null;
		var result = rowResult;
		var currentCell = {};
		var flags;
		var businessDataType;
		var errorString;
		
		ruleBodyBase.RuleBody.prototype.handleDecisionTableOutputParameter.call(this, header, currentRow, colIndex, rowResult);
		
		//Check if data type was supplied
		if (currentRow.row[colIndex].hasOwnProperty(ruleBodyConstants.RULE_PARAM_BUSINESS_DATA_TYPE)) { //if business data type was sent
			suppliedType = currentRow.row[colIndex][ruleBodyConstants.RULE_PARAM_BUSINESS_DATA_TYPE];
		} 
		else if (header.hasOwnProperty(ruleBodyConstants.RULE_PARAM_BUSINESS_DATA_TYPE)) { //if business data type was sent
			suppliedType = header[ruleBodyConstants.RULE_PARAM_BUSINESS_DATA_TYPE];
		}
		
		businessDataType = this.getOutputParamBusinessDataType(paramName, suppliedType);
		
		if (businessDataType === null) { //No business data type is available for this parameter	
			currentCell = {};
			currentCell.colID = header.colID;
			this.status = ruleBodyConstants.RULE_ERROR;
	
			if (this.flags[ruleBodyConstants.outputFlagsEnum.validationOutput]) {
				if (rowResult === null) {
					rowResult = this.initRow(currentRow.rowID);
				}
				rowResult.row.push(currentCell);
			}
		}
	
		flags = this.updateParserIsCollectionFlag(header.name);
		
		result = this.validateParameter(header, currentRow, colIndex, rowResult, [businessDataType], flags);
		
		if(result.hasOwnProperty(ruleBodyConstants.ROW_RESULT)){
			rowResult = result[ruleBodyConstants.ROW_RESULT];
		}
		
		//validations related to collection output parametrs
		if(result.hasOwnProperty(ruleBodyConstants.PARSER_RESULT) && 
		   this.isParserReturnedErrorMessage(result[ruleBodyConstants.PARSER_RESULT]) === false){
			
			var parserResult = result[ruleBodyConstants.PARSER_RESULT];
			errorString = this.valiadteCollectionInfoOnOutputParameter(parserResult, paramName, undefined);	
			
			if(errorString !== null && this.flags[ruleBodyConstants.outputFlagsEnum.validationOutput]) {
				//adding validation result
				currentCell = {};
				currentCell.colID = header.colID;
				currentCell.status = ruleBodyConstants.RULE_ERROR;
				currentCell.errorDetails = errorString;
				currentCell.expression = currentRow.row[colIndex].content;
				currentCell.content = currentRow.row[colIndex].content; 
				this.status = ruleBodyConstants.RULE_ERROR;
		
				if (rowResult === null) {
					rowResult = this.initRow(currentRow.rowID);
				}
				rowResult.row.push(currentCell);
			}
		}
		
		return rowResult;
	};
	
	/**
	 * Validating action
	 */
	RuleBodyValidator.prototype.handleDecisionTableAction = function handleDecisionTableAction(header, currentRow, colIndex, rowResult) {
		var depMap = {};
	
		var actionName = currentRow.row[colIndex].content;
	
		//Team 1 sometimes send "" instead of NULL - they should fix it (talk to Adi)
		if (actionName === undefined || actionName === null || actionName === "") {
	
			return rowResult;
		}
	
		var isActionExists = this.isActionExists(actionName);
	
		if (isActionExists === false) {
	
			var params = [actionName];
			var errorString = ResponseCollector.getInstance().getMessage("rule_body_validator_action_not_exists", params);
			this.handleMessages(null, undefined, "rule_body_validator_action_not_exists", params);
	
			//add error of action doesn't exists
			var currentCell = {};
	
			currentCell.colID = header.colID;
			currentCell.status = ruleBodyConstants.RULE_ERROR;
			currentCell.errorDetails = errorString;
			this.status = ruleBodyConstants.RULE_ERROR;
	
			if (rowResult === null) {
	
				rowResult = this.initRow(currentRow.rowID);
			}
	
			rowResult.row.push(currentCell);
		}
	
		//build action dependency object
		if (this.flags[ruleBodyConstants.outputFlagsEnum.dependenciesOutput] &&
			this.status === ruleBodyConstants.RULE_SUCCESS) {
	
			if (currentRow.row[colIndex].hasOwnProperty(ruleBodyConstants.RULE_CONTENT)) {
	
				var vocabulary = null;
	
				if (this.actionsMap.hasOwnProperty(actionName) === true) {
	
					vocabulary = this.actionsMap[actionName].vocabulary;
				}
	
				var dependencyKey = vocConstants.PROPERTY_NAME_ACTIONS.concat("." + actionName);
				depMap[dependencyKey] = new dependenciesObjectsLib.VocaAction(actionName, vocabulary);
			}
	
			//add the dependency to the dependencies handler
			this.depHandler.addDependencies(depMap);
		}
	
		return rowResult;
	};
	
	/**
	 * Init the decision table traversal result
	 */
	RuleBodyValidator.prototype.initResult = function initResult() {
	
		//initiating the output parametrs per row
		this.rowOutputParamsCnt = 0;
	
		if ((this.ruleType === ruleBodyConstants.DECISION_TABLE || this.ruleType === ruleBodyConstants.RULE_SET) &&
			this.flags[ruleBodyConstants.outputFlagsEnum.validationOutput]) {
			this.ruleBody.content.rows = [];
			this.ruleBody.content.headers = [];
		}
	};
	
	/**
	 * Init row result
	 * @returns
	 */
	RuleBodyValidator.prototype.initRowResult = function initRowResult(rule, rowIndex) {
		return null;
	};
	
	/**
	 * add the row
	 * @param rowResult
	 */
	RuleBodyValidator.prototype.addRowResult = function addRowResult(rowResult) {
	
		if (this.ruleType === ruleBodyConstants.DECISION_TABLE || this.ruleType === ruleBodyConstants.RULE_SET) {
	
			//Adding cell result to the current row 
			if (this.flags[ruleBodyConstants.outputFlagsEnum.validationOutput] &&
				rowResult !== null) {
	
				this.ruleBody.content.rows.push(rowResult);
			}
		}
	};
	
	/**
	 * Validate action/output param
	 * @param header
	 * @param currentRow
	 * @param colIndex
	 * @param rowResult
	 * @returns
	 */
	RuleBodyValidator.prototype.validateParameter = function validateParameter(header, currentRow, colIndex, rowResult, businessDtArray, flags) {
		var result = {};
		var params = null;
		var errorMessage = "";
		var errorString = "";
		
		result.rowResult = rowResult;
		result.parserResult = null;
		
		if (currentRow.row[colIndex].hasOwnProperty(ruleBodyConstants.RULE_CONTENT)) {
	
			var index;
			var currentCell;
	
			if (businessDtArray !== null && businessDtArray !== undefined) {
	
				for (index = 0; index < businessDtArray.length; index++) {
	
					//header.businessDataType = businessDtArray [index];
					
					this.currentParserResult = this.getParserAST(currentRow.row[colIndex].content, RelConstants.VALIDATE_MODE, null, businessDtArray[index], flags);
					result.parserResult = this.currentParserResult;
					
					currentCell = {};
					currentCell.expression = currentRow.row[colIndex].content;
					currentCell.colID = header.colID;
					currentCell.content = currentRow.row[colIndex].content; //ADDED
					currentCell = this.updateValidateResult(currentCell);
	
					//Alias mode
					if (this.flags[ruleBodyConstants.outputFlagsEnum.isAlias]) {
	
						if ((!header.hasOwnProperty(ruleBodyConstants.RULE_PARAM_BUSINESS_DATA_TYPE) ||
								header.businessDataType === RelConstants.TYPE_ALL) &&
								this.currentParserResult.hasOwnProperty('actualReturnType')) {
	
							//header.businessDataType = this.currentParserResult.actualReturnType;
	
							if (currentCell === null) { //parser success
								if (this.aliasOutputBusinessDataType === null) {
									this.aliasOutputBusinessDataType = this.currentParserResult.actualReturnType;
								}
							} else { //parser failure
								if (this.aliasOutputBusinessDataType !== null &&
									this.aliasOutputBusinessDataType !== this.currentParserResult.actualReturnType) {
	
									params = [header.name];
									errorMessage = "rule_body_validator_alias_output_params_should_have_same_type";
									errorString = ResponseCollector.getInstance().getMessage(errorMessage, params);
									this.handleMessages(null, undefined, errorMessage, params);
	
									currentCell = {};
									currentCell.expression = currentRow.row[colIndex].content;
									currentCell.colID = header.colID;
									currentCell.content = currentRow.row[colIndex].content;
									currentCell.errorDetails = errorString;
								}
							}
						} 
						else {
							this.aliasOutputBusinessDataType = header.businessDataType;
						}
					} 
					else {
						header.businessDataType = businessDtArray[index];
					}
	
					if (currentCell !== null) {
	
						this.status = ruleBodyConstants.RULE_ERROR;
	
						// Adding validations on output paramters types
						this.handleMessages4OdataFormatOutput(this.currentParserResult, ruleBodyConstants.additionalInfoTypeEnum.cell, currentCell.colID, currentRow.rowID, null, null, null);
						
						if (this.flags[ruleBodyConstants.outputFlagsEnum.validationOutput]) {
							if (result.rowResult === null) {
								result.rowResult = this.initRow(currentRow.rowID);
							}
							result.rowResult.row.push(currentCell);
						}
	
						if (this.flags[ruleBodyConstants.outputFlagsEnum.unknownTokensOutput]) {
							this.updateUnknownTokensFromParser();
	
							if (this.invalidHeaders[header.colID] !== true) {
								this.headersOfInvalidCells[header.colID] = header;
							}
						}
					}
	
					if (this.flags[ruleBodyConstants.outputFlagsEnum.dependenciesOutput]) {
						this.updateDependnciesFromParser();
					}
					
					//update root object + keys in case of success
					if (this.flags[ruleBodyConstants.outputFlagsEnum.rootObjectContextOutput]) {
						this.updateRootObjectContextFromParser();    
					}
				}
			}
		}
	
		return result;
	};
	
	/**
	 * Init the path prefix of the explicit output and the ruleBody
	 * @param pathPrefixMap
	 */
	RuleBodyValidator.prototype.initPathPrefix = function initPathPrefix(pathPrefixMap) {
	
		if (pathPrefixMap !== null && pathPrefixMap !== undefined) {
			if (pathPrefixMap.hasOwnProperty(ruleBodyConstants.RULE_BODY)) {
				this.ruleBodyPathPrefix = pathPrefixMap[ruleBodyConstants.pathPrefixKeysEnum.ruleBody];
			} else {
				this.ruleBodyPathPrefix = utilConstantsLib.JSON_PATH_ROOT;
			}
	
			if (pathPrefixMap.hasOwnProperty(ruleBodyConstants.EXPLICIT_OUTPUT)) {
				this.outputPathPrefix = pathPrefixMap[ruleBodyConstants.pathPrefixKeysEnum.explicitOutput];
			} else {
				this.outputPathPrefix = utilConstantsLib.JSON_PATH_ROOT;
			}
		} else {
			this.ruleBodyPathPrefix = utilConstantsLib.JSON_PATH_ROOT;
			this.outputPathPrefix = utilConstantsLib.JSON_PATH_ROOT;
		}
	};
	
	/**
	 * Init outputs flags - validationOutput + dependenciesOutput for now
	 */
	RuleBodyValidator.prototype.initFlags = function initFlags(flags) {
	
		if (flags !== null && flags !== undefined) {
	
			//init odataFormatPayload flags
			if (flags.hasOwnProperty(ruleBodyConstants.ODATA_FORMAT_PAYLOAD)) {
				this.flags[ruleBodyConstants.ODATA_FORMAT_PAYLOAD] = flags[ruleBodyConstants.ODATA_FORMAT_PAYLOAD];
			}
			
			//init validation flag
			if (flags.hasOwnProperty(ruleBodyConstants.outputFlagsEnum.validationOutput)) {
				this.flags[ruleBodyConstants.outputFlagsEnum.validationOutput] = flags[ruleBodyConstants.outputFlagsEnum.validationOutput];
			}
	
			//init unknownTokens flag
			if (flags[ruleBodyConstants.outputFlagsEnum.unknownTokensOutput]) {
				this.flags[ruleBodyConstants.outputFlagsEnum.unknownTokensOutput] = flags[ruleBodyConstants.outputFlagsEnum.unknownTokensOutput];
			}
	
			//init isAlias flag
			if (flags[ruleBodyConstants.outputFlagsEnum.isAlias]) {
				this.flags[ruleBodyConstants.outputFlagsEnum.isAlias] = flags[ruleBodyConstants.outputFlagsEnum.isAlias];
			}
	
			//init dependencies handler
			if (flags.hasOwnProperty(ruleBodyConstants.outputFlagsEnum.dependenciesOutput)) {
	
				this.flags[ruleBodyConstants.outputFlagsEnum.dependenciesOutput] = flags[ruleBodyConstants.outputFlagsEnum.dependenciesOutput];
				this.dependenciesByFlags = flags[ruleBodyConstants.outputFlagsEnum.dependenciesOutput]; 
			}
			
			
			//init rootObjectContext flag
			if (flags.hasOwnProperty(ruleBodyConstants.outputFlagsEnum.rootObjectContextOutput)) {
	
				if (flags.hasOwnProperty(ruleBodyConstants.outputFlagsEnum.rootObjectContextOutput)) {
					this.flags[ruleBodyConstants.outputFlagsEnum.rootObjectContextOutput] = flags[ruleBodyConstants.outputFlagsEnum.rootObjectContextOutput];
				}
			}
 			if (this.vocaRulesRootObjectMap && this.flags[ruleBodyConstants.outputFlagsEnum.rootObjectContextOutput] === true) {
 				this.flags[ruleBodyConstants.outputFlagsEnum.dependenciesOutput] = true;
  			}
 			
 			if (this.flags[ruleBodyConstants.outputFlagsEnum.dependenciesOutput] ) {
 				this.depHandler = new dependenciesHandlerLib.DependeciesHandler();
 			}
 			
		}
	};
	
	/******************************************************************************************************************************
	 * Set output info
	 ******************************************************************************************************************************/

	RuleBodyValidator.prototype.validateOutput = function validateOutput(output, vocabulary) {
		var errorID, explicitOutput;
		
		if (output === null) {
			return output;
		}
	
		explicitOutput = this.vocabularyDataProvider.getOutput(vocabulary, output, null);
		if (explicitOutput === null) {
			explicitOutput = this.vocabularyDataProvider.getVocaRuleOutput(vocabulary, output, null);
		}
	
		if (explicitOutput === null) {
			var params = [output];
			errorID = "rule_body_validator_output_not_exists";
			this.handleMessages4OdataFormatOutput(null, ruleBodyConstants.additionalInfoTypeEnum.ruleResult, null, null, errorID, params, this.outputPathPrefix);
			this.status = ruleBodyConstants.RULE_ERROR;
		}
	
		return explicitOutput;
	};
	
	/**
	 * getIsCollection - returns if the output is of type collection (knowing by the hitPolicy)
	 * @param ruleBody
	 */
	RuleBodyValidator.prototype.getIsCollection = function getIsCollection() {
		var isCollection = true;
	
		//When hitPolicy does not exist the default hit policy is allMatch and the isCollection should be true
		if (this.hasOwnProperty(ruleBodyConstants.HIT_POLICY_PROPERTY)) {
	
			if (this.hitPolicy === ruleBodyConstants.FIRST_MATCH) {
				isCollection = false;
			} else if (this.hitPolicy === ruleBodyConstants.ALL_MATCH) {
				isCollection = true;
			}
		}
	
		return isCollection;
	};
	
	/**
	 * Getting the result of root object context: {"name": "<name>", "keys": []} 
	 */
	RuleBodyValidator.prototype.getRootObjectContext = function getRootObjectContext(){
		var rootObjectContext = {};
		
		rootObjectContext.keys = [];
		rootObjectContext.name = this.rootObjectContext.name;
		
		Object.keys(this.rootObjectContext.keysMap).forEach(function(key) {
			rootObjectContext.keys.push(key);
	    });
		
		return rootObjectContext;
	};
	
	/**
	 *
	 */
	RuleBodyValidator.prototype.updateInvalidRuleBodyHeaders = function updateInvalidRuleBodyHeaders() {
		//var length = this.headersOfInvalidCells.length;
		var key = null;
	
		if (!this.invalidRuleBody.content.hasOwnProperty('headers') /*&& length > 0*/ ) {
			this.invalidRuleBody.content.headers = [];
		}
	
		for (key in this.headersOfInvalidCells) {
			if (this.headersOfInvalidCells.hasOwnProperty(key)) {
				this.invalidRuleBody.content.headers.push(this.headersOfInvalidCells[key]);
			}
		}
	};
	
	RuleBodyValidator.prototype.deactivateParserMessages = function deactivateParserMessages(ruleBody) {
		if ((ruleBody.hasOwnProperty(ruleBodyConstants.RULE_BODY_TYPE) && ruleBody[ruleBodyConstants.RULE_BODY_TYPE] === ruleBodyConstants.SINGLE_TEXT) || this.flags[ruleBodyConstants.ODATA_FORMAT_PAYLOAD]) {
			this.flags[RelConstants.propertiesEnum.raiseError] = false;
		}
	};

	/******************************************************************************************************************************
	 * Methods for external use
	 ******************************************************************************************************************************/
	/**
	 * re-validates the expressions part of the business rule
	 * @returns result object with error/success, according result object properties
	 */
	RuleBodyValidator.prototype.reValidateBusinessRule = function reValidateBusinessRule(vocabulary, vocaRTServ, flags, output) {
		var result = {};
	
		this.mode = ruleBodyConstants.RULE_MODE_RE_VALIDATION;
	
		//init validation members
		this.initValidation();
		this.initFlags(flags);
	
		//call re-validation on invalid members
		if (this.flags[ruleBodyConstants.outputFlagsEnum.unknownTokensOutput] && this.invalidRuleBody !== null) {
			result = this.validateBusinessRule(this.invalidRuleBody, vocabulary, vocaRTServ, flags, output, null, null);
		}
	
		return result;
	};
	
	/**
	 * Validates the expressions part of the business rule
	 * @returns result object with error/success, according result object properties
	 */
	RuleBodyValidator.prototype.validateBusinessRule = function validateBusinessRule(ruleBody, vocabulary, vocaRTServ, flags, output, pathPrefixMap, traversalParts) {
		var result = {};
	
		jQuery.sap.log.debug("flags " + JSON.stringify(flags));
	
		// Updating the AST need 
		this.needDeserializeInput = decisionTableCellLib.needDeserializeInput(flags, ruleBody.relVersion, vocaRTServ);
		
		this.vocaRulesRootObjectMap = (flags && flags.vocaRules)?flags.vocaRules.rootObjectMap:null;
		//init output flags
		this.initPathPrefix(pathPrefixMap);
		this.initFlags(flags);
		this.aliasOutputBusinessDataType = null; //ADDED
	
		//init vocabularyDataProvider, outputInfo
		this.vocabularyDataProvider = vocaRTServ;
		this.outputInfo = this.validateOutput(output, vocabulary, result);
	
		//Initialize the actions map - each instance contain: key- action name, value - {actionInfo}
		this.actionsMap = {};
	
		this.deactivateParserMessages(ruleBody);
		this.traverse(ruleBody, vocabulary, vocaRTServ, traversalParts, this.ruleBodyPathPrefix);
		
		this.validateRootObjectContextAgainstVocaRules();
	
		this.ruleBody.type = this.ruleType;
		this.ruleBody.hitPolicy = this.hitPolicy;
	
		//Building result:
		//****************
	
		if (this.flags[ruleBodyConstants.outputFlagsEnum.unknownTokensOutput]) {
			result[ruleBodyConstants.outputPropertiesEnum.unknownTokens] = this.unknownTokens;
			this.invalidRuleBody = JSON.parse(JSON.stringify(this.ruleBody)); //copy the ruleBody validation result
			this.updateInvalidRuleBodyHeaders();
		}
	
		if (this.flags[ruleBodyConstants.outputFlagsEnum.isAlias]) {
			result.isCollection = this.getIsCollection();
			result.businessDataType = this.aliasOutputBusinessDataType;
		}
	
		//validation result
		if (this.flags[ruleBodyConstants.outputFlagsEnum.validationOutput]) {
			result.status = this.status;
			if (this.ruleType === ruleBodyConstants.DECISION_TABLE || this.ruleType === ruleBodyConstants.RULE_SET) {
				result.ruleBody = this.ruleBody;
			}
			result.output = this.output;
		} else {
			result.status = this.status;
		}
	
		// Getting dependencies result
		if (this.flags[ruleBodyConstants.outputFlagsEnum.dependenciesOutput] &&
			this.status === ruleBodyConstants.RULE_SUCCESS && this.dependenciesByFlags) {
			result.dependencies = this.depHandler.getDependencies();
			jQuery.sap.log.debug("getDependencies");
		}
	
		// Getting root object context result
		if (this.flags[ruleBodyConstants.outputFlagsEnum.rootObjectContextOutput] &&
			this.status === ruleBodyConstants.RULE_SUCCESS) {
			result[ruleBodyConstants.outputPropertiesEnum.rootObjectContext] = this.getRootObjectContext();
			jQuery.sap.log.debug("getRootObjectContext");
		}
		
		return result;
	};
	return {
		RuleBodyValidator: RuleBodyValidator
	};
}());
