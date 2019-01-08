// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/*global jQuery, sap*/
/**
 * @class AnchorItem renderer.
 * @static
 *
 * @private
 */

sap.ui.define(['sap/ui/core/Control','sap/ushell/resources'],
	function(Control, resources) {
	"use strict";

    var AppBoxRenderer = sap.ui.core.Renderer.extend(Control);
    AppBoxRenderer.render = function (rm, oAppBox) {
        var oCatalogContainer = oAppBox.getParent(),
            oAppBoxes = oCatalogContainer.getAppBoxesContainer ? oCatalogContainer.getAppBoxesContainer() : [],
            oVisibleAppBoxes = oAppBoxes.filter(function (oAppBox) {
                return oAppBox.getVisible();
            }),
            iCurrentItemIndex = oVisibleAppBoxes.indexOf(oAppBox) > -1 ? oVisibleAppBoxes.indexOf(oAppBox) + 1 : "",
            sAriaLabelText = oAppBox.getTitle();

        sAriaLabelText = oAppBox.getSubtitle() ? sAriaLabelText + " " + oAppBox.getSubtitle() : sAriaLabelText;
        var sNavigaitonMode = oAppBox.getNavigationMode();
        if(sNavigaitonMode){
            sAriaLabelText = sap.ushell.resources.i18n.getText(sNavigaitonMode + "NavigationMode") + " " + sAriaLabelText;
        }
        rm.write("<li");
        rm.writeControlData(oAppBox);
        rm.addClass("sapUshellAppBox");
        rm.writeAccessibilityState(oAppBox, {role: "option", posinset : iCurrentItemIndex, setsize : oVisibleAppBoxes.length});
        rm.writeAttribute("aria-label", sAriaLabelText);
        rm.writeAttribute("aria-describedby", oAppBox.getParent().getId() + "-groupheader");
        rm.writeClasses();
        rm.write(">");
        rm.write("<div");
        rm.addClass("sapUshellAppBoxInner");
        rm.writeClasses();
        rm.write(">");

        // icon
        var bHasIcon = oAppBox.getIcon();
        if (bHasIcon) {
            var oIcon = new sap.ui.core.Icon({src: oAppBox.getIcon()});
            oIcon.addStyleClass("sapUshellAppBoxIcon");
            rm.renderControl(oIcon);
        }

        rm.write("<div");
        if (bHasIcon) {
            rm.addClass("sapUshellAppBoxHeader");
        } else {
            rm.addClass("sapUshellAppBoxHeaderNoIcon");
        }
        rm.writeClasses();
        rm.write(">");

        // title
        rm.write("<div");
        rm.addClass("sapUshellAppBoxTitle");
        rm.writeClasses();
        rm.write(">");
        rm.writeEscaped(oAppBox.getTitle());
        rm.write("</div>");

        // subtitle
        if (oAppBox.getSubtitle()) {
            rm.write("<div");
            rm.addClass("sapUshellAppBoxSubtitle");
            rm.writeClasses();
            rm.write(">");
            rm.writeEscaped(oAppBox.getSubtitle());
            rm.write("</div>");
        }

        rm.write("</div>");
        rm.write("</div>");

        rm.write("<div");
        rm.addClass("sapUshellAppBoxActionsArea");
        rm.writeClasses();
        if(oAppBox.getTitle) {
            rm.writeAccessibilityState(oAppBox, {role: "toolbar", label: oAppBox.getTitle()});
        }
        rm.write(">");

        rm.renderControl(oAppBox.getPinButton());

        rm.write("</div>");
        rm.write("</li>");

    };


	return AppBoxRenderer;

}, /* bExport= */ true);
