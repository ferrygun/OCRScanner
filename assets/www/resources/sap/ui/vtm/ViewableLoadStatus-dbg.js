/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([],
    function () {
        "use strict";

        /**
         * Enumeration specifying the download/load status of a {@link sap.ui.vtm.Viewable}.
         *
         * @enum {string}
         * @public
         * @author SAP SE
         * @version 1.52.0
         * @experimental Since 1.50.0 This type is experimental and might be modified or removed in future versions.
         * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
         */
        sap.ui.vtm.ViewableLoadStatus = {

            /**
             * The {@link sap.ui.vtm.Viewable} is being downloaded.
             * @public
             */
            Downloading: "Downloading",

            /**
             * The {@link sap.ui.vtm.Viewable} was downloaded successfully.
             * @public
             */
            Downloaded: "Downloaded",

            /**
             * The attempt to download the {@link sap.ui.vtm.Viewable} failed.
             * @public
             */
            DownloadFailed: "DownloadFailed",

            /**
             * The {@link sap.ui.vtm.Viewable} is being loaded.
             * @public
             */
            Loading: "Loading",

            /**
             * The {@link sap.ui.vtm.Viewable} was loaded successfully.
             * @public
             */
            Loaded: "Loaded",

            /**
             * The attempt to load the {@link sap.ui.vtm.Viewable} failed.
             * @public
             */
            LoadFailed: "LoadFailed"
        };

        return sap.ui.vtm.TextColor;
    });