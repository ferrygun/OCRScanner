jQuery.sap.declare("sap.rules.ui.parser.resources.vocabulary.lib.rtsVocaCoreFactory");

jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.rtsVocaContextBase");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.rtsVoca");


sap.rules.ui.parser.resources.vocabulary.lib.rtsVocaCoreFactory = sap.rules.ui.parser.resources.vocabulary.lib.rtsVocaCoreFactory|| {}; 
sap.rules.ui.parser.resources.vocabulary.lib.rtsVocaCoreFactory.lib = (function() {

	var contextBase = sap.rules.ui.parser.resources.vocabulary.lib.rtsVocaContextBase.lib;
	//var contextBaseLib = new contextBase.rtsVocaContextBaseLib();
	var rtsVoca = sap.rules.ui.parser.resources.vocabulary.lib.rtsVoca.lib;
	
	function rtsVocaCoreFactoryLib() {
		//Constructor to enable usage of public method on the client side.
		//This mechanism was used in HRF to enable association to corresponding namespace in the client side.
	}
	
	/*
	 * This method will create and init an instance of Vocabulary Runtime Services object and return it to the caller.
	 * input params: instance of a Context object.
	 * returns: instance of Vocabulary Runtime Services object.
	 */
	rtsVocaCoreFactoryLib.prototype.getVocabularyRuntimeServices = function(context){
		
		var rtsVocaInst = this.getVocabularyRuntimeServices.prototype.rtsVocaInst;
		//Check if the 'context' parameter is from the correct type (DB/Hybrid contexts has a 'connection' property) 
		if (context instanceof contextBase.rtsVocaContextBaseLib || (context && context.hasOwnProperty("connection"))){
			rtsVocaInst = new rtsVoca.vocabularyRuntimeServices(context);
			this.getVocabularyRuntimeServices.prototype.rtsVocaInst = rtsVocaInst;
			rtsVocaInst.rtContext.loadAll(rtsVocaInst.allVocaObjects);
		}
		else if(!this.getVocabularyRuntimeServices.prototype.hasOwnProperty('rtsVocaInst')){
			//TBD: add an error message - but note this should be compatible with the client side imports list !!!
		} 
		
		return rtsVocaInst;
	};
	
	
	return {
		rtsVocaCoreFactoryLib: rtsVocaCoreFactoryLib
	}; 

}());
