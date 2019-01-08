jQuery.sap.declare("sap.rules.ui.parser.resources.common.lib.resourcesConvertor");

/*******************************************************************************
 * Import relevant libraries
 ******************************************************************************/
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.validationUtils");
jQuery.sap.require("sap.rules.ui.parser.resources.common.lib.oDataHandler");
jQuery.sap.require("sap.rules.ui.parser.infrastructure.util.utilsBase");

/*******************************************************************************
 ******************************************************************************/

/*******************************************************************************
 * Exposed object
 *******************************************************************************/
sap.rules.ui.parser.resources.common.lib.resourcesConvertor = sap.rules.ui.parser.resources.common.lib.resourcesConvertor|| {}; 
sap.rules.ui.parser.resources.common.lib.resourcesConvertor.lib = (function() {

	var oDataHandlerLib = sap.rules.ui.parser.resources.common.lib.oDataHandler.lib;
	var utilsBaseLib = new sap.rules.ui.parser.infrastructure.util.utilsBase.lib.utilsBaseLib();
	var validationUtils = sap.rules.ui.parser.resources.vocabulary.lib.validationUtils.lib;
	// Use help methods from oData handler
	var getOdataPropName = oDataHandlerLib.getOdataPropName;
	var getOdataPropertyValue = oDataHandlerLib.getOdataPropertyValue;
	var getEnumPropertyValue = oDataHandlerLib.getEnumPropertyValue;
	var byDescModeIsOn = false;
	
	/*******************************************************************************
	 * Help methods
	 *******************************************************************************/

	/**
	 * This method receives an oData format column and returns a new column object in our
	 * internal model format
	 * 
	 * @param oDColumn - column object in its oData format
	 * @param fixedOperatorsMap - a map from column ids to a relevant fixed operator (if exist), to be
	 *        filled by reference here - for the given column
	 * @returns - a new internal model format column object
	 */
	function createInternalModelColumn(oDColumn, fixedOperatorsMap, headerTypesMap, jsonPathPrefix) {
		var imHeader, resultPropName, conditionPropName, fixedOperator;
		var columnId = getOdataPropertyValue(oDColumn, oDataHandlerLib.PROPERTY_NAME_ID);
		
		if (getOdataPropertyValue(oDColumn, oDataHandlerLib.PROPERTY_NAME_TYPE) === oDataHandlerLib.TYPE_CONDITION) {
			imHeader = {
				colID : columnId,
				type : "condition",
				expression : "",
				alias : ""
			};

			conditionPropName = getOdataPropName(oDColumn, oDataHandlerLib.PROPERTY_NAME_CONDITION);
			jsonPathPrefix = utilsBaseLib.buildJsonPath(jsonPathPrefix, conditionPropName);
			imHeader.inputModelPath = jsonPathPrefix;
			
			imHeader.expression = getOdataPropertyValue(oDColumn[conditionPropName], oDataHandlerLib.PROPERTY_NAME_EXPRESSION);
			
			// ********************************************
			// Workaround to support boolean header = true, till parser fix
			if (imHeader.expression === 'true') {
				imHeader.expression = '';
			}
			// ********************************************

			// Map current fixed operator value to column id
			fixedOperator = getOdataPropertyValue(oDColumn[conditionPropName], oDataHandlerLib.PROPERTY_NAME_FIXED_OPERATOR);
			
			if (fixedOperator !== undefined) {
				imHeader.fixedOperator = {};
				imHeader.fixedOperator.operator = fixedOperator;
				fixedOperatorsMap[columnId] = fixedOperator + ' ';
			}
		} else if (getOdataPropertyValue(oDColumn, oDataHandlerLib.PROPERTY_NAME_TYPE) === oDataHandlerLib.TYPE_RESULT) {
			imHeader = {
				colID : columnId,
				name : "",
				type : "output",
				businessDataType : ""
			};
			
			resultPropName = getOdataPropName(oDColumn, oDataHandlerLib.PROPERTY_NAME_RESULT);
			
			imHeader.businessDataType = getOdataPropertyValue(oDColumn[resultPropName], oDataHandlerLib.PROPERTY_NAME_BUSINESS_DATA_TYPE);
			imHeader.name = getOdataPropertyValue(oDColumn[resultPropName], oDataHandlerLib.PROPERTY_NAME_DO_ATTRIBUTE_NAME);
//			var propName;
//			propName = getOdataPropName(oDColumn[resultPropName], oDataHandlerLib.PROPERTY_NAME_IS_COLLECTION);
//			if (propName) {
//				// If isCollection is given - convert it
//				imHeader.isCollection = oDColumn[resultPropName][propName];
//			}
		}
		
		//Map header type to column id
		headerTypesMap[columnId] = imHeader.type; 
		
		return imHeader;
	}

	/**
	 * This method receives an oData format row and returns a new row object in our
	 * internal model format
	 * 
	 * @param oDRow - row object in its oData format
	 * @param fixedOperatorsMap - a map from column ids to a relevant fixed operator (if exist), to concatenate the
	 *        current cell column's fixed operator, to the cell's expression 
	 * @returns - a new internal model format row object
	 */
	function createInternalModelRow(oDRow, headerTypesMap, jsonPathPrefix) {
		var jsonPath, imCells, imCell, headerType, cellContent, cellsPropName, isEmptyRow = true;
		var imRow = {
			rowID : 0,
			row : []
		};
		
		imRow.rowID = getOdataPropertyValue(oDRow, oDataHandlerLib.PROPERTY_NAME_ID);
		// Rule decision table cells
		cellsPropName = getOdataPropName(oDRow, oDataHandlerLib.PROPERTY_NAME_CELLS);
		imCells = getOdataPropertyValue(oDRow, oDataHandlerLib.PROPERTY_NAME_CELLS);
		
		if (imCells) {
			imCells.forEach(function(oODCell, index) {
				jsonPath = utilsBaseLib.buildJsonPath(jsonPathPrefix, cellsPropName, index);
				imCell = {
					colID : 0,
					content : ""
				};

				imCell.colID = getOdataPropertyValue(oODCell, oDataHandlerLib.PROPERTY_NAME_COLUMN_ID);
				cellContent = getOdataPropertyValue(oODCell, oDataHandlerLib.PROPERTY_NAME_CONTENT);
				headerType = headerTypesMap[imCell.colID];
				
				// Updating indicator for empty row
				if (isEmptyRow && cellContent) {
					isEmptyRow = false;
				}
				
				// Handling output empty cells with null
				imCell.inputModelPath = jsonPath;
				//imCell.content = (headerType === 'output' && !cellContent)? null: fixedOperator + cellContent; 
				imCell.content = (headerType === 'output' && !cellContent)? null: cellContent;
				
				// Removing condition empty cells 
				if(!(headerType === 'condition' && !cellContent)){
					imRow.row.push(imCell);
				}
			});
		}
		
		if(isEmptyRow){
			return null;
		}
		
		return imRow;
	}

	function getDataObjectNameById(oDataVocaDOarr, targetDataObjId){
		
		var i;
		var propName = null;
		var dataObjName = null;
		var dataObj = null;
		
		for(i = 0; i < oDataVocaDOarr.length; i++){
			dataObj = oDataVocaDOarr[i];
			propName = getOdataPropName(dataObj, oDataHandlerLib.PROPERTY_NAME_USAGE);
			if(propName && dataObj[propName] === oDataHandlerLib.TYPE_DO){
				propName = getOdataPropName(dataObj, oDataHandlerLib.PROPERTY_NAME_ID);
				if(propName && dataObj[propName] === targetDataObjId){
					dataObjName = getOdataPropertyValue(dataObj, oDataHandlerLib.PROPERTY_NAME_NAME);
					break;
				}
			}
		}
		
		return dataObjName;
	}

	function convertTheAttributeMappingsObj(oDataAttributeMappingsObj, hrfAttributeMappingsArr) {
		var newAttrMappingObj = {};

		newAttrMappingObj.source = getOdataPropertyValue(oDataAttributeMappingsObj,
				oDataHandlerLib.PROPERTY_NAME_ATTRIBUTE_MAPPINGS_SOURCE);

		newAttrMappingObj.target = getOdataPropertyValue(oDataAttributeMappingsObj,
				oDataHandlerLib.PROPERTY_NAME_ATTRIBUTE_MAPPINGS_TARGET);

		hrfAttributeMappingsArr.push(newAttrMappingObj);
	}

	function convertToDataObjectAttribute(attrObj, convertedAttributesArr, parentDOname, validationUtilsLib) {

		var propName = null;
		var sizeAttr = null;
		var businessDataType = null;
		var newConvertedAttrObj = {};
		newConvertedAttrObj.name = getOdataPropertyValue(attrObj, oDataHandlerLib.PROPERTY_NAME_NAME);
		if(byDescModeIsOn){
			newConvertedAttrObj.description = getOdataPropertyValue(attrObj, oDataHandlerLib.PROPERTY_NAME_DESCRIPTION);
			validationUtilsLib.validateDescription(newConvertedAttrObj, oDataHandlerLib.PROPERTY_NAME_ATTRIBUTE, parentDOname);
		}
		propName = getOdataPropName(attrObj, oDataHandlerLib.PROPERTY_NAME_MAPPING_INFO);
		// Mapping info is optional for an attribute
		if (propName){
			newConvertedAttrObj.dataMapping = {};
			//Check if mappingInfo section contains the compilation info 
			var dataTypeAttr = getOdataPropName(attrObj[propName], oDataHandlerLib.PROPERTY_NAME_DATA_TYPE);
			if(dataTypeAttr){
				newConvertedAttrObj.dataType = getOdataPropertyValue(attrObj[propName], oDataHandlerLib.PROPERTY_NAME_DATA_TYPE);
				newConvertedAttrObj.dataMapping.column = getOdataPropertyValue(attrObj[propName], 'column');
				sizeAttr = getOdataPropName(attrObj[propName], oDataHandlerLib.PROPERTY_NAME_SIZE);
				if (sizeAttr) {
					// Size isn't mandatory for all data types
					newConvertedAttrObj.size = getOdataPropertyValue(attrObj[propName], oDataHandlerLib.PROPERTY_NAME_SIZE);					
				}
			}
			else{
				//Backward compatibility - one of the old versions had dataMapping section with a 'name' property that should be mapped to 'column':
				newConvertedAttrObj.dataMapping.column = getOdataPropertyValue(attrObj[propName], oDataHandlerLib.PROPERTY_NAME_NAME);
				newConvertedAttrObj.dataType = getOdataPropertyValue(attrObj, oDataHandlerLib.PROPERTY_NAME_DATA_TYPE);
				sizeAttr = getOdataPropName(attrObj, oDataHandlerLib.PROPERTY_NAME_SIZE);
				if (sizeAttr) {
					// Size isn't mandatory for all data types
					newConvertedAttrObj.size = attrObj[sizeAttr];			
				}
			}
		}
		else{
			//Backward compatibility - an old version that didnt had a 'dataMapping' section at all:
			newConvertedAttrObj.dataType = getOdataPropertyValue(attrObj, oDataHandlerLib.PROPERTY_NAME_DATA_TYPE);
			sizeAttr = getOdataPropName(attrObj, oDataHandlerLib.PROPERTY_NAME_SIZE);
			if (sizeAttr) {
				// Size isn't mandatory for all data types
				newConvertedAttrObj.size = attrObj[sizeAttr];			
			}
		}
		businessDataType = getOdataPropertyValue(attrObj, oDataHandlerLib.PROPERTY_NAME_BUSINESS_DATA_TYPE);
		propName = getOdataPropName(attrObj, oDataHandlerLib.PROPERTY_NAME_VALUE_HELP_ID);
		if(propName && attrObj[propName]){
			validationUtilsLib.validateValueHelpBusinessDataType(attrObj[propName], businessDataType);
			newConvertedAttrObj.valueList = attrObj[propName];
		}else{
			newConvertedAttrObj.businessDataType = businessDataType;
		}
		// Add hard coded sourceType 
		newConvertedAttrObj.sourceType = oDataHandlerLib.SOURCE_TYPE_DATA;
		convertedAttributesArr.push(newConvertedAttrObj);
	}

	function convertToDataObjectAssociation(oDataVocaDOarr, assocObj, convertedAssociationsArr, parentDOname, validationUtilsLib) {

		var propName = null;
		var newConvertedAssocObj = {};

		newConvertedAssocObj.name = getOdataPropertyValue(assocObj, oDataHandlerLib.PROPERTY_NAME_NAME);
		if(byDescModeIsOn){
			newConvertedAssocObj.description = getOdataPropertyValue(assocObj, oDataHandlerLib.PROPERTY_NAME_DESCRIPTION);
			validationUtilsLib.validateDescription(newConvertedAssocObj, oDataHandlerLib.PROPERTY_NAME_ASSOCIATION, parentDOname);
		}
		propName = getOdataPropName(assocObj, oDataHandlerLib.PROPERTY_NAME_TARGET_DATA_OBJECT_ID);
		newConvertedAssocObj.target = getDataObjectNameById(oDataVocaDOarr, assocObj[propName]);
		newConvertedAssocObj.cardinality = getEnumPropertyValue(assocObj, oDataHandlerLib.PROPERTY_NAME_CARDINALITY);
		// Convert the attributeMappings
		newConvertedAssocObj.attributeMappings = [];
		propName = getOdataPropName(assocObj, oDataHandlerLib.PROPERTY_NAME_ATTRIBUTE_MAPPINGS);
		if (propName && assocObj[propName] && Array.isArray(assocObj[propName])) {
			assocObj[propName].forEach(function(attrMappingsObj) {
				convertTheAttributeMappingsObj(attrMappingsObj, newConvertedAssocObj.attributeMappings);
			});
		}

		convertedAssociationsArr.push(newConvertedAssocObj);
	}

	function convertToOutput(attrObj, convertedOutputInputParamsArr) {
        var newConvertedInputParam = {};
        var sizeAttr;
           
        newConvertedInputParam.name = getOdataPropertyValue(attrObj, oDataHandlerLib.PROPERTY_NAME_NAME);
        newConvertedInputParam.description = getOdataPropertyValue(attrObj, oDataHandlerLib.PROPERTY_NAME_DESCRIPTION);
        newConvertedInputParam.businessDataType = getOdataPropertyValue(attrObj,
                                                        oDataHandlerLib.PROPERTY_NAME_BUSINESS_DATA_TYPE);
        
        var propName = getOdataPropName(attrObj, oDataHandlerLib.PROPERTY_NAME_MAPPING_INFO); 
        // Mapping info is optional for an attribute
        if (propName){
              newConvertedInputParam.dataMapping = {};
              //Check if mappingInfo section contains the compilation info 
              var dataTypeAttr = getOdataPropName(attrObj[propName], oDataHandlerLib.PROPERTY_NAME_DATA_TYPE);
              if(dataTypeAttr){
                    newConvertedInputParam.dataType = getOdataPropertyValue(attrObj[propName], oDataHandlerLib.PROPERTY_NAME_DATA_TYPE);
                    sizeAttr = getOdataPropName(attrObj[propName], oDataHandlerLib.PROPERTY_NAME_SIZE);
                    if (sizeAttr) {
                          // Size isn't mandatory for all data types
                          newConvertedInputParam.size = getOdataPropertyValue(attrObj[propName], oDataHandlerLib.PROPERTY_NAME_SIZE);                         
                    }
              }
        }
        else{
              newConvertedInputParam.dataType = getOdataPropertyValue(attrObj, oDataHandlerLib.PROPERTY_NAME_DATA_TYPE);
              newConvertedInputParam.size = getOdataPropertyValue(attrObj, oDataHandlerLib.PROPERTY_NAME_SIZE);
        }
        newConvertedInputParam.id = attrObj.Id; 
        convertedOutputInputParamsArr.push(newConvertedInputParam);
	}

	function convertMappingInfoObj(oDataMappingInfoObj, hrfMappingInfoObj){
		var propName = null;

		hrfMappingInfoObj.name = getOdataPropertyValue(oDataMappingInfoObj, oDataHandlerLib.PROPERTY_NAME_NAME);
		hrfMappingInfoObj.type = getOdataPropertyValue(oDataMappingInfoObj, oDataHandlerLib.PROPERTY_NAME_TYPE);

		// Schema is optional
		propName = getOdataPropName(oDataMappingInfoObj, oDataHandlerLib.PROPERTY_NAME_SCHEMA);
		hrfMappingInfoObj.schema = "";
		if (oDataMappingInfoObj[propName]) {
			hrfMappingInfoObj.schema = oDataMappingInfoObj[propName];
		}

		// parameters in mapping info are optional
		propName = getOdataPropName(oDataMappingInfoObj, oDataHandlerLib.PROPERTY_NAME_PARAMETERS); 
		//hrfMappingInfoObj.parameters = "";
		if (oDataMappingInfoObj[propName]) {
			hrfMappingInfoObj.parameters = oDataMappingInfoObj[propName];
		}
	}

	function convertoDataVH(oDataVL, convertedVocaJson, validationUtilsLib) {
		var newValueHelp = {};
		var id = getOdataPropertyValue(oDataVL, oDataHandlerLib.PROPERTY_NAME_ID);
		var businessDataType = validationUtilsLib.getValueHelpBusinessDataType(id);
		if (!businessDataType){
			return;
		}
		newValueHelp.businessDataType = businessDataType ;
		newValueHelp.metadata = {};
		newValueHelp.metadata.serviceURL = getOdataPropertyValue(oDataVL, oDataHandlerLib.PROPERTY_NAME_SERVICE_URL);
		newValueHelp.metadata.propertyPath = getOdataPropertyValue(oDataVL, oDataHandlerLib.PROPERTY_NAME_PROPERTY_PATH);
		newValueHelp.metadata.type = getOdataPropertyValue(oDataVL, oDataHandlerLib.PROPERTY_NAME_TYPE);
		convertedVocaJson.valueLists[id] = newValueHelp;
	}
	

	function convertoDataVocaRule(oDataDO, convertedVocaJson, vocaId, validationUtilsLib) {

		var newHRF_Entity = {};
		var resultDataObject = null;
		newHRF_Entity.name = getOdataPropertyValue(oDataDO, oDataHandlerLib.PROPERTY_NAME_NAME);
		newHRF_Entity.id = getOdataPropertyValue(oDataDO, oDataHandlerLib.PROPERTY_NAME_ID);
		newHRF_Entity.isVocaRule = true;
		if(byDescModeIsOn){
			newHRF_Entity.description = getOdataPropertyValue(oDataDO, oDataHandlerLib.PROPERTY_NAME_DESCRIPTION);
			//If there are ambiguous vocaRules delete the existing, do not add this element and return:
			if(!validationUtilsLib.isVocaRuleUnique(newHRF_Entity)){
				//Delete the ambiguous vocaRule that was added to convertedVocaJson.dataObjects array:
				validationUtilsLib.deleteNonUniqueVocaRule(newHRF_Entity, convertedVocaJson.dataObjects);
				return;
			}
			validationUtilsLib.validateDescription(newHRF_Entity, oDataHandlerLib.PROPERTY_NAME_VOCABULARY_RULE, vocaId);
		}
		//find the result DO by id and get its attributes as is (already converted)
		newHRF_Entity.resultDataObjectId = getOdataPropertyValue(oDataDO, oDataHandlerLib.PROPERTY_NAME_RESULTDOID);
		resultDataObject = utilsBaseLib.findObjectById(newHRF_Entity.resultDataObjectId, convertedVocaJson.outputs);
		if(!resultDataObject)
		{
			resultDataObject = utilsBaseLib.findObjectById(newHRF_Entity.resultDataObjectId, convertedVocaJson.vocaRulesOutputs);
		}
		newHRF_Entity.attributes = resultDataObject.inputParams; 		  

		// Add the new converted HRF_DataObject to the converted vocabulary
		convertedVocaJson.dataObjects.push(newHRF_Entity);
	}
	
	function convertoDataDO(oDataVocaDOarr, oDataDO, convertedVocaJson, vocaId, validationUtilsLib) {

		var propName = null;
		var newHRF_Entity = {};
		// Check the type of the given oDataDO (HRF_DataObject or HRF_Output)
		propName = getOdataPropName(oDataDO, oDataHandlerLib.PROPERTY_NAME_USAGE);
		if (propName) {
			newHRF_Entity.name = getOdataPropertyValue(oDataDO, oDataHandlerLib.PROPERTY_NAME_NAME);
			if (oDataDO[propName] === oDataHandlerLib.TYPE_DO) {
				if(byDescModeIsOn){
					newHRF_Entity.description = getOdataPropertyValue(oDataDO, oDataHandlerLib.PROPERTY_NAME_DESCRIPTION);
					validationUtilsLib.validateDescription(newHRF_Entity, oDataHandlerLib.PROPERTY_NAME_DATA_OBJECT, vocaId);
				}
				// Convert the DO attributes
				propName = getOdataPropName(oDataDO, oDataHandlerLib.PROPERTY_NAME_ATTRIBUTES);
				if (propName) {
					newHRF_Entity.attributes = [];
					var attributesArr = oDataDO[propName];
					attributesArr.forEach(function(attrObj) {
						convertToDataObjectAttribute(attrObj, newHRF_Entity.attributes, newHRF_Entity.name, validationUtilsLib);
					});
				}
				// Convert the DO associations
				propName = getOdataPropName(oDataDO, oDataHandlerLib.PROPERTY_NAME_ASSOCIATIONS);
				if (propName) {
					var associationsArr = oDataDO[propName];
					newHRF_Entity.associations = [];
					associationsArr.forEach(function(assocObj) {
						convertToDataObjectAssociation(oDataVocaDOarr, assocObj, newHRF_Entity.associations, newHRF_Entity.name, validationUtilsLib);
					});
				}
				// Convert the DO mapping info
				propName = getOdataPropName(oDataDO, oDataHandlerLib.PROPERTY_NAME_MAPPING_INFO);
				if (propName) {
					var oDataMappingInfoObj = oDataDO[propName];
					newHRF_Entity.mappingInfo = {};
					convertMappingInfoObj(oDataMappingInfoObj, newHRF_Entity.mappingInfo);
				}
				// Add the new converted HRF_DataObject to the converted vocabulary
				convertedVocaJson.dataObjects.push(newHRF_Entity);
			} else if (oDataDO[propName] === oDataHandlerLib.TYPE_RESULT || oDataDO[propName] === oDataHandlerLib.TYPE_NONE) {
				var outputType = oDataDO[propName];
				newHRF_Entity.id = getOdataPropertyValue(oDataDO, oDataHandlerLib.PROPERTY_NAME_ID);
				var resultDescription = getOdataPropertyValue(oDataDO, oDataHandlerLib.PROPERTY_NAME_DESCRIPTION);
				if(resultDescription){
					newHRF_Entity.description = resultDescription;
				}
				propName = getOdataPropName(oDataDO, oDataHandlerLib.PROPERTY_NAME_ATTRIBUTES);
				// Convert the inputParams of the output
				if (propName) {
					newHRF_Entity.inputParams = [];
					var inputParamsArr = oDataDO[propName];
					inputParamsArr.forEach(function(attrObj) {
						convertToOutput(attrObj, newHRF_Entity.inputParams);
					});
				}
				if (outputType === oDataHandlerLib.TYPE_RESULT) {
				// Add the new converted HRF_Output to the converted vocabulary
					convertedVocaJson.outputs.push(newHRF_Entity);
				}
				else {
					convertedVocaJson.vocaRulesOutputs.push(newHRF_Entity);
				}
			}
		}
	}

	/*******************************************************************************
	 * Exposed methods implementation
	 *******************************************************************************/

	/**
	 * Method: convertRuleODataToInternalModel
	 *         Converts a rule in oData JSON format into HRF internal model format 
	 *         Assumption: Given rule is of decision table type
	 * 
	 * @param oDataObj - oData (in JSON format) of the rule that needs conversion
	 * 
	 * @returns - the converted rule
	 */
	var convertRuleODataToInternalModel = function(oDataObj, jsonPathPrefix) {

		var convertedJson = {
			"id" : "",
			"output" : "",
			"name"   :"",
			"ruleBody" : {
				"content" : {
					"headers" : [],
					"rows" : []
				},
				"type" : "",
				"hitPolicy" : "",
				"ruleFormat" : ""
			}

		};

		// Fill flat attributes
		var dtPropName = getOdataPropName(oDataObj, oDataHandlerLib.PROPERTY_NAME_DECISION_TABLE);
		var jsonPath = utilsBaseLib.buildJsonPath(jsonPathPrefix, dtPropName);
		var fixedOperatorsMap = {};
		var headerTypesMap = {};
		convertedJson.id = getOdataPropertyValue(oDataObj, oDataHandlerLib.PROPERTY_NAME_ID);
		convertedJson.name = getOdataPropertyValue(oDataObj, oDataHandlerLib.PROPERTY_NAME_NAME);
		convertedJson.ruleBody.ruleFormat = getEnumPropertyValue(oDataObj, oDataHandlerLib.PROPERTY_NAME_RULE_FORMAT);
		convertedJson.output = getOdataPropertyValue(oDataObj, oDataHandlerLib.PROPERTY_NAME_RESULT_DO_NAME);
		convertedJson.ruleBody.type = getEnumPropertyValue(oDataObj, oDataHandlerLib.PROPERTY_NAME_TYPE);
		convertedJson.ruleBody.relVersion = getOdataPropertyValue(oDataObj, oDataHandlerLib.PROPERTY_NAME_REL_VERSION);
		convertedJson.ruleBody.hitPolicy = getEnumPropertyValue(oDataObj[dtPropName],
				oDataHandlerLib.PROPERTY_NAME_HIT_POLICY);

		var dtColumns = getOdataPropertyValue(oDataObj[dtPropName], oDataHandlerLib.PROPERTY_NAME_DT_COLUMNS);
		var dtColumnsPropName = getOdataPropName(oDataObj[dtPropName], oDataHandlerLib.PROPERTY_NAME_DT_COLUMNS);
		
		var dtRows = getOdataPropertyValue(oDataObj[dtPropName], oDataHandlerLib.PROPERTY_NAME_DDT_ROWS);
		var dtRowsPropName = getOdataPropName(oDataObj[dtPropName], oDataHandlerLib.PROPERTY_NAME_DDT_ROWS);
		
		// Decision table headers (columns)
		if (dtColumns) {
			var internalModelColumn;
			dtColumns.forEach(function(oDColumn, index) {
				jsonPathPrefix = utilsBaseLib.buildJsonPath(jsonPath, dtColumnsPropName, index);
				internalModelColumn = createInternalModelColumn(oDColumn, fixedOperatorsMap, headerTypesMap, jsonPathPrefix);
				convertedJson.ruleBody.content.headers.push(internalModelColumn);
			});
		}

		// Decision table rows
		if (dtRows) {
			var internalModelRow;
			dtRows.forEach(function(oDRow, index) {
				jsonPathPrefix = utilsBaseLib.buildJsonPath(jsonPath, dtRowsPropName, index);
				internalModelRow = createInternalModelRow(oDRow, headerTypesMap, jsonPathPrefix);
				if(internalModelRow){
					convertedJson.ruleBody.content.rows.push(internalModelRow);
				}
			});
		}

		return convertedJson;
	};

	/**
	 * Method: convertVocabularyODataToInternalModel
	 *         Convert a vocabulary in oData JSON format into HRF internal schema format
	 * 
	 * @param oDataObj - oData (in JSON format) of the vocabulary that needs conversion
	 * 
	 * @returns - the converted rule
	 */
	var convertVocabularyODataToInternalModel = function(oDataObj, termModes) {

		var i;
		var validationUtilsLib = new validationUtils.validationUtilsLib();
		var propName = null;
		var convertedVocaJson = {
			"dataObjects" : [],
			"outputs" : [],
			"vocaRulesOutputs" : [],
			"valueLists" : {}
		};
		//Init the Friendly Term mode flag, to indicate if description validation is needed:
		for(i = 0 ; i<  termModes.length; i++){
			if(termModes[i] === 'byDescription'){
				byDescModeIsOn = true;
				break;
			}
		}
		propName = getOdataPropName(oDataObj, oDataHandlerLib.PROPERTY_NAME_DATA_OBJECTS);
		if (propName) {
			oDataObj[propName].forEach(function(oDataDO) {
				convertoDataDO(oDataObj[propName], oDataDO, convertedVocaJson, oDataObj.id, validationUtilsLib);
			});
		}
		propName = getOdataPropName(oDataObj, oDataHandlerLib.PROPERTY_NAME_VALUE_HELPS);
		if (propName && Array.isArray(oDataObj[propName])) {
			oDataObj[propName].forEach(function(oDataVH) {
				convertoDataVH(oDataVH, convertedVocaJson, validationUtilsLib);
			});
		}
		//voca rules
		propName = getOdataPropName(oDataObj, oDataHandlerLib.PROPERTY_NAME_VOCABULARY_RULES);
		if (propName) {
			oDataObj[propName].forEach(function(oDataDO) {
				convertoDataVocaRule(oDataDO, convertedVocaJson, oDataObj.id, validationUtilsLib);
			});
		}
		

		return convertedVocaJson;
	};
	/*******************************************************************************
	 * Public Area
	******************************************************************************/
	return {
		"convertRuleODataToInternalModel": convertRuleODataToInternalModel,
		"convertVocabularyODataToInternalModel": convertVocabularyODataToInternalModel
	};

}());
