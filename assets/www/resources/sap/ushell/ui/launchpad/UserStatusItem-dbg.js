/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */
/*global jQuery, sap, document */
// Provides control sap.ushell.ui.launchpad.UserStatusItem.
sap.ui.define(['jquery.sap.global',
               'sap/ushell/library',
               'sap/ushell/resources',
               'sap/ushell/ui/launchpad/AccessibilityCustomData'],
    function (jQuery, ManagedObject, resources, AccessibilityCustomData) {
        "use strict";

        var translationBundle = resources.i18n,
            UserStatusItem;

        /**
         * Constructor for a new UserStatusItem.
         *
         * @param {string} [sId] id for the new control, generated automatically if no id is given
         * @param {object} [mSettings] initial settings for the new control
         *
         * @class
         * User Header Action Item of the Shell.
         * @extends sap.ui.core.Element
         *
         * @author SAP SE
         * @version 1.52.4
         *
         * @constructor
         * @private
         * @since 1.39.0
         * @alias sap.ushell.ui.launchpad.UserStatusItem
         * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
         */
        UserStatusItem = sap.m.ListItemBase.extend("sap.ushell.ui.launchpad.UserStatusItem", /** @lends sap.ushell.ui.launchpad.UserStatusItem.prototype */ {
            metadata : {

                properties : {

                    /**
                     * The name of the user.
                     */
                    status : {type : "object", group : "Appearance"},

                    visible : {type : "boolean", group : "Appearance", defaultValue : true},

                    isOpener : {type : "boolean", group : "Appearance", defaultValue : true},

                    ariaLabel : {type : "string", group : "Appearance", defaultValue : null},

                    enabled : {type : "boolean", group : "Appearance", defaultValue : true},

                    image : {type : "object", group : "Appearance", defaultValue : null}
                },
                aggregations: {
                    contentList : {type : "sap.ui.core.Control", multiple : false}
                },
                events : {
                    /**
                     * Event is fired when the user presses the button.
                     */
                    press : {}
                }
            },
            renderer: {
                renderLIContent : function (rm, oContainer) {
                    var rendererAsStatus = oContainer.getStatus() || UserStatusItem.prototype.STATUS_ENUM.AVAILABLE;

                    rm.write("<div");
                    if (!oContainer.getVisible()) {
                        rm.addClass("sapUshellShellHidden");
                    }
                    if (!oContainer.getIsOpener()) {
                        oContainer.addCustomData(new AccessibilityCustomData({
                            key: "tabindex",
                            value: "0",
                            writeToDom: true
                        }));
                    }
                    rm.addClass("sapUserStatusContent");
                    rm.writeClasses();
                    rm.write(">");

                    // Colored status whatever
                    rm.write("<div ");
                    rm.addClass(rendererAsStatus.styleClass);

                    rm.writeClasses();
                    rm.write(">");


                    rm.write("</div>");

                    // The status text
                    rm.write("<div");
                    if (rendererAsStatus.status === "signOut") {
                        rm.addClass("sapUserStatusSignOutText");
                    }
                    rm.addClass("sapUserStatusText");
                    rm.writeClasses();
                    rm.write(">");
                    rm.writeEscaped(rendererAsStatus.text);
                    rm.write("</div>");

                    if (oContainer.getIsOpener()) {
                        // The list arrow for opening the selection list
                        rm.write("<div class='sapUshellUserStatusExp sapUshellUserStatusDropDownArrow'></div>");
                    }

                    rm.write("</div>");
                }
            }
        });

        UserStatusItem.prototype.onclick = function (oEvent) {
            this.firePress();
            // IE always interprets a click on an anker as navigation and thus triggers the
            // beforeunload-event on the window. Since a ShellHeadItem never has a valid href-attribute,
            // the default behavior should never be triggered
            oEvent.preventDefault();
        };

        UserStatusItem.prototype.onsapspace = UserStatusItem.prototype.onclick;


        UserStatusItem.prototype.STATUS_ENUM = {
            AVAILABLE: {text: translationBundle.getText("userStatus_available"), id: 0, styleClass: "sapUshellUserStatusAvailableIndicator", status: "AVAILABLE"},
            AWAY: {text: translationBundle.getText("userStatus_away"), id: 1, styleClass: "sapUshellUserStatusAwayIndicator", status: "AWAY"},
            BUSY: {text: translationBundle.getText("userStatus_busy"), id: 2, styleClass: "sapUshellUserStatusBusyIndicator", status: "BUSY"},
            APPEAR_OFFLINE  : {text: translationBundle.getText("userStatus_appearOffline"), id: 3, styleClass: "sapUshellUserStatusAppearOfflineIndicator", status: "APPEAR_OFFLINE"},
            SIGNOUT: {text: translationBundle.getText("userStatus_signOut"), id: 4, styleClass: "sapUshellUserSignOutExp sapUserStatusText", status: "SIGNOUT"}
        };


        UserStatusItem.prototype.setEnabled = function (bEnabled) {
            this.setProperty('enabled', bEnabled, true);
            this.toggleStyleClass('sapUshellUserStatusDisable',!bEnabled);
            return this;
        };
       
        UserStatusItem.prototype.setVisible = function (bVisible) {
            this.setProperty('visible', bVisible, true);
            if (bVisible) {
                this.$().removeClass('sapUshellShellHidden');
            } else {
                this.$().addClass('sapUshellShellHidden');
            }
            this.invalidate();
            return this;
        };

        UserStatusItem.prototype.setStatus = function (oStatus) {
            this.setProperty('status', oStatus, true);
            this.invalidate();
            return this;
        };
        UserStatusItem.prototype.setImage = function (sImage) {
        };

        UserStatusItem.prototype.setAriaLabel = function (sAriaLabel) {
            this.setProperty('ariaLabel', sAriaLabel);
            return this;
        };

        UserStatusItem.prototype.setIsOpener = function (bIsOpener) {
            this.setProperty('isOpener', bIsOpener);
            return this;
        };

        return UserStatusItem;

    }, /* bExport= */ true);
