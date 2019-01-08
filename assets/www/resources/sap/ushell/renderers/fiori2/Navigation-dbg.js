// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap, window */
    /*jslint nomen: true */
    var Navigation = function () {
        //OBSOLETE FOR NOW: search is not part of the navigation
        this.SEARCH = {
            ID : "ShellSearch",
            SEMANTICOBJECT : "shell",
            ACTION : "search"
        };
        sap.ushell.Container.getService("NavTargetResolution").registerCustomResolver({
            name : "Search App Container",
            isApplicable : function (sHashFragment) {
                return sHashFragment === "#Action-search";
            },
            resolveHashFragment : function (sHashFragment) {
                var oDeferred = new jQuery.Deferred(),
                    res = {};
                if (sHashFragment === "#Action-search") {
                    res = {
                        "additionalInformation": "SAPUI5.Component=sap.ushell.renderers.fiori2.search.container",
                        "applicationType": "URL",
                        "url": jQuery.sap.getResourcePath("sap/ushell/renderers/fiori2/search/container"),
                        "loadCoreExt": true,    // for the search component core-ext-light should be loaded to avoid
                                                // single module loading and to trigger plugin loading
                        "loadDefaultDependencies": false // but we don't need old default dependencies like scaffolding
                    };
                }
                oDeferred.resolve(res);
                return oDeferred.promise();
            }
        });
    };

    //custom resolver for the default FLP intent and for the old catalog intent
    sap.ushell.Container.getService("NavTargetResolution").registerCustomResolver({
        name : "FLP Resolver",
        isApplicable : function (sHashFragment) {
            sHashFragment = (typeof sHashFragment === "string") ? sHashFragment : "";
            sHashFragment = sHashFragment.split("?")[0];
            return sHashFragment === "#Shell-home" || sHashFragment === "#shell-catalog";
        },
        resolveHashFragment : function (sHashFragment) {
            var oDeferred = new jQuery.Deferred(),
                res = {};
            sHashFragment = (typeof sHashFragment === "string") ? sHashFragment : "";
            sHashFragment = sHashFragment.split("?")[0];
            if (sHashFragment === "#Shell-home" || sHashFragment === "#shell-catalog") {
                res = {
                    "additionalInformation": "SAPUI5.Component=sap.ushell.components.flp",
                    "applicationType": "URL",
                    "url": jQuery.sap.getResourcePath("sap/ushell/components/flp"),
                    "loadCoreExt": false,    // avoid loading of core-ext-light and default dependencies for renderer component
                    "loadDefaultDependencies": false,
                    "applicationDependencies": {
                        asyncHints: {
                            preloadBundles: ["sap/fiori/flp-controls.js"]
                        }
                    }
                };
            }
            oDeferred.resolve(res);
            return oDeferred.promise();
        }
    });

    var Navigation = new Navigation();


	return Navigation;

}, /* bExport= */ true);
