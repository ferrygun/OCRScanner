/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define(['jquery.sap.global', 'sap/ui/core/Renderer', 'sap/ui/core/IconPool', 'sap/ui/core/ValueState'],
	function(jQuery, Renderer, IconPool, ValueState) {
		"use strict";

		//initialize the Icon Pool
		IconPool.insertFontFaceStyle();

		var FieldRenderer = Renderer.extend("sap.ui.mdc.experimental.FieldRenderer");

		FieldRenderer.render = function(oRm, oField) {
			var control = {
				content: oField._getContent(),
				editMode: oField.getEditMode(),
				width: oField.getWidth(),
				valueState: oField.getValueState()
			};

			oRm.write("<div");
			oRm.writeControlData(oField);
			oRm.addClass("sapUiMdcBaseField");

			if (control.width) {
				if (control.width === "content") {
					oRm.addStyle("width", "auto");
				} else {
					oRm.addStyle("width", control.width);
				}
			}
			oRm.writeStyles();
			oRm.writeClasses();
			oRm.write(">");

			if (control.content) {
				oRm.renderControl(control.content);
			}

			oRm.write("</div>");

		};


		return FieldRenderer;

	}, /* bExport= */ true);