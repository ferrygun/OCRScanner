/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	"./library",
	'sap/ui/mdc/base/ValueHelpDialog',
	"sap/ui/model/json/JSONModel"
], function( Library, baseValueHelpDialog, JSONModel) {
	"use strict";

	var ValueHelpDialog = baseValueHelpDialog.extend("sap.ui.mdc.ValueHelpDialog", {
		metadata: {
			properties: {
				entitySet : "string",
				// we might rename this to propertyPath
				fieldPath : "string"
			},
			aggregations: {
			},
			events: {},
			publicMethods: []
		},
		// why is this not extended and we need to mention it here as well?
		fragment: "sap.ui.mdc.base.ValueHelpDialog"
	});


	ValueHelpDialog.prototype.init = function() {
		this.attachModelContextChange(fnCreateValueHelpContent);
	};

	var fnCreateValueHelpContent = function(){
		var that = this;
		this.detachModelContextChange(fnCreateValueHelpContent);

		this._requestValueListMetadata(this.getEntitySet(), this.getFieldPath()).then(function(mValueListInfo) {
			var oValueListModel = new JSONModel(mValueListInfo);

			var oValueHelpDialogContent = sap.ui.view({
				viewName: "sap.ui.mdc.internal.valuehelp.ValueHelp",
				type: "XML",
				height: "100%",
				async: true,
				preprocessors: {
					xml: {
						bindingContexts: {
							valueList: oValueListModel.createBindingContext("/")
						},
						models: {
							valueList: oValueListModel
						}
					}
				}
			});

			// var oOperatorConfig = oFilterField.getFilterOperatorConfig();
			// var aOperators = oOperatorConfig.getOperatorsForType(oFilterField.getDataType());
			// var aOperatorsData = [];
			// aOperators.forEach(function(element) {
			// 	var oOperator = oOperatorConfig.getOperator(element);
			// 	if (oOperator.showInSuggest !== undefined && oOperator.showInSuggest === false) {
			// 		return;
			// 	}
			// 	var sTxtKey = oOperator.textKey || "operators." + oOperator.name + ".longText";
			// 	var sText = oOperator.getTypeText(sTxtKey, oFilterField._getDataType().getName().toLowerCase());
			// 	if (sText === sTxtKey) {
			// 		sText = oOperator.longText;
			// 	}
			// 	aOperatorsData.push({
			// 		key: element,
			// 		additionalText: sText
			// 	});
			// }, this);

			// var oOperatorModel = new sap.ui.model.json.JSONModel();
			// oOperatorModel.setData(aOperatorsData);

			var oConditionModel = that.getConditionModel();
			var oConditionModelClone = oConditionModel.clone(that.getFieldPath());

			oValueHelpDialogContent.setModel(oConditionModelClone, "cm"); // all other CM will be set as model on the view?
			oValueHelpDialogContent.setBindingContext(oConditionModelClone.createBindingContext("/"), "cm");
			//oValueHelpDialogContent.setModel(oOperatorModel,"om");
			//oValueHelpDialogContent.setBindingContext(oOperatorModel.createBindingContext("/"),"om");
			oValueHelpDialogContent.setModel(oValueListModel, "valueList");
			oValueHelpDialogContent.setModel(mValueListInfo.$model);

			return oValueHelpDialogContent.loaded().then(function(oValueHelpDialogContent) {
				that.setTitle(oValueHelpDialogContent.getModel("valueList").getProperty("/sTitle"));

				// keep it for now but looks very strange
				oValueHelpDialogContent.getController().sFieldPath = that.getFieldPath();

				var oTable = oValueHelpDialogContent.byId("valueListTable");
				var nColumns = oTable.getColumns().length;
				var nWidth = Math.max(1080, nColumns * 130);
				that.get_content().setContentWidth(nWidth + "px");
				that.addContent(oValueHelpDialogContent);
				//return Promise.resolve(oValueHelpDialog);
			});
		});
	};

	// this is duplicated from the FilterField - to be refactored into an Util class
	ValueHelpDialog.prototype._requestValueListMetadata = function(sEntitySet, sFieldPath) {
		var oMetaModel = this.getModel().getMetaModel();

		return oMetaModel.requestValueListInfo('/' + sEntitySet + '/' + sFieldPath).then(function(mValueListInfo) {
			var mParameters;

			if (mValueListInfo[""]) {
				// determine key and description path and store it in the value list info
				mParameters = mValueListInfo[""].Parameters;
				var sLocalDataProperty = oMetaModel.getObject('/' + sEntitySet + '/' + sFieldPath + "@sapui.name");


				// TODO: don't know why this is added here and not in the template to be discussed
				var aFilterExpressionRestrictions = oMetaModel.getObject("/" + sEntitySet + "@com.sap.vocabularies.Common.v1.FilterExpressionRestrictions");
				var oFilterExpressionRestriction = aFilterExpressionRestrictions && aFilterExpressionRestrictions.filter(function(filterExpressionRestriction) {
						return filterExpressionRestriction.Property.$PropertyPath === sFieldPath;
					});

				//Getting Label for the dialog
				mValueListInfo[""].sTitle = oMetaModel.getObject("/" + sEntitySet + "/$Type/" + sFieldPath + "@com.sap.vocabularies.Common.v1.Label");
				if (oFilterExpressionRestriction && (oFilterExpressionRestriction.length > 0) && (oFilterExpressionRestriction[0].AllowedExpressions.$EnumMember.indexOf("SingleValue") > -1)) {
					mValueListInfo[""].sSelectionMode = "SingleSelectLeft";
					mValueListInfo[""].sTitle = Library.getText("valuehelp.SINGLE_ITEM_SELECT") + mValueListInfo[""].sTitle;
				} else {
					mValueListInfo[""].sSelectionMode = "MultiSelect";
				}

				// determine the key and the description path
				for (var i = 0; i < mParameters.length; i++) {
					if (mParameters[i].LocalDataProperty && mParameters[i].LocalDataProperty.$PropertyPath === sLocalDataProperty) {
						// we store this information into the value list info - we will set this information to the filter field in the future
						mValueListInfo[""].__sapfe = {
							keyPath: mParameters[i].ValueListProperty,
							descriptionPath: mValueListInfo[""].$model.getMetaModel().getObject("/" + mValueListInfo[""].CollectionPath + "/" + mParameters[i].ValueListProperty + "@com.sap.vocabularies.Common.v1.Text/$Path")
						};

						// there should be always only one parameter with the property field path as output
						break;
					}
				}

				return mValueListInfo[""];
			} else {
				throw ("no unqualified value list found - currently qualified value lists are not considered");
			}

		}, function(oError) {
			throw (oError.message);
		});
	};

	return ValueHelpDialog;

}, /* bExport= */ true);
