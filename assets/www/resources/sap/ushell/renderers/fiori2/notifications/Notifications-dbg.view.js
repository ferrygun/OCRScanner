// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

/**
 * User notifications View.<br>
 * Located at the right pane of the ViewPortContainer.<br>
 * Includes the list of notifications that can be sorted according to different criteria.<br><br>
 *
 * The main UI controls in the view are:<br>
 *  sap.m.ScrollContainer {id: "notificationsScrollContainer"}<br>
 *  that includes sap.m.Panel {id: "notificationsSorter"} that contains the sorting header bar and the notifications list:<br>
 *    Panel header:  sap.m.Toolbar {id: "sortingToolbar"} that contains sap.m.Button objects, one for each sorting criterion.<br>
 *    Panel content: sap.m.List{id: "notificationsList"} that contains sap.m.NotificationListItem object for each notification object<br>
 */

sap.ui.define(['sap/m/NotificationListItem',
               'sap/m/BusyIndicator',
               'sap/m/Button',
               'sap/m/NotificationListGroup',
               'sap/m/List',
               'sap/m/IconTabFilter',
               'sap/m/IconTabBar',
               'sap/m/Text',
               'sap/m/VBox',
               'sap/m/CustomListItem'],
    function (NotificationListItem, BusyIndicator, Button, NotificationListGroup, List, IconTabFilter, IconTabBar, Text, VBox, CustomListItem) {
        "use strict";

        /*global jQuery, sap, document */
        /*jslint plusplus: true, nomen: true */

        sap.ui.jsview("sap.ushell.renderers.fiori2.notifications.Notifications", {
            createContent: function (oController) {
                var that = this;
                this.oBusyIndicator = new BusyIndicator('notificationsByTypeBusyIndicator', {size: "1rem"});
                this.oPreviousTabKey = "sapUshellNotificationIconTabByDate";
                this.oPreviousByDateSorting = undefined;
                // Define notification action button template
                this.oActionListItemTemplate = new Button({
                    text: "{ActionText}",
                    type: {
                        parts: ["Nature"],
                        formatter: function (nature) {
                            switch (nature) {
                            case "POSITIVE":
                                return "Accept";
                            case "NEGATIVE":
                                return "Reject";
                            default:
                                return "Default";
                            }
                        }
                    },
                    press: function (oEvent) {
                        that.actionButtonPressHandler(oEvent);
                    }
                });

                this.actionButtonPressHandler = function (oEvent) {
                    var sNotificationPathInModel = oEvent.getSource().getBindingContext().getPath(),
                        oNotificationModelPart = this.getModel().getProperty(sNotificationPathInModel),
                        aPathParts = sNotificationPathInModel.split("/"),
                        oTabBarSelectedKey = that.oIconTabBar.getSelectedKey(),
                        sPathToNotification = oTabBarSelectedKey === 'sapUshellNotificationIconTabByType' ? "/" + aPathParts[1] + "/" + aPathParts[2] + "/" + aPathParts[3] + "/" + aPathParts[4] : "/" + aPathParts[1] + "/" + aPathParts[2] + "/" + aPathParts[3],
                        oNotificationModelEntry = this.getModel().getProperty(sPathToNotification),
                        sNotificationId = oNotificationModelEntry.Id;

                    this.oPressActionEventPath = sNotificationPathInModel;
                    this.getModel().setProperty(sPathToNotification + "/Busy", true);

                    oController.executeAction(sNotificationId, oNotificationModelPart.ActionId).done(function (responseAck) {
                        if (responseAck && responseAck.isSucessfull) {
                            sap.ui.require(['sap/m/MessageToast'], function (MessageToast) {
                                if (responseAck.message && responseAck.message.length) {
                                    MessageToast.show(responseAck.message, {duration: 4000});
                                } else {
                                    var sActionModelPath = this.oPressActionEventPath,
                                        oActionModelObject = this.getModel().getProperty(sActionModelPath),
                                        sActionText = oActionModelObject.ActionText;

                                    MessageToast.show(sap.ushell.resources.i18n.getText("ActionAppliedToNotification", sActionText), {duration: 4000});
                                }
                            }.bind(this));

                            // Notification should remain in the UI (after action executed) only if DeleteOnReturn flag exists, and equals false
                            if (responseAck.DeleteOnReturn !== false) {
                                oController.removeNotificationFromModel(sNotificationId);

                                //There is need to load again the other 2 tabs, therefore we need to "clean"  other models.
                                oController.cleanModel();
                            }
                        } else {
                            if (responseAck) {
                                sap.ushell.Container.getService('Message').error(responseAck.message);
                            } else {
                                sap.ushell.Container.getService('Message').error(sap.ushell.resources.i18n.getText('notificationsFailedExecuteAction'));
                            }

                        }
                        this.getModel().setProperty(sPathToNotification + "/Busy", false);
                    }.bind(this)).fail(function () {
                        this.getModel().setProperty(sPathToNotification + "/Busy", false);
                        sap.ushell.Container.getService('Message').error(sap.ushell.resources.i18n.getText('notificationsFailedExecuteAction'));
                    }.bind(this));
                };

                this.oActionGroupItemTemplate = new Button({
                    text: "{GroupActionText}",
                    type: {
                        parts: ["Nature"],
                        formatter: function (nature) {
                            switch (nature) {
                            case "POSITIVE":
                                return "Accept";
                            case "NEGATIVE":
                                return "Reject";
                            default:
                                return "Default";
                            }
                        }
                    },
                    press: function (oEvent) {
                        var sNotificationPathInModel = this.getBindingContext().getPath(),
                            oNotificationModelPart = this.getModel().getProperty(sNotificationPathInModel),
                            aPathParts = sNotificationPathInModel.split("/"),
                            sPathToNotification = "/" + aPathParts[1] + "/" + aPathParts[2],
                            oNotificationModelEntry = this.getModel().getProperty(sPathToNotification),
                            aNotificationIdsInGroup = [];

                        if (oNotificationModelEntry.aNotifications) {
                            oNotificationModelEntry.aNotifications.forEach(function (item, index) {
                                aNotificationIdsInGroup.push(item.Id);
                                //display busy for the notification items.
                                this.getModel().setProperty(sPathToNotification + "/Busy", true);
                            }.bind(this));
                        }

                        //mark the notification group as busy
                        this.getModel().setProperty(sNotificationPathInModel + "/Busy", true);
                        oController.executeBulkAction(aNotificationIdsInGroup, oNotificationModelPart.ActionId, this.getProperty("text"), oNotificationModelEntry, sNotificationPathInModel, sPathToNotification);
                    }
                });
                this.addStyleClass('sapUshellNotificationsView');

                // Define notification list item template
                this.oNotificationListItemTemplate = new NotificationListItem({
                    press: function (oEvent) {
                        var oBindingContext = this.getBindingContext(),
                            oModelPath = oBindingContext.sPath,
                            oModelPart = this.getModel().getProperty(oModelPath),
                            sSemanticObject = oModelPart.NavigationTargetObject,
                            sAction = oModelPart.NavigationTargetAction,
                            aParameters = oModelPart.NavigationTargetParams,
                            sNotificationId = oModelPart.Id;
                        oController.onListItemPress.call(oController, sNotificationId, sSemanticObject, sAction, aParameters);
                    },
                    datetime: {
                        path: "CreatedAt",
                        formatter: sap.ushell.utils.formatDate.bind(oController)
                    },
                    description: "{SubTitle}",
                    title: {
                        parts: ["SensitiveText", "Text"],
                        formatter: function (sensitiveText, text) {
                            return sensitiveText ? sensitiveText : text;
                        }
                    },
                    buttons: {
                        path: "Actions",
                        templateShareable: true,
                        sorter: new sap.ui.model.Sorter('Nature', true),
                        template: this.oActionListItemTemplate
                    },
                    unread: {
                        parts: ["IsRead"],
                        formatter: function (isRead) {
                            return !isRead;
                        }
                    },
                    close: function (oEvent) {
                        var sNotificationPathInModel = this.getBindingContext().getPath(),
                            oNotificationModelEntry = this.getModel().getProperty(sNotificationPathInModel),
                            sNotificationId = oNotificationModelEntry.Id;
                        oController.dismissNotification(sNotificationId);
                    },
                    busy: {
                        parts: ["Busy"],
                        formatter: function (busy) {
                            if (busy) {
                                return busy;
                            }

                            return false;
                        }
                    },
                    priority: {
                        parts: ["Priority"],
                        formatter: function (priority) {
                            if (priority) {
                                priority = priority.charAt(0) + priority.substr(1).toLowerCase();
                                return sap.ui.core.Priority[priority];
                            }
                        }
                    }
                }).addStyleClass("sapUshellNotificationsListItem").addStyleClass('sapContrastPlus').addStyleClass('sapContrast');

                this.oNotificationGroupTemplate = new NotificationListGroup({
                    title: "{GroupHeaderText}",
                    collapsed: "{Collapsed}",
                    showEmptyGroup: true,
                    enableCollapseButtonWhenEmpty: true,
                    datetime: {
                        path: "CreatedAt",
                        formatter: sap.ushell.utils.formatDate.bind(oController)
                    },
                    buttons: {
                        path: "Actions",
                        templateShareable: true,
                        sorter: new sap.ui.model.Sorter('Nature', true),
                        template: this.oActionGroupItemTemplate
                    },
                    items: {
                        path: "aNotifications",
                        template: this.oNotificationListItemTemplate
                    },
                    onCollapse: function (oEvent) {
                        var group = oEvent.getSource(),
                            path = group.getBindingContext().getPath();
                        if (!group.getCollapsed()) {
                            that.getModel().setProperty(path + "/Busy", true);
                            that.expandedGroupIndex = path.substring(path.lastIndexOf("/") + 1);
                            oController.onExpandGroup(group);
                        }
                    },
                    close: function (oEvent) {
                        var sNotificationPathInModel = this.getBindingContext().getPath(),
                            aPathParts = sNotificationPathInModel.split("/"),
                            sPathToNotification = "/" + aPathParts[1] + "/" + aPathParts[2],
                            oNotificationModelEntry = this.getModel().getProperty(sPathToNotification),
                            aNotificationIdsInGroup = [];

                        oNotificationModelEntry.aNotifications.forEach(function (item, index) {
                            aNotificationIdsInGroup.push(item.Id);
                        });

                        oController.dismissBulkNotifications(aNotificationIdsInGroup, oNotificationModelEntry);
                    },
                    autoPriority: false,
                    priority: {
                        parts: ["Priority"],
                        formatter: function (priority) {
                            if (priority) {
                                priority = priority.charAt(0) + priority.substr(1).toLowerCase();
                                return sap.ui.core.Priority[priority];
                            }
                        }
                    },
                    busy: {
                        parts: ["Busy"],
                        formatter: function (busy) {
                            if (busy) {
                                return busy;
                            }

                            return false;
                        }
                    }
                });
                this.oNotificationsListDate = new List({
                    id: "sapUshellNotificationsListDate",
                    mode: sap.m.ListMode.None,
                    noDataText: sap.ushell.resources.i18n.getText('noNotificationsMsg'),
                    items: {
                        path: "/notificationsByDateDescending/aNotifications",
                        template: this.oNotificationListItemTemplate,
                        templateShareable: true
                    },
                    growing: true,
                    growingThreshold: 400,
                    growingScrollToLoad: true
                }).addStyleClass("sapUshellNotificationsList");

                this.oNotificationsListDate.onAfterRendering = function () {
                    oController.handleEmptyList();
                    this.oNotificationsListDate.$().parent().parent().scroll(this._triggerRetrieveMoreData.bind(that));

                    if (oController._oTopNotificationData) {
                        oController.scrollToItem(oController._oTopNotificationData);
                    }
                    this.oNotificationsListDate.addStyleClass('sapContrast sapContrastPlus');
                }.bind(this);




                this.oNotificationsListPriority = new List({
                    id: "sapUshellNotificationsListPriority",
                    mode: sap.m.ListMode.None,
                    noDataText: sap.ushell.resources.i18n.getText('noNotificationsMsg'),
                    items: {
                        path: "/notificationsByPriorityDescending/aNotifications",
                        template: this.oNotificationListItemTemplate,
                        templateShareable: true
                    },
                    growing: true,
                    growingThreshold: 400,
                    growingScrollToLoad: true
                }).addStyleClass("sapUshellNotificationsList");

                this.oNotificationsListPriority.onAfterRendering = function () {
                    oController.handleEmptyList();
                    this.oNotificationsListPriority.$().parent().parent().scroll(this._triggerRetrieveMoreData.bind(that));

                    if (oController._oTopNotificationData) {
                        oController.scrollToItem(oController._oTopNotificationData);
                    }
                    this.oNotificationsListPriority.addStyleClass('sapContrast sapContrastPlus');
                }.bind(this);


                /**
                 * Decides when to issue a request for more items (request next buffer) during scrolling.
                 *
                 * This function is called (repeatedly) during scroll, and calculated whether the top item on the screen
                 * is the item located two thirds of basicBuffer (meaning: two screens) from the end of the list.
                 * if so - then a request for the nect buffer is issued.
                 *
                 * @param path
                 */
                this.triggerRetrieveMoreData = function (path) {
                    if (!this.getModel().getProperty("/" + path + "/inUpdate")) {
                        var notificationsInModel = this.getController().getItemsFromModel(path),
                            numberOfNotificationsInModel = notificationsInModel ? notificationsInModel.length : 0,
                            bufferSize = numberOfNotificationsInModel ? this.getController().getBasicBufferSize() : 0,
                            numberOfItemsInTwoPage = bufferSize * 2 / 3,
                            indexOfElementInList = Math.floor(numberOfNotificationsInModel - numberOfItemsInTwoPage),
                            listItem = path === "notificationsByPriorityDescending" ? this.oNotificationsListPriority.getItems()[indexOfElementInList] : this.oNotificationsListDate.getItems()[indexOfElementInList],
                            topOffSet = this.getController().getTopOffSet();

                        if (listItem && listItem.getDomRef() && jQuery(listItem.getDomRef()).offset().top <= topOffSet) {
                            this.getController().getNextBuffer(path);
                        }
                    }
                };


                this.triggerRetrieveMoreDataForExpandedGroup = function () {
                    if (!this.getModel().getProperty("/notificationsByTypeDescending/inUpdate")) {
                        var
                            aGroupHeaders = this.getModel().getProperty("/notificationsByTypeDescending"),
                            iNumberOfGroupHeaders = aGroupHeaders.length,
                            iNumberOfItemsInOpenGroup = this.getModel().getProperty("/notificationsByTypeDescending")[this.expandedGroupIndex].aNotifications.length,
                            numberOfNotificationsInModel = iNumberOfItemsInOpenGroup + iNumberOfGroupHeaders,
                            bufferSize = numberOfNotificationsInModel ? this.getController().getBasicBufferSize() : 0,
                            numberOfItemsInTwoPage = bufferSize * 2 / 3,
                            indexOfElementInList = Math.floor(numberOfNotificationsInModel - numberOfItemsInTwoPage),
                            listItem = this.oNotificationsListType.getItems()[this.expandedGroupIndex].getItems()[indexOfElementInList],
                            topOffSet = this.getController().getTopOffSet();

                        if (listItem && listItem.getDomRef() && jQuery(listItem.getDomRef()).offset().top <= topOffSet) {
                            oController.getNextBufferForType();
                        }
                    }
                };


                this._triggerRetrieveMoreData = function () {
                    this.triggerRetrieveMoreData(oController.sCurrentSorting);
                };

                this.oNotificationsListType = new List({
                    id: "sapUshellNotificationsListType",
                    mode: sap.m.ListMode.SingleSelect,
                    noDataText: sap.ushell.resources.i18n.getText('noNotificationsMsg'),
                    items: {
                        path: "/notificationsByTypeDescending",
                        template: that.oNotificationGroupTemplate,
                        templateShareable: true
                    }
                }).addStyleClass("sapUshellNotificationsList")
                    .addStyleClass('sapContrastPlus')
                    .addStyleClass('sapContrast');

                this.oNotificationsListType.onAfterRendering = function () {
                    this.oNotificationsListType.$().parent().parent().scroll(this.triggerRetrieveMoreDataForExpandedGroup.bind(that));
                }.bind(this);

                var oIconTabFilterbByDate = new IconTabFilter({
                    id: "sapUshellNotificationIconTabByDate",
                    key: "sapUshellNotificationIconTabByDate",
                    text: sap.ushell.resources.i18n.getText('notificationsSortByDate'),
                    tooltip: sap.ushell.resources.i18n.getText('notificationsSortByDateDescendingTooltip')
                });

                var oIconTabFilterbByType = new IconTabFilter({
                    id: "sapUshellNotificationIconTabByType",
                    key: "sapUshellNotificationIconTabByType",
                    text: sap.ushell.resources.i18n.getText('notificationsSortByType'),
                    tooltip: sap.ushell.resources.i18n.getText('notificationsSortByTypeTooltip'),
                    content: this.oNotificationsListType
                });
                var oIconTabFilterbByPrio = new IconTabFilter({
                    id: "sapUshellNotificationIconTabByPrio",
                    key: "sapUshellNotificationIconTabByPrio",
                    text: sap.ushell.resources.i18n.getText('notificationsSortByPriority'),
                    tooltip: sap.ushell.resources.i18n.getText('notificationsSortByPriorityTooltip')
                });

                this.oIconTabBar = new IconTabBar('notificationIconTabBar', {
                    backgroundDesign: sap.m.BackgroundDesign.Transparent,
                    expandable: false,
                    selectedKey: "sapUshellNotificationIconTabByDate",
                    items: [
                        oIconTabFilterbByDate,
                        oIconTabFilterbByType,
                        oIconTabFilterbByPrio
                    ],
                    select: function (evt) {
                        var key = evt.getParameter("key"),
                            tabFilter = evt.getParameter("item");

                        if (key === "sapUshellNotificationIconTabByDate") {
                            // If the previous tab was ByDate descending
                            // or if the last time ByDate was visited (i.e. oPreviousTabKey is not ByDate) - it was ByDate ascending
                            // - then it should now be ascending
                            if (((that.oPreviousTabKey === "sapUshellNotificationIconTabByDate") && ((that.oPreviousByDateSorting === that.oController.oSortingType.NOTIFICATIONS_BY_DATE_DESCENDING) || that.oPreviousByDateSorting === undefined)) ||
                                    ((that.oPreviousTabKey !== "sapUshellNotificationIconTabByDate") && (that.oPreviousByDateSorting === that.oController.oSortingType.NOTIFICATIONS_BY_DATE_ASCENDING))) {
                                that.oController.sCurrentSorting = that.oController.oSortingType.NOTIFICATIONS_BY_DATE_ASCENDING;
                                tabFilter.setTooltip(sap.ushell.resources.i18n.getText('notificationsSortByDateAscendingTooltip'));
                                that.oNotificationsListDate.bindItems("/notificationsByDateAscending/aNotifications", that.oNotificationListItemTemplate);
                                if (oController.getItemsFromModel(oController.oSortingType.NOTIFICATIONS_BY_DATE_ASCENDING).length === 0) {
                                    oController.getNextBuffer(oController.oSortingType.NOTIFICATIONS_BY_DATE_ASCENDING);
                                }
                                that.oPreviousByDateSorting = that.oController.oSortingType.NOTIFICATIONS_BY_DATE_ASCENDING;
                            } else {
                                that.oController.sCurrentSorting = that.oController.oSortingType.NOTIFICATIONS_BY_DATE_DESCENDING;
                                tabFilter.setTooltip(sap.ushell.resources.i18n.getText('notificationsSortByDateDescendingTooltip'));
                                that.oNotificationsListDate.bindItems("/notificationsByDateDescending/aNotifications", that.oNotificationListItemTemplate);
                                if (oController.getItemsFromModel(oController.oSortingType.NOTIFICATIONS_BY_DATE_DESCENDING).length === 0) {
                                    oController.getNextBuffer(oController.oSortingType.NOTIFICATIONS_BY_DATE_DESCENDING);
                                }
                                that.oPreviousByDateSorting = that.oController.oSortingType.NOTIFICATIONS_BY_DATE_DESCENDING;
                            }
                            that.oPreviousTabKey = "sapUshellNotificationIconTabByDate";
                        } else if (key === "sapUshellNotificationIconTabByType" && that.oPreviousTabKey !== "sapUshellNotificationIconTabByType") {
                            that.oController.sCurrentSorting = that.oController.oSortingType.NOTIFICATIONS_BY_TYPE_DESCENDING;
                            that.getController().reloadGroupHeaders();
                            tabFilter.removeAllContent();
                            tabFilter.addContent(that.oBusyIndicator);
                            that.oIconTabBar.addStyleClass('sapUshellNotificationIconTabByTypeWithBusyIndicator');
                            that.oPreviousTabKey = "sapUshellNotificationIconTabByType";
                        } else { //by Priority
                            that.oController.sCurrentSorting = that.oController.oSortingType.NOTIFICATIONS_BY_PRIORITY_DESCENDING;
                            if (oController.getItemsFromModel(oController.oSortingType.NOTIFICATIONS_BY_PRIORITY_DESCENDING).length === 0) {
                                oController.getNextBuffer(oController.oSortingType.NOTIFICATIONS_BY_PRIORITY_DESCENDING);
                            }
                            that.oPreviousTabKey = "sapUshellNotificationIconTabByPrio";
                        }
                        that.oPreviousTabKey = key;
                    }
                }).addStyleClass('sapUshellNotificationTabBar');
                this.oIconTabBar.addEventDelegate({
                    onsaptabprevious: function (oEvent) {
                        var oOriginalElement = oEvent.originalEvent,
                            oSourceElement = oOriginalElement.srcElement,
                            aClassList = oSourceElement.classList,
                            bIncludesClass;

                        bIncludesClass = jQuery.inArray('sapMITBFilter', aClassList) > -1;
                        if (bIncludesClass === true) {
                            oEvent.preventDefault();
                            sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                            sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                        }
                    }
                });

                var origTabBarAfterRendering = this.oIconTabBar.onAfterRendering;
                this.oIconTabBar.onAfterRendering = function () {
                    if (origTabBarAfterRendering) {
                        origTabBarAfterRendering.apply(this, arguments);
                    }
                    var oTabBarHeader = sap.ui.getCore().byId('notificationIconTabBar--header');
                    if (oTabBarHeader) {
                        oTabBarHeader.addStyleClass('sapContrastPlus');
                        oTabBarHeader.addStyleClass('sapUshellTabBarHeader');
                    }
                };

                return [this.oIconTabBar];
            },
            getMoreCircle: function (sType) {
                var oMoreText = new Text({text: sap.ushell.resources.i18n.getText('moreNotifications')}),
                    oNotificationCountText = new Text({text: ""}).addStyleClass("sapUshellNotificationsMoreCircleCount"),
                    oMoreCircle = new VBox({
                        items: [oNotificationCountText, oMoreText],
                        alignItems: sap.m.FlexAlignItems.Center
                    }).addStyleClass("sapUshellNotificationsMoreCircle"),
                    oBelowCircleTextPart1 = new Text({
                        text: sap.ushell.resources.i18n.getText('moreNotificationsAvailable_message'),
                        textAlign: "Center"
                    }).addStyleClass("sapUshellNotificationsMoreHelpingText"),
                    oBelowCircleTextPart2 = new Text({
                        text: sap.ushell.resources.i18n.getText('processNotifications_message'),
                        textAlign: "Center"
                    }).addStyleClass("sapUshellNotificationsMoreHelpingText"),
                    oVBox = new VBox({
                        items: [oMoreCircle, oBelowCircleTextPart1, oBelowCircleTextPart2]
                    }).addStyleClass("sapUshellNotificationsMoreVBox"),
                    oListItem = new CustomListItem({
                        type: sap.m.ListType.Inactive,
                        content: oVBox
                    }).addStyleClass("sapUshellNotificationsMoreListItem").addStyleClass('sapContrastPlus');

                oNotificationCountText.setModel(this.getModel());
                oNotificationCountText.bindText("/" + sType + "/moreNotificationCount");
                this.oMoreListItem = oListItem;
                return oListItem;
            },
            getControllerName: function () {
                return "sap.ushell.renderers.fiori2.notifications.Notifications";
            }
        });
    }, /* bExport= */ true);
