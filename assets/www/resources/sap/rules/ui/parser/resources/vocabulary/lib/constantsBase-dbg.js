jQuery.sap.declare("sap.rules.ui.parser.resources.vocabulary.lib.constantsBase");

sap.rules.ui.parser.resources.vocabulary.lib.constantsBase = sap.rules.ui.parser.resources.vocabulary.lib.constantsBase|| {}; 
sap.rules.ui.parser.resources.vocabulary.lib.constantsBase.lib = {

		BusinessDataType : {
			Number : "Number",
			String : "String",
			TimeSpan : "TimeSpan",
			Timestamp : "Timestamp",
			Boolean : "Boolean",
			Date : "Date",
			Time : "Time"
		},
		
		
		/*******************************************************************************
		 * enums for alias type
		 ******************************************************************************/

		ALIAS_CONTENT_DECISION_TABLE : 'decisionTable',

		/*******************************************************************************
		 * constants for aliasMap
		 *******************************************************************************/


		DATA_TYPE_COLLECTION : "Collection",
		DATA_TYPE_STRUCTURE : "Structure",
		DATA_TYPE_DATAOBJECT : "DataObject",
			
		PROPERTY_NAME_ALIASES : 'aliases',
		PROPERTY_NAME_DATA_OBJECTS : 'dataObjects',
		PROPERTY_NAME_OM_ASSOCIATIONS : "associations",
		PROPERTY_NAME_ATTRIBUTES : "attributes", 
		
		/*******************************************************************************
		 * constants for valueList
		 *******************************************************************************/
		INTERNAL_VALUE_LIST : 'Internal',
		EXTERNAL_VALUE_LIST : 'External',
		
		/*******************************************************************************
		* constants for term Modes (Friendly Terms)
		*******************************************************************************/
		
		TermModeRelated : {
			 TERM_MODE_BY_NAME            : 'byName',
			 TERM_MODE_BY_DESCRIPTION     : 'byDescription',
			 TERM_PROPERTY_DESCRIPTION    : 'description',
			 TERM_PROPERTY_FRIENDLY_TERM  : 'friendlyTerm'
		}
};