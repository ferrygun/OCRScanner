jQuery.sap.declare("sap.rules.ui.parser.resources.common.lib.oDataHandler");

/*******************************************************************************
 * Exposed object
 *******************************************************************************/
sap.rules.ui.parser.resources.common.lib.oDataHandler = sap.rules.ui.parser.resources.common.lib.oDataHandler|| {}; 
sap.rules.ui.parser.resources.common.lib.oDataHandler.lib = (function() {

	// Exposed Object to be returned
	var exposedObject = {};

	/*******************************************************************************
	 * Expose oData properties constants
	 *******************************************************************************/
	exposedObject.PROPERTY_NAME_ID = "Id";
	exposedObject.PROPERTY_NAME_NAME = "Name";
	exposedObject.PROPERTY_NAME_DESCRIPTION = "Description";
	exposedObject.PROPERTY_NAME_REL_VERSION = "ExpressionLanguageVersion";
	exposedObject.PROPERTY_NAME_RULE_FORMAT = "RuleFormat";
	exposedObject.PROPERTY_NAME_TYPE = "Type";
	exposedObject.PROPERTY_NAME_HIT_POLICY = "HitPolicy";
	exposedObject.PROPERTY_NAME_DECISION_TABLE = "DecisionTable";
	exposedObject.PROPERTY_NAME_RESULT_DO_NAME = "ResultDataObjectName";
	exposedObject.PROPERTY_NAME_DT_COLUMNS = "DecisionTableColumns";
	exposedObject.PROPERTY_NAME_DDT_ROWS = "DecisionTableRows";
	exposedObject.PROPERTY_NAME_CONDITION = "Condition";
	exposedObject.PROPERTY_NAME_EXPRESSION = "Expression";
	exposedObject.PROPERTY_NAME_FIXED_OPERATOR = "FixedOperator";
	exposedObject.PROPERTY_NAME_RESULT = "Result";
	exposedObject.PROPERTY_NAME_BUSINESS_DATA_TYPE = "BusinessDataType";
	exposedObject.PROPERTY_NAME_VALUE_HELPS = "ValueHelps" ;
	exposedObject.PROPERTY_NAME_VALUE_HELP_ID = "ValueHelpId";
	exposedObject.PROPERTY_NAME_SERVICE_URL = "ServiceUrl";
	exposedObject.PROPERTY_NAME_PROPERTY_PATH = "PropertyPath";
	exposedObject.PROPERTY_NAME_TYPE = "Type";
	exposedObject.PROPERTY_NAME_SIZE = "Size";
	exposedObject.PROPERTY_NAME_DATA_TYPE = "DataType";
	exposedObject.PROPERTY_NAME_SIZE = "Size";
	exposedObject.PROPERTY_NAME_DO_ATTRIBUTE_NAME = "DataObjectAttributeName";
	//exposedObject.PROPERTY_NAME_IS_COLLECTION = "IsCollection";
	exposedObject.PROPERTY_NAME_MAPPING_INFO = "MappingInfo";
	exposedObject.PROPERTY_NAME_TARGET_DATA_OBJECT_ID = "TargetDataObjectId";
	exposedObject.PROPERTY_NAME_ATTRIBUTE_MAPPINGS = "AttributeMappings";
	exposedObject.PROPERTY_NAME_ATTRIBUTE_MAPPINGS_SOURCE = "Source";
	exposedObject.PROPERTY_NAME_ATTRIBUTE_MAPPINGS_TARGET = "Target";
	exposedObject.PROPERTY_NAME_SCHEMA = "Schema";
	exposedObject.PROPERTY_NAME_PARAMETERS = "Parameters";
	exposedObject.PROPERTY_NAME_COLUMN_ID = "ColId";
	exposedObject.PROPERTY_NAME_CONTENT = "Content";

	exposedObject.PROPERTY_NAME_CELLS = "Cells";
	exposedObject.PROPERTY_NAME_DATA_OBJECTS = "DataObjects";
	exposedObject.PROPERTY_NAME_DATA_OBJECT = "DataObject";
//voca rules
	exposedObject.PROPERTY_NAME_VOCABULARY_RULES = "Rules";
	exposedObject.PROPERTY_NAME_VOCABULARY_RULE = "Rule";
	exposedObject.PROPERTY_NAME_RESULTDOID = "resultDataObjectId";
	
	exposedObject.PROPERTY_NAME_USAGE = "Usage";
	exposedObject.PROPERTY_NAME_CARDINALITY = "Cardinality";
	exposedObject.PROPERTY_NAME_ATTRIBUTES = "Attributes";
	exposedObject.PROPERTY_NAME_ATTRIBUTE = "Attribute";
	exposedObject.PROPERTY_NAME_ASSOCIATIONS = "Associations";
	exposedObject.PROPERTY_NAME_ASSOCIATION = "Association";

	exposedObject.TYPE_CONDITION = "CONDITION";
	exposedObject.TYPE_RESULT = "RESULT";
	exposedObject.TYPE_DO = "DBCTX";
	exposedObject.TYPE_NONE = "NONE";

	exposedObject.SOURCE_TYPE_DATA = "Data";

	/*******************************************************************************
	 * oData Enums (not exposed - internal use)
	 *******************************************************************************/
	var ruleFormats = {
		"BASIC" : "basic",
		"ADVANCED" : "advanced"
	};
	var ruleTypes = {
		"DT" : "decisionTable"
		//"TR" : "ruleSet"
	};
	var hitPolicies = {
		"FM" : "firstMatch",
		"AM" : "allMatch"
	};
	var cardinalities = {
		"1..1" : "OneToOne",
		"1..n" : "OneToMany",
		"1-0..1" : "OneToZeroOrOne",
		"n..1" : "ManyToOne"
	};

	var validValuesMap = {};
	validValuesMap[exposedObject.PROPERTY_NAME_RULE_FORMAT] = ruleFormats;
	validValuesMap[exposedObject.PROPERTY_NAME_TYPE] = ruleTypes;
	validValuesMap[exposedObject.PROPERTY_NAME_HIT_POLICY] = hitPolicies;
	validValuesMap[exposedObject.PROPERTY_NAME_CARDINALITY] = cardinalities;

	/**
	 * Method: getOdataPropName - will check if the given Property exists in the given Object.
	 *         Assumption: the given property can exist in the given Object in one of the following formats:
	 *			  1) Starts with uppercase.	
	 *			  2) Starts with lowercase.
	 * output: the correct property name if exists in the given Object, otherwise null.
	 */
	function getOdataPropName(obj, propName) {
		var propNameWithLowercase;
		var propNameWithUppercase;
		var correctPropName = null;

		propNameWithLowercase = propName[0].toLowerCase() + propName.substring(1);
		propNameWithUppercase = propName[0].toUpperCase() + propName.substring(1);

		if (obj.hasOwnProperty(propNameWithLowercase)) {
			correctPropName = propNameWithLowercase;
		} else if (obj.hasOwnProperty(propNameWithUppercase)) {
			correctPropName = propNameWithUppercase;
		}

		return correctPropName;
	}

	/**
	 * This method returns the value of the given property, inside the given object, ignoring the case
	 * of the first letter of the property name
	 */
	function getOdataPropertyValue(obj, propName) {
		return obj[getOdataPropName(obj, propName)];
	}

	/**
	 * This method returns the internal model value of an Enum value taken from oData model
	 * If the property isn't a known Enum, null will be returned
	 */
	function getEnumPropertyValue(obj, propName) {
		if (!validValuesMap[propName]) {
			return null;
		}

		var realName = getOdataPropName(obj, propName);
		var oDataEnumValue = obj[realName];
		return validValuesMap[propName][oDataEnumValue];
	}

	/*******************************************************************************
	 * Expose oData relevant methods
	 ******************************************************************************/
	exposedObject.getEnumPropertyValue = getEnumPropertyValue;
	exposedObject.getOdataPropName = getOdataPropName;
	exposedObject.getOdataPropertyValue = getOdataPropertyValue;

	/*******************************************************************************
	 ******************************************************************************/
	return exposedObject;
}());