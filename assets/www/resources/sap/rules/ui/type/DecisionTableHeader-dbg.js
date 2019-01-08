/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2016 SAP SE. All rights reserved
	
 */

// Provides control sap.rules.ui.
sap.ui.define(["jquery.sap.global"
], function(jQuery) {
	"use strict";


	var DecisionTableHeader = sap.rules.ui.type.ExpressionAbs.extend("sap.rules.ui.type.DecisionTableHeader", {
            /**
			 * format decision table header value to display value and concatinate with fixed operator
			 * @param {string[]} aHeader - Decision Table header information [Expression, FixedOperator]
			 * @returns {string} Concatination of Decision Table header expression & fixed operator in display mode
			 * @private
			*/
            formatValue: function (aHeader) {
				
				if (!this.expressionLanguage) {
					return aHeader.join(" ");	
				}
				
				var sHeaderExpression = "";

				if (aHeader[0]){
					var result = this.expressionLanguage.convertDecisionTableExpressionToDisplayValue(aHeader[0]);
					
					if (result.output.converted){
						var convertedResult = result.output.converted;
						sHeaderExpression = convertedResult.header;
					} else if (aHeader[0]){
						sHeaderExpression = aHeader[0];
					}
				}
				
				return sHeaderExpression + ' ' + aHeader[1];
            }
        });

	return DecisionTableHeader;

}, /* bExport= */ true);


//