/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([],
    function () {
        "use strict";

        /**
         * Enumeration specifying types of {@link sap.ui.vtm.Column}.
         *
         * @enum {string}
         * @public
         * @author SAP SE
         * @version 1.52.0
         * @experimental Since 1.50.0 This type is experimental and might be modified or removed in future versions.
         * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
         */
        sap.ui.vtm.ColumnType = {

            /**
             * The Metadata column type.
             * This type of column represents metadata retrieved from viewables (or metadata values supplied by the application which will be present in exported viewables).
             * @public
             */
            Metadata : "Metadata",

            /**
             * The Identifier column type.
             * This type of column represents identifiers retrieved from viewables (or metadata values supplied by the application which will be present in exported viewables).
             * @public
             */
            Identifier : "Identifier",

            /**
             * The AppData (application data) column type.
             * This type of column represents application data that is neither metadata nor identifier data.
             * @public
             */
            AppData : "AppData",

            /**
             * The Internal column type.
             * Columns of this type:
             * <ul>
             * <li>Should not be used for application data (all columns of this type are defined by VTM).</li>
             * <li>Is not normally expected to be used by end users (columns of this type are typically expected to be used for development/debugging).</li>
             * </ul>
             * @public
             */
            Internal : "Internal"
        };

        return sap.ui.vtm.ColumnType;
    });