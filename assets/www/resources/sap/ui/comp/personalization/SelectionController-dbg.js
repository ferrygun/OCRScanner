/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides SelectionController
sap.ui.define([
	'jquery.sap.global', './BaseController', 'sap/m/library', 'sap/ui/comp/library', './Util', 'sap/m/P13nSelectionPanel', 'sap/m/P13nItem', 'sap/m/P13nSelectionItem'
], function(jQuery, BaseController, MLibrary, CompLibrary, Util, P13nSelectionPanel, P13nItem, P13nSelectionItem) {
	"use strict";

	/**
	 * The SelectionController can be used to...
	 *
	 * @class Table Personalization Controller
	 * @extends sap.ui.comp.personalization.BaseController
	 * @author SAP SE
	 * @version 1.52.4
	 * @private
	 * @since 1.34.0
	 * @alias sap.ui.comp.SelectionController
	 */
	var SelectionController = BaseController.extend("sap.ui.comp.personalization.SelectionController", /** @lends sap.ui.comp.personalization.SelectionController */

	{
		constructor: function(sId, mSettings) {
			BaseController.apply(this, arguments);
			this.setType(sap.m.P13nPanelType.selection);
		},
		metadata: {
			events: {
				afterSelectionModelDataChange: {}
			}
		}
	});

	/**
	 * Does a complete JSON snapshot of the current table instance ("original") from the perspective of the columns controller; the JSON snapshot can
	 * later be applied to any table instance to recover all columns related infos of the "original" table
	 *
	 * @returns {objects} JSON objects with meta data from existing table columns
	 */
	SelectionController.prototype._getTable2Json = function() {
		return this._mapTable2Json(this.getTable());
	};

	SelectionController.prototype._mapTable2Json = function(oTable) {
		var oJsonData = this.createPersistentStructure();
		if (!oTable) {
			return oJsonData;
		}
		var oColumnKey2ColumnMap = this.getColumnMap(true);
		for ( var sColumnKey in oColumnKey2ColumnMap) {
			var oColumn = oColumnKey2ColumnMap[sColumnKey];
			oJsonData.selection.selectionItems.push({
				columnKey: sColumnKey,
				text: oColumn.getLabel(),
				visible: oColumn.getSelected()
			});
		}
		return oJsonData;
	};

	SelectionController.prototype._getTable2JsonRestore = function() {
		return this._getTable2Json();
	};

	SelectionController.prototype.syncTable2TransientModel = function() {
		var aItems = [];
		var oTable = this.getTable();
		if (!oTable) {
			return;
		}

		var oColumnKey2ColumnMap = this.getColumnMap(true);
		for ( var sColumnKey in oColumnKey2ColumnMap) {
			var oColumn = oColumnKey2ColumnMap[sColumnKey];
			aItems.push({
				columnKey: sColumnKey,
				text: oColumn.getLabel(),
				href: oColumn.getHref(),
				target: oColumn.getTarget(),
				press: oColumn.getPress()
			});
		}

		// check if Items was changed at all and take over if it was changed
		var aItemsBefore = this.getModel("$sapuicomppersonalizationBaseController").getData().transientData.selection.items;
		if (jQuery(aItems).not(aItemsBefore).length !== 0 || jQuery(aItemsBefore).not(aItems).length !== 0) {
			this.getModel("$sapuicomppersonalizationBaseController").getData().transientData.selection.items = aItems;
		}
	};

	/**
	 * Returns a ColumnsPanel control
	 *
	 * @returns {sap.m.P13nChartSelectionPanel} returns a new created ColumnsPanel
	 */
	SelectionController.prototype.getPanel = function(oPayload) {
		var that = this;
		return new P13nSelectionPanel({
			titleLarge: sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("POPOVER_SELECTION_TITLE"),
			items: {
				path: '$sapmP13nPanel>/transientData/selection/items',
				template: new P13nItem({
					columnKey: '{$sapmP13nPanel>columnKey}',
					href: '{$sapmP13nPanel>href}',
					target: '{$sapmP13nPanel>target}',
					text: '{$sapmP13nPanel>text}',
					press: '{$sapmP13nPanel>press}'
				})
			},
			selectionItems: {
				path: "$sapmP13nPanel>/persistentData/selection/selectionItems",
				template: new P13nSelectionItem({
					columnKey: "{$sapmP13nPanel>columnKey}",
					selected: "{$sapmP13nPanel>visible}"
				})
			},
			beforeNavigationTo: this.setModelFunction(),
			changeSelectionItems: function(oEvent) {
				if (oEvent.getParameter("items")) {
					var aMSelectionItems = oEvent.getParameter("items").map(function(oMItem) {
						return {
							columnKey: oMItem.columnKey,
							visible: oMItem.selected
						};
					});
					that.getModel("$sapuicomppersonalizationBaseController").setProperty("/persistentData/selection/selectionItems", aMSelectionItems);
				}
			}
		});
	};

	/**
	 * Operations on columns are processed every time directly at the table. In case that something has been changed via Personalization Dialog or via
	 * user interaction at table, change is applied to the table.
	 *
	 * @param {object} oDataOld (new) JSON object
	 * @param {object} oDataNew (old) JSON object
	 * @returns {object} that represents the change type, like: Unchanged || TableChanged || ModelChanged
	 */
	SelectionController.prototype.getChangeType = function(oDataOld, oDataNew) {
		return this.getChangeData(oDataOld, oDataNew) ? sap.ui.comp.personalization.ChangeType.ModelChanged : sap.ui.comp.personalization.ChangeType.Unchanged;
	};

	/**
	 * Result is XOR based difference = oDataCompare - oDataNew (new - old)
	 *
	 * @param {object} oDataBase JSON object which represents the current model state (Restore+PersistentData)
	 * @param {object} oDataCompare JSON object which represents AlreadyKnown || Restore
	 * @returns {object} JSON object or null
	 */
	SelectionController.prototype.getChangeData = function(oDataBase, oDataCompare) {
		// not valid
		if (!oDataCompare || !oDataCompare.selection || !oDataCompare.selection.selectionItems) {
			return null;
		}

		var oChangeData = {
			selection: Util.copy(oDataBase.selection)
		};

		// If no changes inside of selection.selectionItems array, return null.
		// Note: the order inside of selection.selectionItems array is irrelevant.
		if (this._isSemanticEqual(oDataBase, oDataCompare)) {
			return null;
		}

		// If corresponding items are different then delete equal properties and return the rest of item
		var aToBeDeleted = [];
		oChangeData.selection.selectionItems.forEach(function(oItemOld) {
			var oItemNew = Util.getArrayElementByKey("columnKey", oItemOld.columnKey, oDataCompare.selection.selectionItems);
			if (Util.semanticEqual(oItemOld, oItemNew)) {
				// Condenser: remove items which are not changed in a chain
				aToBeDeleted.push(oItemOld);
				return;
			}
			for ( var property in oItemOld) {
				if (property === "columnKey" || !oItemNew) {
					continue;
				}
				if (oItemOld[property] === oItemNew[property]) {
					delete oItemOld[property];
				}
			}
			// oItemOld has only one property 'columnKey'
			if (Object.keys(oItemOld).length < 2) {
				aToBeDeleted.push(oItemOld);
			}
		});
		aToBeDeleted.forEach(function(oItemOld) {
			var iIndex = Util.getIndexByKey("columnKey", oItemOld.columnKey, oChangeData.selection.selectionItems);
			oChangeData.selection.selectionItems.splice(iIndex, 1);
		});

		return oChangeData;
	};

	/**
	 * @param {object} oDataOld: JSON object to which different properties from oDataNew are added. E.g. Restore
	 * @param {object} oDataNew: JSON object from where the different properties are added to oDataOld. E.g. CurrentVariant || PersistentData
	 * @returns {object} new JSON object as union result of oDataOld and oDataNew
	 */
	SelectionController.prototype.getUnionData = function(oDataOld, oDataNew) {
		if (!oDataNew || !oDataNew.selection || !oDataNew.selection.selectionItems) {
			return oDataOld.selection ? {
				selection: Util.copy(oDataOld.selection)
			} : null;
		}

		if (!oDataOld || !oDataOld.selection || !oDataOld.selection.selectionItems) {
			return {
				selection: Util.copy(oDataNew.selection)
			};
		}

		var oUnion = this.createPersistentStructure();
		oDataOld.selection.selectionItems.forEach(function(oSelectionItemOld) {
			var oSelectionItemNew = Util.getArrayElementByKey("columnKey", oSelectionItemOld.columnKey, oDataNew.selection.selectionItems);
			if (oSelectionItemNew) {
				if (oSelectionItemNew.visible !== undefined) {
					oSelectionItemOld.visible = oSelectionItemNew.visible;
				}
			}
			oUnion.selection.selectionItems.push(oSelectionItemOld);
		});

		return oUnion;
	};

	SelectionController.prototype._isSemanticEqual = function(oDataOld, oDataNew) {
		var fSort = function(a, b) {
			if (a.visible === true && (b.visible === false || b.visible === undefined)) {
				return -1;
			} else if ((a.visible === false || a.visible === undefined) && b.visible === true) {
				return 1;
			} else if (a.visible === true && b.visible === true) {
				// if (a.index < b.index) {
				// return -1;
				// } else if (a.index > b.index) {
				// return 1;
				// } else {
				return 0;
				// }
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
		var aDataOldSorted = Util.copy(oDataOld.selection.selectionItems).sort(fSort);
		var aDataNewSorted = Util.copy(oDataNew.selection.selectionItems).sort(fSort);
		return !aDataOldSorted.some(function(oSelectionItem, iIndex) {
			if (!Util.semanticEqual(oSelectionItem, aDataNewSorted[iIndex])) {
				return true;
			}
		});
	};

	/**
	 * Cleans up before destruction.
	 *
	 * @private
	 */
	SelectionController.prototype.exit = function() {
		BaseController.prototype.exit.apply(this, arguments);
	};

	return SelectionController;

}, /* bExport= */true);
