/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides SortController
sap.ui.define([
	'jquery.sap.global', './BaseController', 'sap/m/library', './Util'
], function(jQuery, BaseController, library, Util) {
	"use strict";

	/**
	 * The SortController can be used to...
	 *
	 * @class Table Personalization Controller
	 * @extends sap.ui.comp.personalization.BaseController
	 * @author SAP
	 * @version 1.25.0-SNAPSHOT
	 * @private
	 * @alias sap.ui.comp.personalization.SortController
	 */
	var SortController = BaseController.extend("sap.ui.comp.personalization.SortController",
	/** @lends sap.ui.comp.personalization.SortController */
	{
		constructor: function(sId, mSettings) {
			BaseController.apply(this, arguments);
			this.setType(sap.m.P13nPanelType.sort);
		},
		metadata: {
			events: {
				afterSortModelDataChange: {}
			}
		}
	});

	SortController.prototype.setTable = function(oTable) {
		BaseController.prototype.setTable.apply(this, arguments);

		if (Util.getTableBaseType(oTable) === sap.ui.comp.personalization.TableType.Table) {
			oTable.detachSort(this._onSort, this);
			oTable.attachSort(this._onSort, this);
		}
	};

	/**
	 * this method will make a complete initial json snapshot of the current table instance ("original") from the perspective of the SortController. The
	 * json snapshot can later be applied to any table instance to recover all sort related info of the "original" table
	 * TODO: This really only works for when max 1 sort criteria is defined since otherwise potentially order of sort criteria is destroyed
	 */
	SortController.prototype._getTable2Json = function() {
		var oJsonData = this.createPersistentStructure();
		Util.createSort2Json(this.getTable(), oJsonData.sort.sortItems, this.getIgnoreColumnKeys());
		return oJsonData;
	};

	SortController.prototype._getDataSuiteFormat2Json = function(oDataSuiteFormat) {
		var oJsonData = this.createPersistentStructure();
		Util.addSortPersistentData(this._mapDataSuiteFormat2Json(oDataSuiteFormat), oJsonData, this.getIgnoreColumnKeys());
		return oJsonData;
	};

	/**
	 * Note: DataSuiteFormat is applied on top of the initial state which is based on metadata. So e.g. several sorted columns can be applied to sap.m.Table.
	 * @param {object} oDataSuiteFormat
	 * @returns {object}
	 * @private
	 */
	SortController.prototype._mapDataSuiteFormat2Json = function(oDataSuiteFormat) {
		var oJsonData = this.createPersistentStructure();
		if (!oDataSuiteFormat.SortOrder || !oDataSuiteFormat.SortOrder.length) {
			return oJsonData;
		}
		oJsonData.sort.sortItems = oDataSuiteFormat.SortOrder.map(function(oSortOrder) {
			return {
				columnKey: oSortOrder.Property,
				isSorted: true,
				operation: oSortOrder.Descending ? "Descending" : "Ascending"
			};
		});
		return oJsonData;
	};

	SortController.prototype.syncTable2TransientModel = function() {
		var oTable = this.getTable();
		var aItems = [];
		var oColumn;
		var sColumnKey;
		var oColumnKey2ColumnMap = this.getColumnMap(true);

		if (oTable) {
			if (Util.getTableBaseType(oTable) === sap.ui.comp.personalization.TableType.Table) {
				for (sColumnKey in oColumnKey2ColumnMap) {
					oColumn = oColumnKey2ColumnMap[sColumnKey];
					if (Util.isSortable(oColumn)) {
						aItems.push({
							columnKey: sColumnKey,
							text: oColumn.getLabel().getText(),
							tooltip: (oColumn.getTooltip() instanceof sap.ui.core.TooltipBase) ? oColumn.getTooltip().getTooltip_Text() : oColumn.getTooltip_Text()
						});
					}
				}
			} else if (Util.getTableType(oTable) === sap.ui.comp.personalization.TableType.ResponsiveTable) {
				for (sColumnKey in oColumnKey2ColumnMap) {
					oColumn = oColumnKey2ColumnMap[sColumnKey];
					if (Util.isSortable(oColumn)) {
						aItems.push({
							columnKey: sColumnKey,
							text: oColumn.getHeader().getText(),
							tooltip: (oColumn.getHeader().getTooltip() instanceof sap.ui.core.TooltipBase) ? oColumn.getHeader().getTooltip().getTooltip_Text() : oColumn.getHeader().getTooltip_Text()
						});
					}
				}
			} else if (Util.getTableType(oTable) === sap.ui.comp.personalization.TableType.ChartWrapper) {
				for (sColumnKey in oColumnKey2ColumnMap) {
					oColumn = oColumnKey2ColumnMap[sColumnKey];
					aItems.push({
						columnKey: sColumnKey,
						text: oColumn.getLabel(),
						tooltip: (oColumn.getTooltip() instanceof sap.ui.core.TooltipBase) ? oColumn.getTooltip().getTooltip_Text() : oColumn.getTooltip_Text()
					});
				}
			}
		}

		Util.sortItemsByText(aItems, "text");

		// check if items was changed at all and take over if it was changed
		// TODO: clean up here
		var aItemsBefore = this.getModel("$sapuicomppersonalizationBaseController").getData().transientData.sort.items;
		if (jQuery(aItems).not(aItemsBefore).length !== 0 || jQuery(aItemsBefore).not(aItems).length !== 0) {
			this.getModel("$sapuicomppersonalizationBaseController").getData().transientData.sort.items = aItems;
		}
	};

	SortController.prototype._onSort = function(oEvent) {
		oEvent.preventDefault();
		var bAdded = oEvent.mParameters.columnAdded;

		var oTable = this.getTable();
		if (typeof oTable === "string") {
			oTable = sap.ui.getCore().byId(oTable);
		}

		this.fireBeforePotentialTableChange();

		// remove existing sortings
		if (!bAdded) {
			var oColumnKey2ColumnMap = this.getColumnMap();
			for ( var sColumnKey in oColumnKey2ColumnMap) {
				var oColumn = oColumnKey2ColumnMap[sColumnKey];
				if (oColumn.setSorted) {
					oColumn.setSorted(false);
				}
			}
		}
		var oColumn = oEvent.mParameters.column;
		if (oColumn && oColumn.setSorted) {
			oColumn.setSorted(true);
			oColumn.setSortOrder(oEvent.mParameters.sortOrder);
		}

		var oSortData = this.getModel("$sapuicomppersonalizationBaseController").getData().persistentData.sort;

		if (!bAdded) {
			oSortData.sortItems = [];
		}

		var i = Util.getIndexByKey("columnKey", Util.getColumnKey(oColumn), oSortData.sortItems);
		if (i > -1) {
			oSortData.sortItems.splice(i, 1);
		}
		oSortData.sortItems.push({
			columnKey: Util.getColumnKey(oColumn),
			operation: oEvent.mParameters.sortOrder
		});

		this.fireAfterPotentialTableChange();

		this.fireAfterSortModelDataChange();
	};

	SortController.prototype.getPanel = function() {

		sap.ui.getCore().loadLibrary("sap.m");

		jQuery.sap.require("sap/m/P13nSortPanel");
		jQuery.sap.require("sap/m/P13nItem");
		jQuery.sap.require("sap/m/P13nSortItem");

		if (!this.getColumnHelper().hasSortableColumns()) {
			return null;
		}
		var that = this;
		var oPanel = new sap.m.P13nSortPanel({
			containerQuery: true,
			items: {
				path: "$sapmP13nPanel>/transientData/sort/items",
				template: new sap.m.P13nItem({
					columnKey: "{$sapmP13nPanel>columnKey}",
					text: "{$sapmP13nPanel>text}",
					tooltip: "{$sapmP13nPanel>tooltip}",
					maxLength: "{$sapmP13nPanel>maxlength}",
					type: "{$sapmP13nPanel>type}"
				})
			},
			sortItems: {
				path: "$sapmP13nPanel>/persistentData/sort/sortItems",
				template: new sap.m.P13nSortItem({
					columnKey: "{$sapmP13nPanel>columnKey}",
					operation: "{$sapmP13nPanel>operation}"
				})
			},
			beforeNavigationTo: that.setModelFunction()
		});

		oPanel.attachAddSortItem(function(oEvent) {
			var oData = this.getModel("$sapuicomppersonalizationBaseController").getData();
			var params = oEvent.getParameters();
			var oSortItem = {
				columnKey: params.sortItemData.getColumnKey(),
				operation: params.sortItemData.getOperation()
			};
			if (params.index > -1) {
				oData.persistentData.sort.sortItems.splice(params.index, 0, oSortItem);
			} else {
				oData.persistentData.sort.sortItems.push(oSortItem);
			}
			this.getModel("$sapuicomppersonalizationBaseController").setData(oData, true);
		}, this);

		oPanel.attachRemoveSortItem(function(oEvent) {
			var params = oEvent.getParameters();
			var oData = this.getModel("$sapuicomppersonalizationBaseController").getData();
			if (params.index > -1) {
				oData.persistentData.sort.sortItems.splice(params.index, 1);
				this.getModel("$sapuicomppersonalizationBaseController").setData(oData, true);
			}
		}, this);

		return oPanel;
	};

	SortController.prototype.syncJsonModel2Table = function(oJsonModel) {
		var oColumnKey2ColumnMap = this.getColumnMap();
		var oColumnKey2ColumnMapUnsorted = jQuery.extend(true, {}, oColumnKey2ColumnMap);

		this.fireBeforePotentialTableChange();

		if (Util.getTableBaseType(this.getTable()) === sap.ui.comp.personalization.TableType.Table) {
			oJsonModel.sort.sortItems.forEach(function(oSortItem) {
				var oColumn = oColumnKey2ColumnMap[oSortItem.columnKey];
				if (!oColumn) {
					return;
				}
				if (!oColumn.getSorted()) {
					oColumn.setSorted(true);
				}
				if (oColumn.getSortOrder() !== oSortItem.operation) {
					oColumn.setSortOrder(oSortItem.operation);
				}
				delete oColumnKey2ColumnMapUnsorted[oSortItem.columnKey];
			});

			for ( var sColumnKey in oColumnKey2ColumnMapUnsorted) {
				var oColumn = oColumnKey2ColumnMapUnsorted[sColumnKey];
				if (oColumn && oColumn.getSorted()) {
					oColumn.setSorted(false);
				}
			}
		}

		this.fireAfterPotentialTableChange();
	};

	/**
	 * Operations on sorting are processed sometime directly at the table and sometime not. In case that something has been changed via
	 * Personalization Dialog the consumer of the Personalization Dialog has to apply sorting at the table. In case that sorting has been changed via
	 * user interaction at table, the change is instantly applied at the table.
	 *
	 * @returns {sap.ui.comp.personalization.ChangeType}
	 */
	SortController.prototype.getChangeType = function(oPersistentDataBase, oPersistentDataCompare) {
		if (!oPersistentDataCompare || !oPersistentDataCompare.sort || !oPersistentDataCompare.sort.sortItems) {
			return sap.ui.comp.personalization.ChangeType.Unchanged;
		}
		var bIsDirty = JSON.stringify(oPersistentDataBase.sort.sortItems) !== JSON.stringify(oPersistentDataCompare.sort.sortItems);

		return bIsDirty ? sap.ui.comp.personalization.ChangeType.ModelChanged : sap.ui.comp.personalization.ChangeType.Unchanged;
	};

	/**
	 * Result is XOR based difference = oPersistentDataBase - oPersistentDataCompare
	 *
	 * @param {object} oPersistentDataCompare JSON object. Note: if sortItems is [] then it means that all sortItems have been deleted
	 * @returns {object} JSON object or empty object
	 */
	SortController.prototype.getChangeData = function(oPersistentDataBase, oPersistentDataCompare) {

		if (!oPersistentDataBase || !oPersistentDataBase.sort || !oPersistentDataBase.sort.sortItems) {
			return {
				sort: {
					sortItems: []
				}
			};
		}

		if (!oPersistentDataCompare || !oPersistentDataCompare.sort || !oPersistentDataCompare.sort.sortItems) {
			return {
				sort: Util.copy(oPersistentDataBase.sort)
			};
		}

		if (JSON.stringify(oPersistentDataBase.sort.sortItems) !== JSON.stringify(oPersistentDataCompare.sort.sortItems)) {
			return {
				sort: Util.copy(oPersistentDataBase.sort)
			};
		}
		return null;
	};

	/**
	 * @param {object} oPersistentDataBase: JSON object to which different properties from JSON oPersistentDataCompare are added
	 * @param {object} oPersistentDataCompare: JSON object from where the different properties are added to oPersistentDataBase. Note: if sortItems is []
	 *        then it means that all sortItems have been deleted
	 * @returns {object} new JSON object as union result of oPersistentDataBase and oPersistentDataCompare
	 */
	SortController.prototype.getUnionData = function(oPersistentDataBase, oPersistentDataCompare) {
		// not valid
		if (!oPersistentDataCompare || !oPersistentDataCompare.sort || !oPersistentDataCompare.sort.sortItems) {
			return {
				sort: Util.copy(oPersistentDataBase.sort)
			};
		}

		return {
			sort: Util.copy(oPersistentDataCompare.sort)
		};
	};

	/**
	 * Creates property <code>SortOrder</code> in <code>oDataSuiteFormat</code> object if at least one sort item exists. The <code>SortOrder</code> contains the current PersistentData snapshot.
	 * @param {object} oDataSuiteFormat Structure of Data Suite Format
	 */
	SortController.prototype.getDataSuiteFormatSnapshot = function(oDataSuiteFormat) {
		var oPersistentDataTotal = this.getUnionData(this.getPersistentDataRestore(), this.getPersistentData());
		if (!oPersistentDataTotal.sort || !oPersistentDataTotal.sort.sortItems || !oPersistentDataTotal.sort.sortItems.length) {
			return;
		}
		oDataSuiteFormat.SortOrder = oPersistentDataTotal.sort.sortItems.map(function(oSortItem) {
			return {
				Property: oSortItem.columnKey,
				Descending: oSortItem.operation === "Descending"
			};
		});
	};

	/**
	 * Cleans up before destruction.
	 *
	 * @private
	 */
	SortController.prototype.exit = function() {
		BaseController.prototype.exit.apply(this, arguments);

		var oTable = this.getTable();
		if (Util.getTableBaseType(this.getTable()) === sap.ui.comp.personalization.TableType.Table) {
			oTable.detachSort(this._onSort, this);
		}
	};

	return SortController;

}, /* bExport= */true);
