/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */
/*global jQuery, sap */
/**
 * Provides control sap.ushell.ui.shell.ShellNavigationMenu
 */
sap.ui.define(['jquery.sap.global', 'sap/ushell/library', 'sap/ui/layout/Grid'],
    function (jQuery) {
        "use strict";

        var NavigationMiniTile = sap.ui.core.Control.extend("sap.ushell.ui.shell.NavigationMiniTile",
            {
                metadata: {
                    properties: {
                        title: { type : "string", group : "Misc", defaultValue : null},
                        subtitle: { type : "string", group : "Misc", defaultValue : null},
                        icon: { type : "sap.ui.core.URI", group : "Appearance", defaultValue : null},
                        intent: { type : "string", group : "Misc", defaultValue : null}
                    },
                    aggregations : {
                    },
                    events: {
                        press: {}
                    }
                },

                renderer: {
                    render:  function (oRm, oControl) {

                        var sTitle = oControl.getTitle();
                        var sSubtitle = oControl.getSubtitle();
                        var sIcon = oControl.getIcon();
                        var oIcon = sap.ui.core.IconPool.createControlByURI(sIcon);

                        oRm.write('<div tabindex="-1" class="sapUshellNavMiniTile" ');
                        oRm.writeControlData(oControl);
                        oRm.writeAttributeEscaped("role", "option");
                        oRm.writeAttributeEscaped("aria-label", sSubtitle ? sTitle + " " + sSubtitle : sTitle);
                        oRm.write('>');

                        oRm.write('<div>');
                        oRm.write('<span class="sapUshellNavMiniTileTitle" >');
                        if (sTitle) {
                            oRm.writeEscaped(sTitle);
                        }
                        oRm.write('</span>');
                        oRm.write('</div>');

                        if (oIcon) {
                            oRm.write('<div>');
                            oRm.write('<span class="sapUshellNavMiniTileIcon">');
                            oRm.renderControl(oIcon);
                            oRm.write("</span>");
                            oRm.write('</div>');
                        } else {
                            oRm.write('<div>');
                            oRm.write('<span class="sapUshellNavMiniTileSubtitle" >');
                            if (sSubtitle) {
                                oRm.writeEscaped(sSubtitle);
                            }
                            oRm.write("</span>");
                            oRm.write('</div>');
                        }
                        oRm.write('</div>');
                    }
                }
            });


        NavigationMiniTile.prototype.ontap = function (e) {
            this.firePress({});
        };

        NavigationMiniTile.prototype.onsapenter = function (e) {
            this.firePress({});
        };

        NavigationMiniTile.prototype.onsapspace = function (e) {
            this.firePress({});
        };

        return NavigationMiniTile;
    }, true);
