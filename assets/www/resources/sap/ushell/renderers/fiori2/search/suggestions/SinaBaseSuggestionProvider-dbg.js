sap.ui.define([
    'sap/ushell/renderers/fiori2/search/suggestions/SuggestionProvider'
], function(SuggestionProvider) {
    "use strict";

    // =======================================================================
    // declare package
    // =======================================================================
    jQuery.sap.declare('sap.ushell.renderers.fiori2.search.suggestions.SinaBaseSuggestionProvider');

    // =======================================================================
    // base class for ina based suggestion providers
    // =======================================================================
    var module = sap.ushell.renderers.fiori2.search.suggestions.SinaBaseSuggestionProvider = function() {
        this.init.apply(this, arguments);
    };

    module.prototype = jQuery.extend(new SuggestionProvider(), {

        // init
        // ===================================================================
        init: function() {
            // call super constructor
            SuggestionProvider.prototype.init.apply(this, arguments);
        },

        // prepare suggestions query
        // ===================================================================
        prepareSuggestionQuery: function(suggestionTerm) {
            var that = this;
            that.suggestionQuery.resetResultSet();

            that.suggestionQuery.setSuggestionTerm(suggestionTerm);
            if (!that.suggestionQuery.getDataSource() ||
                !that.model.getProperty('/uiFilter/dataSource').equals(that.suggestionQuery.getDataSource())) {
                that.suggestionQuery.resetFilterConditions();
            }
            that.suggestionQuery.setDataSource(that.model.getProperty("/uiFilter/dataSource"));
            that.suggestionQuery.setSuggestionTypes(that.suggestionTypes);
            that.suggestionQuery.setTop(20);
        }
    });

    return module;
});
