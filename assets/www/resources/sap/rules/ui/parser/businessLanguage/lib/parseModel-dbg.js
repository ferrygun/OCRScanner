jQuery.sap.declare("sap.rules.ui.parser.businessLanguage.lib.parseModel");

/****************************************************************
 * Import relevant libraries
 ****************************************************************/
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.entityModelConstractor");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.utils");
jQuery.sap.require("sap.rules.ui.parser.resources.dependencies.lib.constantsBase");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.constantsBase");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.parseUtils");
jQuery.sap.require("sap.rules.ui.parser.resources.dependencies.lib.objects");

/****************************************************************
 ****************************************************************/

sap.rules.ui.parser.businessLanguage.lib.parseModel = sap.rules.ui.parser.businessLanguage.lib.parseModel|| {}; 
sap.rules.ui.parser.businessLanguage.lib.parseModel.lib  = (function(){
    var utilsLib = new sap.rules.ui.parser.businessLanguage.lib.utils.lib();
    var constantsLib = sap.rules.ui.parser.businessLanguage.lib.constants.lib;
    var entityModelConstractorLib =  sap.rules.ui.parser.businessLanguage.lib.entityModelConstractor.lib;
    //var entityModelConstractorLib = new entityModel.entityModelLib();
    var vocaConstantsLib = sap.rules.ui.parser.resources.vocabulary.lib.constantsBase.lib;
    var dependenciesConstantsLib = sap.rules.ui.parser.resources.dependencies.lib.constantsBase.lib;
    var dependenciesObjectsLib = sap.rules.ui.parser.resources.dependencies.lib.objects.lib;
    var parseUtilsLib =  new sap.rules.ui.parser.businessLanguage.lib.parseUtils.lib.parseUtilsLib();


    

        
    function parseModelLib(){
    }   
    parseModelLib.prototype.ModelManager = function () {
    	/*eslint consistent-this: ["error", "me"]*/
        var me = this;
        this.nextTokens = [];
        this.contextQueue = [];
        this.isInsideWhere = false;
        this.disableAliases = false;
        this.lastValueListAttribute = null;
        this.allContext = false;
        this.allTermContext = false;
        this.DFAFaildMode = false;
        this.terms = [];
        this.term = null;
        this.expression = null;
        this.vocaRTServ = null; 
        this.actualReturnType = null;
        this.modelOutput = null;
        this.tokensContext = null;
        
        
        this.parseResult = {
                status: constantsLib.statusEnum.SUCCESS,
                errorDetails: [],
                errorID: null, //ADDED
                cursorPosition: 0,
                actualReturnType: null,
                businessDataType: null,
                isCollection: false,
                
                clear : function(){
                    this.errorDetails = [];
                    this.errorID = null; //ADDED
                    this.cursorPosition = 0;
                    this.status = constantsLib.statusEnum.SUCCESS;
                    this.actualReturnType =  null;
                    this.businessDataType = null;
                    this.isCollection = false;
                },
                
                getParseResults: function(){
                    var result;
                    //At the end of the parsing process a new model is created and can be fetched
                    if (this.status ===  constantsLib.statusEnum.SUCCESS) {
                       // $.trace.error("parse success");
                    	var businessDT = parseUtilsLib.getBusinessDTFromRelType(me.actualReturnType);
                    	
                    	result = {
                            status:  constantsLib.statusEnum.SUCCESS,
                            errorDetails: null,
                            errorID: null, //ADDED
                            model: me.modelOutput,
                            cursorPosition: null,
                            actualReturnType: me.actualReturnType,
                            businessDataType: businessDT[constantsLib.propertiesEnum.businessType],
                            isCollection: businessDT[constantsLib.propertiesEnum.isCollection]
                        };
                        
                        if (me.actualReturnType ===  constantsLib.TYPE_COLLECTION) {
                            result.dataObject = me.dataObject;
                        }
                        
                    } else {
                        //$.trace("parse error");
                        result = {
                            status:  constantsLib.statusEnum.ERROR,
                            errorDetails: this.getErrors(),
                            errorID: this.errorID, //ADDED
                            model: null,
                            cursorPosition: this.cursorPosition,
                            actualReturnType: null,
                            businessDataType: null,
                            isCollection: false
                        };
                        if (this.hasOwnProperty(constantsLib.propertiesEnum.convertedExpression)) {
                        	result.convertedExpression = null;
                        }
                    }
                    
                    if (me.hasOwnProperty( constantsLib.propertiesEnum.flags) &&  me.flags.hasOwnProperty(dependenciesConstantsLib.PROPERTY_NAME_DEPENDENCIES_OUTPUT) &&  me.flags[dependenciesConstantsLib.PROPERTY_NAME_DEPENDENCIES_OUTPUT] === true) {
                        result[dependenciesConstantsLib.PROPERTY_NAME_DEPENDENCIES_OUTPUT] = (this.status ===  constantsLib.statusEnum.ERROR) ? null : me.getDependencies();
                    }
                    
                    if (me.hasOwnProperty( constantsLib.propertiesEnum.flags) &&  me.flags.hasOwnProperty( constantsLib.propertiesEnum.unknownTokens) &&  me.flags[ constantsLib.propertiesEnum.unknownTokens] === true) {
                        result[ constantsLib.propertiesEnum.unknownTokens] = (this.status ===  constantsLib.statusEnum.ERROR && me.hasOwnProperty( constantsLib.propertiesEnum.unknownTokens)) ? me[ constantsLib.propertiesEnum.unknownTokens] : {};
                    }
                    
                    //$.trace("mode parse result " + result);
                    return result;
                },
                getErrors : function () {
                    var errorStr = ""; //"We encountered some errors: \n";
                    var i = 0;
                    for (i; i < this.errorDetails.length; ++i) {
                        errorStr += this.errorDetails[i] + "\n";
                    }
                    return errorStr;
                }
            };
        
        this.popFromContextQueue = function() {
            this.contextQueue.pop();
        };
        
        this.pushToContextQueue = function(context) {
        	this.contextQueue.push(context);
        };
        
        this.clearTermsArray = function() {
            this.terms = [];
        };
        
        this.clearCurrentTerm = function() {
            this.term = null;
        };
        
        this.setCurrentTerm = function(term) {
        	if (this.term === null) {
        		this.term = {};
        	}
            this.term.text = term;
            this.term.whitechar = '';
         };
        
        this.setCurrentTermWhiteChar = function(whiteChar) {
           if (this.term === null) {
        		this.term = {};
                this.term.text = '';
           }
           this.term.whitechar = whiteChar;
        };

         
        this.getCurrentTerm = function() {
            if (this.term === null) {
            	return null;
            }
            return this.term.text;
        };
        
        this.getCurrentTermWhiteChar = function() {
            if (this.term === null) {
            	return '';
            }
            return this.term.whitechar;
        };

       // keep the context for tokens for term conversions
       this.setTokenContext = function(start, tokenText, dataObjectName)  {
    	   if (this.tokensContext === null) {
    		   this.tokensContext = {};
    	   }
    	   this.tokensContext[start] = { token : tokenText, dataObjectContext : dataObjectName }; 
       }; 

       this.getTokenContext = function(start, tokenText)  {
    	   if (this.tokensContext === null) {
    		   return null;
    	   }
    	   var tokenContext = this.tokensContext[start];
    	   if (tokenContext && tokenContext.token === tokenText) {
    		   return tokenContext.dataObjectContext;
    	   }
    	   return null;
       }; 

       // list of next possible tokens for auto complete
        
        //each property of the dictionary will be the index of the navigation object.
        //navigationDictionary {"player.age": navigationPredicate1, "session.start": navigationPredicate2...}
        var navigationDictionary = {};

        this.dateTimeObjectsDictionary = {};
        //Use currentNavigationObject to reflect parsed model in current session
        var currentNavigationObject = {};

        //Use currentNavigationObject to reflect parsed model in current session with context
        var currentNavigationObjectContext = {};

        this.setDFAFailed = function(val) {
            this.DFAFaildMode = val;
        };
        
        this.getDFAFailed = function() {
            return this.DFAFaildMode;
        };    

        
        this.setLastValueListAttribute = function(valueListAttribute) {
            this.lastValueListAttribute = valueListAttribute;
        };
        
        this.cleanValueListAttribute = function() {
            this.lastValueListAttribute = null;
        };
        
        this.getValueListAttribute = function() {
            return this.lastValueListAttribute;
        };    
        
        this.setTermAllContext = function() {
            this.allTermContext = true;
        };
        
        
        this.setAllContext = function() {
            this.allContext = true;
        };
        
        this.cleanAllContext = function() {
        	this.allTermContext = false;
            this.allContext = false;
        };
        
        this.isAllContext = function() {
            return this.allContext;
        };
        
        this.isTermAllContext = function() {
            return this.allTermContext;
        };           
        
        this.setCurrentNavigationObject = function(navigationText, navigationObject) {
            currentNavigationObject[navigationText] = navigationObject;
            // add also to context map
            var contextLength = this.contextQueue.length;
            if (contextLength === 0) {
            	return;
            }
            var currentContext = this.contextQueue[contextLength - 1];
            if (currentContext.root.isAlias || currentContext.root.isParameter) {
                return;
            }
            if (currentNavigationObjectContext.hasOwnProperty(currentContext.navigation) === false) {
            	currentNavigationObjectContext[currentContext.navigation] = {};
            }
            currentNavigationObjectContext[currentContext.navigation][navigationText] = navigationObject;
      };
        this.getCurrentNavigationObject = function(navigationText) {
            if (currentNavigationObject[navigationText] === undefined){
                  return null;
            }
              
            var contextLength = this.contextQueue.length;
            if (contextLength === 0) {
            	return currentNavigationObject[navigationText];
            }
            var currentContext = this.contextQueue[contextLength - 1];
            if (currentContext.root.isAlias || currentContext.root.isParameter) {
                return currentNavigationObject[navigationText];
            }
            if (currentNavigationObjectContext.hasOwnProperty(currentContext.navigation) === false) {
                return currentNavigationObject[navigationText];
            }
            if (currentNavigationObjectContext[currentContext.navigation][navigationText] === undefined) {
                return currentNavigationObject[navigationText];           	
            }
            return currentNavigationObjectContext[currentContext.navigation][navigationText] ;
           
        };
        
        this.getNavigationFromDictionary = function(navigationText) {
           return navigationDictionary[navigationText];
              
        };

        this.addDateTimeObject = function(originalFormatString, hanaFormatString) {
            this.dateTimeObjectsDictionary[originalFormatString] = hanaFormatString;
        };
        this.getDateTimeObject = function(originalFormatString) {
            if (this.dateTimeObjectsDictionary[originalFormatString] === undefined) {
                return null;
            }
            return this.dateTimeObjectsDictionary[originalFormatString];
        };


        

        this.clearModelData = function() {
        	this.allContext = false;
        	this.allTermContext = false;
            this.lastValueListAttribute = null;
            this.DFAFaildMode = false;        	
            this.term = null;
            this.terms = [];
            this.vocabulary = null;
            this.vocaRTServ = null;     
            this.expression = null;
            this.mode = null;
            this.paramServ = null;
            this.contextQueue = [];
            this.isInsideWhere = false;
            this.disableAliases = false;
            this[constantsLib.propertiesEnum.unknownTokens] = {};
            this[constantsLib.propertiesEnum.rootObjectContext] = { "name" : null, "assocNames" :  {}, "assocs" : []};
            navigationDictionary = {};
            currentNavigationObject = {};
            this.modelOutput = null;
            this.actualReturnType = null;
            this.tokensContext = null;
        };
        
        this.clearTerm = function() {
            this.terms = [];
        };

        //will include the statementArray and a result string
        this.modelManagerOutput = function(parseModel) {

            if (arguments.length !== 1) {
                parseUtilsLib.handleWarning("wrong number of arguments for output model");
                //throw ("wrong number of arguments for output model");
                //return;
            }

            var objectName = parseModel.getType();
            if (objectName !== constantsLib.objectNamesEnum.model) {
                parseUtilsLib.handleWarning("failed to create the output Model, unexpected model type");
                //throw("failed to create the output Model, unexpected model type");
                //return;
            }
            me.modelOutput = parseModel;

           // utilsLib.addProperty(this, "ModelOutput", parseModel);
        };

        this.addStatement = function(objectToAdd) {
            // only object of type Statement and Operator can be added to the array
            var objectName = objectToAdd.constructor.name;
            if (! (objectName === "Statement" || objectName === "Operator")) {
                parseUtilsLib.handleWarning("failed to add " + objectToAdd.toString() + " to statement array");
                //throw("failed to add " + objectToAdd.toString() + " to statement array");
            }
            this.statementArray.push(objectToAdd);
        };

      /*  this.createSelection = function(selectionObj) {
            var selection = new entityModelLib.Selection(selectionObj);
            return selection;
        };*/

        this.createWhereFilter = function(filterObj) {
            if (filterObj !== null && filterObj.hasOwnProperty("selection")) {
                var statementFilter = new entityModelConstractorLib.SimpleStatementFilter(filterObj);
                return statementFilter;
            } else {
                var complexStatementFilter = new entityModelConstractorLib.ComplexStatementFilter(filterObj);
                return complexStatementFilter;
            }
        };

        this.getDependencies = function() {
            
            var dependencies = null;
            var key = null;
            var nav, root, parent, assocArr, i;
            
            for (key in navigationDictionary) {
              if (navigationDictionary.hasOwnProperty(key) /*&& navigationDictionary[key].isVliad*/) {
                  nav = this.getCurrentNavigationObject(key);
                  
                  if (!nav.isValid || nav.isParameter){
                      continue;
                  }
                  
                  // init dependencies object
                  dependencies = (dependencies === null) ? {} : dependencies;  
                  
                  //Handle Root
                  root = nav.root.name;
                  
                  if (nav.root.isAlias) {
                      dependencies[vocaConstantsLib.PROPERTY_NAME_ALIASES + "."  + root] = new dependenciesObjectsLib.VocaAlias(root, nav.root.vocabulary);
                  } else {
                      dependencies[vocaConstantsLib.PROPERTY_NAME_DATA_OBJECTS + "."  + root] = new dependenciesObjectsLib.VocaDOInfo(root, nav.root.vocabulary);
                  }
                  parent = root;
                  
                  //Handle Assoc
                  assocArr = nav.associations.path;
                  if (!utilsLib.isEmptyArray(assocArr)) {
                        for (i = 0; i < assocArr.length; i++) {
                            dependencies[vocaConstantsLib.PROPERTY_NAME_DATA_OBJECTS + "." + parent + "." + vocaConstantsLib.PROPERTY_NAME_OM_ASSOCIATIONS + "." + assocArr[i].name] = new dependenciesObjectsLib.VocaDOAssociation(parent, assocArr[i].name, assocArr[i].vocabulary);
                            parent = assocArr[i].object;
                        }
                  }
                     
                  //Handle Attr
                  if (nav.attribute.isValid) {
                      dependencies[vocaConstantsLib.PROPERTY_NAME_DATA_OBJECTS + "."  + parent + "." + vocaConstantsLib.PROPERTY_NAME_ATTRIBUTES + "." + nav.attribute.name] = new dependenciesObjectsLib.VocaDOAttributes(parent, nav.attribute.name, nav.attribute.vocabulary);
                  }
              }
            }
            
            return dependencies;

        };
        
        // naviagtionPredicate = string value of the current navigation to be added
        this.addNavigationToDictionary = function(navigationPredicate, navigationObject) {
            
            var attrType = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.COLLECTION.string;
            if (navigationObject.attribute.businessDataType !== null) {
                attrType = navigationObject.attribute.businessDataType;
            } else if (navigationObject.root.isAlias && navigationObject.root.businessDataType !== null) {
                attrType = navigationObject.root.businessDataType;
            } 
            
            var type_enum = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.getByValue("string", attrType);
            
            var getAssocNames = function(arr) {
                var assocNamesArr = [];
                if (utilsLib.isEmptyArray(arr)) {
                    return assocNamesArr;
                }

                var i;
                for (i = 0; i < arr.length; i++) {
                    assocNamesArr.push(arr[i].name);
                }

                return assocNamesArr;
            };
            
            var nav = utilsLib.getFixedParamName(navigationPredicate);
            var naviagtionDetailsObject = {
                navigationPredicate: nav,
                navigationFullPath : (navigationObject.isParameter) ? nav : navigationObject.navigation,
                rootObject: navigationObject.root.name,
                attribute: navigationObject.attribute.name,
                attributeType: type_enum.value,
                associationsArray: getAssocNames(navigationObject.associations.path),
                attributeMappingType: navigationObject.attribute.sourceType,
                attributeValueList:navigationObject.attribute.valueListName,
                isVocaRule: navigationObject.isVocaRule,
                isCollection: navigationObject.isCollection,
                isParameter: navigationObject.isParameter,
                isAlias: (navigationObject.isParameter) ? false : navigationObject.root.isAlias,
                isDataObject: (navigationObject.isParameter) ? navigationObject.isDataObject : null,
                dataObject:  null,
                modifiers:  (navigationObject.isParameter) ? {} : navigationObject.modifiers
            };

            if (!naviagtionDetailsObject.isAlias && !naviagtionDetailsObject.isParameter) {
                var dataObject = null;
                
                if (utilsLib.isEmptyArray(naviagtionDetailsObject.associationsArray) && naviagtionDetailsObject.attributeType === constantsLib.SIMPLE_SELECTION_VALUE_TYPE.COLLECTION.string) {
                    dataObject = naviagtionDetailsObject.rootObject;
                } else if (!utilsLib.isEmptyArray(naviagtionDetailsObject.associationsArray)) {
                    dataObject = naviagtionDetailsObject.associationsArray[naviagtionDetailsObject.associationsArray.length - 1];
                }
                
                if (naviagtionDetailsObject.attribute === null || naviagtionDetailsObject.attribute === undefined) {
                    this.dataObject = dataObject;
                }
                
                naviagtionDetailsObject.dataObject = dataObject; 
            } 
            
            var navigationPredicateDetails = new entityModelConstractorLib.NavigationPredicateDetails(naviagtionDetailsObject);

            navigationDictionary[navigationPredicate] = navigationPredicateDetails;
            return navigationPredicateDetails;
        };
    };

   
    
    parseModelLib.prototype.getModelManger = function () {
        if (parseModelLib.prototype.manager_singletonInstance) {
            return parseModelLib.prototype.manager_singletonInstance;
        }
        parseModelLib.prototype.manager_singletonInstance = new this.ModelManager();
        return parseModelLib.prototype.manager_singletonInstance;
    };    
    
    parseModelLib.prototype.createModelManger = function () {
        
    	parseModelLib.prototype.manager_singletonInstance = new this.ModelManager();
    	parseModelLib.prototype.manager_singletonInstance.clearModelData();
        return parseModelLib.prototype.manager_singletonInstance;
    };    

    parseModelLib.prototype.validateNavigationRule = function(navigationPredicate/*, vocaRTServ*/) {
//        navigationPredicate = utilsLib.removeInvertedCommas(navigationPredicate);
        // var navigationObject = objUtilLib.validateNavigationDetails(navigationPredicate, vocaRTServ);
        var navigationObject = this.getModelManger().getCurrentNavigationObject(navigationPredicate);
        var navigationDetails = null;
        if (navigationObject.isValid || navigationObject.root.isValid) {
            navigationDetails = this.getModelManger().addNavigationToDictionary(navigationPredicate, navigationObject);
            if(navigationDetails.getModifiers().hasOwnProperty("all") )
            {
            	this.getModelManger().setTermAllContext();
            }
            var attrValueList = navigationDetails.getAttributeValueList();
            if(attrValueList) {
                var valueListAttribute = {};
                valueListAttribute.navPath = navigationPredicate; // TBD - Efra add for validate
                //valueListAttribute.attributevalueList = navDetails.getAttributeValueList();
                valueListAttribute.attributeValueList = navigationObject.attribute.valueListName;
                this.getModelManger().setLastValueListAttribute(valueListAttribute);
            }
           else
            {
                this.getModelManger().cleanValueListAttribute();
            }
        } else {
            parseUtilsLib.handleWarning("general error in " + navigationPredicate);
            
        }
        return navigationDetails;
    };
    
    

    return {parseModelLib:parseModelLib};
    }());









