// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The Unified Shell's user activity service.
 *
 * @version 1.52.4
 */
sap.ui.define([
    "sap/ushell/services/AppType"
], function (appType) {
    "use strict";
    /*jslint nomen:true */
    /*global jQuery, sap, console */

    /**
     * This method is just for internal use within this service.
     * Constructs a new instance of a recent list, used for recent searches and recent apps.
     *
     * @name sap.ushell.services.UserRecents
     *
     * @param {integer} iMaxLength
     *     maximum number of entries in the list
     * @param {function} fnEquals
     *     used to decide whether an entry should be updated instead of inserting a new one
     * @param {function} fnCompare
     *     uesed to sort the list
     * @param {function} fnLoad
     *     called to load recent list from backend
     * @param {function} fnSave
     *     called to save current list into backend
     *
     * @constructor
     */
    function RecentList(iMaxLength, fnEquals, fnCompare, fnLoad, fnSave) {
        var aRecents = [],

        // private functions
            fnUpdateIfAlreadyIn = function (oItem, iTimestampNow) {
                return aRecents.some(function (oRecentEntry) {
                    var bFound;
                    if (fnEquals(oRecentEntry.oItem, oItem)) {
                        oRecentEntry.oItem = oItem;
                        oRecentEntry.iTimestamp = iTimestampNow;
                        oRecentEntry.iCount = oRecentEntry.iCount + 1;
                        bFound = true;
                    } else {
                        bFound = false;
                    }
                    return bFound;
                });
            },

            fnInsertNew = function (oItem, iTimestampNow) {
                var oNewEntry = {oItem: oItem,
                        iTimestamp: iTimestampNow,
                        iCount: 1};
                if (aRecents.length === iMaxLength) {
                    aRecents.sort(fnCompare);
                    aRecents.pop();
                }
                aRecents.push(oNewEntry);
            };

        // public interface
        this.newItem = function (oItem) {
            var oDeferred = new jQuery.Deferred();

            var iTimestampNow = +new Date(),  // timestamp: thanks to http://stackoverflow.com/a/221297
                bAlreadyIn;
            fnLoad().done(function (aLoadedRecents) {
                aRecents = aLoadedRecents || [];

                bAlreadyIn = fnUpdateIfAlreadyIn(oItem, iTimestampNow);
                if (!bAlreadyIn) {
                    fnInsertNew(oItem, iTimestampNow);
                }
                fnSave(aRecents).done(function (data) {
                    oDeferred.resolve(data);
                }).fail(function () {
                    oDeferred.reject();
                });
            });

            return oDeferred.promise();
        };

        this.getRecentItems = function () {
            var oDeferred = new jQuery.Deferred();

            fnLoad().done(function (aLoadedRecents) {
                aLoadedRecents = aLoadedRecents || [];
                aLoadedRecents.sort(fnCompare);
                aRecents = aLoadedRecents.slice(0, iMaxLength);
                oDeferred.resolve(jQuery.map(aRecents, function (oRecentEntry) {
                    return oRecentEntry.oItem;
                }));
            });

            return oDeferred.promise();
        };
    }

    /**
     * This method is just for internal use within this service.
     * Constructs a new instance of a recent activity, used for recent activity.
     *
     * @param {integer} iMaxLength
     *     maximum number of entries in the list
     * @param {function} fnEquals
     *     used to decide whether an entry should be updated instead of inserting a new one
     * @param {function} fnCompare
     *     uesed to sort the list
     * @param {function} fnLoad
     *     called to load recent list from backend
     * @param {function} fnSave
     *     called to save current list into backend
     *
     * @constructor
     */
    function RecentActivity(iMaxLength, fnEquals, fnCompare, fnLoad, fnSave) {
        var iMaximumDays = 30,
            oRecentActivities,

        // private functions
            fnUpdateIfAlreadyIn = function (oItem, iTimestampNow) {
                return oRecentActivities.recentUsageArray.some(function (oRecentEntry) {
                    var bFound;
                    if (fnEquals(oRecentEntry.oItem, oItem)) {

                        /*
                         in case both items considered as equal (by fnEquals function), we will override the saved item
                         only in case its type is not type 'Application'.

                         As the shell always adds user recent entry after every app closed, it might be that a different
                         App as 'OVP' for example will also use API to add its app as user-recent entry, and the information
                         they provide regarding the item to save is with higher value then the information the shell
                         constructs (icon title etc)
                         */
                        if ((oItem.appType === oRecentEntry.oItem.appType) ||
                            (oItem.appType !== appType.APP)) {

                            // override the item
                            jQuery.extend(oRecentEntry.oItem, oItem);
                            oRecentEntry.iTimestamp = iTimestampNow;
                            oRecentEntry.oItem.timestamp = iTimestampNow;
                            oRecentEntry.mobile = undefined;
                            oRecentEntry.tablet = undefined;
                            oRecentEntry.desktop = undefined;

                            // we update the counter if -
                            // - existing item and new item are of the same type OR
                            // - existing item and new item is not of same type BUT both are not Application
                            if ((oItem.appType === oRecentEntry.oItem.appType) ||
                                (oItem.appType !== appType.APP && oRecentEntry.oItem.appType !== appType.APP)){

                                // update both the usage array's last day and the global entry counter
                                oRecentEntry.aUsageArray[oRecentEntry.aUsageArray.length-1] += 1;
                                oRecentEntry.iCount += 1;
                            }

                            oRecentActivities.recentUsageArray.sort(fnCompare);
                        }

                        bFound = true;
                    } else {
                        bFound = false;
                    }
                    return bFound;
                });
            },

            fnInsertNew = function (oItem, iTimestampNow, sIcon) {
                oItem.timestamp = iTimestampNow;
                if (sIcon) {
                    oItem.icon = sIcon;
                }
                var oNewEntry = {oItem: oItem,
                    iTimestamp: iTimestampNow,
                    aUsageArray: [1],
                    iCount: 1,
                    mobile: undefined,
                    tablet: undefined,
                    desktop: undefined
                    };
                if (oRecentActivities.recentUsageArray.length === iMaxLength) {
                    oRecentActivities.recentUsageArray.pop();
                }
                oRecentActivities.recentUsageArray.unshift(oNewEntry);
            };

        // public interface
        this.newItem = function (oItem) {
            var oDeferred = new jQuery.Deferred();

            var iTimestampNow = +new Date(),  // timestamp: thanks to http://stackoverflow.com/a/221297
                sIcon =  this.getActivityIcon(oItem.appType, oItem.icon),
                bAlreadyIn,
                that = this,
                currentDay = this.getDayFromDateObj(new Date());
            fnLoad().done(function (aLoadedRecents) {
                oRecentActivities = that.getRecentActivitiesFromLoadedData(aLoadedRecents);
                // If the current day is different than the recent one -
                // add a new entry (for the current day's usage) to each usage array
                if (currentDay != oRecentActivities.recentDay) {
                    that.addNewDay();
                    oRecentActivities.recentDay = currentDay;
                }

                bAlreadyIn = fnUpdateIfAlreadyIn(oItem, iTimestampNow);
                if (!bAlreadyIn) {
                    fnInsertNew(oItem, iTimestampNow, sIcon);
                }
                fnSave(oRecentActivities).done(function (data) {
                    oDeferred.resolve(data);
                }).fail(function () {
                    oDeferred.reject();
                });
            });

            return oDeferred.promise();
        };
        this.getActivityIcon = function (sAppType, sIcon) {
            switch (sAppType) {
                case appType.SEARCH:
                    return sIcon ? sIcon : "sap-icon://search";
                case appType.COPILOT:
                    return sIcon ? sIcon : "sap-icon://co";
                default:
                    return undefined;
            }
        };

        /**
         * getRecentItems return last 30 activities for current device.
         * - Check if for the current device we have unresolved entries.
         * - resolve the unresolved entries and set the attribute according to the current device.
         * - persist data.
         * - return the last <maxNumOfActivities> entries or all entries supported by current device (if maxNumOfActivities was not provided).
         */
        this.getRecentItemsHelper = function (maxNumOfActivities) {
            var that = this,
                oDeferred = new jQuery.Deferred(),
                activityIndex,
                oActivity,
                sCurrentDevice,
                bIsResolved = false,
                aIntentsToResolve = [],
                currentDay = this.getDayFromDateObj(new Date()),
            //Helper function that returns the last <maxNumOfActivities> recent activities supported by current device.
                getRecentItemsForDevice = function (aLoadedRecents) {
                    var recentActivityForDevice = [],
                        iDeviceDependentActivityCounter = 0,
                        iRecentActivityCounter;

                    for (iRecentActivityCounter = 0; iRecentActivityCounter < aLoadedRecents.recentUsageArray.length && (!maxNumOfActivities || iDeviceDependentActivityCounter < maxNumOfActivities); iRecentActivityCounter++) {
                        oActivity = aLoadedRecents.recentUsageArray[iRecentActivityCounter];
                        if (oActivity[sCurrentDevice]) {
                            recentActivityForDevice.push(oActivity);
                            iDeviceDependentActivityCounter++;
                        }
                    }

                    oDeferred.resolve(recentActivityForDevice);
                };

            if (sap.ui.Device.system.desktop) {
                sCurrentDevice = "desktop";
            } else if (sap.ui.Device.system.tablet) {
                sCurrentDevice = "tablet";
            } else {
                sCurrentDevice = "mobile";
            }

            fnLoad().done(function (aLoadedRecents) {
                oRecentActivities = that.getRecentActivitiesFromLoadedData(aLoadedRecents);
                // If the current day is different than the recent one -
                // add a new entry (for the current day's usage) to each usage array
                var newDayAdded = false;
                if (currentDay != oRecentActivities.recentDay) {
                    that.addNewDay();
                    oRecentActivities.recentDay = currentDay;
                    newDayAdded = true;
                }

                //collect all unresolved activities for current device.
                for (activityIndex = 0; activityIndex < oRecentActivities.recentUsageArray.length && !bIsResolved; activityIndex++) {
                    oActivity = oRecentActivities.recentUsageArray[activityIndex];
                    if (oActivity[sCurrentDevice] === undefined) {
                        // check if url contains the mandatory parameters then add it to intents
                        if(oActivity.oItem.url.indexOf("?")>-1){
                            var mandatoryParams = oActivity.oItem.url.substring(oActivity.oItem.url.indexOf("?"));
                            // remove search app parameters
                            if(mandatoryParams.indexOf("&/")>-1){
                                mandatoryParams = mandatoryParams.substring(0,mandatoryParams.indexOf("&/"));
                            }
                            aIntentsToResolve.push(oActivity.oItem.appId + mandatoryParams);
                        }
                        else{
                            aIntentsToResolve.push(oActivity.oItem.appId);
                        }
                    } else {
                        //we have resolved the activities from here, no need to continue.
                        bIsResolved = true;
                    }
                }

                if (aIntentsToResolve.length > 0) {
                    //resolve intent support for current device.
                    sap.ushell.Container.getService("CrossApplicationNavigation").isIntentSupported(aIntentsToResolve)
                        .done(function (oResolved) {
                            //save resolutions in aLoadedRecents
                            bIsResolved = false;

                            for (activityIndex = 0; activityIndex < oRecentActivities.recentUsageArray.length && !bIsResolved; activityIndex++) {
                                oActivity = oRecentActivities.recentUsageArray[activityIndex];
                                if (oActivity[sCurrentDevice] === undefined) {
                                    mandatoryParams = "";
                                    if (oActivity.oItem.url.indexOf("?")>-1) {
                                        mandatoryParams = oActivity.oItem.url.substring(oActivity.oItem.url.indexOf("?"));
                                        // remove search app parameters
                                        if (mandatoryParams.indexOf("&/")>-1) {
                                            mandatoryParams = mandatoryParams.substring(0,mandatoryParams.indexOf("&/"));
                                        }
                                    }
                                    var oItem = oResolved[oActivity.oItem.appId + mandatoryParams];
                                    oActivity[sCurrentDevice] = oItem && oItem.supported ? true : false;
                                } else {
                                    bIsResolved = true;
                                }
                            }

                            // persist it.
                            fnSave(oRecentActivities).done(function (data) {
                                oDeferred.resolve(getRecentItemsForDevice(oRecentActivities));
                            }).fail(function () {
                                oDeferred.reject();
                            });
                        })
                        .fail(function (sMsg) {
                            oDeferred.reject(sMsg);
                        });
                } else {
                    if (newDayAdded) {
                        // If a new day was added, persist it.
                        fnSave(oRecentActivities).done(function (data) {
                            oDeferred.resolve(getRecentItemsForDevice(oRecentActivities));
                        }).fail(function () {
                            oDeferred.reject();
                        });
                    } else {
                        oDeferred.resolve(getRecentItemsForDevice(oRecentActivities));
                    }
                }
            });

            return oDeferred.promise();
        };

        this.getRecentItems = function () {
            var oDeferred = new jQuery.Deferred();
            //Return only the 30 most recent items
            this.getRecentItemsHelper(30).done(function (recentItems) {
                oDeferred.resolve(jQuery.map(recentItems, function (oRecentEntry) {
                    return oRecentEntry.oItem;
                }));
            });
            return oDeferred.promise();
        };

        this.getFrequentItems = function () {
            var oDeferred = new jQuery.Deferred();
            this.getRecentItemsHelper().done(function (recentItems) {
                var activityIndex,
                    iWorkingDaysCounter = 0,
                    aFrequentActivity = [],
                    oActivity,
                    previousActivityDate = recentItems[0] ? new Date(recentItems[0].iTimestamp) : undefined,
                    currentActivityDate;
                //Go through the recent activities list and leave only activities from the last 30 working days
                for (activityIndex = 0; activityIndex < recentItems.length && iWorkingDaysCounter < 30; activityIndex++) {
                    oActivity = recentItems[activityIndex];
                    //Add only activities that happened more than once
                    if (oActivity.iCount > 1) {
                        aFrequentActivity.push(oActivity);
                    }
                    currentActivityDate = new Date(oActivity.iTimestamp);
                    if (previousActivityDate.toDateString() != currentActivityDate.toDateString()) {
                        //If found an activity with a different date than the previous one, increase the days counter
                        iWorkingDaysCounter++;
                        previousActivityDate = currentActivityDate;
                    }
                }
                //Sort in descending order according to the count
                aFrequentActivity.sort(function(a,b){
                    return b.iCount - a.iCount;
                });
                //Take only first 30 items (30 most frequent items)
                aFrequentActivity = aFrequentActivity.slice(0,30);
                oDeferred.resolve(jQuery.map(aFrequentActivity, function (oRecentEntry) {
                    return oRecentEntry.oItem;
                }));
            });
            return oDeferred.promise();
        };

        this.addNewDay = function () {
            var activityIndex,
                aCurrentActivityArray;
            for (activityIndex = 0; activityIndex < oRecentActivities.recentUsageArray.length; activityIndex++) {
                // Get the array of app usage
                if (oRecentActivities.recentUsageArray[activityIndex].aUsageArray) {
                    aCurrentActivityArray = oRecentActivities.recentUsageArray[activityIndex].aUsageArray;
                } else {
                    // If no array exists, add an empty array and also set iCount to 0
                    aCurrentActivityArray = [];
                    oRecentActivities.recentUsageArray[activityIndex].aUsageArray = aCurrentActivityArray;
                    oRecentActivities.recentUsageArray[activityIndex].iCount = 0;
                }

                // Add an item in the Array for the new day
                aCurrentActivityArray[aCurrentActivityArray.length] = 0;

                // If the array size is > iMaximumDays, remove the first (oldest) entry and update the count accordingly
                if (aCurrentActivityArray.length > iMaximumDays) {
                    oRecentActivities.recentUsageArray[activityIndex].iCount -= aCurrentActivityArray[0];
                    aCurrentActivityArray.shift();
                }
            }
        };

        this.getDayFromDateObj = function (dateObj) {
            return (dateObj.getUTCFullYear() + "/" + (dateObj.getUTCMonth() + 1) + "/" + dateObj.getUTCDate());
        };

        this.getRecentActivitiesFromLoadedData = function (loadedRecents) {
            var recentActivities;
            if (jQuery.isArray(loadedRecents)) {
                recentActivities = {
                    recentDay : null,
                    recentUsageArray : loadedRecents
                };
            } else {
                recentActivities = loadedRecents || {
                    recentDay : null,
                    recentUsageArray : []
                };
            }
            return recentActivities;
        }
    }


    /**
     * User action collector counter of user usage of applications according to the URL hash
     *
     * @param {function} fnLoad
     *     called to load current list from backend
     *
     * @param {function} fnSave
     *     called to save current list into backend
     */
    function RecentAppsUsage(fnLoad, fnSave) {

        var oAppsUsageData,
            that = this,
            iMaximumDays = 30;

        /**
         * Initialization of RecentAppsUsage.
         * Called from shell.controller's <code>init</code> function
         * - Loads user personalized data
         * - Defines a new day is the data structure, if needed
         * - Cleans empty hash usage arrays
         * @param currentDate
         */
        this.init = function () {
            var that = this,
                promise,
                currentDay = this.getDayFromDateObj(this.getCurrentDate()),
                bDataLoadedTriggered = false;

            if (that._oInitDeferred === undefined) {
                that._oInitDeferred = jQuery.Deferred();
            }

            // Personalized data not loaded yet
            if (!bDataLoadedTriggered || currentDay !== oAppsUsageData.recentDay) {
                bDataLoadedTriggered = true;

                // Load data
                promise = fnLoad();

                // Load finished successfully
                promise.done(function (data) {

                    // Initialize structure from the loaded data, or define new
                    oAppsUsageData = data || {
                        recentDay : null,
                        recentAppsUsageMap : {}
                    };

                    // Update usage
                    that.calculateInitialUsage(currentDay);
                    that._oInitDeferred.resolve(oAppsUsageData);
                });
                promise.fail(function () {
                    jQuery.sap.log.error("UShell-lib ; RecentAppsUsage ; Load data in Init failed");
                    that._oInitDeferred.reject();
                });

            }
            return this._oInitDeferred.promise();
        };

        // API functions - Begin

        this.calculateInitialUsage = function (currentDay) {
            var that = this;
            // If the current day is different than the recent one -
            // add a new entry (for the current day's usage) to each hash usage array
            if (currentDay != oAppsUsageData.recentDay) {
                this.addNewDay();
                oAppsUsageData.recentDay = currentDay;

                // Remove hash entries that weren't touched lately
                // postpone to not delay main flow
                setTimeout( function(){
                    that.cleanUnusedHashes();
                }, 3000 );

                // Save the data after the "new day" routine
                this.saveAppsUsage(oAppsUsageData);
            }
        };

        /**
         * Records applications usage according to URL hashes
         *  - Check hash validity
         *  - Gets the relevant hash usage array
         *  - Add this usage (increment the value) or create a new array if needed
         *  - Save the data structure
         *  @param hash
         */
        this.addAppUsage = function (hash) {

            // Check hash validity
            if (!sap.ushell.utils.validHash(hash)) {
                return  jQuery.Deferred().
                        reject("Non valid hash").
                        promise();
            }

            var promise = this.init();

            promise.done( function() {
                // Get the data (usage per day) for the given hash
                var aAppUsageArray = oAppsUsageData.recentAppsUsageMap[hash] || [];

                // New app that wasn't opened so far. Insert "1" since this is the first time it is opened
                if (aAppUsageArray.length == 0) {
                    aAppUsageArray[0] = 1;
                } else {
                    // Increment the existing counter of this day for this hash (i.e. the last entry in the array)
                    aAppUsageArray[aAppUsageArray.length - 1] += 1;
                }
                oAppsUsageData.recentAppsUsageMap[hash] = aAppUsageArray;
                that.saveAppsUsage(oAppsUsageData);
            });
            promise.fail( function() {
                jQuery.sap.log.error("Ushell-lib ; addAppUsage ; Initialization falied!");
            });
            return promise;
        };

        /**
         * Summarises and returns the usage per hash and the minimum and maximum values
         */
        this.getAppsUsage = function () {
            var result,
                promise,
                that = this,
                oDeffered = jQuery.Deferred();

            promise = that.init();

            // After initialization - summarize the usage
            promise.done( function () {
                result = that.summarizeUsage();
                oDeffered.resolve(result);
            });
            promise.fail( function () {
                oDeffered.reject("Not initialized yet");
            });
            return oDeffered.promise();
        };

        // API functions - End

        this.summarizeUsage = function () {
            var usageMap = {},
            hash,
            maxUsage,
            minUsage,
            firstHashUsage = true;

            for (hash in oAppsUsageData.recentAppsUsageMap) {
                usageMap[hash] = this.getHashUsageSum(hash);
                if (firstHashUsage) {
                    maxUsage = minUsage = usageMap[hash];
                    firstHashUsage = false;
                } else {
                    if (usageMap[hash] < minUsage) {
                        minUsage = usageMap[hash];
                    } else if (usageMap[hash] > maxUsage) {
                        maxUsage = usageMap[hash];
                    }
                }
            }
            return {usageMap : usageMap, maxUsage : maxUsage, minUsage : minUsage};
        };

        this.addNewDay = function () {
            var hash,
                aAppUsageArray;
            for (hash in oAppsUsageData.recentAppsUsageMap) {
                // Get the array of app/hash usage
                aAppUsageArray = oAppsUsageData.recentAppsUsageMap[hash];

                // Add an item in the Array for the new day
                aAppUsageArray[aAppUsageArray.length] = 0;

                // If the array size is > iMaximumDays, remove the first (oldest) entry
                if (aAppUsageArray.length > iMaximumDays) {
                    aAppUsageArray = aAppUsageArray.shift();
                }
            }
        };

        this.cleanUnusedHashes = function () {
            var usage,
                hash;
            for (hash in oAppsUsageData.recentAppsUsageMap) {
                usage = that.getHashUsageSum(hash);
                if (usage == 0) {
                    delete (oAppsUsageData.recentAppsUsageMap[hash]);
                }
            }
        };

        this.getHashUsageSum = function (hash) {
            var sum = 0,
                dayIndex,
                appUsageArray = oAppsUsageData.recentAppsUsageMap[hash],
                length = appUsageArray.length;

            for (dayIndex = 0; dayIndex < length; dayIndex++) {
                sum  += appUsageArray[dayIndex];
            }
            return sum;
        };

        this.saveAppsUsage = function (obj) {
            var promise = fnSave(obj);
            promise.fail(function () {
                jQuery.sap.log.error("Ushell-lib ; saveAppsUsage ; Save action failed");
            });
            promise.done(function (data) {

            });
            return promise;
        };

        this.getCurrentDate = function () {
            return new Date();
        };

        this.getDayFromDateObj = function (dateObj) {
            return (dateObj.getUTCFullYear() + "/" + (dateObj.getUTCMonth() + 1) + "/" + dateObj.getUTCDate());
        };
    }

    // -------------------------------- RecentAppsUsage - End --------------------------------

    /**
     * @class The Unified Shell's page user recents service. It used for managing recent searches and recently viewed apps.
     *
     * @constructor
     * @see sap.ushell.services.Container#getService
     * @since 1.15.0
     */
    function UserRecents () {
        var oRecentSearches,
            oRecentApps,
            oRecentActivity,
            oAppsUsage,
            oRecentDataSources,
            oPersonalizationService,
            oAppPersonalizer,
            oSearchesPersonalizer,
            oRecentActivityPersonalizer,
            oDataSourcePersonalizer,
            oAppsUsagePersonalizer,
            fnLoad,
            fnSave,
            sRecentAppsKey = "RecentApps",
            sRecentActivity = "RecentActivity",
            sAppsUsageKey = "AppsUsage",
            sRecentSearchesKey = "RecentSearches",
            sRecentDataSourcesKey = "RecentDataSources",
            sPersContainer = "sap.ushell.services.UserRecents";

        // BEWARE: constructor code below!

        /**
         * add the given activity item. Adds the action to the LRU
         * list of activities.
         *
         * @param {object} oActionItem
         *     the actionItem  <code>sTerm</code>
         * @returns {object[]}
         *     the updated LRU list
         * @since 1.32.0
         * @public
         * @alias sap.ushell.services.UserRecents#addActivity
         */
        this.addActivity = function (oActionItem) {
            return oRecentActivity.newItem(oActionItem);
        };

        /**
         * Returns the LRU list of activities.
         *
         * @returns {object[]}
         *     the LRU list
         * @since 1.32.0
         * @public
         * @alias sap.ushell.services.UserRecents#getRecentActivity
         */
        this.getRecentActivity = function () {
            return oRecentActivity.getRecentItems();
        };

        /**
         * Returns a list of frequently used activities.
         *
         * @returns {object[]}
         *     a list of frequently used activities
         * @since 1.42.0
         * @public
         * @alias sap.ushell.services.UserRecents#getFrequentActivity
         */
        this.getFrequentActivity = function () {
            return oRecentActivity.getFrequentItems();
        };


        /**
         * Notification that the given datasources has just been used. Adds the search to the LRU
         * list of datasources.
         *
         * @param {object} oDataSource
         *     the datasource identified by the string parameter <code>objectName.value</code>
         * @returns {object[]}
         *     the updated LRU list
         * @since 1.19.0
         * @public
         * @alias sap.ushell.services.UserRecents#noticeDataSource
         */
        this.noticeDataSource = function (oDataSource) {

            //Don't save $$ALL$$
            if ( (oDataSource && oDataSource.objectName && oDataSource.objectName.value && oDataSource.objectName.value.toLowerCase() === "$$all$$") ||
                (oDataSource.objectName && oDataSource.objectName.toLowerCase && oDataSource.objectName.toLowerCase() === "$$all$$")) {

                return;
            }

            oRecentDataSources.newItem(oDataSource);
            return oRecentDataSources.getRecentItems();
        };

        /**
         * Returns the LRU list of datasources.
         *
         * @returns {object[]}
         *     the LRU list
         * @since 1.19.0
         * @public
         * @alias sap.ushell.services.UserRecents#getRecentDataSources
         */
        this.getRecentDataSources = function () {
            return oRecentDataSources.getRecentItems();
        };

        /**
         * Notification that the given search item has just been used. Adds the search to the LRU
         * list of searches.
         *
         * @param {object} oSearchItem
         *     the searchItem identified by the string parameter <code>sTerm</code>
         * @returns {object[]}
         *     the updated LRU list
         * @since 1.15.0
         * @public
         * @alias sap.ushell.services.UserRecents#noticeSearch
         */
        this.noticeSearch = function (oSearchItem) {
            oRecentSearches.newItem(oSearchItem);
            return oRecentSearches.getRecentItems();
        };

        /**
         * Returns the LRU list of searches.
         *
         * @returns {object[]}
         *     the LRU list
         * @since 1.15.0
         * @public
         * @alias sap.ushell.services.UserRecents#getRecentSearches
         */
        this.getRecentSearches = function () {
            return oRecentSearches.getRecentItems();
        };

        /**
         * Notification that the given app has just been used. Adds the app to the LRU list of apps.
         *
         * @param {object} oAppItem
         *     the searchItem identified by the string parameter <code>id</code>
         * @returns {object[]}
         *     the updated LRU list
         * @since 1.15.0
         * @public
         * @alias sap.ushell.services.UserRecents#noticeApp
         */
        this.noticeApp = function (oAppItem) {
            oRecentApps.newItem(oAppItem);
            return oRecentApps.getRecentItems();
        };

        /**
         * Returns the LRU list of apps.
         *
         * @returns {object[]}
         *     the LRU list
         * @since 1.15.0
         * @public
         * @alias sap.ushell.services.UserRecents#getRecentApps
         */
        this.getRecentApps = function () {
            return oRecentApps.getRecentItems();
        };

        this.initAppsUsage = function () {
            oAppsUsage.init(new Date());
        };

        /**
         * API function for the New VD 1 - user action Collector
         * Increment usage count for the given hash. Currently called on openApp event
         * @param hash
         */
        this.addAppUsage = function (hash) {
            var relevantHash = sap.ushell.utils.getBasicHash(hash);
            oAppsUsage.addAppUsage(relevantHash);
        };

        /**
         * API function for the New VD 1 - user action Collector
         * Returns a map of total usage of all (used) applications, plus the maximum and minimum values.
         *
         * @returns promise object including the relevant data:
         *  In case of success - An object containing usage-per-hash map  and the minimum and maximum values
         *  In case of fail - Error message
         */
        this.getAppsUsage = function () {
            return oAppsUsage.getAppsUsage();
        };

        // constructor code -------------------------------------------------------

        oPersonalizationService = sap.ushell.Container.getService("Personalization");
        try {
            oAppPersonalizer = oPersonalizationService.getPersonalizer({container: sPersContainer, item: sRecentAppsKey});
            oRecentActivityPersonalizer = oPersonalizationService.getPersonalizer({container: sPersContainer, item: sRecentActivity});
            oSearchesPersonalizer = oPersonalizationService.getPersonalizer({container: sPersContainer, item: sRecentSearchesKey});
            oDataSourcePersonalizer = oPersonalizationService.getPersonalizer({container: sPersContainer, item: sRecentDataSourcesKey});
            oAppsUsagePersonalizer = oPersonalizationService.getPersonalizer({container: sPersContainer, item: sAppsUsageKey});

        } catch (err) {
            jQuery.sap.log.error("Personalization service does not work:");
            jQuery.sap.log.error(err.name + ": " + err.message);
        }

        fnLoad = function (oPersonalizer) {
            var oPromise,
                oDeferred;
            try {
                oPromise = oPersonalizer.getPersData();
            } catch (err) {
                jQuery.sap.log.error("Personalization service does not work:");
                jQuery.sap.log.error(err.name + ": " + err.message);
                oDeferred = new jQuery.Deferred();
                oDeferred.reject(err);
                oPromise = oDeferred.promise();
            }
            return oPromise;
        };

        fnSave = function (oPersonalizer, aList) {
            var promise;
            try {
                promise = oPersonalizer.setPersData(aList);
            } catch (err) {
                jQuery.sap.log.error("Personalization service does not work:");
                jQuery.sap.log.error(err.name + ": " + err.message);
            }
            return promise;
        };

        oRecentSearches = new RecentList(10, function (x, y) {
            var compare = false;
            if (x.oDataSource && y.oDataSource) {
                if (x.oDataSource.objectName && y.oDataSource.objectName) {
                    compare = ((x.sTerm === y.sTerm) && (x.oDataSource.objectName.value === y.oDataSource.objectName.value));
                }
                if (!x.oDataSource.objectName && !y.oDataSource.objectName) {
                    compare = (x.sTerm === y.sTerm);
                }
            }
            if (!x.oDataSource && !y.oDataSource) {
                compare = (x.sTerm === y.sTerm);
            }
            return compare;
        }, function (x, y) {
            return y.iTimestamp - x.iTimestamp; // youngest first
        },
            fnLoad.bind(this, oSearchesPersonalizer),
            fnSave.bind(this, oSearchesPersonalizer));

        oRecentDataSources = new RecentList(6, function (x, y) {
            if (x.objectName && y.objectName) {
                return x.objectName.value === y.objectName.value;
            }
            return false;
        }, function (x, y) {
            return y.iTimestamp - x.iTimestamp; // youngest first
        },  fnLoad.bind(this, oDataSourcePersonalizer),
            fnSave.bind(this, oDataSourcePersonalizer));


        oRecentApps = new RecentList(6, function (x, y) {
            return x.semanticObject === y.semanticObject && x.action === y.action;
        }, function (x, y) {
            return y.iTimestamp - x.iTimestamp;
        }, fnLoad.bind(this, oAppPersonalizer), fnSave.bind(this, oAppPersonalizer));

        oRecentActivity = new RecentActivity(500, function (x, y) {
            if (x.appType === y.appType) {
                if (x.appType !== appType.APP) {
                    return x.url === y.url;
                } else {
                    return x.appId === y.appId;
                }
            } else {
                if (x.appType === appType.APP || y.appType === appType.APP) {
                    return (x.appId === y.appId) && (x.url === y.url);
                } else {
                    return false;
                }
            }

        }, function (x, y) {
            return y.iTimestamp - x.iTimestamp;
        }, fnLoad.bind(this, oRecentActivityPersonalizer), fnSave.bind(this, oRecentActivityPersonalizer));

        oAppsUsage = new RecentAppsUsage(fnLoad.bind(this, oAppsUsagePersonalizer), fnSave.bind(this, oAppsUsagePersonalizer));
    };

    UserRecents.hasNoAdapter = true;
    return UserRecents;

}, true /* bExport */);
