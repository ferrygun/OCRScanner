/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

// Provides control sap.ndc.BarcodeScannerButton.
sap.ui.define(['jquery.sap.global', './BarcodeScanner', './library', 'sap/ui/core/Control'],
	function(jQuery, BarcodeScanner, library, Control) {
	"use strict";


	
	/**
	 * Constructor for a new BarcodeScannerButton.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given 
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * A button control (displaying a bar code icon) to start the bar code scanning process. If the native scanning feature is
	 * not available, the button is either hidden or it provides a fallback by opening a dialog with an input field where the bar code can
	 * be entered manually.
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 *
	 * @constructor
	 * @public
	 * @alias sap.ndc.BarcodeScannerButton
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var BarcodeScannerButton = Control.extend("sap.ndc.BarcodeScannerButton", /** @lends sap.ndc.BarcodeScannerButton.prototype */ { metadata : {
	
		library : "sap.ndc",
		properties : {
	
			/**
			 * If set to true, the button remains visible if the scanner is not available and triggers a dialog to enter bar code.
			 */
			provideFallback : {type : "boolean", defaultValue : true},
	
			/**
			 * The invisible bar code scanner button is not rendered regardless of the availability of the native scan feature.
			 */
			visible : {type : "boolean", defaultValue : true},
			
			/**
			 * Defines the width of the scanner button.
			 */
			width : {type: "sap.ui.core.CSSSize", defaultValue : null}
		},
		aggregations : {
	
			/**
			 * Internal aggregation to hold the inner Button.
			 */
			_btn : {type : "sap.m.Button", multiple : false, visibility : "hidden"}
		},
		events : {
	
			/**
			 * Event is fired when the scanning is finished or cancelled
			 */
			scanSuccess : {
				parameters : {
	
					/**
					 * The the text representation of the bar code data.
					 */
					text : {type : "string"}, 
	
					/**
					 * The type of the bar code detected.
					 */
					format : {type : "string"}, 
	
					/**
					 * Indicates whether or not the user cancelled the scan.
					 */
					cancelled : {type : "boolean"}
				}
			}, 
	
			/**
			 * Event is fired when the native scanning process is failed.
			 */
			scanFail : {}, 
	
			/**
			 * Event is fired when the text in the dialog's input field is changed.
			 */
			inputLiveUpdate : {
				parameters : {
	
					/**
					 * The new value of the input field.
					 */
					newValue : {type : "string"}
				}
			}
		}
	}});
	
	
	BarcodeScannerButton.prototype.init = function () {
		var oBarcodeStatus;
		
		this.setAggregation("_btn", new sap.m.Button({
			icon: "sap-icon://bar-code",
			press: jQuery.proxy(this._onBtnPressed, this),
			width: "100%"
		}));
		
		oBarcodeStatus = BarcodeScanner.getStatusModel();
		this.setModel(oBarcodeStatus, "status");
	};
	
	BarcodeScannerButton.prototype._onBtnPressed = function (oEvent) {
		BarcodeScanner.scan(
			jQuery.proxy(this._onScanSuccess, this),
			jQuery.proxy(this._onScanFail, this),
			jQuery.proxy(this._onInputLiveUpdate, this)
		);
	};
	
	BarcodeScannerButton.prototype._onScanSuccess = function (mArguments) {
		this.fireScanSuccess(mArguments);
	};
	
	BarcodeScannerButton.prototype._onScanFail = function (mArguments) {
		this.fireScanFail(mArguments);
	};
	
	BarcodeScannerButton.prototype._onInputLiveUpdate = function (mArguments) {
		this.fireInputLiveUpdate(mArguments);
	};
	
	BarcodeScannerButton.prototype.setProvideFallback = function (bFallback) {
		var bValue = this.getProvideFallback();
		var oBtn;
		
		bFallback = !!bFallback;
		
		if (bValue !== bFallback) {
			this.setProperty("provideFallback", bFallback);
			oBtn = this.getAggregation("_btn");
			if (bFallback) {
				oBtn.unbindProperty("visible");
				oBtn.setVisible(true);
			} else {
				oBtn.bindProperty("visible", "status>/available");
			}
		}
	
		return this;
	};

	return BarcodeScannerButton;

}, /* bExport= */ true);
