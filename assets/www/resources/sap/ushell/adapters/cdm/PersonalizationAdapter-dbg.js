// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

/* global sap */

/**
 * @fileOverview The Personalization adapter for the CDM platform.
 *
 *
 * The CDM personalization adapter can be used to store data in the RA@ABAP platform.
 * @version 1.52.4
 */
sap.ui.define([
    "sap/ushell/adapters/cdm/_Personalization/internals",
    "sap/ushell/utils/XHttpClient"
], function (oAdapterInternals, fnHttpClient) {
    "use strict";

    return oAdapterInternals.PersonalizationAdapter.bind(null, fnHttpClient, null);
}, /* bExport = */ true);