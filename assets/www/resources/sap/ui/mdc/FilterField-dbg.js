/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	"./library",
	'sap/ui/mdc/XMLComposite',
	"sap/ui/mdc/base/ODataSuggestProvider",
	"sap/ui/mdc/base/OperatorSuggestProvider",
	"sap/ui/mdc/base/FixedValueListProvider",
	"sap/ui/model/json/JSONModel",
	"sap/ui/mdc/ValueHelpDialog",
	"sap/ui/mdc/internal/common/Helper",
	'sap/ui/model/odata/v4/AnnotationHelper'
], function(Library, XMLComposite, ODataSuggestProvider, OperatorSuggestProvider, FixedValueListProvider, JSONModel, ValueHelpDialog, CommonHelper) {
	"use strict";
	var FilterField = XMLComposite.extend("sap.ui.mdc.FilterField", {
		metadata: {
			designTime: false,
			specialSettings: {
				metadataContexts: {
					defaultValue: "{ model: 'entitySet', path:'',  name: 'entitySet'}, { model: 'property', path:'',  name: 'property'}"
				}
			},
			properties: {
				conditionModelName: {
					type: "string",
					defaultValue: "sap.fe.cm",
					invalidate: false
				}
			},
			events: {

			},
			aggregations: {},
			publicMethods: []
		},
		fragment: "sap.ui.mdc.internal.filterfield.FilterField"
	});

	FilterField.prototype.getInnerFilterField = function() {
		return this.get_content().getItems()[1];
	};

	FilterField.prototype.init = function () {
		XMLComposite.prototype.init.call(this);

		var oInnerFilterField = this.getInnerFilterField();
		var bSuggest = oInnerFilterField.getCustomData()[1].getValue() === 'true',
			bFixedValues = oInnerFilterField.getCustomData()[2].getValue() === 'true';

		if (bSuggest) {
			new ODataSuggestProvider({
				control: oInnerFilterField,
				enableFilterSuggest: false,
				suggest: this.handleSuggest.bind(this)
			});

		} else if (bFixedValues) {
			new FixedValueListProvider({
				control: oInnerFilterField,
				enableFilterSuggest: true,
				suggest: this.handleSuggest.bind(this)
			});

			/* according to UX we disable the Operator Suggest Provider for the first delivery */
			//} else {
			//	new OperatorSuggestProvider({control: oFilterField});
		}
	};

	FilterField.prototype.handleSuggest = function(oProvider, oEvent) {
		/* currently the inner field fires the event - this might change in the future once we agree on a final
		 API in the MDC Filter Field - then we night to change this coding
		 TODO: to be discussed if we access the input field via oInnerFilterField.get_input()
		 */
		var oInnerFilterField = this.getInnerFilterField();
		var oFilterField = this;
		var oInputField = oEvent.getSource();

		// FIXME: getting those information via metadataContext does currently not work but Silke works on it
		var sEntitySet = oInnerFilterField.data("entitySetName");

		var oMetaModel = oFilterField.getModel().getMetaModel();
		var oSearchRestrictions, mBindingParameters = {};

		// temp solution - we will get rid of custom data in the next release
		var bFixedValues = oInnerFilterField.getCustomData()[2].getValue() === 'true';

		if (!bFixedValues) {
			oSearchRestrictions = oMetaModel.getObject("/" + sEntitySet + "@Org.OData.Capabilities.V1.SearchRestrictions");
			if (!oSearchRestrictions || oSearchRestrictions.Searchable || oSearchRestrictions.Searchable === undefined) {
				// the entity set is searchable - we can use $search
				mBindingParameters = {
					$search: oEvent.getParameters().suggestValue
				};
			} else {
				// Suggest Lists entity sets without $search support is not yet supported
				return;
			}
		}

		if (this.bSuggestionViewCreated) {
			if (!bFixedValues) {
				var oSuggestListBinding = oInputField.getBinding("suggestionRows");
				if (oSuggestListBinding) {
					oSuggestListBinding.changeParameters(mBindingParameters);
				}
			}
		} else {
			this.bSuggestionViewCreated = true; // FIXMe: it's a little bit more complex as user might type fast
			this._requestValueListMetadata().then(function(mValueListInfo) {
				mValueListInfo.SuggestBindingParameters = JSON.stringify(mBindingParameters);

				var oValueListModel = new JSONModel(mValueListInfo);
				var oSuggestionListView = sap.ui.view({
					viewName: "sap.ui.mdc.internal.filterfield.SuggestionList",
					type: "XML",
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

				oSuggestionListView.setModel(mValueListInfo.$model);

				return oSuggestionListView.loaded().then(function() {
					oProvider.setTable(oSuggestionListView.getContent()[0]);
					if (mValueListInfo.__sapfe) {
						if (mValueListInfo.__sapfe.keyPath) {
							oProvider.setKeyPath(mValueListInfo.__sapfe.keyPath);
						}
						if (mValueListInfo.__sapfe.descriptionPath) {
							oProvider.setDescriptionPath(mValueListInfo.__sapfe.descriptionPath);
						}
					}
				});
			});
		}
	};

	FilterField.prototype.handleValueHelpRequest = function() {
		// FIXME: get those properties via metadata context
		var oInnerFilterField = this.getInnerFilterField();
		var sEntitySet = oInnerFilterField.data("entitySetName");
		var sFieldPath = oInnerFilterField.getFieldPath().replace(/\*/g, '');

		// for now create always a new instance but couldn't we reuse the instance?
		var oValueHelpDialog = new ValueHelpDialog({
			entitySet : sEntitySet,
			fieldPath : sFieldPath
		});
		// why couldn't we add the condition model to the constructor?
		oValueHelpDialog.setConditionModel(this.getModel(this.getConditionModelName()));

		this.addDependent(oValueHelpDialog);
		oValueHelpDialog.open();
	};

	FilterField.prototype._requestValueListMetadata = function() {
		var oFilterField = this;
		var oInnerFilterField = this.getInnerFilterField();
		// FIXME: getting those information via metadataContext does currently not work but Silke works on it
		var sEntitySet = oInnerFilterField.data("entitySetName");
		var sFieldPath = oInnerFilterField.getFieldPath().replace(/\*/g, '');

		return this.getModel().getMetaModel().requestValueListInfo('/' + sEntitySet + '/' + sFieldPath).then(function(mValueListInfo) {
			var mParameters;

			if (mValueListInfo[""]) {
				// determine key and description path and store it in the value list info
				mParameters = mValueListInfo[""].Parameters;
				var oMetaModel = oFilterField.getModel().getMetaModel();
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

	// STATIC HELPER FOR CONTROL TEMPLATE//
	FilterField._helper = {
		getFieldPath: function(oInterface, sEntitySet, sFieldPath) {
			var oMetaModel, aSections, oProperty, bToAnyFound;
			oMetaModel = oInterface.getInterface(0).getModel();

			if (typeof sFieldPath !== "string") {
				sFieldPath = oMetaModel.getObject(oInterface.getInterface(1).getPath() + "@sapui.name");
			}

			if (sFieldPath.indexOf('/') > -1) {

				aSections = sFieldPath.split('/');
				for (var i = 0; i < (aSections.length - 1); i++) {
					oProperty = oMetaModel.getObject("/" + sEntitySet + "/" + aSections.slice(0, (i + 1)).join('/'));

					if (oProperty && oProperty["$kind"] === "NavigationProperty" && oProperty["$isCollection"]) {
						aSections[i] = aSections[i] + '*';
						bToAnyFound = true;
					}
				}
				if (bToAnyFound) {
					sFieldPath = aSections.join('/');
				}
			}

			return sFieldPath;
		},

		getValueStatePath: function(oInterface, sEntitySet, sFieldPath) {
			var _sFieldPath = FilterField._helper.getFieldPath(oInterface, sEntitySet, sFieldPath);
			// TODO check condition model name
			return "{sap.fe.cm>/fieldPath/" + _sFieldPath + "/valueState}";
		},

		getValueStateTextPath: function(oInterface, sEntitySet, sFieldPath) {
			var _sFieldPath = FilterField._helper.getFieldPath(oInterface, sEntitySet, sFieldPath);
			// TODO check condition model name
			return "{sap.fe.cm>/fieldPath/" + _sFieldPath + "/valueStateText}";
		},

		isRequiredInFilter: function(path, oDetails) {
			var sEntitySetPath,
				sProperty,
				bIsRequired = false,
				oFilterRestrictions,
				oModel = oDetails.context.getModel(),
				sPropertyPath = oDetails.context.getPath();

			sEntitySetPath = CommonHelper._getEntitySetPath(oModel, sPropertyPath);
			if (typeof path === "string") {
				sProperty = path;
			} else {
				sProperty = oModel.getObject(sPropertyPath + "@sapui.name");
			}
			oFilterRestrictions = oModel.getObject(sEntitySetPath + "@Org.OData.Capabilities.V1.FilterRestrictions");
			if (oFilterRestrictions && oFilterRestrictions.RequiredProperties) {
				bIsRequired = oFilterRestrictions.RequiredProperties.some(function(property) {
					return property.$PropertyPath === sProperty;
				});
			}
			return bIsRequired;
		},

		typeFormatOptions: function(path, oDetails) {
			var oFormatOptions = "{",
				iScale,
				oModel = oDetails.context.getModel(),
				sPropertyPath = oDetails.context.getPath(),
				sType = oModel.getObject(sPropertyPath + "/$Type"),
				oTextAnnotation, oTextArrangement;

			if (sType === "Edm.Date" || sType === "Edm.DateTimeOffset" || sType === "Edm.TimeOfDay") {
				// for date and time types use the short style
				oFormatOptions += "style: 'medium'";
			} else if (sType === "Edm.Decimal") {
				// for decimal type use the scale attribute of the property (metadata)
				iScale = oModel.getObject(sPropertyPath + "/$Scale") || 0;
				switch (iScale) {
					case "floating":
						oFormatOptions += "decimals: " + (oModel.getObject(sPropertyPath + "/$Precision") || 0);
						break;
					case "variable":
						break;
					default:
						oFormatOptions += "decimals: " + iScale;
				}
			}
			oTextAnnotation = oModel.getObject(sPropertyPath + "@com.sap.vocabularies.Common.v1.Text");
			if (oTextAnnotation) {
				oTextArrangement = oModel.getObject(sPropertyPath + "@com.sap.vocabularies.Common.v1.Text@com.sap.vocabularies.UI.v1.TextArrangement");
				if (oFormatOptions.length > 1) {
					oFormatOptions += ", ";
				}
				if (oTextArrangement && oTextArrangement.$EnumMember) {
					switch (oTextArrangement.$EnumMember) {
						case "com.sap.vocabularies.UI.v1.TextArrangementType/TextLast":
							oFormatOptions += "displayFormat: 'ValueDescription'";
							break;
						case "com.sap.vocabularies.UI.v1.TextArrangementType/TextOnly":
							oFormatOptions += "displayFormat: 'Description'";
							break;
						case "com.sap.vocabularies.UI.v1.TextArrangementType/TextSeparate":
							oFormatOptions += "displayFormat: 'Value'";
							break;
						default:
							oFormatOptions += "displayFormat: 'DescriptionValue'";
					}
				} else {
					oFormatOptions += "displayFormat: 'DescriptionValue'";
				}
			}
			return oFormatOptions + "}";
		},

		typeConstraints: function(path, oDetails) {
			var oConstraints = "{",
				iScale, iMaxLength,
				oModel = oDetails.context.getModel(),
				sPropertyPath = oDetails.context.getPath(),
				sType = oModel.getObject(sPropertyPath + "/$Type");

			if (sType === "Edm.Decimal") {
				// for decimal type use the scale attribute of the property (metadata)
				iScale = oModel.getObject(sPropertyPath + "/$Scale") || 0;
				switch (iScale) {
					case "floating":
						oConstraints += "decimals: " + (oModel.getObject(sPropertyPath + "/$Precision") || 0);
						break;
					case "variable":
						break;
					default:
						oConstraints += "decimals: " + iScale;
				}
			} else if (sType === "Edm.String") {
				iMaxLength = oModel.getObject(sPropertyPath + "/$MaxLength");
				if (iMaxLength) {
					oConstraints += "maxLength: " + iMaxLength;
				}
				if (oModel.getObject(sPropertyPath + "@com.sap.vocabularies.Common.v1.IsUpperCase")) {
					if (oConstraints.length > 1) {
						oConstraints += ", ";
					}
					oConstraints += "toUpperCase: true";
				}

			}
			return oConstraints + "}";
		},

		getValueListCollectionEntitySet: function(oValueListContext) {
			var mValueList = oValueListContext.getObject();
			return mValueList.$model.getMetaModel().createBindingContext("/" + mValueList.CollectionPath);
		},

		getValueListProperty: function(oPropertyContext) {
			var oValueListModel = oPropertyContext.getModel();
			var mValueList = oValueListModel.getObject("/");
			return mValueList.$model.getMetaModel().createBindingContext('/' + mValueList.CollectionPath + '/' + oPropertyContext.getObject());
		}
	};

	FilterField._helper.getFieldPath.requiresIContext = true;
	FilterField._helper.getValueStatePath.requiresIContext = true;
	FilterField._helper.getValueStateTextPath.requiresIContext = true;

	return FilterField;

}, /* bExport= */ true);
