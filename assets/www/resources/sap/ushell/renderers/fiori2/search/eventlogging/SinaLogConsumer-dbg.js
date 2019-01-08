/* global jQuery, sap */

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/eventlogging/EventConsumer'
], function(EventConsumer) {
    "use strict";

    // =======================================================================
    // declare package
    // =======================================================================
    jQuery.sap.declare('sap.ushell.renderers.fiori2.search.eventlogging.SinaLogConsumer');

    // =======================================================================
    // SinaLogConsumer
    // =======================================================================
    var module = sap.ushell.renderers.fiori2.search.eventlogging.SinaLogConsumer = function() {
        this.init.apply(this, arguments);
    };

    module.prototype = jQuery.extend(new EventConsumer(), {

        collectEvents: true,

        init: function(sina) {
            this.sina = sina;
        },

        logEvents: function(events) {
            var formattedEvents = [];
            for (var i = 0; i < events.length; ++i) {
                var event = jQuery.extend({}, events[i]);
                event.type = event.type.toString(); // convert type object to string
                formattedEvents.push(event);
            }
            this.sina.logEvents(formattedEvents);
        },

        createEventLoggingTimestamp: function() {
            return this.sina.createEventLoggingTimestamp();
        }

    });

    return module;
});
