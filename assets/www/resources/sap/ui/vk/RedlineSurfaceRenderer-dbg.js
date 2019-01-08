/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([
	"jquery.sap.global"
], function(jQuery) {
	"use strict";

	/**
	 * RedlineSurface renderer.
	 * @namespace
	 */
	var RedlineSurfaceRenderer = {};

	RedlineSurfaceRenderer.render = function(rm, control) {
		rm.write("<svg");
		rm.writeControlData(control);
		rm.addClass("sapUiVizkitRedlineSurface");
		rm.writeClasses();
		rm.write(">");

		control.getRedlineElements().forEach(function(redlineElement) {
			redlineElement.render(rm);
		});

		this.renderAfterRedlineElements(rm, control);

		rm.write("</svg>");
	};

	RedlineSurfaceRenderer.renderAfterRedlineElements = function(rm, control) {

	};

	return RedlineSurfaceRenderer;

}, true);
