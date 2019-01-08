// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The Unified Shell's sap.ushell.adapters.cdm.CommonDataModelAdapter for the 'CDM'
 *               platform.
 *
 * @version 1.52.4
 */
(function() {
    "use strict";
    /* global jQuery, sap, window*/
    jQuery.sap.declare("sap.ushell.adapters.cdm.CommonDataModelAdapter");

    /**
     * This method MUST be called by the Unified Shell's container only.
     * Constructs a new instance of the CommonDataModelAdapter for the CDM platform.
     *
     * @param {object} oUnused
     * @param {string} sParameter
     * @param {object} oAdapterConfiguration
     *
     * @class
     * @constructor
     * @see {@link sap.ushell.adapters.cdm.CommonDataModelAdapter}
     */
    sap.ushell.adapters.cdm.CommonDataModelAdapter = function (oUnused, sParameter, oAdapterConfiguration) {
        jQuery.sap.require("sap.ushell.adapters.cdm.ClientSideTargetResolutionAdapter");
        this.oAdapterConfiguration = oAdapterConfiguration;
        if (oAdapterConfiguration && oAdapterConfiguration.config && oAdapterConfiguration.config.siteData) {
            this.oCdmSiteDataRequestPromise = new jQuery.Deferred().resolve(oAdapterConfiguration.config.siteData);
        } else if (oAdapterConfiguration && oAdapterConfiguration.config && oAdapterConfiguration.config.siteDataPromise) {
            this.oCdmSiteDataRequestPromise = oAdapterConfiguration.config.siteDataPromise;
        } else {
            // if cdm site data is not directly set in configuration, a URL has to be defined
            // for consistency, the property should be called 'siteDataUrl', but we still support
            // 'cdmSiteUrl' for backwards compatibility
            if (oAdapterConfiguration && oAdapterConfiguration.config) {
                this.sCdmSiteUrl = oAdapterConfiguration.config.siteDataUrl
                    || oAdapterConfiguration.config.cdmSiteUrl;
            }
            //request cdm site
            this.oCdmSiteDataRequestPromise = this._requestSiteData(this.sCdmSiteUrl);
        }
    };

    /**
     * Bundles the request logic for fetching the CDM site
     *
     * @param {string} sUrl
     *   Url for fetching the cdm site data
     * @returns {object} promise
     *   The promise's done handler returns the parsed CDM site object.
     *   In case an error occured, the promise's fail handler returns an error message.
     * @private
     */
    sap.ushell.adapters.cdm.CommonDataModelAdapter.prototype._requestSiteData = function (sUrl) {
        var oSiteDataRequestDeferred = new jQuery.Deferred();

        if (!sUrl) {
            oSiteDataRequestDeferred.reject(
                "Cannot load site: configuration property 'siteDataUrl' is missing for CommonDataModelAdapter.");
        } else {
            jQuery.ajax({
                type: "GET",
                dataType: "json",
                url: sUrl
            }).done(function(oResponseData) {
                oSiteDataRequestDeferred.resolve(oResponseData);
            }).fail(function(oError) {
                jQuery.sap.log.error(oError.responseText);
                oSiteDataRequestDeferred.reject("CDM Site was requested but could not be loaded.");
            });
        }

        return oSiteDataRequestDeferred.promise();
    };

    /**
     * Retrieves the CDM site
     *
     * @returns {object} promise
     *   The promise's done handler returns the CDM site object.
     *   In case an error occured, the promise's fail handler returns an error message.
     * @public
     */
    sap.ushell.adapters.cdm.CommonDataModelAdapter.prototype.getSite = function () {
        var oDeferred = new jQuery.Deferred();

        this.oCdmSiteDataRequestPromise.done(function (oSiteData) {
            var oSiteWithoutPers = jQuery.extend({}, oSiteData);

            delete oSiteWithoutPers.personalization;
            oDeferred.resolve(oSiteWithoutPers);
        }).fail(function (sMessage) {
            oDeferred.reject(sMessage);
        });

        return oDeferred.promise();
    };

    /**
     * Retrieves the personalization part of the CDM site
     *
     * @returns {object} promise
     *   The promise's done handler returns the personalization object of the CDM site.
     *   In case an error occured, the promise's fail handler returns an error message.
     * @public
     */
    sap.ushell.adapters.cdm.CommonDataModelAdapter.prototype.getPersonalization = function () {
        var oDeferred = new jQuery.Deferred(),
            that = this;

        this.oCdmSiteDataRequestPromise.done(function (oSiteData) {
            var oSiteDataCopy = jQuery.extend({}, oSiteData);
            if (that.oAdapterConfiguration && that.oAdapterConfiguration.config && that.oAdapterConfiguration.config.ignoreSiteDataPersonalization) {
                delete oSiteDataCopy.personalization;
            }
            if (oSiteDataCopy.personalization) {
                oDeferred.resolve(oSiteDataCopy.personalization);
            } else {
                that._readPersonalizationDataFromStorage()
                .done(function (oPersonalizationData) {
                    oDeferred.resolve(oPersonalizationData);
                })
                .fail(function (sMessage) {
                    oDeferred.reject(sMessage);
                });
            }
        }).fail(function (sMessage) {
            oDeferred.reject(sMessage);
        });

        return oDeferred.promise();
    };

    /**
     * Wraps the logic for storing the personalization data.
     *
     * @param {object} oPersonalizationData
     *   Personalization data which should get stored
     * @returns {object} promise
     *   The promise's done handler indicates successful storing of personalization data.
     *   In case an error occured, the promise's fail handler returns an error message.
     * @private
     */
    sap.ushell.adapters.cdm.CommonDataModelAdapter.prototype._storePersonalizationData = function (oPersonalizationData) {
        var oPersonalizationDeferred = new jQuery.Deferred(),
            oPersonalizationService = sap.ushell.Container.getService("Personalization"),
            oComponent,
            oScope = {
                keyCategory : oPersonalizationService.constants.keyCategory.FIXED_KEY,
                writeFrequency: oPersonalizationService.constants.writeFrequency.LOW,
                clientStorageAllowed : true
            },
            oPersId = {
                container : "sap.ushell.cdm.personalization",
                item : "data"
            },
            oPersonalizer = oPersonalizationService.getPersonalizer(oPersId, oScope, oComponent);

        oPersonalizer.setPersData(oPersonalizationData)
            .done(function () {
                jQuery.sap.log.info("Personalization data has been stored successfully.");
                oPersonalizationDeferred.resolve();
            })
            .fail(function () {
                oPersonalizationDeferred.reject("Writing personalization data failed.");
            });

        return oPersonalizationDeferred.promise();
    };

    /**
     * Wraps the logic for fetching the personalization data.
     *
     * @returns {object} promise
     *   The promise's done handler returns the parsed personalization data.
     *   In case an error occured, the promise's fail handler returns an error message.
     * @private
     */
    sap.ushell.adapters.cdm.CommonDataModelAdapter.prototype._readPersonalizationDataFromStorage = function () {
        var oPersonalizationDeferred = new jQuery.Deferred(),
            oPersonalizationService = sap.ushell.Container.getService("Personalization"),
            oComponent,
            oScope = {
                keyCategory : oPersonalizationService.constants.keyCategory.FIXED_KEY,
                writeFrequency: oPersonalizationService.constants.writeFrequency.LOW,
                clientStorageAllowed : true
            },
            oPersId = {
                container : "sap.ushell.cdm.personalization",
                item : "data"
            },
            oPersonalizer = oPersonalizationService.getPersonalizer(oPersId, oScope, oComponent);

        oPersonalizer.getPersData()
            .done(function (oPersonalizationData) {
                if (!oPersonalizationData) {
                    oPersonalizationData = {};
                }
                oPersonalizationDeferred.resolve(oPersonalizationData);
            })
            .fail(function () {
                oPersonalizationDeferred.reject("Fetching personalization data failed.");
            });
        return oPersonalizationDeferred.promise();
    };
}());
