jQuery.sap.declare("sap.rules.ui.parser.businessLanguage.lib.parsingBackendMediator");

jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.resources.dependencies.lib.constantsBase");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.parseModel");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.parseUtils");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.parameterRuntimeServices");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.IDPLexer");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.IDPParser");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.autoCompleteUtils");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.parserTokens");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.antlr3_all_min");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderFactory");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.conversionUtils");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.valueHelpValidator");

sap.rules.ui.parser.businessLanguage.lib.parsingBackendMediator = sap.rules.ui.parser.businessLanguage.lib.parsingBackendMediator|| {}; 
sap.rules.ui.parser.businessLanguage.lib.parsingBackendMediator.lib = (function() {


	var parseUtils = sap.rules.ui.parser.businessLanguage.lib.parseUtils.lib;
	var parseUtilsLib = new parseUtils.parseUtilsLib();
	var constantsLib = sap.rules.ui.parser.businessLanguage.lib.constants.lib;
	var dependenciesConstantsLib = sap.rules.ui.parser.resources.dependencies.lib.constantsBase.lib;
	var parseModel = sap.rules.ui.parser.businessLanguage.lib.parseModel.lib;
	var parseModelLib = new parseModel.parseModelLib();
	var paramRuntimeServices = sap.rules.ui.parser.resources.vocabulary.lib.parameterRuntimeServices;
	var autoCompleteUtils = sap.rules.ui.parser.businessLanguage.lib.autoCompleteUtils.lib;
	var autoCompleteUtilsLib = new autoCompleteUtils.autoCompleteUtilsLib();
	var vocaRuntimeServicesFactory = sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderFactory.lib;
	var runtimeServicesLib = new vocaRuntimeServicesFactory.vocaDataProviderFactoryLib();
	//Workaround - we must add a namespace to the lexer/parser
	var IDPLexer = sap.rules.ui.parser.businessLanguage.lib.IDPLexer.lib;
	//var IDPLexer = lexerLib.IDPLexer;vocaDataProviderFactoryLib
	var IDPParser = sap.rules.ui.parser.businessLanguage.lib.IDPParser.lib;
	//var IDPParser = parserLib.IDPParser;
	var conversionUtils = sap.rules.ui.parser.businessLanguage.lib.conversionUtils.lib;
	var conversionUtilsLib = new conversionUtils.conversionUtilsLib();

	var org = sap.rules.ui.parser.businessLanguage.lib.antlr3_all_min.lib;
	//var org = antlrLib.org;

	var parserTokens = sap.rules.ui.parser.businessLanguage.lib.parserTokens.lib;

	var valueHelpValidatorLib = sap.rules.ui.parser.businessLanguage.lib.valueHelpValidator.lib;

	function parsingBackendMediatorLib() {}
		
		
	parsingBackendMediatorLib.prototype.getRELType = function getRELType(inputType, flags) {
		var type;

		type = (inputType === undefined || inputType === null) ? constantsLib.TYPE_ALL : inputType;

		if(flags !== null && flags !== undefined && flags[constantsLib.propertiesEnum.isCollection] === true){
			type = parseUtilsLib.getCollectionRelTypeFromBusinessDT(type);
		}

		return type;
	};
	
	parsingBackendMediatorLib.prototype.parseExpression = function(expression, mode, vocaRTServ, paramServ, type, vocabulary, flags) {
		
		// This utility will change ',' to ';' in old expressions
		function changeCommaToSemicolonUtil (originalExpression, flags)
		{
			var returnExpression = "";
			
			var localeFlagsExist = flags && flags.hasOwnProperty (constantsLib.propertiesEnum.locale);
			var isConvertFromCodeToDisplay =
				flags && flags.hasOwnProperty (constantsLib.propertiesEnum.locale) &&
				flags[constantsLib.propertiesEnum.locale].hasOwnProperty (constantsLib.propertiesEnum.convert) &&
			flags[constantsLib.propertiesEnum.locale][constantsLib.propertiesEnum.convert].hasOwnProperty (constantsLib.propertiesEnum.source) &&
			flags[constantsLib.propertiesEnum.locale][constantsLib.propertiesEnum.convert].hasOwnProperty (constantsLib.propertiesEnum.target) &&
			(flags[constantsLib.propertiesEnum.locale][constantsLib.propertiesEnum.convert][constantsLib.propertiesEnum.source] === constantsLib.CODE_TEXT) &&
			(flags[constantsLib.propertiesEnum.locale][constantsLib.propertiesEnum.convert][constantsLib.propertiesEnum.target] === constantsLib.DISPLAY_TEXT);
			if (!localeFlagsExist || isConvertFromCodeToDisplay)
			{ // We need to change only if there are no flags (Native flow, S/4 compilation)
			  // or conversion from CodeText to DisplayText (Loading in SP09 UI rule taht was created in SP08)	
				var isBetweenQuotas = false;
				var isSemicolon = false;
				var changedExpression = "";
				var indx = '';
				
				if (typeof originalExpression !== 'string')
				{
					returnExpression = originalExpression;
				}
				else
				{ // originalExpression is String
					for (indx in originalExpression)
					{ // Go over the expression char by char
						if (originalExpression.hasOwnProperty (indx))
						{
							if (!originalExpression[indx])
							{
								continue;
							}
							
							// Nullify the changetoSemicolon flag in each iteration
							isSemicolon = false;
							
							switch (originalExpression[indx])
							{
								case "'": // open/close a quota in expression
									isBetweenQuotas = !isBetweenQuotas;
									break;
								case ",": // change comma to semicolon if not between quotas
									if (isBetweenQuotas === false)
									{
										isSemicolon = true;
									}
									break;
							} // End of Switch
							
							// Add appropriate character to returned expression
							if (isSemicolon === true)
							{
								changedExpression += ';';
							}
							else
							{
								changedExpression += originalExpression[indx];
							}
						} // End of If (originalExpression.hasOwnProperty (indx))
					} // End of For
					returnExpression = changedExpression;
				} // End of Else (originalExpression is String)
			} // End of If
			else
			{
				returnExpression = originalExpression;
			}
			return returnExpression;
		}
		
		try {
			jQuery.sap.log.debug("ParsingBackendMediator expression to parse: " + expression);
			

			var modelManager = parseModelLib.createModelManger();
			

			modelManager.vocaRTServ = vocaRTServ;
			modelManager.vocabulary = vocabulary;
			modelManager.mode = mode;
			modelManager.paramServ = paramServ;
			modelManager.flags = (flags === undefined || flags === null) ? {} : flags;

			type = this.getRELType(type, flags); 
			
			// Change ',' to ';' in old expressions
			expression = changeCommaToSemicolonUtil (expression, flags);
			
			var originalExpression = expression;
			// Initialize parser for use with the relevant library

			if (expression !== null && (expression !== undefined)) {
				expression = expression.toString();
				expression = expression.replace(/(\r\n|\n|\r)/gm, " ");
				expression = expression.replace(/\\/g, "\\\\");
			}
			
			if (expression === null || expression === undefined || parseUtilsLib.isBlank(expression)) {
				var result = {};
				result.status = constantsLib.statusEnum.SUCCESS;

				if (mode === constantsLib.TOKEN_TYPES || (modelManager.flags.hasOwnProperty(constantsLib.propertiesEnum.tokens) && modelManager.flags[constantsLib.propertiesEnum.tokens] === true)) {
					result.tokens = [];
					if (expression !== null && expression !== undefined) {
						var n = originalExpression.length;
						var tokenType = new parseUtilsLib.TokenInfo(originalExpression, constantsLib.tokenTypesEnum.whitespace, null, 0, n);
						result.tokens.push(tokenType);
					}
				}

				if (mode === constantsLib.VALIDATE_MODE || mode === constantsLib.PARSE_MODE) {
					result.errorDetails = null;
					result.model = null;
					result.cursorPosition = null;
					result.actualReturnType = constantsLib.TYPE_ALL;
					if ((modelManager.flags.hasOwnProperty(constantsLib.propertiesEnum.conversionOutput) &&
							((modelManager.flags[constantsLib.propertiesEnum.conversionOutput] === constantsLib.conversionOutputEnum.toKeys) || 
									(modelManager.flags[constantsLib.propertiesEnum.conversionOutput] === constantsLib.conversionOutputEnum.toDescriptions)))   
									|| (flags && flags.hasOwnProperty (constantsLib.propertiesEnum.locale) &&
											flags[constantsLib.propertiesEnum.locale].hasOwnProperty (constantsLib.propertiesEnum.convert))){	
					
						result.convertedExpression = originalExpression;
					}
					return result;
					
				} else if (mode === constantsLib.TOKEN_TYPES) {
					return result;
				}

			}
			
			modelManager.expression = expression; 
			
			var cstream = new org.antlr.runtime.ANTLRStringStream(expression);
			var lexer = new IDPLexer(cstream);

			lexer.displayRecognitionError = function(A, B) {
				var errorHeader = lexer.getErrorHeader(B);
				var errorMessage = lexer.getErrorMessage(B, A);
				parseUtilsLib.handleWarning(errorHeader + " " + errorMessage);
			};

			var tstream = new org.antlr.runtime.CommonTokenStream(lexer);
			var parser = new IDPParser(tstream);
			parser.mode = mode; //set mode
			 

			parser.displayRecognitionError = function(A, B) {
				var errorHeader = parser.getErrorHeader(B);
				var errorMessage = parser.getErrorMessage(B, A);
				parseUtilsLib.handleWarning(errorHeader + " " + errorMessage);
			};

			var responseObject = {};
			var tokens = {};
			// Check which functionality is needed from the Mediator and execute
			
			switch (mode) {
				case constantsLib.AUTOCOMPLETE_MODE:
				case constantsLib.AUTOCOMPLETE_MODE_LOWERCASE:
					jQuery.sap.log.debug("mode autocomplete");
					/*
					if (modelManager && modelManager.hasOwnProperty(constantsLib.propertiesEnum.flags)
							&& modelManager[constantsLib.propertiesEnum.flags] && modelManager[constantsLib.propertiesEnum.flags].hasOwnProperty(constantsLib.propertiesEnum.locale)
							&& modelManager[constantsLib.propertiesEnum.flags][constantsLib.propertiesEnum.locale] && modelManager[constantsLib.propertiesEnum.flags][constantsLib.propertiesEnum.locale].hasOwnProperty(constantsLib.propertiesEnum.convert)){
						$.trace.error("mode autocomplete - Convert flag with locale flag not supported");
						responseObject.suggs = {};
						return responseObject;
					}
					*/
					responseObject.suggs = JSON.parse(autoCompleteUtilsLib.getNextSuggestions(expression, lexer, parser, vocaRTServ, type));
					if (modelManager.flags.hasOwnProperty(constantsLib.propertiesEnum.tokens) && modelManager.flags[constantsLib.propertiesEnum.tokens] === true) {
						responseObject.tokens = parseUtilsLib.buildTokenTypes(parser, originalExpression, modelManager);
					}
					jQuery.sap.log.debug("ParsingBackendMediator: autocomplete responseObject: " + responseObject);
					return responseObject;	
				case constantsLib.PARSE_MODE:
				case constantsLib.VALIDATE_MODE:
					jQuery.sap.log.debug("mode validate");
					parseUtilsLib.parseWithValidation(lexer, parser, type, parseModelLib.getModelManger())	;	
					responseObject = parseModelLib.getModelManger().parseResult.getParseResults();
					
					if (modelManager.flags.hasOwnProperty(constantsLib.propertiesEnum.tokens) && modelManager.flags[constantsLib.propertiesEnum.tokens] === true) {
						responseObject.tokens = parseUtilsLib.buildTokenTypes(parser, originalExpression, modelManager);
					}
					if (modelManager.flags.hasOwnProperty (constantsLib.propertiesEnum.valueHelp) &&
						(responseObject.status === constantsLib.statusEnum.SUCCESS) )
					{ // handle external Value Help
						valueHelpValidatorLib.handleExternalValueHelp (parser,
								originalExpression, modelManager, responseObject);	
					}
					if (conversionUtilsLib.needsConversion(modelManager)) {
						// Convert value list to keys or to description
						tokens = responseObject.tokens || parseUtilsLib.buildTokenTypes(parser, originalExpression, modelManager);
						responseObject.convertedExpression = conversionUtilsLib.convert(vocaRTServ, vocabulary, modelManager, tokens, originalExpression);
					}
					if (modelManager.flags.hasOwnProperty(constantsLib.propertiesEnum.rootObjectContext) &&
						 modelManager.flags[constantsLib.propertiesEnum.rootObjectContext] === true) {
						responseObject.rootObjectContext = null;
						if(responseObject.status === constantsLib.statusEnum.SUCCESS) {
							responseObject.rootObjectContext = {};
							responseObject.rootObjectContext.name = modelManager[constantsLib.propertiesEnum.rootObjectContext].name;
							responseObject.rootObjectContext.associations = modelManager[constantsLib.propertiesEnum.rootObjectContext].assocs;
						}
						
					}
					
					return responseObject;
				case constantsLib.TOKEN_TYPES:
					jQuery.sap.log.debug("mode token types");
					parseUtilsLib.parseWithValidation(lexer, parser, type, parseModelLib.getModelManger())	;				
					responseObject.tokens = parseUtilsLib.buildTokenTypes(parser, originalExpression, modelManager);
					responseObject.status = constantsLib.statusEnum.SUCCESS;

					return responseObject;
				default:
					parseUtilsLib.handleError("Unknown mode", null, parseModelLib.getModelManger());
					responseObject = parseModelLib.getModelManger().parseResult.getParseResults();
					return responseObject;
			}

		} catch (err) {
			parseModelLib.getModelManger().parseResult.status = constantsLib.statusEnum.ERROR;
			jQuery.sap.log.error("ParsingBackendMediator error: " + err);
			return parseModelLib.getModelManger().parseResult.getParseResults();
		}
	};
	
	parsingBackendMediatorLib.prototype.convertExpressionToKeys = function(expression, vocaRTServ, parameters, type, vocabulary, flags) {
		var extendedFlags = {};
		if (flags) {
			extendedFlags = flags;
		}
		extendedFlags[constantsLib.propertiesEnum.conversionOutput] = constantsLib.conversionOutputEnum.toKeys;

		return this.parseExpression(expression, constantsLib.VALIDATE_MODE, vocaRTServ, parameters, type, vocabulary, extendedFlags);
	};	
	
	parsingBackendMediatorLib.prototype.convertExpressionToDescriptions = function(expression, vocaRTServ, parameters, type, vocabulary, flags) {
		var extendedFlags = {};
		if (flags) {
			extendedFlags = flags;
		}
		extendedFlags[constantsLib.propertiesEnum.conversionOutput] = constantsLib.conversionOutputEnum.toDescriptions;

		return this.parseExpression(expression, constantsLib.VALIDATE_MODE, vocaRTServ, parameters, type, vocabulary, extendedFlags);
	};

	parsingBackendMediatorLib.prototype.parseInputRT = function(expression, mode, vocaRTServ, parameters, type, vocabulary, flags) {
		var paramServ = null;
		if (parameters) {
			paramServ = new paramRuntimeServices.ParameterRuntimeServices(parameters, vocaRTServ, vocabulary);
		}

		return this.parseExpression(expression, mode, vocaRTServ, paramServ, type, vocabulary, flags);
	};

	parsingBackendMediatorLib.prototype.parseInput = function(expression, mode, connection, parameters, type, vocabulary, flags) {
		var vocaRTServ = null;

		vocaRTServ = runtimeServicesLib.getVocabularyDataProvider();

		return this.parseInputRT(expression, mode, vocaRTServ, parameters, type, vocabulary, flags);
	};

	/****************************************************************
	 * Function: isReservedWord
	 * clarification:
	 * 				validate single word, ignore spaces.
	 * 				validate first word
	 *
	 * INPUT: string
	 *
	 * OUTPUT:
	 * 				true  - in case the word is a reserved word, REL constant, for example, 'average', 'is'...
	 * 				false
	 *
	 ****************************************************************/
	parsingBackendMediatorLib.prototype.isReservedWord = function(str) {
		
		var modelManager = parseModelLib.getModelManger();
		modelManager.clearModelData();
		modelManager.parseResult.clear();
		
		str = str.split(' ')[0]; //get first word with no spaces.

		var cstream = new org.antlr.runtime.ANTLRStringStream(str);
		var lexer = new IDPLexer(cstream);
		var tstream = new org.antlr.runtime.CommonTokenStream(lexer);
		var parser = new IDPParser(tstream);

		var result = true;

		parser.reportError = function(A) {
			if ((parser.input.tokens.length > 0) && (parser.input.tokens[0].type === parserTokens.NAVIGATION || parser.input.tokens[0].type === parserTokens.TYPEATTRIBUTE || parser.input.tokens[0].type === parserTokens.INT || parser.input.tokens[0].type === parserTokens.STRING || parser.input.tokens[0].type === parserTokens.ANYCHAR || parser.input.tokens[0].type === undefined || parser.input.tokens[0].type === null)) {
				result = false;
			}
		};

		lexer.reportError = function(A) {
			if ((parser.input.tokens.length > 0) && (parser.input.tokens[0].type === parserTokens.NAVIGATION || parser.input.tokens[0].type === parserTokens.TYPEATTRIBUTE || parser.input.tokens[0].type === parserTokens.INT || parser.input.tokens[0].type === parserTokens.STRING || parser.input.tokens[0].type === undefined || parser.input.tokens[0].type === null)) {
				result = false;
			}
		};

		parser.dummyRule();
		return result;
	};

	/****************************************************************
	 * Function: validateAndGetExpressionActualReturnType - validates
	 *
	 * INPUT: connection, expression, voca and optional parameters
	 *
	 * OUTPUT: {
	 *             type: <Number/String/Date/Boolean/NumberCollection/Collection..> (REL return type),
	 *             dataObject: <object name> -> filled in case of type collection (i.e. collection of objects),
	 *             isValid: <true/false>,
	 *             businessDT: <Number/String/Date/Boolean/Time/TimeSpan/Timeptamp>,
	 *             isCollection: <true/false>,
	 *             firstUnknownToken: <string> (filled in case of valid = false, and lexer error -> get first unknown error),
	 *             errorDetails: <string>
	 *           }
	 *
	 ****************************************************************/


	parsingBackendMediatorLib.prototype.validateAndGetExpressionActualReturnTypeRT = function(vocaRTServ, expression, vocabulary, paramServ, raiseError, inFlags) {
		var result = {
			type: null,
			dataObject: null,
			businessDataType: null,
			unknownTokens: {},
			isCollection: false,
			errorDetails: null,
			isValid: false,
			dependenciesOutput: {}
		};

		if (paramServ === undefined) {
			paramServ = null;
		}

		var flags; 
		if (inFlags){
			flags = inFlags;
		} else {
			flags = {};
			flags[constantsLib.propertiesEnum.unknownTokens] = true;
			flags[dependenciesConstantsLib.PROPERTY_NAME_DEPENDENCIES_OUTPUT] = true;
		}
		if (raiseError !== undefined && raiseError === false) {
			flags[constantsLib.propertiesEnum.raiseError] = false;
		}

		var parseResult = this.parseExpression(expression, constantsLib.VALIDATE_MODE, vocaRTServ, paramServ, constantsLib.TYPE_ALL, vocabulary, flags);
		
		if(parseResult.actualReturnType)
		{
		jQuery.sap.log.debug(parseResult.actualReturnType);
		}
		

		if (parseResult.status === constantsLib.statusEnum.ERROR) {
			result.errorDetails = parseResult.errorDetails;
			result.unknownTokens = parseResult[constantsLib.propertiesEnum.unknownTokens];
			return result;
		}

		result.type = parseResult.actualReturnType;
		result.dataObject = (parseResult.hasOwnProperty(constantsLib.attributesNamesEnum.dataObject) ? parseResult.dataObject : null);
		result.isValid = true;

		var typeObj = parseUtilsLib.getBusinessDTFromRelType(result.type);
		result.isCollection = typeObj[constantsLib.propertiesEnum.isCollection];
		result.businessDataType = typeObj[constantsLib.propertiesEnum.businessType];
		result.dependenciesOutput = (parseResult.hasOwnProperty(dependenciesConstantsLib.PROPERTY_NAME_DEPENDENCIES_OUTPUT) ? parseResult.dependenciesOutput : {});
		
		if (parseResult.hasOwnProperty(constantsLib.propertiesEnum.convertedExpression)) {
			result.convertedExpression = parseResult.convertedExpression;
		}
	
		return result;

	};

	parsingBackendMediatorLib.prototype.validateAndGetExpressionActualReturnType = function(connection, expression, vocabulary, parameters, raiseError, flags) {
		var vocaRTServ = null;
		var paramServ = null;

		vocaRTServ = runtimeServicesLib.getVocabularyDataProvider();
	
		if (connection){
			if (parameters) {
				paramServ = new paramRuntimeServices.ParameterRuntimeServices(parameters, vocaRTServ, vocabulary);
			}
		}	

		return this.validateAndGetExpressionActualReturnTypeRT(vocaRTServ, expression, vocabulary, paramServ, raiseError, flags);
	};

	parsingBackendMediatorLib.prototype.validateExpression = function(connection, expression, vocabulary, mode, type, parameters) {

		var parseResult = this.parseInput(expression, mode, connection, parameters, type, vocabulary);
		var result = {
			status: parseResult.status,
			errorDetails: parseResult.errorDetails
		};

		return result;
	};

	parsingBackendMediatorLib.prototype.validateAndGetExpressionModel = function(connection, expression, vocabulary, mode, type, parameters) {

		var parseResult = this.parseInput(expression, mode, connection, parameters, type, vocabulary);
		return parseResult.model;
	};

	parsingBackendMediatorLib.prototype.getRELDependencies = function(connection, expression, vocabulary, parameters) {

		var flags = {};
		flags[dependenciesConstantsLib.PROPERTY_NAME_DEPENDENCIES_OUTPUT] = true;
		var parseResult = this.parseInput(expression, constantsLib.VALIDATE_MODE, connection, parameters, constantsLib.TYPE_ALL, vocabulary, flags);
		return parseResult[dependenciesConstantsLib.PROPERTY_NAME_DEPENDENCIES_OUTPUT];
	};

	parsingBackendMediatorLib.prototype.handleParse = function(inputJSON) {

		if (!inputJSON.hasOwnProperty("expression")) {
			//parseUtilsLib.handleError("no expression");
			return parseModelLib.getModelManger().parseResult.getParseResults();
		}

		if (!inputJSON.hasOwnProperty("vocabulary")) {
			//$.trace.error("no vocabulary");
			//return null;
			inputJSON.vocabulary = null;
		}

		if (!inputJSON.hasOwnProperty("mode")) {
			//$.trace.error("no mode");
			inputJSON.mode = constantsLib.VALIDATE_MODE;
		}

		if (!inputJSON.hasOwnProperty("returnType")) {
			//$.trace.error("no type");
			inputJSON.returnType = constantsLib.TYPE_ALL;
		}

		if (!inputJSON.hasOwnProperty("parameters")) {
			//$.trace.error("no parameters");
			inputJSON.parameters = null;
		}

		if (!inputJSON.hasOwnProperty(constantsLib.propertiesEnum.flags)) {
			//$.trace.error("no flags");
			inputJSON.flags = {};
		}

		//return this.isReservedWord(inputJSON.expression);
		//return this.validateAndGetExpressionActualReturnType(inputJSON.connection, inputJSON.expression, inputJSON.vocabulary);
		return this.parseInput(inputJSON.expression, inputJSON.mode, inputJSON.connection, inputJSON.parameters, inputJSON.returnType, inputJSON.vocabulary, inputJSON.flags);

	};
	return {
		parsingBackendMediatorLib: parsingBackendMediatorLib
	};

}());
