// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * Notification settings View Controller<br>
 */
sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap, console, window*/
    /*jslint plusplus: true, nomen: true*/

    sap.ui.controller("sap.ushell.renderers.fiori2.notifications.Settings", {

       /**
        * Main functionality:
        * - Getting the notification settings data from Notifications service
        * - Initializing rows data in the model
        * - In case of failure or no data - creating NoData UI
        * - Handling switch flags data initialization
        */
        onInit: function () {
            var that = this,
                oSettingsPromise = sap.ushell.Container.getService("Notifications").readSettings(),
                oModel = new sap.ui.model.json.JSONModel(),
                oView,
                oNoDataUI,
                oResponseData,
                aDeepCopyRows;

           oModel.setProperty("/aDitryRowsIndicator", []);
           oModel.setProperty("/rows", []);
           oModel.setProperty("/originalRows", []);
           oSettingsPromise.done(function (oResult) {
               oResponseData = JSON.parse(oResult);
               oModel.setProperty("/rows", oResponseData.value);
               aDeepCopyRows = JSON.parse(JSON.stringify(oResponseData.value));
               oModel.setProperty("/originalRows", aDeepCopyRows);
           });
            oSettingsPromise.fail(function () {
                // Getting notification types data failed. Creating the NoData UI and setting it as the View's content
                oNoDataUI = that.getView().getNoDataUI();
                that.getView().removeAllContent();
                that.getView().addContent(oNoDataUI);
            });

            this._handleSwitchFlagsDataInitialization(oModel);

            oView = this.getView();
            oView.setModel(oModel);
        },

        onExit: function () {
        },

        onBeforeRendering: function () {
        },

        /**
         * Initializing the copies of the data rows and the switch flags (i.e. originalRows and originalFlags).
         */
        onAfterRendering: function () {
            var oflags = this.getView().getModel().getProperty("/flags"),
                aRows = this.getView().getModel().getProperty("/rows"),
                aDeepCopyRows;

            // On the first time (after controller initialization) there might be a case in which the data rows still weren't fetched from the backend.
            // In this case aRows is undefined, hence we can't set /originalRows yet.
            // Setting "/originalRows" in this case occurs in the controller's onInit function, when the rows data arrives
            if (aRows !== undefined) {
                aDeepCopyRows = JSON.parse(JSON.stringify(aRows));
                this.getView().getModel().setProperty("/originalRows", aDeepCopyRows);
            }
            this.getView().getModel().setProperty("/originalFlags/previewNotificationEnabled", oflags.previewNotificationEnabled);
            this.getView().getModel().setProperty("/originalFlags/highPriorityBannerEnabled", oflags.highPriorityBannerEnabled);

            this.getView().getModel().setProperty("/aDitryRowsIndicator", []);
        },

        getContent: function () {
            var oDfd = jQuery.Deferred();
            oDfd.resolve(this.getView());
            return oDfd.promise();
        },

        getValue: function () {
            var oDfd = jQuery.Deferred();
            oDfd.resolve(" ");
            return oDfd.promise();
        },

        /**
         * Ignoring all the state changes done by the user, replacing them with the original state of the rows and the flags
         */
        onCancel: function () {
            var oOriginalFlags = this.getView().getModel().getProperty("/originalFlags"),
                oOriginalRows = this.getView().getModel().getProperty("/originalRows"),
                oDeepCopyOriginalRows = JSON.parse(JSON.stringify(oOriginalRows));

            this.getView().getModel().setProperty("/flags/previewNotificationEnabled", oOriginalFlags.previewNotificationEnabled);
            this.getView().getModel().setProperty("/flags/highPriorityBannerEnabled", oOriginalFlags.highPriorityBannerEnabled);
            this.getView().getModel().setProperty("/rows", oDeepCopyOriginalRows);

            this.getView().getModel().setProperty("/originalFlags", {});
            this.getView().getModel().setProperty("/originalRows", []);

            this.getView().getModel().setProperty("/aDitryRowsIndicator", []);

        },

        /**
         * - Saving switch flag value
         * - Saving rows (i.e. notification types) that were changed
         * - Emptying dirty flags array
         */
        onSave: function () {
            var oDfd = jQuery.Deferred(),
                aRows = this.getView().getModel().getProperty("/rows"),
                aOriginalRows = this.getView().getModel().getProperty("/originalRows"),
                oTempRow,
                oTempOriginalRow,
                iIndex,
                aDitryRowsIndicator = this.getView().getModel().getProperty("/aDitryRowsIndicator");

            oDfd.resolve();

            // Save the switch flags ("Show Alerts" and "Show Preview")
            this._handleSwitchFlagsSave();

            // Saving the rows that were changed (i.e. at least one of the flags was changed by the user)
            for (iIndex = 0; iIndex < aRows.length; iIndex++) {
                // Check the "dirty" flag if the current row
                if (aDitryRowsIndicator[iIndex] && aDitryRowsIndicator[iIndex] === true) {
                    oTempRow = aRows[iIndex];
                    oTempOriginalRow = aOriginalRows[iIndex];
                    // Check the current state of the row is different then the original state
                    if (!this._identicalRows(oTempRow, oTempOriginalRow)) {
                        sap.ushell.Container.getService("Notifications").saveSettingsEntry(oTempRow);
                    }
                }
            }
            this.getView().getModel().setProperty("/aDitryRowsIndicator", []);
            return oDfd.promise();
        },

        /**
         * Setting a "dirty flag" (to true) for a row, when the status of the row was changed by the user (e.g. a checkbox was checked/unchecked).
         * 
         * The array of "dirty flags" (each one represents a row in the notification types table) is in the model in "/aDitryRowsIndicator".
         * The index of the correct item in the array/model is the index of the row in the table and is extracted from this.getBindingContext().sPath   
         */
        setControlDirtyFlag : function () {
            var oContextPath = this.getBindingContext().sPath,
                iIndexInArray = oContextPath.substring(oContextPath.lastIndexOf("/") + 1, oContextPath.length),
                oObjectInModel = this.getModel().getProperty("/aDitryRowsIndicator");

            if (oObjectInModel !== undefined) {
                this.getModel().setProperty("/aDitryRowsIndicator/" + iIndexInArray, true);
            }
        },
        _handleSwitchFlagsDataInitialization : function (oModel) {
            var oSwitchBarDataPromise = sap.ushell.Container.getService("Notifications").getUserSettingsFlags(),
                bMobilePushEnabled = sap.ushell.Container.getService("Notifications")._getNotificationSettingsMobileSupport();

            oSwitchBarDataPromise.done(function (oSwitchBarData) {
                oModel.setProperty("/flags", {});
                oModel.setProperty("/flags/previewNotificationEnabled", oSwitchBarData.previewNotificationEnabled);
                oModel.setProperty("/flags/highPriorityBannerEnabled", oSwitchBarData.highPriorityBannerEnabled);
                oModel.setProperty("/flags/mobileNotificationsEnabled", bMobilePushEnabled);

                oModel.setProperty("/originalFlags", {});
                oModel.setProperty("/originalFlags/previewNotificationEnabled", oSwitchBarData.previewNotificationEnabled);
                oModel.setProperty("/originalFlags/highPriorityBannerEnabled", oSwitchBarData.highPriorityBannerEnabled);
            });
        },

        /**
         * Handle the saving of "Show Alerts" (i.e. enable banner) and "Show Preview" flags,
         * and update the original flags (in "/originalFlags") for the next time the settings UI is opened.
         */
        _handleSwitchFlagsSave : function () {
            var bPreviewNotificationEnabled = this.getView().getModel().getProperty("/flags/previewNotificationEnabled"),
                bHighPriorityBannerEnabled = this.getView().getModel().getProperty("/flags/highPriorityBannerEnabled"),
                bOriginalPreviewNotificationEnabled = this.getView().getModel().getProperty("/originalFlags/previewNotificationEnabled"),
                bOriginalHighPriorityBannerEnabled = this.getView().getModel().getProperty("/originalFlags/highPriorityBannerEnabled");

            if ((bOriginalPreviewNotificationEnabled !== bPreviewNotificationEnabled) || (bOriginalHighPriorityBannerEnabled !== bHighPriorityBannerEnabled)) {

                sap.ushell.Container.getService("Notifications").setUserSettingsFlags({
                    previewNotificationEnabled : bPreviewNotificationEnabled,
                    highPriorityBannerEnabled : bHighPriorityBannerEnabled
                });

                // If the user changed the enabling of preview notification - publish it
                if (bPreviewNotificationEnabled !== bOriginalPreviewNotificationEnabled) {
                    sap.ui.getCore().getEventBus().publish("sap.ushell.services.Notifications", "enablePreviewNotificationChanged", {bPreviewEnabled : bPreviewNotificationEnabled});
                }

                // Set the flags in "/originalFlags" with the values that were just saved
                // so the next time settings UI is opened - "/originalFlags" will contain the correct values
                this.getView().getModel().setProperty("/originalFlags/previewNotificationEnabled", bPreviewNotificationEnabled);
                this.getView().getModel().setProperty("/originalFlags/highPriorityBannerEnabled", bHighPriorityBannerEnabled);
            }
        },

        /**
         * Returning a boolean value indicating whether the two given rows (i.e. notification types) are identical or not,
         * The relevant properties that are being compared are the ID, and the flags that can be changed by the user
         */
        _identicalRows : function (row1, row2) {
            if ((row1.NotificationTypeId === row2.NotificationTypeId) &&
                    (row1.PriorityDefault === row2.PriorityDefault) &&
                    (row1.DoNotDeliver === row2.DoNotDeliver) &&
                    (row1.DoNotDeliverMob === row2.DoNotDeliverMob)) {
                return true;
            }
            return false;
        }
    });


}, /* bExport= */ false);
