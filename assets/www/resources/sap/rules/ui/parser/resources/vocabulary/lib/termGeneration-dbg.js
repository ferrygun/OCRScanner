jQuery.sap.declare("sap.rules.ui.parser.resources.vocabulary.lib.termGeneration");

jQuery.sap.require("sap.rules.ui.parser.infrastructure.util.utilsBase");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.vocaObjects");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderFactory");


sap.rules.ui.parser.resources.vocabulary.lib.termGeneration = sap.rules.ui.parser.resources.vocabulary.lib.termGeneration|| {}; 
sap.rules.ui.parser.resources.vocabulary.lib.termGeneration.lib = (function() { 
	
	var infraUtilsBase = sap.rules.ui.parser.infrastructure.util.utilsBase.lib;
	var infraUtilsBaseLib = new infraUtilsBase.utilsBaseLib();
	var vocabularyConstants = sap.rules.ui.parser.resources.vocabulary.lib.constants.lib;
	var vocaObjects = sap.rules.ui.parser.resources.vocabulary.lib.vocaObjects.lib;
	
	function termGenerationLib(){

	}
	
	termGenerationLib.prototype.generate = function(rtAll, dataObjectArrContent, vocaName, vocabularyId, dbConn, isPrivate, resourceID, scope, writeDependecies) {
		
		var byDescModeIsOn = false;
		var dependencyUtilsLib = null;
		var dependecyManager = null;
		var runtimeServicesLib = null;
		var dependencyConstantsLib = null;

		var vocaRuntimeServicesFactory = sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderFactory.lib;
		runtimeServicesLib = new vocaRuntimeServicesFactory.vocaDataProviderFactoryLib();
		
		//Avoid from importing the following libs in case this run in client side, by checking the writeDependecies flag
		if(writeDependecies){
			jQuery.sap.require("sap.rules.ui.parser.resources.dependencies.lib.constants");
			dependencyConstantsLib = sap.rules.ui.parser.resources.dependencies.lib.constants.lib;
			jQuery.sap.require("sap.rules.ui.parser.resources.dependencies.lib.dependenciesUtils");
			dependencyUtilsLib = sap.rules.ui.parser.resources.dependencies.lib.dependenciesUtils;
			jQuery.sap.require("sap.rules.ui.parser.resources.dependencies.lib.dependencyManager");
			dependecyManager = sap.rules.ui.parser.resources.dependencies.lib.dependencyManager.DependencyManager;
		}
		
		
		function getTermExpression(startObjectName, visitedAssociationsArr, attrName) {
		
			var i;
			var assocInfo;
			var termExpression = null;
			
			termExpression = startObjectName;	
			for (i=0;i < visitedAssociationsArr.length; i++) {	
				assocInfo = visitedAssociationsArr[i];
				termExpression +=  '.' + assocInfo.name;
			}
			if (attrName) {
				termExpression += '.' + attrName;
			}	
			return termExpression;
		}	
		
		function assocWasVisited(visitedAssociationsArr, assocInfo){
			
			var i;
			
			for(i=0; i < visitedAssociationsArr.length; i++){
				if(visitedAssociationsArr[i].id === assocInfo.id){
					return true;
				}
			}
			return false;
		}
		
		function isStartWithVowel(string) {
		
			if (string.indexOf('i') === 0 || string.indexOf('I') === 0 ||
				string.indexOf('a') === 0 || string.indexOf('A') === 0 ||
				string.indexOf('e') === 0 || string.indexOf('E') === 0 ||
				string.indexOf('o') === 0 || string.indexOf('O') === 0 ||
				string.indexOf('u') === 0 || string.indexOf('U') === 0) {
				return true;
			}
			return false;
		}
		
		function endsWith(str, suffix) {
			
			return str.indexOf(suffix, str.length - suffix.length) !== -1;
		}
		
		function getTheSforPlural(string) {
		
			if (endsWith(string, 's')) {
				return 'es';
			}
			return 's';
		}
		
		function isDeprecatedPlural(string) {
			
			if ( (string.slice(-1).toLowerCase() !== string.slice(-1)) ||
					// endsWith(string, 'S') ||
				endsWith(string.toLowerCase(), 'z') ||
				(endsWith(string.toLowerCase(), 'y') && !isStartWithVowel(string.slice(-2))) || 
				endsWith(string.toLowerCase(), 'ch') || 
				endsWith(string.toLowerCase(), 'sh') ||
				endsWith(string.toLowerCase(), 'x') || 
				endsWith(string.toLowerCase(), 'f') || 
				endsWith(string.toLowerCase(), 'fe') 
				) {
				return true;
			}
			return false;
		}
		
		function pluralize(string){
			
			var arr = string.split(" ");
			var lastWord = arr[arr.length-1];
			var rx = new RegExp("[A-Za-z]$");
			var result = string;
			
			//Pluralize only if the last word ends with [A-Z, a-z]:
			if(rx.test(lastWord)){
				if (endsWith(lastWord, 'y') && !isStartWithVowel(lastWord.slice(-2))) {
					//country -> countries
					lastWord = lastWord.slice(0, -1) + 'ies';
				} 
				else if (endsWith(lastWord, 'Y') && !isStartWithVowel(lastWord.slice(-2))) {
					//country -> countries
					lastWord = lastWord.slice(0, -1) + 'IES';
				} 
				else if (endsWith(lastWord, 's') || endsWith(lastWord, 'z') || endsWith(lastWord, 'ch') || endsWith(lastWord, 'Ch') || endsWith(lastWord, 'sh') || endsWith(lastWord, 'Sh') || endsWith(lastWord, 'x')) {
					//atlas   -> atlases; church  -> churches; wish -> wishes; box -> boxes
					lastWord = lastWord + 'es';
				}
				else if (endsWith(lastWord, 'S') || endsWith(lastWord, 'Z') || endsWith(lastWord, 'CH') || endsWith(lastWord, 'cH') || endsWith(lastWord, 'SH') || endsWith(lastWord, 'sH') || endsWith(lastWord, 'X')) {
					//atlas   -> atlases; church  -> churches; wish -> wishes; box -> boxes
					lastWord = lastWord + 'ES';
				}
				else if (endsWith(lastWord, 'f')) {
					//wolf -> wolves 
					lastWord = lastWord.slice(0, -1) + 'ves';
				}
				else if (endsWith(lastWord, 'F')) {
					lastWord = lastWord.slice(0, -1) + 'VES';
				}
				else if (endsWith(lastWord, 'fe')) {
					//life -> lives
					lastWord = lastWord.slice(0, -2) + 'ves';
				}
				else if (endsWith(lastWord, 'FE')) {
					lastWord = lastWord.slice(0, -2) + 'VES';
				}
				else if (endsWith(lastWord, 'Fe')) {
					//life -> lives
					lastWord = lastWord.slice(0, -2) + 'Ves';
				}
				else {
					lastWord = (lastWord.slice(-1).toLowerCase() === lastWord.slice(-1)) ? lastWord + 's' : lastWord + 'S';
				}
				arr[arr.length-1] = lastWord;
				result = arr.join(" ");
			}
			return result;
		}
		
		function getTermContext(startObjectName, visitedAssociationsArr) {
		
			var i;
			var assocInfo;
			var finalContext;
			var fullContext;
		
			fullContext = startObjectName;
			finalContext = fullContext;
			for (i = 0; i < visitedAssociationsArr.length; i++) {
					assocInfo = visitedAssociationsArr[i];
					fullContext += '.' + assocInfo.name;
					//finalContext will include only one-to-many associations - for example - in 'player.country' will contain only 'player' 
					if (assocInfo.cardinality === vocabularyConstants.CARDINALITY_ONE_TO_MANY) {
						finalContext = fullContext;
					}
			}
			return finalContext;
		}
		
		function calculateIsCollection(currentAssocCardinality, isSoFarCollection) {
		
			var isCollection = false;
		
			//If the route above us is already a collection then we definitely a collection
			if (isSoFarCollection) {
				isCollection = true;
			} else {
				//If cardinality is one to many then we are a collection
				if (currentAssocCardinality === vocabularyConstants.CARDINALITY_ONE_TO_MANY) {
					isCollection = true;
				} else {
					isCollection = false;
				}
			}
			return isCollection;
		}
		
		function pushTermParamArray(paramObj) {
			
			var termInfo, modifier, termsModifiersInfo;
			var termId = infraUtilsBaseLib.createUUID();
		    
			termInfo = new vocaObjects.TermInfo(
					paramObj.vocabularyId,
					vocaName,
					termId,
					paramObj.description,
					paramObj.expression,
					paramObj.businessDataType,
					paramObj.isCollection ? '1' : '0',
					paramObj.isConditionalContext ? '1' : '0',
					paramObj.context,
					scope, 
					isPrivate ? '1' : '0',
					paramObj.isDeprecated ? '1' : '0',
					paramObj.isVocaRuleTerm);
			if(paramObj.friendlyDesc){
				termInfo.friendlyTerm = paramObj.friendlyDesc;
			}
			//Add the term to the runtime cache.
			rtAll.allTerms = rtAll.allTerms ? rtAll.allTerms.concat([termInfo]) : [termInfo];
			
			for (modifier in paramObj.modifiers) {
			    if (paramObj.modifiers.hasOwnProperty(modifier) && paramObj.modifiers[modifier] === true) {
			    	termsModifiersInfo  = new vocaObjects.TermModifierInfo(
			    			termId,
			    			modifier,
			    			infraUtilsBaseLib.createUUID());
			    	
			    	//Add the term modifier to the runtime cache.
			    	rtAll.allTermsModifiers = rtAll.allTermsModifiers ? rtAll.allTermsModifiers.concat([termsModifiersInfo]) : [termsModifiersInfo];
			    }
			}
		}
		
		function addTermParamArray(termDescriptions, expression, modifiers, businessDataType, isCollection, isConditionalContext, context, vocabularyId, isVocaRule) {
			
			var i;
			var paramObj = {};
			
			paramObj.expression = expression;
			paramObj.modifiers = modifiers;
			paramObj.businessDataType = businessDataType;
			paramObj.isCollection = isCollection;
			paramObj.isConditionalContext = isConditionalContext;
			paramObj.context = context;
			paramObj.vocabularyId = vocabularyId;
			paramObj.isDeprecated = false;
			paramObj.description = termDescriptions.description;
			if(byDescModeIsOn){
				paramObj.friendlyDesc = termDescriptions.friendlyDesc;
			}

			if (isVocaRule){
				paramObj.isVocaRuleTerm = true;
			}
			//Create a TermObj:
			pushTermParamArray(paramObj);
			//Create TermObj also for the deprecated:
			for (i = 0; i < termDescriptions.deprecated.length; i++){
				paramObj.isDeprecated = true;
				paramObj.description = termDescriptions.deprecated[i];
				pushTermParamArray(paramObj);
			}
		}
		
		//Generates a new "modifiers" object
		function createModifiersObj(isAllFlag, isNotFlag, isCurrentFlag){
			
			var modifiers = {};
			
			modifiers[vocabularyConstants.TERM_MODIFIER_ALL] = isAllFlag;
			modifiers[vocabularyConstants.TERM_MODIFIER_NOT] = isNotFlag;
			modifiers[vocabularyConstants.TERM_MODIFIER_CURRENT] = isCurrentFlag;
			return modifiers;
		}
		
		//Generates the Term for the deprecated versions (e.g. DeprecatedPlural)
		function generateDeprecatedPlural(deprecatedArr, prefix, noun, suffix, isOneToMany){
			
			//currently we have only the 'DeprecatedPlural', it will be maintained in the first item (string) of the deprecatedArr (i.e deprecatedArr[0])
			if(isOneToMany){
				deprecatedArr[0] = prefix + noun + getTheSforPlural(noun) + suffix;
			}
			else{
				deprecatedArr[0] = prefix + noun + suffix;
			}
		}
		
		//Generate the Association Chain string for Term prefix/suffix
		function generateAssociationChain(visitedAssociationsArr, createConditionalContextTerm, isAllModifier, isWithoutLastAssoc){
			
			var i;
			var deprecated = [];
			var assocInfo = null;
			var assoChainStr = '';
			var assoChainStrByDesc = '';
			var descProperty = vocabularyConstants.PROPERTY_NAME_OM_DESCRIPTION;
			var tmpAssoChainStr = '';
			var associationChain = {"description": "", "deprecated": [], "friendlyDesc": ""};
			var prefix_of_the = vocabularyConstants.TERM_OF_THE_STRING;
			var prefix_of_all = vocabularyConstants.TERM_OF_STRING + vocabularyConstants.TERM_ALL_STRING;
			
			for (i = 0; i < visitedAssociationsArr.length; i++) {
				if(i === (visitedAssociationsArr.length -1) && isWithoutLastAssoc){
					break;
				}
				assocInfo = visitedAssociationsArr[i];
				if (assocInfo.cardinality === vocabularyConstants.CARDINALITY_ONE_TO_MANY && !createConditionalContextTerm) {
					tmpAssoChainStr = assoChainStr;
					//Concatenate  'all' + <association>s + chain
					assoChainStr = prefix_of_all + pluralize(assocInfo.name) + tmpAssoChainStr; 
					//Generate a corresponding assoChainStrByDesc:
					if(byDescModeIsOn){
						assoChainStrByDesc = prefix_of_all + pluralize(assocInfo[descProperty]) + assoChainStrByDesc; 
					}
					//take care the deprecated:
					if (deprecated.length > 0){		          
						generateDeprecatedPlural(deprecated, prefix_of_all, assocInfo.name, deprecated[0], true);
					} else if (isDeprecatedPlural(assocInfo.name) && !isAllModifier) {
						generateDeprecatedPlural(deprecated, prefix_of_all, assocInfo.name, tmpAssoChainStr, true);
					}
				}
				else{
					if (!isAllModifier){
						//Concatenate  'the' + <association> + chain
						assoChainStr = prefix_of_the + assocInfo.name + assoChainStr;
						//Generate a corresponding assoChainStrByDesc:
						assoChainStrByDesc = byDescModeIsOn ? prefix_of_the + assocInfo[descProperty] + assoChainStrByDesc : '';
						if (deprecated.length > 0){		          
							generateDeprecatedPlural(deprecated, prefix_of_the, assocInfo.name, deprecated[0], false);
						}
					} else{
						//Concatenate  'the' + <association>s + chain. For ALL modifier Term.
						assoChainStr = prefix_of_the + pluralize(assocInfo.name) + assoChainStr;
						//Generate a corresponding assoChainStrByDesc:
						assoChainStrByDesc = byDescModeIsOn ? prefix_of_the + pluralize(assocInfo[descProperty]) + assoChainStrByDesc : '';
					}
				}
			}
			associationChain.description = assoChainStr;
			associationChain.deprecated = deprecated;
			associationChain.friendlyDesc = assoChainStrByDesc;
			return associationChain;
		}
		
		//Remove prefixes from associationChain string
		function removePrefixesFromAssociationChain(associationChain){
			
			var i;
			var numOfWordsToRemove = 3;
			var description = associationChain.description;
			var deprecatedArr = associationChain.deprecated;
			var friendlyDesc = associationChain.friendlyDesc;
			 
			for (i=0; i < numOfWordsToRemove; i++){
				if(description.indexOf(' ') > -1){
					description = description.substr(description.indexOf(' ') + 1 );
					//Change the corresponding friendlyDesc accordingly:
					friendlyDesc = byDescModeIsOn ? friendlyDesc.substr(friendlyDesc.indexOf(' ') + 1 ) : '';
				}
				if(deprecatedArr.length && deprecatedArr[0].indexOf(' ') > -1){
					deprecatedArr[0] = deprecatedArr[0].substr(deprecatedArr[0].indexOf(' ') + 1 );
				}
			}
			associationChain.description = description;
			associationChain.deprecated = deprecatedArr;
			associationChain.friendlyDesc = friendlyDesc;
		}
		
		//Generate base Term for DO Association.
		function generateBaseTermForAssociation(dataObject, visitedAssociationsArr, termExpression, attrInfo, termContext, isCollection, vocabularyId){
			
			var suffix = '';
			var ofStr = vocabularyConstants.TERM_OF_STRING;
			var aStr = vocabularyConstants.TERM_A_STRING;
			var anStr = vocabularyConstants.TERM_AN_STRING;
			var isStr = vocabularyConstants.TERM_IS_STRING;
			var suffix4FriendlyTerm = null;
			var deprecatedArr = [];
			var description = "";
			var friendlyDesc = "";
			var associationChain = {};	
			var contextualAssociationChain = {};
			var modifiers = createModifiersObj(false, false, false);
			var termDescription = {"description": "", "deprecated": [], "friendlyDesc": ""};  
			var startDOName = dataObject[vocabularyConstants.PROPERTY_NAME_OM_NAME];
			var descProperty = vocabularyConstants.PROPERTY_NAME_OM_DESCRIPTION;
			
			//Prepare the suffix. For example 'of a/an' + <startDOName>
			if (isStartWithVowel(startDOName)){
				suffix = ofStr + anStr + startDOName;
			} else {
				suffix = ofStr + vocabularyConstants.TERM_A_STRING + startDOName;
			}
			if (byDescModeIsOn){
				if(isStartWithVowel(dataObject[descProperty])){
					suffix4FriendlyTerm = ofStr + anStr + dataObject[descProperty];
				} else {
					suffix4FriendlyTerm = ofStr + aStr + dataObject[descProperty];
				}
			}
			associationChain = generateAssociationChain(visitedAssociationsArr, false, false);
			//Generate Term for the DO Association.    For example: payments of a player.
			if (attrInfo === null && isCollection){
				//Remove the prefix 'of the/all' from the beginning of the associationChain
				removePrefixesFromAssociationChain(associationChain);
				description = associationChain.description + suffix;
				if(associationChain.deprecated && associationChain.deprecated[0]){
					deprecatedArr[0] = associationChain.deprecated[0] + suffix;
				}
				termDescription.description = description;
				termDescription.deprecated = deprecatedArr;
				//Generate a corresponding FriendlyTerm:
				if(byDescModeIsOn){
					friendlyDesc = associationChain.friendlyDesc + suffix4FriendlyTerm;
					termDescription.friendlyDesc = friendlyDesc;
				}
				addTermParamArray(termDescription, termExpression, modifiers, null, isCollection, false, termContext, vocabularyId); 
			} else if (attrInfo !== null && attrInfo.businessDataType !== vocabularyConstants.BUSINESS_DATA_TYPE_BOOLEAN){
				//Generate base Term for the non-boolean Association Attribute.    For example: <attr> + of the/all <assoc> + of a player.
				description = attrInfo.name + associationChain.description + suffix;
				if(associationChain.deprecated && associationChain.deprecated[0]){
					deprecatedArr[0] = attrInfo.name + associationChain.deprecated[0] + suffix;
				}
				termDescription.description = description;
				termDescription.deprecated = deprecatedArr;
				//Generate a corresponding FriendlyTerm:
				if(byDescModeIsOn){
					friendlyDesc = attrInfo[descProperty] + associationChain.friendlyDesc + suffix4FriendlyTerm;
					termDescription.friendlyDesc = friendlyDesc;
				}
				addTermParamArray(termDescription, termExpression, modifiers, attrInfo.businessDataType, isCollection, false, termContext, vocabularyId);
				//Generate also ConditionalContextTerm for the non-boolean Association Attribute.
				if (isCollection){
					//Generate contextual AssociationChain
					contextualAssociationChain = generateAssociationChain(visitedAssociationsArr, true, false);
					description = attrInfo.name + contextualAssociationChain.description + suffix;
					termDescription.description = description;
					termDescription.deprecated = [];
					//Generate a corresponding FriendlyTerm:
					if(byDescModeIsOn){
						friendlyDesc = attrInfo[descProperty] + contextualAssociationChain.friendlyDesc + suffix4FriendlyTerm;
						termDescription.friendlyDesc = friendlyDesc;
					}
					addTermParamArray(termDescription, termExpression, modifiers, attrInfo.businessDataType, false, true, termContext, vocabularyId);
				}
			}  else if (attrInfo !== null && attrInfo.businessDataType === vocabularyConstants.BUSINESS_DATA_TYPE_BOOLEAN){
				contextualAssociationChain = generateAssociationChain(visitedAssociationsArr, true, false);
				//Remove the prefix 'of the/all' from the beginning of the associationChain
				removePrefixesFromAssociationChain(contextualAssociationChain);   
				description = contextualAssociationChain.description + suffix + isStr + attrInfo.name;
				if(contextualAssociationChain.deprecated && contextualAssociationChain.deprecated[0]){
					deprecatedArr[0] = contextualAssociationChain.deprecated[0] + suffix + isStr + attrInfo.name;
				}
				termDescription.description = description;
				termDescription.deprecated = deprecatedArr;
				//Generate a corresponding FriendlyTerm:
				if(byDescModeIsOn){
					friendlyDesc = contextualAssociationChain.friendlyDesc + suffix4FriendlyTerm + isStr + attrInfo[descProperty];
					termDescription.friendlyDesc = friendlyDesc;
				}
				if (isCollection){
					//Generate base Term for the boolean Association Attribute (1:n), in context.    For example: <assoc> + of a <DO> + is + <attr>.
					addTermParamArray(termDescription, termExpression, modifiers, attrInfo.businessDataType, false, true, termContext, vocabularyId);
				} else{
					//Generate base Term for the boolean Association Attribute (1:1).    or example: <assoc> + of a <DO> + is + <attr>.
					addTermParamArray(termDescription, termExpression, modifiers, attrInfo.businessDataType, false, false, termContext, vocabularyId);
				}
			}
		}
		
		//Generate Term with ALL modifier for DO Association.
		function generateTermForAllModifierForAssociation(dataObject, assoc, visitedAssociationsArr, termExpression, attrInfo, termContext, vocabularyId){
			
			var suffix = "";
			var suffix4FriendlyTerm = "";
			var deprecatedArr = [];
			var description = "";
			var friendlyDesc = "";
			var termDescription = null;
			var modifiers = createModifiersObj(true, false, false);
			var associationChain = "";
			var startDOName = dataObject[vocabularyConstants.PROPERTY_NAME_OM_NAME];
			var assocName = assoc.name;
			var descProperty = vocabularyConstants.PROPERTY_NAME_DESCRIPTION;
			
			//Prepare the suffix. Always will end with "... of all <startDOName>s"
			suffix = vocabularyConstants.TERM_OF_STRING + vocabularyConstants.TERM_ALL_STRING + pluralize(startDOName);
			if (byDescModeIsOn){
				suffix4FriendlyTerm = vocabularyConstants.TERM_OF_STRING + vocabularyConstants.TERM_ALL_STRING + pluralize(dataObject[descProperty]);
			}
			//Generate Term with ALL modifier for the DO Association.     For example: <attr>s of all <DO>.
			if (attrInfo === null){
				//Create associationChain without the prefix 'of the/all <last Association>':
				associationChain = generateAssociationChain(visitedAssociationsArr, false, true, true);
				associationChain.description = associationChain.description.length ? associationChain.description : "";
				description = pluralize(assocName) + associationChain.description + suffix;
				if(byDescModeIsOn){
					friendlyDesc = pluralize(assoc.description) + associationChain.friendlyDesc + suffix4FriendlyTerm;
				}
				if(associationChain.deprecated && associationChain.deprecated[0]){
					deprecatedArr[0] = pluralize(assocName) + associationChain.deprecated[0] + suffix;
				}
				termDescription = {"description": description, "deprecated": deprecatedArr, "friendlyDesc": friendlyDesc}; 
				addTermParamArray(termDescription, termExpression, modifiers, null, true, false, null, vocabularyId);
			} else if(attrInfo !== null && attrInfo.businessDataType !== vocabularyConstants.BUSINESS_DATA_TYPE_BOOLEAN){
				//Generate Term with ALL modifier for the non-boolean DO Association Attribute (1:1 and 1:n).    For example: <attr> + of all/the + <assoc> + of all + <DO>s.
				associationChain = generateAssociationChain(visitedAssociationsArr, false, true, false);
				description = attrInfo.name + associationChain.description + suffix;
				if(byDescModeIsOn){
					friendlyDesc = attrInfo[descProperty] + associationChain.friendlyDesc + suffix4FriendlyTerm;
				}
				termDescription = {"description": description, "deprecated": deprecatedArr, "friendlyDesc": friendlyDesc}; 
				addTermParamArray(termDescription, termExpression, modifiers, attrInfo.businessDataType, true, false, termContext, vocabularyId);
			}
		}
		
		//Generate Term with NOT modifier for DO Association.
		function generateTermForNotModifierForAssociation(dataObject, visitedAssociationsArr, termExpression, attrInfo, termContext, isCollection, vocabularyId){
			
			var ofStr = vocabularyConstants.TERM_OF_STRING;
			var aStr = vocabularyConstants.TERM_A_STRING;
			var anStr = vocabularyConstants.TERM_AN_STRING;
			var suffix = '';
			var suffix4FriendlyTerm = "";
			var description = "";
			var termDescription = null;	
			var contextualAssociationChain = {};
			var modifiers = createModifiersObj(false, true, false);
			var friendlyDesc = "";
			var startDOName = dataObject[vocabularyConstants.PROPERTY_NAME_OM_NAME];
			var descProperty = vocabularyConstants.PROPERTY_NAME_DESCRIPTION;
			
			//Prepare the suffix. For example 'of a/an' + <startDOName>
			if (isStartWithVowel(startDOName)){
				suffix = ofStr + anStr + startDOName;
			} else {
				suffix = ofStr + aStr + startDOName;
			}
			if (byDescModeIsOn){
				if(isStartWithVowel(dataObject[descProperty])){
					suffix4FriendlyTerm = ofStr + anStr + dataObject[descProperty];
				} else {
					suffix4FriendlyTerm = ofStr + aStr + dataObject[descProperty];
				}
			}
			//Generate Term with Not modifier for the DO Association. 
			if (attrInfo !== null && attrInfo.businessDataType === vocabularyConstants.BUSINESS_DATA_TYPE_BOOLEAN){
				//Generate the contextual association chain
				contextualAssociationChain = generateAssociationChain(visitedAssociationsArr, true, false);
				//Remove the prefix 'of the/all' from the beginning of the associationChain
				removePrefixesFromAssociationChain(contextualAssociationChain);   
				description = contextualAssociationChain.description + suffix + vocabularyConstants.TERM_IS_NOT_STRING + attrInfo.name;
				if(byDescModeIsOn){
					friendlyDesc = contextualAssociationChain.friendlyDesc + suffix4FriendlyTerm + vocabularyConstants.TERM_IS_NOT_STRING + attrInfo[descProperty];
				}
				termDescription = {"description": description, "deprecated": [], "friendlyDesc": friendlyDesc};
				if (isCollection){
					//Generate base Term for the boolean Association Attribute (1:n), in context.    For example: <assoc> + of a <DO> + is + <attr>.
					addTermParamArray(termDescription, termExpression, modifiers, attrInfo.businessDataType, false, true, termContext, vocabularyId);
				} else{
					//Generate base Term for the boolean Association Attribute (1:1).    or example: <assoc> + of a <DO> + is + <attr>.
					addTermParamArray(termDescription, termExpression, modifiers, attrInfo.businessDataType, false, false, termContext, vocabularyId);
				}
			}
		}
		
		//Generate Term with CURRENT modifier for DO Association.
		function generateTermForCurrentModifierForAssociation(dataObject, assoc, visitedAssociationsArr, termExpression, attrInfo, termContext, isCollection, vocabularyId){
			
			var suffix = "";
			var suffix4FriendlyTerm = "";
			var deprecatedArr = [];
			var friendlyDesc = "";
			var description = "";
			var termDescription = null;
			var modifiers = createModifiersObj(false, false, true);
			var associationChain = "";
			var startDOName = dataObject[vocabularyConstants.PROPERTY_NAME_OM_NAME];
			var assocName = assoc.name;
			var descProperty = vocabularyConstants.PROPERTY_NAME_DESCRIPTION;
			
			//Prepare the suffix. Always will end with "... of current <startDOName>"
			suffix = vocabularyConstants.TERM_OF_STRING + vocabularyConstants.TERM_CURRENT_STRING + startDOName;
			if (byDescModeIsOn){
				suffix4FriendlyTerm = vocabularyConstants.TERM_OF_STRING + vocabularyConstants.TERM_CURRENT_STRING + dataObject[descProperty];
			}
			//Generate Term with CURRENT modifier for the DO Association.     For example: payments of current player.
			if (attrInfo === null && isCollection){
				//Create associationChain without the prefix 'of the/all <last Association>':
				associationChain = generateAssociationChain(visitedAssociationsArr, false, false, true);
				associationChain.description = associationChain.description.length ? associationChain.description : "";
				description = pluralize(assocName) + associationChain.description + suffix;
				if((associationChain.deprecated && associationChain.deprecated[0]) || isDeprecatedPlural(assocName)){
					assocName = isDeprecatedPlural(assocName) ? assocName + getTheSforPlural(assocName) : assocName;
					deprecatedArr[0] = associationChain.deprecated && associationChain.deprecated[0] && associationChain.deprecated[0].length ? ' ' + associationChain.deprecated[0] : associationChain.description;
					deprecatedArr[0] = assocName + deprecatedArr[0] + suffix;
				}
				if(byDescModeIsOn){
					friendlyDesc = pluralize(dataObject[descProperty]) + associationChain.friendlyDesc + suffix4FriendlyTerm;
				}
				termDescription = {"description": description, "deprecated": deprecatedArr, "friendlyDesc": friendlyDesc};
				addTermParamArray(termDescription, termExpression, modifiers, null, true, true, null, vocabularyId);
			} else if (attrInfo !== null && attrInfo.businessDataType !== vocabularyConstants.BUSINESS_DATA_TYPE_BOOLEAN){
				associationChain = generateAssociationChain(visitedAssociationsArr, false, false, false);
				//Generate a Term with CURRENT modifier for non-boolean Association Attribute (1:1 and 1:n).    For example: <attr> + of the/all + <assoc> + of current + <DO>.
				description = attrInfo.name + associationChain.description + suffix;
				if(associationChain.deprecated && associationChain.deprecated[0]){
					deprecatedArr[0] = attrInfo.name + associationChain.deprecated[0] + suffix;
				}
				if(byDescModeIsOn){
					friendlyDesc = attrInfo[descProperty] + associationChain.friendlyDesc + suffix4FriendlyTerm;
				}
				termDescription = {"description": description, "deprecated": deprecatedArr, "friendlyDesc": friendlyDesc};
				addTermParamArray(termDescription, termExpression, modifiers, attrInfo.businessDataType, isCollection, true, termContext, vocabularyId);
			} else if (attrInfo !== null && attrInfo.businessDataType === vocabularyConstants.BUSINESS_DATA_TYPE_BOOLEAN && !isCollection){
				associationChain = generateAssociationChain(visitedAssociationsArr, false, false, false);
				//Generate a Term with CURRENT modifier for boolean Association Attribute (1:1).    For example: <boolean_assoc> + of current + <DO> + is/not + <attr>.
				removePrefixesFromAssociationChain(associationChain); //Remove the first 'of the' from the associationChain.
				description = associationChain.description + suffix + vocabularyConstants.TERM_IS_STRING + attrInfo.name;
				if(associationChain.deprecated && associationChain.deprecated[0]){
					deprecatedArr[0] = associationChain.deprecated[0] + suffix + vocabularyConstants.TERM_IS_STRING + attrInfo.name;
				}
				if(byDescModeIsOn){
					friendlyDesc = associationChain.friendlyDesc + suffix4FriendlyTerm + vocabularyConstants.TERM_IS_STRING + attrInfo[descProperty];
				}
				termDescription = {"description": description, "deprecated": deprecatedArr, "friendlyDesc": friendlyDesc};
				addTermParamArray(termDescription, termExpression, modifiers, attrInfo.businessDataType, isCollection, true, termContext, vocabularyId);
				//Generate the same Term with the NOT modifier.
				modifiers = createModifiersObj(false, true, true);
				description = associationChain.description + suffix + vocabularyConstants.TERM_IS_NOT_STRING + attrInfo.name;
				if(associationChain.deprecated && associationChain.deprecated[0]){
					deprecatedArr[0] = associationChain.deprecated[0] + suffix + vocabularyConstants.TERM_IS_NOT_STRING + attrInfo.name;
				}
				if(byDescModeIsOn){
					friendlyDesc = associationChain.friendlyDesc + suffix4FriendlyTerm + vocabularyConstants.TERM_IS_NOT_STRING + attrInfo[descProperty];
				}
				termDescription = {"description": description, "deprecated": deprecatedArr, "friendlyDesc": friendlyDesc};
				addTermParamArray(termDescription, termExpression, modifiers, attrInfo.businessDataType, isCollection, true, termContext, vocabularyId);
			}
		}
		
		//Generates Terms for a DO Association Attribute.
		function generateTermsForDOAssociationAttribute(dataObject, visitedAssociationsArr, assoc, attrInfo, isCollection, vocabularyId){
			
			var termContext = '';
			var termExpression = '';
			var startDOName = dataObject[vocabularyConstants.PROPERTY_NAME_OM_NAME];
			
			//Calculate termContext if attrInfo exists For example: for 'player.country.name' => context = 'player'
			if (attrInfo !== null ){
				termContext = getTermContext(startDOName, visitedAssociationsArr);
			}
			//Generate a TermExpression for the association attribute.    For example: 'player.payment.id'.
			termExpression = getTermExpression(startDOName, visitedAssociationsArr, attrInfo.name);
			//Generate a base Term for Association Attribute 
			generateBaseTermForAssociation(dataObject, visitedAssociationsArr, termExpression, attrInfo, termContext, isCollection, vocabularyId);
			//Generate a Term with ALL modifier for Association Attribute.
			generateTermForAllModifierForAssociation(dataObject, assoc, visitedAssociationsArr, termExpression, attrInfo, termContext, vocabularyId);
			//Generate a Term with NOT modifier for DO Association Attribute.
			generateTermForNotModifierForAssociation(dataObject, visitedAssociationsArr, termExpression, attrInfo, termContext, isCollection, vocabularyId);
			//Generate a Term with CURRENT modifier for DO Association Attribute.
			generateTermForCurrentModifierForAssociation(dataObject, assoc, visitedAssociationsArr, termExpression, attrInfo, termContext, isCollection, vocabularyId);
		}
		
		
		//Generates Terms for a DO Association.
		function generateTermsForDOAssociation(dataObject, visitedAssociationsArr, assocInfo, vocabularyFullName, isSoFarCollection, vocabularyId, dbConn, dependenciesList) {
			var i,j;
			var attrArr;
			var attrInfo;
			var assocArr;
			var termExpression;
			var isCollection;
			var vocabularyDataProvider = runtimeServicesLib.getVocabularyDataProvider(dbConn);
		
			//Don't re-visit an association (avoid endless loop)
			if (!assocWasVisited(visitedAssociationsArr, assocInfo)) {
				//Save current association + its cardinality in the visitedAssociationsArr
				visitedAssociationsArr.push(assocInfo);
				isCollection = calculateIsCollection(assocInfo.cardinality, isSoFarCollection);
				//For example: 'player.payment'
				termExpression = getTermExpression(dataObject[vocabularyConstants.PROPERTY_NAME_OM_NAME], visitedAssociationsArr);
				//Generate Term for the DO Association.     For example: payments of a player.
				generateBaseTermForAssociation(dataObject, visitedAssociationsArr, termExpression, null, null, isCollection, vocabularyId); 
				//Generate Term with ALL modifier for the DO Association.      For example: servers of all player.
				generateTermForAllModifierForAssociation(dataObject, assocInfo, visitedAssociationsArr, termExpression, null, null, vocabularyId);
				//Generate Term with CURRENT modifier for the DO Association.      For example: servers of all player.
				generateTermForCurrentModifierForAssociation(dataObject, assocInfo, visitedAssociationsArr, termExpression, null, null, isCollection, vocabularyId);
				//Get association attributes
				attrArr = vocabularyDataProvider.getAttributes(vocabularyFullName, assocInfo.target);
				//Generate Terms for each association attribute
				for (i = 0, j = attrArr.length; i < j; i++) {
					attrInfo = attrArr[i];
					generateTermsForDOAssociationAttribute(dataObject, visitedAssociationsArr, assocInfo, attrInfo, isCollection, vocabularyId);
				}
				//Run recursively on all existing association of this association.
				assocArr = vocabularyDataProvider.getAssociations(vocabularyFullName, assocInfo.target);
				for (i = 0, j = assocArr.length; i < j; i++) {
					generateTermsForDOAssociation(dataObject, visitedAssociationsArr, assocArr[i], vocabularyFullName, isCollection, vocabularyId, dbConn, dependenciesList);
				}
				//Create dependency between terms to the associasion's target object attributes. So in case the base vcabulary was change, the activation of  
				//the vocabularies poited to it will be called and there terms will be regenerated
				if (writeDependecies && assocInfo.vocaName !== vocabularyFullName){
					dependenciesList[vocabularyConstants.PROPERTY_NAME_DATA_OBJECTS + '.' + assocInfo.target + '.' + vocabularyConstants.PROPERTY_NAME_OM_ATTRIBUTES] = 
					                                                                                {"category" : dependencyConstantsLib.CATEGORY_VOCA_DO_ATTRIBUTES,
					                                                                                 "DOName"   : assocInfo.target,
					                                                                                 "vocaName" : assocInfo.vocaName};
				}
				
				visitedAssociationsArr.pop();
			}
		}
		
		//Generates a base Terms for a DO (without modifiers)
		function generateBaseTerm(dataObject, attrInfo, termExpression, vocabularyId){
			
			var attName = null;
			var attDesc = null;
			var attDatatype = null;
			var modifiers = null;
			var description = "";
			var deprecatedArr = [];
			var friendlyDesc = "";
			var dataObjectDesc = byDescModeIsOn ? dataObject[vocabularyConstants.PROPERTY_NAME_OM_DESCRIPTION] : null; //"flight desc"
			var dataObjectName = dataObject[vocabularyConstants.PROPERTY_NAME_OM_NAME];                                //FLIGHT
			var termDescription = {"description": "", "deprecated": [], "friendlyDesc": ""};  
			
			//check if there is an attribute
			if(attrInfo === null || !attrInfo.hasOwnProperty("name")){
				//Generate a basic Term for the DO.    For example: "players"
				description = pluralize(dataObjectName);
				if (isDeprecatedPlural(dataObjectName)){
					deprecatedArr.push(dataObjectName + getTheSforPlural(dataObjectName));
				}
				//Generate a basic FriendlyTerm for the DO.
				if(byDescModeIsOn){
					friendlyDesc = pluralize(dataObjectDesc);
				}
				termDescription.description = description;
				termDescription.deprecated = deprecatedArr;
				termDescription.friendlyDesc = friendlyDesc;
				modifiers = createModifiersObj(true, false, false);
				addTermParamArray(termDescription, termExpression, modifiers, null, true, false, null, vocabularyId);
			}
			else{
				attName = attrInfo.name;
				attDatatype = attrInfo.businessDataType;
				modifiers = createModifiersObj(false, false, false);
				//check if attribute type is boolean
				if (attDatatype === vocabularyConstants.BUSINESS_DATA_TYPE_BOOLEAN){
					//Generate a Term for the boolean attribute.    For example: Player is whale.
					description = dataObjectName + vocabularyConstants.TERM_IS_STRING + attName;
					termDescription.description = description;
					//Generate a corresponding FriendlyTerm:
					if(byDescModeIsOn){
						attDesc = attrInfo[vocabularyConstants.PROPERTY_NAME_DESCRIPTION];
						friendlyDesc = dataObjectDesc + vocabularyConstants.TERM_IS_STRING + attDesc;
					}
					termDescription.friendlyDesc = friendlyDesc;
					addTermParamArray(termDescription, termExpression, modifiers, attDatatype, false, false, dataObjectName, vocabularyId);
					
				} else {  //for non-boolean attributes
					//Generate a Term for the non-boolean attribute. For example:    Name of the player.
					description = attName + vocabularyConstants.TERM_OF_THE_STRING + dataObjectName; 
					termDescription.description = description;
					//Generate a corresponding FriendlyTerm:
					if(byDescModeIsOn){
						attDesc = attrInfo[vocabularyConstants.PROPERTY_NAME_DESCRIPTION];
						friendlyDesc = attDesc + vocabularyConstants.TERM_OF_THE_STRING + dataObjectDesc; 
					}
					termDescription.friendlyDesc = friendlyDesc;
					addTermParamArray(termDescription, termExpression, modifiers, attDatatype, false, false, dataObjectName, vocabularyId); 
				}
			}
		}
		
		//Generates a Term with ALL modifier for a DO Attribute
		function generateTermForAllModifier(dataObject, attrInfo, termExpression, vocabularyId){
			
			var attName = null;
			var attDesc = byDescModeIsOn ? attrInfo[vocabularyConstants.PROPERTY_NAME_DESCRIPTION] : null;
			var attDatatype = attrInfo.businessDataType;
			var modifiers = createModifiersObj(true, false, false);
			var termDescription = {"description": "", "deprecated": [], "friendlyDesc": ""};  
			var dataObjectDesc = byDescModeIsOn ? dataObject[vocabularyConstants.PROPERTY_NAME_OM_DESCRIPTION] : null;
			var dataObjectName = dataObject[vocabularyConstants.PROPERTY_NAME_OM_NAME];
			var friendlyDesc = "";
																		  
			if(attrInfo !== null || attrInfo.hasOwnProperty("name")){
				attName = attrInfo.name;
				termDescription.description = attName + vocabularyConstants.TERM_OF_STRING + vocabularyConstants.TERM_ALL_STRING + pluralize(dataObjectName);
				//Generate a corresponding FriendlyTerm:
				if(byDescModeIsOn){
					friendlyDesc = attDesc + vocabularyConstants.TERM_OF_STRING + vocabularyConstants.TERM_ALL_STRING + pluralize(dataObjectDesc); 
				}
				termDescription.friendlyDesc = friendlyDesc;
				addTermParamArray(termDescription, termExpression, modifiers, attDatatype, true, false, dataObjectName, vocabularyId); 
			}
		}
		
		//Generates a Term with NOT modifier for a DO Attribute
		function generateTermForNotModifier(dataObject, attrInfo, termExpression, vocabularyId){
			
			var attName = null;
			var attDesc = byDescModeIsOn ? attrInfo[vocabularyConstants.PROPERTY_NAME_DESCRIPTION] : null;
			var dataObjectName = dataObject[vocabularyConstants.PROPERTY_NAME_OM_NAME];
			var dataObjectDesc = byDescModeIsOn ? dataObject[vocabularyConstants.PROPERTY_NAME_OM_DESCRIPTION] : null;
			var attDatatype = attrInfo.businessDataType;
			var modifiers = createModifiersObj(false, true, false);
			var termDescription = {"description": "", "deprecated": [], "friendlyDesc": ""};  
			var friendlyDesc = "";
			
			if(attrInfo !== null || attrInfo.hasOwnProperty("name")){
				attName = attrInfo.name;
				//Generate a Term with the 'not' modifier for the boolean attribute.    For example: player is not whale.
				termDescription.description = dataObjectName + vocabularyConstants.TERM_IS_NOT_STRING + attName;
				//Generate a corresponding FriendlyTerm:
				if(byDescModeIsOn){
					friendlyDesc = dataObjectDesc + vocabularyConstants.TERM_IS_NOT_STRING + attDesc;
				}
				termDescription.friendlyDesc = friendlyDesc;
				addTermParamArray(termDescription, termExpression, modifiers, attDatatype, false, false, dataObjectName, vocabularyId);
			}
		}
		
		//Generates a Term with Current modifier for a DO Attribute
		function generateTermForCurrentModifier(dataObject, attrInfo, termExpression, vocabularyId){
			
			var attName = null;
			var attDesc = byDescModeIsOn ? attrInfo[vocabularyConstants.PROPERTY_NAME_DESCRIPTION] : null;
			var dataObjectName = dataObject[vocabularyConstants.PROPERTY_NAME_OM_NAME];
			var dataObjectDesc = byDescModeIsOn ? dataObject[vocabularyConstants.PROPERTY_NAME_OM_DESCRIPTION] : null;
			var attDatatype = null;
			var modifiers = null;
			var termDescription = {"description": "", "deprecated": [], "friendlyDesc": ""};  
			var friendlyDesc = "";  
			
			//Generate a basic Term for the DO.    For example: "players"
			if(attrInfo !== null || attrInfo.hasOwnProperty("name")){
				attName = attrInfo.name;
				attDatatype = attrInfo.businessDataType;
				//check if attribute type is boolean
				if (attDatatype === vocabularyConstants.BUSINESS_DATA_TYPE_BOOLEAN) {
					//Generate a Term with the 'current' modifier for the boolean attribute.    For example: current player is whale.    
					modifiers = createModifiersObj(false, false, true);	
					termDescription.description = vocabularyConstants.TERM_CURRENT_STRING + dataObjectName + vocabularyConstants.TERM_IS_STRING + attName;
					//Generate a corresponding FriendlyTerm:
					if(byDescModeIsOn){
						friendlyDesc = vocabularyConstants.TERM_CURRENT_STRING + dataObjectDesc + vocabularyConstants.TERM_IS_STRING + attDesc;
					}
					termDescription.friendlyDesc = friendlyDesc;
					addTermParamArray(termDescription, termExpression, modifiers, attDatatype, false, true, dataObjectName, vocabularyId);
					
					//Generate a Term with 'current' and 'not' modifiers for the boolean attribute.    For example: Current player is not whale.
					modifiers = createModifiersObj(false, true, true);
					termDescription.description = vocabularyConstants.TERM_CURRENT_STRING + dataObjectName + vocabularyConstants.TERM_IS_NOT_STRING + attName;
					//Generate a corresponding FriendlyTerm:
					if(byDescModeIsOn){
						friendlyDesc = vocabularyConstants.TERM_CURRENT_STRING + dataObjectDesc + vocabularyConstants.TERM_IS_NOT_STRING + attDesc;
					}
					termDescription.friendlyDesc = friendlyDesc;
					addTermParamArray(termDescription, termExpression, modifiers, attDatatype, false, true, dataObjectName, vocabularyId);
				} else {  //for non-boolean attributes
					//Generate a Term with the 'current' modifier for the non-boolean attribute.    For example: Name of current player.
					modifiers = createModifiersObj(false, false, true);
					termDescription.description = attName + vocabularyConstants.TERM_OF_STRING + vocabularyConstants.TERM_CURRENT_STRING + dataObjectName;
					//Generate a corresponding FriendlyTerm:
					if(byDescModeIsOn){
						friendlyDesc = attDesc + vocabularyConstants.TERM_OF_STRING + vocabularyConstants.TERM_CURRENT_STRING + dataObjectDesc;
					}
					termDescription.friendlyDesc = friendlyDesc;
					addTermParamArray(termDescription, termExpression, modifiers, attDatatype, false, true, dataObjectName, vocabularyId); 
				}
			}
		}
		
		//Generates Terms for a DO Attribute.
		function generateTermsForDOAttribute(startDO, attrInfo, termExpression, vocabularyId){
			
			//Generate a Term for the boolean attribute.    For example: Player is whale.
			generateBaseTerm(startDO, attrInfo, termExpression, vocabularyId);
			//Generate a Term with the 'current' modifier.    For example: name of current player.   current player is whale.   current player is not whale.   
			generateTermForCurrentModifier(startDO, attrInfo, termExpression, vocabularyId);
			//check if attribute type is boolean
			if (attrInfo.businessDataType === vocabularyConstants.BUSINESS_DATA_TYPE_BOOLEAN) {
				//Generate a Term with the 'not' modifier for the boolean attribute.    For example: player is not whale.
				generateTermForNotModifier(startDO, attrInfo, termExpression, vocabularyId);
			} else {  //for non-boolean attributes
				//Generate a Term with the 'all' modifier for the non-boolean attribute.    For example: Name of all players.
				generateTermForAllModifier(startDO, attrInfo, termExpression, vocabularyId);
			}  
		}
		
		function generateBaseTermForVocaRule(dataObject, attrInfo, termExpression, vocabularyId){

			var attDatatype = null;
			var modifiers = null;
			var deprecatedArr = [];
			var friendlyDesc = "";
			var dataObjectDesc = byDescModeIsOn ? dataObject[vocabularyConstants.PROPERTY_NAME_OM_DESCRIPTION] : null; 
			var dataObjectName = dataObject[vocabularyConstants.PROPERTY_NAME_OM_NAME];                                
			var termDescription = {"description": "", "deprecated": [], "friendlyDesc": ""};  

			//Generate a basic FriendlyTerm for the DO.
			if(byDescModeIsOn){
				friendlyDesc = dataObjectDesc;
			}
			termDescription.description = dataObjectName;
			termDescription.deprecated = deprecatedArr;
			termDescription.friendlyDesc = friendlyDesc;
			modifiers = createModifiersObj(false, false, false);
			attDatatype = attrInfo.businessDataType;

			addTermParamArray(termDescription, termExpression, modifiers, attDatatype, false, false, null, vocabularyId, true); 
		
		}

		
		//Generates Terms for a Vocabulary Rule DO.
		function generateTermsForVocaRule(dataObject, vocabularyFullName, vocabularyId, dbConn){
			var i,j;
			var attrArr;
			var attrInfo;
			var termExpression;
			var dataObjectName = dataObject[vocabularyConstants.PROPERTY_NAME_OM_NAME];
			var vocabularyDataProvider = runtimeServicesLib.getVocabularyDataProvider(dbConn);
			
			//Generate Terms for result Do's attributes
			//For voca rules - the attributes of dataObject object are the attributes of the result DO
			attrArr = vocabularyDataProvider.getAttributes(vocabularyFullName, dataObjectName);
			for (i = 0, j = attrArr.length; i < j; i++) {
				attrInfo = attrArr[i];
				termExpression = getTermExpression(dataObjectName, {}, attrInfo.name);
				generateBaseTermForVocaRule(dataObject, attrInfo, termExpression, vocabularyId);
			}
		}
		

		
		//Generates Terms for a DO.
		function generateTermsForDO(dataObject, vocabularyFullName, vocabularyId, dbConn, dependenciesList){
		
			var i,j;
			var attrArr;
			var assocArr;
			var attrInfo;
			var termExpression;
			var dataObjectName = dataObject[vocabularyConstants.PROPERTY_NAME_OM_NAME];
			var vocabularyDataProvider = runtimeServicesLib.getVocabularyDataProvider(dbConn);
		
			//Generate term for the data object name (for example: "players")
			termExpression = getTermExpression(dataObjectName, {}, null);
			generateBaseTerm(dataObject, null, termExpression, vocabularyId);
		    
			//Generate Terms for Do's attributes
			attrArr = vocabularyDataProvider.getAttributes(vocabularyFullName, dataObjectName);
			for (i = 0, j = attrArr.length; i < j; i++) {
				attrInfo = attrArr[i];
				termExpression = getTermExpression(dataObjectName, {}, attrInfo.name);
				generateTermsForDOAttribute(dataObject, attrInfo, termExpression, vocabularyId);
			}
		
			//Generate Terms for Do's Associations
			assocArr = vocabularyDataProvider.getAssociations(vocabularyFullName, dataObjectName);
			for (i = 0, j = assocArr.length; i < j; i++) {
				generateTermsForDOAssociation(dataObject, [], assocArr[i], vocabularyFullName, false, vocabularyId, dbConn, dependenciesList);
			}
		}
		
		//Generates Vocabulary Terms.
		function generateTerms(dataObjectArrContent, vocabularyFullName, vocabularyId, dbConn, isPrivate, resourceID) {
			var i,j;
			var dependency;
			var dependenciesList = {};
			var termModes = null;
			var vocabularyDataProvider = runtimeServicesLib.getVocabularyDataProvider();

			//Init the Friendly Term mode flag
			termModes = vocabularyDataProvider.getTermModes();
			for(i = 0 ; i<  termModes.length; i++){
				if(termModes[i] === vocabularyConstants.TermModeRelated.TERM_MODE_BY_DESCRIPTION){
					byDescModeIsOn = true;
					break;
				}
			}
			//Going over each DO and creating it's Terms
			for (i=0, j=dataObjectArrContent.length; i<j; ++i) {
				if (dataObjectArrContent[i].isVocaRule === true){
					generateTermsForVocaRule(dataObjectArrContent[i], vocabularyFullName, vocabularyId, dbConn);
				}else{
					generateTermsForDO(dataObjectArrContent[i], vocabularyFullName, vocabularyId, dbConn, dependenciesList);
				}

			}
			if(writeDependecies){
				dependency = dependencyUtilsLib.createDependenciesInVocabulary(dependencyConstantsLib.CATEGORY_VOCA_TERMS, vocabularyFullName, dependenciesList, isPrivate, dbConn);
				if (Object.keys(dependenciesList).length !== 0) {
					dependecyManager.getInstance(dbConn).setDependencies(resourceID, dependency);
				}
			}
		}

		generateTerms(dataObjectArrContent, vocaName, vocabularyId, dbConn, isPrivate, resourceID);

	};

	
	
	return {
		termGenerationLib: termGenerationLib
	}; 
	
	
}());