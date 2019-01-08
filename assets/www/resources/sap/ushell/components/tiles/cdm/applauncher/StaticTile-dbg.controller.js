// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
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
