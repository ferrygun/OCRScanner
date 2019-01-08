/* eslint-disable strict */

/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'jquery.sap.global', 'sap/ui/base/ManagedObject', './Util', './ColumnWrapper'
], function(jQuery, ManagedObject, Util, ColumnWrapper) {
	"use strict";

	/**
	 * Constructor for a helper class.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class Helper class
	 * @extends sap.ui.base.ManagedObject
	 * @author SAP SE
	 * @version 1.52.4
	 * @constructor
	 * @experimental This module is only for internal/experimental use!
	 * @private
	 * @since 1.38.0
	 * @alias sap.ui.comp.personalization.ColumnHelper
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var ColumnHelper = ManagedObject.extend("sap.ui.comp.personalization.ColumnHelper", /** @lends sap.ui.comp.personalization.ColumnHelper */
	{
		constructor: function(sId, mSettings) {
			ManagedObject.apply(this, arguments);
		},
		metadata: {
			properties: {
				callbackOnSetVisible: {
					type: "object",
					defaultValue: null
				},
				callbackOnSetSummed: {
					type: "object",
					defaultValue: null
				}
			}
		}
	});

	ColumnHelper.prototype.init = function() {
		this._oColumnKey2ColumnMap = {};
		this._oColumnKeyIsMonkeyPatched = {};
		this._oStoredColumnMapForColumnKeys = {};
	};

	// ------------------- setter methods ---------------------------------------------
	ColumnHelper.prototype.addColumnMap = function(oColumnKey2ColumnMap) {
		if (!oColumnKey2ColumnMap) {
			return;
		}
		for ( var sColumnKey in oColumnKey2ColumnMap) {
			this._addColumnToMap(sColumnKey, oColumnKey2ColumnMap[sColumnKey]);
		}
	};

	ColumnHelper.prototype.addColumnsToMap = function(aColumns) {
		if (!aColumns) {
			return;
		}
		aColumns.forEach(function(oColumn) {
			var sColumnKey = Util.getColumnKey(oColumn);
			this._addColumnToMap(sColumnKey, oColumn);
		}, this);
	};

	ColumnHelper.prototype._addColumnToMap = function(sColumnKey, oColumn) {
		if (!this._oColumnKey2ColumnMap[sColumnKey]) {
			this._oColumnKey2ColumnMap[sColumnKey] = oColumn;
			this._monkeyPatchColumn(oColumn, sColumnKey);
		}
	};

	// ------------------- getter methods -------------------------------------------
	ColumnHelper.prototype.getColumnMap = function() {
		return this._oColumnKey2ColumnMap;
	};

	/**
	 * For every <code>sType</code> a map is stored with key as columnKey and value as corresponding column. The columnKeys are reduced by
	 * <code>aIgnoredColumnKeys</code>. If then during the life-cycle the amount of columnKeys is changed the stored map will be invalidated.
	 *
	 * @param {sap.m.P13nPanelType} sType
	 * @param {array} aIgnoredColumnKeys
	 * @returns {object} Map of columnKeys and corresponding columns
	 */
	ColumnHelper.prototype.getColumnMapOfValidColumnKeys = function(sType, aIgnoredColumnKeys) {
		this._invalidateStoredColumnMapForColumnKeys(sType);
		if (this._oStoredColumnMapForColumnKeys[sType]) {
			return this._oStoredColumnMapForColumnKeys[sType].map;
		}

		if (!aIgnoredColumnKeys || !aIgnoredColumnKeys.length) {
			this._oStoredColumnMapForColumnKeys[sType] = {
				columnKeys: this.getColumnKeysOfMap(),
				map: this._oColumnKey2ColumnMap
			};
			return this._oStoredColumnMapForColumnKeys[sType].map;
		}

		this._oStoredColumnMapForColumnKeys[sType] = {
			columnKeys: this.getColumnKeysOfMap(),
			map: jQuery.extend(true, {}, this._oColumnKey2ColumnMap)
		};
		aIgnoredColumnKeys.forEach(function(sColumnKey) {
			delete this._oStoredColumnMapForColumnKeys[sType].map[sColumnKey];
		}, this);

		return this._oStoredColumnMapForColumnKeys[sType].map;
	};

	ColumnHelper.prototype._invalidateStoredColumnMapForColumnKeys = function(sType) {
		var oValue = this._oStoredColumnMapForColumnKeys[sType];
		if (!oValue) {
			return;
		}
		var aColumnKeys = this.getColumnKeysOfMap();
		var aDiff = aColumnKeys.filter(function(sColumnKey) {
			return oValue.columnKeys.indexOf(sColumnKey) < 0;
		});
		if (aDiff.length) {
			delete this._oStoredColumnMapForColumnKeys[sType];
		}
	};

	ColumnHelper.prototype.getColumnKeysOfMap = function() {
		var aColumnKeys = [];
		for ( var sColumnKey in this._oColumnKey2ColumnMap) {
			aColumnKeys.push(sColumnKey);
		}
		return aColumnKeys;
	};

	ColumnHelper.prototype.getVisibleColumnKeys = function() {
		var aColumnKeys = [];
		for ( var sColumnKey in this._oColumnKey2ColumnMap) {
			var oColumn = this._oColumnKey2ColumnMap[sColumnKey];
			if (oColumn.getVisible && oColumn.getVisible()) {
				aColumnKeys.push(sColumnKey);
			}
		}
		return aColumnKeys;
	};

	/**
	 * Determines <code>columnKeys</code> of a specific type.
	 *
	 * @param {string} sType
	 * @return {array} Array of strings representing the <code>columnKeys</code>
	 */
	ColumnHelper.prototype.getColumnKeysOfType = function(sType) {
		var aColumnKeys = [];
		for ( var sColumnKey in this._oColumnKey2ColumnMap) {
			var oColumn = this._oColumnKey2ColumnMap[sColumnKey];
			if (Util.getColumnType(oColumn) === sType) {
				aColumnKeys.push(sColumnKey);
			}
		}
		return aColumnKeys;
	};

	ColumnHelper.prototype.hasFilterableColumns = function() {
		for ( var sColumnKey in this._oColumnKey2ColumnMap) {
			if (Util.isFilterable(this._oColumnKey2ColumnMap[sColumnKey])) {
				return true;
			}
		}
		return false;
	};

	ColumnHelper.prototype.hasSortableColumns = function() {
		for ( var sColumnKey in this._oColumnKey2ColumnMap) {
			if (Util.isSortable(this._oColumnKey2ColumnMap[sColumnKey])) {
				return true;
			}
		}
		return false;
	};

	ColumnHelper.prototype._monkeyPatchColumn = function(oColumn, sColumnKey) {
		if (oColumn instanceof ColumnWrapper) {
			return;
		}

		if (this._oColumnKeyIsMonkeyPatched[sColumnKey]) {
			// Do nothing if for the current column the methods are already overwritten.
			return;
		}
		this._oColumnKeyIsMonkeyPatched[sColumnKey] = true;

		// Monkey patch setVisible
		var fCallbackOnSetVisible = this.getCallbackOnSetVisible();
		var fSetVisibleOrigin = oColumn.setVisible.bind(oColumn);
		var fSetVisibleOverwritten = function(bVisible) {
			if (fCallbackOnSetVisible) {
				fCallbackOnSetVisible(bVisible, sColumnKey);
			}
			fSetVisibleOrigin(bVisible);
		};
		oColumn.setVisible = fSetVisibleOverwritten;

		// Monkey patch setSummed of AnalyticalTable
		if (oColumn.setSummed) {
			var fCallbackOnSetSummed = this.getCallbackOnSetSummed();
			var fSetSummedOrigin = oColumn.setSummed.bind(oColumn);
			var fSetSummedOverwritten = function(bIsSummed) {
				if (fCallbackOnSetSummed) {
					fCallbackOnSetSummed(bIsSummed, oColumn);
				}
				fSetSummedOrigin(bIsSummed);
			};
			oColumn.setSummed = fSetSummedOverwritten;
		}
	};

	ColumnHelper.prototype.exit = function() {
		this._oColumnKey2ColumnMap = null;
		this._oColumnKeyIsMonkeyPatched = null;
		this._oStoredColumnMapForColumnKeys = null;
	};

	/* eslint-enable strict */
	return ColumnHelper;
}, /* bExport= */true);
