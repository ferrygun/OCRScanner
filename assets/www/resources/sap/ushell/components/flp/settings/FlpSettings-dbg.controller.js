// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("sap.ushell.components.flp.settings.FlpSettings", {

        /* enum */ DISPLAY_MODES: { 
            'scroll': 0, 'tabs': 1,
        
            getName: function (iValue) {
                return Object.keys(this)[iValue];
            }
        },

        onInit: function () {
            // Set configuration.
            this.oConfModel = new sap.ui.model.json.JSONModel({});

            this.oConfModel.setData({
                isRTL: sap.ui.getCore().getConfiguration().getRTL(),
                flexAlignItems: sap.ui.Device.system.phone ? 'Stretch' : 'Start',
                textAlign: sap.ui.Device.system.phone ? 'Begin' : 'End',
                textDirection: sap.ui.Device.system.phone ? 'Column' : 'Row',
                labelWidth: sap.ui.Device.system.phone ? "auto" : "12rem"
            });

            this.getView().setModel(this.oConfModel, "config");

            // Set translation.
            var oResourceModel = new sap.ui.model.resource.ResourceModel({
                bundleUrl: jQuery.sap.getModulePath(
                    "sap.ushell.renderers.fiori2.resources.resources",
                    ".properties"
                )
            });

            this.getView().setModel(oResourceModel, "i18n");

            // Set initial group display mode.
            var initModeName = this.getView().getViewData().initialDisplayMode;
            this.iCurrentMode = this.DISPLAY_MODES[initModeName] || this.DISPLAY_MODES.scroll;
        },

        onBeforeRendering: function () {
            this.oConfModel.setProperty("/displayMode", this.iCurrentMode);
        },

        onSave: function() {
            this.iCurrentMode = this.oConfModel.getProperty("/displayMode");
            return this.DISPLAY_MODES.getName(this.iCurrentMode);
        }
    });
});

