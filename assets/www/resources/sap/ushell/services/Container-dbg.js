// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The Unified Shell's container which manages renderers, services, and adapters.
 *
 * @version 1.52.4
 */
/**
 * @namespace Namespace for Unified Shell.
 * @name sap.ushell
 * @see sap.ushell.adapters
 * @see sap.ushell.renderers
 * @see sap.ushell.services

 * @since 1.15.0
 * @public
 */
/**
 * @namespace Default namespace for Unified Shell adapters. Note that there should be subordinate
 * namespaces per platform, for example <code>sap.ushell.adapters.abap</code> or
 * <code>sap.ushell.adapters.demo</code>.
 *
 * @name sap.ushell.adapters
 * @see sap.ushell.adapters.abap
 * @see sap.ushell.adapters.demo
 * @since 1.15.0
 * @public
 */
/**
 * @namespace Default namespace for Unified Shell renderers. Note that there should be subordinate
 * namespaces per renderer, for example <code>sap.ushell.renderers.standard</code>.
 *
 * @name sap.ushell.renderers
 * @see sap.ushell.renderers.standard
 * @since 1.15.0
 * @public
 */
/**
 * @namespace Default namespace for Unified Shell services. They can usually be placed directly
 * into this namespace, for example <code>sap.ushell.services.Container</code>.
 *
 * @name sap.ushell.services
 * @see sap.ushell.services.Container
 * @since 1.15.0
 * @public
 */
