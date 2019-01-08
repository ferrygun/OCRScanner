/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

/**
 *
 *
 * @private
 * @name sap.fe.controls._Table.ResponsiveTable.ResponsiveTable.controller
 * @author SAP SE
 * @version 1.52.4
 * @since ??
 * @param {}
 * @returns {sap.fe.controls._Table.ResponsiveTable.ResponsiveTable.controller} new ResponsiveTable controller
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

	var ResponsiveTableController = TableController.extend("sap.ui.mdc.internal.table.responsivetable.ResponsiveTable.controller", {
		constructor: function (oTable) {
			TableController.apply(this, arguments);
			this.oTable = oTable;
		}
	});

	/**
	 *
	 * This method checks the multiplicity of the actions and sets the selection mode accordingly
	 * only sap.fe.controls.Action instances in the tables headerbar are considered
	 *
	 * @param {}
	 * @private
	 */

	ResponsiveTableController.prototype.setSelectionMode = function () {
		var aToolbarActions = this.getToolbarActions(this.oInnerTable.getHeaderToolbar().getContent());
		var iMultiplicityTo;
		var sSelectionMode = 'None';

		for (var i = 0; i < aToolbarActions.length; i++) {
			iMultiplicityTo = aToolbarActions[i].getMultiplicityTo();
			if (iMultiplicityTo > 1 || !iMultiplicityTo) {
				sSelectionMode = 'MultiSelect';
				break;
			} else if (iMultiplicityTo === 1) {
				sSelectionMode = 'SingleSelectLeft';
			}
		}

		this.oInnerTable.setMode(sSelectionMode);
	};


	/*
	 this method checks the multiplicity of the actions and sets the selection mode accordingly
	 only sap.fe.controls.Action instances in the tables headerbar are considered
	 */

	ResponsiveTableController.prototype.enableDisableActions = function () {
		var aToolbarActions = this.getToolbarActions(this.oInnerTable.getHeaderToolbar().getContent());
		var iSelected = this.oInnerTable.getSelectedContexts().length;
		this.enableDisableActionsUtil(iSelected, aToolbarActions);
	};

	ResponsiveTableController.prototype.bindTableCount = function () {
		var oTitle = this.oInnerTable.getHeaderToolbar().getContent()[0];
		this.bindTableCountUtil(oTitle);
	};


	ResponsiveTableController.prototype.handleDataReceived = function (oEvent) {
		var oError = oEvent.getParameter("error");

		if (oError) {
			// fire the showError event to show a message box via controllerImplementation
			this.oInnerTable.setNoDataText(Library.getText("table.TECHINCAL_ERROR"));
			this.oTable.fireShowError(oEvent);
		} else {
			this.oInnerTable.setNoDataText(Library.getText("table.NO_DATA_TEXT"));
		}
		this.oInnerTable.setBusy(false);
	};

	ResponsiveTableController.prototype.getListBinding = function () {
		return this.oInnerTable.getBinding("items");

	};

	ResponsiveTableController.prototype.getListBindingInfo = function () {
		return this.oInnerTable.getBindingInfo("items");
	};

	return ResponsiveTableController;

});
