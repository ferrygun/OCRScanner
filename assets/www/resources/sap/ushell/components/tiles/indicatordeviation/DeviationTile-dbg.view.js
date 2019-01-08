//Copyright (c) 2009-2017 SAP SE, All Rights Reserved

(function () {
    "use strict";
    /*global jQuery, sap */
    /*jslint nomen: true */

    jQuery.sap.require("sap.ushell.components.tiles.indicatorTileUtils.smartBusinessUtil");
    jQuery.sap.require("sap.ui.model.analytics.odata4analytics");
    sap.ui.getCore().loadLibrary("sap.suite.ui.commons");

    sap.ui.jsview("sap.ushell.components.tiles.indicatordeviation.DeviationTile", {
        getControllerName: function () {
            return "sap.ushell.components.tiles.indicatordeviation.DeviationTile";
        },
        createContent: function (oController) {
            this.setHeight('100%');
            this.setWidth('100%');
            //var preview = this.getViewData().chip.preview;
            var header = "Lorem ipsum";
            var subheader =  "Lorem ipsum";
            var titleObj = sap.ushell.components.tiles.indicatorTileUtils.util.getTileTitleSubtitle(this.getViewData().chip);
            if (titleObj.title && titleObj.subTitle){
                header = titleObj.title;
                subheader = titleObj.subTitle;
            }
            var deviationTileData = {
                    subheader : subheader,
                    header : header,
                    footerNum : "",
                    footerComp : "",
                    frameType:"OneByOne",
                    state: sap.m.LoadState.Loading,
                    scale: ""
//                      actual: { value: 120, color: sap.suite.ui.commons.InfoTileValueColor.Good},
//                      targetValue: 100,
//                      thresholds: [
//                      { value: 0, color: sap.suite.ui.commons.InfoTileValueColor.Error },
//                      { value: 50, color: sap.suite.ui.commons.InfoTileValueColor.Critical },
//                      { value: 150, color: sap.suite.ui.commons.InfoTileValueColor.Critical },
//                      { value: 200, color: sap.suite.ui.commons.InfoTileValueColor.Error }
//                      ],
//                      showActualValue: true,
//                      showTargetValue: true
            };

            var oBCDataTmpl =  new sap.suite.ui.microchart.BulletMicroChartData({
                value: "{value}",
                color: "{color}"
            });

            this.oBCTmpl = new sap.suite.ui.microchart.BulletMicroChart({
                size: sap.m.Size.Auto,
                scale: "{/scale}",
                actual: {
                    value: "{/actual/value}",
                    color: "{/actual/color}"
                },
                targetValue: "{/targetValue}",
                actualValueLabel: "{/actualValueLabel}",
                targetValueLabel: "{/targetValueLabel}",
                thresholds: {
                    template: oBCDataTmpl,
                    path: "/thresholds"
                },
                state: "{/state}",
                showActualValue: "{/showActualValue}",
                showTargetValue: "{/showTargetValue}"
            });

//            var oNVConfS = new sap.suite.ui.commons.TileContent({
//                unit : "{/unit}",
//                size : "{/size}",
//                footer : "{/footerNum}",
//                content: this.oBCTmpl
//            });

            this.oNVConfS = new sap.ushell.components.tiles.sbtilecontent({
                unit : "{/unit}",
                size : "{/size}",
                footer : "{/footerNum}",
                content: this.oBCTmpl
            });

            
            this.oGenericTile = new sap.m.GenericTile({
                subheader : "{/subheader}",
                frameType : "{/frameType}",
                size : "{/size}",
                header : "{/header}",
                tileContent : [this.oNVConfS]
            });

            var oGenericTileModel = new sap.ui.model.json.JSONModel();
            oGenericTileModel.setData(deviationTileData);
            this.oGenericTile.setModel(oGenericTileModel);

            return this.oGenericTile;
        }
    });
}());
