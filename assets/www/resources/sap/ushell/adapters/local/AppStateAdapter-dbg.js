// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The Unified Shell's appState adapter for the local
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
     * This method MUST be called by the Unified Shell's personalization service only.
     * Constructs a new instance of the personalization adapter for the local
     * platform.
     *
     * @param {object}
     *            oSystem the system served by the adapter
     * @param {string} sParameters
     *            Parameter string, not in use
     * @param {object} oConfig
     *            a potential Adapter Configuration
     * @class The Unified Shell's personalization adapter for the local platform.
     *
     * @constructor
     * @since 1.28.0
     * @private
     */
    var AppStateAdapter = function (oSystem, sParameters, oConfig) {
        this._oConfig = oConfig && oConfig.config;
    };

    AppStateAdapter.prototype._getPersonalizationService = function () {
        return sap.ushell.Container.getService("Personalization");
    };

    /**
     * save the given data sValue for the given key at the persistence layer
     * @param {string} sKey
     *            the Key value of the Application state to save,
     *            (less than 40 characters)
     * @param {string} sSessionKey
     *            a Session key (40 characters)
     *            overwriting/modifying an existing record is only permitted if the
     *            session key matches the key of the initial creation.
     *            It shall be part of the save request, but shall not be returned on reading
     *            (it is not detectable from outside).
     * @param {string} sValue
     *            the value to persist under the given key
     * @param {string} sAppName
     *            the application name (the ui5 component name)
     *            should be stored with the data to allow to identify the data association
     * @param {string}
     *            sComponent a 24 character string representing the application component,
     *            (A sap support component)
     *            may be undefined if not available on the client
     * @returns {object} promise
     *  A promise, done handler empty args
     *  fail handler sMsg argument
     * @private
     */
    AppStateAdapter.prototype.saveAppState = function (sKey, sSessionKey, sValue, sAppname, sComponent) {
        var oPersonalizationService = this._getPersonalizationService(),
            oDeferred = new jQuery.Deferred();
        oPersonalizationService.createEmptyContainer(sKey, {keyCategory: oPersonalizationService.constants.keyCategory.GENERATED_KEY, writeFrequency: oPersonalizationService.constants.writeFrequency.HIGH, clientStorageAllowed: false}).done(function (oContainer) {
            oContainer.setItemValue("appStateData", sValue);
            oContainer.save().done(function () {
                oDeferred.resolve();
            }).fail(function (sMsg) {
                oDeferred.reject(sMsg);
                jQuery.sap.log.error(sMsg);
            });
        }).fail(function (sMsg) {
            jQuery.sap.log.error(sMsg);
            oDeferred.reject(sMsg);
        });
        return oDeferred.promise();
    };

    /**
     * read the application state sValue for the given key sKey from the persistence layer
     * @param {string} sKey
     *            the Key value of the Application state to save,
     *            (less than 40 characters)
     * @param {string} sValue
     *            the value to persist under the given key
     * @returns {object} promise
     *  A promise, done handler function(sKey, sValue)
     *  fail handler function(sMsg) argument
     * @private
     */
    AppStateAdapter.prototype.loadAppState = function (sKey) {
        var oPersonalizationService = this._getPersonalizationService(),
            oDeferred = new jQuery.Deferred();
        oPersonalizationService.getContainer(sKey, {keyCategory: oPersonalizationService.constants.keyCategory.GENERATED_KEY, writeFrequency: oPersonalizationService.constants.writeFrequency.HIGH, clientStorageAllowed: false}).done(function (oContainer) {
            var sValue = oContainer.getItemValue("appStateData");
            oDeferred.resolve(sKey, sValue);
        }).fail(function (sMsg) {
            jQuery.sap.log.error(sMsg);
            oDeferred.reject(sMsg);
        });
        return oDeferred.promise();
    };


	return AppStateAdapter;

}, /* bExport= */ true);
