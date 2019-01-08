// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(['sap/ushell/utils'],
	function(utils) {
	"use strict";

    /*global jQuery, sap, console, window, hasher*/
    /*jslint plusplus: true, nomen: true*/
    sap.ui.controller("sap.ushell.renderers.fiori2.notifications.Notifications", {

        oPagingConfiguration: {
            MAX_NOTIFICATION_ITEMS_DESKTOP: 400,
            MAX_NOTIFICATION_ITEMS_MOBILE: 100,
            MIN_NOTIFICATION_ITEMS_PER_BUFFER: 15,
            // Approximate height of notification item according to the device
            NOTIFICATION_ITEM_HEIGHT: (sap.ui.Device.system.phone || sap.ui.Device.system.tablet) ? 130 : 100,
            // Approximate height of the area above the notifications list
            TAB_BAR_HEIGHT: 100
        },

        /**
         * Initializing Notifications view/controller with ByDate/descending tab in front
         *
         * Main steps:
         * 1. The model is filled with an entry (all properties are initially empty) for each sorting type
         * 2. Gets first buffer of notification items ByDate/descending
         * 3. Sets the first data buffer to the model
         */
        onInit: function () {
            var oInitialModelStructure = {};

            this.iMaxNotificationItemsForDevice = sap.ui.Device.system.desktop ? this.oPagingConfiguration.MAX_NOTIFICATION_ITEMS_DESKTOP : this.oPagingConfiguration.MAX_NOTIFICATION_ITEMS_MOBILE;

            this.oNotificationsService = sap.ushell.Container.getService("Notifications");
            this.oSortingType = this.oNotificationsService.getOperationEnum();

            oInitialModelStructure[this.oSortingType.NOTIFICATIONS_BY_DATE_DESCENDING] = this.getInitialSortingModelStructure();
            oInitialModelStructure[this.oSortingType.NOTIFICATIONS_BY_DATE_ASCENDING] = this.getInitialSortingModelStructure();
            oInitialModelStructure[this.oSortingType.NOTIFICATIONS_BY_PRIORITY_DESCENDING] = this.getInitialSortingModelStructure();
            oInitialModelStructure[this.oSortingType.NOTIFICATIONS_BY_TYPE_DESCENDING] = {};

            this.sCurrentSorting = this.oSortingType.NOTIFICATIONS_BY_DATE_DESCENDING;

            //  For byType sorting: keeps the currently expended group/Notification type
            this.sCurrentExpandedType = undefined;

            var oModel = new sap.ui.model.json.JSONModel(oInitialModelStructure);
            oModel.setSizeLimit(1500);
            // Initializing the model with a branch for each sorting type
            this.getView().setModel(oModel);

            // Get the first buffer of notification items, byDate (descending)
            this.getNextBuffer();

            this._oTopNotificationData = undefined;
        },
        /*
         * check if the get next buffer should fetch more notifications
         */
        shouldFetchMoreNotifications: function () {
            var bHasMoreItemsInBackend = this.getView().getModel().getProperty("/" + this.sCurrentSorting + "/hasMoreItemsInBackend"),
                bListMaxReached = this.getView().getModel().getProperty("/" + this.sCurrentSorting + "/listMaxReached");
            return bHasMoreItemsInBackend && !bListMaxReached;
        },
        /**
         * Gets a buffer of notification items from notification service, according to the current sorting type
         */
        getNextBuffer: function () {
            var aCurrentItems = this.getItemsFromModel(this.sCurrentSorting),
                iNumberOfItemsInModel,
                oPromise,
                iNumberOfItemsToFetch;


            if (!this.shouldFetchMoreNotifications()) {
                return;
            }

            iNumberOfItemsToFetch = this.getNumberOfItemsToFetchOnScroll();
            if (iNumberOfItemsToFetch === 0) {
                this.getView().getModel().setProperty("/" + this.sCurrentSorting + "/hasMoreItems", false);
                return;
            }

            if (aCurrentItems !== undefined) {
                iNumberOfItemsInModel = aCurrentItems.length;
            }

            if (iNumberOfItemsInModel === 0) {
                this.addBusyIndicatorToTabFilter(true);
            }

            this.getView().getModel().setProperty("/" + this.sCurrentSorting + "/inUpdate", true);

            // Fetch a buffer of notification items from notification service
            oPromise = this.oNotificationsService.getNotificationsBufferBySortingType(this.sCurrentSorting, iNumberOfItemsInModel, iNumberOfItemsToFetch);

            oPromise.done(function (oResult) {
                var dNotificationsUserSettingsAvalaibility = this.oNotificationsService._getNotificationSettingsAvalability();
                if(dNotificationsUserSettingsAvalaibility.state()=="pending"){
                    this.oNotificationsService._userSettingInitialization();
                }
                this.addBufferToModel(oResult);
            }.bind(this));

            oPromise.fail(function (oResult) {
                if (iNumberOfItemsInModel === 0) {
                    this.handleError();
                }
            }.bind(this));
        },
        /**
         * Gets a buffer of notification items of specific type from notification service
         */
        getNextBufferForType: function () {
            var selectedTypeId = this.sCurrentExpandedType,
                sSotringType = this.oSortingType.NOTIFICATIONS_BY_TYPE_DESCENDING,
                oGroup = this.getGroupFromModel(selectedTypeId),
                aCurrentItems = oGroup ? oGroup.aNotifications : undefined,
                iNumberOfItemsInModel = 0,
                oPromise,
                bHasMoreItems = oGroup.hasMoreItems;

            // If there are no more notification items (in the backend) for this sorting type - then return
            if (!bHasMoreItems) {
                return;
            }
            if (aCurrentItems !== undefined) {
                iNumberOfItemsInModel = aCurrentItems.length;
            }

            this.getView().getModel().setProperty("/" + sSotringType + "/inUpdate", true);

            // Fetch a buffer of notification items from notification service
            oPromise = this.oNotificationsService.getNotificationsBufferInGroup(selectedTypeId, iNumberOfItemsInModel, this.getBasicBufferSize());

            oPromise.done(function (oResult) {
                this.addTypeBufferToModel(selectedTypeId, oResult, false);
            }.bind(this));

            oPromise.fail(function (oResult) {
                this.getNextBufferFailHandler(sSotringType);
            }.bind(this));
        },
        addTypeHeadersToModel: function (oResult) {
            var aCurrentHeadersItems = this.getItemsFromModel(this.oSortingType.NOTIFICATIONS_BY_TYPE_DESCENDING),
                iCurrentNumberOfItems = aCurrentHeadersItems.length,
                oResultArr;

            this._oTopNotificationData = undefined;

            if (!oResult) {
                return;
            }
            oResultArr = JSON.parse(oResult).value;
            oResultArr.forEach(function (item, index) {
                item.hasMoreItems = true;
                item.aNotifications = [{"Id": "temp"}];
            });
            this.getView().getModel().setProperty("/" + this.oSortingType.NOTIFICATIONS_BY_TYPE_DESCENDING + "/aGroupHeaders", oResultArr);
            this.getView().getModel().setProperty("/" + this.oSortingType.NOTIFICATIONS_BY_TYPE_DESCENDING + "/inUpdate", false);

            // If this is the first time that items are fetched for this tab\sorting type (no old items) -
            // then the busy indicator was rendered and now needs to be removed
            if (iCurrentNumberOfItems === 0) {
                this.removeBusyIndicatorToTabFilter(false);
            }
        },

        /**
         * Adds a new buffer of notification items to the model in the correct model path according to the specific sorting type.
         * The hasMoreItems flag indicates whether the number of returned items is smaller than the size of the requested buffer,
         *  if so (i.e. oResultObj.value.length < getNumberOfItemsToFetchOnScroll) then there are no more items in the beckend for this sorting type.
         *
         * @param sSotringOption A string representing both the sorting type and the model path to which the new data should be inserted
         * @param oResult The data (notification items) to insert to the model
         */
        addBufferToModel: function (oResult) {
            var aCurrentItems = this.getItemsFromModel(this.sCurrentSorting),
                iCurrentNumberOfItems = aCurrentItems.length,
                mergedArrays,
                hasMoreItems = oResult.length >= this.getNumberOfItemsToFetchOnScroll();

            this._oTopNotificationData = undefined;

            if (!oResult) {
                this.getView().getModel().setProperty("/" + this.sCurrentSorting + "/hasMoreItemsInBackend", false);
                return;
            }

            // If the number of returned items is smaller than the number that was requested -
            // it means that there is no more data (i.e. notification items) in the backend that needs to be fetched for this sorting type

            this.getView().getModel().setProperty("/" + this.sCurrentSorting + "/hasMoreItemsInBackend", hasMoreItems);

            mergedArrays = aCurrentItems.concat(oResult);
            this.getView().getModel().setProperty("/" + this.sCurrentSorting + "/aNotifications", mergedArrays);
            this.getView().getModel().setProperty("/" + this.sCurrentSorting + "/inUpdate", false);
            if (mergedArrays.length >= this.iMaxNotificationItemsForDevice) {
                this.handleMaxReached();
            }

            // If this is the first time that items are fetched for this tab\sorting type (no old items) -
            // then the busy indicator was rendered and now needs to be removed
            if (iCurrentNumberOfItems === 0) {
                this.removeBusyIndicatorToTabFilter(true);
            }
        },
        /**
         * Adds a new buffer of notification items to the model in the correct type and path according to the type.
         * The hasMoreItems flag indicates whether the number of returned items is smaller than the size of the requested buffer,
         *  if so (i.e. oResultObj.value.length < getBasicBufferSize()) then there are no more items in the beckend for this sorting type.
         *
         * @param sTypeId A string representing both the type Id
         * @param oResult The data (notification items) to insert to the type model
         */
        addTypeBufferToModel: function (sTypeId, oResult, bOverwrite) {
            var oGroup = this.getGroupFromModel(sTypeId),
                oGroupIndexInModel = this.getGroupIndexFromModel(sTypeId),
                aGroupHeaders = this.getView().getModel().getProperty("/" + this.oSortingType.NOTIFICATIONS_BY_TYPE_DESCENDING ),
                mergedArrays;

            if (!oResult) {
                return;
            }
            // If the number of returned items is smaller than the number that was requested -
            // it means that there is no more data (i.e. notification items) in the backend that needs to be fetched for this sorting type
            // if (oResultObj.value.length < this.getBasicBufferSize()) {
            if (oResult.length < this.getBasicBufferSize()) {
                oGroup.hasMoreItems = false;
            }
            //mergedArrays = aCurrentItems.concat(oResultObj.value);
            if (!oGroup.aNotifications || bOverwrite) {
                oGroup.aNotifications = [];
            }
            mergedArrays = oGroup.aNotifications.concat(oResult);
            aGroupHeaders[oGroupIndexInModel].aNotifications = mergedArrays;
            aGroupHeaders[oGroupIndexInModel].Busy = false;

            this.getView().getModel().setProperty("/" + this.oSortingType.NOTIFICATIONS_BY_TYPE_DESCENDING, aGroupHeaders);
            this.getView().getModel().setProperty("/" + this.oSortingType.NOTIFICATIONS_BY_TYPE_DESCENDING + "/inUpdate", false);

        },

        keydownHandler: function (keyup, bFocusPassedFirstTime) {
            var jqElement,
                nextElem,
                closeBtn;

            switch (keyup.keyCode) {
            case jQuery.sap.KeyCodes.DELETE: // Delete
                jqElement = jQuery(document.activeElement);
                if (jqElement.hasClass('sapUshellNotificationsListItem')) {
                    nextElem = jqElement.next();
                    closeBtn = jqElement.find(".sapMNLB-CloseButton")[0];
                    sap.ui.getCore().byId(closeBtn.id).firePress();

                    //set focus on the next list item.
                    if (nextElem) {
                        nextElem.focus();
                    }
                }
                break;
            }
        },

        /**
         * Called by notification service for handling notifications update
         *
         * - Registered as callback using a call to this.oNotificationsService.registerNotificationsUpdateCallback
         * - Called by Notifications service when updated notifications data is obtained
         * - Gets the updated notifications array and sets the model accordingly
         */
        notificationsUpdateCallback: function (oDependenciesDeferred) {
            var that = this,
                aCurrentItems,
                iNumberOfItemsInModel,
                iNumberOfItemsToFetch;

            if (this.sCurrentSorting === this.oSortingType.NOTIFICATIONS_BY_TYPE_DESCENDING) {
                this.notificationsUpdateCallbackForType();

                // If there is any flow in any module that depends on this flow - release it
                // see notification service private API registerDependencyNotificationsUpdateCallback
                oDependenciesDeferred.resolve();
                return;
            }

            aCurrentItems = this.getItemsFromModel(this.sCurrentSorting);
            if (aCurrentItems !== undefined) {
                iNumberOfItemsInModel = aCurrentItems.length;
            }


            // On update, only the current tab/sorting should maintain its previous data, while other tabs (i.e. the model branch) should be emptied
            this.cleanModel();

            iNumberOfItemsToFetch = this.getNumberOfItemsToFetchOnUpdate(iNumberOfItemsInModel);

            this.oNotificationsService.getNotificationsBufferBySortingType(this.sCurrentSorting, 0, iNumberOfItemsToFetch).done(function (aNotifications) {

                if (!aNotifications) {
                    return;
                }

                // If there is any flow in any module that depends on this flow - release it
                // see notification service private API registerDependencyNotificationsUpdateCallback
                oDependenciesDeferred.resolve();

                // Updating the model with the updated array of notification objects
                that.replaceItemsInModel(aNotifications, iNumberOfItemsToFetch);

            }).fail(function (data) {
                jQuery.sap.log.error("Notifications control - call to notificationsService.getNotificationsBufferBySortingType failed: ",
                    data,
                    "sap.ushell.renderers.fiori2.notifications.Notifications");
            });
        },
        getSelectedList: function () {
            var oSelectedList;
            if (this.sCurrentSorting === this.oSortingType.NOTIFICATIONS_BY_PRIORITY_DESCENDING) {
                oSelectedList = this.getView().oNotificationsListPriority;
            } else {
                oSelectedList = this.getView().oNotificationsListDate;
            }
            return oSelectedList;
        },
        isMoreCircleExist: function () {
            var oSelectedList = this.getSelectedList(),
                iItemsLength = oSelectedList.getItems().length,
                oLastItem = oSelectedList.getItems()[iItemsLength-1];
            return !!iItemsLength && oLastItem.getMetadata().getName() === "sap.m.CustomListItem";
        },
        handleMaxReached: function () {
            var oSelectedList = this.getSelectedList(),
                iNotificationCount = Math.floor(this.oNotificationsService.getNotificationsCount()),
                iMoreNotificationsNumber = iNotificationCount - this.iMaxNotificationItemsForDevice,
                bIsMoreCircleExist = this.isMoreCircleExist();

            this.getView().getModel().setProperty("/" + this.sCurrentSorting + "/moreNotificationCount", iMoreNotificationsNumber);
            this.getView().getModel().setProperty("/" + this.sCurrentSorting + "/listMaxReached", iMoreNotificationsNumber >= 0);
            if (iMoreNotificationsNumber > 0 && !bIsMoreCircleExist) {
                oSelectedList.addItem(this.getView().getMoreCircle(this.sCurrentSorting));
            } else if (iMoreNotificationsNumber <= 0 && bIsMoreCircleExist) {
                oSelectedList.removeItem(this.getView().oMoreListItem);
            }

        },
        reAddFailedGroup: function (oGroupToAdd) {
            var oModel = this.getView().getModel(),
                aGroups = oModel.getProperty('/notificationsByTypeDescending');

            aGroups.splice(oGroupToAdd.removedGroupIndex, 0, oGroupToAdd.oGroup);
            oModel.setProperty('/notificationsByTypeDescending', aGroups);
        },

        removeGroupFromModel: function (oGroupToDelete) {
            var oModel = this.getView().getModel(),
                aGroups = oModel.getProperty('/notificationsByTypeDescending'),
                oRemovedGroup = {
                    oGroup: oGroupToDelete,
                    removedGroupIndex: undefined
                };

            aGroups.some(function (oGroup, iIndex) {
                if (oGroup.Id === oGroupToDelete.Id) {
                    oRemovedGroup.removedGroupIndex = iIndex;
                    aGroups.splice(iIndex, 1);
                    oModel.setProperty('/notificationsByTypeDescending', aGroups);

                    return true;
                }

                return false;
            });
            this.sCurrentExpandedType = undefined;
            return oRemovedGroup;

        },

        updateGroupHeaders :function () {
            var oPromise = this.oNotificationsService.getNotificationsGroupHeaders(),
                that = this,
                aGroups = that.getView().getModel().getProperty("/" + that.oSortingType.NOTIFICATIONS_BY_TYPE_DESCENDING);
            oPromise.fail(function (data) {
                jQuery.sap.log.error("Notifications control - call to notificationsService.updateGroupHeaders failed: ",
                    data,
                    "sap.ushell.renderers.fiori2.notifications.Notifications");
            });
            oPromise.done(function (notificationsByType) {
                var oJson = JSON.parse(notificationsByType),
                    arr = oJson.value;


                arr.forEach(function (item, index) {
                    var bFound = false;
                    aGroups.forEach(function (group, iIndex) {
                        if (group.Id === item.Id) {
                            aGroups[iIndex].GroupHeaderText = item.GroupHeaderText;
                            aGroups[iIndex].CreatedAt = item.CreatedAt;
                            bFound = true;
                        }
                    })
                    if (!bFound) {
                        aGroups.unshift(item);
                    }
                });
                that.getView().getModel().setProperty("/" + that.oSortingType.NOTIFICATIONS_BY_TYPE_DESCENDING, aGroups);
            });
        },
        reloadGroupHeaders: function () {
            var oPromise = this.oNotificationsService.getNotificationsGroupHeaders(),
                that = this;
            oPromise.fail(function (data) {
                jQuery.sap.log.error("Notifications control - call to notificationsService.getNotificationsGroupHeaders failed: ",
                    data,
                    "sap.ushell.renderers.fiori2.notifications.Notifications");
                that.replaceBusyIndicatorWithNotificationsList();
            });
            oPromise.done(function (notificationsByType) {
                var oJson = JSON.parse(notificationsByType),
                    arr = oJson.value,
                    result = [],
                    lastIndex = -1;
                arr.forEach(function (item, index) {
                    if (item.IsGroupHeader) {
                        item.Collapsed = true;
                        result.push(item);
                        lastIndex = lastIndex + 1;
                    } else {
                        if (result[lastIndex]) {
                            if (!result[lastIndex].notifications) {
                                result[lastIndex].notifications = [];
                            }
                            result[lastIndex].notifications.push(item);
                        }
                    }
                });
                that.getView().getModel().setProperty("/" + that.oSortingType.NOTIFICATIONS_BY_TYPE_DESCENDING , result);
                that.replaceBusyIndicatorWithNotificationsList();
            });
        },

        markRead: function (sNotificationId) {
            var oPromise = this.oNotificationsService.markRead(sNotificationId),
                that = this;
            oPromise.fail(function () {
                sap.ushell.Container.getService('Message').error(sap.ushell.resources.i18n.getText('notificationsFailedMarkRead'));
                that.setMarkReadOnModel(sNotificationId, false);
            });
            this.setMarkReadOnModel(sNotificationId, true);
        },

        onExit: function () {
            this.getView().oBusyIndicator.destroy();
        },

        onBeforeRendering: function () {
            this.oNotificationsService.registerDependencyNotificationsUpdateCallback(this.notificationsUpdateCallback.bind(this), false);
        },

        //*********************************************************************************************************
        //************************************** Notification actions *********************************************

        executeAction: function (sNotificationId, sActionName) {
            return this.oNotificationsService.executeAction(sNotificationId, sActionName);
        },

        executeBulkAction: function (aNotificationIds, sActionName, sActionText, oGroup, sNotificationPathInModel, sPathToNotification) {
            var oThatGroup = oGroup,
                oPromise = this.oNotificationsService.executeBulkAction(oGroup.Id, sActionName),
                sMessage,
                sGroupActionText = sActionText,
                sNotificationTypeDesc = this.getView().getModel().getProperty(sPathToNotification + "/NotificationTypeDesc"),
                that = this;

            if (sNotificationTypeDesc === "") {
                sNotificationTypeDesc = this.getView().getModel().getProperty(sPathToNotification + "/NotificationTypeKey");
            }
            oPromise.fail(function (oResult) {
                this.getView().getModel().setProperty(sNotificationPathInModel + "/Busy", false);

                oThatGroup.notifications.forEach(function (item, index) {
                    //remove busy for the notification items.
                    this.getView().getModel().setProperty(sPathToNotification + "/Busy", false);
                }.bind(this));


                if (oResult && oResult.succededNotifications && oResult.succededNotifications.length) {
                    oResult.succededNotifications.forEach(function (sNotificationId, index) {
                        this.removeNotificationFromModel(sNotificationId);
                    }.bind(this));
                    //There is need to load again the other 2 tabs, therefore we need to "clean"  other models.
                    that.cleanModel();
                }

                if (oResult.succededNotifications.length === 1) {
                    sMessage = sap.ushell.resources.i18n.getText("notificationsPartialSuccessExecuteBulkAction", [
                        sGroupActionText, oResult.succededNotifications.length, oResult.failedNotifications.length + oResult.succededNotifications.length, sNotificationTypeDesc, oResult.failedNotifications.length
                    ]);
                    sap.m.MessageToast.show(sMessage, {duration: 4000});
                } else if (oResult.succededNotifications.length > 1) {
                    sMessage = sap.ushell.resources.i18n.getText("notificationsSingleSuccessExecuteBulkAction", [
                        sGroupActionText, oResult.succededNotifications.length, oResult.failedNotifications.length + oResult.succededNotifications.length, sNotificationTypeDesc, oResult.failedNotifications.length
                    ]);
                    sap.m.MessageToast.show(sMessage, {duration: 4000});
                } else {
                    sMessage = sap.ushell.resources.i18n.getText("notificationsFailedExecuteBulkAction");
                    sap.ushell.Container.getService('Message').error(sMessage);
                }

            }.bind(this));

            oPromise.done(function () {
                sMessage = sap.ushell.resources.i18n.getText("notificationsSuccessExecuteBulkAction", [
                    sGroupActionText, sNotificationTypeDesc
                ]);
                sap.m.MessageToast.show(sMessage, {duration: 4000});
                this.removeGroupFromModel(oThatGroup);
                //There is need to load again the other 2 tabs, therefore we need to "clean"  other models.
                this.cleanModel();
            }.bind(this));
        },

        dismissNotification: function (notificationId) {
            //if the service call is successful, we will get the updated model from the service
            //via the standard update.
            //if the operation fails, the model won't be changed, so we just need to call
            //"updateItems" on the list, since the model contains the dismissed notification.
            var that = this,
                oRemovedNotification = this.removeNotificationFromModel(notificationId),
                oPromise = this.oNotificationsService.dismissNotification(notificationId);
            //There is need to load again the other 2 tabs, therefore we need to "clean"  other models.
            this.cleanModel();
            oPromise.fail(function () {
                sap.ushell.Container.getService('Message').error(sap.ushell.resources.i18n.getText('notificationsFailedDismiss'));
                that.addNotificationToModel(oRemovedNotification.obj, oRemovedNotification.index);
            });
        },

        dismissBulkNotifications: function (aNotificationIds, oGroup) {
            var oRemovedGroup = this.removeGroupFromModel(oGroup),
                oPromise = this.oNotificationsService.dismissBulkNotifications(oGroup.Id);
            //There is need to load again the other 2 tabs, therefore we need to "clean"  other models.
            this.cleanModel();
            oPromise.fail(function () {
                sap.ushell.Container.getService('Message').error(sap.ushell.resources.i18n.getText('notificationsFailedExecuteBulkAction'));
                this.reAddFailedGroup(oRemovedGroup);
            }.bind(this));
        },

        onListItemPress: function (sNotificationId, sSemanticObject, sAction, aParameters) {
            var viewPortContainer = sap.ui.getCore().byId('viewPortContainer');

            if (hasher.getHash() === sSemanticObject + "-" + sAction) {
                viewPortContainer.switchState("Center");
            } else {
                utils.toExternalWithParameters(sSemanticObject, sAction, aParameters);
            }
            this.markRead(sNotificationId);
        },

        //*********************************************************************************************************
        //******************************************* Scrolling ***************************************************

        scrollToItem: function (oTopNotificationData) {
            var jqNotificationItems = this._getJqNotificationObjects(),
                jqNotificationContainerContent = jqNotificationItems[0],
                jqNotificationsContent = jqNotificationItems[1],
                jqNotificationsList = jqNotificationItems[2],
                jqNotificationItem = jqNotificationItems[3],
                itemHeight,
                notificationIndex,
                indexOffSet,
                containerPadding,
                notificationContainerOffSet;

            if (jqNotificationContainerContent.length > 0 && jqNotificationsContent.length > 0 && jqNotificationsList.length > 0 && jqNotificationItem.length > 0) {
                itemHeight = jqNotificationItem.outerHeight(true) - window.parseInt(jqNotificationItem.css("margin-top").replace("px", ""));
                notificationIndex = this.getIndexInModelByItemId(oTopNotificationData.topItemId);
                notificationIndex = notificationIndex ? notificationIndex : 0;
                indexOffSet = notificationIndex * itemHeight + window.parseInt(jqNotificationItem.css("margin-top").replace("px", ""));

                containerPadding = window.parseInt(jqNotificationsContent.css("padding-top").replace("px", "")) + window.parseInt(jqNotificationsList.css("padding-top").replace("px", ""));
                notificationContainerOffSet = jqNotificationContainerContent.offset().top;

                jqNotificationContainerContent.scrollTop(indexOffSet + containerPadding + notificationContainerOffSet - oTopNotificationData.offSetTop);
            }
            this._oTopNotificationData = undefined;
        },
        _getJqNotificationObjects: function () {
            var jqNotificationContainerContent = jQuery("#notificationIconTabBar-containerContent"),
                jqNotificationsContent = jqNotificationContainerContent.children(),
                jqNotificationsList = jqNotificationsContent.children(),
                jqNotificationItem = jqNotificationContainerContent.find("li").first();

            return [jqNotificationContainerContent, jqNotificationsContent, jqNotificationsList, jqNotificationItem];
        },
        getTopOffSet: function () {
            var topOffSet = 0,
                jqContainerContent = this._getJqNotificationObjects()[0];
            if (jqContainerContent.children().length > 0 && jqContainerContent.children().children().length > 0) {
                // Get the outer space/margin
                topOffSet += jqContainerContent.children().outerHeight() - jqContainerContent.children().height();
                // Get the inner space/margin
                topOffSet += jqContainerContent.children().children().outerHeight() - jqContainerContent.children().children().height();
            }
            return topOffSet;

        },
        /**
         * Returns the notification ID of the top notification item in the screen, and the actual offset of the element from the top
         */
        getTopItemOnTheScreen: function () {
            // The notifications list control including top offset (until the tabs bar) 
            var jqContainerContent = this._getJqNotificationObjects()[0],
                topOffSet = 0,
                sItemId,
                itemOffsetTop = 0,
                that = this;


            topOffSet = this.getTopOffSet();

            jqContainerContent.find("li").each(function () {
                // The distance between the top of an item from the top of the screen
                itemOffsetTop = jQuery(this).offset().top;
                // Check if this element is in the interested viewport, the first element whose itemOffsetTop is bigger then topOffSet -
                // is the highest visible element in the list
                if (itemOffsetTop >= topOffSet) {
                    sItemId = that.getItemNotificationId(this);
                    return false;
                }
            });
            return {topItemId: sItemId, offSetTop: itemOffsetTop};
        },

        //*********************************************************************************************************
        //***************************************** Error Handling ************************************************

        handleError: function () {
            this.removeBusyIndicatorToTabFilter(true);
            try {
                sap.ushell.Container.getService("Message").error(sap.ushell.resources.i18n.getText("errorOccurredMsg"));
            } catch (e) {
                jQuery.sap.log.error("Getting Message service failed.");
            }
        },

        //*********************************************************************************************************
        //****************************************** Busy Indicator ***********************************************

        addBusyIndicatorToTabFilter: function (bInitialLoading) {
            var oTabFilter = this.getSelectedTabFilter(),
                oIconTabBar = this.getView().oIconTabBar;
            if (bInitialLoading) {
                oIconTabBar.addStyleClass('sapUshellNotificationIconTabByTypeWithBusyIndicator');
                oTabFilter.removeAllContent();
                oTabFilter.addContent(this.getView().oBusyIndicator);
            }
        },
        removeBusyIndicatorToTabFilter: function (bInitialLoading) {
            var oTabFilter = this.getSelectedTabFilter(),
                selectedList;
            if (oTabFilter && bInitialLoading) {
                if (this.sCurrentSorting === this.oSortingType.NOTIFICATIONS_BY_PRIORITY_DESCENDING) {
                    selectedList = this.getView().oNotificationsListPriority;
                } else {
                    selectedList = this.getView().oNotificationsListDate;
                }
                oTabFilter.removeContent(this.getView().oBusyIndicator);
                oTabFilter.addContent(selectedList);
            }
        },

        replaceBusyIndicatorWithNotificationsList: function () {
            var oView = this.getView(),
                oTypeTabFilter = oView.oIconTabBar.getItems()[1];
            if (oTypeTabFilter.getContent()[0] === oView.oBusyIndicator) {
                oTypeTabFilter.removeContent(oView.oBusyIndicator);
                oTypeTabFilter.addContent(oView.oNotificationsListType);
            }
        },

        //*********************************************************************************************************
        //***************************************** Model functions ***********************************************

        addNotificationToModel: function (oNotification, index) {
            var oModel = this.getView().getModel(),
                notifications = oModel.getProperty("/" + this.sCurrentSorting + "/aNotifications");
            notifications.splice(index, 0, oNotification);
            oModel.setProperty("/" + this.sCurrentSorting + "/aNotifications", notifications);
        },

        removeNotificationFromModel: function (notificationId) {
            var oModel = this.getView().getModel(),
                index,
                aGroups,
                notifications,
                sNotificationsModelPath,
                oRemovedNotification = {};

            if (this.sCurrentSorting === this.oSortingType.NOTIFICATIONS_BY_DATE_DESCENDING ||
                this.sCurrentSorting === this.oSortingType.NOTIFICATIONS_BY_DATE_ASCENDING || this.sCurrentSorting === this.oSortingType.NOTIFICATIONS_BY_PRIORITY_DESCENDING) {
                sNotificationsModelPath = "/" + this.sCurrentSorting + "/aNotifications";
                notifications = oModel.getProperty(sNotificationsModelPath);
                notifications.some(function (notification, index, array) {
                    if (notification.Id && notification.Id === notificationId) {
                        oRemovedNotification.obj = array.splice(index, 1)[0];
                        oRemovedNotification.index = index;
                        return true;
                    }
                });
                oModel.setProperty(sNotificationsModelPath, notifications);
                return oRemovedNotification;
            }

            aGroups = oModel.getProperty("/notificationsByTypeDescending");
            for (index = 0; index < aGroups.length; index++) {
                notifications = aGroups[index].aNotifications;
                if (notifications) {
                    if (notifications.length === 1 && notifications[0].Id === notificationId) {
                        aGroups.splice(index, 1);
                    } else {
                        notifications.some(function (notification, index, array) {
                            if (notification.Id && notification.Id === notificationId) {
                                oRemovedNotification.obj = array.splice(index, 1)[0];
                                oRemovedNotification.index = index;
                                return true;
                            }
                        });
                        aGroups[index].aNotifications = notifications;
                    }
                }
            }
            //update the header
            this.updateGroupHeaders();
            oModel.setProperty("/notificationsByTypeDescending", aGroups);
            return oRemovedNotification;
        },

        /**
         * Gets notification Id and returns the index of that notification item in the model,
         * in the relevant array (sorting type) of notification
         */
        getIndexInModelByItemId: function (sNotificationId) {
            var aNotifications,
                index;

            if (this.notificationsByTypeDescending === this.oSortingType.NOTIFICATIONS_BY_TYPE_DESCENDING) {
                aNotifications = this.getView().getModel().getProperty("/" + this.sCurrentExpandedType + "/aNotifications");
            } else {
                aNotifications = this.getView().getModel().getProperty("/" + this.sCurrentSorting + "/aNotifications");
            }
            if (aNotifications === undefined || aNotifications.length === 0) {
                return 0;
            }
            for (index = 0; index < aNotifications.length; index++) {
                if (aNotifications[index].Id === sNotificationId) {
                    return index;
                }
            }
        },

        /**
         * Initializes (i.e. empties) the branched in the model of the tabs/sorting which are not the current one
         */
        cleanModel: function () {
            var that = this,
                oSortingTypesArray = this.getView().getModel().getProperty("/");

            if (this.sCurrentSorting === this.oSortingType.NOTIFICATIONS_BY_DATE_DESCENDING || this.sCurrentSorting === this.oSortingType.NOTIFICATIONS_BY_DATE_ASCENDING) {
                this.getView().oIconTabBar.getItems()[1].removeAllContent();
                this.getView().oIconTabBar.getItems()[2].removeAllContent();
            } else if (this.sCurrentSorting === this.oSortingType.NOTIFICATIONS_BY_PRIORITY_DESCENDING) {
                this.getView().oIconTabBar.getItems()[0].removeAllContent();
                this.getView().oIconTabBar.getItems()[1].removeAllContent();
            } else {
                this.getView().oIconTabBar.getItems()[2].removeAllContent();
                this.getView().oIconTabBar.getItems()[0].removeAllContent();
            }

            jQuery.each(oSortingTypesArray, function (index, item) {
                if (index !== that.sCurrentSorting && index !== "notificationsByTypeDescending" ) {
                        oSortingTypesArray[index] = that.getInitialSortingModelStructure();
                    }
            });
            this.getView().getModel().setProperty("/", oSortingTypesArray);
        },

        replaceItemsInModel: function (oResult, iNumberOfItemsToFetch) {
            var aCurrentItems = this.getItemsFromModel(this.sCurrentSorting),
                iCurrentNumberOfItems = aCurrentItems.length,
                hasMoreItemsToFetch = oResult.length >= iNumberOfItemsToFetch;
            if (iCurrentNumberOfItems) {
                this._oTopNotificationData = this.getTopItemOnTheScreen();
            }

            this.getView().getModel().setProperty("/" + this.sCurrentSorting + "/hasMoreItemsInBackend", hasMoreItemsToFetch);

            this.getView().getModel().setProperty("/" + this.sCurrentSorting + "/aNotifications", oResult);

            this.getView().getModel().setProperty("/" + this.sCurrentSorting + "/inUpdate", false);
            this.handleMaxReached();
        },

        setMarkReadOnModel: function (notificationId, bIsRead) {
            var oModel = this.getView().getModel(),
                notifications = oModel.getProperty("/" + this.sCurrentSorting + "/aNotifications");
            notifications.some(function (notification, index, array) {
                if (notification.Id && notification.Id === notificationId) {
                    notification.IsRead = bIsRead;
                    return true;
                }
            });
            oModel.setProperty("/" + this.sCurrentSorting + "/aNotifications", notifications);
        },

        //*********************************************************************************************************
        //**************************************** Helper functions ***********************************************
        getNumberOfItemsInScreen: function () {
            var iItemsInScreen,
                iHeight = this.getWindowSize();

            iItemsInScreen = (iHeight - this.oPagingConfiguration.TAB_BAR_HEIGHT) / this.oPagingConfiguration.NOTIFICATION_ITEM_HEIGHT;
            return Math.ceil(iItemsInScreen);
        },

        getBasicBufferSize: function () {
            return Math.max(this.getNumberOfItemsInScreen() * 3, this.oPagingConfiguration.MIN_NOTIFICATION_ITEMS_PER_BUFFER);
            //return 300;
        },

        getWindowSize: function () {
            return jQuery(window).height();
        },

        /**
         * Calculates and returns the number of items that should be requested from notification service, as part of the paging policy.
         * The function performs the following:
         *  - Calculated the number of required buffer according to the device / screen size
         *  - If the model already holds the  maximum number of item (per this device) - return 0
         *  - If the number of items in the model plus buffer size is bigger that the maximum - return the biggest possible number of items to fetch
         *  - Regular use case - return buffer size
         */
        getNumberOfItemsToFetchOnScroll: function () {
            var iCurrentNumberOfItems = this.getItemsFromModel(this.sCurrentSorting).length,
                iBasicBufferSize = this.getBasicBufferSize();

            if (iCurrentNumberOfItems >= this.iMaxNotificationItemsForDevice) {
                return 0;
            }
            if (iCurrentNumberOfItems + iBasicBufferSize > this.iMaxNotificationItemsForDevice) {
                return this.iMaxNotificationItemsForDevice - iCurrentNumberOfItems;
            }
            return iBasicBufferSize;
        },

        /**
         * Calculated the number of items that should be required from the backend, according to:
         * - (parameter) The number of items that are already in the model for the relevant sorting type
         * - Basic buffer size
         * The number is rounded up to a product of basic buffer size
         * For example: if a basic buffer size is 50 and there are currently 24 items in the model - then 50 items (size of one basic buffer) are required.
         * @returns The smaller of the two following values:
         *  1. required number of items, which is the number of buffers * buffer size
         *  2. iMaxNotificationItemsForDevice
         */
        getNumberOfItemsToFetchOnUpdate: function (iNumberOfItemsInModel) {
            var iBasicBufferSize = this.getBasicBufferSize(),
                iNumberOfRequiredBasicBuffers = Math.ceil(iNumberOfItemsInModel / iBasicBufferSize),
                iReturnedValue;

            // If the number is less then one basic buffer - then one basic buffer is required
            iReturnedValue = iNumberOfRequiredBasicBuffers > 0 ? iNumberOfRequiredBasicBuffers * iBasicBufferSize : iBasicBufferSize;

            // Return no more then the maximum number of items for this device
            return iReturnedValue > this.iMaxNotificationItemsForDevice ? this.iMaxNotificationItemsForDevice : iReturnedValue;
        },

        getItemsFromModel: function (sortingType) {
            if (sortingType === undefined) {
                sortingType = this.sCurrentSorting;
            }
            return this.getView().getModel().getProperty("/" + sortingType + "/aNotifications");
        },
        getItemsOfTypeFromModel: function (sTypeHeader) {
            var oGroup = this.getGroupFromModel(sTypeHeader);
            if (oGroup) {
                return oGroup.aNotifications ? oGroup.aNotifications : [];
            }
            return [];
        },

        getGroupFromModel: function (sTypeHeader) {
            var aGroupHeaders = this.getView().getModel().getProperty("/" + this.oSortingType.NOTIFICATIONS_BY_TYPE_DESCENDING),
                oGroup;
            aGroupHeaders.some(function (group, index) {
                if (group.Id === sTypeHeader) {
                    oGroup = group;
                    return true;
                }
            });
            return oGroup;
        },
        getGroupIndexFromModel: function (sTypeHeader) {
            var aGroupHeaders = this.getView().getModel().getProperty("/" + this.oSortingType.NOTIFICATIONS_BY_TYPE_DESCENDING ),
                iIndex;
            aGroupHeaders.forEach(function (group, index) {
                if (group.Id === sTypeHeader) {
                    iIndex = index;
                    return true;
                }
            })
            return iIndex;
        },

        /**
         * Return the Notification Id of the given notification item
         */
        getItemNotificationId: function (elNotificationItem) {
            var sItemModelPath,
                sItemNotificationId;
            sItemModelPath = sap.ui.getCore().byId(elNotificationItem.getAttribute("Id")).getBindingContext().sPath;

            sItemNotificationId = this.getView().getModel().getProperty(sItemModelPath + "/Id");
            return sItemNotificationId;

        },

        getInitialSortingModelStructure: function () {
            return {
                hasMoreItemsInBackend: true,
                listMaxReached: false,
                aNotifications: [],
                inUpdate: false,
                moreNotificationCount: ""
            };
        },

        getSelectedTabFilter: function () {
            var oTabFilter;

            if (this.sCurrentSorting === this.oSortingType.NOTIFICATIONS_BY_DATE_DESCENDING || this.sCurrentSorting === this.oSortingType.NOTIFICATIONS_BY_DATE_ASCENDING) {
                oTabFilter = this.getView().oIconTabBar.getItems()[0];
            } else if (this.sCurrentSorting === this.oSortingType.NOTIFICATIONS_BY_PRIORITY_DESCENDING) {
                oTabFilter = this.getView().oIconTabBar.getItems()[2];
            } else {
                oTabFilter = this.getView().oIconTabBar.getItems()[1];
            }

            return oTabFilter;
        },

        triggerRetrieveMoreDataForGroupNotifications: function () {
            if (!this.getModel().getProperty("/" + this.oSortingType.NOTIFICATIONS_BY_TYPE_DESCENDING + "/inUpdate")) {
                var notificationsInModel = this.getItemsOfTypeFromModel(this.sCurrentExpandedType),
                    numberOfNotificationsInModel = notificationsInModel ? notificationsInModel.length : 0,
                    bufferSize = numberOfNotificationsInModel ? this.getBasicBufferSize() : 0,
                    numberOfItemsInThreePages = bufferSize * 3 / 5,
                    indexOfElementInList = Math.floor(numberOfNotificationsInModel - numberOfItemsInThreePages),
                    listItem = this.getView().oNotificationsListDate.getItems()[indexOfElementInList],
                    topOffSet = this.getTopOffSet();

                if (jQuery(listItem.getDomRef()).offset().top <= topOffSet) {
                    this.getNextBufferForType();
                }
            }
        },
        onExpandGroup: function (groupElement) {
            var listItems = this.getView().oNotificationsListType.getItems(),
                groupElementId = groupElement.getId(),
                oGroup = this.getView().getModel().getProperty(groupElement.getBindingContextPath()),
                that = this;
            that.sCurrentExpandedType = oGroup.Id;
            that.getView().getModel().setProperty(groupElement.getBindingContextPath()+"/aNotifications",[]);
            that.getView().getModel().setProperty(groupElement.getBindingContextPath()+"/hasMoreItems",true);
            listItems.forEach(function (item, index) {
                if (item.getId() === groupElementId ) {
                    that.getNextBufferForType();
                } else if (item.getId() !== groupElementId && !item.getCollapsed()) {
                    item.setCollapsed(true);
                    that.getView().getModel().setProperty(item.getBindingContextPath()+"/hasMoreItems",true);

                }
            });
        },
        notificationsUpdateCallbackForType: function () {
            var selectedTypeId = this.sCurrentExpandedType,
                sSortingType = this.oSortingType.NOTIFICATIONS_BY_TYPE_DESCENDING,
                oGroup = this.getGroupFromModel(selectedTypeId),
                aCurrentItems = oGroup ? oGroup.aNotifications : undefined,
                iNumberOfItemsInModel = 0,
                oPromise;


            if (aCurrentItems !== undefined) {
                iNumberOfItemsInModel = aCurrentItems.length;
            }

            this.getView().getModel().setProperty("/" + sSortingType + "/inUpdate", true);


            //First Fetch the Groups Headers

            this.updateGroupHeaders();

            // Fetch a buffer of notification items from notification service
            if (selectedTypeId) {
                oPromise = this.oNotificationsService.getNotificationsBufferInGroup(selectedTypeId, 0, this.getNumberOfItemsToFetchOnUpdate(iNumberOfItemsInModel));

                oPromise.done(function (oResult) {
                    this.addTypeBufferToModel(selectedTypeId, oResult, true);
                }.bind(this));

                oPromise.fail(function (oResult) {
                    this.getNextBufferFailHandler(oResult);
                }.bind(this));
            }

        },
        handleEmptyList: function () {
            var aItems = this.getItemsFromModel(this.sCurrentSorting);
            this.getSelectedList().toggleStyleClass("sapContrast", !aItems.length);
            this.getSelectedList().toggleStyleClass("sapContrastPlus", !aItems.length);
        }

    });


}, /* bExport= */ true);
