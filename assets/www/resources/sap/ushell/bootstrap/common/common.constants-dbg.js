sap.ui.define( [ ], function () {
    "use strict";

    return Object.create( null, {
        // Name of debug mode parameter flag
        uiDebugKey: { value: "sap-ui-debug" },

        // ID of the boot script - needs to be sap-ui-bootstrap as ui5 also searches
        // for this script by ID (e.g. for loading debug resources)
        bootScriptId: { value: "sap-ui-bootstrap" },

        // for backwards compatibility, we also look for the script sap-ushell-bootstrap
        bwcBootScriptId: { value: "sap-ushell-bootstrap" },

        // Common prefix used in name attribute of meta elements containing
        // ushell configuration
        configMetaPrefix: { value: "sap.ushellConfig" },

        ushellConfigNamespace: { value: "sap-ushell-config" }
    } );
} );