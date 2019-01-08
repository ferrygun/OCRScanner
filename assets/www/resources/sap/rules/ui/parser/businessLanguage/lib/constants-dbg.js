jQuery.sap.declare("sap.rules.ui.parser.businessLanguage.lib.constants");

/************************************************************************
 ******************************* Constants ******************************
 ************************************************************************/
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.constantsBase");

sap.rules.ui.parser.businessLanguage.lib.constants = sap.rules.ui.parser.businessLanguage.lib.constants|| {}; 
sap.rules.ui.parser.businessLanguage.lib.constants.lib = (
	function() {
	var constantsBaseLib = sap.rules.ui.parser.businessLanguage.lib.constantsBase.lib;
		

		var consts = {
			PARSER_EXPR_LANG_VERSION : "1.0.0",				
			AUTOCOMPLETE_MODE: "autoComplete",
			AUTOCOMPLETE_MODE_LOWERCASE: "autocomplete",
			PARSE_MODE: "parse",
			VALIDATE_MODE: "validate",
			TOKEN_TYPES: "tokens",
			TO_DISPLAY :"toDisplay",
			CODE_TEXT : "codeText",
			DISPLAY_TEXT : "displayText" ,
			TO_CODE : "toCode",
			TYPE_ALL: "All",
			TYPE_COLLECTION: "Collection",
			TYPE_BOOLEAN_COLLECTION: "BooleanCollection",
			TYPE_STRING_COLLECTION: "StringCollection",
			TYPE_NUMERIC_COLLECTION: "NumberCollection",
			TYPE_DATE_COLLECTION: "DateCollection",
			TYPE_TIMESPAN_COLLECTION: "TimeSpanCollection",
			TYPE_TIMESTAMP_COLLECTION: "TimestampCollection",
			TYPE_TIME_COLLECTION: "TimeCollection",
			TYPE_BOOLEAN: "Boolean",
			TYPE_NUMERIC: "Number",
			TYPE_STRING: "String",
			TYPE_DATE: "Date",
			TYPE_TIMESPAN: "TimeSpan",
			TYPE_TIMESTAMP: "Timestamp",
			TYPE_TIME: "Time",
			TYPE_SINGLE_EXPRESSION: "NonComparison",
			TYPE_SINGLE_EXPRESSION_BOOLEAN: "BooleanNonComparison",
			TYPE_BOOLEAN_ENHANCED: "BooleanEnhanced",
			TYPE_AUTOCOMPLETE: "Autocomplete",
			TYPE_NON_COLLECTION: "NonCollection",

			WRONG_STATEMENT_ERROR: "Error in expression, ",
			ENTER: "enter ",
			WRONG_ENTRY: " is not a valid entry",
			INCOMPLETE_STATEMENT_ERROR: "Incomplete expression,",
			ADD: " add ",
			INVALID_STATEMENT_ERROR: "Error in expression, enter valid operand instead of ",
			WRONG_INPUT_ERROR: "Error in expression, remove ",
			ENTER_OPTIONS_ERROR: "enter ",
			INSTEAD_OF_ERROR: "instead of ",
			ENTER_AT_THE_END_ERROR: " at the end of the expression",
			MISSING_EOF: "expression is correct till ",
			MISSING_CURRENT: "'current' is missing in the 'where' clause",
			SINGLE_VALUE_MISSING_ERROR: " is a list of values. Change to expression representing a single value",
			SINGLE_VALUE_TYPE_MISSING_ERROR: " is a list of values, conversion to single value of type ",
			SINGLE_VALUE_MISSING_NEEDED_ERROR: "is needed",
			REDUNDANT_CURRENT_ERROR: "redundant 'current', remove one 'current'",
			EOF_LEXER_ERROR: "at the end of the expression",

			supportedVersions: {
				INITIAL: "1.0.0",
				NEW_AST: "1.1.0"
			},
			
			// Enumerator for status of the parsing process
			statusEnum: {
				SUCCESS: "Success",
				ERROR: "Error"
			},
			// Enumerator for the entities
			objectNamesEnum: {
				selectionClause: "SelectionClause",
				selectionOperator: "SelectionOperator",
				model: "Model",
				arithmeticOperator: "ArithmeticOperator",
				abstractStatement: "AbstractStatement",
				complexStatement: "ComplexStatement",
				simpleStatement: "SimpleStatement",
				StatementOperator: "StatementOperator",
				BooleanEqualityOperator: "BooleanEqualityOperator",
				abstractSelection: "AbstractSelection",
				simpleSelection: "SimpleSelection",
				selection: "Selection",
				navigationPredicateDetails: "NavigationPredicateDetails",
				compoundSelection: "CompoundSelection",
				filterClause: "FilterClause",
				abstractFilterClause: "AbstractFilterClause",
				simpleStatementFilter: "SimpleStatementFilter",
				dateFilter: "DateFilter",
				stringFilter: "StringFilter",
				statementFilter: "StatementFilter",
				complexStatementFilter: "ComplexStatementFilter",
				abstractValue: "AbstractValue",
				dateValue: "DateValue",
				stringValue: "StringValue",
				timeValue: "TimeValue",
				filterSelectionValue: "FilterSelectionValue",
				booleanValue: "BooleanValue",
				advanceFunction: "AdvanceFunction",
				setOfValues: "SetOfValues",
				collectionOperatorOption: "CollectionOperatorOption",
				aggregationOption: "AggregationOption",
				operatorOption: "OperatorOption"
			},

			//Enumerator for the entities
			propertiesEnum: {
				flags: "flags",
				noAssocSuggestion : "noAssocSuggestion",
				unknownTokens: "unknownTokens",
				raiseError: "raiseError",
				businessType: "businessDataType",
				isCollection: "isCollection",
				tokens: "tokensOutput",
				transientVocabulary: "transientVocabulary",
				disableTerms: "disableTerms",
				conversionOutput: "conversionOutput",
				convertedExpression: "convertedExpression",
				rootObjectContext: "rootObjectContext",
				locale : "locale",
				localeSettings : "localeSettings",
				dateFormat : "dateFormat",
				timeFormat : "timeFormat",
				timeZoneOffset: "timeZoneOffset",
				convert : "convert",
				source : "source",
				target : "target",
				number : "number",
				groupSeparator: "groupSeparator",
				decimalSeparator: "decimalSeparator",
				termMode : "termMode",
				valueHelp : "valueHelp",
				collectInfo : "collectInfo",
				info : "info",
				values : "values",
				id : "id",
				metadata : "metadata"
			},
			// Enumerator for value list conversion
			conversionOutputEnum: {
				toKeys: "toKeys",
				toDescriptions: "toDescriptions"
			},
			
			tokenTypesEnum : {
				alias: "alias",
				parameter: "parameter",
				reservedWord: "reservedword",
				vocabulary: "vocabulary",
				constant: "constant",
				whitespace: "whitespace",
				valueList: "valueList",
				unknown: "unknown"
			},			

			
			tokenCategoryEnum: {
				fixed: "fixed",
				dynamic: "dynamic",
				value: "value",
				conjunctionOp: "conjunctionOp",
				comparisonOp: "comparisonOp",
				comparisonBetweenOp: "comparisonBetweenOp",
				comparisonExistOp: "comparisonExistOp",
				comparisonDateTimeOp: "comparisonDateTimeOp",
				UOM: "UOM",
				func: "function",
				funcAdvances: "functionAdvanced",
				arithmeticOp: "arithmeticOp",
				filterOp: "filterOp",
				selectionOp: "selectionOp",
				groupOp: "groupOp",
				sortingOp: "sortingOp",
				structuredCond: "structuredCond",
				unknown: "unknown"
			},
			
		
			attributesNamesEnum: {
				isValid: "isValid",
				dataObject: "dataObject",
				type: "type",
				errorDetails: "errorDetails"
			},

			advanceFunctionNamesEnum: {
				concatenate: "concatenate",
				contains_fuzzy: "contains",
				not_contain_fuzzy: "not contains",
				fuzzy: "fuzzy",
				number_occurences_regexp: "occurrences_regexpr"
			},
			
			complexCategoryEnum: {
				structAll: "structAll",
			    structAny: "structAny",
			    structNewLine: "structNewLine",
			    and: "and",
			    brackets: "brackets",
			    booleanEquality: "booleanEquality",
			    unknown: "unknown"
			}			



		};



		consts.SIMPLE_SELECTION_VALUE_TYPE = constantsBaseLib.SIMPLE_SELECTION_VALUE_TYPE;

		consts.TIME_VALUE_TYPES = (function() {
			return new constantsBaseLib.defineEnum({
				SECOND: {
					string: 'second',
					multiply: 1000
				},
				MINUTE: {
					string: 'minute',
					multiply: 60000
				},
				HOUR: {
					string: 'hour',
					multiply: 3600000
				},
				DAY: {
					string: 'day',
					multiply: 86400000
				},
				WEEK: {
					string: 'week',
					multiply: 604800017
				},
				MONTH: {
					string: 'month',
					multiply: 2629800000
				},
				YEAR: {
					string: 'year',
					multiply: 31557600000
				}
			});
		}());

		consts.SIMPLE_SELECTION_OPERATOR = (function() {
			return new constantsBaseLib.defineEnum({
				GREATER: {
					value: 1,
					string: '>'
				},
				LESS: {
					value: 2,
					string: '<'
				},
				EQUAL: {
					value: 3,
					string: '='
				},
				NOT_EQUAL: {
					value: 4,
					string: '!='
				}
			});
		}());

		consts.DATE_VALUE_TYPES = (function() {
			return new constantsBaseLib.defineEnum({
				RELATIVE_DATE: {
					string: 'RelativeDate'
				},
				TIMESPAN: {
					string: 'TimeSpan'
				},
				PRECEDENCE_DATE: {
					string: 'PrecedenceDate'
				},
				DAY_DATE: {
					string: 'DayDate'
				},
				INTERVAL_DATE: {
					string: 'IntervalDate'
				}
			});
		}());

		consts.DATE_CONST = (function() {
			return new constantsBaseLib.defineEnum({
				TODAY: {
					string: 'today'
				},
				YESTERDAY: {
					string: 'yesterday'
				},
				TOMORROW: {
					string: 'tomorrow'
				}
			});
		}());

		consts.STATEMENT_OPERATOR = (function() {
			return new constantsBaseLib.defineEnum({
				OR: {
					value: 1,
					string: 'or'
				},
				AND: {
					value: 2,
					string: 'and'
				}
			});
		}());

		consts.ARITHMETIC_OPERATOR = (function() {
			return new constantsBaseLib.defineEnum({
				PLUS: {
					value: 1,
					string: '+'
				},
				MINUS: {
					value: 2,
					string: '-'
				},
				MULTIPLE: {
					value: 3,
					string: '*'
				},
				DIVIDE: {
					value: 4,
					string: '/'
				}
			});
		}());
		return consts;
	}());
