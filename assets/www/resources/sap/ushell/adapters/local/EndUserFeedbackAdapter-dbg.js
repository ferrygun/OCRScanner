// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The EndUserFeedback adapter for the local platform.
 *
 * @version 1.52.4
 */
sap.ui.define(['jquery.sap.storage'],
	function(/* jQuerySap */) {
	"use strict";

    /*global jQuery, sap, window, setTimeout*/
    var bEnabledFromConfig;

    var EndUserFeedbackAdapter = function (oSystem, sParameter, oAdapterConfiguration) {
        var sSESSION_STORAGE_KEY = "com.sap.ushell.adapters.local.EndUserFeedback";

        // constructor below

        /**
         * Create a feedback and store in Session Storage
         *
         * @param {JSON} oFeedbackObject
         * JSON object containing the input fields required for the support ticket
         */
        this.sendFeedback = function (oFeedbackObject) {
            var oDeferred,
                oSessionStorage,
                iNrOfFeedbacks;

            iNrOfFeedbacks = 333;
            oDeferred = new jQuery.Deferred();

            setTimeout(function () {
                oSessionStorage = jQuery.sap.storage(jQuery.sap.storage.Type.session, sSESSION_STORAGE_KEY);
                if (oSessionStorage.put(iNrOfFeedbacks, JSON.stringify(oFeedbackObject)) === true) {
                    jQuery.sap.log.info("User Feedback " + JSON.stringify(oFeedbackObject) + " has been sent.");
                    oDeferred.resolve(iNrOfFeedbacks);
                } else {
                    oDeferred.reject("Failed to save end user feedback");
                }
            }, 0);

            return oDeferred.promise();
        };

        this.getLegalText = function () {
            var oDeferred, sLegalText;

            sLegalText = "This is the legal text \n in the users language.\n with multiple line breaks.";
            oDeferred = new jQuery.Deferred();

            setTimeout(function () {
                jQuery.sap.log.info("Legal text " + sLegalText + " for user feedback dialog has been sent.");
                oDeferred.resolve(sLegalText);

            }, 0);

            return oDeferred.promise();
        };

        /**
         * Checks if the service is enabled.
         * <p>
         * The service is only enabled if getLegalText can be invoked and returns a valid response
         *
         * @return {object} promise, for the local adapter always resolved
         *
         * @public
         * @since 1.25.1
         */
        this.isEnabled = function () {
            var oDeferred = new jQuery.Deferred();
            setTimeout(function () {
                if (bEnabledFromConfig) {
                    oDeferred.resolve();
                } else {
                    oDeferred.reject();
                }
            }, 0);
            return oDeferred.promise();
        };

        // Constructor
        bEnabledFromConfig = jQuery.sap.getObject("config.enabled", undefined, oAdapterConfiguration);
        if (bEnabledFromConfig === undefined) {
            bEnabledFromConfig = true; // default is true
        }
    };


	return EndUserFeedbackAdapter;

}, /* bExport= */ true);
