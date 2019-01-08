/* global jQuery, sap, window, document */
sap.ui.define([
    "sap/ushell/renderers/fiori2/search/SearchConfiguration",
    "sap/ushell/renderers/fiori2/search/esh/api/release/sina",
    "jquery.sap.storage" // the filename really is 'jquery.sap.storage' without any prepending path
], function(SearchConfiguration) {
    "use strict";

    jQuery.sap.declare('sap.ushell.renderers.fiori2.search.container.ComponentService');
    var module = sap.ushell.renderers.fiori2.search.container.ComponentService = {};
    jQuery.extend(module, {

        init: function() {

            sap.ushell.Container = {
                getService: function(name) {
                    if (name === "Search") {
                        return {
                            queryApplications: function(properties) {
                                return jQuery.when().then(function() {
                                    return {
                                        totalResults: 0,
                                        searchTerm: properties.searchTerm,
                                        getElements: function() {
                                            return [];
                                        }
                                    };
                                });
                            }
                        };
                    } else if (name === "URLParsing") {
                        return {
                            parseParameters: function(search) {
                                search = search.substr(1);
                                var result = {};
                                var params = search.split("&");
                                for (var i = 0; i < params.length; i++) {
                                    var pairs = params[i].split("=");
                                    if (!pairs[1]) {
                                        pairs[1] = "";
                                    }
                                    result[pairs[0]] = [pairs[1]];
                                }
                                return result;
                            },
                            splitHash: function(hash) {
                                var result = {};
                                result.appSpecificRoute = hash.substr(14);
                                return result;
                            }
                        };
                    }
                }
            };


            sap.ushell.resources = {};
            sap.ushell.resources.i18nModel = new sap.ui.model.resource.ResourceModel({
                bundleUrl: "../../resources/resources.properties",
                bundleLocale: "en"
            });
            sap.ushell.resources.i18n = sap.ushell.resources.i18nModel.getResourceBundle();

        }

    });
    return module;
});
