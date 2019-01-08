/* eslint-disable strict */

/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides ColumnsController
sap.ui.define([
	'jquery.sap.global', './BaseController', 'sap/m/library', './Util'
], function(jQuery, BaseController, library, Util) {
	"use strict";

	// TODO: wenn an dem Column "Freeze" gesetzt wurde, sollte die Spalte nicht mehr verschoben werden können in dem
	// ColumnsPanel

	/**
	 * The ColumnsController can be used to...
	 *
	 * @class Table Personalization Controller
	 * @extends sap.ui.comp.personalization.BaseController
	 * @author SAP SE
	 * @version 1.52.4
	 * @private
	 * @since 1.26.0
	 * @alias sap.ui.comp.ColumnsController
	 */
	var ColumnsController = BaseController.extend("sap.ui.comp.personalization.ColumnsController", /** @lends sap.ui.comp.personalization.ColumnsController */

	{
		constructor: function(sId, mSettings) {
			BaseController.apply(this, arguments);
			this.setType(sap.m.P13nPanelType.columns);
		},
		metadata: {
			properties: {
				/**
				 * @since 1.36.5
				 */
				triggerModelChangeOnColumnInvisible: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				}
			},

			/**
			 * Event is raised after columns data has been changed in data model
			 *
			 * @since 1.26.0
			 */
			events: {
				afterColumnsModelDataChange: {}
			}
		}
	});

	ColumnsController.prototype.setTable = function(oTable) {
		BaseController.prototype.setTable.apply(this, arguments);

		if (Util.getTableBaseType(oTable) === sap.ui.comp.personalization.TableType.Table) {
			oTable.detachColumnMove(this._onColumnMove, this);
			oTable.detachColumnVisibility(this._onColumnVisibility, this);
			oTable.detachColumnResize(this._onColumnResize, this);
			oTable.attachColumnMove(this._onColumnMove, this);
			oTable.attachColumnVisibility(this._onColumnVisibility, this);
			oTable.attachColumnResize(this._onColumnResize, this);
		}

		this._monkeyPatchTable(oTable);

		// TODO: $ investigate this to avoid changing the transientData by e.g. variantChange
		// this._syncTable2TransientModel();
	};

	ColumnsController.prototype.createPersistentStructure = function(aItems) {
		var oPersistentData = BaseController.prototype.createPersistentStructure.apply(this, arguments);
		return oPersistentData;
	};

	/**
	 * Does a complete JSON snapshot of the current table instance ("original") from the perspective of the columns controller; the JSON snapshot can
	 * later be applied to any table instance to recover all columns related infos of the "original" table
	 *
	 * @returns {objects} JSON objects with meta data from existing table columns
	 */
	ColumnsController.prototype._getTable2Json = function() {
		return this._mapTable2Json(this.getTable());
	};

	ColumnsController.prototype._getDataSuiteFormat2Json = function(oDataSuiteFormat) {
		return this._mapDataSuiteFormat2Json(oDataSuiteFormat);
	};

	ColumnsController.prototype._mapTable2Json = function(oTable) {
		var oJsonData = this.createPersistentStructure();
		if (!oTable) {
			return oJsonData;
		}
		var oColumnKey2ColumnMap = this.getColumnMap(true);
		var iIndex = 0;
		oTable.getColumns().forEach(function(oColumn) {
			var sColumnKey = Util.getColumnKey(oColumn);
			if (!oColumnKey2ColumnMap[sColumnKey]) {
				return;
			}
			oJsonData.columns.columnsItems.push({
				columnKey: sColumnKey,
				index: iIndex,
				visible: oColumn.getVisible(),
				width: (oColumn && oColumn.getWidth) ? oColumn.getWidth() : undefined,
				total: (oColumn && oColumn.getSummed) ? oColumn.getSummed() : undefined
			});
			iIndex++;
		});
		return oJsonData;
	};

	/**
	 * Note: 1. If more than one 'LineItem' exists in <code>oDataSuiteFormat</code> the first one will taken over.
	 * 		 2. 'Width' is not supported by Data Suite Format yet
	 * @param {object} oDataSuiteFormat
	 * @returns {object}
	 * @private
	 */
	ColumnsController.prototype._mapDataSuiteFormat2Json = function(oDataSuiteFormat) {
		var oPersistentData = Util.copy(this.getPersistentDataRestore());

		// Take over 'Total'
		if (oDataSuiteFormat.Total && oDataSuiteFormat.Total.length) {
			oDataSuiteFormat.Total.forEach(function(sColumnKey) {
				var oColumnsItem = Util.getArrayElementByKey("columnKey", sColumnKey, oPersistentData.columns.columnsItems);
				if (oColumnsItem) {
					oColumnsItem.total = true;
				}
			});
		}

		// Take over 'Visualizations'
		if (oDataSuiteFormat.Visualizations && oDataSuiteFormat.Visualizations.length) {
			var aLineItemVisualizations = oDataSuiteFormat.Visualizations.filter(function(oVisualization) {
				return oVisualization.Type === "LineItem";
			});
			if (aLineItemVisualizations.length) {
				// Set all columns as not visible first
				oPersistentData.columns.columnsItems.forEach(function(oColumnsItem) {
					oColumnsItem.visible = false;
				});
				// Set now the visible columns
				aLineItemVisualizations[0].Content.forEach(function(oContent, iIndexTo) {
					var oColumnsItem = Util.getArrayElementByKey("columnKey", oContent.Value, oPersistentData.columns.columnsItems);
					if (!oColumnsItem) {
						return;
					}
					oColumnsItem.visible = true;
					var iIndexFrom = Util.getIndexByKey("columnKey", oContent.Value, oPersistentData.columns.columnsItems);
					this._moveModelItems(iIndexFrom, iIndexTo, oPersistentData.columns.columnsItems);
				}, this);
			}
		}
		return oPersistentData;
	};

	ColumnsController.prototype._moveModelItems = function(iIndexFrom, iIndexTo, aItems) {
		if (iIndexFrom < 0 || iIndexTo < 0 || iIndexFrom > aItems.length - 1 || iIndexTo > aItems.length - 1) {
			return;
		}
		// Move items
		var aMItems = aItems.splice(iIndexFrom, 1);
		aItems.splice(iIndexTo, 0, aMItems[0]);

		// Re-Index the persistentIndex and tableIndex
		aItems.forEach(function(oMItem, iIndex) {
			oMItem.index = iIndex;
		});
	};

	/**
	 * The restore structure is build based on <code>aColumnKeys</code> which contains all possible column keys. For those columns which are
	 * currently not part of table only 'columnKey' and 'index' come from column.
	 *
	 * @param {array} aColumnKeys Contains column key of all possible column
	 * @returns {objects} JSON objects with meta data from existing table columns
	 */
	ColumnsController.prototype._getTable2JsonRestore = function(aColumnKeys) {
		if (!aColumnKeys) {
			return BaseController.prototype._getTable2JsonRestore.apply(this, arguments);
		}
		var oJsonData = this.createPersistentStructure();
		var aIgnoreColumnKeys = this.getIgnoreColumnKeys();
		var oColumnKey2ColumnMap = this.getColumnMap();

		var iIndex = 0;
		aColumnKeys.forEach(function(sColumnKey) {
			if (aIgnoreColumnKeys.indexOf(sColumnKey) > -1) {
				return;
			}
			var oColumn = oColumnKey2ColumnMap[sColumnKey];
			oJsonData.columns.columnsItems.push({
				columnKey: sColumnKey,
				index: iIndex,
				visible: oColumn ? oColumn.getVisible() : false,
				width: oColumn ? oColumn.getWidth() : undefined,
				total: (oColumn && oColumn.getSummed) ? oColumn.getSummed() : undefined
			});
			iIndex++;
		});
		return oJsonData;
	};

	ColumnsController.prototype.syncTable2TransientModel = function() {
		// this.getModel("$sapuicomppersonalizationBaseController").getData().transientData.columns.items = jQuery.extend(true, [],
		// this._aInitialTransientItems);
		// TODO: see ($)
		this._syncTable2TransientModel();
	};

	ColumnsController.prototype._determineTooltipText = function(oObject) {
		var sTooltip = null;

		if (oObject && oObject.getTooltip) {

			// first check whether actual object is extended by TooltipBase
			if (oObject.getTooltip() instanceof sap.ui.core.TooltipBase) {
				sTooltip = oObject.getTooltip().getTooltip_Text();
			} else {
				sTooltip = oObject.getTooltip_Text();
			}

			// If no tooltip exist now -> check whether oObject is of type analyticalColumn -> that have it's own way to get the tooltip via binding
			if (!sTooltip && oObject instanceof sap.ui.table.AnalyticalColumn) {
				sTooltip = oObject.getTooltip_AsString();
			}

			// for all other try to get tooltip from assigned label
			if (!sTooltip && oObject.getLabel && oObject.getLabel().getTooltip_Text) {
				sTooltip = oObject.getLabel().getTooltip_Text();
			}
		}

		return sTooltip;
	};

	ColumnsController.prototype._syncTable2TransientModel = function() {
		var oTable = this.getTable();
		var aItems = [];
		var sColumnKey;
		var oColumn;

		if (oTable) {
			var oColumnKey2ColumnMap = this.getColumnMap(true);
			if (Util.getTableBaseType(oTable) === sap.ui.comp.personalization.TableType.Table) {
				for (sColumnKey in oColumnKey2ColumnMap) {
					oColumn = oColumnKey2ColumnMap[sColumnKey];
					if (!oColumn.getLabel()) {
						throw "The column '" + sColumnKey + "' should have a 'label' aggregation otherwise the column can not be identified in the personalization dialog.";
					}
					var sTooltip = this._determineTooltipText(oColumn);
					aItems.push({
						columnKey: sColumnKey,
						text: oColumn.getLabel().getText(),
						tooltip: sTooltip,
						visible: oColumn.getVisible(),
						width: oColumn.getWidth(),
						total: (oColumn && oColumn.getSummed) ? oColumn.getSummed() : undefined
					});
				}
			} else if (Util.getTableType(oTable) === sap.ui.comp.personalization.TableType.ResponsiveTable) {
				for (sColumnKey in oColumnKey2ColumnMap) {
					oColumn = oColumnKey2ColumnMap[sColumnKey];
					if (!oColumn.getHeader()) {
						throw "The column '" + sColumnKey + "' should have a 'header' aggregation otherwise the column can not be identified in the personalization dialog.";
					}
					aItems.push({
						columnKey: sColumnKey,
						text: oColumn.getHeader().getText ? oColumn.getHeader().getText() : "",
						tooltip: (oColumn.getHeader().getTooltip() instanceof sap.ui.core.TooltipBase) ? oColumn.getHeader().getTooltip().getTooltip_Text() : oColumn.getHeader().getTooltip_Text(),
						visible: oColumn.getVisible(),
						width: oColumn.getWidth()
					});
				}
			}
		}

		// check if Items was changed at all and take over if it was changed
		var aItemsBefore = this.getModel("$sapuicomppersonalizationBaseController").getData().transientData.columns.items;
		if (jQuery(aItems).not(aItemsBefore).length !== 0 || jQuery(aItemsBefore).not(aItems).length !== 0) {
			this.getModel("$sapuicomppersonalizationBaseController").getData().transientData.columns.items = aItems;
		}

		// TODO: see ($)
		// this._aInitialTransientItems = jQuery.extend(true, [],
		// this.getModel("$sapuicomppersonalizationBaseController").getData().transientData.columns.items);
	};

	/**
	 * Set index into existing columnsItem. If it does not exist create new columnsItem with new index
	 *
	 * @param {object} oData is the JSON based model data wherein the index shall be manipulated
	 * @param {object} oColumn is the table column
	 * @param {int} iNewIndex is the index value that shall be set
	 * @private
	 */
	ColumnsController.prototype._setNewColumnItemIndex = function(oData, oColumn, iNewIndex) {
		var iColumnsItemIndex = -1;

		if (oColumn && iNewIndex !== null && iNewIndex !== undefined && iNewIndex > -1) {
			iColumnsItemIndex = Util.getIndexByKey("columnKey", Util.getColumnKey(oColumn), oData.persistentData.columns.columnsItems);
			if (iColumnsItemIndex > -1) {
				oData.persistentData.columns.columnsItems[iColumnsItemIndex].index = iNewIndex;
			} else {
				oData.persistentData.columns.columnsItems.push({
					columnKey: Util.getColumnKey(oColumn),
					index: iNewIndex
				});
			}
		}
	};

	/**
	 * Callback method for table event: ColumnMove
	 *
	 * @param {object} oEvent that contains all information about that column move
	 * @private
	 */
	ColumnsController.prototype._onColumnMove = function(oEvent) {

		var i = 0, iNewIndex = null, oTempColumn = null;
		var oTable = null, oData = null, oColumn = null;
		var iNewColumnIndex = null, iOldColumnIndex = null;

		// get new columns information, like new index and the columns that was moved
		oColumn = oEvent.getParameter("column");
		iNewColumnIndex = oEvent.getParameter("newPos");

		this.fireBeforePotentialTableChange();

		// calculate "old" columns information
		if (oColumn) {
			oTable = this.getTable();
			iOldColumnIndex = oTable.indexOfColumn(oColumn);
		}

		// change index property in model data of columnsItems
		if (iOldColumnIndex !== null && iNewColumnIndex !== null) {
			oData = this.getModel("$sapuicomppersonalizationBaseController").getData();

			if (iOldColumnIndex > iNewColumnIndex) {
				for (i = iNewColumnIndex; i <= iOldColumnIndex; i++) {
					if (i < iOldColumnIndex) {
						oTempColumn = oTable.getColumns()[i];
						iNewIndex = i + 1;
					} else {
						oTempColumn = oColumn;
						iNewIndex = oEvent.getParameter("newPos");
					}
					this._setNewColumnItemIndex(oData, oTempColumn, iNewIndex);
				}
			} else {
				for (i = iOldColumnIndex; i <= iNewColumnIndex; i++) {
					if (i === iOldColumnIndex) {
						oTempColumn = oColumn;
						iNewIndex = oEvent.getParameter("newPos");
					} else {
						oTempColumn = oTable.getColumns()[i];
						iNewIndex = i - 1;
					}
					this._setNewColumnItemIndex(oData, oTempColumn, iNewIndex);
				}
			}

			this.getModel("$sapuicomppersonalizationBaseController").setData(oData, true);

			this.fireAfterPotentialTableChange();

			this.fireAfterColumnsModelDataChange();
		}
	};

	/**
	 * Callback method for table event: ColumnVisibility
	 *
	 * @param {object} oEvent that contains all information about that column visibility
	 * @private
	 */
	ColumnsController.prototype._onColumnVisibility = function(oEvent) {
		var oData = this.getModel("$sapuicomppersonalizationBaseController").getData();
		var oColumn = oEvent.getParameter("column");
		var bVisible = oEvent.getParameter("newVisible");

		this.fireBeforePotentialTableChange();

		var iIndex = Util.getIndexByKey("columnKey", Util.getColumnKey(oColumn), oData.persistentData.columns.columnsItems);
		if (iIndex > -1) {
			oData.persistentData.columns.columnsItems[iIndex].visible = bVisible;
		} else {
			oData.persistentData.columns.columnsItems.push({
				columnKey: Util.getColumnKey(oColumn),
				visible: bVisible
			});
		}
		this.getModel("$sapuicomppersonalizationBaseController").setData(oData, true);

		this.fireAfterPotentialTableChange();

		this.fireAfterColumnsModelDataChange();
	};

	ColumnsController.prototype._onColumnTotal = function(oParams) {
		var oData = this.getModel("$sapuicomppersonalizationBaseController").getData();
		var oColumn = oParams.column;
		var bIsSummed = oParams.isSummed;

		this.fireBeforePotentialTableChange();

		var iIndex = Util.getIndexByKey("columnKey", Util.getColumnKey(oColumn), oData.persistentData.columns.columnsItems);
		if (iIndex > -1) {
			oData.persistentData.columns.columnsItems[iIndex].total = bIsSummed;
		} else {
			oData.persistentData.columns.columnsItems.push({
				columnKey: Util.getColumnKey(oColumn),
				total: bIsSummed
			});
		}
		this.getModel("$sapuicomppersonalizationBaseController").setData(oData, true);

		this.fireAfterPotentialTableChange();

		this.fireAfterColumnsModelDataChange();
	};

	ColumnsController.prototype._onColumnFixedCount = function(iFixedColumnCount) {
		this.fireBeforePotentialTableChange();

		this.getModel("$sapuicomppersonalizationBaseController").setProperty("/persistentData/columns/fixedColumnCount", iFixedColumnCount);

		this.fireAfterPotentialTableChange();

		this.fireAfterColumnsModelDataChange();
	};

	ColumnsController.prototype._onColumnResize = function(oEvent) {
		var oColumn = oEvent.getParameter("column");
		var oData = this.getModel("$sapuicomppersonalizationBaseController").getData();

		this.fireBeforePotentialTableChange();

		var iIndex = Util.getIndexByKey("columnKey", Util.getColumnKey(oColumn), oData.persistentData.columns.columnsItems);
		if (iIndex > -1) {
			oData.persistentData.columns.columnsItems[iIndex].width = oEvent.getParameter("width");
		} else {
			oData.persistentData.columns.columnsItems.push({
				columnKey: Util.getColumnKey(oColumn),
				width: oEvent.getParameter("width")
			});
		}
		this.getModel("$sapuicomppersonalizationBaseController").setData(oData, true);

		this.fireAfterPotentialTableChange();

		this.fireAfterColumnsModelDataChange();
	};

	/**
	 * Returns a ColumnsPanel control
	 *
	 * @returns {sap.m.P13nColumnsPanel} returns a new created ColumnsPanel
	 */
	ColumnsController.prototype.getPanel = function(oPayload) {

		sap.ui.getCore().loadLibrary("sap.m");
		jQuery.sap.require("sap/m/P13nColumnsPanel");
		jQuery.sap.require("sap/m/P13nItem");
		jQuery.sap.require("sap/m/P13nColumnsItem");

		var that = this;
		var iVisibleItemsThreshold = -1;
		if (oPayload && oPayload.visibleItemsThreshold) {
			iVisibleItemsThreshold = oPayload.visibleItemsThreshold;
		}
		var oPanel = new sap.m.P13nColumnsPanel({
			visibleItemsThreshold: iVisibleItemsThreshold,
			items: {
				path: '$sapmP13nPanel>/transientData/columns/items',
				template: new sap.m.P13nItem({
					columnKey: '{$sapmP13nPanel>columnKey}',
					text: '{$sapmP13nPanel>text}',
					visible: '{$sapmP13nPanel>visible}',
					tooltip: '{$sapmP13nPanel>tooltip}',
					width: "{$sapmP13nPanel>width}"
				})
			},
			columnsItems: {
				path: "$sapmP13nPanel>/persistentData/columns/columnsItems",
				template: new sap.m.P13nColumnsItem({
					columnKey: "{$sapmP13nPanel>columnKey}",
					index: "{$sapmP13nPanel>index}",
					visible: "{$sapmP13nPanel>visible}",
					width: "{$sapmP13nPanel>width}",
					total: "{$sapmP13nPanel>total}"
				})
			},
			beforeNavigationTo: this.setModelFunction(),
			changeColumnsItems: function(oEvent) {
				var aMColumnsItems = [];
				if (oEvent.getParameter("items")) {
					oEvent.getParameter("items").forEach(function(oMItem) {
						aMColumnsItems.push({
							columnKey: oMItem.columnKey,
							index: oMItem.index === -1 ? undefined : oMItem.index, // due to backwards compatibility
							visible: oMItem.visible,
							width: oMItem.width,
							total: oMItem.total
						});
					});
					that.getModel("$sapuicomppersonalizationBaseController").setProperty("/persistentData/columns/columnsItems", aMColumnsItems);
				}
			}
		});
		return oPanel;
	};

	ColumnsController.prototype.syncJsonModel2Table = function(oJsonModel) {
		var oTable = this.getTable();
		var aItems = oJsonModel.columns.columnsItems;

		this.fireBeforePotentialTableChange();

		if (Util.getTableBaseType(oTable) === sap.ui.comp.personalization.TableType.Table) {
			this._applyChangesToUiTableType(oTable, aItems);
		} else if (Util.getTableType(oTable) === sap.ui.comp.personalization.TableType.ResponsiveTable) {
			this._applyChangesToMTableType(oTable, aItems);
		}

		this.fireAfterPotentialTableChange();
	};

	/**
	 * Note: Attribute <code>index</code> can be undefined.
	 */
	ColumnsController.prototype._sortByIndex = function(a, b) {
		if (a.index !== undefined && b.index === undefined) {
			return -1;
		}
		if (b.index !== undefined && a.index === undefined) {
			return 1;
		}
		if (a.index < b.index) {
			return -1;
		}
		if (a.index > b.index) {
			return 1;
		}
		return 0;
	};

	/**
	 * Applies changes to a table of type UI table
	 *
	 * @param {object} oTable is the table where all personalization changes shall be allied to
	 * @param {array} aColumnsItems is an array with changes that shall be applied to oTable
	 */
	ColumnsController.prototype._applyChangesToUiTableType = function(oTable, aColumnsItems) {
		var oColumn = null;
		var oColumnsItemsMap = {};
		var that = this;

		var fSetOrderArray = function(aColumnsItems_, aColumnKeys) {
			var aResult = [];
			// organize columnsItems by it's index to apply them in the right order
			aColumnsItems_.sort(that._sortByIndex);

			aColumnsItems_.forEach(function(oColumnsItem) {
				aResult.push(oColumnsItem.columnKey);
				oColumnsItemsMap[oColumnsItem.columnKey] = oColumnsItem;
			});

			aColumnKeys.forEach(function(sColumnKey, iIndex) {
				if (aResult.indexOf(sColumnKey) < 0) {
					aResult.splice(iIndex, 0, sColumnKey);
				}
			});
			return aResult;
		};

		var fSetVisibility = function(sColumnKey, oColumn) {
			// Apply column visibility
			var oColumnsItem = oColumnsItemsMap[sColumnKey];
			if (oColumnsItem && oColumnsItem.visible !== undefined && oColumn.getVisible() !== oColumnsItem.visible) {
				// TODO: was ist mit Binding, wenn das "Visible" Property im XML view gebunden ist?
				// In dem Beispiel von Markus K. wird die Spalte "Document Number" nicht auf Invisible gesetzt.
				oColumn.setVisible(oColumnsItem.visible, true);
			}
		};

		var fSetOrder = function(iIndex, sColumnKey, oColumn) {
			// Apply column order
			var iTableColumnIndex = oTable.indexOfColumn(oColumn); // -1
			var iModelColumnIndex = iIndex;
			if (iModelColumnIndex !== undefined && iTableColumnIndex !== iModelColumnIndex) {

				if (iTableColumnIndex > -1) {
					// column exists
					oTable.removeColumn(oColumn, true);
				}
				oTable.insertColumn(oColumn, iModelColumnIndex, true);

				// TODO: we would like to avoid "removeColumn" completely, however, only doing an insert produces incorrect result (in certain cases)
				// - problem in
				// Analytical Table ?
				// if (iTableColumnIndex > -1) {
				// // so column is already existing in table
				// if (iTableColumnIndex < iModelColumnIndex) {
				// // it was to the left of its new position
				// iModelColumnIndex++;
				// }
				// }

				// // Remove "freeze" if a column was moved from the frozen zone out or column was moved inside of frozen zone.
				// // Allowed is only column move outside of frozen zone.
				// if (!(iTableColumnIndex > iFixedColumnIndex && iModelColumnIndex > iFixedColumnIndex)) {
				// 	// oTable.setFixedColumnCount(0, true);
				// 	bInitializeFixedColumnCount = true;
				// }
			}
		};

		var fSetWidth = function(sColumnKey, oColumn) {
			// Apply column width
			var oColumnsItem = oColumnsItemsMap[sColumnKey];
			if (oColumnsItem && oColumnsItem.width !== undefined && oColumn.getWidth() !== oColumnsItem.width) {
				oColumn.setWidth(oColumnsItem.width, true);
			}
		};

		var fSetTotal = function(sColumnKey, oColumn) {
			// Apply column summed
			var oColumnsItem = oColumnsItemsMap[sColumnKey];
			if (oColumnsItem && oColumnsItem.total !== undefined && oColumn.getSummed && oColumn.getSummed() !== oColumnsItem.total) {
				oColumn.setSummed(oColumnsItem.total, true);
			}
		};

		if (aColumnsItems.length) {
			// apply columnsItems
			var aColumnsItemsArray = fSetOrderArray(aColumnsItems, this._aColumnKeys);
			var oColumnKey2ColumnMap = this.getColumnMap();
			aColumnsItemsArray.forEach(function(sColumnKey, iIndex) {
				oColumn = oColumnKey2ColumnMap[sColumnKey];
				if (oColumn) {
					fSetVisibility(sColumnKey, oColumn);
					fSetOrder(iIndex, sColumnKey, oColumn);
					fSetWidth(sColumnKey, oColumn);
					fSetTotal(sColumnKey, oColumn);
				}
			});
		}

		// Apply table 'fixedColumnCount'
		var iFixedColumnCountPersistent = this.getModel("$sapuicomppersonalizationBaseController").getProperty("/persistentData/columns/fixedColumnCount");
		if (iFixedColumnCountPersistent !== undefined && oTable.getFixedColumnCount && oTable.getFixedColumnCount() !== iFixedColumnCountPersistent) {
			oTable.setFixedColumnCount(iFixedColumnCountPersistent, true);
		}
	};

	/**
	 * Applies changes to a table of type M table
	 *
	 * @param {object} oTable is the table where all personalization changes shall be allied to
	 * @param {array} aColumnsItems is an array with changes that shall be applied to oTable
	 */
	ColumnsController.prototype._applyChangesToMTableType = function(oTable, aColumnsItems) {
		var bTableInvalidateNeeded = false;
		var oColumnKey2ColumnMap = this.getColumnMap();

		var fSetOrder = function(oColumnsItem, oColumn) {
			// Apply column order
			var iModelColumnIndex = oColumnsItem.index;
			if (iModelColumnIndex !== undefined) {
				oColumn.setOrder(iModelColumnIndex, true);
				bTableInvalidateNeeded = true;
			}
		};

		var fSetVisibility = function(oColumnsItem, oColumn) {
			// Apply column visibility
			if (oColumnsItem.visible !== undefined && oColumn.getVisible() !== oColumnsItem.visible) {
				oColumn.setVisible(oColumnsItem.visible, true);
				bTableInvalidateNeeded = true;
			}
		};

		// organize columnsItems by it's index to apply them in the right order
		if (aColumnsItems.length) {
			aColumnsItems.sort(function(a, b) {
				if (a.index < b.index) {
					return -1;
				}
				if (a.index > b.index) {
					return 1;
				}
				return 0;
			});

			// apply columnsItems
			aColumnsItems.forEach(function(oColumnsItem) {
				var oColumn = oColumnKey2ColumnMap[oColumnsItem.columnKey];
				if (oColumn) {
					fSetOrder(oColumnsItem, oColumn);
					fSetVisibility(oColumnsItem, oColumn);
				}
			}, this);
		}
		// TODO: Check why table rerendering is needed for m.table when column is moved; change of visibility works fine
		if (bTableInvalidateNeeded) {
			oTable.invalidate();
		}
	};

	/**
	 * Operations on columns are processed every time directly at the table. In case that something has been changed via Personalization Dialog or via
	 * user interaction at table, change is applied to the table.
	 *
	 * @param {object} oPersistentDataBase (new) JSON object
	 * @param {object} oPersistentDataCompare (old) JSON object
	 * @returns {object} that represents the change type, like: Unchanged || TableChanged || ModelChanged
	 */
	ColumnsController.prototype.getChangeType = function(oPersistentDataBase, oPersistentDataCompare) {
		var oChangeData = this.getChangeData(oPersistentDataBase, oPersistentDataCompare);
		// analytical table needs to re-read data from backend even in case a column was made invisible !
		var bNeedModelChange = Util.getTableType(this.getTable()) === sap.ui.comp.personalization.TableType.AnalyticalTable || this.getTriggerModelChangeOnColumnInvisible();
		if (oChangeData) {
			var oChangeType = sap.ui.comp.personalization.ChangeType.TableChanged;
			oChangeData.columns.columnsItems.some(function(oItem) {
				if (oItem.visible || (oItem.visible === false && bNeedModelChange)) {
					oChangeType = sap.ui.comp.personalization.ChangeType.ModelChanged;
					return true;
				}
				if (oItem.total === false || oItem.total === true) {
					oChangeType = sap.ui.comp.personalization.ChangeType.ModelChanged;
					return true;
				}
			});
			return oChangeType;
		}
		return sap.ui.comp.personalization.ChangeType.Unchanged;
	};

	/**
	 * Result is XOR based difference = oPersistentDataBase - oPersistentDataCompare (new - old)
	 *
	 * @param {object} oPersistentDataBase (new) JSON object which represents the current model state (Restore+PersistentData)
	 * @param {object} oPersistentDataCompare (old) JSON object which represents AlreadyKnown || Restore
	 * @returns {object} JSON object or null
	 */
	ColumnsController.prototype.getChangeData = function(oPersistentDataBase, oPersistentDataCompare) {
		// not valid
		if (!oPersistentDataCompare || !oPersistentDataCompare.columns || !oPersistentDataCompare.columns.columnsItems) {
			return null;
		}

		var oChangeData = {
			columns: Util.copy(oPersistentDataBase.columns)
		};

		// If no changes inside of columns.columnsItems array, return null.
		// Note: the order inside of columns.columnsItems array is irrelevant.
		var bIsEqual = true;
		bIsEqual = (oPersistentDataBase.columns.fixedColumnCount === oPersistentDataCompare.columns.fixedColumnCount);
		oPersistentDataBase.columns.columnsItems.some(function(oItem) {
			var oItemCompare = Util.getArrayElementByKey("columnKey", oItem.columnKey, oPersistentDataCompare.columns.columnsItems);
			if (!Util.semanticEqual(oItem, oItemCompare)) {
				// Leave forEach() as there are different items
				bIsEqual = false;
				return true;
			}
		});
		if (bIsEqual) {
			return null;
		}

		// If same items are different then delete equal properties and return the rest of item
		var aToBeDeleted = [];
		oChangeData.columns.columnsItems.forEach(function(oItem, iIndex) {
			var oItemCompare = Util.getArrayElementByKey("columnKey", oItem.columnKey, oPersistentDataCompare.columns.columnsItems);
			if (Util.semanticEqual(oItem, oItemCompare)) {
				// Condenser: remove items which are not changed in a chain
				aToBeDeleted.push(oItem);
				return;
			}
			for ( var property in oItem) {
				if (property === "columnKey" || !oItemCompare) {
					if (oItemCompare && oItemCompare[property] === undefined) {
						delete oItem[property];
					} else {
						continue;
					}
				}
				if (oItem[property] === oItemCompare[property]) {
					delete oItem[property];
				}
			}
			if (Object.keys(oItem).length < 2) {
				aToBeDeleted.push(oItem);
			}
		});
		aToBeDeleted.forEach(function(oItem) {
			var iIndex = Util.getIndexByKey("columnKey", oItem.columnKey, oChangeData.columns.columnsItems);
			oChangeData.columns.columnsItems.splice(iIndex, 1);
		});

		// If 'fixedColumnCount' is default then delete it
		if (oChangeData.columns.fixedColumnCount === 0) {
			delete oChangeData.columns.fixedColumnCount;
		}
		return oChangeData;
	};

	/**
	 * This method sorts a given ARRAY by a well defined property name of it's included objects. If it is required the array will be copied before.
	 *
	 * @param {array} aArrayToBeSorted is the array that shall be sorted by the given property
	 * @param {string} sPropertyName is the property name that shall be taken as sorting criteria
	 * @param {Boolean} bTakeACopy is optional and desides whether the given arry shall be copied before its content will be sorted
	 * @returns {object[]} aSortedArray is the sorted array
	 */
	ColumnsController.prototype._sortArrayByPropertyName = function(aArrayToBeSorted, sPropertyName, bTakeACopy) {
		var aSortedArray = [];

		if (bTakeACopy === null || bTakeACopy === undefined) {
			bTakeACopy = false;
		}

		if (aArrayToBeSorted && aArrayToBeSorted.length > 0 && sPropertyName !== undefined && sPropertyName !== null && sPropertyName !== "") {

			if (bTakeACopy) {
				aSortedArray = jQuery.extend(true, [], aArrayToBeSorted);
			} else {
				aSortedArray = aArrayToBeSorted;
			}

			aSortedArray.sort(function(a, b) {
				var propertyA = a[sPropertyName];
				var propertyB = b[sPropertyName];
				if (propertyA < propertyB || (propertyA !== undefined && propertyB === undefined)) {
					return -1;
				}
				if (propertyA > propertyB || (propertyA === undefined && propertyB !== undefined)) {
					return 1;
				}
				return 0;
			});
		}
		return aSortedArray;
	};

	/**
	 * @param {object} oPersistentDataBase: JSON object to which different properties from JSON oPersistentDataCompare are added. E.g. Restore
	 * @param {object} oPersistentDataCompare: JSON object from where the different properties are added to oPersistentDataBase. E.g. CurrentVariant ||
	 *        PersistentData
	 * @returns {object} new JSON object as union result of oPersistentDataBase and oPersistentDataCompare
	 */
	ColumnsController.prototype.getUnionData = function(oPersistentDataBase, oPersistentDataCompare) {
		var oPersistentDataBaseCopy = Util.copy(oPersistentDataBase);
		// oPersistentDataCompare is empty -> result = oPersistentDataBaseCopy
		if (!oPersistentDataCompare || !oPersistentDataCompare.columns || !oPersistentDataCompare.columns.columnsItems || (oPersistentDataCompare.columns.columnsItems.length === 0 && oPersistentDataCompare.columns.fixedColumnCount === undefined)) {
			return oPersistentDataBaseCopy.columns ? {
				columns: oPersistentDataBaseCopy.columns
			} : null;
		}

		// oPersistentDataBaseCopy is empty -> result = oPersistentDataCompare
		if (!oPersistentDataBaseCopy || !oPersistentDataBaseCopy.columns || !oPersistentDataBaseCopy.columns.columnsItems) {
			return {
				columns: jQuery.extend(true, {}, oPersistentDataCompare.columns)
			};
		}

		var aDeltaColumnsItem = [];

		var oUnion = this.createPersistentStructure();

		// Due to backwards compatibility (e.g. variant does not have 'fixedColumnCount')
		if (oPersistentDataCompare.columns.fixedColumnCount !== undefined) {
			oUnion.columns.fixedColumnCount = oPersistentDataCompare.columns.fixedColumnCount;
		}

		oPersistentDataBaseCopy.columns.columnsItems.forEach(function(oColumnsItemPersistent, iIndex) {
			var oColumnsItemDelta = Util.getArrayElementByKey("columnKey", oColumnsItemPersistent.columnKey, oPersistentDataCompare.columns.columnsItems);

			if (oColumnsItemDelta) {
				if (oColumnsItemDelta.visible !== undefined) {
					oColumnsItemPersistent.visible = oColumnsItemDelta.visible;
				}

				if (oColumnsItemDelta.width !== undefined) {
					oColumnsItemPersistent.width = oColumnsItemDelta.width;
				}

				if (oColumnsItemDelta.total !== undefined) {
					oColumnsItemPersistent.total = oColumnsItemDelta.total;
				}

				if (oColumnsItemDelta.index !== undefined) {
					oColumnsItemPersistent.index = oColumnsItemDelta.index;
					aDeltaColumnsItem.push(oColumnsItemPersistent);
					return;
				}
			}
			oUnion.columns.columnsItems.push(oColumnsItemPersistent);
		});

		if (aDeltaColumnsItem && aDeltaColumnsItem.length > 0) {
			this._sortArrayByPropertyName(aDeltaColumnsItem, "index");
			aDeltaColumnsItem.forEach(function(oDeltaColumnsItem) {
				oUnion.columns.columnsItems.splice(oDeltaColumnsItem.index, 0, oDeltaColumnsItem);
			});
		}

		oUnion.columns.columnsItems.forEach(function(oColumnsItemUnion, iIndex) {
			oColumnsItemUnion.index = iIndex;
		});

		return oUnion;
	};

	/**
	 * Determines whether a specific column is selected or not.
	 *
	 * @param {object} oPayload structure about the current selection coming from panel
	 * @param {string} sColumnKey column key of specific column
	 * @returns {boolean} true if specific column is selected, false if not
	 */
	ColumnsController.prototype.isColumnSelected = function(oPayload, oPersistentData, sColumnKey) {
		if (!oPayload) {
			oPersistentData.columnsItems.some(function(oColumnsItem, iIndex_) {
				if (oColumnsItem.columnKey === sColumnKey && oColumnsItem.visible) {
					iIndex = iIndex_;
					return true;
				}
			});
			return iIndex > -1;
		}

		// oPayload has been passed...
		if (!oPayload.selectedItems) {
			return false;
		}
		var iIndex = Util.getIndexByKey("columnKey", sColumnKey, oPayload.selectedItems);
		return iIndex > -1;
	};

	/**
	 * Creates, if not already exists, property <code>Visualizations</code> in <code>oDataSuiteFormat</code> object if at least one column item exists. Adds an entry for in <code>Visualizations</code> for each visible column of the current PersistentData snapshot.
	 * Additionally creates property <code>Total</code> in <code>oDataSuiteFormat</code> object if at least one column item with 'total=true' exists. The <code>Total</code> contains the current PersistentData snapshot.
	 * <b>Note:</b> the 'Label' property is not filled because it is translated text. For example if person 'A' sends via email the DataSuiteFormat in language 'a' the recipient person 'B' will be see the data in language 'a' instead of 'b'.
	 * @param {object} oDataSuiteFormat Structure of Data Suite Format
	 */
	ColumnsController.prototype.getDataSuiteFormatSnapshot = function(oDataSuiteFormat) {
		var oPersistentDataTotal = this.getUnionData(this.getPersistentDataRestore(), this.getPersistentData());
		if (!oPersistentDataTotal.columns || !oPersistentDataTotal.columns.columnsItems || !oPersistentDataTotal.columns.columnsItems.length) {
			return;
		}

		// Fill 'Total'
		var aColumnsItemsContainingTotal = oPersistentDataTotal.columns.columnsItems.filter(function(oColumnsItem) {
			return !!oColumnsItem.total;
		});
		if (aColumnsItemsContainingTotal.length) {
			oDataSuiteFormat.Total = aColumnsItemsContainingTotal.map(function(oColumnsItem) {
				return oColumnsItem.columnKey;
			});
		}

		// Fill 'Visualizations'
		// Filter all visible columnsItems and sort them by 'index'
		var aColumnsItemsVisible = oPersistentDataTotal.columns.columnsItems.filter(function(oColumnsItem) {
			return !!oColumnsItem.visible;
		});
		if (aColumnsItemsVisible.length) {
			if (!oDataSuiteFormat.Visualizations) {
				oDataSuiteFormat.Visualizations = [];
			}
			aColumnsItemsVisible.sort(this._sortByIndex);

			oDataSuiteFormat.Visualizations.push({
				Type: "LineItem",
				Content: aColumnsItemsVisible.map(function(oColumnsItem) {
					return {
						Value: oColumnsItem.columnKey,
						Label: undefined
					};
				})
			});
		}
	};

	ColumnsController.prototype._monkeyPatchTable = function(oTable) {
		if (Util.getTableBaseType(oTable) !== sap.ui.comp.personalization.TableType.Table) {
			return;
		}

		var that = this;
		var fSetFixedColumnCountOrigin = oTable.setFixedColumnCount.bind(oTable);
		var fSetFixedColumnCountOverwritten = function(iFixedColumnCount, bSuppressInvalidate) {
			that._onColumnFixedCount(iFixedColumnCount);
			fSetFixedColumnCountOrigin(iFixedColumnCount, bSuppressInvalidate);
		};
		if (oTable.setFixedColumnCount.toString() === fSetFixedColumnCountOverwritten.toString()) {
			// Do nothing if due to recursion the method is already overwritten.
			return;
		}
		oTable.setFixedColumnCount = fSetFixedColumnCountOverwritten;
	};

	/**
	 * Cleans up before destruction.
	 *
	 * @private
	 */
	ColumnsController.prototype.exit = function() {
		BaseController.prototype.exit.apply(this, arguments);

		var oTable = this.getTable();
		if (Util.getTableBaseType(oTable) === sap.ui.comp.personalization.TableType.Table) {
			oTable.detachColumnMove(this._onColumnMove, this);
			oTable.detachColumnVisibility(this._onColumnVisibility, this);
			oTable.detachColumnResize(this._onColumnResize, this);
		}
	};

	/* eslint-enable strict */

	return ColumnsController;

}, /* bExport= */true);
