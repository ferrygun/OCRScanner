jQuery.sap.declare("sap.rules.ui.parser.ruleBody.lib.ruleBody");

jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.parsingBackendMediator");
jQuery.sap.require("sap.rules.ui.parser.ruleBody.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.infrastructure.errorHandling.hrfException");
jQuery.sap.require("sap.rules.ui.parser.infrastructure.messageHandling.lib.responseCollector");
jQuery.sap.require("sap.rules.ui.parser.infrastructure.util.utilsBase");
jQuery.sap.require("sap.rules.ui.parser.ruleBody.lib.decisionTableCell");
/** 
 * Represents RuleBody base "class"
 * @constructor
 */
sap.rules.ui.parser.ruleBody.lib.ruleBody = sap.rules.ui.parser.ruleBody.lib.ruleBody|| {}; 
sap.rules.ui.parser.ruleBody.lib.ruleBody.lib = (function() {
	
	var parser = new sap.rules.ui.parser.businessLanguage.lib.parsingBackendMediator.lib.parsingBackendMediatorLib();
	var ruleBodyConstants = sap.rules.ui.parser.ruleBody.lib.constants.lib;
	var hrfException = sap.rules.ui.parser.infrastructure.errorHandling.hrfException.lib;
	var ResponseCollector = sap.rules.ui.parser.infrastructure.messageHandling.lib.responseCollector.lib.ResponseCollector;
	var utilsBaseLib = sap.rules.ui.parser.infrastructure.util.utilsBase.lib;
	var utilsLib = new utilsBaseLib.utilsBaseLib();
	var decisionTableCellLib = sap.rules.ui.parser.ruleBody.lib.decisionTableCell.lib;

	var expressionEmpty= function(expression) {
		if (expression === null || expression === undefined || expression === "") {
			return true;
		}
		return false;
	};
	
	function RuleBody() {
		this.ruleType = "";
		this.ruleBodyCopy = null;
		//Flags for de-serialization
		this.needDeserializeInput = false;
		this.serializedHeaders = [];
	}
	
	RuleBody.prototype.initTraversalParts = function initTraversalParts(traversalParts) {
		this.traversalParts = {};
	
		if (traversalParts !== undefined && traversalParts !== null) {
			this.traversalParts[ruleBodyConstants.traversalEnum.condition] = (traversalParts.hasOwnProperty(ruleBodyConstants.traversalEnum.condition) ? traversalParts[ruleBodyConstants.traversalEnum.condition] : true);
			this.traversalParts[ruleBodyConstants.traversalEnum.outputParams] = (traversalParts.hasOwnProperty(ruleBodyConstants.traversalEnum.outputParams) ? traversalParts[ruleBodyConstants.traversalEnum.outputParams] : true);
			this.traversalParts[ruleBodyConstants.traversalEnum.actionParams] = (traversalParts.hasOwnProperty(ruleBodyConstants.traversalEnum.actionParams) ? traversalParts[ruleBodyConstants.traversalEnum.actionParams] : true);
			this.traversalParts[ruleBodyConstants.traversalEnum.actions] = (traversalParts.hasOwnProperty(ruleBodyConstants.traversalEnum.actions) ? traversalParts[ruleBodyConstants.traversalEnum.actions] : true);
		} else {
			//the default is to do traversal on all ruleBody parts
			this.traversalParts[ruleBodyConstants.traversalEnum.condition] = true;
			this.traversalParts[ruleBodyConstants.traversalEnum.outputParams] = true;
			this.traversalParts[ruleBodyConstants.traversalEnum.actionParams] = true;
			this.traversalParts[ruleBodyConstants.traversalEnum.actions] = true;
		}
	};
	
	/**
	 * RuleBody traversal
	 * @param ruleBody
	 * @param vocabulary
	 * @param connection
	 * @returns {RuleBody}
	 */
	RuleBody.prototype.traverse = function traverse(ruleBody, vocabulary, vocaRTServ, traversalParts, pathPrefix) {
		
		jQuery.sap.log.debug("Traverse rule --> " + JSON.stringify(ruleBody));
	
		//the default is to do traversal on all ruleBody parts
		this.initTraversalParts(traversalParts);
	
		this.vocabulary = vocabulary;
		this.vocaRTServ = vocaRTServ;
		
		if (ruleBody !== null && ruleBody !== undefined) {
			
			if (ruleBody.hasOwnProperty(ruleBodyConstants.RULE_BODY_TYPE)) {
	
				this.ruleType = ruleBody.type;
				this.setHitPolicy(ruleBody);
				
				this.ruleBodyCopy = JSON.parse(JSON.stringify(ruleBody));
				
				//singleText rule parsing
				if (this.ruleType === ruleBodyConstants.SINGLE_TEXT) {
					this.traverseText(this.ruleBodyCopy, pathPrefix);
				} else if (this.ruleType === ruleBodyConstants.DECISION_TABLE ||
						   this.ruleType === ruleBodyConstants.RULE_SET) { //decisionTable rule traversal or ruleSet traversal
					this.traverseDecisionTable(this.ruleBodyCopy, pathPrefix);
				}
			}
		}
		return this;
	};
	
	/**
	 * rule text traversal
	 * @param ruleBody
	 * @param vocabulary
	 * @param connection
	 */
	RuleBody.prototype.traverseText = function traverseText(ruleBody, pathPrefix) {
		var index;
		var path;
	
		if (ruleBody.hasOwnProperty(ruleBodyConstants.RULE_CONTENT)) { //content	
	
			this.initResult();
			var result = this.initRowResult(ruleBody.content, 0);
			path = utilsLib.buildJsonPath(pathPrefix, ruleBodyConstants.RULE_CONTENT);
	
			if (ruleBody.content.hasOwnProperty(ruleBodyConstants.CONDITION) &&
				this.traversalParts[ruleBodyConstants.traversalEnum.condition] === true) //condition
			{
				path = utilsLib.buildJsonPath(path, ruleBodyConstants.CONDITION);
				result = this.handleTextCondition(ruleBody.content.condition, result, path);
			}
	
			if (ruleBody.content.hasOwnProperty(ruleBodyConstants.RULE_OUTPUTS) &&
				this.traversalParts[ruleBodyConstants.traversalEnum.outputParams] === true) { //output parameters
	
				this.initTextOutputsResult();
				var currentOutput;
				
				for (index = 0; index < ruleBody.content.outputs.length; index++) {
	
					path = utilsLib.buildJsonPath(pathPrefix, ruleBodyConstants.RULE_OUTPUTS, index);
					currentOutput = ruleBody.content.outputs[index];
	
					if (currentOutput.hasOwnProperty(ruleBodyConstants.RULE_CONTENT)) {
						result = this.handleTextOutputParameter(currentOutput, result, path);
					}
				}
			}
	
			if (ruleBody.content.hasOwnProperty(ruleBodyConstants.RULE_PARAMETERS) &&
				this.traversalParts[ruleBodyConstants.traversalEnum.actionParams] === true) { //actions parameters
	
				this.initTextParametersResult();
				var currentParam;
				
				for (index = 0; index < ruleBody.content.parameters.length; index++) {
	
					path = utilsLib.buildJsonPath(pathPrefix, ruleBodyConstants.RULE_PARAMETERS, index);
					currentParam = ruleBody.content.parameters[index];
	
					if (currentParam.hasOwnProperty(ruleBodyConstants.RULE_CONTENT)) {
						result = this.handleTextActionParameter(currentParam, result, index, path);
					}
				}
			}
	
			if (ruleBody.content.hasOwnProperty(ruleBodyConstants.RULE_ACTIONS) &&
				this.traversalParts[ruleBodyConstants.traversalEnum.actionParams] === true) { // actions
	
				this.initTextActionsResult();
				var currentAction;
				
				for (index = 0; index < ruleBody.content.actions.length; index++) {
	
					path = utilsLib.buildJsonPath(pathPrefix, ruleBodyConstants.RULE_ACTIONS, index);
					currentAction = ruleBody.content.actions[index];
	
					result = this.handleTextAction(currentAction, result, path);
				}
			}
	
			this.addRowResult(result);
		} else {
			this.handleEmptyRuleBody();
		}
	};
	
	/**
	 * rule DT traversal
	 * @param ruleBody
	 * @param vocabulary
	 * @param connection
	 */
	RuleBody.prototype.traverseDecisionTable = function traverseDecisionTable(ruleBody, pathPrefix) {
		var rowIndex, colIndex;
		var ruleBodyContent;
		var headersMap;
		var header = null;
	
		if (ruleBody.hasOwnProperty(ruleBodyConstants.RULE_CONTENT) &&
			ruleBody.content.hasOwnProperty(ruleBodyConstants.RULE_ROWS) &&
			ruleBody.content.hasOwnProperty(ruleBodyConstants.RULE_HEADERS)) {
	
			ruleBodyContent = ruleBody.content;
	
			//init result
			this.initResult();
	
			//handle headers
			headersMap = this.handleHeaders(ruleBodyContent);
			var currentRow, rowResult;
			
			//Going over cells
			for (rowIndex = 0; rowIndex < ruleBodyContent.rows.length; rowIndex++) {
	
				currentRow = ruleBodyContent.rows[rowIndex];
	
				if (currentRow.hasOwnProperty(ruleBodyConstants.RULE_ROW) &&
					currentRow.hasOwnProperty(ruleBodyConstants.RULE_ROW_ID)) {
	
					//init row result
					rowResult = this.initRowResult(ruleBodyContent, rowIndex);
	
					for (colIndex = 0; colIndex < currentRow.row.length; colIndex++) {
	
						if (currentRow.row[colIndex].hasOwnProperty(ruleBodyConstants.RULE_COL_ID)) {
	
							//get the header of the current cell
							header = null;
							if (headersMap.hasOwnProperty(currentRow.row[colIndex].colID)) {
								header = headersMap[currentRow.row[colIndex].colID];
							}
	
							if (header && header.hasOwnProperty(ruleBodyConstants.RULE_CELL_TYPE)) {
	
								if (header.type === ruleBodyConstants.CONDITION &&
									this.traversalParts[ruleBodyConstants.traversalEnum.condition] === true) { //condition
									rowResult = this.handleDecisionTableCondition(header, currentRow, colIndex, rowResult);
								} else if (header.type === ruleBodyConstants.PARAM &&
									this.traversalParts[ruleBodyConstants.traversalEnum.actionParams] === true) { //action parameter
									rowResult = this.handleDecisionTableActionParameter(header, currentRow, colIndex, rowResult);
								} else if (header.type === ruleBodyConstants.OUTPUT_PARAM &&
									this.traversalParts[ruleBodyConstants.traversalEnum.outputParams] === true) { //output parameter
									rowResult = this.handleDecisionTableOutputParameter(header, currentRow, colIndex, rowResult);
								} else if (header.type === ruleBodyConstants.ACTION_PARAM &&
									this.traversalParts[ruleBodyConstants.traversalEnum.actions] === true) { //action
									rowResult = this.handleDecisionTableAction(header, currentRow, colIndex, rowResult);
								}
							}
						}
					}
					this.addRowResult(rowResult);
				}
			}
			this.finalizeResult(ruleBody);
			
		} else {
			this.handleEmptyRuleBody();
		}
	};
	
	/*****************************************************************************************************************
	 * Text handlers
	 *****************************************************************************************************************/
	/**
	 * handles Text Condition
	 */
	RuleBody.prototype.handleTextCondition = function handleTextCondition(condition, result, pathPrefix) {};
	
	/**
	 * init Text Outputs Result
	 */
	RuleBody.prototype.initTextOutputsResult = function initTextOutputsResult() {};
	
	/**
	 * handles Text Output Parameter
	 * @param currentOutput
	 */
	RuleBody.prototype.handleTextOutputParameter = function handleTextOutputParameter(currentOutput, result, pathPrefix) {};
	
	/**
	 * init Text Parameters Result
	 */
	RuleBody.prototype.initTextParametersResult = function initTextParametersResult() {};
	
	/**
	 * handles Text Action Parameter
	 * @param currentParam
	 */
	RuleBody.prototype.handleTextActionParameter = function handleTextActionParameter(currentParam, result, index, pathPrefix) {};
	
	/**
	 * init Text Actions Result
	 */
	RuleBody.prototype.initTextActionsResult = function initTextActionsResult() {};
	
	/**
	 * handles Text Action
	 * @param currentAction
	 */
	RuleBody.prototype.handleTextAction = function handleTextAction(currentAction, result, pathPrefix) {};
	
	/*****************************************************************************************************************
	 * Decision Table handlers
	 *****************************************************************************************************************/
	
	/**
	 * handles decision table headers
	 * @param rule
	 * @returns {Array}
	 */
	RuleBody.prototype.handleHeaders = function handleHeaders(rule) {
		return [];
	};
	
	/**
	 * handles condition
	 * @param header
	 * @param currentRow
	 * @param colIndex
	 * @param rowResult
	 * @returns
	 */
	RuleBody.prototype.handleDecisionTableCondition = function handleDecisionTableCondition(header, currentRow, colIndex, rowResult) {
		
		if(currentRow.row[colIndex].hasOwnProperty(ruleBodyConstants.RULE_CONTENT)){
			//De-serialize input if needed
			if(this.needDeserializeInput){
				currentRow.row[colIndex][ruleBodyConstants.RULE_CONTENT] = currentRow.row[colIndex][ruleBodyConstants.RULE_CONTENT]? decisionTableCellLib.deserializeExpression(currentRow.row[colIndex][ruleBodyConstants.RULE_CONTENT]).text: null;
			}
			//Concatenating operator to cell content
			if(header.hasOwnProperty(ruleBodyConstants.afterConversionParts.fixedOperator) && header.fixedOperator.operator){
				currentRow.row[colIndex][ruleBodyConstants.RULE_CONTENT] = header.fixedOperator.operator + ' ' + currentRow.row[colIndex][ruleBodyConstants.RULE_CONTENT];
			}
		}
	};
	
	/**
	 * handles action parameter
	 * @param header
	 * @param currentRow
	 * @param colIndex
	 * @param rowResult
	 * @returns
	 */
	RuleBody.prototype.handleDecisionTableActionParameter = function handleDecisionTableActionParameter(header, currentRow, colIndex, rowResult) {
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
	RuleBody.prototype.handleDecisionTableOutputParameter = function handleDecisionTableOutputParameter(header, currentRow, colIndex, rowResult) {
		//Deserialize input if needed
		if(currentRow.row[colIndex].hasOwnProperty(ruleBodyConstants.RULE_CONTENT) && this.needDeserializeInput){
			currentRow.row[colIndex][ruleBodyConstants.RULE_CONTENT] = currentRow.row[colIndex][ruleBodyConstants.RULE_CONTENT]? decisionTableCellLib.deserializeExpression(currentRow.row[colIndex][ruleBodyConstants.RULE_CONTENT]).text: null;
		}
	};
	
	/**
	 * handles action
	 * @param header
	 * @param currentRow
	 * @param colIndex
	 * @param rowResult
	 * @returns
	 */
	RuleBody.prototype.handleDecisionTableAction = function handleDecisionTableAction(header, currentRow, colIndex, rowResult) {
		return rowResult;
	};
	
	/**
	 * rule DT headers traversal
	 * @param ruleBody
	 * @param vocabulary
	 * @param connection
	 */
	RuleBody.prototype.traverseDecisionTableHeaders = function traverseDecisionTableHeaders(ruleBody, headerFunc) {
		var headersIndex = 0,
			headersLength = 0;
		var header = {};
	
		if (ruleBody.hasOwnProperty(ruleBodyConstants.RULE_HEADERS)) {
			headersLength = ruleBody.headers.length;
	
			for (headersIndex = 0; headersIndex < headersLength; headersIndex++) {
				header = ruleBody.headers[headersIndex];
				
				//De-serialize if needed
				if(this.needDeserializeInput && !this.serializedHeaders.hasOwnProperty(headersIndex) && !this.serializedHeaders[headersIndex]){
					
					//De-serialize expression
					if(header[ruleBodyConstants.RULE_DT_EXPRESSION]){
						header[ruleBodyConstants.RULE_DT_EXPRESSION] = header[ruleBodyConstants.RULE_DT_EXPRESSION]? decisionTableCellLib.deserializeExpression(header[ruleBodyConstants.RULE_DT_EXPRESSION]).text: null;
					}
					//De-serialize operator
					if(header.hasOwnProperty(ruleBodyConstants.afterConversionParts.fixedOperator)){
						header.fixedOperator.operator = header.fixedOperator.operator? decisionTableCellLib.deserializeExpression(header.fixedOperator.operator).text: null;
					}
					
					this.serializedHeaders[headersIndex] = true;
				}
				
				if (header.hasOwnProperty(ruleBodyConstants.RULE_COL_ID)) {
					if (headerFunc !== null) {
						headerFunc(header);
					}
				}
			}
		}
	};
	
	/**
	 * Sorting the headers according columns actual order
	 * Assumption: colID is number string
	 * @returns
	 */
	RuleBody.prototype.buildHeadersMap = function buildHeadersMap(ruleBody) {
		var headersMap = [];
		this.traverseDecisionTableHeaders(ruleBody, function(header) {
			headersMap[header.colID] = header;
		});
	
		return headersMap;
	};
	
	/**
	 * Concatenating DT condition
	 */
	RuleBody.prototype.concatToDecisionTableCondition = function concatToDecisionTableCondition(header, expression, operator) {
		return decisionTableCellLib.concatToDecisionTableCondition(header, expression, operator);
	};
	
	
	/**
	 * Splitting the header and cell from DT condition, returning the cell
	 */
	RuleBody.prototype.splitDecisionTableCondition = function splitDecisionTableCondition(header, condition, operator) {
		return decisionTableCellLib.splitDecisionTableCondition(header, condition, operator);
	};
	
	/*********************************************************************************************************************************
	 * Common handles for decisionTable & Text traversal
	 *********************************************************************************************************************************/
	
	/**
	 * Init data structures at the beginning of the traversal
	 */
	RuleBody.prototype.initResult = function initResult() {
	
	};
	
	/**
	 * Init the a row result
	 * @param rule
	 * @param rowIndex
	 */
	RuleBody.prototype.initRowResult = function initRowResult(rule, rowIndex) {};
	
	/**
	 * Adding the row result to the data structure
	 * @param rowResult
	 */
	RuleBody.prototype.addRowResult = function addRowResult(rowResult) {};
	
	/**
	 * Do final modifications to the traversal result object
	 */
	RuleBody.prototype.finalizeResult = function finalizeResult(ruleBody) {};
	
	/**
	 * handles empty ruleBody
	 */
	RuleBody.prototype.handleEmptyRuleBody = function handleEmptyRuleBody() {};
	
	
	/**************************************************************************************************************************
	 * Getting parser result on an expression
	 **************************************************************************************************************************/
	/**
	 * Gets the parsed expression from the parser, if not valid throws exception
	 */
	RuleBody.prototype.getParserAST = function getParserAST(expression, parserMode, variables, contentType, flags) {
		var parsedBusinessRule = parser.parseInputRT(expression, parserMode, this.vocaRTServ, variables, contentType, this.vocabulary, flags);
	
		jQuery.sap.log.debug("****************************************************************************************************");
		jQuery.sap.log.debug("expresstion to parser: " + expression + " type: " + contentType + " vocabulary: " + this.vocabulary + " " + parserMode);
		jQuery.sap.log.debug("*****************************************************************************************************");
	
		if (parsedBusinessRule === undefined ||
			(parsedBusinessRule === null && expressionEmpty(expression) === false)) {
			ResponseCollector.getInstance().addMessage("error_in_parsing_expression", [expression]);
			throw new hrfException.HrfException ("error_in_parsing_expression: " + expression, false);
		}
	
		if (parserMode === parser.PARSE_MODE) {
			if (parsedBusinessRule !== null && parsedBusinessRule.status === 'Error') {
				throw new hrfException.HrfException ('', false);
			}
		}
	
		jQuery.sap.log.debug (JSON.stringify(parsedBusinessRule));
		return parsedBusinessRule;
	};
	
	
	/****************************************************************************************************
	 * Setters & Getters for some ruleBody members
	 ****************************************************************************************************/
	
	/**
	 * Sets the hit policy. In case it does not exist allMatch is the default
	 * @param ruleBody
	 */
	RuleBody.prototype.setHitPolicy = function setHitPolicy(ruleBody) {
		if (ruleBody.hasOwnProperty(ruleBodyConstants.HIT_POLICY_PROPERTY)) {
			this.hitPolicy = ruleBody.hitPolicy;
		} else {
			this.hitPolicy = ruleBodyConstants.ALL_MATCH;
		}
	};
	
	/**
	 * Gets the hit policy
	 * @param ruleBody
	 */
	RuleBody.prototype.getHitPolicy = function getHitPolicy() {
		return this.hitPolicy;
	};
	return {
		RuleBody: RuleBody
	};
}());