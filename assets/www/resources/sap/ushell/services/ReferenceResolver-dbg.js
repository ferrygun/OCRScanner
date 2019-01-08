// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview TODO
 *
 * @version 1.52.4
 */
sap.ui.define([
    "sap/ushell/User"
], function (User) {
    "use strict";
    /*global jQuery, sap, setTimeout, clearTimeout, window */

    function UserEnvReferenceResolver() {
       /**
         * Resolves the value of the given user env reference.
         *
         * @param {string} sReference
         *    A reference name like <code>User.env.sap-theme</code>
         * @returns {jQuery.Deferred.Promise}
         *    A promise that is always resolved.
         *    resolved, the promise resolves with a rich object like:
         *    <pre>
         *    { value: "some value" }
         *    </pre>
         *    . Otherwise, the promise resolves with an empty object.
         *
         *    The values this resolves to is a string value,which may be undefined
         *    sap-ui-legacy-date-format a value of Domain XUDATFM "1"|"2"|.."9"|"A"|"B"|"C" or undefined
         *    sap-ui-legacy-time-format a value of Domain XUTIMFM "0"|"1"|"2"|"3"|"4"| or undefined
         *    sap-ui-legacy-number-format a value of Domain XUCPFM " "|"X"|"X" or undefined
         *    (for these three, undefined shoudl not occur within a Fiori Launchpad instance,this would indicate a lacking
         *     configuration of the UI5 core).
         *
         *    sap-language  : Two character code representing a SAP Logon language code
         *    sap-languagebcp47 : A bcp47 language/locale settng (e.g "en-GB")
         *    sap-accessiblity: "X" or undefined        (Note: no "false", " " or similar returned, if falsy, return undefined indicating parameter should not be filled on propagation!)
         *    sap-statistics:   "true" or undefined          (Note: no "false" or similar returned! return undefined indicating parameter should not be filled on propagation(
         *
         *    a return value of undefined indicates the parameter should not be added to the url/appstate or similar!
         *
         *
         * @private
         * @since 1.42.0
         */
        this.getValue = function (sReference){
            var oDeferred = new jQuery.Deferred();
            var sValue;

            if (sReference === "User.env.sap-ui-legacy-date-format"){
                sValue = sap.ui.getCore().getConfiguration().getFormatSettings().getLegacyDateFormat();
            }
            if (sReference === "User.env.sap-ui-legacy-number-format"){
                sValue = sap.ui.getCore().getConfiguration().getFormatSettings().getLegacyNumberFormat();
            }
            if (sReference === "User.env.sap-ui-legacy-time-format"){
                sValue = sap.ui.getCore().getConfiguration().getFormatSettings().getLegacyTimeFormat();
            }
            if (sReference === "User.env.sap-language"){
                sValue = sap.ushell.Container.getUser().getLanguage();
            }
            if (sReference === "User.env.sap-languagebcp47"){
                sValue = sap.ushell.Container.getUser().getLanguageBcp47();
            }
            if (sReference === "User.env.sap-accessibility"){
                sValue = (sap.ushell.Container.getUser().getAccessibilityMode()) ? 'X' : undefined;
            }
            if (sReference === "User.env.sap-statistics"){
                sValue = (sap.ui.getCore().getConfiguration().getStatistics()) ? "true" : undefined;
            }
            if (sReference === "User.env.sap-theme"){
                sValue = sap.ushell.Container.getUser().getTheme(User.prototype.constants.themeFormat.THEME_NAME_PLUS_URL);
            }
            if (sReference === "User.env.sap-theme-name"){
                sValue = sap.ushell.Container.getUser().getTheme();
            }
            if (sReference === "User.env.sap-theme-NWBC"){
                sValue = sap.ushell.Container.getUser().getTheme(User.prototype.constants.themeFormat.NWBC);
            }
            oDeferred.resolve({ "value" : sValue });

            return oDeferred.promise();
        };
    }

    function ReferenceResolver (oContainerInterface, sParameter, oConfig) {

        /**
         * Returns an instance of UserEnvReferenceResolver.
         *
         * @returns {object}
         *    An instance of UserEnvReferenceResolver. The instance is created
         *    only once and stored in this service. This method should be called
         *    at the time the instance is used to avoid creating the instance
         *    if not required.
         *
         * @private
         * @since 1.42.0
         */
        this._getUserEnvReferenceResolver = function () {
            if (!this.oUserEnvReferenceResolver) {
                this.oUserEnvReferenceResolver = new UserEnvReferenceResolver();
            }
            return this.oUserEnvReferenceResolver;
        };

        /**
         * This resolves (finds the value of) all the given reference names.
         *
         * @param {string[]} aReferences
         *    An array of reference names, like <code>["UserDefault.currency", "User.env.sap-theme-name"... ]</code>.
         *
         * @returns {jQuery.Deferred.promise}
         *    <p>A promise that resolves with an object containing all the
         *    resolved references, or is rejected with an error message if it
         *    was not possible to resolve all the references.</p>
         *
         *    <p>The object this promise resolves to maps the full (with prefix)
         *    reference name to its value:</p>
         *    <pre>
         *    {
         *        UserDefault.currency: "EUR",
         *        User.env.sap-theme-name: "sap-belize"
         *        ...
         *    }
         *    </pre>
         *
         * @private
         * @since 1.42.0
         */
        this.resolveReferences = function (aReferences) {
            var that = this,
                oDeferred = new jQuery.Deferred(),
                oUserDefaultParametersSrvc,
                aReferencePromises = [],
                bAllRefsResolvable = true,
                oDistinctRefs = {},
                oDistinctEnvRefs = {},
                oResolver;

            var aRichRefs = aReferences
                    .map(function (sRefWithPrefix) {
                        var sRefName;

                        if (sRefWithPrefix.indexOf("User.env.") === 0){
                            sRefName = sRefWithPrefix;
                            oDistinctEnvRefs[sRefName] = 1;
                        }
                        if (sRefWithPrefix.indexOf("UserDefault.") === 0){
                            sRefName = that._extractAnyUserDefaultReferenceName(sRefWithPrefix);
                            oDistinctRefs[sRefName] = 1;
                        }

                        if (typeof sRefName !== "string") {
                            bAllRefsResolvable = false;
                            jQuery.sap.log.error(
                                "'" + sRefWithPrefix + "' is not a legal reference name",
                                "sap.ushell.services.ReferenceResolver"
                            );
                        }
                        return {
                            full: sRefWithPrefix,
                            name: sRefName
                        };
                    });

            if (!bAllRefsResolvable) {
                return oDeferred
                    .reject("One or more references could not be resolved")
                    .promise();
            }

            Object.keys(oDistinctRefs).forEach(function (sName) {
                // construct at most once, but
                oUserDefaultParametersSrvc = oUserDefaultParametersSrvc || sap.ushell.Container.getService("UserDefaultParameters");
                aReferencePromises.push(oUserDefaultParametersSrvc.getValue(sName));
            });

            Object.keys(oDistinctEnvRefs).forEach(function(sName) {
                oResolver = oResolver || that._getUserEnvReferenceResolver();
                aReferencePromises.push(oResolver.getValue(sName));
            });

            jQuery.when.apply(jQuery, aReferencePromises)
                .done(function () {
                    var oKnownRefs = {};
                    var iIndex = 0,
                        aRefValues = arguments;
                    Object.keys(oDistinctRefs).forEach(function (sName) {
                        oDistinctRefs[sName] = aRefValues[iIndex];
                        iIndex = iIndex + 1;
                    });
                    Object.keys(oDistinctEnvRefs).forEach(function (sName) {
                        oDistinctEnvRefs[sName] = aRefValues[iIndex];
                        iIndex = iIndex + 1;
                    });

                    /*
                     * All parameters retrieved successfully and
                     * stored in arguments.
                     */
                    aRichRefs.forEach(function (oRef) {
                        var oMergedValue;
                        if (oRef.full.indexOf("UserDefault.extended.") === 0) {
                            oMergedValue = that.mergeSimpleAndExtended(oDistinctRefs[oRef.name]);
                            if (!jQuery.isEmptyObject(oMergedValue)) {
                                oKnownRefs[oRef.full] = oMergedValue;
                            } else {
                                // even if no value is provided, the property must exist to indicate that the
                                // reference could be resolved
                                oKnownRefs[oRef.full] = undefined;
                            }
                        } else if (oRef.full.indexOf("UserDefault.") === 0) {
                            oKnownRefs[oRef.full] = oDistinctRefs[oRef.name].value;
                        } else if (oRef.full.indexOf("User.env.") === 0) {
                            oKnownRefs[oRef.full] = oDistinctEnvRefs[oRef.name].value;
                        } // one of the above branches must have been hit, there can be no else here,
                        // else  { assert(0); }
                    });
                    oDeferred.resolve(oKnownRefs);
                });

            return oDeferred.promise();
        };


        /**
         * Extracts the name of a full reference parameter.
         * For example, returns <code>value</code> from
         * <code>UserDefault.value</code> or <code>UserDefault.extended.value</code>.
         *
         * @param {string} sRefParamName
         *    Name of a full reference parameter
         * @returns {string}
         *    The name of the reference parameter extracted from
         *    sRefParamName, or undefined in case this cannot be extracted.
         *
         * @private
         * @since 1.42.0
         */
        this._extractAnyUserDefaultReferenceName = function (sRefParamName) {
            var sParamName = this.extractExtendedUserDefaultReferenceName(sRefParamName);
            if (typeof sParamName === "string") {
                return sParamName;
            }
            return this.extractUserDefaultReferenceName(sRefParamName);
        };

        /**
         * Extracts an extended user default reference name from a reference parameter
         * name. For example, returns <code>value</code> from
         * <code>UserDefault.extended.value</code>, but returns <code>undefined</code>
         * for <code>UserDefault.value</code>.
         *
         * @param {string} sRefParamName
         *    Name of a reference parameter
         * @returns {string}
         *    The name of the user default parameter extracted from
         *    sRefParamName, or undefined in case this cannot be extracted.
         *
         * @private
         * @since 1.42.0
         */
        this.extractExtendedUserDefaultReferenceName = function (sRefParamName) {
            if (typeof sRefParamName !== "string" || sRefParamName.indexOf("UserDefault.extended.") !== 0) {
                return undefined;
            }
            return sRefParamName.replace(/^UserDefault[.]extended[.]/, "");
        };

        /**
         * Extracts the user default reference name from a reference parameter
         * name. For example, returns <code>value</code> from
         * <code>UserDefault.value</code>, but returns <code>undefined</code>
         * for <code>MachineDefault.value</code> or <code>UserDefault.extended.value</code>.
         *
         * @param {string} sRefParamName
         *    Name of a reference parameter
         * @returns {string}
         *    The name of the user default parameter extracted from
         *    sRefParamName, or undefined in case this cannot be extracted.
         *
         * @private
         * @since 1.42.0
         */
        this.extractUserDefaultReferenceName = function (sRefParamName) {
            if (typeof sRefParamName !== "string"
                || sRefParamName.indexOf("UserDefault.") !== 0
                || sRefParamName.indexOf("UserDefault.extended.") === 0) {

                return undefined;
            }
            return sRefParamName.replace(/^UserDefault[.]/, "");
        };

        /**
         * Merges a simple user default value (if present) and the extended value object into a new object.
         * A simple value will even be converted if no extended value is present.
         *
         * @param {object} oValueObject
         *  The value object as returned by {@link sap.ushell.services.UserDefaultParameters#getValue}.
         * @returns {object}
         *  The new object containing the merged values. If no values are present, an empty object is returned.
         * @private
         * @since 1.42.0
         */
        this.mergeSimpleAndExtended = function(oValueObject) {
            var oMergedExtendedObject = jQuery.extend(true, {}, oValueObject.extendedValue);
            if (typeof oValueObject.value === "string") {
                if (!jQuery.isArray(oMergedExtendedObject.Ranges)) {
                    oMergedExtendedObject.Ranges = [];
                }
                // add simple value as range
                oMergedExtendedObject.Ranges.push({ "Sign" : "I", "Option": "EQ", "Low" : oValueObject.value, "High" : null});
            }
            return oMergedExtendedObject;
        };

    };

    ReferenceResolver.hasNoAdapter = true;
    return ReferenceResolver;
}, true /* bExport */);
