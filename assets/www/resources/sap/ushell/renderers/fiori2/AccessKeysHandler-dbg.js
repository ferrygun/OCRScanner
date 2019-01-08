// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/*global $, jQuery, sap, document, hasher */
sap.ui.define(function() {
	"use strict";

    var accessKeysHandler = function () {
    };

    accessKeysHandler.prototype = {

        keyCodes: jQuery.sap.KeyCodes,
        bFocusOnShell: true,
        bFocusPassedToExternalHandlerFirstTime: true,
        isFocusHandledByAnotherHandler: false,
        fnExternalKeysHandler: null,
        sLastExternalKeysHandlerUrl: null,
        fnExternalShortcuts: null,
        isleftAltPressed: false,
        bForwardNavigation: true,

        appOpenedHandler: function () {
            var sCurrentApplicationIntent = hasher.getHash();

            if (sCurrentApplicationIntent !== this.sLastExternalKeysHandlerUrl) {
                this.fnExternalKeysHandler = null;
            }
            this.sLastExternalKeysHandlerUrl = sCurrentApplicationIntent;
        },

        handleSearchKey: function () {
            var shellSearchBtn = sap.ui.getCore().byId('sf');
            if (shellSearchBtn && $('#sf:visible').length === 0) {
                // searchFieldInShell is open
                return;
            }
            jQuery(shellSearchBtn).click();
        },

        setFocusOnSearchButton: function (e) {
            e.preventDefault();
            var shellSearchBtn = sap.ui.getCore().byId('sf');
            if (shellSearchBtn) {
                jQuery(shellSearchBtn).focus();
            }
        },

        handleSearchAppFinderKey: function (oEvent) {
            var appFinderSearchBtn = sap.ui.getCore().byId('appFinderSearch');
            if (!appFinderSearchBtn || jQuery('#appFinderSearch:visible').length === 0) {
                return;
            } else if (jQuery('.sapUshellViewPortCenter').hasClass('centerClass')){
                // only in case the center view port is indeed centered we allow this hotkey of CTRL&S
                jQuery(appFinderSearchBtn).focus();

                oEvent.preventDefault();
                oEvent.stopPropagation();
                oEvent.stopImmediatePropagation();
            }
        },

        handleNavToMeArea: function () {
            var oMeAreaButton = sap.ui.getCore().byId("meAreaHeaderButton"),
                oMainShell = sap.ui.getCore().byId("mainShell"),
                sAppState;
            if (oMainShell) {
                sAppState = oMainShell.getController().getModelConfiguration().appState;
            }
            if (oMeAreaButton && !oMeAreaButton.getSelected() && sAppState != "headerless") {
                var oShellController = sap.ui.getCore().byId("mainShell").oController;
                oShellController.loadMeAreaView();
                oMeAreaButton.firePress();
            }
            
            setTimeout(function(){
                jQuery(".sapUshellActionItem:first").focus();
            }, 300);
        },

        handleSettingsButton: function () {
            var oMeAreaButton = sap.ui.getCore().byId("meAreaHeaderButton");
            if (oMeAreaButton && !oMeAreaButton.getSelected()) {
                var oShellController = sap.ui.getCore().byId("mainShell").oController;
                oShellController.loadMeAreaView();
                oMeAreaButton.firePress();
            }
            setTimeout(function(){
                jQuery("#userSettingsBtn").focus();
            }, 300);
        },

        handleNavToNotifications: function () {
            var oNotificationsButton = sap.ui.getCore().byId("NotificationsCountButton"),
                oMainShell = sap.ui.getCore().byId("mainShell"),
                sAppState;
            if (oMainShell) {
                sAppState = oMainShell.getController().getModelConfiguration().appState;
            }
            if (oNotificationsButton && sAppState != "headerless") {
                oNotificationsButton.firePress();
                setTimeout(function(){
                    jQuery("#notificationsView .sapUshellNotificationsListItem:visible:first").focus();
                }, 2000);
            }
        },

        handleSettings: function () {
            var oShellController,
                userSettingsBtn = sap.ui.getCore().byId('userSettingsBtn');

            if (!userSettingsBtn) {
                oShellController = sap.ui.getCore().byId("mainShell").oController;
                oShellController.loadMeAreaView();
                userSettingsBtn = sap.ui.getCore().byId('userSettingsBtn');
            }
            userSettingsBtn.firePress({"hotkeys":"ctrl_comma"});
        },

        handleAccessOverviewKey: function () {
            var translationBundle = sap.ushell.resources.i18n,
                isSearchAvailable = this.oModel.getProperty("/searchAvailable"),
                oMainShell = sap.ui.getCore().byId("mainShell"),
                contentList = [], //contains the content of the form depends on the launchpad configuration
                oSimpleForm,
                oDialog,
                sAppState,
                okButton;
            if (oMainShell) {
                sAppState = oMainShell.getController().getModelConfiguration().appState;
            }
            this.aShortcutsDescriptions.forEach(function (sViewName) {
                contentList.push(new sap.m.Label({text: sViewName.text}));
                contentList.push(new sap.m.Text({text: sViewName.description}));
            });

            if (isSearchAvailable) {
                contentList.push(new sap.m.Label({text: "Alt+F"}));
                contentList.push(new sap.m.Text({text: translationBundle.getText("hotkeyFocusOnSearchButton") }));
            }

            if (sAppState != "headerless") {
                contentList.push(new sap.m.Label({text: "Alt+M"}));
                contentList.push(new sap.m.Text({text: translationBundle.getText("hotkeyFocusOnMeArea") }));
                contentList.push(new sap.m.Label({text: "Alt+N"}));
                contentList.push(new sap.m.Text({text: translationBundle.getText("hotkeyFocusOnNotifications") }));
            }
            contentList.push(new sap.m.Label({text: "Alt+S"}));
            contentList.push(new sap.m.Text({text: translationBundle.getText("hotkeyFocusOnSettingsButton") }));
            contentList.push(new sap.m.Label({text: "Ctrl+Comma"}));
            contentList.push(new sap.m.Text({text: translationBundle.getText("hotkeyOpenSettings") }));

            if (isSearchAvailable) {
                contentList.push(new sap.m.Label({text: "Ctrl+Shift+F"}));
                contentList.push(new sap.m.Text({text: translationBundle.getText("hotkeyFocusOnSearchField") }));
            }

            oSimpleForm = new sap.ui.layout.form.SimpleForm({
                editable: false,
                content: contentList
            });

            okButton = new sap.m.Button({
                text: translationBundle.getText("okBtn"),
                press: function () {
                    oDialog.close();
                }
            });

            oDialog = new sap.m.Dialog({
                id: "hotKeysGlossary",
                title: translationBundle.getText("hotKeysGlossary"),
                contentWidth: "29.6rem",
                leftButton: okButton,
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.addContent(oSimpleForm);
            oDialog.open();
        },

        handleShortcuts: function (oEvent) {
            if (oEvent.altKey && !oEvent.shiftKey && !oEvent.ctrlKey) {
                switch (String.fromCharCode(oEvent.keyCode)) {
                    case 'M':
                        this.handleNavToMeArea();
                        break;
                    case 'N':
                        this.handleNavToNotifications();
                        break;
                    case 'S':
                        this.handleSettingsButton();
                        break;
                    case 'F':
                        this.setFocusOnSearchButton(oEvent);
                        break;
                } // End of switch
            } // End of if altKey



            // CTRL
            if (oEvent.ctrlKey) {
                // SHIFT
                if (oEvent.shiftKey) {
                    if (oEvent.keyCode === 70) { // F
                        // e.g. CTRL + SHIFT + F
                        this.handleSearchKey();
                    }
                } else {
                    // e.g. No Shift, only CTRL
                    if (oEvent.keyCode === 188) { //comma
                        this.handleSettings();
                    } else if (oEvent.keyCode === 112) { //F1
                        this.handleAccessOverviewKey();
                    } else if (oEvent.keyCode === 83) { // S
                        this.handleSearchAppFinderKey(oEvent);
                    }
                }
            }
        },

        registerAppKeysHandler: function (fnHandler) {
            this.fnExternalKeysHandler = fnHandler;
            this.sLastExternalKeysHandlerUrl = hasher.getHash();
        },

        resetAppKeysHandler: function () {
            this.fnExternalKeysHandler = null;
        },

        getAppKeysHandler: function () {
            return this.fnExternalKeysHandler;
        },

        registerAppShortcuts: function (fnHandler, aShortcutsDescriptions) {
            this.fnExternalShortcuts = fnHandler;
            this.aShortcutsDescriptions = aShortcutsDescriptions;
        },

        /*
             This method is responsible to restore focus in the shell (according to the event & internal logic)

             New parameter added : sIdForFocus
             This parameter in case supplied overrides the event/internal logic handling and enforces the focus
             on the element with the corresponding id.
         */
        _handleFocusBackToMe: function (oEvent, sIdForFocus) {
            this.bFocusOnShell = true;

            if (sIdForFocus) {
                jQuery("#" + sIdForFocus).focus();
            } else if (!oEvent) {
                jQuery("#meAreaHeaderButton").focus();
            } else if (oEvent.shiftKey) {
                this.bForwardNavigation = false;
                if (oEvent.keyCode === jQuery.sap.KeyCodes.TAB) {
                    jQuery("#sapUshellHeaderAccessibilityHelper").focus();
                } else if (oEvent.keyCode === jQuery.sap.KeyCodes.F6) {
                    oEvent.preventDefault();
                    jQuery("#meAreaHeaderButton").focus();
                }
            } else {
                this.bForwardNavigation = true;
                oEvent.preventDefault();
                // if no me area button (like in headerless state) then move forward
                if (!jQuery("#meAreaHeaderButton").length) {
                    jQuery("#sapUshellHeaderAccessibilityHelper").focus();
                } else {
                    jQuery("#meAreaHeaderButton").focus();
                }
            }
            //reset flag
            this.bFocusPassedToExternalHandlerFirstTime = true;
        },

        setIsFocusHandledByAnotherHandler: function (bHandled) {
            this.isFocusHandledByAnotherHandler = bHandled;
        },


        sendFocusBackToShell: function (oParam) {

            /*
             This method is responsible to restore focus in the shell (according to the event & internal logic)

             Added support to pass either an Event (e.g. KBN) to determine which area to focus on the shell
             OR
             String which is actually ID for a specific control to focus on
             */

            var oEvent = undefined, sIdForFocus = undefined;
            var sParamType = typeof oParam;

            if ( sParamType === "string") {
                sIdForFocus = oParam;
            } else if (sParamType === "object") {
                oEvent = oParam;
            }

            this._handleFocusBackToMe(oEvent, sIdForFocus);
        },

        _handleEventUsingExteranlKeysHandler: function (oEvent) {
            if (!this.bFocusOnShell && !this.isFocusHandledByAnotherHandler) {
                if (this.fnExternalKeysHandler && jQuery.isFunction(this.fnExternalKeysHandler)) {
                    this.fnExternalKeysHandler(oEvent, this.bFocusPassedToExternalHandlerFirstTime);
                    this.bFocusPassedToExternalHandlerFirstTime = false;
                }
            }
            //reset flag
            this.setIsFocusHandledByAnotherHandler(false);
        },

        init: function (oModel) {
            this.oModel = oModel;
            //prevent browser event ctrl+up/down from scrolling page
            //created by user `keydown` native event needs to be cancelled so browser will not make default action, which is scroll.
            //Instead we clone same event and dispatch it programmatic, so all handlers expecting to this event will still work

            document.addEventListener("keydown", function (oEvent) {
                //if Shift key was pressed alone, don't perform any action
                if (oEvent.keyCode === 16) {
                    return;
                }

                if (oEvent.shiftKey) {
                    this.bForwardNavigation = false;
                } else {
                    this.bForwardNavigation = true;
                }

                //make sure that UI5 events (sapskipforward/saptabnext/etc.) will run before the
                // document.addEventListener("keydown"... code in the AccessKeysHandler as it was before
                // when we used jQuery(document).on('keydown'..
                if (oEvent.keyCode === this.keyCodes.TAB || oEvent.keyCode === this.keyCodes.F6) {
                    setTimeout(function () {
                        this._handleEventUsingExteranlKeysHandler(oEvent);
                    }.bind(this), 0);
                } else {
                    this._handleEventUsingExteranlKeysHandler(oEvent);
                }

                if (oEvent.keyCode === 18) { //Alt key
                    if (oEvent.location === window.KeyboardEvent.DOM_KEY_LOCATION_LEFT) {
                        this.isleftAltPressed = true;
                    } else {
                        this.isleftAltPressed = false;
                    }
                }

                // check for shortcuts only if you pressed a combination of keyboards containing the left ALT key, or
                // without any ALT key at all
                if (this.isleftAltPressed || !oEvent.altKey) {
                    this.handleShortcuts(oEvent);
                    if (this.fnExternalShortcuts) {
                        this.fnExternalShortcuts(oEvent);
                    }
                }
            }.bind(this), true); // End of event handler
        }
    };

    var AccessKeysHandler = new accessKeysHandler();
    sap.ui.getCore().getEventBus().subscribe("sap.ushell.renderers.fiori2.Renderer", "appOpened",
        accessKeysHandler.prototype.appOpenedHandler.bind(AccessKeysHandler));


	return AccessKeysHandler;

}, /* bExport= */ true);
