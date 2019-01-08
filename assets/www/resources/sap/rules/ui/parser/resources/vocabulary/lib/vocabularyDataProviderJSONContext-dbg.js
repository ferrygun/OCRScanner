jQuery.sap.declare("sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderJSONContext");

jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderBaseContext");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.JSONLoader");
jQuery.sap.require("sap.rules.ui.parser.resources.common.lib.resourcesConvertor");



sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderJSONContext = sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderJSONContext|| {}; 
sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderJSONContext.lib = (function() {

	
	var vocabularyDataProviderBaseContext = sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderBaseContext.lib;
	var jsonLoader = sap.rules.ui.parser.resources.vocabulary.lib.JSONLoader.lib;
	var jsonLoaderLib = new jsonLoader.JSONLoaderLib();
	var resourcesConvertor = sap.rules.ui.parser.resources.common.lib.resourcesConvertor.lib;
	
	
	
	/*--------------------------------------------------------------------
	 * Constructor
	 *--------------------------------------------------------------------*/
	function vocaDataProviderJSONContextLib(resourceContent, resourceID, termModes) {
		var convertedVoca = null;
		
		//if the given termMode is not valid, manually init it to the default
		if(!termModes || termModes.constructor !== Array){
			termModes = ["byName"];
		}
		this.termModes = termModes;
		convertedVoca = resourcesConvertor.convertVocabularyODataToInternalModel(resourceContent, termModes);
		this.jsonResourceContent = convertedVoca;
		this.resourceID = {"name" : resourceID, "package" : "", "suffix" : null};
	}
	
	
	
	/*--------------------------------------------------------------------
	 * The inheritance
	 *--------------------------------------------------------------------*/
	vocaDataProviderJSONContextLib.prototype = new vocabularyDataProviderBaseContext.vocaDataProviderBaseContextLib();
	vocaDataProviderJSONContextLib.prototype.constructor = vocaDataProviderJSONContextLib;
	
	
	
	/*--------------------------------------------------------------------
	 * Class methods
	 *--------------------------------------------------------------------*/
	vocaDataProviderJSONContextLib.prototype.loadAll = function(allVocaObjects){
		jsonLoaderLib.loadAll(allVocaObjects, this.jsonResourceContent, false, null, this.resourceID, null, false);
	};
	
	
	vocaDataProviderJSONContextLib.prototype.getHRFSchema = function(){
		return "";
	};
	
	
	vocaDataProviderJSONContextLib.prototype.getDefinedTemplates = function(){
		return [];
	};
	
	
	//************************************************************************************************
	//************************************************************************************************
	vocaDataProviderJSONContextLib.prototype.readValueListValues = function(){
		return;
	};
	
	
	//************************************************************************************************
	//************************************************************************************************
	vocaDataProviderJSONContextLib.prototype.getConnection = function(){
		return null;
	};
	
	
	//************************************************************************************************
	//************************************************************************************************
	vocaDataProviderJSONContextLib.prototype.loadAllVocabularies = function(allVocaObjects) {
		if (!allVocaObjects.allVocabularies) {
			allVocaObjects.allVocabularies = {};
		}
		//The following line was marked to avoid double call for JSONLoader.loadAll() ==> loadAll created a new voca (with new UUID) --> duplication of voca entities !!! 
		//this.loadAll(allVocaObjects);
	};
	
	//************************************************************************************************
	//************************************************************************************************
	vocaDataProviderJSONContextLib.prototype.loadAllObjects = function(allVocaObjects) {
		if (!allVocaObjects.allObjects) {
			allVocaObjects.allObjects = [];
		}
		//The following line was marked to avoid double call for JSONLoader.loadAll() ==> loadAll created a new voca (with new UUID) --> duplication of voca entities !!! 
		//this.loadAll(allVocaObjects);
	};
	
	//************************************************************************************************
	//************************************************************************************************
	vocaDataProviderJSONContextLib.prototype.getDynamicRuleTemplateAttributes = function() {
		return;
	};
	
	
	//************************************************************************************************
	//************************************************************************************************
	vocaDataProviderJSONContextLib.prototype.loadAllActions = function(allVocaObjects) {
		if (!allVocaObjects.allActions) {
			allVocaObjects.allActions = [];
		}
		
		//The following line was marked to avoid double call for JSONLoader.loadAll() ==> loadAll created a new voca (with new UUID) --> duplication of voca entities !!! 
		//this.loadAll(allVocaObjects);
	};
	
	//************************************************************************************************
	//************************************************************************************************
	vocaDataProviderJSONContextLib.prototype.loadAllAliases = function(allVocaObjects) {
		if (!allVocaObjects.allAliases) {
			allVocaObjects.allAliases = [];
		}
		//The following line was marked to avoid double call for JSONLoader.loadAll() ==> loadAll created a new voca (with new UUID) --> duplication of voca entities !!! 
		//this.loadAll(allVocaObjects);
	};	
	
	//************************************************************************************************
	//************************************************************************************************
	vocaDataProviderJSONContextLib.prototype.loadAllValueLists = function(allVocaObjects) {
		if (!allVocaObjects.allValueLists) {
			allVocaObjects.allValueLists = [];
		}
	
		//The following line was marked to avoid double call for JSONLoader.loadAll() ==> loadAll created a new voca (with new UUID) --> duplication of voca entities !!! 
		//jsonLoaderLib.loadAll(allVocaObjects, this.jsonResourceContent, this.isPrivate, this.connection, this.resourceID, null, true);
	};
	
	//************************************************************************************************
	//************************************************************************************************
	vocaDataProviderJSONContextLib.prototype.loadAllTerms = function(allVocaObjects) {
		if (!allVocaObjects.allTerms) {
			allVocaObjects.allTerms = [];
		}
		
		//The following line was marked to avoid double call for JSONLoader.loadAll() ==> loadAll created a new voca (with new UUID) --> duplication of voca entities !!! 
		//this.loadAll(allVocaObjects);
	};	
	
	//************************************************************************************************
	//************************************************************************************************
	vocaDataProviderJSONContextLib.prototype.loadAllTermModifiers = function(allVocaObjects) {
		if (!allVocaObjects.allTermsModifiers) {
			allVocaObjects.allTermsModifiers = [];
		}
		
		//The following line was marked to avoid double call for JSONLoader.loadAll() ==> loadAll created a new voca (with new UUID) --> duplication of voca entities !!! 
		//jsonLoaderLib.loadAll(allVocaObjects, this.jsonResourceContent, this.isPrivate, this.connection, this.resourceID, null, true);
	};	
	
	//************************************************************************************************
	//************************************************************************************************
	vocaDataProviderJSONContextLib.prototype.loadAllOutputs = function(allVocaObjects) {
		if (!allVocaObjects.allOutputs) {
			allVocaObjects.allOutputs = [];
		}
		
		//The following line was marked to avoid double call for JSONLoader.loadAll() ==> loadAll created a new voca (with new UUID) --> duplication of voca entities !!! 
		//this.loadAll(allVocaObjects);
	};
	
	//************************************************************************************************
	//************************************************************************************************
	vocaDataProviderJSONContextLib.prototype.loadAllActionsStaticParams = function(allVocaObjects) {
		if (!allVocaObjects.allActionsStaticParams) {
			allVocaObjects.allActionsStaticParams = [];
		}
		
		//The following line was marked to avoid double call for JSONLoader.loadAll() ==> loadAll created a new voca (with new UUID) --> duplication of voca entities !!! 
		//jsonLoaderLib.loadAll(allVocaObjects, this.jsonResourceContent, this.isPrivate, this.connection, this.resourceID, null, true);
	};
	
	//************************************************************************************************
	//************************************************************************************************
	vocaDataProviderJSONContextLib.prototype.loadAllActionsRequiredParams = function(allVocaObjects) {
		if (!allVocaObjects.allActionsRequiredParams) {
			allVocaObjects.allActionsRequiredParams = [];
		}
		
		//The following line was marked to avoid double call for JSONLoader.loadAll() ==> loadAll created a new voca (with new UUID) --> duplication of voca entities !!! 
		//this.loadAll(allVocaObjects);
	};
	
	//************************************************************************************************
	//************************************************************************************************
	vocaDataProviderJSONContextLib.prototype.loadAllOutputsRequiredParams = function(allVocaObjects) {
		if (!allVocaObjects.allOutputsRequiredParams) {
			allVocaObjects.allOutputsRequiredParams = [];
		}
		//The following line was marked to avoid double call for JSONLoader.loadAll() ==> loadAll created a new voca (with new UUID) --> duplication of voca entities !!! 
		//this.loadAll(allVocaObjects);
	};
	
	//************************************************************************************************
	//************************************************************************************************
	vocaDataProviderJSONContextLib.prototype.loadAllOutputsStaticParams = function(allVocaObjects) {
		if (!allVocaObjects.allOutputsStaticParams) {
			allVocaObjects.allOutputsStaticParams = [];
		}
		//The following line was marked to avoid double call for JSONLoader.loadAll() ==> loadAll created a new voca (with new UUID) --> duplication of voca entities !!! 
		//this.loadAll(allVocaObjects);
	};
	
	//************************************************************************************************
	//************************************************************************************************
	vocaDataProviderJSONContextLib.prototype.loadAllAssocAttr = function(allVocaObjects) {
		if (!allVocaObjects.allAssocAttr) {
			allVocaObjects.allAssocAttr = [];
		}
		
		//The following line was marked to avoid double call for JSONLoader.loadAll() ==> loadAll created a new voca (with new UUID) --> duplication of voca entities !!! 
		//this.loadAll(allVocaObjects);
	};
	
	//************************************************************************************************
	//************************************************************************************************
	vocaDataProviderJSONContextLib.prototype.loadAllAssociations = function(allVocaObjects) {
		if (!allVocaObjects.allAssoc) {
			allVocaObjects.allAssoc = [];
		}
		//The following line was marked to avoid double call for JSONLoader.loadAll() ==> loadAll created a new voca (with new UUID) --> duplication of voca entities !!! 
		//this.loadAll(allVocaObjects);
	};
	
	//************************************************************************************************
	//************************************************************************************************
	vocaDataProviderJSONContextLib.prototype.loadAllAttributes = function(allVocaObjects) {
		if (!allVocaObjects.allAttr) {
			allVocaObjects.allAttr = [];
		}
		
		//The following line was marked to avoid double call for JSONLoader.loadAll() ==> loadAll created a new voca (with new UUID) --> duplication of voca entities !!! 
		//this.loadAll(allVocaObjects);
	};
	
	//************************************************************************************************
	//************************************************************************************************
	vocaDataProviderJSONContextLib.prototype.loadAllAdvancedFunctions = function(allVocaObjects) {
		if (!allVocaObjects.allAdvancedFunctions) {
			allVocaObjects.allAdvancedFunctions = [];
		}
		
		//The following line was marked to avoid double call for JSONLoader.loadAll() ==> loadAll created a new voca (with new UUID) --> duplication of voca entities !!! 
		//this.loadAll(allVocaObjects);
	};
	
	
	vocaDataProviderJSONContextLib.prototype.getTransientVocabulary = function() {
		return null;
	};
	
	
	return {
		vocaDataProviderJSONContextLib: vocaDataProviderJSONContextLib
	}; 

}());




