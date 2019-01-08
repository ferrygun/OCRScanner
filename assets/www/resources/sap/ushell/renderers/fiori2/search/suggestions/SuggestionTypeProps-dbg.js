/* global jQuery, sap, window */

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/SearchConfiguration'
], function(SearchConfiguration) {
    "use strict";

    // =======================================================================
    // import
    // =======================================================================
    //    sap.ushell.Container.getService("Search").getSina(); //ensure that sina is loaded
    var config = SearchConfiguration.getInstance();
    config.getSina();

    // =======================================================================
    // declare package
    // =======================================================================
    jQuery.sap.declare('sap.ushell.renderers.fiori2.search.suggestions.SuggestionTypeProps');

    // =======================================================================
    // extend sina suggestion types with apps
    // =======================================================================
    var sinabase = window.sinabase;
    sinabase.SuggestionType.APPS = 'apps';

    // =======================================================================
    // suggestion types
    // =======================================================================
    var module = sap.ushell.renderers.fiori2.search.suggestions.SuggestionTypeProps = {};

    // properties of datasource suggestions
    module[sinabase.SuggestionType.DATASOURCE] = {
        position: 10,
        limit: 2
    };

    // properties of app suggestions
    module[sinabase.SuggestionType.APPS] = {
        position: 20,
        limitDsAll: 3,
        limitDsApps: jQuery.device.is.phone ? 7 : 7
    };

    // properties of history suggestions
    module[sinabase.SuggestionType.HISTORY] = {
        position: 30,
        limit: 3
    };

    // properties of object data suggestions
    module[sinabase.SuggestionType.OBJECTDATA] = {
        position: 40,
        limit: jQuery.device.is.phone ? 7 : 7,
        limitDataSource: 2
    };

    return module;
});
