/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

/**
 * Abstract Model adapter
 *
 * @experimental
 * @abstract
 */
sap.ui.define([
	"jquery.sap.global", "./BaseAdapter"
], function(jQuery, BaseAdapter) {
	"use strict";

	var FieldAdapter = BaseAdapter.extend("sap.ui.mdc.experimental.provider.adapter.base.FieldAdapter", {

		constructor: function(oModel, sModelName, sMetaContext, bCanonical, Base) {
			var SuperAdapter = BaseAdapter;

			if (Base) {
				jQuery.extend(SuperAdapter.prototype,Base.prototype);
				SuperAdapter.prototype.constructor = BaseAdapter;
			}

			SuperAdapter.prototype.constructor.apply(this,arguments);

			this.putProperty("allowEmptyValue",this.allowEmptyValue);
			this.putProperty("defaultValue",this.defaultValue); //default is not allowed from javascript
			this.putProperty("maximum",this.maximum);
			this.putProperty("exclusiveMaximum",this.exclusiveMaximum);
			this.putProperty("minimum",this.minimum);
			this.putProperty("exclusiveMinimum",this.exclusiveMinimum);
			this.putProperty("maxLength",this.maxLength);
			this.putProperty("minLength",this.minLength);
			this.putProperty("multipleOf", this.multipleOf);
			this.putProperty("pattern",this.pattern);
			this.putProperty("visible", this.visible);
			this.putProperty("value", this.value);
			this.putProperty("required", this.required);
			this.putProperty("name", this.name);
			this.putProperty("precision", this.precision);
			this.putProperty("scale", this.scale);
			this.putProperty("unit", this.unit);
			this.putProperty("semantics", this.semantics);// for Input url, password....
			this.putProperty("textAlign",this.textAlign);
			this.putProperty("ui5Type", this.ui5Type);// OData model type
			this.putProperty("formatOptions", this.formatOptions);
			this.putProperty("constraints",this.constraints);
			//this.putProperty("filterable", this.filterable);// ?? on the generic field adapter
			//this.putProperty("requiredInFilter", this.requiredInFilter);// ??
			//this.putProperty("sortable", this.sortable);//??
			this.putProperty("valueHelp", this.valueHelp);
			this.putProperty("describedBy", this.describedBy);


			/**
			 * Properties:
			 *  - textAlign//??? convenient
			 */
		},

		kind: function() {
			return 'field';
		},

		allowEmptyValue: function() {
			return true;
		},

		/**
		 * The default Value for the field
		 */
		defaultValue: function() {
			switch (this.ui5Type) {
				case "sap.ui.model.odata.type.Boolean":
					return false;
				case "sap.ui.model.odata.type.Byte":
				case "sap.ui.model.odata.type.Decimal":
				case "sap.ui.model.odata.type.Double":
				case "sap.ui.model.odata.type.Guid":
				case "sap.ui.model.odata.type.Int16":
				case "sap.ui.model.odata.type.Int32":
				case "sap.ui.model.odata.type.Int64":
				case "sap.ui.model.odata.type.SByte":
				case "sap.ui.model.odata.type.Single":
					return 0;
				case "sap.ui.model.odata.type.Date":
				case "sap.ui.model.odata.type.DateTimeOffset":
				case "sap.ui.model.odata.type.TimeOfDay":
					return new Date();
				case "Edm.String":
					return "";
				default:
					return "";
			}
		},

		precision: function() {
			return 1;
		},

		scale: function() {
			return 0;
		},

		maximum: function() {
			return 0;
		},

		exclusiveMaximum: function() {
			return false;
		},

		minimum: function() {
			return 0;
		},

		exclusiveMinimum: function() {
			return false;
		},

		maxLength: function() {
			return 255;
		},

		minLength: function() {
			return -1;
		},

		multipleOf: function() {
			return 1;
		},

		pattern: function() {
			return "/.*?/"; //any pattern
		},

		unit: function() {

		},

		/**
		 * The visible meta data information for the property.
		 *
		 * @return {object} The visible information for the property, this may also be a binding
		 * @public
		 */
		visible: function() {
			return true;
		},
		/**
		 * The hidden meta data information for the property.
		 *
		 * @return {object} The hidden information for the property, this may also be a binding
		 * @public
		 */
		hidden: function() {
			return false;
		},
		/**
		 * The value of the property
		 *
		 * @return {string} The id prefix
		 * @public
		 */
		value: function() {
			return this.asPath(this.name, this.ui5Type);
		},
		/**
		 * The prefix for the control Id of the driven control
		 *
		 * @return {string} The id prefix
		 * @public
		 */
		name: function() {
			throw new Error("sap.ui.mdc.experimental.provider.adapter.base.FieldAdapter:  method name must be redefined");
		},
		/**
		 * The required meta data information for the property.
		 *
		 * @return {object} The required information for the property, this may also be a binding
		 * @public
		 */
		required: function() {
			return false;
		},
		/**
		 * Defines the semantics of the property
		 *
		 * @see FieldAdapter.Semantics
		 * @return {Semantics} The fields semantic
		 * @public
		 */
		semantics: function() {
			return FieldAdapter.Semantics.Text;

		},

		textAlign: function() {

		},
		/**
		 * Indicates if property is flagged as URL.
		 *
		 * @return {boolean} <code>true</true> if property is flagged as URL
		 *
		 * @public
		 */
		url: function() {
			return false;
		},
		/**
		 * Indicates if property is flagged as password.
		 *
		 * @return {boolean} <code>true</true> if property is flagged as password
		 *
		 * @public
		 */
		password: function() {
			return false;
		},
		/**
		 * Indicates if property is flagged as phone number.
		 *
		 * @return {boolean} <code>true</true> if property is flagged as phone number
		 *
		 * @public
		 */
		phoneNumber: function() {
			return false;
		},
		/**
		 * Indicates if property is flagged as E-Mail.
		 *
		 * @return {boolean} <code>true</true> if property is flagged as E-Mail
		 *
		 * @public
		 */
		eMail: function() {
			return false;
		},
		/**
		 * The UI5 type information for the property.
		 *
		 * @return {string} The UI5 type information for the property
		 * @public
		 */
		ui5Type: function() {
			return "Text";
		},
		/**
		 * The constraints of the field
		 *
		 * @return {object} oConstraints - The contraints objects the field
		 * @return {int}	oConstraints.min 		 The minimal value
		 * @return {int}	oConstraints.max 		 The maximal value
		 * @return {int}	oConstraints.minLength   The minimal length value
		 * @return {int}	oConstraints.maxLength   The maximal length value
		 */
		constraints: function() {

		},
		/**
		 * The formatOptions information for the property.
		 *
		 * @return {object} oFormatOptions The format options
		 * @return {string} oFormatOptions.pattern The pattern
		 * @return {int}    oFormatOptions.precision The precision
		 * @public
		 */
		formatOptions: function() {
			throw new Error("sap.ui.mdc.experimental.provider.adapter.base.FieldAdapter:  method formatOptions must be redefined");
		},
		/**
		 * The filterable information for the property.
		 *
		 * @return {boolean} The UI5 type information for the property
		 * @public
		 */
		filterable: function() {
			return true;
		},
		/**
		 * The requiredInFilter information for the property.
		 *
		 * @return {boolean} The UI5 type information for the property
		 * @public
		 */
		requiredInFilter: function() {
			return false;
		},
		/**
		 * The sortable information for the property.
		 *
		 * @return {string} The UI5 type information for the property
		 * @public
		 */
		sortable: function() {
			return true;
		},
		/**
		 * The the valueHelp for the field.
		 *
		 * @return {object} The UI5 type information for the property
		 * @public
		 */
		valueHelp: function() {
			return [];
		},

		/***
		 * The property/path that describes the given field in a TextArrangment
		 *
		 * @return {object} The describing property, by default the property it
		 * @public
		 */
		describedBy: function() {
			return this;
		}

	});

	FieldAdapter.Semantics = {
		text: 0,
		eMail: 1,
		password: 2,
		url: 3,
		phoneNumber: 4,
		currency: 5,
		measure: 6
	};

	return FieldAdapter;

});