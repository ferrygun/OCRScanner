/* global jQuery, sap, window */

sap.ui.define([], function() {
    "use strict";

    // =======================================================================
    // declare package
    // =======================================================================
    jQuery.sap.declare('sap.ushell.renderers.fiori2.search.suggestions.TimeMerger');

    // =======================================================================
    // suggestion types
    // =======================================================================

    var TimeMerger = sap.ushell.renderers.fiori2.search.suggestions.TimeMerger = function() {
        this.init.apply(this, arguments);
    };

    var counter = 0;

    TimeMerger.prototype = {

        init: function(promiseList, timeDelay) {
            this.promiseList = promiseList || [];
            this.timeDelay = timeDelay || 1000;
            this.pending = this.promiseList.length;
            this.returned = [];
            this.aborted = false;
            this.counter = ++counter;
        },

        abort: function() {
            this.aborted = true;
        },

        process: function(processorCallback) {
            this.processorCallback = processorCallback;
            this.start();
            return this;
        },

        start: function() {
            // register done callback for all promises
            for (var i = 0; i < this.promiseList.length; ++i) {
                var promise = this.promiseList[i];
                promise.done(this.assembleDoneCallback(i));
            }
            // schedule time delayed merging of promise results
            this.scheduleProcessorNotification();
        },

        scheduleProcessorNotification: function() {
            var that = this;
            if (that.processorNotificationSchedule) {
                window.clearTimeout(that.processorNotificationSchedule);
                that.processorNotificationSchedule = null;
            }
            that.processorNotificationSchedule = window.setTimeout(function() {
                that.notifyProcessor();
            }, this.timeDelay);
        },

        notifyProcessor: function() {
            //console.log('--notify');
            // check for abortion
            if (this.aborted) {
                return;
            }
            // notify callback if promises have returned
            if (this.returned.length > 0) {
                this.processorCallback(this.returned);
                this.returned = [];
            }
            // check if we need to schedule a new merge
            if (this.pending > 0) {
                this.scheduleProcessorNotification();
            }
        },

        assembleDoneCallback: function(index) {
            var that = this;
            return function(result) {
                that.pending--;
                that.returned.push(result);
                if (that.pending === 0) {
                    if (that.processorNotificationSchedule) {
                        window.clearTimeout(that.processorNotificationSchedule);
                        that.processorNotificationSchedule = null;
                    }
                    that.notifyProcessor();
                }
            };
        }

    };

    return TimeMerger;
});
