// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap, document, self */
    /*jslint plusplus: true, nomen: true, vars: true */

    sap.ui.jsview("sap.ushell.renderers.fiori2.userAccount.UserAccountSelector", {
        createContent: function (oController) {
            var i18n = sap.ushell.resources.i18n;
            var sFlexDirection = sap.ui.Device.system.phone ? 'Column' : 'Row';
            var sFlexAlignItems = sap.ui.Device.system.phone ? 'Stretch' : 'Center';
            var sTextAlign = sap.ui.Device.system.phone ? 'Left' : 'Right';
            var sLabelWidth = sap.ui.Device.system.phone ? "auto" : "12rem";
            var nameLabel = new sap.m.Label({
                text: i18n.getText("UserAccountNameFld") + ":",
                width: sLabelWidth,
                textAlign: sTextAlign
            });
            var nameInput = new sap.m.Input("userAccountuserName", {
                value: "{/name}",
                editable: false
            }).addAriaLabelledBy(nameLabel);

            nameInput.addEventDelegate({
                onfocusin: function () {
                    jQuery("#userAccountuserName input").blur();
                }
            });

            var fboxName = new sap.m.FlexBox({
                alignItems: sFlexAlignItems,
                direction: sFlexDirection,
                items: [nameLabel, nameInput]
            });
            var emailLabel = new sap.m.Label({
                text: i18n.getText("UserAccountEmailFld") + ":",
                width: sLabelWidth,
                textAlign: sTextAlign
            });
            var fboxMail = new sap.m.FlexBox({
                alignItems: sFlexAlignItems,
                direction: sFlexDirection,
                items: [
                    emailLabel,
                    new sap.m.Input({
                        value: "{/mail}",
                        editable: false
                    }).addAriaLabelledBy(emailLabel)
                ]
            });
            var serverLabel =  new sap.m.Label({
                text: i18n.getText("UserAccountServerFld") + ":",
                width: sLabelWidth,
                textAlign: sTextAlign
            });
            var fboxServer = new sap.m.FlexBox({
                alignItems: sFlexAlignItems,
                direction: sFlexDirection,
                items: [
                    serverLabel,
                    new sap.m.Input({
                        value: "{/server}",
                        editable: false
                    }).addAriaLabelledBy(serverLabel)
                ]
            });


            var vbox = new sap.m.VBox({
                items: [fboxName, fboxMail, fboxServer]
            });
            vbox.addStyleClass("sapUiSmallMargin");

            return vbox;
        },

        getControllerName: function () {
            return "sap.ushell.renderers.fiori2.userAccount.UserAccountSelector";
        }
    });



}, /* bExport= */ true);
