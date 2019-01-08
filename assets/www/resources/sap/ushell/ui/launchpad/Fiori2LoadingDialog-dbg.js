/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

// Provides control sap.ushell.ui.launchpad.Fiori2LoadingDialog.
sap.ui.define(['sap/ui/core/Control','sap/ushell/library'],
	function(Control, library) {
	"use strict";

/**
 * Constructor for a new ui/launchpad/Fiori2LoadingDialog.
 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * Displays a fiori2 app navigation loading dialog with an indicator that an app is loading
 * @extends sap.ui.core.Control
 *
 * @constructor
 * @public
 * @name sap.ushell.ui.launchpad.Fiori2LoadingDialog
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
var Fiori2LoadingDialog = Control.extend("sap.ushell.ui.launchpad.Fiori2LoadingDialog", /** @lends sap.ushell.ui.launchpad.Fiori2LoadingDialog.prototype */ { metadata : {

	library : "sap.ushell",
	properties : {

		/**
		 * the text to be displayed
		 */
		text : {type : "sap.ui.core.URI", group : "Appearance", defaultValue : null}
	}
}});

    /*global jQuery, sap, window */
    /*jslint nomen: true*/

    /**
     * Fiori2LoadingDialog
     *
     * @name sap.ushell.ui.launchpad.Fiori2LoadingDialog
     * @private
     * @since 1.38.0
     */

    Fiori2LoadingDialog.prototype.init = function () {
        var body = document.getElementsByTagName("body")[0],
            elLoadingOverlay = document.createElement("DIV"),
            elBusyIndicator = document.createElement("DIV"),
            elLoadingDialog = document.createElement("DIV"),
            elAccessibilityHelper = document.createElement("DIV"),
            elAccessibilityAppInfo = document.createElement("DIV"),
            elAccessibilityLoadingComplete = document.createElement("DIV"),
            elLoadingArea = document.createElement("DIV");

        this._oBusyIndicator = this.getBusyIndicator();
        this._oBusyIndicator.setBusyIndicatorDelay(100);
        this._firstLoading = true;
        this._start = 0;
        this._end = 0;


        elLoadingArea.setAttribute("id", "sapUshellFiori2LoadingArea");
        elLoadingArea.setAttribute("class", "sapUshellFiori2LoadingDialogArea");
        elLoadingArea.setAttribute("style", "height: 0px; width: 0px; overflow: hidden; float: left;");
        body.insertBefore(elLoadingArea, body.firstChild);

        elAccessibilityHelper.setAttribute("id", "sapUshellLoadingAccessibilityHelper");
        elAccessibilityHelper.setAttribute("class", "sapUshellLoadingAccessibilityHelper");

        elAccessibilityAppInfo.setAttribute("id", "sapUshellLoadingAccessibilityHelper-appInfo");
        elAccessibilityAppInfo.setAttribute("aria-atomic", "true");
        elAccessibilityHelper.appendChild(elAccessibilityAppInfo);

        elAccessibilityLoadingComplete.setAttribute("id", "sapUshellLoadingAccessibilityHelper-loadingComplete");
        elAccessibilityLoadingComplete.setAttribute("aria-atomic", "true");
        elAccessibilityLoadingComplete.setAttribute("aria-live", "polite");
        elAccessibilityHelper.appendChild(elAccessibilityLoadingComplete);

        elLoadingArea.appendChild(elAccessibilityHelper);

        elLoadingDialog.setAttribute("id", "sapUshellFiori2LoadingDialog");
        elLoadingDialog.setAttribute("style", "z-index: 8;visibility: visible;");
        elLoadingDialog.setAttribute("class", "sapUshellShellHidden");

        elLoadingOverlay.setAttribute("id", "sapUshellFiori2LoadingOverlay");
        elLoadingOverlay.setAttribute("class", "sapUshellFiori2LoadingDialogOverlayStyle");
        elLoadingDialog.appendChild(elLoadingOverlay);

        elBusyIndicator.setAttribute("id", "sapUshellFiori2LoadingBusyIndicator");
        elLoadingDialog.appendChild(elBusyIndicator);

        body.insertBefore(elLoadingDialog, elLoadingArea);

        this._oBusyIndicator.placeAt("sapUshellFiori2LoadingBusyIndicator");

    };

		Fiori2LoadingDialog.prototype.getBusyIndicator = function () {
				return new sap.m.BusyIndicator("fiori2LoadingDialogBusyIndicator");
		};

    Fiori2LoadingDialog.prototype.openLoadingScreen = function (sAnimationMode) {
        this.start = new Date().getTime();
        var jqLoadingDialog = jQuery("#sapUshellFiori2LoadingOverlay");

        sAnimationMode = sAnimationMode || "full";

        jQuery("#sapUshellFiori2LoadingDialog").toggleClass("sapUshellShellHidden", false);

        // opening the overlay with/without animation accordingly
        if (this._firstLoading) {
            // Update flag.
            this._firstLoading = false;

            if (sAnimationMode === 'minimal') {
                jqLoadingDialog.toggleClass("sapUshellInitialLoadingDialogOverlayNoAnimation", true);
            } else {
                /* Should check for the third mode when implemented */
                /* currently only minimal and full. */
                jqLoadingDialog.toggleClass("sapUshellInitialLoadingDialogOverlayAnimation", true);
            }
        } else {
            if (sAnimationMode === 'minimal') {
                jqLoadingDialog.toggleClass("sapUshellLoadingDialogOverlayNoAnimation", true);
            } else {
                /* Should check for the third mode when implemented */
                /* currently only minimal and full. */
                jqLoadingDialog.toggleClass("sapUshellLoadingDialogOverlayAnimation", true);
            }
        }
        // opening the busy indicator
        if (sAnimationMode !== 'minimal') {
            jQuery.sap.measure.start("FLP:LoadingDialogClassAdding", "LoadingDialog", "FLP");
            var oBusyIndicator = sap.ui.getCore().byId('fiori2LoadingDialogBusyIndicator');

            if (oBusyIndicator) {
                oBusyIndicator.addStyleClass('sapUshellLoadingDialogBusyIndicatorAnimation');
            }
            jQuery.sap.measure.end("FLP:LoadingDialogClassAdding");
        }

    };

    Fiori2LoadingDialog.prototype.isOpen = function () {
        return !jQuery("#sapUshellFiori2LoadingDialog").hasClass("sapUshellShellHidden");
    };

    Fiori2LoadingDialog.prototype.closeLoadingScreen = function () {
        //pause the animation
        var jqLoadingDialogOverlay = jQuery("#sapUshellFiori2LoadingOverlay");
        jqLoadingDialogOverlay.toggleClass("sapUshellAnimationPaused", true);
        //check if the overlay started the scale animation

        var removeAnimationClasses = function () {
            var oBusyIndicator = sap.ui.getCore().byId('fiori2LoadingDialogBusyIndicator');

            jQuery("#sapUshellFiori2LoadingDialog").toggleClass("sapUshellShellHidden", true);
            jqLoadingDialogOverlay.toggleClass("sapUshellLoadingDialogOverlayNoAnimation", false);
            jqLoadingDialogOverlay.toggleClass("sapUshellLoadingDialogOverlayAnimation", false);
            jqLoadingDialogOverlay.toggleClass("sapUshellInitialLoadingDialogOverlayAnimation", false);
            if (oBusyIndicator) {
                oBusyIndicator.removeStyleClass('sapUshellLoadingDialogBusyIndicatorAnimation');
            }
        }
        if (jqLoadingDialogOverlay[0] && jqLoadingDialogOverlay[0].getBoundingClientRect().width < 100) {
            removeAnimationClasses();
            jqLoadingDialogOverlay.toggleClass("sapUshellAnimationPaused", false);
        } else {
            //resume the animation and stop it after it ends
            jqLoadingDialogOverlay.toggleClass("sapUshellAnimationPaused", false);
            setTimeout (function () {
                removeAnimationClasses();
            }, 500);
        }
   };

    Fiori2LoadingDialog.prototype.exit= function () {
        this._oBusyIndicator.destroy();
    }



	return Fiori2LoadingDialog;

});
