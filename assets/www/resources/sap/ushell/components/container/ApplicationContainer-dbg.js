// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The UI integration's SAPUI5 control which supports application embedding.
 * @version 1.52.4
 */
(function () {
    "use strict";
    /*jslint nomen:true */
    /*global  addEventListener, removeEventListener, document, localStorage, jQuery, sap, URI*/

    var sPREFIX = "sap.ushell.components.container.",
        sCOMPONENT = sPREFIX + "ApplicationContainer",
        sDIRTY_STATE_PREFIX = "sap.ushell.Container.dirtyState.",
        mLogouts, /* {sap.ushell.utils.Map} */
        oResourceBundle;

    // Do not use the variables so that UI5 optimizers recognize this declaration
    jQuery.sap.declare("sap.ushell.components.container.ApplicationContainer");

    jQuery.sap.require("sap.ushell.utils");
    jQuery.sap.require("sap.ushell.library");
    jQuery.sap.require("sap.ui.core.UIComponent");


    /**
     * Method to adapt the CrossApplicationNavigation service method
     * isUrlSupported to the request as issued by the SAP UI5 MessagePopover control
     *
     * @param {object} an object defined by the MessagePopover control containing the URL
     *  which should be validated and an ES6 promise object which has to be used to receive the validation results.
     *  This promise always needs to be resolved expecting { allowed: true|false } as a an argument to the resolve function.
     *
     * @since 1.30.0
     * @private
     */
    function adaptIsUrlSupportedResultForMessagePopover (oToBeValidated) {
        var oCAService = sap.ushell.Container.getService("CrossApplicationNavigation");
        oCAService.isUrlSupported(oToBeValidated.url).done(function () {
            oToBeValidated.promise.resolve({ "allowed" : true, "id" : oToBeValidated.id });
        }).fail(function () {
            oToBeValidated.promise.resolve({ "allowed" : false, "id" : oToBeValidated.id });
        });
    }

    function initializeMessagePopover(){
        jQuery.sap.require("sap.m.MessagePopover");
        //Hook CrossApplicationNavigation URL validation logic into the sap.m.MessagePopover control
        var oMessageConceptDefaultHandlers = {
            "asyncURLHandler" : sap.ushell.components.container.ApplicationContainer.prototype._adaptIsUrlSupportedResultForMessagePopover
        };
        if (sap.m.MessagePopover && sap.m.MessagePopover.setDefaultHandlers) {
            sap.m.MessagePopover.setDefaultHandlers(oMessageConceptDefaultHandlers);
        }
    }

    /* MessagePopover and its dependent controls resources are ~200K. In order to minimize core-min file
     * it is bundled in core-ext file. Therefore we need to wait for 'coreResourcesFullyLoaded' event that
     * indicate that all resorces are loaded, before we initialize the MessagePopober
     */
    sap.ui.getCore().getEventBus().subscribe("sap.ushell", "coreResourcesFullyLoaded", initializeMessagePopover);

    mLogouts = new sap.ushell.utils.Map();

    /**
     * @namespace The application types supported by the embedding container.
     *
     * @since 1.15.0
     * @private
     */
    sap.ushell.components.container.ApplicationType = {
//          UI5: "UI5", // SAP UI development toolkit for HTML5
        /**
         * This type represents web applications identified by any uniform resource locator. They
         * will be embedded into an <code>IFRAME</code>.
         *
         * @constant
         * @default "URL"
         * @name sap.ushell.components.container.ApplicationType.URL
         * @since 1.15.0
         * @type string
         */
        URL: "URL",
        /**
         * This type represents applications built with Web Dynpro for ABAP. The embedding
         * container knows how to embed such applications in a smart way.
         *
         * @constant
         * @default "WDA"
         * @name sap.ushell.components.container.ApplicationType.WDA
         * @since 1.15.0
         * @type string
         */
        WDA: "WDA",
        /**
         * This type represents applications embedded via NetWeaver Business Client.
         * The embedding container knows how to embed such applications in a smart way.
         *
         * @constant
         * @default "NWBC"
         * @name sap.ushell.components.container.ApplicationType.NWBC
         * @since 1.19.0
         * @type string
         */
        NWBC: "NWBC",
        /**
         * This type represents transaction applications.
         * The embedding container knows how to embed such applications in a smart way.
         *
         * @constant
         * @default "TR"
         * @name sap.ushell.components.container.ApplicationType.TR
         * @since 1.36.0
         * @type string
         */
        TR: "TR"
    };

    /**
     * Returns the logout handler function for the given container object.
     *
     * @param {sap.ushell.components.container.ApplicationContainer} oContainer
     *   the container object for which the logout handler is of interest
     * @returns {function}
     *   the logout handler function for the given container. If no handler is registered
     *   <code>undefined</code> is returned.
     * @private
     */
    function getLogoutHandler(oContainer) {
        return mLogouts.get(oContainer.getId());
    }

    /**
     * Returns a map of all search parameters present in the search string of the given URL.
     *
     * @param {string} sUrl
     *   the URL
     * @returns {object}
     *   in member <code>startupParameters</code> <code>map&lt;string, string[]}></code> from key to array of values,
     *   in members <code>sap-xapp-state</code> an array of Cross application Navigation state keys, if present
     *   Note that this key is removed from startupParameters!
     * @private
     */
    function getParameterMap(sUrl) {
        var mParams = jQuery.sap.getUriParameters(sUrl).mParams,
            xAppState = mParams["sap-xapp-state"],
            oResult;
        delete mParams["sap-xapp-state"];
        oResult = {
            startupParameters : mParams
        };
        if (xAppState) {
            oResult["sap-xapp-state"] = xAppState;
        }
        return oResult;
    }

    /**
     * Returns a translated text from the resource bundle.
     *
     * @param {string} sKey
     *   the key in the resource bundle
     * @param {string[]} [aArgs]
     *   arguments to replace {0}..{9}
     * @returns {string}
     *   the translated text
     */
    function getTranslatedText(sKey, aArgs) {
        if (!oResourceBundle) {
            oResourceBundle = jQuery.sap.resources({
                url: jQuery.sap.getModulePath(sPREFIX) + "/resources/resources.properties",
                language: sap.ui.getCore().getConfiguration().getLanguage()
            });
        }
        return oResourceBundle.getText(sKey, aArgs);
    }

    /**
     * Creates some SAPUI5 control telling the user that an error has occured.
     *
     * @returns {sap.ui.core.Control}
     */
    function createErrorControl() {
        return new sap.ui.core.Icon({
            size: "2rem",
            src: "sap-icon://error",
            tooltip: sap.ushell.components.container.ApplicationContainer.prototype._getTranslatedText("an_error_has_occured")
        });
    }

    /**
     * Destroys the child aggregation.
     */
    function destroyChild(oContainer) {
        var oChild = oContainer.getAggregation("child"),
            sComponentName;

        if (oChild instanceof sap.ui.core.ComponentContainer) {
            // name contains .Component - must be trimmed
            sComponentName = oChild.getComponentInstance().getMetadata().getName()
                .replace(/\.Component$/, "");
            jQuery.sap.log.debug("unloading component " + sComponentName, null, sCOMPONENT);
        }
        oContainer.destroyAggregation("child");
    }

    /**
     * Creates a new SAPUI5 view or component for the given container and makes it a child. A view
     * is created if the name ends with ".view.(viewType)".
     * @param {sap.ushell.components.container.ApplicationContainer} oContainer
     *   the container
     * @param {string} sUrl
     *   the base URL
     * @param {string} sAdditionalInformation
     *   the additional information in the form "SAPUI5=<view_or_component_name>"
     * @returns {sap.ui.core.mvc.View|sap.ui.core.Control}
     *   the view, or some "error" control
     */
    function createUi5View(oContainer, sUrl, sAdditionalInformation) {
        /*jslint regexp: true */
        var oComponent,
            oControl,
            iIndex,
            iLast,
            aMatches,
            oUrlData,
            sNamespace,
            oViewData = {},
            sViewName,
            sViewType;

        iIndex = sUrl.indexOf("?");
        if (iIndex >= 0) {
            // pass GET parameters of URL via view data
            oUrlData = sap.ushell.components.container.ApplicationContainer.prototype._getParameterMap(sUrl);
            oViewData = oUrlData.startupParameters;
            sUrl = sUrl.slice(0, iIndex);
        }

        if (sUrl.slice(-1) !== '/') {
            sUrl += '/'; // ensure URL ends with a slash
        }

        if (/\.view\.(\w+)$/i.test(sAdditionalInformation)) {
            // ends with ".view.(viewType)": a view description
            // /SAPUI5=(namespace)/(viewName).view.(viewType)/
            aMatches = /^SAPUI5=(?:([^\/]+)\/)?([^\/]+)\.view\.(\w+)$/i.exec(sAdditionalInformation);
            if (!aMatches) {
                jQuery.sap.log.error("Invalid SAPUI5 URL", sAdditionalInformation, sCOMPONENT);
                return sap.ushell.components.container.ApplicationContainer.prototype._createErrorControl();
            }
            // determine namespace, view name, and view type
            sNamespace = aMatches[1];
            sViewName = aMatches[2];
            sViewType = aMatches[3].toUpperCase(); // @see sap.ui.core.mvc.ViewType

            if (sNamespace) {
                // prefix view name with namespace
                sViewName = sNamespace + "." + sViewName;
            } else {
                // derive namespace from view name's "package"
                iLast = sViewName.lastIndexOf(".");
                if (iLast < 1) {
                    jQuery.sap.log.error("Missing namespace", sAdditionalInformation, sCOMPONENT);
                    return sap.ushell.components.container.ApplicationContainer.prototype._createErrorControl();
                }
                sNamespace = sViewName.slice(0, iLast);
            }
        } else {
            // a component
            sNamespace = sAdditionalInformation.replace(/^SAPUI5=/, "");
        }

        jQuery.sap.registerModulePath(sNamespace, sUrl + sNamespace.replace(/\./g, '/'));

        // destroy the child control before creating a new control with the same ID
        sap.ushell.components.container.ApplicationContainer.prototype._destroyChild(oContainer);
        if (sViewName) {
            if (oContainer.getApplicationConfiguration()) {
                oViewData.config = oContainer.getApplicationConfiguration();
            }
            oControl = sap.ui.view({
                id: oContainer.getId() + "-content",
                type: sViewType,
                viewData: oViewData || {},
                viewName: sViewName
            });
            oContainer.fireEvent("applicationConfiguration");
        } else {
            jQuery.sap.log.debug("loading component " + sNamespace, null, sCOMPONENT);
            // presence of startupParameters member indicates root component, thus
            // we assure it's always filled with at least empty object
            var componentData = oUrlData ? {
                startupParameters: oUrlData.startupParameters
            } : { startupParameters : {}};
            if (oUrlData && oUrlData["sap-xapp-state"]) {
                componentData["sap-xapp-state"] = oUrlData["sap-xapp-state"];
            }
            if (oContainer.getApplicationConfiguration()) {
                componentData.config = oContainer.getApplicationConfiguration();
            }

            oComponent = sap.ui.component({
                id: oContainer.getId() + "-component",
                componentData: componentData,
                name: sNamespace
            });
            //TODO ensure event is fired even in error case (try/catch)
            oContainer.fireEvent("applicationConfiguration",
                {"configuration": oComponent.getMetadata().getConfig()});
            oControl = new sap.ui.core.ComponentContainer({
                id: oContainer.getId() + "-content",
                component: oComponent
            });
        }
        oControl.setWidth(oContainer.getWidth());
        oControl.setHeight(oContainer.getHeight());
        oControl.addStyleClass("sapUShellApplicationContainer");
        // Note: As a composite control, we need to aggregate our children (at least internally)!
        oContainer.setAggregation("child", oControl, true);
        return oControl;
    }

    /**
     * publish an external event asynchronously via the event bus
     * The channel id is hard coded to sap.ushell.components.container.ApplicationContainer
     * @param {string} sEventName event name
     * @param {object} oData event parameters
     */
    function publishExternalEvent(sEventName, oData) {
        setTimeout(function () {
            sap.ui.getCore().getEventBus().publish("sap.ushell.components.container.ApplicationContainer", sEventName, oData);
        }, 0);
    }

    /**
     * Creates a new SAPUI5 component for the given container and makes it a child.
     * @param {sap.ushell.components.container.ApplicationContainer} oContainer
     *   the container
     * @param {string} sUrl
     *   the base URL
     * @param {string} sComponentName the component name
     * @returns {sap.ui.core.ComponentContainer|sap.ui.core.Control}
     *   a componentContainer for the component or or some "error" control
     */
    function createUi5Component(oContainer, sUrl, sComponentName) {
        /*jslint regexp: true */
        var iIndex,
            oComponent,
            oComponentContainer,
            oUrlData,
            oComponentData = { startupParameters : {}},
            oComponentConfig,
            oComponentHandle = oContainer.getComponentHandle(),
            oPluginManager = sap.ushell.Container.getService("PluginManager"),
            oPluginLoadingPromise,
            sPluginLoadingPromiseState;

        sap.ushell.utils.addTime("createUi5Component");
        iIndex = sUrl.indexOf("?");
        if (iIndex >= 0) {
            // pass GET parameters of URL via component data as member startupParameters and as xAppState
            // (to allow blending with other oComponentData usage, e.g. extensibility use case)
            oUrlData = sap.ushell.components.container.ApplicationContainer.prototype._getParameterMap(sUrl);
            oComponentData = {
                startupParameters : oUrlData.startupParameters
            };
            if (oUrlData["sap-xapp-state"]) {
                oComponentData["sap-xapp-state"] = oUrlData["sap-xapp-state"];
            }
            sUrl = sUrl.slice(0, iIndex);
        }

        if (oContainer.getApplicationConfiguration()) {
            oComponentData.config = oContainer.getApplicationConfiguration();
        }

        if (sUrl.slice(-1) !== '/') {
            sUrl += '/'; // ensure URL ends with a slash
        }
        // the root component's name is also the namespace for all component-internal modules; so
        // we register the URL (which must poi   nt to the component's folder) as module path;
        // TODO: clarify if there are requirements for additional path components
        jQuery.sap.registerModulePath(sComponentName, sUrl);

        // destroy the child control before creating a new control with the same ID
        sap.ushell.components.container.ApplicationContainer.prototype._destroyChild(oContainer);

        oComponentConfig = {
                id: oContainer.getId() + "-component",
                name: sComponentName,
                componentData: oComponentData
        };

        jQuery.sap.log.debug("Creating component instance for " + sComponentName, JSON.stringify(oComponentConfig), sCOMPONENT);

        sap.ui.getCore().getEventBus().publish("sap.ushell.components.container.ApplicationContainer", "_prior.newUI5ComponentInstantion",
            {
                name : sComponentName
            }
        );

        if (oComponentHandle) {
            oComponent = oComponentHandle.getInstance(oComponentConfig);
        } else {
            jQuery.sap.log.error("No component handle available for '" + sComponentName + "'; fallback to component.load()", null, sCOMPONENT);
            oComponent = sap.ui.component({
                id: oContainer.getId() + "-component",
                name: sComponentName,
                componentData: oComponentData
            });
        }
        //TODO ensure event is fired even in error case (try/catch)
        oContainer.fireEvent("applicationConfiguration",
                {"configuration": oComponent.getMetadata().getConfig()});
        oComponentContainer = new sap.ui.core.ComponentContainer({
            id: oContainer.getId() + "-content",
            component: oComponent
        });

        oComponentContainer.setHeight(oContainer.getHeight());
        oComponentContainer.setWidth(oContainer.getWidth());
        oComponentContainer.addStyleClass("sapUShellApplicationContainer");
        oContainer._disableRouterEventHandler = sap.ushell.components.container.ApplicationContainer.prototype._disableRouter.bind(this, oComponent);
        sap.ui.getCore().getEventBus().subscribe("sap.ushell.components.container.ApplicationContainer","_prior.newUI5ComponentInstantion", oContainer._disableRouterEventHandler);

        // Note: As a composite control, we need to aggregate our children (at least internally)!
        oContainer.setAggregation("child", oComponentContainer, true);

        if (oPluginManager) {
            oPluginLoadingPromise = oPluginManager.getPluginLoadingPromise("RendererExtensions");
            sPluginLoadingPromiseState = oPluginLoadingPromise && oPluginLoadingPromise.state();
            if (sPluginLoadingPromiseState === "pending") {
                oPluginLoadingPromise.done(function () {
                    sap.ushell.components.container.ApplicationContainer.prototype._publishExternalEvent("componentCreated", { component: oComponent });
                })
                .fail(function () {
                    sap.ushell.components.container.ApplicationContainer.prototype._publishExternalEvent("componentCreated", { component: oComponent });
                });
            }

            if (sPluginLoadingPromiseState === "resolved" || sPluginLoadingPromiseState === "rejected") {
                sap.ushell.components.container.ApplicationContainer.prototype._publishExternalEvent("componentCreated", { component: oComponent });
            }
        }

        sap.ushell.components.container.ApplicationContainer.prototype._publishExternalEvent("componentCreated", { component: oComponent });
        return oComponentContainer;
    }


    /**
     * Invoke <code>getRouter.stop()<code> on the oComponentAn event handler for the onNewAppInstantiated event
     * @param {object} oComponent
     *   a SAPUI5 Component instance
     */
    function disableRouter(oComponent) {
        var rt;
        if ((oComponent instanceof sap.ui.core.Component) && (typeof oComponent.getRouter === "function")) {
            rt = oComponent.getRouter();
            if (rt && (typeof rt.stop === "function")) {
                jQuery.sap.log.info("router stopped for instance " + oComponent.getId());
                rt.stop();
            }
        }
    }

    /**
     * Creates a system object that describes the URL's server.
     * @param {string} sUrl
     *   the URL
     * @param {object}
     *   the system object with <code>alias</code>, <code>baseUrl</code> describing the URL's
     *   server and <code>client</code> the client from the request property
     *   <code>sap-client</code>.
     */
    function createSystemForUrl(sUrl) {
        var oAnchor = document.createElement("a"),
            sClient = jQuery.sap.getUriParameters(sUrl).get("sap-client"),
            sBase;

        oAnchor.href = sUrl;
        sBase = oAnchor.protocol + "//" + oAnchor.host;
        return new sap.ushell.System({
            alias: sClient ? sBase + "?sap-client=" + sClient : sBase,
            baseUrl: sBase,
            client: sClient || undefined,
            platform: "abap"
        });
    }

    /**
     * Determine if the source of a received postMessage can be considered as trusted. We consider
     * the content window of the application container's iframe as trusted, plus any other window
     * with the same origin in case of application type NWBC.
     *
     * @param {object} oContainer
     *   the application container instance
     * @param {object} oMessage
     *   the postMessage event object
     * @returns {boolean}
     *   true if source is considered to be trustworthy
     * @private
     * @since 1.24
     */
    function isTrustedPostMessageSource(oContainer, oMessage) {
        var bTrusted = false,
            oDomRef = oContainer.getDomRef(),
            sApplicationType = oContainer.getApplicationType(),
            oUri,
            sOrigin;

        if (oDomRef) {
            if (sap.ushell.utils.isApplicationTypeNWBCRelated(sApplicationType)) {
                // if our frame embeds an NWBC application, we trust the frame itself and all frames from the same origin
                // this is required to support the WDA intent-based navigation scenario
                oUri = URI(oDomRef.src);
                sOrigin = oUri.protocol() + "://" + oUri.host();

                bTrusted = (oMessage.source === oDomRef.contentWindow) || (oMessage.origin === sOrigin);
            } else if (sApplicationType === sap.ushell.components.container.ApplicationType.URL) {
                // if our frame embeds an arbitrary URL application, we only trust it if it's from the same origin than our own page
                // for generalization of the feature, we would need some white list check here; right now, we need application type URL
                // only for testing
                oUri = URI();
                sOrigin = oUri.protocol() + "://" + oUri.host();

                bTrusted = (oMessage.origin === sOrigin);
            }
        }

        return bTrusted;
    }

    /**
     * Callback for the back button registered via
     * <code>sap.ushell.ui5service.ShellUIService#setBackNavigation</code>
     *
     * Sends a postMessage request to the source window for triggering the
     * back navigation in the application.
     *
     * @param {object} oSourceWindow
     *   the source window object
     * @param {string} sServiceName
     *   the service name returned from the previous setBackNavigation
     *   postMessage request
     * @param {string} sOrigin
     *   a string identifying the origin where the message is sent from
     */
    function backButtonPressedCallback(oSourceWindow, sServiceName, sOrigin) {
        var sRequestData = JSON.stringify({
            type: "request",
            service: sServiceName,
            request_id: jQuery.sap.uid(),
            body: {}
        });

        jQuery.sap.log.debug("Sending post message request to origin ' " + sOrigin + "': " + sRequestData,
                null,
                "sap.ushell.components.container.ApplicationContainer");

        oSourceWindow.postMessage(sRequestData, sOrigin);
    }

    /**
     * Helper method for handling service invocation via post message events
     * <p>
     * This feature is disabled by default, because it is not consumed by WebDynpro ABAP in version 1.24 (UI Add-on SP10).
     * It can be enabled via launchpad configuration as follows (not a public option, might be changed later):
     * <code>
     *  {
     *      services: {
     *          PostMessage: {
     *              config: {
     *                  enabled: true
     *              }
     *          }
     *      }
     *  }
     * </code>
     *
     * @param {object} oContainer the ApplicationContainer instance
     * @param {Event} oMessage
     *   the received postMessage event
     * @param {object] oMessageData the parsed message data
     *
     * @private
     * @since 1.24
     *
     */
    function handleServiceMessageEvent(oContainer, oMessage, oMessageData) {
        // we anticipate the PostMessage service for the configuration although it's not there
        // (if it doesn't come, we'll just remove the configuration option)
        var oPostMessageServiceConfig = jQuery.sap.getObject("sap-ushell-config.services.PostMessage.config", 0),
            sService = oMessageData && oMessageData.service,
            sServiceName;

        jQuery.sap.log.debug("Received post message request from origin '" + oMessage.origin + "': "
            + JSON.stringify(oMessageData),
            null,
            "sap.ushell.components.container.ApplicationContainer");

        if (oMessageData.type !== "request" || !sService || (
                sService.indexOf("sap.ushell.services.CrossApplicationNavigation") !== 0
                && sService.indexOf("sap.ushell.CrossApplicationNavigation") !== 0
                && sService.indexOf("sap.ushell.ui5service.ShellUIService") !== 0
                && sService.indexOf("sap.ushell.services.Container") !== 0
        )) {
            // silently ignore any other messages
            return;
        }

        sServiceName = sService.split(".")[3];

        if (oPostMessageServiceConfig && oPostMessageServiceConfig.enabled === false) {
            jQuery.sap.log.warning("Received message for " + sServiceName + ", but this " +
                    "feature is disabled. It can be enabled via launchpad configuration " +
                    "property 'services.PostMessage.config.enabled: true'",
                    undefined, "sap.ushell.components.container.ApplicationContainer");
            return;
        }

        if (!sap.ushell.components.container.ApplicationContainer.prototype._isTrustedPostMessageSource(oContainer, oMessage)) {
            // log w/ warning level, message would normally processed by us
            jQuery.sap.log.warning("Received message from untrusted origin '" + oMessage.origin + "': "
                + JSON.stringify(oMessage.data),
                null, "sap.ushell.components.container.ApplicationContainer");
            return;
        }

        /**
         * Sends the response message in the expected format
         */
        function sendResponseMessage(sStatus, oBody) {
            var sResponseData = JSON.stringify({
                type: "response",
                service: oMessageData.service,
                request_id: oMessageData.request_id,
                status: sStatus,
                body: oBody
            });

            jQuery.sap.log.debug("Sending post message response to origin ' " + oMessage.origin + "': "
                + sResponseData,
                null,
                "sap.ushell.components.container.ApplicationContainer");

            oMessage.source.postMessage(sResponseData, oMessage.origin);
        }

        function executeSetBackNavigationService(oMessage, oMessageData) {
            var oDeferred = new jQuery.Deferred(),
                fnCallback;
            if (oMessageData.body && oMessageData.body.callbackMessage && oMessageData.body.callbackMessage.service) {
                fnCallback = sap.ushell.components.container.ApplicationContainer.prototype._backButtonPressedCallback.bind(
                    null,
                    oMessage.source,
                    oMessageData.body.callbackMessage.service,
                    oMessage.origin
                );
            } // empty body or callback message will call the setBackNavigation with undefined, this should reset the back button callback
            oDeferred.resolve(oContainer.getShellUIService().setBackNavigation(fnCallback));
            return oDeferred.promise();
        }

        /**
         * Executes the service call and returns a promise. In case that the service call is
         * not asynchronous the promise will be resolved immediately.
         * This function maps a semantic service name on a concrete service implementation
         * @param {string} sServiceName the service name of the post message exposed services
         * @returns {object} promise or undefined, if invalid service name
         */
        function executeServiceCall(sServiceName) {
            switch (sServiceName) {
            case "sap.ushell.services.CrossApplicationNavigation.hrefForExternal":
                return new jQuery.Deferred().resolve(sap.ushell.Container.getService("CrossApplicationNavigation").hrefForExternal(oMessageData.body.oArgs)).promise();
            case "sap.ushell.services.CrossApplicationNavigation.getSemanticObjectLinks":
                // beware sSemanticObject may also be an array of argument arrays
                // {sSemanticObject, mParameters, bIgnoreFormFactors }
                return sap.ushell.Container.getService("CrossApplicationNavigation").getSemanticObjectLinks(oMessageData.body.sSemanticObject, oMessageData.body.mParameters, oMessageData.body.bIgnoreFormFactors, undefined, undefined, oMessageData.body.bCompactIntents);
            case "sap.ushell.services.CrossApplicationNavigation.isIntentSupported":
                return sap.ushell.Container.getService("CrossApplicationNavigation").isIntentSupported(oMessageData.body.aIntents);
            case "sap.ushell.services.CrossApplicationNavigation.isNavigationSupported":
                return sap.ushell.Container.getService("CrossApplicationNavigation").isNavigationSupported(oMessageData.body.aIntents);
            case "sap.ushell.services.CrossApplicationNavigation.toExternal":
                return new jQuery.Deferred().resolve(sap.ushell.Container.getService("CrossApplicationNavigation").toExternal(oMessageData.body.oArgs)).promise();
            case "sap.ushell.CrossApplicationNavigation.backToPreviousApp":
                sap.ushell.Container.getService("CrossApplicationNavigation").backToPreviousApp();
                return new jQuery.Deferred().resolve().promise();
            case "sap.ushell.services.CrossApplicationNavigation.backToPreviousApp":
                sap.ushell.Container.getService("CrossApplicationNavigation").backToPreviousApp();
                return new jQuery.Deferred().resolve().promise();
            case "sap.ushell.services.CrossApplicationNavigation.historyBack":
                sap.ushell.Container.getService("CrossApplicationNavigation").historyBack(oMessageData.body.iSteps);
                return new jQuery.Deferred().resolve().promise();
            case "sap.ushell.services.CrossApplicationNavigation.getAppStateData":
                // note: sAppStateKey may be an array of argument arrays
                return sap.ushell.Container.getService("CrossApplicationNavigation").getAppStateData(oMessageData.body.sAppStateKey);
            case "sap.ushell.ui5service.ShellUIService.setTitle":
                return new jQuery.Deferred().resolve(oContainer.getShellUIService().setTitle(oMessageData.body.sTitle)).promise();
            case "sap.ushell.ui5service.ShellUIService.setBackNavigation":
                return executeSetBackNavigationService(oMessage, oMessageData);
            case "sap.ushell.services.Container.setDirtyFlag":
                sap.ushell.Container.setDirtyFlag(oMessageData.body.bIsDirty);
                return new jQuery.Deferred().resolve().promise();
            default:
                return undefined;
            }
        }

        try {
            executeServiceCall(oMessageData.service)
                .done(function (oResult) {
                    sendResponseMessage("success", {result: oResult});
                })
                .fail(function (sMessage) {
                    sendResponseMessage("error", {message: sMessage});
                });
        } catch (oError) {
            sendResponseMessage("error", {message: oError.message});
        }
    }

    /**
     * Event handler receiving post message events
     *
     * @param {Event} oMessage
     *   the received postMessage event
     *
     * @private
     * @since 1.21.2
     *
     */
    function handleMessageEvent(oContainer, oMessage) {
        var sUi5ComponentName = oContainer && oContainer.getUi5ComponentName && oContainer.getUi5ComponentName();
        if (typeof sUi5ComponentName === "string") {
            jQuery.sap.log.debug(
                "Skipping handling of postMessage 'message' event on container of UI5 application '" + sUi5ComponentName + "'",
                "Only non UI5 application containers can handle 'message' postMessage event",
                "sap.ushell.components.container.ApplicationContainer"
            );
            return;
        }

        var oMessageData = oMessage.data;

        if (typeof oMessageData === "string") {
            // it's possible that the data attribute is passed as string (IE9)
            try {
                oMessageData = JSON.parse(oMessage.data);
            } catch (e) {
                // could be some message which is not meant for us, so we just log with debug level
                jQuery.sap.log.debug(
                    "Message received from origin '" + oMessage.origin + "' cannot be parsed: " + e,
                    oMessageData,
                    "sap.ushell.components.container.ApplicationContainer"
                );
                return;
            }
        }
        if (oMessageData.action === "pro54_setGlobalDirty" &&
                localStorage.getItem(oContainer.globalDirtyStorageKey) ===
                sap.ushell.Container.DirtyState.PENDING) {
            if (!sap.ushell.components.container.ApplicationContainer.prototype._isTrustedPostMessageSource(oContainer, oMessage)) {
                // log w/ warning level, message would normally processed by us
                jQuery.sap.log.warning("Received message from untrusted origin: " + oMessage.origin,
                        oMessageData, "sap.ushell.components.container.ApplicationContainer");
                return;
            }
            jQuery.sap.log.debug("getGlobalDirty() pro54_setGlobalDirty SetItem key:" +
                oContainer.globalDirtyStorageKey + " value: " +
                oMessageData.parameters.globalDirty,
                null,
                "sap.ushell.components.container.ApplicationContainer"
                );
            sap.ushell.utils.localStorageSetItem(oContainer.globalDirtyStorageKey,
                oMessageData.parameters.globalDirty, true);
        } else {
            // delegate to separate method for CrossAppNavigation invocation
            sap.ushell.components.container.ApplicationContainer.prototype._handleServiceMessageEvent(oContainer, oMessage, oMessageData);
        }
    }

    /**
     * Logout Event Handler.
     * Calls the logout URL when the NWBC is used in the canvas.
     *
     * @param {sap.ushell.components.container.ApplicationContainer} oContainer
     *   application container having the NWBC iframe
     * @param {sap.ui.base.Event} oEvent
     *   oEvent.preventDefault() is called to let the caller know that the
     *   following redirect has to be deferred in order get the NWBC logout done.
     *
     * @private
     */
    function logout(oContainer, oEvent) {
        var oIframe = oContainer.getDomRef(),
            sApplicationType = oContainer.getApplicationType();

        if (sap.ushell.utils.isApplicationTypeNWBCRelated(oContainer.getApplicationType(sApplicationType)) &&
                oIframe && oIframe.tagName === "IFRAME") {
            oIframe.contentWindow.postMessage(JSON.stringify(
                { action: "pro54_disableDirtyHandler"}
            ), '*');
            // tell caller that at least one NWBC needs some time to receive a message
            oEvent.preventDefault();
        }
    }

    /**
     * Renders the given child control inside a DIV representing the given container.
     *
     * @param {sap.ui.core.RenderManager} oRenderManager
     * @param {sap.ushell.components.container.ApplicationContainer} oContainer
     *     the application container which is "replaced" by the error control
     * @param {sap.ui.core.Control} [oChild]
     */
    function renderControlInDiv(oRenderManager, oContainer, oChild) {
        oRenderManager
            .write("<div")
            .writeControlData(oContainer)
            .writeAccessibilityState(oContainer)
            .addClass("sapUShellApplicationContainer")
            .writeClasses(oContainer)
            .addStyle("height", oContainer.getHeight())
            .addStyle("width", oContainer.getWidth())
            .writeStyles()
            .write(">")
            .renderControl(oChild);
        oRenderManager
            .write("</div>");
    }

    /**
     * Appends a sap-shell parameter to the given URL to
     * indicate the FLP version to legacy applications.
     *
     * <p>
     * This method should be called only when it is
     * necessary to add the sap-shell parameter to the
     * URL.
     * </p>
     *
     * @param {string} sUrl
     *    the url to be amended
     * @param {string} sApplicationType
     *    the application type for the given URL
     * @return {string}
     *    the URL where the parameter should be appended to.
     * @private
     */
    function appendSapShellParam(sUrl, sApplicationType) {
        var sUrlSuffix = sApplicationType === "TR"
            ? ""
            : "-NWBC";

        var sVersion,
            getVersion = function () {
                var sVersion,
                    oMatch;

                try { // in the sandbox localhost scenario, sap.ui.getVersionInfo() triggers an exception
                    sVersion = sap.ui.getVersionInfo().version;
                } catch (e) {
                    jQuery.sap.log.error("sap ui version could not be determined, using sap.ui.version (core version) as fallback " + e);
                    sVersion = window.sap && sap.ui && sap.ui.version;
                }

                oMatch = /\d+\.\d+\.\d+/.exec(sVersion);
                if (oMatch && oMatch[0]) {
                    sVersion = oMatch[0];
                } else {
                    sVersion = undefined;
                }

                return sVersion;
            };

        sVersion = getVersion();
        if (sVersion) {
            // we pass it either completely or not at all
            sUrl += sUrl.indexOf("?") >= 0 ? "&" : "?";
            sUrl += "sap-shell=" + encodeURIComponent("FLP" + sVersion + sUrlSuffix);
        }
        return sUrl;
    }

    /**
     * Amends the NavTargetResolution response with theme, sap-ushell-version, accessibility and post parameters if present.
     * Theme and accessibility information is only added for the NWBC application type.
     *
     * @param {string} sUrl
     *   Already resolved url (NavTargetResolution response)
     * @param {string} sUrlApplicationType
     *   The application type of <code>sUrl</code>
     * @param {string} sExternalNavigationMode
     *   The (external) navigation mode to add in the sap-target-navmode parameter
     * @returns {string}
     *   Modified url having additional parameters
     * @private
     */
    function adjustNwbcUrl(sUrl, sUrlApplicationType, sExternalNavigationMode) {
        var sTheme,
            getAccessibility = function () {
                var vUrl = sap.ushell.utils.getParameterValueBoolean("sap-accessibility");
                if (vUrl !== undefined) {
                    return vUrl;
                }
                return sap.ushell.Container.getUser().getAccessibilityMode();
            },
            getStatistics = function () {
                var bAddStatistics = false,
                    oResolvedUrlParameters = jQuery.sap.getUriParameters(sUrl) || { mParams : {}};

                // To take care of the precedence of the intent over UI5 configuration
                 bAddStatistics = sap.ui.getCore().getConfiguration().getStatistics()
                     && !oResolvedUrlParameters.mParams.hasOwnProperty("sap-statistics");
                return bAddStatistics;
            };

        // force IE to edge mode
        sUrl += sUrl.indexOf("?") >= 0 ? "&" : "?";
        sUrl += "sap-ie=edge";
        // transport sap-theme to NWBC HTML
        sTheme = sap.ushell.Container.getUser()
            .getTheme(sap.ushell.User.prototype.constants.themeFormat.NWBC);

        if (sTheme) {
            sUrl += sUrl.indexOf("?") >= 0 ? "&" : "?";
            sUrl += "sap-theme=" + encodeURIComponent(sTheme);
            // note, we do not replace existing parameters
        }
        if (sExternalNavigationMode) {
            sUrl += sUrl.indexOf("?") >= 0 ? "&" : "?";
            sUrl += "sap-target-navmode=" + encodeURIComponent(sExternalNavigationMode);
            // note, we do not replace existing parameters
        }
        if (getAccessibility()) {
            // propagate accessibility mode
            // Note: This is handled by the WebGUI/WDA framework which expects a value of "X"!
            sUrl += sUrl.indexOf("?") >= 0 ? "&" : "?";
            sUrl += "sap-accessibility=X";
            // note, we do not replace existing parameters
        }
        if (getStatistics()) {
            // propagate statistics = true
            // Note: This is handled by the IFC handler on ABAP, which expects a value of "true" (not "X")
            sUrl += sUrl.indexOf("?") >= 0 ? "&" : "?";
            sUrl += "sap-statistics=true";
            // note, we do not replace existing parameters
        }

        return appendSapShellParam(sUrl, sUrlApplicationType);
    }

    /**
     * Renders the SAPUI5 component with the given name and URL. If the child aggregation is already set and no properties have changed,
     * the component is not recreated.
     */
    function renderUi5Component(oRenderManager, oContainer, sUrl, sComponentName) {
        var oChild = oContainer.getAggregation("child");

        if (!oChild || oContainer._bRecreateChild) {
            oChild = sap.ushell.components.container.ApplicationContainer.prototype._createUi5Component(oContainer, sUrl, sComponentName);
            oContainer._bRecreateChild = false;
        }

        sap.ushell.components.container.ApplicationContainer.prototype._renderControlInDiv(oRenderManager, oContainer, oChild);
    }

    /**
     * Sets the property with the specified key and value and sets the flag _bPropertyChanged to true
     */
    function setProperty(oContainer, sKey, vValue) {
        var vOldValue = oContainer.getProperty(sKey);

        if (jQuery.sap.equal(vOldValue, vValue)) {
            return;
        }

        oContainer.setProperty(sKey, vValue);
        oContainer._bRecreateChild = true;
    }

    /**
     * Renders the given container control with the help of the given render manager using the given
     * attributes.
     *
     * @param {sap.ui.core.RenderManager} oRenderManager
     * @param {sap.ushell.components.container.ApplicationContainer} oContainer
     * @param {sap.ushell.components.container.ApplicationType} sApplicationType
     *   the application type
     * @param {string} sUrl
     *   the base URL
     * @param {string} sAdditionalInformation
     *   the additional information in the form "SAPUI5=&lt;view name&gt;"
     */
    function render(oRenderManager, oContainer, sApplicationType, sUrl, sAdditionalInformation) {
        var fnLogout;

        // remove container from list of NWBC-containing containers
        // (if this container was an NWBC container before)
        localStorage.removeItem(oContainer.globalDirtyStorageKey);

        // render as SAPUI5 component if specified in additionalInformation
        if (sAdditionalInformation &&
                sAdditionalInformation.indexOf("SAPUI5.Component=") === 0 &&
                sApplicationType === sap.ushell.components.container.ApplicationType.URL) {

            renderUi5Component(oRenderManager, oContainer, sUrl, sAdditionalInformation.replace(/^SAPUI5\.Component=/, ""));
            return;
        }

        // render as SAPUI5 view if specified in additionalInformation
        if (sAdditionalInformation
                && sAdditionalInformation.indexOf("SAPUI5=") === 0
                && sApplicationType === sap.ushell.components.container.ApplicationType.URL) {
            sap.ushell.components.container.ApplicationContainer.prototype._renderControlInDiv(oRenderManager, oContainer,
                    sap.ushell.components.container.ApplicationContainer.prototype._createUi5View(oContainer, sUrl, sAdditionalInformation));
            return;
        }
        jQuery.sap.log.debug("Not resolved as \"SAPUI5.Component=\" or \"SAPUI5=\" , " +
            "will attempt to load into iframe " + sAdditionalInformation);

        try {
            sUrl = oContainer.getFrameSource(sApplicationType, sUrl, sAdditionalInformation);
        } catch (ex) {
            jQuery.sap.log.error(ex.message || ex, null, sCOMPONENT);
            oContainer.fireEvent("applicationConfiguration");
            oRenderManager.renderControl(sap.ushell.components.container.ApplicationContainer.prototype._createErrorControl());
            return;
        }

        if (sap.ushell.Container) {
            fnLogout = sap.ushell.components.container.ApplicationContainer.prototype._getLogoutHandler(oContainer);
            if (!fnLogout) {
                if (sap.ushell.utils.isApplicationTypeNWBCRelated(sApplicationType)) {
                    // create only for NWBC if not already existing
                    fnLogout = sap.ushell.components.container.ApplicationContainer.prototype._logout.bind(null, oContainer);
                    mLogouts.put(oContainer.getId(), fnLogout);
                    sap.ushell.Container.attachLogoutEvent(fnLogout);
                    sap.ushell.Container.addRemoteSystem(sap.ushell.components.container.ApplicationContainer.prototype._createSystemForUrl(sUrl));
                }
            } else {
                if (!sap.ushell.utils.isApplicationTypeNWBCRelated(sApplicationType)) {
                    // detach if not used *anymore*
                    sap.ushell.Container.detachLogoutEvent(fnLogout);
                    mLogouts.remove(oContainer.getId());
                }
            }
        }

        if (sap.ushell.utils.isApplicationTypeNWBCRelated(sApplicationType)) {
            var sExternalNavigationMode = oContainer.getExternalNavigationMode();

            // amend already resolved url with additional parameters
            sUrl = sap.ushell.components.container.ApplicationContainer.prototype._adjustNwbcUrl(sUrl, sApplicationType, sExternalNavigationMode);

            // add this container to list of NWBC-containing containers
            sap.ushell.utils.localStorageSetItem(oContainer.globalDirtyStorageKey,
                sap.ushell.Container.DirtyState.INITIAL);
        }

        // embed URL via <IFRAME>
        oContainer.fireEvent("applicationConfiguration");
        oRenderManager
            .write("<iframe")
            .writeControlData(oContainer)
            .writeAccessibilityState(oContainer)
            .writeAttributeEscaped("src", sUrl)
            .addClass("sapUShellApplicationContainer")
            .writeClasses(oContainer)
            .addStyle("height", oContainer.getHeight())
            .addStyle("width", oContainer.getWidth())
            .writeStyles()
            .write("></iframe>");
    }

    /**
     * Creates a new container control embedding the application with the given URL. The default
     * application type is "URL" and allows to embed web applications into an <code>IFRAME</code>.
     * By default, the container is visible and occupies the whole width and height of its parent.
     *
     * @class A container control capable of embedding a variety of application types.
     * <p>
     * <strong>Experimental API: This container is still under construction, so some
     * implementation details can be changed in future.</strong>
     * </p><p>
     * <b>Note:</b> The browser does not allow to move an <code>IFRAME</code> around in the DOM
     * while keeping its state. Thus every rerendering of this control necessarily resets the
     * embedded web application to its initial state!
     * </p><p>
     * <b>Note:</b> You <b>must</b> <code>exit</code> the control when you no longer need it.
     *
     * </p><p>
     * <b>Embedding SAPUI5 Components:</b>
     * </p><p>
     * The container is able to embed an SAPUI5 component. It is embedded directly into the page,
     * no <code>IFRAME</code> is used.
     * </p><p>
     * SAPUI5 components are described with <code>applicationType</code> "URL", a base URL and the
     * component name in <code>additionalInformation</code>. The format is
     * <code>SAPUI5=<i>componentNamespace</i></code>. The application container will register a
     * module path for the URL with the component's namespace.
     * </p><p>
     * The query parameters from the URL will be passed into the component. They can be retrieved
     * using the method <code>getComponentData()</code>. Query parameters are always passed as
     * arrays (see example 2 below).
     * </p><p>
     * <b>Example 1:</b> Let <code>url</code> be "http://anyhost:1234/path/to/app" and
     * <code>additionalInformation</code> be "SAPUI5=some.random.package". Then the
     * container registers the path "http://anyhost:1234/path/to/app/some/random/package" for the
     * namespace "some.random.package", loads and creates "some.random.package.Component".
     * </p><p>
     * <b>Example 2:</b> Let <code>url</code> be "http://anyhost:1234/?foo=bar&foo=baz&bar=baz".
     * Then the <code>componentData</code> object will be
     * <code>{foo: ["bar", "baz"], bar: ["baz"]}</code>.
     * </p><p>
     * <b>Warning:</b> The container control embeds a <i>component</i> only. This can only work if
     * this component is fully encapsulated and properly declares all dependencies in its metadata
     * object. If you want to support that your component can be embedded into a shell using this
     * container, you have to prepare it accordingly:
     * <ul>
     * <li>The container control can only embed components that originate on the same server as the
     * shell due to the browser's same origin policy. Consider using an SAP Web Dispatcher if this
     * is not the case.
     * <li>If your component relies on some additional Javascript, declare the dependencies to
     * libraries or other components in the component's metadata object.
     * <li>Do <i>not</i> use <code>jQuery.sap.registerModulePath()</code> with a relative URL. The
     * base for this relative URL is the web page. And this page is the shell when embedding the
     * component via the container, not the page you used when developing the component.
     * <li>If your component needs additional styles, declare them using the <code>includes</code>
     * property of the component metadata object.
     * <li> Consider calling <code>jQuery.sap.getModulePath(&lt;componentName&gt;)</code> to
     * determine the root path of your component.
     * <li>If any of these requirements is not met, it is still possible to embed this view with
     * its own page using <code>applicationType="URL"</code>, no <code>additionalInformation</code>
     * and the URL of the web page in <code>url</code>. Then of course it is embedded using an
     * <code>IFRAME</code>. This has many limitations, especially the resource-based navigation
     * using hash changes will not be supported.
     * </ul>
     *
     * </p><p>
     * <b>Embedding SAPUI5 Views</b>
     * <p>
     * Embedding views is <strong>deprecated</strong> and might not be supported in future versions.
     * </p>
     * <p>
     * It is also possible to embed a SAPUI5 view. It is embedded directly into the page, no
     * <code>IFRAME</code> is used.
     * </p><p>
     * SAPUI5 views are described with <code>applicationType</code> "URL", a base URL and the view
     * description in <code>additionalInformation</code>. The format is
     * <code>SAPUI5=<i>namespace</i>.<i>viewName</i>.view.<i>viewType</i></code>. From
     * this information the module path and the view URL is determined. Request parameters present
     * in the URL will be passed to the created view and can be accessed via
     * <code>sap.ui.core.mvc.View#getViewData()</code>. The object passed to the view data is the
     * same as describe for the component data above.
     * </p><p>
     * <b>Warning:</b> The container control embeds a <i>view</i> only. So similar restrictions
     * as for components apply. Since the view has no metadata object to describe dependencies you
     * will have to use <code>jQuery.sap.require()</code> to load needed modules and
     * <code>jQuery.sap.includeStyleSheet()</code> to load additional styles.
     *
     * @extends sap.ui.core.Control
     * @name sap.ushell.components.container.ApplicationContainer
     * @since 1.15.0
     *
     * @property {string} [additionalInformation=""]
     *   Additional information about the application. Currently this is used to describe a SAPUI5
     *   component or a view in a SAPUI5 application.
     * @property {object} [application]
     *   The application descriptor as received from the start-up service. If an application is
     *   given the properties <code>url</code>, <code>applicationType</code> and
     *   <code>additionalInformation</code> are taken from the application and <i>not</i> from the
     *   control properties.
     * @property {object} [applicationConfiguration]
     *   The configuration data of this application as defined in the application descriptor
     *    or in the flexible configuration object.
     * @property {object} [componentHandle]
     *   The component handle - for SAPUI5 components, this contains a handle to the
     *   component metadata and constructor which might already be loaded
     * @property {sap.ushell.components.container.ApplicationType} [applicationType="URL"]
     *   The type of the embedded application.
     * @property {sap.ui.core.CSSSize} [height="100%"]
     *   The container's height as a CSS size. This attribute is provided to the browser "as is"!
     *   <b>Note:</b> The HTML 4.01 specification allows pixels and percentages,
     *   but the HTML 5 specification allows pixels only!
     * @property {string} url
     *   The URL to the embedded application.
     * @property {boolean} [visible="true"]
     *   Whether the container control is visible at all. <b>Note:</b> An invisible container does
     *   not render any DOM content. Changing the visibility leads to rerendering!
     * @property {sap.ui.core.CSSSize} [width="100%"]
     *   The container's width as a CSS size. This attribute is provided to the browser "as is"!
     *   <b>Note:</b> The HTML 4.01 specification allows pixels and percentages,
     *   but the HTML 5 specification allows pixels only!
     */
    /**
     * Event which is fired when the <code>ApplicationContainer</code> control is rendered. The
     * event holds a technology specific configuration object for the embedded application.
     * As of now, only configuration for an embedded <em>SAPUI5 component</em> is supported.
     *
     * @event
     * @name sap.ushell.components.container.ApplicationContainer.applicationConfiguration
     * @param {object} configuration
     *     The technology specific configuration object of the embedded application.
     *     <code>undefined</code>, if the <code>ApplicationContainer</code> control does not
     *     provide a configuration for the technology of the embedded application or if there is a
     *     rendering issue with the application.<br/>
     *     For SAPUI5 components, the <code>config</code> property of the component metadata is
     *     provided.
     *
     * @public
     */
    sap.ui.core.Control.extend(sCOMPONENT, {
        metadata: {
            properties: {
                additionalInformation: {defaultValue: "", type: "string"},
                application: {type: "object"},
                applicationConfiguration: {type: "object"},
                applicationType: {defaultValue: "URL", type: sPREFIX + "ApplicationType"},
                height: {defaultValue: "100%", type: "sap.ui.core.CSSSize"},
                navigationMode: {defaultValue : "", type: "string"},
                externalNavigationMode: {defaultValue : "", type: "string"},
                text: {defaultValue : "", type: "string"},
                url: {defaultValue: "", type: "string"},
                visible: {defaultValue: true, type: "boolean"},
                "sap-system" : {defaultValue : undefined, type : "string"},
                applicationDependencies : {type : "object"},
                componentHandle : {type : "object"},
                ui5ComponentName : {type : "string"},
                width: {defaultValue: "100%", type: "sap.ui.core.CSSSize"},
                shellUIService: { type: "object" },
                reservedParameters: { type: "object" },
                coreResourcesFullyLoaded: { type: "boolean" }
            },
            events: {
                "applicationConfiguration": {}
            },
            aggregations: {
                child: {multiple: false, type: "sap.ui.core.Control", visibility: "hidden"}
            },
            library: "sap.ushell"
        },

        exit: function () {
            var fnLogout,
                that = this;
            if (sap.ushell.Container) {
                fnLogout = sap.ushell.components.container.ApplicationContainer.prototype._getLogoutHandler(that);
                if (fnLogout) {
                    sap.ushell.Container.detachLogoutEvent(fnLogout);
                    mLogouts.remove(that.getId());
                }
            }
            // remove container from list of NWBC-containing containers
            // (if this container was an NWBC container before)
            localStorage.removeItem(that.globalDirtyStorageKey);

            // remove all event listeners
            if (that._unloadEventListener) {
                removeEventListener("unload", that._unloadEventListener);
            }

            if (that._disableRouterEventHandler) {
                sap.ui.getCore().getEventBus().unsubscribe("sap.ushell.components.container.ApplicationContainer", "_prior.newUI5ComponentInstantion", that._disableRouterEventHandler);//{ sValue : sServiceUrl }
            }

            if (that._storageEventListener) {
                removeEventListener("storage", that._storageEventListener);
            }

            if (that._messageEventListener) {
                removeEventListener("message", that._messageEventListener);
            }

            sap.ushell.components.container.ApplicationContainer.prototype._destroyChild(that);

            // just to be sure in case it will be added some time
            if (sap.ui.core.Control.exit) {
                sap.ui.core.Control.exit.apply(that);
            }
        },

        /**
         * Initialization of <code>ApplicationContainer</code> instance.
         */
        init: function () {

            var that = this;
            that.globalDirtyStorageKey = sDIRTY_STATE_PREFIX + jQuery.sap.uid();

            // be sure to remove entry from list of NWBC-containing containers
            // when the window is closed
            that._unloadEventListener = that.exit.bind(that);
            addEventListener("unload", that._unloadEventListener); //TODO doesn't work in IE9 when F5 is pressed?!

            that._storageEventListener =  function (oStorageEvent) {
                var sApplicationType = that.getApplicationType();
                if (oStorageEvent.key === that.globalDirtyStorageKey
                        && oStorageEvent.newValue ===  sap.ushell.Container.DirtyState.PENDING
                        && sap.ushell.utils.isApplicationTypeNWBCRelated(sApplicationType)) {

                    var oIframe = that.getDomRef();
                    if (oIframe && oIframe.tagName === "IFRAME") {
                        jQuery.sap.log.debug(
                            "getGlobalDirty() send pro54_getGlobalDirty ",
                            null,
                            "sap.ushell.components.container.ApplicationContainer"
                        );
                        oIframe.contentWindow.postMessage(
                            JSON.stringify({action: "pro54_getGlobalDirty"}),
                            '*'
                        );
                    }
                }
            };
            addEventListener('storage', that._storageEventListener);

            that._messageEventListener = sap.ushell.components.container.ApplicationContainer.prototype._handleMessageEvent.bind(null, that);
            addEventListener('message', that._messageEventListener);
        },

        /**
         * Renders the given container control with the help of the given render manager.
         *
         * @param {sap.ui.core.RenderManager} oRenderManager
         * @param {sap.ushell.components.container.ApplicationContainer} oContainer
         *
         * @private
         */
        renderer: function (oRenderManager, oContainer) {
            // Note: "this" refers to the renderer instance, which does not matter here!
            var oApplication = oContainer.getApplication(),
                oLaunchpadData = oContainer.launchpadData,
                oLoadingIndicator;

            if (!oContainer.getVisible()) {
                // Note: even invisible controls need to render their ID for later re-rendering
                sap.ushell.components.container.ApplicationContainer.prototype._renderControlInDiv(oRenderManager, oContainer);
                return;
            }

            if (oContainer.error) {
                delete oContainer.error;
                sap.ushell.components.container.ApplicationContainer.prototype._renderControlInDiv(oRenderManager, oContainer, sap.ushell.components.container.ApplicationContainer.prototype._createErrorControl());
            } else if (!oApplication) {
                // the standard properties
                sap.ushell.components.container.ApplicationContainer.prototype._render(oRenderManager, oContainer, oContainer.getApplicationType(),
                    oContainer.getUrl(), oContainer.getAdditionalInformation());
            } else if (!oApplication.isResolvable()) {
                // the standard application data
                sap.ushell.components.container.ApplicationContainer.prototype._render(oRenderManager, oContainer, oApplication.getType(),
                    oApplication.getUrl(), "");
            } else if (oLaunchpadData) {
                // the application, already resolved
                // Note that ResolveLink appends a "?" to the URL if additionalData (aka
                // additionalInformation) is supplied.
                sap.ushell.components.container.ApplicationContainer.prototype._render(oRenderManager, oContainer, oLaunchpadData.applicationType,
                    oLaunchpadData.Absolute.url.replace(/\?$/, ""),
                    oLaunchpadData.applicationData);
            } else {
                jQuery.sap.log.debug("Resolving " + oApplication.getUrl(), null,
                    sCOMPONENT);

                oApplication.resolve(function (oResolved) {
                    jQuery.sap.log.debug("Resolved " + oApplication.getUrl(),
                        JSON.stringify(oResolved),
                        sCOMPONENT);
                    // TODO: where to keep the internal property launchpadData? At the Application!
                    oContainer.launchpadData = oResolved;
                    sap.ushell.components.container.ApplicationContainer.prototype._destroyChild(oContainer);
                }, function (sError) {
                    var fnApplicationErrorHandler = oApplication.getMenu().getDefaultErrorHandler();
                    if (fnApplicationErrorHandler) {
                        fnApplicationErrorHandler(sError);
                    }
                    sap.ushell.components.container.ApplicationContainer.prototype._destroyChild(oContainer);
                    oContainer.error = sError;
                });
                oLoadingIndicator = new sap.m.Text({
                    text: sap.ushell.components.container.ApplicationContainer.prototype._getTranslatedText("loading", [oApplication.getText()])
                });
                sap.ushell.components.container.ApplicationContainer.prototype._destroyChild(oContainer);
                oContainer.setAggregation("child", oLoadingIndicator);
                sap.ushell.components.container.ApplicationContainer.prototype._renderControlInDiv(oRenderManager, oContainer, oLoadingIndicator);
            }
        }
    });

    /**
     * Returns the resulting source URL for the (internal) frame used to embed the given application.
     * This hook method may be overridden; we recommend to replace it per object, not at the
     * prototype.
     * <p>
     * The default implementation returns the URL "as is", but checks that the given application
     * type is one of <code>sap.ushell.components.container.ApplicationType</code> and throws
     * an error in case it is not. It ignores the additional information.
     * <p>
     * You may want to end your implementation with
     * <code>return
     * sap.ushell.components.container.ApplicationContainer.prototype.getFrameSource.call(this,
     * sApplicationType, sUrl, sAdditionalInformation);</code> in order to reuse the default
     * behavior. To override the error checks, simply replace any additional application types you
     * wish to support with <code>sap.ushell.components.container.ApplicationType.URL</code>.
     *
     * @param {sap.ushell.components.container.ApplicationType} sApplicationType
     *   the application type
     * @param {string} sUrl
     *   the base URL
     * @param {string} sAdditionalInformation
     *   the additional information
     * @returns {string}
     * @since 1.15.0
     */
    sap.ushell.components.container.ApplicationContainer.prototype.getFrameSource
        = function (sApplicationType, sUrl, sAdditionalInformation) {
            if (!Object.prototype.hasOwnProperty.call(
                    sap.ushell.components.container.ApplicationType,
                    sApplicationType
                )) {
                // Note: do not use sap.ushell.utils.Error here as the exception is already caught
                // and logged in render()
                throw new Error("Illegal application type: " + sApplicationType);
            }
            return sUrl;
        };

    // overwrite setters to trigger component recreation only if relevant properties have changed
    sap.ushell.components.container.ApplicationContainer.prototype.setUrl = function (sValue) {
        setProperty(this, "url", sValue);
    };

    sap.ushell.components.container.ApplicationContainer.prototype.setAdditionalInformation = function (sValue) {
        setProperty(this, "additionalInformation", sValue);
    };

    sap.ushell.components.container.ApplicationContainer.prototype.setApplicationType = function (sValue) {
        setProperty(this, "applicationType", sValue);
    };

    //Attach private functions which should be testable via unit tests to the prototype of the ApplicationContainer
    //to make them available outside for testing.
    sap.ushell.components.container.ApplicationContainer.prototype._adaptIsUrlSupportedResultForMessagePopover = adaptIsUrlSupportedResultForMessagePopover;
    sap.ushell.components.container.ApplicationContainer.prototype._getLogoutHandler = getLogoutHandler;
    sap.ushell.components.container.ApplicationContainer.prototype._getParameterMap = getParameterMap;
    sap.ushell.components.container.ApplicationContainer.prototype._getTranslatedText = getTranslatedText;
    sap.ushell.components.container.ApplicationContainer.prototype._createErrorControl = createErrorControl;
    sap.ushell.components.container.ApplicationContainer.prototype._destroyChild = destroyChild;
    sap.ushell.components.container.ApplicationContainer.prototype._createUi5View = createUi5View;
    sap.ushell.components.container.ApplicationContainer.prototype._publishExternalEvent = publishExternalEvent;
    sap.ushell.components.container.ApplicationContainer.prototype._createUi5Component = createUi5Component;
    sap.ushell.components.container.ApplicationContainer.prototype._disableRouter = disableRouter;
    sap.ushell.components.container.ApplicationContainer.prototype._createSystemForUrl = createSystemForUrl;
    sap.ushell.components.container.ApplicationContainer.prototype._isTrustedPostMessageSource = isTrustedPostMessageSource;
    sap.ushell.components.container.ApplicationContainer.prototype._handleServiceMessageEvent = handleServiceMessageEvent;
    sap.ushell.components.container.ApplicationContainer.prototype._handleMessageEvent = handleMessageEvent;
    sap.ushell.components.container.ApplicationContainer.prototype._logout = logout;
    sap.ushell.components.container.ApplicationContainer.prototype._renderControlInDiv = renderControlInDiv;
    sap.ushell.components.container.ApplicationContainer.prototype._adjustNwbcUrl = adjustNwbcUrl;
    sap.ushell.components.container.ApplicationContainer.prototype._render = render;
    sap.ushell.components.container.ApplicationContainer.prototype._backButtonPressedCallback = backButtonPressedCallback;

}());
