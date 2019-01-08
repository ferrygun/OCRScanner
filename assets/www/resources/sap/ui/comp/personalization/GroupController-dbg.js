/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides GroupController
sap.ui.define([
	'jquery.sap.global', './BaseController', 'sap/m/library', './Util', 'sap/m/P13nConditionPanel'
], function(jQuery, BaseController, library, Util, P13nConditionPanel /*Needed for Enum sap.m.P13nConditionOperation */) {
	"use strict";

	/**
	 * The GroupController can be used to handle the grouping of the Analytical and sap.m.Table. The grouping of the sap.ui.table.Table is not
	 * supported and the existing coding is only for testing and finding the limitations integrated.
	 *
	 * @class Table Personalization Controller
	 * @extends sap.ui.comp.personalization.BaseController
	 * @author SAP
	 * @version 1.25.0-SNAPSHOT
	 * @private
	 * @alias sap.ui.comp.personalization.GroupController
	 */
	var GroupController = BaseController.extend("sap.ui.comp.personalization.GroupController",
	/** @lends sap.ui.comp.personalization.GroupController */
	{
		constructor: function(sId, mSettings) {
			BaseController.apply(this, arguments);
			this.setType(sap.m.P13nPanelType.group);
		},
		metadata: {
			events: {
				afterGroupModelDataChange: {}
			}
		}
	});

	GroupController.prototype.setTable = function(oTable) {
		BaseController.prototype.setTable.apply(this, arguments);

		if (Util.getTableBaseType(oTable) === sap.ui.comp.personalization.TableType.Table) {
			oTable.detachGroup(this._onGroup, this);
			oTable.attachGroup(this._onGroup, this);
		}
	};

	/**
	 * Does a complete JSON snapshot of the current table instance ("original") from the perspective of the columns controller; the json snapshot can
	 * later be applied to any table instance to recover all columns related infos of the "original" table
	 */
	GroupController.prototype._getTable2Json = function() {
		var oJsonData = this.createPersistentStructure();
		this._addPersistentData(this._mapTable2Json(this.getTable()), oJsonData);
		return oJsonData;
	};

	/**
	 * Note: the DataSuiteFormate does not support group sort order and 'showIfGrouped'.
	 * @param oDataSuiteFormat
	 * @returns {Object}
	 */
	GroupController.prototype._getDataSuiteFormat2Json = function(oDataSuiteFormat) {
		var oJsonData = this.createPersistentStructure();
		this._addPersistentData(this._mapDataSuiteFormat2Json(oDataSuiteFormat), oJsonData);
		return oJsonData;
	};

	GroupController.prototype._addPersistentData = function(oSourceJsonData, oDestinationJsonData) {
		var oColumnKey2ColumnMap = this.getColumnMap(true);
		oSourceJsonData.group.groupItems.forEach(function(oSourceItem) {
			if (!oSourceItem.isGrouped || !oColumnKey2ColumnMap[oSourceItem.columnKey]) {
				return;
			}
			oDestinationJsonData.group.groupItems.push({
				columnKey: oSourceItem.columnKey,
				operation: oSourceItem.operation,
				showIfGrouped: oSourceItem.showIfGrouped
			});
		});
	};

	GroupController.prototype._mapTable2Json = function(oTable) {
		// Collect grouped columns respectively there orders
		var aColumns = [];
		if (Util.getTableBaseType(oTable) === sap.ui.comp.personalization.TableType.Table && oTable.getGroupBy) {
			aColumns = oTable.getGroupBy() || [];
			if (typeof aColumns === "string") {
				aColumns = [
					aColumns
				];
			}
			// TODO: the getGroupBy returns no grouping when we call it to early. The result can be that we do not find the default grouping of the ui.Table
		}
		if (Util.getTableType(oTable) === sap.ui.comp.personalization.TableType.AnalyticalTable && oTable.getGroupedColumns) {
			aColumns = oTable.getGroupedColumns() || [];
		}
		var oJsonData = this.createPersistentStructure();
		oJsonData.group.groupItems = aColumns.map(function(oColumn) {
			if (typeof oColumn === "string") {
				oColumn = sap.ui.getCore().byId(oColumn);
			}
			// TODO: this really should be done differently: we need to load P13nConditionPanel in order to get access to
			// P13nConditionOperation below
			// - would be better to include the P13nConditionOperation in the library.js. Since the latter is anyhow loaded ( we need already
			// P13nPanelType
			// in the constructor ) we would need no explicit "require" here.
			// jQuery.sap.require("sap/m/P13nConditionPanel");
			return {
				columnKey: Util.getColumnKey(oColumn),
				isGrouped: oColumn.getGrouped(),
				operation: oColumn.getSortOrder && oColumn.getSortOrder() === sap.ui.table.SortOrder.Ascending ? sap.m.P13nConditionOperation.GroupAscending : sap.m.P13nConditionOperation.GroupDescending,
				showIfGrouped: oColumn.getShowIfGrouped ? oColumn.getShowIfGrouped() : false
			};
		});
		return oJsonData;
	};

	/**
	 * @param {object} oDataSuiteFormat
	 * @returns {object}
	 * @private
	 */
	GroupController.prototype._mapDataSuiteFormat2Json = function(oDataSuiteFormat) {
		var oJsonData = this.createPersistentStructure();
		if (!oDataSuiteFormat.GroupBy || !oDataSuiteFormat.GroupBy.length) {
			return oJsonData;
		}
		oJsonData.group.groupItems = oDataSuiteFormat.GroupBy.map(function(sGroupBy) {
			return {
				columnKey: sGroupBy,
				isGrouped: true,
				operation: sap.m.P13nConditionOperation.GroupAscending,
				showIfGrouped: false
			};
		});
		return oJsonData;
	};

	GroupController.prototype.syncTable2TransientModel = function() {
		var oTable = this.getTable();
		var aItems = [];
		var oColumn;
		var sColumnKey;
		var oColumnKey2ColumnMap = this.getColumnMap(true);

		if (oTable) {
			if (Util.getTableBaseType(oTable) === sap.ui.comp.personalization.TableType.Table) {
				for (sColumnKey in oColumnKey2ColumnMap) {
					oColumn = oColumnKey2ColumnMap[sColumnKey];
					if (Util.isGroupable(oColumn)) {
						aItems.push({
							columnKey: sColumnKey,
							text: oColumn.getLabel().getText(),
							tooltip: (oColumn.getTooltip() instanceof sap.ui.core.TooltipBase) ? oColumn.getTooltip().getTooltip_Text() : oColumn.getTooltip_Text()
						});
					}
				}
			}
			if (Util.getTableType(oTable) === sap.ui.comp.personalization.TableType.ResponsiveTable) {
				for (sColumnKey in oColumnKey2ColumnMap) {
					oColumn = oColumnKey2ColumnMap[sColumnKey];
					if (Util.isGroupable(oColumn)) {
						aItems.push({
							columnKey: sColumnKey,
							text: oColumn.getHeader().getText(),
							tooltip: (oColumn.getHeader().getTooltip() instanceof sap.ui.core.TooltipBase) ? oColumn.getHeader().getTooltip().getTooltip_Text() : oColumn.getHeader().getTooltip_Text()
						});
					}
				}
			}
		}

		Util.sortItemsByText(aItems, "text");

		// check if groupItems was changed at all and take over if it was changed
		var oGroupItemsBefore = this.getModel("$sapuicomppersonalizationBaseController").getData().transientData.group.items;
		if (jQuery(aItems).not(oGroupItemsBefore).length !== 0 || jQuery(oGroupItemsBefore).not(aItems).length !== 0) {
			this.getModel("$sapuicomppersonalizationBaseController").getData().transientData.group.items = aItems;
		}
	};

	GroupController.prototype._onGroup = function(oEvent) {
		var oTable = this.getTable();

		var aGroupedColumns = oEvent.mParameters.groupedColumns;

		this.fireBeforePotentialTableChange();

		var oData = this.getModel("$sapuicomppersonalizationBaseController").getData();
		oData.persistentData.group.groupItems = [];
		aGroupedColumns.forEach(function(oColumn, iIndex) {
			if (typeof oColumn === "string") {
				oColumn = sap.ui.getCore().byId(oColumn);
			}

			if (Util.getTableType(oTable) === sap.ui.comp.personalization.TableType.AnalyticalTable) {
				if (oColumn.getGrouped()) {
					oData.persistentData.group.groupItems.push({
						columnKey: Util.getColumnKey(oColumn),
						showIfGrouped: oColumn.getShowIfGrouped ? oColumn.getShowIfGrouped() : false
					});
				}
			} else if (Util.getTableBaseType(oTable) === sap.ui.comp.personalization.TableType.Table) {
				oData.persistentData.group.groupItems.push({
					columnKey: Util.getColumnKey(oColumn),
					showIfGrouped: false
				});
			}
		}, this);

		this.fireAfterPotentialTableChange();

		this.fireAfterGroupModelDataChange();
	};

	GroupController.prototype._hasTableGroupableColumns = function() {
		var oTable = this.getTable();
		if (!oTable) {
			return false;
		}

		var bHasGrouping = false;
		oTable.getColumns().some(function(oColumn) {
			if (Util.isGroupable(oColumn)) {
				bHasGrouping = true;
				return true;
			}
		});
		return bHasGrouping;
	};

	GroupController.prototype.getPanel = function() {

		sap.ui.getCore().loadLibrary("sap.m");

		jQuery.sap.require("sap/m/P13nGroupPanel");
		jQuery.sap.require("sap/m/P13nItem");
		jQuery.sap.require("sap/m/P13nGroupItem");

		if (!this._hasTableGroupableColumns()) {
			return null;
		}

		var that = this;
		var oPanel = new sap.m.P13nGroupPanel({
			maxGroups: Util.getTableType(this.getTable()) === sap.ui.comp.personalization.TableType.AnalyticalTable ? "-1" : "1",
			containerQuery: true,
			items: {
				path: "$sapmP13nPanel>/transientData/group/items",
				template: new sap.m.P13nItem({
					columnKey: "{$sapmP13nPanel>columnKey}",
					text: "{$sapmP13nPanel>text}",
					tooltip: "{$sapmP13nPanel>tooltip}"
				})
			},
			groupItems: {
				path: "$sapmP13nPanel>/persistentData/group/groupItems",
				template: new sap.m.P13nGroupItem({
					columnKey: "{$sapmP13nPanel>columnKey}",
					operation: "{$sapmP13nPanel>operation}",
					showIfGrouped: "{$sapmP13nPanel>showIfGrouped}"
				})
			},
			beforeNavigationTo: that.setModelFunction()
		});

		oPanel.attachAddGroupItem(function(oEvent) {
			var oData = this.getModel("$sapuicomppersonalizationBaseController").getData();
			var params = oEvent.getParameters();
			var oGroupItem = {
				columnKey: params.groupItemData.getColumnKey(),
				operation: params.groupItemData.getOperation(),
				showIfGrouped: params.groupItemData.getShowIfGrouped()
			};
			if (params.index > -1) {
				oData.persistentData.group.groupItems.splice(params.index, 0, oGroupItem);
			} else {
				oData.persistentData.group.groupItems.push(oGroupItem);
			}
			this.getModel("$sapuicomppersonalizationBaseController").setData(oData, true);
		}, this);

		oPanel.attachRemoveGroupItem(function(oEvent) {
			var params = oEvent.getParameters();
			var oData = this.getModel("$sapuicomppersonalizationBaseController").getData();
			if (params.index > -1) {
				oData.persistentData.group.groupItems.splice(params.index, 1);
				this.getModel("$sapuicomppersonalizationBaseController").setData(oData, true);
			}
		}, this);

		return oPanel;
	};

	GroupController.prototype.syncJsonModel2Table = function(oJsonModel) {
		var oTable = this.getTable();
		var oColumn;
		var oColumnKey2ColumnMap = this.getColumnMap();

		this.fireBeforePotentialTableChange();

		if (Util.getTableType(oTable) === sap.ui.comp.personalization.TableType.TreeTable) {
			return;

		} else if (Util.getTableType(oTable) === sap.ui.comp.personalization.TableType.AnalyticalTable) {
			// we have to set all columns first to unGrouped
			for ( var sColumnKey in oColumnKey2ColumnMap) {
				oColumn = oColumnKey2ColumnMap[sColumnKey];
				if (oColumn && oColumn.getGrouped()) {
					oColumn.setGrouped(false);
					oColumn.setShowIfGrouped(false);
				}
			}

			oJsonModel.group.groupItems.forEach(function(oGroupItem) {
				oColumn = oColumnKey2ColumnMap[oGroupItem.columnKey];
				if (!oColumn) {
					return;
				}
				oColumn.setGrouped(true);

				oColumn.setShowIfGrouped(oGroupItem.showIfGrouped);
				// if(oGroupItem.showIfGrouped && oColumn.getInResult()){
				// 	oColumn.setShowIfGrouped(oGroupItem.showIfGrouped);
				// 	oColumn.setVisible(true);
				// }
			});

		} else if (Util.getTableBaseType(oTable) === sap.ui.comp.personalization.TableType.Table) {
			if (oJsonModel.group.groupItems.length > 0) {
				oJsonModel.group.groupItems.some(function(oGroupItem) {
					oColumn = oColumnKey2ColumnMap[oGroupItem.columnKey];
					if (oColumn) {
						oTable.setGroupBy(oColumn);
						return true;
					}

				}, this);
			} else {
				// TODO removing the grouping does not work. we need a correction on the ui.table cf. commit Ifda0dbbfd22a586415f53aa99cbe6663577fe847
				oTable.setGroupBy(null);
			}
		}

		this.fireAfterPotentialTableChange();
	};

	/**
	 * Operations on group are processed every time directly at the table. In case that something has been changed via Personalization Dialog or via
	 * user interaction at table, the change is instantly applied at the table.
	 */
	GroupController.prototype.getChangeType = function(oPersistentDataBase, oPersistentDataCompare) {
		if (!oPersistentDataCompare || !oPersistentDataCompare.group || !oPersistentDataCompare.group.groupItems) {
			return sap.ui.comp.personalization.ChangeType.Unchanged;
		}
		var bIsDirty = JSON.stringify(oPersistentDataBase.group.groupItems) !== JSON.stringify(oPersistentDataCompare.group.groupItems);

		return bIsDirty ? sap.ui.comp.personalization.ChangeType.ModelChanged : sap.ui.comp.personalization.ChangeType.Unchanged;
	};

	/**
	 * Result is XOR based difference = CurrentModelData - oPersistentDataCompare
	 *
	 * @param {object} oPersistentDataCompare JSON object
	 * @returns {object} JSON object or empty object
	 */
	GroupController.prototype.getChangeData = function(oPersistentDataBase, oPersistentDataCompare) {

		if (!oPersistentDataBase || !oPersistentDataBase.group || !oPersistentDataBase.group.groupItems) {
			return this.createPersistentStructure();
		}

		if (!oPersistentDataCompare || !oPersistentDataCompare.group || !oPersistentDataCompare.group.groupItems) {
			return {
				group: Util.copy(oPersistentDataBase.group)
			};
		}

		if (JSON.stringify(oPersistentDataBase.group.groupItems) !== JSON.stringify(oPersistentDataCompare.group.groupItems)) {
			return {
				group: Util.copy(oPersistentDataBase.group)
			};
		}
		return null;
	};

	/**
	 * @param {object} oPersistentDataBase: JSON object to which different properties from JSON oPersistentDataCompare are added
	 * @param {object} oPersistentDataCompare: JSON object from where the different properties are added to oPersistentDataBase. Note: if groupItems
	 *        is [] then it means that all groupItems have been deleted
	 * @returns {object} new JSON object as union result of oPersistentDataBase and oPersistentDataCompare
	 */
	GroupController.prototype.getUnionData = function(oPersistentDataBase, oPersistentDataCompare) {
		// not valid
		if (!oPersistentDataCompare || !oPersistentDataCompare.group || !oPersistentDataCompare.group.groupItems) {
			return {
				group: Util.copy(oPersistentDataBase.group)
			};
		}

		return {
			group: Util.copy(oPersistentDataCompare.group)
		};
	};

	/**
	 * Determines whether a grouping has been selected for specific column or not.
	 *
	 * @param {object} oPayload structure about the current selection coming from panel
	 * @param {string} sColumnKey column key of specific column
	 * @returns {boolean} true if grouping for a specific column is selected, false if not
	 */
	GroupController.prototype.isGroupSelected = function(oPayload, oPersistentData, sColumnKey) {
		var iIndex;
		if (!oPayload) {
			oPersistentData.groupItems.some(function(oGroupItem, iIndex_) {
				if (oGroupItem.columnKey === sColumnKey) {
					iIndex = iIndex_;
					return true;
				}
			});
			return iIndex > -1;
		}

		// oPayload has been passed...
		if (!oPayload.selectedColumnKeys) {
			return false;
		}
		if (oPayload.selectedColumnKeys) {
			oPayload.selectedColumnKeys.some(function(sSelectedColumnKey, iIndex_) {
				if (sSelectedColumnKey === sColumnKey) {
					iIndex = iIndex_;
					return true;
				}
			});
		}
		return iIndex > -1;
	};

	/**
	 * Creates property <code>GroupBy</code> in <code>oDataSuiteFormat</code> object if at least one group item exists. The <code>GroupBy</code> contains the current PersistentData snapshot.
	 * @param {object} oDataSuiteFormat Structure of Data Suite Format
	 */
	GroupController.prototype.getDataSuiteFormatSnapshot = function(oDataSuiteFormat) {
		var oPersistentDataTotal = this.getUnionData(this.getPersistentDataRestore(), this.getPersistentData());
		if (!oPersistentDataTotal.group || !oPersistentDataTotal.group.groupItems || !oPersistentDataTotal.group.groupItems.length) {
			return;
		}
		oDataSuiteFormat.GroupBy = oPersistentDataTotal.group.groupItems.map(function(oGroupItem) {
			return oGroupItem.columnKey;
		});
	};

	/**
	 * Cleans up before destruction.
	 */
	GroupController.prototype.exit = function() {
		BaseController.prototype.exit.apply(this, arguments);

		var oTable = this.getTable();
		if (Util.getTableBaseType(oTable) === sap.ui.comp.personalization.TableType.Table) {
			oTable.detachGroup(this._onGroup, this);
		}
	};

	return GroupController;

}, /* bExport= */true);