sap.ui.define([
    'sap/ushell/utils',
    'sap/ushell/System',
    'sap/ushell/Ui5ServiceFactory',
    'sap/ui/core/service/ServiceFactoryRegistry'
], function (utils, System, oUi5ServiceFactory, ServiceFactoryRegistry) {
    "use strict";
    /*global close, document, jQuery, localStorage, OData, sap, setTimeout, window */

    var S_COMPONENT_NAME = "sap.ushell.services.Container",
        S_DIRTY_STATE_PREFIX = "sap.ushell.Container.dirtyState.",
        // The configuration as read from window["sap-ushell-config"]
        oConfig,
        // Map with platform specific packages for the service adapters. This map is passed in
        // bootstrap and is valid for the given logon platform
        mPlatformPackages,
        sFirstInitStack;   // keep stack trace of first initialization call for debugging purposes

    /*
     * Try to close window.
     * Note: Most browsers do NOT allow closing windows by JS if they were opened manually.
     *
     */
    function closeWindow() {
        close();
    }

    /*
     * Redirect window to something other than "/sap/public/bc/icf/logoff".
     */
    function redirectWindow() {
        // TODO:
        // Here we should provide a dedicated web page telling the user that he is logged out
        document.location = "about:blank";
    }

    /*
     * Gets the platform specific package of the adapters.
     * @param {string} sPlatform
     *     the platform
     * @returns {string}
     */
    function getPlatformPackage(sPlatform) {
        if (mPlatformPackages && mPlatformPackages[sPlatform]) {
            return mPlatformPackages[sPlatform];
        }
        return "sap.ushell.adapters." + sPlatform;
    }

    /**
     * Gets the service configuration from window["sap-ushell-config"].services[sServiceName].
     * Ensures to return an object.
     *
     * @param {string} sServiceName
     *    the service name
     * @returns {object}
     *    the service configuration
     */
    function getServiceConfig(sServiceName) {
        return (oConfig.services && oConfig.services[sServiceName]) || {};
    }

    /**
     * Creates an adapter. Loads the adapter module if necessary. The resulting module name is
     * <code>"sap.ushell.adapters." + oSystem.platform + "." + sName + "Adapter"</code> unless
     * configured differently.
     *
     * @param {string} sName
     *     the service name
     * @param {sap.ushell.System} oSystem
     *     the target system
     * @param {string} [sParameter]
     *     a parameter which is passed to the constructor (since 1.15.0)
     * @returns {object}
     *     the adapter
     */
    function createAdapter(sName, oSystem, sParameter) {
        var oAdapterConfig = getServiceConfig(sName).adapter || {},
            sAdapterName = oAdapterConfig.module
                || getPlatformPackage(oSystem.getPlatform()) + "." + sName + "Adapter";

        jQuery.sap.require(sAdapterName);

        return new (jQuery.sap.getObject(sAdapterName))(oSystem, sParameter,
            {config: oAdapterConfig.config || {}});
    }

    /**
     * @class The Unified Shell's container which manages renderers, services, and adapters.
     *
     * @name sap.ushell.services.Container
     * @see sap.ushell.bootstrap
     * @since 1.15.0
     * @public
     */
    /**
     * Constructs a new Unified Shell container for the given container adapter.
     *
     * @param {object} oAdapter
     *     the platform-specific adapter corresponding to this service
     *
     * @private
     * @since 1.15.0
     */
    function Container(oAdapter) {
        var oEventProvider = new sap.ui.base.EventProvider(),
            isDirty = false,
            aRegisteredDirtyMethods = [],
            oRenderers = {},
            sRemoteSystemPrefix = "sap.ushell.Container." + oAdapter.getSystem().getPlatform()
                    + ".remoteSystem.",
            mRemoteSystems = {},
            oGlobalDirtyDeferred,
            fnStorageEventListener,
            oLocalStorage = utils.getLocalStorage(),
            mServicesByName = new utils.Map(),
            sSessionTerminationKey = "sap.ushell.Container." + oAdapter.getSystem().getPlatform()
                    + ".sessionTermination",
            that = this;

        // BEWARE: constructor code below!

        /**
         * Cancels the logon procedure in the current frame, if any. This MUST be used by the
         * logon frame provider in case the user wants to close the logon frame for good.
         * It will report "Authentication cancelled" and let all pending requests for the current
         * realm fail. As a side-effect, it also calls <code>destroy</code> on the logon frame
         * provider.
         *
         * @methodOf sap.ushell.services.Container#
         * @name cancelLogon
         * @since 1.21.2
         * @public
         * @alias sap.ushell.services.Container#cancelLogon
         * @see sap.ushell.services.Container#setLogonFrameProvider
         */
        this.cancelLogon = function () {
            if (this.oFrameLogonManager) {
                this.oFrameLogonManager.cancelXHRLogon();
            }
        };

        /**
         * Creates a new renderer instance for the given renderer name.
         * <p>
         * Names without a dot are interpreted as package names within the default naming convention
         * and will be expanded to
         * <code>"sap.ushell.renderers." + sRendererName + ".Renderer"</code>.
         * Names containing a dot are used "as is".
         * <p>
         * The resulting name must point to a SAPUI5 object which is first required and then
         * created (constructor call without arguments).
         * The object must be either a control (i.e. extend <code>sap.ui.core.Control</code>) or a
         * UI component (i.e. extend <code>sap.ui.core.UIComponent</code>), which is then
         * automatically wrapped into a <code>sap.ui.core.ComponentContainer</code> control by this
         * method. This <code>sap.ui.core.ComponentContainer</code> is created with
         * <code>height</code> and <code>width</code> set to "100%" to accommodate the complete
         * available space.
         * <p>
         * The returned renderer is supposed to be added to a direct child (for example
         * <code>DIV</code>) of the <code>BODY</code> of the page and there should be no other
         * parts of the page consuming space outside the renderer.
         * Use CSS class <code>sapUShellFullHeight</code> at <code>HTML</code>, <code>BODY</code>
         * and at the element to which the renderer is added to allow the renderer to use 100%
         * height.
         *
         * @param {string} [sRendererName]
         *     The renderer name, such as "standard" or "acme.foo.bar.MyRenderer"; it is taken from
         *     the configuration property <code>defaultRenderer</code> if not given here.
         * @returns {sap.ui.core.Control}
         *     the renderer
         *
         * @methodOf sap.ushell.services.Container#
         * @name createRenderer
         * @since 1.15.0
         * @public
         * @alias sap.ushell.services.Container#createRenderer
         */
        this.createRenderer = function (sRendererName) {
            var oComponentData,
                sComponentName,
                oRenderer,
                oRendererControl,
                oRendererConfig;

            jQuery.sap.measure.start("FLP:Container.InitLoading", "Initial Loading", "FLP");
            sRendererName = sRendererName || oConfig.defaultRenderer;
            if (!sRendererName) {
                throw new Error("Missing renderer name");
            }
            oRendererConfig = (oConfig.renderers && oConfig.renderers[sRendererName]) || {};
            sComponentName = oRendererConfig.module || (sRendererName.indexOf(".") < 0
                ? "sap.ushell.renderers." + sRendererName + ".Renderer"
                : sRendererName);
            jQuery.sap.require(sComponentName);
            if (oRendererConfig.componentData && oRendererConfig.componentData.config) {
                oComponentData = {config: oRendererConfig.componentData.config};
            }
            oRenderer = new (jQuery.sap.getObject(sComponentName))({
                componentData: oComponentData
            });
            if (oRenderer instanceof sap.ui.core.UIComponent) {
                oRendererControl = new sap.ui.core.ComponentContainer(
                    {component: oRenderer, height: "100%", width: "100%"}
                );
            } else {
                oRendererControl = oRenderer;
            }
            if (!(oRendererControl instanceof sap.ui.core.Control)) {
                throw new Error("Unsupported renderer type for name " + sRendererName);
            }
            oRenderers[sRendererName] = oRendererControl;

            oEventProvider.fireEvent("rendererCreated", {
                renderer: oRenderer
            });

            return oRendererControl;
        };


        /**
         * Gets a renderer instance for the given renderer name,
         * that was created by the createRenderer method.
         *
         * @param {string} [sRendererName]
         *     The renderer name, such as "standard" or "acme.foo.bar.MyRenderer"; it is taken from
         *     the configuration property <code>defaultRenderer</code> if not given here.
         * @returns {object}
         *     the renderer with the specified name; the returned object is either a control (i.e. extend <code>sap.ui.core.Control</code>)
         *     or a UI component (i.e. extend <code>sap.ui.core.UIComponent</code>), i.e. this method unwraps the renderer component
         *     from its <code>sap.ui.core.ComponentContainer</code>; if no renderer name can be determined and a single
         *     renderer instance has been created, this single instance is returned (the fallback implementation
         *     exists since version 1.34.0)
         *
         * @methodOf sap.ushell.services.Container#
         * @name getRenderer
         * @since 1.30.0
         * @private
         */
        this.getRenderer = function (sRendererName) {
            var oRendererControl,
                aRendererNames;

            sRendererName = sRendererName || oConfig.defaultRenderer;

            if (sRendererName) {
                oRendererControl = oRenderers[sRendererName];
            } else {
                aRendererNames = Object.keys(oRenderers);
                if (aRendererNames.length === 1) {
                    oRendererControl = oRenderers[aRendererNames[0]];
                } else {
                    jQuery.sap.log.warning(
                        "getRenderer() - cannot determine renderer, because no default renderer is configured and multiple instances exist.",
                        undefined,
                        S_COMPONENT_NAME);
                }
            }

            // unwrap the component instance in case of components
            if (oRendererControl instanceof sap.ui.core.ComponentContainer) {
                return oRendererControl.getComponentInstance();
            }

            // maybe undefined
            return oRendererControl;
        };


        /**
         * @namespace An enumeration for the application work protect mode state.
         *
         * @name sap.ushell.Container.DirtyState
         * @since 1.21.1
         * @public
         * @alias sap.ushell.services.Container#getGlobalDirty
         */
        this.DirtyState = {
            /**
             * The embedded application is clean, there is no unsaved data.
             *
             * @public
             * @alias sap.ushell.services.Container#getGlobalDirty
             * @constant
             * @default "CLEAN"
             * @name sap.ushell.Container.DirtyState.CLEAN
             * @since 1.21.1
             * @type string
             */
            CLEAN: "CLEAN",
            /**
             * The embedded application is dirty, the user has entered data
             * that is not yet saved.
             *
             * @public
             * @alias sap.ushell.services.Container#getGlobalDirty
             * @constant
             * @default "DIRTY"
             * @name sap.ushell.Container.DirtyState.DIRTY
             * @since 1.21.1
             * @type string
             */
            DIRTY: "DIRTY",
            /**
             * The embedded application container's dirty state cannot be determined because
             * of technical reasons.
             *
             * @public
             * @alias sap.ushell.services.Container#getGlobalDirty
             * @constant
             * @default "MAYBE_DIRTY"
             * @name sap.ushell.Container.DirtyState.MAYBE_DIRTY
             * @since 1.21.1
             * @type string
             */
            MAYBE_DIRTY: "MAYBE_DIRTY",
            /**
             * Technical state telling that the dirty state is currently being determined.
             *
             * @private
             * @constant
             * @default "PENDING"
             * @name sap.ushell.Container.DirtyState.PENDING
             * @since 1.21.1
             * @type string
             */
            PENDING: "PENDING",
            /**
             * Technical state for the initial value of the localStorage dirty state key.
             *
             * @private
             * @constant
             * @default "INTIAL"
             * @name sap.ushell.Container.DirtyState.INITIAL
             * @since 1.21.2
             * @type string
             */
            INITIAL: "INITIAL"
        };

        /**
         * Returns the global dirty state.
         *
         * All open UShell browser windows for the same origin are asked about their global dirty
         * state.
         *
         * @returns {jQuery.Deferred}
         *     A <code>jQuery.Deferred</code> object's promise receiving the dirty state
         *     (see {@link sap.ushell.Container.DirtyState}).
         * @throws  Raises an exception, if called again before promise is resolved.
         *
         * @methodOf sap.ushell.services.Container#
         * @name getGlobalDirty
         * @since 1.21.1
         * @public
         * @alias sap.ushell.services.Container#getGlobalDirty
         */
        this.getGlobalDirty = function () {
            var i,
                oDeferred = new jQuery.Deferred(),
                sUid = jQuery.sap.uid(),
                sStorageKey,
                iPending = 0,
                oDirtyState = this.DirtyState.CLEAN;

            function tryResolve() {
                if (iPending === 0 || oDirtyState === that.DirtyState.DIRTY) {
                    // no PENDING or already dirty, so we can end the process
                    oDeferred.resolve(oDirtyState);
                    jQuery.sap.log.debug(
                        "getGlobalDirty() Resolving: " + oDirtyState,
                        null,
                        "sap.ushell.Container"
                    );
                }
            }

            function onStorageEvent(oStorageEvent) {
                if (oStorageEvent.key.indexOf(S_DIRTY_STATE_PREFIX) === 0
                        && oStorageEvent.newValue !== that.DirtyState.INITIAL
                        && oStorageEvent.newValue !== that.DirtyState.PENDING) {
                    jQuery.sap.log.debug(
                        "getGlobalDirty() Receiving event key: " + oStorageEvent.key
                            + " value: " + oStorageEvent.newValue,
                        null,
                        "sap.ushell.Container"
                    );
                    if (oStorageEvent.newValue === that.DirtyState.DIRTY
                            || oStorageEvent.newValue === that.DirtyState.MAYBE_DIRTY) {
                        oDirtyState = oStorageEvent.newValue;
                    }
                    iPending -= 1;
                    tryResolve();
                }
            }

            // check for private browsing mode in Safari
            try {
                oLocalStorage.setItem(sUid, "CHECK");
                oLocalStorage.removeItem(sUid);
            } catch (e) {
                jQuery.sap.log.warning("Error calling localStorage.setItem(): " + e, null,
                    "sap.ushell.Container");
                return oDeferred.resolve(this.DirtyState.MAYBE_DIRTY).promise();
            }

            if (oGlobalDirtyDeferred) {
                throw new Error("getGlobalDirty already called!");
            }

            oGlobalDirtyDeferred = oDeferred;
            window.addEventListener('storage', onStorageEvent);
            oDeferred.always(function () {
                window.removeEventListener('storage', onStorageEvent);
                oGlobalDirtyDeferred = undefined;
            });

            for (i = oLocalStorage.length - 1; i >= 0; i -= 1) {
                sStorageKey = oLocalStorage.key(i);
                if (sStorageKey.indexOf(S_DIRTY_STATE_PREFIX) === 0) {
                    if (oLocalStorage.getItem(sStorageKey) === 'PENDING') {
                        // cleanup unanswered PENDINGS from call before
                        oLocalStorage.removeItem(sStorageKey);
                        jQuery.sap.log.debug(
                            "getGlobalDirty() Cleanup of unresolved 'PENDINGS':" + sStorageKey,
                            null,
                            "sap.ushell.Container"
                        );
                    } else {
                        iPending += 1;
                        utils.localStorageSetItem(sStorageKey,
                            this.DirtyState.PENDING, true);
                        jQuery.sap.log.debug(
                            "getGlobalDirty() Requesting status for: " + sStorageKey,
                            null,
                            "sap.ushell.Container"
                        );
                    }
                }
            }
            tryResolve();

            setTimeout(function () {
                if (oDeferred.state() !== "resolved") {
                    // no use of constants because the Container may not exist anymore
                    oDeferred.resolve('MAYBE_DIRTY');
                    jQuery.sap.log.debug(
                        "getGlobalDirty() Timeout reached, - resolved 'MAYBE_DIRTY'",
                        null,
                        "sap.ushell.Container"
                    );
                }
            }, iPending * 2000);

            return oDeferred.promise();
        };

        /**
         * Returns the logon system.
         *
         * @returns {sap.ushell.System}
         *     object providing information about the system where the container is logged in.
         *     since 1.15.0 the return value is of type <code>sap.ushell.System</code>
         *
         * @since 1.15.0
         * @private
         */
        this.getLogonSystem = function () {
            return oAdapter.getSystem();
        };

       /**
         * Returns the logged-in user.
         *
         * @returns {sap.ushell.User}
         *      object providing information about the logged-in user
         *
         * @since 1.15.0
         * @private
         */
        this.getUser = function () {
            return oAdapter.getUser();
        };

        /**
         * Returns the isDirty flag value.
         *
         * @returns {isDirty}
         *      The value of the dirty flag.
         * @methodOf sap.ushell.services.Container#
         * @name getDirtyFlag
         * @since 1.27.0
         * @public
         * @alias sap.ushell.services.Container#getDirtyFlag
         */
        this.getDirtyFlag = function () {
            for (var i = 0; i < aRegisteredDirtyMethods.length; i++) {
                isDirty = isDirty || aRegisteredDirtyMethods[i].call();
            }

            return isDirty;
        };

        /**
         * Setter for the isDirty flag value.
         *
         * Default value is false
         *
         * @param {boolean} [bIsDirty] The value of the dirty flag.
         * @methodOf sap.ushell.services.Container#
         * @name setDirtyFlag
         * @default false
         * @since 1.27.0
         * @public
         * @alias sap.ushell.services.Container#setDirtyFlag
         */
        this.setDirtyFlag = function (bIsDirty) {
            isDirty = bIsDirty;
        };

        /**
         * Instructs the platform/backend system to keep the session alive.
         *
         * @since 1.48.0
         *
         * @private
         * 
         * @alias sap.ushell.services.Container#sessionKeepAlive
         */
        this.sessionKeepAlive = function () {
            if (oAdapter.sessionKeepAlive) {
                oAdapter.sessionKeepAlive();
            }
        };

        /**
         * Register the work protection dirty callback function.
         * In the work protect mechanism, each platform can register their own method in order to check if data
         * was changed during the session, and notify the container about the change
         *
         * Use <code>Function.prototype.bind()</code> to determine the callback's <code>this</code> or
         * some of its arguments.
         *
         * @param {Function} fnDirty
         *     function for determining the state of the application
         * @since 1.31.0
         * @methodOf sap.ushell.services.Container#
         * @name registerDirtyStateProvider
         * @public
         * @alias sap.ushell.services.Container#registerDirtyStateProvider
         */
        this.registerDirtyStateProvider = function (fnDirty) {
            if (typeof fnDirty !== "function") {
                throw new Error("fnDirty must be a function");
            }
            aRegisteredDirtyMethods.push(fnDirty);
        };

        /**
         * Returns a service with the given name, creating it if necessary.
         * Services are singleton objects identified by their (resulting) name.
         * <p>
         * Names without a dot are interpreted as service names within the default naming convention
         * and will be expanded to <code>"sap.ushell.services." + sServiceName</code>.
         * Names containing a dot are not yet supported. This name may be overridden via
         * configuration. See example 2 below.
         * <p>
         * The resulting name must point to a constructor function which is first required as a
         * SAPUI5 module and then called to create a service instance.
         * The service will be passed to a corresponding service adapter for the current logon system, as well as a callback
         * interface (of virtual type <code>sap.ushell.services.ContainerInterface</code>) to the
         * container providing a method <code>createAdapter(oSystem)</code> to create further
         * adapters for the same service but connected to remote systems.
         * The third parameter will be <code>sParameter</code> as passed to this function.
         * The fourth parameter will be an
         * object with the property <code>config</code> supplied by the configuration. See
         * example 2 below.
         * <p>
         * The adapter for the logon system will be created before the service. Its constructor
         * gets three parameters. The first parameter is the logon system, the second parameter is
         * <code>sParameter</code> and the third parameter is an object with the property
         * <code>config</code> supplied by the configuration.
         * <p>
         * The service may declare itself adapterless by setting the property
         * <code>hasNoAdapter = true</code> at the constructor function. In this case no adapter
         * will be created and passed to the constructor and all other parameters will be shifted.
         * <p>
         * <b>Example 1:</b> The service <code>sap.ushell.services.UserInfo</code> is
         * parameterless. It indicates this by setting
         * <code>sap.ushell.services.UserInfo.hasNoAdapter = true;</code>.
         * <p>
         * <b>Example 2:</b> (Configuration)
         * <pre>
         * window["sap-ushell-config"] = {
         *     services: {
         *         Foo: {
         *             module: "my.own.Foo"
         *             config: {header: "hidden"},
         *             adapter: {
         *                 module: "my.own.FooAdapter",
         *                 config: {foo: "bar"}
         *             }
         *         }
         *     }
         * }
         * oService = sap.ushell.Container.getService("Foo", "runtimeConfig");
         * </pre>
         * Now <code>oService</code> is an instance of <code>my.own.Foo</code>. The third parameter
         * of the constructor will be "runtimeConfig", the fourth parameter
         * <code>{config: {header: "hidden"}}</code>. Its adapter is an instance of
         * <code>my.own.FooAdapter</code> constructed with the parameters logon system,
         * "runtimeConfig" and <code>{config: {foo: "bar"}}</code>.
         *
         * @param {string} sServiceName
         *     The service name, such as "Menu"
         * @param {string} [sParameter]
         *     A parameter which is passed to the service constructor and every adapter
         *     constructor. (since 1.15.0)
         * @returns {object}
         *     the service
         *
         * @methodOf sap.ushell.services.Container#
         * @name getService
         * @see sap.ushell.services.ContainerInterface
         * @since 1.15.0
         * @public
         * @alias sap.ushell.services.Container#getService
         */
        this.getService = function (sServiceName, sParameter) {
            /**
             * @class This is a virtual type for the callback interface passed by
             * {@link sap.ui.Container.getService()} to any newly created service.
             * @name sap.ushell.services.ContainerInterface
             * @see sap.ushell.services.Container#getService
             * @since 1.15.0
             * @public
             */
            var oContainerInterface = {},
                sModuleName,
                sKey,
                Service, // Service constructor function
                oService,
                bServiceHasNoAdapter,
                oServiceAdapter,
                oServiceConfig,
                oServiceProperties;

            /**
             * For the given remote system, creates a new adapter that corresponds to the service
             * to which this container interface was passed at construction time.
             *
             * @param {sap.ushell.System} oSystem
             *     information about the remote system to which the resulting adapter should
             *     connect
             * @returns {jQuery.Deferred}
             *     A <code>jQuery.Deferred</code> object's promise receiving the remote adapter.
             *
             * @methodOf sap.ushell.services.ContainerInterface#
             * @name createAdapter
             * @since 1.15.0
             * @public
             */
            function createRemoteAdapter(oSystem) {
                var oDeferred = new jQuery.Deferred();
                if (!oSystem) {
                    throw new Error("Missing system");
                }
                // Note: this might become really asynchronous once the remote adapter is loaded
                // from the remote system itself
                oDeferred.resolve(createAdapter(sServiceName, oSystem, sParameter));
                sap.ushell.Container.addRemoteSystem(oSystem);
                return oDeferred.promise();
            }

            if (!sServiceName) {
                throw new Error("Missing service name");
            }
            if (sServiceName.indexOf(".") >= 0) {
                //TODO support this once we have some configuration and can thus find adapters
                throw new Error("Unsupported service name");
            }
            oServiceConfig = getServiceConfig(sServiceName);
            sModuleName = oServiceConfig.module || "sap.ushell.services." + sServiceName;
            sKey = sModuleName + "/" + (sParameter || "");
            oServiceProperties = {config: oServiceConfig.config || {}};
            if (!mServicesByName.containsKey(sKey)) {
                /*
                 * extract information about the requested service
                 */
                Service = sap.ui.requireSync(sModuleName.replace(/[.]/g, "/"));

                /*
                 * create the service
                 */
                if (Service.hasNoAdapter) {
                    // has no adapter: don't create and don't pass one
                    oService = new Service(oContainerInterface, sParameter, oServiceProperties);
                } else {
                    // create and pass adapter for logon system as first parameter
                    oServiceAdapter = createAdapter(sServiceName, oAdapter.getSystem(),
                        sParameter);
                    oContainerInterface.createAdapter = createRemoteAdapter;
                    oService = new Service(oServiceAdapter, oContainerInterface, sParameter,
                        oServiceProperties);
                }

                mServicesByName.put(sKey, oService);
                return oService;
            }
            return mServicesByName.get(sKey);
        };

        /**
         * Get list of remote systems currently in use.
         *
         * @returns {object} map of sap.ushell.System
         *
         * @since 1.17.1
         * @private
         */
        function getRemoteSystems() {
            var sSystemAlias,
                oSystemData,
                i,
                sKey;

            for (i = oLocalStorage.length - 1; i >= 0; i -= 1) {
                sKey = oLocalStorage.key(i);
                if (sKey.indexOf(sRemoteSystemPrefix) === 0) {
                    try {
                        sSystemAlias = sKey.substring(sRemoteSystemPrefix.length);
                        oSystemData = JSON.parse(oLocalStorage.getItem(sKey));
                        mRemoteSystems[sSystemAlias] = new System(oSystemData);
                    } catch (e) {
                        // local storage contained garbage (non-parseable)
                        oLocalStorage.removeItem(sKey);
                    }
                }
            }
            return mRemoteSystems;
        }


        /**
         * Stub OData.read() and OData.request() to intercept OData request during logout process.
         * After 5 seconds an error handler is invoked to let the caller know about still ongoing
         * logout process.
         *
         * @since 1.17.1
         * @private
         */
        function suppressOData() {
            function stub(sErrorMessage, fnSuccess, fnFailure) {
                jQuery.sap.log.warning(sErrorMessage, null,
                    "sap.ushell.Container");
                if (fnFailure) {
                    setTimeout(fnFailure.bind(null, sErrorMessage), 5000);
                }
                // the original APIs provides abort handler which have to be stubbed also
                return { abort: function () {return; }};
            }
            OData.read = function (oRequest, fnSuccess, fnFailure) {
                return stub("OData.read('" +
                            (oRequest && oRequest.Uri ? oRequest.requestUri : oRequest) +
                            "') disabled during logout processing",
                            fnSuccess, fnFailure);
            };
            OData.request = function (oRequest, fnSuccess, fnFailure) {
                return stub("OData.request('" + (oRequest ? oRequest.requestUri : "") +
                            "') disabled during logout processing", fnSuccess, fnFailure);
            };
        }

        /**
         * Adds a system to the list of remote systems currently in use. On logout
         * this list is processed and performs a logout for each system via the ContainerAdapter
         * specific for its platform.
         *
         * @param  {sap.ushell.System} oRemoteSystem
         *         Remote system to be added.
         *
         * @methodOf sap.ushell.services.Container#
         * @name addRemoteSystem
         * @since 1.15.0
         * @public
         * @alias sap.ushell.services.Container#addRemoteSystem
         */
        /* Internal details
           oRemoteSystem.getAlias() is the unique key within the remote systems list.
           oRemoteSystem.getPlatform determines which ContainerAdapter implementation is used.
           oRemoteSystem.getBaseUrl determines the logout request routing; there are 3 routing modes:
           1. empty baseUrl:
             The logout is done with its platform-specific, server-absolute service path e.g.
             oRemoteSystem.platform is 'abap':
               '/sap/public/bc/icf/logoff'
             oRemoteSystem.platform is 'hana':
               '<protocol://host:port>/sap/hana/xs/formLogin/token.xsjs'
           2. baseUrl beginning with '/' e.g. '/MY_PREFIX':
             The logout request was fired with the baseUrl as prefix e.g. platform 'abap':
               '<protocol://host:port>/MY_PREFIX/sap/public/bc/icf/logoff'
           3. baseUrl is ';o=':
             The logout request is fired with <code>;o=oRemoteSystem.alias</code>
             e.g. oRemoteSystem.platform 'abap' and oRemoteSystem.alias = 'MY_SYSTEM_ALIAS':
               '<protocol://host:port>/sap/public/bc/icf/logoff;o=MY_SYSTEM_ALIAS'
           Note: Cases 2. and 3. require a corresponding Web Dispatcher rule.
        */
        this.addRemoteSystem = function (oRemoteSystem) {
            var sAlias = oRemoteSystem.getAlias(),
                oOldSystem = mRemoteSystems[sAlias];

            if (oOldSystem) {
                if (oOldSystem.toString() === oRemoteSystem.toString()) { // --> JSON.stringify
                    return;
                }
                jQuery.sap.log.warning("Replacing " + oOldSystem + " by " + oRemoteSystem,
                    null, "sap.ushell.Container");
            } else {
                jQuery.sap.log.debug("Added " + oRemoteSystem, null, "sap.ushell.Container");
            }
            mRemoteSystems[sAlias] = oRemoteSystem;
            utils.localStorageSetItem(sRemoteSystemPrefix + sAlias, oRemoteSystem);
        };

        /**
         * Derives a remote system from the given OData service URL heuristically. The platform
         * is identified by the URL's prefix, the alias is derived from a segment parameter named
         * "o". If this succeeds, {@link #addRemoteSystem} is called accordingly with a base URL
         * of ";o=".
         *
         * @param {string} sServiceUrl
         *     An OData service URL.
         *
         * @methodOf sap.ushell.services.Container#
         * @name addRemoteSystemForServiceUrl
         * @since 1.23.0
         * @private
         */
        this.addRemoteSystemForServiceUrl = function (sServiceUrl) {
            /*jslint regexp:true */
            var aMatches,
                oSystemInfo = {baseUrl: ";o="};

            if (!sServiceUrl || sServiceUrl.charAt(0) !== '/' || sServiceUrl.indexOf('//') === 0) {
                return;
            }

            // extract system alias from segment parameter named "o"
            aMatches = /^[^?]*;o=([^\/;?]*)/.exec(sServiceUrl);
            if (aMatches && aMatches.length >= 2) {
                oSystemInfo.alias = aMatches[1];
            }

            // heuristically determine platform from URL prefix
            sServiceUrl = sServiceUrl.replace(/;[^\/?]*/g, ""); // remove all segment parameters
            if (/^\/sap\/(bi|hana|hba)\//.test(sServiceUrl)) {
                oSystemInfo.platform = "hana";
                oSystemInfo.alias = oSystemInfo.alias || "hana"; // use legacy hana as fallback
            } else if (/^\/sap\/opu\//.test(sServiceUrl)) {
                oSystemInfo.platform = "abap";
            }

            if (oSystemInfo.alias && oSystemInfo.platform) {
                this.addRemoteSystem(new System(oSystemInfo));
            }
        };

        /**
         * Attaches a listener to the logout event.
         *
         * @param  {function} fnFunction
         *     Event handler to be attached.
         *
         * @methodOf sap.ushell.services.Container#
         * @name attachLogoutEvent
         * @since 1.19.1
         * @public
         * @alias sap.ushell.services.Container#attachLogoutEvent
         */
        this.attachLogoutEvent = function (fnFunction) {
            oEventProvider.attachEvent("Logout", fnFunction);
        };


        /**
         * Detaches a listener from the logout event.
         *
         * @param  {function} fnFunction
         *     Event handler to be detached.
         *
         * @methodOf sap.ushell.services.Container#
         * @name detachLogoutEvent
         * @since 1.19.1
         * @public
         * @alias sap.ushell.services.Container#detachLogoutEvent
         */
        this.detachLogoutEvent = function (fnFunction) {
            oEventProvider.detachEvent("Logout", fnFunction);
        };

        /**
         * Attaches a listener to the rendererCreated event.
         *
         * @param  {function} fnFunction
         *     Event handler to be attached. If a renderer is created, this function is called with a parameter
         *     of instance <code>sap.ui.base.Event</code>. The event object provides the instance of the
         *     created renderer as parameter &quot;renderer&quot;. If the renderer is a SAPUI5 UI component
         *     (i.e. extend <code>sap.ui.core.UIComponent</code>), the event parameter returns the component
         *     instance, i.e. it unwraps the renderer component from its component container.
         *
         * @methodOf sap.ushell.services.Container#
         * @name attachRendererCreatedEvent
         * @since 1.34.1
         * @public
         * @alias sap.ushell.services.Container#attachRendererCreatedEvent
         */
        this.attachRendererCreatedEvent = function (fnFunction) {
            oEventProvider.attachEvent("rendererCreated", fnFunction);
        };

        /**
         * Detaches a listener from the rendererCreated event.
         *
         * @param  {function} fnFunction
         *     Event handler to be detached.
         *
         * @methodOf sap.ushell.services.Container#
         * @name detachLogoutEvent
         * @since 1.34.1
         * @public
         * @alias sap.ushell.services.Container#detachRendererCreatedEvent
         */
        this.detachRendererCreatedEvent = function (fnFunction) {
            oEventProvider.detachEvent("rendererCreated", fnFunction);
        };

        /**
         * Logs out the current user from all relevant back-end systems, including the logon system
         * itself.
         *
         * @returns {jQuery.Deferred}
         *          A <code>jQuery.promise</code> to be resolved when logout is finished, even when it fails.
         *
         * @methodOf sap.ushell.services.Container#
         * @name logout
         * @since 1.15.0
         * @public
         * @alias sap.ushell.services.Container#logout
         */
        this.logout = function () {
            var oDeferred = new jQuery.Deferred();

            function resolve() {
                oAdapter.logout(true).always(function () {
                    oLocalStorage.removeItem(sSessionTerminationKey);
                    oDeferred.resolve();
                });
            }

            function logoutLogonSystem() {
                if (oEventProvider.fireEvent("Logout", true)) {
                    resolve();
                } else {
                    // defer UShell redirect to let NWBC receive message asynchronously
                    setTimeout(resolve, 1000);
                }
            }

            function federatedLogout() {
                var mRemoteSystems,
                    aRemoteLogoutPromises = [];

                if (fnStorageEventListener) {
                    // IE sends localStorage events also to the issuing window, -
                    // this is not needed hence we remove the listener in general at that point
                    window.removeEventListener('storage', fnStorageEventListener);
                }

                utils.localStorageSetItem(sSessionTerminationKey, "pending");
                that._suppressOData();
                mRemoteSystems = that._getRemoteSystems();
                Object.keys(mRemoteSystems).forEach(function (sAlias) {
                    try {
                        aRemoteLogoutPromises.push(
                            createAdapter("Container", mRemoteSystems[sAlias]).logout(false)
                        );
                    } catch (e) {
                        jQuery.sap.log.warning("Could not create adapter for " + sAlias,
                            e.toString(), "sap.ushell.Container");
                    }
                    oLocalStorage.removeItem(sRemoteSystemPrefix + sAlias);
                });
                // wait for all remote system logouts to be finished
                // Note: We use done() and not always(), and we require all adapters to resolve
                // their logout(false) in any case. If we use always() and any adapter's promise is
                // rejected, the deferred object from when() is *immediately* rejected, too. Then
                // the redirect happens before all remote logouts are finished.
                // TODO force logoutLogonSystem after timeout?
                jQuery.when.apply(jQuery, aRemoteLogoutPromises).done(logoutLogonSystem);
            }

            if (typeof oAdapter.addFurtherRemoteSystems === 'function') {
                oAdapter.addFurtherRemoteSystems().always(federatedLogout);
            } else {
                federatedLogout();
            }

            return oDeferred.promise();
        };

        /**
         * Determines the current logon frame provider for the entire Unified Shell. Initially,
         * a rudimentary default provider is active and should be replaced as soon as possible
         * by the current renderer.
         * <p>
         * A logon frame provider is used to facilitate user authentication even for requests sent
         * via <code>XMLHttpRequest</code>. It is called back in order to create a hidden
         * <code>IFRAME</code>, to show it to the user, then to hide and destroy it. The frame
         * must be treated as a black box by the provider; especially with respect to the source of
         * the frame which is managed by the Unified Shell framework. Showing the frame might
         * require user interaction and some decoration around the frame. The frame should be
         * destroyed, not reused, to be on the safe side. Note that in typical cases with SAML2,
         * authentication happens automatically and the frame can stay hidden.
         * <p>
         * The following order of method calls is guaranteed:
         * <ol>
         *   <li> The <code>create</code> method is called first.
         *   <li> The <code>show</code> method may be called next (if there is HTML code to
         *   display).
         *   <li> The <code>destroy</code> method is called last.
         *   <li> A new cycle may start for a new logon process.
         * </ol>
         *
         * @param {object} oLogonFrameProvider
         *   The new logon frame provider which needs to implement at least the methods documented
         *   here.
         * @param {function} oLogonFrameProvider.create
         *   A function taking no arguments and returning a DOM reference to an empty
         *   <code>IFRAME</code> which is initially hidden.
         *   The frame must not be moved around in the DOM later on. Make sure to add all necessary
         *   parent objects immediately, to render SAPUI5 controls as needed, and to return the DOM
         *   reference synchronously.
         * @param {function} oLogonFrameProvider.destroy
         *   A function taking no arguments which hides and destroys the current frame.
         * @param {function} oLogonFrameProvider.show
         *   A function taking no arguments which is called to indicate that the current frame
         *   probably needs to be shown to the user because interaction is required. Note that
         *   there may be false positives here. It is up to the provider how and when the frame
         *   is shown exactly; make sure to provide a good user interaction design here.
         *
         * @methodOf sap.ushell.services.Container#
         * @name setLogonFrameProvider
         * @since 1.21.2
         * @public
         * @alias sap.ushell.services.Container#setLogonFrameProvider
         * @see sap.ushell.services.Container#cancelLogon
         */
        this.setLogonFrameProvider = function (oLogonFrameProvider) {
            if (this.oFrameLogonManager) {
                this.oFrameLogonManager.setLogonFrameProvider(oLogonFrameProvider);
            }
        };

        /**
         * Sets the timeout for XHR logon requests if a XHR logon frame manager is active.
         * <p>
         * The shell runtime might support logon for XHR requests (if this feature is supported
         * on the actual platform). The XHR logon allows to define specific timeout settings per
         * request path, until a logon frame is shown.
         * <p>
         * This method is not a public API, it must only be called by shell internal services.
         *
         * @param {string} sPath
         *   the URL path for which the custom timeout will be applied
         * @param {number} iTimeout
         *   the timeout value in milliseconds
         *
         * @methodOf sap.ushell.services.Container#
         * @name setXhrLogonTimeout
         * @since 1.46.3
         * @private
         * @alias sap.ushell.services.Container#setXhrLogonTimeout
         */
        this.setXhrLogonTimeout = function (sPath, iTimeout) {
            if (this.oFrameLogonManager) {
                this.oFrameLogonManager.setTimeout(sPath, iTimeout);
            }
        };

        //Attach private functions which should be testable via unit tests to the constructor of the Container
        //to make them available outside for testing.
        this._closeWindow = closeWindow;
        this._redirectWindow = redirectWindow;
        this._getRemoteSystems = getRemoteSystems;
        this._suppressOData = suppressOData;

        // constructor code -------------------------------------------------------
        // loose coupling to allow re-use from sap.ui2.srvc.Catalog#addSystemToServiceUrl
        sap.ui.getCore().getEventBus().subscribe("sap.ushell.Container",
            "addRemoteSystemForServiceUrl", function (sChannelId, sEventId, oData) {
                that.addRemoteSystemForServiceUrl(oData);
            });
        // register event handler for storage events issued by other UShell windows
        if (typeof oAdapter.logoutRedirect === 'function') {
            fnStorageEventListener = function (oStorageEvent) {
                function closeAndRedirectWindow() {
                    // Most browsers do not allow closing windows via JS that aren't opened via JS
                    // hence we additionally redirect to get these manually opened windows
                    // redirected at least.
                    // NOTE: It is important to NOT redirect to  "/sap/public/bc/icf/logoff"
                    // because on iPad Safari e.g. the event is not processed until the window gets
                    // the focus. This would terminate any new session opened in between.
                    that._closeWindow();
                    that._redirectWindow();
                }
                if (sap.ushell.Container !== that) {
                    // In integration test suite, old listeners remain which do not belong to the
                    // current sap.ushell.Container instance. IE sends events also to own window.
                    // Then these old listeners react as if a remote window logged out...
                    return;
                }
                // IE9 seems to get the events, but not the values in another window!?
                if (oStorageEvent.key.indexOf(sRemoteSystemPrefix) === 0
                        && oStorageEvent.newValue
                        && oStorageEvent.newValue !== oLocalStorage.getItem(oStorageEvent.key)) {
                    utils.localStorageSetItem(oStorageEvent.key, oStorageEvent.newValue);
                }
                if (oStorageEvent.key === sSessionTerminationKey) {
                    if (oStorageEvent.newValue === "pending") {
                        that._suppressOData();
                        if (oEventProvider.fireEvent("Logout", true)) {
                            closeAndRedirectWindow();
                        } else {
                            // defer UShell closeWindow to let NWBC receive message asynchronously
                            setTimeout(closeAndRedirectWindow, 1000);
                        }
                    }
                }
            };
            window.addEventListener('storage', fnStorageEventListener);
        }
    }

    /**
     * Creates and registers injectable ui5services.
     *
     * @param {array} aServicesToRegister
     *   An array of service names to register.
     *
     * @private
     */
    function registerInjectableUi5Services(aServicesToRegister) {

        aServicesToRegister.forEach(function (sUshellServiceName) {

            // create registerable factory
            var oServiceFactory = oUi5ServiceFactory.createServiceFactory(
                sUshellServiceName
            );

            // register factory to allow UI5 to create the service
            ServiceFactoryRegistry.register(
                "sap.ushell.ui5service." + sUshellServiceName,
                oServiceFactory
            );
        });
    }

    /**
     * Initializes the Unified Shell container for the given platform. This method must be called
     * exactly once in the very beginning by platform-specific code in order to bootstrap the
     * container. As soon as the returned promise has been resolved, the container will be available
     * as a singleton object <code>sap.ushell.Container</code>.
     * <p>
     * For convenience, platform-specific bootstrap code is available and can be easily included
     * (<b>before</b> the SAPUI5 bootstrap) by a corporate shell as follows:
     * <pre>
     * &lt;script src="/sap/public/bc/ui5_ui5/resources/sap/ushell_abap/bootstrap/abap.js"&gt;&lt;/script&gt;
     * &lt;script id="sap-ui-bootstrap" src=".../sap-ui-core.js"&gt;&lt;/script&gt;
     * </pre>
     * This bootstrap code will automatically defer the initialization of SAPUI5 until the
     * container is available. This is the preferred way of bootstrapping the Unified Shell.
     * <p>
     * Note: For SAPUI5 application projects the recommended way is to add a dependency to the
     * "sap.ushell_abap" library (<code>&lt;groupId&gt;com.sap.ushell&lt;/groupId&gt;
     * &lt;artifactId&gt;ushell_abap&lt;/artifactId&gt;</code>) and load the bootstrap code via the
     * application's resources folder:
     * <pre>
     * &lt;script src=".../resources/sap/ushell_abap/bootstrap/abap.js"&gt;&lt;/script&gt;
     * &lt;script id="sap-ui-bootstrap" src=".../sap-ui-core.js"&gt;&lt;/script&gt;
     * </pre>
     * <p>
     * Since 1.15.0 you can provide the function
     * <code>window['sap.ushell.bootstrap.callback']</code> for calling back from this method
     * asynchronously. SAPUI5's bootstrap is ongoing then. The same restrictions apply
     * as for the function <code>window['sap-ui-config']['xx-bootTask']</code>) when the Unified
     * Shell container has not yet finished its bootstrap. You cannot delay the bootstrap of SAPUI5
     * or the Unified Shell container; any errors are ignored. This callback is useful for
     * sending asynchronous back-end requests at the earliest opportunity without delaying
     * the core bootstrap of SAPUI5 and the Unified Shell container.
     *
     * @param {string} sPlatform
     *     the target platform, such as "abap" or "local" (Note: there is no fixed enumeration of
     *     possible platforms)
     * @param {map<string, string>} [mAdapterPackagesByPlatform={}]
     *     the map with platform specific package names for the service adapters.
     *     You only need to specify these package names, if they differ from the standard name
     *     <code>"sap.ushell.adapters." + sPlatform</code>.
     * @returns {jQuery.Promise}
     *     a promise that is resolved once the container is available
     *
     * @since 1.15.0
     * @see sap.ushell.Container
     * @public
     */
    sap.ushell.bootstrap = function (sPlatform, mAdapterPackagesByPlatform) {
        var oAdapter,
            oError;

        if (sap.ushell.Container !== undefined) {
            oError = new Error("Unified shell container is already initialized - cannot initialize twice.\nStacktrace of first initialization:" + sFirstInitStack);
            jQuery.sap.log.error(oError,
                oError.stack,  // stacktrace not only available for all browsers
                S_COMPONENT_NAME);
            throw oError;
        }
        sap.ushell.Container = null; // "loading..."
        sFirstInitStack = (new Error()).stack;  // remember stack trace of first initializon for debugging

        // remember the configuration independently of window["sap-ushell-config"]
        // used to be oConfig = JSON.parse(JSON.stringify(window["sap-ushell-config"] || {}));
        // but now we have live promises as members of the configuration!
        oConfig = jQuery.extend({}, true, window["sap-ushell-config"] || {});
        // remember the platform package names
        mPlatformPackages = mAdapterPackagesByPlatform;

        if (typeof window["sap.ushell.bootstrap.callback"] === "function") {
            setTimeout(window["sap.ushell.bootstrap.callback"]);
        }

        if (oConfig.modulePaths) {
            Object.keys(oConfig.modulePaths).forEach(function (sModuleName) {
                jQuery.sap.registerModulePath(sModuleName, oConfig.modulePaths[sModuleName]);
            });
        }

        oAdapter = createAdapter("Container", new System({
            // this is the initial logon system object
            alias: "",
            platform: oConfig.platform || sPlatform
        }));

        // Register all injectable ui5services
        registerInjectableUi5Services([
            "Personalization",
            "URLParsing",
            "CrossApplicationNavigation"
        ]);

        return oAdapter.load().then( function () {

            var oCDMService, oContainer, oPluginManager;
            var oDeferredCDMSitePlugins, bLoadAdditionalPluginsFromSite;

            /**
             * The Unified Shell container as a singleton object. This object will only be
             * available after <code>sap.ushell.bootstrap()</code> has finished.
             *
             * @since 1.15.0
             * @type sap.ushell.services.Container
             * @see sap.ushell.bootstrap
             * @public
             */
            sap.ushell.Container = new Container( oAdapter );

            oContainer = sap.ushell.Container;

            bLoadAdditionalPluginsFromSite = ( function () {
                var oUShellPluginManagerConfig, oPluginManagerConfig;
                var oUshellConfig = window["sap-ushell-config"];

                if ( !oUshellConfig || !oUshellConfig.services ) {
                    return false;
                }

                oUShellPluginManagerConfig = oUshellConfig.services.PluginManager;

                oPluginManagerConfig = oUShellPluginManagerConfig && oUShellPluginManagerConfig.config;

                return oPluginManagerConfig && oPluginManagerConfig.loadPluginsFromSite;
            } )();

            if ( bLoadAdditionalPluginsFromSite ) {
                oCDMService = oContainer.getService( "CommonDataModel" );
                oDeferredCDMSitePlugins = oCDMService.getPlugins();
            } else {
                oDeferredCDMSitePlugins = jQuery.when( { } );
            }

            return oDeferredCDMSitePlugins.then( function ( oCDMSitePlugins ) {
                var oAllPlugins = jQuery.extend( true, { }, oConfig.bootstrapPlugins, oCDMSitePlugins );

                oPluginManager = oContainer.getService( "PluginManager" );

                oPluginManager.registerPlugins( oAllPlugins );
            } );
        } );
    };
});
