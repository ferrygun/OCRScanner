/* global $,jQuery,window */
// iteration 0

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/SearchNavigationIntentObject'
], function(SearchNavigationIntentObject) {
    "use strict";
    /* eslint no-warning-comments:0 */

    jQuery.sap.declare('sap.ushell.renderers.fiori2.search.SearchIntentsResolver');
    var module = sap.ushell.renderers.fiori2.search.SearchIntentsResolver = function() {
        this.init.apply(this, arguments);
    };

    module.prototype = {
        init: function(model) {
            this._launchpadNavigation = sap.ushell && sap.ushell.Container && (sap.ushell.Container.getService("SmartNavigation") || sap.ushell.Container.getService("CrossApplicationNavigation"));
            this._model = model;
        },

        resolveIntents: function(results) {
            var that = this;

            // Synchronize all intent requests through one additional promise object
            var overallPromise = new Promise(function(resolve, reject) {

                if (!that._launchpadNavigation) {
                    resolve();
                    return;
                }

                if (!module._semanticObjectTypeSupportedPromise) {
                    module._semanticObjectTypeSupportedPromise = that._model.sina.sinaSystem().getServerInfo().then(function(serverInfo) {
                        module._semanticObjectTypeSupported = false;
                        if (serverInfo && serverInfo.rawServerInfo && serverInfo.rawServerInfo.Services) {
                            for (var i = 0; i < serverInfo.rawServerInfo.Services.length; ++i) {
                                var service = serverInfo.rawServerInfo.Services[i];
                                if (service.Service === 'Search') {
                                    for (var j = 0; j < service.Capabilities.length; ++j) {
                                        var capability = service.Capabilities[j];
                                        if (capability.Capability === 'SemanticObjectType') {
                                            module._semanticObjectTypeSupported = true;
                                            break;
                                        }
                                    }
                                    break;
                                }
                            }
                        } else {
                            module._semanticObjectTypeSupported = true;
                        }
                    });
                }

                module._semanticObjectTypeSupportedPromise.then(function() {
                    if (!module._semanticObjectTypeSupported) {
                        resolve();
                    } else {
                        that.fioriFrontendSystemInfo = {
                            systemId: sap.ushell.Container.getLogonSystem().getName(),
                            client: sap.ushell.Container.getLogonSystem().getClient()
                        }
                        var proms = [];
                        for (var k = 0; k < results.length; k++) {
                            var result = results[k];

                            if (result.semanticObjectType && result.semanticObjectType.length > 0) {
                                var prom = that._doResolveIntents(result);
                                proms.push(prom);
                            }
                        }

                        Promise.all(proms).then(function() {
                            resolve();
                        });
                    }
                });
            });
            return overallPromise;
        },

        resolveIntentsGetDeferred: function(results) {
            var promise = this.resolveIntents(results);
            var dfd = new $.Deferred();
            promise.then(function() {
                dfd.resolve();
            });
            return dfd.promise();
        },

        _doResolveIntents: function(result) {
            var that = this;

            // reset main URL
            if (result.titleNavigationIsOldURL) {
                result.titleNavigation = undefined;
            }

            var sapSystemIntentParameter;
            if (result.systemId && result.client &&
                !(that.fioriFrontendSystemInfo.systemId == result.systemId && that.fioriFrontendSystemInfo.client == result.client)) {
                sapSystemIntentParameter = "sap-system=sid(" + result.systemId + "." + result.client + ")";
            }

            // additional deferredObject is necessary, because if one of the inner
            // promise objects fails, $.when.always (see below) resolves immediately
            // and does not wait for the other inner proms to either resolve or fail.
            var outerProm = new Promise(function(resolve, reject) {

                /* eslint new-cap:0 */
                var primaryIntentProm = $.Deferred();
                if (that._launchpadNavigation.getPrimaryIntent) {
                    that._launchpadNavigation.getPrimaryIntent(result.semanticObjectType, result.semanticObjectTypeAttrs).done(function(primaryIntent) {
                        primaryIntentProm.resolve(primaryIntent);
                    }).fail(function() {
                        primaryIntentProm.resolve();
                    });
                } else {
                    primaryIntentProm.resolve();
                }

                var intentsProm, intentsOuterProm = $.Deferred();
                if (that._launchpadNavigation.getLinks) {
                    intentsProm = that._launchpadNavigation.getLinks({
                        semanticObject: result.semanticObjectType,
                        params: result.semanticObjectTypeAttrs,
                        withAtLeastOneUsedParam: true,
                        sortResultOnTexts: true
                    });
                } else {
                    intentsProm = that._launchpadNavigation.getSemanticObjectLinks(result.semanticObjectType, result.semanticObjectTypeAttrs);
                }
                intentsProm.done(function(intents) {
                    intentsOuterProm.resolve(intents);
                }).fail(function() {
                    intentsOuterProm.resolve();
                });

                $.when(primaryIntentProm, intentsOuterProm).done(function(primaryIntent, intents) {

                    var primaryNavigationObject;
                    if (primaryIntent) {
                        primaryNavigationObject = that._getNavigationObjectForIntent(primaryIntent, sapSystemIntentParameter);
                        result.uri = primaryNavigationObject.getHref();
                        primaryNavigationObject.setLoggingType(that._model.eventLogger.ITEM_NAVIGATE);
                        result.titleNavigation = primaryNavigationObject;
                    }

                    var primaryIntentAction = "-displayFactSheet";
                    var foundPrimaryIntent = result.titleNavigation !== undefined;

                    result.intents = [];

                    if (!result.navigationObjects) {
                        result.navigationObjects = [];
                    }

                    for (var i = 0; i < intents.length; i++) {
                        var intent = intents[i];

                        var navigationObject = that._getNavigationObjectForIntent(intent, sapSystemIntentParameter);

                        if (!foundPrimaryIntent && intent.intent.substring(intent.intent.indexOf("-"), intent.intent.indexOf("?")) === primaryIntentAction) {
                            result.uri = navigationObject.getHref();
                            navigationObject.setLoggingType(that._model.eventLogger.ITEM_NAVIGATE);
                            result.titleNavigation = navigationObject;
                            foundPrimaryIntent = true;
                        } else if (!primaryNavigationObject || !navigationObject.isEqualTo(primaryNavigationObject)) {
                            intent.target = navigationObject.getTarget();
                            intent.externalHash = navigationObject.getHref();
                            result.intents.push(intent);
                            navigationObject.setLoggingType(that._model.eventLogger.ITEM_NAVIGATE_RELATED_OBJECT);
                            result.navigationObjects.push(navigationObject);
                        }
                    }

                    resolve();
                }).fail(function(arg) {
                    resolve(); // TO-DO: actually this should never happen!
                });
            });
            return outerProm;
        },

        _getNavigationObjectForIntent: function(intent, sapSystemIntentParameter) {
            var that = this;

            var shellHash = intent.intent;

            if (sapSystemIntentParameter) {
                var whereToSplit = shellHash.indexOf('?');
                if (whereToSplit === -1) {
                    shellHash += "?" + sapSystemIntentParameter;
                } else {
                    whereToSplit += 1; // Split _after_ the question mark
                    var pureIntent = shellHash.substring(0, whereToSplit);
                    var intentAttributes = shellHash.substring(whereToSplit);
                    shellHash = pureIntent + sapSystemIntentParameter;
                    if (intentAttributes && intentAttributes.length > 0) {
                        shellHash += "&" + intentAttributes;
                    }
                }
            }

            var externalTarget = {
                target: {
                    shellHash: shellHash
                }
            };
            var externalHash = that._launchpadNavigation.hrefForExternal(externalTarget);

            var navigationObject = new SearchNavigationIntentObject({
                text: intent.text,
                href: externalHash,
                externalTarget: externalTarget
            });

            return navigationObject;
        }
    };

    return module;
});
