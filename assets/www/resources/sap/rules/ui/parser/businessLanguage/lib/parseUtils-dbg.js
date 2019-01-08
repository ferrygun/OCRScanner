jQuery.sap.declare("sap.rules.ui.parser.businessLanguage.lib.parseUtils");

/****************************************************************
 * Import relevant libraries
 ****************************************************************/
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.antlr3_all_min");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.vocabularyUtils");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.utils");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.parserTokens");
jQuery.sap.require("sap.rules.ui.parser.infrastructure.messageHandling.lib.responseCollector");
jQuery.sap.require("sap.rules.ui.parser.infrastructure.errorHandling.hrfException");

/****************************************************************
 ****************************************************************/
sap.rules.ui.parser.businessLanguage.lib.parseUtils = sap.rules.ui.parser.businessLanguage.lib.parseUtils|| {}; 
sap.rules.ui.parser.businessLanguage.lib.parseUtils.lib = (function() {
	var constantsLib = sap.rules.ui.parser.businessLanguage.lib.constants.lib;
	var parserTokens = sap.rules.ui.parser.businessLanguage.lib.parserTokens.lib;
	var vocabularyUtils = sap.rules.ui.parser.businessLanguage.lib.vocabularyUtils.lib;
	var vocabularyUtilLib = new vocabularyUtils.vocabularyUtilsLib();
	var utilsLib = new sap.rules.ui.parser.businessLanguage.lib.utils.lib();
	var ResponseCollector = sap.rules.ui.parser.infrastructure.messageHandling.lib.responseCollector.lib.ResponseCollector;
	var org = sap.rules.ui.parser.businessLanguage.lib.antlr3_all_min.lib;
	var hrfException = sap.rules.ui.parser.infrastructure.errorHandling.hrfException.lib;
	//var org = antlrLib.org;

	var defaultTokenMap = {
			ANY_OF : "any of the following conditions is true:",
			ALL_OF : "all of the following conditions are true:",
			//STRUCT_NEW_LINE : "<add line>",
			BULLET : "<add line>",
			VALUE_HELP : "<value help>",
			END_STRUCT : ";",
			COLON : ":",
			ANY: "any",
			CONDITIONS : "conditions",
			FOLLOWING: "following",
			OR: "or",
			AND: "and",
			LROUNDB: "(",
			RROUNDB: ")",
			STRING: "<'string'>",
			DATESTRING: "<'yyyy-MM-dd'>",
			TIMESTAMPSTRING: "<'yyyy-MM-dd HH:mm:ss'>",
			TIMESTRING: "<'HH:mm:ss'>",
			ALL: "all ",
			PLUS: "+",
			MINUS: "-",
			WHERE: "where",
			FILTER: "filter",
			BY: "by",
			IS: "is",
			NOT: "not",
			THE: "the",
			LAST: "last",
			NEXT: "next",
			INT: "<number>",
			DECIMAL: "<number>",
			THIS: "this",
			TODAY: "today",
			YESTERDAY: "yesterday",
			TOMORROW: "tomorrow",
			BEFORE: "is before",
			AFTER: "is after",
			BETWEEN: "is between",
			TO: "to",
			SECOND: "seconds",
			MINUTE: "minutes",
			HOUR: "hours",
			DAY: "days",
			WEEK: "weeks",
			MONTH: "months",
			YEAR: "years",
			//SECONDS: "seconds",
			//MINUTES: "minutes",
			//HOURS: "hours",
			//DAYS: "days",
			//WEEKS: "weeks",
			//MONTHS: "months",
			//YEARS: "years",
			CONTAINS: "contains",
			STARTS: "starts",
			ENDS: "ends",
			WITH: "with",
			LIKE: "is like", 
			EQUALS: "equals",
			IN: "in",
			NOT_SIGN: "!",
			EQ_SIGN: "=",
			NOT_EQUAL_SIGN: "!=",
			GREATER_EQUAL_SIGN: ">=",
			LESS_EQUAL_SIGN: "<=",
			LESS: "less",
			GREATER: "greater",
			THAN: "than",
			AVERAGE: "average",
			OF: "of",
			SUM: "sum",
			COUNT: "count",
			COUNTD: "countd",
			DISTINCT: "distinct",
			FIRST: "first",
			ID: "ID",
			DOT: ".",
			GROUP: "group",
			MULT: "*",
			DIV: "/",
			EQ: "eq",
			EQUAL: "equal",
			PER: "per",
			ONE: "one",
			DO: "do",
			EXISTS: "exists",
			GREATER_SIGN: ">",
			COMMA: ",",
			SEMICOLON: ";",
			LESS_SIGN: "<",
			IS_GREATER_THAN: "is greater than",
			IS_LESS_THAN: "is less than",
			GREATER_THAN: "is greater than",
			LESS_THAN: "is less than",
			IS_EQUAL: "is equal to",
			IS_NOT_EQUAL: "is not equal to",
			DOES_NOT_EQUAL: "does not equal",
			NOT_EQUAL: "not equals",
			EXISTS_IN: "exists in",
			DOES_NOT_EXISTS_IN: "does not exist in",
			NOT_EXISTS_IN: "not exists in",
			//IS_EXISTS_IN: "is exists in",
			//IS_NOT_EXISTS_IN: "does not exist in",
			IS_IN_THE: "is in the",
			IS_NOT_IN_THE: "is not in the",
			IN_THE: "in the",
			NOT_IN_THE: "not in the",
			IS_LIKE: "is like",
			IS_NOT_LIKE: "is not like",
			NOT_LIKE: "is not like",
			IS_IN: "is in",
			IS_NOT_IN: "is not in",
			NOT_IN: "does not exist in",
			//DO_NOT_CONTAIN:      "do not contain",
			//DO_CONTAIN:   "does contain", 
			DOES_NOT_CONTAIN: "does not contain",
			PATTERN: "pattern",
			DOES_CONTAIN: "does contain",
			NOT_CONTAIN: "not contains",
			WITH_FUZZY: "with a fuzzy score of",
			ZERO_TO_ONE: "<value from 0 to 1>",
			ZERO_OR_ONE: "<0 or 1>",
//			NUMBER_OF_OCCURENCES_REGEXP: "number of occurrences containing pattern",
			OCCURENCES_REGEXP: "occurrences containing pattern",
			//DO_NOT_STARTS: "does not start with",
			//DO_START: "does start with",
			DOES_NOT_START: "does not start with",
			DOES_START: "does start with",
			NOT_START: "not starts with",
			START_WITH: "starts with",
			//DO_NOT_END:   "do not end with",
			//DO_END:       "do end with",
			DOES_NOT_END: "does not end with",
			DOES_END: "does end with",
			NOT_END: "not ends with",
			COUNT_OF: "count of",
			COUNTD_OF: "countd of",
			COUNT_DISTINCT_OF: "count distinct of",
			IS_BEFORE: "is before",
			IS_AFTER: "is after",
			IS_NOT_BEFORE: "is not before",
			IS_NOT_AFTER: "is not after",
			IS_BETWEEN: "is between",
			IS_NOT_BETWEEN: "is not between",
			END_WITH: "ends with",
			MINIMUM_OF: "minimum of",
			MAXIMUM_OF: "maximum of",
			AVERAGE_OF: "average of",
			GROUP_BY: "grouped by",
			FILTER_BY: "filter by",
			SUM_OF: "sum of",
			IS_EQUAL_OR_LESS_THAN: "is equal or less than",
			IS_EQUAL_OR_GREATER_THAN: "is equal or greater than",
			GREATER_THAN_OR_EQUAL: "is equal or greater than",
			IS_IN_THE_LAST: "is in the last",
			IS_IN_THE_NEXT: "is in the next",
			IS_NOT_IN_THE_LAST: "is not in the last",
			IS_NOT_IN_THE_NEXT: "is not in the next",
			SORTED_BY: "sorted by",
			WITH_THE_EARLIEST: "with the earliest",
			WITH_THE_MOST_RECENT: "with the most recent",
			EARLIEST: "earliest",
			MOST_RECENT: "most recent",
			WITH_THE_HIGHEST: "with the highest",
			WITH_THE_LOWEST: "with the lowest",
			HIGHEST: "highest",
			LOWEST: "lowest",
			SORTED_FROM_A_TO_Z_BY: "sorted from A to Z by",
			SORTED_FROM_Z_TO_A_BY: "sorted from Z to A by",
			NUMBER_OF: "number of",
			NUMBER_OF_UNIQUE: "number of unique"
		};
	
	function parseUtilsLib() {

	}
	
	//Used by the vocabulary\lib\validationUtils.xsjslib to filter out descriptions that starts with reserved words.
	//It contains all the first words of the alfabet Tokens and the Fragments from the businessLanguage\lib\parserTokens.xsjslib.
	parseUtilsLib.prototype.alfabetReservedWordsArr = ["FIRST","OF","WITH","SORTED","WHERE","FILTER","IS","BY","PER","GROUP",
	                  		                         "GROUPED","COUNT","COUNTD","DISTINCT","AND","OR","ANY","ALL","THE",
	                  		                         "FOLLOWING","CONDITIONS","ARE","TO","TRUE","FALSE","NULL","CURRENT","DOES",
	                  		                         "EQUALS","EQUAL","NOT","LAST","MOST","MAXIMUM","EARLIEST","MINIMUM","ONE","EXISTS",
	                  		                         "IN","EXIST","TODAY","YESTERDAY","TOMORROW","MINUS","GREATER",
	                  		                         "LESS","ROUND","POWER","SIN","COS","LOG","LESS","THAN","NEXT","BEFORE","AFTER",
	                  		                         "BETWEEN","CONCATENATE","CONTAINS","LIKE","PATTERN","CONTAIN","START","STARTS",
	                  		                         "END","ENDS","NUMBER","HIGHEST","LOWEST","AVERAGE","SUM","RECENT","SECOND",
	                  		                         "SECONDS","MINUTE","MINUTES","HOUR","HOURS","DAY","DAYS","WEEK","WEEKS","MONTH",
	                  		                         "MONTHS","YEAR","YEARS","SORTED","OCCURRENCES","FROM","LINE","NEW","LIST",
	                  		                         "UNIQUE","FUZZY","SCORE","NOW","IF","THIS"];
	                  	
	
	parseUtilsLib.prototype.DateFormatEnum = {
		MMDDYYYY: 1,
		DDMMYYYY: 2,
		YYYYMMDD: 3
	};

	parseUtilsLib.prototype.TimeFormatEnum = {
		HHMISS: 1,
		HHMISSAMPM: 2
	};

	parseUtilsLib.prototype.isBlank = function(str) {
		return (!str || /^\s*$/.test(str));
	};

	parseUtilsLib.prototype.isAutocompleteMode = function(mode) {
		//var mode = parseModelLib.getModelManger().mode;
		return (mode === constantsLib.AUTOCOMPLETE_MODE_LOWERCASE || mode === constantsLib.AUTOCOMPLETE_MODE);
	};

	parseUtilsLib.prototype.isCollectionOperator = function(type) {

		if (type === undefined || type === null) {
			return false;
		}

		return (type === parserTokens.COUNT_DISTINCT_OF ||
			type === parserTokens.COUNT_OF ||
			type === parserTokens.LAST ||
			type === parserTokens.MOST_RECENT ||
			type === parserTokens.MAXIMUM_OF ||
			type === parserTokens.HIGHEST ||
			type === parserTokens.LOWEST ||
			type === parserTokens.EARLIEST ||
			type === parserTokens.MINIMUM_OF ||
			type === parserTokens.NUMBER_OF ||
			type === parserTokens.AVERAGE_OF ||
			type === parserTokens.SUM_OF ||
			type === parserTokens.FIRST ||
			type === parserTokens.OF);
	};

	parseUtilsLib.prototype.parseType = function(parser, type) {
		try {
			var parseingType = type;

			if (typeof type === "undefined" || type === null) {
				parseingType = constantsLib.TYPE_ALL;
			}
			switch (parseingType) {
				case constantsLib.TYPE_ALL:
					parser.model();
					break;
				case constantsLib.TYPE_BOOLEAN:
					parser.modelBooleanPure();
					break;
				case constantsLib.TYPE_NUMERIC:
					parser.modelNumric();
					break;
				case constantsLib.TYPE_STRING:
					parser.modelString();
					break;
				case constantsLib.TYPE_DATE:
					parser.modelDate();
					break;
				case constantsLib.TYPE_TIMESPAN:
					 parser.modelTimespan();
					break;
				case constantsLib.TYPE_TIMESTAMP:
					 parser.modelTimestamp();
					break;
				case constantsLib.TYPE_TIME:
					 parser.modelTime();
					break;
				case constantsLib.TYPE_SINGLE_EXPRESSION:
					 parser.modelSingleExpression();
					break;
				case constantsLib.TYPE_SINGLE_EXPRESSION_BOOLEAN:
					 parser.modelBooleanType();
					break;
				case constantsLib.TYPE_BOOLEAN_ENHANCED:
					 parser.modelBoolean();
					break;
				case constantsLib.TYPE_COLLECTION:
					 parser.modelCollection();
					break;
				case constantsLib.TYPE_BOOLEAN_COLLECTION:
					 parser.modelBooleanCollection();
					break;
				case constantsLib.TYPE_STRING_COLLECTION:
					 parser.modelStringCollection();
					break;
				case constantsLib.TYPE_NUMERIC_COLLECTION:
					 parser.modelNumricCollection();
					break;
				case constantsLib.TYPE_DATE_COLLECTION:
					 parser.modelDateCollection();
					break;
				case constantsLib.TYPE_TIMESPAN_COLLECTION:
					 parser.modelTimespanCollection();
					break;
				case constantsLib.TYPE_TIMESTAMP_COLLECTION:
					 parser.modelTimestampCollection();
					break;
				case constantsLib.TYPE_TIME_COLLECTION:
					 parser.modelTimeCollection();
					break;
				case constantsLib.TYPE_AUTOCOMPLETE:
					 parser.modelAllAutocomplete();
					break;
				case constantsLib.TYPE_NON_COLLECTION:
					 parser.modelNonCollection();
					break;
				default:
					// $.trace.error("No type Error");
					throw new hrfException.HrfException ("ERROR: incorrect parst type!");
			}

		} catch (ignore) {
			//throw "Error in parseUtils";
			//$.trace("ParsingBackendMediator: " + err);
		}
	};


	parseUtilsLib.prototype.getLocaleFormat = function(modelManger, ignoreConvertDirection){
		
		function getNumberFormat (locale, localeFormat)
		{
			var groupSeparator;
			
			if (locale.hasOwnProperty(constantsLib.propertiesEnum.localeSettings) &&
			   locale[constantsLib.propertiesEnum.localeSettings] &&
			   locale[constantsLib.propertiesEnum.localeSettings].hasOwnProperty(constantsLib.propertiesEnum.number) )
			{
				if (ignoreConvertDirection || !locale.hasOwnProperty(constantsLib.propertiesEnum.convert) || 
					!locale[constantsLib.propertiesEnum.convert][constantsLib.propertiesEnum.source] || 
					locale[constantsLib.propertiesEnum.convert][constantsLib.propertiesEnum.source] === constantsLib.DISPLAY_TEXT)
				{
					groupSeparator = locale[constantsLib.propertiesEnum.localeSettings] [constantsLib.propertiesEnum.number] [constantsLib.propertiesEnum.groupSeparator];
					groupSeparator = (groupSeparator === ' ')? '': groupSeparator;
					
					localeFormat.INT = "<123" + 
						groupSeparator +
						"456" +
						groupSeparator +
						"789" +
						locale[constantsLib.propertiesEnum.localeSettings][constantsLib.propertiesEnum.number][constantsLib.propertiesEnum.decimalSeparator] +
						"00>";
					localeFormat.DECIMAL = "<123" + 
						groupSeparator +
						"456" +
						groupSeparator +
						"789" +
						locale[constantsLib.propertiesEnum.localeSettings][constantsLib.propertiesEnum.number][constantsLib.propertiesEnum.decimalSeparator] +
						"00>";
				}
			}
		}
		
		var localeFormat = {
				DATESTRING : defaultTokenMap.DATESTRING,
				TIMESTRING : defaultTokenMap.TIMESTRING,
				TIMESTAMPSTRING : defaultTokenMap.TIMESTAMPSTRING,
				INT : defaultTokenMap.INT,
				DECIMAL : defaultTokenMap.DECIMAL
		};
		
		if (modelManger && modelManger.hasOwnProperty(constantsLib.propertiesEnum.flags)
				&& modelManger[constantsLib.propertiesEnum.flags] && modelManger[constantsLib.propertiesEnum.flags].hasOwnProperty(constantsLib.propertiesEnum.locale)
				&& modelManger[constantsLib.propertiesEnum.flags][constantsLib.propertiesEnum.locale])
				{
				var locale = modelManger[constantsLib.propertiesEnum.flags][constantsLib.propertiesEnum.locale];
				if(locale.hasOwnProperty(constantsLib.propertiesEnum.localeSettings)
					&& locale[constantsLib.propertiesEnum.localeSettings] && locale[constantsLib.propertiesEnum.localeSettings].hasOwnProperty(constantsLib.propertiesEnum.dateFormat) && 
					locale[constantsLib.propertiesEnum.localeSettings].hasOwnProperty(constantsLib.propertiesEnum.timeFormat))
					{
					if (ignoreConvertDirection || !locale.hasOwnProperty(constantsLib.propertiesEnum.convert) || 
							!locale[constantsLib.propertiesEnum.convert][constantsLib.propertiesEnum.source] || 
							locale[constantsLib.propertiesEnum.convert][constantsLib.propertiesEnum.source] === constantsLib.DISPLAY_TEXT) {
						var timeFormat = locale[constantsLib.propertiesEnum.localeSettings][constantsLib.propertiesEnum.timeFormat];
						var zIndex = timeFormat.indexOf('z');
						if (zIndex >= 0) {
							timeFormat = timeFormat.substring(0, zIndex-1);
						}
						localeFormat={
								DATESTRING : "<'"+locale[constantsLib.propertiesEnum.localeSettings][constantsLib.propertiesEnum.dateFormat]+"'>",
								TIMESTRING : "<'"+timeFormat+"'>",
								TIMESTAMPSTRING : "<'"+locale[constantsLib.propertiesEnum.localeSettings][constantsLib.propertiesEnum.dateFormat]+
												' '+timeFormat+"'>"
												};
					}
				}
				// Handle Number format
				getNumberFormat (locale, localeFormat);
			}
		return localeFormat;
	};
	parseUtilsLib.prototype.getTokensDisplayMap = function(modelManger) 
	{
		var tokenMap = JSON.parse(JSON.stringify(defaultTokenMap)); // Copy toe leave the default as is
		var locale = this.getLocaleFormat(modelManger, true);
		tokenMap.DATESTRING = locale.DATESTRING;
		tokenMap.TIMESTRING = locale.TIMESTRING;
		tokenMap.TIMESTAMPSTRING = locale.TIMESTAMPSTRING;
		tokenMap.INT = locale.INT;
		tokenMap.DECIMAL = locale.DECIMAL;
		
		return tokenMap;
	};

	


	parseUtilsLib.prototype.sortAndRemoveDuplicates = function(arr) {
		return arr.sort().filter(function(item, pos) {
			return !pos || item !== arr[pos - 1];
		});
	};
	//
	///****************************************************************
	// * check if the type is collection
	// ****************************************************************/
	parseUtilsLib.prototype.getSingleTokenType = function(tokenType) {
		var type = tokenType;

		switch (tokenType) {
			case parserTokens.TYPENUMBERCOLLECTION:
				type = parserTokens.TYPENUMBER;
				break;
			case parserTokens.TYPEBOOLEANCOLLECTION:
				type = parserTokens.TYPEBOOLEAN;
				break;
			case parserTokens.TYPESTRINGCOLLECTION:
				type = parserTokens.TYPESTRING;
				break;
			case parserTokens.TYPEDATECOLLECTION:
				type = parserTokens.TYPEDATE;
				break;
			case parserTokens.TYPETIMECOLLECTION:
				type = parserTokens.TYPETIME;
				break;
			case parserTokens.TYPETIMESTAMPCOLLECTION:
				type = parserTokens.TYPETIMESTAMP;
				break;
			case parserTokens.TYPETIMEINTERVALCOLLECTION:
				type = parserTokens.TYPETIMEINTERVAL;
				break;
				//default:
		}

		return type;
	};
	//
	//
	///****************************************************************
	// * Get navigation path from expression and position
	// ****************************************************************/
	parseUtilsLib.prototype.getNavigationPathFromTextPos = function(text, position) {

		var nav = text.substring(position);
		nav = nav.split(' ')[0];
		return nav;

	};
	//

	//
	///****************************************************************
	// * Get navigation object type
	// ****************************************************************/
	parseUtilsLib.prototype.getNavigationObjectType = function(obj) {

		if (obj === undefined || obj === null || !obj.isValid) {
			return null;
		}

		var type = null;

		if (obj.attribute.businessDataType === null && obj.root.businessDataType === null) {
			type = parserTokens.TYPECOLLECTION;
		} else {

			var businessDataType = (obj.root.isAlias) ? obj.root.businessDataType : obj.attribute.businessDataType;
			var typeEnum = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.getByValue("string", businessDataType);

			switch (typeEnum.string) {
				case constantsLib.SIMPLE_SELECTION_VALUE_TYPE.INTEGER.string:
					if(obj.isCollection) {
						type = (obj.root.isDTAlias) ? parserTokens.TYPENUMBERDT : parserTokens.TYPENUMBERCOLLECTION; 
					}else{ 
						type = parserTokens.TYPENUMBER;
					}
					break;
				case constantsLib.SIMPLE_SELECTION_VALUE_TYPE.BOOLEAN.string:
					if(obj.isCollection) {
						type = (obj.root.isDTAlias) ? parserTokens.TYPEBOOLEANDT : parserTokens.TYPEBOOLEANCOLLECTION; 
					}else{ 
						type =  parserTokens.TYPEBOOLEAN;
					}
					break;
				case constantsLib.SIMPLE_SELECTION_VALUE_TYPE.STRING.string:
					if(obj.isCollection) {
						type = (obj.root.isDTAlias) ? parserTokens.TYPESTRINGDT : parserTokens.TYPESTRINGCOLLECTION; 
					}else{ 
						type =  parserTokens.TYPESTRING;
					}
					break;
				case constantsLib.SIMPLE_SELECTION_VALUE_TYPE.DATE.string:
					if(obj.isCollection) {
						type = (obj.root.isDTAlias) ? parserTokens.TYPEDATEDT : parserTokens.TYPEDATECOLLECTION; 
					}else{ 
						type = parserTokens.TYPEDATE;
					}
					break;
				case constantsLib.SIMPLE_SELECTION_VALUE_TYPE.TIME.string:
					if(obj.isCollection) {
						type = (obj.root.isDTAlias) ? parserTokens.TYPETIMEDT : parserTokens.TYPETIMECOLLECTION; 
					}else{ 
						type = parserTokens.TYPETIME;
					}
					break;
				case constantsLib.SIMPLE_SELECTION_VALUE_TYPE.TIMESTAMP.string:
					if(obj.isCollection) {
						type = (obj.root.isDTAlias) ? parserTokens.TYPETIMESTAMPDT : parserTokens.TYPETIMESTAMPCOLLECTION; 
					}else{ 
						type = parserTokens.TYPETIMESTAMP;
					}
					break;
				case constantsLib.SIMPLE_SELECTION_VALUE_TYPE.TIMESPAN.string:
					if(obj.isCollection) {
						type = (obj.root.isDTAlias) ? parserTokens.TYPETIMEINTERVALDT : parserTokens.TYPETIMEINTERVALCOLLECTION; 
					}else{ 
						type = parserTokens.TYPETIMEINTERVAL;
					}
					break;
					//default:
			}
		}

		return type;
	};

	//
	///****************************************************************
	// * Create a string out of an array of strings
	// * Input - arr - type of Array
	// * Output - String var
	// ****************************************************************/
	parseUtilsLib.prototype.getStringArray = function(arr) {
		var str = "\n [\n ";
		var i;
		for (i = 0; i < arr.length; i++) {
			if (arr[i] instanceof Object) {
				str += arr[i].getString();
			} else {
				str += arr[i];
			}
			if (i === (arr.length - 1)) {
				str += "\n ";
			} else {
				str += ",\n ";
			}
		}
		str += "]\n ";
		return str;
	};
	//
	///**********************************************************************
	// * Parse the navigation predicate string to an array sliced in each dot
	// * Input -  Navigation String
	// * Output - array[navigation parts]
	// **********************************************************************/
	////
	////output: 
	////          attribute type of String
	parseUtilsLib.prototype.getNavigationParts = function(navigationPredicate) {

		var navigationPartsArray = [];
		var tmpString;

		var rightIndex = 0;

		while (rightIndex > -1) {

			rightIndex = navigationPredicate.indexOf(".");
			if (rightIndex === -1) {
				navigationPartsArray.push(navigationPredicate);
				return navigationPartsArray;
			}
			tmpString = navigationPredicate.slice(0, rightIndex);
			navigationPartsArray.push(tmpString);
			//leftIndex = rightIndex;
			navigationPredicate = navigationPredicate.slice(rightIndex + 1);
		}

		return navigationPartsArray;
	};
	//
	//
	//
	//
	parseUtilsLib.prototype.getCollectionRelTypeFromBusinessDT = function(businessType) {

		var relType;
		
		switch (businessType) {
		
			case constantsLib.TYPE_BOOLEAN:
				relType = constantsLib.TYPE_BOOLEAN_COLLECTION;
				break;
			case constantsLib.TYPE_STRING:
				relType = constantsLib.TYPE_STRING_COLLECTION;
				break;
			case constantsLib.TYPE_NUMERIC:
				relType = constantsLib.TYPE_NUMERIC_COLLECTION;
				break;
			case constantsLib.TYPE_DATE:
				relType = constantsLib.TYPE_DATE_COLLECTION;
				break;
			case constantsLib.TYPE_TIMESPAN:
				relType = constantsLib.TYPE_TIMESPAN_COLLECTION;
				break;
			case constantsLib.TYPE_TIMESTAMP:
				relType = constantsLib.TYPE_TIMESTAMP_COLLECTION;
				break;
			case constantsLib.TYPE_TIME:
				relType = constantsLib.TYPE_TIME_COLLECTION;
				break;

			default:
				//default
				relType = businessType;
				break;
		}

		return relType;
	};
	//
	//
	//
	parseUtilsLib.prototype.getBusinessDTFromRelType = function(relType) {

		var ret = {};
		ret[constantsLib.propertiesEnum.isCollection] = false;
		ret[constantsLib.propertiesEnum.businessType] = relType;

		switch (relType) {
			case constantsLib.TYPE_SINGLE_EXPRESSION_BOOLEAN:
				ret[constantsLib.propertiesEnum.businessType] = constantsLib.TYPE_BOOLEAN;
				break;
			case constantsLib.TYPE_COLLECTION:
				ret[constantsLib.propertiesEnum.isCollection] = true;
				ret[constantsLib.propertiesEnum.businessType] = null;
				break;
			case constantsLib.TYPE_BOOLEAN_COLLECTION:
				ret[constantsLib.propertiesEnum.isCollection] = true;
				ret[constantsLib.propertiesEnum.businessType] = constantsLib.TYPE_BOOLEAN;
				break;
			case constantsLib.TYPE_STRING_COLLECTION:
				ret[constantsLib.propertiesEnum.isCollection] = true;
				ret[constantsLib.propertiesEnum.businessType] = constantsLib.TYPE_STRING;
				break;
			case constantsLib.TYPE_NUMERIC_COLLECTION:
				ret[constantsLib.propertiesEnum.isCollection] = true;
				ret[constantsLib.propertiesEnum.businessType] = constantsLib.TYPE_NUMERIC;
				break;
			case constantsLib.TYPE_DATE_COLLECTION:
				ret[constantsLib.propertiesEnum.isCollection] = true;
				ret[constantsLib.propertiesEnum.businessType] = constantsLib.TYPE_DATE;
				break;
			case constantsLib.TYPE_TIMESPAN_COLLECTION:
				ret[constantsLib.propertiesEnum.isCollection] = true;
				ret[constantsLib.propertiesEnum.businessType] = constantsLib.TYPE_TIMESPAN;
				break;
			case constantsLib.TYPE_TIMESTAMP_COLLECTION:
				ret[constantsLib.propertiesEnum.isCollection] = true;
				ret[constantsLib.propertiesEnum.businessType] = constantsLib.TYPE_TIMESTAMP;
				break;
			case constantsLib.TYPE_TIME_COLLECTION:
				ret[constantsLib.propertiesEnum.isCollection] = true;
				ret[constantsLib.propertiesEnum.businessType] = constantsLib.TYPE_TIME;
				break;
			default:
				//default
		}

		return ret;
	};
	//
	//
	//
	parseUtilsLib.prototype.updateValueListTokenType = function(parser, tokenIndex, startIndex, constVal, modelManager) {
			var valAttr = modelManager.getValueListAttribute();
			if(valAttr)
			{
				//parser.valueListConstant.push(constVal);
				/*ResponseCollector.getInstance().trace(
						ResponseCollector.severity().debug,
						"parseUtilsLib.prototype.updateValueListTokenType, constant value from value list is: " + constVal + ", Strat Index is " + startIndex);*/
				parser.input.tokens[tokenIndex].isFromValueList = true;
				parser.input.tokens[tokenIndex].valueListName = valAttr.attributeValueList;
			
			}
	};
	
	parseUtilsLib.prototype.getTokenTypeInfoForConstant = function(tokenType)
	{
		
	
		var info = {};
		info.category = null;
		info.type = null;
		
		switch (tokenType) {
	
		case parserTokens.STRING:
			info.category = constantsLib.tokenCategoryEnum.dynamic;
			info.type = constantsLib.TYPE_STRING;
			break;
		case parserTokens.INT:
			info.category = constantsLib.tokenCategoryEnum.dynamic;
			info.type = constantsLib.TYPE_NUMERIC;
			break;
		case parserTokens.ZERO_TO_ONE:
			info.category = constantsLib.tokenCategoryEnum.dynamic;
			info.type = constantsLib.TYPE_NUMERIC;
			break;
		case parserTokens.ZERO_OR_ONE:
			info.category = constantsLib.tokenCategoryEnum.dynamic;
			info.type = constantsLib.TYPE_NUMERIC;
			break;
		case parserTokens.DECIMAL:
			info.category = constantsLib.tokenCategoryEnum.dynamic;
			info.type = constantsLib.TYPE_NUMERIC;
			break;
		case parserTokens.TIMESTRING:
			info.category = constantsLib.tokenCategoryEnum.dynamic;
			info.type = constantsLib.TYPE_TIME;
			break;
		case parserTokens.DATESTRING:
			info.category = constantsLib.tokenCategoryEnum.dynamic;
			info.type = constantsLib.TYPE_DATE;
			break;
		case parserTokens.TIMESTAMPSTRING:
			info.category = constantsLib.tokenCategoryEnum.dynamic;
			info.type = constantsLib.TYPE_TIMESTAMP;
			break;
		case parserTokens.TRUE:
			info.category = constantsLib.tokenCategoryEnum.fixed;
			info.type = constantsLib.TYPE_BOOLEAN;
			break;
		case parserTokens.FALSE:
			info.category = constantsLib.tokenCategoryEnum.fixed;
			info.type = constantsLib.TYPE_BOOLEAN;
			break;
		case parserTokens.NULL:	
			info.category = constantsLib.tokenCategoryEnum.fixed;
			info.type = null;
			break;
		default:			
			break;			
		}
		
		return info;
		
	};
			
	//
	//
	//
	parseUtilsLib.prototype.getTokenTypeInfoForReservedword = function(tokenType)
	{
		
	
		var info = {};
		info.category = null;
		
		switch (tokenType) {
	
		case parserTokens.OR:
		case parserTokens.AND:
			info.category = constantsLib.tokenCategoryEnum.conjunctionOp;
			break;		
		case parserTokens.EQ_SIGN:
		case parserTokens.NOT_EQUAL_SIGN:
		case parserTokens.GREATER_EQUAL_SIGN:
		case parserTokens.LESS_EQUAL_SIGN:
		case parserTokens.GREATER_SIGN:
		case parserTokens.LESS_SIGN:
		case parserTokens.IS_EQUAL:
		case parserTokens.IS_NOT_EQUAL:
		case parserTokens.IS_GREATER_THAN:
		case parserTokens.IS_LESS_THAN:
		case parserTokens.IS_EQUAL_OR_GREATER_THAN:
		case parserTokens.IS_EQUAL_OR_LESS_THAN:	
		case parserTokens.IS_LIKE:
		case parserTokens.LIKE:	
		case parserTokens.IS_NOT_LIKE:
		case parserTokens.NOT_LIKE:	
		case parserTokens.CONTAINS:
		case parserTokens.DOES_NOT_CONTAIN:
		case parserTokens.START_WITH:
		case parserTokens.DOES_NOT_START:
		case parserTokens.END_WITH:
		case parserTokens.DOES_NOT_END:
		case parserTokens.IN:
		case parserTokens.IS_BEFORE:
		case parserTokens.BEFORE:
		case parserTokens.IS_NOT_BEFORE:
		case parserTokens.IS_AFTER:
		case parserTokens.AFTER:
		case parserTokens.IS_NOT_AFTER:
			info.category = constantsLib.tokenCategoryEnum.comparisonOp;
			break;	
		case parserTokens.IS_IN_THE_LAST:
		case parserTokens.IS_NOT_IN_THE_LAST:
		case parserTokens.IS_IN_THE_NEXT:
		case parserTokens.IS_NOT_IN_THE_NEXT:
			info.category = constantsLib.tokenCategoryEnum.comparisonDateTimeOp;
			break;	
		case parserTokens.BETWEEN:
		case parserTokens.IS_BETWEEN:
		case parserTokens.IS_NOT_BETWEEN:
			info.category = constantsLib.tokenCategoryEnum.comparisonBetweenOp;
			break;
		case parserTokens.NOT_IN:
		case parserTokens.EXISTS_IN:
		case parserTokens.DOES_NOT_EXISTS_IN:
			info.category = constantsLib.tokenCategoryEnum.comparisonExistOp;
			break;				
		case parserTokens.NUMBER_OF:
		case parserTokens.COUNT_DISTINCT_OF:
		case parserTokens.SUM_OF:
		case parserTokens.AVERAGE_OF:
		case parserTokens.LOWEST:
		case parserTokens.HIGHEST:
		case parserTokens.EARLIEST:
		case parserTokens.MOST_RECENT:			
			info.category = constantsLib.tokenCategoryEnum.func;
			break;	
		case parserTokens.CONCATENATE:
		case parserTokens.ROUND:
		case parserTokens.POWER:
		case parserTokens.SIN:
		case parserTokens.COS:
		case parserTokens.LOG:				
		case parserTokens.WITH_FUZZY:				
//		case parserTokens.NUMBER_OF_OCCURENCES_REGEXP:				
		case parserTokens.PATTERN:
		case parserTokens.OCCURENCES_REGEXP:				
			info.category = constantsLib.tokenCategoryEnum.funcAdvances;
			break;
		case parserTokens.PLUS:
		case parserTokens.MINUS:
		case parserTokens.MULT:
		case parserTokens.DIV:		
			info.category = constantsLib.tokenCategoryEnum.arithmeticOp;
			break;
		case parserTokens.TODAY:
		case parserTokens.TOMORROW:
		case parserTokens.YESTERDAY:
			info.category = constantsLib.tokenCategoryEnum.value;
			break;		
		case parserTokens.SECOND:
		case parserTokens.MINUTE:
		case parserTokens.HOUR:
		case parserTokens.DAY:
		case parserTokens.WEEK:
		case parserTokens.MONTH:
		case parserTokens.YEAR:		
			info.category = constantsLib.tokenCategoryEnum.UOM;
			break;				
		case parserTokens.WITH_THE_HIGHEST:
		case parserTokens.WITH_THE_LOWEST:
		case parserTokens.WITH_THE_MOST_RECENT:
		case parserTokens.WITH_THE_EARLIEST:
		case parserTokens.SORTED_FROM_Z_TO_A_BY:		
		case parserTokens.SORTED_FROM_A_TO_Z_BY:
			info.category = constantsLib.tokenCategoryEnum.sortingOp;
			break;
		case parserTokens.ALL_OF:		
		case parserTokens.ANY_OF:
			info.category = constantsLib.tokenCategoryEnum.structuredCond;
			break;									
		case parserTokens.WHERE:				
			info.category = constantsLib.tokenCategoryEnum.filterOp;
			break;
		case parserTokens.GROUP_BY:				
		case parserTokens.PER:
			info.category = constantsLib.tokenCategoryEnum.groupOp;
			break;	
			
		default:			
			break;
		}
		return info;
	};
		
	parseUtilsLib.prototype.getTokenTypeMetadata = function(type, name, channel, isFromValueList, modelManager) {
		//var ret = constantsLib.tokenTypesEnum.unknown;
		var ret = {};

		if (typeof type === "undefined" || type === null) {
			return ret;
		}

		if (channel === org.antlr.runtime.Token.HIDDEN_CHANNEL && !this.isEmptyString(name)) {
			ret.group = constantsLib.tokenTypesEnum.vocabulary;
			return ret;
		}
		switch (type) {
			case parserTokens.WS:
				ret.group = constantsLib.tokenTypesEnum.whitespace;
				break;
			case parserTokens.NAVIGATION:
				ret.group = (channel === org.antlr.runtime.Token.HIDDEN_CHANNEL) ? constantsLib.tokenTypesEnum.vocabulary : constantsLib.tokenTypesEnum.unknown;
				break;
			case parserTokens.ANYCHAR:
			case parserTokens.COLON:
				ret.group = constantsLib.tokenTypesEnum.unknown;
				break;
			case parserTokens.STRING:
			case parserTokens.INT:
			case parserTokens.ZERO_TO_ONE:
			case parserTokens.ZERO_OR_ONE:
			case parserTokens.DECIMAL:
			case parserTokens.TIMESTRING:
			case parserTokens.DATESTRING:
			case parserTokens.TIMESTAMPSTRING:
			case parserTokens.TRUE:
			case parserTokens.FALSE:
			case parserTokens.NULL:
				//ret.group = (isFromValueList ? constantsLib.tokenTypesEnum.valueList : constantsLib.tokenTypesEnum.constant);
				if(isFromValueList)
				{
					ret.group = constantsLib.tokenTypesEnum.valueList ;
				}
				else
				{
					ret.group = constantsLib.tokenTypesEnum.constant; 
					ret.info = this.getTokenTypeInfoForConstant(type);	
				}
				break;
			case parserTokens.TYPENUMBERCOLLECTION:
			case parserTokens.TYPENUMBER:
			case parserTokens.TYPEBOOLEANCOLLECTION:
			case parserTokens.TYPEBOOLEAN:
			case parserTokens.TYPESTRINGCOLLECTION:
			case parserTokens.TYPESTRING:
			case parserTokens.TYPEDATECOLLECTION:
			case parserTokens.TYPEDATE:
			case parserTokens.TYPETIMECOLLECTION:
			case parserTokens.TYPETIME:
			case parserTokens.TYPETIMESTAMPCOLLECTION:
			case parserTokens.TYPETIMESTAMP:
			case parserTokens.TYPETIMEINTERVALCOLLECTION:
			case parserTokens.TYPETIMEINTERVAL:
			case parserTokens.TYPECOLLECTION:
			case parserTokens.TYPEATTRIBUTE:
				ret.group = constantsLib.tokenTypesEnum.vocabulary;
				var nav = modelManager.getCurrentNavigationObject(name);
				if (nav !== undefined && nav !== null && nav.isValid) {
					ret.group = nav.root.isAlias ? constantsLib.tokenTypesEnum.alias : constantsLib.tokenTypesEnum.vocabulary;
				}
				break;
			case parserTokens.TYPENUMBERDT:
			case parserTokens.TYPEBOOLEANDT:
			case parserTokens.TYPESTRINGDT:
			case parserTokens.TYPEDATEDT:
			case parserTokens.TYPETIMEDT:
			case parserTokens.TYPETIMESTAMPDT:
			case parserTokens.TYPETIMEINTERVALDT:
				ret.group = constantsLib.tokenTypesEnum.alias;
				ret.info = this.getTokenTypeInfoForReservedword(type);
				break;
			case parserTokens.TYPENUMBERPARAMETER:
			case parserTokens.TYPESTRINGPARAMETER:
			case parserTokens.TYPEDATEPARAMETER:
			case parserTokens.TYPEBOOLEANPARAMETER:
			case parserTokens.TYPETIMEINTERVALPARAMETER:
			case parserTokens.TYPETIMEPARAMETER:
			case parserTokens.TYPETIMESTAMPPARAMETER:
				var param = modelManager.getCurrentNavigationObject(name);
				if (param.isValid) {
					ret.group = constantsLib.tokenTypesEnum.parameter;
				}
				break;

			default: 
				if(channel === org.antlr.runtime.Token.HIDDEN_CHANNEL) {
					ret.group = constantsLib.tokenTypesEnum.vocabulary;
				}
				else {
					ret.group = constantsLib.tokenTypesEnum.reservedWord;
					ret.info = this.getTokenTypeInfoForReservedword(type);
				}
				 
				break;
		}

		return ret;
	};
	//
	parseUtilsLib.prototype.TokenInfo = function(tokenName, tokentype, info, startIndex, endIndex, valueListName, modelManager) {
		this.start = startIndex;
		this.end = endIndex;
		this.tokenType = tokentype;

		if(valueListName)
		{
			this.info = {};
			var valueHelpType = modelManager.vocaRTServ.getValueListType(modelManager.vocabulary, valueListName);
			
			switch (valueHelpType) {
			case 'Internal'://vocabularyConstants.INTERNAL_VALUE_LIST:
				this.info.key = valueListName;					
				break;
			case 'External'://vocabularyConstants.EXTERNAL_VALUE_LIST:
				this.info.id = valueListName;		
				var valueListVal = modelManager.vocaRTServ.getValueList(modelManager.vocabulary, valueListName);
				var metadataVal = valueListVal.metadata;
				metadataVal.businessDataType = valueListVal.businessDataType;
				this.info.metadata = metadataVal;
				break;
			default:
				this.info.key = valueListName;	
			}
			
		}
		else if(info)
		{
			this.info = info;
			
		}		
		this.token = tokenName;

	};

	
	function combineSplittedTokens(parseUtilsInstance, expression, modelManager, tokens, index, nextTokenType) {
		var tokenType = null;
		// In the middle ws
		var currentToken = tokens[index];
		var nextToken = tokens[index+2];
		if (nextToken && nextToken.type === nextTokenType) {
			var name = expression.substring(currentToken.start, nextToken.stop + 1);
			var typeObject = parseUtilsInstance.getTokenTypeMetadata(nextToken.type, name, nextToken.channel, false, modelManager);
			tokenType = new parseUtilsInstance.TokenInfo(name, typeObject.group, typeObject.info, currentToken.start, nextToken.stop, null, modelManager);
		}
		return tokenType;
	}

	//
	parseUtilsLib.prototype.buildTokenTypes = function(parser, originalExpression, modelManager) {

		var splittedTokens = {};
		splittedTokens[parserTokens.CONTAINS] = parserTokens.PATTERN;
		splittedTokens[parserTokens.DOES_NOT_CONTAIN] = parserTokens.PATTERN;
		splittedTokens[parserTokens.NUMBER_OF] = parserTokens.OCCURENCES_REGEXP;
		
		
		var expression = originalExpression.replace(/\\/g, "\\\\");
		var tokenType, tokenTypes = [];
		var expressionLen = expression.length;
		var token, start, end, name, typeObject;
		var isFromValueList = false;
		var valueListName = null;
		//var tokenTypeInfo = null;

		var tokens = parser.input.tokens;
		if (tokens.length === 0) {
			var n = expression.length;
			tokenType = new this.TokenInfo(expression, constantsLib.tokenTypesEnum.unknown, null, 0, n, null, modelManager);
			tokenTypes.push(tokenType);
		}

		var i = 0;
		while (i < tokens.length) {
			//tokenTypeInfo = null;
			token = tokens[i];
			start = token.start;
			end = token.stop;
			isFromValueList = (token.hasOwnProperty("isFromValueList") ? token.isFromValueList : false);
			valueListName =  (token.hasOwnProperty("valueListName") ? token.valueListName : null);
			name = expression.substring(start, end + 1);

			if (parser.lexerErrorOccurred && parser.lexerErrorStartIndex === start) {
				//tokenType = new this.TokenInfo(name, (parser.lastToken ?  tokenTypesEnum.reservedWord :  tokenTypesEnum.unknown), null, start, expressionLen, modelManager);
				name = expression.substring(start, expressionLen + 1);
				tokenType = new this.TokenInfo(name, constantsLib.tokenTypesEnum.unknown, null, start, expressionLen, null, modelManager);
				tokenTypes.push(tokenType);
				break;

			} else {
				typeObject = this.getTokenTypeMetadata(token.type, name, token.channel, isFromValueList, modelManager);
				if (splittedTokens.hasOwnProperty(token.type)) {
					tokenType = combineSplittedTokens(this, expression, modelManager, tokens, i, splittedTokens[token.type] );
					if (tokenType === null) {
						tokenType = new this.TokenInfo(name, typeObject.group, typeObject.info, start, end, valueListName, modelManager);
						i++;
					}
					else {
						i = i+3;
					}
				}
				else {
					tokenType = new this.TokenInfo(name, typeObject.group, typeObject.info, start, end, valueListName, modelManager);
					i++;
				}
				tokenTypes.push(tokenType);

			}
		}
		return tokenTypes;
	};
	//
	parseUtilsLib.prototype.parseWithValidation = function(lexer, parser, type, modelManager) {

		this.overwriteLexerReportError(parser, lexer, modelManager);
		this.overwriteParserReportErrorValidateMode(parser, modelManager);
		this.parseType(parser, type);
	
	};



	// Handling errors
	parseUtilsLib.prototype.handleError = function(message_enum, paramsArray, modelManager) {

		var throwError = (modelManager.hasOwnProperty(constantsLib.propertiesEnum.flags) && modelManager.flags.hasOwnProperty(constantsLib.propertiesEnum.raiseError) && modelManager.flags[constantsLib.propertiesEnum.raiseError] === false) ? false : true;

		if (paramsArray) {
			var translatedError = ResponseCollector.getInstance().getMessage(message_enum, paramsArray);
			if(modelManager.parseResult.errorDetails.indexOf(translatedError) < 0){
				if (throwError) {
					ResponseCollector.getInstance().addMessage(message_enum, paramsArray);
				}
				modelManager.parseResult.errorDetails.push(translatedError);
			}
		}

		modelManager.parseResult.errorID = message_enum; //ADDED
		modelManager.parseResult.status = constantsLib.statusEnum.ERROR;
		
		//throw new Error(errorDescription);
		//throw errorDescription;
	};

	// Handling errors
	parseUtilsLib.prototype.handleWarning = function(message, mode) {
		if(!mode || !this.isAutocompleteMode(mode) )
		{
			throw new hrfException.HrfException (message);
		}
	
	};
	
	///****************************************************************
	// * validate Root Object Context
	// ****************************************************************/
	parseUtilsLib.prototype.validateRootObjectContext = function(navigationObject, modelManager) {
		
		var i = 0;
		
		// validate / collect information only for context part of expression 
		// (skip 'all' terms)
		if(modelManager.flags[constantsLib.propertiesEnum.rootObjectContext] && 
		   navigationObject.isValid && !navigationObject.root.isAlias && !navigationObject.isVocaRule &&
		    !navigationObject.modifiers.all) {
		
			if (!modelManager[constantsLib.propertiesEnum.rootObjectContext].name)
			{
				modelManager[constantsLib.propertiesEnum.rootObjectContext].name = navigationObject.root.name;
				
			}
			else if (modelManager[constantsLib.propertiesEnum.rootObjectContext].name !== navigationObject.root.name)
			{
				this.handleError("error_in_expression_root_object_validation_message",
								[modelManager[constantsLib.propertiesEnum.rootObjectContext].name, navigationObject.root.name], modelManager);
				throw new hrfException.HrfException ();
			}
			
			if (modelManager[constantsLib.propertiesEnum.rootObjectContext].name) 
			{
				if(navigationObject.associations.path.length > 0) {
						var assocName = navigationObject.associations.path[0].name;
						// collect assoicateions that were not collected  yet 
						if(!modelManager[constantsLib.propertiesEnum.rootObjectContext].assocNames.hasOwnProperty(assocName)) {
							modelManager[constantsLib.propertiesEnum.rootObjectContext].assocNames[assocName] = true;
							var assoc = modelManager.vocaRTServ.getAssociation(modelManager.vocabulary, navigationObject.root.name, navigationObject.associations.path[0].name, true);
							//skip 1:1 assocs
							if(vocabularyUtilLib.isCardinalityCollection(assoc.cardinality)) {
								for (i = 0; i < assoc.attrs.length; i++) {
									modelManager[constantsLib.propertiesEnum.rootObjectContext].assocs.push(assoc.attrs[i].source); // TBD - remove duplicates
								}
							}
						
						}
				}
			}	
		}
	};	
	
	///****************************************************************
	// * Get navigation object
	// ****************************************************************/
	parseUtilsLib.prototype.getNavigationObjectFromPath = function(navigationPath, key, modelManager) {
		//var modelManager = parseModelLib.getModelManger();
		var valueListAttr = modelManager.getValueListAttribute();
		var vocaName = modelManager.vocabulary;
		var navigationObject = vocabularyUtilLib.validateNavigationDetails(navigationPath, modelManager.vocaRTServ, vocaName, [], valueListAttr, modelManager.termMode);
		navigationObject.isParameter = false;
		modelManager.setCurrentNavigationObject(key, navigationObject);
		
		this.validateRootObjectContext(navigationObject, modelManager);
	
		return modelManager.getCurrentNavigationObject(key);


	};	

	////Handling errors
	//parseUtilsLib.prototype.handleErrorValidation = function (errorDescription) {
	//  parseModelLib.parseResult.status =  constantsLib.statusEnum.ERROR;
	//  parseModelLib.parseResult.errorDetails.push(errorDescription);
	//    //throw new Error(errorDescription);
	//    //throw errorDescription;
	//};

	//check if a string ends with a particular character
	parseUtilsLib.prototype.endsWith = function(str, suffix) {
		return str.indexOf(suffix, str.length - suffix.length) !== -1;
	};

	// Verify we have exactly X argument
	parseUtilsLib.prototype.validateNumberOfArguments = function(arguments_length, expectedNumberOfArgs, contextObjectType) {
		if (arguments_length !== expectedNumberOfArgs) {
			this.handleWarning(contextObjectType + ":  incompatible number of required arguments, exactly " + expectedNumberOfArgs.toString() + "arguments required.");
			return false;
		}
		return true;
	};

	// Verify input argument exists
	parseUtilsLib.prototype.validateArgumentExist = function(argumentsArray, contextObjectType) {
		if (!argumentsArray || !(typeof argumentsArray === 'object')) {
			this.handleWarning(contextObjectType + ": incompatible number of required arguments.");
			return false;
		}
		return true;
	};


	/****************************************************************
	 * Verify input arguments types are as required
	 * Input - 
	    argument     - the value to be validate 
	    argName      - argument name for the error message
	    argTypes     - array of types which the argument could be
	    argTypeNames - array of types names for the error message
	    contextObjectType - context object name for error message
	 * Output - boolean (valid or not)
	 ****************************************************************/
	parseUtilsLib.prototype.validateArgumentType = function(argument, argName, argTypes, argTypeNames, contextObjectType) {
		var errorMsg = contextObjectType + ": " + argName + " input arg must be instance of ";
		var valid = false;
		var baseObject;
		var i;
		for (i = 0; i < argTypes.length; ++i) {
			errorMsg += argTypeNames[i];

			if (i < argTypes.length - 1) {
				errorMsg += " or ";
			}

			baseObject = argTypes[i];
			if (argument instanceof baseObject) {
				valid = true;
			}
		}
		errorMsg += ".";
		if (!valid) {
			this.handleWarning(errorMsg);
		}

		return valid;
	};

	/****************************************************************
	 * Verify several arguments types are as required
	 * Input -
	 * arguments - input arguments
	 * contextObjectType - context object name for error message
	 * argumentsInfo - array of arguments to be validate, with all the needed information:
	 *      name: argName,
	 *      type: [array of types which the argument could be],
	 *      typeName[array of types names
	 *      for the error message],
	 *      required: < true / false >
	 * Output - boolean (valid or not)
	 ****************************************************************/
	parseUtilsLib.prototype.validateArgumentsType = function(argumentsArray, contextObjectType, argumentsInfo) { // argumentsInfo = [arg1 = {name, type[], typeName[], required}, , , ...]

		var valid = this.validateArgumentExist(argumentsArray, contextObjectType);
		if (!valid) {
			return false;
		}

		var i, argName, value;
		for (i = 0; i < argumentsInfo.length; ++i) {
			argName = argumentsInfo[i].name;
			if (!(argumentsArray.hasOwnProperty(argName))) {
				if (argumentsInfo[i].required) {
					this.handleWarning(contextObjectType + ": incompatible number of required arguments.");
					return false;
				}
				continue;
			}

			if (argumentsInfo[i].hasOwnProperty("type")) {
				value = argumentsArray[argName];
				if (this.validateArgumentType(value, argName, argumentsInfo[i].type, argumentsInfo[i].typeName, contextObjectType) === false) {
					valid = false;
				}
			}
		}

		return valid;
	};

	/**********************************************************************
	 * Add properties to an instance
	 * Input -
	 * instance - add the properties to
	 * arguments - input arguments
	 * propertiesArray - array of properties to add
	 **********************************************************************/
	parseUtilsLib.prototype.isEmptyString = function(str) {
		if (/\S/.test(str)) {
			return false;
		}
		return true;
	};



	parseUtilsLib.prototype.getTokensStartWithString = function(parser, str) {

		var tokens = parser.getTokenNames();
		var modelManger = parser.parseModelLib.getModelManger();
		var token_names = this.getTokensDisplayMap(modelManger);
		var retTokens = [];


		var i, token, tokenAlias;
		for (i = 0; i < tokens.length; ++i) {
			token = tokens[i];
			tokenAlias = (token_names.hasOwnProperty(token) ? token_names[token] : token);

			if (tokenAlias === undefined || tokenAlias === null) {
				continue;
			}

			tokenAlias = tokenAlias.toLowerCase();

			if (tokenAlias.indexOf(str)===0) {
				retTokens.push(tokenAlias);
			}
		}

		return retTokens;

	};



	parseUtilsLib.prototype.getTokensNames = function(parser, optionalTokens) {

		var tokens = parser.getTokenNames();
		var modelManger = parser.parseModelLib.getModelManger();
		var token_names = this.getTokensDisplayMap(modelManger); //will be replaced with new token mechanism
		var retTokens = [];
		var tempRetTokens = [];

		var optTokens = utilsLib.removeDuplicate(optionalTokens);
		var i, t, token, tokenName, tokenAlias, res;
		for (i = 0; i < optTokens.length; i++) {
			t = optTokens[i];

			if (t === undefined || t === '-1' || t === -1 || t === '-2' || t === -2){
				continue;
			}

			token = tokens[t];

			if (token.indexOf("PARAMETER") !== -1 || token.indexOf("TYPECOLLECTION") !== -1 || token.indexOf("DT") !== -1) {
				continue;
			}

			if (token.indexOf("COLLECTION") !== -1) {
				tokenName = token.split("COLLECTION");
				token = tokenName[0];
			}

			tokenAlias = (token_names.hasOwnProperty(token) ? token_names[token] : token);

			if (tokenAlias === undefined || tokenAlias === null) {
				continue;
			}

			tokenAlias = tokenAlias.toLowerCase();
			tempRetTokens.push("'" + tokenAlias + "' ");

			res = tokenAlias.split("type");
			if (res.length > 1 && !token_names.hasOwnProperty(res[1])) {
				retTokens.push(" " + res[1]);
			}
		}

		retTokens = this.sortAndRemoveDuplicates(retTokens);

		if (retTokens.length) {
			retTokens[0] = retTokens[0].substring(1);
		}else if (tempRetTokens.length && tempRetTokens.length <= 3 && retTokens.length === 0) {
			tempRetTokens[tempRetTokens.length - 1] = tempRetTokens[tempRetTokens.length - 1].replace(/\s?$/, '');
			return tempRetTokens;
		}
		

		return retTokens;

	};



	parseUtilsLib.prototype.isFirstErrorAfterWS = function(parser) {
		var inputTokens = parser.input.tokens;
		var i;
		for (i = 0; i < inputTokens.length; i++) {
			if (inputTokens[i].type !== parserTokens.WS) {
				break;
			}
		}

		if (i === parser.errorIndex) {
			return true;
		}

		return false;
	};
	
	parseUtilsLib.prototype.getLastTokenTypeAndIgnoreWS = function(parser) {
		var inputTokens = parser.input.tokens;
		var i = inputTokens.length;
		
		if (i === 0) {
			return -1;
		}
		
		for (i = i-1 ; i >= 0; i--) {
			if ( inputTokens[i].type !== parserTokens.WS  && inputTokens[i].type !== parserTokens.NAVIGATION && inputTokens[i].channel !==  org.antlr.runtime.Token.HIDDEN_CHANNEL) {
				break;
			}
		}
		
		return (i === -1) ? -1: inputTokens[i].type;
	};


	parseUtilsLib.prototype.getLastTokenAndIgnoreWS = function(parser) {
		var inputTokens = parser.input.tokens;
		var i = inputTokens.length;
		
		if (i === 0) {
			return -1;
		}
		
		for (i = i-1 ; i >= 0; i--) {
			if ( inputTokens[i].type !== parserTokens.WS  && inputTokens[i].channel !==  org.antlr.runtime.Token.HIDDEN_CHANNEL) {
				break;
			}
		}
		
		return (i === -1) ? null: inputTokens[i];
	};

	parseUtilsLib.prototype.isTokenOnlyPartOfRealToken = function(parser, tokenType) {
		return (tokenType === parserTokens.IS_A || 
				tokenType === parserTokens.EOF || 
				(parser.lexerErrorOccurred && tokenType === parserTokens.WS) || 
				tokenType === parserTokens.NAVIGATION ||
				tokenType === parserTokens.NOT ||
				tokenType === parserTokens.IS ||
				tokenType === parserTokens.DOES ||
				tokenType === parserTokens.AVERAGE ||
				tokenType === parserTokens.COUNTD ||
				tokenType === parserTokens.FILTER ||
				tokenType === parserTokens.SUM || 
				tokenType === parserTokens.ENDS ||
				tokenType === parserTokens.STARTS ||
				tokenType === parserTokens.MAXIMUM ||
				tokenType === parserTokens.MINIMUM ||
				tokenType === parserTokens.EXIST || 
				tokenType === parserTokens.EXISTS ||
				tokenType === parserTokens.TO ||
				tokenType === parserTokens.THE);		
	};
	
	parseUtilsLib.prototype.isLastTokenPartialText = function(parser) {
		var lastToken = this.getLastTokenAndIgnoreWS(parser);
		if (lastToken === null) { 
			return false;
		}
		if (lastToken.type === parserTokens.NAVIGATION || lastToken.text === undefined) { 
			return true;
		}

		return (this.isTokenOnlyPartOfRealToken(parser, lastToken.type));
	};

	parseUtilsLib.prototype.isErrorTokenPartialText = function(parser, errorToken) {
		if (errorToken === parserTokens.EOF) {
			return false;
		}
		if (errorToken === parserTokens.NAVIGATION) {
			return true;
		}

		return (this.isTokenOnlyPartOfRealToken(parser, errorToken));
	};

	parseUtilsLib.prototype.getTokenTypeOfFirstErrorAfterWS = function(error) {
		var inputTokens = error.input.tokens;
		var i = error.token.index;
		while (i < inputTokens.length && inputTokens[i].type === parserTokens.WS) {
			i++;
		}
		return inputTokens[i].type;
	};

	parseUtilsLib.prototype.hasWhiteSpace = function(s) {
		var index = s.lastIndexOf(' ');
		return index >= 0 && index !== (s.length - 1);
	};

	parseUtilsLib.prototype.overwriteParserReportErrorAutocompleteModeFailedDFA = function(parser, parsingOutputInfo) {
		/*eslint consistent-this: ["error", "me"]*/
		var me = this;
		parser.reportError = function(error) {
			
			// if it is an DFA error we handle it in DFA cases. DFA means rule that contains several rule options and uses the predict function.  
			// parser's DFA_decisions array holds all these rules. If the failed rule belongs to this group we want to loop on all options to get them as suggestions in auto complete
			// this is done by parseUtilsLib.handleFailedDFA function. 
			if (error.decisionNumber !== undefined && utilsLib.isInArray(error.decisionNumber, this.DFA_decisions)) {
				me.handleAllDFAOptions(parser, error.decisionNumber);
			} else {
				// Once parsingOutputInfo.isPartialText is set to true it remains true
				parsingOutputInfo.isPartialText = parsingOutputInfo.isPartialText || me.isErrorTokenPartialText(this, error.c);
			}

			throw new hrfException.HrfException ();
		};
	};

	parseUtilsLib.prototype.overwriteParserReportErrorValidateModeFailedDFA = function(parser) {
		/*eslint consistent-this: ["error", "me"]*/
		var me = this;
		parser.reportError = function(error) {

			// if it is an DFA error we handle it in DFA cases. DFA means rule that contains several rule options and uses the predict function.  
			// parser's DFA_decisions array holds all these rules. If the failed rule belongs to this group we want to loop on all options to get them as suggestions in auto complete
			// this is done by parseUtilsLib.handleFailedDFA function. 
			if (error.decisionNumber !== undefined && utilsLib.isInArray(error.decisionNumber, this.DFA_decisions)) {
				me.handleAllDFAOptions(parser, error.decisionNumber);
			} else {
				if (error.charPositionInLine && (error.charPositionInLine === -1 || (parser.errorIndex !== -1 && error.charPositionInLine >= parser.errorIndex))) {
					parser.tokenError = parser.getTokenErrorDisplay(error.token);
					parser.errorTokenType = error.token.type;


					if ((error.charPositionInLine === -1 && parser.errorIndex !== -1) || (error.charPositionInLine !== -1 && error.charPositionInLine > parser.errorIndex)) {
						parser.outputTokens.nextTokens = [];
					}

					parser.errorIndex = error.charPositionInLine;

					
				}
			}
			throw new hrfException.HrfException ();
		};
	};


	/****************************************************************
	 * check if the type is collection
	 ****************************************************************/
	parseUtilsLib.prototype.isCollection = function(type) {

		if (type === parserTokens.TYPEBOOLEANCOLLECTION ||
			type === parserTokens.TYPETIMEINTERVALCOLLECTION ||
			type === parserTokens.TYPENUMBERCOLLECTION ||
			type === parserTokens.TYPESTRINGCOLLECTION ||
			type === parserTokens.TYPEDATECOLLECTION ||
			type === parserTokens.TYPETIMESTAMPCOLLECTION ||
			type === parserTokens.TYPETIMECOLLECTION ||
			type === parserTokens.TYPEBOOLEANDT ||
			type === parserTokens.TYPETIMEINTERVALDT ||
			type === parserTokens.TYPENUMBERDT ||
			type === parserTokens.TYPESTRINGDT ||
			type === parserTokens.TYPEDATEDT ||
			type === parserTokens.TYPETIMESTAMPDT ||
			type === parserTokens.TYPETIMEDT) {
			return true;
		}

		return false;
	};
	parseUtilsLib.prototype.getLocaleTypeFormatArray = function(typeArray, modelManager){
		var formatArray=[];
		var formats = this.getLocaleFormat(modelManager, false);
		var i;
		for (i = 0; i < typeArray.length; i++) {
			if(typeArray[i].indexOf('timestamp')>=0){formatArray.push(formats.TIMESTAMPSTRING);}
			else if(typeArray[i].indexOf('time')>=0){ formatArray.push(formats.TIMESTRING);}
			else if(typeArray[i].indexOf('date')>=0) {formatArray.push(formats.DATESTRING);}
		} 
		return formatArray;
	};
	parseUtilsLib.prototype.overwriteParserReportErrorValidateMode = function(parser, modelManager) {
		/*eslint consistent-this: ["error", "me"]*/
		
		var me = this;
		parser.reportError = function(A) {
			modelManager.parseResult.status = constantsLib.statusEnum.ERROR;

			var possibleTokens = []; // array of the next possible tokens
			parser.tokenError = null;
			parser.errorIndex = null;
			parser.errorTokenType = null;
			var error_msg = {};
			error_msg.key = "";
			error_msg.args = [];


			if (A instanceof org.antlr.runtime.UnwantedTokenException && A.expecting === -1) {
				parser.errorIndex = A.charPositionInLine;
				parser.tokenError = parser.getTokenErrorDisplay(A.getUnexpectedToken());
				error_msg.key = "error_in_expression_invalid_token_message";
				error_msg.args[0] = parser.tokenError;
			} else {

				if (A instanceof org.antlr.runtime.NoViableAltException) {
					if (utilsLib.isInArray(A.decisionNumber, this.DFA_decisions)) {
						me.handleFailedDFA(parser, A);
						possibleTokens = parser.lastExpecting.expecting;
					} else {
						possibleTokens = A.grammarDecisionDescription.slice();
						parser.tokenError = (parser.tokenError === null ? parser.getTokenErrorDisplay(A.token) : parser.tokenError);
						parser.errorIndex = (parser.errorIndex === null ? A.charPositionInLine : parser.errorIndex);
					}
				} else if (A instanceof org.antlr.runtime.MismatchedSetException) {
					possibleTokens = A.expecting.slice();
					parser.errorIndex = A.charPositionInLine;
					parser.tokenError = parser.getTokenErrorDisplay(A.token);
				} else if (possibleTokens.length === 0 && A instanceof org.antlr.runtime.MismatchedTokenException) {
					possibleTokens.push(A.expecting);
					parser.errorIndex = A.charPositionInLine;
					parser.tokenError = parser.getTokenErrorDisplay(A.token);
				}

				parser.errorIndex = (parser.errorIndex === null ? 0 : parser.errorIndex);
				if (parser.errorIndex === 0 || me.isFirstErrorAfterWS(parser)) {
					if (me.isCollection(parser.input.tokens[parser.errorIndex].type) &&
							(!modelManager.flags[constantsLib.propertiesEnum.isCollection])) {			  
						error_msg.key = "error_in_expression_single_value_missing_message";
						error_msg.args[0] = parser.getTokenErrorDisplay(A.token);
					} else {
						error_msg.key = "error_in_expression_invalid_statement_message";
						error_msg.args[0] = parser.getTokenErrorDisplay(A.token);
					}
				} else if (parser.tokenError !== null && (parser.tokenError.match("EOF") || parser.tokenError.indexOf("EOF") !== -1)) {
					//tokenNames = getTokensNames(parser, possibleTokens);
					error_msg.key = "incomplete_expression_message";

				} else {
					var errorTokenType = parser.errorTokenType !== null ? parser.errorTokenType : me.getTokenTypeOfFirstErrorAfterWS(A);
					var tokenNames = me.getTokensNames(parser, possibleTokens);

					if (tokenNames.length) {
						if(tokenNames[0].indexOf('timestamp')>=0 || tokenNames[0].indexOf('time')>=0 || tokenNames[0].indexOf('date')>=0){
								error_msg.key = "error_in_expression_enter_suggestions_format_instead_message";
								error_msg.args[0] = tokenNames;
								error_msg.args[1] = me.getLocaleTypeFormatArray(tokenNames,modelManager);
								error_msg.args[2] = parser.tokenError;
						}else if (tokenNames[0].indexOf('string')>=0 && (errorTokenType === parserTokens.INT || errorTokenType === parserTokens.DECIMAL)) {
								error_msg.key = "error_in_expression_enter_string_in_single_quotes_instead_message";
								error_msg.args[0] = parser.tokenError;
								error_msg.args[1] = utilsLib.removeSingleQuotes(parser.tokenError);
						}else{
								error_msg.key = "error_in_expression_enter_suggestions_instead_message";
								error_msg.args[0] = tokenNames;
								error_msg.args[1] = parser.tokenError;
						}

					} else {
						error_msg.key = "error_in_expression_invalid_entry_message";
						error_msg.args[0] = parser.tokenError;
					}

					if ((errorTokenType !== null && errorTokenType !== undefined && (me.isCollection(errorTokenType))) && (utilsLib.isInArray(parserTokens.TYPEBOOLEAN, possibleTokens) || utilsLib.isInArray(parserTokens.TYPEDATE, possibleTokens) || utilsLib.isInArray(parserTokens.TYPETIMEINTERVAL, possibleTokens) || utilsLib.isInArray(parserTokens.TYPENUMBER, possibleTokens) || utilsLib.isInArray(parserTokens.TYPESTRING, possibleTokens) || utilsLib.isInArray(parserTokens.TYPETIME, possibleTokens) || utilsLib.isInArray(parserTokens.TYPETIMESTAMP, possibleTokens))) {
						var errorTokenName = parser.getTokenNames()[errorTokenType].toLowerCase();
						var tokenName = errorTokenName.split("collection");
						var tokenType = tokenName[0].split("type");
						tokenType = tokenType[1];

						tokenType = (tokenType === "date" ? "valid date" : tokenType);
						if (utilsLib.isInArray(tokenType + " ", tokenNames) || utilsLib.isInArray(" " + tokenType, tokenNames) || utilsLib.isInArray(tokenType, tokenNames)) {
							error_msg.key = "error_in_expression_single_value_missing_message";
							error_msg.args[0] = parser.tokenError;
						}
					}
				}
			}

			modelManager.parseResult.cursorPosition = parser.errorIndex;
			me.handleError(error_msg.key, error_msg.args, modelManager);
			throw new hrfException.HrfException ();

		};
	};


	parseUtilsLib.prototype.overwriteLexerReportError = function(parser, lexer, modelManager) {
		/*eslint consistent-this: ["error", "me"]*/
		
		var me = this;
		lexer.reportError = function(A) {
			modelManager.parseResult.status = constantsLib.statusEnum.ERROR;
			parser.lexerErrorStartIndex = A.input.markers[1].charPositionInLine;

			var length;
			var inString;
			var cursorPosition = A.charPositionInLine;
			var lastText = "";
			var error_msg = {};
			error_msg.key = "";
			error_msg.args = [];
			
			if (parser.lexerErrorOccurred === false) {

				parser.lexerErrorOccurred = true;
				if (A instanceof org.antlr.runtime.NoViableAltException || 
					A instanceof org.antlr.runtime.MismatchedSetException ||
					A instanceof org.antlr.runtime.MismatchedRangeException) {
					
					length = parser.input.tokens.length;
					inString = A.input.data;
					if (length > 0) {
						var startIndex = parser.input.tokens[length - 1].stop + 1;
						lastText = inString.substring(startIndex, A.charPositionInLine);
					} else {
						lastText = inString.substring(0, A.charPositionInLine);
					}
					lastText = lastText.replace(/\s\s+/g, ' '); //Remove all multiple spaces
				}
				
				var completeTokens = me.getTokensStartWithString(parser, lastText);
				completeTokens = me.sortAndRemoveDuplicates(completeTokens);
				var completeTokensString = "";
				var i = 0;
				var space = "";
				for (i = 0; i < completeTokens.length; i++) {
					completeTokensString += space + "'" + completeTokens[i] + "'";
					space = ", ";
				}

				if (lastText.indexOf("EOF") !== -1) {
					error_msg.key = "error_in_expression_missing_token_at_the_end_of_the_expression_message";
					error_msg.args[0] = completeTokensString;
				} else {
					error_msg.key = "error_in_expression_missing_token_message";
					error_msg.args[0] = completeTokensString;
					error_msg.args[1] = lastText;

				}

				if (A instanceof org.antlr.runtime.MismatchedTokenException) {
					error_msg.args[0] = this.getCharErrorDisplay(A.expecting);

					if (this.getCharErrorDisplay(A.c).indexOf("EOF") !== -1) {
						error_msg.key = "error_in_expression_missing_token_at_the_end_of_the_expression_message";
					} else {
						error_msg.key = "error_in_expression_missing_token_message";
						error_msg.args[1] = this.getCharErrorDisplay(A.c);
					}
				}
				
				if(A instanceof org.antlr.runtime.MismatchedRangeException){
					var regex = new RegExp(/^\d(\d|\.|\,)*?$/);
					if(regex.test(lastText)){
						error_msg.key = "error_in_expression_enter_suggestions_format_instead_message_two_cases";
						error_msg.args[0] = lastText;
						error_msg.args[1] = 'number';
						error_msg.args[2] = me.getLocaleFormat(modelManager, false).DECIMAL;
						error_msg.args[3] = 'date';
						error_msg.args[4] = me.getLocaleFormat(modelManager, false).DATESTRING;
						
						
						if(length > 0){
							cursorPosition = parser.input.tokens[length - 1].start;
						}
						else
						{
							cursorPosition = 0;
						}
					}
				}

			}

			modelManager.parseResult.cursorPosition = cursorPosition;
			me.handleError(error_msg.key, error_msg.args, modelManager);

			throw new hrfException.HrfException ();
		};
	};


	// add leading zeros before a number 
	parseUtilsLib.prototype.zeroPad = function(num, places) {
		var zero = places - num.toString().length + 1;
		return [].constructor(+(zero > 0 && zero)).join("0") + num;
	};

	//TBD: delete this method once all date/time conversions will be implemented in conversionUtils Lib !!!
	parseUtilsLib.prototype.isTimeString = function(str, timeFormat) {
		str = str.replace(/[']+/g, '');
		var timePattern = null;
		if (timeFormat === this.TimeFormatEnum.HHMISS) {
			timePattern = /^(T?)(?:2[0-3]|[01]?[0-9]):[0-5][0-9]:[0-5][0-9](Z?)$/;
		} else if (timeFormat === this.TimeFormatEnum.HHMISSAMPM) {
			timePattern = /^(T?)(?:2[0-3]|[01]?[0-9]):[0-5][0-9]:[0-5][0-9](Z?)( )+[AP]M$/;
		}
		return timePattern.test(str);
	};

	//TBD: delete this method once all date/time conversions will be implemented in conversionUtils Lib !!!
	parseUtilsLib.prototype.isTimestampString = function(str, dateFormat, timeFormat) {
		str = str.replace(/[']+/g, '');
		var timestamPattern = null;
		if (dateFormat === this.DateFormatEnum.MMDDYYYY) {
			if (timeFormat === this.TimeFormatEnum.HHMISS) {
				timestamPattern = /^(0?[1-9]|1[012])[\-\/.](0?[1-9]|[12][0-9]|3[01])[\-\/.](19|20)\d\d[\ \T](?:2[0-3]|[01]?[0-9]):[0-5][0-9]:[0-5][0-9](Z?)$/;
			} else if (timeFormat === this.TimeFormatEnum.HHMISSAMPM) {
				timestamPattern = /^(0?[1-9]|1[012])[\-\/.](0?[1-9]|[12][0-9]|3[01])[\-\/.](19|20)\d\d[\ \T](?:2[0-3]|[01]?[0-9]):[0-5][0-9]:[0-5][0-9](Z?)( )+[AP]M$/;
			}
		} else if (dateFormat === this.DateFormatEnum.DDMMYYYY) {
			if (timeFormat === this.TimeFormatEnum.HHMISS) {
				timestamPattern = /^(0?[1-9]|[12][0-9]|3[01])[\-\/.](0?[1-9]|1[012])[\-\/.](19|20)\d\d[\ \T](?:2[0-3]|[01]?[0-9]):[0-5][0-9]:[0-5][0-9](Z?)$/;
			} else if (timeFormat === this.TimeFormatEnum.HHMISSAMPM) {
				timestamPattern = /^(0?[1-9]|[12][0-9]|3[01])[\-\/.](0?[1-9]|1[012])[\-\/.](19|20)\d\d[\ \T](?:2[0-3]|[01]?[0-9]):[0-5][0-9]:[0-5][0-9](Z?)( )+[AP]M$/;
			}
		} else if (dateFormat === this.DateFormatEnum.YYYYMMDD) {
			if (this.timeFormat === this.TimeFormatEnum.HHMISS) {
				timestamPattern = /^(19|20)\d\d[\-\/.](0?[1-9]|1[012])[\-\/.](0?[1-9]|[12][0-9]|3[01])[\ \T](?:2[0-3]|[01]?[0-9]):[0-5][0-9]:[0-5][0-9](Z?)$/;
			} else if (timeFormat === this.TimeFormatEnum.HHMISSAMPM) {
				timestamPattern = /^(19|20)\d\d[\-\/.](0?[1-9]|1[012])[\-\/.](0?[1-9]|[12][0-9]|3[01])[\ \T](?:2[0-3]|[01]?[0-9]):[0-5][0-9]:[0-5][0-9](Z?)( )+[AP]M$/;
			}
		}
		return timestamPattern.test(str);
	};


	parseUtilsLib.prototype.convertTo24Hour = function(time) {
		var newTime = time.toLowerCase();
		var hours = parseInt(newTime.substr(0, 2), 10);
		if (newTime.indexOf('am') !== -1 && hours === 12) {
			newTime = newTime.replace('12', '0');
		}
		if (newTime.indexOf('pm') !== -1 && hours < 12) {
			newTime = newTime.replace(hours, (hours + 12));
		}
		return newTime.replace(/(am|pm)/, '');
	};

	//TBD: delete this method once all date/time conversions will be implemented in conversionUtils Lib !!!
	parseUtilsLib.prototype.buildHanaDateString = function(str, dateFormat, timeFormat) {
		str = str.replace(/[']+/g, '');
		var s = str.split(/[\.\-\/T ]/);
		var hanaDate = ""; //YYYY-MM-DD HH24:MI:SS.FF7  2012-12-12 16:38:46.339
		var hanaTime = "00:00:00.000000";
		switch (dateFormat) {
			case this.DateFormatEnum.MMDDYYYY:
				hanaDate = this.zeroPad(s[2], 4) + "-" + this.zeroPad(s[0], 2) + "-" + this.zeroPad(s[1], 2);
				break;
			case this.DateFormatEnum.DDMMYYYY:
				hanaDate = this.zeroPad(s[2], 4) + "-" + this.zeroPad(s[1], 2) + "-" + this.zeroPad(s[0], 2);
				break;
			case this.DateFormatEnum.YYYYMMDD:
				hanaDate = this.zeroPad(s[0], 4) + "-" + this.zeroPad(s[1], 2) + "-" + this.zeroPad(s[2], 2);
				break;
		}

		var timeIndex = 0;
		if (dateFormat !== "") {
			timeIndex = 3;
		} else if (str.indexOf('T') === 0) {
			timeIndex = 1;
		}


		switch (timeFormat) {
			case this.TimeFormatEnum.HHMISS:
				hanaTime = s[timeIndex] + ".000000";
				break;
			case this.TimeFormatEnum.HHMISSAMPM:
				hanaTime = this.convertTo24Hour(s[timeIndex]) + ".000000";
				break;
		}
		var space = "";
		if (hanaDate !== "") {
			space = " ";
		}
		return "'" + hanaDate + space + hanaTime + "'";
	};


	parseUtilsLib.prototype.updateTokenType = function(term, modelManager) {
		var res = term.type;
		//var modelManager = parseModelLib.getModelManger();
		var contextLength = modelManager.contextQueue.length;
		if (contextLength === 0) {
			return res;
		}

		var currentContext = modelManager.contextQueue[contextLength - 1];
		if (currentContext.root.isAlias || currentContext.root.isParameter) {
			return res;
		}

		var nav = term.expression;
		if (term.type === parserTokens.NAVIGATION) {

			var contextSplit = currentContext.navigation.split(".");

			// In case of collection of DOs - player.session
			if (currentContext.attribute.isValid) {
				contextSplit.pop();
			}

			var navigationPath = (contextSplit.length === 0) ? currentContext.navigation + "." + nav : contextSplit.join(".") + "." + nav;
			var returneNavdObj = this.getNavigationObjectFromPath(navigationPath, nav, modelManager);
			var newType = this.getNavigationObjectType(returneNavdObj);
			if (newType !== null) {
				res = this.getSingleTokenType(newType);
				return res;
			}

		}

		//is Collection
		if (this.isCollection(nav.type)) {

			var navSplit = nav.split(".");
			nav = navSplit[0];
			if (currentContext.root.name !== navSplit[0]) {
				return res;
			}


			var i = 1;
			while (i < navSplit.length && i <= currentContext.associations.path.length && navSplit[i] === currentContext.associations.path[i - 1].name) {
				nav = currentContext.associations.path[i - 1].object;
				i++;
			}

			for (i; i < navSplit.length; i++) {
				nav = nav + "." + navSplit[i];
			}


			var navigationObject = vocabularyUtilLib.validateNavigationDetails(nav, modelManager.vocaRTServ, modelManager.vocabulary, []);
			if (navigationObject.isCollection) {
				return res;
			}
			res = this.getSingleTokenType(term.type);
		}

		return res;
	};
	
	
	parseUtilsLib.prototype.advancedFunctions = {
			round: "round",
			power: "power",
			sin:   "sin",
			cos:   "cos",
			log:   "log",
			'pattern': "textSearch",
			'with a fuzzy score of': "textSearch",
			'occurrences containing pattern': "textSearch"
	};
	
	
	parseUtilsLib.prototype.handleAllDFAOptions = function(parser, decisionNumber) { //autoCompleteParserFailedPredict
		//$.trace.error("handleFailedDFA: decisionNumber - " + error.decisionNumber);
		//$.trace.error("handleFailedDFA: parser.expecting - " + parser.expecting);
		var dfaNumberOfAlt = 'dfa' + decisionNumber + 'NumberOfAlt';
		var dfaAltNumber = 'dfa' + decisionNumber + 'AltNumber';
		var failedPredictDFA = 'failedPredictDFA' + decisionNumber;
		var DFAInRule = 'dfa' + decisionNumber + 'InRule';
		var mark = 'dfa' + decisionNumber + 'Mark';
		//$.trace.error("handleFailedDFA: Mark  -  " +parser[mark]);


		//$.trace.error("handleFailedDFA: altNumber -  " + parser[dfaNumberOfAlt]);
		parser[failedPredictDFA] = true;
		var i = 0,
			ruleName;
		for (i = 1; i < (parser[dfaNumberOfAlt] + 1); i++) {
			try {
				parser.setPred(true);
				parser[dfaAltNumber] = i;
				parser.input.rewind(parser[mark]);
				ruleName = parser[DFAInRule];
				parser[ruleName + "_DFAcall"] = true;
				parser[ruleName]();
			} catch (ignore) {
				// do nothing
			}
		}
	};

	parseUtilsLib.prototype.handleFailedDFA = function(parser, error, parsingOutputInfo) { //autoCompleteParserFailedPredict

		if (parser.mode === constantsLib.AUTOCOMPLETE_MODE || parser.mode === constantsLib.AUTOCOMPLETE_MODE_LOWERCASE) {
			this.overwriteParserReportErrorAutocompleteModeFailedDFA(parser, parsingOutputInfo);
		} else if (parser.mode === constantsLib.PARSE_MODE || parser.mode === constantsLib.VALIDATE_MODE) {
			this.overwriteParserReportErrorValidateModeFailedDFA(parser);
		}

		this.handleAllDFAOptions(parser, error.decisionNumber);
	};
	
	
	return {
		parseUtilsLib: parseUtilsLib
	};
}());
