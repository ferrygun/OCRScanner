/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([
	"./ContainerBaseRenderer", "sap/ui/core/Renderer", "sap/ui/Device"
], function(BaseContainerRenderer, Renderer, Device) {
	"use strict";

	/*
	 * @class MapContainer renderer. @static
	 */
	var MapContainerRenderer = Renderer.extend(BaseContainerRenderer);

	MapContainerRenderer.render = function(oRm, oControl) {
		oControl.addStyleClass("sapUiVkMapContainer");
		BaseContainerRenderer.render.apply(this, arguments);
	};

	MapContainerRenderer.writeToolbarArea = function(oRm, oControl) {
		oRm.write("<div");
		oRm.addClass("sapUiVkMapContainerOverlay");
		oRm.writeClasses();
		oRm.write(">");

		if (oControl.getShowNavbar()) {
			oRm.write("<div");
			oRm.addClass("sapUiVkMapContainerNavbarArea");
			oRm.writeClasses();
			oRm.write(">");

			// navbar
			if (oControl.getShowMapLayer() && oControl._shouldRenderMapLayerSwitch) {
				oRm.renderControl(oControl._currentText);
				oRm.renderControl(oControl._selectionMap);
			}

			oRm.write("<div");
			oRm.addClass("sapUiVkMapContainerNavbarContainer");
			oRm.writeClasses();
			oRm.write(">");
			oRm.renderControl(oControl._oNavbar);
			oRm.write("</div>");// end navbar
			oRm.write("</div>");// end navbar
		}

		// list panel
		if (!Device.system.phone && oControl._shouldRenderListPanel) {
			oControl._oScrollCont.addStyleClass("sapUiVkMapContainerListPanelArea");
			oRm.renderControl(oControl._oScrollCont);
		}

		BaseContainerRenderer.writeToolbarArea(oRm, oControl);

		oRm.write("</div>");// end map overlay

		if (Device.system.phone) {
			oRm.write("<div id=" + oControl.getId() + "-LPW");
			oRm.addClass("sapUiVkMapContainerLPW");
			oRm.writeClasses();
			oRm.write(">");
			// close button
			oRm.renderControl(oControl._oMenuCloseButton);
			// list panel
			oControl._oScrollCont.addStyleClass("sapUiVkMapContainerListPanelArea");
			oRm.renderControl(oControl._oScrollCont);
			oRm.write("</div>");// end list panel container
		}
	};

	return MapContainerRenderer;

}, /* bExport= */true);
