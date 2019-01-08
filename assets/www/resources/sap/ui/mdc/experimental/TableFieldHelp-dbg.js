/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	'sap/ui/mdc/experimental/FieldHelpBase', 'sap/ui/model/base/ManagedObjectModel',
	'sap/ui/base/ManagedObjectObserver', 'sap/m/List', 'sap/m/DisplayListItem'
], function(FieldHelpBase, ManagedObjectModel, ManagedObjectObserver, List, DisplayListItem) {
	"use strict";

	/**
	 * Constructor for a new TableFieldHelp.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class A field help used in the <code>FieldFelp</code> aggregation in <code>Field</code> controls that shows a table
	 * @extends sap.ui.core.Element
	 * @version 1.52.4
	 * @constructor
	 * @private
	 * @since 1.50.0
	 * @alias sap.ui.mdc.experimental.TableFieldHelp
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var TableFieldHelp = FieldHelpBase.extend("sap.ui.mdc.experimental.TableFieldHelp", /** @lends sap.ui.mdc.experimental.TableFieldHelp.prototype */
	{
		metadata: {
			library: "sap.ui.mdc",
			properties: {
				/**
				 * The table column that holds the key of a row.
				 */
				keyColumn: {
					type: "int",
					group: "Data",
					defaultValue: 0
					},

				/**
				 * The table column that holds the description of a row.
				 */
				valueColumn: {
					type: "int",
					group: "Data",
					defaultValue: 0
					}
				},
			aggregations: {
				/**
				 * table of the Field help
				 */
				table: {
					type: "sap.m.Table",
					multiple: false
				}
			},
			defaultAggregation: "table",
			events: {

			}
		}
	});

	TableFieldHelp.prototype.init = function() {

		FieldHelpBase.prototype.init.apply(this, arguments);

		this._oObserver = new ManagedObjectObserver(_observeChanges.bind(this));

		this._oObserver.observe(this, {
			properties: ["selectedKey", "filterValue"],
			aggregations: ["table"]
		});

	};

	TableFieldHelp.prototype.exit = function() {

		FieldHelpBase.prototype.exit.apply(this, arguments);

		this._oObserver.disconnect();
		this._oObserver = undefined;

	};

	TableFieldHelp.prototype._createPopover = function() {

		var oPopover = FieldHelpBase.prototype._createPopover.apply(this, arguments);

		var oParent = this.getParent();
		if (oParent) {
			oPopover.setInitialFocus(oParent);
		}

//		var oFilter = new sap.ui.model.Filter("text", _suggestFilter.bind(this));

		oPopover.getContent = function() {
			var oParent = this.getParent();
			if (oParent) {
				return [oParent.getTable()];
			}
			return [];
		};

		return oPopover;

	};

	TableFieldHelp.prototype.setParent = function(oParent, sAggregationName, bSuppressInvalidate) {

		FieldHelpBase.prototype.setParent.apply(this, arguments);

		// focus should stay on Field
		var oPopover = this.getAggregation("_popover");
		if (oPopover) {
			oPopover.setInitialFocus(oParent);
		}

		return this;

	};

	function _observeChanges(oChanges) {

		if (oChanges.name == "table") {
			this.fireDataUpdate();
			var oTable = oChanges.child;
			var oPopover = this.getAggregation("_popover");
			if (oChanges.mutation == "remove") {
				oTable.detachEvent("selectionChange", _handleSelectionChange, this);
				oTable.detachEvent("updateFinished", _handleUpdateFinished, this);
			} else {
				oTable.setMode(sap.m.ListMode.SingleSelectMaster);
				oTable.setRememberSelections(false);
				oTable.attachEvent("selectionChange", _handleSelectionChange, this);
				oTable.attachEvent("updateFinished", _handleUpdateFinished, this);
				_updateSelection.call(this, this.getSelectedKey());
			}
			if (oPopover) {
				oPopover.invalidate();
			}
		}


		if (oChanges.name == "selectedKey") {
			_updateSelection.call(this, oChanges.current);
		}

		if (oChanges.name == "filterValue") {
//			if (this._oList) {
//				var oBinding = this._oList.getBinding("items");
//				oBinding.update();
//				this._oList.updateItems();
//				this._oList.invalidate();
//				_updateSelection.call(this, this.getSelectedKey()); // to update selection
//			}
		}

	}

	TableFieldHelp.prototype.openByTyping = function() {

		return true;

	};

	TableFieldHelp.prototype.navigate = function(iStep) {

		var oTable = this.getTable();
		var oPopover = this._getPopover();
		var oSelectedItem = oTable.getSelectedItem();
		var aItems = oTable.getItems();
		var iItems = aItems.length;
		var iSelectedIndex = 0;

		if (oSelectedItem) {
			iSelectedIndex = oTable.indexOfItem(oSelectedItem);
			iSelectedIndex = iSelectedIndex + iStep;
			if (iSelectedIndex < 0) {
				iSelectedIndex = 0;
			} else if (iSelectedIndex >= iItems - 1) {
				iSelectedIndex = iItems - 1;
			}
		} else if (iStep >= 0){
			iSelectedIndex = iStep - 1;
		} else {
			iSelectedIndex = iItems + iStep;
		}

		var oItem = aItems[iSelectedIndex];
		if (oItem) {
			oItem.setSelected(true);
			var oKeyValue = _getKeyValueFromItem.call(this, oItem);
			this.setProperty("selectedKey", oKeyValue.key, true); // do not invalidate while FieldHelp

			if (!oPopover.isOpen()) {
				this.open();
			}

			this.fireNavigate({value: oKeyValue.value, additionalValue: oKeyValue.additionalValue, key: oKeyValue.key});
		}

	};

	TableFieldHelp.prototype.getTextForKey = function(sKey) {

//TODO. callback for paging???
		var iKeyColumn = this.getKeyColumn();
		var iValueColumn = this.getValueColumn();
		var oTable = this.getTable();

		if (oTable) {
			var aItems = oTable.getItems();

			for (var i = 0; i < aItems.length; i++) {
				var oItem = aItems[i];
				if (oItem.getCells) {
					// only for customListItem
					//TODO: fallback functions for other items???
					var aCells = oItem.getCells();
					var oKeyControl = aCells[iKeyColumn];
					var oValueControl = aCells[iValueColumn];
					var sItemKey;
					if (oKeyControl.getText) {
						sItemKey = oKeyControl.getText();
					}

					if (sKey == sItemKey) {
						if (oValueControl.getText) {
							return oValueControl.getText();
						} else {
							return "";
						}
					}
				}
			}
		}
		return "";

	};

	TableFieldHelp.prototype.getKeyForText = function(sText) {

	//TODO. callback for paging???
		var iKeyColumn = this.getKeyColumn();
		var iValueColumn = this.getValueColumn();
		var oTable = this.getTable();

		if (oTable) {
			var aItems = oTable.getItems();

			for (var i = 0; i < aItems.length; i++) {
				var oItem = aItems[i];
				if (oItem.getCells) {
					// only for customListItem
					//TODO: fallback functions for other items???
					var aCells = oItem.getCells();
					var oKeyControl = aCells[iKeyColumn];
					var oValueControl = aCells[iValueColumn];
					var sValue;
					if (oValueControl.getText) {
						sValue = oValueControl.getText();
					}

					if (sValue == sText) {
						if (oKeyControl.getText) {
							return oKeyControl.getText();
						} else {
							return "";
						}
					}
				}
			}
		}
		return "";

	};

	function _handleSelectionChange(oEvent) {
		var oItem = oEvent.getParameter("listItem");
		var bSelected = oEvent.getParameter("selected");

		if (bSelected) {
			var oKeyValue = _getKeyValueFromItem.call(this, oItem);
			this.setProperty("selectedKey", oKeyValue.key, true); // do not invalidate while FieldHelp
			this.close();
			this.fireSelect({value: oKeyValue.value, additionalValue: oKeyValue.additionalValue, key: oKeyValue.key});
		}
	}

	function _getKeyValueFromItem(oItem) {

		var iKeyColumn = this.getKeyColumn();
		var iValueColumn = this.getValueColumn();
		var sKey;
		var sValue;
		var sAdditionalValue;

		if (oItem.getCells) {
			// only for customListItem
			//TODO: fallback functions for other items???
			var aCells = oItem.getCells();
			var oKeyControl = aCells[iKeyColumn];
			var oValueControl = aCells[iValueColumn];
			if (oKeyControl.getText) {
				sKey = oKeyControl.getText();
			}
			if (oValueControl.getText) {
				sValue = oValueControl.getText();
			}
		}

		return {key: sKey, value: sValue, additionalValue: sAdditionalValue};

	}

	function _handleUpdateFinished() {

		_updateSelection.call(this, this.getSelectedKey());
		this.fireDataUpdate();

	}

//	function _suggestFilter(sText) {
//
//		var sFilterValue = this.getFilterValue();
//
//		if (!sFilterValue || jQuery.sap.startsWithIgnoreCase(sText, sFilterValue)) {
//			return true;
//		} else {
//			return false;
//		}
//
//	}

	function _updateSelection(sSelectedKey) {

		var oTable = this.getTable();
		if (oTable) {
			var aItems = oTable.getItems();
			for (var i = 0; i < aItems.length; i++) {
				var oItem = aItems[i];
				var oKeyValue = _getKeyValueFromItem.call(this, oItem);
				if (oKeyValue.key == sSelectedKey) {
					oItem.setSelected(true);
				} else {
					oItem.setSelected(false);
				}
			}
		}

	}

	return TableFieldHelp;

}, /* bExport= */true);
