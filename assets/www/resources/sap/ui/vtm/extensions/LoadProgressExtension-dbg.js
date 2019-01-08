/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

 sap.ui.define(
     ["jquery.sap.global", "../Extension"],
     function (jQuery, SapUiVtmExtension) {

        "use strict";

        /**
         * Constructor for a new LoadProgressExtension.
         * @name sap.ui.vtm.extensions.LoadProgressExtension
         * @public
         * @class
         * Adds a behavior that shows a progress dialog when downloading/loading of viewables is occurring.
         * @author SAP SE
         * @version 1.52.0
         * @constructor
         * @param {string?} sId id for the new {@link sap.ui.vtm.extensions.LoadProgressExtension} instance.
         * @param {object?} mSettings Object with initial property values, aggregated objects etc. for the new {@link sap.ui.vtm.extensions.LoadProgressExtension} instance.
         * @extends sap.ui.vtm.Extension
         * @implements sap.ui.vtm.interfaces.ILoadProgressExtension
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         */
         var LoadProgressExtension = SapUiVtmExtension.extend("sap.ui.vtm.extensions.LoadProgressExtension", /** @lends sap.ui.vtm.extensions.LoadProgressExtension.prototype */ {
             metadata: {
                 interfaces: [
                     "sap.ui.vtm.interfaces.IDownloadProgressExtension",
                     "sap.ui.vtm.interfaces.ILoadProgressExtension"
                 ]
             },

             constructor: function(sId, mSettings) {
                 SapUiVtmExtension.apply(this, arguments); // Force non-lazy construction
             },

            initialize: function(vtm) {
                this._scene = vtm.getScene();
                this._rb = sap.ui.vtm.getResourceBundle();
                this._oDialog = new sap.ui.vtm.ProgressDialog({
                    progressBarVisible: false
                });
                this._downloadInfoByViewable = new Map();
                this._loadInfoByViewable = new Map();

                this._boundDownloadStartedHandler = this._downloadStartedHandler.bind(this);
                this._boundDownloadProgressHandler = this._downloadProgressHandler.bind(this);
                this._boundDownloadCompletedHandler = this._downloadCompletedHandler.bind(this);
                this._boundLoadStartedHandler = this._loadStartedHandler.bind(this);
                this._boundLoadProgressHandler = this._loadProgressHandler.bind(this);
                this._boundLoadCompletedHandler = this._loadCompletedHandler.bind(this);

                this._scene.attachDownloadStarted(this._boundDownloadStartedHandler);
            },

            _setDownloadPercentComplete: function(percentComplete) {
                if (this._oDialog.getPercentComplete() !== percentComplete) {
                    this._oDialog.setPercentComplete(percentComplete);
                    this._oDialog.setProgressText(this._rb.getText("PROGRESS_DOWNLOADING_0", [percentComplete]));
                    sap.ui.getCore().applyChanges();
                }
            },

            _downloadProgressHandler: function(event) {
                if (!this.getEnabled()) {
                    return;
                }

                var viewable = event.getParameter("viewable");
                var downloadedBytes = event.getParameter("downloadedBytes");
                var totalBytes = event.getParameter("totalBytes");

                this._downloadInfoByViewable.set(viewable, {
                    downloadedBytes: downloadedBytes,
                    totalBytes: totalBytes
                });

                var bytesDownloaded = 0, bytesToDownload = 0;
                this._downloadInfoByViewable.forEach(function(value) {
                    bytesDownloaded += value.downloadedBytes;
                    bytesToDownload += value.totalBytes;
                });

                var percentComplete = bytesToDownload == 0
                    ? 0.0
                    : Math.floor(bytesDownloaded / bytesToDownload * 100);

                this._setDownloadPercentComplete(percentComplete);
            },

            _downloadStartedHandler: function(event) {
                if (!this.getEnabled()) {
                    return;
                }
                this._openDialog();
            },

            _setLoadPercentComplete: function(percentComplete) {
                if (this._oDialog.getPercentComplete() !== percentComplete) {
                    this._oDialog.setPercentComplete(percentComplete);
                    this._oDialog.setProgressText(this._rb.getText("PROGRESS_LOADING_0", [percentComplete]));
                    sap.ui.getCore().applyChanges();
                }
            },

            _loadProgressHandler: function(event) {
                if (!this.getEnabled()) {
                    return;
                }

                var viewable = event.getParameter("viewable");
                var percentComplete = event.getParameter("percentage");

                this._loadInfoByViewable.set(viewable, {
                    percentComplete: percentComplete
                });

                var percentageSum = 0;
                var loadingViewablesCount = 0;
                this._loadInfoByViewable.forEach(function(value) {
                    percentageSum += value.percentComplete;
                    loadingViewablesCount++;
                });

                var overallPercentComplete = loadingViewablesCount == 0
                    ? 0
                    : Math.floor(percentageSum / loadingViewablesCount);

                this._setLoadPercentComplete(overallPercentComplete);
            },

            _downloadCompletedHandler: function(event) {
                this._downloadInfoByViewable.clear();
                var viewableLoadInfos = event.getParameter("viewableLoadInfos");
                var allFailed = viewableLoadInfos.every(function(viewableLoadInfo) {
                    return viewableLoadInfo.getStatus() === sap.ui.vtm.ViewableLoadStatus.DownloadFailed;
                });
                if (allFailed) {
                    this._closeDialog();
                }
            },

            _loadStartedHandler: function(event) {
                this._oDialog.setProgressText(this._rb.getText("PROGRESS_LOADING"));
                sap.ui.getCore().applyChanges();
            },

            _loadCompletedHandler: function(event) {
                this._loadInfoByViewable.clear();
                this._closeDialog();
            },

            _openDialog: function() {
                if (!this._oDialog.isOpen()) {
                    this._scene.attachDownloadProgress(this._boundDownloadProgressHandler);
                    this._scene.attachDownloadCompleted(this._boundDownloadCompletedHandler);
                    this._scene.attachLoadStarted(this._boundLoadStartedHandler);
                    this._scene.attachLoadProgress(this._boundLoadProgressHandler);
                    this._scene.attachLoadCompleted(this._boundLoadCompletedHandler);
                    this._oDialog.open();
                    this._setDownloadPercentComplete(0);
                }
            },

            _closeDialog: function() {
                this._scene.detachDownloadProgress(this._boundDownloadProgressHandler);
                this._scene.detachDownloadCompleted(this._boundDownloadCompletedHandler);
                this._scene.detachLoadStarted(this._boundLoadStartedHandler);
                this._scene.detachLoadProgress(this._boundLoadProgressHandler);
                this._scene.detachLoadCompleted(this._boundLoadCompletedHandler);
                this._oDialog.close();
            }
         });

         return LoadProgressExtension;
     });