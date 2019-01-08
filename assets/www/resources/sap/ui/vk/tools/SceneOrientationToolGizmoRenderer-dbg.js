/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([
	"jquery.sap.global"
], function(jQuery) {
	"use strict";

	/**
	 * SceneOrientationToolGizmoRenderer renderer.
	 * @namespace
	 * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
	 */
	var SceneOrientationToolGizmoRenderer = {};

	/**
	 * Renders the HTML for the given control, using the provided
	 * {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} rm 	the RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.ui.core.Control} control 	the control to be rendered
	 */
	SceneOrientationToolGizmoRenderer.render = function(rm, control) {

		rm.write("<div");
		rm.writeControlData(control);
		rm.addClass("sapUiVizKitSceneOrientationGizmo");
		rm.writeClasses();
		rm.write(">");
		rm.renderControl(control._button);
		rm.write("</div>");

	};

	return SceneOrientationToolGizmoRenderer;

}, /* bExport= */ true);
