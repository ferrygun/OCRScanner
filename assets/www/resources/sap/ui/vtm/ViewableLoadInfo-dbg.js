/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ["jquery.sap.global", "sap/ui/core/Element"],
    function (jQuery, SapUiCoreElement) {

        "use strict";

        /**
         * This class is not intended to be instantiated directly by application code.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @name sap.ui.vtm.ViewableLoadInfo
         * @public
         * @class
         * Contains information about the result of an attempt to download/load a viewable.
         * 
         * The {@link sap.ui.vtm.Scene.downloadCompleted} and {@link sap.ui.vtm.Scene.loadCompleted} events have a <code>results</code> parameter that is passed an array of {@link sap.ui.vtm.ViewableLoadInfo} objects.
         * {@link sap.ui.vtm.Scene#getViewableLoadInfos} also returns a array of {@link sap.ui.vtm.ViewableLoadInfo} objects for all viewables that have been passed into calls to {@link sap.ui.vtm.Scene#loadViewablesAsync}.
         * @author SAP SE
         * @version 1.52.0
         * @extends sap.ui.core.Element
         */
        var ViewableLoadInfo = SapUiCoreElement.extend("sap.ui.vtm.ViewableLoadInfo", /** @lends sap.ui.vtm.ViewableLoadInfo.prototype */ {

            metadata: {
                properties: {

                    /**
                     * The {@link sap.ui.vtm.Viewable} this {@link sap.ui.vtm.ViewableLoadInfo} relates to.
                     */
                    viewable: {
                        type: "object"
                    },

                    /**
                     * The download/load status of the {@link sap.ui.vtm.Viewable} this {@link sap.ui.vtm.ViewableLoadInfo} relates to.
                     */
                    status: {
                        type: "sap.ui.vtm.ViewableLoadStatus"
                    },

                    /**
                     * The error code describing why the Viewable failed to load.
                     *
                     * Use when {@link #getSucceeded} returns false.
                     */
                    errorCode: {
                        type: "string"
                    },

                    /**
                     * The error text describing why the Viewable failed to load.
                     * This is an untranslated technical message.
                     * Use when {@link #getSucceeded} returns false.
                     */
                    errorText: {
                        type: "string"
                    }
                }
            }
        });

        return ViewableLoadInfo;
    });
