// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview Configure the UI5Settings for Date and Time Format for the 'CDM'
 *               platform.
 *
 * @version 1.52.4
 */
sap.ui.define([], function () {
    "use strict";

    return configureUI5DateTimeFormat;

    /**
     * This method Configure the UI5Settings for Date and Time Format.
     * Note: TimeZone is not taken into account.
     *
     * @param {object} oUshellConfig
     *     the Ushell Configuration Settings
     *     It shall be like oUshellConfig.services.Contaainer.adapter.config
     *     if not undefined values for date and time format is set.
     *
     */
    function configureUI5DateTimeFormat(oUshellConfig) {

        var oUserProfile = oUshellConfig &&
            oUshellConfig.services &&
            oUshellConfig.services.Container &&
            oUshellConfig.services.Container.adapter &&
            oUshellConfig.services.Container.adapter.config &&
            oUshellConfig.services.Container.adapter.config.userProfile;

        var sMessageDate = "Date Format is incorrectly set for the User";
        var sMessageTime = "Time Format is incorrectly set for the User";

        try {
            var sSapDateFormat = oUserProfile &&
                oUserProfile.defaults &&
                oUserProfile.defaults.sapDateFormat;
            sap.ui.getCore().getConfiguration().getFormatSettings()
                .setLegacyDateFormat(sSapDateFormat);
        } catch (e) {
            jQuery.sap.log.error(sMessageDate, e.stack, "sap/ushell/bootstrap/common/common.configure.ui5datetimeformat");
        }

        try {
            var sSapTimeFormat = oUserProfile &&
                oUserProfile.defaults &&
                oUserProfile.defaults.sapTimeFormat;
            sap.ui.getCore().getConfiguration().getFormatSettings()
                .setLegacyTimeFormat(sSapTimeFormat);
        } catch (e) {
            jQuery.sap.log.error(sMessageTime, e.stack, "sap/ushell/bootstrap/common/common.configure.ui5datetimeformat");
        }

    }


}, /* bExport = */ true);