/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	'jquery.sap.global', 'sap/m/library', './P13nPanel', './P13nSortModel', 'sap/ui/model/json/JSONModel'
], function(jQuery, MLibrary, P13nPanel, P13nSortModel, JSONModel) {
	"use strict";

	/**
	 * Constructor for a new P13nSortQBGridPanel.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The P13nSortQBGridPanel control is used to define sort order of items.
	 * @extends sap.ui.mdc.experimental.P13nPanel
	 * @author SAP SE
	 * @version 1.52.4
	 * @constructor
	 * @private
	 * @since 1.52.0
	 * @alias sap.ui.mdc.experimental.P13nSortQBGridPanel
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var P13nSortQBGridPanel = P13nPanel.extend("sap.ui.mdc.experimental.P13nSortQBGridPanel", /** @lends sap.ui.mdc.experimental.P13nSortQBGridPanel.prototype */
	{
		metadata: {
			library: "sap.ui.mdc"
		}
	});

	// ----------------------- Overwrite Methods -----------------

	P13nSortQBGridPanel.prototype.init = function() {
		P13nPanel.prototype.init.apply(this, arguments);

		// Internal model.
		this._oInternalModel = undefined;

		this._proxyOnModelContextChange = jQuery.proxy(this._onModelContextChange, this);
		this.attachModelContextChange(this._proxyOnModelContextChange);
	};

	P13nSortQBGridPanel.prototype.refreshInitialState = function() {
		this._bInternalModelToBeUpdated = true;
		this.invalidate();
	};

	P13nSortQBGridPanel.prototype._onModelContextChange = function() {
		if (!this.getModel()) {
			return;
		}
		this._updateInternalModel();
	};

	P13nSortQBGridPanel.prototype.onBeforeRendering = function() {
		this._updateInternalModel();
	};

	P13nSortQBGridPanel.prototype.exit = function() {
		this.detachModelContextChange(this._proxyOnModelContextChange);
	};

	// ----------------------- Private Methods -----------------------------------------

	/**
	 * Change SortOrder via Select.
	 * @param oEvent
	 */
	P13nSortQBGridPanel.prototype.onChangeSortOrderBySelection = function(oEvent) {
		var oTableItem = oEvent.getSource().getParent();
		var iIndex = this._getTable().indexOfContent(oTableItem);
		this._oInternalModel.updateProperties(iIndex, {
			sortOrder: this._getSelectedSortOrder(oEvent.getParameter("selectedItem"))
		});
	};
	/**
	 * ColumnKey has been changed by ComboBox due to:
	 * - entering new value
	 * - choosing value from the list
	 * @param oEvent
	 */
	P13nSortQBGridPanel.prototype.onSelectionChange = function(oEvent) {
		//console.log("selectionChange: " + oEvent.getParameter("selectedItem") + " " + oEvent.getSource().getValue());
		// If columnKey does not exist - do not update
		if (!oEvent.getParameter("selectedItem")) {
			return;
		}
		var oTableItem = oEvent.getSource().getParent();
		this._selectTableItem(oTableItem);
	};
	/**
	 * ColumnKey has been changed by ComboBox in combination with:
	 * - leave of focus OR
	 * - press of Enter key.
	 * @param oEvent
	 */
	P13nSortQBGridPanel.prototype.onChangeComboBox = function(oEvent) {
		// Value in text input field is changed AND (focus leaves OR Enter Key pressed)
		//console.log("change: " + oEvent.getSource().getSelectedItem() + " " + oEvent.getParameter("newValue"));
		// // If columnKey does not exist - do not update
		// if (!oEvent.getSource().getSelectedItem()) {
		// 	return;
		// }
		var oTableItem = oEvent.getSource().getParent();
		this._selectTableItem(oTableItem);
	};
	P13nSortQBGridPanel.prototype._selectTableItem = function(oTableItem) {
		var iIndex = this._getTable().indexOfContent(oTableItem);
		this._oInternalModel.replaceModelItemOfIndex(iIndex);
	};

	P13nSortQBGridPanel.prototype.onPressAdd = function(oEvent) {
		var oTableItem = oEvent.getSource().getParent().getParent();
		var iIndex = this._getTable().indexOfContent(oTableItem);
		this._oInternalModel.insertModelItemOfIndex(iIndex);
	};

	P13nSortQBGridPanel.prototype.onPressRemove = function(oEvent) {
		var oTableItem = oEvent.getSource().getParent().getParent();
		var iIndex = this._getTable().indexOfContent(oTableItem);
		this._oInternalModel.removeModelItemOfIndex(iIndex);
	};

	P13nSortQBGridPanel.prototype.onPressDown = function(oEvent) {
		var oTableItem = oEvent.getSource().getParent().getParent();
		var aVisibleTableItems = this._getVisibleTableItems();
		this._moveTableItem(oTableItem, aVisibleTableItems[aVisibleTableItems.indexOf(oTableItem) + 1]);
	};

	P13nSortQBGridPanel.prototype.onPressUp = function(oEvent) {
		var oTableItem = oEvent.getSource().getParent().getParent();
		var aVisibleTableItems = this._getVisibleTableItems();
		this._moveTableItem(oTableItem, aVisibleTableItems[aVisibleTableItems.indexOf(oTableItem) - 1]);
	};
	P13nSortQBGridPanel.prototype._moveTableItem = function(oTableItemFrom, oTableItemTo) {
		var iIndexFrom = this._getTable().indexOfContent(oTableItemFrom);
		var iIndexTo = this._getTable().indexOfContent(oTableItemTo);

		// 1. Change the 'position' on model items
		this._oInternalModel.moveModelItemPosition(iIndexFrom, iIndexTo);
		// 2. Move the items inside of the model
		this._oInternalModel.moveModelItem(iIndexFrom, iIndexTo);
	};

	// ------------------ helper methods -----------------------------------------

	P13nSortQBGridPanel.prototype._getVisibleTableItems = function() {
		return this._getTable().getContent().filter(function(oTableItem) {
			return !!oTableItem.getVisible();
		});
	};
	P13nSortQBGridPanel.prototype._getTable = function() {
		return sap.ui.getCore().byId(this.getId() + "--IDVerticalLayout") || null;
	};
	P13nSortQBGridPanel.prototype._getSelectedSortOrder = function(oComboBoxItem) {
		return oComboBoxItem.getKey();
	};

	P13nSortQBGridPanel.prototype._updateInternalModel = function() {
		if (!this._bInternalModelToBeUpdated) {
			return;
		}
		this._bInternalModelToBeUpdated = false;

		this._oInternalModel = new P13nSortModel({
			tableItems: this.getItems().filter(function(oItem) {
				return oItem.getSelected();
			}),
			availableItems: this.getItems().filter(function(oItem) {
				return oItem;
			})
		});
		this._getTable().setModel(this._oInternalModel, "JSONItems");
	};

	return P13nSortQBGridPanel;

}, /* bExport= */true);
