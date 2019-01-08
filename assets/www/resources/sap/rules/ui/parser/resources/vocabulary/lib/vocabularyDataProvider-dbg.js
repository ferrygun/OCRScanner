jQuery.sap.declare("sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProvider");

jQuery.sap.require("sap.rules.ui.parser.resources.rule.lib.constantsBase");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.runtimeServicesUtils");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.vocaObjects");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.vocaConversionUtils");



sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProvider = sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProvider|| {}; 
sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProvider.lib = (function() {
	var ruleConstants = sap.rules.ui.parser.resources.rule.lib.constantsBase.lib;
	var vocaConstants = sap.rules.ui.parser.resources.vocabulary.lib.constants.lib;
	var vocaObjects = sap.rules.ui.parser.resources.vocabulary.lib.vocaObjects.lib;
	var utils = sap.rules.ui.parser.resources.vocabulary.lib.runtimeServicesUtils.lib;
	utils = new utils.runtimeServicesUtilsLib();
	var conversionUtils = sap.rules.ui.parser.resources.vocabulary.lib.vocaConversionUtils;
	

	//*********************************************************************************************
	//************************************************************************************************
	function vocabularyDataProvider(vocaRTContext) {

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
			"allVocabularies" : null,
			"allParameterInfos":null 
		};
		
		this.rtContext = vocaRTContext;
	}

	
	vocabularyDataProvider.prototype.getTermModes = function() {
		var termModesArr = this.rtContext.termModes;
		
		if(!termModesArr){
			//init it to the default (for native flows mainly)
			termModesArr = ["byName"];
		}
		return termModesArr;
	};
	
	
	//***********************************************************
	// PUBLIC
	//***********************************************************
	vocabularyDataProvider.prototype.refresh = function() {

		this.clearAll();
	};
	
	//***********************************************************
	// PUBLIC
	//***********************************************************
	vocabularyDataProvider.prototype.partialRefresh = function(whatToRefresh) {

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
	vocabularyDataProvider.prototype.getAllVocaObjects = function() {
		
		return this.allVocaObjects;
	};

	//***********************************************************
	//**********************************************************
	vocabularyDataProvider.prototype.getParameters = function() {
		var filterParams = null;
		if (this.allVocaObjects){
			filterParams = this.allVocaObjects.allParameterInfos;
		}
		return filterParams;
	};
	

	//***********************************************************
	//**********************************************************
	//  reads all real values for value list 
	vocabularyDataProvider.prototype.readValueListValues = function(valueList) {
		if (valueList[vocaConstants.VALUE_LIST_VALUES]) {
			return valueList[vocaConstants.VALUE_LIST_VALUES];
		}

		return this.rtContext.readValueListValues(valueList);
	};

	//***********************************************************
	//**********************************************************
	//  reads all real values for value list 
	vocabularyDataProvider.prototype.getValueListType = function(vocaName, valueListName) {
		var valueList = null;
		
		var voca = this.loadVoca(vocaName, false, false, false, false, true, false, false);
		if (voca) {
			if (voca.valueLists.hasOwnProperty(valueListName)) {
				valueList = voca.valueLists[valueListName];
				if  (valueList.hasOwnProperty(vocaConstants.PROPERTY_VALUE_LIST_METADATA)) {
					return vocaConstants.EXTERNAL_VALUE_LIST;
				}
			}
		}
		return vocaConstants.INTERNAL_VALUE_LIST;
	};

	//***********************************************************
	//**********************************************************
	vocabularyDataProvider.prototype.getValueListDescriptions = function(vocaName, valueListName, searchStr) {

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
				if (this.getValueListType(vocaName, valueListName) === vocaConstants.INTERNAL_VALUE_LIST) {
					voca.valueLists[valueListName].values = this.readValueListValues(voca.valueLists[valueListName]);
					var pDesc = null;
					for (pDesc in voca.valueLists[valueListName].values) {
						if (voca.valueLists[valueListName].values.hasOwnProperty(pDesc)) {
							// In case of string or date the first letter is '
							if (localStr === null || pDesc.toLowerCase().indexOf(localStr.toLowerCase()) === 0) {
								tmpDesc = pDesc.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t').replace(/\f/g, '\\f');				
								valueListDescriptions.push(tmpDesc);
							}
						}
					}
				}
			}
		}

		return valueListDescriptions;
	};

	//***********************************************************
	//**********************************************************
	vocabularyDataProvider.prototype.GetValueFromValueListDescription = function(vocaName, valueListName, description) {

		var value = null;

		var voca = this.loadVoca(vocaName, false, false, false, false, true, false, false);
		if (voca) {
			if (voca.valueLists.hasOwnProperty(valueListName)) {
				if (this.getValueListType(vocaName, valueListName) === vocaConstants.INTERNAL_VALUE_LIST) {
					voca.valueLists[valueListName].values = this.readValueListValues(voca.valueLists[valueListName]);
					if (voca.valueLists[valueListName].values.hasOwnProperty(description)) {
						value = voca.valueLists[valueListName].values[description];
					}
				}
			}
		}

		return value;
	};

	//***********************************************************
	//**********************************************************
	vocabularyDataProvider.prototype.GetDescriptionFromValueListValue = function(vocaName, valueListName, value) {

		//var descriptionForValue = null;
		var values, description;

		var voca = this.loadVoca(vocaName, false, false, false, false, true, false, false);
		if (voca) {
			if (voca.valueLists.hasOwnProperty(valueListName)) {
				if (this.getValueListType(vocaName, valueListName) === vocaConstants.INTERNAL_VALUE_LIST) {
					values = this.readValueListValues(voca.valueLists[valueListName]);
					for ( description in values) {
						if (values.hasOwnProperty(description) && ((("'" + values[description] + "'") === value) || (values[description] === value) )) {
							return description;
						}
					}
				}
			}
		}

		return null;
	};
	//***********************************************************
	//**********************************************************
	vocabularyDataProvider.prototype.IsValueListDescriptionExist = function(vocaName, valueListName) {

		var value = false;

		var voca = this.loadVoca(vocaName, false, false, false, false, true, false, false);
		if (voca) {
			if (voca.valueLists.hasOwnProperty(valueListName)) {
				if (this.getValueListType(vocaName, valueListName) === vocaConstants.INTERNAL_VALUE_LIST) {
				//voca.valueLists[valueListName].values = this.readValueListValues(voca.valueLists[valueListName]);
					if (voca.valueLists[valueListName].descriptionColumn) {
						value = true;
					}
				}
			}
		}

		return value;
	};
	//***********************************************************
	//**********************************************************
	vocabularyDataProvider.prototype.getValueList = function(vocaName, valueListName) {

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
	vocabularyDataProvider.prototype.getObjects = function(vocaName, searchStr) {
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
	vocabularyDataProvider.prototype.getAllActionNames = function(scope, excludeVocName) {

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
	vocabularyDataProvider.prototype.getAllOutputNames = function(scope, excludeVocName) {

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
	vocabularyDataProvider.prototype.getAllPersistedAliasNames = function(scope, excludeVocName, includeVocName) {

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
	vocabularyDataProvider.prototype.getAllPersistedValueListsNames = function(scope, excludeVocName, includeVocName) {

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
	vocabularyDataProvider.prototype.isVocabularyExist = function(vocaName, scope) {

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
	vocabularyDataProvider.prototype.isTermsExist = function(vocaName) {

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
	vocabularyDataProvider.prototype.getAllObjectModelNames = function(scope, excludeVocName, includeVocName) {

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
	vocabularyDataProvider.prototype.getAllAttributesNames = function(scope, excludeVocName, includeVocName) {

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
	vocabularyDataProvider.prototype.isAttributeExists = function(vocaName, attrName) {

		var scope = this.getVocabularyScope(vocaName);

		var attributesMap = this.getAllAttributesNames(scope);

		if (attributesMap.hasOwnProperty(attrName)) {

			return true;
		}

		return false;
	};

	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.getVocabulary = function(vocaName, ignoreGlobalObjects, conversionFlags) {
		
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
	vocabularyDataProvider.prototype.getVocabularyScope = function(vocaName) {

		this.loadAllVocabularies();

		if (this.allVocaObjects.allVocabularies.hasOwnProperty(vocaName)) {

			return this.allVocaObjects.allVocabularies[vocaName].scope;
		}

		return null;
	};

	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.getVocabulariesInScope = function(vocaName) {

		var scope = this.getVocabularyScope(vocaName);

		return this.getVocabulariesNames(scope, true);
	};

	//***********************************************************
	//***********************************************************

	vocabularyDataProvider.prototype.getIsIncludeGlobal = function(includeGlobals) {

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
	vocabularyDataProvider.prototype.getVocabulariesNames = function(scope, includeGlobals) {

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

	vocabularyDataProvider.prototype.getDefaultWritableForAppByVocabulary = function(vocaName) {
		var scope = this.getVocabularyScope(vocaName);
		return this.getDefaultWritableForAppByScope(scope);
	};


	vocabularyDataProvider.prototype.getDefaultWritableForAppByScope = function(scope) {
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

	vocabularyDataProvider.prototype.isObjectExist = function(vocaName, objName) {

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
	vocabularyDataProvider.prototype.isGlobalObject = function(objName) {
		this.loadAllGlobalObjects();
		return this.globalObjects.hasOwnProperty(objName);
	};

	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.getObject = function(vocaName, objName) {
		return this.loadObject(vocaName, objName, true, true);
	};

	//***********************************************************
	//***********************************************************

	vocabularyDataProvider.prototype.getObjectIgnoreCase = function(vocaName, objName) {
		return this.loadObjectIgnoreCase(vocaName, objName, true, true);
	};

	//***********************************************************
	//***********************************************************

	vocabularyDataProvider.prototype.getObjectRuntimeInfo = function(vocaName, objName) {
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
	vocabularyDataProvider.prototype.getObjectRuntimeName = function(vocaName, objName) {
		var obj = this.loadObject(vocaName, objName, false, false);
		if (!obj) {
			return null;
		}

		return obj.runtimeName;
	};

	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.getObjectRuntimeSchemaName = function(vocaName, objName) {
		var obj = this.loadObject(vocaName, objName, false, false);
		if (!obj) {
			return null;
		}

		return obj.schema;
	};

	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.getActionsNames = function(vocaName, searchStr) {
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
	vocabularyDataProvider.prototype.getVocaTerms = function(vocaName){
		var result = [];
		var i;
		var terms = this.getTerms(vocaName);
		if (!terms){
			return result;
		}
		for (i=0; i < terms.terms.length; i++) {
			if (terms.terms[i].isVocaRuleTerm === true){
				result.push(terms.terms[i]);
			}
		}
		return result;
	};
	
	vocabularyDataProvider.prototype.getTerms = function(vocaName, searchStr, termMode){
		var terms = [];
		var termObj = null;
		var term = null;
		var termProperty = null;
		var localStr = null;
		var voca = null;
		
		if (searchStr){
			localStr = searchStr.toLowerCase();
		}
		if(termMode === vocaConstants.TermModeRelated.TERM_MODE_BY_DESCRIPTION){
			termProperty = vocaConstants.TermModeRelated.TERM_PROPERTY_FRIENDLY_TERM;
		}
		else{
			termProperty =  vocaConstants.TermModeRelated.TERM_PROPERTY_DESCRIPTION;
		} 
		voca = this.loadVoca(vocaName, false, false, false, false, false, true, false);
		if (voca){
			for (term in voca.terms){
				if(voca.terms.hasOwnProperty(term)){
					termObj = voca.terms[term];
					if(localStr === null || termObj[termProperty].toLowerCase().indexOf(localStr) === 0){ 
						terms.push(termObj);
					}
				}
			}
		}

		return {
			terms: terms
		};
	};

	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.getActions = function(vocaName, searchStr, conversionFlags) {
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
	vocabularyDataProvider.prototype.getAction = function(vocaName, actName, conversionFlags) {
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
	vocabularyDataProvider.prototype.getTerm = function(vocaName, termDescription, termModeFlag) {
		
		var term = null;
		var termObj = null;
		var requiredTermObj = null;
		var termProperty = null;
		var voca = this.loadVoca(vocaName, false, false, false, false, false, true, false);
		
		if (!voca) {
			return null;
		}

		if(termModeFlag === vocaConstants.TermModeRelated.TERM_MODE_BY_DESCRIPTION){
			termProperty = vocaConstants.TermModeRelated.TERM_PROPERTY_FRIENDLY_TERM;
		}
		else{
			termProperty =  vocaConstants.TermModeRelated.TERM_PROPERTY_DESCRIPTION;
		} 
		
		for (term in voca.terms){
			if(voca.terms.hasOwnProperty(term)){
				termObj = voca.terms[term];
				if(termObj[termProperty] === termDescription){   //.toLowerCase()){ 
					requiredTermObj = termObj;
					break;
				}
			}
		}
		
		return requiredTermObj;
	};
	
	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.isTermModifierEmpty = function(vocaName) {
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
	vocabularyDataProvider.prototype.isCurrentTermModifierEmpty = function(vocaName) {
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
	vocabularyDataProvider.prototype.getAlias = function(vocaName, aliasName, conversionFlags) {
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
	vocabularyDataProvider.prototype.isAliasExist = function(vocaName, aliasName) {
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
	vocabularyDataProvider.prototype.isActionExist = function(vocaName, actName) {
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
	vocabularyDataProvider.prototype.getAliasesNames = function(vocaName, searchStr) {
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
	vocabularyDataProvider.prototype.getOutputsNames = function(vocaName, searchStr) {
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
	vocabularyDataProvider.prototype.getOutputs = function(vocaName, searchStr, conversionFlags) {
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
	vocabularyDataProvider.prototype.getAliases = function(vocaName, searchStr, conversionFlags) {
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
	vocabularyDataProvider.prototype.getOutput = function(vocaName, outName, conversionFlags) {
		return this.getOutputByUsage(vocaName, outName, conversionFlags, false);
	};
	
	vocabularyDataProvider.prototype.getVocaRuleOutput = function(vocaName, outName, conversionFlags ) {
		return this.getOutputByUsage(vocaName, outName, conversionFlags, true);
	};
	
	vocabularyDataProvider.prototype.getOutputByUsage = function(vocaName, outName, conversionFlags, isVocaRuleOutput ) {
		var voca = this.loadVoca(vocaName, false, false, true, false, false, false, false);
		if (!voca) {
			return null;
		}

		if(isVocaRuleOutput && !voca.vocaRulesOutputs[outName]) {
		
			return null;
		}
		if (!isVocaRuleOutput &&  !voca.outputs[outName]) {
			return null;
		}

		var output = null;
		if(isVocaRuleOutput) {
			output = voca.vocaRulesOutputs[outName];
		}
		else {	
		 output = voca.outputs[outName];
		}
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
	vocabularyDataProvider.prototype.isOutputExist = function(vocaName, outName) {

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
	vocabularyDataProvider.prototype.getObjectsNames = function(vocaName, searchStr) {
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
	vocabularyDataProvider.prototype.getObjectAssociationsNames = function(vocaName, objName, searchStr) {
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
	vocabularyDataProvider.prototype.getObjectAttributesNames = function(vocaName, objName, searchStr) {
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
	vocabularyDataProvider.prototype.getObjectAttributesDescriptions = function(vocaName, objName, searchStr) {
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
			var desc = null;
			for (pName in obj.attributes) {
				if (obj.attributes.hasOwnProperty(pName)) {
					desc = obj.attributes[pName].description;
					if (localStr === null || desc.toLowerCase().indexOf(localStr.toLowerCase()) === 0) {
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
	vocabularyDataProvider.prototype.getObjectAttributesNamesByTermMode = function(vocaName, objName, searchStr, termMode) {
		if (termMode === vocaConstants.TermModeRelated.TERM_MODE_BY_DESCRIPTION) {
			return this.getObjectAttributesDescriptions(vocaName, objName, searchStr);
		}
		return this.getObjectAttributesNames(vocaName, objName, searchStr);
	};
	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.getAttribute = function(vocaName, objName, attrName) {
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
	vocabularyDataProvider.prototype.getAttributeByDesc = function(vocaName, objName, attrDesc) {
        
        var attr = 0;
        var obj = this.loadObject(vocaName, objName, true, false);
        if (!obj) {
              return null;
        }

        for(attr in obj.attributes){
              if (obj.attributes.hasOwnProperty(attr)){
                    if(obj.attributes[attr].description === attrDesc){
                          return obj.attributes[attr];
                    }
              }
        }
  };
	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.getAttributeIgnoreCase = function(vocaName, objName, attrName) {
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
	vocabularyDataProvider.prototype.getAttributeByTermMode = function(vocaName, objName, attrName, termMode) {
		if (termMode === vocaConstants.TermModeRelated.TERM_MODE_BY_DESCRIPTION) {
			return this.getAttributeByDesc(vocaName, objName, attrName);
		}
		return this.getAttribute(vocaName, objName, attrName);
	};

	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.getAttributeDataType = function(vocaName, objName, attrName) {
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
	vocabularyDataProvider.prototype.getAttributeBusinessDataType = function(vocaName, objName, attrName) {
		var obj = this.loadObject(vocaName, objName, true, false);
		if (!obj) {
			return null;
		}

		if (!obj.attributes[attrName]) {
			return null;
		}

		return obj.attributes[attrName].businessDataType;
	};

	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.getAttributeRuntimeName = function(vocaName, objName, attrName) {
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
	vocabularyDataProvider.prototype.getAttributes = function(vocaName, objName) {
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
	vocabularyDataProvider.prototype.getAssociations = function(vocaName, objName, withAttr) {
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
	vocabularyDataProvider.prototype.getAssociation = function(vocaName, objName, assocName, withAttr) {
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
	vocabularyDataProvider.prototype.getAssociationIgnoreCase = function(vocaName, objName, assocName, withAttr) {
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
	vocabularyDataProvider.prototype.getAdvancedFunctions = function(vocaName, searchStr){
		
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
	vocabularyDataProvider.prototype.getAdvancedFunction = function(vocaName, pName){
		
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
	vocabularyDataProvider.prototype.clearAll = function() {
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
	vocabularyDataProvider.prototype.loadAllVocabularies = function() {
		if (this.allVocaObjects.allVocabularies) {
			return;
		}

		this.rtContext.loadAllVocabularies(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.loadVoca = function(vocaName, loadObj, loadAction, loadOutput, loadAlias, loadValueList, loadTerm, loadAdvancedFunctions, ignoreGlobalObjects) {
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
	vocabularyDataProvider.prototype.loadAllObjects = function() {
		if (this.allVocaObjects.allObjects) {
			return;
		}
		
		this.rtContext.loadAllObjects(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.addStaticRuleAssocs = function(ruleObj) {

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
	vocabularyDataProvider.prototype.addStaticVocabularyAttributes = function() {

		if (this.globalStaticVocabularyAttributes) {
			return;
		}

		this.globalStaticVocabularyAttributes = {};

		this.globalStaticVocabularyAttributes[vocaConstants.ATT_VOCA_SCOPE] = new vocaObjects.AttrInfo('', vocaConstants.ATT_VOCA_SCOPE, vocaConstants.DO_VOCABULARY, vocaConstants.VOCABULARY_COL_SCOPE, '', 'NVARCHAR', 'String', 512, 'Data', vocaConstants.VOCABULARY_COL_SCOPE, null, null, null, null);
		this.globalStaticVocabularyAttributes[vocaConstants.ATT_VOCA_FULL_NAME] = new vocaObjects.AttrInfo('', vocaConstants.ATT_VOCA_FULL_NAME, vocaConstants.DO_VOCABULARY, vocaConstants.VOCABULARY_COL_PATH_FULL_NAME, '', 'NVARCHAR', 'String', 512, 'Data', vocaConstants.VOCABULARY_COL_PATH_FULL_NAME, null, null, null, null);
	};

	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.addStaticRuleTemplateAttributes = function() {

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
	vocabularyDataProvider.prototype.addDynamicRuleTemplateAttributes = function() {
		if (this.globalDynamicRuleTemplateAttributes) {
			return;
		}

		this.globalDynamicRuleTemplateAttributes = this.rtContext.getDynamicRuleTemplateAttributes();
	};

	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.addStaticRuleAttributes = function() {

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
	vocabularyDataProvider.prototype.loadRuleAttributes = function() {
		if (this.globalRuleAttributes) {
			return;
		}

		this.globalRuleAttributes = {};

		this.addStaticRuleAttributes();
	};

	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.loadAllGlobalObjects = function() {
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
	vocabularyDataProvider.prototype.loadAllActions = function() {
		if (this.allVocaObjects.allActions) {
			return;
		}

		this.rtContext.loadAllActions(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.loadAllAliases = function() {
		if (this.allVocaObjects.allAliases) {
			return;
		}

		this.rtContext.loadAllAliases(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.loadAllValueLists = function() {
		if (this.allVocaObjects.allValueLists) {
			return;
		}

		this.rtContext.loadAllValueLists(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.loadAllTerms = function() {
		if (this.allVocaObjects.allTerms) {
			return;
		}

		this.rtContext.loadAllTerms(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.loadAllTermModifiers = function() {
		if (this.allVocaObjects.allTermsModifiers) {
			return;
		}

		this.rtContext.loadAllTermModifiers(this.allVocaObjects);
	};
	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.loadAllOutputs = function() {
		if (this.allVocaObjects.allOutputs) {
			return;
		}

		this.rtContext.loadAllOutputs(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.loadAllActionsStaticParams = function() {
		if (this.allVocaObjects.allActionsStaticParams) {
			return;
		}

		this.rtContext.loadAllActionsStaticParams(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.loadAllActionsRequiredParams = function() {
		if (this.allVocaObjects.allActionsRequiredParams) {
			return;
		}

		this.rtContext.loadAllActionsRequiredParams(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.loadAllOutputsRequiredParams = function() {
		if (this.allVocaObjects.allOutputsRequiredParams) {
			return;
		}

		this.rtContext.loadAllOutputsRequiredParams(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.loadAllOutputsStaticParams = function() {
		if (this.allVocaObjects.allOutputsStaticParams) {
			return;
		}

		this.rtContext.loadAllOutputsStaticParams(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.loadAllAdvancedFunctions = function() {
		if (this.allVocaObjects.allAdvancedFunctions) {
			return;
		}

		this.rtContext.loadAllAdvancedFunctions(this.allVocaObjects);
	};
	
	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.loadVocaObjects = function(voca, ignoreGlobalObjects) {
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
	vocabularyDataProvider.prototype.loadVocaActions = function(voca) {
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
	vocabularyDataProvider.prototype.loadVocaAliases = function(voca) {
		if (voca.aliases) {
			return;
		}
		
		this.loadAllAliases();
		utils.loadAllAliases(voca, this.allVocaObjects.allAliases, this.rtContext);
	};

	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.loadVocaTerms = function(voca) {
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
	vocabularyDataProvider.prototype.loadVocaValueLists = function(voca) {
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
	vocabularyDataProvider.prototype.loadVocaOutputs = function(voca) {
		if (voca.outputs) {
			return;
		}

		this.loadAllOutputs();
		voca.outputs = {};
		voca.vocaRulesOutputs = {};

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
		
		if(this.allVocaObjects.hasOwnProperty('allVocaRulesOutputs')) {
		for (i = 0; i < this.allVocaObjects.allVocaRulesOutputs.length; i++) {

			//Collect all the outputs belongs to this vocabulary.
			//In case of a nonGlobal vocabulary, also collect all global outputs and all outputs from public vocabularies in the same scope
				if (voca.id === this.allVocaObjects.allVocaRulesOutputs[i].vocaId ||
						(isNonGlobalVoc && (this.allVocaObjects.allVocaRulesOutputs[i].scope === vocaConstants.GLOBAL || (this.allVocaObjects.allVocaRulesOutputs[i].scope === voca.scope && this.allVocaObjects.allVocaRulesOutputs[i].isPrivate === false)))) {
					
					voca.vocaRulesOutputs[this.allVocaObjects.allVocaRulesOutputs[i].name] = this.allVocaObjects.allVocaRulesOutputs[i];
				}
			}
		}
	};


	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.loadVocaAdvancedFunctions = function(voca){
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
	vocabularyDataProvider.prototype.loadObject = function(vocaName, objName, loadAttr, loadAssoc) {
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
	vocabularyDataProvider.prototype.loadObjectIgnoreCase = function(vocaName, objName, loadAttr, loadAssoc) {
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
	vocabularyDataProvider.prototype.loadAssocAttr = function(assoc) {
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
	vocabularyDataProvider.prototype.loadAllAssocAttr = function() {
		if (this.allVocaObjects.allAssocAttr) {
			return;
		}

		this.rtContext.loadAllAssocAttr(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.loadObjectAssociations = function(obj) {
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
	vocabularyDataProvider.prototype.loadObjectAttributes = function(voca, obj) {
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
	vocabularyDataProvider.prototype.loadAllAssociations = function() {
		if (this.allVocaObjects.allAssoc) {
			return;
		}

		this.rtContext.loadAllAssociations(this.allVocaObjects);
	};

	//***********************************************************
	//***********************************************************
	vocabularyDataProvider.prototype.loadAllAttributes = function() {
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
		vocabularyDataProvider : vocabularyDataProvider

	};
		
}());
