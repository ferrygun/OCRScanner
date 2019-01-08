/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	'jquery.sap.global',
	'sap/ui/core/XMLComposite'
], function(jQuery, XMLComposite) {
	"use strict";

	// TODO: the metadata context shall not be needed here???
	var ValueHelpDialog = XMLComposite.extend("sap.ui.mdc.base.ValueHelpDialog", {
		metadata: {
			properties: {
				title: {
					type: "string",
					invalidate: false
				}
			},
			aggregations: {
				// We do not need this!!!! it is only used in  the mergedConditions function via the Ok button.
				conditionModel: { type: "sap.ui.mdc.base.ConditionModel", multiple: false }
			},
			events: {},
			publicMethods: []
		},

		alias: "this",
		fragment: "sap.ui.mdc.base.ValueHelpDialog"
	});


	ValueHelpDialog.prototype.init = function() {
		if (this.get_content() instanceof sap.m.Dialog) {
			var oDialog = this.get_content();
			oDialog.setBusyIndicatorDelay(0);
			oDialog.setBusy(true);
			//ValueHelp control destroyed(the XML composite control)
			oDialog.attachAfterClose(function(oEvent) {
				this.destroy();
			}.bind(this));
		}
	};

	ValueHelpDialog.prototype.open = function() {
		return this.get_content().open();
	};

	ValueHelpDialog.prototype.close = function() {
		this.get_content().close();
	};

	ValueHelpDialog.prototype.addContent = function(oContent) {
		var oDialog = this.get_content();
		oDialog.addContent(oContent);
		return oDialog.setBusy(false);
	};

	ValueHelpDialog.prototype.onOk = function() {
		var oDialog = this.get_content();
		var sLocalFieldPath = oDialog.getContent()[0].getController().sFieldPath;
		var oLocalCMModel = oDialog.getContent()[0].getModel("cm");
		var oConditionModel = this.getConditionModel();
		oConditionModel.merge(sLocalFieldPath, oLocalCMModel);
		oDialog.close();
	};

	ValueHelpDialog.prototype.onCancel = function() {
		this.close();
	};

	ValueHelpDialog.prototype.onReset = function() {
		var oDialog = this.get_content();
		var sLocalFieldPath = oDialog.getContent()[0].getController().sFieldPath;
		var oConditionModel = oDialog.getContent()[0].getModel("cm");
		var oTableConditionModel = oDialog.getContent()[0].getModel("vltcm");
		var oFilterLayoutFlag = oDialog.getContent()[0].getModel("FilterLayoutFlag");
		var oFieldPaths = oTableConditionModel.getData().sFieldPath;

		//Clearing Conditions in main Value Help condition model
		oConditionModel.removeAllConditions(sLocalFieldPath);

		//Clearing all conditions from Value help table condition model
		if (oFieldPaths) {
			for (var sTableFieldPath in oFieldPaths) {
				oTableConditionModel.removeAllConditions(sTableFieldPath);
			}
		}

		oFilterLayoutFlag.setProperty("/sSearchFieldValue", "");
		oFilterLayoutFlag.setProperty("/visible", "HideMode");
		oFilterLayoutFlag.setProperty("/listView", false);
		oFilterLayoutFlag.setProperty("/tableView", true);
		oFilterLayoutFlag.setProperty("/sSelectedRowCount", 0);

		oDialog.getContent()[0].getController().updateTableSelections();
		//		oDialog.getContent()[0].getController().updateDefineConditions();
	};

	return ValueHelpDialog;

}, /* bExport= */ true);