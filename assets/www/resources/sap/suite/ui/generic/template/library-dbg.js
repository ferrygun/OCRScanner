/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
 
/**
* @namespace reserved for Smart Temaplates
* @name sap.suite.ui.generic.template
* @public
*/

/**
 * Initialization Code and shared classes of library sap.suite.ui.generic.template.
 */
sap.ui.define([
	'jquery.sap.global', 'sap/ui/core/library'
], function(jQuery, library1) {
	"use strict";

	/**
	 * Library with generic Suite UI templates.
	 * 
	 * @namespace
	 * @name sap.suite.ui.generic.template
	 * @public
	 */

	// library dependencies
	// delegate further initialization of this library to the Core
	sap.ui.getCore().initLibrary({
		name: "sap.suite.ui.generic.template",
		dependencies: [
			"sap.ui.core"
		],
		types: [],
		interfaces: [],
		controls: [],
		elements: [],
		version: "1.52.4"
	});

	return sap.suite.ui.generic.template;

}, /* bExport= */false);