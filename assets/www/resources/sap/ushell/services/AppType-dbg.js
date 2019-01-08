// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define([

], function () {
    "use strict";
    /**
     * AppType object.
     * Enumeration for application types. Used by AppConfiguration service in order to add activity of certain type.
     *
     * @private
     */
    return {
        OVP : "OVP",
        SEARCH: "Search",
        FACTSHEET: "FactSheet",
        COPILOT: "Co-Pilot",
        APP: "Application",

        getDisplayName: function (sAppType) {
            switch (sAppType) {
            case this.OVP:
            case this.SEARCH:
            case this.FACTSHEET:
            case this.COPILOT:
                return sAppType;

            default:
                return "App";
            }
        }
    };
});
