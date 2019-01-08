jQuery.sap.declare("sap.rules.ui.parser.resources.vocabulary.lib.rtsVocaInitiator");

jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.rtsVocaContextFactory");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.rtsVocaCoreFactory");




sap.rules.ui.parser.resources.vocabulary.lib.rtsVocaInitiator = sap.rules.ui.parser.resources.vocabulary.lib.rtsVocaInitiator|| {}; 
sap.rules.ui.parser.resources.vocabulary.lib.rtsVocaInitiator.lib = (function() {
	
	var rtsContextFactory = sap.rules.ui.parser.resources.vocabulary.lib.rtsVocaContextFactory.lib;
	var rtsContextFactoryLib = new  rtsContextFactory.rtsContextFactoryLib();
	var vocaRuntimeServicesFactory = sap.rules.ui.parser.resources.vocabulary.lib.rtsVocaCoreFactory.lib;
	var runtimeServicesLib = new vocaRuntimeServicesFactory.rtsVocaCoreFactoryLib();
	
	
	function rtsVocaInitiatorLib() {
		//Constructor to enable usage of public method on the client side.
		//This mechanism was used in HRF to enable association to corresponding namespace in the client side.
	}

	
	
	/*
	 * This method will create and init an instance of Vocabulary Runtime Services object and return it to the caller.
	 * input params: 
	 * 		inputParamObj - object like: 
	 *          { “connection” : “<optional>”, “resourceID” : “<optional>”, “vocaLoadingType” : “<str=hana/hybrid/json>”, “resourceContent” : “<JsonObject>”}.
	 * returns: instance of Vocabulary Runtime Services object.
	 */
	rtsVocaInitiatorLib.prototype.init = function(inputParamObj){
		
		var context;
		//Init corresponding context Object
		context = rtsContextFactoryLib.getRTSContext(inputParamObj);
		//Init core object
		return runtimeServicesLib.getVocabularyRuntimeServices(context);
		
	};
	
	return {
		rtsVocaInitiatorLib: rtsVocaInitiatorLib
	}; 
	
}());


