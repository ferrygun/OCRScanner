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

	var CollectionAdapter = BaseAdapter.extend("sap.ui.mdc.experimental.provider.model.CollectionAdapter", {

		constructor: function(oModel, sModelName, sMetaContext, bCanonical,Base) {
			var SuperAdapter = BaseAdapter;

			if (Base) {
				jQuery.extend(SuperAdapter.prototype,Base.prototype);
				SuperAdapter.prototype.constructor = BaseAdapter;
			}

			SuperAdapter.prototype.constructor.apply(this,arguments);

			this.putProperty("columns", this.columns);
			this.putProperty("measures", this.measures);
			this.putProperty("dimensions",this.dimensions);
			this.putProperty("filterItems",this.filterItems);

		},

		columns: function() {
			throw new Error("ap.ui.mdc.experimental.provider.model.CollectionAdapter:  method columns must be redefined");
		},

		measures: function() {
			throw new Error("ap.ui.mdc.experimental.provider.model.CollectionAdapter:  method measures must be redefined");
		},

		dimensions: function() {
			throw new Error("ap.ui.mdc.experimental.provider.model.CollectionAdapter:  method dimensions must be redefined");
		},

		filterItems: function() {
			throw new Error("ap.ui.mdc.experimental.provider.model.CollectionAdapter:  method filterItems must be redefined");
		}

	});

	return CollectionAdapter;

});
