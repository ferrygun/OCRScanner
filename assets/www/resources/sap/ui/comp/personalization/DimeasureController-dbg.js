/* eslint-disable strict */

/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides DimeasureController
sap.ui.define([
	'jquery.sap.global', './BaseController', 'sap/m/library', 'sap/ui/comp/library', './ChartWrapper', './Util'
], function(jQuery, BaseController, MLibrary, CompLibrary, ChartWrapper, Util) {
	"use strict";

	/**
	 * The DimeasureController can be used to...
	 *
	 * @class Table Personalization Controller
	 * @extends sap.ui.comp.personalization.BaseController
	 * @author SAP SE
	 * @version 1.52.4
	 * @private
	 * @since 1.34.0
	 * @alias sap.ui.comp.DimeasureController
	 */
	var DimeasureController = BaseController.extend("sap.ui.comp.personalization.DimeasureController", /** @lends sap.ui.comp.personalization.DimeasureController */

	{
		constructor: function(sId, mSettings) {
			BaseController.apply(this, arguments);
			this.setType(sap.m.P13nPanelType.dimeasure);
		},
		metadata: {
			events: {
				afterDimeasureModelDataChange: {}
			}
		}
	});

	DimeasureController.prototype.setTable = function(oTable) {
		BaseController.prototype.setTable.apply(this, arguments);

		if (Util.getTableType(oTable) !== sap.ui.comp.personalization.TableType.ChartWrapper) {
			throw "The provided object is incorrect. 'oTable' has to be an instance of sap.ui.comp.personalization.ChartWrapper. ";
		}

		var oChart = oTable.getChartObject();
		oChart.detachDrilledDown(this._onDrilledDown, this);
		oChart.attachDrilledDown(this._onDrilledDown, this);
		oChart.detachDrilledUp(this._onDrilledUp, this);
		oChart.attachDrilledUp(this._onDrilledUp, this);

		var that = this;
		var fSetChartTypeOrigin = oChart.setChartType.bind(oChart);
		var fSetChartTypeOverwritten = function(sChartType) {
			fSetChartTypeOrigin(sChartType);
			var oModel = that.getModel("$sapuicomppersonalizationBaseController");
			var oData = oModel.getData();
			if (sChartType && sChartType !== oData.persistentData.dimeasure.chartTypeKey) {
				that.fireBeforePotentialTableChange();
				oData.persistentData.dimeasure.chartTypeKey = sChartType;
				that.fireAfterPotentialTableChange();
				that.fireAfterDimeasureModelDataChange();
			}
		};
		if (oChart.setChartType.toString() === fSetChartTypeOverwritten.toString()) {
			// Do nothing if due to recursion the method is already overwritten.
			return;
		}
		oChart.setChartType = fSetChartTypeOverwritten;
	};

	DimeasureController.prototype._onDrilledDown = function(oEvent) {
		this._updateModel(oEvent.getSource());
	};

	DimeasureController.prototype._onDrilledUp = function(oEvent) {
		this._updateModel(oEvent.getSource());
	};

	DimeasureController.prototype._updateModel = function(oChart) {
		var oModel = this.getModel("$sapuicomppersonalizationBaseController");
		var oData = oModel.getData();
		var oColumnKey2ColumnMap = this.getColumnMap();

		this.fireBeforePotentialTableChange();

		// Take over visible dimensions and measures as dimMeasureItems into model
		oData.persistentData.dimeasure.dimeasureItems = [];

		oChart.getVisibleDimensions().forEach(function(sDimensionName) {
			var oColumn = oColumnKey2ColumnMap[sDimensionName];
			oData.persistentData.dimeasure.dimeasureItems.push({
				columnKey: sDimensionName,
				index: oData.persistentData.dimeasure.dimeasureItems.length,
				visible: true,
				role: oColumn.getRole()
			});
		});
		oChart.getVisibleMeasures().forEach(function(sMeasureName) {
			var oColumn = oColumnKey2ColumnMap[sMeasureName];
			oData.persistentData.dimeasure.dimeasureItems.push({
				columnKey: sMeasureName,
				index: oData.persistentData.dimeasure.dimeasureItems.length,
				visible: true,
				role: oColumn.getRole()
			});
		});
		oModel.refresh();

		this.fireAfterPotentialTableChange();

		this.fireAfterDimeasureModelDataChange();
	};

	DimeasureController.prototype.createPersistentStructure = function(aItems) {
		var oPersistentData = BaseController.prototype.createPersistentStructure.apply(this, arguments);
		oPersistentData.dimeasure.chartTypeKey = "";
		return oPersistentData;
	};

	DimeasureController.prototype.syncJsonModel2Table = function(oJsonModel) {
		var oTable = this.getTable();
		var oChart = oTable.getChartObject();
		var aDimensionItems = [];
		var aMeasureItems = [];
		var fUpdateSelectedEntities = function(aDimeasureItems, aSelectedEntitiesOld, fSetSelectedEntities, fGetDimeasureByName) {
			var aDimeasureItemsCopy = Util.copy(aDimeasureItems);
			aDimeasureItemsCopy.sort(DimeasureController._sortByIndex);
			var aSelectedEntitiesNew = [];
			aDimeasureItemsCopy.forEach(function(oDimeasureItem) {
				if (oDimeasureItem.visible === true) {
					aSelectedEntitiesNew.push(oDimeasureItem.columnKey);
					var oDimeasure = fGetDimeasureByName(oDimeasureItem.columnKey);
					if (oDimeasure) {
						oDimeasure.setRole(oDimeasureItem.role);
					}
				}
			});
			if (JSON.stringify(aSelectedEntitiesNew) !== JSON.stringify(aSelectedEntitiesOld)) {
				fSetSelectedEntities(aSelectedEntitiesNew);
			}
		};

		// Apply changes to the Chart
		this.fireBeforePotentialTableChange();

		Util.splitDimeasures(oJsonModel.dimeasure.dimeasureItems, this.getModel("$sapuicomppersonalizationBaseController").getData().transientData.dimeasure.items, aDimensionItems, aMeasureItems);

		var aVisibleDimensions = oChart.getVisibleDimensions();
		fUpdateSelectedEntities(aDimensionItems, aVisibleDimensions, oChart.setVisibleDimensions.bind(oChart), oChart.getDimensionByName.bind(oChart));
		var aVisibleMeasures = oChart.getVisibleMeasures();
		fUpdateSelectedEntities(aMeasureItems, aVisibleMeasures, oChart.setVisibleMeasures.bind(oChart), oChart.getMeasureByName.bind(oChart));

		oChart.setChartType(oJsonModel.dimeasure.chartTypeKey);

		this.fireAfterPotentialTableChange();
	};

	/**
	 * Does a complete JSON snapshot of the current table instance ("original") from the perspective of the columns controller; the JSON snapshot can
	 * later be applied to any table instance to recover all columns related infos of the "original" table
	 *
	 * @returns {objects} JSON objects with meta data from existing table columns
	 */
	DimeasureController.prototype._getTable2Json = function() {
		var oJsonData = this.createPersistentStructure();
		this._addPersistentData(this._mapTable2Json(this.getTable()), oJsonData);
		return oJsonData;
	};

	DimeasureController.prototype._getDataSuiteFormat2Json = function(oDataSuiteFormat) {
		var oJsonData = this.createPersistentStructure();
		this._addPersistentData(this._mapDataSuiteFormat2Json(oDataSuiteFormat), oJsonData);
		return oJsonData;
	};

	DimeasureController.prototype._addPersistentData = function(oSourceJsonData, oDestinationJsonData) {
		var oColumnKey2ColumnMap = this.getColumnMap(true);
		oDestinationJsonData.dimeasure.chartTypeKey = oSourceJsonData.dimeasure.chartTypeKey;
		oSourceJsonData.dimeasure.dimeasureItems.forEach(function(oSourceItem) {
			if (!oColumnKey2ColumnMap[oSourceItem.columnKey]) {
				return;
			}
			oDestinationJsonData.dimeasure.dimeasureItems.push({
				columnKey: oSourceItem.columnKey,
				index: oSourceItem.index,
				visible: oSourceItem.visible,
				role: oSourceItem.role
			});
		});
	};

	DimeasureController.prototype._mapTable2Json = function(oTable) {
		var oJsonData = this.createPersistentStructure();
		if (!oTable) {
			return oJsonData;
		}
		var oChart = oTable.getChartObject();
		var aVisibleDimensionNames = oChart.getVisibleDimensions();
		var aVisibleMeasureNames = oChart.getVisibleMeasures();
		var oColumnKey2ColumnMap = this.getColumnMap(true);
		var aDimensionItems = aVisibleDimensionNames.filter(function(sDimensionName) {
			return (oColumnKey2ColumnMap[sDimensionName] && (oColumnKey2ColumnMap[sDimensionName].getAggregationRole() === sap.ui.comp.personalization.AggregationRole.Dimension || oColumnKey2ColumnMap[sDimensionName].getAggregationRole() === sap.ui.comp.personalization.AggregationRole.Measure));
		}).map(function(sDimensionName, iIndex) {
			return {
				columnKey: sDimensionName,
				index: iIndex,
				visible: true,
				role: oColumnKey2ColumnMap[sDimensionName].getRole()
			};
		});
		var aMeasureItems = aVisibleMeasureNames.filter(function(sMeasureName) {
			return (oColumnKey2ColumnMap[sMeasureName] && (oColumnKey2ColumnMap[sMeasureName].getAggregationRole() === sap.ui.comp.personalization.AggregationRole.Dimension || oColumnKey2ColumnMap[sMeasureName].getAggregationRole() === sap.ui.comp.personalization.AggregationRole.Measure));
		}).map(function(sMeasureName, iIndex) {
			return {
				columnKey: sMeasureName,
				index: aDimensionItems.length + iIndex,
				visible: true,
				role: oColumnKey2ColumnMap[sMeasureName].getRole()
			};
		});
		oJsonData.dimeasure.chartTypeKey = oChart.getChartType();
		oJsonData.dimeasure.dimeasureItems = aDimensionItems.concat(aMeasureItems);
		return oJsonData;
	};

	/**
	 * <b>Note:</b> 1. If more than one 'Chart' in <code>oDataSuiteFormat</code> exists, the first one is taken over.
	 *  			2. If 'Role' is not provided with <code>oDataSuiteFormat</code> then the default value of property 'role' is taken.
	 * @param {object} oDataSuiteFormat
	 * @returns {Object}
	 * @private
	 */
	DimeasureController.prototype._mapDataSuiteFormat2Json = function(oDataSuiteFormat) {
		var oJsonData = this.createPersistentStructure();
		if (!oDataSuiteFormat.Visualizations || !oDataSuiteFormat.Visualizations.length) {
			return oJsonData;
		}
		var aChartVisualizations = oDataSuiteFormat.Visualizations.filter(function(oVisualization) {
			return oVisualization.Type === "Chart";
		});
		if (!aChartVisualizations.length) {
			return oJsonData;
		}
		var aDimensionItems = [];
		if (aChartVisualizations[0].Content.Dimensions.length && aChartVisualizations[0].Content.DimensionAttributes.length) {
			aDimensionItems = aChartVisualizations[0].Content.Dimensions.map(function(sDimensionName, iIndex) {
				var oDimensionAttribute = Util.getArrayElementByKey("Dimension", sDimensionName, aChartVisualizations[0].Content.DimensionAttributes);
				return {
					columnKey: sDimensionName,
					index: iIndex,
					visible: true,
					role: oDimensionAttribute ? oDimensionAttribute.Role : this._getDefaultValueOfProperty("role", sDimensionName, "Dimension")
				};
			}, this);
		}
		var aMeasureItems = [];
		if (aChartVisualizations[0].Content.Measures.length && aChartVisualizations[0].Content.MeasureAttributes.length) {
			aMeasureItems = aChartVisualizations[0].Content.Measures.map(function(sMeasureName, iIndex) {
				var oMeasureAttribute = Util.getArrayElementByKey("Measure", sMeasureName, aChartVisualizations[0].Content.MeasureAttributes);
				return {
					columnKey: sMeasureName,
					index: aDimensionItems.length + iIndex,
					visible: true,
					role: oMeasureAttribute ? oMeasureAttribute.Role : this._getDefaultValueOfProperty("role", sMeasureName, "Measure")
				};
			}, this);
		}
		oJsonData.dimeasure.dimeasureItems = aDimensionItems.concat(aMeasureItems);
		// Note: if runtime error occurs because sap.chart library has not been loaded (there is dependency to sap.chart inside of sap.ui.comp.odata.ChartMetadata) then the caller of DimeasureController has to load the sap.chart library.
		oJsonData.dimeasure.chartTypeKey = sap.ui.comp.odata.ChartMetadata.getChartType(aChartVisualizations[0].Content.ChartType);
		return oJsonData;
	};

	DimeasureController.prototype._getDefaultValueOfProperty = function(sPropertyName, sColumnKey, sType) {
		var oTable = this.getTable();
		if (oTable && sType === "Dimension") {
			return oTable.getChartObject().getDimensionByName(sColumnKey).getMetadata().getProperty(sPropertyName).getDefaultValue();
		} else if (oTable && sType === "Measure") {
			return oTable.getChartObject().getMeasureByName(sColumnKey).getMetadata().getProperty(sPropertyName).getDefaultValue();
		}
		return undefined;
	};

	/**
	 * The restore structure is build based on <code>aColumnKeys</code> which contains all possible column keys. For those columns which are
	 * currently not part of table only 'columnKey' and 'index' come from column.
	 *
	 * @param {array} aColumnKeys Contains column key of all possible column
	 * @returns {objects} JSON objects with meta data from existing table columns
	 */
	DimeasureController.prototype._getTable2JsonRestore = function(aColumnKeys) {
		if (!aColumnKeys) {
			return BaseController.prototype._getTable2JsonRestore.apply(this, arguments);
		}
		var oJsonData = this.createPersistentStructure();
		var aIgnoreColumnKeys = this.getIgnoreColumnKeys();
		var oColumnKey2ColumnMap = this.getColumnMap();

		var oChart = this.getTable().getChartObject();
		var aVisibleDimensionNames = oChart.getVisibleDimensions();
		var aVisibleMeasureNames = oChart.getVisibleMeasures();

		var iIndex = 0;
		aColumnKeys.forEach(function(sColumnKey) {
			if (aIgnoreColumnKeys.indexOf(sColumnKey) > -1) {
				return;
			}
			if (oColumnKey2ColumnMap[sColumnKey].getAggregationRole() === sap.ui.comp.personalization.AggregationRole.NotDimeasure) {
				return;
			}
			oJsonData.dimeasure.dimeasureItems.push({
				columnKey: sColumnKey,
				index: iIndex,
				visible: aVisibleDimensionNames.indexOf(sColumnKey) > -1 || aVisibleMeasureNames.indexOf(sColumnKey) > -1,
				role: oColumnKey2ColumnMap[sColumnKey].getRole()
			});
			iIndex++;
		});
		oJsonData.dimeasure.chartTypeKey = oChart.getChartType();
		return oJsonData;
	};

	DimeasureController.prototype.syncTable2TransientModel = function() {
		var aItems = [];
		var oTable = this.getTable();
		if (!oTable) {
			return;
		}

		var oColumnKey2ColumnMap = this.getColumnMap(true);
		for ( var sColumnKey in oColumnKey2ColumnMap) {
			var oColumn = oColumnKey2ColumnMap[sColumnKey];
			if (oColumn.getAggregationRole() === sap.ui.comp.personalization.AggregationRole.NotDimeasure) {
				continue;
			}
			aItems.push({
				columnKey: sColumnKey,
				text: oColumn.getLabel(),
				tooltip: oColumn.getTooltip(),
				// visible: oColumn.getSelected(),
				aggregationRole: oColumn.getAggregationRole()
			});
		}

		// check if Items was changed at all and take over if it was changed
		var aItemsBefore = this.getModel("$sapuicomppersonalizationBaseController").getData().transientData.dimeasure.items;
		if (jQuery(aItems).not(aItemsBefore).length !== 0 || jQuery(aItemsBefore).not(aItems).length !== 0) {
			this.getModel("$sapuicomppersonalizationBaseController").getData().transientData.dimeasure.items = aItems;
		}
	};

	/**
	 * Returns a ColumnsPanel control
	 *
	 * @returns {sap.m.P13nDimMeasurePanel} returns a new created ColumnsPanel
	 */
	DimeasureController.prototype.getPanel = function(oPayload) {

		sap.ui.getCore().loadLibrary("sap.m");
		jQuery.sap.require("sap/m/P13nDimMeasurePanel");
		jQuery.sap.require("sap/m/P13nItem");
		jQuery.sap.require("sap/m/P13nDimMeasureItem");

		var that = this;
		var aAvailableChartTypes = [];
		if (oPayload && oPayload.availableChartTypes) {
			aAvailableChartTypes = oPayload.availableChartTypes;
		}
		var oPanel = new sap.m.P13nDimMeasurePanel({
			availableChartTypes: aAvailableChartTypes,
			chartTypeKey: "{$sapmP13nPanel>/persistentData/dimeasure/chartTypeKey}",
			items: {
				path: '$sapmP13nPanel>/transientData/dimeasure/items',
				template: new sap.m.P13nItem({
					columnKey: '{$sapmP13nPanel>columnKey}',
					text: '{$sapmP13nPanel>text}',
					tooltip: '{$sapmP13nPanel>tooltip}',
					aggregationRole: '{$sapmP13nPanel>aggregationRole}'
				})
			},
			dimMeasureItems: {
				path: "$sapmP13nPanel>/persistentData/dimeasure/dimeasureItems",
				template: new sap.m.P13nDimMeasureItem({
					columnKey: "{$sapmP13nPanel>columnKey}",
					index: "{$sapmP13nPanel>index}",
					visible: "{$sapmP13nPanel>visible}",
					role: "{$sapmP13nPanel>role}"
				})
			},
			beforeNavigationTo: that.setModelFunction(),
			changeChartType: function(oEvent) {
				that.getModel("$sapuicomppersonalizationBaseController").setProperty("/persistentData/dimeasure/chartTypeKey", oEvent.getParameter("chartTypeKey"));
			},
			changeDimMeasureItems: function(oEvent) {
				var aMDimeasureItems = [];
				oEvent.getParameter("items").forEach(function(oMItem) {
					aMDimeasureItems.push({
						columnKey: oMItem.columnKey,
						index: oMItem.index,
						visible: oMItem.visible,
						role: oMItem.role
					});
				});
				that.getModel("$sapuicomppersonalizationBaseController").setProperty("/persistentData/dimeasure/dimeasureItems", aMDimeasureItems);
			}
		});
		return oPanel;
	};

	DimeasureController.prototype._isDimMeasureItemEqual = function(oDimMeasureItemA, oDimMeasureItemB) {
		if (!oDimMeasureItemA && !oDimMeasureItemB) {
			return true;
		}
		if (oDimMeasureItemA && !oDimMeasureItemB) {
			if (oDimMeasureItemA.index === -1 && oDimMeasureItemA.visible === false) {
				return true;
			}
			return false;
		}
		if (oDimMeasureItemB && !oDimMeasureItemA) {
			if (oDimMeasureItemB.index === -1 && oDimMeasureItemB.visible === false) {
				return true;
			}
			return false;
		}
		for ( var property in oDimMeasureItemA) {
			if (oDimMeasureItemB[property] === undefined || oDimMeasureItemA[property] !== oDimMeasureItemB[property]) {
				return false;
			}
		}
		return true;
	};

	DimeasureController.prototype._isSemanticEqual = function(oPersistentDataBase, oPersistentData) {
		if (oPersistentDataBase.dimeasure.chartTypeKey !== oPersistentData.dimeasure.chartTypeKey) {
			return false;
		}
		var fSort = function(a, b) {
			if (a.visible === true && (b.visible === false || b.visible === undefined)) {
				return -1;
			} else if ((a.visible === false || a.visible === undefined) && b.visible === true) {
				return 1;
			} else if (a.visible === true && b.visible === true) {
				if (a.index < b.index) {
					return -1;
				} else if (a.index > b.index) {
					return 1;
				} else {
					return 0;
				}
			} else if ((a.visible === false || a.visible === undefined) && (b.visible === false || b.visible === undefined)) {
				if (a.columnKey < b.columnKey) {
					return -1;
				} else if (a.columnKey > b.columnKey) {
					return 1;
				} else {
					return 0;
				}
			}
		};
		var aDimeasureItemsBase = Util.copy(oPersistentDataBase.dimeasure.dimeasureItems).sort(fSort);
		var aDimeasureItems = Util.copy(oPersistentData.dimeasure.dimeasureItems).sort(fSort);
		// if (aDimeasureItems.length !== aDimeasureItemsBase.length) {
		// return false;
		// }
		var bIsEqual = true;
		aDimeasureItemsBase.some(function(oDimeasureItem, iIndex) {
			if (!this._isDimMeasureItemEqual(oDimeasureItem, aDimeasureItems[iIndex])) {
				bIsEqual = false;
				return true;
			}
		}, this);
		return bIsEqual;
	};

	/**
	 * Operations on columns are processed every time directly at the table. In case that something has been changed via Personalization Dialog or via
	 * user interaction at table, change is applied to the table.
	 *
	 * @param {object} oPersistentDataBase (new) JSON object
	 * @param {object} oPersistentDataCompare (old) JSON object
	 * @returns {object} that represents the change type, like: Unchanged || TableChanged || ModelChanged
	 */
	DimeasureController.prototype.getChangeType = function(oPersistentDataBase, oPersistentDataCompare) {
		if (!oPersistentDataCompare || !oPersistentDataCompare.dimeasure || !oPersistentDataCompare.dimeasure.dimeasureItems) {
			return sap.ui.comp.personalization.ChangeType.Unchanged;
		}
		return this._isSemanticEqual(oPersistentDataBase, oPersistentDataCompare) ? sap.ui.comp.personalization.ChangeType.Unchanged : sap.ui.comp.personalization.ChangeType.TableChanged;
	};

	/**
	 * Result is XOR based difference = oPersistentDataBase - oPersistentDataCompare (new - old)
	 *
	 * @param {object} oPersistentDataBase (new) JSON object which represents the current model state (Restore+PersistentData)
	 * @param {object} oPersistentDataCompare (old) JSON object which represents AlreadyKnown || Restore
	 * @returns {object} JSON object or null
	 */
	DimeasureController.prototype.getChangeData = function(oPersistentDataBase, oPersistentDataCompare) {

		if (!oPersistentDataBase || !oPersistentDataBase.dimeasure || !oPersistentDataBase.dimeasure.dimeasureItems) {
			return this.createPersistentStructure();
		}

		if (!oPersistentDataCompare || !oPersistentDataCompare.dimeasure || !oPersistentDataCompare.dimeasure.dimeasureItems) {
			return {
				chartTypeKey: oPersistentDataBase.dimeasure.chartTypeKey,
				dimeasure: Util.copy(oPersistentDataBase.dimeasure)
			};
		}
		if (!this._isSemanticEqual(oPersistentDataBase, oPersistentDataCompare)) {
			return {
				chartTypeKey: oPersistentDataBase.dimeasure.chartTypeKey,
				dimeasure: Util.copy(oPersistentDataBase.dimeasure)
			};
		}
		return null;
	};

	/**
	 * @param {object} oDataOld: JSON object to which different properties from oDataNew are added. E.g. Restore
	 * @param {object} oDataNew: JSON object from where the different properties are added to oDataOld. E.g. CurrentVariant || PersistentData
	 * @returns {object} new JSON object as union result of oDataOld and oPersistentDataCompare
	 */
	DimeasureController.prototype.getUnionData = function(oDataOld, oDataNew) {
		if (!oDataNew || !oDataNew.dimeasure || !oDataNew.dimeasure.dimeasureItems) {
			return {
				chartTypeKey: oDataOld.dimeasure.chartTypeKey,
				dimeasure: Util.copy(oDataOld.dimeasure)
			};
		}
		return {
			dimeasure: {
				chartTypeKey: oDataNew.dimeasure.chartTypeKey ? oDataNew.dimeasure.chartTypeKey : oDataOld.dimeasure.chartTypeKey,
				dimeasureItems: Util.copy(oDataNew.dimeasure.dimeasureItems)
			}
		};
	};

	/**
	 * Creates, if not already exists, property <code>Visualizations</code> in <code>oDataSuiteFormat</code> object if at least one dimeasure item exists. Adds an object of the current PersistentData snapshot into <code>Visualizations</code> array.
	 * @param {object} oDataSuiteFormat Structure of Data Suite Format
	 */
	DimeasureController.prototype.getDataSuiteFormatSnapshot = function(oDataSuiteFormat) {
		var oPersistentDataTotal = this.getUnionData(this.getPersistentDataRestore(), this.getPersistentData());
		if (!oPersistentDataTotal.dimeasure || !oPersistentDataTotal.dimeasure.dimeasureItems || !oPersistentDataTotal.dimeasure.dimeasureItems.length) {
			return;
		}

		// Fill 'Visualizations'
		var aDimensionItems = [];
		var aMeasureItems = [];
		var oTransientData = this.getTransientData();
		Util.splitDimeasures(oPersistentDataTotal.dimeasure.dimeasureItems, oTransientData.dimeasure.items, aDimensionItems, aMeasureItems);

		var aDimensionItemsVisible = aDimensionItems.filter(function(oDimensionItem) {
			return !!oDimensionItem.visible;
		});
		var aMeasureItemsVisible = aMeasureItems.filter(function(oMeasureItem) {
			return !!oMeasureItem.visible;
		});
		if (aDimensionItemsVisible.length || aMeasureItemsVisible.length) {
			if (!oDataSuiteFormat.Visualizations) {
				oDataSuiteFormat.Visualizations = [];
			}
			oDataSuiteFormat.Visualizations.push({
				Type: "Chart",
				Content: {
					// Note: if runtime error occurs because sap.chart library has not been loaded (there is dependency to sap.chart inside of sap.ui.comp.odata.ChartMetadata) then the caller of DimeasureController has to load the sap.chart library.
					ChartType: sap.ui.comp.odata.ChartMetadata.getAnnotationChartType(oPersistentDataTotal.dimeasure.chartTypeKey),
					Dimensions: aDimensionItemsVisible.map(function(oDimensionItem) {
						return oDimensionItem.columnKey;
					}),
					DimensionAttributes: aDimensionItemsVisible.map(function(oDimensionItem) {
						return {
							Dimension: oDimensionItem.columnKey,
							Role: oDimensionItem.role
						};
					}),
					Measures: aMeasureItemsVisible.map(function(oMeasureItem) {
						return oMeasureItem.columnKey;
					}),
					MeasureAttributes: aMeasureItemsVisible.map(function(oMeasureItem) {
						return {
							Measure: oMeasureItem.columnKey,
							Role: oMeasureItem.role
						};
					})
				}
			});
		}
	};

	DimeasureController._sortByIndex = function(a, b) {
		if (a.index < b.index) {
			return -1;
		} else if (a.index > b.index) {
			return 1;
		} else {
			return 0;
		}
	};
	/**
	 * Cleans up before destruction.
	 *
	 * @private
	 */
	DimeasureController.prototype.exit = function() {
		BaseController.prototype.exit.apply(this, arguments);

		var oTable = this.getTable();
		if (oTable) {
			var oChart = oTable.getChartObject();
			if (oChart) {
				oChart.detachDrilledDown(this._onDrilledDown, this);
				oChart.detachDrilledUp(this._onDrilledUp, this);
			}
		}
	};

	/* eslint-enable strict */

	return DimeasureController;

}, /* bExport= */true);
