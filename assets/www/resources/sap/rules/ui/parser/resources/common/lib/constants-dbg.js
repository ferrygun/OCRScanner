jQuery.sap.declare("sap.rules.ui.parser.resources.common.lib.constants");

jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.constants");


sap.rules.ui.parser.resources.common.lib.constants = sap.rules.ui.parser.resources.common.lib.constants|| {}; 
sap.rules.ui.parser.resources.common.lib.constants.lib = (function() {

	var blConstantsLib = sap.rules.ui.parser.businessLanguage.lib.constants.lib;
	
	var consts = {};
	
	//HRF Resource Types:
	consts.VOCABULARY = 'vocabulary';
	consts.RULE = 'rule';
	consts.RULE_TEMPLATE = 'ruleTemplate';
	consts.RULE_SERVICE = 'ruleService';
	
	//Enumerator for validation flags
	consts.validationFlagsEnum = {
		collectDependencies: "collectDependencies",
		convertResource:"convertResource"
	};
	
	// Enumerator for value list conversion
	consts.convertResourceEnum = blConstantsLib.conversionOutputEnum;
	
	//Extensions
	consts.RULE_EXTENSION = "hrfrule";
	consts.RULE_TEMPLATE_EXTENSION = "hrfruletemplate";
	consts.RULE_SERVICE_EXTENSION = "hrfruleservice";
	consts.VOCABULARY_EXTENSION = "hrfvocabulary";
	consts.RULE_HPR_EXTENSION = "hprrule";
	consts.RULE_TEMPLATE_HPR_EXTENSION = "hprruletemplate";
	consts.RULE_SERVICE_HPR_EXTENSION = "hprruleservice";
	consts.VOCABULARY_HPR_EXTENSION = "hprvocabulary";
	consts.RULE_SERVICE_EMBEDDED = "embedded_service";
	
	// Properties
	consts.PROPERTY_NAME_CHANGE_MODE= 'changeMode';
	consts.PROPERTY_NAME_OBJ_DATA= 'objectData';
	consts.PROPERTY_NAME_NEW = 'new';
	consts.PROPERTY_NAME_OLD = 'old';
	consts.PROPERTY_NAME_PACKAGE = "package";
	consts.PROPERTY_NAME_NAME = "name";
	consts.PROPERTY_NAME_SUFFIX = "suffix";
	consts.PROPERTY_NAME_OBJECT_ID = "objectId";
	consts.PROPERTY_NAME_CONTENT = "content";
	consts.PROPERTY_NAME_VERSION_ID = "versionId";
	consts.PROPERTY_NAME_CONVERSION_FLAGS_MAP= 'conversionFlagsMap';
	consts.PROPERTY_NAME_IS_VALUE_LIST_CONVERTED= 'isValueListConverted';
	consts.PROPERTY_NAME_ACIVATION_FLAG="activationFlag";
	// Columns
	consts.COL_VALUE_LIST_CONVERTED = 'VALUE_LIST_CONVERTED';
	
	
	return consts;

}());
