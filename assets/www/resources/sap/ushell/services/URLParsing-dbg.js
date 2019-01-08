// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview URL Parsing shell services
 *
 * URL Parsing serivces for shell compliant hashes
 *
 *
 * [ SO-Action~[Context]]
 * [ ? [A=B(&C=D)+]
 * &/
 *
 * The parsing functions are deliberately restrictive and fragile,
 * only shell compliant hashes are parsed correctly,
 * invalid or completely empty results ( not silently ignored parts) are returned if the hash is not deemed parseable
 */
sap.ui.define([
], function () {
    "use strict";
    /*global jQuery, sap, URI */

    // usage : sap.ushell.Container.getService("URLParsing").parseShellHash etc.

    /**
     * The Unified Shell's internal URL parsing service (platform independent)
     * This method MUST be called by the Unified Shell's container only, others MUST call
     * <code>sap.ushell.Container.getService("URLParsing")</code>.
     * Constructs a new instance of the URL parsing service.
     *
     *
     * Methods in this class allow to break down a shell compliant hash into it's respective parts
     * (SemanticObject,Action,Context, Parameters, appSpecificHash) or (ShellPart,appSpecificHash) respectively
     * or construct a hash from its constituents.
     *
     * All methods deal with the *internal* shellHash format.
     *
     * Most of the parse methods are robust w.r.t. a leading "#".
     *
     * Note: The functions were designed with a "truthy" behaviour for not present values,
     * Thus a client should not rely on the difference between null, "undefined", "" when testing for the
     * result of a parse action.
     *
     * The parsing functions are deliberately restrictive and fragile,
     * only shell compliant hashes are parsed correctly,
     * behaviour for non-compliant hashes is undefined and subject to change,
     * notably we do not aim do "degrade" nicefully or support partial parsing of corrupted urls.
     *
     * @name sap.ushell.services.URLParsing
     *
     * @constructor
     * @class
     * @see sap.ushell.services.Container#getService
     * @since 1.15.0
     * @public
     */
    function URLParsing() {
        /*jslint regexp : true*/
        var reValidShellPart = /^(([A-Za-z0-9_\/]+)-([A-Za-z0-9_\/\-]+)(~([A-Z0-9a-z=+\/]+))?)?([?]([^&]|(&[^\/]))*&?)?$/;

        /**
         * Extract the Shell hash# part from an URL
         * The application specific route part is removed
         * @see getHash for a function which retains the app specific route
         *
         * Shell services shall use this service to extract relevant
         * parts of an URL from an actual URL string (which should be treated as opaque)
         * <p>
         * The URL has to comply with the Fiori-Wave 2 agreed upon format
         *
         * <p>
         * This service shall be used to extract a hash part from an url.
         * The result can be further broken up by parseShellHash
         *
         * examples <p>
         *
         * http://a.b.c?defhij#SemanticObject-Action~Context?PV1=A&PV2=B&/appspecific
         * <br/>
         * returns : "#SemanticObject-Action~Context?PV1=A&PV2=B&/appspecific"
         *
         * Note: the results when passing an illegal (non-compliant) url are undefined and subject to change
         * w.o. notice. Notably further checks may added.
         * The design is deliberately restrictive and non-robust.
         *
         * @param {string} sShellHashString
         *     a valid (Shell) url, e.g. <br/>
         *     <code>http://xx.b.c#Object-name~AFE2==?PV1=PV2&PV4=V5&/display/detail/7?UU=HH</code>
         * @returns {Object}
         *     the parsed result
         * @since 1.16.0
         * @public
         * @alias sap.ushell.services.URLParsing#getShellHash
         */
        this.getShellHash = function (sShellHashString) {
            /*jslint regexp : true*/
            var re = /[^#]*#(([^&]|&[^\/])*)(&\/.*)?/,
                match = re.exec(sShellHashString);
            if (match) {
                return match[1];
            }
            return undefined;
        };


        /**
         * Extract a hash part from an URL, including an app-specific part
         * @param {String} sURL
         *   any value
         * @returns {String}
         *   <code>extracted string</code> if and only if a hash is present, undefined otherwise
         * @since 1.16.0
         * @public
         * @alias sap.ushell.services.URLParsing#getHash
         */
        this.getHash = function (sURL) {
            /*jslint regexp : true*/
            var re = /#(.*)/,
                match = re.exec(sURL);
            if (match) {
                return match[1];
            }
            return undefined;
        };

        /**
         * Check if a URL has an intent based navigation part which can be parsed into
         * a semantic object and action part.
         * Accepts only a relative URL (must contain #) or
         * fully qualified Urls for which
         * origin and filename must correspond to the running launchpad.
         * Given actual url
         * <code>
         * http://www.mycorp.com/sap/fiori/FioriLaunchpad.html?sap-language=DE#SO-action?P1=value1
         * </code>, the following parts
         * <code>http://www.mycorp.com/sap/fiori/FioriLaunchpad.html<code> must match.
         *
         * The actual test is synchronous and *only* tests whether the hash part can be parsed
         * and contains a semantic object and action.
         * It does not test whether the intent or it's parameters is valid for a given user
         *
         * @param {String} sUrl the URL to test
         *  Note, this url must be in internal format.
         * @returns {Boolean}
         *   true if the conditions are fulfilled.
         * @since 1.30.0
         * @public
         * @alias sap.ushell.services.URLParsing#isIntentUrl
         */
        this.isIntentUrl = function (sUrl) {
            /*jslint regexp : true*/
            var reStartWithHash = /^#/,
                oTestUri,
                oLaunchpadUri,
                sTestUriFullResource,
                sLaunchpadUriFullResource,
                sHash,
                oParsedHash;
            if (typeof sUrl !== "string") {
                return false;
            }
            if (!reStartWithHash.test(sUrl)) {
                oTestUri = (new URI(sUrl)).normalize();
                sTestUriFullResource = oTestUri.protocol() + "://" + oTestUri.host() + oTestUri.pathname();
                oLaunchpadUri = (new URI(window.location.href)).normalize();
                sLaunchpadUriFullResource = oLaunchpadUri.protocol() + "://" + oLaunchpadUri.host() + oLaunchpadUri.pathname();
                if (sTestUriFullResource !== sLaunchpadUriFullResource) {
                    return false;
                }
            }
            // sUrl is to be processed by our launchpad
            sHash = this.getHash(sUrl);
            if (!sHash) {
                return false;
            }
            oParsedHash = this.parseShellHash(sHash);
            if (oParsedHash && oParsedHash.semanticObject && oParsedHash.action) {
                return true;
            }
            return false;
        };

        /**
         * parse parameters from a URI query string (starting with ?)
         * into a parameter object
         * @param {String} sParams
         *   Parameter string, e.g. <code>?ABC=1&ABC=1%202DEF=4</code>
         * @returns {Object} oParams
         *   any value { ABC : ["1","1 2"], DEF : ["4"]}
         * @since 1.20.0
         * @public
         * @alias sap.ushell.services.URLParsing#parseParameters
         */
        this.parseParameters = function (sParams) {
            if (!sParams) {
                return {};
            }
            return jQuery.sap.getUriParameters(sParams).mParams || {};
        };

        /**
         * combine members of a javascript object into a
         * parameter string,
         * note that parameters are ordered in an arbitrary manner
         * which is subject to change
         * @param {Object} oParams
         *   any value { ABC : [1,"1 2"], DEF : ["4"]}
         * @returns {String}
         *   <code>ABC=1&ABC=1%202DEF=4</code>
         *   Note that the result is *not* prefixed with a "?",
         *   parameter values are encodeURIComponent encoded.
         * @since 1.20.0
         * @public
         * @alias sap.ushell.services.URLParsing#paramsToString
         */
        this.paramsToString = function (oParams) {
            return this.privparamsToString(oParams, "&", "=");
        };

        /**
         * Internal function
         *
         * @param {Object} oParams
         *    parameter object
         * @param {String} sDelimiter
         *    string to use as parameter delimiter (e.g., "&")
         * @param {String} sAssign
         *    string to use for parameter assignment (e.g., "=")
         *
         * @returns {String}
         *    the result parameters
         *
         * @since 1.34.0
         * @private
         */
        this.privparamsToString = function (oParams, sDelimiter, sAssign) {
            var first,
                a,
                k,
                i,
                lst,
                shellPart = "";
            first = "";
            a = null;
            lst = [];
            for (a in oParams) {
                if (oParams.hasOwnProperty(a)) {
                    lst.push(a);
                }
            }
            lst.sort();
            for (k = 0; k < lst.length; k = k + 1) {
                a = lst[k];
                if (jQuery.isArray(oParams[a])) {
                    for (i = 0; i < oParams[a].length; i = i + 1) {
                        shellPart += first + encodeURIComponent(a) + sAssign + encodeURIComponent(oParams[a][i]);
                        first = sDelimiter;
                    }
                } else {
                    shellPart += first + encodeURIComponent(a) + sAssign + encodeURIComponent(oParams[a]);
                    first = sDelimiter;
                }
            }
            return shellPart;
        };

        /**
         * Decompose a shell hash into the respective parts
         * @param {String} sHash
         *  Hash part of a shell compliant URL
         *  <code>#SO-Action~Context?P1=a&P2=x&/route?RPV=1</code>
         *  the hash part of an URL, <br/> e.g. <code>"#Object-name~AFE2==?PV1=PV2&PV4=V5&/display/detail/7?UU=HH</code>
         *
         *  Note that params always has an Array for each parameter value!
         *
         * @returns {object}
         *   <code>undefined </code> if not a parseable hash <br/>
         *   <code> { semanticObject : string, <br/>
         *            action : string, <br/>
         *            contextRaw : string, <br/>
         *            params :  MapObject<String,Array[String]>, <br/>
         *            appSpecificRoute : string <br/>
         *          }
         *  </code>
         *
         * @since 1.16.0
         * @public
         * @alias sap.ushell.services.URLParsing#parseShellHash
         */
        this.parseShellHash = function (sHash) {
            /*jslint regexp : true*/
            var re = reValidShellPart,
                oSplitHash,
                sSemanticObject,
                sAction,
                sContext,
                sParams,
                match,
                pm;
            if (!sHash) {
                return undefined;
            }
            // split shell-hash and app-specific parts first
            oSplitHash = this.splitHash(sHash);

            match = re.exec(oSplitHash.shellPart);
            if (match) {
                sSemanticObject = match[2];
                sAction = match[3];
                sContext = match[5];
                sParams = match[6];
                pm = this.parseParameters(sParams);
                return { semanticObject : sSemanticObject,
                    action : sAction,
                    contextRaw : sContext,
                    params : pm,
                    appSpecificRoute : oSplitHash.appSpecificRoute };
            }
            if (oSplitHash.appSpecificRoute) {
                return { semanticObject : undefined,
                    action : undefined,
                    contextRaw : undefined,
                    params :  {},
                    appSpecificRoute : oSplitHash.appSpecificRoute };
            }
            return undefined;
        };

        /**
         * Internal function
         * @name privstripLeadingHash
         * @param {string} sHash
         *    Shell hash
         * @returns {string} the string wihtout a leading #
         * @since 1.16.0
         * @private
         */
        this.privstripLeadingHash = function (sHash) {
            if (sHash[0] === '#') {
                return sHash.substring(1);
            }
            return sHash;
        };

        /**
         * split a Unified Shell compliant hash into an Object containing a shell specific part and an app specific parts</br>
         * for non compliant hash strings, the empty object {} is returned.
         * an optional leading # is stripped
         * @param {String} sHash
         *  Hash part of a shell conformant URL
         *  {code}#SO-Action~Context?P1=a&P2=x&/route?RPV=1{code}
         *  the hash part of an URL, e.g. {code}"#Object-name~AFE2==?PV1=PV2&PV4=V5&/display/detail/7?UU=HH{code}
         *
         *  Note that params always has an Array for each parameter value!
         *
         * @returns {object}
         *   <code>{}</code>(empty object) if not a parseable hash
         *   <code>{ shellPart : "Object-name~AFE2==?PV1=PV2&PV4=V5",<br/>
         *            appSpecificRoute : "display/detail/7?UU=HH"<br/>
         *         }</br>
         *    </code> otherwise
         *
         * @since 1.16.0
         * @public
         * @alias sap.ushell.services.URLParsing#splitHash
         */
        this.splitHash = function (sHash) {
            var re = /^(?:#|)([\S\s]*?)(&\/[\S\s]*)?$/,
                aMatch,
                sShellPart,
                sAppSpecificRoute;

            if (sHash === undefined || sHash === null || sHash === "") {
                return {};
            }
            // break down hash into parts
            // "#SO-ABC~CONTXT?ABC=3A&DEF=4B&/detail/1?A=B");
            aMatch = re.exec(sHash);
            sShellPart = aMatch[1];
            if (sShellPart !== "" && !reValidShellPart.test(sShellPart)) {
                return {};
            }
            sAppSpecificRoute = aMatch[2];
            if (sShellPart || sAppSpecificRoute) {
                return {  shellPart : sShellPart,
                    appSpecificRoute : sAppSpecificRoute }; // ,"&/detail/1?A=B");
            }
            return {};
        };

        function appendIf(sUrl, app) {
            if (app) {
                return sUrl + app;
            }
            return sUrl;
        }

        /**
         * compose a shell Hash from it's respective parts
         * Note that it also may append an app specific route !
         * @returns {string}
         *  the hash part of an URL, e.g. <code>"Object-name~AFE2==?PV1=PV2&PV4=V5&/display/detail/7?UU=HH</code>
         *  returns "" for an undefined object
         *
         * The action must be a valid action, it may not contain "?" or directly a parameter string
         * @param {object} oShellHash
         *   <code>undefined </code> if not a parseable hash
         *   <code> { target : { semanticObject : string,<br/>
         *                       action : string,<br/>
         *                       contextRaw : string<br/>
         *                     },<br/>
         *            params :  MapObject<String,Array[String]>,<br/>
         *            appStateKey : string <br/>
         *            appSpecificRoute : string<br/>
         *          }<br/>
         *    </code>
         *    xor
         *   <code> { target : { shellHash }<br/>
         *          }
         *    </code>
         *
         * Note: in general it is preferred to add an appStateKey directly to the params object
         *
         * @since 1.16.0
         * @public
         * @alias sap.ushell.services.URLParsing#constructShellHash
         */
        this.constructShellHash = function (oShellHash) {
            var shellPart,
                paramsCopy,
                result,
                i = null,
                k,
                lst = [],
                first = "?",
                a = null;
            if (!oShellHash) {
                return "";
            }
            // align lack of target
            if (!oShellHash.target) {
                oShellHash.target = {};
                oShellHash.target.semanticObject = oShellHash.semanticObject;
                oShellHash.target.action = oShellHash.action;
                oShellHash.target.contextRaw = oShellHash.contextRaw;
            }
            if (oShellHash.target.shellHash || oShellHash.target.shellHash === "") {
                result = this.privstripLeadingHash(oShellHash.target.shellHash);
                return appendIf(result, oShellHash.appSpecificRoute);
            }
            // reconstruct shell part
            if (oShellHash.target.semanticObject && oShellHash.target.action) {
                shellPart = oShellHash.target.semanticObject + "-" + oShellHash.target.action.replace(/[?].*/,"");
            } else {
                return appendIf("", oShellHash.appSpecificRoute);
            }

            if (oShellHash.target.contextRaw) {
                shellPart += "~" + oShellHash.target.contextRaw;
            }
            first = "?";
            a = null;
            lst = [];
            for (a in oShellHash.params) {
                if (oShellHash.params.hasOwnProperty(a)) {
                    lst.push(a);
                }
            }
            paramsCopy = (oShellHash.params && JSON.parse(JSON.stringify(oShellHash.params))) || {};
            if (oShellHash.appStateKey) {
                lst.push("sap-xapp-state");
                paramsCopy["sap-xapp-state"] = oShellHash.appStateKey;
            }
            lst.sort();
            for (k = 0; k < lst.length; k = k + 1) {
                a = lst[k];
                if (jQuery.isArray(paramsCopy[a])) {
                    if (paramsCopy[a].length > 1) {
                        jQuery.sap.log.error("Array startup parameters violate the designed intent of the Unified Shell Intent, use only single-valued parameters!");
                    }
                    for (i = 0; i < paramsCopy[a].length; i = i + 1) {
                        shellPart += first + encodeURIComponent(a) + "=" + encodeURIComponent(paramsCopy[a][i]);
                        first = "&";
                    }
                } else {
                    shellPart += first + encodeURIComponent(a) + "=" + encodeURIComponent(paramsCopy[a]);
                    first = "&";
                }
            }
            return appendIf(shellPart, oShellHash.appSpecificRoute);
        };

        /**
         * Note: deprecated, please use <code>sap.ui.model.odata.ODataUtils.setOrigin(sServiceUrl, { alias : sSystem });</code>
         * Makes the given server-relative SAP OData service URL point to the system given
         * explicitly as parameter <code>vComponentOrSystem</code>. If this parameter is not provided,
         * it makes the server-relative URL point to the system of the current application.
         * <em>Server-relative URL</em> means a URL starting with exactly one &quot;/&quot; (also known as
         * absolute-path URL). The <em>system of the current application</em> is taken from
         * the parameter &quot;sap-system&quot; of the last navigation target resolution result.
         * <p>
         * If either a multiple-origin parameter <code>;mo/</code> or an origin parameter with qualified system
         * (<code>;o=sid(SYS.123)</code> or <code>o=SYSALIAS</code>) is already present,
         * the <code>sServiceUrl</code> is returned unchanged.
         * <p>
         * The framework invokes this function for SAPUI5 applications that have been built using declarative model
         * instantiation with the application descriptor (data source) mechanism or using an sap.ca framework. For
         * these applications, you do not need to invoke this function explicitly in the application code.
         * If the application does not use any of these mechanisms, but explicitly constructs additional OData models or
         * performs OData requests, the application code shall invoke this function. It shall
         * pass its root component instance as <code>vComponentOrSystem</code> - the function will then determine the system
         * from the navigation start-up parameter &quot;sap-system&quot;
         * (<code>getComponentData().startupParameters[&quot;sap-system&quot;][0]).
         * Applications may call this API with parameter <code>vComponentOrSystem</code> and a non-empty string value
         * if application-specific logic is used to determine the target system for service calls.
         * <p>
         * With service URLs converted using this API, administrators can redirect service
         * calls to servers other than the default SAP Gateway and back-end server
         * either via reverse proxy (e.g. SAP Web Dispatcher) configuration or using the system
         * alias functionality of the SAP Gateway server.
         * <p>
         * The system is added to the last URL segment of the service URL with the segment parameter
         * <code>;o=</code>. You can also make this function put the system to a different
         * URL path segment of the service URL by specifying the empty segment parameter
         * <code>;o=</code>, e.g. <code>/sap/opu/odata/MyService;o=/MyEntities/$count?p1=v1</code>.
         * If both <code>vComponentOrSystem</code> is empty and the current application has
         * no system, no system is added and the empty segment parameter <code>;o</code> is removed.
         * <br/>
         * <b>Example 1:</b> <code>/sap/opu/odata/MyService/?p1=v1</code> is converted to
         * <code>/sap/opu/odata/MyService;o=SYS/?p1=v1</code> if the target system
         * is &quot;SYS&quot;.
         * However it remains unchanged if both the current application's system <em>and</em>
         * the parameter <code>vComponentOrSystem</code> are empty.<br/>
         * <b>Example 2:</b> <code>/sap/opu/odata/MyService;o=/MyEntities/$count?p1=v1</code> is
         * converted to
         * <code>/sap/opu/odata/MyService;o=sid(SYS.123)/MyEntities/$count?p1=v1</code> if
         * parameter <code>vComponentOrSystem</code> is set to &quot;sid(SYS.123)&quot;</code>.
         * <p>
         * The URL is in no way normalized.
         *
         * @param {string} sServiceUrl
         *   a server-relative URL without system alias information
         * @param {string|sap.ui.core.Component} [vComponentOrSystem]
         *   the root component of the FLP application (
         *   <code>getComponentData().startupParameters[&quot;sap-system&quot;][0]</code> is used as system alias if present)
         *   or a string valued system specification like &quot;SYS&quot; or &quot;sid(SYS.123)&quot;
         *   if undefined or falsy the system of the current application is used
         * @returns {string}
         *   the service URL pointing to the system specified in parameter <code>vComponentOrSystem</code> or
         *   to the system of the current application
         * @public
         * @alias sap.ushell.services.URLParsing#addSystemToServiceUrl
         * @deprecated please use <code>sap.ui.model.odata.ODataUtils.setOrigin(sServiceUrl, { alias : sSystem });</code>
         * The system alias can be extracted from the Component via <code>getComponentData().startupParameters["sap-system"][0]</code>
         * @since 1.19.1 (passing an SAPUI5 component instance as second parameter is supported since version 1.32.0)
         * @throws Error if the URL is not server-relative (e.g. <code>./something</code>,
         *   <code>http://foo.bar/something</code>, ...)
         */
        this.addSystemToServiceUrl = function (sServiceUrl, vComponentOrSystem) {
            /*jslint regexp:true */
            var oResolution,
                oComponentData,
                sSystem = vComponentOrSystem;
            if (!sServiceUrl || sServiceUrl.indexOf('/') !== 0 || sServiceUrl.indexOf('//') === 0) {
                throw new sap.ushell.utils.Error("Invalid URL: " + sServiceUrl,
                    "sap.ushell.services.URLParsing");
            }
            if (vComponentOrSystem instanceof sap.ui.core.Component) {
                oComponentData = (typeof vComponentOrSystem.getComponentData === "function") && vComponentOrSystem.getComponentData();
                sSystem = oComponentData && oComponentData.startupParameters && oComponentData.startupParameters["sap-system"]
                            && oComponentData.startupParameters["sap-system"][0];
            }

            oResolution =
                sap.ushell.Container.getService("NavTargetResolution").getCurrentResolution();
            // note: if component is specified but lacks sap-system, we do not do a fallback!
            if (!sSystem && !vComponentOrSystem && oResolution && oResolution.url) {
                sSystem = jQuery.sap.getUriParameters(oResolution.url).get("sap-system");
            }
            if (/^[^?]*(;mo([\/;?]|$))/.test(sServiceUrl) ) {
                // do nothing, mo present
                sServiceUrl = sServiceUrl;
            } else if (/^[^?]*(;o=([\/;?]|$))/.test(sServiceUrl)) {
                // URL with ";o=" *not* followed by system: insert system
                sServiceUrl = sServiceUrl.replace(/;o=([\/;?]|$)/,
                    (sSystem ? ";o=" + sSystem : "") + "$1");
            } else if (!/^[^?]*;o=/.test(sServiceUrl) && sSystem) {
                // URL without ";o=": append system
                sServiceUrl = sServiceUrl.replace(/(\/[^?]*?)(\/$|$|(\/?\?.*))/,
                    "$1;o=" + sSystem + "$2");
            }

            sap.ushell.Container.addRemoteSystemForServiceUrl(sServiceUrl);
            return sServiceUrl;
        };
    };

    URLParsing.hasNoAdapter = true;
    return URLParsing;

}, true /* bExport */);
