/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([],
    function () {
        "use strict";

        /**
         * Enumeration specifying predefined views.
         *
         * @enum {string}
         * @public
         * @name sap.ui.vtm.PredefinedView
         * @author SAP SE
         * @version 1.52.0
         * @experimental Since 1.50.0 This type is experimental and might be modified or removed in future versions.
         * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
         */
        var PredefinedView = {

            /**
             * The view from the top.
             * @public
             * @name sap.ui.vtm.PredefinedView.Top
             */
            Top: "Top",

            /**
             * The view from the bottom.
             * @public
             * @name sap.ui.vtm.PredefinedView.Bottom
             */
            Bottom: "Bottom",

            /**
             * The view from the front.
             * @public
             * @name sap.ui.vtm.PredefinedView.Front
             */
            Front: "Front",

            /**
             * The view from the back.
             * @public
             * @name sap.ui.vtm.PredefinedView.Back
             */
            Back: "Back",

            /**
             * The view from the left.
             * @public
             * @name sap.ui.vtm.PredefinedView.Left
             */
            Left: "Left",

            /**
             * The view from the right.
             * @public
             * @name sap.ui.vtm.PredefinedView.Right
             */
            Right: "Right"
        };

        return PredefinedView;
    }, true);