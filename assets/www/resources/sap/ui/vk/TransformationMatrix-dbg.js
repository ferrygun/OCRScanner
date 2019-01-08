/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides data type sap.ui.vk.TransformationMatrix.
sap.ui.define([
	"jquery.sap.global", "sap/ui/base/DataType"
], function(jQuery, DataType) {
	"use strict";

	/**
	 * @class
	 * Transformation matrix is an array of 12 numbers in a row major mode.
	 * @final
	 * @public
	 * @experimental Since 1.32.0 This class is experimental and might be modified or removed in future versions.
	 */
	var TransformationMatrix = DataType.createType("sap.ui.vk.TransformationMatrix", {
			isValid: function(value) {
				return TransformationMatrix.getBaseType().isValid(value) && value.length === 12;
			}
		},
		DataType.getType("float[]")
	);

	/**
	 * Parses the given string value and converts it into an array of numbers.
	 * @param {string} value a comma or white space delimited string
	 * @return {number[]} an array of 12 numbers
	 * @static
	 * @public
	 */
	TransformationMatrix.parseValue = function(value) {
		var componentType = TransformationMatrix.getComponentType();
		return value.split(/\s*,\s*|\s+/).map(componentType.parseValue.bind(componentType));
	};

	/**
	 * Converts matrix from 4x3 to 4x4.
	 * @param {number[]} matrix4x3 The matrix to convert.
	 * @return {number[]} The matrix 4x4 with [0, 0, 0, 1] in the last column.
	 * @static
	 * @public
	 */
	TransformationMatrix.convertTo4x4 = function(matrix4x3) {
		var m = matrix4x3;
		return [ m[0], m[1], m[2], 0, m[3], m[4], m[5], 0, m[6], m[7], m[8], 0, m[9], m[10], m[11], 1 ];
	};

	/**
	 * Converts matrix from 4x4 to 4x3.
	 * @param {number[]} matrix4x4 The matrix to convert. The last column must be [0, 0, 0, 1].
	 * @return {number[]} The matrix 4x3 with the last column removed from matrix4x4.
	 * @public
	 * @static
	 */
	TransformationMatrix.convertTo4x3 = function(matrix4x4) {
		var m = matrix4x4;
		jQuery.sap.assert(m[3] === 0 && m[7] === 0 && m[11] === 0 && m[15] === 1, "The transformation matrix is invalid. The last column must be [0, 0, 0, 1].");
		return [ m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10], m[12], m[13], m[14] ];
	};

	jQuery.sap.setObject("sap.ui.vk.TransformationMatrix", TransformationMatrix);

	return TransformationMatrix;
});
