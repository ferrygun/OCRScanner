jQuery.sap.declare("sap.rules.ui.parser.resources.vocabulary.lib.JSONLoader");

jQuery.sap.require("sap.rules.ui.parser.infrastructure.util.utilsBase");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.utilsBase");
jQuery.sap.require("sap.rules.ui.parser.resources.common.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.utils");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.infrastructure.messageHandling.lib.responseCollector");
jQuery.sap.require("sap.rules.ui.parser.infrastructure.errorHandling.hrfException");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.termGeneration");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.vocaObjects");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.runtimeServicesUtils");

jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderFactory");



sap.rules.ui.parser.resources.vocabulary.lib.JSONLoader = sap.rules.ui.parser.resources.vocabulary.lib.JSONLoader|| {}; 
sap.rules.ui.parser.resources.vocabulary.lib.JSONLoader.lib = (function() {
	
	var infraUtilsBase = sap.rules.ui.parser.infrastructure.util.utilsBase.lib;
	var infraUtilsBaseLib = new infraUtilsBase.utilsBaseLib();
	var vocaUtilsBase = sap.rules.ui.parser.resources.vocabulary.lib.utilsBase.lib;
	var vocaUtilsBaseLib = new vocaUtilsBase.utilsBaseLib();
	var resourcesConstants = sap.rules.ui.parser.resources.common.lib.constants.lib;
	var vocUtils = sap.rules.ui.parser.resources.vocabulary.lib.utils.lib;
	var vocUtilsLib = new vocUtils.utilsLib();
	var vocabularyConstants = sap.rules.ui.parser.resources.vocabulary.lib.constants.lib;
	var businessLanguageConstantsLib = sap.rules.ui.parser.businessLanguage.lib.constants.lib;
	var ResponseCollector = sap.rules.ui.parser.infrastructure.messageHandling.lib.responseCollector.lib.ResponseCollector;
	var hrfException = sap.rules.ui.parser.infrastructure.errorHandling.hrfException.lib;
	var termGenerator = sap.rules.ui.parser.resources.vocabulary.lib.termGeneration.lib;
	var termGeneratorLib = new termGenerator.termGenerationLib();
	var vocaObjects = sap.rules.ui.parser.resources.vocabulary.lib.vocaObjects.lib;
	var runtimeServicesUtils = sap.rules.ui.parser.resources.vocabulary.lib.runtimeServicesUtils.lib;
	var runtimeServicesUtilsLib = new runtimeServicesUtils.runtimeServicesUtilsLib();
	
	function JSONLoaderLib(){
		
	}
	
	
	
	/*
	 * This function generates the vocabulary on the fly.
	 * It places the resulting voca objects on the rtAll runtime cache that is sent by reference.
	 */
	JSONLoaderLib.prototype.loadAll = function(rtAll, originalResourceContent, isPrivate, dbConn, resourceID, versionId, writeDependecies) {  //TBD: add the writeDependecies param to current hybrid caller !!!
		
		var dependencyUtilsLib = null;
		var dependecyManager = null;
		var resourceContent = JSON.parse(JSON.stringify(originalResourceContent));
		var vocabularyFullName = resourceID.name;
		var vocabularyID = infraUtilsBaseLib.createUUID();
		var isValueListConverted = null;
		var scope;
		var runtimeServicesLib;
		var dependencyConstantsLib;
		var ruleBodyValidatorLib;

		if(dbConn){
			jQuery.sap.require("sap.rules.ui.parser.ruleBody.lib.ruleBodyValidator");
			ruleBodyValidatorLib = sap.rules.ui.parser.ruleBody.lib.ruleBodyValidator.lib;
		}
		
		var vocaRuntimeServicesFactory = sap.rules.ui.parser.resources.vocabulary.lib.vocabularyDataProviderFactory.lib;
		runtimeServicesLib = new vocaRuntimeServicesFactory.vocaDataProviderFactoryLib();

		jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.parsingBackendMediator");
		var parser = new sap.rules.ui.parser.businessLanguage.lib.parsingBackendMediator.lib.parsingBackendMediatorLib();
		//Avoid from importing the following libs in case this run in client side, by checking the writeDependecies flag
		if(writeDependecies){
			jQuery.sap.require("sap.rules.ui.parser.resources.dependencies.lib.constants");
			dependencyConstantsLib = sap.rules.ui.parser.resources.dependencies.lib.constants.lib;
			jQuery.sap.require("sap.rules.ui.parser.resources.dependencies.lib.dependenciesUtils");
			dependencyUtilsLib = sap.rules.ui.parser.resources.dependencies.lib.dependenciesUtils;
			jQuery.sap.require("sap.rules.ui.parser.resources.dependencies.lib.dependencyManager");
			dependecyManager = sap.rules.ui.parser.resources.dependencies.lib.dependencyManager.DependencyManager;
		}
		
		if(resourceID.package && resourceID.package.length > 0){
			vocabularyFullName = vocUtilsLib.getVocabularyFullName(resourceID, resourceContent);
		} 
		/*******************************************************************************
		 * Inner Functions
		 ******************************************************************************/
		
		function getConvesionFlagsMap(resourceContent) {
			if (resourceContent.hasOwnProperty(vocabularyConstants.PROPERTY_NAME_CONVERSION_FLAGS)) {
				return resourceContent[vocabularyConstants.PROPERTY_NAME_CONVERSION_FLAGS];
			}
			return null;
		}
		
		function getValueListConvesionFlag(resourceContent) {
			var conversionFlagsMap = getConvesionFlagsMap(resourceContent);
			if (conversionFlagsMap === null) {
				return "0";
			}
			if (conversionFlagsMap.hasOwnProperty(vocabularyConstants.PROPERTY_NAME_IS_VALUE_LIST_CONVERTED)) {
				return  (conversionFlagsMap[vocabularyConstants.PROPERTY_NAME_IS_VALUE_LIST_CONVERTED] === true ? "1" : "0");
			}
			return "0";
		}
		//This function creates the vocabulary instance
		function createVocaInfo(rtAll, vocabularyFullName, resourceContent, resourceID, isPrivateP, vocabularyID, versionId, scope) {
		
			var isPrivate = (isPrivateP === true) ? "1" : "0";
			var isWritable = resourceContent[vocabularyConstants.PROPERTY_NAME_IS_WRITABLE] ? "1" : "0";
			isValueListConverted = getValueListConvesionFlag(resourceContent);
			
			var vocaInfo = new vocaObjects.VocaInfo(
				vocabularyID,
				vocabularyFullName,
				resourceID[resourcesConstants.PROPERTY_NAME_SUFFIX],
				scope,
				isWritable,
				isPrivate,
				isValueListConverted,
				resourceID[resourcesConstants.PROPERTY_NAME_PACKAGE],
				resourceID[resourcesConstants.PROPERTY_NAME_NAME],
				versionId
			);
			//Add to the runtime cache
			rtAll.allVocabularies = rtAll.allVocabularies || {}; 
			rtAll.allVocabularies[vocabularyFullName] = vocaInfo;
		}
		
		function validateMapping(connection, vocabulary, resourceContent, vocObject, isPrivate, resourceID, isAllowCollection) {
		
			var parsedBusinessRule;
			var i, j;
			var mappingExpression;
			var parameterName;
			var staticParams;
			var params, msgObj;
			var depOutput;
			var dependencies = [];
		
			// case there is no actions / outputs
			if (!resourceContent) {
				return;
			}
		
			for (i = 0; i < resourceContent.length; i++) {
				if (resourceContent[i].hasOwnProperty(vocabularyConstants.PROPERTY_NAME_STATIC_PARAMS)) {
					staticParams = resourceContent[i][vocabularyConstants.PROPERTY_NAME_STATIC_PARAMS];
					// iterate over staticParams and validate mapping
					for (j = 0; j < staticParams.length; j++) {
						mappingExpression = staticParams[j][vocabularyConstants.PROPERTY_NAME_MAPPING];
						parameterName     = staticParams[j][vocabularyConstants.PROPERTY_NAME_NAME];
						parsedBusinessRule = parser.parseInput(mappingExpression, businessLanguageConstantsLib.VALIDATE_MODE, connection, null, null, vocabulary, {
							"dependenciesOutput": true
						});
						//invalid expression
						if (parsedBusinessRule === undefined || parsedBusinessRule === null) {
							params = [vocObject, mappingExpression, parsedBusinessRule];
							msgObj = ResponseCollector.getInstance().addMessage("error_vocabulary_invalid_expression", params);
							throw new hrfException.HrfException (JSON.stringify (msgObj), false);
						}
						if (parsedBusinessRule.status === businessLanguageConstantsLib.statusEnum.ERROR) {
							params = [vocObject, mappingExpression, parsedBusinessRule.errorDetails];
							msgObj = ResponseCollector.getInstance().addMessage("error_vocabulary_problem_in_rule", params);
							throw new hrfException.HrfException (JSON.stringify (msgObj), false);
						}
						//not allowed to use collection parameter in actions
						if (isAllowCollection === false && parsedBusinessRule.isCollection === true){ 
							params = [resourceContent[i][vocabularyConstants.PROPERTY_NAME_NAME], parameterName];
							msgObj = ResponseCollector.getInstance().addMessage("error_vocabulary_parameter_action_param_cant_be_collection", params);
							throw new hrfException.HrfException (JSON.stringify (msgObj), false);
						}
						if (writeDependecies){
							depOutput = parsedBusinessRule[dependencyConstantsLib.PROPERTY_NAME_DEPENDENCIES_OUTPUT];
							if (depOutput !== null && depOutput !== undefined) {
								dependencies = dependencies.concat(dependencyUtilsLib.createDependenciesInVocabulary(
									vocObject + "." + resourceContent[i][vocabularyConstants.PROPERTY_NAME_NAME], vocabulary, depOutput, isPrivate, connection));
							}
						}
					}
				}
			}
			if (writeDependecies && dependencies.length > 0) {
				dependecyManager.getInstance(connection).setDependencies(resourceID, dependencies);
			}
		}
		
		function autoCompleteBusinessDataTypeAccordingToValueList(attributeContent, vocaName, dbConn) {
			var msgObj;
			//if()
			var vocaRTServicves = runtimeServicesLib.getVocabularyDataProvider(dbConn);
			var valueList = vocaRTServicves.getValueList(vocaName, attributeContent[vocabularyConstants.PROPERTY_NAME_VALUE_LIST]);
			if (valueList === null) {
				var params = [attributeContent[vocabularyConstants.PROPERTY_NAME_VALUE_LIST], attributeContent[vocabularyConstants.PROPERTY_NAME_NAME]];
				msgObj = ResponseCollector.getInstance().addMessage("error_vocabulary_value_list_does_not_exist", params);
				throw new hrfException.HrfException (JSON.stringify (msgObj), false);
			}
		
			// Complete also value list id
			attributeContent[vocabularyConstants.PROPERTY_NAME_OM_ATTR_VALUE_LIST_ID] = valueList[vocabularyConstants.ATT_ID];
			// If description exists then business data type is always string otherwise the type is the value list value type
			if (valueList.hasOwnProperty(vocabularyConstants.PROPERTY_VALUE_LIST_DESCRIPTION_COLUMN) && valueList[vocabularyConstants.PROPERTY_VALUE_LIST_DESCRIPTION_COLUMN] !== null) {
				attributeContent[vocabularyConstants.PROPERTY_NAME_BUSINESS_DATA_TYPE] = businessLanguageConstantsLib.SIMPLE_SELECTION_VALUE_TYPE.STRING.string;
			} else {
				attributeContent[vocabularyConstants.PROPERTY_NAME_BUSINESS_DATA_TYPE] = valueList[vocabularyConstants.PROPERTY_NAME_BUSINESS_DATA_TYPE];
			}
			// Complete data type
			attributeContent[vocabularyConstants.PROPERTY_NAME_DATA_TYPE] = valueList[vocabularyConstants.PROPERTY_NAME_DATA_TYPE];
			// Complete size
			attributeContent[vocabularyConstants.PROPERTY_NAME_SIZE] = valueList[vocabularyConstants.PROPERTY_NAME_SIZE];
		}
		
		function autoCompleteBusinessDataType(attributeContent, vocaName, dbConn) {
		
			if (attributeContent[vocabularyConstants.PROPERTY_NAME_VALUE_LIST]) {
				autoCompleteBusinessDataTypeAccordingToValueList(attributeContent, vocaName, dbConn);
			}
			if (!attributeContent[vocabularyConstants.PROPERTY_NAME_BUSINESS_DATA_TYPE]) {
				var bdt = vocUtilsLib.getBusinessDataType(attributeContent[vocabularyConstants.PROPERTY_NAME_DATA_TYPE]);
				attributeContent[vocabularyConstants.PROPERTY_NAME_BUSINESS_DATA_TYPE] = bdt;
			}
		}
		
		function autoCompleteDataMapping(omAttributeContent) {
		
			if (!omAttributeContent[vocabularyConstants.PROPERTY_NAME_OM_ATTR_DATA_MAPPING]) {
				omAttributeContent[vocabularyConstants.PROPERTY_NAME_OM_ATTR_DATA_MAPPING] = {
					column: omAttributeContent[vocabularyConstants.PROPERTY_NAME_OM_ATTR_NAME]
				};
			} else if (!omAttributeContent[vocabularyConstants.PROPERTY_NAME_OM_ATTR_DATA_MAPPING][vocabularyConstants.PROPERTY_NAME_OM_ATTR_DATA_MAPPING_COLUMN]) {
				omAttributeContent[vocabularyConstants.PROPERTY_NAME_OM_ATTR_DATA_MAPPING][vocabularyConstants.PROPERTY_NAME_OM_ATTR_DATA_MAPPING_COLUMN] = omAttributeContent[vocabularyConstants.PROPERTY_NAME_OM_ATTR_NAME];
			}
		}
		
		//This function creates the OM attribute instance
		function createAttrInfo(rtAll, omAttributeContent, omID, omName, omRuntimeName, vocaName, scope, isPrivate, dbConn) {
		
			var prop = "";
			var dmProp = "";
			var dataMapping;
			var omAttrID = infraUtilsBaseLib.createUUID();
			var name = "", runtimeName = "", description = "", dataType = "", size = null, businessDataType = "", sourceType = "", valueListName = null;
			
			//If business data type is empty, complete it according to HANA data type
			autoCompleteBusinessDataType(omAttributeContent, vocaName, dbConn);
			//If data mapping is empty, complete column name according to attribute name
			autoCompleteDataMapping(omAttributeContent);
			for (prop in omAttributeContent) {
				if (omAttributeContent.hasOwnProperty(prop)) {
					switch (prop) {
						case vocabularyConstants.PROPERTY_NAME_OM_ATTR_NAME:
							name = omAttributeContent[prop];
							break;
						case vocabularyConstants.PROPERTY_NAME_OM_ATTR_DESCRIPTION:
							description = omAttributeContent[prop];
							break;
						case vocabularyConstants.PROPERTY_NAME_OM_ATTR_DATA_TYPE:
							dataType = omAttributeContent[prop];
							break;
						case vocabularyConstants.PROPERTY_NAME_OM_ATTR_SIZE:
							size = omAttributeContent[prop];
							break;
						case vocabularyConstants.PROPERTY_NAME_OM_ATTR_BUSINESS_DATA_TYPE:
							businessDataType = omAttributeContent[prop];
							break;
						case vocabularyConstants.PROPERTY_NAME_OM_ATTR_SOURCE_TYPE:
							sourceType = omAttributeContent[prop];
							break;
						case vocabularyConstants.PROPERTY_NAME_VALUE_LIST:
							valueListName = omAttributeContent[prop];
							break;
						case vocabularyConstants.PROPERTY_NAME_OM_ATTR_DATA_MAPPING:
							dataMapping = omAttributeContent[prop];
							for (dmProp in dataMapping) {
								if (dataMapping.hasOwnProperty(dmProp)) {
									switch (dmProp) {
										case vocabularyConstants.PROPERTY_NAME_OM_ATTR_DATA_MAPPING_COLUMN:
											runtimeName = dataMapping[dmProp];
											break;
									}
								}
							}
							break;
					}
				}
			}
			var attrInfo = new vocaObjects.AttrInfo(
					omID,
					name,
					omName,
					runtimeName,
					description,
					dataType,
					businessDataType,
					size,
					sourceType,
					omRuntimeName,
					vocaName,
					scope,
					isPrivate ?  '1' : '0',
					valueListName,
					omAttrID);
			//Add to the runtime cache
			rtAll.allAttr = rtAll.allAttr ? rtAll.allAttr.concat([attrInfo]) : [attrInfo];
		}
		
		//This function creates OM attribute instances
		function createAttrInfos(rtAll, omAttributeArrayContent, omID, omName, omRuntimeName, vocaName, scope, isPrivate, dbConn) {
			var i;
			var omAttributeContent;
		
			for (i = 0; i < omAttributeArrayContent.length; ++i) {
				omAttributeContent = omAttributeArrayContent[i];
				createAttrInfo(rtAll, omAttributeContent, omID, omName, omRuntimeName, vocaName, scope, isPrivate, dbConn);
			}
		}
		
		function createAssocAttrInfo(rtAll, attrMappingContent, omID, assocID) {
		
			var prop = "", source = "",  target = "";
			var assocAttrID = infraUtilsBaseLib.createUUID();
			for (prop in attrMappingContent) {
				if (attrMappingContent.hasOwnProperty(prop)) {
					switch (prop) {
						case vocabularyConstants.PROPERTY_NAME_OM_ASSOC_ATTR_MAPPINGS_SOURCE:
							source = attrMappingContent[prop];
							break;
						case vocabularyConstants.PROPERTY_NAME_OM_ASSOC_ATTR_MAPPINGS_TARGET:
							target = attrMappingContent[prop];
							break;
					}
				}
			}
			var assocAttrInfo = new vocaObjects.AssocAttrInfo(assocID, source,  target, omID, assocAttrID);
			//Add to the runtime cache
			rtAll.allAssocAttr = rtAll.allAssocAttr ? rtAll.allAssocAttr.concat([assocAttrInfo]) : [assocAttrInfo];
		}
		
		function createAssocAttrInfos(rtAll, attrMappingsArrayContent, omID, assocID) {
		
			var i;
			var attrMappingContent;
		
			for (i = 0; i < attrMappingsArrayContent.length; ++i) {
				attrMappingContent = attrMappingsArrayContent[i];
				createAssocAttrInfo(rtAll, attrMappingContent, omID, assocID);
			}
		}
		
		function createAssocInfo(rtAll, omAssociationContent, omID, vocaName) {
		
			var attrMappingsArrayContent, name = "", description = "", target = "", cardinality = "";
			var assocID = infraUtilsBaseLib.createUUID();
			var prop = "";
		
			for (prop in omAssociationContent) {
				if (omAssociationContent.hasOwnProperty(prop)) {
					switch (prop) {
						case vocabularyConstants.PROPERTY_NAME_OM_ASSOC_NAME:
							name = omAssociationContent[prop];
							break;
						case vocabularyConstants.PROPERTY_NAME_OM_ASSOC_DESCRIPTION:
							description = omAssociationContent[prop];
							break;
						case vocabularyConstants.PROPERTY_NAME_OM_ASSOC_TARGET:
							target = omAssociationContent[prop];
							break;
						case vocabularyConstants.PROPERTY_NAME_OM_ASSOC_CARDINALITY:
							cardinality = omAssociationContent[prop];
							break;
						case vocabularyConstants.PROPERTY_NAME_OM_ASSOC_ATTR_MAPPINGS:
							attrMappingsArrayContent = omAssociationContent[prop];
							createAssocAttrInfos(rtAll, attrMappingsArrayContent, omID, assocID);
							break;
					}
				}
			}
			var assocInfo = new vocaObjects.AssocInfo(omID, assocID, name, target, cardinality, vocaName, description);
			//Add to the runtime cache
			rtAll.allAssoc = rtAll.allAssoc ? rtAll.allAssoc.concat([assocInfo]) : [assocInfo];
		}
		
		
		//This function creates OM association instances
		function createAssocInfos(rtAll, omAssociationArrayContent, omID, vocaName) {
		
			var i;
			var omAssociationContent;
		
			for (i = 0; i < omAssociationArrayContent.length; ++i) {
		
				omAssociationContent = omAssociationArrayContent[i];
		
				createAssocInfo(rtAll, omAssociationContent, omID, vocaName);
			}
		}
		
		
		
		function createObjectInfo(rtAll, objectModelContent, vocabularyID, vocaName, scope, isPrivate, dbConn) {

			var mappingInfo, objectInfo, parameterInfo;
			var miProp = "";
			var omID = infraUtilsBaseLib.createUUID();
			var omName = ""; 
			var omDescription = "";
			var omIsVocaRule = "";
			var runtimeName = "";
			var schema = "";
			var runtimeType = "";
			var parameters = null;

			if (objectModelContent.hasOwnProperty(vocabularyConstants.PROPERTY_NAME_OM_NAME)) {
				omName = objectModelContent[vocabularyConstants.PROPERTY_NAME_OM_NAME]; //Object name of the DO that contains the mappingInfo
			}
			if (objectModelContent.hasOwnProperty(vocabularyConstants.PROPERTY_NAME_OM_DESCRIPTION)) {
				omDescription = objectModelContent[vocabularyConstants.PROPERTY_NAME_OM_DESCRIPTION];
			}  

			if (objectModelContent.hasOwnProperty(vocabularyConstants.PROPERTY_NAME_IS_VOCABULARY_RULE)) {
				omIsVocaRule = objectModelContent[vocabularyConstants.PROPERTY_NAME_IS_VOCABULARY_RULE];
			}  
						
			if (objectModelContent.hasOwnProperty(vocabularyConstants.PROPERTY_NAME_OM_MAPPING_INFO)) {
				mappingInfo = objectModelContent[vocabularyConstants.PROPERTY_NAME_OM_MAPPING_INFO];
				for (miProp in mappingInfo) {
					if (mappingInfo.hasOwnProperty(miProp)) {
						switch (miProp) {
						case vocabularyConstants.PROPERTY_NAME_OM_MAPPING_INFO_SCHEMA:
							schema = mappingInfo[vocabularyConstants.PROPERTY_NAME_OM_MAPPING_INFO_SCHEMA];
							break;
						case vocabularyConstants.PROPERTY_NAME_OM_MAPPING_INFO_TYPE:
							runtimeType = mappingInfo[vocabularyConstants.PROPERTY_NAME_OM_MAPPING_INFO_TYPE];
							break;
						case vocabularyConstants.PROPERTY_NAME_OM_MAPPING_INFO_NAME:
							runtimeName = mappingInfo[vocabularyConstants.PROPERTY_NAME_OM_MAPPING_INFO_NAME];
							break;
						case vocabularyConstants.PROPERTY_NAME_OM_MAPPING_INFO_PARAMETERS:
							parameters = mappingInfo[vocabularyConstants.PROPERTY_NAME_OM_MAPPING_INFO_PARAMETERS];
							break;								


						}
					}
				}
			}
			if (objectModelContent.hasOwnProperty(vocabularyConstants.PROPERTY_NAME_OM_ATTRIBUTES)){
				createAttrInfos(rtAll, objectModelContent[vocabularyConstants.PROPERTY_NAME_OM_ATTRIBUTES], omID, omName, runtimeName, vocaName, scope, isPrivate, dbConn);
			}
			if (objectModelContent.hasOwnProperty(vocabularyConstants.PROPERTY_NAME_OM_ASSOCIATIONS)){
				createAssocInfos(rtAll, objectModelContent[vocabularyConstants.PROPERTY_NAME_OM_ASSOCIATIONS], omID, vocaName);
			}
			objectInfo = new vocaObjects.ObjectInfo(vocabularyID, vocaName, vocabularyConstants.OM_SOURCE, omID, omName, runtimeName, schema, scope, isPrivate, omDescription, runtimeType, omIsVocaRule);
			//Add to the runtime cache
			rtAll.allObjects = rtAll.allObjects ? rtAll.allObjects.concat([objectInfo]) : [objectInfo];

			//create ParameterInfo only if parameters exist
			if (parameters){ 
				parameterInfo = new vocaObjects.ParameterInfo(vocabularyID, vocaName, vocabularyConstants.OM_SOURCE, omID, omName, runtimeName, schema, parameters, rtAll, scope, isPrivate, omDescription, runtimeType);
				//Add to the runtime cache
				rtAll.allParameterInfos = rtAll.allParameterInfos ? rtAll.allParameterInfos.concat([parameterInfo]) : [parameterInfo];
			}
		}
		
		function createActionStaticParam(rtAll, staticParamContent, actionID) {
		
			var staticParamID = infraUtilsBaseLib.createUUID();
			var prop = "", name = "", mapping = "", actionStaticParams;
		
			for (prop in staticParamContent) {
				if (staticParamContent.hasOwnProperty(prop)) {
					switch (prop) {
						case vocabularyConstants.PROPERTY_NAME_ACTION_STATIC_PARAM_NAME:
							name = staticParamContent[prop];
							break;
						case vocabularyConstants.PROPERTY_NAME_ACTION_STATIC_PARAM_MAPPING:
							mapping = staticParamContent[prop];
							break;
					}
				}
			}
		
			actionStaticParams = new vocaObjects.ActionStaticParams(actionID, name, mapping, staticParamID);
			//Add to the runtime cache
			rtAll.allActionsStaticParams = rtAll.allActionsStaticParams ? rtAll.allActionsStaticParams.concat([actionStaticParams]) : [actionStaticParams];
		}
		
		function createActionStaticParams(rtAll, staticParamsArrayContent, actionID) {
		
			var i;
			var staticParamContent;
		
			for (i = 0; i < staticParamsArrayContent.length; ++i) {
				staticParamContent = staticParamsArrayContent[i];
				createActionStaticParam(rtAll, staticParamContent, actionID);
			}
		}
		
		function createActionRequiredParam(rtAll, inputParamContent, actionID, vocaName, dbConn) {
		
			var inputParamID = infraUtilsBaseLib.createUUID();
			var actionRequiredParams, name = "", dataType = "", size = null, businessDataType = "";
			var prop = "";
		
			//If business data type is empty, complete it according to HANA data type
			autoCompleteBusinessDataType(inputParamContent, vocaName, dbConn);
			for (prop in inputParamContent) {
				if (inputParamContent.hasOwnProperty(prop)) {
					switch (prop) {
						case vocabularyConstants.PROPERTY_NAME_ACTION_INPUT_PARAM_NAME:
							name = inputParamContent[prop];
							break;
						case vocabularyConstants.PROPERTY_NAME_ACTION_INPUT_PARAM_DATA_TYPE:
							dataType = inputParamContent[prop];
							break;
						case vocabularyConstants.PROPERTY_NAME_ACTION_INPUT_BUSINESS_DATA_TYPE:
							businessDataType = inputParamContent[prop];
							break;
						case vocabularyConstants.PROPERTY_NAME_ACTION_INPUT_PARAM_SIZE:
							size = inputParamContent[prop];
							break;
					}
				}
			}
			actionRequiredParams = new vocaObjects.ActionRequiredParams(actionID, name, dataType, size, businessDataType, inputParamID);
			//Add to the runtime cache
			rtAll.allActionsRequiredParams = rtAll.allActionsRequiredParams ? rtAll.allActionsRequiredParams.concat([actionRequiredParams]) : [actionRequiredParams];
		}
		
		function createActionRequiredParams(rtAll, inputParamsArrayContent, actionID, vocaName, dbConn) {
		
			var i;
			var inputParamContent;
		
			for (i = 0; i < inputParamsArrayContent.length; ++i) {
				inputParamContent = inputParamsArrayContent[i];
				createActionRequiredParam(rtAll, inputParamContent, actionID, vocaName, dbConn);
			}
		}
		
		//This function creates OM attribute instance
		function createActionInfo(rtAll, actionContent, vocabularyID, vocaName, dbConn, scope, isPrivate, isValueListConverted) {
		
			var actionProp = "";
			var actionID = infraUtilsBaseLib.createUUID();
			var runTimeExc = "";
			var rtExProp = "";
			var staticParamsArrayContent = "";
			var inputParamsArrayContent = "";
			var actionInfo, name = "",	description = "", libPath = "", libName = "";
		
			for (actionProp in actionContent) {
				if (actionContent.hasOwnProperty(actionProp)) {
					switch (actionProp) {
		
						case vocabularyConstants.PROPERTY_NAME_ACTION_NAME:
							name = actionContent[actionProp];
							break;
						case vocabularyConstants.PROPERTY_NAME_ACTION_DESCRIPTION:
							description = actionContent[actionProp];
							break;
						case vocabularyConstants.PROPERTY_NAME_ACTION_STATIC_PARAMS:
							staticParamsArrayContent = actionContent[actionProp];
							createActionStaticParams(rtAll, staticParamsArrayContent, actionID);
							break;
						case vocabularyConstants.PROPERTY_NAME_ACTION_INPUT_PARAMS:
							inputParamsArrayContent = actionContent[actionProp];
							createActionRequiredParams(rtAll, inputParamsArrayContent, actionID, vocaName, dbConn);
							break;
						case vocabularyConstants.PROPERTY_NAME_ACTION_RUNTIME_EXE:
							runTimeExc = actionContent[actionProp];
							for (rtExProp in runTimeExc) {
								if (runTimeExc.hasOwnProperty(rtExProp)) {
									switch (rtExProp) {
										case vocabularyConstants.PROPERTY_NAME_ACTION_LIB_NAME:
											libName = runTimeExc[rtExProp];
											break;
										case vocabularyConstants.PROPERTY_NAME_ACTION_LIB_PATH:
											libPath = runTimeExc[rtExProp];
											break;
									}
								}
							}
							break;
					}
				}
			}
			actionInfo = new vocaObjects.ActionInfo(vocabularyID, vocaName, actionID, name, libPath, libName, scope, isPrivate, isValueListConverted, description);
			//Add to the runtime cache
			rtAll.allActions = rtAll.allActions ? rtAll.allActions.concat([actionInfo]) : [actionInfo];
		}
		
		function createActionInfos(rtAll, actionArrayContent, vocabularyID, vocaName, dbConn, scope, isPrivate, isValueListConverted) {
		
			var actionContent;
			var i;
		
			for (i = 0; i < actionArrayContent.length; ++i) {
		
				actionContent = actionArrayContent[i];
		
				createActionInfo(rtAll, actionContent, vocabularyID, vocaName, dbConn, scope, isPrivate, isValueListConverted);
			}
		}
		
		function createObjectInfos(rtAll, omArrayContent, vocabularyID, vocaName, scope, isPrivate, dbConn) {
		
			var objectModelContent;
			var i;
		
			for (i = 0; i < omArrayContent.length; ++i) {
				objectModelContent = omArrayContent[i];
				createObjectInfo(rtAll, objectModelContent, vocabularyID, vocaName, scope, isPrivate, dbConn);
			}
		}
		
		//This function creates output static parameter instance
		function createOutputStaticParam(rtAll, staticParamContent, outputID) {
		
			var prop = "";
			var staticParamID = infraUtilsBaseLib.createUUID();
			var outputStaticParams, name = "", mapping = "";
			
			for (prop in staticParamContent) {
				if (staticParamContent.hasOwnProperty(prop)) {
					switch (prop) {
						case vocabularyConstants.PROPERTY_NAME_OUTPUT_STATIC_PARAM_NAME:
							name = staticParamContent[prop];
							break;
						case vocabularyConstants.PROPERTY_NAME_OUTPUT_STATIC_PARAM_MAPPING:
							mapping = staticParamContent[prop];
							break;
					}
				}
			}
			outputStaticParams = new vocaObjects.OutputStaticParams(outputID, name, mapping, staticParamID);
			//Add to the runtime cache
			rtAll.allOutputsStaticParams = rtAll.allOutputsStaticParams ? rtAll.allOutputsStaticParams.concat([outputStaticParams]) : [outputStaticParams];
		}
		
		function createOutputStaticParams(rtAll, staticParamsArrayContent, outputID) {
		
			var staticParamContent;
			var i;
		
			for (i = 0; i < staticParamsArrayContent.length; ++i) {
				staticParamContent = staticParamsArrayContent[i];
				createOutputStaticParam(rtAll, staticParamContent, outputID);
			}
		}
		
		function createOutputRequiredParam(rtAll, paramContent, outputID, vocaName, dbConn) {
		
			var prop = "";
			var paramID = paramContent.id || infraUtilsBaseLib.createUUID();
			var outputRequiredParams, name = "", businessDataType = "", dataType = "", size = null, isCollection = null, description = null;
		
			autoCompleteBusinessDataType(paramContent, vocaName, dbConn);
			for (prop in paramContent) {
				if (paramContent.hasOwnProperty(prop)) {
					switch (prop) {
						case vocabularyConstants.PROPERTY_NAME_OUTPUT_PARAM_NAME:
							name = paramContent[prop];
							break;	
						case vocabularyConstants.PROPERTY_NAME_DESCRIPTION:
							description = paramContent[prop];
							break;
						case vocabularyConstants.PROPERTY_NAME_OUTPUT_PARAM_DATA_TYPE:
							dataType = paramContent[prop];
							break;
						case vocabularyConstants.PROPERTY_NAME_OUTPUT_PARAM_BUSINESS_DATA_TYPE:
							businessDataType = paramContent[prop];
							break;
						case vocabularyConstants.PROPERTY_NAME_OUTPUT_PARAM_SIZE:
							size = paramContent[prop];
							break;
						case vocabularyConstants.PROPERTY_NAME_IS_COLLECTION:
							isCollection = vocaUtilsBaseLib.convertBooleanToTinyInt(paramContent[prop]); //need to convert boolean to tiny int
							break;
					}
				}
			}
			outputRequiredParams = vocaObjects.getOutputParamsObj(outputID, name, dataType, size, businessDataType, isCollection, paramID, description);
			//Add to the runtime cache
			rtAll.allOutputsRequiredParams = rtAll.allOutputsRequiredParams ? rtAll.allOutputsRequiredParams.concat([outputRequiredParams]) : [outputRequiredParams];
		}
		
		function createOutputRequiredParams(rtAll, paramsArrayContent, outputID, vocaName, dbConn) {
		
			var paramContent;
			var i;
		
			for (i = 0; i < paramsArrayContent.length; ++i) {
				paramContent = paramsArrayContent[i];
				createOutputRequiredParam(rtAll, paramContent, outputID, vocaName, dbConn);
			}
		}
		
		function createOutputInfo(rtAll, outputContent, vocabularyID, vocaName, dbConn, scope, isPrivate, isValueListConverted, isVocaRuleOutput) {
		
			var outputID = null;
			var prop = "";
			var paramsArrayContent = "";
			var staticParamsArrayContent = "";
			var name = "", description = "", outputInfo;
			
			//in pure JSON flow the id is supplied in the outputContent (derived from oData that converted to JSON) 
			if(outputContent.hasOwnProperty(vocabularyConstants.ATT_ID)){
				outputID = outputContent[vocabularyConstants.ATT_ID];
			}
			//else - it is a hybrid flow, therefore the id should be created manually
			else{
				outputID = infraUtilsBaseLib.createUUID();
			}
		
			for (prop in outputContent) {
				if (outputContent.hasOwnProperty(prop)) {
					switch (prop) {
						case vocabularyConstants.PROPERTY_NAME_OUTPUT_NAME:
							name = outputContent[prop];
							break;
						case vocabularyConstants.PROPERTY_NAME_OUTPUT_DESCRIPTION:
							description = outputContent[prop];
							break;
						case vocabularyConstants.PROPERTY_NAME_OUTPUT_STATIC_PARAMS:
							staticParamsArrayContent = outputContent[prop];
							createOutputStaticParams(rtAll, staticParamsArrayContent, outputID);
							break;
						case vocabularyConstants.PROPERTY_NAME_OUTPUT_INPUT_PARAMS:
							paramsArrayContent = outputContent[prop];
							createOutputRequiredParams(rtAll, paramsArrayContent, outputID, vocaName, dbConn);
							break;
					}
				}
			}
			outputInfo = new vocaObjects.OutputInfo(vocabularyID, vocaName, outputID, name, scope, isPrivate, isValueListConverted, description);
			if(isVocaRuleOutput) {
			//Add to the runtime cache
				rtAll.allVocaRulesOutputs = rtAll.allVocaRulesOutputs ? rtAll.allVocaRulesOutputs.concat([outputInfo]) : [outputInfo];
			}
			else {
				rtAll.allOutputs = rtAll.allOutputs ? rtAll.allOutputs.concat([outputInfo]) : [outputInfo];
			}
		}
		
		function createOutputInfos(rtAll, outputArrayContent, vocabularyID, vocaName, dbConn, scope, isPrivate, isValueListConverted, isVocaRuleOutput) {
		
			var outputContent ;
			var i;
		
			for (i = 0; i < outputArrayContent.length; ++i) {
				outputContent = outputArrayContent[i];
				createOutputInfo(rtAll, outputContent, vocabularyID, vocaName, dbConn, scope, isPrivate, isValueListConverted, isVocaRuleOutput);
			}
		}
		
		function createAliasInfo(rtAll, aliasName, aliasContentInfo, validationResult, vocabularyID, scope, vocabularyFullName, isPrivate, isValueListConverted) {
		
			var aliasID = infraUtilsBaseLib.createUUID();
			var aliasInfo;
			var isCollection;
			var aliasContent;
			var aliasDesc = null;
			var aliasExternalMetadata = null;
			var aliasRenderingData = null;
		
			if (validationResult[businessLanguageConstantsLib.propertiesEnum.isCollection] === true) {
				isCollection = "1";
			} else {
				isCollection = "0";
			}
			if (aliasContentInfo[vocabularyConstants.PROPERTY_NAME_TYPE] === vocabularyConstants.ALIAS_CONTENT_DECISION_TABLE) {
				aliasContent = JSON.stringify(aliasContentInfo[vocabularyConstants.CONTENT]);
			} else {
				aliasContent = aliasContentInfo[vocabularyConstants.CONTENT];
			}
			if (aliasContentInfo[vocabularyConstants.PROPERTY_NAME_ALIAS_DESCRIPTION]){
				aliasDesc = aliasContentInfo[vocabularyConstants.PROPERTY_NAME_ALIAS_DESCRIPTION];
			}
			if (aliasContentInfo[vocabularyConstants.PROPERTY_NAME_ALIAS_EXTERNAL_METADATA]){
				aliasExternalMetadata = JSON.stringify(aliasContentInfo[vocabularyConstants.PROPERTY_NAME_ALIAS_EXTERNAL_METADATA]);
			}
			if (aliasContentInfo[vocabularyConstants.PROPERTY_NAME_ALIAS_RENDERING_DATA]){
				aliasRenderingData =  JSON.stringify(aliasContentInfo[vocabularyConstants.PROPERTY_NAME_ALIAS_RENDERING_DATA]);
			}
			aliasInfo = new vocaObjects.AliasInfo(
					vocabularyID,
					vocabularyFullName,
					aliasID,
					aliasName,
					aliasContent,
					validationResult[businessLanguageConstantsLib.propertiesEnum.businessType],
					isCollection,
					scope,
					isPrivate ? "1" : "0",
					aliasContentInfo[vocabularyConstants.PROPERTY_NAME_TYPE],
					aliasDesc,
					aliasExternalMetadata,
					aliasRenderingData,
					isValueListConverted
					);
			//Add to the runtime cache
			rtAll.allAliases = rtAll.allAliases ? rtAll.allAliases.concat([aliasInfo]) : [aliasInfo];
			//Also add to the voca cache.
			if (!rtAll.allVocabularies[vocabularyFullName].aliases) {
				rtAll.allVocabularies[vocabularyFullName].aliases = {};
			}
			rtAll.allVocabularies[vocabularyFullName].aliases[aliasName] = aliasInfo;
		}
		
		function getValidatorInstance(aliasType) {
		
			var validator;
		
			if (aliasType === vocabularyConstants.ALIAS_CONTENT_DECISION_TABLE) {
				validator = new ruleBodyValidatorLib.RuleBodyValidator();
			} else {
				validator = parser;
			}
			return validator;
		}
		
		function createAliasMap(aliasArrayContent) {
		
			var aliasMap = {};
			var aliasInstance;
			var aliasName;
			var aliasContent;
			var aliasType;
			var i;
			var aliasDesc;
			var aliasExternalMetadata;
			var aliasRenderingData;
		
			for (i = 0; i < aliasArrayContent.length; ++i) {
				aliasInstance = aliasArrayContent[i];
		
				//Auto complete alias type in case it's empty (backward compatibility with release 1, 2)
				vocUtilsLib.autoCompleteAliasType(aliasInstance);
		
				aliasName = aliasInstance[vocabularyConstants.PROPERTY_NAME_ALIAS_NAME];
				aliasContent = aliasInstance[vocabularyConstants.PROPERTY_NAME_ALIAS_CONTENT];
				aliasType = aliasInstance[vocabularyConstants.PROPERTY_NAME_ALIAS_TYPE];
				aliasDesc = aliasInstance[vocabularyConstants.PROPERTY_NAME_DESCRIPTION];
				aliasExternalMetadata = aliasInstance[vocabularyConstants.PROPERTY_NAME_ALIAS_EXTERNAL_METADATA];
			    aliasRenderingData = aliasInstance[vocabularyConstants.PROPERTY_NAME_ALIAS_RENDERING_DATA];
		
				aliasMap[aliasName] = {};
		
				aliasMap[aliasName][vocabularyConstants.IS_CREATED] = false;
				aliasMap[aliasName][vocabularyConstants.TYPE] = aliasType;
				aliasMap[aliasName][vocabularyConstants.CONTENT] = aliasContent;
				aliasMap[aliasName][vocabularyConstants.PROPERTY_NAME_DESCRIPTION] = aliasDesc;
				aliasMap[aliasName][vocabularyConstants.PROPERTY_NAME_ALIAS_EXTERNAL_METADATA] = aliasExternalMetadata;
				aliasMap[aliasName][vocabularyConstants.PROPERTY_NAME_ALIAS_RENDERING_DATA] = aliasRenderingData;
			}
			return aliasMap;
		}
		
		function validateAndCreateAlias(rtAll, aliasName, aliasContentInfo, aliasesMap, vocabularyID, vocabularyFullName, dbConn, avoidEndlessLoopAliases, isPrivate, resourceID, scope, isValueListConverted) {
		
			var unknownTokens = [];
			var unknownToken = null;
			var depAliasContent;
			var avoidEndlessLoopAliasesTmp;
			var dependencies = [];
			var aliasType;
			var standByMessages;
			var errorMessages, msg;
			var depOutput;
			var atLeastOneUnknownTokenIsAnAlias = false;
			var endlessLoopParam = null;
			var vocaRTServ = null;
		
			avoidEndlessLoopAliases[aliasName] = {};
			aliasType = aliasContentInfo[vocabularyConstants.PROPERTY_NAME_TYPE]; //expression or decision table
		
			var validator = getValidatorInstance(aliasType);
		
			//Don't load messages on response collector
			ResponseCollector.getInstance().hold();
			vocaRTServ = runtimeServicesLib.getVocabularyDataProvider(dbConn);
			var validationResult = vocUtilsLib.validateAliasContent(validator, aliasContentInfo[vocabularyConstants.CONTENT], vocabularyFullName, aliasType, vocaRTServ);
			standByMessages = ResponseCollector.getInstance().getStandByMessagesList();
			//Allow loads messages on response collector
			ResponseCollector.getInstance().unHold();
			if (vocUtilsLib.isAliasContentValid(validationResult, aliasType) === false) {
				unknownTokens = validationResult[businessLanguageConstantsLib.propertiesEnum.unknownTokens];
				if (unknownTokens.length === 0) {
					errorMessages = vocUtilsLib.collectErrorMessages(aliasType, validationResult, standByMessages);
					msg = vocUtilsLib.addErrorMessages("error_vocabulary_invalid_alias_content", errorMessages, aliasName);
					throw new hrfException.HrfException (msg, false);
				}
				for (unknownToken in unknownTokens) {
					if (unknownTokens.hasOwnProperty(unknownToken)) {
						//Self dependancy
						if (avoidEndlessLoopAliases.hasOwnProperty(unknownToken)) {
							endlessLoopParam = [unknownToken];
							continue;
						}
						//If the unknown token isn't an alias
						if (aliasesMap.hasOwnProperty(unknownToken) === false) {
							continue;
						}
						depAliasContent = aliasesMap[unknownToken];
						//Maybe was created in another token's round (that was depending on it)
						if (depAliasContent[vocabularyConstants.IS_CREATED] === true) {
							continue;
						}
						//Enforce send by value and not by reference
						avoidEndlessLoopAliasesTmp = JSON.parse(JSON.stringify(avoidEndlessLoopAliases));
						atLeastOneUnknownTokenIsAnAlias = true;
						dependencies = dependencies.concat(validateAndCreateAlias(rtAll, unknownToken, depAliasContent, aliasesMap, vocabularyID, vocabularyFullName, dbConn, avoidEndlessLoopAliasesTmp, isPrivate, resourceID, scope, isValueListConverted));
					}
				}
				if (atLeastOneUnknownTokenIsAnAlias === true && endlessLoopParam === null) {
					//Don't load messages on response collector
					ResponseCollector.getInstance().hold();
					validationResult = vocUtilsLib.reValidateAliasContent(validator, aliasContentInfo[vocabularyConstants.CONTENT], vocabularyFullName, aliasType, vocaRTServ);
					standByMessages = ResponseCollector.getInstance().getStandByMessagesList();
					//Allow loads messages on response collector
					ResponseCollector.getInstance().unHold();
					if (vocUtilsLib.isAliasContentValid(validationResult, aliasType) === false) {
						errorMessages = vocUtilsLib.collectErrorMessages(aliasType, validationResult, standByMessages);
						msg = vocUtilsLib.addErrorMessages("error_vocabulary_invalid_alias_content", errorMessages, aliasName, endlessLoopParam);
						throw new hrfException.HrfException (msg, false);
					}
					if (writeDependecies){
						depOutput = validationResult[dependencyConstantsLib.PROPERTY_NAME_DEPENDENCIES_OUTPUT];
						//Add dependencies
						if (depOutput !== null && depOutput !== undefined) {
							dependencies = dependencies.concat(dependencyUtilsLib.createDependenciesInVocabulary(
								vocabularyConstants.PROPERTY_NAME_ALIASES + "." + aliasName, vocabularyFullName, depOutput, isPrivate, dbConn));
						}
					}
				}
				else {
					errorMessages = vocUtilsLib.collectErrorMessages(aliasType, validationResult, standByMessages);
					msg = vocUtilsLib.addErrorMessages("error_vocabulary_invalid_alias_content", errorMessages, aliasName, endlessLoopParam);
					throw new hrfException.HrfException (msg, false);
				}
			} else {
				if (writeDependecies){
					//Add dependencies
					depOutput = validationResult[dependencyConstantsLib.PROPERTY_NAME_DEPENDENCIES_OUTPUT];
					if (depOutput !== null && depOutput !== undefined) {
			
						dependencies = dependencies.concat(dependencyUtilsLib.createDependenciesInVocabulary(
							vocabularyConstants.PROPERTY_NAME_ALIASES + "." + aliasName, vocabularyFullName, depOutput, isPrivate, dbConn));
					}
				}
			}
			createAliasInfo(rtAll, aliasName, aliasContentInfo, validationResult, vocabularyID, scope, vocabularyFullName, isPrivate, isValueListConverted);
			aliasContentInfo[vocabularyConstants.IS_CREATED] = true;
			return dependencies;
		}
		
		function validateAndCreateAliasInfos(rtAll, aliasArray, vocabularyID, vocabularyFullName, dbConn, isPrivate, resourceID, scope, isValueListConverted) {
			
			runtimeServicesUtilsLib.loadAllAliases(rtAll.allVocabularies[vocabularyFullName], rtAll.allAliases, runtimeServicesLib.getVocabularyDataProvider(dbConn));
		
			var aliasesMap = createAliasMap(aliasArray);
			var aliasContentInfo;
			var aliasName = "";
			var avoidEndlessLoopAliases = {};
			var dependencies = [];
		
			for (aliasName in aliasesMap) {
				if (aliasesMap.hasOwnProperty(aliasName)) {
					aliasContentInfo = aliasesMap[aliasName];
					if (aliasContentInfo[vocabularyConstants.IS_CREATED] === false) {
						dependencies = dependencies.concat(validateAndCreateAlias(rtAll, aliasName, aliasContentInfo, aliasesMap, vocabularyID, vocabularyFullName, dbConn, avoidEndlessLoopAliases, isPrivate, resourceID, scope, isValueListConverted));
					}
					avoidEndlessLoopAliases = {};
				}
			}
			if (writeDependecies && dependencies.length > 0) {
				dependecyManager.getInstance(dbConn).setDependencies(resourceID, dependencies);
			}
		}
		
		function createValueListInfo(rtAll, valueListName, valueList, vocabularyID, vocaName, scope, isPrivate) {
		
			var valueListID = infraUtilsBaseLib.createUUID();
			var valueListInfo;
			var descriptionColumn = null;
			var mappingInfo = null;
			var size = null;
			var businessDataType = null;
			var metaData = null;
			
			if (valueList[vocabularyConstants.PROPERTY_NAME_BUSINESS_DATA_TYPE]) {					//get BussinessDataType
				businessDataType = valueList[vocabularyConstants.PROPERTY_NAME_BUSINESS_DATA_TYPE];
			} else {
				businessDataType = vocUtilsLib.getBusinessDataType(valueList[vocabularyConstants.PROPERTY_NAME_DATA_TYPE]);
			}
			if (valueList.hasOwnProperty(vocabularyConstants.PROPERTY_VALUE_LIST_METADATA)&& valueList[vocabularyConstants.PROPERTY_VALUE_LIST_METADATA]){
				metaData = valueList[vocabularyConstants.PROPERTY_VALUE_LIST_METADATA];
				valueListInfo = new vocaObjects.ExternalValueListInfo(
						vocabularyID,
						vocaName,
						valueListName,
						businessDataType,
						scope,
						isPrivate ?  '1' : '0',
						metaData
					);
			}else{		//native value list						
				mappingInfo = valueList[vocabularyConstants.PROPERTY_VALUE_LIST_MAPPING_INFO];
				if (mappingInfo.hasOwnProperty(vocabularyConstants.PROPERTY_VALUE_LIST_DESCRIPTION_COLUMN) && mappingInfo[vocabularyConstants.PROPERTY_VALUE_LIST_DESCRIPTION_COLUMN] !== null) {
					descriptionColumn = mappingInfo[vocabularyConstants.PROPERTY_VALUE_LIST_DESCRIPTION_COLUMN];
				}
				if (valueList.hasOwnProperty(vocabularyConstants.PROPERTY_NAME_SIZE) && valueList[vocabularyConstants.PROPERTY_NAME_SIZE] !== null) {
					size = valueList[vocabularyConstants.PROPERTY_NAME_SIZE];
				}
				valueListInfo = new vocaObjects.InternalValueListInfo(
					vocabularyID,
					vocaName,
					valueListID,
					valueListName,
					mappingInfo[vocabularyConstants.PROPERTY_VALUE_LIST_SCHEMA],
					mappingInfo[vocabularyConstants.PROPERTY_VALUE_LIST_NAME],
					valueList[vocabularyConstants.PROPERTY_NAME_DATA_TYPE],
					businessDataType,
					size,
					mappingInfo[vocabularyConstants.PROPERTY_VALUE_LIST_VALUE_COLUMN],
					descriptionColumn,
					scope,
					isPrivate ?  '1' : '0',
					mappingInfo[vocabularyConstants.PROPERTY_VALUE_LIST_TYPE]
				);
			}
			
			//Add to the runtime cache
			rtAll.allValueLists = rtAll.allValueLists ? rtAll.allValueLists.concat([valueListInfo]) : [valueListInfo];
		}
		
		function validateAndCreateValueListInfos(rtAll, valueListMap, vocabularyID, vocaName, scope, isPrivate) {
		
			var valueList;
			var valueListName = "";
		
			for (valueListName in valueListMap) {
				if (valueListMap.hasOwnProperty(valueListName)) {
					valueList = valueListMap[valueListName];
					createValueListInfo(rtAll, valueListName, valueList, vocabularyID, vocaName, scope, isPrivate);
				}
			}
		}
		
		function validateDataObjectAssociations(associationsArray, objectName, vocabularyFullName, dbConn, isPrivate) {
		
			var associationObject;
			var attMappingsArray;
			var attMapping;
			var targetAssocObject;
			var targetAttr;
			var params = [];
			var i, j;
			var vocabularyDataProvider = runtimeServicesLib.getVocabularyDataProvider(dbConn);
			var dependencies = [];
			var dependency;
			var doInfo;
			var associationsPath = vocabularyConstants.PROPERTY_NAME_DATA_OBJECTS + "." + objectName + "." + vocabularyConstants.PROPERTY_NAME_OM_ASSOCIATIONS;
			var targetDataObjectPath;
			var targetDOAttrPath;
			var msgObj;
		
			for (i = 0; i < associationsArray.length; i++) {
				associationObject = associationsArray[i];
				targetAssocObject = associationObject[vocabularyConstants.PROPERTY_NAME_OM_ASSOC_TARGET];
				targetDataObjectPath = vocabularyConstants.PROPERTY_NAME_DATA_OBJECTS + "." + targetAssocObject;
				doInfo = vocabularyDataProvider.getObject(vocabularyFullName, targetAssocObject);
		
				if (!doInfo) {
					params = [objectName, associationsArray[i].name];
					msgObj = ResponseCollector.getInstance().addMessage("error_vocabulary_invalid_association", params);
					throw new hrfException.HrfException (JSON.stringify(msgObj), false);
				} else if (writeDependecies && (!isPrivate || doInfo.vocaName !== vocabularyFullName)) {
					// Add dependencies to target data object
					if (doInfo.vocaName !== vocabularyFullName) {
						// target data object exist in different vocabulary (due to
						// scopping) --> add dependecy to vocab resource
						dependency = dependencyUtilsLib.createDependencyInVocabulary(
							dependencyConstantsLib.PROPERTY_NAME_EMPTY_PATH, doInfo.vocaName,
							dependencyConstantsLib.PROPERTY_NAME_EMPTY_PATH, dbConn);
						dependencies.push(dependency);
					}
					dependency = dependencyUtilsLib.createDependencyInVocabulary(associationsPath + "." + associationObject[vocabularyConstants.PROPERTY_NAME_NAME], doInfo.vocaName, targetDataObjectPath, dbConn);
					dependencies.push(dependency);
					//Add dependency also for mappingInfo
					dependency = dependencyUtilsLib.createDependencyInVocabulary(associationsPath + "." + associationObject[vocabularyConstants.PROPERTY_NAME_NAME], doInfo.vocaName, targetDataObjectPath + "." +
						vocabularyConstants.PROPERTY_NAME_OM_MAPPING_INFO, dbConn);
					dependencies.push(dependency);
				}
		
				attMappingsArray = associationObject[vocabularyConstants.PROPERTY_NAME_OM_ASSOC_ATTR_MAPPINGS];
				targetDOAttrPath = targetDataObjectPath + "." + vocabularyConstants.PROPERTY_NAME_ATTRIBUTES;
				for (j = 0; j < attMappingsArray.length; j++) {
					attMapping = attMappingsArray[j];
					targetAttr = attMapping[vocabularyConstants.PROPERTY_NAME_OM_ASSOC_ATTR_MAPPINGS_TARGET];
					if (vocabularyDataProvider.getAttribute(vocabularyFullName, targetAssocObject, targetAttr) === null) {
						params = [associationObject[vocabularyConstants.PROPERTY_NAME_OM_ASSOC_NAME], targetAttr];
						msgObj = ResponseCollector.getInstance().addMessage("error_vocabulary_invalid_assoc_attr", params);
						throw new hrfException.HrfException (JSON.stringify(msgObj), false);
					} else if (writeDependecies && (!isPrivate || doInfo.vocaName !== vocabularyFullName)) {
						// Add dependencies to target DO attributes
						dependency = dependencyUtilsLib.createDependencyInVocabulary(associationsPath + "." + associationObject[vocabularyConstants.PROPERTY_NAME_NAME], doInfo.vocaName, targetDOAttrPath + "." + targetAttr, dbConn);
						dependencies.push(dependency);
					}
				}
			}
			return dependencies;
		}
		
		function validateDataObjectsAssociations(resourceContent, vocabularyFullName, dbConn, isPrivate, resourceID) {
		
			var i;
			var associationsArray;
			var dataObject;
			var dependencies = [];
			var vocObjArr = resourceContent[vocabularyConstants.PROPERTY_NAME_DATA_OBJECTS];
		
			if (vocObjArr.length > 0) {
				for (i = 0; i < vocObjArr.length; i++) {
					dataObject = vocObjArr[i];
					if (vocObjArr[i].hasOwnProperty([vocabularyConstants.PROPERTY_NAME_OM_ASSOCIATIONS])) {
						associationsArray = vocObjArr[i][vocabularyConstants.PROPERTY_NAME_OM_ASSOCIATIONS];
						dependencies = dependencies.concat(validateDataObjectAssociations(associationsArray,
							dataObject[vocabularyConstants.PROPERTY_NAME_OM_NAME], vocabularyFullName, dbConn, isPrivate));
					}
				}
				if (writeDependecies && dependencies.length > 0) {
					dependecyManager.getInstance(dbConn).setDependencies(resourceID, dependencies);
				}
			}
		}
		
		function validateDataObjectValueListAttributes(attributesArray, objectName, vocabularyFullName, dbConn) {
			var attributeObject;
			var params = [];
			var i;
			var vocabularyDataProvider = runtimeServicesLib.getVocabularyDataProvider(dbConn);
			var dependencies = [];
			var dependency;
			var valueList;
			var attributesPath = vocabularyConstants.PROPERTY_NAME_DATA_OBJECTS + "." + objectName + "." + vocabularyConstants.PROPERTY_NAME_OM_ATTRIBUTES + ".";
			var valueListName;
			var attrName;
			var valueListPath = vocabularyConstants.PROPERTY_NAME_VALUE_LISTS + ".";
		
			for (i = 0; i < attributesArray.length; i++) {
				attributeObject = attributesArray[i];
				if (!attributeObject[vocabularyConstants.PROPERTY_NAME_VALUE_LIST]) {
					continue;
				}
				valueListName = attributeObject[vocabularyConstants.PROPERTY_NAME_VALUE_LIST];
				valueList = vocabularyDataProvider.getValueList(vocabularyFullName, valueListName);
				attrName = attributeObject[vocabularyConstants.PROPERTY_NAME_NAME];
				if (!valueList) {
					params = [valueListName, attrName, objectName];
					ResponseCollector.getInstance().addMessage("error_vocabulary_value_list_does_not_exist", params);
					throw new hrfException.HrfException ("error_vocabulary_value_list_does_not_exist", false);
				}
				// target data object exist in different vocabulary (due to scopping) --> add dependecy to vocab resource
				if(writeDependecies){
					dependency = dependencyUtilsLib.createDependencyInVocabulary(
						attributesPath + attrName, valueList.vocaName,
						valueListPath + valueListName, dbConn);
					dependencies.push(dependency);
				}
			}
			return dependencies;
		}
		
		function validateDataObjectsValueListAttributes(resourceContent, vocabularyFullName, dbConn, isPrivate, resourceID) {
		
			var i;
			var attributesArray;
			var dataObject;
			var dependencies = [];
			var vocObjArr = resourceContent[vocabularyConstants.PROPERTY_NAME_DATA_OBJECTS];
		
			if (vocObjArr.length > 0) {
				for (i = 0; i < vocObjArr.length; i++) {
					dataObject = vocObjArr[i];
					if (vocObjArr[i].hasOwnProperty([vocabularyConstants.PROPERTY_NAME_OM_ATTRIBUTES])) {
						attributesArray = vocObjArr[i][vocabularyConstants.PROPERTY_NAME_OM_ATTRIBUTES];
						dependencies = dependencies.concat(validateDataObjectValueListAttributes(attributesArray,
							dataObject[vocabularyConstants.PROPERTY_NAME_OM_NAME], vocabularyFullName, dbConn, isPrivate));
					}
				}
				if (writeDependecies && dependencies.length > 0) {
					dependecyManager.getInstance(dbConn).setDependencies(resourceID, dependencies);
				}
			}
		}
		
		//This function creates a single AdvancedFunctions instance 
		function createAdvancedFunctionInfo(rtAll, advancedFunctionContent, vocabularyID, vocaName, scope, isPrivate) {
			
			var prop = "";
			var id = infraUtilsBaseLib.createUUID();
			var name = "";
			var advancedFunctionInfo;
			
			for(prop in advancedFunctionContent){
				if (advancedFunctionContent.hasOwnProperty(prop)) {
					switch(prop){
						case vocabularyConstants.PROPERTY_NAME_ADVANCED_FUNCTION_NAME:
							name = advancedFunctionContent[prop];
							break;
					}
				}
			}
			advancedFunctionInfo = new vocaObjects.AdvancedFunctionInfo(id, name, vocabularyID, vocaName, scope, isPrivate);
			//Add to the runtime cache
			rtAll.allAdvancedFunctions = rtAll.allAdvancedFunctions ? rtAll.allAdvancedFunctions.concat([advancedFunctionInfo]) : [advancedFunctionInfo];
		}
		
		//This function creates AdvancedFunctions instances
		function createAdvancedFunctionInfos(rtAll, vocabularyAdvancedFunctions, vocabularyID, vocaName, scope, isPrivate) {
			var advancedFunctionContent;
			var i;
			
			for(i = 0; i < vocabularyAdvancedFunctions.length; i++){
				advancedFunctionContent = vocabularyAdvancedFunctions[i];
				createAdvancedFunctionInfo(rtAll, advancedFunctionContent, vocabularyID, vocaName, scope, isPrivate);
			}
		}
		
		scope = vocUtilsLib.calculateScope(resourceContent, vocabularyFullName, dbConn);
		//scope and isValueListConverted are evaluated in the following function:
		createVocaInfo(rtAll, vocabularyFullName, resourceContent, resourceID, isPrivate, vocabularyID, versionId, scope);
	
		if (resourceContent.hasOwnProperty(vocabularyConstants.PROPERTY_NAME_VALUE_LISTS)) {
			validateAndCreateValueListInfos(rtAll, resourceContent[vocabularyConstants.PROPERTY_NAME_VALUE_LISTS], vocabularyID, vocabularyFullName, scope, isPrivate);
		}
		if (resourceContent.hasOwnProperty(vocabularyConstants.PROPERTY_NAME_DATA_OBJECTS)) {
			createObjectInfos(rtAll, resourceContent[vocabularyConstants.PROPERTY_NAME_DATA_OBJECTS], vocabularyID, vocabularyFullName, scope, isPrivate, dbConn);
			termGeneratorLib.generate(rtAll, resourceContent[vocabularyConstants.PROPERTY_NAME_DATA_OBJECTS], vocabularyFullName, vocabularyID, dbConn, isPrivate, resourceID, scope, writeDependecies);
		}
		if (resourceContent.hasOwnProperty(vocabularyConstants.PROPERTY_NAME_ALIASES)) {
			validateAndCreateAliasInfos(rtAll, resourceContent[vocabularyConstants.PROPERTY_NAME_ALIASES], vocabularyID, vocabularyFullName, dbConn, isPrivate, resourceID, scope, isValueListConverted);
		}
		if (resourceContent.hasOwnProperty(vocabularyConstants.PROPERTY_NAME_DATA_OBJECTS)) {
			//Validate associations against all vocabularies from the same scope
			validateDataObjectsAssociations(resourceContent, vocabularyFullName, dbConn, isPrivate, resourceID);
			//Validate attributes with value list against all vocabularies from the same scope
			validateDataObjectsValueListAttributes(resourceContent, vocabularyFullName, dbConn, isPrivate, resourceID);
		}
		if (resourceContent.hasOwnProperty(vocabularyConstants.PROPERTY_NAME_ACTIONS)) {
			//Validate the expressions in the action parameters
			validateMapping(dbConn, vocabularyFullName, resourceContent[vocabularyConstants.PROPERTY_NAME_ACTIONS], vocabularyConstants.PROPERTY_NAME_ACTIONS, isPrivate, resourceID, false);
			createActionInfos(rtAll, resourceContent[vocabularyConstants.PROPERTY_NAME_ACTIONS], vocabularyID, vocabularyFullName, dbConn, scope, isPrivate, isValueListConverted);
		}
		if (resourceContent.hasOwnProperty(vocabularyConstants.PROPERTY_NAME_OUTPUTS)) {
	
			//Validate the expressions in the output parameters
			validateMapping(dbConn, vocabularyFullName, resourceContent[vocabularyConstants.PROPERTY_NAME_OUTPUTS], vocabularyConstants.PROPERTY_NAME_OUTPUTS, isPrivate, resourceID, true);
			createOutputInfos(rtAll, resourceContent[vocabularyConstants.PROPERTY_NAME_OUTPUTS], vocabularyID, vocabularyFullName, dbConn, scope, isPrivate, isValueListConverted, false);
			if(resourceContent.hasOwnProperty(vocabularyConstants.PROPERTY_NAME_VOCA_RULES_OUTPUTS)){
				createOutputInfos(rtAll, resourceContent[vocabularyConstants.PROPERTY_NAME_VOCA_RULES_OUTPUTS], vocabularyID, vocabularyFullName, dbConn, scope, isPrivate, isValueListConverted, true);
			}
		}
		if(resourceContent.hasOwnProperty(vocabularyConstants.PROPERTY_NAME_ADVANCED_FUNCTION)){
			createAdvancedFunctionInfos(rtAll, resourceContent[vocabularyConstants.PROPERTY_NAME_ADVANCED_FUNCTION], vocabularyID, vocabularyFullName, scope, isPrivate);
		}
	};
	
	
	return {
		JSONLoaderLib: JSONLoaderLib
	}; 

	
}());