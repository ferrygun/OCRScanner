/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([
	"jquery.sap.global", "./RedlineSurfaceRenderer", "sap/ui/core/Renderer"
], function(jQuery, RedlineSurfaceRenderer, Renderer) {
	"use strict";

	/**
	 * RedlineDesign renderer.
	 * @namespace
	 */
	var RedlineDesignRenderer = Renderer.extend(RedlineSurfaceRenderer);

	RedlineDesignRenderer.render = function(rm, control) {
		RedlineSurfaceRenderer.render.call(this, rm, control);
	};

	RedlineDesignRenderer.renderAfterRedlineElements = function(rm, control) {
		if (control._activeElementInstance && control._getIsDrawingOn()) {
			control._activeElementInstance.render(rm);
		}
	};

	return RedlineDesignRenderer;

}, true);
