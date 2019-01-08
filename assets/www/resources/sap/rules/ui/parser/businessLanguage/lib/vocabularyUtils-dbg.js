jQuery.sap.declare("sap.rules.ui.parser.businessLanguage.lib.vocabularyUtils");


jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.constantsBase");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.constants");




sap.rules.ui.parser.businessLanguage.lib.vocabularyUtils = sap.rules.ui.parser.businessLanguage.lib.vocabularyUtils|| {}; 
sap.rules.ui.parser.businessLanguage.lib.vocabularyUtils.lib = (function() {
	var vocabularyConstants = sap.rules.ui.parser.resources.vocabulary.lib.constantsBase.lib;
	var constantsLib = sap.rules.ui.parser.businessLanguage.lib.constants.lib;

	function vocabularyUtilsLib() {

	}



	// TEMP
	var ONE_TO_MANY = 'OneToMany';

	/****************************************************************
	****************************************************************/
	 vocabularyUtilsLib.prototype.AssocInfo = function (name) {
		this.name = name;
		this.isValid = false;
		this.object = null;
		this.isCollection = false;
		this.alt = [];
	};

	/****************************************************************
	 * P R I V A T E
	****************************************************************/
	 vocabularyUtilsLib.prototype.isCardinalityCollection = function (cardinality) {
		return cardinality === ONE_TO_MANY;
	};

	/****************************************************************
	 * P R I V A T E
	****************************************************************/
	 vocabularyUtilsLib.prototype.getTypedAttribute = function (vocaRTServ, vocaName, objName, attrName, isCollection, typeArr) {
		var attr = vocaRTServ.getAttribute (vocaName, objName, attrName);
		if (!attr) {
			return null;
		}
		
		if (typeArr.length > 0) {
			var found = false;
			var i;
			
			for (i=0; i<typeArr.length; i++) {
				if (typeArr[i].type === attr.businessDataType && typeArr[i].hasOwnProperty("isCollection") && typeArr[i].isCollection === isCollection) {
					found = true;
					break;
				}
			}
			
			if (!found) {
				return null;
			}
		}
		
		return attr;
	};

        /****************************************************************
        * P R I V A T E
        ****************************************************************/
        vocabularyUtilsLib.prototype.getAltTypedAttributes = function (vocaRTServ, vocaName, objName, attrName, isCollection, typeArr, modelMngrTermMode) {
                        
                        var attDesc = null; 
                        var typedAttrArr = [];
                        var i, i1, found, attr;
                        var termMode = modelMngrTermMode === constantsLib.DISPLAY_TEXT ? vocabularyConstants.TermModeRelated.TERM_MODE_BY_DESCRIPTION : vocabularyConstants.TermModeRelated.TERM_MODE_BY_NAME;
                        var attrArr = vocaRTServ.getObjectAttributesNamesByTermMode (vocaName, objName, attrName, termMode);
                        if (typeArr.length === 0) {
                                        return attrArr;
                        }
                        
                        for (i=0; i<attrArr.length; i++) {
                                        found = false;
                                        
                                        for (i1=0; i1<typeArr.length; i1++) {
                                        				if ((typeArr[i1].type === constantsLib.TYPE_BOOLEAN || typeArr[i1].type === constantsLib.TYPE_BOOLEAN_COLLECTION) &&
                                        						modelMngrTermMode === constantsLib.DISPLAY_TEXT) {
                                        					continue;
                                        				}
                                                        if (typeArr[i1].hasOwnProperty("isCollection") && typeArr[i1].isCollection === isCollection) {
                                                                        attr = vocaRTServ.getAttribute (vocaName, objName, attrArr[i].name);
                                                                        if (attr && attr.businessDataType === typeArr[i1].type) {
                                                                                        attrArr[i].type = attr.businessDataType;
                                                                                        attDesc = attr.description;
                                                                                        found = true;
                                                                                        break;
                                                                        }
                                                        }
                                        }
                                        
                                        if (found) {
                                                        attrArr[i].description = attDesc;
                                                        attrArr[i].tokenType = constantsLib.tokenTypesEnum.vocabulary;
                                                        typedAttrArr.push (attrArr[i]);
                                        }
                        }
                        
                        return typedAttrArr;
        };


	/****************************************************************
	 * P R I V A T E
	****************************************************************/
	 vocabularyUtilsLib.prototype.canObjectLeadToType = function(vocaRTServ, vocaName, objName, typeArr, isCollection, checkObj) {
		if (checkObj.hasOwnProperty (objName)) {
			return checkObj[objName];
		}
		
		checkObj[objName] = false;

		var i, i1;
		if (isCollection) {
			var found = false;
			for (i=0; i<typeArr.length; i++) {
				if (typeArr[i].hasOwnProperty("isCollection") && typeArr[i].isCollection) {
					found = true;
					break;
				}
			}
			
			if (!found) {
				checkObj[objName] = false;
				return false;
			}
		}
		
		// Attributes
		var attrArr = vocaRTServ.getAttributes (vocaName, objName);
		for (i=0; i<typeArr.length; i++) {
			if (typeArr[i].hasOwnProperty("isCollection") && typeArr[i].isCollection === isCollection) {
				for (i1=0; i1<attrArr.length; i1++) {
					if (attrArr[i1].businessDataType === typeArr[i].type) {
						checkObj[objName] = true;
						return true;
					}
				}
			}
		}
		
		// Associations
		var assocArr = vocaRTServ.getAssociations (vocaName, objName, false);
		var isICollection;
		
		for (i=0; i<assocArr.length; i++) {
			isICollection = isCollection || this.isCardinalityCollection (assocArr[i].cardinality);
			if (this.canObjectLeadToType (vocaRTServ, vocaName, assocArr[i].target, typeArr, isICollection, checkObj)) {
				checkObj[objName] = true;
				return true;
			}
		}

		return false;
	};

	/****************************************************************
	 * P R I V A T E
	****************************************************************/
	 vocabularyUtilsLib.prototype.isTypedObjectExists = function(vocaRTServ, vocaName, objName, typeArr) {
		
		var object = vocaRTServ.getObject (vocaName, objName);
		
		if (object === null){
			return null;
		}
		
		if (typeArr.length === 0) {
			return object;
		}
		
		var checkedObj = {};
		
		var canObjectLead = this.canObjectLeadToType (vocaRTServ, vocaName, objName, typeArr, false, checkedObj);
		
		if (canObjectLead === false) {
			
			return null;
		}
		
		return object;
	};

	/****************************************************************
	 * P R I V A T E
	****************************************************************/
	 vocabularyUtilsLib.prototype.isTypedAliasExists = function (vocaRTServ, vocaName, objName, typeArr) {
		
		var aliasInfo = vocaRTServ.getAlias (vocaName, objName, null);
		
		if (aliasInfo === null){
			return null;
		}
		
		if (typeArr.length === 0) {
			return aliasInfo;
		}
		
		var isCollection = aliasInfo.isCollection;
		var businessDT   = aliasInfo.businessDT;
		var i;
		
		for (i=0; i<typeArr.length; i++) {
			
			if (typeArr[i].type === businessDT){
				
				if (typeArr[i].isCollection === isCollection){
					
					return aliasInfo;
				}
			}
		}
		
		return null;
	};
	/****************************************************************
	 * P R I V A T E
	****************************************************************/


	/****************************************************************
	 * P R I V A T E
	****************************************************************/

	 vocabularyUtilsLib.prototype.getAltTypedTerms = function(vocaRTServ, vocaName, startWith, typeArr, context, isCurrent, completeCollection, isDeprecatedAllContext, isAutoComplete, isInsideWhere, isAllContext, modelMngrTermMode, isNoAssocSugg) {
			
			var termsObj = vocaRTServ.getTerms(vocaName, startWith, modelMngrTermMode);
			var termArr = termsObj.terms;
			var termsAlt = [];
		    var i, j;
		    var termInfo;
		    var requestedType;
		    isCurrent = (!isCurrent ? false : isCurrent);
		    isNoAssocSugg = ((isNoAssocSugg === undefined || isNoAssocSugg === null) ? false : isNoAssocSugg);
		    var equalContextRootForCollections = false;
		    //var isCollectionAllowed = false;
			var rootTermContext = null;
			var rootContext = null;
			var autoComplete = isAutoComplete ? true : false;
			var requestedTermFormat;
			
			if(modelMngrTermMode === vocabularyConstants.TermModeRelated.TERM_MODE_BY_DESCRIPTION){
				requestedTermFormat = vocabularyConstants.TermModeRelated.TERM_PROPERTY_FRIENDLY_TERM;
			 }
			 else{
				 requestedTermFormat = vocabularyConstants.TermModeRelated.TERM_PROPERTY_DESCRIPTION;
			 }
				
		    // Mark if collection is expected
			if(context && completeCollection)
			{
		    	rootContext = context.split(".");
		    	if(rootContext.length > 0 )
		    	{
		    		rootContext = rootContext.shift();
		    	}
			}
		    // Check for each term if should be suggested...
		    for (i=0; i<termArr.length; i++) {
		   	 
			   	termInfo = termArr[i];
			   	
			   	equalContextRootForCollections = false;
			   	
			   	if (autoComplete && termInfo.isDeprecated === true) {
			   		continue;
			   	}
			   	
				// do not suggest terms with 'all' after current and after 'all' 
				if((isCurrent || isDeprecatedAllContext) && termInfo.modifiers.hasOwnProperty("all")  && termInfo.modifiers.all){
					continue; 
				}
				
				// do not suggest terms with 'current' after current and outside of where / filter by and not in all context
				if (termInfo.modifiers.hasOwnProperty("current") && termInfo.modifiers.current && 
					((isCurrent) || ((isInsideWhere !== undefined) && (isInsideWhere === false)) || 
					((isAllContext !== undefined) && (isAllContext === false) && (isDeprecatedAllContext !== undefined) && (isDeprecatedAllContext === false)))){
						continue;
				}
				
			    // special case for simpleScoring, do not suggest terms with associations
			   	if (!completeCollection && isNoAssocSugg && termInfo.expression.split(".").length > 2) {
			   		continue;
			   	}
				
				//In case no specific types are requested, return all terms's types
				if (typeArr.length === 0){
				 	termsAlt.push (termInfo[requestedTermFormat]);
				 	continue;
				}
				
				// Attributes of the context are provided as is. Hence the corresponding terms should'nt be provided unless Boolean
				 if((termInfo.businessDataType !== constantsLib.TYPE_BOOLEAN || modelMngrTermMode !== vocabularyConstants.TermModeRelated.TERM_MODE_BY_DESCRIPTION) &&
						 !isCurrent && !completeCollection && context !== null && termInfo.context !== null && termInfo.expression.indexOf(context) === 0 && termInfo.isConditionalContext === false &&
		   				 context !== termInfo.context && termInfo.businessDataType !== null && (termInfo.expression.split(".").length === (context.split(".").length + 1))){
					 continue;
				 }
				 
			   	// Handle aggregations Collections inside context  AND 
			   	if(context && completeCollection){
				   	rootTermContext = null;
				   	if(termInfo.isCollection  && !termInfo.isConditionalContext/* && !isCurrent */){
				   		rootTermContext = termInfo.expression.split(".");
				   		if(rootTermContext.length > 0 ) {
				   			rootTermContext = rootTermContext.shift();
				   			equalContextRootForCollections = ( rootTermContext === rootContext ? true : false);
				   		}
				   	}
			   	}
		   	
			   	//If no context was provided it means we should return all terms which are not conditional context terms
			   	 //Else, if context was provided, return all terms that have context and there context's string is contained in the requested context (from the start) 
			   	 //		but not the same because attributes inside context are fetched separately
			   	 // Else, if context is provided and collection type is required and root object is the same (i.e. aggregation inside where)
			   	 if ((context === null && termInfo.isConditionalContext === false && !isCurrent) || termInfo.isVocaRuleTerm ||
			   		 (context !== null && termInfo.context !== null && context.indexOf(termInfo.context) === 0 && !isCurrent &&
			   				 (context !== termInfo.context ||
			   						 // 1:1 associations should be displayed as well. The context is the same but the length of expression is bigger than the context
			   						 (context === termInfo.context && termInfo.isCollection === false && termInfo.expression.split(".").length > context.split(".").length + 1))) ||
			   		 (context !== null && termInfo.expression.indexOf(context) === 0 && termInfo.isConditionalContext === false && isCurrent )||
			   		 (context !== null && termInfo.expression.indexOf(context) === 0 && 
			   				 ((termInfo.modifiers.hasOwnProperty("current") && termInfo.modifiers.current) || 
			   				 (termInfo.businessDataType === constantsLib.TYPE_BOOLEAN && modelMngrTermMode === vocabularyConstants.TermModeRelated.TERM_MODE_BY_DESCRIPTION))) ||
			   		equalContextRootForCollections){
			   		 
					//In case no specific types are requested, return all terms's types
					for (j=0; j<typeArr.length; j++) {	
						requestedType = typeArr[j];
						// Collections inside context (i.e. aggregations inside where)
						if (equalContextRootForCollections && 
						    requestedType.type === termInfo.businessDataType &&
						    termInfo.isCollection && requestedType.isCollection ){
							termsAlt.push (termInfo[requestedTermFormat]);
							break;
						}
						// other scenarios
						else if (!equalContextRootForCollections &&
								requestedType.type === termInfo.businessDataType &&
								(requestedType.isCollection === termInfo.isCollection ) ){
							termsAlt.push (termInfo[requestedTermFormat]);
							break;
						}
					}	
			   	}
		    }
			return termsAlt;
		};

		
	/****************************************************************
	****************************************************************/
	vocabularyUtilsLib.prototype.buildExternalAltValueList = function (vocaRTServ, vocaName, valueListAttribute) {
		
		var altValueList = [];
		var valueListVal = vocaRTServ.getValueList(vocaName, valueListAttribute.attributeValueList);

		var metadataVal = valueListVal.metadata;
		metadataVal.businessDataType = valueListVal.businessDataType;
		
		var resultValueList = {
				name: valueListAttribute.attributeValueList,
				tokenType: constantsLib.tokenTypesEnum.valueList,
				info: {id: valueListAttribute.attributeValueList, metadata:metadataVal}
			};
		
		
		altValueList.push(resultValueList);
		return altValueList;
	};	
		
	/****************************************************************
	****************************************************************/
	vocabularyUtilsLib.prototype.buildInternalAltValueList = function (vocaRTServ, vocaName, valueListAttribute, startWith) {
		
		var altValueList = [];
		var altValueValues = [];
		var idx = 0;
		
		altValueValues = vocaRTServ.getValueListDescriptions(vocaName, valueListAttribute.attributeValueList, startWith);
		for (idx = 0; idx < altValueValues.length; idx++) {
				altValueList.push({name: altValueValues[idx], "info": {key: valueListAttribute.attributeValueList}, tokenType : constantsLib.tokenTypesEnum.valueList});
			
		}
		
		return altValueList;
	};
	
				
	/****************************************************************
	****************************************************************/
	 vocabularyUtilsLib.prototype.getAltValueList = function (vocaRTServ, vocaName, valueListAttribute, startWith) {
		
		var altValueList = [];
				
		if(valueListAttribute)
		{
			var valueHelpType = vocaRTServ.getValueListType(vocaName, valueListAttribute.attributeValueList);
		
			switch (valueHelpType) {
			case vocabularyConstants.INTERNAL_VALUE_LIST:
				altValueList = this.buildInternalAltValueList(vocaRTServ, vocaName, valueListAttribute, startWith);	
				break;
			case  vocabularyConstants.EXTERNAL_VALUE_LIST:
				altValueList = this.buildExternalAltValueList(vocaRTServ, vocaName, valueListAttribute);	
				break;
			default:
				return []; 
			}
		}
		
		return altValueList;
	};

	/****************************************************************
	****************************************************************/
	 vocabularyUtilsLib.prototype.getAltValueListForValueListAttr = function (vocaName, vocaRTServ, valueListAttribute, startWith) {
		return this.getAltValueList (vocaRTServ, vocaName, valueListAttribute, startWith);
	};

	/****************************************************************
	 * P R I V A T E
	****************************************************************/
	 vocabularyUtilsLib.prototype.getAltTypedObjects = function (vocaRTServ, vocaName, objName, typeArr) {
		var allAlt = vocaRTServ.getObjectsNames (vocaName, objName);	
		
		if (typeArr.length === 0) {
			return allAlt;
		}
		
		var typedAlt = [];
		var i, checkedObj;
		
		for (i=0; i<allAlt.length; i++) {
			checkedObj = {};
			if (this.canObjectLeadToType (vocaRTServ, vocaName, allAlt[i].name, typeArr, false, checkedObj)) {
				allAlt[i].tokenType = constantsLib.tokenTypesEnum.vocabulary;
				typedAlt.push (allAlt[i]);
			}
		}
		
		return typedAlt;
	};

	/****************************************************************
	 * P R I V A T E
	****************************************************************/
	 vocabularyUtilsLib.prototype.getAltTypedAliases = function (vocaRTServ, vocaName, objName, typeArr) {
		var allAlt = vocaRTServ.getAliases (vocaName, objName);	
		allAlt = (allAlt.hasOwnProperty("aliases")) ? allAlt.aliases : allAlt;
		if (typeArr.length === 0) {
			return allAlt;
		}
		
		var i;
		var z;
		var isCollection, isDTAlias = false;
		var businessDT;
		var typedAlt = [];
		
		for (i=0; i<allAlt.length; i++) {
			
			isDTAlias = false;
			isCollection = allAlt[i].isCollection;
			businessDT = (allAlt[i].businessDT === null ? constantsLib.SIMPLE_SELECTION_VALUE_TYPE.COLLECTION.string : allAlt[i].businessDT);
			
			if (isCollection) {
				isDTAlias = (allAlt[i].type ===  vocabularyConstants.ALIAS_CONTENT_DECISION_TABLE ? true : false);
			} 
			
			for (z=0; z<typeArr.length; z++) {
				
				if (typeArr[z].hasOwnProperty("isCollection") && typeArr[z].isCollection === isCollection && isDTAlias === typeArr[z].isDTAlias ){
					
					if (typeArr[z].type === businessDT){
						allAlt[i].tokenType = constantsLib.tokenTypesEnum.alias;
						typedAlt.push(allAlt[i]);
						
						break;
					}
				}
			}
		}
								
		return typedAlt;
	};


	/****************************************************************
	 * P R I V A T E
	****************************************************************/
	 vocabularyUtilsLib.prototype.getTypedAssociation = function (vocaRTServ, vocaName, objName, assocName, isCollection, typeArr) {
		var assoc = vocaRTServ.getAssociation (vocaName, objName, assocName, false);
		if (!assoc) {
			return null;
		}
		
		if (typeArr.length === 0) {
			return assoc;
		}

		var intIsCollection = isCollection;
		if (this.isCardinalityCollection (assoc.cardinality)) {
			intIsCollection = true;
		}
		
		var checkedObj = {};
		if (!this.canObjectLeadToType (vocaRTServ, vocaName, assoc.target, typeArr, intIsCollection, checkedObj)) {
			return null;
		}
		
		return assoc;
	};

	/****************************************************************
	 * P R I V A T E
	****************************************************************/
	 vocabularyUtilsLib.prototype.getAltTypedAssociations = function (vocaRTServ, vocaName, objName, assocName, isCollection, typeArr) {
		var allAlt = vocaRTServ.getObjectAssociationsNames (vocaName, objName, assocName);
		if (typeArr.length === 0) {
			return allAlt;
		}
		
		var typedAlt = [];
		var i, assoc, isICollection, checkedObj;
		
		for (i=0; i<allAlt.length; i++) {
			assoc = vocaRTServ.getAssociation (vocaName, objName, allAlt[i].name, false);
			isICollection = isCollection;
			if (!this.isICollection && this.isCardinalityCollection (assoc.cardinality)) {
				isICollection = true;
			}
			
			checkedObj = {};
			if (this.canObjectLeadToType (vocaRTServ, vocaName, assoc.target, typeArr, isICollection, checkedObj)) {
				allAlt[i].tokenType = constantsLib.tokenTypesEnum.vocabulary;
				typedAlt.push (allAlt[i]);
			}
		}
		
		return typedAlt;
	};

	/****************************************************************
	 ****************************************************************/
	 vocabularyUtilsLib.prototype.isAttributeExists = function(attrName, vocaName, vocaRTServ) {
		if (vocaRTServ.isAttributeExists(vocaName, attrName)){
			return true;
		}
		
		return false;
	};

	/****************************************************************
	 ****************************************************************/
	 vocabularyUtilsLib.prototype.isTermPrefix = function(term_prefix, vocaRTServ, vocaName, modelMngrTermMode) {
		 
		 var termModeFlag = null; 
		 
		 if (!vocaRTServ) {
			 return false;
		 }
		 
		 if(modelMngrTermMode === constantsLib.DISPLAY_TEXT){
			 termModeFlag = vocabularyConstants.TermModeRelated.TERM_MODE_BY_DESCRIPTION;
		 }
		 else{
			 termModeFlag = vocabularyConstants.TermModeRelated.TERM_MODE_BY_NAME;
		 }
		 
		var terms = this.getAltTypedTerms(vocaRTServ, vocaName, term_prefix, [], null, null, null, null, null, null, null, termModeFlag, null);	
		if (terms.length > 0) {
			return true;
		}
		
		return false;
	};
	
	/****************************************************************
	 ****************************************************************/
	 vocabularyUtilsLib.prototype.isTermsExists = function (vocaRTServ, vocaName) {	
			return vocaRTServ.isTermsExist(vocaName);
	 };

	/****************************************************************
	 * Function: validateNavigationDetails
	 * INPUT: Object Path - root, associations, attributes... in
	 *  the form of "root.association1.association2...associationN.attribute"
	 *  
	 *  typeArr: [{type:Number, isCollection:true}, ...]
	 *  
	 *   Note: if the path holds only part of the components - i.e. only the
	 *         root, or part of the root, the path will not be valid, 
	 *         but there will be a error message...
	 *         
	 * OUTPUT: {
	 *             root: {name, isValid, alternative[]} 
	 *             associations: {isValid, isCollection, path[]},
	 *             attribute: {name, dataType, size: null, isValid, alternative[]...},
	 *             isValid: <true/false>
	 *         }
	 * 
	 ****************************************************************/
	 vocabularyUtilsLib.prototype.validateNavigationDetails = function(navDetails, vocaRTServ, vocaName, typeArr, valueListAttribute, modelMngrTermMode) {
		 var result = {
					navigation: navDetails,
					term: navDetails,
					root: {name: null, isValid: false, isAlias: false, isDTAlias: false, vocabulary: null, businessDataType: null, altDO:[], altAlias:[], altDTAlias:[], altValueList:[]},
					associations: {isValid: false, path:[]},
					attribute: {name: null, dataType: null, size: null, businessDataType: null, vocabulary: null, sourceType: null, isValid: false, valueListName: null, altAttr:[], altAssoc:[]},
					isValid: false,
					isCollection: false,
					isVocaRule: false,
					modifiers : {},
					message: {"id": "invalid_root_error_message", "params":[]}
				};
		 		var termModeFlag;
		 		
				if (!navDetails) {
					result.root.altDO    = this.getAltTypedObjects (vocaRTServ, vocaName, '', typeArr);
					result.root.altAlias = this.getAltTypedAliases (vocaRTServ, vocaName, '', typeArr);
					result.root.altValueList = this.getAltValueList(vocaRTServ, vocaName, valueListAttribute, null);
					return result;
				}
				
				if(modelMngrTermMode === constantsLib.DISPLAY_TEXT){
					 termModeFlag = vocabularyConstants.TermModeRelated.TERM_MODE_BY_DESCRIPTION;
				 }
				 else{
					 termModeFlag = vocabularyConstants.TermModeRelated.TERM_MODE_BY_NAME;
				 }
				
				var term = vocaRTServ.getTerm(vocaName, navDetails, termModeFlag);
				if (term !== null) {
					result.navigation = navDetails = term.expression;
					result.modifiers = term.modifiers;
					result.isCollection = term.isCollection;
					result.isVocaRule = term.isVocaRuleTerm;
				}
				
				var pathSegments = navDetails.split(".");
				if (pathSegments.length < 1) {
					result.root.altDO    = this.getAltTypedObjects (vocaRTServ, vocaName, '', typeArr);
					result.root.altAlias = this.getAltTypedAliases (vocaRTServ, vocaName, '', typeArr);
					result.root.altValueList = this.getAltValueList(vocaRTServ, vocaName, valueListAttribute, navDetails);
					return result;
				}

			    // Root
				result.root.name = pathSegments.shift();
				
				var aliasInfo = null;
				
				var objectInfo = this.isTypedObjectExists (vocaRTServ, vocaName, result.root.name, typeArr);
				
				if (objectInfo === null) {
					
					aliasInfo = this.isTypedAliasExists  (vocaRTServ, vocaName, result.root.name, typeArr);
				}
				
				if (objectInfo === null && aliasInfo === null){
					if (pathSegments.length === 0) {
						result.root.altDO    = this.getAltTypedObjects (vocaRTServ, vocaName, result.root.name, typeArr);
						result.root.altAlias = this.getAltTypedAliases (vocaRTServ, vocaName, result.root.name, typeArr);
						result.root.altValueList = this.getAltValueList(vocaRTServ, vocaName, valueListAttribute, null);
					}
					
					return result;
				}
				
				if (objectInfo !== null) {
					result.root.vocabulary = objectInfo.vocaName;
				}

			    result.isValid = result.root.isValid = true;
			    result.message.id = null;
			    
			    if (aliasInfo !== null){
			    	result.root.vocabulary = aliasInfo.vocaName;
			    	result.root.isAlias = true;
			    	result.root.businessDataType = aliasInfo.businessDT;
			    	result.root.isDTAlias = (aliasInfo.type === vocabularyConstants.ALIAS_CONTENT_DECISION_TABLE ? true : false);
			    	result.isCollection = aliasInfo.isCollection;
			    	return result;
			    }
				
				var curObject = result.root.name;
				var curSegment;
				var assocInfo;
				var assoc;
				var attr;
				
				while (pathSegments.length > 0) {
					curSegment = pathSegments.shift();
					assocInfo = new this.AssocInfo(curSegment);
					assoc = this.getTypedAssociation (vocaRTServ, vocaName, curObject, curSegment, result.isCollection, typeArr);
					
					if (!assoc) {
						if (pathSegments.length > 0) {
							result.associations.isValid = result.isValid = false;
							assocInfo.alt = this.getAltTypedAssociations (vocaRTServ, vocaName, curObject, curSegment, result.isCollection, typeArr);
							result.associations.path.push(assocInfo);
							result.message.id = "invalid_assoc_error_message";
							return result;
						}
						
						result.attribute.name = curSegment;
						attr = this.getTypedAttribute (vocaRTServ, vocaName, curObject, curSegment, result.isCollection, typeArr);
						if (attr) {
							result.attribute.isValid = true;
							result.attribute.dataType = attr.dataType;
							result.attribute.size = attr.size;
							result.attribute.businessDataType = attr.businessDataType;
							result.attribute.sourceType = attr.sourceType;
							result.attribute.vocabulary = attr.vocaName;
							result.attribute.valueListName = attr.valueListName;
						}
						else {
							
							result.isValid = false;
							result.message.id = "invalid_assoc_or_attr_error_message";
							result.attribute.altAttr = this.getAltTypedAttributes (vocaRTServ, vocaName, curObject, curSegment, result.isCollection, typeArr, modelMngrTermMode);
							result.attribute.altAssoc = this.getAltTypedAssociations (vocaRTServ, vocaName, curObject, curSegment, result.isCollection, typeArr);
							return result;
						}
					}
					else {
						assocInfo.isValid = true;
						assocInfo.vocabulary = assoc.vocaName;
						curObject = assocInfo.object = assoc.target;
						if (this.isCardinalityCollection (assoc.cardinality) && !term) {
							result.isCollection = assocInfo.isCollection = true;
						}
						
						result.associations.isValid = true;
						result.associations.path.push(assocInfo);
					}
				}
				
				return result;
			};

	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	/****************************************************************/
	 vocabularyUtilsLib.prototype.getTypedParam= function(pSProvider, paramName/*, typeArr*/) {
		var params = pSProvider.getObjects ();
		var i;
		
		for (i=0; i<params.length; i++) {
			if (params[i].name === paramName) {
				return params[i];
			}
		}
		
		return null;
	};

	/****************************************************************/
	/****************************************************************/
	 vocabularyUtilsLib.prototype.getTypedNestedParam = function(pSProvider, paramName, nestedParamName/*, isCollection, typeArr*/) {
		var nestedParams = pSProvider.getAssociations (paramName);
		var name = null;
		
		for (name in nestedParams) {
			if (nestedParams.hasOwnProperty (name) && name === nestedParamName) {
				return nestedParams[name];
			}
		}
		
		return null;
	};

	/****************************************************************/
	/****************************************************************/
	 vocabularyUtilsLib.prototype.getTypedParamAttribute= function (pSProvider, paramName, attrName/*, isCollection, typeArr*/) {
		var attrs = pSProvider.getAttributes (paramName);
		var name = null;
		
		for (name in attrs) {
			if (attrs.hasOwnProperty (name) && name === attrName) {
				return attrs[name];
			}
		}
		
		return null;
	};

	/****************************************************************/
	/****************************************************************/
	 vocabularyUtilsLib.prototype.isCollection = function (param) {
		return param.dataType === vocabularyConstants.DATA_TYPE_COLLECTION;
	};

	/****************************************************************/
	/****************************************************************/
	 vocabularyUtilsLib.prototype.isStruct = function (param) {
		return param.dataType === vocabularyConstants.DATA_TYPE_STRUCTURE;
	};

	/****************************************************************/
	/****************************************************************/
	 vocabularyUtilsLib.prototype.isDataObject = function(param) {
		return param.dataType === vocabularyConstants.DATA_TYPE_DATAOBJECT;
	};

	/****************************************************************/
	/****************************************************************/
	 vocabularyUtilsLib.prototype.isLeaf = function (param) {
		return !this.isCollection (param) && !this.isStruct (param) && !this.isDataObject (param);
	};


	/****************************************************************
	 * Function: validateParamDetails
	 * INPUT: Object Path - root, associations, attributes... in
	 *  the form of "root.association1.association2...associationN.attribute"
	 *  
	 *  typeArr: [{type:Number, isCollection:true}, ...]
	 *  
	 *   Note: if the path holds only part of the components - i.e. only the
	 *         root, or part of the root, the path will not be valid, 
	 *         but there will be an eeror message...
	 * 
	 ****************************************************************/
	 vocabularyUtilsLib.prototype.validateParamDetails = function (paramSProvider, navDetails, vocaRTServ, vocaName, typeArr) {
		var result = {
			navigation: navDetails,
			root: {name: null, isValid: false},
			associations: {isValid: false, path:[]},
			attribute: {name: null, dataType: null, size: null, businessDataType: null, isValid: false},
			isValid: false,
			isCollection: false,
			isDataObject: false,
			message: {"id": null, "params":[]}
		};

		if (!navDetails) {
			return result;
		}

		var pathSegments = navDetails.split(".");
		
		if (pathSegments.length < 1) {
			return result;
		}

		var name = pathSegments.shift();
		var isLastSegment = (pathSegments.length === 0);
		var param = this.getTypedParam (paramSProvider, name, typeArr);
		if (!param) {
			if (isLastSegment) {
				result.attribute.name = name;
				result.message.id = "invalid_assoc_or_attr_error_message";
			}
			else {
				result.message.id = "invalid_root_error_message";
				result.root.name = name;
			}
			
			return result;
		}

		if (isLastSegment) {
			result.isValid = true;
			
			if (this.isLeaf (param)) {
				result.attribute.name = name;
				result.attribute.isValid = true;
				result.attribute.dataType = param.dataType;
				result.attribute.size = param.size;
				result.attribute.businessDataType = param.businessDataType;
			}
			else {
				result.root.name = name;
				result.root.isValid = true;
				result.isCollection = this.isCollection (param);
				result.isDataObject = this.isDataObject (param);
			}
			
			return result;
		}

		result.root.name = name;
		if (this.isLeaf (param)) {
			result.message.id = "invalid_root_data_type_error_message";
			return result;
		}
		
		if (this.isDataObject (param)) {
			var omNavigation = param.dataObject.name;
			var i;
			for (i=0; i<pathSegments.length; i++) {
				omNavigation += '.';
				omNavigation += pathSegments[i];
			}
			
			var result2 = this.validateNavigationDetails (omNavigation, vocaRTServ, vocaName, typeArr);
			result2.root = result.root;
			result2.isDataObject = true;
			return result2;
		}

		result.isCollection = this.isCollection (param);
		result.root.isValid = true;
		
		var curParam = result.root.name;
		var curSegment, assocInfo, assoc, attr;
		while (pathSegments.length > 0) {
			curSegment = pathSegments.shift();
			assocInfo = new this.AssocInfo(curSegment);
			assoc = this.getTypedNestedParam (paramSProvider, curParam, curSegment, result.isCollection, typeArr);
			if (!assoc) {
				if (pathSegments.length > 0) {
					result.message.id = "invalid_assoc_error_message";
					result.associations.isValid = result.isValid = false;
					result.associations.path.push(assocInfo);
		//		    $.trace.error('777777777777777777777: ' + (new Date().getTime() - start));
					return result;
				}
				
				result.attribute.name = curSegment;
				attr = this.getTypedParamAttribute (paramSProvider, curParam, curSegment, result.isCollection, typeArr);
				if (attr) {
					result.attribute.isValid = true;
					result.attribute.dataType = attr.dataType;
					result.attribute.size = attr.size;
					result.attribute.businessDataType = attr.businessDataType;
					result.isValid = true;
				}
				else {
					result.isValid = false;
					result.message.id = "invalid_assoc_or_attr_error_message";
		//		    $.trace.error('888888888888888888888888: ' + (new Date().getTime() - start));
				}

				return result;
			}

			assocInfo.isValid = true;
			curParam = assocInfo.object = assoc.name;
			if (this.isCollection (assoc)) {
				result.isCollection = assocInfo.isCollection = true;
			}
			
			result.associations.isValid = true;
			result.associations.path.push(assocInfo);
		}
		 
		//This happen when the path is valid, but no attribute found
		result.message.id = "invalid_path_attr_not_found_error_message";
		return result;
	};

	 vocabularyUtilsLib.prototype.getNavigationCompletion = 
		 function(startWith, vocaRTServ, vocaName, typeArr, valueListAttribute, context, isCurrent, completeCollection, isDeprecatedAllContext, isInsideWhere, isAllContext, modelMngrTermMode, isNoAssocSugg) {
		var result = {
				altDO: [],
				altAlias: [],
				altValueList: []
			};
		isCurrent = (!isCurrent ? false: isCurrent);
		var termModeFlag = null; 
		if(modelMngrTermMode === constantsLib.DISPLAY_TEXT){
			termModeFlag = vocabularyConstants.TermModeRelated.TERM_MODE_BY_DESCRIPTION;
		}
		else{
			termModeFlag = vocabularyConstants.TermModeRelated.TERM_MODE_BY_NAME;
		}
		result.altDO    = this.getAltTypedTerms(vocaRTServ, vocaName, startWith, typeArr, context, isCurrent, completeCollection, isDeprecatedAllContext, true, isInsideWhere, isAllContext, termModeFlag, isNoAssocSugg);
		result.altValueList = this.getAltValueList(vocaRTServ, vocaName, valueListAttribute, startWith);	
		
		if (!isCurrent) {
			result.altAlias = this.getAltTypedAliases (vocaRTServ, vocaName, startWith, typeArr);
		}
		
		return result;
	};

	 vocabularyUtilsLib.prototype.getAttributeByDesc = 
		 function(vocaRTServ, vocaName, objName, attrDesc) {
		 return vocaRTServ.getAttributeByDesc (vocaName, objName, attrDesc);
	};
	
	return {vocabularyUtilsLib : vocabularyUtilsLib};
}());
