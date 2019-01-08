jQuery.sap.declare("sap.rules.ui.parser.resources.vocabulary.lib.constants");

/*******************************************************************************
* Import relevant libraries
******************************************************************************/

jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.constantsBase");

/*******************************************************************************
 * Tables 
******************************************************************************/
sap.rules.ui.parser.resources.vocabulary.lib.constants = sap.rules.ui.parser.resources.vocabulary.lib.constants|| {}; 
sap.rules.ui.parser.resources.vocabulary.lib.constants.lib = (function() {
	
	var constantsBase = sap.rules.ui.parser.resources.vocabulary.lib.constantsBase.lib;
	
	var consts = {
		//General
		
		 TABLE_VOCABULARY             : "sap.rules.ui.parser.resources.vocabulary.model::VOCABULARY",
		 TABLE_OM                     : "sap.rules.ui.parser.resources.vocabulary.model::OM",
		 TABLE_OM_ATTRIBUTE           : "sap.rules.ui.parser.resources.vocabulary.model::OM_ATTR",
		 TABLE_OM_ASSOCIATION         : "sap.rules.ui.parser.resources.vocabulary.model::OM_ASSOC",
		 TABLE_OM_ASSOCIATION_ATTR    : "sap.rules.ui.parser.resources.vocabulary.model::OM_ASSOC_ATTR",
		
		 TABLE_ACTION                 : "sap.rules.ui.parser.resources.vocabulary.model::ACTION",
		 TABLE_ACTION_STATIC_PARAM    : "sap.rules.ui.parser.resources.vocabulary.model::ACTION_STATIC_PARAM",
		 TABLE_ACTION_INPUT_PARAM     : "sap.rules.ui.parser.resources.vocabulary.model::ACTION_INPUT_PARAM",
		
		 TABLE_OUTPUT                 : "sap.rules.ui.parser.resources.vocabulary.model::OUTPUT",
		 TABLE_OUTPUT_STATIC_PARAM    : "sap.rules.ui.parser.resources.vocabulary.model::OUTPUT_STATIC_PARAM",
		 TABLE_OUTPUT_PARAM           : "sap.rules.ui.parser.resources.vocabulary.model::OUTPUT_PARAM",
		 TABLE_ALIAS                  : "sap.rules.ui.parser.resources.vocabulary.model::ALIAS",
		 TABLE_VALUE_LIST             : "sap.rules.ui.parser.resources.vocabulary.model::VALUE_LIST",
		 TABLE_VOCABULARY_DEPENDECIES : "sap.rules.ui.parser.resources.vocabulary.model::VOCABULARY_DEPENDENCIES",
		 TABLE_TERM				      : "sap.rules.ui.parser.resources.vocabulary.model::TERM",
		 TABLE_TERM_MODIFIER		  : "sap.rules.ui.parser.resources.vocabulary.model::TERM_MODIFIER",
		 TABLE_ADVANCED_FUNCTION       : "sap.rules.ui.parser.resources.vocabulary.model::ADVANCED_FUNCTION",
		
		/*******************************************************************************
		 * Tables columns
		******************************************************************************/
		
		//Common column names
		 COL_ID                 : "ID",
		 COL_TARGET             : "TARGET",
		 COL_PATH_FULL_NAME     : "PATH_FULL_NAME",
		 COL_PACKAGE            : "PACKAGE",
		 COL_NAME               : "NAME",
		 COL_SUFFIX			 	: "SUFFIX",
		 COL_SCOPE              : "SCOPE", 
		 COL_VERSION_ID         : "VERSION_ID",
		 COL_OM_ID              : "OM_ID",
		 COL_DESCRIPTION        : "DESCRIPTION",
		 COL_RUNTIME_NAME       : "RUNTIME_NAME",
		 COL_ACTION_ID          : "ACTION_ID",
		 COL_MAPPING            : "MAPPING",
		 COL_BUSINESS_DATA_TYPE : "BUSINESS_DATA_TYPE",
		 COL_DATA_TYPE          : "DATA_TYPE",
		 COL_SIZE               : "SIZE",
		 COL_VOCA_ID            : "VOCABULARY_ID",
		 COL_OUTPUT_ID          : "OUTPUT_ID",
		 COL_SINGLE_CONSUMPTION : "SINGLE_CONSUMPTION",
		 COL_IS_COLLECTION      : "IS_COLLECTION",
		
		//VOCABULARY table column names
		 VOCABULARY_COL_PATH_FULL_NAME : "PATH_FULL_NAME",
		 VOCABULARY_COL_IS_WRITABLE    : "IS_WRITABLE",
		
		 VOCABULARY_COL_IS_PRIVATE     : "IS_PRIVATE",
		 VOCABULARY_COL_IS_VALUE_LIST_CONVERTED : "IS_VALUE_LIST_CONVERTED",
		 VOCABULARY_COL_VERSION_ID	  : "VERSION_ID",
		
		//OM table column names
		 OM_COL_RUNTIME_TYPE   : "RUNTIME_TYPE",
		 OM_COL_RUNTIME_SCHEMA : "RUNTIME_SCHEMA",
		 OM_COL_VOCABULARY_ID  : "VOCABULARY_ID",
		
		//OM attribute table column names
		 OM_ATTR_COL_SOURCE_TYPE        : "SOURCE_TYPE",
		 OM_ATTR_COL_VALUE_LIST_ID      : "VALUE_LIST_ID",
		
		//OM association table column names
		 OM_ASSOC_COL_CARDINALITY : "CARDINALITY",
		
		//OM association attributes table column names
		 OM_ASSOC_ATTR_COL_ASSOC_ID : "ASSOC_ID",
		 OM_ASSOC_ATTR_COL_SOURCE   : "SOURCE",
		
		//ACTION  table column names
		 ACTION_COL_LIB_PATH         : "LIB_PATH",
		 ACTION_COL_LIB_NAME         : "LIB_NAME",
		 
		
		//ALIAS table column names
		 ALIAS_COL_CONTENT            : "CONTENT",
		 ALIAS_COL_TYPE               : "TYPE",
		 ALIAS_COL_EXTERNAL_METADATA  : "EXTERNAL_METADATA",
		 ALIAS_COL_RENDERING_DATA     : "RENDERING_DATA",
		 
		//TERM table column names
		 TERM_COL_EXPRESSION             : "EXPRESSION",
		 TERM_COL_IS_CONDITIONAL_CONTEXT : "IS_CONDITIONAL_CONTEXT",
		 TERM_COL_CONTEXT                : "CONTEXT",
		 TERM_COL_IS_DEPRECATED			 : "IS_DEPRECATED",
		 
		//TERM_MODIFIER table column names
		 TERM_MODIFIER_COL_MODIFIER		 : "MODIFIER",
		 TERM_MODIFIER_COL_TERM_ID		 : "TERM_ID",	 
		 
		//VALUE_LIST table column names
		 VALUE_LIST_COL_RUNTIME_TYPE       : "RUNTIME_TYPE",
		 VALUE_LIST_COL_RUNTIME_SCHEMA     : "RUNTIME_SCHEMA",
		 VALUE_LIST_COL_VALUE_COLUMN       : "VALUE_COLUMN",
		 VALUE_LIST_COL_DESCRIPTION_COLUMN : "DESCRIPTION_COLUMN",
		
		//VOCABULARY_DEPENDECIES table column names
		 VOCABULARY_DEPENDECIES_COL_VOCABULARY : "VOCABULARY",
		 VOCABULARY_DEPENDECIES_COL_DEPENDS_ON : "DEPENDS_ON",
		
		//ADVANCED_FUNCTION table column names
		 ADVANCED_FUNCTION_COL_NAME  :  "NAME", 
		 
		//M_SCHEMA_MAPPING table column names
		 PHYSICAL_SCHEMA						: "PHYSICAL_SCHEMA",
		 AUTHORING_SCHEMA					: "AUTHORING_SCHEMA",
		
		
		/*******************************************************************************
		 * JSON properties
		******************************************************************************/
		
		//General properties
		 PROPERTY_NAME_DESCRIPTION        : "description",
		 PROPERTY_NAME_IS_VOCABULARY_RULE : "isVocaRule",
		 PROPERTY_NAME_ATTRIBUTES         : constantsBase.PROPERTY_NAME_ATTRIBUTES,
		 PROPERTY_NAME_TARGET             :  "target",
		 PROPERTY_NAME_NAME               :  "name",
		 PROPERTY_NAME_TYPE               :  'type',
		 PROPERTY_NAME_DATA_TYPE          : "dataType",
		 PROPERTY_NAME_SIZE               : "size",
		 PROPERTY_NAME_BUSINESS_DATA_TYPE : "businessDataType",
		 PROPERTY_NAME_ID                 : "ID",
		 PROPERTY_NAME_PARENT_ID          : "PARENT_ID",
		 PROPERTY_NAME_INPUT_TYPE         : "INPUT.TYPE",
		 PROPERTY_NAME_COLLECTION         : "Collection",
		 PROPERTY_NAME_STRUCTURE          : "Structure",
		 PROPERTY_NAME_STATIC_PARAMS      : "staticParams",
		 PROPERTY_NAME_INPUT_PARAMS       : "inputParams",
		 PROPERTY_NAME_MAPPING            : "mapping",
		 PROPERTY_NAME_DEPENDENCY 		  : "dependsOn",
		 PROPERTY_NAME_PACKAGE    		  : "package",
		 PROPERTY_NAME_IS_COLLECTION	  : "isCollection",
		// Vocabulary properties
		 PROPERTY_NAME_VOCABULARY_SCOPE : 'scope',
		 PROPERTY_NAME_IS_WRITABLE      : 'isDefaultWritableFromApp',
		 PROPERTY_NAME_DATA_OBJECTS     : constantsBase.PROPERTY_NAME_DATA_OBJECTS,
		 PROPERTY_NAME_ACTIONS          : 'actions',
		 PROPERTY_NAME_OUTPUTS          : 'outputs',
		 PROPERTY_NAME_VOCA_RULES_OUTPUTS :   'vocaRulesOutputs',
		 PROPERTY_NAME_ALIASES          : constantsBase.PROPERTY_NAME_ALIASES,
		 PROPERTY_NAME_VALUE_LISTS      : 'valueLists',
		 PROPERTY_NAME_VALUE_LIST       : 'valueList',
		 PROPERTY_NAME_ADVANCED_FUNCTION : 'advancedFunctions',
		 PROPERTY_NAME_CONVERSION_FLAGS : 'conversionFlagsMap',
		 PROPERTY_NAME_IS_VALUE_LIST_CONVERTED : 'isValueListConverted',
		 
		//Object model properties
		 PROPERTY_NAME_OM_ASSOCIATIONS : constantsBase.PROPERTY_NAME_OM_ASSOCIATIONS,
		 PROPERTY_NAME_OM_MAPPING_INFO : 'mappingInfo',
		
		//Object model mapping info properties
		 PROPERTY_NAME_OM_MAPPING_INFO_SCHEMA : 'schema',
		 PROPERTY_NAME_OM_MAPPING_INFO_PARAMETERS : 'parameters',
		 PROPERTY_NAME_OM_MAPPING_INFO_PARAMETERS_FILTERS : 'filters',
		 PROPERTY_NAME_OM_MAPPING_INFO_PARAMETERS_INPUT : 'input',
		 
		
		//Object model attributes properties
		 PROPERTY_NAME_OM_ATTR_SOURCE_TYPE        : "sourceType",
		 PROPERTY_NAME_OM_ATTR_DATA_MAPPING       : "dataMapping",
		 
		//Object model attributes data mapping properties
		 PROPERTY_NAME_OM_ATTR_DATA_MAPPING_COLUMN : "column",
		
		//Object model associations properties
		 PROPERTY_NAME_OM_ASSOC_CARDINALITY   : 'cardinality',
		 PROPERTY_NAME_OM_ASSOC_ATTR_MAPPINGS : 'attributeMappings',
		
		//Object model associations attribute mappings properties
		 PROPERTY_NAME_OM_ASSOC_ATTR_MAPPINGS_SOURCE : "source",
		 
		 //object model mapping info types
		 MAPPINGS_INFO_TYPE_VIEW             : "View",
		 MAPPINGS_INFO_TYPE_TABLE            : "Table",
		 MAPPINGS_INFO_TYPE_ANALYTIC_VIEW    : "AnalyticView",
		 MAPPINGS_INFO_TYPE_ATTRIBUTE_VIEW   : "AttributeView",
		 MAPPINGS_INFO_TYPE_CALCULATION_VIEW : "CalculationView",
		 MAPPINGS_INFO_TYPE_TABLE_FUNCTION 	 : "TableFunction",
		
		//Action properties
		 PROPERTY_NAME_ACTION_RUNTIME_EXE   : "runtimeExecutable",
		 PROPERTY_NAME_ACTION_LIB_PATH      : "path",
		
		//Alias properties
		 PROPERTY_NAME_ALIAS_CONTENT : "content",
		 PROPERTY_NAME_ALIAS_EXTERNAL_METADATA : "externalMetadata",
		 PROPERTY_NAME_ALIAS_RENDERING_DATA    : "renderingData",
		
		
		//Dependecies properties
		 PROPERTY_NAME_DEPENDS_ON_SUFFIX  : "suffix",
		 PROPERTY_NAME_CATALOG_RUNTIME_SUFFIX : "__DT_CATALOG_OBJECT__",
		 
		 
		/*******************************************************************************
		* Maps flat property names to column names
		******************************************************************************/
		
		//Vocabulary properties
		 PROPS_TO_COLS : {},
		
		 PROPS_TO_MAPPING_INFO_COLS : {},
		
		//JSON properties to OM attribute table columns
		 PROPS_TO_OM_ATTR_COLS : {},
		
		 PROPS_TO_OM_ATTR_DATA_MAPPING_COLS : {},
		
		//JSON properties to OM association table columns
		 PROPS_TO_OM_ASSOC_COLS : {},
		
		//JSON properties to OM association attributes table columns
		 PROPS_TO_OM_ASSOC_ATTRIBUTE_MAPPINGS_COLS : {},
		
		//JSON properties to ACTION table columns
		 PROPS_TO_ACTION_MAPPINGS_COLS : {},
		
		 PROPS_TO_ACTION_RUNTIME_EXE_MAPPINGS_COLS : {},
		
		//JSON properties to ACTION static param table columns
		 PROPS_TO_ACTION_STATIC_PARAM_MAPPINGS_COLS : {},
		
		
		//JSON properties to ACTION input param table columns
		 PROPS_TO_ACTION_INPUT_PARAM_MAPPINGS_COLS : {},
		
		
		//JSON properties to OUTPUT table columns
		 PROPS_TO_OUTPUT_MAPPINGS_COLS : {},
		
		//JSON properties to OUTPUT static parameters table columns
		 PROPS_TO_OUTPUT_STATIC_PARAM_MAPPINGS_COLS : {},
		
		//JSON properties to OUTPUT parameter table columns
		 PROPS_TO_OUTPUT_PARAM_MAPPINGS_COLS : {},
		 
		//JSON properties to ADVANCED_FUNCTION parameter table columns
		 PROPS_TO_ADVANCED_FUNCTION_COLS : {},
		
		
		//HRF defined data model
		 DO_RULE_TEMPLATE : 'ruleTemplate',
		 DO_RULE          : 'rule',
		 DO_VOCABULARY    : 'vocabulary',
		
		 ATT_ID                 : 'id',
		 ATT_PACKAGE            : 'package',
		 ATT_NAME               : 'name',
		 ATT_DESC               : 'description',
		 ATT_VOCABULARY         : 'vocabulary',
		 ATT_OUTPUT             : 'output',
		 ATT_SINGLE_CONSUMPTION : 'singleConsumption',
		 ATT_MANUAL_ASSIGNMENT  : 'manualAssignment',
		
		 ATT_RULE__TEMPLATE_ID : 'ruleTemplateId',
		 ATT_RULE__VOCABULARY  : 'vocabulary',
		 ATT_RULE__STATUS      : 'status',
		 ATT_RULE__BODY        : 'body',
		
		 ASSOC_VOCABULARY      : 'vocabulary',
		
		 ATT_VOCA_SCOPE        : 'scope',
		 ATT_VOCA_FULL_NAME    : "vocaFullName",
		
		/*******************************************************************************
		* constants for vocabulary - API
		******************************************************************************/
		
		 GLOBAL  : "Global",
		 PUBLIC  : "Public",
		 PRIVATE : "Private",
		 ALL     : "All",
		
		
		 HRF_MODEL : 'HM',
		 OM_SOURCE : 'OM',
		 RULE_TEMPLATE : 'RT',
		
		/*******************************************************************************
		* constants for parameterRuntimeServices
		******************************************************************************/
		
		 CARDINALITY_ONE_TO_MANY        : 'OneToMany',
		 CARDINALITY_MANY_TO_ONE        : 'ManyToOne',
		 CARDINALITY_ONE_TO_ONE         : 'OneToOne',
		 CARDINALITY_ONE_TO_ZERO_OR_ONE : 'OneToZeroOrOne',
		
		/*******************************************************************************
		* enums for alias type
		******************************************************************************/
		
		 ALIAS_CONTENT_EXPRESSION     : 'expression',
		 ALIAS_CONTENT_DECISION_TABLE : constantsBase.ALIAS_CONTENT_DECISION_TABLE,
		
		/*******************************************************************************
		* constants for aliasMap
		*******************************************************************************/
		 IS_CREATED : 'isCreated',
		 
		
		 DATA_TYPE_COLLECTION : constantsBase.DATA_TYPE_COLLECTION,
		 DATA_TYPE_STRUCTURE : constantsBase.DATA_TYPE_STRUCTURE,
		 DATA_TYPE_DATAOBJECT : constantsBase.DATA_TYPE_DATAOBJECT,
		
		/*******************************************************************************
		 * constants for valueList
		 *******************************************************************************/
		INTERNAL_VALUE_LIST :  constantsBase.INTERNAL_VALUE_LIST,
		EXTERNAL_VALUE_LIST :  constantsBase.EXTERNAL_VALUE_LIST,

		/*******************************************************************************
		* constants for terms reserved words
		*******************************************************************************/
		
		 TERM_AN_STRING     : 'an ',
		 TERM_A_STRING      : 'a ',
		 TERM_ALL_STRING    : 'all ',
		 TERM_OF_STRING     : ' of ',
		 TERM_THE_STRING    : 'the ',
		 TERM_OF_THE_STRING : ' of the ',
		 TERM_IS_STRING     : ' is ',
		 TERM_IS_NOT_STRING     : " is not ",
		 TERM_CURRENT_STRING    : 'current ',

		/*******************************************************************************
		* constants for term modifier
		*******************************************************************************/
		
		 TERM_MODIFIER_ALL     : 'all',
		 TERM_MODIFIER_NOT     : 'not',
		 TERM_MODIFIER_CURRENT     : 'current',
		 
		/*******************************************************************************
		* constants for value lists
		*******************************************************************************/
		 VALUE_LIST_VALUES     : "values",
		 PROPERTY_VALUE_LIST_DESCRIPTION_COLUMN  : "descriptionColumn",
		 PROPERTY_VALUE_LIST_VALUE_COLUMN  : "valueColumn",
		 PROPERTY_VALUE_LIST_MAPPING_INFO : 'mappingInfo',
		 PROPERTY_VALUE_LIST_SCHEMA : 'schema',
		 PROPERTY_VALUE_LIST_RUNTIME_NAME : 'runtimeName',
		 PROPERTY_VALUE_LIST_SOURCE_CONTENT : 'sourceContent',
		 PROPERTY_VALUE_LIST_NAME : 'name',
		 PROPERTY_VALUE_LIST_TYPE : 'type',
		 PROPERTY_VALUE_LIST_METADATA : 'metadata',
		
		
		
		/*******************************************************************************
		* Business Data Types
		*******************************************************************************/
		 BUSINESS_DATA_TYPE_BOOLEAN : 'Boolean',
		 
		
		 
		 /*******************************************************************************
		* enumeration for partial runtime services refresh
		*******************************************************************************/
		 PARTIAL_REFRESH : {
			 ALIASES : 'Aliases'
		 },	
		 
		 /*******************************************************************************
		 * Constants for vocabularyHandler
		 *******************************************************************************/
		 TO_KEYS : 'toKeys',
		 TO_DESCRIPTIONS : 'toDescriptions', 
		 CONVERSION_STATUS_SUCCESS : 'Success',
		 CONTENT_IS_EXPRESSION     : 'expression',
		 CONTENT_IS_TABLE     : constantsBase.ALIAS_CONTENT_DECISION_TABLE,
		 
		 /*******************************************************************************
		 * Enumerator for context type
		 *******************************************************************************/
		 vocaContextTypeEnum : {
			HANA : "hana",
			HYBRID :"hybrid",
			JSON : "json"
		},
		
		 parameterType : {
				FILTER : "filter",
				INPUT  : "input"
			}
	};
	
	 
	 
	 
	 
	 
	 
	 
	 
	//VOCABULARY table column names
	 consts.VOCABULARY_COL_ID             = consts.COL_ID;
	 consts.VOCABULARY_COL_PACKAGE        = consts.COL_PACKAGE;
	 consts.VOCABULARY_COL_NAME           = consts.COL_NAME;
	 consts.VOCABULARY_COL_SUFFIX		   = consts.COL_SUFFIX;
	 consts.VOCABULARY_COL_SCOPE          = consts.COL_SCOPE;
	
	//OM table column names
	 consts.OM_COL_ID             = consts.COL_ID;
	 consts.OM_COL_NAME           = consts.COL_NAME;
	 consts.OM_COL_DESCRIPTION    = consts.COL_DESCRIPTION;
	 consts.OM_COL_RUNTIME_NAME   = consts.COL_RUNTIME_NAME;
	 
	//OM attribute table column names
	 consts.OM_ATTR_COL_ID                 = consts.COL_ID;
	 consts.OM_ATTR_COL_OM_ID              = consts.COL_OM_ID;
	 consts.OM_ATTR_COL_NAME               = consts.COL_NAME;
	 consts.OM_ATTR_COL_RUNTIME_NAME       = consts.COL_RUNTIME_NAME;
	 consts.OM_ATTR_COL_DESCRITION         = consts.COL_DESCRIPTION;
	 consts.OM_ATTR_COL_DATA_TYPE          = consts.COL_DATA_TYPE;
	 consts.OM_ATTR_COL_SIZE               = consts.COL_SIZE;
	 consts.OM_ATTR_COL_BUSINESS_DATA_TYPE = consts.COL_BUSINESS_DATA_TYPE;
	 
	//OM association table column names
	 consts.OM_ASSOC_COL_ID          = consts.COL_ID;
	 consts.OM_ASSOC_COL_OM_ID       = consts.COL_OM_ID;
	 consts.OM_ASSOC_COL_NAME        = consts.COL_NAME;
	 consts.OM_ASSOC_COL_TARGET      = consts.COL_TARGET;
	 
	//OM association attributes table column names
	 consts.OM_ASSOC_ATTR_COL_ID       = consts.COL_ID;
	 consts.OM_ASSOC_ATTR_COL_OM_ID    = consts.COL_OM_ID;
	 consts.OM_ASSOC_ATTR_COL_TARGET   = consts.COL_TARGET;
	
	//ACTION  table column names
	 consts.ACTION_COL_ID               = consts.COL_ID;
	 consts.ACTION_COL_NAME             = consts.COL_NAME;
	 consts.ACTION_COL_DESCRIPTION      = consts.COL_DESCRIPTION;
	 consts.ACTION_COL_VOCABULARY_ID    = consts.COL_VOCA_ID;
	
	//ACTION_STATIC_PARAM  table column names
	 consts.ACTION_STATIC_PARAM_COL_ID         = consts.COL_ID;
	 consts.ACTION_STATIC_PARAM_COL_ACTION_ID  = consts.COL_ACTION_ID;
	 consts.ACTION_STATIC_PARAM_COL_NAME       = consts.COL_NAME;
	 consts.ACTION_STATIC_PARAM_COL_MAPPING    = consts.COL_MAPPING;
	
	//ACTION_INPUT_PARAM  table column names
	 consts.ACTION_INPUT_PARAM_COL_ID                 = consts.COL_ID;
	 consts.ACTION_INPUT_PARAM_COL_ACTION_ID          = consts.COL_ACTION_ID;
	 consts.ACTION_INPUT_PARAM_COL_NAME               = consts.COL_NAME;
	 consts.ACTION_INPUT_PARAM_COL_DATA_TYPE          = consts.COL_DATA_TYPE;
	 consts.ACTION_INPUT_PARAM_COL_SIZE               = consts.COL_SIZE;
	 consts.ACTION_INPUT_PARAM_COL_BUSINESS_DATA_TYPE = consts.COL_BUSINESS_DATA_TYPE;
	
	//OUTPUT  table column names
	 consts.OUTPUT_COL_ID               = consts.COL_ID;
	 consts.OUTPUT_COL_NAME             = consts.COL_NAME;
	 consts.OUTPUT_COL_DESCRIPTION      = consts.COL_DESCRIPTION;
	 consts.OUTPUT_COL_VOCABULARY_ID    = consts.COL_VOCA_ID;
	
	//OUTPUT_STATIC_PARAM  table column names
	 consts.OUTPUT_STATIC_PARAM_COL_ID         = consts.COL_ID;
	 consts.OUTPUT_STATIC_PARAM_COL_OUTPUT_ID  = consts.COL_OUTPUT_ID;
	 consts.OUTPUT_STATIC_PARAM_COL_NAME       = consts.COL_NAME;
	 consts.OUTPUT_STATIC_PARAM_COL_MAPPING    = consts.COL_MAPPING;
	
	
	//OUTPUT_PARAM  table column names
	 consts.OUTPUT_PARAM_COL_ID                 = consts.COL_ID;
	 consts.OUTPUT_PARAM_COL_OUTPUT_ID          = consts.COL_OUTPUT_ID;
	 consts.OUTPUT_PARAM_COL_NAME               = consts.COL_NAME;
	 consts.OUTPUT_PARAM_COL_DATA_TYPE          = consts.COL_DATA_TYPE;
	 consts.OUTPUT_PARAM_COL_SIZE               = consts.COL_SIZE;
	 consts.OUTPUT_PARAM_COL_BUSINESS_DATA_TYPE = consts.COL_BUSINESS_DATA_TYPE;
	 consts.OUTPUT_PARAM_COL_IS_COLLECTION 		= consts.COL_IS_COLLECTION;
	
	
	//ALIAS table column names
	 consts.ALIAS_COL_ID                 = consts.COL_ID;
	 consts.ALIAS_COL_NAME               = consts.COL_NAME;
	 consts.ALIAS_COL_BUSINESS_DATA_TYPE = consts.COL_BUSINESS_DATA_TYPE;
	 consts.ALIAS_COL_IS_COLLECTION      = consts.COL_IS_COLLECTION;
	 consts.ALIAS_COL_VOCABULARY_ID      = consts.COL_VOCA_ID;
	 consts.ALIAS_COL_DESCRIPTION        = consts.COL_DESCRIPTION;
	
	//TERM table column names
	 consts.TERM_COL_ID                     = consts.COL_ID;
	 consts.TERM_COL_DESCRIPTION            = consts.COL_DESCRIPTION;
	 consts.TERM_COL_BUSINESS_DATA_TYPE     = consts.COL_BUSINESS_DATA_TYPE;
	 consts.TERM_COL_IS_COLLECTION          = consts.COL_IS_COLLECTION;
	 consts.TERM_COL_VOCABULARY_ID          = consts.COL_VOCA_ID;
	
	//VALUE_LIST table column names
	 consts.VALUE_LIST_COL_ID                 = consts.COL_ID;
	 consts.VALUE_LIST_NAME                   = consts.COL_NAME;
	 consts.VALUE_LIST_COL_BUSINESS_DATA_TYPE = consts.COL_BUSINESS_DATA_TYPE;
	 consts.VALUE_LIST_COL_DATA_TYPE          = consts.COL_DATA_TYPE;
	 consts.VALUE_LIST_COL_SIZE               = consts.COL_SIZE;
	 consts.VALUE_LIST_COL_VOCABULARY_ID      = consts.COL_VOCA_ID;
	 consts.VALUE_LIST_COL_RUNTIME_NAME       = consts.COL_RUNTIME_NAME;
	 
	 //ADVANCED_FUNCTION table column names
	 consts.ADVANCED_FUNCTION_COL_ID               = consts.COL_ID;
	 consts.ADVANCED_FUNCTION_COL_VOCABULARY_ID    = consts.COL_VOCA_ID;
	
	
	
	//Object model properties
	 consts.PROPERTY_NAME_OM_NAME         = consts.PROPERTY_NAME_NAME;
	 consts.PROPERTY_NAME_OM_ATTRIBUTES   = consts.PROPERTY_NAME_ATTRIBUTES;
	 consts.PROPERTY_NAME_OM_DESCRIPTION  = consts.PROPERTY_NAME_DESCRIPTION;

	 consts.PROPERTY_NAME_OM_IS_VOCABULARY_RULE  = consts.PROPERTY_NAME_IS_VOCABULARY_RULE;
	 
	//Object model mapping info properties
	 consts.PROPERTY_NAME_OM_MAPPING_INFO_NAME   = consts.PROPERTY_NAME_NAME;
	 consts.PROPERTY_NAME_OM_MAPPING_INFO_TYPE   = consts.PROPERTY_NAME_TYPE;
	
	//Object model attributes properties
	 consts.PROPERTY_NAME_OM_ATTR_NAME               = consts.PROPERTY_NAME_NAME;
	 consts.PROPERTY_NAME_OM_ATTR_DESCRIPTION        = consts.PROPERTY_NAME_DESCRIPTION;
	 consts.PROPERTY_NAME_OM_ATTR_DATA_TYPE          = consts.PROPERTY_NAME_DATA_TYPE;
	 consts.PROPERTY_NAME_OM_ATTR_SIZE               = consts.PROPERTY_NAME_SIZE;
	 consts.PROPERTY_NAME_OM_ATTR_BUSINESS_DATA_TYPE = consts.PROPERTY_NAME_BUSINESS_DATA_TYPE;
	 consts.PROPERTY_NAME_OM_ATTR_VALUE_LIST_ID      = consts.OM_ATTR_COL_VALUE_LIST_ID;
	
	
	//Object model associations properties
	 consts.PROPERTY_NAME_OM_ASSOC_NAME          = consts.PROPERTY_NAME_NAME;
	 consts.PROPERTY_NAME_OM_ASSOC_DESCRIPTION   = consts.PROPERTY_NAME_DESCRIPTION;
	 consts.PROPERTY_NAME_OM_ASSOC_TARGET        = consts.PROPERTY_NAME_TARGET;
	
	//Object model associations attribute mappings properties
	 consts.PROPERTY_NAME_OM_ASSOC_ATTR_MAPPINGS_TARGET = consts.PROPERTY_NAME_TARGET;
	
	
	//Action properties
	 consts.PROPERTY_NAME_ACTION_NAME          = consts.PROPERTY_NAME_NAME;
	 consts.PROPERTY_NAME_ACTION_DESCRIPTION   = consts.PROPERTY_NAME_DESCRIPTION;
	 consts.PROPERTY_NAME_ACTION_LIB_NAME      = consts.PROPERTY_NAME_NAME;
	 consts.PROPERTY_NAME_ACTION_STATIC_PARAMS = consts.PROPERTY_NAME_STATIC_PARAMS;
	 consts.PROPERTY_NAME_ACTION_INPUT_PARAMS  = consts.PROPERTY_NAME_INPUT_PARAMS;
	
	//Action static paramater properties
	 consts.PROPERTY_NAME_ACTION_STATIC_PARAM_NAME    = consts.PROPERTY_NAME_NAME;
	 consts.PROPERTY_NAME_ACTION_STATIC_PARAM_MAPPING = consts.PROPERTY_NAME_MAPPING;
	
	//Action input paramater properties
	 consts.PROPERTY_NAME_ACTION_INPUT_PARAM_NAME         = consts.PROPERTY_NAME_NAME;
	 consts.PROPERTY_NAME_ACTION_INPUT_PARAM_DATA_TYPE    = consts.PROPERTY_NAME_DATA_TYPE;
	 consts.PROPERTY_NAME_ACTION_INPUT_PARAM_SIZE         = consts.PROPERTY_NAME_SIZE;
	 consts.PROPERTY_NAME_ACTION_INPUT_BUSINESS_DATA_TYPE = consts.PROPERTY_NAME_BUSINESS_DATA_TYPE;
	
	//Output paramaters properties
	 consts.PROPERTY_NAME_OUTPUT_NAME          = consts.PROPERTY_NAME_NAME;
	 consts.PROPERTY_NAME_OUTPUT_DESCRIPTION   = consts.PROPERTY_NAME_DESCRIPTION;
	 consts.PROPERTY_NAME_OUTPUT_STATIC_PARAMS = consts.PROPERTY_NAME_STATIC_PARAMS;
	 consts.PROPERTY_NAME_OUTPUT_INPUT_PARAMS  = consts.PROPERTY_NAME_INPUT_PARAMS;
	
	//Output static paramaters properties
	 consts.PROPERTY_NAME_OUTPUT_STATIC_PARAM_NAME    = consts.PROPERTY_NAME_NAME;
	 consts.PROPERTY_NAME_OUTPUT_STATIC_PARAM_MAPPING = consts.PROPERTY_NAME_MAPPING;
	
	//Output paramaters properties
	 consts.PROPERTY_NAME_OUTPUT_PARAM_NAME               = consts.PROPERTY_NAME_NAME;
	 consts.PROPERTY_NAME_OUTPUT_PARAM_DATA_TYPE          = consts.PROPERTY_NAME_DATA_TYPE;
	 consts.PROPERTY_NAME_OUTPUT_PARAM_SIZE               = consts.PROPERTY_NAME_SIZE;
	 consts.PROPERTY_NAME_OUTPUT_PARAM_BUSINESS_DATA_TYPE = consts.PROPERTY_NAME_BUSINESS_DATA_TYPE;
	 consts.PROPERTY_NAME_OUTPUT_PARAM_IS_COLLECTION 	  = consts.PROPERTY_NAME_IS_COLLECTION;
	
	//Alias properties
	 consts.PROPERTY_NAME_ALIAS_NAME        = consts.PROPERTY_NAME_NAME;
	 consts.PROPERTY_NAME_ALIAS_TYPE        = consts.PROPERTY_NAME_TYPE;
	 consts.PROPERTY_NAME_ALIAS_DESCRIPTION = consts.PROPERTY_NAME_DESCRIPTION;
	 
	
	
	//Dependecies properties
	  consts.PROPERTY_NAME_DEPENDS_ON_PACKAGE = consts.PROPERTY_NAME_PACKAGE;
	  consts.PROPERTY_NAME_DEPENDS_ON_NAME    = consts.PROPERTY_NAME_NAME;
	  
	//AdvancedFunctions properties  
	  consts.PROPERTY_NAME_ADVANCED_FUNCTION_NAME  = consts.PROPERTY_NAME_NAME;
		  
	
	/*******************************************************************************
	* constants for aliasMap
	*******************************************************************************/
	  consts.CONTENT    = consts.PROPERTY_NAME_ALIAS_CONTENT;
	  consts.TYPE       = consts.PROPERTY_NAME_ALIAS_TYPE;
	  consts.NAME       = consts.PROPERTY_NAME_ALIAS_NAME;
	
	
	consts.PROPS_TO_COLS[consts.PROPERTY_NAME_OM_NAME]          = consts.OM_COL_NAME;
	consts.PROPS_TO_COLS[consts.PROPERTY_NAME_OM_DESCRIPTION]   = consts.OM_COL_DESCRIPTION;
	
	
	consts.PROPS_TO_MAPPING_INFO_COLS[consts.PROPERTY_NAME_OM_MAPPING_INFO_SCHEMA] = consts.OM_COL_RUNTIME_SCHEMA;
	consts.PROPS_TO_MAPPING_INFO_COLS[consts.PROPERTY_NAME_OM_MAPPING_INFO_NAME]   = consts.OM_COL_RUNTIME_NAME;
	consts.PROPS_TO_MAPPING_INFO_COLS[consts.PROPERTY_NAME_OM_MAPPING_INFO_TYPE]   = consts.OM_COL_RUNTIME_TYPE;
	
	consts.PROPS_TO_OM_ATTR_COLS[consts.PROPERTY_NAME_OM_ATTR_NAME]               = consts.OM_ATTR_COL_NAME;
	consts.PROPS_TO_OM_ATTR_COLS[consts.PROPERTY_NAME_OM_ATTR_DESCRIPTION]        = consts.OM_ATTR_COL_DESCRITION;
	consts.PROPS_TO_OM_ATTR_COLS[consts.PROPERTY_NAME_OM_ATTR_DATA_TYPE]          = consts.OM_ATTR_COL_DATA_TYPE;
	consts.PROPS_TO_OM_ATTR_COLS[consts.PROPERTY_NAME_OM_ATTR_SIZE]               = consts.OM_ATTR_COL_SIZE;
	consts.PROPS_TO_OM_ATTR_COLS[consts.PROPERTY_NAME_OM_ATTR_BUSINESS_DATA_TYPE] = consts.OM_ATTR_COL_BUSINESS_DATA_TYPE;
	consts.PROPS_TO_OM_ATTR_COLS[consts.PROPERTY_NAME_OM_ATTR_SOURCE_TYPE]        = consts.OM_ATTR_COL_SOURCE_TYPE;
	
	consts.PROPS_TO_OM_ATTR_DATA_MAPPING_COLS[consts.PROPERTY_NAME_OM_ATTR_DATA_MAPPING_COLUMN] = consts.OM_ATTR_COL_RUNTIME_NAME;
	
	consts.PROPS_TO_OM_ASSOC_COLS[consts.PROPERTY_NAME_OM_ASSOC_NAME] = consts.OM_ASSOC_COL_NAME;
	consts.PROPS_TO_OM_ASSOC_COLS[consts.PROPERTY_NAME_OM_ASSOC_TARGET] = consts.OM_ASSOC_COL_TARGET;
	consts.PROPS_TO_OM_ASSOC_COLS[consts.PROPERTY_NAME_OM_ASSOC_CARDINALITY] = consts.OM_ASSOC_COL_CARDINALITY;
	
	consts.PROPS_TO_ACTION_MAPPINGS_COLS[consts.PROPERTY_NAME_ACTION_NAME]        = consts.ACTION_COL_NAME;
	consts.PROPS_TO_ACTION_MAPPINGS_COLS[consts.PROPERTY_NAME_ACTION_DESCRIPTION] = consts.ACTION_COL_DESCRIPTION;
	
	consts.PROPS_TO_OM_ASSOC_ATTRIBUTE_MAPPINGS_COLS[consts.PROPERTY_NAME_OM_ASSOC_ATTR_MAPPINGS_SOURCE] = consts.OM_ASSOC_ATTR_COL_SOURCE;
	consts.PROPS_TO_OM_ASSOC_ATTRIBUTE_MAPPINGS_COLS[consts.PROPERTY_NAME_OM_ASSOC_ATTR_MAPPINGS_TARGET] = consts.OM_ASSOC_ATTR_COL_TARGET;
	
	consts.PROPS_TO_ACTION_RUNTIME_EXE_MAPPINGS_COLS[consts.PROPERTY_NAME_ACTION_LIB_NAME] = consts.ACTION_COL_LIB_NAME;
	consts.PROPS_TO_ACTION_RUNTIME_EXE_MAPPINGS_COLS[consts.PROPERTY_NAME_ACTION_LIB_PATH] = consts.ACTION_COL_LIB_PATH;
	
	consts.PROPS_TO_ACTION_STATIC_PARAM_MAPPINGS_COLS[consts.PROPERTY_NAME_ACTION_STATIC_PARAM_NAME]    = consts.ACTION_STATIC_PARAM_COL_NAME;
	consts.PROPS_TO_ACTION_STATIC_PARAM_MAPPINGS_COLS[consts.PROPERTY_NAME_ACTION_STATIC_PARAM_MAPPING] = consts.ACTION_STATIC_PARAM_COL_MAPPING;
	
	consts.PROPS_TO_ACTION_INPUT_PARAM_MAPPINGS_COLS[consts.PROPERTY_NAME_ACTION_INPUT_PARAM_NAME]         = consts.ACTION_INPUT_PARAM_COL_NAME;
	consts.PROPS_TO_ACTION_INPUT_PARAM_MAPPINGS_COLS[consts.PROPERTY_NAME_ACTION_INPUT_PARAM_DATA_TYPE]    = consts.ACTION_INPUT_PARAM_COL_DATA_TYPE;
	consts.PROPS_TO_ACTION_INPUT_PARAM_MAPPINGS_COLS[consts.PROPERTY_NAME_ACTION_INPUT_BUSINESS_DATA_TYPE] = consts.ACTION_INPUT_PARAM_COL_BUSINESS_DATA_TYPE;
	consts.PROPS_TO_ACTION_INPUT_PARAM_MAPPINGS_COLS[consts.PROPERTY_NAME_ACTION_INPUT_PARAM_SIZE]         = consts.ACTION_INPUT_PARAM_COL_SIZE;
	
	consts.PROPS_TO_OUTPUT_MAPPINGS_COLS[consts.PROPERTY_NAME_OUTPUT_NAME]        = consts.OUTPUT_COL_NAME;
	consts.PROPS_TO_OUTPUT_MAPPINGS_COLS[consts.PROPERTY_NAME_OUTPUT_DESCRIPTION] = consts.OUTPUT_COL_DESCRIPTION;
	
	consts.PROPS_TO_OUTPUT_STATIC_PARAM_MAPPINGS_COLS[consts.PROPERTY_NAME_OUTPUT_STATIC_PARAM_NAME]    = consts.OUTPUT_STATIC_PARAM_COL_NAME;
	consts.PROPS_TO_OUTPUT_STATIC_PARAM_MAPPINGS_COLS[consts.PROPERTY_NAME_OUTPUT_STATIC_PARAM_MAPPING] = consts.OUTPUT_STATIC_PARAM_COL_MAPPING;
	
	consts.PROPS_TO_OUTPUT_PARAM_MAPPINGS_COLS[consts.PROPERTY_NAME_OUTPUT_PARAM_NAME]               = consts.OUTPUT_PARAM_COL_NAME;
	consts.PROPS_TO_OUTPUT_PARAM_MAPPINGS_COLS[consts.PROPERTY_NAME_OUTPUT_PARAM_DATA_TYPE]          = consts.OUTPUT_PARAM_COL_DATA_TYPE;
	consts.PROPS_TO_OUTPUT_PARAM_MAPPINGS_COLS[consts.PROPERTY_NAME_OUTPUT_PARAM_BUSINESS_DATA_TYPE] = consts.OUTPUT_PARAM_COL_BUSINESS_DATA_TYPE;
	consts.PROPS_TO_OUTPUT_PARAM_MAPPINGS_COLS[consts.PROPERTY_NAME_OUTPUT_PARAM_SIZE]               = consts.OUTPUT_PARAM_COL_SIZE;
	consts.PROPS_TO_OUTPUT_PARAM_MAPPINGS_COLS[consts.PROPERTY_NAME_OUTPUT_PARAM_IS_COLLECTION]      = consts.OUTPUT_PARAM_COL_IS_COLLECTION;
	
	consts.PROPS_TO_ADVANCED_FUNCTION_COLS[consts.PROPERTY_NAME_ADVANCED_FUNCTION_NAME] = consts.ADVANCED_FUNCTION_COL_NAME;
	
	consts.TermModeRelated = constantsBase.TermModeRelated;
	
	return consts;
	
}());
