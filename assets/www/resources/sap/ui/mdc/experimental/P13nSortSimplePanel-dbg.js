/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	'jquery.sap.global', 'sap/m/library', './P13nPanel', './P13nSortModel'
], function(jQuery, MLibrary, P13nPanel, P13nSortModel) {
	"use strict";

	/**
	 * Constructor for a new P13nSortSimplePanel.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The P13nSortSimplePanel control is used to define sort order of items.
	 * @extends sap.ui.mdc.experimental.P13nPanel
	 * @author SAP SE
	 * @version 1.52.4
	 * @constructor
	 * @private
	 * @since 1.52.0
	 * @alias sap.ui.mdc.experimental.P13nSortSimplePanel
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var P13nSortSimplePanel = P13nPanel.extend("sap.ui.mdc.experimental.P13nSortSimplePanel", /** @lends sap.ui.mdc.experimental.P13nSortSimplePanel.prototype */
	{
		metadata: {
			library: "sap.ui.mdc",
			properties: {
				/**
				 * Internal model.
				 */
				internalModel: {
					type: "sap.ui.mdc.experimental.P13nSortModel",
					visibility: "hidden"
				}
			}
		}
	});

	// ----------------------- Overwrite Methods -----------------

	P13nSortSimplePanel.prototype.init = function() {
		P13nPanel.prototype.init.apply(this, arguments);

		this._proxyOnModelContextChange = jQuery.proxy(this._onModelContextChange, this);
		this.attachModelContextChange(this._proxyOnModelContextChange);
	};

	P13nSortSimplePanel.prototype.refreshInitialState = function() {
		this._bInternalModelToBeUpdated = true;
		this.invalidate();
	};

	P13nSortSimplePanel.prototype._onModelContextChange = function() {
		if (!this.getModel()) {
			return;
		}
		this._updateInternalModel();
	};

	P13nSortSimplePanel.prototype.onBeforeRendering = function() {
		this._updateInternalModel();
	};

	P13nSortSimplePanel.prototype.exit = function() {
		this.detachModelContextChange(this._proxyOnModelContextChange);
	};

	// ----------------------- Private Methods -----------------------------------------

	/**
	 * Change SortOrder via RadioButton.
	 * @param oEvent
	 */
	P13nSortSimplePanel.prototype.onChangeSortOrderBySelection = function(oEvent) {
		var oTableItem = this._getTable().getSelectedItems()[0];
		var iIndex = this._getTable().indexOfItem(oTableItem);

		this.getInternalModel().updateProperties(iIndex, {
			sortOrder: this._getSelectedSortOrder()
		});
	};
	/**
	 * Change of SortOrder via pressing on 'SortOrder' table item.
	 * @param oEvent
	 */
	P13nSortSimplePanel.prototype.onChangeSortOrderByItemPress = function(oEvent) {
		var sSortOrder = oEvent.getParameter('listItem') === this.byId("IDAscendingItem") ? "Ascending" : "Descending";
		var oTableItem = this._getTable().getSelectedItems()[0];
		var iIndex = this._getTable().indexOfItem(oTableItem);

		this._getManagedObjectModel().setProperty("/@custom/sortOrder", sSortOrder);

		this.getInternalModel().updateProperties(iIndex, {
			sortOrder: sSortOrder
		});
	};

	/**
	 * RadioButton of table item has been pressed.
	 * @param oEvent
	 */
	P13nSortSimplePanel.prototype.onSelectionChange = function(oEvent) {
		oEvent.getParameter("listItems").forEach(function(oTableItem) {
			this._selectTableItem(oTableItem);
		}, this);
	};
	/**
	 * Table item has been pressed.
	 * @param oEvent
	 */
	P13nSortSimplePanel.prototype.onItemPress = function(oEvent) {
		var oTableItem = oEvent.getParameter('listItem');
		this._selectTableItem(oTableItem);
	};
	P13nSortSimplePanel.prototype._selectTableItem = function(oTableItem) {
		var iIndex = this._getTable().indexOfItem(oTableItem);
		// Remove the 'sortOrder' of previous model item and set the 'sortOrder' of current model item (only in simple panel)
		var sSortOrder = this._getSelectedSortOrder();
		this._getTable().getItems().forEach(function(oTableItem, iIndex_) {
			this.getInternalModel().updateProperties(iIndex_, {
				sortOrder: (iIndex_ === iIndex ? sSortOrder : undefined),
				selected: (iIndex_ === iIndex),
				position: (iIndex_ === iIndex ? 0 : undefined)
			});
		}, this);
	};

	// ------------------ helper methods -----------------------------------------

	/**
	 * @returns {sap.m.ListItemBase || undefined}
	 * @private
	 */
	P13nSortSimplePanel.prototype._getTableItemByColumnKey = function(sColumnKey) {
		var aContext = this._getTable().getBinding("items").getContexts();
		var aTableItem = this._getTable().getItems().filter(function (oTableItem, iIndex) {
			return aContext[iIndex].getObject().columnKey === sColumnKey;
		});
		return aTableItem[0];
	};
	P13nSortSimplePanel.prototype._getSelectedSortOrder = function() {
		var oTableItemSortOrder = this.byId("IDSortOrderTable").getSelectedItems()[0];
		return oTableItemSortOrder === this.byId("IDAscendingItem") ? "Ascending" : "Descending";
	};
	P13nSortSimplePanel.prototype._getTable = function() {
		return sap.ui.getCore().byId(this.getId() + "--IDTable") || null;
	};

	P13nSortSimplePanel.prototype._updateInternalModel = function() {
		if (!this._bInternalModelToBeUpdated) {
			return;
		}
		this._bInternalModelToBeUpdated = false;

		var aSelectedItems = this.getItems().filter(function(oItem) {
			return oItem.getSelected();
		});

		this.setInternalModel(new P13nSortModel({
			preventInitialSort: true,
			tableItems: this.getItems().filter(function(oItem) {
				return oItem;
			}),
			availableItems: this.getItems().filter(function(oItem) {
				return oItem;
			})
		}));
		this._getTable().setModel(this.getInternalModel(), "JSONItems");

		// Reduce selected items to only one (special for single sort)
		if (aSelectedItems.length > 1) {
			var oMItem = this.getInternalModel().getModelItemByColumnKey(aSelectedItems[0].getColumnKey());
			var oTableItem = this._getTableItemByColumnKey(oMItem.columnKey);
			this._selectTableItem(oTableItem);

			this._getManagedObjectModel().setProperty("/@custom/sortOrder", aSelectedItems[0].getSortOrder());
		}
	};

	return P13nSortSimplePanel;

}, /* bExport= */true);
