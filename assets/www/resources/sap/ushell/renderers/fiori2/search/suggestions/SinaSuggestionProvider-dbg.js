/* global jQuery, sap */

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/SearchHelper',
    'sap/ushell/renderers/fiori2/search/suggestions/SinaBaseSuggestionProvider',
    'sap/ushell/renderers/fiori2/search/suggestions/SuggestionTypeProps'
], function(SearchHelper, SinaBaseSuggestionProvider, SuggestionTypeProps) {
    "use strict";

    // =======================================================================
    // import packages
    // =======================================================================

    var sinaBaseModule = window.sinabase;

    // =======================================================================
    // declare package
    // =======================================================================
    jQuery.sap.declare('sap.ushell.renderers.fiori2.search.suggestions.SinaSuggestionProvider');

    // =======================================================================
    // ina based suggestion provider - version 2 (new)
    // =======================================================================
    var module = sap.ushell.renderers.fiori2.search.suggestions.SinaSuggestionProvider = function() {
        this.init.apply(this, arguments);
    };

    module.prototype = jQuery.extend(new SinaBaseSuggestionProvider(), {

        suggestionLimit: jQuery.device.is.phone ? 5 : 7,

        // init
        // ===================================================================
        init: function(params) {
            // call super constructor
            SinaBaseSuggestionProvider.prototype.init.apply(this, arguments);
            // decorate getResultSet method for preventing request overtaking
            this.getResultSet = SearchHelper.refuseOutdatedRequests(this.getResultSet);

            this.dataSourceDeferred = null;
        },

        // abort suggestions
        // ===================================================================
        abortSuggestions: function() {
            this.getResultSet.abort();
        },

        // get result set
        // ===================================================================
        getResultSet: function() {
            return this.suggestionQuery.getResultSet();
        },

        // get suggestions
        // ===================================================================
        getSuggestions: function() {

            var that = this;

            // reset global fields
            this.suggestions = [];
            this.firstObjectDataSuggestion = true;
            this.numberSuggestionsByType = {};
            for (var suggestionType in sinaBaseModule.SuggestionType) {
                this.numberSuggestionsByType[sinaBaseModule.SuggestionType[suggestionType]] = 0;
            }

            // object data suggestions only starting from 3. character
            var suggestionTerm = that.model.getProperty('/uiFilter/searchTerms');
            if (this.suggestionTypes.length === 1 &&
                this.suggestionTypes.indexOf(sinaBaseModule.SuggestionType.OBJECTDATA) >= 0 &&
                suggestionTerm.length < 3) {
                return jQuery.when(this.suggestions);
            }

            // handle client side datasource-suggestions for all and apps
            that.createAllAndAppDsSuggestions();

            // check that BO search is enabled
            if (!that.model.isBusinessObjSearchEnabled()) {
                return jQuery.when(this.suggestions);
            }

            // no server request for ds = apps
            if (that.model.getDataSource().equals(that.model.appDataSource)) {
                return jQuery.when(this.suggestions);
            }

            // prepare sina suggestion query
            that.prepareSuggestionQuery(suggestionTerm);

            // fire sina suggestion query
            return that.getResultSet().then(function(resultset) {

                // concatenate searchterm + suggestion term
                var sinaSuggestions = resultset.getElements();

                // assemble items from result set
                that.formatSinaSuggestions(sinaSuggestions);

                return that.suggestions;
            });

        },

        // client side datasource suggestions for all and apps
        // ===================================================================
        createAllAndAppDsSuggestions: function() {

            if (this.suggestionTypes.indexOf(sinaBaseModule.SuggestionType.DATASOURCE) < 0) {
                return;
            }

            if (!this.model.getDataSource().equals(this.model.allDataSource)) {
                return;
            }

            var dataSources = [];
            dataSources.unshift(this.model.appDataSource);
            dataSources.unshift(this.model.allDataSource);

            var suggestionTerms = this.model.getProperty('/uiFilter/searchTerms');
            var suggestionTermsIgnoreStar = suggestionTerms.replace(/\*/g, '');
            var oTester = new SearchHelper.Tester(suggestionTermsIgnoreStar);

            for (var i = 0; i < dataSources.length; ++i) {
                var dataSource = dataSources[i];
                if (dataSource.key === this.model.getDataSource().key) {
                    continue;
                }
                var oTestResult = oTester.test(dataSource.label);
                if (oTestResult.bMatch === true) {
                    var suggestion = {};
                    suggestion.label = '<i>' + sap.ushell.resources.i18n.getText("searchInPlaceholder", [""]) + '</i> ' + oTestResult.sHighlightedText;
                    suggestion.labelRaw = '';
                    suggestion.dataSource = dataSource;
                    suggestion.type = sinaBaseModule.SuggestionType.DATASOURCE;
                    suggestion.position = SuggestionTypeProps[sinaBaseModule.SuggestionType.DATASOURCE].position;
                    suggestion.key = dataSource.key;
                    this.addSuggestion(suggestion);
                }
            }
        },

        // preformat of suggestions: add ui position and unique key
        // ===================================================================
        preFormatSuggestions: function(sinaSuggestions) {
            for (var i = 0; i < sinaSuggestions.length; ++i) {
                var sinaSuggestion = sinaSuggestions[i];
                // set position
                sinaSuggestion.position = SuggestionTypeProps[sinaSuggestion.type].position;
                // set key
                if (sinaSuggestion.type === sinaBaseModule.SuggestionType.DATASOURCE) {
                    sinaSuggestion.key = sinaSuggestion.labelRaw.key;
                } else {
                    sinaSuggestion.key = sinaSuggestion.labelRaw;
                }
                // process children
                if (sinaSuggestion.children) {
                    this.preFormatSuggestions(sinaSuggestion.children);
                }
            }
        },

        // add sina suggestions
        // ===================================================================
        formatSinaSuggestions: function(sinaSuggestions) {

            // preprocess add ui position and key to all suggestions
            this.preFormatSuggestions(sinaSuggestions);

            // process suggestions
            for (var i = 0; i < sinaSuggestions.length; ++i) {
                var sinaSuggestion = sinaSuggestions[i];

                // ignore suggestions without label (should not happen)
                if (!sinaSuggestion.labelRaw) {
                    continue;
                }

                // avoid duplicate suggestion terms
                if (this.suggestionTermBuffer.hasTerm(sinaSuggestion.key)) {
                    continue;
                }

                // limit number of suggestions
                var numberSuggestions = this.numberSuggestionsByType[sinaSuggestion.type];
                var limit = SuggestionTypeProps[sinaSuggestion.type].limit;
                if (numberSuggestions >= limit) {
                    continue;
                }

                // format according to type
                switch (sinaSuggestion.type) {
                    case sinaBaseModule.SuggestionType.DATASOURCE:
                        if (!this.model.getDataSource().equals(this.model.allDataSource)) {
                            continue;
                        }
                        sinaSuggestion.label = '<i>' + sap.ushell.resources.i18n.getText("searchInPlaceholder", [""]) + '</i> ' + sinaSuggestion.label;
                        this.addSuggestion(sinaSuggestion);
                        break;
                    case sinaBaseModule.SuggestionType.OBJECTDATA:
                        this.formatObjectDataSuggestion(sinaSuggestion);
                        break;
                    case sinaBaseModule.SuggestionType.HISTORY:
                        sinaSuggestion.label = sinaSuggestion.label;
                        this.addSuggestion(sinaSuggestion);
                        break;
                    default:
                        break;
                }

            }

            return this.suggestions;
        },

        // add suggestion
        // ===================================================================
        addSuggestion: function(suggestion) {
            this.suggestions.push(suggestion);
            this.suggestionTermBuffer.addTerm(suggestion.key);
            this.numberSuggestionsByType[suggestion.type] += 1;
        },

        // format bo suggestion
        // ===================================================================
        formatObjectDataSuggestion: function(sinaSuggestion) {
            if (this.model.getDataSource().equals(this.model.allDataSource)) {
                // 1. model datasource is all
                if (this.firstObjectDataSuggestion && sinaSuggestion.children.length > 0) {
                    // 1.1 first suggestion (also use children)
                    this.firstObjectDataSuggestion = false;
                    sinaSuggestion.label = this.assembleSearchInSuggestionLabel(sinaSuggestion);
                    this.addSuggestion(sinaSuggestion);
                    this.addChildSuggestions(sinaSuggestion);
                } else {
                    // 1.2 subsequent suggestions
                    this.addSuggestion(sinaSuggestion);
                }
            } else {
                // 2. model datasource is a connector
                this.addSuggestion(sinaSuggestion);
            }
        },

        // add child suggestions
        // ===================================================================
        addChildSuggestions: function(sinaSuggestion) {
            if (!sinaSuggestion.children) {
                return;
            }
            var limit = Math.min(sinaSuggestion.children.length,
                SuggestionTypeProps[sinaBaseModule.SuggestionType.OBJECTDATA].limitDataSource,
                SuggestionTypeProps[sinaBaseModule.SuggestionType.OBJECTDATA].limit - 1
            );
            for (var i = 0; i < limit; ++i) {
                var sinaChildSuggestion = sinaSuggestion.children[i];
                this.numberObjectDataSuggestions++;
                sinaChildSuggestion.label = this.assembleSearchInSuggestionLabel(sinaChildSuggestion);
                sinaChildSuggestion.position = SuggestionTypeProps[sinaBaseModule.SuggestionType.OBJECTDATA].position;
                this.addSuggestion(sinaChildSuggestion);
            }
        },

        // assemble search in suggestion label
        // ===================================================================
        assembleSearchInSuggestionLabel: function(sinaSuggestion) {
            return sap.ushell.resources.i18n.getText("resultsIn", [
                '<span>' + sinaSuggestion.label + '</span>',
                sinaSuggestion.dataSource.labelPlural
            ]);
        }
    });

    return module;
});
