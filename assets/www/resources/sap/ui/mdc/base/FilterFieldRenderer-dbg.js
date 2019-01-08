/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define(['jquery.sap.global', 'sap/ui/core/Renderer', 'sap/ui/core/IconPool'],
	function(jQuery, Renderer, IconPool) {
		"use strict";

		//initialize the Icon Pool
		IconPool.insertFontFaceStyle();

		var FilterFieldRenderer = Renderer.extend("sap.ui.mdc.base.FilterFieldRenderer");

		FilterFieldRenderer.render = function(oRm, oControl) {
			var control = {
				content: oControl.getContent(),
				editable: oControl.getEditable()
			};

			oRm.write("<div");
			oRm.writeControlData(oControl);
			oRm.addClass("sapUiMdcBaseFilterField");
			oRm.writeClasses();
			oRm.addStyle("display", "inline-block");
			oRm.addStyle("width", oControl.getWidth());
			oRm.writeStyles();
			oRm.write(">");

			if (control.content) {
				oRm.renderControl(control.content);
			}
			oRm.write("</div>");
		};

		return FilterFieldRenderer;

	}, /* bExport= */ true);