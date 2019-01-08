/*!
 * (c) Copyright 2010-2018 SAP SE or an SAP affiliate company.
 */

/* -----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying
 * source files only (*.type, *.js) or they will be lost after the next generation.
 * ----------------------------------------------------------------------------------- */

/**
 * Initialization Code and shared classes of library sap.zen.crosstab (1.52.4)
 */
jQuery.sap.declare("sap.zen.crosstab.library");
jQuery.sap.require("sap.ui.core.Core");
/**
 * Design Studio Crosstab library.  NOT INTENDED FOR STANDALONE USAGE.
 *
 * @namespace
 * @name sap.zen.crosstab
 * @public
 */


// library dependencies
jQuery.sap.require("sap.ui.core.library");

// delegate further initialization of this library to the Core
sap.ui.getCore().initLibrary({
	name : "sap.zen.crosstab",
	dependencies : ["sap.ui.core"],
	types: [],
	interfaces: [],
	controls: [
		"sap.zen.crosstab.Crosstab",
		"sap.zen.crosstab.DataCell",
		"sap.zen.crosstab.HeaderCell"
	],
	elements: [],
	version: "1.52.4"
});

