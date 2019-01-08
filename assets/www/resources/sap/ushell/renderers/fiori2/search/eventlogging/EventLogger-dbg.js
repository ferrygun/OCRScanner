/* global jQuery, sap, window */

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/eventlogging/SinaLogConsumer',
    'sap/ushell/renderers/fiori2/search/eventlogging/HistoryLogConsumer',
    'sap/ushell/renderers/fiori2/search/eventlogging/UsageAnalyticsConsumer'
], function(SinaLogConsumer, HistoryLogConsumer, UsageAnalyticsConsumer) {
    "use strict";

    // =======================================================================
    // declare package
    // =======================================================================
    jQuery.sap.declare('sap.ushell.renderers.fiori2.search.eventlogging.EventLogger');

    // =======================================================================
    // EventLogger (main class for event logging)
    // =======================================================================
    var module = sap.ushell.renderers.fiori2.search.eventlogging.EventLogger = function() {
        this.init.apply(this, arguments);
    };

    module.newInstance = function(properties) {
        var logger = new module();
        logger.addConsumer(new SinaLogConsumer(properties.sina));
        logger.addConsumer(new HistoryLogConsumer(properties.sina));
        logger.addConsumer(new UsageAnalyticsConsumer());
        return logger;
    };

    module.prototype = {

        ITEM_NAVIGATE: {
            targetUrl: 'string',
            positionInList: 'integer'
        },

        SUGGESTION_SELECT: {
            suggestionType: 'string',
            suggestionTitle: 'string',
            suggestionTerm: 'string',
            searchTerm: 'string',
            targetUrl: 'string',
            dataSourceKey: 'string'
        },

        SEARCH_REQUEST: {
            searchTerm: 'string',
            dataSourceKey: 'string'
        },

        ITEM_NAVIGATE_RELATED_OBJECT: {
            targetUrl: 'string'
        },

        SUGGESTION_REQUEST: {
            suggestionTerm: 'string',
            dataSourceKey: 'string'
        },

        TILE_NAVIGATE: {
            tileTitle: 'string',
            targetUrl: 'string'
        },

        init: function() {
            this.consumers = [];
            this.addToStringMethodToEvents();
        },

        addToStringMethodToEvents: function() {
            var createToString = function(name) {
                return function() {
                    return name;
                };
            };
            for (var property in this) {
                if (property.toUpperCase() !== property) {
                    continue;
                }
                var value = this[property];
                value.toString = createToString(property);
            }
        },

        addConsumer: function(consumer) {
            this.consumers.push(consumer);
            consumer.eventLogger = this;
        },

        logEvent: function(event) {
            for (var i = 0; i < this.consumers.length; ++i) {
                var consumer = this.consumers[i];
                if (consumer.collectEvents) {
                    if (!consumer.eventCollector) {
                        consumer.eventCollector = new EventCollector(consumer);
                    }
                    consumer.eventCollector.addEvent(event);
                } else {
                    try {
                        consumer.logEvent(event);
                    } catch (e) {
                        // error in logging shall not break app
                    }
                }
            }
        }

    };

    // =======================================================================
    // EventCollector (helper for packaging events)
    // =======================================================================
    var EventCollector = function() {
        this.init.apply(this, arguments);
    };

    EventCollector.prototype = {

        init: function(consumer) {
            this.events = [];
            this.consumer = consumer;
        },

        addEvent: function(event) {
            var that = this;
            event.timestamp = this.consumer.createEventLoggingTimestamp();
            this.events.push(event);
            if (this.events.length === 1) {
                window.setTimeout(function() {
                    that.consumeEvents();
                }, this.consumer.collectTime);
            }
        },

        consumeEvents: function() {
            try {
                this.consumer.logEvents(this.events);
            } catch (e) {
                // error in logging shall not break app
            }
            this.events = [];
        }
    };

    return module;
});
