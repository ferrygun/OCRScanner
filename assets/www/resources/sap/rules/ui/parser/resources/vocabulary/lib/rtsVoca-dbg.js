jQuery.sap.declare("sap.rules.ui.parser.resources.vocabulary.lib.rtsVoca");

jQuery.sap.require("sap.rules.ui.parser.resources.rule.lib.constantsBase");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.runtimeServicesUtils");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.vocaObjects");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.vocaConversionUtils");



sap.rules.ui.parser.resources.vocabulary.lib.rtsVoca = sap.rules.ui.parser.resources.vocabulary.lib.rtsVoca|| {}; 
sap.rules.ui.parser.resources.vocabulary.lib.rtsVoca.lib = (function() {
	var ruleConstants = sap.rules.ui.parser.resources.rule.lib.constantsBase.lib;
	var vocaConstants = sap.rules.ui.parser.resources.vocabulary.lib.constants.lib;
	var vocaObjects = sap.rules.ui.parser.resources.vocabulary.lib.vocaObjects.lib;
	var utils = sap.rules.ui.parser.resources.vocabulary.lib.runtimeServicesUtils.lib;
	utils = new utils.runtimeServicesUtilsLib();
	var conversionUtils = sap.rules.ui.parser.resources.vocabulary.lib.vocaConversionUtils;
	

	//*********************************************************************************************
	//************************************************************************************************
	function vocabularyRuntimeServices(vocaRTContext) {

		//***********************************************************
		//***********************************************************
		//***********************************************************
		//***********************************************************
		this.globalObjects = null;
		this.globalRuleAttributes = null;
		this.globalStaticRuleTemplateAttributes = null;
		this.globalDynamicRuleTemplateAttributes = null;
		this.globalStaticVocabularyAttributes = null;
		this.allVocaObjects = {
			
			"allAssocAttr" : null,
			"allAssoc" : null,
			"allObjects" : null,
			"allActions" : null,
			"allOutputs" : null,
			"allAliases" : null,
			"allTerms" : null,
			"allTermsModifiers" : null,
			"allValueLists" : null,
			"allAttr" : null,
			"allActionsStaticParams" : null,
			"allOutputsStaticParams" : null,
			"allActionsRequiredParams" : null,
			"allOutputsRequiredParams" : null,
			"allAdvancedFunctions" : null,
			"allVocabularies" : null
		};
		
		this.rtContext = vocaRTContext;
	}

	//***********************************************************
	// PUBLIC
	//***********************************************************
	vocabularyRuntimeServices.prototype.refresh = function() {

		this.clearAll();
	};
	
	//***********************************************************
	// PUBLIC
	//***********************************************************
	vocabularyRuntimeServices.prototype.partialRefresh = function(whatToRefresh) {

		if (whatToRefresh.hasOwnProperty(vocaConstants.PARTIAL_REFRESH.ALIASES)){

			this.allVocaObjects.allAliases = null;
			var pName;
			for (pName in this.allVocaObjects.allVocabularies) {
				if (this.allVocaObjects.allVocabularies.hasOwnProperty(pName)) {
					this.allVocaObjects.allVocabularies[pName].aliases = null;					 	 
			 }
			}
		} else {
			this.clearAll();
		}
	};	
	
	//***********************************************************
	//**********************************************************
	vocabularyRuntimeServices.prototype.getAllVocaObjects = function() {
		
		return this.allVocaObjects;
	};


	//***********************************************************
	//**********************************************************
	//  reads all real values for value list 
	vocabularyRuntimeServices.prototype.readValueListValues = function(valueList) {
		if (valueList[vocaConstants.VALUE_LIST_VALUES]) {
			return valueList[vocaConstants.VALUE_LIST_VALUES];
		}

		return this.rtContext.readValueListValues(valueList);
	};

	//***********************************************************
	//**********************************************************
	vocabularyRuntimeServices.prototype.getValueListDescriptions = function(vocaName, valueListName, searchStr) {

		var valueListDescriptions = [];

		var localStr;
		if (arguments.length > 2 && searchStr) {
			localStr = searchStr;
		} else {
			localStr = null;
		}

		var tmpDesc;
		
		var voca = this.loadVoca(vocaName, false, false, false, false, true, false, false);
		if (voca) {
			if (voca.valueLists.hasOwnProperty(valueListName)) {
				voca.valueLists[valueListName].values = this.readValueListValues(voca.valueLists[valueListName]);
				var pDesc = null;
				for (pDesc in voca.valueLists[valueListName].values) {
					if (voca.valueLists[valueListName].values.hasOwnProperty(pDesc)) {
						// In case of string or date the first letter is '
						if (localStr === null || pDesc.toLowerCase().indexOf(localStr.toLowerCase()) === 0) {
							tmpDesc = pDesc.replace(/\\/g, '\\\\').replace(/"/g, '\\"');				
							valueListDescriptions.push(tmpDesc);
						}
					}
				}
			}
		}

		return valueListDescriptions;
	};

	//***********************************************************
	//**********************************************************
	vocabularyRuntimeServices.prototype.GetValueFromValueListDescription = function(vocaName, valueListName, description) {

		var value = null;

		var voca = this.loadVoca(vocaName, false, false, false, false, true, false, false);
		if (voca) {
			if (voca.valueLists.hasOwnProperty(valueListName)) {
				voca.valueLists[valueListName].values = this.readValueListValues(voca.valueLists[valueListName]);
				if (voca.valueLists[valueListName].values.hasOwnProperty(description)) {
					value = voca.valueLists[valueListName].values[description];
				}
			}
		}

		return value;
	};

	//***********************************************************
	//**********************************************************
	vocabularyRuntimeServices.prototype.GetDescriptionFromValueListValue = function(vocaName, valueListName, value) {

		//var descriptionForValue = null;
		var values, description;

		var voca = this.loadVoca(vocaName, false, false, false, false, true, false, false);
		if (voca) {
			if (voca.valueLists.hasOwnProperty(valueListName)) {
				values = this.readValueListValues(voca.valueLists[valueListName]);
				for ( description in values) {
					if (values.hasOwnProperty(description) && ((("'" + values[description] + "'") === value) || (values[description] === value) )) {
						return description;
					}
				}
			}
		}

		return null;
	};
	//***********************************************************
	//**********************************************************
	vocabularyRuntimeServices.prototype.IsValueListDescriptionExist = function(vocaName, valueListName) {

		var value = false;

		var voca = this.loadVoca(vocaName, false, false, false, false, true, false, false);
		if (voca) {
			if (voca.valueLists.hasOwnProperty(valueListName)) {
				//voca.valueLists[valueListName].values = this.readValueListValues(voca.valueLists[valueListName]);
				if (voca.valueLists[valueListName].descriptionColumn) {
					value = true;
				}
			}
		}

		return value;
	};
	//***********************************************************
	//**********************************************************
	vocabularyRuntimeServices.prototype.getValueList = function(vocaName, valueListName) {

		var valueList = null;

		var voca = this.loadVoca(vocaName, false, false, false, false, true, false, false);
		if (voca) {
			if (voca.valueLists.hasOwnProperty(valueListName)) {
				valueList = voca.valueLists[valueListName];
			}
		}

		return valueList;
	};
	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getObjects = function(vocaName, searchStr) {
		var objects = [];

		var localStr;
		if (arguments.length > 1 && searchStr) {
			localStr = searchStr;
		} else {
			localStr = null;
		}

		var voca = this.loadVoca(vocaName, true, false, false, false, false, false, false);
		if (voca) {
			var pName = null;
			for (pName in voca.objects) {
				if (voca.objects.hasOwnProperty(pName) &&
					(localStr === null || pName.indexOf(localStr) === 0)) {
					objects.push(this.getObject(vocaName, pName));
				}
			}
		}

		return {
			objects: objects
		};
	};

	//In case scope  = Global - return actions from all vocabularies in the system
	//In case scope != Global - return actions from all vocabularies in the same scope + global vocabularies
	vocabularyRuntimeServices.prototype.getAllActionNames = function(scope, excludeVocName) {

		var i;
		var allActionNamesMap = {};

		this.loadAllActions(this.allVocaObjects);

		for (i = 0; i < this.allVocaObjects.allActions.length; i++) {

			if (this.allVocaObjects.allActions[i].isPrivate === true) {

				continue;
			}

			if (this.allVocaObjects.allActions[i].vocaName === excludeVocName) {

				continue;
			}

			if (scope === vocaConstants.GLOBAL || (scope === this.allVocaObjects.allActions[i].scope || this.allVocaObjects.allActions[i].scope === vocaConstants.GLOBAL)) {

				allActionNamesMap[this.allVocaObjects.allActions[i].name] = this.allVocaObjects.allActions[i].vocaName;
			}
		}

		return allActionNamesMap;
	};

	//In case scope  = Global - return outputs from all vocabularies in the system
	//In case scope != Global - return outputs from all vocabularies in the same scope + global vocabularies
	vocabularyRuntimeServices.prototype.getAllOutputNames = function(scope, excludeVocName) {

		var i;
		var allOutputNamesMap = {};

		this.loadAllOutputs(this.allVocaObjects);

		for (i = 0; i < this.allVocaObjects.allOutputs.length; i++) {

			if (this.allVocaObjects.allOutputs[i].isPrivate === true) {

				continue;
			}

			if (this.allVocaObjects.allOutputs[i].vocaName === excludeVocName) {

				continue;
			}

			if (scope === vocaConstants.GLOBAL || (scope === this.allVocaObjects.allOutputs[i].scope || this.allVocaObjects.allOutputs[i].scope === vocaConstants.GLOBAL)) {

				allOutputNamesMap[this.allVocaObjects.allOutputs[i].name] = this.allVocaObjects.allOutputs[i].vocaName;
			}
		}

		return allOutputNamesMap;
	};

	//In case scope  = Global - return aliases from all vocabularies in the system
	//In case scope != Global - return aliases from all vocabularies in the same scope + global vocabularies
	vocabularyRuntimeServices.prototype.getAllPersistedAliasNames = function(scope, excludeVocName, includeVocName) {

		var i;
		var allAliasNamesMap = {};


		this.loadAllAliases(this.allVocaObjects);

		for (i = 0; i < this.allVocaObjects.allAliases.length; i++) {

			//In case the vocabulary is private, we'll not include it's aliases in the returned results, unless the consumer explicitly asked for it's aliases
			if (this.allVocaObjects.allAliases[i].isPrivate === true && (!includeVocName || this.allVocaObjects.allAliases[i].vocaName !== includeVocName)) {

				continue;
			}

			if (excludeVocName && this.allVocaObjects.allAliases[i].vocaName === excludeVocName) {

				continue;
			}

			if (scope === vocaConstants.GLOBAL || (scope === this.allVocaObjects.allAliases[i].scope || this.allVocaObjects.allAliases[i].scope === vocaConstants.GLOBAL)) {

				allAliasNamesMap[this.allVocaObjects.allAliases[i].name] = this.allVocaObjects.allAliases[i];
			}
		}

		return allAliasNamesMap;
	};

	//In case scope  = Global - return aliases from all vocabularies in the system
	//In case scope != Global - return aliases from all vocabularies in the same scope + global vocabularies
	vocabularyRuntimeServices.prototype.getAllPersistedValueListsNames = function(scope, excludeVocName, includeVocName) {

		var allValueListsNamesMap = {};
		var valueList = null;
		var i;


		this.loadAllValueLists();

		for (i = 0; i < this.allVocaObjects.allValueLists.length; i++) {

			valueList = this.allVocaObjects.allValueLists[i];

			//In case the vocabulary is private, we'll not include it's aliases in the returned results, unless the consumer explicitly asked for it's aliases
			if (valueList.isPrivate === true && (!includeVocName || valueList.vocaName !== includeVocName)) {

				continue;
			}

			if (excludeVocName && valueList.vocaName === excludeVocName) {

				continue;
			}

			if (scope === vocaConstants.GLOBAL || (scope === valueList.scope || valueList.scope === vocaConstants.GLOBAL)) {

				allValueListsNamesMap[this.allVocaObjects.allValueLists[i].name] = valueList;
			}
		}

		return allValueListsNamesMap;
	};
	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.isVocabularyExist = function(vocaName, scope) {

		var vocaScope = vocaConstants.ALL;

		if (scope) {
			vocaScope = scope;
		}

		var vocabularies = this.getVocabulariesNames(vocaScope, true);

		var i;

		for (i = 0; i < vocabularies.length; i++) {

			if (vocabularies[i].name === vocaName) {
				return true;
			}
		}

		return false;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.isTermsExist = function(vocaName) {

		var voca = this.loadVoca(vocaName, false, false, false, false, false, true, false);
		if (!voca) {
			return null;
		}

		var term = '';

		for (term in voca.terms) {
			if (voca.terms.hasOwnProperty(term)) {
				return true;
			}
		}

		return false;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getAllObjectModelNames = function(scope, excludeVocName, includeVocName) {

		var i;
		var allOMNamesMap = {};

		this.loadAllObjects(this.allVocaObjects);

		for (i = 0; i < this.allVocaObjects.allObjects.length; i++) {

			//In case vocabulary is private, we'll not include it's object models in the returned results, unless the consumer explicitly asked for it's object models
			if (this.allVocaObjects.allObjects[i].isPrivate === true && (!includeVocName || this.allVocaObjects.allObjects[i].vocaName !== includeVocName)) {

				continue;
			}

			if (excludeVocName && this.allVocaObjects.allObjects[i].vocaName === excludeVocName) {

				continue;
			}

			if (scope === vocaConstants.GLOBAL || (scope === this.allVocaObjects.allObjects[i].scope || this.allVocaObjects.allObjects[i].scope === vocaConstants.GLOBAL)) {

				allOMNamesMap[this.allVocaObjects.allObjects[i].name] = this.allVocaObjects.allObjects[i].vocaName;
			}
		}

		this.loadAllGlobalObjects();

		var pName = null;

		for (pName in this.globalObjects) {

			if (this.globalObjects.hasOwnProperty(pName)) {

				allOMNamesMap[pName] = this.globalObjects[pName].vocaName;
			}
		}

		return allOMNamesMap;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getAllAttributesNames = function(scope, excludeVocName, includeVocName) {

		var i;
		var attributesMap = {};

		var attrName = null;

		//add rule global attributes
		this.loadRuleAttributes();

		for (attrName in this.globalRuleAttributes) {

			if (this.globalRuleAttributes.hasOwnProperty(attrName)) {

				attributesMap[attrName] = this.globalRuleAttributes[attrName];
			}
		}

		//add rule template global attributes
		this.addStaticRuleTemplateAttributes();
		this.addDynamicRuleTemplateAttributes();
		this.addStaticVocabularyAttributes();

		for (attrName in this.globalStaticRuleTemplateAttributes) {

			if (this.globalStaticRuleTemplateAttributes.hasOwnProperty(attrName)) {

				attributesMap[attrName] = this.globalStaticRuleTemplateAttributes[attrName];
			}
		}

		for (attrName in this.globalDynamicRuleTemplateAttributes) {

			if (this.globalDynamicRuleTemplateAttributes.hasOwnProperty(attrName)) {

				attributesMap[attrName] = this.globalDynamicRuleTemplateAttributes[attrName];
			}
		}

		for (attrName in this.globalStaticVocabularyAttributes) {

			if (this.globalStaticVocabularyAttributes.hasOwnProperty(attrName)) {

				attributesMap[attrName] = this.globalStaticVocabularyAttributes[attrName];
			}
		}

		//add data object attributes
		this.loadAllAttributes(this.allVocaObjects);

		for (i = 0; i < this.allVocaObjects.allAttr.length; i++) {

			//In case the vocabulary is private, we'll not include it's attributes in the returned results, unless the consumer explicitly asked for it's attributes
			if (this.allVocaObjects.allAttr[i].isPrivate === true && (!includeVocName || this.allVocaObjects.allAttr[i].vocaName !== includeVocName)) {

				continue;
			}

			if (excludeVocName && this.allVocaObjects.allAttr[i].vocaName === excludeVocName) {

				continue;
			}

			if (scope === vocaConstants.GLOBAL || (this.allVocaObjects.allAttr[i].scope === scope || this.allVocaObjects.allAttr[i].scope === vocaConstants.GLOBAL)) {

				attributesMap[this.allVocaObjects.allAttr[i].name] = this.allVocaObjects.allAttr[i];
			}
		}

		return attributesMap;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.isAttributeExists = function(vocaName, attrName) {

		var scope = this.getVocabularyScope(vocaName);

		var attributesMap = this.getAllAttributesNames(scope);

		if (attributesMap.hasOwnProperty(attrName)) {

			return true;
		}

		return false;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getVocabulary = function(vocaName, ignoreGlobalObjects, conversionFlags) {
		
		var vocab = this.loadVoca(vocaName, true, true, true, true, true, false, true, ignoreGlobalObjects);

		if (!vocab) {
			return null;
		}

		var voca = null;
		var valueListConversionDefined = conversionUtils.getVocaConversionUtils().isValueListConversionDefined(conversionFlags);
		if (valueListConversionDefined) {
			voca = JSON.parse(JSON.stringify(vocab));
		}
		else {
			voca = vocab;
		}
			
		var objectName = null;

		for (objectName in voca.objects) {

			if (voca.objects.hasOwnProperty(objectName)) {

				voca.objects[objectName] = this.getObject(vocaName, objectName);
			}
		}

		var actionName = null;

		for (actionName in voca.actions) {

			if (voca.actions.hasOwnProperty(actionName)) {

				voca.actions[actionName] = this.getAction(vocaName, actionName, conversionFlags);
			}
		}

		var outputName = null;

		for (outputName in voca.outputs) {

			if (voca.outputs.hasOwnProperty(outputName)) {

				voca.outputs[outputName] = this.getOutput(vocaName, outputName, conversionFlags);
			}
		}

		// No need to getAlias unless conversion is defined
		if (valueListConversionDefined) {
			var aliasName = null;
		
			for (aliasName in voca.aliases) {
		
				if (voca.aliases.hasOwnProperty(aliasName)) {
		
					voca.aliases[aliasName] = this.getAlias(vocaName, aliasName, conversionFlags);
				}
			}
		}
		//In the future - add object attributes and associations

		return voca;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getVocabularyScope = function(vocaName) {

		this.loadAllVocabularies();

		if (this.allVocaObjects.allVocabularies.hasOwnProperty(vocaName)) {

			return this.allVocaObjects.allVocabularies[vocaName].scope;
		}

		return null;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getVocabulariesInScope = function(vocaName) {

		var scope = this.getVocabularyScope(vocaName);

		return this.getVocabulariesNames(scope, true);
	};

	//***********************************************************
	//***********************************************************

	vocabularyRuntimeServices.prototype.getIsIncludeGlobal = function(includeGlobals) {

		if (includeGlobals === null || includeGlobals === undefined) {

			return true;
		}

		if (includeGlobals === "false") {

			return false;
		}

		return true;
	};

	//***********************************************************
	//***********************************************************

	// scope: Public or Private < Capital P >
	vocabularyRuntimeServices.prototype.getVocabulariesNames = function(scope, includeGlobals) {

		var vocaScope = vocaConstants.ALL;

		var isIncludeGlobal = this.getIsIncludeGlobal(includeGlobals);

		if (scope) {
			vocaScope = scope;
		}

		this.loadAllVocabularies();

		var vocaNames = [];

		var pName = null;
		for (pName in this.allVocaObjects.allVocabularies) {

			if (this.allVocaObjects.allVocabularies.hasOwnProperty(pName)) {

				if (isIncludeGlobal === false && this.allVocaObjects.allVocabularies[pName].scope === vocaConstants.GLOBAL) {

					continue;
				}

				//If all scopes are relevant
				if (vocaScope === vocaConstants.ALL) {

					vocaNames.push({
						name: pName
					});

				}
				//If all public scopes (vocabularies which aren't private) are relevant
				else
				if (scope === vocaConstants.PUBLIC && this.allVocaObjects.allVocabularies[pName].isPrivate === false) {

					vocaNames.push({
						name: pName
					});
				}
				//If only private scopes (embedded vocabularies) are relevant
				else if (scope === vocaConstants.PRIVATE && this.allVocaObjects.allVocabularies[pName].isPrivate === true) {

					vocaNames.push({
						name: pName
					});
				}
				//If only a specific scope is relevant - return all vocabularies in the same scope and also all global vocabularies
				else if (scope === this.allVocaObjects.allVocabularies[pName].scope || this.allVocaObjects.allVocabularies[pName].scope === vocaConstants.GLOBAL) {

					vocaNames.push({
						name: pName
					});
				}
			}
		}

		return vocaNames;
	};

	//***********************************************************
	//***********************************************************


	//GetEditbaleVocabularyByVocabulary
	//GetEditableVocabularyByScope

	vocabularyRuntimeServices.prototype.getDefaultWritableForAppByVocabulary = function(vocaName) {
		var scope = this.getVocabularyScope(vocaName);
		return this.getDefaultWritableForAppByScope(scope);
	};


	vocabularyRuntimeServices.prototype.getDefaultWritableForAppByScope = function(scope) {
		this.loadAllVocabularies();
		var voca = null;
		var ret = {
			"vocabularies": []
		};
		for (voca in this.allVocaObjects.allVocabularies) {
			if (this.allVocaObjects.allVocabularies.hasOwnProperty(voca)) {
				if (this.allVocaObjects.allVocabularies[voca].scope === scope && this.allVocaObjects.allVocabularies[voca].isWritable === true) {
					//return voca;
					ret.vocabularies.push(voca);
					ret.scope = scope;
					break;
				}

			}
		}
		return ret;
	};



	//***********************************************************
	//***********************************************************

	vocabularyRuntimeServices.prototype.isObjectExist = function(vocaName, objName) {

		if (this.isGlobalObject(objName)) {
			return true;
		}

		var voca = this.loadVoca(vocaName, true, false, false, false, false, false, false);
		if (!voca) {
			return false;
		}

		return voca.objects.hasOwnProperty(objName);

	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.isGlobalObject = function(objName) {
		this.loadAllGlobalObjects();
		return this.globalObjects.hasOwnProperty(objName);
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getObject = function(vocaName, objName) {
		return this.loadObject(vocaName, objName, true, true);
	};

	//***********************************************************
	//***********************************************************

	vocabularyRuntimeServices.prototype.getObjectIgnoreCase = function(vocaName, objName) {
		return this.loadObjectIgnoreCase(vocaName, objName, true, true);
	};

	//***********************************************************
	//***********************************************************

	vocabularyRuntimeServices.prototype.getObjectRuntimeInfo = function(vocaName, objName) {
		var obj = this.loadObject(vocaName, objName, false, false);
		if (!obj) {
			return null;
		}

		return {
			schema: obj.schema,
			runtime_name: obj.runtimeName
		};
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getObjectRuntimeName = function(vocaName, objName) {
		var obj = this.loadObject(vocaName, objName, false, false);
		if (!obj) {
			return null;
		}

		return obj.runtimeName;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getObjectRuntimeSchemaName = function(vocaName, objName) {
		var obj = this.loadObject(vocaName, objName, false, false);
		if (!obj) {
			return null;
		}

		return obj.schema;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getActionsNames = function(vocaName, searchStr) {
		var actionNames = [];

		var localStr;
		if (arguments.length > 1 && searchStr) {
			localStr = searchStr;
		} else {
			localStr = null;
		}

		var voca = this.loadVoca(vocaName, false, true, false, false, false, false, false);
		if (voca) {
			var pName = null;
			for (pName in voca.actions) {
				if (voca.actions.hasOwnProperty(pName) &&
					(localStr === null || pName.indexOf(localStr) === 0)) {
					actionNames.push({
						name: pName
					});
				}
			}
		}

		return actionNames;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getTerms = function(vocaName, searchStr) {

		var terms = [];

		var localStr;
		if (arguments.length > 1 && searchStr) {
			localStr = searchStr;
		} else {
			localStr = null;
		}

		var voca = this.loadVoca(vocaName, false, false, false, false, false, true, false);
		if (voca) {

			var termDesc = null;

			for (termDesc in voca.terms) {

				//If description start with the searchStr
				if (voca.terms.hasOwnProperty(termDesc) &&
					(localStr === null || termDesc.toLowerCase().indexOf(localStr.toLowerCase()) === 0)) {
					//voca.terms[termDesc].modifiers = {}; // TBD - stub for terms 
					terms.push(voca.terms[termDesc]);
				}
			}
		}

		return {
			terms: terms
		};
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getActions = function(vocaName, searchStr, conversionFlags) {
		var actions = [];

		var localStr;
		if (arguments.length > 1 && searchStr) {
			localStr = searchStr;
		} else {
			localStr = null;
		}

		var voca = this.loadVoca(vocaName, false, true, false, false, false, false, false);
		if (voca) {
			var pName = null;
			for (pName in voca.actions) {
				if (voca.actions.hasOwnProperty(pName) &&
					(localStr === null || pName.indexOf(localStr) === 0)) {
					actions.push(this.getAction(vocaName, pName, conversionFlags));
				}
			}
		}

		return {
			actions: actions
		};
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getAction = function(vocaName, actName, conversionFlags) {
		var voca = this.loadVoca(vocaName, false, true, false, false, false, false, false);
		if (!voca) {
			return null;
		}

		if (!voca.actions[actName]) {
			return null;
		}

		var action = voca.actions[actName];
		if (action) {
			if (!action.staticParams) {
				this.loadAllActionsStaticParams();
				action.staticParams = [];

				var i;
				for (i = 0; i < this.allVocaObjects.allActionsStaticParams.length; i++) {
					if (action.id === this.allVocaObjects.allActionsStaticParams[i].actionId) {
						action.staticParams.push(this.allVocaObjects.allActionsStaticParams[i]);
					}
				}
			}

			if (!action.requiredParams) {
				this.loadAllActionsRequiredParams();
				action.requiredParams = [];

				var j;
				for (j = 0; j < this.allVocaObjects.allActionsRequiredParams.length; j++) {
					if (action.id === this.allVocaObjects.allActionsRequiredParams[j].actionId) {
						action.requiredParams.push(this.allVocaObjects.allActionsRequiredParams[j]);
					}
				}
			}

		}

		var convertedAction = conversionUtils.getVocaConversionUtils().convertAction(this.rtContext.getConnection(), vocaName, action, conversionFlags);
		return convertedAction;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getTerm = function(vocaName, termDescription) {
		var voca = this.loadVoca(vocaName, false, false, false, false, false, true, false);
		if (!voca) {
			return null;
		}

		if (!voca.terms[termDescription]) {
			return null;
		}
		// term contains also modifiers - either {} or term.modifiers.all = true
		var term = voca.terms[termDescription];
		
		return term;
	};
	
	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.isTermModifierEmpty = function(vocaName) {
		var voca = this.loadVoca(vocaName, false, false, false, false, false, true, false);
		if (!voca) {
			return null;
		}

		if (!voca.terms) {
			return null;
		}
		var isEmpty = true;
		// term contains also modifiers - either {} or term.modifiers.all = true
		var termDescription;
		if (Object.keys(voca.terms).length !== 0 ) {
			for (termDescription in voca.terms) {
				if (voca.terms.hasOwnProperty(termDescription)) {			
					if (Object.keys(voca.terms[termDescription].modifiers).length !== 0) {
						isEmpty = false;
						break;
					}
				}
			}
		}
		return isEmpty;
	};
	
	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.isCurrentTermModifierEmpty = function(vocaName) {
		var voca = this.loadVoca(vocaName, false, false, false, false, false, true, false);
		if (!voca) {
			return null;
		}

		if (!voca.terms) {
			return null;
		}
		var isEmpty = true;
		// term may contains also "all" and "not" modifiers from SP05 and SP06
		var termDescription;
		if (Object.keys(voca.terms).length !== 0 ) {
			for (termDescription in voca.terms) {
				if (voca.terms.hasOwnProperty(termDescription)) {			
					if (voca.terms[termDescription].modifiers && voca.terms[termDescription].modifiers[vocaConstants.TERM_MODIFIER_CURRENT]) {
						isEmpty = false;
						break;
					}
				}
			}
		}
		return isEmpty;
	};
	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getAlias = function(vocaName, aliasName, conversionFlags) {
		//Check first if exists in transient data
		var transVoca = this.rtContext.getTransientVocabulary();
		var alias = null;
		if (transVoca) {
			alias = transVoca.getAlias(aliasName);
		}

		//If exists return
		if (alias) {

			return alias;
		}

		//check if exists in db
		var voca = this.loadVoca(vocaName, false, false, false, true, false, false, false);
		if (!voca) {
			return null;
		}

		alias = voca.aliases[aliasName];
		if (!alias) {
			return null;
		}
		
		var convertedAlias = alias;
		if(conversionFlags) {
		  convertedAlias = conversionUtils.getVocaConversionUtils().convertAlias(this.rtContext.getConnection(), this, vocaName, alias, conversionFlags);
		}
		return convertedAlias;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.isAliasExist = function(vocaName, aliasName) {
		var voca = this.loadVoca(vocaName, false, false, false, true, false, false, false);
		if (!voca) {
			return false;
		}

		if (!voca.aliases[aliasName]) {
			var transVoca = this.rtContext.getTransientVocabulary();
			if (transVoca && transVoca.getAlias(aliasName)) {
				return true;
			}

			return false;
		}

		return true;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.isActionExist = function(vocaName, actName) {
		var voca = this.loadVoca(vocaName, false, true, false, false, false, false, false);
		if (!voca) {
			return false;
		}

		if (!voca.actions[actName]) {
			return false;
		}

		return true;
	};

	//***********************************************************
	//***********************************************************	
	vocabularyRuntimeServices.prototype.getAliasesNames = function(vocaName, searchStr) {
		var aliasNames = [];

		var localStr;
		if (arguments.length > 1 && searchStr) {
			localStr = searchStr;
		} else {
			localStr = null;
		}

		var voca = this.loadVoca(vocaName, false, false, false, true, false, false, false);
		if (voca) {
			var pName = null;
			for (pName in voca.aliases) {
				if (voca.aliases.hasOwnProperty(pName) &&
					(localStr === null || pName.indexOf(localStr) === 0)) {
					aliasNames.push({
						name: pName
					});
				}
			}
		}

		return aliasNames;
	};

	//***********************************************************
	//***********************************************************	
	vocabularyRuntimeServices.prototype.getOutputsNames = function(vocaName, searchStr) {
		var outputNames = [];

		var localStr;
		if (arguments.length > 1 && searchStr) {
			localStr = searchStr;
		} else {
			localStr = null;
		}

		var voca = this.loadVoca(vocaName, false, false, true, false, false, false, false);
		if (voca) {
			var pName = null;
			for (pName in voca.outputs) {
				if (voca.outputs.hasOwnProperty(pName) &&
					(localStr === null || pName.indexOf(localStr) === 0)) {
					outputNames.push({
						name: pName
					});
				}
			}
		}

		return outputNames;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getOutputs = function(vocaName, searchStr, conversionFlags) {
		var outputs = [];

		var localStr;
		if (arguments.length > 1 && searchStr) {
			localStr = searchStr;
		} else {
			localStr = null;
		}

		var voca = this.loadVoca(vocaName, false, false, true, false, false, false, false);
		if (voca) {
			var pName = null;
			for (pName in voca.outputs) {
				if (voca.outputs.hasOwnProperty(pName) &&
					(localStr === null || pName.indexOf(localStr) === 0)) {
					outputs.push(this.getOutput(vocaName, pName, conversionFlags));
				}
			}
		}

		return {
			outputs: outputs
		};
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getAliases = function(vocaName, searchStr, conversionFlags) {
		var aliases = [];

		var localStr;
		if (arguments.length > 1 && searchStr) {
			localStr = searchStr;
		} else {
			localStr = null;
		}

		//Retrieve first transient aliases
		var transVoca = this.rtContext.getTransientVocabulary();
		var transAliases = null;

		if (transVoca) {
			transAliases = transVoca.getAliasesMap();
			var ptName = null;
			for (ptName in transAliases) {
				if (transAliases.hasOwnProperty(ptName) &&
					(localStr === null || ptName.toLowerCase().indexOf(localStr.toLowerCase()) === 0)) {
					aliases.push(transAliases[ptName]);
				}
			}
		}

		var voca = this.loadVoca(vocaName, false, false, false, true, false, false, false);
		if (voca) {
			var pName = null;
			for (pName in voca.aliases) {
				if (voca.aliases.hasOwnProperty(pName) && (localStr === null || pName.toLowerCase().indexOf(localStr.toLowerCase()) === 0)) {
					if (!transAliases || !transAliases[pName]) {
						aliases.push(this.getAlias(vocaName, pName, conversionFlags));
					}
				}
			}
		}

		return {
			aliases: aliases
		};
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getOutput = function(vocaName, outName, conversionFlags) {
		var voca = this.loadVoca(vocaName, false, false, true, false, false, false, false);
		if (!voca) {
			return null;
		}

		if (!voca.outputs[outName]) {
			return null;
		}

		var output = voca.outputs[outName];
		if (output) {
			if (!output.staticParams) {
				this.loadAllOutputsStaticParams();
				output.staticParams = [];

				var i;
				for (i = 0; i < this.allVocaObjects.allOutputsStaticParams.length; i++) {
					if (output.id === this.allVocaObjects.allOutputsStaticParams[i].outputId) {
						output.staticParams.push(this.allVocaObjects.allOutputsStaticParams[i]);
					}
				}
			}

			if (!output.requiredParams) {
				this.loadAllOutputsRequiredParams();
				output.requiredParams = [];

				var j;
				for (j = 0; j < this.allVocaObjects.allOutputsRequiredParams.length; j++) {
					if (output.id === this.allVocaObjects.allOutputsRequiredParams[j].outputId) {
						output.requiredParams.push(this.allVocaObjects.allOutputsRequiredParams[j]);
					}
				}

			}
		}

		var convertedOutput = conversionUtils.getVocaConversionUtils().convertOutput(this.rtContext.getConnection(), vocaName, output, conversionFlags);
		return convertedOutput;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.isOutputExist = function(vocaName, outName) {

		var voca = this.loadVoca(vocaName, false, false, true, false, false, false, false);
		if (!voca) {
			return false;
		}
		if (!voca.outputs[outName]) {
			return false;
		}

		return true;
	};


	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getObjectsNames = function(vocaName, searchStr) {
		var objectNames = [];

		var localStr;
		if (arguments.length > 1 && searchStr) {
			localStr = searchStr;
		} else {
			localStr = null;
		}

		var voca = this.loadVoca(vocaName, true, false, false, false, false, false, false);
		if (voca) {
			var pName = null;
			for (pName in voca.objects) {
				if (voca.objects.hasOwnProperty(pName) &&
					(localStr === null || pName.toLowerCase().indexOf(localStr.toLowerCase()) === 0)) {
					objectNames.push({
						name: pName
					});
				}
			}
		}

		return objectNames;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getObjectAssociationsNames = function(vocaName, objName, searchStr) {
		var assocNames = [];

		var localStr;
		if (arguments.length > 1 && searchStr) {
			localStr = searchStr;
		} else {
			localStr = null;
		}

		var obj = this.loadObject(vocaName, objName, false, true);
		if (obj) {
			var pName = null;
			for (pName in obj.associations) {
				if (obj.associations.hasOwnProperty(pName) &&
					(localStr === null || pName.toLowerCase().indexOf(localStr.toLowerCase()) === 0)) {
					assocNames.push({
						name: pName
					});
				}
			}
		}

		return assocNames;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getObjectAttributesNames = function(vocaName, objName, searchStr) {
		var attrNames = [];

		var localStr;
		if (arguments.length > 1 && searchStr) {
			localStr = searchStr;
		} else {
			localStr = null;
		}

		var obj = this.loadObject(vocaName, objName, true, false);
		if (obj) {
			var pName = null;
			for (pName in obj.attributes) {
				if (obj.attributes.hasOwnProperty(pName)) {
					if (localStr === null || pName.toLowerCase().indexOf(localStr.toLowerCase()) === 0) {
						attrNames.push({
							name: pName
						});
					}
				}
			}
		}

		return attrNames;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getAttribute = function(vocaName, objName, attrName) {
		var obj = this.loadObject(vocaName, objName, true, false);
		if (!obj) {
			return null;
		}

		if (!obj.attributes[attrName]) {
			return null;
		}

		return obj.attributes[attrName];
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getAttributeIgnoreCase = function(vocaName, objName, attrName) {
		var obj = this.loadObjectIgnoreCase(vocaName, objName, true, false);
		if (!obj) {
			return null;
		}

		if (!obj.attributes[attrName]) {
			return null;
		}

		return obj.attributes[attrName];
	};


	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getAttributeDataType = function(vocaName, objName, attrName) {
		var obj = this.loadObject(vocaName, objName, true, false);
		if (!obj) {
			return null;
		}

		if (!obj.attributes[attrName]) {
			return null;
		}

		return obj.attributes[attrName].dataType;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getAttributeRuntimeName = function(vocaName, objName, attrName) {
		var obj = this.loadObject(vocaName, objName, true, false);
		if (!obj) {
			return null;
		}

		if (!obj.attributes[attrName]) {
			return null;
		}

		return obj.attributes[attrName].runtimeName;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getAttributes = function(vocaName, objName) {
		var attrs = [];

		var obj = this.loadObject(vocaName, objName, true, false);
		if (obj) {
			var pName = null;
			for (pName in obj.attributes) {
				if (obj.attributes.hasOwnProperty(pName)) {
					attrs.push(obj.attributes[pName]);
				}
			}
		}

		return attrs;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getAssociations = function(vocaName, objName, withAttr) {
		var assocs = [];
		var assoc;

		var obj = this.loadObject(vocaName, objName, false, true);
		if (obj) {
			var pName = null;
			for (pName in obj.associations) {
				if (obj.associations.hasOwnProperty(pName)) {
					assoc = obj.associations[pName];
					assocs.push(assoc);
					if (withAttr) {
						this.loadAssocAttr(assoc);
					}
				}
			}
		}

		return assocs;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getAssociation = function(vocaName, objName, assocName, withAttr) {
		var obj = this.loadObject(vocaName, objName, false, true);
		if (!obj) {
			return null;
		}

		if (!obj.associations[assocName]) {
			return null;
		}

		var assoc = obj.associations[assocName];
		if (assoc && withAttr) {
			this.loadAssocAttr(assoc);
		}

		return assoc;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getAssociationIgnoreCase = function(vocaName, objName, assocName, withAttr) {
		var obj = this.loadObjectIgnoreCase(vocaName, objName, false, true);
		if (!obj) {
			return null;
		}

		if (!obj.associations[assocName]) {
			return null;
		}

		var assoc = obj.associations[assocName];
		if (assoc && withAttr) {
			this.loadAssocAttr(assoc);
		}

		return assoc;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getAdvancedFunctions = function(vocaName, searchStr){
		
		var advancedFuncArr = [];

		var localStr;
		if (arguments.length > 1 && searchStr) {
			localStr = searchStr;
		} else {
			localStr = null;
		}

		var voca = this.loadVoca(vocaName, false, false, false, false, false, false, true);
		if (voca) {
			var pName = null;
			for (pName in voca.advancedFunctions) {
				if (voca.advancedFunctions.hasOwnProperty(pName) &&
					(localStr === null || pName.indexOf(localStr) === 0)) {
					advancedFuncArr.push(this.getAdvancedFunction(vocaName, pName)); 
				}
			}
		}

		return {
			advancedFunctions: advancedFuncArr
		};
		
	};
	
	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.getAdvancedFunction = function(vocaName, pName){
		
		var voca = this.loadVoca(vocaName, false, false, false, false, false, false, true);
		
		if (!voca) {
			return null;
		}

		if (!voca.advancedFunctions[pName]) {
			return null;
		}
		
		var advancedFunc = voca.advancedFunctions[pName];
		
		return advancedFunc;
	};
	
	//***********************************************************
	//***********************************************************
	//***********************************************************
	//***********************************************************
	//***********************************************************
	//***********************************************************
	//***********************************************************
	// PRIVATE
	//***********************************************************
	vocabularyRuntimeServices.prototype.clearAll = function() {
		this.globalObjects = null;
		this.globalRuleAttributes = null;
		this.globalStaticRuleTemplateAttributes = null;
		this.globalDynamicRuleTemplateAttributes = null;
		this.globalStaticVocabularyAttributes = null;
		this.globalAttr = null;
		this.allVocaObjects.allAssocAttr = null;
		this.allVocaObjects.allAssoc = null;
		this.allVocaObjects.allObjects = null;
		this.allVocaObjects.allAttr = null;
		this.allVocaObjects.allActions = null;
		this.allVocaObjects.allOutputs = null;
		this.allVocaObjects.allAliases = null;
		this.allVocaObjects.allValueLists = null;
		this.allVocaObjects.allTerms = null;
		this.allVocaObjects.allTermsModifiers = null;
		this.allVocaObjects.allActionsStaticParams = null;
		this.allVocaObjects.allOutputsStaticParams = null;
		this.allVocaObjects.allActionsRequiredParams = null;
		this.allVocaObjects.allOutputsRequiredParams = null;
		this.allVocaObjects.allAdvancedFunctions = null;
		this.allVocaObjects.allVocabularies = null;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadAllVocabularies = function() {
		if (this.allVocaObjects.allVocabularies) {
			return;
		}

		this.rtContext.loadAllVocabularies(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadVoca = function(vocaName, loadObj, loadAction, loadOutput, loadAlias, loadValueList, loadTerm, loadAdvancedFunctions, ignoreGlobalObjects) {
		this.loadAllVocabularies();

		if (!this.isVocabularyExist(vocaName)) {
			return null;
		}

		var voca = this.allVocaObjects.allVocabularies[vocaName];

		if (loadObj && voca.objects === null) {
			this.loadVocaObjects(voca, ignoreGlobalObjects);
		}

		if (loadAction && voca.actions === null) {
			this.loadVocaActions(voca);
		}

		if (loadOutput && voca.outputs === null) {
			this.loadVocaOutputs(voca);
		}

		if (loadAlias && voca.aliases === null) {
			this.loadVocaAliases(voca);
		}

		if (loadValueList && voca.valueLists === null) {
			this.loadVocaValueLists(voca);
		}

		if (loadTerm && voca.terms === null) {
			this.loadVocaTerms(voca);
		}
		
		if (loadAdvancedFunctions && voca.advancedFunctions === null) {
			this.loadVocaAdvancedFunctions(voca);
		}

		return voca;
	};



	/*
	 * 2.	Fullfil the scope in loadAllObjects â€“ join vocabulary table according to voc_id and retrieve from vocabulary table only filed SCOPE
	 *
	 * */
	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadAllObjects = function() {
		if (this.allVocaObjects.allObjects) {
			return;
		}
		
		this.rtContext.loadAllObjects(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.addStaticRuleAssocs = function(ruleObj) {

		//Add association from rule to rule template
		var rTempAssoc = new vocaObjects.AssocInfo('', '', vocaConstants.DO_RULE_TEMPLATE, vocaConstants.DO_RULE_TEMPLATE, vocaConstants.CARDINALITY_MANY_TO_ONE, null);
		rTempAssoc.attrs = [];
		rTempAssoc.attrs.push(new vocaObjects.AssocAttrInfo('', vocaConstants.ATT_RULE__TEMPLATE_ID, vocaConstants.ATT_ID));
		ruleObj.associations[rTempAssoc.name] = rTempAssoc;

		//Add association from rule to vocabulary
		var vocaAssoc = new vocaObjects.AssocInfo('', '', vocaConstants.ASSOC_VOCABULARY, vocaConstants.DO_VOCABULARY, vocaConstants.CARDINALITY_MANY_TO_ONE, null);
		vocaAssoc.attrs = [];
		vocaAssoc.attrs.push(new vocaObjects.AssocAttrInfo('', vocaConstants.ATT_VOCABULARY, vocaConstants.ATT_VOCA_FULL_NAME));
		ruleObj.associations[vocaAssoc.name] = vocaAssoc;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.addStaticVocabularyAttributes = function() {

		if (this.globalStaticVocabularyAttributes) {
			return;
		}

		this.globalStaticVocabularyAttributes = {};

		this.globalStaticVocabularyAttributes[vocaConstants.ATT_VOCA_SCOPE] = new vocaObjects.AttrInfo('', vocaConstants.ATT_VOCA_SCOPE, vocaConstants.DO_VOCABULARY, vocaConstants.VOCABULARY_COL_SCOPE, '', 'NVARCHAR', 'String', 512, 'Data', vocaConstants.VOCABULARY_COL_SCOPE, null, null, null, null);
		this.globalStaticVocabularyAttributes[vocaConstants.ATT_VOCA_FULL_NAME] = new vocaObjects.AttrInfo('', vocaConstants.ATT_VOCA_FULL_NAME, vocaConstants.DO_VOCABULARY, vocaConstants.VOCABULARY_COL_PATH_FULL_NAME, '', 'NVARCHAR', 'String', 512, 'Data', vocaConstants.VOCABULARY_COL_PATH_FULL_NAME, null, null, null, null);
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.addStaticRuleTemplateAttributes = function() {

		if (this.globalStaticRuleTemplateAttributes) {
			return;
		}

		this.globalStaticRuleTemplateAttributes = {};

		this.globalStaticRuleTemplateAttributes[vocaConstants.ATT_ID] = new vocaObjects.AttrInfo('', vocaConstants.ATT_ID, vocaConstants.DO_RULE_TEMPLATE, ruleConstants.COL_ID, '', 'CHAR', 'String', 32, 'Data', ruleConstants.TABLE_RULE_TEMPLATE, null, null, null, null);
		this.globalStaticRuleTemplateAttributes[vocaConstants.ATT_PACKAGE] = new vocaObjects.AttrInfo('', vocaConstants.ATT_PACKAGE, vocaConstants.DO_RULE_TEMPLATE, ruleConstants.COL_PACKAGE, '', 'NVARCHAR', 'String', 256, 'Data', ruleConstants.TABLE_RULE_TEMPLATE, null, null, null, null);
		this.globalStaticRuleTemplateAttributes[vocaConstants.ATT_NAME] = new vocaObjects.AttrInfo('', vocaConstants.ATT_NAME, vocaConstants.DO_RULE_TEMPLATE, ruleConstants.COL_NAME, '', 'NVARCHAR', 'String', 256, 'Data', ruleConstants.TABLE_RULE_TEMPLATE, null, null, null, null);
		this.globalStaticRuleTemplateAttributes[vocaConstants.ATT_DESC] = new vocaObjects.AttrInfo('', vocaConstants.ATT_DESC, vocaConstants.DO_RULE_TEMPLATE, ruleConstants.COL_DESCRIPTION, '', 'NVARCHAR', 'String', 256, 'Data', ruleConstants.TABLE_RULE_TEMPLATE, null, null, null, null);
		this.globalStaticRuleTemplateAttributes[vocaConstants.ATT_VOCABULARY] = new vocaObjects.AttrInfo('', vocaConstants.ATT_VOCABULARY, vocaConstants.DO_RULE_TEMPLATE, ruleConstants.COL_DEFAULT_VOCABULARY, '', 'NVARCHAR', 'String', 256, 'Data', ruleConstants.TABLE_RULE_TEMPLATE, null, null, null, null);
		this.globalStaticRuleTemplateAttributes[vocaConstants.ATT_OUTPUT] = new vocaObjects.AttrInfo('', vocaConstants.ATT_OUTPUT, vocaConstants.DO_RULE_TEMPLATE, ruleConstants.COL_OUTPUT, '', 'NVARCHAR', 'String', 256, 'Data', ruleConstants.TABLE_RULE, null, null);
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.addDynamicRuleTemplateAttributes = function() {
		if (this.globalDynamicRuleTemplateAttributes) {
			return;
		}

		this.globalDynamicRuleTemplateAttributes = this.rtContext.getDynamicRuleTemplateAttributes();
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.addStaticRuleAttributes = function() {

		this.globalRuleAttributes[vocaConstants.ATT_ID] = new vocaObjects.AttrInfo('', vocaConstants.ATT_ID, vocaConstants.DO_RULE, ruleConstants.COL_ID, '', 'CHAR', 'String', 32, 'Data', ruleConstants.TABLE_RULE, null, null, null, null);
		this.globalRuleAttributes[vocaConstants.ATT_PACKAGE] = new vocaObjects.AttrInfo('', vocaConstants.ATT_PACKAGE, vocaConstants.DO_RULE, ruleConstants.COL_PACKAGE, '', 'NVARCHAR', 'String', 256, 'Data', ruleConstants.TABLE_RULE, null, null, null, null);
		this.globalRuleAttributes[vocaConstants.ATT_NAME] = new vocaObjects.AttrInfo('', vocaConstants.ATT_NAME, vocaConstants.DO_RULE, ruleConstants.COL_NAME, '', 'NVARCHAR', 'String', 256, 'Data', ruleConstants.TABLE_RULE, null, null, null, null);
		this.globalRuleAttributes[vocaConstants.ATT_RULE__TEMPLATE_ID] = new vocaObjects.AttrInfo('', vocaConstants.ATT_RULE__TEMPLATE_ID, vocaConstants.DO_RULE, ruleConstants.COL_RULE_TEMPLATE_ID, '', 'CHAR', 'String', 32, 'Data', ruleConstants.TABLE_RULE, null, null, null, null);
		this.globalRuleAttributes[vocaConstants.ATT_DESC] = new vocaObjects.AttrInfo('', vocaConstants.ATT_DESC, vocaConstants.DO_RULE, ruleConstants.COL_DESCRIPTION, '', 'NVARCHAR', 'String', 256, 'Data', ruleConstants.TABLE_RULE, null, null, null, null);
		this.globalRuleAttributes[vocaConstants.ATT_RULE__STATUS] = new vocaObjects.AttrInfo('', vocaConstants.ATT_RULE__STATUS, vocaConstants.DO_RULE, ruleConstants.COL_STATUS, '', 'NVARCHAR', 'String', 32, 'Data', ruleConstants.TABLE_RULE, null, null, null, null);
		//this.globalRuleAttributes[vocaConstants.ATT_RULE__BODY]         = new vocaObjects..AttrInfo ('', vocaConstants.ATT_RULE__BODY, vocaConstants.DO_RULE, ruleConstants.COL_BODY, '', 'NVARCHAR', 'String', 5000, 'Data', ruleConstants.TABLE_RULE, null, null, null); 
		this.globalRuleAttributes[vocaConstants.ATT_OUTPUT] = new vocaObjects.AttrInfo('', vocaConstants.ATT_OUTPUT, vocaConstants.DO_RULE, ruleConstants.COL_OUTPUT, '', 'NVARCHAR', 'String', 256, 'Data', ruleConstants.TABLE_RULE, null, null, null, null);
		this.globalRuleAttributes[vocaConstants.ATT_SINGLE_CONSUMPTION] = new vocaObjects.AttrInfo('', vocaConstants.ATT_SINGLE_CONSUMPTION, vocaConstants.DO_RULE, ruleConstants.COL_SINGLE_CONSUMPTION, '', 'TINYINT', 'Boolean', 'Data', ruleConstants.TABLE_RULE, null, null, null, null);
		this.globalRuleAttributes[vocaConstants.ATT_VOCABULARY] = new vocaObjects.AttrInfo('', vocaConstants.ATT_VOCABULARY, vocaConstants.DO_RULE, ruleConstants.COL_VOCABULARY, '', 'NVARCHAR', 'String', 256, 'Data', ruleConstants.TABLE_RULE, null, null, null, null);
		this.globalRuleAttributes[vocaConstants.ATT_MANUAL_ASSIGNMENT] = new vocaObjects.AttrInfo('', vocaConstants.ATT_MANUAL_ASSIGNMENT, vocaConstants.DO_RULE, ruleConstants.COL_MANUAL_ASSIGNMENT, '', 'TINYINT', 'Boolean', 1, 'Data', ruleConstants.TABLE_RULE, null, null, null, null);
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadRuleAttributes = function() {
		if (this.globalRuleAttributes) {
			return;
		}

		this.globalRuleAttributes = {};

		this.addStaticRuleAttributes();
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadAllGlobalObjects = function() {
		if (this.globalObjects) {
			return;
		}

		var gObj = {};

		//add vocabulary DO
		var vocaObj = new vocaObjects.ObjectInfo(null, null, vocaConstants.HRF_MODEL, '', vocaConstants.DO_VOCABULARY, vocaConstants.TABLE_VOCABULARY, this.rtContext.getHRFSchema());
		gObj[vocaObj.name] = vocaObj;
		vocaObj.associations = {};

		// add Rule Template DO
		var rTempObj = new vocaObjects.ObjectInfo(null, null, vocaConstants.HRF_MODEL, '', vocaConstants.DO_RULE_TEMPLATE, ruleConstants.TABLE_RULE_TEMPLATE, this.rtContext.getHRFSchema());
		gObj[rTempObj.name] = rTempObj;

		//add association from rule template to rule	
		rTempObj.associations = {};
		var assoc = new vocaObjects.AssocInfo('', '', vocaConstants.DO_RULE, vocaConstants.DO_RULE, vocaConstants.CARDINALITY_ONE_TO_MANY, null);

		assoc.attrs = [];
		assoc.attrs.push(new vocaObjects.AssocAttrInfo('', vocaConstants.ATT_ID, vocaConstants.ATT_RULE__TEMPLATE_ID));
		rTempObj.associations[assoc.name] = assoc;

		// add Rule DO
		var ruleObj = new vocaObjects.ObjectInfo(null, null, vocaConstants.HRF_MODEL, '', vocaConstants.DO_RULE,
			ruleConstants.TABLE_RULE, this.rtContext.getHRFSchema());
		gObj[ruleObj.name] = ruleObj;
		ruleObj.associations = {};
		this.addStaticRuleAssocs(ruleObj);

		// add defined Rule Templates
		var templates = this.rtContext.getDefinedTemplates();
		var i, pack, name, obj;

		for (i = 0; i < templates.length; i++) {
			pack = templates[i].pack;
			name = templates[i].name;

			obj = new vocaObjects.ObjectInfo(null, null, vocaConstants.RULE_TEMPLATE, '', name, utils.makeGlobalObjectRTName(pack, name), this.rtContext.getHRFSchema());
			gObj[obj.name] = obj;

			assoc = new vocaObjects.AssocInfo('', '', name, name, vocaConstants.CARDINALITY_ONE_TO_ONE, null);
			assoc.attrs = [];
			assoc.attrs.push(new vocaObjects.AssocAttrInfo('', vocaConstants.ATT_ID, vocaConstants.ATT_ID));
			ruleObj.associations[assoc.name] = assoc;
		}

		this.globalObjects = gObj;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadAllActions = function() {
		if (this.allVocaObjects.allActions) {
			return;
		}

		this.rtContext.loadAllActions(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadAllAliases = function() {
		if (this.allVocaObjects.allAliases) {
			return;
		}

		this.rtContext.loadAllAliases(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadAllValueLists = function() {
		if (this.allVocaObjects.allValueLists) {
			return;
		}

		this.rtContext.loadAllValueLists(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadAllTerms = function() {
		if (this.allVocaObjects.allTerms) {
			return;
		}

		this.rtContext.loadAllTerms(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadAllTermModifiers = function() {
		if (this.allVocaObjects.allTermsModifiers) {
			return;
		}

		this.rtContext.loadAllTermModifiers(this.allVocaObjects);
	};
	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadAllOutputs = function() {
		if (this.allVocaObjects.allOutputs) {
			return;
		}

		this.rtContext.loadAllOutputs(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadAllActionsStaticParams = function() {
		if (this.allVocaObjects.allActionsStaticParams) {
			return;
		}

		this.rtContext.loadAllActionsStaticParams(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadAllActionsRequiredParams = function() {
		if (this.allVocaObjects.allActionsRequiredParams) {
			return;
		}

		this.rtContext.loadAllActionsRequiredParams(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadAllOutputsRequiredParams = function() {
		if (this.allVocaObjects.allOutputsRequiredParams) {
			return;
		}

		this.rtContext.loadAllOutputsRequiredParams(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadAllOutputsStaticParams = function() {
		if (this.allVocaObjects.allOutputsStaticParams) {
			return;
		}

		this.rtContext.loadAllOutputsStaticParams(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadAllAdvancedFunctions = function() {
		if (this.allVocaObjects.allAdvancedFunctions) {
			return;
		}

		this.rtContext.loadAllAdvancedFunctions(this.allVocaObjects);
	};
	
	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadVocaObjects = function(voca, ignoreGlobalObjects) {
		if (voca.objects) {
			return;
		}

		this.loadAllObjects();
		voca.objects = {};
		var isNonGlobalVoc = voca.scope !== vocaConstants.GLOBAL;

		var i;

		for (i = 0; i < this.allVocaObjects.allObjects.length; i++) {
			//Collect all the objects belongs to this vocabulary.
			//In case of a nonGlobal vocabulary, also collect all global objects and all objects from all vocabularies in the same scope
			if (voca.id === this.allVocaObjects.allObjects[i].vocaId ||
				(isNonGlobalVoc && (this.allVocaObjects.allObjects[i].scope === vocaConstants.GLOBAL || this.allVocaObjects.allObjects[i].scope === voca.scope))) {

				voca.objects[this.allVocaObjects.allObjects[i].name] = this.allVocaObjects.allObjects[i];
			}
		}

		this.loadAllGlobalObjects();

		if(!ignoreGlobalObjects){
			var pName = null;
			for (pName in this.globalObjects) {

				if (this.globalObjects.hasOwnProperty(pName)) {

					voca.objects[pName] = this.globalObjects[pName];
				}
			}
		}
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadVocaActions = function(voca) {
		if (voca.actions) {
			return;
		}

		this.loadAllActions();
		voca.actions = {};
		var isNonGlobalVoc = voca.scope !== vocaConstants.GLOBAL;

		var i;
		for (i = 0; i < this.allVocaObjects.allActions.length; i++) {

			//Collect all the actions belongs to this vocabulary.
			//In case of a nonGlobal vocabulary, also collect all global actions and all actions from public vocabularies in the same scope
			if (voca.id === this.allVocaObjects.allActions[i].vocaId ||
				(isNonGlobalVoc && (this.allVocaObjects.allActions[i].scope === vocaConstants.GLOBAL || (this.allVocaObjects.allActions[i].scope === voca.scope && this.allVocaObjects.allActions[i].isPrivate === false)))) {

				voca.actions[this.allVocaObjects.allActions[i].name] = this.allVocaObjects.allActions[i];
			}
		}
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadVocaAliases = function(voca) {
		if (voca.aliases) {
			return;
		}
		
		this.loadAllAliases();
		utils.loadAllAliases(voca, this.allVocaObjects.allAliases, this.rtContext);
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadVocaTerms = function(voca) {
		if (voca.terms) {
			return;
		}

		this.loadAllTerms();
		this.loadAllTermModifiers();
		voca.terms = {};
		var isNonGlobalVoc = voca.scope !== vocaConstants.GLOBAL;
		var modifiers;
		
		var i,j;
		for (i = 0; i < this.allVocaObjects.allTerms.length; i++) {
			//Collect all the terms belongs to this vocabulary.
			//In case of a nonGlobal vocabulary, also collect all global terms and all terms from public vocabularies in the same scope
			if (voca.id === this.allVocaObjects.allTerms[i].vocaId ||
				(isNonGlobalVoc && (this.allVocaObjects.allTerms[i].scope === vocaConstants.GLOBAL || (this.allVocaObjects.allTerms[i].scope === voca.scope && this.allVocaObjects.allTerms[i].isPrivate === false)))) {

				voca.terms[this.allVocaObjects.allTerms[i].description] = this.allVocaObjects.allTerms[i];
				
				modifiers = {};
				for (j = 0; j < this.allVocaObjects.allTermsModifiers.length; j++) {
					if (this.allVocaObjects.allTermsModifiers[j].termId === this.allVocaObjects.allTerms[i].termId) {
						modifiers[this.allVocaObjects.allTermsModifiers[j].modifier] = true;
					}
				}
				voca.terms[this.allVocaObjects.allTerms[i].description].modifiers = modifiers;
			}
		}
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadVocaValueLists = function(voca) {
		if (voca.valueLists) {
			return;
		}


		this.loadAllValueLists();
		voca.valueLists = {};


		var isNonGlobalVoc = voca.scope !== vocaConstants.GLOBAL;

		var i;
		for (i = 0; i < this.allVocaObjects.allValueLists.length; i++) {

			//Collect all the value lists belongs to this vocabulary.
			//In case of a nonGlobal vocabulary, also collect all global value lists and all value lists from public vocabularies in the same scope

			// 1. Coolect my vocabulary value lists and Give higher prioruty to my vocabulary value lists  
			if (voca.id === this.allVocaObjects.allValueLists[i].vocaId) {
				voca.valueLists[this.allVocaObjects.allValueLists[i].name] = this.allVocaObjects.allValueLists[i];
			}

			// 2. Collect only other publics in the same scope  )scond priority)
			else if ((isNonGlobalVoc && (this.allVocaObjects.allValueLists[i].scope === vocaConstants.GLOBAL || (this.allVocaObjects.allValueLists[i].scope === voca.scope)))) {
				if (!voca.valueLists[this.allVocaObjects.allValueLists[i].name]) {
					voca.valueLists[this.allVocaObjects.allValueLists[i].name] = this.allVocaObjects.allValueLists[i];
				}
			}
		}
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadVocaOutputs = function(voca) {
		if (voca.outputs) {
			return;
		}

		this.loadAllOutputs();
		voca.outputs = {};

		var isNonGlobalVoc = voca.scope !== vocaConstants.GLOBAL;

		var i;
		for (i = 0; i < this.allVocaObjects.allOutputs.length; i++) {

			//Collect all the outputs belongs to this vocabulary.
			//In case of a nonGlobal vocabulary, also collect all global outputs and all outputs from public vocabularies in the same scope
			if (voca.id === this.allVocaObjects.allOutputs[i].vocaId ||
				(isNonGlobalVoc && (this.allVocaObjects.allOutputs[i].scope === vocaConstants.GLOBAL || (this.allVocaObjects.allOutputs[i].scope === voca.scope && this.allVocaObjects.allOutputs[i].isPrivate === false)))) {

				voca.outputs[this.allVocaObjects.allOutputs[i].name] = this.allVocaObjects.allOutputs[i];
			}
		}
	};


	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadVocaAdvancedFunctions = function(voca){
		if (voca.advancedFunctions) {
			return;
		}
		
		this.loadAllAdvancedFunctions();
		voca.advancedFunctions = {};
		
		var isNonGlobalVoc = voca.scope !== vocaConstants.GLOBAL;
		
		var i;
		for (i = 0; i < this.allVocaObjects.allAdvancedFunctions.length; i++) {

			//Collect all the advancedFunctions belongs to this vocabulary.
			//In case of a nonGlobal vocabulary, also collect all global advancedFunctions and all advancedFunctions from public vocabularies in the same scope
			if (voca.id === this.allVocaObjects.allAdvancedFunctions[i].vocaId ||
				(isNonGlobalVoc && (this.allVocaObjects.allAdvancedFunctions[i].scope === vocaConstants.GLOBAL || (this.allVocaObjects.allAdvancedFunctions[i].scope === voca.scope && this.allVocaObjects.allAdvancedFunctions[i].isPrivate === false)))) {

				voca.advancedFunctions[this.allVocaObjects.allAdvancedFunctions[i].name] = this.allVocaObjects.allAdvancedFunctions[i];
			}
		}
	};
	
	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadObject = function(vocaName, objName, loadAttr, loadAssoc) {
		var obj;

		var voca = this.loadVoca(vocaName, true, false, false, false, false, false, false);
		if (!voca) {
			return null;
		}

		obj = voca.objects[objName];



		if (!obj) {
			return null;
		}

		if (loadAttr) {
			this.loadObjectAttributes(voca, obj);
		}

		if (loadAssoc) {
			this.loadObjectAssociations(obj);
		}

		return obj;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadObjectIgnoreCase = function(vocaName, objName, loadAttr, loadAssoc) {
		var obj = null;

		var voca = this.loadVoca(vocaName, true, false, false, false, false, false, false);
		if (!voca) {
			return null;
		}

		var entry = null;
		for (entry in voca.objects) {
			if (voca.objects.hasOwnProperty(entry)) {
				if (entry.toLowerCase() === objName.toLowerCase()) {
					obj = voca.objects[entry];
					break;
				}
			}
		}


		if (!obj) {
			return null;
		}

		if (loadAttr) {
			this.loadObjectAttributes(voca, obj);
		}

		if (loadAssoc) {
			this.loadObjectAssociations(obj);
		}

		return obj;
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadAssocAttr = function(assoc) {
		if (assoc.attrs) {
			return;
		}

		this.loadAllAssocAttr();

		assoc.attrs = [];

		var i;
		for (i = 0; i < this.allVocaObjects.allAssocAttr.length; i++) {
			if (assoc.id === this.allVocaObjects.allAssocAttr[i].assocId) {
				assoc.attrs.push(this.allVocaObjects.allAssocAttr[i]);
			}
		}
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadAllAssocAttr = function() {
		if (this.allVocaObjects.allAssocAttr) {
			return;
		}

		this.rtContext.loadAllAssocAttr(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadObjectAssociations = function(obj) {
		if (obj.associations) {
			return;
		}

		obj.associations = {};

		if (obj.vocaId) {
			this.loadAllAssociations();
			var i;
			for (i = 0; i < this.allVocaObjects.allAssoc.length; i++) {
				if (obj.id === this.allVocaObjects.allAssoc[i].objId) {
					obj.associations[this.allVocaObjects.allAssoc[i].name] = this.allVocaObjects.allAssoc[i];
				}
			}
		} else {
			this.addStaticRuleAssocs(obj);
		}
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadObjectAttributes = function(voca, obj) {
		if (obj.attributes) {
			return;
		}

		obj.attributes = {};

		var i;

		if (!obj.vocaId) { //Indicator for global object (rule/ruleTemplate)

			var attrName = null;
			var attrInfo;

			if (obj.name === vocaConstants.DO_VOCABULARY) {

				this.addStaticVocabularyAttributes();

				for (attrName in this.globalStaticVocabularyAttributes) {

					if (this.globalStaticVocabularyAttributes.hasOwnProperty(attrName)) {

						attrInfo = this.globalStaticVocabularyAttributes[attrName];

						obj.attributes[attrName] = attrInfo;
					}
				}
			} else if (obj.name === vocaConstants.DO_RULE) {

				this.loadRuleAttributes();

				for (attrName in this.globalRuleAttributes) {

					if (this.globalRuleAttributes.hasOwnProperty(attrName)) {

						attrInfo = this.globalRuleAttributes[attrName];

						obj.attributes[attrName] = attrInfo;
					}
				}
			} else if (obj.name === vocaConstants.DO_RULE_TEMPLATE) {

				this.addStaticRuleTemplateAttributes();

				for (attrName in this.globalStaticRuleTemplateAttributes) {

					if (this.globalStaticRuleTemplateAttributes.hasOwnProperty(attrName)) {

						attrInfo = this.globalStaticRuleTemplateAttributes[attrName];

						obj.attributes[attrName] = attrInfo;
					}
				}
			} else {

				//offer, discount...
				this.addDynamicRuleTemplateAttributes();

				for (i = 0; i < this.globalDynamicRuleTemplateAttributes.length; i++) {

					attrInfo = this.globalDynamicRuleTemplateAttributes[i];

					if (obj.name === attrInfo.objectName) {

						obj.attributes[attrInfo.name] = attrInfo;
					}
				}
			}
		} else { //Regular data object
			this.loadAllAttributes(voca.name);

			for (i = 0; i < this.allVocaObjects.allAttr.length; i++) {
				if (obj.id === this.allVocaObjects.allAttr[i].objId) {
					obj.attributes[this.allVocaObjects.allAttr[i].name] = this.allVocaObjects.allAttr[i];
				}
			}
		}
	};

	//*******************************************************************************************************************
	//
	//	SELECT T2.ID,T1.ID,T1.NAME,T1.TARGET,T1.CARDINALITY,T5.vocaName 
	//	FROM "SAP_HRF"."sap.hrf.resources.vocabulary.model::OM_ASSOC"T1 
	//	INNER JOIN "SAP_HRF"."sap.hrf.resources.vocabulary.model::OM"T2 ON T2.ID = T1.OM_ID 
	//	INNER JOIN ( SELECT T3.NAME AS obj_name,T4.PATH_FULL_NAME AS vocaName 
	//	             FROM "SAP_HRF"."sap.hrf.resources.vocabulary.model::OM"T3 
	//	             INNER JOIN "SAP_HRF"."sap.hrf.resources.vocabulary.model::VOCABULARY"T4 ON T3.VOCABULARY_ID = T4.ID 
	//	             WHERE T4.SCOPE = 'sap.precisionGamingImp.content.vocabulary::gaming')T5 
	//	ON T1.TARGET = T5.obj_name	
	//*********************************************************************************************************************
	vocabularyRuntimeServices.prototype.loadAllAssociations = function() {
		if (this.allVocaObjects.allAssoc) {
			return;
		}

		this.rtContext.loadAllAssociations(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyRuntimeServices.prototype.loadAllAttributes = function() {
		if (this.allVocaObjects.allAttr) {
			return;
		}

		this.rtContext.loadAllAttributes(this.allVocaObjects);
	};

	//************************************************************************************************
	//************************************************************************************************
	//************************************************************************************************
	//************************************************************************************************
	//************************************************************************************************
	//************************************************************************************************
	//************************************************************************************************
	//************************************************************************************************
	//************************************************************************************************
	//************************************************************************************************
	//************************************************************************************************
	//************************************************************************************************
	//************************************************************************************************
	//************************************************************************************************
	//************************************************************************************************
	//************************************************************************************************
	//************************************************************************************************
	//************************************************************************************************
	//************************************************************************************************
	//************************************************************************************************
	//************************************************************************************************
	//************************************************************************************************
	//************************************************************************************************
	//************************************************************************************************

	return {
		vocabularyRuntimeServices : vocabularyRuntimeServices

	};
		
}());
