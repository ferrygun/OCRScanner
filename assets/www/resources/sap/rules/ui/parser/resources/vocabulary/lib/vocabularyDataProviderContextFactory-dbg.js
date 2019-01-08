jQuery.sap.declare("sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderContextFactory");

jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.constants");
	
	

sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderContextFactory = sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderContextFactory|| {}; 
sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderContextFactory.lib = (function() {

	var vocabularyConstants = sap.rules.ui.parser.resources.vocabulary.lib.constants.lib;
	
	
	function vocaDataProviderContextFactoryLib() {
		//Constructor to enable usage of public method on the client side.
		//This mechanism was used in HRF to enable association to corresponding namespace in the client side.
	}
	
	
	//private methods
	function getRTSContextJSON(inputParamObj){	
		
		jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderJSONContext");
		var vocabularyDataProviderJSONContext = sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderJSONContext.lib;
		
		var rtsContextJSONInstance = new vocabularyDataProviderJSONContext.vocaDataProviderJSONContextLib(inputParamObj.resourceContent, inputParamObj.resourceID, inputParamObj.termModes);
		return rtsContextJSONInstance;
	}

	
	function getRTSContextHANA(inputParamObj){			

		jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.serverDBRTContext");
		var rtsContextHANALib = sap.rules.ui.parser.resources.vocabulary.lib.serverDBRTContext;
		
		var rtsContextHANAInstance = new rtsContextHANALib.ServerVocaRTContext(inputParamObj.connection);
		return rtsContextHANAInstance; 
	}


	function getRTSContextHybrid(inputParamObj){			

		jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.serverJSONandDBRTcontext");
		var rtsContextHYBRIDLib = sap.rules.ui.parser.resources.vocabulary.lib.serverJSONandDBRTcontext;
		
		var rtsContextHybridInstance = new rtsContextHYBRIDLib.ServerVocaDBandJsonRTContext(inputParamObj.connection, inputParamObj.resourceContent, inputParamObj.resourceID, inputParamObj.isThisPrivateVoca, inputParamObj.versionId);
		return rtsContextHybridInstance; 
	}

	
	vocaDataProviderContextFactoryLib.prototype.getRTSContext = function (inputParamObj) {
		var context = null;
		
		switch (inputParamObj.vocaLoadingType) {
		case vocabularyConstants.vocaContextTypeEnum.JSON:
			context = getRTSContextJSON(inputParamObj); 
			break;
		case vocabularyConstants.vocaContextTypeEnum.HANA:
			context = getRTSContextHANA(inputParamObj);  
			break;
		case vocabularyConstants.vocaContextTypeEnum.HYBRID:
			context = getRTSContextHybrid(inputParamObj); 
			break;
		}
		return context;
	};
	
	return {
		vocaDataProviderContextFactoryLib: vocaDataProviderContextFactoryLib
	}; 
	
}());


