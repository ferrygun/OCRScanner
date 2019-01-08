/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2016 SAP SE. All rights reserved
	
 */

/**
 * Initialization code and shared classes of library sap.rules.ui.
 */
sap.ui.define([
	"jquery.sap.global",
	"sap/ui/core/library"
], function(jQuery, library) {
	"use strict";

	/**
	 * UI5 library: sap.rules.ui.
	 *
	 * @namespace
	 * @name sap.rules.ui
	 * @public
	 */

	// library dependencies
	// delegate further initialization of this library to the Core
	sap.ui.getCore().initLibrary({
		name: "sap.rules.ui",
		dependencies: ["sap.ui.core","sap.ui.comp"],
		types: [
			"sap.rules.ui.ValidationStatus",
			"sap.rules.ui.ExpressionType",
			"sap.rules.ui.Tokens",
			"sap.rules.ui.RuleType",
			"sap.rules.ui.RuleFormat",
			"sap.rules.ui.RuleHitPolicy",
			"sap.rules.ui.DecisionTableCellFormat",
			"sap.rules.ui.DecisionTableFormat",
		],
		interfaces: [],
		controls: [
			"sap.rules.ui.RuleBuilder",
			"sap.rules.ui.BaseRule",
			"sap.rules.ui.DecisionTable",
			"sap.rules.ui.DecisionTableSettings",
			"sap.rules.ui.ExpressionAdvanced",
            "sap.rules.ui.ExpressionBase",
			"sap.rules.ui.DecisionTableCellExpressionAdvanced",
			"sap.rules.ui.BindingSpy",
			"sap.rules.ui.DecisionTableCell",
            "sap.rules.ui.TextRule",
            "sap.rules.ui.TextRuleSettings",
			"sap.rules.ui.type.ExpressionAbs",
			"sap.rules.ui.type.DecisionTableCell",
			"sap.rules.ui.type.DecisionTableHeader",
			"sap.rules.ui.type.Expression" 
		],
		elements: [
			"sap.rules.ui.services.ExpressionLanguage",
			"sap.rules.ui.DecisionTableConfiguration",
			"sap.rules.ui.TextRuleConfiguration"
		],
		noLibraryCSS: false,
		version: "1.52.8"
	});

	// sap.rules.ui library contants

	//************************************************************************
	// Private Types
	//************************************************************************
	/**
	 * Decision Table columns types
	 *
	 * @enum {string}
	 * @private 
	 */
	sap.rules.ui.DecisionTableColumn = {
		/**
		 * Condition column
		 * @public
		 */
		Condition: "CONDITION",
		/**
		 * Output column
		 * @public
		 */
		Result: "RESULT"
	};

	/**
	 * Decision Table columns types
	 *
	 * @enum {string}
	 * @private 
	 */
	sap.rules.ui.ChangeId = {
		/**
		 * oDataModel groupId for New Rule
		 * @public
		 */
		NewRule: "newRule",
		/**
		 * oDataModel groupId for DecisionTable
		 * @public
		 */
		DecisionTable: "decisionTable",
		/**
		 * oDataModel groupId for DecisionTableColumns / Cells changes 
		 * @public
		 */
		DecisionTableColumns: "decisionTableColumns",
		/**
		 * oDataModel groupId for DecisionTableRows / Cells changes 
		 * @public
		 */
		DecisionTableRows: "decisionTableRows"
	};

	//************************************************************************
	// Public Types
	//************************************************************************

	/**
	 * An enumeration that defines whether the rule is formulated as a table with multiple rules instead of a rule with a single associated condition.
	 *
	 * @enum {string}
	 * @public 
	 */
	sap.rules.ui.RuleType = {
		/**
		 * Specifies that the rule is formulated as a table that allows complex rules to be visualized according to an if-then-else logic.
		 * @public
		 */
		DecisionTable: "DT",
		/**
		 * Specifies a collection of rules to be processed together.
		 * @private
		 */
		Ruleset: "RS",
		/**
		 * Specifies that the rule is formulated as a single condition, which is written directly in a business language.
		 * @public
		 */
		TextRule: "TextRule"
	};

	/** An enumeration that defines how a cell in a decision table is formulated by the rule creator.
	 *
	 * @enum {string}
	 * @public
	 * @deprecated This attribute is deprecated since version 1.52.8, use the property decisionTableFormat.
	 */
	sap.rules.ui.DecisionTableCellFormat = {
		/**
		 * Specifies that both rule formats are available in the decision table; allowing the rule creator to choose whether to formulate the decision table cells in either the basic or advanced format.
		 * @public
		 */
		Both: "BOTH",
		/**
		 * Specifies that the content of the decision table cell is restricted to values relevant to the data type of the table column's expression.
		 * @public
		 */
		Guided: "GUIDED",
		/**
		 * Specifies that the content of the decision table cell receives all possible suggestions (relevant functions, attributes and values) that are relevant to the data type of the table column's expression.
		 * @public
		 */
		Text: "TEXT"
	};

	/**
	 * An enumeration that provides the different editing formats for writing business expressions in decision tables.
	 *
	 * @enum {string}
	 * @private
	 */
	sap.rules.ui.RuleFormat = {
		/**
		 * Specifies that both rule formats are available; allowing the rule creator to choose whether to formulate the rule's expression in either the basic or advanced format.
		 * @private
		 */
		Both: "BOTH",
		/**
		 * Specifies that the rule's expression is formulated in a simplistic manner by selecting vocabulary attributes and operators from predefined dropdown lists, and by typing in or selecting values from corresponding UI controls (for example, date picker for dates).
		 * Suitable for first time or occasional users, and for simple business rules.
		 * @public
		 */
		Basic: "BASIC",
		/**
		 * Specifies that the rule's expression is formulated in a freestyle textual mode using a business language that is aided by auto-complete suggestions.
		 * This mode exposes the full set of features and functionality of the business language. 
		 * Suitable for expert users and complex business rules.
		 * @public
		 */
		Advanced: "ADVANCED"
	};
	
	/**
     * An enumeration that decides the rendering format for decisionTable.
     *
     * @enum {string}
     * @public
     */
    sap.rules.ui.DecisionTableFormat = {
        /**
         * Specifies that the rendering of a cell is based on cellFormat and each cell can have a different format during rendering 
         * @public
         * @deprecated This attribute is deprecated since version 1.52.8, use the attribute RuleFormat instead. 
         */
         CellFormat: "CELLFORMAT",
         /**
          * Specifies that the rendering is at the rule level.
          * The value set here is applicable for all the cells in the rule. 
          * @public
          */
         RuleFormat: "RULEFORMAT" 
            
    };

	/**
	 * An enumeration that defines the output when more than one rule in the decision table is matched for a given set of inputs.
	 *
	 * @enum {string}
	 * @public 
	 */
	sap.rules.ui.RuleHitPolicy = {
		/**
		 * Specifies that only the first condition that matches the input (the first matching row by order in the decision table) is returned as an output.
		 * @public
		 */
		FirstMatch: "FM",
		/**
		 * Specifies that all conditions that match the input (each matching row in the decision table) are returned as an output.
		 * @public
		 */
		AllMatch: "AM"
	};

	sap.rules.ui.ValidationStatus = {
		Success: "Success",
		Error: "Error"
	};
	sap.rules.ui.ExpressionTokenType = {
		alias: "alias",
		parameter: "parameter",
		reservedWord: "reservedword",
		vocabulary: "vocabulary",
		constant: "constant",
		whitespace: "whitespace",
		valueList: "valueList",
		unknown: "unknown"
	};
	sap.rules.ui.ExpressionCategory = {
		fixed: "fixed",
		dynamic: "dynamic",
		value: "value",
		conjunctionOp: "conjunctionOp",
		comparisonOp: "comparisonOp",
		comparisonBetweenOp: "comparisonBetweenOp",
		comparisonExistOp: "comparisonExistOp",
		UOM: "UOM",
		func: "function",
		funcAdvances: "functionAdvanced",
		arithmeticOp: "arithmeticOp",
		filterOp: "filterOp",
		selectionOp: "selectionOp",
		groupOp: "groupOp",
		sortingOp: "sortingOp",
		structuredCond: "structuredCond",
		unknown: "unknown"
	};
	
	/**
	 * An enumeration that defines the different basic suggestions parts
	 * 
	 * @enum {string}
	 * @private
	 */
	sap.rules.ui.SuggestionsPart = {
		all: "all",
		leftPart: "leftPart",
		compPart: "compPart",
		rightPart: "rightPart"
	};
	
	/**
	 * An enumeration that defines the different business data types for an expression
	 *
	 * @enum {string}
	 * @public
	 */
	sap.rules.ui.ExpressionType = {
		/**
		* Specifies that the expression can be of any of the supported business data types.
		* @public
		*/
		All: "All",
		/**
		* Specifies that the expression must represent a real number with or without dot-decimal notation.
		* @public
		*/
		Number: "Number",
		/**
		* Specifies that the expression must represent a date and timestamp.
		* @public
		*/
		Timestamp: "Timestamp",
		/**
		* Specifies that the expression must represent a Boolean data type: true, false.
		* @public
		*/
		Boolean: "Boolean",
		/**
		* Specifies that the expression must represent a time difference in milliseconds.
		* @public
		*/
		TimeSpan: "TimeSpan",
		/**
		* Specifies that the expression must represent a date only.
		* @public
		*/
		Date: "Date",
		/**
		* Specifies that the expression must represent a time only.
		* @public
		*/
		Time: "Time",
		/**
		* Specifies that the expression must represent a single-quoted UTF-8 encoded string. 
		* @public
		*/
		String: "String",
		/**
		* Internal usage - enables validation of header expressions in the DT header.
		* @private
		*/
		NonComparison : "NonComparison",
		/**
		* Internal usage - enables Boolean expressions in the DT header for S/4HANA scenario (example: age of the player > 0 is equal to true).
		* @private
		*/
		BooleanEnhanced:"BooleanEnhanced"
	};

	sap.rules.ui.BackendParserRequest = {
		Validate: "validate",
		Suggests: "autocomplete",
		GetMetadata: "tokens"
	};

	return sap.rules.ui;
});