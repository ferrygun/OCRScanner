/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

// Provides control sap.ushell.ui.footerbar.JamShareButton.
sap.ui.define(['sap/m/Button', 'sap/ushell/library', 'sap/ushell/resources', 'sap/ushell/services/Container'],
    function (Button, library, resources, Container) {
        "use strict";

       /**
        * Constructor for a new ui/footerbar/JamShareButton.
        *
        * @param {string} [sId] id for the new control, generated automatically if no id is given
        * @param {object} [mSettings] initial settings for the new control
        *
        * @class
        * Add your documentation for the newui/footerbar/JamShareButton
        * @extends sap.m.Button
        *
        * @constructor
        * @public
        * @name sap.ushell.ui.footerbar.JamShareButton
        * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
        */
        var JamShareButton = Button.extend("sap.ushell.ui.footerbar.JamShareButton", /** @lends sap.ushell.ui.footerbar.JamShareButton.prototype */ { metadata : {

            library : "sap.ushell",
            properties : {
                beforePressHandler : {type : "any", group : "Misc", defaultValue : null},
                afterPressHandler : {type : "any", group : "Misc", defaultValue : null},
                jamData : {type : "object", group : "Misc", defaultValue : null}
            }
        }});

        /*global jQuery, sap*/

        /**
         * JamShareButton
         *
         * @name sap.ushell.ui.footerbar.JamShareButton
         * @private
         * @since 1.15.0
         */
        JamShareButton.prototype.init = function () {
            var that = this;

            this.setEnabled();        // disables button if shell not initialized or Jam not active
            this.setIcon('sap-icon://share-2');
            this.setText(resources.i18n.getText("shareBtn"));

            this.attachPress(function () {
                if (that.getBeforePressHandler()) {
                    that.getBeforePressHandler()();
                }
                this.showShareDialog(that.getAfterPressHandler());
            });
            //call the parent sap.m.Button init method
            if (Button.prototype.init) {
                Button.prototype.init.apply(this, arguments);
            }
        };

        JamShareButton.prototype.showShareDialog = function (cb) {
            jQuery.sap.require('sap.collaboration.components.fiori.sharing.dialog.Component');
            if (!this.shareComponent) {
                this.shareComponent = sap.ui.getCore().createComponent({
                    name: "sap.collaboration.components.fiori.sharing.dialog"
                });
            }
            this.shareComponent.setSettings(this.getJamData());
            this.shareComponent.open();

            //TODO: call callback after dialog vanishes
            if (cb) {
                cb();
            }
        };

        JamShareButton.prototype.exit = function () {
            if (this.shareComponent) {
                this.shareComponent.destroy();
            }
            //call the parent sap.m.Button exit method
            if (Button.prototype.exit) {
                Button.prototype.exit.apply(this, arguments);
            }
        };

        JamShareButton.prototype.setEnabled = function (bEnabled) {
            if (!sap.ushell.Container) {
                if (this.getEnabled()) {
                    jQuery.sap.log.warning(
                        "Disabling JamShareButton: unified shell container not initialized",
                        null,
                        "sap.ushell.ui.footerbar.JamShareButton"
                    );
                }
                bEnabled = false;
            } else {
                var user = sap.ushell.Container.getUser();
                if (!(user && user.isJamActive())) {
                    if (this.getEnabled()) {
                        jQuery.sap.log.info(
                            "Disabling JamShareButton: user not logged in or Jam not active",
                            null,
                            "sap.ushell.ui.footerbar.JamShareButton"
                        );
                    }
                    bEnabled = false;
                    this.setVisible(false);
                }
            }
            Button.prototype.setEnabled.call(this, bEnabled);
        };
        return JamShareButton;
    },/* bExport= */true);
