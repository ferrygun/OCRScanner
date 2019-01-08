jQuery.sap.declare("sap.zen.crosstab.DataCellRenderer");
jQuery.sap.require("sap.zen.crosstab.rendering.RenderingConstants");
jQuery.sap.require("sap.zen.crosstab.IDataCell");

/**
 * @class DataCell renderer.
 * @static
 */
sap.zen.crosstab.DataCellRenderer = {};

/**
 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
 * 
 * @param {sap.ui.core.RenderManager}
 *            oRenderManager the RenderManager that can be used for writing to the Render-Output-Buffer
 * @param {sap.ui.core.Control}
 *            oControl an object representation of the control that should be rendered
 */
sap.zen.crosstab.DataCellRenderer.render = function (oRenderManager, oControl) {
	"use strict";
	var oArea = oControl.getArea();
	var oCrosstab = oArea.getCrosstab();
	var fRenderCallback = oArea.getRenderCellCallback();
	var sRenderText = oControl.getText();
	var oAdditionalStyles = null;

	if (fRenderCallback) {
		var oCallbackResult = fRenderCallback(new sap.zen.crosstab.IDataCell(oControl));
		oAdditionalStyles = oCallbackResult.additionalStyles;
		sRenderText = oCallbackResult.renderText;
	}

	// convenience variable
	var rm = oRenderManager;

	// write the HTML into the render manager
	rm.write("<td");
	rm.writeControlData(oControl);

	var sCssClasses = oControl.getCssClassNames(oCrosstab.isIE8Mode(), oCrosstab.getPropertyBag().isRtl(), oCrosstab.getUtils().isMsIE());

	rm.writeAttribute("class", sCssClasses);

	rm.writeAttribute("tabindex", sap.zen.crosstab.rendering.RenderingConstants.TABINDEX);

	rm.write(">"); // SPAN element

	rm.write("<div");
	rm.writeAttribute("id", oControl.getId() + "_contentDiv");
	rm.writeAttribute("tabindex", sap.zen.crosstab.rendering.RenderingConstants.TABINDEX);

	var sClasses = "sapzencrosstab-DataCellContentDiv";
	if (oControl.isLoading()) {
		sClasses += " sapzencrosstab-LoadingCellContentDiv";
	}
	rm.writeAttribute("class", sClasses);

	if (oAdditionalStyles) {
		for ( var sStyleKey in oAdditionalStyles) {
			rm.addStyle(sStyleKey, oAdditionalStyles[sStyleKey]);
		}
	}
	rm.writeStyles();
	rm.write(">");

	rm.write(sRenderText);

	rm.write("</div>");

	rm.write("</td>");
};
