sap.ui.define([
	"./Utils", "sap/ui/mdc/experimental/provider/ControlProvider", "sap/ui/mdc/experimental/provider/adapter/AdapterFactory"
], function(Utils, ControlProvider, AdapterFactory) {
	"use strict";

	/**
	 * @public
	 */
	var ControlRegistry = {
		ControlProvider: ControlProvider,
		Utils: Utils,
		AdapterFactory: AdapterFactory
	};

	ControlRegistry.getTemplateNodes = function() {
		return Object.keys(ControlRegistry._mTemplatingFunctions);
	};

	ControlRegistry.getProviderFunction = function(oControl) {
		var sName = "";
		if (typeof oControl === 'string') {
			sName = oControl;
		} else {
			sName = oControl.getMetadata().getName();
		}
		var fnProvider = ControlRegistry._mProviderFunctions[sName];

		if (fnProvider != null) {
			return fnProvider;
		} else {
			return ControlRegistry._mProviderFunctions["sap.ui.mdc.Base"];
		}
	};

	ControlRegistry.getTemplatingFunction = function(oNode) {
		var sName = "";
		if (typeof oNode === 'string') {
			sName = oNode;
		} else {
			sName = Utils.className(oNode);
		}

		var fnVisitor = ControlRegistry._mTemplatingFunctions[sName];

		if (fnVisitor != null) {
			return fnVisitor;
		} else {
			return ControlRegistry._mTemplatingFunctions["sap.ui.mdc.Base"];
		}
	};

	/**
	 * Cleans the registry of controls
	 * @param {boolean} bProvider If set to true, then the provider functions are cleaned, defaultValue is true
	 * @param {boolean} bTemplating If set to true, then the templating functions are cleaned
	 *
	 */
	ControlRegistry.cleanRegistry = function(bProvider, bTemplating) {
		bProvider = (bProvider == null) ? true : bProvider;

		if (bProvider) {
			ControlRegistry._mProviderFunctions = {};
		}

		bTemplating = (bTemplating == null) ? true : bTemplating;

		if (bTemplating) {
			ControlRegistry._mTemplatingFunctions = {};
		}
	};

	/**
	 * Registers a control for MDC providing
	 *
	 * @param {string} sClassName the controls class name, e.g. sap.m.Button
	 * @param {function} fnProviderFunction the function to run if control is already created
	 * @param {function} fnTemplatingFunction the function to run before the control is created
	 * @param {string}   sAdapterModule the name of the adapter module class that needs to be loaded
	 *
	 */
	ControlRegistry.registerControl = function(sControlClassName, fnProviderFunction, fnTemplatingFunction, sAdapterModule) {
		ControlRegistry._mProviderFunctions[sControlClassName] = fnProviderFunction;
		ControlRegistry._mTemplatingFunctions[sControlClassName] = fnTemplatingFunction;

		if (sAdapterModule) {
			var sClassName = sAdapterModule.replace(new RegExp("/", "g"), ".");
			jQuery.sap.require(sClassName);
			AdapterFactory.cacheAdapterClass(sAdapterModule, jQuery.sap.getObject(sClassName));
		}
	};

	ControlRegistry._mTemplatingFunctions = {
		"sap.ui.mdc.Base": function(oNode, oContextCallback, oAdapter) {
			var sId = oNode.getAttribute("id");
			oNode.removeAttribute("id");
			oNode.setAttribute("id", oAdapter.key + "---" + sId);

			var sLabelFor = oNode.getAttribute("labelFor");

			if (sLabelFor) {
				oNode.setAttribute("labelFor", oAdapter.key + "---" + sLabelFor);
			}
		},
		"sap.m.Label": function(oNode, oContextCallback, oAdapter) {
			ControlRegistry._mTemplatingFunctions["sap.ui.mdc.Base"](oNode, oContextCallback, oAdapter);

			ControlProvider.provideAttribute(oNode, "text", oAdapter.label);
		},
		"sap.ui.mdc.base.FilterField": function(oNode, oContextCallback, oAdapter) {
			ControlRegistry._mTemplatingFunctions["sap.ui.mdc.Base"](oNode, oContextCallback, oAdapter);

			ControlProvider.provideAttribute(oNode, "required", oAdapter.required);
			ControlProvider.provideAttribute(oNode, "type", oAdapter.type);
			ControlProvider.provideAttribute(oNode, "fieldPath", oAdapter.path);
		}
	};

	ControlRegistry._mProviderFunctions = {
		"sap.ui.mdc.Base": function(oControl, oAdapter) {

			ControlProvider.provideProperty(oControl, "visible", oAdapter.visible);
			ControlProvider.provideProperty(oControl, "tooltip", oAdapter.tooltip);
		},
		"sap.m.InputBase": function(oControl, oAdapter) {
			ControlRegistry._mProviderFunctions["sap.ui.mdc.Base"](oControl, oAdapter);

			ControlProvider.provideProperty(oControl, "editable", oAdapter.enabled);
			ControlProvider.provideProperty(oControl, "required", oAdapter.required);

			var aLabels = oControl.getLabels();

			for (var i = 0; i < aLabels.length; i++) {
				if (ControlProvider.canControlBeProvided(aLabels[i], oControl)) {
					ControlRegistry.getProviderFunction(aLabels[i])(aLabels[i], oAdapter);
				}
			}
		},
		"sap.m.Input": function(oControl, oAdapter) {
			ControlRegistry._mProviderFunctions["sap.m.InputBase"](oControl, oAdapter);

			var type = Utils.convertToInputType(oAdapter);

			ControlProvider.provideProperty(oControl, "type", type);

		},
		"sap.m.Label": function(oControl, oAdapter) {
			ControlRegistry._mProviderFunctions["sap.ui.mdc.Base"](oControl, oAdapter);

			ControlProvider.provideProperty(oControl, "text", oAdapter.label);
		},
		"sap.ui.layout.form.FormElement": function(oControl, oAdapter) {

			var oLabel = oControl.getLabel();
			if (oLabel && ControlProvider.canControlBeProvided(oLabel, oControl)) {
				ControlRegistry.getProviderFunction(oLabel)(oLabel, oAdapter);
			}
			var aFields = oControl.getFields();
			for (var i = 0; i < aFields.length; i++) {
				if (ControlProvider.canControlBeProvided(aFields[i], oControl)) {
					ControlRegistry.getProviderFunction(aFields[i])(aFields[i], oAdapter);
				}
			}

		},
		"sap.ui.mdc.base.FilterField": function(oControl, oAdapter) {
			ControlProvider.provideProperty(oControl, "required", oAdapter.required);
			ControlProvider.provideProperty(oControl, "type", oAdapter.type);
			ControlProvider.provideProperty(oControl, "fieldPath", oAdapter.path);
			ControlProvider.provideAggregation(oControl, "conditions", oAdapter.conditions);
			ControlProvider.providePrepareCloneFunction(oControl, "suggestion", oAdapter.suggestion.bind(oAdapter));
		}
	};

	ControlRegistry.resolveMetadataContextsDeep = function(oNode, oContextCallback, oAdapter, oMdCtxAttr) {
		var aChildren = oNode.children,
			i = 0;
		for (i = 0; i < aChildren.length; i++) {
			var sClassName = Utils.className(aChildren[i]);

			if (sClassName && !aChildren[i].getAttribute("metadataContexts") && ControlRegistry._mTemplatingFunctions[sClassName]) {
				aChildren[i].setAttribute("metadataContexts", oMdCtxAttr);
			} else {
				ControlRegistry.resolveMetadataContextsDeep(aChildren[i], oContextCallback, oAdapter, oMdCtxAttr);
			}
		}
	};

	ControlRegistry.determineWithModel = function(oNode) {
		var oParent = oNode;

		while (oParent && !oParent.hasAttribute("var")) {
			oParent = oParent.parentElement;
		}

		if (oParent) {
			return oParent.getAttribute("var");
		}
		return null;
	};

	return ControlRegistry;
});