/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define(function() {
	"use strict";

	/**
	 * @class RangeSliderVizFrame renderer.
	 * @static
	 */
	var RangeSliderRenderer = {
	};


	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered
	 */
	RangeSliderRenderer.render = function(oRm, oControl){		
		// write the HTML into the render manager
		oRm.write("<DIV");
		oRm.writeControlData(oControl);
	
		oRm.addClass("sapRangeSliderVizFrame");
		oRm.writeClasses();
		oRm.addStyle("width", oControl.getWidth());
		oRm.addStyle("height", oControl.getHeight());
		oRm.addStyle("position", "relative");
		oRm.writeStyles();	
		oRm.write(">");

        oRm.renderControl(oControl.getAggregation("_vizFrame"));
        oRm.renderControl(oControl.getAggregation("_rangeSlider"));
		oRm.write("</DIV>");
	};


	return RangeSliderRenderer;

}, /* bExport= */ true);
