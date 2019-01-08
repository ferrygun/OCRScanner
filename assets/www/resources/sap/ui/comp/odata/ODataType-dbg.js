/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// -------------------------------------------------------------------------------
// Class used to determine/retrieve OData type based on the Edm type of a property
// -------------------------------------------------------------------------------
sap.ui.define([
	'sap/ui/model/odata/type/Boolean', 'sap/ui/model/odata/type/Byte', 'sap/ui/model/odata/type/DateTime', 'sap/ui/model/odata/type/DateTimeOffset', 'sap/ui/model/odata/type/Decimal', 'sap/ui/model/odata/type/Double', 'sap/ui/model/odata/type/Single', 'sap/ui/model/odata/type/Guid', 'sap/ui/model/odata/type/Int16', 'sap/ui/model/odata/type/Int32', 'sap/ui/model/odata/type/Int64', 'sap/ui/model/odata/type/SByte', 'sap/ui/model/odata/type/String', 'sap/ui/model/odata/type/Time'
], function(Boolean, Byte, DateTime, DateTimeOffset, Decimal, Double, Single, Guid, Int16, Int32, Int64, SByte, String, Time) {
	"use strict";

	// @see sap.ui.model.odata.type for below types
	var mUi5TypeForEdmType = {
		"Edm.Boolean": Boolean,
		"Edm.Byte": Byte,
		"Edm.DateTime": DateTime,
		"Edm.DateTimeOffset": DateTimeOffset,
		"Edm.Decimal": Decimal,
		"Edm.Double": Double,
		"Edm.Float": Single,
		"Edm.Guid": Guid,
		"Edm.Int16": Int16,
		"Edm.Int32": Int32,
		"Edm.Int64": Int64,
		"Edm.SByte": SByte,
		"Edm.Single": Single,
		"Edm.String": String,
		"Edm.Time": Time
	};

	var mDefaultTypeForEdmType = {
		"Edm.Boolean": "Boolean",
		"Edm.Byte": "Byte",
		"Edm.DateTime": "DateTime",
		"Edm.DateTimeOffset": "DateTimeOffset",
		"Edm.Decimal": "Decimal",
		"Edm.Double": "Double",
		"Edm.Float": "Float",
		"Edm.Guid": "Guid",
		"Edm.Int16": "Int16",
		"Edm.Int32": "Int32",
		"Edm.Int64": "Int64",
		"Edm.SByte": "SByte",
		"Edm.Single": "Single",
		"Edm.String": "String",
		"Edm.Time": "Time"
	};

	var mNumericType = {
		"Edm.Decimal": true,
		"Edm.Double": true,
		"Edm.Float": true,
		"Edm.Int16": true,
		"Edm.Int32": true,
		"Edm.Int64": true,
		"Edm.Single": true
	};

	var mDateOrTimeType = {
		"Edm.DateTime": true,
		"Edm.DateTimeOffset": true,
		"Edm.Time": true
	};

	/**
	 * Object used to determine/retrieve OData model type and other relevant attributes based on the Edm type (primitive types) of an OData property
	 * 
	 * @private
	 * @experimental This module is only for internal/experimental use!
	 */
	var ODataType = {
		/**
		 * Create/Get the OData type based on Edm type
		 * 
		 * @public
		 * @param {string} sType - The Edm type from OData property
		 * @param {object} oFormatOptions format options as defined in the interface of {@link sap.ui.model.SimpleType}
		 * @param {object} oConstraints constraints as defined in interface of {@link sap.ui.model.SimpleType} or its concrete subclasses
		 * @returns {sap.ui.model.SimpleType} the OData type
		 */
		getType: function(sType, oFormatOptions, oConstraints) {
			var oType = null, _oType;
			_oType = mUi5TypeForEdmType[sType];
			if (_oType) {
				oType = new _oType(oFormatOptions, oConstraints);
			}
			return oType;
		},
		/**
		 * Returns whether the specified type is numeric or not
		 * 
		 * @public
		 * @param {string} sType - The Edm type from OData property
		 * @returns {boolean} true|false
		 */
		isNumeric: function(sType) {
			return mNumericType[sType] ? true : false;
		},
		/**
		 * Returns whether the specified type is date (or time or datetime) or not
		 * 
		 * @public
		 * @param {string} sType - The Edm type from OData property
		 * @returns {boolean} true|false
		 */
		isDateOrTime: function(sType) {
			return mDateOrTimeType[sType] ? true : false;
		},
		/**
		 * Returns the name of the property containing the default value
		 * 
		 * @public
		 * @param {string} sType - The Edm type from OData property.
		 * @returns {string} property name containing the value.
		 */
		getDefaultValueTypeName: function(sType) {
			return mDefaultTypeForEdmType[sType];
		}
	};

	return ODataType;

}, /* bExport= */true);
