/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	"./ModelAdapter"
], function(ModelAdapter) {
	"use strict";

	/*
	 * Strips the OData key predicate from a resource path segment. @param {string} sSegment @returns {string}
	 */
	function stripKeyPredicate(sSegment) {
		var iPos = sSegment.indexOf("(");
		return iPos >= 0 ? sSegment.slice(0, iPos) : sSegment;
	}

	var ODataAdapter = ModelAdapter.extend("sap.ui.mdc.experimental.provider.model.ODataAdapter", {
		_schemaCache: {

		},
		aExpand: [],
		constructor: function(oModel, sModelName, sMetaContext, bCanonical, Base) {
			ModelAdapter.prototype.constructor.apply(this, arguments);

			this.putProperty("valueList", this.valueList);
			this.putProperty("fields", this.fields);
			this.putProperty("expand", this.expand);
			this.putProperty("navigationProperties", this.navigationProperties);
			this.putProperty("filterRestrictions", this.filterRestrictions);
		}
	});

	ODataAdapter.prototype.afterMetaContextSwitch = function(sCanonicalPath, sPath) {
		if (!this._schemaCache[sCanonicalPath]) {
			this._schemaCache[sCanonicalPath] = this.oMetaModel.getProperty(sCanonicalPath);
			this.schema = this._schemaCache[sCanonicalPath];
			this._precalucateFieldControl();
		} else {
			this.schema = this._schemaCache[sCanonicalPath];
		}

		this.oEntitySet = this.calculateEntitySet(sPath);
	};

	ODataAdapter.prototype.calculateEntitySet = function(sPath) {
		var oAssocationEnd, sNavigationPropertyName, oEntityType, sQualifiedName, oEntitySet, aParts = sPath.split("/");
		if (aParts[0] !== "") {
			return null;
		}
		aParts.shift();

		// from entity set to entity type
		oEntitySet = this.oMetaModel.getODataEntitySet(stripKeyPredicate(aParts[0]));
		if (!oEntitySet) {
			return null;
		}
		aParts.shift();

		// follow (navigation) properties
		while (aParts.length) {
			sQualifiedName = oEntitySet.entityType;
			oEntityType = this.oMetaModel.getODataEntityType(sQualifiedName);
			sNavigationPropertyName = stripKeyPredicate(aParts[0]);
			oAssocationEnd = this.oMetaModel.getODataAssociationEnd(oEntityType, sNavigationPropertyName);

			if (oAssocationEnd) {
				// navigation property
				oEntitySet = this.oMetaModel.getODataEntitySet(oAssocationEnd.entitySet);
			} else {
				return null;
			}
		}

		return oEntitySet;

	};

	ODataAdapter.prototype.resolveNavi = function(sNaviPath) {
		var aPath = sNaviPath.split("/"), sNavigationProperty = aPath[0];

		var oAssocationEnd = this.oMetaModel.getODataAssociationSetEnd(this.schema, sNavigationProperty);

		var oNaviEntitySet = this.oMetaModel.getODataEntitySet(oAssocationEnd.entitySet);

		var sNaviDeep = "/" + oNaviEntitySet.name + "/" + aPath[1];

		var oMetadataContext = this.oMetaModel.getMetaContext(sNaviDeep);
		var sMetaContext = oMetadataContext.getPath();

		if (this.aExpand.indexOf(sNavigationProperty) == -1) {
			this.aExpand.push(sNavigationProperty);
		}

		var oNavi = new ODataAdapter(this.oModel, this.ModelName, sMetaContext, true);

		oNavi.oEntitySet = oNaviEntitySet;

		return oNavi;
	};

	ODataAdapter.prototype.ui5Type = function() {

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
				return "sap.ui.model.odata.type.String";
		}
	};

	ODataAdapter.prototype.formatOptions = function() {
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

	ODataAdapter.prototype.semantics = function() {
		if (this.getAnnotation("com.sap.vocabularies.Common.v1.Masked") != null) {
			return ModelAdapter.Semantics.password;
		}

		if (this.getAnnotation("com.sap.vocabularies.Communication.v1.IsEmailAddress") != null) {
			return ModelAdapter.Semantics.eMail;
		}

		if (this.getAnnotation("com.sap.vocabularies.Communication.v1.IsPhoneNumber") != null) {
			return ModelAdapter.Semantics.phoneNumber;
		}

		if (this.getAnnotation("com.sap.vocabularies.Communication.v1.IsUrl") != null) {
			return ModelAdapter.Semantics.url;
		}

		if (this.getAnnotation("Org.OData.Measures.V1.Unit") != null) {
			return ModelAdapter.Semantics.currency;
		}

		if (this.getAnnotation("Org.OData.Measures.V1.ISOCurrency") != null) {
			return ModelAdapter.Semantics.measure;
		}
	};

	ODataAdapter.prototype.key = function() {
		return this.schema.name;
	};

	ODataAdapter.prototype.visible = function() {
		var oHiddenAnno = this._isAnnotationBoolean("com.sap.vocabularies.UI.v1.Hidden");
		var bVisible = oHiddenAnno ? !oHiddenAnno : true;

		if (bVisible && this.schema._fieldControl) {
			bVisible = this.schema._fieldControl.visible;
		}

		return bVisible;
	};

	ODataAdapter.prototype.hidden = function() {
		var oHiddenAnno = this._isAnnotationBoolean("com.sap.vocabularies.UI.v1.Hidden");
		var bHidden = oHiddenAnno ? oHiddenAnno : false;

		if (!bHidden && this.schema._fieldControl) {
			bHidden = this.schema._fieldControl.hidden;
		}

		return bHidden;
	};

	ODataAdapter.prototype.enabled = function() {
		var oUpdatableAnno = this.getAnnotation("Org.OData.Core.V1.Immutable/Bool") || this.getAnnotation("Org.OData.Core.V1.Computed/Bool");
		var bEnabled = oUpdatableAnno ? oUpdatableAnno == "false" : true;

		if (bEnabled && this.schema._fieldControl) {
			bEnabled = this.schema._fieldControl.editable;
		}

		return bEnabled;
	};

	ODataAdapter.prototype.disabled = function() {
		var oUpdatableAnno = this.getAnnotation("Org.OData.Core.V1.Immutable/Bool") || this.getAnnotation("Org.OData.Core.V1.Computed/Bool");
		var bDisabled = oUpdatableAnno ? oUpdatableAnno == "true" : false;

		if (!bDisabled && this.schema._fieldControl) {
			bDisabled = this.schema._fieldControl.readonly;
		}

		return bDisabled;
	};

	ODataAdapter.prototype.required = function() {
		var oRequiredAnno = this.getAnnotation("nullable");

		var bRequired = oRequiredAnno ? oRequiredAnno == "false" : false;

		if (this.schema._fieldControl) {
			bRequired = this.schema._fieldControl.required;
		} else {
			bRequired = bRequired && this.enabled;
		}

		return bRequired;
	};

	ODataAdapter.prototype.tooltip = function() {
		return this.getAnnotation("com.sap.vocabularies.Common.v1.QuickInfo/String");
	};

	ODataAdapter.prototype.label = function() {
		return this.getAnnotation("com.sap.vocabularies.Common.v1.Label/String");
	};

	ODataAdapter.prototype.filterable = function() {
		return (this.filterRestrictions.NonFilterableProperties.indexOf(this.schema.name) === -1);

	};

	ODataAdapter.prototype.requiredInFilter = function() {
		return (this.filterRestrictions.RequiredProperties.indexOf(this.schema.name) !== -1);
	};

	ODataAdapter.prototype.sortable = function() {
		return true;
	};

	ODataAdapter.prototype.navigationProperties = function() {
		var i, oNavi, aNavis = this.getAnnotation("navigationProperty"), aNaviMap = [];

		for (i = 0; i < aNavis.length; i++) {
			oNavi = aNavis[i];

			aNaviMap[oNavi.name] = oNavi;
		}

		return aNaviMap;
	};

	ODataAdapter.prototype.expand = function() {
		return this.aExpand;
	};

	ODataAdapter.prototype.valueList = function() {
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

				var oValueAdapter = new ODataAdapter(this.oModel, this.ModelName, sMetaContext, true);

				oResult.parameters.push({
					targetProperty: sLocal,
					sourceAdapter: oValueAdapter
				});

			}

		}

		return oResult;
	};

	ODataAdapter.prototype.fields = function() {
		var i, oField, aFields = this.getAnnotation("property"), aFieldMap = [];

		for (i = 0; i < aFields.length; i++) {
			oField = aFields[i];

			aFieldMap[oField.name] = new ODataAdapter(this.oModel, this.ModelName, this.sMetaContext + "/property/" + i, true);
			aFieldMap[oField.name].oEntitySet = this.oEntitySet;
		}

		return aFieldMap;
	};

	ODataAdapter.prototype.filterRestrictions = function() {
		var i, oAnnotation, oFilterRestrictions = {
			NonFilterableProperties: [],
			RequiredProperties: []
		};
		if (this.oEntitySet) {
			oAnnotation = this.getAnnotation("Org.OData.Capabilities.V1.FilterRestrictions", this.oEntitySet);

			if (oAnnotation) {
				if (oAnnotation.NonFilterableProperties) {
					for (i = 0; i < oAnnotation.NonFilterableProperties.length; i++) {
						oFilterRestrictions.NonFilterableProperties.push(oAnnotation.NonFilterableProperties[i].PropertyPath);
					}
				}

				if (oAnnotation.RequiredProperties) {
					for (i = 0; i < oAnnotation.RequiredProperties.length; i++) {
						oFilterRestrictions.RequiredProperties.push(oAnnotation.RequiredProperties[i].PropertyPath);
					}
				}
			}
		}

		return oFilterRestrictions;
	};

	ODataAdapter.prototype.getAnnotation = function(sAnnotation, oAnnotation) {
		oAnnotation = oAnnotation || this.schema;
		var aParts = sAnnotation.split("/");
		var iIndex = 0;

		while (oAnnotation && aParts[iIndex]) {
			oAnnotation = oAnnotation[aParts[iIndex]];
			iIndex++;
		}

		return oAnnotation;
	};

	ODataAdapter.prototype._isAnnotationBoolean = function(sAnnotation) {
		var oAnnotation = this.getAnnotation(sAnnotation);
		var isType = false;
		if (oAnnotation != null) {
			isType = oAnnotation.Bool ? (oAnnotation.Bool == "true") : true;
		}
		return isType;
	};

	ODataAdapter.prototype._precalucateFieldControl = function() {
		var oFieldControl = this.getAnnotation("com.sap.vocabularies.Common.v1.FieldControl");

		if (oFieldControl) {
			var fieldControl = {};
			this._schemaCache[this.sMetaContext]._fieldControl = fieldControl;

			if (oFieldControl.EnumMember) {

				switch (oFieldControl.EnumMember) {
					case "com.sap.vocabularies.Common.v1.FieldControlType/Hidden":
						fieldControl.visible = false;
						fieldControl.hidden = true;
						fieldControl.editable = false;
						fieldControl.readonly = true;
						fieldControl.required = false;
						break;
					case "com.sap.vocabularies.Common.v1.FieldControlType/Mandatory":
						fieldControl.visible = true;
						fieldControl.hidden = false;
						fieldControl.editable = true;
						fieldControl.readonly = false;
						fieldControl.required = true;
						break;
					case "com.sap.vocabularies.Common.v1.FieldControlType/ReadOnly":
						fieldControl.visible = true;
						fieldControl.hidden = false;
						fieldControl.editable = false;
						fieldControl.readonly = true;
						fieldControl.required = false;
						break;
					default:
						fieldControl.visible = true;
						fieldControl.hidden = false;
						fieldControl.editable = true;
						fieldControl.readonly = true;
						fieldControl.required = false;
						break;
				}
			} else {
				var sPath = oFieldControl.Path;
				if (this.getModelName()) {
					sPath = this.getModelName() + ">" + sPath;
				}

				fieldControl.visible = "{= ${" + sPath + "} !== 0}";
				fieldControl.hidden = "{= ${" + sPath + "} === 0}";
				fieldControl.editable = "{= ${" + sPath + "} !== 1}";
				fieldControl.readonly = "{= ${" + sPath + "} === 1}";
				fieldControl.required = "{= ${" + sPath + "} === 7}";
			}
		}
	};

	ODataAdapter.prototype._enrichFromEntitySet = function(oField, oEntitySet) {
		// take sortable, filterable, required in filter
		var i, oFilterRestrictions = this._getAnnotation("Org.OData.Capabilities.V1.FilterRestrictions", oEntitySet);

		oField.filterable = true;
		oField.requiredInFilter = false;

		if (oFilterRestrictions) {
			for (i = 0; i < oFilterRestrictions.NonFilterableProperties; i++) {
				if (oField.name === oFilterRestrictions.NonFilterableProperties.PropertyPath) {
					oField.filterable = false;
				}
			}
		}

	};

	ODataAdapter.prototype.metadataContextOfField = function(oField) {
		var index = Object.keys(this.fields).indexOf(oField.name);

		if (index > -1) {
			return this.sMetaContext + "/property/" + index;
		} else {
			return "";
		}
	};

	return ODataAdapter;
});
