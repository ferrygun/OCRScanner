sap.ui.define([], function () {
    "use strict";

    return configureUI5Language;

    function configureUI5Language(oUshellConfig) {

        var oUserProfile = oUshellConfig &&
                oUshellConfig.services &&
                oUshellConfig.services.Container &&
                oUshellConfig.services.Container.adapter &&
                oUshellConfig.services.Container.adapter.config &&
                oUshellConfig.services.Container.adapter.config.userProfile,
            sLanguageBcp47 = oUserProfile &&
                oUserProfile.defaults &&
                oUserProfile.defaults.languageBcp47,
            sSapLogonLanguage = oUserProfile &&
                oUserProfile.defaults &&
                oUserProfile.defaults.language;

        // note: the sap-language query parameter must be considered by the server
        // and will change the language defaults read above
        if (sLanguageBcp47) {
            sap.ui.getCore().getConfiguration()
                .setLanguage(sLanguageBcp47, sSapLogonLanguage);
        }
    }

});