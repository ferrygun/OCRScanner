// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The UserInfo adapter for the demo platform.
 *
 * @version 1.52.4
 */
sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap */

    /**
     * This demo adapter reads its configuration from the demo config, where the target applications are defined.
     *
     * @param oSystem
     * @returns {sap.ushell.adapters.abap.UserInfoAdapter}
     */
    var UserInfoAdapter = function (oUnused, sParameter, oAdapterConfiguration) {

        var oUserThemeConfiguration;

        /**
         * Generates the theme configuration for the user based on the external configuration
         * provided in window['sap-ushell-config'].
         *
         * @param {object}
         *     the configuration specified by the user externally
         *
         * @returns {object}
         *     the theme configuration array for getThemeList method
         *
         * @private
         */
        function generateThemeConfiguration(oAdapterThemesConfiguration) {
            var defaultConfig = [
                    { id: "sap_belize", name: "SAP Belize" }
                ],
                externalConfig = jQuery.sap.getObject(
                    "config.themes",
                    undefined,
                    oAdapterThemesConfiguration
                );

            return externalConfig === undefined ? defaultConfig : externalConfig;
        }

        this.updateUserPreferences = function (oUser) {
            var oPersonalizationService,
                oScope,
                oDeferred = new jQuery.Deferred();

            oPersonalizationService = sap.ushell.Container.getService("Personalization");

            oScope = {
                keyCategory : oPersonalizationService.constants.keyCategory.FIXED_KEY,
                writeFrequency: oPersonalizationService.constants.writeFrequency.LOW,
                clientStorageAllowed : true
            };

            function setChangedPropertiesInContainer(oContainer, oUser) {
                var aChangedProperties = oUser.getChangedProperties() || [];

                aChangedProperties.forEach(function(oChange) {
                    oContainer.setItemValue(oChange.propertyName, oChange.newValue);
                });
            }

            function logError(vError) {
                var sError = "Failed to update user preferences: " + (vError && vError.message ? vError.message : vError);
                jQuery.sap.log.error(sError, vError && vError.stack, "com.sap.ushell.adapters.local.UserInfo");
            }

            oPersonalizationService.getContainer("sap.ushell.UserProfile", oScope, undefined)
                .done(function (oContainer) {
                    setChangedPropertiesInContainer(oContainer, oUser);
                    oContainer.save()
                        .fail(function (vError) {
                            logError(vError);
                            oDeferred.reject(vError);
                        })
                        .done(function () {
                            oDeferred.resolve();
                        });
                })
                .fail(function (vError) {
                    logError(vError);
                    oDeferred.reject(vError);
                });

            return oDeferred.promise();
        };

        this.getThemeList = function () {
            var oDeferred = new jQuery.Deferred();

            jQuery.sap.log.info("getThemeList");

            // make sure a configuration is available
            if (oUserThemeConfiguration === undefined) {
                oUserThemeConfiguration = generateThemeConfiguration(oAdapterConfiguration);
            }

            // we need to have at least one theme
            if (oUserThemeConfiguration.length === 0) {
                oDeferred.reject("no themes were configured");
            } else {
                oDeferred.resolve({
                    options: oUserThemeConfiguration
                });
            }


            return oDeferred.promise();
        };

        this.getLanguageList = function () {
            var oDeferred = new jQuery.Deferred();
            jQuery.sap.log.info("getLanguageList");
            oDeferred.resolve(
                [{"text":"Browser Language","key":"default"},{"text":"en-US","key":"en-US"},{"text":"en-UK","key":"en-UK"},{"text":"en","key":"en"},{"text":"de-DE","key":"de-DE"},{"text":"he-IL","key":"he-IL"},{"text":"ru-RU","key":"ru-RU"},{"text":"ru","key":"ru"}]
            );

            return oDeferred.promise();
        };

    };


	return UserInfoAdapter;

}, /* bExport= */ true);
