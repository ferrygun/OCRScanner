/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2016 SAP SE. All rights reserved
	
 */

// Provides control sap.rules.ui.
sap.ui.define(["jquery.sap.global"], function(jQuery) {
	"use strict";

	var DecisionTableCell = sap.rules.ui.type.ExpressionAbs.extend("sap.rules.ui.type.DecisionTableCell", {

		/**
		 * format decision table cell value to display value
		 * @param {string[]} aCellValues - Decision Table cell information [sHeaderExpression, sFixedOperator, sCellContent, sConvertedCellContent]
		 * sConvertedCellContent is the value from the JSON model - where all the values have already been converted
		 * @returns {string} Decision Table cell expression display value (fallback, for failed conversion, return code value)
		 */
		formatValue: function(aCellValues) {
			var sCellContent, sConvertedCellContent;
			//var sHeader, sExpressionType, sFixedOperator;

			if (aCellValues.length === 3) {
				sCellContent = aCellValues[0];
				//sExpressionType = aCellValues[1];
				sConvertedCellContent = aCellValues[2];
			} else {
				//sHeader = aCellValues[0];
				//sFixedOperator = aCellValues[1];
				sCellContent = aCellValues[2];
				sConvertedCellContent = aCellValues[3];
				//sExpressionType = aCellValues[3];
			}

			if (!this.expressionLanguage) {
				return sCellContent;
			}

			// convert cell content
			// if (sCellContent){
			// 	var result = this.expressionLanguage.convertDecisionTableExpressionToDisplayValue(sHeader, sFixedOperator, sCellContent, sExpressionType);
			// 	if (result.output.status == "Success"){
			// 		sCellContent = result.output.converted.cell;
			// 	}
			// }
			return sConvertedCellContent;
		},

		/**
		 * parse decision table cell value to code value
		 * @param {string} sCellExpressionDisplay - Decision Table cell expression display value
		 * @param {string} sType - Decision Table cell expression type
		 * @param {string[]} aCellValues - Decision Table cell information [sHeaderExpression, sFixedOperator, sCellContent, sConvertedCellContent]
		 * @returns {string[]} updated decision Table cell information [sHeaderExpression, sFixedOperator, sCellContent, sConvertedCellContent]
		 */
		parseValue: function(sCellExpressionDisplay, sType, aCellValues) {
			var sCellExpression;
			var convertResult;
			var cellTypeIsResult = aCellValues.length === 3;
			if (!this.expressionLanguage || !sCellExpressionDisplay) {
				sCellExpression = sCellExpressionDisplay;
			} else if (cellTypeIsResult) {
				convertResult = this.expressionLanguage.convertDecisionTableExpressionToModelValue(sCellExpressionDisplay, "", "", aCellValues[1], this.sExpressionLanguageVersion);
				sCellExpression = convertResult.output.status === "Success" ? convertResult.output.converted.header : sCellExpressionDisplay;
			} else {
				convertResult = this.expressionLanguage.convertDecisionTableExpressionToModelValue(aCellValues[0], aCellValues[1],
					sCellExpressionDisplay, "", this.sExpressionLanguageVersion);
				sCellExpression = convertResult.output.status === "Success" ? convertResult.output.converted.cell : sCellExpressionDisplay;
			}

			if (cellTypeIsResult) {
				aCellValues[0] = sCellExpression;
				aCellValues[2] = sCellExpressionDisplay;
			} else {
				aCellValues[2] = sCellExpression;
				aCellValues[3] = sCellExpressionDisplay;
			}
			return aCellValues;
		}
	});

	return DecisionTableCell;

}, /* bExport= */ true);