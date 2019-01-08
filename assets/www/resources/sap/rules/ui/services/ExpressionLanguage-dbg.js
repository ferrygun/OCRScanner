/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2016 SAP SE. All rights reserved
	
 */

// Provides element sap.rules.ui.services.ExpressionLanguage 
sap.ui.define(["jquery.sap.global",
		"sap/ui/core/Element",
		"sap/rules/ui/parser/businessLanguage/lib/parsingBackendMediator",
		"sap/rules/ui/parser/ruleBody/lib/ruleServices",
		"sap/rules/ui/parser/resources/common/lib/resourcesConvertor",
		"sap/rules/ui/parser/resources/vocabulary/lib/vocabularyDataProviderInitiator",
		"sap/rules/ui/parser/infrastructure/messageHandling/lib/responseCollector",
		"sap/ui/core/Locale",
		"sap/ui/core/LocaleData",
		"sap/rules/ui/library"
	],
	function (jQuery, Element, ParsingBackendMediator, RuleServices, resourcesConvertor, RtsInitiator, responseCollector, Locale, LocaleData) {
		"use strict";
		/**
		 * Constructor for a new ExpressionLanguage element.
		 *
		 * @class
		 * Provides the ExpressionLanguage service functionality, such as expression validations, expression parsing, auto-complete suggestions, retrieving expression metadata and tokens, and performing runtime services (fetching data objects, outputs, etc).
		 * @extends  Element
		 *
		 * @author SAP SE
		 * @version 1.52.8
		 *
		 * @constructor
		 * @public
		 * @alias sap.rules.ui.services.ExpressionLanguage
		 * @ui5-metamodel This element also will be described in the UI5 (legacy) designtime metamodel
		 */
		var ExpressionLanguage = Element.extend("sap.rules.ui.services.ExpressionLanguage", {
			metadata: {
				library: "sap.rule.ui",
				properties: {
					/**
					 * The valueHelpCallback is a function that receives by reference an array of value help metadata and adds to each item an OData model instance. The OData model is used for suggesting allowed values and for validating values that are used in the rule.
					 */
					valueHelpCallback: {
						type: "any"
					},
					/**
					 * Path to a Vocabulary object in the model data, which is used for the definition of relative context bindings inside the Expression Language control (mandatory).
					 * Example: "/Vocabularies(Id='0050569181751ED683EFEEC6AA2B73C5')"
					 */
					bindingContextPath: {
						type: "string",
						group: "Misc"
					}
				},
				publicMethods: [
					"setData",
					"validateExpression",
					"getSuggestions",
					"getExpressionMetadata" 
				],
				events: {
					"dataChange": {}
				}
			}
		});
		
		ExpressionLanguage.prototype._initLocale = function () {

			var oLocale = sap.ui.getCore().getConfiguration().getFormatSettings().getFormatLocale(); 
			var oLocaleData = LocaleData.getInstance(oLocale);

			var dateFormatted = oLocaleData.getDatePattern('short');
			var timeFormat = oLocaleData.getTimePattern('medium');
			var timeZoneOffset = -(new Date().getTimezoneOffset());
			var decimalSeparator = oLocaleData.getNumberSymbol('decimal');
			var groupSeparator = oLocaleData.getNumberSymbol('group');

			this._localeSettings = {
				"dateFormat": dateFormatted,
				"timeFormat": timeFormat,
				"timeZoneOffset": timeZoneOffset,
				"number": {
					"groupSeparator": groupSeparator,
					"decimalSeparator": decimalSeparator
				}
			};
			
		};

		ExpressionLanguage.prototype.init = function () {
			this._initLocale();
			this.attachModelContextChange(this._setDataFromModel.bind(this));
        };
        
        ExpressionLanguage.prototype._setDataFromModel = function () {
			if (this.hasModel() && this.getBindingContextPath()){
				this.getModel().read(this.getBindingContextPath(), {
					urlParameters: {
						"$expand": "DataObjects/Associations,DataObjects/Attributes,ValueHelps,Rules"
					},
					success: this.setData.bind(this),
					error : this.makeJavaServiceCall()
				});
			}
        };
        
        ExpressionLanguage.prototype.makeJavaServiceCall = function () {
            this.isJavaService = true;
			if (this.hasModel() && this.getBindingContextPath()){
				this.getModel().read(this.getBindingContextPath(), {
					urlParameters: {
						"$expand": "DataObjects/Associations,DataObjects/Attributes"
					},
					success: this.setData.bind(this)
				});
			}
        };

        
        ExpressionLanguage.prototype.setBindingContextPath = function (value) {
			this.setProperty("bindingContextPath", value, false);
			this.fireModelContextChange();
			return this;
        };

        
        ExpressionLanguage.prototype._initVocaRuntimeService = function () {

            var vocaContent = this._CopyAndRemoveOdataTags(this._data);
            this._vocabularyName = vocaContent.Id || vocaContent.id;
            var inputParamObj = {
                "connection": null,
                "vocaLoadingType": "json",
                "resourceID": this._vocabularyName,
                "resourceContent": vocaContent,
                "termModes": this._getTermModes()
            };

            var runtimeServiceLib = RtsInitiator.lib;

            var runtimeServiceLibInstance = new runtimeServiceLib.vocaDataProviderInitiatorLib(); // eslint-disable-line new-cap

            this._runtimeService = runtimeServiceLibInstance.init(inputParamObj);
            
        };

        ExpressionLanguage.prototype._initBackendParser = function () {
	        var backendParserLib = ParsingBackendMediator.lib;
	        this._backendParser = new backendParserLib.parsingBackendMediatorLib(); // eslint-disable-line  new-cap
        };
		
		ExpressionLanguage.prototype._initParser = function () {
			this._initVocaRuntimeService();
            this._initBackendParser();
        };
        
        
        /**
         * Sets the expression language data (vocabulary and metadata).
         * @param {object}   [oData] Contains the language data
         * @public
         **/
        ExpressionLanguage.prototype.setData = function (oData) {
            //  in case of the oData is not contains the Rules as an array we updateing the oData, this can occuer in the following scenarios:
            // 1) read the oData and the expand parameter is not include the Rules 
            // 2) old recorder test )
            if (oData.Rules && !oData.Rules.results){
				oData.Rules.results = [];
				delete oData.Rules.__deferred;
            }
            this._data = oData;
            this._initParser();
            this.fireDataChange({data: oData});
        };

		
        /*
         * @private
         * @return
         */
        ExpressionLanguage.prototype._isDataExist = function () {

            if (!this._data) {
                return false;
            }
            return true;
        };

        ExpressionLanguage.prototype._removeOdataTags = function (obj) {
			for (var prop in obj){
				if (obj[prop] && typeof obj[prop] === 'object'){
					if (Array.isArray(obj[prop].results)){
						obj[prop] = obj[prop].results;
					}
					this._removeOdataTags(obj[prop]);
				}
			}
        };
        
        ExpressionLanguage.prototype._CopyAndRemoveOdataTags = function (data) {
			var convertedData = {};
			
            if (data) {
				convertedData = JSON.parse(JSON.stringify(data));
				this._removeOdataTags(convertedData);
            }
            return convertedData;
        };
		
		
		
		ExpressionLanguage.prototype._addOdataTags = function(obj) {
			for (var prop in obj){
				if (typeof obj[prop] === 'object'){
					this._addOdataTags(obj[prop]);
					if (Array.isArray(obj[prop]) && prop !== "results"){
						obj[prop] = {"results": obj[prop]};
					}
				}
			}
        };
        
        ExpressionLanguage.prototype._CopyAndAddOdataTags = function(data) {
            var convertedData;
			
            if (data) {
				convertedData = JSON.parse(JSON.stringify(data));
				this._addOdataTags(convertedData);
            }
            return convertedData;
        };

		
		ExpressionLanguage.prototype._getTermModes = function () {
			return ["byName", "byDescription"];
		};
        
        /**
         * Sets the expression language data (vocabulary and metadata).
         * @param {string}   [sSubject] Contains the subject of following parsing call.
         * @return {object}  [oResCollector] The initiated response collector instance.
         * @private
         **/
        ExpressionLanguage.prototype._initResponseCollector = function (sSubject) {

            var ResponseCollector = responseCollector.lib.ResponseCollector;
            var oResCollector = ResponseCollector.getInstance();
            oResCollector.clear();
            oResCollector.addSubject(sSubject);

            return ResponseCollector;
        };


		/**
		 * Convert a rule to display values
		 * @param {object}   [oRule] The rule to be validated.
		 * @param {object}   [flags] The flags used to indicate validation options.
		 * @return {object}  [oResult] The result of the formattrd rule.
		 * @private
		 **/
		ExpressionLanguage.prototype.convertRuleToDisplayValues = function(oRule) {
			
			var oConvert = { "source": "codeText", "target": "displayText" };
			var flags = this._buildFlagsObject(oConvert, null, null, true);

			return this._validateRule(oRule, flags);
		};
		
		        /**
         * Convert a rule to display values
         * @param {object}   [oRule] The rule to be validated.
         * @return {object}  [oResult] The result of the formattrd rule.
         * @private
         **/
        ExpressionLanguage.prototype.convertRuleToCodeValues = function(oRule) {
			
			var oConvert = { "source": "displayText", "target": "codeText" };
            var flags = this._buildFlagsObject(oConvert);

			return this._validateRule(oRule, flags);
		};


        /**
         * Validates a rule
         * @param {object}   [oRule] The rule to be validated.
         * @return {object}  [oResult] The result of the validation.
         * @private
         **/
        ExpressionLanguage.prototype.validateRule = function (oRule) {
			return this._validateRule(oRule);
        };
        
        ExpressionLanguage.prototype._fnValidateRule = function (oRule, flags) {
			flags = flags || {};
			flags.isCollection = false;
			flags.tokensOutput = true;
			
            var oConvertedRule = this._CopyAndRemoveOdataTags(oRule);

            var ResponseCollector = this._initResponseCollector("Rule Validation");
            var resCollectorInstance = ResponseCollector.getInstance();

            var msg = "************* RULE: " + JSON.stringify(oConvertedRule) + "\n\n\n\n" +
                "*************    VOCABULARY: " + JSON.stringify(this._data) + "\n\n\n\n";

            resCollectorInstance.trace(ResponseCollector.severity().debug, msg);

            resCollectorInstance.setOpMessage("RuleValidation", "failure");

            var result = RuleServices.lib.validateRule(oConvertedRule, this._vocabularyName, this._runtimeService, flags);

            if (result.status == "Success") {
                resCollectorInstance.setOpMessage("RuleValidation", "success");
            }
            
            if (result && result.hasOwnProperty("decisionTableData")){
				this._addOdataTags(result.decisionTableData);
			}
			
			resCollectorInstance.setOutput(result);
			return resCollectorInstance.build();
        };


        ExpressionLanguage.prototype._validateRule = function (oRule, flags) {

            if (!this._isDataExist()) {
                return null;
            }
            var finalResponse = this._fnValidateRule(oRule, flags);
			
			var bValueHelpValidation = (finalResponse.output.valueHelp &&
										finalResponse.output.valueHelp.info.length > 0);
			var callBack = this.getValueHelpCallback();	
			var bCallback = callBack && (typeof callBack === "function");
			if (bValueHelpValidation && !bCallback) {
				// technical value help errors are raised only at validate expression level
				this._raiseError({},"Value help callback function is not set or is not a function");
			}
			
			if (bValueHelpValidation && bCallback){
				var valueHelpInfo = finalResponse.output.valueHelp.info;
				callBack.call(this, valueHelpInfo);
				var bOdataModels = true;
				
				for (var i=0; i<valueHelpInfo.length; i++) {
					if (!valueHelpInfo[i].model){
						// technical value help errors are raised only at validate expression level
						this._raiseError({}, "value help model is not provided");
						bOdataModels = false;
						break;
					} else if (!(valueHelpInfo[i].model instanceof sap.ui.model.odata.v2.ODataModel)){
						// technical value help errors are raised only at validate expression level
						this._raiseError({}, "value help model is not an oData V2 model");
						bOdataModels = false;
						break;
					}
				}
				
				if (bOdataModels){
					var arrValueHelpMapDeferred = this._buildValueHelpMap(valueHelpInfo);
					this._buildDeferredResponse(arrValueHelpMapDeferred, flags, finalResponse, valueHelpInfo);
					
					var deferredResult = new jQuery.Deferred();
					finalResponse.deferredResult = deferredResult.promise();
					
					finalResponse.valueHelpMapDeferred.done(function (valueHelpFlags){
						deferredResult.resolve(this._fnValidateRule(oRule, valueHelpFlags));	
						}.bind(this)
					);
					finalResponse.valueHelpMapDeferred.fail(function (){
							deferredResult.resolve(finalResponse);
						}.bind(this)
					);
                    // message 1770063572 resolve although metadataloaded failed once in the past
                    valueHelpInfo.forEach(function(oValueHelpInfo) {
                        if (oValueHelpInfo.model.isMetadataLoadingFailed()) {
                            deferredResult.resolve(finalResponse);
                            return;
                        }
                    });
				}
			}
			return finalResponse;
			
		};
		
		ExpressionLanguage.prototype._validateExpression = function (sExpression, eType, bCollection, bToken, flags) {
			this._initResponseCollector("Parsing");

			var parserResult = this._backendParser.parseExpression(sExpression, sap.rules.ui.BackendParserRequest.Validate, this._runtimeService, null, eType, this._vocabularyName, flags);
			
			var result = {};
			result.status = parserResult.status;
			
			if (parserResult.valueHelp) {
				result.valueHelp = parserResult.valueHelp;	
			}
			
			if (result.status === "Error") {
				result.errorDetails = parserResult.errorDetails;
				result.cursorPosition = parserResult.cursorPosition;
			} else {
				result.actualReturnType = parserResult.actualReturnType;
			}
			
			if (parserResult.tokens) {
				result.tokens = parserResult.tokens;
			}

			return result;
		};
		ExpressionLanguage.prototype._raiseError = function (result, errorDescription){
				result.status = "Error";
				result.cursorPosition = -1;
				var oBundle = sap.ui.getCore().getLibraryResourceBundle("sap.rules.ui.i18n");
				result.errorDetails = oBundle.getText("valueHelpTechnicalError");
				window.console.log(errorDescription);
        };
            
		/**
		 * Validates a given rule expression according to a specific business data type.
		 * @param {string}   [sExpression] The expression to be validated.
		 * @param {sap.rules.ui.ExpressionType}   [eType] The expected data type of the expression.
		 * @param {boolean}   [bCollection] Indicates whether the expression is a collection.
		 * @param {boolean}   [bToken] Indicates whether to return tokenizing semantics.
		 * @return {object}  [oResult] Sends the validation status. In case of success, returns the actual data type of the whole expression). In case of error, returns error details and cursor position of error. If tokenizing was requested, returns the semantics of the tokens identified in the whole expression. If value help use is identified a promise deferredResult is added to the oResult object. deferredResult is resolved with an oResult object that includes validation results also for value help.
		 * @public
		 **/
		ExpressionLanguage.prototype.validateExpression = function (sExpression, eType, bCollection, bToken) {
            if (!this._isDataExist()) {
                return null;
            }
            var flags = this._buildFlagsObject(null, bCollection, bToken, true);
            var validationResult = this._validateExpression(sExpression, eType, bCollection, bToken, flags);
			
			var bValueHelpValidation = (validationResult.valueHelp && (validationResult.valueHelp.info.length > 0));
			if (bValueHelpValidation){
				
				if ((typeof this.getValueHelpCallback()) !== "function" ) {
					this._raiseError(validationResult, "value help callback is not set or is not a function");
					
				} else if (validationResult.status === "Success") {
					var valueHelpInfo = validationResult.valueHelp.info;
					var callBack = this.getValueHelpCallback();
					callBack.call(this, valueHelpInfo);
					var bOdataModels = true;
					
					for (var i=0; i<valueHelpInfo.length; i++) {
						if (!valueHelpInfo[i].model){
							this._raiseError(validationResult, "value help model is not provided");
							bOdataModels = false;
							break;
						} else if (!(valueHelpInfo[i].model instanceof sap.ui.model.odata.v2.ODataModel)){
							this._raiseError(validationResult, "value help model is not an oData V2 model");
							bOdataModels = false;
							break;
						}
					}
					
					if (bOdataModels) {
						var arrValueHelpMapDeferred = this._buildValueHelpMap(valueHelpInfo);
						this._buildDeferredResponse(arrValueHelpMapDeferred, flags, validationResult, valueHelpInfo);
						
						var deferredResult = new jQuery.Deferred();
						validationResult.deferredResult = deferredResult.promise();
						
						validationResult.valueHelpMapDeferred.done(function (valueHelpFlags){
							var finalResult = this._validateExpression(sExpression, eType, bCollection, bToken, flags);
							deferredResult.resolve(finalResult);	
							}.bind(this)
						);
						validationResult.valueHelpMapDeferred.fail(function (finalResult){
							this._raiseError(finalResult, "failed to read from value help oData service");
							deferredResult.resolve(finalResult);	
							}.bind(this)
						);
						
					}
				}
			}
            return validationResult;
        };

		ExpressionLanguage.prototype._buildFlagsObject = function (oConvert, bCollection, bToken, bValueHelp) {
			
			//Default value for bCollection
            if (!bCollection) {
                bCollection = false;
            }

            //Default value for bToken
            if (bToken === undefined || bToken === null) {
                bToken = true;
            }
			
            var flags = { "isCollection": bCollection,
                          "tokensOutput": bToken
			};
            
            //handle locale flag (workaround to enable tests to run with default locale)
            if (this._localeSettings){
                flags.locale = { localeSettings: this._localeSettings };
            }
            
            if (oConvert){
				//handle locale flag
				flags.locale = {
					localeSettings: this._localeSettings,
					convert: oConvert
				};
				
				//handle termMode flag
				flags.termMode = {
					convert: oConvert
				};
			}
			
			if (bValueHelp) {
				flags.valueHelp = {collectInfo: true};
			}
		
			return flags;
		};

        /**
         * Provides a context-sensitive suggestion list that assists the business user with the completion of the input of an expression using the rule expression language.
         * @param {string}   [sExpression] The rule expression to be completed.
         * @param {sap.rules.ui.ExpressionType}   [eType] The expected business data type of the expression.
         * @param {boolean}   [bCollection] Indicates whether the final expression is a collection.
         * @param {boolean}   [bToken] Indicates whether to return tokenizing sementics.
         * @return {object}  [oResult] Returns valid suggestions for the expression that needs to be completed. If tokenizing was requested, returns the semantics of the tokens identified in the whole expression.
         * @public
         **/
        ExpressionLanguage.prototype.getSuggestions = function (sExpression, eType, bCollection, bToken) {

            if (!this._isDataExist()) {
                return null;
            }

            this._initResponseCollector("Parsing");

            var flags = this._buildFlagsObject(null, bCollection, bToken);
            
            var parserResult = this._backendParser.parseExpression(sExpression, sap.rules.ui.BackendParserRequest.Suggests, this._runtimeService, null, eType, this._vocabularyName, flags);

			var VALUE_HELP_TOKEN_TYPE = "valueList";
					   
			for (var i = 0 ; i < parserResult.suggs.length ; i++){
				if ( parserResult.suggs[i].tokenType === VALUE_HELP_TOKEN_TYPE) {
					var oBundle = sap.ui.getCore().getLibraryResourceBundle("sap.rules.ui.i18n");
						parserResult.suggs[i].text = oBundle.getText("valueHelp");
				}
			}


			var result = {};
			result.suggs = parserResult.suggs;
			if (parserResult.tokens) {
				result.tokens = parserResult.tokens;
			}

            return result;
        };
        
        /**
         * Returns the fixed operators contained in the expression.
         * @param {string}   [sExpression] The expression to be completed.
         * @param {object}   [oFilter] The category types for filtering the result (enums from library.js file).
         * @private
         * @return {object}  [oResult] The fixed operators in the expression.
         **/
        ExpressionLanguage.prototype.getSuggestionsByCategories = function (sExpression, oFilter) {
            sExpression = sExpression ? sExpression : "";
            var suggs = this.getSuggestions(sExpression, sap.rules.ui.ExpressionType.BooleanEnhanced, false).suggs;
            suggs = suggs ? suggs : [];

            if (!oFilter) {
                return suggs;
            }

            var oResult = [];

            for (var i = 0; i < oFilter.length; i++) {
                var filter = oFilter[i];
                for (var j = 0; j < suggs.length; j++) {

                    if (filter.tokenType === undefined ||
                        filter.tokenType === suggs[j].tokenType ||
                        filter.hasOwnProperty('tokenType') === false) {

                        if (suggs[j].hasOwnProperty('info') === false) {

                            if ((filter.hasOwnProperty('tokenCategory') === false && filter.hasOwnProperty('tokenBusinessType') === false) ||
                                (filter.tokenCategory === undefined && filter.tokenBusinessType === undefined)) {
                                oResult.push(suggs[j]);
                            }

                        } else if ((filter.tokenCategory === undefined ||
                            filter.tokenCategory === suggs[j].info.category ||
                            filter.hasOwnProperty('tokenCategory') === false)
                            &&
                            (filter.tokenBusinessType === undefined ||
                            filter.tokenBusinessType === suggs[j].info.type ||
                            filter.hasOwnProperty('tokenBusinessType') === false)) {
                            oResult.push(suggs[j]);
                        }
                    }
                }
            }
            return oResult;
        };
        /**
         * Separates the expression into individual tokens.
         * @param {string}   [sExpression] The expression that has to be tokenized.
         * @return {object}  [oResult] Returns the tokens and their semantic information.
         * @public
         **/
        ExpressionLanguage.prototype.getExpressionMetadata = function (sExpression) {     //always return status Success

            if (!this._isDataExist()) {
                return null;
            }
            
            this._initResponseCollector("Parsing");

            var parserResult = this._backendParser.parseExpression(sExpression, sap.rules.ui.BackendParserRequest.GetMetadata, this._runtimeService, null, null, this._vocabularyName, null);

            var result = {};

            result.tokens = parserResult.tokens;

            return result;
        };

        /**
         * Returns the information of a given result
         * @param {string}   [sResult] the result
         * @private
         * @return {object}  [oResultInfo] ....
         **/
        ExpressionLanguage.prototype.getResultInfo = function (sResult) {

            if (!this._isDataExist()) {
                return null;
            }

            var oResultInfo = null;
            oResultInfo = this._runtimeService.getOutput(this._vocabularyName, sResult, null);

            //workaround that adds the paramId
            if (oResultInfo && oResultInfo.name) {
                this._getResultRequiredParamIds(oResultInfo);
            }

            return oResultInfo;
        };
		
		/**
         * Returns all results names in the vocabulary
         * @private
         * @return {Array}  [oResultsNames]
         **/
        ExpressionLanguage.prototype.getResults = function () {

            if (!this._isDataExist()) {
                return null;
            }
            
            var outputs = null;
            var results = [];
            outputs = this._runtimeService.getOutputs(this._vocabularyName).outputs;
            for (var i = 0; i < outputs.length; i++){
				results.push({
					id: outputs[i].id,
					name: outputs[i].name,
					description: outputs[i].description,
					columns: outputs[i].requiredParams
				});
			}
			
            //handle for javaservice calls
			if (this.isJavaService || this._data.DataObjects){
			  outputs = this._data.DataObjects.results;
			  for (var dataObj = 0; dataObj < outputs.length; dataObj++){
				results.push({
					id: outputs[dataObj].Id,
					name: outputs[dataObj].Name,
					description: outputs[dataObj].Description
					//columns: outputs[i].requiredParams
				});
			}
			}
			return results;
        };
        /**
         * Returns description for output column name
         * @param {string}   [oName] The output column's name.
         * @param {string}   [outputID] The output column's Id.
         * @return {string}  The output column's description.
         * @private
         **/
        ExpressionLanguage.prototype.getResultColumnDescription = function (oName,outputID) {
		if (!this._isDataExist()) {
			return oName;
		}
		var outputs = null;
		var params = [];
		var i = 0;
		outputs = this._runtimeService.getOutputs(this._vocabularyName).outputs;
		for (i = 0; i < outputs.length; i++){
			if (outputs[i].id === outputID){
				params = outputs[i].requiredParams;
				break;
			}
		}
		for (i = 0; i < params.length; i++){
			if (params[i].name === oName){
				if (params[i].description !== ""){
					return params[i].description;
				}
			}
		}
		return oName;
        };
        
        /**
         * Returns the information of a given result
         * @param {string}   [oResultInfo] the result Info
         * @private
         **/
        ExpressionLanguage.prototype._getResultRequiredParamIds = function (oResultInfo) {
            var i, j, k;
            var convertedData = JSON.parse(JSON.stringify(this._data));

            //Result conversion
            if (convertedData.DataObjects && convertedData.DataObjects.results) {
                convertedData.DataObjects = convertedData.DataObjects.results;

                for (i = 0; i < convertedData.DataObjects.length; i++) {
                    if (convertedData.DataObjects[i].Attributes
                        && convertedData.DataObjects[i].Attributes.results
                        && (convertedData.DataObjects[i].Name == oResultInfo.name)
                        && (convertedData.DataObjects[i].Usage == "RESULT")
                        && oResultInfo.requiredParams) {
                        convertedData.DataObjects[i].Attributes = convertedData.DataObjects[i].Attributes.results;
                        for (j = 0; j < convertedData.DataObjects[i].Attributes.length; j++) {
                            for (k = 0; k < oResultInfo.requiredParams.length; k++) {
                                if (oResultInfo.requiredParams[k].name === convertedData.DataObjects[i].Attributes[j].Name) {
                                    oResultInfo.requiredParams[k].paramId = convertedData.DataObjects[i].Attributes[j].Id;
                                }
                            }
                        }
                        // paramId updated
                        return;
                    }
                }
            }
            //not found
            return;
        };

        ExpressionLanguage.prototype._setConfigurationForBasic = function() {

            this.suggestAfterMap = {
                // initial should be taken from configuration
                "initial": [
                    "vocabulary,undefined"
                ],
                "vocabulary,undefined": [
                    "reservedword,comparisonOp",
                    "reservedword,comparisonBetweenOp",
                    "reservedword,comparisonExistOp"
                ],
                "reservedword,comparisonOp": [
                    "constant,dynamic",
                    "constant,fixed",
                    "reservedword,value"
                ],
                "reservedword,comparisonBetweenOp": [
                    "constant,dynamic",
                    "reservedword,value"
                ],
                "reservedword,comparisonExistOp": [
                    "constant,dynamic",
                    "constant,fixed",
                    "reservedword,value"
                ],
                "reservedword,UOM": [
                    "reservedword,null",
                    "reservedword,conjunctionOp"
                ],
                "reservedword,function": [
                    "vocabulary,undefined"
                ],
                "reservedword,conjunctionOp": [
                    "initial"
                ],
                "reservedword,value": [
                    "reservedword,null",
                    "reservedword,conjunctionOp"
                ],
                "reservedword,null": [
                    "reservedword,conjunctionOp"
                ],
                "constant.dynamic": [
                    "reservedword,UOM",
                    "reservedword,null",
                    "reservedword,conjunctionOp"
                ],
                "constant.fixed": [
                    "reservedword,null",
                    "reservedword,conjunctionOp"
                ],
                "unknown,undefined": []
            };

            this.filterByTypeMap = {
                "vocabulary,undefined": [{
                    tokenType: sap.rules.ui.ExpressionTokenType.vocabulary
                }],
                "reservedword,comparisonOp": [{
                    tokenType: sap.rules.ui.ExpressionTokenType.reservedWord,
                    tokenCategory: sap.rules.ui.ExpressionCategory.comparisonOp
                }],
                "reservedword,comparisonBetweenOp": [{
                    tokenType: sap.rules.ui.ExpressionTokenType.reservedWord,
                    tokenCategory: sap.rules.ui.ExpressionCategory.comparisonBetweenOp
                }],
                "reservedword,comparisonExistOp": [{
                    tokenType: sap.rules.ui.ExpressionTokenType.reservedWord,
                    tokenCategory: sap.rules.ui.ExpressionCategory.comparisonExistOp
                }],
                "reservedword,UOM": [{
                    tokenType: sap.rules.ui.ExpressionTokenType.reservedWord,
                    tokenCategory: sap.rules.ui.ExpressionCategory.UOM
                }],
                "reservedword,function": [{
                    tokenType: sap.rules.ui.ExpressionTokenType.reservedWord,
                    tokenCategory: sap.rules.ui.ExpressionCategory.func
                }],
                "reservedword,conjunctionOp": [{
                    tokenType: sap.rules.ui.ExpressionTokenType.reservedWord,
                    tokenCategory: sap.rules.ui.ExpressionCategory.conjunctionOp
                }],
                "reservedword,value": [{
                    tokenType: sap.rules.ui.ExpressionTokenType.reservedWord,
                    tokenCategory: sap.rules.ui.ExpressionCategory.value
                }],
                "reservedword,null": [{
                    tokenType: sap.rules.ui.ExpressionTokenType.reservedWord,
                    tokenCategory: null
                }],
                "constant.dynamic": [{
                    tokenType: sap.rules.ui.ExpressionTokenType.constant,
                    tokenCategory: sap.rules.ui.ExpressionCategory.dynamic
                }],
                "constant.fixed": [{
                    tokenType: sap.rules.ui.ExpressionTokenType.constant,
                    tokenCategory: sap.rules.ui.ExpressionCategory.fixed
                }]
            };
        };

        ExpressionLanguage.prototype.getSuggestionsForBasic = function(sExpression, eType, bCollection) {
            var suggestions = [];
            var result = this.getSuggestions(sExpression, eType, bCollection, true);

            if (!result || !result.suggs || !result.suggs.length) {
                return suggestions;
            }

            suggestions = this._filterSuggestionsForBasic(result);

            return suggestions;
        };

        ExpressionLanguage.prototype._filterSuggestionsForBasic = function(aSuggs) {
            var tokens = this._groupTokensByTokenType(aSuggs.tokens);
            var lastToken = null;

            if (tokens && tokens.length > 0) {
                lastToken = tokens[tokens.length - 1];
            }

            var category = this._getCategoryForToken(lastToken);
            var allowedSuggTypes = this.suggestAfterMap[category];
            var filters = this._getFilterForTokenTypes(allowedSuggTypes);

            var allowedSuggs = this._filterSuggestionsByCategories(aSuggs, filters);

            return {
                suggs: allowedSuggs,
                afterTokenType: lastToken && lastToken.tokenType
            };
        };

        ExpressionLanguage.prototype._getCategoryForToken = function(token) {

            if (!token) {
                return "initial";
            }

            var tokenType = token.tokenType;
            var infoCategory = token.info && token.info.category;

            return tokenType + "," + infoCategory;

        };

        ExpressionLanguage.prototype._getFilterForTokenTypes = function(aTypes) {
            var filters = [];

            for (var i = 0; i < aTypes.length; i++) {
                var type = aTypes[i];

                var filter = this.filterByTypeMap[type];
                if (filter) {
                    filters.push(filter);
                }
            }

            return filters;
        };

        /**
         *
         * @param {array}   [aSuggs] array of all suggestions for some expression.
         * @param {object}   [oFilter] The category types for filtering the result (enums from library.js file).
         * @return {array} results
         * @private
         **/
        ExpressionLanguage.prototype._filterSuggestionsByCategories = function (aSuggs, oFilter) {

            var oResult = [];

            if (!aSuggs || !oFilter) {
                return oResult;
            }

            for (var i = 0; i < oFilter.length; i++) {
                var filter = oFilter[i];
                for (var j = 0; j < aSuggs.length; j++) {

                    if (filter.tokenType === undefined ||
                        filter.tokenType === aSuggs[j].tokenType ||
                        filter.hasOwnProperty('tokenType') === false) {

                        if (aSuggs[j].hasOwnProperty('info') === false) {

                            if ((filter.hasOwnProperty('tokenCategory') === false && filter.hasOwnProperty('tokenBusinessType') === false) ||
                                (filter.tokenCategory === undefined && filter.tokenBusinessType === undefined)) {
                                oResult.push(aSuggs[j]);
                            }

                        } else if ((filter.tokenCategory === undefined ||
                            filter.tokenCategory === aSuggs[j].info.category ||
                            filter.hasOwnProperty('tokenCategory') === false)
                            &&
                            (filter.tokenBusinessType === undefined ||
                            filter.tokenBusinessType === aSuggs[j].info.type ||
                            filter.hasOwnProperty('tokenBusinessType') === false)) {
                            oResult.push(aSuggs[j]);
                        }
                    }
                }
            }
            return oResult;
        };

        ExpressionLanguage.prototype._groupTokensByTokenType = function(aTokens) {
            var tokenGroups = [];

            if (!aTokens || !aTokens.length) {
                return tokenGroups;
            }

            var previousType = "";

            for (var i = 0; i < aTokens.length; i++) {
                var token = aTokens[i];
                if (token.tokenType === sap.rules.ui.ExpressionTokenType.whitespace) {
                    continue;
                } else if (token.tokenType !== sap.rules.ui.ExpressionTokenType.vocabulary) {
                    tokenGroups.push(token);
                    previousType = token.tokenType;
                } else {
                    if (previousType !== sap.rules.ui.ExpressionTokenType.vocabulary) {
                        tokenGroups.push(token);
                    } else {
                        tokenGroups[tokenGroups.length - 1].token += " " + token.token;
                        tokenGroups[tokenGroups.length - 1].end = token.end;
                    }
                    previousType = token.tokenType;
                }
            }

            return tokenGroups;
        };
    
        ExpressionLanguage.prototype._getSubExpressions = function(aTokens, expression) {
            
            if (!aTokens) {
                aTokens = this.validateExpression(expression);
            }
            
            var aExpressions = [];
            
            
            var i;
            var compToken;
            for (i = aTokens.tokens.length - 1 ; i >= 0 ; i--) {
                if (aTokens.tokens[i].info) {
                    var oTokenInfo = aTokens.tokens[i].info;
                    if (oTokenInfo.category === sap.rules.ui.ExpressionCategory.comparisonOp || oTokenInfo.category === sap.rules.ui.ExpressionCategory.comparisonBetweenOp || oTokenInfo.category === sap.rules.ui.ExpressionCategory.comparisonExistOp) {
                        compToken = aTokens.tokens[i];
                        break;
                    }
                }
            }
            
            /*var compTokens = aTokens.tokens.filter(function( obj ) { //comp expression
                var oTokenInfo = obj.info;
                if (oTokenInfo) {
                    return oTokenInfo.category === sap.rules.ui.ExpressionCategory.comparisonOp || oTokenInfo.category === sap.rules.ui.ExpressionCategory.comparisonBetweenOp || oTokenInfo.category === sap.rules.ui.ExpressionCategory.comparisonExistOp;
                }
                
                return null;
            });*/
            
            aExpressions.push({
                exp: ""
            });

            var p = 0;
            while (p < aTokens.tokens.length && (aTokens.tokens[p] !== compToken)) {
                aExpressions[0].exp += aTokens.tokens[p].token;
                p++;
            } //left expression

            aExpressions[0].exp = aExpressions[0].exp.replace(/  +/g, ' '); // remove multiple spaces with one
            if (!aExpressions[0].exp) {
                return aExpressions;
            }

            if (aExpressions[0].exp.slice(-1) === " ") { //if last character of right side is white space - delete it!
                aExpressions[0].exp = aExpressions[0].exp.slice("", -1);
            }

            p++; //skip the comp we found

            if (!compToken) {
                return aExpressions;
            }

            aExpressions.push({
                exp: compToken.token.replace(/  +/g, ' '), // remove multiple spaces with one
                type: this._getCompType(this.exp)
            }); //if we have only left side, then comp expression need to be "" for creating the control

            if (p < aTokens.tokens.length) {
                aExpressions.push({
                    exp: ""
                }); //if we have only left side and comp, then right expression need to be "" for creating the control

                for ( ; p < aTokens.tokens.length ; p++) { //right expression
                    aExpressions[2].exp += aTokens.tokens[p].token;
                }
            }

            return aExpressions;
        };

        ExpressionLanguage.prototype._getBasicSuggestions = function(expression, ePart) {
            if (!ePart) {
                ePart = sap.rules.ui.SuggestionsPart.all;
            }
            var oTokens = this.validateExpression(expression); //get tokens for getting sub expression

            var oSuggestions = []; // array of suggestions (return variable)

            var aExpression = this._getSubExpressions(oTokens); // get the sub expression

            var sLeftExpression = (aExpression[0] && aExpression[0].exp) ? aExpression[0].exp : "";
            if (ePart === sap.rules.ui.SuggestionsPart.all) { // pus the left suggestions 
                oSuggestions.push(this._getLeftSuggestions("", sLeftExpression)); // push the left suggestion

                if (sLeftExpression === "") { //if we have only left side
                    return oSuggestions;
                }
            }

            var sCompExpression = (aExpression[1] && aExpression[1].exp) ? aExpression[1].exp : "";
            var sCompType = "" || (aExpression[1] && aExpression[1].type);
            if (ePart === sap.rules.ui.SuggestionsPart.all || ePart === sap.rules.ui.SuggestionsPart.compPart) {
                oSuggestions.push(this._getCompSuggestions(sLeftExpression, sCompExpression, sCompType)); // push the comp suggestion

                if (aExpression.length === 1) { //if we have only left side and comp
                    return oSuggestions;
                }
            }

            if (ePart === sap.rules.ui.SuggestionsPart.all || ePart === sap.rules.ui.SuggestionsPart.rightPart) {
                var sRightExpression = (aExpression[2] && aExpression[2].exp) ? aExpression[2].exp : "";
                sCompType = (ePart === sap.rules.ui.SuggestionsPart.all) ? oSuggestions[1].type : null;
                var oRightSuggestions = this._getRightSuggestions(sLeftExpression, sCompExpression, sRightExpression, sCompType, oTokens); // get the right suggestionS

                oSuggestions.push.apply(oSuggestions, oRightSuggestions);
            }
            return oSuggestions;
        };

        ExpressionLanguage.prototype._getLeftSuggestions = function(sEmptyString, currentValue) {

            var oSuggestion = this._createEmptySuggestion(1)[0]; //the return suggestion

            var oFilters = [{tokenType : sap.rules.ui.ExpressionTokenType.vocabulary}]; //the filter for getSuggestionsByCategories

            var oSuggestions = this.getSuggestionsByCategories(sEmptyString, oFilters);

            for (var i = 0 ; i < oSuggestions.length ; i++) {
                oSuggestion.sugg.push(oSuggestions[i].text); //put the suggestions by categories into sugg property
            }

            oSuggestion.currentValue = currentValue; //put current value

            oSuggestion.tokenCategory = sap.rules.ui.ExpressionTokenType.vocabulary;

            return oSuggestion;
        };

        ExpressionLanguage.prototype._getCompSuggestions = function(sLeftSide, currentValue, sCompType) {

            var oSuggestion = this._createEmptySuggestion(1)[0]; //the return suggestion

            var oFilters = [{
                tokenType: sap.rules.ui.ExpressionTokenType.reservedWord,
                tokenCategory: sap.rules.ui.ExpressionCategory.comparisonOp
            }, {
                tokenType: sap.rules.ui.ExpressionTokenType.reservedWord,
                tokenCategory: sap.rules.ui.ExpressionCategory.comparisonBetweenOp
            }]; //the filter for getSuggestionsByCategories

            var oSuggestions = this.getSuggestionsByCategories(sLeftSide, oFilters);

            oSuggestion.type = sCompType || this._getCompType(currentValue); //get comparison type (can't get expressionMetadata for empty string)

            for (var i = 0 ; i < oSuggestions.length ; i++) {
                oSuggestion.sugg.push(oSuggestions[i].text); //put the suggestions by categories into sugg property
            }

            //oSuggestion.sugg.sort();

            oSuggestion.currentValue = currentValue; //put current value

            //oSuggestion.tokenCategory = sap.rules.ui.ExpressionTokenType.vocabulary;

            return oSuggestion;
        };

        ExpressionLanguage.prototype._getRightSuggestions = function(sLeft, sComp, currentValue, sCompType, oTokens) {
            var aSuggestion;
            var sLefAndCompExprerssion = sLeft + " " + sComp; //calculate left side + comp
            var sLeftBusinessDataType = this._getLeftBusinessDataType(sLeft); //get business left data type
            if (!sCompType) { //true if we not in get all parts
                sCompType = this._getCompType(sComp); //get comparison type (can't get expressionMetadata for empty string)
            }
            switch (sCompType) {
                case sap.rules.ui.ExpressionCategory.comparisonOp: //in case simple comparison
                    aSuggestion = this._geRightForComparisonOp(sLeftBusinessDataType, sLefAndCompExprerssion, currentValue);
                    break;
                case sap.rules.ui.ExpressionCategory.comparisonBetweenOp: //in case simple comparison
                    aSuggestion = this._geRightForBetweenOp(sLeftBusinessDataType, sLefAndCompExprerssion, currentValue);
                    break;
                case sap.rules.ui.ExpressionCategory.comparisonExistOp: //in case exist comparison
                    //aSuggestion = this._geRightForExistOp(sLeftBusinessDataType, sLefAndCompExprerssion, currentValue, oTokens);
                    break;
                default:
					break;
            }
            if (!aSuggestion) {
                return [{}];
            }
            return aSuggestion;
        };

        ExpressionLanguage.prototype._geRightForComparisonOp = function(sLeftBusinessDataType, sLefAndCompExprerssion, currentValue) {
            var oSuggestion = this._createEmptySuggestion(1); //the return right suggestions
            var aSuggestions;
            oSuggestion[0].BDT = sLeftBusinessDataType;
			var oFilters;
			var i;
			
            if (sLeftBusinessDataType === sap.rules.ui.ExpressionType.TimeSpan) { // sLeftBusinessDataType = TimeSpan (duration)
                oSuggestion.push.apply(oSuggestion, this._createEmptySuggestion(1)); // add more suggestion {value}
                oFilters = [{
                    tokenType: sap.rules.ui.ExpressionTokenType.reservedWord,
                    tokenCategory: sap.rules.ui.ExpressionCategory.UOM
                }];

                var filtered = this._splitStringBySeperator(currentValue, " "); // remove space for example "3 days" --> ["3", "days"]

                oSuggestion[0].currentValue = filtered[0];
                oSuggestion[1].currentValue = filtered[1];

                aSuggestions = this.getSuggestionsByCategories(sLefAndCompExprerssion + " 5", oFilters);
                for (i = 0 ; i < aSuggestions.length ; i++) {
                    oSuggestion[1].sugg.push(aSuggestions[i].text);
                }

            } else if (sLeftBusinessDataType === sap.rules.ui.ExpressionType.Date) { // sLeftBusinessDataType = Date (birthdate) 
                oFilters = [{
                    tokenType: sap.rules.ui.ExpressionTokenType.reservedWord,
                    tokenCategory: sap.rules.ui.ExpressionCategory.value
                }, {
                    tokenType: sap.rules.ui.ExpressionTokenType.constant,
                    tokenCategory: sap.rules.ui.ExpressionCategory.dynamic
                }];

                aSuggestions = this.getSuggestionsByCategories(sLefAndCompExprerssion + " ", oFilters);
                for (i = 0 ; i < aSuggestions.length ; i++) {
                    oSuggestion[0].sugg.push(aSuggestions[i].text);
                }
                oSuggestion[0].currentValue = jQuery.trim(currentValue); //remove extra spaces before and after string [duplicate]

            } else { //sLeftBusinessDataType = number/string/etc...
                oFilters = [{
                     tokenType: sap.rules.ui.ExpressionTokenType.valueList
                 }];
                 aSuggestions = this.getSuggestionsByCategories(sLefAndCompExprerssion + " ", oFilters);
                 //remove extra spaces before and after string [duplicate]
                 oSuggestion[0].currentValue = jQuery.trim(currentValue);
                 //is value list - mark it
                 if (aSuggestions.length) {
                     oSuggestion[0].valueListObject = aSuggestions[0].info;
                     oSuggestion[0].isValueList = true;
                 }

                oSuggestion[0].currentValue = jQuery.trim(currentValue); //remove extra spaces before and after string [duplicate]
            }
            return oSuggestion;
        };

        ExpressionLanguage.prototype._geRightForBetweenOp = function(sLeftBusinessDataType, sLefAndCompExprerssion, currentValue) {
            
            //check if there is a comperison in the right part - if so currentValue will be ""
            (function() {
                var aTokens = this.validateExpression(currentValue).tokens;
                if (aTokens) {
                    for (var i = 0 ; i < aTokens.length ; i++) {
                        if (aTokens[i].info && (aTokens[i].info.category === sap.rules.ui.ExpressionCategory.comparisonOp || aTokens[i].info.category === sap.rules.ui.ExpressionCategory.comparisonBetweenOp || aTokens[i].info.category === sap.rules.ui.ExpressionCategory.comparisonExistOp)) {
                            currentValue = "";
                            return;
                        }
                    }
                }
            }.bind(this))();
            
            var oSuggestion = this._createEmptySuggestion(1); //the return right suggestions
            var aSuggestions;
            var filtered, oFilters, i;
            
            oSuggestion[0].BDT = sLeftBusinessDataType;
            if (sLeftBusinessDataType !== sap.rules.ui.ExpressionType.TimeSpan && sLeftBusinessDataType !== sap.rules.ui.ExpressionType.Date) {
                filtered = this._getRightExpressionsForTimeStamp(currentValue); //get expression for non Timespan or Date right side
            } else {
                filtered = this._splitStringBySeperator(currentValue, " "); // remove space, for example "3 days to 10 years" --> ["3", "days", "to", "10", "years"]
                /*if (filtered.length === 2 && filtered[0] === "to") {
                    filtered.unshift("''");
                }*/
            }

            if (sLeftBusinessDataType === sap.rules.ui.ExpressionType.TimeSpan) { // sLeftBusinessDataType = TimeSpan (for example duration) 

                oSuggestion.push.apply(oSuggestion, this._createEmptySuggestion(4)); //create new suggestions = [{units} To {value units}]
                oSuggestion[3].BDT = sLeftBusinessDataType;

                oFilters = [{
                    tokenType: sap.rules.ui.ExpressionTokenType.reservedWord,
                    tokenCategory: sap.rules.ui.ExpressionCategory.UOM
                }];

                aSuggestions = this.getSuggestionsByCategories(sLefAndCompExprerssion + " 5", oFilters);
                for (i = 0 ; i < aSuggestions.length ; i++) {
                    oSuggestion[1].sugg.push(aSuggestions[i].text);
                    oSuggestion[4].sugg.push(aSuggestions[i].text);
                }

            } else if (sLeftBusinessDataType === sap.rules.ui.ExpressionType.Date) { // sLeftBusinessDataType = Date (for example birthdate)
                oSuggestion.push.apply(oSuggestion, this._createEmptySuggestion(2)); //create new suggestions = [To {date}]
                oSuggestion[2].BDT = sLeftBusinessDataType;

                oFilters = [{
                    tokenType: sap.rules.ui.ExpressionTokenType.reservedWord,
                    tokenCategory: sap.rules.ui.ExpressionCategory.value
                }, {
                    tokenType: sap.rules.ui.ExpressionTokenType.constant,
                    tokenCategory: sap.rules.ui.ExpressionCategory.dynamic
                }];

                aSuggestions = this.getSuggestionsByCategories(sLefAndCompExprerssion + " ", oFilters);
                for (i = 0 ; i < aSuggestions.length ; i++) {
                    oSuggestion[0].sugg.push(aSuggestions[i].text);
                    oSuggestion[2].sugg.push(aSuggestions[i].text);
                }

            } else { //sLeftBusinessDataType = number/string/etc...
                oSuggestion.push.apply(oSuggestion, this._createEmptySuggestion(2)); //create new suggestions = [To {value}]
                oSuggestion[2].BDT = sLeftBusinessDataType;
                oFilters = [{
                     tokenType: sap.rules.ui.ExpressionTokenType.valueList
                }];
                aSuggestions = this.getSuggestionsByCategories(sLefAndCompExprerssion + " ", oFilters);
                //remove extra spaces before and after string [duplicate]
                oSuggestion[0].currentValue = jQuery.trim(currentValue);
                //is value list - mark it
                if (aSuggestions.length) {
                    oSuggestion[0].valueListObject = aSuggestions[0].info;
                    oSuggestion[0].isValueList = true;
                    oSuggestion[2].valueListObject = aSuggestions[0].info;
                    oSuggestion[2].isValueList = true;
                }
                

            }

            for (i = 0 ; i < oSuggestion.length ; i++) { //put value in suggestions and set the 'to' suggestion
                if (filtered[i] === "to" || (i === 2 && sLeftBusinessDataType === sap.rules.ui.ExpressionType.TimeSpan) //logic for putting the 'to'\'and' at currentValue
                    || (i === 1 && sLeftBusinessDataType === sap.rules.ui.ExpressionType.Date)
                    || ((i === 1 && sLeftBusinessDataType !== sap.rules.ui.ExpressionType.Date) && (i === 1 && sLeftBusinessDataType != sap.rules.ui.ExpressionType.TimeSpan))) {
                    oSuggestion[i].tokenCategory = "reservedword.undefined";
                    oSuggestion[i].currentValue = (filtered[i] === "to" || filtered[i] === "and") ? filtered[i] : "to";
                } else if (sLeftBusinessDataType === sap.rules.ui.ExpressionType.Date) {
                    oSuggestion[i].currentValue = jQuery.trim(filtered[i] || "''"); //remove extra spaces before and after string [duplicate]
                } else if (sLeftBusinessDataType === sap.rules.ui.ExpressionType.TimeSpan) {
                    oSuggestion[i].currentValue = jQuery.trim(filtered[i] || "''"); //remove extra spaces before and after string [duplicate]
                } else {
                    oSuggestion[i].currentValue = jQuery.trim(filtered[i]); //remove extra spaces before and after string [duplicate]
                    }
                }
            return oSuggestion;
            };

        ExpressionLanguage.prototype._geRightForExistOp = function(sLeftBusinessDataType, sLefAndCompExprerssion, sRight, aTokens) {
            var oSuggestion = this._createEmptySuggestion(1); //the return right suggestions
            oSuggestion[0].BDT = sLeftBusinessDataType;
            var aResults;
            if (sLeftBusinessDataType === sap.rules.ui.ExpressionType.TimeSpan) {
                aResults = aTokens.tokens.filter(function( obj ) { //comp expression
                    if (obj.info) {
                        return obj.info.category === sap.rules.ui.ExpressionCategory.UOM || obj.tokenType === sap.rules.ui.ExpressionTokenType.constant;
                    }
                    
                    return null;
                });
                aResults.forEach(function(value, i) {

                });
            } else if (sLeftBusinessDataType === sap.rules.ui.ExpressionType.Date) {
                aResults = aTokens.tokens.filter(function( obj ) { //comp expression
                    if (obj.info) {
                        return obj.info.category === sap.rules.ui.ExpressionCategory.value;
                    }
                    
                    return null;
                });

                aResults.forEach(function(value, i) {

                });

            }
            return oSuggestion;

        };

        ExpressionLanguage.prototype._getLeftBusinessDataType = function(sLeftExpression) {
            var oTokens = this.validateExpression(sLeftExpression);
            var sBDT = oTokens.actualReturnType;
            if (sBDT) {
                return sBDT;
            }
            return oTokens;
        };

        ExpressionLanguage.prototype._splitStringBySeperator = function(sExpression, sSeperator) {
            return sExpression.split(sSeperator).filter((function removeEmptyStrings(str) { // remove empty strings
                return str !== "";
            }));
        };

        ExpressionLanguage.prototype._getCompType = function(sComp) {
            if (sComp) {
                return this.getExpressionMetadata(sComp).tokens[0].info.category; //get comparison type (can't get expressionMetadata for empty string)
            } else {
                return null;
            }
        };

        ExpressionLanguage.prototype._createEmptySuggestion = function(iAmount) { //create empty suggestion
            var aSuggestions = [];
            for (var i = 0 ; i < iAmount ; i++) {
                aSuggestions.push({
                    sugg: []
                });
            }
            return aSuggestions;
        };

        ExpressionLanguage.prototype._getRightExpressionsForTimeStamp = function(expression) {
			
			//TODO: remove this function from string prototype 
            if (!String.prototype.includes) {
                String.prototype.includes = function() {
                    return String.prototype.indexOf.apply(this, arguments) !== -1;
                };
            }
			
			var filtered;
            if (expression.indexOf("to") !== -1) { //if expression have 'to'
                filtered = this._splitStringBySeperator(expression, "to"); //split expression by 'to'
                filtered.splice(1, 0, "to"); // put 'to' in the array
                
                return filtered;
            } else if (expression.indexOf("and") !== -1) { //if expression have 'and'
                filtered = this._splitStringBySeperator(expression, "and"); //split expression by 'and'
                filtered.splice(1, 0, "and"); // put 'and' in the array
                return filtered;
            }
            return [expression, "to"];
        };

        ExpressionLanguage.prototype.convertDecisionTableExpressionToDisplayValue = function (sHeaderExpression, sFixedOpr, sCellExpression,
                                                                                              eExpressionType) {
			var oConvert = {
				"source": "codeText",
				"target": "displayText"
			};
			var flags = this._buildFlagsObject(oConvert);
			var finalResponse = this._validateDecisionTableExpression(sHeaderExpression, sFixedOpr, sCellExpression, eExpressionType, flags,
				"RuleServiceValidation");
			return finalResponse;
		};
		
		ExpressionLanguage.prototype.getDecisionTableCellTokens = function(sHeaderExpression, sFixedOpr, sCellExpression,
																		   eExpressionType) {

			var flags = this._buildFlagsObject(null, "", true, false);
			var response = RuleServices.lib.validateDecisionTableExpression(sHeaderExpression,
																			sFixedOpr,
																			sCellExpression,
																			eExpressionType,
																			this._vocabularyName,
																			this._runtimeService,
																			null,
																			flags);
			return response;
		};

		ExpressionLanguage.prototype.convertDecisionTableExpressionToModelValue = function (sHeaderExpression, sFixedOpr, sCellExpression,
																							eExpressionType, sExpressionLanguageVersion) {
			var oConvert = { "source": "displayText", "target": "codeText" };
			var flags = this._buildFlagsObject(oConvert, "", "", true);
 
			var response = this._validateDecisionTableExpression(sHeaderExpression, sFixedOpr, sCellExpression, eExpressionType, flags, "RuleServiceValidation", sExpressionLanguageVersion);
			return response;
		  };



		ExpressionLanguage.prototype._validateDecisionTableExpression = function (sHeaderExpression, sFixedOpr, sCellExpression,eExpressionType, flags, sResponseCollectorStatus, sExpressionLanguageVersion){
			var ResponseCollector = this._initResponseCollector(sResponseCollectorStatus);
			var resCollectorInstance = ResponseCollector.getInstance();
			resCollectorInstance.setOpMessage(sResponseCollectorStatus, "failure");
			
			var result = RuleServices.lib.validateDecisionTableExpression(sHeaderExpression, sFixedOpr, sCellExpression, eExpressionType, this._vocabularyName,this._runtimeService, sExpressionLanguageVersion, flags);
			
			if (result.status == "Success") {
				resCollectorInstance.setOpMessage("RuleServiceValidation", "success");
			}
			resCollectorInstance.setOutput(result);
			var finalResponse = resCollectorInstance.build();

			return finalResponse;

		};
		ExpressionLanguage.prototype._buildDeferredResponse = function (arrValueHelpMapDeferred, flags, finalResponse, valueHelpInfo){
			var deferredLength = arrValueHelpMapDeferred.length;
			var numberOfResolved = 0;
			flags.valueHelp = {collectInfo: false, info: []};
			flags.valueHelpInfo = valueHelpInfo;
			finalResponse.valueHelpMapDeferred = new jQuery.Deferred();
			for (var i = 0 ; i < deferredLength ; i++){
				arrValueHelpMapDeferred[i].done(function(data, valueHelpId, keyField){
					numberOfResolved++;
					var receivedValueHelpInfo = {};
					receivedValueHelpInfo.id = valueHelpId;
					receivedValueHelpInfo.values = {};
					for (var j = 0 ; j < flags.valueHelpInfo.length ; j++){
						if (flags.valueHelpInfo[j].id == valueHelpId){
							for (var k = 0 ; k < flags.valueHelpInfo[j].values.length ; k++){
								receivedValueHelpInfo.values[flags.valueHelpInfo[j].values[k]] = null;
							}
							for (var l = 0 ; l < data.results.length ; l++){
								receivedValueHelpInfo.values[data.results[l][keyField]] = data.results[l][keyField];
							}
							break;
						}
					}
					flags.valueHelp.info.push(receivedValueHelpInfo);

					if (numberOfResolved == deferredLength){
						delete flags.valueHelpInfo;
						finalResponse.valueHelpMapDeferred.resolve(flags);
		
					}
				});
				arrValueHelpMapDeferred[i].fail(function(){
						finalResponse.valueHelpMapDeferred.reject(finalResponse);
					}
				);
			}
		};
			
		ExpressionLanguage.prototype._buildValueHelpMap = function (valueHelpInfo){

			var arrValueHelpMapDeferred = [];

			function _buildValueHelp(_oValueHelpInfo) {
				var _oModel = _oValueHelpInfo.model;
				var _sAnnotationPath = _oValueHelpInfo.metadata.propertyPath;
			
				var oMetadataAnalyzer = new sap.ui.comp.odata.MetadataAnalyser(_oModel);					
				var oValueListAnnotation = oMetadataAnalyzer.getValueListAnnotation(_sAnnotationPath);
				if (!oValueListAnnotation.primaryValueListAnnotation) {
					_oValueHelpInfo.deferred.reject("Failed to read value help annotation");
					return;
				}
				var	collectionPath = '/' + oValueListAnnotation.primaryValueListAnnotation.annotation.CollectionPath.String + '/';
				var keyField = oValueListAnnotation.primaryValueListAnnotation.keyField;
				var key = oValueListAnnotation.primaryValueListAnnotation.keys;
				var filters = [];
				
				if (key.length > 1){
					for (var j = 0 ; j <key.length ; j++ ){
						if (key[j] !== keyField){
							filters.push(new sap.ui.model.Filter(key[j], "EQ", null));
						}
					}
				}

				for (var i =0 ; i<_oValueHelpInfo.values.length ; i++){
					filters.push(new sap.ui.model.Filter(keyField, "EQ", _oValueHelpInfo.values[i]));
				}
				var valueHelpId = _oValueHelpInfo.id;
				_oModel.read(collectionPath, {
					filters: filters,
					success: function(data) {
						_oValueHelpInfo.deferred.resolve(data, valueHelpId, keyField);
					}.bind(this),
					error: function(data) {
						_oValueHelpInfo.deferred.reject("Failed to read value help values");
						window.console.log("Failed to read value help values");
					}
				});
			}
			
			
			for (var i = 0 ; i < valueHelpInfo.length ; i++){
				
				this.oValueHelpInfo = valueHelpInfo[i];
				this.oValueHelpInfo.deferred = new jQuery.Deferred();
				arrValueHelpMapDeferred.push(this.oValueHelpInfo.deferred);
				if (!this.oValueHelpInfo.model.getMetaModel().oModel) {
					this.oValueHelpInfo.model.attachMetadataLoaded(function() {
						_buildValueHelp(this);
					}.bind(this.oValueHelpInfo));
					this.oValueHelpInfo.model.attachMetadataFailed(function() {
						if (this.deferred){
							this.deferred.reject("Failed to load value help model metadata");
						}
					}.bind(this.oValueHelpInfo));
				} else {
					_buildValueHelp(this.oValueHelpInfo);
				}       		
			}
			return arrValueHelpMapDeferred;
		};
		
		ExpressionLanguage.prototype.getExpressionLanguageVersion = function () {
			return RuleServices.lib.getParserExprLangVersion();
        };

        return ExpressionLanguage;
    }, /* bExport= */true);