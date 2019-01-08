/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5) (c) Copyright 2009-2012 SAP AG. All rights reserved
 */

sap.ui.define(function() {
	"use strict";

	/**
	 * @class VBI renderer.
	 * @static
	 */
	var VBIRenderer = {};

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 * 
	 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered
	 */
	VBIRenderer.render = function(oRm, oControl) {
		// console.log( "sap.ui.vbm.VBIRenderer.render.....\r\n");

		// write the HTML into the render manager
		oRm.write("<div");
		oRm.writeControlData(oControl);
		oRm.addClass("vbi-main");
		oRm.writeClasses(oControl);
		oRm.addStyle("width", oControl.getWidth());
		oRm.addStyle("height", oControl.getHeight());

		oRm.writeStyles();
		oRm.write(">"); // span element

		var id = oControl.getId();
		
		if (oControl.getPlugin()) {

			if (oControl.$oldContent.length === 0) {
				// for IE 11 do the regexp test........................................//
				if ((navigator.appName == "Microsoft Internet Explorer") || /(trident)\/[\w.]+;.*rv:([\w.]+)/i.test(navigator.userAgent)) {
					// write the object tag
					oRm.write("<object id='VBI" + id + "'" + " data-sap-ui-preserve='" + id + "' CLASSID='CLSID:00100000-2011-0070-2000-FC7214A1CD7B' " + "width='" + oControl.getWidth() + "' " + "height='" + oControl.getHeight() + "' " +

					">");

					// set a link to the native installer...............................//
					oRm.write("<a href='http://scn.sap.com/community/visual-business' > Get the Visual Business PlugIn.</a>");

					oRm.write("</object>");

				} else {
					// write the embed tag
					oRm.write("<embed id='VBI" + id + "'" + " data-sap-ui-preserve='" + id + "' type='application/x-visualbusiness' " + "width='" + oControl.getWidth() + "' " + "height='" + oControl.getHeight() + "' " + ">");

				}
				// render the information for using the native plugin
			}
		}
		
		oRm.write("<div class='vbi-hidden'>");
			this.renderDependants(oRm, oControl.m_renderList);
		oRm.write("</div>");
		oControl.m_renderList = [];

		oRm.write("</div>");

		// the config is not loaded here any more, due the set config will be.....//
		// called, then queueing or execution will take place.....................//
	};
	
	VBIRenderer.renderDependants = function(oRm, aList) {
		for (var i = 0, oEntry; i < aList.length; ++i) {
			oEntry = aList[i];
			// If the container item already exists, we do not render it anymore
			// We need to find a better solution because the real problem
			// is the fact that we fire the container creation event twice.
			if (!oEntry.control.getDomRef()) {
				oRm.write("<div data='" + oEntry.data + "'>");
				oRm.renderControl(oEntry.control);
				oRm.write("</div>");
			}
		} 
	};

	return VBIRenderer;

}, /* bExport= */true);
