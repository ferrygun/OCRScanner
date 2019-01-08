// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

/**
 * Notification settings View.<br>
 * The View contains a sap.m.VBox, including:<br>
 *  - A header that includes two switch controls for the "DoNotDisturb" and "EnableNotificationsPreview" features<br>
 *  - A table of notification types, allowing the user to set presentation-related properties<br>
 */
sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap, document */
    /*jslint plusplus: true, nomen: true */

    sap.ui.jsview("sap.ushell.renderers.fiori2.notifications.Settings", {

        /**
         * The content of the View:
         * - Notification types settings table
         * - Switch buttons bar (i.e. the header)
         * Both controls are put in a sap.m.VBox
         */
        createContent: function (oController) {
            var that = this,
                oNotificationTypeTable,
                oTableRowTemplate,
                oSwitchButtonsBar,
                oVBox,
                oHeaderVBox,
                oResourceBundle = sap.ushell.resources.i18n;

            oNotificationTypeTable = new sap.m.Table("notificationSettingsTable", {
                backgroundDesign: sap.m.BackgroundDesign.Transparent,
                showSeparators: sap.m.ListSeparators.All,
                columns: [
                    new sap.m.Column({
                        header: new sap.m.Text({
                            text : oResourceBundle.getText("notificationType_column"),
                            tooltip: oResourceBundle.getText("notificationType_columnTooltip")
                        }),
                        vAlign : "Middle",
                        hAlign : "Left"
                    }),
                    new sap.m.Column({
                        header: new sap.m.Text({
                            text : oResourceBundle.getText("iOSNotification_column"),
                            tooltip : oResourceBundle.getText("iOSNotification_columnTooltip")
                        }),
                        visible: "{/flags/mobileNotificationsEnabled}",
                        // When the screen size is smaller than Tablet -
                        // the cells of this column should be placed under the cells of the previous column
                        minScreenWidth : "Tablet",
                        demandPopin : true,
                        vAlign : "Middle",
                        hAlign : "Left"
                    }),
                    new sap.m.Column({
                        header: new sap.m.Text({
                            text : oResourceBundle.getText("highNotificationsBanner_column"),
                            tooltip : oResourceBundle.getText("highNotificationsBanner_columnTooltip")
                        }),
                        // When the screen size is smaller than Tablet -
                        // the cells of this column should be placed under the cells of the previous column
                        minScreenWidth : "Tablet",
                        demandPopin : true,
                        hAlign : "Left"
                    }),
                    new sap.m.Column({
                        header: new sap.m.Text({
                            text : oResourceBundle.getText("Notifications_Settings_Show_Type_column"),
                            tooltip : oResourceBundle.getText("notificationTypeEnable_columnTooltip")
                        }),
                        vAlign : "Middle",
                        hAlign : "Left"
                    })
                ]
            });

            // Arrange the table columns according to the cells content width
            oNotificationTypeTable.setFixedLayout(false);

            oTableRowTemplate = new sap.m.ColumnListItem({
                cells : [
                    new sap.m.Label({
                        text : "{NotificationTypeDesc}"
                    }),
                    new sap.m.CheckBox({
                        selected: {
                            parts: ["DoNotDeliverMob"],
                            formatter : function (bDoNotDeliverMob) {
                                return !bDoNotDeliverMob;
                            }
                        },
                        select: function (oEvent) {
                            that.getController().setControlDirtyFlag.apply(this);
                            var sPath = oEvent.getSource().getBindingContext().sPath;
                            if (oEvent.mParameters.selected === true) {
                                that.getModel().setProperty(sPath + "/DoNotDeliverMob", false);
                            } else {
                                that.getModel().setProperty(sPath + "/DoNotDeliverMob", true);
                            }
                        }
                    }),
                    new sap.m.CheckBox({
                        // When the "High Priority" property is checked - the value in the model should be "40-HIGH".
                        // when it is unchecked - - the value in the model should be an empty string.
                        select: function (oEvent) {
                            that.getController().setControlDirtyFlag.apply(this);
                            var sPath = oEvent.getSource().getBindingContext().sPath;
                            if (oEvent.mParameters.selected === true) {
                                that.getModel().setProperty(sPath + "/PriorityDefault", "40-HIGH");
                            } else {
                                that.getModel().setProperty(sPath + "/PriorityDefault", "");
                            }
                        },
                        selected: {
                            parts: ["PriorityDefault"],
                            // The checkbox for PriorityDefault should be checked when the priority of the corresponding
                            // ...notification type is HIGH (i.e. the string "40-HIGH"), and unchecked otherwise
                            formatter : function (sPriorityDefault) {
                                that.getController().setControlDirtyFlag.apply(this);
                                if (sPriorityDefault === "40-HIGH") {
                                    return true;
                                }
                                return false;
                            }
                        }
                    }),
                    new sap.m.Switch({
                        state: {
                            parts: ["DoNotDeliver"],
                            formatter : function (bDoNotDeliver) {
                                return !bDoNotDeliver;
                            }
                        },
                        customTextOn: " ",
                        customTextOff: " ",
                        select: function (oEvent) {
                            that.getController().setControlDirtyFlag.apply(this);
                        },
                        change: function (oEvent) {
                            var bNewState = oEvent.getParameter("state"),
                                sPath = oEvent.getSource().getBindingContext().sPath;

                            that.getModel().setProperty(sPath + "/DoNotDeliver", !bNewState);
                            that.getController().setControlDirtyFlag.apply(this);
                        }
                    })
                ]
            });

            oNotificationTypeTable.bindAggregation("items", {
                path : "/rows",
                template: oTableRowTemplate,
                // Table rows (i.e. notification types) are sorted by type name, which is the NotificationTypeDesc field
                sorter: new sap.ui.model.Sorter("NotificationTypeDesc")
            });

            // The main container in the View.
            // Contains the header (switch flags) and the notification types table
            oVBox = new sap.m.VBox();

            // Create the header, which is a sap.m.Bar that contain two switch controls
            oSwitchButtonsBar = this.createSwitchControlBar();

            // Create wrapper to the switch button in order to support belize plus theme
            oHeaderVBox = new sap.m.VBox();
            oHeaderVBox.addStyleClass("sapContrastPlus");
            oHeaderVBox.addItem(oSwitchButtonsBar);

            oVBox.addItem(oHeaderVBox);
            oVBox.addItem(oNotificationTypeTable);

            return [oVBox];
        },

       /**
        * Creates and returns a UI control (sap.m.Bar)
        * that contains the DoNotDisturb and EnablePreview switch controls and labels.
        * The switch control for enabling/disabling notifications preview is created and added
        *  only when preview is configured as enabled and the device screen is wide enough for presenting the preview
        *
        * @returns sap.m.HBox containing the switch controls that appear at the top part of the settings UI
        */
        createSwitchControlBar : function () {
            var oDoNotDisturbSwitch,
                oDoNotDisturbLabel,
                oDoNotDisturbHBox,
                oPreviewSwitch,
                oEnablePreviewLabel,
                oEnablePreviewHBox,
                oSwitchButtonsBar,
                oResourceBundle = sap.ushell.resources.i18n,
                oDevice = sap.ui.Device.system,
                bEligibleDeviceForPreview = oDevice.desktop || oDevice.tablet || oDevice.combi,
                oNotificationsService = sap.ushell.Container.getService("Notifications");

           oSwitchButtonsBar = new sap.m.FlexBox('notificationSettingsSwitchBar');

            oDoNotDisturbSwitch = new sap.m.Switch("doNotDisturbSwitch", {
                tooltip: oResourceBundle.getText("showAlertsForHighNotifications_tooltip"),
                state: "{/flags/highPriorityBannerEnabled}",
                customTextOn : " ",
                customTextOff : " ",
                mode: sap.ui.model.BindingMode.TwoWay
            });

            oDoNotDisturbLabel = new sap.m.Label("doNotDisturbLabel", {
                text : oResourceBundle.getText("Show_High_Priority_Alerts_title")
            });

            oDoNotDisturbHBox = new sap.m.HBox("notificationDoNotDisturbHBox",{
                items: [
                   oDoNotDisturbSwitch,
                   oDoNotDisturbLabel
                ]
            });

            oSwitchButtonsBar.addItem(oDoNotDisturbHBox);

            if (bEligibleDeviceForPreview === true) {
                oPreviewSwitch = new sap.m.Switch("enablePreviewSwitch", {
                    tooltip: oResourceBundle.getText("showNotificationsPreview_tooltip"),
                    state: "{/flags/previewNotificationEnabled}",
                    customTextOn : " ",
                    customTextOff : " ",
                    mode: sap.ui.model.BindingMode.TwoWay
                });

                oEnablePreviewLabel = new sap.m.Label("enablePreviewLabel", {
                    text : oResourceBundle.getText("Show_Preview_in_Home_Page_title")
                });

                oEnablePreviewHBox = new sap.m.FlexBox({
                    items: [
                        oPreviewSwitch,
                        oEnablePreviewLabel
                    ]
                });
                oSwitchButtonsBar.addItem(oEnablePreviewHBox);
            }
            return oSwitchButtonsBar;
        },

        /**
         * Creates and returns the UI that is shown in the settings view in case that no Notification type rows are available.<br>
         * The UI consists of a sap.m.VBox, in which the is an icon, a message header (text), and the actual text message.   
         */
        getNoDataUI: function () {
            var oNoDataVBox,
                oNoDataIcon,
                oNoDataHeaderLabel,
                oNoDataLabel,
                oResourceBundle = sap.ushell.resources.i18n;

            if (oNoDataVBox === undefined) {

                oNoDataIcon = new sap.ui.core.Icon("notificationSettingsNoDataIcon", {
                    size: "5rem",
                    src: "sap-icon://message-information"
                });
                oNoDataHeaderLabel = new sap.m.Text("notificationSettingsNoDataTextHeader", {
                    text : oResourceBundle.getText("noNotificationTypesEnabledHeader_message")
                }).setTextAlign(sap.ui.core.TextAlign.Center);
                oNoDataLabel = new sap.m.Text("notificationSettingsNoDataText", {
                    text : oResourceBundle.getText("noNotificationTypesEnabled_message")
                }).setTextAlign(sap.ui.core.TextAlign.Center);

                oNoDataVBox = new sap.m.VBox("notificationSettingsNoDataInnerBox", {
                    items: [
                        oNoDataIcon,
                        oNoDataHeaderLabel,
                        oNoDataLabel
                    ]
                });
            }
            return oNoDataVBox;
        },
        getControllerName: function () {
            return "sap.ushell.renderers.fiori2.notifications.Settings";
        }
    });


}, /* bExport= */ false);
