// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define(["sap/ushell/resources", "sap/m/Button", "sap/m/ButtonType"], function (resources, Button, ButtonType) {
    "use strict";

    /*global jQuery, sap, setTimeout, clearTimeout */
    /*jslint plusplus: true, nomen: true */
    var oModel = new sap.ui.model.json.JSONModel({
        actions: [],
        userPreferences: {
            entries: []
        },
        apps: {
            recentActivities: [],
            frequentActivities: []
        }
    });

    sap.ui.controller("sap.ushell.renderers.fiori2.meArea.MeArea", {
        onInit: function () {
            var oConfig = (this.getView().getViewData() ? this.getView().getViewData().config : {}) || {};
            this.aControlsWithPressHandler = [];
            this.getView().setModel(oModel, "meAreaModel");
            this._addActionItemToOverflowSupport();
            this.oResourceBundle = resources.i18n;

            if (oConfig.enableRecentActivity) {
                this.oUserRecentsSrvc = sap.ushell.Container.getService('UserRecents');
            }
            this.lastVisited = null;
        },

        onBeforeRendering: function () {
            if (this.oUserRecentsSrvc) {
                if (!oModel.getProperty('/apps/recentActivities') || !oModel.getProperty('/apps/recentActivities').length) {
                    this.refreshRecentActivities();
                }
            }
            if (!oModel.getProperty('/apps/frequentActivities') || !oModel.getProperty('/apps/frequentActivities').length) {
                this.refreshFrequentActivities();
            }
        },
        onAfterRendering: function () {
            this.oUxapLoadPromise = sap.ui.getCore().loadLibraries(["sap.uxap"], {async: true});
        },

        refreshRecentActivities: function () {
            if (this.oUserRecentsSrvc) {
                this.oUserRecentsSrvc.getRecentActivity().done(function (aActivity) {
                    aActivity.forEach(function (oItem) {
                        oItem.timestamp = sap.ushell.utils.formatDate(oItem.timestamp);
                    });
                    oModel.setProperty('/apps/recentActivities', aActivity);
                });
            }
        },

        refreshFrequentActivities: function () {
            if (this.oUserRecentsSrvc) {
                this.oUserRecentsSrvc.getFrequentActivity().done(function (aActivity) {
                    oModel.setProperty('/apps/frequentActivities', aActivity);
                });
            }
        },

        createViewByName: function (oEvent, sName, sViewId) {
            var oView = sViewId ? sap.ui.getCore().byId(sViewId) : null;
            if (!oView) {
                var oSrc = oEvent.getSource(),
                    oCtx = oSrc.getBindingContext(),
                    sPath = oCtx ? oCtx.getPath() : "",
                    sViewName = sName || oCtx.getModel().getProperty(sPath + "/viewName");

                sViewId = sViewId || oCtx.getModel().getProperty(sPath + "/id");
                oView = sap.ui.view(sViewId, {
                    viewName: sViewName,
                    type: 'JS',
                    viewData: {}
                });
            }

            return oView;
        },

        getSettingsDialogContent: function () {
            var oSettingView = sap.ui.getCore().byId("userSettings");
            if (!oSettingView) {
                oSettingView = sap.ui.view("userSettings", {
                    viewName: "sap.ushell.renderers.fiori2.user_actions.user_preferences.UserSettings",
                    type: 'JS',
                    viewData: this.getView().getViewData()
                });
            }
            oSettingView.setModel(this.getView().getModel());
            return oSettingView;
        },

        logout: function () {
            sap.ui.require(['sap/m/MessageBox'],
                function (MessageBox) {
                    var oLoading = new sap.ushell.ui.launchpad.LoadingDialog({text: ""}),
                        bShowLoadingScreen = true,
                        bIsLoadingScreenShown = false,
                        oLogoutDetails = {};

                    sap.ushell.Container.getGlobalDirty().done(function (dirtyState) {
                        bShowLoadingScreen = false;
                        if (bIsLoadingScreenShown === true) {
                            oLoading.exit();
                            oLoading = new sap.ushell.ui.launchpad.LoadingDialog({text: ""});
                        }

                        var _getLogoutDetails = function (dirtyState) {
                            var oLogoutDetails = {},
                                oResourceBundle = resources.i18n;

                            if (dirtyState === sap.ushell.Container.DirtyState.DIRTY) {
                                // show warning only if it is sure that there are unsaved changes
                                oLogoutDetails.message = oResourceBundle.getText('unsaved_data_warning_popup_message');
                                oLogoutDetails.icon = MessageBox.Icon.WARNING;
                                oLogoutDetails.messageTitle = oResourceBundle.getText("unsaved_data_warning_popup_title");
                            } else {
                                // show 'normal' logout confirmation in all other cases, also if dirty state could not be determined
                                oLogoutDetails.message = oResourceBundle.getText('signoutConfirmationMsg');
                                oLogoutDetails.icon = MessageBox.Icon.QUESTION;
                                oLogoutDetails.messageTitle = oResourceBundle.getText("signoutMsgTitle");
                            }

                            return oLogoutDetails;
                        };

                        oLogoutDetails = _getLogoutDetails(dirtyState);
                        MessageBox.show(oLogoutDetails.message, oLogoutDetails.icon,
                            oLogoutDetails.messageTitle, [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                            function (oAction) {
                                if (oAction === MessageBox.Action.OK) {
                                    oLoading.openLoadingScreen();
                                    oLoading.showAppInfo(resources.i18n.getText('beforeLogoutMsg'), null);
                                    sap.ushell.Container.logout();
                                }
                            }, sap.ui.core.ElementMetadata.uid("confirm"));
                    });
                    if (bShowLoadingScreen === true) {
                        oLoading.openLoadingScreen();
                        bIsLoadingScreenShown = true;
                    }
                });
        },

        _addPressHandlerToActions: function (oControl) {
            var that = this;
            if (this.aControlsWithPressHandler.indexOf(oControl.getId()) === -1) {
                this.aControlsWithPressHandler.push(oControl.getId());
                oControl.attachPress(function (oEvent) {
                    sap.ui.getCore().byId("viewPortContainer").switchState("Center");
                    if (oControl.getId() === "userSettingsBtn") {
                        var sHotkeysParam = oEvent.mParameters ? oEvent.mParameters.hotkeys: undefined ;
                        that.hotkeysParam = sHotkeysParam;
                        var oThat = that;
                        oThat.oUxapLoadPromise.then(function () {
                            if (!oThat.getView().oSettingsDialog.getModel()) {
                                oThat.getView().oSettingsDialog.setModel(oThat.getView().getModel());
                            }
                            var fnOpenDialogAfterSwitchAnimation = function () {
                                oThat.getView().oSettingsDialog.open();
                                sap.ui.getCore().byId("viewPortContainer").detachAfterSwitchStateAnimationFinished(fnOpenDialogAfterSwitchAnimation);
                            };
                            if (oThat.hotkeysParam){
                                oThat.getView().oSettingsDialog.open();
                            }else{
                                var sCurrentShellState = oThat.oView.getModel().getProperty('/currentState/stateName');
                                if (sCurrentShellState === 'embedded' || sCurrentShellState === 'embedded-home' || sCurrentShellState === 'standalone' || sCurrentShellState === 'blank-home' || sCurrentShellState === 'blank') {
                                    oThat.getView().oSettingsDialog.open();
                                } else {
                                    sap.ui.getCore().byId("viewPortContainer").attachAfterSwitchStateAnimationFinished(fnOpenDialogAfterSwitchAnimation);
                                }
                            }
                        });
                    }
                });
            }
        },


        _getControlsWithPressHandler: function () {
            return this.aControlsWithPressHandler;
        },
        _addActionItemToOverflowSupport: function () {
            if (sap.m._overflowToolbarHelpers && sap.m._overflowToolbarHelpers.OverflowToolbarAssociativePopoverControls._mSupportedControls) {
                var mSupported = sap.m._overflowToolbarHelpers.OverflowToolbarAssociativePopoverControls._mSupportedControls;
                var oPrototypeToExtend = sap.m._overflowToolbarHelpers.OverflowToolbarAssociativePopoverControls.prototype;
                var aControlNamesToAdd = [
                    "sap.ushell.ui.launchpad.ActionItem",
                    "sap.ushell.ui.footerbar.AboutButton",
                    "sap.ushell.ui.footerbar.ContactSupportButton",
                    "sap.ushell.ui.footerbar.EndUserFeedback",
                    "sap.ushell.ui.footerbar.LogoutButton",
                    "sap.ushell.ui.footerbar.UserPreferencesButton",
                    "sap.m.Button"
                ];
                var fnCapitalize = function (sName) {
                    return sName.substring(0, 1).toUpperCase() + sName.substring(1);
                };
                var oSupports = {
                    canOverflow: true,
                    listenForEvents: ["press"],
                    noInvalidationProps: ["enabled", "type"]
                };
                var fnPreProcess = function (oControl) {
                    if (oControl.setActionType) {
                        oControl.setActionType('standard');
                    }
                    var sType = oControl.getType();

                    if (sType !== ButtonType.Accept && sType !== ButtonType.Reject) {
                        oControl.setType(ButtonType.Transparent);
                    }

                    // when icon is available - need to indent it
                    if (oControl.getIcon()) {
                        oControl.addStyleClass("sapMOTAPButtonWithIcon");
                    } else {
                        oControl.addStyleClass("sapMOTAPButtonNoIcon");
                    }
                };

                var fnPostProcess = function (oControl) {
                    if (oControl.setActionType) {
                        oControl.setActionType('action');
                    }
                };
                aControlNamesToAdd.forEach(function (sName) {
                    mSupported[sName] = oSupports;
                    var sCap = sName.split(".").map(fnCapitalize).join("");
                    var sPreProcessPrefix = '_preProcess';
                    var sPostProcessPrefix = '_postProcess';
                    oPrototypeToExtend[sPreProcessPrefix + sCap] = fnPreProcess;
                    oPrototypeToExtend[sPostProcessPrefix + sCap] = fnPostProcess;
                });
            }
        },

        /**
         * Use to store the last visited url that was clicked form the TabBar control
         * @param {string} sUrl the url that was used in the navigation
         */
        setLastVisited: function (sUrl) {
            this.lastVisited = sUrl;
        },

        updateScrollBar: function (hash) {
            /**
             When navigating from one of the entries (recent or frequent apps) the TabBar remembers the last scroll
             position it was in.
             In case additional navigation took place (i.e the hash has changed) - we reset the TabBar control to point
             to the first entry in the Recent Activities Tab.
             */
            if (this.lastVisited && this.lastVisited != "#" + hash) {
                //Scroll to top:
                jQuery('.sapUshellViewPortLeft').scrollTop(0);

                // setting the Recent-Activity Tab as selected
                sap.ui.getCore().byId('meAreaIconTabBar').setSelectedKey("sapUshellIconTabBarrecentActivities");

                // setting first Recent-Activity item to set focus on first item again
                // otherwise every time me-area will opened there will be a scroll jump
                var oListRecent = sap.ui.getCore().byId('sapUshellActivityListrecentActivities'),
                    aListItems = oListRecent.getItems();
                if (aListItems && aListItems.length > 0) {
                    sap.ui.getCore().byId('sapUshellActivityListrecentActivities').setSelectedItem(aListItems[0], true);
                }

                // reset the lastVisited index
                this.lastVisited = null;
            }
        },

        _saveUserPrefEntries: function () {
            var aEntries = this.getView().getModel().getProperty("/userPreferences/entries");
            var resultDeferred = jQuery.Deferred();
            var whenPromise;
            var currentPromise;
            var totalPromisesCount = 0;
            var failureCount = 0;
            var successCount = 0;
            var promiseArray = [];
            var failureMsgArr = [];
            var currEntryTitle;
            var saveDoneFunc = function () {
                successCount++;
                resultDeferred.notify();
            };
            var saveFailFunc = function (err) {
                failureMsgArr.push({
                    entry: currEntryTitle,
                    message: err
                });
                failureCount++;
                resultDeferred.notify();
            };

            for (var i = 0; i < aEntries.length; i++) {
                if (aEntries[i] && aEntries[i].isDirty === true) {//only if the entry is dirty we would like to save it
                    currentPromise = aEntries[i].onSave();
                    currentPromise.done(saveDoneFunc);
                    currEntryTitle = aEntries[i].title;
                    currentPromise.fail(saveFailFunc);
                    promiseArray.push(currentPromise);//save function return jQuery Promise
                    totalPromisesCount++;
                }
            }

            whenPromise = jQuery.when.apply(null, promiseArray);

            whenPromise.done(function () {
                resultDeferred.resolve();
            });

            resultDeferred.progress(function () {
                if (failureCount > 0 && (failureCount + successCount === totalPromisesCount)) {
                    resultDeferred.reject(failureMsgArr);
                }
            });

            return resultDeferred.promise();
        },

        _saveButtonHandler: function () {
            var saveEntriesPromise;
            saveEntriesPromise = this._saveUserPrefEntries();
            var that = this;

            //in case the save button is pressed in the detailed entry mode, there is a need to update value result
            // in the model
            var isDetailedEntryMode = this.getView().getModel().getProperty("/userPreferences/isDetailedEntryMode");
            if (isDetailedEntryMode) {
                this.getView().getModel().setProperty("/userPreferences/activeEntryPath", null);
            }

            saveEntriesPromise.done(function () {
                that._showSaveMessageToast();
            });

            saveEntriesPromise.fail(function (failureMsgArr) {
                sap.ui.require(["sap/m/MessageBox"], function(MessageBox) {
                        var errMessageText;
                        var errMessageLog = "";
                        if (failureMsgArr.length === 1) {
                            errMessageText = that.translationBundle.getText("savingEntryError") + " ";
                        } else {
                            errMessageText = that.translationBundle.getText("savingEntriesError") + "\n";
                        }
                        failureMsgArr.forEach(function (errObject) {
                            errMessageText += errObject.entry + "\n";
                            errMessageLog += "Entry: " + errObject.entry + " - Error message: " + errObject.message + "\n";
                        });

                        MessageBox.show(
                            errMessageText, {
                                icon: MessageBox.Icon.ERROR,
                                title: that.translationBundle.getText("Error"),
                                actions: [MessageBox.Action.OK]
                            }
                        );

                        jQuery.sap.log.error(
                            "Failed to save the following entries",
                            errMessageLog,
                            "sap.ushell.ui.footerbar.UserPreferencesButton"
                        );
                    }
                );
            });
        },

        _showSaveMessageToast: function () {
            sap.ui.require(["sap/m/MessageToast"], function(MessageToast) {
                var message = resources.i18n.getText("savedChanges");

                MessageToast.show(message, {
                    duration: 3000,
                    width: "15em",
                    my: "center bottom",
                    at: "center bottom",
                    of: window,
                    offset: "0 -50",
                    collision: "fit fit"
                });
            });
        },

        createSaveButton: function () {
            var that = this;
            return new Button({
                id: "userSettingSaveButton",
                text: resources.i18n.getText("saveBtn"),
                press: function () {
                    that._saveButtonHandler();
                    that._handleSettingsDialogClose.apply(that);
                },
                visible: true
            });
        },

        _dialogCancelButtonHandler: function () {
            var aEntries = this.getView().getModel().getProperty("/userPreferences/entries");
            //Invoke onCancel function for each userPreferences entry
            for (var i = 0; i < aEntries.length; i++) {
                if (aEntries[i] && aEntries[i].onCancel) {
                    aEntries[i].onCancel();
                }
            }
        },

        _handleSettingsDialogClose: function () {
            var oView = this.getView(),
                oSettingsDialogContent = this.getSettingsDialogContent();
            oSettingsDialogContent.oMainApp.toMaster('userSettingMaster');
            //Fix - in phone the first selection (user account) wasn't responsive when this view was closed and re-opened because is was regarded as already selected entry in the splitApp control.
            oSettingsDialogContent.oController.oMasterEntryList.removeSelections(true);
            oView.oSettingsDialog.close();
        },

        createCancelButton: function () {
            var that = this;
            return new Button({
                id: "userSettingCancelButton",
                text: resources.i18n.getText("cancelBtn"),
                press: function () {
                    that._dialogCancelButtonHandler();
                    that._handleSettingsDialogClose.apply(that);
                },
                visible: true
            });
        },

        onExit: function () {
            this.getView().aDanglingControls.forEach(function (oControl) {
                if (oControl.destroyContent) {
                    oControl.destroyContent();
                }
                oControl.destroy();
            });
        }
    });


}, /* bExport= */ false);
