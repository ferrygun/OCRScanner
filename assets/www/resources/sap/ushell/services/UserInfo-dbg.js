// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The Unified Shell's user information service, which allows you to retrieve
 *     information about the user.
 *
 * @version 1.52.4
 */
sap.ui.define([
], function () {
    "use strict";
    /*global jQuery, sap */

    /**
     * This method MUST be called by the Unified Shell's container only, others MUST call
     * <code>sap.ushell.Container.getService("UserInfo")</code>.
     * Constructs a new instance of the user information service.
     *
     * @name sap.ushell.services.UserInfo
     *
     * @class The Unified Shell's user information service, which allows you to retrieve
     *     information about the logged-in user.
     *
     * @constructor
     * @see sap.ushell.services.Container#getService
     * @since 1.16.3
     *
     * @public
     */
    function UserInfo (oAdapter, oContainerInterface) {
        /**
         * Returns the id of the user.
         *
         * @returns {string}
         *   The user id.
         *
         * @since 1.16.3
         *
         * @public
         * @alias sap.ushell.services.UserInfo#getId
         */
        this.getId = function () {
            return sap.ushell.Container.getUser().getId();
        };

        /**
         * Returns an object representing the logged-in user.
         *
         * @returns {sap.ushell.User}
         *      object providing information about the logged-in user
         *
         * @since 1.15.0
         *
         * @private
         */
        this.getUser = function () {
            return sap.ushell.Container.getUser();
        };

        /**
         * Returns the list of themes available for the user.
         * In case of success, the <code>done</code> function returns an 'anonymous' object
         * representing the list of themes.
         * In case of failure, the <code>fail</code> function of the jQuery.promise object is called.
         *
         * @returns {object}
         *  jQuery.promise object.
         *
         * @private
         */
        this.getThemeList = function () {

            var oPromise  = oAdapter.getThemeList();
            oPromise.fail(function () {
                jQuery.sap.log.error("getThemeList failed");
            });
            return oPromise;
        };

        /**
         * Sends the updated user attributes to the adapter.
         * In case of success, the <code>done</code> function returns nothing.
         * In case of failure, the <code>fail</code> function of the jQuery.promise object is called.
         *
         *  @returns {object}
         *  jQuery.promise object
         */
        this.updateUserPreferences = function () {
            var oPromise = oAdapter.updateUserPreferences(sap.ushell.Container.getUser());
            oPromise.fail(function () {
                jQuery.sap.log.error("updateAttributes: ");
            });
            return oPromise;
        };

        /**
         * Returns the list of languages or locales available for the user.
         * In case of success, the <code>done</code> function returns an object
         * representing a list of language (e.g., en) or locale IDs (e.g., en-us).
         * In case of failure, the <code>fail</code> function of the jQuery.promise object is called.
         * The first item is the browser language - e.g. {"Browser Language":"en-us"}
         * @returns {object}
         *  jQuery.promise object.
         *
         * @private
         */
        this.getLanguageList = function () {
            var oPromise  = oAdapter.getLanguageList();
            oPromise.fail(function () {
                jQuery.sap.log.error("getLanguageList failed");
            });
            return oPromise;
        };

    };


    UserInfo.hasNoAdapter = false;
    return UserInfo;

}, true /* bExport */);
