/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

/**
 * Export progress dialog
 * @private
 */
sap.ui.define([ 'sap/m/Dialog', 'sap/m/DialogType', 'sap/m/Button', 'sap/m/ProgressIndicator', 'sap/m/Text', 'sap/m/MessageBox' ],
		function(Dialog, DialogType, Button, ProgressIndicator, Text, MessageBox) {
	'use strict';

	var oRb = sap.ui.getCore().getLibraryResourceBundle("sap.ui.export");
	
	var progressDialog;
	
	function createProgressDialog() {
		
		var dialog;

		var cancelButton = new Button({
			text : oRb.getText("CANCEL_BUTTON"),
			press : function() {
				if (dialog && dialog.oncancel) {
					dialog.oncancel();
					dialog.finish();
				}
			}
		});

		var progressIndicator = new sap.m.ProgressIndicator({
			showValue : false,
			height : "0.75rem"
		});
		progressIndicator.addStyleClass("sapUiMediumMarginTop");


		dialog = new Dialog({
			title : oRb.getText("PROGRESS_TITLE"),
			type : DialogType.Message,
			contentWidth : "500px",
			content : [ 
				new Text({text : oRb.getText("PROGRESS_FETCHING_MSG")}),
				progressIndicator
			],
			endButton : cancelButton
		});

		dialog.updateStatus = function(nValue) {
			progressIndicator.setPercentValue(nValue);
		};

		dialog.finish = function() {
			progressDialog.close();
			progressIndicator.setPercentValue(0);
		};

		return dialog;
	}
	
	function getProgressDialogInstance() {
		progressDialog = progressDialog || createProgressDialog();
		return progressDialog;
	}

	function showWarningDialog(mParams) {
		return new Promise(function(fnResolve, fnReject) {
			var warningText = oRb.getText("SIZE_WARNING_MSG", [mParams.rows, mParams.columns]);
			var bContinue = false;
			var warningDialog = new Dialog({
				title: oRb.getText('PROGRESS_TITLE'),
				type: DialogType.Message,
				state: sap.ui.core.ValueState.Warning,
				content: new Text({
					text: warningText
				}),
				beginButton: new Button({
					text: oRb.getText("CANCEL_BUTTON"),
					press: function () {
						warningDialog.close();
					}
				}),
				endButton: new Button({
					text: oRb.getText("EXPORT_BUTTON"),
					press: function () {
						bContinue = true;
						warningDialog.close();
					}
				}),
				afterClose: function() {
					warningDialog.destroy();
					bContinue ? fnResolve() : fnReject();
				}
			});
			warningDialog.open();
		});
	}

	function showErrorMessage(sMessage) {
		MessageBox.error(oRb.getText("PROGRESS_ERROR_MSG") + "\n" + sMessage, {
			title : oRb.getText("PROGRESS_ERROR_TITLE")
		});
	}

	return {
		getProgressDialog : getProgressDialogInstance,
		showErrorMessage: showErrorMessage,
		showWarningDialog: showWarningDialog
	};

}, /* bExport= */true);