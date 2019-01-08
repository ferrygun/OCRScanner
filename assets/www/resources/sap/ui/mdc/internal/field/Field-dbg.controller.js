/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	"jquery.sap.global",
	"sap/ui/base/Object",
	"sap/ui/mdc/experimental/Action"
], function (jQuery, BaseObject, Action) {
	"use strict";

	var FieldController = BaseObject.extend("sap.ui.mdc.internal.field.Field.controller", {
		constructor: function (oField, oTable) {
			BaseObject.apply(this, arguments);
			this.oField = oField;
			this.oTable = oTable;
		}
	});


	/*
	      Please note: those methods below are called from the table control as well - currently in this case
	      this.oField is empty, only the oEvent can be used as there is no real instance of the field
	      there is a connection to the table (this.oTable) but this is also not available always so be prepared for both
	 */

	FieldController.prototype.onContactDetails = function (oEvent) {
		var oPopover;
		if (oEvent.getSource().data("Location") === "Header") {
			oPopover = oEvent.getSource().getParent().getAggregation("items")[0];
		} else if (oEvent.getSource().data("Location") === "Section") {		//ContactPopUpover in Section
			oPopover = oEvent.getSource().getParent().getAggregation("items")[0];
		} else if (oEvent.getSource().data("Location") === "SmartTable") {	//ContactPopUpOver in SmartTable
			oPopover = oEvent.getSource().getParent().getAggregation("items")[0];
		} else {
			oPopover = oEvent.getSource().getParent().getParent().getParent().getParent().getParent().getAggregation(
				"items")[1];
		}
		oPopover.setBindingContext(oEvent.getSource().getBindingContext());
		oPopover.openBy(oEvent.getSource());
	};

	FieldController.prototype.onDraftLinkPressed = function (oEvent) {
		var oButton = oEvent.getSource();
		var oBindingContext = oButton.getBindingContext();
		var oParent;
		if (!this._oDraftInfoPopover) {
			oParent = this.oField || this.oTable;
			this._oDraftInfoPopover = sap.ui.xmlfragment("sap.ui.mdc.internal.common.DraftInfoPopover", this);
			oParent.addDependent(this._oDraftInfoPopover);
		}
		this._oDraftInfoPopover.setBindingContext(oBindingContext);
		this._oDraftInfoPopover.openBy(oButton);
	};

	FieldController.prototype.closeDraftAdminPopover = function (oEvent) {
		this._oDraftInfoPopover.close();
	};

	FieldController.prototype.onDataFieldWithIntentBasedNavigationPressed = function (oEvent) {
		var oLink = oEvent.getSource();
		var sSemanticObject = oLink.data('SemanticObject');
		var sAction = oLink.data('Action');
		var oData = oLink.getParent().getBindingContext().getObject();
		var oParameters = {};
		for (var sProperty in oData) {
			if (sProperty && sProperty[0] !== "@" && typeof oData[sProperty] === 'string') {
				oParameters[sProperty] = oData[sProperty];
			}
		}
		var oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
		if (oCrossAppNavigator) {
			oCrossAppNavigator.toExternal({
				target: {
					semanticObject: sSemanticObject,
					action: sAction
				},
				params: oParameters
			});
		}
	};


	return FieldController;

});





