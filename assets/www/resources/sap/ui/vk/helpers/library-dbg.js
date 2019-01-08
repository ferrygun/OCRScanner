/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

/* global escape */

/**
 * Initialization Code and shared classes of library sap.suite.ui.generic.template.
 */
sap.ui.define([
	"jquery.sap.global"
], function(jQuery) {
	"use strict";

	/**
	 * SAPUI5 library with controls for displaying 3D models.
	 *
	 * @namespace
	 * @name sap.ui.vk
	 * @author SAP SE
	 * @version 1.52.8
	 * @public
	 */

	// Delegate further initialization of this library to the Core.
	sap.ui.getCore().initLibrary({
		name: "sap.ui.vk.helpers",
		dependencies: [
			"sap.ui.core"
		],
		types: [
		],
		interfaces: [],
		controls: [
            "sap.ui.vk.helpers.RotateOrbitHelperDvl",
            "sap.ui.vk.helpers.RotateTurntableHelperDvl",
			"sap.ui.vk.helpers.RotateOrbitHelperThree",
			"sap.ui.vk.helpers.CameraControllerThree"
		],
		elements: [
		],
		noLibraryCSS: false,
		version: "1.52.8"
	});

	return sap.ui.vk.helpers;
});
