/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([],
    function () {
        "use strict";

        /**
         * Enumeration specifying row selection modes for a {@link sap.ui.vtm.Tree}.
         *
         * @enum {string}
         * @public
         * @author SAP SE
         * @version 1.52.0
         * @experimental Since 1.50.0 This type is experimental and might be modified or removed in future versions.
         * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
         */
        sap.ui.vtm.SelectionMode = {

            /**
             * Single selection mode.
             * @public
             */
            Single: "Single",

            /**
             * A multiple selection mode that toggles the selection state of a row when it is clicked.
             * @public
             */
            MultiToggle: "MultiToggle"
        };

        return sap.ui.vtm.SelectionMode;
    });