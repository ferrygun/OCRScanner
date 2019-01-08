sap.ui.define([
    "./common.constants",
    "../common/common.configure.ui5language",
    "../common/common.configure.ui5theme",
    "../common/common.configure.ui5datetimeformat",
    "../common/common.configure.xhrlogon",
    "../common/common.load.xhrlogon"
], function (oConstants, fnConfigureUI5Language, fnConfigureUI5Theme, fnConfigureUI5DateTimeFormat, fnConfigureXhrLogon, oXhrLogonLib) {
    "use strict";

    return bootTask;

    function bootTask(sUshellBootstrapPlatform, fnContinueUI5Boot) {
        var oUshellConfig = window[oConstants.ushellConfigNamespace];

        // TODO: Declare dependency.
        window.jQuery.sap.require("sap.ushell.services.Container");

        fnConfigureUI5Language(oUshellConfig);
        fnConfigureUI5Theme(oUshellConfig);
        fnConfigureUI5DateTimeFormat(oUshellConfig);

        window.sap.ushell.bootstrap(sUshellBootstrapPlatform)
            .then(function () { // make sap.ushell.Container available
                fnConfigureXhrLogon(sap.ushell.Container, oXhrLogonLib);
            })
            .then(fnContinueUI5Boot);
    }
});
