sap.ui.define([
    "./common.constants",
    "./common.boot.path",
    "./common.debug.mode"
], function (oConstants, sBoothPath, bDebugSources) {
    "use strict";

    return loadCoreMin;

    function loadCoreMin() {

        // TODO: check if we can simplify this by using ui5 module loading
        // TODO: terminology is misleading, rather rename to common-preload.js
        //      (first part of ui5 core is already included into cdm.js)
        [
            "/sap/ushell/bootstrap/core-min-0",
            "/sap/ushell/bootstrap/core-min-1",
            "/sap/ushell/bootstrap/core-min-2",
            "/sap/ushell/bootstrap/core-min-3"
        ].map(function (sFile) {
            return sBoothPath + sFile + (bDebugSources ? "-dbg" : "") + ".js";
        }).forEach(fnLoadScript);
    }

    function fnLoadScript(sFilePath, sId) {
        var oScriptElement = document.createElement("script");

        if (sId) {
            oScriptElement.id = sId;
        }

        oScriptElement.src = sFilePath;

        oScriptElement.async = false;

        document.head.appendChild(oScriptElement);
    }
});