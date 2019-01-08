/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

/**
 * @namespace reserved for Fiori Elements
 * @name sap.fe
 * @private
 * @experimental
 */

/**
 * Initialization Code and shared classes of library sap.fe
 */
sap.ui.define([
	"jquery.sap.global",
	"sap/ui/core/library"
], function (jQuery, library1) {
	"use strict";

	/**
	 * Fiori Elements Library
	 *
	 * @namespace
	 * @name sap.fe
	 * @private
	 * @experimental
	 */

	// library dependencies
	// delegate further initialization of this library to the Core
	sap.ui.getCore().initLibrary({
		name: "sap.fe",
		dependencies: [
			"sap.ui.core"
		],
		types: [],
		interfaces: [],
		controls: [],
		elements: [],
		version: "1.52.0"
	});



	sap.ui.require(['sap/ui/core/XMLComposite', 'sap/ui/core/util/XMLPreprocessor'], function (XMLComposite, XMLPreprocessor) {
		function visitAttibutesIgnoringMetadataContext(oNode, oVisitor) {
			var vValue = oNode.getAttribute('metadataContexts');
			if (vValue) {
				oNode.removeAttribute('metadataContexts');
			}
			oVisitor.visitAttributes(oNode);
			if (vValue) {
				if (vValue.indexOf('sap.fe.deviceModel') < 0 ) {
					//TODO: Make this better. We need to add it to be passed through always
					vValue += ",{model: 'sap.fe.deviceModel', path: '/', name: 'sap.fe.deviceModel'}";
				}
				oNode.setAttribute('metadataContexts', vValue);
			}
		}

		function registerPlugin(oNode, oVisitor) {
			//'this' must be the name of the control
			visitAttibutesIgnoringMetadataContext(oNode, oVisitor);
			XMLComposite.initialTemplating(oNode, oVisitor, this);
			//TODO: Once sap.ui.mdc.providerHook can handle this we can remove the removal of the metadataContexts
			oNode.removeAttribute('metadataContexts');
		}

		XMLPreprocessor.plugIn(registerPlugin.bind("sap.fe.Form"), "sap.fe", "Form");

	});

	return sap.fe;

}, /* bExport= */false);
