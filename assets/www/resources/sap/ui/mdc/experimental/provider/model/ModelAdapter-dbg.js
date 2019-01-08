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
	"jquery.sap.global", "sap/ui/base/Object"
], function(jQuery, BaseObject) {
	"use strict";

	var ModelAdapter = BaseObject.extend("sap.ui.mdc.experimental.provider.model.ModelAdapter", {
		/**
		 * The reference to the current meta model.
		 *
		 * @protected
		 */
		oMetaModel: undefined,
		/**
		 * The models name
		 *
		 * @protected
		 */
		sModelName: undefined,
		/**
		 * The cached properties
		 *
		 * @private
		 */
		_mPropertyBag: {},
		constructor: function(oModel, sModelName, sMetaContext,bCanonical) {
			this.oModel = oModel;
			this.oMetaModel = oModel.getMetaModel();
			this.sModelName = sModelName;

			bCanonical = bCanonical || false;

			if (sMetaContext) {
				this.switchMetaContext(sMetaContext,bCanonical);
			}

			this.putProperty("propertyValue", this.propertyValue);
			this.putProperty("key", this.key);
			this.putProperty("visible", this.visible);
			this.putProperty("hidden", this.hidden);
			this.putProperty("enabled", this.enabled);
			this.putProperty("disabled", this.disabled);
			this.putProperty("required", this.required);
			this.putProperty("semantics", this.semantics);
			this.putProperty("ui5Type", this.ui5Type);
			this.putProperty("formatOptions",this.formatOptions);
			this.putProperty("tooltip", this.tooltip);
			this.putProperty("label", this.label);
			this.putProperty("filterable", this.filterable);
			this.putProperty("requiredInFilter", this.requiredInFilter);
			this.putProperty("sortable", this.sortable);
		},

		ready: function() {
			if (this.oMetaModel.loaded) {
				return this.oMetaModel.loaded();
			}
		},

		/**
		 * Switches the metaContext
		 *
		 * @param {string} sMetaContext the meta context
		 * @final
		 */
		switchMetaContext: function(sMetaContext, bCanonical) {
			var sCanonicalMetaContext;

			if (bCanonical) {
				sCanonicalMetaContext = sMetaContext;
			} else {
				this.oMetaContext = this.oMetaModel.getMetaContext(sMetaContext);
				sCanonicalMetaContext = this.oMetaContext.getPath();
			}

			if (sCanonicalMetaContext && sCanonicalMetaContext != this.sMetaContext) {
				this.sMetaContext = sCanonicalMetaContext;

				if (!this._mPropertyBag[this.sMetaContext]) {
					this._mPropertyBag[this.sMetaContext] = {};
				}
			}

			// hook that needs to be implemented
			this.afterMetaContextSwitch(this.sMetaContext, sMetaContext);
		},
		/**
		 * Adaptions after a meta context switch
		 *
		 * @protected
		 */
		afterMetaContextSwitch: function(sMetaContext) {
			throw new Error("sap.ui.mdc.experimental.provider.model.ModelAdapter:  method afterMetaContextSwitch must be redefined");
		},

		/**
		 * The name of the model
		 *
		 * @returns
		 */
		getModelName: function() {
			return this.sModelName;
		},
		/**
		 * Puts a deferred property to the corresponding adapter
		 */
		putProperty: function(sProperty, fnGetter, oArgs, caller) {
			if (!caller) {
				caller = this;
			}

			Object.defineProperty(this, sProperty, {
				configurable: true,
				get: function() {
					if (!this._mPropertyBag[this.sMetaContext].hasOwnProperty(sProperty)) {
						this._mPropertyBag[this.sMetaContext][sProperty] = fnGetter.apply(caller, oArgs);
					}

					return this._mPropertyBag[this.sMetaContext][sProperty];
				}
			});
		},
		/**
		 * The value of the property
		 *
		 * @return {string} The id prefix
		 * @public
		 */
		propertyValue: function() {
			return this.asPath(this.key);
		},
		/**
		 * The prefix for the control Id of the driven control
		 *
		 * @return {string} The id prefix
		 * @public
		 */
		key: function() {
			throw new Error("sap.ui.mdc.experimental.provider.model.ModelAdapter:  method key must be redefined");
		},
		/**
		 * The visible meta data information for the property.
		 *
		 * @return {object} The visible information for the property, this may also be a binding
		 * @public
		 */
		visible: function() {
			throw new Error("sap.ui.mdc.experimental.provider.model.ModelAdapter:  method visible must be redefined");
		},
		/**
		 * The hidden meta data information for the property.
		 *
		 * @return {object} The hidden information for the property, this may also be a binding
		 * @public
		 */
		hidden: function() {
			throw new Error("sap.ui.mdc.experimental.provider.model.ModelAdapter:  method isHidden must be redefined");
		},
		/**
		 * The editable meta data information for the property.
		 *
		 * @return {object} The editable information for the property, this may also be a binding
		 * @public
		 */
		enabled: function() {
			throw new Error("sap.ui.mdc.experimental.provider.model.ModelAdapter:  method isEnabled must be redefined");
		},
		/**
		 * The readonly meta data information for the property.
		 *
		 * @return {object} The readonly information for the property, this may also be a binding
		 * @public
		 */
		disabled: function() {
			throw new Error("sap.ui.mdc.experimental.provider.model.ModelAdapter:  method isDisabled must be redefined");
		},
		/**
		 * The required meta data information for the property.
		 *
		 * @return {object} The required information for the property, this may also be a binding
		 * @public
		 */
		required: function() {
			throw new Error("sap.ui.mdc.experimental.provider.model.ModelAdapter:  method isRequired must be redefined");
		},
		/**
		 * Defines the semantics of the property
		 *
		 * @see ModelAdapter.Semantics
		 * @return {Semantics} The fields semantic
		 * @public
		 */
		semantics: function() {
			throw new Error("sap.ui.mdc.experimental.provider.model.ModelAdapter:  method semantics must be redefined");
		},
		/**
		 * Indicates if property is flagged as URL.
		 *
		 * @return {boolean} <code>true</true> if property is flagged as URL
		 *
		 * @public
		 */
		url: function() {
			throw new Error("sap.ui.mdc.experimental.provider.model.ModelAdapter:  method isURL must be redefined");
		},
		/**
		 * Indicates if property is flagged as password.
		 *
		 * @return {boolean} <code>true</true> if property is flagged as password
		 *
		 * @public
		 */
		password: function() {
			throw new Error("sap.ui.mdc.experimental.provider.model.ModelAdapter:  method isPassword must be redefined");
		},
		/**
		 * Indicates if property is flagged as phone number.
		 *
		 * @return {boolean} <code>true</true> if property is flagged as phone number
		 *
		 * @public
		 */
		phoneNumber: function() {
			throw new Error("sap.ui.mdc.experimental.provider.model.ModelAdapter:  method isPhoneNumber must be redefined");
		},
		/**
		 * Indicates if property is flagged as E-Mail.
		 *
		 * @return {boolean} <code>true</true> if property is flagged as E-Mail
		 *
		 * @public
		 */
		eMail: function() {
			throw new Error("sap.ui.mdc.experimental.provider.model.ModelAdapter:  method isEmail must be redefined");
		},
		/**
		 * The label information for the property.
		 *
		 * @return {string} The label information for the property
		 * @public
		 */
		label: function() {
			throw new Error("sap.ui.mdc.experimental.provider.model.ModelAdapter:  method getLabel must be redefined");
		},
		/**
		 * The tooltip information for the property.
		 *
		 * @return {string} The tooltip information for the property
		 * @public
		 */
		tooltip: function() {
			throw new Error("sap.ui.mdc.experimental.provider.model.ModelAdapter:  method getTooltip must be redefined");
		},
		/**
		 * The UI5 type information for the property.
		 *
		 * @return {string} The UI5 type information for the property
		 * @public
		 */
		ui5Type: function() {
			throw new Error("sap.ui.mdc.experimental.provider.model.ModelAdapter:  method getUI5Type must be redefined");
		},
		/**
		 * The formatOptions information for the property.
		 *
		 * @return {string} The UI5 type information for the property
		 * @public
		 */
		formatOptions: function() {
			throw new Error("sap.ui.mdc.experimental.provider.model.ModelAdapter:  method formatOptions must be redefined");
		},
		/**
		 * The filterable information for the property.
		 *
		 * @return {string} The UI5 type information for the property
		 * @public
		 */
		filterable: function() {
			throw new Error("sap.ui.mdc.experimental.provider.model.ModelAdapter:  method filterable must be redefined");
		},
		/**
		 * The requiredInFilter information for the property.
		 *
		 * @return {string} The UI5 type information for the property
		 * @public
		 */
		requiredInFilter: function() {
			throw new Error("sap.ui.mdc.experimental.provider.model.ModelAdapter:  method requiredInFilter must be redefined");
		},
		/**
		 * The sortable information for the property.
		 *
		 * @return {string} The UI5 type information for the property
		 * @public
		 */
		sortable: function() {
			throw new Error("sap.ui.mdc.experimental.provider.model.ModelAdapter:  method sortable must be redefined");
		},

		/**
		 * The binding as a path within the model name
		 */
		asPath: function(sSimplePath, bWithoutSyntax) {
			var sPath = this.sModelName ? this.sModelName + ">" + sSimplePath : sSimplePath;

			if (!bWithoutSyntax) {
				sPath = "{path: '" + sPath + "'}";
			}

			return sPath;
		}

	});

	ModelAdapter.Semantics = {
		eMail: 1,
		password: 2,
		url: 3,
		phoneNumber: 4,
		currency: 5,
		measure: 6
	};

	return ModelAdapter;

});
