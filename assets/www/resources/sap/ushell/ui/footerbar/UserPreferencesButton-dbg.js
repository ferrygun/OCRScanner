/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

// Provides control sap.ushell.ui.footerbar.UserPreferencesButton.
sap.ui.define([
    'sap/m/Button',
    'sap/m/Dialog',
    'sap/m/Bar',
    'sap/m/Text',
    'sap/m/List',
    'sap/ushell/library',
    'sap/ushell/resources',
    'sap/ushell/services/Container',
    'sap/ushell/ui/launchpad/AccessibilityCustomData',
    'sap/ushell/ui/launchpad/ActionItem',
    'sap/m/DisplayListItem',
    'sap/ui/layout/VerticalLayout',
    'sap/m/ObjectIdentifier'
], function (Button, Dialog, Bar, Text, List, library, resources, Container, AccessibilityCustomData, ActionItem, DisplayListItem, VerticalLayout, ObjectIdentifier) {
    "use strict";

   /**
    * Constructor for a new ui/footerbar/UserPreferencesButton.
    *
    * @param {string} [sId] id for the new control, generated automatically if no id is given 
    * @param {object} [mSettings] initial settings for the new control
    *
    * @class
    * Add your documentation for the newui/footerbar/UserPreferencesButton
    * @extends sap.ushell.ui.launchpad.ActionItem
    *
    * @constructor
   * @public
   * @name sap.ushell.ui.footerbar.UserPreferencesButton
   * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
   */
    var UserPreferencesButton = ActionItem.extend("sap.ushell.ui.footerbar.UserPreferencesButton", /** @lends sap.ushell.ui.footerbar.UserPreferencesButton.prototype */ { metadata : {
        library : "sap.ushell"
    }});

    /*global jQuery, sap, window*/
    /**
     * UserPreferencesButton
     *
     * @name sap.ushell.ui.footerbar.UserPreferencesButton
     * @private
     * @since 1.16.0
     */
    UserPreferencesButton.prototype.init = function () {
        //call the parent button init method
        if (ActionItem.prototype.init) {
            ActionItem.prototype.init.apply(this, arguments);
        }
        this.setIcon('sap-icon://person-placeholder');
        this.translationBundle = resources.i18n;
        this.setText(this.translationBundle.getText("userSettings"));
        this.setTooltip(this.translationBundle.getText("settings_tooltip"));
        this.attachPress(this.showUserPreferencesDialog);
    };

    UserPreferencesButton.prototype.createDialog = function () {
        var saveButton,
            cancelButton,
            that = this;

        saveButton = this._createSaveButton();
        cancelButton = this._createCancelButton();

        this.oDialog = new Dialog({
            id: "userPreferencesDialog",
            title: "{/userPreferences/dialogTitle}",
            contentWidth: "29.6rem",
            content: null,
            contentHeight: "17rem",
            buttons: [saveButton, cancelButton],
            afterClose: function () {
                this._destroyDialog();
                this.oUser.resetChangedProperties();
            }.bind(that),
            stretch: sap.ui.Device.system.phone
        }).addStyleClass("sapUshellUserPreferencesDialog");

        this._addDialogBackButton();
        this.oDialog.setModel(this.getModel());
        this.oDialog.addCustomData(new AccessibilityCustomData({
            key: "aria-label",
            value: that.translationBundle.getText("Settings_Dialog_Main_label"),
            writeToDom: true
        }));
        this.oDialog.addContent(this._getOriginalDialogContent());
    };

    UserPreferencesButton.prototype._getOriginalDialogContent = function () {
        if (!this.oInitialContent) {
            var oUserDetails,
                oEntryList;

            oUserDetails = this._getUserDetailsControl();
            oEntryList = this._getEntryListControl();

            this.oInitialContent = new VerticalLayout('userPreferencesLayout', {
                content: [oUserDetails, oEntryList],
                width: "100%"
            });
        }

        return this.oInitialContent;
    };

    UserPreferencesButton.prototype._getEntryListControl = function () {
        var oEntryTemplate = this._getUserPrefEntriesTemplate(),
            xRayEnabled = this.getModel() && this.getModel().getProperty('/enableHelp'),
            that = this,
            i,
            sUserName = this.oUser.getFullName(),
            origOnAfterRendering,
            entryList = new List('userPrefEnteryList', {
                items : {
                    path     : "/userPreferences/entries",
                    template : oEntryTemplate
                }
            });

        entryList.addCustomData(new AccessibilityCustomData({
            key: "aria-label",
            value: that.translationBundle.getText("Settings_EntryList_label") + sUserName,
            writeToDom: true
        }));

        origOnAfterRendering = entryList.onAfterRendering;
        entryList.onAfterRendering = function () {
            var aEntries = this.getItems(),
                entryPath;

            //Execute the genuine onAfterRendering logic of the list.
            origOnAfterRendering.apply(this, arguments);
            //for each item in the list we need to add XRay help id
            //for each item in the list we need to execute the relevant function to get the entry value
            for (i = 0; i < aEntries.length; i++) {
                entryPath = aEntries[i].getBindingContext().getPath();
                //we would like to set the current entry value in case valueResult property is null
                if (!that.getModel().getProperty(entryPath + "/valueResult")) {
                    that._setEntryValueResult(entryPath);
                }
                if (xRayEnabled) {
                    that._addXRayHelpId(entryPath, aEntries[i]);
                }
            }
        };

        return entryList;
    };

    UserPreferencesButton.prototype._addXRayHelpId = function (entryPath, oListItem) {
        var helpID = this.getModel().getProperty(entryPath + "/entryHelpID");

        if (helpID) {
            oListItem.addStyleClass("help-id-" + helpID);
        }
    };

    UserPreferencesButton.prototype._setEntryValueResult = function (entryPath) {
        var that = this;
        var isEditable = this.getModel().getProperty(entryPath + "/editable");
        var valueArgument = this.getModel().getProperty(entryPath + "/valueArgument");
        if (typeof valueArgument === "function") {
            //Display "Loading..." and disable the entry until the value result is available
            this.getModel().setProperty(entryPath + "/valueResult", this.translationBundle.getText("genericLoading"));
            this.getModel().setProperty(entryPath + "/editable", false);
            var oValuePromise = valueArgument();

            oValuePromise.done(function(valueResult) {
                that.getModel().setProperty(entryPath + "/editable", isEditable);
                that.getModel().setProperty(entryPath + "/visible", typeof (valueResult) === 'object' ? !!valueResult.value : true);
                that.getModel().setProperty(entryPath + "/valueResult", typeof (valueResult) === 'object' ? valueResult.displayText : valueResult);
            });
            oValuePromise.fail(function () {
                that.getModel().setProperty(entryPath + "/valueResult", that.translationBundle.getText("loadingErrorMessage"));
            });
        } else if (!!valueArgument) {//if valueArgument is not null or undefined, we would like to present it
            this.getModel().setProperty(entryPath + "/valueResult", valueArgument);
            this.getModel().setProperty(entryPath + "/editable", isEditable);
        } else {//in any other case (valueArgument is not function \ String \ Number \ Boolean)
            this.getModel().setProperty(entryPath + "/valueResult", this.translationBundle.getText("loadingErrorMessage"));
        }
    };

    UserPreferencesButton.prototype._getUserPrefEntriesTemplate = function () {
        var that = this,
            oItem,
            pressHandler = function (e) {
                var oEventObj = {};

                oEventObj = jQuery.extend(true, {}, {}, e);

                sap.ui.require(['sap/m/FlexBox',
                                'sap/m/FlexAlignItems',
                                'sap/m/FlexJustifyContent',
                                'sap/m/BusyIndicator'],
                    function (FlexBox, FlexAlignItems, FlexJustifyContent, BusyIndicator) {
                        var isContentValid = true,
                            oContent,
                            entryLabel = oEventObj.getSource().getLabel(),
                            entryPath = oEventObj.getSource().getBindingContext().getPath();

                        that.getModel().setProperty("/userPreferences/activeEntryPath", entryPath);
                        that._setDetailedEntryModeMode(true, entryPath, entryLabel, entryPath);
                        that.oDialog.removeAllContent();
                        oContent = that.getModel().getProperty(entryPath + "/contentResult");
                        if (oContent) {
                            that.oDialog.addContent(oContent);
                        } else {
                            var oBusyIndicator = null,// oBusyIndicator is initialized only when bShowBusyIndicator === true
                                oContentPromise,
                                bShowBusyIndicator = true,
                                bIsBusyIndicatorShown = false,
                                contentFunction = that.getModel().getProperty(entryPath + "/contentFunc");

                            if (typeof contentFunction === "function") {
                                that.getModel().setProperty(entryPath + "/isDirty", true);//Set isDirty = true to the entry. Relevant for saving flow.
                                oContentPromise = contentFunction();

                                oContentPromise.done(function (contentResult) {
                                    bShowBusyIndicator = false;
                                    if (bIsBusyIndicatorShown === true) {
                                        that.oDialog.removeAllContent();
                                        oBusyIndicator.destroy();//oBusyIndicator is destroyed only when it is actually presented
                                    }

                                    if (contentResult instanceof sap.ui.core.Control) {

                                        that.getModel().setProperty(entryPath + "/contentResult", contentResult);
                                        that.oDialog.addContent(contentResult);
                                    } else {
                                        isContentValid = false;
                                    }
                                });
                                oContentPromise.fail(function () {
                                    bShowBusyIndicator = false;
                                    if (bIsBusyIndicatorShown === true) {
                                        that.oDialog.removeAllContent();
                                        oBusyIndicator.destroy();//oBusyIndicator is destroyed only when it is actually presented
                                    }
                                    isContentValid = false;
                                });

                                oContentPromise.always(function () {
                                    if (isContentValid === false) {
                                        var oErrorContent = new FlexBox("userPrefErrorFlexBox", {
                                            height: "5rem",
                                            alignItems: FlexAlignItems.Center,
                                            justifyContent: FlexJustifyContent.Center,
                                            items: [new Text("userPrefErrorText", {text: that.translationBundle.getText("loadingErrorMessage")})]
                                        });

                                        that.getModel().setProperty(entryPath + "/contentResult", oErrorContent);
                                        that.oDialog.addContent(oErrorContent);
                                    }
                                });

                                if (bShowBusyIndicator === true) {
                                    oBusyIndicator = new BusyIndicator('userPrefLoadingBusyIndicator', {size: "2rem"});
                                    that.oDialog.addContent(oBusyIndicator);
                                    bIsBusyIndicatorShown = true;
                                }
                            }
                        }
                    });
            };

        oItem = new DisplayListItem({
            label: "{title}",
            value: "{valueResult}",
            tooltip: {
                path: "valueResult",
                formatter: function (valueResult) {
                    return typeof (valueResult) === 'string' ? valueResult : "";
                }
            },
            type: {
                path: "editable",
                formatter: function (editable) {
                    return (editable === true) ? "Navigation" : "Inactive";//Default is Inactive
                }
            },
            visible: {
                path: "visible",
                formatter: function (visible) {
                    return (visible !== undefined) ? visible : true;
                }
            },
            press: pressHandler,
            customData: new AccessibilityCustomData({
                key: "aria-label",
                value: {
                    parts: [
                        {path: 'title'},
                        {path: 'valueResult'}
                    ],
                    formatter: function (sTitle, sValue) {
                        sValue = sValue ? sValue : "";
                        return sTitle + " " + sValue;
                    }
                },
                writeToDom: true
            })
        });
        return oItem;
    };

    UserPreferencesButton.prototype._getUserDetailsControl = function () {
        return new ObjectIdentifier({
            title: this.oUser.getFullName(),
            text: this.oUser.getEmail()
        }).addStyleClass("sapUshellUserPrefUserIdentifier");
    };


    UserPreferencesButton.prototype._createCancelButton = function () {
        var that = this;
        return new Button({
            id: "cancelButton",
            text: {
                parts: ['/userPreferences/entries'],
                formatter: function (aEntries) {
                    var bEditableExist = aEntries.some(function (oEntry) {
                        return oEntry.editable;
                    });
                    return bEditableExist > 0 ? that.translationBundle.getText("cancelBtn") : that.translationBundle.getText("close");
                }
            },
            press: that._dialogCancelButtonHandler.bind(that),
            visible: true
        });
    };

    UserPreferencesButton.prototype._createSaveButton = function () {
        var that = this;
        return new Button({
            id: "saveButton",
            text: this.translationBundle.getText("saveBtn"),
            press: that._dialogSaveButtonHandler.bind(that),
            visible: {
                parts: ['/userPreferences/entries'],
                formatter: function (aEntries) {
                    return aEntries.some(function (oEntry) {
                        return oEntry.editable;
                    });
                }
            }
        });
    };

    UserPreferencesButton.prototype._setDetailedEntryModeMode = function (isDetailedEntryMode, entryPath, entryLabel, entryValue) {
        this.getModel().setProperty("/userPreferences/isDetailedEntryMode", !!isDetailedEntryMode);
        this.getModel().setProperty("/userPreferences/dialogTitle", entryLabel);
    };

    UserPreferencesButton.prototype.showUserPreferencesDialog = function () {
        //if (oModel.getProperty("/enableHelp")) {
        //    that.themeSelection.addStyleClass('help-id-themesDropdown'); // TODO: xRay help ID
        //}

        this.oUser = sap.ushell.Container.getUser();
        this.createDialog();
        this.oDialog.open();
    };

    UserPreferencesButton.prototype._dialogBackButtonHandler = function (e) {
        sap.ui.require(['sap/ui/layout/VerticalLayout'],
            function (VerticalLayout) {
                this.getModel().setProperty("/userPreferences/isDetailedEntryMode", false);
                this.getModel().setProperty("/userPreferences/dialogTitle", this.translationBundle.getText("userSettings"));
                this.oDialog.removeAllContent();
                this.oDialog.addContent(this._getOriginalDialogContent());
                this._setEntryValueResult(this.getModel().getProperty("/userPreferences/activeEntryPath"));
                this.getModel().setProperty("/userPreferences/activeEntryPath", null);
            }
            );
    };

    UserPreferencesButton.prototype._destroyDialog = function () {
        this.oHeadBar.destroy();
        this.oInitialContent.destroy();
        this.oInitialContent = null;
        this._modelCleanUpToInitial();
        this._entriesCleanUp();

        this.oDialog.destroy();
    };

    UserPreferencesButton.prototype._entriesCleanUp = function () {
        var i,
            entriesArray = this.getModel().getProperty("/userPreferences/entries");

        for (i = 0; i < entriesArray.length; i++) {
            //destroy entry content if exists
            if (entriesArray[i].contentResult) {
                entriesArray[i].contentResult.destroy();
                entriesArray[i].contentResult = null;
            }
            entriesArray[i].isDirty = false;
            entriesArray[i].valueResult = null;
        }
        //update the entries model with the clean array
        this.getModel().setProperty("/userPreferences/entries", entriesArray);
    };

    UserPreferencesButton.prototype._modelCleanUpToInitial = function () {
        this.getModel().setProperty("/userPreferences/isDetailedEntryMode", false);
        this.getModel().setProperty("/userPreferences/dialogTitle", this.translationBundle.getText("userSettings"));
    };

    UserPreferencesButton.prototype._dialogSaveButtonHandler = function () {
        var that = this,
            isDetailedEntryMode,
            saveEntriesPromise = this._saveUserPrefEntries();

        //in case the save button is pressed in the detailed entry mode, there is a need to update value result
        // in the model
        isDetailedEntryMode = this.getModel().getProperty("/userPreferences/isDetailedEntryMode");
        if (isDetailedEntryMode) {
            this.getModel().setProperty("/userPreferences/activeEntryPath", null);
        }

        saveEntriesPromise.done(function () {
            that._showSaveMessageToast();
        });

        saveEntriesPromise.fail(function (failureMsgArr) {
            sap.ui.require(['sap/m/MessageBox'],
                function (MessageBox) {
                    var errMessageText,
                        errMessageLog = "";

                    if (failureMsgArr.length === 1) {
                        errMessageText = that.translationBundle.getText("savingEntryError") + " ";
                    } else {
                        errMessageText = that.translationBundle.getText("savingEntriesError") + "\n";
                    }
                    failureMsgArr.forEach(function (errObject) {
                        errMessageText += errObject.entry + "\n";
                        errMessageLog += "Entry: " + errObject.entry + " - Error message: " + errObject.message + "\n";
                    });

                    MessageBox.show(errMessageText, {
                        icon: MessageBox.Icon.ERROR,
                        title: that.translationBundle.getText("Error"),
                        actions: [MessageBox.Action.OK]
                    });

                    jQuery.sap.log.error(
                        "Failed to save the following entries",
                        errMessageLog,
                        "sap.ushell.ui.footerbar.UserPreferencesButton"
                    );
                });
        });
        this.oDialog.close();
        this._destroyDialog();
    };

    UserPreferencesButton.prototype._dialogCancelButtonHandler = function () {
        var i,
            aEntries = this.getModel().getProperty("/userPreferences/entries");

        //Invoke onCancel function for each userPreferences entry
        for (i = 0; i < aEntries.length; i++) {
            if (aEntries[i] && aEntries[i].onCancel) {
                aEntries[i].onCancel();
            }
        }
        this.oDialog.close();
        this._destroyDialog();
    };

    UserPreferencesButton.prototype._saveUserPrefEntries = function () {
        var aEntries = this.getModel().getProperty("/userPreferences/entries");
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

        whenPromise.done(function() {
            resultDeferred.resolve();
        });

        resultDeferred.progress(function () {
            if (failureCount > 0 && (failureCount + successCount === totalPromisesCount)) {
                resultDeferred.reject(failureMsgArr);
            }
        });

        return resultDeferred.promise();
    };

    UserPreferencesButton.prototype._addDialogBackButton = function () {
        var that = this;
        var oBackButton = new Button('userPrefBackBtn', {
            visible: "{/userPreferences/isDetailedEntryMode}",
            icon: sap.ui.core.IconPool.getIconURI("nav-back"),
            press: that._dialogBackButtonHandler.bind(that),
            tooltip: this.translationBundle.getText("feedbackGoBackBtn_tooltip")
        });

        var oDialogTitle = new Text("userPrefTitle", {
            text: "{/userPreferences/dialogTitle}"
        });

        this.oHeadBar = new Bar({
            contentLeft: [oBackButton],
            contentMiddle: [oDialogTitle]
        });

        this.oDialog.setCustomHeader(this.oHeadBar);
    };

    UserPreferencesButton.prototype._showSaveMessageToast = function () {
        sap.ui.require(['sap/m/MessageToast'],
            function (MessageToast) {
                var message = this.translationBundle.getText("savedChanges");

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
    };
	return UserPreferencesButton;
},/* bExport= */true);
