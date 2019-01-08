// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The Unified Shell's UserDefaultParameterPersistence adapter for the local
 *               platform.
 *               TODO will be replaced by true persistence within this SP!
 *               This adapter delegates to the Personalization Adapter
 *
 * @version 1.52.4
 */
sap.ui.define(['sap/ushell/services/Personalization'],
	function(Personalization) {
	"use strict";

    /*jslint nomen: true*/
    /*global jQuery, sap, setTimeout */
    // --- Adapter ---
    /**
     * @class The Unified Shell's UserDefaultParameterPersistence adapter for the local platform.
     * This method MUST be called by the Unified Shell's UserDefaultParameterPersistence service
     * only. Constructs a new instance of the UserDefaultParameterPersistence adapter for the local
     * platform.
     *
     * @param {object}
     *      oSystem the system served by the adapter
     * @param {string} sParameters
     *      Parameter string, not in use
     * @param {object} oConfig
     *      a potential Adapter Configuration
     * @constructor
     *
     * @since 1.32.0
     * @private
     */
    var UserDefaultParameterPersistenceAdapter = function (oSystem, sParameters, oConfig) {
        this._oConfig = oConfig && oConfig.config;
    };

    UserDefaultParameterPersistenceAdapter.prototype._getPersonalizationService = function () {
        return sap.ushell.Container.getService("Personalization");
    };


    /**
     * Method to save the parameter value to persistence,
     * note that adapters may choose to save the value delayed and return early with
     * a resolved promise
     *
     * @param {string} sParameterName
     *      parameter name
     * @param {object} oValueObject
     *      parameter value object, containing at least a value, e.g.
     *      <code>{ value : "value" }</code>
     * @returns {object}
     *      A jQuery promise, whose done handler receives no parameters.
     *      Its fail handler receives a message string as first argument.
     *
     * @since 1.32.0
     * @private
     */
    UserDefaultParameterPersistenceAdapter.prototype.saveParameterValue = function (sParameterName, oValueObject) {
        var oDeferred = new jQuery.Deferred();
        if (!(typeof sParameterName === "string" && sParameterName.length <= 40 && /^[A-Za-z0-9.-_]+$/.exec(sParameterName))) {
            jQuery.sap.log.error("Illegal Parameter Key, less than 40 characters and [A-Za-z0-9.-_]+ :\"" + sParameterName + "\"");
        }
        this._getUDContainer().done(function (oContainer) {
            oContainer.setItemValue(sParameterName,oValueObject);
            oContainer.save().done(oDeferred.resolve.bind(oDeferred)).fail(oDeferred.reject.bind(oDeferred));
        }).fail(function (sMsg) {
            jQuery.sap.log.error(sMsg);
            oDeferred.reject(sMsg);
        });
        return oDeferred.promise();
    };

    /**
     * Method to delete the parameter value to persistence,
     * note that adapters may choose to save the value delayed and return early with
     * a resolved promise
     *
     * @param {string} sParameterName
     *      Parameter name to be deleted
     * @returns {object}
     *      A jQuery promise, whose done handler receives no parameters.
     *      Its fail handler receives a message string as first argument.
     *
     * @since 1.32.0
     * @private
     */
    UserDefaultParameterPersistenceAdapter.prototype.deleteParameter = function (sParameterName, oValueObject) {
        var oDeferred = new jQuery.Deferred();
        if (!(typeof sParameterName === "string" && sParameterName.length <= 40 && /^[A-Za-z0-9.-_]+$/.exec(sParameterName))) {
            jQuery.sap.log.error("Illegal Parameter Key, less than 40 characters and [A-Za-z0-9.-_]+ :\"" + sParameterName + "\"");
        }
        this._getUDContainer().done(function (oContainer) {
            oContainer.delItem(sParameterName);
            oContainer.save().done(oDeferred.resolve.bind(oDeferred)).fail(oDeferred.reject.bind(oDeferred));
        }).fail(function (sMsg) {
            jQuery.sap.log.error(sMsg);
            oDeferred.reject(sMsg);
        });
        return oDeferred.promise();
    };

    /**
     * Method to load a specific ParameterValue from persistence.
     * The first request will typically trigger loading of all parameters from the backend.
     *
     * @param {string} sParameterName
     *      parameter name
     * @returns {object}
     *      A jQuery promise, whose done handler receives as first argument a rich parameter object
     *      containing a value, e.g. <code>{ value : "value" }</code>.
     *      Its fail handler receives a message string as first argument.
     *
     * @since 1.32.0
     * @private
     */
    UserDefaultParameterPersistenceAdapter.prototype.loadParameterValue = function (sParameterName) {
        var oDeferred = new jQuery.Deferred();
        this._getUDContainer().done(function (oContainer) {
            var v = oContainer.getItemValue(sParameterName);
            if (v) {
                oDeferred.resolve(v);
            } else {
                oDeferred.reject("no value ");
            }
        }).fail(function (sMsg) {
            jQuery.sap.log.error(sMsg);
            oDeferred.reject(sMsg);
        });
        return oDeferred.promise();
    };

    /**
     * get Present Item Keys in the persistence
     * the first request will typically trigger loading of all parameters from the backend
     *
     * @returns {object}
     *      A jQuery promise, whose done handler receives as first argument a rich parameter object
     *      containing a value, e.g. <code>{ value : "value" }</code>.
     *      Its fail handler receives a message string as first argument.
     *
     * @since 1.32.0
     * @private
     */
    UserDefaultParameterPersistenceAdapter.prototype.getStoredParameterNames = function () {
        var oDeferred = new jQuery.Deferred();
        this._getUDContainer().done(function (oContainer) {
            var v = oContainer.getItemKeys();
            oDeferred.resolve(v);
        }).fail(function (sMsg) {
            jQuery.sap.log.error(sMsg);
            oDeferred.reject(sMsg);
        });
        return oDeferred.promise();
    };

    /**
     * Loads a UserDefault Container.
     *
     * @returns {object}
     *  A jQuery promise, whose done handler receives the container as first argument.
     *  Its fail handler receives a message string as first argument.
     *
     * @since 1.32.0
     * @private
     */
    UserDefaultParameterPersistenceAdapter.prototype._getUDContainer = function() {
        var oPersonalizationService = this._getPersonalizationService();
        if (this._oPromise) {
            return this._oPromise;
        }
        this._oPromise = oPersonalizationService.getContainer("sap.ushell.UserDefaultParameter", {keyCategory: oPersonalizationService.constants.keyCategory.FIXED_KEY, writeFrequency: oPersonalizationService.constants.writeFrequency.LOW, clientStorageAllowed: true});
        return this._oPromise;
    };


	return UserDefaultParameterPersistenceAdapter;

}, /* bExport= */ true);
