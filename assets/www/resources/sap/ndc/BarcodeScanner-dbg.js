/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define(['jquery.sap.global'],
	function(jQuery) {
	"use strict";


	var BCScanner = (function () {
		
		/*global cordova*/
		var DIALOG_FRAGMENT_MODULE_NAME = "sap.ndc.BarcodeScanDialog";
		document.addEventListener("settingsDone", init);
		document.addEventListener("SettingCompleted", init);
		document.addEventListener("mockSettingsDone", init);
		
		/**
		 * @class
		 * TODO: description
		 * 
		 * As <code>BarcodeScanner</code> is a static class, a <code>jQuery.sap.require("sap.ndc.BarcodeScanner");</code>
		 * statement must be explicitly executed before the class can be used. Example:	 *
		 * <pre>
		 * jQuery.sap.require("sap.ndc.BarcodeScanner");
		 * sap.ndc.BarcodeScanner.scan(
		 *     function (oResult) { / * process scan result * / },
		 *     function (oError) { / * handle scan error * / },
		 *     function (oResult) { / * handle input dialog change * / }
		 * );
		 * </pre>
		 *
		 * @author SAP SE
		 * @since 1.28.0
		 *
		 * @namespace
		 * @public
		 * @alias sap.ndc.BarcodeScanner
		 */
		var BarcodeScanner = {},
	
		/* =========================================================== */
		/* Internal methods and properties                             */
		/* =========================================================== */
	
			oScannerAPI,
			oStatusModel = new sap.ui.model.json.JSONModel({
				available: false
			}),
			oScanDialog = null,
			oScanDialogController = {},
			bReady = true,			// No scanning is in progress
			// TODO: following var is not used, right now it is useless // bInitialized = false,	// Flag indicating whether the feature vector (sap.Settings) is available
									// sap.Settings might be loaded later, so it is checked again the next scan
			oResourceModel = new sap.ui.model.resource.ResourceModel({
				bundleName: "sap.ndc.messagebundle"
			});
		
		function getFeatureAPI() {
			try {
				oScannerAPI = cordova.plugins.barcodeScanner;
				if (oScannerAPI) {
					jQuery.sap.log.debug("Cordova BarcodeScanner plugin is available!");
				} else {
					oStatusModel.setProperty("/available", false);
					jQuery.sap.log.error("BarcodeScanner: cordova.plugins.barcodeScanner is not available");
				}
			} catch (e) {
				jQuery.sap.log.info("BarcodeScanner: cordova.plugins is not available");
				return;
			}
		}
		
		// Check:
		//	* Feature vector (sap.Settings.isFeatureEnabled) is available
		//  * Barcode scanner is enabled by the Feature Vector
		//  * Barcode scanner Cordova plug-in (cordova.plugins.barcodeScanner) is available
		function init() {
			oScannerAPI = null;
			//true by default and only false if feature is forbidden from feature vector
			oStatusModel.setProperty("/available", true);
			//sap.Settings is provided by Kapsel SettingsExchange plugin.
			if (sap.Settings === undefined) {
				//native device capabilities should be by default enabled if there is no feature vector 
				//available to restrict the capability.
				jQuery.sap.log.debug("No sap.Settings. No feature vector available.");
				//still try to check if only barcode scanner plugin is present without the settings plugin.
				getFeatureAPI();
			} else if (sap.Settings && typeof sap.Settings.isFeatureEnabled === "function") {
				// TODO: following var is not used, right now it is useless // bInitialized = true;
				sap.Settings.isFeatureEnabled("cordova.plugins.barcodeScanner",
					// Feature check success
					function (bEnabled) {
						if (bEnabled) {
							getFeatureAPI();
						} else {
							oStatusModel.setProperty("/available", false);
							jQuery.sap.log.warning("BarcodeScanner: Feature disabled");
						}
					},
					// Feature check error
					function () {
						jQuery.sap.log.warning("BarcodeScanner: Feature check failed");
					}
				);
			} else {
				jQuery.sap.log.warning("BarcodeScanner: Feature vector (sap.Settings.isFeatureEnabled) is not available");
			}
		}
	
		function getScanDialog(fnSuccess, fnLiveUpdate) {
			var oDialogModel;
			
			oScanDialogController.onSuccess = fnSuccess;
			oScanDialogController.onLiveUpdate = fnLiveUpdate;
			
			if (!oScanDialog) {
				oDialogModel = new sap.ui.model.json.JSONModel();
				
				oScanDialog = sap.ui.xmlfragment(DIALOG_FRAGMENT_MODULE_NAME, {
					onOK: function (oEvent) {
						BarcodeScanner.closeScanDialog();
						if (typeof oScanDialogController.onSuccess === "function") {
							oScanDialogController.onSuccess({
								text: oDialogModel.getProperty("/barcode"),
								cancelled: false
							});
						}
					},
					onCancel: function (oEvent) {
						BarcodeScanner.closeScanDialog();
						if (typeof oScanDialogController.onSuccess === "function") {
							oScanDialogController.onSuccess({
								text: oDialogModel.getProperty("/barcode"),
								cancelled: true
							});
						}
					},
					onLiveChange: function (oEvent) {
						if (typeof oScanDialogController.onLiveUpdate === "function") {
							oScanDialogController.onLiveUpdate({
								newValue: oEvent.getParameter("newValue")
							});
						}
					},
					onAfterOpen: function (oEvent) {
						oEvent.getSource().getContent()[0].focus();
					}
				});
				oScanDialog.setModel(oDialogModel);
				oScanDialog.setModel(oResourceModel, "i18n");
			}
			return oScanDialog;
		}
	
		/* =========================================================== */
		/* API methods                                                 */
		/* =========================================================== */
	
		/**
		 * Starts the bar code scanning process either showing the live input from the camera or displaying a dialog
		 * to enter the value directly if the bar code scanning feature is not available.
		 * 
		 * <pre>
		 * sap.ndc.BarcodeScanner.scan(fnSuccess, fnFail, fnLiveUpdate)
		 * </pre>
		 * 
		 * The bar code scanning is done asynchronously. When it is triggered, this function returns without waiting for
		 * the scanning process to finish. The applications have to provide callback functions to react to the events of
		 * a successful scanning, an error during scanning, and the live input on the dialog.
		 * 
		 * <code>fnSuccess</code> is passed an object with text, format and cancelled properties. Text is the text representation
		 * of the bar code data, format is the type of the bar code detected, and cancelled is whether or not the user cancelled
		 * the scan. <code>fnError</code> is given the error, <code>fnLiveUpdate</code> is passed the new value entered in the
		 * dialog's input field. An example:
		 * 
		 * <pre>
		 * sap.ndc.BarcodeScanner.scan(
		 *    function (mResult) {
		 *       alert("We got a bar code\n" + 
		 *             "Result: " + mResult.text + "\n" +
		 *             "Format: " + mResult.format + "\n" +
		 *             "Cancelled: " + mResult.cancelled);
		 *    },
		 *    function (Error) {
		 *       alert("Scanning failed: " + Error);
		 *    },
		 *    function (mParams) {
		 *       alert("Value entered: " + mParams.newValue);
		 *    }
		 * );
		 * </pre>
		 * 
		 * @param {function} [fnSuccess] Function to be called when the scanning is done or cancelled
		 * @param {function} [fnFail] Function to be called when the scanning is failed
		 * @param {function} [fnLiveUpdate] Function to be called when value of the dialog's input is changed
		 * 
		 * @public
		 * @static
		 */
		BarcodeScanner.scan = function (fnSuccess, fnFail, fnLiveUpdate) {
			var oDialog;
			
			if (!bReady) {
				jQuery.sap.log.error("Barcode scanning is already in progress.");
				return;
			}
			
			bReady = false;
			
			if (oStatusModel.getProperty("/available") == true && oScannerAPI == null){
				//in case we do not have feature vectore we still would like to allow the use
				//of native device capability.
				getFeatureAPI();
			}
			
			if (oScannerAPI) {
				oScannerAPI.scan(
					function (oResult) {
						if (oResult.cancelled === "false" || !oResult.cancelled) {
							oResult.cancelled = false;
							if (typeof fnSuccess === "function") {
								fnSuccess(oResult);
							}
						} else {
							oDialog = getScanDialog(fnSuccess, fnLiveUpdate);
							oDialog.getModel().setProperty("/barcode", "");
							oDialog.getModel().setProperty("/isNoScanner", false);
							oDialog.open();
						}
						bReady = true;
					},
					function (oEvent) {
						jQuery.sap.log.error("Barcode scanning failed.");
						if (typeof fnFail === "function") {
							fnFail(oEvent);
						}
						bReady = true;
					}
				);
			} else {
				oDialog = getScanDialog(fnSuccess, fnLiveUpdate);
				oDialog.getModel().setProperty("/barcode", "");
				oDialog.getModel().setProperty("/isNoScanner", true);
				oDialog.open();
			}
		};
	
		/**
		 * Closes the bar code input dialog. It can be used to close the dialog before the user presses the OK or the Cancel button
		 * (e.g. in the fnLiveUpdate callback function of the {@link sap.ndc.BarcodeScanner.scan} method.)
		 * 
		 * @public
		 * @static
		 */
		BarcodeScanner.closeScanDialog = function () {
			if (oScanDialog) {
				oScanDialog.close();
				bReady = true;
			}
		};
		
		/**
		 * Returns the status model of the BarcodeScanner. It is a JSON model which contains a single boolean property
		 * '<code>available</code>' indicating whether or not the bar code scanner feature is available. It can be used
		 * to bind to the <code>visible</code> property of UI controls which have to be hidden in case the feature is unavailable.
		 * 
		 * @returns {sap.ui.model.json.JSONModel} A JSON model containing the 'available' property
		 * @public
		 * @static
		 */
		BarcodeScanner.getStatusModel = function () {
			return oStatusModel;
		};
		init();	//must be called to enable control if no feature vector is available.
		return BarcodeScanner;
	}());
	

	return BCScanner;

}, /* bExport= */ true);
