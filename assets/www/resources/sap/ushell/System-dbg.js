// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The <code>sap.ushell.System</code> object with related functions.
 */

sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap */
    // "private" methods (static) without need to access properties -------------


    // "public class" -----------------------------------------------------------

    /**
     * Constructs a new system object representing a system used in the Unified Shell.
     *
     * @param {object} oData
     *     An object containing the system data
     * @param {string} oData.alias
     *     The unique system alias such as <code>'ENTERPRISE_SEARCH'</code>.
     * @param {string} oData.baseUrl
     *     The server relative base URL of this system such as <code>'/ENTERPRISE_SEARCH'</code>.
     *     <b>Note:</b> This has to correspond to an SAP Web Dispatcher routing rule.
     * @param {string} oData.platform
     *         The system platform such as <code>'abap'</code> or <code>'hana'</code>.
     *
     * @class A representation of a system
     * @constructor
     * @since 1.15.0
     * @public
     */
    var System = function (oData) {

        // BEWARE: constructor code below!

        // "private" or hidden methods --------------------------------------------

        // "public" methods -------------------------------------------------------

        /**
         * Returns this system's alias.
         *
         * @returns {string}
         *   this system's alias
         * @since 1.15.0
         */
        this.getAlias = function () {
            return oData.alias;
        };

        /**
         * Returns this system's base URL.
         *
         * @returns {string}
         *   this system's base URL
         * @since 1.15.0
         */
        this.getBaseUrl = function () {
            return oData.baseUrl;
        };

        /**
         * Returns this system's client.
         *
         * @returns {string}
         *   this system's client
         * @since 1.15.0
         */
        this.getClient = function () {
            return oData.client;
        };

        /**
         * Returns this system's name.
         *
         * @returns {string}
         *   this system's name
         * @since 1.15.0
         */
        this.getName = function () {
            return oData.system;
        };

        /**
         * Returns this system's platform.
         *
         * @returns {string}
         *   this system's platform ("abap", "hana" etc.)
         * @since 1.15.0
         */
        this.getPlatform = function () {
            return oData.platform;
        };

        /**
         * Adjusts the given URL so that it will be passed to this system.
         *
         * @param {string} sUrl
         *      the URL (which must be server-absolute)
         * @returns {string}
         *      the adjusted URL
         * @since 1.15.0
         */
        this.adjustUrl = function (sUrl) {
            /*jslint regexp:true */
            if (sUrl.indexOf('/') !== 0 || sUrl === '/') {
                throw new Error("Invalid URL: " + sUrl);
            }
            if (oData.baseUrl === ";o=") {
                if (oData.alias) {
                    sUrl = sUrl + ";o=" + oData.alias;
                }
            } else if (oData.baseUrl) {
                sUrl = oData.baseUrl.replace(/\/$/, "") + sUrl;
            }
            if (oData.client) {
                sUrl += (sUrl.indexOf("?") >= 0 ? "&" : "?") + "sap-client=" + oData.client;
            }
            return sUrl;
        };

        this.toString = function () {
            return JSON.stringify(oData);
        };

        // constructor code -------------------------------------------------------

        // "public" methods (static) ------------------------------------------------

    };



	return System;

}, /* bExport= */ true);
