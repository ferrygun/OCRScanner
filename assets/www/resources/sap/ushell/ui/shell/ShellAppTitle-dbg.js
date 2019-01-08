/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */
/*global jQuery, sap */
/**
 * Provides control sap.ushell.ui.shell.ShellAppTitle
 *
 * This control is responsible to display the Shell Header Title.
 * This control could be rendered in two different states:
 * 1. Title only: only the title will be rendered inside the Shell Header
 * 2. Title with popover button: A button will be placed in the Shell Header Title area.
 *    When the user clicks on the button, a popover will raise and render the innerControl as its content.
 *
 *    innerControl: the content of the popover. Will be destroyed by the ShellAppTitle control.
 */
sap.ui.define(['jquery.sap.global', 'sap/m/Button', 'sap/ui/core/IconPool', 'sap/ushell/library', './ShellNavigationMenu', 'sap/ushell/services/AllMyApps'],
    function (jQuery, Button, IconPool) {
        "use strict";

        // The states of the ShellApp menu UI:
        // The states SHELL_NAV_MENU (2) and ALL_MY_APPS (3) are relevant in case that both ShallNavMenu and AllMyApps are active
        // and the user can navigate between them
        var oStateEnum = {
                SHELL_NAV_MENU_ONLY: 0,
                ALL_MY_APPS_ONLY: 1,
                SHELL_NAV_MENU : 2,
                ALL_MY_APPS: 3
            },
            ShellAppTitle;

        ShellAppTitle = Button.extend("sap.ushell.ui.shell.ShellAppTitle",
            {
                metadata: {
                    properties: {
                        text: {type : "string", group : "Misc", defaultValue : null},
                        tooltip: {type : "string", group : "Misc", defaultValue : null}
                    },
                    associations : {
                        navigationMenu: {type: "sap.ushell.ui.shell.ShellNavigationMenu"},
                        allMyApps: {type: "sap.ui.core.mvc.ViewType.JS"}
                    },
                    events: {
                        press: {},
                        textChanged : {}
                    }
                },

                renderer: {
                    render:  function (oRm, oControl) {

                        var sNavMenu = oControl.getNavigationMenu(),
                            sTitle = oControl.getText(),
                            bVisible = false,
                            oNavMenu,
                            oShellAppTitleState,
                            oModel = oControl.getModel();

                        if (sNavMenu) {
                            oNavMenu = sap.ui.getCore().byId(sNavMenu);
                        }

                        // Calculate the visibility of the ShellAppTitle control and the state of the ShallNavMenu/AllMyAps UIs
                        bVisible = oControl._getControlVisibilityAndState(oNavMenu, oControl);
                        oControl.bIconVisible = bVisible;

                        // render the title
                        oRm.write('<div ');
                        oRm.writeControlData(oControl);
                        oRm.addClass("sapUshellShellAppTitleContainer sapUshellAppTitle");
                        if (bVisible) {
                            oRm.write('tabindex="0" ');
                            oRm.addClass("sapUshellAppTitleClickable");
                            oRm.writeAttributeEscaped("role", "button");
                            oRm.writeAttributeEscaped("aria-haspopup", "true");
                            oRm.writeAttributeEscaped("aria-expanded", "false");
                            oShellAppTitleState = oModel.getProperty("/ShellAppTitleState");
                            if (oShellAppTitleState === oStateEnum.ALL_MY_APPS_ONLY) {
                                oRm.writeAttributeEscaped("aria-label", sap.ushell.resources.i18n.getText("ShowAllMyApps_AriaLabel", [sTitle]));
                            } else {
                                oRm.writeAttributeEscaped("aria-label", sap.ushell.resources.i18n.getText("ShellNavigationMenu_AriaLabel", [sTitle]));
                            }
                        } else {
                            // remove the 'heading' role because JAWS has a known bug that when you use this role + tabindex=0
                            // it announces the word 'edit' at the end of the announcement:
                            // https://dequeuniversity.com/testsuite/aria/aria-describedby/results/heading
                            //oRm.writeAttributeEscaped("role", "heading");
                            oRm.writeAttributeEscaped("aria-label", sTitle);
                            oRm.writeAttributeEscaped("aria-haspopup", "false");
                        }
                        oRm.writeClasses();
                        oRm.write(">");

                        if (bVisible) {
                            oRm.write("<div ");
                            oRm.addClass("sapUshellShellHeadAction");
                            oRm.writeClasses();
                            oRm.write("><span class='sapUshellShellHeadActionImg sapUshellShellAppTitleHeadActionImg'>");
                            oRm.renderControl(oControl.oIcon);
                            oRm.write("</span>");
                            oRm.write("</div>");
                        }

                        oRm.write('<h1 class="sapUshellHeadTitle" aria-level="1">');
                        if (sTitle) {
                            oRm.writeEscaped(sTitle);
                        }
                        oRm.write("</h1>");

                        oRm.write("</div>");
                    }
                }
            });

        ShellAppTitle.prototype.init = function () {

            //call the parent sap.m.Button init method
            if (Button.prototype.init) {
                Button.prototype.init.apply(this, arguments);
            }

            this.oIcon = IconPool.createControlByURI(sap.ui.core.IconPool.getIconURI("slim-arrow-down"));
            this.oIcon.addStyleClass("sapUshellAppTitleMenuIcon");

            // only for desktop
            if (sap.ui.Device.system.desktop) {

                // add acc support for open menu
                this.addEventDelegate({
                    onkeydown: function (oEvent) {

                        // support for open the menu with Alt&Down arrow
                        if (oEvent.altKey && oEvent.keyCode === 40) {
                            oEvent.preventDefault();
                            this.onclick();
                        }
                    }.bind(this)
                });
            }
            this._bTextChanged = false;
        };

        /**
         * ShellAppTitle click handler:
         * 1. Calculating UI visibility and state
         * 2. Creating content popover
         */
        ShellAppTitle.prototype.onclick = function (oEvent) {
            var that = this;

            this.oNavMenu = sap.ui.getCore().byId(that.getNavigationMenu());
            //this.oNavMenuWrapper = this.getNavigationMenuWrapper();
            this.oAllMyApps = sap.ui.getCore().byId(that.getAllMyApps());

            // it may be that the Title was clicked on (and not the icon which opens the menu)
            // we need to make sure the icon is displayed (e.g. rendered) - in case not we do not
            // open the menu
            if (!this.bIconVisible) {
                return;
            }

            // Initialize the popover for ALL_MY_APPS_ONLY status
            if (this.getModel().getProperty("/ShellAppTitleState") === oStateEnum.ALL_MY_APPS_ONLY) {
                jQuery.sap.measure.start("FLP:ShellAppTitle.onClick", "Click ShellAppTitle in HOME state, Launching AllMyApps", "FLP");

                // do not open the all my apps popover if the data is not available yet
                if (!this.oAllMyApps) {
                    return;
                }

                //Create a popover for allMyApps.
                if (!this._getAllMyAppsPopover()) {
                    this.oAllMyAppsPopover = this._createAllMyAppsPopover();
                }

                if (this.oAllMyAppsPopover.isOpen()) {
                    this.oAllMyAppsPopover.close();
                } else {
                    this.oAllMyAppsPopover.openBy(this);
                }

            } else {
                // This parameter will be 'true' if the click to close popover came from the ShellAppTitle
                this.bAppTitleClick = false;
                // Create the popover object, if not created yet
                if (!this._getNavMenuPopover()) {
                    this.oNavMenuPopover = this._createNavMenuPopover(this.getModel());
                }
                this.getModel().setProperty("/ShellAppTitleState", oStateEnum.SHELL_NAV_MENU);

                // desktop handling
                if (!sap.ui.Device.system.desktop) {
                    if (this._getNavMenuPopover().isOpen()) {
                        this._getNavMenuPopover().close();
                    } else {
                        this._getNavMenuPopover().openBy(this);
                        this.firePress();
                    }
                } else {
                    // mobile & tablet handling
                    if (!this.bAppTitleClick) {
                        this._getNavMenuPopover().openBy(this);
                        this.firePress();
                    } else {
                        this.bAppTitleClick = false;
                    }
                }
            }
            this._handlePopoverStateChange();
        };

        /**
         * Calculates the visibility of the shellAppTitle button and UI
         * (i.e. whether the the header title should be clickable or not)
         * and the state of the shellAppTitle UI (states defined by oStateEnum)
         *
         * @returns {boolean} true in case the header title should be clickable and false if not
         */
        ShellAppTitle.prototype._getControlVisibilityAndState = function (oNavMenu, oControl) {
            jQuery.sap.measure.start("FLP:ShellAppTitle.getControlVisibilityAndState", "Check AllMyApps and NavShellMenu visibility", "FLP");
            var bVisible = false,
                oModel = oControl.getModel(),
                oShellState = oModel ? oModel.getProperty("/currentState") : '',
                bAllMyAppsEnabled = sap.ushell.Container.getService("AllMyApps").isEnabled(),
                bNavMenuEnabled = this._isNavMenuEnabled(oNavMenu);

            if (!oModel) {
                return false;
            }

            if (oShellState.stateName === "app" || oShellState.stateName === "home") {
                // Calculate the visibility of ShellAppTitle, which is true if either AllMyApps or NavMenu (or both) are enabled
                bVisible = bAllMyAppsEnabled || bNavMenuEnabled;

                // Calculate the state
                // Option 1: both AllMyApps && NavMenu are enabled
                if (bAllMyAppsEnabled && bNavMenuEnabled) {
                    //this.oCurrentState = oStateEnum.SHELL_NAV_MENU;
                    oModel.setProperty("/ShellAppTitleState", oStateEnum.SHELL_NAV_MENU);

                    // Option 2: Only NavMenu is enabled
                } else if (!bAllMyAppsEnabled && bNavMenuEnabled) {
                    //this.oCurrentState = oStateEnum.SHELL_NAV_MENU_ONLY;
                    oModel.setProperty("/ShellAppTitleState", oStateEnum.SHELL_NAV_MENU_ONLY);

                    // Option 3: Only AllMyApps is enabled
                } else if (bAllMyAppsEnabled && !bNavMenuEnabled) {
                    // this.oCurrentState = oStateEnum.ALL_MY_APPS_ONLY;
                    oModel.setProperty("/ShellAppTitleState", oStateEnum.ALL_MY_APPS_ONLY);
                }
            } else {
                bVisible = bNavMenuEnabled;
                oModel.setProperty("/ShellAppTitleState", oStateEnum.SHELL_NAV_MENU_ONLY);
            }
            jQuery.sap.measure.end("FLP:ShellAppTitle.getControlVisibilityAndState");
            return bVisible;
        };

        ShellAppTitle.prototype._getAllMyAppsPopover = function () {
            return this.oAllMyAppsPopover;
        };

        ShellAppTitle.prototype._getNavMenuPopover = function () {
            return this.oNavMenuPopover;
        };

        /*******************************************************************************************************/
        /****************************************** Create Popover UI ******************************************/

        /**
         * Create and return the popover object that will contains the AllMyApps UI
         */
        ShellAppTitle.prototype._createAllMyAppsPopover = function () {
            var oAllMyAppsPopover = new sap.m.ResponsivePopover({
                id: "sapUshellAllMyAppsPopover",
                placement: sap.m.PlacementType.Bottom,
                title: "",
                showArrow: true,
                customHeader : this._getPopoverHeader(this.getModel()),
                showHeader: {
                    path: '/ShellAppTitleState',
                    formatter: function (oCurrentState) {
                        return oCurrentState !== oStateEnum.SHELL_NAV_MENU;
                    }
                },
                content: [this.oAllMyApps]
            });
            oAllMyAppsPopover.setModel(this.getModel());
            oAllMyAppsPopover.addStyleClass('sapUshellAppTitleAllMyAppsPopover');

            oAllMyAppsPopover.attachAfterOpen(function () {
                this.oAllMyApps._afterOpen();
                if (this.oToggleListButton.getVisible()) {
                    this.oToggleListButton.firePress();
                    this.oToggleListButton.setPressed(true)
                }
            }.bind(this));

            return oAllMyAppsPopover;
        };

        /**
         * Create and return the popover object that will contains the ShellNavMenu UI
         */
        ShellAppTitle.prototype._createNavMenuPopover = function () {
            var oNavMenuPopover = new sap.m.Popover({
                    id: "sapUshellAppTitlePopover",
                    placement: sap.m.PlacementType.Bottom,
                    title: "",
                    showArrow: true,
                    showHeader: {
                        path: '/ShellAppTitleState',
                        formatter: function (oCurrentState) {
                            return oCurrentState !== oStateEnum.SHELL_NAV_MENU;
                        }
                    },
                    content: sap.ui.getCore().byId(this.getNavigationMenu())
                }),
                oNavMenuPopoverStateBinding = this.getModel().bindProperty('/ShellAppTitleState');

            if (sap.ushell.Container.getService("AllMyApps").isEnabled()) {
                oNavMenuPopover.setFooter(this._getPopoverFooterContent(this.getModel()));
            }
            oNavMenuPopover.addStyleClass('sapUshellAppTitleNavigationMenuPopover');
            oNavMenuPopover.setModel(this.getModel());
            this.getModel().setProperty('/allMyAppsMasterLevel', 0); //0 => this.oStateEnum.FIRST_LEVEL
            //TODO:Should be moved from here:
            oNavMenuPopoverStateBinding.attachChange(this._handlePopoverStateChange.bind(this));
            //Just for the first time.
            //this._handlePopoverStateChange();
            //TODO: Don't forget to 'dettach'.

            // before popover open - call to before menu open
            oNavMenuPopover.attachBeforeOpen(function () {
                this.oNavMenu._beforeOpen();
            }.bind(this));

            // after popover open - fix scrolling for IOS and call to menu after open
            oNavMenuPopover.attachAfterOpen(function () {

                // fix for scrolling (By @Alexander Pashkov) on sap.m.Popover being override
                // in Mobile by UI5
                this.oNavMenu.$().on("touchmove.scrollFix", function (e) {
                    e.stopPropagation();
                });

                // calls to afterOpen on the navigation menu itself in case some things needed to be made;
                // initialize the keyboard navigation on the navigation menu only in case we
                this.oNavMenu._afterOpen();

                // adjusting aria-expanded property
                this._adjustAccProperties(true);
            }.bind(this));

            oNavMenuPopover.attachBeforeClose(function (event) {
                // By using document.activeElement.id we can identify what is the element
                // that the user clicked on in order to close the popover
                // if he clicked on the shellAppTitle, the flag will turn to true
                if (document.activeElement.id === this.getId()) {
                    this.bAppTitleClick = true;
                }

                event.preventDefault();
                event.cancelBubble();
            }.bind(this));

            oNavMenuPopover.attachAfterClose(function (event) {
                // adjusting aria-expanded property
                this._adjustAccProperties(false);
            }.bind(this));

            return oNavMenuPopover;
        };

        /**
         * Create and return the popover header, containing back button and toggle button
         */
        ShellAppTitle.prototype._getPopoverHeader = function (oModel) {
            if (!this.oPopoverHeader) {

                this.oBackButton = this._createPopoverBackButton();
                this.oBackButton.addStyleClass("sapUshellCatalogNewGroupBackButton");

                this.oToggleListButton = this._createPopoverToggleButton();
                this.oToggleListButton.addStyleClass("sapUshellAllMyAppsToggleListButton");

                this.oPopoverHeader = new sap.m.Bar("sapUshellShellAppPopoverHeader", {
                    contentLeft : [this.oBackButton, this.oToggleListButton],
                    contentMiddle : [
                        new sap.m.Label({
                            text : sap.ushell.resources.i18n.getText("allMyApps_headerTitle")
                        })
                    ]
                });
            }
            return this.oPopoverHeader;
        };

        /**
         * Popover Back Button functionality:
         * 1. In case the Master area is in first level - switch to ShellNavMenu
         * 2. In case the Master area is in second level - return the Master area to the first level (call switchToInitialState)
         */
        ShellAppTitle.prototype._createPopoverBackButton = function () {
            var oBackButton;

            oBackButton = new sap.m.Button("sapUshellAppTitleBackButton", {
                icon: sap.ui.core.IconPool.getIconURI("nav-back"),
                press : [this._popoverBackButtonPressHandler, this],
                tooltip: sap.ushell.resources.i18n.getText("shellNavMenu_openMenuTooltip")
            });

            return oBackButton;
        };

        ShellAppTitle.prototype._popoverBackButtonPressHandler = function () {
            var oAllMyAppsState = this.getAllMyAppsController().getCurrentState(),
                oModel = this.getModel();

            // In case of clicking "back" when in FIRST_LEVEL - switch to ShellNavMenu
            if ((oAllMyAppsState === this.getAllMyAppsController().getStateEnum().FIRST_LEVEL) ||
                    (oAllMyAppsState === this.getAllMyAppsController().getStateEnum().FIRST_LEVEL_SPREAD)) {
                if (oModel.getProperty("/ShellAppTitleState") !== oStateEnum.ALL_MY_APPS_ONLY) {
                    oModel.setProperty("/ShellAppTitleState", oStateEnum.SHELL_NAV_MENU);

                    //Open Nav Menu popover and close allMyAppsPopover
                    this._getAllMyAppsPopover().close();
                    this._getNavMenuPopover().openBy(this);
                }
            } else if (oAllMyAppsState === this.getAllMyAppsController().getStateEnum().SECOND_LEVEL) {
            	this.getAllMyAppsController().switchToInitialState();
            } else if ((sap.ui.Device.system.phone) && (oAllMyAppsState === this.getAllMyAppsController().getStateEnum().DETAILS)) {
            	this.getAllMyAppsController().handleSwitchToMasterAreaOnPhone();
            }
        };

        /**
         * This button should be visible only on devices, and is used for toggling between the master and the details areas
         */
        ShellAppTitle.prototype._createPopoverToggleButton = function (oModel) {
            var that = this,
                oToggleButton;

            oToggleButton = new sap.m.ToggleButton("sapUshellAllMyAppsToggleListButton", {
                icon: sap.ui.core.IconPool.getIconURI("sap-icon://menu2"),
                press: function (eEvent) {
                    that.oAllMyApps.getController().toggleMasterArea();
                    this.setTooltip(eEvent.getParameter("pressed") ?
                        sap.ushell.resources.i18n.getText("ToggleButtonHide") :
                        sap.ushell.resources.i18n.getText("ToggleButtonShow"))
                },
                tooltip: sap.ushell.resources.i18n.getText("ToggleButtonShow"),
                visible: {
                    path: '/isPhoneWidth',
                    formatter: function (bIsPhoneWidth) {
                        return bIsPhoneWidth && !sap.ui.Device.system.phone;
                    }
                }
            });

            return oToggleButton;
        };

        /**
         * Create and return the popover footer, containing a button for switching from ShellNavMenu to AllMyApps
         */
        ShellAppTitle.prototype._getPopoverFooterContent = function (oModel) {
            var that = this,
                bStateForAllMyApps,
                oAllMyAppsButton;

            if (!this.oPopoverFooterContent) {

            	oAllMyAppsButton = new sap.m.Button('allMyAppsButton', {
                    text : sap.ushell.resources.i18n.getText("allMyApps_launchingButtonTitle"),
                    press: function () {
                        oModel.setProperty("/ShellAppTitleState", oStateEnum.ALL_MY_APPS);
                        jQuery.sap.measure.start("FLP:ShellNavMenu.footerClick", "Click the footer of ShellNavMenu, Launching AllMyApps", "FLP");
                        if (!that._getAllMyAppsPopover()) {
                            that.oAllMyAppsPopover = that._createAllMyAppsPopover();
                        }
                        that.oNavMenuPopover.close();
                        that.oAllMyAppsPopover.openBy(that);
                        that.oBackButton.focus();
                    },
                    visible: {
                        path: '/ShellAppTitleState',
                        formatter: function (oCurrentState) {
                            return oCurrentState === oStateEnum.SHELL_NAV_MENU;
                        }
                    }
                });

                this.oPopoverFooterContent = new sap.m.Bar('shellpopoverFooter', {
                    visible: {
                        parts: ["/ShellAppTitleState", "/currentState/stateName"],
                        formatter: function (oCurrentState, sStateName) {
                            // Popover footer should be visible only on SHELL_NAV_MENU state, while the shell is either in home or in app state
                            bStateForAllMyApps = (sStateName === "home" || sStateName === "app");
                            return (oCurrentState === oStateEnum.SHELL_NAV_MENU) && bStateForAllMyApps;
                        }
                    },
                    contentMiddle : [oAllMyAppsButton]
                });
                this.addCustomData(oAllMyAppsButton, "role", "button");
                this.addCustomData(oAllMyAppsButton, "aria-label", sap.ushell.resources.i18n.getText("allMyApps_launchingButtonTitle"));
            }
            return this.oPopoverFooterContent;
        };

        /*************************************** Create Popover UI - End ***************************************/
        /*******************************************************************************************************/

        ShellAppTitle.prototype._isNavMenuEnabled = function (oNavMenu) {
            return oNavMenu ? oNavMenu.getItems() && oNavMenu.getItems().length > 0 : false;
        };

        ShellAppTitle.prototype._handlePopoverStateChange = function (oData) {
            var oModel = this.getModel(),
                oCurrentState = oModel.getProperty('/ShellAppTitleState');
        };

        ShellAppTitle.prototype.setText = function (sText) {
            this.setProperty("text", sText, false);
            this._bTextChanged = true;
        };

        ShellAppTitle.prototype.onAfterRendering = function () {
            if (this._bTextChanged) {
                this.fireTextChanged();
                if (this.getProperty("text") !== "Home" && this.getProperty("text") !== "" && this.getProperty("text") !== undefined) {
                    jQuery.sap.measure.end("FLP:OpenApplicationonClick");
                }
            }
            this._bTextChanged = false;
            var oShellHeader = sap.ui.getCore().byId("shell-header")
            if (oShellHeader) {
                oShellHeader._setMaxWidthForTitle();
            }
        };

        // adjusting aria-expanded property
        ShellAppTitle.prototype._adjustAccProperties = function (bIsOpen) {
            var jqTitle = jQuery(this.getDomRef()),
                bIsOpen = !!bIsOpen;

            jqTitle.attr("aria-expanded", bIsOpen);
        };

        ShellAppTitle.prototype.addCustomData = function (oItem, sKey, sValue) {
            oItem.addCustomData(new sap.ushell.ui.launchpad.AccessibilityCustomData({
                key: sKey,
                value: sValue,
                writeToDom: true
            }));
        };

        ShellAppTitle.prototype.close = function () {
            if (this.oNavMenuPopover && this.oNavMenuPopover.isOpen()) {
                this.oNavMenuPopover.close();
            }
        };

        ShellAppTitle.prototype.setTooltip = function (sTooltip) {
            this.oIcon.setTooltip(sTooltip);
        };

        ShellAppTitle.prototype.getAllMyAppsController = function () {
            return this.oAllMyApps.getController();
        };

        ShellAppTitle.prototype.getStateEnum = function () {
            return oStateEnum;
        };

        ShellAppTitle.prototype.onsapspace = ShellAppTitle.prototype.onclick;

        ShellAppTitle.prototype.onsapenter = ShellAppTitle.prototype.onclick;

        ShellAppTitle.prototype.exit = function () {
            var oNavMenu = sap.ui.getCore().byId(this.getNavigationMenu()),
                oAllMyApps = sap.ui.getCore().byId(this.getAllMyApps());

            if (oNavMenu) {
                oNavMenu.destroy();
            }
            if (oAllMyApps) {
                oAllMyApps.destroy();
            }
            if (this.oAllMyAppsPopover) {
                this.oAllMyAppsPopover.destroy();
            }
            if (this.oNavMenuPopover) {
                this.oNavMenuPopover.destroy();
            }
        };

        return ShellAppTitle;
    }, true);