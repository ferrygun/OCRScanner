// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The Unified Shell's AppLifeCycle service enables plug-ins to enquire the which
 *    application is currently displayed and listen to life cycle events.
 *
 *
 * @version 1.52.4
 */
sap.ui.define([
    "sap/ui/base/EventProvider"
], function (EventProvider) {
    "use strict";
    /*global jQuery*/

    var S_APP_LOADED_EVENT = "appLoaded";

    /**
     * The Unified Shell's AppLifeCycle service
     * This method MUST be called by the Unified Shell's container only, others
     * MUST call <code>sap.ushell.Container.getService("AppLifeCycle")</code>.
     * Constructs a new instance of the AppLifeCycle service.
     *
     * @name sap.ushell.services.AppLifeCycle
     *
     * @param {object} oAdapter
     *   The service adapter for the AppLifeCycle service,
     *   as already provided by the container
     * @param {object} oContainerInterface interface
     * @param {string} sParameter Service instantiation
     * @param {object} oConfig service configuration (not in use)
     *
     *
     * @constructor
     * @class
     * @see sap.ushell.services.Container#getService
     *
     * @since 1.38
     * @public
     */
    function AppLifeCycle(oAdapter, oContainerInterface, sParameter, oConfig) {

        var oCurrentApplication,
            oEventProvider,
            oViewPortContainer;

        /**
         * Get information about the currently running application. The function returns an
         * object with following parameters:
         *   - applicationType: “UI5|WDA|NWBC|URL|GUI”
         *   - componentInstance: reference to component (only for type SAPUI5)
         *   - homePage: true is Shell-home is currently displayed
         *
         * @returns {object}
         *   the currently alive application component or undefined if no component alive
         *
         * @since 1.38
         * @public
         * @alias sap.ushell.services.AppLifeCycle#getCurrentApplication
         */
        this.getCurrentApplication = function () {
            return oCurrentApplication;
        };

        /**
         * Attaches an event handler for the appLoaded event. This event handler will be triggered
         * each time an application has been loaded.
         *
         * @param {object} oData
         *     An object that will be passed to the handler along with the event object when the
         *     event is fired.
         * @param {function} fnFunction
         *     The handler function to call when the event occurs.
         * @param {object} oListener
         *     The object that wants to be notified when the event occurs (this context within the
         *     handler function).
         * @since 1.38
         * @public
         * @alias sap.ushell.services.AppLifeCycle#attachAppLoaded
         */
        this.attachAppLoaded = function (oData, fnFunction, oListener) {
            oEventProvider.attachEvent(S_APP_LOADED_EVENT, oData, fnFunction, oListener);
        };

        /**
         * Detaches an event handler from the EventProvider.
         *
         * @param {function} fnFunction
         *     The handler function that has to be detached from the EventProvider.
         * @param {object} oListener
         *     The object that wanted to be notified when the event occurred
         * @since 1.38
         * @public
         * @alias sap.ushell.services.AppLifeCycle#detachAppLoaded
         */
        this.detachAppLoaded = function (fnFunction, oListener) {
            oEventProvider.detachEvent(S_APP_LOADED_EVENT, fnFunction, oListener);
        };


        // CONSTRUCTOR CODE //
        oEventProvider = new EventProvider();

        // only continue executing the constructor if the view port container exists in expected format
        oViewPortContainer = sap.ui.getCore().byId("viewPortContainer");
        if (!oViewPortContainer || typeof oViewPortContainer.attachAfterNavigate !== "function") {
            jQuery.sap.log.error(
                "Error during instantiation of AppLifeCycle service",
                "Could not attach to afterNavigate event",
                "sap.ushell.services.AppLifeCycle"
            );
            return;
        }

        oViewPortContainer.attachAfterNavigate(function (oEvent) {
            var oApplicationContainer,
                sApplicationType,
                oComponentInstance,
                bHomePage = false;

            if (oEvent.mParameters.toId.indexOf("applicationShellPage") === 0) {
                // instance is a shell, which hosts the ApplicationContainer
                oApplicationContainer = oEvent.mParameters.to.getApp();
            } else if (oEvent.mParameters.toId.indexOf("application") === 0) {
                // instance is already the ApplicationContainer
                oApplicationContainer = oEvent.mParameters.to;
            }

            // try to get component instance if accessible via the component handle
            if (oApplicationContainer && typeof oApplicationContainer.getComponentHandle === "function"
                    && oApplicationContainer.getComponentHandle()) {
                oComponentInstance = oApplicationContainer.getComponentHandle().getInstance();
            }

            // determine if we're dealing with home page by checking the component instance id
            if (oComponentInstance && oComponentInstance.getId() === "application-Shell-home-component") {
                bHomePage = true;
            }

            // type can either be read from application container or set to UI5 if component instance exists
            sApplicationType = oApplicationContainer &&
                typeof oApplicationContainer.getApplicationType === "function" &&
                oApplicationContainer.getApplicationType();
            if ((!sApplicationType || sApplicationType === "URL") && oComponentInstance) {
                sApplicationType = "UI5";
            }

            oCurrentApplication = {
                applicationType: sApplicationType,
                componentInstance: oComponentInstance,
                homePage: bHomePage
            };

            setTimeout(function () {
                oEventProvider.fireEvent(S_APP_LOADED_EVENT, oCurrentApplication);
            }, 0);
        });
    }

    AppLifeCycle.hasNoAdapter = true;
    return AppLifeCycle;

}, true/* bExport */);
