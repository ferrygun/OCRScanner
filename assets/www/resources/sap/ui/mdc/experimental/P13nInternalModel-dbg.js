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
	 * @class The P13nInternalModel is used to...
	 * @extends sap.ui.base.ManagedObject
	 * @author SAP SE
	 * @version 1.52.4
	 * @constructor
	 * @private
	 * @since 1.48.0
	 * @alias sap.ui.mdc.experimental.P13nInternalModel
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var P13nInternalModel = JSONModel.extend("sap.ui.mdc.experimental.P13nInternalModel", /** @lends sap.ui.mdc.experimental.P13nInternalModel.prototype */
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
	P13nInternalModel.prototype._initialize = function() {
		var aMItems = this.getProperty("/tableItems").map(function(oP13nItem) {
			if (typeof oP13nItem === "string") {
				oP13nItem = sap.ui.getCore().byId(oP13nItem);
			}
			return {
				columnKey: oP13nItem.getColumnKey(),
				selected: oP13nItem.getSelected(),
				position: oP13nItem.getPosition(),
				// needed for initial sorting
				text: oP13nItem.getText()
			};
		});
		this._sortBySelectedAndPosition(aMItems);
		this.setData({
			items: aMItems
		});
		this.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
		this.setSizeLimit(1000);
	};

	/**
	 * @returns {object || undefined}
	 * @public
	 */
	P13nInternalModel.prototype.getModelItemByColumnKey = function(sColumnKey) {
		var aMItem = this.getProperty("/items").filter(function(oMItem) {
			return oMItem.columnKey === sColumnKey;
		});
		return aMItem[0];
	};

	/**
	 *
	 * @public
	 */
	P13nInternalModel.prototype.getIndexOfModelItem = function(oMItem) {
		return this.getProperty("/items").indexOf(oMItem);
	};

	/**
	 * Moves a model item depending on the real position in the table.
	 * @public
	 */
	P13nInternalModel.prototype.selectModelItem = function(oMItemFrom, bIsSelected) {
		// Update the internal model item
		oMItemFrom.selected = bIsSelected;

		var aMItems = this.getProperty("/items");
		// Get selected items ordered from previous item of the current one to the top item (i.g. aMItemsSelected[0]
		// the item above of current item)
		var aMItemsSelected = this._getSelectedModelItemsBetween(oMItemFrom, aMItems[0]);
		// Check if the position of current item in the table is lower then the previous item. If so the item
		// should be moved.
		if (aMItemsSelected.length && aMItemsSelected[0].position > oMItemFrom.position) {
			this.moveModelItemPosition(oMItemFrom, aMItemsSelected[0]);
		} else {
			// Get selected items ordered from next item of the current one to the bottom item (i.g. aMItemsSelected[0]
			// the item below of current item)
			aMItemsSelected = this._getSelectedModelItemsBetween(oMItemFrom, aMItems[aMItems.length - 1]);
			// Check if the position of current item in the table is higher then the next item. If so the item
			// should be moved.
			if (aMItemsSelected.length && aMItemsSelected[0].position < oMItemFrom.position) {
				this.moveModelItemPosition(oMItemFrom, aMItemsSelected[0]);
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
	P13nInternalModel.prototype.moveModelItem = function(oMItemFrom, oMItemTo) {
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
	 * @param {object} oMItemFrom
	 * @param {object} oMItemTO
	 * @public
	 */
	P13nInternalModel.prototype.moveModelItemPosition = function(oMItemFrom, oMItemTo) {
		var aSelectedMItems = this._getSelectedModelItemsBetween(oMItemFrom, oMItemTo);
		if (!aSelectedMItems.length) {
			return;
		}
		var aMItems = this.getProperty("/items");

		var iIndexFrom = aMItems.indexOf(oMItemFrom);
		var iIndexTo = aMItems.indexOf(oMItemTo);
		// Convert to last selected item
		if (iIndexFrom < iIndexTo) {
			// From up to down
			oMItemTo = aSelectedMItems[aSelectedMItems.length - 1];
		} else {
			// From down to up
			oMItemTo = aSelectedMItems[aSelectedMItems.length - 1];
		}

		// Calculate new 'position'
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
		// 1. We can remove the item because the array is sorted by 'position'
		var oMItemCopyRemoved = aMItemsSorted.splice(oMItemFrom.position, 1)[0];
		// 2. Assign new 'position'
		aMItemsSorted.forEach(function(oMItem, iIndex) {
			oMItem.position = iIndex;
		});
		// 3. Insert the removed item
		aMItemsSorted.splice(oMItemTo.position, 0, oMItemCopyRemoved);
		// 4. Assign new 'position'
		aMItemsSorted.forEach(function(oMItem, iIndex) {
			oMItem.position = iIndex;
		});
		// Take over the position
		aMItems.forEach(function(oMItem, iIndex) {
			var oMItemCopy = PersonalizationUtil.getArrayElementByKey("columnKey", oMItem.columnKey, aMItemsSorted);
			this.setProperty("/items/" + iIndex + "/position", oMItemCopy.position);
		}, this);
	};

	/**
	 * @param {object} oMItemFrom Excluded item. The index of item can be higher or lower then the index of <code>oMItemTo</code>
	 * @param {object} oMItemTo Included item. The index of item can be higher or lower then the index of <code>oMItemFrom</code>
	 * @returns {array}
	 * @private
	 */
	P13nInternalModel.prototype._getSelectedModelItemsBetween = function(oMItemFrom, oMItemTo) {
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
	P13nInternalModel.prototype._sortBySelectedAndPosition = function(aMItems) {
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

	return P13nInternalModel;

}, /* bExport= */true);
