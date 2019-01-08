/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

// Provides control sap.ushell.ui.footerbar.AboutButton.
sap.ui.define([
    'sap/m/Button',
    'sap/m/Dialog',
    'sap/m/ObjectHeader',
    'sap/m/VBox',
    'sap/ui/layout/form/SimpleForm',
    'sap/ushell/library',
    'sap/ushell/resources',
    'sap/ushell/ui/launchpad/ActionItem',
    'sap/ushell/services/AppConfiguration',
    'sap/m/Label',
    'sap/m/Text'
], function (Button, Dialog, ObjectHeader, VBox, SimpleForm, library, resources, ActionItem, AppConfiguration, Label, Text) {
    "use strict";

   /**
    * Constructor for a new ui/footerbar/AboutButton.
    *
    * @param {string} [sId] id for the new control, generated automatically if no id is given 
    * @param {object} [mSettings] initial settings for the new control
    *
    * @class
    * Add your documentation for the newui/footerbar/AboutButton
    * @extends sap.ushell.ui.launchpad.ActionItem
    *
    * @constructor
    * @public
    * @name sap.ushell.ui.footerbar.AboutButton
    * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
    */
    var AboutButton = ActionItem.extend("sap.ushell.ui.footerbar.AboutButton", /** @lends sap.ushell.ui.footerbar.AboutButton.prototype */ { metadata : {
        library : "sap.ushell"
    }});

    /*global jQuery, sap, navigator*/

    /**
     * AboutButton
     *
     * @name sap.ushell.ui.footerbar.AboutButton
     * @private
     * @since 1.16.0
     */
    AboutButton.prototype.init = function () {
        //call the parent sap.ushell.ui.launchpad.ActionItem init method
        if (ActionItem.prototype.init) {
            ActionItem.prototype.init.apply(this, arguments);
        }
        this.setIcon('sap-icon://hint');
        this.setText(resources.i18n.getText("about"));
        this.setTooltip(resources.i18n.getText("about"));
        this.attachPress(this.showAboutDialog);
    };

    AboutButton.prototype.showAboutDialog = function () {

        var translationBundle = resources.i18n,
            metaData = AppConfiguration.getMetadata(),
            oApplication = AppConfiguration.getCurrentApplication(),
            oComponentHandle = oApplication ? oApplication.componentHandle : undefined,
            oManifest = oComponentHandle && oComponentHandle.getMetadata() ? oComponentHandle.getMetadata().getManifest() : undefined,
            aRegistrationIds = oManifest && oManifest["sap.fiori"] ? oManifest["sap.fiori"].registrationIds : undefined,
            sAppId = aRegistrationIds && aRegistrationIds.length ? aRegistrationIds[0] : undefined,
            oSimpleForm = new SimpleForm({
                id: 'aboutDialogFormID',
                editable: false,
                content : [
                    new Label({text : translationBundle.getText("technicalName")}),
                    new Text({text : metaData.libraryName || ''}),
                    new Label({text : translationBundle.getText("fioriVersionFld")}),
                    new Text({text : metaData.version || ''}),
//                    new Label({text : translationBundle.getText("fioriBuildFld")}),
//                    new Text({text : sap.ui.buildinfo.buildtime || ''}),
                    new Label({text : translationBundle.getText("sapui5Fld")}),
                    new Text({text : (sap.ui.version || "") + (' (' + (sap.ui.buildinfo.buildtime || "") + ')') || ''}),
                    new Label({text : translationBundle.getText("userAgentFld")}),
                    new Text({text : navigator.userAgent || ''}),
                    new Label({text : ''})
                ]
            }),
            oHeader = new ObjectHeader({
                title : metaData.title,
                icon : metaData.icon
            }).addStyleClass('sapUshellAboutDialogHeader'),
            oDialog,
            oVBox,
            okButton = new Button({
                text : translationBundle.getText("okBtn"),
                press : function () {
                    oDialog.close();
                }
            });

        if (sAppId) {
            oSimpleForm.addContent(new Label({text : translationBundle.getText("fioriAppId")}));
            oSimpleForm.addContent(new Text({text : sAppId}));
        }

        if (jQuery.isEmptyObject(metaData) || !metaData.icon) {
            oVBox = new VBox({
                items: [oSimpleForm]
            });
        } else {
            oVBox = new VBox({
                items: [oHeader, oSimpleForm]
            });
        }

        oDialog = new Dialog({
            id: "aboutContainerDialogID",
            title: translationBundle.getText("about"),
            contentWidth : "25rem",
            horizontalScrolling: false,
            leftButton: okButton,
            afterClose : function () {
                oDialog.destroy();
            }
        });

        oDialog.addContent(oVBox);
        oDialog.open();
    };

    return AboutButton;
},/* bExport= */true);

