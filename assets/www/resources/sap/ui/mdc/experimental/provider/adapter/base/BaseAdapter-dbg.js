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

	var BaseAdapter = BaseObject.extend("sap.ui.mdc.experimental.provider.adapter.base.BaseAdapter", {
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
		constructor: function(oModel, sModelName,  sContextName, sMetaContext,bCanonical) {
			this.oModel = oModel;
			this.oMetaModel = oModel.getMetaModel();
			this.sModelName = sModelName;
			this.sContextName = sContextName;

			bCanonical = bCanonical || false;

			if (sMetaContext) {
				this.switchMetaContext(sMetaContext,bCanonical);
			}

			this.putProperty("enabled", this.enabled);
			this.putProperty("label", this.label);
			this.putProperty("tooltip", this.tooltip);
			this.putProperty("//", this["//"]);
		},

		ready: function() {
			if (this.oMetaModel.loaded) {
				return this.oMetaModel.loaded();
			}
		},

		kind: function() {
			throw new Error("sap.ui.mdc.experimental.provider.model.BaseAdapter:  method kind must be redefined");
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
			throw new Error("sap.ui.mdc.experimental.provider.model.BaseAdapter:  method afterMetaContextSwitch must be redefined");
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
		 * The editable meta data information for the property.
		 *
		 * @return {object} The editable information for the property, this may also be a binding
		 * @public
		 */
		enabled: function() {
			return true;
		},
		/**
		 * The readonly meta data information for the property.
		 *
		 * @return {object} The readonly information for the property, this may also be a binding
		 * @public
		 */
		disabled: function() {
			return false;
		},
		/**
		 * The label information for the property.
		 *
		 * @return {string} The label information for the property
		 * @public
		 */
		label: function() {
			throw new Error("sap.ui.mdc.experimental.provider.model.BaseAdapter:  method getLabel must be redefined");
		},
		/**
		 * The tooltip information for the property.
		 *
		 * @return {string} The tooltip information for the property
		 * @public
		 */
		tooltip: function() {
			throw new Error("sap.ui.mdc.experimental.provider.model.FieldAdapter:  method getTooltip must be redefined");
		},
		/**
		 * The binding as a path within the model name
		 */
		asPath: function(sValuePath, sType) {
			var sPath = "{";

			if (this.sModelName) {
				sPath = sPath + "model: '" + this.sModelName + "',";
			}

			sPath = sPath + "path: '" + sValuePath + "'";

			if (sType) {
				sPath = sPath + ", type: '" + sType + "'";
			}

			sPath = sPath + "}";

			return sPath;
		},
		/**
		 * Retreives the context name
		 */
		getContext: function() {
			return this.sContextName;
		},
		/**
		 * Negation of the property
		 */
		not: function(sPropertyName) {
			var sNotPropertyName;

			if (sPropertyName[0] != "!") {
				sNotPropertyName = "!" + sPropertyName;
			} else {
				sNotPropertyName = sPropertyName.substr(1);
			}

			return this[sNotPropertyName];
		},
		/**
		 *
		 */
		setValue: function(sProperty,vValue) {
			Object.defineProperty(this, sProperty, {
				configurable: true,
				get: function() {
					if (!this._mPropertyBag[this.sMetaContext].hasOwnProperty(sProperty)) {
						this._mPropertyBag[this.sMetaContext][sProperty] = vValue;
					}

					return this._mPropertyBag[this.sMetaContext][sProperty];
				}
			});
		}

	});

	return BaseAdapter;

});