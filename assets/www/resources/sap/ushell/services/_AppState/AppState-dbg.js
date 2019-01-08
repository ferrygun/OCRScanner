// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define([
], function () {

    /**
     * Container for an application state
     * @param {object} oServiceInstance
     *   Ignored
     * @param {string} sKey
     *   Application state key
     * @param {boolean} bModifiable
     *   Distinguishes whether an application state is modifiable or not
     * @param {string} sData
     *   Application state data
     * @param {string} sAppName the frontend component name
     * @param {string} sACHComponent the application component (e.g. CA-UI2-INT-FE)
     * @param {boolean} bTransient
     *  true indicates data should only be stored in the window
     *
     * @private
     */
    function AppState (oServiceInstance, sKey, bModifiable, sData, sAppName, sACHComponent, bTransient) {
        this._oServiceInstance = oServiceInstance;
        this._sKey = sKey;
        this._sData = sData;
        this._sAppName = sAppName;
        this._sACHComponent = sACHComponent;
        this._bTransient = bTransient;

        if (bModifiable) {
            this.setData = function (oData) {
                try {
                    this._sData = JSON.stringify(oData);
                } catch (e) {
                    jQuery.sap.log.error("Data can not be serialized", "sap.ushell.services.AppState.AppState");
                    this._sData = undefined;
                }
            };
            this.save = save.bind(this);
        }
    };

    function save() {
        var oDeferred = new jQuery.Deferred();
        this._oServiceInstance._saveAppState(this._sKey, this._sData, this._sAppName, this._sACHComponent, this._bTransient).done(function () {
            oDeferred.resolve();
        }).fail(function (sMsg) {
            oDeferred.reject(sMsg);
        });
        return oDeferred.promise();
    }

    /**
     * Method to get the data of an application state
     *
     * @returns {object} Application state data
     * @private
     * @since 1.28.0
     */
    AppState.prototype.getData = function () {
        var o;
        if (this._sData === undefined || this._sData === "") {
            return undefined;
        }
        try {
            o = JSON.parse(this._sData);
        } catch (ex) {
            jQuery.sap.log.error("Could not parse [" + this._sData + "]" + ex);
        }
        return o;
    };

    /**
     * Method to get the application state key
     *
     * @returns {string} Application state key
     * @private
     * @since 1.28.0
     */
    AppState.prototype.getKey = function () {
        return this._sKey;
    };

    return AppState;
});
