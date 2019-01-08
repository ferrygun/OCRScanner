/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	"./base/BaseAdapter"
], function(BaseAdapter) {
	"use strict";

	/*
	 * Strips the OData key predicate from a resource path segment. @param {string} sSegment @returns {string}
	 */
	function stripKeyPredicate(sSegment) {
		var iPos = sSegment.indexOf("(");
		return iPos >= 0 ? sSegment.slice(0, iPos) : sSegment;
	}

	var ODataBaseAdapter = BaseAdapter.extend("sap.ui.mdc.experimental.provider.adapter.ODataBaseAdapter", {
		_schemaCache: {

		},
		aExpand: [],
		constructor: function(oModel, sModelName, sMetaContext, bCanonical) {
			BaseAdapter.prototype.constructor.apply(this, arguments);
		}
	});

	ODataBaseAdapter.prototype.afterMetaContextSwitch = function(sCanonicalPath, sPath) {
		if (!this._schemaCache[sCanonicalPath]) {
			this._schemaCache[sCanonicalPath] = this.oMetaModel.getProperty(sCanonicalPath);
			this.schema = this._schemaCache[sCanonicalPath];
			this._precalucateFieldControl();
		} else {
			this.schema = this._schemaCache[sCanonicalPath];
		}

		this.oEntitySet = this.calculateEntitySet(sPath);
	};

	ODataBaseAdapter.prototype.calculateEntitySet = function(sPath) {
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

	ODataBaseAdapter.prototype.resolveNavi = function(sNaviPath, TargetAdapter) {
		var aPath = sNaviPath.split("/"), oNaviEntitySet = this.oEntitySet, oAssocationEnd;

		while (aPath.length > 1) {
			oAssocationEnd = this.oMetaModel.getODataAssociationSetEnd(this.schema, aPath[0]);
			oNaviEntitySet = this.oMetaModel.getODataEntitySet(oAssocationEnd.entitySet);

			if (this.aExpand.indexOf(aPath[0]) == -1) {
				this.aExpand.push(aPath[0]);
			}

			aPath.shift(-1);
		}

		var sNaviDeep = "/" + oNaviEntitySet.name + "/" + aPath[0];

		var oMetadataContext = this.oMetaModel.getMetaContext(sNaviDeep);
		var sMetaContext = oMetadataContext.getPath();

		var oNavi = new TargetAdapter(this.oModel, this.sModelName, this.sContextName, sMetaContext, true);

		oNavi.oEntitySet = oNaviEntitySet;

		return oNavi;
	};

	ODataBaseAdapter.prototype.enabled = function() {
		var oUpdatableAnno = this.getAnnotation("Org.OData.Core.V1.Immutable/Bool") || this.getAnnotation("Org.OData.Core.V1.Computed/Bool");
		var bEnabled = oUpdatableAnno ? oUpdatableAnno == "false" : true;

		if (bEnabled && this.schema._fieldControl) {
			bEnabled = this.schema._fieldControl.editable;
			this.setValue("!enabled",this.schema._fieldControl.readonly);
		} else {
			this.setValue("!enabled",!bEnabled);
		}

		return bEnabled;
	};

	ODataBaseAdapter.prototype.tooltip = function() {
		return this.getAnnotation("com.sap.vocabularies.Common.v1.QuickInfo/String");
	};

	ODataBaseAdapter.prototype.label = function() {
		return this["//"]["com.sap.vocabularies.Common.v1.Label"]["String"];
	};

	ODataBaseAdapter.prototype.navigationProperties = function() {
		var i, oNavi, aNavis = this.getAnnotation("navigationProperty"), aNaviMap = [];

		for (i = 0; i < aNavis.length; i++) {
			oNavi = aNavis[i];

			aNaviMap[oNavi.name] = oNavi;
		}

		return aNaviMap;
	};

	ODataBaseAdapter.prototype.expand = function() {
		return this.aExpand;
	};

	ODataBaseAdapter.prototype["//"] = function() {
		return this.schema;
	};

	ODataBaseAdapter.prototype.getAnnotation = function(sAnnotation, oAnnotation) {
		oAnnotation = oAnnotation || this.schema;
		var aParts = sAnnotation.split("/");
		var iIndex = 0;

		while (oAnnotation && aParts[iIndex]) {
			oAnnotation = oAnnotation[aParts[iIndex]];
			iIndex++;
		}

		return oAnnotation;
	};

	ODataBaseAdapter.prototype._isAnnotationBoolean = function(sAnnotation) {
		var oAnnotation = this.getAnnotation(sAnnotation);
		var isType = false;
		if (oAnnotation != null) {
			isType = oAnnotation.Bool ? (oAnnotation.Bool == "true") : true;
		}
		return isType;
	};

	ODataBaseAdapter.prototype._precalucateFieldControl = function() {
		var oFieldControl = this["//"]["com.sap.vocabularies.Common.v1.FieldControl"];

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

	ODataBaseAdapter.prototype._enrichFromEntitySet = function(oField, oEntitySet) {
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

	ODataBaseAdapter.prototype.metadataContextOfField = function(oField) {
		var index = Object.keys(this.fields).indexOf(oField.name);

		if (index > -1) {
			return this.sMetaContext + "/property/" + index;
		} else {
			return "";
		}
	};

	return ODataBaseAdapter;
});