/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

sap.ui.define([], function () {
	"use strict";

	/**
	 * Cell renderer.
	 * @namespace
	 */
	var CellRenderer = {};
	
	CellRenderer.render = function(oRenderManager, oControl) {
		var oContentToRender = oControl.getContentToRender();
		oRenderManager.write("<div"); //BCP: 1670160448 div place holder for DOM reference
		oRenderManager.writeControlData(oControl);
		oRenderManager.write(">");
		if (oContentToRender){
			oRenderManager.renderControl(oContentToRender);
		}
		oRenderManager.write("</div>");
	};

	return CellRenderer;
}, /* bExport= */ true);
