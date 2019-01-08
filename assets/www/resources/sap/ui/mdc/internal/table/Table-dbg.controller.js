/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

/**
 *
 *
 * @private
 * @name sap.ui.mdc.internal.table.Table.controller
 * @author SAP SE
 * @version 1.52.4
 * @since ??
 * @param {}
 * @returns {sap.ui.mdc.internal.table.Table.controller} new Table controller
 */
sap.ui.define([
	"../../library",
	"sap/ui/base/Object",
	"sap/ui/mdc/experimental/Action",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Sorter"
], function (Library, BaseObject, Action, JSONModel, Sorter) {
	"use strict";

	/**
	 * @private
	 * @constructor
	 * @param {}
	 */

	var TableController = BaseObject.extend("sap.ui.mdc.internal.table.Table.controller", {
		constructor: function (oTable) {
			BaseObject.apply(this, arguments);
			this.oTable = oTable;
			this.oInnerTable = oTable.getInnerTable();
		}
	});

	/**
	 *
	 *
	 * @param {}
	 * @private
	 */

	TableController.prototype.handleDataRequested = function (oEvent) {
		// this should not be needed at all -> raised this info to the OData model team
		this.oInnerTable.setBusy(true);
	};


	TableController.prototype.handleCallAction = function (oEvent) {
		var mActionHandlerParameters = oEvent.getParameters();
		var oAction = oEvent.getSource();
		mActionHandlerParameters.mode = oAction.getMode();

		if (mActionHandlerParameters.mode === 'Inline') {
			mActionHandlerParameters.contexts = [oAction.getBindingContext()];
		} else {
			mActionHandlerParameters.contexts = this.oTable.getSelectedContexts();
		}

		// set application to busy, do not execute action if application is busy
		mActionHandlerParameters.setBusy = true;
		mActionHandlerParameters.checkBusy = true;
		this.oTable.fireCallAction(mActionHandlerParameters);
	};

	//This function is to get the toolbar action from given toolbar content
	TableController.prototype.getToolbarActions = function (aToolbarContent) {
		// there might be a better solution than looping through all controls of the header toolbar
		var aToolbarActions = [];

		for (var i = 0; i < aToolbarContent.length; i++) {
			if (aToolbarContent[i] instanceof Action) {
				aToolbarActions.push(aToolbarContent[i]);
			}
		}

		return aToolbarActions;
	};


	//This is a Util function to set the button in Table toolbar enabled/disabled
	TableController.prototype.enableDisableActionsUtil = function (iSelected, aToolbarActions) {
		var iFrom, iTo, oAction;

		if (iSelected != null) {
			for (var i = 0; i < aToolbarActions.length; i++) {
				oAction = aToolbarActions[i];
				iFrom = oAction.getMultiplicityFrom();
				iTo = oAction.getMultiplicityTo();

				if ((!iFrom || (iSelected >= iFrom) && (!iTo || iSelected <= iTo))) {
					oAction.setEnabled(true);
				} else {
					oAction.setEnabled(false);
				}
			}
		}

	};

	//This is a Util Function used to set binding count in title.
	TableController.prototype.bindTableCountUtil = function (oTitle) {
		if (oTitle != null) {
			oTitle.setModel(this.oInnerTable.getModel(), "headerContext");
		}

		var oBinding = this.oTable.getListBinding();
		if (oBinding) {
			oTitle.setBindingContext(oBinding.getHeaderContext(), "headerContext");
		}
	};

	TableController.prototype.createAndOpenViewSettingsDialog = function (oViewSettingsPropertyObject, iSelectedColumnItems, iColumnItems, oDialogPropertiesModel) {
		if (this.oViewSettingsPropertyModel == null && this.oViewSettingsPropertyModel == undefined) {
			var sSelectAllText = Library.getText("table.VIEWSETTINGS_COLUMN_SELECTALL", [iSelectedColumnItems, iColumnItems]);
			oViewSettingsPropertyObject["selectAllText"] = sSelectAllText;
			oViewSettingsPropertyObject["sortDesecending"] = false;
			oViewSettingsPropertyObject["groupDescending"] = false;
			this.oViewSettingsPropertyModel = new JSONModel(oViewSettingsPropertyObject);
		}

		var oViewSettings = new sap.ui.view("viewSettingsXMLView", {
			viewName: "sap.ui.mdc.internal.table.viewsettings.ViewSettings",
			type: "XML",
			async: true,
			preprocessors: {
				xml: {
					bindingContexts: {
						propertiesModel: this.oViewSettingsPropertyModel.createBindingContext("/"),
						dialogProperties: oDialogPropertiesModel.createBindingContext("/")
					},
					models: {
						propertiesModel: this.oViewSettingsPropertyModel,
						dialogProperties: oDialogPropertiesModel
					}
				}
			}
		});
		oViewSettings.setModel(this.oViewSettingsPropertyModel);
		this.oTable.addDependent(oViewSettings);
		oViewSettings.loaded().then(function () {
			var sActionName = (oDialogPropertiesModel.getData().InitialVisiblePanel === "columns") ? "viewSettingsXMLView--columns" : oDialogPropertiesModel.getData().InitialVisiblePanel;
			var oController = oViewSettings.getController();
			oController.oTableController = this;
			oViewSettings.byId("viewSettingsDialog").open(sActionName);
		}.bind(this));
	};


	TableController.prototype.createAndOpenP13nSettingsDialog = function (oP13nSettingsPropertyObject, oDialogPropertiesModel) {
		if (this.oP13nSettingsPropertyModel == null && this.oP13nSettingsPropertyModel == undefined) {
			oP13nSettingsPropertyObject["p13nSortItems"] = [];
			oP13nSettingsPropertyObject["p13nGroupItems"] = [];
			this.oP13nSettingsPropertyModel = new JSONModel(oP13nSettingsPropertyObject);
		}
		var oP13nSettings = new sap.ui.view("p13nSettingsXMLView", {
			viewName: "sap.ui.mdc.internal.table.p13nsettings.P13nSettings",
			type: "XML",
			async: true,
			preprocessors: {
				xml: {
					bindingContexts: {
						propertiesModel: this.oP13nSettingsPropertyModel.createBindingContext("/"),
						dialogProperties: oDialogPropertiesModel.createBindingContext("/")
					},
					models: {
						propertiesModel: this.oP13nSettingsPropertyModel,
						dialogProperties: oDialogPropertiesModel
					}
				}
			}
		});
		oP13nSettings.setModel(this.oP13nSettingsPropertyModel);
		this.oTable.addDependent(oP13nSettings);

		oP13nSettings.loaded().then(function () {
			var oController = oP13nSettings.getController();
			oController.oTableController = this;
			oP13nSettings.byId("p13nDialog").open();
		}.bind(this));
	};

	//Event handler for sort, group, column buttons in table toolbar
	TableController.prototype.onStandardActionClick = function (oEvent) {
		var sActionName = oEvent.getSource().getText(),
			oInnerTableMetaModel = this.oInnerTable.getModel().getMetaModel(),
			oEntityType = oInnerTableMetaModel.getObject("/" + this.oTable.getEntitySet() + "/"),
			isMultiTab = false,
			aTableColumns = this.oInnerTable.getColumns(),
			iColumnCount = aTableColumns.length,
			aColumnId = [],
			iSelectedPropCount = 0,
			aSortItems = [],
			aGroupItems = [],
			aColumnItems = [],
			sSettingsDialogType = this.oTable.getSettingsDialogType();
			//aEntityLineItems = this.oInnerTable.getModel().getMetaModel().getMetaContext(this.oTable.getContext()).getObject();

		for (var index = 0; index < iColumnCount; index++) {
			var oColumn = aTableColumns[index];
			var aColumnsIds = oColumn.getId().split("::");
			aColumnId.push(aColumnsIds[aColumnsIds.length - 1]);
		}

		for (var property in oEntityType) {
			if (typeof (oEntityType[property]) == "object" && oEntityType[property].$kind && oEntityType[property].$kind === "Property") {
				var _propertyName = oInnerTableMetaModel.getObject("/" + this.oTable.getEntitySet() + "/" + property + "@com.sap.vocabularies.Common.v1.Label");
				iSelectedPropCount = (aColumnId.indexOf(property) > -1 ) ? iSelectedPropCount + 1 : iSelectedPropCount;
				var oItem = {
					"name": (_propertyName != null && _propertyName != undefined) ? _propertyName : property,
					"columnKey": property,
					"selected": false
				};
				//Using JSON Stringify to avoid mutation of original object after changing one of the property in copied object.
				aSortItems.push(JSON.parse(JSON.stringify(oItem)));
				aGroupItems.push(JSON.parse(JSON.stringify(oItem)));
				var columnItem = JSON.parse(JSON.stringify(oItem));
				columnItem.selected = !!(aColumnId.indexOf(property) > -1);
				aColumnItems.push(columnItem);
			}
		}

		/*
		TODO: Swati, GK; Check this while implementing Columns tab in settings dialog.
		for (var item in aEntityLineItems) {
			if (typeof (aEntityLineItems[item]) == "object" && aEntityLineItems[item].$Type
				&& aEntityLineItems[item].$Type == "com.sap.vocabularies.UI.v1.DataFieldForAction") {
				iSelectedPropCount = (aColumnId.indexOf(aEntityLineItems[item].Action) > -1) ? iSelectedPropCount + 1 : iSelectedPropCount;
				var oAdditionalItem = {
					"name": (aEntityLineItems[item].Label) ? aEntityLineItems[item].Label : aEntityLineItems[item].Action,
					"columnKey": aEntityLineItems[item].Action,
					"selected": false
				};
				oAdditionalItem.selected = !!(aColumnId.indexOf(aEntityLineItems[item].Action) > -1);
				aColumnItems.push(oAdditionalItem);
			}
		}*/

		var oPropertyObject = {
			"sortPanelItems": aSortItems,
			"groupPanelItems": aGroupItems,
			"columnPanelItems": aColumnItems.sort(function (x, y) {
				if (x.selected === y.selected) {
					return 0;
				} else if (x.selected) {
					return -1;
				} else {
					return 1;
				}
			})
		};

		var oDialogPropertiesModel = new JSONModel({
			"InitialVisiblePanel": sActionName,
			"showSortPanel": !!(isMultiTab || sActionName === "sort"),
			"showGroupPanel": !!((isMultiTab || sActionName === "group") && (this.oInnerTable.getMetadata().getName() === "sap.m.Table")),
			//"showFilterPanel": !!(isMultiTab || sActionName === "filter"),
			"showColumnPanel": !!(isMultiTab || sActionName === "column")
		});

		if (sSettingsDialogType === "P13nDialog") {
			this.createAndOpenP13nSettingsDialog(oPropertyObject, oDialogPropertiesModel);
		} else {
			this.createAndOpenViewSettingsDialog(oPropertyObject, iSelectedPropCount, aColumnItems.length, oDialogPropertiesModel);
		}
	};

	TableController.prototype.applyGroupAndSort = function (aSorters) {
		if (aSorters.length > 0) {
			var oBinding = this.getListBinding();
			oBinding.sort(aSorters);
		}
	};

	return TableController;

});
