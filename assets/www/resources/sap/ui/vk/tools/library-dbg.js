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
		name: "sap.ui.vk.tools",
		dependencies: [
			"sap.ui.core"
		],
		types: [
			"sap.ui.vk.tools.HitTestIdMode",
			"sap.ui.vk.tools.HitTestClickType",
			"sap.ui.vk.tools.CoordinateSystem",
			"sap.ui.vk.tools.PredefinedView"
		],
		interfaces: [],
		controls: [
			"sap.ui.vk.tools.MoveTool",
			"sap.ui.vk.tools.RotateTool",
			"sap.ui.vk.tools.ScaleTool",
			"sap.ui.vk.tools.TooltipTool",
			"sap.ui.vk.tools.SceneOrientationTool",
			"sap.ui.vk.tools.RotateOrbitTool",
			"sap.ui.vk.tools.RotateOrbitToolGizmo",
			"sap.ui.vk.tools.RotateTurntableTool",
			"sap.ui.vk.tools.RotateTurntableToolGizmo",
			"sap.ui.vk.tools.HitTestTool",
			"sap.ui.vk.tools.Tool"
		],
		elements: [
		],
		noLibraryCSS: true,
		version: "1.52.8"
	});

	/**
	 * Sets the expected schema for the extraction of ids for hit nodes .
	 * @enum {string}
	 * @readonly
	 * @public
	 */
	sap.ui.vk.tools.HitTestIdMode = {
		/**
		 * ThreeJS Id mode. HitTest result returns a threejs Id for the object
		 * @public
		 */
		ThreeJS: "ThreeJS",
		/**
		 * HitTest result and event extracts an id for hit nodes based on VE Cloud Service Data Model
		 * @public
		 */
		VEsID: "VEsID",
		/**
		 * HitTest will call an application supplied method to extract Id
		 * @public
		 */
		Callback: "Callback"
	};

	/**
	 * Sets the coordinate system type.
	 * @enum {string}
	 * @readonly
	 * @public
	 */
	sap.ui.vk.tools.CoordinateSystem = {
		/**
		 * Local coordinate system
		 * @public
		 */
		Local: "Local",
		/**
		 * World coordinate system
		 * @public
		 */
		World: "World",
		/**
		 * Screen coordinate system
		 * @public
		 */
		Screen: "Screen"
	};

	/**
	 * Sets the predefined view type.
	 * @enum {string}
	 * @readonly
	 * @public
	 */
	sap.ui.vk.tools.PredefinedView = {
		/**
		 * Home view
		 * @public
		 */
		Home: "Home",
		/**
		 * Front view
		 * @public
		 */
		Front: "Front",
		/**
		 * Back view
		 * @public
		 */
		Back: "Back",
		/**
		 * Left view
		 * @public
		 */
		Left: "Left",
		/**
		 * Right view
		 * @public
		 */
		Right: "Right",
		/**
		 * Top view
		 * @public
		 */
		Top: "Top",
		/**
		 * Bottom view
		 * @public
		 */
		Bottom: "Bottom"
	};

	/**
	 * Describes the type of click or tap event that triggered the hitTest.
	 * @enum {string}
	 * @readonly
	 * @public
	 */
	sap.ui.vk.tools.HitTestClickType = {
		/**
		 * Single click or tap event
		 * @public
		 */
		Single: "Single",
		/**
		 * Double click or tap
		 * @public
		 */
		Double: "Double",
		/**
		 * Right click or context event
		 * @public
		 */
		Context: "Context"
	};

	return sap.ui.vk.tools;
});
