/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	"./base/FieldAdapter", "./ODataBaseAdapter"
], function(FieldAdapter, ODataBaseAdapter) {
	"use strict";

	var ODataFieldAdapter = FieldAdapter.extend("sap.ui.mdc.experimental.provider.adapter.ODataFieldAdapter", {
		constructor: function(oModel, sModelName, sMetaContext, bCanonical) {
			FieldAdapter.prototype.constructor.apply(this, [
				oModel, sModelName, sMetaContext, bCanonical, ODataBaseAdapter
			]);
		}
	});

	ODataFieldAdapter.prototype.allowEmptyValue = function() {
		return true;
	};

	/**
	 * The default Value for the field
	 */
	ODataFieldAdapter.prototype.defaultValue = function() {
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
	};

	ODataFieldAdapter.prototype.precision = function() {
		return this["//"]["Precision"];
	};

	ODataFieldAdapter.prototype.scale = function() {
		return this["//"]["Scale"];
	};

	ODataFieldAdapter.prototype.maximum = function() {
		return 0;
	};

	ODataFieldAdapter.prototype.exclusiveMaximum = function() {
		return false;
	};

	ODataFieldAdapter.prototype.minimum = function() {
		return 0;
	};

	ODataFieldAdapter.prototype.exclusiveMinimum = function() {
		return false;
	};

	ODataFieldAdapter.prototype.maxLength = function() {
		var sMaxLength = this["//"]["maxLength"];
		return isNaN(sMaxLength) ? undefined : parseInt(sMaxLength, 10);
	};

	ODataFieldAdapter.prototype.minLength = function() {
		var sMinLength = this["//"]["minLength"];
		return isNaN(sMinLength) ? undefined : parseInt(sMinLength, 10);
	};

	ODataFieldAdapter.prototype.multipleOf = function() {
		return 1;
	};

	ODataFieldAdapter.prototype.pattern = function() {
		return "/.*?/"; // any pattern
	};

	ODataFieldAdapter.prototype.unit = function() {
//		var sUnitProperty = this["//"]["sap:unit"];
		// TODO: read unit property
	};

	ODataFieldAdapter.prototype.textAlign = function() {

	};

	ODataFieldAdapter.prototype.visible = function() {
		var oHiddenAnno = this._isAnnotationBoolean("com.sap.vocabularies.UI.v1.Hidden");
		var bVisible = oHiddenAnno ? !oHiddenAnno : true;

		if (bVisible && this.schema._fieldControl) {
			bVisible = this.schema._fieldControl.visible;
			this.setValue("!visible",this.schema._fieldControl.hidden);
		} else {
			this.setValue("!visible",!bVisible);
		}
		return bVisible;
	};

	ODataFieldAdapter.prototype.ui5Type = function() {

		if (this.oMetaModel.getUI5Type) {
			return this.oMetaModel.getUI5Type(this.sMetaContext);
		}

		switch (this.schema.type) {
			case "Edm.Boolean":
				return "sap.ui.model.odata.type.Boolean";
			case "Edm.Byte":
				return "sap.ui.model.odata.type.Byte";
			case "Edm.Date":
				return "sap.ui.model.odata.type.Date";
			case "Edm.DateTime":
				return "sap.ui.model.odata.type.DateTime";
			case "Edm.DateTimeOffset":
				return "sap.ui.model.odata.type.DateTimeOffset";
			case "Edm.Decimal":
				return "sap.ui.model.odata.type.Decimal";
			case "Edm.Double":
				return "sap.ui.model.odata.type.Double";
			case "Edm.Guid":
				return "sap.ui.model.odata.type.Guid";
			case "Edm.Int16":
				return "sap.ui.model.odata.type.Int16";
			case "Edm.Int32":
				return "sap.ui.model.odata.type.Int32";
			case "Edm.Int64":
				return "sap.ui.model.odata.type.Int64";
			case "Edm.SByte":
				return "sap.ui.model.odata.type.SByte";
			case "Edm.Single":
				return "sap.ui.model.odata.type.Single";
			case "Edm.String":
				return "sap.ui.model.odata.type.String";
			case "Edm.TimeOfDay":
				return "sap.ui.model.odata.type.TimeOfDay";
			default:
				if (this["//"]["sap:display-format"] == "Date") {
					return "sap.ui.model.odata.type.Date";
				}
				return "sap.ui.model.odata.type.String";
		}
	};

	ODataFieldAdapter.prototype.formatOptions = function() {
		var sFormatOptions = "";

		// TODO: How to translate

		switch (this.ui5Type) {
			case "sap.ui.model.odata.type.Boolean":
				break;
			case "sap.ui.model.odata.type.Byte":

				break;
			case "sap.ui.model.odata.type.Date":
				break;
			case "sap.ui.model.odata.type.DateTimeOffset":
				break;
			case "sap.ui.model.odata.type.Decimal":
				break;
			case "sap.ui.model.odata.type.Double":
				break;
			case "sap.ui.model.odata.type.Guid":
				break;
			case "sap.ui.model.odata.type.Int16":
				break;
			case "sap.ui.model.odata.type.Int32":
				break;
			case "sap.ui.model.odata.type.Int64":
				break;
			case "sap.ui.model.odata.type.SByte":
				break;
			case "sap.ui.model.odata.type.Single":
				break;
			case "sap.ui.model.odata.type.String":
				break;
			case "sap.ui.model.odata.type.TimeOfDay":
				break;
			default:
				break;
		}

		return sFormatOptions;
	};

	ODataFieldAdapter.prototype.semantics = function() {
		if (this.getAnnotation("com.sap.vocabularies.Common.v1.Masked") != null) {
			return FieldAdapter.Semantics.password;
		}

		if (this.getAnnotation("com.sap.vocabularies.Communication.v1.IsEmailAddress") != null) {
			return FieldAdapter.Semantics.eMail;
		}

		if (this.getAnnotation("com.sap.vocabularies.Communication.v1.IsPhoneNumber") != null) {
			return FieldAdapter.Semantics.phoneNumber;
		}

		if (this.getAnnotation("com.sap.vocabularies.Communication.v1.IsUrl") != null) {
			return FieldAdapter.Semantics.url;
		}

		if (this.getAnnotation("Org.OData.Measures.V1.Unit") != null) {
			return FieldAdapter.Semantics.currency;
		}

		if (this.getAnnotation("Org.OData.Measures.V1.ISOCurrency") != null) {
			return FieldAdapter.Semantics.measure;
		}
		return FieldAdapter.Semantics.text;
	};

	ODataFieldAdapter.prototype.name = function() {
		return this.schema.name;
	};

	ODataFieldAdapter.prototype.required = function() {
		var oRequiredAnno = this.getAnnotation("nullable");

		var bRequired = oRequiredAnno ? oRequiredAnno == "false" : false;

		if (this.schema._fieldControl) {
			bRequired = this.schema._fieldControl.required;
		} else {
			bRequired = bRequired && this.enabled;
		}

		return bRequired;
	};

	ODataFieldAdapter.prototype.filterable = function() {
		return (this.filterRestrictions.NonFilterableProperties.indexOf(this.schema.name) === -1);

	};

	ODataFieldAdapter.prototype.requiredInFilter = function() {
		return (this.filterRestrictions.RequiredProperties.indexOf(this.schema.name) !== -1);
	};

	ODataFieldAdapter.prototype.sortable = function() {
		return true;
	};

	ODataFieldAdapter.prototype.valueHelp = function() {
		var oResult = null;

		var oValueList = this.getAnnotation("com.sap.vocabularies.Common.v1.ValueList");

		if (oValueList) {
			oResult = {};

			var sEntitySet = "/" + oValueList.CollectionPath.String;

			oResult.valuesPath = this.asPath(sEntitySet);

			oResult.parameters = [];

			var oParam, i, sLocal, sValue, oMetadataContext, sMetaContext;

			for (i = 0; i < oValueList.Parameters.length; i++) {
				oParam = oValueList.Parameters[i];

				sLocal = oParam.LocalDataProperty ? oParam.LocalDataProperty.PropertyPath : null;
				sValue = oParam.ValueListProperty.PropertyPath;

				oMetadataContext = this.oMetaModel.getMetaContext(sEntitySet + "/" + sValue);
				sMetaContext = oMetadataContext.getPath();

				var oValueAdapter = new ODataFieldAdapter(this.oModel, this.sModelName, this.sContextName, sMetaContext, true);

				oResult.parameters.push({
					targetProperty: sLocal,
					sourceAdapter: oValueAdapter
				});
			}
		}

		return oResult;
	};

	ODataFieldAdapter.prototype.describedBy = function() {
		var oTextAnno = this["//"]["com.sap.vocabularies.Common.v1.Text"];

		if (!oTextAnno) {
			return this;
		}

		return this.resolveNavi(oTextAnno.Path, ODataFieldAdapter);

	};

	return ODataFieldAdapter;
});