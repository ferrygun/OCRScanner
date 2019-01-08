/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([],
    function () {
        "use strict";

        /**
         * Enumeration specifying index values for the components of {@link sap.ui.vtm.Matrix} values.
         *
         * @enum {int}
         * @public
         * @author SAP SE
         * @version 1.52.0
         * @experimental Since 1.50.0 This type is experimental and might be modified or removed in future versions.
         * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
         */
        sap.ui.vtm.MatrixComponent = {

            /**
             * The <code>LOCX<code> (X axis translation) component.
             * @public
             */
            LOCX: 0,

            /**
             * The <code>LOCY<code> (Y axis translation) component.
             * @public
             */
            LOCY: 1,

            /**
             * The <code>LOCZ<code> (Z axis translation) component.
             * @public
             */
            LOCZ: 2,

            /**
             * The <code>AXIS1X<code> component.
             * @public
             */
            AXIS1X: 3,

            /**
             * The <code>AXIS1Y<code> component.
             * @public
             */
            AXIS1Y: 4,

            /**
             * The <code>AXIS1Z<code> component.
             * @public
             */
            AXIS1Z: 5,

            /**
             * The <code>AXIS2X<code> component.
             * @public
             */
            AXIS2X: 6,

            /**
             * The <code>AXIS2Y<code> component.
             * @public
             */
            AXIS2Y: 7,

            /**
             * The <code>AXIS2Z<code> component.
             * @public
             */
            AXIS2Z: 8,

            /**
             * The <code>AXIS3X<code> component.
             * @public
             */
            AXIS3X: 9,

            /**
             * The <code>AXIS3Y<code> component.
             * @public
             */
            AXIS3Y: 10,

            /**
             * The <code>AXIS3Z<code> component.
             * @public
             */
            AXIS3Z: 11,

            /**
             * The <code>SCALE<code> component (there is only one scale component for all axes).
             * @public
             */
            SCALE: 12
        };

        return sap.ui.vtm.MatrixComponents;
    });