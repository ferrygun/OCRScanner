jQuery.sap.declare("sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderFactory");

jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderBaseContext");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProvider");


sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderFactory = sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderFactory|| {}; 
sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderFactory.lib = (function() {

	var contextBase = sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderBaseContext.lib;
	//var contextBaseLib = new contextBase.vocaDataProviderBaseContextLib();
	var vocabularyDataProviderBaseContext = sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProvider.lib;
	
	function vocaDataProviderFactoryLib() {
		//Constructor to enable usage of public method on the client side.
		//This mechanism was used in HRF to enable association to corresponding namespace in the client side.
	}
	
	/*
	 * This method will create and init an instance of Vocabulary Runtime Services object and return it to the caller.
	 * input params: instance of a Context object.
	 * returns: instance of Vocabulary Runtime Services object.
	 */
	vocaDataProviderFactoryLib.prototype.getVocabularyDataProvider = function(context){
		
		var rtsVocaInst = this.getVocabularyDataProvider.prototype.rtsVocaInst;
		//Check if the 'context' parameter is from the correct type (DB/Hybrid contexts has a 'connection' property) 
		if (context instanceof contextBase.vocaDataProviderBaseContextLib || (context && context.hasOwnProperty("connection"))){
			rtsVocaInst = new vocabularyDataProviderBaseContext.vocabularyDataProvider(context);
			this.getVocabularyDataProvider.prototype.rtsVocaInst = rtsVocaInst;
			rtsVocaInst.rtContext.loadAll(rtsVocaInst.allVocaObjects);
		}
		else if(!this.getVocabularyDataProvider.prototype.hasOwnProperty('rtsVocaInst')){
			//TBD: add an error message - but note this should be compatible with the client side imports list !!!
		} 
		
		return rtsVocaInst;
	};
	
	
	return {
		vocaDataProviderFactoryLib: vocaDataProviderFactoryLib
	}; 

}());
