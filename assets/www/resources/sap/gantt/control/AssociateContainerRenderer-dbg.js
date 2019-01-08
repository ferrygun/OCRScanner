/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([], function () {
	"use strict";

	var AssociateContainerRenderer = {};

	AssociateContainerRenderer.render = function(oRenderManager, oControl) {
		
		if (oControl.getEnableRootDiv()) {
			oRenderManager.write("<div");
			oRenderManager.writeControlData(oControl);
			oRenderManager.addClass("sapGanttChartLayoutBG");
			oRenderManager.writeClasses();
			oRenderManager.addStyle("width", "100%");
			oRenderManager.addStyle("height", "100%");
			oRenderManager.addStyle("overFlow", "hidden");
			oRenderManager.writeStyles();
			oRenderManager.write(">");
		}
		oRenderManager.renderControl(sap.ui.getCore().byId(oControl.getContent()));
		if (oControl.getEnableRootDiv()) {
			oRenderManager.write("</div>");
		}
	};

	return AssociateContainerRenderer;
}, /* bExport= */ true);