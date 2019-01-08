// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

/* global sap, Promise */
/* eslint indent: ["error", 4, { "SwitchCase": 1 }] */

sap.ui.define([], function () {
    "use strict";

    var oCachedCsrfToken = {token: null},
        csrfTokenIsCachedBound = csrfTokenIsCached.bind(null, oCachedCsrfToken),
        csrfTokenReadFromCacheBound = csrfTokenReadFromCache.bind(null, oCachedCsrfToken),
        csrfTokenWriteToCacheBound = csrfTokenWriteToCache.bind(null, oCachedCsrfToken),
        csrfTokenFetchBound = csrfTokenFetch.bind(null, executeRequest, csrfTokenExtractFromResponseHeader);

    return Object.create(null, {
        executeRequest: { value: executeRequest },
        executeRequestWithCsrfToken: { value: executeRequestWithCsrfToken },
        isSafeHttpMethod: { value: isSafeHttpMethod },
        isValidHttpMethod: { value: isValidHttpMethod },
        summariseResponse: { value: summariseResponse },
        processResponse: { value: processResponse },
        getHttpRequestWrapper: { value: getHttpRequestWrapper },
        containsCSRFTokenHeaderEntry: { value: containsCSRFTokenHeaderEntry },
        csrfTokenReadFromCache: { value: csrfTokenReadFromCacheBound },
        csrfTokenWriteToCache: { value: csrfTokenWriteToCacheBound },
        csrfTokenIsCached: { value: csrfTokenIsCachedBound },
        _csrfTokenFetch: { value: csrfTokenFetch },
        csrfTokenFetch: { value: csrfTokenFetchBound },
        _csrfTokenGet: { value: csrfTokenGet },
        csrfTokenGet: { value: csrfTokenGet.bind( null,
            csrfTokenIsCachedBound,
            csrfTokenReadFromCacheBound,
            csrfTokenWriteToCacheBound,
            csrfTokenFetchBound
        ) },
        csrfTokenAddToRequestHeader: { value: csrfTokenAddToRequestHeader },
        csrfTokenExtractFromResponseHeader: { value: csrfTokenExtractFromResponseHeader }
    });

    function executeRequestWithCsrfToken(
        // injected dependencies
        fnExecuteRequest,
        fnCsrfTokenWriteToCache,
        fnCsrfTokenGet,
        fnCsrfTokenFetch,
        fnCsrfTokenAddToRequestHeader,
        fnCsrfTokenExtractFromResponseHeader,
        fnIsSafeHttpMethod,
        // call params
        sRequestMethod,
        sUrl,
        oConfig
    ) {
        var oExtendedConfig;

        if (!/String/.test(Object.prototype.toString.call(sRequestMethod)) ||
            !/String/.test(Object.prototype.toString.call(sUrl)) ||
            !/Function/.test(Object.prototype.toString.call(fnExecuteRequest)) ||
            !/Function/.test(Object.prototype.toString.call(fnCsrfTokenWriteToCache)) ||
            !/Function/.test(Object.prototype.toString.call(fnCsrfTokenFetch)) ||
            !/Function/.test(Object.prototype.toString.call(fnCsrfTokenGet)) ||
            !/Function/.test(Object.prototype.toString.call(fnCsrfTokenAddToRequestHeader)) ||
            !/Function/.test(Object.prototype.toString.call(fnCsrfTokenExtractFromResponseHeader)) ||
            !/Function/.test(Object.prototype.toString.call(fnIsSafeHttpMethod))
        ) {
            throw new Error("IllegalArgumentError: one or more of the arguments is invalid");
        }
        if (!oConfig) {
            oConfig = {};
        }
        return new Promise(function (resolve, reject) {
            function handleFinalError(vError) {
                // final failure
                jQuery.sap.log.error(vError, null, "sap.ushell.util.HttpClient");
                reject(vError);
            }

            if (!fnIsSafeHttpMethod(sRequestMethod)) {
                // 1. Get the CSRF token - either from cache or fetch it
                // 1.1. Success
                //      -> execute request using the token
                // 1.1.1. Success -> done
                // 1.1.2. Error 403 + CSRF token requested
                //        -> fetch token
                // 1.1.2.1. Success
                //          -> execute request using the new token
                // 1.1.2.1.1. Success -> done
                // 1.1.2.1.2. Error -> final failure
                // 1.1.3. Other error -> final failure
                // 1.2. Error -> final failure
                fnCsrfTokenGet(sUrl)
                    .then(function (sCsrfToken) {
                        // Use the token for the first request
                        oExtendedConfig = fnCsrfTokenAddToRequestHeader(sCsrfToken, oConfig);
                        return fnExecuteRequest(sRequestMethod, sUrl, oExtendedConfig);
                    })
                    .then(function (oResponse) {
                        resolve(oResponse);
                    })
                    .catch( function(vError) {
                        if (vError && (vError.status === 403) &&
                                (fnCsrfTokenExtractFromResponseHeader(vError).toLowerCase() === "required")) {
                            // Token was not valid
                            // We fetch it and keep the ball in the game
                            fnCsrfTokenFetch(sUrl)
                                .then(function (sCsrfToken){
                                    // Use the fetched token and try the request execution a second time
                                    oExtendedConfig = fnCsrfTokenAddToRequestHeader(sCsrfToken, oConfig);
                                    return fnExecuteRequest(sRequestMethod, sUrl, oExtendedConfig);
                                })
                                .then(function (oResponse) {
                                    resolve(oResponse);
                                })
                                .catch(handleFinalError);
                        } else {
                            handleFinalError(vError);
                        }
                    });
            } else {
                // no CSRF token is required but we fetch it
                oExtendedConfig = fnCsrfTokenAddToRequestHeader("fetch", oConfig);
                fnExecuteRequest(sRequestMethod, sUrl, oExtendedConfig)
                    .then(function(oResponse) {
                        // cache CSRF token if there is one
                        var sCsrfToken = fnCsrfTokenExtractFromResponseHeader(oResponse);
                        if (sCsrfToken) {
                            fnCsrfTokenWriteToCache(sCsrfToken);
                        }
                        resolve(oResponse);
                    })
                    .catch(handleFinalError);
            }
        });
    }

    // A simple request function.
    function executeRequest(sRequestMethod, sUrl, oConfig) {
        var aHeaders, oRequestData;
        var oXHR = new XMLHttpRequest();

        if (
            !/String/.test(Object.prototype.toString.call(sRequestMethod)) ||
            !/String/.test(Object.prototype.toString.call(sUrl))
        ) {
            throw new Error("IllegalArgumentException: one or more of the arguments is invalid");
        }

        if (/[a-z]/.test(sRequestMethod)) {
            sRequestMethod = sRequestMethod.toUpperCase();
        }

        if (oConfig) {
            aHeaders = !oConfig.headers
                ? []
                : Object
                    .keys(oConfig.headers)
                    .map(function (sHeader) {
                        return {
                            name: sHeader,
                            value: this[sHeader]
                        };
                    }, oConfig.headers);

            oRequestData = oConfig.data;
        } else {
            aHeaders = [];
        }

        return new Promise(function (fnResolve, fnReject) {
            [
                "load",
                "error"
            ].forEach(function (sEvent) {
                oXHR.addEventListener(
                    sEvent,
                    processResponse.bind(null, oXHR, fnResolve, fnReject)
                );
            });

            oXHR.open(sRequestMethod, sUrl);

            aHeaders.forEach(function (oHeader) {
                oXHR.setRequestHeader(oHeader.name, oHeader.value);
            });

            oXHR.send(JSON.stringify(oRequestData));
        });
    }

    function getHttpRequestWrapper(sMethodName, fnHttpRequest, sBaseUrl, oCommonConfig) {
        if (
            !/String/.test(Object.prototype.toString.call(sMethodName)) ||
            !/Function/.test(Object.prototype.toString.call(fnHttpRequest)) ||
            !/String/.test(Object.prototype.toString.call(sBaseUrl))
        ) {
            throw new Error("IllegalArgumentError: one or more of the arguments is invalid");
        }

        return function (sPath, oSpecialConfig) {
            return fnHttpRequest(
                sMethodName,
                sBaseUrl.replace(/\/$/, "") + "/" + sPath.replace(/^\//, ""),
                jQuery.extend(
                    {},
                    oCommonConfig,
                    oSpecialConfig
                )
            );
        };
    }

    function processResponse(oXHR, fnOK, fnError) {
        var oResponse;

        if (
            !oXHR ||
            !/Number/.test(Object.prototype.toString.call(oXHR.status)) ||
            !/Function/.test(Object.prototype.toString.call(oXHR.getAllResponseHeaders))
        ) {
            throw new Error("IllegalArgumentError: invalid XMLHttpRequest instance");
        }

        oResponse = summariseResponse(oXHR);

        if (oXHR.status < 200 || oXHR.status > 299) {
            fnError(oResponse);
        } else {
            fnOK(oResponse);
        }
    }

    function summariseResponse(oXHR) {
        return {
            status: oXHR.status,
            statusText: oXHR.statusText,
            responseText: oXHR.responseText,
            responseHeaders: oXHR.getAllResponseHeaders()
                .split(/\r\n/g)
                .filter(function (sItem) {
                    return sItem.length > 0;
                })
                .map(function (sHeader) {
                    var aParts = sHeader.split(":");
                    return {
                        name: aParts[0].trim(),
                        value: aParts[1].trim()
                    };
                })
        };
    }

    function containsCSRFTokenHeaderEntry(oHeaders) {
        var sHeaderValue = oHeaders["x-csrf-token"] || oHeaders["X-CSRF-TOKEN"];

        return !!sHeaderValue && /String/.test(Object.prototype.toString.call(sHeaderValue));
    }

    function isSafeHttpMethod(sHttpMethod) {
        switch (sHttpMethod) {
            case "HEAD":
            case "GET":
            case "OPTIONS":
                return true;
            case "POST":
            case "PUT":
            case "DELETE":
                return false;
            default:
                throw new Error("IllegalArgumentError: '" + sHttpMethod + "' is not a supported request method");
        }
    }

    function isValidHttpMethod(sHttpMethod) {
        switch (sHttpMethod) {
            case "HEAD":
            case "GET":
            case "OPTIONS":
            case "POST":
            case "PUT":
            case "DELETE":
                return true;
            default:
                throw new Error("IllegalArgumentError: '" + sHttpMethod + "' is not a supported request method");
        }
    }

    function csrfTokenReadFromCache(
        oCsrfToken // injected dependency
    ) {
        return oCsrfToken.token;
    }

    function csrfTokenWriteToCache(
        oCsrfToken, // injected dependency
        sNewCsrfToken
    ) {
        oCsrfToken.token = sNewCsrfToken;
    }

    function csrfTokenIsCached(
        oCsrfToken // injected dependency
    ) {
        return oCsrfToken.token ? true: false;
    }

    function csrfTokenGet(
        // injected dependencies
        fnCsrfTokenIsCached,
        fnCsrfTokenReadFromCache,
        fnCsrfTokenWriteToCache,
        fnCsrfTokenFetch,
        // parameter
        sUrl
    ) {
        return new Promise(function (resolve, reject) {
            if (fnCsrfTokenIsCached()) {
                resolve(fnCsrfTokenReadFromCache());
            } else {
                fnCsrfTokenFetch(sUrl)
                    .then(function(sCsrfToken) {
                        fnCsrfTokenWriteToCache(sCsrfToken);
                        resolve(sCsrfToken);
                    })
                    .catch(function(vError) {
                        reject(vError);
                    })
            }
        });
    }

    function csrfTokenFetch(
        // injected dependencies
        fnExecuteRequest,
        fnCsrfTokenExtractFromResponseHeader,
        // parameter
        sUrl
    ) {
        return fnExecuteRequest("OPTIONS", sUrl, {
            headers: { "x-csrf-token": "fetch" }
        })
        .then(function (oResponse) {
            return fnCsrfTokenExtractFromResponseHeader(oResponse);
        });
    }

    // creates a copy of oConfig and extends it
    function csrfTokenAddToRequestHeader(sHeaderValue, oConfig) {
        var oExtendedConfig,
            oObjectWithCsrfHeader = { "x-csrf-token": sHeaderValue };

        if (!/String/.test(Object.prototype.toString.call(sHeaderValue)) ||
            !/object Object/.test(Object.prototype.toString.call(oConfig))) {
            throw new Error("IllegalArgumentError: one or more of the arguments is invalid");
        }
        oExtendedConfig = jQuery.extend(true, {}, oConfig);
        if (!oExtendedConfig.headers) {
            oExtendedConfig.headers = oObjectWithCsrfHeader;
        } else {
            jQuery.extend(oExtendedConfig.headers, oObjectWithCsrfHeader);
        }
        return oExtendedConfig;
    }

    function csrfTokenExtractFromResponseHeader(oResponse) {
        var oCsrfToken;

        if (!/Array/.test(Object.prototype.toString.call(oResponse.responseHeaders))) {
            return undefined;
        }
        oCsrfToken = oResponse.responseHeaders
            .filter(function (oHeader) {
                return oHeader.name === "x-csrf-token";
            })[0];
        return oCsrfToken && oCsrfToken.value ? oCsrfToken.value : undefined;
    }
});