/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

/**
 * @namespace Provides utitlity functions for the personalization dialog
 * @name sap.ui.comp.personalization.Util
 * @author SAP SE
 * @version 1.52.4
 * @private
 * @since 1.25.0
 */
sap.ui.define([
	'./ChartWrapper', './SelectionWrapper', './ColumnWrapper', 'sap/ui/comp/library', 'sap/m/library'
], function(ChartWrapper, SelectionWrapper, ColumnWrapper, CompLibrary, MLibrary) {
	"use strict";
	var Util = {

		/**
		 *
		 */
		splitDimeasures: function(aDimeasureItems, aItems, aDimensions, aMeasures) {
			aDimeasureItems.forEach(function(oDimeasureItem) {
				var oItem = this.getArrayElementByKey("columnKey", oDimeasureItem.columnKey, aItems);
				if (oItem.aggregationRole === sap.ui.comp.personalization.AggregationRole.Dimension) {
					aDimensions.push(oDimeasureItem);
				} else if (oItem.aggregationRole === sap.ui.comp.personalization.AggregationRole.Measure) {
					aMeasures.push(oDimeasureItem);
				}
			}, this);
		},

		/**
		 *
		 */
		createChartWrapper: function(oChart, aAdditionalData, aColumnKeysOrdered) {
			var oP13nData;
			var oColumnKey2ColumnMap = {};
			oChart.getDimensions().forEach(function(oDimension) {
				oP13nData = oDimension.data("p13nData");
				oColumnKey2ColumnMap[oP13nData.columnKey] = new ColumnWrapper({
					label: oDimension.getLabel(),
					tooltip: oDimension.getTooltip(),
					selected: oChart.getVisibleDimensions().indexOf(oDimension.getName()) > -1,
					aggregationRole: sap.ui.comp.personalization.AggregationRole.Dimension,
					role: oDimension.getRole() ? oDimension.getRole() : oDimension.getMetadata().getProperty("role").getDefaultValue(),//oRb.getText('COLUMNSPANEL_CHARTROLE_CATEGORY'),
					sorted: oP13nData.sorted,
					sortOrder: oP13nData.sortOrder,
					customData: new sap.ui.core.CustomData({
						key: "p13nData",
						value: oP13nData
					})
				});
			});
			oChart.getMeasures().forEach(function(oMeasure) {
				oP13nData = oMeasure.data("p13nData");
				oColumnKey2ColumnMap[oP13nData.columnKey] = new ColumnWrapper({
					label: oMeasure.getLabel(),
					tooltip: oMeasure.getTooltip(),
					selected: oChart.getVisibleMeasures().indexOf(oMeasure.getName()) > -1,
					aggregationRole: sap.ui.comp.personalization.AggregationRole.Measure,
					role: oMeasure.getRole() ? oMeasure.getRole() : oMeasure.getMetadata().getProperty("role").getDefaultValue(),//oRb.getText('COLUMNSPANEL_CHARTROLE_AXIS1'),
					sorted: oP13nData.sorted,
					sortOrder: oP13nData.sortOrder,
					customData: new sap.ui.core.CustomData({
						key: "p13nData",
						value: oP13nData
					})
				});
			});
			if (aAdditionalData) {
				aAdditionalData.forEach(function(oP13nData) {
					oColumnKey2ColumnMap[oP13nData.columnKey] = new ColumnWrapper({
						label: oP13nData.label,
						tooltip: oP13nData.tooltip,
						selected: false,
						aggregationRole: sap.ui.comp.personalization.AggregationRole.NotDimeasure,
						sorted: oP13nData.sorted,
						sortOrder: oP13nData.sortOrder,
						customData: new sap.ui.core.CustomData({
							key: "p13nData",
							value: oP13nData
						})
					});
				});
			}
			return new ChartWrapper({
				chart: oChart,
				columns: aColumnKeysOrdered.map(function(sColumnKey) {
					return oColumnKey2ColumnMap[sColumnKey];
				})
			});
		},

		/**
		 *
		 */
		createSelectionWrapper: function(aMAvailableActions, bForbidNavigation) {
			var aColumns = aMAvailableActions.map(function(oMAvailableAction) {
				var oColumn = new ColumnWrapper({
					label: oMAvailableAction.text,
					selected: oMAvailableAction.visible,
					href: bForbidNavigation ? undefined : oMAvailableAction.href,
					target: oMAvailableAction.target,
					press: oMAvailableAction.press
				});
				oColumn.data("p13nData", {
					columnKey: oMAvailableAction.key
				});
				return oColumn;
			}, this);

			return new SelectionWrapper({
				columns: aColumns
			});
		},

		/**
		 * Sort the items in alphabetical order.
		 *
		 * @param {object} aItems
		 */
		sortItemsByText: function(aItems, sKeyName) {
			var sLanguage;
			try {
				var sLanguage = sap.ui.getCore().getConfiguration().getLocale().toString();
				if (typeof window.Intl !== 'undefined') {
					var oCollator = window.Intl.Collator(sLanguage, {
						numeric: true
					});
					aItems.sort(function(a, b) {
						return oCollator.compare(a[sKeyName], b[sKeyName]);
					});
				} else {
					aItems.sort(function(a, b) {
						return a[sKeyName].localeCompare(b[sKeyName], sLanguage, {
							numeric: true
						});
					});
				}
			} catch (oException) {
				// this exception can happen if the configured language is not convertible to BCP47 -> getLocale will deliver an exception
			}
		},

		/**
		 * Converts string value to Date instance in filter model data <code>oPersonalisationData</code>.
		 *
		 * @param {object} oPersonalisationData
		 * @param {array} aColumnKeysOfDateType Optional parameter which can be passed to improve performance
		 */
		recoverPersonalisationDateData: function(oPersonalisationData, aColumnKeysOfDateType) {
			if (aColumnKeysOfDateType.length && oPersonalisationData && oPersonalisationData.filter) {
				oPersonalisationData.filter.filterItems.forEach(function(oFilterItem) {
					if (aColumnKeysOfDateType.indexOf(oFilterItem.columnKey) > -1) {
						if (oFilterItem.value1 && typeof (oFilterItem.value1) === "string") {
							oFilterItem.value1 = new Date(oFilterItem.value1);
						}
						if (oFilterItem.value2 && typeof (oFilterItem.value2) === "string") {
							oFilterItem.value2 = new Date(oFilterItem.value2);
						}
					}
				});
			}
		},

		recoverPersonalisationTimeData: function(oPersonalisationData, aColumnKeysOfTimeType) {
			if (aColumnKeysOfTimeType.length && oPersonalisationData && oPersonalisationData.filter) {
				oPersonalisationData.filter.filterItems.forEach(function(oFilterItem) {
					if (aColumnKeysOfTimeType.indexOf(oFilterItem.columnKey) > -1) {
						if (oFilterItem.value1 && typeof (oFilterItem.value1) === "string") {
							oFilterItem.value1 = new Date(oFilterItem.value1);
						}
						if (oFilterItem.value2 && typeof (oFilterItem.value2) === "string") {
							oFilterItem.value2 = new Date(oFilterItem.value2);
						}
					}
				});
			}
		},

		/**
		 * Converts string value to Boolean instance in filter model data <code>oPersonalisationData</code>.
		 *
		 * @param {object} oPersonalisationData
		 * @param {array} aColumnKeysOfDateType Optional parameter which can be passed to improve performance
		 */
		recoverPersonalisationBooleanData: function(oPersonalisationData, aColumnKeysOfDateType) {
			if (aColumnKeysOfDateType.length && oPersonalisationData && oPersonalisationData.filter) {
				oPersonalisationData.filter.filterItems.forEach(function(oFilterItem) {
					if (aColumnKeysOfDateType.indexOf(oFilterItem.columnKey) > -1) {
						if (oFilterItem.value1 && typeof (oFilterItem.value1) === "string") {
							oFilterItem.value1 = oFilterItem.value1 === "true";
						}
						if (oFilterItem.value2 && typeof (oFilterItem.value2) === "string") {
							oFilterItem.value2 = oFilterItem.value2 === "true";
						}
					}
				});
			}
		},

		getUnionOfAttribute: function(oSetting, sAttributeName) {
			var aUnion = [];
			var fAddColumnKey = function(sColumnKey) {
				if (aUnion.indexOf(sColumnKey) < 0) {
					aUnion.push(sColumnKey);
				}
			};
			for ( var sNamespace in oSetting) {
				var oNamespace = oSetting[sNamespace];
				if (!oNamespace[sAttributeName]) {
					continue;
				}
				oNamespace[sAttributeName].forEach(fAddColumnKey);
			}
			return aUnion;
		},

		getUnionOfColumnKeys: function(oColumnKeys) {
			var aUnion = [];
			var fConcatUnique = function(aColumnKeys) {
				var aUnion_ = aUnion.concat(aColumnKeys);
				aUnion = aUnion_.filter(function(sItem, iPos) {
					return aUnion_.indexOf(sItem) === iPos;
				});
			};
			for ( var sNamespace in oColumnKeys) {
				fConcatUnique(oColumnKeys[sNamespace]);
			}
			return aUnion;
		},

		copy: function(oObject) {
			if (oObject instanceof Array) {
				return jQuery.extend(true, [], oObject);
			}
			return jQuery.extend(true, {}, oObject);
		},

		sort: function(sKeyName, aArray) {
			var aResult = this.copy(aArray);
			aResult.sort(function(a, b) {
				var aText = a[sKeyName].toLocaleLowerCase();
				var bText = b[sKeyName].toLocaleLowerCase();

				if (aText < bText) {
					return -1;
				}
				if (aText > bText) {
					return 1;
				}
				// a must be equal to b
				return 0;
			});
			return aResult;
		},

		removeEmptyProperty: function(oObject) {
			for ( var type in oObject) {
				if (oObject[type] === null || oObject[type] === undefined) {
					delete oObject[type];
				}
			}
			return oObject;
		},

		semanticEqual: function(oItemA, oItemB) {
			if (!oItemA || !oItemB) {
				return false;
			}
			for ( var property in oItemA) {
				if (oItemA[property] !== oItemB[property]) {
					return false;
				}
			}
			return true;
		},

		/**
		 * @param {sap.ui.comp.personalization.ResetType}
		 * @returns {boolean} true if at least one property of oChangeType has 'ModelChanged' or 'TableChanged'.
		 */
		hasChangedType: function(oChangeType) {
			for ( var type in oChangeType) {
				if (oChangeType[type] === sap.ui.comp.personalization.ChangeType.ModelChanged || oChangeType[type] === sap.ui.comp.personalization.ChangeType.TableChanged) {
					return true;
				}
			}
			return false;
		},

		/**
		 * @param {sap.ui.comp.personalization.ResetType}
		 * @returns {boolean} true if property <code>sNamespace</code> of oChangeType has 'ModelChanged' or 'TableChanged'.
		 */
		isNamespaceChanged: function(oChangeType, sNamespace) {
			if (oChangeType[sNamespace]) {
				return oChangeType[sNamespace] === sap.ui.comp.personalization.ChangeType.ModelChanged || oChangeType[sNamespace] === sap.ui.comp.personalization.ChangeType.TableChanged;
			}
			return false;
		},

		/**
		 * Returns an array of elements coming from sElements that are separated by commas.
		 *
		 * @param {string} sElements
		 * @returns {array}
		 */
		createArrayFromString: function(sElements) {
			if (!sElements) {
				return [];
			}
			var aElements = [];
			var aRowElements = sElements.split(",");
			aRowElements.forEach(function(sField) {
				if (sField !== "") {
					aElements.push(sField.trim());
				}
			});
			return aElements;
		},

		/**
		 * @param {string} sKeyName: property name for key
		 * @param {string} sKeyValue: kay value which is looking for
		 * @param {Array} aArray: array where the element with key value 'sKeyValue' is looking for
		 * @returns {int} Index of sKey or -1 if not found
		 */
		getIndexByKey: function(sKeyName, sKeyValue, aArray) {
			if (!aArray || !aArray.length) {
				return -1;
			}
			var iIndex = -1;
			aArray.some(function(oElement, i) {
				if (oElement[sKeyName] !== undefined && oElement[sKeyName] === sKeyValue) {
					iIndex = i;
					return true;
				}
			});
			return iIndex;
		},

		/**
		 * @param {sap.m.Column | sap.ui.table.Column} oColumn
		 * @returns {string | null}
		 */
		getColumnKey: function(oColumn) {
			return this._getCustomProperty(oColumn, "columnKey") || oColumn.getId();
		},

		/**
		 * @param {sap.m.Column | sap.ui.table.Column} oColumn
		 * @returns {string | null}
		 */
		getColumnType: function(oColumn) {
			return this._getCustomProperty(oColumn, "type");
		},

		/**
		 * @param {sap.m.Column | sap.ui.table.Column} oColumn
		 * @returns {boolean}
		 */
		isGroupable: function(oColumn) {
			if (sap.ui.table && sap.ui.table.AnalyticalColumn && oColumn instanceof sap.ui.table.AnalyticalColumn) {
				// cf. implementation of sap.ui.table.AnalyticalColumnMenu.prototype._addGroupMenuItem
				var oTable = oColumn.getParent();
				var oBinding = oTable && oTable.getBinding("rows");
				var oResultSet = oBinding && oBinding.getAnalyticalQueryResult();

				if (oTable && oResultSet && oResultSet.findDimensionByPropertyName(oColumn.getLeadingProperty()) && jQuery.inArray(oColumn.getLeadingProperty(), oBinding.getSortablePropertyNames()) > -1 && jQuery.inArray(oColumn.getLeadingProperty(), oBinding.getFilterablePropertyNames()) > -1) {
					return true;
				}
			}

			if (oColumn instanceof sap.m.Column) {
				return this.isSortable(oColumn);
			}

			// Not yet supported
			// if (oColumn instanceof sap.ui.table.Column) {
			// return oColumn.getParent().getEnableGrouping() && this.isSortable(oColumn);
			// }

			return false;
		},

		/**
		 * @param {sap.m.Column | sap.ui.table.Column | sap.ui.comp.personalization.ColumnWrapper} oColumn
		 * @returns {boolean}
		 */
		isSortable: function(oColumn) {
			// If oColumn implements "sortProperty" property then we take it
			if (oColumn.getSortProperty) {
				return !!oColumn.getSortProperty();
			}
			// Only if oColumn does not implement "sortProperty" property then we take "p13nData"
			return !!this._getCustomProperty(oColumn, "sortProperty");

		},

		/**
		 * @param {sap.m.Column | sap.ui.table.Column | sap.ui.comp.personalization.ColumnWrapper} oColumn
		 * @returns {boolean}
		 */
		isFilterable: function(oColumn) {
			// If oColumn implements "filterProperty" property then we take it.
			if (oColumn.getFilterProperty) {
				return !!oColumn.getFilterProperty();
			}
			// Only if oColumn does not implement "filterProperty" property then we take "p13nData".
			return !!this._getCustomProperty(oColumn, "filterProperty");

		},

		/**
		 * @param {sap.m.Column[] | sap.ui.table.Column[]} aColumns
		 * @returns {boolean} True if all columns support 'columnKey' or all columns do not support 'columnKey'. False in case of mixed situation.
		 */
		isConsistent: function(aColumns) {
			if (!aColumns || !aColumns.length) {
				return true;
			}
			var oColumnKeys = {};
			var bConsistent = true;
			var bHasColumnKeyFirst = !!this._getCustomProperty(aColumns[0], "columnKey");
			aColumns.some(function(oColumn) {
				var sColumnKey = this._getCustomProperty(oColumn, "columnKey");
				var bHasColumnKeyCurrent = !!sColumnKey;
				if (bHasColumnKeyCurrent !== bHasColumnKeyFirst) {
					// The table instance provided contains some columns for which a columnKey is provided, some for which a columnKey is not
					// provided.
					bConsistent = false;
					return true; // leave some()
				}

				if (bHasColumnKeyFirst) {
					if (oColumnKeys[sColumnKey]) {
						// The table instance provided contains some columns with a duplicate 'columnKey'.
						bConsistent = false;
						return true; // leave some()
					}
					oColumnKeys[sColumnKey] = {};
				}
			}, this);
			return bConsistent;
		},

		/**
		 * @param {string} sKeyName: property name for key
		 * @param {string} sKeyValue: kay value which is looking for
		 * @param {Array} aArray: array where the element with key value 'sKeyValue' is looking for
		 * @returns {object | null} either found array element or null if 'sKeyValue' does not exist in aArray
		 */
		getArrayElementByKey: function(sKeyName, sKeyValue, aArray) {
			if (!aArray || !aArray.length) {
				return null;
			}
			var oElement = null;
			aArray.some(function(oElement_) {
				if (oElement_[sKeyName] !== undefined && oElement_[sKeyName] === sKeyValue) {
					oElement = oElement_;
					return true;
				}
			});
			return oElement;
		},

		/**
		 * Checks whether <code>columnKey</code> of <code>oColumn</code> exists in <code>aIgnoredColumnKeys</code>.
		 *
		 * @param {sap.ui.table.Column|sap.m.Column} oColumn The column to be checked whether it is ignored
		 * @param {array} aIgnoredColumnKeys The array with ignored column keys
		 * @returns {boolean} <code>true</code> if oColumn exists in aIgnoredColumnKeys; <code>false</code> else
		 * @public
		 */
		isColumnIgnored: function(oColumn, aIgnoredColumnKeys) {
			if (!aIgnoredColumnKeys) {
				return false;
			}
			return aIgnoredColumnKeys.indexOf(this.getColumnKey(oColumn)) > -1;
		},

		/**
		 * This method will make an initial json snapshot of the given table instance and stores the column sorting information in the given array.
		 *
		 * @param {sap.ui.table.Table | sap.ui.comp.personalization.ChartWrapper} oTable The table where the sort data has to be extracted
		 * @param {array} aDestination The array where the sort json data should be stored
		 * @public
		 */
		createSort2Json: function(oTable, aDestination, aIgnoreColumnKeys) {
			if (this.getTableBaseType(oTable) !== sap.ui.comp.personalization.TableType.Table && this.getTableType(oTable) !== sap.ui.comp.personalization.TableType.ChartWrapper) {
				return;
			}
			this.addSortPersistentData(this._mapTable2P13nSortJson(oTable), {
				sort: {
					sortItems: aDestination
				}
			}, aIgnoreColumnKeys);
		},

		/**
		 * @private
		 */
		addSortPersistentData: function(oSourceJsonData, oDestinationJsonData, aIgnoreColumnKeys) {
			oSourceJsonData.sort.sortItems.forEach(function(oSourceItem) {
				if (!oSourceItem.isSorted || aIgnoreColumnKeys.indexOf(oSourceItem.columnKey) > -1) {
					return;
				}
				oDestinationJsonData.sort.sortItems.push({
					columnKey: oSourceItem.columnKey,
					operation: oSourceItem.operation
				});
			});
		},

		/**
		 *
		 * @param {sap.ui.table.Table | sap.ui.comp.personalization.ChartWrapper} oTable The table where the sort data has to be extracted
		 * @private
		 */
		_mapTable2P13nSortJson: function(oTable) {
			return {
				sort: {
					sortItems: oTable.getColumns().map(function(oColumn) {
						return {
							columnKey: Util.getColumnKey(oColumn),
							isSorted: oColumn.getSorted(),
							operation: oColumn.getSortOrder()
						};
					})
				}
			};
		},

		/**
		 * Determines the type of the <code>oTable</code>.
		 * @param {sap.ui.comp.personalization.ChartWrapper | sap.ui.comp.personalization.SelectionWrapper | sap.m.Table | sap.ui.table.AnalyticalTable | sap.ui.table.TreeTable | sap.ui.table.Table} oTable
		 * @returns {sap.ui.comp.personalization.TableType | null}
		 */
		getTableType: function(oTable) {
			if (oTable instanceof sap.ui.comp.personalization.ChartWrapper) {
				return sap.ui.comp.personalization.TableType.ChartWrapper;
			}
			if (oTable instanceof sap.ui.comp.personalization.SelectionWrapper) {
				return sap.ui.comp.personalization.TableType.SelectionWrapper;
			}
			if (sap.m && sap.m.Table && oTable instanceof sap.m.Table) {
				return sap.ui.comp.personalization.TableType.ResponsiveTable;
			}
			if (sap.ui.table && sap.ui.table.AnalyticalTable && oTable instanceof sap.ui.table.AnalyticalTable) {
				return sap.ui.comp.personalization.TableType.AnalyticalTable;
			}
			if (sap.ui.table && sap.ui.table.TreeTable && oTable instanceof sap.ui.table.TreeTable) {
				return sap.ui.comp.personalization.TableType.TreeTable;
			}
			if (sap.ui.table && sap.ui.table.Table && oTable instanceof sap.ui.table.Table) {
				return sap.ui.comp.personalization.TableType.Table;
			}
			return null;
		},

		/**
		 * Determines the base type of the <code>oTable</code>.
		 * @param {sap.ui.comp.personalization.ChartWrapper | sap.ui.comp.personalization.SelectionWrapper | sap.m.Table | sap.ui.table.AnalyticalTable | sap.ui.table.TreeTable | sap.ui.table.Table} oTable
		 * @return {sap.ui.comp.personalization.TableType | null}
		 */
		getTableBaseType: function(oTable) {
			switch (this.getTableType(oTable)) {
				case sap.ui.comp.personalization.TableType.ChartWrapper:
					return sap.ui.comp.personalization.TableType.ChartWrapper;
				case sap.ui.comp.personalization.TableType.SelectionWrapper:
					return sap.ui.comp.personalization.TableType.SelectionWrapper;
				case sap.ui.comp.personalization.TableType.ResponsiveTable:
					return sap.ui.comp.personalization.TableType.ResponsiveTable;
				case sap.ui.comp.personalization.TableType.AnalyticalTable:
				case sap.ui.comp.personalization.TableType.Table:
				case sap.ui.comp.personalization.TableType.TreeTable:
					return sap.ui.comp.personalization.TableType.Table;
				default:
					return null;
			}
		},

		/**
		 * @param {sap.m.Column | sap.ui.table.Column} oColumn
		 * @param {string} sProperty
		 * @param {boolean} bParse
		 * @returns {object | null} either value of custom data property or null
		 */
		_getCustomProperty: function(oColumn, sProperty) {
			var oCustomData = this._getCustomData(oColumn);
			if (!oCustomData || !sProperty) {
				return null;
			}
			return oCustomData[sProperty];
		},

		/**
		 * @param {sap.m.Column | sap.ui.table.Column} oColumn
		 * @returns {object | null} either custom data object or null
		 */
		_getCustomData: function(oColumn) {
			if (!oColumn) {
				return null;
			}
			var oCustomData = oColumn.data("p13nData");
			if (typeof oCustomData === "string") {
				try {
					oCustomData = JSON.parse(oCustomData);
					oColumn.data("p13nData", oCustomData);
				} catch (oException) {
					// do not update the custom data, go ahead
				}
			}
			return oCustomData;
		}

	};
	return Util;
}, /* bExport= */true);
