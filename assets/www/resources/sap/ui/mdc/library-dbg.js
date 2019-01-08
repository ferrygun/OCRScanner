/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

/**
 * Initialization Code and shared classes of library sap.ui.mdc.
 */
sap.ui.define(['sap/ui/mdc/model/GenericType', 'sap/ui/mdc/experimental/provider/ProviderHook', 'sap/ui/core/XMLComposite', 'sap/ui/core/util/XMLPreprocessor'], function(GenericType, ProviderHook, XMLComposite, XMLPreprocessor) {
	"use strict";

	/**
	 * UI5 library: sap.ui.mdc containing controls that can be easily connected to rest service based models providing metadata.
	 *
	 * @namespace
	 * @name sap.ui.mdc
	 * @author SAP SE
	 * @version 1.52.4
	 * @public
	 */

	sap.ui.getCore().initLibrary({
		version: "1.52.4",
		name: "sap.ui.mdc",
		dependencies: ["sap.ui.core", "sap.m"],
		types: ["sap.ui.mdc.FieldDisplay", "sap.ui.mdc.EditMode"],
		interfaces: [],
		controls: ["sap.ui.mdc.Table", "sap.ui.mdc.FilterBar", "sap.ui.mdc.experimental.Field", "sap.ui.mdc.base.FilterField", "sap.ui.mdc.base.FilterToken"],
		elements: ["sap.ui.mdc.experimental.FieldHelpBase",
		           "sap.ui.mdc.experimental.CustomFieldHelp",
		           "sap.ui.mdc.experimental.ListFieldHelp",
		           "sap.ui.mdc.experimental.TableFieldHelp"],
		extensions: {
			flChangeHandlers: {
				"sap.ui.mdc.Table" : "sap/ui/mdc/internal/table/Table"
			}
		},
		noLibraryCSS: false
	});

	/**
	 * Defines how the fields display text should be formatted.
	 *
	 * @enum {string}
	 * @private
	 * @since 1.48.0
	 */
	sap.ui.mdc.FieldDisplay = {
		/**
		 * Only the value is displayed
		 * @public
		 */
		Value: "Value",
		/**
		 * Only the description is displayed
		 *
		 * if a <code>FieldHelp</code> is assigned to the <code>Field</code> the value is used as key for the <code>FieldHelp</code> items.
		 * @public
		 */
		Description: "Description",
		/**
		 * The value and the description is displayed in the field. The description is displayed after the value with brackets.
		 * @public
		 */
		ValueDescription: "ValueDescription",
		/**
		 * The description and the value is displayed in the field. The value is displayed after the description with brackets.
		 * @public
		 */
		DescriptionValue: "DescriptionValue"
	};

	/**
	 * Defines in what mode Filds are rendered
	 *
	 * @enum {string}
	 * @private
	 * @since 1.48.1
	 */
	sap.ui.mdc.EditMode = {
		/**
		 * Field is rendered in display mode
		 * @public
		 */
		Display: "Display",
		/**
		 * Field is rendered editable
		 * @public
		 */
		Editable: "Editable",
		/**
		 * Field is rendered readonly
		 * @public
		 */
		ReadOnly: "ReadOnly",
		/**
		 * Field is rendered disabled
		 * @public
		 */
		Disabled: "Disabled"
	};

	ProviderHook.apply();

	function visitAttibutesIgnoringMetadataContext(oNode, oVisitor) {
		var vValue = oNode.getAttribute('metadataContexts');
		if (vValue) {
			oNode.removeAttribute('metadataContexts');
		}
		oVisitor.visitAttributes(oNode);
		if (vValue) {
			if (vValue.indexOf('sap.fe.deviceModel') < 0 ) {
				//TODO: Make this better. We need to add it to be passed through always
				// TODO: adapt name
				vValue += ",{model: 'sap.fe.deviceModel', path: '/', name: 'sap.fe.deviceModel'}";
			}
			oNode.setAttribute('metadataContexts', vValue);
		}
	}

	/**
	 * Convenience function for registration of the controls to the XMLPreprocessor
	 *
	 * This function is called by the XMLPreprocessor. 'this' is used to remember
	 * the name of the control. So always create a new function via bind("name.of.control")
	 * @param {*} oNode
	 * @param {*} oVisitor
	 */
	function registerPlugin(oNode, oVisitor) {
		visitAttibutesIgnoringMetadataContext(oNode, oVisitor);
		XMLComposite.initialTemplating(oNode, oVisitor, this);
		//TODO: Once sap.ui.mdc.providerHook can handle this we can remove the removal of the metadataContexts
		oNode.removeAttribute('metadataContexts');
	}

	XMLPreprocessor.plugIn(registerPlugin.bind("sap.ui.mdc.Table"), "sap.ui.mdc", "Table");
	XMLPreprocessor.plugIn(registerPlugin.bind("sap.ui.mdc.Field"), "sap.ui.mdc", "Field");
	XMLPreprocessor.plugIn(registerPlugin.bind("sap.ui.mdc.FilterField"), "sap.ui.mdc", "FilterField");
	XMLPreprocessor.plugIn(registerPlugin.bind("sap.ui.mdc.FilterBar"), "sap.ui.mdc", "FilterBar");

	var oResourceModel = new sap.ui.model.resource.ResourceModel({ bundleName: "sap.ui.mdc.messageBundle", async : true});
	var oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.ui.mdc");

	/**
	 * Return the resource model for the library
	 * @private
	 * @returns {sap.ui.model.resource.ResourceModel} The resource model for this library
	 */
	sap.ui.mdc.getResourceModel = function(){
		return oResourceModel;
	};

	/**
	 * Returns a text from the resource bundle of this library
	 * @borrows jQuery.sap.util.ResourceBundle.prototype.getText
	 */
	sap.ui.mdc.getText = function(sText, aParameter){
		return oResourceBundle.getText(sText, aParameter);
	};

	return sap.ui.mdc;

});
