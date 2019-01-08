// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define([
], function () {
    "use strict";

    /**
     * Container for storage with window validity, data is stored in WindowAdapter.prototype.data
     *
     * @param {string} sServiceInstance
     *            ignored
     * @param {object} oBackendAdapter
     *            BackendAdapter -> may be undefined
     *
     * @private
     */

    var WindowAdapter = function (sServiceInstance, oBackendAdapter) {
        this._oBackendAdapter = oBackendAdapter;

        if (!WindowAdapter.prototype.data) {
            WindowAdapter.prototype.data;
        }
    };

    WindowAdapter.prototype.data = {};

    WindowAdapter.prototype.getAdapterContainer = function (sContainerKey, oScope, sAppName) {
        var oBackendContainer = this._oBackendAdapter && this._oBackendAdapter.getAdapterContainer(sContainerKey, oScope, sAppName);
        var WindowAdapterContainer = sap.ui.requireSync("sap/ushell/services/_Personalization/WindowAdapterContainer");
        return new WindowAdapterContainer(sContainerKey, oScope, oBackendContainer);
    };

    WindowAdapter.prototype.delAdapterContainer = function (sContainerKey, oScope) {
        var oDeferred = new jQuery.Deferred();
        delete WindowAdapter.prototype.data[sContainerKey];
        if (this._oBackendAdapter) {
            this._oBackendAdapter.delAdapterContainer(sContainerKey, oScope).done(function () {
                oDeferred.resolve();
            }).fail(function (sMsg) {
                oDeferred.reject(sMsg);
            });
        } else {
            oDeferred.resolve();
        }
        return oDeferred.promise();
    };

    return WindowAdapter;

});
