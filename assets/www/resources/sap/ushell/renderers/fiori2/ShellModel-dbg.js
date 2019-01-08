// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap, window */
    /*jslint nomen: true */
    var isMobile = sap.ui.Device.system.phone;
    var oModelData = {
        animationMode: "full",
        searchAvailable: false,
        title: "", // no default value for title
        searchFiltering: true,
        showEndUserFeedback: false,
        searchTerm: "",
        isPhoneWidth: false,
        enableNotifications: false,
        enableNotificationsUI: false,
        notificationsCount: 0,
        currentViewPortState: "Center",
        userStatus: undefined,
        shellAppTitleData: {
            currentViewInPopover : "navigationMenu",
            enabled: false,
            showGroupsApps: false,
            showCatalogsApps: false,
            showExternalProvidersApps: false
        },
        customStatesDelta: {
            "home": {
                "actions": ["ContactSupportBtn", "EndUserFeedbackBtn"]
            },
            "app": {
                "actions": ["ContactSupportBtn", "EndUserFeedbackBtn", "aboutBtn"]
            },
            "minimal": {
                "actions": ["ContactSupportBtn", "EndUserFeedbackBtn", "aboutBtn"]
            },
            "standalone": {
                "actions": ["ContactSupportBtn", "EndUserFeedbackBtn", "aboutBtn"]
            },
            "embedded": {
                "actions": ["ContactSupportBtn", "EndUserFeedbackBtn", "aboutBtn"]
            },
            "embedded-home": {
                "actions": ["ContactSupportBtn", "EndUserFeedbackBtn", "aboutBtn"]
            }
        },
        states: {
            "blank": {
                "stateName": "blank",
                "showCurtain": false,
                "headerHiding": isMobile,
                "headerVisible": true,
                "headEndItems": [],
                "showCatalog": false,
                "showPane": false,
                "showRightFloatingContainer": true,
                "paneContent": [],
                "headItems": [],
                "actions": [],
                "floatingActions": [],
                "subHeader": [],
                "toolAreaItems": [],
                "RightFloatingContainerItems": [],
                "toolAreaVisible": false,
                "floatingContainerContent": [],
                "application" : {}
            },
            "blank-home": {
                "stateName": "blank-home",
                "showCurtain": false,
                "headerHiding": isMobile,
                "headerVisible": true,
                "headEndItems": [],
                "showCatalog": false,
                "showPane": false,
                "showRightFloatingContainer": true,
                "paneContent": [],
                "headItems": [],
                "actions": [],
                "floatingActions": [],
                "subHeader": [],
                "toolAreaItems": [],
                "RightFloatingContainerItems": [],
                "toolAreaVisible": false,
                "floatingContainerContent": [],
                "application" : {}
            },
            "home": {
                "stateName": "home",
                "showCurtain": false,
                "headerHiding": false,
                "headerVisible": true,
                "showCatalog": false,
                "showPane": false,
                "showRightFloatingContainer": true,
                "headItems": ['meAreaHeaderButton'],
                "headEndItems": ["sf"],
                "search": "",
                "paneContent": [],
                "actions": ["openCatalogBtn", "userSettingsBtn"],
                "floatingActions": [],
                "subHeader": [],
                "toolAreaItems": [],
                "RightFloatingContainerItems": [],
                "toolAreaVisible": false,
                "floatingContainerContent": [],
                "application" : {}
            },
            "app": {
                "stateName": "app",
                "showCurtain": false,
                "headerHiding": isMobile,
                "headerVisible": true,
                "headEndItems": ["sf"],
                "showCatalog": false,
                "showPane": false,
                "showRightFloatingContainer": true,
                "paneContent": [],
                "search": "",
                "headItems": ['meAreaHeaderButton', 'backBtn', 'homeBtn'],
                "actions": ["openCatalogBtn", "userSettingsBtn"],
                "floatingActions": [],
                "subHeader": [],
                "toolAreaItems": [],
                "RightFloatingContainerItems": [],
                "toolAreaVisible": false,
                "floatingContainerContent": [],
                "application" : {}
            },
            "minimal": {
                "stateName": "minimal",
                "showCurtain": false,
                "headerHiding": false,
                "headerVisible": true,
                "headEndItems": [],
                "showCatalog": false,
                "showPane": false,
                "showRightFloatingContainer": true,
                "paneContent": [],
                "headItems": ['meAreaHeaderButton', 'homeBtn'],
                "actions": ["openCatalogBtn", "userSettingsBtn"],
                "floatingActions": [],
                "subHeader": [],
                "toolAreaItems": [],
                "RightFloatingContainerItems": [],
                "toolAreaVisible": false,
                "floatingContainerContent": [],
                "application" : {}
            },
            "standalone": {
                "stateName": "standalone",
                "showCurtain": false,
                "headerHiding": isMobile,
                "headerVisible": true,
                "headEndItems": [],
                "showCatalog": false,
                "showPane": false,
                "showRightFloatingContainer": true,
                "paneContent": [],
                "headItems": ['meAreaHeaderButton', 'backBtn'],
                "actions": [],
                "floatingActions": [],
                "subHeader": [],
                "toolAreaItems": [],
                "RightFloatingContainerItems": [],
                "toolAreaVisible": false,
                "floatingContainerContent": [],
                "application" : {}
            },
            "embedded": {
                "stateName": "embedded",
                "showCurtain": false,
                "headerHiding": isMobile,
                "headerVisible": true,
                "headEndItems": [],
                "showCatalog": false,
                "showPane": false,
                "showRightFloatingContainer": true,
                "paneContent": [],
                "headItems": ['meAreaHeaderButton', 'backBtn', 'homeBtn'],
                "actions": [],
                "floatingActions": [],
                "subHeader": [],
                "toolAreaItems": [],
                "RightFloatingContainerItems": [],
                "toolAreaVisible": false,
                "floatingContainerContent": [],
                "application" : {}
            },
            "embedded-home": {
                "stateName": "embedded-home",
                "showCurtain": false,
                "headerHiding": isMobile,
                "headerVisible": true,
                "headEndItems": [],
                "showCatalog": false,
                "showPane": false,
                "showRightFloatingContainer": true,
                "paneContent": [],
                "headItems": ['meAreaHeaderButton'],
                "actions": [],
                "floatingActions": [],
                "subHeader": [],
                "toolAreaItems": [],
                "RightFloatingContainerItems": [],
                "toolAreaVisible": false,
                "floatingContainerContent": [],
                "application" : {}
            },
            "headerless": {
                "stateName": "headerless",
                "showCurtain": false,
                "headerHiding": isMobile,
                "headerVisible": false,
                "headEndItems": [],
                "showCatalog": false,
                "showPane": false,
                "showLogo": false,
                "showRightFloatingContainer": true,
                "paneContent": [],
                "headItems": ['backBtn', 'homeBtn'],
                "actions": [],
                "floatingActions": [],
                "subHeader": [],
                "toolAreaItems": [],
                "RightFloatingContainerItems": [],
                "toolAreaVisible": false,
                "floatingContainerContent": [],
                "application" : {}
            },
            "merged": {
                "stateName": "merged",
                "showCurtain": false,
                "headerHiding": isMobile,
                "headerVisible": true,
                "headEndItems": [],
                "showCatalog": false,
                "showPane": false,
                "showLogo": false,
                "showRightFloatingContainer": true,
                "paneContent": [],
                "headItems": ['backBtn', 'homeBtn'],
                "actions": [],
                "floatingActions": [],
                "subHeader": [],
                "toolAreaItems": [],
                "RightFloatingContainerItems": [],
                "toolAreaVisible": false,
                "floatingContainerContent": [],
                "application" : {}
            },
            "headerless-home": {
                "stateName": "headerless-home",
                "showCurtain": false,
                "headerHiding": isMobile,
                "headerVisible": false,
                "headEndItems": [],
                "showCatalog": false,
                "showPane": false,
                "showLogo": false,
                "showRightFloatingContainer": true,
                "paneContent": [],
                "headItems": [],
                "actions": [],
                "floatingActions": [],
                "subHeader": [],
                "toolAreaItems": [],
                "RightFloatingContainerItems": [],
                "toolAreaVisible": false,
                "floatingContainerContent": [],
                "application" : {}
            },
            "merged-home": {
                "stateName": "merged-home",
                "showCurtain": false,
                "headerHiding": isMobile,
                "headerVisible": true,
                "headEndItems": [],
                "showCatalog": false,
                "showPane": false,
                "showLogo": false,
                "showRightFloatingContainer": true,
                "paneContent": [],
                "headItems": [],
                "actions": [],
                "floatingActions": [],
                "subHeader": [],
                "toolAreaItems": [],
                "RightFloatingContainerItems": [],
                "toolAreaVisible": false,
                "floatingContainerContent": [],
                "application" : {}
            }
        },
        userPreferences: {
            entries: []
        },
    };

    function validateValueIsNotUndefined(aItems, value, sState) {
        return value != undefined;
    }
    function noValidation(aItems, value, sState) {
        return true;
    }

    function updateModelProperty(modelPropertyString, aValue, oCurrentModel) {
        oCurrentModel.setProperty(modelPropertyString, aValue);
    }

    function ShellModel() {
        var oModel;
        var oCustomShellStates;
        var oStateModelToUpdate;
        var oCustomShellStateModel;
        var oExtensionShellStates;
        var oManagedElements;
        var bInRenderState;
        var bInCheckpoint;
        var sExtendedShellStateName;
        var bInCreateTemplate;
        var aTriggersRegistered;
        var bEnableRegisterTriggers;

        this.createDefault = function () {
            //add trigger to rerender shell state when we have we add the first action item.
            var fnRerenderShellOnFirstAction = function (sSubject, ev, oData) {
                if (oData.sProperty == "actions") {
                    var aActions = oData.oModel.getProperty(oData.path);
                    if (aActions && aActions.length === 0 && oData.aIds && oData.aIds.length > 0) {
                        this._renderShellState();
                    }
                }
            }.bind(this);

            //trigger when user update shell state
            this.createTriggers( [{
                sName: 'onAddFirstAction',
                fnRegister: function () {
                    //fnRegister
                    sap.ui.getCore().getEventBus().subscribe("launchpad", "updateShell", fnRerenderShellOnFirstAction, this);

                },fnUnRegister: function () {
                    //fnUnRegister
                    sap.ui.getCore().getEventBus().unsubscribe("launchpad", "updateShell", fnRerenderShellOnFirstAction, this);

                }
            }], false, ["blank", "blank-home"]);

            //In state blank when no Action Items do not display MeArea.
            this.createInspection("actions", [{
                fnCondition: function(aItems, aIds, oThat) {
                    return (aItems && aItems.length > 0) || (aIds && aIds.length > 0);
                }, fnAction: function(aItems, aIds, oThat) {
                    if (aIds.indexOf("meAreaHeaderButton") === -1) {
                        oThat.addHeaderItem(["meAreaHeaderButton"], true);
                    }
                }
            }], false, ["blank-home", "blank"]);
        };

        this.init = function(oConfig){
            oModel = new sap.ui.model.json.JSONModel(oModelData);
            oStateModelToUpdate = oModel;
            oCustomShellStates = {};
            oExtensionShellStates = {};
            oManagedElements = {};
            bInRenderState = false;
            bInCheckpoint = false;
            bInCreateTemplate = false;
            aTriggersRegistered = [];
            bEnableRegisterTriggers = true;

            sExtendedShellStateName = undefined;
            if(oConfig){
                jQuery.sap.measure.start("FLP:ShellModel.init", "moveShellHeaderEndItems","FLP");
                if(oConfig.moveEditHomePageActionToShellHeader){
                    this._moveActionsToShellHeader("ActionModeBtn");
                }
                if(oConfig.moveContactSupportActionToShellHeader){
                    this._moveCustomeDataActionBtnToShellHeader("ContactSupportBtn");
                }
                if(oConfig.moveGiveFeedbackActionToShellHeader){
                    this._moveCustomeDataActionBtnToShellHeader("EndUserFeedbackBtn");
                }
                if(oConfig.moveAppFinderActionToShellHeader){
                    this._moveActionsToShellHeader("openCatalogBtn");
                }
                if(oConfig.moveUserSettingsActionToShellHeader){
                    this._moveActionsToShellHeader("userSettingsBtn");
                }
                jQuery.sap.measure.end("FLP:ShellModel.init");
            }
            this.createDefault();
            //initialze the models
            //TODO: make better initialization i.e. make sure that oCustomShellStateModel variable is initialized
            var initialState = oConfig && oConfig.appState ? oConfig.appState : "home";
            this.switchState(initialState);
        };

        this.destroy = function(){
            oModel = undefined;
            oStateModelToUpdate = undefined;
            oCustomShellStates = undefined;
            oExtensionShellStates = undefined;
            oManagedElements = undefined;
            bInRenderState = undefined;
            bInCheckpoint = undefined;
            bEnableRegisterTriggers = undefined;
            bInCreateTemplate = undefined;
            sExtendedShellStateName = undefined;
            sap.ui.getCore().getEventBus().unsubscribe("launchpad", "contentRendered", this._attachPressToUserSettings, this);
        };

        this.getModel = function(){
            return oModel;
        };
        //moves the given button from being an action button in me area to a shell end header item
        this._moveCustomeDataActionBtnToShellHeader = function(btnName){
            for(var key in oModelData.customStatesDelta){
                var oState = oModelData.customStatesDelta[key];
                var aActions = oState.actions;
                var index = aActions.indexOf(btnName);
                if(index != -1){
                    //remove the button from FLP Me Area
                    oModelData.customStatesDelta[key].actions.splice(index, 1);
                    //Add the button to the shell header if not yet exists in this state
                    index = oModelData.states[key].headEndItems.indexOf(btnName);
                    if(index === -1){
                        oModelData.states[key].headEndItems.push(btnName);
                    }
                }
            }
            //creating template buttons to take their text and icon and fire their press method when the shell end header item is pressed
            var oButton = sap.ui.getCore().byId(btnName);
            if(!oButton){
                var tempButton;
                if(btnName === "ContactSupportBtn"){
                    tempButton = new sap.ushell.ui.footerbar.ContactSupportButton("tempContactSupportBtn", {
                        visible: true
                    });
                }
                else{
                    if(btnName === "EndUserFeedbackBtn"){
                        tempButton = new sap.ushell.ui.footerbar.EndUserFeedback("EndUserFeedbackHandlerBtn", {
                        });
                    }
                }
                var icon = tempButton.getIcon();
                var text = tempButton.getText();
                var btnPress = function(){
                    tempButton.firePress();
                };

                var newBtn = new sap.ushell.ui.shell.ShellHeadItem(btnName,{
                    icon: icon,
                    tooltip: text,
                    text: text,
                    showSeparator: false
                });
                //contact support button is not attached the press method here as it has many configuration which are available only later in the flow, in _createActionButtons method of
                // shell.controller.js and there it will be attached
                if(btnName === "ContactSupportBtn"){
                    newBtn.attachPress(btnPress);
                }
                if(btnName === "EndUserFeedbackBtn"){
                    //give feedback button will be set to visible in case the adapter is implemented - done in shell.controller._createActionButtons
                    newBtn.setVisible(false);
                }
                newBtn.data("isShellHeader", true);
            }
        };

        this._attachPressToUserSettings = function(){
            jQuery.sap.measure.start("FLP:ShellModel._attachPressToUserSettings", "_attachPressToUserSettings","FLP");
            var btn = sap.ui.getCore().byId("userSettingsBtn");
            btn.attachPress(function(){
                var meArea = sap.ui.getCore().byId('meArea');
                if (!meArea.oSettingsDialog.getModel()) {
                    meArea.oSettingsDialog.setModel(meArea.getModel());
                }
                var fnOpenDialogAfterSwitchAnimation = function () {
                    meArea.oSettingsDialog.open();
                    sap.ui.getCore().byId("viewPortContainer").detachAfterSwitchStateAnimationFinished(fnOpenDialogAfterSwitchAnimation);
                };
                var view = sap.ui.getCore().byId('viewPortContainer');
                if(view.getCurrentState() !=  "Center"){
                    sap.ui.getCore().byId("viewPortContainer").attachAfterSwitchStateAnimationFinished(fnOpenDialogAfterSwitchAnimation);
                    sap.ui.getCore().byId("viewPortContainer").switchState("Center");
                }
                else{
                    fnOpenDialogAfterSwitchAnimation();
                }
            });
            jQuery.sap.measure.end("FLP:ShellModel._attachPressToUserSettings");
        };

        this._moveActionsToShellHeader = function(btnName){
            var key;
            for(key in oModelData.states){
                var oState = oModelData.states[key];
                if(key === "blank" || key === "blank-home"){
                    continue;
                }
                if(btnName === "ActionModeBtn"){
                    if(key === "app"){
                        continue;
                    }
                }
                var aActions = oState.actions;
                var index = aActions.indexOf(btnName);
                if(index != -1) {
                    //remove the button from FLP Me Area
                    oModelData.states[key].actions.splice(index, 1);
                }
                //Add the button to the shell header if not yet exists in this state
                index = oModelData.states[key].headEndItems.indexOf(btnName);
                if(index === -1){
                    oModelData.states[key].headEndItems.push(btnName);
                }

            }

            //attaching press method only after the content is renderered - same logic as when creaing this button as an action button in me area
            //referance: _addPressHandlerToActions method in meArea.controller.js
            if(btnName === "userSettingsBtn"){
                var id = "userSettingsBtn";
                var text = sap.ushell.resources.i18n.getText("userSettings");
                var icon = 'sap-icon://action-settings';
                var oUserPrefButton = sap.ui.getCore().byId(id);
                sap.ui.getCore().getEventBus().subscribe("launchpad", "contentRendered", this._attachPressToUserSettings, this);
                if(! oUserPrefButton){
                    var newBtn = new sap.ushell.ui.shell.ShellHeadItem(id,{
                        icon: icon,
                        tooltip: text,
                        text: text,
                        showSeparator: false
                    });
                    newBtn.data("isShellHeader", true);
                }
            }
        };

        this.switchState = function (sState, bSaveLastState) {
            var sPath = sState[0] === "/" ? sState : "/states/" + sState,
                oState = oModel.getProperty(sPath),
                oCurrentState = oModel.getProperty("/currentState") || {},
                excludeStatesInGC = ["home", "embedded-home", "headerless-home", "merged-home", "blank-home"];

            if (!!bSaveLastState) {
                oModel.setProperty("/lastState", oCurrentState);
            }

            this._destroyManageQueue(excludeStatesInGC);

            // Change "currentState" property in the model to the new state
            oModel.setProperty("/currentState", jQuery.extend(true, {}, {}, oState));

            //create custom shell state.
            if (!oExtensionShellStates[sState]) {
                oExtensionShellStates[sState] = {
                    extendedShellStates: {},
                    oCheckPoints: {},
                    aTriggers: [],
                    customShellState: this._createCustomShellState(sState)
                };
            }

            //change current state according to the sState.
            oCustomShellStateModel = oExtensionShellStates[sState].customShellState;
            sExtendedShellStateName = undefined;
            this._renderShellState();
            return oState;
        };

        this.setLeftPaneVisibility = function (bVisible, bCurrentState, aStates){
            this.updateStateProperty("showPane", bVisible, bCurrentState, aStates);
        };

        this.setHeaderHiding = function (bHiding) {
            this.updateStateProperty("headerHiding", bHiding, true);
        };

        this.setHeaderVisibility = function(bVisible, bCurrentState, aStates){
            this.updateStateProperty("headerVisible", bVisible, bCurrentState, aStates);
        };

        this.showLogo = function(bCurrentState, aStates){
            this.updateStateProperty("showLogo", true, bCurrentState, aStates, false);
        };


        this.addHeaderItem = function (aIds, bCurrentState, aStates) {
            this._addHeaderItemInCorrectOrder("headItems", aIds, bCurrentState, aStates);
        };

        this._removeReservedItemId = function (sResrevedItemId, aExistingItemIds, aItemIdsToAdd) {
            var bAddToCopiedItems = false,
                iResrevedItemId = aItemIdsToAdd.indexOf(sResrevedItemId);

            if (iResrevedItemId > -1) {
                aItemIdsToAdd.splice(iResrevedItemId, 1);
                bAddToCopiedItems = true;
            }
            iResrevedItemId = aExistingItemIds.indexOf(sResrevedItemId);
            if (iResrevedItemId > -1) {
                aExistingItemIds.splice(iResrevedItemId, 1);
                bAddToCopiedItems = true;
            }

            return bAddToCopiedItems;
        };

        this._addHeaderItemInCorrectOrder = function (sPropertyString, aId, bCurrentState, aStates) {
            var that = this;

            function fnValidation(aExsistingIds, aIdsToAdd, sState) {
                var iAllowedAdditionalItems = 3 - aExsistingIds.length;

                aIdsToAdd.forEach(function (sItemId, iIndex) {
                    var bIsReservedItem = (sItemId === 'meAreaHeaderButton' || sItemId === 'backBtn' || sItemId === 'homeBtn');

                    if (aExsistingIds[sItemId] === -1 && !bIsReservedItem) {
                        iAllowedAdditionalItems--;
                    }
                });

                if (iAllowedAdditionalItems < 0) {
                    jQuery.sap.log.warning("Maximum of three items has been reached, cannot add more items.");
                    return false;
                }

                return true;
            }

            function fnUpdate(modelPropertyString, aIdsToAdd, oCurrentModel) {
                jQuery.sap.measure.start("FLP:ShellModel.fnUpdate", "update shell head end items","FLP");
                var aCurrentlyExsistingItems = oCurrentModel.getProperty(modelPropertyString),
                    aCopiedItems = [],
                    aClonedIdsToAdd = aIdsToAdd.slice(0);//Clone the array

                // Check if meAreaHeaderButton is part of aCurrentlyExsistingItems or aIdsToAdd. If so, place it in the beginning.
                if (that._removeReservedItemId("meAreaHeaderButton", aCurrentlyExsistingItems, aClonedIdsToAdd) === true) {
                    aCopiedItems.push("meAreaHeaderButton");
                }

                // Check if backBtn is part of aCurrentlyExsistingItems or aIdsToAdd. If so, place it next.
                if (that._removeReservedItemId("backBtn", aCurrentlyExsistingItems, aClonedIdsToAdd) === true) {
                    aCopiedItems.push("backBtn");
                }

                // Check if backBtn is part of homeBtn or aIdsToAdd. If so, place it next.
                if (that._removeReservedItemId("homeBtn", aCurrentlyExsistingItems, aClonedIdsToAdd) === true) {
                    aCopiedItems.push("homeBtn");
                }

                // other items should come after.
                aCurrentlyExsistingItems.some(function (sExsistingItemId) {
                    if (aCopiedItems.length < 3) {
                        aCopiedItems.push(sExsistingItemId);
                    } else {
                        return true;
                    }
                });
                aClonedIdsToAdd.some(function (sIdToAdd) {
                    if (aCopiedItems.length < 3) {
                        aCopiedItems.push(sIdToAdd);
                    } else {
                        return true;
                    }
                });
                oCurrentModel.setProperty(modelPropertyString, aCopiedItems);
                jQuery.sap.measure.end("FLP:ShellModel.fnUpdate");
            }
            this._setShellItem(sPropertyString, aId, bCurrentState, aStates, fnValidation, fnUpdate);
        };

        this.removeHeaderItem = function (aIds, bCurrentState, aStates) {
            this._removeShellItem("headItems", aIds, bCurrentState, aStates);
        };

        this.addHeaderEndItem = function (aIds, bCurrentState, aStates, bDoNotPropagate) {
            if (aIds.length) {
                this._addUpToSixItem("headEndItems", aIds, bCurrentState, aStates, bDoNotPropagate);
            }
        };

        this.removeHeaderEndItem = function (aIds, bCurrentState, aStates) {
            this._removeShellItem("headEndItems", aIds, bCurrentState, aStates);
        };

        this.addSubHeader = function (aIds, bCurrentState, aStates) {
            if (aIds.length) {
                this._addShellItem("subHeader", aIds, bCurrentState, aStates);
            }
        };

        this.removeSubHeader = function (aIds, bCurrentState, aStates) {
            this._removeShellItem("subHeader", aIds, bCurrentState, aStates);
        };

        this.addActionButton = function (aIds, bCurrentState, aStates, bIsFirst) {
            if (bIsFirst) {
                this._addActionButtonAtStart("actions", aIds, bCurrentState, aStates);
            } else {
                this._addActionButton("actions", aIds, bCurrentState, aStates);
            }
        };

        this.removeActionButton = function (aIds, bCurrentState, aStates) {
            this._removeShellItem("actions", aIds, bCurrentState, aStates);
        };

        this.addToolAreaItem = function (sId, bCurrentState, aStates) {
            if (sId.length) {
                this._addToolAreaItem("toolAreaItems", sId, bCurrentState, aStates);
            }
        };

        this.removeToolAreaItem = function (aIds, bCurrentState, aStates) {
            this._removeShellItem("toolAreaItems", aIds, bCurrentState, aStates);
        };

        this.addLeftPaneContent = function (aIds, bCurrentState, aStates) {
            if (aIds.length) {
                this._addShellItem("paneContent", aIds, bCurrentState, aStates);
            }
        };

        this.removeLeftPaneContent = function (aIds, bCurrentState, aStates) {
            this._removeShellItem("paneContent", aIds, bCurrentState, aStates);
        };

        this.addRightFloatingContainerItem = function (sId, bCurrentState, aStates) {
            if (sId.length) {
                this._addRightFloatingContainerItem("RightFloatingContainerItems", sId, bCurrentState, aStates);
            }
        };

        this.removeRightFloatingContainerItem = function (aIds, bCurrentState, aStates) {
            this._removeShellItem("RightFloatingContainerItems", aIds, bCurrentState, aStates);
        };

        this.showSettingsButton = function (bCurrentState, aStates) {
            this.addActionButton(["userSettingsBtn"], bCurrentState, aStates, false);
        };

        this.showSignOutButton = function (bCurrentState, aStates) {
            this.addActionButton(["logoutBtn"], bCurrentState, aStates, false);
        };

        this.showRightFloatingContainer = function (bShow) {
            this._showRightFloatingContainer(bShow);
        };

        this.addFloatingActionButton = function (aIds, bCurrentState, aStates) {
            //TODO: Check how to fix the redundant rerendering upon back navigation (caused due to the floatingAction button).
            //Check for itamars commit.
            if (aIds.length) {
                this._addShellItem("floatingActions", aIds, bCurrentState, aStates);
            }
        };

        this.removeFloatingActionButton = function (aIds, bCurrentState, aStates) {
            this._removeShellItem("floatingActions", aIds, bCurrentState, aStates);
        };

        this.updateStateProperty = function(sPropertyString, aValue, bCurrentState, aStates, bDoNotPropagate) {
            this._setShellItem(sPropertyString, aValue, bCurrentState, aStates, validateValueIsNotUndefined, updateModelProperty, bDoNotPropagate);
        };

        this._handleTriggers = function (oNeededTriggers) {
            var oTriggerToRemove,
                oTriggerToRegister,
                aNewTriggerList = [],
                oAlreayRegisteredMap = {};

            //prevent registration that invokes fnTrigger.
            bEnableRegisterTriggers = false;

            //remove triggers that we are not going to use.
            while (aTriggersRegistered.length > 0) {
                oTriggerToRemove = aTriggersRegistered.pop();
                //check if we still need it.
                if (oNeededTriggers[oTriggerToRemove.sName]) {
                    //just add it the list of triggers.
                    aNewTriggerList.push(oTriggerToRemove);
                    oAlreayRegisteredMap[oTriggerToRemove.sName] = oTriggerToRemove;
                } else {
                    //if not needed anymore unregister it.
                    oTriggerToRemove.fnUnRegister(this);
                }
            }

            //add the triggers that are not created yet.
            for (var sTriggerName in oNeededTriggers) {
                if (oNeededTriggers.hasOwnProperty(sTriggerName)) {
                    if (!oAlreayRegisteredMap[sTriggerName]) {
                        oTriggerToRegister = oNeededTriggers[sTriggerName];
                        oTriggerToRegister.fnRegister(this);
                        aNewTriggerList.push(oTriggerToRegister);
                    }
                }
            }

            //update the current triggered list.
            aTriggersRegistered = aNewTriggerList;

            bEnableRegisterTriggers = true;
        };


        this._registerTriggers = function (aTriggers) {
            var i;

            //Prevent cyclic trigger registration.
            bEnableRegisterTriggers = false;

            for (i = 0; i < aTriggers.length; i++) {
                aTriggers[i].fnRegister(this);
                aTriggersRegistered.push(aTriggers[i]);
            }

            bEnableRegisterTriggers = true;
        };

        this.createTriggers = function(aTriggers, bCurrentState, aStates) {
            var aNewTriggers = [];

            var fnUpdateTriggerModel = function (aTriggers, oModelState) {
                var index;

                if (!oModelState.aTriggers) {
                    oModelState.aTriggers = [];
                }

                for (index = 0; index < aTriggers.length; index++) {
                    var oTrigger = {
                        sName: aTriggers[index].sName,
                        fnRegister: aTriggers[index].fnRegister,
                        fnUnRegister: aTriggers[index].fnUnRegister
                    };
                    aNewTriggers.push(oTrigger);
                    oModelState.aTriggers.push(oTrigger);
                }

            };

            if (bCurrentState === true) {
                var oCurrentState = oStateModelToUpdate.getProperty("/currentState/");

                fnUpdateTriggerModel(aTriggers, oCurrentState);

                if (!bInRenderState) {
                    this._registerTriggers(aNewTriggers);
                }
            } else {
                var i,
                    oCurrentStateName = oStateModelToUpdate.getProperty('/currentState/stateName');

                for (i = 0; i < aStates.length; i++) {
                    var sState = aStates[i],
                        sPath = "/states/" + sState,
                        oShellBaseState = oModel.getProperty(sPath);

                    aNewTriggers = [];

                    fnUpdateTriggerModel(aTriggers, oShellBaseState);

                    if (oCurrentStateName === sState) {
                        //It was added to the base shell state so after we add it to the base recalculate the shell state.
                        if (!bInRenderState) {
                            this._registerTriggers(aNewTriggers);
                        }
                    }
                }
            }
        };

        this.createInspection = function(sAttibute, aCheckPoint, bCurrentState, aStates) {
            var fnInspectionUpdate = function (oModel, sAttibute, aCheckPoint) {
                var oCurrentCheckPointModel,
                    index;

                if (!oModel.oCheckPoints) {
                    oModel.oCheckPoints = [];
                }
                if (!oModel.oCheckPoints[sAttibute]) {
                    oModel.oCheckPoints[sAttibute] = [];
                }

                oCurrentCheckPointModel = oModel.oCheckPoints[sAttibute];

                for (index = 0; index < aCheckPoint.length; index++) {
                    oCheckPoint = aCheckPoint[index]
                    oCurrentCheckPointModel.push({
                        fnCondition: oCheckPoint.fnCondition,
                        fnCheckPoint: oCheckPoint.fnAction
                    });
                }
            };

            if (bCurrentState === true) {
                var oCheckPoint,
                    oStateModelToUpdateState = oStateModelToUpdate.getProperty("/currentState");

                fnInspectionUpdate(oStateModelToUpdateState, sAttibute, aCheckPoint);

                //also update the oCustomShellStateModel
                if (!bInCreateTemplate && !bInRenderState) {
                    //Update the custom state only if you are called from custom api.
                    fnInspectionUpdate(oCustomShellStateModel.getProperty("/currentState"), sAttibute, aCheckPoint);
                }
                this._renderShellState();
            } else {
                var i,
                    oCurrentStateName = oStateModelToUpdate.getProperty('/currentState/stateName');

                for (i = 0; i < aStates.length; i++) {
                    var sState = aStates[i],
                        sPath = "/states/" + sState,
                        oShellBaseState = oModel.getProperty(sPath);

                    fnInspectionUpdate(oShellBaseState, sAttibute, aCheckPoint);

                    if (oCurrentStateName === sState) {
                        //It was added to the base shell state so after we add it to the base recalculate the shell state.
                        if (!bInRenderState) {
                            this._renderShellState();
                        }
                    }
                }
            }
        };

        this.showShellItem = function (sProperty, sState, bVisible) {
            var sModelStateProperty,
                oState,
                aStates = this._getModelStates(sState),
                aModelStates = this.getModel().getData().states,
                sModelCurrentStateProperty = "/currentState" + sProperty;
            for (var i = 0; i < aStates.length; i++) {
                oState = aModelStates[aStates[i]];
                sModelStateProperty = "/states/" + oState.stateName + sProperty;
                oStateModelToUpdate.setProperty(sModelStateProperty, bVisible);
            }
            if (oStateModelToUpdate.getProperty("/currentState/stateName") === sState) {
                oStateModelToUpdate.setProperty(sModelCurrentStateProperty, bVisible);
            }
        };

        this.addCustomItems = function (sStateEntry, aIds, bCurrentState, aStates) {
            if (this._isValidStateEntry(sStateEntry)) {
                this._isValidStateEntry(sStateEntry).fnAdd(aIds, bCurrentState, aStates);
            } else {
                throw new Error("Invalid state entry:" + sStateEntry);
            }
        };

        this.removeCustomItems = function (sStateEntry, aIds, bCurrentState, aStates) {
            if (this._isValidStateEntry(sStateEntry)) {
                this._isValidStateEntry(sStateEntry).fnRemove(aIds, bCurrentState, aStates);
            } else {
                throw new Error("Invalid state entry:" + sStateEntry);
            }
        };

        this.createExtendedShellState = function (sShellName, fnCreationInstructions) {
            var sBaseStateName = oModel.getProperty("/currentState/stateName"),
                oBaseExtensionShellStates,
                oCustomStates = this._createCustomShellState(sShellName);

            if (!oExtensionShellStates[sBaseStateName]) {
                oExtensionShellStates[sBaseStateName] = {
                    extendedShellStates: {},
                    oCheckPoints: {},
                    aTriggers: [],
                    customShellState: this._createCustomShellState("custom")
                };
            }

            oBaseExtensionShellStates = oExtensionShellStates[sBaseStateName].extendedShellStates;

            //validate that extension shell state does not already exists.
            if (oBaseExtensionShellStates[sShellName]) {
                return false;
            }

            //change to shadow shell.
            oStateModelToUpdate = oCustomStates;
            bInCreateTemplate = true;
            fnCreationInstructions();
            //store shell state
            if (oBaseExtensionShellStates[sShellName]) {
                oBaseExtensionShellStates[sShellName].customState = oCustomStates;
            } else {
                oBaseExtensionShellStates[sShellName] = {
                    managedObjects: [],
                    customState: oCustomStates
                };
            }

            oStateModelToUpdate = oModel;
            bInCreateTemplate = false;

            return true;
        };

        this.applyExtendedShellState = function (sShellName) {
            sExtendedShellStateName = sShellName;
            this._renderShellState();
        };

        this.addEntryInShellStates = function (sEntry, entrySuffix, fnAdd, fnRemove, oStatesConfiguration) {
            var index,
                sStateName;

            if (!oCustomShellStates[sEntry]) {
                oCustomShellStates[sEntry] = {
                    fnAdd: fnAdd,
                    fnHide: fnRemove
                };

                //add new entry to the model
                var aStates = this._getStatesList();

                for (index = 0; index < aStates.length; index++) {
                    sStateName = aStates[index];
                    oModel.setProperty("/states/" + sStateName + "/" + sEntry, oStatesConfiguration[sStateName]);
                }

                //create the hook functions
                this["remove" + entrySuffix] = fnRemove;
                this["add" + entrySuffix] = fnAdd;
            } else {
                throw new Error("State entry already exsists:" + sEntry);
            }
        };

        this.addElementToManagedQueue = function (oItem) {
            //update extenstionShell
            //get the current model ref
            var sStateName = oStateModelToUpdate.getProperty("/currentState/stateName"),
                sBaseStateName = oModel.getProperty("/currentState/stateName"),
                oBaseExtensionShellStates,
                sItemId = oItem.getId();


            if (!oExtensionShellStates[sBaseStateName]) {
                oExtensionShellStates[sBaseStateName] = {
                    extendedShellStates: {},
                    oCheckPoints: {},
                    aTriggers: [],
                    customShellState: this._createCustomShellState("custom")
                };
            }

            oBaseExtensionShellStates = oExtensionShellStates[sBaseStateName].extendedShellStates;

            if (!oBaseExtensionShellStates[sStateName]) {
                oBaseExtensionShellStates[sStateName] = {
                    managedObjects: [],
                    customState: undefined
                };
            }

            oBaseExtensionShellStates[sStateName].managedObjects.push(sItemId);
            //Update oManagedElements
            var oManagedElement = oManagedElements[sItemId];

            if (oManagedElement) {
                oManagedElement.nRefCount++;
            } else {
                oManagedElement = {
                    oItem: oItem,
                    nRefCount: 1
                };
                oManagedElements[sItemId] = oManagedElement;
            }
        };

        this.updateNeededTriggersMap = function(oStorage, aTriggers) {
            var index;

            if (!aTriggers) {
                return;
            }
            for (index = 0; index < aTriggers.length; index++) {
                oStorage[aTriggers[index].sName] = aTriggers[index];
            }
        };

        this._renderShellState = function () {
            var sBaseStateName = oModel.getProperty("/currentState/stateName"),
                sPath = sBaseStateName[0] === "/" ? sBaseStateName : "/states/" + sBaseStateName,
                oExtendedShell, oExtendedState,
                oShellBaseState = jQuery.extend(true, {}, {}, oModel.getProperty(sPath)),
                oExtendedShellStateBase = oExtensionShellStates[sBaseStateName],
                oCustomState,
                oNeededTriggers = {};

            //Can be undefined, see test "test Shell back button on RTL", validates that when creating the "fiori2" renderer and setting the base states,
            //invokes this "_renderShellState" function, without oExtendedShellStateBase, hence the custom is not defined and no need to merge it with the custom.
            if (oExtendedShellStateBase) {
                oCustomState = oExtendedShellStateBase.customShellState.getProperty("/currentState");
            }

            // Change "currentState" property in the model to the new base state
            var oBaseStateClone = new sap.ui.model.json.JSONModel({
                "currentState": jQuery.extend(true, {}, {}, oShellBaseState)
            });

            oStateModelToUpdate = oBaseStateClone;
            bInRenderState = true;

            //merge the Extended Shell, if it has one.
            if (sExtendedShellStateName) {
                if (oExtendedShellStateBase.extendedShellStates[sExtendedShellStateName]){
                    oExtendedShell = oExtendedShellStateBase.extendedShellStates[sExtendedShellStateName].customState;
                    oExtendedState = oExtendedShell.getProperty("/currentState");
                    this._addCustomShellStates(oExtendedState);
                }
            }
            //merge the custom
            if (oCustomState) {
                this._addCustomShellStates(oCustomState);
            }

            oStateModelToUpdate = oModel;

            //list all triggers needed for this shell state..
            if (oShellBaseState && oShellBaseState.aTriggers) {
                this.updateNeededTriggersMap(oNeededTriggers, oShellBaseState.aTriggers);
            }
            if (oExtendedState && oExtendedState.aTriggers) {
                this.updateNeededTriggersMap(oNeededTriggers, oExtendedState.aTriggers);
            }
            if (oCustomState && oCustomState.aTriggers) {
                this.updateNeededTriggersMap(oNeededTriggers, oCustomState.aTriggers);
            }

            //clear all unused registered triggers.
            if (bEnableRegisterTriggers) {
                this._handleTriggers(oNeededTriggers);
            }

            //set to current state.
            oModel.setProperty("/currentState", oBaseStateClone.getProperty("/currentState"));
            bInRenderState = false;
            oBaseStateClone.destroy();
        };

        this._addCustomShellStates = function (oTemplateStateJSON) {
            this.addHeaderItem(oTemplateStateJSON.headItems, true);
            this.addToolAreaItem(oTemplateStateJSON.toolAreaItems, true);
            this.addHeaderEndItem(oTemplateStateJSON.headEndItems, true);
            this.addSubHeader(oTemplateStateJSON.subHeader, true);
            this.addRightFloatingContainerItem(oTemplateStateJSON.RightFloatingContainerItems, true);
            this.addActionButton(oTemplateStateJSON.actions, true, undefined, false);
            this.addLeftPaneContent(oTemplateStateJSON.paneContent, true);
            this.addFloatingActionButton(oTemplateStateJSON.floatingActions, true);
            this._setCurrentApplicationInformation(oTemplateStateJSON.application);
            this.showRightFloatingContainer(oTemplateStateJSON.showRightFloatingContainer);
            this.setHeaderHiding(oTemplateStateJSON.headerHiding);
            this.setHeaderVisibility(oTemplateStateJSON.headerVisible, true);
            if (oTemplateStateJSON.showLogo) {
                this.showLogo(true);
            }

        };

        this._createCustomShellState = function (sShellName) {
            var oCustomState = {
                "currentState": {
                    "stateName": sShellName,
                    "headEndItems" : [],
                    "paneContent" : [],
                    "headItems" : [],
                    "actions" : [],
                    "floatingActions" : [],
                    "subHeader" : [],
                    "toolAreaItems" : [],
                    "RightFloatingContainerItems": [],
                    "application": {},
                    "showRightFloatingContainer": undefined,
                    "headerHeading": undefined
                }
            };
            var oStates = oModel.getProperty("/customStatesDelta"),
                shellCustomState = oStates[sShellName];
            if (shellCustomState) {
                jQuery.extend(oCustomState.currentState, shellCustomState);
            }

            return new sap.ui.model.json.JSONModel(oCustomState);
        };

        this._setCurrentApplicationInformation = function(oAppInformation) {
            if (!oAppInformation) {
                oAppInformation = {};
            }
            this.updateStateProperty("application", oAppInformation, true);
        };

        /*-----------------------------Handlers----------------------------------------------------------------*/
        this._showRightFloatingContainer = function (bShow) {
            this._setShellItem("showRightFloatingContainer", bShow, true, [], validateValueIsNotUndefined, updateModelProperty);
        };

        this._addActionButtonAtStart = function (sPropertyString, aId, bCurrentState, aStates) {
            function fnUpdate(modelPropertyString, aIds, oCurrentModel) {
                var aActions = oCurrentModel.getProperty(modelPropertyString),
                    aActionButtons = [],
                    iOpenCatalogBtn = aIds.indexOf("openCatalogBtn");

                //if openCatalogBtn in aIds set position first.
                if (iOpenCatalogBtn > -1) {
                    aIds.splice(iOpenCatalogBtn, 1);
                    aActionButtons.push("openCatalogBtn");

                } else {
                    //if openCatalogBtn is in mode it must be first
                    if (aActions[0] === "openCatalogBtn") {
                        //make it to the first element
                        aActions.splice(0, 1);
                        aActionButtons.push("openCatalogBtn");
                    }
                }

                aActionButtons = aActionButtons.concat(aIds).concat(aActions);

                oCurrentModel.setProperty(modelPropertyString, aActionButtons);
            }
            this._setShellItem(sPropertyString, aId, bCurrentState, aStates, noValidation, fnUpdate);
        };

        this._addActionButton = function (sPropertyString, aId, bCurrentState, aStates) {
            function fnUpdate(modelPropertyString, aIds, oCurrentModel) {
                var aActions = oCurrentModel.getProperty(modelPropertyString);

                var iLogoutButtonIndex = aActions.indexOf("logoutBtn");
                if (iLogoutButtonIndex > -1) {
                    aActions.splice.apply(aActions, [iLogoutButtonIndex, 0].concat(aIds));
                } else {
                    aActions = aActions.concat(aIds);
                }

                var iOpenCatalogBtn = aActions.indexOf("openCatalogBtn"),
                    aActionButtons = [];

                if (iOpenCatalogBtn > -1) {
                    aActions.splice(iOpenCatalogBtn, 1);
                    aActionButtons.push("openCatalogBtn");
                    aActionButtons = aActionButtons.concat(aActions);
                } else {
                    aActionButtons = aActions;
                }

                oCurrentModel.setProperty(modelPropertyString, aActionButtons);
            }
            this._setShellItem(sPropertyString, aId, bCurrentState, aStates, noValidation, fnUpdate);
          };

        //TODO check whu we need the prop string as parameter
        this.setFloatingContainerContent = function (sPropertyString, aIds, bCurrentState, aStates) {
            function fnValidation(aItems, aIds, sState) {
                return aIds.length === 1;//aItems.length === 1;
            }
            function fnUpdate(modelPropertyString, aIds, oCurrentModel) {
                oCurrentModel.setProperty(modelPropertyString, aIds);
            }
            this._setShellItem(sPropertyString, aIds, bCurrentState, aStates, fnValidation, fnUpdate);
        };

        this._addUpToSixItem = function (sPropertyString, aId, bCurrentState, aStates, bDoNotPropagate) {
            function fnValidation(aItems, aIds, sState) {
                var allocatedItemSpace = 0,
                    index,
                    sId;
                //we always allow to create the overflow button
                if (aIds.length === 1 && aIds[0] === "endItemsOverflowBtn"){
                    return true;
                }
                for (index = 0; index < aItems.length; index++) {
                    sId = aItems[index];
                    if (sId !== "endItemsOverflowBtn"){
                        //increment the counter but not consider the overflow button
                        allocatedItemSpace++;
                    }

                    if (allocatedItemSpace + aIds.length > 6) {
                        jQuery.sap.log.warning("maximum of six items has reached, cannot add more items.");
                        return false;
                    }
                    if (aIds.indexOf(sId) > -1) {
                        return false;
                    }
                }

                return true;
            }
            function fnUpdate(modelPropertyString, aIds, oCurrentModel) {
                var aItems = oCurrentModel.getProperty(modelPropertyString),
                    aCopyItems = aItems.slice(0);
                //in order to always keep the same order of buttons in the shell header, we will sort them by their Id's
                aCopyItems = aCopyItems.sort();
                //the search button must remain in the first position, so moving it to the front.
                var sfIndex = aCopyItems.indexOf("sf");
                if(sfIndex != -1){
                    aCopyItems.splice(sfIndex, 1);
                    aCopyItems.splice(0, 0, "sf");
                }
                aCopyItems = aCopyItems.concat(aIds);
                var notificationIndex = aCopyItems.indexOf("NotificationsCountButton");
                if(notificationIndex != -1){
                    aCopyItems.splice(notificationIndex, 1);
                    aCopyItems.splice(aCopyItems.length, 0, "NotificationsCountButton");
                }
                var coPilotIndex = aCopyItems.indexOf("copilotBtn");
                if( coPilotIndex!= -1 ) {
                    aCopyItems.splice(coPilotIndex,1);
                    if (aCopyItems.indexOf("sf") != -1) {
                        //put co-pilot next to "sf" if exists, else, make it the first in the header
                        aCopyItems.splice( 1, 0, "copilotBtn" );
                    }
                    else {
                        aCopyItems.splice( 0, 0, "copilotBtn" );
                    }
                }

                oCurrentModel.setProperty(modelPropertyString, aCopyItems);
            }
            this._setShellItem(sPropertyString, aId, bCurrentState, aStates, fnValidation, fnUpdate, bDoNotPropagate);
        };

        this._addShellItem = function (sPropertyString, aId, bCurrentState, aStates) {
            function fnValidation(aItems, aId, sState) {
                if (aItems.length > 0) {
                    jQuery.sap.log.warning("You can only add one item. Replacing existing item: " + aItems[0] + " in state: " + sState + ", with the new item: " + aId[0] + ".");
                }
                return true;
            }
            function fnUpdate(modelPropertyString, aIds, oCurrentModel) {
                oCurrentModel.setProperty(modelPropertyString, aId.slice(0));
            }
            this._setShellItem(sPropertyString, aId, bCurrentState, aStates, fnValidation, fnUpdate);
        };

        this._addRightFloatingContainerItem = function (sPropertyString, sId, bCurrentState, aStates) {
            function fnUpdate(modelPropertyString, aId, oCurrentModel) {
                var aItems = oCurrentModel.getProperty(modelPropertyString);
                aItems = aItems.concat(aId);

                oCurrentModel.setProperty(modelPropertyString, aItems);
            }

            this._setShellItem(sPropertyString, sId, bCurrentState, aStates, noValidation, fnUpdate);
        };

        this._addToolAreaItem = function (sPropertyString, sId, bCurrentState, aStates) {
            function fnUpdate(modelPropertyString, sId, oCurrentModel) {
                var aItems = oCurrentModel.getProperty(modelPropertyString);
                aItems.push(sId);

                oCurrentModel.setProperty(modelPropertyString, aItems);
            }

            var index,
                aPassStates = this._getPassStates(aStates);

            for (index = 0; index < aPassStates.length; index++) {
                this.showShellItem("/toolAreaVisible", aPassStates[index], true);
            }

            this._setShellItem(sPropertyString, sId, bCurrentState, aStates, noValidation, fnUpdate);
        };

        this._removeShellItem = function (sPropertyString, sId, bCurrentState, aStates) {
            function fnValidation(aItems, aIds) {
                var location,
                    sId,
                    index;

                for (index = 0; index < aIds.length; index++) {
                    sId = aIds[index];
                    location = aItems.indexOf(sId);
                    if (location < 0) {
                        jQuery.sap.log.warning("You cannot remove Item: " + sId + ", the headItem does not exists.");
                        return false;
                    }
                }

                return true;
            }
            function fnUpdate(modelPropertyString, aIds, oCurrentModel) {
                var aItems = oCurrentModel.getProperty(modelPropertyString),
                    location,
                    sId,
                    index;

                for (index = 0; index < aIds.length; index++) {
                    sId = aIds[index];
                    location = aItems.indexOf(sId);
                    if (location > -1) {
                        aItems.splice(location, 1);
                    }
                }
                oCurrentModel.setProperty(modelPropertyString, aItems);
            }
            this._setShellItem(sPropertyString, sId, bCurrentState, aStates, fnValidation, fnUpdate);
        };

        this._commitCheckPoints = function (aCheckPoints, aItems, aIds) {
            var index;

            for (index = 0; index < aCheckPoints.length; index++) {
                if (aCheckPoints[index].fnCondition(aItems, aIds, this)) {
                    aCheckPoints[index].fnCheckPoint(aItems, aIds, this);
                }
            }
        };

        this._setShellItem = function (sPropertyString, aOrgIds, bCurrentState, aStates, fnValidation, fnUpdate, bDoNotPropagate) {
            var modelPropertyString,
                aItems;

            //clone the ids, to protect the model.
            var aIds = Array.isArray(aOrgIds) ? aOrgIds.slice(0) : aOrgIds;
            if (bCurrentState === true) {
                modelPropertyString = "/currentState/" + sPropertyString;
                aItems = oStateModelToUpdate.getProperty(modelPropertyString);

                //make validations
                if (fnValidation(aItems, aIds, "currentState") === false) {
                    return;
                }

                if (bInRenderState && !bInCheckpoint) {
                    var sBaseStateName = oModel.getProperty("/currentState/stateName"),
                        sPath = "/states/" + sBaseStateName,
                        oShellBaseState = oModel.getProperty(sPath),
                        oStateData = oExtensionShellStates[sBaseStateName];

                    //prevent inner checkpoints to be perform.
                    bInCheckpoint = true;

                    //take the checkpoints from the state model.
                    if (oShellBaseState.oCheckPoints) {
                        var oShellAttributeCheckPoints = oShellBaseState.oCheckPoints[sPropertyString];
                        if (oShellAttributeCheckPoints && oShellAttributeCheckPoints.length) {
                            this._commitCheckPoints(oShellAttributeCheckPoints, aItems, aIds);
                        }
                    }

                    //take the template checkpoints (from template model).
                    if (sExtendedShellStateName) {
                        if (oStateData.extendedShellStates[sExtendedShellStateName]){
                            var oExtendedShell = oStateData.extendedShellStates[sExtendedShellStateName].customState,
                                oExtendedState = oExtendedShell.getProperty("/currentState");

                            //commit the check points on the template checkpoints.
                            if (oExtendedState && oExtendedState.oCheckPoints && oExtendedState.oCheckPoints[sPropertyString]) {
                                this._commitCheckPoints(oExtendedState.oCheckPoints[sPropertyString], aItems, aIds);
                            }
                        }
                    }

                    //take the custom checkpoints (from the extended  model).
                    var oCustomCheckModel = oStateData.customShellState.getProperty("/currentState");
                    if (oCustomCheckModel && oCustomCheckModel.oCheckPoints && oCustomCheckModel.oCheckPoints[sPropertyString]) {
                        oShellAttributeCheckPoints = oCustomCheckModel.oCheckPoints[sPropertyString]
                        if (oShellAttributeCheckPoints && oShellAttributeCheckPoints.length) {
                            this._commitCheckPoints(oShellAttributeCheckPoints, aItems, aIds);
                        }
                    }
                    bInCheckpoint = false;
                }

                //also update the oCustomShellStateModel
                //check that we are not pointing to a shadow shell
                if (!bInCreateTemplate && !bInRenderState) {
                    //Update the custom state only if you are called from custom api.
                    fnUpdate(modelPropertyString, aIds, oCustomShellStateModel);
                    sap.ui.getCore().getEventBus().publish('launchpad', 'updateShell', {
                        oModel: oStateModelToUpdate,
                        path: modelPropertyString,
                        aIds: aIds,
                        sProperty: sPropertyString
                    });
                    this._renderShellState();
                } else {
                    //update the modelToUpdate.
                    fnUpdate(modelPropertyString, aIds, oStateModelToUpdate);
                }
            } else {
                var aPassStates = bDoNotPropagate ? aStates : this._getPassStates(aStates),
                    i,
                    oCurrentStateName = oStateModelToUpdate.getProperty('/currentState/stateName');

                for (i = 0; i < aPassStates.length; i++) {
                    var sState = aPassStates[i],
                        j;
                    modelPropertyString = "/states/" + sState + "/" + sPropertyString;
                    aItems = oStateModelToUpdate.getProperty(modelPropertyString);

                    //make validations
                    if (fnValidation(aItems, aIds, sState) === false) {
                        continue;
                    }

                    var aModelStates = this._getModelStates(sState, bDoNotPropagate);
                    for (j = 0; j < aModelStates.length; j++) {
                        modelPropertyString = "/states/" + aModelStates[j] + "/" + sPropertyString;
                        fnUpdate(modelPropertyString, aIds, oStateModelToUpdate);
                        if (oCurrentStateName === aModelStates[j]) {
                            //It was added to the base shell state so after we add it to the base recalculate the shell state.
                            if (!bInRenderState) {
                                this._renderShellState();
                            }
                        }
                    }
                }
            }
        };

        //gets the array of the valid states that need to be update according to the arguments that were passed
        this._getPassStates = function (aStates) {
            //an array with the relevant states that were pass as argument
            var aPassStates = [],
                i;
            aStates = aStates || [];

            for (i = 0; i < aStates.length; i++) {
                if (aStates[i] !== undefined) {
                    if (aStates[i] !== "home" && aStates[i] !== "app") {
                        throw new Error("sLaunchpadState value is invalid");
                    }
                    aPassStates.push(aStates[i]);
                }
            }

            if (!aPassStates.length) {
                aPassStates = ["app", "home"];
            }

            return aPassStates;
        };

        //gets all the models states that need to be update according to the state that was pass as argument
        this._getModelStates = function (sStates, bDoNotPropagate) {

            //an array with the relevant states that need to updated in the model
            var aModelStates = [];

            //in case we need to update to the "app" state, need to update all app states
            if (sStates === "app" && !bDoNotPropagate) {
                var appStates = ["app", "minimal", "standalone", "embedded", "headerless", "merged", "blank"];
                aModelStates = aModelStates.concat(appStates);
            } else if (sStates === "home" && !bDoNotPropagate) {
                var appStates = ["home", "embedded-home", "headerless-home", "merged-home", "blank-home"];
                aModelStates = aModelStates.concat(appStates);
            } else {
                aModelStates.push(sStates);
            }
            return aModelStates;
        };

        this._getStatesList = function () {
            var oStates = oModel.getProperty("/states");

            return Object.keys(oStates);
        };

        this._destroyManageQueue = function (aExcludeStates) {
            var sShellStateKey,
                nExtendedShellStateIndex,
                sElementIdToRelease,
                oManagedElemet,
                oBaseStateExtensionShellStates,
                sBaseExtShellStateKey,
                oStateExtensionShellStates;

            //loop over base states home / app
            for (sShellStateKey in oExtensionShellStates) {
                if (oExtensionShellStates.hasOwnProperty(sShellStateKey)) {
                    // Do not delete the extensionShellsState on home or on states that created by home.
                    if (!aExcludeStates || aExcludeStates.indexOf(sShellStateKey) === -1) {
                        oBaseStateExtensionShellStates = oExtensionShellStates[sShellStateKey].extendedShellStates;
                        //loop over extended shell states
                        for (sBaseExtShellStateKey in oBaseStateExtensionShellStates) {
                            if (oBaseStateExtensionShellStates.hasOwnProperty(sBaseExtShellStateKey)) {
                                oStateExtensionShellStates = oBaseStateExtensionShellStates[sBaseExtShellStateKey].managedObjects;
                                //loop over the elements in that extension shell state
                                for (nExtendedShellStateIndex = 0; nExtendedShellStateIndex < oStateExtensionShellStates.length; nExtendedShellStateIndex++) {
                                    sElementIdToRelease = oStateExtensionShellStates[nExtendedShellStateIndex];
                                    oManagedElemet = oManagedElements[sElementIdToRelease];
                                    //update the number of references to the element, because the extended shell state ni longer available
                                    oManagedElemet.nRefCount--;

                                    if (oManagedElemet.nRefCount === 0) {
                                        //delete the object
                                        oManagedElemet.oItem.destroy();
                                    }
                                }
                                //remove the base extension for that shell state
                                delete oBaseStateExtensionShellStates[sBaseExtShellStateKey];
                            }
                        }
                        //remove the extended shell state
                        delete oExtensionShellStates[sShellStateKey];
                    }
                }
            }
        };

        this._isValidStateEntry = function (sName) {
            return !!oCustomShellStates[sName];
        };

        this.getModelToUpdate = function () {
            return oStateModelToUpdate;
        };

        this.setModelToUpdate = function (oModelToUpdate, bCreateTemplate) {
        	bInCreateTemplate = bCreateTemplate;
        	oStateModelToUpdate = oModelToUpdate;
        };
    }

    var ShellModel1 = new ShellModel();

	return ShellModel1;

}, /* bExport= */ true);
