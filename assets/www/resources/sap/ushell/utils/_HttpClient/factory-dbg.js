// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

/* global sap */

sap.ui.define([], function () {
    "use strict";

    return function HttpClient(
        fnGetHttpRequestWrapper,
        fnRequest,
        sBaseUrl,
        oCommonConfig
    ) {
        if (!/String/.test(Object.prototype.toString.call(sBaseUrl))) {
            throw "IllegalArgumentError: `sBaseUrl` should be a string";
        }

        return Object.create(null, {
            post: {
                value: fnGetHttpRequestWrapper(
                    "POST",
                    fnRequest,
                    sBaseUrl,
                    oCommonConfig
                )
            },
            get: {
                value: fnGetHttpRequestWrapper(
                    "GET",
                    fnRequest,
                    sBaseUrl,
                    oCommonConfig
                )
            },
            put: {
                value: fnGetHttpRequestWrapper(
                    "PUT",
                    fnRequest,
                    sBaseUrl,
                    oCommonConfig
                )
            },
            delete: {
                value: fnGetHttpRequestWrapper(
                    "DELETE",
                    fnRequest,
                    sBaseUrl,
                    oCommonConfig
                )
            },
            options: {
                value: fnGetHttpRequestWrapper(
                    "OPTIONS",
                    fnRequest,
                    sBaseUrl,
                    oCommonConfig
                )
            }
        });
    };
});