jQuery.sap.declare("sap.rules.ui.parser.businessLanguage.lib.entityModelConstractor");

jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.parseUtils");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.utils");



sap.rules.ui.parser.businessLanguage.lib.entityModelConstractor = sap.rules.ui.parser.businessLanguage.lib.entityModelConstractor|| {}; 
sap.rules.ui.parser.businessLanguage.lib.entityModelConstractor.lib = (function() {
	var constantsLib = sap.rules.ui.parser.businessLanguage.lib.constants.lib;
	var parseUtilsLib = sap.rules.ui.parser.businessLanguage.lib.parseUtils.lib;
	parseUtilsLib = new parseUtilsLib.parseUtilsLib();
	var utilsLib = new sap.rules.ui.parser.businessLanguage.lib.utils.lib();

	function NavigationPredicateDetails(args) { // args : {navigationPredicate, attribute, rootObject, associationsArray}
		try {
			(function() {

				parseUtilsLib.validateArgumentsType(args, constantsLib.objectNamesEnum.navigationPredicateDetails, [{
					name: "navigationPredicate",
					required: true
				}]);

			}());
			utilsLib.addProperties(this, args, ["navigationPredicate", "navigationFullPath", "attribute", "attributeType", "rootObject", "associationsArray", "attributeMappingType", "attributeValueList", "isVocaRule", "isParameter", "isCollection", "isAlias", "isDataObject", "dataObject", "modifiers"], [null, null, null, null, null, null, null, null, false, false, false, false, null, null, null]);

			/*
           if (this.hasOwnProperty("getAttribute")) {
                  $.trace.error("NavigationPredicateDetails:  attributeType: " + this.getAttribute());
           } else {
                  $.trace.error("NavigationPredicateDetails: add getAttribute");
                  utilsLib.addProperty(this, "attributeType", null);
           }
           
           if (this.hasOwnProperty("getAttributeMappingType")) {
                  $.trace.error("NavigationPredicateDetails:  attributeType: " + this.getAttributeMappingType());
           } else {
                  $.trace.error("NavigationPredicateDetails: add getAttributeMappingType");
                  utilsLib.addProperty(this, "attributeMappingType", null);
           }
           */

			this.getType = function() {
				return constantsLib.objectNamesEnum.navigationPredicateDetails;
			};

			this.getString = function() {
				var associationsArray = parseUtilsLib.getStringArray(this.getAssociationsArray());
				var attribute = this.getAttribute();
				var attributeType = this.getAttributeType();
				var attributeMappingType = this.getAttributeMappingType();
				var attributeValueList = this.getAttributeValueList();
				var isVocaRule = this.getIsVocaRule();
				var isParameter = this.getIsParameter();
				var isCollection = this.getIsCollection();
				var isAlias = this.getIsAlias();
				var isDataObject = this.getIsDataObject();
				var dataObject = this.getDataObject();
				var modifiers = JSON.stringify(this.getModifiers());

				return (this.getType() + ": \n { \n NavigationPredicate: " + this.getNavigationPredicate() + ", \n NavigationFullPath: " + this.getNavigationFullPath() + ", \n Attribute: " + attribute + ", \n AttributeType: " + attributeType + ", \nAttributeMappingType:" + attributeMappingType + ", \nattributeValueList:" + attributeValueList + ", \nRootObject: " + this.getRootObject() + ", \n AssociationsArray: " + associationsArray + " , \n isParameter: " + isParameter + " , \n isCollection: " + isCollection + " , \n isAlias: " + isAlias +  ", \nisVocaRule: " + isVocaRule + " , \n isDataObject: " + isDataObject + " , \n dataObject: " + dataObject + " , \n modifiers: " + modifiers + "} \n");
			};

		} catch (error) {
			jQuery.sap.log.error("entityModel failure - \n" + error);
		}
	}

	/**********************************************************************
	AbstractStatement
	***********************************************************************    
	abstractStatement :
	{

	}
	**********************************************************************/


	function AbstractStatement() {}

	AbstractStatement.prototype.getType = function() {
		try {
			parseUtilsLib.handleWarning(constantsLib.objectNamesEnum.abstractStatement + ": getType function is not implemented.");
		} catch (error) {
			jQuery.sap.log.error("entityModel failure - \n" + error);
		}


	};

	AbstractStatement.prototype.getString = function() {
		try {
			parseUtilsLib.handleWarning(constantsLib.objectNamesEnum.abstractStatement + ": getString function is not implemented.");
		} catch (error) {
			jQuery.sap.log.error("entityModel failure - \n" + error);

		}

	};

	/**********************************************************************
	AbstractValue
	***********************************************************************    
	AbstractValue :
	{

	}
	**********************************************************************/
	function AbstractValue() {

	}

	AbstractValue.prototype.getType = function() {
		try {
			parseUtilsLib.handleWarning(constantsLib.objectNamesEnum.abstractValue + ": getType function is not implemented.");
		} catch (error) {
			jQuery.sap.log.error("entityModel failure - \n" + error);
		}
	};

	AbstractValue.prototype.getString = function() {
		try {
			parseUtilsLib.handleWarning(constantsLib.objectNamesEnum.abstractValue + ": getString function is not implemented.");
		} catch (error) {
			jQuery.sap.log.error("entityModel failure - \n" + error);
		}
	};
	/**********************************************************************
	FilterSelectionValue
	***********************************************************************                  
	FilterSelectionValue :
	{
    
	}
	**********************************************************************/
	function FilterSelectionValue(value) {
		try {
			var arguments_length = arguments.length;

			parseUtilsLib.validateNumberOfArguments(arguments_length, 1, constantsLib.objectNamesEnum.filterSelectionValue);

			//parseUtilsLib.validateArgumentType(value, "filterByValue", [CompoundSelection, Selection], [constantsLib.objectNamesEnum.compoundSelection, constantsLib.objectNamesEnum.selection], constantsLib.objectNamesEnum.filterSelectionValue);

			utilsLib.addProperty(this, "Value", value);

			this.getType = function() {
				return "FilterSelectionValue";
			};

			this.getString = function() {
				var compoundSelection = (this.hasOwnProperty("getValue") ? this.getValue().getString() : null);

				return (this.getType() + ": \n { \n Value: " + compoundSelection + "\n } \n");
			};
		} catch (error) {
			jQuery.sap.log.error("entityModel failure - \n" + error);
		}
	}

	FilterSelectionValue.prototype = new AbstractValue();
	FilterSelectionValue.prototype.constructor = FilterSelectionValue;
	/**********************************************************************
	SimpleStatementFilter
	***********************************************************************                  
	SimpleStatementFilter :
	{

	}
	**********************************************************************/
	function SimpleStatementFilter(args) { // args : {selection, comparisonOption, filterByValue}
			try {
				parseUtilsLib.validateArgumentsType(args, constantsLib.objectNamesEnum.simpleStatementFilter, [{
						name: "selection",
						required: false,
						type: [FilterSelectionValue],
						typeName: [constantsLib.objectNamesEnum.filterSelectionValue]
				}]);
						/*, {
                         name: "filterByValue",
                         required: false,
                         type: [AbstractValue],
                         typeName: [constantsLib.objectNamesEnum.abstractValue]
                  }*/
				
				utilsLib.addProperties(this, args, ["selection", "comparisonOption", "filterByValue"]);

				this.getType = function() {
					return "SimpleStatementFilter";
				};

				this.getString = function() {
					var selection = (this.hasOwnProperty("getSelection") ? this.getSelection().getString() : null);
					var comparisonOption = null;
					if (this.hasOwnProperty("getComparisonOption")) {
						//comparisonOption = (this.getComparisonOption().hasOwnProperty("getString") ? this.getComparisonOption().getString() : this.getComparisonOption());
						comparisonOption = this.getComparisonOption().getString();
					}
					var filterByValue = (this.hasOwnProperty("getFilterByValue") ? this.getFilterByValue().getString() : null);

					return (this.getType() + ": \n { \n Selection: " + selection + ", \n CompOption: " + comparisonOption + ", \n FilterByValue: " + filterByValue + "\n } \n");
				};
			} catch (error) {
				jQuery.sap.log.error("entityModel failure - \n" + error);
			}
		}
	/**********************************************************************
    StatementOperator
	*********************************************************************
	statementOprator :
	{
		value : "or" / "and"
	}
	 **********************************************************************/
	function StatementOperator(value) {
			try { 
					//Verify we have exactly 1 argument
					parseUtilsLib.validateNumberOfArguments(arguments.length, 1, constantsLib.objectNamesEnum.StatementOperator);

					//already validated in antlr
					/*
					if ( value !== STATEMENT_OPERATOR.OR.string || value !== STATEMENT_OPERATOR.AND.string) {
					parseUtilsLib.handleError(constantsLib.objectNamesEnum.statementOprator + ": Value input arg must be: " + STATEMENT_OPERATOR.OR.string + ", " + STATEMENT_OPERATOR.AND.string);
					return;
					}      
					*/
				utilsLib.addProperty(this, "Value", value);

				this.getType = function() {
					return constantsLib.objectNamesEnum.StatementOperator;
				};

				this.getString = function() {
					return (this.getType() + ": \n { \n Value: " + this.getValue() + "\n } \n");
				};
			} catch (error) {
				jQuery.sap.log.error("entityModel failure - \n" + error);
			}
		}
	/**********************************************************************
    BooleanEqualityOperator
	*********************************************************************
	BooleanEqualityOperator :
	{
		value : "=" / "is equal to"
	}
	 **********************************************************************/
	function BooleanEqualityOperator(value, originalValue) {
			try { 
					//Verify we have exactly 1 argument
					parseUtilsLib.validateNumberOfArguments(arguments.length, 2, constantsLib.objectNamesEnum.BooleanEqualityOperator);

					//already validated in antlr
					/*
					if ( value !== STATEMENT_OPERATOR.OR.string || value !== STATEMENT_OPERATOR.AND.string) {
					parseUtilsLib.handleError(constantsLib.objectNamesEnum.statementOprator + ": Value input arg must be: " + STATEMENT_OPERATOR.OR.string + ", " + STATEMENT_OPERATOR.AND.string);
					return;
					}      
					*/
				utilsLib.addProperty(this, "Value", value);
				utilsLib.addProperty(this, "originalValue", originalValue);

				this.getType = function() {
					return constantsLib.objectNamesEnum.BooleanEqualityOperator;
				};

				this.getString = function() {
		            return (this.getType() + ": \n { \n Value: " + this.getValue() + ",\n OriginalValue: " + this.getOriginalValue() + "\n} \n");
				};
			} catch (error) {
				jQuery.sap.log.error("entityModel failure - \n" + error);
			}
		}
		/**********************************************************************
		Model
		***********************************************************************    
		model :
		{
		statementsArray :
		[
		abstractStatement1   : {},
		statementOprator1    : {},
		abstractStatement2   : {},
		...
		]
		}
		**********************************************************************/
	function Model() {
			try {
				this.statementsArray = [];
				this.valueType = null;

				this.push = function(statement) {
					//Verify types
					if (statement === null || statement === undefined) {
						return;
					}

					if (statement.hasOwnProperty("getValueType")) {
						this.valueType = statement.getValueType();
					}

					/*parseUtilsLib.validateArgumentType(statement, "Statement", [AbstractStatement, StatementOperator], [constantsLib.objectNamesEnum.abstractStatement,
							constantsLib.objectNamesEnum.statementOprator
						],
						constantsLib.objectNamesEnum.model);*/
					this.statementsArray.push(statement);
				};

				this.getType = function() {
					return constantsLib.objectNamesEnum.model;
				};

				this.getValueType = function() {
					return this.valueType;
				};

				this.getString = function() {
					return (this.getType() + ": \n {" + parseUtilsLib.getStringArray(this.statementsArray) + "} \n");
				};
			} catch (error) {
				jQuery.sap.log.error("entityModel failure - \n" + error);
			}
		}
		/**********************************************************************
		ComplexStatement
		***********************************************************************    
		ComplexStatement :
		{
		model : 
		[
		...
		]
		}
		**********************************************************************/
	function ComplexStatement(model) {
		try {
			this.valueType = null;
			this.category = null;

			//Verify we have exactly 1 argument
			parseUtilsLib.validateNumberOfArguments(arguments.length, 1, constantsLib.objectNamesEnum.complexStatement);

			//Verify types
			//parseUtilsLib.validateArgumentType(model, "model", [Model], [constantsLib.objectNamesEnum.model], constantsLib.objectNamesEnum.complexStatement);

			utilsLib.addProperty(this, "Model", model);

			this.getType = function() {
				return constantsLib.objectNamesEnum.complexStatement;
			};

			this.getValueType = function() {
				return this.getModel().getValueType();
			};
		
	       this.setCategory = function (category) {
	            this.category = category;
	        };
	        
	        this.getCategory = function () {
	            return this.category ;
	        };       
	        
			
			this.getString = function() {
				return (this.getType() + ": \n { \n  category : " + this.getCategory() + ",\n Model: " + this.getModel().getString() + "\n } \n");
			};		
			
					
		} catch (error) {
			jQuery.sap.log.error("entityModel failure - \n" + error);
		}
	}

	ComplexStatement.prototype = new AbstractStatement();
	ComplexStatement.prototype.constructor = ComplexStatement;




	/**********************************************************************
	AbstractFilterClause
	***********************************************************************    
	abstractFilterClause :
	{

	}
	**********************************************************************/
	function AbstractFilterClause() {
		
	}

	AbstractFilterClause.prototype.getType = function() {
		try {
			parseUtilsLib.handleWarning(constantsLib.objectNamesEnum.abstractFilterClause + ": getType function is not implemented.");
		} catch (error) {
			jQuery.sap.log.error("entityModel failure - \n" + error);
		}
	};

	/* Date filter not always contain navigation.

	AbstractFilterClause.prototype.getNavigationDetails = function () {
	parseUtilsLib.handleError("ERROR:\n getNavigationDetails function is not implemented.");
	}
	*/

	AbstractFilterClause.prototype.getString = function() {
		try {
			parseUtilsLib.handleWarning(constantsLib.objectNamesEnum.abstractFilterClause + ": getString function is not implemented.");
		} catch (error) {
			jQuery.sap.log.error("entityModel failure - \n" + error);
		}
	};

	/**********************************************************************
	ComplexStatementFilter
	***********************************************************************                  
	statementFilter :
	{

	}
	**********************************************************************/
	function ComplexStatementFilter(complexStatement) {
		try {
			(function() {

				//parseUtilsLib.validateArgumentType(complexStatement,
				//	"complexStatement", [ComplexStatement], [constantsLib.objectNamesEnum.complexStatement],
				//	constantsLib.objectNamesEnum.complexStatementFilter);

			}());

			utilsLib.addProperty(this, "ComplexStatement", complexStatement);

			this.getType = function() {
				return "ComplexStatementFilter";
			};

			this.getString = function() {
				return (this.getType() + ": \n { \n Statement: " + this.getComplexStatement().getString() + "\n } \n");
			};
		} catch (error) {
			jQuery.sap.log.error("entityModel failure - \n" + error);
		}
	}

	ComplexStatementFilter.prototype = new AbstractFilterClause();
	ComplexStatementFilter.prototype.constructor = ComplexStatementFilter;
	
	return {
			StatementOperator:StatementOperator,
			BooleanEqualityOperator:BooleanEqualityOperator,
			AbstractFilterClause:AbstractFilterClause,
			ComplexStatement:ComplexStatement,
			NavigationPredicateDetails: NavigationPredicateDetails,
			SimpleStatementFilter: SimpleStatementFilter,
			ComplexStatementFilter : ComplexStatementFilter,
			Model : Model
	};
}());
