/*
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
	"jquery.sap.global",
	"sap/ui/model/CompositeType",
	"sap/ui/comp/smartfield/type/String",
	"sap/ui/comp/util/FormatUtil",
	"sap/ui/model/ParseException",
	"sap/ui/model/ValidateException",
	"sap/ui/model/FormatException"
], function(jQuery, CompositeType, SmartFieldType, FormatUtil, ParseException, ValidateException, FormatException) {
	"use strict";

	var TextArrangementString = CompositeType.extend("sap.ui.comp.smartfield.type.TextArrangementString", {
		constructor: function(oFormatOptions, oConstraints, oSettings) {
			CompositeType.call(this, oFormatOptions, oConstraints);
			SmartFieldType.call(this, oFormatOptions, oConstraints);
			this.bParseWithValues = true;
			this.oSettings = jQuery.extend({
				data: [],
				valueListAnnotation: null,
				control: null
			}, oSettings);
			this.oFormatOptions = jQuery.extend({
				textArrangement: "idOnly"
			}, oFormatOptions);
			this.fnPreParser = this.getValidator({
				textArrangement: this.oFormatOptions.textArrangement,
				prefix: "preParse"
			});
			this.fnParser = this.getValidator({
				textArrangement: this.oFormatOptions.textArrangement,
				prefix: "parse"
			});
			this.fnValidator = this.getValidator({
				textArrangement: this.oFormatOptions.textArrangement,
				prefix: "validate"
			});
			this.bNewDataLoaded = false;
			this.bRawValue = false;
			this.bValueValidated = false;
			this.vRawValue = "";
			this.vRawID = "";
			this.vRawDescription = "";
			this.sDescription = undefined;
			jQuery.sap.assert(this.oSettings.valueListAnnotation.valueListEntitySetName, "Missing value for the valueListEntitySetName field in the value list annotation");
			jQuery.sap.assert(this.oSettings.valueListAnnotation.keyField, "Missing value for the keyField in the value list annotation");
			jQuery.sap.assert(this.oSettings.valueListAnnotation.descriptionField, "Missing value for the descriptionField in the value list annotation");
		}
	});

	TextArrangementString.prototype.parseValue = function(vValue, sSourceType, aCurrentValues) {

		if (vValue === "") {
			return [SmartFieldType.prototype.parseValue.call(this, vValue, sSourceType), null];
		}

		var sTextArrangement = this.oFormatOptions.textArrangement;

		if (sTextArrangement === "idOnly") {
			return this.parseIDOnly(vValue, sSourceType);
		}

		this.vRawValue = vValue;

		if (!this.bNewDataLoaded) {

			if (typeof this.fnPreParser === "function") {
				var aRawValues = this.fnPreParser.call(this, vValue, sSourceType, this.oFormatOptions);
				this.vRawID = aRawValues[0];
				this.vRawDescription = aRawValues[1];
			} else {
				this.vRawID = vValue;
			}

			this.bRawValue = true;

			// return the undefined values to skip the model update
			return [undefined, undefined];
		}

		this.bNewDataLoaded = false;
		this.bRawValue = false;
		return this.fnParser(vValue, sSourceType, this.oSettings);
	};

	TextArrangementString.prototype.parseIDOnly = function(vValue, sSourceType) {
		return [SmartFieldType.prototype.parseValue.call(this, vValue, sSourceType), undefined];
	};

	TextArrangementString.prototype.preParseIDAndDescription = function(vValue, sSourceType, oFormatOptions) {
		var rTextArrangementFormat = /.*\s\(.*\)/i;

		// if the value format is "ID (description)" or "description (ID)"
		if (rTextArrangementFormat.test(vValue)) {
			var rSeparator = /\s\(/gi;

			// raise a parse exception if the delimiter used to separate the ID from the description is duplicated (delimiter collision problem)
			if (vValue.match(rSeparator).length > 1) {
				throw new ParseException(sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("SMARTFIELD_NOT_FOUND"));
			}

			var aValues = TextArrangementString.splitIDAndDescription(vValue, {
				separator: rSeparator,
				textArrangement: oFormatOptions.textArrangement
			});

			aValues[0] = SmartFieldType.prototype.parseValue.call(this, aValues[0], sSourceType);
			return aValues;
		}

		vValue = SmartFieldType.prototype.parseValue.call(this, vValue, sSourceType);
		return [vValue];
	};

	TextArrangementString.prototype.parseIDAndDescription = function(vValue, sSourceType, oSettings) {
		var rTextArrangementFormat = /.*\s\(.*\)/i;

		// if the value format is "ID (description)" or "description (ID)"
		if (rTextArrangementFormat.test(vValue)) {
			vValue = this.preParseIDAndDescription(vValue, sSourceType, this.oFormatOptions)[0];

		// if data loaded
		} else if (oSettings.data.length) {

			// filter for description given the ID
			var aDescription = filterValuesByKey(vValue, {
				key: oSettings.valueListAnnotation.keyField,
				value: oSettings.valueListAnnotation.descriptionField,
				data: oSettings.data
			});

			// if no description is found
			if (aDescription.length === 0) {
				throw new ValidateException(sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("SMARTFIELD_NOT_FOUND"));
			}

			// more descriptions were found for the same ID
			if (aDescription.length > 1) {
				throw new ValidateException(sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("SMARTFIELD_DUPLICATE_VALUES"));
			}

			this.sDescription = aDescription[0];
			return [vValue, undefined];

		} else if (vValue !== "") {
			throw new ValidateException(sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("SMARTFIELD_NOT_FOUND")); // invalid format or value
		}

		return [vValue, undefined];
	};

	TextArrangementString.prototype.parseDescriptionOnly = function(vValue, sSourceType, oSettings) {
		var sID,
			sKeyField = oSettings.valueListAnnotation.keyField,
			sDescriptionField = oSettings.valueListAnnotation.descriptionField,
			oRB = sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp");

		// filtering in the text/description field first as the textArrangement format option is set to "descriptionOnly"
		var aIDs = filterValuesByKey(vValue, {
			key: sDescriptionField,
			value: sKeyField,
			data: oSettings.data
		});
		var aIDsLength = aIDs.length;

		if (aIDsLength === 1) {
			sID = SmartFieldType.prototype.parseValue.call(this, aIDs[0], sSourceType);
			this.sDescription = vValue;
			return [sID, undefined];
		}

		// if no IDs were found in the text/description field, filtering the key field
		if (aIDsLength === 0) {

			aIDs = filterValuesByKey(vValue, {
				key: sKeyField,
				value: sDescriptionField,
				data: oSettings.data
			});
			aIDsLength = aIDs.length;
		}

		if (aIDsLength === 0) {
			throw new ValidateException(oRB.getText("SMARTFIELD_NOT_FOUND"));
		}

		// duplicate IDs were found
		if (aIDsLength > 1) {
			throw new ValidateException(oRB.getText("SMARTFIELD_DUPLICATE_VALUES"));
		}

		sID = SmartFieldType.prototype.parseValue.call(this, vValue, sSourceType);
		this.sDescription = aIDs[0];
		return [sID, undefined];
	};

	TextArrangementString.prototype.validateValue = function(vValues) {

		if (this.bRawValue) {

			this.oSettings.control.onBeforeValidateValue(this.vRawID);

			// do not validate the old binding values twice
			return;
		}

		SmartFieldType.prototype.validateValue.call(this, vValues[0]);

		if (vValues[0] !== null) {
			this.fnValidator(vValues, this.oSettings);
		}

		this.bValueValidated = true;
		this.oSettings.control.onAfterValidateValue(vValues[0]);
	};

	TextArrangementString.prototype.validateIDOnly = function(vValues, oSettings) {};
	TextArrangementString.prototype.validateIDAndDescription = function(vValues, oSettings) {};
	TextArrangementString.prototype.validateDescriptionOnly = function(vValues, oSettings) {};

	TextArrangementString.prototype.formatValue = function(vValues, sTargetType) {

		if (this.bRawValue) {
			return this.vRawValue;
		}

		var sKey = SmartFieldType.prototype.formatValue.call(this, vValues[0], sTargetType);

		if (sKey === "") {
			return sKey;
		}

		var sDescription = vValues[1];

		if (this.bValueValidated) {
			sDescription = (this.sDescription === undefined) ? vValues[1] : this.sDescription;
		} else {

			// if the binding context changes after the initial rendering or the .bindElement() method is called,
			// the description could be outdated, so a re-validation is need to fetch the newest description
			this.oSettings.control.onBeforeValidateValue(sKey);

			return "";
		}

		return FormatUtil.getFormattedExpressionFromDisplayBehaviour(this.oFormatOptions.textArrangement, sKey, sDescription);
	};

	TextArrangementString.prototype.destroy = function() {
		this.oFormatOptions = null;
		this.oSettings = null;
		this.fnPreParser = null;
		this.fnParser = null;
		this.fnValidator = null;
		this.vRawValue = "";
		this.vRawID = "";
		this.vRawDescription = "";
		this.sDescription = "";
	};

	TextArrangementString.prototype.getName = function() {
		return "sap.ui.comp.smartfield.type.TextArrangementString";
	};

	TextArrangementString.prototype.getValidator = function(mSettings) {

		switch (mSettings.textArrangement) {

			case "idAndDescription":
			case "descriptionAndId":
				return this[mSettings.prefix + "IDAndDescription"];

			case "descriptionOnly":
				return this[mSettings.prefix + "DescriptionOnly"];

			default:
				return this[mSettings.prefix + "IDOnly"];
		}
	};

	function filterValuesByKey(sKey, mSettings) {
		var aValues = [];

		mSettings.data.forEach(function(mData, iIndex, aData) {
			if (mData[mSettings.key] === sKey) {
				aValues.push(mData[mSettings.value]);
			}
		});

		return aValues;
	}

	TextArrangementString.splitIDAndDescription = function(vValue, mSettings) {
		var aValues = mSettings.separator.exec(vValue), // note: if the match fails, it returns null
			iIndex = aValues["index"];

		switch (mSettings.textArrangement) {

			case "idAndDescription":
				return [
					vValue.slice(0, iIndex /* index of the first separator */),
					vValue.slice(iIndex /* index of the first separator */ + 2, -1)
				];

			case "descriptionAndId":
				return [
					vValue.slice(iIndex /* index of the first separator */ + 2, -1),
					vValue.slice(0, iIndex /* index of the first separator */)
				];

			default:
				return ["", ""];
		}
	};

	return TextArrangementString;
});
