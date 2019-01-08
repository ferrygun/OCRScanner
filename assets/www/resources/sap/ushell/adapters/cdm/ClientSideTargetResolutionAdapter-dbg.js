// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview ClientSideTargetResolutionAdapter for the CDM platform.
 *
 * The ClientSideTargetResolutionAdapter must perform the following two task:
 * <ul>
 * <li>provide the getInbounds method to return the list of Target Mappings used by ClientSideTargetResolution service;</li>
 * <li>provide the resolveHashFragment function, a fallback method called by ClientSideTargetResolution service.</li>
 * </ul>
 *
 * @version 1.52.4
 */
(function () {
    "use strict";
    /*jslint nomen: true*/
    /*global jQuery, sap, setTimeout */
    jQuery.sap.declare("sap.ushell.adapters.cdm.ClientSideTargetResolutionAdapter");

   /**
    * Constructs a new instance of the ClientSideTargetResolutionAdapter for
    * the CDM platform.
    *
    * @param {object} oSystem
    *   The system served by the adapter
    * @param {string} sParameters
    *   Parameter string, not in use
    * @param {object} oAdapterConfig
    *   A potential adapter configuration
    *
    * @constructor
    *
    * @private
    */
   sap.ushell.adapters.cdm.ClientSideTargetResolutionAdapter = function (oSystem, sParameters, oAdapterConfig) {
       this._oAdapterConfig = oAdapterConfig && oAdapterConfig.config;

       jQuery.sap.require("sap.ushell.utils.utilsCdm");

       /*
        * Hardcoded for the time being, we should be able to resolve the local
        * system alias via OData call in the future.
        */
       this._oLocalSystemAlias = {
           http: {
               host: "",
               port: "",
               pathPrefix: "/sap/bc/"
           },
           https: {
               host: "",
               port: "",
               pathPrefix: "/sap/bc/"
           },
           rfc: {
               systemId: "",
               host: "",
               service: 0,
               loginGroup: "",
               sncNameR3: "",
               sncQoPR3: ""
           },
           id: "",
           client: "",
           language: ""
       };
    };

    /**
     * Produces a list of Inbounds suitable for ClientSideTargetResolution.
     *
     * @returns {jQuery.Deferred.Promise}
     *   a jQuery promise that resolves to an array of Inbounds in
     *   ClientSideTargetResolution format.
     * <p>
     * NOTE: the same promise is returned if this method is called multiple
     * times. Therefore this method can be safely called multiple times.
     * </p>
     * @private
     */
    sap.ushell.adapters.cdm.ClientSideTargetResolutionAdapter.prototype.getInbounds = function () {
        var that = this;

        if (!this._getInboundsDeferred) {
            this._getInboundsDeferred = new jQuery.Deferred();

            sap.ushell.Container.getService("CommonDataModel").getSite()
                .done(function(oSite) {
                    var aInbounds = sap.ushell.utils.utilsCdm.formatSite(oSite) || [];
                    that._getInboundsDeferred.resolve(aInbounds);

                }).fail(function(oErr) {
                    that._getInboundsDeferred.reject(oErr);
                });
        }

        return this._getInboundsDeferred.promise();
    };

    sap.ushell.adapters.cdm.ClientSideTargetResolutionAdapter.prototype._getSystemAliases = function () {
        var that = this;

        if (!this._getSystemAliasesDeferred) {
            this._getSystemAliasesDeferred = new jQuery.Deferred();

            sap.ushell.Container.getService("CommonDataModel").getSite()
                .done(function(oSite) {
                    var oSystemAliases = jQuery.extend(true, {}, oSite.systemAliases || {});

                    // propagate id in system alias
                    Object.keys(oSystemAliases).forEach(function (sId) {
                        oSystemAliases[sId].id = sId;
                    });

                    that._getSystemAliasesDeferred.resolve(oSystemAliases);
                }).fail(function(oErr) {
                    that._getSystemAliasesDeferred.reject(oErr);
                });
        }

        return this._getSystemAliasesDeferred.promise();
    };

    /**
     * Resolves a specific system alias.
     *
     * @param {string} sSystemAlias
     *    the system alias name to be resolved
     *
     * @return {jQuery.Deferred.Promise}
     *    a jQuery promise that resolves to a system alias data object.
     *    A live object is returned! The service must not change it.
     *    If the alias could not be resolved the promise is rejected.
     *
     *    Format of system alias data object. Example:
     *    <pre>{
     *        id: "AB1CLNT000",
     *        client: "000",
     *        language: "EN",
     *        http: {
     *            host: "ldcab1.xyz.com",
     *            port: 10000,
     *            pathPrefix: "/abc/def/"
     *        },
     *        https: {
     *            host: "ldcab1.xyz.com",
     *            port: 20000,
     *            pathPrefix: "/abc/def/"
     *        },
     *        rfc: {
     *            systemId: "AB1",
     *            host: "ldcsab1.xyz.com",
     *            port: 0,
     *            loginGroup: "PUBLIC",
     *            sncNameR3: "",
     *            sncQoPR3: "8"
     *        }
     *    }</pre>
     *
     * @private
     */
    sap.ushell.adapters.cdm.ClientSideTargetResolutionAdapter.prototype.resolveSystemAlias = function (sSystemAlias) {
        var oDeferred = new jQuery.Deferred(),
            that = this;

        this._getSystemAliases().done(function (oSystemAliases) {
            var sMessage,
                oSystemAliasData = sSystemAlias === ""
                    ? that._oLocalSystemAlias
                    : oSystemAliases[sSystemAlias];

            if (oSystemAliasData) {
                oDeferred.resolve(oSystemAliasData);
            } else {
                sMessage = "Cannot resolve system alias " + sSystemAlias;
                jQuery.sap.log.warning(
                    sMessage,
                    "The system alias cannot be found in the site response",
                    "sap.ushell.adapters.cdm.ClientSideTargetResolutionAdapter"
                );
                oDeferred.reject(sMessage);
            }
        }).fail(function () {
              oDeferred.reject();
        });

        return oDeferred.promise();
    };

}());
