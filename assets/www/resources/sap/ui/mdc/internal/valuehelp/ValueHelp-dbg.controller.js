/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/mdc/base/ConditionModel",
	"sap/ui/mdc/base/ODataSuggestProvider",
	"sap/ui/mdc/base/OperatorSuggestProvider",
	"sap/m/SearchField",
	"sap/ui/model/json/JSONModel"
], function (Controller, ConditionModel, ODataSuggestProvider, OperatorSuggestProvider, SearchField, JSONModel) {
	"use strict";

	return Controller.extend("sap.ui.mdc.internal.valuehelp.ValueHelp", {

		handleSearch: function (oEvent) {
			var oValueListTable = this.getView().byId("valueListTable");
			var sSearchQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue");

			oValueListTable.getBinding("items").changeParameters({
				$search: sSearchQuery || undefined
			});
		},

		onInit: function () {
			var oFilterLayoutFlag = new JSONModel({
				visible: "HideMode",
				listView: false,
				tableView: true,
				sSelectedRowCount: 0,
				sSearchFieldValue: ""
			});
			this.oValueListTable = this.getView().byId("valueListTable");

			var oListBinding = this.oValueListTable.getBinding("items");
			this.oValueListTableConditionModel = ConditionModel.getFor(oListBinding);
			var oTableConditionChangeBinding = this.oValueListTableConditionModel.bindProperty("/", this.oValueListTableConditionModel.getContext("/"));
			oTableConditionChangeBinding.attachChange(this.handleTableChange.bind(this));

			// change handler on list binding to remember the table tab selections and mark the selected items
			oListBinding.attachChange(this.updateTableSelections.bind(this));

			this.getView().setModel(this.oValueListTableConditionModel, "vltcm");
			this.getView().setModel(oFilterLayoutFlag, "FilterLayoutFlag");
			if (!this.oConditionModel) {
				this.oConditionModel = this.oView.getModel("cm");
				var oConditionChangeBinding = this.oConditionModel.bindProperty("/", this.oConditionModel.getContext("/"));
				oConditionChangeBinding.attachChange(function(oEvent) {
					this.updateTableSelections();

					// check if that least one dummy condition exist for the define conditions tab
//					this.updateDefineConditions();
				}.bind(this));
			}
			var oSearchField = this.getView().byId("template::ValueHelpTableSearchField");
			oSearchField.attachBrowserEvent("focusout", function (oEvent) {
				oSearchField.fireSearch({
					query: oSearchField.getValue(),
					id: oSearchField.getId()
				});
			});
		},
		onBeforeRendering: function() {
		},
		onAfterRendering : function(){
			//this.updateTableSelections();
		},

		handleFilter: function () {
			var oSplitApp = this.getView().byId("SplitCont");
			if (oSplitApp.getMode() === "HideMode") {
				oSplitApp.setMode("ShowHideMode");
				this.getView().getModel("FilterLayoutFlag").setProperty("/visible", "ShowHideMode");
			} else {
				oSplitApp.setMode("HideMode");
				this.getView().getModel("FilterLayoutFlag").setProperty("/visible", "HideMode");
			}
		},

		handleTableChange: function () {
			this.oValueListTableConditionModel.applyFilters();
		},

		handleConditionButtonVisibility : function() {
			var oGrid = this.getView().byId("template::DefineConditions");
			var oConditionModel = this.getView().getModel("cm");
			var sLen = oConditionModel.getConditions().length;

			var aOperatorTabItems = [];
			for (var i = 0; i < sLen; i++) {
				//filter values of select with operator tab and stores it in a array
				if ( oConditionModel.getConditions()[i].operator !== "EEQ") {
					aOperatorTabItems.push(oConditionModel.getConditions()[i]);
				}
			}
			if (aOperatorTabItems.length === 0) {
				//Adds one new empty condition into the condition model when there is no value in define condition tab
				//This will work in case of Reset
				oConditionModel.addCondition(oConditionModel.createCondition(this.getView().getController().fieldPath, "EQ", []));
			} else {
				//setting the visibility of add/remove button on change of length of condition model
				var content = oGrid.getContent();
				content[content.length - 1].getContent()[4].getContent()[1].setVisible(true);
			}
		},
		onResetValueHelp: function (oControlEvent, oModel){
			var oView = this.getView();
			oView.setModel(oModel, "cm");
		},
		handleToggleButton: function (oEvent) {
			var sId = oEvent.getSource().getId();
			if (sId.indexOf("template::ListView") !== -1) {
				this.getView().getModel("FilterLayoutFlag").setProperty("/listView", true);
				this.getView().getModel("FilterLayoutFlag").setProperty("/tableView", false);
			} else if (sId.indexOf("template::TableView") !== -1) {
				this.getView().getModel("FilterLayoutFlag").setProperty("/tableView", true);
				this.getView().getModel("FilterLayoutFlag").setProperty("/listView", false);
			}
		},

        showSelected: function (oEvent) {
            var oTable;
            oTable = this.getView().byId("valueListTable");
            // keep the original binding info and list binding to reset to show all items
            if (!this.oTableBindingInfo) {
                this.oTableBindingInfo = oTable.getBindingInfo("items");
            }
            if (oEvent.getParameter("pressed") === true) {
                // show selected items only
                /**
                 * Currently we have two options to get the filters from -
                 * 1. conditions
                 * 2. selected items
                 */
                var oFilteredBindingInfo = jQuery.sap.extend({}, oTable.getBindingInfo("items"), {filters : this.getFiltersFromConditions()});
                oTable.bindItems(oFilteredBindingInfo);

            } else {
                // show all items
                oTable.bindItems(this.oTableBindingInfo);
            }
            // attach change handler for new listBinding
            // change handler on list binding to remember the table tab selections and mark the selected items
            oTable.getBinding("items").attachChange(this.updateTableSelections.bind(this));
        },

        getFiltersFromConditions: function () {
            var oConditionModel, aConditions, aFilters, aConditionsForTableTab, oValueListModel, sCollectionPath, oMetaModel, aKeys, sKey, aIntermediateFilterArray;

            oConditionModel = this.getView().getModel("cm");
            aConditions = oConditionModel.getConditions();
            aFilters = [];
			aIntermediateFilterArray = [];
            aConditionsForTableTab = aConditions.filter(function (oCondition) {
                return oCondition.operator === "EEQ";
            });
            oValueListModel = this.getView().getModel("valueList");
            sCollectionPath = oValueListModel.getProperty("/CollectionPath");
            oMetaModel = oValueListModel.getProperty('/$model').getMetaModel();
            aKeys = oMetaModel.getObject('/' + sCollectionPath + '/').$Key;
            sKey = aKeys[0];
			var canonicalPathArray = [];
			var aSplitValueKey = [];
			var aValueKey = [];
			for (var i = 0;i < aConditionsForTableTab.length;i++){
				canonicalPathArray[i] = aConditionsForTableTab[i].values[2];
			}
			for (var j = 0;j < canonicalPathArray.length;j++){
				//aValueKey[j] = canonicalPathArray[j].slice(canonicalPathArray[j].indexOf("(") + 1,canonicalPathArray[j].indexOf(")"));
				aValueKey[j] = canonicalPathArray[j].split(/\((.*?)\)/)[1];
			}

			aValueKey.forEach(function(item,index){
				aSplitValueKey = aValueKey[index].split(',');
				aFilters = [];
				if (aSplitValueKey.length === 1) {
					aFilters.push(new sap.ui.model.Filter({
						path: sKey,
						operator: sap.ui.model.FilterOperator.EQ,
						value1: aConditionsForTableTab[index].values[0]
					}));
					aIntermediateFilterArray.push(new sap.ui.model.Filter({
						filters : aFilters,
						and : false
					}));
				} else {
					for (var l = 0;l < aSplitValueKey.length;l++){
						aFilters.push(new sap.ui.model.Filter({
							path : aSplitValueKey[l].substr(0,aSplitValueKey[l].indexOf('=')),
							operator : sap.ui.model.FilterOperator.EQ,
							value1 : aSplitValueKey[l].indexOf("'") === -1 ? aSplitValueKey[l].slice(aSplitValueKey[l].indexOf("=") + 1, aSplitValueKey[l].length) : aSplitValueKey[l].slice(aSplitValueKey[l].indexOf("'") + 1, -1)
							//value1 : aSplitValueKey[l].slice(aSplitValueKey[l].indexOf("'") === -1 ? aSplitValueKey[l].indexOf("=") + 1 : aSplitValueKey[l].indexOf("'")  + 1,-1)
						}));
					}
					aIntermediateFilterArray.push(new sap.ui.model.Filter({
						filters : aFilters,
						and : true
					}));
				}

			});
            // filter for each condition of table tab applied by logical OR
            return new sap.ui.model.Filter({
                filters: aIntermediateFilterArray,
                and: false
            });
        },

		onChange: function(){
			var oConditionModel = this.oView.getModel("cm");
			oConditionModel._checkIsEmpty();
			oConditionModel._updateValues();
			//TODO why is refresh and checkUpdate required? Is this correct or do we have a better way to update the Tokenizer with the filter...
			oConditionModel.refresh();
			oConditionModel.checkUpdate(true, true);
		},

		removeCondition: function(oEvent){
			//var sSouceId = oEvent.oSource.getId();
			//var oConditionModel = this.oView.getModel("cm");
			//var aConditions = oConditionModel.getConditions();
			//var sLen = aConditions.length;
			//var aOperatorTabItems = [];
			//for (var i = 0 ; i < sLen; i++) {
			//	//filter values of "select with operator" tab from condition model and stores it in a array
			//	if ( aConditions[i].operator !== "EEQ") {
			//		aOperatorTabItems.push({
			//			items : aConditions[i],
			//			index : i});
			//	}
			//}
			//var index = sSouceId.substr(sSouceId.lastIndexOf("-") + 1 ,sSouceId.length); //index of removed item
			//var aRemovedItem = [];
			//aRemovedItem.push(aOperatorTabItems[index]);  //getting object of removed item
			//oConditionModel.removeCondition(this.getView().getController().fieldPath, parseInt(aRemovedItem[0].index, 10));
            //
			////if removal item is last line item of condition tab then will add empty condition
			//this.updateDefineConditions();

			var oSource = oEvent.oSource;
			var oCondition = oSource.getBindingContext("cm").getObject();
			var oConditionModel = this.oView.getModel("cm");

			// remove the condition from the CM
			oConditionModel.removeCondition(oCondition);
		},
		addCondition: function(oEvent){
			//var oConditionModel = this.oView.getModel("cm");
			//var sSouceId = oEvent.oSource.getId();
			//var index = sSouceId.substr(sSouceId.lastIndexOf("-") + 1 ,sSouceId.length);
			//// create a new dummy condition for a new contion on the UI - must be removed later if not used or filled correct
			//oConditionModel.insertCondition(index, oConditionModel.createCondition(this.getView().getController().fieldPath, "EQ", []));

			var oSource = oEvent.oSource;
			var oCondition = oSource.getBindingContext("cm").getObject();

			var oConditionModel = this.oView.getModel("cm");
			var index = oConditionModel.indexOf(oCondition);

			// create a new dummy condition for a new condition on the UI - must be removed later if not used or filled correct
			this.addDummyCondition(index + 1);
		},

		handleSelectionChange : function(oEvent){

			var oView = this.getView();
			var oConditionModel = oView.getModel("cm");
			var mValueList = oView.getModel("valueList").getObject("/");
			var oItem, sKey, sDescription, oBindingContext;
			for (var i = 0; i < oEvent.getParameter("listItems").length; i++) {
				//Getting list item associated object(data)
				oBindingContext = oEvent.getParameter("listItems")[i].getBindingContext();
				oItem = oBindingContext.getObject();
				//Getting key-field from the list item, TODO: Implementation for multiple key-field scenario
				sKey = oItem[mValueList.__sapfe.keyPath];
				sDescription = oItem[mValueList.__sapfe.descriptionPath];
				//Insert condition to condition model(index, path, operator, aValues)
				//Store the canonical path to the condition for updating the table rows selection on update of binding or token
				var oCondition = oConditionModel.createCondition(this.sFieldPath, "EEQ", [sKey,sDescription,oBindingContext.getCanonicalPath()]);

				var index = oConditionModel.indexOf(oCondition, this.sFieldPath);
				if (index === -1) {
					oConditionModel.addCondition(oCondition);
				} else {
					oConditionModel.removeCondition(this.sFieldPath, index);
				}
			}
		},

		handleTokenUpdate : function(oEvent){

			//var oView = this.getView();
			//var oConditionModel = oView.getModel("cm");
			//var sFieldPath = oView.getController().fieldPath;
			//var aRemovedTokens = oEvent.getParameter("removedTokens");
			//var aTokens = oView.byId("template::Tokenizer").getTokens();
			//for (var i = 0; i < aTokens.length; i++) {
			//	if (aTokens[i].getKey() === aRemovedTokens[0].getKey()) {
            //
			//		var oTable = oView.byId("valueListTable");
			//		var oTableSelectedContext = oTable.getSelectedContexts();
			//		for (var j = 0; j < oTableSelectedContext.length; j++) {
			//			if (oTableSelectedContext[j].getCanonicalPath() === oConditionModel.getConditions()[i].values[2]) {
			//				oTable.getItems()[oTableSelectedContext[j].iIndex].setSelected(false);
			//				break;
			//			}
			//		}
			//		oConditionModel.removeCondition(sFieldPath,i);
			//		break;
			//	}
			//}

			if (oEvent.getParameter("type") === "removed") {
				var aRemovedTokens = oEvent.getParameter("removedTokens");
				var oToken = aRemovedTokens[0];
				var oCondition = oToken.getBindingContext("cm").getObject();

				var oConditionModel = this.oView.getModel("cm");
				var index = oConditionModel.indexOf(oCondition);

				// remove the condition from the CM
				oConditionModel.removeCondition(this.sFieldPath, index);
			}
		},

		updateTableSelections : function (oEvent) {
			// remove all selections from the table
			var oTable, aItems;
			oTable = this.getView().byId("valueListTable");
			// remove selections with "true" to remove all the invisible selections as well
			oTable.removeSelections(true);
			aItems = oTable.getItems();
			// We get the conditions and key path, loop over conditions and compare key to table's current items to mark selections
			var oConditionModel, aConditions, aConditionsForTableTab;
			oConditionModel = this.getView().getModel("cm");
			aConditions = oConditionModel.getConditions();
			aConditionsForTableTab = aConditions.filter(function (oCondition) {
				return oCondition.operator === "EEQ";
			});
			var i, j, oCondition, oItem;
			for (i = 0; i < aConditionsForTableTab.length; i++) {
				oCondition = aConditionsForTableTab[i];
				for (j = 0; j < aItems.length; j++) {
					oItem = aItems[j];
					if (oItem.getBindingContext().getCanonicalPath() === oCondition.values[2]) {
						oTable.setSelectedItem(oItem, true);
						break;
					}
				}
			}
		},

		/**
		 * Add dummy condition to define conditions tab if no conditions
		 */
//		updateDefineConditions: function() {
//			var oConditionModel = this.getView().getModel("cm");
//			var aConditions = oConditionModel.getConditions().filter(function(oCondition) {
//				return oCondition.operator !== "EEQ";
//			});
//
//			if (aConditions.length === 0) {
//				this.addDummyCondition();
//			}
//		},

		addDummyCondition: function(index) {
			var oConditionModel = this.oView.getModel("cm");
			var oCondition = oConditionModel.createCondition(this.sFieldPath, "EQ", []);
			if (index !== undefined) {
				oConditionModel.insertCondition(index, oCondition, true);
			} else {
				oConditionModel.addCondition(oCondition, true);
			}
		},

		valueCtrlFactory: function(sId, oContext) {
			var oCM = oContext.oModel;
			var sPath = oContext.sPath;
			var index = parseInt(sPath.split("/")[sPath.split("/").length - 1], 10);
			var conditionIndex = parseInt(sPath.split("/")[2], 10);
			sPath = sPath.slice(0, sPath.lastIndexOf("/") - 1);
			sPath = sPath.slice(0, sPath.lastIndexOf("/") - 1);
			var oCondition = oCM.getProperty(sPath)[conditionIndex];
			var oOperator = oCM.getFilterOperatorConfig().getOperator(oCondition.operator);

			var oFilterField = oCM.getFilterField();
			var oDataType = oFilterField._getDataType();

			var oValueControl = ConditionModel.createControl(oDataType, oOperator, "cm>", index);
			oValueControl.setLayoutData(new sap.m.FlexItemData({
				shrinkFactor: 0,
				growFactor: 0.5
			}));
			if (index) {
				oValueControl.addStyleClass("sapUiSmallMarginBegin");
			}
			oValueControl.attachChange(this.onChange.bind(this));
			return oValueControl;
		}

	});
});
