/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	"sap/ui/mdc/library"
], function (Library) {
	"use strict";
	/*
	 This class contains annotation helpers that are needed for the sap.fe.controls._Table.
	 */
	jQuery.sap.declare("sap.ui.mdc.internal.valuehelp.ValueHelpAnnotationHelper");

	sap.ui.mdc.internal.valuehelp.ValueHelpAnnotationHelper = {

		// TODO: the same one exist also in the FilterField as it is needed from the suggest list - merge them
		getCollectionEntitySet: function (oValueListContext) {
			var mValueList = oValueListContext.getObject();
			return mValueList.$model.getMetaModel().createBindingContext("/" + mValueList.CollectionPath);
		},

		getValueListProperty: function (oPropertyContext) {
			var oValueListModel = oPropertyContext.getModel();
			var mValueList = oValueListModel.getObject("/");
			return mValueList.$model.getMetaModel().createBindingContext('/' + mValueList.CollectionPath + '/' + oPropertyContext.getObject());
		},
		formatIconTabFilterText : function(sIconTabFilterText, oCM) {
			return Library.getText(sIconTabFilterText);
			// if (oCM && oCM.conditions && oCM.conditions.length !== 0){
			// 	return oResourceBundle.getText(sSelectFromList, [oCM.conditions.length]);
			// } else {
			// 	return oResourceBundle.getText(sSelectFromList, [0]);
			// }
		},
		formatSelectedItemTitle : function(sSelectedItem, oCM) {

			if (oCM && oCM.conditions && oCM.conditions.length !== 0){
				var aConditions = oCM.conditions.filter(function(oCondition) {
					return oCondition.isEmpty !== true;
				});

				return Library.getText(sSelectedItem, [aConditions.length]);
			} else {
				return Library.getText(sSelectedItem, [0]);
			}
		},
		formatedTokenText : function(oFilterFieldType,oCondition) {
			var sResult = "";
			if (oCondition) {
				var oCM = this.getModel("cm");
				var oOperator = oCM.getFilterOperatorConfig().getOperator(oCondition.operator);
				sResult = oOperator.format(oCondition.values, oCondition, oFilterFieldType);
			}
			return sResult;
		}
	};
});
