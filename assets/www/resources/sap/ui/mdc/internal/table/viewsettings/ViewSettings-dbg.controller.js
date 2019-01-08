/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	"sap/ui/mdc/library",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Sorter",
	"sap/ui/model/json/JSONModel"
], function (Library, Controller, Sorter, JSONModel) {
	"use strict";
	return Controller.extend("sap.ui.mdc.internal.table.viewsettings.ViewSettings", {
		//Event handler for OK button
		onConfirm: function (oEvent) {
			var aCondition = oEvent.getParameters(),
				aSorters = [],
				sPath,
				bDescending,
				sKey, sName;

			var fnGroup = function (oContext) {
				sPath = (aCondition.groupItem && aCondition.groupItem.getKey());
				sKey = oContext.getProperty(sPath);
				sName = aCondition.groupItem && aCondition.groupItem.getText();

				return {
					key: sKey,
					text: sName + " : " + sKey
				};
			};

			//grouping
			if (aCondition.groupItem) {
				sPath = aCondition.groupItem.getKey();
				bDescending = !!(aCondition.groupDescending);
				var oGroupSorter = new Sorter(sPath, bDescending, fnGroup);
				aSorters.push(oGroupSorter);
			}

			//sorting
			if (aCondition.sortItem) {
				sPath = aCondition.sortItem.getKey();
				bDescending = !!(aCondition.sortDescending);
				aSorters.push(new Sorter(sPath, bDescending));
			}

			this._saveViewSettingsState(aCondition);
			this.oTableController.applyGroupAndSort(aSorters);
			this.getView().destroy();
		},
		//Function to save the state of view settings dialog state.
		_saveViewSettingsState: function (aCondition) {
			var oViewSettingsModel = this.oView.getModel().getData();

			//Group panel
			var groupItemKey = aCondition.groupItem && aCondition.groupItem.getKey();
			oViewSettingsModel.groupDescending = !!(aCondition.groupDescending);

			if (groupItemKey != null && groupItemKey != undefined) {
				oViewSettingsModel.groupPanelItems.map(function (groupPanelItem) {
					if (groupPanelItem.columnKey === groupItemKey) {
						groupPanelItem.selected = true;
						return groupPanelItem;
					} else {
						groupPanelItem.selected = false;
						return groupPanelItem;
					}
				});
			}


			//Sort Panel
			var sortItemKey = aCondition.sortItem && aCondition.sortItem.getKey();
			oViewSettingsModel.sortDesecending = !!(aCondition.sortDescending);

			if (sortItemKey != null && sortItemKey != undefined) {

				oViewSettingsModel.sortPanelItems.map(function (sortPanelItem) {
					if (sortPanelItem.columnKey === sortItemKey) {
						sortPanelItem.selected = true;
						return sortPanelItem;
					} else {
						sortPanelItem.selected = false;
						return sortPanelItem;
					}
				});
			}


			// //Column Panel
			// var aSelectColumnKeys = this.oView.byId("ColumnsList").getSelectedItems().map( function(selectedColumneItem) {
			// 	return selectedColumneItem.getCustomData()[0].getValue();
			// });
			// oViewSettingsModel.selectAllText = Library.getText("table.VIEWSETTINGS_COLUMN_SELECTALL", [aSelectColumnKeys.length, oViewSettingsModel.columnPanelItems.length]);

			// oViewSettingsModel.columnPanelItems.map( function(columnPanelItem) {
			// 	if (aSelectColumnKeys.indexOf(columnPanelItem.columnKey) > -1) {
			// 		columnPanelItem.selected = true;
			// 		return columnPanelItem;
			// 	} else {
			// 		columnPanelItem.selected = false;
			// 		return columnPanelItem;
			// 	}
			// });
			// oViewSettingsModel.columnPanelItems = oViewSettingsModel.columnPanelItems.sort(function (x, y) {
			// 	if (x.selected === y.selected) {
			// 		return 0;
			// 	} else if (x.selected) {
			// 		return -1;
			// 	} else {
			// 		return 1;
			// 	}
			// });

			this.oTableController.oViewSettingsPropertyModel = new JSONModel(oViewSettingsModel);
		},
		//Event handler for cancel button
		onCancel: function (oEvent) {
			this.getView().destroy();
		},
		//Even handler for the select of column tab select all check box"
		onColumnListSelectAll: function (oEvent) {
			if (oEvent.getParameters().selected) {
				this.getView().byId("ColumnsList").selectAll();
			} else {
				this.getView().byId("ColumnsList").removeSelections(true);
			}
			this._updateSelectAllText();
		},
		onColumnListChange: function (oEvent) {
			this._updateSelectAllText();
		},
		_updateSelectAllText: function () {
			var oColumnList = this.getView().byId("ColumnsList"),
				sSelectAllText = Library.getText("table.VIEWSETTINGS_COLUMN_SELECTALL", [oColumnList.getSelectedItems().length, oColumnList.getItems().length]);
			this.getView().byId("selectAllCheckBox").setText(sSelectAllText);
		}
	});
});
