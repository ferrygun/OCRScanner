sap.ui.define( [
    "./cdm.constants",
    "../common/common.configure.ui5",
    "../common/common.configure.ushell",
    "../common/common.override.registermodulepath",
    "../common/common.load.core-min"
], function ( oConstants, fnConfigureUI5, fnConfigureUShell,
        fnOverrideRegisterModulePath, fnLoadCoreMin ) {
    "use strict";

    fnConfigureUI5({
        platform: "cdm"
    });

    // Initially the CDM platform was using the "local" bootstrap, but now the "cdm" bootstrap is used.
    // As only for some of the ushell services a CDM adapter exists, all other need to be configured to
    // use the corresponding local adapter, otherwise the FLP bootstrap is going to fail.
    // Because of that set an default configuration, which sets the missing adapters to local, in order
    // to stay compatible on all platforms.
    fnConfigureUShell({
        defaultUshellConfig: oConstants.defaultConfig
    });

    fnOverrideRegisterModulePath();

    fnLoadCoreMin();
} );