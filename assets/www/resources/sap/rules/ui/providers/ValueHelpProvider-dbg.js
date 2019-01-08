/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

 (c) Copyright 2009-2016 SAP SE. All rights reserved
 */
// -----------------------------------------------------------------------------
// Retrieves the data for a value list from the OData metadata to bind to a given control/aggregation (TODO: take into account Searchsupported +
// ValueList In/Out/InOut parameter to set data)
// -----------------------------------------------------------------------------
sap.ui.define([
	'jquery.sap.global', 'sap/m/List', 'sap/m/PlacementType', 'sap/m/ResponsivePopover', 'sap/m/StandardListItem',
	'sap/ui/comp/providers/ValueHelpProvider', 'sap/ui/model/json/JSONModel'
], function(jQuery, List, PlacementType, ResponsivePopover, StandardListItem, ValueListProvider, JSONModel) {
	"use strict";

	/**
	 * Retrieves the data for a collection from the OData metadata to bind to a given control/aggregation
	 *
	 * @constructor
	 * @private
	 * @param {object} mParams - map containing the control,aggregation,annotation and the oODataModel
	 */
	var ValueHelpProvider = ValueListProvider.extend("sap.rules.ui.providers.ValueHelpProvider", {
		constructor: function(mParams) {
			if (mParams) {
				this._cursorPosition = mParams.cursorPosition;
				this._bReplaceWord = mParams.bReplaceWord;
				this._businessDataType = mParams.businessDataType;
				this._bAddSpace = mParams.bAddSpace;
			}
			ValueListProvider.apply(this, arguments); // Call constructor of base class
			this._onInitialise();
		}
	});

	ValueHelpProvider.prototype._onOK = function(oControlEvent) {
        
		var aTokens = oControlEvent.getParameter("tokens"),
			oRangeData, sKey, i = 0,
			aRowData = [],
			oRowData = null;
		// First close the dialog, since when used in an aggregation - some model updates (setting IN/OUT params to ODataModel) destroy this
		// instance/control!
		this._onCancel();
		if (this.oControl instanceof sap.m.MultiInput) {
			// Clearing typed text if value is not selected from suggestion list but rather from ValueHelpDialog
			this.oControl.setValue("");
			this.oControl.setTokens(aTokens);
			i = aTokens.length;
			while (i--) {
				oRowData = aTokens[i].data("row");
				if (oRowData) {
					aRowData.push(oRowData);
				}
			}
		} else {
			if (aTokens[0]) {
				// Single Interval
				if (this.bIsSingleIntervalRange) {
					oRangeData = aTokens[0].data("range");
					if (oRangeData) {
						// check if data is in the format: "2005-2014"
						if (oRangeData.operation === "BT") {
							sKey = oRangeData.value1 + "-" + oRangeData.value2;
						} else {
							sKey = oRangeData.value1;
						}
					}
				} else {
					sKey = aTokens[0].getKey();
				}
				oRowData = aTokens[0].data("row");
				if (oRowData) {
					aRowData.push(oRowData);
				}
			}
            if (this.oControl instanceof sap.rules.ui.ExpressionAdvanced) {
                this.oControl.setTextOnCursor(sKey, this._cursorPosition, this._bReplaceWord, this._businessDataType, this._bAddSpace);
                // Manually trigger the change event on sapUI5 control since it doesn't do this internally on setValue!
                this.oControl.fireChange({
                    value: sKey,
                    validated: true
                });
            } else {
                this.oControl.setValue(sKey);
                this.oControl.fireChange();
            }
			
		}
		this._calculateAndSetFilterOutputData(aRowData);
	};
	ValueHelpProvider.prototype._onInitialise = function(oControlEvent) {
		ValueListProvider.prototype._onInitialise.apply(this, [oControlEvent]);
		var oExpressionAdvanced = this.oControl;
        var oPopOver = oExpressionAdvanced.getParent();
		if (oExpressionAdvanced instanceof sap.rules.ui.DecisionTableCellExpressionAdvanced) {
			oExpressionAdvanced.setBusy(true);
			oPopOver.setModal(true);
		} else if (this._popover) {
            this._popover.setModal(true);
        }

	};
	ValueHelpProvider.prototype._onCancel = function(oControlEvent) {
		this.oValueHelpDialog.close();
		var oExpressionAdvanced = this.oControl;
        var oPopOver = oExpressionAdvanced.getParent();
		if (oExpressionAdvanced instanceof sap.rules.ui.DecisionTableCellExpressionAdvanced) {
			oPopOver.setModal(false);
			oExpressionAdvanced.setBusy(false);
		} else if (this._popover) {
            this._popover.setModal(false);
        }
	};

    //overwrite _createAdditionalValueHelpControls method in order set the advanced search area closed
    ValueHelpProvider.prototype._createAdditionalValueHelpControls = function() {
        //call super method
        ValueListProvider.prototype._createAdditionalValueHelpControls.call(this);
        //set the ExpandAdvancedArea to be closed
        this.oSmartFilterBar.setExpandAdvancedArea(false);
    };
    
    ValueHelpProvider.prototype._rebindTable = function() {
        ValueListProvider.prototype._rebindTable.call(this,arguments);
        var oTable = this.oValueHelpDialog.getTable();
        oTable.getBinding("rows").attachDataReceived(function(oEvent) {
            oTable.setBusy(false);
        }, this);
    };
    
    //overwrite _onValueHelpDialogRequired method in order to set the with of each column to be auto and streched the to columns fit the table width.
    ValueHelpProvider.prototype._onValueHelpDialogRequired = function(a) {
		//call super method
		ValueListProvider.prototype._onValueHelpDialogRequired.call(this,a);
		
		//Fix RULES-4947 - valueHelp for numeric values
		this.oValueHelpDialog.setDescriptionKey(null);
		
		//get the table control
		var oTable = this.oValueHelpDialog.getTable();
		// get the columns of the table
		var arrColumns = oTable.getColumns();
		
		for (var i = 0 ; i < arrColumns.length ; i++){
			arrColumns[i].setWidth("auto");
		}
		
		
    };
    
	return ValueHelpProvider;

}, /* bExport= */ true);
