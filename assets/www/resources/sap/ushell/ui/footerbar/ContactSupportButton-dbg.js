/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

// Provides control sap.ushell.ui.footerbar.ContactSupportButton.
sap.ui.define([
    'sap/ushell/library',
    'sap/ushell/resources',
    'sap/ushell/ui/launchpad/AccessibilityCustomData',
    'sap/ushell/ui/launchpad/ActionItem'
], function (
    library,
    resources,
    AccessibilityCustomData,
    ActionItem
) {
    "use strict";

   /**
    * Constructor for a new ui/footerbar/ContactSupportButton.
    *
    * @param {string} [sId] id for the new control, generated automatically if no id is given 
    * @param {object} [mSettings] initial settings for the new control
    *
    * @class
    * Add your documentation for the newui/footerbar/CreateTicketButton
    * @extends sap.ushell.ui.launchpad.ActionItem
    *
    * @constructor
    * @public
    * @name sap.ushell.ui.footerbar.ContactSupportButton
    * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
    */
    var ContactSupportButton = ActionItem.extend("sap.ushell.ui.footerbar.ContactSupportButton", /** @lends sap.ushell.ui.footerbar.ContactSupportButton.prototype */ { metadata : {
        library : "sap.ushell"
    }});

    /*global jQuery, sap, window*/

    /**
     * ContactSupportButton
     *
     * @name sap.ushell.ui.footerbar.ContactSupportButton
     * @private
     * @since 1.16.0
     */
    ContactSupportButton.prototype.init = function () {
        //call the parent sap.ushell.ui.launchpad.ActionItem init method
        if (ActionItem.prototype.init) {
            ActionItem.prototype.init.apply(this, arguments);
        }
        this.setIcon('sap-icon://email');
        this.setText(resources.i18n.getText("contactSupportBtn"));
        this.attachPress(this.showContactSupportDialog);
        this.setEnabled();// disables button if shell not initialized
    };

    ContactSupportButton.prototype.showContactSupportDialog = function () {
        sap.ui.require([
            'sap/ushell/services/Container',
            'sap/ui/layout/form/SimpleForm',
            'sap/ui/layout/form/SimpleFormLayout',
            'sap/m/TextArea',
            'sap/m/Link',
            'sap/m/Label',
            'sap/m/Text',
            'sap/m/Dialog',
            'sap/m/Button',
            'sap/ushell/UserActivityLog'],
            function (Container, SimpleForm, SimpleFormLayout, TextArea, Link, Label, Text, Dialog, Button, UserActivityLog) {
                var applicationType = "",
                    url = "",
                    additionalInformation = "",
                    aBotomFormContent = [],
                    originalAfterRenderSimpleForm,
                    embedLoginDetailsInBottomForm;

                embedLoginDetailsInBottomForm = function () {
                    this.oDialog.removeContent(this.oBottomSimpleForm.getId());
                    this.oBottomSimpleForm.destroy();

                    if (this.oClientContext.navigationData.applicationInformation) {
                        applicationType = this.oClientContext.navigationData.applicationInformation.applicationType;
                        url = this.oClientContext.navigationData.applicationInformation.url;
                        additionalInformation = this.oClientContext.navigationData.applicationInformation.additionalInformation;
                    }
                    aBotomFormContent.push(new Text({text: this.translationBundle.getText("loginDetails")}).addStyleClass('sapUshellContactSupportHeaderInfoText'));
                    aBotomFormContent.push(new Label({text: this.translationBundle.getText("userFld")}));
                    aBotomFormContent.push(new Text({text: this.oClientContext.userDetails.fullName || ''}));
                    aBotomFormContent.push(new Label({text: this.translationBundle.getText("serverFld")}));
                    aBotomFormContent.push(new Text({text: window.location.host }));
                    if (this.oClientContext.userDetails.eMail && this.oClientContext.userDetails.eMail !== '') {
                        aBotomFormContent.push(new Label({text: this.translationBundle.getText("eMailFld")}));
                        aBotomFormContent.push(new Text({text: this.oClientContext.userDetails.eMail || ''}));
                    }
                    aBotomFormContent.push(new Label({text: this.translationBundle.getText("languageFld")}));
                    aBotomFormContent.push(new Text({text: this.oClientContext.userDetails.Language || ''}));

                    if (this.oClientContext.shellState === "app" || this.oClientContext.shellState === "standalone") {
                        //Required to align the following Text under the same column.
                        aBotomFormContent.push(new Text({text: ''}));
                        aBotomFormContent.push(new Text({text: this.translationBundle.getText("navigationDataFld")}).addStyleClass('sapUshellContactSupportHeaderInfoText'));
                        aBotomFormContent.push(new Label({text: this.translationBundle.getText("hashFld")}));
                        aBotomFormContent.push(new Text({text: this.oClientContext.navigationData.navigationHash || ''}));
                        //Required to align the following Text under the same column.
                        aBotomFormContent.push(new Text({text: ''}));
                        aBotomFormContent.push(new Text({text: this.translationBundle.getText("applicationInformationFld")}).addStyleClass('sapUshellContactSupportHeaderInfoText'));
                        aBotomFormContent.push(new Label({text: this.translationBundle.getText("applicationTypeFld")}));
                        aBotomFormContent.push(new Text({text: applicationType}));
                        aBotomFormContent.push(new Label({text: this.translationBundle.getText("urlFld")}));
                        aBotomFormContent.push(new Text({text: url}));
                        aBotomFormContent.push(new Label({text: this.translationBundle.getText("additionalInfoFld")}));
                        aBotomFormContent.push(new Text({text: additionalInformation}));
                    }
                    this.oBottomSimpleForm = new sap.ui.layout.form.SimpleForm('technicalInfoBox', {
                        layout: sap.ui.layout.form.SimpleFormLayout.ResponsiveLayout,
                        content: aBotomFormContent
                    }).addStyleClass("sapUshellTechnicalInfoBox");
                    if (sap.ui.Device.os.ios && sap.ui.Device.system.phone) {
                        this.oBottomSimpleForm.addStyleClass("sapUshellContactSupportFixWidth");
                    }

                    originalAfterRenderSimpleForm = this.oBottomSimpleForm.onAfterRendering;
                    this.oBottomSimpleForm.onAfterRendering = function () {
                        originalAfterRenderSimpleForm.apply(this, arguments);
                        var node = jQuery(this.getDomRef());
                        node.attr("tabIndex", 0);
                        jQuery.sap.delayedCall(700, node, function () {
                            this.focus();
                        });
                    };

                    this.oDialog.addContent(this.oBottomSimpleForm);
                }.bind(this);

                this._embedLoginDetailsInBottomForm = embedLoginDetailsInBottomForm;

                this.translationBundle = resources.i18n;
                this.oClientContext = UserActivityLog.getMessageInfo();
                this.oLink = new Link({text: this.translationBundle.getText("technicalDataLink")});
                this.oBottomSimpleForm = new SimpleForm("bottomForm", {editable: false, content: [this.oLink]});
                this.sendButton = new Button("contactSupportSendBtn", {
                    text: this.translationBundle.getText("sendBtn"),
                    enabled: false,
                    press: function () {
                        var oSupportTicketService = sap.ushell.Container.getService("SupportTicket"),
                            oText = this.oTextArea.getValue(),
                            oSupportTicketData = {text: oText, clientContext: this.oClientContext},
                            promise = oSupportTicketService.createTicket(oSupportTicketData);

                        promise.done(function () {
                            sap.ushell.Container.getService("Message").info(this.translationBundle.getText("supportTicketCreationSuccess"));
                        }.bind(this));
                        promise.fail(function () {
                            sap.ushell.Container.getService("Message").error(this.translationBundle.getText("supportTicketCreationFailed"));
                        }.bind(this));
                        this.oDialog.close();
                    }.bind(this)
                });
                this.cancelButton = new Button("contactSupportCancelBtn", {
                    text: this.translationBundle.getText("cancelBtn"),
                    press: function () {
                        this.oDialog.close();
                    }.bind(this)
                });
                this.oTextArea = new TextArea("textArea", {
                    rows: 7,
                    liveChange: function () {
                        if (/\S/.test(this.oTextArea.getValue())) {
                            this.sendButton.setEnabled(true);
                        } else {
                            this.sendButton.setEnabled(false);
                            this.oTextArea.setValue("");
                        }
                    }.bind(this)
                });

                this.oTopSimpleForm = new SimpleForm("topForm", {
                    editable: false,
                    content: [this.oTextArea],
                    layout: SimpleFormLayout.ResponsiveGridLayout
                });
                this.oDialog = new Dialog({
                    id: "ContactSupportDialog",
                    title: this.translationBundle.getText("contactSupportBtn"),
                    contentWidth : "29.6rem",
                    leftButton: this.sendButton,
                    rightButton: this.cancelButton,
                    initialFocus: "textArea",
                    afterOpen: function () {
                        //Fix ios 7.1 bug in ipad4 where there is a gray box on the screen when you close the keyboards
                        jQuery("#textArea").on("focusout", function () {
                            window.scrollTo(0, 0);
                        });
                    },
                    afterClose: function () {
                        this.oDialog.destroy();
                    }.bind(this)
                }).addStyleClass("sapUshellContactSupportDialog");

                this.oTextArea.setPlaceholder(this.translationBundle.getText("txtAreaPlaceHolderHeader"));
                this.oLink.attachPress(embedLoginDetailsInBottomForm.bind(this));
                this.oDialog.addCustomData(new AccessibilityCustomData({
                    key: "aria-label",
                    value: this.translationBundle.getText("ContactSupportArialLabel"),
                    writeToDom: true
                }));
                this.oDialog.addContent(this.oTopSimpleForm);
                this.oDialog.addContent(this.oBottomSimpleForm);
                this.oDialog.open();
            }.bind(this)
            );
    };

    ContactSupportButton.prototype.setEnabled = function (bEnabled) {
        if (!sap.ushell.Container) {
            if (this.getEnabled()) {
                jQuery.sap.log.warning(
                    "Disabling 'Contact Support' button: unified shell container not initialized",
                    null,
                    "sap.ushell.ui.footerbar.ContactSupportButton"
                );
            }
            bEnabled = false;
        }
        ActionItem.prototype.setEnabled.call(this, bEnabled);
    };

    return ContactSupportButton;
},/* bExport= */true);
