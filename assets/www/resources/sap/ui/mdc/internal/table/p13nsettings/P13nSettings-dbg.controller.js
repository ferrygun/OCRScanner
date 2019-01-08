/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Sorter",
	"sap/ui/model/json/JSONModel"
], function (Controller, Sorter, JSONModel) {
	"use strict";
	return Controller.extend("sap.ui.mdc.internal.table.p13nsettings.P13nSettings", {
		//Event handler for Cancel button
		onCancel: function (oEvent) {
			oEvent.getSource().close();
			this.getView().destroy();
		},

		//Event handler for OK button
		onConfirm: function (oEvent) {
			var aPanels = oEvent.getSource().getPanels(),
				aCondition = [],
				aSorters = [],
				sPath,
				bDescending,
				iIndex;

			for (iIndex in aPanels) {
				var sPanelName = aPanels[iIndex].getMetadata().getName();
				if (sPanelName === "sap.m.P13nSortPanel") {
					aCondition.sortCondition = aPanels[iIndex]._getConditions();
				}
				if (sPanelName === "sap.m.P13nGroupPanel") {
					aCondition.groupCondition = aPanels[iIndex]._getConditions();
				}
			}

			var fnGroup = function (oContext) {
				sPath = (aCondition.groupCondition && aCondition.groupCondition[0].keyField);
				var sKey = oContext.getProperty(sPath);
				var sName = (aCondition.groupCondition[0] && aCondition.groupCondition[0].text);

				if (sName.indexOf(":") > 0) {
					sName = sName.substr(0, sName.indexOf(":"));
				}

				return {
					key: sKey,
					text: sName + " : " + sKey
				};
			};

			//grouping
			if (aCondition.groupCondition && aCondition.groupCondition.length > 0) {
				sPath = aCondition.groupCondition[0] && aCondition.groupCondition[0].keyField;
				bDescending = !!(aCondition[0] && aCondition[0].operation === "GroupDescending");
				var oGroupSorter = new Sorter(sPath, bDescending, fnGroup);
				aSorters.push(oGroupSorter);
			}

			//sorting
			if (aCondition.sortCondition) {
				for (iIndex in aCondition.sortCondition) {
					sPath = aCondition.sortCondition[iIndex].keyField;
					bDescending = !!(aCondition.sortCondition[iIndex].operation === "Descending");
					aSorters.push(new Sorter(sPath, bDescending));
				}
			}

			this._saveP13DialogState(aCondition);

			this.oTableController.applyGroupAndSort(aSorters);
			oEvent.getSource().close();
			this.getView().destroy();
		},
		_saveP13DialogState: function(aCondition) {
			var oP13SettingsModelData = this.oView.getModel().getData(),
				iIndex,
				_tempObj;

			//Saving sorting panel state.
			var aP13nSortItems = [];
			for (iIndex in aCondition.sortCondition) {
				_tempObj  = {
					"columnKey" : aCondition.sortCondition[iIndex].keyField,
					"operation" : aCondition.sortCondition[iIndex].operation
				};
				aP13nSortItems.push(_tempObj);
			}
			oP13SettingsModelData.p13nSortItems = aP13nSortItems;

			//Saving grouping panel state
			if (aCondition.groupCondition != undefined && aCondition.groupCondition != null) {
				var aP13nGroupItems = [];
				for (iIndex in aCondition.groupCondition) {
					_tempObj  = {
						"columnKey" : aCondition.groupCondition[iIndex].keyField,
						"operation" : aCondition.groupCondition[iIndex].operation
					};
					aP13nGroupItems.push(_tempObj);
				}
				oP13SettingsModelData.p13nGroupItems = aP13nGroupItems;
			}

			// //Saving the column panel state
			// var aP13nColumnItemsKeys = [];
			// if (this.oView.byId("p13nDialog").getPanels().length === 3) {
			// 	aP13nColumnItemsKeys = this.oView.byId("p13nDialog").getPanels()[2].getOkPayload().selectedItems.map( function(selectedItem) {
			// 		return selectedItem.columnKey;
			// 	});
			// } else {
			// 	aP13nColumnItemsKeys = this.oView.byId("p13nDialog").getPanels()[1].getOkPayload().selectedItems.map( function(selectedItem) {
			// 		return selectedItem.columnKey;
			// 	});
			// }

			// var aP13nColumnItems = [];
			// for (var iIndex in oP13SettingsModelData.columnPanelItems) {
			// 	var _tempObject = JSON.parse(JSON.stringify(oP13SettingsModelData.columnPanelItems[iIndex]));
			// 	if (aP13nColumnItemsKeys.iIndexOf(oP13SettingsModelData.columnPanelItems[iIndex].columnKey) > -1) {
			// 		_tempObject.selected = true;
			// 		aP13nColumnItems.push(_tempObject);
			// 	} else {
			// 		_tempObject.selected = false;
			// 		aP13nColumnItems.push(_tempObject);
			// 	}
			// }
			// oP13SettingsModelData.columnPanelItems = aP13nColumnItems;


			this.oTableController.oP13nSettingsPropertyModel = new JSONModel(oP13SettingsModelData);
		}
	});
});
