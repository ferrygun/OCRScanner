// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The SupportTicket adapter for the local platform.
 *
 * @version 1.52.4
 */
sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap */
    var SupportTicketAdapter = function (oSystem, sParameter, oAdapterConfiguration) {

        this.createTicket = function (oSupportObject) {
            var oDeferred = new jQuery.Deferred(),
                sTicketId = "1234567";

            oDeferred.resolve(sTicketId);
            return oDeferred.promise();
        };

    };


	return SupportTicketAdapter;

}, /* bExport= */ true);
