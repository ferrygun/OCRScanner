// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

/**
 * @fileOverview
 *
 * Holds the inbounds that should be always consider during the target
 * resolution process.
 *
 * <p>These inbounds are called "virtual" because they figure exactly as
 * if they were regular inbounds configured by the FLP user/admin.</p>
 *
 * <p>This is a dependency of ClientSideTargetResolution.  Interfaces
 * exposed by this module may change at any time without notice.</p>
 *
 * @version 1.52.4
 */
sap.ui.define([
], function () {
    "use strict";

    var oVirtualInbounds = {};

    var A_VIRTUAL_INBOUNDS = [
        {
            hideIntentLink: true, // don't show in getLinks
            semanticObject: "Action",
            action: "search",
            deviceTypes: {
                desktop: true, tablet: true, phone: true
            },
            signature: {
                parameters: {},
                additionalParameters: "notallowed"
            },
            resolutionResult: {
                applicationType: "SAPUI5",
                ui5ComponentName: "sap.ushell.renderers.fiori2.search.container",
                additionalInformation: "SAPUI5.Component=sap.ushell.renderers.fiori2.search.container",
                url: jQuery.sap.getResourcePath("sap/ushell/renderers/fiori2/search/container"),
                loadCoreExt: false,    // avoid loading of core-ext-light and default dependencies for search component
                loadDefaultDependencies: false
            }
        }
    ];

    /**
     * Returns whether the given inbound is a virtual inbound.
     *
     * <p>Compares the reference of the inbound to determine this,
     * to ensure the output of this method is not influenced by input
     * coming beyond ClientSideTargetResolution service.</p>
     *
     * <p>NOTE: this method could be a potential performance bottleneck
     * if the number of virtual inbounds increases too much. But for
     * the time being we keep it simple, avoid premature optimization
     * and reserve the right to increase complexity of this method
     * later in case.</p>
     *
     * @param {object} oInbound
     *    The inbound that must be checked.
     *
     * @returns {boolean}
     *    Whether the inbound is a virtual inbound.
     *
     * @private
     */
    oVirtualInbounds.isVirtualInbound = function (oInbound) {
        return A_VIRTUAL_INBOUNDS.some(function (oVirtualInbound) {
            return oVirtualInbound === oInbound; // ref equality
        });
    };

    oVirtualInbounds.getInbounds = function () {
        return A_VIRTUAL_INBOUNDS;
    };

    return oVirtualInbounds;
});
