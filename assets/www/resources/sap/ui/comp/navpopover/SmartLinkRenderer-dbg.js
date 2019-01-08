/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides control sap.ui.comp.navpopover.SmartLink.
sap.ui.define([
	'jquery.sap.global', 'sap/ui/core/Renderer', 'sap/m/LinkRenderer'
], function(jQuery, Renderer, LinkRenderer) {
	"use strict";

	var SmartLinkRenderer = Renderer.extend(LinkRenderer);

	SmartLinkRenderer.render = function(oRm, oControl) {
		var bRenderLink = true;

		if (oControl.getIgnoreLinkRendering()) {
			var oReplaceControl = oControl._getInnerControl();
			if (oReplaceControl) {
				oRm.write("<div");
				oRm.writeControlData(oControl);
				oRm.writeClasses();
				oRm.write(">");

				oRm.renderControl(oReplaceControl);

				oRm.write("</div>");

				bRenderLink = false;
			}
		}

		if (bRenderLink) {
			LinkRenderer.render.apply(this, arguments);
		}
	};

	SmartLinkRenderer.writeText = function(oRm, oControl) {
		if (!oControl.getUom()) {
			oRm.writeEscaped(oControl.getText());
			return;
		}
		oRm.write("<span>" + jQuery.sap.encodeHTML(oControl.getText()) + "</span><span style='display:inline-block;min-width:2.5em;width:3.0em;text-align:start'>" + jQuery.sap.encodeHTML(oControl.getUom()) + "</span>");
	};

	return SmartLinkRenderer;

}, /* bExport= */true);
