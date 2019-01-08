/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	"./base/ObjectAdapter", "./ODataBaseAdapter", "./ODataFieldAdapter"
], function(ObjectAdapter, ODataBaseAdapter, ODataFieldAdapter) {
	"use strict";

	var ODataObjectAdapter = ObjectAdapter.extend("sap.ui.mdc.experimental.provider.adapter.ODataObjectAdapter", {
		_schemaCache: {

		},
		aExpand: [],
		constructor: function(oModel, sModelName, sMetaContext, bCanonical) {
			ObjectAdapter.prototype.constructor.apply(this, [
				oModel, sModelName, sMetaContext, bCanonical, ODataBaseAdapter
			]);
		}
	});

	ODataObjectAdapter.prototype.collection = function() {
		return this.asPath("/" + this.oEntitySet.name);
	};

	ODataObjectAdapter.prototype.keys = function() {
		var i, aKeys = this["//"]["key"]["propertyRef"], oKeyMap = {};

		for (i = 0; i < aKeys.length; i++) {
			oKeyMap[aKeys[i].name] = this.fields[aKeys[i].name];
		}

		return oKeyMap;
	};

	ODataObjectAdapter.prototype.fields = function() {
		var i, oField, aFields = this["//"]["property"], oFieldMap = {};

		for (i = 0; i < aFields.length; i++) {
			oField = aFields[i];

			oFieldMap[oField.name] = new ODataFieldAdapter(this.oModel, this.sModelName, this.sContextName, this.sMetaContext + "/property/" + i, true);
			oFieldMap[oField.name].oEntitySet = this.oEntitySet;
		}

		return oFieldMap;
	};

	ODataObjectAdapter.prototype.relations = function() {
		// var oNaviMap = this.navigationProperties;

	};

	return ODataObjectAdapter;
});