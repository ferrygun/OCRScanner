/*
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

/**
 * Utility class to access OData Types. The implementation operates on OData meta data, so an instance of <code>sap.ui.model.odata.ODataModel</code>.
 *
 * @private
 * @name sap.ui.comp.smartfield.ODataTypes
 * @author SAP SE
 * @version 1.52.4
 * @since 1.28.0
 */
sap.ui.define([
	"jquery.sap.global",
	"sap/ui/core/format/NumberFormat",
	"sap/ui/model/odata/type/Boolean",
	"sap/ui/comp/smartfield/type/DateTime",
	"sap/ui/comp/smartfield/type/DateTimeOffset",
	"sap/ui/comp/smartfield/type/Decimal",
	"sap/ui/comp/smartfield/type/Int16",
	"sap/ui/comp/smartfield/type/Int32",
	"sap/ui/comp/smartfield/type/Int64",
	"sap/ui/comp/smartfield/type/SByte",
	"sap/ui/comp/smartfield/type/String",
	"sap/ui/comp/smartfield/type/TextArrangementString",
	"sap/ui/comp/smartfield/type/AbapBool",
	"sap/ui/model/type/Currency",
	"sap/ui/comp/smartfield/type/Time",
	"sap/ui/model/odata/type/Guid",
	"sap/ui/comp/odata/MetadataAnalyser"
], function(jQuery, NumberFormat, BooleanType, DateTimeType, DateTimeOffsetType, DecimalType, Int16Type, Int32Type, Int64Type, SByteType, StringType, TextArrangementStringType, AbapBoolean, CurrencyType, TimeType, GuidType, MetadataAnalyser) {
	"use strict";

	/**
	 * @private
	 * @constructor
	 * @param {sap.ui.core.Control} oParent the parent control.
	 */
	var ODataTypes = function(oParent) {
		this._oParent = oParent;
	};

	/**
	 * Returns an instance of a sub-class of <code>sap.ui.model.Type</code> depending on the OData property's EDM type.
	 *
	 * @param {object} oProperty the definition of a property of an OData entity.
	 * @param {object} oFormatOptions optional format options as defined in e.g. {@link sap.ui.core.format.DateFormat}.
	 * @param {object} mConstraints optional constraints.
	 * @returns {sap.ui.model.Type} an instance of a sub-class of <code>sap.ui.model.Type</code>.
	 * @public
	 */
	ODataTypes.prototype.getType = function(oProperty, oFormatOptions, mConstraints) {
		var oConstraints, oInfo;

		// if a type is configured on the smart field, use it.
		oInfo = this._oParent.getBindingInfo("value");

		if (oInfo && oInfo.type) {
			return oInfo.type;
		}

		// select the type by EDM type.
		if (oProperty && oProperty.property && oProperty.property.type) {
			switch (oProperty.property.type) {
				case "Edm.Boolean":
					return new BooleanType();
				case "Edm.Decimal":
				case "Edm.Double":
				case "Edm.Float":
				case "Edm.Single":
					oConstraints = this._getDecimalConstraints(oProperty);
					return new DecimalType(oFormatOptions, oConstraints);
				case "Edm.Int16":
					return new Int16Type();
				case "Edm.Int32":
					return new Int32Type();
				case "Edm.Int64":
					return new Int64Type();
				case "Edm.Byte":
				case "Edm.SByte":
					return new SByteType();
				case "Edm.DateTimeOffset":
					return new DateTimeOffsetType(oFormatOptions, oConstraints);
				case "Edm.DateTime":
					oConstraints = this._getDateTimeConstraints(oProperty, mConstraints);
					return new DateTimeType(oFormatOptions, oConstraints);
				case "Edm.String":
					var oParent = this._oParent;
					oConstraints = this._getStringConstraints(oProperty);

					if (oParent.getTextArrangementInEditMode() && (oParent.getMode() === "edit")) {
						oFormatOptions = jQuery.extend({}, oFormatOptions, this._getTextArrangementStringFormatOptions());
						return new TextArrangementStringType(oFormatOptions, oConstraints, this._getTextArrangementStringOptions(oProperty.valueListAnnotation));
					}

					return new StringType(oFormatOptions, oConstraints);
				case "Edm.Time":
					return new TimeType(oFormatOptions, mConstraints);
				case "Edm.Guid":
					return new GuidType(oFormatOptions, mConstraints);
				default:
					return null;
			}
		}

		return null;
	};

	/**
	 * Calculates the constraints for <code>Edm.DateTime</code>.
	 *
	 * @param {object} oProperty the definition of a property of an OData entity.
	 * @param {object} mConstraints optional constraints.
	 * @returns {object} the constraints.
	 * @private
	 */
	ODataTypes.prototype._getDateTimeConstraints = function(oProperty, mConstraints) {
		var oConstraints = {}, n;

		// this method is only invoked for Edm.DateTime,
		// so no need exists to replace it with V4 annotations,
		// as Edm.DateTime is "pruned" in V4.
		if (oProperty.property["sap:display-format"] === "Date") {
			oConstraints = {
				displayFormat: "Date"
			};
		}

		// constraints from control have priority.
		for (n in mConstraints) {
			oConstraints[n] = mConstraints[n];
		}

		return oConstraints;
	};

	/**
	 * Calculates the value of the control's <code>maxLength</code> property. The value can be configured in the <code>maxLength</code> attribute
	 * of the OData property to which the the control's <code>value</code> property is bound to. Alternatively it can be configured in the the
	 * control's <code>maxLength</code> property. If both are available the minimum value of both is returned.
	 *
	 * @param {object} oProp the property from which to take the <code>maxLength</code>.
	 * @param {object} oBind the <code>value</code> binding of the parent smart field.
	 * @returns {int} maximum number of characters, <code>0</code> means the feature is switched off.
	 * @public
	 */
	ODataTypes.prototype.getMaxLength = function(oProp, oBind) {
		var iProp, aVals = [], len, iVal, iField, iResult = 0;

		// is a max length available from binding.
		if (oBind && oBind.constraints) {
			if (oBind.constraints.maxLength && oBind.constraints.maxLength > -1) {
				aVals.push(oBind.constraints.maxLength);
			}
		}

		// is a max length available from binding type.
		if (oBind && oBind.type && oBind.type.oConstraints) {
			if (oBind.type.oConstraints.maxLength && oBind.type.oConstraints.maxLength > -1) {
				aVals.push(oBind.type.oConstraints.maxLength);
			}
		}

		// is a max length available from oData property.
		if (oProp && oProp.property && oProp.property.maxLength) {
			iProp = parseInt(oProp.property.maxLength, 10);

			if (iProp > -1) {
				aVals.push(iProp);
			}
		}

		// is a max length available from smart field property.
		iField = this._oParent.getMaxLength();

		if (iField > 0) {
			aVals.push(iField);
		}

		// now search for the minimum value larger than 0.
		// no value specified, return 0.
		len = aVals.length;

		while (len--) {
			iVal = aVals[len];

			if (iVal > 0) {
				if (iResult > 0) {
					if (iVal < iResult) {
						iResult = iVal;
					}
				} else {
					iResult = iVal;
				}
			}
		}

		return iResult;
	};

	/**
	 * Calculates the constraints for a numeric Edm.Type, with optional <code>scale</code> and <code>precision</code> attributes of the OData
	 * property set.
	 *
	 * @param {object} oProperty the definition of a property of an OData entity.
	 * @returns {map} the constraints.
	 * @private
	 */
	ODataTypes.prototype._getDecimalConstraints = function(oProperty) {
		var mArgs = null;

		if (oProperty.property.precision) {
			mArgs = {};
			mArgs.precision = parseInt(oProperty.property.precision, 10);
		}

		if (oProperty.property.scale) {
			if (!mArgs) {
				mArgs = {};
			}

			mArgs.scale = parseInt(oProperty.property.scale, 10);
		}

		return mArgs;
	};

	ODataTypes.prototype._getTextArrangementStringFormatOptions = function() {
		var oControlFactory = this._oParent.getControlFactory(),
			oHelper = oControlFactory.getODataHelper(),
			mFormatOptions = {
				textArrangement: ""
			};

		if (oControlFactory && oHelper) {
			mFormatOptions.textArrangement = oHelper.oAnnotation.getTextArrangement(oControlFactory.getEdmProperty(), oControlFactory.getEntityType());
		}

		return mFormatOptions;
	};

	/**
	 * Calculates the constraints for a property of type <code>Edm.String</code>.
	 *
	 * @param {object} oProperty the definition of a property of an OData entity
	 * @returns {object} The constraints
	 */
	ODataTypes.prototype._getStringConstraints = function(oProperty) {
		var oBindingInfo = this._oParent.getBindingInfo("value"),
			iMaxLength = this.getMaxLength(oProperty, oBindingInfo),
			oEquals,
			mConstraints = {
				nullable: MetadataAnalyser.isNullable(oProperty.property)
			};

		// get the constrains: equals
		if (oBindingInfo && oBindingInfo.type && oBindingInfo.type.oConstraints) {
			if (oBindingInfo.type.oConstraints.equals) {
				oEquals = oBindingInfo.type.oConstraints.equals;
			}
		}

		// create the return value
		if (iMaxLength > 0 || oEquals) {

			if (iMaxLength > 0) {
				mConstraints.maxLength = iMaxLength;
			}

			if (oEquals) {
				mConstraints.equals = oEquals;
			}
		}

		if (MetadataAnalyser.isDigitSequence(oProperty.property)) {
			mConstraints.isDigitSequence = true;
		}

		return mConstraints;
	};

	ODataTypes.prototype._getTextArrangementStringOptions = function(oValueListAnnotation) {
		return {
			valueListAnnotation: oValueListAnnotation,
			control: this._oParent
		};
	};

	/**
	 * Returns formatter function for displaying a unit of measure.
	 *
	 * @param {object} oProperty The definition of a property of an OData entity
	 * @param {boolean} bCurrency Flag indicating whether the formatter actually refers to a currency or just unit-of-measure
	 * @returns {function} Formatter function for displaying a unit of measure
	 * @public
	 */
	ODataTypes.prototype.getDisplayFormatter = function(oProperty, bCurrency) {
		if (bCurrency) {
			return this.getCurrencyDisplayFormatter(true);
		} else {
			return this.getUOMDisplayFormatter(oProperty);
		}
	};

	/**
	 * Returns formatter function for displaying a currency.
	 *
	 * @param {boolean} bCurrency Flag indicating whether the formatter actually refers to a currency or just unit-of-measure
	 * @returns {function} Formatter function for displaying a currency
	 * @public
	 */
	ODataTypes.prototype.getCurrencyDisplayFormatter = function(bCurrency) {
		var oFormat = NumberFormat.getCurrencyInstance({
			showMeasure: false
		});

		return function(oAmount, sCurrency) {
			var sValue, iCurrencyDigits, iPadding;

			if (!oAmount || !sCurrency || sCurrency === "*") {
				return "";
			}

			if (!bCurrency) {
				sValue = oAmount += "\u2008";
				return sValue;
			}

			iCurrencyDigits = oFormat.oLocaleData.getCurrencyDigits(sCurrency);
			sValue = oFormat.format(oAmount, sCurrency);

			if (iCurrencyDigits === 0) {
				sValue += "\u2008";
			}

			iPadding = 3 - iCurrencyDigits;

			if (iPadding) {
				sValue = jQuery.sap.padRight(sValue, "\u2007", sValue.length + iPadding);
			}

			return sValue;
		};
	};

	/**
	 * Returns formatter function for displaying a measure.
	 *
	 * @param {object} oProperty The definition of a property of an OData entity
	 * @returns {function} Formatter function for displaying a unit of measure
	 * @public
	 */
	ODataTypes.prototype.getUOMDisplayFormatter = function(oProperty) {
		var oFormatOptions = {};

		if (oProperty.scale) {
			oFormatOptions.decimals = parseInt(oProperty.scale, 10);
		}

		if (oProperty.precision) {
			oFormatOptions.precision = parseInt(oProperty.precision, 10);
		}

		var oFormat = NumberFormat.getFloatInstance(oFormatOptions);

		return function(oMeasure, sUnit) {
			var sValue;

			if (!oMeasure || !sUnit || sUnit === "*") {
				return "";
			}

			if (isNaN(parseFloat(oMeasure))) {
				return oMeasure.toString() + "\u2008";
			}

			sValue = oFormat.format(oMeasure, sUnit);
			sValue += "\u2008";
			return sValue;
		};
	};

	/**
	 * Creates a new currency type instance and returns it.
	 *
	 * @param {object} oProperty the OData property to use for constraint calculation, e.g. precision and scale.
	 * @returns {sap.ui.model.type.Currency} the new currency type instance.
	 * @public
	 */
	ODataTypes.prototype.getCurrencyType = function(oProperty) {
		var oConstraints, oFormat = {
			showMeasure: false,
			parseAsString: true,
			emptyString: 0
		};

		if (oProperty) {
			oConstraints = this._getDecimalConstraints(oProperty);

			if (oConstraints) {
				if (oConstraints.precision) {
					oFormat.maxIntegerDigits = oConstraints.precision;
					if (oConstraints.scale) {
						oFormat.maxIntegerDigits -= oConstraints.scale;
					}
				}

				if (oConstraints.precision && oConstraints.scale) {
					oConstraints.maximum = Math.pow(10, oFormat.maxIntegerDigits) - (1 / Math.pow(10, oConstraints.scale));
					oConstraints.minimum = -1 * oConstraints.maximum;
				}
			}

			return new CurrencyType(oFormat, oConstraints);
		}

		return null;
	};

	/**
	 * Creates a new ABAP Boolean type instance.
	 *
	 * @returns {sap.ui.comp.smartfield.type.AbapBool} The new instance.
	 * @public
	 */
	ODataTypes.prototype.getAbapBoolean = function() {
		return new AbapBoolean();
	};

	/**
	 * Frees all resources claimed during the life-time of this instance.
	 *
	 * @public
	 */
	ODataTypes.prototype.destroy = function() {
		this._oParent = null;
	};

	return ODataTypes;
}, true);
