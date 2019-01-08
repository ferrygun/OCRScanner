jQuery.sap.declare("sap.rules.ui.parser.ruleBody.lib.constantsBase");

jQuery.sap.require("sap.rules.ui.parser.resources.dependencies.lib.constantsBase");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.constants");

sap.rules.ui.parser.ruleBody.lib.constantsBase = sap.rules.ui.parser.ruleBody.lib.constantsBase|| {}; 
sap.rules.ui.parser.ruleBody.lib.constantsBase.lib = ( function() {
	
	var dependenciesConstantsLib = sap.rules.ui.parser.resources.dependencies.lib.constantsBase.lib;
	var RelConstants = sap.rules.ui.parser.businessLanguage.lib.constants.lib;
	
	var consts = {
			
			//Enumerator for the output flags
			OUTPUT_FLAGS_ENUM : {
					validationOutput		: "validationOutput",
					unknownTokensOutput		: "unknownTokens", 
					dependenciesOutput		: dependenciesConstantsLib.PROPERTY_NAME_DEPENDENCIES_OUTPUT,
					isAlias					: "isAlias",
					reValidationAllowed		: "reValidationAllowed",
					conversionOutput		: "conversionOutput",
					rootObjectContextOutput : RelConstants.propertiesEnum.rootObjectContext,
					locale					: RelConstants.propertiesEnum.locale,
					termMode                : RelConstants.propertiesEnum.termMode,
					oDataOutput				: "oDataOutput",
					ASTOutput				: "ASTOutput"
				},
			
			//Enumerator for the output properties
			OUTPUT_PROPERTIES_ENUM : {
					unknownTokens		: "unknownTokens", 
					dependencies		: dependenciesConstantsLib.PROPERTY_NAME_DEPENDENCIES_OUTPUT,
					isCollection		: RelConstants.propertiesEnum.isCollection,
					rootObjectContext   : RelConstants.propertiesEnum.rootObjectContext,
					decisionTableData	: "decisionTableData"
				},
			
			//Enumerator for the output properties of decisionTableData 
			DT_DATA_OUTPUT_PROPERTIES_ENUM : {
					parserResults : 'parserResults'
			}
	};
	

	return consts;
}
());