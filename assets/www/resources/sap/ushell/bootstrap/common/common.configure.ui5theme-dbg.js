sap.ui.define([
], function () {
    "use strict";

    return configureUI5Language;

    function configureUI5Language(oUshellConfig) {

        var oContainerAdapterConfig = oUshellConfig &&
            oUshellConfig.services &&
            oUshellConfig.services.Container &&
            oUshellConfig.services.Container.adapter &&
            oUshellConfig.services.Container.adapter.config;

        var sDefaultTheme = oContainerAdapterConfig &&
            oContainerAdapterConfig.userProfile &&
            oContainerAdapterConfig.userProfile.defaults &&
            oContainerAdapterConfig.userProfile.defaults.theme;

        var sPersonalizedTheme = oContainerAdapterConfig &&
            oContainerAdapterConfig.userProfilePersonalization &&
            oContainerAdapterConfig.userProfilePersonalization.theme;

        var sAppliedTheme = sPersonalizedTheme || sDefaultTheme;

        if (sAppliedTheme) {
            sap.ui.getCore().applyTheme(sAppliedTheme);
        }
    }

});