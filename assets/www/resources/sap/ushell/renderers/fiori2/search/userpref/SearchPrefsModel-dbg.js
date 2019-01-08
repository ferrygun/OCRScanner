/* global $, jQuery, sap, window */

// no prefs request when adding entry
// only single sina get server info request in fail case
// mathias: dataType:'text'
sap.ui.define([
    'sap/ui/model/json/JSONModel',
    'sap/ushell/renderers/fiori2/search/SearchModel',
    'sap/ushell/renderers/fiori2/search/SearchConfiguration'
], function(JSONModel, SearchModel, SearchConfiguration) {
    "use strict";

    // model class for search preferences view
    // =======================================================================
    var path = 'sap.ushell.renderers.fiori2.search.userpref.SearchPrefsModel';
    return sap.ui.model.json.JSONModel.extend(path, {

        constructor: function(properties) {

            // call super constructor
            var that = this;
            sap.ui.model.json.JSONModel.prototype.constructor.apply(that, []);

            // get sina
            //            that.sina = sap.ushell.Container.getService("Search").getSina();
            that.config = SearchConfiguration.getInstance();
            that.sina = that.config.getSina();

            // reset all data
            this.reset();
        },

        personalizationPolicyOptOut: 'Opt-Out',
        personalizationPolicyOptIn: 'Opt-In',
        personalizationPolicyEnforced: 'Enforced',
        personalizationPolicyDisabled: 'Disabled',
        personalizationPolicies: ['Opt-Out', 'Opt-In', 'Enforced', 'Disabled'],

        isSearchPrefsActive: function() {
            var that = this;
            /* eslint new-cap:0 */
            var prom = $.Deferred();
            var searchModel = sap.ushell.renderers.fiori2.search.getModelSingleton();
            searchModel.initBusinessObjSearch().then(function() {

                if (!that.config.searchBusinessObjects || !that.config.enableSearch || !searchModel.isBusinessObjSearchEnabled()) {
                    //return jQuery.when(false);
                    prom.fail(false);
                    return;
                }

                that.sina.getSystem().getServerInfo().then(
                    function(serverInfo) {
                        // server info ok -> check capabilities
                        serverInfo = serverInfo.rawServerInfo;
                        for (var i = 0; i < serverInfo.Services.length; ++i) {
                            var service = serverInfo.Services[i];
                            if (service.Service === 'PersonalizedSearch') {
                                //return jQuery.when(true);
                                prom.resolve(true);
                                return;
                            }
                        }
                        prom.fail(false);
                        return;
                        // return jQuery.when(false);
                    },
                    function() {
                        // server info failed
                        // return jQuery.when(false);
                        prom.fail(false);
                    });
            })

            return prom;
        },

        reset: function() {
            this.initializedDeferred = null;
            this.setData({
                searchPrefsActive: false,
                sessionUserActive: false,
                personalizationPolicy: 'Enforced'
            });
        },

        asyncInit: function() {

            // return existing deferred
            var that = this;
            if (that.initializedDeferred) {
                return that.initializedDeferred;
            }

            // load preferences from server
            that.initializedDeferred = that.isSearchPrefsActive().then(function(isSearchPrefsActive) {
                that.setProperty('/searchPrefsActive', isSearchPrefsActive);
                if (!isSearchPrefsActive) {
                    return jQuery.when(true);
                }
                return that.loadPreferences();
            });

            return that.initializedDeferred;
        },

        loadPreferences: function() {
            var that = this;
            that.searchConfiguration = that.sina.getSearchConfiguration();
            return that.searchConfiguration.load().then(function(configuration) {
                var sessionUserActive = configuration.Data.PersonalizedSearch.SessionUserActive;
                that.setProperty('/sessionUserActive', sessionUserActive);
                var personalizationPolicy = configuration.Data.PersonalizedSearch.PersonalizationPolicy;
                if (that.personalizationPolicies.indexOf(personalizationPolicy) < 0) {
                    personalizationPolicy = this.personalizationPolicyDisabled;
                }
                that.setProperty('/personalizationPolicy', personalizationPolicy);
                switch (personalizationPolicy) {
                    case that.personalizationPolicyEnforced:
                        that.setProperty('/explanationText', sap.ushell.resources.i18n.getText('sp.explanationPolicyEnforced'));
                        break;
                    case that.personalizationPolicyDisabled:
                        that.setProperty('/explanationText', sap.ushell.resources.i18n.getText('sp.explanationPolicyDisabled'));
                        break;
                    default:
                        that.setProperty('/explanationText', '');
                }
            });
        },

        savePreferences: function() {

            // do not save depending on personalization policy
            var personalizationPolicy = this.getProperty('/personalizationPolicy');
            var searchPrefsActive = this.getProperty('/searchPrefsActive');
            if (!searchPrefsActive || personalizationPolicy === this.personalizationPolicyEnforced ||
                personalizationPolicy === this.personalizationPolicyDisabled) {
                return jQuery.when(true);
            }

            // save
            var that = this;
            var data = {
                "SearchConfiguration": {
                    "Action": "Update",
                    "Data": {
                        "PersonalizedSearch": {
                            "SessionUserActive": that.getProperty('/sessionUserActive')
                        }
                    }
                }
            };
            return that.searchConfiguration.save(data);

        },

        resetProfile: function() {
            return this.sina.emptyUserHistory();
        }

    });

});
