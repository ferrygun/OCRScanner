/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([],
    function () {
        "use strict";

        /**
         * Enumeration specifying text colors.
         *
         * @enum {string}
         * @public
         * @author SAP SE
         * @version 1.52.0
         * @experimental Since 1.50.0 This type is experimental and might be modified or removed in future versions.
         * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
         */
        sap.ui.vtm.TextColor = {

            /**
             * The default text color.
             * @public
             */
            Default: "Default",

            /**
             * Gray.
             * @public
             */
            Gray: "Gray",

            /**
             * Grey. A synonym for Gray.
             * @public
             */
            Grey: "Grey"
        };

        return sap.ui.vtm.TextColor;
    });