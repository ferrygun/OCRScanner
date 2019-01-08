/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

// ------------------------------------------------------------------------------------------
// Provides class sap.ui.generic.app.AppComponent for all generic app components
//
// This class is used by Component.js of all generated SmartTemplates Apps
// Therefore we need this empty stub because there is no central way to adapt the
// Component.js file of all generated SmartTemplate Apps.
// The implementation of the class is done in sap.suite.ui.generic.template.lib.AppComponent
// ------------------------------------------------------------------------------------------

// Cross-Dependency needed to effect a correct preloading of the library
sap.ui.getCore().loadLibrary("sap.suite.ui.generic.template");

sap.ui.define([
	"sap/suite/ui/generic/template/lib/AppComponent"
], function(AppComponent) {
	"use strict";

	return AppComponent;

},true);
