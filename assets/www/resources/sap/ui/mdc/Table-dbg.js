/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	"./library",
	'sap/ui/mdc/XMLComposite',
	'sap/ui/mdc/internal/table/gridtable/GridTable.controller',
	'sap/ui/mdc/internal/table/responsivetable/ResponsiveTable.controller',
	'sap/ui/mdc/internal/field/Field.controller',
	"sap/m/ListMode",
	'sap/ui/mdc/Field',
	'sap/ui/model/odata/v4/AnnotationHelper'

], function (Library, XMLComposite, GridTableController, ResponsiveTableController, FieldController, ListMode) {
	"use strict";

	var GridTableName = "sap.ui.table.Table",
		ResponsiveTableName = 'sap.m.Table';

	var Table = XMLComposite.extend("sap.ui.mdc.Table", {
		metadata: {
			designTime: true,
			specialSettings: {
				metadataContexts: {
					defaultValue: "{ model: 'entitySet', path:'',  name: 'entitySet'},{model: 'sap.fe.deviceModel', path: '/', name: 'sap.fe.deviceModel'}"
				}
			},
			properties: {
				tableBindingPath: {
					type: "string",
					invalidate: "template"
				},
				type: {
					type: "string",
					defaultValue: "ResponsiveTable",
					invalidate: "template"
				},
				interactionType: {
					type: "string",
					defaultValue: "Inactive",
					invalidate: "template"
				},
				settingsDialogType: {
					type: "string",
					defaultValue: "ViewSettings"
				},
				enabled: {
					type: "boolean",
					defaultValue: true,
					invalidate: false
				},
				growingThreshold: {
					type: "string",
					defaultValue: "50",
					invalidate: "template"
				},
				growingScrollToLoad: {
					type: "boolean",
					defaultValue: true,
					invalidate: false
				},
				listBindingName: {
					type: "string",
					invalidate: false
				},
				/**
				 * The demandPopin attribute can be set to true or false depending on whether you want to display columns as popins on the responsive
				 * table
				 */
				demandPopin: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				}
			},
			events: {
				"itemPress": {},
				"callAction": {},
				"showError": {}
			},
			publicMethods: []
		},
		fragment: "sap.ui.mdc.internal.table.Table"
	});

	var fnInitialize = function () {
		if (!this.bInitialized) {
			this.oTableController.setSelectionMode();
			this.oTableController.enableDisableActions();
			this.oTableController.bindTableCount();
			this.bInitialized = true;
			this.detachModelContextChange(fnInitialize);
		}
	};


	Table.prototype.init = function () {
		XMLComposite.prototype.init.call(this);

		var oInnerTable = this.getInnerTable(),
			sControlName = oInnerTable.getMetadata().getName();
		if ([GridTableName, ResponsiveTableName].join(" ").indexOf(sControlName) > -1) {
			if (sControlName === GridTableName) {
				this.oTableController = new GridTableController(this);
			} else {
				this.oTableController = new ResponsiveTableController(this);
			}
			this.oFieldController = new FieldController(null, this);
			this.attachModelContextChange(fnInitialize);

		}
	};

	Table.prototype.getInnerTable = function () {
		/*
		 get access to the rendered table - currently it's the second one in the layout. whenever we change the
		 layout we need to adapt this coding. Going upwards to the the view and to access it via ID would take
		 much longer. Any other ideas are welcome
		 */
		return this.get_content();
	};

	Table.prototype.handleDataRequested = function (oEvent) {
		this.oTableController.handleDataRequested(oEvent);
	};

	Table.prototype.handleDataReceived = function (oEvent) {
		this.oTableController.handleDataReceived(oEvent);
	};

	Table.prototype.handleSelectionChange = function (oEvent) {
		this.oTableController.enableDisableActions();
	};

	Table.prototype.handleItemPress = function (oEvent) {
		this.fireItemPress({listItem: oEvent.getParameter("listItem")});
	};

	Table.prototype.handleCallAction = function (oEvent) {
		this.oTableController.handleCallAction(oEvent);
	};

	Table.prototype.getSelectedContexts = function () {
		var oInnerTable = this.getInnerTable();
		var aSelectedContext = [];
		if (oInnerTable.getMetadata().getName() === GridTableName) {
			var aSeletedIndices = oInnerTable.getSelectedIndices();
			for (var index in aSeletedIndices) {
				aSelectedContext.push(oInnerTable.getContextByIndex(index));
			}
		} else {
			aSelectedContext = oInnerTable.getSelectedContexts();
		}

		return aSelectedContext;
	};

	Table.prototype.getEntitySet = function () {
		var sListBindingPath = this.getListBinding().getPath();
		// return the path without the / - this works for absolute bindings only
		// this needs to be enhanced once relative bindings are supported as well
		return sListBindingPath.substr(1);
	};

	Table.prototype.getListBinding = function () {
		return this.oTableController.getListBinding();
	};

	Table.prototype.getListBindingInfo = function () {
		return this.oTableController.getListBindingInfo();
	};

	Table.prototype.setShowOverlay = function () {
		this.getInnerTable().setShowOverlay(true);
	};

	Table.prototype.onStandardActionClick = function (oEvent) {
		this.oTableController.onStandardActionClick(oEvent);
	};

	/* Delegate field events to the field controller */
	Table.prototype.onContactDetails = function (oEvent) {
		this.oFieldController.onContactDetails(oEvent);
	};
	Table.prototype.onDraftLinkPressed = function (oEvent) {
		this.oFieldController.onDraftLinkPressed(oEvent);
	};
	Table.prototype.onDataFieldWithIntentBasedNavigationPressed = function (oEvent) {
		this.oFieldController.onDataFieldWithIntentBasedNavigationPressed(oEvent);
	};
	Table.prototype._updateColumnsPopinFeature = function () {
		if (!this.getDemandPopin()) {
			return;
		}

		var aColumns = this.getInnerTable().getColumns();
		if (!aColumns) {
			return;
		}

		// get only visible columns
		aColumns = aColumns.filter(function (col) {
			return col.getVisible();
		});

		// sort columns according to their order property
		aColumns.sort(function (col1, col2) {
			return col1.getOrder() - col2.getOrder();
		});

		var oColumn, iLength = aColumns.length;

		for (var i = 0; i < iLength; i++) {
			oColumn = aColumns[i];
			if (i < 2) { // ensure always two columns
				oColumn.setDemandPopin(false);
				oColumn.setMinScreenWidth("1px");
			} else {
				oColumn.setDemandPopin(true);
				if (oColumn.getPopinDisplay() != "WithoutHeader") {
					oColumn.setPopinDisplay(sap.m.PopinDisplay.Inline);
				}
				oColumn.setMinScreenWidth((i + 1) * 10 + "rem");
			}
		}
	};

	Table.prototype._deactivateColumnsPopinFeature = function () {

		var aColumns = this._oTable.getColumns();
		if (!aColumns) {
			return;
		}

		var oColumn, iLength = aColumns.length;

		for (var i = 0; i < iLength; i++) {
			oColumn = aColumns[i];
			oColumn.setDemandPopin(false);
			oColumn.setMinScreenWidth("1px");
		}
	};

	Table.prototype.setDemandPopin = function (bDemandPopin) {
		var bOldValue = this.getDemandPopin();
		if (bOldValue === bDemandPopin) {
			return;
		}

		this.setProperty("demandPopin", bDemandPopin, true);

		if (bDemandPopin) {
			this._updateColumnsPopinFeature();
		} else {
			this._deactivateColumnsPopinFeature();
		}
	};

	// STATIC HELPER FOR CONTROL TEMPLATE//
	Table._helper = {
		createAggregationBinding: function (oInterface, oEntitySet, sTableBindingPath, sListBindingName) {
			if (sTableBindingPath) {
				return '{' + sTableBindingPath + '}';
			}

			var sExpand = '',
				oMetaContext = oInterface.getInterface(0),
				oMetaModel = oMetaContext.getModel(),
				sEntitySet = oMetaModel.getObject(oMetaContext.getPath() + "@sapui.name"),
				sNamedBinding = sListBindingName ? "id: '" + sListBindingName + "', " : '';

			if (oMetaContext.getModel().getObject(oMetaContext.getPath() + "@com.sap.vocabularies.Common.v1.DraftRoot")) {
				sExpand = "$expand : 'DraftAdministrativeData'";
			}

			return "{ path : '/" + sEntitySet + "', parameters : { " + sNamedBinding + " $count : true " + (sExpand ? ',' : '') + sExpand + "}, events : {dataRequested : '.handleDataRequested', dataReceived : '.handleDataReceived'} }";
		},

		getSelectionMode : function (oContext, oEntitySet, oWorkingContext) {
			oContext = oContext.getInterface(0);

			//var aLineItems = oContext.getModel().getObject(oWorkingContext['@com.sap.vocabularies.UI.v1.LineItem']) || [];
			var aLineItems = oWorkingContext['@com.sap.vocabularies.UI.v1.LineItem'];
			for (var i = 0; i < aLineItems.length; i++) {
				if (aLineItems[i].$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction" && !aLineItems[i].Inline) {
					return sap.m.ListMode.MultiSelect;
				}
			}

			return ListMode.None;
		},

		formatDraftLockText : function (IsActiveEntity, HasDraftEntity, LockedBy) {
			if (!IsActiveEntity) {

				return sap.ui.getCore().getLibraryResourceBundle("sap.ui.mdc").getText("draft.DRAFT_OBJECT");
			} else if (HasDraftEntity) {
				if (LockedBy) {
					return Library.getText("draft.LOCKED_OBJECT");
				} else {
					return Library.getText("draft.UNSAVED_CHANGES");
				}
			} else {
				return ""; // not visible
			}
		}

	};

	Table._helper.createAggregationBinding.requiresIContext = true;
	Table._helper.getSelectionMode.requiresIContext = true;

	return Table;

}, /* bExport= */true);
