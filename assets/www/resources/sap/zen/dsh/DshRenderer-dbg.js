jQuery.sap.declare("sap.zen.dsh.DshRenderer");

/**
 * @class dsh renderer. 
 * @static
 */
sap.zen.dsh.DshRenderer = {
};


/**
 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
 * 
 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
 * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered
 */
sap.zen.dsh.DshRenderer.render = function(oRm, oControl){ 
	 // write the HTML into the render manager
	 oRm.write("<div");
	 oRm.writeControlData(oControl);
	 
	 oRm.addStyle("width", oControl.getWidth());
	 oRm.addStyle("height", oControl.getHeight());
		
	 oRm.addClass("sapZenDshDsh");
	 
	 oRm.writeStyles();
	 oRm.writeClasses();

	 oRm.write(">"); // 
	 
	 oRm.write("<div id=\"" + oControl.getId() + "sapbi_snippet_ROOT\" ");
	 oRm.write("style=\"");
	 oRm.write("width:100%;");
	 oRm.write("height:100%;");	 
	 oRm.write("\">");
	 oRm.write("</div>");
	 
	 oRm.write("</div>");
};
