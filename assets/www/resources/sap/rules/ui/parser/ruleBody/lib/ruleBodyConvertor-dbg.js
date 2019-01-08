jQuery.sap.declare("sap.rules.ui.parser.ruleBody.lib.ruleBodyConvertor");

jQuery.sap.require("sap.rules.ui.parser.ruleBody.lib.ruleBodyValidator");
jQuery.sap.require("sap.rules.ui.parser.ruleBody.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.infrastructure.util.utilsBase");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.valueHelpValidator");
jQuery.sap.require("sap.rules.ui.parser.ruleBody.lib.decisionTableCell");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.ASTConvertor");
jQuery.sap.require("sap.rules.ui.parser.AST.lib.bundleAst");


/** 
 * This class is a for rule body conversions:
 * @constructor
 */

sap.rules.ui.parser.ruleBody.lib.ruleBodyConvertor = sap.rules.ui.parser.ruleBody.lib.ruleBodyConvertor|| {}; 
sap.rules.ui.parser.ruleBody.lib.ruleBodyConvertor.lib = (function() {
	
	var ruleBodyValidatorLib = sap.rules.ui.parser.ruleBody.lib.ruleBodyValidator.lib;
	var constants = sap.rules.ui.parser.ruleBody.lib.constants.lib;
	var parserConstants = sap.rules.ui.parser.businessLanguage.lib.constants.lib;
	var utilsBaseLib = new sap.rules.ui.parser.infrastructure.util.utilsBase.lib.utilsBaseLib();
	var valueHelpValidatorLib = sap.rules.ui.parser.businessLanguage.lib.valueHelpValidator.lib;
	var decisionTableCellLib = sap.rules.ui.parser.ruleBody.lib.decisionTableCell.lib;
	var ASTConvertorLib = sap.rules.ui.parser.businessLanguage.lib.ASTConvertor.lib;
	var bundleApi = RulesAPI_Ast;
	var ASTOperationsLib = bundleApi.astOperations;

	
	function RuleBodyConvertor(oDataRule) {
	
		jQuery.sap.log.debug("CTOR - Rule Convertor");
		this.oDataRule = oDataRule;
		ruleBodyValidatorLib.RuleBodyValidator.call(this); 
		
		//this.convertedRuleBody = null;
		this.decisionTableData = oDataRule ? JSON.parse(JSON.stringify(oDataRule)): null;
		
		this.ruleValueHelpInfoArray = [];
		this.needASTResult = false;
	}
	
	RuleBodyConvertor.prototype = Object.create(ruleBodyValidatorLib.RuleBodyValidator.prototype); //Inherit rule body validator properties and functions
	RuleBodyConvertor.prototype.constructor = RuleBodyConvertor; 								   //Change the reference of the constructor
	
	
	/****************************************************************************************************************************************
	*		Helper methods
	*****************************************************************************************************************************************/
	
	/**
	 * Getting the serialized text expression and its AST
	 */
	RuleBodyConvertor.prototype.getSerializedExpressionAndAST = function getSerializedExpressionAndAST(convertedExpression, oldAST){
		var convertedAndSerializedData = {};
		
		convertedAndSerializedData.convertedData = {};
		convertedAndSerializedData.serializedData = convertedExpression;
		
		if (this.needASTResult) { // Converting to new AST and serializing the result
			var ASTConvertor = new ASTConvertorLib.ASTConvertor(oldAST);
			convertedAndSerializedData.convertedData.AST = ASTConvertor.getAST();
			convertedAndSerializedData.convertedData.text = convertedExpression;
			convertedAndSerializedData.serializedData = decisionTableCellLib.serializeExpression(convertedAndSerializedData.convertedData);
		}	
		return convertedAndSerializedData; 
	};
	
	/**
	 * 
	 */
	RuleBodyConvertor.prototype.getConvertedData = function getConvertedData(converted, convertedExpression, expressionPart){
		converted[expressionPart] = convertedExpression;
		return converted;
	};
	
	/**
	 * addDecisionTableDataInstance to the odata
	 * @param status
	 * @param actualType
	 * @param path
	 * @param converted
	 */
	RuleBodyConvertor.prototype.addParserResults = function addParserResults(path, converted, status){
		var parserResults = {};
		
		parserResults.status = status;
		if (converted){
			parserResults.converted = converted;
		}
		utilsBaseLib.setJsonValueAccordingPath(this.decisionTableData, path, constants.decisionTableDataOutputPropEnum.parserResults, parserResults); 
	};
	
	/**
	 * Return true if the parser did the conversion
	 */
	RuleBodyConvertor.prototype.hasParserConvertedExpression = function hasParserConvertedExpression(){
		
		if (this.currentParserResult.status === parserConstants.statusEnum.SUCCESS){
			
		   if (!this.currentParserResult.hasOwnProperty(constants.parserResultEnum.convertedExpression)){
			   if (!this.flags[constants.outputFlagsEnum.ASTOutput]){
				   this.status = constants.RULE_ERROR;
			   }
		   } else {
			   return true;
		   }
		}
		
		return false;
	};
	
	/**
	 * gets the converted expression returned from the parser
	 */
	RuleBodyConvertor.prototype.getParserConvertedExpression = function getParserConvertedExpression(){
		
		return this.currentParserResult[constants.parserResultEnum.convertedExpression];
	};
	
	// This method merges Value Helps values
	function mergeValueHelpValues (cellArray, ruleArray)
	{
		var i = 0;
		var j = 0;
		var alreadyExists = false;
		for (i = 0; i < cellArray.length; ++i)
		{
			alreadyExists = false;
			for (j = 0; j < ruleArray.length; ++j)
			{
				if (cellArray[i] === ruleArray[j])
				{
					alreadyExists = true;
					break;
				}
			} // End of For (ruleArray)
			if (alreadyExists === false)
			{
				ruleArray.push (cellArray[i]);
			}
		} // End of For (cellArray)
	}
	
	// This method merges cell Value Helps 
	function mergeValueHelp (expressionValueHelpInfoArray, ruleValueHelpInfoArray)
	{
		var i = 0;
		var indexInInfo = -1;
		for (i = 0; i < expressionValueHelpInfoArray.length; ++i)
		{
			// Search in Rule Value Help Info Array
			indexInInfo = 
				valueHelpValidatorLib.getValueHelpIndexInInfoArray (expressionValueHelpInfoArray[i][parserConstants.propertiesEnum.id],
																	ruleValueHelpInfoArray);
			if (indexInInfo === -1)
			{ // No such element - add it
				ruleValueHelpInfoArray.push (expressionValueHelpInfoArray[i]);
			}
			else
			{ // Such element already exists - add the values to it 
				mergeValueHelpValues (expressionValueHelpInfoArray[i][parserConstants.propertiesEnum.values],
									  ruleValueHelpInfoArray[indexInInfo][parserConstants.propertiesEnum.values]	
				);
			} // End of Else
		} // End of For (expressionValueHelpInfoArray)
	}
	
	/****************************************************************************************************************************************
	*		Overriden Text Handles
	*****************************************************************************************************************************************/
	
	/**
	 * handles Text Condition
	 */
	RuleBodyConvertor.prototype.handleTextCondition = function handleTextCondition(condition, result, pathPrefix) {
		
		ruleBodyValidatorLib.RuleBodyValidator.prototype.handleTextCondition.call(this, condition, result, pathPrefix);
		
		if (this.status === constants.RULE_SUCCESS && this.hasParserConvertedExpression()){
		
			//The conversion here need to be done using the ruleBody itself,
			//in order to copy by reference and not by value
			//this.convertedRuleBody.content.condition = this.getParserConvertedExpression();
			this.ruleBodyCopy.content.condition = this.getParserConvertedExpression();
		}
	};
	
	
	/**
	 * handles Text Output Parameter
	 * @param currentOutput
	 */
	RuleBodyConvertor.prototype.handleTextOutputParameter = function handleTextOutputParameter(currentOutput, result, pathPrefix) {
		//var i;
		
		ruleBodyValidatorLib.RuleBodyValidator.prototype.handleTextOutputParameter.call(this, currentOutput, result, pathPrefix);
		
		if (this.status === constants.RULE_SUCCESS && this.hasParserConvertedExpression()){
			currentOutput.content = this.getParserConvertedExpression();
			/*for (i=0; i< this.convertedRuleBody.content.outputs.length; i++) {
				if (this.convertedRuleBody.content.outputs[i].name === currentOutput.name) {
					this.convertedRuleBody.content.outputs[i].content = currentOutput.content;
				}
			}*/
		}
	};
	
	
	/**
	 * handles Text Action Parameter
	 * @param currentParam
	 */
	RuleBodyConvertor.prototype.handleTextActionParameter = function handleTextActionParameter(currentParam, result, index, pathPrefix) {
		//var i;
		
		ruleBodyValidatorLib.RuleBodyValidator.prototype.handleTextActionParameter.call(this, currentParam, result, index, pathPrefix);
		
		if (this.status === constants.RULE_SUCCESS && this.hasParserConvertedExpression()){
			currentParam.content = this.getParserConvertedExpression();
			/*for (i=0; i< this.convertedRuleBody.content.outputs.length; i++) {
				if (this.convertedRuleBody.content.parameters[i].name === currentParam.name) {
					this.convertedRuleBody.content.parameters[i].content = currentParam.content;
				}
			}*/
		}
	};
	
	/****************************************************************************************************************************************
	*		Overriden DT Handles
	*****************************************************************************************************************************************/
	/**
	 * handles condition
	 * @param header
	 * @param currentRow
	 * @param colIndex
	 * @param rowResult
	 * @returns
	 */
	RuleBodyConvertor.prototype.handleDecisionTableCondition = function handleDecisionTableCondition(header, currentRow, colIndex, rowResult) {
		var convertedCondition, convertedCellExpression;
		var converted = {};
		var convertedAndAST = {};
		
		rowResult = ruleBodyValidatorLib.RuleBodyValidator.prototype.handleDecisionTableCondition.call(this, header, currentRow, colIndex, rowResult);
		
		if (this.hasParserConvertedExpression() && this.invalidHeaders[header.colID] !== true){
			
			convertedCondition = this.getParserConvertedExpression();
	
			//split the cell from the converted condition that includes header + cell
			var operator = header.hasOwnProperty(constants.afterConversionParts.fixedOperator)? header.fixedOperator.operator : null;
			convertedCellExpression = this.splitDecisionTableCondition(header.convertedExpression, convertedCondition, operator);
	
			if (this.flags[constants.outputFlagsEnum.oDataOutput]){
				if(this.needASTResult){
					var ASTConvertor = new ASTConvertorLib.ASTConvertor(this.currentParserResult.model);
					var conditionAST = ASTConvertor.getAST();
					if(header.AST){
						var ASTParts = ASTOperationsLib.split(header.AST, conditionAST, ASTConvertorLib.ASTConvertor.operatorsMap[operator]);
						convertedAndAST.AST = ASTParts ? ASTParts.rest : null;
					}
					else{
						convertedAndAST.AST = conditionAST; 
					}
					convertedAndAST.text = convertedCellExpression;
					convertedCellExpression = decisionTableCellLib.serializeExpression(convertedAndAST);
				}
				converted = this.getConvertedData(converted, convertedCellExpression, constants.decisionTableExpressionParts.content);
				this.addParserResults(currentRow.row[colIndex].inputModelPath, converted, this.currentParserResult.status);
			} else if (this.status === constants.RULE_SUCCESS){
					//overwrite the header expression 
					header.expression = header.convertedExpression;
					currentRow.row[colIndex].content = convertedCellExpression;
			}
		} else if (this.flags[constants.outputFlagsEnum.oDataOutput]){ 
			this.addParserResults(currentRow.row[colIndex].inputModelPath, null, parserConstants.statusEnum.ERROR);
		}
		//if ASTOutput flag is true and the validation succeeded, add the AST to the parserResults 
		if (this.flags[constants.outputFlagsEnum.ASTOutput] && this.currentParserResult.status === parserConstants.statusEnum.SUCCESS){
			converted = this.getConvertedData(converted, this.currentParserResult.model, constants.decisionTableExpressionParts.astOutput);
			this.addParserResults(currentRow.row[colIndex].inputModelPath, converted, this.currentParserResult.status);
		}
		
		// Collect Value Help 
		if (this.flags[parserConstants.propertiesEnum.valueHelp] &&
			this.flags[parserConstants.propertiesEnum.valueHelp].hasOwnProperty (parserConstants.propertiesEnum.collectInfo) &&
			(this.flags[parserConstants.propertiesEnum.valueHelp][parserConstants.propertiesEnum.collectInfo] === true) &&
			(this.currentParserResult.status === parserConstants.statusEnum.SUCCESS) &&
			this.currentParserResult[parserConstants.propertiesEnum.valueHelp])
		{
			mergeValueHelp (this.currentParserResult[parserConstants.propertiesEnum.valueHelp][parserConstants.propertiesEnum.info],
							this.ruleValueHelpInfoArray);
		}
		
		return rowResult;
	};
	
	/**
	 * handles action parameter
	 * @param header
	 * @param currentRow
	 * @param colIndex
	 * @param rowResult
	 * @returns
	 */
	RuleBodyConvertor.prototype.handleDecisionTableActionParameter = function handleDecisionTableActionParameter(header, currentRow, colIndex, rowResult) {
		
		rowResult = ruleBodyValidatorLib.RuleBodyValidator.prototype.handleDecisionTableActionParameter.call(this, header, currentRow, colIndex, rowResult);
		
		if (this.status === constants.RULE_SUCCESS && this.hasParserConvertedExpression()){
			currentRow.row[colIndex].content = this.getParserConvertedExpression();
		}
		
		return rowResult;
	};
	
	/**
	 * handles output parameter
	 * @param header
	 * @param currentRow
	 * @param colIndex
	 * @param rowResult
	 * @returns
	 */
	RuleBodyConvertor.prototype.handleDecisionTableOutputParameter = function handleDecisionTableOutputParameter(header, currentRow, colIndex, rowResult) {
		var converted = {};
		var convertedExpression;
		var convertedAndSerialized;

		rowResult = ruleBodyValidatorLib.RuleBodyValidator.prototype.handleDecisionTableOutputParameter.call(this, header, currentRow, colIndex, rowResult);
		
		if (this.hasParserConvertedExpression() && this.invalidHeaders[header.colID] !== true){
			convertedExpression = this.getParserConvertedExpression();

			if( this.flags[constants.outputFlagsEnum.oDataOutput]){ 
				convertedAndSerialized = this.getSerializedExpressionAndAST(convertedExpression, this.currentParserResult.model);
				convertedExpression = convertedAndSerialized.serializedData;
				converted = this.getConvertedData(converted, convertedExpression, constants.decisionTableExpressionParts.content);
				this.addParserResults(currentRow.row[colIndex].inputModelPath, converted, this.currentParserResult.status);
			}
			else if (this.status === constants.RULE_SUCCESS){
				currentRow.row[colIndex].content = convertedExpression;
			}
		} else if (this.flags[constants.outputFlagsEnum.oDataOutput]){ 
			this.addParserResults(currentRow.row[colIndex].inputModelPath, null, parserConstants.statusEnum.ERROR);
		}
		//if ASTOutput flag is true and the validation succeeded, add the AST to the parserResults
		if (this.flags[constants.outputFlagsEnum.ASTOutput] && this.currentParserResult.status === parserConstants.statusEnum.SUCCESS){
			converted = this.getConvertedData(converted, this.currentParserResult.model, constants.decisionTableExpressionParts.astOutput);
			this.addParserResults(currentRow.row[colIndex].inputModelPath, converted, this.currentParserResult.status);
		}
		
		
		return rowResult;
	};
	
	/**
	 * handles condition header
	 */
	RuleBodyConvertor.prototype.handleConditionHeader = function handleConditionHeader(header){
		var converted = {};
		var convertedExpression;
		var operatorData = {};
		
		ruleBodyValidatorLib.RuleBodyValidator.prototype.handleConditionHeader.call(this, header);
		
		if (this.hasParserConvertedExpression()){
			convertedExpression = this.getParserConvertedExpression();
			
			if (this.flags[constants.outputFlagsEnum.oDataOutput]){ 
				//handles the header condition part
				header.convertedExpression = convertedExpression;
				var convertedAndSerialized = this.getSerializedExpressionAndAST(convertedExpression, this.currentParserResult.model);
				convertedExpression = convertedAndSerialized.serializedData;
				converted = this.getConvertedData(converted, convertedExpression, constants.decisionTableExpressionParts.expression);
				if(this.needASTResult){
					header.AST = convertedAndSerialized.convertedData.AST;
				}
				
				//handles the fixed operator part
				if(header.hasOwnProperty(constants.afterConversionParts.fixedOperator)){
					if(this.needASTResult){
						operatorData.text = header.fixedOperator.operator;
						operatorData.AST = header.fixedOperator.operator? ASTOperationsLib.buildOperator(ASTConvertorLib.ASTConvertor.operatorsMap[operatorData.text]): null;
						convertedExpression = decisionTableCellLib.serializeExpression(operatorData);
						converted = this.getConvertedData(converted, convertedExpression, constants.decisionTableExpressionParts.fixedOperator);
						header.AST = convertedAndSerialized.convertedData.AST;
					}
					else if(this.needDeserializeInput){
						converted = this.getConvertedData(converted, header.fixedOperator.operator, constants.decisionTableExpressionParts.fixedOperator);
					}
				}
				
				this.addParserResults(header.inputModelPath, converted, this.currentParserResult.status);
			}
			else if (this.status === constants.RULE_SUCCESS){ //Native
				// Adding property for the converted expression, 
				// because it is the only case we need to keep the original header for its cell conversion
				header.convertedExpression = convertedExpression; 
			}
		}
		else if (this.flags[constants.outputFlagsEnum.oDataOutput]){ 
			this.addParserResults(header.inputModelPath, null, this.currentParserResult.status);
		}
		//if ASTOutput flag is true and the validation succeeded, add the AST to the parserResults	
		if (this.flags[constants.outputFlagsEnum.ASTOutput] && this.currentParserResult.status === parserConstants.statusEnum.SUCCESS){
			converted = this.getConvertedData(converted, this.currentParserResult.model, constants.decisionTableExpressionParts.astOutput);
			this.addParserResults(header.inputModelPath, converted, this.currentParserResult.status);
		}
		
		// Collect Value Help 
		if (this.flags[parserConstants.propertiesEnum.valueHelp] &&
			this.flags[parserConstants.propertiesEnum.valueHelp].hasOwnProperty (parserConstants.propertiesEnum.collectInfo) &&
			(this.flags[parserConstants.propertiesEnum.valueHelp][parserConstants.propertiesEnum.collectInfo] === true) &&
			(this.currentParserResult.status === parserConstants.statusEnum.SUCCESS) &&
			this.currentParserResult[parserConstants.propertiesEnum.valueHelp])
		{
			mergeValueHelp (this.currentParserResult[parserConstants.propertiesEnum.valueHelp][parserConstants.propertiesEnum.info],
					        this.ruleValueHelpInfoArray);
		}
	};
	
	/**
	 * finalizing DT traversal result. In this case should delete from condition headers the converted expression prop. 
	 */
	RuleBodyConvertor.prototype.finalizeResult = function finalizeResult(ruleBody) {
		var i;
		
		if (!this.flags[constants.outputFlagsEnum.oDataOutput]){
			
			for (i = 0; i < ruleBody.content.headers.length; i++){
				
				if (ruleBody.content.headers[i].hasOwnProperty(constants.parserResultEnum.convertedExpression)){
					
					//deleting the unnecessary property
					delete ruleBody.content.headers[i].convertedExpression;
				}
			}
		}
	};
	
	/**
	 * 
	 */
	RuleBodyConvertor.prototype.initFlags = function initFlags(flags) {
	
		ruleBodyValidatorLib.RuleBodyValidator.prototype.initFlags.call(this, flags);
		
		if (flags !== null && flags !== undefined) {
	
			//init conversion flag
			if (flags.hasOwnProperty(constants.outputFlagsEnum.conversionOutput)) {
				this.flags[constants.outputFlagsEnum.conversionOutput] = flags[constants.outputFlagsEnum.conversionOutput];
			} else if(flags.hasOwnProperty(constants.outputFlagsEnum.locale) && 
		            flags[constants.outputFlagsEnum.locale].hasOwnProperty(constants.localeEnum.convert) &&
		            flags[constants.outputFlagsEnum.locale][constants.localeEnum.convert]){
				this.flags[constants.outputFlagsEnum.locale] = flags[constants.outputFlagsEnum.locale];
			}
			//Update Friendly Terms Mode flags:
			if(flags.hasOwnProperty(parserConstants.propertiesEnum.termMode) && 
					flags[parserConstants.propertiesEnum.termMode].hasOwnProperty(parserConstants.propertiesEnum.convert) &&
					flags[parserConstants.propertiesEnum.termMode][parserConstants.propertiesEnum.convert]){
				this.flags[parserConstants.propertiesEnum.termMode] = flags[parserConstants.propertiesEnum.termMode];
			}
			
			//Update oData flag
			if (this.oDataRule){
				this.flags[constants.outputFlagsEnum.oDataOutput] = true;
			} else {
				this.flags[constants.outputFlagsEnum.oDataOutput] = false;
			}
			
			//Update ASToutput flags
			this.flags[constants.outputFlagsEnum.ASTOutput] = flags.hasOwnProperty(constants.outputFlagsEnum.ASTOutput) ?  flags[constants.outputFlagsEnum.ASTOutput] : false;
			
			// Update valueHelp flag
			if(flags && flags.hasOwnProperty (parserConstants.propertiesEnum.valueHelp) )
			{
				this.flags[parserConstants.propertiesEnum.valueHelp] = {};
				this.flags[parserConstants.propertiesEnum.valueHelp] = flags[parserConstants.propertiesEnum.valueHelp];
			}
		}
	};
	
	/****************************************************************************************************************************************
	*		Main access point - convert method
	*****************************************************************************************************************************************/
	
	RuleBodyConvertor.prototype.convert = function convert(ruleBody, vocabulary, vocaRTServ, flags, output, pathPrefixMap, traversalParts) {
		//this.convertedRuleBody = JSON.parse(JSON.stringify(ruleBody));
		
		// Updating the AST need 
		this.needASTResult = decisionTableCellLib.needASTResult(flags, ruleBody.relVersion);
		
		// Validation
		var result = this.validateBusinessRule(/*this.convertedRuleBody*/ruleBody, vocabulary, vocaRTServ, flags, output, pathPrefixMap, traversalParts);
		 
		// Add Value Help to result if exist
		if (this.ruleValueHelpInfoArray.length > 0)
		{
			result[parserConstants.propertiesEnum.valueHelp] = {};
			result[parserConstants.propertiesEnum.valueHelp][parserConstants.propertiesEnum.info] = 
								this.ruleValueHelpInfoArray;
		}
			
		// Adding converted data to result
		if (this.flags[constants.outputFlagsEnum.oDataOutput]){ // oData 
			result.decisionTableData = this.decisionTableData;
		} else{
			if (this.status === constants.RULE_SUCCESS){ // (old) ruleBody
				result.convertedRuleBody = this.ruleBodyCopy;//this.convertedRuleBody;
			} else {
				result.convertedRuleBody = null;
			}
		}
		
		return result;
	};
	return {
		RuleBodyConvertor: RuleBodyConvertor
	};
}());
