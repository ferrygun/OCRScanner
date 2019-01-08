/* global jQuery, sap, window */

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/eventlogging/EventConsumer'
], function(EventConsumer) {
    "use strict";

    // =======================================================================
    // import packages
    // =======================================================================
    var sinaBaseModule = window.sinabase;

    // =======================================================================
    // declare package
    // =======================================================================
    jQuery.sap.declare('sap.ushell.renderers.fiori2.search.eventlogging.UsageAnalyticsConsumer');

    // =======================================================================
    // SinaEventConsumer
    // =======================================================================
    var module = sap.ushell.renderers.fiori2.search.eventlogging.UsageAnalyticsConsumer = function() {
        this.init.apply(this, arguments);
    };

    module.prototype = jQuery.extend(new EventConsumer(), {

        collectEvents: false,

        init: function() {
            try {
                this.analytics = sap.ushell.Container.getService("UsageAnalytics");
            } catch (e) { /* empty */ }
        },

        logEvent: function(event) {
            if (!this.analytics) {
                return;
            }
            switch (event.type) {
                case this.eventLogger.ITEM_NAVIGATE:
                    this.analytics.logCustomEvent('FLP: Search', 'Launch Object', [event.targetUrl]);
                    break;
                case this.eventLogger.SUGGESTION_SELECT:
                    switch (event.suggestionType) {
                        case sinaBaseModule.SuggestionType.APPS:
                            this.analytics.logCustomEvent('FLP: Search', 'Suggestion Select App', [
                                event.suggestionTitle,
                                event.targetUrl,
                                event.searchTerm
                            ]);
                            this.analytics.logCustomEvent('FLP: Application Launch point', 'Search Suggestions', [
                                event.suggestionTitle,
                                event.targetUrl,
                                event.searchTerm
                            ]);
                            break;
                        case sinaBaseModule.SuggestionType.DATASOURCE:
                            this.analytics.logCustomEvent('FLP: Search', 'Suggestion Select Datasource', [
                                event.dataSourceKey,
                                event.searchTerm
                            ]);
                            break;
                        case sinaBaseModule.SuggestionType.OBJECTDATA:
                            this.analytics.logCustomEvent('FLP: Search', 'Suggestion Select Object Data', [
                                event.suggestionTerm,
                                event.dataSourceKey,
                                event.searchTerm
                            ]);
                            break;
                        case sinaBaseModule.SuggestionType.HISTORY:
                            this.analytics.logCustomEvent('FLP: Search', 'Suggestion Select Object Data', [
                                event.suggestionTerm,
                                event.dataSourceKey,
                                event.searchTerm
                            ]);
                            break;
                    }
                    break;
                case this.eventLogger.SEARCH_REQUEST:
                    this.analytics.logCustomEvent('FLP: Search', 'Search', [
                        event.searchTerm,
                        event.dataSourceKey
                    ]);
                    break;
                case this.eventLogger.ITEM_NAVIGATE_RELATED_OBJECT:
                    this.analytics.logCustomEvent('FLP: Search', 'Launch Related Object', [event.targetUrl]);
                    break;
                case this.eventLogger.SUGGESTION_REQUEST:
                    this.analytics.logCustomEvent('FLP: Search', 'Suggestion', [
                        event.suggestionTerm,
                        event.dataSourceKey
                    ]);
                    break;
                case this.eventLogger.TILE_NAVIGATE:
                    this.analytics.logCustomEvent('FLP: Search', 'Launch App', [
                        event.tileTitle,
                        event.targetUrl
                    ]);
                    this.analytics.logCustomEvent('FLP: Application Launch point', 'Search Results', [
                        event.titleTitle,
                        event.targetUrl
                    ]);
                    break;
            }
        }
    });

    return module;
});
