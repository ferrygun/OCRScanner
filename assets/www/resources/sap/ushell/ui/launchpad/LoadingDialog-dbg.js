/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

// Provides control sap.ushell.ui.launchpad.LoadingDialog.
sap.ui.define([
		'sap/m/Label',
		'sap/ui/core/Control',
		'sap/ui/core/Icon',
		'sap/ui/core/Popup',
		'sap/ushell/library',
		'./AccessibilityCustomData'
	], function(Label, Control, Icon, Popup, library, AccessibilityCustomData) {
	"use strict";

/**
 * Constructor for a new ui/launchpad/LoadingDialog.
 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given 
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * Displays a loading dialog with an indicator that an app is loading
 * @extends sap.ui.core.Control
 *
 * @constructor
 * @public
 * @name sap.ushell.ui.launchpad.LoadingDialog
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
var LoadingDialog = Control.extend("sap.ushell.ui.launchpad.LoadingDialog", /** @lends sap.ushell.ui.launchpad.LoadingDialog.prototype */ { metadata : {

	library : "sap.ushell",
	properties : {

		/**
		 * the sap-icon://-style URI of an icon
		 */
		iconUri : {type : "sap.ui.core.URI", group : "Appearance", defaultValue : null},

		/**
		 * the text to be displayed
		 */
		text : {type : "sap.ui.core.URI", group : "Appearance", defaultValue : null},

		/**
		 * defines whether the presentation of the Fiori flower animation should be displayed with an interval
		 */
		loadAnimationWithInterval : {type : "boolean", group : "Appearance", defaultValue : true}
	}
}});

    /*global jQuery, sap, window */
    /*jslint nomen: true*/

    /**
     * LoadingDialog
     *
     * @name sap.ushell.ui.launchpad.LoadingDialog
     * @private
     */

    LoadingDialog.prototype.init = function () {
        this._oPopup = new Popup();
        this._oPopup.restoreFocus = false;
        this._oPopup.setShadow(false);
        //adds the class "sapUshellLoadingDialog" to UI5 block layer
        this._oPopup.setModal(true, "sapUshellLoadingDialog");
        this.oIcon = new Icon();
        this._oLabel = new Label(this.getId() + 'loadingLabel');
        this.sState = "idle";
        //TODO: Require a dedicated string for application loading
        this.sLoadingString = sap.ushell.resources.i18n.getText("genericLoading").replace("...", " ");
    };

    LoadingDialog.prototype.exit = function () {
        this._oPopup.close();
        this._oPopup.destroy();
        this.oIcon.destroy();
        this._oLabel.destroy();
    };

    LoadingDialog.prototype.isOpen = function () {
        return this._oPopup.isOpen();
    };

    LoadingDialog.prototype.openLoadingScreen = function () {
        if (this.sState === "idle") {
            this.sState = "busy";
        }
        if (this.getLoadAnimationWithInterval()) {
            this.toggleStyleClass('sapUshellVisibilityHidden', true);
            this._iTimeoutId = setTimeout(function () {
                this.toggleStyleClass('sapUshellVisibilityHidden', false);
                this.$().focus();
            }.bind(this), 3000);
        } else {
            //Show the Fiori Flower and the appInfo at any rate in case the Animation is applied without interval.
            this.toggleStyleClass('sapUshellVisibilityHidden', false);
            this.$().focus();
        }
        if (!this.getVisible()) {
            this.setProperty('visible', true, true);
            this.$().show();
        }
        if (!this.isOpen()) {
            this._oPopup.setContent(this);
            this._oPopup.setPosition("center center", "center center", document, "0 0", "fit");
            //wrap with setimout.
            this._oPopup.open();
        }
    };

    LoadingDialog.prototype.setLoadAnimationWithInterval = function (bShowLoadingAnimation) {
        this.setProperty('loadAnimationWithInterval', bShowLoadingAnimation, true);
    };

    LoadingDialog.prototype.showAppInfo = function (sAppTitle, sIconUri, bAnnounceAppTitle) {
        this.setProperty('text', sAppTitle, true);
        this.setProperty('iconUri', sIconUri, true);
        this.oIcon.setSrc(sIconUri);
        this._oLabel.setText(sAppTitle);

        this._oLabel.addCustomData(new AccessibilityCustomData({
            key: 'aria-hidden',
            value: "true",
            writeToDom: true
        }));

        if (jQuery("#" + this.getId() + "accessibility-helper")[0] && bAnnounceAppTitle) {
            jQuery("#" + this.getId() + "accessibility-helper")[0].innerText = this.sLoadingString;
        }
    };

    LoadingDialog.prototype.closeLoadingScreen = function () {
        if (this._iTimeoutId) {
            //Terminate delayed Fiori Flower presentation.
            clearTimeout(this._iTimeoutId);
        }
        if (this.getVisible()) {
            this.sState = "idle";
            this.setProperty('visible', false, true);
            this.$().hide();
            this._oPopup.close();
        }
    };

    LoadingDialog.prototype.onAfterRendering = function () {
        //set the width of the control for proper alignment
        this.$().css("width", "20rem");
    };


	return LoadingDialog;

});
