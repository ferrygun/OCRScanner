// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

/* global sap */

/**
 * @fileOverview Constructor of a small HTTP client based on `XmlHttpRequest`.
 *
 * It supports CSRF protection handling.
 *
 * @version 1.52.4
 * @private
 */
sap.ui.define([
    "sap/ushell/utils/_HttpClient/internals",
    "sap/ushell/utils/_HttpClient/factory"
], function (oInternals, fnFactory) {
    "use strict";

    return fnFactory.bind(
        null,
        oInternals.getHttpRequestWrapper,
        oInternals.executeRequestWithCsrfToken.bind(
            null,
            oInternals.executeRequest,
            oInternals.csrfTokenWriteToCache,
            oInternals.csrfTokenGet,
            oInternals.csrfTokenFetch,
            oInternals.csrfTokenAddToRequestHeader,
            oInternals.csrfTokenExtractFromResponseHeader,
            oInternals.isSafeHttpMethod
        )
    );
}, /* bExport = */ true);