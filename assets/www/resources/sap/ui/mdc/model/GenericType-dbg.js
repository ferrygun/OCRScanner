/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

// Provides the base implementation for all model implementations
sap.ui.define(['sap/ui/model/SimpleType', 'sap/ui/model/FormatException', 'sap/ui/model/ParseException', 'sap/ui/model/base/ManagedObjectModel', 'sap/ui/model/json/JSONPropertyBinding'],
	function(SimpleType, FormatException, ParseException, ManagedObjectModel, JSONPropertyBinding) {
		"use strict";

		//TODO: Where to move this?
		//This is only needed for the generic type, therefore mix it in for the moment.
		sap.ui.model.base.ManagedObjectModelPropertyBinding.prototype.setType = function(oType, sInternalType) {
			if (oType && typeof oType._setBinding === "function") {
				oType = oType._clone();
				oType._setBinding(this);
			}
			JSONPropertyBinding.prototype.setType.apply(this, [oType, sInternalType]);
		};

		//resolver for formatter, parser, validator functions
		function _resolve(oType, vHandler) {
			if (typeof vHandler === "function") {
				return {
					object: window,
					fnFunc: vHandler
				};
			} else if (typeof vHandler === "string") {
				if (jQuery.sap.startsWith(vHandler, ".")) {
					if (oType.oBinding) {
						var oObject = oType.oBinding.getModel().getRootObject();
						return {
							object: oObject,
							fnFunc: oObject[vHandler.slice(1)]
						};
					}
				} else {
					return {
						object: window,
						fnFunc: jQuery.sap.getObject(vHandler)
					};
				}
			}
			return null;
		}

		/**
		 * Constructor for a generic type.
		 *
		 * @class
		 * Provides a generic type which allows to customize the format and parse functions.
		 *
		 * Within a managed object model properties of a control can bind to properties of another control. Here the generic type helps to format
		 * and parse the property values from and to control properties.
		 *
		 * @extends sap.ui.model.SimpleType
		 *
		 * @author SAP SE
		 * @version 1.52.4
		 *
		 * @constructor
		 *
		 * @private
		 *
		 * @param {object} [oFormatOptions] formatting options containing a string or function reference for parser, formatter, validator
		 *        {string|function} [oFormatOptions.formatter] formatting function called if a value is read from a bound property.
		 *            A string value will be interpreted as a function name. If the string starts with a dot, the
		 *            function is looked up at the root object of the managed object model, otherwise on the window object.
		 *        {string|function} [oFormatOptions.parser] parser function called if a value is written to a bound property. Can be a string,
		 *            A string value will be interpreted as a function name. If the string starts with a dot, the
		 *            function is looked up at the root object of the managed object model, otherwise on the window object.
		 *        {string|function} [oFormatOptions.validator] validator function called before a value is written to a bound property.
		 *            A string value will be interpreted as a function name. If the string starts with a dot, the
		 *            function is looked up at the root object of the managed object model, otherwise on the window object.
		 *
		 * @param {object} [oConstraints] value constraints.
		 * @alias sap.ui.mdc.model.GenericType
		 */
		var GenericType = SimpleType.extend("sap.ui.mdc.model.GenericType", /** @lends sap.ui.mdc.model.GenericType.prototype */ {

			constructor : function (oFormatOptions, oConstraints) {
				SimpleType.apply(this, arguments);
				this.sName = "Generic";
				this.oBinding = null;
			}

		});

		/**
		 * Formats the value to a given primitive target type
		 * @param {vValue} the value to format
		 * @param {string} the target type such as "string", "int", "boolean", "float" that is used for formatting
		 * @returns {any} the formatted or raw value if no formatter was set with the format options
		 */
		GenericType.prototype.formatValue = function(vValue, sTargetType) {
			var oHandler = _resolve(this, this.oFormatOptions.formatter);
			if (oHandler) {
				return oHandler.fnFunc.call(oHandler.object, vValue, sTargetType, this.getPrimitiveType(sTargetType), this.oBinding);
			}
			return vValue;
		};

		/**
		 * Parses the value from a given primitive source type
		 * @param {vValue} the value to parse
		 * @param {string} the source type such as "string", "int", "boolean", "float" that is used for formatting
		 * @returns {any} the parsed or raw value if no parser was set with the format options
		 */
		GenericType.prototype.parseValue = function(vValue, sSourceType) {
			var oHandler = _resolve(this, this.oFormatOptions.parser);
			if (oHandler) {
				return oHandler.fnFunc.call(oHandler.object, vValue, sSourceType, this.getPrimitiveType(sSourceType), this.oBinding);
			}
			return vValue;
		};

		/**
		 * Validates the value
		 * @param {vValue} the value to validate
		 * @returns {any} the validated value or undefined
		 */
		GenericType.prototype.validateValue = function(vValue) {
			var oHandler = _resolve(this, this.oFormatOptions.validator);
			if (oHandler) {
				return oHandler.fnFunc.call(oHandler.object, vValue);
			}
			return undefined;
		};

		/**
		 * @private
		 */
		GenericType.prototype._setBinding = function(oBinding) {
			this.oBinding = oBinding;
		};

		/**
		 * @private
		 */
		GenericType.prototype._clone = function() {
			return new GenericType(this.oFormatOptions, this.oConstaints);
		};

		return GenericType;
	});
