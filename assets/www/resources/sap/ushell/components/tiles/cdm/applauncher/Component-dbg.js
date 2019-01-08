// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
(function() {
    "use strict";
    /* global jQuery, sap */
    jQuery.sap.declare("sap.ushell.components.tiles.cdm.applauncher.Component");


    sap.ui.define([
        "sap/ui/core/UIComponent"
    ], function (UIComponent) {

        return UIComponent.extend("sap.ushell.components.tiles.cdm.applauncher.Component", {
            metadata : {},

            // create content
            createContent : function () {

                // take tile configuration from manifest - if exists
                // take tile personalization from component properties - if exists
                // merging the tile configuration and tile personalization
                var oComponentData = this.getComponentData();
                var oP13n = oComponentData.properties.tilePersonalization || {};

                // adding sap-system to configuration
                var oStartupParams = oComponentData.startupParameters;
                if (oStartupParams && oStartupParams["sap-system"]) {
                    //sap-system is always an array. we take the first value
                    oP13n["sap-system"] = oStartupParams["sap-system"][0];
                }

                var oTile = sap.ui.view({
                    type : sap.ui.core.mvc.ViewType.JS,
                    viewName : "sap.ushell.components.tiles.cdm.applauncher.StaticTile",
                    viewData: {
                        properties: oComponentData.properties,
                        configuration: oP13n
                    }
                });
                this._oController = oTile.getController();
                return oTile;
            },

            // interface to be provided by the tile
            tileSetVisualProperties : function (oNewVisualProperties) {
                if (this._oController) {
                    this._oController.updatePropertiesHandler(oNewVisualProperties);
                }
            },

            // interface to be provided by the tile
            tileRefresh : function () {
                // empty implementation. currently static tile has no need in referesh handler logic
            },

            // interface to be provided by the tile
            tileSetVisible : function (bIsVisible) {
              // empty implementation. currently static tile has no need in visibility handler logic
            },

            exit : function () {
                this._oController = null;
            }
        });
    });
}());

