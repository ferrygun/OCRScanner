/*!
 * (c) Copyright 2010-2018 SAP SE or an SAP affiliate company.
 */

/* -----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying
 * source files only (*.type, *.js) or they will be lost after the next generation.
 * ----------------------------------------------------------------------------------- */

/**
 * Initialization Code and shared classes of library sap.zen.dsh (1.52.4)
 */
jQuery.sap.declare("sap.zen.dsh.library");
jQuery.sap.require("sap.ui.core.Core");
/**
 * Design Studio Runtime Library.  Intended only to be used within S/4 HANA Fiori applications.
 *
 * @namespace
 * @name sap.zen.dsh
 * @public
 */


// library dependencies
jQuery.sap.require("sap.ui.core.library");
jQuery.sap.require("sap.ui.table.library");
jQuery.sap.require("sap.ui.layout.library");
jQuery.sap.require("sap.m.library");
jQuery.sap.require("sap.zen.commons.library");
jQuery.sap.require("sap.zen.crosstab.library");

// delegate further initialization of this library to the Core
sap.ui.getCore().initLibrary({
	name : "sap.zen.dsh",
	dependencies : ["sap.ui.core","sap.ui.table","sap.ui.layout","sap.m","sap.zen.commons","sap.zen.crosstab"],
	types: [],
	interfaces: [],
	controls: [
		"sap.zen.dsh.AnalyticGrid",
		"sap.zen.dsh.Dsh"
	],
	elements: [],
	noLibraryCSS: true,
	version: "1.52.4"
});

