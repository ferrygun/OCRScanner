/**
* File for mapping operation code to operator
*/
sap.ui.define(function() {
  "use strict";
  jQuery.sap.declare("sap.suite.ui.generic.template.AnalyticalListPage.util.OperationCode");
  //default position of the operator is left
  sap.suite.ui.generic.template.AnalyticalListPage.util.OperationCode = {
    "EQ": {
      "code": "="
    },
    "GT": {
      "code": ">"
    },
    "GE": {
      "code": ">="
    },
    "LT": {
      "code": "<"
    },
    "LE": {
      "code": "<="
    },
    "NE": {
      "code": "!"
    },
    "BT": {
      "code": "...",
      "position": "mid"
    },
    "EndsWith": {
      "code": "*"
    },
    "StartsWith": {
      "code": "*",
      "position": "last"
    },
    "Contains": {
      "code": "*",
      "position": "mid"
    }
  };
  return sap.suite.ui.generic.template.AnalyticalListPage.util.OperationCode;
}, true);
