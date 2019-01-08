// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

//Comparison Tile
(function () {
    "use strict";
    /*global jQuery, sap */
    /*jslint nomen: true */

    jQuery.sap.require("sap.ushell.components.tiles.indicatorTileUtils.smartBusinessUtil");
    jQuery.sap.require("sap.ui.model.analytics.odata4analytics");
    sap.ui.getCore().loadLibrary("sap.suite.ui.commons");

    sap.ui.jsview("sap.ushell.components.tiles.indicatorcontribution.ContributionTile", {
        getControllerName: function () {
            return "sap.ushell.components.tiles.indicatorcontribution.ContributionTile";
        },
        createContent: function (oController) {
            this.setHeight('100%');
            this.setWidth('100%');

            var that = this;
            that.tileData;

            that.oGenericTileData = {
//                    subheader : "Lorem Ipsum SubHeader",
//                    header : "Lorem Ipsum Header",
//                    value: 8888,
//                    size: sap.suite.ui.commons.InfoTileSize.Auto,
//                    frameType:"OneByOne",
//                    state: sap.suite.ui.commons.LoadState.Loading,
//                    valueColor:sap.suite.ui.commons.InfoTileValueColor.Error,
//                    indicator: sap.suite.ui.commons.DeviationIndicator.None,
//                    title : "US Profit Margin",
//                    footer : "Current Quarter",
//                    description: "Maximum deviation",
//                    data: [
//                           { title: "Americas", value: 10, color: "Neutral" },
//                           { title: "EMEA", value: 50, color: "Neutral" },
//                           { title: "APAC", value: -20, color: "Neutral" }
//                           ],
            };


            that.oCmprsDataTmpl = new sap.suite.ui.microchart.ComparisonMicroChartData({
                title : "{title}",
                value : "{value}",
                color : "{color}",
                displayValue : "{displayValue}"
            });

            that.oCmprsChrtTmpl = new sap.suite.ui.microchart.ComparisonMicroChart({
                size : "{/size}",
                scale : "{/scale}",
                data : {
                    template : that.oCmprsDataTmpl,
                    path : "/data"
                }
            });
            //oComparisonTile
            that.oNVConfS = new sap.ushell.components.tiles.sbtilecontent({
                unit : "{/unit}",
                size : "{/size}",
                footer : "{/footerComp}",
                content : that.oCmprsChrtTmpl
            });


            that.oGenericTile = new sap.m.GenericTile({
                subheader : "{/subheader}",
                frameType : "{/frameType}",
                size : "{/size}",
                header : "{/header}",
                tileContent : [that.oNVConfS]
            });


            that.oGenericTileModel = new sap.ui.model.json.JSONModel();
            that.oGenericTileModel.setData(that.oGenericTileData);
            that.oGenericTile.setModel(that.oGenericTileModel);

            return that.oGenericTile;


        }
    });
}());
