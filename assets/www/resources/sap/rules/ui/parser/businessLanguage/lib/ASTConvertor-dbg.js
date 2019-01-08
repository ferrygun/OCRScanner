jQuery.sap.declare("sap.rules.ui.parser.businessLanguage.lib.ASTConvertor");

jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.AST.lib.bundleAst");

sap.rules.ui.parser.businessLanguage.lib.ASTConvertor = sap.rules.ui.parser.businessLanguage.lib.ASTConvertor|| {}; 
sap.rules.ui.parser.businessLanguage.lib.ASTConvertor.lib = (function() {
	var parserConst = sap.rules.ui.parser.businessLanguage.lib.constants.lib;
	var bundleApi = RulesAPI_Ast;
	var astNodesLib = bundleApi.astNodes;
	
	
	var ALL = "all";
	//var ANY = "any";
	var EXISTS_IN = "exists in";
	var NOT_EXISTS_IN = "not exists in";
	var BETWEEN_OPERATOR = "between";
	var NOT_BETWEEN_OPERATOR = "not between";
	//var LEADING_BRACKET = "(";
	//var CLOSING_BRACKET = ")";
	
	ASTConvertor.operatorsMap = {
			'+'					: astNodesLib.BinaryExprNode.operator.plus,   
			'-'					: astNodesLib.BinaryExprNode.operator.minus,   
			'*' 				: astNodesLib.BinaryExprNode.operator.mult,   
			'/' 				: astNodesLib.BinaryExprNode.operator.div,
			'and' 				: astNodesLib.LogicalExprNode.operator.and,
			'or'  				: astNodesLib.LogicalExprNode.operator.or,
			'='	  				: astNodesLib.RelationalExprNode.operator.isEqual,
			'is equal to'	  	: astNodesLib.RelationalExprNode.operator.isEqual,
			'!='  				: astNodesLib.RelationalExprNode.operator.isNotEqual,
			'is not equal to'  	: astNodesLib.RelationalExprNode.operator.isNotEqual,
			'>'					: astNodesLib.RelationalExprNode.operator.isGreater,
			'is greater than'	: astNodesLib.RelationalExprNode.operator.isGreater,
			'>='				: astNodesLib.RelationalExprNode.operator.isGreaterEqual,
			'is greater equal than': astNodesLib.RelationalExprNode.operator.isGreaterEqual,
			'<'					: astNodesLib.RelationalExprNode.operator.isLess,
			'is less than'		: astNodesLib.RelationalExprNode.operator.isLess,
			'<='				: astNodesLib.RelationalExprNode.operator.isLessEqual,
			'is less equal than': astNodesLib.RelationalExprNode.operator.isLessEqual,
			'average' 		 	: astNodesLib.AggFunctionNode.aggFunction.avg,
			'count'   		 	: astNodesLib.AggFunctionNode.aggFunction.count,
			'count distinct' 	: astNodesLib.AggFunctionNode.aggFunction.countDistinct,
			'max'		 	 	: astNodesLib.AggFunctionNode.aggFunction.max,
			'min'		 	 	: astNodesLib.AggFunctionNode.aggFunction.min,
			'sum'			 	: astNodesLib.AggFunctionNode.aggFunction.sum,
			'contains'		 	: astNodesLib.FunctionNode.functionName.contains,
			'not contains'	 	: astNodesLib.FunctionNode.functionName.notContains,
			'ends'		 	 	: astNodesLib.FunctionNode.functionName.endsWith,
			'not ends'  	 	: astNodesLib.FunctionNode.functionName.notEndsWith,
			'exists in'		 	: astNodesLib.FunctionNode.functionName.existsIn,
			'not exists in'	 	: astNodesLib.FunctionNode.functionName.notExistsIn,
			'between'		 	: astNodesLib.FunctionNode.functionName.isBetween,
			'not between'	 	: astNodesLib.FunctionNode.functionName.isNotBetween,
			'is in the last' 	: astNodesLib.FunctionNode.functionName.isInTheLast,
			'is not in the last': astNodesLib.FunctionNode.functionName.isNotInTheLast,
			'is in the next' 	: astNodesLib.FunctionNode.functionName.isInTheNext,
			'is not in the next': astNodesLib.FunctionNode.functionName.isNotInTheNext,
			'is like'			: astNodesLib.FunctionNode.functionName.isLike,
			'is not like'       : astNodesLib.FunctionNode.functionName.isNotLike,
			'starts' 			: astNodesLib.FunctionNode.functionName.startsWith,
			'not starts'   		: astNodesLib.FunctionNode.functionName.notStartsWith,
			'concatenate'		: astNodesLib.FunctionNode.functionName.concatenate
	}; 
	
	function ASTConvertor(oldAST){
		
		var handleStatement; 
		var handleModel; 
		var handleSimpleStatement; 
		var handleSelectionArray; 
		var handleSelection; 
		var handleComplexSelection; 
		var handleBinaryOperator; 
		var handleStatementArray; 
		var handleAdvanceFunction;
		var handleParams;
	
		this.newAST = {};
		this.lastAggrNode = null;
		
		//Literal node for all simple types
		function handleDataType(valueType, value, compoundValue) {
			if(compoundValue){
				return new astNodesLib.UOMLiteralNode(compoundValue.value, valueType, compoundValue.constant); 
			}
			return new astNodesLib.LiteralNode(value, valueType);
		}
		
		//Compound Value
		function getCompoundValue(statement) {
			var compoundValue = null;
			
			if (statement.hasOwnProperty("getCompoundValue")) {
				compoundValue = statement.getCompoundValue();
			}	
			return compoundValue;
		}
		
		//Simple Selection
		function handleSimpleSelection(statement) {
			var value = statement.getValue();
			var valueType = statement.getValueType();
			var compoundValue = getCompoundValue(statement); 
			
			return handleDataType.call(this, valueType, value, compoundValue);
		}
		
		function getIdentifierContext(selection){
			var context = {};
			
			context.businessType = selection.getAttributeType();
			context.isCollection = selection.getIsCollection();
			context.rootObject = selection.getRootObject();
			context.attribute = selection.getAttribute();
			context.associations = selection.getAssociationsArray();
			context.modifiers = selection.getModifiers();
			
			return context;
		}
		
		//Identifier
		function handleIdentifierSelection(selection){
			var astNode = null;
			var context = getIdentifierContext(selection);
			
			astNode = new astNodesLib.IdentifierNode(context);
			return astNode;
		}
		
		//Between + Exists in
		function handleIsBetweenAndExistsInFunc(setOfValues, onWhatAST){
			var i;
			var childrenNodes = [];
			var selection; 
			var childNodeAST = null;  
			
			//on what operating the operator
			childrenNodes.push(onWhatAST);
			
			//function parameters
			
			for (i = 0; i < setOfValues.valuesArray.length; i++) {
				selection = setOfValues.valuesArray[i];
				childNodeAST = handleSelectionArray.call(this, selection);
				childrenNodes.push(childNodeAST);
			}
			
			return childrenNodes;	
		}
		
		
		//Set of Values (between and exists in)
		function handleSetOfValues(setOfValues, onWhatAST, operator) {
			var childrenNodes = null;
			
			if(operator && operator.value){
				switch (operator.value) {
					case NOT_EXISTS_IN:
					case EXISTS_IN:
					case BETWEEN_OPERATOR:
					case NOT_BETWEEN_OPERATOR:
						childrenNodes = handleIsBetweenAndExistsInFunc.call(this, setOfValues, onWhatAST);
						break;
					}
			}
			
			return childrenNodes;
		}
		
		function handleSpecialSelection(selection, varStatement, operator) {
			var childrenNodes = null;
			
			// Check if setOfValues	
			var type = selection.getType();
			if (type === parserConst.objectNamesEnum.setOfValues) {
				childrenNodes = handleSetOfValues.call(this, selection, varStatement, operator);
			}
		
			// in the next or in the last operators special treatment for time span	
			/*
			var statement;
			if (selection.hasOwnProperty("selectionsArray") === false) {
				statement = selection;
			} else {
				statement = selection.selectionsArray[0];
			}	
			var query = varStatement;	
			var value = getCompoundValue(statement);
			query = handleSpecialTimeSpan(value, query, originOperator, statement.getIndex()); //I REMOVED
			*/
			
			return childrenNodes;
		}
		
		function needsSpecialTreatment(selection)
		{
			var type;
			var needs = false;
			type = selection.getType();
			if (type === parserConst.objectNamesEnum.setOfValues) {
				needs = true;
			}
			/*
			switch (operator) {
			case NEXT_OPERATOR:
			case LAST_OPERATOR:
			case NOT_NEXT_OPERATOR:
			case NOT_LAST_OPERATOR:
				needs = true;
				break;
			}
			*/
			return needs;
		}
		
		//Handle quantity of aggrFuncNode
		function handleTopQuantity(aggregationOption) {
			var quantityAstNode = null;
			
			if (aggregationOption.hasOwnProperty("getQuantity") === true && aggregationOption.getQuantity() !== null) {
				quantityAstNode = handleSimpleSelection.call(this, aggregationOption.getQuantity());
			}
			
			return quantityAstNode;
		}
		
		//Handling Group By Node 
		function  handleGroupBy(aggregationOption)
		{
			var i;
			var groupByNode = null;
			var groupByArray = [];
			
			if(aggregationOption.hasOwnProperty("getGroupByArray") && aggregationOption.getGroupByArray() !== null){
				
				groupByNode = new astNodesLib.GroupClauseNode();
				groupByArray = aggregationOption.getGroupByArray();
				
				for (i=0; i < groupByArray.length; i++) {
					groupByNode.addChild(handleIdentifierSelection.call(this, groupByArray[i]));
				}
			}
			return groupByNode;
		}
		
		//Handling order by 
		function handleOrderDetails(aggregationOption){
			var orderByNode = null;
			var identifierNode = null;
			
			if (aggregationOption.hasOwnProperty("getOrderBy") === true && aggregationOption.getOrderBy() !== null) {
				identifierNode  = handleIdentifierSelection.call(this, aggregationOption.getOrderBy());
			}
			
			if(identifierNode){ //mandatory child of order by
				if (aggregationOption.hasOwnProperty("getOperator")  && aggregationOption.getOperator() !== null) {
					orderByNode = new astNodesLib.OrderClauseNode(aggregationOption.getOperator().getOriginalValue());
				}
				else{
					orderByNode = new astNodesLib.OrderClauseNode(null); //Ask Efrat on this case
				}
				orderByNode.addChild(identifierNode);
			}
			
			return orderByNode;
		}
		
		function handleStatementWithFilter(selectionClause, aggregationOption)
		{
			var onIdentifierNode = null;
			var whereAstNode = null;
			var groupByNode = null;
			var quantityNode = null;
			var orderByNode = null;
			
			//Mandatory child (No. 0) - on what the aggregation is done
			onIdentifierNode = handleIdentifierSelection.call(this, selectionClause.getNavigationPredicateDetails());
			this.lastAggrNode.addChild(onIdentifierNode);
			
			if (selectionClause.hasOwnProperty("getFilterClause"))
			{
				whereAstNode = new astNodesLib.FilterClauseNode();
				whereAstNode.addChild(handleModel.call(this, selectionClause.getFilterClause()));
				//this.lastAggrNode.addChild(whereAstNode);
				onIdentifierNode.addChild(whereAstNode);
			}
			
			if (aggregationOption !== null) {
	
				//***************************************
				//Adding optional childs of aggregations
				//***************************************
				groupByNode = handleGroupBy.call(this, aggregationOption);
				if(groupByNode){
					this.lastAggrNode.addChild(groupByNode);
				}
				
				//***************************************
				//Adding optional childs of collections
				//***************************************
				orderByNode = handleOrderDetails.call(this, aggregationOption);
				if(orderByNode){
					//this.lastAggrNode.addChild(orderByNode);  //(child No. 1/2)
					onIdentifierNode.addChild(orderByNode);
				}
				
				quantityNode = handleTopQuantity.call(this, aggregationOption);
				if(quantityNode){
					//this.lastAggrNode.addChild(quantityNode); //(child No. 1/2)
					onIdentifierNode.addChild(quantityNode);
				}
			}
			
			return this.lastAggrNode;
		}
		
		//Getting aggregation name
		function getAggregationType(aggregationOption)
		{
			var type;
			var aggregationType = null;
			
			if (aggregationOption !== null) {
				type = aggregationOption.getType();
				
				if(aggregationOption.hasOwnProperty("getOriginalValue")){
					aggregationType = aggregationOption.getOriginalValue().toLowerCase();
				}
				else{
					//collectionOperator
					if (type === parserConst.objectNamesEnum.collectionOperatorOption) {
						aggregationType = "collect"; 
					}
					else if (aggregationOption.getAggregationOperator().getValue() !== ALL){ //aggregationOperator
						aggregationType = aggregationOption.getAggregationOperator().getValue().toLowerCase();
					}
				}
			}
			
			return aggregationType;
		}
		
		handleComplexSelection = function(statement) {
			var complexNode = null;
			var quantityNode = null;
			var orderByNode = null;
			var aggFunctionNode = null;
			var onIdentifierNode = null;
			var aggregationType = null;
			var aggregationOption = null;
			var selectionClause;
		
			if (statement.hasOwnProperty("getAggregationOption")) {
				aggregationOption = statement.getAggregationOption();
				aggregationType = getAggregationType(aggregationOption);
				//Aggregation node
				if(aggregationType !== null){
					aggFunctionNode = new astNodesLib.AggFunctionNode(ASTConvertor.operatorsMap[aggregationType]);
					this.lastAggrNode = aggFunctionNode;
				}
			}
		
			//Check aggregations inside the aggregation
			if ((aggregationType === null || aggregationType === "collect")  && (statement.hasOwnProperty("getSelection") && statement.getSelection() !== null)) {
				selectionClause = statement.getSelection();
			} 
			else {
				if (statement.hasOwnProperty("getCompoundSelection") && statement.getCompoundSelection() !== null) {
					complexNode = handleComplexSelection.call(this, statement.getCompoundSelection());
					if(aggFunctionNode && !(complexNode instanceof astNodesLib.AggFunctionNode)){
						aggFunctionNode.addChild(complexNode);
						return aggFunctionNode;
					}
					return complexNode;
				}	
				selectionClause = statement.getSelection();
			}
		
			//Group by & Where
			if (selectionClause.hasOwnProperty("getFilterClause") || (aggregationOption !== null && aggregationOption.hasOwnProperty("getGroupByArray") && aggregationOption.getGroupByArray() !== null)) {
				return handleStatementWithFilter.call(this, selectionClause, aggregationOption);
			}
		
			//on what the aggregation is done
			onIdentifierNode = handleIdentifierSelection.call(this, selectionClause.getNavigationPredicateDetails());
			
			if(aggFunctionNode){
				//Mandatory child (No. 0) - on what the aggregation is done
				aggFunctionNode.addChild(onIdentifierNode);
			}
			
			//Order by + Quantity (can be done only on collections!)
			if (aggregationOption !== null && onIdentifierNode) {
	
				orderByNode = handleOrderDetails.call(this, aggregationOption);
				quantityNode = handleTopQuantity.call(this, aggregationOption);
	
				//Adding optional childs of collection
				if(orderByNode){
					onIdentifierNode.addChild(orderByNode);  //(child No. 1/2)
				}
				if(quantityNode){
					onIdentifierNode.addChild(quantityNode); //(child No. 1/2)
				}
			}
			
			if(aggFunctionNode){
				return aggFunctionNode;
			}
			
			return onIdentifierNode;
		};
		
		handleSelection = function(statement)
		{	
			var type = statement.getType();
			var selectionAST = null;
			
			switch (type)
			{
				case parserConst.objectNamesEnum.simpleSelection:
					selectionAST = handleSimpleSelection.call(this, statement);
					break;
				case parserConst.objectNamesEnum.compoundSelection:
					selectionAST = handleComplexSelection.call(this, statement, null);
					break;
			}
			return selectionAST;
		};
		
		/*var handleArithmeticBrackets = function(selectionsArray, index, length){
			var brackets = {};
			var selection; 
			var type; 
			var op = "";
			var found = true;
			
			brackets.expression = "";
			brackets.index = index;
			
			while(brackets.index < length && found){
				
				selection = selectionsArray[brackets.index];
				type = selection.getType();
				if(selection.hasOwnProperty('getValue') && selection.getValue() !== null){
					op = selection.getValue().trim();
				}
				else{
					op = "";
				}
				
				if(type === parserConst.objectNamesEnum.arithmeticOperator && 
				   (op === LEADING_BRACKET || op === CLOSING_BRACKET)){
					brackets.expression += op;	
					brackets.index++;
				}
				else{
					found = false;
				}
			}
			
			return brackets;
		};*/
		
		handleSelectionArray = function(statement)
		{
			var length = 0;
			var operator = null;
			var firstAST;
			var secondAST;
			var i = 0;
			//var brackets = {};
			var type;
			
			if (Array.isArray(statement.selectionsArray)) // several events
			{
				length = statement.selectionsArray.length;
				type = statement.selectionsArray[i].getType();
				
				if (type === parserConst.objectNamesEnum.selectionClause ){ 
					firstAST = handleSelectionArray.call(this, statement.selectionsArray[i]);
					i++;
				}
				else if (type === parserConst.objectNamesEnum.advanceFunction) {
					firstAST = handleAdvanceFunction.call(this, statement.selectionsArray[i]);
					i++;
					
				}
				else {
					//handling arithmetic brackets
					//brackets = handleArithmeticBrackets(statement.selectionsArray, i, length);
					//i = brackets.index;
					
					firstAST = handleSelection.call(this, statement.selectionsArray[i]);
					//firstAST.filter = brackets.expression + firstAST.filter;
					i++;
					
					//handling more arithmetic brackets
					//brackets = handleArithmeticBrackets(statement.selectionsArray, i, length);
					//i = brackets.index;
					//firstAST.filter += brackets.expression;
				}
				
				while(i < length)
				{
					operator = {};
					operator.value = statement.selectionsArray[i].getValue().trim();
					operator.type = statement.selectionsArray[i].getType();
					i++;
					
					type = statement.selectionsArray[i].getType();
					if (type === parserConst.objectNamesEnum.selectionClause) {
						secondAST = handleSelectionArray.call(this, statement.selectionsArray[i]);
						i++;
					} 
					else{
							
						//handling arithmetic brackets
						//brackets = handleArithmeticBrackets(statement.selectionsArray, i, length);
						//i = brackets.index;
						
						secondAST = handleSelection.call(this, statement.selectionsArray[i]);
						//secondAST.filter = brackets.expression + secondAST.filter;
						i++;
						
						//handling arithmetic brackets
						//brackets = handleArithmeticBrackets(statement.selectionsArray, i, length);
						//i = brackets.index;
						//secondAST.filter += brackets.expression;
					}
					
					firstAST = handleBinaryOperator.call(this, firstAST, secondAST, operator); //arithmetics
				}
				
				return firstAST;
			}
		
			return null;
		};
		
		var isRelationalOperator = function isRelationalOperator(operator){
			return (operator === '>' 	||
					operator === '<' 	||
					operator === '=' 	||
					operator === '!='	||
					operator === '>='	||
					operator === '<=' ); 
		};
		
		handleBinaryOperator = function handleBinaryOperator(leftAST, rightAST, operator) {
			var astNode;
			var i;
			
			if(operator && operator.type && operator.value){
				if(operator.type === parserConst.objectNamesEnum.arithmeticOperator){ //Arithmetics
					if (leftAST !== null && rightAST !== null) { //Binary
						astNode = new astNodesLib.BinaryExprNode(ASTConvertor.operatorsMap[operator.value]);
					}
					else{
						if(leftAST === null && rightAST !== null){
							astNode = new astNodesLib.UnaryExprNode(ASTConvertor.operatorsMap[operator.value]);
						}
					}
				}
				else if (operator.type=== parserConst.objectNamesEnum.advanceFunction){
					astNode = new astNodesLib.FunctionNode(ASTConvertor.operatorsMap[operator.value]);
				}
				else if(operator.type === parserConst.objectNamesEnum.operatorOption){
					if(isRelationalOperator(operator.value)){
						astNode = new astNodesLib.RelationalExprNode(ASTConvertor.operatorsMap[operator.value]);
					}
					else{
						astNode = new astNodesLib.FunctionNode(ASTConvertor.operatorsMap[operator.value]);
					}
				}
				else{ //Logical op (and/or) -> new model //TODO: how can I identify this case???
					astNode = new astNodesLib.LogicalExprNode(ASTConvertor.operatorsMap[operator.value]);	
				}
			}
			
			//Adding childs
			if (leftAST !== null) {
				if (astNode){
					if(Array.isArray(leftAST)){
						for(i = 0; i < leftAST.length; i++){
							astNode.addChild(leftAST[i]);
						}
					}
					else{
						astNode.addChild(leftAST);
					}
				}
				else {
					return leftAST;
				}
			}
			
			if(rightAST !== null) {
				if (astNode){
					if(Array.isArray(rightAST)){
						for(i = 0; i < rightAST.length; i++){
							astNode.addChild(rightAST[i]);
						}
					}
					else {
						astNode.addChild(rightAST);
					}
				}
				else{
					return rightAST;
				}
			}
			
			return astNode;
		};
		
		handleSimpleStatement = function handleSimpleStatement(statement) {
			var right = null, left = null;
			var rightAST = null, leftAST = null;
			var operator = null;
			//var originOperator = null;
			
			//Getting operator data
			if (statement.hasOwnProperty("getSelectionOperator")) {
				operator = {};
				operator.value = statement.getSelectionOperator().getValue().trim();
				operator.type = statement.getSelectionOperator().getType();
				//originOperator = statement.getSelectionOperator().getOriginalValue().trim();
			}
			
			//Getting left selection clause
			left = statement.getLeftSelectionClause();
			leftAST = handleSelectionArray.call(this, left);
			
			//Getting right selection clause
			if (statement.hasOwnProperty("getRightSelectionClause")) {
				right = statement.getRightSelectionClause();
				
				if (right.getType() === parserConst.objectNamesEnum.complexStatement) { //With brackets
					rightAST = new astNodesLib.BracketsExprNode();
					rightAST.addChild(handleModel.call(this, right.getModel()));
				} 
				else if (needsSpecialTreatment(right)) {
					leftAST = handleSpecialSelection.call(this, right, leftAST, operator); 
				} 
				else {
					rightAST = handleSelectionArray.call(this, right);
				}
			}
			return handleBinaryOperator.call(this, leftAST, rightAST, operator); //operational =, <...
		};
		
		/*var isStructureCategory = function isStructureCategory(category){
			return (category && 
					(category === parserConst.complexCategoryEnum.structAll || 
					 category === parserConst.complexCategoryEnum.structAny ||
					 category === parserConst.complexCategoryEnum.structNewLine));
		};*/
		
		/*var handleStructureNode = function handleStructureNode(statementArrayNode, category){
			var logicalOp = null;
			var structAstNode = null;
			
			if (category){
				if (category === parserConst.complexCategoryEnum.structAll) {
					logicalOp = ALL;
					structAstNode = new astNodesLib.StructNode(logicalOp);
				}
				else if (category === parserConst.complexCategoryEnum.structAny) {
					logicalOp = ANY;
					structAstNode = new astNodesLib.StructNode(logicalOp); 
				}
			}
			return structAstNode;
		};*/
		
		handleStatement = function handleStatement(statement)
		{
			var type = statement.getType();
			var statementAST = null;
			var statementArrayNode = null;
			var category = null;
			
			switch (type)
			{
			case parserConst.objectNamesEnum.simpleStatement:
				statementAST = handleSimpleStatement.call(this, statement);
				break;
			case parserConst.objectNamesEnum.complexStatement:
				//category = statement.getCategory();
				statementArrayNode = handleStatementArray.call(this, statement.getModel().statementsArray, category);
				//if(!isStructureCategory(category)){ 
					statementAST = new astNodesLib.BracketsExprNode();
				//}
				//else{ //Any of the following OR All of the following
					//statementAST = new astNodesLib.StructNode(category)
				//}
				statementAST.addChild(statementArrayNode);
				break;
			}
			return statementAST;
		};
		
		var collectLogicalStatements = function handleLogicalStatements(leftStatementAST, statementArray){
			var i;
			var orNodesArray = [];
			var operator = null;
			var prevOperator = null;
			var rightStatementAST = null;
			var andNodesArray = [];
			
			for (i=1; i < statementArray.length; i=i+2)
			{
				prevOperator = operator? operator.value: null;
				operator = {}; 
				operator.value = statementArray[i].getValue().trim();
				operator.type = statementArray[i].getType();
				
				rightStatementAST = handleStatement.call(this, statementArray[i+1]);
				
				if (operator.value ===  parserConst.STATEMENT_OPERATOR.OR.string){ //OR
					orNodesArray.push(leftStatementAST);
					leftStatementAST = rightStatementAST;
				}
				else if (operator.value ===  parserConst.STATEMENT_OPERATOR.AND.string){ //AND
					if(prevOperator === null || operator.value !== prevOperator){ // Starting AND statement
						andNodesArray = [];
						andNodesArray.push(leftStatementAST);
						andNodesArray.push(rightStatementAST);
						leftStatementAST = andNodesArray;
					}
					else{ // Continue AND statement
						leftStatementAST.push(rightStatementAST);
					}
				}
			}
			
			if(orNodesArray.length === 0 && Array.isArray(leftStatementAST) && leftStatementAST.length > 0){
				orNodesArray.push(leftStatementAST);
			}
			
			return orNodesArray;
		};	
		
		var buildAndASTNodes = function buildAndASTNodes(andNodesArray){
			var andNode = new astNodesLib.LogicalExprNode(ASTConvertor.operatorsMap[parserConst.STATEMENT_OPERATOR.AND.string]); 
			var andIndex;
			
			for (andIndex = 0; andIndex < andNodesArray.length; andIndex++){
				andNode.addChild(andNodesArray[andIndex]);
			}
				
			return andNode;
		};
		
		var buildOrASTNodes = function buildOrASTNodes(orNodesArray){
			var orIndex;
			var andNode; 
			var length = orNodesArray.length;
			var orNode = null;	
			
			if(length > 1){
				orNode = new astNodesLib.LogicalExprNode(ASTConvertor.operatorsMap[parserConst.STATEMENT_OPERATOR.OR.string]);
				for (orIndex = 0; orIndex < length; orIndex++){
					
					if (Array.isArray(orNodesArray[orIndex])){
						andNode = buildAndASTNodes.call(this, orNodesArray[orIndex]);
						orNode.addChild(andNode);
					}
					else{
						orNode.addChild(orNodesArray[orIndex]);
					}
				}
			}
			else {
				if (Array.isArray(orNodesArray[0])){
					andNode = buildAndASTNodes.call(this, orNodesArray[0]);
					orNode = andNode;
				}
			}
			
			return orNode;
		};
		
		handleStatementArray = function handleStatementArray(statementArray, category)
		{
			var length = 0;
			var ASTPart = null;
			var orNodesArray = [];
			
			if (Array.isArray(statementArray)) // several events
			{
				length = statementArray.length;
				ASTPart = handleStatement.call(this, statementArray[0]);
				if (length > 1)
				{
					orNodesArray = collectLogicalStatements.call(this, ASTPart, statementArray);
					ASTPart = buildOrASTNodes.call(this, orNodesArray);
				}
			}
			
			return ASTPart;
		};
		
		handleParams = function handleParams(paramsArr){
			var i;
			var childrenNodes = [];
			var selection; 
			var childNodeAST = null;  

			for (i = 0; i < paramsArr.length; i++) {
				selection = paramsArr[i];
				childNodeAST = handleSelectionArray.call(this, selection);
				childrenNodes.push(childNodeAST);
			}
			return childrenNodes;
			
		};
		
		handleAdvanceFunction = function handleAdvanceFunction(statement)
		{
			var params = statement.params;
			var firstAST = handleParams.call(this, params);
			var operator = {};
			operator.value = statement.getName();
			operator.type = statement.getType();
			return handleBinaryOperator.call(this, firstAST, null, operator);
			
		};
		
		handleModel = function handleModel(model)
		{
			return handleStatementArray.call(this, model.statementsArray, null);
		};
		
		this.newAST = oldAST? handleModel.call(this, oldAST): null;	
	}
	
	// Main access point - getting the new AST model
	ASTConvertor.prototype.getSerializeAST = function getSerializeAST() {
		var stringAST;
		
		stringAST = this.newAST? this.newAST.serialize(): "";
		return stringAST;
	};
	
	// Main access point - getting the new AST model
	ASTConvertor.prototype.getAST = function getAST() {	
		return this.newAST;
	};
	
	return {
		ASTConvertor 					: ASTConvertor
	};
}());