this["RulesAPI_Ast"] =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	
	var astNodes = __webpack_require__(1);
	var astOperations = __webpack_require__(2);

	/**
	 * defines the public API for hrf parser

	 */
	var API = {};
	// semantic version
	//API.VERSION = "0.12.0";
	// runtime API
	API.astNodes = astNodes;
	API.astOperations = astOperations;

	module.exports = API;


/***/ },
/* 1 */
/***/ function(module, exports) {

	(function() {

	    /**
	     * Base Hrf  ASTNode
	     */

	    var BusinessDataType = {
	        Number : "Number",
	        String : "String",
	        TimeSpan : "TimeSpan",
	        Timestamp : "Timestamp",
	        Boolean : "Boolean",
	        Date : "Date",
	        Time : "Time",
	        NA : "NA",
	        unknown : "unknown"
	    };

	    function deserialize(astNodesConstructors, str) {
	        var ast = JSON.parse(str);
	        var nodeClass = ast.kind + 'Node';
	        var node =  new astNodesConstructors[nodeClass]();
	        node.deserialize(ast, astNodesConstructors);
	        return node;
	    }

	    function ASTNode(kind) {
	        this.kind = kind;
	        this.children = [];
	        this.syntaxBox = [];
	        this.parent = null;
	    }

	    ASTNode.prototype.getKind = function getKind() {
	        return this.kind;
	    };

	    ASTNode.prototype.setParent = function setParent(parentNode) {
	        this.parent = parentNode;
	    };

	    ASTNode.prototype.getStartOffset = function getStartOffset() {
	        return this.children[0].getStartOffset();
	        //return this.syntaxBox[0].offset;
	    };

	    ASTNode.prototype.getEndOffset = function getEndOffset() {
	        return this.children[this.children.length-1].getEndOffset();
	        //return this.syntaxBox[0].offset;
	    };

	    ASTNode.prototype.addChild = function addChild(child) {
	        child.setParent(this);
	        this.children.push(child);
	    };

	    ASTNode.prototype.addToSyntaxBox = function addToSyntaxBox(token) {

	        this.syntaxBox.push(token);
	    };

	    ASTNode.prototype.serializeProps = function serializeProps(prefix) {
	        return "";
	    };

	    ASTNode.prototype.accept = function accept(visitor, context) {
	        visitor.visit(this, context);
	    };

	    ASTNode.prototype.equal = function equal(node) {
	        var idx = 0;
	        var isEqual = this.kind === node.kind && this.children.length === node.children.length;

	        while (isEqual && idx < this.children.length) {
	            isEqual = this.children[idx].equal(node.children[idx]);
	            idx++;
	        }

	        return isEqual;
	    };

	    ASTNode.prototype.serialize = function serialize() {
	        var str = '{ "kind": "' + this.kind.slice(0, -4) + '"';

	        str += this.serializeProps(",");

	        if (this.children.length > 0) {
	            str += ', ' + this.serializeChildren();
	        }

	        if (this.syntaxBox.length > 0) {
	            str = str + ',' + '"syntaxBox": [';
	            var idx = 0;
	            for (idx = 0; idx < this.syntaxBox.length; idx++) {
	                if (idx > 0) {
	                    str += ',';
	                }
	                str += '{';
	                str = str + '"endColumn": ' + this.syntaxBox[idx].endColumn;
	                str = str + ',' + '"endLine": ' + this.syntaxBox[idx].endLine;
	                str = str + ',' + '"image": "' + this.syntaxBox[idx].image + '"';
	                //str = str + ',' + '"isInheritedInRecovery": "' + this.syntaxBox[idx].isInheritedInRecovery + '"';
	                str = str + ',' + '"startColumn": ' + this.syntaxBox[idx].startColumn;
	                str = str + ',' + '"startLine": ' + this.syntaxBox[idx].startLine ;
	                str = str + ',' + '"startOffset": ' + this.syntaxBox[idx].startOffset ;
	                str += '}';
	            }
	            str += ']';


	        }

	        str += '}';
	        str = str.replace(/\n/g, "\\n");
	        return str;
	    };

	    ASTNode.prototype.serializeChildren = function serializeChildren() {

	        var str = '"children": [';

	        var idx = 0;
	        for(idx = 0; idx < this.children.length; idx++) {
	            if (idx > 0) {
	                str += ',';
	            }
	            str += (this.children[idx].serialize());
	        }
	        str += ']';
	        return str;
	    };

	    ASTNode.prototype.deserializeProps = function deserializeProps(nodeObj, astNodesConstructors) {
	        this.kind = nodeObj.kind + 'Node';
	    };

	    ASTNode.prototype.deserialize = function deserialize(nodeObj, astNodesConstructors) {

	        this.deserializeProps(nodeObj);
	        var idx = 0;

	        if (nodeObj.hasOwnProperty('children')) {
	            for (idx = 0; idx < nodeObj.children.length; idx++) {
	                var childClass = nodeObj.children[idx].kind + 'Node';
	                var childNode = new astNodesConstructors[childClass]();
	                childNode.deserialize(nodeObj.children[idx], astNodesConstructors);
	                this.addChild(childNode);
	            }
	        }
	        if (this instanceof BaseExprNode)
	        {
	            this.resolveBusinessType();
	        }

	        if (nodeObj.hasOwnProperty('syntaxBox') && nodeObj.syntaxBox.length > 0) {


	            for (idx = 0; idx < nodeObj.syntaxBox.length; idx++) {

	                var token = {};

	                token.endColumn = nodeObj.syntaxBox[idx].endColumn;
	                token.endLine = nodeObj.syntaxBox[idx].endLine;
	                token.image = nodeObj.syntaxBox[idx].image;
	                token.startColumn = nodeObj.syntaxBox[idx].startColumn;
	                token.startLine = nodeObj.syntaxBox[idx].startLine;
	                token.startOffset = nodeObj.syntaxBox[idx].startOffset;

	                this.addToSyntaxBox(token);
	            }
	        }
	    };

	    /**
	     * Base Hrf  Absence AST node
	     */
	    function AbsenceNode() {
	        ASTNode.call(this, 'AbsenceNode');
	        this.text = "Absence";
	    }

	    AbsenceNode.prototype = Object.create(ASTNode.prototype);
	    AbsenceNode.prototype.constructor = AbsenceNode;

	    AbsenceNode.prototype.serializeProps = function serializeProps(prefix) {
	        var str = prefix + '"text": "' + this.text + '"';
	        return str;
	    };

	    AbsenceNode.prototype.deserializeProps = function deserializeProps(nodeObj) {
	        ASTNode.prototype.deserializeProps.call(this, nodeObj);
	        this.text = nodeObj.text;
	    };

	    AbsenceNode.prototype.equal = function equal(node){
	        return node instanceof AbsenceNode && ASTNode.prototype.equal.call(this, node);
	    };

	    /**
	     * Base Hrf  Connector AST node
	     */
	    function ConnectorNode() {
	        ASTNode.call(this, 'ConnectorNode');
	        this.text = "Connector";

	    }

	    ConnectorNode.prototype = Object.create(ASTNode.prototype);
	    ConnectorNode.prototype.constructor = ConnectorNode;

	    ConnectorNode.prototype.serializeProps = function serializeProps(prefix) {
	        var str = prefix + '"text": "' + this.text + '"';
	        return str;
	    };

	    ConnectorNode.prototype.deserializeProps = function deserializeProps(nodeObj) {
	        ASTNode.prototype.deserializeProps.call(this, nodeObj);
	        this.text = nodeObj.text;
	    };

	    ConnectorNode.prototype.equal = function equal(node){
	        return node instanceof  ConnectorNode && ASTNode.prototype.equal.call(this, node);
	    };

	    /**
	     * Base Hrf  Expression AST node
	     */
	    function BaseExprNode(kind) {
	        ASTNode.call(this, kind);
	        this.isCollection = false;
	        this.businessType = BusinessDataType.unknown;
	    }

	    BaseExprNode.prototype = Object.create(ASTNode.prototype);
	    BaseExprNode.prototype.constructor = BaseExprNode;

	    BaseExprNode.prototype.getBusinessType = function getBusinessType() {

	        var businessType = {};

	        if(this.businessType === BusinessDataType.unknown) {
	            this.resolveBusinessType();
	        }

	        businessType.type  = this.businessType;
	        businessType.isCollection = this.isCollection;
	        return businessType;
	    };

	    BaseExprNode.prototype.deserializeProps = function deserializeProps(nodeObj) {
	        ASTNode.prototype.deserializeProps.call(this, nodeObj);

	        this.isCollection = false;
	        this.businessType = BusinessDataType.unknown;
	    };

	    BaseExprNode.prototype.equal = function equal(node){
	        return /*this.isCollection === node.isCollection && this.businessType === node.businessType &&*/ ASTNode.prototype.equal.call(this, node);
	    };

	    BaseExprNode.prototype.resolveBusinessType = function resolveBusinessType() {

	    };

	    /**
	     * Base Hrf  or / and node
	     */
	    function LogicalExprNode(logicalOp) {
	        BaseExprNode.call(this, 'LogicalExprNode');
	        this.operator = logicalOp;
	        this.businessType = BusinessDataType.Boolean;

	    }

	    LogicalExprNode.prototype = Object.create(BaseExprNode.prototype);
	    LogicalExprNode.prototype.constructor = LogicalExprNode;


	    LogicalExprNode.operator = {
	        and : 'and',
	        or  : 'or'
	    };


	    LogicalExprNode.prototype.serializeProps = function serializeProps(prefix) {
	        var str = prefix + '"operator": "' + this.operator + '"';

	        return str;
	    };


	    LogicalExprNode.prototype.deserializeProps = function deserializeProps(nodeObj) {
	        BaseExprNode.prototype.deserializeProps.call(this, nodeObj);
	        this.operator = nodeObj.operator;
	        //this.businessType = BusinessDataType.Boolean;


	    };

	    LogicalExprNode.prototype.equal = function equal(node){
	        return node instanceof LogicalExprNode && this.operator === node.operator /*&& this.businessType === node.businessType*/ && BaseExprNode.prototype.equal.call(this, node);
	    };

	    /**
	     * Base Relational node for comparison operators and Boolean functions (for example <, >, contains)
	     *
	     */
	    function RelationalExprNode(relationalOperator ) {
	        BaseExprNode.call(this, 'RelationalExprNode');
	        this.operator = relationalOperator;
	        this.businessType = BusinessDataType.Boolean;

	    }

	    RelationalExprNode.prototype = Object.create(BaseExprNode.prototype);
	    RelationalExprNode.prototype.constructor = RelationalExprNode;

	    RelationalExprNode.operator = {
	        isLess          : 'isLess',
	        isGreater       : 'isGreater',
	        isEqual         : 'isEqual',
	        isNotEqual      : 'isNotEqual',
	        isLessEqual     : 'isLessEqual',
	        isGreaterEqual  : 'isGreaterEqual'
	    };

	    RelationalExprNode.prototype.serializeProps = function serializeProps(prefix) {
	        var str = prefix + '"operator": "' + this.operator + '"';

	        return str;
	    };


	    RelationalExprNode.prototype.deserializeProps = function deserializeProps(nodeObj) {
	        BaseExprNode.prototype.deserializeProps.call(this, nodeObj);
	        this.operator = nodeObj.operator;
	        //this.businessType = BusinessDataType.Boolean;
	    };

	    RelationalExprNode.prototype.equal = function equal(node) {
	        return node instanceof RelationalExprNode && this.operator === node.operator /*&& this.businessType === node.businessType*/ && BaseExprNode.prototype.equal.call(this, node);
	    };

	    /**
	     *  Adding node for arithmetic ( + , - )
	     *
	     */
	    function BinaryExprNode(operator ) {
	        BaseExprNode.call(this, 'BinaryExprNode');
	        this.operator = operator;
	        //this.businessType = BusinessDataType.Number;

	    }

	    BinaryExprNode.prototype = Object.create(BaseExprNode.prototype);
	    BinaryExprNode.prototype.constructor = BinaryExprNode;

	    BinaryExprNode.operator= {
	        plus    : 'plus',
	        minus   : 'minus',
	        mult    : 'mult',
	        div     : 'div'
	    };

	    BinaryExprNode.prototype.serializeProps = function serializeProps(prefix) {
	        var str = prefix + '"operator": "' + this.operator + '"';

	        return str;
	    };

	    BinaryExprNode.prototype.deserializeProps = function deserializeProps(nodeObj) {
	        BaseExprNode.prototype.deserializeProps.call(this, nodeObj);
	        this.operator = nodeObj.operator;
	        // this.businessType = BusinessDataType.Number;
	    };

	    BinaryExprNode.prototype.equal = function equal(node){
	        return node instanceof BinaryExprNode && this.operator === node.operator && BaseExprNode.prototype.equal.call(this, node);
	    };

	    BinaryExprNode.prototype.resolveBusinessType = function resolveBusinessType() {
	        // Later enhance to be dependent on operator + left side (for example + for strings)
	        if (this.operator=== BinaryExprNode.operator.minus || this.operator===BinaryExprNode.operator.plus  ||
	            this.operator===BinaryExprNode.operator.mult || this.operator===BinaryExprNode.operator.div) {

	            this.businessType = BusinessDataType.Number;
	        }
	        else if (this.operator===BinaryExprNode.operator.Plus && this.children.lenght > 0) {
	            if (this.children[0].getBusinessType().type === BusinessDataType.String) {
	                this.businessType = BusinessDataType.String;
	            }
	            else if (this.children.lenght > 0 && this.children[0].getBusinessType().type === BusinessDataType.Number) {
	                this.businessType = BusinessDataType.Number;
	            }
	        }

	    };

	    /**
	     *  Unary Sign node for arithmetic (+ , - )
	     *
	     */
	    function UnaryExprNode(operator ) {
	        BaseExprNode.call(this, 'UnaryExprNode');
	        this.operator = operator;
	        //this.businessType = BusinessDataType.Number;
	    }

	    UnaryExprNode.prototype = Object.create(BaseExprNode.prototype);
	    UnaryExprNode.prototype.constructor = UnaryExprNode;

	    UnaryExprNode.operator = {
	        minus   : 'minus'
	    };

	    UnaryExprNode.prototype.getStartOffset = function getStartOffset() {

	        return this.syntaxBox[0].offset;
	    };

	    UnaryExprNode.prototype.serializeProps = function serializeProps(prefix) {
	        var str = prefix + '"operator": "' + this.operator + '"';

	        return str;
	    };

	    UnaryExprNode.prototype.deserializeProps = function deserializeProps(nodeObj) {
	        BaseExprNode.prototype.deserializeProps.call(this, nodeObj);
	        this.operator = nodeObj.operator;
	        //this.businessType = BusinessDataType.Number;
	    };

	    UnaryExprNode.prototype.equal = function equal(node) {
	        return node instanceof UnaryExprNode && this.operator === node.operator && BaseExprNode.prototype.equal.call(this, node);
	    };

	    UnaryExprNode.prototype.resolveBusinessType = function resolveBusinessType() {
	        // Later enhance to be dependent on operator and child
	        if(this.operator === 'Minus') {
	            this.businessType = BusinessDataType.Number;
	        }
	    };

	    /**
	     *  Abstract  element  node for representing a single expression (recursive definitin)
	     *
	     */
	    function BaseExprElementNode(kind ) {
	        BaseExprNode.call(this, kind);
	    }

	    BaseExprElementNode.prototype = Object.create(BaseExprNode.prototype);
	    BaseExprElementNode.prototype.constructor = BaseExprElementNode;

	    BaseExprElementNode.prototype.getStartOffset = function getStartOffset() {
	        return this.syntaxBox[0].offset;
	    };

	    BaseExprElementNode.prototype.equal = function equal(node) {
	        return BaseExprNode.prototype.equal.call(this, node);
	    };

	    /**
	     *  Any type of literal including NIL (number, string, etc...)
	     *
	     */
	    function LiteralNode(value, businessType ) {
	        BaseExprElementNode.call(this, 'LiteralNode');
	        this.value = value;
	        this.businessType = businessType;
	        this.isCollection = false;
	    }

	    LiteralNode.prototype = Object.create(BaseExprElementNode.prototype);
	    LiteralNode.prototype.constructor = LiteralNode;

	    LiteralNode.prototype.getEndOffset = function getEndOffset() {
	        return this.syntaxBox[this.syntaxBox.length -1].endColumn - 1;
	    };

	    LiteralNode.prototype.serializeProps = function serializeProps(prefix) {
	        var str = prefix + '"value": "' + this.value + '", ' +  '"businessType": "' + this.businessType + '"' ;
	        return str;
	    };

	    LiteralNode.prototype.deserializeProps = function deserializeProps(nodeObj) {
	        BaseExprElementNode.prototype.deserializeProps.call(this, nodeObj);
	        this.value = nodeObj.value;
	        this.businessType = nodeObj.businessType;
	        this.isCollection = false;
	    };

	    LiteralNode.prototype.equal = function equal(node) {
	        return node instanceof LiteralNode && this.value === node.value && this.businessType === node.businessType && this.isCollection === node.isCollection && BaseExprElementNode.prototype.equal.call(this, node);
	    };

	    function UOMLiteralNode(value, businessType, UOM) {
	        LiteralNode.call(this, value, businessType);
	        this.kind = 'UOMLiteralNode';
	        this.UOM = UOM;
	    }

	    UOMLiteralNode.prototype = Object.create(LiteralNode.prototype);
	    UOMLiteralNode.prototype.constructor = UOMLiteralNode;

	    UOMLiteralNode.prototype.serializeProps = function serializeProps(prefix) {
	        var str = LiteralNode.prototype.serializeProps.call(this, prefix);
	        str = str + prefix + '"UOM": "' + this.UOM + '"';

	        return str;
	    };

	    UOMLiteralNode.prototype.deserializeProps = function deserializeProps(nodeObj) {
	        LiteralNode.prototype.deserializeProps.call(this, nodeObj);
	        this.UOM = nodeObj.UOM;
	    };

	    UOMLiteralNode.prototype.equal = function equal(node){
	        return node instanceof UOMLiteralNode && this.UOM === node.UOM && LiteralNode.prototype.equal.call(this, node);
	    };

	    /**
	     *  node for representing vocabulary term (age of the player)
	     *
	     */
	    function IdentifierNode(context) {
	        BaseExprElementNode.call(this, 'IdentifierNode');

	        if(context) {
	            this.businessType = context.businessType;
	            this.isCollection = context.isCollection;
	            this.rootObject = context.rootObject;
	            this.attribute = context.attribute;
	            this.associations = context.associations;
	            //this.modifiers = context.modifiers;
	            this.modifiers = {};

	            if(context.modifiers) {
	                for (var key in context.modifiers) {
	                    if(context.modifiers.hasOwnProperty(key)) {
	                        this.modifiers[key] = context.modifiers[key];
	                    }
	                }
	            }

	        }
	        else
	        {
	            this.businessType = null;
	            this.isCollection = null;
	            this.rootObject = null;
	            this.attribute = null;
	            this.associations = [];
	            this.modifiers = {};
	        }
	        //this.scope = context;
	    }


	    IdentifierNode.prototype = Object.create(BaseExprElementNode.prototype);
	    IdentifierNode.prototype.constructor = IdentifierNode;

	    IdentifierNode.prototype.getEndOffset = function getEndOffset() {


	        return this.syntaxBox[this.syntaxBox.length -1].endColumn - 1;
	    };

	    IdentifierNode.prototype.serializeProps = function serializeProps(prefix) {
	        var str = prefix + '"businessType": "' + this.businessType + '"';
	        str = str + ',' + '"isCollection": ' + this.isCollection;
	        str = str + ',' + '"rootObject": "' + this.rootObject + '"';
	        str = str + ',' + '"attribute": "' + this.attribute + '"';
	        str = str + ',' + '"associations": [';

	        var idx = 0;
	        for(idx = 0; idx < this.associations.length; idx++) {
	            if (idx > 0) {
	                str += ',';
	            }
	            str = str + '"' + this.associations[idx] + '"';
	        }
	        str += ']';

	        str += ',' + '"modifiers": {';

	        var idx = 0;
	        /*for(idx = 0; idx < this.modifiers.length; idx++) {
	         if (idx > 0) {
	         str += ','
	         }
	         str += '{' + this.modifiers[idx].name + this.modifiers[idx].value + this.modifiers[idx].value + '}';
	         }
	         str += ']';*/

	        for (var key in this.modifiers) {
	            if(idx > 0) {
	                str += ',';
	            }
	            str += '"' + key +   '":' + this.modifiers[key];
	            idx++;

	        }

	        str += '}';
	        return str;
	    };

	    IdentifierNode.prototype.deserializeProps = function deserializeProps(nodeObj) {

	        BaseExprElementNode.prototype.deserializeProps.call(this, nodeObj);
	        this.businessType = nodeObj.businessType;
	        this.isCollection = nodeObj.isCollection;
	        this.rootObject = nodeObj.rootObject;
	        this.attribute = nodeObj.attribute;

	        var idx = 0;
	        for(idx = 0; idx < nodeObj.associations.length; idx++) {
	            this.associations.push(nodeObj.associations[idx] );
	        }

	        for (var key in nodeObj.modifiers) {
	            this.modifiers[key] = nodeObj.modifiers[key];
	        }
	    };

	    IdentifierNode.prototype.equal = function equal(node) {
	        var isEqual =   node instanceof IdentifierNode &&
	            this.businessType === node.businessType &&
	            this.isCollection === node.isCollection &&
	            this.rootObject === node.rootObject &&
	            this.attribute === node.attribute &&
	            this.modifiers.length === node.modifiers.length &&
	            this.associations.length === node.associations.length &&
	            BaseExprElementNode.prototype.equal.call(this, node);

	        if (isEqual && this.modifiers.length > 0) {
	            for (var key in this.modifiers) {
	                isEqual = this.modifiers[key] === node.modifiers[key];
	                if (!isEqual){
	                    break;
	                }
	            }
	        }

	        if (isEqual && this.associations.length > 0) {
	            var idx = 0;
	            while (isEqual && idx < this.associations.length) {
	                isEqual = this.associations[idx] === node.associations[idx];
	                idx++;
	            }
	        }

	        return isEqual;
	    };

	    /**
	     *  base node for representing a function
	     *
	     */
	    function BaseExprFunctionNode(kind, functionName) {
	        BaseExprElementNode.call(this, kind);
	        this.functionName = functionName;
	    }

	    BaseExprFunctionNode.prototype = Object.create(BaseExprElementNode.prototype);
	    BaseExprFunctionNode.prototype.constructor = BaseExprFunctionNode;

	    BaseExprFunctionNode.prototype.serializeProps = function serializeProps(prefix) {
	        var str = prefix + '"functionName": "' + this.functionName + '"';

	        return str;
	    };

	    BaseExprFunctionNode.prototype.deserializeProps = function deserializeProps(nodeObj) {
	        BaseExprElementNode.prototype.deserializeProps.call(this, nodeObj);
	        this.functionName = nodeObj.functionName;
	    };

	    BaseExprFunctionNode.prototype.equal = function equal(node) {
	        return this.functionName === node.functionName && BaseExprElementNode.prototype.equal.call(this, node);
	    };

	    /**
	     *  node ofr supporting list of expression (with all / any of logiacl operations)
	     *
	     */
	    function StructNode(logicalOp) {
	        BaseExprElementNode.call(this, 'StructNode');
	        this.logicalOp = logicalOp;
	        this.businessType = BusinessDataType.Boolean;
	        this.isCollection = false;
	    }

	    StructNode.prototype = Object.create(BaseExprElementNode.prototype);
	    StructNode.prototype.constructor = StructNode;

	    StructNode.prototype.deserializeProps = function deserializeProps(nodeObj) {
	        BaseExprElementNode.prototype.deserializeProps.call(this, nodeObj);

	        this.logicalOp = nodeObj.logicalOp;
	        //this.businessType = BusinessDataType.Boolean;
	        this.isCollection = false;
	    };

	    StructNode.prototype.equal = function equal(node) {
	        return node instanceof StructNode && this.logicalOp === node.logicalOp /*&& this.businessType === node.businessType*/ && this.isCollection === node.isCollection && BaseExprElementNode.prototype.equal.call(this, node);
	    };

	    /**
	     *  node for supporting (expression)
	     *
	     */
	    function BracketsExprNode() {
	        BaseExprElementNode.call(this, 'BracketsExprNode');
	    }

	    BracketsExprNode.prototype = Object.create(BaseExprElementNode.prototype);
	    BracketsExprNode.prototype.constructor = BracketsExprNode;

	    BracketsExprNode.prototype.getBusinessType = function getBusinessType() {
	        if (this.children.length > 0) {
	            return this.children[0].getBusinessType();
	        }
	        return undefined;
	    };

	    BracketsExprNode.prototype.getEndOffset = function getEndOffset() {
	        return this.syntaxBox[this.syntaxBox.length -1].endColumn - 1;
	    };

	    BracketsExprNode.prototype.resolveBusinessType = function resolveBusinessType() {
	        // Later enhance to be dependent on operator and childe
	        if(this.children.length > 0) {
	            this.businessType = this.children[0].getBusinessType().type;
	            this.isCollection = this.children[0].getBusinessType().isCollection;
	        }
	    };

	    BracketsExprNode.prototype.equal = function equal(node) {
	        return node instanceof BracketsExprNode && BaseExprElementNode.prototype.equal.call(this, node);
	    };

	    /**
	     *   node for representing aggregation function (sum of, average...)
	     *
	     */
	    function AggFunctionNode(functionName) {

	        BaseExprFunctionNode.call(this, 'AggFunctionNode', functionName);

	    }

	    AggFunctionNode.prototype = Object.create(BaseExprFunctionNode.prototype);
	    AggFunctionNode.prototype.constructor = AggFunctionNode;

	    AggFunctionNode.aggFunction = {
	        avg             : 'avg',
	        sum             : 'sum',
	        count           : 'count',
	        countDistinct   : 'countDistinct',
	        min             : 'min',
	        max             : 'max'
	    };

	    AggFunctionNode.prototype.resolveBusinessType = function resolveBusinessType() {
	        //  TBD - Later enhance to be dependent on fucntion name
	        this.businessType = BusinessDataType.Number;

	        var idx = 1;
	        for(idx = 1; idx < this.children.length; idx++) {
	            if(this.children[idx] instanceof GroupClauseNode)
	            {
	                this.isCollection = false;
	                return;
	            }
	        }
	    };

	    AggFunctionNode.prototype.equal = function equal(node) {
	        return node instanceof AggFunctionNode && BaseExprFunctionNode.prototype.equal.call(this, node);
	    };

	    /**
	     *   node for representing aggregation function (sum of, average...)
	     *
	     */
	    function FunctionNode(functionName) {
	        BaseExprFunctionNode.call(this, 'FunctionNode', functionName);
	    }

	    FunctionNode.prototype = Object.create(BaseExprFunctionNode.prototype);
	    FunctionNode.prototype.constructor = FunctionNode;

	    FunctionNode.functionName = {
	        existsIn      : 'existsIn',
	        notExistsIn   : 'notExistsIn',
	        isBetween     : 'isBetween',
	        isNotBetween  : 'isNotBetween',
	        contains      : 'contains',
	        notContains   : 'notContains',
	        startsWith    : 'startsWith',
	        notStartsWith : 'notStartsWith',
	        endsWith      : 'endsWith',
	        notEndsWith   : 'notEndsWith',
	        isInTheLast   : 'isInTheLast',
	        isNotInTheLast: 'isNotInTheLast',
	        isInTheNext   : 'isInTheNext',
	        isNotInTheNext: 'isNotInTheNext',
	        isLike        : 'isLike',
	        isNotLike     : 'isNotLike',
	        concatenate   : 'concatenate'
	    };

	    FunctionNode.prototype.resolveBusinessType = function resolveBusinessType() {
	        //  TBD - Later enhance to be dependent on function name
	        this.businessType = BusinessDataType.String;
	        this.isCollection = false;

	    };

	    FunctionNode.prototype.equal = function equal(node) {
	        return node instanceof FunctionNode && BaseExprFunctionNode.prototype.equal.call(this, node);
	    };

	    /**
	     *   node for representing filter of aggreagtion function ("where age > 30")
	     *
	     */
	    function FilterClauseNode() {
	        ASTNode.call(this, 'FilterClauseNode');
	    }

	    FilterClauseNode.prototype = Object.create(ASTNode.prototype);
	    FilterClauseNode.prototype.constructor = FilterClauseNode;

	    FilterClauseNode.prototype.getStartOffset = function getStartOffset() {
	        return this.syntaxBox[0].offset;
	    };

	    FilterClauseNode.prototype.equal = function equal(node) {
	        return node instanceof FilterClauseNode && ASTNode.prototype.equal.call(this, node);
	    };

	    /**
	     *   node for representing grouping of aggregation function ('group by level of player")
	     *
	     */
	    function GroupClauseNode() {
	        ASTNode.call(this, 'GroupClauseNode');

	    }

	    GroupClauseNode.prototype = Object.create( ASTNode.prototype);
	    GroupClauseNode.prototype.constructor = GroupClauseNode;

	    GroupClauseNode.prototype.getStartOffset = function getStartOffset() {

	        return this.syntaxBox[0].offset;
	    };

	    GroupClauseNode.prototype.equal = function equal(node) {
	        return node instanceof GroupClauseNode && ASTNode.prototype.equal.call(this, node);
	    };

	    function OrderClauseNode(orderOption) {
	        ASTNode.call(this, 'OrderClauseNode');
	        this.orderOption = orderOption;
	    }

	    OrderClauseNode.prototype = Object.create( ASTNode.prototype);
	    OrderClauseNode.prototype.constructor = OrderClauseNode;

	    OrderClauseNode.prototype.getStartOffset = function getStartOffset() {

	        return this.syntaxBox[0].offset;
	    };

	    OrderClauseNode.prototype.serializeProps = function serializeProps(prefix) {
	        var str = prefix + '"orderOption": "' + this.orderOption + '"';

	        return str;
	    };

	    OrderClauseNode.prototype.deserializeProps = function deserializeProps(nodeObj) {
	        ASTNode.prototype.deserializeProps.call(this, nodeObj);
	        this.orderOption = nodeObj.orderOption;
	    };

	    OrderClauseNode.prototype.equal = function equal(node) {
	        return node instanceof OrderClauseNode && this.orderOption === node.orderOption && ASTNode.prototype.equal.call(this, node);
	    };

	    //module.exports = {};

	    module.exports.ASTNode = ASTNode;
	    module.exports.AbsenceNode = AbsenceNode;
	    module.exports.ConnectorNode = ConnectorNode;
	    module.exports.BaseExprNode = BaseExprNode;
	    module.exports.LogicalExprNode = LogicalExprNode;
	    module.exports.RelationalExprNode = RelationalExprNode;
	    module.exports.BinaryExprNode = BinaryExprNode;
	    module.exports.UnaryExprNode = UnaryExprNode;
	    module.exports.BaseExprElementNode = BaseExprElementNode;
	    module.exports.LiteralNode = LiteralNode;
	    module.exports.UOMLiteralNode = UOMLiteralNode;
	    module.exports.IdentifierNode = IdentifierNode;
	    module.exports.BaseExprFunctionNode = BaseExprFunctionNode;
	    module.exports.StructNode = StructNode;
	    module.exports.BracketsExprNode = BracketsExprNode;
	    module.exports.FunctionNode = FunctionNode;
	    module.exports.FilterClauseNode = FilterClauseNode;
	    module.exports.AggFunctionNode = AggFunctionNode;
	    module.exports.GroupClauseNode = GroupClauseNode;
	    module.exports.BusinessDataType = BusinessDataType;
	    module.exports.deserialize = deserialize;
	    module.exports.deserialize = function (astStr) {
	        return deserialize(module.exports, astStr);};

	}());



/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	

	(function() {

	    var astNodes = __webpack_require__(1);

	    /**
	     * Check if tree1 is equal to tree2
	     * @param tree1
	     * @param tree2
	     * @returns {boolean}
	     */
	    function equal (tree1, tree2){
	        return tree1 !== null && tree2 !== null && tree1.equal(tree2);
	    }


	    /**
	     * Checks if the nodes have the same kind and operator values
	     * @param tree1
	     * @param tree2
	     * @returns {boolean}
	     */
	    function areOperatorNodesEqual (tree1, tree2){
	        if (tree1 && tree2 &&
	            tree1.getKind() === tree2.getKind() &&
	            tree1.hasOwnProperty('operator') && tree2.hasOwnProperty('operator') &&
	            tree1.operator === tree2.operator)
	            return true;

	        return false;
	    }

	    /**
	     * Gets the last index of the partial tree (=tree2) in tree1
	     * Assumptions: The root is common and left childs are to be
	     * @param tree1
	     * @param tree2
	     * @returns {number}
	     */
	    function getPartialTreeLastIndex (tree1, tree2){
	        var partialTreeIndex = -1;

	        if (areOperatorNodesEqual(tree1, tree2) && tree1.children.length > 1 && tree1.children.length > tree2.children.length) {
	            for (var idx = 0; idx < tree2.children.length; idx++) {
	                if(tree1[idx].equal(tree2[idx])){
	                    partialTreeIndex = idx;
	                }
	            }
	        }
	        return partialTreeIndex;
	    }

	    /**
	     * Splits allAST from its most left sub tree
	     * @param leftExprNode - left most sub tree
	     * @param allASTNodes - all AST
	     */
	    function split (leftExprNode, allASTNodes, operatorNode){
	        var mostLeftNode;
	        var mostLeftAST;
	        var ASTParts =  null;
	        var allASTNodesCopy = astNodes.deserialize(allASTNodes.serialize());//allASTNodes? Object.assign({}, allASTNodes): null;

	        function getMostLeftNode(allASTNodes){
	             if (allASTNodes.children.length === 0){
	                 return allASTNodes;
	             }
	            return getMostLeftNode(allASTNodes.children[0]);
	        }

	        /**
	         * Getting the most left AST part that is equal to the given leftPartAST - searching from up->down
	         * @param leftPartAST
	         * @param root
	         * @returns {*}
	         */
	        /*function searchMostLeftPartFromRoot(leftPartAST, root) {
	            var mostLeft = null;

	            if (equal(leftPartAST, root)){
	                mostLeft = root;
	            }
	            else {
	                if (root.children.length > 0) {
	                    mostLeft = searchMostLeftPartFromRoot(leftPartAST, root.children[0])
	                }
	            }
	            return mostLeft;
	        }*/

	        /**
	         * Getting the most left AST part that is equal to the given leftPartAST - searching from down->up
	         * @param leftPartAST
	         * @param root
	         * @returns {*}
	         */
	        function searchMostLeftPartFromLeaf(leftPartAST, mostLeft) {
	            var mostLeftSubTree = null;

	            if (equal(leftPartAST, mostLeft)){
	                mostLeftSubTree = mostLeft;
	            }
	            else {
	                if (mostLeft.parent) {
	                    mostLeftSubTree = searchMostLeftPartFromLeaf(leftPartAST, mostLeft.parent);
	                }
	            }
	            return mostLeftSubTree;
	        }


	        function addConnectorNodesToSplittingArea(splitNode, operatorNode, allAST){
	            var connectorNode;
	            var parts = {};
	            var splitNodeParent = splitNode.parent;

	            //splitNode.parent = new astNodes.ConnectorNode();
	            //splitNode.parent.addChild(splitNode);
	            splitNode.parent = null;

	            if(operatorNode){
	                //parts.left = splitNode.parent;
	                parts.left = splitNode;

	                connectorNode = new astNodes.ConnectorNode();

	                //setting connector parent
	                if(splitNodeParent) {

	                    //Setting connector children
	                    if (splitNodeParent.children.length > 0) {
	                        for (var idx = 1; idx < splitNodeParent.children.length; idx++) {
	                            connectorNode.addChild(splitNodeParent.children[idx]);
	                        }
	                        splitNodeParent.children = [];
	                    }

	                    if(splitNodeParent.parent) {
	                        connectorNode.parent = splitNodeParent.parent;
	                        splitNodeParent.parent.children[0] = connectorNode;
	                    }
	                    splitNodeParent.parent = null;
	                }

	                parts.operator = splitNodeParent;
	                parts.rest = (allAST === parts.operator)? connectorNode: allAST;
	            }
	            else{ // no operator
	                //parts.left = splitNode.parent;
	                parts.left = splitNode;
	                parts.operator = null;
	                connectorNode = new astNodes.ConnectorNode();
	                connectorNode.parent = splitNodeParent;
	                splitNodeParent.children[0] = connectorNode;
	                parts.rest = allAST;
	            }

	            return parts;
	        }

	        if(allASTNodesCopy && leftExprNode){
	            mostLeftNode = getMostLeftNode(allASTNodesCopy);
	            mostLeftAST = searchMostLeftPartFromLeaf(leftExprNode, mostLeftNode);
	            if (mostLeftAST) { //equal to all AST or mostLeft is part of the allASTg
	                ASTParts = addConnectorNodesToSplittingArea(mostLeftAST, operatorNode, allASTNodesCopy);
	            }
	            else{
	                var partialTreeIndex = getPartialTreeLastIndex(allASTNodesCopy, leftExprNode);
	                if (partialTreeIndex >= 0){

	                }
	            }
	        }

	        return ASTParts;
	    }

	    /***
	     * Builds operator node, according operator name
	     * @param operator
	     * @returns {*}
	     */
	    function buildOperator (operator){

	        switch (operator) {

	            case astNodes.BinaryExprNode.operator.plus    :
	            case astNodes.BinaryExprNode.operator.minus   :
	            case astNodes.BinaryExprNode.operator.mult    :
	            case astNodes.BinaryExprNode.operator.div:
	                return new astNodes.BinaryExprNode(operator);

	            /*case astNodes.UnaryExprNode.operator.minus:
	                return new astNodes.UnaryExprNode(operator);*/

	            case astNodes.LogicalExprNode.operator.and:
	            case astNodes.LogicalExprNode.operator.or:
	                return new astNodes.LogicalExprNode(operator);

	            case astNodes.RelationalExprNode.operator.isEqual:
	            case astNodes.RelationalExprNode.operator.isNotEqual:
	            case astNodes.RelationalExprNode.operator.isGreater:
	            case astNodes.RelationalExprNode.operator.isGreaterEqual:
	            case astNodes.RelationalExprNode.operator.isLess:
	            case astNodes.RelationalExprNode.operator.isLessEqual:
	                return new astNodes.RelationalExprNode(operator);

	            case astNodes.AggFunctionNode.aggFunction.avg:
	            case astNodes.AggFunctionNode.aggFunction.count:
	            case astNodes.AggFunctionNode.aggFunction.countDistinct:
	            case astNodes.AggFunctionNode.aggFunction.max:
	            case astNodes.AggFunctionNode.aggFunction.min:
	            case astNodes.AggFunctionNode.aggFunction.sum:
	                return new astNodes.AggFunctionNode(operator);

	            case astNodes.FunctionNode.functionName.contains:
	            case astNodes.FunctionNode.functionName.notContains:
	            case astNodes.FunctionNode.functionName.endsWith:
	            case astNodes.FunctionNode.functionName.notEndsWith:
	            case astNodes.FunctionNode.functionName.existsIn:
	            case astNodes.FunctionNode.functionName.notExistsIn:
	            case astNodes.FunctionNode.functionName.isBetween:
	            case astNodes.FunctionNode.functionName.isNotBetween:
	            case astNodes.FunctionNode.functionName.isInTheLast:
	            case astNodes.FunctionNode.functionName.isNotInTheLast:
	            case astNodes.FunctionNode.functionName.isInTheNext:
	            case astNodes.FunctionNode.functionName.isNotInTheNext:
	            case astNodes.FunctionNode.functionName.isLike:
	            case astNodes.FunctionNode.functionName.isNotLike:
	            case astNodes.FunctionNode.functionName.startsWith:
	            case astNodes.FunctionNode.functionName.notStartsWith:
	            case astNodes.FunctionNode.functionName.concatenate:
	                return new astNodes.FunctionNode(operator);

	            default:
	                return null;
	        }
	    }

	    module.exports.equal = equal;
	    module.exports.split = split;
	    module.exports.buildOperator = buildOperator;

	}());

/***/ }
/******/ ]);