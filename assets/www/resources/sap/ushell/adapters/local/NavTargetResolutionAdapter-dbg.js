// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The NavTargetResolution adapter for the demo platform.
 *
 * @version 1.52.4
 */
sap.ui.define(['sap/ui/thirdparty/datajs'],
	function(datajs) {
	"use strict";

    /*global jQuery, sap */
    /**
     * This adapter reads its configuration from the demo config, where the target applications are defined.
     * Note that only a constructed tuple is returned, which returns the platform neutral
     * expected result (cf. adjustResult in the ABAP Platform adapter)
     * It does not perform parameter matching of form factor selection like other implementations on 
     * real systems
     * @param {object} oUnused unused
     * @param {string} sParameter parameters
     * @param {object} oAdapterConfiguration configuration, typically contains the statically defined applications
     * @private
     */
    var NavTargetResolutionAdapter = function (oUnused, sParameter, oAdapterConfiguration) {

        var oApplications = jQuery.sap.getObject("config.applications", 0, oAdapterConfiguration);

        this.resolveHashFragment = function (sHashFragment) {
            var oDeferred = new jQuery.Deferred(),
                iIndex,
                oResult,
                oReturnedResult,
                sParameters;

            if (sHashFragment && sHashFragment.charAt(0) !== "#") {
                throw new sap.ushell.utils.Error("Hash fragment expected",
                        "sap.ushell.renderers.minimal.Shell");
            }

            sHashFragment = sHashFragment.substring(1);

            if (!sHashFragment && !oApplications[sHashFragment]) {
                oDeferred.resolve(undefined);
            } else {
                jQuery.sap.log.info("Hash Fragment: " + sHashFragment);

                iIndex = sHashFragment.indexOf("?");
                if (iIndex >= 0) {
                    sParameters = sHashFragment.slice(iIndex + 1);
                    sHashFragment = sHashFragment.slice(0, iIndex);
                }

                oResult = oApplications[sHashFragment];
                // we need a copy (!), as we cannot modify the original data configured
                //
                if (oResult) {
                    oReturnedResult = {
                        additionalInformation : oResult.additionalInformation,
                        applicationType : oResult.applicationType,
                        url : oResult.url,
                        text: oResult.text,
                        fullWidth: oResult.fullWidth
                    };
                    // add sParameter to URL
                    if (sParameters) {
                        oReturnedResult.url += (oReturnedResult.url.indexOf("?") < 0) ? "?" : "&";
                        oReturnedResult.url += sParameters;
                    }
                    if (oResult.navigationMode !== undefined) {
                        oReturnedResult.navigationMode = oResult.navigationMode;
                    }
                    oDeferred.resolve(oReturnedResult);
                } else {
                    oDeferred.reject("Could not resolve link '" + sHashFragment + "'");
                }
            }

            return oDeferred.promise();
        };


        this.getSemanticObjectLinks = function (sSemanticObject, mParams) {
            var sIntent,
                aResult = [],
                i = 0,
                oDeferred = new jQuery.Deferred(),
                sParameters;

            if (!sSemanticObject) {
                setTimeout(function () {
                    oDeferred.resolve([]);
                }, 0);
            } else {
                sParameters = sap.ushell.Container.getService("URLParsing").paramsToString(mParams);
                jQuery.sap.log.info("getSemanticObjectLinks: " + sSemanticObject);
                for (sIntent in oApplications) {
                    if (oApplications.hasOwnProperty(sIntent) && sIntent.substring(0, sIntent.indexOf('-')) === sSemanticObject) {
                        // result must have at least .text and .sIntent
                        // see documentation of getSemanticObjectLinks in NavTargetResolution.js
                        aResult[i] = oApplications[sIntent];
                        aResult[i].id = sIntent;
                        aResult[i].text = aResult[i].text || aResult[i].description || "no text";
                        aResult[i].intent = "#" + sIntent;
                        if (sParameters !== "") {
                            if (aResult[i].intent.indexOf("?") !== -1) {
                                aResult[i].intent += "&" + sParameters;
                            } else {
                                aResult[i].intent += "?" + sParameters;
                            }
                        }
                        i += 1;
                    }
                }
                if (aResult) {
                    setTimeout(function () {
                        oDeferred.resolve(aResult);
                    }, 0);
                } else {
                    setTimeout(function () {
                        oDeferred.reject("Could not get links for  '" + sSemanticObject + "'");
                    }, 0);
                }
            }
            return oDeferred.promise();
        };

        /**
         * Indicates whether the given intent(s) are supported,
         * "Supported" means that navigation to the intent is possible.
         * Note that the local adapter does not perform complex parameter matching!
         *
         * @param {string[]} aIntents
         *   the intents (such as <code>"#AnObject-Action?A=B&C=e&C=j"</code>) to be checked
         *
         * @returns {object}
         *   A <code>jQuery.Deferred</code> object's promise which is resolved with a map
         *   containing the intents from <code>aIntents</code> as keys. The map values are
         *   objects with a property <code>supported</code> of type <code>boolean</code>.<br/>
         *   Example:
         * <pre>
         * {
         *   "#AnObject-Action?A=B&C=e&C=j": { supported: false },
         *   "#AnotherObject-Action2": { supported: true }
         * }
         * </pre>
         */
        this.isIntentSupported = function (aIntents) {
            var oDeferred = new jQuery.Deferred(),
                mSupportedByIntent = {},
                aDeferreds = [],
                that = this;

            /*
             * Sets the result for the given intent as indicated.
             * @params {string} sIntent
             * @params {boolean} bSupported
             */
            function setResult(sIntent, bSupported) {
                mSupportedByIntent[sIntent] = {supported: bSupported};
            }
            aIntents.forEach(function (sIntent, i) {
                // we have to use separate promises that we always resolve
                // because jQuery.when immediately rejects if the first promise is rejected
                var oDeferredWrapper = new jQuery.Deferred();
                aDeferreds.push(oDeferredWrapper.promise());
                that.resolveHashFragment(sIntent)
                    .fail(function (sErrorMessage) {
                        setResult(sIntent, false);
                        oDeferredWrapper.resolve();
                    })
                    .done(function (oApplication) {
                        setResult(sIntent, true);
                        oDeferredWrapper.resolve();
                    });
            });
            if (aIntents.length > 0) {
                jQuery.when.apply(jQuery, aDeferreds).always(function () {
                    oDeferred.resolve(mSupportedByIntent);
                });
            } else {
                oDeferred.resolve(mSupportedByIntent);
            }
            return oDeferred.promise();
        };
    };


	return NavTargetResolutionAdapter;

}, /* bExport= */ true);
