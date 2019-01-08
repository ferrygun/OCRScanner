// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(['sap/m/Label','sap/ushell/resources','sap/ushell/services/Container'],
	function(Label, resources, Container) {
	"use strict";

    /*global jQuery, sap, document, self */
    /*jslint plusplus: true, nomen: true, vars: true */

    sap.ui.jsview("sap.ushell.renderers.fiori2.usageAnalytics_selector.UsageAnalyticsSelector", {

        createContent: function (oController) {
            var sFBoxAlignItems = sap.ui.Device.system.phone ? 'Start' : 'Center',
                sFlexWrap = sap.ui.Device.system.phone ? 'Wrap' : 'NoWrap',
                sFBoxDirection = sap.ui.Device.system.phone ? 'Column' : 'Row',
                sTextAlign = sap.ui.Device.system.phone ? 'Left' : 'Right',
                sAllignSelf = sap.ui.Device.system.phone ? 'Baseline' : 'Auto',
                sWidth = sap.ui.Device.system.phone ? 'auto' : '11.75rem';

            this.oLabel = new Label({
                width: sWidth,
                textAlign: sTextAlign,
                text: resources.i18n.getText("allowTracking") + ":"
            }).addStyleClass('sapUshellUsageAnalyticsSelectorLabel');

            this.oSwitchButton = new sap.m.Switch("usageAnalyticsSwitchButton", {
                type: sap.m.SwitchType.Default
            }).addStyleClass('sapUshellUsageAnalyticsSelectorSwitchButton');

            this.oMessage = new sap.m.Text({
                text: sap.ushell.Container.getService("UsageAnalytics").getLegalText()
            }).addStyleClass('sapUshellUsageAnalyticsSelectorLegalTextMessage');

            this.fBox = new sap.m.HBox({
                alignItems: sFBoxAlignItems,
                wrap: sFlexWrap,
                direction: sFBoxDirection,
                height : "2rem",
                items: [
                    this.oLabel,
                    this.oSwitchButton
                ],
                layoutData : new sap.m.FlexItemData({alignSelf: sAllignSelf})
            });

            this.vBox = new sap.m.VBox({
                items: [this.fBox, this.oMessage]
            });

            return this.vBox;
        },

        getControllerName: function () {
            return "sap.ushell.renderers.fiori2.usageAnalytics_selector.UsageAnalyticsSelector";
        }
    });


}, /* bExport= */ true);
