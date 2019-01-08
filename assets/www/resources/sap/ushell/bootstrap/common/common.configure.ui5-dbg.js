sap.ui.define([
    "./common.boot.path",
    "./common.boot.task",
    "./common.load.launchpad"
], function (sBootPath, fnBootTask, fnLoadLaunchpadContent) {
    "use strict";

    return configureUI5Settings;

    function configureUI5Settings(oSettings) {

        var oSAPUIConfig = window["sap-ui-config"] || {},
            sUshellBootstrapPlatform = oSettings && oSettings.platform;

        // resourceroots are evaluated very early - therefore, we have
        // to set the default boot path explicitly
        jQuery.sap.registerModulePath("", sBootPath);

        // TODO: global configuration variable might not be evaluated
        // at this point in time; check if we can use explicit API calls instead
        oSAPUIConfig["libs"] = "sap.fiori, sap.m, sap.ushell, sap.ui.core";
        oSAPUIConfig["theme"] = "sap_belize"; // may be overwritten after ushell was configured
        oSAPUIConfig["oninit"] = fnLoadLaunchpadContent;
        oSAPUIConfig["compatversion"] = "1.16";
        oSAPUIConfig["xx-boottask"] = fnBootTask.bind(null, sUshellBootstrapPlatform);
        oSAPUIConfig["bindingsyntax"] = "complex";
    }

});