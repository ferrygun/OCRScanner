sap.ui.define([
	"sap/ui/base/ManagedObject", "sap/ui/mdc/experimental/provider/registry/ControlRegistry", "sap/ui/core/XMLTemplateProcessor", "sap/ui/core/util/XMLPreprocessor"
], function(ManagedObject, ControlRegistry, XMLTemplateProcessor, XMLPreprocessor) {
	"use strict";

	/**
	 * @private
	 */
	var ProviderHook = {};

	/**
	 * Hook that defines Managed Object Hook Methods
	 */
	ProviderHook.apply = function() {
		XMLTemplateProcessor._preprocessMetadataContexts = function(sClassName, mSettings, oContext) {
			if (mSettings.metadataContexts) {
				for ( var key in mSettings.metadataContexts) {
					for (var i = 0; i < mSettings.metadataContexts[key].length; i++) {
						ProviderHook._resolveMetadataContextPath(mSettings.metadataContexts[key][i]);
					}
				}
			}
		};

		ProviderHook._resolveMetadataContextPath = function(oMetadataContext) {
			if (!oMetadataContext) {
				return;
			}

			oMetadataContext.path = oMetadataContext.path || '';// per default the path is empty
			oMetadataContext.relative = oMetadataContext.path[0] !== '/';

			if (oMetadataContext.model == '') {
				oMetadataContext.model = undefined;
			}

			if (!oMetadataContext.kind) {
				oMetadataContext.kind = 'field';//the bound contexts is in a field relation
			}

			oMetadataContext.name = oMetadataContext.name || oMetadataContext.model;
		};

		/**
		 * Process the metadataContexts special setting in order to let the control be driven by metadata
		 *
		 * @param {object} oMetadatas Contexts The metadataContexts special setting
		 * @param {object} oSettings The ManagedObject settings
		 * @private
		 */
		ManagedObject.prototype._processMetadataContexts = function(oMetadataContexts, oSettings) {
			var aMetadataContexts, oMetadataContext, oKeyProviderData;
			this._oProviderData = {
				contexts: null,
				mProvidedProperties: {},
				mProvidedFunctions: {}
			};

			for ( var key in oMetadataContexts) {
				aMetadataContexts = oMetadataContexts[key];

				for (var i = 0; i < aMetadataContexts.length; i++) {
					oMetadataContext = aMetadataContexts[i];

					if (!ProviderHook._sanityChecks(oMetadataContext)) {
						return;
					}

					oKeyProviderData = {};

					oKeyProviderData.metadata = oMetadataContext;
					oKeyProviderData.relative = oMetadataContext.relative;

					this._oProviderData.contexts = this._oProviderData.contexts || {};
					this._oProviderData.contexts[oMetadataContext.name] = oKeyProviderData;
				}
			}

			if (this._oProviderData.contexts) {
				this.attachModelContextChange(ProviderHook._handleModelContextChange, ProviderHook);
			}

		};

		/**
		 * Clones the provider information to the control, this is used in order to drive the metadata information for this control
		 *
		 * @public {Control} oClone The cloned control
		 * @private
		 */
		ManagedObject.prototype._cloneMetadataContexts = function(oClone) {
			if (this._oProviderData) {
				oClone._oProviderData = this._oProviderData;
				ControlRegistry.ControlProvider.prepareClone(oClone);
			}
		};
	};

	ProviderHook.registerVisitors = function(aAdapterClasses) {

		for (var i = 0; i < aAdapterClasses.length; i++) {
			var sClassName = aAdapterClasses[i].replace(new RegExp("/", "g"), ".");
			jQuery.sap.require(sClassName);
			ControlRegistry.AdapterFactory.cacheAdapterClass(aAdapterClasses[i], jQuery.sap.getObject(sClassName));
		}

		ProviderHook.registerTemplating();
	};

	ProviderHook.registerTemplating = function() {
		var i, aNodes = ControlRegistry.getTemplateNodes();

		var fnPreprocess = function(oNode, oCallback) {
			var oMdCtxAttr = oNode.getAttribute("metadataContexts");

			if (oMdCtxAttr) {
				var oMetadataContext = ManagedObject.bindingParser(oMdCtxAttr, null);
				var bRelative = ProviderHook._resolveMetadataContextPath(oMetadataContext);
				if (!bRelative && oMetadataContext.preprocessModel) {
					ProviderHook.resolveContexts(oNode, oCallback, oMetadataContext);
				}
			} else {
				oCallback.visitAttributes(oNode);
			}
		};

		for (i = 0; i < aNodes.length; i++) {
			var oNodeInfo = ControlRegistry.Utils.getNameSpaceInfo(aNodes[i]);

			XMLPreprocessor.plugIn(fnPreprocess, oNodeInfo.nameSpace, oNodeInfo.localName);
		}
	};

	ProviderHook.resolveContexts = function(oNode, oCallback, oMetadataContext) {
		var oContextCallback, oModel = oCallback.getSettings().models[oMetadataContext.preprocessModel];

		if (!oModel) {
			var oViewInfo = oCallback.getViewInfo();
			var oComponent = sap.ui.getCore().getComponent(oViewInfo.componentId);
			oModel = oComponent ? oComponent.oModels[oMetadataContext.preprocessModel] : null;
			var mVariables = {};
			mVariables[oMetadataContext.model] = oModel ? oModel.getContext("/") : null;
			// Add Model context
			oContextCallback = oCallback["with"](mVariables, false);
			// check if the is metadataContext for model
		} else {
			oContextCallback = oCallback;
		}

		if (oModel) {
			var sPath = oMetadataContext.path;
			var oAdapter = ControlRegistry.AdapterFactory.getAdapter(oModel, oMetadataContext);
			oAdapter.switchMetaContext(sPath);// switch the meta context
			var fnTemplatingFunction = ControlRegistry.getTemplatingFunction(oNode);

			fnTemplatingFunction(oNode, oContextCallback, oAdapter);
			var sMetadataContext = oNode.getAttribute("metadataContexts");
			oContextCallback.visitAttributes(oNode);

			if (sMetadataContext) {
				oNode.setAttribute("metadataContexts", sMetadataContext);
			}
		}
	};

	/**
	 * Handler for model context change in order to provide the property
	 *
	 * @param {object} oEvent The event
	 * @private
	 */
	ProviderHook._handleModelContextChange = function(oEvent) {
		var oControl = oEvent.getSource();

		for ( var key in oControl._oProviderData.contexts) {
			ProviderHook._driveWithMetadata(oControl._oProviderData.contexts[key], oControl);
		}
	};

	/**
	 * Actual metadata provisioning
	 *
	 * @param {object} oProvider The provider data.
	 * @private
	 */
	ProviderHook._driveWithMetadata = function(oProvider, oControl) {
		if (!oProvider.model) {
			oProvider.model = oControl.getModel(oProvider.metadata.model);
		}

		if (!oProvider.model) {
			// waiting for a context is only needed if no context was given and path is relative
			jQuery.sap.log.debug("Metadata context cannot be resolved yet");
			return;
		}

		if (oProvider.relative) {
			var sCtx = oControl.getBindingContext(oProvider.metadata.model);
			if (!sCtx) {
				// waiting for a context is only needed if no context was given and path is relative
				jQuery.sap.log.debug("Metadata context cannot be resolved yet");
				return;
			} else {
				oProvider.metadata.path = sCtx + "/" + oProvider.metadata.path;
				delete oProvider.relative;
			}
		}

		// already loaded dive now
		var fnProviderFunction = ControlRegistry.getProviderFunction(oControl);

		if (fnProviderFunction) {
			ControlRegistry.AdapterFactory.requestAdapter(oProvider.model, oProvider.metadata).then(function(oAdapter) {
				var oReadyPromise = oAdapter.ready();
				if (oReadyPromise) {
					oReadyPromise.then(function() {
						oAdapter.switchMetaContext(oProvider.metadata.path);// switch the meta context
						fnProviderFunction(oControl, oAdapter);
					});
				}
			});
		}
	};

	/**
	 * @param {object} oMetadataContext The value for the special setting for metadata context
	 * @private
	 */
	ProviderHook._sanityChecks = function(oMetadataContext) {

		if (!oMetadataContext) {
			jQuery.sap.log.warning("No metadata context available");
			return false;
		}

		// when is this ever a string? If there are good reasons to support string here, the contract with XMLTemplateProcessor can be
		// different.
		// XMLTemplateProcessor can then pass only a string and we do the parsing ourselves always.
		if (typeof oMetadataContext == "string") {
			oMetadataContext = ManagedObject.bindingParser(oMetadataContext);
		}
		if (!oMetadataContext.hasOwnProperty("path") || typeof oMetadataContext.path !== "string") {
			jQuery.sap.log.warning("Metadata context is missing a path or path is not a string");
			return false;
		}

		if (!oMetadataContext.hasOwnProperty("relative")) {
			oMetadataContext.relative = !oMetadataContext.hasOwnProperty("context");
		} else if (typeof oMetadataContext.relative !== "boolean") {
			jQuery.sap.log.warning("Metadata relative information must be a boolean");
			return false;
		}

		if (oMetadataContext.hasOwnProperty("context") && typeof oMetadataContext.context !== "string") {
			jQuery.sap.log.warning("Metadata context needs no context or a context path of type string");
			return false;
		}

		if (!oMetadataContext.hasOwnProperty("model")) {
			oMetadataContext.model = undefined;
			jQuery.sap.log.debug("Metadata context is missing a model, assuming undefined model");
		}

		if (!oMetadataContext.hasOwnProperty("name")) {
			oMetadataContext.name = oMetadataContext.model;
			jQuery.sap.log.debug("Metadata context is missing a contexts name, assuming the name of the model");
		}

		return true;
	};

	return ProviderHook;
});