jQuery.sap.declare("sap.rules.ui.parser.resources.dependencies.lib.constants");

jQuery.sap.require("sap.rules.ui.parser.resources.dependencies.lib.constantsBase");

sap.rules.ui.parser.resources.dependencies.lib.constants = sap.rules.ui.parser.resources.dependencies.lib.constants|| {}; 
sap.rules.ui.parser.resources.dependencies.lib.constants.lib = (
	function() {
		var dbConstantsLib = sap.rules.ui.parser.resources.dependencies.lib.constantsBase.lib;
		var consts = {
			//Properties
			PROPERTY_NAME_DEPENDENCIES_OUTPUT: dbConstantsLib.PROPERTY_NAME_DEPENDENCIES_OUTPUT,
			PROPERTY_NAME_PACKAGE: "package",
			PROPERTY_NAME_NAME: "name",
			PROPERTY_NAME_SUFFIX: "suffix",
			PROPERTY_NAME_SOURCE: "source",
			PROPERTY_NAME_TARGET: "target",

			PROPERTY_NAME_TARGET_SUFFIX: "targetSuffix",
			PROPERTY_NAME_TARGET_PACKAGE: "targetPackage",
			PROPERTY_NAME_TARGET_NAME: "targetName",
			PROPERTY_NAME_TARGET_PATH: "targetPath",
			PROPERTY_NAME_SOURCE_SUFFIX: "sourceSuffix",
			PROPERTY_NAME_SOURCE_PACKAGE: "sourcePackage",
			PROPERTY_NAME_SOURCE_NAME: "sourceName",
			PROPERTY_NAME_SOURCE_PATH: "sourcePath",
			PROPERTY_NAME_FOLLOWUP_ACTION: "followupAction",
			PROPERTY_NAME_CHANGES: "changes",
			PROPERTY_NAME_CHANGE: "change",
			PROPERTY_NAME_ATTRIBUTE: "attribute",
			PROPERTY_NAME_CATEGORY: "category",
			PROPERTY_NAME_CATEGORIES: "categories",
			PROPERTY_NAME_EMPTY_PATH: "<empty_path>",
			PROPERTY_NAME_NEXT: "next",

			COL_SOURCE_SUFFIX: "SOURCE_SUFFIX",
			COL_SOURCE_PACKAGE: "SOURCE_PACKAGE",
			COL_SOURCE_NAME: "SOURCE_NAME",
			COL_SOURCE_PATH: "SOURCE_PATH",
			COL_TARGET_SUFFIX: "TARGET_SUFFIX",
			COL_TARGET_PACKAGE: "TARGET_PACKAGE",
			COL_TARGET_NAME: "TARGET_NAME",
			COL_TARGET_PATH: "TARGET_PATH",
			COL_CATEGORY: "CATEGORY",
			COL_CHANGE_LIST: "CHANGE_LIST",


			// Dependencies info categories
			CATEGORY_VOCA_DO: "DO",
			CATEGORY_VOCA_DO_ATTRIBUTES: "DOAttributes",
			CATEGORY_VOCA_DO_ATTRIBUTE: "DOAttribute",
			CATEGORY_VOCA_DO_ASSOCS: "DOAssociations",
			CATEGORY_VOCA_DO_ASSOC: "DOAssociation",
			CATEGORY_VOCA_DO_MAPPING: "DOMapping",
			CATEGORY_VOCA_ACTIONS: "Actions",
			CATEGORY_VOCA_OUTPUTS: "Outputs",
			CATEGORY_VOCA_ALIASES: "Aliases",
			CATEGORY_VOCA_VALUE_LISTS: "ValueLists",
			CATEGORY_VOCA_TERMS: "<terms>",

			CATEGORY_RESOURCE: "RESOURCE",
			CATEGORY_RT_ATTR: "RULE_TEMPLATE_ATTRIBUTE",
			CATEGORY_RT_ATTRS: "RULE_TEMPLATE_ATTRIBUTES",
			CATEGORY_RT_COND: "RULE_TEMPLATE_CONDITION",
			
			CATEGORY_RS_VOCA: "RULE_SERVICE_VOCA",
			CATEGORY_RS_VOCA_OUTPUT: "RULE_SERVICE_VOCA_OUTPUT",
			CATEGORY_RS_RULE_ASSIGNMENT: "RULE_SERVICE_RULE_ASSIGNMENT",
			
			// Follow up actions
			ACTIVATE: "ACTIVATE",
			REGENERATE: "REGENERATE",

			//Tables
			TABLE_HRF_CROSS_REFERENCE: "sap.rules.ui.parser.resources.dependencies.model::HRF_CROSS_REFERENCE",

			//Repository (to be removed on runtime plugin integration...)
			REPO_SCHEMA_NAME: "_SYS_REPO",
			TABLE_REPO_CROSS_REF: "ACTIVE_OBJECTCROSSREF",
			REPO_TABLE_COL_NAME: {
				FROM_PACKAGE_ID: "FROM_PACKAGE_ID",
				FROM_OBJECT_NAME: "FROM_OBJECT_NAME",
				FROM_OBJECT_SUFFIX: "FROM_OBJECT_SUFFIX",
				TO_PACKAGE_ID: "TO_PACKAGE_ID",
				TO_OBJECT_NAME: "TO_OBJECT_NAME",
				TO_OBJECT_SUFFIX: "TO_OBJECT_SUFFIX"
			}

		};
		return consts;
	}
	());