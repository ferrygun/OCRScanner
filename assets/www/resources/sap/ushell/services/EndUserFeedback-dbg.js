// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The EndUserFeedback service.
 */
sap.ui.define([
], function () {
    "use strict";
    /*global jQuery, sap, localStorage, window, setTimeout, URI*/
    /*jslint regexp: true*/

    /**
     * Returns the property value of the object by value path
     *
     * @return {string} returns the property value or empty string if it does not exist
     *
     * @public
     * @since 1.25.1
     */
    function getPropertyValueOrEmptyString(sPropertyValuePath, oObject) {
        return jQuery.sap.getObject(sPropertyValuePath, undefined, oObject) || "";
    }

    /**
     * This method MUST be called by the Unified Shell's container only, others
     * MUST call <code>sap.ushell.Container.getService("EndUserFeedback")</code>.
     * Constructs a new instance of the end user feedback service.
     *
     * @name sap.ushell.services.EndUserFeedback
     *
     * @class The Unified Shell's end user feedback service
     *
     * @param {object}
     *            oAdapter the service adapter for the end user feedback service,
     *            as already provided by the container
     * @param {object}
     *            oContainerInterface the interface provided by the container
     * @param {string}
     *            sParameters the runtime configuration specified in the
     *            <code>sap.ushell.Container.getService()</code> call (not
     *            evaluated yet)
     * @param {object}
     *            oServiceConfiguration the service configuration defined in the
     *            bootstrap configuration; the boolean property
     *            <code>enabled</code> controls the service enablement
     *
     * This service is enabled by default. It can be disabled explicitly in the
     * bootstrap configuration of the start page:
     * <pre>
     * window[&quot;sap-ushell-config&quot;] = {
     *     services: {
     *         EndUserFeedback: {
     *             config: {
     *                 enabled: true
     *             }
     *         }
     *     }
     * }
     *
     * Platform implementations can also enable it dynamically by modification of the
     * bootstrap configuration during boot time.
     *
     * @public
     * @constructor
     * @see sap.ushell.services.Container#getService
     *
     * @since 1.25.1
     */
    function EndUserFeedback (oAdapter, oContainerInterface, sParameters, oServiceConfiguration) {
        var oServiceConfig = (oServiceConfiguration && oServiceConfiguration.config) || {};

        /**
         * Sends a feedback. Forwards the given data (JSON object) to the associated adapter.
         *
         * @param {JSON} JSON object containing the input fields required for the end user feedback.
         *
         * @public
         * @alias sap.ushell.services.EndUserFeedback#sendFeedback
         * @since 1.25.1
         */
        this.sendFeedback = function (oEndUserFeedbackData) {
            var sUrl, sNavigationIntent, sAdditionalInformation, sApplicationType, oEndUserFeedbackAdapterData, sFormFactor, sUserId, seMail, feedbackText;
            sUrl = getPropertyValueOrEmptyString("clientContext.navigationData.applicationInformation.url", oEndUserFeedbackData);
            sNavigationIntent = getPropertyValueOrEmptyString("clientContext.navigationData.navigationHash", oEndUserFeedbackData);
            sAdditionalInformation = getPropertyValueOrEmptyString("clientContext.navigationData.applicationInformation.additionalInformation", oEndUserFeedbackData);
            sApplicationType = getPropertyValueOrEmptyString("clientContext.navigationData.applicationInformation.applicationType", oEndUserFeedbackData);
            sFormFactor = getPropertyValueOrEmptyString("clientContext.navigationData.formFactor", oEndUserFeedbackData);
            sUserId = getPropertyValueOrEmptyString("clientContext.userDetails.userId", oEndUserFeedbackData);
            seMail = getPropertyValueOrEmptyString("clientContext.userDetails.eMail", oEndUserFeedbackData);
            feedbackText = oEndUserFeedbackData.feedbackText || "";

            oEndUserFeedbackAdapterData = {
                feedbackText: feedbackText.slice(0, 2000), // feedback text is trimmed to 2000 chars. not a reasonable scenario, but may happen.
                ratings: oEndUserFeedbackData.ratings || {},
                additionalInformation : sAdditionalInformation,
                applicationType : sApplicationType,
                url: sUrl ? this.getPathOfURL(sUrl) : "", //reason: parameters could contain sensitive data
                navigationIntent: sNavigationIntent.replace(/\?.*$/, ''),
                formFactor: sFormFactor,
                isAnonymous: oEndUserFeedbackData.isAnonymous || false,
                userId : oEndUserFeedbackData.isAnonymous ? "" : sUserId,
                eMail : oEndUserFeedbackData.isAnonymous ? "" : seMail
            };
            return oAdapter.sendFeedback(oEndUserFeedbackAdapterData);
        };

        /**
         * Receives the legal text for the feedback dialog box
         *
         * @param
         *
         * @public
         * @alias sap.ushell.services.EndUserFeedback#getLegalText
         * @since 1.25.1
         */
        this.getLegalText = function () {
            return oAdapter.getLegalText();
        };
        /**
         * Checks if the service is enabled.
         * <p>
         * The service enablement depends on the configuration in the back-end system and the bootstrap configuration.
         *
         * @return {Object} Promise, done = if the service is enabled;
         *
         * @public
         * @alias sap.ushell.services.EndUserFeedback#isEnabled
         * @since 1.25.1
         */
        this.isEnabled = function () {
            var oDeferred = new jQuery.Deferred();
            // if disabled via config -> reject
            if (oServiceConfig.enabled === false) {
                setTimeout(function () {
                    oDeferred.reject();
                }, 0);
                return oDeferred.promise();
            }
            //else : ask adapter
            oAdapter.isEnabled()
                .done(function (sLegalText) {
                    oDeferred.resolve();
                })
                .fail(function (sErrorText) {
                    oDeferred.reject();
                });
            return oDeferred.promise();
        };

        /**
         * Returns the path of the given URL (based on URI-API).
         *
         * @return {string} Path of the given URL
         *
         * @private
         * @since 1.30.0
         */
        this.getPathOfURL = function (sURL) {
             var oURI = new URI(sURL);
             return oURI.pathname();
        };

    };

    EndUserFeedback.hasNoAdapter = false;
    return EndUserFeedback;

}, true /* bExport */);
