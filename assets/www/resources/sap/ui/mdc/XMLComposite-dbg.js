/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	'sap/ui/core/XMLComposite',
	'./library'
], function (XMLComposite, Library) {
	"use strict";
	var MDCXMLComposite = XMLComposite.extend("sap.ui.mdc.XMLComposite", {
		defaultMetaModel: 'sap.ui.mdc.metaModel',
		alias: "this",
		"abstract" : true
	});

	MDCXMLComposite.prototype.init = function() {
		this.setModel(Library.getResourceModel(), "$i18n");
	};

	return MDCXMLComposite;
}, true);
