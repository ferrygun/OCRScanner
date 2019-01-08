/* global jQuery, sap */

sap.ui.define([], function() {
    "use strict";

    // =======================================================================
    // declare package
    // =======================================================================
    jQuery.sap.declare('sap.ushell.renderers.fiori2.search.eventlogging.EventConsumer');

    // =======================================================================
    // EventConsumer (base class for all consumers)
    // =======================================================================
    var module = sap.ushell.renderers.fiori2.search.eventlogging.EventConsumer = function() {
        this.init.apply(this, arguments);
    };

    module.prototype = {

        // if true: This consumer offers the logEvents method allowing to consume
        // multiple events at the same time. This allows the EventLogger to collect events
        // and to send an event package to the consumer in order to minimize ajax requests.
        collectEvents: false,

        collectTime: 2000,

        init: function() {

        },

        logEvent: function(event) {
            // to be implemented in subclass
        },

        logEvents: function(events) {
            // to be implemented in subclass
        },

        createLoggingTimestamp: function() {
            // to be implemented in subclass
        }

    };

    return module;
});
