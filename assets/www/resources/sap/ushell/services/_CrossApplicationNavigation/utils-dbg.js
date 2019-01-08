// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview Cross Application Navigation utility functions
 *
 * @version 1.52.4
 */

/*global jQuery, sap, window */

sap.ui.define([], function () {
    "use strict";

    /**
     * Returns the options (i.e., parameter name and elements other than
     * values) from a given <code>CrossApplicationNavigation#getLinks</code>
     * 'params' argument - which may or may not have been expressed in extended
     * format.
     *
     * @param {object} oGetLinksParams
     *  <code>#getLinks</code> parameters, for example like:
     *  <pre>
     *  {
     *      p1: "v1",     // single value
     *      p2: ["v2"],   // array-wrapped value
     *      p3: {         // "extended" format
     *          value: ["v3", "v4"],
     *          required: true
     *      }
     *  }
     *  </pre>
     *
     * @return {array}
     *  Just parameter name and options (without value fields). Only parameters
     *  with at least one option will appear in this array. If the caller
     *  specified empty options for a given parameter, the parameter will not
     *  be extracted into the array.
     *
     *  This is an array like:
     * <pre>
     *  [{
     *      name: "p1",
     *      options: {
     *          required: true
     *      }
     *   },
     *   ...
     *  ]
     * </pre>
     *
     * @private
     */
    function extractGetLinksParameterOptions(oGetLinksParams) {
        return parseGetLinksParameters(oGetLinksParams)
            .filter(function (oParsedParam) {
                return Object.keys(oParsedParam.options).length > 0;
            })
            .map(function(oParsedParamWithOptions) {
                return {
                    name: oParsedParamWithOptions.name,
                    options: oParsedParamWithOptions.options
                };
            });
    }

    /**
     * Returns the definition (i.e., parameter name and values only) from a
     * given <code>CrossApplicationNavigation#getLinks</code> 'params' argument
     * - which may or may not have been expressed in extended format.
     *
     * @param {object} oGetLinksParams
     *  <code>#getLinks</code> parameters, for example like:
     *  <pre>
     *  {
     *      p1: "v1",     // single value
     *      p2: ["v2"],   // array-wrapped value
     *      p3: {         // "extended" format
     *          value: ["v3", "v4"],
     *          required: true
     *      }
     *  }
     *  </pre>
     *
     * @return {object}
     *
     * Just parameter name and values (without other option fields) in compact
     * format, suitable for use in combination with <code>URLParsing</code>
     * methods (e.g., <code>URLParsing#paramsToString</code>).
     *
     * <pre>
     *  {
     *      p1: "v1",
     *      p2: ["v2"],
     *      p3: ["v3", "v4"]
     *  }
     * </pre>
     *
     * @private
     */
    function extractGetLinksParameterDefinition(oGetLinksParams) {
        return parseGetLinksParameters(oGetLinksParams)
            .reduce(function(oResultDefinition, oParsedParam) {
                oResultDefinition[oParsedParam.name] = oParsedParam.value;
                return oResultDefinition;
            }, {} /* oResultDefinition */);
    }

    /**
     * Recognize the different parts of the
     * <code>CrossApplicationNavigation#getLinks</code> 'params' argument.
     *
     * @param {object} oGetLinksParams
     *  <code>#getLinks</code> parameters, for example like:
     *  <pre>
     *  {
     *      p1: "v1",     // single value
     *      p2: ["v2"],   // array-wrapped value
     *      p3: {         // "extended" format
     *          value: ["v3", "v4"],
     *          required: true
     *      }
     *  }
     *  </pre>
     *
     * @return {array}
     *
     * Parsed parameters conveniently returned in an array like:
     * <pre>
     * [
     *    { name: "p1", value: "v1"  , options: {} },
     *    { name: "p2", value: ["v2"], options: {} },
     *    {
     *      name: "p3",
     *      value: ["v3", "v4"],
     *      options: { required: true }
     *    },
     * ]
     * </pre>
     *
     * Note:
     * <ul>
     * <li>Parameters returned by this method are not sorted, and caller should
     * assume no particular order when iterating through the results.</li>
     * <li>The name/value/options structure is consistently always returned for
     * each item of the array.</li>
     * <li>The method is pure, does not alter the input object.</li>
     * </ul>
     *
     * @private
     */
    function parseGetLinksParameters(oGetLinksParams) {
        if (Object.prototype.toString.apply(oGetLinksParams) !== "[object Object]") {
            return [];
        }

        var oParamsCopy = JSON.parse(JSON.stringify(oGetLinksParams));

        return Object.keys(oParamsCopy).map(function (sParamName) {
            var vParamValue = oParamsCopy[sParamName];
            var oParamOptions = {};

            if (Object.prototype.toString.apply(vParamValue) === "[object Object]") {
                vParamValue = vParamValue.value;  // take the value...
                delete oParamsCopy[sParamName].value;
                oParamOptions = oParamsCopy[sParamName]; // ... leave the rest
            }

            return {
                name: sParamName,
                value: vParamValue,
                options: oParamOptions
            };
        });
    }

    return {
        extractGetLinksParameterDefinition: extractGetLinksParameterDefinition,
        extractGetLinksParameterOptions: extractGetLinksParameterOptions,
        parseGetLinksParameters: parseGetLinksParameters
    };

}, false /* bExport */);
