// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview Cross Application Navigation
 *
 *   This file exposes an API to perform (invoke) Cross Application Navigation
 *   for applications
 *
 *   It exposes interfaces to perform a hash change and/or trigger an external navigation
 *
 * @version 1.52.4
 */


/*global jQuery, sap, window */

sap.ui.define([
    'sap/ushell/services/Personalization',
    'sap/ushell/services/AppConfiguration',
    'sap/ushell/services/_CrossApplicationNavigation/utils',
    'jquery.sap.storage'
], function (Personalization, oAppConfiguration, oUtils, storage) {
    "use strict";
    /*global jQuery, sap, location, setTimeout */

    /**
     * The Unified Shell's CrossApplicationNavigation service, which allows to
     *        navigate to external targets or create links to external targets
     *
     * This method MUST be called by the Unified Shell's container only, others MUST call
     * <code>sap.ushell.Container.getService("CrossApplicationNavigation")</code>.
     * Constructs a new instance of the CrossApplicationNavigation service.
     *
     *
     * CrossApplicationNavigation currently provides platform independent functionality.
     *
     * This interface is for usage by applications or shell renderers/containers.
     *
     * Usage:
     *
     * example: see demoapps/AppNavSample/MainXML.controller.js
     *
     * <code>
     *   var xnavservice =  sap.ushell && sap.ushell.Container && sap.ushell.Container.getService;<br/>
     *      && sap.ushell.Container.getService("CrossApplicationNavigation");<br/>
     *   var href = ( xnavservice && xnavservice.hrefForExternal({<br/>
     *          target : { semanticObject : "Product", action : "display" },<br/>
     *          params : { "ProductID" : "102343333" }<br/>
     *          })) || "";<br/>
     * </code>
     *
     *
     * Parameter names and values are case sensitive.
     *
     * Note that the usage of multi-valued parameters (specifying an array with more than one member as parameter value, e.g.
     * <code>  params : { A : ["a1", "a2"] } </code> )
     * is possible with this API but <b>strongly discouraged</b>. Especially the navigation target matching performed at the back-end
     * is not supported for multi-value parameters. Furthermore, it is not guaranteed that additional parameter values specified in the
     * back-end configuration are merged with parameter values passed in this method.
     *
     * Note that the application parameter length (including SemanticObject/Action) shall not exceed 512 bytes when serialized as UTF-8
     *
     * Note that when receiving the values as startup parameters (as part of the component data object) single values
     * are represented as an array of size 1. Above example is returned as
     * <code> deepEqual(getComponentData().startupParameters ,  { "ProductID" : [ "102343333" ] } ) </code>
     *
     * Make sure not to store security critical data within an URL
     * URLs may appear in a server log, be persisted inside and outside the system.
     *
     * Note: When constructing large URLs, the URLs may be shortened and persisted on a database server
     * for prolonged time, the actual data is persisted under a key accessible to any User (guessing the key).
     *
     * The same restrictions apply for the Application state
     *
     * @name sap.ushell.services.CrossApplicationNavigation
     *
     * @constructor
     * @class
     * @see sap.ushell.services.Container#getService
     * @since 1.15.0
     * @public
     */
    function CrossApplicationNavigation (oContainerInterface, sParameters, oServiceConf) {
        var oAppStateService, oServiceConfiguration;
        if (oServiceConf && oServiceConf.config) {
            oServiceConfiguration = oServiceConf.config;
        }
        /**
         * Adds the system of the current application specified as <code>sap-system</code>
         * parameter in its URL to the parameter object <code>oTarget</code> used in the
         * methods {@link #hrefForExternal()} and {@link #toExternal()}.
         * The system is only added if the current application specifies it and
         * <code>oTarget</code> does not already contain this parameter.
         *
         * @param {object|string} vTarget
         *    The navigation target object or string, for example:
         *
         *  <code>
         *  {
         *      target: {
         *          semanticObject: "AnObject",
         *          action: "action"
         *      },
         *      params: { A: "B" }
         *  }
         *  </code>
         *
         *  or
         *
         *  <code>
         *  {
         *      target: {
         *          semanticObject: "AnObject",
         *          action: "action"
         *      },
         *      params: {
         *          A: ["B"],
         *          c: "e"
         *      }
         *  }
         *  </code>
         *
         *  or
         *
         *  <code>
         *  {
         *      target: {
         *          shellHash: "SO-36&jumper=postman"
         *      }
         *  }
         *  </code>
         *
         *  or
         *
         *  <code>
         *  "#SO-36&jumper=postman"
         *  </code>
         *
         * <b>Important</b> The target expressed in this parameter should not
         * contain an inner-app route.
         *
         * @param {object} [oComponent]
         *  the root component of the application
         *
         * @returns {string|object}
         *  the vTarget with the sap-system parameter appended (unless already
         *  present).
         * @private
         */
        function getTargetWithCurrentSystem(vTarget, oComponent) {
            var oResolution,
                sSeparator,
                sSystem,
                oClonedTarget,
                sShellHash,
                oComponentStartupParams;

            if (typeof vTarget !== "string" && !jQuery.isPlainObject(vTarget) && vTarget !== undefined) {
                jQuery.sap.log.error("Unexpected input type", null, "sap.ushell.services.CrossApplicationNavigation");
                return undefined;
            }

            if (vTarget === undefined) {
                return undefined;
            }

            var sNextNavMode;
            if (oComponent) {
                if (typeof oComponent.getComponentData !== "function"    ||
                    !jQuery.isPlainObject(oComponent.getComponentData()) ||
                    !oComponent.getComponentData().startupParameters     ||
                    !jQuery.isPlainObject(oComponent.getComponentData().startupParameters)) {

                    jQuery.sap.log.error(
                        "Cannot call getComponentData on component",
                        "the component should be an application root component",
                        "sap.ushell.services.CrossApplicationNavigation"
                    );
                } else {
                    oComponentStartupParams = oComponent.getComponentData().startupParameters; // assume always present on root component
                    if (oComponentStartupParams.hasOwnProperty("sap-system")) {
                        sSystem = oComponentStartupParams["sap-system"][0];
                    }
                    if (oComponentStartupParams.hasOwnProperty("sap-ushell-next-navmode")) {
                        sNextNavMode = oComponentStartupParams["sap-ushell-next-navmode"][0];
                    }
                }
            } else {
                oResolution = oAppConfiguration.getCurrentApplication();
                if (oResolution && oResolution["sap-system"]) {
                    sSystem = oResolution["sap-system"];
                } else if (oResolution && oResolution.url) {
                    sSystem = jQuery.sap.getUriParameters(oResolution.url).get("sap-system");
                }
                if (oResolution && oResolution["sap-ushell-next-navmode"]) {
                    sNextNavMode = oResolution["sap-ushell-next-navmode"];
                } else if (oResolution && oResolution.url) {
                    sNextNavMode = jQuery.sap.getUriParameters(oResolution.url).get("sap-ushell-next-navmode");
                }
            }
            if (jQuery.isPlainObject(vTarget)) {
                // needs deep copy
                oClonedTarget = jQuery.extend(true, {}, vTarget);
                if (!sSystem && !sNextNavMode) {
                    return oClonedTarget;
                }
                if (oClonedTarget.target && oClonedTarget.target.shellHash) {
                    if (typeof oClonedTarget.target.shellHash === "string") {
                        // process shell hash as a string
                        oClonedTarget.target.shellHash = getTargetWithCurrentSystem(
                            oClonedTarget.target.shellHash, oComponent);
                    }
                    return oClonedTarget;
                }

                oClonedTarget.params = oClonedTarget.params || {};

                if (sSystem && !Object.prototype.hasOwnProperty.call(oClonedTarget.params, "sap-system")) {
                    oClonedTarget.params["sap-system"] = sSystem;
                }
                if (sNextNavMode && !Object.prototype.hasOwnProperty.call(oClonedTarget.params, "sap-ushell-navmode")) {
                    oClonedTarget.params["sap-ushell-navmode"] = [ sNextNavMode ];
                }

                return oClonedTarget;
            } else {
                sShellHash = vTarget;

                if (!(sSystem || sNextNavMode)) {
                    return sShellHash;
                }

                if (sSystem && !/[?&]sap-system=/.test(sShellHash)) {
                    sSeparator = (sShellHash.indexOf("?") > -1) ? "&" : "?";
                    sShellHash += sSeparator + "sap-system=" + sSystem;
                }
                if (sNextNavMode && !/[?&]sap-ushell-navmode=/.test(sShellHash)) {
                    sSeparator = (sShellHash.indexOf("?") > -1) ? "&" : "?";
                    sShellHash += sSeparator + "sap-ushell-navmode=" + sNextNavMode;
                }
                return sShellHash;
            }
        }

        /**
         * Adds the system of the current application specified as <code>sap-ushell-test-enc</code>
         * parameter in its URL to the parameter object <code>oTarget</code> used in the
         * methods {@link #hrefForExternal()} and {@link #toExternal()}.
         * The parameter is always added. It will be overwritten or duplicated if present.
         * <code>oTarget</code> does not already contain this parameter.
         *
         * @param {object|string} vTarget
         *    The navigation target object or string, for example:
         *
         *  <code>
         *  {
         *      target: {
         *          semanticObject: "AnObject",
         *          action: "action"
         *      },
         *      params: { A: "B" }
         *  }
         *  </code>
         *
         *  or
         *
         *  <code>
         *  {
         *      target: {
         *          semanticObject: "AnObject",
         *          action: "action"
         *      },
         *      params: {
         *          A: ["B"],
         *          c: "e"
         *      }
         *  }
         *  </code>
         *
         *  or
         *
         *  <code>
         *  {
         *      target: {
         *          shellHash: "SO-36&jumper=postman"
         *      }
         *  }
         *  </code>
         *
         *  or
         *
         *  <code>
         *  "#SO-36&jumper=postman"
         *  </code>
         *
         * @returns {string|object}
         *  the vTarget with the sap-system parameter appended,
         *  e.g.
         *  <code>
         *  {
         *      target: {
         *          semanticObject: "AnObject",
         *          action: "action"
         *      },
         *      params: {
         *          A: "B",
         *          "sap-ushell-test-enc" : [ "A B%20C" ]
         *      }
         *  }
         *  </code>
         *
         *  or
         *
         *  <code>
         *  {
         *      target: {
         *          semanticObject: "AnObject",
         *          action: "action"
         *      },
         *      params: {
         *          "A": ["B"],
         *          "sap-ushell-test-enc": [ "A B%20C" ],
         *          "c": "e"
         *      }
         *  }
         *  </code>
         *
         *  or
         *
         *  <code>
         *  {
         *      target: {
         *          shellHash: "SO-36&jumper=postman&sap-ushell-enc=A%20B%2520C"
         *      }
         *  }
         *  </code>
         *
         * @private
         */
        function amendTargetWithSapUshellEncTestParameter(vTarget) {
            var sSeparator,
                oClonedTarget,
                sShellHash;
            if (localStorage && localStorage["sap-ushell-enc-test"] === "false") {
                return vTarget;
            }
            if (!oServiceConfiguration || !oServiceConfiguration["sap-ushell-enc-test"]) {
                if (localStorage && localStorage["sap-ushell-enc-test"] !== "true") {
                    return vTarget;
                }
            }
            if (typeof vTarget !== "string" && !jQuery.isPlainObject(vTarget) && vTarget !== undefined) {
                jQuery.sap.log.error("Unexpected input type", null, "sap.ushell.services.CrossApplicationNavigation");
                return undefined;
            }

            if (vTarget === undefined) {
                return undefined;
            }

            if (jQuery.isPlainObject(vTarget)) {
                // needs deep copy
                oClonedTarget = jQuery.extend(true, {}, vTarget);
                if (oClonedTarget.target && oClonedTarget.target.shellHash) {
                    if (typeof oClonedTarget.target.shellHash === "string") {
                        // process shell hash as a string
                        if (oClonedTarget.target.shellHash !== "#" && oClonedTarget.target.shellHash !== "") {
                            oClonedTarget.target.shellHash = amendTargetWithSapUshellEncTestParameter(
                                oClonedTarget.target.shellHash);
                        }
                    }
                    return oClonedTarget;
                }

                oClonedTarget.params = oClonedTarget.params || {};
                oClonedTarget.params["sap-ushell-enc-test"] = ["A B%20C"];

                return oClonedTarget;
            } else {
                sShellHash = vTarget;

                if (!/[?&]sap-system=/.test(sShellHash)) {
                    sSeparator = (sShellHash.indexOf("?") > -1) ? "&" : "?";
                    sShellHash += sSeparator + "sap-ushell-enc-test=" + encodeURIComponent("A B%20C");
                }
                return sShellHash;
            }
        }

        /**
         * Extracts the inner app route from a given intent.
         *
         * This method actually amends the input parameter if it is not
         * provided as a string (which is immutable in Javascript).
         *
         * @param {variant} vIntent
         *
         * The input intent. It can be an object or a string in the format:
         *
         *  <pre>
         *  {
         *     target : { semanticObject : "AnObject", action: "action" },
         *     params : { A : "B" },
         *     appSpecificRoute: "some/inner-app/route"
         *  }
         *  </pre>
         *
         *  or
         *
         *  <pre>
         *  {
         *     target : {
         *        semanticObject : "AnObject",
         *        action: "action", context  : "AB7F3C"
         *     },
         *     params : {
         *        A : "B",
         *        c : "e"
         *     },
         *     appSpecificRoute: "some/inner-app/route"
         *  }
         *  </pre>
         *
         *  or
         *
         *  <pre>
         *  {
         *     target : { shellHash : "SO-36?jumper=postman&/some/inner-app/route" }
         *  }
         *  </pre>
         *
         * @returns {object}
         *
         * An object like:
         * <pre>
         * {
         *     innerAppRoute: "&/some/inner-app/route", // always present. "" if none found.
         *                                              // Includes separator if found.
         *     intent: { }                              // vIntent without inner app route
         * }
         * </pre>
         *
         * NOTE: the returned <code>intent</code> field will be a string if the
         * input <code>vIntent</code> was a string.
         *
         * @private
         */
        this._extractInnerAppRoute = function (vIntent) {
            var that = this,
                aParts,
                sIntent;

            if (typeof vIntent === "string") {
                aParts = vIntent.split("&/"); // ["Object-action", "inner-app/route", ... ]
                sIntent = aParts.shift();     // aParts now contains parts of inner-app route

                return {
                    intent: sIntent,
                    innerAppRoute: aParts.length > 0
                        ? "&/" + aParts.join("&/")
                        : ""
                };
            }

            if (Object.prototype.toString.apply(vIntent) === "[object Object]") {
                var sShellHash = jQuery.sap.getObject("target.shellHash", undefined, vIntent);
                if (typeof sShellHash === "string") {
                    var oResult = that._extractInnerAppRoute(sShellHash);

                    // modify the source object
                    vIntent.target.shellHash = oResult.intent;

                    return {
                        intent: vIntent,
                        innerAppRoute: oResult.innerAppRoute
                    };
                }

                if (vIntent.hasOwnProperty("appSpecificRoute")) {
                    var vAppSpecificRoute = vIntent.appSpecificRoute;

                    delete vIntent.appSpecificRoute;

                    var bIsStringWithoutSeparator = typeof vAppSpecificRoute === "string"
                        && vAppSpecificRoute.indexOf("&/") !== 0
                        && vAppSpecificRoute.length > 0;

                    return {
                        innerAppRoute: bIsStringWithoutSeparator
                            ? "&/" + vAppSpecificRoute   // vAppSpecificRoute guaranteed to be string
                            : vAppSpecificRoute,         // can be an object
                        intent: vIntent
                    };
                }

                return {
                    intent: vIntent,
                    innerAppRoute: ""
                };
            }

            jQuery.sap.log.error(
                "Invalid input parameter",
                "expected string or object",
                "sap.ushell.services.CrossApplicationNavigation"
            );

            return { intent: vIntent };
        };

        /**
         * Adds an inner app route to the given intent.
         *
         * @param {variant} vIntent
         *
         * The same input object or string that #_extractInnerAppRoute takes.
         *
         * @param {string} [sInnerAppRoute]
         *
         * The inner app route. This method assumes that, if provided and non
         * empty, it always starts wih "&/".
         *
         * @return {variant}
         *
         * The intent with the given <code>sInnerAppRoute</code> parameter.
         *
         * @private
         */
        this._injectInnerAppRoute = function (vIntent, sInnerAppRoute) {
            var sShellHash,
                that = this;

            if (!sInnerAppRoute) {
                return vIntent;
            }

            if (typeof vIntent === "string") {
                return vIntent + sInnerAppRoute;
            }

            if (Object.prototype.toString.apply(vIntent) === "[object Object]") {
                sShellHash = jQuery.sap.getObject("target.shellHash", undefined, vIntent);
                if (typeof sShellHash === "string") {
                    vIntent.target.shellHash = that._injectInnerAppRoute(
                        sShellHash, sInnerAppRoute
                    );

                    return vIntent;
                }

                vIntent.appSpecificRoute = sInnerAppRoute;
            }

            return vIntent;
        };

        /**
        * Returns a string which can be put into the DOM (e.g. in a link tag)
        *
        * @param {object} oArgs
        *     object encoding a semantic object and action
        *  e.g.
        *  <pre>
        *  {
        *     target : { semanticObject : "AnObject", action: "action" },
        *     params : { A : "B" }
        *  }
        *  </pre>
        *  or
        *  e.g.
        *  <pre>
        *  {
        *     target : {
        *        semanticObject : "AnObject",
        *        action: "action", context  : "AB7F3C"
        *     },
        *     params : {
        *        A : "B",
        *        c : "e"
        *     }
        *  }
        *  </pre>
        *  or
        *  <pre>
        *  {
        *     target : { shellHash : "SO-36?jumper=postman" }
        *  }
        *  </pre>
        * @param {object} [oComponent]
        *   the root component of the application
        * @param {bool} bAsync
        *   if set to <code>true</code>, a promise will be returned instead of
        *   the direct argument. The promise will only succeed after all
        *   compaction requests have been sent
        *
        * @returns {string}
        *   the href for the specified parameters as an *external* shell hash;
        *   always starting with a
        *   hash character; all parameters and parameter names are URL-encoded (via
        *   encodeURIComponent) and the complete string is encoded via encodeURI (!).
        *   The generated string can not be used in the majority of interfaces which expect a
        *   internal shell hash.
        *
        * A proper way for an application to generate a link to return to the home page of the
        * Fiori launchpad is :
        *<code>
        *hrefForExternal( { target : { shellHash : "#" }})
        *</code>
        *
        *Do *not* use "#Shell-home" to navigate to a specific homepage!
        *
        * Note: if object is undefined, the current shell hash is returned.
        *
        * Note that the application parameter length (including
        * SemanticObject/Action) shall not exceed 512 bytes when serialized as
        * UTF-8.
        *
        * The function can be used to convert an shell hash internal format
        * commonly encountered into the URL format to use in link tags:
        * <pre>
        * externalHash = oCrossApplicationNavigationService.hrefForExternal({
        *     target: {
        *         shellHash: oLink.intent
        *     }
        * }, that.oComponent);
        * </pre>
        *
        * @since 1.15.0
        * @public
        * @alias sap.ushell.services.CrossApplicationNavigation#hrefForExternal
        */
        this.hrefForExternal = function (oArgs, oComponent, bAsync) {
            var oArgsClone,
                oExtraction;

            if (sap.ushell && sap.ushell.Container && typeof sap.ushell.Container.getService === "function" && sap.ushell.Container.getService("ShellNavigation")) {

                // Remove and re-add inner app route, as logic that manipulates
                // the input may assume no inner app hash and anyway, it's not
                // supposed to tamper with it.
                oArgsClone = jQuery.sap.extend(true, {}, oArgs);
                oExtraction = this._extractInnerAppRoute(oArgsClone);

                oArgsClone = getTargetWithCurrentSystem(oExtraction.intent, oComponent);
                oArgsClone = amendTargetWithSapUshellEncTestParameter(oArgsClone);

                oArgsClone = this._injectInnerAppRoute(oArgsClone, oExtraction.innerAppRoute);

                return sap.ushell.Container.getService("ShellNavigation").hrefForExternal(
                    oArgsClone, undefined, oComponent, bAsync
                );
            }

            jQuery.sap.log.debug("Shell not available, no Cross App Navigation");
            if (bAsync) {
                return (new jQuery.Deferred()).resolve("").promise();
            }
            return "";
        };

        /**
        * if sHashFragment is a compacted hash (sap-intent-param is present),
        * in a hash, this function replaces it into a long url with all parameters
        * expanded
        * @param {string} sHashFragment
        *   an (internal format) shell hash
        * @returns {object} promise
        *           the success handler of the resolve promise get an expanded shell hash
        *           as first argument
        * @public
        * @alias sap.ushell.services.CrossApplicationNavigation#expandCompactHash
        */
        this.expandCompactHash = function(sHashFragment) {
            return sap.ushell.Container.getService("NavTargetResolution").expandCompactHash(sHashFragment);
        };

        /**
         * Attempts to use the browser history to navigate to the previous app.
         * <p>A navigation to the Fiori Launchpad Home is performed in case this
         * method is called on a first navigation.  In all other cases, this
         * function simply performs a browser back navigation.
         * </p>
         * <p>Please note that the behavior of this method is subject to change
         * and therefore it may not yield to the expected results especially on
         * mobile devices where "back" is the previous inner app state iff
         * these are put into the history!</p>
         *
         * @public
         * @alias sap.ushell.services.CrossApplicationNavigation#backToPreviousApp
         */
        this.backToPreviousApp = function () {
            if (this.isInitialNavigation()) {
                // go back home
                this.toExternal({ target: { shellHash: "#" }, writeHistory: false});
                return;
            }

            this.historyBack();
        };
        /**
         * performs window.history.go() with number of steps if provided and
         * if supported by the underlying platform.
         * May be a noop if the url is the first url in the browser.
         * If no argument is provided it wil call window.history.go(-1)
         * @param {number} iSteps
         *    positive integer representing the steps to go back in the history
         *
         * @public
         * @alias sap.ushell.services.CrossApplicationNavigation#historyBack
         */
        this.historyBack = function (iSteps) {
            var iActualStepsBack = -1;
            if (iSteps && typeof iSteps === "number") {
                if (iSteps <= 0) {
                    jQuery.sap.log.warning(
                        "historyBack called with an argument <= 0 and will result in a forward navigation or refresh",
                        "expected was an argument > 0",
                        "sap.ushell.services.CrossApplicationNavigation#historyBack"
                    );
                }
                iActualStepsBack = iSteps * -1;
            }
            window.history.go(iActualStepsBack);
        };

        /**
         * Checks whether the FLP has performed the first navigation. This method can
         * be used to detect whether the current app was started directly, that is,
         * without a previous navigation to another app, to the FLP home, or another
         * target that adds an entry in the browser history.
         *
         * @returns {boolean}
         *    Whether the initial navigation occurred.
         *
         * @public
         * @alias sap.ushell.services.CrossApplicationNavigation#isInitialNavigation
         * @since 1.36.0
         */
        this.isInitialNavigation = function () {
            var oShellNavigation = sap.ushell &&
                sap.ushell.Container &&
                typeof sap.ushell.Container.getService === "function" &&
                sap.ushell.Container.getService("ShellNavigation");

            if (!oShellNavigation) {
                jQuery.sap.log.debug(
                    "ShellNavigation service not available",
                    "This will be treated as the initial navigation",
                    "sap.ushell.services.CrossApplicationNavigation"
                );
                return true;
            }

            var bIsInitialNavigation = oShellNavigation.isInitialNavigation();

            /*
             * An undefined value indicates that the ShellNavigation service
             * did not initialize the ShellNavigationHashChanger yet. Hence
             * this is the first navigation in case asked at this point in
             * time.
             */
            if (typeof bIsInitialNavigation === "undefined") {
                return true;
            }

            return bIsInitialNavigation;
        };

        /**
        * Navigate to an specified external target (e.g. different launchpad application)
        * Invocation will trigger an hash change and subsequent invocation of the application.
        *
        * If the navigation target opens in a new window the running application may be retained.
        *
        * @param {Object} oArgs
        * configuration object describing the target
        *
        *  e.g. <code>{ target : { semanticObject : "AnObject", action: "action" },<br/>
        *         params : { A : "B" } }</code>
        *    constructs sth. like   <code>#AnObject-action?A=B&C=e&C=j</code>;
        *  or
        *  e.g. <code>{ target : { semanticObject : "AnObject", action: "action", context  : "AB7F3C" },<br/>
        *         params : { A : "B", c : "e" } }</code>
        *  or
        *      <code>{ target : { shellHash : "SO-36&jumper=postman" },
        *      }</code>
        *
        * and navigate to it via changing the hash
        *
        * A proper way for an application to generate a link to return to the home page of the
        * Fiori launchpad is:
        *<code>
        *hrefForExternal( { target : { shellHash : "#" }})
        *</code>
        *
        *Do *not* use "#Shell-home" or "Shell-home" to navigate to a specific homepage!
        *
        *The actual navigation may occur deferred!
        *
        *
        *
        *
        * Note that the application parameter length (including SemanticObject/Action) shall not exceed 512 bytes when serialized as utf-8
        * @param {object} [oComponent]
        *    an optional SAP UI5 Component,
        * @since 1.15.0
        * @public
        * @alias sap.ushell.services.CrossApplicationNavigation#toExternal
        */
        this.toExternal = function (oArgs, oComponent) {
            var oArgsClone,
                oExtraction,
                bWriteHistory = oArgs.writeHistory;

            if (sap.ushell && sap.ushell.Container && typeof sap.ushell.Container.getService === "function" && sap.ushell.Container.getService("ShellNavigation")) {
                // clone because _extractInnerAppRoute may change the original
                // structure.
                oArgsClone = jQuery.sap.extend(true, {}, oArgs);
                oExtraction = this._extractInnerAppRoute(oArgsClone);

                oArgsClone = getTargetWithCurrentSystem(oExtraction.intent, oComponent);
                oArgsClone = amendTargetWithSapUshellEncTestParameter(oArgsClone);

                delete oArgsClone.writeHistory;

                oArgsClone = this._injectInnerAppRoute(oArgsClone, oExtraction.innerAppRoute);

                sap.ushell.Container.getService("ShellNavigation").toExternal(oArgsClone, oComponent, bWriteHistory);
                return;
            }
            jQuery.sap.log.debug("Shell not avialable, no Cross App Navigation");
            return;
        };


        /**
         * Returns a string which can be put into the DOM (e.g. in a link tag)
         * given an application specific hash suffix
         *
         * Example: <code>hrefForAppSpecificHash("View1/details/0/")</code> returns
         * <code>#SemanticObject-action&/View1/details/0/</code> if the current application
         * runs in the shell and was started using "SemanticObject-action" as
         * shell navigation hash
         *
         * @param {string} sAppHash
         *   the app specific router, obtained e.g. via router.getURL(...)
         * @returns {string}
         * A string which can be put into the link tag,
         *          containing the current shell navigation target and the
         *          specified application specific hash suffix
         *
         * Note that sAppHash shall not exceed 512 bytes when serialized as UTF-8
         * @since 1.15.0
         * @public
         * @alias sap.ushell.services.CrossApplicationNavigation#hrefForAppSpecificHash
         */
        this.hrefForAppSpecificHash = function (sAppHash) {
            if (sap.ushell && sap.ushell.Container && typeof sap.ushell.Container.getService === "function" && sap.ushell.Container.getService("ShellNavigation")) {
                return sap.ushell.Container.getService("ShellNavigation").hrefForAppSpecificHash(sAppHash);
            }
            jQuery.sap.log.debug("Shell not available, no Cross App Navigation; fallback to app-specific part only");
            // Note: this encoding is to be kept aligned with the encoding in hasher.js ( see _encodePath( ) )
            return "#" + encodeURI(sAppHash);
        };


        /**
         * For a given semantic object, this method considers all actions
         * associated with the semantic object and returns the one tagged as a
         * "primaryAction". If no inbound tagged as "primaryAction" exists, then
         * the intent of the first inbound (after sorting has been applied)
         * matching the action "displayFactSheet".
         *
         * The primary intent is determined by querying {@link CrossApplicationNavigation#getLinks}
         * with the given semantic object and optional parameter. Then the
         * resulting list is filtered to the outcome that a single item remains.
         *
         * @param {string} sSemanticObject Semantic object.
         * @param {object} [mParameters] @see CrossApplicationNavigation#getSemanticObjectLinks for description.
         *
         * @returns {jQuery.Deferred} When a relevant link object exists, it will return
         * a promise that resolves to an object of the following form:
         * <pre>
         *   {
         *      intent: "#AnObject-Action?A=B&C=e&C=j",
         *      text: "Perform action",
         *      icon: "sap-icon://Fiori2/F0018", // optional
         *      shortTitle: "Perform"            // optional
         *      tags: ["tag-1", "tag-2"]         // optional
         *   }
         * </pre>
         * Otherwise, the returned promise will resolve to null when no relevant
         * link object exists.
         *
         * @public
         * @since 1.48
         * @alias sap.ushell.services.CrossApplicationNavigation#getPrimaryIntent
         */
        this.getPrimaryIntent = function ( sSemanticObject, mParameters ) {
            var oQuery = { };
            var fnSortPredicate;
            var rgxDisplayFactSheetAction = /^#\w+-displayFactSheet(?:$|\?.)/;

            oQuery.tags = [ "primaryAction" ];
            oQuery.semanticObject = sSemanticObject;
            if ( mParameters ) {
                oQuery.params = mParameters;
            }

            return this.getLinks( oQuery )
                .then( function ( aLinks ) {
                    if ( aLinks.length === 0 ) {
                        delete oQuery.tags;
                        oQuery.action = "displayFactSheet";

                        // Priority given to intents with the action
                        // 'displayFactSheet'
                        fnSortPredicate = function ( oLink, oOtherLink ) {
                            var bEitherIsFactSheetAction;

                            if ( oLink.intent === oOtherLink.intent ) {
                                return 0;
                            }

                            bEitherIsFactSheetAction = rgxDisplayFactSheetAction.test( oLink.intent )
                                    ^ rgxDisplayFactSheetAction.test( oOtherLink.intent );

                            if ( bEitherIsFactSheetAction ) {
                                return rgxDisplayFactSheetAction.test( oLink.intent )
                                    ? -1
                                    : 1;
                            }

                            return oLink.intent < oOtherLink.intent ? -1 : 1;
                        };

                        return this.getLinks( oQuery );
                    }

                    // simple left-right-lexicographic order, based on intent
                    fnSortPredicate = function ( oLink, oOtherLink ) {

                        if ( oLink.intent === oOtherLink.intent ) {
                            return 0;
                        }

                        return oLink.intent < oOtherLink.intent ? -1 : 1;
                    };

                    return  aLinks;
                }.bind( this ) )
                .then( function ( aLinks ) {
                    return aLinks.length === 0
                        ? null
                        : aLinks.sort( fnSortPredicate )[0];
                } );
        };

        /**
         * Resolves a given semantic object and business parameters to a list of links,
         * taking into account the form factor of the current device.
         *
         * @param {string} sSemanticObject
         *   the semantic object such as <code>"AnObject"</code>
         * @param {object} [mParameters]
         *   the map of business parameters with values, for instance
         *   <pre>
         *   {
         *     A: "B",
         *     c: "e"
         *   }
         *   </pre>
         * @param {boolean} [bIgnoreFormFactor=false]
         *   when set to <code>true</code> the form factor of the current device is ignored
         * @param {Object} [oComponent]
         *    SAP UI5 Component invoking the service
         * @param {string} [sAppStateKey]
         *    application state key to add to the generated links, SAP internal usage only
         * @param {boolean} [bCompactIntents]
         *    whether the returned intents should be returned in compact format. Defaults to false.
         * @returns {object}
         *   A <code>jQuery.Deferred</code> object's promise which is resolved with an array of
         *   link objects containing (at least) the following properties:
         * <pre>
         * {
         *   intent: "#AnObject-action?A=B&C=e",
         *   text: "Perform action",
         *   icon: "sap-icon://Fiori2/F0018", //optional
         *   subTitle: "Action", //optional
         *   shortTitle: "Perform" //optional
         * }
         * </pre>
         *
         * <b>NOTE:</b> the intents returned are in <b>internal</b> format and cannot be directly put into a link tag.
         * <p>
         * Example: Let the string <code>"C&A != H&M"</code> be a parameter value.
         * Intent will be encoded as<code>#AnObject-action?text=C%26A%20!%3D%20H%26M<code>.
         * Note that the intent is in <b>internal</b> format, before putting it into a link tag, you must invoke:
         * <code>externalHash = oCrossApplicationNavigationService.hrefForExternal({ target : { shellHash :  oLink.intent} }, that.oComponent);</code>
         * </p>
         *
         * @deprecated since version 1.38.0 use getLinks
         * @since 1.19.0
         * @public
         * @alias sap.ushell.services.CrossApplicationNavigation#getSemanticObjectLinks
         */
        this.getSemanticObjectLinks = function (sSemanticObject, mParameters, bIgnoreFormFactor, oComponent, sAppStateKey, bCompactIntents) {
            var mParametersPlusSapSystem,
                oSrv,
                aExpandedIntents;

            mParametersPlusSapSystem = getTargetWithCurrentSystem({ params: mParameters }, oComponent).params;
            mParametersPlusSapSystem = amendTargetWithSapUshellEncTestParameter({ params: mParametersPlusSapSystem }).params;
            oSrv = sap.ushell.Container.getService("NavTargetResolution");

            // deal with multi-arg calls
            var vArgs;
            if (jQuery.isArray(sSemanticObject)) {
                vArgs = [];
                sSemanticObject.forEach(function (aArgs) {
                    vArgs.push([{
                        semanticObject: aArgs[0],
                        params: aArgs[1],
                        ignoreFormFactor: !!aArgs[2],
                        ui5Component: aArgs[3],
                        appStateKey: aArgs[4],
                        compactIntents: !!(aArgs[5])
                    }]);
                });
            } else {
                vArgs = {
                    // note: no action keeps backward compatible behavior
                    semanticObject: sSemanticObject,
                    params: mParametersPlusSapSystem,
                    ignoreFormFactor: bIgnoreFormFactor,
                    ui5Component: oComponent,
                    appStateKey: sAppStateKey,
                    compactIntents: !!bCompactIntents
                };
            }

            aExpandedIntents = sap.ushell.utils.invokeUnfoldingArrayArguments(oSrv.getLinks.bind(oSrv), [vArgs]);

            return aExpandedIntents;
        };

        /**
         * Resolves the given semantic object (or action) and business
         * parameters to a list of links available to the user
         *
         * @param {object|object[]} [vArgs]
         *   An object containing nominal arguments for the method, having the
         *   following structure:
         *   <pre>
         *   {
         *      semanticObject: "Object", // optional, matches any semantic
         *                                // objects if undefined
         *
         *      action: "action",         // optional, matches any actions if
         *                                // undefined
         *
         *      params: {                 // optional business parameters
         *         A: "B",
         *         C: ["e", "j"]
         *      },
         *      withAtLeastOneUsedParam: true, // optional, defaults to false. If
         *                                     // true, only the links that use
         *                                     // at least one (non sap-) parameter
         *                                     // from 'params' will be returned.
         *
         *      sortResultsBy: "intent", // optional parameter that decides
         *                               // on how the returned results will be sorted.
         *                               // Possible values are:
         *                               //
         *                               // - "intent" (default) lexicographical sort on returned 'intent' field
         *                               // - "text" lexicographical sort on returned 'text' field
         *                               // - "priority" exprimental - top intents are returned first
         *                               //
         *
         *      treatTechHintAsFilter : true, // optional, defaults to false
         *                                    // if true, only apps that match
         *                                    // exactly the supplied technology
         *                                    // (e.g. sap-ui-tech-hint=WDA) will be considered
         *
         *      ui5Component: UI5Component, // mandatory, the UI5 component
         *                                  // invoking the service, shall be a root component!
         *
         *      appStateKey: "abc123...",   // optional, application state key
         *                                  // to add to the generated links,
         *                                  // SAP internal usage only
         *
         *      compactIntents: true        // optional, whether intents
         *                                  // should be returned in compact
         *                                  // format. Defaults to false.
         *      ignoreFormFactor: true,     // optional, defaults to false, deprecated, do not use, may have no effect in the future
         *
         *      tags: ["tag-1", "tag-2"]    // optional, if specified,
         *                                  // only returns links that match
         *                                  // inbound with certain tags.
         *   }
         *   </pre>
         *
         *   Starting from UI5 version 1.52.0 the <code>params</code> argument
         *   can be specified in the extended format:
         *
         *   <pre>
         *   ...
         *   params: {
         *      P1: { value: "v1" },
         *      P2: { value: ["v2", "v3"] }
         *   }
         *   </pre>
         *
         *   When the parameter is expressed in this format, the caller can
         *   specify additional search options.
         *
         *   Besides 'value', supported search options for the extended format are:
         *   <ul>
         *      <li>
         *      <b>required</b>: whether the parameter must be required (true)
         *      or not required (false) in the signature of the matching target
         *      (once the navigation occurs to the returned link).  Please note
         *      that this option will be effective if the Fiori Launchpad is
         *      configured to resolve navigation targets via
         *      <code>sap.ushell.services.ClientSideTargetResolution</code> and
         *      therefore may not be supported in all platforms.<br />
         *
         *      Example:
         *<pre>
         *   ...
         *   params: {
         *     P1: { value: "v1", required: true },
         *     P2: { value: ["v2", "v3"] }
         *   }
         *   ...
         *</pre>
         *      </li>
         *   </ul>
         *
         *   <p>This method supports a mass invocation interface to obtain
         *   multiple results with a single call, as shown in the following
         *   example:
         *
         *   <pre>
         *      oCrossApplicationService.getLinks([ // array, because multiple invocations are to be made
         *         [                           // arguments for the first invocation
         *           { semanticObject: "SO" }  // this method supports one parameter only in each call
         *         ],
         *         [                           // arguments for the second invocation
         *           { action: "someAction" }
         *         ]
         *         // ... and so on
         *     ]);
         *   </pre>
         *
         *   <p>Calling this method with no arguments will produce the same result
         *   as if the method was called with an empty object.</p>
         *
         * @returns {jQuery.Deferred.promise}
         *   A promise that resolves with an array of links objects containing
         *   (at least) the following properties:
         *
         * <pre>
         *   {
         *      intent: "#AnObject-Action?A=B&C=e&C=j",
         *      text: "Perform action",
         *      icon: "sap-icon://Fiori2/F0018", // optional
         *      subTitle: "Action", //optional
         *      shortTitle: "Perform"            // optional
         *      tags: ["tag-1", "tag-2"]         // optional
         *   }
         * </pre>
         *   <p>
         *   Properties marked as 'optional' in the example above may not be
         *   present in the returned result.
         *
         *   <p>
         *   <b>NOTE:</b> the intents returned are in <b>internal</b> format
         *   and cannot be directly put into a link tag.
         *   <p>
         *   Example: Let the string <code>"C&A != H&M"</code> be a parameter value.
         *
         *   Intent will be encoded as<code>#AnObject-action?text=C%26A%20!%3D%20H%26M<code>.
         *   Note that the intent is in <b>internal</b> format, before putting it into a link tag, you must invoke:
         *   <code>externalHash = oCrossApplicationNavigationService.hrefForExternal({ target : { shellHash :  oLink.intent} }, that.oComponent);</code>
         *   </p>
         *
         *   <p>
         *   NOTE: in case the mass invocation interface is used (see
         *   <code>vArgs</code> parameter explanation above),
         *   the promise will resolve to an array of arrays of arrays. For
         *   example, if the mass interface specified two arguments, the promise would resolve as follows:
         *
         *   <pre>
         *   [     // mass interface was used, so return multiple values
         *      [  // values returned from the first call (functions may return multiple values)
         *
         *         // value returned from first getLinks call (as returned by single getLinks call)
         *         [
         *           {intent: "#SO-something1", text: "Perform navigation"},
         *           {intent: "#SO-something2", text: "Perform action"} ],
         *         ]
         *      ],
         *      [
         *
         *         // value returned from second getLinks call (as returned by single getLinks call)
         *         [
         *           {intent: "#Object-someAction", text: "Some action1"}
         *         ]
         *      ]
         *      // ... and so on
         *   ]
         *   </pre>
         *
         * @public
         * @alias sap.ushell.services.CrossApplicationNavigation#getLinks
         * @since 1.38.0
         */
        this.getLinks = function (vArgs) {
            var aExpandedIntents;

            /*
             * the invokeUnfoldingArrayArguments does not want [oArg1, oArg2, oArg3],
             * but [ [oArg1], [oArg2], [oArg3] ] because the logic in that
             * method is based on positional parameters - however we have only
             * one argument (the oArg object in this case).
             */
            aExpandedIntents = sap.ushell.utils.invokeUnfoldingArrayArguments(
                this._getLinks.bind(this), [vArgs]
            );

            return aExpandedIntents;
        };

        /*
         * oNominalArgs can be an item from vArgs in this.getLinks()
         *
         * @param {type} oNominalArgs
         * @returns {unresolved}
         */
        this._getLinks = function (oNominalArgs) {
            var oNominalArgsClone,
                mParameterDefinition,
                mParametersPlusSapSystem,
                oSrv = sap.ushell.Container.getService("NavTargetResolution");

            // If method gets called without vArgs, the result should be
            // the same as if vArgs was an empty object.
            if (typeof oNominalArgs === "undefined") {
                oNominalArgs = {};
            }

            // ensure certain parameters are specified
            oNominalArgsClone = jQuery.extend(true, {}, oNominalArgs);
            oNominalArgsClone.compactIntents = !!oNominalArgsClone.compactIntents;
            oNominalArgsClone.action = oNominalArgsClone.action || undefined;
            oNominalArgsClone.paramsOptions = oUtils.extractGetLinksParameterOptions(oNominalArgsClone.params);

            mParameterDefinition = oNominalArgsClone.params
                ? oUtils.extractGetLinksParameterDefinition(oNominalArgsClone.params)
                : oNominalArgsClone.params;

            // propagate sap-system into parameters

            mParametersPlusSapSystem = getTargetWithCurrentSystem(
                { params: mParameterDefinition }, oNominalArgsClone.ui5Component
            ).params;

            mParametersPlusSapSystem = amendTargetWithSapUshellEncTestParameter({
                params: mParametersPlusSapSystem }
            ).params;
            if (oNominalArgsClone.appStateKey) {
                mParametersPlusSapSystem["sap-xapp-state"] = [oNominalArgsClone.appStateKey];
                delete oNominalArgsClone.appStateKey;
            }

            oNominalArgsClone.params = mParametersPlusSapSystem;


            return oSrv.getLinks(oNominalArgsClone);
        };

        /**
         * Returns a list of semantic objects of the intents the current user
         * can navigate to.
         *
         * @returns {jQuery.Deferred.promise}
         *   A promise that resolves with an array of strings representing the
         *   semantic objects of the intents the current user can navigate
         *   to, or rejects with an error message. The returned array will not
         *   contain duplicates.
         *   <p>
         *   NOTE: the caller should not rely on the specific order
         *   the semantic objects appear in the returned array.
         *   </p>
         *
         * @public
         * @alias sap.ushell.services.CrossApplicationNavigation#getDistinctSemanticObjects
         * @since 1.38.0
         */
        this.getDistinctSemanticObjects = function () {
            var oSrv = sap.ushell.Container.getService("NavTargetResolution");
            return oSrv.getDistinctSemanticObjects();
        };

        /**
         * Tells whether the given intent(s) are supported, taking into account the form factor of
         * the current device. "Supported" means that navigation to the intent is possible.
         * Note that the intents are assumed to be in internal format  and expanded.
         * @param {string[]} aIntents
         *   the intents (such as <code>["#AnObject-action?A=B&c=e"]</code>) to be checked
         * @param {object} [oComponent]
         *   the root component of the application
         *
         * @returns {object}
         *   A <code>jQuery.Deferred</code> object's promise which is resolved with a map
         *   containing the intents from <code>aIntents</code> as keys. The map values are
         *   objects with a property <code>supported</code> of type <code>boolean</code>.<br/>
         *   Example:
         * <pre>
         *   {
         *     "#AnObject-action?A=B&c=e": { supported: false },
         *     "#AnotherObject-action2": { supported: true }
         *   }
         * </pre>
         * Example usage:
         * <code>
         *   this.oCrossAppNav.isIntentSupported(["SalesOrder-approve?SOId=1234"])
         *   .done(function(aResponses) {
         *     if (oResponse["SalesOrder-approve?SOId=1234"].supported===true){
         *        // enable link
         *     }
         *     else {
         *        // disable link
         *     }
         *   })
         *   .fail(function() {
         *     // disable link
         *     // request failed or other error
         *   });
         * </code>
         * * @deprecated switch to isNavigationSupported
         * Note that this has a slightly different response format
         * @since 1.19.1
         * @public
         * @alias sap.ushell.services.CrossApplicationNavigation#isIntentSupported
         */
        this.isIntentSupported = function (aIntents, oComponent) {
            var oDeferred = new jQuery.Deferred(),
                mOriginalIntentHash = {}, // used for remapping
                aClonedIntentsWithSapSystem = aIntents.map(function (sIntent) {
                    var sIntentWithSystem = getTargetWithCurrentSystem(sIntent, oComponent); // returns clone
                    mOriginalIntentHash[sIntentWithSystem] = sIntent;

                    return sIntentWithSystem;
                });

            sap.ushell.Container.getService("NavTargetResolution")
                .isIntentSupported(aClonedIntentsWithSapSystem)
                    .done(function (mIntentSupportedPlusSapSystem) {
                        /*
                         * Must restore keys to what the application expects,
                         * as per NavTargetResolution contract.
                         */
                        var mIntentSupportedNoSapSystem = {};
                        Object.keys(mIntentSupportedPlusSapSystem).forEach(function (sKeyPlusSapSystem) {
                            mIntentSupportedNoSapSystem[
                                mOriginalIntentHash[sKeyPlusSapSystem]
                            ] = mIntentSupportedPlusSapSystem[sKeyPlusSapSystem];
                        });
                        oDeferred.resolve(mIntentSupportedNoSapSystem);
                    })
                    .fail(oDeferred.reject.bind(oDeferred));

            return oDeferred.promise();
        };

        /**
         * Tells whether the given navigation intent(s) are supported for the given
         * parameters, form factor etc
         * "Supported" means that a valid navigation target is configured for the
         * user for the given device.
         *
         * This is effectively a test function for {@link toExternal}/ {@link hrefForExternal}.
         * It is functionally equivalent to {@link isIntentSupported} but accepts the same interface
         * as {@link toExternal}/ {@link hrefForExternal}.
         *
         * @param {object[]} aIntents
         *   the intents to be checked
         * with object being instances the oArgs object of toExternal, hrefForExternal etc.
         *
         *  e.g. <code>
         *  {
         *      target: {
         *          semanticObject: "AnObject",
         *          action: "action"
         *      },
         *      params: {
         *          A: "B"
         *      }
         *  }
         *  </code>
         *  or
         *  e.g. <code>
         *  {
         *      target: {
         *          semanticObject: "AnObject",
         *          action: "action"
         *      },
         *      params: {
         *          A: "B",
         *          c: "e"
         *      }
         *  }
         *  </code>
         *  or
         *  <code>
         *  {
         *      target: {
         *          shellHash: "SO-36&jumper=postman"
         *      },
         *  }
         *  </code>
         * @param {object} [oComponent]
         *   the root component of the application
         *
         * @returns {object}
         *   A <code>jQuery.Deferred</code> object's promise which is resolved with an array (!) of
         *   objects representing whether the intent is supported or not
         *   objects with a property <code>supported</code> of type <code>boolean</code>.<br/> representing
         *   Example:
         *
         * aIntents:
         * <pre>
         *  [
         *    {  target : {
         *          semanticObject : "AnObject",
         *          action: "action"
         *       },
         *       params : { P1 : "B", P2 : [ "V2a", "V2b"]  }
         *    },
         *    {  target : {
         *          semanticObject : "SalesOrder",
         *          action: "display"
         *       },
         *       params : { P3 : "B", SalesOrderIds : [ "4711", "472"] }
         *    }
         * ]
         * </pre>
         *
         * response: [Indices correspond]
         * <pre>
         * [
         *   { supported: false },
         *   { supported: true }
         * ]
         * </pre>
         * Example usage:
         * <code>
         * this.oCrossAppNav.isNavigationSupported([ ])
         * .done(function(aResponses) {
         *   if (oResponse[0].supported===true){
         *      // enable link
         *   }
         *   else {
         *      // disable link
         *   }
         * })
         * .fail(function() {
         *   // disable link
         *   // request failed or other fatal error
         * });
         * </code>
         *
         * @since 1.32
         * @public
         * @alias sap.ushell.services.CrossApplicationNavigation#isNavigationSupported
         */
        this.isNavigationSupported = function (aIntents, oComponent) {
            var aClonedIntents = aIntents
                .map(function (oIntent) {
                    return getTargetWithCurrentSystem(oIntent, oComponent); // returns clone
                });

            return sap.ushell.Container.getService("NavTargetResolution")
                .isNavigationSupported(aClonedIntents);
        };


        /**
         * Tells whether the given URL is supported for the current User.
         *
         * A URL is either supported if it is an intent and a target for the user exists
         * or if it not recognized as a Fiori intent of the same launchpad:
         * Examples for URLs qualified as "supported"
         * E.g.:
         *  * a non-fiori url, e.g. <code>www.sap.com</code> <code>http://mycorp.com/sap/its/webgui</code>
         *  * a hash not recognized as an intent  <code>#someotherhash</code>
         *  * a Fiori URL pointing to a different launchpad
         *
         * <pre>
         *   "https://www.sap.com" -> true, not rejected
         *   "#NotAFioriHash" -> true, not rejected
         *   "#PurchaseOrder-approve?POId=1899" -> true (if application is assigned to user)
         *   "#SystemSettings-change?par=critical_par" -> false (assuming application is not assigned to user)
         *   "https://some.other.system/Fiori#PurchaseOrder-approve?POId=1899" -> true, not rejected
         * </pre>
         *
         * Note that this only disqualifies intents for the same Launchpad.
         * It does not validate whether a URL is valid in general.
         *
         * @param {string} sUrl
         *   URL to test
         *
         * @returns {object}
         *   A <code>jQuery.Deferred</code> object's promise which is resolved
         *   if the URL is supported and rejected if not. The promise does not
         *   return parameters.
         *
         * @since 1.30.0
         * @private
         */
        this.isUrlSupported = function (sUrl) {
            var oDeferred = new jQuery.Deferred(),
                oUrlParsingService,
                sHash;
            if (typeof sUrl !== "string") {
                oDeferred.reject();
                return oDeferred.promise();
            }
            oUrlParsingService = sap.ushell.Container.getService("URLParsing");
            if (oUrlParsingService.isIntentUrl(sUrl)) {
                sHash = oUrlParsingService.getHash(sUrl);
                this.isIntentSupported(["#" + sHash])
                    .done(function (oResult) {
                        if (oResult["#" + sHash] && oResult["#" + sHash].supported) {
                            oDeferred.resolve();
                        } else {
                            oDeferred.reject();
                        }
                    })
                    .fail(function () {
                        oDeferred.reject();
                    });
            } else {
                oDeferred.resolve();
            }
            return oDeferred.promise();
        };

        /**
         * Resolves a given navigation intent (if valid) and returns
         * the respective component instance for further processing.
         *
         * This method should be accessed by the Unified Inbox only.
         *
         * @param {string} sIntent
         *     Semantic object and action as a string with a "#" as prefix
         * @param {object} [oConfig]
         *     Configuration used to instantiate the component, when given it is
         *     expected that the only property contained in this object is `componentData`.
         *     When the `componentData` is not relevant, then this method should
         *     be called with an empty object or null otherwise it will throw.
         *
         *     Note that the `componentData` member is cloned for use by this
         *     method, and the following properties are unconditionally set by
         *     this method and should not be passed in `componentData`:
         *     -- componentData.startupParameters, componentData.config, componentData["sap-xapp-state"].
         * @param {object} [oOwnerComponent]
         *     If specified, the created component will be called
         *     within the context of the oOwnerComponent ( via oOwnerComponent.runAsOwner(fn) )
         * @returns {object} promise (component instance)
         *
         * @since 1.32.0
         * @private
         */
        this.createComponentInstance = function (sIntent, oConfig, oOwnerComponent) {

            var oContainer, oUrlParsingService, sCanonicalIntent, iConfigPropertyCount;

            if ( !oConfig ) {
                oConfig = { };
            } else {
                iConfigPropertyCount = Object.keys( oConfig ).length;

                if ( iConfigPropertyCount > 1 ||
                        ( iConfigPropertyCount === 1 && !oConfig.componentData ) ) {
                    throw "`oConfig` argument should either be an empty object or contain only the `componentData` property.";
                }
            }

            if ( oConfig.componentData ) {
                delete oConfig.componentData.startupParameters;
                delete oConfig.componentData.config;
                delete oConfig.componentData["sap-xapp-state"];
            }

            oContainer = sap.ushell.Container;
            oUrlParsingService = oContainer.getService( "URLParsing" );
            sCanonicalIntent = oUrlParsingService
                .constructShellHash( oUrlParsingService.parseShellHash( sIntent ) );

            if ( !sCanonicalIntent ) {
                return new jQuery.Deferred( function ( oDeferred ) {
                    oDeferred.reject( "Navigation intent invalid!" );
                } ).promise();
            }

            return oContainer.getService( "NavTargetResolution" )
                .resolveHashFragment( "#" + sCanonicalIntent )
                .then( function ( oResult ) {

                    // If the application type equals "URL" and additionalInformation is undefined,
                    // the promise will be rejected if additionalInformation is not checked for
                    // existence.
                    if ( oResult.applicationType !== sap.ushell.components.container.ApplicationType.URL
                            && !( /^SAPUI5\.Component=/.test( oResult.additionalInformation ) ) ) {
                        return new jQuery.Deferred( function ( oDeferred ) {
                            oDeferred.reject( "The resolved target mapping is not of type UI5 component." );
                        } ).promise();
                    }

                    oResult = jQuery.extend( true, { }, oResult, oConfig );

                    if ( !oResult.ui5ComponentName && oResult.additionalInformation ) {
                        oResult.ui5ComponentName = oResult.additionalInformation.replace( /^SAPUI5\.Component=/, "" );
                    }

                    return new jQuery.Deferred( function ( oDeferred ) {
                        var ui5ComponentLoader = oContainer.getService( "Ui5ComponentLoader" );
                        if ( oOwnerComponent ) {
                            oOwnerComponent.runAsOwner( function () {
                                createComponent( oResult );
                            } );
                        } else {
                            createComponent( oResult );
                        }

                        function createComponent( oAppProperties ) {
                            oAppProperties.loadDefaultDependencies = false;

                            ui5ComponentLoader.createComponent( oAppProperties )
                                .then(
                                    function ( oAppPropertiesWithComponentHandle ) {
                                        oDeferred.resolve(
                                            oAppPropertiesWithComponentHandle.componentHandle
                                            .getInstance()
                                        );
                                    },
                                    function ( oError ) {
                                        oError = oError || "";
                                        jQuery.sap.log.error(
                                            "Cannot create UI5 component: " + oError,
                                            oError.stack,
                                            "sap.ushell.services.CrossApplicationNavigation"
                                        );

                                        oDeferred.reject( oError );
                                    }
                                );
                        }
                    } ).promise();
                } );
        };

        /**
         * Creates an empty app state object which act as a parameter container for
         * cross app navigation.
         * @param {object} oAppComponent - a UI5 component used as context for the app state
         * @return {object} App state Container
         * @since 1.28
         * @ignore  SAP Internal usage only, beware! internally public, cannot be changed,
         * but not part of the public documentation
         */
        this.createEmptyAppState = function (oAppComponent) {
            if (!oAppStateService) {
                oAppStateService = sap.ushell.Container.getService("AppState");
            }
            if (!(oAppComponent instanceof sap.ui.core.UIComponent)) {
                throw new Error("oAppComponent passed must be a UI5 Component");
            }
            return oAppStateService.createEmptyAppState(oAppComponent);
        };

        /**
         * Get the app state object that was used for the current cross application navigation
         * @param {object} oAppComponent - UI5 component, key will be extracted from component data
         * @return {object} promise object returning the app state object
         *    Note that this is an unmodifiable container and its data must be copied into a writable container!
         * @since 1.28
         * @ignore  SAP Internal usage only, beware! internally public, cannot be changed, but not part of the
         * public documentation
         */
        this.getStartupAppState = function (oAppComponent) {
            this._checkComponent(oAppComponent);
            var sContainerKey = oAppComponent.getComponentData() && oAppComponent.getComponentData()["sap-xapp-state"] && oAppComponent.getComponentData()["sap-xapp-state"][0];
            return this.getAppState(oAppComponent, sContainerKey);
        };

        /**
         * Check that oAppComponent is of proper type
         * Throws if not correct, returns undefined
         * @param {object} oAppComponent
         *   application component
         * @private
         */
        this._checkComponent = function (oAppComponent) {
            if (!(oAppComponent instanceof sap.ui.core.UIComponent)) {
                throw new Error("oComponent passed must be a UI5 Component");
            }
        };

        /**
         * Get an app state object given a key
         * A lookup for a cross user app state will be performed.
         * @param {object} oAppComponent - UI5 component, key will be extracted from component data
         * @param {object} sAppStateKey - the application state key
         *  SAP internal usage only
         * @return {object} promise object returning the app state object
         *    Note that this is an unmodifiable container and its data must be copied into a writable container!
         * @since 1.28
         * @ignore  SAP Internal usage only, beware! internally public, cannot be changed, but not part of the
         * public documentation
         */
        this.getAppState = function (oAppComponent, sAppStateKey) {
            // see stakeholders in SFIN etc.
            var oContainer,
                oDeferred = new jQuery.Deferred();
            this._checkComponent(oAppComponent);
            if (!oAppStateService) {
                oAppStateService = sap.ushell.Container.getService("AppState");
            }
            if (typeof sAppStateKey !== "string") {
                if (sAppStateKey !== undefined) {
                    jQuery.sap.log.error("Illegal Argument sAppStateKey ");
                }
                setTimeout(function () {
                    oContainer = oAppStateService.createEmptyUnmodifiableAppState(oAppComponent);
                    oDeferred.resolve(oContainer);
                }, 0);
                return oDeferred.promise();
            }
            return oAppStateService.getAppState(sAppStateKey);
        };

        /**
         * Get data of an AppStates data given a key
         * A lookup for a cross user app state will be performed.
         * @param {object} sAppStateKeyOrArray - the application state key, or an array, see below
         *  SAP internal usage only
         * @return {object} promise object returning the data of an AppState object,
         * or an empty <code>{}</code> javascript object if the key could not be resolved or
         * an error occurred!
         * @since 1.32
         * @ignore  SAP Internal usage only, beware! internally public, cannot be changed, but not part of the
         * public documentation
         * This is interface exposed to platforms who need a serializable form of the application state
         * data
         *
         * Note: this function may also be used in a multivalued invocation:
         * pass as sAppStateKey an array <code>[["AppStateKey1"],["AppStateKey2"],...]</code>
         * the result of the response will an corresponding array of array
         * <code>[[{asdata1}],[{asdata2}]</code>
         * @private
         * internal usage(exposure to WebDypnro ABAP)
         */
        this.getAppStateData = function (sAppStateKeyOrArray) {
            return sap.ushell.utils.invokeUnfoldingArrayArguments(this._getAppStateData.bind(this),
                    [sAppStateKeyOrArray]);
        };
        /**
         * Get data of an AppStates data given a key
         * A lookup for a cross user app state will be performed.
         * @param {object} sAppStateKey - the application state key, or an array, see below
         *  SAP internal usage only
         * @return {object} promise object returning the data of an AppState object,
         * or an empty <code>{}</code> javascript object if the key could not be resolved or
         * an error occurred!
         * @since 1.32
         * @ignore  SAP Internal usage only, beware! internally public, cannot be changed, but not part of the
         * public documentation
         * This is interface exposed to platforms who need a serializable form of the application state
         * data
         *
         * Note: this function may also be used in a multivalued invocation:
         * pass as sAppStateKey an array <code>[["AppStateKey1"],["AppStateKey2"],...]</code>
         * the result of the response will an corresponding array of array
         * <code>[[{asdata1}],[{asdata2}]</code>
         * @private
         */
        this._getAppStateData = function (sAppStateKey) {
            var oDeferred = new jQuery.Deferred();
            if (!oAppStateService) {
                oAppStateService = sap.ushell.Container.getService("AppState");
            }
            if (typeof sAppStateKey !== "string") {
                if (sAppStateKey !== undefined) {
                    jQuery.sap.log.error("Illegal Argument sAppStateKey ");
                }
                setTimeout(function () {
                    oDeferred.resolve(undefined);
                }, 0);
            } else {
                oAppStateService.getAppState(sAppStateKey).done(function(oAppState) {
                    oDeferred.resolve(oAppState.getData());
                }).fail(oDeferred.resolve.bind(oDeferred,undefined));
            }
            return oDeferred.promise();
        };
        /**
         * persist multiple app states
         * (in future potentially batched in a single roundtrip)
         * @param {Array} aAppStates
         *    Array of application States
         * @returns {object} a jQuery.Deferred
         * returns a promise, in case of success an array of individual save promise objects is returned as argument
         * in case of a reject, individual respones are not available
         * @private see remarks in getAppState
         */
        this.saveMultipleAppStates = function (aAppStates) {
            var aResult = [],
                oDeferred = new jQuery.Deferred();
            aAppStates.forEach(function (oAppState) {
                aResult.push(oAppState.save());
            });
            jQuery.when.apply(this, aResult).done(function () {
                oDeferred.resolve(aResult);
            }).fail(function () {
                oDeferred.reject("save failed");
            });
            return oDeferred.promise();
        };
    }; // CrossApplicationNavigation

    CrossApplicationNavigation.hasNoAdapter = true;
    return CrossApplicationNavigation;

}, true /* bExport */);
