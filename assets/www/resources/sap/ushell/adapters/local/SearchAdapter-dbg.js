// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The Search adapter for the demo platform.
 *
 * @version 1.52.4
 */
sap.ui.define(['sap/ushell/renderers/fiori2/search/esh/api/release/sina'],
	function(sina) {
	"use strict";

    /*global jQuery, sap, window */
    /**
     *
     * @param oSystem
     * @returns {sap.ushell.adapters.abap.SearchAdapter}
     */
    var SearchAdapter = function (oSystem, sParameter, oAdapterConfiguration) {

        this.isSearchAvailable = function () {
            var oDeferred = jQuery.Deferred();
            oDeferred.resolve(true);
            return oDeferred.promise();
        };

        this.getSina = function(){
            return window.sina.getSina({systemType: "ABAP", startWithSearch : "false" , noSapClientFromUrl: true});
        };

    };


	return SearchAdapter;

}, /* bExport= */ true);
