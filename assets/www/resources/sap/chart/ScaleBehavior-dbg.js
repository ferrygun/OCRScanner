/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

// Provides enumeration for sap.chart.ScaleBehavior
sap.ui.define(function() {
    "use strict";

    /**
     * @class
     * Enumeration for the value axes scale behavior of analytical chart.
     *
     * @static
     * @public
     * @alias sap.chart.ScaleBehavior
     */
    var ScaleBehavior = {
        /**
         * Value axes scale is automatic.
         * @public
         */
        AutoScale: "AutoScale",
        /**
         * Value axes scale is fixed.
         * @public
         */
        FixedScale: "FixedScale"
    };

    return ScaleBehavior;

}, /* bExport= */ true);
