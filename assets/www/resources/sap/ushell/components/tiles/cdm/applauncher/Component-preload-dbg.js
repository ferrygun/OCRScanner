jQuery.sap.registerPreloadedModules({
"name":"Component-preload",
"version":"2.0",
"modules":{
	"sap/ushell/components/tiles/cdm/applauncher/Component.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
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

},
	"sap/ushell/components/tiles/cdm/applauncher/StaticTile.controller.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define([
		'sap/ui/core/IconPool',
		'sap/ushell/components/tiles/utils',
		'sap/ushell/components/tiles/utilsRT'
	], function(IconPool, utils, utilsRT) {
	"use strict";

    /*global jQuery, sap, hasher, window */
    sap.ui.getCore().loadLibrary("sap.m");
    sap.ui.controller("sap.ushell.components.tiles.cdm.applauncher.StaticTile", {

        _getConfiguration: function() {
            var oViewData = this.getView().getViewData(), oConfig = {};
            oConfig.configuration = oViewData.configuration;
            oConfig.properties = oViewData.properties;

            // adding sap-system
            var sSystem = oConfig.configuration["sap-system"];
            var sTargetURL = oConfig.properties.targetURL;

            if (sTargetURL && sSystem) {
                // adjust the targetURL with the sap-system parameter
                sTargetURL += ((sTargetURL.indexOf("?") < 0) ? "?" : "&") + "sap-system=" + sSystem;
                oConfig.properties.targetURL = sTargetURL;
            }

            return oConfig;
        },

        onInit : function () {
            var oView = this.getView();
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(this._getConfiguration());

            // set model, add content
            oView.setModel(oModel);
        },

        // trigger to show the configuration UI if the tile is pressed in Admin mode
        onPress: function (oEvent) {
            if (oEvent.getSource().getScope && oEvent.getSource().getScope() === sap.m.GenericTileScope.Display) {
                var sTargetURL = this.getView().getModel().getProperty("/properties/targetURL");
                if (!sTargetURL) {
                    return;
                }

                if (sTargetURL[0] === '#') {
                    hasher.setHash(sTargetURL);
                } else {
                    window.open(sTargetURL, '_blank');
                }
            }
        },

        updatePropertiesHandler: function(oNewProperties) {

            var oPropertiesData = this.getView().getModel().getProperty("/properties");
            var bChanged = false;

            if (typeof oNewProperties.title !== 'undefined') {
                oPropertiesData.title = oNewProperties.title;
                bChanged = true;
            }
            if (typeof oNewProperties.subtitle !== 'undefined') {
                oPropertiesData.subtitle = oNewProperties.subtitle;
                bChanged = true;
            }
            if (typeof oNewProperties.icon !== 'undefined') {
                oPropertiesData.icon = oNewProperties.icon;
                bChanged = true;
            }
            if (typeof oNewProperties.targetURL !== 'undefined') {
                oPropertiesData.targetURL = oNewProperties.targetURL;
                bChanged = true;
            }
            if (typeof oNewProperties.info !== 'undefined') {
                oPropertiesData.info = oNewProperties.info;
                bChanged = true;
            }


            if (bChanged) {
                this.getView().getModel().setProperty("/properties", oPropertiesData);
            }
        }
    });


}, /* bExport= */ true);
},
	"sap/ushell/components/tiles/cdm/applauncher/StaticTile.view.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap */
    /*jslint nomen: true */

    sap.ui.jsview("sap.ushell.components.tiles.cdm.applauncher.StaticTile", {
        getControllerName: function () {
            return "sap.ushell.components.tiles.cdm.applauncher.StaticTile";
        },
        createContent: function (oController) {
            this.setHeight('100%');
            this.setWidth('100%');

            jQuery.sap.require('sap.m.GenericTile');
            jQuery.sap.require('sap.m.ImageContent');
            var oController = this.getController();

            return new sap.m.GenericTile({
                header: '{/properties/title}',
                subheader: '{/properties/subtitle}',
                size: 'Auto',
                tileContent: new sap.m.TileContent({
                    size: "Auto",
                    footer: '{/properties/info}',
                    content: new sap.m.ImageContent({
                        src: '{/properties/icon}',
                        width: "100%"
                    })
                }),

                press: [ oController.onPress, oController ]
            });
        }
    });


}, /* bExport= */ true);
},
	"sap/ushell/components/tiles/cdm/applauncher/i18n/i18n.properties":'\n#XTIT: Title of Static App Launcher\ntitle=Static App Launcher\n',
	"sap/ushell/components/tiles/cdm/applauncher/manifest.json":'{\n    "_version": "1.1.0",\n    "sap.flp": {\n        "type": "tile",\n        "tileSize": "1x1"\n    },\n    "sap.app": {\n        "id": "sap.ushell.components.tiles.cdm.applauncher",\n        "_version": "1.0.0",\n        "type": "component",\n        "applicationVersion": {\n            "version": "1.0.0"\n        },\n        "title": "{{title}}",\n        "description": "",\n        "tags": {\n            "keywords": []\n        },\n        "ach": "CA-FE-FLP-EU"\n    },\n    "sap.ui": {\n        "_version": "1.1.0",\n        "icons": {\n            "icon": ""\n        },\n        "deviceTypes": {\n            "desktop": true,\n            "tablet": true,\n            "phone": true\n        },\n        "supportedThemes": [\n            "sap_hcb",\n            "sap_belize",\n            "sap_belize_plus"\n        ]\n    },\n    "sap.ui5": {\n        "_version": "1.1.0",\n        "componentName": "sap.ushell.components.tiles.cdm.applauncher",\n        "dependencies": {\n            "minUI5Version": "1.42",\n            "libs": {\n                "sap.m": {}\n            }\n        },\n        "models": {\n            "i18n": {\n                "type": "sap.ui.model.resource.ResourceModel",\n                "uri": "i18n/i18n.properties"\n            }\n        },\n        "rootView": "sap.ushell.components.tiles.cdm.applauncher",\n        "handleValidation": false\n    }\n}'
}});
