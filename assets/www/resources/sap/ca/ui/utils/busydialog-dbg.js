/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("sap.ca.ui.utils.busydialog");

jQuery.sap.require("sap.ca.ui.images.images");

sap.ca.ui.utils.BUSYDIALOG_TIMEOUT = 1500;

/**
 * @class Provides methods to show/remove the waiting/blocking screen in the Fiori style.
 *
 * <code>sap.ca.ui.utils.busydialog</code> is a static class, the statement <code>jQuery.sap.require("sap.ca.ui.utils.busydialog")</code>
 * needs to be called before the function can be used. Example:
 * <pre>
 *    jQuery.sap.require("sap.ca.ui.utils.busydialog");
 *
 *    // request the BusyDialog to show the waiting/blocking screen
 *    sap.ca.ui.utils.busydialog.requireBusyDialog({
*        text:"Loading..." //text is optional
*    });
 *
 *    // release the BusyDialog to remove the waiting/blocking screen
 *    sap.ca.ui.utils.busydialog.releaseBusyDialog();
 * </pre>
 *
 * <b>Note</b>
 * <ul><li>this BusyDialog will be shown with 1.5 seconds delay at the moment;</li>
 * <li>in a possible embedded function calls, you can require this BusyDialog more than once,
 * but you need to take care to release the BusyDialog correspondingly in pair. (The text will be overwritten.)</li></ul>
 * @static
 * @public
 *
 * @deprecated This control is deprecated since 1.26 as per central UX requirements. Please use sap.m.BusyDialog instead.
 */
sap.ca.ui.utils.busydialog = (function () {
	var BUSIDIALOG_ID = "CA_BusyDialog";
	var _oBusyDialog = null;
	var _bIsOpen = false;
	var _iRequiredCount = 0;
	var _sTimerId = null;

	var _fnOpenBusyDialog = function (oSettings) {
		if (!_oBusyDialog) {
			_oBusyDialog = new sap.m.BusyDialog(BUSIDIALOG_ID);
		}
		if (oSettings && oSettings.text && typeof oSettings.text === "string") {
			_oBusyDialog.setText(oSettings.text);
		}
		if (!_bIsOpen) {
			_oBusyDialog.open();
			_bIsOpen = true;
		}
	};

	var _removePreviousdCall = function () {
		if (_sTimerId) {
			jQuery.sap.clearDelayedCall(_sTimerId);
			_sTimerId = null;
		}
	};

	var _fnUpdateDisplay = function (oSettings) {
		if (_iRequiredCount > 0) {
			_removePreviousdCall();
			_sTimerId = jQuery.sap.delayedCall(sap.ca.ui.utils.BUSYDIALOG_TIMEOUT, undefined, _fnOpenBusyDialog, [oSettings]);
		} else {
			_removePreviousdCall();
			if (_oBusyDialog) {
				_oBusyDialog.close();
				_bIsOpen = false;
				_oBusyDialog.setText("");
			}
		}
	};

	return {
		/**
		 * Shows the waiting/blocking screen
		 * @param {object} [oSettings] settings for the busy dialog:
		 *        <p>text : {string} (optional) loading text</p>
		 * @public
		 * @name sap.ca.ui.utils.busydialog#requireBusyDialog
		 * @function
		 */
		requireBusyDialog: function (oSettings) {
			_iRequiredCount++;
			_fnUpdateDisplay(oSettings);
		},

		/**
		 * Removes the waiting/blocking screen, and is used in pair with the method "requireBusyDialog"
		 * @public
		 * @name sap.ca.ui.utils.busydialog#releaseBusyDialog
		 * @function
		 */
		releaseBusyDialog: function () {
			_iRequiredCount--;
			if (_iRequiredCount < 0) {
				jQuery.sap.log.error("busy dialog released more often than required");
				_iRequiredCount = 0;
			}
			_fnUpdateDisplay();
		},

		/**
		 * Destroys the waiting/blocking screen (this method is only recommended if the App developer
		 * or the "Unified Shell" has a clean-up strategy and want to release the memory on purpose)
		 * @public
		 * @name sap.ca.ui.utils.busydialog#destroyBusyDialog
		 * @function
		 */
		destroyBusyDialog: function () {
			if (_oBusyDialog) {
				_oBusyDialog.destroy();
				_oBusyDialog = null;
			}
		}
	};

}());
