jQuery.sap.declare("sap.rules.ui.parser.businessLanguage.lib.autoCompleteUtils");

jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.parseModel");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.parseUtils");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.vocabularyUtils");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.parserTokens");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.utils");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.antlr3_all_min");
jQuery.sap.require("sap.rules.ui.parser.infrastructure.errorHandling.hrfException"); 
 
sap.rules.ui.parser.businessLanguage.lib.autoCompleteUtils = sap.rules.ui.parser.businessLanguage.lib.autoCompleteUtils|| {}; 
sap.rules.ui.parser.businessLanguage.lib.autoCompleteUtils.lib = (function() {
	var parseUtils = sap.rules.ui.parser.businessLanguage.lib.parseUtils.lib;
	var parseUtilsLib = new parseUtils.parseUtilsLib();
	var constantsLib = sap.rules.ui.parser.businessLanguage.lib.constants.lib;
	var vocabularyUtil = sap.rules.ui.parser.businessLanguage.lib.vocabularyUtils.lib;
	var vocabularyUtilLib = new vocabularyUtil.vocabularyUtilsLib();
	var parserTokens = sap.rules.ui.parser.businessLanguage.lib.parserTokens.lib;
	var parseModel = sap.rules.ui.parser.businessLanguage.lib.parseModel.lib;
	var parseModelLib = new parseModel.parseModelLib();
	var utilsLib = new sap.rules.ui.parser.businessLanguage.lib.utils.lib();
	var org = sap.rules.ui.parser.businessLanguage.lib.antlr3_all_min.lib;
	var hrfException = sap.rules.ui.parser.infrastructure.errorHandling.hrfException.lib;

	function autoCompleteUtilsLib() {

	}

	


	
	/****************************************************************************************************************************
	 * Function: replaceWithVarNames
	 * Desc:   Update technical token names by applicative names
	 * INPUT: 
	 * OUTPUT:  
	****************************************************************************************************************************/	
	/*autoCompleteUtilsLib.prototype.replaceWithVarNames = function(parser) {

		var tokenNames = parser.getTokenNames();
		var prop = null;
		var modelManger = parser.parseModelLib.getModelManger();
		var tokenMap = parseUtilsLib.getTokensDisplayMap(modelManger);
		for (prop in tokenMap) {
			// in case applicative map contains the entry - override the technical token name by applicative name later 
			// used in suggestions formatting
			if (tokenMap.hasOwnProperty(prop)) {
				if (utilsLib.isInArray(prop, tokenNames)) {
					tokenNames[tokenNames.indexOf(prop)] = tokenMap[prop];
				}
			}

		}
		return;
	};*/
	
	
	/****************************************************************************************************************************
	 * Function: overwriteParserReportError
	 * 			parser.reportError
	 * INPUT: 	Add an error handler function to the parser. in case of parsing error this method will collect
				the next possible tokens according to the error type
	 * OUTPUT: parser tokens, is partial completion 
	 ****************************************************************************************************************************/	
	
	autoCompleteUtilsLib.prototype.overwriteParserReportError = function(parser, parsingOutputInfo) {
		parser.reportError = function(A) {
			// $.trace.debug("Autocopmlete: reportError - " + A);

			function setParsingOutputInfoForAutoComplete() {
				parseModelLib.getModelManger().setDFAFailed(true);
				parsingOutputInfo.contextInfo.valueListAttribute = parseModelLib.getModelManger().getValueListAttribute();
				parsingOutputInfo.contextInfo.isDeprecatedAllContext = parseModelLib.getModelManger().isAllContext() ;
				parsingOutputInfo.contextInfo.isTermAllContext = parseModelLib.getModelManger().isTermAllContext();
			}

			function setParserContext() {
				parseModelLib.getModelManger().cleanValueListAttribute();
				parser.isInsideWhere = ((parser.isInsideWhere !== undefined && parser.isInsideWhere === true) ? true : parseModelLib.getModelManger().isInsideWhere);
				parser.disableAliases = ((parser.disableAliases !== undefined && parser.disableAliases === true) ? true : parseModelLib.getModelManger().disableAliases);
	
				var contextLength = parseModelLib.getModelManger().contextQueue.length;
				if (contextLength > 0) {
					var currentContext = parseModelLib.getModelManger().contextQueue[contextLength - 1];
					var nuOfAssosc = currentContext.associations.path.length;
					var contextDO = (nuOfAssosc > 0) ? currentContext.associations.path[nuOfAssosc - 1].object : currentContext.root.name;
					parser.context = currentContext.root.isAlias ? null : contextDO;
					parser.fullContext = currentContext;
					parser.contextWasFound = true;
				} else {
					if (parser.hasOwnProperty("contextWasFound") === false || parser.contextWasFound === false) {
						parser.context = null;
						parser.fullContext = null;
						parser.isInsideWhere = null;
					}
				}
			}

// In case of lexer error lastText was determined earlier (in lexer report error) so here we set lastText to last token. Icase of navigation it consists of few tokens and therefore 
// we need to look for the beginning of navigation
			function setExpressionLastText() {
				if (!parser.lexerErrorOccurred) {
					parsingOutputInfo.lastText = A.input.tokenSource.input.data;
					if (!(A.input.tokens.length === undefined || A.input.tokens.length === 0)) {
						var ind = A.input.tokens.length - 1;
						var lastTokenEndIndex = A.input.tokens[A.input.tokens.length - 1].stop + 1;
						var lastTokenStartIndex = A.input.tokens[A.input.tokens.length - 1].start;
						for (ind; ind >= 0; ind--) {
							if (A.input.tokens[ind].channel !== org.antlr.runtime.Token.HIDDEN_CHANNEL && A.input.tokens[ind].type === parserTokens.NAVIGATION) {
								lastTokenStartIndex = A.input.tokens[ind].start;
								break;
							}
						}
						parsingOutputInfo.lastText = parsingOutputInfo.lastText.substring(lastTokenStartIndex, lastTokenEndIndex);
					}
				}
			}
			
			function handleErrorExceptions() {
				///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
				// NoViableAltException 
				// Indicates that the parser could not decide which of two or more paths to take based upon the remaining input. In that case try each of them.
				///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////		
				if (A instanceof org.antlr.runtime.NoViableAltException || 
						(A instanceof org.antlr.runtime.RecognitionException && !(A instanceof org.antlr.runtime.UnwantedTokenException))) {
					// if it is an DFA error we handle it in DFA cases. DFA means rule that contains several rule options and uses the predict function.  
					// parser's DFA_decisions array holds all these rules. If the failed rule belongs to this group we want to loop on all options to get them as suggestions in auto complete
					// this is done by parseUtilsLib.handleFailedDFA function. 
					if (utilsLib.isInArray(A.decisionNumber, parser.DFA_decisions)) {
						parseUtilsLib.handleFailedDFA(parser, A, parsingOutputInfo);
					}
				}
				//mismatched input exceptions such as when the current input does not match the expected token.
				// We were expecting a token but it's not found. The current token may be partial token and is actually what we wanted next.
				else if (A instanceof org.antlr.runtime.MismatchedTokenException) {
					if (A instanceof org.antlr.runtime.UnwantedTokenException) {
						parsingOutputInfo.isPartialText = parsingOutputInfo.isPartialText || parseUtilsLib.isLastTokenPartialText(parser);
					}

				}
			}
			
			setParsingOutputInfoForAutoComplete();
			setParserContext();
			setExpressionLastText();
			handleErrorExceptions();
			
			throw new hrfException.HrfException ();

		};


	};	
	
	/****************************************************************************************************************************
	 * Function: overwriteLexerReportError
	 * 			lexer.reportError
	 * INPUT:   Add an error handler function to the lexer. in case of parsing error this method will 
	            set the last text and set the partial text indicator
	 * OUTPUT: recognized partial input and its text (at the end of expression) 
	 * REMARKS: The NoViableAltException exception is thrown from the lexer  when it doesn't find a real token. There are tokens that are defined as fragment and are used as building blocks to other
	 * tokens like is, any.... In this case exception is thrown and this is obviously a case of partial text.
	 * EarlyExitException is thrown from the lexer  when partial token is recognized but the rest does not match. Like "all of the" which is part of "all of the following is true"
	 * is recognized as "all of" and the rest does not match
	 *
	 ****************************************************************************************************************************/	
	autoCompleteUtilsLib.prototype.overwriteLexerReportError = function(lexer, parser, parsingOutputInfo) {	
		lexer.reportError = function(A) {
			if (parser.lexerErrorOccurred === false) {
	
				parser.lexerErrorOccurred = true;
				parser.lexerErrorStartIndex = A.input.markers[1].charPositionInLine;
	
				if (A instanceof org.antlr.runtime.NoViableAltException) {
					var inputString = A.input.data;
					parsingOutputInfo.lastText = inputString.substring(A.input.p, A.input.n);
					//parsingOutputInfo.partialText = "true";
					parsingOutputInfo.isPartialText = true;
	
				}
	
				if ((A instanceof org.antlr.runtime.MismatchedTokenException || A instanceof org.antlr.runtime.MismatchedSetException || A instanceof org.antlr.runtime.EarlyExitException) && A.c === -1) {
					var length = parser.input.tokens.length;
					if (length > 0) {
						var startIndex = parser.input.tokens[length - 1].stop + 1;
						var inString = A.input.data;
						parsingOutputInfo.lastText = inString.substring(startIndex, A.input.n);
					} else {
						parsingOutputInfo.lastText = A.input.data;
					}
					//parsingOutputInfo.partialText = "true";
					parsingOutputInfo.isPartialText = true;
				} else if (A.c === " ") {
					throw new hrfException.HrfException();
				}
	
			}
		};
	};
	/****************************************************************************************************************************
	 * Function: insertTermsAlternatives
	 * Desc:    format to string navigation-terms suggestions
	 * INPUT:   terms row suggestions +  formatting instructions
	 * OUTPUT:  
	 *
	 ****************************************************************************************************************************/	
	autoCompleteUtilsLib.prototype.insertTermsAlternatives = function(alts, name, prefix, comma) {
		var navSuggestions = "";
		var i;
		var completion;
		for (i = 0; i < alts.length; i++) {
			completion = (name === null) ? alts[i] : alts[i].substring(name.length);
			navSuggestions = navSuggestions + comma + '{"text":"' + alts[i] + 
							 '", "completion":"' + prefix + completion + '", "tokenType":"' + 
							  constantsLib.tokenTypesEnum.vocabulary + '"';
			navSuggestions = navSuggestions + '}';
			comma = ',';
		}
		return navSuggestions;
	};
	/****************************************************************************************************************************
	 * Function: insertOMAlternatives
	 * Desc:    format to string navigation-dataObjects/attributes/associations/aliases suggestions
	 * INPUT:   navigation row suggestions +  formatting instructions
	 * OUTPUT:  
	 *
	 ****************************************************************************************************************************/	
	autoCompleteUtilsLib.prototype.insertOMAlternatives = function(vocaRTServices, alts, name, prefix, comma, termMode) {
		
		var navSuggestions = "";
		var i;
		

		// Sort the suggestions
		alts.sort(function(a, b) {
			if (a.name > b.name) {
				return 1;
			}
			if (a.name < b.name) {
				return -1;
			}
			return 0;
		});

		var completion, info;
		//JSON.stringify deals with unicode bad characters in different languages. The stringify adds " at the beginning of the word and at the end so we need to get rid of them by substring
		var newName = JSON.stringify(name); 
		newName = newName.substring(1, newName.length-1);
		var newAltName;
		var orgnlAltName = null;
		for (i = 0; i < alts.length; i++) {
			if(alts[i].tokenType === 'vocabulary' && termMode === 'displayText'){
				orgnlAltName = alts[i].description;
			}
			else{
				orgnlAltName = alts[i].name;
			}
			//JSON.stringify deals with unicode bad characters in different languages. The stringify adds " at the beginning of the word and at the end so we need to get rid of them by substring
			newAltName = JSON.stringify(orgnlAltName);
			newAltName = newAltName.substring(1, newAltName.length-1);
			completion = (newName === null) ? newAltName : newAltName.substring(newName.length);
			
			//if external value help --> use <Value Help> template in the text and completion attribute
			if (this.navigationCompletionInfo.isValueListSuggestions) {
				if (vocaRTServices.getValueListType(parseModelLib.getModelManger().vocabulary, newAltName) === 'External') {
					newAltName = completion = "<Value Help>"; 
					prefix = "";
				}
			}
				
			info = (alts[i].info) ? JSON.stringify(alts[i].info) : null;
			navSuggestions = navSuggestions + comma + '{"text":"' + newAltName + 
			              '", "completion":"' + prefix + completion + '", "tokenType":"' + alts[i].tokenType + '"';
			
			// support additional information - for example value list additional information
			if (info) {
				navSuggestions = navSuggestions + ',' + '"info":' + info;
			}
			navSuggestions = navSuggestions + '}';
			comma = ',';
		}
		return navSuggestions;
	};
	
	
	
	/****************************************************************************************************************************
	 * Function: completeByValueListInLexerError
	 * Desc:   example: player.country = 'Isr
	 * INPUT: 
	 * OUTPUT:  
	 ****************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.completeByValueListInLexerError = function(vocaRTServices, parser) {
		
		var valListSuggestions = "";
		
		
		
		if (parser.lexerErrorOccurred) {
			var altValueList = vocabularyUtilLib.getAltValueListForValueListAttr(parseModelLib.getModelManger().vocabulary,
				vocaRTServices, this.parsingOutputInfo.contextInfo.valueListAttribute, this.parsingOutputInfo.lastText);

			if (altValueList.length > 0) {
				
				this.startSuggestionList() ;
				var delimiter = "";
				valListSuggestions += this.insertOMAlternatives(vocaRTServices, altValueList, this.parsingOutputInfo.lastText, "", delimiter, null);
				this.navigationCompletionInfo.isValueListSuggestions = true;
				this.strSuggestions += valListSuggestions;
				return true;
			}

		}
		return false;

	};
	
	/**
	 * Filtering attributes when last token is 'number of' or 'count of'
	 * @param lastToken
	 * @param types
	 * @param tokens
	 * @returns
	 */
	autoCompleteUtilsLib.prototype.filterTypes = function filterTypes(lastToken, types, tokens) {
		var filteredTypes = [];
		
		if (lastToken === parserTokens.COUNT_OF || lastToken === parserTokens.NUMBER_OF){
			filteredTypes[0] = tokens[parserTokens.TYPECOLLECTION].toLowerCase();
		}
		else{
			filteredTypes = types;
		}
		
		return filteredTypes;
	};
	
	/****************************************************************************************************************************
	 * Function: convertNavigationRELTypesToBusinessTypes
	 * Desc:   convert from REL navigation types ?(typestring, typenumber...) to 
	 *         businees types and information (string, Number...) later used for terms / vocabulary search for completion
	 * INPUT: 
	 * OUTPUT:  
	 ****************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.convertNavigationRELTypesToBusinessTypes = function(parser) {

		
		//Special use case: in association (esamption that token1 is not empty) - add to the this.parsingOutputInfo.allowedTypes the simple type
		//For example: TYPENUMBER in case of TYPENUMBERCOLLECTION
		var idx;
		//var objCollection
		var businessTypeObj;
		var businessTypeCollectionObj;
		
		var tokens = parser.getTokenNames();
		
		var types = utilsLib.removeDuplicate(this.parsingOutputInfo.allowedTypes);
		var lastToken = parseUtilsLib.getLastTokenTypeAndIgnoreWS(parser);
		types = this.filterTypes(lastToken, types, tokens);
		
		for (idx = 0; idx < types.length; idx++) {
			businessTypeObj = {};
			businessTypeCollectionObj = {};

			switch (types[idx]) {
				case tokens[parserTokens.TYPENUMBER].toLowerCase():
					businessTypeObj.isCollection = false;
					businessTypeObj.isDTAlias = false;
					businessTypeObj.type = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.INTEGER.string;
					break;
				case tokens[parserTokens.TYPEBOOLEAN].toLowerCase():
					businessTypeObj.isCollection = false;
					businessTypeObj.isDTAlias = false;
					businessTypeObj.type = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.BOOLEAN.string;
					break;
				case tokens[parserTokens.TYPESTRING].toLowerCase():
					businessTypeObj.isCollection = false;
					businessTypeObj.isDTAlias = false;
					businessTypeObj.type = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.STRING.string;
					break;
				case tokens[parserTokens.TYPEDATE].toLowerCase():
					businessTypeObj.isCollection = false;
					businessTypeObj.isDTAlias = false;
					businessTypeObj.type = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.DATE.string;
					break;
				case tokens[parserTokens.TYPETIME].toLowerCase():
					businessTypeObj.isCollection = false;
					businessTypeObj.isDTAlias = false;
					businessTypeObj.type = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.TIME.string;
					break;
				case tokens[parserTokens.TYPETIMESTAMP].toLowerCase():
					businessTypeObj.isCollection = false;
					businessTypeObj.isDTAlias = false;
					businessTypeObj.type = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.TIMESTAMP.string;
					break;
				case tokens[parserTokens.TYPETIMEINTERVAL].toLowerCase():
					businessTypeObj.isCollection = false;
					businessTypeObj.isDTAlias = false;
					businessTypeObj.type = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.TIMESPAN.string;
					break;
				case tokens[parserTokens.TYPENUMBERCOLLECTION].toLowerCase():
					businessTypeObj.isCollection = true;
					businessTypeObj.isDTAlias = false;
					businessTypeObj.type = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.INTEGER.string;
					break;
				case tokens[parserTokens.TYPEBOOLEANCOLLECTION].toLowerCase():
					businessTypeObj.isCollection = true;
					businessTypeObj.isDTAlias = false;
					businessTypeObj.type = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.BOOLEAN.string;
					break;
				case tokens[parserTokens.TYPESTRINGCOLLECTION].toLowerCase():
					businessTypeObj.isCollection = true;
					businessTypeObj.isDTAlias = false;
					businessTypeObj.type = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.STRING.string;
					break;
				case tokens[parserTokens.TYPEDATECOLLECTION].toLowerCase():
					businessTypeObj.isCollection = true;
					businessTypeObj.isDTAlias = false;
					businessTypeObj.type = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.DATE.string;
					break;
				case tokens[parserTokens.TYPETIMECOLLECTION].toLowerCase():
					businessTypeObj.isCollection = true;
					businessTypeObj.isDTAlias = false;
					businessTypeObj.type = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.TIME.string;
					break;
				case tokens[parserTokens.TYPETIMESTAMPCOLLECTION].toLowerCase():
					businessTypeObj.isCollection = true;
					businessTypeObj.isDTAlias = false;
					businessTypeObj.type = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.TIMESTAMP.string;
					break;
				case tokens[parserTokens.TYPETIMEINTERVALCOLLECTION].toLowerCase():
					businessTypeObj.isCollection = true;
					businessTypeObj.isDTAlias = false;
					businessTypeObj.type = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.TIMESPAN.string;
					break;
				case tokens[parserTokens.TYPENUMBERDT].toLowerCase():
					businessTypeObj.isCollection = true;
					businessTypeObj.isDTAlias = true;
					businessTypeObj.type = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.INTEGER.string;
					break;
				case tokens[parserTokens.TYPEBOOLEANDT].toLowerCase():
					businessTypeObj.isCollection = true;
					businessTypeObj.isDTAlias = true;
					businessTypeObj.type = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.BOOLEAN.string;
					break;
				case tokens[parserTokens.TYPESTRINGDT].toLowerCase():
					businessTypeObj.isCollection = true;
					businessTypeObj.isDTAlias = true;
					businessTypeObj.type = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.STRING.string;
					break;
				case tokens[parserTokens.TYPEDATEDT].toLowerCase():
					businessTypeObj.isCollection = true;
					businessTypeObj.isDTAlias = true;
					businessTypeObj.type = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.DATE.string;
					break;
				case tokens[parserTokens.TYPETIMEDT].toLowerCase():
					businessTypeObj.isCollection = true;
					businessTypeObj.isDTAlias = true;
					businessTypeObj.type = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.TIME.string;
					break;
				case tokens[parserTokens.TYPETIMESTAMPDT].toLowerCase():
					businessTypeObj.isCollection = true;
					businessTypeObj.isDTAlias = true;
					businessTypeObj.type = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.TIMESTAMP.string;
					break;
				case tokens[parserTokens.TYPETIMEINTERVALDT].toLowerCase():
					businessTypeObj.isCollection = true;
					businessTypeObj.isDTAlias = true;
					businessTypeObj.type = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.TIMESPAN.string;
					break;
				case tokens[parserTokens.TYPECOLLECTION].toLowerCase():
					businessTypeObj.isCollection = true;
					businessTypeObj.isDTAlias = false;
					businessTypeObj.type = null; //constantsLib.SIMPLE_SELECTION_VALUE_TYPE.COLLECTION.string;
					break;
				default:
					continue;
			}

			
			businessTypeCollectionObj = JSON.parse(JSON.stringify(businessTypeObj));
			if (businessTypeCollectionObj.isCollection !== true) {
			    // update parallel collectionTypes array for each simple types to be later used in 'dot' mode: 
			    // for completion of simple attributes inside where , when navigation path contains associations with 'many' cardinality
				// example: sum of player.session.duration where player.session.i => id
				businessTypeCollectionObj.isCollection = true;
				this.navigationCompletionInfo.collectionBusinessTypes.push(businessTypeObj); // tbd - is that a bug
			} else {
				this.navigationCompletionInfo.completeCollection = true;
			}

			this.navigationCompletionInfo.collectionBusinessTypes.push(businessTypeCollectionObj);
			this.navigationCompletionInfo.simpleBusinessTypes.push(businessTypeObj);

		}
	};
		
	

	/*********************************************************************************************************************************
	 * Function: calcSpacePrefixAdditionForNonNavigation
	 * INPUT: parser
	 * Desc: 'player is not ewhale and age of the player is not equal to 5' - requires space addition after 5
	 *        'player is not ewhale and age of the player is not equal to 5 ' - not require space addition after 5
	 * OUTPUT: space / empty
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.calcSpacePrefixAdditionForNonNavigation = function( parser) {
	
		if (!this.isPartialCompletion() &&
			!utilsLib.isEmptyArray(parser.input.tokens) &&
			parser.input.tokens[parser.input.tokens.length - 1].type !== parserTokens.WS /*23*/) {
				return " ";
			}
		
			
		return "";
	};
	
	/*********************************************************************************************************************************
	 * Function: calcSpacePrefixAdditionForNonNavigationCompletion
	 * INPUT: parser
	 * Desc: 'age of the play' - not require space addition after  
	 *        'age of the player' -  require space addition after 
	 * OUTPUT: space / empty
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.calcSpacePrefixAdditionForNavigation = function( parser) {
	
		if (!this.isPartialCompletion() &&
			!utilsLib.isEmptyArray(parser.input.tokens) &&
			parser.input.tokens[parser.input.tokens.length - 1].type !== parserTokens.WS /*23*/ &&
			parser.input.tokens[parser.input.tokens.length - 1].type !== parserTokens.NAVIGATION /*180*/ &&
			// spceial all token  already containing space
			parser.input.tokens[parser.input.tokens.length - 1].type !== parserTokens.ALL) {
					
			return " ";
		}
		
		return "";		
	
	};
	
	/*********************************************************************************************************************************
	 * Function: calculateNavigationStartText
	 * INPUT: calcualte last navigation text. Later  required for vocabaulry / terms search for partial navigation completion 
	 * Desc: 
	 * OUTPUT: 
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.calculateNavigationStartText = function( ) {
	
		if (this.isPartialCompletion() )
		{
			this.navigationCompletionInfo.navigationTextInput = this.parsingOutputInfo.lastText;
		}
		else
		{
			this.navigationCompletionInfo.navigationTextInput = "";
		}
			
	
	};
	
	/*******************************************************************************************************************************
	 * Function: isPartialCompleted
	 * INPUT: parser
	 * Desc: Parser always set partial text to true if the last token / char is not EOF (-1)
	 *       (i.e. error occured in the middle of a token before EOF was read)
	 * OUTPUT: true / false
	 *
	 *********************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.isPartialCompletion = function( ) {
	
		return this.parsingOutputInfo.isPartialText;
	};
	
	
	/*********************************************************************************************************************************
	 * Function: handleEmptyNextTokens
	 * INPUT: parser
	 * Desc : fine tuning of 'next parser tokens' 
	 * 1) use case 1: only lexer error occoured , example: "count" (i.e. partial of "count of") 
	 * OUTPUT: 
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.handleEmptyNextTokens = function( parser) {
	
		
		// in case parser next tokens are empty verify check the reason and updated them accordingly  
		if (utilsLib.isEmptyArray(this.parsingOutputInfo.nextTokens)) {
			
			
			// 1) first option: expression end with partial text and lexer error occourded , "count" (i.e. partial of "count of") 
			// (next tolens are not updated in parser, since they are updated only during error handling of parser error)
			// Enable all possible REL tokens (later most of tokens will be excluded by partial completion string comparison)
			// for example: "co" => enabl
			if (this.isPartialCompletion() && parser.lexerErrorOccurred ) {
				this.parsingOutputInfo.nextTokens = parser.getTokenNames();
				this.parsingOutputInfo.allTokens = true;
			}
			
		}
		
	};	
	
	/*********************************************************************************************************************************
	 * Function: disableToken
	 * INPUT: 
	 * Desc : decide if to enable/diable token according to HRF 'diable tokens' policy  
	 * OUTPUT: true / false
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.disableToken = function( vocaRTServices, parser, tokenName, tokenID, modelManger) {
	
		var diableToken = false;
		//disable from autocomplete
		var tokenMap = parseUtilsLib.getTokensDisplayMap(modelManger);
		diableToken = 
			(  (tokenName === tokenMap.DOT && parseUtilsLib.endsWith(this.parsingOutputInfo.lastText.toLowerCase(), ' '))
		    || (tokenName === tokenMap.COUNT_OF)
		    || (tokenName === tokenMap.MAXIMUM_OF)
		    || (tokenName === tokenMap.MINIMUM_OF)
		    || (tokenName === tokenMap.FIRST)
		    || (tokenName === tokenMap.LAST) 
		    || (tokenID === parserTokens.CURRENT && !parser.isInsideWhere) 
		    || (tokenName === tokenMap.EQ_SIGN)
		    || (tokenName === tokenMap.NOT_EQUAL_SIGN)
		    || (tokenName === tokenMap.GREATER_EQUAL_SIGN)
		    || (tokenName === tokenMap.LESS_EQUAL_SIGN) 
		    || (tokenName === tokenMap.GREATER_SIGN)
		    || (tokenName === tokenMap.LESS_SIGN)
		    || (tokenName === tokenMap.EQUALS)
		    || (tokenName === tokenMap.DOES_NOT_EQUAL)
		    || (tokenName === tokenMap.NOT_EQUAL)
		    || (tokenName === tokenMap.ZERO_OR_ONE)
		    || (tokenID === parserTokens.CURRENT && this.parsingOutputInfo.contextInfo.isDeprecatedAllContext === false && !this.parsingOutputInfo.contextInfo.isTermAllContext)
		    || (tokenID === parserTokens.ALL_OF_OBJ)
		    || (tokenID === parserTokens.ALL && !vocaRTServices.isTermModifierEmpty(parseModelLib.getModelManger().vocabulary))
		    || (tokenID === parserTokens.OF && !vocaRTServices.isTermModifierEmpty(parseModelLib.getModelManger().vocabulary))
		    || (tokenID === parserTokens.CURRENT && !vocaRTServices.isCurrentTermModifierEmpty(parseModelLib.getModelManger().vocabulary))
		    ) ;
		
		return diableToken;
		
	};
	
	/*********************************************************************************************************************************
	 * Function: disableAdvancedFunctions
	 * INPUT: 
	 * Desc : decide if to enable/diable token according to HRF 'diable tokens' policy  
	 * OUTPUT: true / false
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.disableAdvancedFunctions = function( vocaRTServices, tokenName) {
	
		var allowedAdvancedFunctions = vocaRTServices.getAdvancedFunctions(parseModelLib.getModelManger().vocabulary);

		if (!parseUtilsLib.advancedFunctions.hasOwnProperty(tokenName)) {
			return false;
		} 
		
		var i;
		for (i=0; i<allowedAdvancedFunctions.advancedFunctions.length; i++) {
			if (allowedAdvancedFunctions.advancedFunctions[i].name === parseUtilsLib.advancedFunctions[tokenName]) {
				return false;
			}
		}
		
		return true;
	};
	
	/*********************************************************************************************************************************
	 * Function: disableGreaterOrLessThenOps
	 * INPUT: 
	 * Desc : decide if to enable/disable greater then or less Then token according to last token type
	 * OUTPUT: true / false
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.disableGreaterOrLessThenOps = function(tokenID, parser) {
		if(tokenID === parserTokens.IS_EQUAL_OR_GREATER_THAN || tokenID === parserTokens.IS_GREATER_THAN || tokenID === parserTokens.GREATER_THAN ||
				tokenID === parserTokens.IS_EQUAL_OR_LESS_THAN || tokenID === parserTokens.IS_LESS_THAN || tokenID === parserTokens.LESS_THAN  ){
			var lastToken = parseUtilsLib.getLastTokenTypeAndIgnoreWS(parser);
			if ( lastToken === parserTokens.TYPETIME || lastToken === parserTokens.TYPEDATE || lastToken === parserTokens.TYPETIMESTAMP){
				return true;
			}
		}
		
		return false;
	};
	
	/*********************************************************************************************************************************
	 * Function: disableDateTimeFormatsForString
	 * INPUT: 
	 * Desc : For string we allow dates/ time for operators conrains, like, starts with, ends with and their negatives but we don't want to show the formats in autoComplete
	 * OUTPUT: true / false
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.disableDateTimeFormatsForString = function(tokenName, nextTokensArray, modelManger) {
	
		var diableToken = false;
		//disable from autocomplete
		var tokenMap = parseUtilsLib.getTokensDisplayMap(modelManger);
		if (utilsLib.isInArray(parserTokens.TYPESTRING.toString(), nextTokensArray)&& 
				!((utilsLib.isInArray(parserTokens.TYPETIMESTAMP.toString(), nextTokensArray))
				||(utilsLib.isInArray(parserTokens.TYPEDATE.toString(), nextTokensArray))
				||(utilsLib.isInArray(parserTokens.TYPETIME.toString(), nextTokensArray))))
				{
			diableToken = 
				(  (tokenName === tokenMap.DATESTRING )
				|| (tokenName === tokenMap.TIMESTAMPSTRING)
				|| (tokenName === tokenMap.TIMESTRING)
				);
		}
		
		return diableToken;
		
	};
	/*********************************************************************************************************************************
	 * Function: getTokenName
	 * INPUT: 
	 * Desc : For all tokens we use the lower case. In date / time fotmats we want to leave the string as is to display the standard formats
	 * OUTPUT: true / false
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.getTokenName = function(tokenID,  parser) {
	
		var tokens = parser.getTokenNames();
		var modelManager = parser.parseModelLib.getModelManger();
		var tokenMap = parseUtilsLib.getTokensDisplayMap(modelManager);
		var tokenName = tokens[tokenID];
		if (tokenMap.hasOwnProperty(tokenName)) {
			tokenName = tokenMap[tokenName];
		}
		if 
			(  (tokenName === tokenMap.DATESTRING )
			|| (tokenName === tokenMap.TIMESTAMPSTRING)
			|| (tokenName === tokenMap.TIMESTRING)
			) {
			return tokenName;
		}
		return tokenName.toLowerCase();
	};
	
	/*********************************************************************************************************************************
	 * Function: disableNumericFragements
	 * INPUT: 
	 * Desc : If INT or DECIMAL exist they include ZERO_TO_ONE (no need for it)
	 * OUTPUT: true / false
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.disableNumericFragements = function(tokenName, nextTokensArray, modelManger) {
	
		var diableToken = false;
		//disable from autocomplete
		var tokenMap = parseUtilsLib.getTokensDisplayMap(modelManger);
		if (utilsLib.isInArray(parserTokens.ZERO_TO_ONE.toString(), nextTokensArray)&& 
				((utilsLib.isInArray(parserTokens.INT.toString(), nextTokensArray))
				||(utilsLib.isInArray(parserTokens.DECIMAL.toString(), nextTokensArray))))
				
				{
			diableToken = 
				(  (tokenName === tokenMap.ZERO_TO_ONE )
				);
		}
		
		return diableToken;
		
	};
	
	/*********************************************************************************************************************************
	 * Function: isValidTokenToSuggest
	 * INPUT: 
	 * Desc : return true only if it's a "real" token :   i.e. reserved word of REL languge and also with respect to partial completion
	 * OUTPUT: true / false
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.isValidTokenToSuggest = function( tokenName, tokenPartialText, isTermToken) {
	
		var notValidToken =
					// undefined token
					!tokenName 
					// undefined token
					|| tokenName === '<eor>'
					// Not real valuable token for user - i.e. represents term 
					|| isTermToken
					// since we are in partial completion state - suggest  the token only if last text matches 
					|| (this.isPartialCompletion() && (tokenPartialText !== this.parsingOutputInfo.lastText.toLowerCase()))
					// Not real valuable token for user - i.e. represents parameter
				    || (tokenName.indexOf("parameter") !== -1);
		
		return !notValidToken;
		
	};
	
	/*********************************************************************************************************************************
	 * Function: checkNavigationToken
	 * INPUT: 
	 * Desc : Save navigation data for later use in terms autocomplete + return if this is a term (=navigation) token or not :
	 * 			Either type is navigation (i.e. proabbaly partial tern - a term wich is type is unknow yet? TBD
	 *   	    OR "type" token for example: i.e "STRINGTYPE" -> meaning terms of this type should be suggetsed
	 * 
	 * OUTPUT: true / false
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.checkNavigationToken = function( tokenName) {
		var isTermToken = false;
		if ((tokenName.lastIndexOf("type", 0) === 0 && tokenName.indexOf("parameter", 0) < 0) || tokenName === "navigation") {
			
			isTermToken = true;
			this.parsingOutputInfo.navigationCompleteion = true;
			if (tokenName !== "navigation") {
				this.parsingOutputInfo.allowedTypes.push(tokenName);
			}
		}
		return isTermToken;
	};

	/*********************************************************************************************************************************
	 * Function: filterTokens
	 * INPUT: 
	 * Desc : From parsre next tokens, minimize the list according to partial completeion of the last text and HRF 'diable tokens' policy
	 * OUTPUT: 
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.filterTokens = function( vocaRTServices, parser) {
		
		// Array of valid / real suggestions 
		var selectedTokens = []; 
		var tokenName = '<eor>';
		var tokenID = -1;
		var idx = 0;
		var tokenPartialText = "";
		var isTermToken = false;
		
		var tInfo = {};
		//var tokens = parser.getTokenNames();
		var modelManger = parser.parseModelLib.getModelManger();

		this.parsingOutputInfo.nextTokens = utilsLib.removeDuplicate(this.parsingOutputInfo.nextTokens);
			
		
		for (idx = 0; idx < this.parsingOutputInfo.nextTokens.length; idx++) {
			isTermToken = false;
			tokenName = '<eor>';
			tokenID = (this.parsingOutputInfo.allTokens ? idx : parseInt(this.parsingOutputInfo.nextTokens[idx], 10)); // get current suggestion token number
			if (tokenID > 0) {
				tokenName = this.getTokenName(tokenID, parser); // get current suggestion according to its token number
			}

			//var lastInput = this.parsingOutputInfo.lastText.toLowerCase();
			tokenPartialText = tokenName.substring(0, this.parsingOutputInfo.lastText.length);

	
			if(this.disableToken(vocaRTServices, parser, tokenName, tokenID, modelManger)){
				continue;
			}

			if (this.disableAdvancedFunctions(vocaRTServices,tokenName)) {
				continue;
			}
			
			if(this.disableDateTimeFormatsForString(tokenName, this.parsingOutputInfo.nextTokens, modelManger)){
				continue;
			}

			if(this.disableNumericFragements(tokenName, this.parsingOutputInfo.nextTokens, modelManger)){
				continue;
			}
			if(this.disableGreaterOrLessThenOps(tokenID, parser)){
				continue;
			}

			isTermToken = this.checkNavigationToken(tokenName);
			
			if (this.isValidTokenToSuggest(tokenName, tokenPartialText, isTermToken))
			{
				tInfo = {};
				tInfo.type = tokenID;
				tInfo.name = tokenName;
				selectedTokens.push(tInfo);
			}
		}
		
		//Remove duplications from the returned array
		selectedTokens = utilsLib.removeDupplicateByName(selectedTokens);

		// Sort the suggestions
		selectedTokens.sort(function(a, b) {
			if (a > b) {
				return 1;
			}
			if (a < b) {
				return -1;
			}
			return 0;
		});		
		return selectedTokens;
	};
	
	/*********************************************************************************************************************************
	 * Function: handleWhitespaceCharsInLastText
	 * INPUT: 
	 * Desc : 
	
	 * OUTPUT: 
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.handleWhitespaceCharsInLastText = function() {
		
		
		// In case last text is a whitespace character omit it (relevant for later corect search of terms) 
		if (parseUtilsLib.isEmptyString(this.parsingOutputInfo.lastText)) {
			this.parsingOutputInfo.lastText = '';
		}
		//Replace multiple whitespaces with single whitespace
		this.parsingOutputInfo.lastText = this.parsingOutputInfo.lastText.replace(/\s+/g, ' ');
	};	
	/*********************************************************************************************************************************
	 * Function: startSuggestionList
	 * INPUT: 
	 * Desc : 	  Init response suggestions list 
	 * OUTPUT: 
	 *************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.startSuggestionList = function() {
		
		this.strSuggestions = "["; 
	};
	
	/*********************************************************************************************************************************
	 * Function: closeSuggestionList
	 * INPUT: 
	 * Desc : 	  Format end of suggestions list 
	 * OUTPUT: 
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.closeSuggestionList = function() {
	
		// There could be an extra "," after the last object of the string array, we need to remove it
		if (this.strSuggestions.charAt(this.strSuggestions.length - 1) === ",") {
			this.strSuggestions = this.strSuggestions.slice(0, this.strSuggestions.length - 1);
		}
		// Add a closing bracket for the stringified array
	
		this.strSuggestions = this.strSuggestions +  "]";
		this.strSuggestions = this.strSuggestions.replace(/\\/g, "\\\\");
};
	
	/*********************************************************************************************************************************
	 * Function: prepareContextSuggestionsInsideWhere_dotMode
	 * INPUT: 
	 * Desc :  Handle completion in explicit dot completion request
	 *        example 1: average of (player.session.duration where player. => age
	 *        example 2: average of(player.session.duration where player.sessi => session / on
	 * OUTPUT: 
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.prepareContextSuggestionsInsideWhere_dotMode = function(vocaRTServices, lastToken, tokenArray, prefix) {
		
		if (this.navigationCompletionInfo.navigationTextInput.indexOf('.') !== -1  &&
			this.parsingOutputInfo.contextInfo.contextNavigation !== null && 
		    this.navigationCompletionInfo.completeCollection === false && 
		    lastToken !== parserTokens.CURRENT ) {
				
				var startInput = 
					this.navigationCompletionInfo.navigationTextInput.substring(0, this.navigationCompletionInfo.navigationTextInput.lastIndexOf('.'));
		
				if (this.parsingOutputInfo.contextInfo.contextNavigation.navigation.indexOf(startInput) === 0) {

					//player.payment.payment_rc.amount => player.payment.payment_rc 	
					//  player.session.i => player.session
					if (tokenArray.length > 2) {
						var contextNavDetails = vocabularyUtilLib.validateNavigationDetails(this.navigationCompletionInfo.navigationTextInput, vocaRTServices, parseModelLib.getModelManger().vocabulary, this.navigationCompletionInfo.collectionBusinessTypes, this.parsingOutputInfo.contextInfo.valueListAttribute);
						if (contextNavDetails.isValid === false && contextNavDetails.attribute.altAttr.length > 0) {
							this.navigationCompletionInfo.navSuggestions += this.insertOMAlternatives(vocaRTServices, contextNavDetails.attribute.altAttr,
																									  contextNavDetails.attribute.name, prefix,
																									  this.navigationCompletionInfo.commaDelimiter, null);

							this.navigationCompletionInfo.commaDelimiter = ",";
						}
					}

					var navigation = 
						this.parsingOutputInfo.contextInfo.contextNavigation.navigation.substring(
												0,
												this.parsingOutputInfo.contextInfo.contextNavigation.navigation.lastIndexOf('.'));
					
					
					if (startInput !== navigation && navigation.indexOf(this.navigationCompletionInfo.navigationTextInput) === 0) {
						var lastStr = navigation.replace(this.navigationCompletionInfo.navigationTextInput, '');
						var compArr = lastStr.split(".");
						this.navigationCompletionInfo.navSuggestions = this.navigationCompletionInfo.navSuggestions + 
																	   this.navigationCompletionInfo.commaDelimiter +
																	   '{"text":"' + prefix + tokenArray[tokenArray.length - 1] + compArr[0] +
																	   '", "completion":"' + prefix + compArr[0] + '"}';
						
						this.navigationCompletionInfo.commaDelimiter = ",";
					}
				}
			}
	};
	
	/*********************************************************************************************************************************
	 * Function: prepareContextAttrsSuggestionsInsideWhere
	 * INPUT: 
	 * Desc :  calculate context suggestions (i.e. direct attributes names of the where context) 
	 *         => relevant to both modes - 'Terms' and  'dote' modes
	 *         example 1: average of (player.session.duration where a => age 
	 *         example 2: number of (player.session.duration where player.sessi => no attribute
	 * OUTPUT: 
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.prepareContextAttrsSuggestionsInsideWhere = function(vocaRTServices, lastToken) {
		
		var termMode = parseModelLib.getModelManger().termMode;
		if (this.parsingOutputInfo.contextInfo.contextDO !== null &&
			!parseUtilsLib.endsWith(this.navigationCompletionInfo.navigationTextInput, ".") &&
			(this.navigationCompletionInfo.completeCollection === false && 
			lastToken !== parserTokens.CURRENT)) {
				var context = this.parsingOutputInfo.contextInfo.contextDO + "." + this.navigationCompletionInfo.navigationTextInput;
				var contextNavigationDetails = vocabularyUtilLib.validateNavigationDetails(context,
																							vocaRTServices,
																							parseModelLib.getModelManger().vocabulary,
																							this.navigationCompletionInfo.simpleBusinessTypes,
																							this.parsingOutputInfo.contextInfo.valueListAttribute,
																							termMode);
				if (contextNavigationDetails.isValid === false && 
					contextNavigationDetails.associations.isValid === false &&
					contextNavigationDetails.attribute.altAttr.length > 0) {
					this.navigationCompletionInfo.navAlternatives = contextNavigationDetails.attribute.altAttr;
				}
			}
	};
	
	/*********************************************************************************************************************************
	 * Function: prepareContextCompletion
	 * INPUT: 
	 * Desc :  prepare context suggestions - Handle Completion inside where 
	 * OUTPUT: 
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.prepareContextCompletion = function(vocaRTServices, lastToken, tokenArray, prefix) {
		
		// Handle Completion inside where
		// Case 1 :  completion for explcit dot notation request (ASsociations or attributes, not collections)
		//  Handle completion in explicit dot completion request
		// example 1: average of (player.session.duration where player.
		// example 2: (player.session.duration where player.sessi
		this.prepareContextSuggestionsInsideWhere_dotMode(vocaRTServices, lastToken, tokenArray, prefix);
		
		// Case 2 :  only simple types direct attributes of context -for both 'terms' and 'dot' modes 
		// example 1: sum of amount of all payment_rcs of all payments of all players where a 
		// example 2: average of (player.session.duration where player.sessi			
		this.prepareContextAttrsSuggestionsInsideWhere(vocaRTServices, lastToken, prefix); 
		
		
	};	
	
	/*********************************************************************************************************************************
	 * Function: completeNavSuggestions_dotMode
	 * INPUT: 
	 * Desc :  Handle completion when terms do not exist (old dot notation)
	 *         example 1: player.
	 *         example 2: playe
	 *         example 3: number of
	 * OUTPUT: 
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.completeNavSuggestions_dotMode = function(vocaRTServices, parser, prefix) {
		var navigationDetails = null;
		navigationDetails = vocabularyUtilLib.validateNavigationDetails(this.navigationCompletionInfo.navigationTextInput, vocaRTServices, parseModelLib.getModelManger().vocabulary, this.navigationCompletionInfo.simpleBusinessTypes, this.parsingOutputInfo.contextInfo.valueListAttribute);


		if (navigationDetails.isValid === false) {
			if (navigationDetails.root.isValid === false) {
				// Example: playe
				// Example2: number of
				if (this.parsingOutputInfo.contextInfo.valueListAttribute /*navigationDetails.root.altValueList.length > 0*/ ) {
					this.navigationCompletionInfo.isValueListSuggestions = true;
					this.navigationCompletionInfo.navSuggestions = ""; // display only value list suggestions
					this.navigationCompletionInfo.navAlternatives = [];
					this.navigationCompletionInfo.navAlternatives = this.navigationCompletionInfo.navAlternatives.concat(navigationDetails.root.altValueList);
				} else {
					this.navigationCompletionInfo.navAlternatives = this.navigationCompletionInfo.navAlternatives.concat(navigationDetails.root.altDO);
					if (parser.disableAliases === false) {
						this.navigationCompletionInfo.navAlternatives = this.navigationCompletionInfo.navAlternatives.concat(navigationDetails.root.altAlias);
					}
				}

				this.navigationCompletionInfo.navSuggestions += this.insertOMAlternatives(vocaRTServices, this.navigationCompletionInfo.navAlternatives, navigationDetails.root.name, prefix, this.navigationCompletionInfo.commaDelimiter, null);
				this.navigationCompletionInfo.navAlternatives = [];
			} else { // Example: player.
				this.navigationCompletionInfo.navAlternatives = this.navigationCompletionInfo.navAlternatives.concat(navigationDetails.attribute.altAssoc);
				this.navigationCompletionInfo.navSuggestions += this.insertOMAlternatives(vocaRTServices, navigationDetails.attribute.altAttr.concat(this.navigationCompletionInfo.navAlternatives), navigationDetails.attribute.name, prefix, this.navigationCompletionInfo.commaDelimiter, null);
				this.navigationCompletionInfo.navAlternatives = [];
			}
		}
	};	
	
	/*********************************************************************************************************************************
	 * Function: completeNavSuggestions_termsMode
	 * INPUT: 
	 * Desc :  Handle completion when terms exist , handle both context (inside where) and non context use cases 
	 *         example 1: age
	 * OUTPUT: 
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.completeNavSuggestions_termsMode = function(vocaRTServices, parser, prefix, lastToken) {
		// represents 
		
        /////////////////////////////////////////////////////////////////////////////////////////
		// Prepare where context , for example player.payment.payment_rc
        /////////////////////////////////////////////////////////////////////////////////////////
		var whereContext = null;
		if (this.parsingOutputInfo.contextInfo.contextNavigation !== null ) {
			
			var contextSplit = this.parsingOutputInfo.contextInfo.contextNavigation.navigation.split(".");
            // In case last navigation data is attribute, omit it
            if (this.parsingOutputInfo.contextInfo.contextNavigation.attribute.isValid) {
                contextSplit.pop();
            }
			whereContext = (contextSplit.length === 0) ? this.parsingOutputInfo.contextInfo.contextNavigation.navigation : contextSplit.join(".");
	            
			
		}
		/////////////////////////////////////////////////////////////////////////////////////////
		// Fine tune of context according to last token (inside where)
		// 1. current - context should be the left most DO (player.payemyents.paymentRC=> player)
		// 2. all - cancel the context (only full path are allowed  after all) 
		/////////////////////////////////////////////////////////////////////////////////////////
		var isCurrent = (lastToken === parserTokens.CURRENT) ? true : false;
		if (isCurrent && whereContext) {
			var ctxArr = whereContext.split(".");
			whereContext = (ctxArr.length > 0 ?  ctxArr[0] : whereContext);
		} else if ( (lastToken === parserTokens.ALL)) {
			whereContext = null;
		}
		/////////////////////////////////////////////////////////////////////////////////////////
		// collect all possible completions (terms, aliases, valueList)
		/////////////////////////////////////////////////////////////////////////////////////////
		var termMode = parseModelLib.getModelManger().termMode;
		var altNavigation = null;
		var isNoAssocSugg = false;
		if (parseModelLib.getModelManger().flags.hasOwnProperty(constantsLib.propertiesEnum.noAssocSuggestion)){
			isNoAssocSugg = parseModelLib.getModelManger().flags[constantsLib.propertiesEnum.noAssocSuggestion];
		}
		
		altNavigation = vocabularyUtilLib.getNavigationCompletion(this.navigationCompletionInfo.navigationTextInput,
				vocaRTServices,
				parseModelLib.getModelManger().vocabulary,
				this.navigationCompletionInfo.simpleBusinessTypes,
				this.parsingOutputInfo.contextInfo.valueListAttribute,
				whereContext,
				isCurrent,
				this.navigationCompletionInfo.completeCollection,
				this.parsingOutputInfo.contextInfo.isDeprecatedAllContext,
				parser.isInsideWhere,
				this.parsingOutputInfo.contextInfo.isTermAllContext,
				termMode, 
				isNoAssocSugg
				);

		if (altNavigation.altValueList.length > 0) {
			this.navigationCompletionInfo.isValueListSuggestions = true;
			this.navigationCompletionInfo.navSuggestions = ""; // display only value list suggestions
			this.navigationCompletionInfo.navAlternatives = altNavigation.altValueList;
		} else {
			if (parser.disableAliases === false && altNavigation.altAlias.length > 0) {
				this.navigationCompletionInfo.navAlternatives = this.navigationCompletionInfo.navAlternatives.concat(altNavigation.altAlias);
			}

			if (altNavigation.altDO.length > 0) {
				this.navigationCompletionInfo.navSuggestions += this.insertTermsAlternatives(altNavigation.altDO,
																							 this.navigationCompletionInfo.navigationTextInput,
																							 prefix,
																							 this.navigationCompletionInfo.commaDelimiter);
				this.navigationCompletionInfo.commaDelimiter = ",";
			}

		}

		if (this.navigationCompletionInfo.navAlternatives.length > 0) {
			this.navigationCompletionInfo.navSuggestions += this.insertOMAlternatives(vocaRTServices, this.navigationCompletionInfo.navAlternatives, this.navigationCompletionInfo.navigationTextInput, prefix, this.navigationCompletionInfo.commaDelimiter, termMode);
			this.navigationCompletionInfo.navAlternatives = [];
		}

	};	
	
	/*********************************************************************************************************************************
	 * Function: isDotMode
	 * INPUT: 
	 * Desc : In case Terms are not enabled, completion is done according to old dot mode
	 * OUTPUT: 
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.isDotMode = function(vocaRTServices) {
		
		return (this.navigationCompletionInfo.navigationTextInput.indexOf('.') !== -1 						||
				!vocabularyUtilLib.isTermsExists(vocaRTServices, parseModelLib.getModelManger().vocabulary) || 
				(parseModelLib.getModelManger().flags.hasOwnProperty(constantsLib.propertiesEnum.disableTerms)
				 && parseModelLib.getModelManger().flags[constantsLib.propertiesEnum.disableTerms]));
	};	
	
	/*********************************************************************************************************************************
	 * Function: isTermMode
	 * INPUT: 
	 * Desc : In case Terms are enabled, first try to complete the term
	 * OUTPUT: 
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.isTermMode = function(vocaRTServices) {
		
		return (
				vocabularyUtilLib.isTermsExists(vocaRTServices, parseModelLib.getModelManger().vocabulary) && 
				(!parseModelLib.getModelManger().flags.hasOwnProperty(constantsLib.propertiesEnum.disableTerms)
				 || !parseModelLib.getModelManger().flags[constantsLib.propertiesEnum.disableTerms]));
	};	
	
	
	
	/*********************************************************************************************************************************
	 * Function: addNavigationSuggestions
	 * INPUT: 
	 * Desc : according to navigation token type and last input text: build and format navigation (terms / object model old dot notaion)
	 *        suggestion information
	 * OUTPUT: 
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.addNavigationSuggestions = function(vocaRTServices, parser) {
		
		
		var prefix = "";
		
		this.initNavigationInfo();
		
		// if we need to add navigation input (this.parsingOutputInfo.navigationCompleteion) no lexer errors and also that the last token is w/o spaces e.g average of
		if (this.parsingOutputInfo.navigationCompleteion)  {
				
			if(this.completeByValueListInLexerError( vocaRTServices, parser)){
				return;
			}
			
			prefix = this.calcSpacePrefixAdditionForNavigation( parser);
			
			this.calculateNavigationStartText();
			
			this.convertNavigationRELTypesToBusinessTypes(parser);
	
			//var tokens = parser.getTokenNames();
			var lastToken = parseUtilsLib.getLastTokenTypeAndIgnoreWS(parser);
			// Split the path from the input, into its components - tokens
			var tokenArray = this.navigationCompletionInfo.navigationTextInput.split(".");
			
			this.parsingOutputInfo.contextInfo.isDeprecatedAllContext = this.parsingOutputInfo.contextInfo.isDeprecatedAllContext || lastToken === parserTokens.ALL;


			// Handle Completion inside where
			this.prepareContextCompletion(vocaRTServices, lastToken, tokenArray, prefix);
			
			// Final Complete of navigation suggestions  for Terms Mode
			if(this.isTermMode(vocaRTServices))
			{
				this.completeNavSuggestions_termsMode(vocaRTServices, parser, prefix, lastToken); 
			}
			// Final Complete of navigation suggestions for Dot Mode
			if (this.isDotMode(vocaRTServices))
			{
				this.completeNavSuggestions_dotMode(vocaRTServices, parser, prefix);  
			}
		

			jQuery.sap.log.debug("Autocopmlete: End : this.navigationCompletionInfo.navSuggestions - " + this.navigationCompletionInfo.navSuggestions);
			
			if (this.navigationCompletionInfo.isValueListSuggestions) {
				this.startSuggestionList();
			}		

			this.strSuggestions +=  this.navigationCompletionInfo.navSuggestions;			
			
		}
		
			
	};
	
	/*********************************************************************************************************************************
	 * Function: addNavigationSuggestions
	 * INPUT: 
	 * Desc : For each token from input filtered token (non navugation token): build and format suggestion information
	 * OUTPUT: 
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.addNonNavigationSuggestions = function( selectedTokens, completionPrefix) {
		
		
		// Add suggestions which are not navigation, to returned string
		var idx;
		
		var sgtCompletion = null;
		var tokenTypeObject = {};
		var tokenName = "";
		
		if(!this.navigationCompletionInfo.isValueListSuggestions)
		{
			
		
			// add to additional exsiting suggestions
			if(selectedTokens.length > 0 && this.strSuggestions.length > 1)
			{
				this.strSuggestions +=  ",";
			}
			
			//Replace multiple whitespaces with single whitespace
			//this.parsingOutputInfo.lastText = this.parsingOutputInfo.lastText.replace(/\s+/g, ' ');
			for (idx = 0; idx < selectedTokens.length; idx++) {
				sgtCompletion = null;
				
				
				tokenName = selectedTokens[idx].name;
				
				// prepare completion in case of partial text suggestion and this is a matching token for the partial text
				if (this.isPartialCompletion()) {
					sgtCompletion = tokenName.substring(this.parsingOutputInfo.lastText.length, tokenName.length);
				// prepare completion in case of partial text suggestion
				} else {
					sgtCompletion = tokenName;
	
				}
				
				//  in case suggetion should be raised for this token -> Format suggestion string information 
				if (sgtCompletion) {
					tokenTypeObject = parseUtilsLib.getTokenTypeMetadata(selectedTokens[idx].type, tokenName, 0, false, parseModelLib.getModelManger()); 
		
					this.strSuggestions += '{"text":"' + /*current_prefix +*/ tokenName + '","completion":"' + /*current_prefix +*/  completionPrefix +  sgtCompletion + '","tokenType":"' + tokenTypeObject.group +  '","info":' + JSON.stringify(tokenTypeObject.info) + '},';
					//this.strSuggestions += '{"text":"' + /*current_prefix +*/ tokenName + '","completion":"' + /*current_prefix +*/  completionPrefix +  sgtCompletion + ',' + JSON.stringify(tokenTypeObject) + '"},';					
					
				}
			}
		}
	};	
	
	/**********************************************************************************************************************************
	 * Function: setDOContext
	 * INPUT: 
	 * Desc :    Copy DO context to contextInfo   
	 * OUTPUT: 
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.setDOContext = function(parser) {

		if (parser.hasOwnProperty('context')) {
			this.parsingOutputInfo.contextInfo.contextDO = parser.context;
		}
		if (parser.hasOwnProperty('fullContext')) {
			this.parsingOutputInfo.contextInfo.contextNavigation = parser.fullContext;
			this.parsingOutputInfo.contextInfo.isTermAllContext = this.parsingOutputInfo.contextInfo.isTermAllContext || 
			( parser.fullContext && parser.fullContext.modifiers && parser.fullContext.modifiers.hasOwnProperty("all"));
		}
	
	};

	/*********************************************************************************************************************************
	 * Function: initParsingOutputInfo
	 * INPUT: 
	 * Desc : Initialize 'Accumulated  and conclusions information' from expression parsing.  
	 * 		  This information is used for building the final suggestions list after expression parsing is finished
	 * 		  (this information is mainly updated during reportError methods of lexer and parser depending on the error type)  
	 * OUTPUT: 
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.initParsingOutputInfo = function(input) {
		
		
		this.parsingOutputInfo = {
				// 'raw next tokens data' - supplied by parser
				// these will be latered filtered and converted to valuable suggestions list for the user				
				// structure: map of tokenID -> tokenName OR map of index To tokenID
				"nextTokens": [], 		
				//"partialText": "false", // partail completed indicator , for example "true" for expression "co" (partail of :count of")
				// last partail token / term ("average o" => "average o", "age of the" => "age of the") 
				// OR space in case of full token ("avearge of " => " ")  
				"lastText" :  input,
				// is the last text requires partial completeion (for example ("cou" -> true, "count of" -> false)
				//Parser always set partial text to true if the last token / char is not EOF (-1)
				// (i.e. error occured in the middle of a token before EOF was read)
				"isPartialText" :  false,
				// In case lexer error occourded in a middle of a token 'next tokens' should contains all tokens before filtering 
				// according to partial complete
				"allTokens" : false,
				// 'navigation next tokens' suggested by parser,  accumulated here in order to later
				// be used for selecting navigation (=terms) suggestions only from  relevant types
				"allowedTypes" : [],
				// is navigation suggestions required (concluding according to 'nextTokens')
				"navigationCompleteion" : false,
				// autoComplete context (like path inside where etc...)
				"contextInfo" : {
						// Last DO (holds the attribute) in navigation path
						"contextDO" : null,
						// context navigation structures (the last context in parser.contextQueue) 
						"contextNavigation" : null,
						"valueListAttribute" : null,
		                "isDeprecatedAllContext" : false,
		                "isTermAllContext" : false						
				}
				
			};
	};
	
	/**********************************************************************************************************************************
	 * Function: initNavigationInfo
	 * INPUT: 
	 * Desc :    Initialize information required for producing navigation competion   
	 * OUTPUT: 
	 *
	 ************************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.initNavigationInfo = function() {
		
		
		this.navigationCompletionInfo = {
				// business type information for vocabulary / terms completion serach
				"simpleBusinessTypes": [], 		
				// business type information for vocabulary / terms completion serach
				"collectionBusinessTypes" :  [],
				// business type information for vocabulary / terms completion serach
				"completeCollection" : false,
				//  only closed list completion from vocabaulry should be sugested
				"isValueListSuggestions" : false,
				// last text in case of navigation (for example 'age of t'
				"navigationTextInput" : "",
				// row data for accumulated  navigation suggestions (will be later merged into 'navSuggestions' final result 	
				"navAlternatives" : [],
				// result navigation suggestions string
				"navSuggestions" :"",
				// Delimiter for suggestions inside navigation suggestion list - TBD
				"commaDelimiter" : ""
			};
	};	
	
	
	/**********************************************************************************************************************************
	 * Function: getNextSuggestions
	 * INPUT:    String input from the user, which need to be suggested with completions
	 * Desc:     Main Service of autoCompleteUtilsLib 
	 *           Competions may be REL tokens (i.e. REL reserved words) + navigation (voabulary / terms).
	 * OUTPUT:   String of array that includes all the suggestions, in the
	 *           form of "[{text: <text to display>, completion:<the text to be added to the input>}...]"
	 *
	 ***********************************************************************************************************************************/
	autoCompleteUtilsLib.prototype.getNextSuggestions = function(input, lexer, parser, vocaRTServices, type) {
		
		var completionPrefix = "";
		var selectedTokens = [];
		
		this.startSuggestionList();
		
		this.initParsingOutputInfo(input);
				
		// replace technical tokens names with applicative names
		//this.replaceWithVarNames(parser);

		// Add an error handler function to the parser. in case of parsing error this method will collect
		// the next possible tokens according to the error type
		this.overwriteParserReportError(parser, this.parsingOutputInfo);
		// Add an error handler function to the lexer. in case of parsing error this method will 
		// set the last text and set the partial text indicator		
		this.overwriteLexerReportError(lexer, parser, this.parsingOutputInfo);

	    /////////////////////////////////////////////////////////////////////////////////////////////////
	    // start the parsing according to the context type
        /////////////////////////////////////////////////////////////////////////////////////////////////
		var parseType = ((type === constantsLib.TYPE_ALL) ? constantsLib.TYPE_AUTOCOMPLETE : type);
		parseUtilsLib.parseType(parser, parseType);
		
		/////////////////////////////////////////////////////////////////////////////////////////////////
		/////////////////////////////////////////////////////////////////////////////////////////////////
		// After parser finsih execution (with or without error and handing) =>  
		// use parser cacluated output for building autoc complete resposne
		//////////////////////////////////////////////////////////////////////////////////////////////////
		
		this.setDOContext(parser);

		if (parser.lastExpecting.reachedEOF || this.parsingOutputInfo.isPartialText) {
			this.parsingOutputInfo.nextTokens = parser.lastExpecting.expecting;
			if (parser.lastExpecting.isPartialText) {
				this.parsingOutputInfo.isPartialText = parser.lastExpecting.isPartialText;
			}
		}
		else {
			this.parsingOutputInfo.nextTokens = [];
		}
		
		// check if pratial text completion is needed 
		completionPrefix = this.calcSpacePrefixAdditionForNonNavigation(parser);
		
		this.handleEmptyNextTokens(parser);

		
        /////////////////////////////////////////////////////////////////////////////////////////////////
		//From parsre next tokens, minimize the list according to partial completeion of the last text
		// and HRF 'diable tokens' policy
		/////////////////////////////////////////////////////////////////////////////////////////////////
		selectedTokens = this.filterTokens(vocaRTServices, parser);
		// Get the map of numbers to token names
		
	    /////////////////////////////////////////////////////////////////////////////////////////////////
		// Build Suggestions
		/////////////////////////////////////////////////////////////////////////////////////////////////
		
        this.handleWhitespaceCharsInLastText();
        
        
    	
		// Add suggestions which are  navigation (terms or old dot notation format or value list options  (i.e 'age of the player'...)
        if(vocaRTServices.getTermModes().indexOf("byDescription") !== -1){
        	//Update the model manager with TermMode = DISPLAY_TEXT flag if needed:
        	parseModelLib.getModelManger()[constantsLib.propertiesEnum.termMode] = constantsLib.DISPLAY_TEXT;
        }
		this.addNavigationSuggestions(vocaRTServices, parser);
		
		
		// Add suggestions which are not navigation, to suggestions results (i.e 'count of' , 'is equel to'...)
		this.addNonNavigationSuggestions( selectedTokens, completionPrefix); 		
			

		this.closeSuggestionList();
		
		return this.strSuggestions;

	};


	return {
		autoCompleteUtilsLib: autoCompleteUtilsLib
	};
})();
