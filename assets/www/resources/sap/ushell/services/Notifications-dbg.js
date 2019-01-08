// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ui/thirdparty/datajs",
    "sap/ui/core/ws/SapPcpWebSocket"
], function (datajs, SapPcpWebSocket) {
    "use strict";
    /*global jQuery, sap, window, OData, hasher */

    /**
     * @class A UShell service for fetching user notification data from the Notification center/service<br>
     * and exposing them to the Unified Shell and Fiori applications UI controls.
     *
     * In order to get user notifications, Unified Shell notification service issues OData requests<br>
     * to the service defined by the configuration property <code>serviceUrl</code>,<br>
     * for example: "/sap/opu/odata4/iwngw/notification/default/iwngw/notification_srv/0001"<br>.
     *
     * Unified Shell Notification service has several working modes, depending on the environment and the available resources:<br>
     *  PackagedApp mode: Fiori launchpad runs in the context of PackagedApp<br>
     *  FioriClient mode: Fiori launchpad runs in the context of FioriLaunchpad<br>
     *  WebSocket mode: Fiori launchpad runs in a browser, and WebSocket connection to the notifications provider is available<br>
     *  Polling mode: Fiori launchpad in runs in a browser, and WebSocket connection to the notifications provider is not available<br>
     *
     * The notification service exposes an API that includes:
     * - Service enabling and initialization<br>
     * - Registration of callback functions (by Shell/FLP controls) that will be called for every data update<br>.
     * - Retrieval of notification data (e.g. notifications, number of unseen notifications)
     * - Execution of a notification actions
     * - Marking user notifications as seen
     *
     * @name sap.ushell.services.Notifications
     *
     * @param {object} oContainerInterface
     *     The interface provided by the container
     * @param {object} sParameter
     *     Not used in this service
     * @param {object} oServiceProperties
     *     Service configuration
     *
     * @constructor
     * @see sap.ushell.services.Container#getService
     * @since 1.32.0
     *
     * @public
     */
    function Notifications(oContainerInterface, sParameters, oServiceConfiguration) {
        var oModel = new sap.ui.model.json.JSONModel(),
            tInitializationTimestamp = new Date(),
            oServiceConfig = oServiceConfiguration && oServiceConfiguration.config,
            aRequestURIs = {
                getNotifications : {},
                getNotificationsByType : {},
                getNotificationsInGroup : {},
                getBadgeNumber : {},
                resetBadgeNumber : {},
                getNotificationTypesSettings : {},
                getNotificationsGroupHeaders : {},
                getMobileSupportSettings : {},
                getWebSocketValidity : {},
                getNotificationCount : {}
            },
            oWebSocket,
            sWebSocketUrl = oServiceConfig.webSocketUrl || "/sap/bc/apc/iwngw/notification_push_apc",
            iPollingInterval = oServiceConfig.pollingIntervalInSeconds || 60,
            initialReadTimer = undefined,
            webSocketRecoveryTimer = undefined,
            pollingTimer = undefined,
            aUpdateNotificationsCallbacks = [],
            aUpdateDependencyNotificationsCallbacks = [],
            aUpdateNotificationsCountCallbacks = [],
            bIntentBasedConsumption = false,
            aConsumedIntents = [],
            bInitialized = false,
            bOnServiceDestroy = false,
            bEnabled = true,
            sHeaderXcsrfToken,
            sDataServiceVersion,
            tWebSocketRecoveryPeriod = 5000,
            tFioriClientInitializationPeriod = 6000,
            bWebSocketRecoveryAttempted = false,
            oOperationEnum = {
                NOTIFICATIONS: 0,
                NOTIFICATIONS_BY_TYPE: 1,
                GET_BADGE_NUMBER: 2,
                RESET_BADGE_NUMBER: 3,
                GET_SETTINGS: 4,
                GET_MOBILE_SUPPORT_SETTINGS: 5,
                NOTIFICATIONS_GROUP_HEADERS: 6,
                NOTIFICATIONS_IN_GROUP: 7,
                GET_NOTIFICATIONS_COUNT: 8,
                VALIDATE_WEBSOCKET_CHANNEL: 9,
                NOTIFICATIONS_BY_DATE_DESCENDING: "notificationsByDateDescending",
                NOTIFICATIONS_BY_DATE_ASCENDING : "notificationsByDateAscending",
                NOTIFICATIONS_BY_PRIORITY_DESCENDING: "notificationsByPriorityDescending",
                NOTIFICATIONS_BY_TYPE_DESCENDING: "notificationsByTypeDescending"
            },
            oModesEnum = {
                PACKAGED_APP: 0,
                FIORI_CLIENT: 1,
                WEB_SOCKET: 2,
                POLLING: 3
            },
            oCurrentMode,
            bFirstDataLoaded = false,
            oUserSettingsPersonalizer,
            bPreviewNotificationEnabledConfig = true,
            bPreviewNotificationEnabled = false,
            bHighPriorityBannerEnabled = true,
            bUserFlagsReadFromPersonalization = false,
            oUserFlagsReadFromPersonalizationDefferred = new jQuery.Deferred(),
            oNotificationSettingsAvailabilityDefferred = new jQuery.Deferred(),
            bNotificationSettingsMobileSupport,
            oUserFlagsReadFromPersonalizationPromise = oUserFlagsReadFromPersonalizationDefferred.promise(),
            bUseDummyItems = false,
            iNumOfDummyItems = 300,
            oDummyItems = {},
            iInitialBufferSize = 10,
            bInvalidCsrfTokenRecoveryMode = false,
            bCsrfDataSet = false;

        // *************************************************************************************************
        // ************************************* Service API - Begin ***************************************

        /**
         * Indicates whether notification service is enabled.<br>
         * Enabling is based on the <code>enable</code> service configuration flag.<br>
         * The service configuration must also include serviceUrl attribute.<br>
         *
         * @returns {boolean} A boolean value indicating whether the notifications service is enabled
         *
         * @since 1.32.0
         *
         * @public
         * @alias sap.ushell.services.Notifications#isEnabled
         */
        this.isEnabled = function () {
            if (!oServiceConfig.enabled || !oServiceConfig.serviceUrl) {
                bEnabled = false;
                if (oServiceConfig.enabled && !oServiceConfig.serviceUrl) {
                    jQuery.sap.log.warning("No serviceUrl was found in the service configuration");
                }
            } else {
                bEnabled = true;
            }
            return bEnabled;
        };

        /**
         * Initializes the notification service
         *
         * Initialization is performed only if the following two conditions are fulfilled:<br>
         *  1. Notification service is enabled<br>
         *  2. Notification service hasn't been initialized yet<br>
         *
         * The main initialization functionality is determining and setting the mode in which notifications are consumed.<br>
         * The possible modes are:<br>
         *  PACKAGED_APP - Notifications are fetched when a callback is called by PackagedApp environment<br>
         *  FIORI_CLIENT - Notifications are fetched when a callback is called by FioriClient environment<br>
         *  WEB_SOCKET - Notifications are fetched on WebSocket "ping"<br>
         *  POLLING - Notifications are fetched using periodic polling mechanism<br>
         *
         * @since 1.32
         *
         * @public
         * @alias sap.ushell.services.Notifications#init
         */
        this.init = function () {
            if ((!bInitialized) && (this.isEnabled())) {
                sap.ui.getCore().getEventBus().subscribe("launchpad", "sessionTimeout", this.destroy, this);
                this.lastNotificationDate = new Date();
                bPreviewNotificationEnabledConfig = oServiceConfig.enableNotificationsPreview;
                this._setWorkingMode();
                bInitialized = true;
                this.bUpdateDependencyInitiatorExists = false;
                this._userSettingInitialization();
            }
        };

        /**
         * Returns the number of unseen notifications<br>
         * e.g. Notifications that the user hasn't seen yet.
         *
         * @returns {promise} Promise object that on success - returns the number of unread notifications of the user
         *
         * @since 1.32
         *
         * @public
         * @alias sap.ushell.services.Notifications#getUnseenNotificationsCount
         */
        this.getUnseenNotificationsCount = function () {
            var oDeferred = jQuery.Deferred();
            oDeferred.resolve(oModel.getProperty("/UnseenCount"));
            return oDeferred.promise();
        };
        /**
         * Returns the number of  notifications<br>
         * e.g. Notifications for user.
         *
         * @returns Returns the number of notifications of the user
         *
         * @since 1.44
         *
         * @public
         * @alias sap.ushell.services.Notifications#getNotificationsCount
         */
        this.getNotificationsCount = function () {
            return oModel.getProperty("/NotificationsCount") ? oModel.getProperty("/NotificationsCount") : "0";
        };
        /**
         * Returns the notifications of the user sorted by type include the group headers and the notifications
         *
         * @returns {promise} Promise object that on success - returns all notification items
         *
         * @since 1.38
         *
         * @public
         * @alias sap.ushell.services.Notifications#getNotificationsByTypeWithGroupHeaders
         */
        this.getNotificationsByTypeWithGroupHeaders = function () {
            var oHeader,
                oRequestObject,
                oDeferred = new jQuery.Deferred(),
                sReadNotificationsByTypeWithGroupHeadersUrl = this._getRequestURI(oOperationEnum.NOTIFICATIONS_BY_TYPE);

            oRequestObject = {
                requestUri: sReadNotificationsByTypeWithGroupHeadersUrl
            };

            //  If CSRF token wasn't obtained yet - then set the header of the request so the token will be returned
            if (!this._getHeaderXcsrfToken()) {
                oHeader = {};
                oHeader["X-CSRF-Token"] = "fetch";
                oRequestObject.headers = oHeader;
            }
            OData.request(oRequestObject,
                function (oResult) {
                    oDeferred.resolve(oResult);
                }, function (oMessage) {
                    if (oMessage.response && oMessage.response.statusCode === 200 && oMessage.response.body) {
                        oDeferred.resolve(oMessage.response.body);
                    } else {
                        oDeferred.reject(oMessage);
                        jQuery.sap.log.error("Notification service - oData executeAction failed: ", oMessage, "sap.ushell.services.Notifications");
                    }
                });
            return oDeferred.promise();
        };


        /**
         * Returns the group headers of the user notifications
         *
         * @returns {promise} Promise object that on success - returns all group headers
         *
         * @since 1.44
         *
         * @public
         * @alias sap.ushell.services.Notifications#getNotificationsGroupHeaders
         */
        this.getNotificationsGroupHeaders = function () {
            var oHeader,
                oRequestObject,
                oDeferred = new jQuery.Deferred(),
                sReadNotificationsGroupHeadersUrl = this._getRequestURI(oOperationEnum.NOTIFICATIONS_GROUP_HEADERS);

            oRequestObject = {
                requestUri: sReadNotificationsGroupHeadersUrl
            };

            //  If CSRF token wasn't obtained yet - then set the header of the request so the token will be returned
            if (!this._getHeaderXcsrfToken()) {
                oHeader = {};
                oHeader["X-CSRF-Token"] = "fetch";
                oRequestObject.headers = oHeader;
            }
            OData.request(oRequestObject,
                function (oResult) {
                    oDeferred.resolve(oResult);
                }, function (oMessage) {
                    if (oMessage.response && oMessage.response.statusCode === 200 && oMessage.response.body) {
                        oDeferred.resolve(oMessage.response.body);
                    } else {
                        oDeferred.reject();
                        jQuery.sap.log.error("Notification service - oData executeAction failed: ", oMessage, "sap.ushell.services.Notifications");
                    }
                });
            return oDeferred.promise();
        };

        this.getNotificationsBufferInGroup = function (sGroup, iSkip, iTop) {
            var that = this,
                oHeader,
                oRequestObject,
                oDeferred = new jQuery.Deferred(),
                oArgs = {
                    group: sGroup,
                    skip : iSkip,
                    top : iTop
                },
                aResponse,
                oResponse,
                sRequestUri = this._getRequestURI(oOperationEnum.NOTIFICATIONS_IN_GROUP, oArgs);

            if (bUseDummyItems === true) {
                aResponse = oDummyItems[oOperationEnum.NOTIFICATIONS_IN_GROUP].slice(iSkip, iSkip + iTop);
                oResponse = JSON.stringify({
                    "@odata.context" : "$metadata#Notifications",
                    "value" : aResponse
                });

                setTimeout(function () {
                    oDeferred.resolve(oResponse);
                }, 1000);
            } else {
                oRequestObject = {
                    requestUri: sRequestUri
                };

                // If CSRF token wasn't obtained yet - then set the header of the request so the token will be returned
                if (!this._getHeaderXcsrfToken()) {
                    oHeader = {};
                    oHeader["X-CSRF-Token"] = "fetch";
                    oRequestObject.headers = oHeader;
                }
                OData.request(oRequestObject,
                    function (oResult) {
                        that._updateCSRF(oResult.response);
                        oDeferred.resolve(oResult.value);
                    }, function (oMessage) {
                        if (oMessage.response && oMessage.response.statusCode === 200 && oMessage.response.body) {
                            that._updateCSRF(oMessage.response);
                            oDeferred.resolve(JSON.parse(oMessage.response.body).value);
                        } else {
                            oDeferred.reject();
                            jQuery.sap.log.error("Notification service - oData executeAction failed: ", oMessage, "sap.ushell.services.Notifications");
                        }
                    });
            }
            return oDeferred.promise();
        };

        this.getNotificationsBufferBySortingType = function (sSortingType, iSkip, iTop) {
            var that = this,
                oHeader,
                oRequestObject,
                oDeferred = new jQuery.Deferred(),
                oArgs = {
                    skip : iSkip,
                    top : iTop
                },
                aResponse,
                oResponse,
                sRequestUri = this._getRequestURI(sSortingType, oArgs);

            if (bUseDummyItems === true) {
                aResponse = oDummyItems[sSortingType].slice(iSkip, iSkip + iTop);
                oResponse = JSON.stringify({
                    "@odata.context" : "$metadata#Notifications",
                    "value" : aResponse
                });

                setTimeout(function () {
                    oDeferred.resolve(oResponse);
                }, 1000);
            } else {
                oRequestObject = {
                    requestUri: sRequestUri
                };

                // If CSRF token wasn't obtained yet - then set the header of the request so the token will be returned
                if (!this._getHeaderXcsrfToken()) {
                    oHeader = {};
                    oHeader["X-CSRF-Token"] = "fetch";
                    oRequestObject.headers = oHeader;
                }
                OData.request(oRequestObject,
                    function (oResult) {
                        that._updateCSRF(oResult.response);
                        oDeferred.resolve(oResult.value);
                    }, function (oMessage) {
                        if (oMessage.response && oMessage.response.statusCode === 200 && oMessage.response.body) {
                            that._updateCSRF(oMessage.response);
                            oDeferred.resolve(JSON.parse(oMessage.response.body).value);
                        } else {
                            oDeferred.reject();
                            jQuery.sap.log.error("Notification service - oData executeAction failed: ", oMessage, "sap.ushell.services.Notifications");
                        }
                    });
            }
            return oDeferred.promise();
        };

        /**
         * Returns the 10 most recent notifications of the user
         *
         * @returns {promise} Promise object that on success - returns the 10 most recent user notification items
         *
         * @since 1.32
         *
         * @private
         *
         * @alias sap.ushell.services.Notifications#getNotifications
         */
        this.getNotifications = function () {
            var oReadPromise,
                oDeferred = jQuery.Deferred();

            if ((oCurrentMode === oModesEnum.FIORI_CLIENT) || (oCurrentMode === oModesEnum.PACKAGED_APP)) {
                // In Fiori Client mode, notification service fetches notification on initialization,
                // and after that - notification data is updated only by pushed notifications.
                // hence, there's no way that Notification service is updated regarding other changes
                // for example: if the user approved/rejected a notification via other device.
                // In order to solve this - we bring updated data when getNotifications is called from Fiori Client

                oReadPromise = this._readNotificationsData(false);
                oReadPromise.done(function () {
                    oDeferred.resolve(oModel.getProperty("/Notifications"));
                }).fail(function (sMsg) {
                    oDeferred.reject();
                });
            } else {
                // In case of offline testing (when OData calls fail):
                // Mark the following line and unmark the two successive lines
                oDeferred.resolve(oModel.getProperty("/Notifications"));
                // var tempNotificationsJSON = this._getDummyJSON();
                // oDeferred.resolve(tempNotificationsJSON);
            }
            return oDeferred.promise();
        };

        /**
         * Launches a notification action oData call.<br>
         *
         * After launching the action, the function gets updated notification data in order to push the updated data to the consumers.
         *
         * @param {object} sNotificationGroupId The ID of the notification header/group whose action is being executed
         *
         * @param {object} sActionId The ID of the action that is being executed
         *
         * @since 1.32
         *
         * @public
         * @alias sap.ushell.services.Notifications#executeBulkAction
         */
        this.executeBulkAction = function (sNotificationGroupId, sActionId) {
            var oDeferred = new jQuery.Deferred(),
                aSuccededNotifications = [],
                aFailedNotifications = [],
                oResult = {
                    succededNotifications: aSuccededNotifications,
                    failedNotifications: aFailedNotifications
                },
                that = this;

            that.sendBulkAction(sNotificationGroupId, sActionId)
                .done(function (res) {
                    res.forEach(function (oNotificationRes, iIndex) {
                        var sNotificationId = oNotificationRes.NotificationId,
                            bSuccess = oNotificationRes.Success;
                        if (bSuccess) {
                            aSuccededNotifications.push(sNotificationId);
                        } else {
                            aFailedNotifications.push(sNotificationId);
                        }
                    })
                    if (aFailedNotifications.length) {
                        oDeferred.reject(oResult);
                    } else {
                        oDeferred.resolve(oResult);
                    }
                })
                .fail(function () {
                    oDeferred.reject(oResult);
                });
            return oDeferred.promise();
        };

        this.dismissBulkNotifications = function (sNotificationGroupId) {
            var oDeferred = new jQuery.Deferred(),
                that = this;
            that.sendBulkDismiss(sNotificationGroupId)
                .done(function () {
                    oDeferred.resolve();
                })
                .fail(function () {
                    oDeferred.reject();
                });
            return oDeferred.promise();
        };

        this.executeAction = function (sNotificationId, sActionId) {
            var that = this,
                sActionUrl = oServiceConfig.serviceUrl + "/ExecuteAction",
                oRequestBody = {NotificationId: sNotificationId, ActionId: sActionId},
                oRequestObject = {
                    requestUri: sActionUrl,
                    method: "POST",
                    data: oRequestBody,
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        "Content-Type": "application/json",
                        "DataServiceVersion": sDataServiceVersion,
                        "X-CSRF-Token": sHeaderXcsrfToken
                    }
                },
                oDeferred = jQuery.Deferred();
            OData.request(oRequestObject,
                function (oResult) {
                    var responseAckJson,
                        responseAck = {isSucessfull: true, message: ""};
                    if (oResult && oResult.response && oResult.response.statusCode === 200 && oResult.response.body) {
                        responseAckJson = JSON.parse(oResult.response.body);
                        responseAck.isSucessfull = responseAckJson.Success;
                        responseAck.message = responseAckJson.MessageText;
                    }
                    oDeferred.resolve(responseAck);
                }, function (oMessage) {
                    var responseAckJson,
                        responseAck = {isSucessfull: false, message: ""};

                    if (oMessage.response && oMessage.response.statusCode === 200 && oMessage.response.body) {
                        responseAckJson = JSON.parse(oMessage.response.body);
                        responseAck.isSucessfull = responseAckJson.Success;
                        responseAck.message = responseAckJson.MessageText;
                        oDeferred.resolve(responseAck);
                    } else if (that._csrfTokenInvalid(oMessage) && (bInvalidCsrfTokenRecoveryMode === false)) {
                        that._invalidCsrfTokenRecovery(oDeferred, that.executeAction, [sNotificationId, sActionId]);
                    } else {
                        oDeferred.reject(oMessage);
                        jQuery.sap.log.error("Notification service - oData executeAction failed: ", oMessage, "sap.ushell.services.Notifications");
                    }
                });

            return oDeferred.promise();
        };

        this.sendBulkAction = function (sParentId, sActionId) {
            var that = this,
                sActionUrl = oServiceConfig.serviceUrl + "/BulkActionByHeader",
                oRequestBody = {ParentId: sParentId, ActionId: sActionId},
                oRequestObject = {
                    requestUri: sActionUrl,
                    method: "POST",
                    data: oRequestBody,
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        "Content-Type": "application/json",
                        "DataServiceVersion": sDataServiceVersion,
                        "X-CSRF-Token": sHeaderXcsrfToken
                    }
                },
                oDeferred = jQuery.Deferred();

            OData.request(oRequestObject,
                function (oResult) {
                    var responseAckJson,
                        responseAck ;
                    if (oResult && oResult.response && oResult.response.statusCode === 200 && oResult.response.body) {
                        responseAckJson = JSON.parse(oResult.response.body);
                        responseAck= responseAckJson.value;
                    }
                    oDeferred.resolve(responseAck);
                }, function (oResult) {
                    var responseAckJson,
                        responseAck ;

                    if (oResult.response && oResult.response.statusCode === 200 && oResult.response.body) {
                        responseAckJson = JSON.parse(oResult.response.body);
                        responseAck= responseAckJson.value;
                        oDeferred.resolve(responseAck);
                    } else if (that._csrfTokenInvalid(oResult) && (bInvalidCsrfTokenRecoveryMode === false)) {
                        that._invalidCsrfTokenRecovery(oDeferred, that.sendBulkAction, [sParentId, sActionId]);	
                    } else { 
                        oDeferred.reject();
                        jQuery.sap.log.error("Notification service - oData executeBulkAction failed: ", oResult.message, "sap.ushell.services.Notifications");
                    }
                });

            return oDeferred.promise();
        };

        this.sendBulkDismiss = function (sParentId) {
            var that = this,
                sActionUrl = oServiceConfig.serviceUrl + "/DismissAll",
                oRequestBody = {ParentId: sParentId},
                oRequestObject = {
                    requestUri: sActionUrl,
                    method: "POST",
                    data: oRequestBody,
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        "Content-Type": "application/json",
                        "DataServiceVersion": sDataServiceVersion,
                        "X-CSRF-Token": sHeaderXcsrfToken
                    }
                },
                oDeferred = jQuery.Deferred();

            OData.request(oRequestObject,
                function (oResult) {
                    oDeferred.resolve();
                }, function (oResult) {
                    if (oResult.response && oResult.response.statusCode === 200) {
                        oDeferred.resolve();
                    } else if (that._csrfTokenInvalid(oResult) && (bInvalidCsrfTokenRecoveryMode === false)) {
                		that._invalidCsrfTokenRecovery(oDeferred, that.sendBulkDismiss, [sParentId]);
                	} else {
                        oDeferred.reject();
                        jQuery.sap.log.error("Notification service - oData executeBulkAction failed: ", oMessage, "sap.ushell.services.Notifications");
                    }
                });

            return oDeferred.promise();
        };

        /**
         * Launches mark as read notification call.<br>
         *
         * After launching the action, the function gets updated notification data in order to push the updated data to the consumers.
         *
         * @param {object} sNotificationId The ID of the notification whose action is being executed
         *
         * @since 1.34
         *
         * @public
         * @alias sap.ushell.services.Notifications#markRead
         */
        this.markRead = function (sNotificationId) {
            var that = this,
                sActionUrl = oServiceConfig.serviceUrl + "/MarkRead",
                oRequestBody = {NotificationId: sNotificationId},
                oRequestObject = {
                    requestUri: sActionUrl,
                    method: "POST",
                    data: oRequestBody,
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        "Content-Type": "application/json",
                        "DataServiceVersion": sDataServiceVersion,
                        "X-CSRF-Token": sHeaderXcsrfToken
                    }
                },
                oDeferred = jQuery.Deferred();

            OData.request(oRequestObject,
                function (oResult) {
                    oDeferred.resolve();
                }, function (oMessage) {
                	if (that._csrfTokenInvalid(oMessage) && (bInvalidCsrfTokenRecoveryMode === false)) {
                		that._invalidCsrfTokenRecovery(oDeferred, that.markRead, [sNotificationId]);
                	} else {
                        jQuery.sap.log.error("Notification service - oData reset badge number failed: ", oMessage, "sap.ushell.services.Notifications");
                        oDeferred.reject(oMessage);
                	}
                });
            return oDeferred.promise();
        };
        /**
         * Launches dismiss notification call.<br>
         *
         * @param {object} sNotificationId The ID of the notification whose action is being executed
         *
         * @since 1.34
         *
         * @public
         * @alias sap.ushell.services.Notifications#dismissNotification
         */
        this.dismissNotification = function (sNotificationId) {
            var sActionUrl = oServiceConfig.serviceUrl + "/Dismiss",
                oRequestBody = {NotificationId: sNotificationId},
                oRequestObject = {
                    requestUri: sActionUrl,
                    method: "POST",
                    data: oRequestBody,
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        "Content-Type": "application/json",
                        "DataServiceVersion": sDataServiceVersion,
                        "X-CSRF-Token": sHeaderXcsrfToken
                    }
                },
                oDeferred = jQuery.Deferred();

            OData.request(oRequestObject,
                function (oResult) {
                    oDeferred.resolve();
                }, function (oMessage) {
                	if (that._csrfTokenInvalid(oMessage) && (bInvalidCsrfTokenRecoveryMode === false)) {
                        that._invalidCsrfTokenRecovery(oDeferred, that.dismissNotification, [sNotificationId]);
                    } else {
                        oDeferred.reject(oMessage);
                        jQuery.sap.log.error("Notification service - oData dismiss notification failed: ", oMessage, "sap.ushell.services.Notifications");
                    }
                });
            return oDeferred.promise();
        };

        /**
         * Gets a callback function that will be called when updated notifications data is available.
         *
         * @param {object} The callback function that is registered and called on data update.
         *
         * @since 1.32
         *
         * @public
         * @alias sap.ushell.services.Notifications#registerNotificationsUpdateCallback
         */
        this.registerNotificationsUpdateCallback = function (callback) {
            aUpdateNotificationsCallbacks.push(callback);
        };

        /**
         * Gets a callback function to be calle don notifications update, with a dependency in other callbacks
         *
         * On every notification update:
         * 1. A deferred object is created
         * 2. The registered callback functions are called with a parameter
         * 3. The parameter is either the deferred object or the deferred's promise
         *
         * This way there is a dependency between one of the callback (that performs the deferred.resolve/reject)
         * and all the other (that implement the promise.done/fail)
         *
         * @param {function} The callback function that is registered and called on data update.
         * @param {boolean} Determines whether the callback gets a deferred object or a promise object, when called
         *
         * @private
         */
        this.registerDependencyNotificationsUpdateCallback = function (callback, bDependent) {
            if (bDependent === false) {
                this.bUpdateDependencyInitiatorExists = true;
            }
            aUpdateDependencyNotificationsCallbacks.push({
                callback : callback,
                dependent : bDependent
            });
        };

        /**
         * Gets a callback function that will be called when updated unseen notifications count is available.
         *
         * @param {object} The callback function that is registered and called on data update.
         *
         * @since 1.32
         *
         * @public
         * @alias sap.ushell.services.Notifications#registerNotificationCountUpdateCallback
         */
        this.registerNotificationCountUpdateCallback = function (callback) {
            aUpdateNotificationsCountCallbacks.push(callback);
        };

        /**
         * Mark all notifications as seen.<br>
         * the main use-case is when the user navigated to the notification center and sees all the pending notifications.<br>
         *
         * @since 1.32
         *
         * @public
         * @alias sap.ushell.services.Notifications#notificationsSeen
         */
        this.notificationsSeen = function () {
            this._setNotificationsAsSeen();
        };

        /**
         * Return whether first request was already performed and data was returned.<br>
         *
         * @since 1.38
         *
         * @public
         * @alias sap.ushell.services.Notifications#isFirstDataLoaded
         */
        this.isFirstDataLoaded = function () {
            return bFirstDataLoaded;
        };

       /**
        *
        * @since 1.41
        *
        * @private
        */
        this.readSettings = function () {
            var oPromise;

            oPromise = this._readSettingsFromServer();

            return oPromise;
        };

       /**
        *
        * @since 1.41
        *
        * @private
        */
        this.saveSettingsEntry = function (oEntry) {
            var oPromise;

            oPromise = this._writeSettingsEntryToServer(oEntry);
            return oPromise;
        };

       /**
        *
        * @since 1.41
        *
        * @private
        */
        this.getUserSettingsFlags = function () {
            var oDeferred = new jQuery.Deferred();

            // If the settings flags were read once (on service initialization) from personalization service
            if (bUserFlagsReadFromPersonalization === true) {
                oDeferred.resolve({
                    previewNotificationEnabled : bPreviewNotificationEnabled,
                    highPriorityBannerEnabled : bHighPriorityBannerEnabled
                });
            } else {
                // If the settings flags were not read from personalization service yet -
                //  wait for oUserFlagsReadFromPersonalizationPromise to be resolved
                oUserFlagsReadFromPersonalizationPromise.done(function () {
                    oDeferred.resolve({
                        previewNotificationEnabled : bPreviewNotificationEnabled,
                        highPriorityBannerEnabled : bHighPriorityBannerEnabled
                    });
                });
            }
            return oDeferred.promise();
        };

       /**
        *
        * @since 1.41
        *
        * @private
        */
        this.setUserSettingsFlags = function (oFlags) {
            bPreviewNotificationEnabled = oFlags.previewNotificationEnabled;
            bHighPriorityBannerEnabled = oFlags.highPriorityBannerEnabled;

            this._writeUserSettingsFlagsToPersonalization(oFlags);
        };

        /**
         * Returns a boolean value indicating whether the Push to Mobile capability is supported by the Notification channel
         *
         * @since 1.43
         *
         * @private
         */
        this._getNotificationSettingsMobileSupport = function () {
            return bNotificationSettingsMobileSupport;
        };

        /**
        *
        * @since 1.41
        *
        * @private
        */
        this.getPreviewNotificationEnabledConfig = function () {
            return bPreviewNotificationEnabledConfig;
        };

        this.destroy = function () {
            bOnServiceDestroy = true;
            if (initialReadTimer) {
            	clearTimeout(initialReadTimer);
            } else if (webSocketRecoveryTimer) {
            	clearTimeout(webSocketRecoveryTimer);
            } else if (pollingTimer) {
                clearTimeout(pollingTimer);
            }
            if ((oCurrentMode === oModesEnum.WEB_SOCKET) && oWebSocket) {
                oWebSocket.close();
            }
            sap.ui.getCore().getEventBus().unsubscribe("launchpad", "sessionTimeout", this.destroy, this);
        };

        // ************************************** Service API - End ****************************************
        // *************************************************************************************************

        // *************************************************************************************************
        // ********************************* oData functionality - Begin ***********************************

        /**
         * Fetching the number of notifications that the user hasn't seen yet <br>
         *  and announcing the relevant consumers by calling all registered callback functions.<br>
         *
         * This function is similar to _readNotificationsData.
         * In the future the two functions will be sent together in a single batch request, when batch is supported.
         *
         * @param {boolean} A boolean parameter indicating whether to update the registered consumers or not
         *
         * @private
         */
        this._readUnseenNotificationsCount = function (bUpdateCustomers) {
            var that = this,
                oDeferred = new jQuery.Deferred(),
                sGetBadgeNumberUrl = this._getRequestURI(oOperationEnum.GET_BADGE_NUMBER),
                oRequestObject = {
                    requestUri: sGetBadgeNumberUrl
                };

            OData.read(
                oRequestObject,

                // success handler
                function (oResult, oResponseData) {
                    oModel.setProperty("/UnseenCount", oResponseData.data.GetBadgeNumber.Number);
                    that._setNativeIconBadge(oResponseData.data.GetBadgeNumber.Number);
                    oDeferred.resolve(oResponseData.data.GetBadgeNumber.Number);
                },
                function (oMessage) {
                    if (oMessage.response && oMessage.response.statusCode === 200 && oMessage.response.body) {
                        var oReturnedObject = JSON.parse(oMessage.response.body);
                        oModel.setProperty("/UnseenCount", oReturnedObject.value);
                        that._setNativeIconBadge(oReturnedObject.value);
                        oDeferred.resolve(oReturnedObject.value);
                    } else {
                        jQuery.sap.log.error("Notification service - oData read unseen notifications count failed: ", oMessage.message, "sap.ushell.services.Notifications");
                        oDeferred.reject(oMessage);
                    }
                }
            );
            return oDeferred.promise();
        };
        /**
         * Fetching the number of notifications for user  <br>
         *
         */
        this.readNotificationsCount = function () {
            var oDeferred = new jQuery.Deferred(),
                sGetNotificationNumberUrl = this._getRequestURI(oOperationEnum.GET_NOTIFICATIONS_COUNT),
                oRequestObject = {
                    requestUri: sGetNotificationNumberUrl
                };

            OData.read(
                oRequestObject,

                // success handler
                function (oResult, oResponseData) {
                    oDeferred.resolve(oResponseData.data);
                },
                function (oMessage) {
                    if (oMessage.response && oMessage.response.statusCode === 200 && oMessage.response.body) {
                        var oReturnedObject = JSON.parse(oMessage.response.body);
                        oDeferred.resolve(oReturnedObject.value);
                    } else {
                        jQuery.sap.log.error("Notification service - oData read notifications count failed: ", oMessage.message, "sap.ushell.services.Notifications");
                        oDeferred.reject(oMessage);
                    }
                }
            );
            return oDeferred.promise();
        };

       /**
        * Returns promise object that is resolved if Notification settings data is available, and rejected if not
        *
        * @private
        */
        this._getNotificationSettingsAvalability = function () {
            return oNotificationSettingsAvailabilityDefferred.promise();
        };

        this._setNotificationsAsSeen = function () {
            var that = this,
                oDeferred = jQuery.Deferred(),
                sResetBadgeNumberUrl = this._getRequestURI(oOperationEnum.RESET_BADGE_NUMBER),
                oRequestObject = {
                    requestUri: sResetBadgeNumberUrl,
                    method: "POST",
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        "Content-Type": "application/json",
                        "DataServiceVersion": sDataServiceVersion,
                        "X-CSRF-Token": sHeaderXcsrfToken
                    }
                };

            if (this._isFioriClientMode() === true || this._isPackagedMode() === true) {
                this._setNativeIconBadge(0);
            }

            OData.request(
                oRequestObject,

                // success handler
                function (oResult, oResponseData) {
                	oDeferred.resolve();
                },
                function (oMessage) {
                	if (that._csrfTokenInvalid(oMessage) && (bInvalidCsrfTokenRecoveryMode === false)) {
                		that._invalidCsrfTokenRecovery(oDeferred, that._setNotificationsAsSeen);
                	} else {
                        jQuery.sap.log.error("Notification service - oData reset badge number failed: ", oMessage, "sap.ushell.services.Notifications");
                        oDeferred.reject(oMessage);
                	}
                }
            );
            return oDeferred.promise();
        };

        /**
         * Basic notifications data read flow, occurs either on service initialization or on web-socket/polling update event.
         * Includes two read operations:
         * - Read UnseenNotificationsCount and update consumers
         * - Read several (i.e. iInitialBufferSize) notification items
         *
         * The two returned promise objects are pushed into an array, and after resolved, the following steps are performed:
         * - Notifications (unseen) count consumers are updated
         * - Service model is updated with the read notification objects
         * - Notifications update consumers are updated
         * - Dependent consumers are updated (i.e. call that._updateDependentNotificationsConsumers())
         *
         * @param boolean value indicating whether the consumers should be updated
         *
         * @returns oDeferred.promise() object, indicating success of both read actions
         *
         * @private
         */
        this._readNotificationsData = function (bUpdateConsumers) {
            var that = this,
                oReadUnseesCountPromise,
                oReadNotificationsPromise,
                oReadNotificationsCountPromise,
                oDeferred = new jQuery.Deferred(),
                aPromises = [];

            oReadUnseesCountPromise = this._readUnseenNotificationsCount(bUpdateConsumers);
            aPromises.push(oReadUnseesCountPromise);

            oReadNotificationsCountPromise = this.readNotificationsCount();
            oReadNotificationsCountPromise.done(function (oResponseData) {
                oModel.setProperty("/NotificationsCount", oResponseData);
            });

            oReadNotificationsPromise = this.getNotificationsBufferBySortingType(oOperationEnum.NOTIFICATIONS_BY_DATE_DESCENDING, 0, iInitialBufferSize);
            aPromises.push(oReadNotificationsPromise);

            jQuery.when.apply(jQuery, aPromises).then(function (args) {

                // When the deferred.promise of _readUnseenNotificationsCount is resolved
                aPromises[0].done(function (oResponseData) {
                    if (bUpdateConsumers === true) {
                        that._updateNotificationsCountConsumers();
                    }
                });

                // When the deferred.promise of getNotificationsBufferBySortingType is resolved
                aPromises[1].done(function (oResponseData) {
                    oModel.setProperty("/Notifications", oResponseData);
                    that._notificationAlert(oResponseData);
                    if (bUpdateConsumers === true) {
                        that._updateNotificationsConsumers();
                        that._updateDependentNotificationsConsumers();
                    }
                    oDeferred.resolve();
                });
            });
            return oDeferred.promise();
        };

        this._getHeaderXcsrfToken = function () {
            return sHeaderXcsrfToken;
        };

        this._getDataServiceVersion = function () {
            return sDataServiceVersion;
        };

        /**
         * Returns the appropriate URI that should be used in an OData request according to the nature of the request
         * and according to filtering that might be required.
         * The object aRequestURIs is filled with the basic and/or byIntents-filter URI, and is used for maintaining the URIs throughout the session.
         *
         * @param {object} The value form the enumeration oOperationEnum, representing the relevant request
         *
         * @returns {string} The URI that should be user in the OData.read call
         */
        this._getRequestURI = function (oRequiredURI, oArgs) {
            var sReturnedURI,
                sEncodedConsumedIntents = encodeURI(this._getConsumedIntents(oRequiredURI));

            switch (oRequiredURI) {

                // Get notifications
                case oOperationEnum.NOTIFICATIONS:
                    if (aRequestURIs.getNotifications.basic === undefined) {
                        aRequestURIs.getNotifications.basic = oServiceConfig.serviceUrl + "/Notifications?$expand=Actions,NavigationTargetParams&$filter=IsGroupHeader%20eq%20false";
                    }
                    if (this._isIntentBasedConsumption()) {
                        if (aRequestURIs.getNotifications.byIntents === undefined) {
                            aRequestURIs.getNotifications.byIntents = aRequestURIs.getNotifications.basic.concat("&intents%20eq%20" + sEncodedConsumedIntents);
                        }
                        return aRequestURIs.getNotifications.byIntents;
                    }
                    return aRequestURIs.getNotifications.basic;
                // Get notifications, grouped by type
                case oOperationEnum.NOTIFICATIONS_BY_TYPE:
                    if (aRequestURIs.getNotificationsByType.basic === undefined) {
                        aRequestURIs.getNotificationsByType.basic = oServiceConfig.serviceUrl + "/Notifications?$expand=Actions,NavigationTargetParams";
                    }
                    if (this._isIntentBasedConsumption()) {
                        if (aRequestURIs.getNotificationsByType.byIntents === undefined) {
                            aRequestURIs.getNotificationsByType.byIntents = aRequestURIs.getNotificationsByType.basic.concat("&$filter=intents%20eq%20" + sEncodedConsumedIntents);
                        }
                        return aRequestURIs.getNotificationsByType.byIntents;
                    }
                    return aRequestURIs.getNotificationsByType.basic;

                // Get notifications group Headers
                case oOperationEnum.NOTIFICATIONS_GROUP_HEADERS:
                    if (aRequestURIs.getNotificationsGroupHeaders.basic === undefined) {
                        aRequestURIs.getNotificationsGroupHeaders.basic = oServiceConfig.serviceUrl + "/Notifications?$expand=Actions,NavigationTargetParams&$filter=IsGroupHeader%20eq%20true";
                    }
                    if (this._isIntentBasedConsumption()) {
                        if (aRequestURIs.getNotificationsGroupHeaders.byIntents === undefined) {
                            aRequestURIs.getNotificationsGroupHeaders.byIntents = aRequestURIs.getNotificationsGroupHeaders.basic.concat("&intents%20eq%20" + sEncodedConsumedIntents);
                        }
                        return aRequestURIs.getNotificationsGroupHeaders.byIntents;
                    }
                    return aRequestURIs.getNotificationsGroupHeaders.basic;

                // Get notifications in group
                case oOperationEnum.NOTIFICATIONS_IN_GROUP:
                    sReturnedURI = oServiceConfig.serviceUrl + "/Notifications?$expand=Actions,NavigationTargetParams&$orderby=CreatedAt desc&$filter=IsGroupHeader eq false and ParentId eq " + oArgs.group + "&$skip=" + oArgs.skip + "&$top=" + oArgs.top;

                    if (this._isIntentBasedConsumption() === true) {
                        sReturnedURI = sReturnedURI.concat("&intents%20eq%20" + sEncodedConsumedIntents);
                    }
                    break;

                // Get badge number
                case oOperationEnum.GET_BADGE_NUMBER:
                    if (aRequestURIs.getBadgeNumber.basic === undefined) {
                        aRequestURIs.getBadgeNumber.basic = oServiceConfig.serviceUrl + "/GetBadgeNumber()";
                    }
                    if (this._isIntentBasedConsumption()) {
                        if (aRequestURIs.getBadgeNumber.byIntents === undefined) {
                            aRequestURIs.getBadgeNumber.byIntents = oServiceConfig.serviceUrl + "/GetBadgeCountByIntent(" + sEncodedConsumedIntents + ")";
                        }
                        return aRequestURIs.getBadgeNumber.byIntents;
                    }
                    return aRequestURIs.getBadgeNumber.basic;

                // Get Notification Count
                case oOperationEnum.GET_NOTIFICATIONS_COUNT:
                    if (aRequestURIs.getNotificationCount.basic === undefined) {
                        aRequestURIs.getNotificationCount.basic = oServiceConfig.serviceUrl + "/Notifications/$count";
                    }
                    return aRequestURIs.getNotificationCount.basic;

                // Reset badge number (i.e. mark all notifications as "seen")
                case oOperationEnum.RESET_BADGE_NUMBER:
                    if (aRequestURIs.resetBadgeNumber.basic === undefined) {
                        aRequestURIs.resetBadgeNumber.basic = oServiceConfig.serviceUrl + "/ResetBadgeNumber";
                    }
                    return aRequestURIs.resetBadgeNumber.basic;

                // Get user settings
                case oOperationEnum.GET_SETTINGS:
                    if (aRequestURIs.getNotificationTypesSettings.basic === undefined) {
                        aRequestURIs.getNotificationTypesSettings.basic = oServiceConfig.serviceUrl + "/NotificationTypePersonalizationSet";
                    }
                    return aRequestURIs.getNotificationTypesSettings.basic;

                case oOperationEnum.GET_MOBILE_SUPPORT_SETTINGS:
                    if (aRequestURIs.getMobileSupportSettings.basic === undefined) {
                        aRequestURIs.getMobileSupportSettings.basic = oServiceConfig.serviceUrl + "/Channels(ChannelId='SAP_SMP')";
                    }
                    return aRequestURIs.getMobileSupportSettings.basic;

                case oOperationEnum.VALIDATE_WEBSOCKET_CHANNEL:
                    if (aRequestURIs.getWebSocketValidity.basic === undefined) {
                        aRequestURIs.getWebSocketValidity.basic = oServiceConfig.serviceUrl + "/Channels('SAP_WEBSOCKET')";
                    }
                    return aRequestURIs.getWebSocketValidity.basic;

                // Get a buffer of notifications (using $skip, $top and $orderby options) sorted by date in descending order
                case oOperationEnum.NOTIFICATIONS_BY_DATE_DESCENDING:
                    sReturnedURI = oServiceConfig.serviceUrl + "/Notifications?$expand=Actions,NavigationTargetParams&$orderby=CreatedAt%20desc&$filter=IsGroupHeader%20eq%20false&$skip=" + oArgs.skip + "&$top=" + oArgs.top;
                    if (this._isIntentBasedConsumption() === true) {
                        sReturnedURI = sReturnedURI.concat("&intents%20eq%20" + sEncodedConsumedIntents);
                    }
                    break;

                // Get a buffer of notifications (using $skip, $top and $orderby options) sorted by date in ascending order
                case oOperationEnum.NOTIFICATIONS_BY_DATE_ASCENDING:
                    sReturnedURI = oServiceConfig.serviceUrl + "/Notifications?$expand=Actions,NavigationTargetParams&$orderby=CreatedAt%20asc&$filter=IsGroupHeader%20eq%20false&$skip=" + oArgs.skip + "&$top=" + oArgs.top;
                    if (this._isIntentBasedConsumption() === true) {
                        sReturnedURI = sReturnedURI.concat("&intents%20eq%20" + sEncodedConsumedIntents);
                    }
                    break;

                // Get a buffer of notifications (using $skip, $top and $orderby options) sorted by priority in ascending order
                case oOperationEnum.NOTIFICATIONS_BY_PRIORITY_DESCENDING:
                    sReturnedURI = oServiceConfig.serviceUrl + "/Notifications?$expand=Actions,NavigationTargetParams&$orderby=Priority%20desc&$filter=IsGroupHeader%20eq%20false&$skip=" + oArgs.skip + "&$top=" + oArgs.top;
                    if (this._isIntentBasedConsumption() === true) {
                        sReturnedURI = sReturnedURI.concat("&intents%20eq%20" + sEncodedConsumedIntents);
                    }
                    break;

                default:
                    sReturnedURI = "";
            }
            return sReturnedURI;
        };

        /**
         * For testing purposes
         *
         * @private
         */
        this._readSettingsFromServer_noConnection = function () {
            var oDeferred = jQuery.Deferred(),
                // Notification types content for testing the Settings feature
                aNotificationTypesSettings = [{
                    NotificationTypeId: "type1",
                    NotificationTypeDesc: "aaaaabbbbb-cccccddddd",
                    PriorityDefault: "40-HIGH",
                    DoNotDeliver: false,
                    DoNotDeliverMob: true
                }, {
                    NotificationTypeId: "type2",
                    NotificationTypeDesc: "cccccdddddccc-aaaaabbbbb",
                    PriorityDefault: "10-LOW",
                    DoNotDeliver: true,
                    DoNotDeliverMob: true
                }];

            oDeferred.resolve(JSON.stringify({
                "@odata.context" : "$metadata#NotificationTypePersonalizationSet",
                "value" : aNotificationTypesSettings
            }));
            return oDeferred.promise();
        };

        /**
         * For testing purposes
         *
         * @private
         */
        this._readSettingsFromServer_noData = function () {
            var oDeferred = jQuery.Deferred();

            oDeferred.resolve(JSON.stringify({
                "@odata.context" : "$metadata#NotificationTypePersonalizationSet",
                "value" : {}
            }));
            return oDeferred.promise();
        };

        this._readSettingsFromServer = function () {
            var sReadSettingsUrl = this._getRequestURI(oOperationEnum.GET_SETTINGS),
                oRequestObject = {
                    requestUri: sReadSettingsUrl
                },
                oDeferred = jQuery.Deferred();

            OData.request(oRequestObject,
                function (oResult) {
                    oDeferred.resolve(oResult.results);
                }, function (oMessage) {
                    if (oMessage.response && oMessage.response.statusCode === 200 && oMessage.response.body) {
                        oDeferred.resolve(oMessage.response.body);
                    } else {
                        oDeferred.reject(oMessage);
                        jQuery.sap.log.error("Notification service - oData get settings failed: ", oMessage, "sap.ushell.services.Notifications");
                    }
                });
            return oDeferred.promise();
        };

        /**
         * Verifying whether the "push notifications to mobile" feature is supported.
         *
         * @return A Deferred.promise object that is always resolved even if the request failed.<br>
         * In case of failure - the response property successStatus gets the value <code>false</code>
         */
        this._readMobileSettingsFromServer = function () {
            var sRequestUrl = this._getRequestURI(oOperationEnum.GET_MOBILE_SUPPORT_SETTINGS),
                oRequestObject = {
                    requestUri: sRequestUrl
                },
                oDeferred = jQuery.Deferred(),
                oResponseObject,
                sUpdatedResponseString,
                bSuccessStatus;

            OData.request(oRequestObject,
                function (oResult) {
                    if(typeof (oResult.results) === "string") {
                    	oResponseObject = JSON.parse(oResult.results);
                    	oResponseObject.successStatus = true;
                    	sUpdatedResponseString = JSON.stringify(oResponseObject);
                    	oDeferred.resolve(sUpdatedResponseString);
                    } else {
                        oResult.results.successStatus = true;
                        oDeferred.resolve(oResult.results);
                    }
                }, function (oMessage) {
                    if (oMessage.response && oMessage.response.statusCode === 200 && oMessage.response.body) {
                    	oResponseObject = JSON.parse(oMessage.response.body);
                    	oResponseObject.successStatus = true;
                    	sUpdatedResponseString = JSON.stringify(oResponseObject);
                        oDeferred.resolve(sUpdatedResponseString);
                    } else {
                        oDeferred.resolve(JSON.stringify({successStatus : false}));
                        jQuery.sap.log.error("Notification service - oData get settings failed: ", oMessage, "sap.ushell.services.Notifications");
                    }
                });

            return oDeferred.promise();
        };

        /**
         * Verifying whether the WebSocket is active (while it is already opened)
         *
         * @return A Deferred.promise object that is always resolved even if the request fails.<br>
         * The actual response is returned as the done function's boolean parameter:<br>
         * In case of active WebSocket - the value <code>true</code> is returned, and <code>false</code> otherwise.
         */
        this._checkWebSocketActivity = function () {
            var sRequestUrl = this._getRequestURI(oOperationEnum.VALIDATE_WEBSOCKET_CHANNEL),
                oRequestObject = {
                    requestUri: sRequestUrl
                },
                oDeferred = jQuery.Deferred(),
                oResponseObject;

            OData.request(oRequestObject,
                function (oResult) {
                    if(typeof (oResult.results) === "string") {
                        oResponseObject = JSON.parse(oResult.results);
                        oDeferred.resolve(oResponseObject.IsActive);
                    } else {
                        oDeferred.resolve(false);
                    }
                }, function (oMessage) {
                    if (oMessage.response && oMessage.response.statusCode === 200 && oMessage.response.body) {
                        oResponseObject = JSON.parse(oMessage.response.body);
                        oDeferred.resolve(oResponseObject.IsActive);
                    } else {
                        oDeferred.resolve(false);
                        jQuery.sap.log.error("Notification service - oData get settings failed: ", oMessage, "sap.ushell.services.Notifications");
                    }
                });

            return oDeferred.promise();
        };

        this._writeSettingsEntryToServer = function (oEntry) {
            var that = this,
                oDeferred,
                sSetSettingsUrl = this._getRequestURI(oOperationEnum.GET_SETTINGS) + "(NotificationTypeId=" + oEntry.NotificationTypeId + ")",
                oRequestObject = {
                    requestUri: sSetSettingsUrl,
                    method: "PUT",
                    data: {
                        "@odata.context" : "$metadata#NotificationTypePersonalizationSet/$entity",
                        "NotificationTypeId" : oEntry.NotificationTypeId,
                        "NotificationTypeDesc" : oEntry.NotificationTypeDesc,
                        "PriorityDefault" : oEntry.PriorityDefault,
                        "DoNotDeliver" : oEntry.DoNotDeliver,
                        "DoNotDeliverMob" : oEntry.DoNotDeliverMob
                    },
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        "Content-Type": "application/json",
                        "DataServiceVersion": sDataServiceVersion,
                        "X-CSRF-Token": sHeaderXcsrfToken
                    }
                };
            oDeferred = jQuery.Deferred();

            OData.request(oRequestObject,
                function (oResult) {
                    oDeferred.resolve(oResult);
                }, function (oMessage) {
                    if (oMessage.response && oMessage.response.statusCode === 200 && oMessage.response.body) {
                        oDeferred.resolve(oMessage.response.body);
                    } else if (that._csrfTokenInvalid(oMessage) && (bInvalidCsrfTokenRecoveryMode === false)) {
                        that._invalidCsrfTokenRecovery(oDeferred, that._writeSettingsEntryToServer, [oEntry]);
                    } else {
                        oDeferred.reject(oMessage);
                        jQuery.sap.log.error("Notification service - oData set settings entry failed: ", oMessage, "sap.ushell.services.Notifications");
                    }
                });

            return oDeferred.promise();
        };

        // ********************************** oData functionality - End ************************************
        // *************************************************************************************************

        this._updateNotificationsConsumers = function () {
            aUpdateNotificationsCallbacks.forEach(function (callback) {
                callback();
            });
        };

        this._updateDependentNotificationsConsumers = function () {
            var that = this,
                oDeferred = new jQuery.Deferred();

            aUpdateDependencyNotificationsCallbacks.forEach(function (callbackObj) {
                // If there is no registered module that with resolve/reject the deferred object -
                // invoke the callback function without any parameter, so it will be executed regardless of any deferred object
                if (that.bUpdateDependencyInitiatorExists === false) {
                    callbackObj.callback();
                } else {
                    // If the consumer defined itself as "dependent", then it gets the promise object (as a parameter to the callback function)
                    // otherwise it gets the deferred object
                    callbackObj.dependent === true ? callbackObj.callback(oDeferred.promise()) : callbackObj.callback(oDeferred);
                }
            });
        };

        this._updateNotificationsCountConsumers = function () {
            aUpdateNotificationsCountCallbacks.forEach(function (callback) {
                callback();
            });
        };

        this._updateAllConsumers = function () {
            this._updateNotificationsConsumers();
            this._updateNotificationsCountConsumers();
            this._updateDependentNotificationsConsumers();
        };

        this._getModel = function () {
            return oModel;
        };

        //*************************************************************************************************
        //***********************  Handle Notifications consumption / modes - Begin ***********************

        this._getMode = function () {
            return oCurrentMode;
        };

        /**
         * There are four possible modes of working of Notification service, defined by oModesEnum.
         * The following functions (i.e. steps) are executes sequentially, from _setWorkingMode (step 1) downwards
         * in order to find what is the relevant working mode for notification service and to activate it.
         */

        /**
         * Starting the process of defining the mode in which notifications service consume notifications data.
         * Step 1. Handle packagedApp mode
         */
        this._setWorkingMode = function () {
            var aConsumedIntentsFromConfig;

            // check service configuration for ConsumedIntents enabling flag and data
            if (oServiceConfig.intentBasedConsumption === true) {
                aConsumedIntents = this._getIntentsFromConfiguration(oServiceConfig.consumedIntents);
                if (aConsumedIntents.length > 0) {
                    // First setting of the flag is from service configuration
                    bIntentBasedConsumption = true;
                }
            }

            // Check if this is packagedApp use-case
            if (this._isPackagedMode()) {
                oCurrentMode = oModesEnum.PACKAGED_APP;

                // Consumed intents are read from PackagedApp configuration, if exist
                aConsumedIntentsFromConfig = this._getIntentsFromConfiguration(window.fiori_client_appConfig.applications);
                if (aConsumedIntentsFromConfig.length > 0) {
                    aConsumedIntents = aConsumedIntentsFromConfig;
                }

                if (aConsumedIntents.length > 0) {
                    // Second setting of the flag (to true) is done in case of PackagedApp mode and if any intents were configured
                    bIntentBasedConsumption = true;
                }

                this._registerForPush();
                this._readNotificationsData(true);

                this._setNativeIconBadgeWithDelay();

                return;
            }

            // Call step 2: Perform the first oData read request
            this._performFirstRead();
        };

        /**
         * Step 2. Issue the initial oData call for getting notification data,
         *  then wait until it is possible to check if we're in Fiori Client mode:
         *  The execution of the _isFioriClientMode check must be delayed by 6000ms for initial loading
         *  since it relies on the flag sap.FioriClient that is set by FioriClient
         */
        this._performFirstRead = function () {
            var that = this,
                tFioriClientRemainingDelay,
                oReadPromise = this._readNotificationsData(true);

            oReadPromise.done(function () {
                // Calculate time left until Fiori Client mode can be checked
                tFioriClientRemainingDelay = that._getFioriClientRemainingDelay();
                if (tFioriClientRemainingDelay <= 0) {
                    that._fioriClientStep();
                } else {
                	initialReadTimer = setTimeout(function () {
                        that._fioriClientStep();
                    }, tFioriClientRemainingDelay);
                }
                bFirstDataLoaded = true;
            }).fail(function (sMsg) {
                jQuery.sap.log.error("Notifications oData read failed. Error: " + sMsg);
                return;
            });
        };

        /**
         * Step 3. waiting the delay necessary for Fiori Client - Check if this is indeed Fiori Client mode
         * If so - initialize Fiori Client mode. If not - go to the nest step (webSocket)
         */
        this._fioriClientStep = function () {
            var that = this,
                oUnseenNotificatiosCountPromise;

            if (this._isFioriClientMode()) {
                oCurrentMode = oModesEnum.FIORI_CLIENT;
                this._addPushNotificationHandler();

                oUnseenNotificatiosCountPromise = this.getUnseenNotificationsCount();
                oUnseenNotificatiosCountPromise.done(function (iBadgeValue) {
                    that._setNativeIconBadge(iBadgeValue, function () {});
                }).fail(function () {});
            } else {
                this._webSocketStep();
            }
        };

        /**
         * Step 4. WebSocket step
         */
        this._webSocketStep = function () {
            oCurrentMode = oModesEnum.WEB_SOCKET;
            this._establishWebSocketConnection();
        };

        /**
         * Step 5. WebSocket recovery step
         * Called on WebSocket onClose event.
         * In this case there one additional trial to establish the WebSOcket connection.
         * If the additional attempt also fails - move to polling
         */
        this._webSocketRecoveryStep = function () {

            if (bWebSocketRecoveryAttempted === false) {
                bWebSocketRecoveryAttempted = true;
                webSocketRecoveryTimer = setTimeout(function() {
                    this._webSocketStep();
                }.bind(this), tWebSocketRecoveryPeriod);
            } else {
                // Since the first request for notifications data was already issued -
                // the first polling request is delayed by (iPollingInterval * 1000) seconds
                this._activatePollingAfterInterval();
            }
        };

        this._activatePollingAfterInterval = function () {
            var that = this;

            pollingTimer = setTimeout(function() {
                that._activatePolling();
            }, iPollingInterval * 1000);
        };

        /**
         * Step 6. Polling
         */
        this._activatePolling = function () {
            var that = this;

            oCurrentMode = oModesEnum.POLLING;
            this._readNotificationsData(true);
            // Call again after a delay
            pollingTimer = setTimeout(that._activatePolling.bind(that, iPollingInterval, false), (iPollingInterval * 1000));
        };

        this._formatAsDate = function (sUnformated) {
            return new Date(sUnformated);
        };

        this._notificationAlert = function (results) {

            // If alerts/banners for HIGH priority notifications are disabled by the user - then return
            if (bHighPriorityBannerEnabled === false) {
                return;
            }

            var oNotification,
                aNewNotifications = [],
                nextLastNotificationDate = 0;

            for (oNotification in results) {
                if (this.lastNotificationDate && this._formatAsDate(results[oNotification].CreatedAt) > this.lastNotificationDate) {
                    if (results[oNotification].Priority === "HIGH") {
                        aNewNotifications.push(results[oNotification]);
                    }
                }
                //get the last notification date
                if (nextLastNotificationDate < this._formatAsDate(results[oNotification].CreatedAt)) {
                    nextLastNotificationDate = this._formatAsDate(results[oNotification].CreatedAt);
                }

            }
            if (this.lastNotificationDate && aNewNotifications && aNewNotifications.length > 0) {
                sap.ui.getCore().getEventBus().publish("sap.ushell.services.Notifications", "onNewNotifications", aNewNotifications);
            }
            this.lastNotificationDate = nextLastNotificationDate;
        };

        /**
         * Returning the time, in milliseconds, left until the end of FioriClient waiting period.
         * The required period is represented by tFioriClientInitializationPeriod,
         *  and we reduce the time passed from service initialization until now
         */
        this._getFioriClientRemainingDelay = function () {
            return tFioriClientInitializationPeriod - (new Date() - tInitializationTimestamp);
        };

        /**
         * Establishing a WebSocket connection for push updates
         */
        this._establishWebSocketConnection = function () {
            var that = this,
                bDeliberateClose = false,
                oPcpFields;

            try {
                // Init WebSocket connection (TODO move into metadataloaded to ensure that authentication is done)
                // TODO: version 7.51 (ABAP) will include v11, with ping-pong health check
                // TODO: add the attachOpen function and log the event
                oWebSocket = this._getWebSocketObjectObject(sWebSocketUrl, [SapPcpWebSocket.SUPPORTED_PROTOCOLS.v10]);

                oWebSocket.attachMessage(this, function(oMessage, oData) {
                    oPcpFields = oMessage.getParameter("pcpFields");
                    if ((oPcpFields) && (oPcpFields.Command) && (oPcpFields.Command === "Notification")) {
                        // Receive "pings" for Notification EntitySet
                        // Another optional "ping" would be oPcpFields.Command === "Badge" for new Badge Number, but is currently not supported.
                        that._readNotificationsData(true);
                    }
                });

                oWebSocket.attachOpen(this, function(oArgs) {
                    that._checkWebSocketActivity().done(function (bIsActive) {
                        // In case that bIsActive is false, it mean that the webSocket is not active although the connection is opened.
                        // in this case we should close the WebSocket connection and switch to polling step.
                       if (!bIsActive) {
                           bDeliberateClose = true;
                           oWebSocket.close();
                           that._activatePollingAfterInterval();
                       }
                    })
                    jQuery.sap.log.info("Notifications UShell service WebSocket: webSocket connection opened");
                });

                oWebSocket.attachClose(this, function(oEvent, oData) {
                    jQuery.sap.log.warning("Notifications UShell service WebSocket: attachClose called with code: " +  oEvent.mParameters.code + " and reason: " + oEvent.mParameters.reason);
                    if ((!bOnServiceDestroy) && (!bDeliberateClose)) {
                        that._webSocketRecoveryStep();
                    }
                });

                // attachError is not being handled since each attachError is followed by a call to attachClose (...which includes handling)
                oWebSocket.attachError(this, function(oError, oData) {
                    jQuery.sap.log.warning("Notifications UShell service WebSocket: attachError called!");
                });
            } catch (e) {
                jQuery.sap.log.error("Exception occurred while creating new sap.ui.core.ws.SapPcpWebSocket. Message: " + e.message);
            }
        };
        // *********************** Handle Notifications consumption / modes - End **************************
        // *************************************************************************************************

        // *************************************************************************************************
        // **************** Helper functions for Fiori client and PackagedApp mode - Begin *****************

        this._isFioriClientMode = function () {
            return !(sap.FioriClient === undefined);
        };

        /**
         * Helper function for Packaged App mode
         */
        this._isPackagedMode = function () {
            return (window.fiori_client_appConfig && window.fiori_client_appConfig.prepackaged === true);
        };

        this._setNativeIconBadge = function (iBadgeValue) {
            if ((sap.Push !== undefined) && (sap.Push.setBadgeNumber !== undefined)) {
                sap.Push.setBadgeNumber(iBadgeValue, function () {});
            }
        };

        this._setNativeIconBadgeWithDelay = function () {
            var that = this,
                oUnseenNotificatiosCountPromise;

            setTimeout(function () {
                oUnseenNotificatiosCountPromise = that.getUnseenNotificationsCount();

                oUnseenNotificatiosCountPromise.done(function (iBadgeValue) {
                    that._setNativeIconBadge(iBadgeValue);
                }).fail(function () {});
            }, 4000);
        };

        this._getIntentsFromConfiguration = function (aInput) {
            var aTempConsumedIntents = [],
                sTempIntent,
                index;

            if (aInput && aInput.length > 0) {
                for (index = 0; index < aInput.length; index++) {
                    sTempIntent = aInput[index].intent;
                    aTempConsumedIntents.push(sTempIntent);
                }
            }
            return aTempConsumedIntents;
        };

        this._handlePushedNotification = function (oNotificationData) {
           var sNotificationId,
                sSemanticObject,
                sAction,
                oParameters,
                aParameters = [],
                oViewPortContainer;

            if (oNotificationData !== undefined) {
                // Either oNotificationData.additionalData is not defined
                // OR oNotificationData.additionalData has the value "true" (foreground use-case)
                if ((oNotificationData.additionalData === undefined) || (oNotificationData.additionalData.foreground === true)) {

                    // The given notification object is ignored, and we relate to this use-case as a "ping",
                    // telling us that notifications data (in the Notification Center) was changed,
                    // hence the call to _readNotificationsData
                    this._readNotificationsData(true);

                // Background use-case (oNotificationData.additionalData is defined and equals "false")
                } else {
                    // Read the semantic object, the action and the navigation parameters from the additionalData part of the notification,
                	// or as a fallback - from the notification item's data

                    if (oNotificationData.additionalData && oNotificationData.additionalData.NavigationTargetObject) {
                        sSemanticObject = oNotificationData.additionalData.NavigationTargetObject;
                    } else {
                        sSemanticObject = oNotificationData.NavigationTargetObject; 
                    }

                    if (oNotificationData.additionalData && oNotificationData.additionalData.NavigationTargetAction) {
                        sAction = oNotificationData.additionalData.NavigationTargetAction;
                    } else {
                        sAction = oNotificationData.NavigationTargetAction; 
                    }

                    if (oNotificationData.additionalData && oNotificationData.additionalData.NavigationTargetParam) {
                        oParameters = oNotificationData.additionalData.NavigationTargetParam;
                    } else {
                        oParameters = oNotificationData.NavigationTargetParam;
                    }

                    if (oParameters) {
                        if (typeof oParameters === 'string' || oParameters instanceof String) {
                            aParameters[0] = oParameters;
                        } else if (Array.isArray(oParameters) === true) {
                            aParameters = oParameters;
                        }
                    }

                    sNotificationId = oNotificationData.NotificationId;

                    // In case the notification object's hash is "Shell-home"
                    if ((typeof hasher !== "undefined") && (hasher.getHash() === sSemanticObject + "-" + sAction)) {
                        oViewPortContainer = sap.ui.getCore().byId('viewPortContainer');
                        if (oViewPortContainer) {
                            oViewPortContainer.switchState("Center");
                        }
                    }

                    // Perform a navigation action according to the pushed notificaiton's intent
                    sap.ushell.utils.toExternalWithParameters(sSemanticObject, sAction, aParameters);

                    this.markRead(sNotificationId);

                    this._readNotificationsData(true);
                }
            }
        };

        this._registerForPush = function () {
            sap.Push.initPush(this._handlePushedNotification.bind(this));
        };

        /**
         * For Fiori Client use case on mobile platform.
         * This function registers the callback this._handlePushedNotification for the deviceready event
         */
        this._addPushNotificationHandler = function () {
            document.addEventListener("deviceready", this._registerForPush.bind(this), false);
        };

        this._isIntentBasedConsumption = function () {
            return bIntentBasedConsumption;
        };

        /**
         * Creates and returns the intents filter string of an OData request
         * For example: &NavigationIntent%20eq%20%27Action-toappstatesample%27%20or%20NavigationIntent%20eq%20%27Action-toappnavsample%27
         */
        this._getConsumedIntents = function (oResuestURI) {
            var sConsumedIntents = "",
                index;

            if (!this._isIntentBasedConsumption()) {
                return sConsumedIntents;
            }

            if (aConsumedIntents.length > 0) {

                // If it is not GetBadgeNumber use-case then the intents filter string should start with "&"
                if (oResuestURI !== oOperationEnum.GET_BADGE_NUMBER) {
                    sConsumedIntents = "&";
                }

                for (index = 0; index < aConsumedIntents.length; index++) {
                    // If it is GetBadgeNumber use case then the intent are comma separated
                    if (oResuestURI === oOperationEnum.GET_BADGE_NUMBER) {
                        if (index === 0) {
                            sConsumedIntents = aConsumedIntents[index];
                        } else {
                            sConsumedIntents = sConsumedIntents + "," + aConsumedIntents[index];
                        }
                    } else {
                        sConsumedIntents = sConsumedIntents + "NavigationIntent%20eq%20%27" + aConsumedIntents[index] + "%27";
                    }
                }
            }
            return sConsumedIntents;
        };

        this._revalidateCsrfToken = function () {
            var oDeferred;

            sHeaderXcsrfToken = undefined;
            bCsrfDataSet = false;

            oDeferred = this.getNotificationsBufferBySortingType(oOperationEnum.NOTIFICATIONS_BY_DATE_DESCENDING, 0, 1);
            return oDeferred.promise();
        };

        this._csrfTokenInvalid = function (oMessage) {
            return (oMessage.response && (oMessage.response.statusCode === 403) && (oMessage.response.headers["x-csrf-token"] === "Required"));
        };

        /**
         * Called in case that the CSRF token becomes invalid during the session.
         *
         * This problem (i.e., invalid CSRF token) is found when a POST oData call fails (e.g, markRead).  
         * in such a case this function is called in order to perform the recovery flow.
         *
         * The recovery flow includes two main steps:
         *  1. Obtaining the new/valid CSRF token from the notification channel
         *  2. Calling the function that failed (with the same parameters)
         *  3. resolving/rejecting the deferred object of the first function call (the one that failed because the token became invalid)
         *     in order to continue with the original flow
         *     
         * @returns the function doesn't return anything, instead it resolves or rejects the given oOriginalDeferred
         *
         * @private
         */
        this._invalidCsrfTokenRecovery = function (oOriginalDeferred, fnFailedFunction, aArgsArray) {
            var that = this,
                // Getting the new/valid CSRF token
                oPromise = this._revalidateCsrfToken(),
                oSecondCallPromise;

            bInvalidCsrfTokenRecoveryMode = true;

            oPromise.done(function () {

            	// Call the function that failed (with the same parameters)
            	oSecondCallPromise = fnFailedFunction.apply(that, aArgsArray);

                oSecondCallPromise.done(function (oResult) {
                	bInvalidCsrfTokenRecoveryMode = false;
                	oOriginalDeferred.resolve(oResult);
                });
                oSecondCallPromise.fail(function (e) {
                    bInvalidCsrfTokenRecoveryMode = false;
                	if (e.response && e.response.statusCode === 200 && e.response.body) {
                    	oOriginalDeferred.resolve(e.response.body);
                    } else {
                    	oOriginalDeferred.reject(e);	
                    }
                });
            });
            oPromise.fail(function (e) {
                bInvalidCsrfTokenRecoveryMode = false;
            	oOriginalDeferred.reject(e);
                jQuery.sap.log.error("Notification service - oData markRead failed: ", e.message, "sap.ushell.services.Notifications");
            });
        };

        // **************** Helper functions for Fiori client and PackagedApp mode - End *****************
        // ***********************************************************************************************
        this._notificationsAscendingSortBy = function (aNotifications, sPropertyToSortBy) {
            aNotifications.sort(function (x, y) {
                var val1 = x[sPropertyToSortBy],
                    val2 = y[sPropertyToSortBy];

                if (val1 === val2) {
                    val1 = x.id;
                    val2 = y.id;
                }
                return val2 > val1 ? -1 : 1;
            });
            return aNotifications;
        };

        this._getWebSocketObjectObject = function (sWebSocketUrl, aVersionProtocol) {
        	return new SapPcpWebSocket(sWebSocketUrl, aVersionProtocol);
        };

        this._notificationsDescendingSortBy = function (aNotifications, sPropertyToSortBy) {
            aNotifications.sort(function (x, y) {
                var val1 = x[sPropertyToSortBy],
                    val2 = y[sPropertyToSortBy];

                // If the values of the two objects (the values of the sorting criterion) are equal,
                // then the sorting is done according to the objects' IDs
                if (val1 === val2) {
                    val1 = x.id;
                    val2 = y.id;
                    return val1 > val2 ? -1 : 1;
                }
                // If the sorting criterion is "priority" then we can not just compare the strings, because then the priority order is: "High", "Low", Medium".
                // instead, we find if one of the two objects has high priority.
                // if not, then we check if the 1st object has medium priority.
                // If not - then the 2nd object "wins"
                if (sPropertyToSortBy === "Priority") {
                    if (val1 === "HIGH") {
                        return -1;
                    }
                    if (val2 === "HIGH") {
                        return 1;
                    }
                    if (val1 === "MEDIUM") {
                        return -1;
                    }
                    return 1;
                }
                return val1 > val2 ? -1 : 1;
            });
            return aNotifications;
        };

        this.getOperationEnum = function () {
            return oOperationEnum;
        };

        /**
         * Read user settings flags from the personalization
         *  and update the variables bPreviewNotificationEnabled and bPreviewNotificationEnabled.
         * If the data does not yet exists in the personalization -
         *  write the default values of bPreviewNotificationEnabled and bPreviewNotificationEnabled to the personalization
         */
        this._readUserSettingsFlagsFromPersonalization = function () {
            var that = this,
                oDeferred,
                oPromise;

            try {
                oPromise = this._getUserSettingsPersonalizer().getPersData();
            } catch (err) {
                jQuery.sap.log.error("Personalization service does not work:");
                jQuery.sap.log.error(err.name + ": " + err.message);
                oDeferred = new jQuery.Deferred();
                oDeferred.reject(err);
                oPromise = oDeferred.promise();
            }

            oPromise.done(function (oFlagsData) {
                if (oFlagsData === undefined) {
                    that._writeUserSettingsFlagsToPersonalization ({
                        previewNotificationEnabled : bPreviewNotificationEnabled,
                        highPriorityBannerEnabled : bHighPriorityBannerEnabled
                    });
                } else {
                    bPreviewNotificationEnabled = oFlagsData.previewNotificationEnabled;
                    bHighPriorityBannerEnabled = oFlagsData.highPriorityBannerEnabled;
                }
                bUserFlagsReadFromPersonalization = true;
                oUserFlagsReadFromPersonalizationDefferred.resolve();
            });
            oPromise.fail(function () {
                jQuery.sap.log.error("Reading User Settings flags from Personalization service failed");
            });
        };

       /**
        * Write/save user settings flags to the personalization.
        * The saved data consists of the user's DoNotDisturb and EnablePreview flags values.
        */
        this._writeUserSettingsFlagsToPersonalization  = function (oFlags) {
            var oDeferred,
                oPromise;

            try {
                oPromise = this._getUserSettingsPersonalizer().setPersData(oFlags);
            } catch (err) {
                jQuery.sap.log.error("Personalization service does not work:");
                jQuery.sap.log.error(err.name + ": " + err.message);
                oDeferred = new jQuery.Deferred();
                oDeferred.reject(err);
                oPromise = oDeferred.promise();
            }
            return oPromise;
        };

       /**
        * If the instance of Personalizer (oUserSettingsPersonalizer) is not yet defined - then create it
        * and return oUserSettingsPersonalizer
        */
        this._getUserSettingsPersonalizer = function () {
            if (oUserSettingsPersonalizer === undefined) {
                oUserSettingsPersonalizer = this._createUserSettingsPersonalizer();
            }
            return oUserSettingsPersonalizer;
        };

        this._createUserSettingsPersonalizer = function () {
            var oPersonalizationService = sap.ushell.Container.getService("Personalization"),
                oComponent,
                oScope = {
                   keyCategory : oPersonalizationService.constants.keyCategory.FIXED_KEY,
                   writeFrequency: oPersonalizationService.constants.writeFrequency.LOW,
                   clientStorageAllowed : true
                },
                oPersId = {
                    container : "sap.ushell.services.Notifications",
                    item : "userSettingsData"
                },
                oPersonalizer = oPersonalizationService.getPersonalizer(oPersId, oScope, oComponent);

            return oPersonalizer;
        };

        this._updateCSRF = function (oResponseData) {
            if ((bCsrfDataSet === true) || (oResponseData.headers === undefined)) {
                return;
            }
            if (!this._getHeaderXcsrfToken()) {
                sHeaderXcsrfToken = oResponseData.headers["x-csrf-token"] || oResponseData.headers["X-CSRF-Token"] || oResponseData.headers["X-Csrf-Token"];
            }
            if (!this._getDataServiceVersion()) {
                sDataServiceVersion = oResponseData.headers.DataServiceVersion || oResponseData.headers["odata-version"];
            }
            bCsrfDataSet = true;
        };

        /**
         * Handles all the required steps in order to initialize Notificaiton Settings UI
         *
         * Issues two calles to the Notifications channel backend system
         * in order to check whether settigns feature and Push to Mobile features are supported
         */
        this._userSettingInitialization = function () {

            var oSettingsPromise,
                oMobileSettingsPromise,
                // Contains two boolean flags:
                // - settingsAvailable: Is the settings feature supported by the notification channel backend system
                // - mobileAvailable: Is the "push to mobile" feature supported by the notification channel backend system
                oSettingsStatus = {
                    settingsAvailable: false,
                    mobileAvailable: false
                },
                aPromises,
                oResponseObject,
                bMobileSupportResponseSuccess;

            // Read the part of user settings data that is kept in personalization service
            this._readUserSettingsFlagsFromPersonalization();

            // 1st asynchronious call: Get setting data from the beckaend, for the purpose of verifying that the feature is supported
            oSettingsPromise = this._readSettingsFromServer();
            // 2nd asynchronious call: verify Push To Mobile capability
            oMobileSettingsPromise = this._readMobileSettingsFromServer();

            aPromises = [oSettingsPromise, oMobileSettingsPromise];

            oSettingsPromise.done(function () {
                // Notification setting supported
                oSettingsStatus.settingsAvailable = true;
            });

            oSettingsPromise.fail(function () {
                // If notification setting is not available, the default user choice for preview enabling is set to true,
                // otherwise the user can't see preview at all
                bPreviewNotificationEnabled = true;
            });

            oMobileSettingsPromise.done(function (oResult) {
            	oResponseObject = JSON.parse(oResult);
            	bMobileSupportResponseSuccess = oResponseObject.successStatus;

                // Push to Mobile validation returned
            	if(bMobileSupportResponseSuccess) {
                    bNotificationSettingsMobileSupport = oResult ? oResponseObject.IsActive : false;
                    oSettingsStatus.mobileAvailable = bNotificationSettingsMobileSupport;
            	} else {
                    bNotificationSettingsMobileSupport = false;
                    oSettingsStatus.mobileAvailable = false;
                }
            });

            // Resolve the deferred object on which the setting UI depends after the two OData calls returned,
            // no matter if they were successful or not
            jQuery.when.apply(jQuery, aPromises).then(function (args) {
                // After both calls returned - the deferred object (on which the rendering of Notificaiton Settigns UI depends) is resolved
                oNotificationSettingsAvailabilityDefferred.resolve(oSettingsStatus);
            });
        };
    };

    Notifications.hasNoAdapter = true;
    return Notifications;
}, true /* bExport */);
