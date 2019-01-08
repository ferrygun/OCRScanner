/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	"jquery.sap.global",
	"sap/ui/model/CompositeType",
	"sap/ui/model/FormatException",
	"sap/ui/model/ParseException"
], function(jQuery, CompositeType, FormatException, ParseException) {
	"use strict";

	var DateRange = CompositeType.extend("sap.ui.mdc.base.type.DateRange", {
		constructor: function(oFormatOptions, oConstraints) {
			CompositeType.call(this, oFormatOptions, oConstraints);
		}
	});

	DateRange.prototype.formatValue = function(aValues, sTargetType) {
		if (!aValues || (!aValues[0] && !aValues[1])) {
			return null;
		}
		switch (sTargetType) {
			case "any":
				return aValues;
			case "string":
				return aValues.join(" - ");
			default:
				throw new FormatException("Don't know how to format " + this.getName() + " to " +
					sTargetType);
		}
	};

	DateRange.prototype.parseValue = function(sValue, sSourceType) {
		if (sValue === null || sValue === "") {
			return null;
		}
		switch (sSourceType) {
			case "string":
				return sValue.split(" - ");
			default:
				throw new ParseException("Don't know how to parse " + this.getName() + " from " +
					sSourceType);
		}
	};

	DateRange.prototype.validateValue = function(aValues) {
		//TODO what could be usefully checked here? the parts are validated by their type, I hope...
	};

	return DateRange;
});