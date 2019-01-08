sap.ui.define([], function() {
    "use strict";

    // =======================================================================
    // declare package
    // =======================================================================
    jQuery.sap.declare('sap.ushell.renderers.fiori2.search.suggestions.SuggestionProvider');

    // =======================================================================
    // suggestion provider base class
    // =======================================================================
    var module = sap.ushell.renderers.fiori2.search.suggestions.SuggestionProvider = function() {
        this.init.apply(this, arguments);
    };

    module.prototype = {

        init: function(params) {
            jQuery.extend(this, params);
        },

        abortSuggestions: function() {},

        getSuggestions: function() {}

    };

    return module;
});
