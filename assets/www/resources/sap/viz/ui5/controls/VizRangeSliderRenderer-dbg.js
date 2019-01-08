/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/Renderer",
               "sap/m/RangeSliderRenderer",
               "sap/m/SliderRenderer",
               "sap/ui/Device"],
               function(renderer,
                       RangeRenderer,
                       SliderRenderer,
                       Device) {
	"use strict";

	/**
	 * @class Ct VizRangeSlider Renderer.
	 * @static
	 */

	var VizRangeSliderRenderer 	= renderer.extend(RangeRenderer);
	
	VizRangeSliderRenderer.render = function(oRm, oSlider) {
        var bEnabled = oSlider.getEnabled(),
            sTooltip = oSlider.getTooltip_AsString(),
            CSS_CLASS = SliderRenderer.CSS_CLASS;

        oRm.write("<div");
        this.addClass(oRm, oSlider);
        oRm.addClass("ui5-sap-viz-vizRangeSlider");
        if (!bEnabled) {
            oRm.addClass(CSS_CLASS + "Disabled");
        }

        oRm.writeClasses();
        oRm.addStyle("position", "absolute");
        oRm.addStyle("width", oSlider.getWidth());
        oRm.addStyle("height", oSlider.getHeight());
        oRm.addStyle("top", oSlider.getTop());
        oRm.addStyle("left", oSlider.getLeft());
        oRm.writeStyles();
        oRm.writeControlData(oSlider);

        if (sTooltip && oSlider.getShowHandleTooltip()) {
            oRm.writeAttributeEscaped("title", sTooltip);
        }

        oRm.write(">");
        this.renderMock(oRm, oSlider);
        oRm.write('<div');
        oRm.writeAttribute("id", oSlider.getId() + "-inner");
        this.addInnerClass(oRm, oSlider);

        if (!bEnabled) {
            oRm.addClass(CSS_CLASS + "InnerDisabled");
        }

        oRm.writeClasses();
        oRm.writeStyles();
        oRm.write(">");

        if (oSlider.getProgress()) {
            this.renderProgressIndicator(oRm, oSlider);
        }

        this.renderHandles(oRm, oSlider);
        oRm.write("</div>");

        if (oSlider.getEnableTickmarks()) {
            this.renderTickmarks(oRm, oSlider);
        } else {
            // Keep the "old" labels for backwards compatibility
            this.renderLabels(oRm, oSlider);
        }

        if (oSlider.getName()) {
            this.renderInput(oRm, oSlider);
        }

        oRm.write("</div>");
    };
 
 VizRangeSliderRenderer.renderMock = function(oRm, oSlider){
     var aRange = oSlider.getRange();   
     var max = oSlider.getMax();
     var min = oSlider.getMin();
     var minRange = Math.min(aRange[0], aRange[1]);
     var maxRange = Math.max(aRange[0], aRange[1]);

    
     oRm.write("<div");

     oRm.writeAttribute("id", oSlider.getId() + "-leftMock");
     oRm.addClass("ui5-sap-viz-vizSliderMock");
     oRm.addClass("ui5-sap-viz-vizSliderMock-left");
     oRm.writeClasses();
     oRm.addStyle("right", (max - minRange) * 100 / (max - min) + "%" );
     oRm.writeStyles();
     oRm.write('></div>');
     oRm.write("<div");

     oRm.writeAttribute("id", oSlider.getId() + "-rightMock");
     oRm.addClass("ui5-sap-viz-vizSliderMock");
     oRm.addClass("ui5-sap-viz-vizSliderMock-right");
     oRm.writeClasses();
     oRm.addStyle("left", (maxRange - min) * 100 / (max - min) + "%" );
     oRm.writeStyles();
     oRm.write('></div>');
     oRm.write("<div");


     oRm.writeAttribute("id", oSlider.getId() + "-label");
     oRm.addClass('ui5-sap-viz-vizSliderLabel');
     oRm.writeClasses();
     oRm.addStyle("left", (maxRange + minRange) * 50 / (maxRange - minRange) + "%" );
     if (!oSlider.getShowPercentageLabel()) {
         oRm.addStyle("visibility", "hidden");
     }
     oRm.writeStyles();
     oRm.write('>' + (maxRange - minRange) * 100 / (max - min) + '%</div>');
     
//   RangeRenderer.render.call(this, oRm, oSlider);
     

 };

    VizRangeSliderRenderer.renderHandle = function (oRM, oControl, mOptions) {
        var fValue,
            aRange = oControl.getRange(),
            bEnabled = oControl.getEnabled(),
            bRTL = sap.ui.getCore().getConfiguration().getRTL();

        oRM.write("<span");

        if (mOptions && (mOptions.id !== undefined)) {
            oRM.writeAttributeEscaped("id", mOptions.id);
        }
        if (mOptions && (mOptions.position !== undefined)) {
            fValue = aRange[mOptions.position === "start" ? 0 : 1];

            oRM.writeAttribute("data-range-val", mOptions.position);
            oRM.writeAttribute("aria-labelledby", oControl._mHandleTooltip[mOptions.position].label.getId());

            if (oControl.getInputsAsTooltips()) {
                oRM.writeAttribute("aria-controls", oControl._mHandleTooltip[mOptions.position].tooltip.getId());
            }
        }
        if (oControl.getShowHandleTooltip()) {
            this.writeHandleTooltip(oRM, oControl);
        }

        oRM.addClass(SliderRenderer.CSS_CLASS + "Handle");

        //extra classes for VizFrame slider handle
        //for cozy specification
        var deviceType;
        if ((!Device.system.desktop) && (Device.system.phone || Device.system.tablet)) {
            oRM.addClass('viz-Mobile');
        }
        //for icon
        oRM.addClass('sapUiIcon');
        oRM.addClass('ui5-sap-viz-vizSliderHandle');

        oRM.writeAttribute("data-sap-ui-icon-content", '&#xe1fa');

        //style difference of handles includes border and left&right
        if (mOptions && (mOptions.id !== undefined) && mOptions.id === (oControl.getId() + "-handle1")) {
            oRM.addClass('ui5-sap-viz-vizSliderHandle-left');
            oRM.addStyle(bRTL ? "right" : "left", aRange[0]);
        }
        if (mOptions && (mOptions.id !== undefined) && mOptions.id === (oControl.getId() + "-handle2")) {
            oRM.addClass('ui5-sap-viz-vizSliderHandle-right');
            oRM.addStyle(bRTL ? "right" : "left", aRange[1]);
        }

        this.writeAccessibilityState(oRM, oControl, fValue);
        oRM.writeClasses();
        oRM.writeStyles();

        if (bEnabled) {
            oRM.writeAttribute("tabindex", "0");
        }
        oRM.write("></span>");
    };

    VizRangeSliderRenderer.renderTooltip = function(oRM, oControl, bInput, sPosition){

            oRM.write("<span");
            oRM.addClass(SliderRenderer.CSS_CLASS + "HandleTooltip");
            if (!oControl.getShowStartEndLabel()) {
                oRM.addStyle("visibility", "hidden");
            }
            oRM.addStyle("width", oControl._iLongestRangeTextWidth + "px");
            oRM.writeAttribute("id", oControl.getId() + "-" + sPosition + "Tooltip");

            oRM.writeClasses();
            oRM.writeStyles();
            oRM.write(">");
            oRM.write("</span>");
    };
	return VizRangeSliderRenderer;

}, /* bExport= */ true);
