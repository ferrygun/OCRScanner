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

	var ObjectAdapter = BaseAdapter.extend("sap.ui.mdc.experimental.provider.model.ObjectAdapter", {

		constructor: function(oModel, sModelName, sMetaContext, bCanonical,Base) {
			var SuperAdapter = BaseAdapter;

			if (Base) {
				jQuery.extend(SuperAdapter.prototype,Base.prototype);
				SuperAdapter.prototype.constructor = BaseAdapter;
			}

			SuperAdapter.prototype.constructor.apply(this,arguments);

			this.putProperty("collection", this.collection);
			this.putProperty("keys", this.keys);
			this.putProperty("fields", this.fields);
			this.putProperty("relations", this.relations);
		},

		kind: function() {
			return 'object';
		},

		/**
		 * The path to the object as a collection
		 *
		 * @return {string} A binding path
		 */
		collection: function() {
			throw new Error("ap.ui.mdc.experimental.provider.model.ObjectAdapter:  method collection must be redefined");
		},

		/**
		 *
		 */
		keys: function() {

		},
		/**
		 * A map of the object fields
		 *
		 * @return {object} A named array of field adapters
		 * @public
		 */
		fields: function() {
			throw new Error("ap.ui.mdc.experimental.provider.model.ObjectAdapter:  method fields must be redefined");
		},
		/**
		 * The relations of the corresponding object
		 */
		relations: function() {
			throw new Error("ap.ui.mdc.experimental.provider.model.ObjectAdapter:  method relations must be redefined");
		}

	});

	return ObjectAdapter;

});