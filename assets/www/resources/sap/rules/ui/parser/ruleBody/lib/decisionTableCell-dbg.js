jQuery.sap.declare("sap.rules.ui.parser.ruleBody.lib.decisionTableCell");

jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.parsingBackendMediator");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.ASTConvertor");
jQuery.sap.require("sap.rules.ui.parser.infrastructure.errorHandling.hrfException");
jQuery.sap.require("sap.rules.ui.parser.infrastructure.messageHandling.lib.responseCollector");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.ruleBody.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.AST.lib.bundleAst");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.constants");

sap.rules.ui.parser.ruleBody.lib.decisionTableCell = sap.rules.ui.parser.ruleBody.lib.decisionTableCell|| {}; 
sap.rules.ui.parser.ruleBody.lib.decisionTableCell.lib = (function() {
	
	var parser = new sap.rules.ui.parser.businessLanguage.lib.parsingBackendMediator.lib.parsingBackendMediatorLib();
	var ASTConvertorLib = sap.rules.ui.parser.businessLanguage.lib.ASTConvertor.lib;
	var hrfException = sap.rules.ui.parser.infrastructure.errorHandling.hrfException.lib;
	var responseCollector = sap.rules.ui.parser.infrastructure.messageHandling.lib.responseCollector.lib.ResponseCollector;
	var parserConstants = sap.rules.ui.parser.businessLanguage.lib.constants.lib;
	var ruleBodyconstants = sap.rules.ui.parser.ruleBody.lib.constants.lib;
	var bundleApi = RulesAPI_Ast;
	var ASTOperationsLib = bundleApi.astOperations;
	var vocaConstants = sap.rules.ui.parser.resources.vocabulary.lib.constants.lib;
	
	/**
	 * C'tor
	 */
	function DecisionTableCell(headerExpression, fixedOperator, cellExpression, businessDataType, vocabulary, vocaDataProvider){	
		this.cellExpression = cellExpression;
		this.headerExpression = headerExpression;
		this.operator = fixedOperator;
		this.businessDataType = businessDataType;
		
		this.vocabulary = vocabulary;
		this.vocaDataProvider = vocaDataProvider; 
		
		this.status = parserConstants.statusEnum.SUCCESS;
		
		this.convertedHeader = {};
		this.convertedHeader.text = null;
		this.convertedHeader.AST = null;
		
		this.convertedCell = {};
		this.convertedCell.text = null;
		this.convertedCell.AST = null;
		
		this.convertedCondition = {};
		this.convertedCondition.text = null;
		this.convertedCondition.AST = null;
		
		this.convertedOperator = {};
		this.convertedOperator.text = this.operator;
		this.convertedOperator.AST = null;
		
		this.valueHelp = null;
		this.tokensRequested = false;
		this.tokens = [];
		this.headerTokens = [];
		this.operatorTokens = [];
		this.cellTokens = [];
		
		this.currCursorInfo = {};
		this.needASTResult = false;
	}
	
	var serializeExpression = function serializeExpression(obj){
		var serializedObj = null; 
		
		if(obj && 
		   obj.hasOwnProperty(ruleBodyconstants.expressionProperties.AST) && 
		   obj.hasOwnProperty(ruleBodyconstants.expressionProperties.text)){
			serializedObj = {};
			serializedObj[ruleBodyconstants.expressionProperties.text] = obj[ruleBodyconstants.expressionProperties.text];
			if(obj[ruleBodyconstants.expressionProperties.AST]){	
				//consider to do the parse (to object) in Node (bundleAst)				
				serializedObj[ruleBodyconstants.expressionProperties.AST] = JSON.parse(obj[ruleBodyconstants.expressionProperties.AST].serialize());
			}
			else{
				serializedObj[ruleBodyconstants.expressionProperties.AST] = null;
			}
			serializedObj =  JSON.stringify(serializedObj);
		}
		return serializedObj;
	};
	
	var deserializeExpression = function deserializeExpression(text){
		text = text.replace(/(\r\n|\n|\r|\t|\f)/gm," ");
		return JSON.parse(text);
	};
	
	/**
	 * Concatenating DT condition
	 * @param header's expression
	 * @param cell's expression
	 */
	var concatToDecisionTableCondition = function concatToDecisionTableCondition(header, expression, operator) {
		var condition = '';
		
		if (header) {
			condition += header;
		}
		if (operator){
			condition += " " + operator;
		}
		if (expression){
			condition += " " + expression;
		}
		
		return condition;
	};
	
	/**
	 * Splitting the header and cell from DT condition, returning the cell
	 * @param header (after conversion if needed)
	 * @param condition (header + operator + cell) 
	 * @param operator (optional)
	 */
	var splitDecisionTableCondition = function splitDecisionTableCondition(header, condition, operator) {
		var cell, cellStartIndex = 0, cellLength = condition.length;
		
		if(header){
			cellStartIndex = header.length + 1;
			cellLength = condition.length - header.length - 1;
		
			//updating cellStartIndex and cellLength if has operator
			if(operator){
				cellStartIndex += operator.length + 1;
				cellLength -= (operator.length + 1);
			}
		}
		
		cell = condition.substr(cellStartIndex, cellLength);
		
		return cell;
	};
	
	var isASTVersion = function isASTVersion(parserVersion){
		var versionNumber; 
		var astVersion;
		var isAST = false;
		
		if(parserVersion){
			versionNumber = parseInt(parserVersion.replace(/\./g, ''), 10);
			astVersion = parseInt(parserConstants.supportedVersions.NEW_AST.replace(/\./g, ''), 10);
			isAST = (versionNumber >= astVersion);
		}
		return isAST;
	};
	
	var needDeserializeInput = function needDeserializeInput(flags, parserVersion, vocaDataProvider){
		var needDeserialize = false;
		var termsModes = vocaDataProvider? vocaDataProvider.getTermModes(): null;
		
		if(isASTVersion(parserVersion)){
			if(flags &&
			   ((flags[parserConstants.propertiesEnum.locale] && //Need to merge convert direction in flags
				 flags[parserConstants.propertiesEnum.locale][parserConstants.propertiesEnum.convert] &&
				 flags[parserConstants.propertiesEnum.locale][parserConstants.propertiesEnum.convert][parserConstants.propertiesEnum.source] === parserConstants.CODE_TEXT) ||
				(flags.hasOwnProperty(parserConstants.propertiesEnum.termMode) && 
				 flags[parserConstants.propertiesEnum.termMode].hasOwnProperty(parserConstants.propertiesEnum.convert) &&
				 flags[parserConstants.propertiesEnum.termMode][parserConstants.propertiesEnum.convert] &&
				 flags[parserConstants.propertiesEnum.termMode][parserConstants.propertiesEnum.convert][parserConstants.propertiesEnum.source] === parserConstants.CODE_TEXT))){ 
				needDeserialize = true;
			}
			else if(!((flags && flags.hasOwnProperty(parserConstants.propertiesEnum.locale) && flags[parserConstants.propertiesEnum.locale].hasOwnProperty(parserConstants.propertiesEnum.convert)) ||
					  (flags && flags.hasOwnProperty(parserConstants.propertiesEnum.termMode) && flags[parserConstants.propertiesEnum.termMode].hasOwnProperty(parserConstants.propertiesEnum.convert))) &&
					termsModes && termsModes.indexOf(vocaConstants.TermModeRelated.TERM_MODE_BY_DESCRIPTION) === -1){
				needDeserialize = true;
			}
		}
		return needDeserialize;
	};
	
	// Returning true if new AST in result is needed
	var needASTResult = function needASTResult(flags, parserVersion){
		var ASTResult = false;
		
		if(isASTVersion(parserVersion) && 
				flags && ((flags[parserConstants.propertiesEnum.locale] && //Need to merge convert direction in flags
				flags[parserConstants.propertiesEnum.locale][parserConstants.propertiesEnum.convert] &&
				flags[parserConstants.propertiesEnum.locale][parserConstants.propertiesEnum.convert][parserConstants.propertiesEnum.target] === parserConstants.CODE_TEXT) ||
				(flags.hasOwnProperty(parserConstants.propertiesEnum.termMode) && 
						flags[parserConstants.propertiesEnum.termMode].hasOwnProperty(parserConstants.propertiesEnum.convert) &&
						flags[parserConstants.propertiesEnum.termMode][parserConstants.propertiesEnum.convert] &&
						flags[parserConstants.propertiesEnum.termMode][parserConstants.propertiesEnum.convert][parserConstants.propertiesEnum.target] === parserConstants.CODE_TEXT))){ 
			ASTResult = true;
		}	
		return ASTResult;
	};
	
	DecisionTableCell.prototype.deserializeExpressionParts = function deserializeExpressionParts(){			
		this.headerExpression = this.headerExpression? deserializeExpression(this.headerExpression).text: null;
		this.cellExpression = this.cellExpression? deserializeExpression(this.cellExpression).text: null;
		this.operator = this.operator? deserializeExpression(this.operator).text: null;
	};
	
	/**
	 * Gets the parsed expression from the parser, if not valid throws exception
	 * @param expression
	 * @param parserMode
	 * @param variables
	 * @param contentType
	 * @param flags
	 */
	DecisionTableCell.prototype.getParserAST = function getParserAST(expression, parserMode, variables, contentType, flags) {
		
		function expressionEmpty (expression) {
			if (expression === null || expression === undefined || expression === "") {
				return true;
			}
			return false;
		}
		
		var parsedBusinessRule = parser.parseInputRT(expression, parserMode, this.vocaDataProvider, variables, contentType, this.vocabulary, flags);
		
		if (parsedBusinessRule === undefined ||
			(parsedBusinessRule === null && expressionEmpty(expression) === false)) {
			responseCollector.getInstance().addMessage("error_in_parsing_expression", [expression]);
			throw new hrfException.HrfException ("error_in_parsing_expression: " + expression, false);
		}
	
		if (parserMode === parser.PARSE_MODE) {
			if (parsedBusinessRule !== null && parsedBusinessRule.status === parserConstants.statusEnum.ERROR) {
				throw new hrfException.HrfException ('', false);
			}
		}
		
		return parsedBusinessRule;
	};
	
	/**
	 * gets the converted expression returned from the parser
	 */
	DecisionTableCell.prototype.getParserConvertedExpression = function getParserConvertedExpression(parserResult){	
		return parserResult[ruleBodyconstants.parserResultEnum.convertedExpression];
	};
	
	/**
	 * Return true if the parser did the conversion
	 */
	DecisionTableCell.prototype.hasParserConvertedExpression = function hasParserConvertedExpression(parserResult){
		if(parserResult.status === parserConstants.statusEnum.SUCCESS){
			
		   if(!parserResult.hasOwnProperty(parserConstants.propertiesEnum.convertedExpression)){
			   this.status = parserConstants.statusEnum.ERROR;
		   }
		   else{
			   return true;
		   }
		}
		
		return false;
	};
	
	/**
	 * validateAndConvert according flags
	 * @param flags
	 */
	DecisionTableCell.prototype.validateAndConvert = function validateAndConvert(flags, parserVersion) {
		var condition;
		var parserType;
		var result;
		
		// Check if tokens were requested
		if (flags.hasOwnProperty (parserConstants.propertiesEnum.tokens) &&
			(flags[parserConstants.propertiesEnum.tokens] === true)	)
		{
			this.tokensRequested = true;
		}
		
		// Updating cursor position of header or cell, according first error.  
		function updateCursorInfo(cursorPosition){
			var updatedCursorInfo = {};
			
			if (this.convertedHeader.text && cursorPosition > this.convertedHeader.text.length){
				updatedCursorInfo.position = cursorPosition - this.convertedHeader.text.length - this.convertedOperator.text.length - 2;
				updatedCursorInfo.expressionPart = ruleBodyconstants.expressionParts.cell;
			}
			else{
				updatedCursorInfo.position = cursorPosition;
				updatedCursorInfo.expressionPart = ruleBodyconstants.expressionParts.header;
			}	
			return updatedCursorInfo;
		}
		
		// Adding parser message with the updated cursor position
		function handleParserMessage(parserResult) {
			var additionalInfo = {};
			
			if (parserResult) {
				if (parserResult.hasOwnProperty('cursorPosition') && 
					parserResult.cursorPosition !== undefined && 
					parserResult.cursorPosition !== null){
					additionalInfo.cursorInfo = updateCursorInfo.call(this, parserResult.cursorPosition);
				}
				responseCollector.getInstance().addMessage(parserResult.errorID, undefined, null, additionalInfo, parserResult.errorDetails);
			}
		}
		
		// Building the results
		function buildResult(){
			var result = {};
		
			result.status = this.status;
			
			if (this.status === parserConstants.statusEnum.SUCCESS){
				if(this.convertedCell.text || this.convertedHeader.text){
					result.converted = {};
					if (this.needASTResult) {
						result.converted.header = serializeExpression(this.convertedHeader);
						result.converted.fixedOperator = serializeExpression(this.convertedOperator);
						result.converted.cell = serializeExpression(this.convertedCell);
					}
					else {
						result.converted.header = this.convertedHeader.text;
						result.converted.fixedOperator = this.convertedOperator.text;
						result.converted.cell = this.convertedCell.text;
					}
				}	
				result.actualReturnType = this.actualReturnType;
				
				if (this.valueHelp)
				{
					result.valueHelp = this.valueHelp;
				}
			}		
			
			if (this.tokensRequested)
			{
				result.tokens = {};
				result.tokens.header = this.headerTokens; 
				result.tokens.fixedOperator = this.operatorTokens;
				result.tokens.cell = this.cellTokens;
			}
			
			return result;
		}
		
		function buildTokens ()
		{
			// Handle operator tokens
			if (this.operator)
			{
				this.operatorTokens = 
					this.getParserAST (this.operator, parserConstants.TOKEN_TYPES, null, null, flags);	
			}
			else
			{
				this.operatorTokens = [];
			}

			// Calculate the position for the cell start
			var headerLength = 0;
			var operatorLength = 0;
			var cellPrefixLength = 0;
			
			// Calculate header length 
			if (this.headerExpression)
			{
				headerLength = this.headerExpression.length; 
			}
			
			// Calculate operator length
			if (this.operator)
			{
				operatorLength = this.operator.length + 1; 
			}
			
			// Calculate cell prefix length
			if (this.cellExpression)
			{
				cellPrefixLength = 1; 
			}
			
			//Calculate start position of the cell
			var cellStartPosition = headerLength + operatorLength + cellPrefixLength;
			
			// Go over the tokens and find the token to cut
			var firstCellTokenIndex = 0;
			var fullExpressionTokens = this.tokens;
			var tokensWereCut = false;
			var i = 0;
			for (i = 0; i < fullExpressionTokens.length; ++i)
			{
				if (fullExpressionTokens[i].start === cellStartPosition)
				{ // Start of this token is exactly the point - take from this token till
				  // the end	
					firstCellTokenIndex = i;
					tokensWereCut = true;
					break;
				}
				if ( (fullExpressionTokens[i].start < cellStartPosition) &&
					 (cellStartPosition <= fullExpressionTokens[i].end) )
				{ // The point is in the middle of the token - we need to cut this
				  // token and take from it till the end	
					firstCellTokenIndex = i;
					fullExpressionTokens[i].start = cellStartPosition;
					tokensWereCut = true;
					break;
				}
				if (fullExpressionTokens[i].end < cellStartPosition)
				{ // This token is still not a part of the cell - continue 
					continue;
				}
			}
			// If expression tokens were cut - Cell tokens will exist - 
			// build tokens for cell and update their positions
			if (tokensWereCut)
			{
				for (i = firstCellTokenIndex; i < fullExpressionTokens.length; ++i)
				{
					fullExpressionTokens[i].start -= cellStartPosition;
					fullExpressionTokens[i].end -= cellStartPosition;
					this.cellTokens.push (fullExpressionTokens[i]);
				}
			} // End Of If
		}
		
		// Validates header/condition/result
		function validateExpressionPart(expressionPart, parserType, flags){
			var parserResult;
			var tokens = null;
			var convertedExpressionData = {};
			var ASTConvertor = null;
			var returnObject = {};

			convertedExpressionData.text = null;
			convertedExpressionData.AST = null;
			
			parserResult = this.getParserAST(expressionPart, parserConstants.VALIDATE_MODE, null, parserType, flags);

			// Handle tokens
			if (this.tokensRequested)
			{
				if (parserResult.tokens)
				{
					tokens = parserResult.tokens;
				}
				else
				{
					tokens = [];
				}
			}
			
			if (parserResult.status === parserConstants.statusEnum.SUCCESS)
			{ // Success
				// Handle Return Type
				this.actualReturnType = parserResult.actualReturnType;

				// Handle Value Help
				if (parserResult.valueHelp)
				{
					this.valueHelp = parserResult.valueHelp;
				}
				
				// Handle conversion
				if (parserResult.hasOwnProperty(parserConstants.propertiesEnum.convertedExpression) )
				{
					convertedExpressionData.text = this.getParserConvertedExpression(parserResult);
					
					if (this.needASTResult) { // Converting to new AST
						ASTConvertor = new ASTConvertorLib.ASTConvertor(parserResult.model);
						convertedExpressionData.AST = ASTConvertor.getAST();
					}
				}
			}
			else
			{ // Error
				handleParserMessage.call(this, parserResult);
				this.status = parserConstants.statusEnum.ERROR;
			}
			
			// Build returnObject
			returnObject.converted = convertedExpressionData;
			returnObject.tokens = tokens;
			
			return returnObject;
		}
		
		// Updating the AST need 
		this.needASTResult = needASTResult(flags, parserVersion);
		if(needDeserializeInput(flags, parserVersion, this.vocaDataProvider)){
			this.deserializeExpressionParts();
		}
		
		// Validates & Converts cell info
		//********************************
		var validationResponse = {};
		if(this.headerExpression)
		{ // HEADER: When it is condition with header or just a header	
			validationResponse = validateExpressionPart.call (this, this.headerExpression,
															  parserConstants.TYPE_SINGLE_EXPRESSION,
															  flags);	
			this.convertedHeader =	validationResponse.converted;
			this.headerTokens = validationResponse.tokens;
		}
		
		// When there is no problem with header validation or conversion
		if (this.status === parserConstants.statusEnum.SUCCESS && this.cellExpression){
			condition = concatToDecisionTableCondition(this.headerExpression, this.cellExpression, this.convertedOperator.text);
			parserType = this.businessDataType || parserConstants.TYPE_BOOLEAN_ENHANCED;
			validationResponse = validateExpressionPart.call(this, condition, parserType, flags); 
			this.convertedCondition = validationResponse.converted;
			this.tokens = validationResponse.tokens;
			if (this.status === parserConstants.statusEnum.SUCCESS && this.convertedCondition && this.convertedCondition.text){
				this.convertedCell.text = splitDecisionTableCondition(this.convertedHeader.text, this.convertedCondition.text, this.convertedOperator.text);
				if(this.needASTResult){
					var ASTParts = ASTOperationsLib.split(this.convertedHeader.AST, this.convertedCondition.AST, ASTConvertorLib.ASTConvertor.operatorsMap[this.convertedOperator.text]);
					if(ASTParts){
						this.convertedOperator.AST = ASTParts.operator;
						this.convertedCell.AST = ASTParts.rest;
					}
					else{
						this.convertedOperator.AST = this.convertedOperator.text? ASTOperationsLib.buildOperator(ASTConvertorLib.ASTConvertor.operatorsMap[this.convertedOperator.text]): null;
						this.convertedCell.AST = null;
					}
				}
			}
		}
		
		// Build tokens if required
		if (this.tokensRequested)
		{
			buildTokens.call (this);
		}
		
		// Handle result
		result = buildResult.call(this);
		return result;
	};
	
	return {
		DecisionTableCell 				: DecisionTableCell,
		
		isASTVersion					: isASTVersion,
		needDeserializeInput			: needDeserializeInput,
		needASTResult					: needASTResult,
		serializeExpression				: serializeExpression,
		deserializeExpression			: deserializeExpression,
		concatToDecisionTableCondition	: concatToDecisionTableCondition,
		splitDecisionTableCondition 	: splitDecisionTableCondition
	};

}());
