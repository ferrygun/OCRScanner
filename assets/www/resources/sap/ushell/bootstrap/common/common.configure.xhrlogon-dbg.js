sap.ui.define([
], function () {
    "use strict";

    return configureXhrLogon;

    /**
     * Creates a logger for XMLHttpRequest(s) that logs errors, warnings, info
     * and debug messages via jQuery.sap.log.
     *
     * @return {object}
     *    A logger that can be assigned to XMLHttpRequest.
     *
     * @private
     */
    function createUi5ConnectedXhrLogger() {
        return ["error", "warning", "info", "debug"].reduce(function (oXhrLogger, sLevel) {
            oXhrLogger[sLevel] = function (sMsg) {
                return jQuery.sap.log[sLevel](sMsg);
            };
            return oXhrLogger;
        }, {});
    }

    /**
     * Makes a given base frame logon manager compatible with the one expected
     * by the shell container. This is necessary because the XHR library we use
     * on the CDM platform has functional gaps with the one we use on the ABAP
     * platform.
     *
     * @param {object} oBaseFrameLogonManager
     *   A frame logon manager to be amended
     *
     * @return {object}
     *   The amended logon manager. Note, since this method modifies
     *   <code>oBaseFrameLogonManager</code> inplace, one can also avoid
     *   consuming the returned result when calling this method.
     *
     * @private
     */
    function makeLogonManagerCompatibleWithUshellContainer(oBaseFrameLogonManager) {
        oBaseFrameLogonManager.setLogonFrameProvider = function (oLogonFrameProvider) {
            oBaseFrameLogonManager.logonFrameProvider = oLogonFrameProvider;
        };

        if (!oBaseFrameLogonManager.setTimeout) {
            oBaseFrameLogonManager.setTimeout = function () {
                // FLP does not crash at least
            };
        }

        return oBaseFrameLogonManager;
    }

    /**
     * Enables the handling of the XHR Logon in the FLP.
     *
     * @param {object} oSapUshellContainer
     *    The active <code>sap.ushell.Container</code> instance to configure
     *    the logon manager into.
     *
     * @private
     */
    function configureXhrLogon(oSapUshellContainer, oXhrLogonLib) {
        var oFrameLogonManager = oXhrLogonLib.FrameLogonManager.startup();

        var oCompatibleFrameLogonManager
            = makeLogonManagerCompatibleWithUshellContainer(oFrameLogonManager);

        // configure logger
        XMLHttpRequest.logger = createUi5ConnectedXhrLogger();

        oSapUshellContainer.oFrameLogonManager = oCompatibleFrameLogonManager;
    }
});
