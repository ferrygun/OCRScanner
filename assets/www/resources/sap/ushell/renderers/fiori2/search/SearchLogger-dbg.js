// Logging utilities

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/SearchConfiguration'
], function(SearchConfiguration) {
    "use strict";

    var module = sap.ushell.renderers.fiori2.search.SearchLogger = {};

    module.NavigationEvent = function() {
        this.init.apply(this, arguments);
    };
    /**
     * class NavigationEvent
     */
    module.NavigationEvent.prototype = {

        init: function(properties) {
            // get sina
            //            this.sina = sap.ushell.Container.getService("Search").getSina();
            var config = SearchConfiguration.getInstance();
            this.sina = config.getSina();
        },

        _createUserHistoryEntry: function(sTargetUrl) {
            function getSID(aParameter) {
                // extract System and Client from sap-system=sid(BE1.001)
                var parameterList = aParameter;
                for (var i = 0, len = parameterList.length; i < len; i++) {
                    var param = parameterList[i];
                    if (param.indexOf("sap-system") !== -1) {
                        var sid = param.split("=");
                        return {
                            "System": sid[1].slice(4, 7),
                            "Client": sid[1].slice(8, -1)
                        };
                    }
                }
            }

            function getSemanticObjectType(sHash) {
                return sHash.split("-")[0];
            }

            function getIntent(sHash) {
                return sHash.split("-")[1].split("&")[0];
            }

            function getParameterList(aParameter) {
                var parameterList = aParameter;
                var inaParameterList = [];
                for (var i = 0, len = parameterList.length; i < len; i++) {
                    var param = parameterList[i];
                    if (param.indexOf("sap-system") !== -1) {
                        continue;
                    }
                    var name = param.split("=")[0];
                    var value = param.split("=")[1];
                    inaParameterList.push({
                        "Name": name,
                        Value: value
                    });
                }
                return inaParameterList;
            }

            var userHistoryEntry = {
                "NavigationEventList": [{
                    "SourceApplication": {
                        "SemanticObjectType": "",
                        "Intent": "",
                        "ParameterList": []
                    }
                }, {
                    "TargetApplication": {
                        "SemanticObjectType": "",
                        "Intent": "",
                        // "System" : "BE1",
                        // "Client" : "001",
                        "ParameterList": []
                    }
                }]
            };

            // source application
            var hashAsArray = window.hasher.getHashAsArray();
            var semanticObjectType = getSemanticObjectType(hashAsArray[0]);
            userHistoryEntry.NavigationEventList[0].SourceApplication.SemanticObjectType = semanticObjectType;
            var intent = getIntent(hashAsArray[0]);
            userHistoryEntry.NavigationEventList[0].SourceApplication.Intent = intent;
            var sourceParameterList = getParameterList(hashAsArray[1].split("&"));
            userHistoryEntry.NavigationEventList[0].SourceApplication.ParameterList = sourceParameterList;

            // target application
            hashAsArray = sTargetUrl.split("?");
            var targetSemanticObjectType = getSemanticObjectType(hashAsArray[0]).split("#")[1];
            userHistoryEntry.NavigationEventList[1].TargetApplication.SemanticObjectType = targetSemanticObjectType;
            var targetIntent = getIntent(hashAsArray[0]);
            userHistoryEntry.NavigationEventList[1].TargetApplication.Intent = targetIntent;
            var targetParameterList = getParameterList(hashAsArray[1].split("&"));
            userHistoryEntry.NavigationEventList[1].TargetApplication.ParameterList = targetParameterList;
            var oSystemAndClient = getSID(hashAsArray[1].split("&"));
            userHistoryEntry.NavigationEventList[1].TargetApplication = jQuery.extend(userHistoryEntry.NavigationEventList[1].TargetApplication, oSystemAndClient);
            return userHistoryEntry;
        },

        addUserHistoryEntry: function(sTargetUrl) {
            if (!sTargetUrl) {
                return;
            }
            if (sTargetUrl.indexOf("#") === -1) {
                return;
            }
            var sinaSystemServices = this.sina.getSystem().getServices();
            if (sinaSystemServices.PersonalizedSearch && sinaSystemServices.PersonalizedSearch.capabilities && sinaSystemServices.PersonalizedSearch.capabilities.SetUserStatus) {
                var userHistoryEntry = this._createUserHistoryEntry(sTargetUrl);
                this.sina.addUserHistoryEntry(userHistoryEntry)
                    .done(function(data) {
                        //                    console.log("success: " + JSON.stringify(data));
                    }).fail(function(error) {
                        //                    console.log("error: " + JSON.stringify(error));
                    });
            }
        }
    };

    return module;
});
