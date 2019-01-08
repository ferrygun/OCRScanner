// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The Unified Shell's UserDefaultParameterPersistence service provides
 *               read and write access to a per user storage of per user
 *               persisted values.
 *
 *               Note:
 *               Values may be read only once per launchpad and storage may be more
 *               coarse grained than on parameter level.
 *               Thus inconsistencies with concurrent editing in separate clients may arise
 *
 *               Note: [security, performance]
 *               Values are be client side cached (Browser HTTP Cache),
 *               if a appropriate cache-busting is used.
 *
 *               This is *not* an application facing service, but for Shell
 *               Internal usage.
 * @version 1.52.4
 */
sap.ui.define([
], function () {
    "use strict";
    /*jslint nomen: true, bitwise: false */
    /*jshint bitwise: false */
    /*global jQuery, sap, setTimeout, clearTimeout, window */

    var aValidProperties = [
        "value",  // the single value
        "extendedValue", // the extended value
        "noEdit", // boolean, indicates the property should be hidden from editor
        "alwaysAskPlugin", // boolean, indicates when obtaining a parameterValue the plugins will be queried
        "_shellData", // an opaque member which the shell uses to store information (e.g. timestamps etc)
        "pluginData" // an opaque member which plugins can use to store information on it (e.g. timestamps etc)
    ];
    /**
     * The Unified Shell's UserDefaultParameterPersistence service
     * This method MUST be called by the Unified Shell's container only, others
     * MUST call <code>sap.ushell.Container.getService("UserDefaultParameterPersistence")</code>.
     * Constructs a new instance of the UserDefaultParameterPersistence service.
     *
     * @param {object} oAdapter
     *      The service adapter for the UserDefaultParameterPersistence service,
     *      as already provided by the container
     * @param {object} oContainerInterface
     *      interface
     * @param {string} sParameter
     *      Service instantiation
     * @param {object} oConfig
     *      Service configuration (not in use)
     *
     * @constructor
     * @class
     * @see sap.ushell.services.Container#getService
     *
     * @since 1.32.0
     * @private
     */
    function UserDefaultParameterPersistence (oAdapter, oContainerInterface, sParameter, oConfig) {
        this._oAdapter = oAdapter;
        this._oData = {};
    };


    UserDefaultParameterPersistence.prototype._cleanseValue = function(oValue) {
        var res = jQuery.extend(true, {} ,oValue),
            a;
        for  (a in res) {
            if (res.hasOwnProperty(a)) {
                if (aValidProperties.indexOf(a) < 0) {
                    delete res[a];
                }
            }
        }
        return res;
    };

    UserDefaultParameterPersistence.prototype._testValue = function(oValue) {
        return true;
    };

    /**
     * Loads a specific ParameterValue from persistence.
     * The first request will typically trigger loading of all parameters from the backend.
     *
     * @param {string} sParameterName
     *      parameter name to be loaded
     * @returns {object}
     *      A jQuery promise, whose done handler receives as first argument a rich parameter object
     *      containing a value, e.g. <code>{ value : "value" }</code>.
     *      Its fail handler receives a message string as first argument.
     *
     * @since 1.32.0
     * @private
     */
    UserDefaultParameterPersistence.prototype.loadParameterValue = function (sParameterName) {
        var oDeferred = new jQuery.Deferred(),
            that = this;
        if (this._oData[sParameterName]) {
            oDeferred.resolve(this._oData[sParameterName]);
        } else {
            this._oAdapter.loadParameterValue(sParameterName).done(function (oValue) {
                var oCleansedValue = that._cleanseValue(oValue);
                if (that._testValue(oCleansedValue)) {
                    oDeferred.resolve(oCleansedValue);
                } else {
                    jQuery.sap.log.error("flawed value returned from persistence");
                    oDeferred.reject("flawed value returned from persistence");
                }
            }).fail(oDeferred.reject.bind(this));
        }
        return oDeferred.promise();
    };

    /**
     * Method to save the parameter value to persistence,
     * note that adapters may choose to save the value delayed and return early with
     * a succeeded promise
     * @param {string} sParameterName
     *      Parameter name
     * @param {object} oValueObject
     *      Parameter value object, contains at least <code>{ value :... }</code>
     * @returns {object}
     *      A jQuery promise, whose done handler receives no parameters.
     *      Its fail handler receives a message string as first argument.
     *
     * @since 1.32.0
     * @public
     * @alias sap.ushell.services.UserDefaultParameterPersistence#saveParameterValue
     */
    UserDefaultParameterPersistence.prototype.saveParameterValue = function (sParameterName, oValueObject) {
        var oDeferred,
            oCleansedValueObject;
        if (!oValueObject) {
            return this.deleteParameter(sParameterName);
        }
        oCleansedValueObject = this._cleanseValue(oValueObject);
        oDeferred = new jQuery.Deferred();
        if (!this._testValue(oCleansedValueObject) || (oValueObject && oValueObject.noStore === true)) {
            return oDeferred.resolve().promise();
        }
        this._oData[sParameterName] = oCleansedValueObject;
        return this._oAdapter.saveParameterValue(sParameterName, oCleansedValueObject);
    };

    /**
     * Method to delete a parameter value from persistence
     * note that adapters may choose to save the value delayed and return early with
     * a succeeded promise
     * @param {string} sParameterName
     *      Parameter name to be deleted
     * @returns {object}
     *      A jQuery promise, whose done handler receives no parameters.
     *      Its fail handler receives a message string as first argument.
     *
     * @since 1.32.0
     * @public
     * @alias sap.ushell.services.UserDefaultParameterPersistence#deleteParameter
     */
    UserDefaultParameterPersistence.prototype.deleteParameter = function (sParameterName) {
        delete this._oData[sParameterName];
        return this._oAdapter.deleteParameter(sParameterName);
    };

    /**
     * Method to obtain an array of string containing all Stored parameter names
     *
     * @returns {promise}
     *      A jQuery.Deferred whose first argument of resolve is an array of strings
     *      The strings are sorted
     *
     * @since 1.32.0
     * @private
     */
    UserDefaultParameterPersistence.prototype.getStoredParameterNames = function () {
        var oDeferred = new jQuery.Deferred();
        this._oAdapter.getStoredParameterNames().done(function (aRes) {
            aRes.sort();
            oDeferred.resolve(aRes);
        }).fail(oDeferred.reject.bind(oDeferred));
        return oDeferred.promise();
    };

    UserDefaultParameterPersistence.hasNoAdapter = false;
    return UserDefaultParameterPersistence;

}, true /* bExport */);
