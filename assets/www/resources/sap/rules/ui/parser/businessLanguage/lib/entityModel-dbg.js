jQuery.sap.declare("sap.rules.ui.parser.businessLanguage.lib.entityModel");

jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.parseUtils");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.parseModel");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.utils");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.entityModelConstractor");

sap.rules.ui.parser.businessLanguage.lib.entityModel = sap.rules.ui.parser.businessLanguage.lib.entityModel|| {}; 
sap.rules.ui.parser.businessLanguage.lib.entityModel.lib = (function(){
    var constantsLib = sap.rules.ui.parser.businessLanguage.lib.constants.lib;
    var parseUtils =  sap.rules.ui.parser.businessLanguage.lib.parseUtils.lib;
    var parseUtilsLib = new parseUtils.parseUtilsLib();
    var parseModel =  sap.rules.ui.parser.businessLanguage.lib.parseModel.lib;
    var parseModelLib = new parseModel.parseModelLib();
    var utilsLib = new sap.rules.ui.parser.businessLanguage.lib.utils.lib();
    var entityModelConstractorLib =  sap.rules.ui.parser.businessLanguage.lib.entityModelConstractor.lib;

  

    function AbstractStatement(){
    	
    }

    AbstractStatement.prototype.getType = function () {
    try {
        parseUtilsLib.handleWarning(constantsLib.objectNamesEnum.abstractStatement + ": getType function is not implemented.");
    } catch (error) {
     //   throw error;
    }


};

    AbstractStatement.prototype.getString = function () {
    try {
        parseUtilsLib.handleWarning(constantsLib.objectNamesEnum.abstractStatement + ": getString function is not implemented.");
    } catch (error) {
      throw error;

    }

};


/**********************************************************************
                                         AbstractSelection
***********************************************************************    
abstractSelection :
{

}
**********************************************************************/
 function AbstractSelection() {
	 
 }

AbstractSelection.prototype.getType = function () {
    try {
        parseUtilsLib.handleWarning(constantsLib.objectNamesEnum.abstractSelection + ": getType function is not implemented.");
    } catch (error) {
      throw error;
    }

};

AbstractSelection.prototype.getString = function () {
    try {
        parseUtilsLib.handleWarning(constantsLib.objectNamesEnum.abstractSelection + ": getString function is not implemented.");
    } catch (error) {
      throw error;
    }
};


/**********************************************************************
                                         AbstractValue
***********************************************************************    
AbstractValue :
{

}
**********************************************************************/
 function AbstractValue () {
	 
 }

 AbstractValue.prototype.getType = function () {
    try {
        parseUtilsLib.handleWarning(constantsLib.objectNamesEnum.abstractValue + ": getType function is not implemented.");
    } catch (error) {
      throw error;
    }
};

AbstractValue.prototype.getString = function () {
    try {
        parseUtilsLib.handleWarning(constantsLib.objectNamesEnum.abstractValue + ": getString function is not implemented.");
    } catch (error) {
       throw error;
    }
};




/**********************************************************************
                                  OperatorOption 
*********************************************************************
OperatorOption  :
{
       OriginalValue: "<" / ">" / "is" / "=" / "is greater than", min, max, ...
       value : "<" / ">" / "=" /...
}
**********************************************************************/
 function OperatorOption(args) {
    try {
        /*
              var validateInstance = function (arguments_length) {
              //Verify we have exactly 2 argument
              parseUtilsLib.validateNumberOfArguments(arguments_length, 2, constantsLib.objectNamesEnum.selectionOperator);

              };
       */
        //validateInstance(arguments.length);
        utilsLib.addProperties(this, args, ["value", "originalValue"]);

        this.getType = function () {
            return "OperatorOption";
        };

        this.getString = function () {
            return (this.getType() + ": \n { \n Value: " + this.getValue() + ",\n OriginalValue: " + this.getOriginalValue() + "\n} \n");
        };
    } catch (error) {
       throw error;
    }
}


/**********************************************************************
                                AggregationOption 
*********************************************************************
AggregationOption  :
{
    AggregationOperator: 
    {
       OriginalValue: "",
       value : ""
    },
    GroupByArray : 
    [
        navigationPredicateDetails1 : {}, 
        navigationPredicateDetails2 : {}  
    ]
}
**********************************************************************/
    function AggregationOption(args) {
    try {

        var validateInstance = function () {

            parseUtilsLib.validateArgumentsType(args, constantsLib.objectNamesEnum.aggregationOption, [{
                    name: "aggregationOperator",
                    required: true,
                    type: [OperatorOption],
                    typeName: [constantsLib.objectNamesEnum.operatorOption]
                }
            ]);

        };
        
        validateInstance();
        utilsLib.addProperties(this, args, ["aggregationOperator", "groupByArray"], [null, null]);
  
        this.getType = function() {
            return constantsLib.objectNamesEnum.aggregationOption;
        };

        this.getString = function() {
            var groupByArray = (this.getGroupByArray() !== null ? parseUtilsLib.getStringArray(this.getGroupByArray()) : null);
            var aggregation = (this.getAggregationOperator() !== null ? this.getAggregationOperator().getString() : null);
            return (this.getType() + ": \n { \n AggregationOperator: " + aggregation + ",\n GroupByArray: " + groupByArray + "\n} \n");
        };
        this.isNoneValuelistAggOperator = function()
        { 
            var aggregationOp = this.getAggregationOperator().getValue();
            
            if(aggregationOp === "sum" || aggregationOp === "avg") 
            {
                return true;
            }
            return false;
        };
    } catch (error) {
       throw error;
    }
}

/**********************************************************************
CollectionOperatorOption 
*********************************************************************
CollectionOperatorOption  :
{

}
**********************************************************************/
 function CollectionOperatorOption(args) {
    try {

        utilsLib.addProperties(this, args, ["operator", "quantity", "orderBy"]);

        this.getType = function () {
            return constantsLib.objectNamesEnum.collectionOperatorOption;
        };

        this.getString = function () {
            var orderBy = (this.hasOwnProperty("getOrderBy") ? this.getOrderBy().getString() : null); 
            return (this.getType() + ": \n { \n Operator: " + this.getOperator().getString() + ",\n Quantity: " + this.getQuantity().getString() + ",\n OrderBy: " + orderBy +"\n} \n");
        };
    } catch (error) {
       throw error;
    }
}




/**********************************************************************
                                         ArithmeticOperator
*********************************************************************
arithmeticOperator :
{
value : "+" / "-" / "*" / "\" / "(" / ")"
}
**********************************************************************/
 function ArithmeticOperator(value) {
    try {
        var validateInstance = function (arguments_length) {
            //Verify we have exactly 1 argument
            parseUtilsLib.validateNumberOfArguments(arguments_length, 1, constantsLib.objectNamesEnum.arithmeticOperator);
        };

        validateInstance(arguments.length);
        utilsLib.addProperty(this, "Value", value);

        this.getType = function () {
            return constantsLib.objectNamesEnum.arithmeticOperator;
        };

        this.getString = function () {
            var val  = this.getValue();
            if (val === ')' || val === '(') {
                val = "'" + val + "'";
            }
            return (this.getType() + ": \n { \n Value: " + val + "\n } \n");
        };
    } catch (error) {
       throw error;
    }
}

/**********************************************************************
AdvanceFunction
***********************************************************************    
AdvanceFunction :
{
params :
[
value1:{},
value2:{},
value3:{},
...
]
funcName:""
}
**********************************************************************/
 function AdvanceFunction(funcNameInput) {
    try {
        this.params = [];

        this.push = function (value) {
            //Verify types
            if (value === null || value === undefined) {
                parseUtilsLib.handleWarning(constantsLib.objectNamesEnum.advanceFunction + ": No value to push",
                parseModelLib.getModelManger().mode);
                return;
            }

            this.params.push(value);
        };

        this.getType = function () {
            return constantsLib.objectNamesEnum.advanceFunction;
        };

        utilsLib.addProperty(this, "name", funcNameInput);

        this.getString = function () {
            return (this.getType() + ": \n { Name: " + this.getName() + ", \n Params: " + parseUtilsLib.getStringArray(this.params) + "} \n");
        };
    } catch (error) {
       throw error;
    }
}


/**********************************************************************
                                         SelectionClause
***********************************************************************    
selectionClause :
{
       statementArray :
       [
              abstractSelection1:{},
              arithmeticOperator1:{},
              abstractSelection 2:{},
              ...
       ]
}
**********************************************************************/
 function SelectionClause() {
    try {
        this.selectionsArray = [];
        this.push = function (value) {
            //Verify types
            if (value === null || value === undefined) {
                parseUtilsLib.handleWarning(constantsLib.objectNamesEnum.selectionClause + ": No value to push",
                			    			parseModelLib.getModelManger().mode);
                return;
            }

            if (Array.isArray(value)) {
                var i;
                for (i = 0; i < value.length; i++) {
                    this.validateAndAdd(value[i]);
                }
            } else {
                this.validateAndAdd(value);
            }

        };
        
        this.addCurrentProperty = function (isCurrent) {
        	if (isCurrent === undefined || isCurrent === null) {
        		isCurrent = false;
        	}
            utilsLib.addProperty(this, "isCurrent", isCurrent);
        };

        this.validateAndAdd = function (value) {
            //parseUtilsLib.validateArgumentType(value, "value", [entityModelLib.prototype.AbstractSelection, entityModelLib.prototype.ArithmeticOperator, entityModelLib.prototype.AdvanceFunction], [constantsLib.objectNamesEnum.abstractSelection, constantsLib.objectNamesEnum.arithmeticOperator, constantsLib.objectNamesEnum.advanceFunction], constantsLib.objectNamesEnum.selectionClause);

            if (value instanceof AbstractSelection) {
                this.validateType(value);
            }

            this.selectionsArray.push(value);
        };


        this.validateType = function (selection) {
            if (!selection.hasOwnProperty("getValueType")) {
                return;
            }
            
            // First selection - update valueType
            if (!this.hasOwnProperty("getValueType")) {
                utilsLib.addProperty(this, "ValueType", selection.getValueType());
                // Validate same type
            }


        };


        this.getType = function () {
            return constantsLib.objectNamesEnum.selectionClause;
        };

        this.getString = function () {
            return (this.getType() + ": \n { \n  isCurrent: " + this.getIsCurrent() + ", \n selectionsArray: " + parseUtilsLib.getStringArray(this.selectionsArray) + "} \n");
        };
        this.validateValueListForOp = function (op) {
            
            var modelManager = parseModelLib.getModelManger();
            var valueListAttr = modelManager.getValueListAttribute();
            if(!valueListAttr)
            {
              return;
            }
             
            //parseUtilsLib.parseResult
            if(!this.lastOpError)
            {
                modelManager.parseResult.cursorPosition = this.lastOpIndex;
                parseUtilsLib.handleWarning("error_in_expression_invalid_op_for_value_list_message",
                        [op, valueListAttr.navPath]);
                
                this.lastOpError = true;
            }
            
        };
        
        this.validateValueListAfterOp = function (sel, op) {
            
            this.lastOpIndex = sel.start;
            
            this.validateValueListForOp(op);
            
        };
    } catch (error) {
       throw error;
    }
}

/**********************************************************************
                                         SetOfValues
***********************************************************************    
SetOfValues :
{
       valuesArray :
       [
              value1:{},
              value2:{},
              value3:{},
              ...
       ]
}
**********************************************************************/
 function SetOfValues() {
    try {
        this.valuesArray = [];
        this.valueType = null;

        this.push = function (value) {
            //Verify types
            if (value === null || value === undefined) {
                parseUtilsLib.handleWarning(constantsLib.objectNamesEnum.setOfValues + ": No value to push", parseModelLib.getModelManger().mode );
                return;
            }

            this.valuesArray.push(value);
        };

        this.getType = function () {
            return constantsLib.objectNamesEnum.setOfValues;
        };

        this.setValueType = function (valueTypeInput) {
            jQuery.sap.log.debug("setValueType: add property of " + valueTypeInput);
            utilsLib.addProperty(this, "ValueType", valueTypeInput);
        };


        this.getString = function () {
            return (this.getType() + ": \n {" + parseUtilsLib.getStringArray(this.valuesArray) + "} \n");
        };
    } catch (error) {
      throw error;
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

        var validateInstance = function (arguments_length) {
            //Verify we have exactly 1 argument
            parseUtilsLib.validateNumberOfArguments(arguments_length, 1, constantsLib.objectNamesEnum.complexStatement);

            //Verify types
            //parseUtilsLib.validateArgumentType(model, "model", [Model], [constantsLib.objectNamesEnum.model], constantsLib.objectNamesEnum.complexStatement);

        };

        validateInstance(arguments.length);
        utilsLib.addProperty(this, "Model", model);

        this.getType = function () {
            return constantsLib.objectNamesEnum.complexStatement;
        };

        this.getValueType = function () {
            return this.getModel().getValueType();
        };

        this.getString = function () {
            return (this.getType() + ": \n { \n Model: " + this.getModel().getString() + "\n } \n");
        };
    } catch (error) {
       throw error;
    }
}

 ComplexStatement.prototype = new AbstractStatement();
 ComplexStatement.prototype.constructor = ComplexStatement;

/**********************************************************************
                                         SimpleStatement
***********************************************************************                  
simpleStatement: {
       leftSelectionClause: {},
       rightSelectionClause: {},
       operator: {}
}
**********************************************************************/
 function SimpleStatement(args) { //args = {leftSelectionClause : {}, selectionOperator : {}, rightSelectionClause: {}}
    try {
        this.valueType = null;

        var validateInstance = function () {

            parseUtilsLib.validateArgumentsType(args, constantsLib.objectNamesEnum.simpleStatement, [{
                    name: "leftSelectionClause",
                    required: true,
                    type: [SelectionClause],
                    typeName: [constantsLib.objectNamesEnum.selectionClause]
                }
                /*, {
                     name: "rightSelectionClause",
                     required: false,
                     type: [entityModelLib.prototype.SelectionClause, ComplexStatement,SetOfValues],
                     typeName: [constantsLib.objectNamesEnum.selectionClause, constantsLib.objectNamesEnum.complexStatement, constantsLib.objectNamesEnum.setOfValues]
              }*/
            ]);

        };

        this.validateAmbiguity = function (sel1, sel2, modelManager) {
            var error_msg = {};
            error_msg.key = "";
            error_msg.args = [];
            
            var selection1 = sel1.replace(/\s+/g, '');
            var selection2 = sel2.replace(/\s+/g, '');
            
            /*
            var isInsideWhere = parseModelLib.getModelManger().isInsideWhere;
            if (!isInsideWhere) {
                return;
            }
            */

            if (selection1 === selection2) {
                
                if (!this.getLeftSelectionClause().getIsCurrent() && (this.hasOwnProperty("getRightSelectionClause") && !this.getRightSelectionClause().getIsCurrent())) {
                    error_msg.key = "error_in_expression_missing_current_message";
                    parseUtilsLib.handleError(error_msg.key, error_msg.args, modelManager);
                }
    
                if (this.getLeftSelectionClause().getIsCurrent() && this.hasOwnProperty("getRightSelectionClause") && this.getRightSelectionClause().getIsCurrent()) {
                    error_msg.key = "error_in_expression_redundant_current_message";
                    parseUtilsLib.handleError(error_msg.key, error_msg.args, modelManager);
                }
            
            }

        };
        
        validateInstance();
        utilsLib.addProperties(this, args, ["leftSelectionClause", "selectionOperator", "rightSelectionClause"]);

        this.getType = function () {
            return constantsLib.objectNamesEnum.simpleStatement;
        };

        this.getValueType = function () {
            return this.valueType;
        };

        this.getString = function () {
            var operator = null;
            if (this.hasOwnProperty("getSelectionOperator")) {
                //operator = (this.getSelectionOperator().hasOwnProperty("getString") ? this.getSelectionOperator().getString() : this.getSelectionOperator());
                operator = this.getSelectionOperator().getString();
           }
            var rightSelection = (this.hasOwnProperty("getRightSelectionClause") ? this.getRightSelectionClause().getString() : null);

            return (this.getType() + ": \n { \n LeftSelectionClause: " + this.getLeftSelectionClause().getString() + ", \n SelectionOperator: " + operator + ", \n RightSelectionClause: " + rightSelection + "\n } \n");
        };
    } catch (error) {
      throw error;
    }
}

    SimpleStatement.prototype = new AbstractStatement();
    SimpleStatement.prototype.constructor = SimpleStatement;






/**********************************************************************
                                                Selection
***********************************************************************                  
selection :
{
abstractFilterClause : null
navigationPredicateDetails : {},
isCurrent: Boolean
},
**********************************************************************/
 function Selection(args, modelManager) { // args : {navigationPredicateDetails, abstractFilterClause, groupByArray}
    try {
            var error_msg = {};
            error_msg.args = [];
            var isCurrentInsideTerm = (args.hasOwnProperty("navigationPredicateDetails")) ? args.navigationPredicateDetails.getModifiers().hasOwnProperty("current") : false;
            var isAllInsideTerm = (args.hasOwnProperty("navigationPredicateDetails")) ? args.navigationPredicateDetails.getModifiers().hasOwnProperty("all") : false;
            var isCurrent = (args.hasOwnProperty("isCurrent") && args.isCurrent === true) || isCurrentInsideTerm;
            
            if (isCurrent && (!modelManager.isInsideWhere)) {
	                error_msg.key = "error_in_expression_current_not_in_where_clause_message";
	                parseUtilsLib.handleError(error_msg.key, error_msg.args, modelManager);
	        } 
            else if ((args.hasOwnProperty("isCurrent") && args.isCurrent === true) && isCurrentInsideTerm){
            	// prevent old current reserved word followed by a 'current' in term
            	error_msg.key = "error_in_expression_redundant_current_message";
                parseUtilsLib.handleError(error_msg.key, error_msg.args, modelManager);
            }
            else if (isCurrent && isAllInsideTerm ) {
                error_msg.key = "error_in_expression_invalid_current_with_all_term_message";
                parseUtilsLib.handleError(error_msg.key, error_msg.args, modelManager);
            }
            else if (modelManager.isAllContext() && isAllInsideTerm && 
            		// To allow "all players" as players has the modifier "all":
            		(args.navigationPredicateDetails.getNavigationFullPath() !== args.navigationPredicateDetails.getDataObject())) {
                error_msg.key = "error_in_expression_invalid_all_with_all_term_message";
                parseUtilsLib.handleError(error_msg.key, error_msg.args, modelManager);
            }
            else if (!modelManager.hasOwnProperty("isCurrent") && modelManager.isInsideWhere) {
                modelManager.isCurrent = isCurrent;
            } 
            else if (modelManager.isInsideWhere && modelManager.isCurrent !== isCurrent ) {
                error_msg.key = "error_in_expression_missing_current_in_arithmetic__message";
                parseUtilsLib.handleError(error_msg.key, error_msg.args, modelManager);
            } else if (modelManager.isInsideWhere && isCurrent){            
            	modelManager.isCurrent = true;
            }
            args.isCurrent = isCurrent; 


        utilsLib.addProperties(this, args, ["navigationPredicateDetails", "filterClause", "isCurrent"]);

        this.getType = function () {
            return constantsLib.objectNamesEnum.selection;
        };

        this.getString = function () {
            var filterClause = (this.hasOwnProperty("getFilterClause") && this.getFilterClause() !== null ? this.getFilterClause().getString() : null);
            var navigationPredicateDetails = (this.hasOwnProperty("getNavigationPredicateDetails") && this.getNavigationPredicateDetails() !== null && this.getNavigationPredicateDetails().hasOwnProperty("getString") ? this.getNavigationPredicateDetails().getString() : null);

            return (this.getType() + ": \n { \n " + navigationPredicateDetails + ", \n FilterClause: " + filterClause + ", \n isCurrent: " + this.getIsCurrent() + "} \n");
        };
    } catch (error) {
      throw error;
    }
}

/**********************************************************************
                                         SimpleSelection
***********************************************************************                  
18
simpleSelection :
{
       value : "18" 
       compoundValue: null
       originalValue: 18
       valueType  : integer
       isParameter   : false
       isCompound:  false
       
}

2 days ago
SimpleSelection:
{
    value: null,
    compoundValue: {
        value: 2
        constant: day
    }
    originalValue: '2 days ago',
    valueType: Date,
    isParameter: true,
    isCompound: true
}

**********************************************************************/
 function SimpleSelection(args) { //args = {value : someValue, valueType : integer}
    try {
        var validateInstance = function () {

            parseUtilsLib.validateArgumentExist(args, constantsLib.objectNamesEnum.compoundSelection, parseModelLib);

            //Verify types
            var exist = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.getByValue("string", args.valueType);

            //$.trace.error("SimpleSelection: selection value type - " + args.valueType);
            if (exist === null) {
                parseUtilsLib.handleWarning(constantsLib.objectNamesEnum.simpleSelection + ":  valueType input arg must be " + constantsLib.SIMPLE_SELECTION_VALUE_TYPE.getStringByField("string"));
                return;
            }
        };

        if (!args.hasOwnProperty("isParameter")) {
            args.isParameter = false;
        }
        
        if (!args.hasOwnProperty("index")) {
            args.index = null;
        }

        if (!args.hasOwnProperty("isCompound") || args.isCompound === false) {
            args.isCompound = false;
            args.compoundValue = null;
        } else  {
            args.value = null;
        }

        if (args.isParameter && !(args.value instanceof Object)&& args.value !== null) {
            args.value = args.value.replace(/^:/, "");
            //args.value  = args.value .substring(1);
        }
        
        if (!args.hasOwnProperty("originalValue")) {
            args.originalValue = args.value;
        }

        validateInstance();
        utilsLib.addProperties(this, args, ["value", "compoundValue", "originalValue", "valueType", "isParameter", "isCompound", "index"]);


        this.getType = function () {
            return constantsLib.objectNamesEnum.simpleSelection;
        };

        this.getString = function () {
            var selectionValue = ((this.getValue() instanceof Object) ? this.getValue().getString() : this.getValue());
            var compoundValueStr = null;
            if (this.getIsCompound() === true) {
                var compVal = this.getCompoundValue();
                compoundValueStr = "{ \n Value: " + compVal.value + ",\n Constant: " + compVal.constant  + "\n }";
            }
            return (this.getType() + ": \n { \n Value: " + selectionValue + ",  \n CompoundValue: "+  compoundValueStr + ", \n OriginalValue: " + this.getOriginalValue() + ",  \n ValueType: " + this.getValueType() + ", \n IsParameter: " + this.getIsParameter() + ", \n isCompound: " + this.getIsCompound() +  ", \n index: " + this.getIndex() + "\n } \n");
        };
    } catch (error) {
        throw error;
    }
}

SimpleSelection.prototype = new AbstractSelection();
SimpleSelection.prototype.constructor = SimpleSelection;

/**********************************************************************
                                         SimpleTimeNumberSelection
***********************************************************************                  
SimpleTimeNumberSelection :
{
       dateArray: [operator, date, operator, date....]
}
**********************************************************************/
/*
function SimpleTimeNumberSelection(args) { //args - for super simple selection, selOrOp - date or operator as input

       this.superclass_SimpleSelection(args);
       this.dateArray = [];

       this.push = function (selOrOp) {
              //Verify types
              if (selOrOp === null || selOrOp === undefined) {
                     parseUtilsLib.handleError(constantsLib.objectNamesEnum.selectionClause + ": No selOrOp to push");
                     return;
              }

              this.selectionsArray.push(selOrOp);
       };

       this.getType = function () {
              return "SimpleSelection";
       };

       this.getString = function () {
              var dateString = "";
              var i;
              for (i = 0; i < this.dateArray.length; i++) {
                     dateString += this.dateArray[i] + " ";
              }
              return (this.getType() + ": \n { \n Value: " + this.getValue() + ", \n ValueType: " + this.getValueType() + " \n } \n");
       }; //args = {value : someValue, valueType : integer}
}

SimpleTimeNumberSelection.prototype = new SimpleSelection({
       value: null,
       valueType: null
});
SimpleTimeNumberSelection.prototype.superclass_SimpleSelection = SimpleSelection;
*/
/**********************************************************************
                                         CompoundSelection
***********************************************************************    
CompoundSelection :
{
       aggregationType : "count",
       selection : null,
       valueType: Number/String/Timestamp/Boolean  
       compoundSelection : 
       {
              aggregationType : null,
              compoundSelection : null,
              selection : {},
       }
}
**********************************************************************/
 function CompoundSelection(args) { //args = {aggregationType : string, compoundSelection : {}, selection : {}}
    try {
        var validateInstance = function () {

            parseUtilsLib.validateArgumentsType(args, constantsLib.objectNamesEnum.compoundSelection, [{
                name: "compoundSelection",
                required: false,
                type: [CompoundSelection],
                typeName: [constantsLib.objectNamesEnum.compoundSelection]
            }, {
                name: "selection",
                required: false,
                type: [Selection],
                typeName: [constantsLib.objectNamesEnum.selection]
            }]);
        };

        validateInstance();

        if (!args.hasOwnProperty("valueType")) {
            args.valueType = null;
        }

        utilsLib.addProperties(this, args, ["aggregationOption", "compoundSelection", "selection", "valueType"]);

        this.getType = function () {
            return constantsLib.objectNamesEnum.compoundSelection;
        };

        this.getString = function () {
            /*
              var aggregationOption = null;
              if (this.hasOwnProperty("getAggregationOption")) {
                     aggregationOption =  (this.getAggregationOption().hasOwnProperty("getString") ? this.getAggregationOption().getString() : this.getAggregationOption());
              }
              */

            var aggregationOption = (this.hasOwnProperty("getAggregationOption") ? this.getAggregationOption().getString() : null);

            var valueType = (this.hasOwnProperty("getValueType") ? this.getValueType() : null);
            var compoundSelectionString = (this.hasOwnProperty("getCompoundSelection") && this.getCompoundSelection() ? this.getCompoundSelection().getString() : null);
            var selection = (this.hasOwnProperty("getSelection") ? this.getSelection().getString() : null);

            return (this.getType() + ": \n { \n AggregationOption: " + aggregationOption + ", \n ValueType: " + valueType + ", \n CompoundSelection: " + compoundSelectionString + ", \n Selection: " + selection + "\n } \n");
        };
    } catch (error) {
        throw error;
    }
}

CompoundSelection.prototype = new AbstractSelection();
CompoundSelection.prototype.constructor = CompoundSelection;


/**********************************************************************
                                         StringFilter
***********************************************************************                  
stringFilter :
{

}
**********************************************************************/
 function StringFilter(args) { //value, operator
    try {
        var validateInstance = function (arguments_length) {

            parseUtilsLib.validateNumberOfArguments(arguments_length, 2, constantsLib.objectNamesEnum.stringFilter);

        };

        validateInstance(arguments.length);
        utilsLib.addProperties(this, args, ["value", "operator"]);

        this.getType = function () {
            return constantsLib.SIMPLE_SELECTION_VALUE_TYPE.STRING.string;
        };

        this.getString = function () {
            return (this.getType() + ": \n { \n NavigationDetails: " + this.getNavigationDetails.getString() + ", \n Operator: " + this.getOperator() + ", \n Value: " + this.getValue() + "\n } \n");
        };
    } catch (error) {
      throw error;
    }
}

StringFilter.prototype = new entityModelConstractorLib.AbstractFilterClause();
StringFilter.prototype.constructor = StringFilter;

/**********************************************************************
                                         DateFilter
***********************************************************************                  
dateFilter :
{

}
**********************************************************************/
 function DateFilter(args) { // args : {timeInterval, navigationDetails}
    try {
        var validateInstance = function () {

            parseUtilsLib.validateArgumentsType(args, constantsLib.objectNamesEnum.dateFilter, [{
                name: "navigationDetails",
                required: false,
                type: [entityModelConstractorLib.NavigationPredicateDetails],
                typeName: [constantsLib.objectNamesEnum.navigationPredicateDetails]
            }]);

        };

        validateInstance();
        utilsLib.addProperties(this, args, ["timeInterval", "navigationDetails"]);

        this.getType = function () {
            return constantsLib.SIMPLE_SELECTION_VALUE_TYPE.DATE.string; //"Timestamp";
        };

        this.getString = function () {
            var timeInterval = (this.hasOwnProperty("getTimeInterval") ? this.getTimeInterval().getString() : null);
            var navigationDetails = (this.hasOwnProperty("getNavigationDetails") ? this.getNavigationDetails().getString() : null);

            return (this.getType() + ": \n { \n TimeInterval: " + timeInterval + ", \n NavigationDetails: " + navigationDetails + "\n } \n");
        };
    } catch (error) {
      throw error;
    }
}

DateFilter.prototype = new entityModelConstractorLib.AbstractFilterClause();
DateFilter.prototype.constructor = DateFilter;


/**********************************************************************
                                  FilterSelectionValue
***********************************************************************                  
FilterSelectionValue :
{

}
**********************************************************************/
 function FilterSelectionValue(value) {
    try {
        var validateInstance = function (arguments_length) {

            parseUtilsLib.validateNumberOfArguments(arguments_length, 1, constantsLib.objectNamesEnum.filterSelectionValue);

            ////parseUtilsLib.validateArgumentType(value, "filterByValue", [CompoundSelection, Selection], [constantsLib.objectNamesEnum.compoundSelection, constantsLib.objectNamesEnum.selection], constantsLib.objectNamesEnum.filterSelectionValue);

        };
        validateInstance(arguments.length);

        utilsLib.addProperty(this, "Value", value);

        this.getType = function () {
            return "FilterSelectionValue";
        };

        this.getString = function () {
            var compoundSelection = (this.hasOwnProperty("getValue") ? this.getValue().getString() : null);

            return (this.getType() + ": \n { \n Value: " + compoundSelection + "\n } \n");
        };
    } catch (error) {
       throw error;
    }
}

FilterSelectionValue.prototype = new AbstractValue();
FilterSelectionValue.prototype.constructor = FilterSelectionValue;



/**********************************************************************
DateValue
***********************************************************************                  
DateValue :
{

}
**********************************************************************/
 function DateValue() {
    try {

        this.isParameter = false;
        this.prefix = null;
        this.type = null;
        this.date = {
            start: {
                str: null,
                day: null,
                month: null,
                year: null,
                isParameter: false,
                parameterName: null
            },
            end: {
                str: null,
                day: null,
                month: null,
                year: null,
                isParameter: false,
                parameterName: null
            }
        };
        this.interval = {};
        this.interval.number = null;
        this.interval.constant = null;
        this.interval.milliseconds = null;

        this.resolveType = function (dateString) {
            jQuery.sap.log.debug("resolveType func,  dateString - " + dateString);

            if (this.prefix === null) {
                this.type = "simpleDate";
                this.date.start.str = dateString;
            } else if (this.prefix === "between") {
                this.prefix = null;
                this.type = "IntervalDate";
                this.date.end.str = dateString;
            } else {
                this.date.start.str = dateString;
            } // it must be "precedenceDate"
            jQuery.sap.log.debug("Date string - " + dateString + " and type - " + this.type);

        };
        this.getType = function () {
            return "DateValue";
        };

        this.subtractDateString = function () {
            jQuery.sap.log.debug("subtractDateString func,  start - " + this.date.start.str + ", and end - " + this.date.end.str);

            if (this.date.start.str !== null) {
                var start_const_exist = constantsLib.DATE_CONST.getByValue("string", this.date.start.str);
                if (start_const_exist === null) {
                    this.splitDate(this.date.start);
                }
            }
            if (this.date.end.str !== null) {
                var end_const_exist = constantsLib.DATE_CONST.getByValue("string", this.date.end.str);
                if (end_const_exist === null) {
                    this.splitDate(this.date.end);
                }
            }
        };

        this.splitDate = function (completeDate) {
            var str = completeDate.str.replace(/[']+/g, '');
            var s = str.split(/[\.\-\/]/);
            completeDate.day = s[1];
            completeDate.month = s[0];
            completeDate.year = s[2];

        };

        this.calculateMilliseconds = function () {
            if (this.isParameter === false && this.interval.number !== null && this.interval.constant !== null && this.interval.constant instanceof Object) {
                this.interval.milliseconds = this.interval.number * this.interval.constant.multiply;
            }
        };

        this.getString = function () {
            var intervalConststr = this.interval.constant;
            if (this.interval.constant !== null && this.interval.constant instanceof Object) {
                jQuery.sap.log.debug("**** DateValue, getString - " + this.interval.constant.toString());
                intervalConststr = this.interval.constant.string;
            }

            return (this.getType() + ": \n { \n  Type: " + this.type + "\n Prefix: " + this.prefix + "\n isParameter: " + this.isParameter + "\n  Date: \n { start:  { \n day: " + this.date.start.day + "\n month: " + this.date.start.month + "\n year: " + this.date.start.year + "\n startDateString: " + this.date.start.str + "\n isParameter: " + this.date.start.isParameter + "\n parameterName: " + this.date.start.parameterName + "} \n end: {  \n day: " + this.date.end.day + "\n month: " + this.date.end.month + "\n year: " + this.date.end.year + "\n endDateString: " + this.date.end.str + "\n isParameter: " + this.date.end.isParameter + "\n parameterName: " + this.date.end.parameterName + "\n }}\n Interval: \n { number: " + this.interval.number + "\n constant: " + intervalConststr + "\n milliseconds: " + this.interval.milliseconds + "\n \n}\n} \n");
        };
    } catch (error) {
       throw error;
    }
}

DateValue.prototype = new AbstractValue();
DateValue.prototype.constructor = DateValue;

/**********************************************************************
                                         StringValue
***********************************************************************                  
StringValue :
{

}
**********************************************************************/
 function StringValue(value) {
    try {
        var validateInstance = function (arguments_length) {

            parseUtilsLib.validateNumberOfArguments(arguments_length, 1, constantsLib.objectNamesEnum.stringValue);

        };
        validateInstance(arguments.length);

        utilsLib.addProperty(this, "Value", value);
        validateInstance();

        this.getType = function () {
            return "StringValue";
        };

        this.getString = function () {
            return (this.getType() + ": \n { \n Value: " + this.getValue() + "\n } \n");
        };
    } catch (error) {
       throw error;
    }
}

StringValue.prototype = new AbstractValue();
StringValue.prototype.constructor = StringValue;

/**********************************************************************
                                         BooleanValue
***********************************************************************                  
BooleanValue :
{

}
**********************************************************************/
 function BooleanValue(value) {
    try {
        var validateInstance = function (arguments_length) {

            parseUtilsLib.validateNumberOfArguments(arguments_length, 1, constantsLib.objectNamesEnum.booleanValue);

        };
        validateInstance(arguments.length);

        utilsLib.addProperty(this, "Value", value);
        validateInstance();

        this.getType = function () {
            return "BooleanValue";
        };

        this.getString = function () {
            return (this.getType() + ": \n { \n Value: " + this.getValue() + "\n } \n");
        };
    } catch (error) {
      throw error;
    }
}

BooleanValue.prototype = new AbstractValue();
BooleanValue.prototype.constructor = BooleanValue;

/**********************************************************************
                                         TimeValue
***********************************************************************                  
TimeValue :
{

}
**********************************************************************/
 function TimeValue(value) {
    try {
        var validateInstance = function (arguments_length) {

            parseUtilsLib.validateNumberOfArguments(arguments_length, 1, constantsLib.objectNamesEnum.timeValue);

        };
        validateInstance(arguments.length);

        utilsLib.addProperty(this, "Value", value);
        validateInstance();

        this.getType = function () {
            return "TimeValue";
        };

        this.getString = function () {
            var simpleSelection = (this.hasOwnProperty("getValue") ? this.getValue() : null);

            return (this.getType() + ": \n { \n Value: " + simpleSelection + "\n } \n");
        };
    } catch (error) {
   throw error;
    }
}

TimeValue.prototype = new AbstractValue();
TimeValue.prototype.constructor = TimeValue;

/*
function AggregationFunction() {
       try{
       this.aggregationOption = null;
       this.compoundSelection = null;
       this.valueType = null;

    this.resolveDataType = function ( ){  
               if(this.aggregationOption === "sum" || this.aggregationOption === "average" ||this.aggregationOption === "avg" || this.aggregationOption === "count" ||
              this.aggregationOption === "countd"   ){
                     
                      this.valueType = this.compoundSelection.getValueType() === constantsLib.SIMPLE_SELECTION_VALUE_TYPE.TIMESPAN.string ? constantsLib.SIMPLE_SELECTION_VALUE_TYPE.TIMESPAN.string : constantsLib.SIMPLE_SELECTION_VALUE_TYPE.INTEGER.string;
                     if(this.aggregationOption === "avg"){
                           this.aggregationOption = "average";
                     }

              } 
              else if (this.aggregationOption === "last" || this.aggregationOption === "first" ){
                     this.valueType = constantsLib.SIMPLE_SELECTION_VALUE_TYPE.DATE.string;
              } 
              else if(this.aggregationOption === "min" || this.aggregationOption === "max") // can be number or date
              { 
                     this.valueType = this.compoundSelection.getValueType();
              //     $.trace.error("this.compoundSelection.valueType " + this.compoundSelection.valueType );
                     
              } 
       };
       
       this.validate = function() {
              
         // for min max only number and date are valid
                if( (this.aggregationOption === "min" || this.aggregationOption === "max") && ( this.compoundSelection.getValueType() !== constantsLib.SIMPLE_SELECTION_VALUE_TYPE.DATE.string && this.compoundSelection.getValueType() !== constantsLib.SIMPLE_SELECTION_VALUE_TYPE.INTEGER.string &&  this.compoundSelection.getValueType() !== constantsLib.SIMPLE_SELECTION_VALUE_TYPE.TIMESPAN.string) ){

                             // error
                           parseUtilsLib.handleError( this.aggregationOption + "  is valid just for date and number ");
                       
                      }            
              
       // sum,avg valid just for number  
                if((this.aggregationOption === "sum" || this.aggregationOption === "average" || this.aggregationOption === "avg") && (this.compoundSelection.getValueType() !== constantsLib.SIMPLE_SELECTION_VALUE_TYPE.INTEGER.string && this.compoundSelection.getValueType() !== constantsLib.SIMPLE_SELECTION_VALUE_TYPE.TIMESPAN.string))
                {
                       // error
                           parseUtilsLib.handleError( this.aggregationOption + " is not valid on " + this.compoundSelection.getValueType() + " attribute");
                }  
                
    // last / first valid only for date

                if ((this.aggregationOption === "last" || this.aggregationOption === "first") && this.compoundSelection.getValueType() !== constantsLib.SIMPLE_SELECTION_VALUE_TYPE.DATE.string) {
                       // error
                     $.trace.error("AggregationFunction failure - " + this.compoundSelection.getValueType() + " !== " + constantsLib.SIMPLE_SELECTION_VALUE_TYPE.DATE.string);
                       parseUtilsLib.handleError(this.aggregationOption + " is valid only for date");
                       }  
         //only count() can support associations/root object - other must have attribute 
         if( (this.aggregationOption !== "count" && this.aggregationOption !== "countd") && this.compoundSelection.getValueType() === null ){

                // error
              parseUtilsLib.handleError( this.aggregationOption + " must be operation on attribute");
         
         }
         
         //   If (nav predicate has attribute and agg != all) -> warning
         if( this.compoundSelection.getValueType()!== null ){
                return;
              // warning
              // handleError( this.aggregationOption + " is being executed on one instance");

         }
       
       };
       
       
       this.getType = function () {
              return "AggregationFunction";
       };

       this.getString = function () {
              return (this.getType() + ": \n { \n  aggregationOption: " + this.aggregationOption + "\n type: " 
              + this.type + "\n "  
              + this.compoundSelection.getString() + "\n ");
       };
       } catch (error) {
              throw error;
       }
}

AggregationFunction.prototype = new AbstractValue();
AggregationFunction.prototype.constructor = AggregationFunction;
*/
/***********************************************************************
***********************************************************************
************************************************************************
***********************************************************************/
return {AbstractStatement:AbstractStatement, 
        AbstractSelection: AbstractSelection, 
        AbstractValue: AbstractValue,
        SimpleStatement: SimpleStatement,
        SelectionClause: SelectionClause,
        OperatorOption: OperatorOption,
        CollectionOperatorOption: CollectionOperatorOption,
        Selection: Selection,
        CompoundSelection: CompoundSelection,
        SetOfValues : SetOfValues,
        SimpleSelection: SimpleSelection,
        AdvanceFunction: AdvanceFunction,
        AggregationOption: AggregationOption,
        ArithmeticOperator : ArithmeticOperator
        };
}());
