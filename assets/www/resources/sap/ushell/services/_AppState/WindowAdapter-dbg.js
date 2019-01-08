// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/ushell/services/_AppState/LimitedBuffer"
], function (LimitedBuffer) {
    "use strict";

    var WINDOW_APPSTATE_CAPACITY = 50;

    /**
     * Adapter which is responsible for the storing the application state
     * in the JavaScript window object.
     * The data is stored in sap.ushell.services.AppState.WindowAdapter.prototype.data
     *
     * @param {string} oServiceInstance
     *            Current service instance
     * @param {object} oBackendAdapter
     *            BackendAdapter -> may be undefined
     * @param {object} oConfig
     *   a configuration object which may contain initial appstate data in
     *   the format:
     *    <code>
     *    {initialAppState : { <Key> : JSON.stringify(<content>) ,
     *                         <Key2> : JSON.stringify(<content>)
     *    </code>
     * @private
     * @since 1.28.0
     */
    function WindowAdapter (/* args... */) {
        this._init.apply(this, arguments);
    }

    WindowAdapter.prototype._init = function (oServiceInstance, oBackendAdapter, oConfig) {
        var oInitialAppStates = oConfig && oConfig.config && oConfig.config.initialAppStates || {};
        var oInitialAppStatesPromise = oConfig && oConfig.config && oConfig.config.initialAppStatesPromise;
        this._oServiceInstance = oServiceInstance;
        this._oBackendAdapter = oBackendAdapter;
        // prepare window storage
        if (!WindowAdapter.prototype.data) {
            WindowAdapter.prototype.data = new LimitedBuffer(WINDOW_APPSTATE_CAPACITY);
        }
        if (oInitialAppStatesPromise) {
            oInitialAppStatesPromise.then(function(oInitialAppStates) {
                if (typeof oInitialAppStates === "object") {
                    // register all initial keys
                    Object.keys(oInitialAppStates).forEach(function (sKey) {
                        WindowAdapter.prototype.data.addAsHead(sKey, oInitialAppStates[sKey]);
                    });
                }
            });
        }
        // register all initial keys
        Object.keys(oInitialAppStates).forEach(function (sKey) {
            WindowAdapter.prototype.data.addAsHead(sKey, oInitialAppStates[sKey]);
        });
    };

    /**
     * Method to save an application state in the window object.
     * If a backend adapter is defined, the application state
     * will be also saved in the backend system.
     *
     * @param {string} sKey
     *   Application state key
     * @param {string} sSessionKey
     *   Current session key
     * @param {string} sData
     *   Application state data
     * @param {string} sAppname
     *   Application name
     * @param {string} sComponent
     *   UI5 component name
     * @param {boolean} bTransient
     *   whether the data should be only stored within the window
     *
     * @returns {object} promise
     * @private
     * @since 1.28.0
     */
    WindowAdapter.prototype.saveAppState = function (sKey, sSessionKey, sData, sAppname, sComponent, bTransient) {
        this.sComponent = sComponent;
        var oDeferred = new jQuery.Deferred();
        // save application state in the window object (key and data)
        WindowAdapter.prototype.data.addAsHead(sKey, sData);
        // save application state via backend adapter if available and not transient!
        if (this._oBackendAdapter && !bTransient) {
            return this._oBackendAdapter.saveAppState(sKey, sSessionKey, sData, sAppname, sComponent);
        }
        oDeferred.resolve();
        return oDeferred.promise();
    };

    /**
     * Method to load an application state from the window object.
     * If the respective application state is not found there,
     * it will be loaded from the backend system.
     *
     * @param {string} sKey
     *   Application state key
     *
     * @returns {object} promise
     * @private
     * @since 1.28.0
     */
    WindowAdapter.prototype.loadAppState = function (sKey) {
        var oDeferred = new jQuery.Deferred(),
            appStateFromWindow = WindowAdapter.prototype.data.getByKey(sKey);
        if (appStateFromWindow) {
            setTimeout(function () {
                oDeferred.resolve(sKey, appStateFromWindow.value);
            }, 0);
            return oDeferred.promise();
        }
        // load application state via backend adapter if available
        if (this._oBackendAdapter) {
            this._oBackendAdapter.loadAppState(sKey).done(function(sKey, sData) {
                // save application state in the window object (key and data)
                WindowAdapter.prototype.data.addAsHead(sKey, sData);
                oDeferred.resolve(sKey,sData);
            }).fail(oDeferred.reject.bind(oDeferred));
            return oDeferred.promise();
        }
        oDeferred.reject("AppState.js loadAppState: Application State could not be loaded");
        return oDeferred.promise();
    };

    return WindowAdapter;
});
