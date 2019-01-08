// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap */
    /*jslint nomen: true */

    sap.ui.jsview("sap.ushell.components.tiles.applauncher.StaticTile", {
        getControllerName: function () {
            return "sap.ushell.components.tiles.applauncher.StaticTile";
        },
        createContent: function (oController) {
            this.setHeight('100%');
            this.setWidth('100%');
        },
        getTileControl: function() {
            jQuery.sap.require('sap.m.GenericTile');
            jQuery.sap.require('sap.m.ImageContent');
            var oController = this.getController();

            return new sap.m.GenericTile({
                //TODO - Change display_mode to the right parameter
                mode: '{/config/display_mode}' ? '{/config/display_mode}' : sap.m.GenericTileMode.ContentMode,
                header: '{/config/display_title_text}',
                subheader: '{/config/display_subtitle_text}',
                size: "Auto",
                tileContent: new sap.m.TileContent({
                    size: "Auto",
                    footer: '{/config/display_info_text}',
                    content: new sap.m.ImageContent({
                        src: '{/config/display_icon_url}',
                        width: "100%"
                    })
                }),
                press: [ oController.onPress, oController ]
            });
        },
        getLinkControl: function() {
           jQuery.sap.require('sap.m.Link');
           return new sap.m.Link({
               text: "{/config/display_title_text}",
               href: "{/nav/navigation_target_url}",
               //set target formatter so external links would be opened in a new tab
               target: {
                   path: "/nav/navigation_target_url",
                   formatter: function(sUrl){
                       if (sUrl && sUrl[0] !== '#'){
                           return "_blank";
                       }
                   }
               }
           });
        }
    });


}, /* bExport= */ false);
