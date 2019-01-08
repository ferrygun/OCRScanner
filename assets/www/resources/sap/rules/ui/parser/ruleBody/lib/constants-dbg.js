jQuery.sap.declare("sap.rules.ui.parser.ruleBody.lib.constants");

jQuery.sap.require("sap.rules.ui.parser.ruleBody.lib.constantsBase");



sap.rules.ui.parser.ruleBody.lib.constants = sap.rules.ui.parser.ruleBody.lib.constants|| {}; 
sap.rules.ui.parser.ruleBody.lib.constants.lib = (function() {
	
	var ruleBodyConstantsLib = sap.rules.ui.parser.ruleBody.lib.constantsBase.lib;
	
	var consts = {};

	/************************************************
		Rule Body constants
	*************************************************/
	consts.RULE_ID = 'ruleId';
	consts.RULE_BODY = 'ruleBody';
	consts.RULE_BODY_TYPE = 'type';
	consts.RULE = "rule";
	consts.RULES = "rules";
	consts.ID = 'id';
	consts.NAME = 'name';
	consts.ATTRIBUTES = 'attributes';
	consts.PARAMETERS = 'parameters';
	consts.PARAMETER_NAME = 'parameterName';
	consts.EXECUTION_CONTEXT = 'executionContext';
	consts.RESULT_DATA_OBJECT_ID = 'resultDataObjectId';
	consts.RESULT_DATA_OBJECT_NAME = 'resultDataObjectName';
	consts.DATA_OBJECTS = 'dataObjects';
	consts.SINGLE_TEXT = 'text'; 
	consts.DECISION_TABLE = 'decisionTable';
	consts.RULE_SET = 'ruleSet';
	
	consts.OUTPUT_PARAM = 'output';
	consts.ACTION_PARAM = 'action';
	consts.PARAM = 'parameter';
	consts.CONDITION = 'condition';
	
	consts.EXPLICIT_OUTPUT = 'output';
	consts.VOCABULARY = 'vocabulary';
	
	consts.CALIBRATION_MODE = 'calibration';
	consts.HANA = 'HANA';
	
	consts.RULE_MODE_VALIDATION = 'validation';
	consts.RULE_MODE_RE_VALIDATION = 're-validation';
	
	consts.RULE_OUTPUTS = 'outputs';
	consts.RULE_PARAMETERS = 'parameters';
	consts.RULE_CONTENT = 'content';
	consts.RULE_ACTIONS = 'actions';
	
	consts.RULE_HEADERS = 'headers';
	consts.RULE_COL_ID = 'colID';
	consts.RULE_ROWS = 'rows';
	consts.RULE_DT_EXPRESSION = 'expression';
	
	consts.RULE_PARAM_BUSINESS_DATA_TYPE = 'businessDataType';
	
	consts.RULE_STATUS = 'status';
	consts.RULE_ROOT_OBJECT_CONTEXT = 'rootObjectContext';
	consts.RULE_CELL_TYPE = 'type';
	
	consts.RULE_ROW = 'row';
	consts.RULE_ROW_ID = 'rowID';
	
	consts.RULE_OUTPUT_PARAM_NAME = 'name';
	
	consts.RULE_ACTION_PARAM_NAME = 'name';
	consts.RULE_ACTION_NAME = 'name';
	consts.RULE_ACTION_REFERENCE = 'actionReference';
	
	consts.HIT_POLICY_PROPERTY = 'hitPolicy';
	consts.FIRST_MATCH = 'firstMatch';
	consts.ALL_MATCH = 'allMatch';
	
	consts.ROW_RESULT = 'rowResult';
	consts.PARSER_RESULT = 'parserResult';
	
	//Enumerator for result returned from handles methods 
	consts.validationResultEnum = {
			parserResult			: "parserResult"
	};
	
	//Enumerator for result returned from handles methods 
	consts.parserResultEnum = {
			convertedExpression			: "convertedExpression"
	};
	
	//keys of the pathPrefixMap
	consts.pathPrefixKeysEnum = {
			explicitOutput		    : "output",
			ruleBody  		        : "ruleBody", 
			transientVocabulary		: "transientVocabulary",
			vocabulary				: "vocabulary"
	};
	
	//Enumerator for the output flags
	consts.outputFlagsEnum = ruleBodyConstantsLib.OUTPUT_FLAGS_ENUM;
	
	//Enumerator for the output properties
	consts.outputPropertiesEnum = ruleBodyConstantsLib.OUTPUT_PROPERTIES_ENUM;
	
	consts.decisionTableDataOutputPropEnum = ruleBodyConstantsLib.DT_DATA_OUTPUT_PROPERTIES_ENUM;
	
	consts.localeEnum = {
		convert : "convert"	
	};
	
	consts.traversalEnum = {
		outputParams : "outputParams",
		actionParams : "actionParams",
		actions :	   "actions",
		condition :	   "condition"
	};
	
	consts.PROPERTY_NAME_VALIDATION_OUTPUT = 'validationOutput';
	
	
	consts.ODATA_FORMAT_PAYLOAD = 'odataFormatPayload';
	
	//keys of the oData format output
	consts.additionalInfoTypeEnum = {
			column		    		: "column",
			ruleResult  			: "ruleResult", 
			cell					: "cell",
			executionContext		: "executionContext"
	};
	
	consts.expressionParts = {
		cell 	: "cell",
		header 	: "column"
	};
	
	consts.decisionTableExpressionParts = {
			expression 		: "Expression",
			fixedOperator 	: "FixedOperator",
			content 		: "Content",
			astOutput       : "ASTOutput"
	};
	
	consts.afterConversionParts = {
			fixedOperator 		: "fixedOperator",
			inputModelPath		: "inputModelPath"
	};
	
	consts.expressionProperties = {
		text 	: "text",
		AST		: "AST"
	};
	
	/**************************************************
	 * Rule Services Properties
	 **************************************************/
	consts.RULE_SERVICES_PROPERTY_MODE = 'mode';
	consts.RULE_SERVICES_PROPERTY_MODE_GENERATION = 'generation';
	consts.RULE_SERVICES_PROPERTY_MODE_QUERIES = 'queries';
	consts.RULE_SERVICES_PROPERTY_MODE_PARSING = 'parsing';
	consts.RULE_SERVICES_PROPERTY_MODE_VALIDATION = 'validation';
	consts.RULE_SERVICES_PROPERTY_MODE_GET_PARAMS = 'getParams';
	consts.RULE_SERVICES_PROPERTY_MODE_PUT_PARAMS = 'putParams';
	consts.RULE_SERVICES_PROPERTY_MODE_ALIAS_GENERATION = 'aliasGeneration';
	consts.RULE_SERVICES_PROPERTY_MODE_CONVERT = 'convert';
	consts.RULE_SERVICES_PROPERTY_MODE_RULE_VALIDATION = 'ruleValidation';
	consts.RULE_SERVICES_PROPERTY_MODE_RULESERVICE_VALIDATION = 'ruleServiceValidation';
	
	consts.RULE_SERVICES_BODY_PROPERTY_SP_NAME = 'spName';
	consts.RULE_SERVICES_BODY_PROPERTY_RESULT_DATA = 'resultData';
	consts.RULE_SERVICES_BODY_PROPERTY_LEADING_OBJECT = 'leadingObject';
	consts.RULE_SERVICES_BODY_PROPERTY_KEYS = 'keys';
	consts.RULE_SERVICES_BODY_PROPERTY_GENERATION_FLAGS = 'generationFlags';
	consts.RULE_SERVICES_BODY_PROPERTY_RULE_BODY = 'ruleBody';
	consts.RULE_SERVICES_BODY_PROPERTY_OBJECT_CONTEXT = 'objectContext';
	consts.RULE_SERVICES_BODY_PROPERTY_VOCABULARY = 'vocabulary';
	consts.RULE_SERVICES_BODY_PROPERTY_EXTRA_EXPRESSIONS = 'extraExpressionsArr';
	consts.RULE_SERVICES_BODY_PROPERTY_VARIABLES = 'variablesArr';
	consts.RULE_SERVICES_BODY_PROPERTY_SERVICE_NAME = 'serviceName';
	consts.RULE_SERVICES_BODY_PROPERTY_FILTER = 'filter';
	consts.RULE_SERVICES_BODY_PROPERTY_FLAGS = 'flags';
	consts.RULE_SERVICES_BODY_PROPERTY_OUTPUT = 'output';
	consts.RULE_SERVICES_BODY_PROPERTY_RULE_ID = 'ruleID';
	consts.RULE_SERVICES_BODY_PROPERTY_RULE_KEYS = 'ruleKeys';
	consts.RULE_SERVICES_BODY_PROPERTY_RULES_DATA = 'rulesData';
	consts.RULE_SERVICES_BODY_PROPERTY_ALIAS_NAME = 'aliasName';
		
	/**************************************************
	 * Rule Errors
	***************************************************/
	consts.RULE_ERROR = 'Error';
	consts.RULE_SUCCESS = 'Success';
	
	return consts;
	
}());
