/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

// Provides control sap.ushell.ui.footerbar.SettingsButton.
sap.ui.define([
    'sap/m/Button',
    'sap/ushell/library',
    'sap/ushell/resources',
    'sap/ushell/ui/footerbar/AboutButton',
    'sap/ushell/ui/footerbar/UserPreferencesButton',
    'sap/ushell/ui/footerbar/LogoutButton'],
    function (Button, library, resources, AboutButton, UserPreferencesButton, LogoutButton) {
        "use strict";

        /**
         * Constructor for a new ui/footerbar/SettingsButton.
         *
         * @param {string} [sId] id for the new control, generated automatically if no id is given
         * @param {object} [mSettings] initial settings for the new control
         *
         * @class
         * Add your documentation for the newui/footerbar/SettingsButton
         * @extends sap.m.Button
         *
         * @constructor
         * @public
         * @name sap.ushell.ui.footerbar.SettingsButton
         * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
         */
        var SettingsButton = Button.extend("sap.ushell.ui.footerbar.SettingsButton", /** @lends sap.ushell.ui.footerbar.SettingsButton.prototype */ { metadata : {

            library : "sap.ushell"
        }});

        /*global jQuery, sap*/

        /**
         * SettingsButton
         *
         * @name sap.ushell.ui.footerbar.SettingsButton
         * @private
         * @since 1.16.0
         */
        SettingsButton.prototype.init = function () {
            this.setIcon('sap-icon://action-settings');
            this.setTooltip(resources.i18n.getText("helpBtn_tooltip"));

            this.attachPress(this.showSettingsMenu);

            var oAboutButton = new AboutButton(),
                oUserPrefButton = new UserPreferencesButton(),
                oLogoutButton = new LogoutButton();

            this.defaultMenuItems = [oAboutButton, oUserPrefButton, oLogoutButton];
            //call the parent sap.m.Button init method
            if (Button.prototype.init) {
                Button.prototype.init.apply(this, arguments);
            }
        };

        SettingsButton.prototype.setMenuItems = function (buttons) {
            this.menuItems = buttons;
        };

        SettingsButton.prototype.showSettingsMenu = function () {
            sap.ui.require(['sap/m/ActionSheet'], function (ActionSheet) {
                var oActionSheet = new ActionSheet({
                    id: 'settingsMenu',
                    showHeader : false,
                    buttons : (this.menuItems || []).concat(this.defaultMenuItems)
                });

                oActionSheet.setPlacement(sap.m.PlacementType.Vertical);
                oActionSheet.openBy(this);

                oActionSheet.attachAfterClose(function () {
                    oActionSheet.removeAllButtons();
                    oActionSheet.destroy();
                });
            }.bind(this));
        };
        return SettingsButton;
    },/* bExport= */true);
