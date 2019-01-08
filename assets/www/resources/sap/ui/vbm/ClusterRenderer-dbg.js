/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5) (c) Copyright 2009-2012 SAP AG. All rights reserved
 */

sap.ui.define(function() {
	"use strict";

	/**
	 * @class Cluster renderer.
	 * @static
	 */
	var ClusterRenderer = {};

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 * 
	 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered
	 */
	ClusterRenderer.render = function(oRm, oControl) {

		// write the HTML into the render manager
		oRm.write("<div align='center'");
		oRm.writeControlData(oControl);
		oRm.addClass("sapUiVbicluster-main");
		oRm.writeClasses(oControl);

		oRm.writeStyles();
		oRm.write(">"); // span element

		var Id1 = oControl.getId() + "-" + "backgroundcircle";
		var Id2 = Id1 + "-" + "innercircle";

		var col = oControl.getColor();
		var type = oControl.getType();
		sap.ui.core.IconPool.insertFontFaceStyle();
		var iiconVal = oControl.getIcon();
		var icon, icInfo;
		if (iiconVal) {
			icInfo = sap.ui.core.IconPool.getIconInfo(iiconVal);
		} else if (type == sap.ui.vbm.SemanticType.Error) {
			icInfo = sap.ui.core.IconPool.getIconInfo("status-negative");
		} else if (type == sap.ui.vbm.SemanticType.Warning) {
			icInfo = sap.ui.core.IconPool.getIconInfo("status-critical");
		} else if (type == sap.ui.vbm.SemanticType.Success) {
			icInfo = sap.ui.core.IconPool.getIconInfo("status-positive");
		} else {
			icInfo = sap.ui.core.IconPool.getIconInfo("status-inactive");
		}

		if (icInfo) {
			icon = icInfo.content;
		}
		var classOuter, classInner, classTextbox, classIcon;
		if (type == sap.ui.vbm.SemanticType.Error) {
			classOuter = "class = 'sapUiVbicluster-backgroundcircle sapUiVbicluster-border-error'";
			classInner = "class = 'sapUiVbicluster-innercircle sapUiVbicluster-background-error'";
			classIcon = "class = 'sapUiVbicluster-icon sapUiVbicluster-iconLight'";
			classTextbox = "class = 'sapUiVbicluster-textbox sapUiVbicluster-textbox-error'";
		} else if (type == sap.ui.vbm.SemanticType.Warning) {
			classOuter = "class = 'sapUiVbicluster-backgroundcircle sapUiVbicluster-border-warning'";
			classInner = "class = 'sapUiVbicluster-innercircle sapUiVbicluster-background-warning'";
			classIcon = "class = 'sapUiVbicluster-icon sapUiVbicluster-iconLight'";
			classTextbox = "class = 'sapUiVbicluster-textbox sapUiVbicluster-textbox-warning'";
		} else if (type == sap.ui.vbm.SemanticType.Success) {
			classOuter = "class = 'sapUiVbicluster-backgroundcircle sapUiVbicluster-border-success'";
			classInner = "class = 'sapUiVbicluster-innercircle sapUiVbicluster-background-success sapUiVbicluster-inner-light'";
			classIcon = "class = 'sapUiVbicluster-icon sapUiVbicluster-iconSuccess'";
			classTextbox = "class = 'sapUiVbicluster-textbox sapUiVbicluster-textbox-success'";
		} else if (type == sap.ui.vbm.SemanticType.None && col) {
			// not type but color
			classOuter = "class = 'sapUiVbicluster-backgroundcircle' style = 'border-color: " + col + "'";
			classInner = "class = 'sapUiVbicluster-innercircle sapUiVbicluster-inner-light' style = 'border-color: " + col + "'";
			classIcon = "class = 'sapUiVbicluster-icon' style = 'color: " + col + "'";
			classTextbox = "class = 'sapUiVbicluster-textbox' style = 'border-color: " + col + "'";
		} else {
			classOuter = "class = 'sapUiVbicluster-backgroundcircle sapUiVbicluster-border-default'";
			classInner = "class = 'sapUiVbicluster-innercircle sapUiVbicluster-background-default sapUiVbicluster-inner-light'";
			classIcon = "class = 'sapUiVbicluster-icon sapUiVbicluster-iconDefault'";
			classTextbox = "class = 'sapUiVbicluster-textbox sapUiVbicluster-textbox-default'";
		}

		oRm.write("<div id= " + Id1 + " " + classOuter + ">");
		oRm.write("<div id= " + Id2 + " " + classInner + ">");

		if (icon) {
			var IdIcon = oControl.getId() + "-" + "icon";
			oRm.write("<span id= " + IdIcon + " " + classIcon + ">" + icon);
			oRm.write("</span>");
		}

		oRm.write("</div>"); // end of cluster-innercircle
		if ((oControl.getText())) {
			var IdTextbox = oControl.getId() + "-" + "textbox";
			oRm.write("<div id= " + IdTextbox + " " + classTextbox + ">");
			oRm.write("<div>");
			oRm.writeEscaped(oControl.getText());
			oRm.write("</div>");
			oRm.write("</div>");
		}
		oRm.write("</div>"); // end of cluster-backgroundcircle
		oRm.write("</div>");

	};

	return ClusterRenderer;

}, /* bExport= */true);
