/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

// Provides control sap.ushell.ui.footerbar.LogoutButton.
sap.ui.define(['sap/ushell/library', 'sap/ushell/resources', 'sap/ushell/ui/launchpad/ActionItem'],
    function (library, resources, ActionItem) {
        "use strict";

        /**
         * Constructor for a new ui/footerbar/LogoutButton.
         *
         * @param {string} [sId] id for the new control, generated automatically if no id is given
         * @param {object} [mSettings] initial settings for the new control
         *
         * @class
         * A logout button for the UShell footerbar.
         * @extends sap.ushell.ui.launchpad.ActionItem
         *
         * @constructor
         * @public
         * @name sap.ushell.ui.footerbar.LogoutButton
         * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
         */
        var LogoutButton = ActionItem.extend("sap.ushell.ui.footerbar.LogoutButton", /** @lends sap.ushell.ui.footerbar.LogoutButton.prototype */ { metadata : {

            library : "sap.ushell"
        }});

        /*global jQuery, sap*/

        /**
         * LogoutButton
         *
         * @name sap.ushell.ui.footerbar.LogoutButton
         * @private
         * @since 1.16.0
         */
        LogoutButton.prototype.init = function () {
            //call the parent sap.ushell.ui.launchpad.ActionItem init method
            if (ActionItem.prototype.init) {
                ActionItem.prototype.init.apply(this, arguments);
            }
            this.setIcon('sap-icon://log');
            this.setTooltip(resources.i18n.getText("signoutBtn_tooltip"));
            this.setText(resources.i18n.getText("signoutBtn_title"));
            this.attachPress(this.logout);
            this.setEnabled();  // disables button if shell not initialized
        };

        LogoutButton.prototype.logout = function () {
            sap.ui.require(['sap/m/MessageBox'],
                function (MessageBox) {
                    var bShowLoadingScreen = true,
                        bIsLoadingScreenShown = false,
                        oLogoutDetails,
                        oLoading = new sap.ushell.ui.launchpad.LoadingDialog({text: ""});

                    sap.ushell.Container.getGlobalDirty().done(function (dirtyState) {
                        bShowLoadingScreen = false;
                        if (bIsLoadingScreenShown === true) {
                            oLoading.exit();
                            oLoading = new sap.ushell.ui.launchpad.LoadingDialog({text: ""});
                        }

                        var _getLogoutDetails = function (dirtyState) {
                            var oLogoutDetails = {},
                                oResourceBundle = resources.i18n;

                            if (dirtyState === sap.ushell.Container.DirtyState.DIRTY) {
                                // show warning only if it is sure that there are unsaved changes
                                oLogoutDetails.message = oResourceBundle.getText('unsaved_data_warning_popup_message');
                                oLogoutDetails.icon = sap.m.MessageBox.Icon.WARNING;
                                oLogoutDetails.messageTitle = oResourceBundle.getText("unsaved_data_warning_popup_title");
                            } else {
                                // show 'normal' logout confirmation in all other cases, also if dirty state could not be determined
                                oLogoutDetails.message = oResourceBundle.getText('signoutConfirmationMsg');
                                oLogoutDetails.icon = sap.m.MessageBox.Icon.QUESTION;
                                oLogoutDetails.messageTitle = oResourceBundle.getText("signoutMsgTitle");
                            }

                            return oLogoutDetails;
                        };

                        oLogoutDetails = _getLogoutDetails(dirtyState);
                        sap.m.MessageBox.show(oLogoutDetails.message, oLogoutDetails.icon,
                            oLogoutDetails.messageTitle, [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                            function (oAction) {
                                if (oAction === sap.m.MessageBox.Action.OK) {
                                    oLoading.openLoadingScreen();
                                    oLoading.showAppInfo(resources.i18n.getText('beforeLogoutMsg'), null);
                                    sap.ushell.Container.logout();
                                }
                            }, sap.ui.core.ElementMetadata.uid("confirm"));
                    });
                    if (bShowLoadingScreen === true) {
                        oLoading.openLoadingScreen();
                        bIsLoadingScreenShown = true;
                    }
                }.bind(this)
                );
        };

        LogoutButton.prototype.setEnabled = function (bEnabled) {
            if (!sap.ushell.Container) {
                if (this.getEnabled()) {
                    jQuery.sap.log.warning(
                        "Disabling 'Logout' button: unified shell container not initialized",
                        null,
                        "sap.ushell.ui.footerbar.LogoutButton"
                    );
                }
                bEnabled = false;
            }
            ActionItem.prototype.setEnabled.call(this, bEnabled);
        };
        return LogoutButton;
    });
