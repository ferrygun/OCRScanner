/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

// Provides enumeration for sap.chart.AutoScaleMode
sap.ui.define(function() {
    "use strict";


    /**
     * @class
     * Enumeration for how the analytical chart adapts the value axis to the data.
     *
     * @static
     * @public
     * @alias sap.chart.AutoScaleMode
     */
    var AutoScaleMode = {
        /**
         * Minimum and maximum value is calculated from the entire data set in the backend, no matter data can be loaded or not, visible or not.
         * @public
         */
        DataSet: "DataSet",
        /**
         * Minimum and maximum value is calculated from the data that are currently visible. Scrolling will change the scale.
         * @public
         */
        VisibleData: "VisibleData"
    };

    return AutoScaleMode;

}, /* bExport= */ true);
