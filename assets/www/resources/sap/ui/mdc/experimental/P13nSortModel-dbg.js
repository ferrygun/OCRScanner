/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	'jquery.sap.global', 'sap/ui/base/ManagedObject', 'sap/ui/model/json/JSONModel', 'sap/ui/comp/personalization/Util'
], function(jQuery, ManagedObject, JSONModel, PersonalizationUtil) {
	"use strict";

	/**
	 * The JSON model is used for several reasons:
	 *  1. the column representation in the panel (internal view) is different then the column representation
	 *  in aggregation 'items' of P13nXXXPanel which is external view of columns.
	 *  For example:
	 *    External view: [oX, xB, oA, xC] Columns B and C are selected. Columns X and A are not selected.
	 *    Internal view: [xB, xC, oA, oX] On the top all selected columns are displayed. On the bottom all unselected columns sorted in alphabetical order are displayed.
	 *  2. When we define a table sorter (sorter:{path:'selected', descending:true}) then the presentation will
	 *  be automatically changed when end user select a column (it will jump to the selected columns). This behaviour is not desired.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class The P13nSortModel is used to...
	 * @extends sap.ui.base.ManagedObject
	 * @author SAP SE
	 * @version 1.52.4
	 * @constructor
	 * @private
	 * @since 1.48.0
	 * @alias sap.ui.mdc.experimental.P13nSortModel
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var P13nSortModel = JSONModel.extend("sap.ui.mdc.experimental.P13nSortModel", /** @lends sap.ui.mdc.experimental.P13nSortModel.prototype */
	{
		constructor: function(sId, mSettings) {
			JSONModel.apply(this, arguments);
			this._initialize();
		}
	});

	/**
	 *
	 * @private
	 */
	P13nSortModel.prototype._initialize = function() {
		var aTableItems = this.getProperty("/tableItems");
		var aMItems = aTableItems.map(function(oP13nItem) {
			if (typeof oP13nItem === "string") {
				oP13nItem = sap.ui.getCore().byId(oP13nItem);
			}
			return {
				columnKey: oP13nItem.getColumnKey(),
				selected: oP13nItem.getSelected(),
				position: oP13nItem.getPosition(),
				// needed for initial sorting
				text: oP13nItem.getText(),

				sortOrder: oP13nItem.getSortOrder(),
				// New value in ComboBox. It can be
				// * empty value - if user removes the value in input field
				// * valid value - if user take value from popover
				// * dummy value - if user writes wrong value in input field
				comboboxKey: oP13nItem.getColumnKey(),
				availableItems: []
			};
		}, this);
		this._sortBySelectedAndPosition(aMItems);
		this.setProperty("/items", aMItems);

		this.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
		this.setSizeLimit(1000);

		this._updateMItemsAvailableItems();
	};

	P13nSortModel.prototype.insertModelItemOfIndex = function(iIndex) {
		// var oMItem = this.getModelItemByIndex(iIndex);

		// Insert new model item
		var aMItems = this.getProperty("/items");
		aMItems.splice(iIndex + 1, 0, {
			columnKey: "(none)",
			comboboxKey: "(none)",
			text: "(none)",
			// Default value
			sortOrder: "Ascending",
			// Disable the 'sortOrder'
			selected: false,
			// will be determined later based on all model items
			position: undefined,
			// will be determined later based on all model items
			availableItems: []
		});
		this.setProperty("/items", aMItems);

		this._updateMItemsAvailableItems();
		this._updateAndSyncMItemsPosition();
	};

	P13nSortModel.prototype.removeModelItemOfIndex = function(iIndex) {
		// var oMItem = this.getModelItemByIndex(iIndex);

		// Reset properties of aggregation item
		this._updateAndSyncProperties(iIndex, {
			sortOrder: undefined,
			selected: false,
			position: undefined
		});

		// Remove model item
		var aMItems = this.getProperty("/items");
		aMItems.splice(iIndex, 1);

		// Keep '(none)' as first model item
		if (!aMItems.length) {
			aMItems.splice(0, 0, {
				columnKey: "(none)",
				comboboxKey: "(none)",
				text: "(none)",
				// Default value
				sortOrder: "Ascending",
				// Disable the 'sortOrder'
				selected: false,
				// will be determined later based on all model items
				position: undefined,
				// will be determined later based on all model items
				availableItems: []
			});
		}
		this.setProperty("/items", aMItems);

		this._updateMItemsAvailableItems();
		this._updateAndSyncMItemsPosition();
	};

	P13nSortModel.prototype.replaceModelItemOfIndex = function(iIndex) {
		var oMItem = jQuery.extend(true, {}, this.getModelItemByIndex(iIndex));

		// Reset properties of 'old' aggregation item
		this._updateAndSyncProperties(iIndex, {
			sortOrder: undefined,
			selected: false,
			position: undefined
		});

		// Replace the 'columnKey' of model item
		var oItem = this.getItemByColumnKey(oMItem.comboboxKey);
		this.setProperty("/items/" + iIndex + "/columnKey", oMItem.comboboxKey ? oMItem.comboboxKey : "(none)");
		this.setProperty("/items/" + iIndex + "/comboboxKey", oMItem.comboboxKey ? oMItem.comboboxKey : "(none)");
		this.setProperty("/items/" + iIndex + "/text", oItem ? oItem.getText() : "(none)");

		// Update properties of 'new' aggregation item
		this._updateAndSyncProperties(iIndex, {
			sortOrder: oMItem.sortOrder,
			selected: !!oItem,
			position: oMItem.position
		});

		this._updateMItemsAvailableItems();
	};

	P13nSortModel.prototype._updateItemsPosition = function() {
		this.getProperty("/availableItems").forEach(function(oItem) {
			var oMItem = this.getModelItemByColumnKey(oItem.getColumnKey());
			if (oMItem) {
				oItem.setPosition(oMItem.position);
			} else {
				oItem.setPosition(undefined);
			}
		}, this);
	};

	P13nSortModel.prototype.updateProperties = function(iIndex, oMItem) {
		this._updateAndSyncProperties(iIndex, oMItem);

		// this._updateMItemsAvailableItems();
		// this._updateItemsPosition();
	};

	P13nSortModel.prototype._updateAndSyncProperties = function(iIndex, oMItemUpd) {
		var oMItem = this.getModelItemByIndex(iIndex);
		// In case of '(none)' we do not have appropriate aggregation item
		var oItem = this.getItemByColumnKey(oMItem.columnKey);

		// Update model item and appropriate aggregation item
		if (oMItem) {
			if (oMItemUpd.hasOwnProperty("selected")) {
				this.setProperty("/items/" + iIndex + "/selected", oMItemUpd.selected);
				if (oItem) {
					oItem.setSelected(oMItemUpd.selected);
				}
			}
			if (oMItemUpd.hasOwnProperty("sortOrder")) {
				this.setProperty("/items/" + iIndex + "/sortOrder", oMItemUpd.sortOrder);
				if (oItem) {
					oItem.setSortOrder(oMItemUpd.sortOrder);
				}
			}
			if (oMItemUpd.hasOwnProperty("position")) {
				this.setProperty("/items/" + iIndex + "/position", oMItemUpd.position);
				if (oItem) {
					oItem.setPosition(oMItemUpd.position);
				}
			}
		}
	};

	P13nSortModel.prototype._updateAndSyncMItemsPosition = function() {
		var iPosition = -1;
		var aMItems = this.getProperty("/items");
		aMItems.forEach(function(oMItem, iIndex) {
			this._updateAndSyncProperties(iIndex, {
				position: oMItem.selected === true ? ++iPosition : undefined
			});
		}, this);
	};

	P13nSortModel.prototype._updateMItemsAvailableItems = function() {
		if (!this.getProperty("/availableItems")) {
			return;
		}
		var aAvailableItems = this.getProperty("/availableItems").filter(function(oTableItem) {
			return !this.getModelItemByColumnKey(oTableItem.getColumnKey());
		}, this).map(function(oTableItem) {
			return {
				comboboxKey: oTableItem.getColumnKey(),
				text: oTableItem.getText()
			};
		});

		this.getProperty("/items").forEach(function(oMItem, iIndex) {
			var aCurrentAvailableItems = jQuery.extend(true, [], aAvailableItems);
			aCurrentAvailableItems.splice(0, 0, {
				comboboxKey: oMItem.columnKey,
				text: oMItem.text
			});
			this.setProperty("/items/" + iIndex + "/availableItems", aCurrentAvailableItems);
		}, this);
	};

	P13nSortModel.prototype.getItemByColumnKey = function(sColumnKey) {
		var aItem = this.getProperty("/availableItems").filter(function(oItem) {
			return oItem.getColumnKey() === sColumnKey;
		});
		return aItem[0];
	};

	/**
	 *
	 * @public
	 */
	P13nSortModel.prototype.getModelItemByColumnKey = function(sColumnKey) {
		var aMItem = this.getProperty("/items").filter(function(oMItem) {
			return oMItem.columnKey === sColumnKey;
		});
		return aMItem[0];
	};

	/**
	 *
	 * @public
	 */
	P13nSortModel.prototype.getModelItemByIndex = function(iIndex) {
		return this.getProperty("/items/" + iIndex);
	};

	/**
	 *
	 * @public
	 */
	P13nSortModel.prototype.getIndexOfModelItem = function(oMItem) {
		return this.getProperty("/items").indexOf(oMItem);
	};

	/**
	 * Moves a model item depending on the real position in the table.
	 * @public
	 */
	P13nSortModel.prototype.selectModelItem = function(iIndex, bIsSelected) {
		var oMItem = this.getModelItemByIndex(iIndex);

		// Update the internal model item: first 'selected' and then 'position'
		this._updateAndSyncProperties(iIndex, {
			selected: bIsSelected
		});
		this._updateAndSyncMItemsPosition();

		var aMItems = this.getProperty("/items");
		// Get selected items ordered from previous item of the current one to the top item (i.g. aMItemsSelected[0]
		// the item above of current item)
		var aMItemsSelected = this._getSelectedModelItemsBetween(oMItem, aMItems[0]);
		// Check if the position of current item in the table is lower then the previous item. If so the item
		// should be moved.
		if (aMItemsSelected.length && aMItemsSelected[0].position > oMItem.position) {
			this.moveModelItemPosition(oMItem, aMItemsSelected[0]);
		} else {
			// Get selected items ordered from next item of the current one to the bottom item (i.g. aMItemsSelected[0]
			// the item below of current item)
			aMItemsSelected = this._getSelectedModelItemsBetween(oMItem, aMItems[aMItems.length - 1]);
			// Check if the position of current item in the table is higher then the next item. If so the item
			// should be moved.
			if (aMItemsSelected.length && aMItemsSelected[0].position < oMItem.position) {
				this.moveModelItemPosition(oMItem, aMItemsSelected[0]);
			}
		}
	};

	/**
	 * Moves model item.
	 *
	 * @param {object} oMItemFrom Model item which will be removed
	 * @param {object} oMItemTo Model item at which index the removed model item will be inserted
	 * @public
	 */
	P13nSortModel.prototype.moveModelItem = function(iIndexFrom, iIndexTo) {
		var oMItemFrom = this.getModelItemByIndex(iIndexFrom);
		var oMItemTo = this.getModelItemByIndex(iIndexTo);
		if (!oMItemFrom || !oMItemTo) {
			return;
		}
		var aMItems = this.getProperty("/items");
		var iIndexFrom = aMItems.indexOf(oMItemFrom);
		var iIndexTo = aMItems.indexOf(oMItemTo);
		if (iIndexFrom < 0 || iIndexTo < 0 || iIndexFrom > aMItems.length - 1 || iIndexTo > aMItems.length - 1) {
			return;
		}

		// Move item
		var oMItemRemoved = aMItems.splice(iIndexFrom, 1)[0];
		aMItems.splice(iIndexTo, 0, oMItemRemoved);
		this.setProperty("/items", aMItems);
	};

	/**
	 * Moves a JSON model item.
	 * @param {int} iIndexFrom
	 * @param {int} iIndexTo
	 * @public
	 */
	P13nSortModel.prototype.moveModelItemPosition = function(iIndexFrom, iIndexTo) {
		var oMItemFrom = this.getModelItemByIndex(iIndexFrom);
		var oMItemTo = this.getModelItemByIndex(iIndexTo);
		var aSelectedMItems = this._getSelectedModelItemsBetween(oMItemFrom, oMItemTo);
		if (!aSelectedMItems.length) {
			return;
		}

		var aMItems = this.getProperty("/items");
		var iIndexFromLocal = aMItems.indexOf(oMItemFrom);
		var iIndexToLocal = aMItems.indexOf(oMItemTo);
		var aMItemsSorted = jQuery.extend(true, [], aMItems);
		aMItemsSorted.sort(function(a, b) {
			if (a.position < b.position) {
				return -1;
			} else if (a.position > b.position) {
				return 1;
			} else {
				return 0;
			}
		});

		// Calculate new 'position'

		// 1. We can remove the item from temporary stack because the array is sorted by 'position'
		var oMItemCopyRemoved = aMItemsSorted.splice(iIndexFromLocal, 1)[0];
		// 2. Assign new 'position'
		var iPosition = -1;
		aMItemsSorted.forEach(function(oMItem) {
			oMItem.position = oMItem.selected === true ? ++iPosition : undefined;
		});
		// 3. Insert the removed item to temporary stack
		aMItemsSorted.splice(iIndexToLocal, 0, oMItemCopyRemoved);
		// 4. Assign new 'position'
		iPosition = -1;
		aMItemsSorted.forEach(function(oMItem) {
			oMItem.position = oMItem.selected === true ? ++iPosition : undefined;
		});
		// 5. Take over the position from the temporary stack
		aMItems.forEach(function(oMItem, iIndex) {
			var oMItemCopy = PersonalizationUtil.getArrayElementByKey("columnKey", oMItem.columnKey, aMItemsSorted);
			this._updateAndSyncProperties(iIndex, {
				position: oMItemCopy.position
			});
		}, this);
	};

	/**
	 * @param {object} oMItemFrom Excluded item. The index of item can be higher or lower then the index of <code>oMItemTo</code>
	 * @param {object} oMItemTo Included item. The index of item can be higher or lower then the index of <code>oMItemFrom</code>
	 * @returns {array}
	 * @private
	 */
	P13nSortModel.prototype._getSelectedModelItemsBetween = function(oMItemFrom, oMItemTo) {
		var aMItems = this.getProperty("/items");
		var iIndexFrom = aMItems.indexOf(oMItemFrom);
		var iIndexTo = aMItems.indexOf(oMItemTo);
		if (iIndexFrom === iIndexTo) {
			// As the 'iIndexFrom' should be excluded of calculation, there is nothing in between
			return [];
		}
		var aMItemsCopy = [];
		if (iIndexFrom < iIndexTo) {
			// From top down
			// Convert oMItemFrom to 'included' item
			// Increase oMItemTo with 1 for slice
			aMItemsCopy = aMItems.slice(iIndexFrom + 1, iIndexTo + 1);
			return aMItemsCopy.filter(function(oMItem) {
				return !!oMItem.selected;
			});
		}
		// From bottom up
		aMItemsCopy = aMItems.slice(iIndexTo, iIndexFrom).reverse();
		return aMItemsCopy.filter(function(oMItem) {
			return !!oMItem.selected;
		});
	};

	/**
	 * @private
	 */
	P13nSortModel.prototype._sortBySelectedAndPosition = function(aMItems) {
		if (this.getProperty("/preventInitialSort")) {
			return;
		}
		aMItems.sort(function(a, b) {
			if (a.selected === true && (b.selected === false || b.selected === undefined)) {
				return -1;
			} else if ((a.selected === false || a.selected === undefined) && b.selected === true) {
				return 1;
			} else if (a.selected === true && b.selected === true) {
				if (a.position < b.position) {
					return -1;
				} else if (a.position > b.position) {
					return 1;
				} else {
					return 0;
				}
			} else if ((a.selected === false || a.selected === undefined) && (b.selected === false || b.selected === undefined)) {
				if (a.text < b.text) {
					return -1;
				} else if (a.text > b.text) {
					return 1;
				} else {
					return 0;
				}
			}
		});
	};

	return P13nSortModel;

}, /* bExport= */true);
