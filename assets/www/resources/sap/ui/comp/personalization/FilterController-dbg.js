/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides FilterController
sap.ui.define([
	'jquery.sap.global', './BaseController', 'sap/m/library', './Util', './ChartWrapper', 'sap/ui/comp/filterbar/VariantConverterTo', 'sap/ui/comp/filterbar/VariantConverterFrom'
], function(jQuery, BaseController, library, Util, ChartWrapper, VariantConverterTo, VariantConverterFrom) {
	"use strict";

	/**
	 * The FilterController can be used to...
	 *
	 * @class Table Personalization Controller
	 * @extends sap.ui.comp.personalization.BaseController
	 * @author SAP
	 * @version 1.25.0-SNAPSHOT
	 * @private
	 * @alias sap.ui.comp.personalization.FilterController
	 */
	var FilterController = BaseController.extend("sap.ui.comp.personalization.FilterController",
	/** @lends sap.ui.comp.personalization.FilterController */
	{
		constructor: function(sId, mSettings) {
			BaseController.apply(this, arguments);
			this.setType(sap.m.P13nPanelType.filter);
		},
		metadata: {
			events: {
				afterFilterModelDataChange: {}
			}
		}
	});

	FilterController.prototype.setTable = function(oTable) {
		BaseController.prototype.setTable.apply(this, arguments);

		if (Util.getTableType(oTable) === sap.ui.comp.personalization.TableType.ChartWrapper) {
			oTable.detachExternalFiltersSet(this._onExternalFiltersSet, this);
			oTable.attachExternalFiltersSet(this._onExternalFiltersSet, this);
		}
	};

	FilterController.prototype._getTable2Json = function() {
		var oJsonData = this.createPersistentStructure();
		this._addPersistentData(this._mapTable2Json(this.getTable()), oJsonData);
		return oJsonData;
	};

	FilterController.prototype._getDataSuiteFormat2Json = function(oDataSuiteFormat) {
		var oJsonData = this.createPersistentStructure();
		this._addPersistentData(this._mapDataSuiteFormat2Json(oDataSuiteFormat), oJsonData);
		return oJsonData;
	};

	FilterController.prototype._addPersistentData = function(oSourceJsonData, oDestinationJsonData) {
		var oColumnKey2ColumnMap = this.getColumnMap(true);
		oSourceJsonData.filter.filterItems.forEach(function(oSourceItem) {
			if (!oSourceItem.isFiltered || !oColumnKey2ColumnMap[oSourceItem.columnKey]) {
				return;
			}
			oDestinationJsonData.filter.filterItems.push({
				columnKey: oSourceItem.columnKey,
				exclude: oSourceItem.exclude,
				operation: oSourceItem.operation,
				value1: oSourceItem.value1,
				value2: oSourceItem.value2
			});
		});
	};

	FilterController.prototype._mapTable2Json = function(oTable) {
		var oJsonData = this.createPersistentStructure();
		// This is not complete but the best we can do - problem is that the filter is not extractable from other table instances.
		if (Util.getTableBaseType(oTable) !== sap.ui.comp.personalization.TableType.Table) {
			return oJsonData;
		}
		oJsonData.filter.filterItems = oTable.getColumns().map(function(oColumn) {
			return {
				columnKey: Util.getColumnKey(oColumn),
				isFiltered: oColumn.getFiltered(),
				exclude: false,
				operation: oColumn.getFilterOperator(),
				value1: oColumn.getFilterValue(),
				value2: "" // The Column API does not provide method for 'value2'
			};
		});
		return oJsonData;
	};

	/**
	 * Note: DataSuiteFormat is applied on top of the initial state which is based on metadata. So e.g. several filtered columns can be applied.
	 * If more than one Range exists, the first one will be taken over.
	 * @param {object} oDataSuiteFormat
	 * @returns {object}
	 * @private
	 */
	FilterController.prototype._mapDataSuiteFormat2Json = function(oDataSuiteFormat) {
		var oJsonData = this.createPersistentStructure();
		if (!oDataSuiteFormat.SelectOptions || !oDataSuiteFormat.SelectOptions.length) {
			return oJsonData;
		}
		oJsonData.filter.filterItems = oDataSuiteFormat.SelectOptions.map(function(oSelectOption) {
			var oConvertedOption = VariantConverterFrom.convertOption(oSelectOption.Ranges[0].Option, oSelectOption.Ranges[0].Low);
			return {
				columnKey: oSelectOption.PropertyName,
				isFiltered: true,
				exclude: (oSelectOption.Ranges[0].Sign === "E"),
				operation: oConvertedOption.op,
				value1: oConvertedOption.v,
				value2: oSelectOption.Ranges[0].High
			};
		});
		return oJsonData;
	};

	FilterController.prototype.syncTable2TransientModel = function() {
		var oTable = this.getTable();
		var aItems = [];
		var oColumn;
		var sColumnKey;

		if (oTable) {
			var aBoolean, aValues, oBoolType;

			if (oTable.getModel() instanceof sap.ui.model.odata.ODataModel || oTable.getModel() instanceof sap.ui.model.odata.v2.ODataModel) {
				jQuery.sap.require("sap.ui.model.odata.type.Boolean");
				oBoolType = new sap.ui.model.odata.type.Boolean();
			} else {
				if (oTable.getModel() instanceof sap.ui.model.Model) {
					jQuery.sap.require("sap.ui.model.type.Boolean");
					oBoolType = new sap.ui.model.type.Boolean();
				}
			}

			if (oBoolType) {
				aBoolean = [
					"", oBoolType.formatValue(false, "string"), oBoolType.formatValue(true, "string")
				];
			}
			var oColumnKey2ColumnMap = this.getColumnMap(true);
			if (Util.getTableBaseType(oTable) === sap.ui.comp.personalization.TableType.Table) {
				for (sColumnKey in oColumnKey2ColumnMap) {
					oColumn = oColumnKey2ColumnMap[sColumnKey];
					if (Util.isFilterable(oColumn)) {
						if (Util.getColumnType(oColumn) === "boolean") {
							aValues = Util._getCustomProperty(oColumn, "values") || aBoolean;
						}
						aItems.push({
							columnKey: sColumnKey,
							text: oColumn.getLabel().getText(),
							tooltip: (oColumn.getTooltip() instanceof sap.ui.core.TooltipBase) ? oColumn.getTooltip().getTooltip_Text() : oColumn.getTooltip_Text(),
							maxLength: Util._getCustomProperty(oColumn, "maxLength"),
							precision: Util._getCustomProperty(oColumn, "precision"),
							scale: Util._getCustomProperty(oColumn, "scale"),
							type: Util.getColumnType(oColumn),
							values: aValues
						});
					}
				}
			} else if (Util.getTableType(oTable) === sap.ui.comp.personalization.TableType.ResponsiveTable) {
				for (sColumnKey in oColumnKey2ColumnMap) {
					oColumn = oColumnKey2ColumnMap[sColumnKey];
					if (Util.getColumnType(oColumn) === "boolean") {
						aValues = Util._getCustomProperty(oColumn, "values") || aBoolean;
					}
					if (Util.isFilterable(oColumn)) {
						aItems.push({
							columnKey: sColumnKey,
							text: oColumn.getHeader().getText(),
							tooltip: (oColumn.getHeader().getTooltip() instanceof sap.ui.core.TooltipBase) ? oColumn.getHeader().getTooltip().getTooltip_Text() : oColumn.getHeader().getTooltip_Text(),
							maxLength: Util._getCustomProperty(oColumn, "maxLength"),
							precision: Util._getCustomProperty(oColumn, "precision"),
							scale: Util._getCustomProperty(oColumn, "scale"),
							type: Util.getColumnType(oColumn),
							values: aValues
						});
					}
				}
			} else if (Util.getTableType(oTable) === sap.ui.comp.personalization.TableType.ChartWrapper) {
				for (sColumnKey in oColumnKey2ColumnMap) {
					oColumn = oColumnKey2ColumnMap[sColumnKey];
					if (Util.isFilterable(oColumn)) {
						aItems.push({
							columnKey: sColumnKey,
							text: oColumn.getLabel(),
							tooltip: (oColumn.getTooltip() instanceof sap.ui.core.TooltipBase) ? oColumn.getTooltip().getTooltip_Text() : oColumn.getTooltip_Text(),
							maxLength: Util._getCustomProperty(oColumn, "maxLength"),
							precision: Util._getCustomProperty(oColumn, "precision"),
							scale: Util._getCustomProperty(oColumn, "scale"),
							type: Util.getColumnType(oColumn),
							values: aValues
						});
					}
				}
			}
		}

		Util.sortItemsByText(aItems, "text");

		// check if Items was changed at all and take over if it was changed
		var oItemsBefore = this.getModel("$sapuicomppersonalizationBaseController").getData().transientData.filter.items;
		if (jQuery(aItems).not(oItemsBefore).length !== 0 || jQuery(oItemsBefore).not(aItems).length !== 0) {
			this.getModel("$sapuicomppersonalizationBaseController").getData().transientData.filter.items = aItems;
		}
	};

	// FilterController.prototype._onFilter = function(oEvent) {
	// // TODO: implement this method. Currently SmartTable does not support filtering directly on the table, only via
	// // personalization dialog
	//
	// // Siehe: sap.ui.table.Column.prototype.filter() und sap.ui.table.Column.prototype._getFilter()
	//
	// // operation: soll Type abhängig sein, z.B. Contains bei String, und Equal bei Number und Boolean...
	// // Was wird in der Spalte erwarten: true oder on?
	// // Wird von Menu her "Between" unterstützt?
	// // Kann man mehrere Werte für ein Column eingeben?
	// // Wenn es in Personalization Dialog mehrere Filter für eine Spalte denifiert sind, was soll in Filter Input field angezeigt werden?
	// // Wo bekommt man den Typen her?
	// // Date soll konvertiert werden...
	//
	// this.fireBeforePotentialTableChange();
	//
	// var oColumn = oEvent.getParameter("column");
	// var sValue = oEvent.getParameter("value");
	// var oFilterData = this.getModel("$sapuicomppersonalizationBaseController").getData().persistentData.filter;
	// var sColumnKey = Util.getColumnKey(oColumn);
	// var i = Util.getIndexByKey("columnKey", sColumnKey, oFilterData.filterItems);
	//
	// if (i > -1) {
	// oFilterData.filterItems.splice(i, 1);
	// }
	// oFilterData.filterItems.push({
	// columnKey: sColumnKey,
	// operation: "Contains",
	// value1: sValue,
	// value2: undefined
	// });
	//
	// this.fireAfterPotentialTableChange();
	//
	// this.fireAfterFilterModelDataChange();
	// };

	FilterController.prototype._onExternalFiltersSet = function(oEvent) {
		var oModel = this.getModel("$sapuicomppersonalizationBaseController");
		var oData = oModel.getData();
		var oColumnKey2ColumnMap = this.getColumnMap(true);

		this.fireBeforePotentialTableChange();

		// Remove all 'chart' specific filters coming outside
		oData.persistentData.filter.filterItems = oData.persistentData.filter.filterItems.filter(function(oFilterItem) {
			return oFilterItem.source !== "chart";
		});

		// Add all 'chart' specific filters
		oEvent.getParameters().filters.forEach(function(oFilterItem) {
			if (oFilterItem && oFilterItem.getColumnKey() && oFilterItem.getOperation()) {
				var oColumn = oColumnKey2ColumnMap[oFilterItem.getColumnKey()];
				if (!oColumn) {
					return;
				}
				var oMFilterItem = {
					columnKey: oFilterItem.getColumnKey(),
					operation: oFilterItem.getOperation(),
					value1: oFilterItem.getValue1(),
					value2: oFilterItem.getValue2(),
					source: "chart"
				};
				if (this._hasSemanticEqual(oMFilterItem, oData.persistentData.filter.filterItems)) {
					return;
				}
				oData.persistentData.filter.filterItems.push(oMFilterItem);
			}
		}, this);
		oModel.refresh();

		this.fireAfterPotentialTableChange();

		this.fireAfterFilterModelDataChange();
	};

	FilterController.prototype._hasSemanticEqual = function(oFilterItem, aFilterItems) {
		if (!oFilterItem || !aFilterItems.length) {
			return false;
		}
		var aEqualFilterItems = aFilterItems.filter(function(oFilterItem_) {
			for ( var property in oFilterItem) {
				if (oFilterItem[property] !== oFilterItem_[property]) {
					return false;
				}
			}
			return true;
		});
		return aEqualFilterItems.length > 0;
	};

	FilterController.prototype.getPanel = function(oPayload) {

		sap.ui.getCore().loadLibrary("sap.m");

		jQuery.sap.require("sap/m/P13nFilterPanel");
		jQuery.sap.require("sap/m/P13nItem");
		jQuery.sap.require("sap/m/P13nFilterItem");

		if (!this.getColumnHelper().hasFilterableColumns()) {
			return null;
		}
		if (oPayload && oPayload.column) {
			var sColumnKey = Util.getColumnKey(oPayload.column);
			if (sColumnKey) {

				var aItems = this.getModel("$sapuicomppersonalizationBaseController").getData().transientData.filter.items;

				aItems.forEach(function(oItem) {
					oItem["isDefault"] = oItem.columnKey === sColumnKey;
				});
			}
		}
		var that = this;
		var oPanel = new sap.m.P13nFilterPanel({
			containerQuery: true,
			items: {
				path: "$sapmP13nPanel>/transientData/filter/items",
				template: new sap.m.P13nItem({
					columnKey: '{$sapmP13nPanel>columnKey}',
					text: "{$sapmP13nPanel>text}",
					tooltip: "{$sapmP13nPanel>tooltip}",
					maxLength: "{$sapmP13nPanel>maxLength}",
					precision: "{$sapmP13nPanel>precision}",
					scale: "{$sapmP13nPanel>scale}",
					type: "{$sapmP13nPanel>type}",
					isDefault: "{$sapmP13nPanel>isDefault}",
					values: "{$sapmP13nPanel>values}"
				})
			},
			filterItems: {
				path: "$sapmP13nPanel>/persistentData/filter/filterItems",
				template: new sap.m.P13nFilterItem({
					key: "{$sapmP13nPanel>key}",
					columnKey: "{$sapmP13nPanel>columnKey}",
					exclude: "{$sapmP13nPanel>exclude}",
					operation: "{$sapmP13nPanel>operation}",
					value1: "{$sapmP13nPanel>value1}",
					value2: "{$sapmP13nPanel>value2}"
				})
			},
			beforeNavigationTo: that.setModelFunction()
		});

		var fSuggestCallback = function(oControl, sFieldName) {

			var oColumnKey2ColumnMap = this.getColumnMap(true);
			var oColumn = oColumnKey2ColumnMap[sFieldName];
			var sFullyQualifiedFieldName = Util._getCustomProperty(oColumn, "fullName");

			if (sFullyQualifiedFieldName) {
				jQuery.sap.require("sap.ui.comp.providers.ValueListProvider");
				oControl.setShowSuggestion(true);
				oControl.setFilterSuggests(false);
				oControl.setModel(this.getTable().getModel()); // the control which should show suggest need the model from the table assigned

				return new sap.ui.comp.providers.ValueListProvider({
					control: oControl,
					fieldName: sFieldName,
					typeAheadEnabled: true,
					aggregation: "suggestionRows",
					// displayFormat: this.sDisplayFormat,
					resolveInOutParams: false,
					loadAnnotation: true,
					fullyQualifiedFieldName: sFullyQualifiedFieldName,
					model: this.getTable().getModel(),
					enableShowTableSuggestionValueHelp: false
				});
			}
		}.bind(this);

		oPanel._oIncludeFilterPanel._fSuggestCallback = fSuggestCallback;
		oPanel._oExcludeFilterPanel._fSuggestCallback = fSuggestCallback;

		oPanel.attachAddFilterItem(function(oEvent) {
			var oData = this.getModel("$sapuicomppersonalizationBaseController").getData();
			var params = oEvent.getParameters();
			var oFilterItem = {
				columnKey: params.filterItemData.getColumnKey(),
				operation: params.filterItemData.getOperation(),
				exclude: params.filterItemData.getExclude(),
				value1: params.filterItemData.getValue1(),
				value2: params.filterItemData.getValue2()
			};
			if (params.index > -1) {
				oData.persistentData.filter.filterItems.splice(params.index, 0, oFilterItem);
			} else {
				oData.persistentData.filter.filterItems.push(oFilterItem);
			}
			this.getModel("$sapuicomppersonalizationBaseController").setData(oData, true);
		}, this);

		oPanel.attachRemoveFilterItem(function(oEvent) {
			var params = oEvent.getParameters();
			var oData = this.getModel("$sapuicomppersonalizationBaseController").getData();
			if (params.index > -1) {
				oData.persistentData.filter.filterItems.splice(params.index, 1);
				this.getModel("$sapuicomppersonalizationBaseController").setData(oData, true);
			}
		}, this);

		return oPanel;
	};

	// FilterController.prototype.onBeforeSubmit = function() {
	// };

	FilterController.prototype.syncJsonModel2Table = function(oJsonModel) {
		var oColumnKey2ColumnMap = this.getColumnMap();
		var oColumnKey2ColumnMapUnfiltered = jQuery.extend(true, {}, oColumnKey2ColumnMap);

		this.fireBeforePotentialTableChange();

		if (Util.getTableBaseType(this.getTable()) === sap.ui.comp.personalization.TableType.Table) {
			oJsonModel.filter.filterItems.forEach(function(oFilterItem) {
				var oColumn = oColumnKey2ColumnMap[oFilterItem.columnKey];
				if (oColumn) {
					if (!oColumn.getFiltered()) {
						oColumn.setFiltered(true);
					}
					delete oColumnKey2ColumnMapUnfiltered[oFilterItem.columnKey];
				}
			});

			for ( var sColumnKey in oColumnKey2ColumnMapUnfiltered) {
				var oColumn = oColumnKey2ColumnMapUnfiltered[sColumnKey];
				if (oColumn && oColumn.getFiltered()) {
					oColumn.setFiltered(false);
				}
			}
		}

		this.fireAfterPotentialTableChange();
	};

	/**
	 * Operations on filter are processed sometime directly at the table and sometime not. In case that something has been changed via Personalization
	 * Dialog the consumer of the Personalization Dialog has to apply filtering at the table. In case that filter has been changed via user
	 * interaction at table, the change is instantly applied at the table.
	 */
	FilterController.prototype.getChangeType = function(oPersistentDataBase, oPersistentDataCompare) {
		if (!oPersistentDataCompare || !oPersistentDataCompare.filter || !oPersistentDataCompare.filter.filterItems) {
			return sap.ui.comp.personalization.ChangeType.Unchanged;
		}

		if (oPersistentDataCompare && oPersistentDataCompare.filter && oPersistentDataCompare.filter.filterItems) {
			oPersistentDataCompare.filter.filterItems.forEach(function(oFilterItem) {
				delete oFilterItem.key;
				delete oFilterItem.source;
			});
		}
		if (oPersistentDataBase && oPersistentDataBase.filter && oPersistentDataBase.filter.filterItems) {
			oPersistentDataBase.filter.filterItems.forEach(function(oFilterItem) {
				delete oFilterItem.key;
				delete oFilterItem.source;
			});
		}
		var bIsDirty = JSON.stringify(oPersistentDataBase.filter.filterItems) !== JSON.stringify(oPersistentDataCompare.filter.filterItems);

		return bIsDirty ? sap.ui.comp.personalization.ChangeType.ModelChanged : sap.ui.comp.personalization.ChangeType.Unchanged;
	};

	/**
	 * Result is XOR based difference = CurrentModelData - oPersistentDataCompare
	 *
	 * @param {object} oPersistentDataCompare JSON object. Note: if sortItems is [] then it means that all sortItems have been deleted
	 * @returns {object} JSON object or null
	 */
	FilterController.prototype.getChangeData = function(oPersistentDataBase, oPersistentDataCompare) {
		if (!oPersistentDataBase || !oPersistentDataBase.filter || !oPersistentDataBase.filter.filterItems) {
			return this.createPersistentStructure();
		}

		if (oPersistentDataCompare && oPersistentDataCompare.filter && oPersistentDataCompare.filter.filterItems) {
			oPersistentDataCompare.filter.filterItems.forEach(function(oFilterItem) {
				delete oFilterItem.key;
				delete oFilterItem.source;
			});
		}
		if (oPersistentDataBase && oPersistentDataBase.filter && oPersistentDataBase.filter.filterItems) {
			oPersistentDataBase.filter.filterItems.forEach(function(oFilterItem) {
				delete oFilterItem.key;
				delete oFilterItem.source;
			});
		}

		if (!oPersistentDataCompare || !oPersistentDataCompare.filter || !oPersistentDataCompare.filter.filterItems) {
			return {
				filter: Util.copy(oPersistentDataBase.filter)
			};
		}

		if (JSON.stringify(oPersistentDataBase.filter.filterItems) !== JSON.stringify(oPersistentDataCompare.filter.filterItems)) {
			return {
				filter: Util.copy(oPersistentDataBase.filter)
			};
		}
		return null;
	};

	/**
	 * @param {object} oPersistentDataBase: JSON object to which different properties from JSON oPersistentDataCompare are added
	 * @param {object} oPersistentDataCompare: JSON object from where the different properties are added to oPersistentDataBase. Note: if filterItems
	 *        is [] then it means that all filterItems have been deleted
	 * @returns {object} JSON object as union result of oPersistentDataBase and oPersistentDataCompare
	 */
	FilterController.prototype.getUnionData = function(oPersistentDataBase, oPersistentDataCompare) {
		if (!oPersistentDataBase || !oPersistentDataBase.filter || !oPersistentDataBase.filter.filterItems) {
			return this.createPersistentStructure();
		}

		if (!oPersistentDataCompare || !oPersistentDataCompare.filter || !oPersistentDataCompare.filter.filterItems) {
			return {
				filter: Util.copy(oPersistentDataBase.filter)
			};
		}

		return {
			filter: Util.copy(oPersistentDataCompare.filter)
		};
	};

	/**
	 * Creates property <code>SelectOptions</code> in <code>oDataSuiteFormat</code> object if at least one filter item exists. The <code>SelectOptions</code> contains the current PersistentData snapshot.
	 * @param {object} oDataSuiteFormat Structure of Data Suite Format
	 */
	FilterController.prototype.getDataSuiteFormatSnapshot = function(oDataSuiteFormat) {
		var oPersistentDataTotal = this.getUnionData(this.getPersistentDataRestore(), this.getPersistentData());
		if (!oPersistentDataTotal.filter || !oPersistentDataTotal.filter.filterItems || !oPersistentDataTotal.filter.filterItems.length) {
			return;
		}
		oPersistentDataTotal.filter.filterItems.forEach(function(oFilterItem) {
			var aRanges = VariantConverterTo.addRangeEntry(oDataSuiteFormat, oFilterItem.columnKey);
			VariantConverterTo.addRanges(aRanges, [
				oFilterItem
			]);
		});
	};

	/**
	 * Cleans up before destruction.
	 *
	 * @private
	 */
	FilterController.prototype.exit = function() {
		BaseController.prototype.exit.apply(this, arguments);

		var oTable = this.getTable();
		if (Util.getTableType(oTable) === sap.ui.comp.personalization.TableType.ChartWrapper) {
			oTable.detachExternalFiltersSet(this._onExternalFiltersSet, this);
		}
	};

	return FilterController;

}, /* bExport= */true);
