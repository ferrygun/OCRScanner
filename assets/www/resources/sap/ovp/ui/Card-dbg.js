/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */

/*global sap window*/

sap.ui.define([
	"sap/ui/core/Control"
], function (Control) {
	"use strict";
	return Control.extend("sap.ovp.ui.Card", {
		metadata : {
			library : "sap.ovp",
            designTime: false,
			aggregations : {
                innerCard: {type: "sap.ui.core.Control", multiple: false}
            },
            defaultAggregation: "innerCard"
		},
		init : function () {
		},
		renderer : function (oRM, oControl) {
			oRM.write("<div");
			oRM.writeControlData(oControl);
            oRM.addClass("sapOvpBaseCardWrapper");
            oRM.writeClasses();
			oRM.write(">");
            oRM.renderControl(oControl.getAggregation("innerCard"));
			oRM.write("</div>");
		}
	});
}, true);