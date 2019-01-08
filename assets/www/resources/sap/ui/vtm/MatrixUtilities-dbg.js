/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ['jquery.sap.global'],
    function(jQuery) {

        "use strict";

        var LOCX = 0,
            LOCY = 1,
            LOCZ = 2,
            AXIS1X = 3,
            AXIS1Y = 4,
            AXIS1Z = 5,
            AXIS2X = 6,
            AXIS2Y = 7,
            AXIS2Z = 8,
            AXIS3X = 9,
            AXIS3Y = 10,
            AXIS3Z = 11,
            SCALE = 12,
            VSM_AXIS1X = 0,
            VSM_AXIS1Y = 1,
            VSM_AXIS1Z = 2,
            VSM_AXIS2X = 3,
            VSM_AXIS2Y = 4,
            VSM_AXIS2Z = 5,
            VSM_AXIS3X = 6,
            VSM_AXIS3Y = 7,
            VSM_AXIS3Z = 8,
            VSM_LOCX = 9,
            VSM_LOCY = 10,
            VSM_LOCZ = 11,
            VSM_SCALE = 12;

        /**
         * A set of utility functions for working with transformation matrices in a ISO 10303-42 format (in the form of a 1 dimensional array of 13 numbers)
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @public
         * @namespace
         * @name sap.ui.vtm.MatrixUtilities
         * @author SAP SE
         * @version 1.52.0
         */
        var MatrixUtilities = {};

        /**
         * Returns true if the parameter represents a valid transformation matrix.
         * @public
         * @function
         * @name sap.ui.vtm.MatrixUtilities.isValid
         * @param {sap.ui.vtm.Matrix} vtmMatrix The transformation matrix to check.
         * @param {boolean} checkInvertibility Checks whether the matrix is invertible.<br/>
         * Matrices must be invertible to be used as transformation matrices.<br/>
         * This check is optional due to the additional cost of performing it.
         * @returns {boolean} true if the parameter represents a valid transformation matrix.
         */
        MatrixUtilities.isValid = function (vtmMatrix, checkInvertibility) {
            if (!vtmMatrix || !Array.isArray(vtmMatrix) || vtmMatrix.length !== 13) {
                return false;
            }
            if (checkInvertibility) {
                return MatrixUtilities.isInvertible(vtmMatrix);
            }
            return true;
        };

        /**
         * Returns an identity transformation matrix.
         * @public
         * @function
         * @name sap.ui.vtm.MatrixUtilities.createIdentity
         * @returns {sap.ui.vtm.Matrix} A new identity transformation matrix.
         */
        MatrixUtilities.createIdentity = function () {
            return [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1];
        };

        /**
         * Returns true when the two matrix parameters are equal.
         * @public
         * @function
         * @name sap.ui.vtm.MatrixUtilities.areEqual
         * @param {sap.ui.vtm.Matrix} vtmMatrixA One matrix to compare.
         * @param {sap.ui.vtm.Matrix} vtmMatrixB The other matrix to compare.
         * @returns {boolean} <code>true</code> if the two matrix parameters are equal.
         */
        MatrixUtilities.areEqual = function (vtmMatrixA, vtmMatrixB) {
            for (var i = 0; i < vtmMatrixA.length; i++) {
                if (Math.abs(vtmMatrixA[i] - vtmMatrixB[i]) > 0.01) {
                    return false;
                }
            }
            return true;
        };

        /**
         * Returns whether a matrix is invertible.
         * @public
         * @function
         * @name sap.ui.vtm.MatrixUtilities.isInvertible
         * @param {sap.ui.vtm.Matrix} vtmMatrix The matrix to check.
         * @returns {boolean} Whether the matrix is invertible.
         */
        MatrixUtilities.isInvertible = function (vtmMatrix) {
            var pos = 0.0,
                neg = 0.0,
                mAXIS1X = vtmMatrix[AXIS1X],
                mAXIS1Y = vtmMatrix[AXIS1Y],
                mAXIS1Z = vtmMatrix[AXIS1Z],
                mAXIS2X = vtmMatrix[AXIS2X],
                mAXIS2Y = vtmMatrix[AXIS2Y],
                mAXIS2Z = vtmMatrix[AXIS2Z],
                mAXIS3X = vtmMatrix[AXIS3X],
                mAXIS3Y = vtmMatrix[AXIS3Y],
                mAXIS3Z = vtmMatrix[AXIS3Z],
                t = mAXIS1X * mAXIS2Y * mAXIS3Z;

            if (t >= 0.0) {
                pos += t;
            } else {
                neg += t;
            }
            t = mAXIS2X * mAXIS3Y * mAXIS1Z;
            if (t >= 0.0) {
                pos += t;
            } else {
                neg += t;
            }
            t = mAXIS3X * mAXIS1Y * mAXIS2Z;
            if (t >= 0.0) {
                pos += t;
            } else {
                neg += t;
            }
            t = -mAXIS3X * mAXIS2Y * mAXIS1Z;
            if (t >= 0.0) {
                pos += t;
            } else {
                neg += t;
            }
            t = -mAXIS2X * mAXIS1Y * mAXIS3Z;
            if (t >= 0.0) {
                pos += t;
            } else {
                neg += t;
            }
            t = -mAXIS1X * mAXIS3Y * mAXIS2Z;
            if (t >= 0.0) {
                pos += t;
            } else {
                neg += t;
            }
            var det = pos + neg;
            if (det == 0 || Math.abs(det) < ((pos - neg) * 1.0e-12)) {
                return false;
            }
            return true;
        };

        /**
         * Returns the inverse of the passed matrix without modifying the passed matrix.
         * @public
         * @function
         * @name sap.ui.vtm.MatrixUtilities.invert
         * @param {sap.ui.vtm.Matrix} vtmMatrix The matrix to invert.
         * @returns {sap.ui.vtm.Matrix} The inverse of the specified matrix.
         */
        MatrixUtilities.invert = function (vtmMatrix) {
            var pos = 0.0,
                neg = 0.0,
                mLOCX = vtmMatrix[LOCX],
                mLOCY = vtmMatrix[LOCY],
                mLOCZ = vtmMatrix[LOCZ],
                mAXIS1X = vtmMatrix[AXIS1X],
                mAXIS1Y = vtmMatrix[AXIS1Y],
                mAXIS1Z = vtmMatrix[AXIS1Z],
                mAXIS2X = vtmMatrix[AXIS2X],
                mAXIS2Y = vtmMatrix[AXIS2Y],
                mAXIS2Z = vtmMatrix[AXIS2Z],
                mAXIS3X = vtmMatrix[AXIS3X],
                mAXIS3Y = vtmMatrix[AXIS3Y],
                mAXIS3Z = vtmMatrix[AXIS3Z],
                t = mAXIS1X * mAXIS2Y * mAXIS3Z,
                ret = MatrixUtilities.createIdentity();

            // Calculate the determinant of the matrix and determine if the
            // the matrix is singular as limited by the double precision
            // floating-point data representation.
            if (t >= 0.0) {
                pos += t;
            } else {
                neg += t;
            }
            t = mAXIS2X * mAXIS3Y * mAXIS1Z;
            if (t >= 0.0) {
                pos += t;
            } else {
                neg += t;
            }
            t = mAXIS3X * mAXIS1Y * mAXIS2Z;
            if (t >= 0.0) {
                pos += t;
            } else {
                neg += t;
            }
            t = -mAXIS3X * mAXIS2Y * mAXIS1Z;
            if (t >= 0.0) {
                pos += t;
            } else {
                neg += t;
            }
            t = -mAXIS2X * mAXIS1Y * mAXIS3Z;
            if (t >= 0.0) {
                pos += t;
            } else {
                neg += t;
            }
            t = -mAXIS1X * mAXIS3Y * mAXIS2Z;
            if (t >= 0.0) {
                pos += t;
            } else {
                neg += t;
            }
            var det = pos + neg;
            // Is the matrix singular?
            if (det == 0 || Math.abs(det) < ((pos - neg) * 1.0e-12)) {
                return ret;
            }
            // Calculate inverse(A) = adj(A) / det(A)
            var det1 = 1.0 / det;
            ret[AXIS1X] = ((mAXIS2Y * mAXIS3Z - mAXIS3Y * mAXIS2Z) * det1);
            ret[AXIS1Y] = (-(mAXIS1Y * mAXIS3Z - mAXIS3Y * mAXIS1Z) * det1);
            ret[AXIS1Z] = ((mAXIS1Y * mAXIS2Z - mAXIS2Y * mAXIS1Z) * det1);
            ret[AXIS2X] = (-(mAXIS2X * mAXIS3Z - mAXIS3X * mAXIS2Z) * det1);
            ret[AXIS2Y] = ((mAXIS1X * mAXIS3Z - mAXIS3X * mAXIS1Z) * det1);
            ret[AXIS2Z] = (-(mAXIS1X * mAXIS2Z - mAXIS2X * mAXIS1Z) * det1);
            ret[AXIS3X] = ((mAXIS2X * mAXIS3Y - mAXIS3X * mAXIS2Y) * det1);
            ret[AXIS3Y] = (-(mAXIS1X * mAXIS3Y - mAXIS3X * mAXIS1Y) * det1);
            ret[AXIS3Z] = ((mAXIS1X * mAXIS2Y - mAXIS2X * mAXIS1Y) * det1);
            /* Calculate -C * inverse(A) */
            ret[LOCX] = -(
                mLOCX * ret[AXIS1X] +
                mLOCY * ret[AXIS2X] +
                mLOCZ * ret[AXIS3X]);
            ret[LOCY] = -(
                mLOCX * ret[AXIS1Y] +
                mLOCY * ret[AXIS2Y] +
                mLOCZ * ret[AXIS3Y]);
            ret[LOCZ] = -(
                mLOCX * ret[AXIS1Z] +
                mLOCY * ret[AXIS2Z] +
                mLOCZ * ret[AXIS3Z]);
            return ret;
        };

        /**
         * Converts a {@link sap.ui.vtm.Matrix} to a 4x4 transformation matrix.
         * @public
         * @function
         * @name sap.ui.vtm.MatrixUtilities.to4x4Matrix
         * @param {sap.ui.vtm.Matrix} vtmMatrix The {@link sap.ui.vtm.Matrix} value to convert.
         * @returns {number[]} A 4x4 transformation matrix (represented as an array of arrays of numbers).
         */
        MatrixUtilities.to4x4Matrix = function (vtmMatrix) {
            var mat4x4 = [];
            mat4x4[0] = [
                vtmMatrix[AXIS1X],
                vtmMatrix[AXIS1Y],
                vtmMatrix[AXIS1Z],
                0
            ];
            mat4x4[1] = [
                vtmMatrix[AXIS2X],
                vtmMatrix[AXIS2Y],
                vtmMatrix[AXIS2Z],
                0
            ];
            mat4x4[2] = [
                vtmMatrix[AXIS3X],
                vtmMatrix[AXIS3Y],
                vtmMatrix[AXIS3Z],
                0
            ];
            mat4x4[3] = [
                vtmMatrix[LOCX],
                vtmMatrix[LOCY],
                vtmMatrix[LOCZ],
                vtmMatrix[SCALE]
            ];
            return mat4x4;
        };

        /**
         * Converts a 4x4 transformation matrix to a {@link sap.ui.vtm.Matrix}.
         * @public
         * @function
         * @name sap.ui.vtm.MatrixUtilities.from4x4Matrix
         * @param {number[]} mat4x4 The 4x4 matrix (represented as an array of arrays of numbers) to convert.
         * @returns {sap.ui.vtm.Matrix} The {@link sap.ui.vtm.Matrix} value.
         */
        MatrixUtilities.from4x4Matrix = function (mat4x4) {
            var vtmMatrix = [];
            vtmMatrix[AXIS1X] = mat4x4[0][0];
            vtmMatrix[AXIS1Y] = mat4x4[0][1];
            vtmMatrix[AXIS1Z] = mat4x4[0][2];
            vtmMatrix[AXIS2X] = mat4x4[1][0];
            vtmMatrix[AXIS2Y] = mat4x4[1][1];
            vtmMatrix[AXIS2Z] = mat4x4[1][2];
            vtmMatrix[AXIS3X] = mat4x4[2][0];
            vtmMatrix[AXIS3Y] = mat4x4[2][1];
            vtmMatrix[AXIS3Z] = mat4x4[2][2];
            vtmMatrix[LOCX] = mat4x4[3][0];
            vtmMatrix[LOCY] = mat4x4[3][1];
            vtmMatrix[LOCZ] = mat4x4[3][2];
            vtmMatrix[SCALE] = mat4x4[3][3];
            return vtmMatrix;
        };

        /**
         * Converts a {@link sap.ui.vk.TransformationMatrix} (as used by the sap.ui.vk library) to a {@link sap.ui.vtm.Matrix} value.
         * @public
         * @function
         * @name sap.ui.vtm.MatrixUtilities.fromVkMatrix
         * @param {sap.ui.vk.TransformationMatrix} vkMatrix The VIT transformation matrix.
         * @returns {sap.ui.vtm.Matrix} The {@link sap.ui.vtm.Matrix} value.
         */
        MatrixUtilities.fromVkMatrix = function (vkMatrix) {
            var vtmMatrix = [];
            vtmMatrix[AXIS1X] = vkMatrix[0];
            vtmMatrix[AXIS1Y] = vkMatrix[1];
            vtmMatrix[AXIS1Z] = vkMatrix[2];
            vtmMatrix[AXIS2X] = vkMatrix[3];
            vtmMatrix[AXIS2Y] = vkMatrix[4];
            vtmMatrix[AXIS2Z] = vkMatrix[5];
            vtmMatrix[AXIS3X] = vkMatrix[6];
            vtmMatrix[AXIS3Y] = vkMatrix[7];
            vtmMatrix[AXIS3Z] = vkMatrix[8];
            vtmMatrix[LOCX]   = vkMatrix[9];
            vtmMatrix[LOCY]   = vkMatrix[10];
            vtmMatrix[LOCZ]   = vkMatrix[11];
            vtmMatrix[SCALE]  = 1;
            return vtmMatrix;
        };

        /**
         * Converts a {@link sap.ui.vtm.Matrix} value to a {@link sap.ui.vk.TransformationMatrix} as used by the sap.ui.vk library.
         * @public
         * @function
         * @name sap.ui.vtm.MatrixUtilities.toVkMatrix
         * @param {sap.ui.vtm.Matrix} vtmMatrix The {@link sap.ui.vtm.Matrix} value
         * @returns {sap.ui.vk.TransformationMatrix} The {@link sap.ui.vk.TransformationMatrix} value.
         */
        MatrixUtilities.toVkMatrix = function (vtmMatrix) {
            var vkMatrix = [];
            vkMatrix[0] = vtmMatrix[AXIS1X];
            vkMatrix[1] = vtmMatrix[AXIS1Y];
            vkMatrix[2] = vtmMatrix[AXIS1Z];
            vkMatrix[3] = vtmMatrix[AXIS2X];
            vkMatrix[4] = vtmMatrix[AXIS2Y];
            vkMatrix[5] = vtmMatrix[AXIS2Z];
            vkMatrix[6] = vtmMatrix[AXIS3X];
            vkMatrix[7] = vtmMatrix[AXIS3Y];
            vkMatrix[8] = vtmMatrix[AXIS3Z];
            vkMatrix[9] = vtmMatrix[LOCX];
            vkMatrix[10] = vtmMatrix[LOCY];
            vkMatrix[11] = vtmMatrix[LOCZ];
            return vkMatrix;
        };

        /**
         * Converts a VSM transformation matrix string to a {@link sap.ui.vtm.Matrix} value.
         * @public
         * @function
         * @name sap.ui.vtm.MatrixUtilities.fromVsmMatrixString
         * @param {string} vsmMatrixString The VSM transformation matrix string.
         * @returns {sap.ui.vtm.Matrix} The {@link sap.ui.vtm.Matrix} value.
         */
        MatrixUtilities.fromVsmMatrixString = function (vsmMatrixString) {
            var vsmMatrix = vsmMatrixString
                .split(" ")
                .map(function (component) { return parseFloat(component); });

            var vtmMatrix = [];
            vtmMatrix[AXIS1X] = vsmMatrix[VSM_AXIS1X];
            vtmMatrix[AXIS1Y] = vsmMatrix[VSM_AXIS1Y];
            vtmMatrix[AXIS1Z] = vsmMatrix[VSM_AXIS1Z];
            vtmMatrix[AXIS2X] = vsmMatrix[VSM_AXIS2X];
            vtmMatrix[AXIS2Y] = vsmMatrix[VSM_AXIS2Y];
            vtmMatrix[AXIS2Z] = vsmMatrix[VSM_AXIS2Z];
            vtmMatrix[AXIS3X] = vsmMatrix[VSM_AXIS3X];
            vtmMatrix[AXIS3Y] = vsmMatrix[VSM_AXIS3Y];
            vtmMatrix[AXIS3Z] = vsmMatrix[VSM_AXIS3Z];
            vtmMatrix[LOCX] = vsmMatrix[VSM_LOCX];
            vtmMatrix[LOCY] = vsmMatrix[VSM_LOCY];
            vtmMatrix[LOCZ] = vsmMatrix[VSM_LOCZ];
            vtmMatrix[SCALE] = vsmMatrix[VSM_SCALE];
            return vtmMatrix;
        };

        /**
         * Converts a {@link sap.ui.vtm.Matrix} value to a VSM transformation matrix string.
         * @public
         * @function
         * @name sap.ui.vtm.MatrixUtilities.toVsmMatrixString
         * @param {sap.ui.vtm.Matrix} vtmMatrix The {@link sap.ui.vtm.Matrix} value.
         * @returns {string} The VSM transformation matrix string.
         */
        MatrixUtilities.toVsmMatrixString = function (vtmMatrix) {
            var vsmMatrix = [];
            vsmMatrix[VSM_AXIS1X] = vtmMatrix[AXIS1X];
            vsmMatrix[VSM_AXIS1Y] = vtmMatrix[AXIS1Y];
            vsmMatrix[VSM_AXIS1Z] = vtmMatrix[AXIS1Z];
            vsmMatrix[VSM_AXIS2X] = vtmMatrix[AXIS2X];
            vsmMatrix[VSM_AXIS2Y] = vtmMatrix[AXIS2Y];
            vsmMatrix[VSM_AXIS2Z] = vtmMatrix[AXIS2Z];
            vsmMatrix[VSM_AXIS3X] = vtmMatrix[AXIS3X];
            vsmMatrix[VSM_AXIS3Y] = vtmMatrix[AXIS3Y];
            vsmMatrix[VSM_AXIS3Z] = vtmMatrix[AXIS3Z];
            vsmMatrix[VSM_LOCX] = vtmMatrix[LOCX];
            vsmMatrix[VSM_LOCY] = vtmMatrix[LOCY];
            vsmMatrix[VSM_LOCZ] = vtmMatrix[LOCZ];
            vsmMatrix[VSM_SCALE] = vtmMatrix[SCALE];
            return vsmMatrix.join(" ");
        };

        /**
         * Returns the result of multiplying two matrices (without modifying the passed matrices).
         * @public
         * @function
         * @name sap.ui.vtm.MatrixUtilities.multiply
         * @param {sap.ui.vtm.Matrix} vtmMatrixA One multiplicand.
         * @param {sap.ui.vtm.Matrix} vtmMatrixB The other multiplicand.
         * @returns {sap.ui.vtm.Matrix} The matrix representing the multiplication result.
         */
        MatrixUtilities.multiply = function (vtmMatrixA, vtmMatrixB) {
            var ret = [],
                aLOCX = vtmMatrixA[LOCX],
                aLOCY = vtmMatrixA[LOCY],
                aLOCZ = vtmMatrixA[LOCZ],
                aAXIS1X = vtmMatrixA[AXIS1X],
                aAXIS1Y = vtmMatrixA[AXIS1Y],
                aAXIS1Z = vtmMatrixA[AXIS1Z],
                aAXIS2X = vtmMatrixA[AXIS2X],
                aAXIS2Y = vtmMatrixA[AXIS2Y],
                aAXIS2Z = vtmMatrixA[AXIS2Z],
                aAXIS3X = vtmMatrixA[AXIS3X],
                aAXIS3Y = vtmMatrixA[AXIS3Y],
                aAXIS3Z = vtmMatrixA[AXIS3Z],
                aSCALE = vtmMatrixA[SCALE],
                bLOCX = vtmMatrixB[LOCX],
                bLOCY = vtmMatrixB[LOCY],
                bLOCZ = vtmMatrixB[LOCZ],
                bAXIS1X = vtmMatrixB[AXIS1X],
                bAXIS1Y = vtmMatrixB[AXIS1Y],
                bAXIS1Z = vtmMatrixB[AXIS1Z],
                bAXIS2X = vtmMatrixB[AXIS2X],
                bAXIS2Y = vtmMatrixB[AXIS2Y],
                bAXIS2Z = vtmMatrixB[AXIS2Z],
                bAXIS3X = vtmMatrixB[AXIS3X],
                bAXIS3Y = vtmMatrixB[AXIS3Y],
                bAXIS3Z = vtmMatrixB[AXIS3Z],
                bSCALE = vtmMatrixB[SCALE];

            ret[AXIS1X] =
                aAXIS1X * bAXIS1X +
                aAXIS1Y * bAXIS2X +
                aAXIS1Z * bAXIS3X;
            ret[AXIS1Y] =
                aAXIS1X * bAXIS1Y +
                aAXIS1Y * bAXIS2Y +
                aAXIS1Z * bAXIS3Y;
            ret[AXIS1Z] =
                aAXIS1X * bAXIS1Z +
                aAXIS1Y * bAXIS2Z +
                aAXIS1Z * bAXIS3Z;
            ret[AXIS2X] =
                aAXIS2X * bAXIS1X +
                aAXIS2Y * bAXIS2X +
                aAXIS2Z * bAXIS3X;
            ret[AXIS2Y] =
                aAXIS2X * bAXIS1Y +
                aAXIS2Y * bAXIS2Y +
                aAXIS2Z * bAXIS3Y;
            ret[AXIS2Z] =
                aAXIS2X * bAXIS1Z +
                aAXIS2Y * bAXIS2Z +
                aAXIS2Z * bAXIS3Z;
            ret[AXIS3X] =
                aAXIS3X * bAXIS1X +
                aAXIS3Y * bAXIS2X +
                aAXIS3Z * bAXIS3X;
            ret[AXIS3Y] =
                aAXIS3X * bAXIS1Y +
                aAXIS3Y * bAXIS2Y +
                aAXIS3Z * bAXIS3Y;
            ret[AXIS3Z] =
                aAXIS3X * bAXIS1Z +
                aAXIS3Y * bAXIS2Z +
                aAXIS3Z * bAXIS3Z;
            ret[LOCX] =
                aLOCX * bAXIS1X +
                aLOCY * bAXIS2X +
                aLOCZ * bAXIS3X +
                aSCALE * bLOCX;
            ret[LOCY] =
                aLOCX * bAXIS1Y +
                aLOCY * bAXIS2Y +
                aLOCZ * bAXIS3Y +
                aSCALE * bLOCY;
            ret[LOCZ] =
                aLOCX * bAXIS1Z +
                aLOCY * bAXIS2Z +
                aLOCZ * bAXIS3Z +
                aSCALE * bLOCZ;
            ret[SCALE] =
                aSCALE * bSCALE;
            return ret;
        };
        
        /**
         * Gets an array of localized names for the transformation matrix components.
         * Intended for use in matrix string formatters.
         * @private
         * @function
         * @return {string[]} The localized names for the transformation matrix components.
         */
        MatrixUtilities.getMatrixComponentNames = function() {
            if (!MatrixUtilities._matrixComponentNames) {
                var rb = sap.ui.vtm.getResourceBundle();
                MatrixUtilities._matrixComponentNames = [
                    rb.getText("TMATRIXCOMPONENT_LOCX"),
                    rb.getText("TMATRIXCOMPONENT_LOCY"),
                    rb.getText("TMATRIXCOMPONENT_LOCZ"),
                    rb.getText("TMATRIXCOMPONENT_AXIS1X"),
                    rb.getText("TMATRIXCOMPONENT_AXIS1Y"),
                    rb.getText("TMATRIXCOMPONENT_AXIS1Z"),
                    rb.getText("TMATRIXCOMPONENT_AXIS2X"),
                    rb.getText("TMATRIXCOMPONENT_AXIS2Y"),
                    rb.getText("TMATRIXCOMPONENT_AXIS2Z"),
                    rb.getText("TMATRIXCOMPONENT_AXIS3X"),
                    rb.getText("TMATRIXCOMPONENT_AXIS3Y"),
                    rb.getText("TMATRIXCOMPONENT_AXIS3Z"),
                    rb.getText("TMATRIXCOMPONENT_SCALE")
                ];
            }
            return MatrixUtilities._matrixComponentNames;
        };

        return MatrixUtilities;
    },
    true);
