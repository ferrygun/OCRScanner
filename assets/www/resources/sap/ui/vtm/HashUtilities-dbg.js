/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ['jquery.sap.global'],
    function(jQuery) {

        "use strict";

        /**
         * A set of utility functions for working with hash values.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @public
         * @namespace
         * @name sap.ui.vtm.HashUtilities
         * @author SAP SE
         * @version 1.52.0
         */
        var HashUtilities = {};

        /**
         * Creates a hash code for a string.
         *
         * The resulting hash value can be any integer value.
         * Use {@link sap.ui.vtm.HashUtilities.normalizeHash} on the result to create a hash code that is useful as a key in a {@link sap.ui.vtm.Lookup}.
         * @public
         * @function
         * @name sap.ui.vtm.HashUtilities.hashString
         * @param {string} stringToHash The string to hash.
         * @returns {int} The hash code value for the string.
         */
        HashUtilities.hashString = function (stringToHash) {
            var hashCode = 0xC716A2B2;
            for (var i = 0; i < stringToHash.length; i++) {
                hashCode = ((hashCode + stringToHash.charCodeAt(i)) * 7) | 0;
            }
            return hashCode;
        };

        /**
         * Creates a hash code for a {@link sap.ui.vtm.Matrix} value.
         *
         * The resulting hash value can be any integer value.
         * Use {@link sap.ui.vtm.HashUtilities.normalizeHash} on the result to create a hash code that is useful as a key in a {@link sap.ui.vtm.Lookup}.
         * @public
         * @function
         * @name sap.ui.vtm.HashUtilities.hashMatrix
         * @param {sap.ui.vtm.Matrix} vtmMatrix The matrix to hash.
         * @returns {int} The hash code for the specified transformation matrix.
         */
        HashUtilities.hashMatrix = function (vtmMatrix) {
            var hashCode = 0x16C7;
            for (var i = 0; i < vtmMatrix.length; i++) {
                var componentVal = Math.round(Math.round(vtmMatrix[i] * 10.0) / 10.0);
                hashCode = ((componentVal + hashCode) * 7) | 0;
            }
            return hashCode;
        };

        /**
         * Normalizes a hash code to a range between 0 and an upper bound.
         * Useful for creating a hash code that can be used as a key in a {@link sap.ui.vtm.Lookup} (to limit the number of buckets in the lookup).
         * @public
         * @function
         * @name sap.ui.vtm.HashUtilities.normalizeHash
         * @param {int} hashValue A hash code to normalize.
         * @param {int?} upperLimit An upper bound for the hash code value. Defaults to 50000.
         * @returns {int} The normalized hash code.
         */
        HashUtilities.normalizeHash = function(hashValue, upperLimit) {
            if (!upperLimit) {
                upperLimit = 50000;
            }
            return Math.abs(hashValue) % upperLimit;
        };

        /**
         * Creates a single hash code from a set of hash code values and normalizes it using {@link sap.ui.vtm.HashUtilities.normalizeHash}.
         * @public
         * @function
         * @name sap.ui.vtm.HashUtilities.combineHashes
         * @param {int[]} hashValues A set of hash code values to combine.
         * @param {int?} upperLimit An upper bound for the hash code. Defaults to 50000.
         * @returns {int} The combined hash code.
         */
        HashUtilities.combineHashes = function (hashValues, upperLimit) {
            var hashValue = 0xF23916C7;
            for (var i = 0; i < hashValues.length; i++) {
                hashValue = ((hashValues[i] + hashValue) * 3) | 0;
            }
            return HashUtilities.normalizeHash(hashValue, upperLimit);
        };

        return HashUtilities;
    },
    true);
