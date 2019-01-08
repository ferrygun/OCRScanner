/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

// Provides control sap.ushell.ui.launchpad.EmbeddedSupportErrorMessage.
sap.ui.define(['sap/m/Button','sap/m/Dialog','sap/ushell/library','sap/ushell/resources'],
	function(Button, Dialog, library, resources) {
	"use strict";

    /**
     * Constructor for a new ui/launchpad/EmbeddedSupportErrorMessage.
     *
     * @param {string} [sId] id for the new control, generated automatically if no id is given
     * @param {object} [mSettings] initial settings for the new control
     *
     * @class
     * Add your documentation for the newui/launchpad/EmbeddedSupportErrorMessage
     * @extends sap.m.Dialog
     *
     * @constructor
     * @public
     * @name sap.ushell.ui.launchpad.EmbeddedSupportErrorMessage
     * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
     */
        var EmbeddedSupportErrorMessage = Dialog.extend("sap.ushell.ui.launchpad.EmbeddedSupportErrorMessage", /** @lends sap.ushell.ui.launchpad.EmbeddedSupportErrorMessage.prototype */ { metadata : {
            library : "sap.ushell",
            events : {
                afterClose : {}
            }
        }});

    /*global jQuery, sap, navigator*/

    /**
     * EmbeddedSupportErrorMessage
     *
     * @name sap.ushell.ui.launchpad.EmbeddedSupportErrorMessage
     * @private
     * @since 1.20.0
     */

        EmbeddedSupportErrorMessage.prototype.open = function () {
            var oContactSupportButton,
                oCloseButton;

            this.translationBundle = resources.i18n;
            oContactSupportButton = new Button({
                id : sap.ui.core.ElementMetadata.uid("supportBtn"),
                text : this.translationBundle.getText("contactSupportBtn"),
                press : function () {
                    this.close();
                    sap.ui.require(['sap/ushell/ui/footerbar/ContactSupportButton'],
                        function (ContactSupportButton) {
                            this.oContactSupport = new ContactSupportButton("ContactSupportErrorMsg", {
                                visible : true
                            });
                            if (this.oContactSupport) {
                                this.oContactSupport.showContactSupportDialog();
                                // oContactSupport is redundant after creation of the Contact Support Dialog.
                                this.oContactSupport.destroy();
                            }
                        });
                }.bind(this)
            });
            oCloseButton = new Button({
                id : sap.ui.core.ElementMetadata.uid("closeBtn"),
                text : this.translationBundle.getText("close"),
                press : function () {
                    this.close();
                }.bind(this)
            });

            this.setType(sap.m.DialogType.Message);
            this.setIcon('sap-icon://alert');
            this.setRightButton(oCloseButton);
            this.setLeftButton(oContactSupportButton);
            this._addStyleClassToContent();
            this.addStyleClass('sapMMessageBoxError');
            this.attachAfterClose(function () {
                this.destroy();
            }.bind(this));

            //call the parent sap.m.Dialog open method
            if (Dialog.prototype.open) {
                Dialog.prototype.open.apply(this, arguments);
            }
        };

        EmbeddedSupportErrorMessage.prototype._addStyleClassToContent = function () {
            var aContent = this.getContent(),
                oCurrentContent,
                index;

            for (index in aContent) {
                oCurrentContent = aContent[index];
                if (oCurrentContent.getMetadata().getName() === "sap.m.Text" && !oCurrentContent.aCustomStyleClasses) {
                    oCurrentContent.addStyleClass("sapMMsgBoxText");
                }
            }
        };

        EmbeddedSupportErrorMessage.prototype.onAfterRendering = function () {
            var sLabels,
                jqErrorMessage = jQuery("#EmbeddedSupportErrorMessage").eq(0);

            if (jqErrorMessage) {
                sLabels = jqErrorMessage.attr("aria-labelledby");
                jqErrorMessage.attr("aria-labelledby", sLabels + this.getContent()[0].getId());
            }
        };
        return EmbeddedSupportErrorMessage;
    });
