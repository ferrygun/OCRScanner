jQuery.sap.declare("sap.rules.ui.parser.resources.vocabulary.lib.runtimeServicesUtils");

jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.constantsBase");


sap.rules.ui.parser.resources.vocabulary.lib.runtimeServicesUtils = sap.rules.ui.parser.resources.vocabulary.lib.runtimeServicesUtils|| {}; 
sap.rules.ui.parser.resources.vocabulary.lib.runtimeServicesUtils.lib = (function() {
	var vocaConstants = sap.rules.ui.parser.resources.vocabulary.lib.constants.lib;
	var bclConst = sap.rules.ui.parser.businessLanguage.lib.constantsBase.lib;

	function runtimeServicesUtilsLib() {}
	
	//************************************************************************************************
	//************************************************************************************************
	runtimeServicesUtilsLib.prototype.loadAllAliases = function (voca, allAliases, rtContext){
		
		voca.aliases = {};

		var transVoca = null;

		var isNonGlobalVoc = voca.scope !== vocaConstants.GLOBAL;

		var i;
		if(allAliases){
			for (i = 0; i < allAliases.length; i++) {
				
				//Collect all the aliases belongs to this vocabulary.
				//In case of a nonGlobal vocabulary, also collect all global aliases and all aliases from public vocabularies in the same scope
	
				// 1. Coolect my vocabulary aliases and Give higher prioruty to my vocabulary aliases (in case defined with the same name in private and public) 
				if (voca.id === allAliases[i].vocaId) {
					if (allAliases[i].isPrivate) {
						// in case alias is  defined also on transient - do not load it from DB
						transVoca = rtContext.getTransientVocabulary();
						if (transVoca === null || (transVoca.isChangedAlias(allAliases[i].name) === false)) {
							voca.aliases[allAliases[i].name] = allAliases[i];
						}
	
					} else {
						voca.aliases[allAliases[i].name] = allAliases[i];
					}
	
				}
	
				// 2. Collect only other publics in the same scope  )scond priority)
				else if ((isNonGlobalVoc && (allAliases[i].scope === vocaConstants.GLOBAL || (allAliases[i].scope === voca.scope && allAliases[i].isPrivate === false)))) {
					if (!voca.aliases[allAliases[i].name]) {
						voca.aliases[allAliases[i].name] = allAliases[i];
					}
				}
			}
		}
	};

	//************************************************************************************************
	//************************************************************************************************
	runtimeServicesUtilsLib.prototype.getScope = function(scope, isPrivate, vocaName) {
		var theScope = scope;
		//For records from release 1
		if (isPrivate === null && scope !== vocaConstants.GLOBAL) {
			//Scope will be the vocabulary full name - just like vocabularies from release 2 without scope definition
			theScope = vocaName;
		}

		return theScope;
	};
	runtimeServicesUtilsLib.prototype.getIsWritable = function(inIsWritable) {
		if (inIsWritable === '1' || inIsWritable === true || inIsWritable === 1) {
			return true;
		}
		return false;
	};

	runtimeServicesUtilsLib.prototype.getIsValueListConverted = function(isValueListConverted) {
		if (isValueListConverted === '1' || isValueListConverted === true || isValueListConverted === 1) {
			return true;
		}
		return false;
	};
	//************************************************************************************************
	//************************************************************************************************
	runtimeServicesUtilsLib.prototype.getFromDigitToBoolean = function(isStr) {

		var isCollection;

		if (isStr === '0' || isStr === false || isStr === 0) {

			isCollection = false;
		} else {

			isCollection = true;
		}

		return isCollection;
	};
	
	//************************************************************************************************
	//************************************************************************************************
	runtimeServicesUtilsLib.prototype.getFromNullOrDigitToBoolean = function(isStr) {

		var isCollection;

		if (isStr === null || isStr === '0' || isStr === false || isStr === 0) {

			isCollection = false;
		} else {

			isCollection = true;
		}

		return isCollection;
	};
	
	//************************************************************************************************
	//************************************************************************************************
	runtimeServicesUtilsLib.prototype.getIsDeprecatedFromDigit = function(isStr) {

		var isDeprecated = false;

		if (isStr === '1' || isStr === true || isStr === 1) {

			isDeprecated = true;
		} 
		
		return isDeprecated;
	};
	//************************************************************************************************
	//************************************************************************************************
	runtimeServicesUtilsLib.prototype.quotesAccoringToType = function(value, type) {
		switch (type) {
			case bclConst.SIMPLE_SELECTION_VALUE_TYPE.STRING.string:
			case bclConst.SIMPLE_SELECTION_VALUE_TYPE.DATE.string:
			case bclConst.SIMPLE_SELECTION_VALUE_TYPE.TIMESTAMP.string:
			case bclConst.SIMPLE_SELECTION_VALUE_TYPE.TIME.string:
				return "'" + value + "'";
			default:
				return value;
		}
	};
	//************************************************************************************************
	//************************************************************************************************
	runtimeServicesUtilsLib.prototype.makeGlobalObjectRTName = function(pack, name) {
		return pack + '::' + name;
	};
	//************************************************************************************************
	//************************************************************************************************
	runtimeServicesUtilsLib.prototype.getIsPrivate = function(scope, isPrivateInDb) {
		var isPrivate;

		//For records from release 1
		if (isPrivateInDb === null) {
			if (scope === vocaConstants.PUBLIC || scope === vocaConstants.GLOBAL) {
				isPrivate = false;
			} else {
				isPrivate = true;
			}
		} else /*records from release 2 */ {
			isPrivate = (isPrivateInDb === '0' || isPrivateInDb === false || isPrivateInDb === 0) ? false : true;
		}

		return isPrivate;
	};
	//************************************************************************************************
	//************************************************************************************************
	runtimeServicesUtilsLib.prototype.getAliasType = function(type) {
		var theType = type;
		//For records from release 1 or 2
		if (!theType) {
			theType = vocaConstants.ALIAS_CONTENT_EXPRESSION;
		}

		return theType;
	};
	//************************************************************************************************
	//************************************************************************************************
	runtimeServicesUtilsLib.prototype.getContent = function(content, type) {
		var theContent = content;
		//For records from release 1
		if (type === vocaConstants.ALIAS_CONTENT_DECISION_TABLE) {
			theContent = JSON.parse(content);
		}

		return theContent;
	};
	return {
		runtimeServicesUtilsLib: runtimeServicesUtilsLib
	};
}());