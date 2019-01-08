/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

/**
 *
 *
 * @private
 * @name sap.fe.controls._Table.GridTable.GridTable.controller
 * @author SAP SE
 * @version 1.52.4
 * @since ??
 * @param {}
 * @returns {sap.fe.controls._Table.GridTable.GridTable.controller} new GridTable controller
 */
sap.ui.define([
	"sap/ui/mdc/library",
	"../Table.controller"
], function (Library, TableController) {
	"use strict";

	/**
	 * @private
	 * @constructor
	 * @param {}
	 */

	var GridTableController = TableController.extend("sap.ui.mdc.internal.table.gridtable.GridTable.controller", {
		constructor: function (oTable) {
			TableController.apply(this, arguments);
			this.oTable = oTable;
		}
	});

	/**
	 *
	 *
	 * @param {}
	 * @private
	 */

     /*
	 this method checks the multiplicity of the actions and sets the selection mode accordingly
	 only sap.fe.controls.Action instances in the tables headerbar are considered
	 */

	GridTableController.prototype.setSelectionMode = function () {
		var aToolbarActions = this.getToolbarActions(this.oInnerTable.getExtension()[0].getContent());
		var iMultiplicityTo;
		var sSelectionMode = 'None';

		for (var i = 0; i < aToolbarActions.length; i++) {
			iMultiplicityTo = aToolbarActions[i].getMultiplicityTo();
			if (iMultiplicityTo > 1 || !iMultiplicityTo) {
				sSelectionMode = 'MultiToggle';
				break;
			} else if (iMultiplicityTo === 1) {
				sSelectionMode = 'Single';
			}
		}

	    this.oInnerTable.setSelectionMode(sSelectionMode);

	};



	/*
	 this method checks the multiplicity of the actions and sets the selection mode accordingly
	 only sap.fe.controls.Action instances in the tables headerbar are considered
	 */

	GridTableController.prototype.enableDisableActions = function () {
		var aToolbarActions = this.getToolbarActions(this.oInnerTable.getExtension()[0].getContent());
		var iSelected = this.oInnerTable.getSelectedIndices().length;
		this.enableDisableActionsUtil(iSelected,aToolbarActions);

	};

	GridTableController.prototype.bindTableCount = function () {
		var oTitle = this.oInnerTable.getExtension()[0].getContent()[0];
		this.bindTableCountUtil(oTitle);
	};



	GridTableController.prototype.handleDataReceived = function (oEvent) {
		var oError = oEvent.getParameter("error");

		if (oError) {
			// fire the showError event to show a message box via controllerImplementation
			this.oInnerTable.setNoData(Library.getText("table.TECHINCAL_ERROR"));
			this.oTable.fireShowError(oEvent);
		} else {
			this.oInnerTable.setNoData(Library.getText("table.NO_DATA_TEXT"));
		}
		//This is work around for Table data loading issue when visibleRowCountMode is auto in initial
		if (this.oInnerTable.getVisibleRowCountMode() != "Auto") {
			this.oInnerTable.setVisibleRowCountMode("Auto");
		}
		this.oInnerTable.setBusy(false);
	};


	GridTableController.prototype.getListBinding = function () {
		return this.oInnerTable.getBinding("rows");

	};

	GridTableController.prototype.getListBindingInfo = function () {
		return this.oInnerTable.getBindingInfo("rows");
	};

	return GridTableController;

});
