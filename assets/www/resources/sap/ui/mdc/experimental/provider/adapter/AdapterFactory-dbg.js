sap.ui.define([
	"sap/ui/model/MetaModel", "sap/ui/mdc/experimental/provider/adapter/ODataFieldAdapter", "sap/ui/mdc/experimental/provider/adapter/ODataObjectAdapter"
], function(MetaModel, ODataFieldAdapter, ODataObjectAdapter) {
	"use strict";

	/**
	 * @public
	 */
	var Factory = {
		adapterCache: {},
		promiseCache: {},
		defaultAdapter: {
			"field": "sap/ui/mdc/experimental/provider/adapter/ODataFieldAdapter",
			"object": "sap/ui/mdc/experimental/provider/adapter/ODataObjectAdapter"
		},
		adapterClassCache: {
			"sap/ui/mdc/experimental/provider/adapter/ODataFieldAdapter": ODataFieldAdapter,
			"sap/ui/mdc/experimental/provider/adapter/ODataObjectAdapter": ODataObjectAdapter
		}
	};

	/**
	 * Return a promise
	 */
	Factory.requestAdapter = function(oModel, oMetaContext) {
		var oKeyInfo = Factory._getKeyInfo(oMetaContext);

		if (!oModel.getMetaModel()) {
			throw new Error("sap.ui.mdc.experimental.provider.model.ModelAdapterFactory: Only models with meta model are allowed");
		}

		if (!Factory.promiseCache[oKeyInfo.key]) {
			Factory.promiseCache[oKeyInfo.key] = new Promise(function(resolve, reject) {
				var oAdapter = Factory.getAdapter(oModel, oMetaContext);
				if (oAdapter) {
					resolve(oAdapter);
				} else {
					sap.ui.require([
					                oMetaContext.adapter
					], function(Adapter) {
						var oAdapter = new Adapter(oModel, oMetaContext.model, oMetaContext.name);
						if (oAdapter) {
							Factory.adapterCache[oKeyInfo.key] = oAdapter;
							resolve(oAdapter);
						} else {
							reject("Invalid class");
						}
					});
				}
			});
		}

		return Factory.promiseCache[oKeyInfo.key];
	};

	Factory.getAdapter = function(oModel, oMetaContext) {
		var oKeyInfo = Factory._getKeyInfo(oMetaContext);

		var oCachedAdapter = Factory.adapterClassCache[oKeyInfo.adapter];

		if (!oModel.getMetaModel()) {
			throw new Error("sap.ui.mdc.experimental.provider.model.ModelAdapterFactory: Only models with meta model are allowed");
		}

		if (Factory.adapterCache[oKeyInfo.key]) {
			return Factory.adapterCache[oKeyInfo.key];
		} else if (oCachedAdapter) {
			Factory.adapterCache[oKeyInfo.key] = new oCachedAdapter(oModel, oMetaContext.model, oMetaContext.name);
			return Factory.adapterCache[oKeyInfo.key];
		}

		return null;
	};

	Factory._getKeyInfo = function(oMetaContext) {
		if (!oMetaContext.adapter) {
			oMetaContext.adapter = Factory.defaultAdapter[oMetaContext.kind];
		}

		var oKeyInfo = {
			adapter: oMetaContext.adapter,
			modelName: oMetaContext.model,
			context: oMetaContext.name,
			key: oMetaContext.model + ">" + oMetaContext.name + ">" + oMetaContext.adapter
		};

		return oKeyInfo;
	};

	Factory.cacheAdapterClass = function(sAdapterClass, Adapter) {
		Factory.adapterClassCache[sAdapterClass] = Adapter;
	};

	return Factory;
});